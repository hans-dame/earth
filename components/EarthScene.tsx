import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';
import { EARTH_TEXTURES } from '../constants';
import { InteractionMode, GestureState, EarthquakeData } from '../types';

// Extend JSX.IntrinsicElements for R3F to resolve TS errors if types aren't picked up automatically
declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      sphereGeometry: any;
      meshPhongMaterial: any;
      meshBasicMaterial: any;
      group: any;
      primitive: any;
      ambientLight: any;
      directionalLight: any;
      spotLight: any;
    }
  }
}

// Utils
const RADIUS = 2;

const latLonToVector3 = (lat: number, lon: number, radius: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
};

interface EarthModelProps {
  gestureState: GestureState;
  interactionMode: InteractionMode;
  onLocationClick: (lat: number, lon: number, position: THREE.Vector3) => void;
  earthquakes: EarthquakeData[];
  showQuakes: boolean;
  timelineYear: number;
}

const EarthModel: React.FC<EarthModelProps> = ({ 
  gestureState, 
  interactionMode, 
  onLocationClick,
  earthquakes,
  showQuakes,
  timelineYear
}) => {
  const earthRef = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  // Load Textures
  const [colorMap, normalMap, specularMap, cloudsMap] = useTexture([
    EARTH_TEXTURES.COLOR_MAP,
    EARTH_TEXTURES.NORMAL_MAP,
    EARTH_TEXTURES.SPECULAR_MAP,
    EARTH_TEXTURES.CLOUDS_MAP,
  ]);

  // Handle Rotation & Timeline Effects
  useFrame((state) => {
    if (earthRef.current) {
      // Base rotation
      earthRef.current.rotation.y += 0.0005;

      if (interactionMode === InteractionMode.GESTURE && gestureState.isPinching) {
        earthRef.current.rotation.y += gestureState.deltaX * 2;
        earthRef.current.rotation.x += gestureState.deltaY * 2;
      }
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.0007;
    }
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (interactionMode !== InteractionMode.MOUSE) return;
    e.stopPropagation();
    
    // Calculate Lat/Lon from point
    const point = e.point.clone().applyMatrix4(earthRef.current!.matrixWorld.clone().invert());
    // Basic mapping for sphere
    const lat = 90 - (Math.acos(point.y / RADIUS) * 180) / Math.PI;
    const lon = ((Math.atan2(point.z, point.x) * 180) / Math.PI); 
    // Correction for standard texture mapping offset
    const correctedLon = -lon - 90; // Adjust based on specific texture alignment

    onLocationClick(lat, correctedLon, e.point);
  };

  // Quake Markers
  const quakeMeshes = useMemo(() => {
    if (!showQuakes) return null;
    return earthquakes.map(quake => {
      const pos = latLonToVector3(quake.coordinates[1], quake.coordinates[0], RADIUS);
      const scale = Math.max(0.02, quake.magnitude * 0.008);
      const color = quake.magnitude > 5 ? '#ff0000' : '#ffaa00';
      return (
        <mesh key={quake.id} position={pos}>
          <sphereGeometry args={[scale, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
      );
    });
  }, [earthquakes, showQuakes]);

  // Timeline Visual Effect (Tint)
  const timelineColor = useMemo(() => {
    if (timelineYear < -50) return new THREE.Color(0.8, 0.9, 1.0); // Ice Age
    if (timelineYear < 0) return new THREE.Color(0.9, 1.0, 0.8); // Lush
    if (timelineYear > 2050) return new THREE.Color(1.0, 0.9, 0.8); // Warming
    return new THREE.Color(1, 1, 1); // Normal
  }, [timelineYear]);

  // Atmosphere Shader
  const atmosphereMaterial = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      void main() {
        float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 3.0);
        gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
      }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false
  }), []);

  return (
    <group ref={earthRef}>
      {/* Main Earth Sphere */}
      <mesh 
        receiveShadow 
        castShadow 
        onPointerDown={handlePointerDown}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <sphereGeometry args={[RADIUS, 64, 64]} />
        <meshPhongMaterial
          map={colorMap}
          specularMap={specularMap}
          normalMap={normalMap}
          specular={new THREE.Color(0x333333)}
          shininess={10}
          color={timelineColor} // Tints the texture
          emissive={new THREE.Color(0x000000)}
        />
      </mesh>

      {/* Cloud Layer */}
      <mesh ref={cloudsRef} scale={[1.015, 1.015, 1.015]}>
        <sphereGeometry args={[RADIUS, 64, 64]} />
        <meshPhongMaterial
          map={cloudsMap}
          transparent={true}
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Atmosphere Glow */}
      <mesh scale={[1.2, 1.2, 1.2]}>
        <sphereGeometry args={[RADIUS, 64, 64]} />
        <primitive object={atmosphereMaterial} attach="material" />
      </mesh>

      {/* Quakes */}
      <group>{quakeMeshes}</group>
    </group>
  );
};

interface EarthSceneProps {
  interactionMode: InteractionMode;
  gestureState: GestureState;
  onLocationClick: (lat: number, lon: number, position: THREE.Vector3) => void;
  earthquakes: EarthquakeData[];
  showQuakes: boolean;
  timelineYear: number;
  selectedPos: THREE.Vector3 | null;
}

const EarthScene: React.FC<EarthSceneProps> = ({ 
  interactionMode, 
  gestureState, 
  onLocationClick,
  earthquakes,
  showQuakes,
  timelineYear,
  selectedPos
}) => {
  return (
    <div className="w-full h-full absolute top-0 left-0 bg-black cursor-crosshair">
      <Canvas shadows camera={{ position: [0, 0, 6], fov: 45 }}>
        {/* Lighting Setup */}
        <ambientLight intensity={0.4} color="#888" /> 
        {/* Sun Light - Main directional light */}
        <directionalLight 
          position={[5, 3, 5]} 
          intensity={2.5} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />
        {/* Rim Light for 3D effect */}
        <spotLight position={[-5, 0, -5]} intensity={1} color="#0044ff" angle={0.5} penumbra={1} />
        
        <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <React.Suspense fallback={null}>
          <EarthModel 
            gestureState={gestureState} 
            interactionMode={interactionMode} 
            onLocationClick={onLocationClick}
            earthquakes={earthquakes}
            showQuakes={showQuakes}
            timelineYear={timelineYear}
          />
        </React.Suspense>
        
        {selectedPos && (
          <mesh position={selectedPos}>
            <sphereGeometry args={[0.04, 16, 16]} />
            <meshBasicMaterial color="#00f3ff" />
            <Html position={[0, 0.1, 0]} center zIndexRange={[100, 0]}>
               <div className="flex flex-col items-center">
                 <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping absolute"></div>
                 <div className="w-2 h-2 bg-cyan-500 rounded-full relative"></div>
                 <div className="w-[1px] h-10 bg-gradient-to-t from-cyan-500/0 via-cyan-500 to-cyan-500/0"></div>
               </div>
            </Html>
          </mesh>
        )}

        {interactionMode === InteractionMode.MOUSE && (
          <OrbitControls 
            enablePan={false} 
            enableZoom={true} 
            minDistance={3} 
            maxDistance={10} 
            rotateSpeed={0.5}
            enableDamping
          />
        )}
      </Canvas>
      
      {/* Visual Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_120%)] z-10" />
      <div className="pointer-events-none absolute inset-0 opacity-10" 
           style={{ backgroundImage: 'linear-gradient(rgba(0, 243, 255, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
      />
    </div>
  );
};

export default EarthScene;
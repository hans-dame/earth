import React, { useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import EarthScene from './components/EarthScene';
import HoloUI from './components/HoloUI';
import HandTracker from './components/HandTracker';
import { InteractionMode, GestureState, EarthFact, EarthquakeData, LocationInfo } from './types';
import { fetchEarthFact, analyzeLocation, fetchHistoricalEra } from './services/geminiService';
import { fetchEarthquakes } from './services/geoService';

const App: React.FC = () => {
  // --- State ---
  const [interactionMode, setInteractionMode] = useState<InteractionMode>(InteractionMode.MOUSE);
  const [gestureState, setGestureState] = useState<GestureState>({
    isPinching: false,
    deltaX: 0,
    deltaY: 0,
    handDetected: false
  });
  
  // Content State
  const [currentFact, setCurrentFact] = useState<EarthFact | null>({
    title: "Planetary System",
    content: "Welcome to HoloEarth. Initiate scan or click on the globe for data.",
    category: "general"
  });
  const [isLoadingFact, setIsLoadingFact] = useState(false);
  
  // Real-time & Interactive State
  const [earthquakes, setEarthquakes] = useState<EarthquakeData[]>([]);
  const [showQuakes, setShowQuakes] = useState(false);
  
  const [timelineYear, setTimelineYear] = useState(2024);
  const [timelineDebounce, setTimelineDebounce] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Selection State
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(null);
  const [isAnalyzingLoc, setIsAnalyzingLoc] = useState(false);
  const [selectedPos, setSelectedPos] = useState<THREE.Vector3 | null>(null);

  // --- Effects ---

  // 1. Initial Load
  useEffect(() => {
    // Fetch Quakes silently on load
    fetchEarthquakes().then(setEarthquakes);
  }, []);

  // 2. Timeline Change Handler (Debounced to avoid API spam)
  useEffect(() => {
    if (Math.abs(timelineYear - 2024) < 5) return; // Ignore near-present

    if (timelineDebounce) clearTimeout(timelineDebounce);

    const timeout = setTimeout(async () => {
      setIsLoadingFact(true);
      const fact = await fetchHistoricalEra(timelineYear);
      setCurrentFact(fact);
      setSelectedLocation(null); // Clear location when time traveling
      setIsLoadingFact(false);
    }, 800);

    setTimelineDebounce(timeout);
    return () => clearTimeout(timeout);
  }, [timelineYear]);

  // --- Handlers ---

  const handleGestureUpdate = useCallback((newState: GestureState) => {
    setGestureState(newState);
  }, []);

  const handleRequestFact = async (topic: string) => {
    setIsLoadingFact(true);
    setSelectedLocation(null); // Clear specific location
    setSelectedPos(null);
    const fact = await fetchEarthFact(topic);
    setCurrentFact(fact);
    setIsLoadingFact(false);
  };

  const handleLocationClick = async (lat: number, lon: number, position: THREE.Vector3) => {
    setSelectedPos(position);
    setIsAnalyzingLoc(true);
    setCurrentFact(null); // Hide general fact
    
    // Fetch data
    const data = await analyzeLocation(lat, lon);
    setSelectedLocation(data);
    setIsAnalyzingLoc(false);
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden font-sans">
      
      {/* 3D Scene Layer */}
      <EarthScene 
        interactionMode={interactionMode} 
        gestureState={gestureState}
        onLocationClick={handleLocationClick}
        earthquakes={earthquakes}
        showQuakes={showQuakes}
        timelineYear={timelineYear}
        selectedPos={selectedPos}
      />

      {/* Hand Tracking Layer */}
      <HandTracker 
        isActive={interactionMode === InteractionMode.GESTURE} 
        onGestureUpdate={handleGestureUpdate} 
      />

      {/* UI Overlay Layer */}
      <HoloUI 
        interactionMode={interactionMode} 
        setInteractionMode={setInteractionMode}
        isLoadingFact={isLoadingFact}
        currentFact={currentFact}
        onRequestFact={handleRequestFact}
        gestureDetected={gestureState.handDetected}
        // New Props
        showQuakes={showQuakes}
        setShowQuakes={setShowQuakes}
        timelineYear={timelineYear}
        setTimelineYear={setTimelineYear}
        selectedLocationInfo={selectedLocation}
        isAnalyzingLocation={isAnalyzingLoc}
      />
      
      {/* Vignette & Scanlines Effect */}
      <div className="pointer-events-none absolute inset-0 z-50 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)]" />
      <div className="pointer-events-none absolute inset-0 z-40 mix-blend-overlay opacity-10 bg-repeat bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAADCAYAAABS3WWCAAAAE0lEQVQIW2NkYGD4zwABjFAAAQB2AAL8/M53AAAAAElFTkSuQmCC')]" />
    </div>
  );
};

export default App;
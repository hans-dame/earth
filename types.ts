export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export enum InteractionMode {
  MOUSE = 'MOUSE',
  GESTURE = 'GESTURE'
}

export interface EarthFact {
  title: string;
  content: string;
  category: 'atmosphere' | 'geology' | 'ocean' | 'general' | 'history' | 'location';
}

export interface GestureState {
  isPinching: boolean;
  deltaX: number;
  deltaY: number;
  handDetected: boolean;
}

export interface EarthquakeData {
  id: string;
  magnitude: number;
  place: string;
  time: number;
  coordinates: [number, number, number]; // Longitude, Latitude, Depth
}

export interface GeoMarker {
  lat: number;
  lon: number;
  label: string;
  type: 'quake' | 'location';
  details?: any;
}

export interface LocationInfo {
  name: string;
  country: string;
  weather: string;
  population: string;
  landmarks: string[];
}

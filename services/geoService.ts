import { EarthquakeData } from "../types";

const USGS_API_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson";

export const fetchEarthquakes = async (): Promise<EarthquakeData[]> => {
  try {
    const response = await fetch(USGS_API_URL);
    const data = await response.json();
    
    return data.features.map((feature: any) => ({
      id: feature.id,
      magnitude: feature.properties.mag,
      place: feature.properties.place,
      time: feature.properties.time,
      coordinates: feature.geometry.coordinates // [lon, lat, depth]
    }));
  } catch (error) {
    console.error("Failed to fetch earthquake data:", error);
    return [];
  }
};
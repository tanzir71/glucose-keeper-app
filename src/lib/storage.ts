import { GlucoseReading } from '@/types/glucose';

const STORAGE_KEY = 'glucose_readings';

export const saveReadings = (readings: GlucoseReading[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
};

export const loadReadings = (): GlucoseReading[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const addReading = (reading: GlucoseReading): GlucoseReading[] => {
  const readings = loadReadings();
  const newReadings = [reading, ...readings];
  saveReadings(newReadings);
  return newReadings;
};

export const deleteReading = (id: string): GlucoseReading[] => {
  const readings = loadReadings();
  const newReadings = readings.filter(r => r.id !== id);
  saveReadings(newReadings);
  return newReadings;
};

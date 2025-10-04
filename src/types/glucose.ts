export interface GlucoseReading {
  id: string;
  value: number; // Always stored in mg/dL
  timestamp: string;
  note?: string;
}

export type GlucoseLevel = 'low' | 'normal' | 'high';
export type GlucoseUnit = 'mmol/L' | 'mg/dL';

// Conversion functions
export const mgdlToMmol = (value: number): number => {
  return parseFloat((value / 18).toFixed(1));
};

export const mmolToMgdl = (value: number): number => {
  return Math.round(value * 18);
};

export const convertValue = (value: number, toUnit: GlucoseUnit): number => {
  if (toUnit === 'mmol/L') {
    return mgdlToMmol(value);
  }
  return value;
};

export const getGlucoseLevel = (value: number): GlucoseLevel => {
  // Using mg/dL thresholds
  if (value < 70) return 'low';
  if (value > 180) return 'high';
  return 'normal';
};

export const getLevelColor = (level: GlucoseLevel): string => {
  switch (level) {
    case 'low':
      return 'text-warning';
    case 'high':
      return 'text-destructive';
    default:
      return 'text-success';
  }
};

export const getLevelBgColor = (level: GlucoseLevel): string => {
  switch (level) {
    case 'low':
      return 'bg-warning/10';
    case 'high':
      return 'bg-destructive/10';
    default:
      return 'bg-success/10';
  }
};

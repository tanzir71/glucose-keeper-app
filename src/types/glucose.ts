export interface GlucoseReading {
  id: string;
  value: number;
  timestamp: string;
  note?: string;
}

export type GlucoseLevel = 'low' | 'normal' | 'high';

export const getGlucoseLevel = (value: number): GlucoseLevel => {
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

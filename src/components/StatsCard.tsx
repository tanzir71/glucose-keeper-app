import { Card } from '@/components/ui/card';
import { GlucoseReading, GlucoseUnit, getGlucoseLevel, convertValue } from '@/types/glucose';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface StatsCardProps {
  readings: GlucoseReading[];
  selectedDate: Date;
  unit: GlucoseUnit;
}

export const StatsCard = ({ readings, selectedDate, unit }: StatsCardProps) => {
  // Filter readings for selected date
  const filteredReadings = readings.filter(reading => {
    const readingDate = new Date(reading.timestamp);
    return readingDate.toDateString() === selectedDate.toDateString();
  });

  if (filteredReadings.length === 0) {
    return null;
  }

  const values = filteredReadings.map(r => r.value);
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  const lowCount = filteredReadings.filter(r => getGlucoseLevel(r.value) === 'low').length;
  const normalCount = filteredReadings.filter(r => getGlucoseLevel(r.value) === 'normal').length;
  const highCount = filteredReadings.filter(r => getGlucoseLevel(r.value) === 'high').length;

  return (
    <Card className="p-6 bg-gradient-card shadow-custom-md">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Today's Statistics</h3>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center text-info mb-1">
            <Activity className="h-5 w-5" />
          </div>
          <div className="text-2xl font-bold text-foreground">{convertValue(average, unit).toFixed(1)}</div>
          <div className="text-xs text-muted-foreground">Average</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center text-success mb-1">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div className="text-2xl font-bold text-foreground">{convertValue(min, unit)}</div>
          <div className="text-xs text-muted-foreground">Lowest</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center text-destructive mb-1">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="text-2xl font-bold text-foreground">{convertValue(max, unit)}</div>
          <div className="text-xs text-muted-foreground">Highest</div>
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-border">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Low {unit === 'mmol/L' ? '(<3.9)' : '(<70)'}</span>
          <span className="font-medium text-warning">{lowCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Normal {unit === 'mmol/L' ? '(3.9-10)' : '(70-180)'}</span>
          <span className="font-medium text-success">{normalCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">High {unit === 'mmol/L' ? '(>10)' : '(>180)'}</span>
          <span className="font-medium text-destructive">{highCount}</span>
        </div>
      </div>
    </Card>
  );
};

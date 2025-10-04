import { Card } from '@/components/ui/card';
import { GlucoseReading, getGlucoseLevel } from '@/types/glucose';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface StatsCardProps {
  readings: GlucoseReading[];
}

export const StatsCard = ({ readings }: StatsCardProps) => {
  if (readings.length === 0) {
    return null;
  }

  const values = readings.map(r => r.value);
  const average = values.reduce((a, b) => a + b, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  const lowCount = readings.filter(r => getGlucoseLevel(r.value) === 'low').length;
  const normalCount = readings.filter(r => getGlucoseLevel(r.value) === 'normal').length;
  const highCount = readings.filter(r => getGlucoseLevel(r.value) === 'high').length;

  return (
    <Card className="p-6 bg-gradient-card shadow-custom-md">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Statistics</h3>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center text-info mb-1">
            <Activity className="h-5 w-5" />
          </div>
          <div className="text-2xl font-bold text-foreground">{average.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground">Average</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center text-success mb-1">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div className="text-2xl font-bold text-foreground">{min}</div>
          <div className="text-xs text-muted-foreground">Lowest</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center text-destructive mb-1">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="text-2xl font-bold text-foreground">{max}</div>
          <div className="text-xs text-muted-foreground">Highest</div>
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-border">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Low (&lt;70)</span>
          <span className="font-medium text-warning">{lowCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Normal (70-180)</span>
          <span className="font-medium text-success">{normalCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">High (&gt;180)</span>
          <span className="font-medium text-destructive">{highCount}</span>
        </div>
      </div>
    </Card>
  );
};

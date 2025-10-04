import { GlucoseReading } from '@/types/glucose';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface GlucoseChartProps {
  readings: GlucoseReading[];
}

export const GlucoseChart = ({ readings }: GlucoseChartProps) => {
  if (readings.length === 0) {
    return null;
  }

  const data = [...readings]
    .reverse()
    .slice(-20)
    .map(r => ({
      time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: r.value
    }));

  return (
    <Card className="p-6 bg-gradient-card shadow-custom-md">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Glucose Trend</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="time" 
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis 
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            domain={[0, 250]}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }}
          />
          <ReferenceLine y={70} stroke="hsl(var(--warning))" strokeDasharray="3 3" />
          <ReferenceLine y={180} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="hsl(var(--primary))" 
            strokeWidth={3}
            dot={{ fill: 'hsl(var(--primary))', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4 flex gap-4 text-xs text-muted-foreground justify-center flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-warning"></div>
          <span>Low (70 mg/dL)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-destructive"></div>
          <span>High (180 mg/dL)</span>
        </div>
      </div>
    </Card>
  );
};

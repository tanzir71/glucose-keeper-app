import { GlucoseReading, GlucoseUnit, getGlucoseLevel, getLevelColor, getLevelBgColor, convertValue } from '@/types/glucose';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { deleteReading } from '@/lib/storage';

interface ReadingsListProps {
  readings: GlucoseReading[];
  selectedDate: Date;
  unit: GlucoseUnit;
  onReadingsUpdate: (readings: GlucoseReading[]) => void;
}

export const ReadingsList = ({ readings, selectedDate, unit, onReadingsUpdate }: ReadingsListProps) => {
  const handleDelete = (id: string) => {
    const newReadings = deleteReading(id);
    onReadingsUpdate(newReadings);
  };

  // Filter readings for selected date
  const filteredReadings = readings.filter(reading => {
    const readingDate = new Date(reading.timestamp);
    return readingDate.toDateString() === selectedDate.toDateString();
  });

  if (filteredReadings.length === 0) {
    return (
      <Card className="p-8 text-center bg-gradient-card">
        <p className="text-muted-foreground">No readings for this date. Add your first glucose reading above.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {filteredReadings.map((reading) => {
        const date = new Date(reading.timestamp);
        const level = getGlucoseLevel(reading.value);
        const levelColor = getLevelColor(level);
        const levelBg = getLevelBgColor(level);
        const displayValue = convertValue(reading.value, unit);

        return (
          <Card key={reading.id} className="p-4 bg-gradient-card shadow-custom-sm hover:shadow-custom-md transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className={`text-3xl font-bold ${levelColor}`}>
                    {displayValue}
                  </span>
                  <span className="text-sm text-muted-foreground">{unit}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelBg} ${levelColor}`}>
                    {level.toUpperCase()}
                  </span>
                </div>
                
                <div className="mt-2 text-sm text-muted-foreground">
                  <div>{date.toLocaleTimeString()}</div>
                  {reading.note && (
                    <div className="mt-1 text-foreground">{reading.note}</div>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(reading.id)}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

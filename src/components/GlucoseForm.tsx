import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { GlucoseReading, GlucoseUnit, mmolToMgdl } from '@/types/glucose';
import { addReading } from '@/lib/storage';

interface GlucoseFormProps {
  selectedDate: Date;
  unit: GlucoseUnit;
  onReadingAdded: (readings: GlucoseReading[]) => void;
}

export const GlucoseForm = ({ selectedDate, unit, onReadingAdded }: GlucoseFormProps) => {
  const [value, setValue] = useState('');
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const glucoseValue = parseFloat(value);
    if (isNaN(glucoseValue) || glucoseValue <= 0) {
      return;
    }

    // Convert to mg/dL for storage if needed
    const valueInMgdl = unit === 'mmol/L' ? mmolToMgdl(glucoseValue) : glucoseValue;

    // Create timestamp from selected date and time
    const [hours, minutes] = time.split(':').map(Number);
    const timestamp = new Date(selectedDate);
    timestamp.setHours(hours, minutes, 0, 0);

    const reading: GlucoseReading = {
      id: Date.now().toString(),
      value: valueInMgdl,
      timestamp: timestamp.toISOString(),
      note: note.trim() || undefined
    };

    const newReadings = addReading(reading);
    onReadingAdded(newReadings);
    
    setValue('');
    setNote('');
    // Reset time to current time
    const now = new Date();
    setTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
  };

  return (
    <Card className="p-6 bg-gradient-card shadow-custom-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="glucose" className="block text-sm font-medium mb-2 text-foreground">
              Glucose Level ({unit})
            </label>
            <Input
              id="glucose"
              type="number"
              step={unit === 'mmol/L' ? '0.1' : '1'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={unit === 'mmol/L' ? '5.5' : '100'}
              className="text-lg h-12"
              required
            />
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium mb-2 text-foreground">
              Time
            </label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="text-lg h-12"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="note" className="block text-sm font-medium mb-2 text-foreground">
            Note (Optional)
          </label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (e.g., before meal, after exercise)"
            className="resize-none"
            rows={2}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 text-base bg-gradient-primary hover:opacity-90 transition-opacity"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Reading
        </Button>
      </form>
    </Card>
  );
};

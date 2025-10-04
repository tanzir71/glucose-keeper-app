import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { GlucoseReading } from '@/types/glucose';
import { addReading } from '@/lib/storage';

interface GlucoseFormProps {
  onReadingAdded: (readings: GlucoseReading[]) => void;
}

export const GlucoseForm = ({ onReadingAdded }: GlucoseFormProps) => {
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const glucoseValue = parseFloat(value);
    if (isNaN(glucoseValue) || glucoseValue <= 0) {
      return;
    }

    const reading: GlucoseReading = {
      id: Date.now().toString(),
      value: glucoseValue,
      timestamp: new Date().toISOString(),
      note: note.trim() || undefined
    };

    const newReadings = addReading(reading);
    onReadingAdded(newReadings);
    
    setValue('');
    setNote('');
  };

  return (
    <Card className="p-6 bg-gradient-card shadow-custom-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="glucose" className="block text-sm font-medium mb-2 text-foreground">
            Glucose Level (mg/dL)
          </label>
          <Input
            id="glucose"
            type="number"
            step="0.1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter glucose reading"
            className="text-lg h-12"
            required
          />
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

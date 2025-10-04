import { useState, useEffect } from 'react';
import { GlucoseReading } from '@/types/glucose';
import { loadReadings } from '@/lib/storage';
import { GlucoseForm } from '@/components/GlucoseForm';
import { ReadingsList } from '@/components/ReadingsList';
import { GlucoseChart } from '@/components/GlucoseChart';
import { ExportButtons } from '@/components/ExportButtons';
import { StatsCard } from '@/components/StatsCard';
import { Droplet } from 'lucide-react';

const Index = () => {
  const [readings, setReadings] = useState<GlucoseReading[]>([]);

  useEffect(() => {
    setReadings(loadReadings());
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-primary text-primary-foreground py-6 px-4 shadow-custom-md">
        <div className="container max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Droplet className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Glucose Tracker</h1>
              <p className="text-sm text-primary-foreground/90">Monitor your blood sugar levels</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <GlucoseForm onReadingAdded={setReadings} />
        
        <StatsCard readings={readings} />
        
        <GlucoseChart readings={readings} />
        
        <ExportButtons readings={readings} />
        
        <div>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Recent Readings</h2>
          <ReadingsList readings={readings} onReadingsUpdate={setReadings} />
        </div>
      </main>
    </div>
  );
};

export default Index;

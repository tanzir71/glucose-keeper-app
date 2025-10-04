import { useState, useEffect } from 'react';
import { GlucoseReading, GlucoseUnit } from '@/types/glucose';
import { loadReadings, loadUnit, saveUnit } from '@/lib/storage';
import { GlucoseForm } from '@/components/GlucoseForm';
import { ReadingsList } from '@/components/ReadingsList';
import { GlucoseChart } from '@/components/GlucoseChart';
import { ExportButtons } from '@/components/ExportButtons';
import { StatsCard } from '@/components/StatsCard';
import { DateSelector } from '@/components/DateSelector';
import { UnitSwitcher } from '@/components/UnitSwitcher';
import { Droplet } from 'lucide-react';

const Index = () => {
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [unit, setUnit] = useState<GlucoseUnit>('mmol/L');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  useEffect(() => {
    setReadings(loadReadings());
    setUnit(loadUnit());
  }, []);

  const handleUnitChange = (newUnit: GlucoseUnit) => {
    setUnit(newUnit);
    saveUnit(newUnit);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-primary text-primary-foreground py-6 px-4 shadow-custom-md sticky top-0 z-10">
        <div className="container max-w-2xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Droplet className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Glucose Tracker</h1>
                <p className="text-sm text-primary-foreground/90">Monitor your blood sugar</p>
              </div>
            </div>
            <UnitSwitcher unit={unit} onUnitChange={handleUnitChange} />
          </div>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
        
        <GlucoseForm 
          selectedDate={selectedDate} 
          unit={unit} 
          onReadingAdded={setReadings} 
        />
        
        <StatsCard 
          readings={readings} 
          selectedDate={selectedDate} 
          unit={unit} 
        />
        
        <GlucoseChart 
          readings={readings} 
          selectedDate={selectedDate} 
          unit={unit} 
        />
        
        <ExportButtons readings={readings} unit={unit} />
        
        <div>
          <h2 className="text-xl font-semibold mb-4 text-foreground">
            Readings for {selectedDate.toLocaleDateString()}
          </h2>
          <ReadingsList 
            readings={readings} 
            selectedDate={selectedDate} 
            unit={unit} 
            onReadingsUpdate={setReadings} 
          />
        </div>
      </main>
    </div>
  );
};

export default Index;

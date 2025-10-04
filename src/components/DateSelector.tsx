import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export const DateSelector = ({ selectedDate, onDateChange }: DateSelectorProps) => {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Generate 7 days (3 before, today, 3 after)
  for (let i = -3; i <= 3; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }

  const scrollToEarlier = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);
    onDateChange(newDate);
  };

  const scrollToLater = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);
    onDateChange(newDate);
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={scrollToEarlier}
        className="shrink-0"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1">
        {dates.map((date, index) => (
          <button
            key={index}
            onClick={() => onDateChange(date)}
            className={`shrink-0 flex flex-col items-center justify-center p-2 rounded-lg min-w-[60px] transition-all ${
              isSelected(date)
                ? 'bg-primary text-primary-foreground shadow-custom-md'
                : 'bg-card hover:bg-muted'
            }`}
          >
            <span className="text-xs font-medium">
              {date.toLocaleDateString('en-US', { weekday: 'short' })}
            </span>
            <span className={`text-lg font-bold ${isToday(date) && !isSelected(date) ? 'text-primary' : ''}`}>
              {date.getDate()}
            </span>
            <span className="text-xs opacity-70">
              {date.toLocaleDateString('en-US', { month: 'short' })}
            </span>
          </button>
        ))}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={scrollToLater}
        className="shrink-0"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
};

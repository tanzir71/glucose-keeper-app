import { GlucoseUnit } from '@/types/glucose';
import { Button } from '@/components/ui/button';

interface UnitSwitcherProps {
  unit: GlucoseUnit;
  onUnitChange: (unit: GlucoseUnit) => void;
}

export const UnitSwitcher = ({ unit, onUnitChange }: UnitSwitcherProps) => {
  return (
    <div className="flex gap-1 bg-muted p-1 rounded-lg">
      <Button
        variant={unit === 'mmol/L' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onUnitChange('mmol/L')}
        className="text-xs h-8 transition-all"
      >
        mmol/L
      </Button>
      <Button
        variant={unit === 'mg/dL' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onUnitChange('mg/dL')}
        className="text-xs h-8 transition-all"
      >
        mg/dL
      </Button>
    </div>
  );
};

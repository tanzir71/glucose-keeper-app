import { Button } from '@/components/ui/button';
import { FileText, FileSpreadsheet } from 'lucide-react';
import { GlucoseReading } from '@/types/glucose';
import { exportToCSV, exportToPDF } from '@/lib/export';
import { toast } from 'sonner';

interface ExportButtonsProps {
  readings: GlucoseReading[];
}

export const ExportButtons = ({ readings }: ExportButtonsProps) => {
  const handleExportPDF = () => {
    if (readings.length === 0) {
      toast.error('No readings to export');
      return;
    }
    exportToPDF(readings);
    toast.success('PDF exported successfully');
  };

  const handleExportCSV = () => {
    if (readings.length === 0) {
      toast.error('No readings to export');
      return;
    }
    exportToCSV(readings);
    toast.success('CSV exported successfully');
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <Button 
        variant="outline" 
        onClick={handleExportPDF}
        disabled={readings.length === 0}
        className="h-12"
      >
        <FileText className="mr-2 h-4 w-4" />
        Export PDF
      </Button>
      <Button 
        variant="outline" 
        onClick={handleExportCSV}
        disabled={readings.length === 0}
        className="h-12"
      >
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Export CSV
      </Button>
    </div>
  );
};

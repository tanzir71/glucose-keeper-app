import { GlucoseReading, GlucoseUnit, getGlucoseLevel, convertValue } from '@/types/glucose';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToCSV = (readings: GlucoseReading[], unit: GlucoseUnit): void => {
  const headers = ['Date', 'Time', `Glucose (${unit})`, 'Level', 'Note'];
  const rows = readings.map(r => {
    const date = new Date(r.timestamp);
    const level = getGlucoseLevel(r.value);
    const displayValue = convertValue(r.value, unit);
    return [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      displayValue.toString(),
      level.toUpperCase(),
      r.note || ''
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `glucose-readings-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (readings: GlucoseReading[], unit: GlucoseUnit): void => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(33, 150, 243);
  doc.text('Blood Glucose Readings', 14, 20);
  
  // Date range
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
  
  // Statistics
  const values = readings.map(r => r.value);
  const avgMgdl = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const avg = convertValue(avgMgdl, unit).toFixed(1);
  const minMgdl = values.length > 0 ? Math.min(...values) : 0;
  const min = convertValue(minMgdl, unit);
  const maxMgdl = values.length > 0 ? Math.max(...values) : 0;
  const max = convertValue(maxMgdl, unit);
  
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text(`Total Readings: ${readings.length}`, 14, 38);
  doc.text(`Average: ${avg} ${unit}`, 14, 45);
  doc.text(`Range: ${min} - ${max} ${unit}`, 14, 52);
  
  // Group readings by date
  const readingsByDate = new Map<string, GlucoseReading[]>();
  readings.forEach(r => {
    const date = new Date(r.timestamp).toLocaleDateString();
    if (!readingsByDate.has(date)) {
      readingsByDate.set(date, []);
    }
    readingsByDate.get(date)!.push(r);
  });

  // Sort dates
  const sortedDates = Array.from(readingsByDate.keys()).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  let startY = 60;
  
  sortedDates.forEach((dateStr, index) => {
    const dayReadings = readingsByDate.get(dateStr)!;
    
    // Add page break if needed
    if (startY > 250) {
      doc.addPage();
      startY = 20;
    }
    
    // Date header
    doc.setFontSize(12);
    doc.setTextColor(33, 150, 243);
    doc.text(dateStr, 14, startY);
    startY += 8;
    
    const tableData = dayReadings.map(r => {
      const time = new Date(r.timestamp).toLocaleTimeString();
      const level = getGlucoseLevel(r.value);
      const displayValue = convertValue(r.value, unit);
      return [
        time,
        displayValue.toFixed(unit === 'mmol/L' ? 1 : 0),
        level.toUpperCase(),
        r.note || '-'
      ];
    });
    
    autoTable(doc, {
      startY: startY,
      head: [['Time', `Glucose (${unit})`, 'Level', 'Note']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [33, 150, 243],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 2
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 35, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 'auto' }
      },
      margin: { left: 14 }
    });
    
    startY = (doc as any).lastAutoTable.finalY + 10;
  });
  
  doc.save(`glucose-readings-${new Date().toISOString().split('T')[0]}.pdf`);
};

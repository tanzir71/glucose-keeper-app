import { GlucoseReading, getGlucoseLevel } from '@/types/glucose';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToCSV = (readings: GlucoseReading[]): void => {
  const headers = ['Date', 'Time', 'Glucose (mg/dL)', 'Level', 'Note'];
  const rows = readings.map(r => {
    const date = new Date(r.timestamp);
    const level = getGlucoseLevel(r.value);
    return [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      r.value.toString(),
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

export const exportToPDF = (readings: GlucoseReading[]): void => {
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
  const avg = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '0';
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 0;
  
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text(`Total Readings: ${readings.length}`, 14, 38);
  doc.text(`Average: ${avg} mg/dL`, 14, 45);
  doc.text(`Range: ${min} - ${max} mg/dL`, 14, 52);
  
  // Table
  const tableData = readings.map(r => {
    const date = new Date(r.timestamp);
    const level = getGlucoseLevel(r.value);
    return [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      r.value,
      level.toUpperCase(),
      r.note || '-'
    ];
  });
  
  autoTable(doc, {
    startY: 60,
    head: [['Date', 'Time', 'Glucose (mg/dL)', 'Level', 'Note']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [33, 150, 243],
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 30 },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 'auto' }
    }
  });
  
  doc.save(`glucose-readings-${new Date().toISOString().split('T')[0]}.pdf`);
};

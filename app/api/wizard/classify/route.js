// app/api/wizard/classify/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { columns, previewData, selectedColumns } = await request.json();
    
    const classification = {};
    
    // Auto-classify based on data patterns
    columns.forEach(column => {
      if (column === selectedColumns.target) return;
      if (column === selectedColumns.date) return;
      if (column === selectedColumns.level) return;
      
      // Sample values for classification
      const sampleValues = previewData.map(row => row[column]).filter(val => val != null);
      
      if (sampleValues.length === 0) {
        classification[column] = 'categorical';
        return;
      }
      
      // Check if numeric
      const numericValues = sampleValues.filter(val => !isNaN(val) && val !== '');
      if (numericValues.length / sampleValues.length > 0.8) {
        classification[column] = 'numeric';
      } else {
        classification[column] = 'categorical';
      }
    });
    
    return NextResponse.json({ classification });
  } catch (error) {
    return NextResponse.json({ error: 'Classification failed' }, { status: 500 });
  }
}
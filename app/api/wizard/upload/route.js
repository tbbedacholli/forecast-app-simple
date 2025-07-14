// app/api/wizard/upload/route.js
import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';
import Papa from 'papaparse';

export async function POST(request) {
  try {
    const data = await request.formData();
    const file = data.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file received' }, { status: 400 });
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Please upload a CSV file' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const csvContent = buffer.toString('utf8');

    // Save file to uploads directory
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${Date.now()}_${file.name}`;
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Parse CSV using Papa Parse
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => results,
      error: (error) => {
        console.error('CSV parsing error:', error);
        throw new Error('Failed to parse CSV file');
      }
    });

    if (parseResult.errors.length > 0) {
      console.error('CSV parsing errors:', parseResult.errors);
      return NextResponse.json({ 
        error: 'CSV parsing failed: ' + parseResult.errors[0].message 
      }, { status: 400 });
    }

    const { data: rows, meta } = parseResult;
    
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    // Get column names from the first row
    const columns = meta.fields || Object.keys(rows[0]);
    
    // Get preview data (first 10 rows)
    const preview = rows.slice(0, 10);
    
    // Total rows count
    const totalRows = rows.length;

    return NextResponse.json({
      filename,
      columns,
      preview,
      totalRows,
      success: true
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Upload failed: ' + error.message 
    }, { status: 500 });
  }
}
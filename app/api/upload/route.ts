import { NextRequest, NextResponse } from 'next/server';
import * as xlsx from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read the file as an array buffer
    const buffer = await file.arrayBuffer();
    
    // Parse the buffer with xlsx
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert the sheet to JSON
    // header: 1 gives us an array of arrays
    const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (!rawData || rawData.length === 0) {
      return NextResponse.json(
        { error: 'Empty Excel file' },
        { status: 400 }
      );
    }

    // Assume first row is headers
    const headers = rawData[0].map(h => String(h).toLowerCase().trim());
    
    // Find column indexes
    const nameIndex = headers.findIndex(h => h.includes('name'));
    const emailIndex = headers.findIndex(h => h.includes('email'));
    const phoneIndex = headers.findIndex(h => h.includes('phone') || h.includes('number'));

    if (nameIndex === -1 && emailIndex === -1 && phoneIndex === -1) {
       return NextResponse.json(
        { error: 'Could not find Name, Email, or Phone columns in the file headers.' },
        { status: 400 }
      );
    }

    const extractedData = [];

    // Start from row 1 (skipping header)
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      // Skip empty rows
      if (!row || row.length === 0) continue;

      const name = nameIndex !== -1 ? row[nameIndex] : undefined;
      const email = emailIndex !== -1 ? row[emailIndex] : undefined;
      const phone = phoneIndex !== -1 ? row[phoneIndex] : undefined;

      // Only add if at least one field has data
      if (name || email || phone) {
        extractedData.push({
          name: name ? String(name).trim() : '',
          email: email ? String(email).trim() : '',
          phone: phone ? String(phone).trim() : '',
        });
      }
    }

    return NextResponse.json({ data: extractedData });
  } catch (error) {
    console.error('Error processing Excel file:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    // CSV 파일 읽기
    const csvPath = join(process.cwd(), '거래처.csv');
    const csvContent = await readFile(csvPath, 'utf-8');

    const lines = csvContent.split('\n');
    const vendors = [];

    // CSV 파싱 (헤더 스킵)
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith(',') || line.includes('2025/11/03')) continue;

      const columns = line.split(',').map(col => col.replace(/"/g, '').trim());

      if (columns.length >= 3 && columns[0] && columns[1]) {
        vendors.push({
          code: columns[0],
          name: columns[1],
          ceo: columns[2] || '',
          phone: columns[3] || '',
          mobile: columns[4] || ''
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: vendors.length,
      vendors: vendors.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    });

  } catch (error) {
    console.error('Vendors API Error:', error);
    return NextResponse.json(
      { error: 'Failed to load vendors data', success: false },
      { status: 500 }
    );
  }
}
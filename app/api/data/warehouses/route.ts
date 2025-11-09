import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    // CSV 파일 읽기
    const csvPath = join(process.cwd(), '창고.csv');
    const csvContent = await readFile(csvPath, 'utf-8');

    const lines = csvContent.split('\n');
    const warehouses = [];

    // CSV 파싱 (헤더 스킵)
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith(',') || line.includes('2025/11/03')) continue;

      const columns = line.split(',').map(col => col.replace(/"/g, '').trim());

      if (columns.length >= 3 && columns[0] && columns[1]) {
        warehouses.push({
          code: columns[0],
          name: columns[1],
          type: columns[2] || '',
          process: columns[3] || '',
          vendor: columns[4] || '',
          isActive: columns[5] === 'Yes',
          business: columns[6] || ''
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: warehouses.length,
      warehouses: warehouses.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    });

  } catch (error) {
    console.error('Warehouses API Error:', error);
    return NextResponse.json(
      { error: 'Failed to load warehouses data', success: false },
      { status: 500 }
    );
  }
}
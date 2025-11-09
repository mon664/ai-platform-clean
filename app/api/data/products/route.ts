import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    // CSV 파일 읽기
    const csvPath = join(process.cwd(), '품목.csv');
    const csvContent = await readFile(csvPath, 'utf-8');

    const lines = csvContent.split('\n');
    const products = [];

    // CSV 파싱 (헤더 스킵)
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith(',') || line.includes('2025/11/03')) continue;

      const columns = line.split(',').map(col => col.replace(/"/g, '').trim());

      if (columns.length >= 3 && columns[0] && columns[1]) {
        // 가격 정보 찾기 (보통 뒤쪽 컬럼에 있음)
        let price = '10000'; // 기본 가격
        for (let j = 5; j < columns.length; j++) {
          const col = columns[j].replace(/,/g, '').replace(/원/g, '');
          if (col && /^\d+$/.test(col) && parseInt(col) > 0) {
            price = col;
            break;
          }
        }

        products.push({
          code: columns[0],
          name: columns[1],
          type: columns[2] || '',
          spec: columns[3] || '',
          group: columns[4] || '',
          price: price
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: products.length,
      products: products.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    });

  } catch (error) {
    console.error('Products API Error:', error);
    return NextResponse.json(
      { error: 'Failed to load products data', success: false },
      { status: 500 }
    );
  }
}
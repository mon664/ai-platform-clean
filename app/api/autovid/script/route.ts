import { NextRequest, NextResponse } from 'next/server';

const RAILWAY_API = process.env.NEXT_PUBLIC_RAILWAY_API_URL || 
  'https://autoblog-python-production.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const { subject, requestNumber = 5, requestLanguage = 'ko-KR' } = await request.json();

    if (!subject?.trim()) {
      return NextResponse.json(
        { success: false, error: '주제를 입력하세요' },
        { status: 400 }
      );
    }

    // Railway 백엔드로 프록시
    const response = await fetch(`${RAILWAY_API}/api/autovid/script`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject,
        requestNumber,
        requestLanguage
      })
    });

    if (!response.ok) {
      throw new Error(`Railway API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('Script generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

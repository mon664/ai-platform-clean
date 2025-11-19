import { NextRequest, NextResponse } from 'next/server';

const WEBDAV_API = 'https://rausu.infini-cloud.net/dav/autoblog/code/api_server.py';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${WEBDAV_API}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from('hhsta:6949689qQ@@').toString('base64')
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`WebDAV API error: ${response.status}`);
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

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, style, duration } = body;

    // Direct Gemini API integration
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Create a YouTube script about "${topic}" in ${style || 'engaging'} style for ${duration || '5-10'} minutes. Format as JSON with title, scenes array, and total duration.`
          }]
        }]
      })
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const scriptText = geminiData.candidates[0].content.parts[0].text;

    return NextResponse.json({
      success: true,
      data: {
        script: scriptText,
        topic,
        style,
        generated: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Script generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

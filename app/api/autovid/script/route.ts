import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic = 'AI technology', style = 'engaging', duration = '5-10' } = body;

    // Simple script generation (without API dependency for testing)
    const scriptData = {
      title: `${topic} - A ${style} YouTube Video`,
      duration: `${duration} minutes`,
      scenes: [
        {
          scene_number: 1,
          title: "Introduction",
          content: `Welcome to our ${style} video about ${topic}!`
        },
        {
          scene_number: 2,
          title: "Main Content",
          content: `Let's explore the fascinating world of ${topic} in detail.`
        },
        {
          scene_number: 3,
          title: "Conclusion",
          content: `Thank you for watching our ${style} video about ${topic}!`
        }
      ],
      generated: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: scriptData
    });

  } catch (error: any) {
    console.error('Script generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unknown error occurred',
        details: error.stack
      },
      { status: 500 }
    );
  }
}

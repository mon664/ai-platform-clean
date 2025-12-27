import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/video/veo/status
 * Poll Veo video generation status
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const operation = searchParams.get('operation');

    if (!operation) {
      return NextResponse.json(
        { error: 'Operation parameter is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.VERTEX_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'VERTEX_AI_API_KEY or GEMINI_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Poll the operation status
    const response = await fetch(`https://aistudio.googleapis.com/v1beta/${operation}?key=${apiKey}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Veo Status] Error:', response.status, errorText);
      return NextResponse.json(
        { error: `Failed to poll status: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Check if video generation is complete
    if (data.done) {
      if (data.response?.videoUri) {
        return NextResponse.json({
          success: true,
          done: true,
          videoUrl: data.response.videoUri
        });
      } else if (data.error) {
        return NextResponse.json({
          success: false,
          done: true,
          error: data.error.message
        }, { status: 500 });
      }
    }

    // Still processing
    return NextResponse.json({
      success: true,
      done: false,
      metadata: data.metadata
    });

  } catch (error: any) {
    console.error('[Veo Status] Exception:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to poll video status' },
      { status: 500 }
    );
  }
}

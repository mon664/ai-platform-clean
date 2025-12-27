import { NextRequest, NextResponse } from 'next/server';

// Vertex AI Veo 3.1 API Configuration
const VEO_CONFIG = {
  endpoint: 'https://aistudio.googleapis.com/v1beta/models/veo-2.0-generate-001:predictLongRunning',
  // Alternative: Vertex AI endpoint
  // endpoint: 'https://us-central1-aiplatform.googleapis.com/v1/projects/{PROJECT}/locations/us-central1/publishers/google/models/veo-3.1-generate-preview:predictLongRunning'
};

interface VeoGenerateRequest {
  prompt: string;
  aspectRatio?: 'portrait' | 'landscape' | 'square';
  duration?: number;
  resolution?: '720p' | '1080p';
  seed?: number;
}

interface VeoResponse {
  name: string;
  done: boolean;
  response?: {
    videoUri?: string;
    videoData?: string;
  };
  error?: {
    code: number;
    message: string;
  };
}

/**
 * POST /api/video/veo/generate
 * Generate video using Google Veo 2.0/3.1
 */
export async function POST(request: NextRequest) {
  try {
    const body: VeoGenerateRequest = await request.json();
    const {
      prompt,
      aspectRatio = 'portrait',
      duration = 4,
      resolution = '1080p',
      seed
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
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

    // Aspect ratio mapping for Veo
    const aspectRatioMap: Record<string, string> = {
      portrait: '9:16',
      landscape: '16:9',
      square: '1:1'
    };

    // Build request body for Veo API
    const veoRequest = {
      prompt: prompt,
      durationSeconds: duration,
      aspectRatio: aspectRatioMap[aspectRatio] || '9:16',
      resolution: resolution,
      personGeneration: 'allow_adult' // or 'dont_allow'
    };

    console.log('[Veo API] Request:', JSON.stringify(veoRequest, null, 2));

    // Call Veo API
    const response = await fetch(`${VEO_CONFIG.endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(veoRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Veo API] Error:', response.status, errorText);
      return NextResponse.json(
        { error: `Veo API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data: VeoResponse = await response.json();
    console.log('[Veo API] Response:', JSON.stringify(data, null, 2));

    // Veo returns a long-running operation
    if (data.name) {
      // Return the operation name for polling
      return NextResponse.json({
        success: true,
        operationName: data.name,
        done: data.done,
        message: 'Video generation started. Poll for results.',
        pollUrl: `/api/video/veo/status?operation=${encodeURIComponent(data.name)}`
      });
    }

    // If already done (rare case)
    if (data.done && data.response?.videoUri) {
      return NextResponse.json({
        success: true,
        videoUrl: data.response.videoUri,
        done: true
      });
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('[Veo API] Exception:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate video with Veo' },
      { status: 500 }
    );
  }
}

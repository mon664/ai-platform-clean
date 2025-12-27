import { NextRequest, NextResponse } from 'next/server';

// Mock Hugging Face Spaces API for testing
export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();

    if (!data || !data[0]) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    const [prompt, negativePrompt, guidanceScale, seed, width, height, steps, model] = data;

    console.log('Mock HF API called with:', {
      prompt,
      negativePrompt,
      guidanceScale,
      seed,
      width,
      height,
      steps,
      model
    });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock image URL using Picsum with parameters
    const mockImageUrl = `https://picsum.photos/${width}/${height}?random=${seed || Date.now()}`;

    // Mock Hugging Face response format
    const mockResponse = {
      data: [mockImageUrl],
      duration: 2.0,
      average_duration: 2.1
    };

    return NextResponse.json(mockResponse);

  } catch (error: any) {
    console.error('Mock HF API error:', error);
    return NextResponse.json(
      { error: error.message || 'Mock API error' },
      { status: 500 }
    );
  }
}
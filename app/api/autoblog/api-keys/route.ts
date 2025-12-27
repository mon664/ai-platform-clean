import { NextRequest, NextResponse } from 'next/server';
import { loadApiKeys, saveApiKeys } from '@/lib/autoblog/gcs-storage';

/**
 * GET: API 키 불러오기
 */
export async function GET() {
  try {
    const apiKeys = await loadApiKeys();
    return NextResponse.json({ apiKeys });
  } catch (error) {
    console.error('Error loading API keys:', error);
    return NextResponse.json(
      { error: 'Failed to load API keys' },
      { status: 500 }
    );
  }
}

/**
 * POST: API 키 저장
 */
export async function POST(request: NextRequest) {
  try {
    const { apiKeys } = await request.json();

    if (!apiKeys || typeof apiKeys !== 'object') {
      return NextResponse.json(
        { error: 'Invalid apiKeys format' },
        { status: 400 }
      );
    }

    await saveApiKeys(apiKeys);

    return NextResponse.json({
      success: true,
      message: 'API 키가 저장되었습니다.'
    });
  } catch (error) {
    console.error('Error saving API keys:', error);
    return NextResponse.json(
      { error: 'Failed to save API keys' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: API 키 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Key parameter is required' },
        { status: 400 }
      );
    }

    const apiKeys = await loadApiKeys();
    delete apiKeys[key];
    await saveApiKeys(apiKeys);

    return NextResponse.json({
      success: true,
      message: 'API 키가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}

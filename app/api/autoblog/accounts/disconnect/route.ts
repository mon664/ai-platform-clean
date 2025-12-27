import { NextRequest, NextResponse } from 'next/server';
import { deleteAccount } from '@/lib/autoblog/local-storage';

/**
 * DELETE: 계정 연결 해제
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    await deleteAccount(id);

    return NextResponse.json({
      success: true,
      message: 'Account disconnected successfully'
    });
  } catch (error: any) {
    console.error('[Disconnect] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect account' },
      { status: 500 }
    );
  }
}

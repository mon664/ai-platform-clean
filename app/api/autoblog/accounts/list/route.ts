import { NextRequest, NextResponse } from 'next/server';
import { loadAccounts } from '@/lib/autoblog/local-storage';

/**
 * GET: 연결된 계정 목록
 */
export async function GET() {
  try {
    const accounts = await loadAccounts();
    return NextResponse.json({ accounts });
  } catch (error: any) {
    console.error('[Accounts List] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load accounts' },
      { status: 500 }
    );
  }
}

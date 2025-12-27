import { NextRequest, NextResponse } from 'next/server';
import { jobManager } from '@/lib/autoblog/job-handler';

/**
 * GET: 작업 로그 조회
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const logs = jobManager.getLogs(jobId);

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('[Job Logs API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load logs' },
      { status: 500 }
    );
  }
}

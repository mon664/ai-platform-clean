import { NextRequest, NextResponse } from 'next/server';
import { jobManager } from '@/lib/autoblog/job-handler';

/**
 * POST: 오래된 작업 정리
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const daysToKeep = body.daysToKeep || 7;

    const beforeJobs = jobManager.getJobs();
    jobManager.cleanupOldJobs(daysToKeep);
    const afterJobs = jobManager.getJobs();

    const deleted = beforeJobs.length - afterJobs.length;

    return NextResponse.json({
      success: true,
      deleted,
      message: `Cleaned up ${deleted} old jobs`
    });
  } catch (error: any) {
    console.error('[Job Cleanup API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cleanup jobs' },
      { status: 500 }
    );
  }
}

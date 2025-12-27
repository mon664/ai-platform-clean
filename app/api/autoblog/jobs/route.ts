import { NextRequest, NextResponse } from 'next/server';
import { jobManager } from '@/lib/autoblog/job-handler';

/**
 * GET: 작업 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = searchParams.get('limit');

    const jobs = jobManager.getJobs({
      status: status as any,
      type: type as any,
      limit: limit ? parseInt(limit) : undefined
    });

    return NextResponse.json({ jobs });
  } catch (error: any) {
    console.error('[Jobs API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load jobs' },
      { status: 500 }
    );
  }
}

/**
 * POST: 작업 생성 또는 재시도
 */
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    // 작업 재시도
    if (id && action === 'retry') {
      const job = jobManager.getJob(id);
      if (!job) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }

      // 실패한 작업만 재시도
      if (job.status !== 'failed') {
        return NextResponse.json(
          { error: 'Only failed jobs can be retried' },
          { status: 400 }
        );
      }

      // 새 작업 생성 (같은 데이터로)
      const newJob = await jobManager.createJob(
        job.type as any,
        job.data,
        { maxRetries: job.maxRetries }
      );

      // 비동기 실행
      jobManager.executeJob(newJob);

      return NextResponse.json({
        success: true,
        message: 'Job queued for retry',
        job: newJob
      });
    }

    // 새 작업 생성
    const { type, data, maxRetries } = await request.json();

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Type and data are required' },
        { status: 400 }
      );
    }

    const job = await jobManager.createJob(type, data, { maxRetries });

    // 비동기 실행
    jobManager.executeJob(job);

    return NextResponse.json({
      success: true,
      job
    });
  } catch (error: any) {
    console.error('[Jobs API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create job' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: 작업 취소 또는 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    if (!id) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    if (action === 'delete') {
      const deleted = jobManager.deleteJob(id);
      if (!deleted) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Job deleted successfully'
      });
    }

    // 기본: 작업 취소
    const cancelled = jobManager.cancelJob(id);
    if (!cancelled) {
      return NextResponse.json(
        { error: 'Job not found or cannot be cancelled' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Job cancelled successfully'
    });
  } catch (error: any) {
    console.error('[Jobs API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel/delete job' },
      { status: 500 }
    );
  }
}

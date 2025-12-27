import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { loadAccounts } from '@/lib/autoblog/local-storage';

const STORAGE_DIR = path.join(process.cwd(), '.autoblog-storage');
const SCHEDULES_FILE = path.join(STORAGE_DIR, 'schedules.json');
const POSTS_FILE = path.join(STORAGE_DIR, 'posts.json');

/**
 * POST: Cron Job - 예약된 글 발행 처리
 *
 * Vercel Cron 설정에서 주기적으로 호출됩니다.
 * 예: 매시간 정각에 실행
 */
export async function POST(request: NextRequest) {
  try {
    // Cron 시크릿 키 확인 (보안)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 현재 시간
    const now = new Date();

    // 예약 파일 확인
    if (!fs.existsSync(SCHEDULES_FILE)) {
      return NextResponse.json({
        success: true,
        message: 'No schedules to process',
        processed: 0
      });
    }

    let schedules: any[] = JSON.parse(fs.readFileSync(SCHEDULES_FILE, 'utf-8'));

    // 발행 대상 필터링 (시간이 도래하고 상태가 pending인 것)
    const toPublish = schedules.filter((s: any) => {
      const scheduledTime = new Date(s.scheduledAt);
      return s.status === 'pending' && scheduledTime <= now;
    });

    if (toPublish.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No posts to publish at this time',
        processed: 0
      });
    }

    console.log('[Cron] Processing', toPublish.length, 'scheduled posts');

    const results: any[] = [];

    // 연결된 계정 불러오기
    const accounts = await loadAccounts();
    if (accounts.length === 0) {
      return NextResponse.json(
        { error: 'No connected accounts' },
        { status: 400 }
      );
    }

    // 각 예약 글 발행 처리
    for (const schedule of toPublish) {
      try {
        // 포스트 내용 가져오기 (content가 없으면 posts.json에서 가져옴)
        let content = schedule.content;
        let title = schedule.title;

        if (!content && fs.existsSync(POSTS_FILE)) {
          const posts: any[] = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
          const post = posts.find((p: any) => p.slug === schedule.slug);
          if (post) {
            content = post.content;
            title = post.title;
          }
        }

        if (!content) {
          results.push({
            id: schedule.id,
            success: false,
            error: 'Content not found'
          });
          continue;
        }

        // 계정 선택
        const account = schedule.accountId
          ? accounts.find((a: any) => a.id === schedule.accountId)
          : accounts[0];

        if (!account) {
          results.push({
            id: schedule.id,
            success: false,
            error: 'Account not found'
          });
          continue;
        }

        // 액세스 토큰 만료 확인
        let accessToken = account.accessToken;
        if (Date.now() > account.expiresAt) {
          results.push({
            id: schedule.id,
            success: false,
            error: 'Access token expired'
          });
          continue;
        }

        // Blogger 블로그 목록 가져오기
        const blogsResponse = await fetch('https://www.googleapis.com/blogger/v3/users/self/blogs', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!blogsResponse.ok) {
          results.push({
            id: schedule.id,
            success: false,
            error: 'Failed to fetch blogs'
          });
          continue;
        }

        const blogsData = await blogsResponse.json();
        const blogId = blogsData.items[0].id;

        // 블로그 포스트 발행
        const publishResponse = await fetch(
          `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              title,
              content,
              labels: ['AI Generated', 'AlphaAutoBlog', 'Scheduled']
            })
          }
        );

        if (!publishResponse.ok) {
          const errorText = await publishResponse.text();
          results.push({
            id: schedule.id,
            success: false,
            error: 'Publish failed: ' + errorText
          });
          continue;
        }

        const publishedPost = await publishResponse.json();

        // 예약 상태 업데이트
        const scheduleIndex = schedules.findIndex((s: any) => s.id === schedule.id);
        if (scheduleIndex !== -1) {
          schedules[scheduleIndex].status = 'published';
          schedules[scheduleIndex].publishedAt = new Date().toISOString();
          schedules[scheduleIndex].publishedUrl = publishedPost.url;
          schedules[scheduleIndex].postId = publishedPost.id;
        }

        results.push({
          id: schedule.id,
          success: true,
          publishedUrl: publishedPost.url,
          postId: publishedPost.id
        });

        console.log('[Cron] Published scheduled post:', schedule.id, '->', publishedPost.url);
      } catch (error: any) {
        console.error('[Cron] Error publishing schedule:', schedule.id, error);
        results.push({
          id: schedule.id,
          success: false,
          error: error.message || 'Unknown error'
        });

        // 실패 시 상태 업데이트
        const scheduleIndex = schedules.findIndex((s: any) => s.id === schedule.id);
        if (scheduleIndex !== -1) {
          schedules[scheduleIndex].status = 'failed';
          schedules[scheduleIndex].error = error.message || 'Unknown error';
          schedules[scheduleIndex].failedAt = new Date().toISOString();
        }
      }
    }

    // 업데이트된 예약 목록 저장
    fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(schedules, null, 2));

    return NextResponse.json({
      success: true,
      message: `Processed ${toPublish.length} scheduled posts`,
      processed: toPublish.length,
      results
    });
  } catch (error: any) {
    console.error('[Cron] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process schedules' },
      { status: 500 }
    );
  }
}

/**
 * GET: Cron 상태 확인 (테스트용)
 */
export async function GET(request: NextRequest) {
  try {
    if (!fs.existsSync(SCHEDULES_FILE)) {
      return NextResponse.json({
        schedules: [],
        message: 'No schedules found'
      });
    }

    const schedules: any[] = JSON.parse(fs.readFileSync(SCHEDULES_FILE, 'utf-8'));
    const now = new Date();

    const pending = schedules.filter((s: any) => s.status === 'pending');
    const readyToPublish = pending.filter((s: any) => new Date(s.scheduledAt) <= now);

    return NextResponse.json({
      total: schedules.length,
      pending: pending.length,
      readyToPublish: readyToPublish.length,
      schedules: pending.map((s: any) => ({
        id: s.id,
        title: s.title,
        scheduledAt: s.scheduledAt,
        timeUntilPublish: new Date(s.scheduledAt).getTime() - now.getTime()
      }))
    });
  } catch (error: any) {
    console.error('[Cron Status] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get status' },
      { status: 500 }
    );
  }
}

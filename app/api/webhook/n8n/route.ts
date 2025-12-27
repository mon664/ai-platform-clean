import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/webhook/n8n
 * n8n workflow integration webhook
 *
 * Actions:
 * - video_idea_received: Generate blog post from video idea
 * - blog_generated: Notify n8n that blog is ready
 * - video_ready: Notify n8n that video is ready
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    console.log('[n8n Webhook] Received:', action, data);

    switch (action) {
      case 'video_idea_received': {
        // n8n에서 영상 아이디어를 받아서 블로그 생성
        const { prompt, title, description, hashtags, cat_breed, camera_pov_en } = data;

        // AutoBlog API 호출하여 블로그 생성
        const blogResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/autoblog/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: title || `Cute ${cat_breed} kitten video`,
            keywords: hashtags?.split(' ').map((h: string) => h.replace('#', '')) || ['kitten', 'cat'],
            model: 'gemini-2.0-flash-exp',
            imageModel: 'vertex-ai-imagen',
            options: {
              includeImages: true,
              imageCount: 3,
              tone: 'friendly'
            }
          })
        });

        const blogData = await blogResponse.json();

        if (!blogResponse.ok) {
          console.error('[n8n Webhook] Blog generation failed:', blogData);
          return NextResponse.json({
            success: false,
            error: blogData.error || 'Failed to generate blog'
          }, { status: 500 });
        }

        console.log('[n8n Webhook] Blog generated successfully');

        return NextResponse.json({
          success: true,
          action: 'blog_generated',
          data: {
            blogId: blogData.post?.id,
            blogTitle: blogData.post?.title,
            videoIdea: data
          }
        });
      }

      case 'start_video_generation': {
        // 블로그 생성 후 영상 생성 시작
        const { prompt, aspectRatio = 'portrait' } = data;

        const veoResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/video/veo/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            aspectRatio,
            duration: 4,
            resolution: '1080p'
          })
        });

        const veoData = await veoResponse.json();

        if (!veoResponse.ok) {
          console.error('[n8n Webhook] Video generation failed:', veoData);
          return NextResponse.json({
            success: false,
            error: veoData.error || 'Failed to start video generation'
          }, { status: 500 });
        }

        console.log('[n8n Webhook] Video generation started:', veoData.operationName);

        return NextResponse.json({
          success: true,
          action: 'video_generation_started',
          data: {
            operationName: veoData.operationName,
            pollUrl: veoData.pollUrl,
            prompt: data.prompt
          }
        });
      }

      case 'poll_video_status': {
        // 영상 생성 상태 확인
        const { operation } = data;

        const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/video/veo/status?operation=${encodeURIComponent(operation)}`);
        const statusData = await statusResponse.json();

        return NextResponse.json({
          success: true,
          action: 'video_status',
          data: statusData
        });
      }

      case 'video_ready': {
        // 영상이 준비되었을 때 (n8n에서 다운로드 후 호출)
        const { videoUrl, title, description } = data;

        // 로깅 또는 추가 처리
        console.log('[n8n Webhook] Video ready:', videoUrl);

        return NextResponse.json({
          success: true,
          action: 'video_received',
          data: { videoUrl, title, description }
        });
      }

      case 'youtube_uploaded': {
        // 유튜브 업로드 완료 알림
        const { videoId, videoUrl } = data;

        console.log('[n8n Webhook] YouTube upload complete:', videoId);

        // 로컬 저장소에 업로드 기록 저장
        // TODO: Implement storage

        return NextResponse.json({
          success: true,
          action: 'upload_recorded',
          data: { videoId, videoUrl }
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[n8n Webhook] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// GET 요청 - 웹훅 테스트용
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'n8n webhook endpoint is ready',
    availableActions: [
      'video_idea_received - Generate blog from video idea',
      'start_video_generation - Start Veo video generation',
      'poll_video_status - Check video generation status',
      'video_ready - Notify when video is ready',
      'youtube_uploaded - Record YouTube upload'
    ],
    example: {
      action: 'video_idea_received',
      data: {
        prompt: 'A cute kitten kneading dough...',
        title: 'Baby kitten video',
        description: 'Description here',
        hashtags: '#kitten #cat'
      }
    }
  });
}

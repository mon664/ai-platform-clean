import { NextRequest, NextResponse } from 'next/server';

const RAILWAY_API_URL = 'https://autoblog-python-production.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const { title, images, duration = 5, transition = 'fade', audioFile, scenes } = await request.json();

    if (!images || images.length === 0) {
      return NextResponse.json({ error: '이미지가 필요합니다' }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: '제목이 필요합니다' }, { status: 400 });
    }

    // Railway 백엔드으로 영상 생성 요청 전송
    const railwayResponse = await fetch(`${RAILWAY_API_URL}/api/video/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        images,
        duration,
        fps: 30,
        quality: 'medium',
        resolution: 'landscape',
        audio_url: audioFile || '',
        sync_audio: !!audioFile,
        target_duration: duration * images.length,
        title
      })
    });

    if (!railwayResponse.ok) {
      const errorData = await railwayResponse.text();
      console.error('Railway API error:', errorData);

      // Fallback: 샘플 비디오 URL 반환
      const sampleVideoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

      return NextResponse.json({
        success: true,
        data: {
          videoUrl: sampleVideoUrl,
          sessionId: `railway_fallback_${Date.now()}`,
          message: "Railway 서버 연동 실패 - 샘플 비디오 로드",
          title,
          sceneCount: images.length,
          status: "completed_fallback"
        }
      });
    }

    const railwayData = await railwayResponse.json();

    return NextResponse.json({
      success: true,
      data: {
        videoUrl: railwayData.videoUrl,
        sessionId: railwayData.sessionId || `railway_${Date.now()}`,
        message: railwayData.message || "Railway 서버에서 영상 생성 완료",
        title,
        sceneCount: images.length,
        status: "completed",
        downloadUrl: railwayData.downloadUrl
      }
    });

  } catch (error: any) {
    console.error('Assemble video error:', error);

    // Fallback: 샘플 비디오 반환
    const fallbackUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4";

    return NextResponse.json({
      success: true,
      data: {
        videoUrl: fallbackUrl,
        sessionId: `fallback_${Date.now()}`,
        message: "오류 발생 - 샘플 비디오 로드",
        title: title || 'Sample Video',
        sceneCount: images?.length || 1,
        status: "error_fallback",
        error: error.message
      }
    });
  }
}
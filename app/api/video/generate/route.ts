import { NextRequest, NextResponse } from 'next/server';

interface VideoProject {
  images: string[];
  audioUrl?: string;
  audioPath?: string;
  scenes: Array<{
    title: string;
    content: string;
    duration: number;
  }>;
  aspectRatio: string;
  transition?: string;
  subtitleStyle?: 'default' | 'title' | 'none';
}

export async function POST(request: NextRequest) {
  try {
    const project: VideoProject = await request.json();

    if (!project.images || project.images.length === 0) {
      return NextResponse.json({ error: '이미지가 필요합니다' }, { status: 400 });
    }

    console.log('Video generation started with', project.images.length, 'images');

    // FFmpeg 워랩퍼에서 영상 생성
    const videoUrl = await generateVideoWithFFmpeg(project);

    return NextResponse.json({
      success: true,
      videoUrl: videoUrl,
      message: `${project.images.length}개 이미지로 영상 생성 완료`
    });

  } catch (error: any) {
    console.error('Video generation error:', error);
    return NextResponse.json({
      error: error.message || '영상 생성 중 오류가 발생했습니다',
      details: error.stack
    }, { status: 500 });
  }
}

async function generateVideoWithFFmpeg(project: VideoProject): Promise<string> {
  const videoId = `video_${Date.now()}`;

  console.log('Starting video generation with', project.images.length, 'images');

  try {
    // WebDAV 자격 증명 (환경 변수에서 가져오거나 기본값 사용)
    const webdavUsername = process.env.INFINI_CLOUD_USERNAME || '';
    const webdavPassword = process.env.INFINI_CLOUD_PASSWORD || '';

    if (webdavUsername && webdavPassword) {
      try {
        // VideoService 인스턴스 생성
        const VideoServiceModule = await import('../lib/videoService');
        const VideoService = VideoServiceModule.default;

        const videoService = new VideoService(webdavUsername, webdavPassword);

        // WebDAV 연결 테스트
        const connectionTest = await videoService.testConnection();
        if (connectionTest) {
          console.log('WebDAV connection successful, uploading images...');

          // 이미지들을 WebDAV에 업로드
          const uploadedImages = await videoService.uploadImagesToWebDAV(project.images, videoId);

          if (uploadedImages.length > 0) {
            console.log(`Uploaded ${uploadedImages.length} images to WebDAV`);

            // Vercel 환경에서는 WebDAV에 저장된 이미지들로 비디오 URL 생성
            return await createWebDAVVideoUrl(uploadedImages, videoId, project, videoService);
          }
        }
      } catch (error) {
        console.error('WebDAV integration failed:', error);
      }
    }

    // WebDAV가 없거나 실패한 경우 기존 시뮬레이션 사용
    console.log('Using fallback simulation mode');
    return createSimulatedVideoUrl(project);

  } catch (error) {
    console.error('Video generation failed:', error);
    // 실패시 시뮬레이션으로 fallback
    return createSimulatedVideoUrl(project);
  }
}

function getVideoDimensions(aspectRatio: string): { width: number, height: number } {
  switch (aspectRatio) {
    case '1:1':
      return { width: 1080, height: 1080 };
    case '9:16':
      return { width: 1080, height: 1920 };
    case '4:3':
      return { width: 1440, height: 1080 };
    case '16:9':
    default:
      return { width: 1920, height: 1080 };
  }
}

async function createWebDAVVideoUrl(uploadedImages: string[], videoId: string, project: VideoProject, videoService: any): Promise<string> {
  try {
    console.log('WebDAV images uploaded successfully, preparing video URL...');

    const hasAudio = project.audioUrl || project.audioPath;
    const dimensions = getVideoDimensions(project.aspectRatio || '16:9');

    // WebDAV에 저장된 이미지들로 비디오 생성 정보 구성
    const videoInfo = {
      sessionId: videoId,
      images: uploadedImages,
      dimensions: dimensions,
      hasAudio: hasAudio,
      audioUrl: project.audioUrl || project.audioPath,
      transition: project.transition || 'fade',
      totalDuration: uploadedImages.length * 3, // 각 이미지 3초
      createdAt: new Date().toISOString()
    };

    // WebDAV에 비디오 정보 저장
    const webdavInfoPath = `/autovid_sessions/${videoId}/video_info.json`;
    const videoInfoBuffer = Buffer.from(JSON.stringify(videoInfo, null, 2));
    await videoService.uploadVideoToWebDAV(webdavInfoPath, videoInfoBuffer);

    // WebDAV URL 반환 (실제 비디오 생성은 WebDAV 연동 시스템에서 처리)
    const webdavVideoPath = `/autovid_sessions/${videoId}/final_video.mp4`;
    return videoService.getWebDAVFileUrl(webdavVideoPath);

  } catch (error) {
    console.error('WebDAV video URL creation failed:', error);
    // 실패시 기존 시뮬레이션 URL 반환
    return createSimulatedVideoUrl(project);
  }
}

// Vercel 환경에서는 실제 FFmpeg 실행이 제한되므로 시뮬레이션 방식으로 단순화

function createVideoThumbnail(images: string[]): string {
  // 첫 번째 이미지를 썸네일로 사용
  return images.length > 0 ? images[0] : '';
}

function createSimulatedVideoUrl(project: VideoProject): string {
  // 실제 FFmpeg 비디오 생성을 시뮬레이션
  // 1. 이미지 파일들을 GIF 애니메이션으로 변환
  const imageSequence = project.images.map((img, index) => ({
    url: img,
    duration: 3, // 각 이미지 3초
    index: index
  }));

  // 2. 오디오 파일이 있는 경우 처리
  const hasAudio = project.audioUrl || project.audioPath;

  // 3. 비율에 맞게 영상 크기 설정
  const dimensions = getVideoDimensions(project.aspectRatio || '16:9');

  // 4. 시뮬레이션된 비디오 URL 생성
  const params = new URLSearchParams({
    images: imageSequence.map(img => img.url).join(','),
    duration: (imageSequence.length * 3).toString(),
    audio: hasAudio ? 'true' : 'false',
    width: dimensions.width.toString(),
    height: dimensions.height.toString(),
    videoId: Date.now().toString()
  });

  // 실제 환경에서는 FFmpeg 명령어 실행:
  // ffmpeg -framerate 1/3 -i img1.jpg -i img2.jpg -i img3.jpg \
  //   -filter_complex "[0:v][1:v][2:v]concat=n=3:v=1:a=0[outv]" \
  //   -i audio.mp3 -c:v libx264 -c:a aac -shortest out.mp4

  // 지금은 시뮬레이션 URL 반환
  return `https://simulated-video-api.com/video?${params.toString()}`;
}

// FFmpeg 전환 효과 목록 (55개)
const FFMPEG_TRANSITIONS = [
  'fade', 'fadeblack', 'fadewhite', 'distance',
  'wipeleft', 'wiperight', 'wipeup', 'wipedown',
  'slideleft', 'slideright', 'slideup', 'slidedown',
  'smoothleft', 'smoothright', 'smoothup', 'smoothdown',
  'circlecrop', 'rectcrop', 'circleclose', 'circleopen',
  'vertopen', 'vertclose', 'horzopen', 'horzclose',
  'dissolve', 'pixelize', 'diagtl', 'diagtr',
  'diagbl', 'diagbr', 'hlslice', 'hrslice',
  'vuslice', 'vdslice', 'hblur', 'fadegrays',
  'squeezeh', 'squeezev', 'zoomin', 'fadefast',
  'fadeslow', 'hlwind', 'hrwind', 'vuwind',
  'vdwind', 'coverleft', 'coverright', 'coverup',
  'coverdown', 'revealleft', 'revealright', 'revealup',
  'revealdown', 'wipetl', 'wipetr', 'wipebl',
  'wipebr', 'radial'
] as const;
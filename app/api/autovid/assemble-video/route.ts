import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { title, images, duration = 5, transition = 'fade', audioFile, scenes, script } = await request.json();

    if (!images || images.length === 0) {
      return NextResponse.json({ error: '이미지가 필요합니다' }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: '제목이 필요합니다' }, { status: 400 });
    }

    console.log('AutoVid: 비디오 조립 시작 - 이미지 수:', images.length);

    // 클라이언트 측 FFmpeg.wasm 사용을 위한 비디오 데이터 생성
    const videoData = {
      title: title,
      images: images.map((img: any, index: number) => ({
        url: img.url || img,
        duration: duration,
        transition: transition,
        scene: scenes?.[index] || `Scene ${index + 1}`,
        text: script?.[index] || ''
      })),
      audioUrl: audioFile || null,
      settings: {
        fps: 30,
        quality: 'medium',
        resolution: '1920x1080',
        aspectRatio: '16:9',
        totalDuration: duration * images.length
      }
    };

    // FFmpeg 명령어 생성 (클라이언트에서 사용)
    const ffmpegCommands = generateFFmpegCommands(videoData);

    // WebDAV 업로드 정보
    const webDavConfig = {
      url: process.env.WEBDAV_URL || 'https://rausu.infini-cloud.net/dav',
      username: process.env.WEBDAV_USERNAME || 'hhtsta',
      password: process.env.WEBDAV_PASSWORD || 'RXYf3uYhCbL9Ezwa'
    };

    return NextResponse.json({
      success: true,
      data: {
        videoData: videoData,
        ffmpegCommands: ffmpegCommands,
        webDavConfig: webDavConfig,
        sessionId: `autovid_${Date.now()}`,
        message: "클라이언트 측 비디오 조립 데이터 준비 완료",
        title: title,
        sceneCount: images.length,
        status: "ready_for_client_assembly",
        instructions: {
          step1: "이미지들을 다운로드하여 Base64로 변환",
          step2: "FFmpeg.wasm를 사용하여 비디오 조립",
          step3: "오디오가 있는 경우 오디오 트랙 추가",
          step4: "생성된 비디오를 WebDAV에 업로드",
          step5: "업로드된 비디오 URL 반환"
        }
      }
    });

  } catch (error: any) {
    console.error('Assemble video error:', error);

    return NextResponse.json({
      success: false,
      error: error.message || '비디오 조립 준비 실패',
      sessionId: `error_${Date.now()}`,
      status: "error"
    }, { status: 500 });
  }
}

function generateFFmpegCommands(videoData: any): string[] {
  const commands: string[] = [];
  const { images, audioUrl, settings } = videoData;

  // 1. 이미지 시퀀스 생성
  images.forEach((img: any, index: number) => {
    const inputIndex = index + 1;
    commands.push(`-loop 1 -t ${img.duration} -i image_${index}.jpg`);
  });

  // 2. 오디오 입력 (있는 경우)
  if (audioUrl) {
    commands.push(`-i audio.mp3`);
  }

  // 3. 비디오 필터 (전환 효과)
  let filterComplex = '';
  for (let i = 0; i < images.length; i++) {
    if (i > 0) {
      filterComplex += `[${i-1}:v][${i}:v]xfade=transition=${images[i].transition}:duration=1:offset=${i * images[i-1].duration}[v${i}];`;
    }
  }

  // 4. 최종 출력 설정
  const audioInputs = images.length + (audioUrl ? 1 : 0);
  const videoOutput = images.length > 1 ? `[v${images.length - 1}]` : '[0:v]';

  if (audioUrl) {
    filterComplex = filterComplex.slice(0, -1); // 마지막 세미콜론 제거
    commands.push(`-filter_complex "${filterComplex}"`);
    commands.push(`-map "${videoOutput}"`);
    commands.push(`-map [${audioInputs - 1}:a]`);
    commands.push(`-c:v libx264`);
    commands.push(`-c:a aac`);
    commands.push(`-shortest`);
  } else {
    if (filterComplex) {
      commands.push(`-filter_complex "${filterComplex.slice(0, -1)}"`);
      commands.push(`-map "${videoOutput}"`);
    }
    commands.push(`-c:v libx264`);
  }

  // 5. 비디오 품질 설정
  commands.push(`-r ${settings.fps}`);
  commands.push(`-b:v 2M`);
  commands.push(`-maxrate 2.5M`);
  commands.push(`-bufsize 1M`);
  commands.push(`-pix_fmt yuv420p`);
  commands.push(`output.mp4`);

  return commands;
}
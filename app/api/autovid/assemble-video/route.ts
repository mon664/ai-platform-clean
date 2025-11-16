import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { title, images, duration = 5, transition = 'fade' } = await request.json();

    if (!images || images.length === 0) {
      return NextResponse.json({ error: '이미지가 필요합니다' }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: '제목이 필요합니다' }, { status: 400 });
    }

    // FFmpeg.wasm을 사용한 클라이언트 사이드 비디오 생성을 위한 데이터 반환
    const videoData = {
      title,
      images,
      duration,
      transition,
      outputSettings: {
        format: 'mp4',
        quality: 'high',
        fps: 30,
        resolution: '1920x1080'
      },
      // FFmpeg 명령어 템플릿 (클라이언트에서 사용)
      ffmpegCommand: {
        inputs: images.map((img: string, index: number) => ({
          source: img,
          duration: duration,
          index: index
        })),
        filters: [
          {
            filter: 'fps',
            options: { fps: 30 }
          },
          {
            filter: transition === 'fade' ? 'fade' : 'scale',
            options: transition === 'fade'
              ? { t: 'in', d: 1 }
              : { w: 1920, h: 1080 }
          }
        ],
        output: {
          format: 'mp4',
          vcodec: 'libx264',
          preset: 'medium',
          crf: 23,
          audio: false
        }
      },
      // 클라이언트 사이드 처리를 위한 명령어 문자열
      commandString: images.map((img, index) =>
        `-loop 1 -t ${duration} -i "${img}"`
      ).join(' ') + ` -filter_complex "${images.map((_, i) => `[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v${i}]`).join(';')}" -map "[v0]" -c:v libx264 -pix_fmt yuv420p -r 30 output.mp4`
    };

    return NextResponse.json({
      success: true,
      videoData,
      message: '영상 생성 데이터가 준비되었습니다. 클라이언트에서 FFmpeg.wasm으로 처리하세요.',
      clientSideProcessing: true,
      ffmpegWasmConfig: {
        coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js',
        wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.wasm'
      }
    });

  } catch (error: any) {
    console.error('Assemble video error:', error);
    return NextResponse.json({
      error: error.message || '영상 조립 중 오류가 발생했습니다'
    }, { status: 500 });
  }
}

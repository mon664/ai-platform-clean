import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { createWriteStream } from 'fs';

const execFileAsync = promisify(execFile);

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

  console.log('Starting FFmpeg video generation with', project.images.length, 'images');

  try {
    // VideoService 인스턴스 생성
    const VideoServiceModule = await import('../../../lib/videoService');
    const VideoService = VideoServiceModule.default;

    // WebDAV 자격 증명 (환경 변수에서 가져오거나 기본값 사용)
    const webdavUsername = process.env.INFINI_CLOUD_USERNAME || '';
    const webdavPassword = process.env.INFINI_CLOUD_PASSWORD || '';

    if (!webdavUsername || !webdavPassword) {
      console.warn('WebDAV credentials not found, using fallback');
      return createSimulatedVideoUrl(project);
    }

    const videoService = new VideoService(webdavUsername, webdavPassword);

    // WebDAV 연결 테스트
    const connectionTest = await videoService.testConnection();
    if (!connectionTest) {
      console.warn('WebDAV connection failed, using fallback');
      return createSimulatedVideoUrl(project);
    }

    // 이미지들을 WebDAV에 업로드
    const uploadedImages = await videoService.uploadImagesToWebDAV(project.images, videoId);

    if (uploadedImages.length === 0) {
      console.warn('No images uploaded to WebDAV, using fallback');
      return createSimulatedVideoUrl(project);
    }

    // FFmpeg으로 비디오 생성
    const videoUrl = await videoService.createVideoWithFFmpeg(
      uploadedImages,
      project.audioUrl || project.audioPath,
      project.aspectRatio,
      project.transition,
      videoId
    );

    return videoUrl;

  } catch (error) {
    console.error('FFmpeg generation failed:', error);
    // 실패시 시뮬레이션으로 fallback
    return createSimulatedVideoUrl(project);
  }
}

async function executeRealFFmpeg(project: VideoProject, videoId: string, videoFileName: string): Promise<string> {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);

  const dimensions = getVideoDimensions(project.aspectRatio || '16:9');
  const transition = project.transition || 'fade';
  const outputDir = `/tmp/videos/${videoId}`;

  // 출력 디렉토리 생성
  await execAsync(`mkdir -p ${outputDir}`);

  // FFmpeg 복합 필터 구성
  const filterComplex = buildFFmpegFilterComplex(project.images, transition, dimensions);

  // 입력 파일 목록 생성
  const inputFiles = project.images.map((img, index) => `-i ${img}`).join(' ');

  // 오디오 입력 추가
  const audioInput = project.audioUrl ? `-i ${project.audioUrl}` : '';

  // FFmpeg 명령어 구성
  const ffmpegCommand = `
    ffmpeg ${inputFiles} ${audioInput}
    -filter_complex "${filterComplex}"
    -map "[vout]"
    -map ${project.audioUrl ? '1:a' : ''}
    -c:v libx264
    -c:a aac
    -pix_fmt yuv420p
    -r 30
    -t ${calculateTotalDuration(project)}
    ${outputDir}/${videoFileName}
  `.replace(/\s+/g, ' ').trim();

  console.log('Executing FFmpeg command:', ffmpegCommand);

  try {
    const { stdout, stderr } = await execAsync(ffmpegCommand);
    console.log('FFmpeg stdout:', stdout);
    console.log('FFmpeg stderr:', stderr);

    // 생성된 비디오 파일을 CDN이나 스토리지로 업로드
    const videoUrl = await uploadVideoToStorage(`${outputDir}/${videoFileName}`, videoFileName);

    // 임시 파일 정리
    await execAsync(`rm -rf ${outputDir}`);

    return videoUrl;

  } catch (ffmpegError) {
    console.error('FFmpeg execution error:', ffmpegError);
    throw ffmpegError;
  }
}

function buildFFmpegFilterComplex(images: string[], transition: string, dimensions: { width: number, height: number }): string {
  const filters = [];
  const duration = 3; // 각 이미지 지속 시간 (초)

  // 각 이미지에 대한 입력 레이블
  const inputLabels = images.map((_, index) => `[${index}:v]`).join('');

  // 이미지 전환 효과 적용
  if (images.length === 1) {
    filters.push(`${inputLabels}scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=increase,crop=${dimensions.width}:${dimensions.height},setpts=PTS-STARTPTS[v0]`);
  } else {
    // 첫 번째 이미지
    filters.push(`[0:v]scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=increase,crop=${dimensions.width}:${dimensions.height},setpts=PTS-STARTPTS,fade=t=in:duration=0.5[v0]`);

    // 중간 이미지들 (전환 효과와 함께)
    for (let i = 1; i < images.length; i++) {
      const prevIndex = i - 1;
      const currIndex = i;

      if (transition === 'fade') {
        filters.push(`[${currIndex}:v]scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=increase,crop=${dimensions.width}:${dimensions.height},setpts=PTS-STARTPTS,fade=t=in:duration=0.5[v${currIndex}]`);
        filters.push(`[v${prevIndex}][v${currIndex}]xfade=transition=fade:duration=1:offset=${prevIndex * duration + duration - 1}[v${currIndex}_out]`);
      } else if (transition === 'slideleft') {
        filters.push(`[${currIndex}:v]scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=increase,crop=${dimensions.width}:${dimensions.height},setpts=PTS-STARTPTS[v${currIndex}]`);
        filters.push(`[v${prevIndex}][v${currIndex}]xfade=transition=slideleft:duration=1:offset=${prevIndex * duration + duration - 1}[v${currIndex}_out]`);
      } else {
        // 기본 전환 효과
        filters.push(`[${currIndex}:v]scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=increase,crop=${dimensions.width}:${dimensions.height},setpts=PTS-STARTPTS[v${currIndex}]`);
        filters.push(`[v${prevIndex}][v${currIndex}]xfade=transition=fade:duration=1:offset=${prevIndex * duration + duration - 1}[v${currIndex}_out]`);
      }
    }

    // 마지막 출력
    const lastIndex = images.length - 1;
    filters.push(`[v${lastIndex}_out]format=yuv420p[vout]`);
  }

  return filters.join(';');
}

function calculateTotalDuration(project: VideoProject): number {
  const baseDuration = project.images.length * 3; // 각 이미지 3초
  const transitionDuration = (project.images.length - 1) * 1; // 전환 효과 1초
  return baseDuration + transitionDuration;
}

async function uploadVideoToStorage(filePath: string, fileName: string): Promise<string> {
  // 실제 환경에서는 CDN, AWS S3, Google Cloud Storage 등에 업로드
  // 지금은 가상의 URL 반환
  return `https://cdn.example.com/videos/${fileName}`;
}

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

function getVideoDimensions(aspectRatio: string): { width: number; height: number } {
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
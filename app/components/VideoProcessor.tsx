'use client';

import { useState, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface VideoProcessorProps {
  title: string;
  images: string[];
  duration: number;
  transition: string;
  onComplete: (videoUrl: string) => void;
  onError: (error: string) => void;
  onProgress: (progress: number) => void;
}

export default function VideoProcessor({
  title,
  images,
  duration,
  transition,
  onComplete,
  onError,
  onProgress
}: VideoProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [progress, setProgress] = useState(0);

  const processVideo = async () => {
    if (!images || images.length === 0) {
      onError('처리할 이미지가 없습니다');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // FFmpeg 초기화
      if (!ffmpegRef.current) {
        ffmpegRef.current = new FFmpeg();

        // FFmpeg 이벤트 리스너
        ffmpegRef.current.on('log', ({ message }) => {
          console.log('FFmpeg log:', message);
        });

        ffmpegRef.current.on('progress', ({ progress, time }) => {
          const progressPercent = Math.round(progress * 100);
          setProgress(progressPercent);
          onProgress(progressPercent);
        });
      }

      const ffmpeg = ffmpegRef.current;

      // FFmpeg 로드
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      // 각 이미지를 입력 파일로 추가
      for (let i = 0; i < images.length; i++) {
        const imageData = images[i];
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        const uint8Array = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        await ffmpeg.writeFile(`input_${i}.png`, uint8Array);
      }

      // FFmpeg 명령어 실행 - 간단한 concat 방식
      const command = [
        // 첫 이미지로 시작
        '-loop', '1', '-t', duration.toString(), '-i', 'input_0.png',
        // 나머지 이미지들
        ...images.slice(1).map((_, index) => [
          '-loop', '1', '-t', duration.toString(), '-i', `input_${index + 1}.png`
        ]).flat(),
        // 비디오 필터
        '-filter_complex',
        images.map((_, i) =>
          `[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v${i}]`
        ).join(';'),
        // 출력 설정
        '-map', '[v0]',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-r', '30',
        '-preset', 'medium',
        '-crf', '23',
        `${title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}.mp4`
      ];

      console.log('Executing FFmpeg command:', command.join(' '));
      await ffmpeg.exec(command);

      // 결과 비디오 파일 읽기
      const videoData = await ffmpeg.readFile(`${title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}.mp4`);
      const videoBlob = new Blob([videoData], { type: 'video/mp4' });
      const videoUrl = URL.createObjectURL(videoBlob);

      onComplete(videoUrl);

      // 메모리 정리
      URL.revokeObjectURL(videoUrl);

    } catch (error: any) {
      console.error('Video processing error:', error);
      onError(`영상 처리 중 오류: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
      <h3 className="text-xl font-bold text-white mb-4">🎬 영상 생성기</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-white">이미지 수: {images?.length || 0}</span>
          <span className="text-white">지속 시간: {duration}초/장면</span>
        </div>

        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-white">
              <span>처리 중...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <button
          onClick={processVideo}
          disabled={isProcessing || !images || images.length === 0}
          className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold py-3 px-6 rounded-lg hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:transform-none"
        >
          {isProcessing ? '⏳ 영상 생성 중...' : '🎬 영상 생성 시작'}
        </button>

        <div className="text-xs text-gray-300 text-center">
          FFmpeg.wasm을 사용하여 브라우저에서 직접 영상을 생성합니다
        </div>
      </div>
    </div>
  );
}
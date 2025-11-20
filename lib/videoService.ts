import { createClient, FileStat } from 'webdav';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { createWriteStream } from 'fs';

// Infini Cloud WebDAV 설정
const INFINI_CLOUD_CONFIG = {
  url: 'https://infinidrive.infini-t.co:4430/remote.php/dav/files/',
  username: '', // 사용자 입력 필요
  password: ''  // 앱 비밀번호 필요
};

class VideoService {
  private webdavClient: any;

  constructor(username?: string, password?: string) {
    if (username && password) {
      this.webdavClient = createClient(INFINI_CLOUD_CONFIG.url, {
        username: username,
        password: password
      });
    }
  }

  /**
   * Infini Cloud WebDAV 연결 테스트
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.webdavClient) {
        throw new Error('WebDAV client not initialized');
      }

      const directoryContents = await this.webdavClient.getDirectoryContents('/');
      return true;
    } catch (error) {
      console.error('WebDAV connection failed:', error);
      return false;
    }
  }

  /**
   * 이미지 URL들을 다운로드하고 WebDAV에 업로드
   */
  async uploadImagesToWebDAV(imageUrls: string[], sessionId: string): Promise<string[]> {
    if (!this.webdavClient) {
      throw new Error('WebDAV client not initialized');
    }

    const uploadedPaths: string[] = [];
    const sessionDir = `/autovid_sessions/${sessionId}`;

    try {
      // 세션 디렉토리 생성
      await this.webdavClient.createDirectory(sessionDir);

      // 각 이미지 다운로드 및 업로드
      for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i];
        const filename = `scene_${i + 1}.jpg`;
        const webdavPath = `${sessionDir}/${filename}`;

        try {
          // 이미지 다운로드
          const imageBuffer = await this.downloadImage(imageUrl);

          // WebDAV에 업로드
          await this.webdavClient.putFileContents(webdavPath, imageBuffer);
          uploadedPaths.push(webdavPath);

          console.log(`Uploaded image ${i + 1}/${imageUrls.length}: ${filename}`);
        } catch (error) {
          console.error(`Failed to upload image ${i + 1}:`, error);
        }
      }

      return uploadedPaths;
    } catch (error) {
      console.error('Failed to upload images to WebDAV:', error);
      throw error;
    }
  }

  /**
   * 이미지 다운로드
   */
  private async downloadImage(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      if (url.startsWith('data:')) {
        // Base64 데이터 URL 처리
        const base64Data = url.split(',')[1];
        resolve(Buffer.from(base64Data, 'base64'));
        return;
      }

      const request = https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        const chunks: Buffer[] = [];
        response.on('data', (chunk) => {
          chunks.push(chunk);
        });

        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });
      });

      request.on('error', reject);
      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('Download timeout'));
      });
    });
  }

  /**
   * FFmpeg으로 비디오 생성 (서버 사이드)
   */
  async createVideoWithFFmpeg(
    imagePaths: string[],
    audioPath?: string,
    aspectRatio: string = '16:9',
    transition: string = 'fade',
    sessionId: string = 'default'
  ): Promise<string> {
    try {
      const dimensions = this.getVideoDimensions(aspectRatio);
      const outputPath = `/tmp/${sessionId}_video.mp4`;

      return new Promise((resolve, reject) => {
        let command = ffmpeg();

        // 이미지 입력 추가
        imagePaths.forEach((imagePath, index) => {
          if (imagePath.startsWith('/autovid_sessions/')) {
            // WebDAV 경로인 경우 임시 파일로 다운로드
            command.input(this.getWebDAVFileUrl(imagePath));
          } else {
            command.input(imagePath);
          }
        });

        // 오디오 입력 추가
        if (audioPath) {
          if (audioPath.startsWith('/autovid_sessions/')) {
            command.input(this.getWebDAVFileUrl(audioPath));
          } else {
            command.input(audioPath);
          }
        }

        // 필터 설정 (여러 이미지 결합)
        const filterComplex = this.buildFFmpegFilter(imagePaths.length, dimensions, transition);
        command.complexFilter(filterComplex);

        // 출력 설정
        const hasAudio = !!audioPath;

        if (imagePaths.length === 1) {
          // 단일 이미지 비디오
          command
            .outputOptions([
              '-loop 1',
              '-t 10',
              '-c:v libx264',
              '-pix_fmt yuv420p',
              '-r 30'
            ]);
        } else {
          // 다중 이미지 비디오
          command
            .outputOptions([
              '-map [v]',
              ...(hasAudio ? ['-map 1:a'] : []),
              '-c:v libx264',
              ...(hasAudio ? ['-c:a aac'] : []),
              '-pix_fmt yuv420p',
              '-r 30',
              '-shortest'
            ]);
        }

        command
          .output(outputPath)
          .on('start', (commandLine) => {
            console.log('FFmpeg command:', commandLine);
          })
          .on('progress', (progress) => {
            console.log('Processing:', progress.percent?.toFixed(1) + '%');
          })
          .on('end', async () => {
            console.log('Video creation completed');

            try {
              // 생성된 비디오를 WebDAV에 업로드
              const videoBuffer = fs.readFileSync(outputPath);
              const webdavPath = `/autovid_sessions/${sessionId}/final_video.mp4`;

              await this.webdavClient.putFileContents(webdavPath, videoBuffer);

              // 임시 파일 삭제
              fs.unlinkSync(outputPath);

              // WebDAV URL 반환
              const videoUrl = this.getWebDAVFileUrl(webdavPath);
              resolve(videoUrl);
            } catch (uploadError) {
              console.error('Failed to upload video to WebDAV:', uploadError);
              reject(uploadError);
            }
          })
          .on('error', (error) => {
            console.error('FFmpeg error:', error);
            reject(error);
          });

        command.run();
      });
    } catch (error) {
      console.error('Video creation failed:', error);
      throw error;
    }
  }

  /**
   * FFmpeg 필터 복합 구성
   */
  private buildFFmpegFilter(imageCount: number, dimensions: { width: number, height: number }, transition: string): string[] {
    const filters: string[] = [];
    const duration = 3; // 각 이미지 3초

    if (imageCount === 1) {
      // 단일 이미지 필터
      filters.push(
        `[0:v]scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=increase,crop=${dimensions.width}:${dimensions.height},format=yuv420p[v]`
      );
    } else {
      // 다중 이미지 필터
      for (let i = 0; i < imageCount; i++) {
        filters.push(
          `[${i}:v]scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=increase,crop=${dimensions.width}:${dimensions.height},format=yuv420p,fps=30,setsar=1[v${i}]`
        );
      }

      // 전환 효과 적용
      if (imageCount === 2) {
        filters.push(`[v0][v1]xfade=transition=${transition}:duration=1:offset=2[v]`);
      } else {
        // 3개 이상 이미지
        let currentFilter = '[v0]';
        for (let i = 1; i < imageCount; i++) {
          const offset = duration * i - 1;
          if (i === imageCount - 1) {
            filters.push(`${currentFilter}[v${i}]xfade=transition=${transition}:duration=1:offset=${offset}[v]`);
          } else {
            filters.push(`${currentFilter}[v${i}]xfade=transition=${transition}:duration=1:offset=${offset}[v${i}_out]`);
            currentFilter = `[v${i}_out]`;
          }
        }
      }
    }

    return filters;
  }

  /**
   * 비디오 크기 가져오기
   */
  private getVideoDimensions(aspectRatio: string): { width: number, height: number } {
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

  /**
   * WebDAV 파일 URL 생성
   */
  private getWebDAVFileUrl(webdavPath: string): string {
    // WebDAV 경로를 다운로드 가능한 URL로 변환
    return `${INFINI_CLOUD_CONFIG.url.replace('/remote.php/dav/files/', '/index.php/apps/files/ajax/download.php?dir=')}&files=${path.basename(webdavPath)}`;
  }
}

export default VideoService;
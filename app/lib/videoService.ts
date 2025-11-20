import { createClient, FileStat } from 'webdav';
import https from 'https';

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
   * 비디오 크기 가져오기
   */
  getVideoDimensions(aspectRatio: string): { width: number, height: number } {
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
import puppeteer from 'puppeteer';

export interface TistoryPostData {
  title: string;
  content: string;
  tags?: string;
  category?: string;
}

export interface TistoryCredentials {
  blogName: string;
  tistoryId: string;
  tistoryPassword: string;
}

const COOKIE_DIR = '.autoblog-storage/tistory-cookies';

/**
 * 티스토리에 Puppeteer로 자동 발행
 */
export async function publishToTistory(
  postData: TistoryPostData,
  credentials: TistoryCredentials
): Promise<{ url: string; postId: string }> {
  const { blogName, tistoryId, tistoryPassword } = credentials;
  
  // Puppeteer 실행 (Windows에서는 chrome path 지정 필요 없음)
  const browser = await puppeteer.launch({
    headless: false, // 테스트를 위해 브라우저 보이기 (나중에 true로 변경 가능)
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
    ]
  });

  try {
    const page = await browser.newPage();
    
    // 1. 티스토리 로그인
    await page.goto('https://www.tistory.com/', { waitUntil: 'networkidle2' });
    
    // 쿠키 확인 (이미 로그인되어 있으면 건너뜀)
    const isLoggedIn = await page.evaluate(() => {
      const loginBtn = document.querySelector('#kakaoHead > div > div.info_tistory > div.logn_tistory > button');
      return !loginBtn; // 로그인 버튼이 없으면 이미 로그인됨
    });

    if (!isLoggedIn) {
      // 로그인 버튼 클릭
      await page.waitForSelector('#kakaoHead > div > div.info_tistory > div.logn_tistory > button', { timeout: 10000 });
      await page.click('#kakaoHead > div > div.info_tistory > div.logn_tistory > button');
      
      await page.waitForTimeout(2000);
      
      // ID/PW 입력 (티스토리 구 계정인지 카카오 계정인지 확인)
      const isTistoryId = tistoryId.includes(':') || !tistoryId.includes('@');
      
      if (isTistoryId) {
        // 티스토리 구 계정
        await page.waitForSelector('div.login_page > div > div > a:nth-child(7)', { timeout: 10000 });
        await page.click('div.login_page > div > div > a:nth-child(7)');
        
        await page.waitForSelector('#loginId', { timeout: 10000 });
        await page.type('#loginId', tistoryId.split(':')[0]);
        await page.type('#loginPw', tistoryPassword);
        
        await page.click('#authForm > fieldset > button.btn_login');
      } else {
        // 카카오 계정으로 로그인
        await page.waitForSelector('#loginId--1', { timeout: 10000 });
        await page.type('#loginId--1', tistoryId);
        await page.type('#password--2', tistoryPassword);
        
        await page.click('//*[@id="mainContent"]/div/div/form/div[4]/button[1]');
      }
      
      // 로그인 대기
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      await page.waitForTimeout(3000);
    }
    
    // 2. 글쓰기 페이지로 이동
    const writeUrl = `https://${blogName}.tistory.com/manage/post`;
    await page.goto(writeUrl, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // 3. 제목 입력
    await page.waitForSelector('#post-title-inp', { timeout: 10000 });
    await page.type('#post-title-inp', postData.title);
    
    // 4. HTML 모드로 전환
    await page.click('#editor-mode-layer-btn-open');
    await page.waitForTimeout(2000);
    
    try {
      await page.click('#editor-mode-html');
      await page.waitForTimeout(1000);
      
      // 경고창 있으면 확인
      const alert = await page.evaluate(() => {
        const el = document.querySelector('.btn_confirm');
        if (el) {
          (el as HTMLElement).click();
          return true;
        }
        return false;
      });
    } catch (e) {
      // 경고창 없으면 무시
    }
    
    // 5. 본문 입력 (CodeMirror 에디터)
    await page.waitForSelector('.CodeMirror', { timeout: 10000 });
    
    // CodeMirror에 내용 입력
    await page.evaluate((content) => {
      const editor = document.querySelector('.CodeMirror') as any;
      if (editor && editor.CodeMirror) {
        editor.CodeMirror.setValue(editor.CodeMirror.getValue() + '\n' + content);
      }
    }, postData.content);
    
    await page.waitForTimeout(1000);
    
    // 6. 태그 입력 (선택사항)
    if (postData.tags) {
      await page.type('#tagText', postData.tags);
    }
    
    // 7. 발행 버튼 클릭
    await page.click('#publish-layer-btn');
    await page.waitForTimeout(2000);
    
    // 공개 버튼 클릭
    await page.click('#open20');
    
    // 발행 완료 대기
    await page.waitForSelector('.btn_drafted', { timeout: 30000 });
    
    // 발행된 게시물 URL 가져오기
    const postedUrl = await page.evaluate(() => {
      const urlInput = document.querySelector('#post-url-inp') as HTMLInputElement;
      return urlInput?.value || '';
    });
    
    // 게시물 ID 가져오기
    const postId = await page.evaluate(() => {
      const urlInput = document.querySelector('#post-url-inp') as HTMLInputElement;
      const url = urlInput?.value || '';
      const match = url.match(/\/(\d+)$/);
      return match ? match[1] : '';
    });
    
    return {
      url: postedUrl || `https://${blogName}.tistory.com/`,
      postId: postId || Date.now().toString()
    };
    
  } finally {
    await browser.close();
  }
}

/**
 * 티스토리 로그인 테스트
 */
export async function testTistoryLogin(
  credentials: TistoryCredentials
): Promise<boolean> {
  const { blogName, tistoryId, tistoryPassword } = credentials;
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.goto('https://www.tistory.com/', { waitUntil: 'networkidle2' });
    
    // 로그인 버튼 클릭
    await page.waitForSelector('#kakaoHead > div > div.info_tistory > div.logn_tistory > button', { timeout: 10000 });
    await page.click('#kakaoHead > div > div.info_tistory > div.logn_tistory > button');
    
    await page.waitForTimeout(2000);
    
    const isTistoryId = tistoryId.includes(':') || !tistoryId.includes('@');
    
    if (isTistoryId) {
      await page.waitForSelector('div.login_page > div > div > a:nth-child(7)', { timeout: 10000 });
      await page.click('div.login_page > div > div > a:nth-child(7)');
      await page.type('#loginId', tistoryId.split(':')[0]);
      await page.type('#loginPw', tistoryPassword);
      await page.click('#authForm > fieldset > button.btn_login');
    } else {
      await page.waitForSelector('#loginId--1', { timeout: 10000 });
      await page.type('#loginId--1', tistoryId);
      await page.type('#password--2', tistoryPassword);
      await page.click('//*[@id="mainContent"]/div/div/form/div[4]/button[1]');
    }
    
    // 로그인 성공 확인
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    
    // 블로그 접근 테스트
    await page.goto(`https://${blogName}.tistory.com/manage/post`, { waitUntil: 'networkidle2' });
    
    const hasWriteButton = await page.$('#post-title-inp');
    return hasWriteButton !== null;
    
  } catch (error) {
    console.error('Tistory login test failed:', error);
    return false;
  } finally {
    await browser.close();
  }
}

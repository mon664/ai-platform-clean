import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  keyFilename: process.env.GCP_SERVICE_ACCOUNT_KEY
    ? undefined
    : undefined,
  credentials: process.env.GCP_SERVICE_ACCOUNT_KEY
    ? JSON.parse(Buffer.from(process.env.GCP_SERVICE_ACCOUNT_KEY, "base64").toString())
    : undefined,
});

const bucketName = process.env.GCS_BUCKET_NAME || 'run-sources-surviving-new-us-central1';
const bucket = storage.bucket(bucketName);

// Blog platform type
export type BlogPlatform = 'blogger' | 'wordpress' | 'tistory';

// Base blog account interface
export interface BaseBlogAccount {
  id: string;
  platform: BlogPlatform;
  name: string;
  connectedAt: string;
}

// Blogger account
export interface BloggerAccount extends BaseBlogAccount {
  platform: 'blogger';
  email: string;
  picture?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

// WordPress account (for accounts-storage compatibility)
export interface WordPressAccount {
  id: number;
  platform: 'wordpress';
  name: string;
  siteUrl: string;
  username: string;
  applicationPassword: string;
  createdAt: string;
}

// Tistory account (for accounts-storage compatibility)
export interface TistoryAccount {
  id: number;
  platform: 'tistory';
  name: string;
  blogName: string;
  tistoryUrl?: string;
  tistoryId?: string;
  tistoryPassword?: string;
  createdAt: string;
}

// Unified blog account type
export type BlogAccount = BloggerAccount | WordPressAccount | TistoryAccount;

// GCS에서 파일 읽기
export async function readGCSFile(filename: string): Promise<any> {
  try {
    const file = bucket.file(filename);
    const [exists] = await file.exists();

    if (!exists) {
      return null;
    }

    const [contents] = await file.download();
    const content = contents.toString('utf-8');

    if (!content || content.trim() === '') {
      return null;
    }

    return JSON.parse(content);
  } catch (error) {
    console.error(`[GCS] Failed to read ${filename}:`, error);
    return null;
  }
}

// GCS에 파일 쓰기
export async function writeGCSFile(filename: string, data: any): Promise<void> {
  try {
    const file = bucket.file(filename);
    const content = JSON.stringify(data, null, 2);
    await file.save(content, {
      contentType: 'application/json',
    });
  } catch (error) {
    console.error(`[GCS] Failed to write ${filename}:`, error);
    throw error;
  }
}

// 게시글 저장소
export async function loadPosts(): Promise<any[]> {
  const data = await readGCSFile('autoblog/posts.json');
  return data?.posts || [];
}

export async function savePosts(posts: any[]): Promise<void> {
  await writeGCSFile('autoblog/posts.json', { posts });
}

// API Keys 저장소
export async function loadApiKeys(): Promise<any> {
  const data = await readGCSFile('autoblog/api-keys.json');
  return data || {};
}

export async function saveApiKeys(apiKeys: any): Promise<void> {
  await writeGCSFile('autoblog/api-keys.json', apiKeys);
}

// Blogger 토큰 저장소
export async function saveBloggerTokens(tokens: any): Promise<void> {
  await writeGCSFile('autoblog/blogger-tokens.json', tokens);
}

export async function loadBloggerTokens(): Promise<any> {
  return await readGCSFile('autoblog/blogger-tokens.json');
}

// Unified accounts storage (for Blogger OAuth callback)
export async function saveBlogAccount(account: BlogAccount): Promise<void> {
  const accounts = await loadBlogAccounts();
  
  // 기존 계정이 있으면 업데이트, 없으면 추가
  const existingIndex = accounts.findIndex((a: any) => a.id === account.id);
  if (existingIndex >= 0) {
    accounts[existingIndex] = account;
  } else {
    accounts.push(account);
  }
  
  await writeGCSFile('autoblog/blog-accounts.json', { accounts });
}

export async function loadBlogAccounts(): Promise<BlogAccount[]> {
  const data = await readGCSFile('autoblog/blog-accounts.json');
  return data?.accounts || [];
}

export async function deleteBlogAccount(accountId: string): Promise<void> {
  const accounts = await loadBlogAccounts();
  const filtered = accounts.filter((a: any) => a.id !== accountId);
  await writeGCSFile('autoblog/blog-accounts.json', { accounts });
}

export async function getAccountsByPlatform(platform: BlogPlatform): Promise<BlogAccount[]> {
  const accounts = await loadBlogAccounts();
  return accounts.filter(a => a.platform === platform);
}

// WordPress/Tistory 계정 저장소 (accounts-storage.ts 호환)
export async function loadAccounts(): Promise<(WordPressAccount | TistoryAccount)[]> {
  const data = await readGCSFile('autoblog/accounts.json');
  return data?.accounts || [];
}

export async function saveAccounts(accounts: (WordPressAccount | TistoryAccount)[]): Promise<void> {
  await writeGCSFile('autoblog/accounts.json', { accounts });
}

// 예약된 글 저장소
export async function loadSchedules(): Promise<any[]> {
  const data = await readGCSFile('autoblog/schedules.json');
  return data?.schedules || [];
}

export async function saveSchedules(schedules: any[]): Promise<void> {
  await writeGCSFile('autoblog/schedules.json', { schedules });
}

// 작업 기록 저장소
export async function loadJobs(): Promise<any[]> {
  const data = await readGCSFile('autoblog/jobs.json');
  return data?.jobs || [];
}

export async function saveJobs(jobs: any[]): Promise<void> {
  await writeGCSFile('autoblog/jobs.json', { jobs });
}

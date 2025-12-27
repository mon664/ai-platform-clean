import fs from 'fs';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), '.autoblog-storage');
const API_KEYS_FILE = path.join(STORAGE_DIR, 'api-keys.json');
const ACCOUNTS_FILE = path.join(STORAGE_DIR, 'accounts.json');

// 저장소 디렉토리 초기화
function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

// 블로그 플랫폼 타입
export type BlogPlatform = 'blogger' | 'wordpress' | 'tistory';

// 베이스 계정 인터페이스
export interface BaseBlogAccount {
  id: string;
  platform: BlogPlatform;
  name: string;
  connectedAt: string;
}

// Blogger 계정
export interface BloggerAccount extends BaseBlogAccount {
  platform: 'blogger';
  email: string;
  picture?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

// WordPress 계정
export interface WordPressAccount extends BaseBlogAccount {
  platform: 'wordpress';
  siteUrl: string;
  username: string;
  applicationPassword: string;
}

// Tistory 계정
export interface TistoryAccount extends BaseBlogAccount {
  platform: 'tistory';
  blogName: string;  // Tistory 블로그 이름 (예: mon664.tistory.com의 mon664)
  accessToken: string;
  tistoryUrl?: string;
}

// 통합 계정 타입
export type BlogAccount = BloggerAccount | WordPressAccount | TistoryAccount;

/**
 * API 키 저장 (로컬 파일)
 */
export async function saveApiKeysLocally(apiKeys: Record<string, string>): Promise<void> {
  ensureStorageDir();
  fs.writeFileSync(API_KEYS_FILE, JSON.stringify(apiKeys, null, 2));
}

/**
 * API 키 불러오기 (로컬 파일)
 */
export async function loadApiKeysLocally(): Promise<Record<string, string>> {
  ensureStorageDir();
  if (fs.existsSync(API_KEYS_FILE)) {
    const data = fs.readFileSync(API_KEYS_FILE, 'utf-8');
    return JSON.parse(data);
  }
  return {};
}

/**
 * API 키 삭제 (로컬 파일)
 */
export async function deleteApiKeyLocally(key: string): Promise<void> {
  const keys = await loadApiKeysLocally();
  delete keys[key];
  await saveApiKeysLocally(keys);
}

/**
 * Blogger 토큰 저장
 */
export async function saveBloggerTokens(tokens: any): Promise<void> {
  ensureStorageDir();
  const tokensFile = path.join(STORAGE_DIR, 'blogger-tokens.json');
  fs.writeFileSync(tokensFile, JSON.stringify(tokens, null, 2));
}

/**
 * Blogger 토큰 불러오기
 */
export async function loadBloggerTokens(): Promise<any> {
  ensureStorageDir();
  const tokensFile = path.join(STORAGE_DIR, 'blogger-tokens.json');
  if (fs.existsSync(tokensFile)) {
    const data = fs.readFileSync(tokensFile, 'utf-8');
    return JSON.parse(data);
  }
  return null;
}

/**
 * 연결된 계정 저장
 */
export async function saveAccount(account: BlogAccount): Promise<void> {
  ensureStorageDir();
  let accounts: BlogAccount[] = [];

  if (fs.existsSync(ACCOUNTS_FILE)) {
    accounts = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf-8'));
  }

  // 기존 계정이 있으면 업데이트, 없으면 추가
  const existingIndex = accounts.findIndex((a: any) => a.id === account.id);
  if (existingIndex >= 0) {
    accounts[existingIndex] = account;
  } else {
    accounts.push(account);
  }

  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
}

/**
 * 연결된 계정 목록 불러오기
 */
export async function loadAccounts(): Promise<BlogAccount[]> {
  ensureStorageDir();
  if (fs.existsSync(ACCOUNTS_FILE)) {
    const data = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
    return JSON.parse(data);
  }
  return [];
}

/**
 * 계정 삭제
 */
export async function deleteAccount(accountId: string): Promise<void> {
  ensureStorageDir();
  if (fs.existsSync(ACCOUNTS_FILE)) {
    const accounts: BlogAccount[] = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf-8'));
    const filtered = accounts.filter((a: any) => a.id !== accountId);
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(filtered, null, 2));
  }
}

/**
 * 플랫폼별 계정 필터링
 */
export async function getAccountsByPlatform(platform: BlogPlatform): Promise<BlogAccount[]> {
  const accounts = await loadAccounts();
  return accounts.filter(a => a.platform === platform);
}

import fs from 'fs';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), '.autoblog-storage');
const ACCOUNTS_FILE = path.join(STORAGE_DIR, 'accounts.json');

export type BlogPlatformType = 'wordpress' | 'tistory' | 'other';

export interface BaseBlogAccount {
  id: number;
  platform: BlogPlatformType;
  name: string;
  createdAt: string;
}

export interface WordPressAccount extends BaseBlogAccount {
  platform: 'wordpress';
  siteUrl: string;
  username: string;
  applicationPassword: string;
}

export interface TistoryAccount extends BaseBlogAccount {
  platform: 'tistory';
  blogName: string;      // Tistory 블로그 이름 (예: mon664)
  tistoryId: string;     // 티스토리 ID (이메일)
  tistoryPassword: string; // 티스토리 비밀번호
  tistoryUrl?: string;
}

export type BlogAccount = WordPressAccount | TistoryAccount;

function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

function getAccounts(): BlogAccount[] {
  ensureStorageDir();
  if (!fs.existsSync(ACCOUNTS_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveAccounts(accounts: BlogAccount[]): void {
  ensureStorageDir();
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
}

export async function getBlogAccounts(): Promise<BlogAccount[]> {
  return getAccounts();
}

export async function createWordPressAccount(data: {
  name: string;
  siteUrl: string;
  username: string;
  applicationPassword: string;
}): Promise<WordPressAccount> {
  const accounts = getAccounts();
  const existing = accounts.find(a => a.platform === 'wordpress' && 
    (a as WordPressAccount).siteUrl === data.siteUrl);
  if (existing) {
    throw new Error('WordPress account already exists');
  }

  const newAccount: WordPressAccount = {
    id: accounts.length > 0 ? Math.max(...accounts.map(a => a.id)) + 1 : 1,
    platform: 'wordpress',
    name: data.name,
    siteUrl: data.siteUrl,
    username: data.username,
    applicationPassword: data.applicationPassword,
    createdAt: new Date().toISOString()
  };

  accounts.push(newAccount);
  saveAccounts(accounts);
  return newAccount;
}

export async function createTistoryAccount(data: {
  name: string;
  blogName: string;
  tistoryId: string;
  tistoryPassword: string;
  tistoryUrl?: string;
}): Promise<TistoryAccount> {
  const accounts = getAccounts();
  const existing = accounts.find(a => a.platform === 'tistory' && 
    (a as TistoryAccount).blogName === data.blogName);
  if (existing) {
    throw new Error('Tistory account already exists');
  }

  const newAccount: TistoryAccount = {
    id: accounts.length > 0 ? Math.max(...accounts.map(a => a.id)) + 1 : 1,
    platform: 'tistory',
    name: data.name,
    blogName: data.blogName,
    tistoryId: data.tistoryId,
    tistoryPassword: data.tistoryPassword,
    tistoryUrl: data.tistoryUrl,
    createdAt: new Date().toISOString()
  };

  accounts.push(newAccount);
  saveAccounts(accounts);
  return newAccount;
}

export async function createBlogAccount(data: any): Promise<BlogAccount> {
  const platform = data.platform || 'other';
  if (platform === 'wordpress') {
    return createWordPressAccount(data);
  } else if (platform === 'tistory') {
    return createTistoryAccount(data);
  }

  const accounts = getAccounts();
  const existing = accounts.find(a => a.id === data.blogId);
  if (existing) {
    throw new Error('Account already exists');
  }

  const newAccount: BlogAccount = {
    id: accounts.length > 0 ? Math.max(...accounts.map(a => a.id)) + 1 : 1,
    platform: platform,
    name: data.name,
    ...data,
    createdAt: new Date().toISOString()
  } as any;

  accounts.push(newAccount);
  saveAccounts(accounts);
  return newAccount;
}

export async function updateBlogAccount(id: number, data: any): Promise<BlogAccount | null> {
  const accounts = getAccounts();
  const index = accounts.findIndex(a => a.id === id);
  if (index === -1) {
    return null;
  }

  if (data.name !== undefined) accounts[index].name = data.name;
  
  if (accounts[index].platform === 'wordpress') {
    const wpAccount = accounts[index] as WordPressAccount;
    if (data.siteUrl !== undefined) wpAccount.siteUrl = data.siteUrl;
    if (data.username !== undefined) wpAccount.username = data.username;
    if (data.applicationPassword !== undefined) wpAccount.applicationPassword = data.applicationPassword;
  }
  
  if (accounts[index].platform === 'tistory') {
    const tistoryAccount = accounts[index] as TistoryAccount;
    if (data.blogName !== undefined) tistoryAccount.blogName = data.blogName;
    if (data.tistoryId !== undefined) tistoryAccount.tistoryId = data.tistoryId;
    if (data.tistoryPassword !== undefined) tistoryAccount.tistoryPassword = data.tistoryPassword;
    if (data.tistoryUrl !== undefined) tistoryAccount.tistoryUrl = data.tistoryUrl;
  }

  saveAccounts(accounts);
  return accounts[index];
}

export async function deleteBlogAccount(id: number): Promise<boolean> {
  const accounts = getAccounts();
  const filtered = accounts.filter(a => a.id !== id);
  if (filtered.length === accounts.length) {
    return false;
  }
  saveAccounts(filtered);
  return true;
}

export async function getAccountsByPlatform(platform: BlogPlatformType): Promise<BlogAccount[]> {
  const accounts = await getBlogAccounts();
  return accounts.filter(a => a.platform === platform);
}

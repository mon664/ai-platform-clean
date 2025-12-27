import { loadAccounts, saveAccounts } from './gcs-storage';

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
  blogName: string;
  tistoryId: string;
  tistoryPassword: string;
  tistoryUrl?: string;
}

export type BlogAccount = WordPressAccount | TistoryAccount;

async function getAccounts(): Promise<BlogAccount[]> {
  return await loadAccounts();
}

async function saveAccountsData(accounts: BlogAccount[]): Promise<void> {
  await saveAccounts(accounts);
}

export async function getBlogAccounts(): Promise<BlogAccount[]> {
  return await getAccounts();
}

export async function createWordPressAccount(data: {
  name: string;
  siteUrl: string;
  username: string;
  applicationPassword: string;
}): Promise<WordPressAccount> {
  const accounts = await getAccounts();
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
  await saveAccountsData(accounts);
  return newAccount;
}

export async function createTistoryAccount(data: {
  name: string;
  blogName: string;
  tistoryId: string;
  tistoryPassword: string;
  tistoryUrl?: string;
}): Promise<TistoryAccount> {
  const accounts = await getAccounts();
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
  await saveAccountsData(accounts);
  return newAccount;
}

export async function createBlogAccount(data: any): Promise<BlogAccount> {
  const platform = data.platform || 'other';
  if (platform === 'wordpress') {
    return createWordPressAccount(data);
  } else if (platform === 'tistory') {
    return createTistoryAccount(data);
  }

  const accounts = await getAccounts();
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
  await saveAccountsData(accounts);
  return newAccount;
}

export async function updateBlogAccount(id: number, data: any): Promise<BlogAccount | null> {
  const accounts = await getAccounts();
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

  await saveAccountsData(accounts);
  return accounts[index];
}

export async function deleteBlogAccount(id: number): Promise<boolean> {
  const accounts = await getAccounts();
  const filtered = accounts.filter(a => a.id !== id);
  if (filtered.length === accounts.length) {
    return false;
  }
  await saveAccountsData(filtered);
  return true;
}

export async function getAccountsByPlatform(platform: BlogPlatformType): Promise<BlogAccount[]> {
  const accounts = await getBlogAccounts();
  return accounts.filter(a => a.platform === platform);
}

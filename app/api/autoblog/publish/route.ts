import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { loadBloggerTokens, loadAccounts } from '@/lib/autoblog/local-storage';
import { getBlogAccounts, getAccountsByPlatform } from '@/lib/autoblog/accounts-storage';

const STORAGE_DIR = path.join(process.cwd(), '.autoblog-storage');
const POSTS_FILE = path.join(STORAGE_DIR, 'posts.json');

function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

interface WordPressPost {
  title: string;
  content: string;
  status: 'draft' | 'publish' | 'pending';
}

interface WordPressCredentials {
  siteUrl: string;
  username: string;
  applicationPassword: string;
}

interface TistoryCredentials {
  blogName: string;
  accessToken: string;
}

async function publishToWordPress(post: any, credentials: WordPressCredentials): Promise<{ url: string; id: number }> {
  const { siteUrl, username, applicationPassword } = credentials;
  const apiBaseUrl = siteUrl.replace(/\/$/, '');
  const endpoint = apiBaseUrl + '/wp-json/wp/v2/posts';
  const auth = Buffer.from(username + ':' + applicationPassword).toString('base64');

  const wpPost: WordPressPost = {
    title: post.title,
    content: post.content,
    status: 'draft'
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + auth,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(wpPost)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error('WordPress API error: ' + response.status + ' - ' + errorText);
  }

  const data = await response.json();
  return { url: data.link, id: data.id };
}

async function publishToTistory(post: any, credentials: TistoryCredentials): Promise<{ url: string; postId: string }> {
  const { blogName, accessToken } = credentials;
  const endpoint = 'https://www.tistory.com/apis/post/write';

  const formData = new URLSearchParams();
  formData.append('output', 'json');
  formData.append('access_token', accessToken);
  formData.append('blogName', blogName);
  formData.append('title', post.title);
  formData.append('content', post.content);
  formData.append('visibility', '3');
  formData.append('tag', post.tags ? post.tags.join(',') : 'AI,AutoBlog');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData.toString()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error('Tistory API error: ' + response.status + ' - ' + errorText);
  }

  const data = await response.json();

  if (data.error !== '0') {
    const errorMsg = data.tistory?.error_message || data.error_message || data.error;
    throw new Error('Tistory API error: ' + errorMsg);
  }

  const postId = data.tistory?.postId?.toString() || data.postId;
  const tistoryUrl = 'https://' + blogName + '.tistory.com/' + postId;

  return { url: tistoryUrl, postId };
}

export async function POST(request: NextRequest) {
  try {
    const { slug, accountId, platform = 'blogger', wordpressCredentials, tistoryCredentials } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    ensureStorageDir();
    if (!fs.existsSync(POSTS_FILE)) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
    const post = posts.find((p: any) => p.slug === slug);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (platform === 'wordpress') {
      let credentials = wordpressCredentials;

      // 요청에 자격 증명이 없으면 저장소에서 가져오기
      if (!credentials) {
        const apiAccounts = await getAccountsByPlatform('wordpress');
        if (apiAccounts.length === 0) {
          return NextResponse.json({ error: 'WordPress 계정을 먼저 등록해주세요.' }, { status: 400 });
        }
        const account = apiAccounts.find((a: any) => a.id === accountId) || apiAccounts[0];
        credentials = {
          siteUrl: (account as any).siteUrl,
          username: (account as any).username,
          applicationPassword: (account as any).applicationPassword
        };
      }

      const { siteUrl, username, applicationPassword } = credentials;

      if (!siteUrl || !username || !applicationPassword) {
        return NextResponse.json({ error: 'All WordPress credentials are required' }, { status: 400 });
      }

      try {
        const result = await publishToWordPress(post, { siteUrl, username, applicationPassword });

        return NextResponse.json({
          success: true,
          platform: 'wordpress',
          message: 'WordPress 발행 성공!',
          publishedUrl: result.url,
          postId: result.id
        });
      } catch (wpError: any) {
        console.error('[Publish] WordPress error:', wpError);
        return NextResponse.json({ error: wpError.message || 'WordPress 발행 실패' }, { status: 500 });
      }
    }

    if (platform === 'tistory') {
      // Tistory 계정 정보 가져오기
      const apiAccounts = await getAccountsByPlatform('tistory');
      if (apiAccounts.length === 0) {
        return NextResponse.json({ error: 'Tistory 계정을 먼저 등록해주세요.' }, { status: 400 });
      }
      const account = apiAccounts.find((a: any) => a.id === accountId) || apiAccounts[0];

      if (!account) {
        return NextResponse.json({ error: 'Tistory 계정을 찾을 수 없습니다.' }, { status: 404 });
      }

      try {
        // Puppeteer로 직접 발행
        const { publishToTistory: publishWithPuppeteer } = await import('@/lib/autoblog/tistory-puppeteer');
        const result = await publishWithPuppeteer(post, {
          blogName: (account as any).blogName,
          tistoryId: (account as any).tistoryId,
          tistoryPassword: (account as any).tistoryPassword
        });

        return NextResponse.json({
          success: true,
          platform: 'tistory',
          message: 'Tistory 발행 성공!',
          publishedUrl: result.url,
          postId: result.postId
        });
      } catch (tistoryError: any) {
        console.error('[Publish] Tistory error:', tistoryError);
        return NextResponse.json({ error: tistoryError.message || 'Tistory 발행 실패' }, { status: 500 });
      }
    }

    // Blogger
    const accounts = await loadAccounts();
    if (accounts.length === 0) {
      return NextResponse.json({ error: '연결된 Blogger 계정이 없습니다.' }, { status: 400 });
    }

    const account = accountId ? accounts.find((a: any) => a.id === accountId) : accounts[0];

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    let accessToken = account.accessToken;
    if (Date.now() > account.expiresAt) {
      return NextResponse.json({ error: '액세스 토큰이 만료되었습니다. 다시 연결해주세요.' }, { status: 401 });
    }

    const blogsResponse = await fetch('https://www.googleapis.com/blogger/v3/users/self/blogs', {
      headers: { Authorization: 'Bearer ' + accessToken }
    });

    if (!blogsResponse.ok) {
      return NextResponse.json({ error: '블로그 목록을 가져올 수 없습니다.' }, { status: 400 });
    }

    const blogsData = await blogsResponse.json();

    if (!blogsData.items || blogsData.items.length === 0) {
      return NextResponse.json({ error: '블로그를 찾을 수 없습니다.' }, { status: 404 });
    }

    const blogId = blogsData.items[0].id;

    const publishResponse = await fetch(
      'https://www.googleapis.com/blogger/v3/blogs/' + blogId + '/posts/',
      {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: post.title,
          content: post.content,
          labels: ['AI Generated', 'AlphaAutoBlog']
        })
      }
    );

    if (!publishResponse.ok) {
      const errorText = await publishResponse.text();
      return NextResponse.json({ error: '발행 실패: ' + errorText }, { status: 500 });
    }

    const publishedPost = await publishResponse.json();

    return NextResponse.json({
      success: true,
      platform: 'blogger',
      message: 'Blogger 발행 성공!',
      publishedUrl: publishedPost.url,
      postId: publishedPost.id,
      blogId,
      blogName: blogsData.items[0].name
    });
  } catch (error: any) {
    console.error('[Publish] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to publish post' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    platforms: [
      {
        id: 'blogger',
        name: 'Google Blogger',
        description: 'Google Blogger에 발행',
        requiresAuth: true
      },
      {
        id: 'wordpress',
        name: 'WordPress',
        description: 'WordPress 사이트에 REST API로 발행',
        requiresAuth: true,
        credentials: ['siteUrl', 'username', 'applicationPassword']
      },
      {
        id: 'tistory',
        name: 'Tistory',
        description: 'Tistory 블로그에 API로 발행',
        requiresAuth: true,
        credentials: ['blogName', 'accessToken']
      }
    ]
  });
}

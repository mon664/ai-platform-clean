import { NextRequest, NextResponse } from 'next/server';
import { BloggerAPI } from '@/lib/autoblog/blogger-api';

// Google OAuth 인증 시작
export async function GET(request: NextRequest) {
  try {
    const blogger = new BloggerAPI();
    const authUrl = blogger.getAuthUrl();

    return NextResponse.json({
      success: true,
      authUrl,
      message: 'Google OAuth authentication URL generated'
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// OAuth 콜백 처리
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    const blogger = new BloggerAPI();
    const tokens = await blogger.getTokens(code);

    // 블로그 목록 테스트
    blogger.setCredentials(tokens);
    const blogs = await blogger.listBlogs();

    if (blogs.length === 0) {
      return NextResponse.json(
        { error: 'No blogs found for this account' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tokens,
      blogs,
      message: 'Successfully authenticated with Blogger'
    });
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Authentication failed' },
      { status: 500 }
    );
  }
}
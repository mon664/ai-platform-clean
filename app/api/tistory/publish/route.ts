import { createTistoryClient, validateTistoryConfig, TistoryConfig } from '@/lib/tistory';
import { NextRequest, NextResponse } from 'next/server';

// GET - OAuth 인증 URL 생성 및 블로그 정보 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('clientId');
    const clientSecret = searchParams.get('clientSecret');
    const redirectUri = searchParams.get('redirectUri');
    const accessToken = searchParams.get('accessToken');
    const action = searchParams.get('action') || 'auth';

    // OAuth 인증 URL 생성
    if (action === 'auth') {
      if (!clientId || !redirectUri) {
        return NextResponse.json(
          { error: 'Client ID와 Redirect URI가 필요합니다' },
          { status: 400 }
        );
      }

      const config: TistoryConfig = {
        clientId,
        clientSecret: '',
        redirectUri,
      };

      const client = createTistoryClient(config);
      const authUrl = client.getAuthorizationUrl();

      return NextResponse.json({
        success: true,
        authUrl,
        message: '아래 URL로 접속하여 인증을 완료하세요'
      });
    }

    // 블로그 정보 조회 (토큰이 있는 경우)
    if (action === 'blogs') {
      if (!clientId || !clientSecret || !redirectUri || !accessToken) {
        return NextResponse.json(
          { error: '모든 설정 정보와 Access Token이 필요합니다' },
          { status: 400 }
        );
      }

      const config: TistoryConfig = {
        clientId,
        clientSecret,
        redirectUri,
        accessToken,
      };

      const client = createTistoryClient(config);
      const blogInfo = await client.getBlogInfo();

      return NextResponse.json({
        success: true,
        blogs: blogInfo.blogs,
      });
    }

    return NextResponse.json(
      { error: '잘못된 요청입니다' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Tistory GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '요청 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// POST - 토큰 받기 또는 글 발행
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action,
      clientId,
      clientSecret,
      redirectUri,
      code,
      accessToken,
      blogName,
      title,
      content,
      visibility = 2, // 2: 공개
      tag,
    } = body;

    // 액션: 토큰 받기
    if (action === 'token') {
      if (!clientId || !clientSecret || !redirectUri || !code) {
        return NextResponse.json(
          { error: 'Client ID, Client Secret, Redirect URI, Authorization Code가 필요합니다' },
          { status: 400 }
        );
      }

      const config: TistoryConfig = {
        clientId,
        clientSecret,
        redirectUri,
      };

      const client = createTistoryClient(config);
      const tokenResponse = await client.getAccessToken(code);

      return NextResponse.json({
        success: true,
        accessToken: tokenResponse.access_token,
        expiresIn: tokenResponse.expires_in,
        message: 'Access Token을 받았습니다!'
      });
    }

    // 액션: 글 발행
    if (action === 'publish') {
      if (!clientId || !clientSecret || !redirectUri || !accessToken) {
        return NextResponse.json(
          { error: '모든 설정 정보와 Access Token이 필요합니다' },
          { status: 400 }
        );
      }

      if (!blogName || !title || !content) {
        return NextResponse.json(
          { error: '블로그 이름, 제목, 내용은 필수 항목입니다' },
          { status: 400 }
        );
      }

      const config: TistoryConfig = {
        clientId,
        clientSecret,
        redirectUri,
        accessToken,
      };

      const client = createTistoryClient(config);

      const result = await client.writePost({
        blogName,
        title,
        content,
        visibility,
        tag,
      });

      return NextResponse.json({
        success: true,
        postId: result.postId,
        url: result.url,
        message: '블로그 게시글이 성공적으로 발행되었습니다!'
      });
    }

    return NextResponse.json(
      { error: '잘못된 요청입니다. action 파라미터를 확인하세요.' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Tistory POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '요청 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

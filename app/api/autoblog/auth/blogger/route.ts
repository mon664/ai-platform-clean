import { NextRequest, NextResponse } from 'next/server';
import { loadApiKeysLocally } from '@/lib/autoblog/local-storage';

/**
 * GET: Blogger OAuth 인증 시작
 */
export async function GET(request: NextRequest) {
  try {
    const apiKeys = await loadApiKeysLocally();
    const clientId = apiKeys.googleClientId;
    const clientSecret = apiKeys.googleClientSecret;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Google Client ID와 Secret이 필요합니다. 설정 페이지에서 입력해주세요.' },
        { status: 400 }
      );
    }

    // OAuth 2.0 인증 URL 생성
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/autoblog/auth/callback`;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=https://www.googleapis.com/auth/blogger&` +
      `access_type=offline&` +
      `prompt=consent`;

    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error('[Blogger Auth] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}

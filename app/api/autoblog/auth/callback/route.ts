import { NextRequest, NextResponse } from 'next/server';
import { loadApiKeys, saveBloggerTokens, saveBlogAccount } from '@/lib/autoblog/gcs-storage';

/**
 * GET: Blogger OAuth 콜백 처리
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL('/autoblog/accounts?error=' + error, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/autoblog/accounts?error=no_code', request.url)
      );
    }

    // API 키 로드
    const apiKeys = await loadApiKeys();
    const clientId = apiKeys.googleClientId;
    const clientSecret = apiKeys.googleClientSecret;

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/autoblog/accounts?error=no_credentials', request.url)
      );
    }

    // 토큰 교환
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/api/autoblog/auth/callback`;
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[Blogger Callback] Token exchange failed:', errorText);
      return NextResponse.redirect(
        new URL('/autoblog/accounts?error=token_exchange_failed', request.url)
      );
    }

    const tokens = await tokenResponse.json();

    // 토큰 저장
    await saveBloggerTokens(tokens);

    // 블로그 정보 가져오기
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    const userInfo = await userInfoResponse.json();

    // 계정 정보 저장
    const account = {
      id: userInfo.id,
      platform: 'blogger',
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in * 1000),
      connectedAt: new Date().toISOString()
    };

    await saveBlogAccount(account);

    return NextResponse.redirect(
      new URL('/autoblog/accounts?success=true', request.url)
    );
  } catch (error: any) {
    console.error('[Blogger Callback] Error:', error);
    return NextResponse.redirect(
      new URL('/autoblog/accounts?error=' + encodeURIComponent(error.message), request.url)
    );
  }
}

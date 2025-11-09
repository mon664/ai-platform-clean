import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

// 관리자 페이지 보호를 위한 미들웨어
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin 경로만 보호 (로그인 페이지 제외)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    // 쿠키에서 토큰 확인
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      // 토큰이 없으면 로그인 페이지로 리다이렉트
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // 토큰 검증
    const payload = verifyToken(token);
    if (!payload) {
      // 유효하지 않은 토큰이면 로그인 페이지로 리다이렉트
      const loginUrl = new URL('/admin/login', request.url);

      // 쿠키 삭제
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('auth-token');
      return response;
    }
  }

  return NextResponse.next();
}

// 미들웨어가 적용될 경로 설정
export const config = {
  matcher: ['/admin/:path*']
};
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // 로그아웃 성공 응답
    const response = NextResponse.json({
      success: true,
      message: '로그아웃 성공'
    });

    // 쿠키에서 토큰 삭제
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // 즉시 만료
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
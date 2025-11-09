import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // 입력값 검증
    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 관리자 인증
    if (!verifyAdmin(email, password)) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // JWT 토큰 생성
    const token = generateToken(email);

    // 성공 응답
    const response = NextResponse.json({
      success: true,
      message: '로그인 성공',
      token,
      user: {
        email,
        role: 'admin'
      }
    });

    // HTTP-only 쿠키에 토큰 설정 (보안 강화)
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30일
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET 요청 - 현재 로그인 상태 확인
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false, error: '토큰이 없습니다.' },
        { status: 401 }
      );
    }

    // 토큰 검증은 미들웨어나 다른 API에서 처리
    return NextResponse.json({
      authenticated: true,
      message: '로그인 상태입니다.'
    });

  } catch (error) {
    console.error('Login status check error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
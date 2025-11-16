import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin, generateToken, verifyToken } from '@/lib/auth';

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
    // OPTIONS 요청 처리
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Vercel SSO 토큰 확인 및 무시
    const authToken = request.cookies.get('auth-token')?.value;
    const vercelJwt = request.cookies.get('_vercel_jwt')?.value;

    // Vercel JWT가 있으면 무시하고 false 반환
    if (vercelJwt && !authToken) {
      return NextResponse.json(
        { authenticated: false },
        {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          }
        }
      );
    }

    if (!authToken) {
      return NextResponse.json(
        { authenticated: false },
        {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          }
        }
      );
    }

    // 토큰 실제 검증
    const decoded = verifyToken(authToken);

    if (!decoded) {
      return NextResponse.json(
        { authenticated: false },
        {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          }
        }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        email: decoded.email
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });

  } catch (error) {
    console.error('Login status check error:', error);
    return NextResponse.json(
      { authenticated: false },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
      }
    );
  }
}
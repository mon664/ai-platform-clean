import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export interface JWTPayload {
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT 토큰 생성
 */
export function generateToken(email: string): string {
  return jwt.sign(
    { email },
    JWT_SECRET,
    { expiresIn: '30d' } // 30일 유효
  );
}

/**
 * JWT 토큰 검증
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * 관리자 인증 확인
 */
export function verifyAdmin(email: string, password: string): boolean {
  return email === ADMIN_EMAIL && password === ADMIN_PASSWORD;
}

/**
 * NextRequest에서 토큰 추출 및 검증
 */
export function authenticateRequest(req: NextRequest): JWTPayload | null {
  // Authorization 헤더에서 토큰 추출
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7); // "Bearer " 제거
  return verifyToken(token);
}

/**
 * 관리자 권한 확인 (미들웨어)
 */
export function requireAuth(req: NextRequest): { authorized: boolean; error?: string } {
  const user = authenticateRequest(req);

  if (!user) {
    return { authorized: false, error: '로그인이 필요합니다' };
  }

  if (user.email !== ADMIN_EMAIL) {
    return { authorized: false, error: '관리자 권한이 필요합니다' };
  }

  return { authorized: true };
}

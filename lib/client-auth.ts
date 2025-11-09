/**
 * 클라이언트 사이드 인증 유틸리티
 */

/**
 * 로컬 스토리지에서 토큰 가져오기
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

/**
 * 로그인 상태 확인
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

/**
 * 로그아웃
 */
export function logout() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_email');
  window.location.href = '/';
}

/**
 * API 호출 시 Authorization 헤더 추가
 */
export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  if (!token) {
    return {};
  }
  return {
    'Authorization': `Bearer ${token}`
  };
}

/**
 * Fetch with Auth - 인증이 필요한 API 호출
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAuthToken();

  if (!token) {
    // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
    window.location.href = '/admin/login';
    throw new Error('로그인이 필요합니다');
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  // 401 오류 시 로그인 페이지로 리다이렉트
  if (response.status === 401) {
    logout();
    window.location.href = '/admin/login';
    throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
  }

  return response;
}

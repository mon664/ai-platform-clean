"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalUsers: 0,
    recentActivity: []
  });
  const router = useRouter();

  // 인증 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 먼저 localStorage 확인
        const authToken = localStorage.getItem('auth-token');
        
        if (!authToken) {
          // 토큰이 없으면 바로 로그인 페이지로
          window.location.href = '/admin/login';
          return;
        }

        // 서버에 인증 상태 확인
        const response = await fetch('/api/auth/login', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });

        const data = await response.json();
        
        if (!data.authenticated) {
          // 인증 실패 - localStorage 정리하고 로그인 페이지로
          localStorage.removeItem('auth-token');
          localStorage.removeItem('user-info');
          window.location.href = '/admin/login';
          return;
        }

        // 인증 성공 - 사용자 정보 설정
        const userInfo = localStorage.getItem('user-info');
        if (userInfo) {
          setUser(JSON.parse(userInfo));
        } else {
          setUser(data.user);
        }

        // 기본 통계 데이터 설정
        setStats({
          totalPosts: 12,
          totalUsers: 3,
          recentActivity: [
            { id: 1, action: '새 블로그 글 생성', time: '2분 전', user: 'Admin' },
            { id: 2, action: '쇼츠 생성기 사용', time: '15분 전', user: 'Admin' },
            { id: 3, action: 'TTS 생성', time: '1시간 전', user: 'Admin' },
            { id: 4, action: '로그인', time: '2시간 전', user: 'Admin' }
          ]
        });

        setLoading(false);

      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('auth-token');
        localStorage.removeItem('user-info');
        window.location.href = '/admin/login';
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      // localStorage 정리
      localStorage.removeItem('auth-token');
      localStorage.removeItem('user-info');

      // 서버에 로그아웃 요청 (쿠키 삭제)
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      // 완전한 페이지 전환
      window.location.href = '/admin/login';
    } catch (error) {
      console.error('Logout error:', error);
      // 에러가 발생해도 로그아웃 처리
      window.location.href = '/admin/login';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600">관리자 대시보드 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">AI Platform 관리자</h1>
              <span className="ml-4 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                Online
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.email || '관리자'}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                관리자 대시보드에 오신 것을 환영합니다!
              </h2>
              <p className="text-sm text-gray-600">
                AI Platform의 모든 기능을 관리하고 모니터링할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 px-4 sm:px-0">
          {/* Total Posts */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">전체 블로그 글</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{stats.totalPosts}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Users */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">등록 사용자</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">시스템 상태</dt>
                    <dd className="text-lg font-semibold text-green-600">정상</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-6 sm:px-0">
          <h3 className="text-lg font-medium text-gray-900 mb-4">빠른 기능</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <a href="/blog/write" className="bg-white p-6 text-center rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h4 className="text-sm font-medium text-gray-900">블로그 글쓰기</h4>
              <p className="text-xs text-gray-500 mt-1">새로운 블로그 글 작성</p>
            </a>

            <a href="/auto-blog" className="bg-white p-6 text-center rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-sm font-medium text-gray-900">AI 자동 블로그</h4>
              <p className="text-xs text-gray-500 mt-1">AI가 자동으로 블로그 생성</p>
            </a>

            <a href="/shorts" className="bg-white p-6 text-center rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-sm font-medium text-gray-900">쇼츠 생성기</h4>
              <p className="text-xs text-gray-500 mt-1">유튜브 쇼츠 자동 생성</p>
            </a>

            <a href="/chat" className="bg-white p-6 text-center rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h4 className="text-sm font-medium text-gray-900">AI 채팅</h4>
              <p className="text-xs text-gray-500 mt-1">AI와 대화하기</p>
            </a>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="px-4 py-6 sm:px-0">
          <h3 className="text-lg font-medium text-gray-900 mb-4">최근 활동</h3>
          <div className="bg-white shadow rounded-lg">
            <div className="divide-y divide-gray-200">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-500">{activity.user} • {activity.time}</p>
                    </div>
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
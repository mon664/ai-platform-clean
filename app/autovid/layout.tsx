'use client';

import Navigation from '../components/Navigation';

export default function AutoVidLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <Navigation />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* AutoVid 헤더 */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <span className="animate-pulse">🎬</span>
              AutoVid 통합 시스템
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              자동 영상 생성 플랫폼
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto">
              AI 기반의 강력한 자동 영상 생성 시스템으로
              고품질 콘텐츠를 손쉽게 만들어보세요
            </p>
          </div>

          {/* 페이지 콘텐츠 */}
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
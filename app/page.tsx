import Link from 'next/link'

export default function Home() {
  const features = [
    {
      title: '자동 블로그',
      description: 'AI가 자동으로 블로그 포스트를 생성합니다',
      href: '/auto-blog',
      icon: '📝'
    },
    {
      title: '블로그 관리',
      description: '블로그 포스트를 작성하고 관리합니다',
      href: '/blog',
      icon: '📚'
    },
    {
      title: 'AI 챗봇',
      description: '다양한 AI 모델과 대화할 수 있습니다',
      href: '/chat',
      icon: '💬'
    },
    {
      title: 'AI 캐릭터',
      description: '캐릭터 기반 AI 대화 시스템',
      href: '/character',
      icon: '🎭'
    },
    {
      title: '스토리 생성',
      description: 'AI가 창의적인 스토리를 만듭니다',
      href: '/story',
      icon: '📖'
    },
    {
      title: '쇼츠 생성',
      description: '유튜브 쇼츠 콘텐츠를 생성합니다',
      href: '/shorts',
      icon: '🎬'
    },
    {
      title: 'TTS 생성',
      description: '텍스트를 음성으로 변환합니다',
      href: '/tts',
      icon: '🔊'
    },
    {
      title: 'BOM 관리',
      description: '자재 명세서를 관리합니다',
      href: '/modules/bom',
      icon: '📋'
    },
    {
      title: 'HACCP',
      description: 'HACCP 관리 시스템',
      href: '/modules/haccp',
      icon: '🏭'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">
                🤖 AI Platform
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            통합 AI 플랫폼
          </h2>
          <p className="text-xl text-gray-600">
            다양한 AI 기능을 하나의 플랫폼에서 경험하세요
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 hover:scale-105 transform duration-200"
            >
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              🚀 시작하기
            </h3>
            <p className="text-gray-600 mb-6">
              위의 기능 중 하나를 선택하여 시작하세요
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/auto-blog"
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                자동 블로그 시작
              </Link>
              <Link
                href="/chat"
                className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                AI 챗봇 사용
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white mt-20 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600">
            © 2025 AI Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

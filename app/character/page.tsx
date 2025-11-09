'use client'
import { useState } from 'react'
import Navigation from '../components/Navigation'

export default function CharacterPage() {
  const [prompt, setPrompt] = useState('')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState('')

  const generateCharacter = async () => {
    if (!prompt.trim()) {
      setError('프롬프트를 입력해주세요')
      return
    }

    setLoading(true)
    setError('')
    setImageUrl('')

    try {
      const res = await fetch('/api/character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, aspectRatio })
      })

      if (!res.ok) throw new Error('이미지 생성 실패')

      const data = await res.json()
      setImageUrl(data.imageUrl)
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const downloadImage = () => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `character-${Date.now()}.png`
    link.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Navigation />
      <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-center">캐릭터 이미지 생성기</h1>
        <p className="text-gray-400 text-center mb-8">YouTube 썸네일 & AI 스토리 주인공용</p>

        {/* 프롬프트 입력 */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <label className="block text-lg font-semibold mb-3">캐릭터 설명</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="예: A beautiful Korean woman in her 20s with long black hair, smiling, wearing casual clothes, professional portrait photo"
            className="w-full h-32 bg-gray-700 text-white rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 사진 크기 선택 */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <label className="block text-lg font-semibold mb-3">사진 비율</label>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            className="w-full bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1:1">1:1 (정사각형 - 인스타그램, 프로필)</option>
            <option value="16:9">16:9 (가로형 - YouTube 썸네일)</option>
            <option value="9:16">9:16 (세로형 - 쇼츠, 릴스)</option>
            <option value="4:3">4:3 (가로형 - 클래식)</option>
            <option value="3:4">3:4 (세로형 - 포트레이트)</option>
          </select>
        </div>

        {/* 생성 버튼 */}
        <button
          onClick={generateCharacter}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg text-xl transition-colors mb-6"
        >
          {loading ? '생성 중...' : '캐릭터 생성하기'}
        </button>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* 결과 이미지 */}
        {imageUrl && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">생성된 캐릭터</h2>
            <div className="relative">
              <img
                src={imageUrl}
                alt="Generated character"
                className="w-full rounded-lg shadow-lg"
              />
              <button
                onClick={downloadImage}
                className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                다운로드
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-4">
              💡 이 이미지를 <a href="/story" className="text-blue-400 hover:underline">AI 스토리 생성기</a>에 업로드하여 일관성 있는 장면을 만들 수 있습니다.
            </p>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

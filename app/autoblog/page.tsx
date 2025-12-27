'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TEXT_MODELS, IMAGE_MODELS, calculateTextCost, calculateImageCost } from '@/lib/autoblog/models';

interface GeneratedPost {
  slug: string;
  title: string;
  content: string;
  tokensUsed: number;
  imagesGenerated: number;
  totalCost: number;
  timestamp: string;
}

export default function AlphaAutoBlogPage() {
  const router = useRouter();
  const [apiKeysConfigured, setApiKeysConfigured] = useState(false);
  const [settings, setSettings] = useState({
    textModel: 'gemini-2.0-flash-exp',
    imageModel: 'vertex-ai-imagen',
    title: '',
    category: 'general',
    keywords: '',
    targetTokens: 2000,
    imageCount: 3,
    enableFinishing: false,
  });

  const [estimatedCost, setEstimatedCost] = useState({
    text: 0,
    image: 0,
    total: 0,
  });

  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [improvingTitle, setImprovingTitle] = useState(false);
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);

  // API 키 설정 확인
  useEffect(() => {
    async function checkApiKeys() {
      try {
        const res = await fetch('/api/autoblog/api-keys');
        const data = await res.json();
        const keys = data.apiKeys || {};
        setApiKeysConfigured(Object.keys(keys).length > 0);
      } catch (error) {
        console.error('Failed to check API keys:', error);
      }
    }
    checkApiKeys();
  }, []);

  // 비용 계산
  useEffect(() => {
    const textCost = calculateTextCost(settings.textModel, settings.targetTokens);
    const imageCost = calculateImageCost(settings.imageModel, settings.imageCount);
    const total = textCost + imageCost;
    setEstimatedCost({ text: textCost, image: imageCost, total });
  }, [settings]);

  const handleGenerate = async () => {
    if (!settings.title.trim()) {
      alert('제목을 입력하세요');
      return;
    }

    if (!apiKeysConfigured) {
      alert('API 키를 먼저 설정해주세요. 설정 페이지로 이동합니다.');
      router.push('/autoblog/settings');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/autoblog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      console.log('[Generate] Response status:', res.status);

      if (!res.ok) {
        const error = await res.json();
        console.error('[Generate] Error response:', error);
        throw new Error(error.error || '생성 실패');
      }

      const data = await res.json();
      console.log('[Generate] Response data:', data);
      setGeneratedPost(data);
      setShowResult(true);

      // 제목 초기화
      setSettings({ ...settings, title: '' });
    } catch (e: any) {
      console.error('[Generate] Exception:', e);
      alert(e.message || '생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseResult = () => {
    setShowResult(false);
    setGeneratedPost(null);
  };

  const handleImproveTitle = async () => {
    if (!settings.title.trim()) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    if (!apiKeysConfigured) {
      alert('API 키를 먼저 설정해주세요.');
      router.push('/autoblog/settings');
      return;
    }

    setImprovingTitle(true);
    setSuggestedTitles([]);

    try {
      const res = await fetch('/api/autoblog/improve-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: settings.title })
      });

      if (!res.ok) {
        throw new Error('제목 개선 실패');
      }

      const data = await res.json();
      setSuggestedTitles(data.titles || []);
    } catch (error: any) {
      alert(error.message || '제목 개선 중 오류가 발생했습니다.');
    } finally {
      setImprovingTitle(false);
    }
  };

  const selectSuggestedTitle = (title: string) => {
    setSettings({ ...settings, title });
    setSuggestedTitles([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        {/* 헤더 */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              🤖 AlphaAutoBlog
            </h1>
            <p className="text-gray-300 mt-2">
              AI 기반 블로그 자동 생성 및 발행 시스템
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/autoblog/accounts')}
              className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg"
            >
              📝 계정 관리
            </button>
            <button
              onClick={() => router.push('/autoblog/settings')}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
            >
              ⚙️ API 키 설정
            </button>
          </div>
        </header>

        {/* API 키 경고 */}
        {!apiKeysConfigured && (
          <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4">
            <p className="text-sm text-yellow-200">
              ⚠️ <strong>API 키가 설정되지 않았습니다.</strong>{' '}
              <button
                onClick={() => router.push('/autoblog/settings')}
                className="underline hover:text-white"
              >
                설정 페이지
              </button>
              {' '}에서 API 키를 입력해주세요.
            </p>
          </div>
        )}

        {/* 생성 설정 */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 space-y-6 border border-slate-700">
          <h2 className="text-2xl font-bold">📝 글 생성 설정</h2>

          {/* 제목 입력 */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">제목 (필수)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings.title}
                onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                placeholder="예: 점심 특가 메뉴로 매출 2배 올린 비결"
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={handleImproveTitle}
                disabled={improvingTitle || !settings.title.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 font-semibold whitespace-nowrap"
              >
                ✨ AI 개선
              </button>
            </div>

            {/* AI 추천 제목 목록 */}
            {suggestedTitles.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-gray-400">💡 AI 추천 제목 (클릭하여 선택):</p>
                {suggestedTitles.map((suggested, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectSuggestedTitle(suggested)}
                    className="w-full text-left bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm text-gray-200 hover:text-white transition-colors"
                  >
                    {idx + 1}. {suggested}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">카테고리</label>
            <select
              value={settings.category}
              onChange={(e) => setSettings({ ...settings, category: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="general">일반</option>
              <option value="business">비즈니스</option>
              <option value="tech">기술</option>
              <option value="lifestyle">라이프스타일</option>
              <option value="marketing">마케팅</option>
              <option value="education">교육</option>
            </select>
          </div>

          {/* 키워드 */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">키워드 (쉼표로 구분)</label>
            <input
              type="text"
              value={settings.keywords}
              onChange={(e) => setSettings({ ...settings, keywords: e.target.value })}
              placeholder="예: 점심특가, 회전율, 메뉴단순화"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* AI 모델 선택 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">텍스트 생성 모델</label>
              <select
                value={settings.textModel}
                onChange={(e) => setSettings({ ...settings, textModel: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {TEXT_MODELS.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name} - ${model.costPer1kTokens?.toFixed(4) || '0'}/1k토큰
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">이미지 생성 모델</label>
              <select
                value={settings.imageModel}
                onChange={(e) => setSettings({ ...settings, imageModel: e.target.value })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {IMAGE_MODELS.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name} - ${model.costPerImage?.toFixed(2) || '0'}/장
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 토큰 수 & 이미지 개수 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                목표 토큰 수 (글 길이)
              </label>
              <input
                type="number"
                value={settings.targetTokens}
                onChange={(e) => setSettings({ ...settings, targetTokens: parseInt(e.target.value) || 500 })}
                min={500}
                max={10000}
                step={100}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                약 {Math.round(settings.targetTokens * 0.75)}자 ({Math.ceil(settings.targetTokens * 0.75 / 500)}분 읽기)
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2">이미지 개수</label>
              <input
                type="number"
                value={settings.imageCount}
                onChange={(e) => setSettings({ ...settings, imageCount: parseInt(e.target.value) || 0 })}
                min={0}
                max={10}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* 마감 처리 */}
          <div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableFinishing}
                onChange={(e) => setSettings({ ...settings, enableFinishing: e.target.checked })}
                className="w-5 h-5 accent-purple-600"
              />
              <span className="text-sm font-semibold text-gray-200">
                마감 처리 활성화 (Gemini로 최종 다듬기)
              </span>
            </label>
            <p className="text-xs text-gray-400 mt-1 ml-7">
              문맥을 자연스럽게 다듬고 감성적 표현 추가
            </p>
          </div>

          {/* 예상 비용 */}
          <div className="bg-green-900/30 border border-green-600/50 rounded-lg p-4">
            <p className="text-sm font-semibold text-green-200 mb-2">💰 예상 비용</p>
            <div className="text-xs space-y-1 text-green-100">
              <p>텍스트: ${estimatedCost.text.toFixed(4)}</p>
              <p>이미지: ${estimatedCost.image.toFixed(4)}</p>
              <p className="font-bold text-base text-green-300">
                총: ${estimatedCost.total.toFixed(4)} (약 {(estimatedCost.total * 1400).toFixed(0)}원)
              </p>
            </div>
          </div>

          {/* 생성 버튼 */}
          <button
            onClick={handleGenerate}
            disabled={loading || !settings.title.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-4 rounded-lg text-lg transition-colors"
          >
            {loading ? '생성 중...' : '🚀 지금 생성하기'}
          </button>
        </div>

        {/* 생성 결과 모달 */}
        {showResult && generatedPost && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-slate-800 rounded-xl max-w-4xl w-full my-8 border border-slate-700">
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <h2 className="text-2xl font-bold">✅ 생성 완료!</h2>
                <button
                  onClick={handleCloseResult}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              {/* 모달 내용 */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* 생성 정보 */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-gray-400">토큰 사용</p>
                    <p className="text-xl font-bold text-white">{generatedPost.tokensUsed.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-gray-400">이미지 생성</p>
                    <p className="text-xl font-bold text-white">{generatedPost.imagesGenerated}장</p>
                  </div>
                  <div className="bg-green-900/50 rounded-lg p-3">
                    <p className="text-green-400">실제 비용</p>
                    <p className="text-xl font-bold text-green-300">${generatedPost.totalCost.toFixed(4)}</p>
                  </div>
                </div>

                {/* 콘텐츠 미리보기 */}
                <div>
                  <h3 className="text-lg font-bold mb-3">📄 콘텐츠 미리보기</h3>
                  <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                    <h4 className="text-xl font-bold mb-4">{generatedPost.title}</h4>
                    <div
                      className="prose prose-invert max-w-none text-gray-300"
                      dangerouslySetInnerHTML={{ __html: generatedPost.content }}
                    />
                  </div>
                </div>
              </div>

              {/* 모달 푸터 */}
              <div className="flex justify-end gap-3 p-6 border-t border-slate-700">
                <button
                  onClick={handleCloseResult}
                  className="bg-slate-600 hover:bg-slate-500 px-6 py-2 rounded-lg"
                >
                  닫기
                </button>
                <button
                  onClick={() => router.push('/autoblog/posts')}
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-semibold"
                >
                  📝 생성 목록 보기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

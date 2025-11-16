'use client';

import { useState } from 'react';
import Navigation from '../components/Navigation';

interface GenerationResult {
  success: boolean;
  title?: string;
  content?: string;
  error?: string;
}

export default function AIBlogPage() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [template, setTemplate] = useState('general');

  const generateBlog = async () => {
    if (!keyword.trim()) {
      alert('키워드를 입력해주세요');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/railway-bridge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'content',
          keyword: keyword,
          template: template,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          title: data.title || `${keyword}에 대한 블로그 포스트`,
          content: data.content || '',
        });
      } else {
        setResult({
          success: false,
          error: data.error || '콘텐츠 생성 실패',
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || '서버 오류',
      });
    } finally {
      setLoading(false);
    }
  };

  const publishToBlog = async () => {
    if (!result || !result.title || !result.content) {
      alert('발행할 콘텐츠가 없습니다');
      return;
    }

    try {
      const response = await fetch('/api/blog/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: result.title,
          content: result.content,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert('성공적으로 발행되었습니다!');
        window.location.href = `/blog/${data.slug}`;
      } else {
        alert('발행 실패');
      }
    } catch (error: any) {
      alert('발행 중 오류 발생: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navigation />
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-4xl font-bold mb-2 text-center">AI 자동 블로그 생성기</h1>
        <p className="text-gray-400 text-center mb-8">AI가 키워드로 블로그 포스트를 자동 생성</p>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <label className="block text-lg font-semibold mb-3">키워드</label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="예: AI 기술, 최신 IT 트렌드, 웹 개발 팁..."
            className="w-full bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <label className="block text-lg font-semibold mb-3 mt-4">템플릿</label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="general">일반 블로그</option>
            <option value="tech">IT/기술</option>
            <option value="business">비즈니스</option>
            <option value="lifestyle">라이프스타일</option>
          </select>

          <button
            onClick={generateBlog}
            disabled={loading}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            {loading ? '생성 중...' : '🤖 블로그 포스트 생성'}
          </button>
        </div>

        {result && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">생성된 콘텐츠</h2>
              {result.success && (
                <button
                  onClick={publishToBlog}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  블로그에 발행하기
                </button>
              )}
            </div>

            {result.success ? (
              <div>
                <h3 className="text-xl font-semibold mb-3">{result.title}</h3>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap">{result.content}</pre>
                </div>
              </div>
            ) : (
              <div className="text-red-400">
                <p>❌ {result.error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
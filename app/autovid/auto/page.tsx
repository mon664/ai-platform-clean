'use client';

import { useState } from 'react';

interface GenerationResult {
  title: string;
  script: string[];
  scenes: {
    videoSearchKeyword: string[];
    segmentTitle: string;
    script: string[];
    imageGenPrompt: string;
  }[];
  images: string[];
  status: 'idle' | 'generating' | 'completed' | 'error';
  error?: string;
}

export default function AutoVideoPage() {
  const [subject, setSubject] = useState('');
  const [requestNumber, setRequestNumber] = useState(5);
  const [includeOpening, setIncludeOpening] = useState(true);
  const [includeClosing, setIncludeClosing] = useState(true);
  const [includeImages, setIncludeImages] = useState(true);
  const [result, setResult] = useState<GenerationResult>({
    title: '',
    script: [],
    scenes: [],
    images: [],
    status: 'idle'
  });

  const generateVideo = async () => {
    if (!subject.trim()) {
      alert('주제를 입력해주세요');
      return;
    }

    setResult(prev => ({ ...prev, status: 'generating', error: undefined }));

    try {
      const response = await fetch('/api/autovid/create-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          requestNumber,
          includeOpeningSegment: includeOpening,
          includeClosingSegment: includeClosing,
          includeImageGenPrompt: includeImages
        }),
      });

      if (!response.ok) {
        throw new Error('생성 실패');
      }

      const data = await response.json();
      setResult({
        title: data.title,
        script: data.script,
        scenes: data.snippets,
        images: data.images || [],
        status: 'completed'
      });
    } catch (error: any) {
      setResult(prev => ({
        ...prev,
        status: 'error',
        error: error.message || '생성 중 오류 발생'
      }));
    }
  };

  const generateImages = async () => {
    if (result.scenes.length === 0 || result.status !== 'completed') {
      alert('먼저 스크립트를 생성해주세요');
      return;
    }

    setResult(prev => ({ ...prev, status: 'generating' }));

    try {
      const imagePromises = result.scenes.map(scene =>
        fetch('/api/autovid/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: scene.imageGenPrompt,
            style: 'cinematic'
          }),
        }).then(res => res.json())
      );

      const imageResponses = await Promise.all(imagePromises);
      const images = imageResponses.map(res => res.imageUrl);

      setResult(prev => ({
        ...prev,
        images,
        status: 'completed'
      }));
    } catch (error: any) {
      setResult(prev => ({
        ...prev,
        status: 'error',
        error: '이미지 생성 중 오류 발생: ' + error.message
      }));
    }
  };

  return (
    <div className="space-y-8">
      {/* 헤더 섹션 */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🔥</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">자동 영상 생성</h2>
            <p className="text-gray-300">AI가 주제만으로 완전한 영상 스크립트와 이미지를 생성합니다</p>
          </div>
        </div>

        {/* 설정 패널 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-white font-semibold mb-2">
              주제
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="예: 세상에서 가장 위험한 관광지"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">
              장면 수: {requestNumber}
            </label>
            <input
              type="range"
              min="3"
              max="10"
              value={requestNumber}
              onChange={(e) => setRequestNumber(Number(e.target.value))}
              className="w-full accent-gradient-to-r from-orange-500 to-red-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>3개</span>
              <span>10개</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="opening"
              checked={includeOpening}
              onChange={(e) => setIncludeOpening(e.target.checked)}
              className="w-5 h-5 accent-orange-500"
            />
            <label htmlFor="opening" className="text-white font-medium">
              오프닝 세그먼트 포함
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="closing"
              checked={includeClosing}
              onChange={(e) => setIncludeClosing(e.target.checked)}
              className="w-5 h-5 accent-orange-500"
            />
            <label htmlFor="closing" className="text-white font-medium">
              클로징 세그먼트 포함
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="images"
              checked={includeImages}
              onChange={(e) => setIncludeImages(e.target.checked)}
              className="w-5 h-5 accent-orange-500"
            />
            <label htmlFor="images" className="text-white font-medium">
              이미지 생성 프롬프트 포함
            </label>
          </div>
        </div>

        {/* 생성 버튼 */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={generateVideo}
            disabled={result.status === 'generating'}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
          >
            {result.status === 'generating' ? '⏳ 생성 중...' : '🚀 영상 생성하기'}
          </button>

          {result.status === 'completed' && result.images.length === 0 && includeImages && (
            <button
              onClick={generateImages}
              disabled={result.status === 'generating'}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105"
            >
              🎨 이미지 생성
            </button>
          )}
        </div>
      </div>

      {/* 결과 표시 */}
      {result.status === 'generating' && (
        <div className="bg-blue-500/20 backdrop-blur-md rounded-2xl p-8 border border-blue-500/30 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white font-medium">AI가 영상 콘텐츠를 생성하고 있습니다...</p>
          <p className="text-gray-300 text-sm mt-2">잠시만 기다려주세요</p>
        </div>
      )}

      {result.status === 'error' && (
        <div className="bg-red-500/20 backdrop-blur-md rounded-2xl p-8 border border-red-500/30 text-center">
          <p className="text-red-300 font-medium">❌ {result.error}</p>
        </div>
      )}

      {result.status === 'completed' && result.title && (
        <div className="space-y-6">
          {/* 제목 */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-2">생성된 제목</h3>
            <p className="text-gray-200 text-lg">{result.title}</p>
          </div>

          {/* 스크립트 */}
          {result.script.length > 0 && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">전체 스크립트</h3>
              <div className="space-y-2">
                {result.script.map((line, index) => (
                  <p key={index} className="text-gray-200">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* 장면별 세부 정보 */}
          {result.scenes.length > 0 && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-6">장면별 세부 정보</h3>
              <div className="space-y-6">
                {result.scenes.map((scene, index) => (
                  <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </span>
                      <h4 className="text-lg font-semibold text-white">{scene.segmentTitle}</h4>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h5 className="text-white font-medium mb-1">스크립트:</h5>
                        <div className="text-gray-200">
                          {scene.script.map((line, lineIndex) => (
                            <p key={lineIndex} className="text-sm">{line}</p>
                          ))}
                        </div>
                      </div>

                      {includeImages && scene.imageGenPrompt && (
                        <div>
                          <h5 className="text-white font-medium mb-1">이미지 생성 프롬프트:</h5>
                          <p className="text-gray-300 text-sm">{scene.imageGenPrompt}</p>
                        </div>
                      )}

                      {scene.videoSearchKeyword && scene.videoSearchKeyword.length > 0 && (
                        <div>
                          <h5 className="text-white font-medium mb-1">검색 키워드:</h5>
                          <div className="flex flex-wrap gap-2">
                            {scene.videoSearchKeyword.map((keyword, kwIndex) => (
                              <span key={kwIndex} className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-sm">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 생성된 이미지 */}
          {result.images.length > 0 && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-6">생성된 이미지 ({result.images.length}개)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {result.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Scene ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white font-medium">Scene {index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
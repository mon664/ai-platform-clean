'use client';
import { useState } from 'react';
import Navigation from '@/app/components/Navigation';
import { fetchWithAuth } from '@/lib/client-auth';

export default function ProfitGuidePage() {
  const [postContent, setPostContent] = useState('오늘의 AI 추천 썰: 친구랑 해외여행 갔다가 생긴 대박 웃긴 썰! #AI #유머 #썰');
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleCommunityUpload = async () => {
    setIsUploading(true);
    setUploadStatus('');
    try {
      const res = await fetchWithAuth('/api/profit-guide/community-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: postContent }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '커뮤니티 업로드에 실패했습니다.');
      }
      setUploadStatus(data.message);
    } catch (err: any) {
      setUploadStatus(`오류: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 text-white">
      <Navigation />
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-center text-yellow-300">🚀 울트라 수익화 자동화 프로세스</h1>
          <p className="text-gray-400 text-center mb-8">AI 콘텐츠 생성을 넘어, 실제 수익으로 연결하는 핵심 노하우입니다.</p>

          <div className="space-y-6 bg-gray-800 rounded-lg p-8">
            
            <div className="p-6 bg-gray-700/50 rounded-lg">
              <h2 className="text-2xl font-bold text-yellow-400 mb-3">Step 1: 뉴스픽 & 블로그 연동을 통한 트래픽 극대화</h2>
              <p className="text-gray-300">
                AI가 생성한 '썰' 콘텐츠는 유튜브 쇼츠뿐만 아니라, '뉴스픽'과 같은 외부 채널 및 네이버 블로그에 최적화된 형태로 자동 포스팅될 수 있습니다.
                이는 초기 트래픽을 확보하고 다양한 사용자 층에게 콘텐츠를 노출시키는 가장 효과적인 방법입니다.
                <span className="block mt-2 font-semibold text-purple-300">➡️ (구현 예정) API를 통해 생성된 콘텐츠가 자동으로 블로그 및 뉴스픽 형식으로 변환되어 예약 발행됩니다.</span>
              </p>
            </div>

            <div className="p-6 bg-gray-700/50 rounded-lg">
              <h2 className="text-2xl font-bold text-yellow-400 mb-3">Step 2: 제휴 마케팅(쿠팡 파트너스 등) 자동화</h2>
              <p className="text-gray-300">
                생성된 콘텐츠의 주제와 관련된 상품의 제휴 마케팅 링크(예: 쿠팡 파트너스)를 AI가 자동으로 분석하여 삽입합니다.
                예를 들어, '캠핑 썰' 콘텐츠에는 최신 캠핑 장비의 링크가, '요리 썰'에는 관련 조리 도구 링크가 포함됩니다.
                이를 통해 사용자는 콘텐츠 소비와 동시에 자연스럽게 구매로 이어져 수익이 발생합니다.
                <span className="block mt-2 font-semibold text-purple-300">➡️ (구현 예정) 콘텐츠 내용과 연관된 상품을 AI가 탐색하고, 파트너스 링크를 자동 생성하여 본문에 삽입합니다.</span>
              </p>
            </div>

            <div className="p-6 bg-gray-700/50 rounded-lg">
              <h2 className="text-2xl font-bold text-yellow-400 mb-3">Step 3: 커뮤니티 바이럴 및 트래픽 유입 (시뮬레이션)</h2>
              <p className="text-gray-300 mb-4">
                콘텐츠의 핵심 내용을 담은 짧은 소개글을 '뉴스픽'과 같은 대형 커뮤니티에 자동으로 포스팅하여 초기 노출을 극대화하고, 유튜브 채널 및 블로그로 사용자를 유입시킵니다.
                아래 버튼을 눌러 이 과정을 시뮬레이션해볼 수 있습니다.
              </p>
              <div className="space-y-3">
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full h-24 bg-gray-900 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <button
                  onClick={handleCommunityUpload}
                  disabled={isUploading}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 text-gray-900 font-bold py-3 px-6 rounded-lg text-lg transition-colors"
                >
                  {isUploading ? '업로드 중...' : '뉴스픽 커뮤니티에 자동 포스팅하기 (시뮬레이션)'}
                </button>
                {uploadStatus && (
                  <p className={`mt-2 text-sm text-center ${uploadStatus.includes('오류') ? 'text-red-400' : 'text-green-400'}`}>
                    {uploadStatus}
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

interface Scene {
  videoSearchKeyword: string[];
  segmentTitle: string;
  script: string[];
  imageGenPrompt: string;
}

interface Workflow {
  step1: {
    status: 'idle' | 'completed';
    subject: string;
    duration: string;
    imageCount: number;
    style: string;
    language: 'korean' | 'english';
  };
  step2: {
    status: 'idle' | 'generating' | 'completed' | 'error';
    title: string;
    script: string[];
    scenes: Scene[];
    error?: string;
  };
  step3: {
    status: 'idle' | 'generating' | 'completed' | 'error';
    images: string[];
    error?: string;
  };
  step4: {
    status: 'idle' | 'generating' | 'completed' | 'error';
    voiceStyle: string;
    audioUrl?: string;
    error?: string;
  };
  step5: {
    status: 'idle' | 'generating' | 'completed' | 'error';
    videoUrl?: string;
    error?: string;
  };
}

const AUTOVID_API = '/api/autovid';

export default function AutoVideoPage() {
  const [workflow, setWorkflow] = useState<Workflow>({
    step1: { status: 'idle', subject: '', duration: '5-10', imageCount: 5, style: 'engaging', language: 'korean' },
    step2: { status: 'idle', title: '', script: [], scenes: [] },
    step3: { status: 'idle', images: [] },
    step4: { status: 'idle', voiceStyle: 'ko-KR-Wavenet-A' },
    step5: { status: 'idle' }
  });

  const voiceOptions = [
    { id: 'ko-KR-Wavenet-A', name: '여성 (밝음)' },
    { id: 'ko-KR-Wavenet-D', name: '남성 (명확함)' },
    { id: 'ko-KR-Wavenet-B', name: '여성 (차분함)' },
  ];

  const styleOptions = [
    { id: 'engaging', name: '💬 흥미로운' },
    { id: 'professional', name: '👔 전문적인' },
    { id: 'casual', name: '😊 캐주얼한' },
    { id: 'educational', name: '📚 교육적인' }
  ];

  const durationOptions = [
    { id: '1-3', name: '초단편 (1-3분)' },
    { id: '5-10', name: '표준 (5-10분)' },
    { id: '10-15', name: '중편 (10-15분)' },
    { id: '15-20', name: '장편 (15-20분)' }
  ];

  // ===== STEP 1: 프롬프트 설정 완료 =====
  const completeStep1 = () => {
    if (!workflow.step1.subject.trim()) {
      alert('주제를 입력해주세요');
      return;
    }

    setWorkflow(prev => ({
      ...prev,
      step1: { ...prev.step1, status: 'completed' }
    }));
  };

  // ===== STEP 2: 대본 생성 =====
  const generateStep2 = async () => {
    setWorkflow(prev => ({
      ...prev,
      step2: { ...prev.step2, status: 'generating' }
    }));

    try {
      const response = await fetch(`${AUTOVID_API}/script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: workflow.step1.subject,
          style: workflow.step1.style,
          duration: workflow.step1.duration,
          imageCount: workflow.step1.imageCount,
          language: workflow.step1.language
        })
      });

      if (!response.ok) throw new Error('대본 생성 실패');

      const data = await response.json();

      setWorkflow(prev => ({
        ...prev,
        step2: {
          status: 'completed',
          title: data.data.title,
          script: data.data.scenes.map((scene: any) => scene.content),
          scenes: data.data.scenes
        }
      }));
    } catch (error: any) {
      setWorkflow(prev => ({
        ...prev,
        step2: {
          ...prev.step2,
          status: 'error',
          error: error.message
        }
      }));
    }
  };

  // ===== STEP 3: 이미지 생성 =====
  const generateStep3 = async () => {
    if (workflow.step2.scenes.length === 0) {
      alert('먼저 대본을 생성하세요');
      return;
    }

    setWorkflow(prev => ({
      ...prev,
      step3: { ...prev.step3, status: 'generating' }
    }));

    try {
      const imagePromises = workflow.step2.scenes.map((scene, index) =>
        fetch(`${AUTOVID_API}/generate-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `Scene ${index + 1}: ${scene.title}`,
            style: 'realistic'
          })
        }).then(res => res.ok ? res.json() : Promise.reject('이미지 생성 실패'))
      );

      const results = await Promise.all(imagePromises);
      const images = results.map(r => r.imageUrl).filter(Boolean);

      setWorkflow(prev => ({
        ...prev,
        step3: {
          status: 'completed',
          images
        }
      }));
    } catch (error: any) {
      setWorkflow(prev => ({
        ...prev,
        step3: {
          ...prev.step3,
          status: 'error',
          error: error.message || '이미지 생성 실패'
        }
      }));
    }
  };

  // ===== STEP 4: TTS 생성 =====
  const generateStep4 = async () => {
    if (workflow.step2.script.length === 0) {
      alert('먼저 대본을 생성하세요');
      return;
    }

    setWorkflow(prev => ({
      ...prev,
      step4: { ...prev.step4, status: 'generating' }
    }));

    try {
      const scriptText = workflow.step2.script.join(' ');
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: scriptText,
          voice: workflow.step4.voiceStyle
        })
      });

      if (!response.ok) throw new Error('TTS 생성 실패');

      const data = await response.json();

      // Google TTS는 audioContent를 base64로 반환
      const base64Audio = data.audioContent;
      const audioBytes = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
      const audioBlob = new Blob([audioBytes], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      setWorkflow(prev => ({
        ...prev,
        step4: {
          ...prev.step4,
          status: 'completed',
          audioUrl: audioUrl
        }
      }));
    } catch (error: any) {
      setWorkflow(prev => ({
        ...prev,
        step4: {
          ...prev.step4,
          status: 'error',
          error: error.message
        }
      }));
    }
  };

  // ===== STEP 5: 영상 생성 =====
  const generateStep5 = async () => {
    if (workflow.step3.images.length === 0 || !workflow.step4.audioUrl) {
      alert('먼저 이미지와 음성을 생성하세요');
      return;
    }

    setWorkflow(prev => ({
      ...prev,
      step5: { ...prev.step5, status: 'generating' }
    }));

    try {
      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: workflow.step3.images,
          audio_url: workflow.step4.audioUrl,
          sync_audio: true,
          quality: 'high',
          resolution: 'landscape'
        })
      });

      if (!response.ok) throw new Error('영상 생성 실패');

      const data = await response.json();

      setWorkflow(prev => ({
        ...prev,
        step5: {
          status: 'completed',
          videoUrl: data.video_url
        }
      }));
    } catch (error: any) {
      setWorkflow(prev => ({
        ...prev,
        step5: {
          ...prev.step5,
          status: 'error',
          error: error.message
        }
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-12">🎬 AutoVid - 5단계 영상 생성</h1>

        {/* ===== STEP 1: 프롬프트 설정 ===== */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">1</div>
            <h2 className="text-2xl font-bold text-white">프롬프트 설정</h2>
            {workflow.step1.status === 'completed' && <span className="ml-auto text-green-400">✅ 완료</span>}
          </div>

          {workflow.step1.status === 'idle' && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="주제 입력 (예: AI 기술의 미래)"
                value={workflow.step1.subject}
                onChange={(e) => setWorkflow(prev => ({
                  ...prev,
                  step1: { ...prev.step1, subject: e.target.value }
                }))}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400"
              />

              <div>
                <label className="text-white text-sm block mb-2">영상 길이 선택:</label>
                <div className="grid grid-cols-2 gap-2">
                  {durationOptions.map(option => (
                    <button
                      key={option.id}
                      onClick={() => setWorkflow(prev => ({
                        ...prev,
                        step1: { ...prev.step1, duration: option.id }
                      }))}
                      className={`p-3 rounded-lg transition ${
                        workflow.step1.duration === option.id
                          ? 'bg-purple-600 border-2 border-purple-400'
                          : 'bg-white/5 border border-white/20 hover:bg-white/10'
                      } text-white text-sm`}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-white text-sm block mb-2">스타일 선택:</label>
                <div className="grid grid-cols-2 gap-2">
                  {styleOptions.map(option => (
                    <button
                      key={option.id}
                      onClick={() => setWorkflow(prev => ({
                        ...prev,
                        step1: { ...prev.step1, style: option.id }
                      }))}
                      className={`p-3 rounded-lg transition ${
                        workflow.step1.style === option.id
                          ? 'bg-purple-600 border-2 border-purple-400'
                          : 'bg-white/5 border border-white/20 hover:bg-white/10'
                      } text-white text-sm`}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-white text-sm block mb-2">대본 언어 선택:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setWorkflow(prev => ({
                      ...prev,
                      step1: { ...prev.step1, language: 'korean' }
                    }))}
                    className={`p-3 rounded-lg transition ${
                      workflow.step1.language === 'korean'
                        ? 'bg-purple-600 border-2 border-purple-400'
                        : 'bg-white/5 border border-white/20 hover:bg-white/10'
                    } text-white text-sm`}
                  >
                    🇰🇷 한국어
                  </button>
                  <button
                    onClick={() => setWorkflow(prev => ({
                      ...prev,
                      step1: { ...prev.step1, language: 'english' }
                    }))}
                    className={`p-3 rounded-lg transition ${
                      workflow.step1.language === 'english'
                        ? 'bg-purple-600 border-2 border-purple-400'
                        : 'bg-white/5 border border-white/20 hover:bg-white/10'
                    } text-white text-sm`}
                  >
                    🇺🇸 English
                  </button>
                </div>
              </div>

              <div>
                <label className="text-white text-sm">이미지 개수: {workflow.step1.imageCount}</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={workflow.step1.imageCount}
                  onChange={(e) => setWorkflow(prev => ({
                    ...prev,
                    step1: { ...prev.step1, imageCount: Number(e.target.value) }
                  }))}
                  className="w-full"
                />
              </div>

              <button
                onClick={completeStep1}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:from-blue-700 hover:to-purple-700"
              >
                ⚙️ 프롬프트 설정 완료
              </button>
            </div>
          )}

          {workflow.step1.status === 'completed' && (
            <div className="space-y-2">
              <p className="text-white"><strong>주제:</strong> {workflow.step1.subject}</p>
              <p className="text-white"><strong>길이:</strong> {workflow.step1.duration}분</p>
              <p className="text-white"><strong>스타일:</strong> {workflow.step1.style}</p>
              <p className="text-white"><strong>대본 언어:</strong> {workflow.step1.language === 'korean' ? '🇰🇷 한국어' : '🇺🇸 English'}</p>
              <p className="text-white"><strong>이미지 개수:</strong> {workflow.step1.imageCount}개</p>
              <button
                onClick={() => setWorkflow(prev => ({ ...prev, step1: { ...prev.step1, status: 'idle' } }))}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-lg mt-4"
              >
                🔄 설정 수정
              </button>
            </div>
          )}
        </div>

        {/* ===== STEP 2: 대본 생성 ===== */}
        {workflow.step1.status === 'completed' && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">2</div>
              <h2 className="text-2xl font-bold text-white">대본 생성</h2>
              {workflow.step2.status === 'completed' && <span className="ml-auto text-green-400">✅ 완료</span>}
            </div>

            {workflow.step2.status === 'idle' && (
              <button
                onClick={generateStep2}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold py-3 rounded-lg hover:from-cyan-700 hover:to-blue-700"
              >
                📝 대본 생성 시작
              </button>
            )}

            {workflow.step2.status === 'generating' && (
              <div className="text-center">
                <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-white">대본 생성 중...</p>
              </div>
            )}

            {workflow.step2.status === 'completed' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-white font-semibold mb-2">제목: {workflow.step2.title}</h3>
                  <div className="bg-white/5 rounded-lg p-4 max-h-48 overflow-y-auto">
                    {workflow.step2.scenes.map((scene, i) => (
                      <div key={i} className="mb-3 p-2 bg-white/5 rounded">
                        <p className="text-cyan-400 font-semibold text-sm">Scene {scene.scene_number}: {scene.title}</p>
                        <p className="text-gray-200 text-sm">{scene.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setWorkflow(prev => ({ ...prev, step2: { ...prev.step2, status: 'idle' } }))}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-lg"
                >
                  🔄 다시 생성
                </button>
              </div>
            )}

            {workflow.step2.status === 'error' && (
              <div className="text-red-400">❌ {workflow.step2.error}</div>
            )}
          </div>
        )}

        {/* ===== STEP 3 ===== */}
        {workflow.step2.status === 'completed' && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-green-500 to-cyan-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">3</div>
              <h2 className="text-2xl font-bold text-white">이미지 생성</h2>
              {workflow.step3.status === 'completed' && <span className="ml-auto text-green-400">✅ 완료</span>}
            </div>

            {workflow.step3.status === 'idle' && (
              <button
                onClick={generateStep3}
                className="w-full bg-gradient-to-r from-green-600 to-cyan-600 text-white font-bold py-3 rounded-lg hover:from-green-700 hover:to-cyan-700"
              >
                🖼️ 이미지 생성
              </button>
            )}

            {workflow.step3.status === 'generating' && (
              <div className="text-center">
                <div className="animate-spin w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-white">이미지 생성 중...</p>
              </div>
            )}

            {workflow.step3.status === 'completed' && (
              <div className="grid grid-cols-3 gap-4">
                {workflow.step3.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`Scene ${i + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}

            {workflow.step3.status === 'error' && (
              <div className="text-red-400">❌ {workflow.step3.error}</div>
            )}
          </div>
        )}

        {/* ===== STEP 4 ===== */}
        {workflow.step3.status === 'completed' && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">4</div>
              <h2 className="text-2xl font-bold text-white">음성 생성 (TTS)</h2>
              {workflow.step4.status === 'completed' && <span className="ml-auto text-green-400">✅ 완료</span>}
            </div>

            <div className="mb-4">
              <label className="text-white text-sm block mb-3">목소리 선택:</label>
              <div className="grid grid-cols-3 gap-3">
                {voiceOptions.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setWorkflow(prev => ({
                      ...prev,
                      step4: { ...prev.step4, voiceStyle: v.id }
                    }))}
                    className={`p-3 rounded-lg transition ${
                      workflow.step4.voiceStyle === v.id
                        ? 'bg-orange-600 border-2 border-orange-400'
                        : 'bg-white/5 border border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-white font-bold text-sm">{v.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {workflow.step4.status === 'idle' && (
              <button
                onClick={generateStep4}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold py-3 rounded-lg hover:from-orange-700 hover:to-red-700"
              >
                🎙️ TTS 생성
              </button>
            )}

            {workflow.step4.status === 'generating' && (
              <div className="text-center">
                <div className="animate-spin w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-white">음성 생성 중...</p>
              </div>
            )}

            {workflow.step4.status === 'completed' && workflow.step4.audioUrl && (
              <audio
                controls
                src={workflow.step4.audioUrl}
                className="w-full"
              />
            )}

            {workflow.step4.status === 'error' && (
              <div className="text-red-400">❌ {workflow.step4.error}</div>
            )}
          </div>
        )}

        {/* ===== STEP 5 ===== */}
        {workflow.step4.status === 'completed' && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold">5</div>
              <h2 className="text-2xl font-bold text-white">영상 생성</h2>
              {workflow.step5.status === 'completed' && <span className="ml-auto text-green-400">✅ 완료</span>}
            </div>

            {workflow.step5.status === 'idle' && (
              <button
                onClick={generateStep5}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-lg hover:from-purple-700 hover:to-pink-700"
              >
                🎬 최종 영상 생성
              </button>
            )}

            {workflow.step5.status === 'generating' && (
              <div className="text-center">
                <div className="animate-spin w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-white">영상 생성 중...</p>
              </div>
            )}

            {workflow.step5.status === 'completed' && workflow.step5.videoUrl && (
              <video
                controls
                src={workflow.step5.videoUrl}
                className="w-full rounded-lg"
              />
            )}

            {workflow.step5.status === 'error' && (
              <div className="text-red-400">❌ {workflow.step5.error}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

'use client'
import { useState, useEffect, useRef } from 'react'
import Navigation from '../components/Navigation'
import { fetchWithAuth } from '@/lib/client-auth'

interface ShortsResult {
  script: string
  audioUrl: string
  images: string[]
  imageErrors?: string[]
  totalScenes?: number
  successfulImages?: number
}

const availableFonts = [
  'Arial',
  'Verdana',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Malgun Gothic',
  'Apple SD Gothic Neo',
  'Nanum Gothic',
];

export default function ShortsPage() {
  const [mode, setMode] = useState<'keyword' | 'prompt'>('keyword')
  const [keyword, setKeyword] = useState('')
  const [prompt, setPrompt] = useState('')
  const [duration, setDuration] = useState(30)
  const [sceneCount, setSceneCount] = useState(5)
  const [imageStyle, setImageStyle] = useState('photorealistic')
  const [protagonistImage, setProtagonistImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [result, setResult] = useState<ShortsResult | null>(null)
  const [error, setError] = useState('')
  const [improving, setImproving] = useState(false)
  const [isAudioLoading, setIsAudioLoading] = useState(false)
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null)

  // TTS Settings
  const [ttsVoice, setTtsVoice] = useState('ko-KR-Neural2-A')
  const [ttsSpeed, setTtsSpeed] = useState(1.0)
  const [ttsPitch, setTtsPitch] = useState(1.0)
  const [ttsTone, setTtsTone] = useState('') // For SSML

  // Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null)
  const [subtitleText, setSubtitleText] = useState('')
  const [fontSize, setFontSize] = useState(48)
  const [fontColor, setFontColor] = useState('#FFFFFF')
  const [fontFamily, setFontFamily] = useState('Arial')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const improveInput = async () => {
    const input = mode === 'keyword' ? keyword : prompt
    if (!input.trim()) {
      setError('입력을 먼저 작성해주세요')
      return
    }
    setImproving(true)
    setError('')
    try {
      const res = await fetchWithAuth('/api/shorts/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, mode })
      })
      if (!res.ok) throw new Error('개선 실패')
      const data = await res.json()
      if (mode === 'keyword') {
        setKeyword(data.improved)
      } else {
        setPrompt(data.improved)
      }
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다')
    } finally {
      setImproving(false)
    }
  }

  const generateShorts = async () => {
    const input = mode === 'keyword' ? keyword : prompt;
    if (!input.trim()) {
      setError(mode === 'keyword' ? '키워드를 입력해주세요' : '프롬프트를 입력해주세요');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    setProgress('쇼츠 생성 중... 잠시만 기다려주세요.');
    try {
      const formData = new FormData();
      formData.append('mode', mode);
      formData.append('input', input);
      formData.append('duration', String(duration));
      formData.append('sceneCount', String(sceneCount));
      formData.append('imageStyle', imageStyle);
      if (protagonistImage) {
        formData.append('protagonistImage', protagonistImage);
      }

      const res = await fetchWithAuth('/api/shorts', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || '쇼츠 생성에 실패했습니다.');
      }
      const data = await res.json();
      setResult({
        script: data.script,
        images: data.images,
        audioUrl: '',
        imageErrors: data.imageErrors,
        totalScenes: data.totalScenes,
        successfulImages: data.successfulImages
      });

      // 이미지 생성 오류가 있으면 사용자에게 알림
      if (data.imageErrors && data.imageErrors.length > 0) {
        setError(`⚠️ 일부 이미지 생성 실패 (${data.successfulImages}/${data.totalScenes} 성공):\n${data.imageErrors.join('\n')}`);
      }
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };
  
  const generateAudio = async () => {
    if (!result || !result.script) {
      setError('음성을 생성할 대본이 없습니다.');
      return;
    }
    setIsAudioLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: result.script,
          voice: ttsVoice,
          speed: ttsSpeed,
          pitch: ttsPitch,
          tone: ttsTone,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || '음성 생성 실패');
      }
      const data = await res.json();

      if (data.audioContent) {
        const audioBlob = await (await fetch(`data:audio/wav;base64,${data.audioContent}`)).blob();
        const url = URL.createObjectURL(audioBlob);
        setResult(prev => prev ? { ...prev, audioUrl: url } : null);
      } else {
        throw new Error('생성된 음성 데이터가 없습니다.');
      }

    } catch (err: any) {
      setError(err.message || '음성 생성 중 오류가 발생했습니다.');
    } finally {
      setIsAudioLoading(false);
    }
  };


  useEffect(() => {
    if (isEditorOpen && editingImageIndex !== null && result) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const imgSrc = result.images[editingImageIndex];
      if (!canvas || !ctx || !imgSrc) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = fontColor;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = fontSize / 8;
        ctx.textAlign = 'center';

        const lines = [];
        const words = subtitleText.split(' ');
        let currentLine = words[0] || '';

        for (let i = 1; i < words.length; i++) {
          const word = words[i];
          const width = ctx.measureText(currentLine + " " + word).width;
          if (width < canvas.width * 0.9) {
            currentLine += " " + word;
          } else {
            lines.push(currentLine);
            currentLine = word;
          }
        }
        lines.push(currentLine);
        
        const lineHeight = fontSize * 1.2;
        const startY = canvas.height - (lines.length * lineHeight) - (canvas.height * 0.05);

        lines.forEach((line, i) => {
          const y = startY + (i * lineHeight);
          ctx.strokeText(line, canvas.width / 2, y);
          ctx.fillText(line, canvas.width / 2, y);
        });
      };
      img.src = imgSrc;
    }
  }, [isEditorOpen, editingImageIndex, result, subtitleText, fontSize, fontColor, fontFamily]);

  const openEditor = (index: number) => {
    if (!result) return;
    const sceneLength = Math.floor(result.script.length / result.images.length);
    const text = result.script.substring(index * sceneLength, (index + 1) * sceneLength).trim();
    setSubtitleText(text);
    setEditingImageIndex(index);
    setIsEditorOpen(true);
  }

  const regenerateImage = async (index: number) => {
    if (!result) return;
    try {
      setRegeneratingIndex(index)
      // Derive a simple per-scene prompt from script segments
      const total = result.images.length || sceneCount
      const segLen = Math.max(1, Math.floor(result.script.length / total))
      const scene = result.script.substring(index * segLen, (index + 1) * segLen).trim()

      const fd = new FormData()
      fd.append('scene', scene || `Scene ${index + 1}`)
      fd.append('imageStyle', imageStyle)
      if (protagonistImage) fd.append('protagonistImage', protagonistImage)

      const res = await fetchWithAuth('/api/shorts/regenerate', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any))
        throw new Error(err.error || '이미지 재생성 실패')
      }
      const data = await res.json()
      if (!data.image) throw new Error('이미지 데이터 없음')
      setResult(prev => {
        if (!prev) return prev
        const next = [...prev.images]
        next[index] = data.image
        return { ...prev, images: next }
      })
    } catch (e: any) {
      setError(e.message || '이미지 재생성 중 오류')
    } finally {
      setRegeneratingIndex(null)
    }
  }

  const saveAndClose = () => {
    if (!canvasRef.current || editingImageIndex === null || !result) return;
    const newDataUrl = canvasRef.current.toDataURL('image/png');
    const newImages = [...result.images];
    newImages[editingImageIndex] = newDataUrl;
    setResult({ ...result, images: newImages });
    setIsEditorOpen(false);
  }

  const navigateEditor = (direction: 'next' | 'prev') => {
    if (editingImageIndex === null || !result) return;
    if (canvasRef.current) {
      const newDataUrl = canvasRef.current.toDataURL('image/png');
      const newImages = [...result.images];
      newImages[editingImageIndex] = newDataUrl;
      setResult({ ...result, images: newImages });
    }

    const newIndex = direction === 'next' ? editingImageIndex + 1 : editingImageIndex - 1;
    if (newIndex >= 0 && newIndex < result.images.length) {
      openEditor(newIndex);
    }
  }

  const downloadAll = () => {
    if (!result) return;
    // Deprecated: previously downloaded all (script, images, audio)
    // Keeping function for backward compatibility (no-op here)
  }

  const downloadScript = () => {
    if (!result?.script) return;
    const scriptBlob = new Blob([result.script], { type: 'text/plain' });
    const url = URL.createObjectURL(scriptBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `script-${Date.now()}.txt`;
    link.click();
  }

  const downloadAudio = () => {
    if (!result?.audioUrl) return;
    const link = document.createElement('a');
    link.href = result.audioUrl;
    link.download = `audio-${Date.now()}.wav`;
    link.click();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-900 to-gray-900 text-white">
      <Navigation />
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2 text-center">YouTube 쇼츠 자동 생성기</h1>
          <p className="text-gray-400 text-center mb-8">AI가 대본과 장면 이미지를 자동으로 생성</p>

          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <label className="block text-lg font-semibold mb-3">생성 모드</label>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setMode('keyword')} className={`p-4 rounded-lg font-semibold transition-colors ${mode === 'keyword' ? 'bg-pink-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
                🔑 키워드 모드
                <p className="text-sm font-normal mt-1">간단한 주제로 자동 생성</p>
              </button>
              <button onClick={() => setMode('prompt')} className={`p-4 rounded-lg font-semibold transition-colors ${mode === 'prompt' ? 'bg-pink-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}>
                ✍️ 프롬프트 모드
                <p className="text-sm font-normal mt-1">상세한 대본/시나리오 입력</p>
              </button>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            {mode === 'keyword' ? (
              <>
                <label className="block text-lg font-semibold mb-3">키워드</label>
                <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="예: 고구마의 효능, 우주의 신비, AI의 미래" className="w-full bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-500" />
                <p className="text-sm text-gray-400 mt-2">간단한 주제를 입력하면 AI가 자동으로 대본을 생성합니다</p>
                <button onClick={improveInput} disabled={improving} className="w-full mt-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                  {improving ? 'AI 개선 중...' : '🤖 AI로 키워드 개선하기'}
                </button>
              </>
            ) : (
              <>
                <label className="block text-lg font-semibold mb-3">상세 프롬프트</label>
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="예: 고구마의 5가지 건강 효능에 대해 설명하는 영상을 만들어줘..." className="w-full h-32 bg-gray-700 text-white rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-pink-500" />
                <p className="text-sm text-gray-400 mt-2">상세한 대본이나 시나리오를 입력하면 더 정확한 결과를 얻을 수 있습니다</p>
                <button onClick={improveInput} disabled={improving} className="w-full mt-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                  {improving ? 'AI 개선 중...' : '🤖 AI로 프롬프트 개선하기'}
                </button>
              </>
            )}
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <label className="block text-lg font-semibold mb-3">주인공 사진 (선택 사항)</label>
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={(e) => setProtagonistImage(e.target.files ? e.target.files[0] : null)}
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-600 file:text-white hover:file:bg-pink-700"
            />
            <p className="text-sm text-gray-400 mt-2">주인공 사진을 업로드하면, 모든 장면에 얼굴이 일관성 있게 유지됩니다.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <label className="block text-lg font-semibold mb-3">영상 길이</label>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-500">
                <option value={30}>30초</option>
                <option value={45}>45초</option>
                <option value={60}>60초 (1분)</option>
              </select>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <label className="block text-lg font-semibold mb-3">장면 수</label>
              <select value={sceneCount} onChange={(e) => setSceneCount(Number(e.target.value))} className="w-full bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-500">
                {[3, 4, 5, 6, 7, 8].map(n => (<option key={n} value={n}>{n}개</option>))}
              </select>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <label className="block text-lg font-semibold mb-3">이미지 스타일</label>
              <select value={imageStyle} onChange={(e) => setImageStyle(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-pink-500">
                <option value="photorealistic">실사</option>
                <option value="anime">애니메이션</option>
                <option value="3d-render">3D 렌더</option>
                <option value="fantasy-art">판타지 아트</option>
                <option value="cinematic">영화처럼</option>
              </select>
            </div>
          </div>

          <button onClick={generateShorts} disabled={loading} className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg text-xl transition-colors mb-6">
            {loading ? progress || '생성 중...' : '쇼츠 자동 생성하기'}
          </button>

          {error && (<div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6"><p className="text-red-200">{error}</p></div>)}

          {result && (
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">생성된 대본</h2>
                <p className="whitespace-pre-wrap bg-gray-700 p-4 rounded">{result.script}</p>
              </div>

              {result.images.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-4">
                    장면 이미지 ({result.images.length}개)
                    {result.totalScenes && result.images.length < result.totalScenes && (
                      <span className="text-yellow-400 text-base ml-2">
                        ({result.totalScenes - result.images.length}개 생성 실패)
                      </span>
                    )}
                  </h2>
                  {result.imageErrors && result.imageErrors.length > 0 && (
                    <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 mb-4">
                      <p className="text-yellow-200 text-sm font-semibold mb-1">⚠️ 실패한 이미지:</p>
                      <ul className="text-yellow-300 text-sm list-disc list-inside">
                        {result.imageErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {result.images.map((img, i) => (
                      <div key={i} className="relative group">
                        <img src={img} alt={`Scene ${i + 1}`} className="w-full rounded-lg" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditor(i)} className="text-white font-bold py-2 px-4 rounded bg-purple-600 hover:bg-purple-700">자막 편집</button>
                          <button onClick={() => regenerateImage(i)} disabled={regeneratingIndex===i} className="text-white font-bold py-2 px-4 rounded bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600">
                            {regeneratingIndex===i ? '재생성 중...' : '이미지 재생성'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TTS Controls */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">음성 설정</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">목소리 선택</label>
                    <select value={ttsVoice} onChange={(e) => setTtsVoice(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg p-3">
                      <optgroup label="Neural2 (고품질)">
                        <option value="ko-KR-Neural2-A">Neural2-A (여성)</option>
                        <option value="ko-KR-Neural2-B">Neural2-B (여성)</option>
                        <option value="ko-KR-Neural2-C">Neural2-C (남성)</option>
                      </optgroup>
                      <optgroup label="Wavenet (자연스러움)">
                        <option value="ko-KR-Wavenet-A">Wavenet-A (여성)</option>
                        <option value="ko-KR-Wavenet-B">Wavenet-B (여성)</option>
                        <option value="ko-KR-Wavenet-C">Wavenet-C (남성)</option>
                        <option value="ko-KR-Wavenet-D">Wavenet-D (남성)</option>
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">목소리 톤/분위기 (선택)</label>
                    <input type="text" value={ttsTone} onChange={(e) => setTtsTone(e.target.value)} placeholder="예: 밝고 활기차게, 차분하게" className="w-full bg-gray-700 text-white rounded-lg p-3" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">속도: {ttsSpeed.toFixed(1)}x</label>
                    <input type="range" min="0.5" max="2.0" step="0.1" value={ttsSpeed} onChange={(e) => setTtsSpeed(parseFloat(e.target.value))} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">음높이: {ttsPitch.toFixed(1)}</label>
                    <input type="range" min="0.5" max="2.0" step="0.1" value={ttsPitch} onChange={(e) => setTtsPitch(parseFloat(e.target.value))} className="w-full" />
                  </div>
                </div>
              </div>

              {result.audioUrl && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-4">생성된 음성</h2>
                  <audio controls className="w-full" src={result.audioUrl} />
                </div>
              )}

              <div className="flex gap-4">
                 <button onClick={generateAudio} disabled={isAudioLoading || !result?.script} className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                  {isAudioLoading ? '음성 생성 중...' : '🔊 음성 생성하기'}
                </button>
                <button onClick={downloadScript} disabled={!result?.script} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                  📝 대본 다운로드
                </button>
                <button onClick={downloadAudio} disabled={!result?.audioUrl} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                  🎵 음성 다운로드
                </button>
              </div>

              <p className="text-sm text-gray-400 text-center">
                💡 생성된 이미지와 음성을 영상 편집 프로그램에서 합성하여 쇼츠를 완성하세요
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      {isEditorOpen && editingImageIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-5xl w-full max-h-[95vh] flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-center">자막 편집기 (장면 {editingImageIndex + 1} / {result?.images.length})</h2>
            <div className="flex-grow flex gap-6 overflow-hidden">
              <div className="w-1/2 flex items-center justify-center bg-black rounded-lg">
                <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
              </div>

              <div className="w-1/2 flex flex-col gap-4 overflow-y-auto pr-2">
                <div>
                  <label className="block text-sm font-semibold mb-2">자막 텍스트</label>
                  <textarea 
                    value={subtitleText}
                    onChange={(e) => setSubtitleText(e.target.value)}
                    className="w-full h-40 bg-gray-700 text-white rounded-lg p-3 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">글자 크기: {fontSize}px</label>
                  <input 
                    type="range" 
                    min="12" 
                    max="128" 
                    value={fontSize} 
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">글자 색상</label>
                  <input 
                    type="color" 
                    value={fontColor} 
                    onChange={(e) => setFontColor(e.target.value)}
                    className="w-full h-10 p-1 bg-gray-700 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">폰트</label>
                  <select 
                    value={fontFamily} 
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full bg-gray-700 text-white rounded-lg p-3"
                  >
                    {availableFonts.map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center flex-shrink-0">
              <div>
                <button
                  onClick={() => navigateEditor('prev')}
                  disabled={editingImageIndex === 0}
                  className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded"
                >
                  이전
                </button>
                <button
                  onClick={() => navigateEditor('next')}
                  disabled={editingImageIndex === (result?.images.length || 0) - 1}
                  className="ml-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded"
                >
                  다음
                </button>
              </div>
              <div>
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                >
                  모두 취소
                </button>
                <button
                  onClick={saveAndClose}
                  className="ml-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  변경 저장 및 닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

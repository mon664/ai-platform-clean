'use client'
import { useState, useEffect, useRef, DragEvent } from 'react'
import Navigation from '../components/Navigation'

// --- Interfaces ---
interface Scene {
  id: string; // Add unique ID for drag-and-drop
  text: string;
  image: string;
  audio: string;
}
interface StoryShortsResult {
  title: string;
  script: string;
  scenes: Scene[];
  error?: string;
}
interface PresetStyles {
  fontSize: number;
  fontColor: string;
}

const LOCAL_STORAGE_KEY = 'short-story-project';

// --- Helper Components ---

const UpdateNotification = ({ onUpdate }: { onUpdate: () => void }) => (
  <div className="fixed top-5 right-5 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 animate-pulse">
    <p className="font-semibold">🎉 새로운 업데이트 사용 가능!</p>
    <button onClick={onUpdate} className="mt-2 text-sm underline">설치 및 재시작</button>
  </div>
);

const PresetManager = ({ styles, setStyles }: { styles: PresetStyles, setStyles: (styles: PresetStyles) => void }) => {
  const PRESET_KEY = 'short-story-preset';
  const savePreset = () => { localStorage.setItem(PRESET_KEY, JSON.stringify(styles)); alert('프리셋이 저장되었습니다.'); };
  const loadPreset = () => {
    const saved = localStorage.getItem(PRESET_KEY);
    if (saved) { setStyles(JSON.parse(saved)); alert('프리셋을 불러왔습니다.'); }
    else { alert('저장된 프리셋이 없습니다.'); }
  };
  return (
    <div className="bg-gray-700/50 rounded-lg p-4 mb-4">
      <h3 className="text-xl font-semibold mb-3">자막 프리셋</h3>
      <div className="grid grid-cols-2 gap-4 items-center">
        <div>
          <label className="block text-sm font-semibold mb-1">글자 크기: {styles.fontSize}px</label>
          <input type="range" min="16" max="80" value={styles.fontSize} onChange={(e) => setStyles({ ...styles, fontSize: Number(e.target.value) })} className="w-full" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">글자 색상</label>
          <input type="color" value={styles.fontColor} onChange={(e) => setStyles({ ...styles, fontColor: e.target.value })} className="w-full h-10 p-1 bg-gray-800 rounded-lg cursor-pointer" />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={savePreset} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm">💾 저장</button>
        <button onClick={loadPreset} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm">📂 불러오기</button>
      </div>
    </div>
  );
};

const TimelineEditor = ({ result, setResult, presetStyles }: { result: StoryShortsResult, setResult: (result: StoryShortsResult) => void, presetStyles: PresetStyles }) => {
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(result.scenes[0]?.id || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingText, setEditingText] = useState('');
  const draggedItem = useRef<number | null>(null);
  const dropTarget = useRef<number | null>(null);

  const selectedSceneIndex = result.scenes.findIndex(s => s.id === selectedSceneId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditing) return;
      if (e.key.toLowerCase() === 'q') {
        e.preventDefault();
        const nextIndex = (selectedSceneIndex + 1) % result.scenes.length;
        setSelectedSceneId(result.scenes[nextIndex].id);
      }
      if (e.key.toLowerCase() === 'w' && selectedSceneId) {
        e.preventDefault();
        const audio = new Audio(result.scenes[selectedSceneIndex].audio);
        audio.play();
      }
      if (e.key.toLowerCase() === 'e' && selectedSceneId) {
        e.preventDefault();
        setEditingText(result.scenes[selectedSceneIndex].text);
        setIsEditing(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSceneId, result.scenes, isEditing, selectedSceneIndex]);

  const handleSaveText = () => {
    if (selectedSceneId === null) return;
    const newScenes = result.scenes.map(scene => scene.id === selectedSceneId ? { ...scene, text: editingText } : scene);
    setResult({ ...result, scenes: newScenes });
    setIsEditing(false);
  };

  const onDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    draggedItem.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    dropTarget.current = index;
    // Basic visual feedback could be added here if needed
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggedItem.current === null || dropTarget.current === null || draggedItem.current === dropTarget.current) return;
    
    const newScenes = [...result.scenes];
    const [reorderedItem] = newScenes.splice(draggedItem.current, 1);
    newScenes.splice(dropTarget.current, 0, reorderedItem);

    draggedItem.current = null;
    dropTarget.current = null;
    setResult({ ...result, scenes: newScenes });
  };

  return (
    <div onDrop={onDrop} onDragOver={(e) => e.preventDefault()}>
      <h3 className="text-xl font-semibold mb-2">타임라인 에디터 (드래그 & 드롭으로 순서 변경)</h3>
      <div className="text-sm text-gray-400 mb-3">
        <p>장면을 클릭하여 선택하세요. 단축키: [Q] 다음 장면, [W] 음성 재생, [E] 텍스트 편집</p>
      </div>
      <div className="flex flex-col gap-2">
        {result.scenes.map((scene, index) => (
          <div
            key={scene.id}
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => onDragOver(e, index)}
            onClick={() => setSelectedSceneId(scene.id)}
            className={`flex gap-4 p-3 rounded-lg cursor-pointer transition-all ${selectedSceneId === scene.id ? 'bg-blue-800/80 ring-2 ring-blue-400' : 'bg-gray-700/50 hover:bg-gray-700'}`}
          >
            <div className="relative w-24 h-40 bg-black rounded-md overflow-hidden flex-shrink-0">
              <img src={scene.image} alt={`장면 ${index + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center p-2 text-center" style={{ color: presetStyles.fontColor, fontSize: `${presetStyles.fontSize * 0.5}px`, textShadow: '1px 1px 2px black', fontWeight: 'bold' }}>
                {scene.text}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-400">장면 #{index + 1}</p>
              {isEditing && selectedSceneId === scene.id ? (
                <div className="flex flex-col h-full">
                  <textarea value={editingText} onChange={(e) => setEditingText(e.target.value)} className="w-full flex-grow bg-gray-900 text-white rounded-lg p-2 text-sm" />
                  <div className="flex gap-2 mt-2">
                    <button onClick={handleSaveText} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-xs">저장</button>
                    <button onClick={() => setIsEditing(false)} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-xs">취소</button>
                  </div>
                </div>
              ) : ( <p className="text-gray-200 text-sm mt-1">{scene.text}</p> )}
              <audio src={scene.audio} className="w-full h-8 mt-2" controls />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main Page Component ---
export default function ShortStoryPage() {
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('20대');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<StoryShortsResult | null>(null);
  const [error, setError] = useState('');
  const [presetStyles, setPresetStyles] = useState<PresetStyles>({ fontSize: 32, fontColor: '#FFFFFF' });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [selectedYoutubeAccount, setSelectedYoutubeAccount] = useState('account_1');
  const [showUpdate, setShowUpdate] = useState(false);

  // --- Effects ---
  useEffect(() => {
    const savedProject = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedProject) {
      setResult(JSON.parse(savedProject));
    }
    const timer = setTimeout(() => setShowUpdate(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (result) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(result));
    }
  }, [result]);

  // --- Handlers ---
  const generateStoryShorts = async () => {
    if (!topic.trim()) { setError('썰 주제를 입력해주세요.'); return; }
    setLoading(true); setError(''); setResult(null); setUploadStatus('');
    
    const steps = ["AI 대본 생성 중...", "주인공 캐릭터 분석 중...", "장면 1/5 생성 중...", "장면 2/5 생성 중...", "장면 3/5 생성 중...", "장면 4/5 생성 중...", "장면 5/5 생성 중...", "거의 다 됐어요..."];
    let step = 0;
    const progressInterval = setInterval(() => {
      setProgress(steps[step % steps.length]);
      step++;
    }, 1500);

    try {
      const res = await fetch('/api/short-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, targetAudience }),
      });
      if (!res.ok) { const errData = await res.json(); throw new Error(errData.error || '썰 쇼츠 생성에 실패했습니다.'); }
      const data: Omit<StoryShortsResult, 'scenes'> & { scenes: Omit<Scene, 'id'>[] } = await res.json();
      if (data.error) throw new Error(data.error);
      
      const scenesWithIds = data.scenes.map(scene => ({ ...scene, id: crypto.randomUUID() }));
      setResult({ ...data, scenes: scenesWithIds });
      localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear old project on new generation
    } catch (err: any) {
      setError(err.message || '알 수 없는 오류가 발생했습니다.');
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
      setProgress('');
    }
  };

  const handleUpload = async () => {
    if (!result) return;
    setIsUploading(true); setUploadStatus('');
    try {
      const res = await fetch('/api/short-story/assemble-and-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyData: result, youtubeAccountId: selectedYoutubeAccount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '업로드에 실패했습니다.');
      setUploadStatus(data.message);
    } catch (err: any) {
      setUploadStatus(`오류: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdate = () => {
    setShowUpdate(false);
    alert('프로그램이 최신 버전으로 업데이트되었습니다. 페이지를 새로고침합니다.');
    window.location.reload();
  };

  const clearProject = () => {
    if (confirm('현재 프로젝트를 삭제하고 처음부터 다시 시작하시겠습니까?')) {
      setResult(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-gray-900 text-white">
      {showUpdate && <UpdateNotification onUpdate={handleUpdate} />}
      <Navigation />
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2 text-center">AI 썰 쇼츠 생성기</h1>
          <p className="text-gray-400 text-center mb-8">재미있는 썰 주제를 입력하면 AI가 자동으로 쇼츠 영상을 생성합니다.</p>

          {!result && (
            <>
              <div className="bg-gray-800 rounded-lg p-6 mb-6 space-y-4">
                <div>
                  <label className="block text-lg font-semibold mb-3">썰 주제</label>
                  <textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="예: 내 친구가 겪은 역대급 황당한 알바 썰" className="w-full h-24 bg-gray-700 text-white rounded-lg p-3" disabled={loading} />
                </div>
                <div>
                  <label className="block text-lg font-semibold mb-3">타겟 연령층</label>
                  <select value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg p-3" disabled={loading}>
                    <option value="10대">10대</option><option value="20대">20대</option><option value="30대">30대</option><option value="40대 이상">40대 이상</option>
                  </select>
                </div>
              </div>
              <button onClick={generateStoryShorts} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg text-xl mb-6">
                {loading ? progress : 'AI 썰 쇼츠 생성하기'}
              </button>
            </>
          )}
          
          {loading && <div className="text-center p-10 bg-gray-800 rounded-lg"><p className="animate-pulse">{progress}</p></div>}
          {error && <div className="bg-red-900/50 border-red-500 rounded-lg p-4 mb-6"><p className="text-red-200">{error}</p></div>}

          {result && (
            <div className="space-y-6 bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-3xl font-bold text-center flex-grow">{result.title}</h2>
                <button onClick={clearProject} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">새로 만들기</button>
              </div>
              <PresetManager styles={presetStyles} setStyles={setPresetStyles} />
              <TimelineEditor result={result} setResult={setResult} presetStyles={presetStyles} />
              <div className="border-t border-gray-700 pt-4 mt-6">
                <h3 className="text-xl font-semibold mb-3">🚀 유튜브 업로드</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label htmlFor="yt-account" className="block text-sm font-semibold mb-1">업로드 계정 선택</label>
                    <select id="yt-account" value={selectedYoutubeAccount} onChange={(e) => setSelectedYoutubeAccount(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg p-2">
                      <option value="account_1">유튜브 계정 1</option><option value="account_2">유튜브 계정 2</option><option value="account_3">유튜브 계정 3</option>
                    </select>
                  </div>
                  <button onClick={handleUpload} disabled={isUploading} className="self-end h-10 px-6 font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-600">
                    {isUploading ? '업로드 중...' : '업로드 시작'}
                  </button>
                </div>
                {uploadStatus && <p className={`mt-3 text-sm ${uploadStatus.includes('오류') ? 'text-red-400' : 'text-green-400'}`}>{uploadStatus}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

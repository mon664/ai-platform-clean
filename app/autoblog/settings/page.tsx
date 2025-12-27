'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ApiKeys {
  openai?: string;
  anthropic?: string;
  gemini?: string;
  stabilityai?: string;
  googleClientId?: string;     // OAuth Client ID
  googleClientSecret?: string; // OAuth Client Secret
}

export default function ApiKeysSettingsPage() {
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ [key: string]: string }>({});

  // API 키 불러오기
  useEffect(() => {
    async function loadKeys() {
      try {
        const res = await fetch('/api/autoblog/api-keys');
        const data = await res.json();
        setApiKeys(data.apiKeys || {});
      } catch (error) {
        console.error('Failed to load API keys:', error);
      }
    }
    loadKeys();
  }, []);

  // 연결 테스트
  const handleTest = async (provider: keyof ApiKeys) => {
    if (!apiKeys[provider]) {
      alert(`${provider.toUpperCase()} API 키를 입력해주세요.`);
      return;
    }

    setTesting(true);
    setTestResult({ ...testResult, [provider]: '테스트 중...' });

    try {
      const res = await fetch('/api/autoblog/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey: apiKeys[provider] })
      });

      const data = await res.json();

      if (res.ok) {
        setTestResult({ ...testResult, [provider]: '✅ 연동 성공!' });
      } else {
        setTestResult({ ...testResult, [provider]: `❌ 실패: ${data.error}` });
      }
    } catch (error: any) {
      setTestResult({ ...testResult, [provider]: `❌ 오류: ${error.message}` });
    } finally {
      setTesting(false);
    }
  };

  // API 키 저장
  const handleSave = async () => {
    const res = await fetch('/api/autoblog/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKeys })
    });

    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      alert('저장 실패');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-3xl mx-auto p-8 space-y-8">
        {/* 헤더 */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              🔑 API 키 설정
            </h1>
            <p className="text-gray-300 mt-2">
              각 AI 서비스에서 발급받은 API 키를 입력하세요.
            </p>
          </div>
          <button
            onClick={() => router.push('/autoblog')}
            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg"
          >
            ← 돌아가기
          </button>
        </header>

        {/* API 키 입력 폼 */}
        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 space-y-6 border border-slate-700">
          {/* OpenAI */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-200">
              🤖 OpenAI API Key
              <span className="text-gray-400 font-normal ml-2">(GPT-4, DALL-E 3)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKeys.openai || ''}
                onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                placeholder="sk-..."
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={() => handleTest('openai')}
                disabled={testing || !apiKeys.openai}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg whitespace-nowrap"
              >
                테스트
              </button>
            </div>
            <p className="text-xs text-gray-400">
              발급: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">platform.openai.com</a>
            </p>
            {testResult.openai && (
              <p className={`text-xs ${testResult.openai.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
                {testResult.openai}
              </p>
            )}
          </div>

          {/* Anthropic */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-200">
              🧠 Anthropic API Key
              <span className="text-gray-400 font-normal ml-2">(Claude)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKeys.anthropic || ''}
                onChange={(e) => setApiKeys({ ...apiKeys, anthropic: e.target.value })}
                placeholder="sk-ant-..."
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={() => handleTest('anthropic')}
                disabled={testing || !apiKeys.anthropic}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg whitespace-nowrap"
              >
                테스트
              </button>
            </div>
            <p className="text-xs text-gray-400">
              발급: <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">console.anthropic.com</a>
            </p>
            {testResult.anthropic && (
              <p className={`text-xs ${testResult.anthropic.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
                {testResult.anthropic}
              </p>
            )}
          </div>

          {/* Google Gemini */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-200">
              ✨ Google Gemini API Key
              <span className="text-green-400 font-normal ml-2">(무료!)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKeys.gemini || ''}
                onChange={(e) => setApiKeys({ ...apiKeys, gemini: e.target.value })}
                placeholder="AIza..."
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={() => handleTest('gemini')}
                disabled={testing || !apiKeys.gemini}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg whitespace-nowrap"
              >
                테스트
              </button>
            </div>
            <p className="text-xs text-gray-400">
              발급: <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">aistudio.google.com</a>
            </p>
            {testResult.gemini && (
              <p className={`text-xs ${testResult.gemini.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
                {testResult.gemini}
              </p>
            )}
          </div>

          {/* Stability AI */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-200">
              🎨 Stability AI API Key
              <span className="text-gray-400 font-normal ml-2">(Stable Diffusion)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKeys.stabilityai || ''}
                onChange={(e) => setApiKeys({ ...apiKeys, stabilityai: e.target.value })}
                placeholder="sk-..."
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={() => handleTest('stabilityai')}
                disabled={testing || !apiKeys.stabilityai}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg whitespace-nowrap"
              >
                테스트
              </button>
            </div>
            <p className="text-xs text-gray-400">
              발급: <a href="https://platform.stability.ai/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">platform.stability.ai</a>
            </p>
            {testResult.stabilityai && (
              <p className={`text-xs ${testResult.stabilityai.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
                {testResult.stabilityai}
              </p>
            )}
          </div>

          {/* Google OAuth 설정 (Blogger 발행용) */}
          <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-bold text-blue-300">🔵 Google OAuth 설정 (Blogger 발행용)</h3>

            {/* Client ID */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-300">
                Client ID (OAuth)
              </label>
              <input
                type="text"
                value={apiKeys.googleClientId || ''}
                onChange={(e) => setApiKeys({ ...apiKeys, googleClientId: e.target.value })}
                placeholder="xxx.apps.googleusercontent.com"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Client Secret */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-300">
                Client Secret (OAuth)
              </label>
              <input
                type="password"
                value={apiKeys.googleClientSecret || ''}
                onChange={(e) => setApiKeys({ ...apiKeys, googleClientSecret: e.target.value })}
                placeholder="GOCSPX-..."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <p className="text-xs text-gray-400">
              발급: <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google Cloud Console</a>
              <span className="text-gray-500 ml-2">(OAuth 2.0 클라이언트 ID 생성)</span>
            </p>
            <p className="text-xs text-blue-300">
              ℹ️ API Key는 위 Gemini API 키를 사용합니다.
            </p>
          </div>

          {/* 저장 버튼 */}
          <button
            onClick={handleSave}
            className={`w-full font-semibold py-3 rounded-lg transition-colors ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {saved ? '✅ 저장 완료!' : '💾 저장하기'}
          </button>
        </div>

        {/* 보안 안내 */}
        <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4">
          <p className="text-sm text-yellow-200">
            🔒 <strong>보안:</strong> API 키는 AES-256-GCM으로 암호화되어 데이터베이스에 저장됩니다.
            절대 제3자와 공유하지 마세요.
          </p>
        </div>
      </div>
    </div>
  );
}

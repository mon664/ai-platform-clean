'use client';

import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';

interface ApiKey {
    id: string;
    name: string;
    value: string;
    type: 'openai' | 'claude' | 'gemini' | 'elevenlabs' | 'custom';
}

interface Settings {
    apiKeys: ApiKey[];
    railwayApiUrl: string;
    blogPublishUrl: string;
    webdavUrl: string;
    webdavUsername: string;
    webdavPassword: string;
}

const defaultApiKeys: ApiKey[] = [
    { id: 'openai', name: 'OpenAI API Key', value: '', type: 'openai' },
    { id: 'claude', name: 'Claude API Key', value: '', type: 'claude' },
    { id: 'gemini', name: 'Gemini API Key', value: '', type: 'gemini' },
    { id: 'elevenlabs', name: 'ElevenLabs API Key', value: '', type: 'elevenlabs' },
];

export default function SettingsPage() {
    const [mounted, setMounted] = useState(false);
    const [settings, setSettings] = useState<Settings>({
        apiKeys: defaultApiKeys,
        railwayApiUrl: '',
        blogPublishUrl: '',
        webdavUrl: '',
        webdavUsername: '',
        webdavPassword: '',
    });

    const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
    const [testStatus, setTestStatus] = useState<{ [key: string]: 'idle' | 'testing' | 'success' | 'error' }>({});
    const [testMessages, setTestMessages] = useState<{ [key: string]: string }>({});
    const [saveStatus, setSaveStatus] = useState<{ [key: string]: 'idle' | 'saving' | 'success' }>({});
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyValue, setNewKeyValue] = useState('');

    useEffect(() => {
        setMounted(true);
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            setSettings({
                apiKeys: parsed.apiKeys || defaultApiKeys,
                railwayApiUrl: parsed.railwayApiUrl || '',
                blogPublishUrl: parsed.blogPublishUrl || '',
                webdavUrl: parsed.webdavUrl || '',
                webdavUsername: parsed.webdavUsername || '',
                webdavPassword: parsed.webdavPassword || '',
            });
        }
    }, []);

    if (!mounted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                <Navigation />
                <div className="p-8">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-4xl font-bold mb-2">⚙️ 설정</h1>
                        <p className="text-gray-400 mb-8">로딩 중...</p>
                    </div>
                </div>
            </div>
        );
    }

    const saveApiKey = (id: string) => {
        setSaveStatus(prev => ({ ...prev, [id]: 'saving' }));

        // 현재 settings 상태를 그대로 저장
        localStorage.setItem('appSettings', JSON.stringify(settings));

        setSaveStatus(prev => ({ ...prev, [id]: 'success' }));
        setTimeout(() => {
            setSaveStatus(prev => ({ ...prev, [id]: 'idle' }));
        }, 2000);
    };

    const saveSetting = (key: keyof Omit<Settings, 'apiKeys'>) => {
        setSaveStatus(prev => ({ ...prev, [key]: 'saving' }));

        localStorage.setItem('appSettings', JSON.stringify(settings));

        setSaveStatus(prev => ({ ...prev, [key]: 'success' }));
        setTimeout(() => {
            setSaveStatus(prev => ({ ...prev, [key]: 'idle' }));
        }, 2000);
    };

    const handleApiKeyChange = (id: string, value: string) => {
        setSettings(prev => ({
            ...prev,
            apiKeys: prev.apiKeys.map(key =>
                key.id === id ? { ...key, value } : key
            )
        }));
    };

    const handleSettingChange = (key: keyof Omit<Settings, 'apiKeys'>, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const toggleShowKey = (id: string) => {
        setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const addCustomApiKey = () => {
        if (!newKeyName.trim() || !newKeyValue.trim()) {
            alert('API 키 이름과 값을 모두 입력해주세요');
            return;
        }

        const newKey: ApiKey = {
            id: `custom-${Date.now()}`,
            name: newKeyName,
            value: newKeyValue,
            type: 'custom',
        };

        const updatedSettings = {
            ...settings,
            apiKeys: [...settings.apiKeys, newKey]
        };

        localStorage.setItem('appSettings', JSON.stringify(updatedSettings));
        setSettings(updatedSettings);
        setNewKeyName('');
        setNewKeyValue('');
    };

    const removeApiKey = (id: string) => {
        const updatedSettings = {
            ...settings,
            apiKeys: settings.apiKeys.filter(key => key.id !== id)
        };

        localStorage.setItem('appSettings', JSON.stringify(updatedSettings));
        setSettings(updatedSettings);
    };

    const testApiKey = async (apiKey: ApiKey) => {
        const { id, value, type } = apiKey;

        if (!value || value.trim() === '') {
            setTestMessages(prev => ({ ...prev, [id]: 'API 키를 먼저 입력해주세요' }));
            setTestStatus(prev => ({ ...prev, [id]: 'error' }));
            setTimeout(() => setTestStatus(prev => ({ ...prev, [id]: 'idle' })), 3000);
            return;
        }

        setTestStatus(prev => ({ ...prev, [id]: 'testing' }));
        setTestMessages(prev => ({ ...prev, [id]: '테스트 중...' }));

        try {
            let response: Response | undefined;

            if (type === 'openai') {
                response = await fetch('https://api.openai.com/v1/models', {
                    headers: { 'Authorization': `Bearer ${value}` }
                });
            } else if (type === 'claude') {
                response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'x-api-key': value,
                        'anthropic-version': '2023-06-01',
                        'content-type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'claude-3-haiku-20240307',
                        max_tokens: 10,
                        messages: [{ role: 'user', content: 'test' }]
                    })
                });
            } else if (type === 'gemini') {
                response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${value}`);
            } else if (type === 'elevenlabs') {
                response = await fetch('https://api.elevenlabs.io/v1/user', {
                    headers: { 'xi-api-key': value }
                });
            } else {
                setTestMessages(prev => ({ ...prev, [id]: '⚠️ 커스텀 API 키는 자동 테스트를 지원하지 않습니다' }));
                setTestStatus(prev => ({ ...prev, [id]: 'idle' }));
                setTimeout(() => setTestMessages(prev => ({ ...prev, [id]: '' })), 3000);
                return;
            }

            if (response && response.ok) {
                setTestStatus(prev => ({ ...prev, [id]: 'success' }));
                setTestMessages(prev => ({ ...prev, [id]: '✅ API 키가 유효합니다!' }));
            } else {
                setTestStatus(prev => ({ ...prev, [id]: 'error' }));
                setTestMessages(prev => ({
                    ...prev,
                    [id]: `❌ 유효하지 않은 API 키입니다 (${response?.status})`
                }));
            }
        } catch (error) {
            setTestStatus(prev => ({ ...prev, [id]: 'error' }));
            setTestMessages(prev => ({
                ...prev,
                [id]: `❌ 테스트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
            }));
        }

        setTimeout(() => {
            setTestStatus(prev => ({ ...prev, [id]: 'idle' }));
            setTestMessages(prev => ({ ...prev, [id]: '' }));
        }, 5000);
    };

    const getButtonColor = (type: string) => {
        switch (type) {
            case 'openai': return 'bg-blue-600 hover:bg-blue-700';
            case 'claude': return 'bg-purple-600 hover:bg-purple-700';
            case 'gemini': return 'bg-green-600 hover:bg-green-700';
            case 'elevenlabs': return 'bg-cyan-600 hover:bg-cyan-700';
            default: return 'bg-gray-600 hover:bg-gray-700';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
            <Navigation />
            <div className="p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-bold mb-2">⚙️ 설정</h1>
                    <p className="text-gray-400 mb-8">API 키 및 서비스 설정을 관리합니다</p>

                    {/* API Keys Section */}
                    <div className="bg-gray-800 rounded-lg p-6 mb-6">
                        <h2 className="text-2xl font-bold mb-4">🔑 API 키</h2>
                        <p className="text-sm text-gray-400 mb-6">
                            API 키는 브라우저의 localStorage에 안전하게 저장됩니다. 서버로 전송되지 않습니다.
                        </p>

                        {settings.apiKeys.map((apiKey) => (
                            <div key={apiKey.id} className="mb-6 p-4 bg-gray-700/50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-semibold">{apiKey.name}</label>
                                    {apiKey.type === 'custom' && (
                                        <button
                                            onClick={() => removeApiKey(apiKey.id)}
                                            className="text-red-400 hover:text-red-300 text-sm"
                                        >
                                            ❌ 삭제
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type={showKeys[apiKey.id] ? 'text' : 'password'}
                                        value={apiKey.value}
                                        onChange={(e) => handleApiKeyChange(apiKey.id, e.target.value)}
                                        placeholder={apiKey.type === 'openai' ? 'sk-proj-...' :
                                            apiKey.type === 'claude' ? 'sk-ant-api03-...' :
                                                apiKey.type === 'gemini' ? 'AIzaSy...' : '...'}
                                        className="flex-1 bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={() => toggleShowKey(apiKey.id)}
                                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                    >
                                        {showKeys[apiKey.id] ? '🙈' : '👁️'}
                                    </button>
                                    <button
                                        onClick={() => testApiKey(apiKey)}
                                        disabled={testStatus[apiKey.id] === 'testing'}
                                        className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${testStatus[apiKey.id] === 'success' ? 'bg-green-600 hover:bg-green-700' :
                                                testStatus[apiKey.id] === 'error' ? 'bg-red-600 hover:bg-red-700' :
                                                    getButtonColor(apiKey.type)
                                            } disabled:bg-gray-600`}
                                    >
                                        {testStatus[apiKey.id] === 'testing' ? '⏳' : '🧪 테스트'}
                                    </button>
                                    <button
                                        onClick={() => saveApiKey(apiKey.id)}
                                        disabled={saveStatus[apiKey.id] === 'saving'}
                                        className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${saveStatus[apiKey.id] === 'success' ? 'bg-green-600' :
                                                getButtonColor(apiKey.type)
                                            } disabled:bg-gray-600`}
                                    >
                                        {saveStatus[apiKey.id] === 'saving' ? '⏳' :
                                            saveStatus[apiKey.id] === 'success' ? '✅ 저장됨' : '💾 저장'}
                                    </button>
                                </div>
                                {testMessages[apiKey.id] && (
                                    <p className={`text-xs mt-2 ${testStatus[apiKey.id] === 'success' ? 'text-green-400' : 'text-red-400'
                                        }`}>{testMessages[apiKey.id]}</p>
                                )}
                                {apiKey.type === 'openai' && <p className="text-xs text-gray-500 mt-1">GPT-4, GPT-3.5 등 OpenAI 모델 사용</p>}
                                {apiKey.type === 'claude' && <p className="text-xs text-gray-500 mt-1">Claude 3 Opus, Sonnet 등 사용</p>}
                                {apiKey.type === 'gemini' && <p className="text-xs text-gray-500 mt-1">Gemini Pro, Gemini Ultra 등 사용</p>}
                                {apiKey.type === 'elevenlabs' && <p className="text-xs text-gray-500 mt-1">고품질 TTS (Text-to-Speech) 생성</p>}
                            </div>
                        ))}

                        {/* Add Custom API Key */}
                        <div className="mt-6 p-4 bg-gray-700/30 rounded-lg border-2 border-dashed border-gray-600">
                            <h3 className="text-sm font-semibold mb-3">➕ 커스텀 API 키 추가</h3>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <input
                                    type="text"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    placeholder="API 키 이름 (예: Railway API)"
                                    className="bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                    type="text"
                                    value={newKeyValue}
                                    onChange={(e) => setNewKeyValue(e.target.value)}
                                    placeholder="API 키 값"
                                    className="bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <button
                                onClick={addCustomApiKey}
                                className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            >
                                추가
                            </button>
                        </div>
                    </div>

                    {/* Railway API URL */}
                    <div className="bg-gray-800 rounded-lg p-6 mb-6">
                        <h2 className="text-2xl font-bold mb-4">🚂 Railway API 설정</h2>
                        <div className="mb-6">
                            <label className="block text-sm font-semibold mb-2">Railway API URL</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={settings.railwayApiUrl}
                                    onChange={(e) => handleSettingChange('railwayApiUrl', e.target.value)}
                                    placeholder="https://your-railway-app.railway.app"
                                    className="flex-1 bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={() => saveSetting('railwayApiUrl')}
                                    disabled={saveStatus['railwayApiUrl'] === 'saving'}
                                    className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${saveStatus['railwayApiUrl'] === 'success' ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
                                        } disabled:bg-gray-600`}
                                >
                                    {saveStatus['railwayApiUrl'] === 'saving' ? '⏳' :
                                        saveStatus['railwayApiUrl'] === 'success' ? '✅ 저장됨' : '💾 저장'}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Railway에 배포된 Python 백엔드 API URL</p>
                        </div>
                    </div>

                    {/* Blog Publishing Section */}
                    <div className="bg-gray-800 rounded-lg p-6 mb-6">
                        <h2 className="text-2xl font-bold mb-4">📝 블로그 발행 설정</h2>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold mb-2">블로그 발행 URL</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={settings.blogPublishUrl}
                                    onChange={(e) => handleSettingChange('blogPublishUrl', e.target.value)}
                                    placeholder="https://yourblog.com/api/publish"
                                    className="flex-1 bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={() => saveSetting('blogPublishUrl')}
                                    disabled={saveStatus['blogPublishUrl'] === 'saving'}
                                    className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${saveStatus['blogPublishUrl'] === 'success' ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
                                        } disabled:bg-gray-600`}
                                >
                                    {saveStatus['blogPublishUrl'] === 'saving' ? '⏳' :
                                        saveStatus['blogPublishUrl'] === 'success' ? '✅ 저장됨' : '💾 저장'}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">생성된 블로그 글을 자동으로 발행할 URL</p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold mb-2">WebDAV URL (선택)</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={settings.webdavUrl}
                                    onChange={(e) => handleSettingChange('webdavUrl', e.target.value)}
                                    placeholder="https://webdav.example.com/remote.php/dav/files/username/"
                                    className="flex-1 bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                    onClick={() => saveSetting('webdavUrl')}
                                    disabled={saveStatus['webdavUrl'] === 'saving'}
                                    className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${saveStatus['webdavUrl'] === 'success' ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
                                        } disabled:bg-gray-600`}
                                >
                                    {saveStatus['webdavUrl'] === 'saving' ? '⏳' :
                                        saveStatus['webdavUrl'] === 'success' ? '✅ 저장됨' : '💾 저장'}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Nextcloud, ownCloud 등의 WebDAV 서버</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-semibold mb-2">WebDAV 사용자명</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={settings.webdavUsername}
                                        onChange={(e) => handleSettingChange('webdavUsername', e.target.value)}
                                        placeholder="username"
                                        className="flex-1 bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={() => saveSetting('webdavUsername')}
                                        disabled={saveStatus['webdavUsername'] === 'saving'}
                                        className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${saveStatus['webdavUsername'] === 'success' ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
                                            } disabled:bg-gray-600`}
                                    >
                                        {saveStatus['webdavUsername'] === 'saving' ? '⏳' :
                                            saveStatus['webdavUsername'] === 'success' ? '✅' : '💾'}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2">WebDAV 비밀번호</label>
                                <div className="flex gap-2">
                                    <input
                                        type="password"
                                        value={settings.webdavPassword}
                                        onChange={(e) => handleSettingChange('webdavPassword', e.target.value)}
                                        placeholder="password"
                                        className="flex-1 bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={() => saveSetting('webdavPassword')}
                                        disabled={saveStatus['webdavPassword'] === 'saving'}
                                        className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${saveStatus['webdavPassword'] === 'success' ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'
                                            } disabled:bg-gray-600`}
                                    >
                                        {saveStatus['webdavPassword'] === 'saving' ? '⏳' :
                                            saveStatus['webdavPassword'] === 'success' ? '✅' : '💾'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="mt-6 bg-yellow-900/30 border border-yellow-600 rounded-lg p-4">
                        <p className="text-yellow-200 text-sm">
                            <strong>⚠️ 보안 안내:</strong> API 키는 브라우저의 localStorage에만 저장되며,
                            절대 서버로 전송되지 않습니다. 공용 컴퓨터에서는 사용 후 반드시 로그아웃하세요.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

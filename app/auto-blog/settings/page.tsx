"use client"
import { useEffect, useState } from 'react'
import { fetchWithAuth } from '@/lib/client-auth'

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState({ openai: '', anthropic: '', gemini: '', stabilityai: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchWithAuth('/api/auto-blog/settings')
        const data = await res.json()
        setApiKeys({ openai: '', anthropic: '', gemini: '', stabilityai: '', ...(data.apiKeys || {}) })
      } catch {}
    })()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetchWithAuth('/api/auto-blog/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKeys }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } else {
        alert('저장 실패')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-gray-900 text-white p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold">⚙️ API 키 설정</h1>
          <p className="text-gray-300 mt-2">OpenAI / Anthropic / Google / StabilityAI</p>
        </header>

        <div className="bg-gray-800 rounded-lg p-6 space-y-6">
          {[
            { k: 'openai', label: '🤖 OpenAI API Key (GPT-4, DALL·E 3)', ph: 'sk-...' },
            { k: 'anthropic', label: '🧠 Anthropic API Key (Claude)', ph: 'sk-ant-...' },
            { k: 'gemini', label: '✨ Google Gemini API Key', ph: 'AIza...' },
            { k: 'stabilityai', label: '🎨 Stability AI API Key (Stable Diffusion)', ph: 'sk-...' },
          ].map((f) => (
            <div key={f.k}>
              <label className="block text-sm font-semibold mb-2">{f.label}</label>
              <input
                type="password"
                value={(apiKeys as any)[f.k] || ''}
                onChange={(e) => setApiKeys({ ...apiKeys, [f.k]: e.target.value })}
                placeholder={f.ph}
                className="w-full bg-gray-700 rounded px-4 py-2 text-white"
              />
            </div>
          ))}

          <button onClick={handleSave} disabled={saving} className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg">
            {saving ? '저장 중…' : saved ? '✅ 저장 완료!' : '💾 저장하기'}
          </button>
        </div>

        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 text-sm">
          🔒 API 키는 암호화되어 저장됩니다. ENCRYPTION_KEY 환경 변수 설정을 권장합니다.
        </div>
      </div>
    </div>
  )
}


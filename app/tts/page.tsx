'use client'
import { useState, useEffect } from 'react'
import Navigation from '../components/Navigation'

interface Speaker {
  text: string
  improvedText: string
  voice: string
  cloudVoice: string
  tone: string
}

export default function TTSPage() {
  const [speaker1, setSpeaker1] = useState<Speaker>({ text: '', improvedText: '', voice: '', cloudVoice: 'ko-KR-Neural2-A', tone: '' })
  const [speaker2, setSpeaker2] = useState<Speaker>({ text: '', improvedText: '', voice: '', cloudVoice: 'ko-KR-Neural2-B', tone: '' })
  const [useTwoSpeakers, setUseTwoSpeakers] = useState(false)
  const [speed, setSpeed] = useState(1.0)
  const [pitch, setPitch] = useState(1.0)
  const [loading, setLoading] = useState(false)
  const [improving, setImproving] = useState(false)
  const [error, setError] = useState('')
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      const koVoices = voices.filter(v => v.lang.startsWith('ko'))
      setBrowserVoices(koVoices.length > 0 ? koVoices : voices.slice(0, 10))
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
  }, [])

  const improveSpeaker = async (speakerNum: 1 | 2) => {
    const speaker = speakerNum === 1 ? speaker1 : speaker2

    if (!speaker.text.trim()) {
      setError(`화자 ${speakerNum}의 텍스트를 입력해주세요`)
      return
    }

    setImproving(true)
    setError('')

    try {
      const res = await fetch('/api/tts/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: speaker.text, tone: speaker.tone })
      })

      if (!res.ok) throw new Error('대본 개선 실패')

      const data = await res.json()

      if (speakerNum === 1) {
        setSpeaker1({ ...speaker1, improvedText: data.improvedText })
      } else {
        setSpeaker2({ ...speaker2, improvedText: data.improvedText })
      }
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다')
    } finally {
      setImproving(false)
    }
  }

  const playTTS = (speakerNum: 1 | 2) => {
    const speaker = speakerNum === 1 ? speaker1 : speaker2
    const textToSpeak = speaker.improvedText || speaker.text

    if (!textToSpeak.trim()) {
      setError(`화자 ${speakerNum}의 텍스트를 입력해주세요`)
      return
    }

    setError('')
    const utterance = new SpeechSynthesisUtterance(textToSpeak)

    if (speaker.voice) {
      const selectedVoice = browserVoices.find(v => v.name === speaker.voice)
      if (selectedVoice) utterance.voice = selectedVoice
    }

    utterance.rate = speed
    utterance.pitch = pitch
    utterance.onend = () => setIsPlaying(false)
    utterance.onerror = () => setIsPlaying(false)

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    setIsPlaying(true)
  }

  const pauseResumeTTS = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
    } else if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause()
    }
  }

  const stopTTS = () => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
  }

  const generateTTSWav = async (speakerNum: 1 | 2) => {
    const speaker = speakerNum === 1 ? speaker1 : speaker2
    let finalText = speaker.improvedText || speaker.text

    if (!finalText.trim()) {
      setError('텍스트를 입력해주세요')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 톤이 있으면 먼저 AI로 텍스트 개선
      if (speaker.tone && speaker.tone.trim()) {
        const improveRes = await fetch('/api/tts/improve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: finalText, tone: speaker.tone })
        })
        if (improveRes.ok) {
          const improveData = await improveRes.json()
          finalText = improveData.improvedText
        }
      }

      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: finalText, voice: speaker.cloudVoice, speed, pitch, tone: speaker.tone })
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || '음성 생성 실패')
      }

      const blob = await res.blob()
      setAudioBlob(blob)
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const downloadWav = () => {
    if (!audioBlob) return
    const url = URL.createObjectURL(audioBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tts-${Date.now()}.wav`
    a.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-gray-900 text-white">
      <Navigation />
      <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-center">AI 음성 생성기</h1>
        <p className="text-gray-400 text-center mb-8">AI 대본 개선 + 브라우저 TTS 음성</p>

        {/* 2명 음성 토글 */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={useTwoSpeakers}
              onChange={(e) => setUseTwoSpeakers(e.target.checked)}
              className="w-5 h-5 mr-3"
            />
            <span className="text-lg font-semibold">2명의 음성 사용 (대화형)</span>
          </label>
        </div>

        {/* 화자 1 */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">🎤 화자 1</h3>

          <label className="block text-sm font-semibold mb-2">텍스트</label>
          <textarea
            value={speaker1.text}
            onChange={(e) => setSpeaker1({ ...speaker1, text: e.target.value })}
            placeholder="화자 1의 대사를 입력하세요..."
            className="w-full h-24 bg-gray-700 text-white rounded-lg p-4 mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            maxLength={5000}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
            <div>
              <label className="block text-sm font-semibold mb-2">브라우저 음성 (재생용)</label>
              <select
                value={speaker1.voice}
                onChange={(e) => setSpeaker1({ ...speaker1, voice: e.target.value })}
                className="w-full bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">기본 음성</option>
                {browserVoices.map(v => (
                  <option key={v.name} value={v.name}>{v.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Cloud TTS 음성 (WAV용)</label>
              <select
                value={speaker1.cloudVoice}
                onChange={(e) => setSpeaker1({ ...speaker1, cloudVoice: e.target.value })}
                className="w-full bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
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
                <optgroup label="Standard (기본)">
                  <option value="ko-KR-Standard-A">Standard-A (여성)</option>
                  <option value="ko-KR-Standard-B">Standard-B (여성)</option>
                  <option value="ko-KR-Standard-C">Standard-C (남성)</option>
                  <option value="ko-KR-Standard-D">Standard-D (남성)</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">SSML 입력 (선택 사항)</label>
              <input
                type="text"
                value={speaker1.tone}
                onChange={(e) => setSpeaker1({ ...speaker1, tone: e.target.value })}
                placeholder="<speak>...</speak> 코드를 여기에 입력"
                className="w-full bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* AI 개선 버튼 */}
          <button
            onClick={() => improveSpeaker(1)}
            disabled={improving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg mb-3 transition-colors"
          >
            {improving ? 'AI 개선 중...' : '🤖 AI로 대본 개선하기'}
          </button>

          {/* 개선된 텍스트 */}
          {speaker1.improvedText && (
            <div className="mb-3">
              <label className="block text-sm font-semibold mb-2">개선된 대본</label>
              <textarea
                value={speaker1.improvedText}
                onChange={(e) => setSpeaker1({ ...speaker1, improvedText: e.target.value })}
                className="w-full h-24 bg-gray-700 text-white rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          {/* 음성 듣기 버튼 */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => playTTS(1)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg"
            >
              ▶ 재생
            </button>
            <button
              onClick={pauseResumeTTS}
              disabled={!isPlaying}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg"
            >
              ⏸ 일시정지
            </button>
            <button
              onClick={stopTTS}
              disabled={!isPlaying}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg"
            >
              ⏹ 정지
            </button>
          </div>
        </div>

        {/* 화자 2 */}
        {useTwoSpeakers && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">🎤 화자 2</h3>

            <label className="block text-sm font-semibold mb-2">텍스트</label>
            <textarea
              value={speaker2.text}
              onChange={(e) => setSpeaker2({ ...speaker2, text: e.target.value })}
              placeholder="화자 2의 대사를 입력하세요..."
              className="w-full h-24 bg-gray-700 text-white rounded-lg p-4 mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              maxLength={5000}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              <div>
                <label className="block text-sm font-semibold mb-2">브라우저 음성 (재생용)</label>
                <select
                  value={speaker2.voice}
                  onChange={(e) => setSpeaker2({ ...speaker2, voice: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">기본 음성</option>
                  {browserVoices.map(v => (
                    <option key={v.name} value={v.name}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Cloud TTS 음성 (WAV용)</label>
                <select
                  value={speaker2.cloudVoice}
                  onChange={(e) => setSpeaker2({ ...speaker2, cloudVoice: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
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
                  <optgroup label="Standard (기본)">
                    <option value="ko-KR-Standard-A">Standard-A (여성)</option>
                    <option value="ko-KR-Standard-B">Standard-B (여성)</option>
                    <option value="ko-KR-Standard-C">Standard-C (남성)</option>
                    <option value="ko-KR-Standard-D">Standard-D (남성)</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">SSML 입력 (선택 사항)</label>
                <input
                  type="text"
                  value={speaker2.tone}
                  onChange={(e) => setSpeaker2({ ...speaker2, tone: e.target.value })}
                  placeholder="<speak>...</speak> 코드를 여기에 입력"
                  className="w-full bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* AI 개선 버튼 */}
            <button
              onClick={() => improveSpeaker(2)}
              disabled={improving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg mb-3 transition-colors"
            >
              {improving ? 'AI 개선 중...' : '🤖 AI로 대본 개선하기'}
            </button>

            {/* 개선된 텍스트 */}
            {speaker2.improvedText && (
              <div className="mb-3">
                <label className="block text-sm font-semibold mb-2">개선된 대본</label>
                <textarea
                  value={speaker2.improvedText}
                  onChange={(e) => setSpeaker2({ ...speaker2, improvedText: e.target.value })}
                  className="w-full h-24 bg-gray-700 text-white rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            {/* 음성 듣기 버튼 */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => playTTS(2)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg"
              >
                ▶ 재생
              </button>
              <button
                onClick={pauseResumeTTS}
                disabled={!isPlaying}
                className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg"
              >
                ⏸ 일시정지
              </button>
              <button
                onClick={stopTTS}
                disabled={!isPlaying}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg"
              >
                ⏹ 정지
              </button>
            </div>
          </div>
        )}

        {/* 공통 설정 */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">음성 설정</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-3">
                속도: {speed.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>느림 (0.5x)</span>
                <span>빠름 (2.0x)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3">
                음높이: {pitch.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>낮음 (0.5)</span>
                <span>높음 (2.0)</span>
              </div>
            </div>
          </div>
        </div>

        {/* WAV 생성 (현재 브라우저 TTS는 WAV 추출 불가) */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">WAV 파일 생성</h3>
          <p className="text-sm text-gray-400 mb-4">
            ⚠️ 브라우저 TTS는 WAV 파일 추출이 불가능합니다. Google Cloud TTS API가 필요합니다.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => generateTTSWav(1)}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg"
            >
              화자 1 WAV 생성
            </button>
            <button
              onClick={() => generateTTSWav(2)}
              disabled={loading || !useTwoSpeakers}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg"
            >
              화자 2 WAV 생성
            </button>
          </div>
          {audioBlob && (
            <button
              onClick={downloadWav}
              className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg"
            >
              📥 WAV 다운로드
            </button>
          )}
        </div>

        {/* 에러 */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        <p className="text-sm text-gray-400 text-center mt-6">
          💡 브라우저 TTS = 시스템 음성만 지원 (Google, Microsoft 등)<br/>
          💡 Google Cloud TTS API = 별도 인증 필요 (Zephyr, Schedar 등)
        </p>
      </div>
      </div>
    </div>
  )
}

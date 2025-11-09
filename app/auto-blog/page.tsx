"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchWithAuth } from '@/lib/client-auth'
import { TEXT_MODELS, IMAGE_MODELS, estimateCostImage, estimateCostText } from '@/lib/auto-blog/models'
import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'
import { marked } from 'marked'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false, loading: () => <p>에디터를 불러오는 중...</p> })

type HistoryItem = {
  topic: { title: string }
  result: { success: boolean; url: string }
  duration: number
  imagesGenerated: number
  timestamp: string
}

export default function AutoBlogDashboard() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    title: '',
    category: 'marketing',
    keywords: '',
    mode: 'keywords' as 'keywords' | 'prompt',
    prompt: '',
    textModel: 'gemini-1.0-flash',
    imageModel: 'sd-xl',
    targetTokens: 1200,
    imageCount: 3,
    enableFinishing: false,
    keywordLimit: 8,
    excludedBrands: '',
  })
  const [generated, setGenerated] = useState<{ topic?: any; content?: any; images?: any[]; cost?: any } | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const quillRef = useRef<any>(null)

  const estimatedCost = useMemo(() => {
    return {
      text: estimateCostText(settings.textModel, settings.targetTokens),
      image: estimateCostImage(settings.imageModel, settings.imageCount),
      get total() { return this.text + this.image },
    }
  }, [settings])

  async function loadHistory() {
    const res = await fetch('/api/auto-blog/history')
    const data = await res.json()
    setHistory(data.items || [])
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const handleManualGenerate = async () => {
    setLoading(true)
    try {
      const payload = {
        title: settings.title || undefined,
        keywords: settings.keywords ? settings.keywords.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        category: settings.category,
        textModel: settings.textModel,
        imageModel: settings.imageModel,
        targetTokens: settings.targetTokens,
        imageCount: settings.imageCount,
        enableFinishing: settings.enableFinishing,
        prompt: settings.mode === 'prompt' ? settings.prompt : undefined,
      }
      const res = await fetchWithAuth('/api/auto-blog/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('생성 실패')
      const data = await res.json()
      setGenerated(data)
      setEditTitle(data.content?.title || settings.title)
      const html = typeof window !== 'undefined' ? (marked.parse(data.content?.content || '') as string) : (data.content?.content || '')
      setEditContent(html)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePublishEdited = async () => {
    if (!editTitle?.trim()) { alert('제목을 입력하세요'); return }
    if (!editContent?.trim()) { alert('내용을 입력하세요'); return }
    setLoading(true)
    try {
      const res = await fetchWithAuth('/api/auto-blog/manual', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: editTitle, content: editContent, images: generated?.images || [] }) })
      const data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.error || '게시 실패')
      alert('게시 완료')
      await loadHistory()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ font: [] }],
        [{ size: ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ align: [] }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean'],
      ],
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-gray-900 text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold">🤖 AI 자동 블로그 관리</h1>
          <p className="text-gray-300 mt-2">주제→본문→이미지→게시 자동화 파이프라인</p>
          <div className="mt-4">
            <a href="/auto-blog/settings" className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-md">⚙️ API 키 설정</a>
          </div>
        </header>

        <div className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-2xl font-bold mb-2">생성 옵션</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 flex items-center space-x-4">
              <label className="text-sm font-semibold">모드</label>
              <label className="flex items-center space-x-2 text-sm"><input type="radio" checked={settings.mode==='keywords'} onChange={()=>setSettings({...settings, mode:'keywords'})} /> <span>키워드 모드</span></label>
              <label className="flex items-center space-x-2 text-sm"><input type="radio" checked={settings.mode==='prompt'} onChange={()=>setSettings({...settings, mode:'prompt'})} /> <span>프롬프트 모드</span></label>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">제목(선택)</label>
              <input value={settings.title} onChange={(e) => setSettings({ ...settings, title: e.target.value })} placeholder="직장인 점심 상권 공략법" className="w-full bg-gray-700 rounded px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">카테고리</label>
              <select value={settings.category} onChange={(e) => setSettings({ ...settings, category: e.target.value })} className="w-full bg-gray-700 rounded px-4 py-2 text-white">
                <option value="startup">창업</option>
                <option value="operation">운영</option>
                <option value="marketing">마케팅</option>
                <option value="menu">메뉴</option>
                <option value="trend">트렌드</option>
                <option value="franchise">프랜차이즈</option>
              </select>
            </div>
            {settings.mode==='keywords' ? (
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-semibold">키워드(쉼표로 구분)</label>
                <div className="flex gap-2">
                  <input value={settings.keywords} onChange={(e) => setSettings({ ...settings, keywords: e.target.value })} placeholder="점심특가, 회전율, 메뉴단순화" className="flex-1 bg-gray-700 rounded px-4 py-2 text-white" />
                  <button type="button" onClick={async ()=>{
                    try {
                      const res = await fetchWithAuth('/api/auto-blog/keywords/improve', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ keywords: settings.keywords.split(',').map(s=>s.trim()).filter(Boolean), textModel: settings.textModel, countLimit: settings.keywordLimit, excludedBrands: settings.excludedBrands }) })
                      const data = await res.json()
                      if (data.improved) setSettings(s=>({ ...s, keywords: data.improved }))
                    } catch {}
                  }} className="bg-blue-600 hover:bg-blue-700 text-white text-sm rounded px-3">키워드 개선</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">개수 제한</label>
                    <input type="number" min={1} max={20} value={settings.keywordLimit} onChange={(e)=>setSettings({...settings, keywordLimit: parseInt(e.target.value||'1')})} className="w-full bg-gray-700 rounded px-3 py-2 text-white text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">브랜드 제외어(쉼표 구분)</label>
                    <input value={settings.excludedBrands} onChange={(e)=>setSettings({...settings, excludedBrands: e.target.value})} placeholder="예: 스타벅스, 맥도날드" className="w-full bg-gray-700 rounded px-3 py-2 text-white text-sm" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">프롬프트</label>
                <textarea value={settings.prompt} onChange={(e)=>setSettings({...settings, prompt:e.target.value})} rows={4} placeholder="원하는 주제/톤/구체 지시를 작성하세요." className="w-full bg-gray-700 rounded px-4 py-2 text-white"></textarea>
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold mb-2">텍스트 모델</label>
              <select value={settings.textModel} onChange={(e) => setSettings({ ...settings, textModel: e.target.value })} className="w-full bg-gray-700 rounded px-4 py-2 text-white text-sm">
                {TEXT_MODELS.map(m => (<option key={m.id} value={m.id}>{m.name} - ${m.costPer1kTokens}/1k</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">이미지 모델</label>
              <select value={settings.imageModel} onChange={(e) => setSettings({ ...settings, imageModel: e.target.value })} className="w-full bg-gray-700 rounded px-4 py-2 text-white text-sm">
                {IMAGE_MODELS.map(m => (<option key={m.id} value={m.id}>{m.name} - ${m.costPerImage}/장</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">목표 토큰 수</label>
              <input type="number" min={300} max={10000} step={100} value={settings.targetTokens} onChange={(e) => setSettings({ ...settings, targetTokens: parseInt(e.target.value || '0') })} className="w-full bg-gray-700 rounded px-4 py-2 text-white" />
              <p className="text-xs text-gray-400 mt-1">약 {Math.round(settings.targetTokens * 0.75)}자 / {Math.ceil(settings.targetTokens * 0.75 / 500)}분</p>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">이미지 개수</label>
              <input type="number" min={0} max={10} value={settings.imageCount} onChange={(e) => setSettings({ ...settings, imageCount: parseInt(e.target.value || '0') })} className="w-full bg-gray-700 rounded px-4 py-2 text-white" />
            </div>
            <div className="md:col-span-2 flex items-center space-x-2">
              <input id="finishing" type="checkbox" checked={settings.enableFinishing} onChange={(e) => setSettings({ ...settings, enableFinishing: e.target.checked })} className="w-5 h-5" />
              <label htmlFor="finishing" className="text-sm font-semibold">마감 처리 활성화(Gemini로 최종 다듬기)</label>
            </div>
          </div>
          <div className="bg-black/20 rounded p-4 text-sm">
            <p>💰 예상 비용 · 텍스트 ${estimatedCost.text.toFixed(4)} + 이미지 ${estimatedCost.image.toFixed(4)} = <span className="font-bold text-green-400">${(estimatedCost.total).toFixed(4)}</span></p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleManualGenerate} disabled={loading} className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg">{loading ? '생성 중…' : '블로그 글 생성하기'}</button>
          </div>
        </div>

        <section className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">생성 이력</h2>
          <div className="space-y-3">
            {history.length === 0 && <p className="text-gray-400">기록이 없습니다.</p>}
            {history.map((h, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-700 rounded-md p-4">
                <div>
                  <p className="font-semibold">{h.topic?.title}</p>
                  <p className="text-sm text-gray-300">{new Date(h.timestamp).toLocaleString()} · {h.duration}ms · 이미지 {h.imagesGenerated}개</p>
                </div>
                <a className={`text-sm ${h.result?.success ? 'text-green-400' : 'text-red-400'}`} href={h.result?.url || '#'}>
                  {h.result?.success ? '열기' : '실패'}
                </a>
              </div>
            ))}
          </div>
        </section>

        {generated && (
          <section className="bg-gray-800 rounded-lg p-6 space-y-4">
            <h2 className="text-2xl font-bold">생성 결과 편집</h2>
            <input value={editTitle} onChange={(e)=>setEditTitle(e.target.value)} className="w-full bg-gray-700 rounded px-4 py-2 text-white text-xl font-bold" />
            {generated.images && generated.images.length>0 && (
              <div className="bg-black/20 rounded p-3">
                <p className="text-sm mb-2">이미지 에셋 (클릭하여 본문에 삽입)</p>
                <div className="flex flex-wrap gap-2">
                  {generated.images.map((img:any, i:number)=> (
                    <button key={i} onClick={()=>{
                      const quill = quillRef.current?.getEditor?.();
                      const range = quill?.getSelection?.();
                      if (quill) quill.insertEmbed(range?.index || 0, 'image', img.base64 ? `data:image/png;base64,${img.base64}` : img.url || '');
                    }} className="border border-gray-600 rounded overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img alt={img.alt||''} src={img.base64?`data:image/png;base64,${img.base64}`:(img.url||'')} className="w-24 h-16 object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <ReactQuill ref={quillRef} theme="snow" value={editContent} onChange={setEditContent} modules={modules as any} className="bg-white text-black rounded" />
            <div className="flex gap-3">
              <button onClick={handlePublishEdited} disabled={loading} className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg">{loading ? '게시 중…' : '게시하기'}</button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

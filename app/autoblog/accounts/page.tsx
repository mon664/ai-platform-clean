'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type BlogPlatform = 'blogger' | 'wordpress' | 'tistory';

interface BloggerAccount {
  id: string;
  platform: 'blogger';
  email: string;
  name: string;
  picture?: string;
  connectedAt: string;
}

interface WordPressAccount {
  id: number;
  platform: 'wordpress';
  name: string;
  siteUrl: string;
  username: string;
  createdAt: string;
}

interface TistoryAccount {
  id: number;
  platform: 'tistory';
  name: string;
  blogName: string;
  tistoryUrl?: string;
  createdAt: string;
}

type BlogAccount = BloggerAccount | WordPressAccount | TistoryAccount;

export default function AccountsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<BlogAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<BlogPlatform>('wordpress');
  const [saving, setSaving] = useState(false);
  const [editingAccount, setEditingAccount] = useState<WordPressAccount | TistoryAccount | null>(null);

  const [formData, setFormData] = useState({
    name: '', siteUrl: '', username: '', applicationPassword: '',
    blogName: '', tistoryId: '', tistoryPassword: '', tistoryUrl: ''
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      // 통합 계정 API에서 모두 가져오기
      const res = await fetch('/api/autoblog/accounts');
      const data = await res.json();

      // 중복 제거를 위한 Map (ID를 문자열로 변환하여 비교)
      const accountMap = new Map();

      // API에서 가져온 계정들
      const apiAccounts = data.accounts || [];
      for (const account of apiAccounts) {
        const id = String(account.id);
        accountMap.set(id, account);
      }

      setAccounts(Array.from(accountMap.values()));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnectBlogger() {
    setConnecting(true);
    try {
      const res = await fetch('/api/autoblog/auth/blogger');
      const data = await res.json();
      if (data.authUrl) window.location.href = data.authUrl;
    } catch (error) {
      alert('Error: ' + error);
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect(accountId: string | number) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await fetch(`/api/autoblog/accounts?id=${accountId}`, { method: 'DELETE' });
      await loadAccounts();
      alert('삭제되었습니다!');
    } catch (error) {
      alert('오류가 발생했습니다.');
    }
  }

  async function handleSaveAccount() {
    setSaving(true);
    try {
      const isEditing = editingAccount !== null;
      const url = isEditing ? `/api/autoblog/accounts?id=${editingAccount.id}` : '/api/autoblog/accounts';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: selectedPlatform, ...formData })
      });
      const data = await res.json();
      if (res.ok) {
        alert(isEditing ? '수정되었습니다!' : '추가되었습니다!');
        setShowAddForm(false);
        setEditingAccount(null);
        setFormData({ name: '', siteUrl: '', username: '', applicationPassword: '', blogName: '', tistoryId: '', tistoryPassword: '', tistoryUrl: '' });
        loadAccounts();
      } else {
        alert('실패: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Error: ' + error);
    } finally {
      setSaving(false);
    }
  }

  function handleEditAccount(account: WordPressAccount | TistoryAccount) {
    setEditingAccount(account);
    setSelectedPlatform(account.platform);
    setFormData({
      name: account.name,
      siteUrl: account.platform === 'wordpress' ? (account as WordPressAccount).siteUrl : '',
      username: account.platform === 'wordpress' ? (account as WordPressAccount).username : '',
      applicationPassword: '',
      blogName: account.platform === 'tistory' ? (account as TistoryAccount).blogName : '',
      tistoryId: '',
      tistoryPassword: '',
      tistoryUrl: account.platform === 'tistory' ? (account as TistoryAccount).tistoryUrl || '' : ''
    });
    setShowAddForm(true);
  }

  function handleCancelEdit() {
    setEditingAccount(null);
    setShowAddForm(false);
    setFormData({ name: '', siteUrl: '', username: '', applicationPassword: '', blogName: '', tistoryId: '', tistoryPassword: '', tistoryUrl: '' });
  }

  const getPlatformIcon = (p: BlogPlatform) => p === 'blogger' ? '🔴' : p === 'wordpress' ? '🔵' : '🟢';
  const getPlatformName = (p: BlogPlatform) => p === 'blogger' ? 'Blogger' : p === 'wordpress' ? 'WordPress' : 'Tistory';

  const renderAccountCard = (account: BlogAccount) => {
    const isBlogger = account.platform === 'blogger';
    return (
      <div key={account.id} className="bg-slate-700/50 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-2xl">{getPlatformIcon(account.platform)}</span>
          <div>
            <p className="font-semibold">{getPlatformName(account.platform)} - {account.name}</p>
            {!isBlogger && <p className="text-sm text-gray-400">{account.platform === 'wordpress' ? (account as any).siteUrl : (account as any).blogName + '.tistory.com'}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          {!isBlogger && (
            <button
              onClick={() => handleEditAccount(account as WordPressAccount | TistoryAccount)}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-sm"
            >
              수정
            </button>
          )}
          <button onClick={() => handleDisconnect(account.id)} className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm">삭제</button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">📝 블로그 계정 관리</h1>
            <p className="text-gray-300 mt-2">Blogger, WordPress, Tistory</p>
          </div>
          <button onClick={() => router.push('/autoblog')} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg">Back</button>
        </header>

        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">🔗 계정 연결</h2>
            {!showAddForm && <button onClick={() => setShowAddForm(true)} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg">+ Add</button>}
          </div>

          <button onClick={handleConnectBlogger} disabled={connecting} className="w-full bg-red-600 hover:bg-red-700 py-4 rounded-lg mb-3">
            🔴 {connecting ? 'Connecting...' : 'Google Blogger Connect'}
          </button>

          {showAddForm && (
            <div className="border border-slate-600 rounded-lg p-4 space-y-4">
              <h3 className="font-bold text-lg">{editingAccount ? '계정 수정' : '새 계정 추가'}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedPlatform('wordpress')}
                  disabled={!!editingAccount}
                  className={'flex-1 py-2 rounded-lg disabled:opacity-50 ' + (selectedPlatform === 'wordpress' ? 'bg-blue-600 text-white' : 'bg-slate-700')}
                >🔵 WordPress</button>
                <button
                  onClick={() => setSelectedPlatform('tistory')}
                  disabled={!!editingAccount}
                  className={'flex-1 py-2 rounded-lg disabled:opacity-50 ' + (selectedPlatform === 'tistory' ? 'bg-green-600 text-white' : 'bg-slate-700')}
                >🟢 Tistory</button>
              </div>

              {selectedPlatform === 'wordpress' && (
                <div className="space-y-3">
                  <div><label className="block text-sm font-medium mb-1">계정 이름 *</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="내 블로그" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2" /></div>
                  <div><label className="block text-sm font-medium mb-1">사이트 URL *</label><input type="url" value={formData.siteUrl} onChange={e => setFormData({...formData, siteUrl: e.target.value})} placeholder="https://example.com" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2" /></div>
                  <div><label className="block text-sm font-medium mb-1">사용자명 *</label><input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} placeholder="Username" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2" /></div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      앱 비밀번호 * {editingAccount && <span className="text-gray-400">(비운 경우 변경되지 않음)</span>}
                    </label>
                    <input type="password" value={formData.applicationPassword} onChange={e => setFormData({...formData, applicationPassword: e.target.value})} placeholder={editingAccount ? "변경 시에만 입력" : "App Password"} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2" />
                  </div>
                </div>
              )}

              {selectedPlatform === 'tistory' && (
                <div className="space-y-3">
                  <div><label className="block text-sm font-medium mb-1">계정 이름 *</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="내 티스토리" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2" /></div>
                  <div><label className="block text-sm font-medium mb-1">블로그 이름 *</label><input type="text" value={formData.blogName} onChange={e => setFormData({...formData, blogName: e.target.value})} placeholder="koreafood" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2" /></div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      티스토리 ID * {editingAccount && <span className="text-gray-400">(비운 경우 변경되지 않음)</span>}
                    </label>
                    <input type="text" value={formData.tistoryId} onChange={e => setFormData({...formData, tistoryId: e.target.value})} placeholder={editingAccount ? "변경 시에만 입력" : "your@email.com"} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      비밀번호 * {editingAccount && <span className="text-gray-400">(비운 경우 변경되지 않음)</span>}
                    </label>
                    <input type="password" value={formData.tistoryPassword} onChange={e => setFormData({...formData, tistoryPassword: e.target.value})} placeholder={editingAccount ? "변경 시에만 입력" : "••••••••"} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2" />
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Tistory URL (선택)</label><input type="text" value={formData.tistoryUrl} onChange={e => setFormData({...formData, tistoryUrl: e.target.value})} placeholder="https://koreafoods.tistory.com" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2" /></div>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={handleSaveAccount} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-lg">{saving ? '저장 중...' : (editingAccount ? '수정하기' : '추가하기')}</button>
                <button onClick={handleCancelEdit} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">취소</button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700">
          <h2 className="text-2xl font-bold mb-4">✅ 연결된 계정</h2>
          {loading ? <p>로딩 중...</p> : accounts.length === 0 ? <p>연결된 계정이 없습니다.</p> : <div className="space-y-3">{accounts.map(renderAccountCard)}</div>}
        </div>
      </div>
    </div>
  );
}

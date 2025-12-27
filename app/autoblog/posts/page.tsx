'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const BlogEditor = dynamic(() => import('@/app/autoblog/components/BlogEditor'), { ssr: false });

interface GeneratedPost {
  slug: string;
  title: string;
  content: string;
  tokensUsed: number;
  imagesGenerated: number;
  totalCost: number;
  timestamp: string;
}

interface Account {
  id: string;
  platform: string;
  email?: string;
  blogName?: string;
  siteUrl?: string;
  username?: string;
}

export default function PostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<GeneratedPost | null>(null);
  const [editingPost, setEditingPost] = useState<GeneratedPost | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 발행 관련 상태
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishingPost, setPublishingPost] = useState<GeneratedPost | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState('blogger');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([]);
  const [publishLoading, setPublishLoading] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      const res = await fetch('/api/autoblog/posts');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deletePost(slug: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await fetch(`/api/autoblog/posts?slug=${slug}`, { method: 'DELETE' });
      await loadPosts();
      setSelectedPost(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }

  async function savePost() {
    if (!editingPost) return;

    try {
      const res = await fetch('/api/autoblog/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: editingPost.slug,
          title: editedTitle,
          content: editedContent
        })
      });

      if (res.ok) {
        await loadPosts();
        setEditingPost(null);
        alert('저장되었습니다.');
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('저장 실패');
    }
  }

  async function publishPost(slug: string) {
    // 발행할 게시글 찾기
    const post = posts.find(p => p.slug === slug);
    if (!post) return;

    // 연결된 계정 확인
    try {
      const accountsRes = await fetch('/api/autoblog/accounts/list');
      const accountsData = await accountsRes.json();

      if (!accountsData.accounts || accountsData.accounts.length === 0) {
        alert('연결된 블로그 계정이 없습니다.\n\n계정 관리 페이지에서 블로그 계정을 연결해주세요.');
        router.push('/autoblog/accounts');
        return;
      }

      setPublishingPost(post);
      setAvailableAccounts(accountsData.accounts);

      // 플랫폼별 계정 필터링
      const bloggerAccounts = accountsData.accounts.filter((a: Account) => a.platform === 'blogger');
      const wordpressAccounts = accountsData.accounts.filter((a: Account) => a.platform === 'wordpress');
      const tistoryAccounts = accountsData.accounts.filter((a: Account) => a.platform === 'tistory');

      // 기본 플랫폼 선택 (계정이 있는 플랫폼)
      if (bloggerAccounts.length > 0) {
        setSelectedPlatform('blogger');
        setSelectedAccountId(bloggerAccounts[0].id);
      } else if (tistoryAccounts.length > 0) {
        setSelectedPlatform('tistory');
        setSelectedAccountId(tistoryAccounts[0].id);
      } else if (wordpressAccounts.length > 0) {
        setSelectedPlatform('wordpress');
        setSelectedAccountId('');
      }

      setShowPublishModal(true);
    } catch (error) {
      console.error('Failed to load accounts:', error);
      alert('계정 정보를 불러오는데 실패했습니다.');
    }
  }

  async function executePublish() {
    if (!publishingPost) return;

    setPublishLoading(true);
    try {
      let body: any = { slug: publishingPost.slug, platform: selectedPlatform };

      // WordPress 또는 Tistory는 계정 정보 필요
      if (selectedPlatform === 'wordpress' || selectedPlatform === 'tistory') {
        body.accountId = selectedAccountId;
      }

      const res = await fetch('/api/autoblog/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert(`발행 성공!\n\n플랫폼: ${data.platform === 'blogger' ? 'Blogger' : data.platform === 'wordpress' ? 'WordPress' : 'Tistory'}\nURL: ${data.publishedUrl}`);
        window.open(data.publishedUrl, '_blank');
        setShowPublishModal(false);
        await loadPosts();
      } else {
        alert('발행 실패: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (error: any) {
      console.error('Publish failed:', error);
      alert('발행 실패: ' + (error.message || '알 수 없는 오류'));
    } finally {
      setPublishLoading(false);
    }
  }

  function quickSchedulePost(slug: string, title: string) {
    // 예약 페이지로 이동하면서 slug를 전달
    router.push(`/autoblog/schedule?slug=${encodeURIComponent(slug)}&title=${encodeURIComponent(title)}`);
  }

  const openEdit = (post: GeneratedPost) => {
    setEditingPost(post);
    setEditedTitle(post.title);
    setEditedContent(post.content);
    setSelectedPost(null);
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <p className="text-xl">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-6xl mx-auto p-8 space-y-6">
        {/* 헤더 */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              📝 생성된 글 목록
            </h1>
            <p className="text-gray-300 mt-2">
              총 {posts.length}개의 글이 있습니다
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/autoblog')}
              className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg"
            >
              ← 돌아가기
            </button>
            <button
              onClick={() => router.push('/autoblog/schedule')}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
            >
              ⏰ 예약 관리
            </button>
            <button
              onClick={() => router.push('/autoblog/jobs')}
              className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg"
            >
              ⚙️ 작업 관리
            </button>
            <button
              onClick={() => router.push('/autoblog')}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold"
            >
              + 새 글 생성
            </button>
          </div>
        </header>

        {/* 검색 */}
        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="제목으로 검색..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* 글 목록 */}
        {filteredPosts.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-12 text-center border border-slate-700">
            <p className="text-gray-400 text-lg">
              {searchQuery ? '검색 결과가 없습니다' : '생성된 글이 없습니다'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => router.push('/autoblog')}
                className="mt-4 bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg"
              >
                첫 글 생성하기
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPosts.map((post) => (
              <div
                key={post.slug}
                className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
                onClick={() => setSelectedPost(post)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold mb-2 truncate">{post.title}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <span>📅 {new Date(post.timestamp).toLocaleDateString('ko-KR')}</span>
                      <span>🔢 {post.tokensUsed.toLocaleString()} 토큰</span>
                      <span>🖼️ {post.imagesGenerated}장</span>
                      <span className="text-green-400">💰 ${post.totalCost.toFixed(4)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        publishPost(post.slug);
                      }}
                      className="p-2 hover:bg-green-700 rounded-lg"
                      title="바로 발행"
                    >
                      🚀
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        quickSchedulePost(post.slug, post.title);
                      }}
                      className="p-2 hover:bg-blue-700 rounded-lg"
                      title="예약 발행"
                    >
                      ⏰
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(post);
                      }}
                      className="p-2 hover:bg-slate-700 rounded-lg"
                      title="편집"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPost(post);
                      }}
                      className="p-2 hover:bg-slate-700 rounded-lg"
                      title="보기"
                    >
                      👁️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePost(post.slug);
                      }}
                      className="p-2 hover:bg-slate-700 rounded-lg text-red-400"
                      title="삭제"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 글 상세 보기 모달 */}
        {selectedPost && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-slate-800 rounded-xl max-w-4xl w-full my-8 border border-slate-700">
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <h2 className="text-2xl font-bold">📄 글 상세</h2>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              {/* 모달 내용 */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* 글 정보 */}
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-gray-400">생성일</p>
                    <p className="font-bold">{new Date(selectedPost.timestamp).toLocaleDateString('ko-KR')}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-gray-400">토큰</p>
                    <p className="font-bold">{selectedPost.tokensUsed.toLocaleString()}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-3">
                    <p className="text-gray-400">이미지</p>
                    <p className="font-bold">{selectedPost.imagesGenerated}장</p>
                  </div>
                  <div className="bg-green-900/50 rounded-lg p-3">
                    <p className="text-green-400">비용</p>
                    <p className="font-bold text-green-300">${selectedPost.totalCost.toFixed(4)}</p>
                  </div>
                </div>

                {/* 콘텐츠 */}
                <div>
                  <h3 className="text-lg font-bold mb-3">{selectedPost.title}</h3>
                  <div
                    className="bg-slate-900 rounded-lg p-6 border border-slate-700 prose prose-invert max-w-none text-gray-300"
                    dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                  />
                </div>
              </div>

              {/* 모달 푸터 */}
              <div className="flex justify-end gap-3 p-6 border-t border-slate-700">
                <button
                  onClick={() => setSelectedPost(null)}
                  className="bg-slate-600 hover:bg-slate-500 px-6 py-2 rounded-lg"
                >
                  닫기
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedPost.content);
                    alert('콘텐츠가 클립보드에 복사되었습니다.');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
                >
                  📋 복사
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 편집 모달 */}
        {editingPost && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-slate-800 rounded-xl max-w-5xl w-full my-8 border border-slate-700 flex flex-col max-h-[90vh]">
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <h2 className="text-2xl font-bold">✏️ 글 편집</h2>
                <button
                  onClick={() => setEditingPost(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              {/* 모달 내용 */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* 제목 편집 */}
                <div>
                  <label className="block text-sm font-semibold mb-2">제목</label>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* 에디터 */}
                <div>
                  <label className="block text-sm font-semibold mb-2">콘텐츠</label>
                  <BlogEditor
                    content={editedContent}
                    onChange={setEditedContent}
                  />
                </div>
              </div>

              {/* 모달 푸터 */}
              <div className="flex justify-end gap-3 p-6 border-t border-slate-700">
                <button
                  onClick={() => setEditingPost(null)}
                  className="bg-slate-600 hover:bg-slate-500 px-6 py-2 rounded-lg"
                >
                  취소
                </button>
                <button
                  onClick={savePost}
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-semibold"
                >
                  💾 저장
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 발행 플랫폼 선택 모달 */}
        {showPublishModal && publishingPost && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl max-w-2xl w-full border border-slate-700">
              {/* 모달 헤더 */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <h2 className="text-2xl font-bold">🚀 블로그 발행</h2>
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              {/* 모달 내용 */}
              <div className="p-6 space-y-6">
                {/* 게시글 정보 */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">발행할 글</p>
                  <p className="font-semibold">{publishingPost.title}</p>
                </div>

                {/* 플랫폼 선택 */}
                <div>
                  <label className="block text-sm font-semibold mb-3">발행 플랫폼 선택</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setSelectedPlatform('blogger')}
                      className={`p-4 rounded-lg border-2 text-center transition-colors ${
                        selectedPlatform === 'blogger'
                          ? 'bg-orange-600 border-orange-500 text-white'
                          : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'
                      }`}
                    >
                      <div className="text-2xl mb-1">📝</div>
                      <div className="text-sm font-semibold">Blogger</div>
                      <div className="text-xs text-gray-400">
                        {availableAccounts.filter(a => a.platform === 'blogger').length}개 계정
                      </div>
                    </button>

                    <button
                      onClick={() => setSelectedPlatform('wordpress')}
                      className={`p-4 rounded-lg border-2 text-center transition-colors ${
                        selectedPlatform === 'wordpress'
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'
                      }`}
                    >
                      <div className="text-2xl mb-1">🌐</div>
                      <div className="text-sm font-semibold">WordPress</div>
                      <div className="text-xs text-gray-400">
                        {availableAccounts.filter(a => a.platform === 'wordpress').length}개 계정
                      </div>
                    </button>

                    <button
                      onClick={() => setSelectedPlatform('tistory')}
                      className={`p-4 rounded-lg border-2 text-center transition-colors ${
                        selectedPlatform === 'tistory'
                          ? 'bg-green-600 border-green-500 text-white'
                          : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'
                      }`}
                    >
                      <div className="text-2xl mb-1">📰</div>
                      <div className="text-sm font-semibold">Tistory</div>
                      <div className="text-xs text-gray-400">
                        {availableAccounts.filter(a => a.platform === 'tistory').length}개 계정
                      </div>
                    </button>
                  </div>
                </div>

                {/* 계정 선택 (WordPress/Tistory인 경우) */}
                {(selectedPlatform === 'wordpress' || selectedPlatform === 'tistory') && (
                  <div>
                    <label className="block text-sm font-semibold mb-2">계정 선택</label>
                    <select
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">계정을 선택하세요</option>
                      {availableAccounts
                        .filter(a => a.platform === selectedPlatform)
                        .map(account => (
                          <option key={account.id} value={account.id}>
                            {account.platform === 'wordpress'
                              ? `${account.siteUrl} (${account.username})`
                              : `${account.blogName}`}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* 모달 푸터 */}
              <div className="flex justify-end gap-3 p-6 border-t border-slate-700">
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="bg-slate-600 hover:bg-slate-500 px-6 py-2 rounded-lg"
                >
                  취소
                </button>
                <button
                  onClick={executePublish}
                  disabled={publishLoading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
                >
                  {publishLoading ? '발행 중...' : '🚀 발행하기'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

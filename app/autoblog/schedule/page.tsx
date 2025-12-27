'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Schedule {
  id: string;
  slug: string;
  title: string;
  scheduledAt: string;
  status: 'pending' | 'published' | 'failed';
  publishedAt?: string;
  publishedUrl?: string;
  createdAt: string;
}

export default function SchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    loadSchedules();
    loadPosts();

    // URL 파라미터 확인 (글 목록에서 빠른 예약으로 온 경우)
    const slugParam = searchParams.get('slug');
    if (slugParam) {
      setSelectedSlug(slugParam);
      setShowModal(true);
    }
  }, [searchParams]);

  async function loadSchedules() {
    try {
      const res = await fetch('/api/autoblog/schedule');
      const data = await res.json();
      setSchedules(data.schedules || []);
    } catch (error) {
      console.error('Failed to load schedules:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadPosts() {
    try {
      const res = await fetch('/api/autoblog/posts');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
  }

  async function createSchedule() {
    if (!selectedSlug || !scheduledDate || !scheduledTime) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

    if (new Date(scheduledAt) <= new Date()) {
      alert('예약 시간은 현재 시간 이후여야 합니다.');
      return;
    }

    try {
      const res = await fetch('/api/autoblog/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: selectedSlug,
          scheduledAt
        })
      });

      if (res.ok) {
        await loadSchedules();
        closeModal();
        alert('예약이 생성되었습니다.');
      } else {
        const data = await res.json();
        alert('예약 실패: ' + data.error);
      }
    } catch (error) {
      console.error('Schedule creation failed:', error);
      alert('예약 실패');
    }
  }

  async function deleteSchedule(id: string) {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await fetch(`/api/autoblog/schedule?id=${id}`, { method: 'DELETE' });
      await loadSchedules();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }

  async function updateSchedule(id: string, newScheduledAt: string) {
    try {
      const res = await fetch('/api/autoblog/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, scheduledAt: newScheduledAt })
      });

      if (res.ok) {
        await loadSchedules();
        alert('예약이 수정되었습니다.');
      } else {
        const data = await res.json();
        alert('수정 실패: ' + data.error);
      }
    } catch (error) {
      console.error('Update failed:', error);
      alert('수정 실패');
    }
  }

  function closeModal() {
    setShowModal(false);
    setSelectedSlug('');
    setScheduledDate('');
    setScheduledTime('');
    // URL 파라미터 제거
    router.replace('/autoblog/schedule');
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-900/50 text-yellow-300 rounded text-sm">대기 중</span>;
      case 'published':
        return <span className="px-2 py-1 bg-green-900/50 text-green-300 rounded text-sm">발행 완료</span>;
      case 'failed':
        return <span className="px-2 py-1 bg-red-900/50 text-red-300 rounded text-sm">실패</span>;
      default:
        return <span className="px-2 py-1 bg-slate-700 text-gray-300 rounded text-sm">{status}</span>;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
              ⏰ 예약 발행 관리
            </h1>
            <p className="text-gray-300 mt-2">
              총 {schedules.length}개의 예약이 있습니다
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/autoblog/posts')}
              className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg"
            >
              ← 글 목록
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold"
            >
              + 새 예약
            </button>
          </div>
        </header>

        {/* 예약 목록 */}
        {schedules.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-12 text-center border border-slate-700">
            <p className="text-gray-400 text-lg">예약된 발행이 없습니다</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg"
            >
              첫 예약 만들기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-slate-800/50 backdrop-blur rounded-xl p-6 border border-slate-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{schedule.title}</h3>
                      {getStatusBadge(schedule.status)}
                    </div>
                    <div className="space-y-1 text-sm text-gray-400">
                      <p>📅 예약 시간: {formatDateTime(schedule.scheduledAt)}</p>
                      <p>🕐 생성 시간: {formatDateTime(schedule.createdAt)}</p>
                      {schedule.publishedAt && (
                        <p className="text-green-400">✅ 발행 시간: {formatDateTime(schedule.publishedAt)}</p>
                      )}
                      {schedule.publishedUrl && (
                        <a
                          href={schedule.publishedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          🔗 발행된 글 보기
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {schedule.status === 'pending' && (
                      <>
                        <button
                          onClick={() => {
                            const newDate = prompt(
                              '새 예약 시간을 입력하세요 (YYYY-MM-DD HH:MM):',
                              new Date(schedule.scheduledAt).toISOString().slice(0, 16).replace('T', ' ')
                            );
                            if (newDate) {
                              const scheduledAt = new Date(newDate).toISOString();
                              if (!isNaN(new Date(scheduledAt).getTime())) {
                                updateSchedule(schedule.id, scheduledAt);
                              } else {
                                alert('잘못된 날짜 형식입니다.');
                              }
                            }
                          }}
                          className="p-2 hover:bg-blue-700 rounded-lg"
                          title="시간 수정"
                        >
                          🔄
                        </button>
                        <button
                          onClick={() => deleteSchedule(schedule.id)}
                          className="p-2 hover:bg-red-700 rounded-lg text-red-400"
                          title="삭제"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                    {schedule.status === 'published' && (
                      <button
                        onClick={() => deleteSchedule(schedule.id)}
                        className="p-2 hover:bg-red-700 rounded-lg text-red-400"
                        title="기록 삭제"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 새 예약 모달 */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl max-w-md w-full border border-slate-700">
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <h2 className="text-2xl font-bold">⏰ 새 예약 만들기</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">글 선택</label>
                  <select
                    value={selectedSlug}
                    onChange={(e) => setSelectedSlug(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">글을 선택하세요</option>
                    {posts.map((post) => (
                      <option key={post.slug} value={post.slug}>
                        {post.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">날짜</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">시간</label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {selectedSlug && scheduledDate && scheduledTime && (
                  <div className="bg-slate-700/50 rounded-lg p-3 text-sm">
                    <p className="text-gray-400">예약 시간:</p>
                    <p className="font-bold">
                      {formatDateTime(`${scheduledDate}T${scheduledTime}`)}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-slate-700">
                <button
                  onClick={closeModal}
                  className="bg-slate-600 hover:bg-slate-500 px-6 py-2 rounded-lg"
                >
                  취소
                </button>
                <button
                  onClick={createSchedule}
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg font-semibold"
                >
                  예약하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 안내 메시지 */}
        <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-4 text-sm">
          <p className="font-semibold mb-2">ℹ️ 예약 발행 안내</p>
          <ul className="space-y-1 text-gray-300">
            <li>• 예약된 글은 지정된 시간에 자동으로 발행됩니다.</li>
            <li>• Vercel Cron이 매시간 실행되어 예약된 글을 확인합니다.</li>
            <li>• 발행 전에는 언제든 시간을 수정하거나 취소할 수 있습니다.</li>
            <li>• 발행된 글은 Blogger에서 직접 관리해야 합니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

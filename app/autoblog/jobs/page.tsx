'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Job {
  id: string;
  type: string;
  status: string;
  data: any;
  result?: any;
  error?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  nextRetryAt?: string;
}

interface JobLog {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
}

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [logs, setLogs] = useState<JobLog[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'running' | 'completed' | 'failed'>('all');

  useEffect(() => {
    loadJobs();
    // 5초마다 자동 새로고침
    const interval = setInterval(loadJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadJobs() {
    try {
      const res = await fetch('/api/autoblog/jobs');
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function cancelJob(id: string) {
    if (!confirm('정말 이 작업을 취소하시겠습니까?')) return;

    try {
      await fetch(`/api/autoblog/jobs?id=${id}`, { method: 'DELETE' });
      await loadJobs();
    } catch (error) {
      console.error('Cancel failed:', error);
    }
  }

  async function deleteJob(id: string) {
    if (!confirm('정말 이 작업 기록을 삭제하시겠습니까?')) return;

    try {
      await fetch(`/api/autoblog/jobs?id=${id}&action=delete`, { method: 'DELETE' });
      await loadJobs();
      setSelectedJob(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }

  async function retryJob(id: string) {
    try {
      await fetch(`/api/autoblog/jobs?id=${id}&action=retry`, { method: 'POST' });
      await loadJobs();
    } catch (error) {
      console.error('Retry failed:', error);
    }
  }

  async function viewLogs(job: Job) {
    setSelectedJob(job);
    try {
      const res = await fetch(`/api/autoblog/jobs/logs?jobId=${job.id}`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  }

  async function cleanupOldJobs() {
    if (!confirm('7일 이상 된 완료된 작업을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch('/api/autoblog/jobs/cleanup', { method: 'POST' });
      const data = await res.json();
      alert(`${data.deleted}개의 작업이 삭제되었습니다.`);
      await loadJobs();
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-900/50 text-yellow-300 rounded text-xs">대기 중</span>;
      case 'running':
        return <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-xs">실행 중</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-green-900/50 text-green-300 rounded text-xs">완료</span>;
      case 'failed':
        return <span className="px-2 py-1 bg-red-900/50 text-red-300 rounded text-xs">실패</span>;
      case 'cancelled':
        return <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs">취소됨</span>;
      default:
        return <span className="px-2 py-1 bg-slate-700 text-gray-300 rounded text-xs">{status}</span>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'generate-post':
        return '📝 글 생성';
      case 'generate-images':
        return '🖼️ 이미지 생성';
      case 'publish':
        return '🚀 발행';
      case 'schedule-publish':
        return '⏰ 예약 발행';
      default:
        return type;
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const filteredJobs = jobs.filter(job => {
    if (filter === 'all') return true;
    return job.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <p className="text-xl">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-8 space-y-6">
        {/* 헤더 */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              ⚙️ 작업 관리
            </h1>
            <p className="text-gray-300 mt-2">
              총 {jobs.length}개의 작업이 있습니다
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
              onClick={cleanupOldJobs}
              className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg"
            >
              🧹 오래된 작업 정리
            </button>
            <button
              onClick={loadJobs}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg"
            >
              🔄 새로고침
            </button>
          </div>
        </header>

        {/* 필터 */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-purple-600' : 'bg-slate-700'}`}
          >
            전체 ({jobs.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg ${filter === 'pending' ? 'bg-purple-600' : 'bg-slate-700'}`}
          >
            대기 중 ({jobs.filter(j => j.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('running')}
            className={`px-4 py-2 rounded-lg ${filter === 'running' ? 'bg-purple-600' : 'bg-slate-700'}`}
          >
            실행 중 ({jobs.filter(j => j.status === 'running').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg ${filter === 'completed' ? 'bg-purple-600' : 'bg-slate-700'}`}
          >
            완료 ({jobs.filter(j => j.status === 'completed').length})
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`px-4 py-2 rounded-lg ${filter === 'failed' ? 'bg-purple-600' : 'bg-slate-700'}`}
          >
            실패 ({jobs.filter(j => j.status === 'failed').length})
          </button>
        </div>

        {/* 작업 목록 */}
        {filteredJobs.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur rounded-xl p-12 text-center border border-slate-700">
            <p className="text-gray-400 text-lg">작업이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold">{getTypeLabel(job.type)}</span>
                      {getStatusBadge(job.status)}
                      {job.retryCount > 0 && (
                        <span className="text-xs text-yellow-400">
                          재시도 {job.retryCount}/{job.maxRetries}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-400">
                      <div>
                        <p className="text-gray-500">생성일</p>
                        <p>{formatDateTime(job.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">시작일</p>
                        <p>{formatDateTime(job.startedAt)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">완료일</p>
                        <p>{formatDateTime(job.completedAt)}</p>
                      </div>
                    </div>
                    {job.error && (
                      <div className="mt-2 text-sm text-red-400 bg-red-900/20 rounded px-3 py-2">
                        ❌ {job.error}
                      </div>
                    )}
                    {job.nextRetryAt && (
                      <div className="mt-2 text-sm text-yellow-400">
                        ⏰ 다음 재시도: {formatDateTime(job.nextRetryAt)}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewLogs(job)}
                      className="p-2 hover:bg-slate-700 rounded-lg"
                      title="로그 보기"
                    >
                      📋
                    </button>
                    {job.status === 'failed' && (
                      <button
                        onClick={() => retryJob(job.id)}
                        className="p-2 hover:bg-green-700 rounded-lg"
                        title="다시 시도"
                      >
                        🔄
                      </button>
                    )}
                    {(job.status === 'pending' || job.status === 'running') && (
                      <button
                        onClick={() => cancelJob(job.id)}
                        className="p-2 hover:bg-orange-700 rounded-lg"
                        title="취소"
                      >
                        ⏹️
                      </button>
                    )}
                    {(job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') && (
                      <button
                        onClick={() => deleteJob(job.id)}
                        className="p-2 hover:bg-red-700 rounded-lg text-red-400"
                        title="삭제"
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

        {/* 로그 모달 */}
        {selectedJob && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl max-w-3xl w-full max-h-[80vh] flex flex-col border border-slate-700">
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <h2 className="text-2xl font-bold">📋 작업 로그</h2>
                <button
                  onClick={() => {
                    setSelectedJob(null);
                    setLogs([]);
                  }}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-2">
                <div className="bg-slate-700/50 rounded-lg p-3 text-sm mb-4">
                  <p><strong>작업 ID:</strong> {selectedJob.id}</p>
                  <p><strong>타입:</strong> {getTypeLabel(selectedJob.type)}</p>
                  <p><strong>상태:</strong> {getStatusBadge(selectedJob.status)}</p>
                </div>

                {logs.length === 0 ? (
                  <p className="text-gray-400">로그가 없습니다</p>
                ) : (
                  logs.map((log, index) => (
                    <div
                      key={index}
                      className={`text-sm font-mono rounded p-3 ${
                        log.level === 'error' ? 'bg-red-900/30 text-red-300' :
                        log.level === 'warn' ? 'bg-yellow-900/30 text-yellow-300' :
                        log.level === 'info' ? 'bg-blue-900/30 text-blue-300' :
                        'bg-slate-700/50 text-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString('ko-KR')}</span>
                        <span className="uppercase font-bold">{log.level}</span>
                        <span className="flex-1">{log.message}</span>
                      </div>
                      {log.data && (
                        <pre className="mt-2 text-xs overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

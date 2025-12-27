/**
 * AlphaAutoBlog Job Handler
 *
 * 백그라운드 작업 큐 및 관리 시스템
 * - 글 생성 작업
 * - 이미지 생성 작업
 * - 발행 작업
 * - 재시도 로직
 * - API 요청 관리
 */

import fs from 'fs';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), '.autoblog-storage');
const JOBS_FILE = path.join(STORAGE_DIR, 'jobs.json');
const JOB_LOGS_FILE = path.join(STORAGE_DIR, 'job-logs.json');

function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

// 작업 상태
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

// 작업 타입
export type JobType = 'generate-post' | 'generate-images' | 'publish' | 'schedule-publish';

// 작업 인터페이스
export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
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

// 작업 로그 인터페이스
export interface JobLog {
  jobId: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
}

// 작업 핸들러 타입
type JobHandler = (job: Job) => Promise<{ success: boolean; result?: any; error?: string }>;

/**
 * 작업 관리자 클래스
 */
export class JobManager {
  private handlers: Map<JobType, JobHandler> = new Map();
  private processing: Set<string> = new Set();

  /**
   * 작업 핸들러 등록
   */
  registerHandler(type: JobType, handler: JobHandler) {
    this.handlers.set(type, handler);
  }

  /**
   * 새 작업 생성
   */
  async createJob(type: JobType, data: any, options: { maxRetries?: number } = {}): Promise<Job> {
    ensureStorageDir();

    const job: Job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      status: 'pending',
      data,
      retryCount: 0,
      maxRetries: options.maxRetries ?? 3,
      createdAt: new Date().toISOString()
    };

    let jobs: Job[] = [];
    if (fs.existsSync(JOBS_FILE)) {
      jobs = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf-8'));
    }

    jobs.push(job);
    fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));

    this.addLog(job.id, 'info', `Job created: ${type}`, { data });

    return job;
  }

  /**
   * 작업 목록 불러오기
   */
  getJobs(filter?: { status?: JobStatus; type?: JobType; limit?: number }): Job[] {
    ensureStorageDir();

    if (!fs.existsSync(JOBS_FILE)) {
      return [];
    }

    let jobs: Job[] = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf-8'));

    if (filter) {
      if (filter.status) {
        jobs = jobs.filter(j => j.status === filter.status);
      }
      if (filter.type) {
        jobs = jobs.filter(j => j.type === filter.type);
      }
      if (filter.limit) {
        jobs = jobs.slice(0, filter.limit);
      }
    }

    return jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * 특정 작업 불러오기
   */
  getJob(id: string): Job | null {
    const jobs = this.getJobs();
    return jobs.find(j => j.id === id) || null;
  }

  /**
   * 작업 상태 업데이트
   */
  updateJob(id: string, updates: Partial<Job>): void {
    ensureStorageDir();

    if (!fs.existsSync(JOBS_FILE)) {
      return;
    }

    let jobs: Job[] = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf-8'));
    const index = jobs.findIndex(j => j.id === id);

    if (index !== -1) {
      jobs[index] = { ...jobs[index], ...updates };
      fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
    }
  }

  /**
   * 작업 실행
   */
  async executeJob(job: Job): Promise<void> {
    if (this.processing.has(job.id)) {
      this.addLog(job.id, 'warn', 'Job already processing');
      return;
    }

    this.processing.add(job.id);
    this.updateJob(job.id, {
      status: 'running',
      startedAt: new Date().toISOString()
    });

    const handler = this.handlers.get(job.type);

    if (!handler) {
      const error = `No handler registered for job type: ${job.type}`;
      this.addLog(job.id, 'error', error);

      this.updateJob(job.id, {
        status: 'failed',
        error,
        completedAt: new Date().toISOString()
      });

      this.processing.delete(job.id);
      return;
    }

    try {
      this.addLog(job.id, 'info', `Executing job: ${job.type}`);

      const { success, result, error } = await handler(job);

      if (success) {
        this.addLog(job.id, 'info', 'Job completed successfully', { result });

        this.updateJob(job.id, {
          status: 'completed',
          result,
          completedAt: new Date().toISOString()
        });
      } else {
        throw new Error(error || 'Job failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';

      this.addLog(job.id, 'error', `Job failed: ${errorMessage}`);

      // 재시도 로직
      if (job.retryCount < job.maxRetries) {
        const nextRetryAt = new Date(Date.now() + this.getRetryDelay(job.retryCount));
        const nextRetryCount = job.retryCount + 1;

        this.addLog(job.id, 'info', `Scheduling retry ${nextRetryCount}/${job.maxRetries} at ${nextRetryAt.toISOString()}`);

        this.updateJob(job.id, {
          status: 'pending',
          retryCount: nextRetryCount,
          nextRetryAt: nextRetryAt.toISOString(),
          error: errorMessage
        });
      } else {
        this.addLog(job.id, 'error', `Job failed after ${job.maxRetries} retries`);

        this.updateJob(job.id, {
          status: 'failed',
          error: errorMessage,
          completedAt: new Date().toISOString()
        });
      }
    } finally {
      this.processing.delete(job.id);
    }
  }

  /**
   * 대기 중인 작업 실행
   */
  async processPendingJobs(): Promise<void> {
    const jobs = this.getJobs({ status: 'pending' });

    for (const job of jobs) {
      // 재시료 시간이 있는지 확인
      if (job.nextRetryAt) {
        const nextRetryTime = new Date(job.nextRetryAt);
        if (nextRetryTime > new Date()) {
          continue; // 아직 재시료 시간이 아님
        }
      }

      await this.executeJob(job);
    }
  }

  /**
   * 작업 취소
   */
  cancelJob(id: string): boolean {
    const job = this.getJob(id);

    if (!job || (job.status !== 'pending' && job.status !== 'running')) {
      return false;
    }

    this.updateJob(id, {
      status: 'cancelled',
      completedAt: new Date().toISOString()
    });

    this.addLog(id, 'info', 'Job cancelled');

    return true;
  }

  /**
   * 작업 삭제
   */
  deleteJob(id: string): boolean {
    ensureStorageDir();

    if (!fs.existsSync(JOBS_FILE)) {
      return false;
    }

    let jobs: Job[] = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf-8'));
    const filtered = jobs.filter(j => j.id !== id);

    if (filtered.length === jobs.length) {
      return false; // 찾지 못함
    }

    fs.writeFileSync(JOBS_FILE, JSON.stringify(filtered, null, 2));
    return true;
  }

  /**
   * 로그 추가
   */
  addLog(jobId: string, level: JobLog['level'], message: string, data?: any): void {
    ensureStorageDir();

    const log: JobLog = {
      jobId,
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };

    let logs: JobLog[] = [];
    if (fs.existsSync(JOB_LOGS_FILE)) {
      logs = JSON.parse(fs.readFileSync(JOB_LOGS_FILE, 'utf-8'));
    }

    logs.push(log);

    // 로그 파일이 너무 커지지 않도록 최근 1000개만 저장
    if (logs.length > 1000) {
      logs = logs.slice(-1000);
    }

    fs.writeFileSync(JOB_LOGS_FILE, JSON.stringify(logs, null, 2));
  }

  /**
   * 작업 로그 조회
   */
  getLogs(jobId: string): JobLog[] {
    ensureStorageDir();

    if (!fs.existsSync(JOB_LOGS_FILE)) {
      return [];
    }

    const logs: JobLog[] = JSON.parse(fs.readFileSync(JOB_LOGS_FILE, 'utf-8'));
    return logs.filter(l => l.jobId === jobId);
  }

  /**
   * 재시료 지연 시간 계산 (지수 백오프)
   */
  private getRetryDelay(retryCount: number): number {
    // 1분, 5분, 15분, 30분, 1시간...
    const delays = [60000, 300000, 900000, 1800000, 3600000];
    return delays[Math.min(retryCount, delays.length - 1)];
  }

  /**
   * 완료된 작업 정리 (오래된 작업 삭제)
   */
  cleanupOldJobs(daysToKeep: number = 7): void {
    ensureStorageDir();

    if (!fs.existsSync(JOBS_FILE)) {
      return;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let jobs: Job[] = JSON.parse(fs.readFileSync(JOBS_FILE, 'utf-8'));

    const beforeCount = jobs.length;
    jobs = jobs.filter(j => {
      if (j.status === 'completed' || j.status === 'failed' || j.status === 'cancelled') {
        const completedAt = j.completedAt ? new Date(j.completedAt) : new Date(j.createdAt);
        return completedAt > cutoffDate;
      }
      return true;
    });

    if (jobs.length !== beforeCount) {
      fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
      this.addLog('system', 'info', `Cleaned up ${beforeCount - jobs.length} old jobs`);
    }
  }
}

// 싱글톤 인스턴스
export const jobManager = new JobManager();

/**
 * API 요청 관리자 (Rate Limiting)
 */
export class APIRequestManager {
  private requestCounts: Map<string, { count: number; resetAt: number }> = new Map();
  private minInterval: number = 1000; // 최소 요청 간격 (ms)

  /**
   * API 요청 실행 (Rate Limiting 적용)
   */
  async request(
    apiName: string,
    requestFn: () => Promise<Response>,
    options: { maxRequests?: number; windowMs?: number; minInterval?: number } = {}
  ): Promise<Response> {
    const { maxRequests = 10, windowMs = 60000, minInterval } = options;

    const now = Date.now();
    const key = apiName;

    // 요청 카운트 초기화
    if (!this.requestCounts.has(key)) {
      this.requestCounts.set(key, { count: 0, resetAt: now + windowMs });
    }

    const state = this.requestCounts.get(key)!;

    // 윈도우 리셋
    if (now > state.resetAt) {
      state.count = 0;
      state.resetAt = now + windowMs;
    }

    // Rate Limit 확인
    if (state.count >= maxRequests) {
      const waitTime = state.resetAt - now;
      throw new Error(`Rate limit exceeded for ${apiName}. Wait ${Math.ceil(waitTime / 1000)}s.`);
    }

    // 최소 간격 확인
    if (minInterval || this.minInterval) {
      const interval = minInterval ?? this.minInterval;
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    // 요청 실행
    state.count++;
    this.requestCounts.set(key, state);

    return requestFn();
  }

  /**
   * 요청 카운트 리셋
   */
  reset(apiName?: string): void {
    if (apiName) {
      this.requestCounts.delete(apiName);
    } else {
      this.requestCounts.clear();
    }
  }

  /**
   * 현재 상태 조회
   */
  getStatus(apiName: string): { count: number; maxRequests: number; resetAt: Date } | null {
    const state = this.requestCounts.get(apiName);
    if (!state) return null;

    return {
      count: state.count,
      maxRequests: 10, // 기본값
      resetAt: new Date(state.resetAt)
    };
  }
}

export const apiRequestManager = new APIRequestManager();

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, CheckCircle, AlertCircle, ExternalLink, Globe } from 'lucide-react';

interface Blog {
  id: string;
  name: string;
  url: string;
  description?: string;
}

export default function AutoBlogDirectPage() {
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [selectedBlog, setSelectedBlog] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    labels: ['AI Generated'],
    isDraft: false
  });

  // 인증 상태 확인
  useEffect(() => {
    const tokens = localStorage.getItem('blogger_tokens');
    setIsAuthenticated(!!tokens);
  }, []);

  // Google OAuth 인증
  const handleAuth = async () => {
    setAuthLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/autoblog/auth');
      const data = await response.json();

      if (data.success) {
        // 팝업으로 Google OAuth 열기
        const popup = window.open(data.authUrl, 'google-auth', 'width=500,height=600');

        // 팝업에서 응답 받기
        const checkPopup = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkPopup);
            setAuthLoading(false);
            return;
          }

          try {
            const popupUrl = popup.location.href;
            if (popupUrl.includes('localhost:3000/api/autoblog/auth') || popupUrl.includes('code=')) {
              const urlParams = new URLSearchParams(popupUrl.split('?')[1]);
              const code = urlParams.get('code');

              if (code) {
                popup.close();
                clearInterval(checkPopup);
                handleAuthCallback(code);
              }
            }
          } catch (e) {
            // 크로스 도메인 오류는 무시
          }
        }, 1000);
      } else {
        setError(data.error || 'Failed to generate auth URL');
        setAuthLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setAuthLoading(false);
    }
  };

  // OAuth 콜백 처리
  const handleAuthCallback = async (code: string) => {
    try {
      const response = await fetch('/api/autoblog/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('blogger_tokens', JSON.stringify(data.tokens));
        setBlogs(data.blogs);
        if (data.blogs.length > 0) {
          setSelectedBlog(data.blogs[0].id);
        }
        setIsAuthenticated(true);
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication callback failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // 블로그 포스트 생성
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/autoblog/blogger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          blogId: selectedBlog,
          postData: {
            title: formData.title,
            content: formData.content,
            labels: formData.labels,
            isDraft: formData.isDraft
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        // 폼 초기화
        setFormData({
          title: '',
          content: '',
          labels: ['AI Generated'],
          isDraft: false
        });
      } else {
        setError(data.error || 'Failed to create blog post');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃
  const handleLogout = () => {
    localStorage.removeItem('blogger_tokens');
    setIsAuthenticated(false);
    setBlogs([]);
    setSelectedBlog('');
    setResult(null);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AutoBlog Direct Integration</h1>
        <p className="text-gray-600">
          Google Blogger에 직접 연결하여 블로그 포스팅을 자동화합니다.
        </p>
      </div>

      {/* 인증 상태 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Google Blogger 인증
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isAuthenticated ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span>Google Blogger에 연결됨</span>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  블로그 선택
                </label>
                <Select value={selectedBlog} onValueChange={setSelectedBlog}>
                  <SelectTrigger>
                    <SelectValue placeholder="블로그를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {blogs.map((blog) => (
                      <SelectItem key={blog.id} value={blog.id}>
                        {blog.name} ({blog.url})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                로그아웃
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-600">
                <AlertCircle className="w-5 h-5" />
                <span>Google Blogger 인증이 필요합니다</span>
              </div>
              <Button
                onClick={handleAuth}
                disabled={authLoading}
                className="w-full"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    인증 중...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Google Blogger 연동
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 포스팅 폼 */}
      {isAuthenticated && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                새 블로그 포스트
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    제목 *
                  </label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="블로그 포스트 제목"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    내용 *
                  </label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="블로그 내용 (HTML 또는 마크다운 지원)"
                    rows={10}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    라벨 (쉼표로 구분)
                  </label>
                  <Input
                    type="text"
                    value={formData.labels.join(', ')}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      labels: e.target.value.split(',').map(label => label.trim()).filter(Boolean)
                    }))}
                    placeholder="AI Generated, Technology, Tutorial"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="draft"
                    checked={formData.isDraft}
                    onChange={(e) => setFormData(prev => ({ ...prev, isDraft: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="draft" className="text-sm text-gray-700">
                    임시저장으로 발행
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !selectedBlog || !formData.title || !formData.content}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      발행 중...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      블로그에 발행
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 결과 표시 */}
          <div className="space-y-4">
            {result && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    발행 성공
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">제목:</span> {result.post.title}
                    </div>
                    <div>
                      <span className="font-medium">URL:</span>
                      <a
                        href={result.post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline ml-2"
                      >
                        {result.post.url}
                      </a>
                    </div>
                    <div>
                      <span className="font-medium">상태:</span> {result.post.status === 'LIVE' ? '발행됨' : '임시저장'}
                    </div>
                    <div>
                      <span className="font-medium">라벨:</span> {result.post.labels?.join(', ')}
                    </div>
                    <div>
                      <span className="font-medium">생성 시간:</span> {new Date(result.post.published).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle>사용법 안내</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2 text-gray-600">
                  <p>1. <strong>Google Blogger 연동</strong>: OAuth 2.0으로 안전하게 인증</p>
                  <p>2. <strong>블로그 선택</strong>: 관리하는 블로그 선택</p>
                  <p>3. <strong>콘텐츠 작성</strong>: 제목, 내용, 라벨 입력</p>
                  <p>4. <strong>발행 옵션</strong>: 즉시 발행 또는 임시저장</p>
                  <p>5. <strong>결과 확인</strong>: 발행된 포스트 URL 즉시 확인</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
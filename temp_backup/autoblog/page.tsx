'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, CheckCircle, AlertCircle, Globe } from 'lucide-react';

export default function AutoBlogPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    action: 'blogger',
    keyword: '',
    content: '',
    template: 'default',
    limit: 10
  });

  // API 호출 함수
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/railway-bridge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || '요청 처리 중 오류가 발생했습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 폼 데이터 변경 핸들러
  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 액션별 설명
  const actionDescriptions = {
    blogger: 'Google Blogger에 블로그 포스팅을 생성합니다.',
    tistory: '티스토리에 블로그 포스팅을 자동으로 작성합니다.',
    keywords: '네이버 키워드 API를 사용하여 연관 키워드를 분석합니다.',
    content: 'OpenAI GPT를 사용하여 블로그 콘텐츠를 생성합니다.',
    searchconsole: '생성된 포스팅 URL을 Google Search Console에 등록합니다.',
    coupang: '쿠팡 파트너스에서 상품 정보를 검색합니다.'
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AutoBlog 연동</h1>
        <p className="text-gray-600">
          Railway에 배포된 AutoBlog API를 통해 다양한 블로그 자동화 기능을 사용할 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 요청 폼 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              AutoBlog 요청
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 액션 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  기능 선택
                </label>
                <Select
                  value={formData.action}
                  onValueChange={(value) => handleInputChange('action', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="수행할 기능을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blogger">Google Blogger 포스팅</SelectItem>
                    <SelectItem value="tistory">티스토리 포스팅</SelectItem>
                    <SelectItem value="keywords">키워드 분석</SelectItem>
                    <SelectItem value="content">콘텐츠 생성</SelectItem>
                    <SelectItem value="searchconsole">Search Console 등록</SelectItem>
                    <SelectItem value="coupang">쿠팡 상품 검색</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {actionDescriptions[formData.action as keyof typeof actionDescriptions]}
                </p>
              </div>

              {/* 키워드 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  키워드 *
                </label>
                <Input
                  type="text"
                  value={formData.keyword}
                  onChange={(e) => handleInputChange('keyword', e.target.value)}
                  placeholder="예: 맛집 추천, 점심 메뉴, 외식업 트렌드"
                  required
                />
              </div>

              {/* 콘텐츠 입력 (포스팅 관련 기능) */}
              {(formData.action === 'blogger' || formData.action === 'tistory') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    포스팅 내용
                  </label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="블로그 포스팅 내용을 입력하세요..."
                    rows={4}
                  />
                </div>
              )}

              {/* 템플릿 선택 (콘텐츠 생성) */}
              {formData.action === 'content' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    템플릿
                  </label>
                  <Select
                    value={formData.template}
                    onValueChange={(value) => handleInputChange('template', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">기본 템플릿</SelectItem>
                      <SelectItem value="product">제품 리뷰</SelectItem>
                      <SelectItem value="guide">사용 가이드</SelectItem>
                      <SelectItem value="list">목록 형식</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 제한 수량 입력 (쿠팡 검색) */}
              {formData.action === 'coupang' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    검색 결과 수
                  </label>
                  <Input
                    type="number"
                    value={formData.limit}
                    onChange={(e) => handleInputChange('limit', parseInt(e.target.value) || 10)}
                    min="1"
                    max="50"
                  />
                </div>
              )}

              {/* URL 입력 (Search Console) */}
              {formData.action === 'searchconsole' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL
                  </label>
                  <Input
                    type="url"
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="https://example.com/blog/post"
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !formData.keyword}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    요청 전송
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 결과 표시 */}
        <div className="space-y-4">
          {/* API 상태 확인 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                API 상태
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Railway AutoBlog API 연결됨</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                API URL: {process.env.NEXT_PUBLIC_RAILWAY_API_URL || 'https://autoblog-python-production.up.railway.app'}
              </p>
            </CardContent>
          </Card>

          {/* 결과 표시 */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  요청 성공
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">액션:</span> {result.action}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">시간:</span> {new Date(result.timestamp).toLocaleString()}
                  </div>
                  <details className="mt-2">
                    <summary className="text-sm font-medium cursor-pointer">상세 결과</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 에러 표시 */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* 사용법 안내 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>사용법 안내</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">기능 설명</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• <strong>Blogger:</strong> Google 블로그에 자동 포스팅</li>
                <li>• <strong>Tistory:</strong> 티스토리 블로그 자동 작성</li>
                <li>• <strong>키워드:</strong> 네이버 연관 키워드 분석</li>
                <li>• <strong>콘텐츠:</strong> AI 기반 블로그 글 생성</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">주의사항</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• 각 기능은 별도의 API 인증이 필요합니다</li>
                <li>• Railway 환경 변수 설정이 필요합니다</li>
                <li>• 요청당 약 10-30초 소요될 수 있습니다</li>
                <li>• 동시 요청 수에 제한이 있을 수 있습니다</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
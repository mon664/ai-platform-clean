import { NextRequest, NextResponse } from 'next/server';

// Railway AutoBlog API URL (환경 변수에서 가져오기)
const RAILWAY_API_URL = process.env.RAILWAY_API_URL || '';

// Railway 배포되지 않은 경우 Mock 모드 활성화
const USE_MOCK_MODE = !RAILWAY_API_URL || RAILWAY_API_URL.includes('autoblog-python-production.up.railway.app');

// API 엔드포인트 매핑
const endpoints = {
  blogger: '/api/blogger/post',
  tistory: '/api/tistory/post',
  keywords: '/api/keywords/analyze',
  content: '/api/content/generate',
  searchconsole: '/api/searchconsole/submit',
  coupang: '/api/coupang/search',
  health: '/health'
} as const;

type EndpointKey = keyof typeof endpoints;

// Mock 응답 생성 함수
function createMockResponse(action: EndpointKey, data: any) {
  const mockResponses = {
    blogger: {
      success: true,
      message: 'Mock: Blogger 포스팅 성공',
      url: 'https://mock-blogger-url.com',
      title: data?.title || 'Mock Blog Title',
      id: `mock_${Date.now()}`
    },
    tistory: {
      success: true,
      message: 'Mock: Tistory 포스팅 성공',
      url: 'https://mock-tistory-url.com',
      title: data?.title || 'Mock Tistory Title',
      id: `mock_${Date.now()}`
    },
    keywords: {
      success: true,
      message: 'Mock: 키워드 분석 완료',
      keywords: ['키워드1', '키워드2', '키워드3'],
      competition: 'medium',
      volume: 'high'
    },
    content: {
      success: true,
      message: 'Mock: 콘텐츠 생성 완료',
      content: `Mock 생성된 콘텐츠: ${data?.keyword || '주제'}`,
      word_count: 500,
      readability_score: 85
    },
    searchconsole: {
      success: true,
      message: 'Mock: Search Console 제출 완료',
      submitted_urls: data?.url ? [data.url] : []
    },
    coupang: {
      success: true,
      message: 'Mock: 쿠팡 검색 완료',
      products: [
        { title: 'Mock 상품 1', price: '10,000원', rating: 4.5 },
        { title: 'Mock 상품 2', price: '20,000원', rating: 4.2 }
      ]
    },
    health: {
      status: 'ok',
      message: 'Mock Mode: Railway API 연동 준비됨',
      mock_mode: true
    }
  };

  return mockResponses[action] || {
    success: true,
    message: `Mock 응답: ${action} 처리됨`,
    mock_mode: true
  };
}

// API 요청 핸들러
export async function POST(request: NextRequest) {
  try {
    const { action, keyword, content, url, limit, template } = await request.json();

    // 액션 파라미터 검증
    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action parameter is required' },
        { status: 400 }
      );
    }

    // 엔드포인트 확인
    const endpoint = endpoints[action as EndpointKey];
    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: `Unknown action: ${action}` },
        { status: 400 }
      );
    }

    // Mock 모드인 경우 즉시 Mock 응답 반환
    if (USE_MOCK_MODE) {
      const mockData = createMockResponse(action, { keyword, content, url, limit, template });
      return NextResponse.json({
        ...mockData,
        timestamp: new Date().toISOString(),
        mock_mode: true,
        message: mockData.message + ' (Mock 모드 - Railway API 연동 필요 시 RAILWAY_API_URL 설정)'
      });
    }

    // Railway API 요청 본문 구성
    const requestBody: Record<string, any> = {};

    if (keyword) requestBody.keyword = keyword;
    if (content) requestBody.content = content;
    if (url) requestBody.url = url;
    if (limit) requestBody.limit = limit;
    if (template) requestBody.template = template;

    // Railway API 호출
    const response = await fetch(`${RAILWAY_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AI-Platform-Clean/1.0'
      },
      body: JSON.stringify(requestBody),
      // 타임아웃 설정 (30초)
      signal: AbortSignal.timeout(30000)
    });

    // 응답 처리
    const data = await response.json();

    if (!response.ok) {
      console.error(`Railway API Error (${response.status}):`, data);
      return NextResponse.json(
        {
          success: false,
          error: data.error || `Railway API returned ${response.status}`,
          status: response.status
        },
        { status: response.status }
      );
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      data: data,
      action: action,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Railway Bridge Error:', error);

    if (error instanceof Error) {
      // 타임아웃 에러 특별 처리
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { success: false, error: 'Request timeout (30s)' },
          { status: 408 }
        );
      }

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

// GET 요청: API 정보 및 헬스체크
export async function GET() {
  try {
    // Railway API 헬스체크
    const healthResponse = await fetch(`${RAILWAY_API_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    });

    const healthData = await healthResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Railway Bridge API is working',
      railway_api_url: RAILWAY_API_URL,
      railway_health: healthData,
      available_actions: Object.keys(endpoints),
      endpoints: endpoints,
      usage_examples: {
        blogger_post: {
          action: 'blogger',
          keyword: '점심 메뉴 전략',
          content: '블로그 포스팅 내용...'
        },
        tistory_post: {
          action: 'tistory',
          keyword: '외식업 트렌드',
          content: '티스토리 포스팅 내용...'
        },
        keyword_analysis: {
          action: 'keywords',
          keyword: '맛집'
        },
        content_generation: {
          action: 'content',
          keyword: '음료 추천',
          template: 'default'
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to connect to Railway API',
        railway_api_url: RAILWAY_API_URL
      },
      { status: 503 }
    );
  }
}

// CORS 설정 (필요한 경우)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
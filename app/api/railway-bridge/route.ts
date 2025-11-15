import { NextRequest, NextResponse } from 'next/server';

// Railway AutoBlog API URL (환경 변수에서 가져오기)
const RAILWAY_API_URL = process.env.RAILWAY_API_URL || 'https://autoblog-python-production.up.railway.app';

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
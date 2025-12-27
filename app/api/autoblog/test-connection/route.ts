import { NextRequest, NextResponse } from 'next/server';

/**
 * POST: API 연결 테스트
 */
export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey } = await request.json();

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Provider and API key are required' },
        { status: 400 }
      );
    }

    console.log('[Test Connection] Testing provider:', provider);

    switch (provider) {
      case 'openai': {
        const testUrl = 'https://api.openai.com/v1/models';
        const response = await fetch(testUrl, {
          headers: { 'Authorization': 'Bearer ' + apiKey }
        });

        const contentType = response.headers.get('content-type') || '';
        
        if (response.ok) {
          return NextResponse.json({ success: true, provider });
        }

        let errorMsg = 'Connection failed';
        try {
          if (contentType.includes('application/json')) {
            const data = await response.json();
            errorMsg = data.error?.message || errorMsg;
          } else {
            errorMsg = await response.text();
          }
        } catch (e) {
          errorMsg = 'HTTP ' + response.status;
        }

        return NextResponse.json({ error: errorMsg }, { status: response.status });
      }

      case 'anthropic': {
        const testUrl = 'https://api.anthropic.com/v1/messages';
        const response = await fetch(testUrl, {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'hi' }]
          })
        });

        const contentType = response.headers.get('content-type') || '';
        
        if (response.ok) {
          return NextResponse.json({ success: true, provider });
        }

        let errorMsg = 'Connection failed';
        try {
          if (contentType.includes('application/json')) {
            const data = await response.json();
            errorMsg = data.error?.message || data.message || errorMsg;
          } else {
            errorMsg = await response.text();
          }
        } catch (e) {
          errorMsg = 'HTTP ' + response.status;
        }

        return NextResponse.json({ error: errorMsg }, { status: response.status });
      }

      case 'gemini': {
        const testUrl = 'https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey;
        const response = await fetch(testUrl);

        if (response.ok) {
          return NextResponse.json({ success: true, provider });
        }

        let errorMsg = 'Connection failed';
        try {
          const data = await response.json();
          errorMsg = data.error?.message || errorMsg;
        } catch (e) {
          errorMsg = 'HTTP ' + response.status;
        }

        return NextResponse.json({ error: errorMsg }, { status: response.status });
      }

      case 'stabilityai': {
        const testUrl = 'https://api.stability.ai/v1/user/account';
        const response = await fetch(testUrl, {
          headers: { 'Authorization': 'Bearer ' + apiKey }
        });

        if (response.ok) {
          return NextResponse.json({ success: true, provider });
        }

        let errorMsg = 'Connection failed';
        try {
          const data = await response.json();
          errorMsg = data.error?.message || errorMsg;
        } catch (e) {
          errorMsg = 'HTTP ' + response.status;
        }

        return NextResponse.json({ error: errorMsg }, { status: response.status });
      }

      default:
        return NextResponse.json(
          { error: 'Unknown provider: ' + provider },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('[Test Connection] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Connection test failed' },
      { status: 500 }
    );
  }
}

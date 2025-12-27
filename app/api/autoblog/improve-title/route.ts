import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/autoblog/ai-client';

/**
 * POST: AI로 제목 개선
 */
export async function POST(request: NextRequest) {
  try {
    const { title } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const prompt = `다음 블로그 제목을 더 흥미롭고 클릭을 유도하는 방향으로 5가지로 개선해주세요.
원본 제목: "${title}"

요구사항:
- 검색 SEO에 최적화
- 호기심을 자극
- 구체적인 숫자나 결과 포함
- 20자 이내 (공백 제외)

JSON 배열 형식으로만 응답하세요:
["제목1", "제목2", "제목3", "제목4", "제목5"]`;

    const result = await generateText('gemini-2.0-flash-exp', prompt, 500);

    // JSON 파싱
    let titles: string[] = [];
    const text = result.text.trim();

    try {
      // ```json ``` 블록 제거
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      titles = JSON.parse(cleanText);
    } catch {
      // JSON 파싱 실패시 텍스트에서 줄별로 추출
      const lines = text.split('\n').filter(line => {
        const trimmed = line.trim();
        return trimmed &&
          !trimmed.startsWith('```') &&
          !trimmed.startsWith('"') && !trimmed.endsWith(']') &&
          !trimmed.startsWith('{') &&
          trimmed.length > 5;
      });
      titles = lines.map(line => line.replace(/^\d+[\.\)]\s*/, '').replace(/^["']|["']$/g, '').trim());
    }

    if (!Array.isArray(titles) || titles.length === 0) {
      titles = [
        `${title} - 지금 바로 확인하세요`,
        `${title} - 이렇게 changed!`,
        `${title} - 성공한 사람들의 비법`,
        `${title} - 알고 계셨나요?`,
        `${title} - 3가지 핵심 팁`
      ];
    }

    return NextResponse.json({ titles: titles.slice(0, 5) });
  } catch (error: any) {
    console.error('[Improve Title] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to improve title' },
      { status: 500 }
    );
  }
}

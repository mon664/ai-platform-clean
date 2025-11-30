import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
    try {
        const { topic, apiKey } = await request.json();

        if (!topic || typeof topic !== 'string') {
            return NextResponse.json(
                { success: false, error: '주제를 입력해주세요' },
                { status: 400 }
            );
        }

        if (!apiKey || typeof apiKey !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Gemini API 키가 필요합니다. Settings 페이지에서 API 키를 설정해주세요.' },
                { status: 400 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

        const prompt = `다음 블로그 주제를 더 흥미롭고 구체적이며 SEO에 최적화된 주제로 개선해주세요. 
원래 주제의 핵심 의미는 유지하되, 더 매력적이고 클릭하고 싶게 만들어주세요.
개선된 주제만 출력하고, 다른 설명은 하지 마세요.

원래 주제: ${topic}

개선된 주제:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const improvedTopic = response.text().trim();

        return NextResponse.json({
            success: true,
            improvedTopic: improvedTopic,
        });
    } catch (error) {
        console.error('주제 개선 오류:', error);
        const errorMessage = error instanceof Error ? error.message : '주제 개선 중 오류가 발생했습니다';
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}

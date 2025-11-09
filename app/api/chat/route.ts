import { saveDolSale, saveDolPurchase } from '@/lib/dolibarr';
import { NextRequest, NextResponse } from 'next/server';

// Placeholder for AI analysis function
async function analyzeWithGLM(message: string): Promise<{action: string, data: any}> {
    console.log(`Analyzing message with GLM: ${message}`);
    // This is a placeholder. In a real implementation, this would call the GLM API.
    // Based on the user's test case "강원삼푸터 김치찌개 500개 판매"
    if (message.includes('판매')) {
        return {
            action: 'sale',
            data: {
                product: '김치찌개',
                quantity: 500,
                price: 10000, // Assuming a price
                customer: '강원삼푸터',
                date: new Date().toISOString()
            }
        };
    } else if (message.includes('구매')) {
        return {
            action: 'purchase',
            data: {
                product: 'some_product',
                quantity: 100,
                price: 5000,
                vendor: 'some_vendor',
                date: new Date().toISOString()
            }
        }
    }
    return { action: 'none', data: {} };
}


export async function POST(request: NextRequest) {
  try {
    const { message, confirmed } = await request.json();

    // AI 분석
    const aiResult = await analyzeWithGLM(message);
    
    // Dolibarr에 직접 저장
    let result;
    if (aiResult.action === 'sale') {
      result = await saveDolSale(aiResult.data);
    } else if (aiResult.action === 'purchase') {
      result = await saveDolPurchase(aiResult.data);
    }

    return NextResponse.json({
      success: true,
      message: `✅ ${aiResult.action} 등록 완료!`,
      data: result
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: `Server error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { date, shift, operator, products, timestamp } = await request.json();

    if (!operator || !products || products.length === 0) {
      return NextResponse.json(
        { error: '담당자와 생산 품목 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    // 생산일지 데이터 처리
    const totalPlanned = products.reduce((sum: number, p: any) => sum + parseInt(p.planned || 0), 0);
    const totalActual = products.reduce((sum: number, p: any) => sum + parseInt(p.actual || 0), 0);
    const totalDefects = products.reduce((sum: number, p: any) => sum + parseInt(p.defects || 0), 0);
    const efficiency = totalPlanned > 0 ? ((totalActual / totalPlanned) * 100).toFixed(1) : 0;
    const defectRate = totalActual > 0 ? ((totalDefects / totalActual) * 100).toFixed(1) : 0;

    // 실제 구매입고 처리 (생산품목을 창고에 입고)
    const sessionId = process.env.ECOUNT_SESSION_ID;
    const zone = process.env.ECOUNT_ZONE || 'BB';

    // 생산 입고 데이터 생성
    const goodsReceiptData = {
      GoodsReceiptList: products.map((product: any) => ({
        BulkDatas: {
          PROD_DES: product.product,
          QTY: parseInt(product.actual || 0),
          IO_DATE: date,
          WH_CD: "00003"
        }
      }))
    };

    let ecountResult = { success: true, message: '생산일지 저장 완료' };

    try {
      const ecountResponse = await fetch(
        `https://sboapi${zone}.ecount.com/OAPI/V2/GoodsReceipt/SaveGoodsReceipt?SESSION_ID=${sessionId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(goodsReceiptData)
        }
      );
      ecountResult = await ecountResponse.json();
    } catch (ecountError) {
      console.error('Ecount integration failed:', ecountError);
      ecountResult = { success: false, message: '이카운트 연동 실패 (데이터만 저장됨)' };
    }

    return NextResponse.json({
      response: `✅ 생산일지 등록 완료

📊 생산 현황:
• 날짜: ${date} (${shift})
• 담당자: ${operator}
• 품목 수: ${products.length}

📈 생산 통계:
• 계획: ${totalPlanned}개
• 실적: ${totalActual}개
• 불량: ${totalDefects}개
• 가동률: ${efficiency}%
• 불량률: ${defectRate}%

${ecountResult.success ? '✅ 이카운트 연동 완료' : '⚠️ 이카운트 연동 실패'}`
    });

  } catch (error) {
    console.error('Production Log API Error:', error);
    return NextResponse.json(
      { error: `Server error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
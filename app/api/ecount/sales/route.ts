import { NextRequest, NextResponse } from 'next/server';

// 판매 등록 API 엔드포인트
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product, productCode, quantity, price, customer, date, warehouse } = body;

    console.log('📥 판매 요청 수신:', { product, productCode, quantity, price, customer });

    // 입력값 검증
    if (!product || !quantity || !price) {
      return NextResponse.json({
        success: false,
        error: '필수 필드 누락: 품목명, 수량, 단가'
      }, { status: 400 });
    }

    if (!customer) {
      return NextResponse.json({
        success: false,
        error: '거래처가 없습니다'
      }, { status: 400 });
    }

    // 수량과 가격을 숫자로 변환
    const qty = typeof quantity === 'string' ? parseInt(quantity) : quantity;
    const unitPrice = typeof price === 'string' ? parseInt(price) : price;

    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({
        success: false,
        error: '수량은 0보다 큰 숫자여야 합니다'
      }, { status: 400 });
    }

    if (isNaN(unitPrice) || unitPrice <= 0) {
      return NextResponse.json({
        success: false,
        error: '단가는 0보다 큰 숫자여야 합니다'
      }, { status: 400 });
    }

    // 이카운트 API 정확한 형식 (SaveSales)
    const salesData = {
      SaleList: [{
        BulkDatas: {
          SO_DATE: date ? date.replace(/-/g, '') : new Date().toISOString().slice(0, 10).replace(/-/g, ''),
          CUST_DES: customer.trim(),
          WH_CD: warehouse || "00003",
          SaleDetail: [
            {
              PROD_CD: productCode && productCode.trim() !== '' ? productCode.trim() : "",
              PROD_DES: product.trim(),
              QTY: qty,
              PRICE: unitPrice
            }
          ]
        }
      }]
    };

    console.log('📤 이카운트 API 전송 데이터:', JSON.stringify(salesData, null, 2));

    // 이카운트 API에 전송
    const sessionId = process.env.ECOUNT_SESSION_ID;
    const zone = process.env.ECOUNT_ZONE || 'BB';

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: '이카운트 세션 ID가 설정되지 않았습니다'
      }, { status: 500 });
    }

    const ecountUrl = `https://sboapi${zone}.ecount.com/OAPI/V2/Sale/SaveSale?SESSION_ID=${sessionId}`;

    console.log('🔗 이카운트 API URL:', ecountUrl);

    const ecountResponse = await fetch(ecountUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(salesData)
    });

    const ecountResult = await ecountResponse.json();

    console.log('📩 이카운트 API 응답:', JSON.stringify(ecountResult, null, 2));

    if (!ecountResponse.ok || ecountResult.FailCnt > 0) {
      console.error('❌ 이카운트 API 오류:', ecountResult);
      
      // 오류 상세 정보 추출
      let errorMsg = '이카운트 API 오류';
      if (ecountResult.ResultDetails && ecountResult.ResultDetails[0]) {
        const details = ecountResult.ResultDetails[0];
        errorMsg = details.TotalError || errorMsg;
        if (details.Errors && Array.isArray(details.Errors)) {
          errorMsg += '\n' + details.Errors.map((e: any) => `• ${e.ColCd}: ${e.Message}`).join('\n');
        }
      }

      return NextResponse.json({
        success: false,
        error: errorMsg,
        details: ecountResult
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `✅ 판매 등록 완료!\n품목: ${product}\n수량: ${qty}개\n거래처: ${customer}`,
      data: ecountResult
    });

  } catch (error) {
    console.error('❌ 판매 등록 오류:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류',
      details: (error as Error).message
    }, { status: 500 });
  }
}

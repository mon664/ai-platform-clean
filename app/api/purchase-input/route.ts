import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { vendor, items, date } = await request.json();

    if (!vendor || !items || items.length === 0) {
      return NextResponse.json(
        { error: '공급업체와 품목 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    // 이카운트 API 호출
    const sessionId = process.env.ECOUNT_SESSION_ID;
    const zone = process.env.ECOUNT_ZONE || 'BB';

    const purchasesData = {
      PurchasesList: [{
        BulkDatas: {
          CUST_DES: vendor,
          IO_DATE: date,
          UPLOAD_SER_NO: "1",
          WH_CD: "00003",
          PurchasesDetails: items.map(item => ({
            PROD_DES: item.product,
            QTY: parseInt(item.qty),
            PRICE: parseFloat(item.price)
          }))
        }
      }]
    };

    const ecountResponse = await fetch(
      `https://sboapi${zone}.ecount.com/OAPI/V2/Purchases/SavePurchases?SESSION_ID=${sessionId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchasesData)
      }
    );

    const ecountResult = await ecountResponse.json();

    return NextResponse.json({
      response: `✅ 구매입력 완료\n공급업체: ${vendor}\n품목 수: ${items.length}\n${JSON.stringify(ecountResult, null, 2)}`
    });

  } catch (error) {
    console.error('Purchase Input API Error:', error);
    return NextResponse.json(
      { error: `Server error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
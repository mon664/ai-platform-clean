import { NextRequest, NextResponse } from "next/server";
import { EcountClient } from "@/lib/ecount/client";

export async function POST(req: NextRequest) {
  try {
    const { purchaseJSON } = await req.json();

    if (!purchaseJSON) {
      return NextResponse.json(
        { error: "purchaseJSON이 없습니다." },
        { status: 400 }
      );
    }

    // STEP 3: 이카운트 ERP API에 전송
    const config = {
      comCode: process.env.ECOUNT_COM_CODE!,
      userId: process.env.ECOUNT_USER_ID!,
      apiCertKey: process.env.ECOUNT_API_CERT_KEY!,
      zone: process.env.ECOUNT_ZONE!,
      sessionId: process.env.ECOUNT_SESSION_ID!,
      domain: process.env.ECOUNT_DOMAIN!,
    };

    const client = new EcountClient(config);
    const result = await client.savePurchase(purchaseJSON);

    return NextResponse.json({
      success: true,
      step: 3,
      message: "✅ 이카운트에 구매 전표가 등록되었습니다.",
      result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
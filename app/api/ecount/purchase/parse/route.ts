import { NextRequest, NextResponse } from "next/server";
import { GLM46Parser } from "@/lib/ecount/glm";

export async function POST(req: NextRequest) {
  try {
    const { rawData } = await req.json();

    if (!rawData) {
      return NextResponse.json(
        { error: "rawData가 없습니다." },
        { status: 400 }
      );
    }

    // STEP 2: GLM 4.6으로 정확한 JSON으로 변환
    const glm = new GLM46Parser(process.env.GLM_API_KEY!);
    const purchaseJSON = await glm.parsePurchaseData(rawData);

    // STEP 2 결과 반환 (STEP 3 ERP API 호출 전)
    return NextResponse.json({
      success: true,
      step: 2,
      purchaseJSON, // 이카운트 SavePurchases API 정확한 JSON
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
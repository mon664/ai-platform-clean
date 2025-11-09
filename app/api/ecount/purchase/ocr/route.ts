import { NextRequest, NextResponse } from "next/server";
import { VisionAI } from "@/lib/ecount/vision";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "파일이 없습니다." },
        { status: 400 }
      );
    }

    // 파일을 Base64로 변환
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    // STEP 1: Vision AI로 거래명세서 분석
    const vision = new VisionAI();
    const rawData = await vision.extractPurchaseData(base64);

    // STEP 1 결과 반환 (STEP 2로 전달)
    return NextResponse.json({
      success: true,
      step: 1,
      rawData, // Vision AI에서 추출한 원본 데이터
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
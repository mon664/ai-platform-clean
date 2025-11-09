import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { productName, materials, laborCost, overheadCost, totalCost, date } = await request.json();

    if (!productName || !materials || materials.length === 0) {
      return NextResponse.json(
        { error: '제품명과 자재 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    // BOM 분석
    const materialCost = materials.reduce((sum: number, mat: any) => {
      return sum + (parseFloat(mat.quantity) || 0) * (parseFloat(mat.unitCost) || 0);
    }, 0);

    const costBreakdown = {
      materials: materialCost,
      labor: parseFloat(laborCost) || 0,
      overhead: parseFloat(overheadCost) || 0,
      total: parseFloat(totalCost) || 0
    };

    // 원가 비율 계산
    const percentages = {
      materials: ((materialCost / costBreakdown.total) * 100).toFixed(1),
      labor: ((costBreakdown.labor / costBreakdown.total) * 100).toFixed(1),
      overhead: ((costBreakdown.overhead / costBreakdown.total) * 100).toFixed(1)
    };

    // BOM 상세 정보 생성
    const bomDetails = materials.map((mat: any) => ({
      자재명: mat.material,
      단위: mat.unit,
      소요량: mat.quantity,
      단가: `₩${parseFloat(mat.unitCost || 0).toLocaleString()}`,
      금액: `₩${((parseFloat(mat.quantity || 0) * parseFloat(mat.unitCost || 0))).toLocaleString()}`
    }));

    return NextResponse.json({
      response: `✅ BOM (원가명세서) 등록 완료

📋 제품: ${productName}
📅 등록일: ${date}

💰 원가 구조:
• 자재비: ₩${materialCost.toLocaleString()} (${percentages.materials}%)
• 노무비: ₩${costBreakdown.labor.toLocaleString()} (${percentages.labor}%)
• 제조경비: ₩${costBreakdown.overhead.toLocaleString()} (${percentages.overhead}%)
• 총 원가: ₩${costBreakdown.total.toLocaleString()}

📦 자재 명세서:
${bomDetails.map(item => `• ${item.자재명}: ${item.소요량}${item.단위} × ₩${item.단가} = ${item.금액}`).join('\n')}

✅ 원가 데이터 저장 완료`
    });

  } catch (error) {
    console.error('BOM API Error:', error);
    return NextResponse.json(
      { error: `Server error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
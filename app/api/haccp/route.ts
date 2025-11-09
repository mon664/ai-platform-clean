import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { date, inspector, temperature, items, totalScore, timestamp } = await request.json();

    if (!inspector || !items || items.length === 0) {
      return NextResponse.json(
        { error: '검사자와 검사 항목 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    // HACCP 점수 분석
    const validItems = items.filter((item: any) => item.category && item.score);
    const categories = validItems.map((item: any) => item.category);
    const scores = validItems.map((item: any) => parseInt(item.score || 0));

    // 상태별 분류
    const statusCount = validItems.reduce((acc: any, item: any) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    // 온도 체크
    const tempStatus = !temperature ? '미측정' :
                      parseFloat(temperature) < 0 ? '저온' :
                      parseFloat(temperature) > 30 ? '고온' : '정상';

    // 위생 등급 판정
    let grade = 'A';
    let gradeColor = '#dcfce7';
    if (parseFloat(totalScore) < 3.5) {
      grade = 'C';
      gradeColor = '#fca5a5';
    } else if (parseFloat(totalScore) < 4.5) {
      grade = 'B';
      gradeColor = '#fde047';
    }

    // 개선 필요 항목
    const needImprovement = validItems.filter((item: any) =>
      item.status !== '양호' || parseInt(item.score || 0) < 4
    );

    // HACCP 검사 결과 상세
    const inspectionDetails = validItems.map((item: any) => {
      const scoreColor = parseInt(item.score) >= 4 ? '🟢' :
                         parseInt(item.score) >= 3 ? '🟡' : '🔴';
      return `${scoreColor} ${item.category}: ${item.status} (${item.score}/5점)${item.notes ? ` - ${item.notes}` : ''}`;
    });

    return NextResponse.json({
      response: `✅ HACCP 검사 기록 저장 완료

🛡️ 위생관리 검사 결과
📅 검사일: ${date}
👤 검사자: ${inspector}
🌡️ 실내온도: ${temperature || '미측정'}°C (${tempStatus})

📊 검사 항목 (${validItems.length}개):
${inspectionDetails.join('\n')}

🏆 종합 평가:
• 총점: ${totalScore}/5.0점
• 위생 등급: ${grade}등급
• 양호: ${statusCount['양호'] || 0}개
• 주의: ${statusCount['주의'] || 0}개
• 불량: ${statusCount['불량'] || 0}개

${needImprovement.length > 0 ? `
⚠️ 개선 필요 항목:
${needImprovement.map((item: any) => `• ${item.category}: ${item.notes || '점검 필요'}`).join('\n')}
` : '✅ 모든 항목 양호'}

📋 검사 기록이 저장되었습니다.`
    });

  } catch (error) {
    console.error('HACCP API Error:', error);
    return NextResponse.json(
      { error: `Server error: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
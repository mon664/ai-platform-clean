// Vision AI를 사용하여 이미지/텍스트에서 Raw Data 추출

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export class VisionAI {
  async extractPurchaseData(imageBase64: string): Promise<any> {
    // 거래명세서 이미지에서 데이터 추출
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `이 거래명세서 이미지에서 다음 정보를 추출하세요 (JSON 형식):
{
  "거래처": "회사명",
  "거래처_전화": "전화번호",
  "품목": [
    {
      "상품명": "제품명",
      "수량": 숫자,
      "단위": "kg/개/박스 등",
      "단가": 숫자,
      "합계": 숫자
    }
  ],
  "총합계": 숫자,
  "거래일자": "YYYY-MM-DD"
}`,
            },
          ],
        },
      ],
    });

    // 응답에서 JSON 추출
    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  }

  async extractProductionData(text: string): Promise<any> {
    // 생산 지시 텍스트에서 의도 파악
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `다음 생산 지시문을 파싱하세요:
"${text}"

JSON 형식으로 반환:
{
  "product_name": "제품명",
  "quantity": 숫자,
  "status": "생산 완료/생산 중/예약 등",
  "date": "YYYY-MM-DD"
}`,
        },
      ],
    });

    const text_response =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text_response.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  }

  async extractSanitationData(imageBase64: string): Promise<any> {
    // 위생점검표 이미지에서 데이터 추출
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `위생점검표 이미지를 분석하세요 (JSON):
{
  "검사일": "YYYY-MM-DD",
  "담당자": "이름",
  "온도": 온도숫자,
  "점검항목": [
    {"항목": "항목명", "상태": "O/X/N/A", "비고": "내용"}
  ]
}`,
            },
          ],
        },
      ],
    });

    const text_response =
      response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text_response.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  }
}
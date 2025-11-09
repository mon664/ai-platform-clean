// GLM 4.6으로 Raw Data를 이카운트 API 정확한 JSON으로 변환
// 특징: 저비용 + 낮은 토큰 사용량

export class GLM46Parser {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // 거래명세서 Raw Data → 이카운트 SavePurchases JSON
  async parsePurchaseData(rawData: any): Promise<any> {
    const prompt = `다음 거래명세서 데이터를 이카운트 ERP SavePurchases API 형식으로 변환하세요:

입력 데이터:
${JSON.stringify(rawData, null, 2)}

정확한 출력 JSON (이카운트 SavePurchases API 스키마):
{
  "PurchasesList": [{
    "BulkDatas": {
      "IO_DATE": "YYYYMMDD",
      "UPLOAD_SER_NO": "1",
      "CUST": "",
      "CUST_DES": "거래처명",
      "WH_CD": "00001",
      "TTL_CTT": "구매 전표",
      "U_MEMO1": "비고",
      "PurchasesDetails": [
        {
          "PROD_CD": "",
          "PROD_DES": "품목명",
          "QTY": 수량,
          "PRICE": 단가,
          "UNIT": "kg"
        }
      ]
    }
  }]
}

⚠️ **필수 규칙 (반드시 지켜야 함)**:
1. PROD_DES (품목명)은 반드시 입력하고 절대 비우지 말 것
2. QTY (수량)은 숫자로 입력하고 절대 비우지 말 것
3. PRICE (단가)는 숫자로 입력하고 절대 비우지 말 것
4. CUST_DES (거래처명)은 반드시 입력할 것
5. IO_DATE는 YYYYMMDD 형식 (예: 20251103)
6. PROD_CD와 CUST는 공백으로 두기 (이카운트가 자동 매칭)

정확한 JSON만 출력하세요. 어떤 설명도 추가하지 마세요.`;

    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3, // 정확성 중시
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    const text = data.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  }

  // 판매 Raw Data → 이카운트 SaveSales JSON (신규 추가)
  async parseSalesData(rawData: any): Promise<any> {
    const prompt = `다음 판매 데이터를 이카운트 ERP SaveSales API 형식으로 변환하세요:

입력 데이터:
${JSON.stringify(rawData, null, 2)}

정확한 출력 JSON (이카운트 SaveSales API 스키마):
{
  "SalesList": [{
    "BulkDatas": {
      "SO_DATE": "YYYYMMDD",
      "UPLOAD_SER_NO": "1",
      "CUST": "",
      "CUST_DES": "거래처명",
      "WH_CD": "00001",
      "TTL_CTT": "판매 전표",
      "U_MEMO1": "비고",
      "SalesDetails": [
        {
          "PROD_CD": "",
          "PROD_DES": "품목명",
          "QTY": 수량,
          "PRICE": 단가,
          "UNIT": "개"
        }
      ]
    }
  }]
}

⚠️ **필수 규칙 (반드시 지켜야 함)**:
1. PROD_DES (품목명)은 반드시 입력하고 절대 비우지 말 것
2. QTY (수량)은 숫자로 입력하고 절대 비우지 말 것
3. PRICE (단가)는 숫자로 입력하고 절대 비우지 말 것
4. CUST_DES (거래처명)은 반드시 입력할 것
5. SO_DATE는 YYYYMMDD 형식 (예: 20251103)
6. PROD_CD와 CUST는 공백으로 두기 (이카운트가 자동 매칭)

정확한 JSON만 출력하세요. 어떤 설명도 추가하지 마세요.`;

    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    const text = data.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  }

  // 생산 지시 Raw Data → 이카운트 생산 API JSON
  async parseProductionData(rawData: any, bomData: any): Promise<any> {
    const prompt = `생산 지시 데이터를 이카운트 ERP 형식으로 변환하세요:

생산 지시:
${JSON.stringify(rawData, null, 2)}

BOM 정보:
${JSON.stringify(bomData, null, 2)}

출력:
{
  "생산입고": {
    "GR_DATE": "YYYY-MM-DD",
    "PROD_CODE": "",
    "PROD_NAME": "제품명",
    "QTY": 수량
  },
  "생산불출": [
    {
      "GI_DATE": "YYYY-MM-DD",
      "PROD_CODE": "",
      "PROD_NAME": "원자재명",
      "QTY": 불출수량
    }
  ]
}

BOM에서 필요한 원자재와 수량을 계산하여 생산불출을 작성하세요.`;

    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    const text = data.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  }

  // BOM 텍스트 → 이카운트 BOM JSON
  async parseBOMData(bomText: string): Promise<any> {
    const prompt = `다음 레시피를 이카운트 BOM 형식으로 변환하세요:

레시피:
${bomText}

출력 (이카운트 BOM API):
{
  "PROD_CODE": "",
  "PROD_NAME": "완제품명",
  "BOMDetails": [
    {
      "LINE_NO": 1,
      "MATERIAL_CODE": "",
      "MATERIAL_NAME": "원자재명",
      "USAGE_QTY": 사용량,
      "USAGE_UNIT": "kg"
    }
  ]
}

정확한 JSON만 출력하세요.`;

    const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 1500,
      }),
    });

    const data = await response.json();
    const text = data.choices[0].message.content;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
  }
}
// 이카운트 Open API 통합을 위한 타입 정의

export interface EcountConfig {
  comCode: string;
  userId: string;
  apiCertKey: string;
  zone?: string;
  sessionId?: string;
  domain?: string;
}

export interface PurchaseData {
  PurchasesList: PurchasesListItem[];
}

export interface PurchasesListItem {
  BulkDatas: {
    IO_DATE: string;
    UPLOAD_SER_NO: string;
    CUST?: string;
    CUST_DES: string;
    WH_CD?: string;
    TTL_CTT?: string;
    U_MEMO1?: string;
    PurchasesDetails: PurchasesDetail[];
  };
}

export interface PurchasesDetail {
  PROD_CD?: string;
  PROD_DES: string;
  QTY: number;
  PRICE: number;
  UNIT?: string;
}

export interface BOMData {
  PROD_CODE?: string;
  PROD_NAME: string;
  BOMDetails: BOMDetail[];
}

export interface BOMDetail {
  LINE_NO: number;
  MATERIAL_CODE?: string;
  MATERIAL_NAME: string;
  USAGE_QTY: number;
  USAGE_UNIT: string;
}

export interface ProductionData {
  생산입고: {
    GR_DATE: string;
    PROD_CODE?: string;
    PROD_NAME: string;
    QTY: number;
  };
  생산불출: {
    GI_DATE: string;
    PROD_CODE?: string;
    PROD_NAME: string;
    QTY: number;
  }[];
}

export interface SanitationData {
  검사일: string;
  담당자: string;
  온도: number;
  점검항목: {
    항목: string;
    상태: string;
    비고?: string;
  }[];
}

// Vision AI 추출 결과 (Raw Data)
export interface RawPurchaseData {
  거래처: string;
  거래처_전화?: string;
  품목: {
    상품명: string;
    수량: number;
    단위: string;
    단가: number;
    합계: number;
  }[];
  총합계: number;
  거래일자: string;
}

export interface RawProductionData {
  product_name: string;
  quantity: number;
  status: string;
  date: string;
}

export interface RawSanitationData {
  검사일: string;
  담당자: string;
  온도: number;
  점검항목: {
    항목: string;
    상태: string;
    비고?: string;
  }[];
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
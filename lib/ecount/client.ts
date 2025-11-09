// 이카운트 Open API 클라이언트

import { EcountConfig, PurchaseData, BOMData, ProductionData, ApiResponse } from './types';

export class EcountClient {
  private config: EcountConfig;
  private baseUrl: string;
  private sessionId: string;
  private zone: string;

  constructor(config: EcountConfig) {
    this.config = config;
    this.baseUrl = `https://oapi${config.zone || 'BB'}${config.domain || '.ecount.com'}`;
    this.sessionId = config.sessionId || '';
    this.zone = config.zone || 'BB';
  }

  // 구매 전표 저장
  async savePurchase(purchaseData: any): Promise<ApiResponse> {
    try {
      const url = `${this.baseUrl}/OAPI/V2/Purchases/SavePurchases?SESSION_ID=${this.sessionId}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: data,
          message: '구매 전표가 성공적으로 저장되었습니다.'
        };
      } else {
        return {
          success: false,
          error: data.message || '구매 전표 저장에 실패했습니다.'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  // BOM 저장
  async saveBOM(bomData: BOMData): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/BOM/SaveBOM`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiCertKey}`,
          'X-ECOUNT-COM-CODE': this.config.comCode,
          'X-ECOUNT-USER-ID': this.config.userId,
        },
        body: JSON.stringify(bomData),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: data,
          message: 'BOM이 성공적으로 저장되었습니다.'
        };
      } else {
        return {
          success: false,
          error: data.message || 'BOM 저장에 실패했습니다.'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  // 생산 입고 처리
  async saveProductionReceipt(productionData: ProductionData['생산입고']): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/Production/SaveProductionReceipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiCertKey}`,
          'X-ECOUNT-COM-CODE': this.config.comCode,
          'X-ECOUNT-USER-ID': this.config.userId,
        },
        body: JSON.stringify(productionData),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: data,
          message: '생산 입고가 성공적으로 처리되었습니다.'
        };
      } else {
        return {
          success: false,
          error: data.message || '생산 입고 처리에 실패했습니다.'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  // 생산 불출 처리
  async saveProductionIssue(productionData: ProductionData['생산불출']): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/Production/SaveProductionIssue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiCertKey}`,
          'X-ECOUNT-COM-CODE': this.config.comCode,
          'X-ECOUNT-USER-ID': this.config.userId,
        },
        body: JSON.stringify(productionData),
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: data,
          message: '생산 불출이 성공적으로 처리되었습니다.'
        };
      } else {
        return {
          success: false,
          error: data.message || '생산 불출 처리에 실패했습니다.'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  // 거래처 검색
  async searchCustomers(keyword: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/Customers/SearchCustomers?keyword=${encodeURIComponent(keyword)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiCertKey}`,
          'X-ECOUNT-COM-CODE': this.config.comCode,
          'X-ECOUNT-USER-ID': this.config.userId,
        },
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: data
        };
      } else {
        return {
          success: false,
          error: data.message || '거래처 검색에 실패했습니다.'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  // 품목 검색
  async searchProducts(keyword: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/Products/SearchProducts?keyword=${encodeURIComponent(keyword)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiCertKey}`,
          'X-ECOUNT-COM-CODE': this.config.comCode,
          'X-ECOUNT-USER-ID': this.config.userId,
        },
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: data
        };
      } else {
        return {
          success: false,
          error: data.message || '품목 검색에 실패했습니다.'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }
}
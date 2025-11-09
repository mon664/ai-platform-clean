// 유효성 검사 및 데이터 검증 라이브러리

export interface Vendor {
  code: string;
  name: string;
  ceo: string;
  phone: string;
  mobile: string;
}

export interface Product {
  code: string;
  name: string;
  type: string;
  price: string;
}

export interface Warehouse {
  code: string;
  name: string;
  type: string;
  isActive: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  missing: string[];
  warnings: string[];
  suggestions: string[];
}

// 필수 필드 검증
export function validateRequiredFields(data: any, action: string): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // 공통 필수 필드
  const commonRequired = ['product', 'qty', 'date'];
  commonRequired.forEach(field => {
    if (!data[field] || data[field] === '' || data[field] === 0) {
      missing.push(field);
    }
  });

  // 액션별 필수 필드
  if (action === 'sale' || action === 'purchase') {
    const customerField = action === 'sale' ? 'customer' : 'vendor';
    if (!data[customerField] || data[customerField] === '') {
      missing.push(customerField);
      suggestions.push(`${action === 'sale' ? '판매' : '구매'}할 거래처를 명확히 지정해주세요`);
    }

    if (!data.product_code || data.product_code === '') {
      missing.push('product_code');
      suggestions.push('품목코드가 없습니다. 품목을 더 명확히 지정해주세요');
    }

    if (!data.price || data.price === 0) {
      missing.push('price');
      suggestions.push('단가를 지정해주세요');
    }
  }

  if (action === 'production_receipt') {
    if (!data.warehouse || data.warehouse === '') {
      missing.push('warehouse');
      suggestions.push('생산품을 입고할 창고를 지정해주세요');
    }
  }

  // 수량 검증
  if (data.qty && (data.qty <= 0 || !Number.isInteger(data.qty))) {
    warnings.push('수량은 0보다 큰 정수여야 합니다');
  }

  // 가격 검증
  if (data.price && data.price <= 0) {
    warnings.push('가격은 0보다 커야 합니다');
  }

  // 날짜 형식 검증
  if (data.date && !/^\d{8}$/.test(data.date)) {
    warnings.push('날짜는 YYYYMMDD 형식이어야 합니다');
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
    suggestions
  };
}

// 거래처 검색
export function findVendor(query: string, vendors: Vendor[]): Vendor | null {
  if (!query || !vendors || vendors.length === 0) return null;

  const lowerQuery = query.toLowerCase();

  // 1. 정확히 일치하는 이름 검색
  let match = vendors.find(v => v.name.toLowerCase() === lowerQuery);
  if (match) return match;

  // 2. 포함하는 이름 검색
  match = vendors.find(v => v.name.toLowerCase().includes(lowerQuery));
  if (match) return match;

  // 3. 코드 검색
  match = vendors.find(v => v.code.toLowerCase() === lowerQuery);
  if (match) return match;

  // 4. 코드 포함 검색
  match = vendors.find(v => v.code.toLowerCase().includes(lowerQuery));
  if (match) return match;

  return null;
}

// 품목 검색
export function findProduct(query: string, products: Product[]): Product | null {
  if (!query || !products || products.length === 0) return null;

  const lowerQuery = query.toLowerCase();

  // 1. 정확히 일치하는 이름 검색
  let match = products.find(p => p.name.toLowerCase() === lowerQuery);
  if (match) return match;

  // 2. 포함하는 이름 검색
  match = products.find(p => p.name.toLowerCase().includes(lowerQuery));
  if (match) return match;

  // 3. 코드 검색
  match = products.find(p => p.code.toLowerCase() === lowerQuery);
  if (match) return match;

  // 4. 코드 포함 검색
  match = products.find(p => p.code.toLowerCase().includes(lowerQuery));
  if (match) return match;

  return null;
}

// 창고 검색
export function findWarehouse(query: string, warehouses: Warehouse[]): Warehouse | null {
  if (!query || !warehouses || warehouses.length === 0) return null;

  const lowerQuery = query.toLowerCase();

  // 1. 정확히 일치하는 이름 검색
  let match = warehouses.find(w => w.name.toLowerCase() === lowerQuery && w.isActive);
  if (match) return match;

  // 2. 포함하는 이름 검색
  match = warehouses.find(w => w.name.toLowerCase().includes(lowerQuery) && w.isActive);
  if (match) return match;

  // 3. 코드 검색
  match = warehouses.find(w => w.code.toLowerCase() === lowerQuery && w.isActive);
  if (match) return match;

  // 4. 코드 포함 검색
  match = warehouses.find(w => w.code.toLowerCase().includes(lowerQuery) && w.isActive);
  if (match) return match;

  // 5. 기본 창고 반환
  match = warehouses.find(w => w.code === '00003' && w.isActive); // 본사창고
  if (match) return match;

  return null;
}

// 자연어에서 거래처/품목 추출
export function extractEntitiesFromText(text: string, vendors: Vendor[], products: Product[]): {
  vendor?: Vendor;
  product?: Product;
  quantity?: number;
  price?: number;
} {
  const result: any = {};

  // 거래처 추출
  for (const vendor of vendors) {
    if (text.toLowerCase().includes(vendor.name.toLowerCase()) ||
        text.toLowerCase().includes(vendor.code.toLowerCase())) {
      result.vendor = vendor;
      break;
    }
  }

  // 품목 추출
  for (const product of products) {
    if (text.toLowerCase().includes(product.name.toLowerCase()) ||
        text.toLowerCase().includes(product.code.toLowerCase())) {
      result.product = product;
      break;
    }
  }

  // 수량 추출 (숫자 + 단위 패턴)
  const quantityMatch = text.match(/(\d+)\s*(개|kg|g|ea|BOX|box|상자|마리)/);
  if (quantityMatch) {
    result.quantity = parseInt(quantityMatch[1]);
  }

  // 가격 추출 (숫자 + 원/달러 패턴)
  const priceMatch = text.match(/(\d+)\s*(원|달러|\$)/);
  if (priceMatch) {
    result.price = parseInt(priceMatch[1]);
  }

  return result;
}

// 부족한 정보 질문 생성
export function generateMissingInfoQuestions(missing: string[], action: string, context: any): string[] {
  const questions: string[] = [];

  missing.forEach(field => {
    switch (field) {
      case 'customer':
        if (action === 'sale') {
          questions.push('어떤 고객에게 판매하시나요? (예: 삼성전자, LG전자)');
        }
        break;
      case 'vendor':
        if (action === 'purchase') {
          questions.push('어떤 공급업체에서 구매하시나요? (예: LG디스플레이, 삼성SDI)');
        }
        break;
      case 'product':
        questions.push('어떤 품목을 거래하시나요? (예: 갤럭시 S24, OLED 패널)');
        break;
      case 'product_code':
        questions.push('품목을 더 명확히 지정해주세요. DB에 등록된 품목명을 사용해주세요.');
        break;
      case 'qty':
        questions.push('수량은 몇 개인가요?');
        break;
      case 'price':
        questions.push('단가는 얼마인가요?');
        break;
      case 'warehouse':
        if (action === 'production_receipt') {
          questions.push('어느 창고에 입고하시나요? (예: 본사창고, 제1창고)');
        }
        break;
    }
  });

  return questions;
}

// 정보 카드용 데이터 형식화
export function formatTransactionForDisplay(transaction: any, validation: any, warehouses: Warehouse[]) {
  const actionText = transaction.action === 'sale' ? '판매' :
                    transaction.action === 'purchase' ? '구매' : '생산입고';

  const items = [
    {
      icon: '📦',
      label: '액션',
      value: actionText,
      color: '#3b82f6'
    },
    {
      icon: transaction.action === 'sale' ? '👤' : '🏢',
      label: transaction.action === 'sale' ? '고객' : '공급업체',
      value: transaction.customer || transaction.vendor || '정보 없음',
      color: transaction.action === 'sale' ? '#10b981' : '#f59e0b'
    },
    {
      icon: '📄',
      label: '품목',
      value: transaction.product,
      color: '#8b5cf6'
    },
    {
      icon: transaction.product_code ? '🏷️' : '⚠️',
      label: '품목코드',
      value: transaction.product_code || 'DB에 없음',
      color: transaction.product_code ? '#06b6d4' : '#ef4444'
    },
    {
      icon: '📊',
      label: '수량',
      value: `${transaction.qty}개`,
      color: '#84cc16'
    },
    {
      icon: '💰',
      label: '단가',
      value: `${transaction.price.toLocaleString()}원`,
      color: '#f97316'
    }
  ];

  // 생산입고인 경우 창고 정보 추가
  if (transaction.action === 'production_receipt' && transaction.warehouse) {
    items.push({
      icon: '🏭',
      label: '창고',
      value: warehouses.find((w: Warehouse) => w.code === transaction.warehouse)?.name || transaction.warehouse,
      color: '#14b8a6'
    });
  }

  // 날짜 정보 추가
  items.push({
    icon: '📅',
    label: '날짜',
    value: transaction.date.replace(/(\d{4})(\d{2})(\d{2})/, '$1년 $2월 $3일'),
    color: '#6366f1'
  });

  return items;
}
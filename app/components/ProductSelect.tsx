'use client';

import { useState, useEffect } from 'react';

interface Product {
  code: string;
  name: string;
  type: string;
  price: string;
}

interface ProductSelectProps {
  value: string;
  onChange: (value: string, name: string, price: number) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ProductSelect({ value, onChange, disabled = false, placeholder = "품목을 선택하세요" }: ProductSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/data/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('품목 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedProduct = products.find(p => p.code === value);

  const handleSelect = (product: Product) => {
    const price = parseInt(product.price) || 0;
    onChange(product.code, product.name, price);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        fontSize: '12px',
        color: '#9ca3af',
        marginBottom: '4px',
        fontWeight: '600'
      }}>
        품목
      </div>

      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '12px 16px',
          backgroundColor: disabled ? '#4b5563' : '#2d3748',
          border: '1px solid #4a5568',
          borderRadius: '8px',
          color: disabled ? '#9ca3af' : '#e2e8f0',
          fontSize: '14px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = '#374151';
            e.currentTarget.style.borderColor = '#6b7280';
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = '#2d3748';
            e.currentTarget.style.borderColor = '#4a5568';
          }
        }}
      >
        <span style={{ flex: 1, textAlign: 'left' }}>
          {selectedProduct ? `${selectedProduct.name} (${selectedProduct.code})` : placeholder}
        </span>
        <span style={{
          fontSize: '12px',
          transition: 'transform 0.2s ease',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>▼</span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          zIndex: 50,
          backgroundColor: '#2d3748',
          border: '1px solid #4a5568',
          borderRadius: '8px',
          marginTop: '4px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxHeight: '300px',
          overflowY: 'auto',
          minWidth: '300px'
        }}>
          {/* 검색 입력창 */}
          <div style={{ padding: '8px', borderBottom: '1px solid #4a5568' }}>
            <input
              type="text"
              placeholder="품목 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#374151',
                border: '1px solid #4b5563',
                borderRadius: '6px',
                color: 'white',
                fontSize: '14px',
                outline: 'none'
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* 품목 목록 */}
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
              로딩 중...
            </div>
          ) : filteredProducts.length > 0 ? (
            filteredProducts.slice(0, 50).map(product => (
              <div
                key={product.code}
                onClick={() => handleSelect(product)}
                style={{
                  padding: '12px 16px',
                  backgroundColor: value === product.code ? '#8b5cf6' : 'transparent',
                  color: value === product.code ? 'white' : '#e2e8f0',
                  cursor: 'pointer',
                  borderBottom: '1px solid #374151',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (value !== product.code) {
                    e.currentTarget.style.backgroundColor = '#374151';
                  }
                }}
                onMouseLeave={(e) => {
                  if (value !== product.code) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {product.name}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  코드: {product.code} | 가격: {parseInt(product.price || '0').toLocaleString()}원
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
              {searchTerm ? '검색 결과가 없습니다' : '품목 데이터가 없습니다'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
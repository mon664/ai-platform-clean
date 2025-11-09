'use client';

import { useState, useEffect } from 'react';

interface Vendor {
  code: string;
  name: string;
  ceo: string;
  phone: string;
  mobile: string;
}

interface VendorSelectProps {
  value: string;
  onChange: (value: string, name: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function VendorSelect({ value, onChange, disabled = false, placeholder = "거래처를 선택하세요" }: VendorSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/data/vendors');
      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors || []);
      }
    } catch (error) {
      console.error('거래처 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedVendor = vendors.find(v => v.code === value);

  const handleSelect = (vendor: Vendor) => {
    onChange(vendor.code, vendor.name);
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
        거래처
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
          {selectedVendor ? `${selectedVendor.name} (${selectedVendor.code})` : placeholder}
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
              placeholder="거래처 검색..."
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

          {/* 거래처 목록 */}
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
              로딩 중...
            </div>
          ) : filteredVendors.length > 0 ? (
            filteredVendors.slice(0, 50).map(vendor => (
              <div
                key={vendor.code}
                onClick={() => handleSelect(vendor)}
                style={{
                  padding: '12px 16px',
                  backgroundColor: value === vendor.code ? '#3b82f6' : 'transparent',
                  color: value === vendor.code ? 'white' : '#e2e8f0',
                  cursor: 'pointer',
                  borderBottom: '1px solid #374151',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (value !== vendor.code) {
                    e.currentTarget.style.backgroundColor = '#374151';
                  }
                }}
                onMouseLeave={(e) => {
                  if (value !== vendor.code) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  {vendor.name}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  코드: {vendor.code} | 대표: {vendor.ceo}
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
              {searchTerm ? '검색 결과가 없습니다' : '거래처 데이터가 없습니다'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
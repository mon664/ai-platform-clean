'use client';

import { useState } from 'react';
import { ActionSelect } from './ActionSelect';
import { VendorSelect } from './VendorSelect';
import { ProductSelect } from './ProductSelect';
import { NumberInput } from './NumberInput';

interface OrderConfirmCardProps {
  onSubmit: (orderData: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface EditableRow {
  label: string;
  key: string;
  value: string | number;
  editable: boolean;
  type?: 'text' | 'number';
  icon?: string;
}

export function OrderConfirmCard({ onSubmit, onCancel, loading = false }: OrderConfirmCardProps) {
  const [action, setAction] = useState('');
  const [vendor, setVendor] = useState({ code: '', name: '' });
  const [product, setProduct] = useState({ code: '', name: '', price: 0 });
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  const actionLabels = {
    '1': '구매',
    '2': '판매',
    '3': '생산입고',
    '4': '재고',
    '5': '기타'
  };

  const handleActionChange = (value: string) => {
    setAction(value);
    setVendor({ code: '', name: '' });
  };

  const handleVendorChange = (code: string, name: string) => {
    setVendor({ code, name });
  };

  const handleProductChange = (code: string, name: string, price: number) => {
    setProduct({ code, name, price });
    setUnitPrice(price);
  };

  // 테이블 행 데이터
  const getTableRows = (): EditableRow[] => {
    const rows: EditableRow[] = [
      {
        label: '액션',
        key: 'action',
        value: actionLabels[action as keyof typeof actionLabels] || '선택 필요',
        editable: false,
        icon: '🔧'
      }
    ];

    if (action === '1' || action === '2') {
      rows.push({
        label: action === '1' ? '공급업체' : '거래처',
        key: 'vendor',
        value: vendor.name || '선택 필요',
        editable: true,
        type: 'text',
        icon: action === '1' ? '🏭' : '🏢'
      });
    }

    rows.push({
      label: '품목명',
      key: 'product',
      value: product.name || '선택 필요',
      editable: true,
      type: 'text',
      icon: '📦'
    });

    rows.push({
      label: '수량',
      key: 'quantity',
      value: quantity,
      editable: true,
      type: 'number',
      icon: '📊'
    });

    rows.push({
      label: '단가',
      key: 'unitPrice',
      value: `${unitPrice.toLocaleString()}원`,
      editable: true,
      type: 'number',
      icon: '💰'
    });

    rows.push({
      label: '총액',
      key: 'total',
      value: `${(quantity * unitPrice).toLocaleString()}원`,
      editable: false,
      icon: '💵'
    });

    return rows;
  };

  const handleCellEdit = (key: string, value: string | number) => {
    switch (key) {
      case 'quantity':
        const qty = parseInt(value.toString());
        if (!isNaN(qty) && qty > 0) setQuantity(qty);
        break;
      case 'unitPrice':
        const price = parseInt(value.toString());
        if (!isNaN(price) && price >= 0) setUnitPrice(price);
        break;
      case 'product':
        setProduct({ ...product, name: value.toString() });
        break;
      case 'vendor':
        setVendor({ ...vendor, name: value.toString() });
        break;
    }
    setEditingCell(null);
  };

  const handleCellClick = (key: string, currentValue: string | number) => {
    if (['quantity', 'unitPrice', 'product', 'vendor'].includes(key)) {
      setEditingCell(key);
      setTempValue(currentValue.toString().replace(/[^0-9]/g, ''));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, key: string) => {
    if (e.key === 'Enter') {
      handleCellEdit(key, tempValue);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const isFormValid = () => {
    return action && (action !== '1' && action !== '2' || vendor.code) && product.code && quantity > 0 && unitPrice > 0;
  };

  const handleSubmit = () => {
    const orderData = {
      action: actionLabels[action as keyof typeof actionLabels] || action,
      vendor: vendor.name,
      vendorCode: vendor.code,
      product: product.name,
      productCode: product.code,
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
      date: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
      warehouse: '00003'
    };
    onSubmit(orderData);
  };

  const tableRows = getTableRows();

  return (
    <div style={{
      backgroundColor: '#1f2937',
      border: '2px solid #374151',
      borderRadius: '12px',
      padding: '24px',
      margin: '16px 0',
      width: '100%',
      maxWidth: '600px',
      position: 'relative'
    }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid #374151'
      }}>
        <span style={{ fontSize: '24px', marginRight: '12px' }}>📋</span>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'white' }}>
            주문 정보 (셀을 클릭하여 수정)
          </h3>
          <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
            값을 클릭하면 직접 편집할 수 있습니다
          </p>
        </div>
      </div>

      {/* 액션 선택 (드롭다운) */}
      {!action && (
        <div style={{ marginBottom: '20px' }}>
          <ActionSelect
            value={action}
            onChange={handleActionChange}
            disabled={loading}
          />
        </div>
      )}

      {action && (
        <>
          {/* 거래처 선택 (판매/구매 시) */}
          {(action === '1' || action === '2') && !vendor.code && (
            <div style={{ marginBottom: '20px' }}>
              <VendorSelect
                value={vendor.code}
                onChange={handleVendorChange}
                disabled={loading}
                placeholder={action === '1' ? '공급업체를 선택하세요' : '고객사를 선택하세요'}
              />
            </div>
          )}

          {/* 품목 선택 */}
          {!product.code && (
            <div style={{ marginBottom: '20px' }}>
              <ProductSelect
                value={product.code}
                onChange={handleProductChange}
                disabled={loading}
              />
            </div>
          )}

          {/* 편집 가능한 테이블 */}
          <div style={{
            backgroundColor: '#111827',
            borderRadius: '8px',
            overflow: 'hidden',
            marginBottom: '20px',
            border: '1px solid #374151'
          }}>
            {tableRows.map((row, idx) => (
              <div
                key={row.key}
                style={{
                  display: 'flex',
                  borderBottom: idx < tableRows.length - 1 ? '1px solid #374151' : 'none',
                  backgroundColor: editingCell === row.key ? '#374151' : '#1f2937',
                  transition: 'background-color 0.2s ease'
                }}
              >
                {/* 레이블 */}
                <div style={{
                  flex: '0 0 30%',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#111827',
                  borderRight: '1px solid #374151',
                  fontWeight: 'bold',
                  color: '#e5e7eb',
                  fontSize: '14px'
                }}>
                  <span>{row.icon}</span>
                  {row.label}
                </div>

                {/* 값 (편집 가능) */}
                <div
                  onClick={() => handleCellClick(row.key, row.value)}
                  style={{
                    flex: '1',
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: row.editable && !loading ? 'pointer' : 'default',
                    userSelect: 'none',
                    position: 'relative',
                    backgroundColor: row.editable && !loading ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (row.editable && !loading && editingCell !== row.key) {
                      e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (row.editable && !loading && editingCell !== row.key) {
                      e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                    }
                  }}
                >
                  {editingCell === row.key ? (
                    <input
                      autoFocus
                      type={row.type === 'number' ? 'number' : 'text'}
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, row.key)}
                      onBlur={() => handleCellEdit(row.key, tempValue)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '2px solid #10b981',
                        backgroundColor: '#1f2937',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        outline: 'none'
                      }}
                    />
                  ) : (
                    <span style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: row.editable ? '#10b981' : '#9ca3af'
                    }}>
                      {row.value}
                      {row.editable && <span style={{ marginLeft: '8px', fontSize: '12px', color: '#6b7280' }}>✎</span>}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 버튼 그룹 */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}>
            <button
              onClick={handleSubmit}
              disabled={!isFormValid() || loading}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isFormValid() && !loading ? '#10b981' : '#4b5563',
                color: 'white',
                fontWeight: 'bold',
                cursor: isFormValid() && !loading ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (isFormValid() && !loading) {
                  e.currentTarget.style.backgroundColor = '#059669';
                }
              }}
              onMouseLeave={(e) => {
                if (isFormValid() && !loading) {
                  e.currentTarget.style.backgroundColor = '#10b981';
                }
              }}
            >
              {loading ? (
                <>
                  <span>⏳</span>
                  처리 중...
                </>
              ) : (
                <>
                  <span>✅</span>
                  맞아요
                </>
              )}
            </button>

            <button
              onClick={onCancel}
              disabled={loading}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: '1px solid #ef4444',
                backgroundColor: 'transparent',
                color: '#ef4444',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#ef4444';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#ef4444';
                }
              }}
            >
              <span>❌</span>
              취소
            </button>
          </div>

          {/* 유효성 검사 메시지 */}
          {!isFormValid() && (
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              backgroundColor: '#991b1b',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#fecaca'
            }}>
              ⚠️ {!vendor.name && (action === '1' || action === '2') && '거래처를 선택해주세요'} 
              {!product.name && '품목을 선택해주세요'}
              {quantity <= 0 && '수량을 입력해주세요'}
              {unitPrice <= 0 && '단가를 입력해주세요'}
            </div>
          )}

          {/* 편집 팁 */}
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            backgroundColor: '#1e3a8a',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#93c5fd',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>💡</span>
            <span>표의 초록색 값을 클릭하면 직접 수정할 수 있습니다</span>
          </div>
        </>
      )}
    </div>
  );
}

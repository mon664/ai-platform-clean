'use client';

import { useState, useEffect } from 'react';

export default function ProductionLogModule() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [shift, setShift] = useState('1교대');
  const [operator, setOperator] = useState('');
  const [products, setProducts] = useState([{ product: '', planned: '', actual: '', defects: '' }]);
  const [warehouses, setWarehouses] = useState([]);
  const [warehouse, setWarehouse] = useState('00003'); // 기본값: 본사창고
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [result, setResult] = useState('');

  // 데이터 로딩
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setDataLoading(true);
    try {
      const warehousesRes = await fetch('/api/data/warehouses');

      if (warehousesRes.ok) {
        const warehousesData = await warehousesRes.json();
        setWarehouses(warehousesData.warehouses || []);
      }
    } catch (error) {
      console.error('창고 데이터 로딩 실패:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const addProduct = () => {
    setProducts([...products, { product: '', planned: '', actual: '', defects: '' }]);
  };

  const updateProduct = (index: number, field: string, value: string) => {
    const newProducts = [...products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setProducts(newProducts);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/production-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: date.replace(/-/g, ''),
          shift,
          operator,
          warehouse,
          products: products.filter(p => p.product),
          timestamp: new Date().toISOString()
        })
      });

      const data = await response.json();
      setResult(data.response || '생산일지 등록 완료');
    } catch (error) {
      setResult('오류 발생: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: 'white', padding: '32px' }}>
      <div style={{ maxWidth: '896px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px', color: '#4ade80' }}>
            📊 생산일지 모듈
          </h1>
          <p style={{ color: '#9ca3af' }}>
            실시간 생산 현황 기록 및 품질 관리
          </p>
        </div>

        <div style={{ backgroundColor: '#1f2937', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#86efac' }}>
            기본 정보 {warehouses.length > 0 && `(${warehouses.length}개 창고)`}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                padding: '12px',
                backgroundColor: '#374151',
                color: 'white',
                border: '1px solid #4b5563',
                borderRadius: '8px'
              }}
            />
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              style={{
                padding: '12px',
                backgroundColor: '#374151',
                color: 'white',
                border: '1px solid #4b5563',
                borderRadius: '8px'
              }}
            >
              <option value="1교대">1교대</option>
              <option value="2교대">2교대</option>
              <option value="3교대">3교대</option>
            </select>
            <input
              type="text"
              placeholder="담당자"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              style={{
                padding: '12px',
                backgroundColor: '#374151',
                color: 'white',
                border: '1px solid #4b5563',
                borderRadius: '8px'
              }}
            />
            {dataLoading ? (
              <div style={{ padding: '12px', textAlign: 'center', color: '#9ca3af' }}>
                창고 로딩 중...
              </div>
            ) : (
              <select
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                style={{
                  padding: '12px',
                  backgroundColor: '#374151',
                  color: 'white',
                  border: '1px solid #4b5563',
                  borderRadius: '8px'
                }}
              >
                {warehouses.filter(w => w.isActive).map((w: any) => (
                  <option key={w.code} value={w.code}>
                    {w.name} ({w.type})
                  </option>
                ))}
              </select>
            )}
          </div>
          {warehouse && (
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
              선택된 창고: {warehouses.find((w: any) => w.code === warehouse)?.name || warehouse}
            </div>
          )}
        </div>

        <div style={{ backgroundColor: '#1f2937', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#86efac' }}>
              생산 품목
            </h3>
            <button
              onClick={addProduct}
              style={{
                padding: '8px 16px',
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              + 품목 추가
            </button>
          </div>

          {products.map((product, index) => (
            <div key={index} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr',
              gap: '12px',
              marginBottom: '12px',
              padding: '16px',
              backgroundColor: '#374151',
              borderRadius: '8px'
            }}>
              <input
                type="text"
                placeholder="제품명"
                value={product.product}
                onChange={(e) => updateProduct(index, 'product', e.target.value)}
                style={{
                  padding: '8px',
                  backgroundColor: '#1f2937',
                  color: 'white',
                  border: '1px solid #4b5563',
                  borderRadius: '4px'
                }}
              />
              <input
                type="number"
                placeholder="계획"
                value={product.planned}
                onChange={(e) => updateProduct(index, 'planned', e.target.value)}
                style={{
                  padding: '8px',
                  backgroundColor: '#1f2937',
                  color: 'white',
                  border: '1px solid #4b5563',
                  borderRadius: '4px'
                }}
              />
              <input
                type="number"
                placeholder="실적"
                value={product.actual}
                onChange={(e) => updateProduct(index, 'actual', e.target.value)}
                style={{
                  padding: '8px',
                  backgroundColor: '#1f2937',
                  color: 'white',
                  border: '1px solid #4b5563',
                  borderRadius: '4px'
                }}
              />
              <input
                type="number"
                placeholder="불량"
                value={product.defects}
                onChange={(e) => updateProduct(index, 'defects', e.target.value)}
                style={{
                  padding: '8px',
                  backgroundColor: '#1f2937',
                  color: 'white',
                  border: '1px solid #4b5563',
                  borderRadius: '4px'
                }}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!operator || products.every(p => !p.product) || loading}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: !operator || products.every(p => !p.product) || loading ? '#4b5563' : '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: !operator || products.every(p => !p.product) || loading ? 'not-allowed' : 'pointer',
            marginBottom: '24px'
          }}
        >
          {loading ? '처리 중...' : '📝 생산일지 저장'}
        </button>

        {result && (
          <div style={{
            padding: '16px',
            backgroundColor: result.includes('오류') ? '#1e3a8a' : '#14532d',
            borderRadius: '8px',
            color: result.includes('오류') ? '#dbeafe' : '#dcfce7'
          }}>
            {result}
          </div>
        )}
      </div>
    </div>
  );
}
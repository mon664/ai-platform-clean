'use client';

import { useState, useEffect } from 'react';

export default function PurchaseInputModule() {
  const [vendor, setVendor] = useState('');
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([{ product: '', qty: '', price: '' }]);
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
      const [vendorsRes, productsRes] = await Promise.all([
        fetch('/api/data/vendors'),
        fetch('/api/data/products')
      ]);

      if (vendorsRes.ok && productsRes.ok) {
        const vendorsData = await vendorsRes.json();
        const productsData = await productsRes.json();

        setVendors(vendorsData.vendors || []);
        setProducts(productsData.products || []);
      }
    } catch (error) {
      console.error('데이터 로딩 실패:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { product: '', qty: '', price: '' }]);
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/purchase-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor,
          items: items.filter(item => item.product && item.qty && item.price),
          date: new Date().toISOString().slice(0, 10).replace(/-/g, '')
        })
      });

      const data = await response.json();
      setResult(data.response || '처리 완료');
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
            🛒 구매입력 모듈
          </h1>
          <p style={{ color: '#9ca3af' }}>
            자동화된 구매 데이터 입력 및 이카운트 연동
          </p>
        </div>

        <div style={{ backgroundColor: '#1f2937', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#86efac' }}>
            공급업체 정보 {vendors.length > 0 && `(${vendors.length}개)`}
          </h3>
          {dataLoading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
              데이터 로딩 중...
            </div>
          ) : (
            <select
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#374151',
                color: 'white',
                border: '1px solid #4b5563',
                borderRadius: '8px',
                marginBottom: '8px'
              }}
            >
              <option value="">공급업체 선택</option>
              {vendors.map((v: any) => (
                <option key={v.code} value={v.name}>
                  {v.name} {v.ceo && `(${v.ceo})`}
                </option>
              ))}
            </select>
          )}
          {vendor && (
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
              선택된 공급업체: {vendor}
            </div>
          )}
        </div>

        <div style={{ backgroundColor: '#1f2937', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#86efac' }}>
              품목 정보 {products.length > 0 && `(${products.length}개)`}
            </h3>
            <button
              onClick={addItem}
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

          {items.map((item, index) => (
            <div key={index} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr',
              gap: '12px',
              marginBottom: '12px',
              padding: '12px',
              backgroundColor: '#374151',
              borderRadius: '8px'
            }}>
              <div>
                <select
                  value={item.product}
                  onChange={(e) => updateItem(index, 'product', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#1f2937',
                    color: 'white',
                    border: '1px solid #4b5563',
                    borderRadius: '4px',
                    marginBottom: '4px'
                  }}
                >
                  <option value="">품목 선택</option>
                  {products.filter(p => p.type === '[원재료]' || p.type === '[상품]').map((p: any) => (
                    <option key={p.code} value={p.name}>
                      {p.name} {p.spec && `(${p.spec})`}
                    </option>
                  ))}
                </select>
                {item.product && (
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                    {products.find((p: any) => p.name === item.product)?.spec || ''}
                  </div>
                )}
              </div>
              <input
                type="number"
                placeholder="수량"
                value={item.qty}
                onChange={(e) => updateItem(index, 'qty', e.target.value)}
                style={{
                  padding: '12px',
                  backgroundColor: '#374151',
                  color: 'white',
                  border: '1px solid #4b5563',
                  borderRadius: '8px'
                }}
              />
              <input
                type="number"
                placeholder="단가"
                value={item.price}
                onChange={(e) => updateItem(index, 'price', e.target.value)}
                style={{
                  padding: '12px',
                  backgroundColor: '#374151',
                  color: 'white',
                  border: '1px solid #4b5563',
                  borderRadius: '8px'
                }}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!vendor || items.every(item => !item.product) || loading}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: !vendor || items.every(item => !item.product) || loading ? '#4b5563' : '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: !vendor || items.every(item => !item.product) || loading ? 'not-allowed' : 'pointer',
            marginBottom: '24px'
          }}
        >
          {loading ? '처리 중...' : '🚀 이카운트에 구매 전표 생성'}
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
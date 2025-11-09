'use client';

import { useState } from 'react';

export default function BOMModule() {
  const [productName, setProductName] = useState('');
  const [materials, setMaterials] = useState([{ material: '', unit: '', quantity: '', unitCost: '' }]);
  const [laborCost, setLaborCost] = useState('');
  const [overheadCost, setOverheadCost] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [totalCost, setTotalCost] = useState(0);

  const addMaterial = () => {
    setMaterials([...materials, { material: '', unit: '', quantity: '', unitCost: '' }]);
  };

  const updateMaterial = (index: number, field: string, value: string) => {
    const newMaterials = [...materials];
    newMaterials[index] = { ...newMaterials[index], [field]: value };
    setMaterials(newMaterials);
    calculateTotalCost(newMaterials, laborCost, overheadCost);
  };

  const calculateTotalCost = (mats: any[], labor: string, overhead: string) => {
    const materialTotal = mats.reduce((sum, mat) => {
      return sum + (parseFloat(mat.quantity) || 0) * (parseFloat(mat.unitCost) || 0);
    }, 0);
    const total = materialTotal + (parseFloat(labor) || 0) + (parseFloat(overhead) || 0);
    setTotalCost(total);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/bom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          materials: materials.filter(m => m.material && m.quantity && m.unitCost),
          laborCost: parseFloat(laborCost) || 0,
          overheadCost: parseFloat(overheadCost) || 0,
          totalCost,
          date: new Date().toISOString().slice(0, 10).replace(/-/g, '')
        })
      });

      const data = await response.json();
      setResult(data.response || 'BOM 등록 완료');
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
            📋 BOM (원가명세서) 모듈
          </h1>
          <p style={{ color: '#9ca3af' }}>
            제품 원가 계산 및 자재 명세서 관리
          </p>
        </div>

        <div style={{ backgroundColor: '#1f2937', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#86efac' }}>
            제품 정보
          </h3>
          <input
            type="text"
            placeholder="제품명"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#374151',
              color: 'white',
              border: '1px solid #4b5563',
              borderRadius: '8px',
              marginBottom: '16px'
            }}
          />
        </div>

        <div style={{ backgroundColor: '#1f2937', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#86efac' }}>
              원자재 목록
            </h3>
            <button
              onClick={addMaterial}
              style={{
                padding: '8px 16px',
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              + 자재 추가
            </button>
          </div>

          {materials.map((material, index) => (
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
                placeholder="자재명"
                value={material.material}
                onChange={(e) => updateMaterial(index, 'material', e.target.value)}
                style={{
                  padding: '8px',
                  backgroundColor: '#1f2937',
                  color: 'white',
                  border: '1px solid #4b5563',
                  borderRadius: '4px'
                }}
              />
              <input
                type="text"
                placeholder="단위"
                value={material.unit}
                onChange={(e) => updateMaterial(index, 'unit', e.target.value)}
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
                placeholder="소요량"
                value={material.quantity}
                onChange={(e) => updateMaterial(index, 'quantity', e.target.value)}
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
                placeholder="단가"
                value={material.unitCost}
                onChange={(e) => updateMaterial(index, 'unitCost', e.target.value)}
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

        <div style={{ backgroundColor: '#1f2937', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#86efac' }}>
            기타 비용
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <input
              type="number"
              placeholder="노무비"
              value={laborCost}
              onChange={(e) => {
                setLaborCost(e.target.value);
                calculateTotalCost(materials, e.target.value, overheadCost);
              }}
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
              placeholder="제조경비"
              value={overheadCost}
              onChange={(e) => {
                setOverheadCost(e.target.value);
                calculateTotalCost(materials, laborCost, e.target.value);
              }}
              style={{
                padding: '12px',
                backgroundColor: '#374151',
                color: 'white',
                border: '1px solid #4b5563',
                borderRadius: '8px'
              }}
            />
          </div>
        </div>

        <div style={{ backgroundColor: '#14532d', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#86efac' }}>
              총 원가
            </h3>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dcfce7' }}>
              ₩ {totalCost.toLocaleString()}
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!productName || materials.every(m => !m.material) || loading}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: !productName || materials.every(m => !m.material) || loading ? '#4b5563' : '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: !productName || materials.every(m => !m.material) || loading ? 'not-allowed' : 'pointer',
            marginBottom: '24px'
          }}
        >
          {loading ? '처리 중...' : '💰 BOM 저장'}
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
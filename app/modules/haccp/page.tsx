'use client';

import { useState } from 'react';

export default function HACCPModule() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [inspector, setInspector] = useState('');
  const [temperature, setTemperature] = useState('');
  const [items, setItems] = useState([
    { category: '원료검수', status: '양호', notes: '', score: '5' },
    { category: '시설관리', status: '양호', notes: '', score: '5' },
    { category: '위생관리', status: '양호', notes: '', score: '5' },
    { category: '공정관리', status: '양호', notes: '', score: '5' }
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addCustomItem = () => {
    setItems([...items, { category: '', status: '양호', notes: '', score: '5' }]);
  };

  const calculateTotalScore = () => {
    const validItems = items.filter(item => item.score && item.category);
    if (validItems.length === 0) return 0;
    const total = validItems.reduce((sum, item) => sum + parseInt(item.score || '0'), 0);
    return (total / validItems.length).toFixed(1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/haccp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: date.replace(/-/g, ''),
          inspector,
          temperature: parseFloat(temperature) || 0,
          items: items.filter(item => item.category),
          totalScore: calculateTotalScore(),
          timestamp: new Date().toISOString()
        })
      });

      const data = await response.json();
      setResult(data.response || 'HACCP 검사 기록 저장 완료');
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
            🛡️ HACCP/위생관리 모듈
          </h1>
          <p style={{ color: '#9ca3af' }}>
            식품 안전 관리 및 위생 검사 기록 시스템
          </p>
        </div>

        <div style={{ backgroundColor: '#1f2937', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#86efac' }}>
            기본 정보
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
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
            <input
              type="text"
              placeholder="검사자"
              value={inspector}
              onChange={(e) => setInspector(e.target.value)}
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
              placeholder="온도 (°C)"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
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

        <div style={{ backgroundColor: '#1f2937', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#86efac' }}>
              검사 항목
            </h3>
            <button
              onClick={addCustomItem}
              style={{
                padding: '8px 16px',
                backgroundColor: '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              + 항목 추가
            </button>
          </div>

          {items.map((item, index) => (
            <div key={index} style={{
              marginBottom: '16px',
              padding: '16px',
              backgroundColor: '#374151',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 60px', gap: '12px', marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="검사 항목"
                  value={item.category}
                  onChange={(e) => updateItem(index, 'category', e.target.value)}
                  style={{
                    padding: '8px',
                    backgroundColor: '#1f2937',
                    color: 'white',
                    border: '1px solid #4b5563',
                    borderRadius: '4px'
                  }}
                />
                <select
                  value={item.status}
                  onChange={(e) => updateItem(index, 'status', e.target.value)}
                  style={{
                    padding: '8px',
                    backgroundColor: '#1f2937',
                    color: 'white',
                    border: '1px solid #4b5563',
                    borderRadius: '4px'
                  }}
                >
                  <option value="양호">양호</option>
                  <option value="주의">주의</option>
                  <option value="불량">불량</option>
                  <option value="개선필요">개선필요</option>
                </select>
                <input
                  type="number"
                  min="1"
                  max="5"
                  placeholder="점수 (1-5)"
                  value={item.score}
                  onChange={(e) => updateItem(index, 'score', e.target.value)}
                  style={{
                    padding: '8px',
                    backgroundColor: '#1f2937',
                    color: 'white',
                    border: '1px solid #4b5563',
                    borderRadius: '4px'
                  }}
                />
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                  backgroundColor: item.status === '양호' ? '#14532d' : item.status === '주의' ? '#713f12' : '#7f1d1d',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {item.score}/5
                </div>
              </div>
              <input
                type="text"
                placeholder="특이사항"
                value={item.notes}
                onChange={(e) => updateItem(index, 'notes', e.target.value)}
                style={{
                  width: '100%',
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

        <div style={{ backgroundColor: '#14532d', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#86efac' }}>
              종합 점수
            </h3>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: parseFloat(calculateTotalScore()) >= 4.5 ? '#dcfce7' : parseFloat(calculateTotalScore()) >= 3.5 ? '#fde047' : '#fca5a5'
            }}>
              {calculateTotalScore()} / 5.0
            </div>
          </div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#9ca3af' }}>
            {parseFloat(calculateTotalScore()) >= 4.5 ? '우수' : parseFloat(calculateTotalScore()) >= 3.5 ? '보통' : '개선 필요'}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!inspector || items.every(item => !item.category) || loading}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: !inspector || items.every(item => !item.category) || loading ? '#4b5563' : '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: !inspector || items.every(item => !item.category) || loading ? 'not-allowed' : 'pointer',
            marginBottom: '24px'
          }}
        >
          {loading ? '처리 중...' : '🛡️ HACCP 기록 저장'}
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
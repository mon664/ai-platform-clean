'use client';

import { useState } from 'react';

interface Action {
  code: string;
  name: string;
  icon: string;
  color: string;
}

interface ActionSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const actions: Action[] = [
  { code: '1', name: '구매', icon: '📥', color: '#f59e0b' },
  { code: '2', name: '판매', icon: '📤', color: '#3b82f6' },
  { code: '3', name: '생산입고', icon: '🏭', color: '#10b981' },
  { code: '4', name: '재고', icon: '🔄', color: '#8b5cf6' },
  { code: '5', name: '기타', icon: '📋', color: '#6b7280' }
];

export function ActionSelect({ value, onChange, disabled = false }: ActionSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedAction = actions.find(a => a.code === value);

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        fontSize: '12px',
        color: '#9ca3af',
        marginBottom: '4px',
        fontWeight: '600'
      }}>
        액션
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
        <span style={{ fontSize: '16px' }}>{selectedAction?.icon}</span>
        <span>{selectedAction?.name || '액션 선택'}</span>
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
          overflowY: 'auto'
        }}>
          {actions.map(action => (
            <div
              key={action.code}
              onClick={() => {
                onChange(action.code);
                setIsOpen(false);
              }}
              style={{
                padding: '12px 16px',
                backgroundColor: value === action.code ? action.color : 'transparent',
                color: value === action.code ? 'white' : '#e2e8f0',
                cursor: 'pointer',
                borderBottom: '1px solid #374151',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (value !== action.code) {
                  e.currentTarget.style.backgroundColor = '#374151';
                }
              }}
              onMouseLeave={(e) => {
                if (value !== action.code) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>{action.icon}</span>
              <span>{action.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
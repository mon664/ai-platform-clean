'use client';

import { useState } from 'react';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  label?: string;
  suffix?: string;
}

export function NumberInput({
  value,
  onChange,
  disabled = false,
  min = 0,
  max = 999999,
  step = 1,
  placeholder = "0",
  label,
  suffix = ""
}: NumberInputProps) {
  const [inputValue, setInputValue] = useState(value.toString());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // 숫자만 허용
    const numericValue = parseInt(newValue.replace(/[^0-9]/g, ''));
    if (!isNaN(numericValue) && numericValue >= min && numericValue <= max) {
      onChange(numericValue);
    }
  };

  const handleIncrement = () => {
    const newValue = Math.min(value + step, max);
    onChange(newValue);
    setInputValue(newValue.toString());
  };

  const handleDecrement = () => {
    const newValue = Math.max(value - step, min);
    onChange(newValue);
    setInputValue(newValue.toString());
  };

  const handleBlur = () => {
    const numericValue = parseInt(inputValue.replace(/[^0-9]/g, ''));
    if (isNaN(numericValue) || numericValue < min) {
      setInputValue(min.toString());
      onChange(min);
    } else if (numericValue > max) {
      setInputValue(max.toString());
      onChange(max);
    } else {
      setInputValue(numericValue.toString());
      onChange(numericValue);
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <div style={{
          fontSize: '12px',
          color: '#9ca3af',
          marginBottom: '4px',
          fontWeight: '600'
        }}>
          {label}
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: disabled ? '#4b5563' : '#2d3748',
        border: '1px solid #4a5568',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {/* 감소 버튼 */}
        <button
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          style={{
            padding: '12px 16px',
            backgroundColor: disabled || value <= min ? '#374151' : '#4b5563',
            border: 'none',
            color: disabled || value <= min ? '#6b7280' : '#e2e8f0',
            cursor: disabled || value <= min ? 'not-allowed' : 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            if (!disabled && value > min) {
              e.currentTarget.style.backgroundColor = '#6b7280';
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled && value > min) {
              e.currentTarget.style.backgroundColor = '#4b5563';
            }
          }}
        >
          −
        </button>

        {/* 숫자 입력창 */}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            flex: 1,
            padding: '12px 16px',
            backgroundColor: 'transparent',
            border: 'none',
            color: disabled ? '#9ca3af' : '#e2e8f0',
            fontSize: '16px',
            fontWeight: 'bold',
            textAlign: 'center',
            outline: 'none'
          }}
        />

        {/* 증가 버튼 */}
        <button
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          style={{
            padding: '12px 16px',
            backgroundColor: disabled || value >= max ? '#374151' : '#4b5563',
            border: 'none',
            color: disabled || value >= max ? '#6b7280' : '#e2e8f0',
            cursor: disabled || value >= max ? 'not-allowed' : 'pointer',
            fontSize: '18px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            if (!disabled && value < max) {
              e.currentTarget.style.backgroundColor = '#6b7280';
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled && value < max) {
              e.currentTarget.style.backgroundColor = '#4b5563';
            }
          }}
        >
          +
        </button>

        {/* 접미사 */}
        {suffix && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#374151',
            color: '#9ca3af',
            fontSize: '14px',
            fontWeight: 'bold',
            borderLeft: '1px solid #4a5568'
          }}>
            {suffix}
          </div>
        )}
      </div>
    </div>
  );
}
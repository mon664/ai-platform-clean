'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav style={{
      backgroundColor: '#1f2937',
      padding: '1rem 2rem',
      borderBottom: '1px solid #374151',
      position: 'sticky',
      top: '0',
      zIndex: '50'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4ade80', textDecoration: 'none' }}>
          🏭 AI 스마트 팩토리 ERP
        </Link>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link
            href="/"
            style={{
              color: pathname === '/' ? '#4ade80' : '#9ca3af',
              textDecoration: 'none',
              fontWeight: pathname === '/' ? 'bold' : 'normal',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: pathname === '/' ? '#064e3b' : 'transparent',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
          >
            🏠 대시보드
          </Link>
          <Link
            href="/chat"
            style={{
              color: pathname.startsWith('/chat') ? '#60a5fa' : '#9ca3af',
              textDecoration: 'none',
              fontWeight: pathname.startsWith('/chat') ? 'bold' : 'normal',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: pathname.startsWith('/chat') ? '#1e3a8a' : 'transparent',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
          >
            🤖 AI 채팅
          </Link>
          <Link
            href="/modules/purchase-input"
            style={{
              color: pathname.startsWith('/modules/purchase-input') ? '#f59e0b' : '#9ca3af',
              textDecoration: 'none',
              fontWeight: pathname.startsWith('/modules/purchase-input') ? 'bold' : 'normal',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: pathname.startsWith('/modules/purchase-input') ? '#78350f' : 'transparent',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
          >
            📋 구매입력
          </Link>
          <Link
            href="/ecount/purchase"
            style={{
              color: pathname.startsWith('/ecount/purchase') ? '#f59e0b' : '#9ca3af',
              textDecoration: 'none',
              fontWeight: pathname.startsWith('/ecount/purchase') ? 'bold' : 'normal',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: pathname.startsWith('/ecount/purchase') ? '#78350f' : 'transparent',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
          >
            📸 이카운트
          </Link>
          <Link
            href="/modules/production-log"
            style={{
              color: pathname.startsWith('/modules/production-log') ? '#10b981' : '#9ca3af',
              textDecoration: 'none',
              fontWeight: pathname.startsWith('/modules/production-log') ? 'bold' : 'normal',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: pathname.startsWith('/modules/production-log') ? '#064e3b' : 'transparent',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
          >
            📊 생산일지
          </Link>
          <Link
            href="/modules/bom"
            style={{
              color: pathname.startsWith('/modules/bom') ? '#10b981' : '#9ca3af',
              textDecoration: 'none',
              fontWeight: pathname.startsWith('/modules/bom') ? 'bold' : 'normal',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: pathname.startsWith('/modules/bom') ? '#064e3b' : 'transparent',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
          >
            💰 BOM
          </Link>
          <Link
            href="/modules/haccp"
            style={{
              color: pathname.startsWith('/modules/haccp') ? '#ef4444' : '#9ca3af',
              textDecoration: 'none',
              fontWeight: pathname.startsWith('/modules/haccp') ? 'bold' : 'normal',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: pathname.startsWith('/modules/haccp') ? '#7f1d1d' : 'transparent',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
          >
            🔬 HACCP
          </Link>
          <Link
            href="/ai-cli"
            style={{
              color: pathname.startsWith('/ai-cli') ? '#4ade80' : '#9ca3af',
              textDecoration: 'none',
              fontWeight: pathname.startsWith('/ai-cli') ? 'bold' : 'normal',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              backgroundColor: pathname.startsWith('/ai-cli') ? '#064e3b' : 'transparent',
              fontSize: '14px',
              transition: 'all 0.2s ease'
            }}
          >
            ⚡ AI CLI
          </Link>
        </div>
      </div>
    </nav>
  );
}
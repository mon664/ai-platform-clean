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

        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          <Link
            href="/"
            style={{
              color: pathname === '/' ? '#4ade80' : '#9ca3af',
              textDecoration: 'none',
              fontWeight: pathname === '/' ? 'bold' : 'normal',
              padding: '0.4rem 0.8rem',
              borderRadius: '0.5rem',
              backgroundColor: pathname === '/' ? '#064e3b' : 'transparent',
              fontSize: '13px',
              transition: 'all 0.2s ease'
            }}
          >
            🏠 대시보드
          </Link>
          <Link
            href="/blog"
            style={{
              color: pathname.startsWith('/blog') ? '#60a5fa' : '#9ca3af',
              textDecoration: 'none',
              fontWeight: pathname.startsWith('/blog') ? 'bold' : 'normal',
              padding: '0.4rem 0.8rem',
              borderRadius: '0.5rem',
              backgroundColor: pathname.startsWith('/blog') ? '#1e3a8a' : 'transparent',
              fontSize: '13px',
              transition: 'all 0.2s ease'
            }}
          >
            📝 블로그
          </Link>
          <Link
            href="/shorts"
            style={{
              color: pathname.startsWith('/shorts') ? '#ec4899' : '#9ca3af',
              textDecoration: 'none',
              fontWeight: pathname.startsWith('/shorts') ? 'bold' : 'normal',
              padding: '0.4rem 0.8rem',
              borderRadius: '0.5rem',
              backgroundColor: pathname.startsWith('/shorts') ? '#be185d' : 'transparent',
              fontSize: '13px',
              transition: 'all 0.2s ease'
            }}
          >
            🎬 쇼츠 생성기
          </Link>
          <Link
            href="/story"
            style={{
              color: pathname.startsWith('/story') ? '#f97316' : '#9ca3af',
              textDecoration: 'none',
              fontWeight: pathname.startsWith('/story') ? 'bold' : 'normal',
              padding: '0.4rem 0.8rem',
              borderRadius: '0.5rem',
              backgroundColor: pathname.startsWith('/story') ? '#c2410c' : 'transparent',
              fontSize: '13px',
              transition: 'all 0.2s ease'
            }}
          >
            🎭 장면 생성기
          </Link>
          <Link
            href="/character"
            style={{
              color: pathname.startsWith('/character') ? '#a855f7' : '#9ca3af',
              textDecoration: 'none',
              fontWeight: pathname.startsWith('/character') ? 'bold' : 'normal',
              padding: '0.4rem 0.8rem',
              borderRadius: '0.5rem',
              backgroundColor: pathname.startsWith('/character') ? '#7c3aed' : 'transparent',
              fontSize: '13px',
              transition: 'all 0.2s ease'
            }}
          >
            👤 캐릭터 생성기
          </Link>
          <Link
            href="/tts"
            style={{
              color: pathname.startsWith('/tts') ? '#10b981' : '#9ca3af',
              textDecoration: 'none',
              fontWeight: pathname.startsWith('/tts') ? 'bold' : 'normal',
              padding: '0.4rem 0.8rem',
              borderRadius: '0.5rem',
              backgroundColor: pathname.startsWith('/tts') ? '#047857' : 'transparent',
              fontSize: '13px',
              transition: 'all 0.2s ease'
            }}
          >
            🔊 TTS 생성기
          </Link>
          <Link
            href="/chat"
            style={{
              color: pathname.startsWith('/chat') ? '#3b82f6' : '#9ca3af',
              textDecoration: 'none',
              fontWeight: pathname.startsWith('/chat') ? 'bold' : 'normal',
              padding: '0.4rem 0.8rem',
              borderRadius: '0.5rem',
              backgroundColor: pathname.startsWith('/chat') ? '#1d4ed8' : 'transparent',
              fontSize: '13px',
              transition: 'all 0.2s ease'
            }}
          >
            🤖 AI 채팅
          </Link>
          <Link
            href="/modules/bom"
            style={{
              color: pathname.startsWith('/modules/bom') ? '#10b981' : '#9ca3af',
              textDecoration: 'none',
              fontWeight: pathname.startsWith('/modules/bom') ? 'bold' : 'normal',
              padding: '0.4rem 0.8rem',
              borderRadius: '0.5rem',
              backgroundColor: pathname.startsWith('/modules/bom') ? '#064e3b' : 'transparent',
              fontSize: '13px',
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
              padding: '0.4rem 0.8rem',
              borderRadius: '0.5rem',
              backgroundColor: pathname.startsWith('/modules/haccp') ? '#7f1d1d' : 'transparent',
              fontSize: '13px',
              transition: 'all 0.2s ease'
            }}
          >
            🔬 HACCP
          </Link>
        </div>
      </div>
    </nav>
  );
}
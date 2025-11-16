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
          {/* 기존 메뉴들 */}
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
            href="/ai-blog"
            style={{
              color: pathname === '/ai-blog' ? '#10b981' : '#9ca3af',
              textDecoration: 'none',
              fontWeight: pathname === '/ai-blog' ? 'bold' : 'normal',
              padding: '0.4rem 0.8rem',
              borderRadius: '0.5rem',
              backgroundColor: pathname === '/ai-blog' ? '#047857' : 'transparent',
              fontSize: '13px',
              transition: 'all 0.2s ease'
            }}
          >
            🤖 AI 블로그 생성
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
            🧑 캐릭터 생성기
          </Link>
          <Link
            href="/tts"
            style={{
              color: pathname.startsWith('/tts') ? '#06b6d4' : '#9ca3af',
              textDecoration: 'none',
              fontWeight: pathname.startsWith('/tts') ? 'bold' : 'normal',
              padding: '0.4rem 0.8rem',
              borderRadius: '0.5rem',
              backgroundColor: pathname.startsWith('/tts') ? '#0891b2' : 'transparent',
              fontSize: '13px',
              transition: 'all 0.2s ease'
            }}
          >
            🔊 TTS 생성기
          </Link>
          <Link
            href="/short-story"
            style={{
              color: pathname.startsWith('/short-story') ? '#f59e0b' : '#9ca3af',
              textDecoration: 'none',
              fontWeight: pathname.startsWith('/short-story') ? 'bold' : 'normal',
              padding: '0.4rem 0.8rem',
              borderRadius: '0.5rem',
              backgroundColor: pathname.startsWith('/short-story') ? '#d97706' : 'transparent',
              fontSize: '13px',
              transition: 'all 0.2s ease'
            }}
          >
            📱 썰 쇼츠
          </Link>

          {/* 🆕 AutoVid 메뉴 */}
          <div style={{
            display: 'inline-flex',
            gap: '0.8rem',
            padding: '0.4rem',
            borderRadius: '0.5rem',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            position: 'relative'
          }}>
            <span style={{
              position: 'absolute',
              top: '-8px',
              left: '8px',
              background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold',
              padding: '2px 6px',
              borderRadius: '10px',
              whiteSpace: 'nowrap'
            }}>
              NEW
            </span>
            <Link
              href="/autovid/auto"
              style={{
                color: pathname.startsWith('/autovid') ? '#f97316' : '#f97316',
                textDecoration: 'none',
                fontWeight: pathname.startsWith('/autovid') ? 'bold' : 'normal',
                padding: '0.4rem 0.8rem',
                borderRadius: '0.5rem',
                backgroundColor: pathname.startsWith('/autovid/auto') ? '#c2410c' : 'transparent',
                fontSize: '13px',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              🔥 자동영상생성
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
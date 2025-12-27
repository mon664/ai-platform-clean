'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { href: '/', icon: '🏠', label: '대시보드', color: '#4ade80' },
    { href: '/blog', icon: '📝', label: '블로그', color: '#60a5fa' },
    { href: '/ai-blog', icon: '🤖', label: 'AI 블로그', color: '#10b981' },
    { href: '/autoblog', icon: '✨', label: 'AlphaAutoBlog', color: '#a855f7', badge: 'NEW' },
    { href: '/autovid/auto', icon: '🔥', label: '자동영상생성', color: '#f97316' },
    { href: '/shorts', icon: '🎬', label: '쇼츠', color: '#ec4899' },
    { href: '/story', icon: '🎭', label: '장면', color: '#f97316' },
    { href: '/character', icon: '🧑', label: '캐릭터', color: '#a855f7' },
    { href: '/tts', icon: '🔊', label: 'TTS', color: '#06b6d4' },
    { href: '/short-story', icon: '📱', label: '썰 쇼츠', color: '#f59e0b' },
    { href: '/settings', icon: '⚙️', label: '설정', color: '#9ca3af' },
  ];

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
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link href="/" style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#4ade80',
          textDecoration: 'none',
          whiteSpace: 'nowrap'
        }}>
          🏭 AI 플랫폼
        </Link>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="lg:hidden"
          style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            fontSize: '1.5rem',
            cursor: 'pointer'
          }}
        >
          ☰
        </button>

        {/* Desktop Menu */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
          alignItems: 'center',
          flex: 1,
          marginLeft: '1rem'
        }} className="hidden lg:flex desktop-menu">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                color: pathname.startsWith(item.href) && item.href !== '/' || pathname === item.href ? item.color : '#9ca3af',
                textDecoration: 'none',
                fontWeight: (pathname.startsWith(item.href) && item.href !== '/' || pathname === item.href) ? 'bold' : 'normal',
                padding: '0.5rem 0.8rem',
                borderRadius: '0.5rem',
                backgroundColor: (pathname.startsWith(item.href) && item.href !== '/' || pathname === item.href) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                fontSize: '13px',
                transition: 'all 0.2s ease',
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                whiteSpace: 'nowrap'
              }}
            >
              {item.badge && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
                  color: 'white',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  padding: '2px 5px',
                  borderRadius: '10px',
                  whiteSpace: 'nowrap'
                }}>
                  {item.badge}
                </span>
              )}
              <span>{item.icon}</span>
              <span className="menu-label">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: '#1f2937',
            borderTop: '1px solid #374151',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            zIndex: 100
          }} className="lg:hidden mobile-menu-dropdown">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                style={{
                  color: pathname.startsWith(item.href) && item.href !== '/' || pathname === item.href ? item.color : '#9ca3af',
                  textDecoration: 'none',
                  fontWeight: (pathname.startsWith(item.href) && item.href !== '/' || pathname === item.href) ? 'bold' : 'normal',
                  padding: '0.8rem',
                  borderRadius: '0.5rem',
                  backgroundColor: (pathname.startsWith(item.href) && item.href !== '/' || pathname === item.href) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {item.badge && (
                  <span style={{
                    background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
                    color: 'white',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    padding: '2px 5px',
                    borderRadius: '10px',
                    marginLeft: 'auto'
                  }}>
                    {item.badge}
                  </span>
                )}
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

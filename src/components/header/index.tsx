'use client';

import Link from 'next/link';

const PAPLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="#FF6B35"/>
    <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" 
      fontFamily="Inter, system-ui, sans-serif" fontWeight="800" fontSize="14" 
      fill="white" letterSpacing="-0.5">PAP</text>
  </svg>
);

export function PapHeader() {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 24px',
      borderBottom: '1px solid rgba(255,107,53,0.2)',
      background: 'rgba(10,10,15,0.95)',
      backdropFilter: 'blur(8px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <PAPLogo />
        <span style={{
          color: '#FF6B35',
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: '-0.3px',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          Project Amazon PH
        </span>
      </Link>
      <nav style={{ display: 'flex', gap: 8 }}>
        <Link href="/" style={{ color: '#aaa', textDecoration: 'none', fontSize: 14, padding: '4px 10px', borderRadius: 6, fontFamily: 'Inter, system-ui, sans-serif' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#aaa')}
        >Home</Link>
        <Link href="/interviews" style={{ color: '#aaa', textDecoration: 'none', fontSize: 14, padding: '4px 10px', borderRadius: 6, fontFamily: 'Inter, system-ui, sans-serif' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#aaa')}
        >Interviews</Link>
        <Link href="/resume" style={{ color: '#aaa', textDecoration: 'none', fontSize: 14, padding: '4px 10px', borderRadius: 6, fontFamily: 'Inter, system-ui, sans-serif' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#aaa')}
        >Resume</Link>
      </nav>
    </header>
  );
}

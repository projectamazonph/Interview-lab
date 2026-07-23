'use client';

import Link from 'next/link';

const PAPLogo = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="6" fill="#FF6B35"/>
    <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle"
      fontFamily="Inter, system-ui, sans-serif" fontWeight="800" fontSize="14"
      fill="white" letterSpacing="-0.5">PAP</text>
  </svg>
);

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/#features' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

export function PapHeader() {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-surface-1 sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2.5 no-underline">
        <PAPLogo />
        <span className="font-heading font-bold text-sm text-accent">
          Project Amazon PH
        </span>
      </Link>
      <nav className="flex items-center gap-1">
        {NAV_LINKS.map(({ label, href }) => (
          <Link
            key={label}
            href={href}
            className="px-3 py-1.5 text-sm text-ink-500 hover:text-ink-900 rounded-md transition-colors duration-150"
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

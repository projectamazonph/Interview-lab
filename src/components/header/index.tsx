'use client';

import Link from 'next/link';
import { HStack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';

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
    <header className="sticky top-0 z-50 border-b border-border bg-surface">
      <HStack hAlign="between" vAlign="center" paddingInline={6} paddingBlock={3}>
        <Link href="/" className="no-underline">
          <HStack gap={3} vAlign="center">
            <PAPLogo />
            <Text type="body" weight="bold" size="sm" color="accent">
              Project Amazon PH
            </Text>
          </HStack>
        </Link>
        <HStack gap={1} vAlign="center" as="nav">
          {NAV_LINKS.map(({ label, href }) => (
            <Link key={label} href={href} className="no-underline">
              <Text type="body" size="sm" color="secondary">{label}</Text>
            </Link>
          ))}
        </HStack>
      </HStack>
    </header>
  );
}

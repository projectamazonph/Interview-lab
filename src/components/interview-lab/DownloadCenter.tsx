'use client';

import React, { useState, useEffect } from 'react';
import type { SVGProps } from 'react';
import Image from 'next/image';
import { Download, DOWNLOAD_CATEGORIES, ROLES } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { lightIcon } from '@/lib/astryx-icon';
import { Card } from '@astryxdesign/core/Card';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Grid } from '@astryxdesign/core/Grid';
import { Text, Heading } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Icon } from '@astryxdesign/core/Icon';
import { Button } from '@astryxdesign/core/Button';
import { Selector } from '@astryxdesign/core/Selector';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import {
  Download as DownloadIcon,
  MagnifyingGlass,
  Lock,
  FileDoc,
  EnvelopeSimple,
  NotePencil,
  Calculator,
  ListChecks,
  ChartBar,
  File as FileIcon,
} from '@phosphor-icons/react';

const CATEGORIES = DOWNLOAD_CATEGORIES;
const FILE_TYPES = ['PDF', 'DOCX', 'XLSX'] as const;

const TIER_HIERARCHY: Record<string, number> = { free: 0, starter: 1, pro: 2 };

type AccessBadgeVariant = 'success' | 'orange' | 'purple';

const CATEGORY_ICONS: Record<string, React.ComponentType<SVGProps<SVGSVGElement>>> = {
  'Resume Templates': lightIcon(FileDoc),
  'Cover Letters': lightIcon(EnvelopeSimple),
  'Cheat Sheets': lightIcon(NotePencil),
  'Calculators': lightIcon(Calculator),
  'Checklists': lightIcon(ListChecks),
  'Plans & Reports': lightIcon(ChartBar),
  'Other': lightIcon(FileIcon),
};

export function DownloadCenter() {
  const { user } = useAuth();
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterFileType, setFilterFileType] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterRole !== 'all') params.set('role', filterRole);
    if (filterCategory !== 'all') params.set('category', filterCategory);
    if (filterFileType !== 'all') params.set('fileType', filterFileType);

    fetch(`/api/downloads?${params.toString()}`)
      .then(res => res.json())
      .then(data => { setDownloads(data.downloads || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filterRole, filterCategory, filterFileType]);

  const userTier = user?.subscriptionTier || 'free';
  const userTierLevel = TIER_HIERARCHY[userTier] ?? 0;

  const canAccess = (tier: string) => {
    return userTierLevel >= (TIER_HIERARCHY[tier] ?? 0);
  };

  const filteredDownloads = downloads.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    return d.title.toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q);
  });

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = filteredDownloads.filter(d => d.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {} as Record<string, Download[]>);

  const uncategorized = filteredDownloads.filter(d => !CATEGORIES.includes(d.category as typeof CATEGORIES[number]));
  if (uncategorized.length > 0) grouped['Other'] = uncategorized;

  const getFileIconColor = (type: string) => {
    if (type === 'PDF') return 'error';
    if (type === 'DOCX') return 'accent';
    if (type === 'XLSX') return 'success';
    return 'secondary';
  };

  const getAccessVariant = (tier: string): AccessBadgeVariant => {
    if (tier === 'free') return 'success';
    if (tier === 'starter') return 'orange';
    return 'purple';
  };

  const getAccessLabel = (tier: string) => {
    if (tier === 'free') return 'Free';
    if (tier === 'starter') return 'Starter+';
    return 'Pro';
  };

  const handleDownload = async (download: Download) => {
    if (!canAccess(download.accessTier) || !user) return;
    try {
      const res = await fetch(`/api/downloads/${download.id}`);
      if (!res.ok) {
        console.error('Download failed:', res.statusText);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = download.title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  return (
    <VStack gap={6}>
      <VStack gap={1}>
        <Heading level={2}>Download Center</Heading>
        <Text type="supporting">Templates, worksheets, and guides for your job search</Text>
      </VStack>

      <HStack hAlign="center">
        <Image
          src="/images/illustrations/download-center.svg"
          alt="Download templates, worksheets, and guides for your Amazon VA job search"
          width={500}
          height={180}
          style={{ width: '100%', maxWidth: 512, height: 'auto' }}
        />
      </HStack>

      <HStack gap={3} wrap="wrap" vAlign="center">
        <TextInput
          label="Search downloads"
          isLabelHidden
          placeholder="Search downloads..."
          startIcon={lightIcon(MagnifyingGlass)}
          value={search}
          onChange={setSearch}
        />
        <Selector
          label="Category"
          value={filterCategory}
          onChange={setFilterCategory}
          options={[{ value: 'all', label: 'All Categories' }, ...CATEGORIES.map((cat) => ({ value: cat, label: cat }))]}
        />
        <Selector
          label="Role"
          value={filterRole}
          onChange={setFilterRole}
          options={[{ value: 'all', label: 'All Roles' }, ...ROLES.map((r) => ({ value: r, label: r }))]}
        />
        <Selector
          label="Type"
          value={filterFileType}
          onChange={setFilterFileType}
          options={[{ value: 'all', label: 'All Types' }, ...FILE_TYPES.map((ft) => ({ value: ft, label: ft }))]}
        />
        <Text type="supporting" size="sm">{filteredDownloads.length} items</Text>
      </HStack>

      <HStack gap={4} wrap="wrap">
        <HStack gap={1.5} vAlign="center">
          <Badge label="Free" variant="success" />
          <Text type="supporting" size="xsm">Available to all</Text>
        </HStack>
        <HStack gap={1.5} vAlign="center">
          <Badge label="Starter+" variant="orange" />
          <Text type="supporting" size="xsm">Requires Starter plan</Text>
        </HStack>
        <HStack gap={1.5} vAlign="center">
          <Badge label="Pro" variant="purple" />
          <Text type="supporting" size="xsm">Requires Pro plan</Text>
        </HStack>
      </HStack>

      {loading ? (
        <Grid columns={{ minWidth: 280, repeat: 'fit' }} gap={4}>
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} height={112} index={i} />)}
        </Grid>
      ) : (
        <VStack gap={8}>
          {Object.entries(grouped).map(([category, items]) => (
            <VStack key={category} gap={3}>
              <HStack gap={2} vAlign="center">
                <Icon icon={CATEGORY_ICONS[category] || CATEGORY_ICONS.Other} size="sm" color="accent" />
                <Text type="body" weight="semibold" maxLines={1}>{category}</Text>
                <Badge label={String(items.length)} variant="neutral" />
              </HStack>
              <Grid columns={{ minWidth: 280, repeat: 'fit' }} gap={4}>
                {items.map(d => {
                  const locked = !canAccess(d.accessTier);
                  return (
                    <Card key={d.id}>
                      <VStack gap={3}>
                        <HStack hAlign="between" vAlign="start" gap={2}>
                          <Icon icon={lightIcon(getFileTypeIcon(d.fileType))} size="lg" color={getFileIconColor(d.fileType)} />
                          {locked && <Badge label="Locked" variant="warning" icon={<Lock weight="light" />} />}
                        </HStack>
                        <VStack gap={1}>
                          <Text type="body" weight="medium" maxLines={1}>{d.title}</Text>
                          <Text type="supporting" size="sm" maxLines={2}>{d.description}</Text>
                        </VStack>
                        <HStack gap={1.5} wrap="wrap">
                          <Badge label={d.fileType} variant="neutral" />
                          <Badge label={getAccessLabel(d.accessTier)} variant={getAccessVariant(d.accessTier)} />
                          <Badge label={d.role} variant="neutral" />
                          {d.downloadCount > 0 && <Badge label={`${d.downloadCount} downloads`} variant="neutral" />}
                        </HStack>
                        {locked ? (
                          <Button label={`Upgrade to ${d.accessTier}`} variant="secondary" width="100%" icon={<Lock weight="light" />} isDisabled />
                        ) : (
                          <Button
                            label="Download"
                            variant="primary"
                            width="100%"
                            icon={<DownloadIcon weight="light" />}
                            onClick={() => handleDownload(d)}
                          />
                        )}
                      </VStack>
                    </Card>
                  );
                })}
              </Grid>
            </VStack>
          ))}

          {filteredDownloads.length === 0 && (
            <VStack gap={1} hAlign="center">
              <Text type="large">No downloads found</Text>
              <Text type="supporting" size="sm">Try adjusting your filters</Text>
            </VStack>
          )}
        </VStack>
      )}
    </VStack>
  );
}

function getFileTypeIcon(type: string) {
  if (type === 'PDF' || type === 'DOCX') return FileDoc;
  if (type === 'XLSX') return ChartBar;
  return FileIcon;
}

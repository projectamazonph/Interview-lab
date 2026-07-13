'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Download, DOWNLOAD_CATEGORIES, ROLES } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Download as DownloadIcon, MagnifyingGlass, Lock } from '@phosphor-icons/react';

const CATEGORIES = DOWNLOAD_CATEGORIES;
const FILE_TYPES = ['PDF', 'DOCX', 'XLSX'] as const;

const TIER_HIERARCHY: Record<string, number> = { free: 0, starter: 1, pro: 2 };

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

  // Group downloads by category
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = filteredDownloads.filter(d => d.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {} as Record<string, Download[]>);

  // Items that don't fit a known category
  const uncategorized = filteredDownloads.filter(d => !CATEGORIES.includes(d.category as typeof CATEGORIES[number]));
  if (uncategorized.length > 0) grouped['Other'] = uncategorized;

  const getFileIcon = (type: string) => {
    if (type === 'PDF') return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
    if (type === 'DOCX') return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent-indigo" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
    if (type === 'XLSX') return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    );
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    );
  };

  const getAccessColor = (tier: string) => {
    if (tier === 'free') return 'bg-green-100 text-green-700';
    if (tier === 'starter') return 'bg-accent-violet/15 text-accent-indigo';
    return 'bg-purple-100 text-purple-700';
  };

  const getAccessLabel = (tier: string) => {
    if (tier === 'free') return 'Free';
    if (tier === 'starter') return 'Starter+';
    return 'Pro';
  };

  const handleDownload = async (download: Download) => {
    if (!canAccess(download.accessTier) || !user) return;
    try {
      const res = await fetch(`/api/downloads/${download.id}`, {

      });
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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary font-heading">Download Center</h2>
        <p className="text-text-muted mt-1 text-sm sm:text-base">Templates, worksheets, and guides for your job search</p>
      </div>

      <div className="flex justify-center">
        <Image
          src="/images/illustrations/download-center.png"
          alt="Download templates, worksheets, and guides for your Amazon VA job search"
          width={500}
          height={180}
          className="w-full max-w-lg h-auto"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <MagnifyingGlass weight="light" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted" aria-hidden="true" />
          <Input
            placeholder="Search downloads..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterFileType} onValueChange={setFilterFileType}>
          <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {FILE_TYPES.map(ft => (
              <SelectItem key={ft} value={ft}>{ft}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-text-muted">{filteredDownloads.length} items</span>
      </div>

      {/* Access tier notice */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <Badge className="bg-green-100 text-green-700 whitespace-nowrap">Free</Badge>
          <span className="text-text-muted">Available to all</span>
        </div>
        <div className="flex items-center gap-1">
          <Badge className="bg-accent-violet/15 text-accent-indigo whitespace-nowrap">Starter+</Badge>
          <span className="text-text-muted">Requires Starter plan</span>
        </div>
        <div className="flex items-center gap-1">
          <Badge className="bg-purple-100 text-purple-700 whitespace-nowrap">Pro</Badge>
          <span className="text-text-muted">Requires Pro plan</span>
        </div>
      </div>

      {/* Download Groups */}
      {loading ? (
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-28 bg-glass-border/30 rounded-lg" />)}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                {category === 'Resume Templates' && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent-indigo shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                {category === 'Cover Letters' && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent-indigo shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                {category === 'Cheat Sheets' && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
                {category === 'Calculators' && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
                {category === 'Checklists' && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
                {category === 'Plans & Reports' && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                {category === 'Other' && <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>}
                <span className="truncate">{category}</span>
                <Badge variant="outline" className="text-xs font-normal shrink-0">{items.length}</Badge>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(d => {
                  const locked = !canAccess(d.accessTier);
                  return (
                    <Card key={d.id} className={`hover:shadow-md transition-shadow relative ${locked ? 'opacity-90' : ''}`}>
                      <CardContent className="p-4">
                        {locked && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-amber-100 text-amber-700 text-xs"><Lock weight="light" className="h-3 w-3 mr-1 inline" aria-hidden="true" />Locked</Badge>
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <div className="shrink-0">{getFileIcon(d.fileType)}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-text-primary truncate">{d.title}</p>
                            <p className="text-xs text-text-muted mt-1 line-clamp-2">{d.description}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              <Badge variant="outline" className="text-xs">{d.fileType}</Badge>
                              <Badge className={`text-xs ${getAccessColor(d.accessTier)}`}>
                                {getAccessLabel(d.accessTier)}
                              </Badge>
                              <Badge variant="outline" className="text-xs">{d.role}</Badge>
                              {d.downloadCount > 0 && (
                                <Badge variant="outline" className="text-xs text-text-muted">
                                  {d.downloadCount} downloads
                                </Badge>
                              )}
                            </div>
                            <div className="mt-3">
                              {locked ? (
                                <Button variant="default" size="sm" className="w-full whitespace-nowrap text-xs bg-amber-500 hover:bg-amber-600 text-white" disabled>
                                  <Lock weight="light" className="h-3 w-3 mr-1" aria-hidden="true" />
                                  Upgrade to {d.accessTier}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  className="w-full bg-accent-violet hover:bg-accent-indigo text-white whitespace-nowrap text-xs focus:ring-2 focus:ring-accent-violet focus:ring-offset-1"
                                  onClick={() => handleDownload(d)}
                                  aria-label={`Download ${d.title}`}
                                >
                                  <DownloadIcon weight="light" className="h-3 w-3 mr-1" aria-hidden="true" />
                                  Download
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredDownloads.length === 0 && (
            <div className="text-center py-12 text-text-muted">
              <p className="text-lg">No downloads found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

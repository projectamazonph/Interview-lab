'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Guide, ROLES } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, ArrowRight, ArrowLeft } from '@phosphor-icons/react';

interface GuideProgressItem {
  id: string;
  guideId: string;
  completed: boolean;
  checklist: Record<number, boolean> | null;
}

export function LearningPaths() {
  const { user } = useAuth();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, GuideProgressItem>>({});
  const [localChecklistOverrides, setLocalChecklistOverrides] = useState<{ guideId: string | null; overrides: Record<number, boolean> }>({ guideId: null, overrides: {} });

  // Derived checklist state from progress + local overrides
  const checklistState = useMemo(() => {
    if (selectedGuide && localChecklistOverrides.guideId === selectedGuide.id) {
      const base = progressMap[selectedGuide.id]?.checklist || {};
      return { ...base, ...localChecklistOverrides.overrides };
    }
    if (selectedGuide && progressMap[selectedGuide.id]?.checklist) {
      return progressMap[selectedGuide.id].checklist!;
    }
    return {};
  }, [selectedGuide, progressMap, localChecklistOverrides]);

  // Fetch guides
  useEffect(() => {
    const params = new URLSearchParams();
    if (filterLevel !== 'all') params.set('level', filterLevel);
    if (filterRole !== 'all') params.set('role', filterRole);
    fetch(`/api/guides?${params.toString()}`)
      .then(res => res.json())
      .then(data => { setGuides(data.guides || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filterLevel, filterRole]);

  // Fetch progress
  useEffect(() => {
    if (user) {
      fetch('/api/guides/progress')
        .then(res => res.json())
        .then(data => {
          const map: Record<string, GuideProgressItem> = {};
          for (const p of (data.progress || [])) {
            map[p.guideId] = p;
          }
          setProgressMap(map);
        })
        .catch(console.error);
    }
  }, [user]);

  const saveProgress = useCallback(async (guideId: string, completed: boolean, checklist: Record<number, boolean> | null) => {
    if (!user) return;
    try {
      await fetch('/api/guides/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({ guideId, completed, checklist }),
      });
      // Update local state
      setProgressMap(prev => ({
        ...prev,
        [guideId]: {
          id: prev[guideId]?.id || '',
          guideId,
          completed,
          checklist: checklist || null,
        },
      }));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }, [user]);

  const handleChecklistChange = (index: number, checked: boolean) => {
    const newState = { ...checklistState, [index]: checked };
    setLocalChecklistOverrides({ guideId: selectedGuide?.id ?? null, overrides: { ...checklistState, [index]: checked } });

    if (selectedGuide && user) {
      // Check if all checkboxes are now checked
      const allChecked = getAllCheckboxIndices(selectedGuide).every(i => newState[i] ?? false);
      saveProgress(selectedGuide.id, allChecked, newState);
    }
  };

  const handleMarkComplete = () => {
    if (selectedGuide && user) {
      const allIndices = getAllCheckboxIndices(selectedGuide);
      const newState: Record<number, boolean> = {};
      allIndices.forEach(i => newState[i] = true);
      setLocalChecklistOverrides({ guideId: selectedGuide.id, overrides: newState });
      saveProgress(selectedGuide.id, true, newState);
    }
  };

  const getAllCheckboxIndices = (guide: Guide) => {
    const indices: number[] = [];
    guide.content.split('\n').forEach((line, i) => {
      if (line.startsWith('- [ ] ')) indices.push(i);
    });
    return indices;
  };

  const getCompletedCount = (level: string) => {
    const levelGuides = guides.filter(g => g.level === level);
    return levelGuides.filter(g => progressMap[g.id]?.completed).length;
  };

  const getLevelColor = (level: string) => {
    if (level === 'beginner') return 'bg-green-100 text-green-700';
    if (level === 'intermediate') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  // Find next guide in sequence
  const getNextGuide = (currentGuide: Guide): Guide | null => {
    const sameLevel = guides.filter(g => g.level === currentGuide.level && g.role === currentGuide.role);
    const currentIndex = sameLevel.findIndex(g => g.id === currentGuide.id);
    if (currentIndex < sameLevel.length - 1) return sameLevel[currentIndex + 1];
    // Move to next level
    const levels = ['beginner', 'intermediate', 'advanced'];
    const currentLevelIndex = levels.indexOf(currentGuide.level);
    if (currentLevelIndex < levels.length - 1) {
      const nextLevelGuides = guides.filter(g => g.level === levels[currentLevelIndex + 1]);
      return nextLevelGuides[0] || null;
    }
    return null;
  };

  // Guide Detail View
  if (selectedGuide) {
    const isCompleted = progressMap[selectedGuide.id]?.completed ?? false;
    const nextGuide = getNextGuide(selectedGuide);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Button variant="outline" onClick={() => setSelectedGuide(null)} className="shrink-0">
            <ArrowLeft weight="light" className="h-4 w-4 mr-2" aria-hidden="true" />
            Back to Learning Paths
          </Button>
          <div className="flex items-center gap-2 sm:gap-3">
            {isCompleted && (
              <Badge className="bg-green-100 text-green-700 whitespace-nowrap">
                <CheckCircle weight="light" className="h-3 w-3 mr-1" aria-hidden="true" />
                Completed
              </Badge>
            )}
            <Button
              variant={isCompleted ? 'outline' : 'default'}
              className={!isCompleted ? 'bg-green-600 hover:bg-green-700 text-white shadow-inner-highlight-sm' : ''}
              onClick={handleMarkComplete}
              size={!isCompleted ? 'default' : 'sm'}
            >
              <CheckCircle weight="light" className="h-4 w-4 mr-2" aria-hidden="true" />
              {isCompleted ? 'Completed' : 'Mark Complete'}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className={`${getLevelColor(selectedGuide.level)} whitespace-nowrap`}>{selectedGuide.level}</Badge>
              <Badge variant="outline" className="whitespace-nowrap">{selectedGuide.role}</Badge>
            </div>
            <CardTitle>{selectedGuide.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              {selectedGuide.content.split('\n').map((line, i) => {
                if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mt-6 mb-3">{line.replace('# ', '')}</h1>;
                if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-semibold mt-5 mb-2">{line.replace('## ', '')}</h2>;
                if (line.startsWith('- [ ] ')) {
                  return (
                    <div key={i} className="flex items-center gap-2.5 ml-4 my-1.5">
                      <input
                        type="checkbox"
                        className="accent-blue-600 h-5 w-5 shrink-0 rounded cursor-pointer focus:ring-2 focus:ring-[#FF6B35] focus:ring-offset-1"
                        checked={checklistState[i] ?? false}
                        onChange={(e) => handleChecklistChange(i, e.target.checked)}
                      />
                      <span className={`text-sm min-w-0 ${checklistState[i] ? 'line-through text-[#737373]' : 'text-[#404040]'}`}>
                        {line.replace('- [ ] ', '')}
                      </span>
                    </div>
                  );
                }
                if (line.startsWith('- ')) return <li key={i} className="text-sm ml-4">{line.replace('- ', '')}</li>;
                if (line.trim() === '') return <br key={i} />;
                return <p key={i} className="text-sm text-[#404040] my-1">{line}</p>;
              })}
            </div>
          </CardContent>
        </Card>

        {nextGuide && (
          <Card className="border-[#FF6B35]/20 bg-[#FF6B35]/8">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#FF6B35]">Next Guide</p>
                  <p className="text-sm text-[#FF6B35] truncate">{nextGuide.title}</p>
                </div>
                <Button
                  className="bg-[#FF6B35] hover:bg-[#FF6B35] shrink-0 whitespace-nowrap"
                  size="sm"
                  onClick={() => {
                    setSelectedGuide(nextGuide);
                    window.scrollTo(0, 0);
                  }}
                >
                  Continue
                  <ArrowRight weight="light" className="h-4 w-4 ml-2" aria-hidden="true" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Overall progress
  const totalGuides = guides.length;
  const completedGuides = guides.filter(g => progressMap[g.id]?.completed).length;
  const overallPercent = totalGuides > 0 ? Math.round((completedGuides / totalGuides) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-[#171717] font-heading">Learning Paths</h2>
          <p className="text-[#737373] mt-1 text-sm sm:text-base">Role-based guides organized by experience level</p>
        </div>
      </div>

      <div className="flex justify-center">
        <Image
          src="/images/illustrations/learning-levels.png"
          alt="Learning paths from beginner to intermediate to advanced level"
          width={500}
          height={180}
          className="w-full max-w-lg h-auto"
        />
      </div>

      {/* Overall Progress */}
      {user && totalGuides > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Your Progress</p>
              <p className="text-sm text-[#737373]">{completedGuides}/{totalGuides} guides completed</p>
            </div>
            <Progress value={overallPercent} className="h-2" />
            <p className="text-xs text-[#737373] mt-1">{overallPercent}% complete</p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3 flex-wrap">
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Group by level */}
      {['beginner', 'intermediate', 'advanced'].map(level => {
        const levelGuides = guides.filter(g => g.level === level);
        if (levelGuides.length === 0) return null;
        const completedInLevel = getCompletedCount(level);
        const levelPercent = Math.round((completedInLevel / levelGuides.length) * 100);

        return (
          <div key={level}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-[#171717] capitalize">{level} Guides</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#737373]">{completedInLevel}/{levelGuides.length}</span>
                <Progress value={levelPercent} className="w-24 h-1.5" />
              </div>
            </div>
            {loading ? (
              <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map(i => <div key={i} className="h-20 bg-[#E5E5E0]/30 rounded-lg" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {levelGuides.map(g => {
                  const isDone = progressMap[g.id]?.completed ?? false;
                  return (
                    <Card
                      key={g.id}
                      className={`hover:shadow-md transition-shadow cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-1 ${isDone ? 'border-green-200 bg-green-50/30' : ''}`}
                      onClick={() => setSelectedGuide(g)}
                      tabIndex={0}
                      role="button"
                      aria-label={`Open guide: ${g.title}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {isDone ? (
                                <CheckCircle weight="light" className="h-4 w-4 text-green-500 shrink-0" aria-hidden="true" />
                              ) : (
                                <Circle weight="light" className="h-4 w-4 text-[#737373] shrink-0" aria-hidden="true" />
                              )}
                              <p className={`font-medium text-sm truncate ${isDone ? 'text-green-700' : 'text-[#171717]'}`}>{g.title}</p>
                            </div>
                    <div className="flex flex-wrap gap-2 mt-1 ml-6">
                              <Badge className={`${getLevelColor(g.level)} whitespace-nowrap`}>{g.level}</Badge>
                              <Badge variant="outline" className="whitespace-nowrap">{g.role}</Badge>
                            </div>
                          </div>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#737373] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

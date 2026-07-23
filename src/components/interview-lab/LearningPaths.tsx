'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Guide, ROLES } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@astryxdesign/core/Card';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Grid } from '@astryxdesign/core/Grid';
import { Text, Heading } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Icon } from '@astryxdesign/core/Icon';
import { Button } from '@astryxdesign/core/Button';
import { Selector } from '@astryxdesign/core/Selector';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { CheckCircle, Circle, ArrowRight, ArrowLeft, CaretRight } from '@phosphor-icons/react';

interface GuideProgressItem {
  id: string;
  guideId: string;
  completed: boolean;
  checklist: Record<number, boolean> | null;
}

type LevelBadgeVariant = 'success' | 'warning' | 'error';

export function LearningPaths() {
  const { user } = useAuth();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, GuideProgressItem>>({});
  const [localChecklistOverrides, setLocalChecklistOverrides] = useState<{ guideId: string | null; overrides: Record<number, boolean> }>({ guideId: null, overrides: {} });

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

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterLevel !== 'all') params.set('level', filterLevel);
    if (filterRole !== 'all') params.set('role', filterRole);
    fetch(`/api/guides?${params.toString()}`)
      .then(res => res.json())
      .then(data => { setGuides(data.guides || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filterLevel, filterRole]);

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guideId, completed, checklist }),
      });
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

  const getLevelVariant = (level: string): LevelBadgeVariant => {
    if (level === 'beginner') return 'success';
    if (level === 'intermediate') return 'warning';
    return 'error';
  };

  const getNextGuide = (currentGuide: Guide): Guide | null => {
    const sameLevel = guides.filter(g => g.level === currentGuide.level && g.role === currentGuide.role);
    const currentIndex = sameLevel.findIndex(g => g.id === currentGuide.id);
    if (currentIndex < sameLevel.length - 1) return sameLevel[currentIndex + 1];
    const levels = ['beginner', 'intermediate', 'advanced'];
    const currentLevelIndex = levels.indexOf(currentGuide.level);
    if (currentLevelIndex < levels.length - 1) {
      const nextLevelGuides = guides.filter(g => g.level === levels[currentLevelIndex + 1]);
      return nextLevelGuides[0] || null;
    }
    return null;
  };

  if (selectedGuide) {
    const isCompleted = progressMap[selectedGuide.id]?.completed ?? false;
    const nextGuide = getNextGuide(selectedGuide);

    return (
      <VStack gap={6}>
        <HStack hAlign="between" vAlign="center" wrap="wrap" gap={2}>
          <Button label="Back to Learning Paths" variant="secondary" icon={<ArrowLeft weight="light" />} onClick={() => setSelectedGuide(null)} />
          <HStack gap={3} vAlign="center">
            {isCompleted && <Badge label="Completed" variant="success" icon={<CheckCircle weight="light" />} />}
            <Button
              label={isCompleted ? 'Completed' : 'Mark Complete'}
              variant={isCompleted ? 'secondary' : 'primary'}
              icon={<CheckCircle weight="light" />}
              onClick={handleMarkComplete}
            />
          </HStack>
        </HStack>

        <Card>
          <VStack gap={4}>
            <VStack gap={2}>
              <HStack gap={2} wrap="wrap">
                <Badge label={selectedGuide.level} variant={getLevelVariant(selectedGuide.level)} />
                <Badge label={selectedGuide.role} variant="neutral" />
              </HStack>
              <Heading level={2}>{selectedGuide.title}</Heading>
            </VStack>
            <VStack gap={2}>
              {selectedGuide.content.split('\n').map((line, i) => {
                if (line.startsWith('# ')) return <Heading key={i} level={3}>{line.replace('# ', '')}</Heading>;
                if (line.startsWith('## ')) return <Heading key={i} level={4}>{line.replace('## ', '')}</Heading>;
                if (line.startsWith('- [ ] ')) {
                  return (
                    <CheckboxInput
                      key={i}
                      label={line.replace('- [ ] ', '')}
                      value={checklistState[i] ?? false}
                      onChange={(checked) => handleChecklistChange(i, checked)}
                    />
                  );
                }
                if (line.startsWith('- ')) return <Text key={i} type="body" size="sm">{`• ${line.replace('- ', '')}`}</Text>;
                if (line.trim() === '') return null;
                return <Text key={i} type="body" size="sm">{line}</Text>;
              })}
            </VStack>
          </VStack>
        </Card>

        {nextGuide && (
          <Card variant="orange">
            <HStack hAlign="between" vAlign="center" gap={3}>
              <VStack gap={0}>
                <Text type="body" size="sm" weight="medium" color="accent">Next Guide</Text>
                <Text type="body" size="sm" color="accent" maxLines={1}>{nextGuide.title}</Text>
              </VStack>
              <Button
                label="Continue"
                variant="primary"
                icon={<ArrowRight weight="light" />}
                onClick={() => { setSelectedGuide(nextGuide); window.scrollTo(0, 0); }}
              />
            </HStack>
          </Card>
        )}
      </VStack>
    );
  }

  const totalGuides = guides.length;
  const completedGuides = guides.filter(g => progressMap[g.id]?.completed).length;
  const overallPercent = totalGuides > 0 ? Math.round((completedGuides / totalGuides) * 100) : 0;

  return (
    <VStack gap={6}>
      <VStack gap={1}>
        <Heading level={2}>Learning Paths</Heading>
        <Text type="supporting">Role-based guides organized by experience level</Text>
      </VStack>

      <HStack hAlign="center">
        <Image
          src="/images/illustrations/learning-levels.svg"
          alt="Learning paths from beginner to intermediate to advanced level"
          width={500}
          height={180}
          style={{ width: '100%', maxWidth: 512, height: 'auto' }}
        />
      </HStack>

      {user && totalGuides > 0 && (
        <Card>
          <VStack gap={2}>
            <HStack hAlign="between">
              <Text type="body" size="sm" weight="medium">Your Progress</Text>
              <Text type="supporting" size="sm">{completedGuides}/{totalGuides} guides completed</Text>
            </HStack>
            <ProgressBar label="Overall guide progress" isLabelHidden value={overallPercent} hasValueLabel />
          </VStack>
        </Card>
      )}

      <HStack gap={3} wrap="wrap">
        <Selector
          label="Level"
          value={filterLevel}
          onChange={setFilterLevel}
          options={[
            { value: 'all', label: 'All Levels' },
            { value: 'beginner', label: 'Beginner' },
            { value: 'intermediate', label: 'Intermediate' },
            { value: 'advanced', label: 'Advanced' },
          ]}
        />
        <Selector
          label="Role"
          value={filterRole}
          onChange={setFilterRole}
          options={[{ value: 'all', label: 'All Roles' }, ...ROLES.map((r) => ({ value: r, label: r }))]}
        />
      </HStack>

      {['beginner', 'intermediate', 'advanced'].map(level => {
        const levelGuides = guides.filter(g => g.level === level);
        if (levelGuides.length === 0) return null;
        const completedInLevel = getCompletedCount(level);
        const levelPercent = Math.round((completedInLevel / levelGuides.length) * 100);

        return (
          <VStack key={level} gap={3}>
            <HStack hAlign="between" vAlign="center">
              <Heading level={3}>{level.charAt(0).toUpperCase() + level.slice(1)} Guides</Heading>
              <HStack gap={2} vAlign="center">
                <Text type="supporting" size="sm">{completedInLevel}/{levelGuides.length}</Text>
                <ProgressBar label={`${level} progress`} isLabelHidden value={levelPercent} />
              </HStack>
            </HStack>
            {loading ? (
              <Grid columns={2} gap={3}>
                {[1, 2].map(i => <Skeleton key={i} height={80} index={i} />)}
              </Grid>
            ) : (
              <Grid columns={{ minWidth: 280, repeat: 'fit' }} gap={3}>
                {levelGuides.map(g => {
                  const isDone = progressMap[g.id]?.completed ?? false;
                  return (
                    <ClickableCard key={g.id} label={`Open guide: ${g.title}`} onClick={() => setSelectedGuide(g)} variant={isDone ? 'green' : 'default'}>
                      <HStack hAlign="between" vAlign="center" gap={3}>
                        <VStack gap={1}>
                          <HStack gap={2} vAlign="center">
                            <Icon icon={isDone ? CheckCircle : Circle} size="sm" color={isDone ? 'success' : 'secondary'} />
                            <Text type="body" size="sm" weight="medium" maxLines={1}>{g.title}</Text>
                          </HStack>
                          <HStack gap={2} wrap="wrap">
                            <Badge label={g.level} variant={getLevelVariant(g.level)} />
                            <Badge label={g.role} variant="neutral" />
                          </HStack>
                        </VStack>
                        <Icon icon={CaretRight} size="sm" color="secondary" />
                      </HStack>
                    </ClickableCard>
                  );
                })}
              </Grid>
            )}
          </VStack>
        );
      })}
    </VStack>
  );
}

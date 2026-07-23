'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Question, ROLES, DIFFICULTIES, QUESTION_TYPES, SKILL_AREAS } from '@/lib/types';
import { Card } from '@astryxdesign/core/Card';
import { VStack, HStack } from '@astryxdesign/core/Stack';
import { Grid } from '@astryxdesign/core/Grid';
import { Text, Heading } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Selector } from '@astryxdesign/core/Selector';
import { TextInput } from '@astryxdesign/core/TextInput';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TabList, Tab } from '@astryxdesign/core/TabList';
import { List, ListItem } from '@astryxdesign/core/List';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Skeleton } from '@astryxdesign/core/Skeleton';

type AdminTab = 'questions' | 'guides' | 'downloads' | 'analytics';

type StatVariant = 'orange' | 'green';

function StatCard({ value, label, variant }: { value: React.ReactNode; label: string; variant: StatVariant }) {
  return (
    <Card>
      <VStack gap={0.5} hAlign="center">
        <Text type="display-2" color={variant === 'orange' ? 'accent' : 'primary'}>{value}</Text>
        <Text type="supporting" size="sm">{label}</Text>
      </VStack>
    </Card>
  );
}

function BreakdownBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <HStack gap={3} vAlign="center">
      <VStack width={112}>
        <Text type="body" size="sm" maxLines={1}>{label}</Text>
      </VStack>
      <ProgressBar label={`${label}: ${count} (${pct}%)`} isLabelHidden value={pct} />
      <Text type="supporting" size="sm">{`${count} (${pct}%)`}</Text>
    </HStack>
  );
}

type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral' | 'orange';

export function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('questions');

  // Questions state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [form, setForm] = useState({
    role: 'PPC VA', difficulty: 'beginner', type: 'technical', skillArea: 'PPC',
    question: '', whyEmployersAsk: '', strongAnswerPoints: '', weakAnswerWarnings: '',
    sampleAnswer: '', answerFormat: 'bullet', status: 'published',
  });

  // Guides state
  const [guides, setGuides] = useState<Array<{ id: string; title: string; slug: string; level: string; role: string; content: string; status: string }>>([]);
  const [showGuideForm, setShowGuideForm] = useState(false);
  const [editingGuideId, setEditingGuideId] = useState<string | null>(null);
  const [guideForm, setGuideForm] = useState({ title: '', slug: '', level: 'beginner', role: 'General', content: '', status: 'published' });

  // Downloads state
  const [downloads, setDownloads] = useState<Array<{ id: string; title: string; fileType: string; role: string; category: string; accessTier: string; downloadCount: number }>>([]);
  const [showDownloadForm, setShowDownloadForm] = useState(false);
  const [downloadForm, setDownloadForm] = useState({ title: '', fileType: 'PDF', role: 'General', category: 'Cheat Sheets', accessTier: 'free', description: '', fileName: '' });

  // Analytics state
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);

  // ===== QUESTIONS =====
  const fetchQuestions = async () => {
    if (!user?.isAdmin) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterRole !== 'all') params.set('role', filterRole);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      const res = await fetch(`/api/admin/questions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuestions(); }, [user, filterRole, filterStatus]);

  const handleSaveQuestion = async () => {
    if (!user || !form.question.trim()) return;
    try {
      const body = {
        ...form,
        strongAnswerPoints: form.strongAnswerPoints ? JSON.stringify(form.strongAnswerPoints.split('\n').filter(Boolean)) : null,
        weakAnswerWarnings: form.weakAnswerWarnings ? JSON.stringify(form.weakAnswerWarnings.split('\n').filter(Boolean)) : null,
      };

      if (editingId) {
        await fetch(`/api/admin/questions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...body }),
        });
      } else {
        await fetch('/api/admin/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      resetQuestionForm();
      fetchQuestions();
    } catch (error) {
      console.error('Failed to save question:', error);
    }
  };

  const resetQuestionForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ role: 'PPC VA', difficulty: 'beginner', type: 'technical', skillArea: 'PPC', question: '', whyEmployersAsk: '', strongAnswerPoints: '', weakAnswerWarnings: '', sampleAnswer: '', answerFormat: 'bullet', status: 'published' });
  };

  const handleEditQuestion = (q: Question) => {
    setEditingId(q.id);
    setForm({
      role: q.role,
      difficulty: q.difficulty,
      type: q.type,
      skillArea: q.skillArea,
      question: q.question,
      whyEmployersAsk: q.whyEmployersAsk || '',
      strongAnswerPoints: q.strongAnswerPoints ? (Array.isArray(q.strongAnswerPoints) ? (q.strongAnswerPoints as string[]).join('\n') : q.strongAnswerPoints) : '',
      weakAnswerWarnings: q.weakAnswerWarnings ? (Array.isArray(q.weakAnswerWarnings) ? (q.weakAnswerWarnings as string[]).join('\n') : q.weakAnswerWarnings) : '',
      sampleAnswer: q.sampleAnswer || '',
      answerFormat: q.answerFormat || 'bullet',
      status: q.status,
    });
    setShowForm(true);
  };

  const handleArchiveQuestion = async (id: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to archive this question? It will no longer be visible to users.')) return;
    try {
      await fetch('/api/admin/questions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'archived' }),
      });
      fetchQuestions();
    } catch (error) {
      console.error('Failed to archive question:', error);
    }
  };

  // ===== GUIDES =====
  const fetchGuides = async () => {
    if (!user?.isAdmin) return;
    try {
      const res = await fetch('/api/guides');
      if (res.ok) {
        const data = await res.json();
        setGuides(data.guides || []);
      }
    } catch (error) {
      console.error('Failed to fetch guides:', error);
    }
  };

  useEffect(() => { fetchGuides(); }, [user]);

  const handleSaveGuide = async () => {
    if (!user || !guideForm.title.trim() || !guideForm.content.trim()) return;
    try {
      if (editingGuideId) {
        await fetch(`/api/guides/${editingGuideId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(guideForm),
        });
      } else {
        await fetch('/api/guides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(guideForm),
        });
      }
      resetGuideForm();
      fetchGuides();
    } catch (error) {
      console.error('Failed to save guide:', error);
    }
  };

  const resetGuideForm = () => {
    setShowGuideForm(false);
    setEditingGuideId(null);
    setGuideForm({ title: '', slug: '', level: 'beginner', role: 'General', content: '', status: 'published' });
  };

  const handleEditGuide = (g: typeof guides[0]) => {
    setEditingGuideId(g.id);
    setGuideForm({ title: g.title, slug: g.slug, level: g.level, role: g.role, content: g.content, status: g.status });
    setShowGuideForm(true);
  };

  // ===== DOWNLOADS =====
  const fetchDownloads = async () => {
    if (!user?.isAdmin) return;
    try {
      const res = await fetch('/api/downloads');
      if (res.ok) {
        const data = await res.json();
        setDownloads(data.downloads || []);
      }
    } catch (error) {
      console.error('Failed to fetch downloads:', error);
    }
  };

  useEffect(() => { fetchDownloads(); }, [user]);

  const handleCreateDownload = async () => {
    if (!user || !downloadForm.title.trim()) return;
    try {
      await fetch('/api/downloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(downloadForm),
      });
      setShowDownloadForm(false);
      setDownloadForm({ title: '', fileType: 'PDF', role: 'General', category: 'Cheat Sheets', accessTier: 'free', description: '', fileName: '' });
      fetchDownloads();
    } catch (error) {
      console.error('Failed to create download:', error);
    }
  };

  // ===== ANALYTICS =====
  const fetchAnalytics = async () => {
    if (!user?.isAdmin) return;
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  useEffect(() => { fetchAnalytics(); }, [user]);

  const handleExportContent = async (type: string) => {
    try {
      const res = await fetch(`/api/admin/questions?format=${type}`);
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `questions-export.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  if (!user?.isAdmin) {
    return (
      <HStack hAlign="center">
        <Text type="supporting">You don&apos;t have admin access.</Text>
      </HStack>
    );
  }

  const stats = (analytics?.stats as Record<string, number>) || {};
  const breakdowns = (analytics?.breakdowns as Record<string, Record<string, number>>) || {};
  const topDownloaded = (analytics?.topDownloaded as Array<{ id: string; title: string; downloadCount: number; fileType: string; category: string }>) || [];
  const recentUsers = (analytics?.recentUsers as Array<{ id: string; email: string; name: string | null; subscriptionTier: string; isAdmin: boolean; createdAt: string }>) || [];

  const getStatusVariant = (status: string): BadgeVariant => {
    if (status === 'published') return 'success';
    if (status === 'archived') return 'error';
    return 'neutral';
  };

  return (
    <VStack gap={6}>
      <VStack gap={1}>
        <Heading level={2}>Admin Panel</Heading>
        <Text type="supporting">Manage questions, guides, downloads, and analytics</Text>
      </VStack>

      <TabList value={activeTab} onChange={(v) => setActiveTab(v as AdminTab)} hasDivider>
        <Tab value="questions" label="Questions" />
        <Tab value="guides" label="Guides" />
        <Tab value="downloads" label="Downloads" />
        <Tab value="analytics" label="Analytics" />
      </TabList>

      {activeTab === 'questions' && (
        <VStack gap={4}>
          <HStack hAlign="between" vAlign="center" wrap="wrap" gap={3}>
            <HStack gap={2} wrap="wrap">
              <Selector
                label="Role"
                value={filterRole}
                onChange={setFilterRole}
                options={[{ value: 'all', label: 'All Roles' }, ...ROLES.map((r) => ({ value: r, label: r }))]}
              />
              <Selector
                label="Status"
                value={filterStatus}
                onChange={setFilterStatus}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'published', label: 'Published' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'archived', label: 'Archived' },
                ]}
              />
              <Button label="Export JSON" variant="secondary" size="sm" onClick={() => handleExportContent('json')} />
            </HStack>
            <Button
              label={showForm && !editingId ? 'Cancel' : (editingId ? 'Cancel Edit' : 'Add Question')}
              variant="primary"
              onClick={() => { resetQuestionForm(); setShowForm(!showForm); }}
            />
          </HStack>

          {showForm && (
            <Card>
              <VStack gap={4}>
                <Heading level={4}>{editingId ? 'Edit Question' : 'Create New Question'}</Heading>
                <Grid columns={{ minWidth: 200, repeat: 'fit' }} gap={3}>
                  <Selector label="Role" value={form.role} onChange={(v) => setForm(f => ({ ...f, role: v }))} options={ROLES.map((r) => ({ value: r, label: r }))} />
                  <Selector label="Difficulty" value={form.difficulty} onChange={(v) => setForm(f => ({ ...f, difficulty: v }))} options={DIFFICULTIES.map((d) => ({ value: d, label: d }))} />
                  <Selector label="Type" value={form.type} onChange={(v) => setForm(f => ({ ...f, type: v }))} options={QUESTION_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))} />
                  <Selector label="Skill Area" value={form.skillArea} onChange={(v) => setForm(f => ({ ...f, skillArea: v }))} options={SKILL_AREAS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))} />
                  <Selector
                    label="Answer Format"
                    value={form.answerFormat}
                    onChange={(v) => setForm(f => ({ ...f, answerFormat: v }))}
                    options={[
                      { value: 'STAR', label: 'STAR' },
                      { value: 'bullet', label: 'Bullet' },
                      { value: 'case_response', label: 'Case Response' },
                      { value: 'calculation', label: 'Calculation' },
                    ]}
                  />
                  <Selector
                    label="Status"
                    value={form.status}
                    onChange={(v) => setForm(f => ({ ...f, status: v }))}
                    options={[
                      { value: 'draft', label: 'Draft' },
                      { value: 'published', label: 'Published' },
                      { value: 'archived', label: 'Archived' },
                    ]}
                  />
                </Grid>
                <TextArea label="Question" value={form.question} onChange={(v) => setForm(f => ({ ...f, question: v }))} rows={2} />
                <TextInput label="Why Employers Ask This" value={form.whyEmployersAsk} onChange={(v) => setForm(f => ({ ...f, whyEmployersAsk: v }))} />
                <Grid columns={{ minWidth: 260, repeat: 'fit' }} gap={3}>
                  <TextArea label="Strong Answer Points (one per line)" value={form.strongAnswerPoints} onChange={(v) => setForm(f => ({ ...f, strongAnswerPoints: v }))} rows={3} />
                  <TextArea label="Weak Answer Warnings (one per line)" value={form.weakAnswerWarnings} onChange={(v) => setForm(f => ({ ...f, weakAnswerWarnings: v }))} rows={3} />
                </Grid>
                <TextArea label="Sample Answer" value={form.sampleAnswer} onChange={(v) => setForm(f => ({ ...f, sampleAnswer: v }))} rows={3} />
                <Button label={editingId ? 'Update Question' : 'Create Question'} variant="primary" width="100%" onClick={handleSaveQuestion} />
              </VStack>
            </Card>
          )}

          <Card padding={0}>
            <List header={<VStack paddingInline={4} paddingBlock={3}><Text type="body" weight="semibold">{`Question Database (${total} total)`}</Text></VStack>} hasDividers>
              {loading ? (
                <VStack gap={2} padding={4}>
                  {[1, 2, 3].map(i => <Skeleton key={i} height={48} index={i} />)}
                </VStack>
              ) : (
                questions.map(q => (
                  <ListItem
                    key={q.id}
                    label={q.question}
                    description={
                      <HStack gap={1.5} wrap="wrap">
                        <Badge label={q.role} variant="neutral" />
                        <Badge label={q.difficulty} variant="neutral" />
                        <Badge label={q.type} variant="neutral" />
                      </HStack>
                    }
                    endContent={
                      <HStack gap={2} vAlign="center">
                        <Badge label={q.status} variant={getStatusVariant(q.status)} />
                        <Button label="Edit" variant="ghost" size="sm" onClick={() => handleEditQuestion(q)} />
                        {q.status !== 'archived' && (
                          <Button label="Archive" variant="ghost" size="sm" onClick={() => handleArchiveQuestion(q.id)} />
                        )}
                      </HStack>
                    }
                  />
                ))
              )}
            </List>
          </Card>
        </VStack>
      )}

      {activeTab === 'guides' && (
        <VStack gap={4}>
          <HStack hAlign="end">
            <Button label={showGuideForm ? 'Cancel' : 'Add Guide'} variant="primary" onClick={() => { resetGuideForm(); setShowGuideForm(!showGuideForm); }} />
          </HStack>

          {showGuideForm && (
            <Card>
              <VStack gap={4}>
                <Heading level={4}>{editingGuideId ? 'Edit Guide' : 'Create New Guide'}</Heading>
                <Grid columns={{ minWidth: 220, repeat: 'fit' }} gap={3}>
                  <TextInput
                    label="Title"
                    value={guideForm.title}
                    onChange={(v) => setGuideForm(f => ({ ...f, title: v, slug: v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }))}
                  />
                  <TextInput label="Slug" value={guideForm.slug} onChange={(v) => setGuideForm(f => ({ ...f, slug: v }))} />
                  <Selector
                    label="Level"
                    value={guideForm.level}
                    onChange={(v) => setGuideForm(f => ({ ...f, level: v }))}
                    options={[
                      { value: 'beginner', label: 'Beginner' },
                      { value: 'intermediate', label: 'Intermediate' },
                      { value: 'advanced', label: 'Advanced' },
                    ]}
                  />
                  <Selector label="Role" value={guideForm.role} onChange={(v) => setGuideForm(f => ({ ...f, role: v }))} options={ROLES.map((r) => ({ value: r, label: r }))} />
                </Grid>
                <TextArea label="Content (Markdown)" value={guideForm.content} onChange={(v) => setGuideForm(f => ({ ...f, content: v }))} rows={10} placeholder={'# Title\n\nContent goes here...'} />
                <Button label={editingGuideId ? 'Update Guide' : 'Create Guide'} variant="primary" width="100%" onClick={handleSaveGuide} />
              </VStack>
            </Card>
          )}

          <Card padding={0}>
            <List header={<VStack paddingInline={4} paddingBlock={3}><Text type="body" weight="semibold">{`Guide Articles (${guides.length})`}</Text></VStack>} hasDividers>
              {guides.map(g => (
                <ListItem
                  key={g.id}
                  label={g.title}
                  description={
                    <HStack gap={1.5} wrap="wrap">
                      <Badge label={g.level} variant="neutral" />
                      <Badge label={g.role} variant="neutral" />
                      <Badge label={g.status} variant={getStatusVariant(g.status)} />
                    </HStack>
                  }
                  endContent={<Button label="Edit" variant="ghost" size="sm" onClick={() => handleEditGuide(g)} />}
                />
              ))}
            </List>
          </Card>
        </VStack>
      )}

      {activeTab === 'downloads' && (
        <VStack gap={4}>
          <HStack hAlign="end">
            <Button label={showDownloadForm ? 'Cancel' : 'Add Download'} variant="primary" onClick={() => setShowDownloadForm(!showDownloadForm)} />
          </HStack>

          {showDownloadForm && (
            <Card>
              <VStack gap={4}>
                <Heading level={4}>Add Downloadable Resource</Heading>
                <Grid columns={{ minWidth: 220, repeat: 'fit' }} gap={3}>
                  <TextInput label="Title" value={downloadForm.title} onChange={(v) => setDownloadForm(f => ({ ...f, title: v }))} />
                  <TextInput label="File Name" value={downloadForm.fileName} onChange={(v) => setDownloadForm(f => ({ ...f, fileName: v }))} placeholder="example.pdf" />
                  <Selector
                    label="File Type"
                    value={downloadForm.fileType}
                    onChange={(v) => setDownloadForm(f => ({ ...f, fileType: v }))}
                    options={[{ value: 'PDF', label: 'PDF' }, { value: 'DOCX', label: 'DOCX' }, { value: 'XLSX', label: 'XLSX' }]}
                  />
                  <Selector label="Role" value={downloadForm.role} onChange={(v) => setDownloadForm(f => ({ ...f, role: v }))} options={ROLES.map((r) => ({ value: r, label: r }))} />
                  <Selector
                    label="Category"
                    value={downloadForm.category}
                    onChange={(v) => setDownloadForm(f => ({ ...f, category: v }))}
                    options={[
                      { value: 'Resume Templates', label: 'Resume Templates' },
                      { value: 'Cover Letters', label: 'Cover Letters' },
                      { value: 'Cheat Sheets', label: 'Cheat Sheets' },
                      { value: 'Calculators', label: 'Calculators' },
                      { value: 'Checklists', label: 'Checklists' },
                    ]}
                  />
                </Grid>
                <TextInput label="Description" value={downloadForm.description} onChange={(v) => setDownloadForm(f => ({ ...f, description: v }))} />
                <Button label="Add Download" variant="primary" width="100%" onClick={handleCreateDownload} />
              </VStack>
            </Card>
          )}

          <Card padding={0}>
            <List header={<VStack paddingInline={4} paddingBlock={3}><Text type="body" weight="semibold">{`Downloadable Resources (${downloads.length})`}</Text></VStack>} hasDividers>
              {downloads.map(d => (
                <ListItem
                  key={d.id}
                  label={d.title}
                  description={
                    <HStack gap={1.5} wrap="wrap">
                      <Badge label={d.fileType} variant="neutral" />
                      <Badge label={d.role} variant="neutral" />
                      <Badge label={d.category} variant="neutral" />
                      <Badge label={d.accessTier} variant="neutral" />
                      <Badge label={`${d.downloadCount} downloads`} variant="neutral" />
                    </HStack>
                  }
                />
              ))}
            </List>
          </Card>
        </VStack>
      )}

      {activeTab === 'analytics' && (
        <VStack gap={4}>
          {analytics ? (
            <>
              <Grid columns={{ minWidth: 160, repeat: 'fit' }} gap={4}>
                <StatCard value={stats.totalUsers ?? 0} label="Total Users" variant="orange" />
                <StatCard value={stats.totalSessions ?? 0} label="Interview Sessions" variant="orange" />
                <StatCard value={stats.totalAttempts ?? 0} label="Practice Attempts" variant="orange" />
                <StatCard value={`${stats.avgScore ?? 0}/10`} label="Platform Avg Score" variant="orange" />
              </Grid>

              <Grid columns={{ minWidth: 160, repeat: 'fit' }} gap={4}>
                <StatCard value={stats.totalQuestions ?? 0} label="Total Questions" variant="green" />
                <StatCard value={stats.totalGuides ?? 0} label="Total Guides" variant="green" />
                <StatCard value={stats.totalDownloads ?? 0} label="Download Resources" variant="green" />
                <StatCard value={stats.sessionsLast30Days ?? 0} label="Sessions (30d)" variant="green" />
              </Grid>

              {breakdowns.usersByTier && (
                <Card>
                  <VStack gap={4}>
                    <Heading level={4}>Users by Subscription Tier</Heading>
                    <VStack gap={3}>
                      {Object.entries(breakdowns.usersByTier).map(([tier, count]) => (
                        <BreakdownBar key={tier} label={tier} count={count} total={stats.totalUsers || 1} />
                      ))}
                    </VStack>
                  </VStack>
                </Card>
              )}

              {breakdowns.questionsByRole && (
                <Card>
                  <VStack gap={4}>
                    <Heading level={4}>Questions by Role</Heading>
                    <VStack gap={3}>
                      {Object.entries(breakdowns.questionsByRole).map(([role, count]) => (
                        <BreakdownBar key={role} label={role} count={count} total={stats.totalQuestions || 1} />
                      ))}
                    </VStack>
                  </VStack>
                </Card>
              )}

              {breakdowns.questionsByDifficulty && (
                <Card>
                  <VStack gap={4}>
                    <Heading level={4}>Questions by Difficulty</Heading>
                    <VStack gap={3}>
                      {Object.entries(breakdowns.questionsByDifficulty).map(([diff, count]) => (
                        <BreakdownBar key={diff} label={diff} count={count} total={stats.totalQuestions || 1} />
                      ))}
                    </VStack>
                  </VStack>
                </Card>
              )}

              {breakdowns.questionsByStatus && (
                <Card>
                  <VStack gap={4}>
                    <Heading level={4}>Questions by Status</Heading>
                    <VStack gap={3}>
                      {Object.entries(breakdowns.questionsByStatus).map(([status, count]) => (
                        <BreakdownBar key={status} label={status} count={count} total={stats.totalQuestions || 1} />
                      ))}
                    </VStack>
                  </VStack>
                </Card>
              )}

              {topDownloaded.length > 0 && (
                <Card padding={0}>
                  <List header={<VStack paddingInline={4} paddingBlock={3}><Text type="body" weight="semibold">Top Downloaded Resources</Text></VStack>} hasDividers>
                    {topDownloaded.map((d, i) => (
                      <ListItem
                        key={d.id}
                        label={`${i + 1}. ${d.title}`}
                        endContent={
                          <HStack gap={2} vAlign="center">
                            <Badge label={d.category} variant="neutral" />
                            <Badge label={`${d.downloadCount} downloads`} variant="neutral" />
                          </HStack>
                        }
                      />
                    ))}
                  </List>
                </Card>
              )}

              {recentUsers.length > 0 && (
                <Card padding={0}>
                  <List header={<VStack paddingInline={4} paddingBlock={3}><Text type="body" weight="semibold">Recent Users</Text></VStack>} hasDividers>
                    {recentUsers.map((u) => (
                      <ListItem
                        key={u.id}
                        label={u.name || u.email}
                        description={u.email}
                        endContent={
                          <HStack gap={2} vAlign="center">
                            <Badge label={u.subscriptionTier} variant="neutral" />
                            {u.isAdmin && <Badge label="Admin" variant="orange" />}
                            <Text type="supporting" size="xsm">{new Date(u.createdAt).toLocaleDateString()}</Text>
                          </HStack>
                        }
                      />
                    ))}
                  </List>
                </Card>
              )}
            </>
          ) : (
            <VStack gap={4}>
              <Grid columns={{ minWidth: 160, repeat: 'fit' }} gap={4}>
                {[1, 2, 3, 4].map(i => <Skeleton key={i} height={80} index={i} />)}
              </Grid>
              {[1, 2, 3].map(i => <Skeleton key={i} height={160} index={i + 4} />)}
            </VStack>
          )}
        </VStack>
      )}
    </VStack>
  );
}

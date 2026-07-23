'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Question, ROLES, DIFFICULTIES, QUESTION_TYPES, SKILL_AREAS } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FieldBadge } from '@/components/ui/glass-badge';
import { FieldButton } from '@/components/ui/glass-button';
import { FieldCard, FieldCardContent, FieldCardHeader, FieldCardTitle } from '@/components/ui/glass-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type AdminTab = 'questions' | 'guides' | 'downloads' | 'analytics';

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

  const BAR_COLORS: Record<string, string> = {
    usersByTier: 'bg-teal-500',
    questionsByRole: 'bg-sky-500',
    questionsByDifficulty: 'bg-amber-500',
    questionsByStatus: 'bg-rose-500',
  };
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
          headers: { 'Content-Type': 'application/json'},
          body: JSON.stringify({ id: editingId, ...body }),
        });
      } else {
        await fetch('/api/admin/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json'},
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
        headers: { 'Content-Type': 'application/json'},
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
          headers: { 'Content-Type': 'application/json'},
          body: JSON.stringify(guideForm),
        });
      } else {
        await fetch('/api/guides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json'},
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
        headers: { 'Content-Type': 'application/json'},
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
      <div className="text-center py-12">
        <p className="text-[#737373]">You don&apos;t have admin access.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#171717] font-heading">Admin Panel</h2>
        <p className="text-[#737373] mt-1 text-sm sm:text-base">Manage questions, guides, downloads, and analytics</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AdminTab)}>
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full sm:max-w-lg">
          <TabsTrigger value="questions" className="text-xs sm:text-sm truncate">Questions</TabsTrigger>
          <TabsTrigger value="guides" className="text-xs sm:text-sm truncate">Guides</TabsTrigger>
          <TabsTrigger value="downloads" className="text-xs sm:text-sm truncate">Downloads</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm truncate">Analytics</TabsTrigger>
        </TabsList>

        {/* ===== QUESTIONS TAB ===== */}
        <TabsContent value="questions" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap gap-2 sm:gap-3 min-w-0">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-32"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <FieldButton variant="outline" size="sm" onClick={() => handleExportContent('json')} className="whitespace-nowrap">
                Export JSON
              </FieldButton>
            </div>
            <FieldButton className="bg-[#FF6B35] hover:bg-[#FF6B35] whitespace-nowrap shrink-0" onClick={() => { resetQuestionForm(); setShowForm(!showForm); }}>
              {showForm && !editingId ? 'Cancel' : (editingId ? 'Cancel Edit' : 'Add Question')}
            </FieldButton>
          </div>

          {showForm && (
            <FieldCard>
              <FieldCardHeader>
                <FieldCardTitle>{editingId ? 'Edit Question' : 'Create New Question'}</FieldCardTitle>
              </FieldCardHeader>
              <FieldCardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={form.role} onValueChange={(v) => setForm(f => ({ ...f, role: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select value={form.difficulty} onValueChange={(v) => setForm(f => ({ ...f, difficulty: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{DIFFICULTIES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{QUESTION_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Skill Area</Label>
                    <Select value={form.skillArea} onValueChange={(v) => setForm(f => ({ ...f, skillArea: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{SKILL_AREAS.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Answer Format</Label>
                    <Select value={form.answerFormat} onValueChange={(v) => setForm(f => ({ ...f, answerFormat: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STAR">STAR</SelectItem>
                        <SelectItem value="bullet">Bullet</SelectItem>
                        <SelectItem value="case_response">Case Response</SelectItem>
                        <SelectItem value="calculation">Calculation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Question</Label>
                  <Textarea value={form.question} onChange={(e) => setForm(f => ({ ...f, question: e.target.value }))} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Why Employers Ask This</Label>
                  <Input value={form.whyEmployersAsk} onChange={(e) => setForm(f => ({ ...f, whyEmployersAsk: e.target.value }))} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Strong Answer Points (one per line)</Label>
                    <Textarea value={form.strongAnswerPoints} onChange={(e) => setForm(f => ({ ...f, strongAnswerPoints: e.target.value }))} rows={3} className="text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label>Weak Answer Warnings (one per line)</Label>
                    <Textarea value={form.weakAnswerWarnings} onChange={(e) => setForm(f => ({ ...f, weakAnswerWarnings: e.target.value }))} rows={3} className="text-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Sample Answer</Label>
                  <Textarea value={form.sampleAnswer} onChange={(e) => setForm(f => ({ ...f, sampleAnswer: e.target.value }))} rows={3} />
                </div>
                <FieldButton className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]" onClick={handleSaveQuestion}>
                  {editingId ? 'Update Question' : 'Create Question'}
                </FieldButton>
              </FieldCardContent>
            </FieldCard>
          )}

          <FieldCard>
            <FieldCardHeader>
              <FieldCardTitle className="text-lg">Question Database ({total} total)</FieldCardTitle>
            </FieldCardHeader>
            <FieldCardContent>
              {loading ? (
                <div className="animate-pulse space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-12 bg-[#E5E5E0]/30 rounded" />)}</div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {questions.map(q => (
                    <div key={q.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-[#F4F3EE]/40 rounded-lg hover:bg-[#E5E5E0]/30 gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#171717] line-clamp-2">{q.question}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <FieldBadge variant="outline" className="text-xs">{q.role}</FieldBadge>
                          <FieldBadge variant="outline" className="text-xs">{q.difficulty}</FieldBadge>
                          <FieldBadge variant="outline" className="text-xs">{q.type}</FieldBadge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <FieldBadge variant={q.status === 'published' ? 'default' : (q.status === 'archived' ? 'destructive' : 'secondary')} className="text-xs whitespace-nowrap">
                          {q.status}
                        </FieldBadge>
                        <FieldButton variant="ghost" size="sm" className="whitespace-nowrap" onClick={() => handleEditQuestion(q)}>Edit</FieldButton>
                        {q.status !== 'archived' && (
                          <FieldButton variant="ghost" size="sm" className="text-red-500 whitespace-nowrap" onClick={() => handleArchiveQuestion(q.id)}>Archive</FieldButton>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </FieldCardContent>
          </FieldCard>
        </TabsContent>

        {/* ===== GUIDES TAB ===== */}
        <TabsContent value="guides" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
            <FieldButton className="bg-[#FF6B35] hover:bg-[#FF6B35] whitespace-nowrap" onClick={() => { resetGuideForm(); setShowGuideForm(!showGuideForm); }}>
              {showGuideForm ? 'Cancel' : 'Add Guide'}
            </FieldButton>
          </div>

          {showGuideForm && (
            <FieldCard>
              <FieldCardHeader>
                <FieldCardTitle>{editingGuideId ? 'Edit Guide' : 'Create New Guide'}</FieldCardTitle>
              </FieldCardHeader>
              <FieldCardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={guideForm.title} onChange={(e) => setGuideForm(f => ({ ...f, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input value={guideForm.slug} onChange={(e) => setGuideForm(f => ({ ...f, slug: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Level</Label>
                    <Select value={guideForm.level} onValueChange={(v) => setGuideForm(f => ({ ...f, level: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={guideForm.role} onValueChange={(v) => setGuideForm(f => ({ ...f, role: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Content (Markdown)</Label>
                  <Textarea value={guideForm.content} onChange={(e) => setGuideForm(f => ({ ...f, content: e.target.value }))} rows={10} placeholder="# Title\n\nContent goes here..." />
                </div>
                <FieldButton className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]" onClick={handleSaveGuide}>
                  {editingGuideId ? 'Update Guide' : 'Create Guide'}
                </FieldButton>
              </FieldCardContent>
            </FieldCard>
          )}

          <FieldCard>
            <FieldCardHeader>
              <FieldCardTitle className="text-lg">Guide Articles ({guides.length})</FieldCardTitle>
            </FieldCardHeader>
            <FieldCardContent>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {guides.map(g => (
                  <div key={g.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-[#F4F3EE]/40 rounded-lg hover:bg-[#E5E5E0]/30 gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#171717]">{g.title}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <FieldBadge variant="outline" className="text-xs">{g.level}</FieldBadge>
                        <FieldBadge variant="outline" className="text-xs">{g.role}</FieldBadge>
                        <FieldBadge variant={g.status === 'published' ? 'default' : 'secondary'} className="text-xs">{g.status}</FieldBadge>
                      </div>
                    </div>
                    <FieldButton variant="ghost" size="sm" className="shrink-0 whitespace-nowrap" onClick={() => handleEditGuide(g)}>Edit</FieldButton>
                  </div>
                ))}
              </div>
            </FieldCardContent>
          </FieldCard>
        </TabsContent>

        {/* ===== DOWNLOADS TAB ===== */}
        <TabsContent value="downloads" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
            <FieldButton className="bg-[#FF6B35] hover:bg-[#FF6B35] whitespace-nowrap" onClick={() => setShowDownloadForm(!showDownloadForm)}>
              {showDownloadForm ? 'Cancel' : 'Add Download'}
            </FieldButton>
          </div>

          {showDownloadForm && (
            <FieldCard>
              <FieldCardHeader>
                <FieldCardTitle>Add Downloadable Resource</FieldCardTitle>
              </FieldCardHeader>
              <FieldCardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={downloadForm.title} onChange={(e) => setDownloadForm(f => ({ ...f, title: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>File Name</Label>
                    <Input value={downloadForm.fileName} onChange={(e) => setDownloadForm(f => ({ ...f, fileName: e.target.value }))} placeholder="example.pdf" />
                  </div>
                  <div className="space-y-2">
                    <Label>File Type</Label>
                    <Select value={downloadForm.fileType} onValueChange={(v) => setDownloadForm(f => ({ ...f, fileType: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PDF">PDF</SelectItem>
                        <SelectItem value="DOCX">DOCX</SelectItem>
                        <SelectItem value="XLSX">XLSX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={downloadForm.role} onValueChange={(v) => setDownloadForm(f => ({ ...f, role: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={downloadForm.category} onValueChange={(v) => setDownloadForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Resume Templates">Resume Templates</SelectItem>
                        <SelectItem value="Cover Letters">Cover Letters</SelectItem>
                        <SelectItem value="Cheat Sheets">Cheat Sheets</SelectItem>
                        <SelectItem value="Calculators">Calculators</SelectItem>
                        <SelectItem value="Checklists">Checklists</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={downloadForm.description} onChange={(e) => setDownloadForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <FieldButton className="w-full bg-[#FF6B35] hover:bg-[#FF6B35]" onClick={handleCreateDownload}>Add Download</FieldButton>
              </FieldCardContent>
            </FieldCard>
          )}

          <FieldCard>
            <FieldCardHeader>
              <FieldCardTitle className="text-lg">Downloadable Resources ({downloads.length})</FieldCardTitle>
            </FieldCardHeader>
            <FieldCardContent>
              <div className="space-y-2 max-h-96 sm:max-h-[500px] overflow-y-auto">
                {downloads.map(d => (
                  <div key={d.id} className="flex items-center justify-between p-3 bg-[#F4F3EE]/40 rounded-lg gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#171717] truncate">{d.title}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <FieldBadge variant="outline" className="text-xs">{d.fileType}</FieldBadge>
                        <FieldBadge variant="outline" className="text-xs">{d.role}</FieldBadge>
                        <FieldBadge variant="outline" className="text-xs">{d.category}</FieldBadge>
                        <FieldBadge variant="outline" className="text-xs">{d.accessTier}</FieldBadge>
                        <FieldBadge variant="outline" className="text-xs">{d.downloadCount} downloads</FieldBadge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </FieldCardContent>
          </FieldCard>
        </TabsContent>

        {/* ===== ANALYTICS TAB ===== */}
        <TabsContent value="analytics" className="space-y-4">
          {analytics ? (
            <>
              {/* Platform Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <FieldCard>
                  <FieldCardContent className="p-3 sm:p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-[#FF6B35] font-mono">{((analytics as Record<string, unknown>).stats as Record<string, unknown>)?.totalUsers as number ?? 0}</p>
                    <p className="text-xs sm:text-sm text-[#737373]">Total Users</p>
                  </FieldCardContent>
                </FieldCard>
                <FieldCard>
                  <FieldCardContent className="p-3 sm:p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-[#FF6B35] font-mono">{((analytics as Record<string, unknown>).stats as Record<string, unknown>)?.totalSessions as number ?? 0}</p>
                    <p className="text-xs sm:text-sm text-[#737373]">Interview Sessions</p>
                  </FieldCardContent>
                </FieldCard>
                <FieldCard>
                  <FieldCardContent className="p-3 sm:p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-[#FF6B35] font-mono">{((analytics as Record<string, unknown>).stats as Record<string, unknown>)?.totalAttempts as number ?? 0}</p>
                    <p className="text-xs sm:text-sm text-[#737373]">Practice Attempts</p>
                  </FieldCardContent>
                </FieldCard>
                <FieldCard>
                  <FieldCardContent className="p-3 sm:p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-[#FF6B35] font-mono">{((analytics as Record<string, unknown>).stats as Record<string, unknown>)?.avgScore as number ?? 0}/10</p>
                    <p className="text-xs sm:text-sm text-[#737373]">Platform Avg Score</p>
                  </FieldCardContent>
                </FieldCard>
              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <FieldCard>
                  <FieldCardContent className="p-3 sm:p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-green-700 font-mono">{((analytics as Record<string, unknown>).stats as Record<string, unknown>)?.totalQuestions as number ?? 0}</p>
                    <p className="text-xs sm:text-sm text-[#737373]">Total Questions</p>
                  </FieldCardContent>
                </FieldCard>
                <FieldCard>
                  <FieldCardContent className="p-3 sm:p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-green-700 font-mono">{((analytics as Record<string, unknown>).stats as Record<string, unknown>)?.totalGuides as number ?? 0}</p>
                    <p className="text-xs sm:text-sm text-[#737373]">Total Guides</p>
                  </FieldCardContent>
                </FieldCard>
                <FieldCard>
                  <FieldCardContent className="p-3 sm:p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-green-700 font-mono">{((analytics as Record<string, unknown>).stats as Record<string, unknown>)?.totalDownloads as number ?? 0}</p>
                    <p className="text-xs sm:text-sm text-[#737373]">Download Resources</p>
                  </FieldCardContent>
                </FieldCard>
                <FieldCard>
                  <FieldCardContent className="p-3 sm:p-4 text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-green-700 font-mono">{((analytics as Record<string, unknown>).stats as Record<string, unknown>)?.sessionsLast30Days as number ?? 0}</p>
                    <p className="text-xs sm:text-sm text-[#737373]">Sessions (30d)</p>
                  </FieldCardContent>
                </FieldCard>
              </div>

              {/* Users by Subscription Tier */}
              {((analytics as Record<string, unknown>).breakdowns as Record<string, Record<string, number>>)?.usersByTier && (
                <FieldCard>
                  <FieldCardHeader>
                    <FieldCardTitle className="text-lg">Users by Subscription Tier</FieldCardTitle>
                  </FieldCardHeader>
                  <FieldCardContent>
                    <div className="space-y-3">
                      {Object.entries(((analytics as Record<string, unknown>).breakdowns as Record<string, Record<string, number>>).usersByTier).map(([tier, count]) => {
                        const totalUsers = ((analytics as Record<string, unknown>).stats as Record<string, unknown>)?.totalUsers as number || 1;
                        const pct = Math.round((count / totalUsers) * 100);
                        return (
                          <div key={tier} className="flex items-center gap-2 sm:gap-3">
                            <span className="text-sm w-20 sm:w-28 truncate capitalize">{tier}</span>
                            <div className="flex-1 min-w-0 bg-[#E5E5E0]/20 rounded-md h-3 sm:h-4">
                              <div className={`${BAR_COLORS.usersByTier ?? 'bg-[#FF6B35]'} h-3 sm:h-4 rounded-md transition-all`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs sm:text-sm text-[#737373] whitespace-nowrap">{count} ({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </FieldCardContent>
                </FieldCard>
              )}

              {/* Questions by Role (from API) */}
              {((analytics as Record<string, unknown>).breakdowns as Record<string, Record<string, number>>)?.questionsByRole && (
                <FieldCard>
                  <FieldCardHeader>
                    <FieldCardTitle className="text-lg">Questions by Role</FieldCardTitle>
                  </FieldCardHeader>
                  <FieldCardContent>
                    <div className="space-y-3">
                      {Object.entries(((analytics as Record<string, unknown>).breakdowns as Record<string, Record<string, number>>).questionsByRole).map(([role, count]) => {
                        const totalQ = ((analytics as Record<string, unknown>).stats as Record<string, unknown>)?.totalQuestions as number || 1;
                        const pct = Math.round((count / totalQ) * 100);
                        return (
                          <div key={role} className="flex items-center gap-2 sm:gap-3">
                            <span className="text-sm w-20 sm:w-28 truncate">{role}</span>
                            <div className="flex-1 min-w-0 bg-[#E5E5E0]/20 rounded-md h-3 sm:h-4">
                              <div className="bg-sky-500 h-3 sm:h-4 rounded-md transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs sm:text-sm text-[#737373] whitespace-nowrap">{count} ({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </FieldCardContent>
                </FieldCard>
              )}

              {/* Questions by Difficulty (from API) */}
              {((analytics as Record<string, unknown>).breakdowns as Record<string, Record<string, number>>)?.questionsByDifficulty && (
                <FieldCard>
                  <FieldCardHeader>
                    <FieldCardTitle className="text-lg">Questions by Difficulty</FieldCardTitle>
                  </FieldCardHeader>
                  <FieldCardContent>
                    <div className="space-y-3">
                      {Object.entries(((analytics as Record<string, unknown>).breakdowns as Record<string, Record<string, number>>).questionsByDifficulty).map(([diff, count]) => {
                        const totalQ = ((analytics as Record<string, unknown>).stats as Record<string, unknown>)?.totalQuestions as number || 1;
                        const pct = Math.round((count / totalQ) * 100);
                        return (
                          <div key={diff} className="flex items-center gap-2 sm:gap-3">
                            <span className="text-sm w-20 sm:w-28 truncate capitalize">{diff}</span>
                            <div className="flex-1 min-w-0 bg-[#E5E5E0]/20 rounded-md h-3 sm:h-4">
                              <div className="bg-amber-500 h-3 sm:h-4 rounded-md transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs sm:text-sm text-[#737373] whitespace-nowrap">{count} ({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </FieldCardContent>
                </FieldCard>
              )}

              {/* Questions by Status */}
              {((analytics as Record<string, unknown>).breakdowns as Record<string, Record<string, number>>)?.questionsByStatus && (
                <FieldCard>
                  <FieldCardHeader>
                    <FieldCardTitle className="text-lg">Questions by Status</FieldCardTitle>
                  </FieldCardHeader>
                  <FieldCardContent>
                    <div className="space-y-3">
                      {Object.entries(((analytics as Record<string, unknown>).breakdowns as Record<string, Record<string, number>>).questionsByStatus).map(([status, count]) => {
                        const totalQ = ((analytics as Record<string, unknown>).stats as Record<string, unknown>)?.totalQuestions as number || 1;
                        const pct = Math.round((count / totalQ) * 100);
                        return (
                          <div key={status} className="flex items-center gap-2 sm:gap-3">
                            <span className="text-sm w-20 sm:w-28 truncate capitalize">{status}</span>
                            <div className="flex-1 min-w-0 bg-[#E5E5E0]/20 rounded-md h-3 sm:h-4">
                              <div className="bg-rose-500 h-3 sm:h-4 rounded-md transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs sm:text-sm text-[#737373] whitespace-nowrap">{count} ({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </FieldCardContent>
                </FieldCard>
              )}

              {/* Top Downloaded Resources */}
              {((analytics as Record<string, unknown>).topDownloaded as Array<{ id: string; title: string; downloadCount: number; fileType: string; category: string }>) && (
                <FieldCard>
                  <FieldCardHeader>
                    <FieldCardTitle className="text-lg">Top Downloaded Resources</FieldCardTitle>
                  </FieldCardHeader>
                  <FieldCardContent>
                    <div className="space-y-2">
                      {((analytics as Record<string, unknown>).topDownloaded as Array<{ id: string; title: string; downloadCount: number; fileType: string; category: string }>).map((d, i) => (
                        <div key={d.id} className="flex items-center justify-between gap-2 p-2 bg-[#F4F3EE]/40 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#737373]">{i + 1}.</span>
                            <span className="text-sm truncate">{d.title}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <FieldBadge variant="outline" className="text-xs">{d.category}</FieldBadge>
                            <FieldBadge variant="outline" className="whitespace-nowrap">{d.downloadCount} downloads</FieldBadge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </FieldCardContent>
                </FieldCard>
              )}

              {/* Recent Users */}
              {((analytics as Record<string, unknown>).recentUsers as Array<{ id: string; email: string; name: string | null; subscriptionTier: string; isAdmin: boolean; createdAt: string }>) && (
                <FieldCard>
                  <FieldCardHeader>
                    <FieldCardTitle className="text-lg">Recent Users</FieldCardTitle>
                  </FieldCardHeader>
                  <FieldCardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {((analytics as Record<string, unknown>).recentUsers as Array<{ id: string; email: string; name: string | null; subscriptionTier: string; isAdmin: boolean; createdAt: string }>).map(u => (
                        <div key={u.id} className="flex items-center justify-between gap-2 p-2 bg-[#F4F3EE]/40 rounded">
                          <div className="min-w-0">
                            <p className="text-sm truncate">{u.name || u.email}</p>
                            <p className="text-xs text-[#737373] truncate">{u.email}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <FieldBadge variant="outline" className="text-xs capitalize">{u.subscriptionTier}</FieldBadge>
                            {u.isAdmin && <FieldBadge className="bg-[#FF6B35]/15 text-[#FF6B35] text-xs">Admin</FieldBadge>}
                            <span className="text-xs text-[#737373] whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </FieldCardContent>
                </FieldCard>
              )}
            </>
          ) : (
            <div className="animate-pulse space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-[#E5E5E0]/30 rounded-lg" />)}
              </div>
              {[1, 2, 3].map(i => <div key={i} className="h-40 bg-[#E5E5E0]/30 rounded-lg" />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

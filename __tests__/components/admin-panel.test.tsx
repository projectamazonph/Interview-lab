import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminPanel } from '@/components/interview-lab/AdminPanel';

const mockUseAuth = vi.fn();
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(body) });
}

const adminUser = { id: 'admin1', email: 'admin@test.com', isAdmin: true, subscriptionTier: 'free' };
const regularUser = { id: 'u1', email: 'user@test.com', isAdmin: false, subscriptionTier: 'free' };

function defaultFetchMock() {
  return vi.fn((url: string) => {
    if (url.startsWith('/api/admin/questions')) return jsonResponse({ questions: [], total: 0 });
    if (url === '/api/guides') return jsonResponse({ guides: [] });
    if (url === '/api/downloads') return jsonResponse({ downloads: [] });
    if (url === '/api/admin/analytics') {
      return jsonResponse({
        stats: { totalUsers: 12, totalSessions: 34, totalAttempts: 56, avgScore: 7.2, totalQuestions: 100, totalGuides: 5, totalDownloads: 8, sessionsLast30Days: 9 },
        breakdowns: { usersByTier: { free: 12 } },
      });
    }
    return jsonResponse({});
  });
}

describe('AdminPanel — access control', () => {
  it('shows an access-denied message and does not fetch admin data for a non-admin user', async () => {
    mockUseAuth.mockReturnValue({ user: regularUser });
    const fetchMock = defaultFetchMock();
    global.fetch = fetchMock;

    render(<AdminPanel />);
    expect(screen.getByText("You don't have admin access.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows an access-denied message when there is no user at all', () => {
    mockUseAuth.mockReturnValue({ user: null });
    global.fetch = defaultFetchMock();
    render(<AdminPanel />);
    expect(screen.getByText("You don't have admin access.")).toBeInTheDocument();
  });
});

describe('AdminPanel — questions tab (admin)', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: adminUser });
  });

  it('fetches questions, guides, downloads, and analytics on mount for an admin', async () => {
    const fetchMock = defaultFetchMock();
    global.fetch = fetchMock;
    render(<AdminPanel />);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/admin/questions'));
      expect(fetchMock).toHaveBeenCalledWith('/api/guides');
      expect(fetchMock).toHaveBeenCalledWith('/api/downloads');
      expect(fetchMock).toHaveBeenCalledWith('/api/admin/analytics');
    });
  });

  it('renders fetched questions with role/difficulty/type badges', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.startsWith('/api/admin/questions')) {
        return jsonResponse({
          questions: [{ id: 'q1', question: 'What is ACoS?', role: 'PPC VA', difficulty: 'beginner', type: 'technical', status: 'published' }],
          total: 1,
        });
      }
      if (url === '/api/guides') return jsonResponse({ guides: [] });
      if (url === '/api/downloads') return jsonResponse({ downloads: [] });
      if (url === '/api/admin/analytics') return jsonResponse({ stats: {}, breakdowns: {} });
      return jsonResponse({});
    });
    global.fetch = fetchMock;

    render(<AdminPanel />);
    await waitFor(() => expect(screen.getByText('What is ACoS?')).toBeInTheDocument());
    expect(screen.getByText('Question Database (1 total)')).toBeInTheDocument();
  });

  it('re-fetches with role/status query params when filters change', async () => {
    const fetchMock = defaultFetchMock();
    global.fetch = fetchMock;
    render(<AdminPanel />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/admin/questions')));

    fetchMock.mockClear();
    fireEvent.click(screen.getByText('All Status'));
    fireEvent.click(await screen.findByText('Published'));

    await waitFor(() => {
      const called = fetchMock.mock.calls.some(([url]) => typeof url === 'string' && url.includes('status=published'));
      expect(called).toBe(true);
    });
  });

  it('creates a new question via POST and resets the form', async () => {
    const fetchMock = defaultFetchMock();
    global.fetch = fetchMock;
    render(<AdminPanel />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/admin/questions')));

    fireEvent.click(screen.getByRole('button', { name: 'Add Question' }));
    const questionField = screen.getByText('Question').nextElementSibling as HTMLElement;
    fireEvent.change(questionField, { target: { value: 'How do you calculate ACoS?' } });

    fetchMock.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Create Question' }));

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(([url, opts]) => url === '/api/admin/questions' && (opts as RequestInit)?.method === 'POST');
      expect(postCall).toBeDefined();
      const body = JSON.parse((postCall![1] as RequestInit).body as string);
      expect(body.question).toBe('How do you calculate ACoS?');
    });

    // Form resets/hides after save
    await waitFor(() => expect(screen.queryByText('Question')).not.toBeInTheDocument());
  });

  it('edits an existing question via PUT with its id', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.startsWith('/api/admin/questions')) {
        return jsonResponse({
          questions: [{ id: 'q1', question: 'Old question text', role: 'PPC VA', difficulty: 'beginner', type: 'technical', status: 'published', answerFormat: 'bullet' }],
          total: 1,
        });
      }
      if (url === '/api/guides') return jsonResponse({ guides: [] });
      if (url === '/api/downloads') return jsonResponse({ downloads: [] });
      if (url === '/api/admin/analytics') return jsonResponse({ stats: {}, breakdowns: {} });
      return jsonResponse({});
    });
    global.fetch = fetchMock;

    render(<AdminPanel />);
    await waitFor(() => expect(screen.getByText('Old question text')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const questionField = screen.getByText('Question').nextElementSibling as HTMLElement;
    expect(questionField).toHaveValue('Old question text');

    fetchMock.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Update Question' }));

    await waitFor(() => {
      const putCall = fetchMock.mock.calls.find(([url, opts]) => url === '/api/admin/questions' && (opts as RequestInit)?.method === 'PUT');
      expect(putCall).toBeDefined();
      const body = JSON.parse((putCall![1] as RequestInit).body as string);
      expect(body.id).toBe('q1');
    });
  });

  it('archives a question after confirmation, and skips the request when confirmation is declined', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.startsWith('/api/admin/questions')) {
        return jsonResponse({
          questions: [{ id: 'q1', question: 'A question', role: 'PPC VA', difficulty: 'beginner', type: 'technical', status: 'published' }],
          total: 1,
        });
      }
      if (url === '/api/guides') return jsonResponse({ guides: [] });
      if (url === '/api/downloads') return jsonResponse({ downloads: [] });
      if (url === '/api/admin/analytics') return jsonResponse({ stats: {}, breakdowns: {} });
      return jsonResponse({});
    });
    global.fetch = fetchMock;
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<AdminPanel />);
    await waitFor(() => expect(screen.getByText('A question')).toBeInTheDocument());

    fetchMock.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    expect(confirmSpy).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();

    confirmSpy.mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Archive' }));
    await waitFor(() => {
      const putCall = fetchMock.mock.calls.find(([url, opts]) => url === '/api/admin/questions' && (opts as RequestInit)?.method === 'PUT');
      expect(putCall).toBeDefined();
      const body = JSON.parse((putCall![1] as RequestInit).body as string);
      expect(body).toEqual({ id: 'q1', status: 'archived' });
    });

    confirmSpy.mockRestore();
  });
});

describe('AdminPanel — guides and downloads tabs', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: adminUser });
  });

  it('creates a guide via POST from the Guides tab', async () => {
    const fetchMock = defaultFetchMock();
    global.fetch = fetchMock;
    render(<AdminPanel />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/guides'));

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Guides' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add Guide' }));
    fireEvent.change(screen.getByText('Title').nextElementSibling as HTMLElement, { target: { value: 'PPC Basics' } });
    fireEvent.change(screen.getByText('Content (Markdown)').nextElementSibling as HTMLElement, { target: { value: '# Intro' } });

    fetchMock.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Create Guide' }));

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(([url, opts]) => url === '/api/guides' && (opts as RequestInit)?.method === 'POST');
      expect(postCall).toBeDefined();
      const body = JSON.parse((postCall![1] as RequestInit).body as string);
      expect(body.title).toBe('PPC Basics');
      expect(body.slug).toBe('ppc-basics');
    });
  });

  it('creates a download resource via POST from the Downloads tab', async () => {
    const fetchMock = defaultFetchMock();
    global.fetch = fetchMock;
    render(<AdminPanel />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/downloads'));

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Downloads' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add Download' }));
    fireEvent.change(screen.getByText('Title').nextElementSibling as HTMLElement, { target: { value: 'ACoS Cheat Sheet' } });

    fetchMock.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Add Download' }));

    await waitFor(() => {
      const postCall = fetchMock.mock.calls.find(([url, opts]) => url === '/api/downloads' && (opts as RequestInit)?.method === 'POST');
      expect(postCall).toBeDefined();
      const body = JSON.parse((postCall![1] as RequestInit).body as string);
      expect(body.title).toBe('ACoS Cheat Sheet');
    });
  });
});

describe('AdminPanel — analytics tab', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: adminUser });
  });

  it('renders platform stats from the analytics API', async () => {
    global.fetch = defaultFetchMock();
    render(<AdminPanel />);
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Analytics' }));

    await waitFor(() => expect(screen.getByText('12')).toBeInTheDocument());
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('34')).toBeInTheDocument();
  });

  it('renders a breakdown bar for each tier in usersByTier', async () => {
    global.fetch = defaultFetchMock();
    render(<AdminPanel />);
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Analytics' }));

    await waitFor(() => expect(screen.getByText('Users by Subscription Tier')).toBeInTheDocument());
    expect(screen.getByText('free', { selector: 'span.capitalize' })).toBeInTheDocument();
    expect(screen.getByText('12 (100%)')).toBeInTheDocument();
  });
});

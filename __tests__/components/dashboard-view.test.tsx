import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { DashboardView } from '@/components/interview-lab/DashboardView';

const mockUseAuth = vi.fn();
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(body) });
}

const baseStats = { totalSessions: 0, completedSessions: 0, totalAttempts: 0, avgScore: 0, latestResumeScore: null };

describe('DashboardView', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: { id: 'u1', name: 'Jane Doe' } });
  });

  it('fetches dashboard data and the question count on mount', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url === '/api/dashboard') return jsonResponse({ stats: baseStats, profile: null, recentSessions: [] });
      if (url === '/api/questions/count') return jsonResponse({ total: 264 });
      return jsonResponse({});
    });
    global.fetch = fetchMock;

    render(<DashboardView onViewChange={vi.fn()} />);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/dashboard');
      expect(fetchMock).toHaveBeenCalledWith('/api/questions/count');
    });
  });

  it('shows the empty-state prompt for a brand-new user with no activity', async () => {
    global.fetch = vi.fn((url: string) => {
      if (url === '/api/dashboard') return jsonResponse({ stats: baseStats, profile: null, recentSessions: [] });
      return jsonResponse({ total: 100 });
    });

    render(<DashboardView onViewChange={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Ready to start your prep?')).toBeInTheDocument());
  });

  it('navigates to the interview view when "Start Mock Interview" is clicked', async () => {
    global.fetch = vi.fn((url: string) => {
      if (url === '/api/dashboard') return jsonResponse({ stats: baseStats, profile: null, recentSessions: [] });
      return jsonResponse({ total: 100 });
    });
    const onViewChange = vi.fn();

    render(<DashboardView onViewChange={onViewChange} />);
    await waitFor(() => expect(screen.getByText('Ready to start your prep?')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Start Mock Interview/ }));
    expect(onViewChange).toHaveBeenCalledWith('interview');
  });

  it('hides the empty state and shows stats once the user has activity', async () => {
    global.fetch = vi.fn((url: string) => {
      if (url === '/api/dashboard') {
        return jsonResponse({
          stats: { totalSessions: 3, completedSessions: 2, totalAttempts: 15, avgScore: 7.5, latestResumeScore: 82 },
          profile: { targetRole: 'PPC VA', weakAreas: JSON.stringify(['analytics']) },
          recentSessions: [],
        });
      }
      return jsonResponse({ total: 264 });
    });

    render(<DashboardView onViewChange={vi.fn()} />);
    await waitFor(() => expect(screen.queryByText('Ready to start your prep?')).not.toBeInTheDocument());
    expect(screen.getByText('7.5')).toBeInTheDocument(); // avg score
    expect(screen.getByText('82')).toBeInTheDocument(); // resume score
    expect(screen.getByText('Preparing for PPC VA roles')).toBeInTheDocument();
  });

  it('renders the learning path progress bar and focus areas when a target role is set', async () => {
    global.fetch = vi.fn((url: string) => {
      if (url === '/api/dashboard') {
        return jsonResponse({
          stats: { totalSessions: 1, completedSessions: 1, totalAttempts: 5, avgScore: 8, latestResumeScore: null },
          profile: { targetRole: 'PPC VA', weakAreas: JSON.stringify(['keyword research', 'reporting']) },
          recentSessions: [],
        });
      }
      return jsonResponse({ total: 264 });
    });

    render(<DashboardView onViewChange={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Your Learning Path')).toBeInTheDocument());
    expect(screen.getByText('80% Ready')).toBeInTheDocument();
    expect(screen.getByText('keyword research')).toBeInTheDocument();
    expect(screen.getByText('reporting')).toBeInTheDocument();
  });

  it('renders recent sessions with a completed/active badge and score', async () => {
    global.fetch = vi.fn((url: string) => {
      if (url === '/api/dashboard') {
        return jsonResponse({
          stats: { totalSessions: 2, completedSessions: 1, totalAttempts: 5, avgScore: 6, latestResumeScore: null },
          profile: null,
          recentSessions: [
            { id: 's1', mode: 'quick_drill', startedAt: '2026-01-01', completedAt: '2026-01-01', overallScore: 8.2 },
            { id: 's2', mode: 'role_interview', startedAt: '2026-01-02', completedAt: null, overallScore: null },
          ],
        });
      }
      return jsonResponse({ total: 264 });
    });

    render(<DashboardView onViewChange={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Recent Sessions')).toBeInTheDocument());
    expect(screen.getByText('quick drill')).toBeInTheDocument();
    expect(screen.getByText('role interview')).toBeInTheDocument();
    expect(screen.getByText('8.2/10')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('does not fetch dashboard data when there is no logged-in user', () => {
    mockUseAuth.mockReturnValue({ user: null });
    const fetchMock = vi.fn(() => jsonResponse({ total: 0 }));
    global.fetch = fetchMock;

    render(<DashboardView onViewChange={vi.fn()} />);
    expect(fetchMock).not.toHaveBeenCalledWith('/api/dashboard');
  });
});

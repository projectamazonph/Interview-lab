import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockInterview } from '@/components/interview-lab/MockInterview';

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'demo@interviewlab.com', subscriptionTier: 'free', isAdmin: false },
  }),
}));

vi.mock('@/lib/use-subscription', () => ({
  useSubscription: () => ({
    usage: { interviewsThisWeek: 0 },
    currentTier: 'free',
    loading: false,
  }),
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <img alt={props.alt as string} />,
}));

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(body),
  });
}

describe('MockInterview', () => {
  beforeEach(() => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url === '/api/interview') return jsonResponse({ sessions: [] });
      return jsonResponse({});
    });
  });

  it('renders the interview setup screen with mode options', () => {
    render(<MockInterview />);
    expect(screen.getByText('Mock Interview')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Interview' })).toBeInTheDocument();
  });

  it('fetches previous sessions for the logged-in user on mount', async () => {
    render(<MockInterview />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/interview'));
  });

  it('disables Start Interview until a mode is selected', () => {
    render(<MockInterview />);
    expect(screen.getByRole('button', { name: 'Start Interview' })).toBeDisabled();
  });

  it('enables Start Interview after selecting a mode', () => {
    render(<MockInterview />);
    const modeCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(modeCheckbox);
    expect(screen.getByRole('button', { name: 'Start Interview' })).not.toBeDisabled();
  });

  it('starts an interview session and renders the first question', async () => {
    const fetchMock = vi.fn((url: string, opts?: RequestInit) => {
      if (url === '/api/interview' && opts?.method === 'POST') {
        return jsonResponse({
          session: { id: 'session-1', mode: 'quick_drill' },
          questions: [
            { id: 'q1', question: 'What is ACoS?', role: 'PPC VA', difficulty: 'beginner', type: 'technical', skillArea: 'PPC' },
          ],
        });
      }
      if (url === '/api/interview') return jsonResponse({ sessions: [] });
      return jsonResponse({});
    });
    global.fetch = fetchMock;

    render(<MockInterview />);
    const modeCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(modeCheckbox);
    fireEvent.click(screen.getByRole('button', { name: 'Start Interview' }));

    await waitFor(() => expect(screen.getByText('What is ACoS?')).toBeInTheDocument());
    expect(screen.getByPlaceholderText('Type your answer here...')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/interview', expect.objectContaining({ method: 'POST' }));
  });

  it('disables Submit Answer until an answer is typed', async () => {
    const fetchMock = vi.fn((url: string, opts?: RequestInit) => {
      if (url === '/api/interview' && opts?.method === 'POST') {
        return jsonResponse({
          session: { id: 'session-1', mode: 'quick_drill' },
          questions: [
            { id: 'q1', question: 'What is ACoS?', role: 'PPC VA', difficulty: 'beginner', type: 'technical', skillArea: 'PPC' },
          ],
        });
      }
      if (url === '/api/interview') return jsonResponse({ sessions: [] });
      return jsonResponse({});
    });
    global.fetch = fetchMock;

    render(<MockInterview />);
    const modeCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(modeCheckbox);
    fireEvent.click(screen.getByRole('button', { name: 'Start Interview' }));

    await waitFor(() => expect(screen.getByText('What is ACoS?')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Submit Answer' })).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText('Type your answer here...'), {
      target: { value: 'ACoS is Advertising Cost of Sales.' },
    });
    expect(screen.getByRole('button', { name: 'Submit Answer' })).not.toBeDisabled();
  });
});

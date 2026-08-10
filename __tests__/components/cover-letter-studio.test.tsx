import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CoverLetterStudio } from '@/components/interview-lab/CoverLetterStudio';

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'demo@interviewlab.com', name: 'Demo User', subscriptionTier: 'free', isAdmin: false },
  }),
}));

vi.mock('@/lib/use-subscription', () => ({
  useSubscription: () => ({
    usage: { coverLettersThisMonth: 0 },
    currentTier: 'free',
    loading: false,
  }),
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <img alt={props.alt as string} />,
}));

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(body) });
}

describe('CoverLetterStudio', () => {
  beforeEach(() => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url === '/api/cover-letter') return jsonResponse({ coverLetters: [] });
      return jsonResponse({});
    });
  });

  it('renders the job description form', () => {
    render(<CoverLetterStudio />);
    expect(screen.getByText('Cover Letter Studio')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Paste the job description here...')).toBeInTheDocument();
  });

  it('fetches cover letter history for the logged-in user on mount', async () => {
    render(<CoverLetterStudio />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/cover-letter'));
  });

  it('disables the generate button until a job description is entered', () => {
    render(<CoverLetterStudio />);
    expect(screen.getByRole('button', { name: 'Generate Letter' })).toBeDisabled();
  });

  it('enables the generate button once a job description is entered', () => {
    render(<CoverLetterStudio />);
    const textarea = screen.getByPlaceholderText('Paste the job description here...');
    fireEvent.change(textarea, { target: { value: 'We need an Amazon PPC VA' } });
    expect(screen.getByRole('button', { name: 'Generate Letter' })).not.toBeDisabled();
  });

  it('generates a letter, persists it, and displays the draft plus claims to verify', async () => {
    const fetchMock = vi.fn((url: string, opts?: RequestInit) => {
      if (url === '/api/ai/cover-letter') {
        return jsonResponse({
          draftLetter: 'Dear Hiring Manager, I am excited to apply...',
          claimsToVerify: ['3+ years of PPC experience'],
          customizationTips: ['Mention specific tools'],
        });
      }
      if (url === '/api/cover-letter' && opts?.method === 'POST') {
        return jsonResponse({ id: 'cl-1' });
      }
      if (url === '/api/cover-letter') {
        return jsonResponse({ coverLetters: [] });
      }
      return jsonResponse({});
    });
    global.fetch = fetchMock;

    render(<CoverLetterStudio />);
    const textarea = screen.getByPlaceholderText('Paste the job description here...');
    fireEvent.change(textarea, { target: { value: 'We need an Amazon PPC VA' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Letter' }));

    await waitFor(() => expect(screen.getByText(/Dear Hiring Manager/)).toBeInTheDocument());
    expect(screen.getByText('3+ years of PPC experience')).toBeInTheDocument();
    expect(screen.getByText('Claims to Verify Before Sending')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/ai/cover-letter', expect.objectContaining({ method: 'POST' }));

    const persistCall = fetchMock.mock.calls.find(([url, o]) => url === '/api/cover-letter' && (o as RequestInit)?.method === 'POST');
    expect(persistCall).toBeDefined();
    const body = JSON.parse((persistCall![1] as RequestInit).body as string);
    expect(body.generatedLetter).toContain('Dear Hiring Manager');
  });

  it('does not call the AI endpoint when the job description is empty', () => {
    const fetchMock = vi.fn(() => jsonResponse({ coverLetters: [] }));
    global.fetch = fetchMock;
    render(<CoverLetterStudio />);
    // Button is disabled, but guard against a direct click bypassing the UI too.
    fireEvent.click(screen.getByRole('button', { name: 'Generate Letter' }));
    expect(fetchMock).not.toHaveBeenCalledWith('/api/ai/cover-letter', expect.anything());
  });

  it('loads a previous cover letter from history', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url === '/api/cover-letter') {
        return jsonResponse({
          coverLetters: [{ id: 'cl-1', tone: 'upwork', generatedLetter: 'Previously generated letter text', jobDescription: 'Old job', truthFlags: JSON.stringify(['flag']), createdAt: '2026-01-01' }],
        });
      }
      return jsonResponse({});
    });
    global.fetch = fetchMock;

    render(<CoverLetterStudio />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/cover-letter'));

    // The button carries an explicit aria-label ("Show history"/"Hide history")
    // that overrides its visible "History (n)" text for accessible-name purposes.
    fireEvent.click(screen.getByRole('button', { name: 'Show history' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Load' }));

    expect(screen.getByText('Previously generated letter text')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResumeLab } from '@/components/interview-lab/ResumeLab';

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'demo@interviewlab.com', subscriptionTier: 'free', isAdmin: false },
  }),
}));

vi.mock('@/lib/use-subscription', () => ({
  useSubscription: () => ({
    usage: { resumeReviewsThisMonth: 0 },
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

describe('ResumeLab', () => {
  beforeEach(() => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url === '/api/resume') return jsonResponse({ resumes: [] });
      return jsonResponse({});
    });
  });

  it('renders the resume submission form', () => {
    render(<ResumeLab />);
    expect(screen.getByText('Resume Lab')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Paste your resume text here...')).toBeInTheDocument();
  });

  it('fetches resume history for the logged-in user on mount', async () => {
    render(<ResumeLab />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/resume'));
  });

  it('disables the review button until resume text is entered', () => {
    render(<ResumeLab />);
    expect(screen.getByRole('button', { name: 'Get AI Review' })).toBeDisabled();
  });

  it('enables the review button once resume text is entered', () => {
    render(<ResumeLab />);
    const textarea = screen.getByPlaceholderText('Paste your resume text here...');
    fireEvent.change(textarea, { target: { value: 'Experienced Amazon PPC VA' } });
    expect(screen.getByRole('button', { name: 'Get AI Review' })).not.toBeDisabled();
  });

  it('submits the resume, requests an AI review, and displays the score', async () => {
    const fetchMock = vi.fn((url: string, opts?: RequestInit) => {
      if (url === '/api/resume' && opts?.method === 'POST') {
        return jsonResponse({ id: 'resume-1' });
      }
      if (url === '/api/ai/resume-review') {
        return jsonResponse({ score: 82, missingKeywords: [], improvedVersion: 'Improved text', truthWarnings: [] });
      }
      if (url === '/api/resume/resume-1') {
        return jsonResponse({ id: 'resume-1' });
      }
      if (url === '/api/resume') {
        return jsonResponse({ resumes: [] });
      }
      return jsonResponse({});
    });
    global.fetch = fetchMock;

    render(<ResumeLab />);
    const textarea = screen.getByPlaceholderText('Paste your resume text here...');
    fireEvent.change(textarea, { target: { value: 'Experienced Amazon PPC VA managing campaigns' } });
    fireEvent.click(screen.getByRole('button', { name: 'Get AI Review' }));

    await waitFor(() => expect(screen.getByText('82/100')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith('/api/ai/resume-review', expect.objectContaining({ method: 'POST' }));
  });

  it('shows an error when the resume creation request fails', async () => {
    const fetchMock = vi.fn((url: string, opts?: RequestInit) => {
      if (url === '/api/resume' && opts?.method === 'POST') {
        return jsonResponse({ error: 'failed' }, false);
      }
      return jsonResponse({ resumes: [] });
    });
    global.fetch = fetchMock;

    render(<ResumeLab />);
    const textarea = screen.getByPlaceholderText('Paste your resume text here...');
    fireEvent.change(textarea, { target: { value: 'Some resume text' } });
    fireEvent.click(screen.getByRole('button', { name: 'Get AI Review' }));

    await waitFor(() =>
      expect(screen.getByText('Failed to create resume record. Please try again.')).toBeInTheDocument()
    );
  });
});

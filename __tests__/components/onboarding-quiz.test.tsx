import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingQuiz } from '@/components/interview-lab/OnboardingQuiz';

const updateProfile = vi.fn();

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'demo@interviewlab.com', subscriptionTier: 'free', isAdmin: false },
    updateProfile,
  }),
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <img alt={props.alt as string} />,
}));

describe('OnboardingQuiz', () => {
  beforeEach(() => {
    updateProfile.mockReset();
    updateProfile.mockResolvedValue(true);
  });

  it('renders the first step with a role selection prompt', () => {
    render(<OnboardingQuiz onComplete={vi.fn()} />);
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
    expect(screen.getByText('Target Role')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /PPC VA/i })).toBeInTheDocument();
  });

  it('disables Next until a role is selected on step 1', () => {
    render(<OnboardingQuiz onComplete={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('advances to step 2 after selecting a role and clicking Next', () => {
    render(<OnboardingQuiz onComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /PPC VA/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
    expect(screen.getByText('Experience Level')).toBeInTheDocument();
  });

  it('goes back to the previous step', () => {
    render(<OnboardingQuiz onComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /PPC VA/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Step 2 of 5')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
  });

  it('submits the collected profile data and calls onComplete on success', async () => {
    const onComplete = vi.fn();
    render(<OnboardingQuiz onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('checkbox', { name: /PPC VA/i }));
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Next|Complete Onboarding/ }));
    }

    fireEvent.click(screen.getByRole('button', { name: 'Complete Onboarding' }));

    await waitFor(() => expect(updateProfile).toHaveBeenCalledTimes(1));
    expect(updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ targetRole: 'PPC VA', onboardingDone: true })
    );
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
  });

  it('shows an error message and does not call onComplete when saving fails', async () => {
    updateProfile.mockResolvedValueOnce(false);
    const onComplete = vi.fn();
    render(<OnboardingQuiz onComplete={onComplete} />);

    fireEvent.click(screen.getByRole('checkbox', { name: /PPC VA/i }));
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole('button', { name: /Next|Complete Onboarding/ }));
    }
    fireEvent.click(screen.getByRole('button', { name: 'Complete Onboarding' }));

    await waitFor(() =>
      expect(screen.getByText('Failed to save your profile. Please try again.')).toBeInTheDocument()
    );
    expect(onComplete).not.toHaveBeenCalled();
  });
});

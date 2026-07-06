'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';
import { PRICING_TIERS, TierKey } from './pricing';
import { UsageInfo, SubscriptionInfo } from './types';

interface SubscriptionState {
  usage: UsageInfo | null;
  subscription: SubscriptionInfo | null;
  loading: boolean;
  error: string | null;
}

export function useSubscription() {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    usage: null,
    subscription: null,
    loading: true,
    error: null,
  });

  const fetchUsage = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/subscription/usage');
      if (res.ok) {
        const data = await res.json();
        const usage: UsageInfo = {
          interviewsThisWeek: data.usage?.interviewsThisWeek ?? 0,
          interviewsLimit: data.limits?.interviewsPerWeek ?? 1,
          resumeReviewsThisMonth: data.usage?.resumeReviewsThisMonth ?? 0,
          resumeReviewsLimit: data.limits?.resumeReviewsPerMonth ?? 1,
          coverLettersThisMonth: data.usage?.coverLettersThisMonth ?? 0,
          coverLettersLimit: data.limits?.coverLettersPerMonth ?? 1,
          practiceTestsThisMonth: data.usage?.practiceTestsThisMonth ?? 0,
          practiceTestsLimit: data.limits?.practiceTestsPerMonth ?? 2,
        };
        setState(prev => ({ ...prev, usage, loading: false }));
      }
    } catch {
      setState(prev => ({ ...prev, loading: false, error: 'Failed to fetch usage' }));
    }
  }, [user]);

  const fetchSubscription = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/subscription/status');
      if (res.ok) {
        const data = await res.json();
        const subscription: SubscriptionInfo = {
          tier: data.tier ?? user.subscriptionTier ?? 'free',
          status: data.status ?? 'active',
          currentPeriodEnd: data.currentPeriodEnd ?? null,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
        };
        setState(prev => ({ ...prev, subscription }));
      }
    } catch {
      // silently fail
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      Promise.all([fetchUsage(), fetchSubscription()]);
    } else {
      setState({ usage: null, subscription: null, loading: false, error: null });
    }
  }, [user, fetchUsage, fetchSubscription]);

  const currentTier = (user?.subscriptionTier || 'free') as TierKey;
  const tierConfig = PRICING_TIERS[currentTier] ?? PRICING_TIERS.free;

  return {
    ...state,
    currentTier,
    tierConfig,
    refetch: () => {
      setState(prev => ({ ...prev, loading: true }));
      Promise.all([fetchUsage(), fetchSubscription()]);
    },
  };
}

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/lib/auth-context';
import { PRICING_TIERS, TierKey, BillingPeriod, getTierPrice, getYearlySavings, formatPrice, CURRENCY } from '@/lib/pricing';
import { SubscriptionInfo } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Check, X, Crown, Spinner, Sparkle } from '@phosphor-icons/react';

interface PricingPageProps {
  onUpgradeSuccess?: () => void;
}

const FAQ_ITEMS = [
  {
    question: 'Can I switch plans at any time?',
    answer: 'Yes! You can upgrade or downgrade your plan at any time. When upgrading, you\'ll get immediate access to all new features. When downgrading, you\'ll retain access until the end of your current billing period.',
  },
  {
    question: 'Is there a free trial for paid plans?',
    answer: 'You can start with the Free plan to explore the platform. Paid plans give you access to more interviews, unlimited reviews, and advanced features from day one.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept GCash, all major credit cards, and debit cards. All prices are in Philippine Peso (₱) — no USD conversion fees. Payments are processed securely through Stripe.',
  },
  {
    question: 'Can I cancel my subscription?',
    answer: 'Absolutely. You can cancel your subscription at any time from your account settings. You\'ll continue to have access to your current plan until the end of your billing period.',
  },
  {
    question: 'What happens to my data if I downgrade?',
    answer: 'Your data is always safe. If you downgrade, you\'ll still have access to all your previous interview sessions, resumes, and cover letters — you just won\'t be able to create new ones beyond the lower plan\'s limits.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'We offer a 7-day money-back guarantee on all paid plans. If you\'re not satisfied, contact us within 7 days for a full refund.',
  },
];

const COMPARISON_FEATURES = [
  { name: 'Mock Interviews per Week', free: '1', starter: '5', pro: 'Unlimited' },
  { name: 'Resume Reviews per Month', free: '1', starter: 'Unlimited', pro: 'Unlimited' },
  { name: 'Cover Letters per Month', free: '1', starter: 'Unlimited', pro: 'Unlimited' },
  { name: 'Practice Tests per Month', free: '2', starter: '5', pro: 'Unlimited' },
  { name: 'Question Bank Access', free: 'Beginner', starter: 'Beginner + Intermediate', pro: 'All Levels' },
  { name: 'Download Templates', free: 'Free Tier', starter: 'Starter Tier', pro: 'All Templates' },
  { name: 'Learning Paths', free: 'Beginner', starter: 'Beginner + Intermediate', pro: 'All Paths' },
  { name: 'Export to DOCX & PDF', free: '—', starter: '✓', pro: '✓' },
  { name: 'Priority AI Feedback', free: '—', starter: '—', pro: '✓' },
  { name: 'Adaptive Follow-up Questions', free: '—', starter: '—', pro: '✓' },
  { name: 'AI Resume Coaching', free: '—', starter: '—', pro: '✓' },
  { name: 'Admin Dashboard Access', free: '—', starter: '—', pro: 'On Request' },
];

export function PricingPage({ onUpgradeSuccess }: PricingPageProps) {
  const { user, refreshProfile } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loadingTier, setLoadingTier] = useState<TierKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const currentTier = (user?.subscriptionTier || 'free') as TierKey;

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const res = await fetch('/api/subscription/status', {
        headers: { 'x-user-id': user?.id || '' },
      });
      if (res.ok) {
        const data = await res.json();
        setSubscription(data);
      }
    } catch {
      // Silently fail — subscription status is optional
    }
  };

  const handleUpgrade = async (tier: TierKey) => {
    if (tier === 'free') return;
    setLoadingTier(tier);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({ tier, billingPeriod }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          setSuccess(`Successfully upgraded to ${PRICING_TIERS[tier].name}!`);
          await refreshProfile();
          await fetchSubscriptionStatus();
          onUpgradeSuccess?.();
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || `Failed to upgrade to ${PRICING_TIERS[tier].name}. Please try again.`);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoadingTier(null);
    }
  };

  const getButtonLabel = (tier: TierKey): string => {
    if (tier === currentTier) return 'Current Plan';
    if (tier === 'free') return 'Get Started';
    if (currentTier === 'free') {
      return tier === 'starter' ? 'Upgrade to Starter' : 'Upgrade to Pro';
    }
    if (currentTier === 'starter' && tier === 'pro') return 'Upgrade to Pro';
    if (currentTier === 'pro' && tier === 'starter') return 'Downgrade';
    return 'Get Started';
  };

  const isCurrentPlan = (tier: TierKey): boolean => tier === currentTier;

  const tierKeys: TierKey[] = ['free', 'starter', 'pro'];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="text-center mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 bg-pa-blue/10 border border-pa-blue/20 rounded-full px-4 py-1.5 mb-4">
          <Crown className="h-4 w-4 text-pa-blue" />
          <span className="text-sm font-medium text-pa-blue">Simple, transparent pricing</span>
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-pa-charcoal mb-4">
          Choose Your Interview Prep Plan
        </h1>
        <p className="font-body text-lg text-pa-slate max-w-2xl mx-auto mb-6">
          From free practice to full interview mastery — pick the plan that matches your prep goals and budget.
        </p>
        <div className="flex justify-center mb-4">
          <Image
            src="/images/illustrations/pricing-tiers.png"
            alt="Pricing tiers for Amazon VA Interview Lab plans"
            width={500}
            height={180}
            className="w-full max-w-xl h-auto"
          />
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3">
          <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-pa-charcoal' : 'text-pa-muted'}`}>
            Monthly
          </span>
          <Switch
            checked={billingPeriod === 'yearly'}
            onCheckedChange={(checked) => setBillingPeriod(checked ? 'yearly' : 'monthly')}
            aria-label="Toggle yearly billing"
          />
          <span className={`text-sm font-medium ${billingPeriod === 'yearly' ? 'text-pa-charcoal' : 'text-pa-muted'}`}>
            Yearly
          </span>
          {billingPeriod === 'yearly' && (
            <Badge className="bg-pa-green/10 text-pa-green border-pa-green/20 ml-2 text-xs">
              Save up to 25%
            </Badge>
          )}
        </div>
      </div>

      {/* Feedback Messages */}
      {error && (
        <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-semibold underline">Dismiss</button>
        </div>
      )}
      {success && (
        <div className="max-w-2xl mx-auto mb-6 p-4 bg-pa-green/10 border border-pa-green/20 rounded-lg text-sm text-pa-green">
          {success}
          <button onClick={() => setSuccess(null)} className="ml-2 font-semibold underline">Dismiss</button>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-16 sm:mb-24">
        {tierKeys.map((tier) => {
          const config = PRICING_TIERS[tier];
          const price = getTierPrice(tier, billingPeriod);
          const savings = getYearlySavings(tier);
          const current = isCurrentPlan(tier);
          const isLoading = loadingTier === tier;
          const isPopular = tier === 'pro';

          return (
            <Card
              key={tier}
              className={`relative flex flex-col ${
                isPopular
                  ? 'ring-2 ring-pa-blue shadow-glass-glow scale-[1.02] border-pa-blue/30'
                  : 'border-glass-border/40'
              } ${current ? 'opacity-90' : ''}`}
            >
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge className="bg-pa-blue text-white px-4 py-1 text-xs font-semibold shadow-glass">
                    <Sparkle className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2 pt-6">
                <CardTitle className="font-heading text-xl font-bold text-pa-charcoal">
                  {config.name}
                </CardTitle>
                <CardDescription className="text-pa-slate text-sm">
                  {config.description}
                </CardDescription>
                {current && (
                  <Badge variant="secondary" className="mx-auto mt-2 bg-pa-blue/10 text-pa-blue text-xs">
                    Current Plan
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-heading text-4xl sm:text-5xl font-bold text-pa-charcoal">
                      {formatPrice(price)}
                    </span>
                    {price > 0 && (
                      <span className="text-pa-muted text-sm">/mo</span>
                    )}
                  </div>
                  {billingPeriod === 'yearly' && price > 0 && (
                    <p className="text-xs text-pa-muted mt-1">
                      billed yearly ({formatPrice(price * 12)}/yr)
                    </p>
                  )}
                  {billingPeriod === 'yearly' && savings > 0 && (
                    <Badge className="bg-pa-green/10 text-pa-green border-pa-green/20 mt-2 text-xs">
                      Save {formatPrice(savings)}/yr
                    </Badge>
                  )}
                  {price === 0 && (
                    <p className="text-xs text-pa-muted mt-1">Free forever</p>
                  )}
                </div>

                <ul className="space-y-3">
                  {config.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-pa-green shrink-0 mt-0.5" />
                      <span className="text-sm text-pa-slate">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-4">
                <Button
                  className={`w-full font-heading font-semibold ${
                    current
                      ? 'bg-glass-border/20 text-text-muted cursor-not-allowed hover:bg-glass-border/30'
                      : isPopular
                        ? 'bg-pa-blue hover:bg-pa-blue-dark text-white'
                        : tier === 'starter'
                          ? 'bg-pa-navy hover:bg-pa-navy/90 text-white'
                          : 'bg-pa-charcoal hover:bg-pa-charcoal/90 text-white'
                  }`}
                  disabled={current || isLoading}
                  onClick={() => handleUpgrade(tier)}
                >
                  {isLoading ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    getButtonLabel(tier)
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-6xl mx-auto mb-16 sm:mb-24">
        <div className="text-center mb-10">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-pa-charcoal mb-3">
            Compare Plans in Detail
          </h2>
          <p className="font-body text-pa-slate max-w-xl mx-auto">
            See exactly what you get with each plan so you can choose the right fit for your interview prep needs.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-glass-border/40 bg-pa-navy shadow-inner-highlight-sm">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-glass-border/40 bg-glass/40">
                <th className="text-left text-sm font-semibold text-pa-charcoal px-4 sm:px-6 py-4 w-[40%]">
                  Feature
                </th>
                <th className="text-center text-sm font-semibold text-pa-charcoal px-3 sm:px-4 py-4">
                  Free
                </th>
                <th className="text-center text-sm font-semibold text-pa-charcoal px-3 sm:px-4 py-4">
                  Starter
                </th>
                <th className="text-center text-sm font-semibold px-3 sm:px-4 py-4">
                  <span className="text-pa-blue">Pro</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_FEATURES.map((feature, i) => (
                <tr key={feature.name} className={i % 2 === 0 ? 'bg-pa-navy' : 'bg-glass/40/50'}>
                  <td className="text-sm text-pa-slate px-4 sm:px-6 py-3.5 border-t border-glass-border/40/50">
                    {feature.name}
                  </td>
                  {(['free', 'starter', 'pro'] as TierKey[]).map((tier) => (
                    <td key={tier} className="text-center px-3 sm:px-4 py-3.5 border-t border-glass-border/40/50">
                      {feature[tier] === '✓' ? (
                        <Check className="h-4 w-4 text-pa-green mx-auto" />
                      ) : feature[tier] === '—' ? (
                        <X weight="light" className="h-4 w-4 text-text-muted mx-auto" />
                      ) : (
                        <span className={`text-sm ${tier === 'pro' ? 'font-medium text-pa-charcoal' : 'text-pa-slate'}`}>
                          {feature[tier]}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto mb-16 sm:mb-24">
        <div className="text-center mb-10">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-pa-charcoal mb-3">
            Frequently Asked Questions
          </h2>
          <p className="font-body text-pa-slate">
            Got questions? We&apos;ve got answers.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left font-heading text-sm sm:text-base font-semibold text-pa-charcoal hover:text-pa-blue">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-pa-slate leading-relaxed font-body">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Bottom CTA */}
      <div className="text-center pb-8">
        <p className="font-body text-pa-slate mb-4">
          Still not sure? Start with the Free plan and upgrade anytime.
        </p>
        <Button
          onClick={() => handleUpgrade(currentTier === 'free' ? 'starter' : 'pro')}
          className="bg-pa-blue hover:bg-pa-blue-dark text-white font-heading font-semibold px-8"
          disabled={loadingTier !== null}
        >
          {loadingTier ? (
            <>
              <Spinner className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Crown className="mr-2 h-4 w-4" />
              Get Started Today
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

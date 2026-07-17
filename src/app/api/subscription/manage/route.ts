import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { PRICING_TIERS, TierKey, BillingPeriod, getTierPrice, CURRENCY } from '@/lib/pricing';
import { TIER_HIERARCHY } from '@/lib/pricing';
import { NextResponse } from 'next/server';

interface ManageGetResponse {
  tier: string;
  tierName: string;
  status: string;
  subscription: {
    id: string;
    tier: string;
    status: string;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  billing: {
    amount: number;
    currency: string;
    period: BillingPeriod;
  } | null;
  nextBillingDate: Date | null;
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await db.subscription.findUnique({
      where: { userId: user.id },
    });

    const currentTier = (user.subscriptionTier as TierKey) ?? 'free';
    const tierConfig = PRICING_TIERS[currentTier] ?? PRICING_TIERS.free;

    // Determine billing period from subscription
    let billingPeriod: BillingPeriod | null = null;
    let billingAmount = 0;

    if (subscription && currentTier !== 'free') {
      // Check if it's yearly or monthly based on priceId matching
      const tierConfigFull = PRICING_TIERS[currentTier as TierKey];
      if (subscription.stripePriceId && tierConfigFull) {
        const yearlyPriceId = tierConfigFull.yearlyPriceId as string;
        const yearlyPrice = tierConfigFull.yearlyPrice as number;
        if (subscription.stripePriceId === yearlyPriceId) {
          billingPeriod = 'yearly';
          billingAmount = yearlyPrice || tierConfigFull.price;
        } else {
          billingPeriod = 'monthly';
          billingAmount = tierConfigFull.price;
        }
      } else {
        // Default to monthly if we can't determine
        billingPeriod = 'monthly';
        billingAmount = tierConfigFull?.price ?? 0;
      }
    }

    const response: ManageGetResponse = {
      tier: currentTier,
      tierName: tierConfig.name,
      status: subscription?.status ?? 'active',
      subscription: subscription
        ? {
            id: subscription.id,
            tier: subscription.tier,
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          }
        : null,
      billing: currentTier !== 'free' && billingPeriod
        ? {
            amount: billingAmount,
            currency: CURRENCY.code.toLowerCase(),
            period: billingPeriod,
          }
        : null,
      nextBillingDate: subscription?.currentPeriodEnd ?? null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Subscription manage GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription management details' }, { status: 500 });
  }
}

interface ManagePostBody {
  action: 'cancel' | 'reactivate' | 'change';
  tier?: 'starter' | 'pro';
  billing?: BillingPeriod;
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ManagePostBody = await request.json();
    const { action, tier, billing = 'monthly' } = body;

    const subscription = await db.subscription.findUnique({
      where: { userId: user.id },
    });

    switch (action) {
      case 'cancel': {
        if (!subscription) {
          return NextResponse.json(
            { error: 'No active subscription to cancel.' },
            { status: 400 }
          );
        }

        if (subscription.status === 'canceled') {
          return NextResponse.json(
            { error: 'Subscription is already canceled.' },
            { status: 400 }
          );
        }

        // Mark subscription to cancel at period end
        await db.subscription.update({
          where: { id: subscription.id },
          data: {
            cancelAtPeriodEnd: true,
            status: 'active', // Remains active until period ends
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Subscription will be canceled at the end of the current billing period.',
          cancelAtPeriodEnd: true,
          currentPeriodEnd: subscription.currentPeriodEnd,
        });
      }

      case 'reactivate': {
        if (!subscription) {
          return NextResponse.json(
            { error: 'No subscription to reactivate.' },
            { status: 400 }
          );
        }

        if (!subscription.cancelAtPeriodEnd) {
          return NextResponse.json(
            { error: 'Subscription is not scheduled for cancellation.' },
            { status: 400 }
          );
        }

        // Remove the cancellation schedule
        await db.subscription.update({
          where: { id: subscription.id },
          data: {
            cancelAtPeriodEnd: false,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Subscription has been reactivated. It will continue renewing.',
        });
      }

      case 'change': {
        return NextResponse.json(
          { error: 'Paid plans are not currently available.' },
          { status: 503 }
        );
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be "cancel", "reactivate", or "change".' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Subscription manage POST error:', error);
    return NextResponse.json({ error: 'Failed to manage subscription' }, { status: 500 });
  }
}

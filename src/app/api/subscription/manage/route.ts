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
    const user = await verifyAuth(userId);
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
    const user = await verifyAuth(userId);
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
        if (!tier) {
          return NextResponse.json(
            { error: 'Must specify a tier to change to.' },
            { status: 400 }
          );
        }

        if (!['starter', 'pro'].includes(tier)) {
          return NextResponse.json(
            { error: 'Invalid tier. Must be "starter" or "pro".' },
            { status: 400 }
          );
        }

        const currentTierLevel = TIER_HIERARCHY[user.subscriptionTier as TierKey] ?? 0;
        const newTierLevel = TIER_HIERARCHY[tier as TierKey] ?? 0;

        if (currentTierLevel === newTierLevel) {
          return NextResponse.json(
            { error: `You are already on the ${tier} plan.` },
            { status: 400 }
          );
        }

        const price = getTierPrice(tier as TierKey, billing);
        const amountInCents = Math.round(price * 100);

        const now = new Date();
        const periodEnd = new Date(now);
        if (billing === 'monthly') {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        } else {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        }

        // Update subscription
        if (subscription) {
          await db.subscription.update({
            where: { id: subscription.id },
            data: {
              tier,
              status: 'active',
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              cancelAtPeriodEnd: false,
              stripePriceId: billing === 'monthly'
                ? PRICING_TIERS[tier as TierKey].priceId
                : PRICING_TIERS[tier as TierKey].yearlyPriceId ?? PRICING_TIERS[tier as TierKey].priceId,
            },
          });
        } else {
          await db.subscription.create({
            data: {
              userId: user.id,
              tier,
              status: 'active',
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              cancelAtPeriodEnd: false,
              stripePriceId: billing === 'monthly'
                ? PRICING_TIERS[tier as TierKey].priceId
                : PRICING_TIERS[tier as TierKey].yearlyPriceId ?? PRICING_TIERS[tier as TierKey].priceId,
            },
          });
        }

        // Update user tier
        await db.user.update({
          where: { id: user.id },
          data: { subscriptionTier: tier },
        });

        // Create payment record for plan change
        const actionType = newTierLevel > currentTierLevel ? 'Upgrade' : 'Downgrade';
        await db.payment.create({
          data: {
            userId: user.id,
            amount: amountInCents,
            currency: CURRENCY.code.toLowerCase(),
            status: newTierLevel > currentTierLevel ? 'completed' : 'pending',
            description: `${actionType} to ${PRICING_TIERS[tier as TierKey].name} plan - ${billing === 'yearly' ? 'Yearly' : 'Monthly'}`,
            metadata: JSON.stringify({
              tier,
              billing,
              action: actionType.toLowerCase(),
              directUpgrade: true,
            }),
          },
        });

        return NextResponse.json({
          success: true,
          message: `Successfully changed to ${PRICING_TIERS[tier as TierKey].name} plan!`,
          tier,
          billing,
        });
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

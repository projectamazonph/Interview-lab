import { db } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { PRICING_TIERS, TierKey, BillingPeriod, getTierPrice, CURRENCY } from '@/lib/pricing';
import { TIER_HIERARCHY } from '@/lib/pricing';
import { NextResponse } from 'next/server';

interface CheckoutRequestBody {
  tier: 'starter' | 'pro';
  billing: BillingPeriod;
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CheckoutRequestBody = await request.json();
    const { tier, billing = 'monthly' } = body;

    // Validate requested tier
    if (!['starter', 'pro'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be "starter" or "pro".' },
        { status: 400 }
      );
    }

    // Validate billing period
    if (!['monthly', 'yearly'].includes(billing)) {
      return NextResponse.json(
        { error: 'Invalid billing period. Must be "monthly" or "yearly".' },
        { status: 400 }
      );
    }

    // Check if user is already on this tier or higher
    const currentTierLevel = TIER_HIERARCHY[user.subscriptionTier as TierKey] ?? 0;
    const requestedTierLevel = TIER_HIERARCHY[tier as TierKey] ?? 0;

    if (currentTierLevel >= requestedTierLevel) {
      return NextResponse.json(
        { error: `You are already on the ${PRICING_TIERS[user.subscriptionTier as TierKey]?.name ?? user.subscriptionTier} plan or higher.` },
        { status: 400 }
      );
    }

    const price = getTierPrice(tier as TierKey, billing);
    // For PHP, amounts are stored in centavos (1 PHP = 100 centavos)
    const amountInCents = Math.round(price * 100);

    // Calculate period dates
    const now = new Date();
    const periodEnd = new Date(now);
    if (billing === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    // --- Direct upgrade (no Stripe) ---
    // This section would be replaced with Stripe checkout session creation
    // when Stripe keys are configured. For now, we perform the upgrade directly.

    // 1. Create or update Subscription record
    const existingSubscription = await db.subscription.findUnique({
      where: { userId: user.id },
    });

    let subscription;
    if (existingSubscription) {
      subscription = await db.subscription.update({
        where: { id: existingSubscription.id },
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
      subscription = await db.subscription.create({
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

    // 2. Update User.subscriptionTier
    await db.user.update({
      where: { id: user.id },
      data: { subscriptionTier: tier },
    });

    // 3. Create Payment record
    const payment = await db.payment.create({
      data: {
        userId: user.id,
        amount: amountInCents,
        currency: CURRENCY.code.toLowerCase(),
        status: 'completed',
        description: `${PRICING_TIERS[tier as TierKey].name} plan - ${billing === 'yearly' ? 'Yearly' : 'Monthly'} subscription`,
        metadata: JSON.stringify({
          tier,
          billing,
          subscriptionId: subscription.id,
          directUpgrade: true,
        }),
      },
    });

    // When Stripe is configured, this would return:
    // return NextResponse.json({ url: stripeCheckoutSession.url });
    // For now, return a success response with the subscription details
    return NextResponse.json({
      success: true,
      url: `/dashboard?upgraded=${tier}`, // Frontend redirect URL
      subscription: {
        id: subscription.id,
        tier: subscription.tier,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        description: payment.description,
      },
      message: `Successfully upgraded to ${PRICING_TIERS[tier as TierKey].name} plan!`,
    });
  } catch (error) {
    console.error('Subscription checkout POST error:', error);
    return NextResponse.json({ error: 'Failed to process checkout' }, { status: 500 });
  }
}

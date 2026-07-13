"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { PRICING_TIERS, TierKey } from "@/lib/pricing";
import { UsageInfo } from "@/lib/types";
import { GlassBadge } from "@/components/ui/glass-badge";
import { Crown, TrendUp } from "@phosphor-icons/react";

interface SubscriptionBannerProps {
  tier: string;
  onUpgrade: () => void;
}

function UsageBar({ label, current, limit }: { label: string; current: number; limit: number }) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && current >= limit;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-text-muted truncate">{label}</span>
        <span className={`text-[11px] font-heading font-medium ${
          isAtLimit ? "text-accent-amber" : isNearLimit ? "text-accent-amber" : "text-text-muted"
        }`}>
          {isUnlimited ? "\u221E" : `${current}/${limit}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1 bg-glass-border/30 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-premium ${
              isAtLimit ? "bg-accent-amber" : isNearLimit ? "bg-accent-amber/70" : "bg-accent-violet"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      {isUnlimited && (
        <div className="h-1 bg-accent-emerald/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-accent-emerald/40 w-full" />
        </div>
      )}
    </div>
  );
}

export function SubscriptionBanner({ tier, onUpgrade }: SubscriptionBannerProps) {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageInfo | null>(null);

  const tierKey = (tier || "free") as TierKey;
  const config = PRICING_TIERS[tierKey];
  const isFreeOrStarter = tierKey === "free" || tierKey === "starter";

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await fetch("/api/subscription/usage", {
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          setUsage(data);
        }
      } catch { /* silently fail */ }
    };
    if (user) fetchUsage();
  }, [user]);

  const tierVariant = () => {
    switch (tierKey) {
      case "pro": return "accent" as const;
      case "starter": return "success" as const;
      default: return "muted" as const;
    }
  };

  return (
    <div className="p-3 border-t border-glass-border/30">
      <div className="rounded-2xl bg-glass-border/20 border border-glass-border/30 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Crown className={`h-4 w-4 shrink-0 ${
              tierKey === "pro" ? "text-accent-indigo" : tierKey === "starter" ? "text-accent-emerald" : "text-text-muted"
            }`} />
            <span className="text-sm font-heading font-semibold text-text-primary truncate">
              {config.name}
            </span>
          </div>
          <GlassBadge variant={tierVariant()} className="text-[9px]">
            {config.name}
          </GlassBadge>
        </div>

        {usage && (
          <div className="space-y-2">
            <UsageBar label="Interviews" current={usage.interviewsThisWeek} limit={usage.interviewsLimit} />
            <UsageBar label="Resume Reviews" current={usage.resumeReviewsThisMonth} limit={usage.resumeReviewsLimit} />
            <UsageBar label="Cover Letters" current={usage.coverLettersThisMonth} limit={usage.coverLettersLimit} />
            <UsageBar label="Practice Tests" current={usage.practiceTestsThisMonth} limit={usage.practiceTestsLimit} />
          </div>
        )}

        {isFreeOrStarter && (
          <button
            onClick={onUpgrade}
            className="w-full flex items-center justify-center gap-1.5 text-[11px] font-heading font-semibold text-accent-indigo hover:text-accent-violet transition-all duration-400 ease-premium py-1.5 rounded-xl hover:bg-glass-border/20"
          >
            <TrendUp className="h-3.5 w-3.5" weight="light" />
            Upgrade Plan
          </button>
        )}
      </div>
    </div>
  );
}

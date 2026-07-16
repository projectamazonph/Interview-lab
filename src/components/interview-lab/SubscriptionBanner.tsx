"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { PRICING_TIERS, TierKey } from "@/lib/pricing";
import { UsageInfo } from "@/lib/types";
import { FieldBadge } from "@/components/ui/glass-badge";
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
        <span className="text-[11px] text-[#737373] truncate">{label}</span>
        <span className={`text-[11px] font-heading font-medium ${
          isAtLimit ? "text-[#B45309]" : "text-[#737373]"
        }`}>
          {isUnlimited ? "\u221E" : `${current}/${limit}`}
        </span>
      </div>
      {!isUnlimited ? (
        <div className="h-1 bg-[#E5E5E0] rounded-sm overflow-hidden">
          <div
            className={`h-full rounded-sm transition-all duration-300 ${
              isAtLimit ? "bg-[#B45309]" : "bg-[#FF6B35]"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      ) : (
        <div className="h-1 bg-[#D1FAE5] rounded-sm overflow-hidden">
          <div className="h-full rounded-sm bg-[#0E7C3A]/40 w-full" />
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
      default: return "default" as const;
    }
  };

  return (
    <div className="p-3 border-t border-[#E5E5E0]">
      <div className="rounded-lg bg-[#F4F3EE] border border-[#E5E5E0] p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Crown className={`h-4 w-4 shrink-0 ${
              tierKey === "pro" ? "text-[#FF6B35]" : tierKey === "starter" ? "text-[#0E7C3A]" : "text-[#737373]"
            }`} />
            <span className="text-sm font-heading font-semibold text-[#171717] truncate">
              {config.name}
            </span>
          </div>
          <FieldBadge variant={tierVariant()} className="text-[9px]">
            {config.name}
          </FieldBadge>
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
            className="w-full flex items-center justify-center gap-1.5 text-[11px] font-heading font-semibold text-[#FF6B35] hover:text-[#E55A2B] transition-colors duration-200 py-1.5 rounded-md hover:bg-[#E5E5E0]/50"
          >
            <TrendUp className="h-3.5 w-3.5" />
            Upgrade Plan
          </button>
        )}
      </div>
    </div>
  );
}

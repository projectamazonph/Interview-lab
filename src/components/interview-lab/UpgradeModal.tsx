"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldButton } from "@/components/ui/glass-button";
import { FieldBadge } from "@/components/ui/glass-badge";
import { useAuth } from "@/lib/auth-context";
import { PRICING_TIERS, TierKey, formatPrice } from "@/lib/pricing";
import { Check, ArrowRight, Lock, Spinner } from "@phosphor-icons/react";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature: string;
  reason: string;
  currentTier: string;
  recommendedTier: string;
}

export function UpgradeModal({
  open,
  onClose,
  feature,
  reason,
  currentTier,
  recommendedTier,
}: UpgradeModalProps) {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const recTier = recommendedTier as TierKey;
  const curTier = currentTier as TierKey;
  const recConfig = PRICING_TIERS[recTier];
  const curConfig = PRICING_TIERS[curTier];

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",

        },
        body: JSON.stringify({ tier: recTier, billingPeriod: "monthly" }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          setSuccess(true);
          await refreshProfile();
          setTimeout(() => {
            onClose();
            setSuccess(false);
          }, 1500);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || "Failed to process upgrade. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md bg-white border border-[#E5E5E0] shadow-lg rounded-lg p-0 overflow-hidden">
        <div className="p-8">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-md bg-[#B45309]/15 flex items-center justify-center">
                <Lock weight="light" className="h-5 w-5 text-[#B45309]" />
              </div>
              <DialogTitle className="font-heading text-xl font-bold text-[#171717]">
                {feature} Limit Reached
              </DialogTitle>
            </div>
            <DialogDescription className="text-[#737373] text-sm">
              {reason}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-lg bg-[#E5E5E0]/20 border border-[#E5E5E0]/30 p-5">
              <p className="text-[10px] font-heading font-medium text-[#737373] uppercase tracking-wider mb-1.5">
                Current
              </p>
              <p className="font-heading text-base font-bold text-[#171717] mb-1">
                {curConfig.name}
              </p>
              <p className="font-heading text-xl font-bold text-[#171717]">
                {formatPrice(curConfig.price)}
                {curConfig.price > 0 && (
                  <span className="text-xs text-[#737373] font-normal">/mo</span>
                )}
              </p>
            </div>
            <div className="rounded-lg bg-[#FF6B35]/10 border-2 border-[#FF6B35]/30 p-5 relative">
              <FieldBadge variant="accent" className="absolute -top-2.5 left-3 text-[9px]">
                Recommended
              </FieldBadge>
              <p className="text-[10px] font-heading font-medium text-[#FF6B35] uppercase tracking-wider mb-1.5">
                Upgrade to
              </p>
              <p className="font-heading text-base font-bold text-[#171717] mb-1">
                {recConfig.name}
              </p>
              <p className="font-heading text-xl font-bold text-[#171717]">
                {formatPrice(recConfig.price)}
                <span className="text-xs text-[#737373] font-normal">/mo</span>
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-[#0E7C3A]/5 border border-[#0E7C3A]/15 p-5 mb-4">
            <p className="text-[10px] font-heading font-medium text-[#0E7C3A] uppercase tracking-wider mb-3">
              What you&apos;ll unlock
            </p>
            <ul className="space-y-2">
              {recConfig.features
                .filter((f: string) => !(curConfig.features as readonly string[]).includes(f))
                .slice(0, 5)
                .map((feature: string) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check weight="light" className="h-4 w-4 text-[#0E7C3A] shrink-0 mt-0.5" />
                    <span className="text-sm text-[#404040]">{feature}</span>
                  </li>
                ))}
            </ul>
          </div>

          {error && (
            <div className="p-3 bg-[#B91C1C]/10 border border-[#B91C1C]/20 rounded-md text-sm text-[#B91C1C] mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-[#0E7C3A]/10 border border-[#0E7C3A]/20 rounded-md text-sm text-[#0E7C3A] font-heading font-medium mb-4">
              Upgrade successful! Refreshing...
            </div>
          )}
        </div>

        <DialogFooter className="px-8 pb-8 gap-3">
          <FieldButton variant="secondary" onClick={onClose} disabled={loading} className="flex-1">
            Maybe Later
          </FieldButton>
          <FieldButton onClick={handleUpgrade} disabled={loading || success} className="flex-1">
            {loading ? (
              <><Spinner className="w-4 h-4 animate-spin" /> Processing...</>
            ) : success ? (
              "Upgraded!"
            ) : (
              <>Upgrade Now <ArrowRight weight="light" className="w-4 h-4" /></>
            )}
          </FieldButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

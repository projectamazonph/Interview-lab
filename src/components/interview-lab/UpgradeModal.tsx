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
import { GlassButton } from "@/components/ui/glass-button";
import { GlassBadge } from "@/components/ui/glass-badge";
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
          "x-user-id": user?.id || "",
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
      <DialogContent className="sm:max-w-md bg-pa-deep/95 backdrop-blur-3xl border border-glass-border/60 shadow-glass-glow-lg rounded-[2rem] p-0 overflow-hidden">
        <div className="p-8">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-accent-amber/15 flex items-center justify-center">
                <Lock weight="light" className="h-5 w-5 text-accent-amber" />
              </div>
              <DialogTitle className="font-heading text-xl font-bold text-text-primary">
                {feature} Limit Reached
              </DialogTitle>
            </div>
            <DialogDescription className="text-text-muted text-sm">
              {reason}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-2xl bg-glass-border/20 border border-glass-border/30 p-5">
              <p className="text-[10px] font-heading font-medium text-text-muted uppercase tracking-wider mb-1.5">
                Current
              </p>
              <p className="font-heading text-base font-bold text-text-primary mb-1">
                {curConfig.name}
              </p>
              <p className="font-heading text-xl font-bold text-text-primary">
                {formatPrice(curConfig.price)}
                {curConfig.price > 0 && (
                  <span className="text-xs text-text-muted font-normal">/mo</span>
                )}
              </p>
            </div>
            <div className="rounded-2xl bg-accent-violet/10 border-2 border-accent-violet/30 p-5 relative">
              <GlassBadge variant="accent" className="absolute -top-2.5 left-3 text-[9px]">
                Recommended
              </GlassBadge>
              <p className="text-[10px] font-heading font-medium text-accent-indigo uppercase tracking-wider mb-1.5">
                Upgrade to
              </p>
              <p className="font-heading text-base font-bold text-text-primary mb-1">
                {recConfig.name}
              </p>
              <p className="font-heading text-xl font-bold text-text-primary">
                {formatPrice(recConfig.price)}
                <span className="text-xs text-text-muted font-normal">/mo</span>
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-accent-emerald/5 border border-accent-emerald/15 p-5 mb-4">
            <p className="text-[10px] font-heading font-medium text-accent-emerald uppercase tracking-wider mb-3">
              What you&apos;ll unlock
            </p>
            <ul className="space-y-2">
              {recConfig.features
                .filter((f: string) => !(curConfig.features as readonly string[]).includes(f))
                .slice(0, 5)
                .map((feature: string) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check weight="light" className="h-4 w-4 text-accent-emerald shrink-0 mt-0.5" />
                    <span className="text-sm text-text-secondary">{feature}</span>
                  </li>
                ))}
            </ul>
          </div>

          {error && (
            <div className="p-3 bg-accent-rose/10 border border-accent-rose/20 rounded-xl text-sm text-accent-rose mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-accent-emerald/10 border border-accent-emerald/20 rounded-xl text-sm text-accent-emerald font-heading font-medium mb-4">
              Upgrade successful! Refreshing...
            </div>
          )}
        </div>

        <DialogFooter className="px-8 pb-8 gap-3">
          <GlassButton variant="secondary" onClick={onClose} disabled={loading} className="flex-1">
            Maybe Later
          </GlassButton>
          <GlassButton onClick={handleUpgrade} disabled={loading || success} className="flex-1">
            {loading ? (
              <><Spinner className="w-4 h-4 animate-spin" /> Processing...</>
            ) : success ? (
              "Upgraded!"
            ) : (
              <>Upgrade Now <ArrowRight weight="light" className="w-4 h-4" /></>
            )}
          </GlassButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

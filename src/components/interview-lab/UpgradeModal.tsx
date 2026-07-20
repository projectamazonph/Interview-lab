'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  feature: string;
  reason: string;
  currentTier: string;
  recommendedTier: string;
}

export function UpgradeModal({
  open,
  onClose,
  onUpgrade,
  feature,
  reason,
  currentTier,
  recommendedTier,
}: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Upgrade Required</DialogTitle>
          <DialogDescription>
            The <span className="font-medium text-ink-900">{feature}</span> feature
            requires a {recommendedTier} plan. You are currently on the {currentTier} plan.
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm text-ink-500">{reason}</p>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={onUpgrade ?? onClose}>
            Upgrade to {recommendedTier}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UpgradeModal;

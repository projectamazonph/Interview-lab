'use client';

import React from 'react';

export interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature: string;
  reason: string;
  currentTier: string;
  recommendedTier: string;
}

export function UpgradeModal({ open, onClose, feature, reason, currentTier, recommendedTier }: UpgradeModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-lg w-full max-w-sm mx-4 p-4 space-y-3">
        <h3 className="text-base font-semibold text-[#171717]">Upgrade Required</h3>
        <p className="text-sm text-[#404040] break-words">{reason}</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-3 py-2 rounded-md border border-[#E5E5E0] text-sm font-medium text-[#171717]">Close</button>
          <button onClick={onClose} className="flex-1 px-3 py-2 rounded-md bg-[#FF6B35] text-white text-sm font-medium">Upgrade to {recommendedTier}</button>
        </div>
      </div>
    </div>
  );
}

export default UpgradeModal;

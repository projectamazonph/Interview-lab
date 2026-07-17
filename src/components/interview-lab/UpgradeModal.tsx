// Interview Lab is free — no upgrade modal needed.
// This stub is kept so existing imports continue to compile.

export function UpgradeModal({ open }: {
  open: boolean;
  reason: string;
  recommendedTier: string;
  currentTier: string;
  feature: string;
  onClose: () => void;
}) {
  if (!open) return null;
  return null;
}

/**
 * Entitlement model for Interview Lab.
 *
 * The product is free: every feature is available to every user. The original
 * code expressed this with check*Access() functions that *looked* like tier
 * gating (they accepted tier/usage args) but always returned allowed:true.
 * That implicit contract was dishonest (LSP) — a caller could not tell whether
 * gating was real or a no-op.
 *
 * This module makes the contract explicit: an `EntitlementService` describes
 * what a tier can do. `FreeEntitlement` is the concrete (current) tier. If a
 * paid tier is ever introduced, add a class implementing `EntitlementService`
 * and swap the exported `entitlement` singleton — no caller changes required.
 */

export type Tier = 'free';

export type Feature =
  | 'interview'
  | 'resume'
  | 'coverLetter'
  | 'practiceTest'
  | 'questionBank'
  | 'download'
  | 'guide';

export interface Usage {
  interviewsThisWeek: number;
  resumeReviewsThisMonth: number;
  coverLettersThisMonth: number;
  practiceTestsThisMonth: number;
}

export interface Limits {
  /** Maximum allowed uses per period, or null when unlimited. */
  interviewsPerWeek: number | null;
  resumeReviewsPerMonth: number | null;
  coverLettersPerMonth: number | null;
  practiceTestsPerMonth: number | null;
}

export interface AccessResult {
  allowed: boolean;
  reason?: string;
  remaining?: number | null;
}

export interface EntitlementService {
  readonly tier: Tier;
  /** Whether the named feature is available on this tier. */
  canAccess(feature: Feature): boolean;
  /** Whether usage is still within limits for a metered feature. */
  checkUsage(feature: Feature, usage: Usage): AccessResult;
  readonly limits: Limits;
}

export class FreeEntitlement implements EntitlementService {
  readonly tier: Tier = 'free';
  readonly limits: Limits = {
    interviewsPerWeek: null,
    resumeReviewsPerMonth: null,
    coverLettersPerMonth: null,
    practiceTestsPerMonth: null,
  };

  canAccess(_feature: Feature): boolean {
    return true;
  }

  checkUsage(_feature: Feature, _usage: Usage): AccessResult {
    return { allowed: true, remaining: null };
  }
}

/** The active entitlement for the running app. Swap here to introduce tiers. */
export const entitlement: EntitlementService = new FreeEntitlement();

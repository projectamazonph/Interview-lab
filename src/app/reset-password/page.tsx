"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FieldCard } from "@/components/ui/glass-card";
import { FieldButton } from "@/components/ui/glass-button";
import { FieldInput } from "@/components/ui/glass-input";
import { Lightning, LockSimple, ArrowUpRight, Eye, EyeSlash, ArrowLeft } from "@phosphor-icons/react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is missing its token. Request a new one.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/"), 2500);
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center px-4 py-12 relative">
      <Link
        href="/"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 text-sm text-[#737373] hover:text-[#171717] transition-colors rounded-md px-3 py-2 bg-white border border-[#E5E5E0]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Back</span>
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-12 h-12 rounded-lg bg-[#FFE5D9] flex items-center justify-center mx-auto mb-4">
            <Lightning className="w-6 h-6 text-[#FF6B35]" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-[#171717]">Reset your password</h1>
          <p className="text-[#737373] text-sm mt-1">Choose a new password for your account</p>
        </div>

        <FieldCard variant="bordered" className="p-7 animate-slide-up">
          {success ? (
            <p className="text-sm text-ink-700 text-center">
              Password reset successful. Redirecting you to sign in...
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <FieldInput
                  icon={<LockSimple className="w-4 h-4" />}
                  type={showPassword ? "text" : "password"}
                  placeholder="New password (min. 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#404040] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeSlash className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <FieldInput
                icon={<LockSimple className="w-4 h-4" />}
                type={showPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />

              {error && (
                <p className="text-sm text-[#B91C1C] animate-fade-in">{error}</p>
              )}

              <FieldButton type="submit" className="w-full" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
                {!loading && <ArrowUpRight className="w-4 h-4" />}
              </FieldButton>
            </form>
          )}
        </FieldCard>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

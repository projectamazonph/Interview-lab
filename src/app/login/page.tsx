"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FieldCard } from "@/components/ui/glass-card";
import { FieldButton } from "@/components/ui/glass-button";
import { FieldInput } from "@/components/ui/glass-input";
import { Lightning, EnvelopeSimple, LockSimple, ArrowUpRight, Eye, EyeSlash, ArrowLeft } from "@phosphor-icons/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("interviewlab_user", JSON.stringify(data));
        router.push("/");
      } else {
        setError("Invalid email or password");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center px-4 py-12 relative">
      {/* Back button */}
      <Link
        href="/"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 text-sm text-[#737373] hover:text-[#171717] transition-colors rounded-md px-3 py-2 bg-white border border-[#E5E5E0]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Back</span>
      </Link>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-12 h-12 rounded-lg bg-[#FFE5D9] flex items-center justify-center mx-auto mb-4">
            <Lightning className="w-6 h-6 text-[#FF6B35]" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-[#171717]">Welcome back</h1>
          <p className="text-[#737373] text-sm mt-1">Sign in to your Interview Lab account</p>
        </div>

        {/* Login Card */}
        <FieldCard variant="bordered" className="p-7 animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldInput
              icon={<EnvelopeSimple className="w-4 h-4" />}
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <div className="relative">
              <FieldInput
                icon={<LockSimple className="w-4 h-4" />}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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

            {error && (
              <p className="text-sm text-[#B91C1C] animate-fade-in">{error}</p>
            )}

            <FieldButton type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ArrowUpRight className="w-4 h-4" />}
            </FieldButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#737373] text-sm">
              Do not have an account?{" "}
              <Link href="/register" className="text-[#FF6B35] hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </FieldCard>
      </div>
    </div>
  );
}

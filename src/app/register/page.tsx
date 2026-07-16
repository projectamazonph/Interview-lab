"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FieldCard } from "@/components/ui/glass-card";
import { FieldButton } from "@/components/ui/glass-button";
import { FieldInput } from "@/components/ui/glass-input";
import { Lightning, EnvelopeSimple, LockSimple, User, ArrowUpRight, Eye, EyeSlash, ArrowLeft } from "@phosphor-icons/react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const honeypotRef = useRef<HTMLInputElement>(null);
  const formStartRef = useRef<number>(Date.now());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    const honeypotValue = honeypotRef.current?.value || "";
    const elapsed = Date.now() - formStartRef.current;
    if (honeypotValue || elapsed < 3000) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("interviewlab_user", JSON.stringify(data));
        router.push("/");
      } else {
        setError("Email already registered or registration failed");
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
          <h1 className="font-heading text-2xl font-bold text-[#171717]">Create account</h1>
          <p className="text-[#737373] text-sm mt-1">Start your interview prep journey</p>
        </div>

        {/* Register Card */}
        <FieldCard variant="bordered" className="p-7 animate-slide-up">
          <input
            ref={honeypotRef}
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="absolute opacity-0 pointer-events-none h-0 w-0"
            aria-hidden="true"
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldInput
              icon={<User className="w-4 h-4" />}
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
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
                placeholder="Password (min. 8 characters)"
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

            {error && (
              <p className="text-sm text-[#B91C1C] animate-fade-in">{error}</p>
            )}

            <FieldButton type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
              {!loading && <ArrowUpRight className="w-4 h-4" />}
            </FieldButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#737373] text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-[#FF6B35] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </FieldCard>
      </div>
    </div>
  );
}

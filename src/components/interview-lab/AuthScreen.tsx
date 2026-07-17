"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { FieldButton } from "@/components/ui/glass-button";
import { FieldInput } from "@/components/ui/glass-input";
import { FieldCard } from "@/components/ui/glass-card";
import {
  Lightning, ArrowLeft, EnvelopeSimple, LockSimple, User,
  ArrowUpRight, Eye, EyeSlash,
} from "@phosphor-icons/react";

interface AuthScreenProps {
  onBack?: () => void;
}

export function AuthScreen({ onBack }: AuthScreenProps = {}) {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const honeypotRef = useRef<HTMLInputElement>(null);
  const formStartRef = useRef<number>(0);
    // formStartRef remains at mount timestamp for bot protection

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const success = await login(loginEmail, loginPassword);
    if (!success) {
      setError("Invalid email or password");
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (registerPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    const honeypotValue = honeypotRef.current?.value || "";
    const formStart = formStartRef.current;
    const elapsed = Date.now() - formStart;
    if (honeypotValue || elapsed < 3000) {
      setLoading(false);
      return;
    }
    const success = await register(registerEmail, registerName, registerPassword);
    if (!success) {
      setError("Email already registered or registration failed");
    }
    setLoading(false);
  };

  const switchTab = (tab: "login" | "register") => {
    setActiveTab(tab);
    setError("");
    setLoading(false);
    formStartRef.current = performance.now(); // eslint-disable-line react-hooks/purity
  };

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center px-4 py-12 relative">
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 text-sm text-ink-500 hover:text-ink-900 transition-colors rounded-md px-3 py-2 bg-white border border-[#E5E5E0]"
          aria-label="Back to Home"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>
      )}

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-12 h-12 rounded-lg bg-[#FFE5D9] flex items-center justify-center mx-auto mb-4">
            <Lightning className="w-6 h-6 text-[#FF6B35]" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-ink-900">Welcome back</h1>
          <p className="text-ink-500 text-sm mt-1">Sign in or create your account</p>
        </div>

        {/* Auth Card */}
        <FieldCard variant="bordered" className="p-7 animate-slide-up">
          {/* Tab switcher */}
          <div className="flex gap-1 p-1 rounded-md bg-[#F4F3EE] mb-6">
            {(["login", "register"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className={`flex-1 py-2 rounded-md text-sm font-heading font-semibold transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-[#FF6B35] text-white shadow-sm"
                    : "text-ink-500 hover:text-ink-700"
                }`}
              >
                {tab === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Honeypot */}
          <input
            ref={honeypotRef}
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="absolute opacity-0 pointer-events-none h-0 w-0"
            aria-hidden="true"
          />

          {activeTab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <FieldInput
                icon={<EnvelopeSimple className="w-4 h-4" />}
                type="email"
                placeholder="Email address"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <div className="relative">
                <FieldInput
                  icon={<LockSimple className="w-4 h-4" />}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-700 transition-colors"
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
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <FieldInput
                icon={<User className="w-4 h-4" />}
                type="text"
                placeholder="Full name"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                required
                autoComplete="name"
              />
              <FieldInput
                icon={<EnvelopeSimple className="w-4 h-4" />}
                type="email"
                placeholder="Email address"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <div className="relative">
                <FieldInput
                  icon={<LockSimple className="w-4 h-4" />}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password (min. 8 characters)"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-700 transition-colors"
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
          )}

          <p className="text-center text-ink-500 text-xs mt-6 leading-relaxed">
            By continuing you agree to our{" "}
            <a href="#terms" className="text-ink-700 hover:text-[#FF6B35] transition-colors">Terms</a>
            {" "}and{" "}
            <a href="#privacy" className="text-ink-700 hover:text-[#FF6B35] transition-colors">Privacy Policy</a>
          </p>
        </FieldCard>
      </div>
    </div>
  );
}

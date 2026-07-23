"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { lightIcon } from "@/lib/astryx-icon";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Card } from "@astryxdesign/core/Card";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Text, Heading } from "@astryxdesign/core/Text";
import { ToggleButtonGroup, ToggleButton } from "@astryxdesign/core/ToggleButton";
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
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");

  const honeypotRef = useRef<HTMLInputElement>(null);
  const formStartRef = useRef<number>(0);
    // formStartRef remains at mount timestamp for bot protection

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(loginEmail, loginPassword);
    if (result === 'PASSWORD_RESET_REQUIRED') {
      setError("Your account needs a password reset. Use \"Forgot password?\" below.");
    } else if (!result) {
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
    setForgotPasswordMode(false);
    setLoading(false);
    formStartRef.current = performance.now();
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setForgotMessage("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      setForgotMessage(data.message || "If an account exists for that email, a password reset link has been sent.");
    } catch {
      setForgotMessage("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 16px", position: "relative" }}>
      {onBack && (
        <div style={{ position: "fixed", top: 24, left: 24, zIndex: 50 }}>
          <Button label="Back" icon={<ArrowLeft weight="light" />} variant="secondary" size="sm" onClick={onBack} />
        </div>
      )}

      <div style={{ width: "100%", maxWidth: 400 }}>
        <VStack gap={4} style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--color-accent-muted)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
            <Lightning size={24} weight="light" color="var(--color-accent)" />
          </div>
          <Heading level={2}>Welcome back</Heading>
          <Text type="supporting">Sign in or create your account</Text>
        </VStack>

        <Card>
          <VStack gap={5}>
            <ToggleButtonGroup
              type="single"
              label="Sign in or create account"
              value={activeTab}
              onChange={(value) => switchTab(value as "login" | "register")}
            >
              <ToggleButton value="login" label="Sign In" style={{ flex: 1 }} />
              <ToggleButton value="register" label="Create Account" style={{ flex: 1 }} />
            </ToggleButtonGroup>

            <input
              ref={honeypotRef}
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              style={{ position: "absolute", opacity: 0, pointerEvents: "none", height: 0, width: 0 }}
              aria-hidden="true"
            />

            {activeTab === "login" && forgotPasswordMode ? (
              <form onSubmit={handleForgotPassword}>
                <VStack gap={4}>
                  <Text type="supporting">Enter your email and we&apos;ll send you a password reset link.</Text>
                  <TextInput
                    label="Email address"
                    isLabelHidden
                    type="email"
                    placeholder="Email address"
                    startIcon={lightIcon(EnvelopeSimple)}
                    value={forgotEmail}
                    onChange={setForgotEmail}
                    isRequired
                    htmlName="email"
                  />
                  {forgotMessage && <Text type="body">{forgotMessage}</Text>}
                  <Button type="submit" variant="primary" label={loading ? "Sending..." : "Send Reset Link"} isLoading={loading} width="100%" />
                  <Button label="Back to sign in" variant="ghost" width="100%" onClick={() => { setForgotPasswordMode(false); setForgotMessage(""); }} />
                </VStack>
              </form>
            ) : activeTab === "login" ? (
              <form onSubmit={handleLogin}>
                <VStack gap={4}>
                  <TextInput
                    label="Email address"
                    isLabelHidden
                    type="email"
                    placeholder="Email address"
                    startIcon={lightIcon(EnvelopeSimple)}
                    value={loginEmail}
                    onChange={setLoginEmail}
                    isRequired
                    htmlName="email"
                  />
                  <div style={{ position: "relative" }}>
                    <TextInput
                      label="Password"
                      isLabelHidden
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      startIcon={lightIcon(LockSimple)}
                      value={loginPassword}
                      onChange={setLoginPassword}
                      isRequired
                      htmlName="current-password"
                    />
                    <div style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)" }}>
                      <IconButton
                        label={showPassword ? "Hide password" : "Show password"}
                        icon={showPassword ? <EyeSlash weight="light" /> : <Eye weight="light" />}
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                      />
                    </div>
                  </div>

                  <Button label="Forgot password?" variant="ghost" size="sm" onClick={() => { setForgotPasswordMode(true); setError(""); }} />

                  {error && <Text type="body" color="accent">{error}</Text>}

                  <Button type="submit" variant="primary" label={loading ? "Signing in..." : "Sign In"} icon={!loading ? <ArrowUpRight weight="light" /> : undefined} isLoading={loading} width="100%" />
                </VStack>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <VStack gap={4}>
                  <TextInput
                    label="Full name"
                    isLabelHidden
                    type="text"
                    placeholder="Full name"
                    startIcon={lightIcon(User)}
                    value={registerName}
                    onChange={setRegisterName}
                    isRequired
                    htmlName="name"
                  />
                  <TextInput
                    label="Email address"
                    isLabelHidden
                    type="email"
                    placeholder="Email address"
                    startIcon={lightIcon(EnvelopeSimple)}
                    value={registerEmail}
                    onChange={setRegisterEmail}
                    isRequired
                    htmlName="email"
                  />
                  <div style={{ position: "relative" }}>
                    <TextInput
                      label="Password"
                      isLabelHidden
                      type={showPassword ? "text" : "password"}
                      placeholder="Password (min. 8 characters)"
                      startIcon={lightIcon(LockSimple)}
                      value={registerPassword}
                      onChange={setRegisterPassword}
                      isRequired
                      htmlName="new-password"
                    />
                    <div style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)" }}>
                      <IconButton
                        label={showPassword ? "Hide password" : "Show password"}
                        icon={showPassword ? <EyeSlash weight="light" /> : <Eye weight="light" />}
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                      />
                    </div>
                  </div>

                  {error && <Text type="body" color="accent">{error}</Text>}

                  <Button type="submit" variant="primary" label={loading ? "Creating account..." : "Create Account"} icon={!loading ? <ArrowUpRight weight="light" /> : undefined} isLoading={loading} width="100%" />
                </VStack>
              </form>
            )}

            <HStack gap={1} style={{ justifyContent: "center", flexWrap: "wrap" }}>
              <Text type="supporting" size="xsm">By continuing you agree to our</Text>
              <a href="/terms"><Text type="supporting" size="xsm" color="accent">Terms</Text></a>
              <Text type="supporting" size="xsm">and</Text>
              <a href="/privacy"><Text type="supporting" size="xsm" color="accent">Privacy Policy</Text></a>
            </HStack>
          </VStack>
        </Card>
      </div>
    </div>
  );
}

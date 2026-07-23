"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PapHeader } from "@/components/header";
import { lightIcon } from "@/lib/astryx-icon";
import { Card } from "@astryxdesign/core/Card";
import { VStack } from "@astryxdesign/core/Stack";
import { Text, Heading } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Icon } from "@astryxdesign/core/Icon";
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
    <div style={{ minHeight: "calc(100dvh - 56px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 16px" }}>
      <div style={{ position: "fixed", top: 80, left: 24, zIndex: 50 }}>
        <Button label="Back" variant="secondary" size="sm" icon={<ArrowLeft weight="light" />} onClick={() => router.push("/")} />
      </div>

      <VStack gap={8} width="100%" maxWidth={400}>
        <VStack gap={3} hAlign="center">
          <Card variant="orange" width={48} height={48} padding={0}>
            <VStack width="100%" height="100%" hAlign="center" vAlign="center">
              <Icon icon={Lightning} size="md" color="accent" />
            </VStack>
          </Card>
          <VStack gap={1}>
            <Heading level={1} justify="center">Reset your password</Heading>
            <Text type="supporting" justify="center">Choose a new password for your account</Text>
          </VStack>
        </VStack>

        <Card>
          {success ? (
            <Text type="body" justify="center">Password reset successful. Redirecting you to sign in...</Text>
          ) : (
            <form onSubmit={handleSubmit}>
              <VStack gap={4}>
                <div style={{ position: "relative" }}>
                  <TextInput
                    label="New password"
                    isLabelHidden
                    type={showPassword ? "text" : "password"}
                    placeholder="New password (min. 8 characters)"
                    startIcon={lightIcon(LockSimple)}
                    value={password}
                    onChange={setPassword}
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
                <TextInput
                  label="Confirm new password"
                  isLabelHidden
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  startIcon={lightIcon(LockSimple)}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  isRequired
                  htmlName="confirm-password"
                />

                {error && <Text type="body" color="accent">{error}</Text>}

                <Button
                  type="submit"
                  variant="primary"
                  label={loading ? "Resetting..." : "Reset Password"}
                  icon={!loading ? <ArrowUpRight weight="light" /> : undefined}
                  isLoading={loading}
                  width="100%"
                />
              </VStack>
            </form>
          )}
        </Card>
      </VStack>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <PapHeader />
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}

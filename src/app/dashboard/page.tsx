"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FieldCard } from "@/components/ui/glass-card";
import { FieldButton } from "@/components/ui/glass-button";
import { Lightning, LightningSlash, ArrowRight, ChatsCircle, FileDoc, ClipboardText } from "@phosphor-icons/react";

interface User {
  id: string;
  email: string;
  name: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const checkAuth = () => {
      try {
        const stored = localStorage.getItem("interviewlab_user");
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch {
        // ignore
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 rounded-lg bg-[#FFE5D9] flex items-center justify-center mx-auto mb-4">
            <Lightning className="w-6 h-6 text-[#FF6B35]" />
          </div>
          <p className="text-[#737373] font-heading text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="px-6 py-12 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-md bg-[#FFE5D9] flex items-center justify-center">
              <Lightning className="w-5 h-5 text-[#FF6B35]" />
            </div>
            <span className="font-heading text-sm text-[#737373]">Interview Lab</span>
          </div>

          <h1 className="text-4xl font-heading font-bold text-[#171717] mb-2">
            Welcome back, {user.name?.split(" ")[0] || "Learner"}!
          </h1>
          <p className="text-[#737373] text-lg">
            Continue your journey to becoming an Amazon VA
          </p>
        </div>

        {/* Coming Soon Card */}
        <div className="mb-8">
          <FieldCard variant="default" className="p-12 text-center">
            <div className="w-16 h-16 rounded-lg bg-[#FFE5D9] flex items-center justify-center mx-auto mb-6">
              <LightningSlash className="w-8 h-8 text-[#FF6B35]" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-[#171717] mb-4">
              Full Dashboard Coming Soon
            </h2>
            <p className="text-[#737373] text-lg mb-8 max-w-md mx-auto">
              We are building a comprehensive dashboard with progress tracking,
              interview history, and personalized recommendations.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <FieldButton className="gap-2">
                  Go to Home
                  <ArrowRight className="w-4 h-4" />
                </FieldButton>
              </Link>
            </div>
          </FieldCard>
        </div>

        {/* Feature Preview Cards */}
        <div className="grid md:grid-cols-3 gap-5">
          <FieldCard className="p-6">
            <div className="w-10 h-10 rounded-md bg-[#FFE5D9] flex items-center justify-center mb-4">
              <ChatsCircle className="w-5 h-5 text-[#FF6B35]" />
            </div>
            <h3 className="font-heading font-semibold text-[#171717] mb-2">Mock Interviews</h3>
            <p className="text-[#737373] text-sm">AI-powered practice sessions for Amazon VA roles</p>
          </FieldCard>

          <FieldCard className="p-6">
            <div className="w-10 h-10 rounded-md bg-[#D1FAE5] flex items-center justify-center mb-4">
              <FileDoc className="w-5 h-5 text-[#0E7C3A]" />
            </div>
            <h3 className="font-heading font-semibold text-[#171717] mb-2">Resume Lab</h3>
            <p className="text-[#737373] text-sm">Build and optimize your VA resume for Amazon roles</p>
          </FieldCard>

          <FieldCard className="p-6">
            <div className="w-10 h-10 rounded-md bg-[#FEF3C7] flex items-center justify-center mb-4">
              <ClipboardText className="w-5 h-5 text-[#B45309]" />
            </div>
            <h3 className="font-heading font-semibold text-[#171717] mb-2">Practice Tests</h3>
            <p className="text-[#737373] text-sm">Test your knowledge with role-specific assessments</p>
          </FieldCard>
        </div>
      </div>
    </div>
  );
}

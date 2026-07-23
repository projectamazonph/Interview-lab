"use client";

import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ActiveView } from "@/lib/types";
import { PapHeader } from "@/components/header";
import { LandingPage } from "@/components/interview-lab/LandingPage";
import { AuthScreen } from "@/components/interview-lab/AuthScreen";
import { AppLayout } from "@/components/interview-lab/AppLayout";
import { DashboardView } from "@/components/interview-lab/DashboardView";
import { OnboardingQuiz } from "@/components/interview-lab/OnboardingQuiz";
import { QuestionBank } from "@/components/interview-lab/QuestionBank";
import { MockInterview } from "@/components/interview-lab/MockInterview";
import { ResumeLab } from "@/components/interview-lab/ResumeLab";
import { CoverLetterStudio } from "@/components/interview-lab/CoverLetterStudio";
import { PracticeTests } from "@/components/interview-lab/PracticeTests";
import { DownloadCenter } from "@/components/interview-lab/DownloadCenter";
import { LearningPaths } from "@/components/interview-lab/LearningPaths";
import { AdminPanel } from "@/components/interview-lab/AdminPanel";

type PreAuthView = "landing" | "auth";

function AppContent() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [preAuthView, setPreAuthView] = useState<PreAuthView>("landing");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user && !loading) {
      setPreAuthView("landing");
      setActiveView("dashboard");
    }
  }, [user, loading]);

  if (!mounted || loading) {
    return (
      <>
        <PapHeader />
        <div className="min-h-[100dvh] flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="w-12 h-12 rounded-lg bg-accent-soft flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-ink-500 font-heading text-sm">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    if (preAuthView === "auth") {
      return (
        <>
          <PapHeader />
          <AuthScreen onBack={() => setPreAuthView("landing")} />
        </>
      );
    }
    return (
      <>
        <LandingPage
          onGetStarted={() => setPreAuthView("auth")}
          onViewPrograms={() => setPreAuthView("auth")}
        />
      </>
    );
  }

  const showOnboarding = profile && !profile.onboardingDone;
  const currentView = showOnboarding && activeView !== "onboarding" ? "onboarding" : activeView;

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardView onViewChange={setActiveView} />;
      case "onboarding":
        return <OnboardingQuiz onComplete={() => setActiveView("dashboard")} />;
      case "questions":
        return <QuestionBank />;
      case "interview":
        return <MockInterview onViewChange={setActiveView} />;
      case "resume":
        return <ResumeLab />;
      case "cover-letter":
        return <CoverLetterStudio />;
      case "assessments":
        return <PracticeTests />;
      case "downloads":
        return <DownloadCenter />;
      case "guides":
        return <LearningPaths />;
      case "admin":
        return <AdminPanel />;
      default:
        return <DashboardView onViewChange={setActiveView} />;
    }
  };

  return (
    <AppLayout activeView={currentView} onViewChange={setActiveView}>
      {renderView()}
    </AppLayout>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

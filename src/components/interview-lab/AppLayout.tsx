"use client";

import React, { useState, useEffect } from "react";
import { ActiveView } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubscriptionBanner } from "@/components/interview-lab/SubscriptionBanner";
import { ProjectAmazonPHHeader } from "@/components/shared/ProjectAmazonPHHeader";
import { motion, AnimatePresence } from "framer-motion";
import {
  SquaresFour,
  Question,
  ChatsCircle,
  FileDoc,
  EnvelopeSimple,
  ClipboardText,
  ArrowDown,
  BookOpen,
  CurrencyDollar,
  GearSix,
  SignOut,
  List,
  X,
} from "@phosphor-icons/react";

interface AppLayoutProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  children: React.ReactNode;
}

const navItems: { id: ActiveView; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: <SquaresFour className="w-5 h-5" weight="light" /> },
  { id: "questions", label: "Question Bank", icon: <Question className="w-5 h-5" weight="light" /> },
  { id: "interview", label: "Mock Interview", icon: <ChatsCircle className="w-5 h-5" weight="light" /> },
  { id: "resume", label: "Resume Lab", icon: <FileDoc className="w-5 h-5" weight="light" /> },
  { id: "cover-letter", label: "Cover Letters", icon: <EnvelopeSimple className="w-5 h-5" weight="light" /> },
  { id: "assessments", label: "Practice Tests", icon: <ClipboardText className="w-5 h-5" weight="light" /> },
  { id: "downloads", label: "Downloads", icon: <ArrowDown className="w-5 h-5" weight="light" /> },
  { id: "guides", label: "Learning Paths", icon: <BookOpen className="w-5 h-5" weight="light" /> },
  { id: "pricing", label: "Pricing", icon: <CurrencyDollar className="w-5 h-5" weight="light" /> },
];

export function AppLayout({ activeView, onViewChange, children }: AppLayoutProps) {
  const { user, logout, profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [questionCount, setQuestionCount] = useState("222+");

  useEffect(() => {
    fetch("/api/questions/count")
      .then((res) => res.json())
      .then((data) => { if (data.total) setQuestionCount(`${data.total}+`); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const renderNav = () => (
    <nav className="flex flex-col gap-0.5 p-2">
      {navItems.map((item) => {
        const isActive = activeView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => { onViewChange(item.id); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-400 ease-premium text-left ${
              isActive
                ? "bg-accent-violet/15 text-accent-indigo shadow-[0_0_12px_rgba(99,102,241,0.08)]"
                : "text-text-secondary hover:text-text-primary hover:bg-glass-border/20"
            }`}
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
            {item.id === "questions" && (
              <Badge variant="accent" className="text-[10px] ml-auto shrink-0">
                {questionCount}
              </Badge>
            )}
          </button>
        );
      })}

      {user?.isAdmin && (
        <>
          <div className="h-px bg-glass-border/40 my-2" />
          <button
            onClick={() => { onViewChange("admin"); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-400 ease-premium text-left ${
              activeView === "admin"
                ? "bg-accent-violet/15 text-accent-indigo"
                : "text-text-secondary hover:text-text-primary hover:bg-glass-border/20"
            }`}
          >
            <GearSix className="w-5 h-5 shrink-0" weight="light" />
            <span className="truncate">Admin Panel</span>
          </button>
        </>
      )}
    </nav>
  );

  return (
    <div className="flex min-h-[100dvh] bg-pa-navy">
      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-pa-deep/80 backdrop-blur-xl border-r border-glass-border/30">
        <div className="p-5">
          <ProjectAmazonPHHeader projectName="Interview Lab" />
        </div>

        <div className="flex-1 overflow-y-auto">{renderNav()}</div>

        <SubscriptionBanner
          tier={user?.subscriptionTier || "free"}
          onUpgrade={() => { onViewChange("pricing"); setSidebarOpen(false); }}
        />

        <div className="p-3 border-t border-glass-border/30">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-accent-violet/15 flex items-center justify-center shrink-0">
              <span className="text-sm font-heading font-semibold text-accent-indigo">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
              <p className="text-xs text-text-muted truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-text-muted hover:text-accent-rose hover:bg-glass-border/20 transition-all duration-400 ease-premium"
              title="Log out"
              aria-label="Log out"
            >
              <SignOut className="w-4 h-4" weight="light" />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Mobile Overlay ─── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-72 z-50 bg-pa-deep/95 backdrop-blur-2xl border-r border-glass-border/30 flex flex-col lg:hidden"
            >
              <div className="flex items-center justify-between p-5">
                <ProjectAmazonPHHeader projectName="Interview Lab" />
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-glass-border/20 transition-all duration-400 ease-premium"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" weight="light" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">{renderNav()}</div>

              <SubscriptionBanner
                tier={user?.subscriptionTier || "free"}
                onUpgrade={() => { onViewChange("pricing"); setSidebarOpen(false); }}
              />

              <div className="p-3 border-t border-glass-border/30">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-9 h-9 rounded-full bg-accent-violet/15 flex items-center justify-center shrink-0">
                    <span className="text-sm font-heading font-semibold text-accent-indigo">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{user?.name}</p>
                    <p className="text-xs text-text-muted truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 rounded-lg text-text-muted hover:text-accent-rose hover:bg-glass-border/20 transition-all duration-400 ease-premium"
                    title="Log out"
                    aria-label="Log out"
                  >
                    <SignOut className="w-4 h-4" weight="light" />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ─── Main Content ─── */}
      <main className="flex-1 min-w-0 min-h-[100dvh]">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-pa-navy/90 backdrop-blur-xl border-b border-glass-border/30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-glass-border/20 transition-all duration-400 ease-premium"
            aria-label="Open menu"
          >
            <List className="w-5 h-5 text-text-secondary" weight="light" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <ProjectAmazonPHHeader projectName="Interview Lab" className="gap-2" />
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

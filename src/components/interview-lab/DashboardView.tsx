"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { DashboardData, ActiveView } from "@/lib/types";
import { FieldCard } from "@/components/ui/glass-card";
import { FieldButton } from "@/components/ui/glass-button";
import { FieldBadge } from "@/components/ui/glass-badge";
import { Progress } from "@/components/ui/progress";
import {
  Question,
  ChatsCircle,
  Target,
  TrendUp,
  ArrowUpRight,
  Lightning,
  Clock,
} from "@phosphor-icons/react";

interface DashboardViewProps {
  onViewChange: (view: ActiveView) => void;
}

export function DashboardView({ onViewChange }: DashboardViewProps) {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionCount, setQuestionCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    fetch("/api/questions/count")
      .then((res) => res.json())
      .then((data) => setQuestionCount(data.total || 0))
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="h-8 bg-[#E5E5E0] rounded-md w-1/4 skeleton" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-[#E5E5E0] rounded-lg skeleton" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-[#E5E5E0] rounded-lg skeleton" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalSessions: 0,
    completedSessions: 0,
    totalAttempts: 0,
    avgScore: 0,
    latestResumeScore: null,
  };
  const profile = data?.profile;
  const isNewUser = stats.totalAttempts === 0 && stats.completedSessions === 0;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="animate-slide-up" style={{ animationDelay: "0ms" }}>
        <FieldBadge variant="accent" className="mb-3">
          <Lightning className="w-3 h-3 mr-1" weight="light" /> Your Dashboard
        </FieldBadge>
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-ink-900">
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
        </h2>
        <p className="text-ink-500 mt-1 text-sm">
          {profile?.targetRole
            ? `Preparing for ${profile.targetRole} roles`
            : "Your Amazon VA interview prep hub"}
        </p>
      </div>

      {/* Empty State */}
      {isNewUser && (
        <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
          <FieldCard variant="bordered" className="p-8 text-center">
            <div className="w-16 h-16 rounded-lg bg-[#FFE5D9] flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-[#FF6B35]" weight="light" />
            </div>
            <h3 className="font-heading text-xl font-bold text-ink-900 mb-2">Ready to start your prep?</h3>
            <p className="text-ink-500 text-sm mb-6 max-w-md mx-auto">
              Begin with a mock interview or browse questions to see what agencies ask.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <FieldButton onClick={() => onViewChange("interview")}>
                Start Mock Interview <ArrowUpRight className="w-4 h-4" weight="light" />
              </FieldButton>
              <FieldButton variant="secondary" onClick={() => onViewChange("questions")}>
                Browse Questions
              </FieldButton>
            </div>
          </FieldCard>
        </div>
      )}

      {/* Stats Grid */}
      <div className="animate-slide-up grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ animationDelay: "200ms" }}>
        {[
          {
            label: "Questions Practiced",
            value: stats.totalAttempts,
            sub: `/${questionCount}`,
            icon: Question,
            bg: "bg-[#FFE5D9]",
            color: "text-[#FF6B35]",
          },
          {
            label: "Mock Interviews",
            value: stats.completedSessions,
            sub: "",
            icon: ChatsCircle,
            bg: "bg-[#D1FAE5]",
            color: "text-[#0E7C3A]",
          },
          {
            label: "Avg. Score",
            value: stats.avgScore > 0 ? stats.avgScore.toFixed(1) : "—",
            sub: "/10",
            icon: TrendUp,
            bg: "bg-[#FEF3C7]",
            color: "text-[#B45309]",
          },
          {
            label: "Resume Score",
            value: stats.latestResumeScore ? stats.latestResumeScore.toFixed(0) : "—",
            sub: "/100",
            icon: Target,
            bg: "bg-[#FFE5D9]",
            color: "text-[#FF6B35]",
          },
        ].map((stat, i) => (
          <FieldCard key={i} variant="interactive" className="p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-md ${stat.bg} flex items-center justify-center shrink-0`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} weight="light" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-ink-900 font-heading">
                  {stat.value}
                  <span className="text-sm font-normal text-ink-500">{stat.sub}</span>
                </p>
                <p className="text-xs text-ink-500 truncate">{stat.label}</p>
              </div>
            </div>
          </FieldCard>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="animate-slide-up" style={{ animationDelay: "300ms" }}>
        <h3 className="font-heading font-semibold text-ink-900 text-lg mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: "Mock Interview", desc: "AI-coached interview session", icon: ChatsCircle, action: () => onViewChange("interview") },
            { title: "Browse Questions", desc: `${questionCount || 222}+ questions available`, icon: Question, action: () => onViewChange("questions") },
            { title: "Practice Test", desc: "Timed skill assessment", icon: Target, action: () => onViewChange("assessments") },
          ].map((item, i) => (
            <FieldCard key={i} variant="interactive" className="p-6 cursor-pointer" onClick={item.action}>
              <div className="w-10 h-10 rounded-md bg-[#E5E5E0] flex items-center justify-center mb-3">
                <item.icon className="w-5 h-5 text-[#FF6B35]" weight="light" />
              </div>
              <h4 className="font-heading font-semibold text-ink-900 text-sm mb-1">{item.title}</h4>
              <p className="text-ink-500 text-xs">{item.desc}</p>
            </FieldCard>
          ))}
        </div>
      </div>

      {/* Learning Path Progress */}
      {profile?.targetRole && (
        <div className="animate-slide-up" style={{ animationDelay: "400ms" }}>
          <FieldCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-semibold text-ink-900">Your Learning Path</h3>
                <p className="text-ink-500 text-sm">{profile.targetRole}</p>
              </div>
              <FieldBadge variant="accent">
                {Math.min(Math.round(stats.avgScore * 10), 100)}% Ready
              </FieldBadge>
            </div>
            <Progress
              value={Math.min(Math.round(stats.avgScore * 10), 100)}
              className="h-2 bg-[#E5E5E0]"
            />
            {profile.weakAreas && (
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-ink-500 text-xs">Focus areas:</span>
                {(() => {
                  let areas: string[] = [];
                  try {
                    const raw = profile.weakAreas;
                    areas = Array.isArray(raw) ? raw : typeof raw === "string" ? JSON.parse(raw) : [];
                  } catch { areas = []; }
                  return areas.map((area: string, i: number) => (
                    <FieldBadge key={i} variant="warning" className="text-[10px]">{area}</FieldBadge>
                  ));
                })()}
              </div>
            )}
          </FieldCard>
        </div>
      )}

      {/* Recent Sessions */}
      {(data?.recentSessions?.length || 0) > 0 && (
        <div className="animate-slide-up" style={{ animationDelay: "500ms" }}>
          <FieldCard className="p-6">
            <h3 className="font-heading font-semibold text-ink-900 mb-4">Recent Sessions</h3>
            <div className="space-y-3">
              {data?.recentSessions?.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 rounded-md bg-[#F4F3EE] border border-[#E5E5E0] gap-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Clock className="w-4 h-4 text-ink-500 shrink-0" weight="light" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 capitalize truncate">
                        {session.mode.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-ink-500">
                        {new Date(session.startedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {session.overallScore !== null && session.overallScore !== undefined && (
                      <FieldBadge
                        variant={session.overallScore >= 7 ? "success" : session.overallScore >= 5 ? "warning" : "danger"}
                      >
                        {session.overallScore.toFixed(1)}/10
                      </FieldBadge>
                    )}
                    <FieldBadge variant={session.completedAt ? "accent" : "muted"}>
                      {session.completedAt ? "Done" : "Active"}
                    </FieldBadge>
                  </div>
                </div>
              ))}
            </div>
          </FieldCard>
        </div>
      )}
    </div>
  );
}

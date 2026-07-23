"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { DashboardData, ActiveView } from "@/lib/types";
import { Card } from "@astryxdesign/core/Card";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Grid } from "@astryxdesign/core/Grid";
import { Text, Heading } from "@astryxdesign/core/Text";
import { Badge } from "@astryxdesign/core/Badge";
import { Icon } from "@astryxdesign/core/Icon";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Button } from "@astryxdesign/core/Button";
import { List, ListItem } from "@astryxdesign/core/List";
import { Skeleton } from "@astryxdesign/core/Skeleton";
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
      <VStack gap={6}>
        <Skeleton height={32} width="25%" />
        <Grid columns={{ minWidth: 200, repeat: "fit" }} gap={4}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={96} index={i} />
          ))}
        </Grid>
        <Grid columns={{ minWidth: 240, repeat: "fit" }} gap={4}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} height={128} index={i + 4} />
          ))}
        </Grid>
      </VStack>
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

  const statCards = [
    {
      label: "Questions Practiced",
      value: stats.totalAttempts,
      sub: `/${questionCount}`,
      icon: Question,
      variant: "orange" as const,
    },
    {
      label: "Mock Interviews",
      value: stats.completedSessions,
      sub: "",
      icon: ChatsCircle,
      variant: "green" as const,
    },
    {
      label: "Avg. Score",
      value: stats.avgScore > 0 ? stats.avgScore.toFixed(1) : "—",
      sub: "/10",
      icon: TrendUp,
      variant: "yellow" as const,
    },
    {
      label: "Resume Score",
      value: stats.latestResumeScore ? stats.latestResumeScore.toFixed(0) : "—",
      sub: "/100",
      icon: Target,
      variant: "orange" as const,
    },
  ];

  const quickActions = [
    { title: "Mock Interview", desc: "AI-coached interview session", icon: ChatsCircle, action: () => onViewChange("interview") },
    { title: "Browse Questions", desc: `${questionCount || 222}+ questions available`, icon: Question, action: () => onViewChange("questions") },
    { title: "Practice Test", desc: "Timed skill assessment", icon: Target, action: () => onViewChange("assessments") },
  ];

  let weakAreas: string[] = [];
  try {
    const raw = profile?.weakAreas;
    weakAreas = Array.isArray(raw) ? raw : typeof raw === "string" && raw ? JSON.parse(raw) : [];
  } catch {
    weakAreas = [];
  }
  weakAreas = weakAreas.filter((area) => typeof area === "string" && area.trim() && !/^[[{]/.test(area.trim()));

  const readyPercent = Math.min(Math.round(stats.avgScore * 10), 100);

  return (
    <VStack gap={6}>
      <VStack gap={3} hAlign="start">
        <Badge label="Your Dashboard" variant="orange" icon={<Lightning weight="light" />} />
        <Heading level={2}>
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
        </Heading>
        <Text type="supporting">
          {profile?.targetRole
            ? `Preparing for ${profile.targetRole} roles`
            : "Your Amazon VA interview prep hub"}
        </Text>
      </VStack>

      {isNewUser && (
        <Card padding={8}>
          <VStack gap={4} hAlign="center">
            <Card variant="orange" width={64} height={64} padding={0}>
              <VStack width="100%" height="100%" hAlign="center" vAlign="center">
                <Icon icon={Target} size="lg" color="accent" />
              </VStack>
            </Card>
            <VStack gap={2} maxWidth={400} hAlign="center">
              <Heading level={3} justify="center">Ready to start your prep?</Heading>
              <Text type="supporting" justify="center">
                Begin with a mock interview or browse questions to see what agencies ask.
              </Text>
            </VStack>
            <HStack gap={3} wrap="wrap" hAlign="center">
              <Button label="Start Mock Interview" variant="primary" icon={<ArrowUpRight weight="light" />} onClick={() => onViewChange("interview")} />
              <Button label="Browse Questions" variant="secondary" onClick={() => onViewChange("questions")} />
            </HStack>
          </VStack>
        </Card>
      )}

      <Grid columns={{ minWidth: 200, repeat: "fit" }} gap={4}>
        {statCards.map((stat, i) => (
          <Card key={i} padding={5}>
            <HStack gap={3} vAlign="center">
              <Card variant={stat.variant} width={40} height={40} padding={0}>
                <VStack width="100%" height="100%" hAlign="center" vAlign="center">
                  <Icon icon={stat.icon} size="sm" color="accent" />
                </VStack>
              </Card>
              <VStack gap={0}>
                <HStack gap={0.5} vAlign="center">
                  <Heading level={4}>{stat.value}</Heading>
                  {stat.sub && <Text type="supporting" size="sm">{stat.sub}</Text>}
                </HStack>
                <Text type="supporting" size="sm" maxLines={1}>{stat.label}</Text>
              </VStack>
            </HStack>
          </Card>
        ))}
      </Grid>

      <VStack gap={4}>
        <Heading level={3}>Quick Actions</Heading>
        <Grid columns={{ minWidth: 240, repeat: "fit" }} gap={4}>
          {quickActions.map((item, i) => (
            <ClickableCard key={i} label={item.title} padding={6} onClick={item.action}>
              <VStack gap={3}>
                <Card variant="muted" width={40} height={40} padding={0}>
                  <VStack width="100%" height="100%" hAlign="center" vAlign="center">
                    <Icon icon={item.icon} size="sm" color="accent" />
                  </VStack>
                </Card>
                <VStack gap={1}>
                  <Text type="body" weight="semibold">{item.title}</Text>
                  <Text type="supporting" size="sm">{item.desc}</Text>
                </VStack>
              </VStack>
            </ClickableCard>
          ))}
        </Grid>
      </VStack>

      {profile?.targetRole && (
        <Card padding={6}>
          <VStack gap={4}>
            <HStack hAlign="between" vAlign="start">
              <VStack gap={1}>
                <Heading level={4}>Your Learning Path</Heading>
                <Text type="supporting">{profile.targetRole}</Text>
              </VStack>
              <Badge label={`${readyPercent}% Ready`} variant="orange" />
            </HStack>
            <ProgressBar label="Learning path readiness" isLabelHidden value={readyPercent} />
            {weakAreas.length > 0 && (
              <HStack gap={2} wrap="wrap" vAlign="center">
                <Text type="supporting" size="sm">Focus areas:</Text>
                {weakAreas.map((area, i) => (
                  <Badge key={i} label={area} variant="warning" />
                ))}
              </HStack>
            )}
          </VStack>
        </Card>
      )}

      {(data?.recentSessions?.length || 0) > 0 && (
        <Card padding={0}>
          <List
            header={<VStack paddingInline={4} paddingBlock={3}><Text type="body" weight="semibold">Recent Sessions</Text></VStack>}
            hasDividers
          >
            {data?.recentSessions?.slice(0, 5).map((session) => (
              <ListItem
                key={session.id}
                label={session.mode.replace(/_/g, " ")}
                description={new Date(session.startedAt).toLocaleDateString()}
                startContent={<Icon icon={Clock} size="sm" color="secondary" />}
                endContent={
                  <HStack gap={2} vAlign="center">
                    {session.overallScore !== null && session.overallScore !== undefined && (
                      <Badge
                        label={`${session.overallScore.toFixed(1)}/10`}
                        variant={session.overallScore >= 7 ? "success" : session.overallScore >= 5 ? "warning" : "error"}
                      />
                    )}
                    <Badge label={session.completedAt ? "Done" : "Active"} variant={session.completedAt ? "orange" : "neutral"} />
                  </HStack>
                }
              />
            ))}
          </List>
        </Card>
      )}
    </VStack>
  );
}

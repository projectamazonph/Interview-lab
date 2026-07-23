"use client";

import React from "react";
import type { SVGProps } from "react";
import Link from "next/link";
import Image from "next/image";
import { ActiveView } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { lightIcon } from "@/lib/astryx-icon";
import { AppShell } from "@astryxdesign/core/AppShell";
import { NavIcon } from "@astryxdesign/core/NavIcon";
import {
  SideNav,
  SideNavHeading,
  SideNavItem,
  SideNavSection,
} from "@astryxdesign/core/SideNav";
import { Badge } from "@astryxdesign/core/Badge";
import { Avatar } from "@astryxdesign/core/Avatar";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Text } from "@astryxdesign/core/Text";
import {
  SquaresFour,
  Question,
  ChatsCircle,
  FileDoc,
  EnvelopeSimple,
  ClipboardText,
  ArrowDown,
  BookOpen,
  GearSix,
  SignOut,
} from "@phosphor-icons/react";

interface AppLayoutProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  children: React.ReactNode;
}

const navItems: { id: ActiveView; label: string; icon: React.ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { id: "dashboard", label: "Dashboard", icon: lightIcon(SquaresFour) },
  { id: "questions", label: "Question Bank", icon: lightIcon(Question) },
  { id: "interview", label: "Mock Interview", icon: lightIcon(ChatsCircle) },
  { id: "resume", label: "Resume Lab", icon: lightIcon(FileDoc) },
  { id: "cover-letter", label: "Cover Letters", icon: lightIcon(EnvelopeSimple) },
  { id: "assessments", label: "Practice Tests", icon: lightIcon(ClipboardText) },
  { id: "downloads", label: "Downloads", icon: lightIcon(ArrowDown) },
  { id: "guides", label: "Learning Paths", icon: lightIcon(BookOpen) },
];

export function AppLayout({ activeView, onViewChange, children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const [questionCount, setQuestionCount] = React.useState("222+");

  React.useEffect(() => {
    fetch("/api/questions/count")
      .then((res) => res.json())
      .then((data) => { if (data.total) setQuestionCount(`${data.total}+`); })
      .catch(() => {});
  }, []);

  return (
    <AppShell
      contentPadding={6}
      sideNav={
        <SideNav
          header={
            <SideNavHeading
              icon={
                <NavIcon
                  icon={
                    <div style={{ position: "relative", width: 20, height: 20 }}>
                      <Image src="/project-amazon-ph-logo.svg" alt="" fill sizes="20px" style={{ objectFit: "contain" }} />
                    </div>
                  }
                />
              }
              heading="Interview Lab"
              headingHref="/"
              subheading="by ProjectAmazonPH"
            />
          }
          footer={
            <Link href="https://projectamazonph.com" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", textDecoration: "none" }}>
              <Avatar name={user?.name || "User"} size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text type="body" weight="medium" maxLines={1}>{user?.name}</Text>
                <Text type="supporting" maxLines={1}>{user?.email}</Text>
              </div>
              <IconButton
                label="Log out"
                icon={<SignOut weight="light" />}
                variant="ghost"
                size="sm"
                onClick={(e) => { e.preventDefault(); logout(); }}
              />
            </Link>
          }
        >
          <SideNavSection title="Interview Lab" isHeaderHidden>
            {navItems.map((item) => (
              <SideNavItem
                key={item.id}
                label={item.label}
                icon={item.icon}
                isSelected={activeView === item.id}
                onClick={() => onViewChange(item.id)}
                endContent={item.id === "questions" ? <Badge label={questionCount} variant="orange" /> : undefined}
              />
            ))}
          </SideNavSection>

          {user?.isAdmin && (
            <SideNavSection title="Admin">
              <SideNavItem
                label="Admin Panel"
                icon={lightIcon(GearSix)}
                isSelected={activeView === "admin"}
                onClick={() => onViewChange("admin")}
              />
            </SideNavSection>
          )}
        </SideNav>
      }
    >
      {children}
    </AppShell>
  );
}

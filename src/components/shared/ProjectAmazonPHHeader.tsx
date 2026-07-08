"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

interface ProjectAmazonPHHeaderProps {
  /** Override the project name shown below "ProjectAmazonPH". Defaults to the current hostname label. */
  projectName?: string;
  /** Optional URL the logo links to. Defaults to https://projectamazonph.com */
  href?: string;
  /** Optional className to override container styles */
  className?: string;
}

const BRAND = {
  logo: "/project-amazon-ph-logo.svg",
  name: "ProjectAmazonPH",
  tagline: "Learn · Earn · Empower",
  url: "https://projectamazonph.com",
};

export function ProjectAmazonPHHeader({
  projectName,
  href = BRAND.url,
  className,
}: ProjectAmazonPHHeaderProps) {
  return (
    <div
      className={`flex items-center gap-3 ${className ?? ""}`}
    >
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] rounded-lg"
        aria-label={`${BRAND.name} — ${projectName ?? "Home"}`}
      >
        {/* Logo mark */}
        <div className="relative w-9 h-9 shrink-0 rounded-lg overflow-hidden bg-[#1A1A2E] shadow-sm ring-1 ring-white/10 group-hover:ring-[#FF6B35]/40 transition-all duration-200">
          <Image
            src={BRAND.logo}
            alt={`${BRAND.name} logo`}
            fill
            className="object-contain p-1"
            sizes="36px"
          />
        </div>

        {/* Brand + project name stack */}
        <div className="flex flex-col min-w-0">
          <span className="font-heading font-bold text-[13px] text-[#FF6B35] leading-none tracking-wide truncate">
            {BRAND.name}
          </span>
          <span className="text-[10px] text-white/50 leading-none mt-0.5 font-medium tracking-wider uppercase truncate">
            {projectName ?? "Official Platform"}
          </span>
        </div>
      </Link>
    </div>
  );
}

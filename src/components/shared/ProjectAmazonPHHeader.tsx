"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

interface ProjectAmazonPHHeaderProps {
  projectName?: string;
  href?: string;
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
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] rounded-md"
        aria-label={`${BRAND.name} — ${projectName ?? "Home"}`}
      >
        <div className="relative w-8 h-8 shrink-0 rounded-md overflow-hidden bg-white shadow-sm border border-[#E5E5E0] group-hover:border-[#FF6B35]/40 transition-all duration-200">
          <Image
            src={BRAND.logo}
            alt={`${BRAND.name} logo`}
            fill
            className="object-contain p-1"
            sizes="32px"
          />
        </div>

        <div className="flex flex-col min-w-0">
          <span className="font-heading font-bold text-[13px] text-[#FF6B35] leading-none tracking-wide truncate">
            {BRAND.name}
          </span>
          <span className="text-[10px] text-[#737373] leading-none mt-0.5 font-medium tracking-wider uppercase truncate">
            {projectName ?? "Official Platform"}
          </span>
        </div>
      </Link>
    </div>
  );
}

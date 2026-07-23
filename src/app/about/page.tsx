import { Metadata } from "next";
import { PapHeader } from "@/components/header";

export const metadata: Metadata = {
  title: "About — Interview Lab",
  description: "Learn about Interview Lab by ProjectAmazonPH — AI-powered mock interviews for Amazon VA roles.",
};

// About page - updated for cache refresh
export default function AboutPage() {
  return (
    <>
    <PapHeader />
    <div className="min-h-[100dvh] flex items-center justify-center bg-pa-navy relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#FF6B35]/8 rounded-full blur-[120px]" />
      </div>
      <div className="text-center z-10 px-6 max-w-xl">
        <h1 className="text-4xl font-heading font-bold text-white mb-4">About Interview Lab</h1>
        <p className="text-[#737373] text-lg mb-8 leading-relaxed">
          Interview Lab is an AI-powered mock interview platform built for Filipino VAs targeting Amazon VA roles.
          Built and maintained by <strong className="text-[#FF6B35]">ProjectAmazonPH</strong>.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF6B35] text-white font-medium hover:bg-[#FF6B35]/90 transition-colors"
        >
          Back to Home
        </a>
      </div>
    </div>
    </>
  );
}

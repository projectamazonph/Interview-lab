import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-clash",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Amazon VA Interview Lab — Prepare for Any Amazon VA Role",
  description:
    "Get interview-ready for Amazon VA roles with AI mock interviews, resume coaching, cover letter writing, practice tests, and downloadable templates for PPC, Account, Listing, Reporting, and Agency VA positions.",
  keywords: [
    "Amazon VA", "Amazon PPC VA", "Amazon Account VA",
    "Amazon Listing VA", "Amazon Reporting VA", "Amazon Agency VA",
    "VA interview prep", "mock interview", "resume builder",
    "cover letter", "Amazon VA training", "Seller Central",
  ],
  authors: [{ name: "Amazon VA Interview Lab" }],
  icons: { icon: "/logo.svg" },
  openGraph: {
    title: "Amazon VA Interview Lab — Prepare for Any Amazon VA Role",
    description: "Role-specific mock interviews, AI coaching, resume building, and practice tests for every Amazon VA position.",
    type: "website",
    siteName: "Amazon VA Interview Lab",
  },
  twitter: {
    card: "summary_large_image",
    title: "Amazon VA Interview Lab — Prepare for Any Amazon VA Role",
    description: "Role-specific mock interviews, AI coaching, resume building, and practice tests for every Amazon VA position.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${plusJakarta.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-body antialiased grain-overlay`}>
        {children}
        <Toaster />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Amazon VA Interview Lab",
              description: "Get interview-ready for Amazon VA roles with AI mock interviews, resume coaching, cover letter writing, practice tests, and downloadable templates.",
              applicationCategory: "EducationalApplication",
              operatingSystem: "Web",
              offers: { "@type": "Offer", price: "0", priceCurrency: "PHP", description: "Free tier with 264+ interview questions and AI coaching" },
              featureList: ["AI Mock Interviews", "264+ Role-Based Interview Questions", "Resume Lab with AI Review", "Cover Letter Studio", "Practice Tests & Assessments", "Downloadable Templates", "Learning Paths for 6 VA Roles"],
            }),
          }}
        />
      </body>
    </html>
  );
}

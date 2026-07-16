import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { PapHeader } from "@/components/header";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const BASE_URL = "https://interview-lab.vercel.app";

export const viewport: Viewport = {
  themeColor: "#FF6B35",
  colorScheme: "light",
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Project Amazon PH Interview Lab — Free AI Interview Prep for Amazon VAs",
    template: "%s | Project Amazon PH Interview Lab",
  },
  description:
    "Free AI mock interviews, resume coaching, cover letter writing, practice tests, and downloadable templates for Amazon VA roles — PPC, Account, Listing, Reporting, and Agency VA. A free companion to Project Amazon PH Academy.",
  keywords: [
    "Amazon VA", "Amazon PPC VA", "Amazon Account VA",
    "Amazon Listing VA", "Amazon Reporting VA", "Amazon Agency VA",
    "VA interview prep", "mock interview", "resume builder",
    "cover letter", "Amazon VA training", "Seller Central",
    "virtual assistant Philippines", "work from home jobs",
    "Project Amazon PH Academy",
  ],
  authors: [{ name: "Ryan Roland Dabao", url: "https://projectamazonph.com" }],
  creator: "Ryan Roland Dabao",
  publisher: "ProjectAmazonPH",
  openGraph: {
    title: "Project Amazon PH Interview Lab — Free AI Interview Prep for Amazon VAs",
    description: "Free AI mock interviews, resume coaching, cover letter writing, and practice tests for Amazon VA roles. A free companion to Project Amazon PH Academy.",
    type: "website",
    locale: "en_US",
    siteName: "Project Amazon PH Interview Lab",
    url: BASE_URL,
    images: [
      {
        url: "/og/il-og.png",
        width: 1200,
        height: 630,
        alt: "Project Amazon PH Interview Lab — Built by ProjectAmazonPH",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Project Amazon PH Interview Lab — Free AI Interview Prep for Amazon VAs",
    description: "Free AI mock interviews, resume coaching, cover letter writing, and practice tests for Amazon VA roles.",
    site: "@ProjectAmazonPH",
    creator: "@ProjectAmazonPH",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PAPH Interview Lab",
  },
  icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32" },
      { url: "/icons/icon-192.png", sizes: "192x192" },
      { url: "/icons/icon-512.png", sizes: "512x512" },
    ],
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180" }],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      name: "Project Amazon PH Interview Lab",
      url: BASE_URL,
      parentOrganization: {
        "@type": "Organization",
        name: "ProjectAmazonPH",
        url: "https://projectamazonph.com",
      },
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/icons/icon-180.png`,
        width: 180,
        height: 180,
      },
      sameAs: [
        "https://twitter.com/ProjectAmazonPH",
        "https://github.com/projectamazonph",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@interview-lab.vercel.app",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      url: BASE_URL,
      name: "Project Amazon PH Interview Lab",
      publisher: { "@id": `${BASE_URL}/#organization` },
      description: "Free AI-powered mock interviews and interview preparation for Amazon VA roles.",
      inLanguage: "en-US",
      potentialAction: {
        "@type": "SearchAction",
        target: `${BASE_URL}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "WebPage",
      "@id": `${BASE_URL}/#webpage`,
      url: BASE_URL,
      name: "Project Amazon PH Interview Lab — Free AI-Powered Amazon VA Interview Preparation",
      isPartOf: { "@id": `${BASE_URL}/#website` },
      about: { "@id": `${BASE_URL}/#organization` },
      description: "Get interview-ready for Amazon VA roles with AI mock interviews, resume coaching, cover letter writing, practice tests, and downloadable templates.",
      datePublished: "2024-01-01",
      dateModified: new Date().toISOString(),
      inLanguage: "en-US",
    },
    {
      "@type": "SoftwareApplication",
      name: "Project Amazon PH Interview Lab",
      "@id": `${BASE_URL}/#app`,
      url: BASE_URL,
      description: "Free AI-powered mock interviews and interview preparation for Amazon VA roles. A free companion to Project Amazon PH Academy.",
      applicationCategory: "EducationApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "PHP",
        description: "Free, always — 264+ interview questions, AI coaching, resume review, and practice tests",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        ratingCount: "1247",
        bestRating: "5",
        worstRating: "1",
      },
      featureList: [
        "AI Mock Interviews",
        "264+ Role-Based Interview Questions",
        "Resume Lab with AI Review",
        "Cover Letter Studio",
        "Practice Tests & Assessments",
        "Downloadable Templates",
        "Learning Paths for 6 VA Roles",
      ],
    },
    {
      "@type": "Course",
      name: "Amazon VA Interview Preparation Course",
      description: "Comprehensive preparation for Amazon VA roles including PPC, Account, Listing, Reporting, and Agency positions.",
      provider: { "@id": `${BASE_URL}/#organization` },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "PHP",
      },
      hasCourseInstance: {
        "@type": "CourseInstance",
        courseMode: "online",
        courseWorkload: "PT20H",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What Amazon VA roles can I prepare for?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "You can prepare for 6 Amazon VA roles: PPC VA, Account VA, Listing VA, Reporting VA, Agency VA, and General VA positions.",
          },
        },
        {
          "@type": "Question",
          name: "How many interview questions are available?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "We have 264+ role-based interview questions covering technical skills, situational judgment, and behavioral questions.",
          },
        },
        {
          "@type": "Question",
          name: "Is the platform free to use?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, Interview Lab is 100% free — mock interviews, the question bank, AI coaching, resume review, and more, no card required. It's a free companion to Project Amazon PH Academy.",
          },
        },
      ],
    },
  ],
};

const fontVariables = [
  plusJakarta.variable,
  spaceGrotesk.variable,
  jetbrainsMono.variable,
].join(" ");

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontVariables} font-body antialiased`}>
        <PapHeader />
        {children}
        <Toaster />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </body>
    </html>
  );
}

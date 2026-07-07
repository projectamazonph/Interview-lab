import type { Metadata, Viewport } from "next";
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

const BASE_URL = "https://interview-lab.vercel.app";

export const viewport: Viewport = {
  themeColor: "#FF6B35",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Interview Lab — AI-Powered Amazon VA Interview Preparation",
    template: "%s | Interview Lab",
  },
  description:
    "Get interview-ready for Amazon VA roles with AI mock interviews, resume coaching, cover letter writing, practice tests, and downloadable templates for PPC, Account, Listing, Reporting, and Agency VA positions.",
  keywords: [
    "Amazon VA", "Amazon PPC VA", "Amazon Account VA",
    "Amazon Listing VA", "Amazon Reporting VA", "Amazon Agency VA",
    "VA interview prep", "mock interview", "resume builder",
    "cover letter", "Amazon VA training", "Seller Central",
    "virtual assistant Philippines", "work from home jobs",
  ],
  authors: [{ name: "Ryan Roland Dabao", url: "https://projectamazonph.com" }],
  creator: "Ryan Roland Dabao",
  publisher: "ProjectAmazonPH",
  openGraph: {
    title: "Interview Lab — AI-Powered Amazon VA Interview Preparation",
    description: "Get interview-ready for Amazon VA roles with AI mock interviews, resume coaching, cover letter writing, and practice tests.",
    type: "website",
    locale: "en_US",
    siteName: "Interview Lab",
    url: BASE_URL,
    images: [
      {
        url: "/og/il-og.png",
        width: 1200,
        height: 630,
        alt: "Interview Lab — Built by ProjectAmazonPH",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Interview Lab — AI-Powered Amazon VA Interview Preparation",
    description: "Get interview-ready for Amazon VA roles with AI mock interviews, resume coaching, cover letter writing, and practice tests.",
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
    title: "Interview Lab",
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
      name: "Interview Lab",
      url: BASE_URL,
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
      name: "Interview Lab",
      publisher: { "@id": `${BASE_URL}/#organization` },
      description: "AI-powered mock interviews and interview preparation for Amazon VA roles.",
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
      name: "Interview Lab — AI-Powered Amazon VA Interview Preparation",
      isPartOf: { "@id": `${BASE_URL}/#website` },
      about: { "@id": `${BASE_URL}/#organization` },
      description: "Get interview-ready for Amazon VA roles with AI mock interviews, resume coaching, cover letter writing, practice tests, and downloadable templates.",
      datePublished: "2024-01-01",
      dateModified: new Date().toISOString(),
      inLanguage: "en-US",
    },
    {
      "@type": "SoftwareApplication",
      name: "Interview Lab",
      "@id": `${BASE_URL}/#app`,
      url: BASE_URL,
      description: "AI-powered mock interviews and interview preparation for Amazon VA roles.",
      applicationCategory: "EducationApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "PHP",
        description: "Free tier with 264+ interview questions and AI coaching",
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
            text: "Yes, we offer a free tier with access to interview questions, AI coaching, and basic features.",
          },
        },
      ],
    },
  ],
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
            __html: JSON.stringify(structuredData),
          }}
        />
      </body>
    </html>
  );
}

import { Metadata } from "next";
import { PapHeader } from "@/components/header";

export const metadata: Metadata = {
  title: "Privacy Policy — Interview Lab",
  description: "How Interview Lab collects, uses, and stores your data.",
};

export default function PrivacyPage() {
  return (
    <>
    <PapHeader />
    <div className="min-h-[100dvh] bg-background px-6 py-16">
      <div className="max-w-2xl mx-auto prose prose-neutral">
        <h1 className="text-3xl font-heading font-bold text-ink-900 mb-2">Privacy Policy</h1>
        <p className="text-ink-500 text-sm mb-8">
          This is a plain-language summary of how Interview Lab handles your data, not a
          formal legal document. If you have questions, contact us at{" "}
          <a href="mailto:support@interview-lab.vercel.app" className="text-accent hover:underline">
            support@interview-lab.vercel.app
          </a>.
        </p>

        <h2 className="font-heading font-semibold text-ink-900 mt-8 mb-2">What we collect</h2>
        <ul className="list-disc pl-5 space-y-1 text-ink-700">
          <li>Account info: name (optional), email address, and a securely hashed password.</li>
          <li>Profile info you provide during onboarding (target role, experience level, tools known, etc.).</li>
          <li>Content you submit: resume text, cover letter inputs, and mock interview answers.</li>
          <li>Interview session results, AI feedback, and scores generated from that content.</li>
        </ul>

        <h2 className="font-heading font-semibold text-ink-900 mt-8 mb-2">How we use it</h2>
        <ul className="list-disc pl-5 space-y-1 text-ink-700">
          <li>To run the product: authenticate you, save your progress, and show your history.</li>
          <li>
            Resume text, cover letter inputs, and interview answers are sent to a third-party AI
            provider to generate coaching feedback, scores, and suggested content.
          </li>
          <li>We do not sell your personal data.</li>
        </ul>

        <h2 className="font-heading font-semibold text-ink-900 mt-8 mb-2">How we store it</h2>
        <p className="text-ink-700">
          Your data is stored in our PostgreSQL database. Passwords are hashed and never stored
          in plain text. Sessions are managed with a signed, HttpOnly cookie — it isn&apos;t
          readable by page scripts. Data is retained for as long as your account exists; you can
          request deletion by contacting us at the address above.
        </p>

        <h2 className="font-heading font-semibold text-ink-900 mt-8 mb-2">Your choices</h2>
        <p className="text-ink-700">
          You can update your profile at any time from within the app, and you can request
          account and data deletion by emailing us.
        </p>

        <a href="/" className="inline-block mt-10 text-accent hover:underline">
          ← Back to Home
        </a>
      </div>
    </div>
    </>
  );
}

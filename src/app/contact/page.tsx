import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — Interview Lab",
  description: "Get in touch with the Interview Lab team.",
};

// Contact page - updated for cache refresh
export default function ContactPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-pa-navy relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-[-10%] right-[-15%] w-[50vw] h-[50vw] bg-accent-indigo/5 rounded-full blur-[100px]" />
      </div>
      <div className="text-center z-10 px-6 max-w-xl">
        <h1 className="text-4xl font-heading font-bold text-white mb-4">Get in Touch</h1>
        <p className="text-text-muted text-lg mb-4 leading-relaxed">
          Have questions or feedback? Reach us at:
        </p>
        <div className="space-y-3">
          <p className="text-accent-indigo font-medium">support@interview-lab.vercel.app</p>
          <p className="text-text-muted text-sm">
            Or open an issue on{" "}
            <a
              href="https://github.com/projectamazonph/Interview-lab"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-indigo hover:underline"
            >
              GitHub
            </a>
          </p>
        </div>
        <div className="mt-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-indigo text-white font-medium hover:bg-accent-indigo/90 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

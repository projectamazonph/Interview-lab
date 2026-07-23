import { Metadata } from "next";
import { AboutContent } from "./AboutContent";

export const metadata: Metadata = {
  title: "About — Interview Lab",
  description: "Learn about Interview Lab by ProjectAmazonPH — AI-powered mock interviews for Amazon VA roles.",
};

export default function AboutPage() {
  return <AboutContent />;
}

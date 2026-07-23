import { Metadata } from "next";
import { PapHeader } from "@/components/header";
import { Section } from "@astryxdesign/core/Section";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Text, Heading } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";

function BulletList({ items }: { items: string[] }) {
  return (
    <VStack gap={1.5}>
      {items.map((item) => (
        <HStack key={item} gap={2}>
          <Text type="body" color="secondary">•</Text>
          <Text type="body" color="secondary">{item}</Text>
        </HStack>
      ))}
    </VStack>
  );
}

export const metadata: Metadata = {
  title: "Privacy Policy — Interview Lab",
  description: "How Interview Lab collects, uses, and stores your data.",
};

export default function PrivacyPage() {
  return (
    <>
      <PapHeader />
      <Section variant="transparent" paddingBlock={10}>
        <VStack gap={6} maxWidth={640} className="mx-auto">
          <VStack gap={2}>
            <Heading level={1} type="display-2">Privacy Policy</Heading>
            <Text type="supporting" size="sm">
              This is a plain-language summary of how Interview Lab handles your data, not a
              formal legal document. If you have questions, contact us at{" "}
              <Link href="mailto:support@interview-lab.vercel.app">support@interview-lab.vercel.app</Link>.
            </Text>
          </VStack>

          <VStack gap={2}>
            <Heading level={2} type="display-3">What we collect</Heading>
            <BulletList items={[
              "Account info: name (optional), email address, and a securely hashed password.",
              "Profile info you provide during onboarding (target role, experience level, tools known, etc.).",
              "Content you submit: resume text, cover letter inputs, and mock interview answers.",
              "Interview session results, AI feedback, and scores generated from that content.",
            ]} />
          </VStack>

          <VStack gap={2}>
            <Heading level={2} type="display-3">How we use it</Heading>
            <BulletList items={[
              "To run the product: authenticate you, save your progress, and show your history.",
              "Resume text, cover letter inputs, and interview answers are sent to a third-party AI provider to generate coaching feedback, scores, and suggested content.",
              "We do not sell your personal data.",
            ]} />
          </VStack>

          <VStack gap={2}>
            <Heading level={2} type="display-3">How we store it</Heading>
            <Text type="body" color="secondary">
              Your data is stored in our PostgreSQL database. Passwords are hashed and never stored
              in plain text. Sessions are managed with a signed, HttpOnly cookie — it isn&apos;t
              readable by page scripts. Data is retained for as long as your account exists; you can
              request deletion by contacting us at the address above.
            </Text>
          </VStack>

          <VStack gap={2}>
            <Heading level={2} type="display-3">Your choices</Heading>
            <Text type="body" color="secondary">
              You can update your profile at any time from within the app, and you can request
              account and data deletion by emailing us.
            </Text>
          </VStack>

          <Link href="/">← Back to Home</Link>
        </VStack>
      </Section>
    </>
  );
}

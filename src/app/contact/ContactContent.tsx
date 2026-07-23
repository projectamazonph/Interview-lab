"use client";

import { useRouter } from "next/navigation";
import { PapHeader } from "@/components/header";
import { Section } from "@astryxdesign/core/Section";
import { VStack } from "@astryxdesign/core/Stack";
import { Text, Heading } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Link } from "@astryxdesign/core/Link";

export function ContactContent() {
  const router = useRouter();

  return (
    <>
      <PapHeader />
      <Section variant="transparent" height="fill" minHeight="calc(100dvh - 56px)">
        <VStack gap={6} maxWidth={560} hAlign="center" className="mx-auto text-center h-full justify-center">
          <Heading level={1} type="display-1" justify="center">Get in Touch</Heading>
          <VStack gap={2} hAlign="center">
            <Text type="large" color="secondary" justify="center">Have questions or feedback? Reach us at:</Text>
            <Text type="body" weight="medium" color="accent">support@interview-lab.vercel.app</Text>
            <Text type="supporting" size="sm">
              Or open an issue on{" "}
              <Link href="https://github.com/projectamazonph/Interview-lab" isExternalLink target="_blank">GitHub</Link>
            </Text>
          </VStack>
          <Button label="Back to Home" variant="primary" onClick={() => router.push("/")} />
        </VStack>
      </Section>
    </>
  );
}

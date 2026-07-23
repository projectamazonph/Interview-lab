"use client";

import { useRouter } from "next/navigation";
import { PapHeader } from "@/components/header";
import { Section } from "@astryxdesign/core/Section";
import { VStack } from "@astryxdesign/core/Stack";
import { Text, Heading } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";

export function AboutContent() {
  const router = useRouter();

  return (
    <>
      <PapHeader />
      <Section variant="transparent" height="fill" minHeight="calc(100dvh - 56px)">
        <VStack gap={6} maxWidth={560} hAlign="center" className="mx-auto text-center h-full justify-center">
          <Heading level={1} type="display-1" justify="center">About Interview Lab</Heading>
          <Text type="large" color="secondary" justify="center">
            Interview Lab is an AI-powered mock interview platform built for Filipino VAs targeting Amazon VA roles.
            Built and maintained by <Text as="span" type="inherit" color="accent" weight="semibold">ProjectAmazonPH</Text>.
          </Text>
          <Button label="Back to Home" variant="primary" onClick={() => router.push("/")} />
        </VStack>
      </Section>
    </>
  );
}

import React from 'react';
import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
import { YStack, XStack, SizableText, Button, SafeArea } from '@blinkdotnew/mobile-ui';
import { ArrowLeft } from '@blinkdotnew/mobile-ui';

const LAST_UPDATED = 'June 1, 2026';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  return (
    <SafeArea>
      <YStack flex={1} backgroundColor="#0a0a0f">
        <XStack alignItems="center" paddingHorizontal="$4" paddingVertical="$3" gap="$3">
          <Button size="$3" circular icon={<ArrowLeft size={20} />} onPress={() => router.back()} />
          <SizableText size="$6" fontWeight="700" color="$color12">
            Privacy Policy
          </SizableText>
        </XStack>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80 }}>
          <YStack gap="$3">
            <SizableText size="$2" color="$color10">
              Last updated: {LAST_UPDATED}
            </SizableText>

            <Section title="Overview">
              Credibility Radar ("we", "us", "the app") provides AI-powered analysis of
              text and voice content to help you evaluate communication credibility. This
              policy explains what data we collect, how we use it, and your rights.
            </Section>

            <Section title="Information We Collect">
              {`• Account data: when you create an account, we collect your email address and an encrypted password hash.

• Analysis content: the text or transcribed voice you submit for analysis. This content is stored linked to your account so you can view your history.

• Subscription data: if you upgrade to Pro, RevenueCat (our payments partner) receives a pseudonymous user ID and your purchase receipt from Apple or Google. We do not see your payment card details.

• Device and usage data: standard diagnostic information (app version, OS, crash logs) used to improve the app.`}
            </Section>

            <Section title="How We Use Your Data">
              {`• To run the analysis you requested and return results.
• To save your analysis history so you can revisit past results.
• To authenticate you across devices.
• To process subscriptions and entitlements (via RevenueCat + Apple/Google).
• To diagnose crashes and improve reliability.

We do not sell your data. We do not use your analyses to train third-party models.`}
            </Section>

            <Section title="Third-Party Services">
              {`We rely on the following processors:

• Blink (blink.new) — authentication, database, and AI model orchestration.
• RevenueCat — subscription management.
• Apple App Store / Google Play — payment processing.

Each operates under its own privacy policy.`}
            </Section>

            <Section title="Voice and Microphone">
              Voice input is captured only while you are actively recording. Audio is
              transcribed to text and then discarded; only the transcribed text is stored
              with your analysis. We never record in the background.
            </Section>

            <Section title="Data Retention">
              Analysis history is kept while your account is active. You may delete
              individual analyses, or request full account deletion by emailing
              privacy@credibilityradar.app — we will remove your data within 30 days.
            </Section>

            <Section title="Children">
              Credibility Radar is not directed to children under 13. We do not knowingly
              collect data from children. If you believe a child has provided us data,
              contact us and we will delete it.
            </Section>

            <Section title="Your Rights">
              {`You may:
• Request a copy of your data
• Correct inaccurate data
• Delete your account and data
• Opt out of non-essential diagnostics

Contact privacy@credibilityradar.app to exercise any of these rights.`}
            </Section>

            <Section title="Changes to This Policy">
              We may update this policy. Material changes will be announced in-app. The
              "Last updated" date above always reflects the current version.
            </Section>

            <Section title="Contact">
              privacy@credibilityradar.app
            </Section>
          </YStack>
        </ScrollView>
      </YStack>
    </SafeArea>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <YStack gap="$2" marginTop="$3">
      <SizableText size="$5" fontWeight="700" color="$color12">
        {title}
      </SizableText>
      <SizableText size="$3" color="$color11" lineHeight={22}>
        {children}
      </SizableText>
    </YStack>
  );
}

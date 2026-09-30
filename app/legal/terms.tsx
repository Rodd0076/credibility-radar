import React from 'react';
import { useRouter } from 'expo-router';
import { ScrollView } from 'react-native';
import { YStack, XStack, SizableText, Button, SafeArea } from '@blinkdotnew/mobile-ui';
import { ArrowLeft } from '@blinkdotnew/mobile-ui';

const LAST_UPDATED = 'June 1, 2026';

export default function TermsScreen() {
  const router = useRouter();
  return (
    <SafeArea>
      <YStack flex={1} backgroundColor="#0a0a0f">
        <XStack alignItems="center" paddingHorizontal="$4" paddingVertical="$3" gap="$3">
          <Button size="$3" circular icon={<ArrowLeft size={20} />} onPress={() => router.back()} />
          <SizableText size="$6" fontWeight="700" color="$color12">
            Terms of Service
          </SizableText>
        </XStack>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80 }}>
          <YStack gap="$3">
            <SizableText size="$2" color="$color10">
              Last updated: {LAST_UPDATED}
            </SizableText>

            <Section title="Acceptance">
              By using Credibility Radar you agree to these terms. If you do not agree,
              do not use the app.
            </Section>

            <Section title="The Service">
              Credibility Radar uses AI to score the credibility of text and voice
              content. Scores are analytical opinions, not professional advice. The app
              is not a lie detector. Do not rely on it as the sole basis for hiring,
              investment, legal, medical, or other consequential decisions.
            </Section>

            <Section title="Accounts">
              {`You are responsible for keeping your password confidential. You must be at least 13 years old (or the minimum age in your country) to use the app.`}
            </Section>

            <Section title="Subscriptions (Pro)">
              {`• Pro unlocks unlimited scans and full history.
• Pricing is shown in-app at the time of purchase.
• Subscriptions auto-renew through Apple App Store or Google Play until cancelled.
• Cancel anytime in your App Store or Play Store settings — access continues until the end of the current period.
• Refunds are governed by Apple and Google policies; we cannot issue refunds directly.`}
            </Section>

            <Section title="Acceptable Use">
              {`You agree NOT to:
• Submit content that violates someone else's privacy or rights
• Use the app to harass, defame, or impersonate
• Attempt to reverse-engineer, scrape, or abuse the service
• Resell access to the service`}
            </Section>

            <Section title="Content You Submit">
              You retain ownership of the text or transcripts you submit. You grant us a
              limited license to process that content solely to provide and improve the
              service.
            </Section>

            <Section title="Disclaimer">
              The service is provided "as is" without warranties of any kind. AI output
              may be inaccurate. We do not guarantee uninterrupted or error-free
              operation.
            </Section>

            <Section title="Limitation of Liability">
              To the maximum extent permitted by law, our total liability is limited to
              the amount you paid us in the prior twelve months. We are not liable for
              indirect, incidental, or consequential damages.
            </Section>

            <Section title="Termination">
              We may suspend or terminate accounts that violate these terms. You may stop
              using the app at any time.
            </Section>

            <Section title="Changes">
              We may update these terms. Continued use after changes means you accept
              the updated terms.
            </Section>

            <Section title="Contact">
              support@credibilityradar.app
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

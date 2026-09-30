import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
  PaywallScreen,
  SizableText,
  YStack,
  Spinner,
  toast,
} from '@blinkdotnew/mobile-ui';
import {
  Shield,
  Award,
  Headphones,
  Zap,
  History,
  BarChart3,
  Lock,
} from '@blinkdotnew/mobile-ui';
import { blink } from '@/lib/blink';
import {
  usePackages,
  purchasePackage,
  restorePurchases,
  findPackage,
} from '@/lib/payments';
import type { PurchasesPackage } from 'react-native-purchases';

function InfinityIcon({ size, color }: { size: number; color: string }) {
  return <SizableText style={{ fontSize: size, color }}>∞</SizableText>;
}

const ACCENT = '#a78bfa';

export default function ProPaywallScreen() {
  const router = useRouter();
  const { packages, isLoading, error, refetch } = usePackages();
  const [selectedPlan, setSelectedPlan] = useState<string>('annual');
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const monthlyPkg = findPackage(packages, '$rc_monthly');
  const annualPkg = findPackage(packages, '$rc_annual');

  // Compute savings if both plans available
  const savingsLabel = (() => {
    if (!monthlyPkg || !annualPkg) return 'Best value';
    const m = monthlyPkg.product.price;
    const a = annualPkg.product.price;
    if (!m || !a) return 'Best value';
    const yearlyEquiv = m * 12;
    if (yearlyEquiv <= a) return 'Best value';
    const pct = Math.round(((yearlyEquiv - a) / yearlyEquiv) * 100);
    return `Save ${pct}%`;
  })();

  // Auto-select annual if available, else monthly
  useEffect(() => {
    if (annualPkg) setSelectedPlan('annual');
    else if (monthlyPkg) setSelectedPlan('monthly');
  }, [annualPkg, monthlyPkg]);

  const handleContinue = async () => {
    if (Platform.OS === 'web') {
      toast('Open on mobile', {
        message: 'Subscriptions are processed through the App Store and Play Store. Open on your phone to upgrade.',
        variant: 'error',
      });
      return;
    }

    // Sign-in required for purchase attribution
    const user = await blink.auth.me().catch(() => null);
    if (!user) {
      router.push({ pathname: '/auth', params: { redirect: '/paywall' } } as any);
      return;
    }

    const pkg: PurchasesPackage | undefined =
      selectedPlan === 'annual' ? annualPkg : monthlyPkg;

    if (!pkg) {
      toast('Plan unavailable', {
        message: 'This subscription option is not available right now.',
        variant: 'error',
      });
      return;
    }

    setPurchasing(true);
    try {
      const result = await purchasePackage(pkg);
      if (result.success) {
        toast('Welcome to Pro! 🎉', {
          message: 'Unlimited scans are now active.',
          variant: 'success',
        });
        router.replace('/');
      } else if (result.cancelled) {
        // Silent — user chose to back out
      } else {
        toast('Purchase failed', {
          message: result.error ?? 'Please try again.',
          variant: 'error',
        });
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (Platform.OS === 'web') {
      toast('Open on mobile', {
        message: 'Restore purchases on the device where you originally subscribed.',
        variant: 'error',
      });
      return;
    }

    setRestoring(true);
    try {
      const result = await restorePurchases();
      if (result.success) {
        toast('Subscription restored', {
          message: 'Your Pro access is active.',
          variant: 'success',
        });
        router.replace('/');
      } else if (result.error) {
        toast('Restore failed', { message: result.error, variant: 'error' });
      } else {
        toast('Nothing to restore', {
          message: 'No active subscription found on this account.',
          variant: 'error',
        });
      }
    } finally {
      setRestoring(false);
    }
  };

  // Build plan list from real RevenueCat data (with fallback display values)
  const plans = [
    monthlyPkg && {
      id: 'monthly',
      name: 'Monthly',
      price: monthlyPkg.product.priceString,
      period: 'month',
    },
    annualPkg && {
      id: 'annual',
      name: 'Annual',
      price: annualPkg.product.priceString,
      period: 'year',
      savings: savingsLabel,
      popular: true,
      trial: 'Best value',
    },
  ].filter(Boolean) as any[];

  // Loading state
  if (isLoading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background" gap="$3">
        <Spinner size="large" color={ACCENT} />
        <SizableText size="$3" color="$color10">
          Loading subscription options…
        </SizableText>
      </YStack>
    );
  }

  // Web / no packages state — show informational paywall
  if (plans.length === 0 || Platform.OS === 'web') {
    return (
      <YStack flex={1} backgroundColor="$background" padding="$5" justifyContent="center" gap="$4">
        <YStack alignItems="center" gap="$3">
          <YStack
            width={72}
            height={72}
            borderRadius={36}
            backgroundColor="rgba(167,139,250,0.15)"
            alignItems="center"
            justifyContent="center"
          >
            <Lock size={32} color={ACCENT} />
          </YStack>
          <SizableText fontSize={26} fontWeight="800" color="$color12" textAlign="center">
            Pro requires the mobile app
          </SizableText>
          <SizableText size="$3" color="$color10" textAlign="center" lineHeight={22}>
            {Platform.OS === 'web'
              ? 'Subscriptions are processed through the App Store and Google Play. Download Credibility Radar on your phone to upgrade.'
              : error ?? 'Could not load subscription options. Please try again.'}
          </SizableText>
          {error && Platform.OS !== 'web' && (
            <SizableText
              size="$2"
              color={ACCENT}
              textAlign="center"
              marginTop="$2"
              onPress={refetch}
              pressStyle={{ opacity: 0.6 }}
            >
              Tap to retry
            </SizableText>
          )}
        </YStack>

        <YStack
          backgroundColor="$color2"
          borderColor="$color4"
          borderWidth={1}
          borderRadius="$5"
          padding="$4"
          gap="$3"
          marginTop="$4"
        >
          <SizableText size="$4" fontWeight="700" color="$color12">
            What you'll unlock
          </SizableText>
          {[
            { icon: <InfinityIcon size={18} color={ACCENT} />, text: 'Unlimited credibility scans' },
            { icon: <History size={18} color={ACCENT} />, text: 'Full analysis history' },
            { icon: <BarChart3 size={18} color={ACCENT} />, text: 'Detailed metric breakdowns' },
            { icon: <Zap size={18} color={ACCENT} />, text: 'Priority AI processing' },
          ].map((item, i) => (
            <YStack key={i} flexDirection="row" alignItems="center" gap="$3">
              {item.icon}
              <SizableText size="$3" color="$color11">
                {item.text}
              </SizableText>
            </YStack>
          ))}
        </YStack>

        <SizableText
          size="$2"
          color="$color9"
          textAlign="center"
          marginTop="$2"
          onPress={() => router.back()}
          pressStyle={{ opacity: 0.6 }}
        >
          ← Back
        </SizableText>
      </YStack>
    );
  }

  return (
    <PaywallScreen
      variant="social-proof"
      eyebrow="⭐ Used by 1,000+ professionals"
      title="Know who really knows"
      subtitle="Unlimited credibility scans. Zero guesswork."
      plans={plans}
      selectedPlan={selectedPlan}
      onSelectPlan={setSelectedPlan}
      onContinue={handleContinue}
      onRestore={handleRestore}
      features={[
        {
          title: 'Unlimited Scans',
          description: 'No monthly caps — analyze everything you need',
          icon: <InfinityIcon size={20} color={ACCENT} />,
        },
        {
          title: 'Full History',
          description: 'Save and revisit every past analysis',
          icon: <History size={20} color={ACCENT} />,
        },
        {
          title: 'Deep Breakdowns',
          description: 'All 4 metrics with highlighted fluff detection',
          icon: <BarChart3 size={20} color={ACCENT} />,
        },
        {
          title: 'Priority AI Analysis',
          description: 'Enhanced depth with faster processing',
          icon: <Zap size={20} color={ACCENT} />,
        },
      ]}
      trustBadges={[
        { icon: <Shield size={16} color={ACCENT} />, label: 'Secure IAP' },
        { icon: <Award size={16} color={ACCENT} />, label: 'Cancel Anytime' },
        { icon: <Headphones size={16} color={ACCENT} />, label: 'Email Support' },
      ]}
      testimonials={[
        { quote: 'Caught a BS consultant in 30 seconds. Saved us $50K.', author: 'Sarah K.', meta: 'VP Engineering' },
        { quote: 'Finally have an objective way to evaluate candidates.', author: 'Marcus T.', meta: 'Hiring Manager' },
        { quote: 'Our due diligence process is 3× faster now.', author: 'Priya R.', meta: 'Venture Partner' },
      ]}
      badge="LIMITED OFFER"
      topSlot={
        <YStack
          backgroundColor="rgba(167,139,250,0.08)"
          borderWidth={1}
          borderColor="rgba(167,139,250,0.2)"
          borderRadius="$3"
          paddingHorizontal="$3"
          paddingVertical="$2"
          marginBottom="$2"
        >
          <SizableText size="$2" color="rgba(167,139,250,0.9)" textAlign="center">
            🎯 Free tier: 3 scans/month · Pro: unlimited
          </SizableText>
        </YStack>
      }
      footerSlot={
        <YStack paddingTop="$3" gap="$2">
          <SizableText size="$1" color="$color9" textAlign="center" lineHeight={16}>
            Subscriptions auto-renew through the App Store / Play Store until cancelled.
            Cancel anytime in your store settings.
          </SizableText>
          <SizableText size="$1" color="$color9" textAlign="center">
            <SizableText
              size="$1"
              color={ACCENT}
              onPress={() => router.push('/legal/terms' as any)}
            >
              Terms
            </SizableText>
            {'  ·  '}
            <SizableText
              size="$1"
              color={ACCENT}
              onPress={() => router.push('/legal/privacy' as any)}
            >
              Privacy
            </SizableText>
          </SizableText>
        </YStack>
      }
    />
  );
}

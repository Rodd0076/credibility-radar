import React, { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  YStack,
  SizableText,
  Button,
  Spinner,
  SafeArea,
} from '@blinkdotnew/mobile-ui';
import { CheckCircle2, AlertCircle, Mail } from '@blinkdotnew/mobile-ui';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { blink } from '@/lib/blink';

type Status = 'verifying' | 'success' | 'error';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; t?: string }>();
  const [status, setStatus] = useState<Status>('verifying');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    const token = (params.token || params.t || '').toString().trim();

    if (!token) {
      setStatus('error');
      setErrorMsg('No verification token found in the link. The link may be incomplete.');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        await blink.auth.verifyEmail(token);
        if (!cancelled) setStatus('success');
      } catch (e: any) {
        if (cancelled) return;
        const msg = e?.message || 'Verification failed. The link may have expired.';
        setErrorMsg(msg);
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.token, params.t]);

  return (
    <SafeArea>
      <YStack flex={1} backgroundColor="$background" alignItems="center" justifyContent="center" paddingHorizontal="$5" gap="$4">
        {status === 'verifying' && (
          <Animated.View entering={FadeIn.duration(300)} style={{ alignItems: 'center', gap: 20 }}>
            <YStack
              width={72} height={72} borderRadius={20}
              backgroundColor="rgba(255,255,255,0.06)"
              alignItems="center" justifyContent="center"
            >
              <Mail size={32} color="$accent9" />
            </YStack>
            <Spinner size="large" color="$accent9" />
            <SizableText fontSize={22} fontWeight="700" color="$color12" textAlign="center">
              Verifying your email…
            </SizableText>
            <SizableText size="$3" color="$color10" textAlign="center">
              Just a moment.
            </SizableText>
          </Animated.View>
        )}

        {status === 'success' && (
          <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: 'center', gap: 20 }}>
            <YStack
              width={84} height={84} borderRadius={24}
              backgroundColor="rgba(34,197,94,0.12)"
              alignItems="center" justifyContent="center"
            >
              <CheckCircle2 size={44} color="#22c55e" />
            </YStack>
            <SizableText fontSize={28} fontWeight="800" color="$color12" textAlign="center">
              Email verified!
            </SizableText>
            <SizableText size="$3" color="$color10" textAlign="center" lineHeight={22}>
              Your email has been confirmed. You can now sign in and use all features of Credibility Radar.
            </SizableText>
            <Button
              size="$5"
              marginTop="$3"
              backgroundColor="$accent9"
              color="$accent1"
              borderRadius="$4"
              width="100%"
              onPress={() => router.replace('/auth')}
              pressStyle={{ scale: 0.98 }}
            >
              Continue to Sign In
            </Button>
          </Animated.View>
        )}

        {status === 'error' && (
          <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: 'center', gap: 20 }}>
            <YStack
              width={84} height={84} borderRadius={24}
              backgroundColor="rgba(239,68,68,0.12)"
              alignItems="center" justifyContent="center"
            >
              <AlertCircle size={44} color="#ef4444" />
            </YStack>
            <SizableText fontSize={26} fontWeight="800" color="$color12" textAlign="center">
              Verification failed
            </SizableText>
            <SizableText size="$3" color="$color10" textAlign="center" lineHeight={22}>
              {errorMsg}
            </SizableText>
            <YStack width="100%" gap="$2" marginTop="$3">
              <Button
                size="$5"
                backgroundColor="$accent9"
                color="$accent1"
                borderRadius="$4"
                onPress={() => router.replace('/auth')}
                pressStyle={{ scale: 0.98 }}
              >
                Go to Sign In
              </Button>
              <Button
                size="$4"
                chromeless
                color="$color10"
                onPress={() => router.replace('/')}
              >
                Back to Home
              </Button>
            </YStack>
          </Animated.View>
        )}
      </YStack>
    </SafeArea>
  );
}

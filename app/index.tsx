import React, { useState, useCallback, useRef } from 'react';
import { ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  YStack,
  XStack,
  SizableText,
  Button,
  Card,
  SafeArea,
  Spinner,
  toast,
} from '@blinkdotnew/mobile-ui';
import { Radar, Sparkles, History, Crown, ChevronRight, Activity, Zap, User } from '@blinkdotnew/mobile-ui';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { analyzeText, MAX_ANALYSIS_LENGTH, saveAnalysis } from '@/lib/analyze';
import { canScan, incrementScanCount, FREE_LIMIT } from '@/lib/scanLimits';
import { useSamples } from '@/hooks/useAnalyses';
import { getScoreColor } from '@/lib/types';
import { TextAnalyzerInput } from '@/components/TextAnalyzerInput';
import { useAuth } from '@/hooks/useAuth';

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuth();
  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const analyzeLock = useRef(false);
  const [scansLeft, setScansLeft] = useState<number>(FREE_LIMIT);
  const [isProUser, setIsProUser] = useState(false);
  const { data: samples = [] } = useSamples();

  const refreshLimits = useCallback(async () => {
    const status = await canScan();
    setScansLeft(status.pro ? Infinity : status.remaining);
    setIsProUser(status.pro);
  }, []);

  useFocusEffect(useCallback(() => { refreshLimits(); }, [refreshLimits]));

  const handleAnalyze = async () => {
    if (analyzeLock.current) return;
    const trimmed = text.trim();
    if (trimmed.length < 20) {
      toast('Too short', { message: 'Paste at least 20 characters to analyze.', variant: 'error' });
      return;
    }
    if (trimmed.length > MAX_ANALYSIS_LENGTH) {
      toast('Text too long', { message: `Keep the text under ${MAX_ANALYSIS_LENGTH.toLocaleString()} characters.`, variant: 'error' });
      return;
    }
    if (!isAuthenticated) {
      toast('Sign in to analyze', { message: 'Your samples stay available; sign in to run and save an analysis.', variant: 'error' });
      router.push('/auth');
      return;
    }

    analyzeLock.current = true;
    setAnalyzing(true);
    try {
      const status = await canScan();
      if (!status.allowed) {
        router.push('/paywall');
        return;
      }
      const result = await analyzeText(trimmed);
      await incrementScanCount();
      const id = await saveAnalysis(trimmed, result, 'text', user?.id);
      if (!id) {
        toast('Result ready', { message: 'This result could not be saved to history on this device.', variant: 'error' });
      }
      router.push({
        pathname: '/result',
        params: {
          id: id ?? '',
          score: String(result.overall_score),
          tech: String(result.technical_score),
          struct: String(result.structural_score),
          camo: String(result.camouflage_score),
          coh: String(result.coherence_score),
          tier: result.tier,
          summary: result.summary,
          fluff: JSON.stringify(result.fluff_phrases),
          strengths: JSON.stringify(result.strengths),
          text: trimmed,
        },
      });
      setText('');
      refreshLimits();
    } catch (e: any) {
      console.error(e);
      toast('Analysis failed', { message: e?.message || 'Try again in a moment.', variant: 'error' });
    } finally {
      analyzeLock.current = false;
      setAnalyzing(false);
    }
  };

  return (
    <SafeArea>
      <YStack flex={1} backgroundColor="$background">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Header */}
            <XStack paddingHorizontal="$4" paddingTop="$3" paddingBottom="$2" justifyContent="space-between" alignItems="center">
              <XStack gap="$2" alignItems="center">
                <YStack width={36} height={36} borderRadius={10} backgroundColor="$color4" alignItems="center" justifyContent="center">
                  <Radar size={20} color="$accent9" />
                </YStack>
                <YStack>
                  <SizableText size="$5" fontWeight="800" color="$color12">Credibility Radar</SizableText>
                  <SizableText size="$1" color={isProUser ? '$accent9' : '$color9'}>
                    {isProUser ? '✦ Pro · Unlimited scans' : 'Detect real expertise'}
                  </SizableText>
                </YStack>
              </XStack>
              <XStack gap="$2" alignItems="center">
                <Button
                  size="$2"
                  chromeless
                  circular
                  icon={<History size={18} color="$color11" />}
                  onPress={() => router.push('/history')}
                />
                {!isProUser && (
                  <Button
                    size="$2"
                    backgroundColor="$accent9"
                    color="$accent1"
                    borderRadius="$10"
                    paddingHorizontal="$3"
                    icon={<Crown size={14} color="$accent1" />}
                    onPress={() => router.push('/paywall')}
                  >
                    Pro
                  </Button>
                )}
                <Button
                  size="$2"
                  chromeless
                  circular
                  icon={<User size={18} color={isAuthenticated ? '$accent9' : '$color9'} />}
                  onPress={() => {
                    if (isAuthenticated) {
                      signOut().then(() => {
                        toast('Signed out', { message: 'See you next time.', variant: 'success' });
                        refreshLimits();
                      });
                    } else {
                      router.push('/auth');
                    }
                  }}
                />
              </XStack>
            </XStack>

            {/* Hero */}
            <Animated.View entering={FadeInDown.duration(500)}>
              <YStack paddingHorizontal="$4" paddingTop="$4" paddingBottom="$3" gap="$2">
                <SizableText fontSize={32} lineHeight={38} fontWeight="800" color="$color12">
                  Is this person{'\n'}
                  <SizableText fontSize={32} lineHeight={38} fontWeight="800" color="$accent9">
                    actually an expert?
                  </SizableText>
                </SizableText>
                <SizableText size="$3" color="$color10" lineHeight={20}>
                  Paste any email, pitch, message, or speech. We grade real knowledge depth from 0–100.
                </SizableText>
              </YStack>
            </Animated.View>

            {/* Scan usage bar */}
            <Animated.View entering={FadeInDown.delay(100).duration(500)}>
              <XStack paddingHorizontal="$4" marginBottom="$3">
                <Card flex={1} padding="$3" backgroundColor="$color3" borderRadius="$4" borderWidth={1} borderColor="$color5">
                  <XStack alignItems="center" justifyContent="space-between">
                    <XStack gap="$2" alignItems="center">
                      <Activity size={16} color="$accent9" />
                      <SizableText size="$2" color="$color11">
                        {isProUser
                          ? 'Pro · Unlimited scans active'
                          : `${scansLeft} of ${FREE_LIMIT} free scans remaining this month`}
                      </SizableText>
                    </XStack>
                    {!isProUser && scansLeft === 0 && (
                      <Button size="$1" backgroundColor="$accent9" color="$accent1" onPress={() => router.push('/paywall')}>
                        Upgrade
                      </Button>
                    )}
                  </XStack>
                </Card>
              </XStack>
            </Animated.View>

            {/* Input + Analyze button */}
            <Animated.View entering={FadeInDown.delay(200).duration(500)}>
              <YStack paddingHorizontal="$4" gap="$3">
                <TextAnalyzerInput
                  value={text}
                  onChangeText={setText}
                  isAuthenticated={isAuthenticated}
                  onSignInRequired={() => router.push('/auth')}
                  disabled={analyzing}
                />
                <Button
                  size="$5"
                  backgroundColor={text.trim().length >= 20 ? '$accent9' : '$color5'}
                  color={text.trim().length >= 20 ? '$accent1' : '$color9'}
                  borderRadius="$4"
                  onPress={handleAnalyze}
                  disabled={analyzing || text.trim().length < 20}
                  icon={analyzing ? <Spinner color="$accent1" /> : <Sparkles size={18} color={text.trim().length >= 20 ? '$accent1' : '$color9'} />}
                  pressStyle={{ scale: 0.98 }}
                  animation="quick"
                >
                  {analyzing ? 'Analyzing knowledge depth…' : isAuthenticated ? 'Analyze Credibility' : 'Sign in to Analyze'}
                </Button>
              </YStack>
            </Animated.View>

            {/* Sample texts */}
            <Animated.View entering={FadeIn.delay(400).duration(600)}>
              <YStack paddingHorizontal="$4" paddingTop="$6" gap="$3">
                <XStack alignItems="center" gap="$2">
                  <Zap size={16} color="$accent9" />
                  <SizableText size="$4" fontWeight="700" color="$color12">Try a sample</SizableText>
                </XStack>
                <SizableText size="$2" color="$color10">
                  Tap any example to see the scoring system in action
                </SizableText>

                <YStack gap="$2">
                  {samples.slice(0, 6).map((s, i) => (
                    <Animated.View key={s.id} entering={FadeInDown.delay(500 + i * 60).duration(400)}>
                      <Card
                        padding="$3"
                        backgroundColor="$color2"
                        borderRadius="$4"
                        borderWidth={1}
                        borderColor="$color4"
                        pressStyle={{ scale: 0.98, backgroundColor: '$color3' }}
                        animation="quick"
                        onPress={() => setText(s.full_text)}
                      >
                        <XStack justifyContent="space-between" alignItems="flex-start" gap="$3">
                          <YStack flex={1} gap="$1">
                            <SizableText size="$1" color="$color9" textTransform="uppercase" letterSpacing={1}>
                              {s.category}
                            </SizableText>
                            <SizableText size="$3" fontWeight="700" color="$color12">{s.title}</SizableText>
                            <SizableText size="$2" color="$color10" numberOfLines={2}>{s.excerpt}</SizableText>
                          </YStack>
                          <YStack alignItems="center" justifyContent="center" gap="$1">
                            <YStack
                              width={44} height={44} borderRadius={22}
                              alignItems="center" justifyContent="center"
                              backgroundColor={`${getScoreColor(s.overall_score)}20`}
                              borderWidth={2} borderColor={getScoreColor(s.overall_score)}
                            >
                              <SizableText fontSize={15} fontWeight="800" color={getScoreColor(s.overall_score)}>
                                {s.overall_score}
                              </SizableText>
                            </YStack>
                            <ChevronRight size={14} color="$color9" />
                          </YStack>
                        </XStack>
                      </Card>
                    </Animated.View>
                  ))}
                </YStack>
              </YStack>
            </Animated.View>

            {/* Footer methodology note */}
            <YStack paddingHorizontal="$4" paddingTop="$6" gap="$2" opacity={0.7}>
              <SizableText size="$1" color="$color9" textAlign="center">
                Cognitive Friction Matrix: Technical Specificity (35%) · Structural Anchoring (25%) ·
                Camouflage Detection (20%) · Logical Coherence (20%)
              </SizableText>
            </YStack>
          </ScrollView>
        </KeyboardAvoidingView>
      </YStack>
    </SafeArea>
  );
}

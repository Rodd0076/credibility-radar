import React from 'react';
import { ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  SizableText,
  Card,
  SafeArea,
  Button,
  Spinner,
} from '@blinkdotnew/mobile-ui';
import { ArrowLeft, History as HistoryIcon, ChevronRight } from '@blinkdotnew/mobile-ui';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useHistory } from '@/hooks/useAnalyses';
import { getScoreColor } from '@/lib/types';

export default function HistoryScreen() {
  const router = useRouter();
  const { data: analyses = [], isLoading, isError, error, refetch } = useHistory();

  return (
    <SafeArea>
      <YStack flex={1} backgroundColor="$background">
        <XStack paddingHorizontal="$3" paddingTop="$2" paddingBottom="$2" alignItems="center" gap="$2">
          <Button size="$3" chromeless circular icon={<ArrowLeft size={20} color="$color12" />} onPress={() => router.back()} />
          <SizableText size="$5" fontWeight="800" color="$color12">History</SizableText>
        </XStack>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <YStack alignItems="center" paddingTop="$10"><Spinner color="$accent9" /></YStack>
          ) : isError ? (
            <YStack alignItems="center" paddingTop="$10" gap="$3">
              <SizableText size="$4" fontWeight="700" color="$color12">History could not load</SizableText>
              <SizableText size="$2" color="$color10" textAlign="center">
                {error instanceof Error ? error.message : 'Check your connection and try again.'}
              </SizableText>
              <Button onPress={() => refetch()} backgroundColor="$accent9" color="$accent1">Try again</Button>
            </YStack>
          ) : analyses.length === 0 ? (
            <YStack alignItems="center" paddingTop="$10" gap="$3">
              <YStack width={64} height={64} borderRadius={32} backgroundColor="$color3" alignItems="center" justifyContent="center">
                <HistoryIcon size={28} color="$color9" />
              </YStack>
              <SizableText size="$5" fontWeight="700" color="$color12">No scans yet</SizableText>
              <SizableText size="$3" color="$color10" textAlign="center" paddingHorizontal="$5">
                Your analyzed communications will appear here for easy reference.
              </SizableText>
              <Button marginTop="$3" backgroundColor="$accent9" color="$accent1" onPress={() => router.replace('/')}>
                Start Analyzing
              </Button>
            </YStack>
          ) : (
            <YStack gap="$2">
              {analyses.map((a, i) => (
                <Animated.View key={a.id} entering={FadeInDown.delay(i * 40).duration(400)}>
                  <Pressable
                    onPress={() => router.push({
                      pathname: '/result',
                      params: {
                        id: a.id,
                        score: String(a.overall_score),
                        tech: String(a.technical_score),
                        struct: String(a.structural_score),
                        camo: String(a.camouflage_score),
                        coh: String(a.coherence_score),
                        tier: a.tier,
                        summary: a.summary || '',
                        fluff: JSON.stringify(a.fluff_phrases),
                        strengths: JSON.stringify(a.strengths),
                        text: a.input_text,
                      },
                    })}
                  >
                    <Card padding="$3" backgroundColor="$color2" borderRadius="$4" borderWidth={1} borderColor="$color4" pressStyle={{ scale: 0.98 }}>
                      <XStack gap="$3" alignItems="center">
                        <YStack
                          width={48} height={48} borderRadius={24}
                          backgroundColor={`${getScoreColor(a.overall_score)}20`}
                          borderWidth={2} borderColor={getScoreColor(a.overall_score)}
                          alignItems="center" justifyContent="center"
                        >
                          <SizableText fontSize={16} fontWeight="800" color={getScoreColor(a.overall_score)}>
                            {a.overall_score}
                          </SizableText>
                        </YStack>
                        <YStack flex={1} gap="$1">
                          <SizableText size="$2" color={getScoreColor(a.overall_score)} fontWeight="700">
                            {a.tier}
                          </SizableText>
                          <SizableText size="$2" color="$color11" numberOfLines={2}>
                            {a.input_text.slice(0, 100)}
                          </SizableText>
                        </YStack>
                        <ChevronRight size={18} color="$color9" />
                      </XStack>
                    </Card>
                  </Pressable>
                </Animated.View>
              ))}
            </YStack>
          )}
        </ScrollView>
      </YStack>
    </SafeArea>
  );
}

import React, { useCallback, useEffect, useState } from 'react';
import { TextInput, Platform, Pressable } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Button, YStack, XStack, SizableText, Spinner, toast } from '@blinkdotnew/mobile-ui';
import { Clipboard as ClipboardIcon, Mic, Pause, Trash2 } from '@blinkdotnew/mobile-ui';
import { MAX_ANALYSIS_LENGTH } from '@/lib/analyze';
import { useVoiceTranscription } from '@/hooks/useVoiceTranscription';

interface Props {
  value: string;
  onChangeText: (t: string) => void;
  isAuthenticated: boolean;
  onSignInRequired: () => void;
  disabled?: boolean;
}

export function TextAnalyzerInput({ value, onChangeText, isAuthenticated, onSignInRequired, disabled }: Props) {
  const [focused, setFocused] = useState(false);
  const chars = value.length;
  const minChars = 20;
  const appendTranscript = useCallback((transcript: string) => {
    const existing = value.trim();
    const combined = `${existing}${existing ? '\n\n' : ''}${transcript}`;
    onChangeText(combined.slice(0, MAX_ANALYSIS_LENGTH));
    toast('Transcript added', { message: 'Review the text, then run your analysis.', variant: 'success' });
  }, [onChangeText, value]);
  const { state: voiceState, error: voiceError, startRecording, stopRecording } =
    useVoiceTranscription(appendTranscript, isAuthenticated && !disabled);

  useEffect(() => {
    if (voiceError) toast('Voice input failed', { message: voiceError, variant: 'error' });
  }, [voiceError]);

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) onChangeText(text.slice(0, MAX_ANALYSIS_LENGTH));
    } catch {}
  };

  const handleVoicePress = () => {
    if (voiceState === 'recording') {
      void stopRecording();
    } else if (!isAuthenticated) {
      onSignInRequired();
    } else {
      void startRecording();
    }
  };

  return (
    <YStack
      backgroundColor="$color2"
      borderRadius="$4"
      borderWidth={1}
      borderColor={focused ? '$accent9' : '$color5'}
      padding="$3"
      gap="$2"
      animation="quick"
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Paste an email, pitch, message, or transcript here…"
        placeholderTextColor="rgba(255,255,255,0.35)"
        multiline
        maxLength={MAX_ANALYSIS_LENGTH}
        editable={!disabled}
        textAlignVertical="top"
        style={{
          minHeight: 160,
          maxHeight: 280,
          color: '#fff',
          fontSize: 15,
          lineHeight: 22,
          padding: 0,
          fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
          ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
        }}
      />
      <XStack justifyContent="space-between" alignItems="center" paddingTop="$2" borderTopWidth={1} borderTopColor="$color4">
        <SizableText size="$1" color={chars >= minChars ? '$accent9' : '$color9'}>
          {chars === 0 ? `${minChars} chars min` : `${chars} characters`}
        </SizableText>
        <XStack gap="$2" alignItems="center">
          <Button
            size="$3"
            chromeless
            paddingHorizontal="$2"
            disabled={disabled || voiceState === 'transcribing'}
            onPress={handleVoicePress}
            icon={voiceState === 'recording'
              ? <Pause size={14} color="$red9" />
              : voiceState === 'transcribing'
                ? <Spinner size="small" color="$accent9" />
                : <Mic size={16} color="$accent9" />}
          >
            {voiceState === 'recording' ? 'Stop' : voiceState === 'transcribing' ? 'Transcribing…' : 'Record voice'}
          </Button>
          {chars > 0 && (
            <Pressable onPress={() => onChangeText('')} hitSlop={8}>
              <XStack gap="$1" alignItems="center">
                <Trash2 size={13} color="$color10" />
                <SizableText size="$1" color="$color10">Clear</SizableText>
              </XStack>
            </Pressable>
          )}
          <Pressable onPress={handlePaste} hitSlop={8}>
            <XStack gap="$1" alignItems="center">
              <ClipboardIcon size={13} color="$accent9" />
              <SizableText size="$1" color="$accent9" fontWeight="600">Paste</SizableText>
            </XStack>
          </Pressable>
        </XStack>
      </XStack>
      <SizableText size="$1" color="$color9">
        Up to 90 seconds of speech; your transcript is added here for review.
      </SizableText>
    </YStack>
  );
}

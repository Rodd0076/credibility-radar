import React, { useState } from 'react';
import { Platform, KeyboardAvoidingView, TextInput, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  YStack,
  XStack,
  SizableText,
  Button,
  Spinner,
  SafeArea,
  toast,
} from '@blinkdotnew/mobile-ui';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Radar, AlertCircle, CheckCircle2 } from '@blinkdotnew/mobile-ui';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { blink } from '@/lib/blink';

type Mode = 'signin' | 'signup';

// RFC-5322-lite email regex — practical, not pedantic
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateEmail(raw: string): string | null {
  const v = raw.trim();
  if (!v) return 'Email is required.';
  if (v.length > 254) return 'Email is too long.';
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address.';
  return null;
}

interface PwCheck {
  ok: boolean;
  length: boolean;
  letter: boolean;
  number: boolean;
  notCommon: boolean;
  score: 0 | 1 | 2 | 3 | 4;
  message: string | null;
}

const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890',
  'qwerty123', 'qwertyuiop', 'iloveyou', 'admin123', 'welcome1', 'letmein1',
  'abc12345', 'monkey123', 'football', 'baseball', 'sunshine', 'princess',
]);

function checkPassword(pw: string, mode: Mode): PwCheck {
  const length = pw.length >= 8;
  const letter = /[A-Za-z]/.test(pw);
  const number = /\d/.test(pw);
  const notCommon = !COMMON_PASSWORDS.has(pw.toLowerCase());

  // strength score: 0-4
  let score: 0 | 1 | 2 | 3 | 4 = 0;
  if (pw.length >= 8) score = (score + 1) as 1;
  if (pw.length >= 12) score = (score + 1) as 2;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score = (score + 1) as 3;
  if (/[^A-Za-z0-9]/.test(pw) || (letter && number)) score = (score + 1) as 4;
  if (score > 4) score = 4;

  // sign-in is lenient — just require non-empty
  if (mode === 'signin') {
    if (!pw) return { ok: false, length, letter, number, notCommon, score, message: 'Password is required.' };
    return { ok: true, length, letter, number, notCommon, score, message: null };
  }

  // sign-up is strict
  if (!pw) return { ok: false, length, letter, number, notCommon, score, message: 'Password is required.' };
  if (!length) return { ok: false, length, letter, number, notCommon, score, message: 'At least 8 characters.' };
  if (!letter) return { ok: false, length, letter, number, notCommon, score, message: 'Add at least one letter.' };
  if (!number) return { ok: false, length, letter, number, notCommon, score, message: 'Add at least one number.' };
  if (!notCommon) return { ok: false, length, letter, number, notCommon, score, message: 'Too common — choose a stronger password.' };
  return { ok: true, length, letter, number, notCommon, score, message: null };
}

const STRENGTH_LABELS = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
const STRENGTH_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];

export default function AuthScreen() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [pwTouched, setPwTouched] = useState(false);

  const emailError = emailTouched ? validateEmail(email) : null;
  const pwCheck = checkPassword(password, mode);
  const pwError = pwTouched ? pwCheck.message : null;
  const formValid = validateEmail(email) === null && pwCheck.ok;

  const handleSubmit = async () => {
    // Mark fields as touched so errors display
    setEmailTouched(true);
    setPwTouched(true);

    const emailMsg = validateEmail(email);
    if (emailMsg) {
      toast('Invalid email', { message: emailMsg, variant: 'error' });
      return;
    }
    if (!pwCheck.ok) {
      toast('Password issue', { message: pwCheck.message || 'Check your password.', variant: 'error' });
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        await blink.auth.signUp({ email: email.trim(), password });
        toast('Account created!', { message: 'Welcome to Credibility Radar.', variant: 'success' });
      } else {
        await blink.auth.signInWithEmail(email.trim(), password);
        toast('Signed in', { message: 'Welcome back.', variant: 'success' });
      }
      if (redirect) {
        router.replace(redirect as any);
      } else {
        router.back();
      }
    } catch (e: any) {
      const msg = e?.message || 'Authentication failed.';
      toast('Error', { message: msg, variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (focused: boolean): any => ({
    flex: 1,
    color: '#fff',
    fontSize: 16,
    padding: 0,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  });

  const containerStyle = (focused: boolean) => ({
    backgroundColor: focused ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: focused ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  });

  return (
    <SafeArea>
      <YStack flex={1} backgroundColor="$background">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <XStack paddingHorizontal="$4" paddingTop="$3">
              <Button size="$3" chromeless circular icon={<ArrowLeft size={20} color="$color12" />} onPress={() => router.back()} />
            </XStack>

            <Animated.View entering={FadeIn.duration(400)}>
              <YStack paddingHorizontal="$5" paddingTop="$6" gap="$2">
                <YStack
                  width={56} height={56} borderRadius={14}
                  backgroundColor="rgba(255,255,255,0.06)"
                  alignItems="center" justifyContent="center"
                  marginBottom="$3"
                >
                  <Radar size={28} color="$accent9" />
                </YStack>
                <SizableText fontSize={32} fontWeight="800" color="$color12" lineHeight={38}>
                  {mode === 'signin' ? 'Welcome back' : 'Create account'}
                </SizableText>
                <SizableText size="$3" color="$color10">
                  {mode === 'signin'
                    ? 'Sign in to access your Pro features and analysis history.'
                    : 'Join to unlock Pro features and sync your analyses across devices.'}
                </SizableText>
              </YStack>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(150).duration(500)}>
              <YStack paddingHorizontal="$5" paddingTop="$6" gap="$3">
                {/* Mode Toggle */}
                <YStack
                  backgroundColor="rgba(255,255,255,0.04)"
                  borderRadius="$4"
                  padding="$1"
                  flexDirection="row"
                >
                  {(['signin', 'signup'] as Mode[]).map((m) => (
                    <Pressable
                      key={m}
                      style={{ flex: 1 }}
                      onPress={() => { setMode(m); setPwTouched(false); setEmailTouched(false); }}
                    >
                      <YStack
                        paddingVertical="$2"
                        alignItems="center"
                        borderRadius="$3"
                        backgroundColor={mode === m ? 'rgba(255,255,255,0.1)' : 'transparent'}
                      >
                        <SizableText
                          size="$3"
                          fontWeight={mode === m ? '700' : '400'}
                          color={mode === m ? '$color12' : '$color9'}
                        >
                          {m === 'signin' ? 'Sign In' : 'Sign Up'}
                        </SizableText>
                      </YStack>
                    </Pressable>
                  ))}
                </YStack>

                {/* Email */}
                <YStack gap="$1">
                  <SizableText size="$2" color="$color10" fontWeight="600" marginBottom={4}>
                    Email
                  </SizableText>
                  <YStack
                    style={{
                      ...containerStyle(emailFocused),
                      borderColor: emailError
                        ? 'rgba(239,68,68,0.6)'
                        : emailFocused
                        ? 'rgba(255,255,255,0.25)'
                        : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <Mail size={18} color={emailError ? '#ef4444' : emailFocused ? '#fff' : 'rgba(255,255,255,0.4)'} />
                    <TextInput
                      value={email}
                      onChangeText={(t) => { setEmail(t); if (emailTouched) { /* keep validating */ } }}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => { setEmailFocused(false); setEmailTouched(true); }}
                      placeholder="you@example.com"
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                      textContentType="emailAddress"
                      style={inputStyle(emailFocused)}
                      editable={!loading}
                      maxLength={254}
                    />
                  </YStack>
                  {emailError ? (
                    <XStack gap="$1" alignItems="center" paddingTop={4}>
                      <AlertCircle size={12} color="#ef4444" />
                      <SizableText size="$1" color="#ef4444">{emailError}</SizableText>
                    </XStack>
                  ) : null}
                </YStack>

                {/* Password */}
                <YStack gap="$1">
                  <SizableText size="$2" color="$color10" fontWeight="600" marginBottom={4}>
                    Password
                  </SizableText>
                  <YStack
                    style={{
                      ...containerStyle(pwFocused),
                      borderColor: pwError
                        ? 'rgba(239,68,68,0.6)'
                        : pwFocused
                        ? 'rgba(255,255,255,0.25)'
                        : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <Lock size={18} color={pwError ? '#ef4444' : pwFocused ? '#fff' : 'rgba(255,255,255,0.4)'} />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setPwFocused(true)}
                      onBlur={() => { setPwFocused(false); setPwTouched(true); }}
                      placeholder={mode === 'signup' ? 'Min. 8 chars, letters + numbers' : 'Your password'}
                      placeholderTextColor="rgba(255,255,255,0.3)"
                      secureTextEntry={!showPw}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete={mode === 'signup' ? 'password-new' : 'password'}
                      textContentType={mode === 'signup' ? 'newPassword' : 'password'}
                      style={inputStyle(pwFocused)}
                      editable={!loading}
                      maxLength={128}
                    />
                    <Pressable onPress={() => setShowPw((v) => !v)} hitSlop={8}>
                      {showPw
                        ? <EyeOff size={18} color="rgba(255,255,255,0.4)" />
                        : <Eye size={18} color="rgba(255,255,255,0.4)" />
                      }
                    </Pressable>
                  </YStack>

                  {/* Sign-up: strength bar + checklist */}
                  {mode === 'signup' && password.length > 0 ? (
                    <YStack gap="$2" paddingTop={6}>
                      <XStack gap={4} alignItems="center">
                        {[0, 1, 2, 3].map((i) => (
                          <YStack
                            key={i}
                            flex={1}
                            height={4}
                            borderRadius={2}
                            backgroundColor={
                              i < pwCheck.score ? STRENGTH_COLORS[pwCheck.score - 1] : 'rgba(255,255,255,0.08)'
                            }
                          />
                        ))}
                        <SizableText
                          size="$1"
                          color={pwCheck.score > 0 ? STRENGTH_COLORS[pwCheck.score - 1] : '$color9'}
                          fontWeight="600"
                          minWidth={70}
                          textAlign="right"
                        >
                          {pwCheck.score > 0 ? STRENGTH_LABELS[pwCheck.score - 1] : ''}
                        </SizableText>
                      </XStack>
                      <YStack gap={2}>
                        <PwRequirement met={pwCheck.length} label="At least 8 characters" />
                        <PwRequirement met={pwCheck.letter} label="Contains a letter" />
                        <PwRequirement met={pwCheck.number} label="Contains a number" />
                        <PwRequirement met={pwCheck.notCommon && password.length >= 8} label="Not a common password" />
                      </YStack>
                    </YStack>
                  ) : null}

                  {/* Inline error (signin or after blur) */}
                  {pwError && !(mode === 'signup' && password.length > 0) ? (
                    <XStack gap="$1" alignItems="center" paddingTop={4}>
                      <AlertCircle size={12} color="#ef4444" />
                      <SizableText size="$1" color="#ef4444">{pwError}</SizableText>
                    </XStack>
                  ) : null}
                </YStack>

                {/* Submit */}
                <Button
                  size="$5"
                  marginTop="$2"
                  backgroundColor={formValid ? '$accent9' : 'rgba(255,255,255,0.08)'}
                  color={formValid ? '$accent1' : '$color9'}
                  borderRadius="$4"
                  onPress={handleSubmit}
                  disabled={loading || !formValid}
                  opacity={loading || !formValid ? 0.7 : 1}
                  icon={loading ? <Spinner color="$accent1" /> : undefined}
                  pressStyle={{ scale: 0.98 }}
                  animation="quick"
                >
                  {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                </Button>

                {/* Toggle hint */}
                <XStack justifyContent="center" gap="$2" paddingTop="$2">
                  <SizableText size="$2" color="$color9">
                    {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
                  </SizableText>
                  <Pressable onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
                    <SizableText size="$2" color="$accent9" fontWeight="600">
                      {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                    </SizableText>
                  </Pressable>
                </XStack>
              </YStack>
            </Animated.View>

            <YStack flex={1} />

            <YStack paddingHorizontal="$5" paddingTop="$4">
              <SizableText size="$1" color="$color8" textAlign="center" lineHeight={18}>
                By continuing, you agree to our{' '}
                <SizableText
                  size="$1"
                  color="$accent9"
                  onPress={() => router.push('/legal/terms' as any)}
                >
                  Terms of Service
                </SizableText>
                {' '}and{' '}
                <SizableText
                  size="$1"
                  color="$accent9"
                  onPress={() => router.push('/legal/privacy' as any)}
                >
                  Privacy Policy
                </SizableText>
                .{'\n'}Your data is encrypted and never sold.
              </SizableText>
            </YStack>
          </ScrollView>
        </KeyboardAvoidingView>
      </YStack>
    </SafeArea>
  );
}

function PwRequirement({ met, label }: { met: boolean; label: string }) {
  return (
    <XStack gap={6} alignItems="center">
      {met
        ? <CheckCircle2 size={12} color="#22c55e" />
        : <AlertCircle size={12} color="rgba(255,255,255,0.25)" />
      }
      <SizableText
        size="$1"
        color={met ? '#22c55e' : 'rgba(255,255,255,0.4)'}
      >
        {label}
      </SizableText>
    </XStack>
  );
}

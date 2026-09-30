import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  BlinkProvider,
  createTamagui,
  tamaguiDefaultConfig,
  Theme,
  BlinkToastProvider,
  getBlinkThemePalettes,
} from '@blinkdotnew/mobile-ui';
import { createThemes } from '@tamagui/config/v5';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { initializePayments, identifyUser, resetUser } from '@/lib/payments';
import { blink } from '@/lib/blink';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const palettes = getBlinkThemePalettes('obsidian');
const customThemes = createThemes({
  base: { palette: palettes.base },
  accent: { palette: palettes.accent },
});

const config = createTamagui({ ...tamaguiDefaultConfig, themes: customThemes as any });

function WebStyleReset() {
  if (Platform.OS !== 'web') return null;
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: 'input:focus,textarea:focus{outline:none!important}',
      }}
    />
  );
}

export default function RootLayout() {
  useFrameworkReady();

  // Initialize RevenueCat once at app start, and re-identify on auth changes
  useEffect(() => {
    initializePayments();
    const unsub = blink.auth.onAuthStateChanged((state) => {
      if (state.user?.id) {
        identifyUser(state.user.id);
      } else if (!state.isLoading) {
        resetUser();
      }
    });
    return unsub;
  }, []);

  return (
    <BlinkProvider config={config} defaultTheme="dark">
      <Theme name="dark">
        <QueryClientProvider client={queryClient}>
          <BlinkToastProvider>
            <WebStyleReset />
            <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="result" />
              <Stack.Screen name="history" />
              <Stack.Screen name="paywall" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="legal/privacy" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="legal/terms" options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </BlinkToastProvider>
        </QueryClientProvider>
      </Theme>
    </BlinkProvider>
  );
}

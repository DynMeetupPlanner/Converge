import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';

export const unstable_settings = {
  anchor: '(auth)',
};

import { AuthProvider } from '@/context/AuthContext';
import { PlanProvider } from '@/context/PlanContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AppErrorBoundary>
      <AuthProvider>
        <PlanProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen name="(app)" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </PlanProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
}

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '@/components/AuthContext.js';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ActivityIndicator, View } from 'react-native';
import { Colors } from '@/constants/theme';

function LayoutWithAuth() {
  const { token, loading } = useAuth();
  
  if (loading) {
    return (
      <View>
      <ActivityIndicator />
      </View>
    );
    
  }

  return (
    <Stack>
      {token ? (
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      )}
    </Stack>
  );
}

export default function RootLayout() {
    const theme = useColorScheme();


  return (
   <View style={{ flex:1,backgroundColor: Colors[theme].background }}>

    <AuthProvider>
      <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
        <LayoutWithAuth />      
      </ThemeProvider>
    </AuthProvider>
        </View>

  );
}

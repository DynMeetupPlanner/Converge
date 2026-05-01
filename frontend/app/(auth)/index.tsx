import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import { AuthStyle } from '../styles/AuthStyle';
import { useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import { API_URL } from '@/lib/api';



export default function HomeScreen() {
  console.log("API_URL:", API_URL);
  const theme = useColorScheme();
  const styles = AuthStyle(theme);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login ,token} = useAuth();

  const handleLogin = async () => {
  if (!email || !password) {
    setError("All fields required");
    return;
  }

  
  try {
    const res = await fetch(`${API_URL}/Auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.msg || "Login failed");
      return;
    }

    if (res.ok) {
      await login(data.token);
      
    }
    console.log("Success:", data);
    setError('');

  } catch (err) {
    console.log("Network error:", err);
  }
};

  return (
  <View style={{ flex: 1, backgroundColor: Colors[theme].background }}>
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors[theme].background }}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
        paddingTop: 5,
        paddingBottom: Platform.OS === 'android' ? 180 : 24,
      }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="none"
      showsVerticalScrollIndicator={false}
      scrollEnabled
    >
      <Text style={styles.title}>Converge</Text>
      <Text style={styles.subtitle}>
        <Text style={styles.mintitle}>Sign in</Text> to find your perfect meeting spots
      </Text>

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholderTextColor={Colors[theme].placeholder}
        selectionColor={Colors[theme].primary}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholderTextColor={Colors[theme].placeholder}
        selectionColor={Colors[theme].primary}
      />

      {error ? (
        <Text style={{ color: '#e11d48', marginBottom: 10, textAlign: 'center' }}>
          {error}
        </Text>
      ) : null}

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        Don't have an account?{' '}
        <Text
          style={styles.link}
          onPress={() => router.replace('/register')}
        >
          Sign up
        </Text>
      </Text>
    </ScrollView>
  </View>
  );
}

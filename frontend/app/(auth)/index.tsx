import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Modal,
  ActivityIndicator,  
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { GradientBackground } from '@/components/GradientBackground';
import { s } from '../../tempStyles/AuthStyle';

// 🎨 Theme
const C = {
  bg: '#08090E',
  card: '#141720',
  border: '#1E2235',
  accent: '#6C7FFF',
  accentSoft: 'rgba(108,127,255,0.12)',
  red: '#FF5C72',
  text: '#EDF0FF',
  textMuted: '#3E4460',
  textSub: '#8B91B0',
  white: '#FFFFFF',
};

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [isForgotModalVisible, setIsForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('All fields required');
      return;
    }

    try {
      const res = await fetch('https://sturdy-goggles-123083387827.asia-south1.run.app/Auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.msg || 'Login failed');
        return;
      }

      if (data.user) await login(data.user);

      setError('');
      router.replace('/home');
    } catch {
      setError('Network error. Please try again.');
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={s.root}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={s.scroll}>

            {/* ── Header ── */}
            <View style={s.header}>
              <View style={s.logo}>
                <Ionicons name="git-merge" size={36} color={C.accent} />
              </View>
              <Text style={s.title}>CONVERGE</Text>
              <Text style={s.subtitle}>Meet in the middle — fair for everyone</Text>
            </View>

            {/* ── Card ── */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Welcome Back</Text>

              <View style={s.input}>
                <Ionicons name="mail-outline" size={16} color={C.textMuted} />
                <TextInput
                  placeholder="Email"
                  placeholderTextColor={C.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  style={s.inputText}
                />
              </View>

              <View style={s.input}>
                <Ionicons name="lock-closed-outline" size={16} color={C.textMuted} />
                <TextInput
                  placeholder="Password"
                  secureTextEntry
                  placeholderTextColor={C.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  style={s.inputText}
                />
              </View>

              {error ? (
                <View style={s.errorBox}>
                  <Text style={s.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={() => setIsForgotModalVisible(true)}
                style={s.forgot}
              >
                <Text style={s.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.button} onPress={handleLogin}>
                {loading
                  ? <ActivityIndicator color={C.white} />
                  : <Text style={s.buttonText}>Sign In</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.replace('/register')}>
                <Text style={s.footer}>
                  Don’t have an account? <Text style={s.link}>Sign up</Text>
                </Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>

        {/* ── Modal ── */}
        <Modal visible={isForgotModalVisible} transparent animationType="slide">
          <View style={s.modalBackdrop}>
            <View style={s.modal}>
              <Text style={s.modalTitle}>Reset Password</Text>

              <TextInput
                placeholder="Enter email"
                placeholderTextColor={C.textMuted}
                value={forgotEmail}
                onChangeText={setForgotEmail}
                style={s.input}
              />

              <TouchableOpacity style={s.button}>
                <Text style={s.buttonText}>Send OTP</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setIsForgotModalVisible(false)}>
                <Text style={s.cancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </GradientBackground>
  );
}

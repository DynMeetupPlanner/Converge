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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { GradientBackground } from '@/components/GradientBackground';
import { s } from '../../tempStyles/AuthStyle';
import { API_URL } from '@/lib/api';

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

const API_BASE = API_URL || 'https://sturdy-goggles-123083387827.asia-south1.run.app';
type ForgotStep = 'request' | 'verify';

export default function LoginScreen() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [isForgotModalVisible, setIsForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<ForgotStep>('request');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotInfo, setForgotInfo] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const resetForgotState = () => {
    setForgotEmail('');
    setForgotStep('request');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setForgotError('');
    setForgotInfo('');
    setForgotLoading(false);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('All fields required');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/Auth/login`, {
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
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    const normalizedEmail = forgotEmail.trim().toLowerCase();
    if (!normalizedEmail) {
      setForgotError('Email is required');
      return;
    }

    setForgotError('');
    setForgotInfo('');

    try {
      setForgotLoading(true);
      const res = await fetch(`${API_BASE}/Auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        setForgotError(data.msg || 'Could not send reset code');
        return;
      }

      setForgotStep('verify');
      setForgotInfo(data.msg || 'If an account exists for this email, a reset code has been sent');
    } catch {
      setForgotError('Network error. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const normalizedEmail = forgotEmail.trim().toLowerCase();
    if (!normalizedEmail || !otp.trim() || !newPassword || !confirmPassword) {
      setForgotError('All fields are required');
      return;
    }
    if (newPassword.length < 8) {
      setForgotError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match');
      return;
    }

    setForgotError('');
    setForgotInfo('');

    try {
      setForgotLoading(true);
      const res = await fetch(`${API_BASE}/Auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          otp: otp.trim(),
          newPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setForgotError(data.msg || 'Could not reset password');
        return;
      }

      setForgotInfo('Password reset successful. You can now sign in.');
      setForgotStep('request');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setForgotError('Network error. Please try again.');
    } finally {
      setForgotLoading(false);
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
            <View style={s.header}>
              <View style={s.logo}>
                <Ionicons name="git-merge" size={36} color={C.accent} />
              </View>
              <Text style={s.title}>CONVERGE</Text>
              <Text style={s.subtitle}>Meet in the middle - fair for everyone</Text>
            </View>

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
                  keyboardType="email-address"
                  autoCapitalize="none"
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
                onPress={() => {
                  setIsForgotModalVisible(true);
                  setForgotStep('request');
                  setForgotError('');
                  setForgotInfo('');
                }}
                style={s.forgot}
              >
                <Text style={s.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.button} onPress={handleLogin} disabled={loading}>
                {loading
                  ? <ActivityIndicator color={C.white} />
                  : <Text style={s.buttonText}>Sign In</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.replace('/register')}>
                <Text style={s.footer}>
                  Do not have an account? <Text style={s.link}>Sign up</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <Modal visible={isForgotModalVisible} transparent animationType="slide">
          <View style={s.modalBackdrop}>
            <View style={s.modal}>
              <Text style={s.modalTitle}>Reset Password</Text>

              <View style={s.input}>
                <Ionicons name="mail-outline" size={16} color={C.textMuted} />
                <TextInput
                  placeholder="Enter email"
                  placeholderTextColor={C.textMuted}
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                  style={s.inputText}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {forgotStep === 'verify' ? (
                <>
                  <View style={s.input}>
                    <Ionicons name="key-outline" size={16} color={C.textMuted} />
                    <TextInput
                      placeholder="Enter 6-digit OTP"
                      placeholderTextColor={C.textMuted}
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      style={s.inputText}
                    />
                  </View>

                  <View style={s.input}>
                    <Ionicons name="lock-closed-outline" size={16} color={C.textMuted} />
                    <TextInput
                      placeholder="New password (min 8 chars)"
                      placeholderTextColor={C.textMuted}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                      style={s.inputText}
                    />
                  </View>

                  <View style={s.input}>
                    <Ionicons name="lock-closed-outline" size={16} color={C.textMuted} />
                    <TextInput
                      placeholder="Confirm new password"
                      placeholderTextColor={C.textMuted}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      style={s.inputText}
                    />
                  </View>
                </>
              ) : null}

              {forgotError ? (
                <View style={s.errorBox}>
                  <Text style={s.errorText}>{forgotError}</Text>
                </View>
              ) : null}

              {forgotInfo ? (
                <View style={[s.errorBox, { borderColor: C.accent, backgroundColor: C.accentSoft }]}>
                  <Text style={[s.errorText, { color: C.text }]}>{forgotInfo}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={s.button}
                onPress={forgotStep === 'request' ? handleSendOtp : handleResetPassword}
                disabled={forgotLoading}
              >
                {forgotLoading ? (
                  <ActivityIndicator color={C.white} />
                ) : (
                  <Text style={s.buttonText}>{forgotStep === 'request' ? 'Send OTP' : 'Reset Password'}</Text>
                )}
              </TouchableOpacity>

              {forgotStep === 'verify' ? (
                <TouchableOpacity
                  onPress={() => {
                    setForgotStep('request');
                    setForgotError('');
                    setForgotInfo('');
                  }}
                >
                  <Text style={[s.cancel, { color: C.accent }]}>Back to email step</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                onPress={() => {
                  setIsForgotModalVisible(false);
                  resetForgotState();
                }}
              >
                <Text style={s.cancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
}

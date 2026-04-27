import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, Modal, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import { AuthStyle } from '../styles/AuthStyle';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '@/components/GradientBackground';

import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const theme = useColorScheme();
  const styles = AuthStyle(theme);
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password State
  const [isForgotModalVisible, setIsForgotModalVisible] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRequestOTP = async () => {
    if (!forgotEmail) return alert("Enter your email");
    setLoading(true);
    try {
      const res = await fetch('https://sturdy-goggles-1033249426470.asia-south1.run.app/Auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setForgotStep(2);
        alert(data.msg);
      } else {
        alert(data.msg);
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) return alert("Passwords do not match");
    if (newPassword.length < 6) return alert("Password too short");
    setLoading(true);
    try {
      const res = await fetch('https://sturdy-goggles-1033249426470.asia-south1.run.app/Auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Password reset success! Please login.");
        setIsForgotModalVisible(false);
        setForgotStep(1);
        setForgotEmail('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        alert(data.msg);
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("All fields required");
      return;
    }

    try {
      const res = await fetch('https://sturdy-goggles-1033249426470.asia-south1.run.app/Auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.msg || "Login failed");
        return;
      }

      // Save user data to context
      if (data.user) {
        await login(data.user);
      }

      setError('');
      router.replace('/home'); 
    } catch (err) {
      console.log("Network error:", err);
      setError("Network error. Please try again.");
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            padding: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={{ 
              width: 90, 
              height: 90, 
              borderRadius: 28, 
              backgroundColor: Colors[theme].primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20,
              shadowColor: Colors[theme].primary,
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
              elevation: 12,
            }}>
              <Ionicons name="sparkles" size={44} color="#fff" />
            </View>
            <Text style={[styles.title, { fontSize: 32, fontWeight: '800' }]}>Converge</Text>
            <Text style={[styles.subtitle, { opacity: 0.8 }]}>Find your perfect meeting spots</Text>
          </View>

          <View style={styles.glassContainer}>
            <Text style={[styles.mintitle, { textAlign: 'left', marginBottom: 20, fontSize: 24 }]}>Welcome Back</Text>
            
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={Colors[theme].muted} style={{ marginRight: 12 }} />
              <TextInput
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                style={{ flex: 1, color: Colors[theme].inputText, fontSize: 15 }}
                placeholderTextColor={Colors[theme].placeholder}
                selectionColor={Colors[theme].primary}   
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors[theme].muted} style={{ marginRight: 12 }} />
              <TextInput
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={{ flex: 1, color: Colors[theme].inputText, fontSize: 15 }}
                placeholderTextColor={Colors[theme].placeholder}
                selectionColor={Colors[theme].primary}
              />
            </View>

            {error ? (
              <View style={{ backgroundColor: theme === 'light' ? '#fee2e2' : 'rgba(185, 28, 28, 0.2)', padding: 14, borderRadius: 16, marginBottom: 16, marginTop: 14 }}>
                <Text style={{ color: theme === 'light' ? '#b91c1c' : '#fca5a5', textAlign: 'center', fontSize: 14, fontWeight: '600' }}>
                  {error}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity onPress={() => setIsForgotModalVisible(true)} style={{ alignSelf: 'flex-end', marginBottom: 20 }}>
              <Text style={{ color: Colors[theme].primary, fontWeight: '600', fontSize: 14 }}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, { height: 56, justifyContent: 'center', marginTop: 0 }]} onPress={handleLogin} activeOpacity={0.8}>
              <Text style={[styles.buttonText, { fontSize: 18, fontWeight: '700' }]}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.replace('/register')} style={{ marginTop: 24 }}>
              <Text style={[styles.footer, { marginTop: 0 }]}>
                Dont have an account? <Text style={styles.link}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal
        visible={isForgotModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsForgotModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ 
            backgroundColor: Colors[theme].background, 
            borderTopLeftRadius: 32, 
            borderTopRightRadius: 32, 
            padding: 24, 
            paddingBottom: Platform.OS === 'ios' ? 40 : 24,
            minHeight: '50%'
          }}>
            <View style={{ width: 40, height: 5, backgroundColor: Colors[theme].border, borderRadius: 10, alignSelf: 'center', marginBottom: 24 }} />
            
            {forgotStep === 1 && (
              <View>
                <Text style={{ fontSize: 24, fontWeight: '800', color: Colors[theme].text, marginBottom: 12 }}>Forgot Password?</Text>
                <Text style={{ fontSize: 15, color: Colors[theme].muted, marginBottom: 24 }}>Enter your email address and we'll send you an OTP to reset your password.</Text>
                
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color={Colors[theme].muted} style={{ marginRight: 12 }} />
                  <TextInput
                    placeholder="Email Address"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                    style={{ flex: 1, color: Colors[theme].inputText, fontSize: 15 }}
                    placeholderTextColor={Colors[theme].placeholder}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.button, { marginTop: 24, height: 56, justifyContent: 'center' }]}
                  onPress={handleRequestOTP}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
                </TouchableOpacity>
              </View>
            )}

            {forgotStep === 2 && (
              <View>
                <Text style={{ fontSize: 24, fontWeight: '800', color: Colors[theme].text, marginBottom: 12 }}>Verify OTP</Text>
                <Text style={{ fontSize: 15, color: Colors[theme].muted, marginBottom: 24 }}>We've sent a 6-digit code to {forgotEmail}.</Text>
                
                <View style={styles.inputWrapper}>
                  <Ionicons name="key-outline" size={20} color={Colors[theme].muted} style={{ marginRight: 12 }} />
                  <TextInput
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChangeText={setOtp}
                    maxLength={6}
                    keyboardType="number-pad"
                    style={{ flex: 1, color: Colors[theme].inputText, fontSize: 15, letterSpacing: 4 }}
                    placeholderTextColor={Colors[theme].placeholder}
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.button, { marginTop: 24, height: 56, justifyContent: 'center' }]}
                  onPress={() => setForgotStep(3)}
                >
                  <Text style={styles.buttonText}>Verify OTP</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleRequestOTP} style={{ marginTop: 16, alignItems: 'center' }}>
                  <Text style={{ color: Colors[theme].primary, fontWeight: '600' }}>Resend Code</Text>
                </TouchableOpacity>
              </View>
            )}

            {forgotStep === 3 && (
              <View>
                <Text style={{ fontSize: 24, fontWeight: '800', color: Colors[theme].text, marginBottom: 12 }}>New Password</Text>
                <Text style={{ fontSize: 15, color: Colors[theme].muted, marginBottom: 24 }}>Create a secure password for your account.</Text>
                
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color={Colors[theme].muted} style={{ marginRight: 12 }} />
                  <TextInput
                    placeholder="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    style={{ flex: 1, color: Colors[theme].inputText, fontSize: 15 }}
                    placeholderTextColor={Colors[theme].placeholder}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color={Colors[theme].muted} style={{ marginRight: 12 }} />
                  <TextInput
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    style={{ flex: 1, color: Colors[theme].inputText, fontSize: 15 }}
                    placeholderTextColor={Colors[theme].placeholder}
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.button, { marginTop: 24, height: 56, justifyContent: 'center' }]}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </GradientBackground>
  );
}

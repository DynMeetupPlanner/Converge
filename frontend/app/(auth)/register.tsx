import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { GradientBackground } from '@/components/GradientBackground';
import { s, C } from '../styles/AuthStyle';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name || !username || !email || !password || !day || !month || !year || !gender) {
      setError('All fields required');
      return;
    }

    try {
      const dob = new Date(`${year}-${month}-${day}`);

      const res = await fetch('https://sturdy-goggles-1033249426470.asia-south1.run.app/Auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, password, dateOfBirth: dob, gender }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.msg || 'Something went wrong');
        return;
      }

      setError('');
      router.replace('/');
    } catch {
      setError('Network error. Please try again.');
    }
  };

  const getMonthName = (m: string) => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[parseInt(m) - 1];
  };

  return (
    <GradientBackground>
      <SafeAreaView style={s.root}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={s.scroll}>

            {/* 🔙 Back */}
            <TouchableOpacity onPress={() => router.replace('/')} style={{ marginBottom: 20 }}>
              <Ionicons name="arrow-back" size={22} color={C.text} />
            </TouchableOpacity>

            {/* Header */}
            <View style={s.header}>
              <View style={s.logo}>
                <Ionicons name="git-merge" size={36} color={C.accent} />
              </View>
              <Text style={s.title}>CONVERGE</Text>
              <Text style={s.subtitle}>Create your account</Text>
            </View>

            {/* Card */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Sign Up</Text>

              {/* Inputs */}
              <View style={s.input}>
                <Ionicons name="person-outline" size={16} color={C.textMuted} />
                <TextInput
                  placeholder="Full Name"
                  placeholderTextColor={C.textMuted}
                  value={name}
                  onChangeText={setName}
                  style={s.inputText}
                />
              </View>

              <View style={s.input}>
                <Ionicons name="at-outline" size={16} color={C.textMuted} />
                <TextInput
                  placeholder="Username"
                  placeholderTextColor={C.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  style={s.inputText}
                />
              </View>

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

              {/* Gender */}
              <Text style={s.section}>GENDER</Text>
              <View style={s.row}>
                {['male', 'female', 'other'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[s.chip, gender === g && s.chipActive]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[s.chipText, gender === g && s.chipTextActive]}>
                      {g.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* DOB */}
              <Text style={s.section}>DATE OF BIRTH</Text>
              <TouchableOpacity style={s.input} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar-outline" size={16} color={C.textMuted} />
                <Text style={s.inputText}>
                  {day ? `${day} ${getMonthName(month)} ${year}` : 'Select Date'}
                </Text>
              </TouchableOpacity>

              {error ? (
                <View style={s.errorBox}>
                  <Text style={s.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity style={s.button} onPress={handleRegister}>
                <Text style={s.buttonText}>Create Account</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.replace('/')}>
                <Text style={s.footer}>
                  Already have an account? <Text style={s.link}>Sign in</Text>
                </Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>

        {/* ✅ DOB MODAL */}
        <Modal visible={showDatePicker} transparent animationType="slide">
          <View style={s.modalBackdrop}>
            <View style={s.modal}>

              <Text style={s.modalTitle}>Select Date of Birth</Text>

              <View style={s.dobRow}>

                {/* Day */}
                <ScrollView style={s.dobCol} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 31 }, (_, i) => {
                    const d = String(i + 1);
                    return (
                      <TouchableOpacity
                        key={d}
                        onPress={() => setDay(d)}
                        style={[s.dobItem, day === d && s.dobItemActive]}
                      >
                        <Text style={[s.dobText, day === d && s.dobTextActive]}>
                          {d}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Month */}
                <ScrollView style={s.dobCol} showsVerticalScrollIndicator={false}>
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
                    .map((m, i) => {
                      const mv = String(i + 1).padStart(2, '0');
                      return (
                        <TouchableOpacity
                          key={mv}
                          onPress={() => setMonth(mv)}
                          style={[s.dobItem, month === mv && s.dobItemActive]}
                        >
                          <Text style={[s.dobText, month === mv && s.dobTextActive]}>
                            {m}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>

                {/* Year */}
                <ScrollView style={s.dobCol} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 100 }, (_, i) => {
                    const y = String(new Date().getFullYear() - i);
                    return (
                      <TouchableOpacity
                        key={y}
                        onPress={() => setYear(y)}
                        style={[s.dobItem, year === y && s.dobItemActive]}
                      >
                        <Text style={[s.dobText, year === y && s.dobTextActive]}>
                          {y}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

              </View>

              {/* Confirm */}
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                style={s.button}
              >
                <Text style={s.buttonText}>Confirm</Text>
              </TouchableOpacity>

            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </GradientBackground>
  );
}
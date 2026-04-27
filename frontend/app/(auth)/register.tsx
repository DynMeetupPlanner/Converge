import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, Modal } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import { AuthStyle } from '../styles/AuthStyle';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '@/components/GradientBackground';


export default function RegisterScreen() {
  const theme = useColorScheme();
  const styles = AuthStyle(theme);
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
    } catch (err) {
      console.log(err);
      setError('Network error. Please try again.');
    }
  };

  const getMonthName = (m: string) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[parseInt(m) - 1];
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
          padding: 24,
          paddingTop: Platform.OS === 'ios' ? 80 : 60,
          paddingBottom: 40,
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
          <View style={{ gap: 4 }}>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color={Colors[theme].muted} style={{ marginRight: 12 }} />
              <TextInput
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                style={{ flex: 1, color: Colors[theme].inputText, fontSize: 15 }}
                placeholderTextColor={Colors[theme].placeholder}
                selectionColor={Colors[theme].primary}   
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="at-outline" size={20} color={Colors[theme].muted} style={{ marginRight: 12 }} />
              <TextInput
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                style={{ flex: 1, color: Colors[theme].inputText, fontSize: 15 }}
                placeholderTextColor={Colors[theme].placeholder}
                selectionColor={Colors[theme].primary}
              />       
            </View>

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

            <Text style={styles.sectionTitle}>GENDER</Text>
            <View style={styles.genderContainer}>
              {[
                { label: 'Male', value: 'male', icon: 'male-outline' },
                { label: 'Female', value: 'female', icon: 'female-outline' },
                { label: 'Other', value: 'other', icon: 'ellipsis-horizontal-outline' }
              ].map((item) => (
                <TouchableOpacity 
                  key={item.value} 
                  onPress={() => setGender(item.value)}
                  style={[styles.genderButton, gender === item.value && styles.genderButtonActive]}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={item.icon as any} 
                    size={18} 
                    color={gender === item.value ? '#fff' : Colors[theme].muted} 
                  />
                  <Text style={[styles.genderText, gender === item.value && styles.genderTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>DATE OF BIRTH</Text>
            <TouchableOpacity 
              onPress={() => setShowDatePicker(true)}
              style={styles.inputWrapper}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={20} color={Colors[theme].muted} style={{ marginRight: 12 }} />
              <Text style={{ 
                flex: 1, 
                color: (day && month && year) ? Colors[theme].inputText : Colors[theme].placeholder,
                fontSize: 15 
              }}>
                {(day && month && year) ? `${day} ${getMonthName(month)} ${year}` : 'Select Date of Birth'}
              </Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={{ backgroundColor: theme === 'light' ? '#fee2e2' : 'rgba(185, 28, 28, 0.2)', padding: 14, borderRadius: 16, marginBottom: 16, marginTop: 14 }}>
              <Text style={{ color: theme === 'light' ? '#b91c1c' : '#fca5a5', textAlign: 'center', fontSize: 14, fontWeight: '600' }}>
                {error}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity style={[styles.button, { height: 56, justifyContent: 'center', marginTop: 20 }]} onPress={handleRegister} activeOpacity={0.8}>
            <Text style={[styles.buttonText, { fontSize: 18, fontWeight: '700' }]}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/')} style={{ marginTop: 24 }}>
            <Text style={[styles.footer, { marginTop: 0 }]}>
              Already have an account? <Text style={styles.link}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>

    <Modal
      visible={showDatePicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowDatePicker(false)}
    >
      <View style={styles.dobModalOverlay}>
        <View style={styles.dobModalContent}>
          <View style={{ width: 40, height: 5, backgroundColor: Colors[theme].border, borderRadius: 10, alignSelf: 'center', marginBottom: 20 }} />
          <Text style={styles.dobModalTitle}>Select Date of Birth</Text>
          
          <View style={styles.dobContainer}>
            <View style={styles.dobColumn}>
              <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                {Array.from({ length: 31 }, (_, i) => {
                  const d = String(i + 1);
                  return (
                    <TouchableOpacity 
                      key={d} 
                      onPress={() => setDay(d)} 
                      style={[styles.dobItem, day === d && styles.dobItemActive]}
                    >
                      <Text style={[styles.dobText, day === d && styles.dobTextActive]}>{d}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.dobColumn}>
              <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => {
                  const mv = String(i + 1).padStart(2, '0');
                  return (
                    <TouchableOpacity 
                      key={mv} 
                      onPress={() => setMonth(mv)} 
                      style={[styles.dobItem, month === mv && styles.dobItemActive]}
                    >
                      <Text style={[styles.dobText, month === mv && styles.dobTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.dobColumn}>
              <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
                {Array.from({ length: 100 }, (_, i) => {
                  const y = String(new Date().getFullYear() - i);
                  return (
                    <TouchableOpacity 
                      key={y} 
                      onPress={() => setYear(y)} 
                      style={[styles.dobItem, year === y && styles.dobItemActive]}
                    >
                      <Text style={[styles.dobText, year === y && styles.dobTextActive]}>{y}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => setShowDatePicker(false)}
          >
            <Text style={styles.closeButtonText}>Confirm Selection</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  </GradientBackground>
  );
}

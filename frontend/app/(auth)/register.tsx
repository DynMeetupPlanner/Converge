import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import { AuthStyle } from '../styles/AuthStyle';
import { useState } from 'react';


export default function HomeScreen() {
  const theme = useColorScheme();
  const styles = AuthStyle(theme);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name || !username || !email || !password || !day || !month || !year) {
      setError('All fields required');
      return;
    }
    try {
      const dob = new Date(`${year}-${month}-${day}`);
      const res = await fetch('https://sturdy-goggles-1033249426470.asia-south1.run.app/Auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, password, dateOfBirth: dob }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.msg || 'Something went wrong');
        return;
      }

      setError('');
    } catch (err) {
      console.log(err);
    }
  };

  return (
  <View style={{ flex: 1, backgroundColor: Colors[theme].background }}>
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors[theme].background }}
      contentContainerStyle={{
        flexGrow: 1,
        padding: 20,
        paddingTop: 40,
        paddingBottom: Platform.OS === 'android' ? 345 : 24,
      }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="none"
      showsVerticalScrollIndicator={false}
      scrollEnabled
      nestedScrollEnabled
    >
      <View>
      <Text style={styles.title}>Converge</Text>
      <Text style={styles.subtitle}>
        <Text style={styles.mintitle}>Register</Text> to find your perfect meeting spots
      </Text>     

      <TextInput
        placeholder="Username"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholderTextColor={Colors[theme].placeholder}
        selectionColor={Colors[theme].primary}
      />       

      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholderTextColor={Colors[theme].placeholder}
        selectionColor={Colors[theme].primary}   
      />

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
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        placeholderTextColor={Colors[theme].placeholder}
        selectionColor={Colors[theme].primary}
      />

      <Text style={{ marginBottom: 5, color: Colors[theme].text }}>Date of Birth</Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
        
        <View style={[styles.input, { flex: 1, marginRight: 5, height: 100 }]}>
          <ScrollView
            scrollEnabled
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {Array.from({ length: 31 }, (_, i) => (
              <TouchableOpacity key={i+1} onPress={() => setDay(String(i+1))} style={{ paddingVertical: 8, alignItems: 'center', backgroundColor: day == String(i+1) ? Colors[theme].primary : 'transparent', borderRadius: 5, marginBottom: 4 }}>
                <Text style={{ color: day == String(i+1) ? '#fff' : Colors[theme].text }}>{i+1}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.input, { flex: 1, marginRight: 5, height: 100 }]}>
          <ScrollView
            scrollEnabled
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <TouchableOpacity key={i+1} onPress={() => setMonth(String(i+1).padStart(2,'0'))} style={{ paddingVertical: 8, alignItems: 'center', backgroundColor: month == String(i+1).padStart(2,'0') ? Colors[theme].primary : 'transparent', borderRadius: 5, marginBottom: 4 }}>
                <Text style={{ color: month == String(i+1).padStart(2,'0') ? '#fff' : Colors[theme].text }}>{i+1}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.input, { flex: 1, height: 100 }]}>
          <ScrollView
            scrollEnabled
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {Array.from({ length: 60 }, (_, i) => {
              const y = new Date().getFullYear() - i;
              return (
                <TouchableOpacity key={y} onPress={() => setYear(String(y))} style={{ paddingVertical: 8, alignItems: 'center', backgroundColor: year == String(y) ? Colors[theme].primary : 'transparent', borderRadius: 5, marginBottom: 4 }}>
                  <Text style={{ color: year == String(y) ? '#fff' : Colors[theme].text }}>{y}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

      </View>

      {error ? (
        <Text style={{ color: 'red', marginBottom: 10, textAlign: 'center' }}>
          {error}
        </Text>
      ) : null}

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        Already have an account?{' '}
        <Text
          style={styles.link}
          onPress={() =>router.replace('/')}
        >
          Sign in
        </Text>
      </Text>
      </View>
    </ScrollView>
  </View>
  );
}

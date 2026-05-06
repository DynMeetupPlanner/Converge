import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,  
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { s, C } from '../../../tempStyles/PlanStyle';

const API_BASE = 'https://sturdy-goggles-1033249426470.asia-south1.run.app';

export default function CreatePlanScreen() {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter a plan name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, creatorId: user?.id }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Create plan failed:', text);
        setError(`Failed to create plan (${res.status})`);
        return;
      }

      const data = await res.json();
      // Navigate to Add Members
      router.push(`/plans/${data.plan._id}/add-members`);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={s.scroll}>
          <TouchableOpacity style={{ marginBottom: 20 }} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={C.textSub} />
          </TouchableOpacity>

          <Text style={s.title}>Create a Plan</Text>
          <Text style={s.subtitle}>Give your meeting a name to get started</Text>

          <View style={{ marginTop: 40 }}>
            <Text style={s.label}>Plan Name</Text>
            <View style={s.inputWrap}>
              <Ionicons name="calendar-outline" size={20} color={C.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                style={s.input}
                placeholder="e.g. Weekend Brunch"
                placeholderTextColor={C.textMuted}
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>

            {error ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <Ionicons name="alert-circle" size={16} color={C.red} />
                <Text style={{ color: C.red, fontSize: 13 }}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[s.button, loading && { opacity: 0.7 }]}
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={C.white} />
              ) : (
                <>
                  <Text style={s.buttonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={18} color={C.white} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

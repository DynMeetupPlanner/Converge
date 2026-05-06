import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { usePlans, User } from '@/context/PlanContext';
import { s, C } from '../../../../tempStyles/PlanStyle';
import { API_URL } from '@/lib/api';

const API_BASE = API_URL || 'https://sturdy-goggles-1033249426470.asia-south1.run.app';

export default function AddMembersScreen() {
  const { id: planId } = useLocalSearchParams();
  const { selectedUsers, addSelectedUser, removeSelectedUser, clearSelectedUsers } = usePlans();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState(false);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${API_BASE}/users/search?query=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (res.ok) {
          setResults(data.users || []);
        } else {
          setResults([]);
          console.error('Search failed:', data.msg);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleInvite = async () => {
    if (selectedUsers.length === 0) return;

    setInviting(true);
    try {
      const res = await fetch(`${API_BASE}/plans/${planId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUsers.map(u => u.id) }),
      });
      const data = await res.json();

      if (res.ok) {
        clearSelectedUsers();
        router.replace(`/plans/${planId}`);
      } else {
        alert(data.msg || 'Failed to send invites');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setInviting(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={C.textSub} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={[s.title, { fontSize: 20 }]}>Invite Friends</Text>
            <Text style={s.subtitle}>Search by name or username</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={[s.inputWrap, { marginBottom: 10 }]}>
          <Ionicons name="search" size={20} color={C.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={s.input}
            placeholder="Search users..."
            placeholderTextColor={C.textMuted}
            value={query}
            onChangeText={setQuery}
          />
          {searching && <ActivityIndicator size="small" color={C.accent} />}
        </View>

        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={s.sectionTitle}>Selected ({selectedUsers.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
              {selectedUsers.map(user => (
                <TouchableOpacity
                  key={user.id}
                  style={[s.chip, s.chipActive, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}
                  onPress={() => removeSelectedUser(user.id)}
                >
                  <Text style={s.chipTextActive}>{user.name}</Text>
                  <Ionicons name="close-circle" size={14} color={C.white} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Search Results */}
        <Text style={s.sectionTitle}>Results</Text>
        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
          {query.length >= 2 && results.length === 0 && !searching ? (
            <View style={[s.empty, { paddingVertical: 30 }]}>
              <Text style={s.emptyText}>No users found</Text>
            </View>
          ) : (
            results.map(user => {
              const isSelected = selectedUsers.some(u => u.id === user.id);
              return (
                <TouchableOpacity
                  key={user.id}
                  style={s.userItem}
                  onPress={() => isSelected ? removeSelectedUser(user.id) : addSelectedUser(user)}
                >
                  <View style={s.avatar}>
                    <Text style={s.avatarText}>{user.name[0]}</Text>
                  </View>
                  <View style={s.userInfo}>
                    <Text style={s.userName}>{user.name}</Text>
                    <Text style={s.userTag}>@{user.username}</Text>
                  </View>
                  <View style={[
                    { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
                    isSelected ? { backgroundColor: C.accent, borderColor: C.accent } : { borderColor: C.border }
                  ]}>
                    {isSelected && <Ionicons name="checkmark" size={14} color={C.white} />}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        <TouchableOpacity
          style={[s.button, (selectedUsers.length === 0 || inviting) && { opacity: 0.5, backgroundColor: C.border }]}
          onPress={handleInvite}
          disabled={selectedUsers.length === 0 || inviting}
        >
          {inviting ? (
            <ActivityIndicator color={C.white} />
          ) : (
            <>
              <Text style={s.buttonText}>Invite ({selectedUsers.length})</Text>
              <Ionicons name="send" size={16} color={C.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

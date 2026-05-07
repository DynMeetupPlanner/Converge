import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
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
  const [searchError, setSearchError] = useState('');
  const [searchDebug, setSearchDebug] = useState<Record<string, unknown> | null>(null);
  const [inviteError, setInviteError] = useState('');
  const [inviteDebug, setInviteDebug] = useState<Record<string, unknown> | null>(null);

  const debugText = (value: unknown) => JSON.stringify(value, null, 2);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSearchError('');
      setSearchDebug({
        note: 'Type at least 2 characters to search.',
        apiBase: API_BASE,
        planId,
      });
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      setInviteError('');
      try {
        const res = await fetch(`${API_BASE}/users/search?query=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (res.ok) {
          setResults(data.users || []);
          setSearchError('');
          setSearchDebug({
            apiBase: API_BASE,
            planId,
            responseStatus: res.status,
            query: query.trim(),
            resultCount: data.users?.length || 0,
            users: data.users || [],
            backendDebug: data.debug || null,
          });
        } else {
          setResults([]);
          setSearchError(data.msg || 'Search failed');
          setSearchDebug({
            apiBase: API_BASE,
            planId,
            responseStatus: res.status,
            query: query.trim(),
            backendDebug: data.debug || null,
          });
        }
      } catch (err) {
        console.error('Search error:', err);
        setSearchError(`Could not reach backend: ${API_BASE}`);
        setSearchDebug({
          apiBase: API_BASE,
          planId,
          query: query.trim(),
          networkError: err instanceof Error ? err.message : String(err),
        });
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleInvite = async () => {
    if (selectedUsers.length === 0) return;

    setInviting(true);
    setInviteError('');
    try {
      const res = await fetch(`${API_BASE}/plans/${planId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUsers.map(u => u.id) }),
      });
      const data = await res.json();
      setInviteDebug({
        apiBase: API_BASE,
        planId,
        selectedUsers,
        responseStatus: res.status,
        backendDebug: data.debug || null,
        responseMsg: data.msg || null,
      });

      if (res.ok) {
        clearSelectedUsers();
        router.replace(`/plans/${planId}`);
      } else {
        const message = data.msg || 'Failed to send invites';
        setInviteError(message);
        alert(message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      setInviteError(message);
      setInviteDebug({
        apiBase: API_BASE,
        planId,
        selectedUsers,
        networkError: message,
      });
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
          {searchError ? (
            <View style={[s.empty, { paddingVertical: 30 }]}>
              <Text style={[s.emptyText, { color: C.red }]}>{searchError}</Text>
            </View>
          ) : query.length >= 2 && results.length === 0 && !searching ? (
            <View style={[s.empty, { paddingVertical: 30 }]}>
              <Text style={s.emptyText}>No registered users found for "{query.trim()}"</Text>
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

        <View style={[s.card, { marginTop: 14, backgroundColor: C.surface }]}>
          <Text style={s.sectionTitle}>Debug</Text>
          <Text style={s.metaText}>Backend: {API_BASE}</Text>
          <Text style={s.metaText}>Plan ID: {String(planId)}</Text>
          {inviteError ? (
            <Text style={[s.metaText, { color: C.red, marginTop: 6 }]}>Invite error: {inviteError}</Text>
          ) : null}
          <Text style={[s.metaText, { marginTop: 10 }]}>Search debug</Text>
          <Text selectable style={[s.metaText, { fontFamily: 'monospace', marginTop: 6 }]}>
            {debugText(searchDebug)}
          </Text>
          <Text style={[s.metaText, { marginTop: 10 }]}>Invite debug</Text>
          <Text selectable style={[s.metaText, { fontFamily: 'monospace', marginTop: 6 }]}>
            {debugText(inviteDebug)}
          </Text>
        </View>

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

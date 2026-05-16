import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';
import { s, C } from '../../tempStyles/PlanStyle';

const API_BASE = API_URL || 'https://sturdy-goggles-123083387827.asia-south1.run.app';

type UserItem = {
  id: string;
  name: string;
  username?: string;
};

export default function FriendsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'friends' | 'search' | 'requests'>('friends');
  const [query, setQuery] = useState('');
  const [friends, setFriends] = useState<UserItem[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<UserItem[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<UserItem[]>([]);
  const [results, setResults] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const friendIds = new Set(friends.map((friend) => friend.id));
  const outgoingIds = new Set(outgoingRequests.map((request) => request.id));
  const incomingIds = new Set(incomingRequests.map((request) => request.id));

  const loadFriends = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        fetch(`${API_BASE}/users/friends?userId=${encodeURIComponent(user.id)}`),
        fetch(`${API_BASE}/users/requests?userId=${encodeURIComponent(user.id)}`),
      ]);
      const friendsData = await friendsRes.json();
      const requestsData = await requestsRes.json();
      if (!friendsRes.ok) throw new Error(friendsData.msg || 'Could not load friends');
      if (!requestsRes.ok) throw new Error(requestsData.msg || 'Could not load requests');
      setFriends(friendsData.friends || []);
      setIncomingRequests(requestsData.incoming || []);
      setOutgoingRequests(requestsData.outgoing || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load friends');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  useFocusEffect(
    useCallback(() => {
      loadFriends();
    }, [loadFriends])
  );

  useEffect(() => {
    if (activeTab !== 'search' || query.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${API_BASE}/users/search?query=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || 'Search failed');
        setResults((data.users || []).filter((item: UserItem) => item.id !== user?.id));
        setError('');
      } catch (err) {
        setResults([]);
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [activeTab, query, user?.id]);

  const sendRequest = async (toUserId: string) => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/users/friend-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUserId: user.id, toUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Could not send request');
      await loadFriends();
    } catch (err) {
      Alert.alert('Friend request', err instanceof Error ? err.message : 'Could not send request');
    }
  };

  const acceptRequest = async (fromUserId: string) => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/users/friend-request/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, fromUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Could not accept request');
      await loadFriends();
    } catch (err) {
      Alert.alert('Accept request', err instanceof Error ? err.message : 'Could not accept request');
    }
  };

  const rejectRequest = async (fromUserId: string) => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/users/friend-request/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, fromUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Could not reject request');
      await loadFriends();
    } catch (err) {
      Alert.alert('Reject request', err instanceof Error ? err.message : 'Could not reject request');
    }
  };

  const removeFriend = (friendId: string) => {
    if (!user?.id) return;
    Alert.alert('Remove friend', 'Remove this friend from your list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await fetch(`${API_BASE}/users/friends/${friendId}?userId=${encodeURIComponent(user.id)}`, {
              method: 'DELETE',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || 'Could not remove friend');
            setFriends(data.friends || []);
          } catch (err) {
            Alert.alert('Remove friend', err instanceof Error ? err.message : 'Could not remove friend');
          }
        },
      },
    ]);
  };

  const renderUser = (
    item: UserItem,
    right: React.ReactNode,
  ) => (
    <View key={item.id} style={s.userItem}>
      <View style={s.avatar}>
        <Text style={s.avatarText}>{(item.name || '?')[0]}</Text>
      </View>
      <View style={s.userInfo}>
        <Text style={s.userName}>{item.name}</Text>
        <Text style={s.userTag}>@{item.username || 'user'}</Text>
      </View>
      {right}
    </View>
  );

  const filteredFriends = query.trim()
    ? friends.filter((friend) => {
      const q = query.trim().toLowerCase();
      return friend.name.toLowerCase().includes(q) || String(friend.username || '').toLowerCase().includes(q);
    })
    : friends;

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <View style={s.logoBadge}>
            <Ionicons name="people" size={16} color={C.accent} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.appName}>FRIENDS</Text>
            <Text style={s.tagline}>Add, accept, and manage people</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {([
            { key: 'friends', label: 'Friends', icon: 'people' },
            { key: 'search', label: 'Search', icon: 'search' },
            { key: 'requests', label: 'Requests', icon: 'mail' },
          ] as const).map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[s.chip, active && s.chipActive, { flex: 1, alignItems: 'center' }]}
                onPress={() => {
                  setActiveTab(tab.key);
                  setQuery('');
                }}
              >
                <Ionicons name={tab.icon as any} size={15} color={active ? C.white : C.textSub} />
                <Text style={active ? s.chipTextActive : s.chipText}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[s.inputWrap, { marginBottom: 12 }]}>
          <Ionicons name="search" size={20} color={C.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={s.input}
            placeholder={activeTab === 'search' ? 'Search users...' : 'Search friends...'}
            placeholderTextColor={C.textMuted}
            value={query}
            onChangeText={setQuery}
          />
          {searching ? <ActivityIndicator color={C.accent} /> : null}
        </View>

        {error ? (
          <View style={s.emptyCard}>
            <Text style={[s.emptyText, { color: C.red }]}>{error}</Text>
          </View>
        ) : null}

        {loading && activeTab !== 'search' ? (
          <ActivityIndicator color={C.accent} style={{ marginTop: 30 }} />
        ) : null}

        {activeTab === 'friends' && !loading ? (
          <View>
            <Text style={s.sectionTitle}>Friends ({friends.length})</Text>
            {filteredFriends.length ? filteredFriends.map((friend) => renderUser(
              friend,
              <TouchableOpacity style={[s.chip, { borderColor: C.red }]} onPress={() => removeFriend(friend.id)}>
                <Text style={[s.chipText, { color: C.red }]}>Remove</Text>
              </TouchableOpacity>
            )) : (
              <View style={s.emptyCard}>
                <Text style={s.emptyText}>{query ? 'No matching friends' : 'No friends yet. Search and add people.'}</Text>
              </View>
            )}
          </View>
        ) : null}

        {activeTab === 'search' ? (
          <View>
            <Text style={s.sectionTitle}>Search Results</Text>
            {query.trim().length < 2 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyText}>Type at least 2 characters to search users.</Text>
              </View>
            ) : results.length ? results.map((item) => {
              const isFriend = friendIds.has(item.id);
              const isOutgoing = outgoingIds.has(item.id);
              const isIncoming = incomingIds.has(item.id);
              return renderUser(item, (
                isFriend ? (
                  <View style={[s.chip, s.chipActive]}>
                    <Text style={s.chipTextActive}>Friend</Text>
                  </View>
                ) : isOutgoing ? (
                  <View style={s.chip}>
                    <Text style={s.chipText}>Requested</Text>
                  </View>
                ) : isIncoming ? (
                  <TouchableOpacity style={[s.chip, s.chipActive]} onPress={() => acceptRequest(item.id)}>
                    <Text style={s.chipTextActive}>Accept</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={s.chip} onPress={() => sendRequest(item.id)}>
                    <Text style={s.chipText}>Add</Text>
                  </TouchableOpacity>
                )
              ));
            }) : !searching ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyText}>No users found.</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {activeTab === 'requests' && !loading ? (
          <View>
            <Text style={s.sectionTitle}>Incoming</Text>
            {incomingRequests.length ? incomingRequests.map((request) => renderUser(
              request,
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={[s.chip, s.chipActive]} onPress={() => acceptRequest(request.id)}>
                  <Text style={s.chipTextActive}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.chip, { borderColor: C.red }]} onPress={() => rejectRequest(request.id)}>
                  <Text style={[s.chipText, { color: C.red }]}>Decline</Text>
                </TouchableOpacity>
              </View>
            )) : (
              <View style={s.emptyCard}>
                <Text style={s.emptyText}>No incoming requests</Text>
              </View>
            )}

            <Text style={[s.sectionTitle, { marginTop: 14 }]}>Outgoing</Text>
            {outgoingRequests.length ? outgoingRequests.map((request) => renderUser(
              request,
              <View style={s.chip}>
                <Text style={s.chipText}>Pending</Text>
              </View>
            )) : (
              <View style={s.emptyCard}>
                <Text style={s.emptyText}>No outgoing requests</Text>
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

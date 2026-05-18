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
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { usePlans, User } from '@/context/PlanContext';
import { useAuth } from '@/context/AuthContext';
import { s, C } from '../../../../tempStyles/PlanStyle';
import { API_URL } from '@/lib/api';

const API_BASE = API_URL || 'https://sturdy-goggles-123083387827.asia-south1.run.app';
const FRIENDS_AUTO_REFRESH_MS = 4000;

export default function AddMembersScreen() {
  const { id: planId } = useLocalSearchParams();
  const { selectedUsers, addSelectedUser, removeSelectedUser, clearSelectedUsers } = usePlans();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'friends' | 'search' | 'requests'>('friends');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [searchError, setSearchError] = useState('');

  const [friends, setFriends] = useState<User[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsError, setFriendsError] = useState('');

  const [incomingRequests, setIncomingRequests] = useState<User[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<User[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState('');

  const friendIds = new Set(friends.map((f) => f.id));
  const outgoingIds = new Set(outgoingRequests.map((u) => u.id));
  const incomingIds = new Set(incomingRequests.map((u) => u.id));

  const refreshFriends = useCallback(async () => {
    if (!user?.id) return;
    setFriendsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/friends?userId=${encodeURIComponent(user.id)}`);
      const data = await res.json();
      if (res.ok) {
        setFriends(data.friends || []);
        setFriendsError('');
      } else {
        setFriends([]);
        setFriendsError(data.msg || 'Failed to load friends');
      }
    } catch (err) {
      console.error('Friends fetch error:', err);
      setFriends([]);
      setFriendsError(`Could not reach backend: ${API_BASE}`);
    } finally {
      setFriendsLoading(false);
    }
  }, [user?.id]);

  const refreshRequests = useCallback(async () => {
    if (!user?.id) return;
    setRequestsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/requests?userId=${encodeURIComponent(user.id)}`);
      const data = await res.json();
      if (res.ok) {
        setIncomingRequests(data.incoming || []);
        setOutgoingRequests(data.outgoing || []);
        setRequestsError('');
      } else {
        setIncomingRequests([]);
        setOutgoingRequests([]);
        setRequestsError(data.msg || 'Failed to load requests');
      }
    } catch (err) {
      console.error('Requests fetch error:', err);
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setRequestsError(`Could not reach backend: ${API_BASE}`);
    } finally {
      setRequestsLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      refreshFriends();
      refreshRequests();

      const timer = setInterval(() => {
        refreshFriends();
        refreshRequests();
      }, FRIENDS_AUTO_REFRESH_MS);

      return () => clearInterval(timer);
    }, [refreshFriends, refreshRequests])
  );

  // Debounced search
  useEffect(() => {
    if (activeTab !== 'search') {
      setResults([]);
      setSearchError('');
      setSearching(false);
      return;
    }

    if (query.trim().length < 2) {
      setResults([]);
      setSearchError('');
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${API_BASE}/users/search?query=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (res.ok) {
          setResults(data.users || []);
          setSearchError('');
        } else {
          setResults([]);
          setSearchError(data.msg || 'Search failed');
        }
      } catch (err) {
        console.error('Search error:', err);
        setSearchError(`Could not reach backend: ${API_BASE}`);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [activeTab, query]);

  const sendFriendRequest = async (toUserId: string) => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/users/friend-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUserId: user.id, toUserId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.msg || 'Could not send request');
        return;
      }
      await refreshRequests();
      await refreshFriends();
    } catch (err) {
      alert('Network error');
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
      if (!res.ok) {
        alert(data.msg || 'Could not accept request');
        return;
      }
      await refreshRequests();
      await refreshFriends();
    } catch (err) {
      alert('Network error');
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
      if (!res.ok) {
        alert(data.msg || 'Could not reject request');
        return;
      }
      await refreshRequests();
    } catch (err) {
      alert('Network error');
    }
  };

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
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={C.textSub} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={[s.title, { fontSize: 20 }]}>Invite Friends</Text>
            <Text style={s.subtitle}>Friends first · Search anyone · Requests</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {([
            { key: 'friends', label: 'Friends', icon: 'people' },
            { key: 'search', label: 'Search', icon: 'search' },
            { key: 'requests', label: 'Requests', icon: 'mail' },
          ] as const).map((t) => {
            const active = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[
                  s.chip,
                  active && s.chipActive,
                  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, flex: 1, justifyContent: 'center' },
                ]}
                onPress={() => setActiveTab(t.key)}
              >
                <Ionicons name={t.icon as any} size={16} color={active ? C.white : C.textSub} />
                <Text style={active ? s.chipTextActive : s.chipText}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Search Bar */}
        <View style={[s.inputWrap, { marginBottom: 10 }]}>
          <Ionicons name="search" size={20} color={C.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={s.input}
            placeholder={activeTab === 'friends' ? 'Search friends...' : 'Search users...'}
            placeholderTextColor={C.textMuted}
            value={query}
            onChangeText={setQuery}
          />
          {activeTab === 'search' && searching && <ActivityIndicator size="small" color={C.accent} />}
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

        {/* Content */}
        {activeTab === 'friends' && (
          <>
            <Text style={s.sectionTitle}>Friends</Text>
            {friendsError ? (
              <View style={[s.empty, { paddingVertical: 30 }]}>
                <Text style={[s.emptyText, { color: C.red }]}>{friendsError}</Text>
              </View>
            ) : friendsLoading ? (
              <View style={[s.empty, { paddingVertical: 30 }]}>
                <ActivityIndicator color={C.accent} />
              </View>
            ) : (() => {
              const q = query.trim().toLowerCase();
              const filtered = q.length
                ? friends.filter((f) => (f.name || '').toLowerCase().includes(q) || (f.username || '').toLowerCase().includes(q))
                : friends;

              if (!filtered.length) {
                return (
                  <View style={[s.empty, { paddingVertical: 30 }]}>
                    <Text style={s.emptyText}>{q.length ? 'No matching friends' : 'No friends yet. Use Search to add people.'}</Text>
                  </View>
                );
              }

              return (
                <View>
                  {filtered.map((friend) => {
                    const isSelected = selectedUsers.some((u) => u.id === friend.id);
                    return (
                      <TouchableOpacity
                        key={friend.id}
                        style={s.userItem}
                        onPress={() => isSelected ? removeSelectedUser(friend.id) : addSelectedUser(friend)}
                      >
                        <View style={s.avatar}>
                          <Text style={s.avatarText}>{friend.name[0]}</Text>
                        </View>
                        <View style={s.userInfo}>
                          <Text style={s.userName}>{friend.name}</Text>
                          <Text style={s.userTag}>@{friend.username}</Text>
                        </View>
                        <View style={[
                          { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
                          isSelected ? { backgroundColor: C.accent, borderColor: C.accent } : { borderColor: C.border }
                        ]}>
                          {isSelected && <Ionicons name="checkmark" size={14} color={C.white} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })()}
          </>
        )}

        {activeTab === 'search' && (
          <>
            <Text style={s.sectionTitle}>Results</Text>
            {searchError ? (
              <View style={[s.empty, { paddingVertical: 30 }]}>
                <Text style={[s.emptyText, { color: C.red }]}>{searchError}</Text>
              </View>
            ) : query.length >= 2 && results.length === 0 && !searching ? (
              <View style={[s.empty, { paddingVertical: 30 }]}>
                <Text style={s.emptyText}>No registered users found for {`"${query.trim()}"`}</Text>
              </View>
            ) : (
              <View>
                {results
                  .filter((u) => !user?.id || u.id !== user.id)
                  .map((u) => {
                    const isSelected = selectedUsers.some((sel) => sel.id === u.id);
                    const isFriend = friendIds.has(u.id);
                    const isOutgoing = outgoingIds.has(u.id);
                    const isIncoming = incomingIds.has(u.id);

                    return (
                      <View key={u.id} style={s.userItem}>
                        <TouchableOpacity
                          style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}
                          onPress={() => isSelected ? removeSelectedUser(u.id) : addSelectedUser(u)}
                        >
                          <View style={s.avatar}>
                            <Text style={s.avatarText}>{u.name[0]}</Text>
                          </View>
                          <View style={s.userInfo}>
                            <Text style={s.userName}>{u.name}</Text>
                            <Text style={s.userTag}>@{u.username}</Text>
                          </View>
                        </TouchableOpacity>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          {!isFriend && !isOutgoing && !isIncoming && (
                            <TouchableOpacity
                              onPress={() => sendFriendRequest(u.id)}
                              style={[s.chip, { paddingVertical: 8, paddingHorizontal: 10 }]}
                            >
                              <Text style={s.chipText}>Add</Text>
                            </TouchableOpacity>
                          )}
                          {!isFriend && isOutgoing && (
                            <View style={[s.chip, { paddingVertical: 8, paddingHorizontal: 10, opacity: 0.7 }]}>
                              <Text style={s.chipText}>Requested</Text>
                            </View>
                          )}
                          {!isFriend && isIncoming && (
                            <View style={[s.chip, { paddingVertical: 8, paddingHorizontal: 10 }]}>
                              <Text style={s.chipText}>Incoming</Text>
                            </View>
                          )}
                          {isFriend && (
                            <View style={[s.chip, s.chipActive, { paddingVertical: 8, paddingHorizontal: 10 }]}>
                              <Text style={s.chipTextActive}>Friend</Text>
                            </View>
                          )}

                          <View style={[
                            { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
                            isSelected ? { backgroundColor: C.accent, borderColor: C.accent } : { borderColor: C.border }
                          ]}>
                            {isSelected && <Ionicons name="checkmark" size={14} color={C.white} />}
                          </View>
                        </View>
                      </View>
                    );
                  })}
              </View>
            )}
          </>
        )}

        {activeTab === 'requests' && (
          <>
            <Text style={s.sectionTitle}>Requests</Text>
            {requestsError ? (
              <View style={[s.empty, { paddingVertical: 30 }]}>
                <Text style={[s.emptyText, { color: C.red }]}>{requestsError}</Text>
              </View>
            ) : requestsLoading ? (
              <View style={[s.empty, { paddingVertical: 30 }]}>
                <ActivityIndicator color={C.accent} />
              </View>
            ) : (
              <View>
                <Text style={[s.subtitle, { marginBottom: 8 }]}>Incoming</Text>
                {incomingRequests.length === 0 ? (
                  <View style={[s.empty, { paddingVertical: 16 }]}>
                    <Text style={s.emptyText}>No incoming requests</Text>
                  </View>
                ) : (
                  incomingRequests.map((r) => (
                    <View key={r.id} style={s.userItem}>
                      <View style={s.avatar}>
                        <Text style={s.avatarText}>{r.name[0]}</Text>
                      </View>
                      <View style={s.userInfo}>
                        <Text style={s.userName}>{r.name}</Text>
                        <Text style={s.userTag}>@{r.username}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity style={[s.chip, s.chipActive]} onPress={() => acceptRequest(r.id)}>
                          <Text style={s.chipTextActive}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.chip, { borderColor: C.red }]} onPress={() => rejectRequest(r.id)}>
                          <Text style={[s.chipText, { color: C.red }]}>Decline</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}

                <Text style={[s.subtitle, { marginTop: 14, marginBottom: 8 }]}>Outgoing</Text>
                {outgoingRequests.length === 0 ? (
                  <View style={[s.empty, { paddingVertical: 16 }]}>
                    <Text style={s.emptyText}>No outgoing requests</Text>
                  </View>
                ) : (
                  outgoingRequests.map((r) => (
                    <View key={r.id} style={s.userItem}>
                      <View style={s.avatar}>
                        <Text style={s.avatarText}>{r.name[0]}</Text>
                      </View>
                      <View style={s.userInfo}>
                        <Text style={s.userName}>{r.name}</Text>
                        <Text style={s.userTag}>@{r.username}</Text>
                      </View>
                      <View style={[s.chip, { paddingVertical: 8, paddingHorizontal: 10, opacity: 0.7 }]}>
                        <Text style={s.chipText}>Pending</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </>
        )}

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
      </ScrollView>
    </SafeAreaView>
  );
}

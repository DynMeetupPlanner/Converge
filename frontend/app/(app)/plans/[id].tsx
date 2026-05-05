import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import MapView, { Marker, Circle } from 'react-native-maps';
import { useAuth } from '@/context/AuthContext';
import { usePlans, Plan } from '@/context/PlanContext';
import { s, C } from '../../styles/PlanStyle';

const API_BASE = 'https://sturdy-goggles-1033249426470.asia-south1.run.app';

const PREFERENCES = ['Cafe', 'Restaurant', 'Park', 'Mall', 'Bar'];

export default function PlanDetailScreen() {
  const { id: planId } = useLocalSearchParams();
  const { user } = useAuth();
  const { currentPlan, setCurrentPlan } = usePlans();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [preference, setPreference] = useState('');
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchPlanDetails = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/plans/${planId}`);
      const data = await res.json();
      if (res.ok) {
        setCurrentPlan(data.plan);
      }
    } catch (err) {
      console.error('Fetch plan error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [planId, setCurrentPlan]);

  useEffect(() => {
    fetchPlanDetails();
  }, [fetchPlanDetails]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlanDetails();
  };

  const handleAddLocation = async () => {
    if (!preference) {
      alert('Please select a meeting preference');
      return;
    }

    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setSubmitting(true);
      const res = await fetch(`${API_BASE}/plans/${planId}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          latitude,
          longitude,
          preference,
        }),
      });

      if (res.ok) {
        alert('Location and preference shared!');
        fetchPlanDetails();
      } else {
        alert('Failed to update location');
      }
    } catch (err) {
      console.error('Location error:', err);
      alert('Error updating location');
    } finally {
      setLocating(false);
      setSubmitting(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.accent} />
      </SafeAreaView>
    );
  }

  if (!currentPlan) return null;

  const userMember = currentPlan.members?.find(m => m.userId === user?.id);
  const hasShared = !!userMember?.location;

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
      >
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={C.textSub} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={s.title}>{currentPlan.name}</Text>
            <Text style={s.subtitle}>Organized by {currentPlan.creatorId === user?.id ? 'You' : 'Friend'}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push(`/plans/${planId}/add-members`)}>
            <Ionicons name="person-add-outline" size={22} color={C.accent} />
          </TouchableOpacity>
        </View>

        {/* Midpoint Map Section */}
        <Text style={s.sectionTitle}>Midpoint Status</Text>
        <View style={s.mapPreview}>
          {currentPlan.midpoint ? (
            <MapView
              style={s.map}
              initialRegion={{
                latitude: currentPlan.midpoint.latitude,
                longitude: currentPlan.midpoint.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              userInterfaceStyle="dark"
            >
              <Marker
                coordinate={{
                  latitude: currentPlan.midpoint.latitude,
                  longitude: currentPlan.midpoint.longitude,
                }}
                title="Midpoint"
                pinColor={C.accent}
              />
              {currentPlan.members?.filter(m => m.location).map((m, i) => (
                <Marker
                  key={m.userId}
                  coordinate={{
                    latitude: m.location!.latitude,
                    longitude: m.location!.longitude,
                  }}
                  title={m.name}
                  pinColor={C.green}
                />
              ))}
              <Circle
                center={{
                  latitude: currentPlan.midpoint.latitude,
                  longitude: currentPlan.midpoint.longitude,
                }}
                radius={2000}
                fillColor="rgba(108,127,255,0.1)"
                strokeColor="rgba(108,127,255,0.3)"
              />
            </MapView>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface }}>
              <Ionicons name="map-outline" size={30} color={C.textMuted} />
              <Text style={s.emptyText}>Midpoint will appear once enough members share locations</Text>
            </View>
          )}
        </View>

        {currentPlan.midpoint && (
          <View style={[s.card, { backgroundColor: C.accentSoft, borderColor: C.accent + '33' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[s.avatar, { backgroundColor: C.accent, borderColor: C.accent }]}>
                <Ionicons name="location" size={20} color={C.white} />
              </View>
              <View>
                <Text style={[s.userName, { color: C.accent }]}>Midpoint Found!</Text>
                <Text style={s.metaText}>
                  Lat: {currentPlan.midpoint.latitude.toFixed(4)}, Lng: {currentPlan.midpoint.longitude.toFixed(4)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Share Location Section */}
        {!hasShared ? (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Share Your Details</Text>
            <Text style={[s.subtitle, { marginBottom: 15 }]}>{"Select what you're looking for and share your location to help calculate the midpoint."}</Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
              {PREFERENCES.map(p => (
                <TouchableOpacity
                  key={p}
                  style={[s.chip, preference === p && s.chipActive]}
                  onPress={() => setPreference(p)}
                >
                  <Text style={[s.chipText, preference === p && s.chipTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[s.button, (locating || submitting) && { opacity: 0.7 }]}
              onPress={handleAddLocation}
              disabled={locating || submitting}
            >
              {locating || submitting ? (
                <ActivityIndicator color={C.white} />
              ) : (
                <>
                  <Ionicons name="navigate-outline" size={18} color={C.white} />
                  <Text style={s.buttonText}>Share Location & Preference</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[s.card, { borderColor: C.green + '44', backgroundColor: C.greenSoft }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="checkmark-circle" size={24} color={C.green} />
              <View>
                <Text style={[s.userName, { color: C.green }]}>{"You've shared your location"}</Text>
                <Text style={s.metaText}>Preference: {userMember?.preference}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Members List */}
        <View style={{ marginTop: 10 }}>
          <Text style={s.sectionTitle}>Members ({currentPlan.members?.length || 0})</Text>
          {currentPlan.members?.map(member => (
            <View key={member.userId} style={s.userItem}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{member.name[0]}</Text>
              </View>
              <View style={s.userInfo}>
                <Text style={s.userName}>{member.name}</Text>
                <Text style={s.userTag}>
                  {member.location ? 'Location shared' : 'Waiting for location...'}
                </Text>
              </View>
              {member.location && (
                <View style={s.badge}>
                  <Text style={s.badgeText}>{member.preference}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

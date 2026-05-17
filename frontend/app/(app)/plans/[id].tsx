import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import MapView, { Marker, Circle } from 'react-native-maps';
import { useAuth } from '@/context/AuthContext';
import { usePlans } from '@/context/PlanContext';
import { s, C } from '../../../tempStyles/PlanStyle';
import { API_URL } from '@/lib/api';

const API_BASE = API_URL || 'https://sturdy-goggles-123083387827.asia-south1.run.app';

const PREFERENCES = ['Cafe', 'Restaurant', 'Park', 'Mall', 'Bar'];
const CATEGORIES = ['all', 'cafe', 'restaurant', 'park', 'mall', 'bar'];
const TRAVEL_MODES = ['driving', 'transit', 'walking'] as const;
const PRICE_LEVELS = ['any', 'unknown', 'budget', 'moderate', 'premium'];

type TravelMode = typeof TRAVEL_MODES[number];
type AvailabilitySlot = { day: string; startTime: string; endTime: string };
type SavedPlace = { placeId: string; status: 'saved' | 'visited' };
type PlanVote = { placeId: string; userId: string };
type PlacesDebug = Record<string, unknown> | null;
type Recommendation = {
  placeId: string;
  name: string;
  category: string;
  rating: number | null;
  ratingSource: string;
  userRatingsTotal?: number | null;
  priceLevel: string;
  vicinity?: string;
  openingHours?: string;
  phone?: string;
  website?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  openNow: boolean | null;
  voteCount: number;
  votedBy: string[];
  fairnessScore: number;
  totalScore: number;
  reason: string;
  links: {
    maps: string;
    zomato: string;
    swiggy: string;
  };
  travelStats: {
    averageMinutes: number;
    maxMinutes: number;
    minMinutes: number;
    spreadMinutes: number;
  };
  travelTimes: {
    userId: string;
    name: string;
    mode: TravelMode;
    distanceKm: number;
    durationMinutes: number;
  }[];
};

function formatRating(place: Pick<Recommendation, 'rating' | 'userRatingsTotal'>): string | null {
  if (!Number.isFinite(place.rating)) return null;
  const total = Number.isFinite(place.userRatingsTotal) ? ` (${place.userRatingsTotal})` : '';
  return `${Number(place.rating).toFixed(1)}${total}`;
}

export default function PlanDetailScreen() {
  const { id: planId } = useLocalSearchParams();
  const { user } = useAuth();
  const { currentPlan, setCurrentPlan } = usePlans();
  const planIdString = Array.isArray(planId) ? planId[0] : String(planId || '');
  const activePlanIdRef = React.useRef(planIdString);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [preference, setPreference] = useState('');
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');
  const [availability, setAvailability] = useState<AvailabilitySlot>({
    day: 'Today',
    startTime: '17:00',
    endTime: '20:00',
  });
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [emergencyAlternatives, setEmergencyAlternatives] = useState<Recommendation[]>([]);
  const [availabilityMatches, setAvailabilityMatches] = useState<AvailabilitySlot[]>([]);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationNote, setRecommendationNote] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceLevel, setPriceLevel] = useState('any');
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [hasChosenPreference, setHasChosenPreference] = useState(false);
  const [hasChosenCategoryFilter, setHasChosenCategoryFilter] = useState(false);
  const [expandedPlaceId, setExpandedPlaceId] = useState<string | null>(null);
  const [placesDebug, setPlacesDebug] = useState<PlacesDebug>(null);
  const visibleRecommendations = useMemo(
    () => (categoryFilter === 'all'
      ? recommendations
      : recommendations.filter((place) => place.category === categoryFilter)),
    [categoryFilter, recommendations]
  );
  const visibleEmergencyAlternatives = useMemo(
    () => (categoryFilter === 'all'
      ? emergencyAlternatives
      : emergencyAlternatives.filter((place) => place.category === categoryFilter)),
    [categoryFilter, emergencyAlternatives]
  );

  useEffect(() => {
    activePlanIdRef.current = planIdString;
    setCurrentPlan(null);
    setLoading(true);
    setRefreshing(false);
    setRecommendations([]);
    setEmergencyAlternatives([]);
    setAvailabilityMatches([]);
    setRecommendationLoading(false);
    setRecommendationNote('');
    setPlacesDebug(null);
    setExpandedPlaceId(null);
  }, [planIdString, setCurrentPlan]);

  useEffect(() => {
    if (user?.preferredSpotType) {
      if (!hasChosenPreference) {
        setPreference(user.preferredSpotType.charAt(0).toUpperCase() + user.preferredSpotType.slice(1));
      }
      if (!hasChosenCategoryFilter) {
        setCategoryFilter(user.preferredSpotType);
      }
    }
  }, [hasChosenCategoryFilter, hasChosenPreference, user?.preferredSpotType]);

  const fetchPlanDetails = React.useCallback(async () => {
    if (!planIdString) return;
    try {
      const res = await fetch(`${API_BASE}/plans/${planIdString}`);
      const data = await res.json();
      if (activePlanIdRef.current !== planIdString) return;
      if (res.ok) {
        setCurrentPlan(data.plan);
      }
    } catch (err) {
      console.error('Fetch plan error:', err);
    } finally {
      if (activePlanIdRef.current === planIdString) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [planIdString, setCurrentPlan]);

  useEffect(() => {
    fetchPlanDetails();
  }, [fetchPlanDetails]);

  useEffect(() => {
    const fetchSavedPlaces = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`${API_BASE}/places/saved?userId=${user.id}`);
        const data = await res.json();
        if (res.ok) setSavedPlaces(data.places || []);
      } catch (err) {
        console.error('Saved places fetch error:', err);
      }
    };

    fetchSavedPlaces();
  }, [user?.id]);

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
      const res = await fetch(`${API_BASE}/plans/${planIdString}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          latitude,
          longitude,
          preference,
          travelMode,
          availability: [availability],
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

  const fetchRecommendations = React.useCallback(async () => {
    if (!planIdString || String(currentPlan?._id) !== planIdString || !currentPlan?.members?.filter(m => m.location).length) return;
    setRecommendationLoading(true);
    try {
      const params = new URLSearchParams({
        category: 'all',
        radius: '5',
        minRating: '0',
        priceLevel,
        openNow: String(openNowOnly),
        travelMode,
      });
      const recommendationUrl = `${API_BASE}/plans/${planIdString}/recommendations?${params.toString()}`;
      setPlacesDebug({
        frontendRequestUrl: recommendationUrl,
        status: 'requesting',
        requestedAt: new Date().toISOString(),
      });
      const res = await fetch(recommendationUrl);
      const data = await res.json();
      if (activePlanIdRef.current !== planIdString) return;
      setPlacesDebug({
        frontendRequestUrl: recommendationUrl,
        responseStatus: res.status,
        responseOk: res.ok,
        recommendationCount: data.recommendations?.length || 0,
        ratedCount: (data.recommendations || []).filter((place: Recommendation) => Number.isFinite(place.rating)).length,
        ratingNote: data.ratingNote || null,
        backendDebug: data.debug || null,
        message: data.msg || null,
      });
      if (!res.ok) {
        setRecommendationNote(data.msg || 'Could not load recommendations');
        return;
      }
      const fairnessRanked = [...(data.recommendations || [])]
        .sort((a, b) => b.fairnessScore - a.fairnessScore)
        .slice(0, 7);
      setRecommendations(fairnessRanked);
      setExpandedPlaceId(null);
      setEmergencyAlternatives(data.emergencyAlternatives || []);
      setAvailabilityMatches(data.availabilityMatches || []);
      setRecommendationNote(data.ratingNote || '');
    } catch (err) {
      console.error('Recommendation error:', err);
      if (activePlanIdRef.current === planIdString) {
        setRecommendationNote('Could not load smart recommendations');
        setPlacesDebug({
          status: 'network-error',
          error: err instanceof Error ? err.message : String(err),
          apiBase: API_BASE,
        });
      }
    } finally {
      if (activePlanIdRef.current === planIdString) {
        setRecommendationLoading(false);
      }
    }
  }, [currentPlan?._id, currentPlan?.members, openNowOnly, planIdString, priceLevel, travelMode]);

  useEffect(() => {
    if (String(currentPlan?._id) === planIdString && (currentPlan?.members?.filter(m => m.location).length || 0) >= 2) {
      fetchRecommendations();
    }
  }, [currentPlan?._id, currentPlan?.members, currentPlan?.members?.length, fetchRecommendations, planIdString]);

  const applyVotesToRecommendations = (votes: PlanVote[] = []) => {
    setRecommendations((current) => current.map((place) => {
      const placeVotes = votes.filter((vote) => vote.placeId === place.placeId);
      return {
        ...place,
        voteCount: placeVotes.length,
        votedBy: placeVotes.map((vote) => String(vote.userId)),
      };
    }));
  };

  const handleVote = async (place: Recommendation) => {
    try {
      const res = await fetch(`${API_BASE}/plans/${planIdString}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, place }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentPlan(data.plan);
        applyVotesToRecommendations(data.plan?.votes || []);
      } else {
        alert(data.msg || 'Could not vote');
      }
    } catch (err) {
      console.error('Vote error:', err);
      alert('Could not vote for this place');
    }
  };

  const handleSavePlace = async (place: Recommendation, status: 'saved' | 'visited' = 'saved') => {
    try {
      const res = await fetch(`${API_BASE}/places/saved`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, place, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.msg || 'Could not save place');
        return;
      }
      setSavedPlaces(data.places || []);
      alert(status === 'visited' ? 'Added to meeting history' : 'Saved to favorites');
    } catch (err) {
      console.error('Save place error:', err);
      alert('Could not save place');
    }
  };

  const handleAddHistory = async (place: Recommendation) => {
    await handleSavePlace(place, 'visited');
    try {
      const res = await fetch(`${API_BASE}/plans/${planIdString}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place }),
      });
      const data = await res.json();
      if (res.ok) setCurrentPlan(data.plan);
    } catch (err) {
      console.error('History error:', err);
    }
  };

  const openLink = (url?: string) => {
    if (url) Linking.openURL(url);
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={C.accent} />
      </SafeAreaView>
    );
  }

  if (!currentPlan || String(currentPlan._id) !== planIdString) return null;

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
          <TouchableOpacity onPress={() => router.push(`/plans/${planIdString}/add-members`)}>
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
              {visibleRecommendations
                .filter(place => Number.isFinite(place.location?.latitude) && Number.isFinite(place.location?.longitude))
                .map(place => (
                  <Marker
                    key={`place-${place.placeId}`}
                    coordinate={{
                      latitude: place.location.latitude,
                      longitude: place.location.longitude,
                    }}
                    title={place.name}
                    description={`${place.category} · Fair ${place.fairnessScore}`}
                    pinColor={C.red}
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
                  onPress={() => {
                    setHasChosenPreference(true);
                    setPreference(p);
                  }}
                >
                  <Text style={[s.chipText, preference === p && s.chipTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Travel mode</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
              {TRAVEL_MODES.map(mode => (
                <TouchableOpacity
                  key={mode}
                  style={[s.chip, travelMode === mode && s.chipActive]}
                  onPress={() => setTravelMode(mode)}
                >
                  <Text style={[s.chipText, travelMode === mode && s.chipTextActive]}>{mode}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>When are you free?</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
              <TextInput
                style={[s.inputWrap, { flex: 1, height: 46, marginBottom: 0, color: C.text }]}
                placeholder="Day"
                placeholderTextColor={C.textMuted}
                value={availability.day}
                onChangeText={(day) => setAvailability({ ...availability, day })}
              />
              <TextInput
                style={[s.inputWrap, { flex: 1, height: 46, marginBottom: 0, color: C.text }]}
                placeholder="17:00"
                placeholderTextColor={C.textMuted}
                value={availability.startTime}
                onChangeText={(startTime) => setAvailability({ ...availability, startTime })}
              />
              <TextInput
                style={[s.inputWrap, { flex: 1, height: 46, marginBottom: 0, color: C.text }]}
                placeholder="20:00"
                placeholderTextColor={C.textMuted}
                value={availability.endTime}
                onChangeText={(endTime) => setAvailability({ ...availability, endTime })}
              />
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

        {/* Smart Recommendations */}
        <View style={{ marginTop: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={s.sectionTitle}>Smart Meeting Spots</Text>
            <TouchableOpacity onPress={fetchRecommendations} disabled={recommendationLoading}>
              <Ionicons name="refresh" size={18} color={C.accent} />
            </TouchableOpacity>
          </View>

          <View style={s.card}>
            <Text style={s.label}>Filters</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[s.chip, categoryFilter === cat && s.chipActive]}
                  onPress={() => {
                    setHasChosenCategoryFilter(true);
                    setCategoryFilter(cat);
                  }}
                >
                  <Text style={[s.chipText, categoryFilter === cat && s.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.label}>Price</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
              {PRICE_LEVELS.map(level => (
                <TouchableOpacity
                  key={level}
                  style={[s.chip, priceLevel === level && s.chipActive]}
                  onPress={() => setPriceLevel(level)}
                >
                  <Text style={[s.chipText, priceLevel === level && s.chipTextActive]}>{level}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TouchableOpacity
                style={[s.chip, openNowOnly && s.chipActive, { marginBottom: 0 }]}
                onPress={() => setOpenNowOnly(!openNowOnly)}
              >
                <Text style={[s.chipText, openNowOnly && s.chipTextActive]}>Open now</Text>
              </TouchableOpacity>
            </View>

          </View>
          {availabilityMatches.length > 0 && (
            <View style={[s.card, { backgroundColor: C.greenSoft, borderColor: C.green + '44' }]}>
              <Text style={[s.userName, { color: C.green }]}>Common free time</Text>
              {availabilityMatches.map(slot => (
                <Text key={`${slot.day}-${slot.startTime}`} style={s.metaText}>
                  {slot.day}: {slot.startTime} - {slot.endTime}
                </Text>
              ))}
            </View>
          )}

          {recommendationLoading ? (
            <ActivityIndicator color={C.accent} style={{ marginVertical: 18 }} />
          ) : visibleRecommendations.length === 0 ? (
            <View style={s.emptyCard}>
              <Ionicons name="analytics-outline" size={26} color={C.textMuted} />
              <Text style={s.emptyText}>
                {recommendations.length > 0
                  ? `No ${categoryFilter} spots in the current results.`
                  : 'Share at least two locations to rank fair meeting spots.'}
              </Text>
            </View>
          ) : visibleRecommendations.map((place, index) => {
            const hasVoted = place.votedBy?.some(voter => String(voter) === String(user?.id));
            const allTravel = place.travelTimes || [];
            const savedState = savedPlaces.find((saved) => saved.placeId === place.placeId);
            const expanded = expandedPlaceId === place.placeId;
            const ratingText = formatRating(place);
            return (
              <View key={place.placeId} style={s.card}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setExpandedPlaceId(expanded ? null : place.placeId)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={[s.avatar, { backgroundColor: C.accentSoft }]}>
                      <Text style={s.avatarText}>{index + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.userName}>{place.name}</Text>
                      <Text style={s.userTag}>
                        {ratingText ? `${ratingText} stars · ` : ''}Fair {place.fairnessScore} · {place.category}
                      </Text>
                    </View>
                    <Ionicons
                      name={expanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={C.textMuted}
                    />
                  </View>
                </TouchableOpacity>

                {expanded ? (
                  <>
                    <Text style={[s.metaText, { marginTop: 12 }]}>{place.reason}</Text>

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                      {ratingText ? (
                        <View style={s.badge}>
                          <Text style={s.badgeText}>Rating {ratingText}</Text>
                        </View>
                      ) : null}
                      <View style={s.badge}>
                        <Text style={s.badgeText}>Fair {place.fairnessScore}</Text>
                      </View>
                      <View style={s.badge}>
                        <Text style={s.badgeText}>Avg {place.travelStats.averageMinutes}m</Text>
                      </View>
                      <View style={s.badge}>
                        <Text style={s.badgeText}>Votes {place.voteCount}</Text>
                      </View>
                      <View style={s.badge}>
                        <Text style={s.badgeText}>{place.openNow === true ? 'Open' : 'Hours unknown'}</Text>
                      </View>
                      {savedState ? (
                        <View style={s.badge}>
                          <Text style={s.badgeText}>{savedState.status === 'visited' ? 'Visited' : 'Saved'}</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={{ marginTop: 12 }}>
                      {allTravel.map(item => (
                        <Text key={`${place.placeId}-${item.userId}`} style={s.metaText}>
                          {item.name}: {item.durationMinutes} min · {item.distanceKm} km
                        </Text>
                      ))}
                    </View>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                      <TouchableOpacity style={[s.chip, hasVoted && s.chipActive]} onPress={() => handleVote(place)}>
                        <Text style={[s.chipText, hasVoted && s.chipTextActive]}>{hasVoted ? 'Voted' : 'Vote'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.chip} onPress={() => handleSavePlace(place)}>
                        <Text style={s.chipText}>{savedState?.status === 'visited' ? 'Visited' : savedState ? 'Saved' : 'Save'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.chip} onPress={() => handleAddHistory(place)}>
                        <Text style={s.chipText}>Visited</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.chip} onPress={() => openLink(place.links.maps)}>
                        <Text style={s.chipText}>Maps</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.chip} onPress={() => openLink(place.links.zomato)}>
                        <Text style={s.chipText}>Zomato</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.chip} onPress={() => openLink(place.links.swiggy)}>
                        <Text style={s.chipText}>Swiggy</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : null}
              </View>
            );
          })}

          {visibleEmergencyAlternatives.length > 0 && (
            <View>
              <Text style={s.sectionTitle}>Backup Options</Text>
              {visibleEmergencyAlternatives.map(place => (
                <TouchableOpacity key={`backup-${place.placeId}`} style={s.userItem} onPress={() => openLink(place.links.maps)}>
                  <View style={s.avatar}>
                    <Ionicons name="trail-sign-outline" size={18} color={C.accent} />
                  </View>
                  <View style={s.userInfo}>
                    <Text style={s.userName}>{place.name}</Text>
                    <Text style={s.userTag}>Fair {place.fairnessScore} · Avg {place.travelStats.averageMinutes} min</Text>
                  </View>
                  <Ionicons name="open-outline" size={16} color={C.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

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

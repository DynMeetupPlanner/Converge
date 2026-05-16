import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import MapView, { Marker, Circle, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { s } from '../../tempStyles/HomeStyle';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

type Person = { id: number; name: string };
type Category = 'all' | 'cafe' | 'restaurant' | 'park' | 'mall' | 'bar';
type Coords = { latitude: number; longitude: number };
type PlaceResult = {
  _id: string;
  name: string;
  rating?: number | null;
  ratingSource?: string | null;
  userRatingsTotal?: number | null;
  category: string;
  location: { coordinates: [number, number] };
  vicinity?: string;
};
type SavedPlace = {
  placeId: string;
  status: 'saved' | 'visited';
};
type PlacesDebug = Record<string, unknown> | null;
type TravelEstimate = {
  personId: number;
  name: string;
  distanceKm: number;
  durationMinutes: number;
};
type RankedPlace = PlaceResult & {
  fairnessScore: number;
  travelStats: {
    averageMinutes: number;
    maxMinutes: number;
    minMinutes: number;
    spreadMinutes: number;
  };
  travelTimes: TravelEstimate[];
  reason: string;
};

const CATEGORY_LABELS: Record<Category, { label: string; icon: string }> = {
  all:        { label: 'All',        icon: 'apps' },
  cafe:       { label: 'Café',       icon: 'cafe' },
  restaurant: { label: 'Dine',       icon: 'restaurant' },
  park:       { label: 'Park',       icon: 'leaf' },
  mall:       { label: 'Mall',       icon: 'storefront' },
  bar:        { label: 'Bar',        icon: 'wine' },
};

const FETCH_RADIUS_KM = 5;
const REFETCH_THRESHOLD_KM = 2;
const TOP_PLACE_LIMIT = 7;
const DRIVING_SPEED_KMPH = 28;
const ROAD_FACTOR = 1.35;
const API_BASE = API_URL || 'https://sturdy-goggles-123083387827.asia-south1.run.app';

// Palette
const C = {
  bg:        '#08090E',
  surface:   '#0F1118',
  card:      '#141720',
  border:    '#1E2235',
  accent:    '#6C7FFF',
  accentSoft:'rgba(108,127,255,0.12)',
  glow:      'rgba(108,127,255,0.35)',
  green:     '#2ECC8A',
  greenSoft: 'rgba(46,204,138,0.12)',
  red:       '#FF5C72',
  redSoft:   'rgba(255,92,114,0.12)',
  amber:     '#FFC14D',
  text:      '#EDF0FF',
  textSub:   '#8B91B0',
  textMuted: '#3E4460',
  white:     '#FFFFFF',
};

// ── Helpers ────────────────────────────────────────────────────────
function haversine(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.latitude * Math.PI) / 180) *
    Math.cos((b.latitude * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function calcMidpoint(coords: Coords[]): Coords {
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  return {
    latitude: avg(coords.map((c) => c.latitude)),
    longitude: avg(coords.map((c) => c.longitude)),
  };
}

function getPlaceCoords(place: PlaceResult): Coords {
  return {
    latitude: place.location.coordinates[1],
    longitude: place.location.coordinates[0],
  };
}

function estimateTravelToPlace(marker: { id: number; name: string; coords: Coords }, placeCoords: Coords): TravelEstimate {
  const distanceKm = haversine(marker.coords, placeCoords) * ROAD_FACTOR;
  return {
    personId: marker.id,
    name: marker.name || 'Your Location',
    distanceKm: Number(distanceKm.toFixed(2)),
    durationMinutes: Math.max(1, Math.round((distanceKm / DRIVING_SPEED_KMPH) * 60)),
  };
}

function getFairnessScore(travelTimes: TravelEstimate[]): number {
  if (!travelTimes.length) return 0;
  const durations = travelTimes.map((item) => item.durationMinutes);
  const max = Math.max(...durations);
  const min = Math.min(...durations);
  const avg = durations.reduce((sum, value) => sum + value, 0) / durations.length;
  const spread = max - min;
  const balancePenalty = avg > 0 ? (spread / avg) * 42 : 0;
  const burdenPenalty = Math.max(0, max - 45) * 0.6;
  return Math.max(0, Math.min(100, Math.round(100 - balancePenalty - burdenPenalty)));
}

function formatRating(place: Pick<PlaceResult, 'rating' | 'userRatingsTotal'>): string | null {
  if (!Number.isFinite(place.rating)) return null;
  const total = Number.isFinite(place.userRatingsTotal) ? ` (${place.userRatingsTotal})` : '';
  return `${Number(place.rating).toFixed(1)}${total}`;
}

function rankPlacesByFairness(places: PlaceResult[], markers: { id: number; name: string; coords: Coords }[]): RankedPlace[] {
  if (markers.length < 2) {
    return places.slice(0, TOP_PLACE_LIMIT).map((place) => ({
      ...place,
      fairnessScore: 0,
      travelStats: { averageMinutes: 0, maxMinutes: 0, minMinutes: 0, spreadMinutes: 0 },
      travelTimes: [],
      reason: 'Add at least two locations to calculate fairness.',
    }));
  }

  return places
    .map((place) => {
      const placeCoords = getPlaceCoords(place);
      const travelTimes = markers.map((marker) => estimateTravelToPlace(marker, placeCoords));
      const durations = travelTimes.map((item) => item.durationMinutes);
      const averageMinutes = durations.reduce((sum, value) => sum + value, 0) / durations.length;
      const maxMinutes = Math.max(...durations);
      const minMinutes = Math.min(...durations);
      const fairnessScore = getFairnessScore(travelTimes);

      return {
        ...place,
        fairnessScore,
        travelStats: {
          averageMinutes: Number(averageMinutes.toFixed(1)),
          maxMinutes,
          minMinutes,
          spreadMinutes: maxMinutes - minMinutes,
        },
        travelTimes,
        reason: `Fairness ${fairnessScore}/100, average travel ${Math.round(averageMinutes)} min, longest travel ${maxMinutes} min.`,
      };
    })
    .sort((a, b) => {
      if (b.fairnessScore !== a.fairnessScore) return b.fairnessScore - a.fairnessScore;
      return a.travelStats.averageMinutes - b.travelStats.averageMinutes;
    })
    .slice(0, TOP_PLACE_LIMIT);
}

async function geocode(address: string): Promise<Coords | null> {
  try {
    const results = await Location.geocodeAsync(address);
    if (!results.length) return null;
    return { latitude: results[0].latitude, longitude: results[0].longitude };
  } catch {
    return null;
  }
}

// Avatar colors per person index
const AVATAR_COLORS = [
  { bg: 'rgba(108,127,255,0.18)', border: C.accent,  text: C.accent },
  { bg: 'rgba(46,204,138,0.18)',  border: C.green,   text: C.green  },
  { bg: 'rgba(255,92,114,0.18)',  border: C.red,     text: C.red    },
  { bg: 'rgba(255,193,77,0.18)',  border: C.amber,   text: C.amber  },
];

// ── Component ──────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user } = useAuth();
  const [people, setPeople] = useState<Person[]>([
    { id: 1, name: '' },
    { id: 2, name: '' },
  ]);
  const [category, setCategory] = useState<Category>('all');
  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const [midpoint, setMidpoint] = useState<Coords | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 12.9716, longitude: 77.5946,
    latitudeDelta: 0.1, longitudeDelta: 0.1,
  });
  const [allPlaces, setAllPlaces] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [personMarkers, setPersonMarkers] = useState<{ id: number; name: string; coords: Coords }[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [hasChosenCategory, setHasChosenCategory] = useState(false);
  const [expandedPlaceId, setExpandedPlaceId] = useState<string | null>(null);
  const [placesDebug, setPlacesDebug] = useState<PlacesDebug>(null);

  const lastFetchCoords = useRef<Coords | null>(null);
  const lastFetchCategory = useRef<Category | null>(null);
  const isFetching = useRef(false);
  const fetchRequestId = useRef(0);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (user?.preferredSpotType && !hasChosenCategory) {
      setCategory(user.preferredSpotType as Category);
    }
  }, [hasChosenCategory, user?.preferredSpotType]);

  useEffect(() => {
    let sub: Location.LocationSubscription;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocationError('Location permission denied'); return; }
      try {
        const initial = await Location.getCurrentPositionAsync({});
        const coords = { latitude: initial.coords.latitude, longitude: initial.coords.longitude };
        setUserCoords(coords);
        setRegion({ ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 });
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 20 },
          (loc) => setUserCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
        );
      } catch {}
    })();
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    const fetchSavedPlaces = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`${API_BASE}/places/saved?userId=${user.id}`);
        const data = await res.json();
        if (res.ok) setSavedPlaces(data.places || []);
      } catch (err) {
        console.error('Failed to fetch saved places:', err);
      }
    };

    fetchSavedPlaces();
  }, [user?.id]);

  const fetchPlaces = async (coords: Coords, selectedCategory: Category = category) => {
    const requestId = fetchRequestId.current + 1;
    fetchRequestId.current = requestId;
    isFetching.current = true;
    lastFetchCoords.current = coords;
    lastFetchCategory.current = selectedCategory;
    try {
      const placesUrl = `${API_BASE}/places/nearby?lat=${coords.latitude}&lng=${coords.longitude}&radius=${FETCH_RADIUS_KM}&category=${encodeURIComponent(selectedCategory)}`;
      setPlacesDebug({
        frontendRequestUrl: placesUrl,
        status: 'requesting',
        requestedAt: new Date().toISOString(),
      });
      const res = await fetch(placesUrl);
      const data = await res.json();
      if (requestId === fetchRequestId.current) {
        setAllPlaces(data.places ?? []);
        setPlacesDebug({
          frontendRequestUrl: placesUrl,
          responseStatus: res.status,
          responseOk: res.ok,
          source: data.source,
          placeCount: data.places?.length || 0,
          ratedCount: (data.places || []).filter((place: PlaceResult) => Number.isFinite(place.rating)).length,
          backendDebug: data.debug || null,
          message: data.msg || null,
        });
      }
    } catch (e) {
      console.error('Failed to fetch places:', e);
      setPlacesDebug({
        status: 'network-error',
        error: e instanceof Error ? e.message : String(e),
        apiBase: API_BASE,
      });
    } finally {
      if (requestId === fetchRequestId.current) {
        isFetching.current = false;
      }
    }
  };

  useEffect(() => {
    if (!midpoint || lastFetchCategory.current === category) return;
    fetchPlaces(midpoint, category);
  }, [category, midpoint]);

  const handleSearch = async () => {
    setLoading(true);
    setLocationError('');
    const newMarkers: { id: number; name: string; coords: Coords }[] = [];
    try {
      const coordsList: Coords[] = [];
      for (const person of people) {
        let c: Coords | null = null;
        if (person.name.trim()) {
          c = await geocode(person.name.trim());
          if (!c) { setLocationError(`Could not find: ${person.name}`); setLoading(false); return; }
        } else if (userCoords) {
          c = userCoords;
        }
        if (c) {
          coordsList.push(c);
          newMarkers.push({ id: person.id, name: person.name || 'Your Location', coords: c });
        }
      }
      if (coordsList.length < 2) { setLocationError('Need at least 2 locations'); setLoading(false); return; }
      setPersonMarkers(newMarkers);
      const mid = calcMidpoint(coordsList);
      setMidpoint(mid);
      mapRef.current?.animateToRegion({ ...mid, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 800);
      const shouldFetch = !lastFetchCoords.current || haversine(lastFetchCoords.current, mid) >= REFETCH_THRESHOLD_KM;
      if (shouldFetch || lastFetchCategory.current !== category) await fetchPlaces(mid, category);
    } finally {
      setLoading(false);
    }
  };

  const addPerson = () => setPeople([...people, { id: Date.now(), name: '' }]);
  const removePerson = (id: number) => { if (people.length > 2) setPeople(people.filter((p) => p.id !== id)); };
  const updatePersonName = (id: number, text: string) => setPeople(people.map((p) => p.id === id ? { ...p, name: text } : p));

  const visiblePlaces = category === 'all' ? allPlaces : allPlaces.filter((p) => p.category === category);
  const rankedPlaces = useMemo(
    () => rankPlacesByFairness(visiblePlaces, personMarkers),
    [personMarkers, visiblePlaces]
  );

  useEffect(() => {
    setExpandedPlaceId(null);
  }, [category, midpoint]);

  const handleSavePlace = async (place: PlaceResult) => {
    if (!user?.id) return;
    try {
      const payload = {
        placeId: place._id,
        name: place.name,
        category: place.category,
        rating: place.rating ?? null,
        vicinity: place.vicinity,
        location: {
          latitude: getPlaceCoords(place).latitude,
          longitude: getPlaceCoords(place).longitude,
        },
        links: {
          maps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`,
          zomato: `https://www.zomato.com/search?q=${encodeURIComponent(place.name)}`,
          swiggy: `https://www.swiggy.com/search?query=${encodeURIComponent(place.name)}`,
        },
      };

      const res = await fetch(`${API_BASE}/places/saved`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, place: payload, status: 'saved' }),
      });
      const data = await res.json();
      if (res.ok) {
        setSavedPlaces(data.places || [])
      }
    } catch (err) {
      console.error('Failed to save place:', err);
    }
  };

  const openPlaceLink = (place: PlaceResult, type: 'maps' | 'zomato' | 'swiggy') => {
    const coords = getPlaceCoords(place);
    const links = {
      maps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${coords.latitude},${coords.longitude}`)}`,
      zomato: `https://www.zomato.com/search?q=${encodeURIComponent(place.name)}`,
      swiggy: `https://www.swiggy.com/search?query=${encodeURIComponent(place.name)}`,
    };
    Linking.openURL(links[type]);
  };

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.logoBadge}>
            <Ionicons name="git-merge" size={16} color={C.accent} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.appName}>CONVERGE</Text>
            <Text style={s.tagline}>Meet in the middle — fair for everyone</Text>
          </View>
          <View style={s.liveChip}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>LIVE</Text>
          </View>
        </View>

        {/* ── Map ── */}
        <View style={s.mapWrapper}>
          <MapView
            ref={mapRef}
            style={s.map}
            region={region}
            onRegionChangeComplete={setRegion}
            showsUserLocation
            userInterfaceStyle="dark"
          >
            {midpoint && (
              <Marker coordinate={midpoint} title="Midpoint" pinColor={C.accent} zIndex={10} />
            )}
            {personMarkers.map((m, i) => (
              <Marker
                key={m.id}
                coordinate={m.coords}
                title={`Person ${i + 1}`}
                description={m.name}
                pinColor={i === 0 ? C.accent : i === 1 ? C.green : C.red}
              />
            ))}
            {rankedPlaces.map((place) => (
              <Marker
                key={place._id}
                coordinate={getPlaceCoords(place)}
                title={place.name}
                description={`${place.category} · Fair ${place.fairnessScore}`}
                pinColor={C.red}
              />
            ))}
            {midpoint && (
              <Circle
                center={midpoint}
                radius={FETCH_RADIUS_KM * 1000}
                strokeColor="rgba(108,127,255,0.25)"
                fillColor="rgba(108,127,255,0.05)"
              />
            )}
          </MapView>

          {/* Map overlay badge */}
          <View style={s.mapBadge}>
            <Ionicons
              name={midpoint ? 'checkmark-circle' : 'radio-button-on'}
              size={13}
              color={midpoint ? C.green : C.accent}
            />
            <Text style={[s.mapBadgeText, { color: midpoint ? C.green : C.accent }]}>
              {midpoint ? 'Midpoint found' : 'Awaiting search'}
            </Text>
          </View>

          {/* Stat row */}
          {midpoint && (
            <View style={s.mapStats}>
              <View style={s.mapStatItem}>
                <Text style={s.mapStatVal}>{rankedPlaces.length}</Text>
                <Text style={s.mapStatLabel}>Spots</Text>
              </View>
              <View style={s.mapStatDivider} />
              <View style={s.mapStatItem}>
                <Text style={s.mapStatVal}>{FETCH_RADIUS_KM}km</Text>
                <Text style={s.mapStatLabel}>Radius</Text>
              </View>
              <View style={s.mapStatDivider} />
              <View style={s.mapStatItem}>
                <Text style={s.mapStatVal}>{people.length}</Text>
                <Text style={s.mapStatLabel}>People</Text>
              </View>
            </View>
          )}
        </View>

        {/* ── People Section ── */}
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionLabel}>PARTICIPANTS</Text>
            <View style={s.countPill}>
              <Text style={s.countPillText}>{people.length}</Text>
            </View>
          </View>

          {people.map((person, index) => {
            const av = AVATAR_COLORS[index % AVATAR_COLORS.length];
            return (
              <View key={person.id} style={s.personRow}>
                {/* Avatar */}
                <View style={[s.avatar, { backgroundColor: av.bg, borderColor: av.border }]}>
                  <Text style={[s.avatarText, { color: av.text }]}>
                    {index + 1}
                  </Text>
                </View>

                {/* Input */}
                <View style={s.inputWrap}>
                  <TextInput
                    style={s.input}
                    placeholder={index === 0 ? 'Your location (or leave blank)' : `Person ${index + 1}'s location`}
                    placeholderTextColor={C.textMuted}
                    value={person.name}
                    onChangeText={(t) => updatePersonName(person.id, t)}
                    selectionColor={C.accent}
                  />
                  {person.name.length > 0 && (
                    <TouchableOpacity
                      style={s.clearBtn}
                      onPress={() => updatePersonName(person.id, '')}
                    >
                      <Ionicons name="close" size={14} color={C.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Remove */}
                {people.length > 2 && (
                  <TouchableOpacity style={s.removeBtn} onPress={() => removePerson(person.id)}>
                    <Ionicons name="remove" size={14} color={C.red} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          <TouchableOpacity style={s.addBtn} onPress={addPerson}>
            <View style={s.addBtnIcon}>
              <Ionicons name="add" size={16} color={C.accent} />
            </View>
            <Text style={s.addBtnText}>Add person</Text>
          </TouchableOpacity>
        </View>

        {/* ── Category Section ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>LOOKING FOR</Text>
          {user?.preferredSpotType ? (
            <Text style={[s.tagline, { marginBottom: 12 }]}>Default from settings: {user.preferredSpotType}</Text>
          ) : null}
          <View style={s.catRow}>
            {(Object.entries(CATEGORY_LABELS) as [Category, { label: string; icon: string }][]).map(([cat, { label, icon }]) => {
              const active = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[s.catBtn, active && s.catBtnActive]}
                  onPress={() => {
                    setHasChosenCategory(true);
                    setCategory(cat);
                  }}
                >
                  <Ionicons
                    name={icon as any}
                    size={15}
                    color={active ? C.white : C.textSub}
                    style={{ marginBottom: 4 }}
                  />
                  <Text style={[s.catLabel, active && s.catLabelActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Error ── */}
        {locationError ? (
          <View style={s.errorBox}>
            <Ionicons name="warning" size={15} color={C.red} />
            <Text style={s.errorText}>{locationError}</Text>
          </View>
        ) : null}

        {/* ── CTA ── */}
        <TouchableOpacity
          style={[s.cta, loading && s.ctaLoading]}
          onPress={handleSearch}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={C.white} size="small" />
          ) : (
            <>
              <Ionicons name="navigate" size={18} color={C.white} style={{ marginRight: 10 }} />
              <Text style={s.ctaText}>Find Midpoint</Text>
              <View style={s.ctaArrow}>
                <Ionicons name="arrow-forward" size={14} color={C.accent} />
              </View>
            </>
          )}
        </TouchableOpacity>

        {/* ── Results ── */}
        <View style={s.resultsHead}>
          <Text style={s.sectionLabel}>NEARBY SPOTS</Text>
          <Text style={s.resultsCount}>Top {rankedPlaces.length} of {visiblePlaces.length}</Text>
        </View>

      
        {rankedPlaces.length === 0 ? (
          <View style={s.emptyCard}>
            <View style={s.emptyIcon}>
              <Ionicons name="map-outline" size={28} color={C.textMuted} />
            </View>
            <Text style={s.emptyTitle}>No spots yet</Text>
            <Text style={s.emptyMsg}>
              {allPlaces.length > 0
                ? 'Switch to "All" to see all results.'
                : 'Enter locations and tap Find Midpoint to discover meeting spots.'}
            </Text>
          </View>
        ) : (
          rankedPlaces.map((place, i) => {
            const catColors: Record<string, string> = {
              cafe: C.amber, restaurant: C.red, park: C.green, mall: C.accent, bar: C.red,
            };
            const dot = catColors[place.category] ?? C.accent;
            const savedState = savedPlaces.find((saved) => saved.placeId === place._id);
            const expanded = expandedPlaceId === place._id;
            const ratingText = formatRating(place);
            return (
              <View key={place._id} style={[s.placeCard, { alignItems: 'stretch', flexDirection: 'column' }]}>
                <TouchableOpacity
                  style={s.placeSummaryRow}
                  activeOpacity={0.8}
                  onPress={() => setExpandedPlaceId(expanded ? null : place._id)}
                >
                  <View style={[s.placeIndex, { borderColor: dot + '55', backgroundColor: dot + '18' }]}>
                    <Text style={[s.placeIndexText, { color: dot }]}>{i + 1}</Text>
                  </View>

                  <View style={s.placeInfo}>
                    <Text style={s.placeName}>{place.name}</Text>
                    <View style={s.placeMeta}>
                      <View style={[s.catDot, { backgroundColor: dot }]} />
                      <Text style={s.placeCategory}>{place.category}</Text>
                      <Text style={s.placeVicinity} numberOfLines={1}>
                        {ratingText ? ` · ${ratingText} stars` : ''} · Fair {place.fairnessScore}
                      </Text>
                    </View>
                  </View>

                  <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={C.textMuted}
                  />
                </TouchableOpacity>

                {expanded ? (
                  <>
                    <Text style={s.placeReason}>{place.reason}</Text>
                    {place.vicinity ? (
                      <Text style={s.placeVicinity}>{place.vicinity}</Text>
                    ) : null}

                    <View style={s.badgeRow}>
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
                        <Text style={s.badgeText}>Max {place.travelStats.maxMinutes}m</Text>
                      </View>
                      {savedState ? (
                        <View style={s.badge}>
                          <Text style={s.badgeText}>{savedState.status === 'visited' ? 'Visited' : 'Saved'}</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={s.travelList}>
                      {place.travelTimes.map((item) => (
                        <Text key={`${place._id}-${item.personId}`} style={s.travelText}>
                          {item.name}: {item.durationMinutes} min · {item.distanceKm} km
                        </Text>
                      ))}
                    </View>

                    <View style={s.placeActions}>
                      <TouchableOpacity
                        style={[
                          s.savePill,
                          savedState && { backgroundColor: C.greenSoft, borderColor: C.green + '44' },
                        ]}
                        onPress={() => handleSavePlace(place)}
                      >
                        <Ionicons
                          name={savedState ? 'bookmark' : 'bookmark-outline'}
                          size={12}
                          color={savedState ? C.green : C.accent}
                        />
                        <Text style={[s.savePillText, { color: savedState ? C.green : C.accent }]}>
                          {savedState?.status === 'visited' ? 'Visited' : savedState ? 'Saved' : 'Save'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.savePill} onPress={() => openPlaceLink(place, 'maps')}>
                        <Text style={s.savePillText}>Maps</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.savePill} onPress={() => openPlaceLink(place, 'zomato')}>
                        <Text style={s.savePillText}>Zomato</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.savePill} onPress={() => openPlaceLink(place, 'swiggy')}>
                        <Text style={s.savePillText}>Swiggy</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : null}
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

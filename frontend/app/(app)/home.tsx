import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import MapView, { Marker, Circle, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { s } from '../styles/HomeStyle';

const { width } = Dimensions.get('window');

type Person = { id: number; name: string };
type Category = 'all' | 'cafe' | 'restaurant' | 'park';
type Coords = { latitude: number; longitude: number };
type PlaceResult = {
  _id: string;
  name: string;
  rating: number;
  category: string;
  location: { coordinates: [number, number] };
  vicinity?: string;
};

const CATEGORY_LABELS: Record<Category, { label: string; icon: string }> = {
  all:        { label: 'All',        icon: 'apps' },
  cafe:       { label: 'Café',       icon: 'cafe' },
  restaurant: { label: 'Dine',       icon: 'restaurant' },
  park:       { label: 'Park',       icon: 'leaf' },
};

const FETCH_RADIUS_KM = 5;
const REFETCH_THRESHOLD_KM = 2;
const API_BASE = 'https://sturdy-goggles-1033249426470.asia-south1.run.app';

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

  const lastFetchCoords = useRef<Coords | null>(null);
  const isFetching = useRef(false);
  const mapRef = useRef<MapView>(null);

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

  const fetchPlaces = async (coords: Coords) => {
    if (isFetching.current) return;
    isFetching.current = true;
    lastFetchCoords.current = coords;
    try {
      const res = await fetch(
        `${API_BASE}/places/nearby?lat=${coords.latitude}&lng=${coords.longitude}&radius=${FETCH_RADIUS_KM}&category=${encodeURIComponent(category)}`
      );
      const data = await res.json();
      setAllPlaces(data.places ?? []);
    } catch (e) {
      console.error('Failed to fetch places:', e);
    } finally {
      isFetching.current = false;
    }
  };

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
      if (shouldFetch) await fetchPlaces(mid);
    } finally {
      setLoading(false);
    }
  };

  const addPerson = () => setPeople([...people, { id: Date.now(), name: '' }]);
  const removePerson = (id: number) => { if (people.length > 2) setPeople(people.filter((p) => p.id !== id)); };
  const updatePersonName = (id: number, text: string) => setPeople(people.map((p) => p.id === id ? { ...p, name: text } : p));

  const visiblePlaces = category === 'all' ? allPlaces : allPlaces.filter((p) => p.category === category);

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
            {visiblePlaces.map((place) => (
              <Marker
                key={place._id}
                coordinate={{
                  latitude: place.location.coordinates[1],
                  longitude: place.location.coordinates[0],
                }}
                title={place.name}
                description={`${place.category}${place.rating ? ` · ★ ${place.rating}` : ''}`}
                pinColor={C.green}
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
                <Text style={s.mapStatVal}>{visiblePlaces.length}</Text>
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
          <View style={s.catRow}>
            {(Object.entries(CATEGORY_LABELS) as [Category, { label: string; icon: string }][]).map(([cat, { label, icon }]) => {
              const active = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[s.catBtn, active && s.catBtnActive]}
                  onPress={() => setCategory(cat)}
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
          <Text style={s.resultsCount}>{visiblePlaces.length} found</Text>
        </View>

        {visiblePlaces.length === 0 ? (
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
          visiblePlaces.map((place, i) => {
            const catColors: Record<string, string> = {
              cafe: C.amber, restaurant: C.red, park: C.green,
            };
            const dot = catColors[place.category] ?? C.accent;
            return (
              <TouchableOpacity key={place._id} style={s.placeCard} activeOpacity={0.8}>
                {/* Index */}
                <View style={[s.placeIndex, { borderColor: dot + '55', backgroundColor: dot + '18' }]}>
                  <Text style={[s.placeIndexText, { color: dot }]}>{i + 1}</Text>
                </View>

                {/* Info */}
                <View style={s.placeInfo}>
                  <Text style={s.placeName}>{place.name}</Text>
                  <View style={s.placeMeta}>
                    <View style={[s.catDot, { backgroundColor: dot }]} />
                    <Text style={s.placeCategory}>{place.category}</Text>
                    {place.vicinity ? (
                      <Text style={s.placeVicinity} numberOfLines={1}> · {place.vicinity}</Text>
                    ) : null}
                  </View>
                </View>

                {/* Rating */}
                <View style={s.ratingBox}>
                  <Ionicons name="star" size={11} color={C.amber} />
                  <Text style={s.ratingVal}>{place.rating?.toFixed(1) ?? '—'}</Text>
                </View>

                <Ionicons name="chevron-forward" size={14} color={C.textMuted} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}


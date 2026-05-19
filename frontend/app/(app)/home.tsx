// ─────────────────────────────────────────────────────────────────────────────
// HomeScreen.tsx  (updated)
//
// Changes from original:
//  • handleSearch passes userCoords[] to backend for bounding-box search (PHASE 2)
//  • Backend now returns travelMatrix via /places/ranked endpoint (PHASE 1+3)
//  • rankPlacesByFairness replaced by consuming pre-ranked results from backend
//    (client-side ranking kept as offline fallback)
//  • Map shows TWO midpoint markers: geometric centroid (grey) + effective
//    midpoint = top-ranked place (accent colour) (PHASE 5+15)
//  • Each place card shows per-person ETAs with data source badge (PHASE 18+19)
//  • travelStats.variance exposed in expanded card
//  • isPareto badge on Pareto-optimal results (PHASE 13)
//  • travelMode selector added (PHASE 10)
//  • Saved-places storage preserved (no changes to save/fetch logic)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Linking,
} from 'react-native';
import MapView, { Marker, Circle, Polyline } from 'react-native-maps';
import type { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { s } from '../../tempStyles/HomeStyle';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────
type Person = { id: number; name: string };
type Category = 'all' | 'cafe' | 'restaurant' | 'park' | 'mall' | 'bar';
type TravelMode = 'driving' | 'walking' | 'transit';
type Coords = { latitude: number; longitude: number };

type PlaceResult = {
  _id: string;
  name: string;
  rating?: number | null;
  ratingSource?: string | null;
  userRatingsTotal?: number | null;
  category: string;
  location: { coordinates?: [number, number]; latitude?: number; longitude?: number };
  vicinity?: string;
  googlePlaceId?: string;
  socialScore?: number;
  isChain?: boolean;
};

type SavedPlace = { placeId: string; status: 'saved' | 'visited' };
type PlacesDebug = Record<string, unknown> | null;

type TravelEstimate = {
  userId?: number | string;
  personId?: number;
  name: string;
  distanceKm: number;
  durationMinutes: number;
  mode?: string;
  source?: string;  // 'google-traffic' | 'google' | 'haversine-fallback'
};

type RankedPlace = PlaceResult & {
  fairnessScore: number;
  totalScore: number;
  isPareto?: boolean;
  travelStats: {
    averageMinutes: number;
    maxMinutes: number;
    minMinutes: number;
    spreadMinutes: number;
    varianceMinutes?: number;
  };
  travelTimes: TravelEstimate[];
  reason: string;
};

type MapRouteLine = {
  userId?: number | string;
  name?: string;
  index?: number;
  source?: string;
  coordinates: Coords[];
};
type LastFetchParams = {
  coords: Coords;
  category: Category;
  travelMode: TravelMode;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORY_OPTIONS: { key: Category; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'apps' },
  { key: 'cafe', label: 'Café', icon: 'cafe' },
  { key: 'restaurant', label: 'Dine', icon: 'restaurant' },
  { key: 'park', label: 'Park', icon: 'leaf' },
  { key: 'mall', label: 'Mall', icon: 'storefront' },
  { key: 'bar', label: 'Bar', icon: 'wine' },
];

const TRAVEL_MODE_OPTIONS: { key: TravelMode; label: string; icon: string }[] = [
  { key: 'driving', label: 'Drive', icon: 'car' },
  { key: 'walking', label: 'Walk', icon: 'walk' },
  { key: 'transit', label: 'Transit', icon: 'bus' },
];

const FETCH_RADIUS_KM = 5;          // used as hint; backend builds own search region
const REFETCH_THRESHOLD_KM = 2;
const TOP_PLACE_LIMIT = 20;
// Kept for offline fallback only:
const DRIVING_SPEED_KMPH = 28;
const ROAD_FACTOR = 1.35;
const API_BASE = API_URL || 'https://sturdy-goggles-123083387827.asia-south1.run.app';

const C = {
  bg: '#08090E', surface: '#0F1118', card: '#141720', border: '#1E2235',
  accent: '#6C7FFF', accentSoft: 'rgba(108,127,255,0.12)', glow: 'rgba(108,127,255,0.35)',
  green: '#2ECC8A', greenSoft: 'rgba(46,204,138,0.12)',
  red: '#FF5C72', redSoft: 'rgba(255,92,114,0.12)',
  amber: '#FFC14D', text: '#EDF0FF', textSub: '#8B91B0',
  textMuted: '#3E4460', white: '#FFFFFF', grey: '#555E7A',
};

const AVATAR_COLORS = [
  { bg: 'rgba(108,127,255,0.18)', border: C.accent, text: C.accent },
  { bg: 'rgba(46,204,138,0.18)',  border: C.green,  text: C.green  },
  { bg: 'rgba(255,92,114,0.18)',  border: C.red,    text: C.red    },
  { bg: 'rgba(255,193,77,0.18)',  border: C.amber,  text: C.amber  },
];

// ─── Client-side helpers (offline fallback only) ──────────────────────────────
function haversine(a: Coords, b: Coords): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2
    + Math.cos((a.latitude * Math.PI) / 180)
    * Math.cos((b.latitude * Math.PI) / 180)
    * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function calcMidpoint(coords: Coords[]): Coords {
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  return { latitude: avg(coords.map((c) => c.latitude)), longitude: avg(coords.map((c) => c.longitude)) };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && isFinite(value);
}

function getPlaceCoords(place: PlaceResult): Coords | null {
  const coordinates = place.location?.coordinates;
  const latitude = Array.isArray(coordinates) ? coordinates[1] : place.location?.latitude;
  const longitude = Array.isArray(coordinates) ? coordinates[0] : place.location?.longitude;
  if (!isFiniteNumber(latitude) || !isFiniteNumber(longitude)) return null;
  return { latitude, longitude };
}

// Offline fallback ranker — used only when backend ranking fails
function clientRankPlaces(
  places: PlaceResult[],
  markers: { id: number; name: string; coords: Coords }[]
): RankedPlace[] {
  if (markers.length < 2) {
    return places.filter((p) => !!getPlaceCoords(p)).slice(0, TOP_PLACE_LIMIT).map((place) => ({
      ...place, fairnessScore: 0, totalScore: 0,
      travelStats: { averageMinutes: 0, maxMinutes: 0, minMinutes: 0, spreadMinutes: 0 },
      travelTimes: [], reason: 'Add at least two locations to calculate fairness.',
    }));
  }

  return places
    .map((place): RankedPlace | null => {
      const placeCoords = getPlaceCoords(place);
      if (!placeCoords) return null;
      const travelTimes = markers.map((m) => {
        const distanceKm = haversine(m.coords, placeCoords) * ROAD_FACTOR;
        return {
          personId: m.id, name: m.name,
          distanceKm: Number(distanceKm.toFixed(2)),
          durationMinutes: Math.max(1, Math.round(distanceKm / DRIVING_SPEED_KMPH * 60)),
          source: 'haversine-fallback' as const,
        };
      });
      const durations = travelTimes.map((t) => t.durationMinutes);
      const avg = durations.reduce((s, v) => s + v, 0) / durations.length;
      const max = Math.max(...durations);
      const min = Math.min(...durations);
      const spread = max - min;
      const balancePenalty = avg > 0 ? (spread / avg) * 42 : 0;
      const burdenPenalty = Math.max(0, max - 45) * 0.6;
      const fairnessScore = Math.max(0, Math.min(100, Math.round(100 - balancePenalty - burdenPenalty)));
      const travelScore = Math.max(0, 100 - avg);
      const ratingScore = isFiniteNumber(place.rating) ? (place.rating as number) * 20 : 62;
      const socialScore = Math.min(100, (place as any).socialScore || 0);
      const totalScore = Math.round(fairnessScore * 0.35 + travelScore * 0.20 + ratingScore * 0.15 + socialScore * 0.30);
      return {
        ...place, fairnessScore, totalScore, isPareto: false,
        travelStats: { averageMinutes: Number(avg.toFixed(1)), maxMinutes: max, minMinutes: min, spreadMinutes: spread },
        travelTimes,
        reason: `Fairness ${fairnessScore}/100, avg ${Math.round(avg)} min, max ${max} min (client estimate).`,
      };
    })
    .filter((p): p is RankedPlace => !!p)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, TOP_PLACE_LIMIT);
}

function formatRating(place: Pick<PlaceResult, 'rating' | 'userRatingsTotal'>): string | null {
  if (!isFiniteNumber(place.rating)) return null;
  const total = isFiniteNumber(place.userRatingsTotal) ? ` (${place.userRatingsTotal})` : '';
  return `${Number(place.rating).toFixed(1)}${total}`;
}

async function geocode(address: string): Promise<Coords | null> {
  try {
    const results = await Location.geocodeAsync(address);
    if (!results.length) return null;
    return { latitude: results[0].latitude, longitude: results[0].longitude };
  } catch { return null; }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user } = useAuth();

  const [people, setPeople] = useState<Person[]>([{ id: 1, name: '' }, { id: 2, name: '' }]);
  const [category, setCategory] = useState<Category>('all');
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');
  const [userCoords, setUserCoords] = useState<Coords | null>(null);

  // Two midpoint concepts (PHASE 5+15)
  const [geometricMidpoint, setGeometricMidpoint] = useState<Coords | null>(null);
  const [effectiveMidpoint, setEffectiveMidpoint] = useState<(Coords & { name?: string }) | null>(null);

  const [region, setRegion] = useState<Region>({
    latitude: 12.9716, longitude: 77.5946, latitudeDelta: 0.1, longitudeDelta: 0.1,
  });
  const [allPlaces, setAllPlaces] = useState<PlaceResult[]>([]);
  const [rankedFromBackend, setRankedFromBackend] = useState<RankedPlace[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [personMarkers, setPersonMarkers] = useState<{ id: number; name: string; coords: Coords }[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [hasChosenCategory, setHasChosenCategory] = useState(false);
  const [expandedPlaceId, setExpandedPlaceId] = useState<string | null>(null);
  const [placesDebug, setPlacesDebug] = useState<PlacesDebug>(null);
  const [backendRouteLines, setBackendRouteLines] = useState<MapRouteLine[]>([]);

  const lastFetchParams = useRef<LastFetchParams | null>(null);
  const fetchRequestId = useRef(0);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (user?.preferredSpotType && !hasChosenCategory) setCategory(user.preferredSpotType as Category);
  }, [hasChosenCategory, user?.preferredSpotType]);

  useEffect(() => {
    let sub: Location.LocationSubscription;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocationError('Location permission denied'); return; }
      try {
        const initial = await Location.getCurrentPositionAsync({});
        const c = { latitude: initial.coords.latitude, longitude: initial.coords.longitude };
        setUserCoords(c);
        setRegion({ ...c, latitudeDelta: 0.05, longitudeDelta: 0.05 });
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 20 },
          (loc) => setUserCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
        );
      } catch {}
    })();
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/places/saved?userId=${user.id}`);
        const data = await res.json();
        if (res.ok) setSavedPlaces(data.places || []);
      } catch (err) { console.error('Failed to fetch saved places:', err); }
    })();
  }, [user?.id]);

  // ── Fetch: places + backend ranking in one call ───────────────────────────
  const fetchRankedPlaces = async (
    userCoordsArr: Coords[],
    midCoords: Coords,
    currentCategory: Category,
    currentMode: TravelMode,
  ) => {
    const requestId = fetchRequestId.current + 1;
    fetchRequestId.current = requestId;
    lastFetchParams.current = {
      coords: midCoords,
      category: currentCategory,
      travelMode: currentMode,
    };

    try {
      // Pass all user coords + mode to backend for real routing + bounding-box search
      const body = JSON.stringify({
        userCoords: userCoordsArr,
        midpoint: midCoords,
        radius: FETCH_RADIUS_KM,
        category: currentCategory,
        travelMode: currentMode,
      });

      const res = await fetch(`${API_BASE}/places/ranked`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body,
});

      const rawText = await res.text();

      let data: any = null;

      try {
        data = JSON.parse(rawText);
      } catch (err) {
        console.error('Non-JSON backend response:', {
          status: res.status,
          statusText: res.statusText,
          body: rawText,
        });
        throw new Error(`Backend returned non-JSON response (${res.status})`);
      }
      if (requestId !== fetchRequestId.current) return;

      if (res.ok && Array.isArray(data.ranked)) {
        setRankedFromBackend(data.ranked.slice(0, TOP_PLACE_LIMIT));
        setAllPlaces(data.places || data.ranked);

        // PHASE 5: backend tells us the effective midpoint (top-ranked place)
        if (data.effectiveMidpoint) {
          setEffectiveMidpoint(data.effectiveMidpoint);
        }
        setBackendRouteLines(Array.isArray(data.routeLines) ? data.routeLines : []);

        setPlacesDebug({
          source: 'backend-ranked',
          rankedCount: data.ranked.length,
          placeCount: (data.places || data.ranked).length,
          matrixEnabled: data.debug?.matrixEnabled,
          matrixMode: data.debug?.matrixMode,
          filteredCount: data.debug?.filteredCount,
          backendDebug: data.debug,
        });
      } else {
        // Fallback: fetch raw places, rank client-side
        await fetchPlacesFallback(midCoords, requestId);
      }
    } catch (e) {
      console.error('fetchRankedPlaces error:', {
        error: e,
        api: `${API_BASE}/places/ranked`,
        mode: currentMode,
        category: currentCategory,
      });
      await fetchPlacesFallback(midCoords, requestId);
    }
  };

  const fetchPlacesFallback = async (coords: Coords, requestId: number) => {
    try {
      const url = `${API_BASE}/places/nearby?lat=${coords.latitude}&lng=${coords.longitude}&radius=${FETCH_RADIUS_KM}&category=all`;
      const res = await fetch(url);
      const data = await res.json();
      if (requestId === fetchRequestId.current) {
        setAllPlaces(data.places ?? []);
        setRankedFromBackend(null);  // will fall back to client ranking
        setBackendRouteLines([]);
        setPlacesDebug({ source: 'fallback-nearby', placeCount: data.places?.length || 0, backendDebug: data.debug });
      }
    } catch (e) {
      setRankedFromBackend(null);
      setBackendRouteLines([]);
      setPlacesDebug({ source: 'network-error', error: String(e) });
    }
  };

  // ── Search handler ────────────────────────────────────────────────────────
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
      setGeometricMidpoint(mid);
      mapRef.current?.animateToRegion({ ...mid, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 800);

      const lastFetch = lastFetchParams.current;
      const shouldFetch = !lastFetch
        || haversine(lastFetch.coords, mid) >= REFETCH_THRESHOLD_KM
        || lastFetch.category !== category
        || lastFetch.travelMode !== travelMode;
      if (shouldFetch) {
        setRankedFromBackend(null);
        setEffectiveMidpoint(null);  // reset until backend responds
        setBackendRouteLines([]);
        await fetchRankedPlaces(coordsList, mid, category, travelMode);
      }
    } finally {
      setLoading(false);
    }
  };

  const addPerson    = () => setPeople([...people, { id: Date.now(), name: '' }]);
  const removePerson = (id: number) => { if (people.length > 2) setPeople(people.filter((p) => p.id !== id)); };
  const updatePersonName = (id: number, text: string) => setPeople(people.map((p) => p.id === id ? { ...p, name: text } : p));

  // ── Ranking — prefer backend results, fall back to client ────────────────
  const visiblePlaces = category === 'all' ? allPlaces : allPlaces.filter((p) => p.category === category);

  const rankedPlaces: RankedPlace[] = useMemo(() => {
    if (rankedFromBackend) {
      // Backend already filtered by category; if switching category client-side, re-filter
      return category === 'all'
        ? rankedFromBackend
        : rankedFromBackend.filter((p) => p.category === category);
    }
    return clientRankPlaces(visiblePlaces, personMarkers);
  }, [rankedFromBackend, visiblePlaces, personMarkers, category]);

  // Update effective midpoint from top-ranked place when using client ranking

useEffect(() => {
  setExpandedPlaceId(null);
}, [category, geometricMidpoint]);

  const selectedRouteDestination = useMemo(() => {
    const expandedPlace = rankedPlaces.find((place) => place._id === expandedPlaceId);
    const expandedCoords = expandedPlace ? getPlaceCoords(expandedPlace) : null;
    if (expandedCoords) return { ...expandedCoords, name: expandedPlace?.name };
    if (effectiveMidpoint) return effectiveMidpoint;
    const topPlace = rankedPlaces[0];
    const topCoords = topPlace ? getPlaceCoords(topPlace) : null;
    return topCoords ? { ...topCoords, name: topPlace.name } : null;
  }, [effectiveMidpoint, expandedPlaceId, rankedPlaces]);

  const routeLines = useMemo(() => {
    const hasSelectedPlace = Boolean(expandedPlaceId);
    const backendLines = backendRouteLines
      .filter((line) => Array.isArray(line.coordinates) && line.coordinates.length >= 2)
      .map((line, index) => ({
        key: `backend-${line.userId ?? index}`,
        color: AVATAR_COLORS[index % AVATAR_COLORS.length].border,
        coordinates: line.coordinates,
        source: line.source,
      }));
    if (!hasSelectedPlace && backendLines.length) return backendLines;
    if (!selectedRouteDestination) return [];
    return personMarkers.map((marker, index) => ({
      key: `${marker.id}-${selectedRouteDestination.latitude}-${selectedRouteDestination.longitude}`,
      color: AVATAR_COLORS[index % AVATAR_COLORS.length].border,
      coordinates: [
        marker.coords,
        { latitude: selectedRouteDestination.latitude, longitude: selectedRouteDestination.longitude },
      ],
      source: 'direct-line-fallback',
    }));
  }, [backendRouteLines, expandedPlaceId, personMarkers, selectedRouteDestination]);

  // ── Save / open place (unchanged logic) ──────────────────────────────────
  const handleSavePlace = async (place: PlaceResult) => {
    if (!user?.id) return;
    const coords = getPlaceCoords(place);
    if (!coords) { setLocationError('This place does not have valid coordinates.'); return; }
    try {
      const payload = {
        placeId: place._id, name: place.name, category: place.category,
        rating: place.rating ?? null, vicinity: place.vicinity, location: coords,
        links: {
          maps:   `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`,
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
      if (res.ok) setSavedPlaces(data.places || []);
    } catch (err) { console.error('Failed to save place:', err); }
  };

  const openPlaceLink = (place: PlaceResult, type: 'maps' | 'zomato' | 'swiggy') => {
    const coords = getPlaceCoords(place);
    const mapsUrl = place.googlePlaceId && coords
      ? `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}&query_place_id=${place.googlePlaceId}`
      : coords
        ? `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;
    const links = {
      maps: mapsUrl,
      zomato: `https://www.zomato.com/search?q=${encodeURIComponent(place.name)}`,
      swiggy: `https://www.swiggy.com/search?query=${encodeURIComponent(place.name)}`,
    };
    Linking.openURL(links[type]);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={s.header}>
          <View style={s.logoBadge}><Ionicons name="git-merge" size={16} color={C.accent} /></View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.appName}>CONVERGE</Text>
            <Text style={s.tagline}>Meet in the middle — fair for everyone</Text>
          </View>
          <View style={s.liveChip}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Map */}
        <View style={s.mapWrapper}>
          <MapView
            ref={mapRef} style={s.map} region={region} onRegionChangeComplete={setRegion}
            showsUserLocation userInterfaceStyle="dark"
          >
            {/* PHASE 15: geometric centroid (grey, visual only) */}
            {geometricMidpoint && (
              <Marker coordinate={geometricMidpoint} title="Geometric midpoint (visual)" pinColor={C.grey} zIndex={8} />
            )}

            {/* PHASE 15: effective midpoint = top-ranked place (accent, the real meetup anchor) */}
            {effectiveMidpoint && (
              <Marker
                coordinate={effectiveMidpoint}
                title={effectiveMidpoint.name ? `📍 ${effectiveMidpoint.name}` : 'Best meetup point'}
                description="Route-optimised meeting point"
                pinColor={C.accent}
                zIndex={10}
              />
            )}

            {personMarkers.map((m, i) => (
              <Marker key={m.id} coordinate={m.coords} title={`Person ${i + 1}`} description={m.name}
                pinColor={i === 0 ? C.accent : i === 1 ? C.green : C.red} />
            ))}

            {routeLines.map((line) => (
              <Polyline
                key={line.key}
                coordinates={line.coordinates}
                strokeColor={line.color}
                strokeWidth={3}
                lineDashPattern={line.source === 'google-directions' ? undefined : [8, 6]}
                zIndex={6}
              />
            ))}

            {rankedPlaces.map((place) => {
              const coords = getPlaceCoords(place);
              if (!coords) return null;
              return (
                <Marker key={place._id} coordinate={coords} title={place.name}
                  description={`${place.category} · Fair ${place.fairnessScore}${place.isPareto ? ' · Pareto' : ''}`}
                  pinColor={place.isPareto ? C.amber : C.red} />
              );
            })}

            {geometricMidpoint && (
              <Circle center={geometricMidpoint} radius={FETCH_RADIUS_KM * 1000}
                strokeColor="rgba(108,127,255,0.25)" fillColor="rgba(108,127,255,0.05)" />
            )}
          </MapView>

          <View style={s.mapBadge}>
            <Ionicons name={geometricMidpoint ? 'checkmark-circle' : 'radio-button-on'} size={13}
              color={geometricMidpoint ? C.green : C.accent} />
            <Text style={[s.mapBadgeText, { color: geometricMidpoint ? C.green : C.accent }]}>
              {geometricMidpoint ? (effectiveMidpoint ? 'Route-optimised point found' : 'Midpoint found') : 'Awaiting search'}
            </Text>
          </View>

          {geometricMidpoint && (
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

        {/* People section */}
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionLabel}>PARTICIPANTS</Text>
            <View style={s.countPill}><Text style={s.countPillText}>{people.length}</Text></View>
          </View>
          {people.map((person, index) => {
            const av = AVATAR_COLORS[index % AVATAR_COLORS.length];
            return (
              <View key={person.id} style={s.personRow}>
                <View style={[s.avatar, { backgroundColor: av.bg, borderColor: av.border }]}>
                  <Text style={[s.avatarText, { color: av.text }]}>{index + 1}</Text>
                </View>
                <View style={s.inputWrap}>
                  <TextInput
                    style={s.input}
                    placeholder={index === 0 ? 'Your location (or leave blank)' : `Person ${index + 1}'s location`}
                    placeholderTextColor={C.textMuted} value={person.name}
                    onChangeText={(t) => updatePersonName(person.id, t)} selectionColor={C.accent}
                  />
                  {person.name.length > 0 && (
                    <TouchableOpacity style={s.clearBtn} onPress={() => updatePersonName(person.id, '')}>
                      <Ionicons name="close" size={14} color={C.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
                {people.length > 2 && (
                  <TouchableOpacity style={s.removeBtn} onPress={() => removePerson(person.id)}>
                    <Ionicons name="remove" size={14} color={C.red} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
          <TouchableOpacity style={s.addBtn} onPress={addPerson}>
            <View style={s.addBtnIcon}><Ionicons name="add" size={16} color={C.accent} /></View>
            <Text style={s.addBtnText}>Add person</Text>
          </TouchableOpacity>
        </View>

        {/* Travel mode selector (PHASE 10) */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>TRAVEL MODE</Text>
          <View style={s.catRow}>
            {TRAVEL_MODE_OPTIONS.map(({ key: mode, label, icon }) => {
              const active = travelMode === mode;
              return (
                <TouchableOpacity key={mode} style={[s.catBtn, active && s.catBtnActive]}
                  onPress={() => setTravelMode(mode)}>
                  <Ionicons name={icon as any} size={15} color={active ? C.white : C.textSub} style={{ marginBottom: 4 }} />
                  <Text style={[s.catLabel, active && s.catLabelActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Category section */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>LOOKING FOR</Text>
          {user?.preferredSpotType
            ? <Text style={[s.tagline, { marginBottom: 12 }]}>Default from settings: {user.preferredSpotType}</Text>
            : null}
          <View style={s.catRow}>
            {CATEGORY_OPTIONS.map(({ key: cat, label, icon }) => {
              const active = category === cat;
              return (
                <TouchableOpacity key={cat} style={[s.catBtn, active && s.catBtnActive]}
                  onPress={() => { setHasChosenCategory(true); setCategory(cat); }}>
                  <Ionicons name={icon as any} size={15} color={active ? C.white : C.textSub} style={{ marginBottom: 4 }} />
                  <Text style={[s.catLabel, active && s.catLabelActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Error */}
        {locationError ? (
          <View style={s.errorBox}>
            <Ionicons name="warning" size={15} color={C.red} />
            <Text style={s.errorText}>{locationError}</Text>
          </View>
        ) : null}

        {/* CTA */}
        <TouchableOpacity style={[s.cta, loading && s.ctaLoading]} onPress={handleSearch} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color={C.white} size="small" /> : (
            <>
              <Ionicons name="navigate" size={18} color={C.white} style={{ marginRight: 10 }} />
              <Text style={s.ctaText}>Find Midpoint Places</Text>
              <View style={s.ctaArrow}><Ionicons name="arrow-forward" size={14} color={C.accent} /></View>
            </>
          )}
        </TouchableOpacity>

        {/* Results header */}
        <View style={s.resultsHead}>
          <Text style={s.sectionLabel}>NEARBY SPOTS</Text>
          <Text style={s.resultsCount}>Top {rankedPlaces.length} of {visiblePlaces.length}</Text>
        </View>

        {/* Results list */}
        {rankedPlaces.length === 0 ? (
          <View style={s.emptyCard}>
            <View style={s.emptyIcon}><Ionicons name="map-outline" size={28} color={C.textMuted} /></View>
            <Text style={s.emptyTitle}>No spots yet</Text>
            <Text style={s.emptyMsg}>
              {allPlaces.length > 0
                ? 'Switch to "All" to see all results.'
                : 'Enter locations and tap Find Midpoint to discover meeting spots.'}
            </Text>
          </View>
        ) : rankedPlaces.map((place, i) => {
          const catColors: Record<string, string> = {
            cafe: C.amber, restaurant: C.red, park: C.green, mall: C.accent, bar: C.red,
          };
          const dot = catColors[place.category] ?? C.accent;
          const savedState = savedPlaces.find((saved) => saved.placeId === place._id);
          const expanded = expandedPlaceId === place._id;
          const ratingText = formatRating(place);

          return (
            <View key={place._id} style={[s.placeCard, { alignItems: 'stretch', flexDirection: 'column' }]}>
              <TouchableOpacity style={s.placeSummaryRow} activeOpacity={0.8}
                onPress={() => setExpandedPlaceId(expanded ? null : place._id)}>
                <View style={[s.placeIndex, { borderColor: dot + '55', backgroundColor: dot + '18' }]}>
                  <Text style={[s.placeIndexText, { color: dot }]}>{i + 1}</Text>
                </View>
                <View style={s.placeInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={s.placeName}>{place.name}</Text>
                    {/* PHASE 13: Pareto badge */}
                    {place.isPareto && (
                      <View style={{ backgroundColor: C.amber + '22', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                        <Text style={{ color: C.amber, fontSize: 9, fontWeight: '700' }}>PARETO</Text>
                      </View>
                    )}
                    {place.isChain && (
                      <View style={{ backgroundColor: C.textMuted + '33', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                        <Text style={{ color: C.textMuted, fontSize: 9 }}>CHAIN</Text>
                      </View>
                    )}
                  </View>
                  <View style={s.placeMeta}>
                    <View style={[s.catDot, { backgroundColor: dot }]} />
                    <Text style={s.placeCategory}>{place.category}</Text>
                    <Text style={s.placeVicinity} numberOfLines={1}>
                      {ratingText ? ` · ${ratingText}★` : ''} · Fair {place.fairnessScore}
                    </Text>
                  </View>
                </View>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={C.textMuted} />
              </TouchableOpacity>

              {expanded && (
                <>
                  {/* PHASE 19: Why chosen */}
                  <Text style={s.placeReason}>{place.reason}</Text>
                  {place.vicinity ? <Text style={s.placeVicinity}>{place.vicinity}</Text> : null}

                  <View style={s.badgeRow}>
                    {ratingText && <View style={s.badge}><Text style={s.badgeText}>⭐ {ratingText}</Text></View>}
                    <View style={s.badge}><Text style={s.badgeText}>Fair {place.fairnessScore}</Text></View>
                    <View style={s.badge}><Text style={s.badgeText}>Avg {place.travelStats.averageMinutes}m</Text></View>
                    <View style={s.badge}><Text style={s.badgeText}>Max {place.travelStats.maxMinutes}m</Text></View>
                    {place.travelStats.varianceMinutes !== undefined && (
                      <View style={s.badge}><Text style={s.badgeText}>σ² {place.travelStats.varianceMinutes}m</Text></View>
                    )}
                    {place.isPareto && (
                      <View style={[s.badge, { backgroundColor: C.amber + '18', borderColor: C.amber + '44' }]}>
                        <Text style={[s.badgeText, { color: C.amber }]}>Pareto optimal</Text>
                      </View>
                    )}
                    {savedState && (
                      <View style={s.badge}>
                        <Text style={s.badgeText}>{savedState.status === 'visited' ? 'Visited' : 'Saved'}</Text>
                      </View>
                    )}
                  </View>

                  {/* PHASE 18: Per-person ETAs with source badge */}
                  <View style={s.travelList}>
                    {place.travelTimes.map((item, ti) => {
                      const isTraffic = item.source === 'google-traffic';
                      const isGoogle = item.source === 'google';

                      const sourceLabel =
                        isTraffic ? '🚦'
                        : isGoogle ? '🗺'
                        : '≈';
                      return (
                        <Text key={`${place._id}-${item.personId ?? item.userId ?? ti}`} style={s.travelText}>
                          {sourceLabel} {item.name}: {item.durationMinutes} min · {item.distanceKm} km
                          {item.mode && item.mode !== travelMode ? ` (${item.mode})` : ''}
                        </Text>
                      );
                    })}
                  </View>

                  <View style={s.placeActions}>
                    <TouchableOpacity
                      style={[s.savePill, savedState && { backgroundColor: C.greenSoft, borderColor: C.green + '44' }]}
                      onPress={() => handleSavePlace(place)}
                    >
                      <Ionicons name={savedState ? 'bookmark' : 'bookmark-outline'} size={12} color={savedState ? C.green : C.accent} />
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
              )}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

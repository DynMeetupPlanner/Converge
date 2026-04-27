import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Circle, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import HomeStyle from '../styles/HomeStyle';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '@/components/GradientBackground';

type Person = { id: number; name: string };
type Category = 'all' | 'cafe' | 'restaurant' | 'park';
type Coords = { latitude: number; longitude: number };
type PlaceResult = {
  _id: string;
  name: string;
  rating: number;
  category: string;
  location: { coordinates: [number, number] }; // [lng, lat]
  vicinity?: string;
};

const CATEGORY_LABELS: Record<Category, string> = {
  all: 'All', cafe: 'Cafe', restaurant: 'Restaurant', park: 'Park',
};

const FETCH_RADIUS_KM = 5;
const REFETCH_THRESHOLD_KM = 2;
const API_BASE = 'https://sturdy-goggles-1033249426470.asia-south1.run.app';

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
  } catch (e) {
    return null;
  }
}

export default function HomeScreen() {
  const theme = useColorScheme();
  const styles = HomeStyle(theme);

  const [people, setPeople] = useState<Person[]>([
    { id: 1, name: '' }, 
    { id: 2, name: '' }
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

  const lastFetchCoords = useRef<Coords | null>(null);
  const isFetching = useRef(false);
  const mapRef = useRef<MapView>(null);

  // ── Get user's own live location ─────────────────────────────────
  useEffect(() => {
    let sub: Location.LocationSubscription;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        return;
      }
      try {
        const initial = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: initial.coords.latitude,
          longitude: initial.coords.longitude,
        };
        setUserCoords(coords);
        setRegion({ ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 });

        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 20 },
          (loc) => setUserCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
        );
      } catch (e) {
        console.log("Error getting location:", e);
      }
    })();
    return () => sub?.remove();
  }, []);

  // ── Fetch places from backend ────────────────────────────────────
  const fetchPlaces = async (coords: Coords) => {
    if (isFetching.current) return;
    isFetching.current = true;
    lastFetchCoords.current = coords;
    try {
      const res = await fetch(
        `${API_BASE}/places/nearby?lat=${coords.latitude}&lng=${coords.longitude}&radius=${FETCH_RADIUS_KM}`
      );
      const data = await res.json();
      setAllPlaces(data.places ?? []);
    } catch (e) {
      console.error('Failed to fetch places:', e);
    } finally {
      isFetching.current = false;
    }
  };

  // ── Handle search button ─────────────────────────────────────────
  const [personMarkers, setPersonMarkers] = useState<{ id: number; name: string; coords: Coords }[]>([]);

  // ── Helpers ────────────────────────────────────────────────────────
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
          if (!c) { 
            setLocationError(`Could not find: ${person.name}`); 
            setLoading(false); 
            return; 
          }
        } else if (userCoords) {
          c = userCoords;
        }

        if (c) {
          coordsList.push(c);
          newMarkers.push({ id: person.id, name: person.name || 'Your Location', coords: c });
        }
      }

      if (coordsList.length < 2) {
        setLocationError('Need at least 2 locations');
        setLoading(false);
        return;
      }

      setPersonMarkers(newMarkers);
      const mid = calcMidpoint(coordsList);
      setMidpoint(mid);

      mapRef.current?.animateToRegion(
        { ...mid, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 800
      );

      const shouldFetch =
        !lastFetchCoords.current ||
        haversine(lastFetchCoords.current, mid) >= REFETCH_THRESHOLD_KM;

      if (shouldFetch) await fetchPlaces(mid);

    } finally {
      setLoading(false);
    }
  };

  const addPerson = () => {
    setPeople([...people, { id: Date.now(), name: '' }]);
  };

  const removePerson = (id: number) => {
    if (people.length > 2) {
      setPeople(people.filter((p) => p.id !== id));
    }
  };

  const updatePersonName = (id: number, text: string) => {
    setPeople(people.map((p) => (p.id === id ? { ...p, name: text } : p)));
  };

  const visiblePlaces = category === 'all'
    ? allPlaces
    : allPlaces.filter((p) => p.category === category);

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <Text style={styles.eyebrow}>AI-POWERED MEETING PLANNER</Text>
            <View style={styles.sparkleBadge}>
              <Ionicons name="sparkles" size={14} color={Colors[theme].primary} />
              <Text style={styles.sparkleText}>Smart Midpoint</Text>
            </View>
          </View>

          <Text style={styles.title}>Converge</Text>
          <Text style={styles.subtitle}>
            Find the perfect spot to meet in the middle, fair for everyone in the group.
          </Text>

          <View style={[styles.mapCard, { borderRadius: 24 }]}>
            <MapView
              ref={mapRef}
              style={styles.map}
              region={region}
              onRegionChangeComplete={setRegion}
              showsUserLocation={true}
              userInterfaceStyle={theme}
            >
              {midpoint && (
                <Marker
                  coordinate={midpoint}
                  title="Midpoint"
                  pinColor="blue"
                  zIndex={10}
                />
              )}
              {personMarkers.map((m, i) => (
                <Marker
                  key={m.id}
                  coordinate={m.coords}
                  title={`Person ${i + 1}`}
                  description={m.name}
                  pinColor="#ef4444"
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
                  description={`${place.category} · ★ ${place.rating}`}
                  pinColor="green"
                />
              ))}
              {midpoint && (
                <Circle
                  center={midpoint}
                  radius={FETCH_RADIUS_KM * 1000}
                  strokeColor="rgba(0,122,255,0.2)"
                  fillColor="rgba(0,122,255,0.04)"
                />
              )}
            </MapView>
            <View style={styles.mapOverlay}>
              <Ionicons name="location" size={14} color={Colors[theme].primary} />
              <Text style={styles.mapOverlayText}>
                {midpoint ? 'Midpoint calculated' : 'Showing live area'}
              </Text>
            </View>
          </View>

          <View style={styles.glassCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Where is everyone?</Text>
              <Text style={styles.sectionHint}>{people.length} People</Text>
            </View>

            {people.map((person, index) => (
              <View key={person.id} style={[styles.personCard, { backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.05)', borderRadius: 18, marginBottom: 12 }]}>
                <View style={styles.personCardHeader}>
                  <Text style={styles.personCardTitle}>Person {index + 1}</Text>
                  {people.length > 2 && (
                    <TouchableOpacity
                      onPress={() => removePerson(person.id)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="close-circle" size={16} color="#ef4444" />
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.2)', borderRadius: 14 }]}
                  placeholder="Address or area (blank = your location)"
                  placeholderTextColor={Colors[theme].placeholder}
                  value={person.name}
                  onChangeText={(text) => updatePersonName(person.id, text)}
                />
              </View>
            ))}

            <TouchableOpacity style={[styles.addPersonButton, { marginTop: 4 }]} onPress={addPerson}>
              <Ionicons name="add-circle" size={18} color={Colors[theme].primary} />
              <Text style={styles.addPersonText}>Add Another Person</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.glassCard}>
            <Text style={styles.sectionTitle}>What are you looking for?</Text>
            <View style={styles.categoryContainer}>
              {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    category === cat && styles.categoryActive,
                    { borderRadius: 14 }
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat && styles.categoryTextActive,
                    ]}
                  >
                    {CATEGORY_LABELS[cat]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {locationError ? (
            <View style={{ backgroundColor: '#fee2e2', padding: 12, borderRadius: 12, marginBottom: 16 }}>
              <Text style={{ color: '#b91c1c', textAlign: 'center', fontSize: 14, fontWeight: '600' }}>
                {locationError}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, { height: 60, borderRadius: 20 }]}
            onPress={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>Find Midpoint</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>Suggested Spots</Text>
            <Text style={styles.resultsCount}>{visiblePlaces.length} found</Text>
          </View>

          {visiblePlaces.length === 0 ? (
            <View style={[styles.emptyCard, { borderRadius: 18, backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.05)' }]}>
              <Ionicons name="information-circle" size={24} color={Colors[theme].muted} />
              <Text style={styles.emptyText}>
                {allPlaces.length > 0
                  ? 'No places for this category. Try "All".'
                  : 'Run a search to see midpoint recommendations.'}
              </Text>
            </View>
          ) : (
            visiblePlaces.map((place) => (
              <TouchableOpacity key={place._id} style={[styles.card, { borderRadius: 18, backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.1)' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{place.name}</Text>
                  <Text style={styles.cardSub}>{place.category}</Text>
                </View>
                <View style={styles.ratingPill}>
                  <Ionicons name="star" size={12} color="#f59e0b" />
                  <Text style={styles.ratingText}>{place.rating?.toFixed(1) ?? '—'}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}
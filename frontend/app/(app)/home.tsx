import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Circle, Region } from 'react-native-maps';
import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import HomeStyle from '../styles/HomeStyle';

type Person = { name: string };
type Category = 'all' | 'cafe' | 'restaurant' | 'park';
type Coords = { latitude: number; longitude: number };
type PlaceResult = {
  _id: string;
  name: string;
  rating: number;
  category: string;
  location: { coordinates: [number, number] }; // [lng, lat]
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
  const results = await Location.geocodeAsync(address);
  if (!results.length) return null;
  return { latitude: results[0].latitude, longitude: results[0].longitude };
}

// ── Component ──────────────────────────────────────────────────────
export default function HomeScreen() {
  const theme = useColorScheme();
  const styles = HomeStyle(theme);

  const [people, setPeople] = useState<Person[]>([{ name: '' }, { name: '' }]);
  const [category, setCategory] = useState<Category>('all');
  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const [midpoint, setMidpoint] = useState<Coords | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 17.385, longitude: 78.4867,
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
  const handleSearch = async () => {
    setLoading(true);
    setLocationError('');

    try {
      // Geocode any person who typed an address; use userCoords for blank fields
      const coordsList: Coords[] = [];
      for (const person of people) {
        if (person.name.trim()) {
          const c = await geocode(person.name.trim());
          if (!c) { setLocationError(`Could not find: ${person.name}`); setLoading(false); return; }
          coordsList.push(c);
        } else if (userCoords) {
          coordsList.push(userCoords); // blank = current user location
        }
      }

      if (coordsList.length < 2) {
        setLocationError('Need at least 2 locations');
        setLoading(false);
        return;
      }

      const mid = calcMidpoint(coordsList);
      setMidpoint(mid);

      // Move camera to midpoint
      mapRef.current?.animateToRegion(
        { ...mid, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 800
      );

      // Fetch only if first time or moved far enough
      const shouldFetch =
        !lastFetchCoords.current ||
        haversine(lastFetchCoords.current, mid) >= REFETCH_THRESHOLD_KM;

      if (shouldFetch) await fetchPlaces(mid);

    } finally {
      setLoading(false);
    }
  };

  // ── Filter cached places locally by category ─────────────────────
  const visiblePlaces = category === 'all'
    ? allPlaces
    : allPlaces.filter((p) => p.category === category);

  // ── Render ───────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Text style={styles.eyebrow}>Meet In The Middle</Text>
      </View>
      <Text style={styles.title}>Find your perfect midpoint</Text>
      <Text style={styles.subtitle}>
        Add everyones start locations and discover spots that are fair for the whole group.
      </Text>

      {/* ── Map card ── */}
      <View style={styles.mapCard}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation={true}
        >
          {/* Midpoint marker */}
          {midpoint && (
            <Marker
              coordinate={midpoint}
              title="Midpoint"
              pinColor="blue"
            />
          )}

          {/* Place result markers */}
          {visiblePlaces.map((place) => (
            <Marker
              key={place._id}
              coordinate={{
                latitude: place.location.coordinates[1],
                longitude: place.location.coordinates[0],
              }}
              title={place.name}
              description={`${place.category} · ★ ${place.rating}`}
            />
          ))}

          {/* Fetch radius circle */}
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
          <Ionicons name="location" size={12} color={Colors[theme].primary} />
          <Text style={styles.mapOverlayText}>
            {midpoint ? 'Showing midpoint' : 'Live location active'}
          </Text>
        </View>
      </View>

      {/* ── People inputs ── */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>People</Text>
          <Text style={styles.sectionHint}>Leave blank to use your live location</Text>
        </View>

        {people.map((person, index) => (
          <View key={index} style={styles.personCard}>
            <View style={styles.personCardHeader}>
              <Text style={styles.personCardTitle}>Person {index + 1}</Text>
              {people.length > 2 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => setPeople(people.filter((_, i) => i !== index))}
                >
                  <Ionicons name="remove-circle-outline" size={16} color="#ef4444" />
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              placeholder="Address or area (blank = your location)"
              value={person.name}
              onChangeText={(text) => {
                const updated = [...people];
                updated[index].name = text;
                setPeople(updated);
              }}
              style={styles.input}
              placeholderTextColor={Colors[theme].placeholder}
            />
          </View>
        ))}

        <TouchableOpacity
          onPress={() => setPeople([...people, { name: '' }])}
          style={styles.addPersonButton}
        >
          <Ionicons name="add-circle-outline" size={18} color={Colors[theme].primary} />
          <Text style={styles.addPersonText}>Add another person</Text>
        </TouchableOpacity>
      </View>

      {/* ── Category filter ── */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Place type</Text>
        <View style={styles.categoryContainer}>
          {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              style={[styles.categoryButton, category === cat && styles.categoryActive]}
            >
              <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
                {CATEGORY_LABELS[cat]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {locationError ? (
        <Text style={{ color: '#e11d48', textAlign: 'center', marginBottom: 12 }}>
          {locationError}
        </Text>
      ) : null}

      {/* ── Search button ── */}
      <TouchableOpacity onPress={handleSearch} style={styles.button} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <>
              <Text style={styles.buttonText}>Find Meeting Spot</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </>
        }
      </TouchableOpacity>

      {/* ── Results list ── */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>Results</Text>
        {visiblePlaces.length > 0 && (
          <Text style={styles.resultsCount}>{visiblePlaces.length} places</Text>
        )}
      </View>

      {visiblePlaces.length === 0 && (
        <View style={styles.emptyCard}>
          <Ionicons name="compass-outline" size={20} color={Colors[theme].muted} />
          <Text style={styles.emptyText}>
            {allPlaces.length > 0
              ? 'No places for this category. Try "All".'
              : 'Run a search to see midpoint recommendations.'}
          </Text>
        </View>
      )}

      {visiblePlaces.map((place) => (
        <View key={place._id} style={styles.card}>
          <View>
            <Text style={styles.cardTitle}>{place.name}</Text>
            <Text style={styles.cardSub}>{place.category}</Text>
          </View>
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={12} color={Colors[theme].accent} />
            <Text style={styles.ratingText}>{place.rating?.toFixed(1) ?? '—'}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
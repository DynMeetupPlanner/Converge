import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Circle, Region } from 'react-native-maps';
import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { API_URL } from '@/lib/api';
import HomeStyle from '../styles/HomeStyle';

type Person = { name: string };
type Category = 'all' | 'cafe' | 'restaurant' | 'park';
type Coords = { latitude: number; longitude: number };
type GeocodeResult = Coords & { name: string };
type PlaceResult = {
  _id: string;
  name: string;
  rating?: number;
  category: string;
  location: { coordinates: [number, number] };
};

const CATEGORY_LABELS: Record<Category, string> = {
  all: 'All',
  cafe: 'Cafe',
  restaurant: 'Restaurant',
  park: 'Park',
};

const FETCH_RADIUS_KM = 5;
const REFETCH_THRESHOLD_KM = 2;

function haversine(a: Coords, b: Coords): number {
  const earthRadiusKm = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function calcMidpoint(coords: Coords[]): Coords {
  const average = (items: number[]) => items.reduce((sum, value) => sum + value, 0) / items.length;

  return {
    latitude: average(coords.map((coord) => coord.latitude)),
    longitude: average(coords.map((coord) => coord.longitude)),
  };
}

async function readBackendJson(response: Response, route: string) {
  const contentType = response.headers.get('content-type') ?? '';
  const rawBody = await response.text();

  if (!contentType.includes('application/json')) {
    const compactBody = rawBody.replace(/\s+/g, ' ').trim();
    const routeMissing = compactBody.includes(`Cannot GET ${route}`) || response.status === 404;

    if (routeMissing) {
      throw new Error(`The backend at EXPO_PUBLIC_API_URL does not have ${route} deployed yet.`);
    }

    throw new Error(`Expected JSON from the backend, got ${contentType || 'non-JSON response'} instead.`);
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new Error('The backend returned invalid JSON.');
  }
}

async function geocode(address: string): Promise<GeocodeResult | null> {
  if (!API_URL) {
    throw new Error('Set EXPO_PUBLIC_API_URL before searching locations.');
  }

  const route = '/geo/search';
  const response = await fetch(`${API_URL}${route}?q=${encodeURIComponent(address)}`);
  const data = await readBackendJson(response, route);

  if (!response.ok) {
    throw new Error(data.msg || 'Failed to search location.');
  }

  return data.location ?? null;
}

export default function HomeScreen() {
  const theme = useColorScheme();
  const styles = HomeStyle(theme);

  const [people, setPeople] = useState<Person[]>([{ name: '' }, { name: '' }]);
  const [category, setCategory] = useState<Category>('all');
  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const [midpoint, setMidpoint] = useState<Coords | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 17.385,
    longitude: 78.4867,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const [allPlaces, setAllPlaces] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  const lastFetchCoords = useRef<Coords | null>(null);
  const isFetching = useRef(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined;

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
      setRegion({
        ...coords,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 20,
        },
        (nextLocation) =>
          setUserCoords({
            latitude: nextLocation.coords.latitude,
            longitude: nextLocation.coords.longitude,
          })
      );
    })();

    return () => subscription?.remove();
  }, []);

  const fetchPlaces = async (coords: Coords) => {
    if (isFetching.current || !API_URL) {
      if (!API_URL) {
        setLocationError('Set EXPO_PUBLIC_API_URL before fetching places.');
      }
      return;
    }

    isFetching.current = true;
    lastFetchCoords.current = coords;

    try {
      const route = '/places/nearby';
      const response = await fetch(
        `${API_URL}${route}?lat=${coords.latitude}&lng=${coords.longitude}&radius=${FETCH_RADIUS_KM}`
      );
      const data = await readBackendJson(response, route);

      if (!response.ok) {
        setLocationError(data.msg || 'Failed to fetch places.');
        return;
      }

      setAllPlaces(data.places ?? []);
    } catch (error) {
      console.error('Failed to fetch places:', error);
      setLocationError(error instanceof Error ? error.message : 'Failed to fetch places.');
    } finally {
      isFetching.current = false;
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setLocationError('');

    try {
      const coordsList: Coords[] = [];

      for (const person of people) {
        if (person.name.trim()) {
          const coords = await geocode(person.name.trim());

          if (!coords) {
            setLocationError(`Could not find: ${person.name}`);
            return;
          }

          coordsList.push(coords);
        } else if (userCoords) {
          coordsList.push(userCoords);
        }
      }

      if (coordsList.length < 2) {
        setLocationError('Need at least 2 locations');
        return;
      }

      const nextMidpoint = calcMidpoint(coordsList);
      const nextRegion = {
        ...nextMidpoint,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      setMidpoint(nextMidpoint);
      setRegion(nextRegion);
      mapRef.current?.animateToRegion(nextRegion, 800);

      const shouldFetch =
        !lastFetchCoords.current || haversine(lastFetchCoords.current, nextMidpoint) >= REFETCH_THRESHOLD_KM;

      if (shouldFetch) {
        await fetchPlaces(nextMidpoint);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setLocationError(error instanceof Error ? error.message : 'Search failed.');
    } finally {
      setLoading(false);
    }
  };

  const visiblePlaces =
    category === 'all' ? allPlaces : allPlaces.filter((place) => place.category === category);

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
        Add each start location and discover spots that are fair for the whole group.
      </Text>

      <View style={styles.mapCard}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation={true}
        >
          {midpoint && <Marker coordinate={midpoint} title="Midpoint" pinColor="blue" />}

          {visiblePlaces.map((place) => (
            <Marker
              key={place._id}
              coordinate={{
                latitude: place.location.coordinates[1],
                longitude: place.location.coordinates[0],
              }}
              title={place.name}
              description={`${place.category} · ★ ${place.rating ?? '-'}`}
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
          <Ionicons name="location" size={12} color={Colors[theme].primary} />
          <Text style={styles.mapOverlayText}>
            {midpoint ? 'Showing midpoint' : 'Live location active'}
          </Text>
        </View>
      </View>

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
                  onPress={() => setPeople(people.filter((_, personIndex) => personIndex !== index))}
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
                const updatedPeople = [...people];
                updatedPeople[index].name = text;
                setPeople(updatedPeople);
              }}
              style={styles.input}
              placeholderTextColor={Colors[theme].placeholder}
            />
          </View>
        ))}

        <TouchableOpacity onPress={() => setPeople([...people, { name: '' }])} style={styles.addPersonButton}>
          <Ionicons name="add-circle-outline" size={18} color={Colors[theme].primary} />
          <Text style={styles.addPersonText}>Add another person</Text>
        </TouchableOpacity>
      </View>

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

      <TouchableOpacity onPress={handleSearch} style={styles.button} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.buttonText}>Find Meeting Spot</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </>
        )}
      </TouchableOpacity>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>Results</Text>
        {visiblePlaces.length > 0 && <Text style={styles.resultsCount}>{visiblePlaces.length} places</Text>}
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
            <Text style={styles.ratingText}>
              {typeof place.rating === 'number' ? place.rating.toFixed(1) : '-'}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

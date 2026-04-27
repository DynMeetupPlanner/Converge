import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity, Platform } from 'react-native';
import MapView, { Marker, MapPressEvent, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '@/components/GradientBackground';

export default function DynamicMap() {
  const theme = useColorScheme();
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [markers, setMarkers] = useState<{ id: string; latitude: number; longitude: number }[]>([]);
  const [region, setRegion] = useState<Region | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is needed for the map.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
      const initialRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(initialRegion);
      mapRef.current?.animateToRegion(initialRegion, 1000);

      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
        (loc) => setUserLocation(loc)
      );
    })();
  }, []);

  const handleMapPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const newMarker = {
      id: Date.now().toString(),
      latitude,
      longitude,
    };
    setMarkers((prev) => [...prev, newMarker]);
  };

  if (!region) return null;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        onPress={handleMapPress}
        userInterfaceStyle={theme}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            draggable
            onLongPress={() =>
              setMarkers((prev) => prev.filter((m) => m.id !== marker.id))
            }
          />
        ))}
      </MapView>

      {/* Premium Glass Overlays */}
      <View style={[styles.glassOverlay, { backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(18, 26, 36, 0.8)' }]}>
        <Text style={[styles.overlayTitle, { color: Colors[theme].text }]}>Explorer Mode</Text>
        <Text style={[styles.overlaySub, { color: Colors[theme].muted }]}>
          {markers.length > 0 ? `${markers.length} markers dropped` : 'Tap anywhere to drop a marker'}
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.myLocationButton, { backgroundColor: Colors[theme].primary }]}
        onPress={() => {
          if (userLocation) {
            mapRef.current?.animateToRegion({
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }, 1000);
          }
        }}
      >
        <Ionicons name="locate" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  glassOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  overlayTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  overlaySub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
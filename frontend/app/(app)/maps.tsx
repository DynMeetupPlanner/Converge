import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, MapPressEvent, Region } from 'react-native-maps';
import * as Location from 'expo-location';

export default function DynamicMap() {
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [markers, setMarkers] = useState<{ id: string; latitude: number; longitude: number }[]>([]);
  const [region, setRegion] = useState<Region | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is needed for the map.');
        return;
      }

      // Get initial position
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      // Watch for live updates
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

  if (!region) return null; // or a loading spinner

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}       // blue dot for live location
        followsUserLocation={true}     // keeps camera on user
        showsMyLocationButton={true}
        onPress={handleMapPress}       // tap to add markers
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            draggable                  // optional: make them draggable too
            onLongPress={() =>
              setMarkers((prev) => prev.filter((m) => m.id !== marker.id))
            }
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
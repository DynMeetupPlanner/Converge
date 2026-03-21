import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { useState } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import HomeStyle from '../styles/HomeStyle';

type Person = {
  name: string;
  location: string;
};

type Category = 'all' | 'cafe' | 'restaurant' | 'park';

type PlaceResult = {
  name: string;
  rating: number;
  eta: string;
};

const CATEGORY_LABELS: Record<Category, string> = {
  all: 'All',
  cafe: 'Cafe',
  restaurant: 'Restaurant',
  park: 'Park',
};

export default function HomeScreen() {
  const theme = useColorScheme();
  const styles = HomeStyle(theme);

  const [people, setPeople] = useState<Person[]>([
    { name: '', location: '' },
    { name: '', location: '' },
  ]);
  const [category, setCategory] = useState<Category>('all');
  const [results, setResults] = useState<PlaceResult[]>([]);

  const addPerson = () => {
    setPeople([...people, { name: '', location: '' }]);
  };

  const removePerson = (index: number) => {
    if (people.length <= 2) return;
    const updated = people.filter((_, i) => i !== index);
    setPeople(updated);
  };

  const updatePersonName = (text: string, index: number) => {
    const updated = [...people];
    updated[index].name = text;
    setPeople(updated);
  };

  const updatePersonLocation = (text: string, index: number) => {
    const updated = [...people];
    updated[index].location = text;
    setPeople(updated);
  };

  const handleSearch = () => {
    const demoResults: Record<Category, PlaceResult[]> = {
      all: [
        { name: 'Confluence Bistro', rating: 4.6, eta: '12 min avg' },
        { name: 'Central Courtyard', rating: 4.4, eta: '15 min avg' },
      ],
      cafe: [
        { name: 'Bean Theory', rating: 4.7, eta: '11 min avg' },
        { name: 'Slow Brew Works', rating: 4.5, eta: '14 min avg' },
      ],
      restaurant: [
        { name: 'Mosaic Table', rating: 4.6, eta: '13 min avg' },
        { name: 'Fork & Field', rating: 4.4, eta: '16 min avg' },
      ],
      park: [
        { name: 'Lakefront Greens', rating: 4.8, eta: '10 min avg' },
        { name: 'Willow Commons', rating: 4.5, eta: '14 min avg' },
      ],
    };

    setResults(demoResults[category]);
  };

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
        Add everyone&apos;s start locations and discover spots that are fair for the whole group.
      </Text>

      <View style={styles.mapCard}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 17.385,
            longitude: 78.4867,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
        >
          <Marker coordinate={{ latitude: 17.385, longitude: 78.4867 }} />
        </MapView>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>People</Text>
          <Text style={styles.sectionHint}>At least 2 required</Text>
        </View>

        {people.map((person, index) => (
          <View key={`${index}-${person.name}`} style={styles.personCard}>
            <View style={styles.personCardHeader}>
              <Text style={styles.personCardTitle}>Person {index + 1}</Text>
              {people.length > 2 && (
                <TouchableOpacity style={styles.removeButton} onPress={() => removePerson(index)}>
                  <Ionicons name="remove-circle-outline" size={16} color="#ef4444" />
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            <TextInput
              placeholder="Name"
              value={person.name}
              onChangeText={(text) => updatePersonName(text, index)}
              style={styles.input}
              placeholderTextColor={Colors[theme].placeholder}
            />

            <TextInput
              placeholder="Location"
              value={person.location}
              onChangeText={(text) => updatePersonLocation(text, index)}
              style={styles.input}
              placeholderTextColor={Colors[theme].placeholder}
            />
          </View>
        ))}

        <TouchableOpacity onPress={addPerson} style={styles.addPersonButton}>
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
              style={[
                styles.categoryButton,
                category === cat && styles.categoryActive,
              ]}
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

      <TouchableOpacity onPress={handleSearch} style={styles.button}>
        <Text style={styles.buttonText}>Find Meeting Spot</Text>
        <Ionicons name="arrow-forward" size={18} color="#fff" />
      </TouchableOpacity>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>Results</Text>
        {results.length > 0 && <Text style={styles.resultsCount}>{results.length} places</Text>}
      </View>

      {results.length === 0 && (
        <View style={styles.emptyCard}>
          <Ionicons name="compass-outline" size={20} color={Colors[theme].muted} />
          <Text style={styles.emptyText}>Run a search to see midpoint recommendations.</Text>
        </View>
      )}

      {results.map((place) => (
        <View key={place.name} style={styles.card}>
          <View>
            <Text style={styles.cardTitle}>{place.name}</Text>
            <Text style={styles.cardSub}>{place.eta}</Text>
          </View>
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={12} color={Colors[theme].accent} />
            <Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

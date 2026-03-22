import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import SavedStyle from '../styles/SavedStyle';

type PlaceStatus = 'saved' | 'visited';
type SavedFilter = 'all' | PlaceStatus;

type Place = {
  id: string;
  name: string;
  area: string;
  category: string;
  distance: string;
  status: PlaceStatus;
  lastVisit: string;
};

const PLACEHOLDER_PLACES: Place[] = [
  {
    id: '1',
    name: 'Confluence Bistro',
    area: 'Banjara Hills',
    category: 'Restaurant',
    distance: '4.3 km away',
    status: 'saved',
    lastVisit: 'Added 2 days ago',
  },
  {
    id: '2',
    name: 'Bean Theory',
    area: 'Jubilee Hills',
    category: 'Cafe',
    distance: '2.8 km away',
    status: 'visited',
    lastVisit: 'Visited last Sunday',
  },
  {
    id: '3',
    name: 'Willow Commons',
    area: 'Madhapur',
    category: 'Park',
    distance: '5.1 km away',
    status: 'saved',
    lastVisit: 'Added this week',
  },
  {
    id: '4',
    name: 'Mosaic Table',
    area: 'Gachibowli',
    category: 'Restaurant',
    distance: '6.0 km away',
    status: 'visited',
    lastVisit: 'Visited 3 weeks ago',
  },
    {
    id: '5',
    name: 'Mosaic Table',
    area: 'Gachibowli',
    category: 'Restaurant',
    distance: '6.0 km away',
    status: 'visited',
    lastVisit: 'Visited 3 weeks ago',
  },
    {
    id: '6',
    name: 'Mosaic Table',
    area: 'Gachibowli',
    category: 'Restaurant',
    distance: '6.0 km away',
    status: 'visited',
    lastVisit: 'Visited 3 weeks ago',
  },
    {
    id: '7',
    name: 'Mosaic Table',
    area: 'Gachibowli',
    category: 'Restaurant',
    distance: '6.0 km away',
    status: 'visited',
    lastVisit: 'Visited 3 weeks ago',
  },
];

const FILTER_OPTIONS: SavedFilter[] = ['all', 'saved', 'visited'];

export default function SavedScreen() {
  const theme = useColorScheme();
  const styles = SavedStyle(theme);
  const tabBarHeight = useBottomTabBarHeight();
  const [activeFilter, setActiveFilter] = useState<SavedFilter>('all');

  const filteredPlaces =
    activeFilter === 'all'
      ? PLACEHOLDER_PLACES
      : PLACEHOLDER_PLACES.filter((place) => place.status === activeFilter);


  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: tabBarHeight},
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.eyebrow}>Library</Text>
          <View style={styles.countPill}>
            <Ionicons name="bookmark" size={12} color={Colors[theme].accent} />
            <Text style={styles.countPillText}>{PLACEHOLDER_PLACES.length} places</Text>
          </View>
        </View>

        <Text style={styles.title}>Saved places</Text>
        <Text style={styles.subtitle}>
          Keep track of places you want to revisit and spots you have already checked out.
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {PLACEHOLDER_PLACES.filter((place) => place.status === 'saved').length}
            </Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {PLACEHOLDER_PLACES.filter((place) => place.status === 'visited').length}
            </Text>
            <Text style={styles.statLabel}>Visited</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>3.9</Text>
            <Text style={styles.statLabel}>Avg distance</Text>
          </View>
        </View>

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsTitle}>Your places</Text>
          <Text style={styles.resultsCount}>{filteredPlaces.length} shown</Text>
        </View>

        {filteredPlaces.map((place) => {
          const isVisited = place.status === 'visited';
          return (
            <View key={place.id} style={styles.placeCard}>
              <View style={styles.cardLeft}>
                <View style={[styles.iconWrap, isVisited ? styles.visitedIcon : styles.savedIcon]}>
                  <Ionicons
                    name={isVisited ? 'checkmark-done' : 'bookmark'}
                    size={14}
                    color="#fff"
                  />
                </View>
                <View>
                  <Text style={styles.placeName}>{place.name}</Text>
                  <Text style={styles.placeMeta}>{place.area} · {place.category}</Text>
                  <Text style={styles.placeSub}>{place.lastVisit}</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <View style={[styles.statusPill, isVisited ? styles.visitedPill : styles.savedPill]}>
                  <Text style={styles.statusPillText}>{place.status}</Text>
                </View>
                <Text style={styles.distanceText}>{place.distance}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.bottomTray, { bottom: 7 }]}>
        <View style={styles.filterBar}>
          {FILTER_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => setActiveFilter(option)}
              style={[
                styles.filterChip,
                activeFilter === option && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === option && styles.filterChipTextActive,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
       
      </View>
    </View>
  );
}

import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Platform } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { SavedStyle } from '../styles/SavedStyle';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '@/components/GradientBackground';

const SAVED_DATA = [
  { id: '1', name: 'Blue Tokai Coffee', category: 'Cafe', rating: 4.5, visited: true, distance: '1.2 km' },
  { id: '2', name: 'Toscano Restaurant', category: 'Restaurant', rating: 4.2, visited: false, distance: '0.8 km' },
  { id: '3', name: 'Cubbon Park', category: 'Park', rating: 4.8, visited: true, distance: '2.5 km' },
  { id: '4', name: 'Third Wave Coffee', category: 'Cafe', rating: 4.3, visited: false, distance: '1.5 km' },
];

export default function SavedScreen() {
  const theme = useColorScheme();
  const styles = SavedStyle(theme);
  const [filter, setFilter] = useState('all');

  const filteredData = SAVED_DATA.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'visited') return item.visited;
    if (filter === 'unvisited') return !item.visited;
    return true;
  });

  return (
    <GradientBackground>
      <SafeAreaView style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.headerRow}>
            <Text style={styles.eyebrow}>YOUR FAVORITE SPOTS</Text>
            <View style={[styles.countPill, { borderRadius: 12, backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)' }]}>
              <Ionicons name="bookmark" size={14} color={Colors[theme].primary} />
              <Text style={styles.countPillText}>{SAVED_DATA.length} Saved</Text>
            </View>
          </View>

          <Text style={styles.title}>Collections</Text>
          <Text style={styles.subtitle}>
            Quickly access your most loved meeting points and see where you've been.
          </Text>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { borderRadius: 20, backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.05)' }]}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Total Spots</Text>
            </View>
            <View style={[styles.statCard, { borderRadius: 20, backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.05)' }]}>
              <Text style={styles.statNumber}>8</Text>
              <Text style={styles.statLabel}>Visited</Text>
            </View>
          </View>

          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>My Places</Text>
            <Text style={styles.resultsCount}>{filteredData.length} places</Text>
          </View>

          {filteredData.map((item) => (
            <TouchableOpacity key={item.id} style={[styles.glassCard, { padding: 16, backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.1)' }]}>
              <View style={styles.cardLeft}>
                <View style={[styles.iconWrap, item.visited ? styles.visitedIcon : styles.savedIcon, { borderRadius: 10 }]}>
                  <Ionicons 
                    name={item.visited ? "checkmark-circle" : "bookmark"} 
                    size={16} 
                    color="#fff" 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.placeName}>{item.name}</Text>
                  <Text style={styles.placeMeta}>{item.category} · ★ {item.rating}</Text>
                  <Text style={styles.placeSub}>{item.distance} from you</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <View style={[
                  styles.statusPill, 
                  item.visited ? styles.visitedPill : styles.savedPill,
                  { borderRadius: 10 }
                ]}>
                  <Text style={styles.statusPillText}>{item.visited ? 'Visited' : 'Saved'}</Text>
                </View>
                <Text style={styles.distanceText}>{item.distance}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={[styles.bottomTray, { bottom: Platform.OS === 'ios' ? 100 : 80, borderRadius: 24, padding: 8, backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(18, 26, 36, 0.8)' }]}>
          <View style={[styles.filterBar, { borderRadius: 18 }]}>
            {['all', 'visited', 'unvisited'].map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterChip, filter === f && styles.filterChipActive, { borderRadius: 14 }]}
                onPress={() => setFilter(f)}
              >
                <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                  {f === 'unvisited' ? 'Plan Next' : f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

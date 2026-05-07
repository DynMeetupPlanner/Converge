import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { s } from '../../tempStyles/SavedStyle';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/api';

const API_BASE = API_URL || 'https://sturdy-goggles-1033249426470.asia-south1.run.app';

type SavedPlace = {
  _id?: string;
  placeId: string;
  name: string;
  category: string;
  rating?: number | null;
  status: 'saved' | 'visited';
  vicinity?: string;
  links?: {
    maps?: string;
    zomato?: string;
    swiggy?: string;
  };
};

// ── Palette (matches HomeScreen) ─────────────────────────────────
const C = {
  bg:        '#08090E',
  surface:   '#0F1118',
  card:      '#141720',
  border:    '#1E2235',
  accent:    '#6C7FFF',
  accentSoft:'rgba(108,127,255,0.12)',
  green:     '#2ECC8A',
  greenSoft: 'rgba(46,204,138,0.12)',
  red:       '#FF5C72',
  redSoft:   'rgba(255,92,114,0.12)',
  amber:     '#FFC14D',
  amberSoft: 'rgba(255,193,77,0.12)',
  text:      '#EDF0FF',
  textSub:   '#8B91B0',
  textMuted: '#3E4460',
  white:     '#FFFFFF',
};

const CAT_COLORS: Record<string, string> = {
  cafe:       C.amber,
  restaurant: C.red,
  park:       C.green,
};

const CAT_ICONS: Record<string, string> = {
  cafe:       'cafe',
  restaurant: 'restaurant',
  park:       'leaf',
};

const FILTERS = [
  { key: 'all',       label: 'All',       icon: 'apps' },
  { key: 'visited',   label: 'Visited',   icon: 'checkmark-circle' },
  { key: 'unvisited', label: 'Plan Next', icon: 'bookmark' },
];

export default function SavedScreen() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSavedPlaces = React.useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/places/saved?userId=${user.id}`);
      const data = await res.json();
      if (res.ok) setPlaces(data.places || []);
    } catch (err) {
      console.error('Saved places error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSavedPlaces();
  }, [fetchSavedPlaces]);

  const markVisited = async (place: SavedPlace) => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/places/saved/${encodeURIComponent(place.placeId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, status: place.status === 'visited' ? 'saved' : 'visited' }),
      });
      const data = await res.json();
      if (res.ok) setPlaces(data.places || []);
    } catch (err) {
      console.error('Update saved place error:', err);
    }
  };

  const deletePlace = (place: SavedPlace) => {
    if (!user?.id) return;

    Alert.alert(
      'Delete saved place',
      `Remove ${place.name} from your saved places?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await fetch(`${API_BASE}/places/saved/${encodeURIComponent(place.placeId)}?userId=${user.id}`, {
                method: 'DELETE',
              });
              const data = await res.json();
              if (res.ok) {
                setPlaces(data.places || []);
              } else {
                alert(data.msg || 'Could not delete saved place');
              }
            } catch (err) {
              console.error('Delete saved place error:', err);
              alert('Could not delete saved place right now');
            }
          },
        },
      ]
    );
  };

  const filteredData = places.filter((item) => {
    if (filter === 'visited')   return item.status === 'visited';
    if (filter === 'unvisited') return item.status !== 'visited';
    return true;
  });

  const visitedCount   = places.filter((i) => i.status === 'visited').length;
  const unvisitedCount = places.filter((i) => i.status !== 'visited').length;

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSavedPlaces(); }} tintColor={C.accent} />}
      >

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.logoBadge}>
            <Ionicons name="bookmark" size={16} color={C.accent} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.appName}>COLLECTIONS</Text>
            <Text style={s.tagline}>Your saved & visited spots</Text>
          </View>
          <View style={s.countChip}>
            <Text style={s.countChipText}>{places.length}</Text>
            <Text style={s.countChipLabel}> saved</Text>
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <View style={[s.statIcon, { backgroundColor: C.accentSoft, borderColor: C.accent + '44' }]}>
              <Ionicons name="location" size={16} color={C.accent} />
            </View>
            <Text style={s.statVal}>{places.length}</Text>
            <Text style={s.statLabel}>Total Spots</Text>
          </View>

          <View style={s.statCard}>
            <View style={[s.statIcon, { backgroundColor: C.greenSoft, borderColor: C.green + '44' }]}>
              <Ionicons name="checkmark-circle" size={16} color={C.green} />
            </View>
            <Text style={s.statVal}>{visitedCount}</Text>
            <Text style={s.statLabel}>Visited</Text>
          </View>

          <View style={s.statCard}>
            <View style={[s.statIcon, { backgroundColor: C.amberSoft, borderColor: C.amber + '44' }]}>
              <Ionicons name="bookmark" size={16} color={C.amber} />
            </View>
            <Text style={s.statVal}>{unvisitedCount}</Text>
            <Text style={s.statLabel}>Plan Next</Text>
          </View>
        </View>

        {/* ── List header ── */}
        <View style={s.listHead}>
          <Text style={s.sectionLabel}>MY PLACES</Text>
          <Text style={s.listCount}>{filteredData.length} places</Text>
        </View>

        {/* ── Cards ── */}
        {loading ? (
          <ActivityIndicator color={C.accent} style={{ marginTop: 30 }} />
        ) : filteredData.length === 0 ? (
          <View style={s.emptyCard}>
            <View style={s.emptyIcon}>
              <Ionicons name="bookmark-outline" size={28} color={C.textMuted} />
            </View>
            <Text style={s.emptyTitle}>Nothing here yet</Text>
            <Text style={s.emptyMsg}>Spots you save or visit will appear here.</Text>
          </View>
        ) : (
          filteredData.map((item) => {
            const dot   = CAT_COLORS[item.category] ?? C.accent;
            const icon  = CAT_ICONS[item.category]  ?? 'location';
            const isVisited = item.status === 'visited';
            return (
              <TouchableOpacity key={item.placeId} style={s.placeCard} activeOpacity={0.8} onPress={() => Linking.openURL(item.links?.maps || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name)}`)}>

                {/* Category icon */}
                <View style={[s.catIcon, { backgroundColor: dot + '18', borderColor: dot + '55' }]}>
                  <Ionicons name={icon as any} size={16} color={dot} />
                </View>

                {/* Info */}
                <View style={s.placeInfo}>
                  <Text style={s.placeName}>{item.name}</Text>
                  <View style={s.placeMeta}>
                    <View style={[s.catDot, { backgroundColor: dot }]} />
                    <Text style={s.placeCategory}>{item.category}</Text>
                    {item.vicinity ? <Text style={s.placeDist}> · {item.vicinity}</Text> : null}
                  </View>
                </View>

                {/* Right side */}
                <View style={s.cardRight}>
                  {/* Status pill */}
                  <TouchableOpacity style={[
                    s.statusPill,
                    isVisited
                      ? { backgroundColor: C.greenSoft, borderColor: C.green + '44' }
                      : { backgroundColor: C.accentSoft, borderColor: C.accent + '44' },
                  ]} onPress={() => markVisited(item)}>
                    <Ionicons
                      name={isVisited ? 'checkmark' : 'bookmark'}
                      size={10}
                      color={isVisited ? C.green : C.accent}
                    />
                    <Text style={[s.statusText, { color: isVisited ? C.green : C.accent }]}>
                      {isVisited ? 'Visited' : 'Saved'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.statusPill, { backgroundColor: C.redSoft, borderColor: C.red + '44' }]}
                    onPress={() => deletePlace(item)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={10}
                      color={C.red}
                    />
                    <Text style={[s.statusText, { color: C.red }]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>

                <Ionicons name="chevron-forward" size={14} color={C.textMuted} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            );
          })
        )}

        {/* Bottom padding so last card clears the filter tray */}
        <View style={{ height: 70 }} />
      </ScrollView>

      {/* ── Filter tray ── */}
      <View style={s.tray}>
        <View style={s.filterBar}>
          {FILTERS.map(({ key, label, icon }) => {
            const active = filter === key;
            return (
              <TouchableOpacity
                key={key}
                style={[s.filterBtn, active && s.filterBtnActive]}
                onPress={() => setFilter(key)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={icon as any}
                  size={13}
                  color={active ? C.white : C.textSub}
                  style={{ marginRight: 5 }}
                />
                <Text style={[s.filterLabel, active && s.filterLabelActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

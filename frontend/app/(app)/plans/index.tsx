import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { usePlans } from '@/context/PlanContext';
import { s, C } from '../../../tempStyles/PlanStyle';
import { API_URL } from '@/lib/api';

const API_BASE = API_URL || 'https://sturdy-goggles-1033249426470.asia-south1.run.app';

export default function MyPlansScreen() {
  const { user } = useAuth();
  const { plans, setPlans } = usePlans();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPlans = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/plans/my?userId=${user?.id}`);
      if (!res.ok) {
        const text = await res.text();
        console.error(`Fetch plans failed (${res.status}):`, text);
        return;
      }
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, setPlans]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPlans();
  };

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />
        }
      >
        <View style={s.header}>
          <View style={s.logoBadge}>
            <Ionicons name="calendar" size={16} color={C.accent} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.appName}>MY PLANS</Text>
            <Text style={s.tagline}>Meeting up with friends</Text>
          </View>
          <View style={s.countChip}>
            <Text style={s.countChipText}>{plans.length}</Text>
            <Text style={s.countChipLabel}>active</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <View style={[s.statIcon, { backgroundColor: C.accentSoft, borderColor: C.accent + '44' }]}>
              <Ionicons name="calendar" size={16} color={C.accent} />
            </View>
            <Text style={s.statVal}>{plans.length}</Text>
            <Text style={s.statLabel}>Total Plans</Text>
          </View>

          <View style={s.statCard}>
            <View style={[s.statIcon, { backgroundColor: C.greenSoft, borderColor: C.green + '44' }]}>
              <Ionicons name="people" size={16} color={C.green} />
            </View>
            <Text style={s.statVal}>
              {plans.reduce((acc, p) => acc + (p.members?.length || 0), 0)}
            </Text>
            <Text style={s.statLabel}>Participants</Text>
          </View>

          <View style={s.statCard}>
            <View style={[s.statIcon, { backgroundColor: C.amberSoft, borderColor: C.amber + '44' }]}>
              <Ionicons name="location" size={16} color={C.amber} />
            </View>
            <Text style={s.statVal}>
              {plans.filter(p => !!p.midpoint).length}
            </Text>
            <Text style={s.statLabel}>Midpoints</Text>
          </View>
        </View>

        <View style={s.listHead}>
          <Text style={s.sectionLabel}>ALL PLANS</Text>
          <Text style={s.listCount}>{plans.length} total</Text>
        </View>

        {loading ? (
          <View style={{ marginTop: 100 }}>
            <ActivityIndicator size="large" color={C.accent} />
          </View>
        ) : plans.length === 0 ? (
          <View style={s.emptyCard}>
            <View style={s.emptyIcon}>
              <Ionicons name="calendar-outline" size={28} color={C.textMuted} />
            </View>
            <Text style={s.emptyTitle}>No plans yet</Text>
            <Text style={s.emptyMsg}>
              Create a plan and invite your friends to find the perfect midpoint!
            </Text>
            <TouchableOpacity
              style={[s.button, { marginTop: 20, paddingHorizontal: 30 }]}
              onPress={() => router.push('/plans/create')}
            >
              <Text style={s.buttonText}>Start a Plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          plans.map((plan) => (
            <TouchableOpacity
              key={plan._id}
              style={s.planCard}
              onPress={() => router.push(`/plans/${plan._id}`)}
              activeOpacity={0.8}
            >
              {/* Left Icon */}
              <View style={[s.avatar, { backgroundColor: C.accentSoft, borderColor: C.accent + '44' }]}>
                <Ionicons name="calendar-outline" size={18} color={C.accent} />
              </View>

              {/* Info */}
              <View style={s.planInfo}>
                <Text style={s.planName}>{plan.name}</Text>
                <View style={s.planMeta}>
                  <View style={s.metaItem}>
                    <Ionicons name="people-outline" size={14} color={C.textMuted} style={{ marginRight: 4 }} />
                    <Text style={s.metaText}>{plan.members?.length || 0} members</Text>
                  </View>
                  <View style={s.metaItem}>
                    <Ionicons name="time-outline" size={14} color={C.textMuted} style={{ marginRight: 4 }} />
                    <Text style={s.metaText}>
                      {new Date(plan.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Right side (Status) */}
              <View style={{ alignItems: 'flex-end' }}>
                {plan.midpoint && (
                  <View style={[s.badge, { backgroundColor: C.greenSoft, borderColor: C.green + '44' }]}>
                    <Ionicons name="checkmark" size={10} color={C.green} />
                    <Text style={[s.badgeText, { color: C.green }]}>Ready</Text>
                  </View>
                )}
              </View>

              <Ionicons name="chevron-forward" size={14} color={C.textMuted} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {plans.length > 0 && (
        <TouchableOpacity
          style={s.fab}
          onPress={() => router.push('/plans/create')}
        >
          <Ionicons name="add" size={30} color={C.white} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

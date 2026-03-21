import { View, Text, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import SettingsStyle from '../styles/SettingsStyle';

type DefaultCategory = 'all' | 'cafe' | 'restaurant' | 'park';

export default function SettingsScreen() {
  const theme = useColorScheme();
  const styles = SettingsStyle(theme);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [autoSavePlaces, setAutoSavePlaces] = useState(true);
  const [defaultCategory, setDefaultCategory] = useState<DefaultCategory>('all');

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => router.replace('/'),
      },
    ]);
  };


  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.eyebrow}>Settings</Text>
      <Text style={styles.title}>Manage your app</Text>
      <Text style={styles.subtitle}>
        Control preferences, privacy, and default behavior for meeting spot recommendations.
      </Text>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.accountRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={18} color="#fff" />
          </View>
          <View style={styles.accountTextWrap}>
            <Text style={styles.accountName}>Guest User</Text>
            <Text style={styles.accountEmail}>you@example.com</Text>
          </View>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingLabelWrap}>
            <Text style={styles.settingLabel}>Push notifications</Text>
            <Text style={styles.settingHint}>Get updates for suggestions and trip changes</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            thumbColor="#ffffff"
            trackColor={{ false: '#6b7280', true: Colors[theme].primary }}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLabelWrap}>
            <Text style={styles.settingLabel}>Use current location</Text>
            <Text style={styles.settingHint}>Speed up midpoint selection with GPS</Text>
          </View>
          <Switch
            value={useCurrentLocation}
            onValueChange={setUseCurrentLocation}
            thumbColor="#ffffff"
            trackColor={{ false: '#6b7280', true: Colors[theme].primary }}
          />
        </View>

        <View style={styles.settingRowNoBorder}>
          <View style={styles.settingLabelWrap}>
            <Text style={styles.settingLabel}>Auto-save places</Text>
            <Text style={styles.settingHint}>Save top suggestions after each search</Text>
          </View>
          <Switch
            value={autoSavePlaces}
            onValueChange={setAutoSavePlaces}
            thumbColor="#ffffff"
            trackColor={{ false: '#6b7280', true: Colors[theme].primary }}
          />
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Default place type</Text>
        <View style={styles.categoryRow}>
          {(['all', 'cafe', 'restaurant', 'park'] as DefaultCategory[]).map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => setDefaultCategory(category)}
              style={[
                styles.categoryChip,
                defaultCategory === category && styles.categoryChipActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  defaultCategory === category && styles.categoryChipTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Support & Privacy</Text>

        <TouchableOpacity style={styles.linkRow}>
          <Text style={styles.linkText}>Saved places</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors[theme].muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkRow}>
          <Text style={styles.linkText}>Privacy policy</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors[theme].muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkRowNoBorder}>
          <Text style={styles.linkText}>Help center</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors[theme].muted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#fff" />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

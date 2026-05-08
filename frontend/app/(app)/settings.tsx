import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,  
  TouchableOpacity,
  Switch,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { s } from '../../tempStyles/SettingsStyle';
import { API_URL } from '@/lib/api';

// ── Palette (matches HomeScreen & SavedScreen) ────────────────────
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

type PreferredSpotType = 'all' | 'cafe' | 'restaurant' | 'park' | 'mall' | 'bar';

const SPOT_TYPES: { key: PreferredSpotType; label: string; icon: string; color: string }[] = [
  { key: 'cafe',       label: 'Café',   icon: 'cafe',       color: C.amber },
  { key: 'restaurant', label: 'Dine',   icon: 'restaurant', color: C.red   },
  { key: 'park',       label: 'Park',   icon: 'leaf',       color: C.green },
  { key: 'mall',       label: 'Mall',   icon: 'storefront', color: C.accent },
  { key: 'bar',        label: 'Bar',    icon: 'wine',       color: C.red },
];

const LEGAL_LINKS = [
  { label: 'Help Center',       icon: 'help-circle-outline'  },
  { label: 'Terms of Service',  icon: 'document-text-outline'},
  { label: 'Privacy Policy',    icon: 'shield-checkmark-outline' },
];

const FAQS = [
  { question: 'How are meeting spots chosen?', answer: 'We compare everyone\'s shared location, estimate a balanced meeting area, and rank nearby spots by travel fairness and convenience.' },
  { question: 'Do all members need to share location?', answer: 'Yes for fairness-based suggestions. Without at least two shared locations, the app cannot generate midpoint and travel-balanced results.' },
  { question: 'Can I save places for later?', answer: 'Yes. Save places from recommendations and they will appear in your Collections tab as saved or visited spots.' },
  { question: 'Why do place results not show ratings?', answer: 'The free OpenStreetMap data source does not provide reliable crowd ratings, so the app focuses on category, location, saved status, and fairness instead.' },
];

const TERMS = [
  'Converge helps users coordinate meeting locations and place suggestions. It does not guarantee the availability, safety, or accuracy of any third-party place listing.',
  'You are responsible for the information you share in plans, including locations, names, and availability windows.',
  'Saved places, votes, and plan data may be used to improve your in-app recommendations.',
  'External services such as Maps, Zomato, Swiggy, or OpenStreetMap are governed by their own terms and availability.',
];

const PRIVACY = [
  'Location is only used to calculate group meeting suggestions and related travel fairness metrics.',
  'Profile information such as name, username, email, and preferred spot type is stored to personalize the app experience.',
  'Saved places and plan history are stored so they can be shown again across the Home, Plans, and Saved screens.',
  'You should only invite users you know and only share location when you are comfortable doing so.',
];

const API_BASE = API_URL || 'https://sturdy-goggles-1033249426470.asia-south1.run.app';

export default function SettingsScreen() {
  const { user, logout, updateUser } = useAuth();

  const [notifications,   setNotifications]   = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [preferredType,   setPreferredType]   = useState<PreferredSpotType>((user?.preferredSpotType as PreferredSpotType) || 'cafe');

  const [modalVisible, setModalVisible] = useState(false);
  const [editName,  setEditName]  = useState(user?.name  || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingPreference, setIsSavingPreference] = useState(false);
  const [legalModal, setLegalModal] = useState<'Help Center' | 'Terms of Service' | 'Privacy Policy' | null>(null);

  useEffect(() => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditUsername(user?.username || '');
      setPreferredType((user?.preferredSpotType as PreferredSpotType) || 'cafe');
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const handleUpdateProfile = async () => {
    const updateData: any = { id: user?.id };
    let hasChanges = false;
    if (editName  !== user?.name)  { updateData.name  = editName;  hasChanges = true; }
    if (editEmail !== user?.email) { updateData.email = editEmail; hasChanges = true; }
    if (editUsername !== (user?.username || '')) { updateData.username = editUsername; hasChanges = true; }
    if (!hasChanges) { setModalVisible(false); return; }

    setIsUpdating(true);
    try {
      const res = await fetch(`${API_BASE}/Auth/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      const ct = res.headers.get('content-type');
      if (!ct?.includes('application/json')) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (res.ok) {
        await updateUser(data.user);
        setModalVisible(false);
      } else {
        alert(data.msg || `Update failed (${res.status})`);
      }
    } catch (err) {
      alert('Network error. Please check your connection.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePreferredSpotChange = async (spotType: PreferredSpotType) => {
    setPreferredType(spotType);
    if (!user?.id) return;

    setIsSavingPreference(true);
    try {
      const res = await fetch(`${API_BASE}/Auth/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, preferredSpotType: spotType }),
      });
      const data = await res.json();
      if (res.ok) {
        await updateUser(data.user);
      } else {
        alert(data.msg || 'Failed to save preferred spot');
      }
    } catch (err) {
      alert('Could not save preferred spot right now.');
    } finally {
      setIsSavingPreference(false);
    }
  };

  // Initials for avatar
  const initials = (user?.name || 'GU')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView style={s.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.logoBadge}>
            <Ionicons name="settings" size={16} color={C.accent} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.appName}>SETTINGS</Text>
            <Text style={s.tagline}>Account & preferences</Text>
          </View>
        </View>

        {/* ── Profile card ── */}
        <View style={s.profileCard}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View style={s.profileInfo}>
            <Text style={s.profileName}>{user?.name  || 'Guest User'}</Text>
            <Text style={s.profileEmail}>{user?.email || 'guest@example.com'}</Text>
            {user?.username ? <Text style={s.profileEmail}>@{user.username}</Text> : null}
          </View>
          <TouchableOpacity
            style={s.editBtn}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="pencil" size={14} color={C.accent} />
            <Text style={s.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* ── Preferences ── */}
        <Text style={s.sectionLabel}>PREFERENCES</Text>
        <View style={s.group}>
{/*
          
          <View style={s.settingRow}>
            <View style={[s.settingIcon, { backgroundColor: C.accentSoft, borderColor: C.accent + '44' }]}>
              <Ionicons name="notifications" size={15} color={C.accent} />
            </View>
            <View style={s.settingText}>
              <Text style={s.settingLabel}>Notifications</Text>
              <Text style={s.settingHint}>Meeting updates & alerts</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: C.border, true: C.accent }}
              thumbColor={C.white}
            />
          </View>

          <View style={s.divider} />

          
          <View style={s.settingRow}>
            <View style={[s.settingIcon, { backgroundColor: C.greenSoft, borderColor: C.green + '44' }]}>
              <Ionicons name="location" size={15} color={C.green} />
            </View>
            <View style={s.settingText}>
              <Text style={s.settingLabel}>Location Sharing</Text>
              <Text style={s.settingHint}>Use live location for midpoint</Text>
            </View>
            <Switch
              value={locationSharing}
              onValueChange={setLocationSharing}
              trackColor={{ false: C.border, true: C.green }}
              thumbColor={C.white}
            />
          </View>

          <View style={s.divider} />

          {/* Preferred spot */}
          <View style={[s.settingRow, { alignItems: 'flex-start', paddingBottom: 16 }]}>
            <View style={[s.settingIcon, { backgroundColor: C.amberSoft, borderColor: C.amber + '44' }]}>
              <Ionicons name="star" size={15} color={C.amber} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.settingLabel}>Preferred Spot</Text>
              <Text style={s.settingHint}>Default search category</Text>
              <View style={s.spotRow}>
                {SPOT_TYPES.map(({ key, label, icon, color }) => {
                  const active = preferredType === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        s.spotChip,
                        active
                          ? { backgroundColor: color, borderColor: color }
                          : { backgroundColor: color + '18', borderColor: color + '44' },
                      ]}
                      onPress={() => handlePreferredSpotChange(key)}
                    >
                      <Ionicons
                        name={icon as any}
                        size={13}
                        color={active ? C.white : color}
                        style={{ marginRight: 5 }}
                      />
                      <Text style={[s.spotChipText, { color: active ? C.white : color }]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {isSavingPreference ? <Text style={[s.settingHint, { marginTop: 10 }]}>Saving preference...</Text> : null}
            </View>
          </View>
        </View>

        {/* ── Support & Legal ── */}
        <Text style={[s.sectionLabel, { marginTop: 24 }]}>SUPPORT & LEGAL</Text>
        <View style={s.group}>
          {LEGAL_LINKS.map(({ label, icon }, i) => (
            <React.Fragment key={label}>
              <TouchableOpacity style={s.linkRow} activeOpacity={0.7} onPress={() => setLegalModal(label as 'Help Center' | 'Terms of Service' | 'Privacy Policy')}>
                <View style={[s.settingIcon, { backgroundColor: C.accentSoft, borderColor: C.accent + '33' }]}>
                  <Ionicons name={icon as any} size={15} color={C.accent} />
                </View>
                <Text style={s.linkLabel}>{label}</Text>
                <Ionicons name="chevron-forward" size={15} color={C.textMuted} />
              </TouchableOpacity>
              {i < LEGAL_LINKS.length - 1 && <View style={s.divider} />}
            </React.Fragment>
          ))}
        </View>

        {/* ── Sign out ── */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={18} color={C.red} style={{ marginRight: 10 }} />
          <Text style={s.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App version */}
        <Text style={s.version}>Converge v1.0.0</Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={s.modalBackdrop}>
          <View style={s.modalSheet}>

            {/* Handle */}
            <View style={s.modalHandle} />

            {/* Title row */}
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Edit Profile</Text>
              <TouchableOpacity
                style={s.modalCloseBtn}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={16} color={C.textSub} />
              </TouchableOpacity>
            </View>

            {/* Name field */}
            <Text style={s.fieldLabel}>Full Name</Text>
            <View style={s.fieldWrap}>
              <Ionicons name="person-outline" size={16} color={C.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                value={editName}
                onChangeText={setEditName}
                style={s.fieldInput}
                placeholderTextColor={C.textMuted}
                placeholder="Your name"
                selectionColor={C.accent}
              />
            </View>

            <Text style={[s.fieldLabel, { marginTop: 14 }]}>Username</Text>
            <View style={s.fieldWrap}>
              <Ionicons name="at-outline" size={16} color={C.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                value={editUsername}
                onChangeText={setEditUsername}
                style={s.fieldInput}
                placeholderTextColor={C.textMuted}
                placeholder="unique username"
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor={C.accent}
              />
            </View>

            {/* Email field */}
            <Text style={[s.fieldLabel, { marginTop: 14 }]}>Email Address</Text>
            <View style={s.fieldWrap}>
              <Ionicons name="mail-outline" size={16} color={C.textMuted} style={{ marginRight: 10 }} />
              <TextInput
                value={editEmail}
                onChangeText={setEditEmail}
                style={s.fieldInput}
                placeholderTextColor={C.textMuted}
                placeholder="your@email.com"
                autoCapitalize="none"
                keyboardType="email-address"
                selectionColor={C.accent}
              />
            </View>

            {/* Actions */}
            <View style={s.modalActions}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveBtn, isUpdating && { opacity: 0.7 }]}
                onPress={handleUpdateProfile}
                disabled={isUpdating}
              >
                {isUpdating
                  ? <ActivityIndicator color={C.white} size="small" />
                  : <Text style={s.saveText}>Save Changes</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!legalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setLegalModal(null)}
      >
        <View style={s.modalBackdrop}>
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{legalModal}</Text>
              <TouchableOpacity
                style={s.modalCloseBtn}
                onPress={() => setLegalModal(null)}
              >
                <Ionicons name="close" size={16} color={C.textSub} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {legalModal === 'Help Center' ? FAQS.map((item) => (
                <View key={item.question} style={s.legalBlock}>
                  <Text style={s.legalTitle}>{item.question}</Text>
                  <Text style={s.legalBody}>{item.answer}</Text>
                </View>
              )) : null}

              {legalModal === 'Terms of Service' ? TERMS.map((item) => (
                <View key={item} style={s.legalBlock}>
                  <Text style={s.legalBody}>{item}</Text>
                </View>
              )) : null}

              {legalModal === 'Privacy Policy' ? PRIVACY.map((item) => (
                <View key={item} style={s.legalBlock}>
                  <Text style={s.legalBody}>{item}</Text>
                </View>
              )) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

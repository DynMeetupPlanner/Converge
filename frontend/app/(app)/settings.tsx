import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
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
import { s } from '../styles/SettingsStyle';

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

const SPOT_TYPES: { key: string; label: string; icon: string; color: string }[] = [
  { key: 'cafe',       label: 'Café',   icon: 'cafe',       color: C.amber },
  { key: 'restaurant', label: 'Dine',   icon: 'restaurant', color: C.red   },
  { key: 'park',       label: 'Park',   icon: 'leaf',       color: C.green },
];

const LEGAL_LINKS = [
  { label: 'Help Center',       icon: 'help-circle-outline'  },
  { label: 'Terms of Service',  icon: 'document-text-outline'},
  { label: 'Privacy Policy',    icon: 'shield-checkmark-outline' },
];

export default function SettingsScreen() {
  const { user, logout, updateUser } = useAuth();

  const [notifications,   setNotifications]   = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [preferredType,   setPreferredType]   = useState('cafe');

  const [modalVisible, setModalVisible] = useState(false);
  const [editName,  setEditName]  = useState(user?.name  || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const handleUpdateProfile = async () => {
    const updateData: any = { id: user?.id };
    let hasChanges = false;
    if (editName  !== user?.name)  { updateData.name  = editName;  hasChanges = true; }
    if (editEmail !== user?.email) { updateData.email = editEmail; hasChanges = true; }
    if (!hasChanges) { setModalVisible(false); return; }

    setIsUpdating(true);
    try {
      const res = await fetch('https://sturdy-goggles-1033249426470.asia-south1.run.app/Auth/update', {
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

          {/* Notifications toggle */}
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

          {/* Location toggle */}
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
                      onPress={() => setPreferredType(key)}
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
            </View>
          </View>
        </View>

        {/* ── Support & Legal ── */}
        <Text style={[s.sectionLabel, { marginTop: 24 }]}>SUPPORT & LEGAL</Text>
        <View style={s.group}>
          {LEGAL_LINKS.map(({ label, icon }, i) => (
            <React.Fragment key={label}>
              <TouchableOpacity style={s.linkRow} activeOpacity={0.7}>
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
    </SafeAreaView>
  );
}

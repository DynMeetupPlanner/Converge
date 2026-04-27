import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Switch, Platform, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { SettingsStyle } from '../styles/SettingsStyle';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '@/components/GradientBackground';
import { router } from 'expo-router';

import { useAuth } from '@/context/AuthContext';

export default function SettingsScreen() {
  const theme = useColorScheme();
  const styles = SettingsStyle(theme);
  const { user, logout, updateUser } = useAuth();
  
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [preferredType, setPreferredType] = useState('cafe');

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const handleUpdateProfile = async () => {
    const updateData: any = { id: user?.id };
    let hasChanges = false;

    if (editName !== user?.name) {
      updateData.name = editName;
      hasChanges = true;
    }
    if (editEmail !== user?.email) {
      updateData.email = editEmail;
      hasChanges = true;
    }

    if (!hasChanges) {
      setIsEditModalVisible(false);
      return;
    }

    setIsUpdating(true);
    try {
      const API_URL = 'https://sturdy-goggles-1033249426470.asia-south1.run.app';
      
      const res = await fetch(`${API_URL}/Auth/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const contentType = res.headers.get('content-type');
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Server error: ${res.status}`);
      }
      
      if (res.ok) {
        await updateUser(data.user);
        setIsEditModalVisible(false);
        alert('Profile updated successfully!');
      } else {
        alert(data.msg || `Update failed with status ${res.status}`);
      }
    } catch (err) {
      console.error('Update Profile Error:', err);
      alert('Network error. Please ensure your backend is running.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          <Text style={styles.eyebrow}>PREFERENCES & ACCOUNT</Text>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>
            Manage your account details and app experience to your liking.
          </Text>

          <View style={[styles.glassCard, { padding: 18, backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.1)' }]}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.accountRow}>
              <View style={[styles.avatar, { borderRadius: 12 }]}>
                <Ionicons name="person" size={20} color="#fff" />
              </View>
              <View style={styles.accountTextWrap}>
                <Text style={styles.accountName}>{user?.name || 'Guest User'}</Text>
                <Text style={styles.accountEmail}>{user?.email || 'guest@example.com'}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.secondaryButton, { borderRadius: 10, backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.3)' }]}
                onPress={() => setIsEditModalVisible(true)}
              >
                <Text style={styles.secondaryButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.glassCard, { backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.05)' }]}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingLabelWrap}>
                <Text style={styles.settingLabel}>Notifications</Text>
                <Text style={styles.settingHint}>Receive alerts about meeting updates</Text>
              </View>
              <Switch 
                value={notifications} 
                onValueChange={setNotifications}
                trackColor={{ false: '#767577', true: Colors[theme].primary }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLabelWrap}>
                <Text style={styles.settingLabel}>Location Sharing</Text>
                <Text style={styles.settingHint}>Allow app to use your live location</Text>
              </View>
              <Switch 
                value={locationSharing} 
                onValueChange={setLocationSharing}
                trackColor={{ false: '#767577', true: Colors[theme].primary }}
              />
            </View>

            <View style={[styles.settingRowNoBorder, { marginTop: 4 }]}>
              <View style={styles.settingLabelWrap}>
                <Text style={styles.settingLabel}>Preferred Spot</Text>
                <Text style={styles.settingHint}>Your default search category</Text>
                <View style={styles.categoryRow}>
                  {['cafe', 'restaurant', 'park'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.categoryChip,
                        preferredType === type && styles.categoryChipActive,
                        { borderRadius: 10 }
                      ]}
                      onPress={() => setPreferredType(type)}
                    >
                      <Text style={[
                        styles.categoryChipText,
                        preferredType === type && styles.categoryChipTextActive
                      ]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.glassCard, { backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.05)' }]}>
            <Text style={styles.sectionTitle}>Support & Legal</Text>
            
            <TouchableOpacity style={styles.linkRow}>
              <Text style={styles.linkText}>Help Center</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors[theme].muted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkRow}>
              <Text style={styles.linkText}>Terms of Service</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors[theme].muted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkRowNoBorder}>
              <Text style={styles.linkText}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors[theme].muted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.logoutButton, { borderRadius: 18, height: 56, marginTop: 10 }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={isEditModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: Colors[theme].background, borderRadius: 24, padding: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: Colors[theme].text, marginBottom: 20 }}>Edit Profile</Text>
            
            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors[theme].muted, marginBottom: 8 }}>Full Name</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                style={{ 
                  flex: 1,
                  backgroundColor: Colors[theme].inputBg, 
                  padding: 14, 
                  borderRadius: 12, 
                  color: Colors[theme].text,
                }}
              />
              {editName !== user?.name && (
                <TouchableOpacity 
                  onPress={() => handleUpdateProfile()}
                  style={{ backgroundColor: Colors[theme].primary, padding: 12, borderRadius: 12 }}
                >
                  <Ionicons name="checkmark" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>

            <Text style={{ fontSize: 14, fontWeight: '600', color: Colors[theme].muted, marginBottom: 8 }}>Email Address</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <TextInput
                value={editEmail}
                onChangeText={setEditEmail}
                style={{ 
                  flex: 1,
                  backgroundColor: Colors[theme].inputBg, 
                  padding: 14, 
                  borderRadius: 12, 
                  color: Colors[theme].text,
                }}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {editEmail !== user?.email && (
                <TouchableOpacity 
                  onPress={() => handleUpdateProfile()}
                  style={{ backgroundColor: Colors[theme].primary, padding: 12, borderRadius: 12 }}
                >
                  <Ionicons name="checkmark" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity 
                style={{ flex: 1, padding: 16, borderRadius: 12, backgroundColor: Colors[theme].border, alignItems: 'center' }}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={{ fontWeight: '700', color: Colors[theme].text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{ flex: 2, padding: 16, borderRadius: 12, backgroundColor: Colors[theme].primary, alignItems: 'center' }}
                onPress={handleUpdateProfile}
                disabled={isUpdating}
              >
                {isUpdating ? <ActivityIndicator color="#fff" /> : <Text style={{ fontWeight: '700', color: '#fff' }}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </GradientBackground>
  );
}

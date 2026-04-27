import { StyleSheet, Platform } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

export const SettingsStyle = (theme: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      flex: 1,
    },

    contentContainer: {
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 40,
    },

    glassCard: {
      backgroundColor: Colors[theme].card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: Colors[theme].border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },

    eyebrow: {
      color: Colors[theme].muted,
      fontSize: 14,
      fontWeight: '600',
    },

    title: {
      fontSize: 28,
      fontWeight: '700',
      marginBottom: 8,
      color: Colors[theme].text,
    },

    subtitle: {
      color: Colors[theme].muted,
      fontSize: 15,
      marginBottom: 20,
    },

    sectionCard: {
      backgroundColor: Colors[theme].card,
      borderColor: Colors[theme].border,
      borderWidth: 1,
      borderRadius: 16,
      padding: 14,
      marginBottom: 14,
    },

    sectionTitle: {
      color: Colors[theme].text,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 4,
    },

    accountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    avatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: Colors[theme].primary,
      alignItems: 'center',
      justifyContent: 'center',
    },

    accountName: {
      color: Colors[theme].text,
      fontWeight: '600',
      fontSize: 15,
    },

    accountEmail: {
      color: Colors[theme].muted,
      fontSize: 13,
      marginTop: 2,
    },

    secondaryButton: {
      backgroundColor: Colors[theme].inputBg,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderWidth: 1,
      borderColor: Colors[theme].border,
    },

    secondaryButtonText: {
      color: Colors[theme].primary,
      fontWeight: '600',
      fontSize: 13,
    },

    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor: Colors[theme].border,
      paddingBottom: 12,
      marginBottom: 12,
    },

    settingRowNoBorder: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },

    settingLabel: {
      color: Colors[theme].text,
      fontSize: 15,
      fontWeight: '600',
    },

    settingHint: {
      color: Colors[theme].muted,
      fontSize: 12,
      marginTop: 3,
    },

    categoryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 2,
    },

    categoryChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: Colors[theme].inputBg,
      borderWidth: 1,
      borderColor: Colors[theme].border,
    },

    categoryChipActive: {
      backgroundColor: Colors[theme].primary,
      borderColor: Colors[theme].primary,
    },

    categoryChipText: {
      color: Colors[theme].text,
      fontWeight: '600',
      fontSize: 13,
    },

    categoryChipTextActive: {
      color: '#fff',
    },

    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: Colors[theme].border,
      paddingBottom: 12,
      marginBottom: 12,
    },

    linkRowNoBorder: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    linkText: {
      color: Colors[theme].text,
      fontSize: 15,
      fontWeight: '600',
    },

    logoutButton: {
      marginTop: 10,
      backgroundColor: '#ef4444',
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },

    logoutText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
  });

export default SettingsStyle;

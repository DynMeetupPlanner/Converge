import { StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

export const SettingsStyle = (theme: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      backgroundColor: Colors[theme].background,
      flex: 1,
    },

    contentContainer: {
      paddingHorizontal: 20,
      paddingTop: 52,
      paddingBottom: 32,
    },

    eyebrow: {
      color: Colors[theme].muted,
      fontFamily: Fonts.rounded,
      fontSize: 12,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      fontWeight: '700',
      marginBottom: 8,
    },

    title: {
      color: Colors[theme].text,
      fontFamily: Fonts.rounded,
      fontSize: 34,
      lineHeight: 38,
      fontWeight: '800',
      letterSpacing: -0.8,
      marginBottom: 10,
    },

    subtitle: {
      color: Colors[theme].muted,
      fontFamily: Fonts.sans,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 18,
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
      fontWeight: '800',
      fontFamily: Fonts.rounded,
      letterSpacing: -0.2,
      marginBottom: 10,
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

    accountTextWrap: {
      flex: 1,
    },

    accountName: {
      color: Colors[theme].text,
      fontWeight: '700',
      fontFamily: Fonts.sans,
      fontSize: 15,
    },

    accountEmail: {
      color: Colors[theme].muted,
      fontFamily: Fonts.sans,
      fontSize: 13,
      marginTop: 2,
    },

    secondaryButton: {
      backgroundColor: theme === 'dark' ? '#1a2534' : '#eaf0fb',
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderWidth: 1,
      borderColor: Colors[theme].border,
    },

    secondaryButtonText: {
      color: Colors[theme].primary,
      fontFamily: Fonts.sans,
      fontWeight: '700',
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

    settingLabelWrap: {
      flex: 1,
      paddingRight: 8,
    },

    settingLabel: {
      color: Colors[theme].text,
      fontSize: 15,
      fontWeight: '700',
      fontFamily: Fonts.sans,
    },

    settingHint: {
      color: Colors[theme].muted,
      fontSize: 12,
      marginTop: 3,
      fontFamily: Fonts.sans,
      lineHeight: 18,
    },

    categoryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 2,
    },

    categoryChip: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 999,
      backgroundColor: theme === 'dark' ? '#182534' : '#eaf0fb',
      borderWidth: 1,
      borderColor: Colors[theme].border,
    },

    categoryChipActive: {
      backgroundColor: Colors[theme].primary,
      borderColor: Colors[theme].primary,
    },

    categoryChipText: {
      color: Colors[theme].text,
      fontWeight: '700',
      fontFamily: Fonts.sans,
      fontSize: 13,
      textTransform: 'capitalize',
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
      fontFamily: Fonts.sans,
    },

    logoutButton: {
      marginTop: 4,
      backgroundColor: '#dc2626',
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 14,
      elevation: 3,
    },

    logoutText: {
      color: '#fff',
      fontFamily: Fonts.rounded,
      fontSize: 16,
      fontWeight: '800',
    },
  });

export default SettingsStyle;

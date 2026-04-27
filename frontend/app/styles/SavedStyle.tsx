import { StyleSheet, Platform } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

export const SavedStyle = (theme: 'light' | 'dark') =>
  StyleSheet.create({
    screen: {
      flex: 1,
    },

    container: {
      flex: 1,
    },

    contentContainer: {
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 100,
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

    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      paddingTop: Platform.OS === 'ios' ? 40 : 20,
    },

    eyebrow: {
      color: Colors[theme].muted,
      fontSize: 14,
      fontWeight: '600',
    },

    countPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: Colors[theme].primary,
      backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.9)' : 'rgba(31, 58, 95, 0.3)',
    },

    countPillText: {
      color: Colors[theme].primary,
      fontSize: 12,
      fontWeight: '800',
      fontFamily: Fonts.sans,
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

    statsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
    },

    statCard: {
      flex: 1,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: Colors[theme].border,
      backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.05)',
      paddingVertical: 14,
      paddingHorizontal: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },

    statNumber: {
      color: Colors[theme].text,
      fontSize: 26,
      fontWeight: '900',
      fontFamily: Fonts.rounded,
    },

    statLabel: {
      color: Colors[theme].muted,
      fontSize: 13,
      fontFamily: Fonts.sans,
      marginTop: 4,
      fontWeight: '700',
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
      marginTop: 8,
    },

    sectionTitle: {
      color: Colors[theme].text,
      fontSize: 18,
      fontWeight: '700',
    },

    resultsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },

    resultsTitle: {
      color: Colors[theme].text,
      fontSize: 26,
      fontWeight: '900',
      fontFamily: Fonts.rounded,
      letterSpacing: -0.5,
    },

    resultsCount: {
      color: Colors[theme].muted,
      fontSize: 13,
      fontFamily: Fonts.sans,
      fontWeight: '700',
      backgroundColor: theme === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },

    listContent: {
      paddingBottom: 20,
    },

    collectionCard: {
      width: 140,
      marginRight: 12,
      borderRadius: 14,
      overflow: 'hidden',
      backgroundColor: Colors[theme].card,
      borderWidth: 1,
      borderColor: Colors[theme].border,
    },

    collectionImage: {
      width: '140%',
      height: 100,
      backgroundColor: Colors[theme].inputBg,
    },

    collectionInfo: {
      padding: 10,
    },

    collectionName: {
      color: Colors[theme].text,
      fontSize: 14,
      fontWeight: '600',
    },

    collectionCount: {
      color: Colors[theme].muted,
      fontSize: 12,
      marginTop: 2,
    },

    placeCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: Colors[theme].border,
      backgroundColor: Colors[theme].card,
      marginBottom: 12,
      padding: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },

    placeName: {
      color: Colors[theme].text,
      fontWeight: '600',
      fontSize: 15,
    },

    placeCategory: {
      color: Colors[theme].muted,
      fontSize: 13,
      marginTop: 2,
    },

    placeMeta: {
      color: Colors[theme].muted,
      marginTop: 4,
      fontSize: 14,
      fontFamily: Fonts.sans,
      fontWeight: '600',
    },

    placeSub: {
      color: Colors[theme].muted,
      marginTop: 4,
      fontSize: 12,
      fontFamily: Fonts.sans,
      fontWeight: '500',
    },

    statusPill: {
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1.5,
    },

    statusPillText: {
      color: Colors[theme].text,
      fontFamily: Fonts.sans,
      fontWeight: '800',
      fontSize: 12,
      textTransform: 'capitalize',
    },

    bottomTray: {
      position: 'absolute',
      left: 20,
      right: 20,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: theme === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.15)',
      backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.85)' : 'rgba(18, 26, 36, 0.85)',
      padding: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 15 },
      shadowOpacity: 0.2,
      shadowRadius: 30,
      elevation: 10,
    },

    filterBar: {
      flexDirection: 'row',
      backgroundColor: theme === 'dark' ? 'rgba(20, 33, 49, 0.8)' : 'rgba(233, 239, 249, 0.8)',
      borderRadius: 16,
      padding: 6,
      gap: 6,
    },

    filterChip: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      paddingVertical: 10,
    },

    filterChipActive: {
      backgroundColor: Colors[theme].primary,
      shadowColor: Colors[theme].primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },

    filterChipText: {
      color: Colors[theme].muted,
      fontFamily: Fonts.sans,
      fontWeight: '800',
      fontSize: 13,
      textTransform: 'capitalize',
    },

    filterChipTextActive: {
      color: '#fff',
    },

    bottomButton: {
      backgroundColor: Colors[theme].primary,
      borderRadius: 18,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 10,
      shadowColor: Colors[theme].primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    },

    bottomButtonText: {
      color: '#fff',
      fontFamily: Fonts.rounded,
      fontSize: 17,
      fontWeight: '900',
    },
  });

export default SavedStyle;

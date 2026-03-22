import { StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

export const SavedStyle = (theme: 'light' | 'dark') =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: Colors[theme].background,
    },

    container: {
      flex: 1,
      backgroundColor: Colors[theme].background,
    },

    contentContainer: {
      paddingHorizontal: 20,
      paddingTop: 46,    


    },

    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',    
    },

    eyebrow: {
      color: Colors[theme].muted,
      fontFamily: Fonts.rounded,
      fontSize: 12,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      fontWeight: '700',
    },

    countPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: Colors[theme].border,
      backgroundColor: Colors[theme].card,
    },

    countPillText: {
      color: Colors[theme].text,
      fontSize: 12,
      fontWeight: '700',
      fontFamily: Fonts.sans,
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
      marginBottom: 16,
    },

    statsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 16,
    },

    statCard: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: Colors[theme].border,
      backgroundColor: Colors[theme].card,
      paddingVertical: 12,
      paddingHorizontal: 10,
    },

    statNumber: {
      color: Colors[theme].text,
      fontSize: 22,
      fontWeight: '800',
      fontFamily: Fonts.rounded,
    },

    statLabel: {
      color: Colors[theme].muted,
      fontSize: 12,
      fontFamily: Fonts.sans,
      marginTop: 2,
    },

    resultsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },

    resultsTitle: {
      color: Colors[theme].text,
      fontSize: 22,
      fontWeight: '800',
      fontFamily: Fonts.rounded,
      letterSpacing: -0.4,
    },

    resultsCount: {
      color: Colors[theme].muted,
      fontSize: 12,
      fontFamily: Fonts.sans,
      fontWeight: '600',
    },

    placeCard: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: Colors[theme].border,
      backgroundColor: Colors[theme].card,
      marginBottom: 10,
      padding: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },

    cardLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },

    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },

    savedIcon: {
      backgroundColor: '#2563eb',
    },

    visitedIcon: {
      backgroundColor: '#059669',
    },

    placeName: {
      color: Colors[theme].text,
      fontSize: 15,
      fontWeight: '700',
      fontFamily: Fonts.sans,
    },

    placeMeta: {
      color: Colors[theme].muted,
      marginTop: 2,
      fontSize: 12,
      fontFamily: Fonts.sans,
    },

    placeSub: {
      color: Colors[theme].muted,
      marginTop: 3,
      fontSize: 11,
      fontFamily: Fonts.sans,
    },

    cardRight: {
      alignItems: 'flex-end',
      gap: 6,
    },

    statusPill: {
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderWidth: 1,
    },

    savedPill: {
      backgroundColor: theme === 'dark' ? '#1c2e49' : '#e9f0ff',
      borderColor: theme === 'dark' ? '#325d99' : '#c8dafd',
    },

    visitedPill: {
      backgroundColor: theme === 'dark' ? '#17372f' : '#e6f7f1',
      borderColor: theme === 'dark' ? '#2b7f66' : '#bce7d8',
    },

    statusPillText: {
      color: Colors[theme].text,
      fontFamily: Fonts.sans,
      fontWeight: '700',
      fontSize: 11,
      textTransform: 'capitalize',
    },

    distanceText: {
      color: Colors[theme].muted,
      fontSize: 11,
      fontFamily: Fonts.sans,
    },

    bottomTray: {
      position: 'absolute',
      left: 16,
      right: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: Colors[theme].border,
      backgroundColor: Colors[theme].card,
      padding: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.22,
      shadowRadius: 14,
      elevation: 7,
    },

    filterBar: {
      flexDirection: 'row',
      backgroundColor: theme === 'dark' ? '#142131' : '#e9eff9',
      borderRadius: 12,
      padding: 4,
      gap: 4,
    },

    filterChip: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 9,
      paddingVertical: 8,
    },

    filterChipActive: {
      backgroundColor: Colors[theme].primary,
    },

    filterChipText: {
      color: Colors[theme].muted,
      fontFamily: Fonts.sans,
      fontWeight: '700',
      fontSize: 12,
      textTransform: 'capitalize',
    },

    filterChipTextActive: {
      color: '#fff',
    },

    bottomButton: {
      backgroundColor: Colors[theme].primary,
      borderRadius: 12,
      paddingVertical: 13,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 7,
    },

    bottomButtonText: {
      color: '#fff',
      fontFamily: Fonts.rounded,
      fontSize: 15,
      fontWeight: '800',
    },
  });

export default SavedStyle;

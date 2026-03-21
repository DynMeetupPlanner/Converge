import { StyleSheet } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

export const HomeStyle = (theme: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      backgroundColor: Colors[theme].background,
      flex: 1,
    },

    contentContainer: {
      paddingHorizontal: 20,
      paddingTop: 17,
      paddingBottom: 28,
    },

    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },

    eyebrow: {
      color: Colors[theme].muted,
      fontFamily: Fonts.rounded,
      fontSize: 12,
      letterSpacing: 1.4,
      paddingTop:35,
      textTransform: 'uppercase',
      fontWeight: '700',
    },

    sparkleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: Colors[theme].card,
      borderWidth: 1,
      borderColor: Colors[theme].border,
    },

    sparkleText: {
      color: Colors[theme].text,
      fontSize: 12,
      fontWeight: '700',
      fontFamily: Fonts.sans,
    },

    title: {
      fontSize: 36,
      lineHeight: 40,
      fontFamily: Fonts.rounded,
      fontWeight: '800',
      marginBottom: 10,
      color: Colors[theme].text,
      letterSpacing: -0.8,
    },

    subtitle: {
      color: Colors[theme].muted,
      fontSize: 15,
      lineHeight: 22,
      marginBottom: 18,
      fontFamily: Fonts.sans,
    },

    mapCard: {
      borderRadius: 18,
      overflow: 'hidden',
      marginBottom: 18,
      borderWidth: 1,
      borderColor: Colors[theme].border,
      backgroundColor: Colors[theme].card,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 4,
    },

    map: {
      height: 250,
    },

    mapOverlay: {
      position: 'absolute',
      left: 12,
      bottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme === 'dark' ? 'rgba(7, 12, 18, 0.82)' : 'rgba(255, 255, 255, 0.9)',
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: Colors[theme].border,
    },

    mapOverlayText: {
      color: Colors[theme].text,
      fontWeight: '700',
      fontSize: 12,
      fontFamily: Fonts.sans,
    },

    sectionCard: {
      backgroundColor: Colors[theme].card,
      borderColor: Colors[theme].border,
      borderWidth: 1,
      borderRadius: 16,
      padding: 14,
      marginBottom: 14,
    },

    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },

    sectionTitle: {
      color: Colors[theme].text,
      fontSize: 18,
      fontWeight: '800',
      fontFamily: Fonts.rounded,
      letterSpacing: -0.2,
    },

    sectionHint: {
      color: Colors[theme].muted,
      fontSize: 12,
      fontFamily: Fonts.sans,
    },

    personCard: {
      backgroundColor: Colors[theme].inputBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: Colors[theme].border,
      padding: 10,
      marginBottom: 10,
    },

    personCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },

    personCardTitle: {
      color: Colors[theme].text,
      fontWeight: '700',
      fontSize: 14,
      fontFamily: Fonts.sans,
    },

    removeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    removeButtonText: {
      color: '#ef4444',
      fontSize: 12,
      fontWeight: '700',
      fontFamily: Fonts.sans,
    },

    input: {
      borderWidth: 1,
      borderColor: Colors[theme].border,
      backgroundColor: Colors[theme].inputBg,
      color: Colors[theme].inputText,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 12,
      marginBottom: 8,
      fontFamily: Fonts.sans,
      fontSize: 15,
    },

    addPersonButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      backgroundColor: theme === 'dark' ? '#152130' : '#eaf0fb',
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 999,
    },

    addPersonText: {
      color: Colors[theme].primary,
      fontWeight: '700',
      fontSize: 13,
      fontFamily: Fonts.sans,
    },

    categoryContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 10,
    },

    categoryButton: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: theme === 'dark' ? '#182534' : '#eaf0fb',
      borderWidth: 1,
      borderColor: Colors[theme].border,
    },

    categoryActive: {
      backgroundColor: Colors[theme].primary,
      borderColor: Colors[theme].primary,
    },

    categoryText: {
      color: Colors[theme].text,
      fontWeight: '700',
      fontFamily: Fonts.sans,
      fontSize: 13,
    },

    categoryTextActive: {
      color: '#fff',
    },

    button: {
      backgroundColor: Colors[theme].primary,
      paddingVertical: 16,
      borderRadius: 16,
      marginBottom: 20,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 14,
      elevation: 3,
    },

    buttonText: {
      color: '#fff',
      textAlign: 'center',
      fontWeight: '800',
      fontSize: 16,
      fontFamily: Fonts.rounded,
    },

    resultsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },

    resultsTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: Colors[theme].text,
      fontFamily: Fonts.rounded,
      letterSpacing: -0.3,
    },

    resultsCount: {
      color: Colors[theme].muted,
      fontWeight: '600',
      fontFamily: Fonts.sans,
      fontSize: 13,
    },

    emptyCard: {
      paddingVertical: 18,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: Colors[theme].border,
      backgroundColor: Colors[theme].card,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    emptyText: {
      color: Colors[theme].muted,
      fontFamily: Fonts.sans,
      fontSize: 14,
      flex: 1,
      lineHeight: 20,
    },

    card: {
      padding: 14,
      borderWidth: 1,
      borderColor: Colors[theme].border,
      borderRadius: 14,
      marginBottom: 10,
      backgroundColor: Colors[theme].card,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    cardTitle: {
      color: Colors[theme].text,
      fontWeight: '700',
      fontSize: 16,
      fontFamily: Fonts.sans,
    },

    cardSub: {
      color: Colors[theme].muted,
      marginTop: 2,
      fontSize: 13,
      fontFamily: Fonts.sans,
    },

    ratingPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme === 'dark' ? '#172331' : '#ecf3ff',
      borderWidth: 1,
      borderColor: Colors[theme].border,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 5,
    },

    ratingText: {
      color: Colors[theme].text,
      fontWeight: '700',
      fontFamily: Fonts.sans,
      fontSize: 12,
    },
  });

export default HomeStyle;

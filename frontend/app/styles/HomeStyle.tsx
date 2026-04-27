import { StyleSheet, Platform } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

export const HomeStyle = (theme: 'light' | 'dark') =>
  StyleSheet.create({
    container: {
      flex: 1,
    },

    contentContainer: {
      paddingHorizontal: 24,
      paddingTop: 17,
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

    sparkleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: Colors[theme].inputBg,
    },

    sparkleText: {
      color: Colors[theme].primary,
      fontSize: 12,
      fontWeight: '700',
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

    mapCard: {
      borderRadius: 16,
      overflow: 'hidden',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: Colors[theme].border,
    },

    map: {
      height: 240,
    },

    mapOverlay: {
      position: 'absolute',
      left: 12,
      bottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: Colors[theme].card,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: Colors[theme].border,
    },

    mapOverlayText: {
      color: Colors[theme].text,
      fontWeight: '600',
      fontSize: 12,
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

    sectionHint: {
      color: Colors[theme].muted,
      fontSize: 13,
    },

    personCard: {
      backgroundColor: Colors[theme].inputBg,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },

    personCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },

    personCardTitle: {
      color: Colors[theme].text,
      fontWeight: '600',
      fontSize: 14,
    },

    removeButton: {
      padding: 4,
    },

    removeButtonText: {
      color: '#ef4444',
      fontSize: 12,
      fontWeight: '600',
    },

    input: {
      borderWidth: 1,
      borderColor: Colors[theme].border,
      backgroundColor: Colors[theme].inputBg,
      color: Colors[theme].inputText,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      marginBottom: 6,
    },

    addPersonButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'center',
      marginTop: 4,
    },

    addPersonText: {
      color: Colors[theme].primary,
      fontWeight: '600',
      fontSize: 13,
    },

    categoryContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 10,
    },

    categoryButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: Colors[theme].inputBg,
      borderWidth: 1,
      borderColor: Colors[theme].border,
    },

    categoryActive: {
      backgroundColor: Colors[theme].primary,
      borderColor: Colors[theme].primary,
    },

    categoryText: {
      color: Colors[theme].text,
      fontWeight: '600',
      fontSize: 13,
    },

    categoryTextActive: {
      color: '#fff',
    },

    button: {
      backgroundColor: Colors[theme].primary,
      paddingVertical: 18,
      borderRadius: 20,
      marginBottom: 24,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
      shadowColor: Colors[theme].primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 6,
    },

    buttonText: {
      color: '#fff',
      textAlign: 'center',
      fontWeight: '800',
      fontSize: 18,
      fontFamily: Fonts.rounded,
      letterSpacing: 0.5,
    },

    resultsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },

    resultsTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: Colors[theme].text,
    },

    resultsCount: {
      color: Colors[theme].muted,
      fontSize: 13,
    },

    emptyCard: {
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: Colors[theme].border,
      backgroundColor: Colors[theme].inputBg,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    emptyText: {
      color: Colors[theme].muted,
      fontSize: 14,
      flex: 1,
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
      fontWeight: '600',
      fontSize: 15,
    },

    cardSub: {
      color: Colors[theme].muted,
      marginTop: 2,
      fontSize: 13,
    },

    ratingPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: Colors[theme].inputBg,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },

    ratingText: {
      color: Colors[theme].text,
      fontWeight: '700',
      fontSize: 12,
    },
  });

export default HomeStyle;

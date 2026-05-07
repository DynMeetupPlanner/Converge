import { StyleSheet, Platform } from 'react-native';

export const C = {
  bg: '#08090E',
  surface: '#0F1118',
  card: '#141720',
  border: '#1E2235',
  accent: '#6C7FFF',
  accentSoft: 'rgba(108,127,255,0.12)',
  green: '#2ECC8A',
  greenSoft: 'rgba(46,204,138,0.12)',
  red: '#FF5C72',
  redSoft: 'rgba(255,92,114,0.12)',
  amber: '#FFC14D',
  amberSoft: 'rgba(255,193,77,0.12)',
  text: '#EDF0FF',
  textSub: '#8B91B0',
  textMuted: '#3E4460',
  white: '#FFFFFF',
};


export const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.accentSoft,
    borderWidth: 1,
    borderColor: C.accent + '55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
    color: C.text,
  },
  tagline: {
    fontSize: 11,
    color: C.textMuted,
    letterSpacing: 0.3,
    marginTop: 1,
  },
  countChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.accentSoft,
    borderWidth: 1,
    borderColor: C.accent + '44',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  countChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: C.accent,
  },
  countChipLabel: {
    fontSize: 11,
    color: C.accent,
    fontWeight: '500',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 6,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
    color: C.text,
    letterSpacing: 0.3,
  },
  statLabel: {
    fontSize: 10,
    color: C.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // List header
  listHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  listCount: {
    fontSize: 12,
    color: C.textMuted,
    fontWeight: '600',
  },

  // Place card
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  catIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
    marginBottom: 5,
  },
  placeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 5,
  },
  placeCategory: {
    fontSize: 11,
    color: C.textSub,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  placeDist: {
    fontSize: 11,
    color: C.textMuted,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: C.amberSoft,
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: C.amber + '33',
  },
  ratingVal: {
    fontSize: 11,
    fontWeight: '700',
    color: C.amber,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Empty
  emptyCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textSub,
    marginBottom: 6,
  },
  emptyMsg: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 19,
  },

  // Filter tray
  tray: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 72 : 58,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(8,9,14,0.92)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  filterBar: {
    flexDirection: 'row',
    gap: 6,
  },
  filterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterBtnActive: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textSub,
  },
  filterLabelActive: {
    color: C.white,
  },
});

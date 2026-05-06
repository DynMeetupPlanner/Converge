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
    paddingBottom: 40,
  },
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
  // Legacy aliases for screens
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: C.text,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: C.textMuted,
    marginTop: 2,
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

  // Plan Card / Group
  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  planCard: {
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.accent + '44',
    backgroundColor: C.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    color: C.accent,
    fontWeight: '700',
    fontSize: 16,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
    marginBottom: 5,
  },
  planMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  metaText: {
    fontSize: 11,
    color: C.textSub,
    fontWeight: '600',
  },

  // Badge / Status
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    backgroundColor: C.accentSoft,
    borderColor: C.accent + '44',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: C.accent,
  },

  // Empty states
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
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: C.textMuted,
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },

  // Inputs
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMuted,
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: C.text,
    fontWeight: '500',
  },

  // Buttons
  button: {
    backgroundColor: C.accent,
    borderRadius: 16,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  secondaryButtonText: {
    color: C.textSub,
    fontSize: 14,
    fontWeight: '600',
  },

  // Users / Members list
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: C.text,
    fontSize: 14,
    fontWeight: '700',
  },
  userTag: {
    color: C.textMuted,
    fontSize: 12,
  },

  // Sections
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 20,
  },

  // Map
  mapPreview: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    marginVertical: 12,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  // Misc
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  chipText: {
    fontSize: 12,
    color: C.textSub,
    fontWeight: '600',
  },
  chipTextActive: {
    color: C.white,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  ratingVal: {
    color: C.textSub,
    fontSize: 11,
    fontWeight: '800',
  },
});

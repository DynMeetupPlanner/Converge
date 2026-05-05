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

  // Profile card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 28,
    gap: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: C.accentSoft,
    borderWidth: 1.5,
    borderColor: C.accent + '66',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: C.accent,
    letterSpacing: 1,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginBottom: 3,
  },
  profileEmail: {
    fontSize: 12,
    color: C.textMuted,
    fontWeight: '500',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.accentSoft,
    borderWidth: 1,
    borderColor: C.accent + '44',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.accent,
  },

  // Section label
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  // Group
  group: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginLeft: 60,
  },

  // Setting row
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
    marginBottom: 2,
  },
  settingHint: {
    fontSize: 11,
    color: C.textMuted,
  },

  // Spot chips
  spotRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  spotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  spotChipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Link row
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  linkLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.redSoft,
    borderWidth: 1,
    borderColor: C.red + '44',
    borderRadius: 18,
    height: 56,
    marginTop: 24,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.red,
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    color: C.textMuted,
    marginTop: 16,
    letterSpacing: 0.5,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: C.border,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.3,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  fieldInput: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textSub,
  },
  saveBtn: {
    flex: 2,
    height: 50,
    borderRadius: 14,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  saveText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.white,
  },
});
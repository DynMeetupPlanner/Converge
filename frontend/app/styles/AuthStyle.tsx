import { StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

export const C = {
  bg: '#08090E',
  card: '#141720',
  border: '#1E2235',
  accent: '#6C7FFF',
  accentSoft: 'rgba(108,127,255,0.12)',
  red: '#FF5C72',
  text: '#EDF0FF',
  textMuted: '#3E4460',
  textSub: '#8B91B0',
  white: '#FFFFFF',
  muted: '#8B91B0',
};

export const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: C.accentSoft,
    borderWidth: 1,
    borderColor: C.accent + '55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: C.text,
    marginTop: 14,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 12,
    color: C.textMuted,
    marginTop: 4,
  },

  // Card
  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    marginBottom: 16,
  },

  // Inputs
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1118',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 12,
  },
  inputText: {
    flex: 1,
    color: C.text,
    marginLeft: 10,
  },

  // Error
  errorBox: {
    backgroundColor: 'rgba(255,92,114,0.12)',
    borderWidth: 1,
    borderColor: C.red,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  errorText: {
    color: C.red,
    fontSize: 13,
  },

  // Forgot
  forgot: {
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  forgotText: {
    color: C.accent,
    fontSize: 12,
  },

  // Button
  button: {
    backgroundColor: C.accent,
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: C.white,
    fontWeight: '700',
  },

  // Footer
  footer: {
    color: C.textSub,
    textAlign: 'center',
    marginTop: 16,
  },
  link: {
    color: C.accent,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: C.card,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  cancel: {
    color: C.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
  section: {
      fontSize: 11,
      color: C.muted,
      marginTop: 8,
      letterSpacing: 1,
    },

    row: {
      flexDirection: 'row',
      gap: 8,
    },

    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.border,
    },

    chipActive: {
      backgroundColor: C.accent,
      borderColor: C.accent,
    },

    chipText: {
      color: C.muted,
      fontSize: 12,
      fontWeight: '600',
    },

    chipTextActive: {
      color: '#fff',
    },
    dobRow: {
      flexDirection: 'row',
      gap: 10,
      height: 150,
    },

    dobCol: {
      flex: 1,
    },

    dobItem: {
      padding: 8,
      alignItems: 'center',
    },

    dobItemActive: {
      backgroundColor: C.accent,
      borderRadius: 8,
    },

    dobText: {
      color: C.muted,
    },

    dobTextActive: {
      color: '#fff',
      fontWeight: '700',
    },
  
});


export const AuthStyle = (theme: 'light' | 'dark') => {
  const C = {
    bg: '#08090E',
    card: '#141720',
    border: '#1E2235',
    text: '#EDF0FF',
    muted: '#8B91B0',
    placeholder: '#3E4460',
    accent: '#6C7FFF',
  };

  return StyleSheet.create({
    container: {
      flexGrow: 1,
      padding: 24,
      justifyContent: 'center',
    },

    header: {
      alignItems: 'center',
      marginBottom: 30,
    },

    logo: {
      width: 80,
      height: 80,
      borderRadius: 24,
      backgroundColor: C.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },

    title: {
      fontSize: 28,
      fontWeight: '800',
      color: C.text,
    },

    subtitle: {
      fontSize: 14,
      color: C.muted,
      marginTop: 4,
    },

    card: {
      backgroundColor: C.card,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: C.border,
      gap: 14,
    },

    input: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.bg,
      borderRadius: 14,
      paddingHorizontal: 12,
      height: 50,
      borderWidth: 1,
      borderColor: C.border,
      gap: 10,
    },

    inputText: {
      flex: 1,
      color: C.text,
      fontSize: 14,
    },

    section: {
      fontSize: 11,
      color: C.muted,
      marginTop: 8,
      letterSpacing: 1,
    },

    row: {
      flexDirection: 'row',
      gap: 8,
    },

    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.border,
    },

    chipActive: {
      backgroundColor: C.accent,
      borderColor: C.accent,
    },

    chipText: {
      color: C.muted,
      fontSize: 12,
      fontWeight: '600',
    },

    chipTextActive: {
      color: '#fff',
    },

    button: {
      backgroundColor: C.accent,
      height: 50,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
    },

    buttonText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 14,
    },

    footer: {
      textAlign: 'center',
      marginTop: 16,
      color: C.muted,
    },

    link: {
      color: C.accent,
      fontWeight: '700',
    },

    error: {
      color: '#FF5C72',
      textAlign: 'center',
      marginTop: 10,
    },

    muted: { color: C.muted },
    placeholder: { color: C.placeholder },

    modalBg: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },

    modal: {
      backgroundColor: C.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
    },

    modalHandle: {
      width: 40,
      height: 4,
      backgroundColor: C.border,
      alignSelf: 'center',
      marginBottom: 12,
      borderRadius: 2,
    },

    modalTitle: {
      color: C.text,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 10,
    },

    dobRow: {
      flexDirection: 'row',
      gap: 10,
      height: 150,
    },

    dobCol: {
      flex: 1,
    },

    dobItem: {
      padding: 8,
      alignItems: 'center',
    },

    dobItemActive: {
      backgroundColor: C.accent,
      borderRadius: 8,
    },

    dobText: {
      color: C.muted,
    },

    dobTextActive: {
      color: '#fff',
      fontWeight: '700',
    },

  });
};
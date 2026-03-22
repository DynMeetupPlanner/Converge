import { Colors } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const AuthStyle = (theme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: Colors[theme].background,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    color: Colors[theme].text,
    textAlign: 'center',
  },
  mintitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    color: Colors[theme].text,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 25,
    fontWeight: '700',
    color: Colors[theme].muted,
    textAlign: 'center',
    fontSize: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors[theme].border,
    padding: 14,
    borderRadius: 14,
    marginBottom: 15,
    color: Colors[theme].inputText,

    backgroundColor: Colors[theme].inputBg,
  },
  buttonText: {
    color: Colors[theme].buttonText,
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    marginTop: 20,
    textAlign: 'center',
    color: Colors[theme].muted,
    fontSize: 16,
  },
  link: {
    color: Colors[theme].primary,
    fontWeight: '900',
    fontSize: 16,

  },
  button: {
    backgroundColor: Colors[theme].primary,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
});


export default AuthStyle;
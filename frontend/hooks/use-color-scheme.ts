import { useColorScheme as _useColorScheme } from 'react-native';

/**
 * Custom hook to get color scheme (light / dark)
 * Falls back to 'light' if undefined
 */
export function useColorScheme(): 'light' | 'dark' {
  const theme = _useColorScheme();

  return theme === 'dark' ? 'dark' : 'light';
}

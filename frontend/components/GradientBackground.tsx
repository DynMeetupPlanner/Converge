import React from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface GradientBackgroundProps {
  children: React.ReactNode;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({ children }) => {
  const theme = useColorScheme();

  // Vibrant Electric Blue Shades
  const gradientColors = theme === 'light'
    ? ['#00B4FF', '#00D2FF', '#00F2FF', '#70E1FF'] as const
    : ['#000B18', '#001A33', '#002952', '#003D7A'] as const;

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

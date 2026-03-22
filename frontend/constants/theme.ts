/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';


export const Colors = {
  light: {
    // Base
    text: '#1f2933',
    inputText: '#1f2933',
    background: '#f4f1ea',

    // Surfaces
    card: '#ffffff',
    inputBg: '#f1f3f5',
    border: '#e5e7eb',

    // Branding
    primary: '#1f3a5f',
    accent: '#f28c38',

    // Secondary
    icon: '#6b7280',
    muted: '#6b7280',

    // 🔥 NEW (important)
    placeholder: '#9aa4af',

    // Tabs
    tabIconDefault: '#6b7280',
    tabIconSelected: '#1f3a5f',

    buttonText: '#ffffff',
    
  },

  dark: {
    // Base
    text: '#e6edf3',
    inputText: '#e6edf3', // for dark
    background: '#0f1720',

    // Surfaces
    card: '#121a24',
    inputBg: '#1a2430',
    border: '#263241',

    // Branding
    primary: '#2f4b7c',
    accent: '#ff9f5a',

    // Secondary
    icon: '#9aa4af',
    muted: '#9ba6b1',

    // 🔥 NEW (important)
    placeholder: '#7f8c9a',

    // Tabs
    tabIconDefault: '#9aa4af',
    tabIconSelected: '#e6edf3',

    buttonText: '#ffffff',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

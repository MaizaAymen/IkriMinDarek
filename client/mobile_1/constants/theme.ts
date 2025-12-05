import { Platform } from 'react-native';

export const Shades = {
  shade000: '#000000',
  shade111: '#111111',
  shade222: '#222222',
  shade333: '#333333',
  shade444: '#444444',
  shade555: '#555555',
  shade666: '#666666',
  shade777: '#777777',
  shade888: '#888888',
  shade999: '#999999',
  shadeAAA: '#AAAAAA',
  shadeBBB: '#BBBBBB',
  shadeCCC: '#CCCCCC',
  shadeDDD: '#DDDDDD',
  shadeEEE: '#EEEEEE',
  shadeFFF: '#FFFFFF',
};

export const Colors = {
  light: {
    text: Shades.shade111,
    textSecondary: Shades.shade555,
    textMuted: Shades.shade888,
    background: Shades.shadeEEE,
    surface: Shades.shadeFFF,
    surfaceVariant: Shades.shadeDDD,
    tint: Shades.shade111,
    primary: Shades.shade111,
    secondary: Shades.shade222,
    accent: Shades.shade000,
    error: Shades.shade333,
    success: Shades.shade444,
    warning: Shades.shade555,
    icon: Shades.shade666,
    tabIconDefault: Shades.shade888,
    tabIconSelected: Shades.shade111,
    border: Shades.shadeCCC,
    placeholder: Shades.shade888,
    overlay: 'rgba(0,0,0,0.65)',
    cardShadow: 'rgba(0,0,0,0.12)',
    deepShadow: 'rgba(0,0,0,0.25)',
  },
  dark: {
    text: Shades.shadeEEE,
    textSecondary: Shades.shadeCCC,
    textMuted: Shades.shadeAAA,
    background: Shades.shade111,
    surface: Shades.shade222,
    surfaceVariant: Shades.shade333,
    tint: Shades.shadeEEE,
    primary: Shades.shadeEEE,
    secondary: Shades.shadeCCC,
    accent: Shades.shadeFFF,
    error: Shades.shadeBBB,
    success: Shades.shadeDDD,
    warning: Shades.shadeCCC,
    icon: Shades.shade999,
    tabIconDefault: Shades.shade777,
    tabIconSelected: Shades.shadeEEE,
    border: Shades.shade444,
    placeholder: Shades.shade777,
    overlay: 'rgba(255,255,255,0.08)',
    cardShadow: 'rgba(0,0,0,0.35)',
    deepShadow: 'rgba(0,0,0,0.55)',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const Shadows = {
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  heavy: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
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

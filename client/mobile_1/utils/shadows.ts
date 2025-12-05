import { Platform } from 'react-native';

/**
 * Convert shadow props to boxShadow for web compatibility
 * On iOS/Android, uses native shadow props
 * On Web, converts to CSS boxShadow
 */
export const getShadowStyle = (
  shadowColor: string = '#000',
  offsetWidth: number = 0,
  offsetHeight: number = 2,
  shadowOpacity: number = 0.1,
  shadowRadius: number = 4
) => {
  if (Platform.OS === 'web') {
    // Convert to web boxShadow format: offsetX offsetY blurRadius spreadRadius color
    const blurRadius = shadowRadius;
    const offsetX = offsetWidth;
    const offsetY = offsetHeight;
    const alpha = (shadowOpacity * 255).toString(16).padStart(2, '0');
    const color = `${shadowColor}${alpha}`;
    
    return {
      boxShadow: `${offsetX}px ${offsetY}px ${blurRadius}px 0px ${color}`,
    };
  }

  // Native shadow props for iOS/Android
  return {
    shadowColor,
    shadowOffset: { width: offsetWidth, height: offsetHeight },
    shadowOpacity,
    shadowRadius,
    elevation: Math.max(1, shadowRadius / 2), // Android elevation
  };
};

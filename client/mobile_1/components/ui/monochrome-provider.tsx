import React, { PropsWithChildren, useMemo } from 'react';
import { Provider } from '@ant-design/react-native';

import { createMonochromeAntTheme } from '@/constants/ant-theme';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const useMonochromeColors = () => {
  const scheme = useColorScheme() ?? 'light';
  return Colors[scheme];
};

export function MonochromeProvider({ children }: PropsWithChildren) {
  const scheme = useColorScheme() ?? 'light';
  const theme = useMemo(() => createMonochromeAntTheme(scheme), [scheme]);

  return <Provider theme={theme}>{children}</Provider>;
}

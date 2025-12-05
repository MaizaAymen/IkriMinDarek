import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import 'react-native-reanimated';

import { MonochromeProvider, useMonochromeColors } from '@/components/ui/monochrome-provider';
import { DrawerProvider } from '@/components/ui/drawer-provider';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ChatProvider } from '@/context/ChatContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { isSignedIn, isLoading, user } = useAuth();
  const palette = useMonochromeColors();

  const navigationTheme = useMemo(() => {
    const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: palette.primary,
        background: palette.background,
        card: palette.surface,
        text: palette.text,
        border: palette.border,
        notification: palette.secondary,
      },
    };
  }, [colorScheme, palette]);

  console.log('\n🔄 [RootLayout] RENDER CHECK');
  console.log('   isSignedIn:', isSignedIn);
  console.log('   isLoading:', isLoading);
  console.log('   userId:', user?.id);
  console.log('   userRole:', user?.role);
  console.log('   user object:', user);

  return (
    <ThemeProvider value={navigationTheme}>
      <MonochromeProvider>
        <DrawerProvider>
          <ChatProvider>
            <Stack>
              {/* Auth Screens - Always available */}
              <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register-simple" options={{ headerShown: false }} />

            {/* Admin Screen - Always available */}
            <Stack.Screen name="admin" options={{ headerShown: false }} />

            {/* Tabs Screen - Always available */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            {/* Property Details Screen */}
            <Stack.Screen
              name="property/[id]"
              options={{
                title: 'Property Details',
                headerShown: false,
              }}
            />

            {/* Properties Map Screen */}
            <Stack.Screen
              name="properties-map"
              options={{
                title: 'Browse Properties',
                headerShown: false,
              }}
            />

            {/* Edit Profile Screen */}
            <Stack.Screen
              name="edit-profile"
              options={{
                title: 'Edit Profile',
                headerShown: false,
              }}
            />

            {/* Post Property Screen */}
            <Stack.Screen
              name="post-property"
              options={{
                title: 'Post Property',
                headerShown: false,
              }}
            />

            {/* My Properties Screen */}
            <Stack.Screen
              name="my-properties"
              options={{
                title: 'My Properties',
                headerShown: false,
              }}
            />

            {/* Modal Screen */}
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
        </ChatProvider>
        </DrawerProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </MonochromeProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutContent />
    </AuthProvider>
  );
}

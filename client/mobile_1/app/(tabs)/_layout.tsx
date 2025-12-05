import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useMonochromeColors } from '@/components/ui/monochrome-provider';
import { useDrawer } from '@/components/ui/drawer-provider';
import AppHeader from '@/components/ui/app-header';

export default function TabLayout() {
  const colors = useMonochromeColors();
  const { openDrawer } = useDrawer();

  const tabBarStyle = useMemo(
    () =>
      StyleSheet.flatten([
        styles.tabBar,
        { backgroundColor: colors.surface, borderTopColor: colors.border },
      ]),
    [colors.surface, colors.border],
  );

  return (
    <View style={styles.container}>
      <AppHeader onMenuPress={openDrawer} />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle,
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="paperplane.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            title: 'Bookings',
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="calendar" color={color} />,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="message.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: 'Favorites',
            tabBarIcon: ({ color }) => <IconSymbol size={26} name="heart.fill" color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    borderTopWidth: 1,
    paddingTop: 4,
    height: 60,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

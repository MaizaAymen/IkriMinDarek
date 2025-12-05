import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMonochromeColors } from './monochrome-provider';
import { useAuth } from '@/context/AuthContext';
import { Shades } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

interface NavItem {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', icon: 'home', route: '/(tabs)' },
  { label: 'Explore', icon: 'compass', route: '/(tabs)/explore' },
  { label: 'Bookings', icon: 'calendar', route: '/(tabs)/bookings' },
  { label: 'Chat', icon: 'chatbubbles', route: '/(tabs)/chat' },
  { label: 'Favorites', icon: 'heart', route: '/(tabs)/favorites' },
  { label: 'My Properties', icon: 'business', route: '/my-properties', roles: ['proprietaire', 'agent', 'admin'] },
  { label: 'Post Property', icon: 'add-circle', route: '/post-property', roles: ['proprietaire', 'agent', 'admin'] },
  { label: 'Map View', icon: 'map', route: '/properties-map' },
  { label: 'Edit Profile', icon: 'person-circle', route: '/edit-profile' },
  { label: 'Admin Panel', icon: 'settings', route: '/admin', roles: ['admin'] },
];

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SidebarDrawer({ isOpen, onClose }: SidebarDrawerProps) {
  const colors = useMonochromeColors();
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isSignedIn } = useAuth();

  const handleNavigation = useCallback(
    (route: string) => {
      onClose();
      setTimeout(() => {
        router.push(route as any);
      }, 150);
    },
    [onClose, router],
  );

  const handleLogout = useCallback(async () => {
    onClose();
    await logout();
    router.replace('/login');
  }, [onClose, logout, router]);

  const handleLogin = useCallback(() => {
    onClose();
    router.push('/login');
  }, [onClose, router]);

  const filteredNavItems = useMemo(() => {
    return NAV_ITEMS.filter((item) => {
      if (!item.roles) return true;
      if (!user?.role) return false;
      return item.roles.includes(user.role);
    });
  }, [user?.role]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.overlay,
          zIndex: 100,
        },
        drawer: {
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: DRAWER_WIDTH,
          backgroundColor: colors.surface,
          zIndex: 101,
          shadowColor: Shades.shade000,
          shadowOffset: { width: 2, height: 0 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 10,
        },
        safeArea: {
          flex: 1,
        },
        header: {
          padding: 24,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        profileSection: {
          alignItems: 'center',
        },
        avatar: {
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: colors.surfaceVariant,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 12,
          borderWidth: 2,
          borderColor: colors.border,
        },
        avatarImage: {
          width: 80,
          height: 80,
          borderRadius: 40,
        },
        userName: {
          fontSize: 18,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 4,
        },
        userEmail: {
          fontSize: 13,
          color: colors.textSecondary,
          marginBottom: 4,
        },
        userRole: {
          fontSize: 11,
          color: colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 1,
          backgroundColor: colors.surfaceVariant,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 12,
          overflow: 'hidden',
        },
        navList: {
          flex: 1,
          paddingVertical: 8,
        },
        navItem: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 14,
          paddingHorizontal: 24,
          marginHorizontal: 12,
          marginVertical: 2,
          borderRadius: 12,
        },
        navItemActive: {
          backgroundColor: colors.primary,
        },
        navIcon: {
          marginRight: 16,
        },
        navLabel: {
          fontSize: 15,
          fontWeight: '500',
          color: colors.text,
        },
        navLabelActive: {
          color: colors.surface,
          fontWeight: '600',
        },
        divider: {
          height: 1,
          backgroundColor: colors.border,
          marginHorizontal: 24,
          marginVertical: 12,
        },
        footer: {
          padding: 24,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        authButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primary,
          paddingVertical: 14,
          borderRadius: 12,
        },
        authButtonText: {
          fontSize: 15,
          fontWeight: '600',
          color: colors.surface,
          marginLeft: 8,
        },
        logoutButton: {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
        },
        logoutButtonText: {
          color: colors.text,
        },
        guestText: {
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: 'center',
          marginBottom: 16,
        },
        versionText: {
          fontSize: 11,
          color: colors.textMuted,
          textAlign: 'center',
          marginTop: 12,
        },
      }),
    [colors],
  );

  if (!isOpen) return null;

  return (
    <>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={styles.drawer}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header with Profile */}
          <View style={styles.header}>
            <View style={styles.profileSection}>
              <View style={styles.avatar}>
                {user?.id ? (
                  <Image
                    source={{
                      uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        `${user.prenom} ${user.nom}`,
                      )}&background=111111&color=ffffff&size=160`,
                    }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Ionicons name="person" size={36} color={colors.textSecondary} />
                )}
              </View>
              {isSignedIn && user ? (
                <>
                  <Text style={styles.userName}>
                    {user.prenom} {user.nom}
                  </Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <Text style={styles.userRole}>{user.role}</Text>
                </>
              ) : (
                <Text style={styles.userName}>Guest</Text>
              )}
            </View>
          </View>

          {/* Navigation List */}
          <ScrollView style={styles.navList} showsVerticalScrollIndicator={false}>
            {filteredNavItems.map((item, index) => {
              const isActive = pathname === item.route || pathname.startsWith(item.route + '/');
              return (
                <TouchableOpacity
                  key={item.route}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                  onPress={() => handleNavigation(item.route)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={isActive ? colors.surface : colors.text}
                    style={styles.navIcon}
                  />
                  <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Footer with Auth Button */}
          <View style={styles.footer}>
            {isSignedIn ? (
              <TouchableOpacity
                style={[styles.authButton, styles.logoutButton]}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <Ionicons name="log-out-outline" size={20} color={colors.text} />
                <Text style={[styles.authButtonText, styles.logoutButtonText]}>Sign Out</Text>
              </TouchableOpacity>
            ) : (
              <>
                <Text style={styles.guestText}>Sign in to access all features</Text>
                <TouchableOpacity style={styles.authButton} onPress={handleLogin} activeOpacity={0.7}>
                  <Ionicons name="log-in-outline" size={20} color={colors.surface} />
                  <Text style={styles.authButtonText}>Sign In</Text>
                </TouchableOpacity>
              </>
            )}
            <Text style={styles.versionText}>IkriMinDarek v1.0.0</Text>
          </View>
        </SafeAreaView>
      </View>
    </>
  );
}

export default SidebarDrawer;

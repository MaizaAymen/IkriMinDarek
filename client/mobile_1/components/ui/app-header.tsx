import React, { useMemo, useCallback } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMonochromeColors } from './monochrome-provider';
import { useAuth } from '@/context/AuthContext';
import { Shades } from '@/constants/theme';

interface AppHeaderProps {
  title?: string;
  onMenuPress: () => void;
  showBackButton?: boolean;
}

export function AppHeader({ title, onMenuPress, showBackButton = false }: AppHeaderProps) {
  const colors = useMonochromeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isSignedIn } = useAuth();

  const handleProfilePress = useCallback(() => {
    if (isSignedIn) {
      router.push('/edit-profile');
    } else {
      router.push('/login');
    }
  }, [isSignedIn, router]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: 16,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          shadowColor: Shades.shade000,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 4,
        },
        leftSection: {
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
        },
        menuButton: {
          width: 42,
          height: 42,
          borderRadius: 12,
          backgroundColor: colors.surfaceVariant,
          justifyContent: 'center',
          alignItems: 'center',
        },
        title: {
          fontSize: 18,
          fontWeight: '700',
          color: colors.text,
          marginLeft: 12,
        },
        rightSection: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        profileButton: {
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: colors.surfaceVariant,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 2,
          borderColor: colors.border,
          overflow: 'hidden',
        },
        profileImage: {
          width: 42,
          height: 42,
          borderRadius: 21,
        },
        onlineIndicator: {
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: '#4CAF50',
          borderWidth: 2,
          borderColor: colors.surface,
        },
      }),
    [colors, insets.top],
  );

  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={showBackButton ? handleBack : onMenuPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name={showBackButton ? 'arrow-back' : 'menu'}
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        {title && <Text style={styles.title}>{title}</Text>}
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity style={styles.profileButton} onPress={handleProfilePress} activeOpacity={0.7}>
          {isSignedIn && user ? (
            <>
              <Image
                source={{
                  uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    `${user.prenom} ${user.nom}`,
                  )}&background=111111&color=ffffff&size=84`,
                }}
                style={styles.profileImage}
              />
              <View style={styles.onlineIndicator} />
            </>
          ) : (
            <Ionicons name="person" size={20} color={colors.textSecondary} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default AppHeader;

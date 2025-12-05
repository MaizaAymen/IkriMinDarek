import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Modal } from '@ant-design/react-native';
import { router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useMonochromeColors } from '@/components/ui/monochrome-provider';
import { propertiesAPI, favoritesAPI, bookingsAPI } from '@/services/api';

export default function HomeScreen() {
  const { user, logout, isLoading } = useAuth();
  const [showLogout, setShowLogout] = useState(false);
  const [stats, setStats] = useState({ properties: 0, favorites: 0, bookings: 0 });
  const [loadingStats, setLoadingStats] = useState(false);
  const colors = useMonochromeColors();

  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        fetchStats();
      }
    }, [user?.id])
  );

  const fetchStats = async () => {
    if (!user?.id) return;
    try {
      setLoadingStats(true);
      
      // Fetch properties (by current user)
      const allProperties = await propertiesAPI.getAll();
      const userProperties = allProperties.filter((prop: any) => prop.proprietaire_id === user.id);
      
      // Fetch favorites
      const favorites = await favoritesAPI.getByUser(user.id);
      
      // Fetch bookings
      const bookings = await bookingsAPI.getByUser(user.id);
      
      setStats({
        properties: userProperties.length,
        favorites: favorites.length,
        bookings: bookings.length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const infoRows = [
    { label: 'Email', value: user?.email || 'N/A', icon: 'email-outline' },
    { label: 'Phone', value: user?.phone || 'N/A', icon: 'phone-outline' },
    { label: 'City', value: user?.ville || 'N/A', icon: 'map-marker-outline' },
    { label: 'Specialty', value: user?.specialite || 'Not specified', icon: 'briefcase-outline' },
    { label: 'Bio', value: user?.bio || 'Add a short description', icon: 'text-outline' },
  ];

  const initials = `${user?.prenom?.charAt(0) || ''}${user?.nom?.charAt(0) || ''}`.toUpperCase() || 'U';

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setShowLogout(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
        <View style={styles.centerContent}>
          <ActivityIndicator animating color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>My Profile</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>Manage your account</Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.profileCardHeader}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {user?.prenom} {user?.nom}
              </Text>
              <View style={styles.roleContainer}>
                <View style={[styles.roleBadge, { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: '#3b82f6' }]}>
                  <MaterialCommunityIcons name="crown" size={12} color="#3b82f6" />
                  <Text style={[styles.roleText, { color: '#3b82f6' }]}>
                    {user?.role?.toUpperCase() || 'MEMBER'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={[styles.profileDivider, { backgroundColor: colors.border }]} />

          <View style={styles.profileStats}>
            <TouchableOpacity style={styles.statItem} onPress={() => router.push('/my-properties')}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{stats.properties}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Properties</Text>
            </TouchableOpacity>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{stats.favorites}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Favorites</Text>
            </TouchableOpacity>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{stats.bookings}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Bookings</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/edit-profile')}
          >
            <MaterialCommunityIcons name="pencil" size={18} color="#fff" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Information Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="information-outline" size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Text>
          </View>

          <View style={styles.infoList}>
            {infoRows.map((row, index) => (
              <View 
                key={row.label}
                style={[
                  styles.infoRow,
                  { borderBottomColor: colors.border },
                  index !== infoRows.length - 1 && { borderBottomWidth: 1 }
                ]}
              >
                <View style={[styles.infoIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                  <MaterialCommunityIcons name={row.icon as any} size={16} color="#3b82f6" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    {row.label}
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {row.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/my-properties')}
          >
            <View style={[styles.actionIconBg, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
              <MaterialCommunityIcons name="home-variant" size={24} color="#22c55e" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>My Properties</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>Manage your listings</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/edit-profile')}
          >
            <View style={[styles.actionIconBg, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
              <MaterialCommunityIcons name="account-edit" size={24} color="#f97316" />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Edit Profile</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>Update your details</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' }]}
          onPress={() => setShowLogout(true)}
        >
          <MaterialCommunityIcons name="logout" size={18} color="#ef4444" />
          <Text style={[styles.logoutButtonText, { color: '#ef4444' }]}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        popup
        visible={showLogout}
        animationType="fade"
        onClose={() => setShowLogout(false)}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}> 
          <View style={styles.modalIcon}>
            <MaterialCommunityIcons name="logout-variant" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Sign Out?</Text>
          <Text style={[styles.modalCopy, { color: colors.textSecondary }]}>
            You will need to sign in again to access your account.
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setShowLogout(false)}
            >
              <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: '#ef4444' }]}
              onPress={handleLogout}
            >
              <Text style={styles.modalDangerText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },

  /* Header */
  headerSection: {
    marginBottom: Spacing.lg,
  },

  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  heroSubtitle: {
    marginTop: Spacing.xs,
    fontSize: 14,
    fontWeight: '500',
  },

  /* Profile Card */
  profileCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  profileCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },

  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },

  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },

  userName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: Spacing.xs,
  },

  roleContainer: {
    flexDirection: 'row',
  },

  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },

  roleText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  profileDivider: {
    height: 1,
    marginBottom: Spacing.lg,
  },

  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },

  statValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: Spacing.xs,
  },

  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },

  statDivider: {
    width: 1,
    height: 40,
  },

  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  editButtonText: {
    fontWeight: '700',
    fontSize: 14,
    color: '#fff',
    letterSpacing: -0.2,
  },

  /* Section */
  section: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  /* Info List */
  infoList: {
    gap: 0,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },

  infoIconBg: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },

  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  /* Actions Section */
  actionsSection: {
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },

  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  actionIconBg: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionContent: {
    flex: 1,
  },

  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  actionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: Spacing.xs,
  },

  /* Logout Button */
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    marginBottom: Spacing.lg,
  },

  logoutButtonText: {
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: -0.2,
  },

  /* Center Content */
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Modal */
  modalContent: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
  },

  modalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: Spacing.sm,
  },

  modalCopy: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },

  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },

  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },

  modalButtonText: {
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: -0.2,
  },

  modalDangerText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: -0.2,
  },
});


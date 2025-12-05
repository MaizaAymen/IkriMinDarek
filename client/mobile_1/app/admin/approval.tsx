import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';

interface Property {
  id: string;
  titre: string;
  description: string;
  prix_mensuel: number;
  ville: string;
  adresse: string;
  statut_approbation: 'en_attente' | 'approuvee' | 'rejetee';
  raison_rejet?: string;
  proprietaire: {
    nom: string;
    prenom: string;
    email: string;
  };
}

interface TabStatus {
  en_attente: number;
  approuvees: number;
  rejetees: number;
  total: number;
}

const palette = {
  background: '#ffffff',
  surface: '#f8f8f8',
  card: '#ffffff',
  border: '#e5e5e5',
  overlay: 'rgba(0, 0, 0, 0.5)',
  text: '#000000',
  muted: '#666666',
  accent: '#000000',
  accentMuted: '#333333',
  lightBg: '#f0f0f0',
  divider: '#d9d9d9',
};

const STATUS_PILLS: Record<Property['statut_approbation'], { label: string; icon: string; background: string; border: string }> = {
  en_attente: {
    label: 'Pending',
    icon: '⏳',
    background: '#f0f0f0',
    border: '#d9d9d9',
  },
  approuvee: {
    label: 'Approved',
    icon: '✔',
    background: '#ffffff',
    border: '#000000',
  },
  rejetee: {
    label: 'Rejected',
    icon: '✖',
    background: '#fafafa',
    border: '#d9d9d9',
  },
};

const TAB_CONFIG = [
  { key: 'en_attente' as const, label: 'Pending', hint: 'Awaiting triage' },
  { key: 'approuvees' as const, label: 'Approved', hint: 'Live listings' },
  { key: 'rejetees' as const, label: 'Rejected', hint: 'Needs fixes' },
];

export default function AdminApprovalScreen() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<TabStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'en_attente' | 'approuvees' | 'rejetees'>('en_attente');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalPropertyId, setApprovalPropertyId] = useState<string | null>(null);

  const statBlocks = stats
    ? [
        { label: 'Pending', value: stats.en_attente, hint: 'Awaiting review' },
        { label: 'Approved', value: stats.approuvees, hint: 'Live inventory' },
        { label: 'Rejected', value: stats.rejetees, hint: 'Needs fixes' },
      ]
    : [];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      console.log('[Admin] Fetching approval data...');

      try {
        const statsResponse = await fetch('http://localhost:4000/api/approval/admin/stats', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
          console.log('[Admin] Stats:', statsData);
        }
      } catch (err) {
        console.error('[Admin] Error fetching stats:', err);
      }

      await filterProperties();
    } catch (error) {
      console.error('[Admin] Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const filterProperties = async (tab: string = activeTab) => {
    try {
      console.log(`[Admin] Fetching ${tab} properties...`);

      const endpoint =
        tab === 'en_attente'
          ? 'http://localhost:4000/api/approval/admin/pending'
          : tab === 'approuvees'
          ? 'http://localhost:4000/api/approval/admin/approved'
          : 'http://localhost:4000/api/approval/admin/rejected';

      console.log(`[Admin] Calling endpoint: ${endpoint}`);
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      console.log(`[Admin] Response status: ${response.status}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch properties`);
      }

      const data = await response.json();
      console.log('[Admin] Response data:', data);
      setProperties(data.properties || []);
      console.log(`[Admin] Loaded ${data.count} ${tab} properties`);
    } catch (error) {
      console.error(`[Admin] Error fetching ${tab} properties:`, error);
      Alert.alert('Error', `Failed to load properties: ${error}`);
    }
  };

  const handleApprove = async (propertyId: string) => {
    try {
      console.log(`[Admin] Opening approve dialog for property ${propertyId}`);
      setApprovalPropertyId(propertyId);
      setShowApprovalModal(true);
    } catch (error) {
      console.error('[Admin] Error in handleApprove:', error);
      Alert.alert('Error', 'Failed to approve property');
    }
  };

  const handleApprovalConfirm = async () => {
    if (!approvalPropertyId) return;

    try {
      console.log(`[Admin] User confirmed approval for property ${approvalPropertyId}`);
      const token = localStorage.getItem('auth_token');
      console.log(`[Admin] Token present: ${!!token}`);
      console.log(`[Admin] Calling endpoint: http://localhost:4000/api/properties/${approvalPropertyId}/approve`);

      const response = await fetch(`http://localhost:4000/api/properties/${approvalPropertyId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`[Admin] Response received. Status: ${response.status}`);
      const responseData = await response.json();
      console.log('[Admin] Response data:', responseData);

      if (response.ok) {
        console.log(`[Admin] ✅ Property ${approvalPropertyId} approved successfully`);
        Alert.alert('Success', 'Property approved successfully');
        setShowApprovalModal(false);
        setApprovalPropertyId(null);
        await fetchData();
      } else {
        const errorMsg = responseData?.error || `HTTP ${response.status}: Failed to approve property`;
        console.error('[Admin] Error response:', errorMsg);
        Alert.alert('Error', errorMsg);
      }
    } catch (innerError) {
      console.error('[Admin] Inner error approving property:', innerError);
      Alert.alert('Error', `Failed to approve property: ${innerError}`);
    }
  };

  const handleRejectClick = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setRejectionReason('');
    setShowRejectionModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Error', 'Please enter a rejection reason');
      return;
    }

    try {
      console.log(`[Admin] Rejecting property ${selectedPropertyId} with reason: ${rejectionReason}`);
      const token = localStorage.getItem('auth_token');
      console.log(`[Admin] Token present: ${!!token}`);
      console.log(`[Admin] Calling endpoint: http://localhost:4000/api/properties/${selectedPropertyId}/reject`);

      const response = await fetch(`http://localhost:4000/api/properties/${selectedPropertyId}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raison_rejet: rejectionReason }),
      });

      console.log(`[Admin] Response received. Status: ${response.status}`);
      const responseData = await response.json();
      console.log('[Admin] Response data:', responseData);

      if (response.ok) {
        console.log(`[Admin] ✅ Property ${selectedPropertyId} rejected successfully`);
        Alert.alert('Success', 'Property rejected successfully');
        setShowRejectionModal(false);
        await fetchData();
      } else {
        const errorMsg = responseData?.error || `HTTP ${response.status}: Failed to reject property`;
        console.error('[Admin] Error response:', errorMsg);
        Alert.alert('Error', errorMsg);
      }
    } catch (error) {
      console.error('[Admin] Error rejecting property:', error);
      Alert.alert('Error', `Failed to reject property: ${error}`);
    }
  };

  const renderPropertyCard = (item: Property) => {
    const badge = STATUS_PILLS[item.statut_approbation] ?? STATUS_PILLS.en_attente;

    return (
      <View style={styles.propertyCard}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.propertyTitle}>{item.titre}</Text>
            <Text style={styles.propertyOwner}>{`By ${item.proprietaire.nom} ${item.proprietaire.prenom}`}</Text>
          </View>

          <View style={[styles.statusChip, { backgroundColor: badge.background, borderColor: badge.border }]}>
            <Text style={styles.statusIcon}>{badge.icon}</Text>
            <Text style={styles.statusText}>{badge.label}</Text>
          </View>
        </View>

        <Text style={styles.propertyDescription} numberOfLines={3}>
          {item.description}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaValue}>{item.prix_mensuel} TND / month</Text>
          <View style={styles.metaDivider} />
          <Text style={styles.metaValue}>{item.ville}</Text>
        </View>

        {item.statut_approbation === 'rejetee' && item.raison_rejet ? (
          <View style={styles.rejectionBlock}>
            <Text style={styles.rejectionLabel}>Rejection note</Text>
            <Text style={styles.rejectionText}>{item.raison_rejet}</Text>
          </View>
        ) : null}

        {item.statut_approbation === 'en_attente' && (
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={[styles.ctaButton, styles.primaryCta]}
              onPress={() => {
                console.log(`[Admin] Approve button pressed for property ${item.id}`);
                handleApprove(item.id);
              }}
            >
              <Text style={styles.primaryCtaText}>Approve</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ctaButton, styles.secondaryCta]}
              onPress={() => {
                console.log(`[Admin] Reject button pressed for property ${item.id}`);
                handleRejectClick(item.id);
              }}
            >
              <Text style={styles.secondaryCtaText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSection}>
          <Text style={styles.headerEyebrow}>Curation</Text>
          <Text style={styles.mainTitle}>Approval Console</Text>
          <Text style={styles.headerHint}>
            Keep the marketplace sharp by approving the best homes and flagging what needs work.
          </Text>
        </View>

        {stats && (
          <View style={styles.statsGrid}>
            {statBlocks.map((block) => (
              <View key={block.label} style={styles.statCard}>
                <Text style={styles.statValue}>{block.value}</Text>
                <Text style={styles.statLabel}>{block.label}</Text>
                <Text style={styles.statHint}>{block.hint}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.tabRow}>
          {TAB_CONFIG.map((tab) => {
            const isActive = activeTab === tab.key;
            const count =
              tab.key === 'en_attente'
                ? stats?.en_attente ?? 0
                : tab.key === 'approuvees'
                ? stats?.approuvees ?? 0
                : stats?.rejetees ?? 0;

            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                  <Text style={styles.tabCount}> · {count}</Text>
                </Text>
                <Text style={[styles.tabHint, isActive && styles.tabHintActive]}>{tab.hint}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={palette.accent} />
          </View>
        ) : properties.length > 0 ? (
          <View style={styles.listContent}>
            {properties.map((property) => (
              <View key={property.id}>{renderPropertyCard(property)}</View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Nothing to review</Text>
            <Text style={styles.emptySubtitle}>
              Switch tabs or check back after new submissions arrive.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showRejectionModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowRejectionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add rejection note</Text>
            <Text style={styles.modalDescription}>
              Let the owner know what needs to change before resubmitting.
            </Text>

            <TextInput
              style={styles.reasonInput}
              placeholder="Short and actionable..."
              placeholderTextColor={palette.muted}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonGhost]}
                onPress={() => setShowRejectionModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleRejectSubmit}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonPrimaryText]}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showApprovalModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowApprovalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Approve listing</Text>
            <Text style={styles.modalDescription}>
              This will publish the property to the explore feed immediately.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonGhost]}
                onPress={() => {
                  console.log('[Admin] Approval cancelled');
                  setShowApprovalModal(false);
                  setApprovalPropertyId(null);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => {
                  console.log('[Admin] Approval confirmed, calling handleApprovalConfirm');
                  handleApprovalConfirm();
                }}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonPrimaryText]}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: palette.border,
    backgroundColor: palette.background,
  },
  headerEyebrow: {
    color: palette.muted,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 8,
  },
  mainTitle: {
    color: palette.text,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  headerHint: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: palette.card,
    borderRadius: 12,
    padding: 18,
    borderWidth: 1.5,
    borderColor: palette.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  statValue: {
    color: palette.accent,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    color: palette.text,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
  },
  statHint: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '400',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: palette.lightBg,
  },
  tabButtonActive: {
    borderColor: palette.accent,
    backgroundColor: palette.card,
    borderWidth: 2,
  },
  tabLabel: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: palette.accent,
    fontWeight: '700',
  },
  tabCount: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  tabHint: {
    color: palette.muted,
    fontSize: 11,
    marginTop: 6,
    fontWeight: '400',
  },
  tabHintActive: {
    color: palette.text,
  },
  listContent: {
    paddingHorizontal: 24,
  },
  propertyCard: {
    backgroundColor: palette.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: palette.border,
    padding: 22,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  propertyTitle: {
    color: palette.text,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  propertyOwner: {
    color: palette.muted,
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  statusIcon: {
    color: palette.accent,
    fontSize: 12,
    marginRight: 4,
  },
  statusText: {
    color: palette.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  propertyDescription: {
    color: palette.text,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 14,
    fontWeight: '400',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  metaValue: {
    color: palette.accentMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: palette.divider,
    marginHorizontal: 10,
  },
  rejectionBlock: {
    borderWidth: 1.5,
    borderColor: palette.divider,
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
    backgroundColor: palette.lightBg,
  },
  rejectionLabel: {
    color: palette.muted,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    fontWeight: '700',
  },
  rejectionText: {
    color: palette.text,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  ctaButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  primaryCta: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  primaryCtaText: {
    color: palette.background,
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryCta: {
    backgroundColor: 'transparent',
  },
  secondaryCtaText: {
    color: palette.text,
    fontWeight: '600',
    fontSize: 14,
  },
  centerContainer: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingHorizontal: 24,
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    color: palette.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: palette.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: palette.border,
    padding: 24,
    backgroundColor: palette.card,
  },
  modalTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  modalDescription: {
    color: palette.muted,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
    fontWeight: '400',
  },
  reasonInput: {
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: 10,
    padding: 14,
    height: 120,
    color: palette.text,
    backgroundColor: palette.lightBg,
    textAlignVertical: 'top',
    marginBottom: 20,
    fontSize: 14,
    fontWeight: '400',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: palette.border,
  },
  modalButtonGhost: {
    backgroundColor: 'transparent',
  },
  modalButtonPrimary: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  modalButtonText: {
    color: palette.text,
    fontWeight: '700',
    fontSize: 14,
  },
  modalButtonPrimaryText: {
    color: palette.background,
  },
});

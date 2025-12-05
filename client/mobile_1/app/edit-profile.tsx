import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Image, Platform } from 'react-native';
import { Modal } from '@ant-design/react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

import { useMonochromeColors } from '@/components/ui/monochrome-provider';
import { ScreenWithHeader } from '@/components/ui/drawer-provider';
import { useAuth } from '@/context/AuthContext';
import { BorderRadius, Spacing } from '@/constants/theme';
import { authAPI } from '@/services/api';
import { API_BASE_URL } from '@/config/api.config';

interface FormData {
  nom: string;
  prenom: string;
  email: string;
  phone: string;
  bio: string;
  ville: string;
  gouvernorat: string;
  image?: string | null;
}

export default function EditProfileScreen() {
  const { user, isLoading: authLoading, checkAuth } = useAuth();
  const colors = useMonochromeColors();
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isAvatarPicking, setIsAvatarPicking] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    nom: '',
    prenom: '',
    email: '',
    phone: '',
    bio: '',
    ville: '',
    gouvernorat: '',
    image: null,
  });

  const serverBaseUrl = useMemo(() => API_BASE_URL.replace(/\/api$/, ''), []);

  const getBase64FromUri = async (uri: string) => {
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Unable to read file data'));
        reader.onloadend = () => {
          const dataUrl = reader.result;
          if (typeof dataUrl === 'string') {
            const [, base64 = ''] = dataUrl.split(',');
            resolve(base64);
          } else {
            reject(new Error('Unsupported file reader result'));
          }
        };
        reader.readAsDataURL(blob);
      });
    }

    return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  };

  const resolveImageUri = useCallback((value?: string | null) => {
    if (!value) return null;
    if (value.startsWith('data:')) return value;
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }
    const normalized = value.startsWith('/') ? value : `/${value}`;
    return `${serverBaseUrl}${normalized}`;
  }, [serverBaseUrl]);

  const defaultAvatarUri = useMemo(() => {
    const name = `${user?.prenom || ''} ${user?.nom || ''}`.trim() || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=111111&color=ffffff&size=256`;
  }, [user?.nom, user?.prenom]);

  useEffect(() => {
    if (user) {
      setFormData({
        nom: user.nom || '',
        prenom: user.prenom || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        ville: user.ville || '',
        gouvernorat: user.gouvernorat || '',
        image: user.image || null,
      });
      setAvatarPreview(resolveImageUri(user.image) || null);
    }
  }, [user, resolveImageUri]);

  const handleChange = (field: keyof FormData, value: string) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handlePickAvatar = async () => {
    if (isSaving || isAvatarPicking) return;
    try {
      setIsAvatarPicking(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Modal.alert('Permission required', 'We need access to your photo library to update your avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: false,
        mediaTypes: ['images'],
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      const mimeType = asset.mimeType || 'image/jpeg';
      const base64Data = await getBase64FromUri(asset.uri);
      const dataUri = `data:${mimeType};base64,${base64Data}`;

      setAvatarPreview(asset.uri);
      setFormData((prev) => ({ ...prev, image: dataUri }));
    } catch (error) {
      console.error('Error picking avatar:', error);
      Modal.alert('Error', 'Unable to select an image right now. Please try again.');
    } finally {
      setIsAvatarPicking(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nom || !formData.prenom || !formData.email) {
      Modal.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }
    try {
      setIsSaving(true);
      await authAPI.completeProfile({
        ...formData,
        gouvernorat: formData.gouvernorat || null,
        ville: formData.ville || null,
        bio: formData.bio || null,
        phone: formData.phone || null,
        image: formData.image || null,
      });
      await checkAuth();
      Modal.alert('Saved', 'Profile updated successfully.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      Modal.alert('Error', e?.response?.data?.error || e?.message || 'Failed to save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return (
      <ScreenWithHeader title="Edit Profile" showBackButton>
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <ActivityIndicator animating color={colors.primary} />
        </View>
      </ScreenWithHeader>
    );
  }

  return (
    <ScreenWithHeader title="Edit Profile" showBackButton>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView 
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.avatarCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={{ uri: avatarPreview || resolveImageUri(formData.image || null) || defaultAvatarUri }}
                  style={styles.avatarImage}
                />
                <TouchableOpacity
                  style={[styles.avatarAction, { backgroundColor: colors.primary }]}
                  onPress={handlePickAvatar}
                  disabled={isAvatarPicking || isSaving}
                  activeOpacity={0.8}
                >
                  {isAvatarPicking ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MaterialCommunityIcons name="camera" size={18} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.avatarTextBlock}>
                <Text style={[styles.avatarTitle, { color: colors.text }]}>Profile photo</Text>
                <Text style={[styles.avatarSubtitle, { color: colors.textSecondary }]}>Upload a clear photo so renters know who they are speaking with.</Text>
              </View>
            </View>
          </View>

          {/* Personal Info Section */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>First Name *</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="account-circle-outline" size={18} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="First name"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.prenom}
                  onChangeText={(v) => handleChange('prenom', v)}
                  editable={!isSaving}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Last Name *</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="account-circle-outline" size={18} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Last name"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.nom}
                  onChangeText={(v) => handleChange('nom', v)}
                  editable={!isSaving}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Email *</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="email-outline" size={18} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.textSecondary }]}
                  placeholder="Email"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.email}
                  editable={false}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Phone</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="phone-outline" size={18} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Phone number"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.phone}
                  onChangeText={(v) => handleChange('phone', v)}
                  keyboardType="phone-pad"
                  editable={!isSaving}
                />
              </View>
            </View>
          </View>

          {/* Location Section */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="map-marker" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>City</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="city" size={18} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="City"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.ville}
                  onChangeText={(v) => handleChange('ville', v)}
                  editable={!isSaving}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Governorate</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="map" size={18} color={colors.textSecondary} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Governorate"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.gouvernorat}
                  onChangeText={(v) => handleChange('gouvernorat', v)}
                  editable={!isSaving}
                />
              </View>
            </View>
          </View>

          {/* About Section */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="text-box-outline" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>About You</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Bio</Text>
              <View style={[styles.textareaContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.textarea, { color: colors.text }]}
                  placeholder="Tell us about yourself"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.bio}
                  onChangeText={(v) => handleChange('bio', v)}
                  multiline
                  numberOfLines={4}
                  editable={!isSaving}
                />
              </View>
            </View>
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={() => router.back()}
            disabled={isSaving}
          >
            <MaterialCommunityIcons name="close-circle-outline" size={20} color={colors.text} />
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>

          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      </SafeAreaView>
    </ScreenWithHeader>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg, paddingBottom: Spacing.xl },
  avatarCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  avatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
  },
  avatarAction: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarTextBlock: {
    flex: 1,
    gap: 4,
  },
  avatarTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  avatarSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  
  section: { 
    borderRadius: BorderRadius.md, 
    borderWidth: 1, 
    padding: Spacing.lg, 
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  
  formGroup: { marginBottom: Spacing.lg },
  label: { fontSize: 12, fontWeight: '600', marginBottom: Spacing.sm, letterSpacing: 0.3 },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 48,
    gap: Spacing.sm,
  },
  input: { 
    flex: 1, 
    fontSize: 14, 
    fontWeight: '500',
  },
  
  textareaContainer: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    height: 120,
  },
  textarea: { 
    flex: 1, 
    fontSize: 14, 
    fontWeight: '500',
    textAlignVertical: 'top',
  },
  
  primaryButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.md, 
    height: 48,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#fff',
    letterSpacing: 0.2,
  },
  
  secondaryButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.md, 
    height: 48,
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.lg,
    borderWidth: 1.5,
  },
  secondaryButtonText: { 
    fontSize: 16, 
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

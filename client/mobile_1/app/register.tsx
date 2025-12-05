import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useMonochromeColors } from '@/components/ui/monochrome-provider';

const ROLES = ['proprietaire', 'locataire', 'agent', 'admin'];

export default function RegisterScreen() {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [mdp, setMdp] = useState('');
  const [confirmMdp, setConfirmMdp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedRole, setSelectedRole] = useState('locataire');
  const [localError, setLocalError] = useState<string | null>(null);
  const { register, isLoading } = useAuth();
  const colors = useMonochromeColors();

  const validate = () => {
    if (!nom.trim() || !prenom.trim() || !email.trim() || !mdp.trim()) {
      setLocalError('All required fields must be completed.');
      return false;
    }

    if (!email.includes('@')) {
      setLocalError('Please enter a valid email.');
      return false;
    }

    if (mdp.length < 6) {
      setLocalError('Password must contain at least 6 characters.');
      return false;
    }

    if (mdp !== confirmMdp) {
      setLocalError('Passwords do not match.');
      return false;
    }

    setLocalError(null);
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    try {
      await register({
        nom,
        prenom,
        email,
        mdp,
        role: selectedRole as any,
      });
      router.replace('/(tabs)');
    } catch (error: any) {
      setLocalError(error?.response?.data?.error || error?.message || 'Registration failed.');
    }
  };

  const inlineError = localError;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Join our community</Text>
        </View>

        {/* Logo/Brand */}
        <View style={[styles.brandContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.brandIcon, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="home-city" size={32} color="#fff" />
          </View>
          <Text style={[styles.brandName, { color: colors.text }]}>IkriMinDarek</Text>
        </View>

        {/* Identity Section */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="account" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Identity</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>First Name</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="account-circle-outline" size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="First name"
                placeholderTextColor={colors.textSecondary}
                value={prenom}
                onChangeText={setPrenom}
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Last Name</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="account-circle-outline" size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Last name"
                placeholderTextColor={colors.textSecondary}
                value={nom}
                onChangeText={setNom}
                editable={!isLoading}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="email-outline" size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="your@email.com"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                editable={!isLoading}
              />
            </View>
          </View>
        </View>

        {/* Role Section */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="briefcase" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Role</Text>
          </View>

          <View style={styles.roleGrid}>
            {ROLES.map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleButton,
                  {
                    backgroundColor: selectedRole === role ? colors.primary : colors.background,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setSelectedRole(role)}
                disabled={isLoading}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    { color: selectedRole === role ? '#fff' : colors.text },
                  ]}
                >
                  {role}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Security Section */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="lock" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Security</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Password</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="lock-outline" size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="At least 6 characters"
                placeholderTextColor={colors.textSecondary}
                value={mdp}
                onChangeText={setMdp}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialCommunityIcons name={showPassword ? 'eye' : 'eye-off'} size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="lock-outline" size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Repeat password"
                placeholderTextColor={colors.textSecondary}
                value={confirmMdp}
                onChangeText={setConfirmMdp}
                secureTextEntry={!showConfirm}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                <MaterialCommunityIcons name={showConfirm ? 'eye' : 'eye-off'} size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Error Message */}
          {inlineError ? (
            <View style={[styles.errorBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' }]}>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#ef4444" />
              <Text style={[styles.errorText, { color: '#ef4444' }]}>{inlineError}</Text>
            </View>
          ) : null}
        </View>

        {/* Create Account Button */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Create Account</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginRow}>
          <Text style={{ color: colors.textSecondary }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={[styles.loginLink, { color: colors.primary }]}>Sign in</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xl },
  
  header: { marginBottom: Spacing.xl },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.6, marginBottom: Spacing.sm },
  subtitle: { fontSize: 14, fontWeight: '500' },
  
  brandContainer: { 
    borderRadius: BorderRadius.md, 
    borderWidth: 1, 
    padding: Spacing.lg, 
    marginBottom: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  brandIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  brandName: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  
  card: { 
    borderRadius: BorderRadius.md, 
    borderWidth: 1, 
    padding: Spacing.lg, 
    marginBottom: Spacing.xl,
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
    borderBottomWidth: 1,
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
  
  roleGrid: { 
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  roleButton: {
    flex: 1,
    minWidth: '48%',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleButtonText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2, textAlign: 'center' },
  
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  errorText: { fontSize: 13, fontWeight: '500', flex: 1 },
  
  primaryButton: { 
    borderRadius: BorderRadius.md, 
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.xs },
  loginLink: { fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
});

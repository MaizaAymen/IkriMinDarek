import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { ActivityIndicator } from '@ant-design/react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useMonochromeColors } from '@/components/ui/monochrome-provider';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { login, isLoading, error } = useAuth();
  const colors = useMonochromeColors();

  const inlineError = localError || error;

  const handleLogin = async () => {
    if (!email || !password) {
      setLocalError('Enter email and password to continue.');
      return;
    }

    if (!email.includes('@')) {
      setLocalError('Please provide a valid email address.');
      return;
    }

    setLocalError(null);

    try {
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setLocalError(err?.response?.data?.error || err?.message || 'Unable to sign in right now.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in to your account</Text>
        </View>

        {/* Logo/Brand */}
        <View style={[styles.brandContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.brandIcon, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="home-city" size={32} color="#fff" />
          </View>
          <Text style={[styles.brandName, { color: colors.text }]}>IkriMinDarek</Text>
        </View>

        {/* Form Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Email Field */}
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

          {/* Password Field */}
          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.text }]}>Password</Text>
              <TouchableOpacity onPress={() => router.push('/modal')}>
                <Text style={[styles.forgotLink, { color: colors.primary }]}>Forgot?</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="lock-outline" size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter your password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialCommunityIcons name={showPassword ? 'eye' : 'eye-off'} size={18} color={colors.textSecondary} />
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

        {/* Sign In Button */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialCommunityIcons name="login" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Sign In</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Signup Link */}
        <View style={styles.signupRow}>
          <Text style={{ color: colors.textSecondary }}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={[styles.signupLink, { color: colors.primary }]}>Create one</Text>
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
  
  formGroup: { marginBottom: Spacing.lg },
  label: { fontSize: 12, fontWeight: '600', marginBottom: Spacing.sm, letterSpacing: 0.3 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  forgotLink: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
  
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
  
  signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.xs },
  signupLink: { fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
});

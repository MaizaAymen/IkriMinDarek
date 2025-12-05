import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';

const ROLES = ['proprietaire', 'locataire', 'agent', 'admin'];

export default function RegisterScreen() {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [mdp, setMdp] = useState('');
  const [confirmMdp, setConfirmMdp] = useState('');
  const [selectedRole, setSelectedRole] = useState('locataire');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const { register, isLoading } = useAuth();

  const handleRegister = async () => {
    console.log('📝 handleRegister called');
    console.log('Form state:', { nom, prenom, email, mdp, selectedRole });

    // Validate
    if (!nom.trim() || !prenom.trim() || !email.trim() || !mdp.trim()) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Invalid email');
      return;
    }

    if (mdp.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (mdp !== confirmMdp) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      console.log('✅ Validation passed, calling register...');
      await register({
        nom,
        prenom,
        email,
        mdp,
        role: selectedRole as any,
      });
      console.log('✅ Registration successful!');
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      Alert.alert('Error', error.message || 'Registration failed');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join IkriMinDarek</Text>

            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your first name"
                value={nom}
                onChangeText={(text) => {
                  console.log('✏️ nom changed to:', text);
                  setNom(text);
                }}
                editable={!isLoading}
                placeholderTextColor="#999"
              />
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your last name"
                value={prenom}
                onChangeText={(text) => {
                  console.log('✏️ prenom changed to:', text);
                  setPrenom(text);
                }}
                editable={!isLoading}
                placeholderTextColor="#999"
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                value={email}
                onChangeText={(text) => {
                  console.log('✏️ email changed to:', text);
                  setEmail(text);
                }}
                keyboardType="email-address"
                editable={!isLoading}
                placeholderTextColor="#999"
              />
            </View>

            {/* Role */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Role *</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowRoleDropdown(!showRoleDropdown)}
                disabled={isLoading}
              >
                <Text style={styles.dropdownText}>{selectedRole}</Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
              {showRoleDropdown && (
                <View style={styles.dropdownMenu}>
                  {ROLES.map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedRole(role);
                        setShowRoleDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{role}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password *</Text>
              <View style={styles.passwordInput}>
                <TextInput
                  style={styles.passwordField}
                  placeholder="At least 6 characters"
                  secureTextEntry={!showPassword}
                  value={mdp}
                  onChangeText={(text) => {
                    console.log('✏️ mdp changed to:', text.length, 'chars');
                    setMdp(text);
                  }}
                  editable={!isLoading}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password *</Text>
              <View style={styles.passwordInput}>
                <TextInput
                  style={styles.passwordField}
                  placeholder="Confirm password"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmMdp}
                  onChangeText={(text) => {
                    console.log('✏️ confirmMdp changed to:', text.length, 'chars');
                    setConfirmMdp(text);
                  }}
                  editable={!isLoading}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginLink}>
              <Text style={styles.loginLinkText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/login')} disabled={isLoading}>
                <Text style={styles.loginLinkButton}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  passwordField: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  eyeIcon: {
    paddingRight: 12,
    fontSize: 18,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#999',
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 4,
    maxHeight: 150,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  registerButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  registerButtonDisabled: {
    backgroundColor: '#ccc',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    color: '#666',
  },
  loginLinkButton: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});

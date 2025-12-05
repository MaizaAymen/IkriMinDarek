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
  FlatList,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';

const ROLES = ['proprietaire', 'locataire', 'agent', 'admin'];
const GOUVERNORATS = [
  'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan',
  'Bizerte', 'Béja', 'Jendouba', 'Kef', 'Siliana', 'Sousse',
  'Monastir', 'Mahdia', 'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid',
  'Gabès', 'Médenine', 'Tataouine', 'Gafsa', 'Tozeur', 'Kebili'
];

export default function RegisterScreen() {
  console.log('🔴 [RegisterScreen] Component rendering!');
  
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [login, setLogin] = useState('');
  const [mdp, setMdp] = useState('');
  const [confirmMdp, setConfirmMdp] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [ville, setVille] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('locataire');
  const [selectedGouvernorat, setSelectedGouvernorat] = useState<string>('Tunis');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showGouvernoratDropdown, setShowGouvernoratDropdown] = useState(false);
  
  const { register, isLoading } = useAuth();
  
  console.log('🔴 [RegisterScreen] useAuth hook loaded - register fn:', typeof register);
  
  // Debug wrapper for setters
  const handleSetNom = (text: string) => {
    console.log('🔴 [RegisterScreen] setNom called with:', text);
    setNom(text);
  };
  
  const handleSetPrenom = (text: string) => {
    console.log('🔴 [RegisterScreen] setPrenom called with:', text);
    setPrenom(text);
  };
  
  const handleSetMdp = (text: string) => {
    console.log('🔴 [RegisterScreen] setMdp called with:', text);
    setMdp(text);
  };

  const validateForm = () => {
    console.log('🔴 [RegisterScreen] validateForm called with:');
    console.log(`   - nom: "${nom}" (${nom.trim() ? '✅' : '❌ EMPTY'})`);
    console.log(`   - prenom: "${prenom}" (${prenom.trim() ? '✅' : '❌ EMPTY'})`);
    console.log(`   - email: "${email}" (${email.includes('@') ? '✅' : '❌ INVALID'})`);
    console.log(`   - mdp length: ${mdp.length} (${mdp.length >= 6 ? '✅' : '❌ TOO SHORT'})`);
    console.log(`   - confirmMdp matches: ${mdp === confirmMdp ? '✅' : '❌ MISMATCH'}`);
    console.log(`   - selectedRole: "${selectedRole}" (${selectedRole ? '✅' : '❌ EMPTY'})`);
    
    if (!nom.trim()) {
      Alert.alert('Error', 'First name is required');
      return false;
    }
    if (!prenom.trim()) {
      Alert.alert('Error', 'Last name is required');
      return false;
    }
    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return false;
    }
    if (mdp.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return false;
    }
    if (mdp !== confirmMdp) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    if (!selectedRole) {
      Alert.alert('Error', 'Please select a role');
      return false;
    }
    console.log('🔴 [RegisterScreen] ✅ FORM VALIDATION PASSED!');
    return true;
  };

  const handleRegister = async () => {
    console.log('🔴 [RegisterScreen] handleRegister called!');
    
    if (!validateForm()) {
      console.log('🔴 [RegisterScreen] Form validation failed');
      return;
    }

    try {
      console.log('🔴 [RegisterScreen] 1. Starting registration process...');
      console.log('🔴 [RegisterScreen] Fields:');
      console.log(`   - nom: ${nom}`);
      console.log(`   - prenom: ${prenom}`);
      console.log(`   - email: ${email}`);
      console.log(`   - mdp: (${mdp.length} chars)`);
      console.log(`   - role: ${selectedRole}`);
      console.log(`   - gouvernorat: ${selectedGouvernorat}`);
      
      console.log('🔴 [RegisterScreen] 2. Calling register function from AuthContext...');
      await register({
        nom,
        prenom,
        email,
        login: login || email,
        mdp,
        role: selectedRole as any,
        phone: phone || undefined,
        bio: bio || undefined,
        ville: ville || undefined,
        gouvernorat: selectedGouvernorat || undefined,
      });

      console.log('🔴 [RegisterScreen] 3. ✅ Registration successful! Navigation should update automatically.');
      // The layout will automatically redirect to home when isSignedIn becomes true
      // No need to manually call router.push
    } catch (error: any) {
      console.error('🔴 [RegisterScreen] 4. ❌ Registration failed:', error);
      console.error('🔴 [RegisterScreen] Error type:', typeof error);
      console.error('🔴 [RegisterScreen] Error response:', error.response);
      console.error('🔴 [RegisterScreen] Error message:', error.message);
      
      const errorMessage = error.response?.data?.error || error.message || 'Please try again';
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      console.log('🔴 [RegisterScreen] 5. Registration process finished');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join IkriMinDarek today</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Names Row */}
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>First Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Aymen"
                    value={nom}
                    onChangeText={handleSetNom}
                    editable={!isLoading}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Last Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Maiza"
                    value={prenom}
                    onChangeText={handleSetPrenom}
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  editable={!isLoading}
                />
              </View>

              {/* Login (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Login (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="username"
                  value={login}
                  onChangeText={setLogin}
                  editable={!isLoading}
                />
              </View>

              {/* Role Selection */}
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

              {/* Gouvernorat */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Region (Gouvernorat)</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setShowGouvernoratDropdown(!showGouvernoratDropdown)}
                  disabled={isLoading}
                >
                  <Text style={styles.dropdownText}>{selectedGouvernorat}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
                {showGouvernoratDropdown && (
                  <View style={[styles.dropdownMenu, { maxHeight: 150 }]}>
                    <ScrollView>
                      {GOUVERNORATS.map((gov) => (
                        <TouchableOpacity
                          key={gov}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedGouvernorat(gov);
                            setShowGouvernoratDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{gov}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Phone & Ville Row */}
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Phone</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+216 ..."
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    editable={!isLoading}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>City</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Tunis"
                    value={ville}
                    onChangeText={setVille}
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Bio */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={3}
                  editable={!isLoading}
                />
              </View>

              {/* Passwords */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password *</Text>
                <View style={styles.passwordInput}>
                  <TextInput
                    style={styles.passwordField}
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    value={mdp}
                    onChangeText={handleSetMdp}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password *</Text>
                <View style={styles.passwordInput}>
                  <TextInput
                    style={styles.passwordField}
                    placeholder="••••••••"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmMdp}
                    onChangeText={setConfirmMdp}
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
                onPress={() => {
                  console.log('🔴 [RegisterScreen] BUTTON PRESSED! isLoading:', isLoading);
                  handleRegister();
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.registerButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              {/* DEBUG Button - Test if buttons work at all */}
              <TouchableOpacity
                style={[styles.registerButton, { backgroundColor: '#FF6B6B', marginTop: 10 }]}
                onPress={() => {
                  Alert.alert('TEST', `Register function exists: ${typeof register === 'function'}\nLoading: ${isLoading}\nEmail: ${email}`);
                }}
              >
                <Text style={styles.registerButtonText}>🧪 TEST BUTTON</Text>
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.loginLink}>
                <Text style={styles.loginLinkText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/login')} disabled={isLoading}>
                  <Text style={styles.loginLinkButton}>Sign In</Text>
                </TouchableOpacity>
              </View>
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
  header: {
    marginBottom: 30,
    marginTop: 10,
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
  },
  form: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  bioInput: {
    textAlignVertical: 'top',
    paddingVertical: 12,
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  passwordField: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  eyeIcon: {
    fontSize: 16,
    padding: 4,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#999',
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  registerButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginLinkText: {
    fontSize: 14,
    color: '#666',
  },
  loginLinkButton: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  Platform,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '@/context/AuthContext';
import { propertiesAPI } from '@/services/api';
import { router } from 'expo-router';
import { useMonochromeColors } from '@/components/ui/monochrome-provider';
import { ScreenWithHeader } from '@/components/ui/drawer-provider';
import { Spacing, BorderRadius, Shades } from '@/constants/theme';
import MapLocationPicker from '@/components/MapLocationPicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PROPERTY_TYPES = ['appartement', 'villa', 'studio', 'duplex', 'penthouse', 'maison_traditionnelle', 'terrain'];
const GOUVERNORATS = [
  'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan',
  'Bizerte', 'Béja', 'Jendouba', 'Kef', 'Siliana', 'Sousse',
  'Monastir', 'Mahdia', 'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid',
  'Gabès', 'Médenine', 'Tataouine', 'Gafsa', 'Tozeur', 'Kebili'
];

const STEPS = [
  { id: 1, title: 'Basic Info', icon: 'information' },
  { id: 2, title: 'Details', icon: 'details' },
  { id: 3, title: 'Location', icon: 'map-marker' },
  { id: 4, title: 'Images', icon: 'image-multiple' },
  { id: 5, title: 'Amenities', icon: 'home-variant' },
];

export default function PostPropertyScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const colors = useMonochromeColors();
  const [currentStep, setCurrentStep] = useState(1);
  const [slideAnim] = useState(new Animated.Value(0));
  
  // Basic Info
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [typePropiete, setTypePropiete] = useState('appartement');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  // Pricing and Details
  const [prixMensuel, setPrixMensuel] = useState('');
  const [surface, setSurface] = useState('');
  const [nombreChambres, setNombreChambres] = useState('');
  const [nombreSallesBain, setNombreSallesBain] = useState('');
  const [meuble, setMeuble] = useState(false);

  // Location
  const [adresse, setAdresse] = useState('');
  const [ville, setVille] = useState('');
  const [gouvernorat, setGouvernorat] = useState('Tunis');
  const [showGouvernoratDropdown, setShowGouvernoratDropdown] = useState(false);
  const [codePostal, setCodePostal] = useState('');
  const [latitude, setLatitude] = useState(36.8065);
  const [longitude, setLongitude] = useState(10.1815);
  const [locationAddress, setLocationAddress] = useState('');

  // Amenities
  const [climatisation, setClimatisation] = useState(false);
  const [chauffage, setChauffage] = useState(false);
  const [balcon, setBalcon] = useState(false);
  const [internet, setInternet] = useState(false);
  const [parking, setParking] = useState(false);
  const [piscine, setPiscine] = useState(false);

  // Images
  const [images, setImages] = useState<any[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step validation
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Basic Info
        if (!titre.trim()) { Alert.alert('Required', 'Please enter property title'); return false; }
        if (!description.trim()) { Alert.alert('Required', 'Please enter property description'); return false; }
        return true;
      case 2: // Details
        if (!prixMensuel || isNaN(parseFloat(prixMensuel))) { Alert.alert('Invalid', 'Please enter valid monthly price'); return false; }
        if (!surface || isNaN(parseInt(surface))) { Alert.alert('Invalid', 'Please enter valid surface'); return false; }
        if (!nombreChambres || isNaN(parseInt(nombreChambres))) { Alert.alert('Invalid', 'Please enter number of bedrooms'); return false; }
        if (!nombreSallesBain || isNaN(parseInt(nombreSallesBain))) { Alert.alert('Invalid', 'Please enter number of bathrooms'); return false; }
        return true;
      case 3: // Location
        if (!adresse.trim()) { Alert.alert('Required', 'Please enter address'); return false; }
        if (!ville.trim()) { Alert.alert('Required', 'Please enter city'); return false; }
        if (latitude === 0 || longitude === 0) { Alert.alert('Required', 'Please select property location on map'); return false; }
        return true;
      case 4: // Images
        if (images.length === 0) { Alert.alert('Required', 'Please add at least one image'); return false; }
        return true;
      case 5: // Amenities - no validation needed
        return true;
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        animateStepChange();
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      animateStepChange();
      setCurrentStep(currentStep - 1);
    }
  };

  const animateStepChange = () => {
    slideAnim.setValue(0);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleLocationSelect = (location: { latitude: number; longitude: number; address?: string }) => {
    console.log('📍 Location selected from map:', {
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address
    });
    setLatitude(location.latitude);
    setLongitude(location.longitude);
    if (location.address) {
      setLocationAddress(location.address);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        console.log('📸 Images selected:', result.assets.length);
        setImages(prev => [...prev, ...result.assets]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    console.log('📝 Submitting property with location:', {
      latitude,
      longitude,
      adresse,
      ville
    });

    try {
      setIsSubmitting(true);
      console.log('🚀 ========== PROPERTY SUBMISSION STARTED ==========');
      console.log(`📱 Platform: ${Platform.OS}`);
      console.log(`📸 Selected images: ${images.length}`);
      
      // Prepare request data with base64 images
      const requestData: any = {
        titre,
        description,
        type_propriete: typePropiete,
        prix_mensuel: parseFloat(prixMensuel),
        surface: parseInt(surface),
        nombre_chambres: parseInt(nombreChambres),
        nombre_salles_bain: parseInt(nombreSallesBain),
        meuble,
        adresse,
        ville,
        gouvernorat,
        code_postal: codePostal,
        latitude,
        longitude,
        climatisation,
        chauffage,
        balcon,
        internet,
        parking,
        piscine,
        proprietaire_id: user?.id || '',
        images: [] as any,
      };
      
      console.log('✅ Request data prepared');

      // Add images as base64
      if (images.length > 0) {
        console.log(`📷 Processing ${images.length} images...`);
        
        for (let index = 0; index < images.length; index++) {
          const image = images[index];
          
          console.log(`   [${index + 1}] Processing...`);
          
          try {
            let base64Data = image.base64;
            
            if (!base64Data) {
              console.log(`       Reading base64 from file...`);
              base64Data = await FileSystem.readAsStringAsync(image.uri, {
                encoding: 'base64' as any,
              });
              console.log(`       ✅ Read successfully`);
            } else {
              console.log(`       ✅ Base64 from picker`);
            }
            
            // Determine correct MIME type and extension
            let mimeType = image.type || 'image/jpeg';
            let extension = 'jpg';
            
            if (mimeType.includes('png')) {
              extension = 'png';
            } else if (mimeType.includes('webp')) {
              extension = 'webp';
            } else if (mimeType.includes('gif')) {
              extension = 'gif';
            } else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
              extension = 'jpg';
              mimeType = 'image/jpeg';
            } else {
              mimeType = 'image/jpeg';
              extension = 'jpg';
            }
            
            requestData.images.push({
              data: base64Data,
              type: mimeType,
              name: `property_image_${Date.now()}_${index}.${extension}`,
            });
            
            console.log(`   [${index + 1}] ✅ Added to request`);
          } catch (error) {
            console.error(`   [${index + 1}] ❌ Error:`, error);
          }
        }
        console.log(`✅ All ${images.length} images prepared`);
      }
      
      console.log('🚀 ========== CALLING API.CREATE() ==========');
      const response = await propertiesAPI.create(requestData);
      console.log('✅ API Response received');
      console.log('🏁 ========== PROPERTY SUBMISSION COMPLETE ==========\n');
      
      // Reset form immediately
      setTitre('');
      setDescription('');
      setTypePropiete('appartement');
      setPrixMensuel('');
      setSurface('');
      setNombreChambres('');
      setNombreSallesBain('');
      setMeuble(false);
      setAdresse('');
      setVille('');
      setGouvernorat('Tunis');
      setCodePostal('');
      setLatitude(36.8065);
      setLongitude(10.1815);
      setLocationAddress('');
      setClimatisation(false);
      setChauffage(false);
      setBalcon(false);
      setInternet(false);
      setParking(false);
      setPiscine(false);
      setImages([]);
      setCurrentStep(1);
      
      // Show success notification and redirect user to explore screen immediately
      Alert.alert('Property Submitted! 🎉', 'The admin will approve it soon');
      console.log('🚀 Navigating to explore...');
      router.replace('/(tabs)/explore');
    } catch (error: any) {
      console.error('❌ Error posting property:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to post property';
      Alert.alert('Error', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenWithHeader title="Post Property" showBackButton>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Progress Indicator */}
        <View style={[styles.progressContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.progressSteps}>
            {STEPS.map((step) => (
              <View key={step.id} style={styles.progressStepWrapper}>
                <TouchableOpacity
                  style={[
                    styles.progressStep,
                    {
                      backgroundColor: currentStep >= step.id ? '#2563eb' : colors.border,
                      borderColor: currentStep === step.id ? '#1e40af' : colors.border,
                    },
                  ]}
                  onPress={() => currentStep > step.id && setCurrentStep(step.id)}
                  disabled={currentStep <= step.id}
                >
                  {currentStep > step.id ? (
                    <MaterialCommunityIcons name="check" size={16} color="#fff" />
                  ) : (
                    <Text style={styles.progressStepText}>{step.id}</Text>
                  )}
                </TouchableOpacity>
                <Text style={[styles.stepLabel, { color: currentStep === step.id ? '#2563eb' : colors.textSecondary, fontSize: 11 }]}>
                  {step.title}
                </Text>
              </View>
            ))}
          </View>
          
          {/* Progress Bar */}
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%`,
                  backgroundColor: '#2563eb',
                },
              ]}
            />
          </View>
        </View>

        {/* Step Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.stepContainer,
              {
                opacity: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              },
            ]}
          >
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}
          </Animated.View>
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonSecondary, { opacity: currentStep === 1 ? 0.5 : 1 }]}
            onPress={handlePrevStep}
            disabled={currentStep === 1}
          >
            <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
            <Text style={[styles.navButtonText, { color: colors.text }]}>Back</Text>
          </TouchableOpacity>

          <Text style={[styles.stepIndicator, { color: colors.textSecondary }]}>
            Step {currentStep} of {STEPS.length}
          </Text>

          <TouchableOpacity
            style={[
              styles.navButton,
              styles.navButtonPrimary,
              { opacity: isSubmitting ? 0.7 : 1 },
            ]}
            onPress={handleNextStep}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.navButtonText}>
                  {currentStep === STEPS.length ? 'Submit' : 'Next'}
                </Text>
                {currentStep < STEPS.length && (
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
                )}
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWithHeader>
  );

  // Step Components
  function renderStep1() {
    return (
      <View style={[styles.stepContent, { paddingHorizontal: Spacing.lg }]}>
        <View style={styles.stepHeader}>
          <MaterialCommunityIcons name="information" size={32} color="#2563eb" />
          <Text style={[styles.stepTitle, { color: colors.text }]}>Basic Information</Text>
          <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
            Tell us about your property
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Property Title *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="e.g., Modern 2-bedroom apartment"
            value={titre}
            onChangeText={setTitre}
            editable={!isSubmitting}
            placeholderTextColor={colors.textSecondary}
            maxLength={100}
          />
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            {titre.length}/100
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="Describe your property, amenities, and any special features..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            editable={!isSubmitting}
            placeholderTextColor={colors.textSecondary}
            maxLength={500}
          />
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            {description.length}/500
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Property Type *</Text>
          <TouchableOpacity
            style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowTypeDropdown(!showTypeDropdown)}
            disabled={isSubmitting}
          >
            <MaterialCommunityIcons name="home-city" size={20} color="#2563eb" style={{ marginRight: Spacing.sm }} />
            <Text style={[styles.dropdownText, { color: colors.text }]}>{typePropiete}</Text>
            <MaterialCommunityIcons name={showTypeDropdown ? "chevron-up" : "chevron-down"} size={20} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          {showTypeDropdown && (
            <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {PROPERTY_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.dropdownItem, { borderBottomColor: colors.border, backgroundColor: typePropiete === type ? 'rgba(37, 99, 235, 0.1)' : colors.surface }]}
                  onPress={() => {
                    setTypePropiete(type);
                    setShowTypeDropdown(false);
                  }}
                >
                  <Text style={[styles.dropdownItemText, { color: colors.text, fontWeight: typePropiete === type ? '600' : '400' }]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  }

  function renderStep2() {
    return (
      <View style={[styles.stepContent, { paddingHorizontal: Spacing.lg }]}>
        <View style={styles.stepHeader}>
          <MaterialCommunityIcons name="details" size={32} color="#2563eb" />
          <Text style={[styles.stepTitle, { color: colors.text }]}>Details & Specifications</Text>
          <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
            Property pricing and features
          </Text>
        </View>

        <View style={styles.row}>
          <View style={[styles.halfInput, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Monthly Price (TND) *</Text>
            <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
              <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: '600' }}>TND</Text>
              <TextInput
                style={[styles.inputInline, { color: colors.text }]}
                placeholder="500"
                value={prixMensuel}
                onChangeText={setPrixMensuel}
                keyboardType="decimal-pad"
                editable={!isSubmitting}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
          <View style={[styles.halfInput, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Surface (m²) *</Text>
            <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
              <TextInput
                style={[styles.inputInline, { color: colors.text }]}
                placeholder="100"
                value={surface}
                onChangeText={setSurface}
                keyboardType="number-pad"
                editable={!isSubmitting}
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '500' }}>m²</Text>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.halfInput, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Bedrooms *</Text>
            <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
              <MaterialCommunityIcons name="bed" size={20} color="#2563eb" style={{ marginRight: Spacing.sm }} />
              <TextInput
                style={[styles.inputInline, { color: colors.text }]}
                placeholder="2"
                value={nombreChambres}
                onChangeText={setNombreChambres}
                keyboardType="number-pad"
                editable={!isSubmitting}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
          <View style={[styles.halfInput, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Bathrooms *</Text>
            <View style={[styles.inputWrapper, { borderColor: colors.border }]}>
              <MaterialCommunityIcons name="shower" size={20} color="#2563eb" style={{ marginRight: Spacing.sm }} />
              <TextInput
                style={[styles.inputInline, { color: colors.text }]}
                placeholder="1"
                value={nombreSallesBain}
                onChangeText={setNombreSallesBain}
                keyboardType="number-pad"
                editable={!isSubmitting}
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
        </View>

        <View style={[styles.switchGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.switchLabel}>
            <MaterialCommunityIcons name="sofa" size={20} color="#2563eb" style={{ marginRight: Spacing.sm }} />
            <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>Furnished</Text>
          </View>
          <Switch
            value={meuble}
            onValueChange={setMeuble}
            disabled={isSubmitting}
            trackColor={{ false: '#ccc', true: '#81c784' }}
          />
        </View>
      </View>
    );
  }

  function renderStep3() {
    return (
      <View style={[styles.stepContent, { paddingHorizontal: Spacing.lg }]}>
        <View style={styles.stepHeader}>
          <MaterialCommunityIcons name="map-marker" size={32} color="#2563eb" />
          <Text style={[styles.stepTitle, { color: colors.text }]}>Location</Text>
          <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
            Pin your property on the map
          </Text>
        </View>

        <MapLocationPicker
          onLocationSelect={handleLocationSelect}
          initialLocation={
            latitude && longitude
              ? { latitude, longitude, address: locationAddress }
              : undefined
          }
          colors={colors}
        />

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Address *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="123 Main Street"
            value={adresse}
            onChangeText={setAdresse}
            editable={!isSubmitting}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>City *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="Tunis"
            value={ville}
            onChangeText={setVille}
            editable={!isSubmitting}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.halfInput, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Gouvernorat</Text>
            <TouchableOpacity
              style={[styles.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowGouvernoratDropdown(!showGouvernoratDropdown)}
              disabled={isSubmitting}
            >
              <MaterialCommunityIcons name="map-outline" size={20} color="#2563eb" style={{ marginRight: Spacing.sm }} />
              <Text style={[styles.dropdownText, { color: colors.text }]}>{gouvernorat}</Text>
              <MaterialCommunityIcons name={showGouvernoratDropdown ? "chevron-up" : "chevron-down"} size={20} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
            {showGouvernoratDropdown && (
              <View style={[styles.dropdownMenu, { backgroundColor: colors.surface, borderColor: colors.border, maxHeight: 200 }]}>
                <ScrollView nestedScrollEnabled>
                  {GOUVERNORATS.map((gov) => (
                    <TouchableOpacity
                      key={gov}
                      style={[styles.dropdownItem, { borderBottomColor: colors.border, backgroundColor: gouvernorat === gov ? 'rgba(37, 99, 235, 0.1)' : colors.surface }]}
                      onPress={() => {
                        setGouvernorat(gov);
                        setShowGouvernoratDropdown(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, { color: colors.text, fontWeight: gouvernorat === gov ? '600' : '400' }]}>
                        {gov}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
          <View style={[styles.halfInput, { flex: 1 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Postal Code</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="1000"
              value={codePostal}
              onChangeText={setCodePostal}
              editable={!isSubmitting}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>
      </View>
    );
  }

  function renderStep4() {
    return (
      <View style={[styles.stepContent, { paddingHorizontal: Spacing.lg }]}>
        <View style={styles.stepHeader}>
          <MaterialCommunityIcons name="image-multiple" size={32} color="#2563eb" />
          <Text style={[styles.stepTitle, { color: colors.text }]}>Property Images</Text>
          <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
            Add high-quality photos of your property
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.imageDragZone, { borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.05)' }]}
          onPress={pickImage}
          disabled={isSubmitting}
        >
          <MaterialCommunityIcons name="cloud-upload-outline" size={48} color="#2563eb" />
          <Text style={[styles.imageDragText, { color: colors.text }]}>
            {images.length > 0 ? 'Add More Images' : 'Select Images'}
          </Text>
          <Text style={[styles.imageDragSubtext, { color: colors.textSecondary }]}>
            Minimum 1 image required
          </Text>
        </TouchableOpacity>

        {images.length > 0 && (
          <View style={styles.imagesGallery}>
            <View style={styles.imagesHeader}>
              <Text style={[styles.imagesCountText, { color: colors.text }]}>
                📸 {images.length} image{images.length !== 1 ? 's' : ''} selected
              </Text>
              {images.length > 1 && (
                <Text style={[styles.imagesToReorderText, { color: colors.textSecondary }]}>
                  First image will be thumbnail
                </Text>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
              {images.map((image, index) => (
                <View key={index} style={[styles.imagePreviewContainer, { borderColor: index === 0 ? '#2563eb' : colors.border }]}>
                  {index === 0 && (
                    <View style={styles.thumbnailBadge}>
                      <Text style={styles.thumbnailBadgeText}>Thumbnail</Text>
                    </View>
                  )}
                  <Image
                    source={{ uri: image.uri }}
                    style={styles.imagePreview}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <MaterialCommunityIcons name="close" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  }

  function renderStep5() {
    return (
      <View style={[styles.stepContent, { paddingHorizontal: Spacing.lg }]}>
        <View style={styles.stepHeader}>
          <MaterialCommunityIcons name="home-variant" size={32} color="#2563eb" />
          <Text style={[styles.stepTitle, { color: colors.text }]}>Amenities</Text>
          <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
            Highlight special features
          </Text>
        </View>

        <View style={styles.amenitiesGrid}>
          {[
            { state: climatisation, setState: setClimatisation, icon: 'air-conditioner', label: 'Air Conditioning' },
            { state: chauffage, setState: setChauffage, icon: 'radiator', label: 'Heating' },
            { state: balcon, setState: setBalcon, icon: 'balcony', label: 'Balcony' },
            { state: internet, setState: setInternet, icon: 'wifi', label: 'Internet' },
            { state: parking, setState: setParking, icon: 'parking', label: 'Parking' },
            { state: piscine, setState: setPiscine, icon: 'swim', label: 'Swimming Pool' },
          ].map((amenity, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.amenityCard,
                {
                  backgroundColor: amenity.state ? 'rgba(37, 99, 235, 0.15)' : colors.surface,
                  borderColor: amenity.state ? '#2563eb' : colors.border,
                },
              ]}
              onPress={() => amenity.setState(!amenity.state)}
            >
              <MaterialCommunityIcons
                name={amenity.icon as any}
                size={28}
                color={amenity.state ? '#2563eb' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.amenityLabel,
                  {
                    color: amenity.state ? '#2563eb' : colors.text,
                    fontWeight: amenity.state ? '600' : '500',
                  },
                ]}
              >
                {amenity.label}
              </Text>
              {amenity.state && (
                <MaterialCommunityIcons name="check-circle" size={20} color="#2563eb" style={styles.amenityCheck} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="information-outline" size={24} color="#2563eb" />
          <View style={styles.reviewCardContent}>
            <Text style={[styles.reviewCardTitle, { color: colors.text }]}>Ready to submit?</Text>
            <Text style={[styles.reviewCardText, { color: colors.textSecondary }]}>
              Review all your information before submitting. Your property will be pending admin approval.
            </Text>
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  // ===== PROGRESS & NAVIGATION =====
  progressContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  progressStepWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  progressStep: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  progressStepText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.xs,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 90,
    justifyContent: 'center',
  },
  navButtonSecondary: {
    borderWidth: 1.5,
    borderColor: '#ccc',
  },
  navButtonPrimary: {
    backgroundColor: '#2563eb',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepIndicator: {
    fontSize: 13,
    fontWeight: '500',
  },

  // ===== STEP CONTENT =====
  scrollContent: {
    flexGrow: 1,
    paddingVertical: Spacing.lg,
  },
  stepContainer: {
    minHeight: 400,
  },
  stepContent: {
    paddingVertical: Spacing.lg,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: Spacing.sm,
  },

  // ===== INPUTS & FORMS =====
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  input: {
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 15,
    fontWeight: '500',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  inputInline: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },

  // ===== DROPDOWNS =====
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  dropdownMenu: {
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    marginTop: Spacing.sm,
    maxHeight: 200,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 15,
  },

  // ===== SWITCHES =====
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  // ===== IMAGE HANDLING =====
  imageDragZone: {
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  imageDragText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
  imageDragSubtext: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: Spacing.xs,
  },
  imagesGallery: {
    marginBottom: Spacing.lg,
  },
  imagesHeader: {
    marginBottom: Spacing.md,
  },
  imagesCountText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  imagesToReorderText: {
    fontSize: 12,
    fontWeight: '400',
  },
  imagesScroll: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginRight: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.lg,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(37, 99, 235, 0.9)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderBottomRightRadius: BorderRadius.md,
  },
  thumbnailBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },

  // ===== AMENITIES GRID =====
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  amenityCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenityLabel: {
    fontSize: 13,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  amenityCheck: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },

  // ===== REVIEW CARD =====
  reviewCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  reviewCardContent: {
    flex: 1,
  },
  reviewCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  reviewCardText: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
  },

  // ===== GRID & LAYOUT =====
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  halfInput: {
    flex: 1,
  },
});


import React, { useState, useEffect } from 'react';
import { Platform, ActionSheetIOS, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  SafeAreaView,
  Modal,
  Image
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Save, Plus, X, User, Palette, Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Heart, Briefcase, House } from 'lucide-react-native';
import { Camera, Image as ImageIcon } from 'lucide-react-native';
import { DatabaseService } from '../../../services/DatabaseService';
import { useTheme } from '@/context/ThemeContext';

const TAG_COLORS = [
  { name: 'Blue', light: '#DBEAFE', dark: '#1E3A8A', text: '#1E40AF' },
  { name: 'Green', light: '#D1FAE5', dark: '#064E3B', text: '#059669' },
  { name: 'Purple', light: '#E9D5FF', dark: '#581C87', text: '#7C3AED' },
  { name: 'Red', light: '#FEE2E2', dark: '#7F1D1D', text: '#DC2626' },
  { name: 'Yellow', light: '#FEF3C7', dark: '#78350F', text: '#D97706' },
  { name: 'Pink', light: '#FCE7F3', dark: '#831843', text: '#EC4899' },
  { name: 'Gray', light: '#F3F4F6', dark: '#374151', text: '#6B7280' },
];

const RELATIONSHIP_OPTIONS = [
  { key: 'family', label: 'Family', color: '#EF4444', icon: 'Heart' },
  { key: 'friend', label: 'Friend', color: '#3B82F6', icon: 'User' },
  { key: 'coworker', label: 'Coworker', color: '#059669', icon: 'Briefcase' },
  { key: 'partner', label: 'Partner', color: '#EC4899', icon: 'Heart' },
  { key: 'neighbor', label: 'Neighbor', color: '#8B5CF6', icon: 'House' },
  { key: 'acquaintance', label: 'Acquaintance', color: '#6B7280', icon: 'User' }
];

export default function EditProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDark } = useTheme();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [selectedTagColor, setSelectedTagColor] = useState(TAG_COLORS[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColorName, setCustomColorName] = useState('');
  const [customColorLight, setCustomColorLight] = useState('#E5E7EB');
  const [customColorDark, setCustomColorDark] = useState('#374151');
  const [customColorText, setCustomColorText] = useState('#6B7280');
  const [showCustomColorForm, setShowCustomColorForm] = useState(false);
  const [showLastContactCalendar, setShowLastContactCalendar] = useState(false);
  const [lastContactCalendarDate, setLastContactCalendarDate] = useState(new Date());
  const [selectedImage, setSelectedImage] = useState(null);

  const theme = {
    text: '#f0f0f0',
    background: isDark ? '#0B0909' : '#003C24',
    primary: isDark ? '#8C8C8C' : '#8C8C8C',
    secondary: isDark ? '#4A5568' : '#012d1c',
    accent: isDark ? '#44444C' : '#f0f0f0',
    cardBackground: isDark ? '#1A1A1A' : '#002818',
    border: isDark ? '#333333' : '#012d1c',
    inputText: isDark ? '#f0f0f0' : '#003C24',
    isDark,
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  const loadProfile = async () => {
    try {
      if (id) {
        const profileData = await DatabaseService.getProfileById(parseInt(id));
        if (profileData) {
          setProfile({
            ...profileData,
            tags: profileData.tags || [],
            interests: profileData.interests || [],
            pets: profileData.pets || [],
            // Initialize text fields for editing
            parentsText: profileData.parents ? profileData.parents.join(', ') : '',
            kidsText: profileData.kids ? profileData.kids.join(', ') : '',
            brothersText: profileData.brothers ? profileData.brothers.join(', ') : '',
            sistersText: profileData.sisters ? profileData.sisters.join(', ') : '',
            siblingsText: profileData.siblings ? profileData.siblings.join(', ') : '',
            likesText: profileData.likes ? profileData.likes.join(', ') : '',
            dislikesText: profileData.dislikes ? profileData.dislikes.join(', ') : '',
            interestsText: profileData.interests ? profileData.interests.join(', ') : '',
          });
          
          // Set selected image if profile has a photo
          if (profileData.photoUri) {
            setSelectedImage({ uri: profileData.photoUri });
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile?.name?.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setSaving(true);
    try {
      await DatabaseService.createOrUpdateProfile(profile);
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    
    const tag = {
      text: newTag.trim(),
      color: selectedTagColor,
    };
    
    setProfile(prev => ({
      ...prev,
      tags: [...(prev.tags || []), tag]
    }));
    
    setNewTag('');
  };

  const addCustomColor = () => {
    if (!customColorName.trim()) return;
    
    const customColor = {
      name: customColorName.trim(),
      light: customColorLight,
      dark: customColorDark,
      text: customColorText,
    };
    
    // Add to available colors (temporarily for this session)
    TAG_COLORS.push(customColor);
    setSelectedTagColor(customColor);
    
    // Reset form
    setCustomColorName('');
    setCustomColorLight('#E5E7EB');
    setCustomColorDark('#374151');
    setCustomColorText('#6B7280');
    setShowCustomColorForm(false);
    setShowColorPicker(false);
  };

  const navigateLastContactMonth = (direction: number) => {
    const newDate = new Date(lastContactCalendarDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setLastContactCalendarDate(newDate);
  };

  const handleAddPhoto = async () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Choose from Library', 'Take Photo', 'Cancel'],
          cancelButtonIndex: 2,
        },
        async (buttonIndex) => {
          try {
            if (buttonIndex === 0) {
              const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (perm.status !== 'granted') {
                Alert.alert('Permission needed', 'Enable Photos in Settings to add a picture.');
                return;
              }
              setTimeout(async () => {
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [1, 1],
                  quality: 0.8,
                });
                if (!result.canceled && result.assets?.[0]) {
                  const asset = result.assets[0];
                  // existing state updates for EDIT screen:
                  setSelectedImage(asset);
                  updateField('photoUri', asset.uri);
                }
              }, 50);
            } else if (buttonIndex === 1) {
              const perm = await ImagePicker.requestCameraPermissionsAsync();
              if (perm.status !== 'granted') {
                Alert.alert('Permission needed', 'Enable Camera in Settings to take a picture.');
                return;
              }
              setTimeout(async () => {
                const result = await ImagePicker.launchCameraAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [1, 1],
                  quality: 0.8,
                });
                if (!result.canceled && result.assets?.[0]) {
                  const asset = result.assets[0];
                  // existing state updates for EDIT screen:
                  setSelectedImage(asset);
                  updateField('photoUri', asset.uri);
                }
              }, 50);
            }
          } catch (e: any) {
            console.error('Picker error:', e);
            Alert.alert('Error', 'Failed to open picker. Try again.');
          }
        }
      );
    } else {
      Alert.alert('Add Photo', 'Choose an option:', [
        {
          text: 'Choose from Library',
          onPress: async () => {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (perm.status !== 'granted') {
              Alert.alert('Permission needed', 'Enable Photos in Settings to add a picture.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets?.[0]) {
              const asset = result.assets[0];
              setSelectedImage(asset);
              updateField('photoUri', asset.uri);
            }
          },
        },
        {
          text: 'Take Photo',
          onPress: async () => {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (perm.status !== 'granted') {
              Alert.alert('Permission needed', 'Enable Camera in Settings to take a picture.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets?.[0]) {
              const asset = result.assets[0];
              setSelectedImage(asset);
              updateField('photoUri', asset.uri);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedImage(null);
    updateField('photoUri', null);
  };

  const generateLastContactCalendarDays = () => {
    const year = lastContactCalendarDate.getFullYear();
    const month = lastContactCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const selectLastContactDate = (date: Date) => {
    updateField('lastContactDate', date.toISOString());
    setShowLastContactCalendar(false);
  };

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const removeTag = (index) => {
    setProfile(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const updateField = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.primary }]}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.primary }]}>Profile not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: theme.secondary }]} 
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>SAVE</Text>
        </TouchableOpacity>
      </View>

      <>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Info */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Basic Information</Text>
          
          {/* Profile Photo */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.primary }]}>Profile Photo</Text>
            <View style={styles.photoContainer}>
              {selectedImage ? (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: selectedImage.uri }} style={styles.profilePhoto} />
                  <TouchableOpacity
                    style={[styles.removePhotoButton, { backgroundColor: '#EF4444' }]}
                    onPress={handleRemovePhoto}
                  >
                    <X size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.replacePhotoButton, { backgroundColor: isDark ? theme.secondary : '#015A3A' }]}
                    onPress={handleAddPhoto}
                  >
                    <Camera size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.addPhotoButton, { backgroundColor: theme.accent, borderColor: theme.border }]}
                  onPress={handleAddPhoto}
                >
                  <Camera size={24} color={theme.primary} />
                  <Text style={[styles.addPhotoText, { color: theme.text }]}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.primary }]}>Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.inputText, borderColor: theme.border }]}
              value={profile.name || ''}
              onChangeText={(text) => updateField('name', text)}
              placeholder="Enter name"
              placeholderTextColor={theme.primary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.primary }]}>Age</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.inputText, borderColor: theme.border }]}
              value={profile.age?.toString() || ''}
              onChangeText={(text) => updateField('age', text ? parseInt(text) || null : null)}
              placeholder="Enter age"
              placeholderTextColor={theme.primary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.primary }]}>Relationship</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.relationshipOptions}>
              {RELATIONSHIP_OPTIONS.map((option) => {
                return (
                  <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.relationshipOption,
                    { 
                      backgroundColor: profile.relationship === option.key ? option.color : (isDark ? '#374151' : '#E5E7EB'),
                      borderColor: theme.border 
                    }
                  ]}
                  onPress={() => updateField('relationship', option.key)}
                >
                  {(() => {
                    const IconComponent = option.icon === 'Heart' ? Heart :
                                        option.icon === 'Briefcase' ? Briefcase :
                                        option.icon === 'House' ? House : User;
                    return <IconComponent size={16} color={profile.relationship === option.key ? '#FFFFFF' : (isDark ? theme.text : '#374151')} />;
                  })()}
                  <Text style={[
                    styles.relationshipOptionText,
                    { color: profile.relationship === option.key ? '#FFFFFF' : (isDark ? theme.text : '#374151') }
                  ]}>
                    {option.label}
                  </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.primary }]}>Job</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.inputText, borderColor: theme.border }]}
              value={profile.job || ''}
              onChangeText={(text) => updateField('job', text)}
              placeholder="Enter job/occupation"
              placeholderTextColor={theme.primary}
            />
          </View>
        </View>

        {/* Contact Info */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.primary }]}>Phone</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.inputText, borderColor: theme.border }]}
              value={profile.phone || ''}
              onChangeText={(text) => updateField('phone', text)}
              placeholder="Enter phone number"
              placeholderTextColor={theme.primary}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.primary }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.inputText, borderColor: theme.border }]}
              value={profile.email || ''}
              onChangeText={(text) => updateField('email', text)}
              placeholder="Enter email address"
              placeholderTextColor={theme.primary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Family Information */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Family</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.primary }]}>Parents</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.inputText, borderColor: theme.border }]}
              value={profile.parentsText || ''}
              onChangeText={(text) => {
                updateField('parentsText', text);
                updateField('parents', text ? text.split(',').map(p => p.trim()).filter(p => p) : []);
              }}
              placeholder="e.g. John Smith, Mary Smith"
              placeholderTextColor={theme.primary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.primary }]}>Children</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.inputText, borderColor: theme.border }]}
              value={profile.kidsText || ''}
              onChangeText={(text) => {
                updateField('kidsText', text);
                updateField('kids', text ? text.split(',').map(k => k.trim()).filter(k => k) : []);
              }}
              placeholder="e.g. Emma, Liam, Sophia"
              placeholderTextColor={theme.primary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.primary }]}>Brothers</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.inputText, borderColor: theme.border }]}
              value={profile.brothersText || ''}
              onChangeText={(text) => {
                updateField('brothersText', text);
                updateField('brothers', text ? text.split(',').map(b => b.trim()).filter(b => b) : []);
              }}
              placeholder="e.g. Michael, David"
              placeholderTextColor={theme.primary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.primary }]}>Sisters</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.inputText, borderColor: theme.border }]}
              value={profile.sistersText || ''}
              onChangeText={(text) => {
                updateField('sistersText', text);
                updateField('sisters', text ? text.split(',').map(s => s.trim()).filter(s => s) : []);
              }}
              placeholder="e.g. Sarah, Jessica"
              placeholderTextColor={theme.primary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.primary }]}>Other Siblings</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.inputText, borderColor: theme.border }]}
              value={profile.siblingsText || ''}
              onChangeText={(text) => {
                updateField('siblingsText', text);
                updateField('siblings', text ? text.split(',').map(s => s.trim()).filter(s => s) : []);
              }}
              placeholder="e.g. Alex, Jordan (step-siblings, half-siblings)"
              placeholderTextColor={theme.primary}
            />
          </View>
        </View>

        {/* Preferences */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferences</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.primary }]}>Likes</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.inputText, borderColor: theme.border }]}
              value={profile.foodLikesText || ''}
              onChangeText={(text) => {
                updateField('foodLikesText', text);
                updateField('foodLikes', text ? text.split(',').map(l => l.trim()).filter(l => l) : []);
              }}
              placeholder="e.g. pizza, hiking, movies, reading"
              placeholderTextColor={theme.primary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.primary }]}>Dislikes</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.inputText, borderColor: theme.border }]}
              value={profile.foodDislikesText || ''}
              onChangeText={(text) => {
                updateField('foodDislikesText', text);
                updateField('foodDislikes', text ? text.split(',').map(d => d.trim()).filter(d => d) : []);
              }}
              placeholder="e.g. spicy food, loud music, crowds"
              placeholderTextColor={theme.primary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.primary }]}>Interests</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.inputText, borderColor: theme.border }]}
              value={profile.interestsText || ''}
              onChangeText={(text) => {
                updateField('interestsText', text);
                updateField('interests', text ? text.split(',').map(i => i.trim()).filter(i => i) : []);
              }}
              placeholder="e.g. music, art, sports, reading"
              placeholderTextColor={theme.primary}
            />
          </View>
        </View>

        {/* Socials */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Socials</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.primary }]}>Instagram</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.inputText, borderColor: theme.border }]}
              value={profile.instagram || ''}
              onChangeText={(text) => updateField('instagram', text)}
              placeholder="@username or profile link"
              placeholderTextColor={theme.primary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.primary }]}>Snapchat</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.inputText, borderColor: theme.border }]}
              value={profile.snapchat || ''}
              onChangeText={(text) => updateField('snapchat', text)}
              placeholder="@username"
              placeholderTextColor={theme.primary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.primary }]}>X (Twitter)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.inputText, borderColor: theme.border }]}
              value={profile.twitter || ''}
              onChangeText={(text) => updateField('twitter', text)}
              placeholder="@username"
              placeholderTextColor={theme.primary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.primary }]}>TikTok</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.inputText, borderColor: theme.border }]}
              value={profile.tiktok || ''}
              onChangeText={(text) => updateField('tiktok', text)}
              placeholder="@username"
              placeholderTextColor={theme.primary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.primary }]}>Facebook</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.inputText, borderColor: theme.border }]}
              value={profile.facebook || ''}
              onChangeText={(text) => updateField('facebook', text)}
              placeholder="Profile name or link"
              placeholderTextColor={theme.primary}
            />
          </View>
        </View>

        {/* Tags */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Tags</Text>
          
          {/* Existing Tags */}
          <View style={styles.tagsContainer}>
            {profile.tags?.map((tag, index) => (
              <View 
                key={index} 
                style={[
                  styles.tag, 
                  { 
                    backgroundColor: isDark ? tag.color?.dark || theme.accent : tag.color?.light || theme.accent 
                  }
                ]}
              >
                <Text style={[
                  styles.tagText, 
                  { color: isDark ? '#FFFFFF' : tag.color?.text || theme.text }
                ]}>
                  {typeof tag === 'string' ? tag : tag.text}
                </Text>
                <TouchableOpacity onPress={() => removeTag(index)}>
                  <X size={14} color={isDark ? '#FFFFFF' : tag.color?.text || theme.text} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Add New Tag */}
          <View style={styles.addTagContainer}>
            <TextInput
              style={[styles.tagInput, { backgroundColor: theme.accent, color: theme.inputText, borderColor: theme.border }]}
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Add a tag..."
              placeholderTextColor={theme.primary}
            />
            
            <TouchableOpacity
              style={[styles.colorButton, { backgroundColor: isDark ? selectedTagColor.dark : selectedTagColor.light }]}
              onPress={() => setShowColorPicker(!showColorPicker)}
            >
              <Palette size={16} color={selectedTagColor.text} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.addTagButton, { backgroundColor: theme.secondary }]}
              onPress={addTag}
            >
              <Plus size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Color Picker */}
          {showColorPicker && (
            <View style={styles.colorPicker}>
              {TAG_COLORS.map((color) => (
                <TouchableOpacity
                  key={color.name}
                  style={[
                    styles.colorOption,
                    { backgroundColor: isDark ? color.dark : color.light },
                    selectedTagColor.name === color.name && { borderWidth: 2, borderColor: theme.secondary }
                  ]}
                  onPress={() => {
                    setSelectedTagColor(color);
                    setShowColorPicker(false);
                  }}
                />
              ))}
              
              {/* Add Custom Color Button */}
              <TouchableOpacity
                style={[styles.addCustomColorButton, { borderColor: theme.border }]}
                onPress={() => setShowCustomColorForm(true)}
              >
                <Plus size={16} color={theme.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Custom Color Form */}
          {showCustomColorForm && (
            <View style={[styles.customColorForm, { backgroundColor: theme.accent, borderColor: theme.border }]}>
              <Text style={[styles.customColorTitle, { color: theme.text }]}>Create Custom Color</Text>
              
              <View style={styles.customColorInputs}>
                <TextInput
                  style={[styles.customColorInput, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border }]}
                  value={customColorName}
                  onChangeText={setCustomColorName}
                  placeholder="Color name"
                  placeholderTextColor={theme.primary}
                />
                
                <View style={styles.colorInputRow}>
                  <View style={styles.colorInputGroup}>
                    <Text style={[styles.colorInputLabel, { color: theme.primary }]}>Light</Text>
                    <TextInput
                      style={[styles.colorInput, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border }]}
                      value={customColorLight}
                      onChangeText={setCustomColorLight}
                      placeholder="#E5E7EB"
                      placeholderTextColor={theme.primary}
                    />
                  </View>
                  
                  <View style={styles.colorInputGroup}>
                    <Text style={[styles.colorInputLabel, { color: theme.primary }]}>Dark</Text>
                    <TextInput
                      style={[styles.colorInput, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border }]}
                      value={customColorDark}
                      onChangeText={setCustomColorDark}
                      placeholder="#374151"
                      placeholderTextColor={theme.primary}
                    />
                  </View>
                  
                  <View style={styles.colorInputGroup}>
                    <Text style={[styles.colorInputLabel, { color: theme.primary }]}>Text</Text>
                    <TextInput
                      style={[styles.colorInput, { backgroundColor: theme.cardBackground, color: theme.text, borderColor: theme.border }]}
                      value={customColorText}
                      onChangeText={setCustomColorText}
                      placeholder="#6B7280"
                      placeholderTextColor={theme.primary}
                    />
                  </View>
                </View>
                
                {/* Color Preview */}
                <View style={styles.colorPreview}>
                  <Text style={[styles.colorPreviewLabel, { color: theme.primary }]}>Preview:</Text>
                  <View style={[
                    styles.colorPreviewSwatch,
                    { backgroundColor: isDark ? customColorDark : customColorLight }
                  ]}>
                    <Text style={[styles.colorPreviewText, { color: customColorText }]}>
                      Sample Text
                    </Text>
                  </View>
                </View>
                
                <View style={styles.customColorActions}>
                  <TouchableOpacity
                    style={[styles.customColorButton, { backgroundColor: theme.border }]}
                    onPress={() => setShowCustomColorForm(false)}
                  >
                    <Text style={[styles.customColorButtonText, { color: isDark ? theme.text : '#003C24' }]}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.customColorButton, { backgroundColor: theme.secondary }]}
                    onPress={addCustomColor}
                  >
                    <Text style={[styles.customColorButtonText, { color: '#FFFFFF' }]}>Add Color</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Notes */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Other Notes</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: theme.accent, color: theme.inputText, borderColor: theme.border }]}
            value={profile.notes || ''}
            onChangeText={(text) => updateField('notes', text)}
            placeholder="Add notes about this person..."
            placeholderTextColor={theme.primary}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Last Contact */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Last Contact</Text>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.primary }]}>Date</Text>
            <TouchableOpacity
              style={[styles.dateSelector, { backgroundColor: theme.accent, borderColor: theme.border }]}
              onPress={() => {
                // Set calendar to current last contact date or today
                const currentDate = profile.lastContactDate ? new Date(profile.lastContactDate) : new Date();
                setLastContactCalendarDate(currentDate);
                setShowLastContactCalendar(true);
              }}
            >
              <Calendar size={20} color={theme.primary} />
              <Text style={[styles.dateSelectorText, { color: theme.text }]}>
                {profile.lastContactDate 
                  ? formatDisplayDate(profile.lastContactDate.split('T')[0])
                  : 'Select Date'
                }
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>

        {/* Last Contact Calendar Modal */}
        <Modal
        visible={showLastContactCalendar}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLastContactCalendar(false)}
      >
        <View style={styles.calendarOverlay}>
          <View style={[styles.calendarModal, { backgroundColor: theme.cardBackground }]}>
            <View style={[styles.calendarHeader, { borderBottomColor: theme.border }]}>
              <TouchableOpacity onPress={() => navigateLastContactMonth(-1)}>
                <ChevronLeft size={24} color={theme.primary} />
              </TouchableOpacity>
              <Text style={[styles.calendarTitle, { color: theme.text }]}>
                {lastContactCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => navigateLastContactMonth(1)}>
                <ChevronRight size={24} color={theme.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarContent}>
              <View style={styles.weekDays}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <Text key={day} style={[styles.weekDayText, { color: theme.primary }]}>
                    {day}
                  </Text>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {generateLastContactCalendarDays().map((date, index) => {
                  const isCurrentMonth = date.getMonth() === lastContactCalendarDate.getMonth();
                  const isSelected = profile.lastContactDate && 
                    date.toISOString().split('T')[0] === profile.lastContactDate.split('T')[0];
                  const isToday = date.toDateString() === new Date().toDateString();

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.calendarDay,
                        isSelected && { backgroundColor: theme.secondary },
                        isToday && !isSelected && { borderColor: theme.secondary, borderWidth: 1 }
                      ]}
                      onPress={() => selectLastContactDate(date)}
                    >
                      <Text style={[
                        styles.calendarDayText,
                        { color: isCurrentMonth ? theme.text : theme.primary },
                        isSelected && { color: '#FFFFFF' }
                      ]}>
                        {date.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.calendarFooter}>
                <TouchableOpacity
                  style={[styles.calendarButton, { backgroundColor: theme.accent, borderColor: theme.border }]}
                  onPress={() => setShowLastContactCalendar(false)}
                >
                  <Text style={[styles.calendarButtonText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.calendarButton, { backgroundColor: theme.secondary, borderColor: theme.secondary }]}
                  onPress={() => {
                    // Clear the last contact date
                    updateField('lastContactDate', null);
                    setShowLastContactCalendar(false);
                  }}
                >
                  <Text style={[styles.calendarButtonText, { color: '#FFFFFF' }]}>Clear Date</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
        </Modal>
      </>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    letterSpacing: 0,
  },
  textArea: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 100,
    textAlignVertical: 'top',
    letterSpacing: 0,
  },
  relationshipOptions: {
    flexDirection: 'row',
  },
  relationshipOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  relationshipOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 6,
  },
  addTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    borderWidth: 1,
    marginRight: 8,
    letterSpacing: 0,
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  addTagButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  addCustomColorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customColorForm: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  customColorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  customColorInputs: {
    gap: 12,
  },
  customColorInput: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    borderWidth: 1,
    letterSpacing: 0,
  },
  colorInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  colorInputGroup: {
    flex: 1,
  },
  colorInputLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  colorInput: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    borderWidth: 1,
    letterSpacing: 0,
  },
  colorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorPreviewLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  colorPreviewSwatch: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  colorPreviewText: {
    fontSize: 12,
    fontWeight: '500',
  },
  customColorActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  customColorButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  customColorButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateSelectorText: {
    fontSize: 16,
    marginLeft: 8,
  },
  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModal: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  calendarContent: {
    gap: 16,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: '500',
    width: 40,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 16,
  },
  calendarFooter: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  calendarButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  calendarButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  photoContainer: {
    alignItems: 'center',
  },
  addPhotoButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  photoPreview: {
    position: 'relative',
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replacePhotoButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
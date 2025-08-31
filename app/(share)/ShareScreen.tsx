import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Settings as SettingsIcon, Download, Share as ShareIcon, Ratio as AspectRatioIcon, ChevronDown, X } from 'lucide-react-native';
import { ShareCard, ShareCardRef } from '@/components/share/ShareCard';
import { ShareService } from '@/services/share/ShareService';
import { getPrivacyPresetSettings } from '@/services/share/Privacy';
import { analytics } from '@/services/analytics/analytics';
import { shareCardTheme } from '@/theme/shareCardTheme';
import { useTheme } from '@/context/ThemeContext';
import { Profile, PrivacyPreset, TemplateType, AspectRatio, PrivacySettings } from '@/types/armi';
import { DatabaseService } from '@/services/DatabaseService';
import { useFocusEffect } from '@react-navigation/native';

// Hook to fetch real roster data from DatabaseService
function useRoster() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadProfiles();
    }, [])
  );

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const data = await DatabaseService.getAllProfiles();
      
      // Convert database profiles to Share Card Profile format
      const convertedProfiles: Profile[] = data.map(dbProfile => ({
        id: dbProfile.id.toString(),
        firstName: dbProfile.name.split(' ')[0] || dbProfile.name,
        lastName: dbProfile.name.split(' ').slice(1).join(' ') || '',
        avatarUrl: dbProfile.photoUri || undefined,
        relationship: mapRelationship(dbProfile.relationship),
        tags: Array.isArray(dbProfile.tags) 
          ? dbProfile.tags.map(tag => typeof tag === 'string' ? tag : tag.text)
          : [],
        notes: dbProfile.notes || undefined,
        phone: dbProfile.phone || undefined,
        company: undefined, // Not stored in current DB schema
        title: dbProfile.job || undefined,
        kidsCount: Array.isArray(dbProfile.kids) ? dbProfile.kids.length : undefined,
        createdAt: dbProfile.createdAt || new Date().toISOString(),
      }));
      
      setProfiles(convertedProfiles);
    } catch (error) {
      console.error('Error loading profiles for share cards:', error);
      // Fallback to fake data for development/testing
      setProfiles(debugGenerateFakeRoster(15));
    } finally {
      setLoading(false);
    }
  };

  const mapRelationship = (dbRelationship: string): 'Friend' | 'Family' | 'Work' | 'Dating' | 'Other' => {
    switch (dbRelationship?.toLowerCase()) {
      case 'family':
        return 'Family';
      case 'friend':
        return 'Friend';
      case 'coworker':
        return 'Work';
      case 'partner':
        return 'Dating';
      default:
        return 'Other';
    }
  };

  return { profiles, loading };
}

export function debugGenerateFakeRoster(count: number): Profile[] {
  const firstNames = ['Alex', 'Sarah', 'Mike', 'Emma', 'David', 'Lisa', 'John', 'Maria', 'Chris', 'Anna', 'Ryan', 'Sophie', 'Jake', 'Olivia', 'Matt'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'];
  const relationships: Array<'Friend' | 'Family' | 'Work' | 'Dating' | 'Other'> = ['Friend', 'Family', 'Work', 'Dating', 'Other'];
  const companies = ['Google', 'Apple', 'Microsoft', 'Amazon', 'Meta', 'Netflix', 'Spotify', 'Uber', 'Airbnb', 'Tesla'];
  const titles = ['Software Engineer', 'Product Manager', 'Designer', 'Data Scientist', 'Marketing Manager', 'Sales Director', 'Consultant', 'Analyst', 'Developer', 'Coordinator'];
  const tags = ['tech', 'creative', 'outdoorsy', 'foodie', 'traveler', 'fitness', 'music', 'art', 'sports', 'books', 'gaming', 'photography'];

  const profiles: Profile[] = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const relationship = relationships[i % relationships.length];
    
    // Create date within last 6 months
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 180));
    
    profiles.push({
      id: `profile-${i + 1}`,
      firstName,
      lastName,
      avatarUrl: `https://images.pexels.com/photos/${1000000 + i}/pexels-photo-${1000000 + i}.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2`,
      relationship,
      tags: tags.slice(i % 3, (i % 3) + 2 + Math.floor(Math.random() * 2)),
      notes: Math.random() > 0.5 ? `Great person to know. Met through ${relationship.toLowerCase()} connections.` : undefined,
      phone: Math.random() > 0.6 ? `+1${Math.floor(Math.random() * 9000000000) + 1000000000}` : undefined,
      company: relationship === 'Work' ? companies[i % companies.length] : undefined,
      title: relationship === 'Work' ? titles[i % titles.length] : undefined,
      kidsCount: Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : undefined,
      createdAt: createdAt.toISOString(),
    });
  }
  
  return profiles;
}

export default function ShareScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const shareCardRef = useRef<ShareCardRef>(null);
  
  const [templateType, setTemplateType] = useState<TemplateType>('Wrapped');
  const [privacyPreset, setPrivacyPreset] = useState<PrivacyPreset>('Semi');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('Story');
  const [showAdvancedPrivacy, setShowAdvancedPrivacy] = useState(false);
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [showAspectRatioDropdown, setShowAspectRatioDropdown] = useState(false);
  const [customPrivacySettings, setCustomPrivacySettings] = useState<PrivacySettings>(
    getPrivacyPresetSettings('Semi')
  );
  const [isCapturing, setIsCapturing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { profiles, loading } = useRoster();
  const theme = shareCardTheme[isDark ? 'dark' : 'light'];

  const appTheme = {
    text: '#f0f0f0',
    background: isDark ? '#0B0909' : '#003C24',
    primary: isDark ? '#8C8C8C' : '#f0f0f0',
    secondary: isDark ? '#4A5568' : '#012d1c',
    accent: isDark ? '#44444C' : '#002818',
    cardBackground: isDark ? '#1A1A1A' : '#002818',
    border: isDark ? '#333333' : '#012d1c',
  };

  React.useEffect(() => {
    analytics.fireEvent('sharecard_preview_open', {
      profileCount: profiles.length,
      template: templateType,
      preset: privacyPreset,
      ratio: aspectRatio,
    });
  }, []);

  React.useEffect(() => {
    setCustomPrivacySettings(getPrivacyPresetSettings(privacyPreset));
  }, [privacyPreset]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleTemplateChange = (template: TemplateType) => {
    // Private preset only allows Wrapped template
    if (privacyPreset === 'Private' && template !== 'Wrapped') {
      Alert.alert('Privacy Restriction', 'Private mode only supports the Wrapped template for maximum privacy.');
      return;
    }
    
    setTemplateType(template);
    analytics.fireEvent('sharecard_template_change', { template, preset: privacyPreset });
  };

  const handlePrivacyPresetChange = (preset: PrivacyPreset) => {
    setPrivacyPreset(preset);
    setShowPresetDropdown(false);
    
    // If switching to Private, force Wrapped template
    if (preset === 'Private') {
      setTemplateType('Wrapped');
    }
    
    analytics.fireEvent('sharecard_privacy_preset', { preset, template: templateType });
  };

  const handleAspectRatioChange = (ratio: AspectRatio) => {
    setAspectRatio(ratio);
    setShowAspectRatioDropdown(false);
  };

  const getDimensions = () => {
    switch (aspectRatio) {
      case 'Story':
        return { width: 1080, height: 1920 };
      case 'Portrait':
        return { width: 1080, height: 1350 };
      case 'Square':
        return { width: 1080, height: 1080 };
      default:
        return { width: 1080, height: 1920 };
    }
  };

  const handleSave = async () => {
    if (!shareCardRef.current) return;
    
    setIsCapturing(true);
    try {
      const dimensions = getDimensions();
      const uri = await shareCardRef.current.capture(dimensions);
      const success = await ShareService.saveToMediaLibrary(uri);
      
      if (success) {
        showToast('Share card saved to photos!');
        analytics.fireEvent('sharecard_export_save', {
          template: templateType,
          preset: privacyPreset,
          ratio: aspectRatio,
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save share card');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleShare = async () => {
    if (!shareCardRef.current) return;
    
    setIsCapturing(true);
    try {
      const dimensions = getDimensions();
      const uri = await shareCardRef.current.capture(dimensions);
      const success = await ShareService.share(uri, 'My ARMi Share Card');
      
      if (success) {
        analytics.fireEvent('sharecard_export_share', {
          template: templateType,
          preset: privacyPreset,
          ratio: aspectRatio,
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share card');
    } finally {
      setIsCapturing(false);
    }
  };

  const updateCustomPrivacySetting = (key: keyof PrivacySettings, value: boolean) => {
    setCustomPrivacySettings(prev => ({ ...prev, [key]: value }));
  };

  if (profiles.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: appTheme.background }]}>
        <View style={[styles.header, { borderBottomColor: appTheme.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={appTheme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: appTheme.text }]}>Share Cards</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: appTheme.text }]}>No Profiles Yet</Text>
          <Text style={[styles.emptySubtitle, { color: appTheme.primary }]}>
            Add some profiles to your roster to create share cards
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appTheme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: appTheme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={appTheme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: appTheme.text }]}>Share Cards</Text>
        
        <View style={styles.headerActions}>
          {/* Aspect Ratio Selector */}
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: appTheme.cardBackground, borderColor: appTheme.border }]}
            onPress={() => setShowAspectRatioDropdown(true)}
          >
            <AspectRatioIcon size={20} color={appTheme.primary} />
          </TouchableOpacity>
          
          {/* Privacy Preset Selector */}
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: appTheme.cardBackground, borderColor: appTheme.border }]}
            onPress={() => setShowPresetDropdown(true)}
          >
            <Text style={[styles.presetButtonText, { color: appTheme.text }]}>{privacyPreset}</Text>
            <ChevronDown size={16} color={appTheme.primary} />
          </TouchableOpacity>
          
          {/* Advanced Privacy Settings */}
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: appTheme.cardBackground, borderColor: appTheme.border }]}
            onPress={() => setShowAdvancedPrivacy(true)}
          >
            <SettingsIcon size={20} color={appTheme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Template Selector */}
      <View style={styles.templateSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateOptions}>
          {(['Wrapped', 'BlurredPeek', 'MiniCards'] as TemplateType[]).map((template) => {
            const isDisabled = privacyPreset === 'Private' && template !== 'Wrapped';
            return (
              <TouchableOpacity
                key={template}
                style={[
                  styles.templateOption,
                  {
                    backgroundColor: templateType === template ? appTheme.secondary : appTheme.cardBackground,
                    borderColor: appTheme.border,
                  },
                  isDisabled && { opacity: 0.5 }
                ]}
                onPress={() => !isDisabled && handleTemplateChange(template)}
                disabled={isDisabled}
              >
                <Text style={[
                  styles.templateOptionText,
                  { color: templateType === template ? '#FFFFFF' : appTheme.text }
                ]}>
                  {template === 'BlurredPeek' ? 'Blurred Peek' : template === 'MiniCards' ? 'Mini Cards' : template}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Share Card Preview */}
      <ScrollView style={styles.previewContainer} contentContainerStyle={styles.previewContent}>
        <View style={styles.cardWrapper}>
          <ShareCard
            ref={shareCardRef}
            templateType={templateType}
            profiles={profiles}
            privacySettings={customPrivacySettings}
            aspectRatio={aspectRatio}
            theme={theme}
          />
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { backgroundColor: appTheme.background, borderTopColor: appTheme.border }]}>
        <TouchableOpacity
          style={[styles.actionButton, styles.saveButton, { backgroundColor: appTheme.cardBackground, borderColor: appTheme.border }]}
          onPress={handleSave}
          disabled={isCapturing}
        >
          <Download size={20} color={appTheme.text} />
          <Text style={[styles.actionButtonText, { color: appTheme.text }]}>
            {isCapturing ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton, { backgroundColor: appTheme.secondary }]}
          onPress={handleShare}
          disabled={isCapturing}
        >
          <ShareIcon size={20} color="#FFFFFF" />
          <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
            {isCapturing ? 'Sharing...' : 'Share'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Aspect Ratio Dropdown */}
      <Modal
        visible={showAspectRatioDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAspectRatioDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAspectRatioDropdown(false)}
        >
          <View style={[styles.dropdown, { backgroundColor: appTheme.cardBackground, borderColor: appTheme.border }]}>
            {(['Story', 'Portrait', 'Square'] as AspectRatio[]).map((ratio) => (
              <TouchableOpacity
                key={ratio}
                style={[styles.dropdownOption, { borderBottomColor: appTheme.border }]}
                onPress={() => handleAspectRatioChange(ratio)}
              >
                <Text style={[styles.dropdownOptionText, { color: appTheme.text }]}>
                  {ratio} ({ratio === 'Story' ? '9:16' : ratio === 'Portrait' ? '4:5' : '1:1'})
                </Text>
                {aspectRatio === ratio && (
                  <View style={[styles.selectedIndicator, { backgroundColor: appTheme.secondary }]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Privacy Preset Dropdown */}
      <Modal
        visible={showPresetDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPresetDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPresetDropdown(false)}
        >
          <View style={[styles.dropdown, { backgroundColor: appTheme.cardBackground, borderColor: appTheme.border }]}>
            {(['Public', 'Semi', 'Private'] as PrivacyPreset[]).map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[styles.dropdownOption, { borderBottomColor: appTheme.border }]}
                onPress={() => handlePrivacyPresetChange(preset)}
              >
                <View style={styles.presetOption}>
                  <Text style={[styles.dropdownOptionText, { color: appTheme.text }]}>{preset}</Text>
                  <Text style={[styles.presetDescription, { color: appTheme.primary }]}>
                    {preset === 'Public' ? 'Stats only' : 
                     preset === 'Semi' ? 'Blurred details' : 
                     'Maximum privacy'}
                  </Text>
                </View>
                {privacyPreset === preset && (
                  <View style={[styles.selectedIndicator, { backgroundColor: appTheme.secondary }]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Advanced Privacy Settings Modal */}
      <Modal
        visible={showAdvancedPrivacy}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdvancedPrivacy(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.advancedModal, { backgroundColor: appTheme.cardBackground }]}>
            <View style={[styles.modalHeader, { borderBottomColor: appTheme.border }]}>
              <Text style={[styles.modalTitle, { color: appTheme.text }]}>Advanced Privacy</Text>
              <TouchableOpacity onPress={() => setShowAdvancedPrivacy(false)}>
                <X size={24} color={appTheme.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {Object.entries({
                showNames: 'Show Names',
                showPhotos: 'Show Photos',
                showNotes: 'Show Notes',
                showPhone: 'Show Phone Numbers',
                showCompanyTitle: 'Show Company & Title',
                showKidsPets: 'Show Kids & Pets',
              }).map(([key, label]) => (
                <View key={key} style={[styles.privacyOption, { borderBottomColor: appTheme.border }]}>
                  <Text style={[styles.privacyOptionText, { color: appTheme.text }]}>{label}</Text>
                  <Switch
                    value={customPrivacySettings[key as keyof PrivacySettings]}
                    onValueChange={(value) => updateCustomPrivacySetting(key as keyof PrivacySettings, value)}
                    trackColor={{ false: appTheme.border, true: appTheme.secondary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Toast */}
      {toastMessage && (
        <View style={[styles.toast, { backgroundColor: appTheme.secondary }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
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
    paddingTop: 5,
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  headerSpacer: {
    width: 40,
  },
  templateSelector: {
    paddingVertical: 16,
  },
  templateOptions: {
    paddingHorizontal: 20,
    gap: 12,
  },
  templateOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  templateOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  previewContainer: {
    flex: 1,
  },
  previewContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
  },
  cardWrapper: {
    transform: [{ scale: 0.3 }],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButton: {
    borderWidth: 1,
  },
  shareButton: {
    // No additional styles needed
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 200,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  presetOption: {
    flex: 1,
  },
  presetDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  advancedModal: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    paddingHorizontal: 20,
  },
  privacyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  privacyOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
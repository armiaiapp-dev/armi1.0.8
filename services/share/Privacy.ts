import { Profile, PrivacySettings } from '@/types/armi';

export function applyPrivacySettings(profile: Profile, settings: PrivacySettings): Profile {
  const processedProfile: Profile = { ...profile };

  // Apply name privacy
  if (!settings.showNames) {
    processedProfile.firstName = profile.firstName.charAt(0) + '.';
    processedProfile.lastName = profile.lastName.charAt(0) + '.';
  }

  // Apply photo privacy
  if (!settings.showPhotos) {
    processedProfile.avatarUrl = undefined;
  }

  // Apply notes privacy
  if (!settings.showNotes) {
    processedProfile.notes = undefined;
  }

  // Apply phone privacy
  if (!settings.showPhone) {
    processedProfile.phone = undefined;
  }

  // Apply company/title privacy
  if (!settings.showCompanyTitle) {
    processedProfile.company = undefined;
    processedProfile.title = undefined;
  }

  // Apply kids/pets privacy
  if (!settings.showKidsPets) {
    processedProfile.kidsCount = undefined;
  }

  return processedProfile;
}

export function getPrivacyPresetSettings(preset: 'Public' | 'Semi' | 'Private'): PrivacySettings {
  switch (preset) {
    case 'Public':
      return {
        showNames: false,
        showPhotos: false,
        showNotes: false,
        showPhone: false,
        showCompanyTitle: false,
        showKidsPets: false,
      };
    case 'Semi':
      return {
        showNames: false,
        showPhotos: true, // Will be blurred in templates
        showNotes: false,
        showPhone: false,
        showCompanyTitle: true,
        showKidsPets: true,
      };
    case 'Private':
      return {
        showNames: false,
        showPhotos: false,
        showNotes: false,
        showPhone: false,
        showCompanyTitle: false,
        showKidsPets: false,
      };
    default:
      return getPrivacyPresetSettings('Private');
  }
}
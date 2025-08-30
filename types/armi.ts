export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  relationship: 'Friend' | 'Family' | 'Work' | 'Dating' | 'Other';
  tags: string[];
  notes?: string;
  phone?: string;
  company?: string;
  title?: string;
  kidsCount?: number;
  createdAt: string; // ISO
}

export type RelationshipType = 'Friend' | 'Family' | 'Work' | 'Dating' | 'Other';

export type PrivacyPreset = 'Public' | 'Semi' | 'Private';

export type TemplateType = 'Wrapped' | 'BlurredPeek' | 'MiniCards';

export type AspectRatio = 'Story' | 'Portrait' | 'Square';

export interface ShareCardTheme {
  background: string;
  text: string;
  primary: string;
  secondary: string;
  accent: string;
  border: string;
}

export interface PrivacySettings {
  showNames: boolean;
  showPhotos: boolean;
  showNotes: boolean;
  showPhone: boolean;
  showCompanyTitle: boolean;
  showKidsPets: boolean;
}

export interface Tag {
  text: string;
  color?: {
    light: string;
    dark: string;
    text: string;
  };
}
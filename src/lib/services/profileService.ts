import { apiClient, ProfileRow } from '@/api/client';
import { Student } from '../../types/ally';
import { CURRENT_USER } from '../../data/mockData';

export const profileMapper = (row: ProfileRow): Student => {
  const email = row.email || '';
  const isVerified = email.toLowerCase().endsWith('@chmsu.edu.ph');

  return {
    id: row.id,
    name: row.username ?? row.full_name ?? 'Student',
    username: row.username ?? null,
    email,
    course: row.course ?? 'Unknown Course',
    yearLevel: row.year_level ?? 'Unknown Year',
    department: row.department ?? 'Unknown Department',
    bio: row.bio ?? '',
    avatar: row.avatar_url ?? CURRENT_USER.avatar,
    interests: row.interests ?? [],
    organizations: row.organizations ?? [],
    isVerified,
    joinedAt: row.created_at ?? new Date().toISOString(),
  };
};

export const profileService = {
  async getProfile(userId: string) {
    const data = await apiClient.getProfile(userId);
    return profileMapper(data);
  },

  async getMyProfile() {
    const data = await apiClient.getMyProfile();
    return profileMapper(data);
  },

  async updateProfile(userId: string, updates: Partial<Student>) {
    const data = await apiClient.updateProfile({
      full_name: updates.username,
      username: updates.username,
      bio: updates.bio,
      avatar_url: updates.avatar,
      interests: updates.interests,
      organizations: updates.organizations,
      course: updates.course,
      department: updates.department,
      year_level: updates.yearLevel,
    });
    return profileMapper(data);
  },

  async getAllProfiles(excludeId?: string) {
    const data = await apiClient.listProfiles(excludeId);
    return (data || []).map(profileMapper);
  },

  async checkUsername(username: string, excludeId?: string) {
    const result = await apiClient.checkUsername(username, excludeId);
    return result.available;
  },

  async deleteProfile() {
    await apiClient.deleteProfile();
  },
};

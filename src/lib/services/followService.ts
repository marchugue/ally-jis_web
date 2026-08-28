import { apiClient } from '@/api/client';

export const followService = {
  async follow(targetUserId: string) {
    await apiClient.followUser(targetUserId);
  },

  async unfollow(targetUserId: string) {
    await apiClient.unfollowUser(targetUserId);
  },

  async getStatus(targetUserId: string) {
    return apiClient.getFollowStatus(targetUserId);
  },

  async getCounts(userId: string) {
    return apiClient.getFollowCounts(userId);
  },

  async listFollowers(userId: string, cursor?: string | null) {
    return apiClient.listFollowers(userId, cursor);
  },

  async listFollowing(userId: string, cursor?: string | null) {
    return apiClient.listFollowing(userId, cursor);
  },
};

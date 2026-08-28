import { apiClient } from '@/api/client';

export const interactionService = {
  async sendRequest(_userId: string, targetUserId: string) {
    await apiClient.sendConnectionRequest(targetUserId);
  },

  async acceptRequest(_userId: string, requesterId: string) {
    return apiClient.acceptConnection(requesterId);
  },

  async rejectRequest(_userId: string, targetUserId: string) {
    await apiClient.rejectConnection(targetUserId);
  },

  async cancelRequest(targetUserId: string) {
    await apiClient.cancelConnectionRequest(targetUserId);
  },

  async removeAlly(targetUserId: string) {
    await apiClient.removeAlly(targetUserId);
  },

  async getConnectionStatus(_userId: string, targetUserId: string) {
    const result = await apiClient.getConnectionStatus(targetUserId);
    return result.status;
  },

  async getRelationshipStatus(targetUserId: string) {
    const result = await apiClient.getRelationshipStatus(targetUserId);
    return result.status;
  },

  async listAllies(userId: string, cursor?: string | null) {
    return apiClient.listAllies(userId, cursor);
  },

  async getAlliesCount(userId: string) {
    const result = await apiClient.getAlliesCount(userId);
    return result.count;
  },

  async listMyInteractions() {
    return apiClient.listMyInteractions();
  },
};

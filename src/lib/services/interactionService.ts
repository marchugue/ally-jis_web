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

  async getConnectionStatus(_userId: string, targetUserId: string) {
    const result = await apiClient.getConnectionStatus(targetUserId);
    return result.status;
  },

  async listMyInteractions() {
    return apiClient.listMyInteractions();
  },
};

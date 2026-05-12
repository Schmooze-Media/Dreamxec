import apiRequest from './api';

export interface CampaignTransfer {
  id: string;
  campaignId: string;
  fromUserId: string;
  toUserId: string;
  status: string;
  initiatedBy: string;
  initiatorRole: string;
  requestNote?: string;
  targetNote?: string;
  presidentNote?: string;
  adminNote?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  currentStageExpiresAt: string;
  amountAtTransfer?: number;
  campaign?: {
    title: string;
  };
}

export interface UserLookupResult {
  eligible: boolean;
  maskedName: string;
  sameClub: boolean;
  message?: string;
}

const transferService = {
  lookupUser: async (email: string, campaignId?: string): Promise<UserLookupResult> => {
    console.log('[transferService] lookupUser called for:', email, 'campaignId:', campaignId);
    const response = await apiRequest<UserLookupResult>('/user-projects/transfers/lookup-user', { 
      method: 'POST',
      body: JSON.stringify({ email, campaignId })
    });
    console.log('[transferService] lookupUser response:', response);
    return response.data!;
  },

  initiateTransfer: async (campaignId: string, toUserEmail: string, note?: string) => {
    const response = await apiRequest<{ transfer: CampaignTransfer }>(`/user-projects/${campaignId}/transfers`, { 
      method: 'POST',
      body: JSON.stringify({ toUserEmail, note })
    });
    return response.data!.transfer;
  },

  getTransferHistory: async (campaignId: string): Promise<CampaignTransfer[]> => {
    const response = await apiRequest<{ transfers: CampaignTransfer[] }>(`/user-projects/${campaignId}/transfers`, { 
      method: 'GET'
    });
    return response.data!.transfers;
  },

  acceptTransfer: async (campaignId: string, transferId: string, note?: string) => {
    const response = await apiRequest<{ transfer: CampaignTransfer }>(`/user-projects/${campaignId}/transfers/${transferId}/accept`, { 
      method: 'PATCH',
      body: JSON.stringify({ note })
    });
    return response.data!.transfer;
  },

  rejectTransfer: async (campaignId: string, transferId: string, reason: string, role: string) => {
    const response = await apiRequest<{ transfer: CampaignTransfer }>(`/user-projects/${campaignId}/transfers/${transferId}/reject`, { 
      method: 'PATCH',
      body: JSON.stringify({ reason, role })
    });
    return response.data!.transfer;
  },

  approveTransfer: async (campaignId: string, transferId: string, note: string, role: string) => {
    const response = await apiRequest<{ transfer: CampaignTransfer }>(`/user-projects/${campaignId}/transfers/${transferId}/approve`, { 
      method: 'PATCH',
      body: JSON.stringify({ note, role })
    });
    return response.data!.transfer;
  },

  cancelTransfer: async (campaignId: string, transferId: string) => {
    const response = await apiRequest<{ transfer: CampaignTransfer }>(`/user-projects/${campaignId}/transfers/${transferId}`, { 
      method: 'DELETE'
    });
    return response.data!.transfer;
  },
  
  getMyTransfers: async (): Promise<CampaignTransfer[]> => {
    const response = await apiRequest<{ transfers: CampaignTransfer[] }>('/user-projects/transfers/my', {
      method: 'GET'
    });
    return response.data!.transfers;
  }
};

export default transferService;

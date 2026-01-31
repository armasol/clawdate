import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<any> {
  const url = `${API_BASE}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth API
export const authApi = {
  requestChallenge: (publicKey: string, handle: string) =>
    apiRequest('/api/auth/challenge', {
      method: 'POST',
      body: JSON.stringify({ publicKey, handle }),
    }),

  verifyChallenge: (challengeId: string, signature: string, handle: string, type?: string) =>
    apiRequest('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ challengeId, signature, handle, type }),
    }),

  getProfile: (token: string) =>
    apiRequest('/api/auth/profile', {}, token),

  updateProfile: (token: string, updates: Record<string, any>) =>
    apiRequest('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }, token),
};

// Swipe API
export const swipeApi = {
  getDiscovery: (token: string, limit?: number) =>
    apiRequest(`/api/swipe/discovery${limit ? `?limit=${limit}` : ''}`, {}, token),

  swipe: (token: string, targetId: string, direction: 'left' | 'right' | 'up') =>
    apiRequest('/api/swipe/swipe', {
      method: 'POST',
      body: JSON.stringify({ targetId, direction }),
    }, token),

  getMatches: (token: string) =>
    apiRequest('/api/swipe/matches', {}, token),
};

// Chat API
export const chatApi = {
  getChats: (token: string) =>
    apiRequest('/api/chat', {}, token),

  getChat: (token: string, matchId: string) =>
    apiRequest(`/api/chat/${matchId}`, {}, token),

  sendMessage: (token: string, matchId: string, content: string, type?: string) =>
    apiRequest(`/api/chat/${matchId}`, {
      method: 'POST',
      body: JSON.stringify({ content, type }),
    }, token),
};

// Handshake API
export const handshakeApi = {
  create: (token: string, matchId: string, capabilities: string[], objective: string, timestamp: number, signature: string) =>
    apiRequest('/api/handshake', {
      method: 'POST',
      body: JSON.stringify({ matchId, capabilities, objective, timestamp, signature }),
    }, token),

  getByMatch: (token: string, matchId: string) =>
    apiRequest(`/api/handshake/${matchId}`, {}, token),

  verify: (handshakeId: string) =>
    apiRequest(`/api/handshake/verify/${handshakeId}`),
};

// Karma API
export const karmaApi = {
  upvote: (token: string, targetId: string) =>
    apiRequest('/api/karma/upvote', {
      method: 'POST',
      body: JSON.stringify({ targetId }),
    }, token),

  getLeaderboard: (limit?: number) =>
    apiRequest(`/api/karma/leaderboard${limit ? `?limit=${limit}` : ''}`),

  getStats: () =>
    apiRequest('/api/karma/stats'),
};

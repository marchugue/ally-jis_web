// src/api/routes/games.ts

import { request } from '../http';
import type { GameInvitePayload } from '../types';

export interface GameSessionResponse {
  session: {
    id: string;
    game_id: 'merge' | 'ttt' | 'clue';
    status: 'pending' | 'active' | 'finished' | 'declined' | 'expired';
    host_id: string;
    guest_id: string;
    winner_id: string | null;
    expires_at: string | null;
    created_at: string;
  };
}

export function inviteToGame(friendId: string, gameId: 'merge' | 'ttt' | 'clue') {
  return request<GameSessionResponse>('/games/invite', {
    method: 'POST',
    body: { friendId, gameId },
  });
}

export function acceptGameInvite(sessionId: string) {
  return request<GameSessionResponse>(`/games/${sessionId}/accept`, {
    method: 'POST',
  });
}

export function declineGameInvite(sessionId: string) {
  return request<GameSessionResponse>(`/games/${sessionId}/decline`, {
    method: 'POST',
  });
}

export function cancelGameInvite(sessionId: string) {
  return request<GameSessionResponse>(`/games/${sessionId}/cancel`, {
    method: 'POST',
  });
}

export function getGameSession(sessionId: string) {
  return request<GameSessionResponse>(`/games/${sessionId}`);
}

export function getGameLeaderboard(game?: string, scope: 'global' | 'friends' = 'global', limit: number = 50) {
  const params = new URLSearchParams();
  if (game) params.set('game', game);
  params.set('scope', scope);
  params.set('limit', String(limit));
  return request<{ leaderboard: any[] }>(`/games/leaderboard?${params.toString()}`);
}

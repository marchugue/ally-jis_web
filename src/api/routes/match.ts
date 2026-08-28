// src/api/routes/match.ts

import { request } from '../http';
import type { AcceptMatchResponse, MatchmakingStatusResponse, QueueRow, RevealData, TimelineData } from '../types';

export function joinQueue() {
  return request<QueueRow>('/match/queue', { method: 'POST' });
}

export function leaveQueue() {
  return request<void>('/match/queue', { method: 'DELETE' });
}

export function getMatchmakingStatus() {
  return request<MatchmakingStatusResponse>('/match/status');
}

export function acceptMatch(matchId: string) {
  return request<AcceptMatchResponse>(`/match/${matchId}/accept`, { method: 'POST' });
}

export function declineMatch(matchId: string) {
  return request<void>(`/match/${matchId}/decline`, { method: 'POST' });
}

export function endMatch(matchId: string) {
  return request<AcceptMatchResponse>(`/match/${matchId}/end`, { method: 'POST' });
}

export function getMatchReveal(matchId: string) {
  return request<RevealData>(`/match/${matchId}/reveal`);
}

export function getMatchTimeline(matchId: string) {
  return request<TimelineData>(`/match/${matchId}/timeline`);
}

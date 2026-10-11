// src/api/routes/activityLogs.ts

import { request } from '../http';
import type {
  ActivityBucket,
  FormattedActivityResponse,
  ListActivityLogsParams,
} from '../types';

export function listActivityLogs(params?: ListActivityLogsParams): Promise<FormattedActivityResponse> {
  const query = new URLSearchParams();
  if (params?.bucket && params.bucket !== 'all') {
    query.set('bucket', params.bucket);
  }
  if (params?.limit) {
    query.set('limit', String(params.limit));
  }
  if (params?.cursor) {
    query.set('cursor', params.cursor);
  }

  const qs = query.toString();
  return request<FormattedActivityResponse>(`/activity-logs${qs ? `?${qs}` : ''}`);
}

export function deleteActivityLog(id: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/activity-logs/${id}`, {
    method: 'DELETE',
  });
}

export function clearActivityLogs(bucket?: ActivityBucket): Promise<{ success: boolean; message: string }> {
  const qs = bucket ? `?bucket=${encodeURIComponent(bucket)}` : '';
  return request<{ success: boolean; message: string }>(`/activity-logs${qs}`, {
    method: 'DELETE',
  });
}

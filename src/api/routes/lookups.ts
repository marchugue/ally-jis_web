// src/api/lookups.ts

import { request } from '../http';
import type { LookupsResponse } from '../types';

export function getLookups() {
  return request<LookupsResponse>('/lookups', { auth: false });
}
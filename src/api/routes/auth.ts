// src/api/routes/auth.ts

import { request, getStoredToken, setStoredToken, ApiError } from '../http';
import type { AuthSession, RegisterPayload, EmailStatus, OtpStatus, RegisterResponse } from '../types';

export async function login(email: string, password: string): Promise<AuthSession> {
  const session = await request<AuthSession>('/auth/login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  });
  setStoredToken(session.accessToken);
  return session;
}

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  const result = await request<RegisterResponse>('/auth/register', {
    method: 'POST',
    auth: false,
    body: payload,
  });
  // No token yet — user must verify OTP first
  return result;
}

export async function logout(): Promise<void> {
  try {
    await request<void>('/auth/logout', { method: 'POST' });
  } finally {
    setStoredToken(null);
  }
}

export async function forgotPassword(email: string): Promise<void> {
  await request<void>('/auth/forgot-password', {
    method: 'POST',
    auth: false,
    body: { email },
  });
}
 
export async function resetPassword(token: string, password: string): Promise<void> {
  await request<void>('/auth/reset-password', {
    method: 'POST',
    auth: false,
    body: { token, password },
  });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await request<void>('/auth/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
  });
}

export async function deleteAccount(): Promise<void> {
  try {
    await request<void>('/auth/delete-account', { method: 'DELETE' });
  } finally {
    setStoredToken(null);
  }
}

export async function getEmailStatus(id: string){
  return request<EmailStatus>(`/auth/email/${id}`);
}

/**
 * Legacy magic-link confirm — kept for backwards compatibility.
 * New flow uses verifyOtp instead.
 */
export async function confirmEmail(tokenHash: string): Promise<AuthSession> {
  const session = await request<AuthSession>('/auth/confirm', {
    method: 'POST',
    auth: false,
    body: { token_hash: tokenHash },
  });
  setStoredToken(session.accessToken);
  return session;
}

export async function getSession(): Promise<AuthSession | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    return await request<AuthSession>('/auth/session');
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      setStoredToken(null);
      return null;
    }
    throw err;
  }
}

export function setAccessToken(token: string | null) {
  setStoredToken(token);
}

export function getAccessToken() {
  return getStoredToken();
}

// ─── OTP ─────────────────────────────────────────────────────────────────────

export async function sendOtp(userId: string, email: string): Promise<void> {
  await request<void>('/auth/otp/send', {
    method: 'POST',
    auth: false,
    body: { userId, email },
  });
}

/**
 * Verifies the OTP code. On success, returns a full AuthSession with
 * accessToken and stores the token.
 */
export async function verifyOtp(userId: string, code: string): Promise<AuthSession> {
  const session = await request<AuthSession>('/auth/otp/verify', {
    method: 'POST',
    auth: false,
    body: { userId, code },
  });
  setStoredToken(session.accessToken);
  return session;
}

export async function resendOtp(userId: string): Promise<{ resendCount: number; resendLimit: number }> {
  return request('/auth/otp/resend', {
    method: 'POST',
    auth: false,
    body: { userId },
  });
}

export async function getOtpStatus(userId: string): Promise<OtpStatus> {
  return request<OtpStatus>(`/auth/otp/status/${userId}`, { auth: false });
}

// ─── Student ID Upload ────────────────────────────────────────────────────────

/**
 * Uploads a student ID image to R2 before registration.
 * Returns the public URL of the uploaded file.
 */
export async function uploadStudentId(userId: string, file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('userId', userId);
  formData.append('file', file);

  // Use raw fetch since request() adds Content-Type: application/json
  const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL ?? '';
  const response = await fetch(`${baseUrl}/auth/student-id/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new ApiError(err?.message ?? 'Upload failed', response.status);
  }

  return response.json();
}

// ─── Registration Rollback ────────────────────────────────────────────────────

/**
 * Cancels an in-progress (unverified) registration.
 * Deletes the pending auth user, profile row, and OTP entry so the user can
 * restart fresh with the same or a different username/email.
 * The backend refuses the request if the OTP was already verified.
 */
export async function cancelRegistration(userId: string): Promise<void> {
  await request<void>('/auth/register/cancel', {
    method: 'DELETE',
    auth: false,
    body: { userId },
  });
}
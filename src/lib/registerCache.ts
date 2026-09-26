/**
 * Registration & Verification caching for Web.
 * 
 * Persists registration form fields, sub-step progress, uploaded ID previews,
 * and pending verification states (showOtpView, registeredUserId, otpDigits)
 * in localStorage so users can safely refresh, exit, or navigate back/forward
 * without losing their progress or pending account state.
 */

export const WEB_REGISTER_CACHE_KEY = 'ally_register_cache_v1';
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface WebRegisterCachedData {
  phase: 'select-email' | 'form';
  emailType: 'chmsu' | 'external';
  step: number; // 1 to 4
  idSubStep: 'none' | 'front' | 'back' | 'review';
  registeredUserId: string | null;
  showOtpView: boolean;
  otpDigits: string[];
  form: {
    username: string;
    email: string;
    password?: string;
    confirmPassword?: string;
    department: string;
    course: string;
    yearLevel: string;
    organizations: string[];
    interests: string[];
    avatar: string;
    bio: string;
  };
  frontPreviewDataUrl?: string | null;
  backPreviewDataUrl?: string | null;
  frontRotation?: number;
  backRotation?: number;
  avatarTab?: 'presets' | 'emoji' | 'custom';
  agreedToTerms?: boolean;
  agreedToPrivacy?: boolean;
  savedAt: number;
}

export function getWebRegisterCache(): WebRegisterCachedData | null {
  try {
    const raw = localStorage.getItem(WEB_REGISTER_CACHE_KEY);
    if (!raw) return null;
    const data: WebRegisterCachedData = JSON.parse(raw);
    if (!data.savedAt || Date.now() - data.savedAt > CACHE_TTL_MS) {
      localStorage.removeItem(WEB_REGISTER_CACHE_KEY);
      return null;
    }
    return data;
  } catch (e) {
    console.warn('[WebRegisterCache] Failed to read cache:', e);
    return null;
  }
}

export function saveWebRegisterCache(data: Partial<WebRegisterCachedData>): void {
  try {
    const existing = getWebRegisterCache();
    const updated: WebRegisterCachedData = {
      phase: data.phase ?? existing?.phase ?? 'select-email',
      emailType: data.emailType ?? existing?.emailType ?? 'chmsu',
      step: data.step ?? existing?.step ?? 1,
      idSubStep: data.idSubStep ?? existing?.idSubStep ?? 'none',
      registeredUserId: data.registeredUserId !== undefined ? data.registeredUserId : (existing?.registeredUserId ?? null),
      showOtpView: data.showOtpView !== undefined ? data.showOtpView : (existing?.showOtpView ?? false),
      otpDigits: data.otpDigits ?? existing?.otpDigits ?? ['', '', '', '', '', ''],
      form: {
        username: data.form?.username ?? existing?.form?.username ?? '',
        email: data.form?.email ?? existing?.form?.email ?? '',
        password: data.form?.password ?? existing?.form?.password ?? '',
        confirmPassword: data.form?.confirmPassword ?? existing?.form?.confirmPassword ?? '',
        department: data.form?.department ?? existing?.form?.department ?? '',
        course: data.form?.course ?? existing?.form?.course ?? '',
        yearLevel: data.form?.yearLevel ?? existing?.form?.yearLevel ?? '',
        organizations: data.form?.organizations ?? existing?.form?.organizations ?? [],
        interests: data.form?.interests ?? existing?.form?.interests ?? [],
        avatar: data.form?.avatar ?? existing?.form?.avatar ?? '😊',
        bio: data.form?.bio ?? existing?.form?.bio ?? '',
      },
      frontPreviewDataUrl: data.frontPreviewDataUrl !== undefined ? data.frontPreviewDataUrl : (existing?.frontPreviewDataUrl ?? null),
      backPreviewDataUrl: data.backPreviewDataUrl !== undefined ? data.backPreviewDataUrl : (existing?.backPreviewDataUrl ?? null),
      frontRotation: data.frontRotation ?? existing?.frontRotation ?? 0,
      backRotation: data.backRotation ?? existing?.backRotation ?? 0,
      avatarTab: data.avatarTab ?? existing?.avatarTab ?? 'presets',
      agreedToTerms: data.agreedToTerms ?? existing?.agreedToTerms ?? false,
      agreedToPrivacy: data.agreedToPrivacy ?? existing?.agreedToPrivacy ?? false,
      savedAt: Date.now(),
    };
    localStorage.setItem(WEB_REGISTER_CACHE_KEY, JSON.stringify(updated));
  } catch (e) {
    // If quota exceeded (due to preview data URLs), retry without data URLs
    try {
      if (data.frontPreviewDataUrl || data.backPreviewDataUrl) {
        const fallback = { ...data, frontPreviewDataUrl: null, backPreviewDataUrl: null };
        const existing = getWebRegisterCache();
        const updatedFallback = {
          ...existing,
          ...fallback,
          savedAt: Date.now(),
        };
        localStorage.setItem(WEB_REGISTER_CACHE_KEY, JSON.stringify(updatedFallback));
      }
    } catch {}
    console.warn('[WebRegisterCache] Failed to save cache:', e);
  }
}

export function clearWebRegisterCache(): void {
  try {
    localStorage.removeItem(WEB_REGISTER_CACHE_KEY);
  } catch (e) {
    console.warn('[WebRegisterCache] Failed to clear cache:', e);
  }
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function dataUrlToFile(dataUrl: string, filename: string): File | null {
  try {
    const arr = dataUrl.split(',');
    if (arr.length < 2) return null;
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  } catch {
    return null;
  }
}

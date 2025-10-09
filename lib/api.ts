import { cacheClear, cacheGet, cacheSet } from './cache';
import { showError } from './toast';

export type ApiUser = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
};

export type ApiWorkEntry = {
  id: string;
  userId: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string; // YYYY-MM-DD
  endTime: string; // HH:mm
  hasBreak?: boolean;
  breakStartHour?: string;
  breakStartMin?: string;
  breakEndHour?: string;
  breakEndMin?: string;
  category?: string;
  hourlyRate?: number;
  location?: {
    city?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  employerId?: string;
  projectName?: string;
  comment?: string;
};

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';
let authToken: string | null = null;
let currentUser: ApiUser | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setCurrentUser(user: ApiUser | null) {
  currentUser = user;
}

export function getCurrentUser(): ApiUser | null {
  return currentUser;
}

export function clearAuth() {
  authToken = null;
  currentUser = null;
}

/**
 * Déconnexion complète de l'utilisateur
 * Nettoie le token, l'utilisateur en mémoire et dans le storage
 */
export async function logout() {
  const { storage } = await import('./storage');
  
  // Clear in-memory state
  clearAuth();
  
  // Clear storage (works on both web and mobile)
  try {
    await storage.removeItem('token');
    await storage.removeItem('user');
  } catch (error) {
    console.error('Error clearing storage during logout:', error);
  }
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}), ...(init?.headers || {}) },
      ...init,
    });
    if (!res.ok) {
      let body: any = undefined;
      try {
        body = await res.json();
      } catch {}
      const errMsg = body?.error || `HTTP ${res.status}`;
      showError(errMsg);
      throw new Error(errMsg);
    }
    return (await res.json()) as T;
  } catch (e: any) {
    if (e.message && !e.message.startsWith('HTTP')) {
      showError('Erreur réseau - vérifiez votre connexion');
    }
    throw e;
  }
}

export async function createUser(firstName: string, lastName: string, email?: string) {
  return http<ApiUser>('/users', {
    method: 'POST',
    body: JSON.stringify({ firstName, lastName, email }),
  });
}

export async function createWorkEntry(entry: Omit<ApiWorkEntry, 'id'>) {
  const result = await http<ApiWorkEntry>('/work-entries', {
    method: 'POST',
    body: JSON.stringify(entry),
  });
  
  // Nettoyer le cache pour forcer le rechargement
  const cacheKey = `work-entries-${entry.userId}`;
  await cacheClear(cacheKey);
  
  return result;
}

export async function listWorkEntries(userId?: string, skipCache = false) {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  const cacheKey = `work-entries-${userId || 'all'}`;
  
  if (!skipCache) {
    const cached = await cacheGet<ApiWorkEntry[]>(cacheKey);
    if (cached) return cached;
  }
  
  const data = await http<ApiWorkEntry[]>(`/work-entries${query}`);
  await cacheSet(cacheKey, data);
  return data;
}

export async function signup(data: { firstName: string; lastName: string; email: string; password: string }) {
  return http<{ token: string; user: ApiUser }>(`/auth/signup`, { method: 'POST', body: JSON.stringify(data) });
}

export async function login(data: { email: string; password: string }) {
  return http<{ token: string; user: ApiUser }>(`/auth/login`, { method: 'POST', body: JSON.stringify(data) });
}

export async function updateWorkEntry(id: string, entry: Partial<Omit<ApiWorkEntry, 'id'>>) {
  const result = await http<ApiWorkEntry>(`/work-entries/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(entry),
  });
  
  // Nettoyer le cache pour forcer le rechargement
  if (entry.userId) {
    const cacheKey = `work-entries-${entry.userId}`;
    await cacheClear(cacheKey);
  }
  
  return result;
}

export async function deleteWorkEntry(id: string) {
  const result = await http<void>(`/work-entries/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  
  // Nettoyer tous les caches de work-entries car on ne connaît pas le userId
  // Cette approche est plus robuste
  await cacheClear('work-entries-all');
  
  return result;
}

export async function updateUser(id: string, data: Partial<ApiUser>) {
  return http<ApiUser>(`/users/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteUser(id: string) {
  return http<void>(`/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function invoicePreview(params: { userId: string; from?: string; to?: string; hourlyRate?: number }) {
  return http<{ userId: string; from: string | null; to: string | null; totalHours: number; totalAmount: number; lines: { entryId: string; date: string; hours: number; amount: number; category: string; rate: number; }[] }>(`/invoice-preview`, {
    method: 'POST',
    body: JSON.stringify({
      startDate: params.from,
      endDate: params.to,
      hourlyRate: params.hourlyRate || 0,
    }),
  });
}



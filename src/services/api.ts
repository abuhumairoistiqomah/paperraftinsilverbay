import { PengaduanItem, AkunItem, AppsScriptConfig } from '../types';
import { INITIAL_PENGADUAN } from '../data/initialData';

export const DEFAULT_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyV1rrxu6IbtkDiNpR1TJSwg610zerE3MYtbraLSw5szn1hiucCVG7YpMf4nVjaqH8heQ/exec';

const CONFIG_KEY = 'wakil_kurikulum_script_config';
const PENGADUAN_KEY = 'wakil_kurikulum_pengaduan_data';
const LEGACY_SESSION_KEY = 'wakil_kurikulum_current_user';
const AUTH_SESSION_KEY = 'wakil_kurikulum_auth_session_v3';
const PENDING_WRITES_KEY = 'wakil_kurikulum_pending_writes_v2';
const DRAFT_PREFIX = 'wakil_kurikulum_draft_v2:';
const REQUEST_TIMEOUT_MS = 25000;
const LOGIN_TIMEOUT_MS = 45000;

export interface AuthSessionRecord {
  token: string;
  user: AkunItem;
  expiresAt: string;
}

export interface LoginResponse {
  status: 'success' | 'error';
  message?: string;
  user: AkunItem;
  token: string;
  expiresAt: string;
}

export type PendingWriteAction = 'savePengaduan' | 'deletePengaduan';

export interface PendingWriteItem {
  id: string;
  action: PendingWriteAction;
  keyid: string;
  payload: any;
  createdAt: string;
  updatedAt: string;
  attempts: number;
  lastError?: string;
}

export interface LocalDraftRecord {
  data: PengaduanItem;
  updatedAt: string;
}

export interface SavePengaduanResult {
  success: boolean;
  item: PengaduanItem;
  message: string;
  synced: boolean;
  pendingCount: number;
}

export interface DeletePengaduanResult {
  success: boolean;
  message: string;
  synced: boolean;
  pendingCount: number;
}

export class AuthRequiredError extends Error {
  code: string;

  constructor(message = 'Login diperlukan untuk melanjutkan sinkronisasi.', code = 'AUTH_REQUIRED') {
    super(message);
    this.name = 'AuthRequiredError';
    this.code = code;
  }
}

class NetworkError extends Error {
  isNetworkError = true;

  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function safeRandomId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}${crypto.randomUUID()}`;
  }
  return `${prefix}${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function isAuthErrorCode(code: unknown): boolean {
  return [
    'AUTH_REQUIRED',
    'AUTH_EXPIRED',
    'AUTH_REVOKED',
    'SESSION_SCHEMA_ERROR',
  ].includes(String(code || '').toUpperCase());
}

function notifyPendingChanged(items?: PendingWriteItem[]): void {
  if (typeof window === 'undefined') return;
  const queue = items || StorageService.getPendingWrites();
  window.dispatchEvent(
    new CustomEvent('wakasek_pending_sync_change', {
      detail: { count: queue.length, pendingWrites: queue },
    })
  );
}

function notifyAuthRequired(message?: string, code?: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('wakasek_auth_required', {
      detail: {
        message: message || 'Sesi login berakhir. Login kembali untuk melanjutkan sinkronisasi.',
        code: code || 'AUTH_REQUIRED',
      },
    })
  );
}

export class StorageService {
  static getConfig(): AppsScriptConfig {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (!parsed.webAppUrl || !parsed.webAppUrl.trim()) {
          parsed.webAppUrl = DEFAULT_SCRIPT_URL;
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse config:', e);
      }
    }

    return {
      webAppUrl: DEFAULT_SCRIPT_URL,
      isAutoSync: true,
    };
  }

  static saveConfig(config: AppsScriptConfig): void {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }

  static getScriptUrl(): string {
    const config = StorageService.getConfig();
    if (config.webAppUrl && config.webAppUrl.trim()) {
      return config.webAppUrl.trim();
    }
    return DEFAULT_SCRIPT_URL;
  }

  // ---------------------------------------------------------------------------
  // Auth session. Password is NEVER stored in the browser.
  // ---------------------------------------------------------------------------
  static getAuthSession(): AuthSessionRecord | null {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      if (!parsed?.token || !parsed?.user || !parsed?.expiresAt) return null;
      return parsed as AuthSessionRecord;
    } catch (e) {
      console.error('Failed to parse auth session:', e);
      return null;
    }
  }

  static setAuthSession(session: AuthSessionRecord | null): void {
    // Remove the old pre-token login marker so an old build can never be mistaken
    // for an authenticated session after the privacy upgrade.
    localStorage.removeItem(LEGACY_SESSION_KEY);

    if (!session) {
      localStorage.removeItem(AUTH_SESSION_KEY);
      return;
    }

    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  }

  static clearAuthSession(): void {
    localStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(LEGACY_SESSION_KEY);
  }

  static getCurrentUser(): AkunItem | null {
    return StorageService.getAuthSession()?.user || null;
  }

  static getSessionToken(): string {
    return String(StorageService.getAuthSession()?.token || '');
  }

  static isLocalSessionExpired(): boolean {
    const session = StorageService.getAuthSession();
    if (!session) return true;
    const expiresAt = new Date(session.expiresAt).getTime();
    return !Number.isFinite(expiresAt) || expiresAt <= Date.now();
  }

  // Kept for older callers; user-only markers are no longer accepted as auth.
  static setCurrentUser(user: AkunItem | null): void {
    if (!user) StorageService.clearAuthSession();
  }

  static clearCurrentUser(): void {
    StorageService.clearAuthSession();
  }

  // Local canonical view. This is the user's safety copy, NOT just a disposable server cache.
  static getLocalPengaduan(): PengaduanItem[] {
    const raw = localStorage.getItem(PENGADUAN_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Failed to parse local pengaduan:', e);
      }
    }

    localStorage.setItem(PENGADUAN_KEY, JSON.stringify(INITIAL_PENGADUAN));
    return [...INITIAL_PENGADUAN];
  }

  static saveLocalPengaduan(items: PengaduanItem[]): void {
    localStorage.setItem(PENGADUAN_KEY, JSON.stringify(items));
  }

  static getPendingWrites(): PendingWriteItem[] {
    try {
      const raw = localStorage.getItem(PENDING_WRITES_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('[Pending Sync] Failed to read queue:', e);
      return [];
    }
  }

  static savePendingWrites(items: PendingWriteItem[]): void {
    localStorage.setItem(PENDING_WRITES_KEY, JSON.stringify(items));
    notifyPendingChanged(items);
  }

  static getDraft(draftKey: string): LocalDraftRecord | null {
    if (!draftKey) return null;
    try {
      const raw = localStorage.getItem(`${DRAFT_PREFIX}${draftKey}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.data) return null;
      return parsed as LocalDraftRecord;
    } catch (e) {
      console.error('[Draft] Failed to read draft:', e);
      return null;
    }
  }

  static saveDraft(draftKey: string, data: PengaduanItem): void {
    if (!draftKey) return;
    const record: LocalDraftRecord = { data, updatedAt: nowIso() };
    localStorage.setItem(`${DRAFT_PREFIX}${draftKey}`, JSON.stringify(record));
  }

  static clearDraft(draftKey: string): void {
    if (!draftKey) return;
    localStorage.removeItem(`${DRAFT_PREFIX}${draftKey}`);
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err: any) {
    if (err?.name === 'AbortError' || controller.signal.aborted) {
      throw new NetworkError(
        `Koneksi ke Google Apps Script melewati batas waktu ${Math.round(timeoutMs / 1000)} detik.`
      );
    }
    throw new NetworkError(err?.message || 'Koneksi jaringan gagal.');
  } finally {
    window.clearTimeout(timer);
  }
}

async function parseJsonResponse(response: Response): Promise<any> {
  if (!response.ok) {
    throw new NetworkError(`Google Apps Script merespons HTTP ${response.status}.`);
  }

  try {
    return await response.json();
  } catch {
    throw new NetworkError('Respons Google Apps Script bukan JSON yang valid.');
  }
}

async function postPublic(action: string, payload: Record<string, any> = {}, timeoutMs = REQUEST_TIMEOUT_MS): Promise<any> {
  const scriptUrl = StorageService.getScriptUrl();
  if (!scriptUrl) throw new NetworkError('URL Google Apps Script belum tersedia.');

  const response = await fetchWithTimeout(
    scriptUrl,
    {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...payload }),
    },
    timeoutMs
  );

  return parseJsonResponse(response);
}

async function postAuthenticated(action: string, payload: Record<string, any> = {}): Promise<any> {
  const token = StorageService.getSessionToken();
  if (!token) {
    const error = new AuthRequiredError('Login diperlukan untuk mengakses data privat.');
    notifyAuthRequired(error.message, error.code);
    throw error;
  }

  const result = await postPublic(action, { token, ...payload });

  if (result?.status !== 'success') {
    if (isAuthErrorCode(result?.code)) {
      const error = new AuthRequiredError(
        result?.message || 'Sesi login berakhir. Silakan login kembali.',
        result?.code || 'AUTH_REQUIRED'
      );
      notifyAuthRequired(error.message, error.code);
      throw error;
    }

    throw new Error(result?.message || 'Google Apps Script menolak permintaan.');
  }

  return result;
}

function normalizeServerRow(row: any): PengaduanItem {
  return {
    keyid: row.keyid || `PENG-${Math.floor(Math.random() * 8999 + 1000)}`,
    tanggal: row.tanggal || new Date().toISOString().split('T')[0],
    pesan: row.pesan || '',
    jenis: row.jenis || 'Masukan',
    pengirim: row.pengirim || 'Guru',
    pihakterlibat: row.pihakterlibat || '',
    kelas: row.kelas || '',
    metode: row.metode || 'Tatap Muka',
    topikumum: row.topikumum || '',
    tersampaikan: row.tersampaikan || 'Belum',
    forum: row.forum || '',
    respon: row.respon || '',
    tanggaldisampaikan: row.tanggaldisampaikan || '',
    updateterakhir: row.updateterakhir || '',
  };
}

function upsertLocal(item: PengaduanItem): void {
  const local = StorageService.getLocalPengaduan();
  const idx = local.findIndex((p) => p.keyid === item.keyid);
  const next = [...local];
  if (idx >= 0) next[idx] = item;
  else next.unshift(item);
  StorageService.saveLocalPengaduan(next);
}

function deleteLocal(keyid: string): void {
  StorageService.saveLocalPengaduan(
    StorageService.getLocalPengaduan().filter((p) => p.keyid !== keyid)
  );
}

function enqueuePending(action: PendingWriteAction, keyid: string, payload: any): PendingWriteItem {
  const queue = StorageService.getPendingWrites();
  const now = nowIso();
  const idx = queue.findIndex((item) => item.keyid === keyid);

  if (idx >= 0) {
    queue[idx] = {
      ...queue[idx],
      action,
      payload,
      updatedAt: now,
      attempts: 0,
      lastError: undefined,
    };
    StorageService.savePendingWrites(queue);
    return queue[idx];
  }

  const item: PendingWriteItem = {
    id: safeRandomId('PENDING_'),
    action,
    keyid,
    payload,
    createdAt: now,
    updatedAt: now,
    attempts: 0,
  };

  queue.push(item);
  StorageService.savePendingWrites(queue);
  return item;
}

function removePendingIfUnchanged(id: string, expectedUpdatedAt: string): void {
  const queue = StorageService.getPendingWrites();
  const current = queue.find((item) => item.id === id);
  if (current && current.updatedAt !== expectedUpdatedAt) return;
  StorageService.savePendingWrites(queue.filter((item) => item.id !== id));
}

function markPendingError(id: string, expectedUpdatedAt: string, error: any): void {
  const queue = StorageService.getPendingWrites();
  const idx = queue.findIndex((item) => item.id === id);
  if (idx < 0 || queue[idx].updatedAt !== expectedUpdatedAt) return;

  queue[idx] = {
    ...queue[idx],
    attempts: (queue[idx].attempts || 0) + 1,
    lastError: String(error?.message || error || 'Sinkronisasi gagal'),
  };
  StorageService.savePendingWrites(queue);
}

function mergeServerWithPending(serverItems: PengaduanItem[]): PengaduanItem[] {
  const map = new Map<string, PengaduanItem>();
  (serverItems || []).forEach((item) => map.set(item.keyid, item));

  StorageService.getPendingWrites()
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .forEach((pending) => {
      if (pending.action === 'deletePengaduan') {
        map.delete(pending.keyid);
        return;
      }

      const item = pending.payload?.item as PengaduanItem | undefined;
      if (item) map.set(item.keyid, item);
    });

  return Array.from(map.values());
}

let flushPromise: Promise<{
  syncedCount: number;
  remainingCount: number;
  failedCount: number;
}> | null = null;

async function postPending(pending: PendingWriteItem): Promise<any> {
  return postAuthenticated(pending.action, pending.payload);
}

export class ApiService {
  static getPendingWrites(): PendingWriteItem[] {
    return StorageService.getPendingWrites();
  }

  static getPendingCount(): number {
    return StorageService.getPendingWrites().length;
  }

  static hasUsableLocalSession(): boolean {
    return Boolean(StorageService.getAuthSession()) && !StorageService.isLocalSessionExpired();
  }

  static async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const result = await postPublic(
        'login',
        { username, password },
        LOGIN_TIMEOUT_MS
      );

      if (result?.status !== 'success') {
        throw new Error(result?.message || 'Username atau password salah.');
      }

      if (!result.user || !result.token || !result.expiresAt) {
        throw new Error('Respons login tidak memiliki sesi autentikasi yang lengkap.');
      }

      const session: AuthSessionRecord = {
        token: String(result.token),
        user: result.user as AkunItem,
        expiresAt: String(result.expiresAt),
      };

      StorageService.setAuthSession(session);
      return result as LoginResponse;
    } catch (err: any) {
      if (err?.isNetworkError || err?.name === 'NetworkError') {
        throw new Error('Tidak dapat terhubung ke server login. Periksa koneksi internet Anda.');
      }
      throw err;
    }
  }

  static async validateSession(): Promise<AkunItem> {
    const session = StorageService.getAuthSession();
    if (!session) {
      throw new AuthRequiredError('Belum ada sesi login.');
    }

    if (StorageService.isLocalSessionExpired()) {
      StorageService.clearAuthSession();
      throw new AuthRequiredError('Sesi lokal telah kedaluwarsa. Silakan login kembali.', 'AUTH_EXPIRED');
    }

    const result = await postAuthenticated('validateSession');
    const nextSession: AuthSessionRecord = {
      token: session.token,
      user: (result.user || session.user) as AkunItem,
      expiresAt: String(result.expiresAt || session.expiresAt),
    };
    StorageService.setAuthSession(nextSession);
    return nextSession.user;
  }

  static async logout(): Promise<void> {
    const token = StorageService.getSessionToken();
    // Local logout is immediate. Server revocation is best-effort afterward.
    StorageService.clearAuthSession();

    if (!token) return;

    try {
      const result = await postPublic('logout', { token });
      if (result?.status !== 'success') {
        console.warn('[Auth] Server logout response:', result);
      }
    } catch (err) {
      console.warn('[Auth] Server logout could not be confirmed:', err);
    }
  }

  static async flushPendingWrites(): Promise<{
    syncedCount: number;
    remainingCount: number;
    failedCount: number;
  }> {
    if (flushPromise) return flushPromise;

    flushPromise = (async () => {
      let syncedCount = 0;
      let failedCount = 0;
      const snapshot = StorageService.getPendingWrites();

      for (const pending of snapshot) {
        try {
          await postPending(pending);
          removePendingIfUnchanged(pending.id, pending.updatedAt);
          syncedCount++;
        } catch (err: any) {
          if (err instanceof AuthRequiredError || err?.name === 'AuthRequiredError') {
            // Keep the queue exactly as-is. Re-login will continue from here.
            notifyAuthRequired(err.message, err.code);
            throw err;
          }

          markPendingError(pending.id, pending.updatedAt, err);
          failedCount++;
          console.warn(`[Pending Sync] ${pending.action} ${pending.keyid} gagal:`, err);

          if (err?.isNetworkError || err?.name === 'NetworkError') break;
        }
      }

      const remainingCount = StorageService.getPendingWrites().length;
      if (syncedCount > 0) {
        const config = StorageService.getConfig();
        StorageService.saveConfig({
          ...config,
          lastSynced: new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        });
      }

      return { syncedCount, remainingCount, failedCount };
    })();

    try {
      return await flushPromise;
    } finally {
      flushPromise = null;
    }
  }

  static async testConnection(url: string): Promise<{ success: boolean; message: string }> {
    if (!url || !url.trim().startsWith('http')) {
      return {
        success: false,
        message: 'URL Google Apps Script tidak valid. Harus dimulai dengan http:// atau https://',
      };
    }

    try {
      const cleanUrl = url.trim();
      const testUrl = cleanUrl.includes('?') ? `${cleanUrl}&action=ping` : `${cleanUrl}?action=ping`;
      const res = await fetchWithTimeout(testUrl, { method: 'GET', mode: 'cors' });
      const json = await parseJsonResponse(res);

      if (json.status === 'success') {
        return {
          success: true,
          message: json.message || 'Koneksi Google Apps Script berhasil. Endpoint data tetap privat.',
        };
      }

      return {
        success: false,
        message: json.message || 'Respons Google Apps Script menunjukkan error.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal terhubung ke Google Apps Script: ${err.message || 'Network error / CORS restrictions'}`,
      };
    }
  }

  static async fetchAllData(): Promise<{
    pengaduan: PengaduanItem[];
    isOnline: boolean;
    error?: string;
    pendingCount: number;
  }> {
    const localPengaduan = StorageService.getLocalPengaduan();

    try {
      await this.flushPendingWrites();
    } catch (err: any) {
      if (err instanceof AuthRequiredError || err?.name === 'AuthRequiredError') throw err;
      console.warn('[Pending Sync] Pre-fetch flush failed:', err);
    }

    try {
      const result = await postAuthenticated('getAllData');
      const serverItems: PengaduanItem[] = Array.isArray(result.data)
        ? result.data.map(normalizeServerRow)
        : [];

      const merged = mergeServerWithPending(serverItems);
      StorageService.saveLocalPengaduan(merged);

      const config = StorageService.getConfig();
      StorageService.saveConfig({
        ...config,
        lastSynced: new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });

      return {
        pengaduan: merged,
        isOnline: true,
        pendingCount: this.getPendingCount(),
      };
    } catch (err: any) {
      if (err instanceof AuthRequiredError || err?.name === 'AuthRequiredError') throw err;

      if (err?.isNetworkError || err?.name === 'NetworkError') {
        console.warn('Using protected local storage:', err);
        return {
          pengaduan: localPengaduan,
          isOnline: false,
          pendingCount: this.getPendingCount(),
          error: `Google Sheet belum dapat dijangkau (${err.message}). Data lokal tetap aman.`,
        };
      }

      throw err;
    }
  }

  private static triggerBackgroundSync(): void {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    if (!StorageService.getSessionToken()) {
      notifyAuthRequired(
        'Perubahan sudah aman di perangkat. Login kembali untuk melanjutkan sinkronisasi.',
        'AUTH_REQUIRED'
      );
      return;
    }

    void this.flushPendingWrites()
      .then(() => {
        if (this.getPendingCount() > 0) return this.flushPendingWrites();
        return undefined;
      })
      .catch((err) => {
        if (err instanceof AuthRequiredError || err?.name === 'AuthRequiredError') return;
        console.warn('[Pending Sync] Background sync tertunda:', err);
      });
  }

  // Save means "safe now". It NEVER waits for internet or session refresh.
  static async savePengaduan(item: PengaduanItem): Promise<SavePengaduanResult> {
    upsertLocal(item);
    enqueuePending('savePengaduan', item.keyid, { item });
    this.triggerBackgroundSync();

    return {
      success: true,
      item,
      synced: false,
      pendingCount: this.getPendingCount(),
      message: 'Data sudah aman tersimpan di perangkat. Sinkronisasi terenkripsi-sesi berjalan di latar belakang.',
    };
  }

  static async deletePengaduan(keyid: string): Promise<DeletePengaduanResult> {
    deleteLocal(keyid);
    enqueuePending('deletePengaduan', keyid, { keyid });
    this.triggerBackgroundSync();

    return {
      success: true,
      synced: false,
      pendingCount: this.getPendingCount(),
      message: 'Data langsung dihapus dari perangkat. Penghapusan server berjalan di latar belakang.',
    };
  }

  static generateNextKeyId(items: PengaduanItem[]): string {
    const year = new Date().getFullYear();
    const prefix = `PENG-${year}-`;
    let maxNum = 0;

    items.forEach((item) => {
      if (item.keyid && item.keyid.startsWith(prefix)) {
        const parts = item.keyid.split('-');
        const num = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });

    return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
  }
}

import { PengaduanItem, AkunItem, AppsScriptConfig } from '../types';
import { INITIAL_PENGADUAN } from '../data/initialData';

export const DEFAULT_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyV1rrxu6IbtkDiNpR1TJSwg610zerE3MYtbraLSw5szn1hiucCVG7YpMf4nVjaqH8heQ/exec';

const CONFIG_KEY = 'wakil_kurikulum_script_config';
const PENGADUAN_KEY = 'wakil_kurikulum_pengaduan_data';
const SESSION_KEY = 'wakil_kurikulum_current_user';
const PENDING_WRITES_KEY = 'wakil_kurikulum_pending_writes_v2';
const DRAFT_PREFIX = 'wakil_kurikulum_draft_v2:';
const REQUEST_TIMEOUT_MS = 25000;

export interface LoginResponse {
  status: 'success' | 'error';
  message?: string;
  user: AkunItem;
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

function nowIso(): string {
  return new Date().toISOString();
}

function safeRandomId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}${crypto.randomUUID()}`;
  }
  return `${prefix}${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
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

export class StorageService {
  // Config
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

  // Session
  static getCurrentUser(): AkunItem | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        const user = JSON.parse(raw);
        if (user && user.password) delete user.password;
        return user;
      } catch (e) {
        console.error('Failed to parse user session:', e);
      }
    }
    return null;
  }

  static setCurrentUser(user: AkunItem | null): void {
    if (user) {
      const { password, ...safeUser } = user as any;
      localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  static clearCurrentUser(): void {
    localStorage.removeItem(SESSION_KEY);
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

  // Pending write queue
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

  // Form drafts
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

class NetworkError extends Error {
  isNetworkError = true;
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err: any) {
    if (err?.name === 'AbortError' || controller.signal.aborted) {
      throw new NetworkError(`Koneksi ke Google Apps Script melewati batas waktu ${Math.round(timeoutMs / 1000)} detik.`);
    }
    throw new NetworkError(err?.message || 'Koneksi jaringan gagal.');
  } finally {
    window.clearTimeout(timer);
  }
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
    // Latest intention wins for one logical record.
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
  // If the user edited the same record while this request was in flight, keep the newer intent queued.
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
    // Do not change updatedAt here: it is the version token for the queued user intent.
  };
  StorageService.savePendingWrites(queue);
}

function mergeServerWithPending(serverItems: PengaduanItem[]): PengaduanItem[] {
  const map = new Map<string, PengaduanItem>();
  (serverItems || []).forEach((item) => map.set(item.keyid, item));

  // Pending operations represent the user's newest intention and always win over stale server snapshots.
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

let flushPromise: Promise<{ syncedCount: number; remainingCount: number; failedCount: number }> | null = null;

async function postRaw(action: PendingWriteAction, payload: any): Promise<any> {
  const scriptUrl = StorageService.getScriptUrl();
  if (!scriptUrl) throw new NetworkError('URL Google Apps Script belum tersedia.');

  const res = await fetchWithTimeout(scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload }),
  });

  if (!res.ok) throw new NetworkError(`Google Apps Script merespons HTTP ${res.status}.`);

  let result: any;
  try {
    result = await res.json();
  } catch {
    throw new NetworkError('Respons Google Apps Script bukan JSON yang valid.');
  }

  if (result?.status !== 'success') {
    throw new Error(result?.message || 'Google Apps Script menolak perubahan data.');
  }

  return result;
}

export class ApiService {
  static getPendingWrites(): PendingWriteItem[] {
    return StorageService.getPendingWrites();
  }

  static getPendingCount(): number {
    return StorageService.getPendingWrites().length;
  }

  static async flushPendingWrites(): Promise<{ syncedCount: number; remainingCount: number; failedCount: number }> {
    if (flushPromise) return flushPromise;

    flushPromise = (async () => {
      let syncedCount = 0;
      let failedCount = 0;
      const snapshot = StorageService.getPendingWrites();

      for (const pending of snapshot) {
        try {
          await postRaw(pending.action, pending.payload);
          removePendingIfUnchanged(pending.id, pending.updatedAt);
          syncedCount++;
        } catch (err: any) {
          markPendingError(pending.id, pending.updatedAt, err);
          failedCount++;
          console.warn(`[Pending Sync] ${pending.action} ${pending.keyid} gagal:`, err);

          // Network failure: later records are unlikely to work either; stop and retry later.
          if (err?.isNetworkError || err?.name === 'NetworkError') break;
          // Server validation error: keep it queued, but allow unrelated records to continue.
        }
      }

      const remainingCount = StorageService.getPendingWrites().length;
      if (syncedCount > 0) {
        const config = StorageService.getConfig();
        StorageService.saveConfig({
          ...config,
          lastSynced: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
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

  // Test connection to Google Apps Script Web App
  static async testConnection(url: string): Promise<{ success: boolean; message: string }> {
    if (!url || !url.trim().startsWith('http')) {
      return { success: false, message: 'URL Google Apps Script tidak valid. Harus dimulai dengan http:// atau https://' };
    }
    try {
      const cleanUrl = url.trim();
      const testUrl = cleanUrl.includes('?') ? `${cleanUrl}&action=ping` : `${cleanUrl}?action=ping`;
      const res = await fetchWithTimeout(testUrl, { method: 'GET', mode: 'cors' });
      if (!res.ok) return { success: false, message: `Server merespon dengan status ${res.status}` };
      const json = await res.json();
      if (json.status === 'success') return { success: true, message: json.message || 'Koneksi ke Google Sheet berhasil!' };
      return { success: false, message: json.message || 'Respon Google Sheet menunjukkan error.' };
    } catch (err: any) {
      return { success: false, message: `Gagal terhubung ke Google Apps Script: ${err.message || 'Network error / CORS restrictions'}` };
    }
  }

  // Server-side login validation via doPost()
  static async login(username: string, password: string): Promise<LoginResponse> {
    const scriptUrl = StorageService.getScriptUrl();
    if (!scriptUrl) throw new Error('URL Google Apps Script belum tersedia.');

    try {
      const response = await fetchWithTimeout(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'login', username, password }),
      }, 45000);

      if (!response.ok) throw new Error('Tidak dapat terhubung ke server login.');
      const result = await response.json();
      if (result.status !== 'success') throw new Error(result.message || 'Username atau password salah.');
      if (!result.user) throw new Error('Respons login tidak memiliki data pengguna.');
      return result as LoginResponse;
    } catch (err: any) {
      if (err?.isNetworkError || err?.name === 'NetworkError') {
        throw new Error('Tidak dapat terhubung ke server login. Periksa koneksi internet Anda.');
      }
      throw err;
    }
  }

  // Server refresh is now SAFE: pending local intent is merged on top of the server snapshot.
  static async fetchAllData(): Promise<{ pengaduan: PengaduanItem[]; isOnline: boolean; error?: string; pendingCount: number }> {
    const localPengaduan = StorageService.getLocalPengaduan();
    const scriptUrl = StorageService.getScriptUrl();

    // Best effort: push local queue first, so a following GET is less likely to be stale.
    try {
      await this.flushPendingWrites();
    } catch (e) {
      console.warn('[Pending Sync] Pre-fetch flush failed:', e);
    }

    try {
      const res = await fetchWithTimeout(scriptUrl, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      if (result.status !== 'success') throw new Error(result.message || 'Error dari script');

      const serverItems: PengaduanItem[] = Array.isArray(result.data)
        ? result.data.map(normalizeServerRow)
        : [];

      const merged = mergeServerWithPending(serverItems);
      StorageService.saveLocalPengaduan(merged);

      const config = StorageService.getConfig();
      StorageService.saveConfig({
        ...config,
        lastSynced: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      });

      return {
        pengaduan: merged,
        isOnline: true,
        pendingCount: this.getPendingCount(),
      };
    } catch (err: any) {
      console.warn('Using protected local storage:', err);
      return {
        pengaduan: localPengaduan,
        isOnline: false,
        pendingCount: this.getPendingCount(),
        error: `Google Sheet belum dapat dijangkau (${err.message}). Data lokal tetap aman.`,
      };
    }
  }

  private static triggerBackgroundSync(): void {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    void this.flushPendingWrites()
      .then(() => {
        // A second mutation may have arrived while the first queue snapshot was in flight.
        if (this.getPendingCount() > 0) return this.flushPendingWrites();
        return undefined;
      })
      .catch((err) => console.warn('[Pending Sync] Background sync tertunda:', err));
  }

  // Save means "safe now". It NEVER waits for the internet.
  static async savePengaduan(item: PengaduanItem): Promise<SavePengaduanResult> {
    upsertLocal(item);
    enqueuePending('savePengaduan', item.keyid, { item });
    this.triggerBackgroundSync();

    return {
      success: true,
      item,
      synced: false,
      pendingCount: this.getPendingCount(),
      message: 'Data sudah aman tersimpan di perangkat. Sinkronisasi Google Sheet berjalan di latar belakang.',
    };
  }

  // Delete is also immediate/offline-first. The tombstone prevents stale server data from resurrecting it.
  static async deletePengaduan(keyid: string): Promise<DeletePengaduanResult> {
    deleteLocal(keyid);
    enqueuePending('deletePengaduan', keyid, { keyid });
    this.triggerBackgroundSync();

    return {
      success: true,
      synced: false,
      pendingCount: this.getPendingCount(),
      message: 'Data langsung dihapus dari perangkat. Penghapusan Google Sheet berjalan di latar belakang.',
    };
  }

  // Human-readable ID. For this private single-user app it remains simple and familiar.
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

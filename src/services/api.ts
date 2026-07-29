import { PengaduanItem, AkunItem, AppsScriptConfig } from '../types';
import { INITIAL_PENGADUAN } from '../data/initialData';

export const DEFAULT_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyV1rrxu6IbtkDiNpR1TJSwg610zerE3MYtbraLSw5szn1hiucCVG7YpMf4nVjaqH8heQ/exec';

const CONFIG_KEY = 'wakil_kurikulum_script_config';
const PENGADUAN_KEY = 'wakil_kurikulum_pengaduan_data';
const SESSION_KEY = 'wakil_kurikulum_current_user';

export interface LoginResponse {
  status: 'success' | 'error';
  message?: string;
  user: AkunItem;
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
        // Ensure no password property exists
        if (user && user.password) {
          delete user.password;
        }
        return user;
      } catch (e) {
        console.error('Failed to parse user session:', e);
      }
    }
    return null;
  }

  static setCurrentUser(user: AkunItem | null): void {
    if (user) {
      // Clean password before persisting session
      const { password, ...safeUser } = user as any;
      localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  static clearCurrentUser(): void {
    localStorage.removeItem(SESSION_KEY);
  }

  // Local Pengaduan Data
  static getLocalPengaduan(): PengaduanItem[] {
    const raw = localStorage.getItem(PENGADUAN_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse local pengaduan:', e);
      }
    }
    // Initialize if empty
    localStorage.setItem(PENGADUAN_KEY, JSON.stringify(INITIAL_PENGADUAN));
    return INITIAL_PENGADUAN;
  }

  static saveLocalPengaduan(items: PengaduanItem[]): void {
    localStorage.setItem(PENGADUAN_KEY, JSON.stringify(items));
  }
}

// API Service
export class ApiService {
  // Test connection to Google Apps Script Web App
  static async testConnection(url: string): Promise<{ success: boolean; message: string }> {
    if (!url || !url.trim().startsWith('http')) {
      return { success: false, message: 'URL Google Apps Script tidak valid. Harus dimulai dengan http:// atau https://' };
    }
    try {
      const cleanUrl = url.trim();
      const testUrl = cleanUrl.includes('?') ? `${cleanUrl}&action=ping` : `${cleanUrl}?action=ping`;
      const res = await fetch(testUrl, { method: 'GET', mode: 'cors' });
      if (!res.ok) {
        return { success: false, message: `Server merespon dengan status ${res.status}` };
      }
      const json = await res.json();
      if (json.status === 'success') {
        return { success: true, message: json.message || 'Koneksi ke Google Sheet berhasil!' };
      } else {
        return { success: false, message: json.message || 'Respon Google Sheet menunjukkan error.' };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal terhubung ke Google Apps Script: ${err.message || 'Network error / CORS restrictions'}`
      };
    }
  }

  // Server-side login validation via doPost()
  static async login(username: string, password: string): Promise<LoginResponse> {
    const scriptUrl = StorageService.getScriptUrl();

    if (!scriptUrl) {
      throw new Error('URL Google Apps Script belum tersedia.');
    }

    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'login',
          username,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error('Tidak dapat terhubung ke server login.');
      }

      const result = await response.json();

      if (result.status !== 'success') {
        throw new Error(result.message || 'Username atau password salah.');
      }

      if (!result.user) {
        throw new Error('Respons login tidak memiliki data pengguna.');
      }

      return result as LoginResponse;
    } catch (err: any) {
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        throw new Error('Tidak dapat terhubung ke server login. Periksa koneksi internet Anda.');
      }
      throw err;
    }
  }

  // Fetch all pengaduan data from Apps Script or Local
  static async fetchAllData(): Promise<{ pengaduan: PengaduanItem[]; isOnline: boolean; error?: string }> {
    const config = StorageService.getConfig();
    const localPengaduan = StorageService.getLocalPengaduan();

    const scriptUrl = StorageService.getScriptUrl();

    try {
      const res = await fetch(scriptUrl, { method: 'GET' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const result = await res.json();
      if (result.status === 'success') {
        let fetchedPengaduan: PengaduanItem[] = [];

        if (Array.isArray(result.data)) {
          fetchedPengaduan = result.data.map((row: any) => ({
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
          }));
        }

        // Cache locally
        if (fetchedPengaduan.length > 0) {
          StorageService.saveLocalPengaduan(fetchedPengaduan);
        }

        StorageService.saveConfig({
          ...config,
          lastSynced: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        });

        return {
          pengaduan: fetchedPengaduan.length > 0 ? fetchedPengaduan : localPengaduan,
          isOnline: true,
        };
      } else {
        throw new Error(result.message || 'Error dari script');
      }
    } catch (err: any) {
      console.warn('Fallback to local storage:', err);
      return {
        pengaduan: localPengaduan,
        isOnline: false,
        error: `Gagal menyelaraskan dengan Google Sheet (${err.message}). Menggunakan data lokal.`,
      };
    }
  }

  // Save single Pengaduan
  static async savePengaduan(item: PengaduanItem): Promise<{ success: boolean; item: PengaduanItem; message: string }> {
    // 1. Update local state
    const local = StorageService.getLocalPengaduan();
    const existingIndex = local.findIndex((p) => p.keyid === item.keyid);
    let updatedLocal = [...local];

    if (existingIndex >= 0) {
      updatedLocal[existingIndex] = item;
    } else {
      updatedLocal = [item, ...updatedLocal];
    }
    StorageService.saveLocalPengaduan(updatedLocal);

    // 2. Try Apps Script POST if configured
    const scriptUrl = StorageService.getScriptUrl();
    if (scriptUrl) {
      try {
        const payload = {
          action: 'savePengaduan',
          item: item,
        };
        const res = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (result.status === 'success') {
          return {
            success: true,
            item: item,
            message: 'Data berhasil disimpan ke Google Sheet dan lokal!',
          };
        }
      } catch (e: any) {
        console.warn('Save online failed, fallback to local save:', e);
      }
    }

    return {
      success: true,
      item: item,
      message: 'Data berhasil disimpan ke Penyimpanan Lokal Browser!',
    };
  }

  // Delete Pengaduan
  static async deletePengaduan(keyid: string): Promise<{ success: boolean; message: string }> {
    const local = StorageService.getLocalPengaduan();
    const updated = local.filter((p) => p.keyid !== keyid);
    StorageService.saveLocalPengaduan(updated);

    const scriptUrl = StorageService.getScriptUrl();
    if (scriptUrl) {
      try {
        await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'deletePengaduan', keyid }),
        });
      } catch (e) {
        console.warn('Delete online failed:', e);
      }
    }

    return { success: true, message: 'Data pengaduan berhasil dihapus.' };
  }

  // Auto-generate keyid
  static generateNextKeyId(items: PengaduanItem[]): string {
    const year = new Date().getFullYear();
    const prefix = `PENG-${year}-`;
    let maxNum = 0;

    items.forEach((item) => {
      if (item.keyid && item.keyid.startsWith(prefix)) {
        const parts = item.keyid.split('-');
        const numStr = parts[parts.length - 1];
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });

    const nextNum = maxNum + 1;
    const formattedNum = nextNum.toString().padStart(3, '0');
    return `${prefix}${formattedNum}`;
  }
}

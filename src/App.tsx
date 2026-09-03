import React, { useState, useEffect, useCallback } from 'react';
import { PengaduanItem, AkunItem, ActiveTab } from './types';
import { StorageService, ApiService, AuthRequiredError } from './services/api';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { DashboardView } from './components/DashboardView';
import { HistorisView } from './components/HistorisView';
import { AnalisisView } from './components/AnalisisView';
import { ComplaintFormModal } from './components/ComplaintFormModal';
import { ComplaintDetailModal } from './components/ComplaintDetailModal';
import { AppsScriptGuideModal } from './components/AppsScriptGuideModal';
import { CheckCircle2, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';

export default function App() {
  const initialSession = StorageService.getAuthSession();

  const [currentUser, setCurrentUser] = useState<AkunItem | null>(initialSession?.user || null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(Boolean(initialSession));
  const [authNotice, setAuthNotice] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Local data is shown only after a usable authenticated session is established.
  // It remains the protected safety copy during temporary network outages.
  const [pengaduanItems, setPengaduanItems] = useState<PengaduanItem[]>(() => StorageService.getLocalPengaduan());
  const [pendingCount, setPendingCount] = useState<number>(() => ApiService.getPendingCount());
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<PengaduanItem | null>(null);
  const [detailItem, setDetailItem] = useState<PengaduanItem | null>(null);
  const [isScriptGuideOpen, setIsScriptGuideOpen] = useState(false);

  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    window.setTimeout(() => setToastMsg(null), 3500);
  }, []);

  const expireAuth = useCallback((message?: string) => {
    StorageService.clearAuthSession();
    setCurrentUser(null);
    setIsAuthChecking(false);
    setIsFormModalOpen(false);
    setEditItem(null);
    setDetailItem(null);
    setAuthNotice(
      message ||
        'Sesi login berakhir. Data lokal dan perubahan tertunda tetap aman; login kembali untuk melanjutkan.'
    );
  }, []);

  // On page reload, never expose the private dashboard merely because an old user object exists.
  // Validate the token online. If internet is unavailable, a not-yet-expired local session may work offline.
  useEffect(() => {
    const session = StorageService.getAuthSession();
    if (!session) {
      setCurrentUser(null);
      setIsAuthChecking(false);
      return;
    }

    if (StorageService.isLocalSessionExpired()) {
      expireAuth('Sesi login telah kedaluwarsa. Silakan login kembali.');
      return;
    }

    let cancelled = false;

    const restoreSession = async () => {
      if (!navigator.onLine) {
        if (!cancelled) {
          setIsOnline(false);
          setCurrentUser(session.user);
          setIsAuthChecking(false);
        }
        return;
      }

      try {
        const user = await ApiService.validateSession();
        if (!cancelled) {
          setCurrentUser(user);
          setIsOnline(true);
          setIsAuthChecking(false);
        }
      } catch (err: any) {
        if (cancelled) return;

        if (err instanceof AuthRequiredError || err?.name === 'AuthRequiredError') {
          expireAuth(err.message);
          return;
        }

        // Network failure is different from rejected authentication.
        // Keep the still-unexpired local session usable offline.
        if (ApiService.hasUsableLocalSession()) {
          setCurrentUser(session.user);
          setIsOnline(false);
          setIsAuthChecking(false);
          return;
        }

        expireAuth('Sesi tidak dapat diverifikasi. Silakan login kembali.');
      }
    };

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, [expireAuth]);

  const loadData = useCallback(async (silent = false) => {
    if (!StorageService.getAuthSession()) return;

    setIsSyncing(true);
    try {
      const res = await ApiService.fetchAllData();
      setPengaduanItems(res.pengaduan);
      setPendingCount(res.pendingCount);
      setIsOnline(res.isOnline);
      if (res.error && !silent) showToast(res.error, 'error');
    } catch (err: any) {
      console.error('Failed to load data:', err);

      if (err instanceof AuthRequiredError || err?.name === 'AuthRequiredError') {
        expireAuth(err.message);
        return;
      }

      setPengaduanItems(StorageService.getLocalPengaduan());
      setPendingCount(ApiService.getPendingCount());

      if (!silent) {
        showToast('Sinkronisasi gagal. Data lokal tetap aman.', 'error');
      }
    } finally {
      setIsSyncing(false);
    }
  }, [expireAuth, showToast]);

  useEffect(() => {
    if (currentUser && !isAuthChecking) void loadData(true);
  }, [currentUser, isAuthChecking, loadData]);

  useEffect(() => {
    const handlePendingChange = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      setPendingCount(Number(detail?.count ?? ApiService.getPendingCount()));
      setPengaduanItems(StorageService.getLocalPengaduan());
    };

    const handleAuthRequired = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      expireAuth(
        detail?.message ||
          'Sesi login berakhir. Perubahan lokal tetap aman. Login kembali untuk melanjutkan sinkronisasi.'
      );
    };

    const handleOnline = () => {
      setIsOnline(true);
      if (currentUser) void loadData(true);
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('wakasek_pending_sync_change', handlePendingChange as EventListener);
    window.addEventListener('wakasek_auth_required', handleAuthRequired as EventListener);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('wakasek_pending_sync_change', handlePendingChange as EventListener);
      window.removeEventListener('wakasek_auth_required', handleAuthRequired as EventListener);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser, expireAuth, loadData]);

  useEffect(() => {
    if (!currentUser || pendingCount === 0) return;

    const timer = window.setInterval(() => {
      if (navigator.onLine) void loadData(true);
    }, 30000);

    return () => window.clearInterval(timer);
  }, [currentUser, pendingCount, loadData]);

  const handleLoginSuccess = (user: AkunItem) => {
    setAuthNotice('');
    setCurrentUser(user);
    setIsAuthChecking(false);
    showToast(`Selamat datang, ${user.nama || user.username}!`);
  };

  const handleLogout = () => {
    void ApiService.logout();
    setCurrentUser(null);
    setIsAuthChecking(false);
    setIsFormModalOpen(false);
    setEditItem(null);
    setDetailItem(null);
    setAuthNotice('Anda telah keluar dari sistem.');
  };

  const handleOpenNewModal = () => {
    setEditItem(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (item: PengaduanItem) => {
    setEditItem(item);
    setIsFormModalOpen(true);
  };

  const handleOpenDetailModal = (item: PengaduanItem) => setDetailItem(item);

  const handleSaveItem = async (item: PengaduanItem): Promise<void> => {
    const res = await ApiService.savePengaduan(item);
    setPengaduanItems(StorageService.getLocalPengaduan());
    setPendingCount(res.pendingCount);
    if (res.synced) setIsOnline(true);
    showToast(res.message, 'success');
  };

  const handleDeleteItem = async (keyid: string) => {
    const res = await ApiService.deletePengaduan(keyid);
    setPengaduanItems(StorageService.getLocalPengaduan());
    setPendingCount(res.pendingCount);
    if (detailItem?.keyid === keyid) setDetailItem(null);
    showToast(res.message, 'success');
  };

  const handleToggleTersampaikan = async (item: PengaduanItem) => {
    const isCurrentlySudah = item.tersampaikan.trim().toLowerCase() === 'sudah';
    const newStatus = isCurrentlySudah ? 'Belum' : 'Sudah';
    const updated: PengaduanItem = {
      ...item,
      tersampaikan: newStatus,
      tanggaldisampaikan:
        newStatus === 'Sudah'
          ? new Date().toISOString().split('T')[0]
          : item.tanggaldisampaikan,
      updateterakhir:
        newStatus === 'Sudah'
          ? 'Status diubah menjadi tersampaikan'
          : 'Status diubah menjadi belum tersampaikan',
    };

    const res = await ApiService.savePengaduan(updated);
    setPengaduanItems(StorageService.getLocalPengaduan());
    setPendingCount(res.pendingCount);
    if (detailItem?.keyid === item.keyid) setDetailItem(updated);

    showToast(
      res.synced
        ? `Status ${item.keyid} diubah menjadi "${newStatus}" dan tersinkron.`
        : `Status ${item.keyid} aman di perangkat; sinkronisasi berjalan di latar belakang.`,
      'success'
    );
  };

  const handleManualSync = () => void loadData(false);

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100">
        <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-800 p-6 shadow-2xl text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-blue-300" />
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm font-black">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            Memverifikasi sesi privat...
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Data buku harian belum ditampilkan sampai sesi dinyatakan valid.
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onOpenScriptSetup={() => setIsScriptGuideOpen(true)}
          notice={authNotice}
        />
        <AppsScriptGuideModal
          isOpen={isScriptGuideOpen}
          onClose={() => setIsScriptGuideOpen(false)}
          onConfigUpdated={() => {
            StorageService.clearAuthSession();
            setCurrentUser(null);
            setAuthNotice('URL backend diperbarui. Silakan login ke server tersebut.');
          }}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-gray-900 font-sans selection:bg-blue-600 selection:text-white">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenNewModal={handleOpenNewModal}
        onOpenAppsScriptGuide={() => setIsScriptGuideOpen(true)}
        isOnline={isOnline}
        pendingCount={pendingCount}
        lastSynced={StorageService.getConfig().lastSynced}
        onSync={handleManualSync}
        isSyncing={isSyncing}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            items={pengaduanItems}
            onOpenNewModal={handleOpenNewModal}
            onOpenDetailModal={handleOpenDetailModal}
            onNavigateToHistoris={() => setActiveTab('historis')}
            onNavigateToAnalisis={() => setActiveTab('analisis')}
          />
        )}

        {activeTab === 'historis' && (
          <HistorisView
            items={pengaduanItems}
            onOpenNewModal={handleOpenNewModal}
            onOpenEditModal={handleOpenEditModal}
            onOpenDetailModal={handleOpenDetailModal}
            onDelete={handleDeleteItem}
            onToggleTersampaikan={handleToggleTersampaikan}
          />
        )}

        {activeTab === 'analisis' && (
          <AnalisisView
            items={pengaduanItems}
            onOpenNewModal={handleOpenNewModal}
            onOpenEditModal={handleOpenEditModal}
            onOpenDetailModal={handleOpenDetailModal}
          />
        )}
      </main>

      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-lg shadow-xl border text-xs font-bold flex items-center gap-2.5 ${
              toastMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-amber-50 text-amber-900 border-amber-300'
            }`}
          >
            {toastMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{toastMsg.text}</span>
          </div>
        </div>
      )}

      <ComplaintFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveItem}
        editItem={editItem}
        allItems={pengaduanItems}
      />

      <ComplaintDetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onEdit={handleOpenEditModal}
        onToggleTersampaikan={handleToggleTersampaikan}
      />

      <AppsScriptGuideModal
        isOpen={isScriptGuideOpen}
        onClose={() => setIsScriptGuideOpen(false)}
        onConfigUpdated={() => {
          StorageService.clearAuthSession();
          setCurrentUser(null);
          setAuthNotice('URL backend diperbarui. Silakan login kembali.');
        }}
      />
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { PengaduanItem, AkunItem, ActiveTab } from './types';
import { StorageService, ApiService } from './services/api';
import { Navbar } from './components/Navbar';
import { LoginPage } from './components/LoginPage';
import { DashboardView } from './components/DashboardView';
import { HistorisView } from './components/HistorisView';
import { AnalisisView } from './components/AnalisisView';
import { ComplaintFormModal } from './components/ComplaintFormModal';
import { ComplaintDetailModal } from './components/ComplaintDetailModal';
import { AppsScriptGuideModal } from './components/AppsScriptGuideModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AkunItem | null>(() => StorageService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Local data is shown immediately. Network refresh is reconciliation, never the only copy.
  const [pengaduanItems, setPengaduanItems] = useState<PengaduanItem[]>(() => StorageService.getLocalPengaduan());
  const [pendingCount, setPendingCount] = useState<number>(() => ApiService.getPendingCount());
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<PengaduanItem | null>(null);
  const [detailItem, setDetailItem] = useState<PengaduanItem | null>(null);
  const [isScriptGuideOpen, setIsScriptGuideOpen] = useState(false);

  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    window.setTimeout(() => setToastMsg(null), 3500);
  }, []);

  // Safe reconciliation: ApiService merges pending local writes on top of the server snapshot.
  const loadData = useCallback(async (silent = false) => {
    setIsSyncing(true);
    try {
      const res = await ApiService.fetchAllData();
      setPengaduanItems(res.pengaduan);
      setPendingCount(res.pendingCount);
      setIsOnline(res.isOnline);
      if (res.error && !silent) showToast(res.error, 'error');
    } catch (err: any) {
      console.error('Failed to load data:', err);
      // Never blank the UI on network failure; keep the protected local view.
      setPengaduanItems(StorageService.getLocalPengaduan());
      setPendingCount(ApiService.getPendingCount());
      setIsOnline(false);
      if (!silent) showToast('Sinkronisasi gagal. Data lokal tetap aman.', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (currentUser) void loadData(true);
  }, [currentUser, loadData]);

  // Keep the UI badge in sync with local queue mutations.
  useEffect(() => {
    const handlePendingChange = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      setPendingCount(Number(detail?.count ?? ApiService.getPendingCount()));
      setPengaduanItems(StorageService.getLocalPengaduan());
    };

    const handleOnline = () => {
      setIsOnline(true);
      if (currentUser) void loadData(true);
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('wakasek_pending_sync_change', handlePendingChange as EventListener);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('wakasek_pending_sync_change', handlePendingChange as EventListener);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser, loadData]);

  // If there is unfinished work, quietly retry in the background every 30 seconds.
  useEffect(() => {
    if (!currentUser || pendingCount === 0) return;
    const timer = window.setInterval(() => {
      if (navigator.onLine) void loadData(true);
    }, 30000);
    return () => window.clearInterval(timer);
  }, [currentUser, pendingCount, loadData]);

  const handleLoginSuccess = (user: AkunItem) => {
    setCurrentUser(user);
    showToast(`Selamat datang, ${user.nama || user.username}!`);
  };

  const handleLogout = () => {
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
    showToast('Berhasil keluar dari sistem.');
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

  // No loadData() after save. The local write is the immediate source of truth.
  const handleSaveItem = async (item: PengaduanItem): Promise<void> => {
    const res = await ApiService.savePengaduan(item);
    setPengaduanItems(StorageService.getLocalPengaduan());
    setPendingCount(res.pendingCount);
    if (res.synced) setIsOnline(true);
    showToast(res.message, 'success');
  };

  // Pending delete is a tombstone, so a stale GET cannot resurrect the deleted record.
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
      tanggaldisampaikan: newStatus === 'Sudah' ? new Date().toISOString().split('T')[0] : item.tanggaldisampaikan,
      updateterakhir: newStatus === 'Sudah' ? 'Status diubah menjadi tersampaikan' : 'Status diubah menjadi belum tersampaikan',
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

  if (!currentUser) {
    return (
      <>
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onOpenScriptSetup={() => setIsScriptGuideOpen(true)}
        />
        <AppsScriptGuideModal
          isOpen={isScriptGuideOpen}
          onClose={() => setIsScriptGuideOpen(false)}
          onConfigUpdated={() => void loadData(false)}
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
        onConfigUpdated={() => void loadData(false)}
      />
    </div>
  );
}

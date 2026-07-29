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
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AkunItem | null>(() => StorageService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [pengaduanItems, setPengaduanItems] = useState<PengaduanItem[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<PengaduanItem | null>(null);
  const [detailItem, setDetailItem] = useState<PengaduanItem | null>(null);
  const [isScriptGuideOpen, setIsScriptGuideOpen] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg(null);
    }, 3500);
  };

  // Load data function
  const loadData = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await ApiService.fetchAllData();
      setPengaduanItems(res.pengaduan);
      setIsOnline(res.isOnline);
      if (res.error) {
        showToast(res.error, 'error');
      }
    } catch (err: any) {
      console.error('Failed to load data:', err);
      showToast('Gagal memuat data dari database', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, loadData]);

  const handleLoginSuccess = (user: AkunItem) => {
    setCurrentUser(user);
    showToast(`Selamat datang, ${user.nama || user.username}!`);
  };

  const handleLogout = () => {
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
    showToast('Berhasil keluar dari sistem.');
  };

  // Open Form Modal for NEW item
  const handleOpenNewModal = () => {
    setEditItem(null);
    setIsFormModalOpen(true);
  };

  // Open Form Modal for EDIT item
  const handleOpenEditModal = (item: PengaduanItem) => {
    setEditItem(item);
    setIsFormModalOpen(true);
  };

  // Open Detail Modal
  const handleOpenDetailModal = (item: PengaduanItem) => {
    setDetailItem(item);
  };

  // Save Item (Create or Update)
  const handleSaveItem = async (item: PengaduanItem) => {
    const res = await ApiService.savePengaduan(item);
    if (res.success) {
      showToast(res.message);
      loadData();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Delete Item
  const handleDeleteItem = async (keyid: string) => {
    const res = await ApiService.deletePengaduan(keyid);
    if (res.success) {
      showToast(res.message);
      if (detailItem && detailItem.keyid === keyid) {
        setDetailItem(null);
      }
      loadData();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Toggle Status "Tersampaikan"
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
    if (res.success) {
      showToast(`Status ${item.keyid} diubah menjadi "${newStatus}"`);
      if (detailItem && detailItem.keyid === item.keyid) {
        setDetailItem(updated);
      }
      loadData();
    }
  };

  // Render Login Page if not logged in
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
          onConfigUpdated={loadData}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-gray-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenNewModal={handleOpenNewModal}
        onOpenAppsScriptGuide={() => setIsScriptGuideOpen(true)}
        isOnline={isOnline}
        onSync={loadData}
        isSyncing={isSyncing}
      />

      {/* Main Content Area */}
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

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-lg shadow-xl border text-xs font-bold flex items-center gap-2.5 ${
              toastMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
          >
            {toastMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toastMsg.text}</span>
          </div>
        </div>
      )}

      {/* Modals */}
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
        onConfigUpdated={loadData}
      />
    </div>
  );
}

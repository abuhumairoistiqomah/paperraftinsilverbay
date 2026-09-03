import React from 'react';
import { ActiveTab, AkunItem } from '../types';
import { 
  LayoutDashboard, 
  History, 
  BarChart3, 
  PlusCircle, 
  FileSpreadsheet, 
  LogOut, 
  User, 
  RefreshCw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: AkunItem | null;
  onLogout: () => void;
  onOpenNewModal: () => void;
  onOpenAppsScriptGuide: () => void;
  isOnline: boolean;
  pendingCount?: number;
  lastSynced?: string;
  onSync: () => void;
  isSyncing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  onOpenNewModal,
  onOpenAppsScriptGuide,
  isOnline,
  pendingCount = 0,
  lastSynced,
  onSync,
  isSyncing,
}) => {
  return (
    <header className="bg-[#1F2937] text-white border-b border-gray-700 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Tier */}
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-4 border-b border-gray-700/80">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white/10 p-1.5 rounded-2xl border border-white/25 flex items-center justify-center shadow-lg shrink-0 overflow-hidden hover:scale-105 transition-transform">
              <img src="https://raw.githubusercontent.com/abuhumairoistiqomah/paperraftinsilverbay/7c0dd338838b6212a84ebbd66a2dfdba11be9893/download.png" alt="Paper Raft Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                  Paper Raft in Silver Bay
                </h1>
                <span className="text-[10px] uppercase tracking-widest bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded border border-blue-500/30">
                  Dashboard Admin
                </span>
              </div>
              <p className="text-xs md:text-sm text-gray-300 mt-1 italic leading-relaxed max-w-2xl">
                "To save live, you must first understand what they live for and what they die for. The best achieve this is through personal experience"
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status Sync Badge */}
            <div 
              onClick={onOpenAppsScriptGuide}
              className={`cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 rounded font-mono text-[11px] font-semibold border transition-all ${
                pendingCount > 0
                  ? 'bg-amber-950/60 text-amber-300 border-amber-700 hover:bg-amber-900/60'
                  : isOnline 
                  ? 'bg-green-950/60 text-green-400 border-green-700 hover:bg-green-900/60' 
                  : 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700'
              }`}
              title="Klik untuk pengaturan integrasi Google Sheet"
            >
              {pendingCount > 0 ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>⚠ {pendingCount} perubahan aman lokal, belum tersinkron</span>
                </>
              ) : isOnline ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  <span>● Semua data tersinkron</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                  <span>● Offline • data lokal aman</span>
                </>
              )}
            </div>

            {/* Manual Sync Button */}
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded font-medium border border-gray-600 transition-colors disabled:opacity-50 text-xs"
              title={pendingCount > 0 ? `Sinkronkan ${pendingCount} perubahan tertunda` : 'Sinkronkan data terbaru'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Sinkron...' : pendingCount > 0 ? `Sinkronkan (${pendingCount})` : 'Refresh'}</span>
            </button>

            {/* Prominent "+ INPUT BARU" Button */}
            <button
              onClick={onOpenNewModal}
              id="btn-navbar-input-baru"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-md shadow transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ INPUT BARU</span>
            </button>

            {/* Profile & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-700">
              <div className="hidden sm:flex items-center gap-2 text-gray-300">
                <div className="w-8 h-8 bg-blue-100 text-blue-700 font-bold text-xs rounded-full flex items-center justify-center border border-blue-200">
                  WK
                </div>
                <div className="text-left">
                  <p className="font-bold text-white text-xs leading-none">
                    {currentUser?.nama || 'Wakil Kurikulum'}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider leading-none mt-0.5">
                    {currentUser?.peran || 'Admin'}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
                title="Keluar / Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Tier Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('dashboard')}
            id="tab-dashboard"
            className={`flex items-center gap-2 px-4 py-1.5 rounded text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>📊 Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('historis')}
            id="tab-historis"
            className={`flex items-center gap-2 px-4 py-1.5 rounded text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'historis'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>📜 Historis Pengaduan</span>
          </button>

          <button
            onClick={() => setActiveTab('analisis')}
            id="tab-analisis"
            className={`flex items-center gap-2 px-4 py-1.5 rounded text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'analisis'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>📈 Analisis</span>
          </button>

          <button
            onClick={onOpenAppsScriptGuide}
            id="tab-pengaturan"
            className={`flex items-center gap-2 px-4 py-1.5 rounded text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'pengaturan'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-green-400" />
            <span>⚙️ Integrasi Sheet</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

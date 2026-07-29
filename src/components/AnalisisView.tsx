import React, { useState } from 'react';
import { PengaduanItem, AnalysisType } from '../types';
import { formatDateIndonesian } from '../utils/dateUtils';
import { 
  BarChart3, 
  Users, 
  GraduationCap, 
  CheckCircle2, 
  PlusCircle, 
  ChevronDown, 
  PieChart, 
  TrendingUp, 
  AlertCircle, 
  ArrowUpRight, 
  Layers, 
  Check, 
  Clock,
  Eye,
  Edit
} from 'lucide-react';

interface AnalisisViewProps {
  items: PengaduanItem[];
  onOpenNewModal: () => void;
  onOpenEditModal: (item: PengaduanItem) => void;
  onOpenDetailModal: (item: PengaduanItem) => void;
}

export const AnalisisView: React.FC<AnalisisViewProps> = ({
  items,
  onOpenNewModal,
  onOpenEditModal,
  onOpenDetailModal,
}) => {
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisType>('jenis');

  const total = items.length;

  // Helper to compute breakdown distribution map
  const getBreakdown = (keyGetter: (item: PengaduanItem) => string) => {
    const map: Record<string, { count: number; sudah: number; belum: number; items: PengaduanItem[] }> = {};

    items.forEach((item) => {
      let key = keyGetter(item).trim();
      if (!key) key = 'Lain-lain / Belum Diisi';
      if (!map[key]) {
        map[key] = { count: 0, sudah: 0, belum: 0, items: [] };
      }
      map[key].count += 1;
      map[key].items.push(item);
      if (item.tersampaikan.trim().toLowerCase() === 'sudah') {
        map[key].sudah += 1;
      } else {
        map[key].belum += 1;
      }
    });

    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        count: data.count,
        sudah: data.sudah,
        belum: data.belum,
        percentage: total > 0 ? Math.round((data.count / total) * 100) : 0,
        sudahPct: data.count > 0 ? Math.round((data.sudah / data.count) * 100) : 0,
        items: data.items,
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Precompute breakdowns
  const jenisBreakdown = getBreakdown((i) => i.jenis);
  const pengirimBreakdown = getBreakdown((i) => i.pengirim);
  const kelasBreakdown = getBreakdown((i) => i.kelas);
  const tersampaikanBreakdown = getBreakdown((i) =>
    i.tersampaikan.trim().toLowerCase() === 'sudah' ? 'Sudah Tersampaikan' : 'Belum Tersampaikan'
  );

  return (
    <div className="space-y-4 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-base font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Analisis Pengaduan Mendetail</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Analisis tren masukan & pengaduan berdasarkan Kategori, Pengirim, Kelas, dan Status Tersampaikan.
          </p>
        </div>

        <button
          onClick={onOpenNewModal}
          id="btn-analisis-input-baru"
          className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-md shadow transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ INPUT BARU</span>
        </button>
      </div>

      {/* Dropdown Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-600" />
            <span>Pilih Menu Analisis Mendetail:</span>
          </label>

          <div className="relative w-full sm:w-72">
            <select
              value={selectedAnalysis}
              onChange={(e) => setSelectedAnalysis(e.target.value as AnalysisType)}
              id="select-menu-analisis"
              className="w-full pl-3 pr-8 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
            >
              <option value="jenis">1. Analisis Jenis Message (Kategori)</option>
              <option value="pengirim">2. Analisis Pengirim (Kelompok)</option>
              <option value="kelas">3. Analisis Kelas Terlibat</option>
              <option value="tersampaikan">4. Analisis Status Tersampaikan</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2.5 top-2 pointer-events-none" />
          </div>
        </div>

        {/* Submenu Badges Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 overflow-x-auto">
          <button
            onClick={() => setSelectedAnalysis('jenis')}
            className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              selectedAnalysis === 'jenis'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Analisis Jenis</span>
          </button>

          <button
            onClick={() => setSelectedAnalysis('pengirim')}
            className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              selectedAnalysis === 'pengirim'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Analisis Pengirim</span>
          </button>

          <button
            onClick={() => setSelectedAnalysis('kelas')}
            className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              selectedAnalysis === 'kelas'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Analisis Kelas</span>
          </button>

          <button
            onClick={() => setSelectedAnalysis('tersampaikan')}
            className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              selectedAnalysis === 'tersampaikan'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Analisis Tersampaikan</span>
          </button>
        </div>
      </div>

      {/* Dynamic Render based on Dropdown Selection */}
      {selectedAnalysis === 'jenis' && (
        <AnalysisDetailSection
          title="Analisis Berdasarkan Jenis Pesan (Masukan / Kritik / Saran / Apresiasi / Pengaduan)"
          description="Memetakan kecenderungan tipe aspirasi yang masuk ke kurikulum untuk menentukan pola respon utama."
          breakdown={jenisBreakdown}
          onOpenDetailModal={onOpenDetailModal}
          onOpenEditModal={onOpenEditModal}
        />
      )}

      {selectedAnalysis === 'pengirim' && (
        <AnalysisDetailSection
          title="Analisis Berdasarkan Kelompok Pengirim (Guru / Siswa / Orang Tua / Komite)"
          description="Mengidentifikasi konstituen sekolah mana yang paling aktif menyampaikan masukan dan isu."
          breakdown={pengirimBreakdown}
          onOpenDetailModal={onOpenDetailModal}
          onOpenEditModal={onOpenEditModal}
        />
      )}

      {selectedAnalysis === 'kelas' && (
        <AnalysisDetailSection
          title="Analisis Berdasarkan Kelas Terlibat"
          description="Menyoroti kelas-kelas yang membutuhkan perhatian atau koordinasi wali kelas lebih intensif."
          breakdown={kelasBreakdown}
          onOpenDetailModal={onOpenDetailModal}
          onOpenEditModal={onOpenEditModal}
        />
      )}

      {selectedAnalysis === 'tersampaikan' && (
        <AnalysisDetailSection
          title="Analisis Status Tersampaikan ke Pihak Berwenang"
          description="Menilai efektivitas penyampaian pengaduan ke Wakil Kurikulum, Kepala Sekolah, dan TimTerkait."
          breakdown={tersampaikanBreakdown}
          onOpenDetailModal={onOpenDetailModal}
          onOpenEditModal={onOpenEditModal}
        />
      )}
    </div>
  );
};

// Sub-component for rendering breakdown cards & list items
interface AnalysisDetailSectionProps {
  title: string;
  description: string;
  breakdown: Array<{
    name: string;
    count: number;
    sudah: number;
    belum: number;
    percentage: number;
    sudahPct: number;
    items: PengaduanItem[];
  }>;
  onOpenDetailModal: (item: PengaduanItem) => void;
  onOpenEditModal: (item: PengaduanItem) => void;
}

const AnalysisDetailSection: React.FC<AnalysisDetailSectionProps> = ({
  title,
  description,
  breakdown,
  onOpenDetailModal,
  onOpenEditModal,
}) => {
  return (
    <div className="space-y-4">
      {/* Category Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {breakdown.map((group) => (
          <div
            key={group.name}
            className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-sm space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900 text-xs truncate max-w-[180px]">
                {group.name}
              </span>
              <span className="text-[11px] font-mono font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {group.count} Pesan ({group.percentage}%)
              </span>
            </div>

            {/* Visual Bar */}
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${group.percentage}%` }}
              ></div>
            </div>

            {/* Tersampaikan Stats */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
              <span className="text-gray-500 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-green-600" />
                Tersampaikan: <strong className="text-green-700 font-extrabold">{group.sudah}</strong>
              </span>
              <span className="text-gray-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Pending: <strong className="text-amber-700 font-extrabold">{group.belum}</strong>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Table breakdown per category */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2 border-b border-gray-100 pb-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span>Rincian Pesan Berdasarkan Kategori Ditemukan</span>
        </h3>

        <div className="space-y-4">
          {breakdown.map((group) => (
            <div key={group.name} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2.5">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-900 text-xs">{group.name}</span>
                  <span className="text-[10px] text-gray-500">({group.count} record)</span>
                </div>
                <span className="text-[11px] text-gray-600">
                  Tingkat Penyampaian: <strong className="text-green-700 font-bold">{group.sudahPct}%</strong>
                </span>
              </div>

              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <div
                    key={item.keyid}
                    className="p-2.5 bg-white border border-gray-200 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-500">{item.keyid}</span>
                        <span className="text-gray-400 font-medium">{formatDateIndonesian(item.tanggal)}</span>
                        <span className="text-gray-700 font-semibold">• {item.pengirim} ({item.kelas})</span>
                      </div>
                      <p className="text-gray-800 line-clamp-1 font-medium italic">"{item.pesan}"</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.tersampaikan.trim().toLowerCase() === 'sudah'
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-amber-100 text-amber-700 border-amber-200'
                        }`}
                      >
                        {item.tersampaikan.trim().toLowerCase() === 'sudah' ? 'Tersampaikan' : 'Belum'}
                      </span>

                      <button
                        onClick={() => onOpenDetailModal(item)}
                        className="p-1 text-blue-600 hover:text-blue-800 font-bold text-[10px]"
                        title="Detail"
                      >
                        DETAIL
                      </button>

                      <button
                        onClick={() => onOpenEditModal(item)}
                        className="p-1 text-amber-600 hover:text-amber-800 font-bold text-[10px]"
                        title="Edit"
                      >
                        EDIT
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

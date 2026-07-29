import React from 'react';
import { PengaduanItem } from '../types';
import { formatDateIndonesian } from '../utils/dateUtils';
import { 
  Inbox, 
  CheckCircle2, 
  Clock, 
  Users, 
  GraduationCap, 
  PhoneCall, 
  PlusCircle, 
  ChevronRight, 
  BarChart, 
  Sparkles,
  TrendingUp,
  MessageSquare,
  Building,
  Radio
} from 'lucide-react';

interface DashboardViewProps {
  items: PengaduanItem[];
  onOpenNewModal: () => void;
  onOpenDetailModal: (item: PengaduanItem) => void;
  onNavigateToHistoris: () => void;
  onNavigateToAnalisis: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  items,
  onOpenNewModal,
  onOpenDetailModal,
  onNavigateToHistoris,
  onNavigateToAnalisis,
}) => {
  // 1. Calculate Core Totals
  const totalPesan = items.length;
  const totalTersampaikan = items.filter(
    (i) => i.tersampaikan.trim().toLowerCase() === 'sudah'
  ).length;
  const totalBelumTersampaikan = items.filter(
    (i) => i.tersampaikan.trim().toLowerCase() !== 'sudah'
  ).length;
  const percentTersampaikan = totalPesan > 0 ? Math.round((totalTersampaikan / totalPesan) * 100) : 0;

  // 2. Calculate Highlights (Kelas paling banyak, Pihak paling banyak, Metode terbanyak)
  const countByField = (fieldGetter: (i: PengaduanItem) => string) => {
    const map: Record<string, number> = {};
    items.forEach((item) => {
      const val = fieldGetter(item).trim();
      if (val && val !== '-' && val.toLowerCase() !== 'semua kelas') {
        map[val] = (map[val] || 0) + 1;
      }
    });
    let topName = 'Belum Ada';
    let topCount = 0;
    Object.entries(map).forEach(([name, count]) => {
      if (count > topCount) {
        topCount = count;
        topName = name;
      }
    });
    return { name: topName, count: topCount, all: map };
  };

  const topKelas = countByField((i) => i.kelas);
  const topPihak = countByField((i) => i.pihakterlibat);
  const topMetode = countByField((i) => i.metode);
  const topJenis = countByField((i) => i.jenis);

  // Recent 5 entries
  const recentItems = [...items].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Welcome Action Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm text-gray-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded text-xs font-bold uppercase tracking-wide mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Dashboard Real-time</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-gray-900">
            Ikhtisar Pengaduan & Masukan Kurikulum
          </h2>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Ringkasan data pengaduan dari seluruh kelas, pihak terlibat, dan status tersampaikan kepada Wakil Kurikulum & Pihak Berwenang.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-md shadow transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ INPUT BARU</span>
          </button>
        </div>
      </div>

      {/* 1. Core Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pesan */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Pesan Diterima</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-gray-900">{totalPesan}</span>
            <span className="text-xs text-blue-600 font-bold">Pesan Masuk</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Seluruh record di tab "data"</p>
        </div>

        {/* Sudah Tersampaikan */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 border-l-4 border-l-green-500">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Tersampaikan (Selesai)</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-gray-900">{totalTersampaikan}</span>
            <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded border border-green-200">
              {percentTersampaikan}% dari total
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-gray-100 h-2 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-green-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${percentTersampaikan}%` }}
            ></div>
          </div>
        </div>

        {/* Belum Tersampaikan */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 border-l-4 border-l-amber-500">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Belum Tersampaikan</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-black text-gray-900">{totalBelumTersampaikan}</span>
            <span className="text-xs text-amber-600 font-bold">
              Butuh Tindakan ({totalPesan > 0 ? Math.round((totalBelumTersampaikan / totalPesan) * 100) : 0}%)
            </span>
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-2">Perlu tindak lanjut koordinasi</p>
        </div>

        {/* Jenis Utama */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Kategori Utama</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-black text-gray-900 truncate block">{topJenis.name}</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">{topJenis.count} pesan dalam kategori ini</p>
        </div>
      </div>

      {/* 2. Highlights Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Kelas Terbanyak */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Kelas Teraktif</p>
              <h3 className="text-lg font-black text-gray-900">{topKelas.name}</h3>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-400">Total Pengiriman:</span>
            <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {topKelas.count} Pesan
            </span>
          </div>
        </div>

        {/* Pihak Terbanyak Dilibatkan */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg border border-purple-200">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Pihak Terbanyak Dilibatkan</p>
              <h3 className="text-base font-black text-gray-900 line-clamp-1" title={topPihak.name}>{topPihak.name}</h3>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-400">Total Pengiriman:</span>
            <span className="font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              {topPihak.count} Pesan
            </span>
          </div>
        </div>

        {/* Metode Penyampaian Utama */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Metode Terbanyak</p>
              <h3 className="text-lg font-black text-gray-900">{topMetode.name}</h3>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-400">Total Pengiriman:</span>
            <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {topMetode.count} Pesan
            </span>
          </div>
        </div>
      </div>

      {/* 3. Distribution Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Distribusi Kategori */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
            <div className="flex items-center gap-2">
              <BarChart className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Distribusi Kategori Pesan
              </h3>
            </div>
            <button
              onClick={onNavigateToAnalisis}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
            >
              <span>Detail Analisis →</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {Object.entries(topJenis.all).map(([jenis, count]) => {
              const pct = totalPesan > 0 ? Math.round((count / totalPesan) * 100) : 0;
              return (
                <div key={jenis} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-gray-700">{jenis}</span>
                    <span className="font-mono text-gray-500">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Tersampaikan Breakdown */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Status Penyampaian ke Pihak Berwenang
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 my-2">
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-xs font-bold text-green-800 uppercase">Tersampaikan (Sudah)</p>
              <p className="text-2xl font-black text-green-700 my-0.5">{totalTersampaikan}</p>
              <p className="text-[10px] text-green-600 font-semibold">{percentTersampaikan}% dari total</p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
              <p className="text-xs font-bold text-amber-800 uppercase">Pending (Belum)</p>
              <p className="text-2xl font-black text-amber-700 my-0.5">{totalBelumTersampaikan}</p>
              <p className="text-[10px] text-amber-600 font-semibold">
                {totalPesan > 0 ? 100 - percentTersampaikan : 0}% dari total
              </p>
            </div>
          </div>

          <p className="text-[11px] text-gray-400 mt-2 italic">
            *Pesan tersampaikan mengindikasikan bahwa usulan atau masalah telah diteruskan ke Wakil Kurikulum, Kepala Sekolah, atau Pihak Terkait.
          </p>
        </div>
      </div>

      {/* 4. Recent incoming messages list */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-black text-gray-700 uppercase tracking-tight flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>Recent Records (Data View)</span>
            </h3>
          </div>
          <button
            onClick={onNavigateToHistoris}
            className="text-[11px] text-blue-600 hover:text-blue-800 font-bold uppercase tracking-wider"
          >
            Lihat Semua Historis →
          </button>
        </div>

        {recentItems.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs">
            Belum ada data pengaduan. Klik tombol "+ INPUT BARU" untuk menambahkan.
          </div>
        ) : (
          <table className="w-full text-left text-xs table-fixed">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200 text-gray-500 font-bold uppercase">
                <th className="w-20 px-4 py-2">KeyID</th>
                <th className="w-24 px-4 py-2">Tanggal</th>
                <th className="w-20 px-4 py-2">Jenis</th>
                <th className="px-4 py-2">Pesan (Klik untuk detail)</th>
                <th className="w-32 px-4 py-2">Pengirim</th>
                <th className="w-24 px-4 py-2 text-center">Status</th>
                <th className="w-16 px-4 py-2 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentItems.map((item) => {
                const isSudah = item.tersampaikan.trim().toLowerCase() === 'sudah';
                let badgeStyle = 'bg-blue-100 text-blue-700';
                if (item.jenis.toLowerCase() === 'kritik') badgeStyle = 'bg-red-100 text-red-700';
                if (item.jenis.toLowerCase() === 'apresiasi') badgeStyle = 'bg-purple-100 text-purple-700';
                if (item.jenis.toLowerCase() === 'saran') badgeStyle = 'bg-gray-100 text-gray-700';

                return (
                  <tr 
                    key={item.keyid}
                    onClick={() => onOpenDetailModal(item)}
                    className="hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-2.5 font-mono font-bold text-gray-500">{item.keyid}</td>
                    <td className="px-4 py-2.5 text-gray-600 font-medium whitespace-nowrap">{formatDateIndonesian(item.tanggal)}</td>
                    <td className="px-4 py-2.5">
                      <span className={`${badgeStyle} px-1.5 py-0.5 rounded text-[10px] font-bold uppercase`}>
                        {item.jenis}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 truncate text-gray-700 italic">
                      "{item.pesan}"
                    </td>
                    <td className="px-4 py-2.5 text-gray-800 font-medium">
                      {item.pengirim} <span className="text-gray-400">({item.kelas})</span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isSudah
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isSudah ? 'SUDAH' : 'BELUM'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center text-blue-600 font-bold">
                      DETAIL
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

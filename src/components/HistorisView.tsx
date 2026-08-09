import React, { useState, useMemo } from 'react';
import { PengaduanItem, FilterState } from '../types';
import { formatDateIndonesian } from '../utils/dateUtils';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  PlusCircle, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MessageSquareText, 
  Calendar, 
  Hash, 
  Tag, 
  Send,
  SlidersHorizontal,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Users
} from 'lucide-react';

type SortField = 'keyid' | 'tanggal' | 'jenis' | 'pengirim' | 'pihakterlibat' | 'metode' | 'tersampaikan';
type SortDirection = 'asc' | 'desc';

interface HistorisViewProps {
  items: PengaduanItem[];
  onOpenNewModal: () => void;
  onOpenEditModal: (item: PengaduanItem) => void;
  onOpenDetailModal: (item: PengaduanItem) => void;
  onDelete: (keyid: string) => void;
  onToggleTersampaikan: (item: PengaduanItem) => void;
}

export const HistorisView: React.FC<HistorisViewProps> = ({
  items,
  onOpenNewModal,
  onOpenEditModal,
  onOpenDetailModal,
  onDelete,
  onToggleTersampaikan,
}) => {
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    keyid: '',
    tanggalAwal: '',
    tanggalAkhir: '',
    searchPesan: '',
    jenis: '',
    tersampaikan: '',
    pengirim: '',
    kelas: '',
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Sorting state - default newest first by tanggal
  const [sortField, setSortField] = useState<SortField>('tanggal');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'tanggal' || field === 'keyid' ? 'desc' : 'asc');
    }
  };

  // Filter and Sort logic
  const filteredItems = useMemo(() => {
    const filtered = items.filter((item) => {
      // 1. Key ID filter
      if (
        filters.keyid &&
        !item.keyid.toLowerCase().includes(filters.keyid.toLowerCase())
      ) {
        return false;
      }

      // 2. Isi Pesan / Search filter
      if (
        filters.searchPesan &&
        !item.pesan.toLowerCase().includes(filters.searchPesan.toLowerCase()) &&
        !item.topikumum.toLowerCase().includes(filters.searchPesan.toLowerCase()) &&
        !item.pihakterlibat.toLowerCase().includes(filters.searchPesan.toLowerCase())
      ) {
        return false;
      }

      // 3. Jenis filter
      if (
        filters.jenis &&
        item.jenis.toLowerCase() !== filters.jenis.toLowerCase()
      ) {
        return false;
      }

      // 4. Tersampaikan filter ("Sudah", "Belum")
      if (filters.tersampaikan) {
        const status = item.tersampaikan.trim().toLowerCase();
        if (filters.tersampaikan === 'Sudah' && status !== 'sudah') return false;
        if (filters.tersampaikan === 'Belum' && status === 'sudah') return false;
      }

      // 5. Tanggal Awal
      if (filters.tanggalAwal && item.tanggal < filters.tanggalAwal) {
        return false;
      }

      // 6. Tanggal Akhir
      if (filters.tanggalAkhir && item.tanggal > filters.tanggalAkhir) {
        return false;
      }

      // 7. Pengirim
      if (
        filters.pengirim &&
        item.pengirim.toLowerCase() !== filters.pengirim.toLowerCase()
      ) {
        return false;
      }

      // 8. Kelas
      if (
        filters.kelas &&
        !item.kelas.toLowerCase().includes(filters.kelas.toLowerCase())
      ) {
        return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'tanggal') {
        const timeA = new Date(a.tanggal).getTime();
        const timeB = new Date(b.tanggal).getTime();
        if (!isNaN(timeA) && !isNaN(timeB)) {
          comparison = timeA - timeB;
        } else {
          comparison = a.tanggal.localeCompare(b.tanggal);
        }
        if (comparison === 0) {
          comparison = a.keyid.localeCompare(b.keyid);
        }
      } else if (sortField === 'keyid') {
        comparison = a.keyid.localeCompare(b.keyid);
      } else if (sortField === 'jenis') {
        comparison = a.jenis.localeCompare(b.jenis);
      } else if (sortField === 'pengirim') {
        const pA = `${a.pengirim} ${a.kelas}`;
        const pB = `${b.pengirim} ${b.kelas}`;
        comparison = pA.localeCompare(pB);
      } else if (sortField === 'pihakterlibat') {
        comparison = (a.pihakterlibat || '').localeCompare(b.pihakterlibat || '');
      } else if (sortField === 'metode') {
        comparison = a.metode.localeCompare(b.metode);
      } else if (sortField === 'tersampaikan') {
        comparison = a.tersampaikan.localeCompare(b.tersampaikan);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [items, filters, sortField, sortDirection]);

  const renderSortHeader = (field: SortField, label: string, alignCenter = false) => {
    const isActive = sortField === field;
    return (
      <th
        onClick={() => handleSort(field)}
        className={`py-2.5 px-3 cursor-pointer select-none hover:bg-gray-200 transition-colors ${
          alignCenter ? 'text-center' : ''
        }`}
        title={`Klik untuk mengurutkan berdasarkan ${label}`}
      >
        <div className={`inline-flex items-center gap-1 ${alignCenter ? 'justify-center' : ''}`}>
          <span>{label}</span>
          {isActive ? (
            sortDirection === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            )
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 opacity-60 hover:opacity-100 shrink-0" />
          )}
        </div>
      </th>
    );
  };

  const handleResetFilters = () => {
    setFilters({
      keyid: '',
      tanggalAwal: '',
      tanggalAkhir: '',
      searchPesan: '',
      jenis: '',
      tersampaikan: '',
      pengirim: '',
      kelas: '',
    });
  };

  // Extract unique options for filter dropdowns
  const jenisOptions = Array.from(new Set(items.map((i) => i.jenis).filter(Boolean)));
  const pengirimOptions = Array.from(new Set(items.map((i) => i.pengirim).filter(Boolean)));

  return (
    <div className="space-y-4 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
        <div>
          <h2 className="text-base font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-blue-600" />
            <span>Historis Pengaduan & Record Data</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Menampilkan {filteredItems.length} record terfilter dari total {items.length} data pengaduan.
          </p>
        </div>

        <button
          onClick={onOpenNewModal}
          id="btn-historis-input-baru"
          className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-md shadow transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ INPUT BARU</span>
        </button>
      </div>

      {/* Filter Panel */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wide">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Filter & Pencarian Data</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded border border-gray-300 font-bold"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showAdvancedFilters ? 'Sembunyikan Opsi Lanjut' : 'Opsi Lanjut'}</span>
            </button>

            <button
              onClick={handleResetFilters}
              className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded border border-red-200 transition-colors font-bold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>
        </div>

        {/* Primary Filter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Search Isi Pesan */}
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
              Cari Pesan / Topik / Pihak
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={filters.searchPesan}
                onChange={(e) => setFilters({ ...filters, searchPesan: e.target.value })}
                placeholder="Kata kunci pesan..."
                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filter KeyID */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
              Key ID
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-gray-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={filters.keyid}
                onChange={(e) => setFilters({ ...filters, keyid: e.target.value })}
                placeholder="misal: ID-092"
                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filter Jenis */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
              Jenis Pesan
            </label>
            <select
              value={filters.jenis}
              onChange={(e) => setFilters({ ...filters, jenis: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Jenis</option>
              {jenisOptions.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Tersampaikan */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
              Status Tersampaikan
            </label>
            <select
              value={filters.tersampaikan}
              onChange={(e) => setFilters({ ...filters, tersampaikan: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Status</option>
              <option value="Sudah">Sudah Tersampaikan</option>
              <option value="Belum">Belum Tersampaikan</option>
            </select>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                Tanggal Awal
              </label>
              <input
                type="date"
                value={filters.tanggalAwal}
                onChange={(e) => setFilters({ ...filters, tanggalAwal: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                Tanggal Akhir
              </label>
              <input
                type="date"
                value={filters.tanggalAkhir}
                onChange={(e) => setFilters({ ...filters, tanggalAkhir: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                Pengirim
              </label>
              <select
                value={filters.pengirim}
                onChange={(e) => setFilters({ ...filters, pengirim: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Pengirim</option>
                {pengirimOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                Kelas
              </label>
              <input
                type="text"
                value={filters.kelas}
                onChange={(e) => setFilters({ ...filters, kelas: e.target.value })}
                placeholder="misal: X-1"
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile & Tablet View (lg:hidden) - Cards Layout (No Side Scrolling) */}
      <div className="block lg:hidden space-y-3">
        {/* Mobile/Tablet Sorting Bar */}
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase shrink-0">Urutkan:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="tanggal">Tanggal</option>
              <option value="keyid">Key ID</option>
              <option value="jenis">Jenis Pesan</option>
              <option value="pengirim">Pengirim</option>
              <option value="pihakterlibat">Pihak Terlibat</option>
              <option value="metode">Metode</option>
              <option value="tersampaikan">Status</option>
            </select>
            <button
              onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-xs font-bold text-gray-700 flex items-center gap-1 shrink-0"
              title="Ubah Arah Urutan"
            >
              {sortDirection === 'asc' ? (
                <>
                  <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[10px]">Asc</span>
                </>
              ) : (
                <>
                  <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-[10px]">Desc</span>
                </>
              )}
            </button>
          </div>
          <div className="text-[11px] text-gray-500 font-medium text-right">
            Menampilkan <strong className="text-blue-700 font-bold">{filteredItems.length}</strong> data
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center text-gray-400 text-xs border border-gray-200">
            Tidak ada data pengaduan yang cocok dengan filter.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isSudah = item.tersampaikan.trim().toLowerCase() === 'sudah';
            const truncatedPesan =
              item.pesan.length > 80
                ? item.pesan.substring(0, 80) + '...'
                : item.pesan;

            let badgeStyle = 'bg-blue-100 text-blue-700 border-blue-200';
            if (item.jenis.toLowerCase() === 'kritik') badgeStyle = 'bg-red-100 text-red-700 border-red-200';
            if (item.jenis.toLowerCase() === 'apresiasi') badgeStyle = 'bg-purple-100 text-purple-700 border-purple-200';
            if (item.jenis.toLowerCase() === 'saran') badgeStyle = 'bg-gray-100 text-gray-700 border-gray-200';

            return (
              <div
                key={item.keyid}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-blue-300 transition-all space-y-3"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-black text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                      #{item.keyid}
                    </span>
                    <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {formatDateIndonesian(item.tanggal)}
                    </span>
                    {item.metode && (
                      <span className="text-[10px] font-semibold text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                        {item.metode}
                      </span>
                    )}
                  </div>
                  <span className={`${badgeStyle} border px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide shrink-0`}>
                    {item.jenis}
                  </span>
                </div>

                {/* Sender & Target info */}
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-900 font-bold">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>{item.pengirim}</span>
                    <span className="text-gray-400 font-normal">({item.kelas || '-'})</span>
                  </div>
                  {item.pihakterlibat && (
                    <div className="text-[11px] text-gray-500">
                      Ditujukan: <span className="font-semibold text-gray-700">{item.pihakterlibat}</span>
                    </div>
                  )}
                </div>

                {/* Message Box */}
                <div
                  onClick={() => onOpenDetailModal(item)}
                  className="p-3 bg-gray-50 hover:bg-blue-50/70 rounded-lg border border-gray-200/80 cursor-pointer transition-colors space-y-1 group"
                  title="Klik untuk membaca pesan selengkapnya"
                >
                  <p className="text-xs text-gray-800 italic leading-relaxed group-hover:text-blue-900">
                    "{truncatedPesan}"
                  </p>
                  <div className="text-[10px] text-gray-400 font-mono pt-1.5 border-t border-gray-200/50 flex justify-between items-center">
                    <span>Topik: {item.topikumum || '-'}</span>
                    <span className="text-blue-600 font-bold group-hover:underline">Detail →</span>
                  </div>
                </div>

                {/* Footer Controls & Actions */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Status:</span>
                    <button
                      onClick={() => onToggleTersampaikan(item)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                        isSudah
                          ? 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
                      }`}
                      title="Klik untuk menguji/mengubah status"
                    >
                      {isSudah ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                          <span>SUDAH</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>BELUM</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Action buttons with touch friendly targets */}
                  <div className="flex items-center gap-1 font-bold text-xs">
                    <button
                      onClick={() => onOpenDetailModal(item)}
                      className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1 transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat</span>
                    </button>

                    <button
                      onClick={() => onOpenEditModal(item)}
                      className="px-2.5 py-1 text-amber-600 hover:bg-amber-50 rounded-lg flex items-center gap-1 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Hapus pengaduan ${item.keyid}?`)) {
                          onDelete(item.keyid);
                        }
                      }}
                      className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View (hidden lg:block) */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200 text-gray-500 font-bold uppercase text-[11px]">
                {renderSortHeader('keyid', 'KeyID')}
                {renderSortHeader('tanggal', 'Tanggal')}
                {renderSortHeader('jenis', 'Jenis')}
                <th className="py-2.5 px-3">Pesan (Klik untuk detail)</th>
                {renderSortHeader('pengirim', 'Pengirim / Kelas')}
                {renderSortHeader('pihakterlibat', 'Pihak Terlibat')}
                {renderSortHeader('metode', 'Metode')}
                {renderSortHeader('tersampaikan', 'Status', true)}
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    Tidak ada data pengaduan yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isSudah = item.tersampaikan.trim().toLowerCase() === 'sudah';
                  const truncatedPesan =
                    item.pesan.length > 55
                      ? item.pesan.substring(0, 55) + '...'
                      : item.pesan;

                  let badgeStyle = 'bg-blue-100 text-blue-700';
                  if (item.jenis.toLowerCase() === 'kritik') badgeStyle = 'bg-red-100 text-red-700';
                  if (item.jenis.toLowerCase() === 'apresiasi') badgeStyle = 'bg-purple-100 text-purple-700';
                  if (item.jenis.toLowerCase() === 'saran') badgeStyle = 'bg-gray-100 text-gray-700';

                  return (
                    <tr
                      key={item.keyid}
                      className="hover:bg-blue-50 transition-colors group"
                    >
                      {/* KeyID */}
                      <td className="py-2.5 px-3 font-mono font-bold text-gray-400 whitespace-nowrap">
                        {item.keyid}
                      </td>

                      {/* Tanggal */}
                      <td className="py-2.5 px-3 text-gray-600 font-medium whitespace-nowrap">
                        {formatDateIndonesian(item.tanggal)}
                      </td>

                      {/* Jenis */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`${badgeStyle} px-1.5 py-0.5 rounded text-[10px] font-bold uppercase`}>
                          {item.jenis}
                        </span>
                      </td>

                      {/* Truncated Pesan */}
                      <td className="py-2.5 px-3 max-w-xs">
                        <button
                          onClick={() => onOpenDetailModal(item)}
                          className="text-left font-medium text-gray-800 hover:text-blue-600 transition-colors group-hover:underline block italic"
                          title="Klik untuk membaca pesan lengkap"
                        >
                          "{truncatedPesan}"
                        </button>
                        {item.topikumum && (
                          <span className="text-[10px] text-gray-400 font-mono mt-0.5 inline-block">
                            Topik: {item.topikumum}
                          </span>
                        )}
                      </td>

                      {/* Pengirim & Kelas */}
                      <td className="py-2.5 px-3 text-gray-700 whitespace-nowrap">
                        <div className="font-bold text-gray-900">{item.pengirim}</div>
                        <div className="text-[10px] text-gray-400">({item.kelas || '-'})</div>
                      </td>

                      {/* Pihak Terlibat */}
                      <td className="py-2.5 px-3 text-gray-600 max-w-xs truncate" title={item.pihakterlibat}>
                        {item.pihakterlibat || '-'}
                      </td>

                      {/* Metode */}
                      <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">
                        {item.metode}
                      </td>

                      {/* Tersampaikan Toggle Badge */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => onToggleTersampaikan(item)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                            isSudah
                              ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200'
                              : 'bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200'
                          }`}
                          title="Klik untuk mengubah status"
                        >
                          {isSudah ? 'SUDAH' : 'BELUM'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5 font-bold text-[10px]">
                          <button
                            onClick={() => onOpenDetailModal(item)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Detail"
                          >
                            LIHAT
                          </button>

                          <button
                            onClick={() => onOpenEditModal(item)}
                            className="text-amber-600 hover:text-amber-800"
                            title="Edit"
                          >
                            EDIT
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Hapus pengaduan ${item.keyid}?`)) {
                                onDelete(item.keyid);
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                            title="Hapus"
                          >
                            HAPUS
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

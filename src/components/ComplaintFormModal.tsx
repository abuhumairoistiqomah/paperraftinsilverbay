import React, { useState, useEffect } from 'react';
import { PengaduanItem } from '../types';
import { ApiService } from '../services/api';
import { X, Save, Sparkles, Hash, Calendar, FileText, Tag, User, Users, GraduationCap, Phone, CheckCircle2, MessageSquare, Clock } from 'lucide-react';

interface ComplaintFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: PengaduanItem) => void;
  editItem?: PengaduanItem | null;
  allItems: PengaduanItem[];
}

export const ComplaintFormModal: React.FC<ComplaintFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editItem,
  allItems,
}) => {
  const [formData, setFormData] = useState<PengaduanItem>({
    keyid: '',
    tanggal: new Date().toISOString().split('T')[0],
    pesan: '',
    jenis: 'Masukan',
    pengirim: 'Guru',
    pihakterlibat: '',
    kelas: '',
    metode: 'Tatap Muka',
    topikumum: '',
    tersampaikan: 'Belum',
    forum: '',
    respon: '',
    tanggaldisampaikan: '',
    updateterakhir: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editItem) {
      setFormData({ ...editItem });
    } else {
      // Auto-generate keyid for new entry
      const autoKeyId = ApiService.generateNextKeyId(allItems);
      setFormData({
        keyid: autoKeyId,
        tanggal: new Date().toISOString().split('T')[0],
        pesan: '',
        jenis: 'Masukan',
        pengirim: 'Guru',
        pihakterlibat: '',
        kelas: '',
        metode: 'Tatap Muka',
        topikumum: '',
        tersampaikan: 'Belum',
        forum: 'Tatap Muka Direct',
        respon: '',
        tanggaldisampaikan: '',
        updateterakhir: 'Baru Diterima',
      });
    }
  }, [editItem, isOpen, allItems]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pesan.trim()) {
      alert('Isi pesan pengaduan wajib diisi!');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      alert('Gagal menyimpan data: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-gray-200 rounded-lg w-full max-w-3xl shadow-xl my-6 overflow-hidden text-gray-900">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600 text-white rounded">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight text-white">
                {editItem ? `Edit Data Pengaduan (${editItem.keyid})` : 'Input Pengaduan / Masukan Baru'}
              </h3>
              <p className="text-[11px] text-gray-300">
                Lengkapi atribut data sesuai struktur tab "data" spreadsheet.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Section 1: Identitas & Waktu Pesan */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-200 pb-1">
              <Hash className="w-3.5 h-3.5 text-blue-600" />
              <span>1. Identitas & Tanggal Terima</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Key ID */}
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                  Key ID <span className="text-blue-600">(Otomatis)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.keyid}
                  onChange={(e) => setFormData({ ...formData, keyid: e.target.value })}
                  placeholder="e.g. ID-092"
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-900 font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Tanggal */}
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                  Tanggal Pesan
                </label>
                <input
                  type="date"
                  required
                  value={formData.tanggal}
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Jenis */}
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                  Jenis Message
                </label>
                <select
                  value={formData.jenis}
                  onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                >
                  <option value="Masukan">Masukan</option>
                  <option value="Kritik">Kritik</option>
                  <option value="Saran">Saran</option>
                  <option value="Apresiasi">Apresiasi</option>
                  <option value="Pengaduan">Pengaduan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Content & Ringkasan Kata Kunci */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-200 pb-1">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>2. Content & Ringkasan Kata Kunci</span>
            </h4>

            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                Isi Pesan Lengkap <span className="text-red-600">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={formData.pesan}
                onChange={(e) => setFormData({ ...formData, pesan: e.target.value })}
                placeholder="Tuliskan lengkap rincian pengaduan, saran, atau masukan yang diterima..."
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
              ></textarea>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                Topik Umum / Kata-Kata Kunci
              </label>
              <input
                type="text"
                value={formData.topikumum}
                onChange={(e) => setFormData({ ...formData, topikumum: e.target.value })}
                placeholder="misal: Jadwal Pelajaran, Modul Ajar, Fasilitas Lab, PTS"
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 3: Pengirim & Pihak Terlibat */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-200 pb-1">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>3. Pengirim & Pihak Terlibat</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Pengirim */}
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                  Pengirim
                </label>
                <select
                  value={formData.pengirim}
                  onChange={(e) => setFormData({ ...formData, pengirim: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                >
                  <option value="Guru">Guru</option>
                  <option value="Siswa">Siswa</option>
                  <option value="Orang Tua">Orang Tua</option>
                  <option value="Komite">Komite</option>
                  <option value="Staf">Staf</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              {/* Kelas */}
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                  Kelas Terlibat
                </label>
                <input
                  type="text"
                  value={formData.kelas}
                  onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                  placeholder="e.g. X-1, XI-IPA-2"
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Metode */}
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                  Metode Penyampaian
                </label>
                <select
                  value={formData.metode}
                  onChange={(e) => setFormData({ ...formData, metode: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Tatap Muka">Tatap Muka</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Telepon">Telepon</option>
                  <option value="Form Online">Form Online</option>
                  <option value="Rapat">Rapat</option>
                  <option value="Surat">Surat</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              {/* Forum */}
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                  Forum / Wadah
                </label>
                <input
                  type="text"
                  value={formData.forum}
                  onChange={(e) => setFormData({ ...formData, forum: e.target.value })}
                  placeholder="e.g. Rapat Dewan Guru"
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                Pihak-Pihak Terlibat Dalam Pesan
              </label>
              <input
                type="text"
                value={formData.pihakterlibat}
                onChange={(e) => setFormData({ ...formData, pihakterlibat: e.target.value })}
                placeholder="e.g. Guru Matematika & Guru PJOK, Laboran Komputer"
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 4: Status Tersampaikan & Respon */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-200 pb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>4. Status Tersampaikan & Tindak Lanjut</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Tersampaikan */}
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                  Status Tersampaikan ke Pihak Berwenang
                </label>
                <select
                  value={formData.tersampaikan}
                  onChange={(e) => setFormData({ ...formData, tersampaikan: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Belum">Belum Tersampaikan</option>
                  <option value="Sudah">Sudah Tersampaikan</option>
                </select>
              </div>

              {/* Tanggal Disampaikan */}
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                  Tanggal Disampaikan
                </label>
                <input
                  type="date"
                  value={formData.tanggaldisampaikan}
                  onChange={(e) => setFormData({ ...formData, tanggaldisampaikan: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                Respon Pihak Berwenang / Tindak Lanjut
              </label>
              <textarea
                rows={2}
                value={formData.respon}
                onChange={(e) => setFormData({ ...formData, respon: e.target.value })}
                placeholder="Tuliskan jawaban, tindakan, atau keputusan dari Wakil Kurikulum / Kepala Sekolah..."
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                Update Terakhir (Kondisi Terakhir)
              </label>
              <input
                type="text"
                value={formData.updateterakhir}
                onChange={(e) => setFormData({ ...formData, updateterakhir: e.target.value })}
                placeholder="e.g. Selesai Dibereskan, Menunggu Penggantian Alat"
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded border border-gray-300 transition-colors"
            >
              BATAL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'MENYIMPAN...' : 'SIMPAN DATA PENGADUAN'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

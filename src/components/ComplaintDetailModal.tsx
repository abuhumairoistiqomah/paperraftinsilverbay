import React from 'react';
import { PengaduanItem } from '../types';
import { formatDateIndonesian } from '../utils/dateUtils';
import { X, Edit, Calendar, User, Users, GraduationCap, Phone, CheckCircle2, Clock, MessageSquare, Tag, FileText, Check, AlertCircle } from 'lucide-react';

interface ComplaintDetailModalProps {
  item: PengaduanItem | null;
  onClose: () => void;
  onEdit: (item: PengaduanItem) => void;
  onToggleTersampaikan: (item: PengaduanItem) => void;
}

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  item,
  onClose,
  onEdit,
  onToggleTersampaikan,
}) => {
  if (!item) return null;

  const isSudah = item.tersampaikan.trim().toLowerCase() === 'sudah';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-gray-200 rounded-lg w-full max-w-2xl shadow-xl my-6 overflow-hidden text-gray-900">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-black text-white bg-blue-600 px-2.5 py-0.5 rounded shadow-sm">
              {item.keyid}
            </span>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight text-white">Detail Pesan Pengaduan</h3>
              <p className="text-[11px] text-gray-300">Diterima tanggal: {formatDateIndonesian(item.tanggal)}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Main Full Message Card */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-blue-900 font-bold border-b border-blue-200 pb-1.5">
              <span className="flex items-center gap-1.5 uppercase tracking-wide">
                <FileText className="w-4 h-4 text-blue-600" />
                ISI PESAN LENGKAP
              </span>
              <span className="px-2 py-0.5 rounded bg-white text-blue-800 border border-blue-200 font-extrabold text-[10px]">
                {item.jenis}
              </span>
            </div>
            <p className="text-xs text-gray-900 font-medium leading-relaxed whitespace-pre-line pt-0.5 italic">
              "{item.pesan}"
            </p>
            {item.topikumum && (
              <div className="pt-1.5 text-xs text-gray-600 flex items-center gap-1.5 border-t border-blue-100">
                <Tag className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Topik Kata Kunci: <strong className="text-blue-900 font-bold">{item.topikumum}</strong></span>
              </div>
            )}
          </div>

          {/* Grid Attributes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Pengirim & Kelas */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1.5">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Pihak Pengirim & Kelas
              </span>
              <div className="flex items-center gap-2 text-gray-900 font-bold">
                <User className="w-4 h-4 text-blue-600" />
                <span>{item.pengirim}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>Kelas: <strong>{item.kelas || 'Semua Kelas / Umum'}</strong></span>
              </div>
            </div>

            {/* Metode & Forum */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1.5">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Metode & Forum Penyampaian
              </span>
              <div className="flex items-center gap-2 text-gray-900 font-bold">
                <Phone className="w-4 h-4 text-green-600" />
                <span>Metode: {item.metode}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <MessageSquare className="w-4 h-4 text-green-600" />
                <span>Forum: <strong>{item.forum || 'Tatap Muka Direct'}</strong></span>
              </div>
            </div>
          </div>

          {/* Pihak Terlibat */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1 text-xs">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Pihak-Pihak Terlibat Dalam Pesan Ini
            </span>
            <p className="text-gray-900 font-semibold">
              {item.pihakterlibat || 'Tidak spesifik'}
            </p>
          </div>

          {/* Status Tersampaikan & Tindak Lanjut */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Status Penyampaian ke Pihak Berwenang
              </span>
              <button
                onClick={() => onToggleTersampaikan(item)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold border flex items-center gap-1.5 transition-all ${
                  isSudah
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                {isSudah ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                    <span>Sudah Tersampaikan</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Belum Tersampaikan (Ubah)</span>
                  </>
                )}
              </button>
            </div>

            {item.tanggaldisampaikan && (
              <p className="text-gray-600">
                Tanggal Disampaikan: <strong className="text-gray-900">{formatDateIndonesian(item.tanggaldisampaikan)}</strong>
              </p>
            )}

            <div>
              <span className="font-bold text-gray-700 uppercase text-[10px] block mb-1">
                Respon / Tindak Lanjut Pihak Berwenang:
              </span>
              <div className="p-2.5 bg-white border border-gray-200 rounded text-gray-800 italic leading-relaxed">
                {item.respon || 'Belum ada respon / catatan tindakan lanjut.'}
              </div>
            </div>

            <div>
              <span className="font-bold text-gray-700 uppercase text-[10px] block mb-0.5">
                Kondisi Last Update:
              </span>
              <p className="text-blue-900 font-bold">
                {item.updateterakhir || 'Dalam proses pencatatan.'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded transition-colors"
          >
            TUTUP
          </button>

          <button
            onClick={() => {
              onClose();
              onEdit(item);
            }}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded shadow transition-all flex items-center gap-1.5"
          >
            <Edit className="w-4 h-4" />
            <span>EDIT DATA INI</span>
          </button>
        </div>
      </div>
    </div>
  );
};

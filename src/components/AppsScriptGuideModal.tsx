import React, { useState } from 'react';
import { GOOGLE_APPS_SCRIPT_CODE } from '../services/appsScriptCode';
import { StorageService, ApiService } from '../services/api';
import { 
  X, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  ExternalLink, 
  Zap, 
  ShieldCheck, 
  HelpCircle, 
  Save, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface AppsScriptGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const AppsScriptGuideModal: React.FC<AppsScriptGuideModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  const currentConfig = StorageService.getConfig();
  const [webAppUrl, setWebAppUrl] = useState(currentConfig.webAppUrl || '');
  const [isCopied, setIsCopied] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestResult(null);

    if (!webAppUrl.trim()) {
      StorageService.saveConfig({ ...currentConfig, webAppUrl: '' });
      onConfigUpdated();
      setTestResult({ success: true, message: 'Kembali ke Mode Lokal (Demo).' });
      return;
    }

    setIsTesting(true);
    const result = await ApiService.testConnection(webAppUrl);
    setIsTesting(false);
    setTestResult(result);

    if (result.success) {
      StorageService.saveConfig({
        ...currentConfig,
        webAppUrl: webAppUrl.trim(),
        lastSynced: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      });
      onConfigUpdated();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs overflow-y-auto font-sans">
      <div className="bg-white border border-gray-200 rounded-lg w-full max-w-4xl shadow-xl my-6 overflow-hidden text-gray-900">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight text-white">
                Integrasi Google Spreadsheet & Apps Script
              </h3>
              <p className="text-[11px] text-gray-300">
                Hubungkan web ini secara live dengan file Google Spreadsheet tab "data" & "akun".
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

        {/* Modal Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Section A: Config Form */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span>Pengaturan URL Aplikasi Web (Google Apps Script)</span>
              </h4>
              <span className="text-[10px] text-gray-500 font-mono font-bold">Status: {webAppUrl ? 'Diatur' : 'Kosong (Mode Lokal)'}</span>
            </div>

            <form onSubmit={handleTestAndSave} className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">
                  URL Google Apps Script Web App:
                </label>
                <input
                  type="text"
                  value={webAppUrl}
                  onChange={(e) => setWebAppUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              {testResult && (
                <div
                  className={`p-2.5 rounded text-xs flex items-center gap-2 border font-medium ${
                    testResult.success
                      ? 'bg-green-50 text-green-800 border-green-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setWebAppUrl('');
                    StorageService.saveConfig({ ...currentConfig, webAppUrl: '' });
                    onConfigUpdated();
                    setTestResult({ success: true, message: 'Kembali menggunakan Mode Penyimpanan Lokal Browser.' });
                  }}
                  className="text-xs text-gray-500 hover:text-gray-800 underline font-medium"
                >
                  Gunakan Mode Lokal (Tanpa Google Sheet)
                </button>

                <button
                  type="submit"
                  disabled={isTesting}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Mencoba...' : 'Tes & Simpan Koneksi'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section B: Steps & Header specifications */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>Langkah-Langkah Membuat Google Spreadsheet & Apps Script:</span>
            </h4>

            <ol className="space-y-2.5 text-xs text-gray-700 list-decimal list-inside leading-relaxed bg-gray-50 p-3.5 rounded-lg border border-gray-200 font-medium">
              <li>
                Buka <strong className="text-gray-900">Google Spreadsheet</strong> baru milik Anda.
              </li>
              <li>
                Buat 2 Tab persis seperti ini:
                <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-gray-600">
                  <li>
                    Tab 1 nama: <code className="text-blue-700 font-mono font-bold bg-blue-50 px-1 rounded border border-blue-200">data</code>
                    <br />
                    Header di baris 1 (sesuai spesifikasi Anda):
                    <div className="p-2 bg-white border border-gray-200 rounded font-mono text-[10px] text-blue-900 overflow-x-auto my-1 font-bold">
                      keyid | tanggal | pesan | jenis | pengirim | pihakterlibat | kelas | metode | topikumum | tersampaikan | forum | respon | tanggaldisampaikan | updateterakhir
                    </div>
                  </li>
                  <li>
                    Tab 2 nama: <code className="text-blue-700 font-mono font-bold bg-blue-50 px-1 rounded border border-blue-200">akun</code>
                    <br />
                    Header di baris 1:
                    <div className="p-2 bg-white border border-gray-200 rounded font-mono text-[10px] text-blue-900 overflow-x-auto my-1 font-bold">
                      username | password | nama | peran
                    </div>
                  </li>
                </ul>
              </li>
              <li>
                Di Google Spreadsheet, klik menu <strong className="text-gray-900">Ekstensi</strong> &rarr; <strong className="text-gray-900">Apps Script</strong>.
              </li>
              <li>
                Hapus semua kode default, lalu tempelkan (paste) kode dari tombol di bawah.
              </li>
              <li>
                Klik <strong className="text-gray-900">Terapkan (Deploy)</strong> &rarr; <strong className="text-gray-900">Penerapan Baru (New Deployment)</strong>.
              </li>
              <li>
                Pilih Jenis: <strong className="text-gray-900">Aplikasi Web</strong>, Jalankan Sebagai: <strong className="text-gray-900">Saya</strong>, Akses: <strong className="text-gray-900">Siapa saja (Anyone)</strong>.
              </li>
              <li>
                Klik <strong className="text-gray-900">Terapkan</strong>, berikan izin Google, lalu salin <strong className="text-blue-700 font-bold">URL Aplikasi Web</strong> yang didapat ke form di atas!
              </li>
            </ol>
          </div>

          {/* Section C: Code Display & Copy Button */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase">
                Kode Google Apps Script (Code.gs):
              </span>
              <button
                onClick={handleCopyCode}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded shadow transition-all flex items-center gap-1.5"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Tersalin ke Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Kode Script</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-3 bg-gray-900 border border-gray-800 rounded text-[11px] font-mono text-green-400 overflow-x-auto max-h-56 leading-relaxed">
              {GOOGLE_APPS_SCRIPT_CODE}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white font-black text-xs uppercase tracking-wider rounded shadow transition-all"
          >
            SELESAI
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { AkunItem } from '../types';
import { StorageService, ApiService } from '../services/api';
import { ShieldCheck, Lock, User, FileSpreadsheet, Sparkles, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: AkunItem) => void;
  onOpenScriptSetup: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onOpenScriptSetup }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Silakan masukkan Username dan Password Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const result = await ApiService.login(username.trim(), password);
      
      if (result.status === 'success' && result.user) {
        StorageService.setCurrentUser(result.user);
        onLoginSuccess(result.user);
      } else {
        setErrorMsg(result.message || 'Username atau password salah.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Username atau password salah.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-100">
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-md overflow-hidden text-gray-900">
        {/* Header Branding */}
        <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white border-b border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 p-1.5 rounded-2xl border border-white/25 flex items-center justify-center shadow-lg shrink-0 overflow-hidden">
              <img src="https://raw.githubusercontent.com/abuhumairoistiqomah/paperraftinsilverbay/7c0dd338838b6212a84ebbd66a2dfdba11be9893/download.png" alt="Paper Raft Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide uppercase text-white">
                Paper Raft in Silver Bay
              </h2>
              <p className="text-xs text-gray-300 italic mt-0.5 leading-relaxed">
                "To save live, you must first understand what they live for and what they die for. The best achieve this is through personal experience"
              </p>
            </div>
          </div>
        </div>

        {/* Form Area */}
        <div className="p-6 space-y-5">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-blue-900">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              Autentikasi Langsung Google Spreadsheet
            </p>
            <p className="text-gray-700 leading-relaxed text-[11px]">
              Akun dan password Anda terverifikasi secara aman melalui server Google Apps Script tab <code className="font-mono font-bold bg-white px-1 py-0.5 rounded border border-blue-200 text-blue-800">akun</code>.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-bold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Username / ID Akun
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan Username atau ID"
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-300 rounded text-gray-900 placeholder-gray-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan Password"
                  className="w-full pl-8 pr-10 py-1.5 bg-gray-50 border border-gray-300 rounded text-gray-900 placeholder-gray-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 p-1 rounded focus:outline-none"
                  title={showPassword ? "Sembunyikan Password" : "Tampilkan Password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-blue-600" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </button>
              </div>

              {/* Password Visibility Checkbox */}
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="checkbox-show-password"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="checkbox-show-password" className="text-xs text-gray-600 cursor-pointer select-none font-medium">
                  Tampilkan Password
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded shadow transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <span>MASUK KE SISTEM</span>
              )}
            </button>
          </form>

          {/* Quick link to guide */}
          <div className="pt-3 border-t border-gray-200 text-center">
            <button
              type="button"
              onClick={onOpenScriptSetup}
              className="text-xs text-gray-600 hover:text-blue-700 font-semibold flex items-center justify-center gap-1.5 mx-auto transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              <span>Panduan Setup / Ganti URL Google Spreadsheet</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-[10px] text-gray-500 text-center font-mono">
          Paper Raft in Silver Bay &copy; {new Date().getFullYear()} - Authenticated via GAS API
        </div>
      </div>
    </div>
  );
};

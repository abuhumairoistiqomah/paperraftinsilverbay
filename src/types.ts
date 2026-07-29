export interface PengaduanItem {
  keyid: string;
  tanggal: string; // YYYY-MM-DD
  pesan: string;
  jenis: 'Masukan' | 'Kritik' | 'Saran' | 'Apresiasi' | 'Pengaduan' | string;
  pengirim: 'Guru' | 'Siswa' | 'Orang Tua' | 'Komite' | 'Staf' | string;
  pihakterlibat: string;
  kelas: string;
  metode: 'Tatap Muka' | 'Telepon' | 'WhatsApp' | 'Form Online' | 'Rapat' | 'Surat' | string;
  topikumum: string;
  tersampaikan: 'Sudah' | 'Belum' | string;
  forum: string;
  respon: string;
  tanggaldisampaikan: string;
  updateterakhir: string;
}

export interface AkunItem {
  username: string;
  password?: string;
  nama: string;
  peran: string;
}

export interface FilterState {
  keyid: string;
  tanggalAwal: string;
  tanggalAkhir: string;
  searchPesan: string;
  jenis: string;
  tersampaikan: string;
  pengirim: string;
  kelas: string;
}

export interface AppsScriptConfig {
  webAppUrl: string;
  spreadsheetId?: string;
  lastSynced?: string;
  isAutoSync: boolean;
}

export type ActiveTab = 'dashboard' | 'historis' | 'analisis' | 'pengaturan';
export type AnalysisType = 'jenis' | 'pengirim' | 'kelas' | 'tersampaikan';

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * GOOGLE APPS SCRIPT UNTUK SISTEM TRACKING PENGADUAN WAKIL KURIKULUM
 * =================================================================
 *
 * Petunjuk Pemasangan:
 * 1. Buka Google Spreadsheet Anda yang berisi tab "data" dan "akun".
 * 2. Klik menu: Ekstensi -> Apps Script
 * 3. Hapus semua kode default, lalu Paste seluruh kode ini di editor Code.gs.
 * 4. Klik "Simpan" (Ctrl+S atau ikon disket).
 * 5. Klik tombol "Terapkan" (Deploy) -> "Penerapan Baru" (New Deployment).
 * 6. Pilih Jenis: "Aplikasi Web" (Web App).
 * 7. Deskripsi: "Tracking Pengaduan Web API v2 (Secure Auth)"
 * 8. Jalankan sebagai (Execute as): "Saya" (Me / email Anda).
 * 9. Yang memiliki akses (Who has access): "Siapa saja" (Anyone).
 * 10. Klik "Terapkan" (Deploy), lalu Salin (Copy) "URL Aplikasi Web" yang dihasilkan.
 * 11. Tempelkan URL tersebut ke dalam aplikasi Web ini pada menu Pengaturan!
 */

const SPREADSHEET_ID = ""; // Opsional: Kosongkan jika script ini melekat pada Spreadsheet (Container-bound)

function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID !== "") {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// -------------------------------------------------------------
// GET REQUEST: Membaca data pengaduan saja (AMAT SANGAT AMAN)
// -------------------------------------------------------------
function doGet(e) {
  try {
    const ss = getSpreadsheet();
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "getAll";

    // Tes Koneksi Ping
    if (action === "ping") {
      return createJsonResponse({ status: "success", message: "Koneksi Google Apps Script Berhasil!" });
    }

    // Ambil Data Pengaduan (Tab "data")
    const dataSheet = ss.getSheetByName("data");
    let pengaduanList = [];
    if (dataSheet) {
      const dataValues = dataSheet.getDataRange().getValues();
      if (dataValues.length > 1) {
        const headers = dataValues[0].map(h => String(h).trim().toLowerCase());
        for (let i = 1; i < dataValues.length; i++) {
          const row = dataValues[i];
          if (!row[0] && !row[2]) continue; // Lewati baris kosong
          
          const obj = {};
          headers.forEach((header, index) => {
            let val = row[index];
            if (val instanceof Date) {
              val = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
            }
            obj[header] = val !== undefined ? String(val) : "";
          });
          pengaduanList.push(obj);
        }
      }
    }

    // Hanya mengembalikan data pengaduan. TIDAK MENGEMBALIKAN AKUN/PASSWORD.
    return createJsonResponse({
      status: "success",
      data: pengaduanList
    });

  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: err.toString()
    });
  }
}

// -------------------------------------------------------------
// POST REQUEST: Autentikasi Login, Tambah/Edit, & Hapus Data
// -------------------------------------------------------------
function doPost(e) {
  try {
    const ss = getSpreadsheet();
    let payload = {};

    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }

    const action = payload.action || "";

    // 1. ACTION: LOGIN (Validasi Username & Password di Server)
    if (action === "login") {
      const usernameInput = String(payload.username || "").normalize("NFKC").trim();
      const passwordInput = String(payload.password || "").trim();

      if (!usernameInput || !passwordInput) {
        return createJsonResponse({
          status: "error",
          message: "Username dan password wajib diisi."
        });
      }

      const akunSheet = ss.getSheetByName("akun");
      if (!akunSheet) {
        return createJsonResponse({
          status: "error",
          message: "Tab 'akun' tidak ditemukan di Google Spreadsheet."
        });
      }

      // Menggunakan getDisplayValues() agar angka/string dengan nol di depan tidak berubah
      const akunValues = akunSheet.getDataRange().getDisplayValues();
      if (akunValues.length < 2) {
        return createJsonResponse({
          status: "error",
          message: "Username atau password salah."
        });
      }

      // Bersihkan dan normalkan header
      const headers = akunValues[0].map(h => String(h).trim().toLowerCase());
      
      // Cari index kolom username / id & password
      const usernameColIndex = headers.findIndex(h => h === "username" || h === "id");
      const passwordColIndex = headers.findIndex(h => h === "password");

      if (usernameColIndex === -1 || passwordColIndex === -1) {
        return createJsonResponse({
          status: "error",
          message: "Header 'username'/'id' atau 'password' tidak ditemukan pada tab 'akun'."
        });
      }

      const namaColIndex = headers.findIndex(h => h === "nama");
      const roleColIndex = headers.findIndex(h => h === "role" || h === "peran");
      const statusColIndex = headers.findIndex(h => h === "status");

      let authenticatedUser = null;

      for (let i = 1; i < akunValues.length; i++) {
        const row = akunValues[i];
        const rowUsername = String(row[usernameColIndex] || "").normalize("NFKC").trim();
        const rowPassword = String(row[passwordColIndex] || "").trim();

        // Validasi: Username Case-Insensitive, Password Case-Sensitive
        if (rowUsername.toLowerCase() === usernameInput.toLowerCase() && rowPassword === passwordInput) {
          
          // Cek kolom status jika tersedia
          if (statusColIndex !== -1) {
            const rowStatus = String(row[statusColIndex] || "").trim().toLowerCase();
            if (rowStatus && rowStatus !== "aktif" && rowStatus !== "active" && rowStatus !== "true" && rowStatus !== "1") {
              return createJsonResponse({
                status: "error",
                message: "Akun Anda tidak aktif. Silakan hubungi administrator."
              });
            }
          }

          const namaVal = namaColIndex !== -1 ? String(row[namaColIndex] || "").trim() : "";
          const roleVal = roleColIndex !== -1 ? String(row[roleColIndex] || "").trim() : "";

          authenticatedUser = {
            username: rowUsername,
            nama: namaVal || rowUsername,
            peran: roleVal || "Pengguna"
          };
          break;
        }
      }

      if (authenticatedUser) {
        return createJsonResponse({
          status: "success",
          message: "Login berhasil.",
          user: authenticatedUser
        });
      } else {
        return createJsonResponse({
          status: "error",
          message: "Username atau password salah."
        });
      }
    }

    // 2. ACTION: SAVE PENGADUAN (Tambah / Edit)
    if (action === "savePengaduan") {
      let dataSheet = ss.getSheetByName("data");
      if (!dataSheet) {
        dataSheet = ss.insertSheet("data");
        dataSheet.appendRow([
          "keyid", "tanggal", "pesan", "jenis", "pengirim", "pihakterlibat", 
          "kelas", "metode", "topikumum", "tersampaikan", "forum", "respon", 
          "tanggaldisampaikan", "updateterakhir"
        ]);
      }

      const item = payload.item;
      if (!item) throw new Error("Data pengaduan tidak valid.");

      const dataValues = dataSheet.getDataRange().getValues();
      let foundRowIndex = -1;

      // Cari berdasarkan keyid
      if (item.keyid && dataValues.length > 1) {
        for (let i = 1; i < dataValues.length; i++) {
          if (String(dataValues[i][0]).trim() === String(item.keyid).trim()) {
            foundRowIndex = i + 1; // Row Index 1-based
            break;
          }
        }
      }

      // Baris data yang akan diset
      const rowData = [
        item.keyid || ("PENG-" + new Date().getTime()),
        item.tanggal || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
        item.pesan || "",
        item.jenis || "Masukan",
        item.pengirim || "Guru",
        item.pihakterlibat || "",
        item.kelas || "",
        item.metode || "Tatap Muka",
        item.topikumum || "",
        item.tersampaikan || "Belum",
        item.forum || "",
        item.respon || "",
        item.tanggaldisampaikan || "",
        item.updateterakhir || ""
      ];

      if (foundRowIndex > 0) {
        // Update baris eksisting
        dataSheet.getRange(foundRowIndex, 1, 1, rowData.length).setValues([rowData]);
      } else {
        // Tambah baris baru
        dataSheet.appendRow(rowData);
      }

      return createJsonResponse({
        status: "success",
        message: foundRowIndex > 0 ? "Pengaduan berhasil diperbarui!" : "Pengaduan baru berhasil ditambahkan!",
        keyid: rowData[0]
      });
    }

    // 3. ACTION: DELETE PENGADUAN
    if (action === "deletePengaduan") {
      const keyid = payload.keyid;
      const dataSheet = ss.getSheetByName("data");
      if (dataSheet && keyid) {
        const values = dataSheet.getDataRange().getValues();
        for (let i = 1; i < values.length; i++) {
          if (String(values[i][0]).trim() === String(keyid).trim()) {
            dataSheet.deleteRow(i + 1);
            return createJsonResponse({ status: "success", message: "Data berhasil dihapus" });
          }
        }
      }
      return createJsonResponse({ status: "error", message: "Key ID tidak ditemukan" });
    }

    return createJsonResponse({ status: "error", message: "Action tidak dikenali." });

  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: err instanceof Error ? err.message : String(err)
    });
  }
}
`;

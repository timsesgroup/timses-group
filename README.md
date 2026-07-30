# Ex TIMSES - Web Data Input & Real-Time Google Engine

**Ex TIMSES** adalah aplikasi web SaaS modern dan *mobile-friendly* yang dirancang untuk input data real-time, sinkronisasi otomatis ke Google Sheets, pengiriman notifikasi email, serta visualisasi analitik harian.

---

## 🌟 Fitur Utama

- **📱 Input Data Responsif & Cepat**: Form input data interaktif yang dioptimalkan untuk perangkat seluler maupun desktop.
- **📊 Real-Time Analytics Dashboard**: Ringkasan data harian, grafik tren, dan rekapitulasi status input menggunakan visualisasi interaktif.
- **⚡ Dual Engine Integration**:
  1. **Google Sheets API / OAuth**: Sinkronisasi data langsung ke lembar kerja (*spreadsheet*).
  2. **Google Apps Script Web App**: Jalur alternatif tanpa OAuth, cukup gunakan URL Apps Script yang dideploy.
- **📧 Automated Email Notification**: Pengiriman email notifikasi otomatis ke penerima setelah data berhasil disubmit.
- **⚙️ Apps Script Generator**: Generator kode Google Apps Script bawaan di dalam aplikasi untuk mempermudah setup *Web App Deployment*.
- **🔍 Filter & Pencarian Data**: Pencarian data cepat berdasarkan tanggal, status, atau kata kunci.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React Icons, Motion Animation, Recharts
- **Backend / Server**: Node.js, Express, TypeScript, Google APIs Client Libraries (`googleapis`)
- **Bundler & Build Tool**: `esbuild`, `tsx`

---

## 🚀 Panduan Memulai (Cara Menjalankan Lokal)

### Prasyarat
- Node.js (v18 atau lebih baru)
- npm / yarn / pnpm

### Langkah Instalasi

1. **Clone repository ini**:
   ```bash
   git clone <URL_REPOSITORY_ANDA>
   cd ex-timses
   ```

2. **Install dependensi**:
   ```bash
   npm install
   ```

3. **Pengaturan Environment Variable**:
   Buat file `.env` berdasarkan `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. **Jalankan mode pengembangan (Development)**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000`.

5. **Build untuk Produksi**:
   ```bash
   npm run build
   ```

6. **Jalankan Server Produksi**:
   ```bash
   npm start
   ```

---

## 📄 Skrip NPM

| Command | Keterangan |
| --- | --- |
| `npm run dev` | Menjalankan dev server Express + Vite menggunakan `tsx` |
| `npm run build` | Melakukan build frontend Vite dan bundling server dengan `esbuild` ke `dist/server.cjs` |
| `npm start` | Menjalankan server hasil build di `dist/server.cjs` |
| `npm run lint` | Melakukan pemeriksaan tipe TypeScript |

---

## 🌐 Panduan Deployment

### Option A: Cloud Run / VPS / Docker Container
Aplikasi ini dilengkapi dengan server Express full-stack.
1. Jalankan `npm run build`
2. Jalankan `npm start` pada port `3000`

### Option B: Google Apps Script Web App Mode (Tanpa Server OAuth)
1. Buka tab **Integrasi Apps Script** pada aplikasi.
2. Salin kode Apps Script yang disediakan.
3. Tempelkan kode ke **Google Apps Script Extensions** pada Google Sheet Anda.
4. Deploy sebagai **Web App** (*Execute as: Me*, *Who has access: Anyone*).
5. Salin **Web App URL** dan simpan di pengaturan aplikasi Ex TIMSES.

---

## 📜 Lisensi

Hak Cipta &copy; Ex TIMSES. Semua hak dilindungi undang-undang.

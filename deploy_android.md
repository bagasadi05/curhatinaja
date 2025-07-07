# Rencana Deployment Aplikasi ke Android

Dokumen ini menjelaskan langkah-langkah untuk mengubah aplikasi web Next.js ini menjadi aplikasi Android yang dapat di-deploy.

## Langkah 1: Menjadikan Aplikasi Anda Progressive Web App (PWA)

PWA adalah aplikasi web yang dapat "diinstal" di _homescreen_ perangkat, berfungsi secara _offline_, dan terasa seperti aplikasi _native_. Ini adalah fondasi yang penting.

**Tindakan yang sudah dilakukan:**
*   **Menambahkan `next-pwa`**: Paket ini telah ditambahkan ke `package.json` untuk mengonfigurasi PWA.
*   **Membuat `manifest.json`**: File `public/manifest.json` telah dibuat untuk mendeskripsikan aplikasi ke perangkat.
*   **Mengonfigurasi Next.js**: File `next.config.ts` telah diperbarui untuk mengaktifkan fungsionalitas PWA.
*   **Menghubungkan Manifest**: Link ke manifest telah ditambahkan di `src/app/layout.tsx`.

**Tugas Anda:**
*   **Tambahkan Ikon Aplikasi**: Anda perlu menambahkan ikon aplikasi ke folder `public/icons` dengan nama `icon-192x192.png` dan `icon-512x512.png` agar PWA berfungsi dengan baik.

## Langkah 2: Membungkus Aplikasi dengan Capacitor untuk Play Store

Setelah aplikasi menjadi PWA, Anda dapat menggunakan **Capacitor** untuk membungkusnya menjadi file aplikasi Android (.apk/.aab) yang bisa diunggah ke Google Play Store.

Berikut adalah langkah-langkah manual yang perlu Anda lakukan di terminal Anda:

1.  **Instal Capacitor CLI & Dependencies:**
    ```bash
    npm install @capacitor/cli @capacitor/core @capacitor/android
    ```

2.  **Inisialisasi Capacitor:**
    Jalankan perintah ini dan ikuti petunjuknya.
    ```bash
    npx cap init "CurhatinAja" "com.curhatin.aja"
    ```
    -   **Penting**: Saat ditanya untuk "web asset directory", masukkan `out`.

3.  **Sesuaikan Konfigurasi Next.js untuk Static Export**:
    Buka `next.config.js` dan tambahkan baris berikut di dalam objek `nextConfig`:
    ```javascript
    output: 'export',
    ```
    Ini akan membuat Next.js menghasilkan folder `out` yang berisi file HTML/CSS/JS statis saat Anda menjalankan `npm run build`.

4.  **Build Aplikasi Web:**
    ```bash
    npm run build
    ```
    Perintah ini akan membuat folder `out` yang akan digunakan oleh Capacitor.

5.  **Tambahkan Platform Android:**
    ```bash
    npx cap add android
    ```
    Ini akan membuat proyek Android di dalam direktori `android`.

6.  **Buka Proyek di Android Studio:**
    ```bash
    npx cap open android
    ```

7.  **Build dan Deploy dari Android Studio:**
    Dari Android Studio, Anda dapat membuat (_build_) file APK atau Android App Bundle (AAB) untuk diuji pada perangkat fisik atau diunggah ke Google Play Store.

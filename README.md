# SUARA — Public Participation Platform

Paket ini berisi versi web SUARA berbahasa Inggris yang siap diunggah ke root repositori GitHub Pages.

## Isi paket

- `index.html` — halaman utama aplikasi.
- `styles.css` — seluruh tampilan dan responsive layout.
- `app.js` — navigasi, login demo, sapaan suara, formulir, riwayat lokal, tema, dan tombol instalasi.
- `manifest.webmanifest` — identitas dan konfigurasi instalasi PWA.
- `sw.js` — service worker dan cache offline.
- `assets/` — ikon aplikasi.

## Catatan penting

1. Unggah isi folder ini ke root repositori GitHub, bukan file ZIP-nya dan bukan folder pembungkus `SUARA-WEB-GITHUB`.
2. Pastikan nama halaman utama tepat `index.html` (huruf kecil), bukan `indeks.html`.
3. Aktifkan GitHub Pages melalui Settings → Pages, pilih `Deploy from a branch`, pilih branch repositori yang digunakan (pada tangkapan layar: `utama`) dan folder `/(root)`.
4. Buka URL HTTPS yang diberikan GitHub Pages. PWA dan service worker memerlukan HTTPS (localhost untuk pengujian lokal).

## Batasan data dan keamanan

Halaman login ini merupakan demo antarmuka. NIK hanya divalidasi sebagai 16 digit di browser dan tidak dikirim ke server atau disimpan. Ini bukan verifikasi identitas resmi. Aspirasi dan review disimpan di localStorage browser/perangkat, belum masuk ke database pusat. Jangan memasukkan NIK asli atau informasi sensitif sebelum backend, autentikasi, dan perlindungan data diterapkan.

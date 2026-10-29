# Simulasi AK Dosen

Alat perencanaan kenaikan jabatan akademik dosen berdasarkan **Kepmendiktisaintek No. 39/M/KEP/2026**.
Dipakai oleh dosen mana pun (PNS, PTN BH, PTS), dari Asisten Ahli sampai Profesor, termasuk jalur dua jenjang.

## Yang dihitung

- AK Konversi per tahun dari predikat SKP × koefisien jabatan (Tabel 28), sebanding bulan pada tahun TMT.
- Plafon AK tahunan (Tabel 27). AK penelitian yang melewati plafon ditandai *tidak diakui*.
- Kebutuhan AK dari AK kumulatif di SK, dan proporsi minimal penelitian 35/40/45% (Bab D.2).
- Pembagian AK antarpenulis (Keterangan *1 Tabel 2), termasuk kasus penulis pertama bukan korespondensi.
- Batas kepatutan: prosiding/seminar 25%, jurnal tidak terakreditasi 10%, populer + laporan 5%; batas karya per tahun.
- Syarat khusus tiap jalur (Tabel 4, 5, 6, 14, 15) beserta pengecualian: penulis tunggal, hasil tesis/disertasi,
  jurnal PT sendiri, edisi khusus seminar, terbit sebelum TMT.
- Syarat lain: masa jabatan 2 tahun, BKD 4 semester di PT yang sama (termasuk kasus pindah kampus), SKP 2 tahun, pangkat PNS, ijazah doktor, 10 tahun dosen tetap, serdos,
  syarat tambahan Profesor, prestasi luar biasa.
- AK ijazah doktor (isian pengguna: AK ijazah baru dikurangi AK ijazah yang sudah diklaim).

## Tampilan

- Tiga tab: Simulasi, Rujukan juknis, Simpan & cetak. Tautan langsung: `#simulasi`, `#rujukan`, `#simpan`.
- Tangga jabatan di kepala halaman bisa diklik: jenjang di atas jabatan saat ini menjadi target,
  jenjang di bawahnya menjadi jabatan saat ini.
- Tombol ⓘ di 16 tempat membuka penjelasan singkat di bawah label, dengan tautan ke entri juknis yang
  relevan. Tidak bergantung pada hover, jadi berfungsi di layar sentuh dan keyboard (Esc menutup).
- Panduan langkah awal (5 langkah) muncul setelah *Mulai dari kosong* dan bisa dibuka lagi lewat tombol
  *Panduan langkah awal*. Kartunya tidak menutup halaman, jadi isian tetap bisa diisi sambil mengikuti panduan.
- Laporan PDF lewat dialog cetak peramban (Simpan sebagai PDF). Teks di PDF tetap bisa dipilih dan dicari.
  Di pratinjau Claude Artifact dialog cetak diblokir; di situs biasa berfungsi.

## Riwayat versi

- **1.1.1** (28 Okt 2026): kolom *Kurang* (sisa AK menuju target) di samping *Kumulatif* pada tabel proyeksi.
- **1.1.0** (23 Okt 2026): panduan langkah awal; nomor versi aplikasi di kaki halaman.
- **1.0.0** (22 Okt 2026): rilis awal.

## Struktur

```
index.html          markup saja, tanpa skrip/gaya inline (siap CSP ketat)
css/styles.css      gaya; design system Professional (bergside/awesome-design-skills), tema terang saja,
                    termasuk gaya cetak A4 untuk laporan PDF
js/rules.js         data aturan juknis (angka + rujukan tabel). Ubah di sini bila juknis direvisi.
js/engine.js        perhitungan murni, tanpa DOM; bisa dipakai di Node
js/sample.js        data contoh saat pertama dibuka
js/help.js          teks penjelasan tombol ⓘ, masing-masing tertaut ke entri Rujukan juknis
js/app.js           antarmuka; data pengguna hanya lewat textContent
tests/engine.test.js  uji terhadap contoh perhitungan juknis
tools/build-artifact.py  membuat versi pratinjau untuk Claude Artifact
```

## Menjalankan dan menguji

```
python3 -m http.server 8000      # buka http://localhost:8000
node tests/engine.test.js        # 29 uji
```

## Publikasi ke internet

Situs statis murni, tanpa server dan tanpa basis data. Bisa langsung di GitHub Pages, Netlify, Cloudflare Pages,
atau hosting kampus. Salin seluruh folder (kecuali `tests/` dan `tools/` bila tak diperlukan).

Catatan keamanan dan privasi:

- Tidak ada data yang dikirim ke server. Rencana disimpan di `localStorage` peramban pengguna; impor data
  melewati `sanitizePlan()` (daftar putih kunci, tipe dipaksa, batas panjang).
- `index.html` memuat meta CSP: skrip hanya dari domain sendiri, font dari Google Fonts. Bila hosting
  mendukung header, kirim CSP yang sama sebagai header HTTP, ditambah
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, dan
  `frame-ancestors 'self'`.
- Tidak ada pustaka JavaScript pihak ketiga. Bila ingin bebas sepenuhnya dari pihak ketiga, unduh berkas font
  (Poppins dan IBM Plex Mono; keduanya berlisensi OFL) ke folder `fonts/`, ganti
  `<link>` Google Fonts dengan `@font-face`, lalu hapus domain Google dari CSP.

## Asumsi yang perlu dikonfirmasi

- Plafon penelitian tahun pertama dipotong sebanding bulan sejak TMT.
- Plafon penelitian = plafon total − AK Konversi (persis Tabel 27 untuk predikat Baik dan Sangat Baik).
- Q2 = 38 AK (Tabel 2), walau contoh juknis memakai 37,5.
- Ambang IF jalur Lektor → Profesor memakai 7 (Tabel 15), bukan 5 (Bab D.6.f).
- Nilai AK ijazah doktor tidak diatur dalam juknis ini.
- Karya seni (Tabel 3) belum dimodelkan.

Simulasi ini alat bantu perencanaan, bukan penetapan resmi.

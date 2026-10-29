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

- Empat tab: Simulasi, Cara pakai, Rujukan, Simpan. Tautan langsung: `#simulasi`, `#carapakai`, `#rujukan`, `#simpan`.
- Navigasi bagian di tab Simulasi (Hasil, Data diri, Karya, Proyeksi, Alat perencanaan) dengan penanda bagian aktif.
- Mode malam (tombol kanan atas); pilihan disimpan di peramban, bawaan mengikuti pengaturan sistem. Laporan PDF selalu tercetak terang.
- Tangga jabatan di kepala halaman bisa diklik: jenjang di atas jabatan saat ini menjadi target,
  jenjang di bawahnya menjadi jabatan saat ini.
- Tombol ⓘ di 16 tempat membuka penjelasan singkat di bawah label, dengan tautan ke entri juknis yang
  relevan. Tidak bergantung pada hover, jadi berfungsi di layar sentuh dan keyboard (Esc menutup).
- Panduan langkah awal (5 langkah) muncul setelah *Mulai dari kosong* dan bisa dibuka lagi lewat tombol
  *Panduan langkah awal*. Kartunya tidak menutup halaman, jadi isian tetap bisa diisi sambil mengikuti panduan.
- Laporan PDF lewat dialog cetak peramban (Simpan sebagai PDF). Teks di PDF tetap bisa dipilih dan dicari.
  Di pratinjau Claude Artifact dialog cetak diblokir; di situs biasa berfungsi.

## Riwayat versi

- **1.7.0** (29 Okt 2026): tab Cara pakai; tab disingkat; navigasi bagian; Saran rencana dan Skenario dikelompokkan sebagai Alat perencanaan; mode malam (`js/theme.js`, token gelap di `styles.css`).
- **1.6.1** (29 Okt 2026): nama dokumen acuan diberi bulan terbit (LLDIKTI VII Oktober 2026; Ditjen Dikti Agustus 2026).
- **1.6.0** (29 Okt 2026): saran rencana (karya hipotetis per tahun, dihitung ulang dengan seluruh aturan); bandingkan skenario (≤ 5, di peramban); status karya rencana/dikirim/diterima/terbit dan proyeksi konservatif; nomor halaman juknis di Rujukan.
- **1.5.0** (29 Okt 2026): mode pengangkatan pertama (belum punya jabatan → Asisten Ahli/Lektor); rekomendasi publikasi penulis pertama untuk AA (tidak memblokir); IKD Asisten Ahli; rujukan pengangkatan pertama.
- **1.4.0** (29 Okt 2026): panel IKD (Kepmen 500/M/2024) dengan komponen penelitian dihitung dari karya; rujukan IKD per jabatan; daftar Dokumen acuan di tab Rujukan.
- **1.3.1** (29 Okt 2026): catatan + tautan Asumsi simulasi di kepala halaman; tombol unduh .json selalu tampil (pesan bila diblokir pratinjau).
- **1.3.0** (29 Okt 2026): AK ijazah doktor otomatis per jabatan saat lulus (paparan LLDIKTI VII); butir IKD; pengecualian literature review/short communication; rujukan AK pendidikan, IKD, kesiapan berkas; kuartil/SJR pada tahun terbit dan dinilai; riwayat versi di aplikasi.
- **1.2.0** (29 Okt 2026): data contoh fiktif (tidak terkait dosen mana pun); panel *Beri penilaian* di tab Simpan & cetak yang membuka survei Google Forms; siap GitHub Pages.
- **1.1.1** (28 Okt 2026): kolom *Kurang* (sisa AK menuju target) di samping *Kumulatif* pada tabel proyeksi.
- **1.1.0** (23 Okt 2026): panduan langkah awal; nomor versi aplikasi di kaki halaman.
- **1.0.0** (22 Okt 2026): rilis awal.

## Struktur

```
index.html          markup saja, tanpa skrip/gaya inline (siap CSP ketat)
css/styles.css      gaya; design system Professional (bergside/awesome-design-skills), tema terang saja,
                    termasuk gaya cetak A4 untuk laporan PDF
js/theme.js         tema terang/gelap, dimuat di <head> agar tidak berkedip
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
node tests/engine.test.js        # 39 uji
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

## Dokumen acuan

1. Juknis: Kepmendiktisaintek No. 39/M/KEP/2026 (sumber utama).
2. Kepmen 500: Kepmendikbudristek No. 500/M/2024 tentang Standar Minimum IKD dan Kriteria Publikasi Ilmiah (IKD).
3. Paparan LLDIKTI VII (Oktober 2026), 27 Okt 2026 (AK pendidikan formal).
4. Paparan Direktorat Sumber Daya Ditjen Dikti, Agustus 2026 (kesiapan berkas, literature review, IF 7).

## Asumsi yang perlu dikonfirmasi

- Plafon penelitian tahun pertama dipotong sebanding bulan sejak TMT.
- Plafon penelitian = plafon total − AK Konversi (persis Tabel 27 untuk predikat Baik dan Sangat Baik).
- Q2 = 38 AK (Tabel 2), walau contoh juknis memakai 37,5.
- Ambang IF jalur Lektor → Profesor memakai 7 (Tabel 15), dikonfirmasi paparan Ditjen Dikti Agustus 2026.
- AK ijazah doktor: juknis tidak menyebut angkanya; aplikasi memakai nilai paparan LLDIKTI VII (AA 12,5; L 25; LK 37,5; P 50).
- IKD: komponen penelitian dihitung dari daftar karya (3 tahun; buku Profesor 6 tahun); pendidikan/pengabdian dikonfirmasi pengguna.
- Karya seni (Tabel 3) belum dimodelkan.

## Lisensi

Kode aplikasi ini dirilis di bawah [Lisensi MIT](LICENSE). Hasil simulasi adalah alat bantu perencanaan, bukan penetapan angka kredit resmi.

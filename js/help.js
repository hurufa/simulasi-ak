/*
 * Penjelasan singkat untuk tombol ⓘ. Setiap entri: teks 1–2 kalimat dan, bila ada,
 * id entri di tab Rujukan (ref) yang dibuka oleh tautan "Selengkapnya".
 * Teks hanya ditulis lewat textContent.
 */
(function (root) {
  'use strict';
  root.AKHelp = Object.freeze({
    aksk: {
      text: 'Isi TOTAL AK pada dokumen PAK jabatan terakhir (biasanya lampiran SK) atau di SISTER. Angkanya bisa lebih besar dari nilai terendah jabatan, misalnya 215 untuk Lektor. Bila belum ketemu, isi sementara nilai terendah jabatan Anda; hasilnya cenderung lebih lambat dari kenyataan.',
      ref: 'ref-ak-kumulatif'
    },
    tmt: {
      text: 'Tanggal mulai berlakunya SK jabatan terakhir. Dipakai untuk syarat paling singkat 2 tahun dalam jabatan, dan untuk menghitung jumlah bulan pada tahun pertama proyeksi.',
      ref: 'ref-syarat'
    },
    target: {
      text: 'Setiap jenjang punya beberapa nilai AK, misalnya Lektor Kepala 400, 550, atau 700. Angka yang lebih tinggi butuh AK lebih banyak dan biasanya terkait pangkat Dosen PNS yang lebih tinggi.',
      ref: 'ref-jenjang'
    },
    horizon: {
      text: 'Menentukan sampai tahun berapa tabel dan grafik proyeksi dihitung. Proyeksi selalu dimulai dari tahun TMT. Pilihan ini tidak mengubah hasil perhitungan, hanya panjang proyeksinya.'
    },
    ijazah: {
      text: 'Nilai AK ijazah mengikuti jabatan saat ijazah diperoleh: Asisten Ahli 12,5, Lektor 25, Lektor Kepala 37,5, Profesor 50 (paparan LLDIKTI Wilayah VII, Oktober 2026). Pilih Isi sendiri bila tim PAK menetapkan nilai lain.',
      ref: 'ref-ak-pendidikan'
    },
    skp: {
      text: 'AK Konversi = persentase predikat × koefisien jabatan. Plafon total per tahun tetap, sehingga predikat Sangat Baik menambah AK Konversi tetapi mengurangi ruang AK penelitian tahun itu dengan jumlah yang sama.',
      ref: 'ref-plafon'
    },
    tetap: {
      text: 'Dihitung sejak diangkat sebagai dosen tetap, termasuk masa CPNS dan tugas belajar. Masa sebagai calon dosen atau dosen tidak tetap tidak dihitung. Syarat Profesor: minimal 10 tahun.',
      ref: 'ref-syarat'
    },
    bkd: {
      text: 'Juknis mensyaratkan BKD 4 semester berturut-turut dari perguruan tinggi yang sama. Bila Anda pindah kampus, simulasi menghitung 4 semester sejak semester pertama di kampus sekarang, sehingga usulan paling cepat 24 bulan setelah tanggal ini.',
      ref: 'asumsi'
    },
    jenis: {
      text: 'Setiap jenis karya punya AK maksimal sendiri (Tabel 2). Beberapa jenis dibatasi: buku dan book chapter 1 per tahun, hak cipta 1 per semester, prosiding paling banyak 25% dari AK penelitian yang diperlukan.',
      ref: 'ref-kepatutan'
    },
    sjr: {
      text: 'Pakai SJR dan kuartil pada kategori bidang artikel di SCImago Journal Rank. Nilainya harus memenuhi pada tahun terbit dan tahun dinilai. Ambang SJR menentukan apakah artikel bisa dipakai untuk syarat khusus, misalnya di atas 0,2 untuk Lektor Kepala.',
      ref: 'ref-jurnal'
    },
    peran: {
      text: 'AK maksimal karya dibagi menurut peran. Pada dua penulis, penulis pertama sekaligus korespondensi mendapat 60%. Pada tiga penulis atau lebih, anggota berbagi rata sisa 40%, atau 20% bila penulis pertama bukan korespondensi.',
      ref: 'ref-penulis'
    },
    saran: {
      text: 'Saran disusun dengan menambahkan karya hipotetis lalu menghitung ulang seluruh aturan (plafon, kepatutan, syarat khusus, IKD). Syarat yang tidak bisa dipenuhi lewat karya, seperti masa jabatan, SKP, BKD, atau ijazah, tidak ikut diubah.',
      ref: 'ref-plafon'
    },
    skenario: {
      text: 'Setiap skenario adalah salinan lengkap rencana. Muat untuk melanjutkan mengubahnya; rencana yang sedang terbuka akan diganti, jadi simpan dulu bila masih diperlukan.'
    },
    ikd: {
      text: 'IKD adalah standar kinerja minimal per jabatan (Kepmen 500/M/2024). Saat mengusulkan, Anda menunjukkan satu bukti pendidikan dan satu bukti penelitian atau pengabdian sesuai jabatan yang dituju. Bukti itu dicek di SISTER, terpisah dari SKP dan BKD.',
      ref: 'ref-ikd'
    },
    larangan: {
      text: 'Keadaan ini tidak mengurangi AK karya. Karya tetap dihitung sebagai AK penelitian, tetapi tidak bisa dipakai untuk memenuhi syarat khusus publikasi.',
      ref: 'ref-sk-larangan'
    },
    kekurangan: {
      text: 'Nilai AK target dikurangi AK kumulatif pada PAK jabatan terakhir. Inilah jumlah AK yang harus dikumpulkan sejak TMT.',
      ref: 'ref-proporsi'
    },
    penelitian: {
      text: 'Bagian dari kekurangan AK yang wajib berasal dari penelitian: 35% menuju Lektor, 40% menuju Lektor Kepala, 45% menuju Profesor. AK Konversi dan AK ijazah tidak dihitung di sini.',
      ref: 'ref-proporsi'
    },
    siap: {
      text: 'Waktu paling awal semua syarat di Daftar syarat terpenuhi: AK, penelitian, syarat khusus, masa jabatan, SKP, dan syarat lain. Dinilai pada akhir tahun, mengikuti penilaian AK Prestasi tahunan.',
      ref: 'ref-syarat'
    },
    syarat: {
      text: 'Semua butir harus berstatus Terpenuhi sebelum usulan diajukan di SISTER. Butir yang berlaku menyesuaikan jalur: Dosen PNS, Profesor, dan loncat dua jenjang punya syarat tambahan.',
      ref: 'ref-syarat'
    },
    proyeksi: {
      text: 'Plafon penelitian adalah batas AK penelitian yang diakui tahun itu (plafon total dikurangi AK Konversi). Kolom Tidak diakui berisi AK penelitian yang melewati plafon atau batas kepatutan; geser karya ke tahun lain agar terhitung.',
      ref: 'ref-plafon'
    }
  });
})(typeof self !== 'undefined' ? self : this);

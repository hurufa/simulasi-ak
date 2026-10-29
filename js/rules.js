/*
 * Simulasi AK Dosen — basis aturan
 * Sumber: Kepmendiktisaintek No. 39/M/KEP/2026 tentang Petunjuk Teknis Layanan
 * Pengembangan Profesi dan Karier Dosen. Setiap angka diberi rujukan tabel/bagian
 * juknis agar mudah diperiksa ulang ketika juknis direvisi.
 *
 * Berkas ini hanya berisi data. Tidak ada logika dan tidak ada akses DOM.
 */
(function (root, factory) {
  const rules = factory();
  if (typeof module === 'object' && module.exports) module.exports = rules;
  else root.AKRules = rules;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function deepFreeze(o) {
    Object.values(o).forEach(function (v) {
      if (v && typeof v === 'object' && !Object.isFrozen(v)) deepFreeze(v);
    });
    return Object.freeze(o);
  }

  return deepFreeze({
    meta: {
      version: '2026.3',
      source: 'Kepmendiktisaintek No. 39/M/KEP/2026',
      sourceShort: 'Juknis 39/M/KEP/2026'
    },

    /* Dokumen acuan. Setiap aturan di luar juknis menyebut kode dokumennya. */
    docs: {
      juknis: 'Kepmendiktisaintek No. 39/M/KEP/2026 (Juknis Layanan Pengembangan Profesi dan Karier Dosen)',
      km500:  'Kepmendikbudristek No. 500/M/2024 (Standar Minimum Indikator Kinerja Dosen dan Kriteria Publikasi Ilmiah)',
      lldikti7: 'Paparan LLDIKTI Wilayah VII, 27 Okt 2026 (Pengajuan Usulan JAD Asisten Ahli dan Lektor)',
      dsd:    'Paparan Direktorat Sumber Daya Ditjen Dikti, Agustus 2026 (Sosialisasi Usulan JAD LK dan Profesor Gel. 2)'
    },

    /* Standar minimum IKD per jabatan tujuan. Sumber: Kepmen 500/M/2024, Lampiran C
       (pendidikan 1.1.x, penelitian 2.1.1, pengabdian 2.1.2) dan Lampiran D (Profesor).
       Pengusul memilih 1 komponen pendidikan dan 1 komponen penelitian atau pengabdian
       (paparan LLDIKTI VII). Komponen penelitian dihitung dari daftar karya. */
    ikd: {
      AA: {
        pendidikan: [
          'Melaksanakan pengajaran dalam satu tahun akademik, dan menerapkan minimal 1 metode pembelajaran kreatif berbasis SCL yang didampingi dosen berjabatan lebih tinggi (1.1.1.1).',
          'Membimbing seminar dan laporan akhir mahasiswa, dan/atau membantu menghasilkan skripsi (1.1.2.1).'
        ],
        penelitian: 'Minimal 2 publikasi di jurnal nasional tidak terakreditasi sebagai penulis pertama; atau penulis anggota dalam 1 naskah di jurnal nasional terakreditasi; dalam periode maksimal 3 tahun (2.1.1.1).',
        pengabdian: 'Anggota pelaksana pengabdian berbasis hasil karya dosen, minimal 1 kegiatan dalam 2 tahun, dimanfaatkan masyarakat terbatas/provinsi, industri, atau UMKM (2.1.2.1).'
      },
      L: {
        pendidikan: [
          'Melaksanakan pengajaran dalam satu tahun akademik, dan menerapkan minimal 2 metode pembelajaran kreatif berbasis SCL (mis. PBL, project based, case study) dalam satu tahun akademik (1.1.1.2).',
          'Membimbing mahasiswa menghasilkan skripsi, dan menguji skripsi dan/atau tesis bila sudah doktor (1.1.2.2).'
        ],
        penelitian: 'Minimal 1 naskah di jurnal nasional terakreditasi sebagai penulis pertama; atau penulis anggota dalam 2 naskah di jurnal internasional; dalam periode maksimal 3 tahun (2.1.1.2).',
        pengabdian: 'Pengabdian berbasis hasil penelitian: anggota minimal 2 kegiatan, atau ketua minimal 1 kegiatan, dalam 2 tahun, dimanfaatkan masyarakat terbatas/provinsi, industri, atau UMKM (2.1.2.2).'
      },
      LK: {
        pendidikan: [
          'Melaksanakan pengajaran dalam satu tahun akademik, dan mengembangkan minimal 1 bahan ajar yang memiliki kebaruan metode atau substansi (tertulis di RPS) dalam maksimal 3 tahun (1.1.1.3).',
          'Membimbing skripsi atau tesis dan menguji skripsi, tesis, atau profesi; atau menjadi pembimbing pendamping disertasi bersama Profesor (1.1.2.3).',
          'Membimbing minimal 2 dosen Asisten Ahli dan/atau Lektor dalam satu tahun akademik (1.1.3.3).'
        ],
        penelitian: 'Minimal 2 publikasi di jurnal internasional sebagai penulis utama; atau penulis anggota dalam 2 jurnal internasional bereputasi; dalam periode maksimal 3 tahun (2.1.1.3).',
        pengabdian: 'Pengabdian berbasis hasil penelitian: ketua pelaksana minimal 1 kegiatan dalam 2 tahun, atau anggota minimal 2 kegiatan yang dipimpin Profesor dalam 2 tahun, berdampak bagi masyarakat nasional, industri, atau BUMN (2.1.2.3).'
      },
      P: {
        pendidikan: [
          'Melaksanakan pengajaran dengan metode yang dikembangkan di jenjang diploma/sarjana dan pascasarjana, serta merencanakan dan mengembangkan minimal 1 bahan ajar baru dalam maksimal 3 tahun (1.1.1.4).',
          'Membimbing mahasiswa sampai jenjang doktor dan menguji skripsi, tesis, dan/atau disertasi (1.1.2.4).',
          'Membimbing minimal 3 dosen Asisten Ahli, Lektor, dan/atau Lektor Kepala dalam satu tahun akademik (1.1.3.4).'
        ],
        penelitian: 'Publikasi di jurnal internasional bereputasi (SJR ≥ 0,15 atau JIF ≥ 0,05) sebagai penulis pertama dan corresponding author dalam maksimal 3 tahun, dan menulis buku dari pemikiran atau penelitian dalam maksimal 6 tahun (2.1.1.4, Lampiran D).',
        pengabdian: 'Pengabdian berbasis hasil penelitian sebagai ketua minimal 1 kegiatan dalam 2 tahun, berdampak bagi masyarakat nasional/internasional atau industri multinasional (2.1.2.4).'
      }
    },

    /* Tabel 27 (AK maksimum per tahun) dan Tabel 28 (koefisien AK Konversi). */
    ranks: {
      NJ: { code: 'NJ', name: 'Belum punya jabatan akademik', levels: [0], koef: 0, maxPrestasi100: 0, maxPrestasi150: 0, maxTotal: 0 },
      AA: { code: 'AA', name: 'Asisten Ahli', levels: [150], koef: 12.5, maxPrestasi100: 27.5, maxPrestasi150: 21.25, maxTotal: 40 },
      L:  { code: 'L',  name: 'Lektor', levels: [200, 300], koef: 25, maxPrestasi100: 55, maxPrestasi150: 42.5, maxTotal: 80 },
      LK: { code: 'LK', name: 'Lektor Kepala', levels: [400, 550, 700], koef: 37.5, maxPrestasi100: 82.5, maxPrestasi150: 63.75, maxTotal: 120 },
      P:  { code: 'P',  name: 'Profesor', levels: [850, 1050], koef: 50, maxPrestasi100: 110, maxPrestasi150: 85, maxTotal: 160 }
    },

    /* Bab D.1, D.2 (proporsi penelitian) dan D.6 (kenaikan dua jenjang). */
    paths: {
      /* Pengangkatan pertama (Juknis Bab B.2; Paparan LLDIKTI VII). AK ditetapkan sesuai jenjang. */
      NJ: [
        { to: 'AA', kind: 'pertama', levels: [150], researchPct: 0, minYearsInRank: 0 },
        { to: 'L',  kind: 'pertama', levels: [200], researchPct: 0, minYearsInRank: 0 }
      ],
      AA: [
        { to: 'L',  kind: 'reguler', levels: [200, 300], researchPct: 0.35, minYearsInRank: 2 },
        { to: 'LK', kind: 'loncat',  levels: [400, 550, 700], researchPct: 0.40, minYearsInRank: 2 }
      ],
      L: [
        { to: 'LK', kind: 'reguler', levels: [400, 550, 700], researchPct: 0.40, minYearsInRank: 2 },
        { to: 'P',  kind: 'loncat',  levels: [850, 1050], researchPct: 0.45, minYearsInRank: 2 }
      ],
      LK: [
        { to: 'P',  kind: 'reguler', levels: [850, 1050], researchPct: 0.45, minYearsInRank: 2 }
      ],
      P: []
    },

    /* Format PAK Konversi: persentase predikat kinerja. */
    predikat: {
      SB: { label: 'Sangat Baik', pct: 1.5 },
      B:  { label: 'Baik', pct: 1.0 },
      C:  { label: 'Cukup / Butuh Perbaikan', pct: 0.75 },
      K:  { label: 'Kurang', pct: 0.5 },
      SK: { label: 'Sangat Kurang', pct: 0.25 }
    },

    /* Bab D.1.d: pangkat minimum Dosen PNS untuk kenaikan satu jenjang. */
    golongan: ['III/a', 'III/b', 'III/c', 'III/d', 'IV/a', 'IV/b', 'IV/c', 'IV/d', 'IV/e'],
    golonganMin: { AA: 'III/b', L: 'III/d', LK: 'IV/a' },

    /* Tabel 2: AK maksimal per luaran penelitian. limitPerYear = batas pengakuan. */
    catalog: [
      { id: 'jint',     group: 'Jurnal',  label: 'Jurnal internasional bereputasi (SJR > 0,1 atau IF > 0,05)', akBy: 'quartile', akByQuartile: { Q1: 40, Q2: 38, Q3: 35, Q4: 33 }, cat: 'PUB', sk: 'JINT' },
      { id: 'jintlow',  group: 'Jurnal',  label: 'Jurnal internasional terindeks, SJR ≤ 0,1 atau IF ≤ 0,05', ak: 30, cat: 'PUB' },
      { id: 'jnas',     group: 'Jurnal',  label: 'Jurnal nasional terakreditasi (Sinta)', akBy: 'rank', akByRank: { 1: 25, 2: 25, 3: 20, 4: 20, 5: 15, 6: 15 }, cat: 'PUB', sk: 'JNAS' },
      { id: 'jissn',    group: 'Jurnal',  label: 'Jurnal nasional ber-ISSN, tidak terakreditasi', ak: 10, cat: 'ISSN' },

      { id: 'buku_ref', group: 'Buku',    label: 'Buku referensi', ak: 40, cat: 'PUB', limitPerYear: 1 },
      { id: 'monograf', group: 'Buku',    label: 'Monograf', ak: 40, cat: 'PUB', limitPerYear: 1 },
      { id: 'bc_int',   group: 'Buku',    label: 'Book chapter internasional', ak: 15, cat: 'PUB', limitPerYear: 1 },
      { id: 'bc_nas',   group: 'Buku',    label: 'Book chapter nasional', ak: 10, cat: 'PUB', limitPerYear: 1 },
      { id: 'terjemah', group: 'Buku',    label: 'Menerjemahkan / menyadur buku ilmiah (ISBN)', ak: 15, cat: 'PUB' },
      { id: 'sunting',  group: 'Buku',    label: 'Menyunting buku ilmiah (ISBN)', ak: 10, cat: 'PUB' },

      { id: 'pros_int_idx', group: 'Diseminasi', label: 'Prosiding internasional terindeks (Scopus/WoS)', ak: 20, cat: 'DIS' },
      { id: 'pros_int',     group: 'Diseminasi', label: 'Prosiding internasional tidak terindeks', ak: 10, cat: 'DIS' },
      { id: 'pros_nas',     group: 'Diseminasi', label: 'Prosiding nasional (ISSN/ISBN)', ak: 7.5, cat: 'DIS' },
      { id: 'sem_int',      group: 'Diseminasi', label: 'Pemakalah seminar internasional, tanpa prosiding', ak: 5, cat: 'DIS' },
      { id: 'sem_nas',      group: 'Diseminasi', label: 'Pemakalah seminar nasional, tanpa prosiding', ak: 3, cat: 'DIS' },

      { id: 'populer',  group: 'Lainnya', label: 'Tulisan di koran atau majalah populer', ak: 2, cat: 'POP' },
      { id: 'laporan',  group: 'Lainnya', label: 'Laporan penelitian tidak dipublikasikan (repositori)', ak: 2, cat: 'POP' },

      { id: 'paten_int_ind', group: 'HKI', label: 'Paten internasional, diterapkan di industri', ak: 60, cat: 'PUB' },
      { id: 'paten_int',     group: 'HKI', label: 'Paten internasional (≥ 4 negara)', ak: 50, cat: 'PUB' },
      { id: 'paten_nas_ind', group: 'HKI', label: 'Paten nasional, diterapkan di industri', ak: 40, cat: 'PUB' },
      { id: 'paten_nas',     group: 'HKI', label: 'Paten nasional', ak: 30, cat: 'PUB' },
      { id: 'paten_sdh',     group: 'HKI', label: 'Paten sederhana', ak: 20, cat: 'PUB' },
      { id: 'hki_cipta',     group: 'HKI', label: 'Hak cipta, desain industri, indikasi geografis', ak: 15, cat: 'PUB', limitPerYear: 2 },

      { id: 'inovasi',  group: 'Inovasi & kebijakan', label: 'Karya inovatif tidak dipatenkan, berdampak nasional', ak: 40, cat: 'PUB' },
      { id: 'kbj_int',  group: 'Inovasi & kebijakan', label: 'Policy brief / naskah akademik tingkat internasional', ak: 20, cat: 'PUB' },
      { id: 'kbj_nas',  group: 'Inovasi & kebijakan', label: 'Policy brief / naskah akademik tingkat nasional', ak: 15, cat: 'PUB' },
      { id: 'kbj_lok',  group: 'Inovasi & kebijakan', label: 'Policy brief / naskah akademik tingkat lokal', ak: 10, cat: 'PUB' },
      { id: 'rcg_int',  group: 'Inovasi & kebijakan', label: 'Rancangan teknologi/seni dipresentasikan di forum internasional', ak: 20, cat: 'PUB' },
      { id: 'rcg_nas',  group: 'Inovasi & kebijakan', label: 'Rancangan teknologi/seni dipresentasikan di forum nasional', ak: 15, cat: 'PUB' },
      { id: 'rcg_lok',  group: 'Inovasi & kebijakan', label: 'Rancangan teknologi/seni dipresentasikan di forum lokal', ak: 10, cat: 'PUB' }
    ],

    /* Tabel 2, kolom batas pengakuan: porsi dari AK penelitian yang diperlukan. */
    kepatutan: {
      DIS:  { share: 0.25, appliesTo: ['LK', 'P'], label: 'Prosiding dan seminar' },
      ISSN: { share: 0.10, appliesTo: ['LK', 'P'], label: 'Jurnal nasional tidak terakreditasi' },
      POP:  { share: 0.05, appliesTo: ['L', 'LK', 'P'], label: 'Karya populer dan laporan tidak dipublikasikan' }
    },

    /* Keterangan *1 Tabel 2: pembagian AK antarpenulis. */
    roles: {
      tunggal: 'Penulis tunggal',
      p1kor:   'Penulis pertama sekaligus korespondensi',
      p1:      'Penulis pertama (bukan korespondensi)',
      kor:     'Penulis korespondensi (bukan penulis pertama)',
      anggota: 'Penulis anggota'
    },

    /* Bab D.5: kriteria syarat khusus per jalur. Ambang SJR/IF dari Tabel 4, 5, 6, 14, 15. */
    syaratKhusus: {
      'NJ>AA': 'Tidak ada syarat khusus publikasi untuk pengangkatan pertama Asisten Ahli (Paparan LLDIKTI VII, Oktober 2026).',
      'NJ>L':  'Satu artikel jurnal nasional terakreditasi minimal peringkat 4, atau jurnal internasional bereputasi minimal Q4 (SJR > 0,1 atau IF > 0,05), sebagai penulis pertama.',
      'AA>L':  'Satu artikel jurnal nasional terakreditasi minimal peringkat 4, atau jurnal internasional bereputasi minimal Q4, sebagai penulis pertama.',
      'L>LK':  'Satu artikel jurnal internasional bereputasi minimal Q3 (SJR > 0,2 atau IF > 0,05), atau jurnal nasional terakreditasi minimal peringkat 2, sebagai penulis pertama sekaligus korespondensi.',
      'LK>P':  'Dua artikel: (1) jurnal internasional bereputasi minimal Q2 (SJR > 0,25 atau IF > 0,05) sebagai penulis pertama sekaligus korespondensi; dan (2) jurnal internasional bereputasi minimal Q3 (SJR > 0,2) atau jurnal nasional peringkat 1, sebagai penulis pertama atau korespondensi.',
      'AA>LK': 'Empat artikel jurnal internasional bereputasi minimal Q2 (SJR > 0,25 atau IF > 0,05): dua sebagai penulis pertama sekaligus korespondensi dan dua sebagai penulis pertama.',
      'L>P':   'Empat artikel jurnal internasional bereputasi: dua Q1 (SJR > 0,25) sebagai penulis pertama sekaligus korespondensi, salah satunya ber-IF tinggi; dan dua minimal Q2 (SJR > 0,25) sebagai penulis pertama.'
    },

    /* AK pendidikan formal (ijazah) mengikuti jabatan saat ijazah diperoleh, maksimal 25% dari
       kebutuhan naik pangkat satu tingkat. Juknis 39/M/KEP/2026 tidak menyebut angkanya;
       sumber: paparan LLDIKTI Wilayah VII, 27 Okt 2026 (slide 20). */
    akPendidikan: { AA: 12.5, L: 25, LK: 37.5, P: 50 },
    akPendidikanSrc: 'paparan LLDIKTI Wilayah VII, 27 Okt 2026',

    /* Juknis menyebut dua ambang IF untuk jalur Lektor ke Profesor: IF ≥ 5 (D.6.f.7) dan IF ≥ 7 (Tabel 15).
       Simulasi memakai 7, sejalan dengan paparan Direktorat Sumber Daya (Agustus 2026). */
    loncatLPIfMin: 7,

    /* Tabel 6: syarat khusus tambahan Profesor (cukup salah satu). */
    syaratTambahanProfesor: [
      { id: 'hibah',    label: 'Ketua hibah penelitian/pengabdian kompetitif dari luar perguruan tinggi sendiri' },
      { id: 'promotor', label: 'Promotor 1 mahasiswa doktor luar negeri, 2 mahasiswa doktor, atau co-promotor 3 mahasiswa doktor' },
      { id: 'penguji',  label: 'Penguji 3 mahasiswa doktor, salah satunya di luar institusi' },
      { id: 'reviewer', label: 'Reviewer 2 jurnal internasional bereputasi minimal Q3 di luar institusi' },
      { id: 'pic',      label: 'PIC kerja sama penelitian dengan profesor perguruan tinggi luar negeri' }
    ]
  });
});

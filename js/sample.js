/* Data contoh fiktif yang dimuat saat pertama kali dibuka. Bukan data dosen sungguhan. */
(function (root) {
  'use strict';
  root.AKSample = function () {
    return {
      version: 1,
      profile: {
        status: 'PTS', golongan: 'III/c', rank: 'L', akSK: 230, tmt: '2025-03-01',
        target: 'LK', kind: 'reguler', targetAK: 400,
        doktor: 'rencana', doktorTahun: 2028, akIjazahMode: 'otomatis', akIjazahManual: 25,
        tetapSejak: '2014-08-01', serdos: true, prestasiLuarBiasa: false, syaratTambahan: [], bkdSamaPT: true, bkdSejak: '', ikdPend: true, ikdAbdi: false, horizon: 4
      },
      skp: { 2025: 'B', 2026: 'B', 2027: 'SB', 2028: 'B' },
      works: [
        { uid: 's1', type: 'jnas', rank: 2, title: 'Artikel riset prodi, Sinta 2 (contoh)', year: 2025, status: 'terbit', role: 'p1kor', authors: 3 },
        { uid: 's2', type: 'pros_int_idx', title: 'Makalah konferensi internasional (contoh)', year: 2026, status: 'rencana', role: 'p1kor', authors: 3, fromThesis: true },
        { uid: 's3', type: 'hki_cipta', title: 'Hak cipta perangkat lunak (contoh)', year: 2026, status: 'rencana', role: 'tunggal', authors: 1 },
        { uid: 's4', type: 'jint', quartile: 'Q3', sjr: 0.35, title: 'Artikel bab disertasi (contoh)', year: 2027, status: 'rencana', role: 'p1kor', authors: 3, fromThesis: true },
        { uid: 's5', type: 'jnas', rank: 3, title: 'Artikel hibah penelitian (contoh)', year: 2027, status: 'rencana', role: 'anggota', authors: 4, firstIsCorr: true },
        { uid: 's6', type: 'bc_nas', title: 'Book chapter (contoh)', year: 2028, status: 'rencana', role: 'p1', authors: 3 }
      ]
    };
  };
})(typeof self !== 'undefined' ? self : this);

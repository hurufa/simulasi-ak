/* Jalankan: node tests/engine.test.js
 * Uji mesin terhadap contoh perhitungan yang tercantum di juknis (Bab H, Tabel 27)
 * dan terhadap aturan plafon, kepatutan, serta syarat khusus. */
'use strict';
const assert = require('assert');
const E = require('../js/engine.js');

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { console.error('  GAGAL  ' + name + '\n        ' + e.message); process.exitCode = 1; }
}
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 0.01, (msg || '') + ' ' + a + ' ≠ ' + b);
const share = (role, n, f) => E.authorShare(role, n, f).pct;

console.log('Pembagian AK penulis (Keterangan *1 Tabel 2)');
test('tunggal 100%', () => near(share('tunggal', 1), 1));
test('2 penulis: P1+kor 60%, anggota 40%', () => { near(share('p1kor', 2), .6); near(share('anggota', 2), .4); });
test('2 penulis: P1 50%, korespondensi 50%', () => { near(share('p1', 2), .5); near(share('kor', 2), .5); });
test('5 penulis, P1 juga kor: anggota 10%', () => near(share('anggota', 5, true), .1));
test('5 penulis, P1 bukan kor: P1 40%, kor 40%, anggota 20%/3', () => {
  near(share('p1', 5), .4); near(share('kor', 5), .4); near(share('anggota', 5, false), .2 / 3);
});

console.log('Contoh juknis: AK Prestasi Asisten Ahli = 27,5');
test('15 + 4,5 + 4 + 4', () => {
  const total = 25 * share('p1kor', 2) + 7.5 * share('p1kor', 2) + 40 * share('anggota', 5, true) + 10 * share('anggota', 2);
  near(total, 27.5);
});
console.log('Contoh juknis: AK Prestasi Lektor = 41,8');
test('22,5 + 6 + 5,3 + 8', () => {
  const total = 37.5 * .6 + 10 * .6 + 40 * share('anggota', 4, true) + 20 * share('anggota', 2);
  near(total, 41.83);
});
console.log('Contoh juknis: Lektor Kepala (rincian 7 karya)');
test('22,5 + 15 + 12 + 24 + 5 + 2,8 + 1,2', () => {
  const t = 37.5 * .6 + 37.5 * share('p1', 3) + 20 * .6 + 40 * .6 + 37.5 * share('anggota', 4, true) + 35 * share('anggota', 6, true) + 2 * .6;
  near(t, 82.5);
});

function plan(over) {
  const p = E.emptyPlan();
  Object.assign(p.profile, {
    status: 'PTS', rank: 'L', akSK: 200, tmt: '2025-12-01', target: 'LK', kind: 'reguler', targetAK: 400,
    doktor: 'tidak', horizon: 8
  }, over && over.profile);
  p.skp = (over && over.skp) || {};
  p.works = (over && over.works) || [];
  return p;
}
const w = (o) => Object.assign({ type: 'jnas', rank: 2, role: 'p1kor', authors: 2, year: 2026, status: 'rencana', title: 't' }, o);

console.log('Plafon Tabel 27');
test('Lektor, SKP Baik: konversi 25 + plafon prestasi 55', () => {
  const r = E.project(plan());
  const y = r.years.find(x => x.year === 2026);
  near(y.konversi, 25); near(y.capPrestasi, 55); near(y.capTotal, 80);
});
test('Lektor, SKP Sangat Baik: konversi 37,5 + plafon prestasi 42,5', () => {
  const r = E.project(plan({ skp: { 2026: 'SB' } }));
  const y = r.years.find(x => x.year === 2026);
  near(y.konversi, 37.5); near(y.capPrestasi, 42.5);
});
test('TMT 1 Desember: tahun pertama dihitung 1 bulan', () => {
  const r = E.project(plan());
  near(r.years[0].konversi, 25 / 12);
});
test('AK penelitian di atas plafon tidak diakui', () => {
  const works = [w({ type: 'buku_ref', role: 'tunggal', authors: 1 }), w({ type: 'paten_nas_ind', role: 'tunggal', authors: 1 })];
  const r = E.project(plan({ works }));
  const y = r.years.find(x => x.year === 2026);
  near(y.prestasiAllowed, 80); near(y.prestasiCounted, 55); near(y.lostPlafon, 25);
});
test('buku referensi lebih dari 1 per tahun ditolak', () => {
  const works = [w({ type: 'buku_ref', role: 'tunggal', authors: 1 }), w({ type: 'buku_ref', role: 'tunggal', authors: 1, title: 'kedua' })];
  const r = E.project(plan({ works }));
  near(r.years.find(x => x.year === 2026).prestasiAllowed, 40);
});

console.log('Kebutuhan dan kepatutan');
test('Lektor 200 → LK 400: kekurangan 200, penelitian minimal 80', () => {
  const r = E.project(plan()); near(r.need, 200); near(r.needResearch, 80);
});
test('prosiding dibatasi 25% dari 80 = 20 AK', () => {
  const works = [2026, 2026, 2027].map((y, i) => w({ type: 'pros_int_idx', role: 'tunggal', authors: 1, year: y, title: 'p' + i }));
  const r = E.project(plan({ works }));
  const total = r.years.reduce((s, y) => s + y.prestasiAllowed, 0);
  near(total, 20);
});

console.log('Jadwal');
test('tanpa S3, plafon penuh: AK 400 baru tercapai akhir 2028', () => {
  const r = E.project(plan(), { y: 2026 });
  assert.strictEqual(r.fastestYear, 2028);
});
test('S3 lulus 2027, AK ijazah otomatis Lektor = 25: plafon penuh baru cukup akhir 2028', () => {
  const r = E.project(plan({ profile: { doktor: 'rencana', doktorTahun: 2027 } }));
  near(r.eduAK, 25);
  assert.strictEqual(r.fastestYear, 2028);
});
test('S3 lulus 2027, AK ijazah manual 50: plafon penuh cukup akhir 2027', () => {
  const m = E.project(plan({ profile: { doktor: 'rencana', doktorTahun: 2027, akIjazahMode: 'manual', akIjazahManual: 50 } }));
  near(m.eduAK, 50);
  assert.strictEqual(m.fastestYear, 2027);
});
test('literature review tidak bisa dipakai syarat khusus', () => {
  const w = { type: 'jint', quartile: 'Q2', sjr: 0.5, role: 'p1kor', authors: 3, nonResearch: true };
  assert.ok(E.skExclusions(w).length === 1);
  assert.strictEqual(E.evaluateSK([w], 'L>LK').met, false);
});
test('IKD penelitian LK: 2 artikel internasional sebagai penulis utama dalam 3 tahun', () => {
  const w = function (y, role) { return { type: 'jint', quartile: 'Q3', sjr: 0.3, role: role, authors: 3, year: y }; };
  assert.strictEqual(E.ikdResearch([w(2025, 'p1kor'), w(2027, 'p1')], 'LK', 2027).met, true);
  assert.strictEqual(E.ikdResearch([w(2023, 'p1kor'), w(2027, 'p1')], 'LK', 2027).met, false);
  assert.strictEqual(E.ikdResearch([w(2026, 'anggota'), w(2027, 'kor')], 'LK', 2027).met, true);
});
test('IKD lama (ikd: true) dimigrasi ke dua komponen', () => {
  const p = E.sanitizePlan({ profile: { ikd: true } }).profile;
  assert.strictEqual(p.ikdPend, true); assert.strictEqual(p.ikdAbdi, true);
});
test('pengangkatan pertama AA: siap 12 bulan setelah mulai dosen tetap; rekomendasi tidak memblokir', () => {
  const r = E.project({ profile: { rank: 'NJ', target: 'AA', kind: 'pertama', tetapSejak: '2025-08-01' }, skp: {}, works: [] }, { y: 2026 });
  assert.strictEqual(r.mode, 'pertama');
  assert.deepStrictEqual(r.readyDate, { y: 2026, m: 8 });
  assert.strictEqual(r.checks.find(function (c) { return c.id === 'rek'; }).state, 'rec');
  near(r.akMasa, 12.5);
});
test('pengangkatan pertama Lektor: menunggu S3 dan artikel syarat khusus', () => {
  const art = { type: 'jnas', rank: 3, role: 'p1kor', authors: 3, year: 2027 };
  const r = E.project({ profile: { rank: 'NJ', target: 'L', kind: 'pertama', tetapSejak: '2025-08-01', doktor: 'rencana', doktorTahun: 2026 }, skp: {}, works: [art] }, { y: 2026 });
  assert.deepStrictEqual(r.readyDate, { y: 2027, m: 12 });
});
test('saran rencana: Lektor 200 tanpa karya menuju LK menjadi siap, dengan artikel syarat khusus', () => {
  const s = E.suggestPlan(plan(), { y: 2026 });
  assert.ok(s.baseline.readyDate === null);
  assert.ok(s.result.readyDate, 'harus siap setelah saran');
  assert.ok(s.items.some(function (i) { return i.why === 'sk'; }));
});
test('saran rencana tidak mengatasi syarat non-karya (S3 untuk Profesor)', () => {
  const s = E.suggestPlan(plan({ profile: { rank: 'LK', akSK: 400, target: 'P', kind: 'reguler', targetAK: 850, doktor: 'tidak' } }), { y: 2026 });
  assert.ok(s.unfixable.some(function (u) { return /doktor/i.test(u); }));
});
test('proyeksi konservatif mengabaikan karya rencana', () => {
  const w = { type: 'jint', quartile: 'Q3', sjr: 0.3, role: 'p1kor', authors: 3, year: 2026, status: 'rencana' };
  const a = E.project(plan({ works: [w] })), b = E.project(plan({ profile: { konservatif: true }, works: [w] }));
  assert.ok(a.years.some(function (y) { return y.prestasiCounted > 0; }));
  assert.ok(b.years.every(function (y) { return y.prestasiCounted === 0; }));
});
test('IKD belum dikonfirmasi tidak memblokir, tapi ditandai perlu dicek', () => {
  const r = E.project(plan());
  const c = r.checks.find(function (x) { return x.id === 'ikd'; });
  assert.strictEqual(c.state, 'check');
});
test('masa jabatan 2 tahun: paling cepat Desember 2027', () => {
  const r = E.project(plan());
  assert.deepStrictEqual(r.earliestByTime, { y: 2027, m: 12 });
});

console.log('Syarat khusus (Bab D.5)');
test('L→LK: Sinta 2 penulis 1 + korespondensi memenuhi', () => {
  assert.ok(E.evaluateSK([w({})], 'L>LK').met);
});
test('L→LK: Sinta 3 tidak memenuhi', () => {
  assert.ok(!E.evaluateSK([w({ rank: 3 })], 'L>LK').met);
});
test('L→LK: artikel dari disertasi tidak memenuhi', () => {
  assert.ok(!E.evaluateSK([w({ fromThesis: true })], 'L>LK').met);
});
test('L→LK: jurnal PT sendiri tidak memenuhi', () => {
  assert.ok(!E.evaluateSK([w({ ownJournal: true })], 'L>LK').met);
});
test('L→LK: penulis tunggal tidak memenuhi', () => {
  assert.ok(!E.evaluateSK([w({ role: 'tunggal', authors: 1 })], 'L>LK').met);
});
test('L→LK: Q3 dengan SJR 0,15 tidak memenuhi (perlu > 0,2)', () => {
  assert.ok(!E.evaluateSK([w({ type: 'jint', quartile: 'Q3', sjr: 0.15 })], 'L>LK').met);
});
test('LK→P: butuh dua artikel berbeda', () => {
  const a = w({ type: 'jint', quartile: 'Q2', sjr: 0.4 });
  assert.ok(!E.evaluateSK([a], 'LK>P').met);
  assert.ok(E.evaluateSK([a, w({ type: 'jint', quartile: 'Q3', sjr: 0.3, role: 'kor', title: 'b' })], 'LK>P').met);
});

test('proyeksi berjalan sampai N tahun setelah tahun acuan', () => {
  const r = E.project(plan({ profile: { tmt: '2019-03-01', horizon: 2 } }), { y: 2026 });
  assert.strictEqual(r.years[0].year, 2019);
  assert.strictEqual(r.years[r.years.length - 1].year, 2028);
});

test('BKD: pindah PT Juli 2026 → 4 semester baru Juli 2028, siap mundur', () => {
  const p = plan({ profile: { doktor: 'rencana', doktorTahun: 2027, akIjazahMode: 'manual', akIjazahManual: 50 } });
  const base = E.project(p, { y: 2026 });
  p.profile.bkdSamaPT = false; p.profile.bkdSejak = '2026-07-01';
  const moved = E.project(p, { y: 2026 });
  const c = moved.checks.find(x => x.id === 'bkd');
  assert.ok(c);
  if (moved.readyDate) assert.ok(moved.readyDate.y * 12 + moved.readyDate.m >= 2028 * 12 + 7);
  assert.ok(base.checks.find(x => x.id === 'bkd').state === 'ok');
});
test('BKD: pindah PT tanpa tanggal → belum terpenuhi', () => {
  const p = plan(); p.profile.bkdSamaPT = false;
  assert.strictEqual(E.project(p, { y: 2026 }).checks.find(x => x.id === 'bkd').state, 'no');
});

console.log('Sanitasi data impor');
test('nilai asing dibuang, tipe dipaksa', () => {
  const p = E.sanitizePlan({ profile: { rank: '<script>', akSK: 'abc' }, works: [{ type: 'x', title: '<img onerror=1>', authors: -5 }] });
  assert.strictEqual(p.profile.rank, 'AA');
  assert.strictEqual(p.works[0].type, 'jnas');
  assert.strictEqual(p.works[0].authors, 1);
});

console.log('\n' + passed + ' uji lulus' + (process.exitCode ? ', ada yang GAGAL' : ''));

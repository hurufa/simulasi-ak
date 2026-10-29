/*
 * Simulasi AK Dosen — mesin perhitungan
 * Fungsi murni: menerima rencana (objek biasa), mengembalikan hasil. Tidak menyentuh DOM,
 * sehingga bisa diuji di Node (lihat tests/engine.test.js) dan dipakai ulang di backend kelak.
 */
(function (root, factory) {
  const isNode = typeof module === 'object' && module.exports;
  const rules = isNode ? require('./rules.js') : root.AKRules;
  const engine = factory(rules);
  if (isNode) module.exports = engine;
  else root.AKEngine = engine;
})(typeof self !== 'undefined' ? self : this, function (R) {
  'use strict';

  const HORIZON_MAX = 12;
  const catalogById = {};
  R.catalog.forEach(function (c) { catalogById[c.id] = c; });

  /* ---------- utilitas ---------- */

  function round2(x) { return Math.round((x + Number.EPSILON) * 100) / 100; }
  function idn(x) { return String(round2(x)).replace('.', ','); }
  function num(v, fallback) {
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : (fallback === undefined ? 0 : fallback);
  }
  function int(v, fallback) { return Math.trunc(num(v, fallback)); }
  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }

  /* Tanggal disimpan sebagai 'YYYY-MM-DD'; dibaca manual agar bebas zona waktu. */
  function parseDate(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
    if (!m) return null;
    const y = +m[1], mo = +m[2], d = +m[3];
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    return { y: y, m: mo, d: d };
  }
  function monthIndex(dt) { return dt.y * 12 + (dt.m - 1); }
  function fromMonthIndex(i) { return { y: Math.floor(i / 12), m: (i % 12) + 1 }; }
  function addMonths(dt, n) { return fromMonthIndex(monthIndex(dt) + n); }
  function maxMonth(a, b) { return monthIndex(a) >= monthIndex(b) ? a : b; }

  /* ---------- kepengarangan (Keterangan *1 Tabel 2) ---------- */

  function authorShare(role, authors, firstIsCorr) {
    let n = Math.max(1, int(authors, 1));
    if (role === 'tunggal') n = 1;
    if (n === 1) return { pct: 1, label: '100% (penulis tunggal)' };
    if (n === 2) {
      if (role === 'p1kor') return { pct: 0.6, label: '60% dari 2 penulis' };
      if (role === 'p1')    return { pct: 0.5, label: '50% (penulis 1, korespondensi penulis 2)' };
      if (role === 'kor')   return { pct: 0.5, label: '50% (penulis 2 sekaligus korespondensi)' };
      return { pct: 0.4, label: '40% (penulis 2)' };
    }
    if (role === 'p1kor') return { pct: 0.6, label: '60% dari ' + n + ' penulis' };
    if (role === 'p1')    return { pct: 0.4, label: '40% (penulis 1, bukan korespondensi)' };
    if (role === 'kor')   return { pct: 0.4, label: '40% (korespondensi, bukan penulis 1)' };
    if (firstIsCorr !== false) {
      const p = 0.4 / (n - 1);
      return { pct: p, label: idn(p * 100) + '% (40% dibagi ' + (n - 1) + ' anggota)' };
    }
    const p = n > 2 ? 0.2 / (n - 2) : 0;
    return { pct: p, label: idn(p * 100) + '% (20% dibagi ' + (n - 2) + ' anggota)' };
  }

  function workMaxAK(work) {
    const c = catalogById[work.type];
    if (!c) return 0;
    if (c.akBy === 'quartile') return c.akByQuartile[work.quartile] || c.akByQuartile.Q4;
    if (c.akBy === 'rank') return c.akByRank[int(work.rank, 6)] || c.akByRank[6];
    return c.ak;
  }

  function workAK(work) {
    const share = authorShare(work.role, work.authors, work.firstIsCorr);
    const max = workMaxAK(work);
    return { max: max, pct: share.pct, shareLabel: share.label, ak: round2(max * share.pct) };
  }

  /* ---------- syarat khusus (Bab D.5, Tabel 4–6, 14, 15) ---------- */

  function skExclusions(work) {
    const out = [];
    if (work.role === 'tunggal' || int(work.authors, 1) < 2) out.push('penulis tunggal');
    if (work.fromThesis) out.push('berasal dari tesis/disertasi sendiri atau bimbingan');
    if (work.ownJournal) out.push('terbit di jurnal perguruan tinggi asal');
    if (work.specialIssue) out.push('edisi khusus hasil seminar');
    if (work.preTMT) out.push('terbit sebelum TMT jabatan terakhir');
    if (work.nonResearch) out.push('literature review atau short communication');
    return out;
  }

  function qNum(q) { const m = /^Q([1-4])$/.exec(q || ''); return m ? +m[1] : 9; }
  function isP1(w) { return w.role === 'p1' || w.role === 'p1kor'; }
  function isKor(w) { return w.role === 'kor' || w.role === 'p1kor'; }
  function intOK(w, maxQ, sjrMin) {
    return w.type === 'jint' && qNum(w.quartile) <= maxQ && (num(w.sjr) > sjrMin || num(w.ifv) > 0.05);
  }
  /* IKD komponen penelitian (Kepmen 500/M/2024, 2.1.1) dari daftar karya, jendela 3 tahun s.d. tahun y. */
  function ikdResearch(works, target, y) {
    const lead = function (w) { return w.role === 'p1' || w.role === 'p1kor' || w.role === 'tunggal'; };
    const inWin = function (w, n) { return w.year <= y && w.year > y - n; };
    const intl = function (w) { return w.type === 'jint' || w.type === 'jintlow'; };
    const w3 = works.filter(function (w) { return inWin(w, 3); });
    if (target === 'AA') {
      /* Jurnal terakreditasi dianggap memenuhi butir jurnal tidak terakreditasi (standar lebih tinggi). */
      const a = w3.filter(function (w) { return (w.type === 'jissn' || w.type === 'jnas') && lead(w); }).length;
      const b = w3.filter(function (w) { return w.type === 'jnas' && !lead(w); }).length;
      return { met: a >= 2 || b >= 1, have: a + ' artikel jurnal nasional sebagai penulis pertama, ' + b + ' artikel jurnal nasional terakreditasi sebagai anggota (3 tahun terakhir)' };
    }
    if (target === 'L') {
      const a = w3.filter(function (w) { return w.type === 'jnas' && lead(w); }).length;
      const b = w3.filter(function (w) { return intl(w) && !lead(w); }).length;
      return { met: a >= 1 || b >= 2, have: a + ' artikel nasional terakreditasi sebagai penulis pertama, ' + b + ' artikel internasional sebagai anggota (3 tahun terakhir)' };
    }
    if (target === 'LK') {
      const a = w3.filter(function (w) { return intl(w) && lead(w); }).length;
      const b = w3.filter(function (w) { return w.type === 'jint' && !lead(w); }).length;
      return { met: a >= 2 || b >= 2, have: a + ' artikel internasional sebagai penulis utama, ' + b + ' artikel internasional bereputasi sebagai anggota (3 tahun terakhir)' };
    }
    if (target === 'P') {
      const a = w3.filter(function (w) { return w.type === 'jint' && w.role === 'p1kor' && (num(w.sjr) >= 0.15 || num(w.ifv) >= 0.05); }).length;
      const b = works.filter(function (w) { return (w.type === 'buku_ref' || w.type === 'monograf') && inWin(w, 6); }).length;
      return { met: a >= 1 && b >= 1, have: a + ' artikel bereputasi sebagai penulis pertama + korespondensi (3 tahun), ' + b + ' buku (6 tahun)' };
    }
    return { met: false, have: '-' };
  }

  function nasOK(w, maxRank) { return w.type === 'jnas' && int(w.rank, 9) <= maxRank; }

  function evaluateSK(works, key) {
    const ok = works.filter(function (w) { return skExclusions(w).length === 0; });
    switch (key) {
      case 'AA>L': {
        const hit = ok.filter(function (w) { return isP1(w) && (nasOK(w, 4) || intOK(w, 4, 0.1)); });
        return { met: hit.length >= 1, have: hit.length + ' dari 1 artikel', used: hit.slice(0, 1) };
      }
      case 'L>LK': {
        const hit = ok.filter(function (w) { return w.role === 'p1kor' && (intOK(w, 3, 0.2) || nasOK(w, 2)); });
        return { met: hit.length >= 1, have: hit.length + ' dari 1 artikel', used: hit.slice(0, 1) };
      }
      case 'LK>P': {
        const a = ok.filter(function (w) { return w.role === 'p1kor' && intOK(w, 2, 0.25); });
        const b = ok.filter(function (w) { return (isP1(w) || isKor(w)) && (intOK(w, 3, 0.2) || nasOK(w, 1)); });
        let pair = null;
        a.some(function (x) {
          const y = b.find(function (z) { return z !== x; });
          if (y) pair = [x, y];
          return !!y;
        });
        const have = (a.length ? 1 : 0) + (pair ? 1 : (b.length && !a.length ? 1 : 0));
        return { met: !!pair, have: Math.min(2, have) + ' dari 2 artikel', used: pair || [] };
      }
      case 'AA>LK': {
        const q2 = ok.filter(function (w) { return intOK(w, 2, 0.25) && isP1(w); });
        const kor = q2.filter(function (w) { return w.role === 'p1kor'; }).length;
        return { met: q2.length >= 4 && kor >= 2, have: Math.min(4, q2.length) + ' dari 4 artikel (' + kor + ' sebagai penulis 1 + korespondensi)', used: q2.slice(0, 4) };
      }
      case 'L>P': {
        const q1 = ok.filter(function (w) { return w.role === 'p1kor' && intOK(w, 1, 0.25); });
        const highIF = q1.some(function (w) { return num(w.ifv) >= R.loncatLPIfMin; });
        const rest = ok.filter(function (w) { return intOK(w, 2, 0.25) && isP1(w) && q1.slice(0, 2).indexOf(w) < 0; });
        const met = q1.length >= 2 && highIF && rest.length >= 2;
        return { met: met, have: Math.min(2, q1.length) + ' Q1 + ' + Math.min(2, rest.length) + ' Q2' + (highIF ? '' : ', belum ada IF ≥ ' + R.loncatLPIfMin), used: q1.slice(0, 2).concat(rest.slice(0, 2)) };
      }
      default:
        return { met: false, have: '-', used: [] };
    }
  }

  /* ---------- rencana: nilai bawaan & sanitasi ---------- */

  function emptyPlan() {
    const y = new Date().getFullYear();
    return {
      version: 1,
      profile: {
        status: 'PTS', golongan: 'III/c', rank: 'AA', akSK: 150,
        tmt: y + '-01-01', target: 'L', kind: 'reguler', targetAK: 200,
        doktor: 'tidak', doktorTahun: y + 3, akIjazahMode: 'otomatis', akIjazahManual: 25,
        tetapSejak: '', serdos: false, prestasiLuarBiasa: false, syaratTambahan: [],
        bkdSamaPT: true, bkdSejak: '', ikdPend: false, ikdAbdi: false, konservatif: false,
        horizon: 4
      },
      skp: {},
      works: []
    };
  }

  const ROLES = Object.keys(R.roles);
  const STATUS_KARYA = ['rencana', 'dikirim', 'diterima', 'terbit'];
  /* Proyeksi konservatif hanya menghitung karya yang sudah diterima atau terbit. */
  function countedWorks(plan) {
    return plan.profile.konservatif ? plan.works.filter(function (w) { return w.status === 'diterima' || w.status === 'terbit'; }) : plan.works;
  }
  const STATUSES = ['PNS', 'PTNBH', 'PTS'];
  const DOKTOR = ['tidak', 'rencana', 'punya_belum', 'punya_sudah'];

  function pick(v, allowed, fallback) { return allowed.indexOf(v) >= 0 ? v : fallback; }
  function str(v, max) { return String(v == null ? '' : v).slice(0, max || 200); }

  /* Semua data dari luar (localStorage, berkas impor) lewat fungsi ini. */
  function sanitizePlan(raw) {
    const base = emptyPlan();
    if (!raw || typeof raw !== 'object') return base;
    const p = raw.profile && typeof raw.profile === 'object' ? raw.profile : {};
    const rank = pick(p.rank, Object.keys(R.ranks).filter(function (k) { return k !== 'P'; }), base.profile.rank);
    const paths = R.paths[rank];
    let path = paths.find(function (x) { return x.to === p.target && x.kind === p.kind; }) || paths[0];
    const levels = R.ranks[rank].levels;
    const prof = {
      status: pick(p.status, STATUSES, 'PTS'),
      golongan: pick(p.golongan, R.golongan, 'III/c'),
      rank: rank,
      akSK: clamp(num(p.akSK, levels[0]), levels[0], 5000),
      tmt: parseDate(p.tmt) ? p.tmt : base.profile.tmt,
      target: path.to,
      kind: path.kind,
      targetAK: path.levels.indexOf(int(p.targetAK)) >= 0 ? int(p.targetAK) : path.levels[0],
      doktor: pick(p.doktor, DOKTOR, 'tidak'),
      doktorTahun: clamp(int(p.doktorTahun, base.profile.doktorTahun), 1970, 2100),
      akIjazahMode: pick(p.akIjazahMode, ['otomatis', 'manual'], 'otomatis'),
      akIjazahManual: clamp(num(p.akIjazahManual, 25), 0, 1000),
      konservatif: p.konservatif === true,
      ikdPend: p.ikdPend === true || (p.ikdPend === undefined && p.ikd === true),
      ikdAbdi: p.ikdAbdi === true || (p.ikdAbdi === undefined && p.ikd === true),
      tetapSejak: parseDate(p.tetapSejak) ? p.tetapSejak : '',
      bkdSamaPT: p.bkdSamaPT !== false,
      bkdSejak: parseDate(p.bkdSejak) ? p.bkdSejak : '',
      serdos: !!p.serdos,
      prestasiLuarBiasa: !!p.prestasiLuarBiasa,
      syaratTambahan: Array.isArray(p.syaratTambahan)
        ? p.syaratTambahan.filter(function (id) { return R.syaratTambahanProfesor.some(function (s) { return s.id === id; }); })
        : [],
      horizon: clamp(int(p.horizon, 4), 1, HORIZON_MAX)
    };
    const skp = {};
    if (raw.skp && typeof raw.skp === 'object') {
      Object.keys(raw.skp).forEach(function (k) {
        if (/^\d{4}$/.test(k) && R.predikat[raw.skp[k]]) skp[k] = raw.skp[k];
      });
    }
    const works = Array.isArray(raw.works) ? raw.works.slice(0, 300).map(function (w, i) {
      w = w && typeof w === 'object' ? w : {};
      return {
        uid: str(w.uid, 40) || ('w' + i + '-' + Math.random().toString(36).slice(2, 8)),
        type: catalogById[w.type] ? w.type : 'jnas',
        title: str(w.title, 200),
        year: clamp(int(w.year, new Date().getFullYear()), 1990, 2100),
        status: pick(w.status, STATUS_KARYA, 'rencana'),
        quartile: pick(w.quartile, ['Q1', 'Q2', 'Q3', 'Q4'], 'Q4'),
        rank: clamp(int(w.rank, 4), 1, 6),
        sjr: clamp(num(w.sjr, 0), 0, 100),
        ifv: clamp(num(w.ifv, 0), 0, 500),
        role: pick(w.role, ROLES, 'p1kor'),
        authors: clamp(int(w.authors, 3), 1, 100),
        firstIsCorr: w.firstIsCorr !== false,
        fromThesis: !!w.fromThesis,
        ownJournal: !!w.ownJournal,
        specialIssue: !!w.specialIssue,
        preTMT: !!w.preTMT,
        nonResearch: !!w.nonResearch
      };
    }) : [];
    return { version: 1, profile: prof, skp: skp, works: works };
  }

  /* ---------- proyeksi ---------- */

  function hasDoctorate(prof, year) {
    if (prof.doktor === 'punya_sudah' || prof.doktor === 'punya_belum') return true;
    return prof.doktor === 'rencana' && prof.doktorTahun <= year;
  }

  /* Menghitung AK yang diakui dalam satu tahun dari daftar karya tahun itu. */
  function recognizeYear(works, capPrestasi, allowance) {
    const detail = [];
    const counts = {};
    const sorted = works.map(function (w) { return { w: w, v: workAK(w) }; })
      .sort(function (a, b) { return b.v.ak - a.v.ak; });
    let sum = 0;
    sorted.forEach(function (it) {
      const c = catalogById[it.w.type];
      let ak = it.v.ak;
      const notes = [];
      if (c.limitPerYear) {
        counts[c.id] = (counts[c.id] || 0) + 1;
        if (counts[c.id] > c.limitPerYear) {
          notes.push('melewati batas ' + c.limitPerYear + ' karya per tahun');
          ak = 0;
        }
      }
      if (ak > 0 && allowance[c.cat] !== undefined) {
        const allowed = Math.min(ak, allowance[c.cat]);
        if (allowed < ak) notes.push('dipotong batas kepatutan ' + R.kepatutan[c.cat].label.toLowerCase());
        allowance[c.cat] = round2(allowance[c.cat] - allowed);
        ak = allowed;
      }
      sum += ak;
      detail.push({ uid: it.w.uid, raw: it.v.ak, allowed: round2(ak), notes: notes });
    });
    const counted = Math.min(capPrestasi, sum);
    return { raw: round2(sorted.reduce(function (s, it) { return s + it.v.ak; }, 0)), allowed: round2(sum), counted: round2(counted), lostPlafon: round2(sum - counted), detail: detail };
  }

  /* today: tahun acuan (default tahun berjalan). Proyeksi berjalan dari tahun TMT
     sampai horizon tahun setelah tahun acuan. */
  /* ---------- pengangkatan pertama (Juknis Bab B.2; Paparan LLDIKTI VII) ---------- */
  function projectFirst(plan, today) {
    const prof = plan.profile;
    const path = R.paths.NJ.find(function (x) { return x.to === prof.target; }) || R.paths.NJ[0];
    const key = 'NJ>' + path.to;
    const start = parseDate(prof.tetapSejak);
    const nowYear = (today && today.y) || new Date().getFullYear();
    const startYear = start ? start.y : nowYear;
    const endYear = Math.max(startYear, nowYear) + prof.horizon;
    const koef = R.ranks[path.to].koef;
    const years = [];
    for (let y = startYear; y <= endYear; y++) {
      const months = (start && y === startYear) ? 13 - start.m : 12;
      years.push({ year: y, months: months, predikat: plan.skp[y] || 'B', detail: [] });
    }
    const avail = function (w, d) { return w.year < d.y || (w.year === d.y && d.m === 12); };
    const lead = function (w) { return w.role === 'p1' || w.role === 'p1kor' || w.role === 'tunggal'; };

    function evaluateAt(d) {
      const works = countedWorks(plan).filter(function (w) { return avail(w, d); });
      const checks = [];
      checks.push({ id: 'tetap', label: 'Dosen tetap, terdata di SISTER', state: start ? 'ok' : 'no',
        detail: start ? 'Mulai ' + monthLabel(start) + '.' : 'Isi tanggal mulai menjadi dosen tetap.' });
      const ready1 = start ? addMonths(start, 12) : null;
      checks.push({ id: 'masa1', label: 'Tridharma 1 tahun dan BKD 2 semester berstatus Memenuhi', state: ready1 && monthIndex(d) >= monthIndex(ready1) ? 'ok' : 'no',
        detail: ready1 ? 'Terpenuhi mulai ' + monthLabel(ready1) + '.' : 'Menunggu tanggal mulai dosen tetap.' });
      const skpYear = Math.max(startYear, d.m === 12 ? d.y : d.y - 1);
      const sk1 = plan.skp[skpYear] || 'B';
      checks.push({ id: 'skp', label: 'SKP minimal Baik 1 tahun terakhir', state: (sk1 === 'B' || sk1 === 'SB') ? 'ok' : 'no', detail: 'Predikat ' + skpYear + ': ' + R.predikat[sk1].label + '.' });
      if (path.to === 'AA') {
        checks.push({ id: 'ijazah', label: 'Ijazah magister atau magister terapan', state: 'ok', detail: 'Syarat menjadi dosen tetap (Juknis Bab B.1).' });
      } else {
        const docDate = (prof.doktor === 'punya_sudah' || prof.doktor === 'punya_belum') ? null : (prof.doktor === 'rencana' ? { y: prof.doktorTahun, m: 12 } : 'none');
        const ok = docDate === null || (docDate !== 'none' && monthIndex(d) >= monthIndex(docDate));
        checks.push({ id: 's3', label: 'Ijazah doktor atau doktor terapan', state: ok ? 'ok' : 'no',
          detail: ok ? 'Sudah atau akan dimiliki.' : (docDate === 'none' ? 'Atur status ijazah S3 di bagian Ijazah doktor.' : 'Rencana lulus ' + prof.doktorTahun + '.') });
      }
      const sk = path.to === 'L' ? evaluateSK(works, 'AA>L') : { met: true, have: '-', used: [] };
      if (path.to === 'L') checks.push({ id: 'sk', label: 'Syarat khusus publikasi', state: sk.met ? 'ok' : 'no', detail: 'Memenuhi ' + sk.have + '.' });
      if (prof.status === 'PNS') checks.push({ id: 'pns', label: 'Sudah berstatus PNS (bagi yang berasal dari CPNS)', state: 'check', detail: 'Pastikan SK PNS sudah terbit sebelum usulan.' });
      checks.push({ id: 'formasi', label: 'Tersedia kebutuhan dan formasi jabatan akademik di PT', state: 'check', detail: 'Dikonfirmasi perguruan tinggi.' });
      const res = ikdResearch(works, path.to, d.y);
      const okIkd = prof.ikdPend && (res.met || prof.ikdAbdi);
      checks.push({ id: 'ikd', label: 'Indikator Kinerja Dosen (IKD) jabatan ' + R.ranks[path.to].name, state: okIkd ? 'ok' : 'check',
        detail: 'Pendidikan: ' + (prof.ikdPend ? 'dikonfirmasi' : 'belum dikonfirmasi') + '. Penelitian: ' + (res.met ? 'terpenuhi dari daftar karya' : 'belum dari daftar karya') + (prof.ikdAbdi ? '; pengabdian dikonfirmasi' : '') + '.', research: res });
      if (path.to === 'AA') {
        const pub = works.filter(function (w) { return (w.type === 'jnas' || w.type === 'jissn') && lead(w); }).length;
        checks.push({ id: 'rek', label: 'Rekomendasi: publikasi jurnal nasional sebagai penulis pertama', state: pub > 0 ? 'ok' : 'rec',
          detail: (pub > 0 ? pub + ' artikel. ' : 'Belum ada. ') + 'Bukan syarat tertulis; sering diminta dalam praktik penilaian.' });
      }
      return { checks: checks, sk: sk };
    }

    let readyDate = null;
    if (start) {
      const from = monthIndex(addMonths(start, 12)), to = monthIndex({ y: endYear, m: 12 });
      for (let i = from; i <= to; i++) {
        const d = { y: Math.floor(i / 12), m: (i % 12) + 1 };
        if (!evaluateAt(d).checks.some(function (c) { return c.state === 'no'; })) { readyDate = d; break; }
      }
    }
    const evalDate = readyDate || { y: endYear, m: 12 };
    const final = evaluateAt(evalDate);
    let akMasa = 0;
    if (start) {
      const until = monthIndex(evalDate);
      for (let i = monthIndex(start); i < until; i++) {
        const y = Math.floor(i / 12);
        akMasa += koef * R.predikat[plan.skp[y] || 'B'].pct / 12;
      }
    }
    return {
      plan: plan, mode: 'pertama', key: key, rank: R.ranks.NJ, path: path,
      need: path.levels[0], needResearch: 0, akMasa: round2(akMasa), akMasaMonths: start ? monthIndex(evalDate) - monthIndex(start) : 0,
      eduAK: 0, eduAuto: 0, eduYear: null,
      years: years, earliestByTime: start ? addMonths(start, 12) : null, nowYear: nowYear, endYear: endYear,
      readyYear: readyDate ? readyDate.y : null, readyDate: readyDate,
      akYear: null, fastestYear: null, fastestDate: null,
      checks: final.checks, sk: final.sk, evalYear: evalDate.y, evalDate: evalDate,
      warnings: []
    };
  }


  /* ---------- saran rencana ----------
     Menambahkan karya hipotetis satu per satu (syarat khusus dulu, lalu IKD penelitian,
     lalu pengisi AK) dan menjalankan ulang project() sampai siap atau tidak ada lagi
     yang bisa dibantu karya. Hasilnya satu contoh kombinasi, bukan satu-satunya cara. */
  const SUG = {
    nas3:  { type: 'jnas', rank: 3, label: 'Jurnal nasional terakreditasi Sinta 3' },
    nas2:  { type: 'jnas', rank: 2, label: 'Jurnal nasional terakreditasi Sinta 2' },
    nas5:  { type: 'jnas', rank: 5, label: 'Jurnal nasional terakreditasi Sinta 5' },
    q4:    { type: 'jint', quartile: 'Q4', sjr: 0.15, label: 'Jurnal internasional bereputasi Q4 (SJR > 0,1)' },
    q3:    { type: 'jint', quartile: 'Q3', sjr: 0.25, label: 'Jurnal internasional bereputasi Q3 (SJR > 0,2)' },
    q2:    { type: 'jint', quartile: 'Q2', sjr: 0.3, label: 'Jurnal internasional bereputasi Q2 (SJR > 0,25)' },
    q1:    { type: 'jint', quartile: 'Q1', sjr: 0.5, label: 'Jurnal internasional bereputasi Q1 (SJR > 0,25)' },
    q1if:  { type: 'jint', quartile: 'Q1', sjr: 0.5, ifv: 7.5, label: 'Jurnal internasional bereputasi Q1 dengan IF ≥ 7' },
    buku:  { type: 'buku_ref', label: 'Buku referensi' }
  };
  const SK_PLAN = {
    'NJ>L':  [['q4', 'p1kor']],
    'AA>L':  [['nas3', 'p1kor']],
    'L>LK':  [['q3', 'p1kor']],
    'LK>P':  [['q2', 'p1kor'], ['q3', 'p1']],
    'AA>LK': [['q2', 'p1kor'], ['q2', 'p1kor'], ['q2', 'p1'], ['q2', 'p1']],
    'L>P':   [['q1if', 'p1kor'], ['q1', 'p1kor'], ['q2', 'p1'], ['q2', 'p1']]
  };
  const IKD_PLAN = { AA: ['nas5', 'p1kor'], L: ['nas3', 'p1kor'], LK: ['q3', 'p1kor'], P: ['buku', 'p1kor'] };
  const FILLER = { nas: { L: 'nas2', LK: 'nas2', P: 'nas2' }, int: { L: 'q4', LK: 'q3', P: 'q2' } };
  const FIXABLE = ['ak', 'res', 'sk'];

  function suggestPlan(planInput, today, opts) {
    opts = opts || {};
    const base = sanitizePlan(planInput);
    base.profile.konservatif = false;
    const nowYear = (today && today.y) || new Date().getFullYear();
    const baseline = project(base, today);
    const prof = base.profile;
    const key = baseline.key;
    const fillerKey = (FILLER[opts.filler === 'nas' ? 'nas' : 'int'] || {})[prof.target];
    const ikdTarget = baseline.mode === 'pertama' ? baseline.path.to : prof.target;

    function attempt(maxYear) {
      const plan = JSON.parse(JSON.stringify(base));
      const items = [];
      const skQueue = (SK_PLAN[key] || []).slice();
      let skUsed = 0, r = project(plan, today);

      function place(tplKey, role, why) {
        const t = SUG[tplKey];
        const first = r.mode === 'pertama';
        const w = { uid: 'sug-' + (items.length + 1), type: t.type, title: 'Saran: ' + t.label, year: 0, status: 'rencana',
          role: role, authors: 3, firstIsCorr: true, quartile: t.quartile || 'Q3', sjr: t.sjr || 0, ifv: t.ifv || 0, rank: t.rank || 2 };
        const ak = workAK(w).ak;
        for (let k = 0; k < r.years.length; k++) {
          const yr = r.years[k];
          if (yr.year < nowYear || yr.year > maxYear) continue;
          if (items.filter(function (it) { return it.year === yr.year; }).length >= 3) continue;
          if (!first && (yr.capPrestasi - yr.prestasiCounted) < Math.min(ak * 0.6, 5)) continue;
          if (t.type === 'buku_ref' && plan.works.some(function (x) { return x.type === 'buku_ref' && x.year === yr.year; })) continue;
          w.year = yr.year;
          plan.works.push(w);
          items.push(Object.assign({ why: why, label: t.label, ak: ak }, w));
          return true;
        }
        return false;
      }

      for (let guard = 0; guard < 16; guard++) {
        if (r.readyDate && r.readyDate.y <= maxYear) break;
        const blocking = r.checks.filter(function (c) { return c.state === 'no'; });
        if (blocking.some(function (c) { return FIXABLE.indexOf(c.id) < 0; })) {
          if (!(r.readyDate && r.readyDate.y > maxYear)) break;
        }
        const ids = blocking.map(function (c) { return c.id; });
        let ok = false;
        if (ids.indexOf('sk') >= 0 && skUsed < skQueue.length) {
          const q = skQueue[skUsed++]; ok = place(q[0], q[1], 'sk');
        } else if (fillerKey && (ids.indexOf('ak') >= 0 || ids.indexOf('res') >= 0 || (r.readyDate && r.readyDate.y > maxYear))) {
          ok = place(fillerKey, 'p1kor', 'ak');
        }
        if (!ok) break;
        r = project(plan, today);
      }
      if (!(r.readyDate && r.readyDate.y <= maxYear)) return null;
      for (let k = items.length - 1; k >= 0; k--) {
        if (items[k].why !== 'ak') continue;
        const uid = items[k].uid;
        const trial = Object.assign({}, plan, { works: plan.works.filter(function (x) { return x.uid !== uid; }) });
        const r2 = project(trial, today);
        if (r2.readyDate && monthIndex(r2.readyDate) <= monthIndex(r.readyDate)) {
          plan.works = trial.works; items.splice(k, 1); r = r2;
        }
      }
      for (let t = 0; opts.ikd !== false && t < 3; t++) {
        const ic = r.checks.find(function (c) { return c.id === 'ikd'; });
        if (!ic || !ic.research || ic.research.met) break;
        const tp = IKD_PLAN[ikdTarget];
        if (!tp || !place(tp[0], tp[1], 'ikd')) break;
        r = project(plan, today);
      }
      if (r.mode === 'pertama' && r.path.to === 'AA') {
        const rec = r.checks.find(function (c) { return c.id === 'rek'; });
        if (rec && rec.state === 'rec' && place('nas5', 'p1kor', 'rek')) r = project(plan, today);
      }
      return { items: items, result: r };
    }

    const limit = baseline.readyDate ? baseline.readyDate.y : baseline.endYear;
    for (let Y = nowYear; Y <= limit; Y++) {
      const a = attempt(Y);
      if (a && (a.items.length || !baseline.readyDate)) {
        if (baseline.readyDate && a.result.readyDate && monthIndex(a.result.readyDate) >= monthIndex(baseline.readyDate) && !a.items.some(function (x) { return x.why !== 'ak'; })) break;
        return { items: a.items, result: a.result, baseline: baseline, unfixable: [] };
      }
      if (baseline.readyDate && Y === baseline.readyDate.y) break;
    }
    const fallback = baseline.readyDate ? attempt(baseline.readyDate.y) : null;
    if (fallback) return { items: fallback.items.filter(function (x) { return x.why !== 'ak'; }), result: fallback.result, baseline: baseline, unfixable: [] };
    const unfixable = baseline.checks.filter(function (c) { return c.state === 'no' && FIXABLE.indexOf(c.id) < 0; }).map(function (c) { return c.label; });
    return { items: [], result: baseline, baseline: baseline, unfixable: unfixable };
  }

  function project(planInput, today) {
    const plan = sanitizePlan(planInput);
    const prof = plan.profile;
    if (prof.rank === 'NJ') return projectFirst(plan, today);
    const rank = R.ranks[prof.rank];
    const path = R.paths[prof.rank].find(function (x) { return x.to === prof.target && x.kind === prof.kind; });
    const key = prof.rank + '>' + prof.target;
    const tmt = parseDate(prof.tmt);
    const need = Math.max(0, prof.targetAK - prof.akSK);
    const needResearch = round2(need * path.researchPct);
    const startYear = tmt.y;
    const nowYear = (today && today.y) || new Date().getFullYear();
    const endYear = Math.max(startYear, nowYear) + prof.horizon;

    const allowance = {};
    Object.keys(R.kepatutan).forEach(function (cat) {
      const k = R.kepatutan[cat];
      if (k.appliesTo.indexOf(prof.target) >= 0) allowance[cat] = round2(needResearch * k.share);
    });

    const eduAuto = R.akPendidikan[prof.rank] || 0;
    const eduAK = (prof.doktor === 'rencana' || prof.doktor === 'punya_belum')
      ? (prof.akIjazahMode === 'manual' ? prof.akIjazahManual : eduAuto) : 0;
    const eduYear = Math.max(startYear, prof.doktorTahun);

    const years = [];
    let cum = prof.akSK, cumRes = 0, cumFast = prof.akSK, cumFastRes = 0;
    for (let y = startYear; y <= endYear; y++) {
      const months = y === startYear ? 13 - tmt.m : 12;
      const predKey = plan.skp[y] || 'B';
      const pct = R.predikat[predKey].pct;
      const konversi = round2(rank.koef * pct * months / 12);
      const capTotal = round2(rank.maxTotal * months / 12);
      const capPrestasi = round2(Math.max(0, capTotal - konversi));
      const yearWorks = countedWorks(plan).filter(function (w) {
        return (w.year === y) || (y === startYear && w.year < startYear);
      });
      const rec = recognizeYear(yearWorks, capPrestasi, allowance);
      const pend = (eduAK > 0 && y === eduYear) ? eduAK : 0;
      cum = round2(cum + konversi + rec.counted + pend);
      cumRes = round2(cumRes + rec.counted);
      cumFast = round2(cumFast + konversi + capPrestasi + pend);
      cumFastRes = round2(cumFastRes + capPrestasi);
      years.push({
        year: y, months: months, predikat: predKey, konversi: konversi,
        capTotal: capTotal, capPrestasi: capPrestasi,
        prestasiRaw: rec.raw, prestasiAllowed: rec.allowed, prestasiCounted: rec.counted,
        lostPlafon: rec.lostPlafon, pendidikan: pend,
        cumulative: cum, cumulativeResearch: cumRes,
        cumulativeFast: cumFast, cumulativeFastResearch: cumFastRes,
        detail: rec.detail,
        worksCount: yearWorks.length
      });
    }

    const earliestByTime = addMonths(tmt, path.minYearsInRank * 12);
    /* BKD 4 semester berturut-turut di perguruan tinggi yang sama (Bab D.1).
       Bila pindah, dihitung 24 bulan sejak mulai BKD di perguruan tinggi saat ini. */
    const bkdStart = prof.bkdSamaPT ? null : parseDate(prof.bkdSejak);
    const bkdReady = prof.bkdSamaPT ? null : (bkdStart ? addMonths(bkdStart, 24) : null);

    function staticChecks(y) {
      const checks = [];
      const at = { y: y, m: 12 };
      const isP = prof.target === 'P';
      const loncat = prof.kind === 'loncat';
      if (prof.status === 'PNS' && !loncat) {
        const minG = R.golongan.indexOf(R.golonganMin[prof.rank]);
        const ok = R.golongan.indexOf(prof.golongan) >= minG;
        checks.push({ id: 'gol', label: 'Pangkat minimal ' + R.golonganMin[prof.rank] + ' (Dosen PNS)', state: ok ? 'ok' : 'no', detail: 'Pangkat saat ini ' + prof.golongan + '.' });
      }
      if (isP || loncat) {
        const ok = hasDoctorate(prof, y);
        checks.push({ id: 's3', label: 'Ijazah doktor, doktor terapan, atau subspesialis', state: ok ? 'ok' : 'no',
          detail: ok ? (prof.doktor === 'rencana' ? 'Mengikuti rencana lulus ' + prof.doktorTahun + '.' : 'Sudah dimiliki.') : 'Belum ada pada tahun ini.' });
      }
      if (isP) {
        const ts = parseDate(prof.tetapSejak);
        let ok = false, detail = 'Isi tanggal mulai menjadi dosen tetap.';
        if (ts) {
          const yrs = (monthIndex(maxMonth(at, earliestByTime)) - monthIndex(ts)) / 12;
          ok = yrs >= 10;
          detail = 'Sekitar ' + Math.floor(yrs) + ' tahun pada akhir ' + y + '.';
        }
        checks.push({ id: 'masa', label: 'Pengalaman 10 tahun sebagai dosen tetap', state: ok ? 'ok' : 'no', detail: detail });
        checks.push({ id: 'serdos', label: 'Sertifikat pendidik', state: prof.serdos ? 'ok' : 'no', detail: prof.serdos ? 'Sudah dimiliki.' : 'Belum ditandai.' });
        const st = prof.syaratTambahan.length > 0;
        checks.push({ id: 'tambahan', label: 'Satu syarat khusus tambahan Profesor', state: st ? 'ok' : 'no', detail: st ? prof.syaratTambahan.length + ' terpenuhi.' : 'Belum ada yang ditandai.' });
      }
      if (loncat) {
        checks.push({ id: 'plb', label: 'Bukti prestasi luar biasa', state: prof.prestasiLuarBiasa ? 'ok' : 'no', detail: 'Mahasiswa berprestasi internasional, buku, karya inovatif internasional, paten, atau penghargaan nasional.' });
      }
      return checks;
    }

    function skpOK(y, needSB) {
      const yrs = [y, y - 1].filter(function (v) { return v >= startYear; });
      return yrs.every(function (v) {
        const p = plan.skp[v] || 'B';
        return needSB ? p === 'SB' : (p === 'SB' || p === 'B');
      });
    }

    function evaluate(y) {
      const row = years.find(function (r) { return r.year === y; });
      const works = countedWorks(plan).filter(function (w) { return w.year <= y; });
      const sk = evaluateSK(works, key);
      const loncat = prof.kind === 'loncat';
      const checks = [
        { id: 'ak', label: 'AK kumulatif mencapai ' + prof.targetAK, state: row.cumulative >= prof.targetAK ? 'ok' : 'no', detail: idn(row.cumulative) + ' AK pada akhir ' + y + '.' },
        { id: 'res', label: 'AK penelitian minimal ' + Math.round(path.researchPct * 100) + '% dari kekurangan (' + idn(needResearch) + ' AK)', state: row.cumulativeResearch >= needResearch ? 'ok' : 'no', detail: idn(row.cumulativeResearch) + ' AK penelitian diakui.' },
        { id: 'sk', label: 'Syarat khusus publikasi', state: sk.met ? 'ok' : 'no', detail: 'Memenuhi ' + sk.have + '.' },
        (function () {
          if (prof.bkdSamaPT) return { id: 'bkd', label: 'BKD 4 semester berturut-turut di perguruan tinggi yang sama', state: 'ok', detail: 'Dianggap terpenuhi: BKD di perguruan tinggi saat ini, tiap semester berstatus memenuhi.' };
          if (!bkdReady) return { id: 'bkd', label: 'BKD 4 semester berturut-turut di perguruan tinggi yang sama', state: 'no', detail: 'Isi tanggal mulai BKD di perguruan tinggi saat ini.' };
          const ok = monthIndex({ y: y, m: 12 }) >= monthIndex(bkdReady);
          return { id: 'bkd', label: 'BKD 4 semester berturut-turut di perguruan tinggi yang sama', state: ok ? 'ok' : 'no', detail: '4 semester di perguruan tinggi saat ini tercapai ' + monthLabel(bkdReady) + '.' };
        })(),
        (function () {
          const res = ikdResearch(works, prof.target, y);
          const second = res.met || prof.ikdAbdi;
          const ok = prof.ikdPend && second;
          const parts = [
            'Pendidikan: ' + (prof.ikdPend ? 'dikonfirmasi' : 'belum dikonfirmasi') + '.',
            'Penelitian: ' + (res.met ? 'terpenuhi dari daftar karya' : 'belum dari daftar karya') + (prof.ikdAbdi ? '; pengabdian dikonfirmasi' : '') + '.'
          ];
          return { id: 'ikd', label: 'Indikator Kinerja Dosen (IKD) jabatan ' + R.ranks[prof.target].name, state: ok ? 'ok' : 'check', detail: parts.join(' '), research: res };
        })(),
        { id: 'masajab', label: 'Paling singkat ' + path.minYearsInRank + ' tahun dalam jabatan ' + rank.name, state: monthIndex({ y: y, m: 12 }) >= monthIndex(earliestByTime) ? 'ok' : 'warn', detail: 'Terpenuhi mulai ' + monthLabel(earliestByTime) + '.' },
        { id: 'skp', label: loncat ? 'SKP Sangat Baik 2 tahun terakhir' : 'SKP minimal Baik 2 tahun berturut-turut', state: skpOK(y, loncat) ? 'ok' : 'no', detail: 'Predikat ' + [y - 1, y].map(function (v) { return v + ': ' + R.predikat[plan.skp[v] || 'B'].label; }).join(', ') + '.' }
      ].concat(staticChecks(y));
      return { checks: checks, sk: sk };
    }

    let readyYear = null, akYear = null, fastestYear = null;
    years.forEach(function (r) {
      if (akYear === null && r.cumulative >= prof.targetAK && r.cumulativeResearch >= needResearch) akYear = r.year;
      if (fastestYear === null && r.cumulativeFast >= prof.targetAK && r.cumulativeFastResearch >= needResearch) fastestYear = r.year;
      if (readyYear === null) {
        const ev = evaluate(r.year);
        const blocking = ev.checks.filter(function (c) { return c.state === 'no'; });
        if (blocking.length === 0) readyYear = r.year;
      }
    });

    const evalYear = readyYear || endYear;
    const final = evaluate(evalYear);
    let readyDate = readyYear ? maxMonth({ y: readyYear, m: 12 }, earliestByTime) : null;
    if (readyDate && bkdReady) readyDate = maxMonth(readyDate, bkdReady);
    const fastestDate = fastestYear ? maxMonth({ y: fastestYear, m: 12 }, earliestByTime) : null;

    const warnings = [];
    years.forEach(function (r) {
      if (r.lostPlafon > 0) warnings.push({ kind: 'plafon', year: r.year, amount: r.lostPlafon, cap: r.capPrestasi });
      r.detail.forEach(function (d) {
        if (d.notes.length) {
          const w = plan.works.find(function (x) { return x.uid === d.uid; });
          warnings.push({ kind: 'karya', year: r.year, title: w && w.title ? w.title : 'Karya ' + r.year, notes: d.notes });
        }
      });
    });

    return {
      plan: plan, key: key, rank: rank, path: path,
      need: need, needResearch: needResearch, allowanceStart: Object.assign({}, (function () {
        const a = {};
        Object.keys(R.kepatutan).forEach(function (cat) { if (R.kepatutan[cat].appliesTo.indexOf(prof.target) >= 0) a[cat] = round2(needResearch * R.kepatutan[cat].share); });
        return a;
      })()),
      eduAK: eduAK, eduAuto: eduAuto, eduYear: eduAK > 0 ? eduYear : null,
      years: years, earliestByTime: earliestByTime, nowYear: nowYear, endYear: endYear,
      readyYear: readyYear, readyDate: readyDate,
      akYear: akYear, fastestYear: fastestYear, fastestDate: fastestDate,
      checks: final.checks, sk: final.sk, evalYear: evalYear,
      warnings: warnings
    };
  }

  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  function monthLabel(dt) { return dt ? BULAN[dt.m - 1] + ' ' + dt.y : '-'; }

  return {
    authorShare: authorShare,
    workMaxAK: workMaxAK,
    workAK: workAK,
    skExclusions: skExclusions,
    evaluateSK: evaluateSK,
    ikdResearch: ikdResearch,
    suggestPlan: suggestPlan,
    STATUS_KARYA: STATUS_KARYA,
    emptyPlan: emptyPlan,
    sanitizePlan: sanitizePlan,
    project: project,
    parseDate: parseDate,
    monthLabel: monthLabel,
    round2: round2,
    catalogById: catalogById
  };
});

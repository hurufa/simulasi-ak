/*
 * Simulasi AK Dosen — antarmuka
 * Semua teks dari pengguna ditulis lewat textContent; tidak ada innerHTML untuk data.
 */
(function () {
  'use strict';
  const APP_VERSION = '1.1.1';

  const R = window.AKRules;
  const E = window.AKEngine;
  const STORE_KEY = 'simulasi-ak:v1';
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const $ = function (id) { return document.getElementById(id); };
  const fmt = function (x) {
    return (Math.round(x * 100) / 100).toLocaleString('id-ID', { maximumFractionDigits: 2 });
  };

  function h(tag, attrs) {
    const el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      const v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (let i = 2; i < arguments.length; i++) {
      const c = arguments[i];
      if (c === null || c === undefined || c === false) continue;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return el;
  }
  function s(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  function show(el, on) { el.hidden = !on; }

  /* ---------- penyimpanan lokal ---------- */

  function loadStored() {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return { plan: E.sanitizePlan(obj.plan), isSample: !!obj.isSample };
    } catch (e) { return null; }
  }
  function store() {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify({ plan: state.plan, isSample: state.isSample })); }
    catch (e) { /* penyimpanan tidak tersedia: aplikasi tetap berjalan */ }
  }

  /* ---------- keadaan ---------- */

  const stored = loadStored();
  const state = {
    plan: stored ? stored.plan : E.sanitizePlan(window.AKSample()),
    isSample: stored ? stored.isSample : true,
    editing: null,
    lastDeleted: null,
    result: null,
    skpSignature: ''
  };
  const framed = (function () { try { return window.self !== window.top; } catch (e) { return true; } })();

  /* ---------- isi pilihan statis ---------- */

  function fillStatic() {
    R.golongan.forEach(function (g) { $('f-golongan').appendChild(h('option', { value: g, text: g })); });

    const groups = {};
    R.catalog.forEach(function (c) {
      if (!groups[c.group]) {
        groups[c.group] = h('optgroup', { label: c.group });
        $('w-type').appendChild(groups[c.group]);
      }
      const ak = c.akBy === 'quartile' ? '33–40' : c.akBy === 'rank' ? '15–25' : fmt(c.ak);
      groups[c.group].appendChild(h('option', { value: c.id, text: c.label + ' · ' + ak + ' AK' }));
    });

    Object.keys(R.roles).forEach(function (k) { $('w-role').appendChild(h('option', { value: k, text: R.roles[k] })); });

    const list = $('tambahan-list');
    R.syaratTambahanProfesor.forEach(function (st) {
      list.appendChild(h('label', { class: 'check' },
        h('input', { type: 'checkbox', id: 'st-' + st.id, 'data-st': st.id }),
        h('span', { text: st.label })));
    });
    $('rules-version').textContent = R.meta.version;
    $('app-version').textContent = APP_VERSION;
    const now = new Date().getFullYear();
    [1, 2, 3, 4, 5, 6, 8, 10].forEach(function (n) {
      $('f-horizon').appendChild(h('option', { value: String(n), text: (now + n) + ' (' + n + ' tahun lagi)' }));
    });
  }

  function fillTargets() {
    const p = state.plan.profile;
    const sel = $('f-target');
    clear(sel);
    R.paths[p.rank].forEach(function (path) {
      path.levels.forEach(function (lv) {
        const label = R.ranks[path.to].name + ' · ' + lv + ' AK' + (path.kind === 'loncat' ? ' (loncat dua jenjang)' : '');
        sel.appendChild(h('option', { value: path.to + '|' + path.kind + '|' + lv, text: label }));
      });
    });
    sel.value = p.target + '|' + p.kind + '|' + p.targetAK;
  }

  /* ---------- formulir profil <-> rencana ---------- */

  function syncFormFromPlan() {
    const p = state.plan.profile;
    $('f-status').value = p.status;
    $('f-golongan').value = p.golongan;
    $('f-rank').value = p.rank;
    $('f-aksk').value = p.akSK;
    $('f-tmt').value = p.tmt;
    $('f-horizon').value = String(p.horizon);
    $('f-doktor').value = p.doktor;
    $('f-doktor-tahun').value = p.doktorTahun;
    $('f-ijazah-baru').value = p.akIjazahBaru;
    $('f-ijazah-klaim').value = p.akIjazahKlaim;
    $('f-tetap').value = p.tetapSejak;
    $('f-bkd-sama').checked = p.bkdSamaPT;
    $('f-bkd-sejak').value = p.bkdSejak;
    $('f-serdos').checked = p.serdos;
    $('f-plb').checked = p.prestasiLuarBiasa;
    R.syaratTambahanProfesor.forEach(function (st) { $('st-' + st.id).checked = p.syaratTambahan.indexOf(st.id) >= 0; });
    fillTargets();
    state.skpSignature = '';
  }

  function readProfile() {
    const p = Object.assign({}, state.plan.profile);
    const prevRank = p.rank;
    p.status = $('f-status').value;
    p.golongan = $('f-golongan').value;
    p.rank = $('f-rank').value;
    p.akSK = $('f-aksk').value;
    p.tmt = $('f-tmt').value || p.tmt;
    p.horizon = $('f-horizon').value;
    const t = $('f-target').value.split('|');
    if (p.rank !== prevRank) {
      const first = R.paths[p.rank][0];
      p.target = first.to; p.kind = first.kind; p.targetAK = first.levels[0];
      if (+p.akSK < R.ranks[p.rank].levels[0] || prevRank !== p.rank) p.akSK = R.ranks[p.rank].levels[0];
    } else if (t.length === 3) {
      p.target = t[0]; p.kind = t[1]; p.targetAK = +t[2];
    }
    p.doktor = $('f-doktor').value;
    p.doktorTahun = $('f-doktor-tahun').value;
    p.akIjazahBaru = $('f-ijazah-baru').value;
    p.akIjazahKlaim = $('f-ijazah-klaim').value;
    p.tetapSejak = $('f-tetap').value;
    p.bkdSamaPT = $('f-bkd-sama').checked;
    p.bkdSejak = $('f-bkd-sejak').value;
    p.serdos = $('f-serdos').checked;
    p.prestasiLuarBiasa = $('f-plb').checked;
    p.syaratTambahan = R.syaratTambahanProfesor.filter(function (st) { return $('st-' + st.id).checked; }).map(function (st) { return st.id; });
    const plan = Object.assign({}, state.plan, { profile: p });
    state.plan = E.sanitizePlan(plan);
    if (p.rank !== prevRank) { $('f-aksk').value = state.plan.profile.akSK; fillTargets(); }
  }

  function onProfileChange() {
    readProfile();
    markEdited();
    render();
  }

  function markEdited() {
    if (state.isSample) state.isSample = false;
  }

  /* ---------- SKP per tahun ---------- */

  function renderSkpGrid(result) {
    const sig = result.years.map(function (y) { return y.year; }).join(',');
    if (sig === state.skpSignature) return;
    state.skpSignature = sig;
    const grid = $('skp-grid');
    clear(grid);
    result.years.forEach(function (y) {
      const id = 'skp-' + y.year;
      const sel = h('select', { id: id, 'data-year': y.year });
      Object.keys(R.predikat).forEach(function (k) {
        sel.appendChild(h('option', { value: k, text: R.predikat[k].label + ' (' + Math.round(R.predikat[k].pct * 100) + '%)' }));
      });
      sel.value = state.plan.skp[y.year] || 'B';
      sel.addEventListener('change', function () {
        state.plan.skp[y.year] = sel.value;
        markEdited();
        render();
      });
      grid.appendChild(h('label', { class: 'field skp-cell', for: id },
        h('span', { class: 'field__label', text: String(y.year) + (y.months < 12 ? ' · ' + y.months + ' bln' : '') }),
        sel));
    });
  }

  /* ---------- formulir karya ---------- */

  function readWorkForm() {
    return {
      uid: state.editing || ('w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)),
      title: $('w-title').value.trim(),
      type: $('w-type').value,
      year: $('w-year').value,
      status: $('w-status').value,
      quartile: $('w-quartile').value,
      sjr: $('w-sjr').value,
      ifv: $('w-if').value,
      rank: $('w-rank').value,
      role: $('w-role').value,
      authors: $('w-authors').value,
      firstIsCorr: $('w-first').value === 'ya',
      fromThesis: $('w-thesis').checked,
      ownJournal: $('w-own').checked,
      specialIssue: $('w-special').checked,
      preTMT: $('w-pretmt').checked
    };
  }

  function fillWorkForm(w) {
    $('w-title').value = w.title || '';
    $('w-type').value = w.type;
    $('w-year').value = w.year;
    $('w-status').value = w.status;
    $('w-quartile').value = w.quartile;
    $('w-sjr').value = w.sjr || '';
    $('w-if').value = w.ifv || '';
    $('w-rank').value = String(w.rank);
    $('w-role').value = w.role;
    $('w-authors').value = w.authors;
    $('w-first').value = w.firstIsCorr ? 'ya' : 'tidak';
    $('w-thesis').checked = w.fromThesis;
    $('w-own').checked = w.ownJournal;
    $('w-special').checked = w.specialIssue;
    $('w-pretmt').checked = w.preTMT;
    updateWorkForm();
  }

  function resetWorkForm() {
    state.editing = null;
    const y = Math.max(new Date().getFullYear(), E.parseDate(state.plan.profile.tmt).y);
    fillWorkForm({ type: 'jnas', year: y, status: 'rencana', quartile: 'Q3', sjr: '', ifv: '', rank: 2, role: 'p1kor', authors: 3, firstIsCorr: true });
    $('w-title').value = '';
    $('w-submit').textContent = 'Tambahkan karya';
    show($('w-cancel'), false);
    $('w-error').textContent = '';
  }

  function updateWorkForm() {
    const type = $('w-type').value;
    show($('wrap-w-quartile'), type === 'jint');
    show($('wrap-w-sjr'), type === 'jint');
    show($('wrap-w-if'), type === 'jint');
    show($('wrap-w-rank'), type === 'jnas');
    if ($('w-role').value === 'tunggal') $('w-authors').value = 1;
    const n = parseInt($('w-authors').value, 10) || 1;
    show($('wrap-w-first'), $('w-role').value === 'anggota' && n >= 3);
    const w = E.sanitizePlan({ works: [readWorkForm()] }).works[0];
    const v = E.workAK(w);
    $('w-calc').textContent = 'AK maksimal ' + fmt(v.max) + ' × ' + v.shareLabel + ' = ' + fmt(v.ak) + ' AK';
  }

  function submitWork(ev) {
    ev.preventDefault();
    const raw = readWorkForm();
    const err = $('w-error');
    const year = parseInt(raw.year, 10);
    const n = parseInt(raw.authors, 10);
    if (!year || year < 1990 || year > 2100) { err.textContent = 'Isi tahun terbit antara 1990 dan 2100.'; $('w-year').focus(); return; }
    if (!n || n < 1) { err.textContent = 'Isi jumlah penulis, minimal 1.'; $('w-authors').focus(); return; }
    if (raw.role !== 'tunggal' && n < 2) { err.textContent = 'Peran ini butuh minimal 2 penulis. Pilih "Penulis tunggal" bila Anda satu-satunya penulis.'; $('w-authors').focus(); return; }
    if (!raw.title) raw.title = E.catalogById[raw.type].label;
    const w = E.sanitizePlan({ works: [raw] }).works[0];
    const works = state.plan.works.slice();
    const idx = works.findIndex(function (x) { return x.uid === w.uid; });
    if (idx >= 0) works[idx] = w; else works.push(w);
    state.plan = E.sanitizePlan(Object.assign({}, state.plan, { works: works }));
    markEdited();
    resetWorkForm();
    render();
    setMsg('Karya disimpan.');
  }

  function editWork(uid) {
    const w = state.plan.works.find(function (x) { return x.uid === uid; });
    if (!w) return;
    state.editing = uid;
    fillWorkForm(w);
    $('w-submit').textContent = 'Simpan perubahan';
    show($('w-cancel'), true);
    $('work-form').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    $('w-title').focus({ preventScroll: true });
  }

  function deleteWork(uid) {
    const idx = state.plan.works.findIndex(function (x) { return x.uid === uid; });
    if (idx < 0) return;
    state.lastDeleted = { work: state.plan.works[idx], index: idx };
    state.plan.works.splice(idx, 1);
    if (state.editing === uid) resetWorkForm();
    markEdited();
    render();
    setMsg('Karya dihapus.', { label: 'Urungkan', run: undoDelete });
  }

  function undoDelete() {
    if (!state.lastDeleted) return;
    state.plan.works.splice(state.lastDeleted.index, 0, state.lastDeleted.work);
    state.lastDeleted = null;
    render();
    setMsg('Karya dikembalikan.');
  }

  /* ---------- pesan status ---------- */

  let toastTimer = null;
  function setMsg(text, action) {
    if (!text) return;
    let box = $('toast');
    if (!box) {
      box = h('div', { id: 'toast', class: 'toast', role: 'status', 'aria-live': 'polite' });
      document.body.appendChild(box);
    }
    clear(box);
    box.appendChild(h('span', { text: text }));
    if (action) box.appendChild(h('button', { type: 'button', class: 'toast__btn', text: action.label, onclick: function () { action.run(); } }));
    box.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { box.classList.remove('is-on'); }, action ? 8000 : 3000);
  }

  /* ---------- tampilan hasil ---------- */

  function chip(state_) {
    const map = { ok: ['chip chip--ok', 'Terpenuhi'], no: ['chip chip--no', 'Belum'], warn: ['chip chip--warn', 'Menunggu'] };
    const m = map[state_] || map.no;
    return h('span', { class: m[0], text: m[1] });
  }

  const ORDER = ['AA', 'L', 'LK', 'P'];

  function pickRank(code) {
    const p = state.plan.profile;
    const cur = ORDER.indexOf(p.rank), idx = ORDER.indexOf(code);
    if (idx > cur) {
      const path = R.paths[p.rank].find(function (x) { return x.to === code; });
      if (!path) return;
      $('f-target').value = path.to + '|' + path.kind + '|' + path.levels[0];
      onProfileChange();
      setMsg('Target diubah ke ' + R.ranks[code].name + (path.kind === 'loncat' ? ' (loncat dua jenjang).' : '.'));
    } else if (idx < cur || (idx === cur && code !== 'P')) {
      if (code === 'P' || idx === cur) return;
      $('f-rank').value = code;
      onProfileChange();
      setMsg('Jabatan saat ini diubah ke ' + R.ranks[code].name + '. Periksa AK di SK dan TMT.');
    }
  }

  function renderLadder(r) {
    const ol = $('ladder');
    clear(ol);
    const p = r.plan.profile;
    const cur = ORDER.indexOf(p.rank);
    ORDER.forEach(function (code, idx) {
      const rk = R.ranks[code];
      const isCur = code === p.rank, isTarget = code === p.target;
      const reachable = idx > cur && R.paths[p.rank].some(function (x) { return x.to === code; });
      const canBeCurrent = idx < cur;
      const role = isCur ? 'Saat ini' : isTarget ? 'Target' : reachable ? 'Jadikan target' : canBeCurrent ? 'Jadikan jabatan saat ini' : 'Di luar jangkauan';
      const btn = h('button', {
        type: 'button',
        class: 'ladder__btn' + (isCur ? ' is-current' : '') + (isTarget ? ' is-target' : ''),
        'aria-pressed': isCur || isTarget ? 'true' : 'false',
        disabled: isCur || isTarget || (!reachable && !canBeCurrent),
        onclick: function () { pickRank(code); }
      },
        h('span', { class: 'ladder__role', text: role }),
        h('span', { class: 'ladder__name', text: rk.name }),
        h('span', { class: 'ladder__ak', text: rk.levels.join(' / ') + ' AK' }));
      ol.appendChild(h('li', { class: 'ladder__step' }, btn));
    });
  }

  /* ---------- tab ---------- */

  const TABS = ['simulasi', 'rujukan', 'simpan'];
  function activateTab(name, focus) {
    if (TABS.indexOf(name) < 0) name = 'simulasi';
    TABS.forEach(function (t) {
      const on = t === name;
      const tab = $('tab-' + t);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      $('tp-' + t).hidden = !on;
      if (on && focus) tab.focus();
    });
    try { history.replaceState(null, '', '#' + name); } catch (e) { /* abaikan */ }
    if (name === 'simulasi' && state.result) renderChart(state.result);
  }

  function bindTabs() {
    TABS.forEach(function (t, i) {
      const tab = $('tab-' + t);
      tab.addEventListener('click', function () { activateTab(t); });
      tab.addEventListener('keydown', function (ev) {
        let j = null;
        if (ev.key === 'ArrowRight') j = (i + 1) % TABS.length;
        else if (ev.key === 'ArrowLeft') j = (i - 1 + TABS.length) % TABS.length;
        else if (ev.key === 'Home') j = 0;
        else if (ev.key === 'End') j = TABS.length - 1;
        if (j !== null) { ev.preventDefault(); activateTab(TABS[j], true); }
      });
    });
    const initial = (location.hash || '').replace('#', '');
    activateTab(TABS.indexOf(initial) >= 0 ? initial : 'simulasi');
  }


  /* ---------- penjelasan (ⓘ) dan tautan ke rujukan ---------- */

  function openRef(refId) {
    const target = $(refId);
    if (!target) return;
    activateTab('rujukan');
    const search = $('ref-search');
    if (search.value) { search.value = ''; search.dispatchEvent(new Event('input')); }
    if (target.tagName === 'DETAILS') target.open = true;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    const focusEl = target.querySelector('summary') || target.querySelector('h2');
    if (focusEl) {
      if (!focusEl.hasAttribute('tabindex') && focusEl.tagName !== 'SUMMARY') focusEl.setAttribute('tabindex', '-1');
      focusEl.focus({ preventScroll: true });
    }
    target.classList.add('is-flash');
    setTimeout(function () { target.classList.remove('is-flash'); }, 1600);
  }

  function refLink(refId, text) {
    return h('a', { class: 'info-link', href: '#rujukan', 'data-ref': refId, text: text || 'Selengkapnya di Rujukan juknis' });
  }

  function initHelp() {
    const H = window.AKHelp || {};
    let n = 0;
    Array.from(document.querySelectorAll('[data-help]')).forEach(function (el) {
      const item = H[el.getAttribute('data-help')];
      if (!item) return;
      const id = 'help-' + (++n);
      const labelEl = el.matches('legend, h2') ? el : el.querySelector('.field__label, .figure__label');
      if (!labelEl) return;
      const name = labelEl.textContent.trim();
      const btn = h('button', { type: 'button', class: 'info-btn', 'aria-expanded': 'false', 'aria-controls': id, 'aria-label': 'Penjelasan: ' + name, title: 'Penjelasan' });
      const panel = h('div', { class: 'info-panel', id: id, hidden: true }, h('p', { text: item.text }), item.ref ? refLink(item.ref) : null);
      btn.addEventListener('click', function () {
        const open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        panel.hidden = !open;
      });
      if (el.matches('legend, h2')) {
        el.appendChild(btn);
        el.insertAdjacentElement('afterend', panel);
      } else {
        const head = h('div', { class: 'help-head' });
        labelEl.replaceWith(head);
        head.appendChild(labelEl);
        head.appendChild(btn);
        head.insertAdjacentElement('afterend', panel);
      }
    });
    document.addEventListener('click', function (ev) {
      const link = ev.target.closest && ev.target.closest('a[data-ref]');
      if (!link) return;
      ev.preventDefault();
      openRef(link.getAttribute('data-ref'));
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') return;
      const btn = document.activeElement && document.activeElement.closest && document.activeElement.closest('.info-panel');
      const owner = btn ? document.querySelector('[aria-controls="' + btn.id + '"]') : null;
      if (owner) { owner.click(); owner.focus(); }
    });
  }


  /* ---------- panduan langkah awal ---------- */
  /* Kartu non-modal: halaman tetap bisa diisi selama panduan terbuka. */

  const TOUR = [
    { anchor: 'h-jabatan', title: 'Isi jabatan dan target',
      text: 'Mulai di sini. Pilih status kepegawaian dan jabatan saat ini, isi AK kumulatif dan TMT dari SK terakhir, lalu pilih jabatan target.' },
    { anchor: 'h-doktor', title: 'Atur ijazah doktor',
      text: 'Bila Anda sudah doktor atau sedang S3, isi di sini. Bila belum, lewati saja. AK ijazah dihitung dari nilai ijazah baru dikurangi yang pernah diklaim.' },
    { anchor: 'h-skp', title: 'Pilih predikat SKP per tahun',
      text: 'Predikat tiap tahun menentukan AK Konversi dan sisa plafon untuk penelitian. Bila ragu, biarkan Baik.' },
    { anchor: 'h-karya', title: 'Tambahkan karya penelitian',
      text: 'Masukkan karya yang sudah terbit sejak TMT dan yang Anda rencanakan, lengkap dengan tahun dan peran penulis.' },
    { anchor: 'h-ringkasan', title: 'Baca hasilnya',
      text: 'Ringkasan menampilkan tanggal paling awal Anda siap diusulkan. Daftar syarat menunjukkan butir yang belum terpenuhi. Tombol ⓘ menjelaskan istilah dan menautkannya ke juknis.' }
  ];
  let tourIdx = -1, tourBox = null, tourTarget = null;

  function tourSection(i) {
    const el = $(TOUR[i].anchor);
    return el ? (el.closest('section') || el) : null;
  }

  function buildTour() {
    tourBox = h('div', { class: 'tour', id: 'tour', role: 'dialog', 'aria-modal': 'false', 'aria-labelledby': 'tour-title', 'aria-describedby': 'tour-text' },
      h('div', { class: 'tour__head' },
        h('span', { class: 'tour__count', id: 'tour-count' }),
        h('button', { type: 'button', class: 'tour__close', 'aria-label': 'Tutup panduan', text: '×', onclick: endTour })),
      h('h2', { class: 'tour__title', id: 'tour-title', tabindex: '-1' }),
      h('p', { class: 'tour__text', id: 'tour-text' }),
      h('div', { class: 'tour__dots', id: 'tour-dots', 'aria-hidden': 'true' }),
      h('div', { class: 'tour__nav' },
        h('button', { type: 'button', class: 'btn btn--text', id: 'tour-prev', text: 'Sebelumnya', onclick: function () { showTour(tourIdx - 1); } }),
        h('button', { type: 'button', class: 'btn btn--primary', id: 'tour-next', onclick: function () { tourIdx >= TOUR.length - 1 ? endTour() : showTour(tourIdx + 1); } })));
    document.body.appendChild(tourBox);
  }

  function showTour(i) {
    if (i < 0 || i >= TOUR.length) return;
    tourIdx = i;
    if (tourTarget) tourTarget.classList.remove('is-tour');
    tourTarget = tourSection(i);
    const step = TOUR[i];
    $('tour-count').textContent = 'Langkah ' + (i + 1) + ' dari ' + TOUR.length;
    $('tour-title').textContent = step.title;
    $('tour-text').textContent = step.text;
    const dots = $('tour-dots'); clear(dots);
    TOUR.forEach(function (_, k) { dots.appendChild(h('span', { class: k === i ? 'is-on' : '' })); });
    $('tour-prev').disabled = i === 0;
    $('tour-next').textContent = i === TOUR.length - 1 ? 'Selesai' : 'Lanjut';
    if (tourTarget) {
      tourTarget.classList.add('is-tour');
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      tourTarget.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
    $('tour-title').focus({ preventScroll: true });
  }

  function startTour() {
    activateTab('simulasi');
    if (!tourBox) buildTour();
    tourBox.hidden = false;
    document.body.classList.add('has-tour');
    showTour(0);
  }

  function endTour() {
    if (!tourBox) return;
    const last = tourIdx === TOUR.length - 1;
    tourBox.hidden = true;
    document.body.classList.remove('has-tour');
    if (tourTarget) tourTarget.classList.remove('is-tour');
    tourTarget = null; tourIdx = -1;
    if (last) { const f = $('f-status'); $('h-jabatan').scrollIntoView({ block: 'start' }); f.focus({ preventScroll: true }); }
    else $('btn-tour').focus({ preventScroll: true });
  }

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && tourBox && !tourBox.hidden && tourBox.contains(document.activeElement)) endTour();
  });

  /* ---------- kepala laporan cetak ---------- */

  function renderPrintHead(r) {
    const box = $('print-head');
    clear(box);
    const p = r.plan.profile;
    const status = { PNS: 'Dosen PNS', PTNBH: 'Dosen tetap PTN BH', PTS: 'Dosen tetap PTS / PTS Keagamaan' }[p.status];
    const d = new Date();
    const tgl = d.getDate() + ' ' + E.monthLabel({ y: d.getFullYear(), m: d.getMonth() + 1 });
    box.appendChild(h('p', { class: 'print-head__kicker', text: 'Laporan Simulasi AK Dosen · ' + R.meta.source }));
    box.appendChild(h('p', { class: 'print-head__title', text: R.ranks[p.rank].name + ' ' + p.akSK + ' AK → ' + R.ranks[p.target].name + ' ' + p.targetAK + ' AK' + (p.kind === 'loncat' ? ' (dua jenjang)' : '') }));
    const tmt = E.parseDate(p.tmt);
    box.appendChild(h('p', { class: 'print-head__meta', text: status + ' · TMT ' + tmt.d + ' ' + E.monthLabel(tmt) + ' · dicetak ' + tgl }));
  }

  function renderSummary(r) {
    const p = r.plan.profile;
    $('fig-need').textContent = fmt(r.need);
    $('fig-need-sub').textContent = 'dari ' + fmt(p.akSK) + ' ke ' + p.targetAK + ' AK';
    $('fig-res').textContent = fmt(r.needResearch);
    $('fig-res-sub').textContent = Math.round(r.path.researchPct * 100) + '% dari kekurangan AK';
    $('fig-ready').textContent = r.readyDate ? E.monthLabel(r.readyDate) : 'Belum';
    $('fig-ready-sub').textContent = r.fastestDate ? 'Batas tercepat menurut aturan: ' + E.monthLabel(r.fastestDate) : 'Plafon penuh pun belum cukup dalam ' + p.horizon + ' tahun';
    const ok = r.checks.filter(function (c) { return c.state === 'ok'; }).length;
    $('fig-checks').textContent = ok + '/' + r.checks.length;
    $('fig-checks-sub').textContent = r.readyYear ? 'dinilai pada akhir ' + r.evalYear : 'dinilai pada akhir ' + r.evalYear + ' (akhir proyeksi)';

    const target = R.ranks[p.target].name + ' ' + p.targetAK + ' AK';
    const v = $('verdict');
    clear(v);
    if (r.readyDate) {
      v.appendChild(document.createTextNode('Dengan rencana ini, usulan ke ' + target + ' bisa diajukan mulai '));
      v.appendChild(h('strong', { text: E.monthLabel(r.readyDate) }));
      v.appendChild(document.createTextNode('.'));
      if (r.fastestDate && (r.fastestDate.y < r.readyDate.y)) {
        v.appendChild(document.createTextNode(' Aturan memungkinkan paling cepat ' + E.monthLabel(r.fastestDate) + ' bila plafon penelitian terisi penuh setiap tahun.'));
      }
    } else {
      const blocking = r.checks.filter(function (c) { return c.state === 'no'; }).map(function (c) { return c.label; });
      v.appendChild(document.createTextNode('Dalam ' + p.horizon + ' tahun, rencana ke ' + target + ' belum memenuhi: ' + blocking.join('; ') + '.'));
    }
  }

  function renderChecklist(r) {
    const ul = $('checklist');
    clear(ul);
    r.checks.forEach(function (c) {
      ul.appendChild(h('li', { class: 'checklist__item is-' + c.state },
        chip(c.state),
        h('div', { class: 'checklist__body' },
          h('span', { class: 'checklist__label', text: c.label }),
          h('span', { class: 'checklist__detail', text: c.detail }))));
    });
    $('syarat-meta').textContent = R.ranks[r.plan.profile.rank].name + ' → ' + R.ranks[r.plan.profile.target].name + (r.plan.profile.kind === 'loncat' ? ', dua jenjang' : '') + '. Dinilai pada akhir ' + r.evalYear + '.';
    $('sk-desc').textContent = R.syaratKhusus[r.key] || '';
  }

  function renderVisibility(r) {
    const p = r.plan.profile;
    show($('wrap-golongan'), p.status === 'PNS');
    const doc = p.doktor === 'rencana' || p.doktor === 'punya_belum';
    show($('wrap-doktor-tahun'), doc);
    show($('wrap-ijazah-baru'), doc);
    show($('wrap-ijazah-klaim'), doc);
    $('doktor-note').textContent = r.eduAK > 0
      ? 'Tambahan ' + fmt(r.eduAK) + ' AK dari ijazah doktor masuk pada ' + r.eduYear + ' (' + fmt(p.akIjazahBaru) + ' − ' + fmt(p.akIjazahKlaim) + '). Nilai ini tidak diatur dalam juknis 39/M/KEP/2026; pastikan dengan tim PAK.'
      : 'Tidak ada tambahan AK ijazah dalam proyeksi.';
    const isP = p.target === 'P', loncat = p.kind === 'loncat';
    show($('panel-extra'), isP || loncat);
    show($('wrap-tetap'), isP);
    show($('wrap-serdos'), isP);
    show($('wrap-tambahan'), isP);
    show($('wrap-plb'), loncat);
    show($('wrap-bkd-sejak'), !p.bkdSamaPT);
    $('masa-note').textContent = isP
      ? 'Target Profesor mensyaratkan 10 tahun sebagai dosen tetap. Isi tanggal mulai dosen tetap di bagian Syarat tambahan jalur ini.'
      : 'Masa kerja dosen tetap tidak disyaratkan untuk jalur ini; yang dihitung adalah masa dalam jabatan sejak TMT dan BKD 4 semester. Isian masa kerja muncul bila target Profesor.';
    const path = r.path;
    $('f-target-hint').textContent = 'Minimal ' + Math.round(path.researchPct * 100) + '% AK penelitian, paling singkat ' + path.minYearsInRank + ' tahun dalam jabatan.';
    const bar = $('sample-bar');
    bar.classList.toggle('is-own', !state.isSample);
    $('sample-text').textContent = state.isSample
      ? 'Halaman ini terbuka dengan data contoh: seorang Lektor 200 AK menuju Lektor Kepala. Ganti isian dengan data Anda sendiri.'
      : 'Anda memakai data sendiri. Perubahan tersimpan otomatis di peramban ini.';
  }

  function renderWorks(r) {
    const body = $('works-body');
    clear(body);
    const detail = {};
    r.years.forEach(function (y) { y.detail.forEach(function (d) { detail[d.uid] = d; }); });
    const used = r.sk.used.map(function (w) { return w.uid; });
    const works = r.plan.works.slice().sort(function (a, b) { return a.year - b.year || E.workAK(b).ak - E.workAK(a).ak; });
    show($('works-empty'), works.length === 0);
    show($('works-table'), works.length > 0);
    works.forEach(function (w) {
      const c = E.catalogById[w.type];
      const v = E.workAK(w);
      const d = detail[w.uid];
      const sub = [c.label];
      if (w.type === 'jint') sub.push(w.quartile + (w.sjr ? ', SJR ' + fmt(w.sjr) : '') + (w.ifv ? ', IF ' + fmt(w.ifv) : ''));
      if (w.type === 'jnas') sub.push('Sinta ' + w.rank);
      const akCell = h('td', { class: 'num', 'data-label': 'AK' }, h('span', { class: 'ak', text: fmt(v.ak) }));
      if (d && d.allowed < d.raw) akCell.appendChild(h('span', { class: 'ak-cut', text: 'diakui ' + fmt(d.allowed) }));
      if (!d) akCell.appendChild(h('span', { class: 'ak-cut', text: 'di luar proyeksi' }));
      const ex = E.skExclusions(w);
      let skCell;
      if (used.indexOf(w.uid) >= 0) skCell = h('td', { 'data-label': 'Syarat khusus' }, h('span', { class: 'chip chip--ok', text: 'Dipakai' }));
      else if (ex.length) skCell = h('td', { class: 'muted', 'data-label': 'Syarat khusus', text: 'Tidak bisa: ' + ex.join(', ') });
      else skCell = h('td', { class: 'muted', 'data-label': 'Syarat khusus', text: '—' });
      body.appendChild(h('tr', { class: w.status === 'rencana' ? 'is-plan' : '' },
        h('td', { class: 'cell-year' }, h('span', { text: String(w.year) }), h('span', { class: 'tag', text: w.status === 'rencana' ? 'rencana' : 'terbit' })),
        h('td', { class: 'cell-title' }, h('span', { class: 'work-title', text: w.title }), h('span', { class: 'work-sub', text: sub.join(' · ') })),
        h('td', { 'data-label': 'Peran' }, h('span', { text: R.roles[w.role] }), h('span', { class: 'work-sub', text: w.authors + ' penulis · ' + v.shareLabel })),
        akCell,
        skCell,
        h('td', { class: 'actions' },
          h('button', { type: 'button', class: 'link-btn', text: 'Ubah', 'aria-label': 'Ubah ' + w.title, onclick: function () { editWork(w.uid); } }),
          h('button', { type: 'button', class: 'link-btn', text: 'Hapus', 'aria-label': 'Hapus ' + w.title, onclick: function () { deleteWork(w.uid); } }))
      ));
    });
  }

  function renderYears(r) {
    const body = $('years-body');
    clear(body);
    const targetAK = r.plan.profile.targetAK;
    r.years.forEach(function (y) {
      const ready = r.readyYear === y.year;
      const short = Math.max(0, targetAK - y.cumulative);
      body.appendChild(h('tr', { class: ready ? 'is-ready' : '' },
        h('th', { scope: 'row' }, String(y.year), ready ? h('span', { class: 'tag tag--ink', text: 'siap' }) : null),
        h('td', { class: 'num', text: String(y.months) }),
        h('td', { text: R.predikat[y.predikat].label }),
        h('td', { class: 'num', text: fmt(y.konversi) }),
        h('td', { class: 'num', text: fmt(y.capPrestasi) }),
        h('td', { class: 'num', text: fmt(y.prestasiRaw) }),
        h('td', { class: 'num', text: fmt(y.prestasiCounted) }),
        h('td', { class: 'num' + (y.prestasiRaw - y.prestasiCounted > 0 ? ' is-loss' : ''), text: fmt(Math.max(0, y.prestasiRaw - y.prestasiCounted)) }),
        h('td', { class: 'num', text: y.pendidikan ? fmt(y.pendidikan) : '—' }),
        h('td', { class: 'num strong', text: fmt(y.cumulative) }),
        h('td', { class: 'num' + (short > 0 ? ' is-short' : ' is-met'), text: short > 0 ? fmt(short) : '0' }),
        h('td', { class: 'num', text: fmt(y.cumulativeResearch) })
      ));
    });
    const ul = $('warnings');
    clear(ul);
    r.warnings.forEach(function (w) {
      const text = w.kind === 'plafon'
        ? fmt(w.amount) + ' AK penelitian pada ' + w.year + ' tidak diakui karena melewati plafon ' + fmt(w.cap) + ' AK. Geser sebagian karya ke tahun berikutnya.'
        : '“' + w.title + '” (' + w.year + '): ' + w.notes.join('; ') + '.';
      ul.appendChild(h('li', { text: text }));
    });
  }

  function renderChart(r, fixedWidth) {
    const svg = $('chart');
    Array.from(svg.childNodes).forEach(function (n) { if (n.nodeName !== 'title' && n.nodeName !== 'desc') svg.removeChild(n); });
    const W = fixedWidth || Math.max(320, Math.round(svg.parentNode.clientWidth || 720));
    const H = 300;
    const m = { t: 28, r: 16, b: 34, l: 48 };
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);

    const p = r.plan.profile;
    const base = Math.floor(p.akSK / 50) * 50;
    const maxV = Math.max(p.targetAK, r.years[r.years.length - 1].cumulative);
    const top = Math.ceil((maxV * 1.06) / 50) * 50;
    const y = function (v) { return m.t + (H - m.t - m.b) * (1 - (v - base) / (top - base)); };
    const n = r.years.length;
    const band = (W - m.l - m.r) / n;
    const bw = Math.min(56, band * 0.62);

    const defs = s('defs');
    const pat = s('pattern', { id: 'hatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
    pat.appendChild(s('rect', { width: 6, height: 6, class: 'c-hatch-bg' }));
    pat.appendChild(s('line', { x1: 0, y1: 0, x2: 0, y2: 6, class: 'c-hatch-line' }));
    defs.appendChild(pat);
    svg.appendChild(defs);

    const step = (top - base) / 5 >= 50 ? Math.ceil((top - base) / 5 / 50) * 50 : 25;
    for (let v = base; v <= top; v += step) {
      svg.appendChild(s('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: 'c-grid' }));
      const t = s('text', { x: m.l - 8, y: y(v) + 4, class: 'c-tick', 'text-anchor': 'end' });
      t.textContent = String(v);
      svg.appendChild(t);
    }

    let konv = 0, res = 0, edu = 0;
    r.years.forEach(function (yr, i) {
      konv += yr.konversi; res += yr.prestasiCounted; edu += yr.pendidikan;
      const x = m.l + band * i + (band - bw) / 2;
      const y0 = y(p.akSK), y1 = y(p.akSK + konv), y2 = y(p.akSK + konv + res), y3 = y(p.akSK + konv + res + edu);
      svg.appendChild(s('rect', { x: x, y: y(base), width: bw, height: Math.max(0, y(base) - y0), class: 'c-base' }));
      svg.appendChild(s('rect', { x: x, y: y1, width: bw, height: Math.max(0, y0 - y1), class: 'c-konv' }));
      svg.appendChild(s('rect', { x: x, y: y2, width: bw, height: Math.max(0, y1 - y2), class: 'c-res', fill: 'url(#hatch)' }));
      if (edu > 0) svg.appendChild(s('rect', { x: x + 0.5, y: y3, width: bw - 1, height: Math.max(0, y2 - y3), class: 'c-edu' }));
      const lbl = s('text', { x: x + bw / 2, y: H - m.b + 18, class: 'c-tick' + (r.readyYear === yr.year ? ' c-tick--strong' : ''), 'text-anchor': 'middle' });
      lbl.textContent = String(yr.year);
      svg.appendChild(lbl);
      if (band >= 56 || r.readyYear === yr.year || i === n - 1) {
        const val = s('text', { x: x + bw / 2, y: y3 - 6, class: 'c-val', 'text-anchor': 'middle' });
        val.textContent = fmt(yr.cumulative);
        svg.appendChild(val);
      }
    });

    const ty = y(p.targetAK);
    svg.appendChild(s('line', { x1: m.l, x2: W - m.r, y1: ty, y2: ty, class: 'c-target' }));
    const tt = s('text', { x: m.l + 6, y: ty - 6, class: 'c-label', 'text-anchor': 'start' });
    tt.textContent = 'TARGET ' + p.targetAK;
    svg.appendChild(tt);

    $('chart-desc').textContent = 'AK kumulatif akhir tahun dari ' + r.years[0].year + ' sampai ' + r.years[n - 1].year +
      ': ' + r.years.map(function (yr) { return yr.year + ' ' + fmt(yr.cumulative); }).join(', ') + '. Target ' + p.targetAK + ' AK.';
  }

  function render() {
    const r = E.project(state.plan, { y: new Date().getFullYear() });
    state.result = r;
    renderSkpGrid(r);
    renderLadder(r);
    renderSummary(r);
    renderChecklist(r);
    renderVisibility(r);
    renderWorks(r);
    renderYears(r);
    if (!$('tp-simulasi').hidden) renderChart(r);
    renderPrintHead(r);
    store();
  }

  /* ---------- impor / ekspor ---------- */

  function planJSON() { return JSON.stringify(state.plan, null, 2); }

  function loadPlan(obj, msg) {
    state.plan = E.sanitizePlan(obj);
    state.isSample = false;
    syncFormFromPlan();
    resetWorkForm();
    render();
    setMsg(msg);
  }

  function importText(text) {
    try {
      const obj = JSON.parse(text);
      if (!obj || typeof obj !== 'object' || !obj.profile) throw new Error('format');
      loadPlan(obj, 'Data rencana dimuat.');
      $('data-msg').textContent = 'Data rencana dimuat.';
    } catch (e) {
      $('data-msg').textContent = 'Data tidak bisa dibaca. Pastikan isinya hasil "Salin data rencana" dari aplikasi ini.';
    }
  }

  function bind() {
    ['f-status', 'f-golongan', 'f-rank', 'f-target', 'f-horizon', 'f-doktor', 'f-serdos', 'f-plb', 'f-tmt', 'f-tetap', 'f-bkd-sama', 'f-bkd-sejak']
      .forEach(function (id) { $(id).addEventListener('change', onProfileChange); });
    ['f-aksk', 'f-doktor-tahun', 'f-ijazah-baru', 'f-ijazah-klaim']
      .forEach(function (id) { $(id).addEventListener('input', onProfileChange); });
    R.syaratTambahanProfesor.forEach(function (st) { $('st-' + st.id).addEventListener('change', onProfileChange); });

    ['w-type', 'w-role', 'w-authors', 'w-quartile', 'w-sjr', 'w-if', 'w-rank', 'w-first']
      .forEach(function (id) { $(id).addEventListener('input', updateWorkForm); });
    $('work-form').addEventListener('submit', submitWork);
    $('w-cancel').addEventListener('click', resetWorkForm);

    $('btn-clear').addEventListener('click', function () { loadPlan(E.emptyPlan(), ''); startTour(); });
    $('btn-tour').addEventListener('click', function () { startTour(); });
    $('btn-sample').addEventListener('click', function () {
      loadPlan(window.AKSample(), 'Data contoh dimuat.');
      state.isSample = true;
      render();
    });

    $('btn-copy').addEventListener('click', function () {
      const text = planJSON();
      const fallback = function () {
        const ta = $('f-import-text');
        ta.value = text; ta.focus(); ta.select();
        $('data-msg').textContent = 'Penyalinan otomatis tidak tersedia. Data sudah dipilih di kotak di bawah; tekan Ctrl+C atau ⌘+C.';
      };
      try {
        navigator.clipboard.writeText(text).then(function () { $('data-msg').textContent = 'Data rencana disalin. Tempel di perangkat lain lewat kotak "Tempel data rencana".'; }, fallback);
      } catch (e) { fallback(); }
    });
    $('btn-import').addEventListener('click', function () { importText($('f-import-text').value); });
    $('f-import-file').addEventListener('change', function (ev) {
      const f = ev.target.files && ev.target.files[0];
      if (!f) return;
      if (f.size > 1024 * 1024) { $('data-msg').textContent = 'Berkas terlalu besar. Data rencana biasanya di bawah 100 KB.'; return; }
      const reader = new FileReader();
      reader.onload = function () { importText(String(reader.result)); };
      reader.readAsText(f);
      ev.target.value = '';
    });

    $('btn-print').addEventListener('click', function () {
      if (framed) {
        $('print-msg').textContent = 'Pratinjau ini tidak mengizinkan dialog cetak. Buka aplikasi di situsnya sendiri (misalnya setelah dipasang di GitHub Pages) untuk menyimpan PDF.';
        return;
      }
      $('print-msg').textContent = '';
      if (state.result) { renderChart(state.result, 720); renderPrintHead(state.result); }
      window.print();
    });
    window.addEventListener('afterprint', function () { if (state.result && !$('tp-simulasi').hidden) renderChart(state.result); });
    if (framed) show($('btn-download'), false);
    $('btn-download').addEventListener('click', function () {
      const blob = new Blob([planJSON()], { type: 'application/json' });
      const a = h('a', { href: URL.createObjectURL(blob), download: 'rencana-jabatan-akademik.json' });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });

    $('ref-search').addEventListener('input', function () {
      const q = this.value.trim().toLowerCase();
      let visible = 0;
      Array.from(document.querySelectorAll('#refs .ref')).forEach(function (d) {
        const hit = !q || (d.getAttribute('data-keywords') + ' ' + d.textContent).toLowerCase().indexOf(q) >= 0;
        d.hidden = !hit;
        if (hit) visible++;
        if (q && hit) d.open = true;
      });
      show($('ref-empty'), visible === 0);
    });

    let rt = null;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { if (state.result) renderChart(state.result); }, 120);
    });
  }

  fillStatic();
  syncFormFromPlan();
  initHelp();
  bind();
  bindTabs();
  resetWorkForm();
  render();
})();

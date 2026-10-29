/* Tema terang/gelap. Dimuat di <head> agar tidak berkedip saat halaman dibuka.
   Pilihan pengguna disimpan di peramban; bila belum ada, mengikuti pengaturan sistem. */
(function () {
  'use strict';
  var KEY = 'simulasi-ak:tema';
  var saved = null;
  try { saved = window.localStorage.getItem(KEY); } catch (e) { /* abaikan */ }
  var dark = saved ? saved === 'dark' : !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  window.AKTheme = {
    get: function () { return document.documentElement.getAttribute('data-theme'); },
    set: function (t) {
      document.documentElement.setAttribute('data-theme', t);
      try { window.localStorage.setItem(KEY, t); } catch (e) { /* abaikan */ }
    }
  };
})();

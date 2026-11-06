/* Angelina Strelow — Anfrage-Fenster (Robert 05.11.2026). Der Knopf «Abend anfragen» in der Kopfleiste öffnet das Formular in einem
   Fenster über der Seite, statt ans Seitenende zu schieben. Schliesst per X, Esc und Klick daneben, die Seite dahinter steht still,
   der Fokus bleibt im Fenster. Ohne Skript bleibt der Knopf ein Link zum Abschnitt «Anfrage». */
(function () {
  'use strict';
  var doc = document, html = doc.documentElement, f = doc.getElementById('anfrage-fenster');
  if (!f) return;
  var karte = f.querySelector('.afe__karte'), rahmen = f.querySelector('.afe__rahmen'), lt = doc.querySelector('.lt'), ausloeser = null, uhr = 0, unten = null;

  function auf(von) {
    if (f.classList.contains('auf')) return;
    clearTimeout(uhr); ausloeser = von || null;
    var sb = innerWidth - html.clientWidth;                // Breite der Bildlaufleiste ausgleichen, damit hinten nichts springt
    if (sb > 0) { doc.body.style.paddingRight = sb + 'px'; if (lt) lt.style.paddingRight = 'calc(var(--rand) + ' + sb + 'px)'; }
    html.classList.add('afe-offen');
    f.hidden = false; rahmen.scrollTop = 0;
    void karte.offsetWidth;
    f.classList.remove('geht'); f.classList.add('auf');
    karte.focus({ preventScroll: true });
  }
  function zu() {
    if (f.hidden || !f.classList.contains('auf')) return;
    f.classList.remove('auf'); f.classList.add('geht');
    uhr = setTimeout(function () {
      f.hidden = true; f.classList.remove('geht');
      html.classList.remove('afe-offen'); doc.body.style.paddingRight = ''; if (lt) lt.style.paddingRight = '';
    }, 560);
    if (ausloeser) ausloeser.focus({ preventScroll: true });
  }

  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-anfrage]');
    if (a) { e.preventDefault(); auf(a); }
  });
  /* Klick daneben: nur wenn Drücken und Loslassen beide neben der Karte liegen (Text markieren im Feld schliesst nicht) */
  f.addEventListener('pointerdown', function (e) { unten = e.target; });
  f.addEventListener('click', function (e) {
    var z = e.target.closest('[data-zu]');
    if (z && (z.tagName === 'BUTTON' || (e.target === z && unten === z))) zu();
  });
  doc.addEventListener('keydown', function (e) {
    if (f.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); zu(); return; }
    if (e.key !== 'Tab') return;
    var feld = [].filter.call(karte.querySelectorAll('button,input,textarea,select,a[href],[tabindex]:not([tabindex="-1"])'), function (el) {
      return !el.disabled && el.tabIndex >= 0 && (el.offsetWidth || el.offsetHeight);
    });
    if (!feld.length) return;
    var erst = feld[0], letzt = feld[feld.length - 1], a = doc.activeElement;
    if (a && a.closest && a.closest('.cw-pop')) return;               // Kalender- oder Listenkarte offen: die führt selbst
    if (e.shiftKey && (a === erst || a === karte)) { e.preventDefault(); letzt.focus(); }
    else if (!e.shiftKey && (a === letzt || !karte.contains(a))) { e.preventDefault(); erst.focus(); }
  });
})();

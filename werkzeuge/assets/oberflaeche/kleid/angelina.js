/* kleid/angelina.js · Hauswerte für oberflaeche.js (Angelina Strelow, Exklusive Gastgeberin, Köln; 05.11.2026).
   Im <head> VOR allen Stilen laden (ohne defer). Rahmen «Die Bühne»: Kopf dunkel wie ihr Smoking, Raum hell wie Papier und Creme ihrer Kacheln.
   Liegt unter _werkzeuge/oberflaeche/ und wird vom gemeinsamen Server (_werkzeuge/serve.py) unter /assets/oberflaeche/ ausgeliefert.
   Fotos und Schriften aus _werkzeuge/_haus/ (/angelina-strelow/werkzeuge/assets/bild/<schlüssel>-<640|1000>.webp, /assets/schrift/, /assets/zeichen/). */
window.WO_HAUS = { kurz: 'angelina', name: 'Angelina Strelow', voll: 'Angelina Strelow · Exklusive Gastgeberin', ort: 'Köln und Umgebung', welt: 'gastgeberin', rahmen: 'buehne', anrede: 'du',
  /* Foto des Startbilds: Angelina zwischen Tafel und Fenster (stärkstes Bild laut CHARAKTER.md 5) */
  foto: '/angelina-strelow/werkzeuge/assets/bild/raum-1000.webp', fotoKlein: '/angelina-strelow/werkzeuge/assets/bild/raum-640.webp', fotoFarbe: '#3b2f2b', fotoAlt: 'Angelina Strelow zwischen Tafel und Fenster',
  /* Zeichen im Ring: ihr Siegel mit Monogramm (marke/zeichen/siegel-sand.svg, unverändert) */
  zeichen: '/angelina-strelow/werkzeuge/assets/oberflaeche/kleid/angelina-zeichen.svg', zeichenMass: 0.723, wortmarke: '/angelina-strelow/werkzeuge/assets/zeichen/wortmarke-night.svg',
  /* Die vier Werkzeuge, in der Reihenfolge eines Abends. Namen nach dem Zweck, die EINE Stelle (Arbeitsnamen bis Robert wählt). */
  reihe: ['anfragen', 'abendplan', 'tisch', 'nachher'],
  namen: { anfragen: 'Anfragen & Angebote', abendplan: 'Der Abendplan', tisch: 'Tischkarten & Menü', nachher: 'Nach dem Abend' },
  saetze: { anfragen: 'Jede Anfrage an einem Ort, daraus in Minuten ein Angebot in deiner Handschrift.',
    abendplan: 'Der ganze Abend auf einem Blatt: Zeiten, Gäste, Küche, Wein, abgestimmt mit dem Gastgeber.',
    tisch: 'Menükarte, Tischkarten und Sitzordnung im Stil des Abends, fertig zum Drucken.',
    nachher: 'Dank, Erinnerung und Stimme: was vom Abend bleibt und wer davon erfährt.' },
  wege: { anfragen: '/angelina-strelow/werkzeuge/anfragen/', abendplan: '/angelina-strelow/werkzeuge/abendplan/', tisch: '/angelina-strelow/werkzeuge/tisch/', nachher: '/angelina-strelow/werkzeuge/nachher/' },
  /* Prüfserver je Werkzeug (gemeinsamer Auftrag 05.11.2026); Wege zwischen Werkzeugen immer 127.0.0.1, nie localhost (Fehlerbuch 10a) */
  ports: { muster: 8850, anfragen: 8851, abendplan: 8852, tisch: 8853, nachher: 8854 } };
/* Lokal zeigen die Wege zu den ANDEREN Werkzeugen auf deren eigenen Server unter 127.0.0.1, nie auf den eigenen Port (Fehlerbuch 10a). */
(function () {
  if (!/^(127\.0\.0\.1|localhost)$/.test(location.hostname)) return;
  Object.keys(WO_HAUS.wege).forEach(function (k) {
    var p = WO_HAUS.ports[k], w = WO_HAUS.wege[k];
    if (p && String(p) !== location.port && w.charAt(0) === '/') WO_HAUS.wege[k] = 'http://127.0.0.1:' + p + w;
  });
  WO_HAUS.wegeLokal = true;
})();
document.documentElement.setAttribute('data-wo-haus', WO_HAUS.kurz);
document.documentElement.setAttribute('data-wo-rahmen', WO_HAUS.rahmen);
try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
/* Bewegung der Werkzeuge (29.10.2026): bewegung.js neben oberflaeche.js, async und mit wenig Vorrang nachgeladen, damit es nie vor dem ersten Knopf steht */
(function () {
  var me = document.currentScript, s = document.createElement('script');
  s.src = (me && me.src ? new URL('../bewegung.js', me.src).href : '/angelina-strelow/werkzeuge/assets/oberflaeche/bewegung.js') + '?v=3';   /* Fassung hochzählen, wenn bewegung.js sich ändert */
  s.async = true; s.setAttribute('fetchpriority', 'low'); document.head.appendChild(s);
})();
/* Titel fliegen zeilenweise hoch (Kriterium 37, 30.10.2026). WO_ZEILEN(el) setzt jedes Wort eines Titels in <span class="wo-w"> und schreibt die Zeile als --z daran;
   die Wörter einer Zeile steigen zusammen, Zeile für Zeile gestaffelt. Ändert sich dabei der Umbruch (Silbentrennung, sehr lange Wörter), bleibt der Titel unberührt.
   Hier im Kleid (ohne defer), damit der Titel des Startbilds schon vor dem ersten Bild geteilt ist; bewegung.js nutzt dieselbe Funktion für die Zwischentitel. */
window.WO_ZEILEN = function (el) {
  if (!el || el.hasAttribute('data-wo-zl')) return !!(el && el.classList.contains('wo-zl'));
  var h0 = el.offsetHeight; if (!h0) return false;   /* verborgen: später, wenn er zu sehen ist */
  el.setAttribute('data-wo-zl', '');
  var w0 = Math.max(el.scrollWidth, el.clientWidth), roh = el.innerHTML, tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), t, ts = [];
  while ((t = tw.nextNode())) if (/\S/.test(t.data) && !t.parentNode.closest('svg')) ts.push(t);
  if (!ts.length) return false;
  ts.forEach(function (t) {
    var f = document.createDocumentFragment();
    t.data.split(/(\s+)/).forEach(function (s) {
      if (!s) return;
      if (/^\s+$/.test(s)) { f.appendChild(document.createTextNode(s)); return; }
      var w = document.createElement('span'); w.className = 'wo-w'; w.textContent = s; f.appendChild(w);
    });
    t.parentNode.replaceChild(f, t);
  });
  if (el.offsetHeight !== h0 || el.scrollWidth > w0 + 1) { el.innerHTML = roh; return false; }
  var z = -1, oben = -1e9, halb = parseFloat(getComputedStyle(el).fontSize) * 0.5;
  el.querySelectorAll('.wo-w').forEach(function (w) { var y = w.getBoundingClientRect().top; if (y > oben + halb) { z++; oben = y; } if (z) w.style.setProperty('--z', z); });
  el.classList.add('wo-zl');
  return true;
};
/* Der Titel des Startbilds: geteilt, sobald er im Dokument steht (vor dem ersten Bild, der Auftritt beginnt erst nach 0,18 s) */
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('MutationObserver' in window)) return;
  var plan = 0;
  function teile() {
    plan = 0;
    document.querySelectorAll('.wo-sb__h:not([data-wo-zl])').forEach(function (h) {
      if (document.documentElement.classList.contains('still')) return;
      var a = h.getAnimations ? h.getAnimations() : [];
      if (a.some(function (x) { return (x.currentTime || 0) > 120; })) { h.setAttribute('data-wo-zl', ''); return; }   /* läuft schon: bleibt ein Block, nie zurückspringen */
      WO_ZEILEN(h);
    });
  }
  new MutationObserver(function () { if (!plan && document.querySelector('.wo-sb__h:not([data-wo-zl])')) { plan = 1; Promise.resolve().then(teile); } })
    .observe(document.documentElement, { childList: true, subtree: true });
})();

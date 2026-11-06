/* Mini-Werkbank Angelina Strelow · 06.11.2026
   Erster Blick komplett, Hereinkommen, Seiten zum Durchblättern (Rechner und Handy an derselben Stelle),
   Ansichten der Werkzeuge und ihre Knöpfe, Kacheln der Beigaben (zeigen «Entsteht gerade», solange ihre Seite fehlt). */
(function () {
  var d = document.documentElement, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Erster Blick: erst zeigen, wenn alle Bilder im ersten Bild und die Schrift da sind (nur load, nie decode)
  var gezeigt = false;
  function los() { if (gezeigt) return; gezeigt = true; d.classList.remove('wartet'); requestAnimationFrame(function () { requestAnimationFrame(function () { d.classList.add('auf'); }); }); }
  // Ein Bild, das ausbleibt, holt WB_NOCHMAL (Kopf der Seite) neu; gewartet wird, bis es da ist oder alle Versuche vorbei sind
  var warten = $$('img[data-erst]').map(function (i) {
    if (i.complete && i.naturalWidth) return Promise.resolve();
    return new Promise(function (r) {
      i.addEventListener('load', function () { if (i.naturalWidth) r(); });
      i.addEventListener('error', function () { if (+(i.getAttribute('data-versuch') || 0) >= 4) r(); });
      if (i.complete && +(i.getAttribute('data-versuch') || 0) >= 4) r();
    });
  });
  if (document.fonts && document.fonts.ready) warten.push(document.fonts.ready);
  Promise.all(warten).then(los); setTimeout(los, 20000);   // nur, falls gar nichts mehr kommt

  // Hereinkommen von unten
  var ziele = $$('[data-a]');
  if (ruhig || !('IntersectionObserver' in window)) ziele.forEach(function (z) { z.classList.add('da'); });
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting) return; io.unobserve(e.target); e.target.classList.add('da'); }); }, { rootMargin: '0px 0px -8% 0px' });
    ziele.forEach(function (z) { io.observe(z); });
  }

  // Website: scharfe Aufnahmen der Seiten mit nativem Scroll; Rechner und Handy bleiben an derselben Stelle
  var ws = document.querySelector('.ws');
  if (ws) {
    var R = ws.querySelector('.ws__fs'), H = ws.querySelector('.ws__hdy .hdy__s'), name = ws.querySelector('.ws__name');
    var reiter = $$('.ws-r', ws), jetzt = 0, still = null;
    function hole(j) { // Bilder der Seite vorab laden und entpacken, damit beim Scrollen nichts nachgerechnet wird
      $$('.ws-bl[data-j="' + j + '"] img', ws).forEach(function (i) { i.loading = 'eager'; if (i.decode) i.decode().catch(function () {}); });
    }
    function zeig(j) {
      jetzt = j; still = null; hole(j);
      reiter.forEach(function (b) { var an = +b.dataset.j === j; b.classList.toggle('an', an); b.setAttribute('aria-pressed', an); });
      $$('.ws-bl, .ws-satz', ws).forEach(function (el) { el.classList.toggle('an', +el.dataset.j === j); });
      if (name) name.textContent = reiter[j].textContent;
      R.scrollTop = 0; H.scrollTop = 0;
    }
    reiter.forEach(function (b) { b.addEventListener('click', function () { zeig(+b.dataset.j); }); b.addEventListener('pointerenter', function () { hole(+b.dataset.j); }); });
    function stellen() { try { return JSON.parse(R.querySelector('.ws-bl.an').dataset.st); } catch (e) { return {}; } }
    function breite(box) { var i = box.querySelector('.ws-bl.an img'); return i ? +i.getAttribute('width') : 0; }
    function um(y, von, nach, hv, hn) {
      var a = von.concat([hv]), b = nach.concat([hn]), i = 0;
      while (i < a.length - 2 && y >= a[i + 1]) i++;
      var f = (y - a[i]) / Math.max(1, a[i + 1] - a[i]);
      return b[i] + Math.max(0, Math.min(1, f)) * (b[i + 1] - b[i]);
    }
    function lauf(quelle, ziel, art) {
      if (still && still.el === quelle && performance.now() < still.bis) return; // Echo der eigenen Bewegung
      if (!R.offsetParent) return; // am Handy nur das Handy
      var st = stellen(); if (!st.rh) return;
      var bq = breite(quelle), bz = breite(ziel); if (!bq || !bz) return;
      var y = quelle.scrollTop * bq / quelle.clientWidth;
      var t = art === 'r' ? um(y, st.r, st.h, st.rh, st.hh) : um(y, st.h, st.r, st.hh, st.rh);
      still = { el: ziel, bis: performance.now() + 160 }; ziel.scrollTop = t * ziel.clientWidth / bz;
    }
    [[R, H, 'r'], [H, R, 'h']].forEach(function (x) {
      var uhr = 0;
      x[0].addEventListener('scroll', function () { if (uhr) return; uhr = requestAnimationFrame(function () { uhr = 0; lauf(x[0], x[1], x[2]); }); }, { passive: true });
    });
    // die erste Seite vorab holen, sobald der Abschnitt näher kommt (der Auftakt bleibt frei)
    if ('IntersectionObserver' in window) { var wio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { wio.disconnect(); hole(0); } }, { rootMargin: '900px 0px' }); wio.observe(ws); }
    else hole(0);
  }

  // Werkzeuge: ein Laptop, Reiter je Werkzeug, darunter die Ansichten
  var wb = document.querySelector('.wzb');
  if (wb) {
    var w = 0, j = 0;
    function zeigW(nw, nj) {
      var anz = $$('.wz-sc[data-w="' + nw + '"]', wb).length;
      w = nw; j = (nj + anz) % anz;
      $$('.wz-sc', wb).forEach(function (s) { s.classList.toggle('an', +s.dataset.w === w && +s.dataset.j === j); });
      $$('.wzb-r', wb).forEach(function (b) { var an = +b.dataset.w === w; b.classList.toggle('an', an); b.setAttribute('aria-pressed', an); });
      $$('.wzb-t, .wzb-wahl', wb).forEach(function (el) { el.classList.toggle('an', +el.dataset.w === w); });
      $$('.wzb-wahl[data-w="' + w + '"] .wz-m', wb).forEach(function (b) { var an = +b.dataset.j === j; b.classList.toggle('an', an); b.setAttribute('aria-pressed', an); });
    }
    $$('.wzb-r', wb).forEach(function (b) { b.addEventListener('click', function () { zeigW(+b.dataset.w, 0); }); });
    $$('.wzb-wahl', wb).forEach(function (g) {
      $$('.wz-m', g).forEach(function (b) { b.addEventListener('click', function () { zeigW(w, +b.dataset.j); }); });
      $$('.wz-p', g).forEach(function (b) { b.addEventListener('click', function () { zeigW(w, j + +b.dataset.d); }); });
    });
  }

  // Werkzeug-Knöpfe: lokal das laufende Werkzeug auf seinem Server, online dasselbe Werkzeug daneben (../werkzeuge/, gespeichert nur im Browser)
  var lokal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) && !/[?&]online/.test(location.search);
  $$('.wzb-kn').forEach(function (a) { if (lokal) a.href = a.dataset.lokal; });
  var demo = document.querySelector('.wzb-demo');
  if (demo && !lokal) {   // «Beispiel zurücksetzen»: verwirft, was in diesem Browser ausprobiert wurde (localStorage und Bilder der Werkzeuge)
    demo.hidden = false;
    var k = demo.querySelector('.wzb-zurueck'), uhr = 0;
    k.addEventListener('click', function () {
      if (!k.dataset.frage) { k.dataset.frage = '1'; k.textContent = 'Wirklich? Noch einmal tippen'; uhr = setTimeout(function () { delete k.dataset.frage; k.textContent = 'Beispiel zurücksetzen'; }, 4000); return; }
      clearTimeout(uhr);
      try { var weg = []; for (var i = 0; i < localStorage.length; i++) { var x = localStorage.key(i); if (x && x.indexOf('angelina-demo:') === 0) weg.push(x); } weg.forEach(function (x) { localStorage.removeItem(x); }); } catch (e) { /* privates Fenster */ }
      try { indexedDB.deleteDatabase('angelina-demo'); } catch (e) { /* ohne IndexedDB */ }
      delete k.dataset.frage; k.disabled = true; k.textContent = 'Zurückgesetzt, die Beispiele stehen wieder wie am Anfang';
    });
  }

  // Nach dem Laden: verborgene Ansichten und Seiten still vorab holen, damit beim Umschalten nichts nachlädt
  addEventListener('load', function () {
    setTimeout(function () { $$('.wz-sc').forEach(function (i) { i.loading = 'eager'; }); }, 1800);
  });

  // Beigaben: fehlt die Seite noch, bleibt die Kachel ruhig stehen
  $$('a.bg').forEach(function (a) {
    function kommt() { a.classList.add('kommt'); a.setAttribute('aria-disabled', 'true'); a.setAttribute('tabindex', '-1'); }
    a.addEventListener('click', function (e) { if (a.classList.contains('kommt')) e.preventDefault(); });
    if (location.protocol === 'file:') return;
    fetch(a.href, { cache: 'no-store' }).then(function (r) { if (!r.ok) kommt(); }).catch(kommt);
  });
})();

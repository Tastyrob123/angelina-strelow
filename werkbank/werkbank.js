/* Mini-Werkbank Angelina Strelow · 06.11.2026
   Erster Blick komplett, Hereinkommen, Seiten zum Durchblättern (Rechner und Handy an derselben Stelle),
   Ansichten der Werkzeuge, Kacheln der Beigaben (zeigen «Entsteht gerade», solange ihre Seite fehlt). */
(function () {
  var d = document.documentElement, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Erster Blick: erst zeigen, wenn alle Bilder im ersten Bild und die Schrift da sind (nur load, nie decode)
  var gezeigt = false;
  function los() { if (gezeigt) return; gezeigt = true; d.classList.remove('wartet'); requestAnimationFrame(function () { requestAnimationFrame(function () { d.classList.add('auf'); }); }); }
  var warten = $$('img[data-erst]').map(function (i) { return i.complete ? Promise.resolve() : new Promise(function (r) { i.addEventListener('load', r); i.addEventListener('error', r); }); });
  if (document.fonts && document.fonts.ready) warten.push(document.fonts.ready);
  Promise.all(warten).then(los); setTimeout(los, 2400);

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

  // Werkzeug-Knöpfe: lokal das laufende Werkzeug, online (dort fehlt der Server) ein Rundgang durch seine Aufnahmen
  var lokal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) && !/[?&]online/.test(location.search);
  var rg = document.getElementById('rundgang');
  $$('.wzb-kn').forEach(function (a) {
    if (lokal) { a.href = a.dataset.lokal; return; }
    a.querySelector('.kw').textContent = 'Rundgang ansehen';
    a.addEventListener('click', function (e) { e.preventDefault(); offen(+a.dataset.w); });
  });
  var rw = 0, rj = 0, vorher = null;
  function rbilder() { return $$('.rg-b[data-w="' + rw + '"]', rg); }
  function rzeig(n) {
    var b = rbilder(); rj = (n + b.length) % b.length;
    $$('.rg-b', rg).forEach(function (i) { i.classList.toggle('an', +i.dataset.w === rw && +i.dataset.j === rj); });
    var i = b[rj];
    rg.querySelector('.rg__ansicht').textContent = i.dataset.ansicht + ' · ' + (rj + 1) + ' von ' + b.length;
    rg.querySelector('.rg__satz').textContent = i.dataset.satz;
  }
  function offen(w) {
    if (!rg) return;
    rw = w; vorher = document.activeElement;
    var n = rg.querySelector('.rg__namen span[data-w="' + w + '"]');
    rg.querySelector('.rg__n').textContent = n.textContent; rg.querySelector('.rg__w').textContent = n.dataset.wann;
    var b = rbilder();
    b.forEach(function (i) { if (!i.getAttribute('src')) i.src = i.dataset.src; });
    var erst = b[0];
    var weiter = function () { d.classList.add('rg-offen'); rg.hidden = false; rzeig(0); requestAnimationFrame(function () { requestAnimationFrame(function () { rg.classList.add('auf'); rg.querySelector('.rg__zu').focus(); }); }); };
    if (erst.complete && erst.naturalWidth) weiter();
    else { var fertig = false, los2 = function () { if (!fertig) { fertig = true; weiter(); } }; erst.addEventListener('load', los2); erst.addEventListener('error', los2); setTimeout(los2, 1500); }
  }
  function zu() { if (!rg || rg.hidden) return; rg.classList.remove('auf'); setTimeout(function () { rg.hidden = true; d.classList.remove('rg-offen'); if (vorher) vorher.focus(); }, 420); }
  if (rg) {
    rg.querySelector('.rg__zu').addEventListener('click', zu);
    $$('.rg__p', rg).forEach(function (b) { b.addEventListener('click', function () { rzeig(rj + +b.dataset.d); }); });
    addEventListener('keydown', function (e) { if (rg.hidden) return; if (e.key === 'Escape') zu(); else if (e.key === 'ArrowRight') rzeig(rj + 1); else if (e.key === 'ArrowLeft') rzeig(rj - 1); });
    var x0 = null;
    rg.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    rg.addEventListener('pointerup', function (e) { if (x0 === null) return; var dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 50) rzeig(rj + (dx < 0 ? 1 : -1)); });
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

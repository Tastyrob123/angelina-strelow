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

  // Website: Seiten zum Durchblättern
  var ws = document.querySelector('.ws');
  if (ws) {
    var R = ws.querySelector('.ws__fs'), H = ws.querySelector('.ws__hdy .hdy__s'), name = ws.querySelector('.ws__name');
    var reiter = $$('.ws-r', ws), jetzt = 0, still = null;
    function zeig(j) {
      jetzt = j;
      reiter.forEach(function (b) { var an = +b.dataset.j === j; b.classList.toggle('an', an); b.setAttribute('aria-pressed', an); });
      $$('.ws-bl, .ws-satz', ws).forEach(function (el) { el.classList.toggle('an', +el.dataset.j === j); });
      if (name) name.textContent = reiter[j].textContent;
      R.scrollTop = 0; H.scrollTop = 0;
    }
    reiter.forEach(function (b) { b.addEventListener('click', function () { zeig(+b.dataset.j); }); });
    // Gleichlauf: Abschnitt für Abschnitt umrechnen (Stellen aus den Aufnahmen)
    function stellen() { var bl = R.querySelector('.ws-bl.an'); try { return JSON.parse(bl.dataset.st); } catch (e) { return null; } }
    function bildBreite(box) { var i = box.querySelector('.ws-bl.an img'); return i ? (+i.getAttribute('width') || i.naturalWidth) : 0; }
    function um(y, von, nach, hv, hn) {
      var a = von.concat([hv]), b = nach.concat([hn]), i = 0;
      while (i < a.length - 2 && y >= a[i + 1]) i++;
      var f = (y - a[i]) / Math.max(1, a[i + 1] - a[i]);
      return b[i] + Math.max(0, Math.min(1, f)) * (b[i + 1] - b[i]);
    }
    function lauf(quelle, ziel, art) {
      var st = stellen(); if (!st || !st.rh || still === quelle) { if (still === quelle) still = null; return; }
      var bq = bildBreite(quelle), bz = bildBreite(ziel); if (!bq || !bz) return;
      var kq = bq / quelle.clientWidth, kz = bz / ziel.clientWidth;
      var y = quelle.scrollTop * kq;
      var t = art === 'r' ? um(y, st.r, st.h, st.rh, st.hh) : um(y, st.h, st.r, st.hh, st.rh);
      still = ziel; ziel.scrollTop = t / kz;
    }
    var uhr = 0;
    if (R && H) {
      R.addEventListener('scroll', function () { if (getComputedStyle(R.parentNode).display === 'none') return; cancelAnimationFrame(uhr); uhr = requestAnimationFrame(function () { lauf(R, H, 'r'); }); }, { passive: true });
      H.addEventListener('scroll', function () { if (getComputedStyle(R.parentNode).display === 'none') return; cancelAnimationFrame(uhr); uhr = requestAnimationFrame(function () { lauf(H, R, 'h'); }); }, { passive: true });
    }
  }

  // Werkzeuge: Ansichten umschalten
  $$('.wz').forEach(function (wz) {
    var sc = $$('.wz-sc', wz), kn = $$('.wz-m', wz), j = 0;
    function zeig(n) {
      j = (n + sc.length) % sc.length;
      sc.forEach(function (s, k) { s.classList.toggle('an', k === j); });
      kn.forEach(function (b, k) { b.classList.toggle('an', k === j); b.setAttribute('aria-pressed', k === j); });
    }
    kn.forEach(function (b) { b.addEventListener('click', function () { zeig(+b.dataset.j); }); });
    $$('.wz-p', wz).forEach(function (b) { b.addEventListener('click', function () { zeig(j + +b.dataset.d); }); });
  });

  // Nach dem Laden: verborgene Ansichten und Seiten still vorab holen, damit beim Umschalten nichts nachlädt
  addEventListener('load', function () {
    setTimeout(function () { $$('.ws-bl img, .wz-sc').forEach(function (i) { i.loading = 'eager'; }); }, 1800);
  });

  // Beigaben: fehlt die Seite noch, bleibt die Kachel ruhig stehen
  $$('a.bg').forEach(function (a) {
    function kommt() { a.classList.add('kommt'); a.setAttribute('aria-disabled', 'true'); a.setAttribute('tabindex', '-1'); }
    a.addEventListener('click', function (e) { if (a.classList.contains('kommt')) e.preventDefault(); });
    if (location.protocol === 'file:') return;
    fetch(a.href, { cache: 'no-store' }).then(function (r) { if (!r.ok) kommt(); }).catch(kommt);
  });
})();

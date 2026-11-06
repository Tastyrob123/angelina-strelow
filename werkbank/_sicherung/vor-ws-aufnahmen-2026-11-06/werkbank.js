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

  // Website: im Fenster und im Handy läuft die echte Seite; Rechner und Handy bleiben an derselben Stelle
  var ws = document.querySelector('.ws');
  if (ws) {
    var R = ws.querySelector('.ws__fs .ws-if'), H = ws.querySelector('.ws__hdy .ws-if'), name = ws.querySelector('.ws__name');
    var reiter = $$('.ws-r', ws), jetzt = 0, still = null, geladen = false;
    function mass() { [[R, 1440], [H, 390]].forEach(function (x) { x[0].style.setProperty('--s', x[0].parentNode.clientWidth / x[1]); }); if (geladen) lade(); }
    mass(); if ('ResizeObserver' in window) new ResizeObserver(mass).observe(ws.querySelector('.ws__b')); else addEventListener('resize', mass);
    function stellen() { try { return JSON.parse(reiter[jetzt].dataset.st); } catch (e) { return {}; } }
    function um(y, von, nach, hv, hn) {
      var a = von.concat([hv]), b = nach.concat([hn]), i = 0;
      while (i < a.length - 2 && y >= a[i + 1]) i++;
      var f = (y - a[i]) / Math.max(1, a[i + 1] - a[i]);
      return b[i] + Math.max(0, Math.min(1, f)) * (b[i + 1] - b[i]);
    }
    function lauf(quelle, ziel, art) {
      if (still && still.el === quelle && performance.now() < still.bis) return; // Echo der eigenen Bewegung
      if (getComputedStyle(R.parentNode.parentNode).display === 'none') return; // am Handy nur das Handy
      var st = stellen(); if (!st.rh) return;
      try {
        var y = quelle.contentWindow.scrollY;
        var t = art === 'r' ? um(y, st.r, st.h, st.rh, st.hh) : um(y, st.h, st.r, st.hh, st.rh);
        still = { el: ziel, bis: performance.now() + 220 }; ziel.contentWindow.scrollTo({ top: Math.round(t), behavior: 'instant' });
      } catch (e) {}
    }
    function anfrage(f) { // Anfrage der Seite öffnen, wie ein Gast es tut
      setTimeout(function () { try { var d = f.contentDocument; var k = [].slice.call(d.querySelectorAll('a,button')).filter(function (x) { return /abend anfragen/i.test(x.textContent) && x.offsetParent; })[0]; if (k) k.click(); } catch (e) {} }, 2900);
    }
    [[R, H, 'r'], [H, R, 'h']].forEach(function (x) {
      var uhr = 0;
      x[0].addEventListener('load', function () {
        try { x[0].contentWindow.addEventListener('scroll', function () { cancelAnimationFrame(uhr); uhr = requestAnimationFrame(function () { lauf(x[0], x[1], x[2]); }); }, { passive: true }); } catch (e) {}
        if (reiter[jetzt].dataset.anfrage === '1') anfrage(x[0]);
      });
    });
    function sichtbar(f) { return getComputedStyle(f.parentNode.parentNode).display !== 'none' && getComputedStyle(f.parentNode).display !== 'none'; }
    function lade() { geladen = true; [R, H].forEach(function (f) { if (sichtbar(f)) { if (f.dataset.ist !== reiter[jetzt].dataset.src) { f.dataset.ist = reiter[jetzt].dataset.src; f.src = f.dataset.ist; } } else f.dataset.ist = ''; }); }
    function zeig(j) {
      jetzt = j; still = null; [R, H].forEach(function (f) { f.dataset.ist = ''; });
      reiter.forEach(function (b) { var an = +b.dataset.j === j; b.classList.toggle('an', an); b.setAttribute('aria-pressed', an); });
      $$('.ws-satz', ws).forEach(function (el) { el.classList.toggle('an', +el.dataset.j === j); });
      if (name) name.textContent = reiter[j].textContent;
      lade();
    }
    reiter.forEach(function (b) { b.addEventListener('click', function () { zeig(+b.dataset.j); }); });
    // erst laden, wenn der Abschnitt näher kommt: der Auftakt bleibt frei
    if ('IntersectionObserver' in window) { var wio = new IntersectionObserver(function (es) { if (es[0].isIntersecting && !geladen) { wio.disconnect(); lade(); } }, { rootMargin: '700px 0px' }); wio.observe(ws); }
    else lade();
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

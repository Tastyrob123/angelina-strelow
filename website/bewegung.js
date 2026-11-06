/* Angelina Strelow · Bewegung · nach der Uhr beim Hereinkommen, nie ans Scrollen gekoppelt; nativer Scroll, nur Klassen setzen. */
(function () {
  'use strict';
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };
  var d = document.documentElement;
  var ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Auftakt: zeigen, sobald seine Bilder geladen sind (nur load), dann gemeinsam aufgehen ---------- */
  var at = document.querySelector('.at') || document.querySelector('main');
  $$('.ak__sg, .kap, .ak__t, .ak__s, .al', document.querySelector('.at') ? at : document.createElement('i')).forEach(function (el, k) { el.setAttribute('data-auf', ''); el.style.setProperty('--k', k); });
  $$('.aw img', at).forEach(function (el, k) { el.style.setProperty('--k', k); });
  /* auch sofort geladene Fotos unter dem Kopf, die im ersten Bildschirm stehen (Leistungen, 05.11.2026) */
  var erst = document.querySelector('.at') ? $$('img', at).concat($$('main img[fetchpriority="high"]').filter(function (im) { return !at.contains(im); })) : [], offen = erst.length + 1;
  function los() { d.classList.remove('wartet'); requestAnimationFrame(function () { requestAnimationFrame(function () { at.classList.add('auf'); }); }); }
  /* Schrift gehört zum ersten Blick: beide Schriften geladen, bevor die Seite sichtbar wird (05.11.2026, Impressum zeigte den Titel kurz ohne Schrift) */
  var bereit = function () { if (--offen === 0) los(); };
  (document.fonts && document.fonts.load ? Promise.all([document.fonts.load("1em 'Della Respira'"), document.fonts.load('1em Montserrat')]) : Promise.resolve()).then(bereit, bereit);
  erst.forEach(function (im) {
    if (im.complete) { if (--offen === 0) los(); }
    else { im.addEventListener('load', function () { if (--offen === 0) los(); }); im.addEventListener('error', function () { if (--offen === 0) los(); }); }
  });

  /* ---------- Titel zeilenweise, Texte gestaffelt, Gruppen als Reihe von links ---------- */
  $$('main .t2, .fe__t').forEach(function (t) { t.setAttribute('data-titel', ''); $$('.z', t).forEach(function (z, i) { z.style.setProperty('--k', i); }); });
  $$('[data-t]').forEach(function (t, i) { t.style.setProperty('--k', i % 3); });
  $$('[data-gruppe]').forEach(function (g) { [].slice.call(g.children).forEach(function (c, i) { c.style.setProperty('--k', i); }); });
  $$('.v9t>div').forEach(function (c, i) { c.style.setProperty('--k', i % 6); });

  var ziele = $$('[data-titel], [data-t], [data-gruppe], .ko, .kb__b, .kb__k, .af__f, .mw, .v9b');
  if (ruhig || !('IntersectionObserver' in window)) { ziele.forEach(function (el) { el.classList.add('da'); }); }
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (!e.isIntersecting) return; io.unobserve(e.target); e.target.classList.add('da'); });
    }, { rootMargin: '0px 0px 6% 0px' });  /* startet kurz bevor es ins Bild kommt: nie erst stehen, dann hüpfen (Robert 05.11.2026) */
    ziele.forEach(function (el) { if (!el.classList.contains('fe__t') && !el.closest('[data-band]')) io.observe(el); });
    /* Blätter-Band: alle Blätter gehen gemeinsam auf, sobald das Band ins Bild kommt; sonst fährt ein Blatt beim Blättern seitlich rein
       und steigt erst danach hoch, der Text fehlt kurz (05.11.2026) */
    $$('[data-band]').forEach(function (bd) { var bio = new IntersectionObserver(function (es) { if (!es[0].isIntersecting) return; bio.disconnect();
      ziele.forEach(function (z) { if (bd.contains(z)) z.classList.add('da'); }); }, { rootMargin: '0px 0px 6% 0px' }); bio.observe(bd); });
    /* Bilder anderthalb Bildschirme vorher holen; am Handy zwei Bildschirme und kein Vorrat, sonst wirft Safari am iPhone Bilder weg
       und zeigt sie weiss (Master Website-Bau, Culinarium 28.10.2026; Handy-Prüfung 05.11.2026) */
    var handy = matchMedia('(max-width: 900px)').matches;
    var vor = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (!e.isIntersecting) return; vor.unobserve(e.target); e.target.loading = 'eager'; });
    }, { rootMargin: handy ? '0px 0px 200% 0px' : '0px 0px 150% 0px' });
    $$('main img[loading="lazy"]').forEach(function (im) { vor.observe(im); });
    /* Am Handy: Bänder, die seitlich laufen oder blättern, ganz holen, sobald sie nah sind; ihre Bilder liegen seitlich ausserhalb,
       dort lädt Safari am iPhone nach Sicht nicht nach */
    if (handy) $$('.v9b, [data-band], [data-laufband]').forEach(function (bd) {
      var bo = new IntersectionObserver(function (es) { if (!es[0].isIntersecting) return; bo.disconnect();
        $$('img[loading="lazy"]', bd).forEach(function (im) { vor.unobserve(im); im.loading = 'eager'; }); }, { rootMargin: '0px 0px 200% 0px' });
      bo.observe(bd);
    });
    /* Sobald die Seite steht, alle übrigen Bilder der Reihe nach laden (ohne Vorab-Entschlüsseln, schont den Speicher am Handy), damit beim Scrollen nichts nachlädt (05.11.2026) */
    if (!handy) addEventListener('load', function () {
      var rest = $$('main img[loading="lazy"]'), i = 0;
      (function weiter() {
        if (i >= rest.length) return;
        var im = rest[i++]; im.loading = 'eager';
        var fertig = function () { setTimeout(weiter, 30); };
        if (im.complete) fertig(); else { im.addEventListener('load', fertig, { once: true }); im.addEventListener('error', function () { setTimeout(weiter, 30); }, { once: true }); }
      })();
    });
    /* Fenster: ausserhalb wird das Bild nicht gemalt; Infozeile läuft nur im Bild */
    /* (Robert 05.11.2026: «flackert der Bereich nochmal auf») Das Fenster wird ein gutes Stück vorher sichtbar geschaltet, nie erst an der Kante */
    $$('.fe').forEach(function (f) { new IntersectionObserver(function (es) { f.classList.toggle('verdeckt', !es[0].isIntersecting); }, { rootMargin: '60% 0px 60% 0px' }).observe(f);
      /* Satz steht fest im Fenster und rollt hoch, sobald die Oberkante des Fensters die Mitte erreicht (Robert 05.11.2026) */
      var ft = f.querySelector('.fe__t'); if (ft) { var fio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { fio.disconnect(); ft.classList.add('da'); } }, { rootMargin: '0px 0px -45% 0px' }); fio.observe(f); } });
    $$('[data-laufband]').forEach(function (l) { l.classList.add('still'); new IntersectionObserver(function (es) { l.classList.toggle('still', !es[0].isIntersecting); }).observe(l); });
  }

  /* ---------- Anfrage-Leiste im Auftakt: übernimmt Anlass, Datum, Gäste ins Formular ---------- */
  $$('[data-al]').forEach(function (f) {
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var a = document.querySelector('#anfrage form');
      if (a) { a.Anlass.value = f.anlass.value; if (f.datum.value) a.Datum.value = f.datum.value; a.Wunsch.value = f.gaeste.value; }
      document.querySelector('#anfrage').scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ---------- Leiste: weg beim Runterscrollen, zurück beim Hochscrollen, wie auf den anderen Websites (Robert 05.11.2026).
     Gezählt wird der Weg seit dem letzten Richtungswechsel (24 px), damit kleine Schritte und Nachlauf nichts verschlucken. ---------- */
  var lt = document.querySelector('[data-lt]'), yAlt = scrollY, richt = 0, anker = yAlt, uhr = 0;
  function leiste() {
    uhr = 0; var y = scrollY;
    if ((y - yAlt) * richt < 0 || (!richt && y !== yAlt)) { richt = y > yAlt ? 1 : -1; anker = yAlt; }
    lt.classList.toggle('voll', y > 40);
    if (y < 140 || lt.querySelector(':focus-visible')) lt.classList.remove('weg');
    else if (richt > 0 && y - anker > 24) lt.classList.add('weg');
    else if (richt < 0 && anker - y > 24) lt.classList.remove('weg');
    yAlt = y;
  }
  if (lt) addEventListener('scroll', function () { if (!uhr) uhr = requestAnimationFrame(leiste); }, { passive: true });
  /* ---------- Stimmen · Der Abend im Verlauf (Robert 05.11.2026): Linie wächst mit dem Scrollen, jede Station wird hell, sobald die
     Linie sie erreicht; die Linie läuft weiter bis ins Siegel des nächsten Abschnitts («Dein Abend. Mein Service.»), das dann hell wird.
     Nur transform und Klassen, ein Takt pro Bild. ---------- */
  $$('[data-verlauf]').forEach(function (v) {
    var l = v.querySelector('.vl__l'), f = v.querySelector('.vl__f'), st = $$('.vl__e', v), pk = $$('.vl__p', v), takt = 0;
    var nach = v.closest('section') && v.closest('section').nextElementSibling, ziel = nach && nach.querySelector('.ko__sg');
    if (ziel) ziel.classList.add('vl-ziel');
    var mitte = true, h = 0;
    function lauf() {
      takt = 0;
      var vr = v.getBoundingClientRect(), lr = l.getBoundingClientRect(), spitze = innerHeight * .62;
      if (ziel) { var zr = ziel.getBoundingClientRect(); mitte = Math.abs((zr.left + zr.width / 2) - (lr.left + lr.width / 2)) < 12; }
      /* Länge bis zur Oberkante des Siegels im nächsten Abschnitt, jedes Mal frisch gemessen (Bilder, Schriften, Fenstergrösse) */
      var soll = ziel && mitte ? zr.top - vr.top + 2 : vr.height;
      if (Math.abs(soll - h) > 1) { h = soll; l.style.height = h + 'px'; }
      var q = Math.max(0, Math.min(1, (spitze - vr.top) / h));
      f.style.transform = 'scaleY(' + q + ')';
      st.forEach(function (e, i) { var p = pk[i].getBoundingClientRect(); e.classList.toggle('licht', p.top + p.height / 2 <= spitze); });
      if (ziel) ziel.classList.toggle('leuchtet', q >= .999);
    }
    if (ruhig) { lauf(); f.style.transform = 'none'; st.forEach(function (e) { e.classList.add('licht'); }); if (ziel) ziel.classList.add('leuchtet'); return; }
    addEventListener('scroll', function () { if (!takt) takt = requestAnimationFrame(lauf); }, { passive: true });
    addEventListener('resize', lauf); addEventListener('load', lauf); lauf();
  });

  /* ---------- Stimmen-Band: Knöpfe blättern ein Blatt weiter oder zurück (Robert 05.11.2026) ---------- */
  $$('[data-bd]').forEach(function (k) {
    k.addEventListener('click', function () {
      var band = k.closest('section').querySelector('[data-band]'), blatt = band && band.querySelector('.bd__k');
      if (blatt) band.scrollBy({ left: (+k.getAttribute('data-bd')) * (blatt.getBoundingClientRect().width + 24), behavior: ruhig ? 'auto' : 'smooth' });
    });
  });

  /* ---------- «Dein Abend»-Band (Robert 05.11.2026): läuft von selbst weiter, auch unter der Maus; seitliches Scrollen (Trackpad,
     Magic Mouse, Shift + Rad) schiebt es zusätzlich an, vor oder zurück. Senkrechtes Scrollen bleibt bei der Seite. Ein Takt, nur im Bild. ---------- */
  $$('.v9b').forEach(function (band) {
    var zug = band.querySelector('.v9t'); if (!zug) return;
    band.classList.add('v9-js');
    var pos = 0, schub = 0, alt = 0, takt = 0, sichtbar = false, halb = 1;
    var messen = function () { halb = zug.scrollWidth / 2 || 1; };
    messen(); addEventListener('resize', messen); addEventListener('load', messen);
    function lauf(t) {
      takt = 0; var dt = alt ? Math.min(t - alt, 64) : 16; alt = t;
      if (!ruhig) pos += halb / 60000 * dt;                      /* gleiche Ruhe wie vorher: eine Runde in 60 s */
      var teil = schub * .16; pos += teil; schub -= teil; if (Math.abs(schub) < .2) schub = 0;
      pos = ((pos % halb) + halb) % halb;
      zug.style.transform = 'translate3d(' + (-pos).toFixed(2) + 'px,0,0)';
      if ((sichtbar && !ruhig) || schub) takt = requestAnimationFrame(lauf); else alt = 0;
    }
    var start = function () { if (!takt) takt = requestAnimationFrame(lauf); };
    new IntersectionObserver(function (es) { sichtbar = es[0].isIntersecting; if (sichtbar) start(); }).observe(band);
    band.addEventListener('wheel', function (ev) {
      var dx = ev.deltaX || (ev.shiftKey ? ev.deltaY : 0);
      if (!dx || Math.abs(dx) < Math.abs(ev.shiftKey ? 0 : ev.deltaY)) return;   /* senkrecht: Seite scrollt */
      ev.preventDefault(); schub += dx * (ev.deltaMode === 1 ? 32 : 1); start();
    }, { passive: false });
    /* Handy: seitlich wischen schiebt das Band, senkrecht bleibt Seite */
    var x0 = null, y0 = 0, seitlich = false;
    band.addEventListener('touchstart', function (ev) { x0 = ev.touches[0].clientX; y0 = ev.touches[0].clientY; seitlich = false; }, { passive: true });
    band.addEventListener('touchmove', function (ev) {
      if (x0 === null) return; var dx = ev.touches[0].clientX - x0, dy = ev.touches[0].clientY - y0;
      if (!seitlich && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) seitlich = true;
      if (seitlich) { ev.preventDefault(); schub -= dx; x0 = ev.touches[0].clientX; start(); }
    }, { passive: false });
    band.addEventListener('touchend', function () { x0 = null; }, { passive: true });
  });
})();

/* ---------- Handy-Menü (Handy-Prüfung 05.11.2026): bis 900 px ist die Menüleiste aus, darum eine Menü-Taste in der Leiste und ein
   Menü als Vollbild mit grossen Titelzeilen (Roberts Standard). Punkte und «Abend anfragen» kommen aus der Leiste selbst, nichts doppelt
   gepflegt. Schliesst per Taste, Esc und bei jedem Link. Am Rechner unsichtbar (stil.css). ---------- */
(function () {
  'use strict';
  var lt = document.querySelector('[data-lt]'), nav = lt && lt.querySelector('.lt__k');
  if (!nav || document.querySelector('.mn')) return;
  var d = document.documentElement, ak = lt.querySelector('.kn--klein');
  var k = document.createElement('button');
  k.type = 'button'; k.className = 'mn-k'; k.setAttribute('data-menue-knopf', ''); k.setAttribute('aria-label', 'Menü');
  k.setAttribute('aria-controls', 'menue'); k.setAttribute('aria-expanded', 'false'); k.innerHTML = '<i></i><i></i>';
  var m = document.createElement('div');
  m.className = 'mn tap-h'; m.id = 'menue'; m.setAttribute('aria-hidden', 'true'); m.inert = true;
  var liste = document.createElement('nav'); liste.className = 'mn__k'; liste.setAttribute('aria-label', 'Menü');
  [].slice.call(nav.querySelectorAll('a')).forEach(function (a, i) {
    var n = document.createElement('a'); n.href = a.getAttribute('href'); n.textContent = a.textContent.trim(); n.style.setProperty('--k', i);
    if (a.hasAttribute('aria-current')) n.setAttribute('aria-current', a.getAttribute('aria-current'));
    liste.appendChild(n);
  });
  m.appendChild(liste);
  if (ak) { var kn = ak.cloneNode(true); kn.classList.remove('kn--klein'); kn.style.setProperty('--k', liste.children.length); m.appendChild(kn); }
  lt.appendChild(k); lt.parentNode.insertBefore(m, lt.nextSibling);
  function setze(auf) {
    d.classList.toggle('mn-offen', auf); k.setAttribute('aria-expanded', auf ? 'true' : 'false'); k.setAttribute('aria-label', auf ? 'Menü schliessen' : 'Menü');
    m.setAttribute('aria-hidden', auf ? 'false' : 'true'); m.inert = !auf;
    if (auf) lt.classList.remove('weg');
  }
  k.addEventListener('click', function () { setze(!d.classList.contains('mn-offen')); });
  m.addEventListener('click', function (e) { if (e.target.closest('a')) setze(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && d.classList.contains('mn-offen')) { setze(false); k.focus(); } });
  addEventListener('resize', function () { if (innerWidth > 900 && d.classList.contains('mn-offen')) setze(false); });
})();

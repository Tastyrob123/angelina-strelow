/* Druckseite der Unterlagen (druck.html?art=mappe|karte|dank&abend=<id>[&druck=1]): holt den Abend vom gemeinsamen Server, setzt die Seiten mit druck.js
   und meldet window.DRUCK_BEREIT, sobald jedes Bild geladen ist (druck_pdf.js wartet darauf). Mit &druck=1 öffnet sich danach das Druckfenster.
   druck.html?vorschau=1 ist die Vorschau im Werkzeug (Prüfung 6, N10): dieselbe Seite mit derselben Schrift und demselben Satz, eingebettet als Fenster;
   das Werkzeug reicht mit window.VORSCHAU(art, abend, text, unterschrift) auch Eingaben, die noch nicht gespeichert sind. Nichts vom Kleid des Werkzeugs
   wirkt hinein, deshalb stehen Seitenzahl, Enge und Lage genau wie im PDF. Die Blätter werden nur danach verkleinert gezeigt (zwei nebeneinander, am Handy eines). */
(function () {
  const q = new URLSearchParams(location.search), VOR = q.get('vorschau') === '1';
  const ziel = document.getElementById('seiten');
  const B = window.BAUSTEINE || {};
  const foto = x => x.quelle === 'eigen' ? '/angelina-strelow/werkzeuge/nachher/dateien/' + encodeURIComponent(x.datei) : '/angelina-strelow/werkzeuge/assets/bild/' + x.datei + '-1000.webp';   // hinzugefügte Fotos über den gemeinsamen Dateiweg
  const geladen = () => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(ok => { i.addEventListener('load', ok, { once: true }); i.addEventListener('error', ok, { once: true }); })));
  async function setzen(art, a, text) {
    ziel.innerHTML = DRUCK.seiten(art, a, foto, text);
    await geladen();
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    if (art === 'dank') DRUCK.umbrechen(ziel); else DRUCK.einpassen(ziel);
    await geladen();   // Zeichen der Folgeseiten
  }
  if (VOR) {
    document.documentElement.classList.add('vorschau');
    let lauf = 0;
    const massstab = () => {   // verkleinert zeigen, nachdem gesetzt ist (ändert den Satz nicht)
      const seiten = [...ziel.querySelectorAll('.dr-seite')]; if (!seiten.length) return;
      const W = document.documentElement.clientWidth, b0 = seiten[0].offsetWidth || 1, spalten = W > 520 ? 2 : 1, s = Math.min(1, (W - (spalten - 1) * 18 - 2) / spalten / b0);
      seiten.forEach(p => { let h = p.parentNode; if (!h.classList.contains('dr-huelle')) { h = document.createElement('div'); h.className = 'dr-huelle'; p.before(h); h.appendChild(p); }
        h.style.width = Math.floor(p.offsetWidth * s) + 'px'; h.style.height = Math.floor(p.offsetHeight * s) + 'px'; p.style.transform = `scale(${s})`; p.style.transformOrigin = '0 0'; });
      if (frameElement) frameElement.style.height = Math.ceil(ziel.getBoundingClientRect().height) + 'px';
    };
    window.VORSCHAU = async (art, a, text, unterschrift) => {
      const nr = ++lauf; DRUCK.setzeUnterschrift(unterschrift || '');
      const neu = document.createElement('div'); neu.style.cssText = 'position:absolute;left:-10000px;top:0;visibility:hidden';   // erst unsichtbar setzen, dann tauschen: kein Flackern beim Tippen
      const alt = ziel; document.body.appendChild(neu);
      neu.innerHTML = DRUCK.seiten(art, JSON.parse(JSON.stringify(a)), foto, text);
      await geladen(); if (document.fonts && document.fonts.ready) await document.fonts.ready;
      if (art === 'dank') DRUCK.umbrechen(neu); else DRUCK.einpassen(neu);
      await geladen();
      if (nr !== lauf) { neu.remove(); return; }
      alt.innerHTML = ''; alt.append(...neu.childNodes); neu.remove();
      massstab(); window.VORSCHAU_STAND = nr;
    };
    addEventListener('resize', massstab);
    window.VORSCHAU_BEREIT = true;
    if (frameElement && frameElement.dataset) frameElement.dispatchEvent(new Event('bereit'));
    return;
  }
  (async () => {
    const art = q.get('art') || 'mappe', id = q.get('abend') || '';
    try {
      const [r, sr] = await Promise.all([fetch('/angelina-strelow/werkzeuge/api/abende', { cache: 'no-store' }), fetch('/angelina-strelow/werkzeuge/api/sammlung/nachher-sammlung', { cache: 'no-store' }).catch(() => null)]); const d = await r.json();
      const sam = sr && sr.ok ? ((await sr.json()).daten || {}) : {};
      DRUCK.setzeUnterschrift(sam.unterschrift ? '/angelina-strelow/werkzeuge/nachher/dateien/' + encodeURIComponent(sam.unterschrift) : '');   // ihre hinterlegte Unterschrift, sonst Schreibschrift
      const a = (d.abende || []).find(x => x.id === id);
      if (!a) { ziel.innerHTML = '<p class="dr-fehlt">Diesen Abend gibt es nicht mehr.</p>'; window.DRUCK_BEREIT = true; return; }
      const n = a.nachher || {}, ihr = DRUCK.ihrForm((a.gastgeber || {}).name), f = DRUCK.felder(a);
      const bs = (liste, k) => (B[liste] || []).find(x => x.id === k);
      let text = '';
      if (art === 'mappe') { const m = n.mappe || {}; text = m.satz_text || (bs('mappe', m.satz) ? DRUCK.fuellen(bs('mappe', m.satz)[ihr ? 'ihr' : 'du'], f) : ''); if (DRUCK.offen(text)) text = ''; }
      else if (art === 'karte') { const k = (n.dank || {}).karte || {}, b = bs('karte', k.vorn) || (B.karte || [])[0]; text = k.vorn_text || (b ? (ihr ? b.vornIhr : b.vorn) : 'Danke.'); }
      else text = (n.dank || {}).text || '';
      document.title = { mappe: 'Erinnerungs-Mappe', karte: 'Dankeskarte', dank: 'Dank' }[art] + ' · ' + ((a.gastgeber || {}).name || '');
      const st = document.createElement('style'); st.textContent = art === 'karte' ? '@page{size:148mm 105mm;margin:0}' : '@page{size:210mm 297mm;margin:0}'; document.head.appendChild(st);
      await setzen(art, a, text);
      /* Fotos als JPEG ins PDF (Prüfung 6, N11): WebP und PNG bettet Chromium verlustfrei ein (bis 1,9 MB je Foto); als JPEG (Güte 90, gleiche Pixel) rund 0,25 MB.
         Nur Fotos (nie Siegel, Logo, Unterschrift mit Transparenz); die Grösse bleibt, der Satz ändert sich nicht. */
      await Promise.all([...ziel.querySelectorAll('.dr-foto img, .dr-karte-bild img, .dr-bild img')].filter(i => i.naturalWidth && !/\.jpe?g($|\?)/i.test(i.src)).map(i => new Promise(ok => {
        try { const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(i, 0, 0);
          const u = c.toDataURL('image/jpeg', .9); i.addEventListener('load', ok, { once: true }); i.addEventListener('error', ok, { once: true }); i.src = u; } catch (e) { ok(); }
      })));
      window.DRUCK_BEREIT = true;
      if (q.get('druck') === '1') setTimeout(() => print(), 200);
    } catch (e) { ziel.innerHTML = '<p class="dr-fehlt">Die Unterlage liess sich nicht laden. Bitte das Werkzeug neu laden.</p>'; window.DRUCK_BEREIT = true; }
  })();
})();

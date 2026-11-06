/* Tischkarten & Menü · Druck. Kern aus der Plakatwerkstatt (druck.js): eine Seite in Zeichenbefehle zerlegen (Masse in mm, Text Zeichen für Zeichen
   an der Stelle, an der der Browser ihn gesetzt hat), daraus das PDF. Feste TrueType-Schnitte, eingebettet als Teilmenge (kein Type 3),
   3 mm Beschnitt, auf Wunsch Schnittmarken und Falzmarken. Dazu die Druckprüfung. Alles lokal im Browser, nichts geht hinaus. */
(function () {
  const T = window.TI;
  const MM = 72 / 25.4;
  const S = 8;   // Messauflösung: 8 px je mm

  const hex = f => { const h = String(f).replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) / 255); };
  const bildCache = {};
  const ladeBild = url => bildCache[url] || (bildCache[url] = new Promise((ok, nein) => { const i = new Image(); i.addEventListener('load', () => ok(i), { once: true }); i.addEventListener('error', nein, { once: true }); i.src = url; }));

  /* Grundlinie je Schrift: Abstand Oberkante Zeichenkasten → Grundlinie, als Anteil der Schriftgrösse */
  const grund = {};
  function grundlinie(rolle) {
    if (grund[rolle]) return grund[rolle];
    const w = document.createElement('div');
    w.style.cssText = `position:absolute;left:-99999px;top:0;font-family:'${T.SCHRIFT[rolle].fam}';font-size:100px;line-height:normal;white-space:nowrap`;
    w.innerHTML = 'H<span style="display:inline-block;width:0;height:0;vertical-align:baseline"></span>';
    document.body.appendChild(w);
    const r = document.createRange(); r.setStart(w.firstChild, 0); r.setEnd(w.firstChild, 1);
    const top = r.getBoundingClientRect().top, base = w.lastChild.getBoundingClientRect().top;
    document.body.removeChild(w);
    return (grund[rolle] = (base - top) / 100);
  }

  function rr(x, y, w, h, r) {
    r = Math.max(0, Math.min(r || 0, w / 2, h / 2));
    if (!r) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
    const k = r * .5523;
    return `M${x + r} ${y}H${x + w - r}C${x + w - r + k} ${y} ${x + w} ${y + r - k} ${x + w} ${y + r}V${y + h - r}C${x + w} ${y + h - r + k} ${x + w - r + k} ${y + h} ${x + w - r} ${y + h}` +
      `H${x + r}C${x + r - k} ${y + h} ${x} ${y + h - r + k} ${x} ${y + h - r}V${y + r}C${x} ${y + r - k} ${x + r - k} ${y} ${x + r} ${y}Z`;
  }

  /* Fläche mit Tapete (Rautengitter ihrer Fliege) als Pixelbild, Rapport an der Ecke der Fläche verankert wie am Bildschirm */
  async function tapetenBild(el, dpi) {
    const k = dpi / 25.4, cw = Math.max(1, Math.round(el.w * k)), ch = Math.max(1, Math.round(el.h * k));
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const g = cv.getContext('2d');
    g.fillStyle = el.farbe; g.fillRect(0, 0, cw, ch);
    const kachel = await ladeBild(T.TAPETE[el.tapete]);
    const rw = T.TAPETE.rapport * k, rh = rw * (kachel.naturalHeight || kachel.height) / (kachel.naturalWidth || kachel.width);
    const ox = (((el.tx || 0) - el.x) * k) % rw, oy = (((el.ty || 0) - el.y) * k) % rh;
    for (let yy = oy - rh; yy < ch; yy += rh) for (let xx = ox - rw; xx < cw; xx += rw) g.drawImage(kachel, xx, yy, rw, rh);
    return { cv };
  }

  /* Foto als Pixelbild im Endmass: randlos zugeschnitten (cover) mit derselben Lage fx/fy wie am Bildschirm, höchstens 300 dpi,
     nie grösser gerechnet als das Foto selbst ist */
  async function fotoBild(el, dpi) {
    const i = await ladeBild(T.bildUrl(el.bild)), iw = i.naturalWidth || i.width, ih = i.naturalHeight || i.height;
    const s0 = Math.max(el.w / iw, el.h / ih);   // mm je Bildpunkt beim Zuschnitt
    const k = Math.min(dpi / 25.4, 1 / s0 * 1.0001), cw = Math.max(1, Math.round(el.w * k)), ch = Math.max(1, Math.round(el.h * k));
    const sw = el.w / s0, sh = el.h / s0, fx = el.fx == null ? .5 : el.fx, fy = el.fy == null ? .5 : el.fy;
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
    const g = cv.getContext('2d'); g.imageSmoothingQuality = 'high';
    g.drawImage(i, (iw - sw) * fx, (ih - sh) * fy, sw, sh, 0, 0, cw, ch);
    return { cv };
  }

  /* ---------- Zerlegen ---------- */
  T.druckplan = async function (doc, i) {
    const B = T.B, s = doc.seiten[i], f = doc.format;
    const host = document.createElement('div');
    host.style.cssText = 'position:absolute;left:0;top:0;transform:translateX(-200000px);pointer-events:none';
    document.body.appendChild(host);
    const blatt = T.seiteDom(doc, i, S, { druck: true, ungedreht: true });
    host.appendChild(blatt);
    await document.fonts.ready;
    const ops = [{ art: 'pfad', d: rr(-B, -B, f.b + 2 * B, f.h + 2 * B, 0), fill: s.grund }];
    const els = s.el.filter(el => el.typ !== 'hilfe'), kinder = [...blatt.children];
    for (let n = 0; n < els.length; n++) {
      const el = els[n], d = kinder[n];
      if (el.typ === 'text') {
        const u = blatt.getBoundingClientRect();
        const gl = T.glyphen(d, S, u.left + B * S, u.top + B * S), a = grundlinie(el.rolle);
        let glyphen = gl.map(g => ({ ch: el.gross ? g.ch.toUpperCase() : g.ch, x: g.x, base: g.top + a * el.gr, w: g.w, leer: g.leer }));
        if (el.dreh) {   // um 180° gedreht (obere Hälfte der gefalteten Tischkarte): Ursprung jedes Zeichens um die Mitte der Box spiegeln
          const h = d.getBoundingClientRect().height / S, cx = el.x + el.w / 2, cy = el.y + h / 2;
          glyphen = glyphen.map(g => ({ ch: g.ch, x: 2 * cx - g.x, base: 2 * cy - g.base, dreh: 180, leer: g.leer }));
        }
        ops.push({ art: 'text', rolle: el.rolle, gr: el.gr, farbe: el.farbe, glyphen, ausr: el.ausr || 'c' });
      } else if (el.typ === 'bild') {
        ops.push({ art: 'raster', x: el.x, y: el.y, w: el.w, h: el.h, ...(await fotoBild(el, 300)) });
      } else if (el.typ === 'flaeche') {
        if (el.tapete) ops.push({ art: 'raster', x: el.x, y: el.y, w: el.w, h: el.h, ...(await tapetenBild(el, 240)) });
        else ops.push({ art: 'pfad', d: rr(el.x, el.y, el.w, el.h, el.r), fill: el.farbe });
      } else if (el.typ === 'linie') {
        ops.push({ art: 'pfad', d: rr(el.x, el.y, el.w, Math.max(el.h || 0, el.staerke), 0), fill: el.farbe, marke: el.marke });
      } else if (el.typ === 'rahmen') {
        const t = el.staerke;
        ops.push({ art: 'pfad', d: rr(el.x + t / 2, el.y + t / 2, el.w - t, el.h - t, Math.max(0, (el.r || 0) - t / 2)), stroke: el.farbe, breite: t });
      } else if (el.typ === 'zeichen') {
        const z = window.TI_ZEICHEN[el.z], k = el.w / z.vb[2];
        ops.push({ art: 'zeichen', x: el.x - z.vb[0] * k, y: el.y - z.vb[1] * k, k, z: el.z, farbe: el.farbe });
      } else if (el.typ === 'motiv') {
        ops.push({ art: 'motiv', x: el.x, y: el.y, k: el.w / 48, motiv: el.motiv, farbe: el.farbe, breite: el.staerke });
      }
    }
    document.body.removeChild(host);
    return ops;
  };

  /* ---------- PDF ---------- */
  const schriftCache = {};
  const schriftBytes = rolle => { const url = T.basis + T.SCHRIFT[rolle].datei; return schriftCache[url] || (schriftCache[url] = fetch(url).then(r => { if (!r.ok) throw new Error('SCHRIFT · Die Druckschrift ' + T.SCHRIFT[rolle].name + ' lädt nicht.'); return r.arrayBuffer(); })); };

  /* pdf-lib und fontkit (1,3 MB) erst laden, wenn ein PDF entsteht; beim Zeigen auf den Knopf vorladen (wie im Vorbild) */
  let pdfLib = null;
  T.ladePdf = () => pdfLib || (pdfLib = (window.PDFLib && window.fontkit) ? Promise.resolve() : Promise.all(['lib/pdf-lib.min.js', 'lib/fontkit.umd.min.js'].map(src => new Promise((ok, nein) => {
    const s = document.createElement('script'); s.src = T.basis + src; s.async = true;
    s.addEventListener('load', ok, { once: true }); s.addEventListener('error', () => { pdfLib = null; nein(new Error('PDF · Das PDF-Werkzeug lädt nicht (' + src + ').')); }, { once: true });
    document.head.appendChild(s);
  }))));
  T.vorladenPdf = () => { T.ladePdf().catch(() => {}); Object.keys(T.SCHRIFT).forEach(r => schriftBytes(r).catch(() => {})); };

  /* docs: eine Drucksache oder mehrere (ganze Mappe). o.marken: Schnittmarken und 10 mm Rand. o.melde(text): Fortschritt */
  T.pdf = async function (docs, o = {}) {
    if (!Array.isArray(docs)) docs = [docs];
    await T.ladePdf();
    const { PDFDocument, rgb, cmyk, LineCapStyle, pushGraphicsState, popGraphicsState, beginText, endText, setFontAndSize, setTextMatrix, setFillingRgbColor, setCharacterSpacing, showText } = PDFLib;
    const pdf = await PDFDocument.create();
    pdf.registerFontkit(fontkit);
    pdf.setTitle(o.titel || docs[0].name); pdf.setAuthor('Angelina Strelow · Exklusive Gastgeberin'); pdf.setCreator('Tischkarten & Menü'); pdf.setProducer('Tischkarten & Menü');
    pdf.setLanguage('de-DE');
    const fonts = {}, zeichensatz = {}, jpgCache = {};
    const font = async rolle => {
      if (!fonts[rolle]) { fonts[rolle] = await pdf.embedFont(await schriftBytes(rolle), { subset: true }); zeichensatz[rolle] = new Set(fonts[rolle].getCharacterSet()); }
      return fonts[rolle];
    };
    const fehlend = new Set();
    let gesamt = docs.reduce((n, d) => n + d.seiten.length, 0), nr = 0;
    for (const doc of docs) {
      /* Bogen (A4 für den Drucker zu Hause): ohne Beschnitt, die Schnittmarken stehen schon auf dem Bogen. Einzelstücke: 3 mm Beschnitt, auf Wunsch Schnittmarken */
      const f = doc.format, fm = T.FORMATE[doc.formatKey] || {}, falz = fm.falz;
      const B = fm.bogen || o.beschnitt === false ? 0 : T.B, R = o.marken && !fm.bogen && o.beschnitt !== false ? 10 : 0;
      for (let i = 0; i < doc.seiten.length; i++) {
        nr++; if (o.melde) o.melde(`Seite ${nr} von ${gesamt} wird gesetzt …`);
        const ops = await T.druckplan(doc, i);
        const PW = (f.b + 2 * B + 2 * R) * MM, PH = (f.h + 2 * B + 2 * R) * MM;
        const page = pdf.addPage([PW, PH]), fkey = new Map();   // Schrift-Schlüssel je Seite, einmal je Schrift
        const X = x => (x + B + R) * MM, Y = y => PH - (y + B + R) * MM;
        page.setBleedBox(R * MM, R * MM, (f.b + 2 * B) * MM, (f.h + 2 * B) * MM);
        page.setTrimBox((R + B) * MM, (R + B) * MM, f.b * MM, f.h * MM);
        for (const op of ops) {
          if (op.art === 'pfad') {
            const opt = { x: X(0), y: Y(0), scale: MM };
            if (op.fill) Object.assign(opt, { color: op.marke ? cmyk(1, 1, 1, 1) : rgb(...hex(op.fill)) });
            if (op.stroke) Object.assign(opt, { borderColor: rgb(...hex(op.stroke)), borderWidth: op.breite });
            page.drawSvgPath(op.d, opt);
          } else if (op.art === 'raster') {
            const daten = op.cv.toDataURL('image/jpeg', .9);   // dasselbe Foto (etwa deine Karte achtmal auf dem Bogen) nur einmal einbetten
            const bild = await (jpgCache[daten] || (jpgCache[daten] = pdf.embedJpg(daten)));
            page.drawImage(bild, { x: X(op.x), y: Y(op.y + op.h), width: op.w * MM, height: op.h * MM });
          } else if (op.art === 'zeichen') {
            for (const d of window.TI_ZEICHEN[op.z].pfade) page.drawSvgPath(d, { x: X(op.x), y: Y(op.y), scale: op.k * MM, color: rgb(...hex(op.farbe)) });
          } else if (op.art === 'motiv') {
            for (const d of T.MOTIVE[op.motiv].d) page.drawSvgPath(d, { x: X(op.x), y: Y(op.y), scale: op.k * MM, borderColor: rgb(...hex(op.farbe)), borderWidth: op.breite / op.k, borderLineCap: LineCapStyle.Round });
          } else if (op.art === 'text') {
            /* Eine Zeile = ein Textobjekt (BT … ET). Jedes Zeichen steht an der Stelle, an der der Browser es gesetzt hat: die Unterschneidung zum
               nächsten Zeichen (Della Respira zieht etwa «Ta» um 0,22 em zusammen) geht als Zeichenabstand Tc in die Breite des Zeichens selbst.
               So hat jedes Zeichen seine Lage und Fläche, nichts überlappt, und alle Leseprogramme lesen ganze Wörter in der Folge von oben nach
               unten (pdftotext, -layout, -raw; Prüfung 2, Punkt 13). Zeichen, die Della Respira nicht kennt (’ „ …), kommen in derselben Zeile aus
               der Lesetype (Schriftwechsel mit Tf), damit «d’Alsace» ein Wort bleibt. Jedes Wort setzt an seiner Stelle neu an. */
            const fo = await font(op.rolle), size = op.gr * MM, zeilen = [];
            let zeile = null;
            for (const g of op.glyphen) {
              let fx = fo;
              if (!zeichensatz[op.rolle].has(g.ch.codePointAt(0))) {
                const alt = await font('text');
                if (zeichensatz.text.has(g.ch.codePointAt(0))) fx = alt; else { fehlend.add(g.ch); continue; }
              }
              if (!zeile || Math.abs(g.base - zeile.base) > .05 || !!g.dreh !== zeile.dreh) zeilen.push(zeile = { base: g.base, dreh: !!g.dreh, gl: [] });
              zeile.gl.push(Object.assign({ fx }, g));
            }
            const [r0, g0, b0] = hex(op.farbe), rund = n => Math.round(n * 1000) / 1000;
            for (const Z of zeilen) {
              /* Wortlücken für Leseprogramme: Poppler setzt erst ab etwa 0,22 em Lücke ein Leerzeichen; Della Respira lässt nach der Unterschneidung
                 oft nur 0,18–0,2 em. Solche Lücken werden im PDF auf 0,23 em geweitet (höchstens um 0,08 em), die Zeile um die Hälfte (mittig) oder
                 ganz (rechtsbündig) zurückgesetzt, damit sie an ihrer Stelle bleibt. Abweichung höchstens Bruchteile eines Millimeters. */
              const dir = Z.dreh ? -1 : 1, MIN = .23 * size, weit = [];
              Z.gl.forEach((g, j) => { const n = Z.gl[j + 1]; if (!n || !n.leer) return; const luecke = (n.x - g.x) * MM * dir - g.fx.widthOfTextAtSize(g.ch, size); weit[j + 1] = luecke < MIN ? Math.min(MIN - luecke, .08 * size) / MM : 0; });
              const summe = weit.reduce((a, b) => a + (b || 0), 0), anfang = summe * ({ c: .5, r: 1 }[op.ausr] || 0);
              let schub = -anfang;
              Z.gl.forEach((g, j) => { schub += weit[j] || 0; if (schub) g.x += schub * dir; });
              const ops = [pushGraphicsState(), beginText(), setFillingRgbColor(r0, g0, b0)];
              let fJetzt = null, tcJetzt = 0;
              const schrift = fx => { if (!fkey.has(fx)) { page.setFont(fx); fkey.set(fx, page.fontKey); } if (fx !== fJetzt) { ops.push(setFontAndSize(fkey.get(fx), size)); fJetzt = fx; } };
              const tc = n => { n = rund(n); if (n !== tcJetzt) { ops.push(setCharacterSpacing(n)); tcJetzt = n; } };
              const setzeAn = g => { const x = X(g.x), y = Y(g.base); ops.push(Z.dreh ? setTextMatrix(-1, 0, 0, -1, x, y) : setTextMatrix(1, 0, 0, 1, x, y)); };
              setzeAn(Z.gl[0]);
              /* Leseprogramme (Poppler) ziehen Tc von der Breite wieder ab und trennen ab 0,2 em Überlappung das Wort. Deshalb höchstens 0,15 em
                 Unterschneidung je Paar; der Rest wandert in die folgenden Abstände, bis das Wort wieder genau dort steht, wo der Browser es setzt
                 (Abweichung höchstens einige Hundertstel em, am nächsten Leerzeichen null). */
              const GRENZE = -.15 * size, OBEN = .085 * size;   // Poppler trennt ab etwa 0,1 em Lücke ein Wort; WebKit setzt gesperrte Versalien ohne Unterschneidung
              let rest = 0;
              Z.gl.forEach((g, j) => {
                const n = Z.gl[j + 1], adv = g.fx.widthOfTextAtSize(g.ch, size);
                schrift(g.fx);
                if (!n) { tc(0); ops.push(showText(g.fx.encodeText(g.ch))); return; }
                const weg = (n.x - g.x) * MM * (Z.dreh ? -1 : 1);
                /* Wortgrenze: das nächste Wort setzt neu an seiner Stelle an. Die Lücke (0,15–0,2 em) lesen alle Leseprogramme als Leerzeichen;
                   ein Leerzeichen-Zeichen mit angepasstem Abstand dagegen verschluckten sie («SarahYilmaz», Prüflauf 05.11.2026). */
                if (n.leer) { tc(0); rest = 0; ops.push(showText(g.fx.encodeText(g.ch))); setzeAn(n); return; }
                let soll = weg - adv + rest; rest = 0;
                if (soll < GRENZE) { rest = soll - GRENZE; soll = GRENZE; } else if (soll > OBEN) { rest = soll - OBEN; soll = OBEN; }
                tc(soll); ops.push(showText(g.fx.encodeText(g.ch)));
              });
              ops.push(endText(), popGraphicsState());
              page.pushOperators(...ops);
            }
          }
        }
        if (R) {
          const reg = cmyk(1, 1, 1, 1), t = .25, L = 5 * MM, gap = (B + 1) * MM;
          const x0 = (R + B) * MM, x1 = x0 + f.b * MM, y0 = (R + B) * MM, y1 = y0 + f.h * MM;
          for (const [x, sx] of [[x0, -1], [x1, 1]]) for (const [y, sy] of [[y0, -1], [y1, 1]]) {
            page.drawLine({ start: { x: x + sx * gap, y }, end: { x: x + sx * (gap + L), y }, thickness: t, color: reg });
            page.drawLine({ start: { x, y: y + sy * gap }, end: { x, y: y + sy * (gap + L) }, thickness: t, color: reg });
          }
          if (falz) {   // Falzmarke: gestrichelt kurz neben dem Schnitt, auf Höhe der Falz
            const yf = PH - (falz + B + R) * MM;
            for (const [a, b] of [[x0 - gap - L, x0 - gap], [x1 + gap, x1 + gap + L]]) page.drawLine({ start: { x: a, y: yf }, end: { x: b, y: yf }, thickness: t, color: reg, dashArray: [2, 1.5] });
          }
          const fo = await font('text');
          const fm = T.FORMATE[doc.formatKey];
          /* Zeile im Markenrand: so lang, wie die Seite Platz hat (kleine Karten nur Format und Seite) */
          const platz = PW - x0 - 12 * MM;
          const zeile = [`${doc.name} · ${fm.name} (${f.b} × ${f.h} mm) · Seite ${i + 1} · 3 mm Beschnitt`, `${fm.name} (${f.b} × ${f.h} mm) · Seite ${i + 1}`, `Seite ${i + 1}`].find(t => fo.widthOfTextAtSize(t, 5.5) <= platz) || '';
          if (zeile) page.drawText(zeile, { x: x0 + 8 * MM, y: 3.5 * MM, size: 5.5, font: fo, color: reg });
        }
      }
    }
    return { bytes: await pdf.save(), fehlend: [...fehlend] };
  };

  /* ---------- Bild (PNG) einer Seite, wie DS.png der Plakatwerkstatt: dieselben Zeichenbefehle wie das PDF, auf eine Leinwand gemalt.
     Zum Verschicken (etwa die Menükarte vorab an den Gastgeber); Endformat ohne Beschnitt, 200 dpi. ---------- */
  T.png = async function (doc, i, pxBreite) {
    const f = doc.format, ops = await T.druckplan(doc, i);
    pxBreite = pxBreite || Math.round(f.b / 25.4 * 200);
    const k = pxBreite / f.b, cv = document.createElement('canvas');
    cv.width = Math.round(f.b * k); cv.height = Math.round(f.h * k);
    const g = cv.getContext('2d');
    g.setTransform(k, 0, 0, k, 0, 0);
    for (const op of ops) {
      g.save();
      if (op.art === 'pfad') {
        const p = new Path2D(op.d);
        if (op.fill) { g.fillStyle = op.fill; g.fill(p); }
        if (op.stroke) { g.strokeStyle = op.stroke; g.lineWidth = op.breite; g.stroke(p); }
      } else if (op.art === 'raster') g.drawImage(op.cv, op.x, op.y, op.w, op.h);
      else if (op.art === 'zeichen') {
        g.translate(op.x, op.y); g.scale(op.k, op.k); g.fillStyle = op.farbe;
        for (const d of window.TI_ZEICHEN[op.z].pfade) g.fill(new Path2D(d));
      } else if (op.art === 'motiv') {
        g.translate(op.x, op.y); g.scale(op.k, op.k); g.strokeStyle = op.farbe; g.lineWidth = op.breite / op.k; g.lineCap = 'round'; g.lineJoin = 'round';
        for (const d of T.MOTIVE[op.motiv].d) g.stroke(new Path2D(d));
      } else if (op.art === 'text') {
        g.fillStyle = op.farbe; g.font = `${op.gr}px '${T.SCHRIFT[op.rolle].fam}','TI-text'`; g.textBaseline = 'alphabetic';
        for (const gl of op.glyphen) {
          if (gl.dreh) { g.save(); g.translate(gl.x, gl.base); g.rotate(Math.PI); g.fillText(gl.ch, 0, 0); g.restore(); }
          else g.fillText(gl.ch, gl.x, gl.base);
        }
      }
      g.restore();
    }
    return new Promise((ok, nein) => cv.toBlob(b => (b ? ok(b) : nein(new Error('BILD · Das Bild ist zu gross für diesen Browser.'))), 'image/png'));
  };

  /* Datei im Browser speichern (lokal, kein Hochladen) */
  T.speichereDatei = function (bytes, name, typ) {
    const url = URL.createObjectURL(new Blob([bytes], { type: typ || 'application/pdf' }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 4000);
  };
  T.dateiname = (doc, zusatz) => (doc.name + (zusatz ? ' ' + zusatz : '')).replace(/[«»"]/g, '').replace(/[\/\\:*?<>|]/g, '-').replace(/\s+/g, ' ').trim() + '.pdf';

  /* ---------- Druckprüfung ---------- */
  T.pruefe = function (doc) {
    const out = [], f = doc.format, Sx = T.SICHER, fm = T.FORMATE[doc.formatKey], bogen = !!fm.bogen, K = doc.kontext;
    const rot = (text, key) => out.push({ stufe: 'rot', text, key }), gelb = (text, key) => out.push({ stufe: 'gelb', text, key });
    const st = T.STUECKE[doc.stueck];
    if (!doc.passt) {   // nur Wege nennen, die es für diese Drucksache gibt (Prüfung 05.11.2026: die Menükarte kennt kein grösseres Format)
      const gross = st.formate.map(k => T.FORMATE[k]).filter(F => !F.bogen && F.b * F.h > f.b * f.h).sort((a, b) => a.b * a.h - b.b * b.h)[0];
      const weg = ['unter «Format» die Grösse eine Stufe kleiner stellen'].concat({ menue: ['unter «Inhalt» eine Beschreibung ausblenden', 'ein Gericht kürzen'], weine: ['unter «Inhalt» eine Notiz ausblenden', 'einen Wein kürzen'], begruessung: ['unter «Inhalt» einen Punkt des Ablaufs ausblenden'] }[doc.stueck] || ['einen Text kürzen']);
      if (gross) weg.push('das Format «' + gross.name + '» wählen');
      rot('Der Text passt nicht ganz aufs Blatt. ' + weg.join(', ').replace(/^u/, 'U').replace(/, ([^,]*)$/, ' oder $1') + '.');
    }
    if ((st.jeGast || st.sitz) && !K.plan.gaeste.length) rot('Für diesen Abend stehen noch keine Gäste im Abendplan.');
    if (st.sitz || st.jeGast) {
      const SZ = T.sitz(K), frei = Object.keys(SZ.bel).length;
      if (SZ.frei.length && K.plan.gaeste.length > T.MAX_PLAETZE && SZ.n >= T.MAX_PLAETZE) gelb(`${SZ.frei.length} Gäste haben keinen Platz an der Tafel (höchstens ${T.MAX_PLAETZE} Plätze): ${SZ.frei.slice(0, 6).join(', ')}${SZ.frei.length > 6 ? ' und weitere' : ''}. Sie sitzen an den weiteren Tischen frei; ihre Tischkarten entstehen trotzdem.`);
      else if (SZ.frei.length) gelb(`${SZ.frei.length === 1 ? 'Ein Gast hat' : SZ.frei.length + ' Gäste haben'} noch keinen Platz: ${SZ.frei.join(', ')}.`);
      if (st.sitz && SZ.n > frei && frei) gelb(`${SZ.n - frei === 1 ? 'Ein Platz bleibt' : (SZ.n - frei) + ' Plätze bleiben'} frei.`);
    }
    /* Beispielinhalt ist nie druckfertig (rot): nie Erfundenes über einen echten Abend in den Druck (Prüfung 05.11.2026) */
    T.wartetAuf(K.a, K.z, doc.stueck, K.plan).forEach(q => rot({ gaenge: 'Die Gerichte sind', weine: 'Die Weine sind', ablauf: 'Der Ablauf ist', gaeste: 'Die Namen der Gäste sind' }[q] + ' noch ein Beispiel. Druckfertig wird das Blatt, wenn der Abendplan ' + (q === 'ablauf' ? 'ihn' : 'sie') + ' führt oder du ' + (q === 'ablauf' ? 'ihn' : 'sie') + ' hier überschreibst.'));
    if (doc.ueberdeckt && doc.ueberdeckt.length) {
      const n = doc.ueberdeckt, gr = T.FORMATE[doc.formatKey], groesser = st.formate.map(k => T.FORMATE[k]).find(F => F.b * F.h > gr.b * gr.h && (F.b > F.h) === (gr.b > gr.h));
      rot(`Auf dem Tischplan berühren sich Namen: ${n.slice(0, 4).join(', ')}${n.length > 4 ? ' und ' + (n.length - 4) + ' weitere' : ''}. ${groesser ? 'Das Format «' + groesser.name + '» wählen, ' : ''}weniger Plätze setzen oder den Namen für die Karte kürzen (Reiter «Inhalt»).`);
    }
    /* Namen auf dem Tischplan liest man im Stehen, oft aus einem Meter: unter 4 mm (etwa 11 pt) meldet die Prüfung das mit den Wegen,
       die helfen (Prüfung 5, Punkt 21). Sind sie schon als «berühren sich» gemeldet, nicht doppelt. */
    if (doc.stueck === 'tischplan' && doc.namenGr && doc.namenGr < 4 - 1e-6 && !(doc.ueberdeckt && doc.ueberdeckt.length)) {
      /* nur Wege nennen, die wirklich auf 4 mm führen: lange Tafel, A3 hoch, beides (vorgerechnet) */
      const SZ = doc.sitz || {}, wege = [], mm = v => v.toFixed(1).replace('.', ',') + ' mm';
      const probe = (form, fk) => { const z2 = JSON.parse(JSON.stringify(K.z || {})); z2.sitz = Object.assign({}, z2.sitz, { form }); return T.setzeDruck(K.a, z2, 'tischplan', fk).namenGr || 0; };
      const versuche = [];
      if (SZ.form === 'rund') versuche.push(['lang', doc.formatKey, 'im Reiter «Plätze» die lange Tafel wählen']);
      if (doc.formatKey !== 'a3h') versuche.push([SZ.form, 'a3h', 'das Format «A3 hoch» wählen']);
      if (SZ.form === 'rund' && doc.formatKey !== 'a3h') versuche.push(['lang', 'a3h', 'die lange Tafel auf «A3 hoch» wählen']);
      for (const [form, fk, text] of versuche) { const g = probe(form, fk); if (g >= 4) { wege.push(`${text} (Namen ${mm(g)})`); if (versuche.length === 3 && form === 'lang' && fk === doc.formatKey) break; } }
      wege.push('lange Namen für die Karte kürzen (Reiter «Inhalt»)');
      rot(`Die Namen auf dem Tischplan sind nur ${doc.namenGr.toFixed(1).replace('.', ',')} mm gross; im Stehen liest man sie erst ab 4 mm. ${wege.join(', ').replace(/^i/, 'I').replace(/^d/, 'D').replace(/, ([^,]*)$/, ' oder $1')}.`);
    }
    /* Nichts liegt halb unter etwas anderem (Fehlerbuch 28.10.2026): zwei Texte derselben Seite dürfen sich nicht decken. Erst die Kästen, nur bei
       Verdacht die wirkliche Breite der Zeilen messen (mittig oder bündig gesetzt). */
    const tinte = (el, h) => { const m = T.mess(el), bw = Math.min(el.w, m.bw), x = el.ausr === 'l' ? el.x : el.ausr === 'r' ? el.x + el.w - bw : el.x + (el.w - bw) / 2; return { x, y: el.y, w: bw, h }; };
    doc.seiten.forEach((s, i) => {
      const tx = s.el.filter(el => el.typ === 'text' && !el.dreh), gemeldet = new Set();
      if (tx.length > 80) return;
      for (let a = 0; a < tx.length; a++) for (let b = a + 1; b < tx.length; b++) {
        const A = tx[a], Bx = tx[b], ha = A.h || T.mess(A).h, hb = Bx.h || T.mess(Bx).h;
        const ka = { x: A.x, y: A.y, w: A.w, h: ha }, kb = { x: Bx.x, y: Bx.y, w: Bx.w, h: hb };
        if (!(ka.x < kb.x + kb.w && kb.x < ka.x + ka.w && ka.y + .2 < kb.y + kb.h && kb.y + .2 < ka.y + ka.h)) continue;
        const ia = tinte(A, ha), ib = tinte(Bx, hb);
        if (!(ia.x < ib.x + ib.w && ib.x < ia.x + ia.w && ia.y + .2 < ib.y + ib.h && ib.y + .2 < ia.y + ia.h)) continue;
        if (doc.ueberdeckt && doc.ueberdeckt.length && /^gast:/.test(A.key || '') && /^gast:/.test(Bx.key || '')) continue;   // schon oben gemeldet
        const k = (A.key || '') + '|' + (Bx.key || ''); if (gemeldet.has(k)) continue; gemeldet.add(k);
        const kz = el => `«${el.text.replace(/\s+/g, ' ').slice(0, 26)}${el.text.length > 26 ? '…' : ''}»`;
        rot(`${doc.seiten.length > 1 ? `Seite ${i + 1}: ` : ''}${kz(A)} und ${kz(Bx)} liegen übereinander. Einen der beiden kürzen oder eine Grösse kleiner stellen.`, A.key);
      }
    });
    doc.seiten.forEach((s, i) => {
      const seite = doc.seiten.length > 1 ? `Seite ${i + 1}: ` : '';
      for (const el of s.el) {
        if (el.typ !== 'text') continue;
        const kurz = `«${el.text.replace(/\s+/g, ' ').slice(0, 34)}${el.text.length > 34 ? '…' : ''}»`;
        const ph = el.text.match(/\[[^\]]*\]/g);
        if (ph) rot(`${seite}Platzhalter ${ph.join(', ')} noch ausfüllen`, el.key);
        if (el.sperr > .08 + 1e-6) rot(`${seite}${kurz} ist weiter als .08 em gesperrt und zerfällt im PDF.`, el.key);
        const min = el.gross ? 1.9 : 2;
        if (el.gr < min - .01) rot(`${seite}${kurz} ist ${el.gr.toFixed(2).replace('.', ',')} mm gross, mindestens ${String(min).replace('.', ',')} mm.`, el.key);
        if (!bogen && !el.dreh) {
          const h = el.h || T.mess(el).h;
          if (el.x < Sx - .01 || el.y < Sx - .01 || el.x + el.w > f.b - Sx + .01 || el.y + h > f.h - Sx + .01) gelb(`${seite}${kurz} liegt näher als ${Sx} mm am Rand und kann beim Schneiden angeschnitten werden.`, el.key);
        }
      }
    });
    return out;
  };
})();

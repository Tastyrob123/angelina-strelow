/* Tischkarten & Menü · Satz. Kern aus dem Satz der Plakatwerkstatt (satz.js: Element-Modell in mm, Seite als DOM, Text messen, Glyphen fürs PDF),
   dazu die Aufbauten der sieben Drucksachen eines Abends. Alle Masse in Millimetern; Ursprung (0,0) = obere linke Ecke des Endformats,
   der Beschnitt (3 mm) liegt davor. Vorschau, PDF und Bild kommen aus demselben Satz, deshalb sind sie gleich.

   Elemente: text {rolle, gr (mm), zeile, sperr (höchstens .08 em, Master 9), ausr, farbe, gross, text, key, gruppe, dreh}
             linie · rahmen {r} · flaeche {tapete} · zeichen {z} · motiv {motiv, staerke} · hilfe (nur am Bildschirm: Falz, freier Platz)
   Jedes Textelement trägt seinen Schlüssel (key), damit das Werkzeug Änderungen im Blatt dem richtigen Text zuordnet. */
(function () {
  const T = window.TI = window.TI || {};
  T.B = 3;          // Beschnitt
  T.SICHER = 4;     // so weit vom Rand bleibt Text sicher vor dem Schneiden
  T.MAX_PLAETZE = 24;   // eine Tafel; bei mehr Gästen sitzen die übrigen an weiteren Tischen frei (Hinweis im Reiter «Plätze» und in der Druckprüfung)
  T.SCHRIFT = {
    titel: { fam: 'TI-titel', datei: 'schrift/DellaRespira.ttf', name: 'Della Respira' },
    text: { fam: 'TI-text', datei: 'schrift/Montserrat-300.ttf', name: 'Montserrat Light' },
    kap: { fam: 'TI-kap', datei: 'schrift/Montserrat-500.ttf', name: 'Montserrat Medium' },
    mono: { fam: 'TI-mono', datei: 'schrift/DMMono-400.ttf', name: 'DM Mono' }
  };
  T.basis = (function () { const s = document.currentScript; return s ? new URL('.', s.src).href : '/angelina-strelow/werkzeuge/tisch/'; })();
  T.TAPETE = { dunkel: '/angelina-strelow/werkzeuge/assets/zeichen/tapete-dunkel-a.svg', hell: '/angelina-strelow/werkzeuge/assets/zeichen/tapete-hell-a.svg', rapport: 22 };

  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  T.esc = esc;
  /* Zeilenfall (Prüfung 6, Punkt 26): Zeilen werden ausgeglichen gesetzt (text-wrap: balance), und was zusammengehört, bricht nie:
     Namenszusätze mit dem Namen («von der Ahe»), eine Herkunft nach dem Komma («Saar, Mosel»), Zahl und Einheit. Nur im Satz, die Daten bleiben. */
  const NB = '\u00A0';
  T.zusammen = t => String(t == null ? '' : t)
    .replace(/(?<=^|\s)(von|van|vom|zu|zur|zum|de|der|den|di|da|du|del|le|la|ten|ter)[ \t]+(?=[^\s]{1,8}(\s|$))/gi, '$1' + NB)   // nur mit kurzen Wörtern, ein langer Name bleibt teilbar
    .replace(/,\s+(?=[A-ZÄÖÜ][a-zäöüß]+$)/, ',' + NB)
    .replace(/(\d)\s+(?=(mm|cm|g|kg|l|cl|ml|Uhr)\b)/g, '$1' + NB);
  /* Farbe a zu einem Teil t in Richtung b gemischt (leise Tinte für Lesetext, wie auf ihren Drucksachen) */
  T.misch = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.substr(i, 2), 16) * (1 - t) + parseInt(b.substr(i, 2), 16) * t).toString(16).padStart(2, '0')).join('').toUpperCase();

  /* ---------- Daten des Abends lesen (Abendplan oder beschriftetes Beispiel) ---------- */
  const W = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const M = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  T.datumLang = d => { const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(d || ''); if (!m) return ''; const t = new Date(+m[1], +m[2] - 1, +m[3]); return W[t.getDay()] + ', ' + t.getDate() + '. ' + M[t.getMonth()] + ' ' + m[1]; };
  T.datumKurz = d => { const m = /^(\d{4})-(\d\d)-(\d\d)/.exec(d || ''); if (!m) return ''; return +m[3] + '. ' + M[+m[2] - 1] + ' ' + m[1]; };
  const s = v => (v == null ? '' : String(v)).trim();
  const erst = (o, ks) => { for (const k of ks) if (o && s(o[k])) return s(o[k]); return ''; };

  /* Felder des Abendplans lesen (Format: abendplan/DATEN.md, Der Abendplan 05.11.2026; Fehlerbuch 9: jedes Feld kann fehlen).
     plan.gaenge[{id, name (Gang), gericht, beschreibung, koch}] · plan.weine[{id, zu: empfang|<gang-id>|tisch|digestif, art, name, weingut, rebsorte, jahrgang, herkunft, notiz}]
     plan.gaeste[{id, name, karte, platz, ehrengast}] · plan.ablauf[{zeit, art, was, intern}] · plan.titel.
     Fehlt ein Feld (etwa Gerichte bei Klaus und Tanja, die nicht belegt sind), springt das beschriftete Beispiel aus beispiele.js ein, Feld für Feld. */
  const ZU = { empfang: 'Zum Empfang', tisch: 'Den ganzen Abend', digestif: 'Zum Ausklang' };
  const zuDem = n => {   // «Erster Gang» → «Zum ersten Gang», «Vorspeise» → «Zur Vorspeise», «Süsses» → «Zum Süssen»
    const t = s(n); if (!t) return '';
    const m = /^(\S+)er\s+(Gang)$/i.exec(t); if (m) return 'Zum ' + m[1].toLowerCase() + 'en ' + m[2];
    if (/sses$/.test(t)) return 'Zum ' + t.replace(/es$/, 'en');
    return (/e$/.test(t) ? 'Zur ' : 'Zum ') + t;
  };
  function bspNorm(b) {   // Beispiele (beispiele.js) in dieselbe Form wie der Abendplan
    if (!b) return {};
    let n = 0;   // Ids wie im Abendplan: g1 ist der erste Gang am Tisch, der Empfang zählt nicht mit
    const gaenge = (b.gaenge || []).map(g => ({ id: /empfang/i.test(g.gang || '') ? 'e' : 'g' + (++n), name: g.gang, gericht: g.name, beschreibung: g.beschreibung, wein: g.wein }));
    const weine = (b.weine || []).map((w, j) => { const gi = gaenge.findIndex(g => g.wein === j); return { id: 'w' + (j + 1), zu: gi >= 0 ? gaenge[gi].id : (/empfang|garten|überraschung/i.test(w.zu || '') ? 'empfang' : ''), zuText: w.zu, name: w.name, jahrgang: w.jahrgang, herkunft: w.herkunft }; });
    return { gaenge, weine, gaeste: (b.gaeste || []).map((g, i) => ({ id: 'q' + (i + 1), name: g.name })), ablauf: b.ablauf || [], kueche: b.kueche };
  }
  T.planVon = function (a) {
    const p = (a && a.plan) || {}, bsp = bspNorm(T.BEISPIEL_PLAN[a.id] || T.BEISPIEL_PLAN[T.BEISPIEL_ANLASS[(a.anfrage || {}).anlass] || 'a-261014-sk']);
    const L = x => (Array.isArray(x) ? x.filter(v => v && typeof v === 'object') : []);
    const r = { beispiel: {}, titel: s(p.titel) };
    /* Gänge: echte Liste, fehlende Gerichte aus dem Beispiel (dieselbe Stelle, ohne den Empfang) */
    const pg = L(p.gaenge), bg = (bsp.gaenge || []).filter(g => !/empfang/i.test(g.name || ''));
    if (pg.length) {
      let fehlt = 0;
      r.gaenge = pg.map((g, i) => { const ger = s(g.gericht); if (!ger) fehlt++; const b = bg[i] || {}; return { id: s(g.id) || 'g' + (i + 1), gang: s(g.name), name: ger || s(b.gericht) || s(g.name), beschreibung: ger ? s(g.beschreibung) : s(g.beschreibung) || s(b.beschreibung), koch: s(g.koch), bsp: !ger }; });
      r.beispiel.gaenge = fehlt > 0;
    } else { r.gaenge = (bsp.gaenge || []).map(g => ({ id: g.id, gang: s(g.name), name: s(g.gericht), beschreibung: s(g.beschreibung), koch: '', bsp: true })); r.beispiel.gaenge = true; }
    /* Weine (ohne Wasser): Name, sonst Rebsorte, sonst das Beispiel zum selben Gang */
    const pw = L(p.weine).filter(w => s(w.art) !== 'wasser');
    if (pw.length) {
      let fehlt = 0;
      r.weine = pw.map((w, i) => {
        let name = s(w.name) || s(w.rebsorte), b = null;
        if (!name) { b = (bsp.weine || []).find(x => x.zu === s(w.zu)) || (bsp.weine || [])[i] || {}; name = s(b.name); fehlt++; }
        return { id: s(w.id) || 'w' + (i + 1), zu: s(w.zu), name, weingut: s(w.weingut), jahrgang: s(w.jahrgang) || (b ? s(b.jahrgang) : ''), herkunft: s(w.herkunft) || (b ? s(b.herkunft) : ''), notiz: b ? '' : s(w.notiz), art: s(w.art), bsp: !!b };
      });
      r.beispiel.weine = fehlt > 0;
    } else { r.weine = (bsp.weine || []).map(w => Object.assign({}, w, { bsp: true })); r.beispiel.weine = true; }
    r.weine.forEach(w => {
      const g = r.gaenge.find(x => x.id === w.zu);
      w.zuLabel = ZU[w.zu] || (g ? zuDem(g.gang || g.name) : '') || s(w.zuText);
      if (w.zuLabel && w.name.toLowerCase().includes(w.zuLabel.toLowerCase().replace(/^(zu[mr]|den)\s+/, ''))) w.zuLabel = '';   // «Sekt zum Empfang» trägt es schon im Namen
    });
    /* Gäste: Name auf der Karte, Platz aus dem Abendplan */
    const pq = L(p.gaeste).filter(g => s(g.name));
    r.gaeste = pq.length ? pq.map((g, i) => ({ id: s(g.id) || 'q' + (i + 1), name: s(g.karte) || s(g.name), voll: s(g.name), platz: s(g.platz), ehrengast: !!g.ehrengast })) : (bsp.gaeste || []).map(g => ({ id: g.id, name: g.name, voll: g.name, platz: '' }));
    r.beispiel.gaeste = !pq.length;
    /* Ablauf für die Gäste: ohne Internes, ohne Ankommen und Aufräumen */
    const pa = L(p.ablauf).filter(x => s(x.was) && !x.intern && !['ankommen', 'aufraeumen'].includes(s(x.art)));
    r.ablauf = pa.length ? pa.map(x => ({ zeit: s(x.zeit), was: s(x.was) })) : (bsp.ablauf || []).map(x => ({ zeit: s(x.zeit), was: s(x.was) }));
    r.beispiel.ablauf = !pa.length;
    /* Küche: wer kocht, aus den Gängen */
    const koeche = [...new Set(r.gaenge.map(g => g.koch).filter(Boolean))];
    if (koeche.length) r.kueche = koeche.every(k => /^caterer$/i.test(k)) ? 'Aus der Küche des Caterers' : koeche.some(k => /^gastgeber$/i.test(k)) ? 'Aus der Küche der Gastgeber' : 'Gekocht von ' + koeche.join(' und ');
    else r.kueche = pg.length ? '' : bsp.kueche || '';
    return r;
  };

  /* Worauf eine Drucksache noch wartet: Teile, die nur als Beispiel dastehen (nie Erfundenes über einen echten Abend als druckfertig; Prüfung 05.11.2026).
     Ein Beispiel zählt nicht mehr, wenn es auf diesem Blatt ausgeblendet oder von Hand überschrieben ist. Ergebnis: ['gaenge', 'weine', …] */
  T.QUELLE_NAME = { gaenge: 'Gerichte', weine: 'Weine', ablauf: 'Ablauf', gaeste: 'Namen der Gäste' };
  T.wartetAuf = function (a, zz, k, plan) {
    plan = plan || T.planVon(a);
    const st = ((zz || {}).stuecke || {})[k] || {}, tx = st.texte || {}, aus = st.aus || {}, out = [];
    const hat = key => Object.prototype.hasOwnProperty.call(tx, key);
    const stil = T.STILE[(zz || {}).stil] || T.STILE[T.stilVorschlag(a)] || {};
    if (k === 'menue') {
      if (plan.gaenge.some((g, i) => g.bsp && !aus['g' + i] && !(hat('g' + i + '.name') && (!g.beschreibung || hat('g' + i + '.text'))))) out.push('gaenge');
      if ((st.weinImMenue || stil.weinImMenue) && plan.gaenge.some((g, i) => !aus['g' + i] && !hat('g' + i + '.wein') && plan.weine.some(w => w.bsp && w.zu === g.id))) out.push('weine');
    } else if (k === 'weine') {
      if (plan.weine.some((w, i) => w.bsp && !aus['w' + i] && !hat('w' + i + '.name'))) out.push('weine');
    } else if (k === 'begruessung') {
      if (plan.beispiel.ablauf && plan.ablauf.some((x, i) => !aus['a' + i] && !hat('a' + i + '.was'))) out.push('ablauf');
    } else if (['tischkarten', 'tischplan', 'memory'].includes(k)) {
      if (plan.beispiel.gaeste && plan.gaeste.length) out.push('gaeste');
    }
    return out;
  };

  T.monogramm = function (name) {
    const n = s(name).replace(/^(Familie|Fam\.)\s+/i, '');
    const teile = n.split(/\s+(?:und|&)\s+/i);
    if (teile.length > 1) return teile.map(t => t.charAt(0).toUpperCase()).join(' & ');
    const w = n.split(/\s+/).filter(Boolean);
    return w.length > 1 ? w[0].charAt(0) + w[w.length - 1].charAt(0) : n.charAt(0);
  };

  /* ---------- ein Element als DOM (wie DS.elementDom im Vorbild) ---------- */
  T.elementDom = function (el, S, o = {}) {
    const d = document.createElement('div');
    d.className = 'el el-' + el.typ + (el.key ? ' el-key' : '');
    if (el.key) d.dataset.key = el.key;
    if (el.platz != null) d.dataset.platz = el.platz;
    const B = o.ohneBeschnitt ? 0 : T.B;
    let st = `position:absolute;left:${(el.x + B) * S}px;top:${(el.y + B) * S}px;`;
    if (el.typ === 'text') {
      const f = T.SCHRIFT[el.rolle].fam;
      st += `width:${el.w * S}px;font-family:'${f}','TI-text';font-size:${el.gr * S}px;line-height:${el.zeile || 1.25};letter-spacing:${el.sperr || 0}em;` +
        `text-align:${{ l: 'left', c: 'center', r: 'right' }[el.ausr || 'c']};color:${el.farbe};` +
        `white-space:pre-wrap;overflow-wrap:break-word;text-wrap:balance;font-variant-ligatures:none;font-feature-settings:'liga' 0,'clig' 0,'locl' 0;font-kerning:normal;` +
        (el.gross ? 'text-transform:uppercase;' : '') + (el.dreh && !o.ungedreht ? 'transform:rotate(180deg);' : '');
      d.textContent = T.zusammen(el.text);
    } else if (el.typ === 'linie') {
      st += `width:${el.w * S}px;height:${Math.max(el.h || 0, el.staerke) * S}px;background:${el.farbe};`;
    } else if (el.typ === 'rahmen') {
      st += `width:${el.w * S}px;height:${el.h * S}px;border:${el.staerke * S}px solid ${el.farbe};border-radius:${(el.r || 0) * S}px;box-sizing:border-box;`;
    } else if (el.typ === 'flaeche') {
      st += `width:${el.w * S}px;height:${el.h * S}px;background-color:${el.farbe};border-radius:${(el.r || 0) * S}px;`;
      if (el.tapete) st += `background-image:url('${T.TAPETE[el.tapete]}');background-size:${T.TAPETE.rapport * S}px auto;background-position:${-(el.x - (el.tx || 0)) * S}px ${-(el.y - (el.ty || 0)) * S}px;`;
    } else if (el.typ === 'bild') {   // Foto, randlos zugeschnitten wie im PDF (cover, Lage fx/fy)
      st += `width:${el.w * S}px;height:${el.h * S}px;background:#8C8F71 url('${T.bildUrl(el.bild)}') ${(el.fx == null ? .5 : el.fx) * 100}% ${(el.fy == null ? .5 : el.fy) * 100}% / cover no-repeat;`;
    } else if (el.typ === 'zeichen') {
      const z = window.TI_ZEICHEN[el.z];
      st += `width:${el.w * S}px;height:${el.w * z.verh * S}px;`;
      d.innerHTML = `<svg viewBox="${z.vb.join(' ')}" preserveAspectRatio="xMidYMid meet" style="display:block;width:100%;height:100%"><g fill="${el.farbe}">${z.pfade.map(p => `<path d="${p}"/>`).join('')}</g></svg>`;
    } else if (el.typ === 'motiv') {
      const m = T.MOTIVE[el.motiv];
      st += `width:${el.w * S}px;height:${el.w * S}px;`;
      d.innerHTML = `<svg viewBox="0 0 48 48" style="display:block;width:100%;height:100%;overflow:visible"><g fill="none" stroke="${el.farbe}" stroke-width="${el.staerke * 48 / el.w}" stroke-linecap="round" stroke-linejoin="round">${m.d.map(p => `<path d="${p}"/>`).join('')}</g></svg>`;
    } else if (el.typ === 'hilfe') {
      st += `width:${el.w * S}px;height:${Math.max(el.h, .01) * S}px;` + (el.art === 'falz' ? `border-top:${Math.max(1, .2 * S)}px dashed ${el.farbe};opacity:.55;` : `font:500 ${2.2 * S}px/${el.h * S}px 'TI-text';text-align:center;color:${el.farbe};opacity:.6;`);
      if (el.text) d.textContent = el.text;
    }
    d.style.cssText = st;
    return d;
  };

  T.seiteDom = function (doc, i, S, o = {}) {
    const f = doc.format, sei = doc.seiten[i], B = T.B;
    const p = document.createElement('div');
    p.className = 'blatt';
    p.setAttribute('data-wo-bw-nie', '');
    p.style.cssText = `position:relative;width:${(f.b + 2 * B) * S}px;height:${(f.h + 2 * B) * S}px;overflow:hidden;background-color:${sei.grund};`;
    for (const el of sei.el) if (!(o.druck && el.typ === 'hilfe')) p.appendChild(T.elementDom(el, S, o));
    return p;
  };

  /* ---------- Text messen (Höhe in mm) ---------- */
  let wirt;
  T.mess = function (el) {
    if (wirt && !wirt.isConnected) document.body.appendChild(wirt);
    if (!wirt) { wirt = document.createElement('div'); wirt.style.cssText = 'position:absolute;left:-99999px;top:0;visibility:hidden;pointer-events:none'; document.body.appendChild(wirt); }
    const S = 10, d = T.elementDom(Object.assign({}, el, { x: 0, y: 0, dreh: 0 }), S, { ohneBeschnitt: true });
    wirt.appendChild(d);
    const h = d.getBoundingClientRect().height / S;
    const sp = document.createElement('span'); sp.textContent = d.textContent; d.textContent = ''; d.appendChild(sp);
    let bw = 0, zeilen = 0, letzte = -1e9;
    for (const r of sp.getClientRects()) { bw = Math.max(bw, r.width); if (r.top > letzte + 1) { zeilen++; letzte = r.top; } }
    wirt.removeChild(d);
    return { h, bw: bw / S, zeilen };
  };
  T.elHoehe = el => el.typ === 'text' ? (el.h || T.mess(el).h) : el.typ === 'zeichen' ? el.w * window.TI_ZEICHEN[el.z].verh : el.typ === 'motiv' ? el.w : el.typ === 'linie' ? Math.max(el.h || 0, el.staerke) : el.h;

  /* Glyphen einer gesetzten Textbox: jede Zeichenposition in mm (für das PDF, wie im Vorbild) */
  T.glyphen = function (d, S, ux, uy) {
    const out = [], r = document.createRange();
    const tn = [...d.childNodes].filter(n => n.nodeType === 3);
    let leer = false;   // stand vor diesem Zeichen ein Leerraum? (fürs PDF: Wörter als ein Textlauf mit echtem Leerzeichen)
    for (const n of tn) {
      const t = n.textContent;
      for (let i = 0; i < t.length; i++) {
        const ch = t[i];
        if (/\s/.test(ch)) { leer = true; continue; }
        let j = i + 1;
        if (ch.charCodeAt(0) >= 0xd800 && ch.charCodeAt(0) < 0xdc00) j++;
        r.setStart(n, i); r.setEnd(n, j);
        const rc = [...r.getClientRects()].filter(x => x.width > 0);
        if (!rc.length) continue;
        out.push({ ch: t.slice(i, j), x: (rc[0].left - ux) / S, top: (rc[0].top - uy) / S, w: rc[0].width / S, leer });
        leer = false;
        i = j - 1;
      }
    }
    return out;
  };

  /* ---------- Gestaltung eines Abends: Farben und Schrift-Faktoren ---------- */
  T.kontext = function (a, z, stueck, formatKey) {
    z = z || {};
    const stilKey = T.STILE[z.stil] ? z.stil : T.STILE[T.stilVorschlag(a)] ? T.stilVorschlag(a) : 'schlicht', stil = T.STILE[stilKey];
    const grund = T.hex(stil.grund), tinte = T.hex(stil.tinte);
    const dunkel = T.FARBEN[stil.grund].dunkel;
    let akz = z.akzent && T.AKZENTE[dunkel ? 'dunkel' : 'hell'].includes(z.akzent) ? z.akzent : stil.akzent;
    const akzent = T.hex(akz);
    const etikett = T.kontrast(akzent, grund) >= 4.5 ? akzent : tinte;
    const st = (z.stuecke && z.stuecke[stueck]) || {};
    const plan = T.planVon(a);
    const g = k => 1 + T.STUFEN.schritt * Math.max(T.STUFEN.min, Math.min(T.STUFEN.max, +((st.groesse || {})[k]) || 0));
    const texte = st.texte || {};
    return {
      a, z, st, stil, stilKey, plan, grund, tinte, akzent, etikett, dunkel, stueck, formatKey,
      leise: T.misch(tinte, grund, .26), f: 1, g,
      text: (key, std) => (Object.prototype.hasOwnProperty.call(texte, key) ? texte[key] : std),
      aus: key => !!((st.aus || {})[key]),
      gastName: name => (Object.prototype.hasOwnProperty.call(texte, 'gast:' + name) ? texte['gast:' + name] : name),
      gastgeber: s(a.gastgeber && a.gastgeber.name),
      mono: s(z.monogramm) || T.monogramm(a.gastgeber && a.gastgeber.name),
      kopf: z.kopf || stil.kopf || 'zeile',
      wortmarke: z.wortmarke !== false
    };
  };

  /* Text-Element bauen (null, wenn der Text leer gesetzt ist). Versalzeilen setzt die Montserrat Medium (Rolle kap), wie auf ihren Drucksachen. */
  function tx(K, key, std, rolle, gruppe, gr, o = {}) {
    const t = o.fest ? std : K.text(key, std);
    if (t == null || s(t) === '') return null;
    if (o.gross && rolle === 'text') rolle = 'kap';
    const sperr = Math.min(.08, o.sperr || (o.gross ? .08 : 0));
    const minGr = o.gross ? 1.95 : rolle === 'titel' ? 2.4 : 2.05;   // nie unter die Mindestgrösse der Druckprüfung (Fehlerbuch 10a: 2 mm, Versalien 1,9 mm)
    return { typ: 'text', id: key, key, std: o.fest ? null : std, rolle, gruppe, gr: Math.max(minGr, gr * K.f * K.g(gruppe)), zeile: o.zeile || (rolle === 'titel' ? 1.1 : rolle === 'kap' ? 1.3 : 1.5), sperr, ausr: o.ausr || 'c', farbe: o.farbe || K.tinte, gross: !!o.gross, text: String(t), dreh: o.dreh || 0, platz: o.platz };
  }
  T.tx = tx;

  /* Ornamente der Marke: ihre Fliege (hoch), ihr Siegel (Oval mit Namen), die Raute aus der Fliege als kleiner Trenner */
  const zeichenH = (z, w) => w * window.TI_ZEICHEN[z].verh;
  function fliege(K, cx, w) { return { el: { typ: 'zeichen', z: 'fliege', x: cx - w / 2, w, farbe: K.akzent } }; }
  function siegel(K, cx, w) { return { typ: 'zeichen', z: 'siegel', x: cx - w / 2, w, farbe: K.etikett === K.akzent ? K.akzent : K.tinte }; }

  /* Trenner zwischen Gängen: kurz = zwei Haarlinien mit der Raute ihrer Fliege dazwischen, doppel = zwei feine Linien, leer = nur Luft */
  function trenner(K, cx, art, breite) {
    const b = (breite || 9) * Math.max(.8, K.f), st = .18;
    if (art === 'leer') return { els: [], h: 0 };
    if (art === 'doppel') { const w = b * 1.6; return { els: [{ typ: 'linie', x: cx - w / 2, y: 0, w, staerke: st, farbe: K.akzent }, { typ: 'linie', x: cx - w / 2, y: 1.2, w, staerke: st, farbe: K.akzent }], h: 1.2 + st }; }
    const r = 2.6;
    return { els: [{ typ: 'linie', x: cx - r / 2 - 1.6 - b, y: r / 2 - st / 2, w: b, staerke: st, farbe: K.akzent }, { typ: 'motiv', motiv: 'raute', x: cx - r / 2, y: 0, w: r, staerke: .16, farbe: K.akzent }, { typ: 'linie', x: cx + r / 2 + 1.6, y: r / 2 - st / 2, w: b, staerke: st, farbe: K.akzent }], h: r };
  }

  /* Grund und Rahmen eines Blatts oder einer Karte; gibt die Innenfläche für den Satz zurück. Ihre Rahmenlinie ist fein (0,25 mm) und steht
     mit gleichem Abstand zu allen Kanten, wie auf ihren Drucksachen. */
  T.rahmen = function (K, x, y, w, h, o = {}) {
    const els = [], m = o.m != null ? o.m : Math.max(3.2, Math.min(10, Math.min(w, h) * .05)), st = K.stil, lin = K.akzent;
    const bl = o.bluten != null ? o.bluten : T.B;
    if (st.tapete) {
      els.push({ typ: 'flaeche', x: x - bl, y: y - bl, w: w + 2 * bl, h: h + 2 * bl, farbe: K.grund, tapete: st.tapete, tx: x - bl, ty: y - bl });
      els.push({ typ: 'flaeche', x: x + m + .6, y: y + m + .6, w: w - 2 * m - 1.2, h: h - 2 * m - 1.2, farbe: K.grund });
    } else if (o.grundFlaeche) els.push({ typ: 'flaeche', x: x - bl, y: y - bl, w: w + 2 * bl, h: h + 2 * bl, farbe: K.grund });
    const fein = .25, d2 = Math.max(.9, Math.min(1.6, m * .16));
    if (st.rahmen === 'einfach' || st.rahmen === 'rund') els.push({ typ: 'rahmen', x: x + m, y: y + m, w: w - 2 * m, h: h - 2 * m, staerke: fein, farbe: lin, r: st.rahmen === 'rund' ? Math.min(5, m * .7) : 0 });
    else if (st.rahmen === 'doppelt') { els.push({ typ: 'rahmen', x: x + m, y: y + m, w: w - 2 * m, h: h - 2 * m, staerke: fein, farbe: lin }); els.push({ typ: 'rahmen', x: x + m + d2, y: y + m + d2, w: w - 2 * m - 2 * d2, h: h - 2 * m - 2 * d2, staerke: .15, farbe: lin }); }
    else if (st.rahmen === 'kraeftig') { els.push({ typ: 'rahmen', x: x + m, y: y + m, w: w - 2 * m, h: h - 2 * m, staerke: .6, farbe: lin }); els.push({ typ: 'rahmen', x: x + m + d2 * 1.2, y: y + m + d2 * 1.2, w: w - 2 * m - 2.4 * d2, h: h - 2 * m - 2.4 * d2, staerke: .15, farbe: lin }); }
    else if (st.rahmen === 'band') { [0, d2].forEach(d => { els.push({ typ: 'linie', x: x + m, y: y + m + d, w: w - 2 * m, staerke: d ? .15 : fein, farbe: lin }); els.push({ typ: 'linie', x: x + m, y: y + h - m - d - fein, w: w - 2 * m, staerke: d ? .15 : fein, farbe: lin }); }); }
    const innen = st.rahmen === 'haar' ? m + 2 : m + (o.luft != null ? o.luft : Math.max(3, Math.min(11, Math.min(w, h) * .06)));
    return { els, m, box: { x: x + innen, y: y + innen, w: w - 2 * innen, h: h - 2 * innen } };
  };

  /* Spalte: Teile untereinander setzen. Restplatz geht zuerst in die dehnbaren Abstände (bis dehnMax je Abstand), der Rest oben und unten,
     die Gruppe leicht über der Mitte (optische Mitte). */
  function spalte(teile, box, luft) {
    luft = luft || 1;
    const t = teile.filter(Boolean).filter(x => x.el || (x.els && x.els.length) || x.platz);
    let summe = 0;
    t.forEach((x, i) => {
      if (x.el && x.el.typ === 'text') { if (x.el.w == null) { x.el.w = box.w; x.el.x = box.x; } x.h = T.mess(x.el).h; x.el.h = x.h; }
      else x.h = x.el ? T.elHoehe(x.el) : x.h || 0;
      summe += (i ? (x.vor || 0) * luft : 0) + x.h;
    });
    return {
      summe, passt: summe <= box.h + .01,
      setze(b2, dehnMax) {
        if (b2) box = b2;
        const dehn = t.filter((x, i) => i && x.dehn).length;
        let rest = Math.max(0, box.h - summe);
        const je = dehn ? Math.min(dehnMax == null ? 6 : dehnMax, rest * .6 / dehn) : 0; rest -= je * dehn;
        let y = box.y + rest / 2 - Math.min(rest / 2, box.h * .02);
        const out = [];
        t.forEach((x, i) => {
          if (i) y += (x.vor || 0) * luft + (x.dehn ? je : 0);
          if (x.el) { const e = x.el; e.y = y; if (e.x == null) e.x = box.x; if (e.w == null && e.typ === 'text') e.w = box.w; out.push(e); }
          if (x.els) x.els.forEach(e => out.push(Object.assign({}, e, { y: e.y + y })));
          y += x.h;
        });
        return out;
      }
    };
  }
  T.spalte = spalte;

  /* Satz in drei Zonen: Kopf oben an der Kante, Fuss unten, die Mitte (Gänge, Weine, Ablauf) im Raum dazwischen, mit grosszügigen Abständen.
     Wird es zu hoch, erst die Luft (bis auf die Hälfte), dann die Schrift (bis 80 %, nie unter die Mindestgrösse); sonst meldet die
     Druckprüfung «passt nicht». */
  function zonen(K, box, bau, o = {}) {
    /* [Schrift, Luft, Mitte auf ganzer Breite, Wachsen der Mitte]. Wachsen (o.wachsen): ist Platz, werden Gänge, Weine und Ablauf grösser
       gesetzt (K.w), bis sie die Karte füllen; dabei bleibt jeder dehnbare Abstand mindestens 6 mm (nie gequetscht, nie ein Loch). */
    const stufen = (o.wachsen || []).map(w => [1, 1, 0, w]).concat((o.stufen || [[1, 1], [1, .85], [1, .7], [1, .6, 1], [.95, .55, 1], [.9, .5, 1], [.85, .45, 1], [.8, .4, 1], [.76, .38, 1], [.72, .35, 1], [.68, .3, 1], [.64, .25, 1]]).map(x => [x[0], x[1], x[2], 1]));
    let r, mw, mx, wachs = 1;
    for (const [f, l, breit, w] of stufen) {
      wachs = w;
      K.f = f; K.l = l; K.w = w;
      mw = breit ? box.w : Math.min(box.w, o.mitteBreite || box.w); mx = box.x + (box.w - mw) / 2;
      const z = bau(K), luecke = (o.luecke || 9) * l;
      const sk = spalte(z.kopf, box, l), sm = spalte(z.mitte, { x: mx, y: box.y, w: mw, h: box.h }, l), sf = spalte(z.fuss || [], box, l);
      const reserve = w > 1 ? z.mitte.filter((x, i) => i && x && x.dehn).length * 6 + 8 : 0;
      const summe = sk.summe + sm.summe + sf.summe + (sm.summe ? 2 * luecke : luecke) + reserve;
      r = { sk, sm, sf, luecke, passt: summe <= box.h + .01 };
      if (r.passt) break;
    }
    K.w = 1;
    const { sk, sm, sf, luecke } = r;
    const els = sk.setze({ x: box.x, y: box.y, w: box.w, h: sk.summe }, 0)
      .concat(sf.setze({ x: box.x, y: box.y + box.h - sf.summe, w: box.w, h: sf.summe }, 0));
    const y0 = box.y + sk.summe + luecke, y1 = box.y + box.h - sf.summe - luecke;
    if (sm.summe) sm.setze({ x: mx, y: y0, w: mw, h: Math.max(sm.summe, y1 - y0) }, o.dehnMax || 16).forEach(e => els.push(e));
    return { els, passt: r.passt, faktor: K.f, wachs };
  }

  /* ---------- Kopf eines Blatts: Fliege oder Monogramm, Versalzeile, Titel gross in Della Respira, Datum leise ---------- */
  function kopfTeile(K, cx, w, o) {
    const out = [], G = o.gr;
    if (K.kopf === 'monogramm' && !K.aus('kopf.mono')) out.push({ el: tx(K, 'kopf.mono', K.mono, 'titel', 'titel', G.mono, { farbe: K.akzent === K.etikett ? K.akzent : K.tinte, zeile: 1 }) });
    else out.push(fliege(K, cx, G.fliege));
    if (K.kopf === 'namen') out.push({ el: tx(K, 'kopf.namen', K.gastgeber, 'titel', 'gericht', G.namen, { farbe: K.etikett }), vor: 4.5 });
    else out.push({ el: tx(K, 'kopf.zeile', o.zeile, 'text', 'etikett', G.etikett, { gross: true, farbe: K.etikett }), vor: 5 });
    out.push({ el: tx(K, 'kopf.titel', o.titel, 'titel', 'titel', G.titel * (o.titelF || 1)), vor: K.kopf === 'namen' ? 3.6 : 3.2 });
    if (o.datum) out.push({ el: tx(K, 'kopf.datum', o.datum, 'text', 'etikett', G.datum, { farbe: K.leise }), vor: 2.4 });
    return out.filter(x => x.el);
  }

  function fussTeile(K, cx, o) {
    const out = [];
    if (o.zeile) { const e = tx(K, 'fuss.zeile', o.zeile, 'text', 'text', o.gr.fuss, { farbe: K.leise }); if (e) out.push({ el: e }); }
    if (K.wortmarke && !K.aus('fuss.marke')) out.push({ el: siegel(K, cx, o.gr.siegel * Math.max(.6, K.f)), vor: out.length ? 5 : 0 });
    return out;
  }

  /* Grössen je Format (Grundwerte für A5, mm); lang, A4 und A3 skalieren. Titel gross, Gerichte deutlich, Lesetext ruhig. */
  function masse(fk) {
    const k = { a5h: 1, lang: .78, a4h: 1.32, a4q: 1.22, a3h: 1.8, a3q: 1.7 }[fk] || 1;
    return { k, titel: 17 * k, gericht: 6.3 * k, text: 3.15 * k, etikett: 2.4 * k, datum: 3.1 * k, mono: 15 * k, namen: 6.6 * k, fuss: 3.1 * k, siegel: 10.5 * k, fliege: 3.3 * k };
  }

  /* ---------- Die Drucksachen ---------- */
  const BAU = {};

  /* Listen auf Karten (Menü, Weinfolge): immer mit Luft, nie gequetscht (Robert, 06.11.2026: «sieht alles sehr gequetscht aus»).
     Die Schrift gibt höchstens um 10 %, die Luft um 20 % nach. Passt die Liste so nicht auf eine Seite, steht sie auf zwei oder mehr
     ganzen Seiten, jede mit eigenem Kopf, geteilt zwischen zwei Gängen, nie mitten in einem Gang (Fehlerbuch 10a: kein Abschnitt über den Umbruch). */
  const LUFTIG = [[1, 1], [1, .9], [.95, .85], [.9, .8]];
  function stueckeln(liste, n) { const out = [], je = liste.length / n; for (let k = 0; k < n; k++) out.push(liste.slice(Math.round(k * je), Math.round((k + 1) * je))); return out.filter(x => x.length); }
  function seitenweise(liste, bau) {
    let last;
    for (let n = 1; n <= Math.max(1, Math.min(4, liste.length)); n++) {
      /* zwei Seiten: jede Schnittstelle zwischen zwei Gängen probieren, die ausgewogenste, bei der beide Seiten passen */
      const schnitte = n === 2 ? Array.from({ length: liste.length - 1 }, (_, i) => i + 1).sort((a, b) => Math.abs(a - liste.length / 2) - Math.abs(b - liste.length / 2) || b - a).map(c => [liste.slice(0, c), liste.slice(c)]) : [stueckeln(liste, n)];
      for (const teile of schnitte) {
        const rs = (teile.length ? teile : [[]]).map((t, k, alle) => bau(t, k, alle.length));
        if (rs.every(r => r.passt)) return rs;
        last = rs;
      }
    }
    return last;
  }
  /* Titel eines Gerichts oder Weins: höchstens zwei Zeilen, dafür kleiner (bis 60 %, nie unter die Mindestgrösse) */
  function zweiZeilen(e, w, cx) {
    if (!e) return e;
    e.w = w; e.x = cx - w / 2;
    const g0 = e.gr;
    for (let k = 0; k < 14 && T.mess(e).zeilen > 2 && e.gr > Math.max(2.4, g0 * .6); k++) e.gr *= .96;
    return e;
  }
  /* Eine Grösse für alle Titel einer Karte: die, bei der auch der längste auf zwei Zeilen passt (gleiche Rangordnung) */
  function titelFaktor(K, texte, gr, w) {
    let f = 1;
    const f0 = K.f; K.f = 1;
    texte.filter(Boolean).forEach(t => { const e = tx(K, '_', t, 'titel', 'gericht', gr, { fest: true }); if (!e) return; const g0 = e.gr; zweiZeilen(e, w, 0); f = Math.min(f, e.gr / g0); });
    K.f = f0;
    return f;
  }
  const WACHSEN = [1.8, 1.6, 1.45, 1.32, 1.2, 1.1];
  const wt = K => 1 + (K.w - 1) * .5;   // Lesetext wächst halb so stark wie die Titel
  function block(e, w, cx) { if (e) { e.w = w; e.x = cx - w / 2; } return e; }

  /* Menü: immer eine Karte, ein Abschnitt (Fehlerbuch 10a). Wenig Gänge wachsen, bis sie die Karte füllen; viele werden kleiner gesetzt. */
  BAU.menue = function (K, fk) {
    const f = T.FORMATE[fk], R = T.rahmen(K, 0, 0, f.b, f.h), box = R.box, cx = box.x + box.w / 2, G = masse(fk);
    const mw = box.w * (fk === 'lang' ? 1 : .86), bw = box.w * (fk === 'lang' ? .9 : .66);
    const reihe = ordnung(K, 'gaenge', K.plan.gaenge.length).filter(i => !K.aus('g' + i));
    const texte = reihe.map(i => K.text('g' + i + '.name', K.plan.gaenge[i].name)), tfw = {};
    const tf = w => tfw[w] || (tfw[w] = titelFaktor(K, texte, G.gericht * w, mw));
    const r = zonen(K, box, K2 => {
      const kopf = kopfTeile(K2, cx, box.w, { gr: G, zeile: 'Bei ' + K2.gastgeber, titel: T.SAETZE.menueTitel, datum: T.datumLang(K2.a.anfrage.datum) });
      const tr = trenner(K2, cx, K2.stil.trenner), mitte = [], w = K2.w;
      reihe.forEach(i => {
        const g = K2.plan.gaenge[i], p = 'g' + i;
        if (mitte.length) mitte.push({ els: tr.els, h: tr.h, vor: 7.5 * K2.f, dehn: true });
        const gang = tx(K2, p + '.gang', g.gang, 'text', 'etikett', G.etikett * Math.min(w, 1.2), { gross: true, farbe: K2.etikett });
        if (gang) mitte.push({ el: block(gang, mw, cx), vor: mitte.length ? 7.5 * K2.f : 0, dehn: mitte.length > 0 });
        mitte.push({ el: zweiZeilen(tx(K2, p + '.name', g.name, 'titel', 'gericht', G.gericht * w * tf(w)), mw, cx), vor: gang ? 2.6 * Math.min(w, 1.3) : 7.5 * K2.f, dehn: !gang && mitte.length > 0 });
        const b = tx(K2, p + '.text', g.beschreibung, 'text', 'text', G.text * wt(K2), { farbe: K2.leise });
        if (b) mitte.push({ el: block(b, bw, cx), vor: 2 * Math.min(w, 1.3) });
        if (K2.stil.weinImMenue || K2.st.weinImMenue) {
          const wz = weinZu(K2, g, i);
          if (wz) { const e = tx(K2, p + '.wein', wz, 'text', 'text', G.text * .92 * wt(K2), { farbe: K2.etikett }); if (e) mitte.push({ el: block(e, bw, cx), vor: 1.8 }); }
        }
      });
      return { kopf, mitte, fuss: fussTeile(K2, cx, { gr: G, zeile: K2.plan.kueche }) };
    }, { mitteBreite: mw, luecke: 13 * G.k, wachsen: WACHSEN.filter(w => w <= 1.6), dehnMax: 8 });   // Gerichte höchstens 1,6-fach, «Menü» bleibt der grösste Titel
    return blatt(K, fk, [{ grund: K.grund, el: R.els.concat(r.els) }], r);
  };

  /* Wein zum Gang: im Abendplan zeigt jeder Wein mit «zu» auf die id seines Gangs */
  function weinZu(K, g) {
    return K.plan.weine.filter(w => w.zu && w.zu === g.id).map(w => [w.name, w.jahrgang].filter(Boolean).join(' ')).join(' · ');
  }

  function ordnung(K, liste, n) {
    const r = (K.st.reihenfolge || []).filter(i => Number.isInteger(i) && i >= 0 && i < n);
    for (let i = 0; i < n; i++) if (!r.includes(i)) r.push(i);
    return r;
  }
  T.ordnung = ordnung;

  BAU.weine = function (K, fk) {
    const f = T.FORMATE[fk], R = T.rahmen(K, 0, 0, f.b, f.h), box = R.box, cx = box.x + box.w / 2, G = masse(fk);
    const mw = box.w * (fk === 'lang' ? 1 : .86), bw = box.w * (fk === 'lang' ? .9 : .66);
    const reihe = ordnung(K, 'weine', K.plan.weine.length).filter(i => !K.aus('w' + i));
    const texte = reihe.map(i => K.text('w' + i + '.name', K.plan.weine[i].name)), tfw = {};
    const tf = w => tfw[w] || (tfw[w] = titelFaktor(K, texte, G.gericht * w, mw));
    const r = zonen(K, box, K2 => {
      const kopf = kopfTeile(K2, cx, box.w, { gr: G, titelF: .74, zeile: 'Bei ' + K2.gastgeber, titel: T.SAETZE.weineTitel, datum: T.datumLang(K2.a.anfrage.datum) });
      const tr = trenner(K2, cx, K2.stil.trenner), mitte = [], w = K2.w;
      reihe.forEach(i => {
        const wn = K2.plan.weine[i], p = 'w' + i;
        if (mitte.length) mitte.push({ els: tr.els, h: tr.h, vor: 7.5 * K2.f, dehn: true });
        const zu = tx(K2, p + '.zu', wn.zuLabel, 'text', 'etikett', G.etikett * Math.min(w, 1.2), { gross: true, farbe: K2.etikett });
        if (zu) mitte.push({ el: block(zu, mw, cx), vor: mitte.length ? 7.5 * K2.f : 0, dehn: mitte.length > 0 });
        mitte.push({ el: zweiZeilen(tx(K2, p + '.name', wn.name, 'titel', 'gericht', G.gericht * w * tf(w)), mw, cx), vor: zu ? 2.6 * Math.min(w, 1.3) : 7.5 * K2.f, dehn: !zu && mitte.length > 0 });
        const det = [wn.weingut, wn.jahrgang, wn.herkunft].filter(Boolean).join(' · ');
        const d = tx(K2, p + '.detail', det, 'text', 'text', G.text * wt(K2), { farbe: K2.leise });
        if (d) mitte.push({ el: block(d, bw, cx), vor: 2 * Math.min(w, 1.3) });
        const no = tx(K2, p + '.notiz', wn.notiz, 'text', 'text', G.text * .95 * wt(K2), { farbe: K2.leise });
        if (no) mitte.push({ el: block(no, bw, cx), vor: 1.4 });
      });
      return { kopf, mitte, fuss: fussTeile(K2, cx, { gr: G }) };
    }, { mitteBreite: mw, luecke: 13 * G.k, wachsen: WACHSEN.filter(w => w <= 1.6), dehnMax: 8 });   // Gerichte höchstens 1,6-fach, «Menü» bleibt der grösste Titel
    return blatt(K, fk, [{ grund: K.grund, el: R.els.concat(r.els) }], r);
  };

  /* Foto der Begrüssung: eines ihrer Bilder, passend zur Gestaltung (Tafel, Kerzen, Glas); nie mit fremdem Etikett (handschuh, kirche nicht) */
  T.FOTO = {
    schlicht: ['festtafel', .5, .55], advent: ['kerzen', .5, .5], hochzeitstag: ['festtafel', .5, .55], geburtstag: ['p132', .5, .5], silvester: ['glas', .5, .42],
    garten: ['p150', .5, .5], familie: ['tafel', .5, .55], smoking: ['kerzen', .5, .5], weinabend: ['glas', .5, .42], jubilaeum: ['festtafel', .5, .55],
    kerzenschein: ['kerzen', .5, .5], leise: ['p150', .5, .5], angelina: ['studio-fenster', .5, .28]
  };
  /* Für den Druck die grossen Fassungen ihrer Fotos (Kopien aus website/bilder/ in tisch/bild/, Breite × Höhe in Bildpunkten).
     Ein Fotofenster wird nie so gross, dass weniger als 210 dpi bleiben (Prüfung 5, Punkt 22: A4 lag bei 138 dpi und wirkte weich). */
  T.BILD_PX = { festtafel: [1350, 1688], kerzen: [1080, 1350], p132: [1080, 1350], glas: [1080, 1350], p150: [1080, 1350], tafel: [1440, 1800], 'studio-fenster': [1080, 1350] };
  T.MIN_DPI = 210;
  T.bildUrl = key => T.basis + 'bild/' + key + '.jpg';
  T.bildMaxMm = key => { const p = T.BILD_PX[key] || [1000, 1250]; return [p[0] * 25.4 / T.MIN_DPI, p[1] * 25.4 / T.MIN_DPI]; };

  /* Ablauf als Programm: Zeit rechtsbündig vor der Mitte, was geschieht linksbündig dahinter; ohne Zeit steht der Punkt mittig */
  /* Eine Zeile des Ablaufs. Mit Zeit: Zeitspalte (rechtsbündig, so breit wie die breiteste Zeit), Abstand, Text linksbündig;
     x0 ist der linke Rand des ganzen Blocks, den ablaufTeile nach der Tinte mittig stellt. Ohne Zeit steht der Punkt mittig. */
  function ablaufZeile(K, zeit, was, cx, w, lage) {
    if (!zeit) { was.x = cx - w / 2; was.w = w; was.ausr = 'c'; was.h = T.mess(was).h; return { els: [Object.assign(was, { y: 0 })], h: was.h }; }
    const { x0, zw, sp, tw } = lage;
    zeit.x = x0; zeit.w = zw; zeit.ausr = 'r';
    was.x = x0 + zw + sp; was.w = tw; was.ausr = 'l';
    zeit.h = T.mess(zeit).h; was.h = T.mess(was).h;
    const off = Math.max(0, (was.gr * 1.5 - zeit.gr * 1.3) / 2);   // Versal-Zeit auf die erste Zeile ausrichten
    return { els: [Object.assign(zeit, { y: off }), Object.assign(was, { y: 0 })], h: Math.max(was.h, zeit.h + off) };
  }


  /* Begrüssung: Foto, Gruss, Gastgeber und der Ablauf des Abends. Passt der Ablauf nicht luftig darunter, bekommt er eine eigene ganze
     Seite mit eigenem Kopf (Fehlerbuch 10a: kein Abschnitt über den Umbruch, nie gequetscht). */
  BAU.begruessung = function (K, fk) {
    const f = T.FORMATE[fk], R = T.rahmen(K, 0, 0, f.b, f.h), G = masse(fk), cx = f.b / 2;
    const reihe = ordnung(K, 'ablauf', K.plan.ablauf.length).filter(i => !K.aus('a' + i)), fo = T.FOTO[K.stilKey] || T.FOTO.schlicht;
    const mitAblauf = reihe.length && !K.aus('ablauf');
    const bw = R.box.w * .88;
    const ablaufTeile = (K2, liste) => {
      const out = [], zeilen = liste.map(i => {
        const x = K2.plan.ablauf[i], p = 'a' + i;
        return [tx(K2, p + '.zeit', x.zeit, 'text', 'etikett', G.etikett * 1.05 * Math.min(K2.w, 1.25), { gross: true, farbe: K2.etikett }),
          tx(K2, p + '.was', x.was, 'text', 'text', G.text * 1.08 * (1 + (K2.w - 1) * .7))];
      }).filter(([z, w]) => z || w);
      /* Der Block steht nach seiner Tinte mittig (Prüfung 7, Punkt 25): Breite = breiteste Zeit + Abstand + breiteste gesetzte Zeile,
         gemessen nach dem Umbruch, auch wenn ein Punkt auf zwei Zeilen läuft. Ein einzelner kurzer Punkt klebt so nie links. */
      const nat = el => T.mess(Object.assign({}, el, { w: 4000, ausr: 'l' })).bw;
      const mitZeit = zeilen.filter(([z, w]) => z && w), zg = mitZeit.length ? mitZeit[0][0].gr : 0;
      const zw = mitZeit.length ? Math.max(...mitZeit.map(([z]) => nat(z))) + .3 : 0, sp = Math.max(3.6, zg * 1.6);
      const tw = Math.min(bw - zw - sp, Math.max(0, ...mitZeit.map(([, w]) => nat(w) + .5)));
      const aw = Math.max(0, ...mitZeit.map(([, w]) => T.mess(Object.assign({}, w, { w: tw, ausr: 'l' })).bw));
      const lage = { x0: cx - (zw + sp + aw) / 2, zw, sp, tw };
      zeilen.forEach(([z, w], n) => {
        const zl = z && w ? ablaufZeile(K2, z, w, cx, bw, lage) : ablaufZeile(K2, null, w || z, cx, bw);
        out.push(Object.assign(zl, { vor: n ? 3.2 * K2.f * Math.min(K2.w, 1.4) : 0 }));   // eine ruhige Liste: feste Abstände, gedehnt wird nur um sie herum
      });
      return out;
    };
    const ersteSeite = (anteil, ablauf) => {
      const d = Math.max(2, R.m * .3), [wMax, hMax] = T.bildMaxMm(fo[0]);
      const fw = Math.min(f.b - 2 * (R.m + d), wMax), fh = Math.min(f.h * anteil, hMax);
      const fy = R.m + Math.max(d, Math.min((f.b - fw) / 2 - R.m, 12 * G.k));   // schmaleres Fenster (A4): oben mehr Luft, damit es nicht am Rahmen klebt
      const foto = [{ typ: 'bild', bild: fo[0], fx: fo[1], fy: fo[2], x: (f.b - fw) / 2, y: fy, w: fw, h: fh }];
      const box = { x: R.box.x, y: fy + fh + 8 * G.k, w: R.box.w, h: R.box.y + R.box.h - (fy + fh + 8 * G.k) };
      const r = zonen(K, box, K2 => {
        const kopf = [];
        if (K2.kopf === 'monogramm') { const m = tx(K2, 'kopf.mono', K2.mono, 'titel', 'titel', G.mono * .8, { farbe: K2.akzent === K2.etikett ? K2.akzent : K2.tinte, zeile: 1 }); if (m) kopf.push({ el: m, vor: 0 }); }
        kopf.push({ el: tx(K2, 'kopf.zeile', T.datumLang(K2.a.anfrage.datum), 'text', 'etikett', G.etikett, { gross: true, farbe: K2.etikett }), vor: 5 });
        const tt = tx(K2, 'kopf.titel', T.SAETZE.begruessung, 'titel', 'titel', G.titel * .86);
        if (tt) { tt.w = box.w; tt.x = box.x; for (let k = 0; k < 6 && T.mess(tt).zeilen > 1 && tt.gr > G.titel * .62; k++) tt.gr *= .95; }   // der Gruss möglichst auf einer Zeile
        kopf.push({ el: tt, vor: 3.2 });
        kopf.push({ el: tx(K2, 'satz', T.SAETZE.begruessungSatz, 'text', 'text', G.text * 1.15, { farbe: K2.leise }), vor: 3.2 });
        const mitte = [{ el: tx(K2, 'namen', K2.gastgeber, 'titel', 'gericht', G.gericht * 1.1 * Math.min(K2.w, 1.3), { farbe: K2.etikett }) }];
        if (ablauf) {
          const tr = trenner(K2, cx, K2.stil.trenner === 'leer' ? 'kurz' : K2.stil.trenner, 8);
          mitte.push({ els: tr.els, h: tr.h, vor: 7 * K2.f, dehn: true });
          mitte.push({ el: tx(K2, 'ablauf.titel', 'Der Abend', 'text', 'etikett', G.etikett, { gross: true, farbe: K2.etikett }), vor: 7 * K2.f, dehn: true });
          ablaufTeile(K2, reihe).forEach((x, n) => mitte.push(Object.assign(x, { vor: n ? x.vor : 4 * K2.f })));
        }
        return { kopf, mitte, fuss: fussTeile(K2, cx, { gr: G }) };
      }, { luecke: 9 * G.k, stufen: ablauf ? LUFTIG.concat([[.85, .7], [.8, .65]]) : undefined, wachsen: WACHSEN });
      return { grund: K.grund, el: R.els.concat(foto, r.els), r };
    };
    /* eine Seite, solange der Ablauf luftig unter Gruss und Foto passt (das Foto darf flacher werden) */
    /* eine Seite, sobald der Ablauf mit der erlaubten Luft darauf passt (Prüfung 6, Punkt 24: eine gewöhnliche Liste steht auf einer Seite);
       ist Platz, wächst er. Erst wenn er auch mit flacherem Foto nicht passt, bekommt er seine eigene Seite. */
    if (mitAblauf) for (const anteil of [.4, .34, .28, .23, .18]) { const s1 = ersteSeite(anteil, true); if (s1.r.passt) return blatt(K, fk, [s1], s1.r); }
    const s1 = ersteSeite(.4, false), seiten = [Object.assign(s1, mitAblauf ? { titel: 'Begrüssung' } : {})];
    if (mitAblauf) {
      const rs = seitenweise(reihe, liste => zonen(K, R.box, K2 => {
        const kopf = [fliege(K2, cx, G.fliege),
          { el: tx(K2, 'kopf.zeile', T.datumLang(K2.a.anfrage.datum), 'text', 'etikett', G.etikett, { gross: true, farbe: K2.etikett }), vor: 5 },
          { el: tx(K2, 'ablauf.titel', 'Der Abend', 'titel', 'titel', G.titel * .86), vor: 3.2 },
          { el: Object.assign(tx(K2, 'bei', 'Bei ' + K2.gastgeber, 'text', 'text', G.text * 1.15, { farbe: K2.leise, fest: true }), { key: null }), vor: 3 }].filter(x => x.el);
        return { kopf, mitte: ablaufTeile(K2, liste), fuss: fussTeile(K2, cx, { gr: G }) };
      }, { luecke: 10 * G.k, stufen: LUFTIG, wachsen: WACHSEN, dehnMax: 8 }));
      rs.forEach((r, k) => seiten.push({ grund: K.grund, titel: 'Der Abend' + (rs.length > 1 ? ', ' + (k + 1) + ' von ' + rs.length : ''), el: R.els.concat(r.els) }));
      return blatt(K, fk, seiten, { passt: s1.r.passt && rs.every(r => r.passt), faktor: Math.min(s1.r.faktor, ...rs.map(r => r.faktor)) });
    }
    return blatt(K, fk, seiten, s1.r);
  };

  /* Sitzordnung: Plätze in Reihenfolge, Belegung aus tisch.sitz */
  T.sitz = function (K) {
    const z = K.z.sitz || {}, gaeste = K.plan.gaeste;
    const n = Math.max(2, Math.min(T.MAX_PLAETZE, +z.plaetze || gaeste.length || 6));
    const bel = {}, frei = [];
    const vergeben = new Set();
    for (let i = 0; i < n; i++) { const g = (z.belegung || {})[i]; if (g && gaeste.some(x => x.name === g) && !vergeben.has(g)) { bel[i] = g; vergeben.add(g); } }
    if (!z.belegung) {   // noch nie gesetzt: Plätze aus dem Abendplan (platz «1» = erster Platz), die übrigen Gäste der Reihe nach
      gaeste.forEach(g => { const p = parseInt(g.platz, 10) - 1; if (p >= 0 && p < n && !bel[p] && !vergeben.has(g.name)) { bel[p] = g.name; vergeben.add(g.name); } });
      let i = 0; gaeste.forEach(g => { if (vergeben.has(g.name)) return; while (i < n && bel[i]) i++; if (i < n) { bel[i] = g.name; vergeben.add(g.name); } });
    }
    gaeste.forEach(g => { if (!vergeben.has(g.name)) frei.push(g.name); });
    return { n, form: z.form === 'lang' ? 'lang' : 'rund', kopf: z.kopf !== false, bel, frei };
  };

  /* ---------- Tischplan: Tafel und Namen so setzen, dass sich nichts deckt (Prüfung 05.11.2026: ab 20 Plätzen lagen Namen übereinander) ----------
     Wortbreiten werden einmal bei 10 mm gemessen und dann gerechnet. Gesucht wird die grösste Schrift, bei der jeder Name (auch in zwei Zeilen)
     an seinem Platz steht, ohne einen anderen Namen, den Kopf oder den Rand zu berühren; Kreis und Tafel wachsen dafür mit der Zahl der Plätze.
     Geht es auch in der kleinsten Schrift nicht, bleibt der beste Versuch stehen und die Druckprüfung meldet die Namen rot (doc.ueberdeckt). */
  const BREITE = new Map();
  function wortBreiten(rolle, text) {
    const k = rolle + '|' + text; if (BREITE.has(k)) return BREITE.get(k);
    const m = t => T.mess({ typ: 'text', rolle, gr: 10, zeile: 1.1, sperr: 0, ausr: 'l', w: 4000, text: t, farbe: '#000' }).bw;
    if (!BREITE.has(rolle + '| ')) BREITE.set(rolle + '| ', m('n n') - m('nn'));
    const r = { worte: T.zusammen(text).split(/[ \t\n]+/).filter(Boolean).map(m), leer: BREITE.get(rolle + '| ') };   // feste Leerzeichen («von der Ahe») brechen nicht
    BREITE.set(k, r); return r;
  }
  function umbruch(wb, gr, grenze) {   // wie der Browser: Wort für Wort, bis die Zeile voll ist
    const f = gr / 10, z = [];
    let zeile = -1;
    for (const w0 of wb.worte) {
      const w = w0 * f;
      if (zeile < 0) zeile = w; else if (zeile + wb.leer * f + w <= grenze) zeile += wb.leer * f + w; else { z.push(zeile); zeile = w; }
    }
    if (zeile >= 0) z.push(zeile);
    return { zeilen: z.length, bw: Math.max(0, ...z), passt: wb.worte.every(w => w * f <= grenze + .01) };
  }
  const deckt = (a, b, luft) => a.x < b.x + b.w + luft && b.x < a.x + a.w + luft && a.y < b.y + b.h + luft && b.y < a.y + a.h + luft;

  function tafelSatz(K, SZ, area, hoch, G) {
    const namen = []; for (let i = 0; i < SZ.n; i++) namen.push(SZ.bel[i] ? K.gastName(SZ.bel[i]) : null);
    const wb = namen.map(n => (n ? wortBreiten('titel', n) : null));
    const cx = area.x + area.w / 2, cy = area.y + area.h / 2, Z = 1.1, LUFT = 1.2;
    const g0 = G.gericht * .82 * K.g('gericht'), grs = [];
    for (let g = g0; g >= 2.4 - 1e-6; g *= .93) grs.push(g);
    if (grs[grs.length - 1] > 2.4 + 1e-6) grs.push(2.4);
    /* ein Versuch: Lage der Tafel und jedes Namens; Ergebnis mit Zahl der Überdeckungen */
    function versuch(gr, form, p) {
      const sitze = [], boxen = [];
      let tafel;
      if (form === 'rund') {
        const R = p, ra = R + 7.2;
        tafel = { typ: 'rund', cx, cy, R };
        const sehne = 2 * ra * Math.sin(Math.PI / SZ.n);
        for (let i = 0; i < SZ.n; i++) {
          const a = -Math.PI / 2 + i * 2 * Math.PI / SZ.n, c = Math.cos(a), s2 = Math.sin(a);
          const sitz = { x: cx + (R + 4.2) * c, y: cy + (R + 4.2) * s2, cos: c, sin: s2 };
          sitze.push(sitz);
          if (!wb[i]) { boxen.push(null); continue; }
          const rand = c > .35 ? area.x + area.w - (cx + ra * c) : c < -.35 ? (cx + ra * c) - area.x : area.w;
          const grenze = Math.min(40 * Math.max(1, G.k), area.w * .32, Math.abs(c) <= .35 ? sehne * .96 / Math.max(.5, Math.abs(s2)) : rand - .5);
          const u = umbruch(wb[i], gr, grenze);
          const w = u.bw + .6, h = u.zeilen * gr * Z;
          const bx = { x: cx + ra * c + c * w / 2 - w / 2, y: cy + ra * s2 + s2 * h / 2 - h / 2, w, h, passt: u.passt, ausr: c > .35 ? 'l' : c < -.35 ? 'r' : 'c' };
          for (let n = 0; n < 6; n++) {   // nach aussen schieben, bis keine Ecke des Namens näher an der Tafel liegt als die Namenslinie
            const nx = Math.max(bx.x, Math.min(cx, bx.x + bx.w)), ny = Math.max(bx.y, Math.min(cy, bx.y + bx.h)), dd = Math.hypot(nx - cx, ny - cy);
            if (dd >= ra - .05) break;
            bx.x += c * (ra - dd + .1); bx.y += s2 * (ra - dd + .1);
          }
          boxen.push(bx);
        }
      } else {
        const enden = SZ.kopf && SZ.n >= 6 ? 2 : 0, seite = Math.ceil((SZ.n - enden) / 2), andere = SZ.n - enden - seite;
        const plan = [];   // [sitz, seite, abstand]
        if (hoch) {
          const tw = Math.min(area.w * .2, 34), th = area.h * .84 * p, tx0 = cx - tw / 2, ty0 = cy - th / 2, schritt = th / seite, s2 = th / Math.max(1, andere);
          tafel = { typ: 'lang', x: tx0, y: ty0, w: tw, h: th };
          for (let i = 0; i < seite; i++) plan.push([{ x: tx0 + tw + 4.2, y: ty0 + schritt * (i + .5) }, 'r', schritt]);
          if (enden) plan.push([{ x: cx, y: ty0 + th + 4.2 }, 'u', 0]);
          for (let i = andere - 1; i >= 0; i--) plan.push([{ x: tx0 - 4.2, y: ty0 + s2 * (i + .5) }, 'l', s2]);
          if (enden) plan.push([{ x: cx, y: ty0 - 4.2 }, 'o', 0]);
        } else {
          const th = Math.min(area.h * .3, 44), tw = area.w * .78 * p, tx0 = cx - tw / 2, ty0 = cy - th / 2, schritt = tw / seite, s2 = tw / Math.max(1, andere);
          tafel = { typ: 'lang', x: tx0, y: ty0, w: tw, h: th };
          for (let i = 0; i < seite; i++) plan.push([{ x: tx0 + schritt * (i + .5), y: ty0 - 4.2 }, 'o', schritt]);
          if (enden) plan.push([{ x: tx0 + tw + 4.2, y: cy }, 'r', 0]);
          for (let i = andere - 1; i >= 0; i--) plan.push([{ x: tx0 + s2 * (i + .5), y: ty0 + th + 4.2 }, 'u', s2]);
          if (enden) plan.push([{ x: tx0 - 4.2, y: cy }, 'l', 0]);
        }
        plan.forEach(([sitz, sd, abst], i) => {
          sitze.push(Object.assign(sitz, { seite: sd }));
          if (!wb[i]) { boxen.push(null); return; }
          const quer = sd === 'o' || sd === 'u';
          const grenze = quer ? (abst ? abst * .96 : Math.min(40 * Math.max(1, G.k), area.w * .4)) : Math.min(40 * Math.max(1, G.k), sd === 'r' ? area.x + area.w - sitz.x - 3.6 - .5 : sitz.x - 3.6 - area.x - .5);
          const u = umbruch(wb[i], gr, grenze);
          const w = u.bw + .6, h = u.zeilen * gr * Z;
          const bx = sd === 'r' ? { x: sitz.x + 3.6, y: sitz.y - h / 2 } : sd === 'l' ? { x: sitz.x - 3.6 - w, y: sitz.y - h / 2 } : sd === 'o' ? { x: sitz.x - w / 2, y: sitz.y - 3.6 - h } : { x: sitz.x - w / 2, y: sitz.y + 3.6 };
          boxen.push(Object.assign(bx, { w, h, passt: u.passt, ausr: { r: 'l', l: 'r' }[sd] || 'c' }));
        });
      }
      /* Überdeckungen zählen: Name an Name, Name über den Rand oder in den Kopf, Name auf der Tafel */
      const fehl = new Set();
      boxen.forEach((b, i) => {
        if (!b) return;
        if (!b.passt || b.x < area.x - .01 || b.x + b.w > area.x + area.w + .01 || b.y < area.y - .01 || b.y + b.h > area.y + area.h + .01) fehl.add(i);
        if (tafel.typ === 'lang' && deckt(b, tafel, .5)) fehl.add(i);
        if (tafel.typ === 'rund') { const nx = Math.max(b.x, Math.min(cx, b.x + b.w)), ny = Math.max(b.y, Math.min(cy, b.y + b.h)); if (Math.hypot(nx - cx, ny - cy) < tafel.R + 5.6) fehl.add(i); }
        for (let j = i + 1; j < boxen.length; j++) if (boxen[j] && deckt(b, boxen[j], LUFT)) { fehl.add(i); fehl.add(j); }
      });
      return { gr, tafel, sitze, boxen, fehl };
    }
    let best = null;
    const proben = SZ.form === 'rund'
      ? (() => { const Rmin = Math.min(area.w * .27, area.h * .3), Rmax = Math.max(Rmin, Math.min(area.w, area.h) / 2 - 9), Rziel = Math.min(Rmax, Rmin * Math.max(1, SZ.n / 12)), out = []; for (let r = Rziel; r >= Rmin * .7; r -= Math.max(1.5, Rziel * .05)) out.push(r); return out; })()
      : (hoch ? [1, .94, .88, .82, .76, .7] : [1.2, 1.12, 1.06, 1, .94, .88, .82, .76]);
    for (const gr of grs) {
      for (const p of proben) {
        const v = versuch(gr, SZ.form, p);
        if (!v.fehl.size) return v;
        if (!best || v.fehl.size < best.fehl.size || (v.fehl.size === best.fehl.size && v.gr === gr)) best = v;
      }
    }
    return best;
  }

  BAU.tischplan = function (K, fk, o = {}) {
    const f = T.FORMATE[fk], R = T.rahmen(K, 0, 0, f.b, f.h), box = R.box, cx = box.x + box.w / 2, G = masse(fk), hoch = f.h > f.b;
    const SZ = T.sitz(K);
    /* Querformat mit runder Tafel: der Kopf steht links in einer Spalte, die Tafel nimmt rechts die ganze Höhe (Prüfung 5, Punkt 21:
       sonst blieb links und rechts der kleinen Tafel je ein Drittel des Blatts leer und die Namen wurden zu klein) */
    const seitlich = !hoch && SZ.form === 'rund', sw = seitlich ? box.w * .3 : box.w, scx = box.x + sw / 2;
    const kopf = spalte(kopfTeile(K, scx, sw, { gr: G, titelF: hoch ? .9 : seitlich ? .6 : .8, zeile: 'Bei ' + K.gastgeber, titel: T.SAETZE.planTitel, datum: T.datumLang(K.a.anfrage.datum) }).concat(
      [{ el: tx(K, 'satz', T.SAETZE.planSatz, 'text', 'text', G.text, { farbe: K.leise }), vor: 2.4 }]), { x: box.x, y: box.y, w: sw, h: box.h });
    const fuss = K.wortmarke && !K.aus('fuss.marke') ? G.siegel * (hoch ? 1 : .85) : 0, fussH = fuss ? zeichenH('siegel', fuss) : 0;
    let kopfEls, area;
    if (seitlich) {
      kopfEls = kopf.setze({ x: box.x, y: box.y, w: sw, h: box.h - (fuss ? fussH + 6 * G.k : 0) }, 0);
      area = { x: box.x + sw + 8 * G.k, y: box.y, w: box.w - sw - 8 * G.k, h: box.h };
    } else {
      kopfEls = kopf.setze({ x: box.x, y: box.y, w: box.w, h: kopf.summe }, 0);
      area = { x: box.x, y: box.y + kopf.summe + 7 * G.k, w: box.w, h: box.h - kopf.summe - 7 * G.k - (fuss ? fussH + 6 * G.k : 0) };
    }
    const P = tafelSatz(K, SZ, area, hoch, G), els = [];
    if (P.tafel.typ === 'rund') {
      els.push({ typ: 'rahmen', x: P.tafel.cx - P.tafel.R, y: P.tafel.cy - P.tafel.R, w: 2 * P.tafel.R, h: 2 * P.tafel.R, r: P.tafel.R, staerke: .25, farbe: K.akzent });
      els.push({ typ: 'rahmen', x: P.tafel.cx - P.tafel.R + 1.6, y: P.tafel.cy - P.tafel.R + 1.6, w: 2 * P.tafel.R - 3.2, h: 2 * P.tafel.R - 3.2, r: P.tafel.R - 1.6, staerke: .15, farbe: K.akzent });
      const m = tx(K, 'tafel.mono', K.mono, 'titel', 'titel', Math.min(P.tafel.R * .5, G.mono * 1.1), { farbe: K.etikett, zeile: 1 });
      if (m) { m.x = P.tafel.cx - P.tafel.R; m.w = 2 * P.tafel.R; m.h = T.mess(m).h; m.y = P.tafel.cy - m.h / 2; els.push(m); }
    } else {
      els.push({ typ: 'rahmen', x: P.tafel.x, y: P.tafel.y, w: P.tafel.w, h: P.tafel.h, staerke: .25, farbe: K.akzent, r: .6 });
      els.push({ typ: 'rahmen', x: P.tafel.x + 1.6, y: P.tafel.y + 1.6, w: P.tafel.w - 3.2, h: P.tafel.h - 3.2, staerke: .15, farbe: K.akzent });
      const m = tx(K, 'tafel.mono', K.mono, 'titel', 'titel', Math.min(Math.min(P.tafel.w, P.tafel.h) * .46, G.mono * 1.1), { farbe: K.etikett, zeile: 1 });
      if (m) { m.x = P.tafel.x; m.w = P.tafel.w; m.h = T.mess(m).h; m.y = P.tafel.y + (P.tafel.h - m.h) / 2; els.push(m); }
    }
    P.sitze.forEach((p, i) => {
      const d = 3, name = SZ.bel[i], b = P.boxen[i];   // Platz: feiner Ring, besetzt mit einem Punkt darin
      els.push({ typ: 'rahmen', x: p.x - d / 2, y: p.y - d / 2, w: d, h: d, r: d / 2, staerke: .2, farbe: K.akzent, platz: i });
      if (name) els.push({ typ: 'flaeche', x: p.x - .6, y: p.y - .6, w: 1.2, h: 1.2, r: .6, farbe: K.akzent, platz: i });
      if (!name) {
        if (!o.editor) return;
        const fw = 9, fh = 4, out = SZ.form === 'rund' ? { x: p.x + p.cos * 6 - fw / 2, y: p.y + p.sin * 5.5 - fh / 2 } : ({ r: { x: p.x + 3.6, y: p.y - fh / 2 }, l: { x: p.x - 3.6 - fw, y: p.y - fh / 2 }, o: { x: p.x - fw / 2, y: p.y - 3.6 - fh }, u: { x: p.x - fw / 2, y: p.y + 3.6 } })[p.seite];
        els.push(Object.assign(out, { typ: 'hilfe', art: 'frei', text: 'frei', w: fw, h: fh, farbe: K.tinte, platz: i }));
        return;
      }
      const e = tx(K, 'gast:' + name, K.gastName(name), 'titel', 'gericht', P.gr, { fest: true, zeile: 1.1 });
      e.gr = P.gr;   // die Suche oben hat die Grösse schon gewählt (Grössenstufe eingerechnet)
      Object.assign(e, { key: 'gast:' + name, platz: i, x: b.x, y: b.y, w: b.w, h: b.h, ausr: b.ausr });
      els.push(e);
    });
    if (fuss) els.push(Object.assign(siegel(K, seitlich ? scx : cx, fuss), { y: box.y + box.h - fussH }));
    const doc = blatt(K, fk, [{ grund: K.grund, el: R.els.concat(kopfEls, els) }], { passt: true, faktor: 1 });
    doc.sitz = SZ;
    doc.ueberdeckt = [...P.fehl].map(i => K.gastName(SZ.bel[i]));
    doc.namenGr = Object.keys(SZ.bel).length ? P.gr : null;   // für die Druckprüfung: unter 4 mm liest man die Namen im Stehen nicht
    return doc;
  };

  /* ---------- Karten: Tischkarte (gefaltet / flach), Memory, Angelinas Karte ---------- */
  function gastReihe(K) {
    const SZ = T.sitz(K), r = [];
    for (let i = 0; i < SZ.n; i++) if (SZ.bel[i]) r.push({ name: SZ.bel[i], platz: i });
    SZ.frei.forEach(n => r.push({ name: n, platz: null }));
    return r;
  }
  T.gastReihe = gastReihe;

  /* Name auf der Karte so gross wie möglich: ein Wort bleibt ganz auf einer Zeile, mehrere Wörter höchstens auf zwei */
  function nameEinpassen(e, maxH, minGr) {
    const worte = e.text.trim().split(/\s+/), zmax = worte.length > 1 ? 2 : 1;
    const ganz = () => worte.every(w => T.mess(Object.assign({}, e, { text: w, w: 4000, ausr: "l" })).bw <= e.w + .05);   // kein Wort wird mitten getrennt
    for (let k = 0; k < 18; k++) { const m = T.mess(e); if ((m.zeilen <= zmax && m.h <= maxH && ganz()) || e.gr <= minGr) break; e.gr = Math.max(minGr, e.gr * .93); }
    e.h = T.mess(e).h;
    return e;
  }

  /* Eine Hälfte der Tischkarte oder die flache Karte: Fliege, der Name gross, das Datum als Versalzeile */
  function kartenSatz(K, g, b, dreh, gr0) {
    const els = [], cx = b.x + b.w / 2;
    const e = tx(K, 'gast:' + g.name, K.gastName(g.name), 'titel', 'gericht', gr0, { fest: true, zeile: 1.06, dreh });
    e.key = 'gast:' + g.name; e.x = b.x; e.w = b.w;
    const zeile = tx(K, 'zeile', K.text('zeile', T.datumKurz(K.a.anfrage.datum)), 'kap', 'etikett', 1.95, { fest: true, gross: true, farbe: K.etikett, dreh });
    const zh = zeile ? T.mess(Object.assign(zeile, { x: b.x, w: b.w })).h : 0;
    const fw = Math.min(2.4, b.h * .07), fh = zeichenH('fliege', fw), gF = 2.4, gZ = 2.6;
    nameEinpassen(e, b.h - fh - gF - (zeile ? zh + gZ : 0), 4.2);
    const ges = fh + gF + e.h + (zeile ? gZ + zh : 0), y0 = b.y + (b.h - ges) / 2;
    const fl = { typ: 'zeichen', z: 'fliege', x: cx - fw / 2, w: fw, farbe: K.akzent };
    if (dreh) {   // obere Hälfte, um 180° gedreht: von der anderen Seite gelesen dieselbe Folge
      let y = y0;
      if (zeile) { zeile.y = y; zeile.h = zh; els.push(zeile); y += zh + gZ; }
      e.y = y; els.push(e); y += e.h + gF;
      fl.y = y; els.push(fl);
    } else {
      let y = y0;
      fl.y = y; els.push(fl); y += fh + gF;
      e.y = y; els.push(e); y += e.h + gZ;
      if (zeile) { zeile.y = y; zeile.h = zh; els.push(zeile); }
    }
    return els;
  }

  function karteTisch(K, g, ox, oy, fk, bl) {
    const f = T.FORMATE[fk], els = [];
    const halb = f.falz ? f.falz : 0;
    els.push({ typ: 'flaeche', x: ox - bl, y: oy - bl, w: f.b + 2 * bl, h: f.h + 2 * bl, farbe: K.grund });
    if (halb) {
      const unten = T.rahmen(K, ox, oy + halb, f.b, f.h - halb, { m: 3.8, luft: 2.6, bluten: 0, grundFlaeche: false });
      const oben = T.rahmen(K, ox, oy, f.b, halb, { m: 3.8, luft: 2.6, bluten: 0, grundFlaeche: false });
      unten.els.concat(oben.els).forEach(e => els.push(e));
      kartenSatz(K, g, unten.box, 0, 8.4).concat(kartenSatz(K, g, oben.box, 180, 8.4)).forEach(e => els.push(e));
      els.push({ typ: 'hilfe', art: 'falz', x: ox, y: oy + halb, w: f.b, h: 0, farbe: K.tinte });
      return els;
    }
    const R = T.rahmen(K, ox, oy, f.b, f.h, { m: 3.8, luft: 3, bluten: 0 });
    R.els.forEach(e => els.push(e));
    kartenSatz(K, g, R.box, 0, 8.8).forEach(e => els.push(e));
    return els;
  }

  T.motivFuer = function (K, name, i) {
    const m = (K.z.memory || {}).motive || {};
    if (m[name] && T.MOTIVE[m[name]]) return m[name];
    const belegt = new Set(Object.values(m));
    const frei = T.MOTIV_REIHE.filter(k => !belegt.has(k));
    return frei[i % frei.length] || T.MOTIV_REIHE[i % T.MOTIV_REIHE.length];
  };

  function karteMemory(K, g, i, art, ox, oy, bl) {
    const f = T.FORMATE.memory, els = [];
    els.push({ typ: 'flaeche', x: ox - bl, y: oy - bl, w: f.b + 2 * bl, h: f.h + 2 * bl, farbe: K.grund });
    const R = T.rahmen(K, ox, oy, f.b, f.h, { m: 3.4, luft: 3, bluten: 0 });
    R.els.forEach(e => els.push(e));
    const b = R.box, cx = b.x + b.w / 2, motiv = T.motivFuer(K, g.name, i);
    if (art === 'hinten') {
      const e = tx(K, 'gast:' + g.name, K.gastName(g.name), 'titel', 'gericht', 6.4, { fest: true, zeile: 1.08 });
      e.key = 'gast:' + g.name; e.x = b.x; e.w = b.w; nameEinpassen(e, b.h * .5, 3.6);
      const z = tx(K, 'memory.hinten', T.SAETZE.memoryHinten, 'text', 'text', 2.2, { farbe: K.leise });
      const tr = trenner(K, cx, 'kurz', 4);
      const zh = z ? T.mess(Object.assign(z, { x: b.x, w: b.w })).h : 0, ges = e.h + (z ? 3 + tr.h + 3 + zh : 0), y0 = b.y + (b.h - ges) / 2;
      e.y = y0; els.push(e);
      if (z) { tr.els.forEach(t => els.push(Object.assign({}, t, { y: t.y + y0 + e.h + 3 }))); z.y = y0 + e.h + 3 + tr.h + 3; z.h = zh; els.push(z); }
      return els;
    }
    const z = tx(K, art === 'platz' ? 'memory.platz' : 'memory.vorn', art === 'platz' ? T.SAETZE.memoryPlatz : T.SAETZE.memoryVorn, 'text', 'etikett', 1.95, { gross: true, farbe: K.etikett, zeile: 1.35 });
    if (z) { z.x = b.x; z.w = b.w; z.h = T.mess(z).h; z.y = b.y + b.h - z.h; els.push(z); }
    const frei = b.h - (z ? z.h + 3 : 0), mw = Math.min(b.w * .56, frei * .9);
    els.push({ typ: 'motiv', motiv, x: cx - mw / 2, y: b.y + (frei - mw) / 2, w: mw, staerke: .32, farbe: K.akzent });
    return els;
  }

  function karteAngelina(K, seite, ox, oy, bl) {
    const f = T.FORMATE.platz, els = [];
    els.push({ typ: 'flaeche', x: ox - bl, y: oy - bl, w: f.b + 2 * bl, h: f.h + 2 * bl, farbe: K.grund });
    const R = T.rahmen(K, ox, oy, f.b, f.h, { m: 3.6, luft: 3.2, bluten: 0 });
    R.els.forEach(e => els.push(e));
    const H = window.TI_HAUS || {};
    if (seite === 'vorn') {   // vorne ihr Foto im Fenster der Rahmenlinie, daneben ihr Satz und ihre Wortmarke
      const d = 1.8, fh = f.h - 2 * (R.m + d), fw = fh * .78, fo = T.FOTO.angelina;
      els.push({ typ: 'bild', bild: fo[0], fx: fo[1], fy: fo[2], x: ox + R.m + d, y: oy + R.m + d, w: fw, h: fh });
      const tb = { x: ox + R.m + d + fw + 3.6, y: R.box.y, w: ox + f.b - R.m - 3.2 - (ox + R.m + d + fw + 3.6), h: R.box.h }, cx = tb.x + tb.w / 2;
      const teile = [{ el: tx(K, 'vorn.satz', T.SAETZE.angelinaVorn, 'titel', 'gericht', 5, { zeile: 1.1 }) }];
      teile.push({ el: { typ: 'zeichen', z: 'wortmarke', x: cx - 11, w: 22, farbe: K.etikett === K.akzent ? K.akzent : K.tinte }, vor: 4 });
      spalte(teile, tb).setze().forEach(e => els.push(e));
      return els;
    }
    const b = R.box, cx = b.x + b.w / 2, tr = trenner(K, cx, 'kurz', 5);
    const teile = [{ el: tx(K, 'hinten.satz', T.SAETZE.angelinaZeile, 'titel', 'gericht', 4.4) }];
    teile.push({ els: tr.els, h: tr.h, vor: 2.6 });
    teile.push({ el: tx(K, 'hinten.mail', H.email || 'Strelowangelina@gmx.de', 'text', 'etikett', 2.15, { farbe: K.etikett }), vor: 2.6 });
    teile.push({ el: tx(K, 'hinten.insta', 'instagram.com/by.angelina.strelow', 'text', 'etikett', 2.15, { farbe: K.etikett }), vor: .8 });
    teile.push({ el: tx(K, 'hinten.kaffee', T.SAETZE.angelinaKaffee + ':\ncalendly.com/angelinastrelow', 'text', 'text', 2.05, { farbe: K.leise }), vor: 2.2 });
    spalte(teile, b).setze().forEach(e => els.push(e));
    return els;
  }

  /* Bogen: Karten Kante an Kante auf A4 (ein Schnitt je Linie), 2 mm Beschnitt um das Raster, feine Schnittmarken nur ausserhalb,
     Falzmarken kürzer daneben, unten eine leise Zeile, was auf dem Bogen steht und wie er geschnitten wird. */
  function bogen(K, fk, karten, bauKarte, spiegeln, titel, hinweis) {
    const f = T.FORMATE[fk], kb = T.FORMATE[f.bogen.karte], sp = f.bogen.sp, ze = f.bogen.ze, bl = 2;
    const gw = sp * kb.b, gh = ze * kb.h, x0 = (f.b - gw) / 2, y0 = (f.h - gh) / 2 - 3;
    const je = sp * ze, seiten = [], n = Math.max(1, Math.ceil(karten.length / je));
    for (let s0 = 0; s0 < Math.max(1, karten.length); s0 += je) {
      const el = [], teil = karten.slice(s0, s0 + je);
      const zeilen = Math.max(1, Math.ceil(teil.length / sp));
      const lage = teil.map((k, nr) => { let c = nr % sp; const r = Math.floor(nr / sp); if (spiegeln) c = sp - 1 - c; return [c, r]; });
      const da = new Set(lage.map(([c, r]) => c + ',' + r));
      /* Beschnitt nur dort, wo keine Nachbarkarte anschliesst: aussen am Raster und neben leeren Feldern */
      lage.forEach(([c, r]) => {
        const l = da.has((c - 1) + ',' + r) ? 0 : bl, rr = da.has((c + 1) + ',' + r) ? 0 : bl, o = da.has(c + ',' + (r - 1)) ? 0 : bl, u = da.has(c + ',' + (r + 1)) ? 0 : bl;
        if (l || rr || o || u) el.push({ typ: 'flaeche', x: x0 + c * kb.b - l, y: y0 + r * kb.h - o, w: kb.b + l + rr, h: kb.h + o + u, farbe: K.grund });
      });
      teil.forEach((k, nr) => bauKarte(k, s0 + nr, x0 + lage[nr][0] * kb.b, y0 + lage[nr][1] * kb.h, 0).forEach(e => el.push(e)));
      const hh = zeilen * kb.h, L = 5, a = bl + 1.5, st = .1;
      const mk = (x, y, w, h) => el.push({ typ: 'linie', x, y, w, h, staerke: st, farbe: '#000000', marke: true });
      for (let c = 0; c <= sp; c++) { const x = x0 + c * kb.b; mk(x - st / 2, y0 - a - L, st, L); mk(x - st / 2, y0 + hh + a, st, L); }
      for (let r = 0; r <= zeilen; r++) { const y = y0 + r * kb.h; mk(x0 - a - L, y - st / 2, L, st); mk(x0 + gw + a, y - st / 2, L, st); }
      if (kb.falz) for (let r = 0; r < zeilen; r++) { const y = y0 + r * kb.h + kb.falz; mk(x0 - a - L * .55, y - st / 2, L * .55, st); mk(x0 + gw + a, y - st / 2, L * .55, st); }
      const nr = seiten.length + 1;
      const fz = { typ: 'text', rolle: 'text', gr: 2.1, zeile: 1.3, sperr: 0, ausr: 'c', farbe: '#6E6567', gross: false, x: x0, w: gw, text: `${titel} · ${K.gastgeber} · Bogen ${nr} von ${n} · ${hinweis}` };
      fz.h = T.mess(fz).h; fz.y = Math.min(f.h - 9 - fz.h, y0 + hh + a + L + 5);
      el.push(fz);
      seiten.push({ grund: '#FFFFFF', el });
    }
    return seiten;
  }

  BAU.tischkarten = function (K, fk) {
    const f = T.FORMATE[fk], gaeste = gastReihe(K);
    if (f.bogen) return blatt(K, fk, bogen(K, fk, gaeste, (g, i, ox, oy, bl) => karteTisch(K, g, ox, oy, f.bogen.karte, bl), false, 'Tischkarten', T.FORMATE[f.bogen.karte].falz ? 'An den Marken schneiden, an der kurzen Marke falzen.' : 'An den Marken schneiden.'), { passt: true, faktor: 1 }, gaeste.length);
    const seiten = (gaeste.length ? gaeste : [{ name: 'Gast' }]).map(g => ({ grund: K.grund, titel: g.name, el: karteTisch(K, g, 0, 0, fk, T.B) }));
    return blatt(K, fk, seiten, { passt: true, faktor: 1 }, gaeste.length);
  };

  BAU.memory = function (K, fk) {
    const f = T.FORMATE[fk], gaeste = gastReihe(K);
    if (f.bogen) {
      const b = art => (g, i, ox, oy, bl) => karteMemory(K, g, i, art, ox, oy, bl);
      const vorn = bogen(K, fk, gaeste, b('vorn'), false, 'Memory zum Empfang', 'Vorderseite. An den Marken schneiden.').map(s => Object.assign(s, { titel: 'Empfang, Vorderseite' }));
      const hinten = bogen(K, fk, gaeste, b('hinten'), true, 'Memory zum Empfang', 'Rückseite, gewendet auf die Vorderseite drucken.').map(s => Object.assign(s, { titel: 'Empfang, Rückseite mit Namen' }));
      const platz = bogen(K, fk, gaeste, b('platz'), false, 'Memory am Platz', 'An den Marken schneiden.').map(s => Object.assign(s, { titel: 'Am Platz' }));
      return blatt(K, fk, vorn.concat(hinten, platz), { passt: true, faktor: 1 }, gaeste.length);
    }
    const seiten = [];
    gaeste.forEach((g, i) => ['vorn', 'hinten', 'platz'].forEach(art => seiten.push({ grund: K.grund, titel: g.name + ' · ' + { vorn: 'Empfang vorn', hinten: 'Empfang hinten', platz: 'am Platz' }[art], el: karteMemory(K, g, i, art, 0, 0, T.B) })));
    return blatt(K, fk, seiten, { passt: true, faktor: 1 }, gaeste.length);
  };

  BAU.angelina = function (K, fk) {
    const f = T.FORMATE[fk];
    if (f.bogen) {
      const anz = f.bogen.sp * f.bogen.ze, liste = Array.from({ length: anz }, (_, i) => i);
      const vorn = bogen(K, fk, liste, (k, i, ox, oy, bl) => karteAngelina(K, 'vorn', ox, oy, bl), false, 'Deine Karte', 'Vorderseite. An den Marken schneiden.').map(s => Object.assign(s, { titel: 'Vorderseite' }));
      const hinten = bogen(K, fk, liste, (k, i, ox, oy, bl) => karteAngelina(K, 'hinten', ox, oy, bl), true, 'Deine Karte', 'Rückseite, gewendet auf die Vorderseite drucken.').map(s => Object.assign(s, { titel: 'Rückseite' }));
      return blatt(K, fk, vorn.concat(hinten), { passt: true, faktor: 1 });
    }
    return blatt(K, fk, [{ grund: K.grund, titel: 'Vorderseite', el: karteAngelina(K, 'vorn', 0, 0, T.B) }, { grund: K.grund, titel: 'Rückseite', el: karteAngelina(K, 'hinten', 0, 0, T.B) }], { passt: true, faktor: 1 });
  };

  function blatt(K, fk, seiten, r, gaesteZahl) {
    const f = T.FORMATE[fk];
    return { name: T.STUECKE[K.stueck].lang + ' · ' + K.gastgeber, stueck: K.stueck, formatKey: fk, format: { b: f.b, h: f.h }, seiten, passt: r.passt, faktor: r.faktor, gaeste: gaesteZahl, plan: K.plan, kontext: K };
  }

  /* Eine Drucksache setzen: Abend, Zustand des Abends (tisch-Teil), Art, Format (sonst das gespeicherte oder das erste) */
  T.setze = function (a, z, stueck, formatKey) {
    const st = ((z || {}).stuecke || {})[stueck] || {};
    const fk = formatKey || (T.STUECKE[stueck].formate.includes(st.format) ? st.format : T.STUECKE[stueck].formate[0]);
    const K = T.kontext(a, z, stueck, fk);
    return BAU[stueck](K, fk, { editor: true });
  };
  T.setzeDruck = function (a, z, stueck, formatKey) {
    const st = ((z || {}).stuecke || {})[stueck] || {};
    const fk = formatKey || (T.STUECKE[stueck].formate.includes(st.format) ? st.format : T.STUECKE[stueck].formate[0]);
    const K = T.kontext(a, z, stueck, fk);
    return BAU[stueck](K, fk, {});
  };
})();

/* Tischkarten & Menü · Angelina Strelow (05.11.2026). Aufbau wie die Plakatwerkstatt des Culinarium (Übersicht, Katalog je Anlass, Editor mit Blatt
   auf dunkler Bühne, Druckprüfung, druckfertig speichern), Rahmen R01–R24 aus oberflaeche/. Daten: Teil «tisch» des gemeinsamen Servers
   (nur Gestaltung und Auswahl); Gänge, Weine, Gäste und Ablauf liest das Werkzeug aus «plan» (Der Abendplan), sonst ein beschriftetes Beispiel.
   Nichts speichert still (R10): jede Eingabe wartet gelb, «Speichern» legt alles in einem Schritt ab, mit etag (409 KONFLIKT). Nichts geht hinaus. */
(function () {
  'use strict';
  const T = window.TI, H = window.WO_HAUS, WO = window.WO;
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = T.esc;
  /* Zeichen: die des Kleids, dazu minus und runter/hoch als Paar (fehlen im Kleid) */
  const EIGEN = { minus: 'M5 12h14', runter: 'M12 5v14M6 13l6 6 6-6', hoch: 'M12 19V5M6 11l6-6 6 6', rueck: 'M9 4.5 4 9.5l5 5M4 9.5h11a5 5 0 0 1 0 10h-3', vor: 'm15 4.5 5 5-5 5M20 9.5H9a5 5 0 0 0 0 10h3' };   // rueck/vor: die Pfeile der Plakatwerkstatt
  const IC = n => EIGEN[n] ? '<svg class="wo-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="' + EIGEN[n] + '"/></svg>' : WO.ic(n);
  const LS = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* privates Fenster */ } } };
  const WEBSITE = '/angelina-strelow/website/index.html';
  const STATION = ['zugesagt', 'geplant', 'vorbei', 'abgeschlossen'];
  const STATUS_NAME = { anfrage: 'Anfrage', angebot: 'Angebot', zugesagt: 'Zugesagt', geplant: 'Geplant', vorbei: 'Vorbei', abgeschlossen: 'Abgeschlossen', abgesagt: 'Abgesagt' };
  const name = WO.name('tisch');

  const A = { abende: [], etag: {}, gesp: {}, ent: {}, sicht: { art: 'start' }, sel: null, zoom: 0, schnitt: false, seite: 0, tab: 'inhalt', undo: [], redo: [], haus: {}, wahlGast: null };
  T.A = A;

  /* ---------- Daten ---------- */
  const tief = x => JSON.parse(JSON.stringify(x == null ? {} : x));
  function sauber(x) {   // leere Objekte und Listen weglassen, damit «nichts geändert» auch nach Hin und Zurück stimmt
    if (Array.isArray(x)) return x.map(sauber);
    if (x && typeof x === 'object') { const o = {}; Object.keys(x).sort().forEach(k => { const v = sauber(x[k]); if (v === undefined || (v && typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length)) return; o[k] = v; }); return o; }
    return x;
  }
  const gleich = (a, b) => JSON.stringify(sauber(a || {})) === JSON.stringify(sauber(b || {}));
  const abend = id => A.abende.find(a => a.id === id);
  const z = id => (A.ent[id] = A.ent[id] || {});
  const zS = (id, k) => { const s = z(id).stuecke = z(id).stuecke || {}; return (s[k] = s[k] || {}); };
  const offen = () => Object.keys(A.ent).filter(id => abend(id) && !gleich(A.ent[id], A.gesp[id]));

  async function api(weg, o = {}) {
    let r;
    try { r = await fetch(weg, { method: o.methode || 'GET', headers: o.body ? { 'Content-Type': 'application/json' } : {}, body: o.body ? JSON.stringify(o.body) : undefined, cache: 'no-store' }); }
    catch (e) { throw new Error('VERBINDUNG · Der Server antwortet gerade nicht.'); }   // der Browser meldet hier nur Technik («Failed to fetch», «Load failed»); Prüfung 05.11.2026
    let d = {}; try { d = await r.json(); } catch (e) { /* leer */ }
    if (!r.ok) { const f = new Error(d.fehler || 'SERVER · Etwas ist schiefgegangen. Die Daten sind unverändert.'); f.status = r.status; throw f; }
    return d;
  }

  async function laden(behalten) {
    const [d, haus] = await Promise.all([api('/angelina-strelow/werkzeuge/api/abende'), api('/angelina-strelow/werkzeuge/api/sammlung/haus').catch(() => ({ daten: {} }))]);
    A.abende = d.abende.filter(a => a.status !== 'abgesagt');
    A.etag = d.etag;
    A.haus = haus.daten || {};
    window.TI_HAUS = A.haus;
    const gesp = {};
    A.abende.forEach(a => { if (a.tisch) gesp[a.id] = tief(a.tisch); });
    const alt = behalten ? tief(A.ent) : null;
    A.gesp = gesp;
    A.ent = tief(gesp);
    if (alt) Object.keys(alt).forEach(id => { if (abend(id)) A.ent[id] = alt[id]; });
  }

  /* ---------- Stand der Drucksachen ---------- */
  const imStation = a => STATION.includes(a.status);
  const wartet = (id, k) => T.wartetAuf(abend(id), A.ent[id], k);
  function stueckStand(id, k) {
    const st = ((A.ent[id] || {}).stuecke || {})[k];
    if (wartet(id, k).length) return 'vorschlag';   // Beispielinhalt ist nie druckfertig, auch nicht «in Arbeit»: es bleibt ein Vorschlag, bis der Abendplan führt
    if (st && st.fertig) return 'fertig';
    if (st && Object.keys(sauber(Object.assign({}, st, { fertig: undefined }))).length) return 'arbeit';
    return 'vorschlag';
  }
  const STAND_NAME = { fertig: 'Druckfertig', arbeit: 'In Arbeit', vorschlag: 'Vorschlag' };
  function standAbend(a) {
    const r = { fertig: [], fehlt: [] };
    T.STUECK_REIHE.forEach(k => (stueckStand(a.id, k) === 'fertig' ? r.fertig : r.fehlt).push(k));
    return r;
  }

  /* ---------- Fotos (Master 3: jede Liste mit Bild, passend zum Anlass) ---------- */
  const fotoKey = a => T.BILD_ABEND[a.id] || T.BILD_ANLASS[(a.anfrage || {}).anlass] || 'tisch';
  const foto = (k, gr) => `/angelina-strelow/werkzeuge/assets/bild/${k}-${gr || 640}.webp`;

  /* ---------- Rahmen: Kopf, Rand, Leiste ---------- */
  function kopf(titel, stand) {
    $('#kopf').innerHTML = WO.kopf({ werkzeug: 'tisch', unter: 'Drucksachen', titel, stand, pruefung: 'pruefung.html', anleitung: 'anleitung.html', website: WEBSITE, markeHref: '#start' });
  }
  function rand() {
    const s = A.sicht, zu = A.abende.filter(imStation);
    $('#rand').innerHTML = WO.rand([
      { eintraege: [{ text: 'Übersicht', an: s.art === 'start', href: '#start' }] },
      { titel: 'Abende', eintraege: zu.map(a => ({ text: a.gastgeber.name, zahl: standAbend(a).fehlt.length || 0, an: s.id === a.id && (s.art === 'abend' || s.art === 'stueck'), href: '#abend=' + a.id, attr: 'data-ti-abend="' + a.id + '"' })) },
      { titel: 'Werkstatt', eintraege: [{ text: 'Gestaltungen', zahl: T.STIL_REIHE.length, an: s.art === 'gestaltungen', href: '#gestaltungen' }, { text: 'Die Drucksachen', zahl: T.STUECK_REIHE.length, an: s.art === 'drucksachen', href: '#drucksachen' }] }
    ], { website: WEBSITE, anleitung: 'anleitung.html', pruefung: 'pruefung.html' });
  }

  let gruenBis = 0;
  function leiste() {
    const o = offen(), n = o.reduce((s, id) => s + eingaben(id), 0), ed = A.sicht.art === 'stueck';
    let titel, satz, knoepfe = '';
    if (n) { titel = n === 1 ? '1 Änderung nicht gespeichert' : n + ' Änderungen nicht gespeichert'; satz = 'Sie wartet, bis du speicherst.'; }
    else if (ed) {
      const st = stueckStand(A.sicht.id, A.sicht.k), w = wartet(A.sicht.id, A.sicht.k);
      titel = st === 'fertig' ? 'Druckfertig vermerkt' : 'Alles ist gespeichert';
      satz = st === 'fertig' ? 'Diese Drucksache ist bereit für den Druck.' : w.length ? 'Druckfertig, sobald der Abendplan ' + w.map(x => ({ gaenge: 'die Gerichte', weine: 'die Weine', ablauf: 'den Ablauf', gaeste: 'die Gäste' }[x])).join(' und ') + ' führt.' : 'Wenn alles stimmt: als druckfertig vermerken.';   // «Beispiel» sagt der Hinweis im Panel, einmal je Ansicht (Fehlerbuch 28.10.2026)
    } else { titel = 'Alles ist gespeichert'; satz = 'Jede Änderung wartet, bis du speicherst.'; }
    const gruen = Date.now() < gruenBis && !n;
    knoepfe += WO.knopf('Vorher, nachher', 'auge', 'glas', { klein: true, attr: 'data-tun="vorher"' });
    knoepfe += WO.knopf(gruen ? 'Gespeichert' : 'Speichern', 'haken', gruen ? 'fertig' : n ? 'wartet' : 'glas', { klein: true, id: 'speichern', attr: 'data-tun="speichern" title="Speichern (⌘S)"' });
    if (ed && !n) knoepfe += stueckStand(A.sicht.id, A.sicht.k) === 'fertig'
      ? WO.knopf('Wieder in Arbeit', 'stift', 'hell', { klein: true, attr: 'data-tun="fertig-weg"' })
      : wartet(A.sicht.id, A.sicht.k).length ? WO.knopf('Abendplan öffnen', 'pfeil', 'hell', { klein: true, href: (H.wege.abendplan || '/angelina-strelow/werkzeuge/abendplan/') + '#abend=' + A.sicht.id, neu: true })
      : WO.knopf('Druckfertig vermerken', 'haken', 'gold', { klein: true, attr: 'data-tun="fertig"' });
    $('#leiste').innerHTML = WO.leiste({ titel, satz, entwurf: !!n, knoepfe });
    $$('[data-tun="rueck"]').forEach(b => { b.hidden = !A.undo.length; }); $$('[data-tun="vor"]').forEach(b => { b.hidden = !A.redo.length; });   // wie Grösse und Plätze: ein Knopf ohne Wirkung verschwindet, nie ausgegraut
    document.title = (n ? '● ' : '') + name + ' · ' + H.name;
  }

  /* Änderungen eines Abends in Worten (für Leiste, Quittung, Verlauf) */
  function aenderungen(id) {
    const a = A.ent[id] || {}, b = A.gesp[id] || {}, out = [];
    if (a.stil !== b.stil && a.stil) out.push('Gestaltung «' + T.STILE[a.stil].name + '»');
    if (a.akzent !== b.akzent && a.akzent) out.push('Akzent ' + T.FARBEN[a.akzent].name);
    ['monogramm', 'kopf', 'wortmarke'].forEach(k => { if (!gleich({ v: a[k] }, { v: b[k] })) out.push({ monogramm: 'Monogramm', kopf: 'Kopf der Karten', wortmarke: 'Wortmarke im Fuss' }[k]); });
    if (!gleich(a.sitz, b.sitz)) out.push('Sitzordnung');
    if (!gleich(a.memory, b.memory)) out.push('Memory-Motive');
    T.STUECK_REIHE.forEach(k => {
      const x = ((a.stuecke || {})[k]) || {}, y = ((b.stuecke || {})[k]) || {};
      if (gleich(x, y)) return;
      const nm = T.STUECKE[k].name;
      Object.keys(Object.assign({}, x.texte, y.texte)).forEach(t => { if ((x.texte || {})[t] !== (y.texte || {})[t]) out.push(nm + ': «' + String((x.texte || {})[t] == null ? 'wie im Abendplan' : (x.texte || {})[t] || 'ausgeblendet').replace(/\s+/g, ' ').slice(0, 28) + '»'); });
      if (x.format !== y.format && x.format) out.push(nm + ': Format ' + T.FORMATE[x.format].name);
      if (!gleich(x.groesse, y.groesse)) out.push(nm + ': Grösse');
      if (!gleich(x.reihenfolge, y.reihenfolge)) out.push(nm + ': Reihenfolge');
      if (!gleich(x.aus, y.aus)) out.push(nm + ': ein- und ausgeblendet');
      if (!!x.weinImMenue !== !!y.weinImMenue) out.push(nm + ': Wein unter dem Gang');
      if (!!x.fertig !== !!y.fertig) out.push(nm + (x.fertig ? ': druckfertig' : ': wieder in Arbeit'));
    });
    const folge = out.filter(x => / wieder in Arbeit$/.test(x)), eigen = out.filter(x => !/ wieder in Arbeit$/.test(x));
    if (eigen.length && folge.length) eigen.push(folge.length === 1 ? folge[0] : folge.length + ' Drucksachen wieder in Arbeit');
    const liste = eigen.length ? eigen : folge;
    return liste.length ? liste : (gleich(a, b) ? [] : ['Gestaltung']);
  }
  const eingaben = id => aenderungen(id).length;

  /* ---------- Ändern (Entwurf) ---------- */
  let planZeichnen = 0;
  function aendere(id, fn, o = {}) {
    const vorher = JSON.stringify(A.ent[id] || {});
    fn(z(id));
    if (JSON.stringify(A.ent[id]) === vorher) return;
    if (o.fertigWeg !== false) {   // eine Änderung hebt «druckfertig» der betroffenen Drucksachen auf, damit der Stand stimmt
      const betroffen = o.stueck ? [o.stueck] : o.sitz ? ['tischplan', 'memory', 'tischkarten'] : T.STUECK_REIHE;
      betroffen.forEach(k => { const s = ((A.ent[id].stuecke || {})[k]); if (s && s.fertig) delete s.fertig; });
    }
    A.undo.push({ id, vorher }); if (A.undo.length > 80) A.undo.shift(); A.redo = [];
    leiste();
    if (o.still) return;
    cancelAnimationFrame(planZeichnen);
    planZeichnen = requestAnimationFrame(() => zeichne(o.ohneRand));
  }
  function rueck(stapel, gegen) {
    const s = stapel.pop(); if (!s) { quittung({ titel: 'Nichts zurückzunehmen', satz: 'Es gibt keine weitere Eingabe.' }); return; }
    gegen.push({ id: s.id, vorher: JSON.stringify(A.ent[s.id] || {}) });
    A.ent[s.id] = JSON.parse(s.vorher);
    leiste(); zeichne();
  }

  /* ---------- Speichern (R09, R10, R11) ---------- */
  let speichertGerade = false;
  async function speichern() {
    if (speichertGerade) return;
    const ids = offen();
    if (!ids.length) { quittung({ titel: 'Nichts geändert, nichts gespeichert.', satz: '' }); return; }
    speichertGerade = true;
    const was = [], alt = {};
    try {
      for (const id of ids) {
        const wert = sauber(A.ent[id]);
        const liste = aenderungen(id);
        const d = await api('/angelina-strelow/werkzeuge/api/teil/tisch/' + encodeURIComponent(id), { methode: 'PUT', body: { wert: Object.keys(wert).length ? wert : null, etag: A.etag.tisch, wer: 'Angelina', was: liste.join(', ').slice(0, 300) } });
        A.etag.tisch = d.etag;
        alt[id] = tief(A.gesp[id]);
        A.gesp[id] = tief(wert);
        liste.forEach(x => was.push(x));
      }
      gruenBis = Date.now() + 2600; setTimeout(leiste, 2700);
      leiste(); rand();
      quittung({ titel: 'Gespeichert', satz: was.slice(0, 3).join(' · ') + (was.length > 3 ? ' und ' + (was.length - 3) + ' weitere' : ''), vorher: alt, rueck: alt });
    } catch (e) {
      if (e.status === 409) {
        const eigene = {}; offen().forEach(id => { eigene[id] = { vorher: tief(A.gesp[id]), nachher: tief(A.ent[id]) }; });
        await laden();
        A.konflikt = eigene;
        zeichne();
        quittung({ titel: 'Nicht gespeichert', satz: String(e.message), fehler: true, stichwort: 'KONFLIKT', eigene: true });
      } else quittung({ titel: 'Nicht gespeichert', satz: klar(e) + ' Deine Eingaben bleiben stehen.', fehler: true, stichwort: stichwort(klar(e)) });
    } finally { speichertGerade = false; }
  }
  /* Nach einem Konflikt: nur das, was in diesem Fenster geändert wurde, auf den neuen Stand legen (Texte einzeln), alles andere bleibt wie gespeichert */
  function einsetzen(server, vorher, nachher) {
    const r = tief(server), v = vorher || {}, n = nachher || {};
    const setze = (ziel, k, wert) => { if (wert === undefined) delete ziel[k]; else ziel[k] = tief(wert); };
    new Set(Object.keys(v).concat(Object.keys(n))).forEach(k => { if (k !== 'stuecke' && !gleich({ x: v[k] }, { x: n[k] })) setze(r, k, n[k]); });
    const vs = v.stuecke || {}, ns = n.stuecke || {};
    new Set(Object.keys(vs).concat(Object.keys(ns))).forEach(k => {
      const a = vs[k] || {}, b = ns[k] || {}; if (gleich(a, b)) return;
      r.stuecke = r.stuecke || {}; const z0 = (r.stuecke[k] = r.stuecke[k] || {});
      new Set(Object.keys(a).concat(Object.keys(b))).forEach(f => {
        if (f === 'texte') { const at = a.texte || {}, bt = b.texte || {}; z0.texte = z0.texte || {}; new Set(Object.keys(at).concat(Object.keys(bt))).forEach(x => { if (at[x] !== bt[x]) setze(z0.texte, x, bt[x]); }); }
        else if (!gleich({ x: a[f] }, { x: b[f] })) setze(z0, f, b[f]);
      });
    });
    return r;
  }
  async function rueckgaengigGespeichert(alt) {
    try {
      for (const id of Object.keys(alt)) {
        const wert = sauber(alt[id]);
        const d = await api('/angelina-strelow/werkzeuge/api/teil/tisch/' + encodeURIComponent(id), { methode: 'PUT', body: { wert: Object.keys(wert).length ? wert : null, etag: A.etag.tisch, wer: 'Angelina', was: 'Rückgängig' } });
        A.etag.tisch = d.etag; A.gesp[id] = tief(wert); A.ent[id] = tief(wert);
      }
      zeichne(); quittung({ titel: 'Zurückgenommen', satz: 'Der vorige Stand ist wieder gespeichert.' });
    } catch (e) {
      if (e.status === 409) { await laden(); zeichne(); }
      quittung({ titel: 'Nicht zurückgenommen', satz: klar(e), fehler: true, stichwort: stichwort(klar(e)) });
    }
  }
  async function fertigSetzen(an) {
    const { id, k } = A.sicht;
    if (an && wartet(id, k).length) { quittung({ titel: 'Noch nicht druckfertig', satz: 'Auf diesem Blatt stehen noch Beispiele (' + wartet(id, k).map(x => T.QUELLE_NAME[x]).join(', ') + '). Erst wenn der Abendplan sie führt oder du sie hier überschreibst, kann es in den Druck.', fehler: true, stichwort: 'BEISPIEL' }); return; }
    aendere(id, zz => { const s = (zz.stuecke = zz.stuecke || {}); s[k] = s[k] || {}; if (an) s[k].fertig = true; else delete s[k].fertig; }, { fertigWeg: false, still: true });
    await speichern();
    zeichne();
  }
  const stichwort = t => (/^([A-ZÄÖÜ]+) ·/.exec(String(t || '')) || [])[1] || 'SERVER';
  /* Nie Technik zeigen (R24): Meldungen ohne Stichwort kommen vom Browser oder einer Bibliothek und werden durch einen Satz in Alltagssprache ersetzt */
  const klar = (e, std) => { const m = String((e && e.message) || ''); if (/^[A-ZÄÖÜ]+ ·/.test(m)) return m; console.error(e); return std || 'SERVER · Etwas ist schiefgegangen. Die Daten sind unverändert.'; };

  /* ---------- Quittung (R11): höchstens drei, 9 s, Rückgängig, Vorher/Nachher, Fehler mit «Was tun?» ---------- */
  function quittung(q) {
    const box = $('#meldung');
    const el = document.createElement('div');
    el.className = 'wo-quittung ti-quittung' + (q.fehler ? ' ti-quittung--fehler' : '');
    el.setAttribute('role', 'status');
    el.innerHTML = `<i>${WO.ic(q.fehler ? 'x' : 'haken')}</i><span><b>${esc(q.titel)}</b>${esc(q.satz || '')}</span>`
      + (q.vorher ? '<a href="#" data-q="vorher">Vorher, nachher</a>' : '') + (q.rueck ? '<a href="#" data-q="rueck">Rückgängig</a>' : '')
      + (q.eigene ? '<a href="#" data-q="eigene">Meine Eingaben wieder einsetzen</a>' : '')
      + (q.fehler ? `<a href="pruefung.html#${esc(q.stichwort || 'SERVER')}" target="_blank" rel="noopener">Was tun?</a>` : '')
      + `<button type="button" aria-label="Schliessen" data-q="zu">${WO.ic('x')}</button>`;
    el.addEventListener('click', e => {
      const t = e.target.closest('[data-q]'); if (!t) return; e.preventDefault();
      if (t.dataset.q === 'rueck') rueckgaengigGespeichert(q.rueck);
      if (t.dataset.q === 'vorher') vorherNachher(q.vorher);
      if (t.dataset.q === 'eigene' && A.konflikt) { Object.keys(A.konflikt).forEach(id => { if (abend(id)) A.ent[id] = einsetzen(A.ent[id], A.konflikt[id].vorher, A.konflikt[id].nachher); }); A.konflikt = null; leiste(); zeichne(); }
      el.remove();
    });
    box.appendChild(el);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => el.remove(), q.fehler ? 15000 : 9000);
  }

  /* ---------- Fenster ---------- */
  function fenster(o) {
    const f = $('#fenster');
    f.innerHTML = `<div class="ti-fe__grund" data-zu></div><div class="ti-fe" role="dialog" aria-modal="true" aria-labelledby="ti-fe-titel">
      <header class="ti-fe__kopf"><span class="wo-mk">${esc(o.mk || name)}</span><h2 id="ti-fe-titel">${o.titel}</h2><button class="wo-kn wo-kn--rund ti-fe__zu" type="button" aria-label="Schliessen" data-zu>${WO.ic('x')}</button></header>
      <div class="ti-fe__inhalt">${o.inhalt}</div>${o.fuss ? `<footer class="ti-fe__fuss">${o.fuss}</footer>` : ''}</div>`;
    f.hidden = false; document.documentElement.classList.add('ti-fe-auf');
    f.onclick = e => { if (e.target.closest('[data-zu]')) fensterZu(); };
    if (o.danach) o.danach(f);
    const fokus = $('.ti-fe button:not([data-zu]), .ti-fe input', f) || $('.ti-fe__zu', f); if (fokus) fokus.focus({ preventScroll: true });
    return f;
  }
  function fensterZu() { const f = $('#fenster'); f.hidden = true; f.innerHTML = ''; document.documentElement.classList.remove('ti-fe-auf'); }

  /* ---------- Blatt als Bild (Vorschau, Kacheln): das ganze Werk, nie beschnitten (Fehlerbuch 10a), nur ohne Beschnittzugabe ---------- */
  function blattBild(doc, i, breite, o = {}) {
    const f = doc.format, B = T.B, S = o.S || 4;
    const k = breite / (f.b * S), w = document.createElement('div');
    w.className = 'ti-bild'; w.style.width = breite + 'px'; w.style.height = Math.round(f.h * S * k) + 'px';
    const b = T.seiteDom(doc, i, S, { druck: !o.hilfe });
    b.style.transform = `translate(${-B * S * k}px,${-B * S * k}px) scale(${k})`; b.style.transformOrigin = '0 0'; b.style.position = 'absolute'; b.style.left = '0'; b.style.top = '0';
    w.appendChild(b);
    return w;
  }

  const passend = (doc, w, h) => Math.round(Math.min(w, h * doc.format.b / doc.format.h));

  /* ---------- Ansichten ---------- */
  function zeichne(ohneRand) {
    const s = A.sicht;
    document.documentElement.classList.toggle('ti-im-editor', s.art === 'stueck');
    if (!ohneRand) rand();
    leiste();
    if (s.art === 'abend' && abend(s.id)) return ansichtAbend(abend(s.id));
    if (s.art === 'stueck' && abend(s.id) && T.STUECKE[s.k]) return ansichtStueck(abend(s.id), s.k);
    if (s.art === 'gestaltungen') return ansichtGestaltungen();
    if (s.art === 'drucksachen') return ansichtDrucksachen();
    A.sicht = { art: 'start' };
    return ansichtStart();
  }

  function ansichtStart() {
    kopf('Übersicht', 'Drucksachen der Abende');
    const zu = A.abende.filter(imStation), vor = A.abende.filter(a => ['anfrage', 'angebot'].includes(a.status));
    const heute = new Date().toISOString().slice(0, 10);
    const kommend = zu.filter(a => (a.anfrage.datum || '') >= heute);
    const naechst = kommend[0] || zu[zu.length - 1];
    const offenZahl = kommend.reduce((n, a) => n + standAbend(a).fehlt.length, 0);
    let h = WO.startbild({ werkzeug: 'tisch', h1: `<span data-wo-gruss>${WO.gruss()}</span> <em>Was liegt am Tisch?</em>`, satz: esc(H.saetze.tisch) + ' Jeder Gast sieht deine Handschrift.',
      knoepfe: WO.knopf('Anleitung', 'buch', 'gold', { href: 'anleitung.html', neu: true }) + (naechst ? WO.knopf('Nächster Abend', 'rechts', 'glas', { href: '#abend=' + naechst.id }) : '') });
    h += '<div class="wo-lage">'
      + (naechst ? `<a class="wo-lg" href="#abend=${naechst.id}"><i class="wo-lg__z">${WO.ic('uhr')}</i><span class="wo-mk">Nächster Abend</span><b>${esc(naechst.gastgeber.name)}</b><p>${esc(T.datumLang(naechst.anfrage.datum))} · ${esc(naechst.anfrage.ort)}. ${standAbend(naechst).fertig.length} von ${T.STUECK_REIHE.length} Drucksachen druckfertig.</p><span class="wo-lk">Mappe öffnen</span></a>` : '')
      + `<div class="wo-lg"><i class="wo-lg__z">${WO.ic('karte')}</i><span class="wo-mk">Offen</span><b>${offenZahl ? offenZahl + ' Drucksachen' : 'Alles druckfertig'}</b><p>${offenZahl ? 'bei ' + kommend.length + (kommend.length === 1 ? ' kommendem Abend' : ' kommenden Abenden') + ' noch nicht druckfertig vermerkt.' : 'Für die kommenden Abende liegt alles bereit.'}</p></div>`
      + `<a class="wo-lg" href="#gestaltungen"><i class="wo-lg__z">${WO.ic('stift')}</i><span class="wo-mk">Gestaltungen</span><b>${T.STIL_REIHE.length} Stile</b><p>In deinen Farben, je Anlass passend: vom Gänseessen im Advent bis Silvester.</p><span class="wo-lk">Ansehen</span></a></div>`;
    /* Suchfeld wie «In deinen Medien suchen …» im Vorbild (⌘K): nach Gastgeber, Ort, Anlass, Datum und Gästen des Abendplans */
    h += `<div class="ti-zw"><h2 class="wo-zw">Die Abende <em>und ihre Drucksachen</em></h2><label class="wo-such ti-suche">${WO.ic('suche')}<input type="search" placeholder="Abende suchen …" aria-label="Abende suchen" data-suche value="${esc(A.suche || '')}" autocomplete="off" spellcheck="false"><kbd>⌘K</kbd></label></div>`
      + `<p class="ti-hinw">Alle Abende ausser Klaus und Tanja sind Beispiele.</p><div class="ti-liste" data-suchliste>${zu.map(zeileAbend).join('')}</div><p class="ti-hinw ti-suche__leer" hidden></p>`;
    if (vor.length) h += `<div data-suchgruppe><h2 class="wo-zw">Noch nicht <em>zugesagt</em></h2><p class="ti-hinw">Ansehen geht schon jetzt: so wird die Mappe aussehen.</p><div class="ti-liste" data-suchliste>${vor.map(zeileAbend).join('')}</div></div>`;
    $('#ansicht').innerHTML = h;
    if (A.suche) suchen();
  }
  function suchtext(a) {
    const d = a.anfrage || {}, P = T.planVon(a);
    return [a.gastgeber.name, d.ort, d.anlass, T.datumLang(d.datum), STATUS_NAME[a.status], P.titel, ...(P.beispiel.gaeste ? [] : P.gaeste.map(g => g.voll + ' ' + g.name))].join(' ').toLowerCase();
  }
  function suchen() {
    const q = (A.suche || '').trim().toLowerCase(), worte = q.split(/\s+/).filter(Boolean);
    let treffer = 0;
    $$('[data-suchliste] .ti-ab').forEach(el => { const a = abend(el.dataset.tiAbend), ja = !worte.length || (a && worte.every(w => suchtext(a).includes(w))); el.hidden = !ja; if (ja) treffer++; });
    $$('[data-suchliste]').forEach(l => { l.hidden = !$$('.ti-ab', l).some(e => !e.hidden); });
    $$('[data-suchgruppe]').forEach(g => { g.hidden = !$$('.ti-ab', g).some(e => !e.hidden); });
    const leer = $('.ti-suche__leer'); if (leer) { leer.hidden = !!treffer; leer.textContent = treffer ? '' : 'Kein Abend passt zu «' + A.suche.trim() + '». Gesucht wird in Gastgeber, Ort, Anlass, Datum und den Gästen des Abendplans.'; }
  }
  function zeileAbend(a) {
    const st = standAbend(a), zu = imStation(a), d = a.anfrage;
    const fehlt = st.fehlt.map(k => T.STUECKE[k].name);
    const stand = !zu ? 'Nach der Zusage' : !st.fehlt.length ? 'Alles druckfertig' : st.fertig.length ? st.fertig.length + ' von ' + T.STUECK_REIHE.length + ' druckfertig' : 'Noch nichts druckfertig';
    return `<a class="ti-ab${zu ? '' : ' ti-ab--leise'}" href="#abend=${a.id}" data-ti-abend="${a.id}"><span class="ti-ab__b"><img src="${foto(fotoKey(a))}" alt="" loading="lazy" decoding="async"></span>`
      + `<span class="ti-ab__t"><span class="ti-ab__k">${esc(T.datumLang(d.datum))}&nbsp;· ${esc(d.ort)}&nbsp;· ${esc(d.anlass)}</span><b>${esc(a.gastgeber.name)}</b>`
      + `<small>${zu ? (fehlt.length ? 'Fehlt noch: ' + esc(fehlt.join(', ')) : 'Begrüssung, Menü, Weine, Tischkarten, Tischplan, Memory und deine Karte liegen bereit.') : esc(STATUS_NAME[a.status]) + ': ' + esc(d.anlass) + ', ' + esc(d.gaeste === 'mehr' ? 'mehr als 16 Gäste' : d.gaeste + ' Gäste') + '. Die Drucksachen entstehen nach der Zusage.'}</small></span>`
      + `<span class="ti-ab__st"><em class="${!st.fehlt.length && zu ? 'ti-gut' : ''}">${esc(stand)}</em><small>${esc(STATUS_NAME[a.status])}</small></span></a>`;
  }

  function ansichtAbend(a) {
    const d = a.anfrage, P = T.planVon(a), zz = z(a.id), K = T.kontext(a, zz, 'menue', 'a5h');
    kopf(a.gastgeber.name, T.datumKurz(d.datum) + ' · ' + STATUS_NAME[a.status]);
    const st = standAbend(a);
    let h = WO.startbild({ werkzeug: 'tisch', art: 'buehne', foto: foto(fotoKey(a), 1000), zier: esc(d.anlass + ' · ' + d.ort), h1: `${esc(a.gastgeber.name)} <em>${esc(T.datumKurz(d.datum))}</em>`,
      satz: `${esc(d.wunsch)}`, knoepfe: WO.knopf('Ganze Mappe als PDF', 'pdf', 'gold', { attr: 'data-tun="mappe"' }) + WO.knopf('Gestaltung wählen', 'stift', 'glas', { attr: 'data-tun="gestaltung"' }) });
    const bsp = ['gaenge', 'weine', 'gaeste', 'ablauf'].filter(k => P.beispiel[k]);
    h += `<div class="ti-zeile">
      <div class="ti-gest"><span class="wo-mk">Gestaltung des Abends</span><b>${esc(K.stil.name)}</b><span>${esc(T.FARBEN[Object.keys(T.FARBEN).find(k => T.hex(k) === K.akzent)] ? T.FARBEN[Object.keys(T.FARBEN).find(k => T.hex(k) === K.akzent)].name : '')} · Monogramm ${esc(K.mono)}</span>${WO.knopf('Ändern', 'stift', 'hell', { klein: true, attr: 'data-tun="gestaltung"' })}</div>
      <div class="ti-gest"><span class="wo-mk">Aus dem Abendplan</span><b>${P.gaenge.length} Gänge · ${P.weine.length} Weine · ${P.gaeste.length} Gäste</b><span>${bsp.length ? 'Noch Beispiel: ' + bsp.map(k => ({ gaenge: 'Gänge', weine: 'Weine', gaeste: 'Gäste', ablauf: 'Ablauf' }[k])).join(', ') + ', bis der Abendplan sie führt.' : 'Alles aus dem Abendplan.'}</span>${WO.knopf('Abendplan öffnen', 'pfeil', 'hell', { klein: true, href: (H.wege.abendplan || '/angelina-strelow/werkzeuge/abendplan/') + '#abend=' + a.id, neu: true })}</div></div>`;
    if (!imStation(a)) h += `<p class="ti-hinw ti-hinw--rahmen">Dieser Abend ist noch nicht zugesagt (${esc(STATUS_NAME[a.status])}). Die Drucksachen zeigen, wie es aussehen wird; druckfertig werden sie nach der Zusage.</p>`;
    h += `<h2 class="wo-zw">Die Mappe <em>des Abends</em></h2><p class="ti-hinw">${st.fertig.length} von ${T.STUECK_REIHE.length} druckfertig. Ein Blatt öffnen, um Texte, Grösse, Format und Plätze zu ändern.</p><div class="ti-mappe" id="ti-mappe"></div>`;
    $('#ansicht').innerHTML = h;
    const m = $('#ti-mappe');
    T.STUECK_REIHE.forEach((k, n) => {
      const doc = T.setze(a, zz, k), pr = T.pruefe(doc), stand = stueckStand(a.id, k);
      const rot = pr.filter(x => x.stufe === 'rot').length, gelb = pr.length - rot;
      const kachel = document.createElement('a');
      kachel.className = 'ti-blk wo-bl-art'; kachel.href = '#stueck=' + a.id + '/' + k; kachel.dataset.stueck = k;
      kachel.innerHTML = `<span class="ti-blk__flaeche"></span><span class="ti-blk__t"><span class="ti-blk__k">${esc(T.FORMATE[doc.formatKey].name)}${doc.seiten.length > 1 ? '&nbsp;· ' + doc.seiten.length + ' Seiten' : ''}</span><b>${esc(T.STUECKE[k].lang)}</b>`
        + `<span class="ti-blk__st"><em class="ti-st ti-st--${stand}">${STAND_NAME[stand]}</em>${rot ? `<small class="ti-rot">${rot} zu klären</small>` : gelb ? `<small>${gelb} ${gelb === 1 ? 'Hinweis' : 'Hinweise'}</small>` : '<small>Druckprüfung ohne Befund</small>'}</span></span>`;
      const fl = $('.ti-blk__flaeche', kachel);
      fl.appendChild(blattBild(doc, 0, passend(doc, 204, 244)));
      m.appendChild(kachel);
    });
  }

  /* ---------- Editor einer Drucksache ---------- */
  function docAktuell() { const s = A.sicht; return T.setze(abend(s.id), z(s.id), s.k); }

  function ansichtStueck(a, k) {
    const doc = docAktuell(), info = T.STUECKE[k], fm = T.FORMATE[doc.formatKey];
    A.seite = Math.max(0, Math.min(A.seite, doc.seiten.length - 1));
    kopf(info.lang, a.gastgeber.name + ' · ' + STAND_NAME[stueckStand(a.id, k)]);
    const pr = T.pruefe(doc), rot = pr.filter(x => x.stufe === 'rot').length;
    const tabs = (info.sitz || info.jeGast ? [['plaetze', 'Plätze']] : []).concat([['inhalt', 'Inhalt'], ['gestaltung', 'Stil'], ['format', 'Format'], ['fassungen', 'Fassungen']]);
    if (!tabs.some(t => t[0] === A.tab)) A.tab = tabs[0][0];
    /* Rollstand des Panels nur behalten, wenn derselbe Reiter neu gezeichnet wird; ein neuer Reiter steht oben (Prüfung 05.11.2026) */
    const vorig = $('#ansicht .ti-ed-panel__in'), gleicherReiter = A.reiterVorher === a.id + '/' + k + '/' + A.tab, scrollPanel = vorig && gleicherReiter && $('.ti-ed', $('#ansicht')) ? vorig.scrollTop : 0;
    A.reiterVorher = a.id + '/' + k + '/' + A.tab;
    const fokus = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.feld ? { key: document.activeElement.dataset.feld, a: document.activeElement.selectionStart, b: document.activeElement.selectionEnd } : null;
    $('#ansicht').innerHTML = `<div class="ti-ed">
      <section class="ti-ed-buehne" aria-label="Blatt">
        <div class="ti-ed-leiste">
          <a class="ti-zurueck" href="#abend=${a.id}">${WO.ic('links')}<span>Mappe von ${esc(a.gastgeber.name)}</span></a>
          <span class="ti-ed-leiste__mitte">${doc.seiten.length > 1 ? `<button type="button" class="ti-rk" data-tun="seite-" aria-label="Vorige Seite">${WO.ic('links')}</button><span class="ti-seite">Seite ${A.seite + 1} von ${doc.seiten.length}${doc.seiten[A.seite].titel ? ' · ' + esc(doc.seiten[A.seite].titel) : ''}</span><button type="button" class="ti-rk" data-tun="seite+" aria-label="Nächste Seite">${WO.ic('rechts')}</button>` : ''}</span>
          <span class="ti-undo"><button type="button" class="ti-rk" data-tun="rueck" title="Rückgängig (⌘Z)" aria-label="Rückgängig"${A.undo.length ? '' : ' hidden'}>${IC('rueck')}</button><button type="button" class="ti-rk" data-tun="vor" title="Wiederholen (⇧⌘Z)" aria-label="Wiederholen"${A.redo.length ? '' : ' hidden'}>${IC('vor')}</button></span>
          <span class="ti-ed-leiste__r"><button type="button" class="ti-pruef${rot ? ' ti-pruef--rot' : pr.length ? ' ti-pruef--gelb' : ''}" data-tun="pruefung"><i></i>Druckprüfung<b class="wo-zahl">${pr.length}</b></button>${WO.knopf('PDF', 'pdf', 'dunkel', { klein: true, attr: 'data-tun="druck"' })}</span>
        </div>
        <div class="ti-flaeche" id="ti-flaeche"><div class="ti-halter" id="ti-halter"></div></div>
        <div class="ti-ed-fuss"><span class="ti-ed-fuss__f">${esc(fm.name)} · ${doc.format.b} × ${doc.format.h} mm${fm.falz ? ' · Falz bei ' + fm.falz + ' mm' : ''}</span>
          <label class="ti-schalter"><input type="checkbox" data-tun="schnitt"${A.schnitt ? ' checked' : ''}><span></span>Schnittkante</label>
          <span class="ti-zoom"><button type="button" class="ti-rk" data-tun="zoom-" aria-label="Kleiner">${IC('minus')}</button><button type="button" class="ti-zoom__w" data-tun="zoom0" title="Ganz zeigen">${A.zoom ? Math.round(A.zoom * 100) + ' %' : 'Ganz'}</button><button type="button" class="ti-rk" data-tun="zoom+" aria-label="Grösser">${WO.ic('plus')}</button></span></div>
      </section>
      <aside class="ti-ed-panel" aria-label="Bearbeiten"><div class="wo-seg ti-reiter" role="tablist">${tabs.map(t => `<button type="button" role="tab" aria-pressed="${A.tab === t[0]}" data-reiter="${t[0]}">${t[1]}</button>`).join('')}</div>
        <div class="ti-ed-panel__in" id="ti-panel">${panel(a, k, doc)}</div></aside>
    </div>`;
    buehne(doc);
    const pin = $('#ti-panel'); if (pin && scrollPanel) pin.scrollTop = scrollPanel;
    if (fokus) { const f = $(`[data-feld="${CSS.escape(fokus.key)}"]`); if (f) { f.focus({ preventScroll: true }); try { f.setSelectionRange(fokus.a, fokus.b); } catch (e) { /* kein Textfeld */ } } }
    if (A.tab === 'fassungen') ladeFassungen(a.id, k);
    if (A.tab === 'gestaltung') stilBilder(a, k);
    if ($('#ti-miniplan')) miniplan(a);   // die Tafel von oben im Reiter «Plätze» (Tischkarten, Memory, deine Karte)
  }

  function buehne(doc) {
    const fl = $('#ti-flaeche'), ha = $('#ti-halter'); if (!fl) return;
    const f = doc.format, B = T.B, S = 6;
    const blatt = T.seiteDom(doc, A.seite, S, {});
    const bw = (f.b + 2 * B) * S, bh = (f.h + 2 * B) * S;
    const platzW = fl.clientWidth - 56, platzH = Math.max(320, fl.clientHeight - 56);
    const fit = Math.min(platzW / (A.schnitt ? bw : f.b * S), platzH / (A.schnitt ? bh : f.h * S));
    const k = A.zoom || fit;
    ha.style.width = (A.schnitt ? bw : f.b * S) * k + 'px'; ha.style.height = (A.schnitt ? bh : f.h * S) * k + 'px';
    blatt.style.transformOrigin = '0 0';
    blatt.style.transform = (A.schnitt ? '' : `translate(${-B * S * k}px,${-B * S * k}px) `) + `scale(${k})`;
    blatt.style.position = 'absolute'; blatt.style.left = '0'; blatt.style.top = '0';
    ha.innerHTML = ''; ha.appendChild(blatt);
    ha.classList.toggle('ti-halter--schnitt', A.schnitt);
    if (A.schnitt) { const sk = document.createElement('div'); sk.className = 'ti-schnitt'; sk.style.cssText = `left:${B * S * k}px;top:${B * S * k}px;width:${f.b * S * k}px;height:${f.h * S * k}px`; ha.appendChild(sk); }
    A.k = k;
    $$('.el-key', blatt).forEach(e => { e.tabIndex = -1; if (e.dataset.key === A.sel) e.classList.add('ti-sel'); });
    if (A.wahlGast) $$('[data-platz]', blatt).forEach(e => e.classList.add('ti-ziel'));
  }

  /* Felder des Blatts: aus dem gesetzten Blatt gelesen, damit Feld und Blatt nie auseinanderlaufen */
  const FELD = { mono: 'Monogramm', namen: 'Namen im Kopf', zeile: 'Kleine Zeile', titel: 'Titel', datum: 'Datum', gang: 'Gang', name: 'Gericht', text: 'Beschreibung', wein: 'Wein dazu', zu: 'Wozu', detail: 'Jahrgang und Herkunft', notiz: 'Notiz', zeit: 'Uhrzeit', was: 'Was geschieht', satz: 'Satz', namenB: 'Namen', vorn: 'Vorderseite', hinten: 'Rückseite', platz: 'Am Platz', mail: 'E-Mail', insta: 'Instagram', kaffee: 'Kennenlernen' };
  function feldName(key, k) {
    if (key.startsWith('gast:')) return key.slice(5);
    const [vor, nach] = key.split('.');
    if (k === 'weine' && nach === 'name') return 'Wein';
    if (key === 'namen') return 'Namen der Gastgeber';
    if (key === 'tafel.mono') return 'Monogramm auf der Tafel';
    if (key === 'ablauf.titel') return 'Überschrift des Ablaufs';
    if (key.startsWith('fuss.')) return 'Zeile im Fuss';
    if (vor === 'memory') return { vorn: 'Empfang, Vorderseite', hinten: 'Empfang, Rückseite', platz: 'Karte am Platz' }[nach];
    if (vor === 'vorn' || vor === 'hinten') return (vor === 'vorn' ? 'Vorderseite' : 'Rückseite') + ': ' + (FELD[nach] || nach);
    return FELD[nach || vor] || key;
  }
  function felderAus(doc) {
    const seen = new Map();
    doc.seiten.forEach(s => s.el.forEach(e => { if (e.typ === 'text' && e.key && !seen.has(e.key)) seen.set(e.key, { key: e.key, text: e.text, std: e.key.startsWith('gast:') ? e.key.slice(5) : e.std, mehr: e.rolle === 'text' && !e.gross }); }));
    return [...seen.values()];
  }

  function feldHtml(f, k) {
    const geaendert = f.std != null && f.text !== f.std;
    const lang = f.mehr || f.text.length > 38 || /\n/.test(f.text);
    const input = lang ? `<textarea rows="${Math.min(4, Math.max(2, Math.ceil(f.text.length / 34)))}" data-feld="${esc(f.key)}">${esc(f.text)}</textarea>` : `<input type="text" value="${esc(f.text)}" data-feld="${esc(f.key)}">`;
    return `<label class="wo-feld ti-feld${A.sel === f.key ? ' ti-feld--sel' : ''}" data-feldkey="${esc(f.key)}"><span>${esc(feldName(f.key, k))}${geaendert ? `<button type="button" class="ti-std" data-std="${esc(f.key)}" title="${esc('Wie im Abendplan: ' + f.std)}">wie im Abendplan</button>` : ''}<button type="button" class="ti-aus" data-ausblenden="${esc(f.key)}" title="Diese Zeile nicht drucken">ausblenden</button></span>${input}</label>`;
  }

  function panel(a, k, doc) {
    const zz = z(a.id), st = (zz.stuecke || {})[k] || {}, info = T.STUECKE[k], K = doc.kontext;
    /* Einziger Hinweis «Beispiel» der Ansicht (Fehlerbuch 28.10.2026: höchstens einmal); dieselbe Prüfung wie Leiste und Druckprüfung (T.wartetAuf) */
    const hinweisBsp = (() => { const w = T.wartetAuf(a, zz, k, K.plan); if (!w.length) return ''; const nur = w.length === 1 && w[0] === 'ablauf'; const wer = w.map((x, i) => ({ gaenge: 'Gerichte', weine: 'Weine', ablauf: 'Ablauf', gaeste: 'Namen der Gäste' }[x])).join(' und ');
      return `<p class="ti-hinw ti-hinw--rahmen">${nur ? 'Der' : 'Die'} ${wer} ${nur ? 'ist' : 'sind'} noch ein Beispiel, bis der Abendplan ${nur ? 'ihn' : 'sie'} führt. Was du hier änderst, gilt nur für diese Drucksache; überschreibst oder blendest du alles davon aus, kann das Blatt in den Druck.</p>`; })();
    if (A.tab === 'inhalt') {
      const felder = felderAus(doc), gruppen = [];
      const blockVon = key => { const m = /^([gwa])(\d+)\./.exec(key); return m ? m[1] + m[2] : key.startsWith('gast:') ? 'gaeste' : /^(kopf|satz|namen|tafel)/.test(key) ? 'kopf' : /^fuss/.test(key) ? 'fuss' : 'text'; };
      felder.forEach(f => { const b = blockVon(f.key); let g = gruppen.find(x => x.b === b); if (!g) gruppen.push(g = { b, felder: [] }); g.felder.push(f); });
      const liste = { g: ['gaenge', 'Gang'], w: ['weine', 'Wein'], a: ['ablauf', 'Schritt'] };
      let h = hinweisBsp;
      gruppen.forEach(g => {
        const m = /^([gwa])(\d+)$/.exec(g.b);
        let titel = { kopf: 'Kopf', fuss: 'Fuss', gaeste: 'Namen der Gäste', text: 'Texte' }[g.b];
        let knoepfe = '';
        if (m) {
          const L = K.plan[liste[m[1]][0]], i = +m[2], it = L[i] || {};
          titel = liste[m[1]][1] + ': ' + (it.name || it.was || '');
          knoepfe = `<span class="ti-blockkn"><button type="button" class="ti-rk" data-hoch="${i}" aria-label="Nach oben">${IC('hoch')}</button><button type="button" class="ti-rk" data-runter="${i}" aria-label="Nach unten">${IC('runter')}</button><button type="button" class="ti-aus" data-blockaus="${g.b}">ausblenden</button></span>`;
        }
        h += `<section class="ti-block"><header><b>${esc(titel)}</b>${knoepfe}</header>${g.felder.map(f => feldHtml(f, k)).join('')}</section>`;
      });
      const aus = Object.keys(st.aus || {}).filter(x => st.aus[x]), leer = Object.keys(st.texte || {}).filter(x => st.texte[x] === '');
      if (aus.length || leer.length) h += `<section class="ti-block"><header><b>Ausgeblendet</b></header>${aus.map(b => { const m = /^([gwa])(\d+)$/.exec(b); const it = m ? (K.plan[liste[m[1]][0]][+m[2]] || {}) : {}; return `<p class="ti-ausz"><span>${esc(m ? liste[m[1]][1] + ': ' + (it.name || it.was || '') : b)}</span><button type="button" class="ti-std" data-blockein="${b}">einblenden</button></p>`; }).join('')}${leer.map(x => `<p class="ti-ausz"><span>${esc(feldName(x, k))}</span><button type="button" class="ti-std" data-std="${esc(x)}">einblenden</button></p>`).join('')}</section>`;
      if (k === 'menue') h += `<section class="ti-block"><header><b>Weine im Menü</b></header>${K.stil.weinImMenue ? '<p class="ti-klein">Die Gestaltung «Weinabend» setzt jeden Wein unter seinen Gang.</p>' : `<label class="ti-schalter ti-schalter--hell"><input type="checkbox" data-wein-menue${st.weinImMenue ? ' checked' : ''}><span></span>Jeden Wein unter seinen Gang setzen</label>`}</section>`;
      if (k === 'memory') h += `<section class="ti-block"><header><b>Motive der Gäste</b></header><div class="ti-motive">${T.gastReihe(K).map((g, i) => { const mo = T.motivFuer(K, g.name, i); return `<button type="button" class="ti-motiv" data-motiv-gast="${esc(g.name)}"><svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${T.MOTIVE[mo].d.map(d => `<path d="${d}"/>`).join('')}</g></svg><span><b>${esc(K.gastName(g.name))}</b><small>${esc(T.MOTIVE[mo].name)}</small></span></button>`; }).join('')}</div></section>`;
      h += '<p class="ti-tipp">Im Blatt schreiben: Doppelklick auf einen Text.</p>';
      return h;
    }
    if (A.tab === 'gestaltung') {
      const dunkel = T.FARBEN[K.stil.grund].dunkel, akz = T.AKZENTE[dunkel ? 'dunkel' : 'hell'];
      const akzJetzt = Object.keys(T.FARBEN).find(x => T.hex(x) === K.akzent);
      return `<p class="ti-hinw">Gilt für alle Drucksachen dieses Abends, damit der ganze Tisch aus einem Guss ist.</p>
        <section class="ti-block"><header><b>Stil</b><small>${esc(K.stil.name)}</small></header><div class="ti-stile" id="ti-stile">${T.STIL_REIHE.map(s => `<button type="button" class="ti-stil${(zz.stil || T.stilVorschlag(a)) === s ? ' ti-stil--an' : ''}" data-stil="${s}" aria-pressed="${(zz.stil || T.stilVorschlag(a)) === s}"><span class="ti-stil__b" data-stilbild="${s}"></span><b>${esc(T.STILE[s].name)}</b></button>`).join('')}</div><p class="ti-klein">${esc(K.stil.satz)}</p></section>
        <section class="ti-block"><header><b>Akzentfarbe</b><small>${esc(T.FARBEN[akzJetzt] ? T.FARBEN[akzJetzt].name : '')}</small></header><div class="ti-farben">${akz.map(f => `<button type="button" class="ti-farbe${akzJetzt === f ? ' ti-farbe--an' : ''}" data-akzent="${f}" aria-pressed="${akzJetzt === f}"><i style="background:${T.hex(f)}"></i><span>${esc(T.FARBEN[f].name)}</span></button>`).join('')}</div></section>
        <section class="ti-block"><header><b>Kopf der Karten</b></header><div class="wo-wahl ti-wahl" role="group">${[['zeile', 'Zeile'], ['monogramm', 'Monogramm'], ['namen', 'Namen']].map(([v, t]) => `<button type="button" data-kopf="${v}" aria-pressed="${K.kopf === v}">${t}</button>`).join('')}</div>
          <label class="wo-feld ti-feld"><span>Monogramm oder Namen der Gastgeber</span><input type="text" maxlength="24" value="${esc(K.mono)}" data-monogramm></label></section>
        <section class="ti-block"><header><b>Deine Wortmarke</b></header><label class="ti-schalter ti-schalter--hell"><input type="checkbox" data-wortmarke${K.wortmarke ? ' checked' : ''}><span></span>Klein im Fuss jeder Karte</label></section>`;
    }
    if (A.tab === 'format') {
      const gruppen = [...new Set(felderAus(doc).length ? doc.seiten.flatMap(s => s.el.filter(e => e.typ === 'text' && e.gruppe && !(e.key || '').startsWith('gast:')).map(e => e.gruppe)) : [])];
      return `<section class="ti-block"><header><b>Format</b></header><div class="ti-formate">${info.formate.map(f => { const F = T.FORMATE[f]; return `<button type="button" class="ti-format${doc.formatKey === f ? ' ti-format--an' : ''}" data-format="${f}" aria-pressed="${doc.formatKey === f}"><i style="aspect-ratio:${F.b}/${F.h}"></i><span><b>${esc(F.name)}</b><small>${esc(F.art)}</small></span></button>`; }).join('')}</div></section>`
        + (gruppen.length ? `<section class="ti-block"><header><b>Grösse</b><small>in festen Stufen</small></header>${gruppen.map(g => { const v = +((st.groesse || {})[g]) || 0; return `<div class="ti-stufe"><span>${esc(T.ROLLEN_NAMEN[g])}</span><button type="button" class="ti-rk" data-groesse="${g}" data-d="-1" aria-label="Kleiner"${v <= T.STUFEN.min ? ' hidden' : ''}>${IC('minus')}</button><b class="wo-zahl">${v > 0 ? '+' + v : v}</b><button type="button" class="ti-rk" data-groesse="${g}" data-d="1" aria-label="Grösser"${v >= T.STUFEN.max ? ' hidden' : ''}>${WO.ic('plus')}</button></div>`; }).join('')}${doc.faktor < 1 ? `<p class="ti-klein">Damit alles aufs Blatt passt, ist der Satz auf ${Math.round(doc.faktor * 100)} % gesetzt.</p>` : ''}</section>` : '');
    }
    if (A.tab === 'plaetze') {
      const SZ = T.sitz(K), plan = T.setze(a, zz, 'tischplan', SZ.form === 'lang' ? 'a4q' : 'a4h');
      const gaeste = K.plan.gaeste.map(g => g.name), platzVon = {}; Object.keys(SZ.bel).forEach(i => { platzVon[SZ.bel[i]] = +i; });
      return hinweisBsp + `<section class="ti-block"><header><b>Tafel</b></header><div class="wo-wahl ti-wahl" role="group"><button type="button" data-form="rund" aria-pressed="${SZ.form === 'rund'}">Runde Tafel</button><button type="button" data-form="lang" aria-pressed="${SZ.form === 'lang'}">Lange Tafel</button></div>
        <div class="ti-stufe"><span>Plätze</span><button type="button" class="ti-rk" data-plaetze="-1" aria-label="Ein Platz weniger"${SZ.n <= 2 ? ' hidden' : ''}>${IC('minus')}</button><b class="wo-zahl">${SZ.n}</b><button type="button" class="ti-rk" data-plaetze="1" aria-label="Ein Platz mehr"${SZ.n >= T.MAX_PLAETZE ? ' hidden' : ''}>${WO.ic('plus')}</button></div>
        ${SZ.form === 'lang' ? `<label class="ti-schalter ti-schalter--hell"><input type="checkbox" data-kopfenden${SZ.kopf ? ' checked' : ''}><span></span>Je ein Platz an den Kopfenden</label>` : ''}</section>
        <section class="ti-block"><header><b>Gäste</b><small>${Object.keys(SZ.bel).length} von ${gaeste.length} gesetzt</small></header><p class="ti-klein">Einen Namen auf einen Platz ziehen. Oder: Namen antippen, dann den Platz.</p>
        ${gaeste.length > T.MAX_PLAETZE ? `<p class="ti-hinw ti-hinw--rahmen">Eine Tafel hat hier höchstens ${T.MAX_PLAETZE} Plätze. Bei ${gaeste.length} Gästen setzt du hier die Tafel der Gastgeber; die übrigen ${gaeste.length - T.MAX_PLAETZE} sitzen an den weiteren Tischen frei. Ihre Tischkarten entstehen trotzdem, der Tischplan nennt nur die Tafel.</p>` : ''}
        <div class="ti-gaeste" data-gaesteliste>${gaeste.map(n => `<button type="button" class="ti-gast${platzVon[n] != null ? ' ti-gast--gesetzt' : ''}${A.wahlGast === n ? ' ti-gast--wahl' : ''}" data-gast="${esc(n)}"><span>${esc(K.gastName(n))}</span><small class="wo-zahl">${platzVon[n] != null ? 'Platz ' + (platzVon[n] + 1) : 'frei'}</small></button>`).join('')}</div>
        <div class="ti-knr">${WO.knopf('Der Reihe nach', 'pfeil', 'hell', { klein: true, attr: 'data-tun="reihe"' })}${WO.knopf('Abwechselnd', 'pfeil', 'hell', { klein: true, attr: 'data-tun="abwechselnd"' })}${WO.knopf('Alle Plätze leeren', 'x', 'hell', { klein: true, attr: 'data-tun="leeren"' })}</div></section>
        ${k !== 'tischplan' ? `<section class="ti-block"><header><b>Die Tafel von oben</b></header><div class="ti-miniplan" id="ti-miniplan"></div></section>` : ''}`
        + (k !== 'tischplan' ? '' : '');
    }
    if (A.tab === 'fassungen') return '<div id="ti-fassungen"><p class="ti-klein">Frühere Fassungen werden geladen …</p></div>';
    return '';
  }

  /* Kleine Bilder der Stile im Reiter «Gestaltung»: dieselbe Drucksache in jedem Stil, erst wenn sie zu sehen sind */
  function stilBilder(a, k) {
    const ob = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { ob.unobserve(e.target); male(e.target); } }), { root: $('#ti-panel') }) : null;
    const male = el => {
      const s = el.dataset.stilbild, zz = Object.assign(tief(z(a.id)), { stil: s, akzent: undefined });
      const kk = ['tischkarten', 'memory', 'angelina'].includes(k) ? 'menue' : k;
      const doc = T.setze(a, zz, kk, T.STUECKE[kk].formate[0]);
      el.appendChild(blattBild(doc, 0, 64, { S: 3 }));
    };
    $$('[data-stilbild]').forEach(el => (ob ? ob.observe(el) : male(el)));
  }
  function miniplan(a) {
    const mp = $('#ti-miniplan'); if (!mp) return;
    const K = T.kontext(a, z(a.id), 'tischplan', 'a4h'), SZ = T.sitz(K);
    const doc = T.setze(a, z(a.id), 'tischplan', SZ.form === 'lang' ? 'a4q' : 'a4h');
    mp.innerHTML = ''; mp.appendChild(blattBild(doc, 0, mp.clientWidth || 280, { S: 3, hilfe: true }));
    if (A.wahlGast) $$('[data-platz]', mp).forEach(e => e.classList.add('ti-ziel'));
  }

  async function ladeFassungen(id, k) {
    const box = $('#ti-fassungen'); if (!box) return;
    try {
      const d = await api('/angelina-strelow/werkzeuge/tisch/api/fassungen?abend=' + encodeURIComponent(id) + '&stueck=' + k);
      if (!$('#ti-fassungen')) return;
      const zeit = t => { const m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/.exec(t); return m ? `${+m[3]}.${+m[2]}.${m[1]}, ${m[4]}:${m[5]} Uhr` : t; };
      box.innerHTML = `<p class="ti-hinw">Jedes Speichern legt eine Fassung ab. Zurückholen legt sie in den Entwurf; gespeichert wird erst mit «Speichern».</p><ul class="ti-fassungen">`
        + d.fassungen.map(f => `<li><span><b>${esc(zeit(f.zeit))}</b><small>${esc(f.kurz)}</small></span>${WO.knopf('In den Entwurf holen', 'zurueck', 'hell', { klein: true, attr: `data-fassung="${esc(f.datei)}"` })}</li>`).join('')
        + `<li class="ti-fassungen__ur"><span><b>Ursprünglicher Stand</b><small>so, wie die Drucksache zuerst angelegt war</small></span>${WO.knopf('In den Entwurf holen', 'zurueck', 'hell', { klein: true, attr: 'data-fassung="ursprung"' })}</li></ul>`
        + (d.fassungen.length ? '' : '<p class="ti-klein">Noch keine früheren Fassungen: Sie entstehen mit jedem Speichern.</p>');
    } catch (e) { box.innerHTML = `<p class="ti-hinw ti-hinw--rahmen">${esc(klar(e))}</p>`; }
  }
  async function fassungHolen(datei) {
    const { id, k } = A.sicht;
    try {
      const d = datei === 'ursprung' ? await api('/angelina-strelow/werkzeuge/tisch/api/ursprung?abend=' + encodeURIComponent(id)) : await api('/angelina-strelow/werkzeuge/tisch/api/fassung?abend=' + encodeURIComponent(id) + '&datei=' + encodeURIComponent(datei));
      const alt = d.zustand || {};
      aendere(id, zz => {
        ['stil', 'akzent', 'monogramm', 'kopf', 'wortmarke'].forEach(x => { if (alt[x] === undefined) delete zz[x]; else zz[x] = alt[x]; });
        zz.stuecke = zz.stuecke || {};
        if ((alt.stuecke || {})[k]) zz.stuecke[k] = tief(alt.stuecke[k]); else delete zz.stuecke[k];
        if (T.STUECKE[k].sitz || T.STUECKE[k].jeGast) { if (alt.sitz) zz.sitz = tief(alt.sitz); else delete zz.sitz; }
        if (k === 'memory') { if (alt.memory) zz.memory = tief(alt.memory); else delete zz.memory; }
      }, { fertigWeg: false });
      quittung({ titel: 'In den Entwurf geholt', satz: datei === 'ursprung' ? 'Der ursprüngliche Stand liegt im Entwurf. Speichern, um ihn zu behalten.' : 'Die Fassung liegt im Entwurf. Speichern, um sie zu behalten.' });
    } catch (e) { quittung({ titel: 'Nicht geholt', satz: klar(e), fehler: true, stichwort: stichwort(klar(e)) }); }
  }

  /* ---------- Gestaltungen und Drucksachen (Werkstatt) ---------- */
  function beispielAbend() { const heute = new Date().toISOString().slice(0, 10); return A.abende.filter(imStation).find(a => a.anfrage.datum >= heute) || A.abende.find(a => a.id === 'a-251214-kt') || A.abende[0]; }
  function ansichtGestaltungen() {
    kopf('Gestaltungen', T.STIL_REIHE.length + ' Stile in deinen Farben');
    const a = beispielAbend();
    $('#ansicht').innerHTML = WO.startbild({ werkzeug: 'tisch', art: 'buehne', foto: foto('festtafel', 1000), h1: 'Gestaltungen <em>für jeden Anlass</em>', satz: 'Jeder Stil ist aus einem Guss: deine Rahmenlinie als Ornament, Della Respira für Titel, Montserrat zum Lesen. Gezeigt an der Menükarte von ' + esc(a.gastgeber.name) + '.' })
      + `<div class="ti-raster" id="ti-raster"></div>`;
    const r = $('#ti-raster');
    T.STIL_REIHE.forEach(s => {
      const st = T.STILE[s], doc = T.setze(a, Object.assign(tief(z(a.id)), { stil: s, akzent: undefined }), 'menue', 'a5h');
      const k = document.createElement('button'); k.type = 'button'; k.className = 'ti-blk ti-blk--stil'; k.dataset.stilwahl = s;
      k.innerHTML = `<span class="ti-blk__flaeche"></span><span class="ti-blk__t"><span class="ti-blk__k">${esc(st.passt.join(' · '))}</span><b>${esc(st.name)}</b><small>${esc(st.satz)}</small></span>`;
      $('.ti-blk__flaeche', k).appendChild(blattBild(doc, 0, passend(doc, 204, 244)));
      r.appendChild(k);
    });
  }
  function stilFenster(s) {
    const st = T.STILE[s], zu = A.abende.filter(imStation), a0 = beispielAbend();
    fenster({ mk: 'Gestaltung', titel: esc(st.name), inhalt: `<p class="ti-fe__satz">${esc(st.satz)}</p><div class="ti-fe__drei" id="ti-drei"></div><h3 class="ti-fe__h">Für welchen Abend?</h3><div class="ti-fe__abende">${zu.map(a => `<button type="button" class="ti-fe__ab" data-stil-fuer="${a.id}" data-stil="${s}"><img src="${foto(fotoKey(a))}" alt=""><span><b>${esc(a.gastgeber.name)}</b><small>${esc(T.datumKurz(a.anfrage.datum))} · jetzt «${esc(T.kontext(a, z(a.id), 'menue', 'a5h').stil.name)}»</small></span></button>`).join('')}</div>`,
      danach: f => { const d = $('#ti-drei', f); ['begruessung', 'menue', 'tischkarten'].forEach(k => { const doc = T.setze(a0, Object.assign(tief(z(a0.id)), { stil: s, akzent: undefined }), k); d.appendChild(blattBild(doc, 0, k === 'tischkarten' ? 150 : 170)); }); } });
  }
  function ansichtDrucksachen() {
    kopf('Die Drucksachen', T.STUECK_REIHE.length + ' Stücke für jeden Abend');
    const a = A.abende.find(x => x.id === 'a-251214-kt') || beispielAbend();
    $('#ansicht').innerHTML = WO.startbild({ werkzeug: 'tisch', art: 'buehne', foto: foto('tisch', 1000), h1: 'Was am Tisch liegt <em>und wozu</em>', satz: 'Sieben Stücke begleiten einen Abend vom Eingang bis zum Platz. Gezeigt am Abend von Klaus und Tanja, mit der Sitzordnung als Memory-Spiel.' })
      + '<div class="ti-raster ti-raster--arten" id="ti-raster"></div>';
    const r = $('#ti-raster');
    T.STUECK_REIHE.forEach(k => {
      const info = T.STUECKE[k], doc = T.setze(a, z(a.id), k);
      const el = document.createElement('button'); el.type = 'button'; el.className = 'ti-blk ti-blk--art'; el.dataset.artwahl = k;
      el.innerHTML = `<span class="ti-blk__flaeche"></span><span class="ti-blk__t"><span class="ti-blk__k">${info.formate.map(f => esc(T.FORMATE[f].name)).join(' · ')}</span><b>${esc(info.lang)}</b><small>${esc(info.satz)}</small></span>`;
      $('.ti-blk__flaeche', el).appendChild(blattBild(doc, 0, passend(doc, 204, 244)));
      r.appendChild(el);
    });
  }
  function artFenster(k) {
    const zu = A.abende.filter(imStation);
    fenster({ mk: 'Drucksache', titel: esc(T.STUECKE[k].lang), inhalt: `<p class="ti-fe__satz">${esc(T.STUECKE[k].satz)}</p><h3 class="ti-fe__h">Bei welchem Abend öffnen?</h3><div class="ti-fe__abende">${zu.map(a => `<a class="ti-fe__ab" href="#stueck=${a.id}/${k}"><img src="${foto(fotoKey(a))}" alt=""><span><b>${esc(a.gastgeber.name)}</b><small>${esc(T.datumKurz(a.anfrage.datum))} · ${STAND_NAME[stueckStand(a.id, k)]}</small></span></a>`).join('')}</div>` });
  }

  /* ---------- Gestaltung des Abends (Fenster aus der Mappe) ---------- */
  function gestaltungFenster(a) {
    fenster({ mk: 'Gestaltung des Abends', titel: esc(a.gastgeber.name), inhalt: '<div id="ti-gest-fe"></div>', danach: () => malGest() });
    function malGest() {
      const box = $('#ti-gest-fe'); if (!box) return;
      const doc = T.setze(a, z(a.id), 'menue');
      const tab = A.tab; A.tab = 'gestaltung';
      box.innerHTML = `<div class="ti-gest-fe"><div class="ti-gest-fe__bild" id="ti-gest-bild"></div><div class="ti-gest-fe__wahl">${panel(a, 'menue', doc)}</div></div>`;
      A.tab = tab;
      const gb = $('#ti-gest-bild'); gb.appendChild(blattBild(doc, 0, Math.max(120, Math.min(300, (gb.clientWidth || 340) - 40))));   // am Handy nie breiter als das Fenster
      $$('[data-stilbild]', box).forEach(el => { const zz = Object.assign(tief(z(a.id)), { stil: el.dataset.stilbild, akzent: undefined }); el.appendChild(blattBild(T.setze(a, zz, 'menue'), 0, 64, { S: 3 })); });
    }
    A.gestFenster = malGest;
  }

  /* ---------- Vorher, nachher ---------- */
  function vorherNachher(alt) {
    const s = A.sicht;
    let id = s.id, k = s.k || 'menue';
    if (alt && !alt[id]) id = Object.keys(alt)[0];
    if (!id || !abend(id)) { fenster({ mk: 'Vorher, nachher', titel: 'Nichts zu vergleichen', inhalt: '<p class="ti-fe__satz">Öffne eine Drucksache, dann zeigt dieses Fenster den gespeicherten Stand neben deinen Änderungen.</p>' }); return; }
    const a = abend(id), vorher = alt ? alt[id] : A.gesp[id], nachher = alt ? A.gesp[id] : A.ent[id];
    fenster({ mk: 'Vorher, nachher', titel: esc(T.STUECKE[k].lang + ' · ' + a.gastgeber.name), inhalt: `<div class="ti-vn"><figure><figcaption>${alt ? 'Vorher' : 'Gespeichert'}</figcaption><div id="ti-vn-a"></div></figure><figure><figcaption>${alt ? 'Nachher' : 'Mit deinen Änderungen'}</figcaption><div id="ti-vn-b"></div></figure></div><ul class="ti-vn__liste">${(alt ? [] : aenderungen(id)).map(x => '<li>' + esc(x) + '</li>').join('')}</ul>`,
      danach: f => { const w = Math.min(300, (f.querySelector('.ti-fe').clientWidth - 90) / 2); $('#ti-vn-a').appendChild(blattBild(T.setze(a, tief(vorher), k), Math.min(A.seite, T.setze(a, tief(vorher), k).seiten.length - 1), w)); $('#ti-vn-b').appendChild(blattBild(T.setze(a, tief(nachher), k), Math.min(A.seite, T.setze(a, tief(nachher), k).seiten.length - 1), w)); } });
  }

  /* ---------- Druck: Vorschau und PDF (je Stück und ganze Mappe) ---------- */
  /* Zwei Fassungen jedes PDFs (Robert, 06.11.2026: «Warum ist bei der Menükarte so ein weisser Rand?»):
     «PDF speichern» gibt die fertige Karte, randlos im Endformat, ohne Schnittmarken; ein Bogen wird dabei zu einzelnen Karten.
     «Für die Druckerei» gibt die Druckfassung mit 3 mm Beschnitt und Schnittmarken (ein Bogen so, wie er gewählt ist). */
  const fertigeDocs = docs => docs.map(d => { const fm = T.FORMATE[d.formatKey]; return fm.bogen ? T.setzeDruck(d.kontext.a, d.kontext.z, d.stueck, fm.bogen.karte) : d; });
  function druckFenster(docs, titel, dateiname) {
    const fertig = fertigeDocs(docs), seiten = fertig.reduce((n, d) => n + d.seiten.length, 0), dSeiten = docs.reduce((n, d) => n + d.seiten.length, 0), bogen = docs.some(d => T.FORMATE[d.formatKey].bogen);
    const pr = docs.flatMap(d => T.pruefe(d)), rot = pr.filter(x => x.stufe === 'rot');
    fenster({ mk: 'Druck', titel: esc(titel), inhalt: `<p class="ti-fe__satz">${seiten === 1 ? 'Eine Seite: die fertige Karte' : seiten + ' Seiten, jede die fertige Karte'} randlos im Endformat, zum Ansehen und Verschicken. «Für die Druckerei» gibt die Druckfassung mit 3 mm Beschnitt und Schnittmarken${bogen ? ', die Bogen so, wie sie gewählt sind' : ''}. Beides entsteht hier auf dem Rechner, mit eingebetteten Schriften.${docs.length === 1 ? ' «Bild dieser Seite» gibt ein PNG zum Verschicken, etwa vorab an den Gastgeber.' : ''}</p>
      ${rot.length ? `<p class="ti-hinw ti-hinw--rot">Die Druckprüfung nennt ${rot.length === 1 ? 'eine Sache' : rot.length + ' Sachen'}, die vor dem Druck zu klären ${rot.length === 1 ? 'ist' : 'sind'}: ${esc(rot[0].text)}</p>` : ''}
      <div class="ti-druck-vor" id="ti-druck-vor"></div><p class="ti-druck-stand" id="ti-druck-stand" aria-live="polite"></p>`,
      fuss: (docs.length === 1 ? WO.knopf('Bild dieser Seite', 'foto', 'hell', { attr: 'data-png-los title="PNG zum Verschicken, etwa an den Gastgeber"', id: 'ti-png-los' }) : '') + WO.knopf('Für die Druckerei', 'pdf', 'hell', { attr: 'data-pdf-druckerei title="Mit 3 mm Beschnitt und Schnittmarken"', id: 'ti-pdf-druckerei' }) + WO.knopf('PDF speichern', 'pdf', 'dunkel', { attr: 'data-pdf-los', id: 'ti-pdf-los' }),
      danach: f => {
        const v = $('#ti-druck-vor', f); let n = 0;
        for (const d of fertig) for (let i = 0; i < d.seiten.length && n < 24; i++, n++) { const fi = document.createElement('figure'); fi.appendChild(blattBild(d, i, d.format.b > 150 ? 150 : 110)); const c = document.createElement('figcaption'); c.textContent = (docs.length > 1 ? T.STUECKE[d.stueck].name + ' · ' : '') + (d.seiten[i].titel || 'Seite ' + (i + 1)); fi.appendChild(c); v.appendChild(fi); }
        if (seiten > 24) { const p = document.createElement('p'); p.className = 'ti-klein'; p.textContent = 'und ' + (seiten - 24) + ' weitere Seiten'; v.appendChild(p); }
        T.vorladenPdf();
        f.onclick = async e => {
          if (e.target.closest('[data-zu]')) return fensterZu();
          if (e.target.closest('[data-png-los]')) {   // Bild dieser Seite (Vorbild: «Bild dieser Seite · PNG, zum Verschicken»)
            const d = docs[0], i = A.sicht.art === 'stueck' && A.sicht.k === d.stueck ? Math.min(A.seite, d.seiten.length - 1) : 0;
            const knopf = $('#ti-png-los'), stand = $('#ti-druck-stand'), dn = dateiname.replace(/\.pdf$/, '') + (d.seiten.length > 1 ? ' Seite ' + (i + 1) : '') + '.png';
            knopf.disabled = true; stand.textContent = 'Das Bild wird gerechnet …';
            try {
              const b = await T.png(d, i);
              T.speichereDatei(b, dn, 'image/png');
              stand.textContent = `Gespeichert: ${dn} (${d.seiten.length > 1 ? 'Seite ' + (i + 1) + ' · ' : ''}${Math.round(b.size / 1024)} KB, zum Verschicken).`;
              A.letztesBild = { name: dn, kb: Math.round(b.size / 1024) };
            } catch (err) {
              const m = klar(err, 'BILD · Das Bild ist nicht entstanden. Noch einmal versuchen.');
              stand.textContent = m; quittung({ titel: 'Bild nicht gespeichert', satz: m, fehler: true, stichwort: stichwort(m) });
            } finally { knopf.disabled = false; }
            return;
          }
          const druckerei = !!e.target.closest('[data-pdf-druckerei]');
          if (!druckerei && !e.target.closest('[data-pdf-los]')) return;
          const knopf = $(druckerei ? '#ti-pdf-druckerei' : '#ti-pdf-los'), stand = $('#ti-druck-stand');
          const dn = druckerei ? dateiname.replace(/\.pdf$/, ' für die Druckerei.pdf') : dateiname, n0 = druckerei ? dSeiten : seiten;
          knopf.disabled = true;
          try {
            const r = await T.pdf(druckerei ? docs : fertig, { marken: druckerei, beschnitt: druckerei, titel, melde: t => { stand.textContent = t; } });
            T.speichereDatei(r.bytes, dn);
            stand.textContent = `Gespeichert: ${dn} (${n0} ${n0 === 1 ? 'Seite' : 'Seiten'}, ${Math.round(r.bytes.length / 1024)} KB).` + (r.fehlend.length ? ' Diese Zeichen fehlen in der Schrift und sind weggelassen: ' + r.fehlend.join(' ') : '');
            A.letztesPdf = { name: dn, seiten: n0, kb: Math.round(r.bytes.length / 1024), fehlend: r.fehlend };
          } catch (err) {
            const m = klar(err, 'PDF · Das PDF ist nicht entstanden. Noch einmal versuchen; die Prüfung zeigt, ob das PDF-Werkzeug lädt.');
            stand.textContent = m;
            quittung({ titel: 'PDF nicht gespeichert', satz: m, fehler: true, stichwort: stichwort(m) });
          } finally { knopf.disabled = false; }
        };
      } });
  }

  /* ---------- Rundgang (R18): Lichtkegel auf ein echtes Stück, erklärt was und wozu ---------- */
  const RUNDGANG = [
    ['.ti-liste .ti-ab', 'Deine Abende', 'Jeder Abend ab der Zusage steht hier mit dem Stand seiner Drucksachen: was druckfertig ist und was noch fehlt.'],
    ['#rand [data-ti-abend]', 'Die Mappe eines Abends', 'Begrüssung, Menükarte, Weinfolge, Tischkarten, Tischplan, Memory und deine Karte: alles aus Gängen, Weinen und Gästen des Abendplans.'],
    ['#rand a[href="#gestaltungen"]', 'Gestaltungen', 'Zwölf Stile in deinen Farben, vom Gänseessen im Advent bis Silvester. Ein Stil gilt für den ganzen Tisch.'],
    ['#speichern', 'Nichts geht verloren', 'Was du änderst, wartet gelb, bis du speicherst. Jede gespeicherte Fassung lässt sich zurückholen.'],
    ['.wo-kopf .wo-kn--rund[title="Prüfung"]', 'Wenn etwas hakt', 'Die Prüfung zeigt, woran es liegt und was zu tun ist.']
  ];
  function rundgang(start) {
    if (!start && (LS.get('angelina-tisch-rundgang') || /[?&](still|ohne-rundgang)\b/.test(location.search) || window.top !== window || navigator.webdriver)) return;
    LS.set('angelina-tisch-rundgang', '1');
    let i = 0;
    const box = document.createElement('div'); box.className = 'ti-rg'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Rundgang');
    document.body.appendChild(box);
    const zu = () => { box.remove(); document.removeEventListener('keydown', taste, true); window.removeEventListener('resize', zeig); };
    const taste = e => { if (e.key === 'Escape') { e.stopPropagation(); zu(); } else if (e.key === 'ArrowRight') { i < RUNDGANG.length - 1 ? (i++, zeig()) : zu(); } else if (e.key === 'ArrowLeft' && i) { i--; zeig(); } };
    function zeig() {
      const [sel, t, satz] = RUNDGANG[i], ziel = $$(sel).find(x => x.getClientRects().length && getComputedStyle(x).visibility !== 'hidden');
      let r = ziel ? ziel.getBoundingClientRect() : null;
      if (r && (r.bottom > innerHeight - 120 || r.top < 80)) { ziel.scrollIntoView({ block: 'center' }); r = ziel.getBoundingClientRect(); }
      const p = 8, kegel = r ? `left:${r.left - p}px;top:${r.top - p}px;width:${r.width + 2 * p}px;height:${r.height + 2 * p}px` : 'left:50%;top:40%;width:0;height:0';
      box.innerHTML = `<div class="ti-rg__kegel" style="${kegel}"></div><div class="ti-rg__karte"><span class="wo-mk">Rundgang · ${i + 1} von ${RUNDGANG.length}</span><b>${esc(t)}</b><p>${esc(satz)}</p><div class="ti-rg__kn"><button type="button" class="ti-rg__weg" data-rg="weg">Überspringen</button>${i ? `<button type="button" class="ti-rk ti-rk--hell" data-rg="zurueck" aria-label="Zurück">${WO.ic('links')}</button>` : ''}${WO.knopf(i < RUNDGANG.length - 1 ? 'Weiter' : 'Fertig', i < RUNDGANG.length - 1 ? 'rechts' : 'haken', 'gold', { klein: true, attr: 'data-rg="weiter"' })}</div></div>`;
    }
    box.addEventListener('click', e => { const b = e.target.closest('[data-rg]'); if (!b) return; if (b.dataset.rg === 'weg') zu(); else if (b.dataset.rg === 'zurueck') { i--; zeig(); } else if (i < RUNDGANG.length - 1) { i++; zeig(); } else zu(); });
    document.addEventListener('keydown', taste, true); window.addEventListener('resize', zeig);
    zeig();
  }

  /* ---------- Sitzordnung: Ziehen der Gäste auf Plätze ---------- */
  function belegungJetzt(id) {
    const a = abend(id), K = T.kontext(a, z(id), 'tischplan', 'a4h'), SZ = T.sitz(K);
    const bel = {}; Object.keys(SZ.bel).forEach(i => { bel[i] = SZ.bel[i]; });
    return { SZ, bel };
  }
  function setzeGast(name, platz) {
    const id = A.sicht.id, { SZ, bel } = belegungJetzt(id);
    const alt = Object.keys(bel).find(i => bel[i] === name);
    if (platz == null) { if (alt != null) delete bel[alt]; }
    else {
      const dort = bel[platz];
      if (alt != null) { if (dort) bel[alt] = dort; else delete bel[alt]; }
      bel[platz] = name;
    }
    aendere(id, zz => { zz.sitz = Object.assign({ form: SZ.form, plaetze: SZ.n, kopf: SZ.kopf }, zz.sitz || {}, { belegung: bel }); }, { sitz: true });
  }
  function tauschePlaetze(p1, p2) {
    const id = A.sicht.id, { SZ, bel } = belegungJetzt(id);
    const a = bel[p1], b = bel[p2];
    if (b) bel[p1] = b; else delete bel[p1];
    if (a) bel[p2] = a; else delete bel[p2];
    aendere(id, zz => { zz.sitz = Object.assign({ form: SZ.form, plaetze: SZ.n, kopf: SZ.kopf }, zz.sitz || {}, { belegung: bel }); }, { sitz: true });
  }
  let zug = null;
  document.addEventListener('pointerdown', e => {
    if (A.sicht.art !== 'stueck' || e.button) return;
    const chip = e.target.closest('[data-gast]'), sitz = !chip && e.target.closest('.ti-halter [data-platz], .ti-miniplan [data-platz]');
    if (!chip && !sitz) return;
    if (sitz && !(T.STUECKE[A.sicht.k].sitz || T.STUECKE[A.sicht.k].jeGast)) return;
    const quelle = chip ? { gast: chip.dataset.gast } : { platz: +sitz.dataset.platz };
    if (sitz) { const { bel } = belegungJetzt(A.sicht.id); if (!bel[quelle.platz]) return; quelle.gast = bel[quelle.platz]; }
    zug = { quelle, x: e.clientX, y: e.clientY, los: false, id: e.pointerId };
  });
  document.addEventListener('pointermove', e => {
    if (!zug || e.pointerId !== zug.id) return;
    if (!zug.los) {
      if (Math.hypot(e.clientX - zug.x, e.clientY - zug.y) < 5) return;
      zug.los = true;
      zug.geist = document.createElement('div'); zug.geist.className = 'ti-geist'; zug.geist.textContent = zug.quelle.gast;
      document.body.appendChild(zug.geist); document.documentElement.classList.add('ti-zieht');
      $$('.ti-halter [data-platz], .ti-miniplan [data-platz]').forEach(x => x.classList.add('ti-ziel'));
    }
    e.preventDefault();
    zug.geist.style.transform = `translate(${e.clientX + 12}px,${e.clientY + 10}px)`;
    const unter = document.elementsFromPoint(e.clientX, e.clientY);
    const ziel = unter.find(x => x.dataset && x.dataset.platz != null && x.closest('.ti-halter, .ti-miniplan')) || (e.pointerType !== 'mouse' && naechsterPlatz(e.clientX, e.clientY)) || unter.find(x => x.matches && x.matches('[data-gaesteliste]'));
    $$('.ti-ziel--ueber').forEach(x => x.classList.remove('ti-ziel--ueber'));
    if (ziel) { const p = ziel.dataset.platz; if (p != null) $$(`[data-platz="${p}"]`, ziel.closest('.ti-halter, .ti-miniplan')).forEach(x => x.classList.add('ti-ziel--ueber')); else ziel.classList.add('ti-ziel--ueber'); }
    zug.ziel = ziel;
  }, { passive: false });
  function zugEnde(e) {
    if (!zug || (e && e.pointerId !== zug.id)) return;
    const z0 = zug; zug = null;
    document.documentElement.classList.remove('ti-zieht');
    if (z0.geist) z0.geist.remove();
    $$('.ti-ziel, .ti-ziel--ueber').forEach(x => x.classList.remove('ti-ziel', 'ti-ziel--ueber'));
    if (!z0.los || !e || e.type === 'pointercancel' || (e.buttons !== undefined && e.type !== 'pointerup')) return;
    z0.ende = true; zugGerade = Date.now();
    const ziel = z0.ziel;
    if (!ziel) return;
    if (ziel.dataset.platz != null) { const p = +ziel.dataset.platz; if (z0.quelle.platz != null) tauschePlaetze(z0.quelle.platz, p); else setzeGast(z0.quelle.gast, p); }
    else if (ziel.matches('[data-gaesteliste]')) setzeGast(z0.quelle.gast, null);
  }
  let zugGerade = 0;
  document.addEventListener('pointerup', zugEnde);
  document.addEventListener('pointercancel', zugEnde);

  /* Antippen am Handy: Ein Platz ist im ganzen Blatt nur wenige Pixel gross, und der Browser lenkt den Tipp auf ein Feld daneben
     (Monogramm, Name). Darum setzt ein Tipp den gewählten Gast selbst auf den Platz, der dem Finger am nächsten liegt. */
  function naechsterPlatz(x, y) {
    const flaeche = document.elementsFromPoint(x, y).map(el => el.closest && el.closest('.ti-halter, .ti-miniplan')).find(Boolean);
    if (!flaeche) return null;
    let best = null, weit = 28;
    $$('[data-platz]', flaeche).forEach(el => {
      const r = el.getBoundingClientRect(), dx = Math.max(r.left - x, 0, x - r.right), dy = Math.max(r.top - y, 0, y - r.bottom), d = Math.hypot(dx, dy);
      if (d < weit) { weit = d; best = el; }
    });
    return best;
  }
  let tipp = null, tippGerade = 0;
  document.addEventListener('pointerdown', e => {
    tipp = e.pointerType !== 'mouse' && e.isPrimary && A.wahlGast && A.sicht.art === 'stueck' ? { x: e.clientX, y: e.clientY, id: e.pointerId } : null;
  }, true);
  document.addEventListener('pointerup', e => {
    const t0 = tipp; tipp = null;
    if (!t0 || e.pointerId !== t0.id || !A.wahlGast || Math.hypot(e.clientX - t0.x, e.clientY - t0.y) > 10) return;
    const el = naechsterPlatz(t0.x, t0.y); if (!el) return;
    tippGerade = Date.now();
    const g = A.wahlGast; A.wahlGast = null; setzeGast(g, +el.dataset.platz);
  }, true);

  /* ---------- Schreiben direkt im Blatt (Doppelklick, wie im Vorbild) ---------- */
  function setzeText(key, wert) {
    const { id, k } = A.sicht;
    const doc = docAktuell(), f = felderAus(doc).find(x => x.key === key);
    const std = key.startsWith('gast:') ? key.slice(5) : f ? f.std : undefined;
    aendere(id, zz => {
      const s = (zz.stuecke = zz.stuecke || {}); s[k] = s[k] || {}; const t = (s[k].texte = s[k].texte || {});
      if (std != null && wert === std) delete t[key]; else t[key] = wert;
    }, { stueck: k, ohneRand: true });
  }
  document.addEventListener('dblclick', e => {
    const el = e.target.closest('.ti-halter .el-text.el-key'); if (!el || A.sicht.art !== 'stueck') return;
    e.preventDefault();
    const key = el.dataset.key, vorher = el.textContent;
    try { el.contentEditable = 'plaintext-only'; } catch (x) { el.contentEditable = 'true'; }
    if (el.contentEditable !== 'plaintext-only') el.contentEditable = 'true';
    el.classList.add('ti-schreibt');
    el.focus();
    const r = document.createRange(); r.selectNodeContents(el); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);   // ganzer Wortlaut gewählt (Fehlerbuch 10a)
    const fertig = ok => {
      el.removeEventListener('blur', weg); el.removeEventListener('keydown', taste);
      el.contentEditable = 'false'; el.classList.remove('ti-schreibt');
      const neu = el.textContent.replace(/ /g, ' ').replace(/\s+$/g, '');
      if (ok && neu !== vorher) setzeText(key, neu); else zeichne(true);
    };
    const weg = () => fertig(true);
    const taste = ev => { if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); el.textContent = vorher; fertig(false); } else if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); el.blur(); } };
    el.addEventListener('blur', weg); el.addEventListener('keydown', taste);
  });

  /* ---------- Klicks ---------- */
  let feldZeit = 0;
  document.addEventListener('input', e => {
    if (e.target.matches('[data-suche]')) { A.suche = e.target.value; suchen(); return; }
    const f = e.target.closest('[data-feld]');
    if (f) { clearTimeout(feldZeit); const key = f.dataset.feld, v = f.value; feldZeit = setTimeout(() => setzeText(key, v), 220); return; }
    if (e.target.matches('[data-monogramm]')) { const v = e.target.value; clearTimeout(feldZeit); feldZeit = setTimeout(() => { const id = A.sicht.id; aendere(id, zz => { if (v.trim() && v.trim() !== T.monogramm(abend(id).gastgeber.name)) zz.monogramm = v.trim(); else delete zz.monogramm; }); if (A.gestFenster && !$('#fenster').hidden) A.gestFenster(); }, 300); }
  });
  document.addEventListener('change', e => {
    const t = e.target, id = A.sicht.id;
    if (t.matches('[data-tun="schnitt"]')) { A.schnitt = t.checked; zeichne(true); }
    else if (t.matches('[data-wortmarke]')) { aendere(id, zz => { if (t.checked) delete zz.wortmarke; else zz.wortmarke = false; }); if (A.gestFenster && !$('#fenster').hidden) A.gestFenster(); }
    else if (t.matches('[data-wein-menue]')) aendere(id, zz => { const s = (zz.stuecke = zz.stuecke || {}); s.menue = s.menue || {}; if (t.checked) s.menue.weinImMenue = true; else delete s.menue.weinImMenue; }, { stueck: 'menue' });
    else if (t.matches('[data-kopfenden]')) aendere(id, zz => { const SZ = belegungJetzt(id); zz.sitz = Object.assign({ form: SZ.SZ.form, plaetze: SZ.SZ.n, belegung: SZ.bel }, zz.sitz || {}, { kopf: t.checked }); }, { sitz: true });
  });

  document.addEventListener('click', e => {
    if (Date.now() - zugGerade < 300 && e.target.closest('[data-gast], [data-platz]')) return;
    if (tippGerade && Date.now() - tippGerade < 350) { tippGerade = 0; e.preventDefault(); return; }   // der Tipp hat den Gast schon gesetzt; der umgelenkte «click» desselben Tipps zählt nicht (nur dieser eine)
    const t = e.target.closest('[data-tun],[data-reiter],[data-stil],[data-akzent],[data-kopf],[data-format],[data-groesse],[data-form],[data-plaetze],[data-gast],[data-platz],[data-hoch],[data-runter],[data-blockaus],[data-blockein],[data-std],[data-ausblenden],[data-fassung],[data-stilwahl],[data-artwahl],[data-motiv-gast],[data-motiv],[data-pruef-key]');
    if (!t) {
      const el = e.target.closest('.ti-halter .el-key');
      if (el && A.sicht.art === 'stueck') {
        A.sel = el.dataset.key;
        $$('#ti-halter .ti-sel').forEach(x => x.classList.remove('ti-sel'));
        $$(`#ti-halter [data-key="${CSS.escape(A.sel)}"]`).forEach(x => x.classList.add('ti-sel'));
        if (A.tab !== 'inhalt') { A.tab = 'inhalt'; $$('.ti-reiter button').forEach(b => b.setAttribute('aria-pressed', b.dataset.reiter === 'inhalt')); $('#ti-panel').innerHTML = panel(abend(A.sicht.id), A.sicht.k, docAktuell()); }
        $$('.ti-feld--sel').forEach(x => x.classList.remove('ti-feld--sel'));
        const f = $(`[data-feldkey="${CSS.escape(A.sel)}"]`); if (f) { f.classList.add('ti-feld--sel'); if (!matchMedia('(max-width:900px)').matches) f.scrollIntoView({ block: 'nearest' }); }   // am Handy steht das Feld unter dem Blatt: nicht wegrollen, sonst trifft der Doppelklick daneben
      }
      return;
    }
    const id = A.sicht.id, k = A.sicht.k, d = t.dataset;
    if (d.tun) {
      if (t.matches('input')) return;   // Schalter: «change» übernimmt
      e.preventDefault();
      const tun = d.tun;
      if (tun === 'speichern') speichern();
      else if (tun === 'rueck') rueck(A.undo, A.redo);
      else if (tun === 'vor') rueck(A.redo, A.undo);
      else if (tun === 'vorher') vorherNachher();
      else if (tun === 'fertig') fertigSetzen(true);
      else if (tun === 'fertig-weg') fertigSetzen(false);
      else if (tun === 'gestaltung') gestaltungFenster(abend(id));
      else if (tun === 'mappe') { const a = abend(id); const docs = T.STUECK_REIHE.map(x => T.setzeDruck(a, z(id), x)); druckFenster(docs, 'Mappe · ' + a.gastgeber.name, ('Mappe ' + a.gastgeber.name + ' ' + a.anfrage.datum).replace(/[^\wÄÖÜäöüß -]/g, '') + '.pdf'); }
      else if (tun === 'druck') { const doc = T.setzeDruck(abend(id), z(id), k); druckFenster([doc], doc.name, T.dateiname(doc)); }
      else if (tun === 'pruefung') pruefFenster();
      else if (tun === 'seite-' || tun === 'seite+') { const n = docAktuell().seiten.length; A.seite = (A.seite + (tun === 'seite+' ? 1 : -1) + n) % n; zeichne(true); }
      else if (tun === 'zoom-' || tun === 'zoom+') { A.zoom = Math.max(.2, Math.min(4, (A.zoom || A.k || 1) * (tun === 'zoom+' ? 1.2 : 1 / 1.2))); zeichne(true); }
      else if (tun === 'zoom0') { A.zoom = 0; zeichne(true); }
      else if (tun === 'reihe' || tun === 'abwechselnd' || tun === 'leeren') {
        const { SZ } = belegungJetzt(id), K = T.kontext(abend(id), z(id), 'tischplan', 'a4h');
        let namen = K.plan.gaeste.map(g => g.name);
        if (tun === 'abwechselnd') { const gg = K.plan.gaeste.filter(g => g.gastgeber || K.gastgeber.split(/\s+(?:und|&)\s+|\s+/).includes(g.name.split(' ')[0])).map(g => g.name).slice(0, 2), rest = namen.filter(n => !gg.includes(n)), r = []; const mitte = Math.floor(SZ.n / 2); namen = rest.slice(); if (gg[0]) namen.splice(0, 0, gg[0]); if (gg[1]) namen.splice(Math.min(mitte, namen.length), 0, gg[1]); void r; }
        const bel = {}; if (tun !== 'leeren') namen.slice(0, SZ.n).forEach((n, i) => { bel[i] = n; });
        aendere(id, zz => { zz.sitz = Object.assign({ form: SZ.form, plaetze: SZ.n, kopf: SZ.kopf }, zz.sitz || {}, { belegung: bel }); }, { sitz: true });
      }
      return;
    }
    if (d.reiter) { A.tab = d.reiter; zeichne(true); if (innerWidth <= 900) { const r = $('.ti-reiter'); if (r && r.getBoundingClientRect().top < 0) r.scrollIntoView({ block: 'start' }); } return; }
    if (d.stilwahl) { stilFenster(d.stilwahl); return; }
    if (d.artwahl) { artFenster(d.artwahl); return; }
    if (d.stilFuer) { const ziel = d.stilFuer; aendere(ziel, zz => { zz.stil = d.stil; delete zz.akzent; }); fensterZu(); quittung({ titel: 'Gestaltung gewählt', satz: '«' + T.STILE[d.stil].name + '» für ' + abend(ziel).gastgeber.name + '. Speichern, um sie zu behalten.' }); return; }
    if (d.stil) { aendere(id, zz => { zz.stil = d.stil; delete zz.akzent; }); if (A.gestFenster && !$('#fenster').hidden) A.gestFenster(); return; }
    if (d.akzent) { aendere(id, zz => { zz.akzent = d.akzent; }); if (A.gestFenster && !$('#fenster').hidden) A.gestFenster(); return; }
    if (d.kopf) { aendere(id, zz => { zz.kopf = d.kopf; }); if (A.gestFenster && !$('#fenster').hidden) A.gestFenster(); return; }
    if (d.format) { A.seite = 0; aendere(id, zz => { zS(id, k).format = d.format; void zz; }, { stueck: k }); return; }
    if (d.groesse) { aendere(id, () => { const s = zS(id, k); s.groesse = s.groesse || {}; const v = Math.max(T.STUFEN.min, Math.min(T.STUFEN.max, (+s.groesse[d.groesse] || 0) + (+d.d))); if (v) s.groesse[d.groesse] = v; else delete s.groesse[d.groesse]; }, { stueck: k }); return; }
    if (d.form) { const { SZ, bel } = belegungJetzt(id); aendere(id, zz => { zz.sitz = Object.assign({ plaetze: SZ.n, kopf: SZ.kopf, belegung: bel }, zz.sitz || {}, { form: d.form }); }, { sitz: true }); return; }
    if (d.plaetze) { const { SZ, bel } = belegungJetzt(id); const n = Math.max(2, Math.min(T.MAX_PLAETZE, SZ.n + (+d.plaetze))); Object.keys(bel).forEach(i => { if (+i >= n) delete bel[i]; }); aendere(id, zz => { zz.sitz = Object.assign({ form: SZ.form, kopf: SZ.kopf }, zz.sitz || {}, { plaetze: n, belegung: bel }); }, { sitz: true }); return; }
    if (d.gast != null && !t.closest('.ti-motiv')) { A.wahlGast = A.wahlGast === d.gast ? null : d.gast; zeichne(true); return; }
    if (d.platz != null && t.closest('.ti-halter, .ti-miniplan')) {
      if (A.wahlGast) { const g = A.wahlGast; A.wahlGast = null; setzeGast(g, +d.platz); }
      else if (t.classList.contains('el-key')) { A.sel = t.dataset.key; zeichne(true); }
      return;
    }
    if (d.hoch != null || d.runter != null) {
      const i = +(d.hoch != null ? d.hoch : d.runter), liste = { menue: 'gaenge', weine: 'weine', begruessung: 'ablauf' }[k];
      const K = T.kontext(abend(id), z(id), k, 'a5h'), r = T.ordnung(K, liste, K.plan[liste].length), p = r.indexOf(i), q = p + (d.hoch != null ? -1 : 1);
      if (q < 0 || q >= r.length) return;
      [r[p], r[q]] = [r[q], r[p]];
      aendere(id, () => { zS(id, k).reihenfolge = r; }, { stueck: k });
      return;
    }
    if (d.blockaus) { aendere(id, () => { const s = zS(id, k); s.aus = s.aus || {}; s.aus[d.blockaus] = true; }, { stueck: k }); return; }
    if (d.blockein) { aendere(id, () => { const s = zS(id, k); if (s.aus) delete s.aus[d.blockein]; }, { stueck: k }); return; }
    if (d.std) { e.preventDefault(); aendere(id, () => { const s = zS(id, k); if (s.texte) delete s.texte[d.std]; }, { stueck: k }); return; }
    if (d.ausblenden) { e.preventDefault(); aendere(id, () => { const s = zS(id, k); s.texte = s.texte || {}; s.texte[d.ausblenden] = ''; }, { stueck: k }); return; }
    if (d.fassung) { fassungHolen(d.fassung); return; }
    if (d.motivGast) { motivFenster(d.motivGast); return; }
    if (d.motiv) { const g = A.motivFuer; aendere(id, zz => { zz.memory = zz.memory || {}; zz.memory.motive = Object.assign({}, zz.memory.motive); const alt = Object.keys(zz.memory.motive).find(n => zz.memory.motive[n] === d.motiv && n !== g); const meins = zz.memory.motive[g]; if (alt) { if (meins) zz.memory.motive[alt] = meins; else delete zz.memory.motive[alt]; } zz.memory.motive[g] = d.motiv; }, { stueck: 'memory' }); fensterZu(); return; }
    if (d.pruefKey) { fensterZu(); A.sel = d.pruefKey; A.tab = 'inhalt'; zeichne(true); const f = $(`[data-feldkey="${CSS.escape(A.sel)}"]`); if (f) f.scrollIntoView({ block: 'center' }); return; }
  });

  function motivFenster(gast) {
    A.motivFuer = gast;
    const K = T.kontext(abend(A.sicht.id), z(A.sicht.id), 'memory', 'memory'), i = T.gastReihe(K).findIndex(g => g.name === gast), jetzt = T.motivFuer(K, gast, Math.max(0, i));
    const belegt = {}; T.gastReihe(K).forEach((g, n) => { belegt[T.motivFuer(K, g.name, n)] = g.name; });
    fenster({ mk: 'Memory', titel: 'Motiv für ' + esc(K.gastName(gast)), inhalt: `<p class="ti-fe__satz">Das Motiv steht auf der Karte, die ${esc(K.gastName(gast))} beim Empfang bekommt, und auf dem Gegenstück am Platz. Ist es schon vergeben, tauschen die beiden.</p><div class="ti-motivwahl">${T.MOTIV_REIHE.map(m => `<button type="button" class="ti-motiv${m === jetzt ? ' ti-motiv--an' : ''}" data-motiv="${m}" aria-pressed="${m === jetzt}"><svg viewBox="0 0 48 48" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${T.MOTIVE[m].d.map(d => `<path d="${d}"/>`).join('')}</g></svg><span><b>${esc(T.MOTIVE[m].name)}</b><small>${belegt[m] && belegt[m] !== gast ? esc(K.gastName(belegt[m])) : '&nbsp;'}</small></span></button>`).join('')}</div>` });
  }

  function pruefFenster() {
    const doc = docAktuell(), pr = T.pruefe(doc);
    fenster({ mk: 'Druckprüfung', titel: esc(T.STUECKE[A.sicht.k].lang), inhalt: pr.length ? `<ul class="ti-befunde">${pr.map(p => `<li class="ti-befund ti-befund--${p.stufe}"><i></i><span>${esc(p.text)}</span>${p.key ? `<button type="button" class="ti-std" data-pruef-key="${esc(p.key)}">zeigen</button>` : ''}</li>`).join('')}</ul><p class="ti-klein">Rot: vor dem Druck klären. Gelb: ein Hinweis, der Druck geht trotzdem.</p>` : '<p class="ti-fe__satz">Ohne Befund: keine Platzhalter, alles im sicheren Abstand zum Rand, jede Schrift gross genug, alle Plätze vergeben.</p>' });
  }

  /* ---------- Wege (R15) ---------- */
  function ausHash() {
    const h = decodeURIComponent(location.hash.slice(1));
    let m;
    if ((m = /^abend=([\w-]+)$/.exec(h)) && abend(m[1])) return { art: 'abend', id: m[1] };
    if ((m = /^stueck=([\w-]+)\/(\w+)$/.exec(h)) && abend(m[1]) && T.STUECKE[m[2]]) return { art: 'stueck', id: m[1], k: m[2] };
    if (h === 'gestaltungen' || h === 'drucksachen') return { art: h };
    if (h === 'start') return { art: 'start' };
    return null;
  }
  function gehe() {
    const s = ausHash() || { art: 'start' };
    const neu = JSON.stringify(s) !== JSON.stringify(A.sicht);
    if (neu) { A.sel = null; A.wahlGast = null; if (!(s.art === 'stueck' && A.sicht.art === 'stueck' && s.id === A.sicht.id)) { A.seite = 0; A.zoom = 0; } if (s.art === 'stueck' && (A.sicht.art !== 'stueck' || A.sicht.k !== s.k)) A.tab = T.STUECKE[s.k].sitz || T.STUECKE[s.k].jeGast ? 'plaetze' : 'inhalt'; }
    A.sicht = s;
    LS.set('angelina-tisch-ansicht', location.hash || '#start');
    fensterZu();
    zeichne();
    if (neu) window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', gehe);

  /* ---------- Tasten (R09): ⌘S speichert, Escape schliesst, ⌘Z / ⇧⌘Z im Entwurf ---------- */
  document.addEventListener('keydown', e => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'k' && $('[data-suche]')) { e.preventDefault(); const f = $('[data-suche]'); f.focus(); f.select(); return; }
    if (e.key === 'Escape' && e.target.matches && e.target.matches('[data-suche]') && e.target.value) { e.target.value = ''; A.suche = ''; suchen(); return; }
    if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); clearTimeout(feldZeit); const f = document.activeElement; if (f && f.dataset && f.dataset.feld) setzeText(f.dataset.feld, f.value); speichern(); return; }
    if (e.key === 'Escape' && !$('#fenster').hidden) { fensterZu(); return; }
    if (e.key === 'Escape' && A.wahlGast) { A.wahlGast = null; zeichne(true); return; }
    const schreibt = e.target.closest && e.target.closest('input, textarea, [contenteditable="true"], [contenteditable="plaintext-only"]');
    if (mod && e.key.toLowerCase() === 'z' && !schreibt) { e.preventDefault(); if (e.shiftKey) rueck(A.redo, A.undo); else rueck(A.undo, A.redo); }
  });

  /* R13: Verlassen mit ungespeicherten Eingaben */
  window.addEventListener('beforeunload', e => { if (offen().length) { e.preventDefault(); e.returnValue = ''; } });
  let groesse = 0;
  window.addEventListener('resize', () => { clearTimeout(groesse); groesse = setTimeout(() => { if (A.sicht.art === 'stueck') { const doc = docAktuell(); buehne(doc); if ($('#ti-miniplan')) miniplan(abend(A.sicht.id)); } }, 120); });
  document.addEventListener('pointerover', e => { if (e.target.closest && e.target.closest('[data-tun="druck"],[data-tun="mappe"]')) T.vorladenPdf(); });

  /* ---------- Start (R02 Auftakt, R04 Startfehler-Tür) ---------- */
  async function start() {
    const lade = setTimeout(() => document.documentElement.classList.add('ti-laedt'), 280);
    try {
      await laden();
      if (!location.hash) { const l = LS.get('angelina-tisch-ansicht'); if (l && l !== '#') history.replaceState(null, '', l); }
      A.sicht = ausHash() || { art: 'start' };
      if (A.sicht.art === 'stueck') A.tab = T.STUECKE[A.sicht.k].sitz || T.STUECKE[A.sicht.k].jeGast ? 'plaetze' : 'inhalt';
      await Promise.race([Promise.all(Object.values(T.SCHRIFT).map(x => document.fonts.load(`10px '${x.fam}'`).catch(() => {}))).then(() => document.fonts.ready), new Promise(r => setTimeout(r, 2500))]);   // Druckschriften vor dem ersten Messen
      zeichne();
      const bilder = $$('#ansicht img').filter(i => { const r = i.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; });
      bilder.forEach(i => { i.loading = 'eager'; i.decoding = 'sync'; });
      await Promise.race([Promise.all(bilder.map(i => i.complete ? 0 : new Promise(r => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); }))), new Promise(r => setTimeout(r, 2500))]);
      clearTimeout(lade);
      document.documentElement.classList.remove('ti-wartet', 'ti-laedt');
      window.__tiBereit = true;
      if (/[?&]rundgang\b/.test(location.search)) rundgang(true); else setTimeout(() => rundgang(false), 900);
    } catch (e) {
      clearTimeout(lade);
      tuer(e);
    }
  }
  function tuer(e) {
    document.documentElement.classList.remove('ti-wartet', 'ti-laedt');
    const t = $('#tuer'); if (!t) return;
    const m = String((e && e.message) || e || ''), sw = /^[A-ZÄÖÜ]+ ·/.test(m) ? stichwort(m) : 'START';
    $('.ti-tuer__grund', t).textContent = /^[A-ZÄÖÜ]+ ·/.test(m) ? m : 'START · Etwas hat beim Öffnen nicht geklappt. Die Prüfung zeigt, woran es liegt.';
    $('a', t).href = 'pruefung.html#' + sw;
    if (!/^[A-ZÄÖÜ]+ ·/.test(m)) console.error(e);
    t.hidden = false;
  }
  window.__tiTuer = tuer;
  setTimeout(() => { if (!window.__tiBereit) tuer(new Error('START · Nach 12 Sekunden ist das Werkzeug noch nicht bereit. Läuft der Server?')); }, 12000);
  T.rundgang = rundgang; T.speichern = speichern; T.zeichne = zeichne;
  start();
})();

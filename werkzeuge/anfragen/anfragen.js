/* Anfragen & Angebote · Angelina Strelow, Exklusive Gastgeberin (05.11.2026). Kopie aus dem Gästebuch des Culinarium (reception.js, nur gelesen, _bau/vorlage-reception.js),
   umgebaut auf ihren Fall: jede Anfrage an einem Ort (Website, Instagram, Empfehlung, Kennenlernen bei einem Kaffee), Antwort aus ihren Textbausteinen,
   Angebot aus ihrer Preisliste als A4-Blatt in ihrer Marke (blatt.js), Zusage schickt den Abend in den Abendplan.
   Daten: gemeinsamer Server (serve.py): Teil «kern» (Status, Gastgeber, Anfrage) und Teil «angebot» (Vorgespräch, Antworten, Fassungen, Zusage, Absage, Verlauf);
   Sammlungen «anfragen-preise», «anfragen-vorlagen», «anfragen-einstellungen» (Startwerte aus _daten/beispiel/anfragen-*.json, als Beispiel gekennzeichnet, bis Angelina speichert).
   Hier wird nichts verschickt: kein Mailprogramm, kein mailto/tel, kein Versand. Speichern nur mit etag (409 KONFLIKT, dann neu laden). */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PF = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5"/></svg>';
// Schliessen ohne «×» (Robert 30.10.2026: kein X auf der Seite): der Zurück-Pfeil wie im Vorbild
const ZU = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 9.67 2.67 6.33 6 3M2.67 6.33h7.33a3.33 3.33 0 0 1 0 6.67h-2"/></svg>';
const ZEICHEN = '<img src="/angelina-strelow/werkzeuge/assets/zeichen/siegel-berry.svg" width="691" height="956" alt="">';
const MARKE = '<img class="brief__marke" src="/angelina-strelow/werkzeuge/assets/zeichen/wortmarke-night.svg" width="3044" height="660" alt="Angelina Strelow">';
const SYM = {
  korb: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5"/></svg>',
  kopie: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="8.5" height="8.5" rx="1.5"/><path d="M11 5V3.5A1 1 0 0 0 10 2.5H3.5a1 1 0 0 0-1 1V10a1 1 0 0 0 1 1H5"/></svg>',
  post: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3.5" width="12" height="9" rx="1.5"/><path d="m2.5 4.5 5.5 4 5.5-4"/></svg>',
  haken: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7"/></svg>',
  stift: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 3.5l2 2L6 12H4v-2z"/></svg>',
  pdf: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 1.8h5l3 3v9.4H4z"/><path d="M9 1.8v3h3M6 8.5h4M6 11h4"/></svg>',
  links: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5"/></svg>',
  rechts: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5"/></svg>' };
const TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MON = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

/* Stationen eines Abends (CLAUDE.md: anfrage → angebot → zugesagt → geplant → vorbei → abgeschlossen, oder abgesagt). Im Eingang zusammengefasst. */
const STATION = { neu: ['anfrage'], angebot: ['angebot'], zugesagt: ['zugesagt', 'geplant'], vorbei: ['vorbei', 'abgeschlossen'], abgesagt: ['abgesagt'] };
const ST_NAME = { neu: 'Neu', angebot: 'Angebot raus', zugesagt: 'Zugesagt', vorbei: 'Vorbei', abgesagt: 'Abgesagt' };
/* Offene Stellen in einer Antwort: [eckige] oder {geschweifte} Klammern, die nichts gefüllt hat (Prüfung 2, N3) */
const OFFEN_STELLE = /\[[^\]\n]+\]|\{[^{}\n]+\}/, OFFEN_STELLE_ALLE = /\[[^\]\n]+\]|\{[^{}\n]+\}/g;
const ST_LANG = { neu: 'Neue Anfragen', angebot: 'Angebot raus', zugesagt: 'Zugesagt', vorbei: 'Vorbei', abgesagt: 'Abgesagt' };
const ST_SATZ = { neu: 'Warten auf deine Antwort', angebot: 'Warten auf den Gastgeber', zugesagt: 'Stehen im Abendplan', vorbei: 'Begleitet', abgesagt: 'Nicht zustande gekommen' };
const STATUS_NAME = { anfrage: 'Neu', angebot: 'Angebot raus', zugesagt: 'Zugesagt', geplant: 'Geplant', vorbei: 'Vorbei', abgeschlossen: 'Abgeschlossen', abgesagt: 'Abgesagt' };
const station = a => Object.keys(STATION).find(k => STATION[k].includes(a.status)) || 'neu';
const BELEGT = ['zugesagt', 'geplant', 'vorbei', 'abgeschlossen'];
const QUELLE = { website: 'Website', instagram: 'Instagram', empfehlung: 'Empfehlung', kaffee: 'Kennenlernen bei einem Kaffee', telefon: 'Telefon', mail: 'E-Mail' };
const QUELLE_KURZ = { kaffee: 'Kaffee' };
const ANLAESSE = ['Privates Dinner', 'Geburtstag', 'Jubiläum', 'Feier zu Hause'];
const GAESTE = ['bis 6', 'bis 10', 'bis 16', 'mehr'];
/* Fotos: nur Angelinas eigene (_haus/bild, aus website/bilder). Je Anlass mehrere, je Abend fest eines (aus der Kennung), nie zweimal untereinander (Fehlerbuch 10a). */
const ANLASSBILDER = { 'Privates Dinner': ['festtafel', 'tafel', 'teller', 'p150'], Geburtstag: ['p140', 'p136', 'kerze', 'glas'], 'Jubiläum': ['empfang', 'einschenken', 'p132', 'p156'],
  'Feier zu Hause': ['p155', 'tisch', 'p151', 'kerzen'], sonst: ['gang', 'hintergrund', 'p158'] };
const ST_BILD = { neu: 'studio-fenster', angebot: 'p152', zugesagt: 'handschuh', vorbei: 'p156', abgesagt: 'p89' };
const SB_FOTO = { eingang: 'kerze', termine: 'tafel', bausteine: 'hintergrund', preise: 'flasche', einstellungen: 'p69' };
const hashZahl = s => { let h = 0; for (const c of String(s || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
const bildVon = (a, nicht) => { const l = ANLASSBILDER[(a.anfrage || {}).anlass] || ANLASSBILDER.sonst; let n = hashZahl(a.id) % l.length; if (l[n] === nicht) n = (n + 1) % l.length; return l[n]; };
const IMG = (n, kl, gross) => `<span class="${kl}" aria-hidden="true"><img src="/angelina-strelow/werkzeuge/assets/bild/${n}-${gross ? 1000 : 640}.webp" alt="" width="640" height="480" decoding="async"></span>`;

const S0 = (() => { try { return sessionStorage.getItem('an-station') || 'alle'; } catch (e) { return 'alle'; } })();
const S = { ansicht: 'start', wahl: '', station: S0, such: '', anlass: '', monat: '', reiter: 'antwort', abende: null, etag: {}, sEtag: {},
  preise: null, vorlagen: null, einst: null, eigen: {}, START: null, HAUS: {}, offen: new Set(), antw: {}, form: {}, antwBasis: {}, antwServer: {}, formBasis: {}, einstForm: null, einstBasis: null, tbMonat: '', bstGruppe: 'alle' };
const TITEL = { start: 'Übersicht', eingang: 'Eingang', termine: 'Terminblick', bausteine: 'Textbausteine', preise: 'Preisliste', einstellungen: 'Einstellungen' };
const WEGE = { anleitung: 'anleitung.html', pruefung: 'pruefung.html', website: '/angelina-strelow/website/index.html' };
const WER = 'Angelina';

/* ---------- Zeit und Zahlen ---------- */
const heute = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const isoTag = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const ausIso = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
const tagLang = iso => { const d = ausIso(iso); return d ? TAGE[d.getDay()] + ', ' + d.getDate() + '. ' + MON[d.getMonth()] + ' ' + d.getFullYear() : ''; };
const tagKurz = iso => { const d = ausIso(iso); return d ? d.getDate() + '. ' + MON[d.getMonth()] : ''; };
const tagListe = iso => { const d = ausIso(iso); return d ? TAGE[d.getDay()].slice(0, 2) + ', ' + d.getDate() + '. ' + MON[d.getMonth()].slice(0, 3) + (d.getMonth() === 4 ? '' : '.') + ' ' + d.getFullYear() : 'ohne Datum'; };
const zeit = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ', ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr'; };
const tageSeit = iso => { const d = new Date(iso); if (isNaN(d)) return 0; d.setHours(0, 0, 0, 0); return Math.round((heute() - d) / 864e5); };
const tageBis = iso => { const d = ausIso(iso); return d ? Math.round((d - heute()) / 864e5) : 9999; };
const jetztIso = () => { const d = new Date(); return isoTag(d) + 'T' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };
const mal = (n, eins, viele) => n === 1 ? eins : n + ' ' + viele;
const zahlKachel = (n, eins, viele) => `<div><b>${n}</b><span>${n === 1 ? eins : viele}</span></div>`;   // Zahl und Wort passen immer zusammen (Prüfung 2, N5)
const geld = x => window.ANGEBOT_GELD(x);
const klon = x => JSON.parse(JSON.stringify(x == null ? null : x));
const leer = o => !o || (typeof o === 'object' && !Object.keys(o).length);
const vorname = n => { n = String(n || '').trim(); if (/^Familie\b/.test(n)) return n; if (/ und /.test(n)) { const [a, b] = n.split(' und '); return a.split(/\s+/)[0] + ' und ' + b.split(/\s+/)[0]; } return n.split(/\s+/)[0] || n; };
const kurzname = n => { n = String(n || '').trim(); if (/^Familie\b/.test(n)) return n; const w = n.split(/\s+/); return / und /.test(n) && w.length <= 3 ? n : w.length > 1 ? w[w.length - 1] : n; };
const gaesteText = (g, mehr) => { const m = /^bis (\d+)/.exec(g || ''); return m ? 'bis zu ' + m[1] + ' Gästen' : g === 'mehr' ? 'mehr als 16 Gästen' : /^\d+$/.test(g || '') ? g + ' Gästen' : mehr ? 'euren Gästen' : 'deinen Gästen'; };
const gaesteKurz = g => { const m = /^bis (\d+)/.exec(g || ''); return m ? 'bis ' + m[1] + ' Gäste' : g === 'mehr' ? 'mehr als 16 Gäste' : /^\d+$/.test(g || '') ? g + ' Gäste' : ''; };
const EIN = { 'Privates Dinner': 'Ein privates Dinner', Geburtstag: 'Ein Geburtstag', 'Jubiläum': 'Ein Jubiläum', 'Feier zu Hause': 'Eine Feier zu Hause' };
const DEN_IHR = { 'Privates Dinner': 'euer privates Dinner', Geburtstag: 'euren Geburtstag', 'Jubiläum': 'euer Jubiläum', 'Feier zu Hause': 'eure Feier zu Hause' };
/* Zwei Gastgeber (Paar, «Familie …»): Bausteine, Preisnamen und das Blatt sprechen sie mit «ihr» an (Prüfung 2, N5) */
const mehrere = a => { const n = String(((a || {}).gastgeber || {}).name || '').trim(); return /^Familie\b/.test(n) || /\s(und|&)\s/.test(n); };
const duIhr = (t, mehr) => String(t == null ? '' : t).replace(/\{([^{}|\n]*)\|([^{}|\n]*)\}/g, (m, eins, zwei) => mehr ? zwei : eins);
const DEN = { 'Privates Dinner': 'dein privates Dinner', Geburtstag: 'deinen Geburtstag', 'Jubiläum': 'euer Jubiläum', 'Feier zu Hause': 'deine Feier zu Hause' };
const insta = () => { const m = /instagram\.com\/([^/?#]+)/.exec(S.HAUS.instagram || ''); return m ? '@' + m[1] : ''; };

/* ---------- Server ---------- */
async function holen(url, opt) {
  let r;
  try {
    const vorab = !opt && window.__vorab && window.__vorab[url]; if (vorab) delete window.__vorab[url];   // schon beim Laden der Seite geholt (index.html), nur einmal
    r = await (vorab || fetch(url, opt || { cache: 'no-store' }));
  } catch (e) { throw new Error('VERBINDUNG · Keine Verbindung. Deine Eingabe ist noch da, bitte gleich noch einmal versuchen.'); }
  let d = {};
  try { d = await r.clone().json(); } catch (e) { throw new Error('SERVER · Antwort nicht lesbar (' + r.status + ').'); }
  if (!r.ok) { const x = new Error(d.fehler || ('SERVER · Fehler ' + r.status)); x.status = r.status; throw x; }
  return d;
}
const senden = (url, methode, daten) => holen(url, { method: methode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(daten) });
const SAMMLUNG = n => '/angelina-strelow/werkzeuge/api/sammlung/anfragen-' + n;   // eigene Sammlungen des Werkzeugs (CLAUDE.md: <werkzeug>-<name>)
async function laden() {
  const [ab, pr, vo, ei, st, ha] = await Promise.all(['/angelina-strelow/werkzeuge/api/abende', SAMMLUNG('preise'), SAMMLUNG('vorlagen'), SAMMLUNG('einstellungen'), 'api/start', 'api/haus'].map(u => holen(u)));
  S.abende = ab.abende; S.etag = ab.etag; S.START = st; S.HAUS = ha || {};
  S.preise = leer(pr.daten) ? klon(st.preise) : pr.daten; S.vorlagen = leer(vo.daten) ? klon(st.vorlagen) : vo.daten; S.einst = leer(ei.daten) ? klon(st.einstellungen) : ei.daten;
  S.eigen = { preise: !S.preise.beispiel, vorlagen: !S.vorlagen.beispiel, einstellungen: !S.einst.beispiel };
  S.sEtag = { preise: pr.etag, vorlagen: vo.etag, einstellungen: ei.etag };
}
const abend = id => (S.abende || []).find(a => a.id === id);
const ang = a => (a && a.angebot) || {};
const kernVon = a => { const k = {}; Object.keys(a).forEach(x => { if (!['id', 'angebot', 'plan', 'tisch', 'nachher'].includes(x)) k[x] = a[x]; }); return k; };
/* Einen Teil eines Abends schreiben (nur mit etag). 409: der neue Stand wird geholt. Hat das andere Fenster etwas anderes gespeichert (anderer Abend),
   geht das Speichern einfach durch; hat es genau diesen Abend geändert, bleibt nichts überschrieben und deine Eingabe bleibt stehen (Prüfung 05.11.2026, Punkt 2). */
const wertVon = (a, teil) => JSON.stringify(a ? (teil === 'kern' ? kernVon(a) : (a[teil] == null ? null : a[teil])) : null);
const KONFLIKT_TEXT = 'KONFLIKT · Inzwischen hat ein anderes Fenster genau diesen Abend geändert. Deine Eingabe ist noch da: sieh dir den neuen Stand an und speichere noch einmal.';
async function teilSchreiben(teil, id, wert, was) {
  const vorher = wertVon(abend(id), teil);
  const los = () => senden('/angelina-strelow/werkzeuge/api/teil/' + teil + '/' + encodeURIComponent(id), 'PUT', { wert, etag: S.etag[teil], wer: WER, was });
  let d;
  try { d = await los(); }
  catch (e) {
    if (e.status !== 409) throw e;
    const neu = await holen('/angelina-strelow/werkzeuge/api/abende'); S.abende = neu.abende; S.etag = neu.etag;
    if (wertVon(abend(id), teil) !== vorher) { konflikt(); const x = new Error(KONFLIKT_TEXT); x.status = 409; throw x; }
    d = await los();
  }
  S.etag[teil] = d.etag;
  const a = abend(id);
  if (teil === 'kern' && !wert) S.abende = S.abende.filter(x => x.id !== id);
  else if (a) { if (teil === 'kern') Object.assign(a, wert); else a[teil] = wert; }
  else if (teil === 'kern') S.abende.push({ ...wert, id });
  return d;
}
async function sammlungSchreiben(name, daten, was) {
  const vorher = JSON.stringify(S[name === 'einstellungen' ? 'einst' : name]);
  const los = () => senden(SAMMLUNG(name), 'PUT', { daten, etag: S.sEtag[name], wer: WER, was });
  let d;
  try { d = await los(); }
  catch (e) {
    if (e.status !== 409) throw e;
    const neu = await holen(SAMMLUNG(name)); S.sEtag[name] = neu.etag;
    if (JSON.stringify(neu.daten) !== vorher) { if (name === 'preise') S.preise = neu.daten; if (name === 'vorlagen') S.vorlagen = neu.daten; if (name === 'einstellungen') S.einst = neu.daten;
      konflikt(); const x = new Error(KONFLIKT_TEXT.replace('genau diesen Abend', 'genau diesen Bereich')); x.status = 409; throw x; }
    d = await los();
  }
  S.sEtag[name] = d.etag; S.eigen[name] = !daten.beispiel;
  if (name === 'preise') S.preise = daten; if (name === 'vorlagen') S.vorlagen = daten; if (name === 'einstellungen') S.einst = daten;
  return d;
}
/* Neuer Stand ist geholt: Rand, Leiste und die offene Ansicht zeigen ihn; offene Eingaben (S.form, S.antw, S.einstForm) bleiben stehen */
function konflikt() {
  rand(); leiste();
  if (S.ansicht === 'eingang' && abend(S.wahl)) zeigDetail(S.wahl); else if (S.ansicht !== 'eingang') zeichne();
}
/* Schreiben als Änderung am neuesten Stand (Prüfung 2, N1): aendern(wert, abend) baut den neuen Wert immer aus dem, was gerade auf dem Server steht.
   Kommt 409, wird der neue Stand geholt und aendern läuft darauf noch einmal. So bleibt jede Änderung eines anderen Fensters stehen;
   nur wenn beide Fenster dasselbe Feld verschieden geändert haben, wirft aendern eine Kollision, zeigt den neuen Stand und speichert nichts. */
const J = x => JSON.stringify(ordne(x == null ? '' : x));
function kollision(text, knoepfe) { const x = new Error('KONFLIKT · ' + text); x.status = 409; x.kollision = true; if (knoepfe) x.knoepfe = knoepfe; return x; }
/* Drei Wege je Feld: eigene Änderung (mein ≠ basis) bleibt, sonst gilt der Server; Kollision, wenn beide dasselbe Feld verschieden geändert haben */
function dreiWege(mein, basis, server, keys) {
  const wert = {}, kollidiert = [], fremd = [];
  keys.forEach(k => {
    const m = J(mein[k]), b = J(basis[k]), s = J(server[k]);
    if (m !== b) { wert[k] = klon(mein[k]); if (s !== b && s !== m) kollidiert.push(k); }
    else { wert[k] = klon(server[k]); if (s !== b) fremd.push(k); }
  });
  return { wert, kollidiert, fremd };
}
async function teilAendern(teil, id, aendern, was) {
  for (let n = 0; n < 4; n++) {
    const a = abend(id), alt = a ? (teil === 'kern' ? kernVon(a) : klon(a[teil] == null ? null : a[teil])) : null;
    const wert = aendern(klon(alt), a);
    try {
      const d = await senden('/angelina-strelow/werkzeuge/api/teil/' + teil + '/' + encodeURIComponent(id), 'PUT', { wert, etag: S.etag[teil], wer: WER, was });
      S.etag[teil] = d.etag;
      const b = abend(id); if (b) { if (teil === 'kern') Object.assign(b, wert); else b[teil] = wert; }
      return { alt, wert };
    } catch (e) {
      if (e.status !== 409) throw e;
      const neu = await holen('/angelina-strelow/werkzeuge/api/abende'); S.abende = neu.abende; S.etag = neu.etag;
    }
  }
  konflikt(); throw new Error(KONFLIKT_TEXT);
}
const sammlungVon = name => S[name === 'einstellungen' ? 'einst' : name];
function sammlungSetzen(name, d) { if (name === 'einstellungen') S.einst = d; else S[name] = d; }
async function sammlungAendern(name, aendern, was) {
  for (let n = 0; n < 4; n++) {
    const alt = klon(sammlungVon(name)), daten = aendern(klon(alt));
    try {
      const d = await senden(SAMMLUNG(name), 'PUT', { daten, etag: S.sEtag[name], wer: WER, was });
      S.sEtag[name] = d.etag; S.eigen[name] = !daten.beispiel; sammlungSetzen(name, daten);
      return { alt, daten };
    } catch (e) {
      if (e.status !== 409) throw e;
      const neu = await holen(SAMMLUNG(name)); S.sEtag[name] = neu.etag; sammlungSetzen(name, leer(neu.daten) ? klon(S.START[name]) : neu.daten);
    }
  }
  konflikt(); throw new Error(KONFLIKT_TEXT.replace('genau diesen Abend', 'genau diesen Bereich'));
}
function zeigDetail(id) { const a = abend(id); if (!a || !$('#detail')) return; ruhigTauschen($('#detail'), detail(a)); nachDetail(); }
/* Ein Klick zur Zeit (Prüfung 05.11.2026, Punkt 3): während ein Knopf schreibt und kurz danach zählt kein zweiter Klick */
let sperre = false, sperreNr = 0;
async function einmal(fn, knopf) {
  if (sperre) return;
  sperre = true; const nr = ++sperreNr; if (knopf) knopf.setAttribute('aria-busy', 'true');
  try { return await fn(); } finally { setTimeout(() => { if (nr === sperreNr) sperre = false; if (knopf) knopf.removeAttribute('aria-busy'); }, 600); }
}
function sperreLos() { sperre = false; sperreNr++; }   // ein neues Fenster ist offen: sein Knopf darf sofort
function fehler(e) {
  const m = String((e && e.message) || e), st = (m.match(/^([A-ZÄÖÜ-]+) · /) || [])[1] || '';
  /* Eine Kollision mit Text bleibt stehen, bis du sie schliesst, damit du lesen kannst, was dort steht (Prüfung 3, N7) */
  quit(m.replace(/^[A-ZÄÖÜ-]+ · /, ''), st ? 'Stichwort ' + st : '', ((e && e.knoepfe) || []).concat([['Was tun?', () => window.open('pruefung.html#' + (st || 'SERVER'), '_blank', 'noopener')]]), true, e && e.kollision ? 0 : 12000);
}
function quit(titel, text, knoepfe = [], fehl = false, dauer = 9000) {
  const q = document.createElement('div');
  q.className = 'quit' + (fehl ? ' fehl' : '');
  q.innerHTML = `<div><b>${esc(titel)}</b>${text ? `<span>${esc(text)}</span>` : ''}</div>`;
  knoepfe.forEach(([t, f]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.onclick = () => { f(); q.remove(); }; q.appendChild(b); });
  const x = document.createElement('button'); x.type = 'button'; x.setAttribute('aria-label', 'Schliessen'); x.innerHTML = ZU; x.onclick = () => q.remove(); q.appendChild(x);
  $('#meldung').appendChild(q);
  while ($('#meldung').children.length > 3) $('#meldung').firstChild.remove();
  if (dauer) setTimeout(() => q.remove(), dauer);
}

/* ---------- Preise, Angebot, Textbausteine ---------- */
const posten = k => (S.preise.posten || []).find(p => p.k === k);
const grund = () => (S.preise.posten || []).find(p => p.gruppe === 'grund');
const anfahrt = () => (S.preise.posten || []).find(p => p.gruppe === 'anfahrt');
const preiseBeispiel = () => !!(S.preise.beispiel || (S.preise.posten || []).some(p => p.beispiel));
const preisText = p => p.anfrage || p.preis == null ? 'auf Anfrage' : p.einheit === 'enthalten' ? 'im Abend enthalten' : p.einheit === 'km' ? geld(p.preis) + ' je km' + (p.frei ? ', ' + p.frei + ' km enthalten' : '') : p.einheit === 'Stunde' ? geld(p.preis) + ' je Stunde' + (p.mindest ? ', mindestens ' + (p.mindest === 1 ? 'eine Stunde' : p.mindest + ' Stunden') : '') : p.einheit === 'Gast' ? geld(p.preis) + ' je Gast' : geld(p.preis);
/* Ein Angebot rechnen, genau wie _bau/beispiel_angebot.py rechne() */
function rechne(f, ab) {
  const z = [], g = grund(), mehr = mehrere(ab), D = x => duIhr(x, mehr);
  if (g) z.push({ k: g.k, t: D(g.t), menge: +f.stunden || 0, einheit: 'Stunde', preis: g.preis, betrag: Math.round((+f.stunden || 0) * g.preis * 100) / 100 });
  (f.leistungen || []).forEach(k => { const p = posten(k); if (p) z.push({ k, t: D(p.t), s: D(p.s), menge: 1, einheit: 'enthalten', preis: 0, betrag: 0 }); });
  Object.entries(f.zusaetze || {}).forEach(([k, m]) => { const p = posten(k); if (!p) return;
    if (p.anfrage || p.preis == null) z.push({ k, t: D(p.t), s: D(p.s), menge: 1, einheit: 'auf Anfrage', preis: null, betrag: null });
    else { const n = p.einheit === 'pauschal' ? 1 : +m || 1; z.push({ k, t: D(p.t), s: D(p.s), menge: n, einheit: p.einheit, preis: p.preis, betrag: Math.round(n * p.preis * 100) / 100 }); } });
  const a = anfahrt();
  if (a) { const km = Math.max(0, (+f.km || 0) - (a.frei || 0)); z.push({ k: a.k, t: D(a.t), s: (+f.km || 0) + ' km hin und zurück' + (a.frei ? ', ' + a.frei + ' km enthalten' : ''), menge: km, einheit: 'km', preis: a.preis, betrag: Math.round(km * a.preis * 100) / 100 }); }
  const summe = Math.round(z.reduce((s, x) => s + (x.betrag || 0), 0) * 100) / 100;
  return { posten: z, summe, anzahlung_betrag: Math.round(summe * (+f.anzahlung || 0) / 100) };
}
/* Bausteine füllen (Prüfung 2, N3 und N5): {dich|euch} wählt die Form für einen oder zwei Gastgeber; ein leerer Wert hinterlässt nie eine rohe Klammer:
   «…: {wunsch_kurz}» endet mit Punkt, eine Zeile nur mit der Stelle fällt weg, sonst fällt der Satz mit der Stelle weg. Unbekannte {Stellen} bleiben stehen,
   dann weist «Als gesendet vermerken» die Antwort ab. */
function fuelle(t, a, f) {
  const an = a.anfrage || {}, gg = a.gastgeber || {}, E = S.einst, mehr = mehrere(a), du = (x, y) => mehr ? y : x;
  const w = { vorname: vorname(gg.name), name: gg.name || '', anlass: an.anlass || du('dein Abend', 'euer Abend'), anlass_ein: EIN[an.anlass] || 'Ein Abend', anlass_den: (mehr ? DEN_IHR : DEN)[an.anlass] || du('deinen Abend', 'euren Abend'),
    datum: tagLang(an.datum) || 'Wunschtag', datum_kurz: tagKurz(an.datum) || 'Wunschtag', gaeste: gaesteText(an.gaeste, mehr), ort: an.ort || du('deinem Zuhause', 'eurem Zuhause'), calendly: S.HAUS.calendly || '',
    unterschrift: E.unterschrift || 'Herzlich\nAngelina', wunsch_kurz: String(an.wunsch || '').trim().split(/(?<=[.!?])\s/)[0].trim(),
    gueltig: f && f.gueltig_bis ? tagKurz(f.gueltig_bis) : '', anzahlung: f ? geld(f.anzahlung_betrag) : '', summe: f ? geld(f.summe) : '' };
  const LEER = '\u0000';
  let x = duIhr(t, mehr).replace(/\{(\w+)\}/g, (m, k) => !(k in w) ? m : w[k] != null && w[k] !== '' ? w[k]
    : (k === 'gueltig' || k === 'anzahlung' || k === 'summe') ? '[' + ({ gueltig: 'gültig bis', anzahlung: 'Anzahlung', summe: 'Summe' }[k]) + ']' : LEER);
  if (x.includes(LEER)) x = x.replace(/:[ \t]*\u0000[ \t]*(?=\n|$)/g, '.').replace(/:[ \t]*\n[ \t]*\u0000[ \t]*(?=\n|$)/g, '.').replace(/(^|\n)[ \t]*\u0000[ \t]*(?=\n|$)/g, '$1')
    .replace(/[^.!?\n]*\u0000[^.!?\n]*[.!?]?[ \t]*/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  return x;
}
const aktFassung = a => { const A = ang(a), l = A.fassungen || []; return l.find(f => f.nr === A.aktuell) || l[l.length - 1] || null; };
const gesendeteFassung = a => { const l = (ang(a).fassungen || []).filter(f => f.gesendet); return l[l.length - 1] || null; };
function neueFassung(a) {
  const E = S.einst, an = a.anfrage || {}, w = String(an.wunsch || ''), z = {};
  if (/musik|klavier|piano|pianist/i.test(w)) z.musik = 1;
  if (/mitternacht|silvester/i.test(w)) z.verlaengerung = 2;
  if (/wein/i.test(w) && posten('weinauswahl')) z.weinauswahl = 1;
  const gilt = heute(); gilt.setDate(gilt.getDate() + (+E.gueltig_tage || 14));
  return { nr: ((ang(a).fassungen || []).reduce((m, f) => Math.max(m, f.nr), 0)) + 1, zeit: '', gesendet: null, beginn: E.beginn || '18:00', stunden: +E.stunden || 6, km: 20,
    leistungen: (S.preise.posten || []).filter(p => p.gruppe === 'leistung').map(p => p.k), zusaetze: z, anzahlung: +E.anzahlung || 0, gueltig_bis: isoTag(gilt), zeile: duIhr(E.zeile || '', mehrere(a)) };
}
function blattDaten(a, f) {
  const r = rechne(f, a), an = a.anfrage || {}, E = S.einst;
  const l = ang(a).fassungen || [], g = l.find(x => x.nr === f.nr), nr = g && g.gesendet && !gleichForm(f, g) ? l.reduce((m, x) => Math.max(m, x.nr), 0) + 1 : f.nr;   // geänderte gesendete Fassung wird beim Speichern die nächste
  return { nr, ausgestellt: nr !== f.nr ? jetztIso().slice(0, 10) : (f.zeit || jetztIso()).slice(0, 10), name: (a.gastgeber || {}).name || '', anlass: an.anlass, datum: an.datum, ort: an.ort, gaeste: gaesteKurz(an.gaeste),
    beginn: f.beginn, stunden: +f.stunden, posten: r.posten, summe: r.summe, anzahlung: +f.anzahlung, anzahlung_betrag: r.anzahlung_betrag, gueltig_bis: f.gueltig_bis, zeile: f.zeile,
    unterschrift: E.unterschrift, unterschrift_bild: E.unterschrift_bild ? '/angelina-strelow/werkzeuge/anfragen/dateien/' + encodeURIComponent(E.unterschrift_bild) : '', email: S.HAUS.email, instagram: insta(), ust: E.ust, mehr: mehrere(a) };
}
const vorlage = k => (S.vorlagen.liste || []).find(v => v.k === k);
function vorschlag(a) {   // welcher Baustein passt zu dieser Station
  const st = station(a), w = String((a.anfrage || {}).wunsch || ''), l = ang(a).antworten || [], hat = k => l.some(x => x.vorlage === k);
  if (st === 'neu') { if ((a.anfrage || {}).gaeste === 'mehr' && !hat('viele')) return 'viele'; if (/kost|preis/i.test(w) && !hat('preisfrage')) return 'preisfrage'; if (a.quelle === 'kaffee' && !hat('nach_kaffee')) return 'nach_kaffee'; return hat('erste') ? 'nachfrage' : 'erste'; }
  if (st === 'angebot') return gesendeteFassung(a) && tageSeit(gesendeteFassung(a).gesendet) >= 5 ? 'erinnerung' : 'angebot';
  if (st === 'zugesagt') return hat('zusage') ? (hat('anzahlung') ? 'ablauf' : 'anzahlung') : 'zusage';
  if (st === 'abgesagt') return 'absage_verstehen';
  return 'ablauf';
}
/* Werte fürs Füllen der Bausteine: die gültige Fassung, sonst das Angebot, wie das Werkzeug es vorschlägt (nie rohe [Klammern], Prüfung 05.11.2026, Punkt 9) */
function fuellWerte(a) { const f = aktFassung(a) || formVon(a); return { ...f, ...rechne(f, a) }; }
function antwortEntwurf(a) {
  if (S.antw[a.id]) return S.antw[a.id];
  const e = ang(a).entwurf_antwort;
  let x;
  if (e && e.text) x = { vorlage: e.vorlage, betreff: e.betreff, text: e.text };
  else { const v = vorlage(vorschlag(a)) || (S.vorlagen.liste || [])[0], r = fuellWerte(a); x = { vorlage: v ? v.k : '', betreff: v ? fuelle(v.betreff, a, r) : '', text: v ? fuelle(v.text, a, r) : '' }; }
  S.antwBasis[a.id] = { ...x }; S.antwServer[a.id] = J(e && e.text ? { vorlage: e.vorlage, betreff: e.betreff, text: e.text } : null);
  return (S.antw[a.id] = x);
}

/* ---------- Hinweise je Abend (aus den Daten gerechnet, nie gespeichert) ---------- */
function hinweise(a) {
  const an = a.anfrage || {}, h = [], st = station(a), w = String(an.wunsch || '');
  if (an.datum && st !== 'abgesagt') {
    const andere = S.abende.filter(x => x.id !== a.id && x.status !== 'abgesagt' && (x.anfrage || {}).datum);
    const gleich = andere.filter(x => x.anfrage.datum === an.datum);
    gleich.forEach(x => h.push(BELEGT.includes(x.status) ? { art: 'belegt', text: `Am ${tagKurz(an.datum)} begleitest du schon ${x.gastgeber.name} in ${x.anfrage.ort}.` }
      : { art: 'doppelt', text: `Zwei Anfragen am selben Tag: auch ${x.gastgeber.name} fragt für den ${tagKurz(an.datum)} an.` }));
    const d = ausIso(an.datum);
    [-1, 1].forEach(n => { const t = new Date(d); t.setDate(t.getDate() + n); const x = andere.find(y => y.anfrage.datum === isoTag(t) && BELEGT.includes(y.status));
      if (x) h.push({ art: 'nah', text: `${n < 0 ? 'Am Vortag' : 'Am Tag danach'} bist du bei ${x.gastgeber.name} in ${x.anfrage.ort}.` }); });
    if (tageBis(an.datum) < 0 && ['neu', 'angebot'].includes(st)) h.push({ art: 'vorbei', text: 'Das Datum ist schon vorbei.' });
  }
  if (!an.datum && st === 'neu') h.push({ art: 'offen', text: 'Noch ohne Datum.' });
  if (an.gaeste === 'mehr' || (+an.gaeste > 16)) h.push({ art: 'gross', text: 'Mehr als 16 Gäste: den Ablauf im Vorgespräch genau klären.' });
  if (/musik|klavier|piano|pianist/i.test(w)) h.push({ art: 'musik', text: 'Fragt nach Musik: Frank Muschik (MUSHYK), Pianist, auf Anfrage.' });
  if (/kost|preis/i.test(w) && st === 'neu') h.push({ art: 'preis', text: 'Fragt nach dem Preis: Baustein «Was kostet ein Abend?».' });
  if (/mitternacht|silvester/i.test(w)) h.push({ art: 'spaet', text: 'Über Mitternacht: Zusatz «Abend über Mitternacht» im Angebot.' });
  return h;
}
const HINW_ZEICHEN = { belegt: 'uhr', doppelt: 'uhr', nah: 'karte', vorbei: 'uhr', offen: 'uhr', gross: 'person', musik: 'glocke', preis: 'karte', spaet: 'uhr' };
const HINW_KURZ = { belegt: 'Datum belegt', doppelt: 'Zwei Anfragen', nah: 'Abend daneben', vorbei: 'Datum vorbei', offen: 'Ohne Datum', gross: 'Viele Gäste', musik: 'Musik', preis: 'Preisfrage', spaet: 'Mitternacht' };
/* Wie lange etwas wartet (ruhig markiert): Anfrage ohne Antwort, Angebot ohne Rückmeldung */
function wartet(a) {
  const st = station(a), A = ang(a);
  if (st === 'neu') {
    const l = (A.antworten || []).filter(x => x.gesendet); if (l.length) return null;
    const n = tageSeit(a.eingang); return { n, text: n <= 0 ? 'heute angefragt' : n === 1 ? 'seit gestern ohne Antwort' : `seit ${n} Tagen ohne Antwort` };
  }
  if (st === 'angebot') { const f = gesendeteFassung(a); if (!f) return null; const n = tageSeit(f.gesendet); return { n, text: n <= 0 ? 'Angebot heute raus' : n === 1 ? 'Angebot seit gestern' : `Angebot seit ${n} Tagen ohne Rückmeldung` }; }
  return null;
}

/* ---------- Rahmen: Kopf, Rand, Leiste ---------- */
const woKn = h => String(h || '').replace(/class="kn kn--(gold|linie)( glanz-kn)?"/g, (m, a) => `class="wo-kn wo-kn--${a === 'gold' ? 'gold' : 'hell'}"`)
  .replace(/class="kn"/g, 'class="wo-kn wo-kn--hell"').replace(/(<(?:a|button) class="wo-kn[^"]*"[^>]*>)([^<]+)<i>/g, '$1<span>$2</span><i>')
  .replace(/(<(?:a|button) class="wo-kn[^"]*"[^>]*>(?:(?!<\/(?:a|button)>).)*?<i>)<svg (?![^>]*class=)/g, '$1<svg class="wo-ic" ');
function zahlen() {
  const l = S.abende || [], z = k => l.filter(a => station(a) === k).length;
  const naechster = l.filter(a => BELEGT.includes(a.status) && (a.anfrage || {}).datum && tageBis(a.anfrage.datum) >= 0).sort((x, y) => x.anfrage.datum.localeCompare(y.anfrage.datum))[0];
  return { neu: z('neu'), angebot: z('angebot'), zugesagt: z('zugesagt'), vorbei: z('vorbei'), abgesagt: z('abgesagt'), alle: l.length, naechster,
    ohne: l.filter(a => { const w = wartet(a); return w && station(a) === 'neu' && w.n >= 2; }).length, still: l.filter(a => { const w = wartet(a); return w && station(a) === 'angebot' && w.n >= 5; }).length };
}
function standSatz() { const z = zahlen(); return z.neu ? mal(z.neu, 'Eine neue Anfrage', 'neue Anfragen') : 'Keine neue Anfrage'; }
function kopfLeiste() {
  $('#kopf').innerHTML = WO.kopf({ werkzeug: 'anfragen', unter: 'Anfragen', titel: TITEL[S.ansicht] || WO.name('anfragen'), stand: standSatz(),
    pruefung: WEGE.pruefung, anleitung: WEGE.anleitung, website: WEGE.website, marke: 'data-gehe="start"' });
  const r = $('#kopf .wo-kopf__r');
  if (r) r.insertAdjacentHTML('afterbegin', WO.knopf('Neue Anfrage', 'plus', 'hell', { id: 'k-neu', klein: true, attr: 'data-akt="neu-anfrage"' }) + '<span class="wo-trenn"></span>');
}
function rand() {
  const z = zahlen(), an = S.ansicht;
  const e = (key, text, zahl = 0) => ({ text, zahl, an: an === key, attr: `data-gehe="${key}"` });
  $('#rand').innerHTML = WO.rand([{ titel: '', eintraege: [e('start', 'Übersicht')] },
    { titel: 'Deine Abende', eintraege: [e('eingang', 'Eingang', z.neu), e('termine', 'Terminblick')] },
    { titel: 'Deine Vorlagen', eintraege: [e('preise', 'Preisliste'), e('bausteine', 'Textbausteine'), e('einstellungen', 'Einstellungen')] }], WEGE);
  const w = $('#rand .wo-rand__wege'), pf = WO.ic('pfeil');
  if (w) {
    w.insertAdjacentHTML('afterbegin', `<a href="${WEGE.website.replace('index.html', 'index.html#anfrage')}" target="_blank" rel="noopener">Anfrage auf der Website${pf}</a>`);
    w.insertAdjacentHTML('beforeend', `<a href="${esc(WO_HAUS.wege.abendplan)}">${esc(WO.name('abendplan'))}${pf}</a><button class="wo-rand__probe" type="button" data-akt="neu-anfrage">Neue Anfrage${WO.ic('plus')}</button>`);
  }
  kopfLeiste();
}
function leiste() {
  const z = zahlen(), n = S.offen.size;
  const titel = n ? mal(n, 'Eine Eingabe', 'Eingaben') + ' nicht gespeichert' : z.neu ? mal(z.neu, 'Eine neue Anfrage', 'neue Anfragen') + ' im Eingang' : z.angebot ? mal(z.angebot, 'Ein Angebot wartet', 'Angebote warten') + ' auf Antwort' : 'Alles beantwortet';
  const satz = n ? 'Speichern legt sie in den Abend. Mit ⌘S oder Strg+S geht es auch.' : (z.angebot && z.neu ? mal(z.angebot, 'Ein Angebot wartet', 'Angebote warten') + ' auf den Gastgeber. ' : '') + (z.naechster ? 'Nächster Abend: ' + tagKurz(z.naechster.anfrage.datum) + ', ' + z.naechster.gastgeber.name + '.' : 'Kein Abend steht fest.');
  $('#leiste').innerHTML = WO.leiste({ titel, satz, entwurf: !!n,
    knoepfe: (n ? WO.knopf('Verwerfen', 'zurueck', 'glas', { id: 'l-weg', klein: true }) : WO.knopf('Neu laden', 'verlauf', 'glas', { id: 'l-neu', klein: true }))
      + WO.knopf('Speichern', 'haken', n ? 'wartet' : 'glas', { id: 'l-sp', klein: true, titel: n ? 'Speichern (⌘S)' : 'Nichts zu speichern' }) });
  $('#l-sp').onclick = () => einmal(speichern);
  if ($('#l-neu')) $('#l-neu').onclick = async () => { try { await laden(); rand(); leiste(); await zeichne(); quit('Neu geladen', '', [], false, 2500); } catch (e) { fehler(e); } };
  if ($('#l-weg')) $('#l-weg').onclick = () => { S.offen.clear(); S.antw = {}; S.form = {}; S.antwBasis = {}; S.antwServer = {}; S.formBasis = {}; S.einstForm = null; S.einstBasis = null; leiste(); zeichne(); quit('Verworfen', 'Deine ungespeicherten Eingaben sind weg, der gespeicherte Stand steht wieder da.', [], false, 4000); };
}
function kopf(mono, titel, satz, knoepfe = '', foto = '') {   // Bühne jeder Ansicht = Startbild «buehne» des Pakets mit dem Foto der Ansicht
  return WO.startbild({ werkzeug: 'anfragen', art: 'buehne', zier: esc(WO.name('anfragen') + ' · ' + mono), h1: titel, satz, knoepfe: woKn(knoepfe),
    foto: '/angelina-strelow/werkzeuge/assets/bild/' + (foto || SB_FOTO[S.ansicht] || 'raum') + '-1000.webp' });
}
function gehe(ziel, wahl = '') {
  if (!TITEL[ziel]) ziel = 'start';
  if (ziel === 'eingang' && S.ansicht === 'eingang' && wahl && $('#detail')) {   // im Eingang nur das Detail wechseln, die Liste bleibt stehen
    const a = abend(wahl);
    if (a) {
      S.wahl = wahl;
      $$('.re-a.aktiv').forEach(k => k.classList.remove('aktiv'));
      const k = $(`.re-a[data-wahl="${CSS.escape(wahl)}"]`); if (k) k.classList.add('aktiv');
      ruhigTauschen($('#detail'), detail(a)); nachDetail();
      if (innerWidth <= 1180) $('#detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
  }
  S.ansicht = ziel; S.wahl = wahl;
  try { localStorage.setItem('anfragen-ansicht', ziel); } catch (e) { /* privat */ }
  if (location.hash.slice(1) !== ziel) history.replaceState(null, '', '#' + ziel);
  rand(); zeichne(); window.scrollTo(0, 0);
  $('#rand').classList.remove('auf');
}
function ruhigTauschen(el, html) {   // Robert 16.10.2026: beim Wechseln springt nichts, Scrollstand bleibt
  const y = scrollY, h = el.offsetHeight;
  el.style.minHeight = h + 'px'; el.innerHTML = html;
  $$('.re-auf', el).forEach(x => x.classList.add('still'));
  if (scrollY !== y) scrollTo({ top: y, behavior: 'instant' });
  requestAnimationFrame(() => { if (scrollY !== y) scrollTo({ top: y, behavior: 'instant' }); setTimeout(() => { el.style.minHeight = ''; }, 400); });
}

/* ---------- Ansichten ---------- */
async function zeichne() {
  const el = $('#ansicht');
  try {
    if (!S.abende) await laden();
    el.innerHTML = ({ start, eingang, termine, bausteine, preise: preiseS, einstellungen: einstS }[S.ansicht] || start)();
    if (S.ansicht === 'eingang') nachDetail();
    $$('#ansicht .re-n').forEach((x, i) => { x.classList.add('re-auf'); x.style.setProperty('--i', Math.min(i, 12)); });
  } catch (e) { fehler(e); }
}
function karteAbend(a, i = 0, nicht = '') {
  const an = a.anfrage || {}, st = station(a), w = wartet(a), h = hinweise(a).map(x => HINW_KURZ[x.art]).filter(Boolean);
  const b = bildVon(a, nicht);
  return `<button class="re-a${st === 'neu' ? ' neu' : ''}${st === 'abgesagt' || st === 'vorbei' ? ' erledigt' : ''}${S.wahl === a.id && S.ansicht === 'eingang' ? ' aktiv' : ''}" style="--i:${i}" type="button" data-gehe="eingang" data-wahl="${esc(a.id)}" data-bild="${b}">
    ${IMG(b, 're-a__bild')}
    <span class="re-a__n"><span class="re-a__k re-gl-r">${glieder([esc(an.anlass || 'Anfrage'), esc(QUELLE_KURZ[a.quelle] || QUELLE[a.quelle] || a.quelle || ''), esc(zeitKurz(a.eingang))])}</span><b><bdi>${esc((a.gastgeber || {}).name || 'Ohne Namen')}</bdi></b>
      <small class="re-gl-r">${glieder([esc(tagListe(an.datum)), esc(gaesteKurz(an.gaeste)), esc(an.ort || '')])}</small>
      ${w ? `<em class="re-a__alt${w.n >= (st === 'neu' ? 2 : 5) ? ' lange' : ''}">${esc(w.text)}</em>` : ''}${h.length ? `<em class="re-a__hinw re-gl-r">${glieder(h.map(esc))}</em>` : ''}</span>
    <span class="re-a__st">${esc(STATUS_NAME[a.status] || a.status)}</span></button>`;
}
const zeitKurz = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' }); };
function glieder(l) { return l.filter(Boolean).map(x => `<span class="re-gl">${x}</span>`).join(''); }
function liste(l, start = 0) { let vor = '', n = start; return l.map(a => { const h = karteAbend(a, n++, vor); vor = bildVon(a, vor); return h; }).join(''); }

function start() {
  const z = zahlen(), l = S.abende;
  const neu = l.filter(a => station(a) === 'neu').sort((x, y) => String(y.eingang).localeCompare(String(x.eingang)));
  const kommend = l.filter(a => BELEGT.includes(a.status) && tageBis(a.anfrage.datum) >= 0).sort((x, y) => x.anfrage.datum.localeCompare(y.anfrage.datum));
  const teile = [];
  if (z.neu) teile.push(mal(z.neu, 'eine neue Anfrage', 'neue Anfragen'));
  if (z.angebot) teile.push(mal(z.angebot, 'ein Angebot', 'Angebote') + ' ohne Antwort');
  const wartetSatz = teile.length ? 'Heute warten ' + teile.join(' und ') + '.' : 'Heute wartet nichts auf dich.';
  const n = z.naechster;
  const satz = wartetSatz + (n ? ` Dein nächster Abend: ${tagLang(n.anfrage.datum)}, bei ${esc(n.gastgeber.name)}${n.anfrage.ort ? ' in ' + esc(n.anfrage.ort) : ''}.` : '') + ' Hier kommt jede Anfrage an einen Ort, und daraus wird in wenigen Handgriffen ein Angebot in deiner Marke. Verschickt wird nur, was du selbst schickst.';
  return WO.startbild({ werkzeug: 'anfragen', art: 'voll', zier: esc(WO.name('anfragen') + ' · Angelina Strelow'), h1: `<span data-wo-gruss>${WO.gruss()}</span> <em>Wer lädt dich ein?</em>`, satz,
    knoepfe: WO.knopf('Anleitung', 'buch', 'gold', { href: 'anleitung.html', neu: true }) + WO.knopf('Neue Anfrage', 'plus', 'hell', { attr: 'data-akt="neu-anfrage"' }) }) +
    `<div class="wo-lage">
      <div class="wo-lg"><i class="wo-lg__z">${WO.ic('mail')}</i><span class="wo-mk">Neu</span><b>${z.neu ? mal(z.neu, 'Eine Anfrage', 'Anfragen') : 'Nichts Neues'}</b><p>${z.ohne ? (z.ohne === 1 ? 'Eine wartet' : 'Davon warten ' + z.ohne) + ' seit mehr als einem Tag auf deine Antwort.' : z.neu ? 'Alle frisch, keine wartet lange.' : 'Sobald jemand über die Website, Instagram oder eine Empfehlung anfragt, steht es hier.'}</p><button class="wo-lk" type="button" data-gehe="eingang" data-station="neu">Zum Eingang</button></div>
      <div class="wo-lg"><i class="wo-lg__z">${WO.ic('pdf')}</i><span class="wo-mk">Angebot raus</span><b>${z.angebot ? mal(z.angebot, 'Ein Angebot', 'Angebote') : 'Keines offen'}</b><p>${z.still ? (z.still === 1 ? 'Eines' : z.still) + ' seit fünf Tagen und mehr ohne Rückmeldung. Eine freundliche Erinnerung liegt bei den Bausteinen.' : z.angebot ? 'Die Gastgeber haben sie erst vor Kurzem bekommen.' : 'Jedes Angebot ist beantwortet.'}</p><button class="wo-lk" type="button" data-gehe="eingang" data-station="angebot">Angebote ansehen</button></div>
      <div class="wo-lg"><i class="wo-lg__z">${WO.ic('uhr')}</i><span class="wo-mk">Nächster Abend</span><b>${n ? esc(tagKurz(n.anfrage.datum)) : 'Noch keiner'}</b><p>${n ? esc(n.gastgeber.name) + (n.anfrage.ort ? ', ' + esc(n.anfrage.ort) : '') + '. ' + (tageBis(n.anfrage.datum) === 0 ? 'Heute.' : 'In ' + mal(tageBis(n.anfrage.datum), 'einem Tag.', 'Tagen.')) : 'Sobald ein Gastgeber zusagt, steht sein Abend hier.'}</p><button class="wo-lk" type="button" data-gehe="termine">Zum Terminblick</button></div>
    </div>
    <h2 class="wo-zw">Nach <em>Station</em></h2><div class="wo-aufg">${['neu', 'angebot', 'zugesagt', 'abgesagt'].map(k => `<button class="wo-ag" type="button" data-gehe="eingang" data-station="${k}"><span class="wo-ag__b"><img src="/angelina-strelow/werkzeuge/assets/bild/${ST_BILD[k]}-640.webp" alt="" width="640" height="480" decoding="async"></span><span class="wo-ag__t"><i class="wo-ag__z">${WO.ic({ neu: 'mail', angebot: 'pdf', zugesagt: 'haken', abgesagt: 'zurueck' }[k])}</i><b>${ST_LANG[k]}</b><span>${z[k] ? mal(z[k], 'ein Abend', 'Abende') + ' · ' + ST_SATZ[k].charAt(0).toLowerCase() + ST_SATZ[k].slice(1) : k === 'abgesagt' ? 'keiner, wie schön' : 'gerade keiner'}</span></span></button>`).join('')}</div>
    <div class="re-start">
      <section class="re-start__sp"><h2 class="wo-zw">Zuletzt <em>angefragt</em></h2>
        ${neu.length ? `<div class="re-liste">${liste(neu.slice(0, 4), 1)}</div><button class="link re-mehr" type="button" data-gehe="eingang" data-station="neu">Alle ${mal(neu.length, 'neue Anfrage', 'neuen Anfragen')} im Eingang</button>`
          : `<div class="re-leer platte">${ZEICHEN}<b>Keine neue Anfrage.</b><p>Fragt jemand über deine Website, auf Instagram oder nach einer Empfehlung an, steht es hier.</p></div>`}
      </section>
      <section class="re-start__sp"><h2 class="wo-zw">Deine nächsten <em>Abende</em></h2>
        ${kommend.length ? `<div class="re-liste">${liste(kommend.slice(0, 4), 5)}</div><button class="link re-mehr" type="button" data-gehe="termine">Alle Termine im Terminblick</button>`
          : `<div class="re-leer platte">${ZEICHEN}<b>Noch kein Abend fest.</b><p>Sagt ein Gastgeber zu, steht sein Abend hier und im Abendplan.</p></div>`}
      </section>
    </div>`;
}

/* ---------- Eingang ---------- */
function tagVon(iso) {
  const d = new Date(iso), h = heute(); if (isNaN(d)) return 'Früher';
  const t = Math.round((h - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 864e5);
  return t <= 0 ? 'Heute' : t === 1 ? 'Gestern' : t < 7 ? TAGE[d.getDay()] : 'Früher';
}
function gefiltert() {
  const q = S.such.trim().toLowerCase();
  return S.abende.filter(a => (S.station === 'alle' || station(a) === S.station)
    && (!S.anlass || (a.anfrage || {}).anlass === S.anlass)
    && (!S.monat || String((a.anfrage || {}).datum || '').slice(0, 7) === S.monat)
    && (!q || [a.gastgeber.name, a.gastgeber.email, a.anfrage.ort, a.anfrage.wunsch, a.anfrage.anlass, QUELLE[a.quelle]].join(' ').toLowerCase().includes(q)))
    .sort((x, y) => String(y.eingang).localeCompare(String(x.eingang)));
}
function monate() {
  const m = [...new Set(S.abende.map(a => String((a.anfrage || {}).datum || '').slice(0, 7)).filter(Boolean))].sort();
  return m.map(x => [x, MON[+x.slice(5) - 1] + ' ' + x.slice(0, 4)]);
}
function eingang() {
  const l = gefiltert();
  if ((!S.wahl || !l.some(a => a.id === S.wahl)) && l.length) S.wahl = (l.find(a => station(a) === 'neu') || l[0]).id;
  const a = abend(S.wahl);
  const tage = []; l.forEach(x => { const t = tagVon(x.eingang); const g = tage.find(y => y.t === t); g ? g.l.push(x) : tage.push({ t, l: [x] }); });
  const zahl = k => k === 'alle' ? S.abende.length : S.abende.filter(x => station(x) === k).length;
  let n = 0, vor = '';
  return kopf('Eingang', 'Anfragen <em>für deine Abende.</em>',
    'Jede Anfrage an einem Ort: über das Formular deiner Website, auf Instagram, nach einer Empfehlung oder nach einem Kennenlernen bei einem Kaffee. Bei jeder stehen Anlass, Datum, Gäste und Ort, deine Notizen aus dem Vorgespräch, die Antwort aus deinen Bausteinen und das Angebot als Blatt in deiner Marke. Verschickt wird nichts, du kopierst und schickst selbst.',
    `<button class="kn kn--linie" type="button" data-akt="neu-anfrage">Anfrage von Hand anlegen<i>${PF}</i></button>`) +
    `<div class="re-eingang"><div class="re-spalte">
        <div class="re-abt" role="group" aria-label="Station">${[['alle', 'Alle']].concat(Object.keys(STATION).map(k => [k, ST_NAME[k]])).map(([k, t]) => `<button type="button" data-station="${k}" aria-pressed="${S.station === k}"><span>${t}</span><i${zahl(k) && k !== 'alle' && k !== 'vorbei' ? ' class="da"' : ''}>${zahl(k)}</i></button>`).join('')}</div>
        <div class="an-such"><label class="an-such__f"><span class="an-vers">Suche</span><input id="e-such" type="search" value="${esc(S.such)}" placeholder="Name, Ort, Wunsch" autocomplete="off"></label>
          <label class="an-such__w"><span class="an-vers">Anlass</span><select class="sel" id="e-anlass"><option value="">Jeder Anlass</option>${ANLAESSE.map(x => `<option${S.anlass === x ? ' selected' : ''}>${x}</option>`).join('')}</select></label>
          <label class="an-such__w"><span class="an-vers">Monat</span><select class="sel" id="e-monat"><option value="">Jeder Monat</option>${monate().map(([k, t]) => `<option value="${k}"${S.monat === k ? ' selected' : ''}>${t}</option>`).join('')}</select></label></div>
        <div class="re-liste" id="e-liste">${tage.map(g => `<p class="re-tag"><span>${esc(g.t === 'Heute' || g.t === 'Gestern' || g.t === 'Früher' ? g.t + ' angefragt' : g.t)}</span></p>${g.l.map(x => { const h = karteAbend(x, n++, vor); vor = bildVon(x, vor); return h; }).join('')}`).join('')
          || (S.station === 'abgesagt' && !S.such && !S.anlass && !S.monat ? beispielAbsage() : `<div class="re-leer platte">${ZEICHEN}<b>Nichts in dieser Auswahl.</b><p>Andere Station, anderer Anlass oder ein anderes Wort in der Suche zeigt mehr.</p><button class="link" type="button" data-akt="filter-weg">Auswahl zurücksetzen</button></div>`)}</div></div>
        <div class="re-detail" id="detail">${a ? detail(a) : ''}</div></div>`;
}
function beispielAbsage() {   // R20: Beispiel statt Leere
  return `<div class="re-leer platte an-bsp">${ZEICHEN}<b>Kein Abend abgesagt.</b><p>Sagt ein Gastgeber ab oder ist dein Termin schon vergeben, setzt du die Anfrage mit Grund auf «Abgesagt». So sähe sie hier aus:</p>
    <div class="re-a erledigt an-bsp__a" aria-hidden="true">${IMG('p89', 're-a__bild')}<span class="re-a__n"><span class="re-a__k">Beispiel · Geburtstag · Website</span><b>Ein Gastgeber</b><small>Sa, 12. Dez. 2026 · bis 10 Gäste · Köln</small><em class="re-a__hinw">Grund: Termin bei mir vergeben</em></span><span class="re-a__st">Abgesagt</span></div></div>`;
}
function detail(a) {
  const an = a.anfrage || {}, gg = a.gastgeber || {}, A = ang(a), st = station(a), vg = A.vorgespraech || {};
  const angaben = { wann: [['Datum', esc(tagLang(an.datum) || 'noch offen')], ['Gäste', esc(gaesteKurz(an.gaeste) || 'nicht genannt')], ['Ort', esc(an.ort || 'nicht genannt')]],
    gast: [['E-Mail', gg.email ? `<span class="re-mail">${esc(gg.email)}</span>` : 'nicht genannt'], ['Telefon', gg.telefon ? `<span class="re-mail">${esc(gg.telefon)}</span>` : 'nicht genannt'],
      ['Küche', esc({ selbst: 'Gastgeber kocht selbst', caterer: 'Caterer', gemischt: 'Selbst und Caterer' }[vg.kueche] || 'noch offen')]] };
  const verlauf = [{ zeit: a.eingang, was: 'Anfrage über ' + (QUELLE[a.quelle] || 'einen anderen Weg') }].concat(A.verlauf || []).sort((x, y) => String(x.zeit).localeCompare(String(y.zeit)));
  const weg = `<button class="rund" type="button" data-akt="loeschen" data-tip="Löschen" aria-label="Anfrage löschen">${SYM.korb}</button>`;   // wie im Vorbild: Papierkorb = Löschen
  const kn = st === 'abgesagt' ? weg + `<button class="kn kn--klein kn--linie" type="button" data-akt="wieder">Wieder öffnen<i>${ZU}</i></button>`
    : ['neu', 'angebot'].includes(st) ? weg + `<button class="kn kn--klein kn--linie" type="button" data-akt="absage">Absage<i>${ZU}</i></button><button class="kn kn--klein kn--gold" type="button" data-akt="zusage">Zusage<i>${SYM.haken}</i></button>`
    : `<a class="kn kn--klein kn--gold" href="${esc(WO_HAUS.wege.abendplan)}#${esc(a.id)}">Im Abendplan<i>${PF}</i></a>`;
  return `<section class="re-d re-auf" style="--i:0">
      <div class="re-d__kopf">${IMG(bildVon(a), 're-d__bild')}
        <div class="re-d__n"><span class="re-d__k re-gl-r">${glieder([esc(an.anlass || 'Anfrage'), esc(STATUS_NAME[a.status] || a.status), esc(zeit(a.eingang))])}</span><h2><bdi>${esc(gg.name || 'Ohne Namen')}</bdi></h2></div>
        <div class="re-d__kn">${kn}</div></div>
      <p class="re-woher mono">${esc(QUELLE[a.quelle] || a.quelle || 'Anfrage')}${a.quelle === 'website' ? ' · Formular «Anfrage»' : ''}${a.beispiel ? ' · Beispiel' : A.beispiel ? ' · Angebot als Beispiel nachgetragen' : ''}${A.absage ? ' · Abgesagt: ' + esc(A.absage.grund) : ''}</p>
      <dl class="re-angaben re-angaben--wann re-angaben--drei">${angaben.wann.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
      <dl class="re-angaben re-angaben--gast">${angaben.gast.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
      ${hinweiseHTML(a)}
      ${an.wunsch ? `<blockquote class="re-anliegen" dir="auto"><span class="an-vers">Was möchtest du abgeben?</span>${esc(an.wunsch)}</blockquote>` : ''}
      <details class="re-gespraech"${vg.stimmung || vg.besonderheiten ? '' : ''}><summary><span>Notizen aus dem Vorgespräch</span><i>${vg.gespraech ? 'vom ' + esc(tagKurz(vg.gespraech)) : 'noch keine'}</i></summary><div class="re-gespraech__l">
        <div class="re-formular"><dl>${[['Stimmung des Abends', vg.stimmung], ['Wer kocht', vg.wer_kocht], ['Caterer', vg.caterer], ['Besonderheiten', vg.besonderheiten]].map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v) || '–'}</dd></div>`).join('')}</dl></div>
        <button class="kn kn--klein kn--linie" type="button" data-akt="notizen">Notizen bearbeiten<i>${SYM.stift}</i></button></div></details>
      <details class="re-gespraech"><summary><span>Verlauf des Abends</span><i>${mal(verlauf.length, 'ein Schritt', 'Schritte')}</i></summary><div class="re-gespraech__l"><ol class="an-verlauf">${verlauf.map(v => `<li><small>${esc(zeit(v.zeit))}</small>${esc(v.was)}</li>`).join('')}</ol></div></details>
    </section>
    <section class="re-post re-auf" style="--i:1">
      <div class="re-post__kopf"><div><span class="mono">${S.reiter === 'angebot' ? 'Für ' + esc(vorname(gg.name)) : 'An ' + esc(vorname(gg.name))}</span><h2>${S.reiter === 'angebot' ? 'Das <em>Angebot</em>' : 'Die <em>Antwort</em>'}</h2></div>
        <div class="wahl2 re-modus" role="group" aria-label="Ansicht"><button type="button" data-akt="reiter-antwort" aria-pressed="${S.reiter !== 'angebot'}">Antwort</button><button type="button" data-akt="reiter-angebot" aria-pressed="${S.reiter === 'angebot'}">Angebot</button></div></div>
      ${S.reiter === 'angebot' ? angebotEditor(a) : antwortEditor(a)}
    </section>`;
}
function hinweiseHTML(a) {
  const h = hinweise(a);
  return h.length ? `<ul class="re-hinw" aria-label="Hinweise">${h.map(x => `<li class="re-hinw__p re-hinw--${esc(x.art)}">${WO.ic(HINW_ZEICHEN[x.art] || 'mail')}<span>${esc(x.text)}</span></li>`).join('')}</ul>` : '';
}

/* Antwort: Entwurf aus einem Textbaustein, gefüllt mit den Angaben des Abends, bearbeitbar; Kopieren und «Als gesendet vermerken» */
function antwortEditor(a) {
  const e = antwortEntwurf(a), offen = ((e.betreff + '\n' + e.text).match(OFFEN_STELLE_ALLE) || []).length, gg = a.gastgeber || {}, l = ang(a).antworten || [];
  return `<label class="an-wahl"><span class="an-vers">Textbaustein</span><select class="sel" id="a-vorlage" data-f="antwort">${(S.vorlagen.liste || []).map(v => `<option value="${esc(v.k)}"${v.k === e.vorlage ? ' selected' : ''}>${esc(v.t)}</option>`).join('')}</select></label>
    <article class="brief brief--bearb" id="a-brief">
      <header class="brief__kopf">${MARKE}</header>
      <dl class="brief__an">
        <div><dt>An</dt><dd><bdi>${esc(gg.name || '')}</bdi><small>${esc(gg.email || gg.telefon || '')}</small></dd></div>
        <div><dt>Von</dt><dd>Angelina Strelow<small>${esc(S.HAUS.email || '')}</small></dd></div>
        <div class="brief__betreff"><dt>Betreff</dt><dd><textarea id="a-betreff" rows="1" spellcheck="true" data-f="antwort">${esc(e.betreff)}</textarea></dd></div>
      </dl>
      <div class="brief__text"><textarea id="a-text" spellcheck="true" data-f="antwort">${esc(e.text)}</textarea></div>
      <footer class="brief__fuss">${esc(S.einst.fuss || '')}</footer>
    </article>
    <div class="re-post__unten">
      <aside class="re-notiz">
        <span class="mono">Vor dem Senden</span>
        <b>${offen ? mal(offen, 'Eine Stelle ist', 'Stellen sind') + ' noch offen' : 'Die Antwort ist vollständig'}</b>
        <p>${offen ? 'Die Stellen in Klammern füllst du noch aus, zum Beispiel das Angebot, das noch nicht gesichert ist.' : 'Lies sie einmal durch, kopier sie in dein Postfach oder Instagram und vermerk sie hier als gesendet.'}</p>
        ${l.length ? `<ul>${l.slice().reverse().slice(0, 4).map(x => `<li>${esc(x.t)} · gesendet ${esc(zeitKurz(x.gesendet))}</li>`).join('')}</ul>` : '<ul><li>Noch keine Antwort an diesen Gastgeber vermerkt.</li></ul>'}
      </aside>
      <div class="re-post__kn">
        <button class="kn kn--gold" type="button" data-akt="kopieren">Text kopieren<i>${SYM.kopie}</i></button>
        <button class="kn" type="button" data-akt="gesendet">Als gesendet vermerken<i>${SYM.post}</i></button>
        <button class="link" type="button" data-akt="neu-fuellen">Baustein neu einsetzen</button>
        <p class="re-hinweis">Der Text kommt aus deinem Baustein, gefüllt mit Name, Anlass, Datum und Ort. Ändere ihn hier frei; «Speichern» unten hält deinen Entwurf beim Abend fest. Verschickt wird hier nichts, und es öffnet sich kein Mailprogramm.</p>
      </div>
    </div>`;
}
/* Angebot: Leistungen, Dauer, Anfahrt, Zusätze, Anzahlung, gültig bis, persönliche Zeile; daneben das Blatt in ihrer Marke, Summe rechnet sich */
function formVon(a) {
  if (S.form[a.id]) return S.form[a.id];
  const f = aktFassung(a);
  S.form[a.id] = f ? klon(f) : neueFassung(a); S.formBasis[a.id] = klon(S.form[a.id]);
  return S.form[a.id];
}
function angebotEditor(a) {
  const f = formVon(a), r = rechne(f, a), A = ang(a), l = A.fassungen || [], bsp = preiseBeispiel(), gesendet = !!f.gesendet, g = grund(), af = anfahrt();
  const leist = (S.preise.posten || []).filter(p => p.gruppe === 'leistung'), zus = (S.preise.posten || []).filter(p => p.gruppe === 'zusatz');
  return `<div class="an-fassungen" role="group" aria-label="Fassungen">${l.map(x => `<button type="button" data-akt="fassung" data-nr="${x.nr}" aria-pressed="${x.nr === f.nr}"><b>Fassung ${x.nr}</b><small>${x.gesendet ? 'gesendet ' + esc(zeitKurz(x.gesendet)) : 'Entwurf' + (x.zeit ? ' ' + esc(zeitKurz(x.zeit)) : '')} · ${esc(geld(x.summe))}</small></button>`).join('')}
      ${!l.some(x => x.nr === f.nr) ? `<button type="button" aria-pressed="true"><b>Fassung ${f.nr}</b><small>neu, noch nicht gesichert</small></button>` : ''}
      ${l.length && (l.some(x => x.nr === f.nr)) ? `<button type="button" class="an-fassungen__neu" data-akt="fassung-neu"><b>Neue Fassung</b><small>aus dieser</small></button>` : ''}</div>
    ${gesendet ? `<p class="an-gesendet">${WO.ic('haken')}<span>Fassung ${f.nr} ist am ${esc(zeit(f.gesendet))} rausgegangen und bleibt so. Änderst du etwas, entsteht beim Speichern eine neue Fassung.</span></p>` : ''}
    <div class="an-angebot">
      <div class="an-form">
        <fieldset class="an-gr"><legend>Dein Abend</legend>
          <div class="an-zeile3">
            <label class="feld"><span>Beginn</span><input type="text" inputmode="numeric" maxlength="5" placeholder="18:00" data-f="angebot" data-k="beginn" value="${esc(f.beginn)}"></label>
            <label class="feld"><span>Dauer in Stunden</span><input type="text" inputmode="decimal" data-f="angebot" data-k="stunden" value="${esc(zahlZeigen(f.stunden))}"></label>
            <label class="feld"><span>Anfahrt, km hin und zurück</span><input type="text" inputmode="numeric" data-f="angebot" data-k="km" value="${esc(zahlZeigen(f.km))}"></label>
          </div>
          ${g && g.mindest && +f.stunden < g.mindest ? `<p class="an-tipp">Deine Preisliste nennt mindestens ${g.mindest === 1 ? 'eine Stunde' : g.mindest + ' Stunden'}.</p>` : ''}
        </fieldset>
        <fieldset class="an-gr"><legend>Was du übernimmst</legend>
          ${leist.map(p => `<label class="an-haken"><input type="checkbox" data-f="angebot" data-leistung="${esc(p.k)}"${(f.leistungen || []).includes(p.k) ? ' checked' : ''}><span><b>${esc(duIhr(p.t, mehrere(a)))}</b><small>${esc(duIhr(p.s, mehrere(a)))}</small></span><em>${esc(preisText(p))}</em></label>`).join('')}
        </fieldset>
        <fieldset class="an-gr"><legend>Zusätze</legend>
          ${zus.map(p => { const an = f.zusaetze && f.zusaetze[p.k] != null; return `<label class="an-haken"><input type="checkbox" data-f="angebot" data-zusatz="${esc(p.k)}"${an ? ' checked' : ''}><span><b>${esc(duIhr(p.t, mehrere(a)))}</b><small>${esc(duIhr(p.s, mehrere(a)))}</small></span><em>${esc(preisText(p))}</em>${p.einheit === 'Stunde' && an ? `<input class="an-menge" type="text" inputmode="decimal" aria-label="Stunden" data-f="angebot" data-menge="${esc(p.k)}" value="${esc(zahlZeigen(f.zusaetze[p.k]))}">` : ''}</label>`; }).join('')}
        </fieldset>
        <fieldset class="an-gr"><legend>Bedingungen</legend>
          <div class="an-zeile3">
            <label class="feld"><span>Anzahlung in %</span><input type="text" inputmode="decimal" data-f="angebot" data-k="anzahlung" value="${esc(zahlZeigen(f.anzahlung))}"></label>
            <label class="feld an-zeile3__2"><span>Gültig bis</span><input type="date" data-f="angebot" data-k="gueltig_bis" value="${esc(f.gueltig_bis)}"></label>
          </div>
          <label class="feld"><span>Persönliche Zeile</span><textarea rows="3" maxlength="400" data-f="angebot" data-k="zeile">${esc(f.zeile)}</textarea></label>
        </fieldset>
        <div class="an-summe platte"><div><span class="an-vers">Gesamt</span><b id="an-summe">${esc(geld(r.summe))}</b></div><div><span class="an-vers">Anzahlung</span><b id="an-anz">${esc(geld(r.anzahlung_betrag))}</b></div>
          <p>${bsp ? `Die Preise sind Beispiele. Trag in der <button class="link" type="button" data-gehe="preise">Preisliste</button> deine eigenen ein, dann rechnet das Angebot mit ihnen.` : `Gerechnet mit deiner Preisliste.${af ? ' Anfahrt ab ' + (af.frei || 0) + ' km.' : ''}`}</p></div>
      </div>
      <div class="an-blatt"><div class="an-blatt__s" id="an-blatt">${window.ANGEBOT_BLATT(blattDaten(a, f))}</div></div>
    </div>
    <div class="re-post__unten">
      <aside class="re-notiz">
        <span class="mono">Vor dem Senden</span>
        <b>${bsp ? 'Noch mit Beispielpreisen' : S.offen.has('angebot:' + a.id) ? 'Noch nicht gespeichert' : gesendet ? 'Diese Fassung ist raus' : 'Das Angebot steht'}</b>
        <p>${bsp ? 'Bevor ein Angebot an einen Gastgeber geht, gehören deine eigenen Preise in die Preisliste.' : 'Sichere es als PDF und häng es an deine Antwort. Danach hier als gesendet vermerken.'}</p>
        <ul>${l.length ? l.slice().reverse().map(x => `<li>Fassung ${x.nr}: ${esc(geld(x.summe))}${x.gesendet ? ', gesendet ' + esc(zeitKurz(x.gesendet)) : ', Entwurf'}</li>`).join('') : '<li>Noch keine Fassung gesichert.</li>'}</ul>
      </aside>
      <div class="re-post__kn">
        <button class="kn kn--gold" type="button" data-akt="pdf">Als PDF speichern<i>${SYM.pdf}</i></button>
        ${gesendet && !S.offen.has('angebot:' + a.id) ? '' : `<button class="kn" type="button" data-akt="angebot-gesendet">Als gesendet vermerken<i>${SYM.post}</i></button>`}
        <button class="link" type="button" data-akt="angebot-antwort">Antwort zum Angebot schreiben</button>
        <p class="re-hinweis">Das Blatt hier ist das PDF, Seite für Seite gleich. «Speichern» unten sichert die Fassung beim Abend; eine gesendete Fassung bleibt, wie sie war, und jede Änderung wird eine neue. Frühere Fassungen holst du oben mit einem Klick zurück.</p>
      </div>
    </div>`;
}
function blattEinpassen() {   // alle Seiten des Blatts, skaliert mit transform (nie angeschnitten)
  const w = $('.an-blatt'), s = $('#an-blatt'); if (!w || !s) return;
  const k = Math.min(1, w.clientWidth / 794), e = window.ANGEBOT_EINPASSEN(s), n = Math.max(1, e.seiten || 1);
  s.style.transform = `scale(${k})`; s.style.height = (n * 1123 + (n - 1) * 24) + 'px'; w.style.height = Math.ceil((n * 1123 + (n - 1) * 24) * k) + 'px';
  w.dataset.seiten = n;
  /* Passt ein Baustein nicht einmal auf eine eigene Seite, sagt es das Werkzeug, statt still zu schneiden (Prüfung 2, N4); PDF und Druck warten dann */
  S.blattUeber = !!e.ueberlauf; let h = $('#an-ueber');
  if (S.blattUeber && !h) { h = document.createElement('p'); h.id = 'an-ueber'; h.className = 'an-falsch an-ueber'; w.parentNode.insertBefore(h, w); }
  if (h) { h.textContent = S.blattUeber ? 'Ein Feld ist zu lang fürs Blatt und würde abgeschnitten. Kürze die persönliche Zeile oder einen Posten.' : ''; h.hidden = !S.blattUeber; }
}
addEventListener('resize', () => { blattEinpassen(); });
function nachDetail() {
  const a = abend(S.wahl); if (!a) return;
  const t = $('#a-text'); if (t) { const hoch = () => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 4 + 'px'; }; hoch(); t.addEventListener('input', hoch); }
  const be = $('#a-betreff');
  if (be) { const hoch = () => { be.style.height = 'auto'; be.style.height = be.scrollHeight + 'px'; }; be.addEventListener('keydown', ev => { if (ev.key === 'Enter') ev.preventDefault(); }); be.addEventListener('input', hoch); hoch(); }
  blattEinpassen();
  if (document.fonts) document.fonts.ready.then(blattEinpassen);
}
/* Eingaben im Detail: warten gelb, bis gespeichert (R10) */
/* Zahlen lesen wie geschrieben (Prüfung 05.11.2026, Punkt 4): «6,5» = 6,5; «1.200» = 1200; «1.200,50» = 1200,5; Wörter und Leeres sind keine Zahl */
function zahlLesen(t) {
  t = String(t == null ? '' : t).trim().replace(/\s|€|%|km/g, '');
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) return +t.replace(/\./g, '').replace(',', '.');
  if (/^-?\d+(,\d+)?$/.test(t)) return +t.replace(',', '.');
  if (/^-?\d+\.\d{1,2}$/.test(t)) return +t;
  return NaN;
}
const zahlZeigen = x => x === '' || x == null ? '' : String(x).replace('.', ',');
const UHR = /^([01]?\d|2[0-3]):[0-5]\d$/;
const REGEL = { stunden: [1, 16, 'Zwischen 1 und 16 Stunden, halbe Stunden mit Komma (6,5).'], km: [0, 900, 'Ganze Kilometer zwischen 0 und 900, ohne Komma.', true], anzahlung: [0, 100, 'Ganze Prozent zwischen 0 und 100, ohne Komma.', true],
  gueltig_tage: [1, 90, 'Ganze Tage zwischen 1 und 90, ohne Komma.', true], menge: [0.5, 12, 'Zwischen 0,5 und 12 Stunden, in halben Stunden.'] };
/* Ein Feld prüfen: falsch → rot mit Satz darunter, der Wert geht nicht ins Angebot */
function pruefeFeld(el, k) {
  let wert = el.value, satz = '';
  if (k === 'beginn') { wert = wert.trim().replace('.', ':'); if (/^\d{1,2}$/.test(wert)) wert += ':00'; if (!UHR.test(wert)) satz = 'Eine Uhrzeit wie 18:00.'; else wert = wert.padStart(5, '0'); }
  else if (REGEL[k]) { const [mi, ma, t, ganz] = REGEL[k], z = zahlLesen(wert); if (isNaN(z) || z < mi || z > ma || (ganz && z % 1) || (!ganz && (z * 2) % 1)) satz = t; else wert = z; }
  else if (k === 'gueltig_bis') { if (!/^\d{4}-\d{2}-\d{2}$/.test(wert)) satz = 'Bitte ein Datum wählen.'; }
  el.classList.toggle('falsch', !!satz); el.setAttribute('aria-invalid', satz ? 'true' : 'false');
  const f = el.closest('.feld, .an-haken'); let h = f && f.querySelector('.an-falsch');
  if (satz && f && !h) { h = document.createElement('small'); h.className = 'an-falsch'; f.appendChild(h); }
  if (h) { h.textContent = satz; h.hidden = !satz; }
  return satz ? undefined : wert;
}
/* Gleich wie vorher = keine Änderung (R10, Prüfung 05.11.2026, Punkt 6): offen ist nur, was sich vom gespeicherten Stand unterscheidet */
const FKEYS = ['nr', 'beginn', 'stunden', 'km', 'leistungen', 'zusaetze', 'anzahlung', 'gueltig_bis', 'zeile'];
const ordne = x => x && typeof x === 'object' && !Array.isArray(x) ? Object.keys(x).sort().reduce((o, k) => (o[k] = x[k], o), {}) : x;
const gleichForm = (f, g) => !!g && FKEYS.every(k => JSON.stringify(ordne(f[k] == null ? '' : f[k])) === JSON.stringify(ordne(g[k] == null ? '' : g[k])));
const gleichAntw = (e, g) => !!g && e.vorlage === g.vorlage && e.betreff === g.betreff && e.text === g.text;
const gleichEinst = (e, g) => !!g && Object.keys(e).every(k => k === 'beispiel' || JSON.stringify(e[k]) === JSON.stringify(g[k]));
/* Namen und Werte der Felder für Konflikt- und Quittungssätze */
const FELDER = FKEYS.filter(k => k !== 'nr');
const FELD_NAME = { beginn: 'Beginn', stunden: 'Dauer', km: 'Anfahrt', leistungen: 'Leistungen', zusaetze: 'Zusätze', anzahlung: 'Anzahlung', gueltig_bis: 'Gültig bis', zeile: 'Persönliche Zeile' };
const kurz = (t, n) => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1).replace(/\s\S*$/, '') + ' …' : t; };
/* Ein Text, den zwei Fenster verschieden geändert haben (Prüfung 3, N7): gleicher Anfang und gleiches Ende fallen weg (an Wortgrenzen),
   übrig bleibt, was dort an dieser Stelle steht und was bei dir. Die Meldung nennt genau diesen Teil, nie nur den Anfang des ganzen Texts. */
function textTeile(dort, hier, satz) {   // satz: bis an die Satzgrenzen (Meldung: auch nach Doppelpunkt; 'ganz' für «Beides behalten»: nur nach . ! ? … und Zeilenende)
  dort = String(dort == null ? '' : dort); hier = String(hier == null ? '' : hier);
  const n = Math.min(dort.length, hier.length), wort = c => c != null && /\S/.test(c); let a = 0, e = 0;
  while (a < n && dort[a] === hier[a]) a++;
  while (e < n - a && dort[dort.length - 1 - e] === hier[hier.length - 1 - e]) e++;
  while (a > 0 && wort(dort[a - 1]) && (wort(dort[a]) || wort(hier[a]))) a--;
  while (e > 0 && wort(dort[dort.length - e]) && (wort(dort[dort.length - e - 1]) || wort(hier[hier.length - e - 1]))) e--;
  if (satz) {
    const start = satz === 'ganz' ? /[.!?…]/ : /[.!?…:]/;
    while (a > 0 && dort[a - 1] !== '\n' && !(/\s/.test(dort[a - 1]) && start.test(dort[a - 2] || ''))) a--;
    const ende = k => k >= dort.length || dort[k] === '\n' || (/[.!?…]/.test(dort[k - 1] || '') && /\s/.test(dort[k]));
    while (e > 0 && !ende(dort.length - e)) e--;
  }
  return { anfang: dort.slice(0, a), dort: dort.slice(a, dort.length - e), hier: hier.slice(a, hier.length - e), ende: dort.slice(dort.length - e) };
}
const zitat = t => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > 600 ? t.slice(0, 290).replace(/\s\S*$/, '') + ' … ' + t.slice(-290).replace(/^\S*\s/, '') : t; };
function textDort(name, dort, hier) {
  if (!String(dort == null ? '' : dort).trim()) return name + ' ist dort leer';
  const t = textTeile(dort, hier, true), d = zitat(t.dort), h = zitat(t.hier);
  return d ? name + ' lautet dort an dieser Stelle «' + d + '»' + (h ? ', bei dir «' + h + '»' : '') : name + ' ist dort kürzer, es fehlt «' + h + '»';
}
/* «Beides behalten»: deine Änderung und die von dort, jede gegen den Text, von dem beide Fenster ausgingen (basis).
   Liegen sie in verschiedenen Wörtern, kommen beide an ihre Stelle. Berühren sie dasselbe Wort oder denselben Satz, wird nur an Satzgrenzen geschnitten:
   dein Satz, dann der von dort, jeder ganz; was in beiden gleich lautet, steht einmal. Nie ein halbes Wort, nie eine doppelte Satzhälfte (Prüfung 4, N8). */
function bereich(basis, neu) {
  const n = Math.min(basis.length, neu.length); let a = 0, e = 0;
  while (a < n && basis[a] === neu[a]) a++;
  while (e < n - a && basis[basis.length - 1 - e] === neu[neu.length - 1 - e]) e++;
  return { von: a, bis: basis.length - e };
}
const SATZ_ENDE = /[.!?…]/;
const satzGrenze = (t, p) => p <= 0 || p >= t.length || t[p - 1] === '\n' || t[p] === '\n' || (SATZ_ENDE.test(t[p - 1]) && /\s/.test(t[p])) || (/\s/.test(t[p - 1]) && SATZ_ENDE.test(t[p - 2] || ''));
function beidesText(dort, hier, basis) {
  dort = String(dort == null ? '' : dort); hier = String(hier == null ? '' : hier);
  if (dort === hier || !dort.trim()) return hier; if (!hier.trim()) return dort;
  const saetze = (d, h, vor, nach) => { const t = textTeile(d, h, 'ganz'); if (!t.dort.trim()) return h; if (!t.hier.trim()) return d;   // gleiche Sätze vorn und hinten einmal, dazwischen deiner, dann der von dort
    const x = t.hier.replace(/\s+$/, ''), y = t.dort.replace(/^\s+/, ''), links = (vor || '') + t.anfang, rechts = t.ende + (nach || '');
    const zeile = /\n/.test(dort + hier) && (!links || /\n$/.test(links)) && (!rechts || /^\n/.test(rechts));   // ganze Zeilen geändert: jede auf ihrer Zeile, sonst im Absatz mit Leerzeichen
    return t.anfang + x + (!x || !y ? '' : zeile ? '\n' : ' ') + y + t.ende; };
  if (typeof basis !== 'string' || !basis.trim()) return saetze(dort, hier);   // ohne Ausgangstext: ganze Sätze nebeneinander
  if (basis === dort) return hier; if (basis === hier) return dort;          // nur ein Fenster hat geändert
  const wort = r => { while (r.von > 0 && /\S/.test(basis[r.von - 1])) r.von--; while (r.bis < basis.length && /\S/.test(basis[r.bis])) r.bis++; return r; };
  const m = wort(bereich(basis, hier)), d = wort(bereich(basis, dort)), stueck = (t, von, bis) => t.slice(von, t.length - (basis.length - bis));
  if (m.bis <= d.von && m.von < d.von) return basis.slice(0, m.von) + stueck(hier, m.von, m.bis) + basis.slice(m.bis, d.von) + stueck(dort, d.von, d.bis) + basis.slice(d.bis);
  if (d.bis <= m.von && d.von < m.von) return basis.slice(0, d.von) + stueck(dort, d.von, d.bis) + basis.slice(d.bis, m.von) + stueck(hier, m.von, m.bis) + basis.slice(m.bis);
  let von = Math.min(m.von, d.von), bis = Math.max(m.bis, d.bis);   // dieselbe Stelle: auf ganze Sätze des Ausgangstexts erweitern
  while (!satzGrenze(basis, von)) von--; while (!satzGrenze(basis, bis)) bis++;
  return basis.slice(0, von) + saetze(stueck(dort, von, bis), stueck(hier, von, bis), basis.slice(0, von), basis.slice(bis)) + basis.slice(bis);
}
function feldText(k, v) {
  if (k === 'stunden') return zahlZeigen(v) + (+v === 1 ? ' Stunde' : ' Stunden'); if (k === 'km') return zahlZeigen(v) + ' km'; if (k === 'anzahlung') return zahlZeigen(v) + ' %';
  if (k === 'beginn') return (v || '') + ' Uhr'; if (k === 'gueltig_bis') return tagKurz(v) || 'offen'; if (k === 'zeile') return '«' + kurz(v, 50) + '»';
  if (k === 'leistungen') return (v || []).map(x => duIhr((posten(x) || {}).t || x)).join(', ') || 'keine';
  if (k === 'zusaetze') return Object.keys(v || {}).map(x => duIhr((posten(x) || {}).t || x)).join(', ') || 'keine';
  return String(v == null ? '' : v);
}
const EINST_TEXT = ['unterschrift', 'zeile', 'fuss'];
const EINST_NAME = { gueltig_tage: 'Gültigkeit', anzahlung: 'Anzahlung', beginn: 'Beginn', stunden: 'Dauer', ust: 'Umsatzsteuer', unterschrift: 'Unterschrift', unterschrift_bild: 'Unterschrift als Bild', zeile: 'Persönliche Zeile', fuss: 'Fusszeile' };
function einstText(k, v) {
  if (k === 'gueltig_tage') return zahlZeigen(v) + (+v === 1 ? ' Tag' : ' Tage'); if (k === 'anzahlung') return zahlZeigen(v) + ' %'; if (k === 'stunden') return zahlZeigen(v) + (+v === 1 ? ' Stunde' : ' Stunden');
  if (k === 'beginn') return (v || '') + ' Uhr'; if (k === 'ust') return { offen: 'noch offen', klein: 'ohne USt.', brutto: 'mit 19 % USt.' }[v] || v; if (k === 'unterschrift_bild') return v ? 'einem anderen Bild' : 'keinem Bild';
  return '«' + kurz(v, 50) + '»';
}
/* Hinweis unter Zeilenfeldern: Emojis lässt das Blatt weg; mehr als n Zeilen rücken im Blatt in die letzte Zeile (Prüfung 2, N4) */
function zeilenHinweis(el, n) {
  const h = el.closest('.feld'); if (!h) return; let x = h.querySelector('.an-falsch');
  const emo = window.ANGEBOT_OHNE_EMOJI(el.value) !== el.value, lang = el.value.replace(/\s+$/, '').split('\n').length > n;
  const t = [emo ? 'Emojis lässt das Angebot weg, im Blatt und im PDF.' : '', lang ? 'Das Blatt zeigt höchstens ' + (n === 6 ? 'sechs' : 'vier') + ' Zeilen, der Rest rückt in die letzte Zeile.' : ''].filter(Boolean).join(' ');
  if (t && !x) { x = document.createElement('small'); x.className = 'an-falsch'; h.appendChild(x); }
  if (x) { x.textContent = t; x.hidden = !t; }
}
function merke(key, offen) { if (offen) S.offen.add(key); else S.offen.delete(key); leiste(); }
function eingabe(el) {
  const a = abend(S.wahl);
  if (el.id === 'e-such') { S.such = el.value; zeichneListe(); return; }
  if (el.id === 'e-anlass') { S.anlass = el.value; return zeichne(); }
  if (el.id === 'e-monat') { S.monat = el.value; return zeichne(); }
  if (el.dataset.f === 'antwort' && a) {
    const e = antwortEntwurf(a);
    if (el.id === 'a-vorlage') {
      const v = vorlage(el.value), r = fuellWerte(a);
      if (v) { e.vorlage = v.k; e.betreff = fuelle(v.betreff, a, r); e.text = fuelle(v.text, a, r); }
      merke('antwort:' + a.id, !gleichAntw(e, S.antwBasis[a.id])); ruhigTauschen($('#detail'), detail(a)); nachDetail(); return;
    }
    e.betreff = $('#a-betreff').value; e.text = $('#a-text').value;
    merke('antwort:' + a.id, !gleichAntw(e, S.antwBasis[a.id])); return;
  }
  if (el.dataset.f === 'angebot' && a) {
    const f = formVon(a);
    if (el.dataset.k === 'zeile') zeilenHinweis(el, 6);
    if (el.dataset.k) { const w = el.dataset.k === 'zeile' ? el.value : pruefeFeld(el, el.dataset.k); if (w === undefined) { leiste(); return; } f[el.dataset.k] = w; }
    if (el.dataset.leistung) { const k = el.dataset.leistung; f.leistungen = (f.leistungen || []).filter(x => x !== k); if (el.checked) f.leistungen = (S.preise.posten || []).filter(p => p.gruppe === 'leistung' && (p.k === k || f.leistungen.includes(p.k))).map(p => p.k); }
    if (el.dataset.zusatz) { f.zusaetze = f.zusaetze || {}; if (el.checked) f.zusaetze[el.dataset.zusatz] = (posten(el.dataset.zusatz) || {}).einheit === 'Stunde' ? 2 : 1; else delete f.zusaetze[el.dataset.zusatz]; }
    if (el.dataset.menge) { const w = pruefeFeld(el, 'menge'); if (w === undefined) { leiste(); return; } f.zusaetze[el.dataset.menge] = w; }
    merke('angebot:' + a.id, !gleichForm(f, S.formBasis[a.id]));
    if (el.dataset.zusatz) { ruhigTauschen($('#detail'), detail(a)); nachDetail(); return; }
    const r = rechne(f, a); $('#an-summe').textContent = geld(r.summe); $('#an-anz').textContent = geld(r.anzahlung_betrag);
    $('#an-blatt').innerHTML = window.ANGEBOT_BLATT(blattDaten(a, f)); blattEinpassen();
    return;
  }
  if (el.dataset.f === 'einst') {
    if (!S.einstForm) { S.einstForm = klon(S.einst); S.einstBasis = klon(S.einst); }
    const k = el.dataset.k, w = el.dataset.zahl || k === 'beginn' ? pruefeFeld(el, k) : el.value;
    if (w === undefined) { leiste(); return; }
    if (k === 'zeile' || k === 'unterschrift') zeilenHinweis(el, k === 'zeile' ? 6 : 4);
    S.einstForm[k] = w;
    merke('einst', !gleichEinst(S.einstForm, S.einstBasis)); return;
  }
}
function zeichneListe() {
  const l = gefiltert(), el = $('#e-liste'); if (!el) return;
  let n = 0, vor = '';
  const tage = []; l.forEach(x => { const t = tagVon(x.eingang); const g = tage.find(y => y.t === t); g ? g.l.push(x) : tage.push({ t, l: [x] }); });
  el.innerHTML = tage.map(g => `<p class="re-tag"><span>${esc(g.t === 'Heute' || g.t === 'Gestern' || g.t === 'Früher' ? g.t + ' angefragt' : g.t)}</span></p>${g.l.map(x => { const h = karteAbend(x, n++, vor); vor = bildVon(x, vor); return h; }).join('')}`).join('')
    || `<div class="re-leer platte">${ZEICHEN}<b>Nichts gefunden.</b><p>Kein Abend passt zu «${esc(S.such)}».</p><button class="link" type="button" data-akt="filter-weg">Auswahl zurücksetzen</button></div>`;
}

/* ---------- Speichern (R09/R10/R11): alles Offene in einem Schritt, Quittung mit Rückgängig ---------- */
let speichertGerade = false;
async function speichern() {
  if (speichertGerade) return false;
  if ($('#ansicht .falsch')) { quit('Erst berichtigen', 'Ein Feld ist rot markiert. Darunter steht, was es braucht. Gespeichert ist noch nichts.', [], true, 6000); return false; }
  if (!S.offen.size) { quit('Nichts geändert, nichts gespeichert.', '', [], false, 3000); return false; }
  speichertGerade = true;
  const was = [], zurueck = [];
  try {
    for (const key of [...S.offen]) {
      const [art, id] = key.split(':');
      if (art === 'antwort') {
        const a = abend(id), e = S.antw[id]; if (!a || !e) { S.offen.delete(key); continue; }
        let entwurf = { vorlage: e.vorlage, betreff: e.betreff, text: e.text }, fremd = [];
        const r = await teilAendern('angebot', id, A => {
          A = A || {}; const srv = A.entwurf_antwort ? { vorlage: A.entwurf_antwort.vorlage, betreff: A.entwurf_antwort.betreff, text: A.entwurf_antwort.text } : null;
          if (J(srv) !== S.antwServer[id] && !gleichAntw(entwurf, srv)) {   // das andere Fenster hat für diesen Abend etwas anderes gespeichert
            const basis = JSON.parse(S.antwServer[id] || 'null');
            if (!srv) { S.antwServer[id] = J(srv); throw kollision(`Ein anderes Fenster hat den Antwort-Entwurf für ${a.gastgeber.name} inzwischen gesendet oder verworfen. Deine Eingabe ist noch da. Speicherst du noch einmal, gilt deine.`); }
            /* Feld für Feld (Prüfung 3, N7): was nur dort geändert ist, kommt zu dir; was beide geändert haben, nennt die Meldung Wort für Wort */
            const m = dreiWege(entwurf, basis || {}, srv, ['vorlage', 'betreff', 'text']), kol = m.kollidiert.filter(k => k !== 'vorlage');
            if (kol.length) {
              const ausgang = (S.antwBasis[id] || basis || {}).text;
              Object.assign(e, m.wert); S.antwServer[id] = J(srv);
              const mein = { ...e };
              throw kollision(`Ein anderes Fenster hat den Antwort-Entwurf für ${a.gastgeber.name} auch geändert. ${kol.map(k => textDort(k === 'text' ? 'Der Text' : 'Der Betreff', srv[k], mein[k])).join('. ')}. Deine Eingabe ist noch da. «Beides behalten» setzt den Teil von dort in deinen Text; speicherst du so noch einmal, gilt deine.`,
                kol.includes('text') ? [['Beides behalten', () => { const x = S.antw[id]; if (!x) return; x.text = beidesText(srv.text, x.text, ausgang); merke('antwort:' + id, true); if (S.wahl === id) zeigDetail(id); }]] : null);
            }
            fremd = m.fremd.filter(k => k !== 'vorlage').map(k => k === 'text' ? 'Text' : 'Betreff');
            entwurf = { ...m.wert };
          }
          return { ...A, entwurf_antwort: { ...entwurf, zeit: jetztIso() } };
        }, 'Antwort-Entwurf ' + id);
        zurueck.push(['angebot', id, r.alt]);
        Object.assign(e, entwurf); S.antwBasis[id] = { ...entwurf }; S.antwServer[id] = J(entwurf); was.push('Antwort an ' + vorname(a.gastgeber.name));
        if (fremd.length) was.push('Aus dem anderen Fenster übernommen: ' + fremd.join(', '));
      } else if (art === 'angebot') {
        const a = abend(id), f0 = S.form[id], basis = S.formBasis[id]; if (!a || !f0) { S.offen.delete(key); continue; }
        let x, fremd = [];
        const r = await teilAendern('angebot', id, A => {
          A = A || {}; const l = A.fassungen = A.fassungen || [], f = S.form[id];
          let srv = l.find(y => y.nr === basis.nr) || basis, ziel = basis.nr;
          if (srv.gesendet && A.aktuell !== basis.nr) { const n = l.find(y => y.nr === A.aktuell && !y.gesendet && y.nr > basis.nr); if (n) { srv = n; ziel = n.nr; } }   // das andere Fenster hat aus der gesendeten Fassung schon die nächste gemacht
          const m = dreiWege(f, basis, srv, FELDER);
          if (m.kollidiert.length) {   // beide Fenster haben dasselbe Feld verschieden geändert: neuen Stand zeigen, deine Werte dort stehen lassen, nichts speichern
            const ausgang = basis.zeile;
            S.form[id] = { ...klon(srv), ...m.wert }; S.formBasis[id] = klon(srv);
            throw kollision(`Ein anderes Fenster hat das Angebot für ${a.gastgeber.name} auch geändert: ${m.kollidiert.map(k => k === 'zeile' ? textDort('die persönliche Zeile', srv.zeile, f.zeile) : FELD_NAME[k] + ' steht dort auf ' + feldText(k, srv[k])).join(', ')}. Alles andere aus dem anderen Fenster steht jetzt bei dir. Deine Eingabe ist noch da; speicherst du noch einmal, gilt deine.`,
              m.kollidiert.includes('zeile') ? [['Beides behalten', () => { const g = S.form[id]; if (!g) return; g.zeile = beidesText(srv.zeile, g.zeile, ausgang); merke('angebot:' + id, true); if (S.wahl === id) zeigDetail(id); }]] : null);
          }
          fremd = m.fremd.map(k => FELD_NAME[k] + ' ' + feldText(k, srv[k]));
          x = { ...klon(f), ...m.wert, nr: ziel, gesendet: srv.gesendet || null };
          const i = l.findIndex(y => y.nr === x.nr);
          if (i >= 0 && l[i].gesendet) x = { ...x, nr: l.reduce((mx, y) => Math.max(mx, y.nr), 0) + 1, gesendet: null };
          Object.assign(x, rechne(x, a), { zeit: jetztIso(), preise_beispiel: preiseBeispiel() });
          const j = l.findIndex(y => y.nr === x.nr); if (j >= 0) l[j] = x; else l.push(x);
          A.aktuell = x.nr; A.verlauf = (A.verlauf || []).concat({ zeit: jetztIso(), was: `Angebot, Fassung ${x.nr}, gespeichert (${geld(x.summe)})` });
          return A;
        }, 'Angebot Fassung ' + (f0.nr) + ' ' + id);
        zurueck.push(['angebot', id, r.alt]);
        S.form[id] = klon(x); S.formBasis[id] = klon(x); was.push('Angebot für ' + vorname(a.gastgeber.name) + ', Fassung ' + x.nr);
        if (fremd.length) was.push('Aus dem anderen Fenster übernommen: ' + fremd.join(', '));
      } else if (art === 'einst') {
        let fremd = [];
        const r = await sammlungAendern('einstellungen', E => {
          const keys = [...new Set(Object.keys(S.einstForm).concat(Object.keys(E)))].filter(k => k !== 'beispiel'), m = dreiWege(S.einstForm, S.einstBasis, E, keys);
          if (m.kollidiert.length) {
            const ausgang = klon(S.einstBasis || {});
            S.einstForm = { ...klon(E), ...m.wert }; S.einstBasis = klon(E);
            const texte = m.kollidiert.filter(k => EINST_TEXT.includes(k)), mein = S.einstForm;
            throw kollision(`Ein anderes Fenster hat die Einstellungen auch geändert: ${m.kollidiert.map(k => EINST_TEXT.includes(k) ? textDort(EINST_NAME[k], E[k], mein[k]) : (EINST_NAME[k] || k) + ' steht dort auf ' + einstText(k, E[k])).join(', ')}. Alles andere aus dem anderen Fenster steht jetzt bei dir. Deine Eingabe ist noch da; speicherst du noch einmal, gilt deine.`,
              texte.length ? [['Beides behalten', () => { if (!S.einstForm) return; texte.forEach(k => { S.einstForm[k] = beidesText(E[k], S.einstForm[k], ausgang[k]); }); merke('einst', true); if (S.ansicht === 'einstellungen') zeichne(); }]] : null);
          }
          fremd = m.fremd.map(k => (EINST_NAME[k] || k) + ' ' + einstText(k, E[k]));
          return { ...klon(E), ...m.wert, beispiel: false };
        }, 'Einstellungen gespeichert');
        zurueck.push(['sammlung', 'einstellungen', r.alt]);
        S.einstForm = null; S.einstBasis = null; was.push('Einstellungen');
        if (fremd.length) was.push('Aus dem anderen Fenster übernommen: ' + fremd.join(', '));
      }
      S.offen.delete(key);
    }
  } catch (e) { speichertGerade = false; if (e.kollision) konflikt(); else leiste(); fehler(e); return false; }
  speichertGerade = false;
  leiste(); fertigZeigen();
  if (S.ansicht === 'eingang' && abend(S.wahl)) { ruhigTauschen($('#detail'), detail(abend(S.wahl))); nachDetail(); }
  else if (S.ansicht === 'einstellungen') zeichne();
  quittung('Gespeichert', was, zurueck);
  return true;
}
function fertigZeigen() {
  const b = $('#l-sp'); if (!b) return;
  b.classList.remove('wo-kn--glas', 'wo-kn--wartet'); b.classList.add('wo-kn--fertig'); b.querySelector('span').textContent = 'Gespeichert';
  setTimeout(() => { if (!S.offen.size) leiste(); }, 2600);
}
function quittung(titel, was, zurueck) {
  const text = was.slice(0, 3).join(' · ') + (was.length > 3 ? ' und ' + (was.length - 3) + ' weitere' : '');
  quit(titel, text, zurueck.length ? [['Rückgängig', async () => {
    try {
      for (const [art, id, alt] of zurueck.slice().reverse()) {
        if (art === 'sammlung') await sammlungSchreiben(id, alt, 'Rückgängig gemacht');
        else if (art === 'kern') await teilSchreiben('kern', id, alt, 'Rückgängig');
        else await teilSchreiben(art, id, alt, 'Rückgängig');
      }
      S.form = {}; S.antw = {}; S.formBasis = {}; S.antwBasis = {}; rand(); leiste(); zeichne(); quit('Rückgängig gemacht', 'Der Stand davor ist wieder da.', [], false, 4000);
    } catch (e) { fehler(e); }
  }]] : []);
}

/* ---------- Aktionen ---------- */
async function aktion(akt, b) {
  const a = abend(S.wahl);
  try {
    if (akt === 'neu-anfrage') return neueAnfrage();
    if (akt === 'filter-weg') { S.such = ''; S.anlass = ''; S.monat = ''; S.station = 'alle'; return zeichne(); }
    if (akt === 'reiter-antwort' || akt === 'reiter-angebot') { S.reiter = akt.slice(7); try { sessionStorage.setItem('an-reiter', S.reiter); } catch (e) { /* */ } ruhigTauschen($('#detail'), detail(a)); return nachDetail(); }
    if (!a && !/^(bst|pr|ver|einst)/.test(akt)) return;
    if (akt === 'kopieren') {
      const e = antwortEntwurf(a);
      try { await navigator.clipboard.writeText('Betreff: ' + e.betreff + '\n\n' + e.text); } catch (x) { return quit('Nicht kopiert', 'Der Browser hat die Zwischenablage nicht freigegeben. Markier den Text und kopier ihn von Hand.', [], true); }
      return quit('Kopiert', 'Betreff und Antwort liegen in der Zwischenablage. Füg sie in dein Postfach oder bei Instagram ein.', [], false, 5000);
    }
    if (akt === 'neu-fuellen') {
      const e = antwortEntwurf(a), v = vorlage(e.vorlage), r = fuellWerte(a);
      if (v) { e.betreff = fuelle(v.betreff, a, r); e.text = fuelle(v.text, a, r); merke('antwort:' + a.id, !gleichAntw(e, S.antwBasis[a.id])); ruhigTauschen($('#detail'), detail(a)); nachDetail(); }
      return;
    }
    if (akt === 'gesendet') {
      const e = antwortEntwurf(a);
      if (OFFEN_STELLE.test(e.betreff + '\n' + e.text)) return quit('Noch offen', 'In der Antwort stehen noch Stellen in [eckigen] oder {geschweiften} Klammern. Füll sie aus, dann vermerk sie als gesendet.', [], true, 6000);
      const v = vorlage(e.vorlage) || {}, jetzt = jetztIso();
      const r = await teilAendern('angebot', a.id, A => {
        A = A || {};
        if ((A.antworten || []).some(x => x.gesendet && x.text === e.text && x.betreff === e.betreff)) throw kollision('Genau diese Antwort hat ein anderes Fenster schon als gesendet vermerkt.');
        A.antworten = (A.antworten || []).concat({ vorlage: e.vorlage, t: v.t || 'Antwort', betreff: e.betreff, text: e.text, zeit: jetzt, gesendet: jetzt });
        A.verlauf = (A.verlauf || []).concat({ zeit: jetzt, was: `Antwort «${v.t || 'Antwort'}» als gesendet vermerkt` }); delete A.entwurf_antwort;
        return A;
      }, 'Antwort gesendet ' + a.id);
      delete S.antw[a.id]; S.offen.delete('antwort:' + a.id); rand(); leiste(); zeigDetail(a.id);
      return quittung('Als gesendet vermerkt', ['Antwort «' + (v.t || 'Antwort') + '» an ' + a.gastgeber.name], [['angebot', a.id, r.alt]]);
    }
    if (akt === 'fassung') {
      const nr = +b.dataset.nr, f = (ang(a).fassungen || []).find(x => x.nr === nr); if (!f) return;
      S.form[a.id] = klon(f); S.formBasis[a.id] = klon(f); S.offen.delete('angebot:' + a.id);
      if (ang(a).aktuell !== nr) {
        const r = await teilAendern('angebot', a.id, A => {
          if (!A || !(A.fassungen || []).some(x => x.nr === nr)) throw kollision('Diese Fassung gibt es im neuen Stand nicht mehr.');
          A.aktuell = nr; A.verlauf = (A.verlauf || []).concat({ zeit: jetztIso(), was: `Fassung ${nr} zurückgeholt` }); return A;
        }, 'Fassung ' + nr + ' zurückgeholt');
        S.form[a.id] = klon(aktFassung(abend(a.id))); S.formBasis[a.id] = klon(S.form[a.id]);
        quittung('Fassung ' + nr + ' zurückgeholt', ['Angebot für ' + vorname(a.gastgeber.name)], [['angebot', a.id, r.alt]]);
      }
      leiste(); return zeigDetail(a.id);
    }
    if (akt === 'fassung-neu') {
      const f = klon(formVon(a)); f.nr = (ang(a).fassungen || []).reduce((m, x) => Math.max(m, x.nr), 0) + 1; f.gesendet = null; f.zeit = '';
      S.form[a.id] = f; S.offen.add('angebot:' + a.id); leiste(); ruhigTauschen($('#detail'), detail(a)); return nachDetail();
    }
    if (akt === 'pdf') {
      const f = formVon(a);
      if ($('#ansicht .falsch')) return quit('Erst berichtigen', 'Ein Feld ist rot markiert. Darunter steht, was es braucht.', [], true, 6000);
      if (S.blattUeber) return quit('Erst kürzen', 'Ein Feld ist zu lang fürs Blatt und würde abgeschnitten. Kürze die persönliche Zeile oder einen Posten.', [], true, 6000);
      if (preiseBeispiel()) return fenster(`<h2>Noch <em>Beispielpreise.</em></h2><p>Die Beträge in diesem Angebot sind Beispiele und nicht deine Preise. Trag zuerst deine eigenen Preise ein, dann stimmt das PDF.</p>
        <div class="fenster__kn"><button class="link" type="button" id="f-trotzdem">Trotzdem als PDF</button><button class="kn kn--gold" type="button" id="f-los">Zur Preisliste<i>${PF}</i></button></div>`, true, () => { fensterZu(); gehe('preise'); }, () => { fensterZu(); pdf(a, f); });
      return pdf(a, f);
    }
    if (akt === 'angebot-gesendet') {
      /* Wie vorgeschlagen oder geändert: was im Blatt steht, wird zuerst als Fassung gesichert (Prüfung 05.11.2026, Punkt 5) */
      formVon(a);
      if (S.offen.has('angebot:' + a.id) || !aktFassung(a)) { S.offen.add('angebot:' + a.id); if (!await speichern()) return; }
      const f = aktFassung(abend(a.id)); if (!f) return;
      const los = async () => {
        fensterZu();
        const jetzt = jetztIso(); let x;
        const r = await teilAendern('angebot', a.id, A => {
          x = A && (A.fassungen || []).find(y => y.nr === f.nr);
          if (!x || !gleichForm(x, f)) throw kollision('Ein anderes Fenster hat diese Fassung inzwischen geändert. Sieh sie dir an, dann vermerk sie als gesendet.');
          if (x.gesendet) throw kollision('Ein anderes Fenster hat diese Fassung schon als gesendet vermerkt.');
          x.gesendet = jetzt; A.aktuell = x.nr; A.verlauf = (A.verlauf || []).concat({ zeit: jetzt, was: `Angebot, Fassung ${x.nr}, als gesendet vermerkt (${geld(x.summe)})` });
          return A;
        }, 'Angebot gesendet ' + a.id);
        const z = [['angebot', a.id, r.alt]], b = abend(a.id), was = ['Fassung ' + x.nr + ' an ' + a.gastgeber.name];
        if (b.status === 'anfrage') { const k = await teilAendern('kern', a.id, K => ({ ...K, status: K.status === 'anfrage' ? 'angebot' : K.status }), 'Status angebot'); z.push(['kern', a.id, k.alt]); if (k.wert.status === 'angebot') was.push('Station: Angebot raus'); }
        else was.push('Station bleibt: ' + (ST_LANG[station(b)] || b.status));
        S.form[a.id] = klon(x); S.formBasis[a.id] = klon(x); rand(); leiste(); zeigDetail(a.id);
        quittung('Angebot als gesendet vermerkt', was, z);
      };
      if (preiseBeispiel()) return fenster(`<h2>Mit <em>Beispielpreisen?</em></h2><p>Dieses Angebot rechnet noch mit Beispielpreisen. Ist es wirklich so an ${esc(a.gastgeber.name)} gegangen?</p>
        <div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gold" type="button" id="f-los">Ja, vermerken<i>${SYM.haken}</i></button></div>`, true, los);
      return los();
    }
    if (akt === 'angebot-antwort') { const e = antwortEntwurf(a), v = vorlage('angebot'), r = fuellWerte(a); if (v) { e.vorlage = 'angebot'; e.betreff = fuelle(v.betreff, a, r); e.text = fuelle(v.text, a, r); merke('antwort:' + a.id, !gleichAntw(e, S.antwBasis[a.id])); } S.reiter = 'antwort'; leiste(); ruhigTauschen($('#detail'), detail(a)); return nachDetail(); }
    if (akt === 'zusage') return zusageFenster(a);
    if (akt === 'absage') return absageFenster(a);
    if (akt === 'wieder') {
      const jetzt = jetztIso();
      const k0 = await teilAendern('kern', a.id, K => { if (K.status !== 'abgesagt') throw kollision('Ein anderes Fenster hat diesen Abend schon wieder geöffnet.'); return { ...K, status: gesendeteFassung(abend(a.id)) ? 'angebot' : 'anfrage' }; }, 'wieder geöffnet');
      const r = await teilAendern('angebot', a.id, A => { A = A || {}; A.verlauf = (A.verlauf || []).concat({ zeit: jetzt, was: 'Wieder geöffnet' + (A.absage ? ' (Absage war: ' + A.absage.grund + ')' : '') }); delete A.absage; return A; }, 'wieder geöffnet');
      S.station = 'alle'; rand(); leiste(); zeichne(); return quittung('Wieder geöffnet', [a.gastgeber.name], [['angebot', a.id, r.alt], ['kern', a.id, k0.alt]]);
    }
    if (akt === 'notizen') return notizenFenster(a);
    if (akt === 'loeschen') return loeschFenster(a);
  } catch (e) { fehler(e); }
}
async function pdf(a, f) {
  const daten = blattDaten(a, f);
  quit('Das PDF wird gesetzt', 'Das dauert einen Moment.', [], false, 15000);
  try {
    const d = await senden('api/blatt_pdf', 'POST', { daten });
    const roh = atob(d.pdf), u8 = new Uint8Array(roh.length); for (let i = 0; i < roh.length; i++) u8[i] = roh.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([u8], { type: 'application/pdf' })), l = document.createElement('a'); l.href = url; l.download = d.name; document.body.appendChild(l); l.click(); l.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    $$('#meldung .quit').forEach(q => { if (/wird gesetzt/.test(q.textContent)) q.remove(); });
    quit('PDF gesichert', d.name, [], false, 6000);
  } catch (e) {
    if (/^DRUCK · /.test(e.message || '')) { $$('#meldung .quit').forEach(q => { if (/wird gesetzt/.test(q.textContent)) q.remove(); }); return druckFenster(daten); }
    fehler(e);
  }
}
function druckFenster(daten) {   // ohne Chromium: das Druckfenster des Browsers mit demselben A4-Blatt (wie das Vorbild)
  const fr = document.createElement('iframe'); fr.style.cssText = 'position:fixed;width:0;height:0;border:0;left:-9999px';
  document.body.appendChild(fr);
  const satz = document.createElement('div'); satz.style.cssText = 'position:absolute;left:-10000px;top:0;width:794px';   // dieselben Seiten wie Vorschau und PDF (Prüfung 2: auch hier umbrechen)
  satz.innerHTML = window.ANGEBOT_BLATT(daten); document.body.appendChild(satz); window.ANGEBOT_EINPASSEN(satz); const html = satz.innerHTML; satz.remove();
  fr.srcdoc = `<!doctype html><html lang="de"><head><meta charset="utf-8"><link rel="stylesheet" href="${location.origin}/angelina-strelow/werkzeuge/assets/oberflaeche/kleid/angelina.css"><link rel="stylesheet" href="${location.origin}/angelina-strelow/werkzeuge/anfragen/blatt.css"></head><body style="margin:0">${(window.AS_DATEIEN ? window.AS_DATEIEN(html) : html).replace(/src="\//g, 'src="' + location.origin + '/')}</body></html>`;
  fr.addEventListener('load', () => { setTimeout(() => { try { fr.contentWindow.print(); } catch (e) { /* */ } setTimeout(() => fr.remove(), 4000); }, 400); }, { once: true });
  quit('Druckfenster', 'Dort «Als PDF sichern» wählen. Das Angebot steht auf A4 wie im Werkzeug.', [], false, 8000);
}

/* ---------- Fenster ---------- */
function fenster(html, schmal = false, los = null, trotzdem = null) {
  const f = $('#fenster');
  sperreLos();
  f.innerHTML = `<div class="fenster__k${schmal ? ' schmal' : ''}" role="dialog" aria-modal="true"><button class="rund fenster__zu" type="button" data-zu aria-label="Schliessen">${ZU}</button>${html}</div>`;
  f.hidden = false;
  $$('[data-zu]', f).forEach(b => b.onclick = fensterZu);
  f.onclick = e => { if (e.target === f) fensterZu(); };
  if (los && $('#f-los')) $('#f-los').onclick = () => einmal(los, $('#f-los'));
  if (trotzdem && $('#f-trotzdem')) $('#f-trotzdem').onclick = () => einmal(trotzdem, $('#f-trotzdem'));
  setTimeout(() => { const x = $('#fenster input:not([type=hidden]):not([type=checkbox]), #fenster textarea'); if (x) x.focus({ preventScroll: true }); }, 60);
}
function fensterZu() { $('#fenster').hidden = true; $('#fenster').innerHTML = ''; }
const feld = (id, t, wert = '', art = 'text', extra = '') => `<label class="feld"><span>${t}</span>${art === 'area' ? `<textarea id="${id}"${/rows=/.test(extra) ? '' : ' rows="4"'}${extra}>${esc(wert)}</textarea>` : `<input id="${id}" type="${art}" value="${esc(wert)}"${extra}>`}</label>`;
const wahl = (id, t, liste, wert) => `<label class="feld"><span>${t}</span><select class="sel" id="${id}">${liste.map(x => { const [k, n] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(k)}"${k === wert ? ' selected' : ''}>${esc(n)}</option>`; }).join('')}</select></label>`;
function neueAnfrage() {
  fenster(`<span class="mono">Telefon, Instagram, Empfehlung</span><h2>Anfrage <em>von Hand anlegen.</em></h2><p>Dieselben Felder wie das Formular auf deiner Website. Die Anfrage landet im Eingang wie jede andere.</p>
    <div class="an-f2">${wahl('n-quelle', 'Woher', [['telefon', 'Telefon'], ['instagram', 'Instagram'], ['empfehlung', 'Empfehlung'], ['kaffee', 'Kennenlernen bei einem Kaffee'], ['mail', 'E-Mail'], ['website', 'Website']], 'telefon')}${wahl('n-anlass', 'Anlass', ANLAESSE, 'Privates Dinner')}</div>
    <div class="an-f2">${feld('n-datum', 'Datum', '', 'date')}${wahl('n-gaeste', 'Gäste', GAESTE.map(g => [g, g === 'mehr' ? 'mehr als 16' : g + ' Gäste']), 'bis 10')}</div>
    ${feld('n-ort', 'Ort', '', 'text', ' placeholder="Köln"')}
    <div class="an-f2">${feld('n-name', 'Name', '', 'text', ' autocomplete="off"')}${feld('n-email', 'E-Mail', '', 'email', ' autocomplete="off"')}</div>
    ${feld('n-tel', 'Telefon (freiwillig)', '', 'text', ' autocomplete="off"')}
    ${feld('n-wunsch', 'Was möchtest du abgeben?', '', 'area', ' maxlength="2000" placeholder="Empfang, Wein, Service, den ganzen Ablauf"')}
    <p class="leise" id="n-fehl" hidden></p>
    <div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gold" type="button" id="f-los">Anfrage anlegen<i>${SYM.haken}</i></button></div>`, false, async () => {
    const v = id => $('#' + id).value.trim(), name = v('n-name'), mail = v('n-email'), tel = v('n-tel');
    const zeige = t => { const p = $('#n-fehl'); p.hidden = false; p.textContent = t; };
    if (!name) return zeige('Ohne Namen weisst du später nicht, wer gefragt hat. Bitte einen Namen eintragen.');
    if (!mail && !tel) return zeige('Bitte eine E-Mail oder eine Telefonnummer eintragen, damit du antworten kannst.');
    if (mail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) return zeige('Die E-Mail sieht nicht vollständig aus.');
    const felder = { anlass: v('n-anlass'), datum: v('n-datum'), gaeste: v('n-gaeste'), ort: v('n-ort'), name, email: mail, telefon: tel, wunsch: v('n-wunsch'), quelle: v('n-quelle') };
    try {
      const id = (await senden('/angelina-strelow/werkzeuge/api/abende', 'POST', felder)).id;   // Name und E-Mail oder Telefon (serve.py seit 05.11.2026)
      fensterZu(); await laden(); S.station = 'alle'; S.such = ''; S.anlass = ''; S.monat = ''; S.reiter = 'antwort';
      gehe('eingang', id); if (S.ansicht === 'eingang') { S.wahl = id; zeichne(); }
      quit('Anfrage angelegt', name + ' steht jetzt im Eingang.', [], false, 5000);
    } catch (e) { fehler(e); }
  });
}
const VG_NAME = { gespraech: 'Gespräch am', kueche: 'Küche', stimmung: 'Stimmung', wer_kocht: 'Wer kocht', caterer: 'Caterer', besonderheiten: 'Besonderheiten' };
const VG_FELD = { gespraech: 'v-gespraech', kueche: 'v-kueche', stimmung: 'v-stimmung', wer_kocht: 'v-wer', caterer: 'v-caterer', besonderheiten: 'v-besonders' };
const vgNorm = vg => Object.keys(VG_NAME).reduce((o, k) => (o[k] = String((vg || {})[k] || '').trim(), o), {});
function notizenFenster(a) {
  const vg = ang(a).vorgespraech || {};
  let basis = vgNorm(vg);
  fenster(`<span class="mono">${esc(a.gastgeber.name)}</span><h2>Notizen aus dem <em>Vorgespräch.</em></h2><p>Was du beim Kaffee oder am Telefon erfahren hast. Der Abendplan liest es mit.</p>
    <div class="an-f2">${feld('v-gespraech', 'Gespräch am', vg.gespraech || isoTag(new Date()), 'date')}${wahl('v-kueche', 'Küche', [['', 'noch offen'], ['selbst', 'Gastgeber kocht selbst'], ['caterer', 'Caterer'], ['gemischt', 'Selbst und Caterer']], vg.kueche || '')}</div>
    ${feld('v-stimmung', 'Stimmung des Abends', vg.stimmung || '', 'text', ' placeholder="Festlich, herzlich, ganz in Ruhe"')}
    ${feld('v-wer', 'Wer kocht', vg.wer_kocht || '', 'text', ' placeholder="Klaus kocht drei Gänge selbst"')}
    ${feld('v-caterer', 'Caterer', vg.caterer || '', 'text', ' placeholder="Name, was kommt, wann"')}
    ${feld('v-besonders', 'Besonderheiten', vg.besonderheiten || '', 'area', ' placeholder="Ablauf, Rede, Allergien, ein Gast, auf den du achtest"')}
    <div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gold" type="button" id="f-los">Notizen speichern<i>${SYM.haken}</i></button></div>`, false, async () => {
    const v = id => $('#' + id).value.trim();
    const mein = { gespraech: v('v-gespraech'), kueche: v('v-kueche'), stimmung: v('v-stimmung'), wer_kocht: v('v-wer'), caterer: v('v-caterer'), besonderheiten: v('v-besonders') };
    if (J(mein) === J(basis)) { fensterZu(); return quit('Nichts geändert, nichts gespeichert.', '', [], false, 3000); }
    let fremd = [];
    try {
      const r = await teilAendern('angebot', a.id, A => {
        A = A || {}; const srv = vgNorm(A.vorgespraech), m = dreiWege(mein, basis, srv, Object.keys(VG_NAME));
        if (m.kollidiert.length) {   // neuen Stand ins Fenster, deine Felder bleiben; nichts gespeichert
          Object.keys(VG_NAME).forEach(k => { if (!m.kollidiert.includes(k) && J(mein[k]) === J(basis[k])) $('#' + VG_FELD[k]).value = srv[k]; });
          const ausgang = basis; basis = srv;
          const texte = m.kollidiert.filter(k => k !== 'gespraech' && k !== 'kueche'), dort = { ...srv };
          throw kollision(`Ein anderes Fenster hat die Notizen zu ${a.gastgeber.name} auch geändert: ${m.kollidiert.map(k => texte.includes(k) ? textDort(VG_NAME[k], srv[k], mein[k]) : VG_NAME[k] + ' steht dort auf «' + (k === 'kueche' ? ({ selbst: 'Gastgeber kocht selbst', caterer: 'Caterer', gemischt: 'Selbst und Caterer' }[srv[k]] || 'noch offen') : tagKurz(srv[k]) || 'offen') + '»').join(', ')}. Alles andere aus dem anderen Fenster steht jetzt hier. Deine Eingabe ist noch da; speicherst du noch einmal, gilt deine.`,
            texte.length ? [['Beides behalten', () => { texte.forEach(k => { const el = $('#fenster #' + VG_FELD[k]); if (el) el.value = beidesText(dort[k], el.value, ausgang[k]); }); }]] : null);
        }
        fremd = m.fremd.map(k => VG_NAME[k]);
        if (!srv.gespraech && m.wert.gespraech) A.verlauf = (A.verlauf || []).concat({ zeit: m.wert.gespraech + 'T10:00', was: 'Vorgespräch' });
        A.vorgespraech = m.wert; return A;
      }, 'Vorgespräch ' + a.id);
      fensterZu(); zeigDetail(a.id); quittung('Gespeichert', ['Notizen zu ' + a.gastgeber.name].concat(fremd.length ? ['Aus dem anderen Fenster übernommen: ' + fremd.join(', ')] : []), [['angebot', a.id, r.alt]]);
    } catch (e) { if (e.kollision) konflikt(); fehler(e); }
  });
}
function zusageFenster(a) {
  const f = gesendeteFassung(a) || aktFassung(a);
  fenster(`<span class="mono">${esc(a.gastgeber.name)}</span><h2>Zusage <em>vermerken.</em></h2><p>${esc(vorname(a.gastgeber.name))} hat zugesagt. Der Abend am ${esc(tagLang(a.anfrage.datum) || 'Wunschtag')} geht damit in ${esc(WO.name('abendplan').replace(/^Der /, 'den ').replace(/^Die /, 'die ').replace(/^Das /, 'das '))}, dort planst du Zeiten, Gänge, Wein und Gäste.</p>
    ${wahl('z-wie', 'Wie kam die Zusage', [['per E-Mail', 'per E-Mail'], ['am Telefon', 'am Telefon'], ['auf Instagram', 'auf Instagram'], ['persönlich', 'persönlich']], 'per E-Mail')}
    ${f ? `<p class="leise">Gilt für Fassung ${f.nr} des Angebots, ${esc(geld(f.summe))}.</p>` : '<p class="leise">Es gibt noch kein Angebot. Die Zusage gilt dann ohne Fassung.</p>'}
    <div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gold" type="button" id="f-los">Zusage vermerken<i>${SYM.haken}</i></button></div>`, true, async () => {
    const jetzt = jetztIso(), wie = $('#z-wie').value, st0 = a.status;
    try {
      const k = await teilAendern('kern', a.id, K => { if (K.status !== st0) throw kollision('Ein anderes Fenster hat den Abend inzwischen weitergesetzt: ' + (STATUS_NAME[K.status] || K.status) + '.'); return { ...K, status: 'zugesagt' }; }, 'Status zugesagt');
      const r = await teilAendern('angebot', a.id, A => { A = A || {}; A.zusage = { zeit: jetzt, fassung: f ? f.nr : 0, wie }; A.verlauf = (A.verlauf || []).concat({ zeit: jetzt, was: 'Zusage ' + wie + '. Der Abend geht in den Abendplan.' }); return A; }, 'Zusage ' + a.id);
      fensterZu(); rand(); leiste(); zeichne();
      quit('Zugesagt', a.gastgeber.name + ' steht jetzt im Abendplan.', [['Abendplan öffnen', () => window.open(WO_HAUS.wege.abendplan + '#' + a.id, '_blank', 'noopener')], ['Rückgängig', async () => { try { await teilSchreiben('angebot', a.id, r.alt, 'Rückgängig'); await teilSchreiben('kern', a.id, k.alt, 'Rückgängig'); rand(); leiste(); zeichne(); } catch (e) { fehler(e); } }]]);
    } catch (e) { if (e.kollision) { fensterZu(); konflikt(); } fehler(e); }
  });
}
function absageFenster(a) {
  fenster(`<span class="mono">${esc(a.gastgeber.name)}</span><h2>Absage <em>vermerken.</em></h2><p>Die Anfrage bleibt mit Grund unter «Abgesagt» stehen und lässt sich jederzeit wieder öffnen.</p>
    ${wahl('x-grund', 'Grund', ['Gastgeber hat abgesagt', 'Termin bei mir vergeben', 'Termin passt nicht mehr', 'Zu weit entfernt', 'Anderer Grund'], 'Gastgeber hat abgesagt')}
    ${feld('x-text', 'Notiz (freiwillig)', '', 'area', ' placeholder="Etwa: feiert nun im Restaurant, meldet sich im Frühjahr wieder"')}
    <div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gefahr" type="button" id="f-los">Absage vermerken<i>${SYM.haken}</i></button></div>`, true, async () => {
    const jetzt = jetztIso(), grund = $('#x-grund').value, text = $('#x-text').value.trim(), st0 = a.status;
    try {
      const k = await teilAendern('kern', a.id, K => { if (K.status !== st0) throw kollision('Ein anderes Fenster hat den Abend inzwischen weitergesetzt: ' + (STATUS_NAME[K.status] || K.status) + '.'); return { ...K, status: 'abgesagt' }; }, 'Status abgesagt');
      const r = await teilAendern('angebot', a.id, A => { A = A || {}; A.absage = { zeit: jetzt, grund, text }; A.verlauf = (A.verlauf || []).concat({ zeit: jetzt, was: 'Abgesagt: ' + grund + (text ? '. ' + text : '') }); return A; }, 'Absage ' + a.id);
      fensterZu(); rand(); leiste(); zeichne(); quittung('Absage vermerkt', [a.gastgeber.name + ': ' + grund], [['angebot', a.id, r.alt], ['kern', a.id, k.alt]]);
    } catch (e) { if (e.kollision) { fensterZu(); konflikt(); } fehler(e); }
  });
}

/* Löschen wie im Vorbild (Papierkorb, mit Rückfrage): für Doppel, Probe- oder Fehlanlagen; ein zugesagter Abend gehört schon dem Abendplan */
function loeschFenster(a) {
  fenster(`<h2>Anfrage <em>löschen?</em></h2><p>Die Anfrage von ${esc(a.gastgeber.name || 'diesem Gastgeber')} mit Antworten, Angebot und Verlauf wird gelöscht. Das ist richtig für eine doppelte oder versehentlich angelegte Anfrage. Hat der Gastgeber abgesagt, vermerk lieber die Absage.</p>
    <div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gefahr" type="button" id="f-los">Endgültig löschen<i>${SYM.korb}</i></button></div>`, true, async () => {
    const altK = kernVon(a), alt = klon(a.angebot), name = a.gastgeber.name;
    try {
      if (alt) await teilSchreiben('angebot', a.id, null, 'gelöscht ' + a.id);
      await teilSchreiben('kern', a.id, null, 'Anfrage gelöscht ' + a.id);
      fensterZu(); S.wahl = ''; delete S.form[a.id]; delete S.antw[a.id]; S.offen.delete('angebot:' + a.id); S.offen.delete('antwort:' + a.id);
      rand(); leiste(); zeichne();
      quit('Gelöscht', name, [['Rückgängig', async () => { try { await teilSchreiben('kern', a.id, altK, 'Rückgängig'); if (alt) await teilSchreiben('angebot', a.id, alt, 'Rückgängig'); rand(); leiste(); zeichne(); quit('Wieder da', name, [], false, 3000); } catch (e) { fehler(e); } }]]);
    } catch (e) { fehler(e); }
  });
}

/* ---------- Terminblick ---------- */
function termine() {
  const h = heute(), m = S.tbMonat || (h.getFullYear() + '-' + String(h.getMonth() + 1).padStart(2, '0'));
  S.tbMonat = m;
  const j = +m.slice(0, 4), mo = +m.slice(5) - 1, erster = new Date(j, mo, 1), tageIm = new Date(j, mo + 1, 0).getDate(), versatz = (erster.getDay() + 6) % 7;
  const imMonat = S.abende.filter(a => a.status !== 'abgesagt' && String((a.anfrage || {}).datum || '').slice(0, 7) === m).sort((x, y) => x.anfrage.datum.localeCompare(y.anfrage.datum));
  const amTag = iso => imMonat.filter(a => a.anfrage.datum === iso);
  const doppelt = [...new Set(imMonat.map(a => a.anfrage.datum))].filter(t => amTag(t).length > 1);
  let freieWE = 0; for (let d = 1; d <= tageIm; d++) { const t = new Date(j, mo, d); if ([5, 6].includes(t.getDay()) && !amTag(isoTag(t)).some(a => BELEGT.includes(a.status)) && t >= h) freieWE++; }
  const zellen = [];
  for (let i = 0; i < versatz; i++) zellen.push('<div class="tb-tag tb-tag--aus" aria-hidden="true"></div>');
  for (let d = 1; d <= tageIm; d++) {
    const t = new Date(j, mo, d), iso = isoTag(t), l = amTag(iso), vorbei = t < h;
    zellen.push(`<div class="tb-tag${iso === isoTag(h) ? ' tb-tag--heute' : ''}${vorbei ? ' tb-tag--vorbei' : ''}${l.length > 1 ? ' tb-tag--zwei' : ''}${[0, 6].includes(t.getDay()) ? ' tb-tag--we' : ''}"><span class="tb-z"><i>${TAGE[t.getDay()].slice(0, 2)}</i>${d}</span>
      ${l.map(a => `<button class="tb-e tb-e--${BELEGT.includes(a.status) ? 'belegt' : 'angefragt'}" type="button" data-gehe="eingang" data-wahl="${esc(a.id)}" title="${esc(a.gastgeber.name + ' · ' + (STATUS_NAME[a.status] || ''))}"><i></i><span>${esc(kurzname(a.gastgeber.name))}</span></button>`).join('')}
      ${l.length > 1 ? '<em class="tb-zwei">Zwei am Tag</em>' : ''}</div>`);
  }
  const vor = new Date(j, mo - 1, 1), nach = new Date(j, mo + 1, 1), mk = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  return kopf('Terminblick', 'Ist der Tag <em>noch frei?</em>',
    'Dein Monat auf einen Blick: belegte Abende (zugesagt und geplant) und Anfragen, die noch offen sind. Zwei Anfragen am selben Tag stehen markiert, damit du weisst, wem du zuerst antwortest. Ein Datum prüfst du rechts oben in einem Griff.') +
    `<div class="re-zahlen platte">${zahlKachel(imMonat.filter(a => BELEGT.includes(a.status)).length, 'belegter Abend', 'belegte Abende')}${zahlKachel(imMonat.filter(a => !BELEGT.includes(a.status)).length, 'offene Anfrage', 'offene Anfragen')}${zahlKachel(freieWE, 'freier Freitag oder Samstag', 'freie Freitage und Samstage')}${zahlKachel(doppelt.length, 'Tag mit zwei Anfragen', 'Tage mit zwei Anfragen')}</div>
    <div class="tb-leiste"><div class="wahl2 tb-monat" role="group" aria-label="Monat"><button type="button" data-akt="tb-monat" data-m="${mk(vor)}" aria-label="Monat davor">${SYM.links}</button><span>${MON[mo]} ${j}</span><button type="button" data-akt="tb-monat" data-m="${mk(nach)}" aria-label="Monat danach">${SYM.rechts}</button></div>
      <label class="tb-pruef"><span class="an-vers">Datum prüfen</span><input type="date" id="tb-datum"></label></div>
    <p class="tb-ergebnis" id="tb-ergebnis" aria-live="polite">Wähl ein Datum, dann steht hier, ob es frei ist.</p>
    <div class="tb-kal platte"><div class="tb-kopf">${['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'].map(t => `<span>${t.slice(0, 2)}<i>${t.slice(2)}</i></span>`).join('')}</div><div class="tb-raster">${zellen.join('')}</div>
      <p class="tb-legende"><span><i class="tb-p tb-p--belegt"></i>belegt</span><span><i class="tb-p tb-p--angefragt"></i>angefragt</span></p></div>
    <h2 class="wo-zw">Abende im <em>${MON[mo]}</em></h2>
    ${imMonat.length ? `<div class="re-liste tb-liste">${liste(imMonat)}</div>` : `<div class="re-leer platte">${ZEICHEN}<b>Im ${MON[mo]} ist noch alles frei.</b><p>Sobald jemand für diesen Monat anfragt, steht es hier.</p></div>`}`;
}
function datumPruefen(iso) {
  const p = $('#tb-ergebnis'); if (!p || !iso) return;
  const l = S.abende.filter(a => a.status !== 'abgesagt' && (a.anfrage || {}).datum === iso), b = l.filter(a => BELEGT.includes(a.status)), o = l.filter(a => !BELEGT.includes(a.status));
  const d = ausIso(iso), nah = [-1, 1].map(n => { const t = new Date(d); t.setDate(t.getDate() + n); const x = S.abende.find(y => (y.anfrage || {}).datum === isoTag(t) && BELEGT.includes(y.status)); return x ? (n < 0 ? 'Am Vortag' : 'Am Tag danach') + ' bist du bei ' + x.gastgeber.name + '.' : ''; }).filter(Boolean);
  p.className = 'tb-ergebnis ' + (b.length ? 'belegt' : o.length ? 'angefragt' : 'frei');
  p.textContent = (b.length ? `Belegt: ${tagLang(iso)} begleitest du ${b.map(x => x.gastgeber.name + ' in ' + x.anfrage.ort).join(' und ')}.` : o.length ? `Angefragt, noch nicht fest: ${o.map(x => x.gastgeber.name).join(' und ')} für ${tagLang(iso)}.` : `Frei. Am ${tagLang(iso)} liegt noch nichts.`) + (nah.length ? ' ' + nah.join(' ') : '');
}

/* ---------- Preisliste (Karteikarten wie «Vom Team nachgetragen» im Vorbild) ---------- */
const GRUPPE = { grund: 'Grundpreis', leistung: 'Im Abend enthalten', zusatz: 'Zusatz', anfahrt: 'Anfahrt' };
function preiseS() {
  const l = S.preise.posten || [], bsp = preiseBeispiel();
  return kopf('Preisliste', 'Deine Preise, <em>dein Massstab.</em>',
    (bsp ? 'Preise sind offen: Jeder Betrag hier ist ein Beispiel, damit du siehst, wie das Angebot rechnet. Trag deine eigenen Preise ein, ab dann rechnet jedes neue Angebot mit ihnen. ' : 'Mit diesen Preisen rechnet jedes neue Angebot. ') + 'Gesendete Angebote behalten die Preise, mit denen sie rausgegangen sind.',
    `<button class="kn kn--linie" type="button" data-akt="pr-neu">Posten anlegen<i>${PF}</i></button><button class="kn kn--linie" type="button" data-akt="ver-preise">Frühere Fassungen<i>${PF}</i></button>`) +
    `<div class="re-nliste an-preisliste">${l.map((p, i) => `<article class="re-n${p.beispiel ? ' re-n--beispiel' : ''}" data-i="${i}">${IMG(p.bild || 'raum', 're-n__bild')}
        <header class="re-n__kopf"><span>${p.beispiel ? 'Beispiel, bitte eigenen Preis eintragen' : 'Dein Preis'}</span></header>
        <span class="re-n__l">${esc(GRUPPE[p.gruppe] || 'Posten')}</span>
        <h3 class="re-n__q">${esc(duIhr(p.t))}</h3>
        <div class="re-n__zier" aria-hidden="true"><i></i>${ZEICHEN}<i></i></div>
        <span class="re-n__l">Preis</span>
        <p class="re-n__a"><span class="an-preis">${esc(preisText(p))}</span>${esc(duIhr(p.s || ''))}</p>
        <footer class="re-n__kn"><button class="re-n__k" type="button" data-akt="pr-aendern" data-i="${i}">${SYM.stift}Ändern</button>${p.gruppe === 'grund' || p.gruppe === 'anfahrt' ? '' : `<button class="re-n__k re-n__k--weg" type="button" data-akt="pr-weg" data-i="${i}">${SYM.korb}Entfernen</button>`}</footer>
      </article>`).join('')}</div>`;
}
const BILDWAHL = ['handschuh', 'empfang', 'p140', 'p158', 'einschenken', 'kerzen', 'flasche', 'festtafel', 'glas', 'kerze', 'raum', 'tafel', 'teller', 'p151', 'p136', 'gang'];
function postenFenster(i) {
  const p = i == null ? { k: 'z' + Date.now().toString(36), gruppe: 'zusatz', t: '', s: '', preis: 0, einheit: 'pauschal', bild: 'kerzen' } : klon(S.preise.posten[i]);
  let basis = i == null ? null : klon(p);
  fenster(`<span class="mono">${esc(GRUPPE[p.gruppe] || 'Posten')}</span><h2>${i == null ? 'Posten <em>anlegen.</em>' : esc(duIhr(p.t)) + ' <em>ändern.</em>'}</h2><p>So, wie er im Angebot stehen soll. Der Satz darunter erklärt dem Gastgeber, was er bekommt. Für zwei Gastgeber schreibst du etwa {deines|eures}: links die Form für einen, rechts die für zwei.</p>
    ${feld('p-t', 'Name im Angebot', p.t)}${feld('p-s', 'Ein Satz dazu', p.s, 'area')}
    <div class="an-f2">${p.gruppe === 'leistung' ? '' : wahl('p-einheit', 'Einheit', p.gruppe === 'grund' ? [['Stunde', 'je Stunde']] : p.gruppe === 'anfahrt' ? [['km', 'je Kilometer']] : [['pauschal', 'pauschal'], ['Stunde', 'je Stunde'], ['Gast', 'je Gast'], ['auf Anfrage', 'auf Anfrage']], p.anfrage ? 'auf Anfrage' : p.einheit)}
      ${p.gruppe === 'leistung' ? '<p class="leise">Diese Leistung ist im Abend enthalten und steht im Angebot unter «Was ich für dich übernehme».</p>' : feld('p-preis', 'Preis in Euro', p.preis == null ? '' : String(p.preis).replace('.', ','), 'text', ' inputmode="decimal"')}</div>
    ${p.gruppe === 'grund' ? feld('p-mindest', 'Mindestens Stunden', p.mindest || '', 'text', ' inputmode="numeric"') : ''}${p.gruppe === 'anfahrt' ? feld('p-frei', 'Kilometer enthalten', p.frei || 0, 'text', ' inputmode="numeric"') : ''}
    <fieldset class="an-bildwahl"><legend>Foto in der Liste</legend>${BILDWAHL.map(b => `<label><input type="radio" name="p-bild" value="${b}"${b === p.bild ? ' checked' : ''}><img src="/angelina-strelow/werkzeuge/assets/bild/${b}-640.webp" alt="" width="640" height="480" loading="lazy"></label>`).join('')}</fieldset>
    <div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gold" type="button" id="f-los">Speichern<i>${SYM.haken}</i></button></div>`, false, async () => {
    const v = id => ($('#' + id) || {}).value, preis = v('p-preis') == null ? 0 : zahlLesen(v('p-preis'));
    const neu = { ...p, t: v('p-t').trim(), s: v('p-s').trim(), bild: ($('#fenster input[name=p-bild]:checked') || {}).value || p.bild, beispiel: false };
    if (!neu.t) return quit('Name fehlt', 'Jeder Posten braucht einen Namen.', [], true, 4000);
    if (p.gruppe !== 'leistung') { const e = v('p-einheit'); neu.anfrage = e === 'auf Anfrage'; neu.einheit = e;
      if (!neu.anfrage && (isNaN(preis) || preis < 0 || preis > 100000)) return quit('Preis prüfen', 'Bitte einen Betrag in Euro, etwa 65 oder 72,50 oder 1.200. Gespeichert ist noch nichts.', [], true, 6000);
      neu.preis = neu.anfrage ? null : Math.round(preis * 100) / 100; }
    const ganz = (id, ma) => { const z = zahlLesen(v(id)); return isNaN(z) || z < 0 || z > ma || z % 1 ? null : z; };
    if (p.gruppe === 'grund') { neu.mindest = v('p-mindest') === '' ? 0 : ganz('p-mindest', 16); if (neu.mindest == null) return quit('Mindestdauer prüfen', 'Ganze Stunden von 0 bis 16.', [], true, 5000); }
    if (p.gruppe === 'anfahrt') { neu.frei = v('p-frei') === '' ? 0 : ganz('p-frei', 900); if (neu.frei == null) return quit('Kilometer prüfen', 'Ganze Kilometer von 0 bis 900.', [], true, 5000); }
    try {
      const r = await sammlungAendern('preise', d => {   // nur dieser Posten ändert sich, alles andere bleibt, wie es auf dem Server steht (Prüfung 2, N1)
        d.posten = d.posten || []; const j = d.posten.findIndex(x => x.k === p.k);
        if (i != null && j < 0) throw kollision('Ein anderes Fenster hat «' + duIhr(p.t) + '» inzwischen entfernt.');
        if (j >= 0 && J(d.posten[j]) !== J(basis) && J(d.posten[j]) !== J(neu)) {   // was dort anders ist, Wort für Wort: Name, Satz und Preis (Prüfung 3, N7)
          const srv = d.posten[j], teile = [];
          if ((srv.t || '') !== neu.t) teile.push(textDort('Der Name', srv.t, neu.t));
          if ((srv.s || '') !== neu.s) teile.push(textDort('Der Satz', srv.s, neu.s));
          if (preisText(srv) !== preisText(neu) || !teile.length) teile.push('Der Preis steht dort auf ' + preisText(srv));
          const ausgang = basis || {}, texte = [['t', 'p-t'], ['s', 'p-s']].filter(([f]) => (srv[f] || '') !== neu[f] && (srv[f] || '') !== (ausgang[f] || ''));   // Name und Satz: auch hier «Beides behalten» (Prüfung 4, N8)
          basis = klon(srv); throw kollision('Ein anderes Fenster hat «' + duIhr(p.t) + '» auch geändert. ' + teile.join('. ') + '. Deine Eingabe ist noch da.' + (texte.length ? ' «Beides behalten» setzt den Teil von dort in deinen Text;' : '') + ' speicherst du noch einmal, gilt deine.',
            texte.length ? [['Beides behalten', () => { texte.forEach(([f, id]) => { const el = $('#fenster #' + id); if (el) el.value = beidesText(srv[f], el.value, ausgang[f]); }); }]] : null);
        }
        if (j >= 0) d.posten[j] = neu; else d.posten.splice(d.posten.filter(x => x.gruppe !== 'anfahrt').length, 0, neu);
        d.beispiel = d.posten.some(x => x.beispiel); return d;
      }, (i == null ? 'Posten «' + duIhr(neu.t) + '» angelegt, ' : '«' + duIhr(neu.t) + '» auf ') + preisText(neu) + (i == null ? '' : ' gesetzt'));
      fensterZu(); S.form = {}; zeichne(); quittung('Gespeichert', [duIhr(neu.t) + ': ' + preisText(neu)], [['sammlung', 'preise', r.alt]]);
    } catch (e) { if (e.kollision) zeichne(); fehler(e); }
  });
}
/* Protokoll-Notiz lesbar: ältere Einträge («Geändert: X, 70 €») und neue Sätze («X auf 70 € gesetzt») ohne doppelten Doppelpunkt (Prüfung 2, N5) */
const notizText = t => String(t || '').replace(/^Geändert: (.+?), (.+)$/, '«$1» auf $2 gesetzt').replace(/^Posten angelegt: (.+?), (.+)$/, 'Posten «$1» angelegt, $2').replace(/^Posten entfernt: (.+)$/, 'Posten «$1» entfernt')
  .replace(/^Baustein (?!«|entfernt$)(.+)$/, 'Baustein «$1» gespeichert').replace(/^Einstellungen$/, 'Einstellungen gespeichert').replace(/^Rückgängig$/, 'Rückgängig gemacht').replace(/^Ursprünglicher Stand$/, 'Ursprünglichen Stand zurückgeholt');
/* Frühere Fassungen einer Sammlung (R14): Datum, «Zurückholen», unten immer der ursprüngliche Stand */
async function fassungenFenster(name, titel) {
  try {
    const [d, pr] = await Promise.all([holen('/angelina-strelow/werkzeuge/api/verlauf/anfragen-' + name), holen('/angelina-strelow/werkzeuge/api/protokoll').catch(() => ({ eintraege: [] }))]), l = d.fassungen || [];
    const stempel = f => (/-(\d{8}-\d{6})\.json$/.exec(f) || [])[1] || '';
    const notiz = {}; (pr.eintraege || []).filter(x => x.bereich === 'anfragen-' + name).forEach(x => { notiz[String(x.zeit).replace(/[-:]/g, '').replace('T', '-')] = x.was; });
    const wann = f => { const m = /-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})\.json$/.exec(f); return m ? `${+m[3]}. ${MON[+m[2] - 1]} ${m[1]}, ${m[4]}:${m[5]} Uhr` : f; };
    fenster(`<span class="mono">${esc(titel)}</span><h2>Frühere <em>Fassungen.</em></h2><p>Jedes Speichern legt die Fassung davor hier ab. Zurückholen ersetzt den jetzigen Stand, der dann selbst hier liegt.</p>
      <ul class="an-ver">${l.slice(0, 20).map((f, i) => `<li><span><b class="an-ver__n">Fassung ${l.length - i}</b> · ${esc(wann(f))}<small>${notiz[stempel(f)] ? 'Stand vor der Änderung: ' + esc(notizText(notiz[stempel(f)])) : 'Stand vor einer Änderung'}</small></span><button class="kn kn--klein kn--linie" type="button" data-ver="${esc(f)}">Zurückholen<i>${ZU}</i></button></li>`).join('')}
        <li class="an-ver__u"><span>Ursprünglicher Stand (Startwerte mit Beispielen)</span><button class="kn kn--klein kn--linie" type="button" data-ver="">Zurückholen<i>${ZU}</i></button></li></ul>`, false);
    $$('#fenster [data-ver]').forEach(b => b.onclick = async () => {
      try {
        if (b.dataset.ver) await senden('/angelina-strelow/werkzeuge/api/verlauf/anfragen-' + name + '/' + encodeURIComponent(b.dataset.ver), 'POST', { wer: WER });
        else await sammlungSchreiben(name, klon(S.START[name]), 'Ursprünglichen Stand zurückgeholt');
        fensterZu(); await laden(); S.form = {}; rand(); leiste(); zeichne(); quit('Zurückgeholt', titel + ' steht wieder wie damals.', [], false, 5000);
      } catch (e) { fehler(e); }
    });
  } catch (e) { fehler(e); }
}

/* ---------- Textbausteine (wie «Das wurde gefragt» im Vorbild: Gruppen, Karten mit Foto) ---------- */
const BST_GRUPPE = { erste: 'Vor dem Angebot', kaffee: 'Vor dem Angebot', nachfrage: 'Vor dem Angebot', preisfrage: 'Vor dem Angebot', viele: 'Vor dem Angebot', musik: 'Vor dem Angebot', vergeben: 'Vor dem Angebot', nach_kaffee: 'Vor dem Angebot',
  angebot: 'Rund ums Angebot', erinnerung: 'Rund ums Angebot', spaet: 'Rund ums Angebot', zusage: 'Nach der Zusage', anzahlung: 'Nach der Zusage', ablauf: 'Nach der Zusage', absage_verstehen: 'Wenn es nicht klappt' };
const BST_REIHE = ['Vor dem Angebot', 'Rund ums Angebot', 'Nach der Zusage', 'Wenn es nicht klappt', 'Eigene Bausteine'];
function bausteine() {
  const l = S.vorlagen.liste || [], benutzt = k => S.abende.reduce((n, a) => n + (ang(a).antworten || []).filter(x => x.vorlage === k).length, 0);
  const gruppen = {}; l.forEach(v => { const g = BST_GRUPPE[v.k] || 'Eigene Bausteine'; (gruppen[g] = gruppen[g] || []).push(v); });
  const probe = S.abende.find(a => station(a) === 'neu') || S.abende[0], probeF = probe ? fuellWerte(probe) : null;   // gefüllt mit Werten, nie rohe [Klammern]
  const alle = S.abende.reduce((n, a) => n + (ang(a).antworten || []).length, 0);
  const reihe = BST_REIHE.filter(g => gruppen[g] && (S.bstGruppe === 'alle' || S.bstGruppe === g));
  return kopf('Textbausteine', 'Deine Sätze, <em>immer zur Hand.</em>',
    'Für jede Station eines Abends ein Baustein in deiner Stimme. Im Eingang wird er mit Name, Anlass, Datum, Ort und deinem Kaffee-Link gefüllt, du änderst nur noch, was diesen Abend besonders macht.',
    `<button class="kn kn--linie" type="button" data-akt="bst-neu">Baustein anlegen<i>${PF}</i></button><button class="kn kn--linie" type="button" data-akt="ver-vorlagen">Frühere Fassungen<i>${PF}</i></button>`) +
    `<div class="re-zahlen platte">${zahlKachel(l.length, 'Baustein', 'Bausteine')}<div><b>${S.eigen.vorlagen ? 'Eigene' : 'Beispiel'}</b><span>${S.eigen.vorlagen ? 'Fassung gespeichert' : 'Startwerte, frei änderbar'}</span></div>${zahlKachel(alle, 'Antwort vermerkt', 'Antworten vermerkt')}<div><b>${l.filter(v => /\{calendly\}/.test(v.text)).length}</b><span>mit deinem Kaffee-Link</span></div></div>
    <div class="filter"><div class="wahl2" role="group" aria-label="Auswahl">${[['alle', 'Alle']].concat(BST_REIHE.filter(g => gruppen[g]).map(g => [g, g])).map(([k, t]) => `<button type="button" data-akt="bst-gruppe" data-g="${esc(k)}" aria-pressed="${S.bstGruppe === k}">${esc(t)}</button>`).join('')}</div></div>
    ${reihe.map(g => `<details class="gr re-gr" open><summary><b>${esc(g)}</b><small>${mal(gruppen[g].length, 'ein Baustein', 'Bausteine')}</small></summary>${gruppen[g].map(v => `<div class="re-f" data-k="${esc(v.k)}">${IMG(v.bild || 'kerzen', 're-f__bild')}
      <div class="re-f__k"><span class="mono">${esc(v.wann || '')} · ${benutzt(v.k) ? mal(benutzt(v.k), 'einmal gesendet', 'Mal gesendet') : 'noch nicht gesendet'}</span></div>
      <p class="re-f__q">${esc(v.t)}</p>
      <details class="re-f__antw"><summary>Text ansehen${probe ? ', gefüllt für ' + esc(vorname(probe.gastgeber.name)) : ''}</summary><div class="re-chat-antwort"><span class="re-chat-antwort__k mono">Betreff: ${esc(probe ? fuelle(v.betreff, probe, probeF) : v.betreff)}</span>${(probe ? fuelle(v.text, probe, probeF) : v.text).split(/\n{2,}/).map(x => `<p>${esc(x).replace(/\n/g, '<br>')}</p>`).join('')}</div></details>
      <div class="re-f__kn"><button class="kn kn--klein kn--linie" type="button" data-akt="bst-aendern" data-k="${esc(v.k)}">Ändern<i>${SYM.stift}</i></button><button class="link" type="button" data-akt="bst-weg" data-k="${esc(v.k)}">Entfernen</button></div>
    </div>`).join('')}</details>`).join('')}`;
}
const PLATZ = [['{dich|euch}', 'links für einen Gastgeber, rechts für zwei'], ['{vorname}', 'Vorname'], ['{anlass_ein}', 'Ein Geburtstag'], ['{anlass_den}', 'deinen Geburtstag'], ['{datum}', 'Samstag, 19. Dezember 2026'], ['{datum_kurz}', '19. Dezember'], ['{ort}', 'Ort'], ['{gaeste}', 'bis zu 10 Gästen'], ['{calendly}', 'Kaffee-Link'], ['{gueltig}', 'gültig bis'], ['{anzahlung}', 'Anzahlung'], ['{summe}', 'Summe'], ['{wunsch_kurz}', 'erster Satz des Wunsches'], ['{unterschrift}', 'Unterschrift']];
const BST_FELDER = ['t', 'wann', 'betreff', 'text', 'bild'], BST_NAME = { t: 'Der Name', wann: '«Wann passt er»', betreff: 'Der Betreff', text: 'Der Text', bild: 'Das Foto' }, BST_ID = { t: '#b-t', wann: '#b-wann', betreff: '#b-betreff', text: '#b-text' };
function bstFeld(f, wert) {   // einen Wert von dort ins offene Fenster setzen
  if (f === 'bild') { const r = $('#fenster input[name=b-bild][value="' + wert + '"]'); if (r) r.checked = true; return; }
  if ($(BST_ID[f])) $(BST_ID[f]).value = wert || '';
}
function bausteinFenster(k) {
  const v = k ? klon(vorlage(k)) : { k: 'b' + Date.now().toString(36), t: '', wann: '', betreff: '', text: 'Hallo {vorname},\n\n\n\n{unterschrift}', bild: 'kerzen' };
  let basis = k ? klon(v) : null;
  fenster(`<span class="mono">Textbaustein</span><h2>${k ? esc(v.t) + ' <em>ändern.</em>' : 'Baustein <em>anlegen.</em>'}</h2><p>In deiner Stimme, im Du. Die Felder in geschweiften Klammern füllt das Werkzeug mit den Angaben des Abends. Wo zwei Gastgeber anfragen, ein Paar oder eine Familie, schreibst du beide Formen, etwa {dich|euch} oder {kannst du|könnt ihr}: links für einen, rechts für zwei.</p>
    <div class="an-f2">${feld('b-t', 'Name', v.t)}${feld('b-wann', 'Wann passt er', v.wann)}</div>${feld('b-betreff', 'Betreff', v.betreff)}${feld('b-text', 'Text', v.text, 'area', ' rows="12"')}
    <p class="an-platz">${PLATZ.map(([p, n]) => `<button type="button" class="an-platz__k" data-platz="${p}" title="${esc(n)}">${p}</button>`).join('')}</p>
    <fieldset class="an-bildwahl"><legend>Foto in der Liste</legend>${BILDWAHL.concat(['studio', 'studio-fenster', 'hintergrund', 'p89', 'dunkel', 'p152', 'p155', 'p156']).map(b => `<label><input type="radio" name="b-bild" value="${b}"${b === v.bild ? ' checked' : ''}><img src="/angelina-strelow/werkzeuge/assets/bild/${b}-640.webp" alt="" width="640" height="480" loading="lazy"></label>`).join('')}</fieldset>
    <div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gold" type="button" id="f-los">Speichern<i>${SYM.haken}</i></button></div>`, false, async () => {
    const x = { ...v, t: $('#b-t').value.trim(), wann: $('#b-wann').value.trim(), betreff: $('#b-betreff').value.trim(), text: $('#b-text').value.replace(/\s+$/, ''), bild: ($('#fenster input[name=b-bild]:checked') || {}).value || v.bild };
    if (!x.t || !x.text.trim()) return quit('Name und Text fehlen', 'Ein Baustein braucht einen Namen und einen Text.', [], true, 4000);
    let fremd = [];
    try {
      const r = await sammlungAendern('vorlagen', d => {   // nur dieser Baustein ändert sich (Prüfung 2, N1)
        d.liste = d.liste || []; const i = d.liste.findIndex(y => y.k === x.k); let neu = x; fremd = [];
        if (k && i < 0) throw kollision('Ein anderes Fenster hat «' + v.t + '» inzwischen entfernt.');
        if (i >= 0 && J(d.liste[i]) !== J(basis) && J(d.liste[i]) !== J(x)) {   // Feld für Feld: was nur dort geändert ist, bleibt; was beide geändert haben, nennt die Meldung Wort für Wort (Prüfung 3, N7)
          const srv = d.liste[i], m = dreiWege(x, basis, srv, BST_FELDER);
          if (m.kollidiert.length) {
            BST_FELDER.forEach(f => { if (!m.kollidiert.includes(f) && J(x[f]) === J(basis[f])) bstFeld(f, srv[f]); });
            const ausgang = basis.text; basis = klon(srv);
            throw kollision('Ein anderes Fenster hat «' + v.t + '» auch geändert. ' + m.kollidiert.map(f => f === 'bild' ? 'Das Foto ist dort ein anderes' : textDort(BST_NAME[f], srv[f], x[f])).join('. ') + '. Alles andere von dort steht jetzt im Fenster. Deine Eingabe ist noch da. «Beides behalten» setzt den Teil von dort in deinen Text; speicherst du so noch einmal, gilt deine.',
              m.kollidiert.includes('text') ? [['Beides behalten', () => { const t = $('#fenster #b-text'); if (t) t.value = beidesText(srv.text, t.value, ausgang); }]] : null);
          }
          fremd = m.fremd.map(f => BST_NAME[f]); neu = { ...x, ...m.wert };
        }
        if (i >= 0) d.liste[i] = neu; else d.liste.push(neu);
        return d;
      }, 'Baustein «' + x.t + '» ' + (k ? 'gespeichert' : 'angelegt'));
      fensterZu(); S.antw = {}; zeichne(); quittung('Gespeichert', ['Baustein «' + x.t + '»'].concat(fremd.length ? ['Aus dem anderen Fenster übernommen: ' + fremd.join(', ')] : []), [['sammlung', 'vorlagen', r.alt]]);
    } catch (e) { if (e.kollision) zeichne(); fehler(e); }
  });
  /* Schreibmarke merken (auch ganz am Anfang), damit der Platzhalter-Knopf genau dort einsetzt (Prüfung 05.11.2026, Punkt 16) */
  const bt = $('#b-text'), merkPos = () => { bt.dataset.pos = bt.selectionStart; bt.dataset.ende = bt.selectionEnd; };
  ['keyup', 'click', 'select', 'input', 'focus'].forEach(ev => bt.addEventListener(ev, merkPos));
  $$('#fenster [data-platz]').forEach(b => b.onclick = () => {
    const t = bt, hat = t.dataset.pos != null && t.dataset.pos !== '', a = hat ? +t.dataset.pos : t.value.length, z = hat ? +t.dataset.ende : a;
    t.value = t.value.slice(0, a) + b.dataset.platz + t.value.slice(z); t.focus(); t.selectionStart = t.selectionEnd = a + b.dataset.platz.length; merkPos(); });
}

/* ---------- Einstellungen ---------- */
function einstS() {
  const E = S.einstForm || S.einst, H = S.HAUS;
  return kopf('Einstellungen', 'So klingt <em>dein Angebot.</em>',
    'Unterschrift, persönliche Zeile, Gültigkeit und Anzahlung gelten für jedes neue Angebot und jede Antwort. Deine Wege (E-Mail, Instagram, Kaffee-Link) kommen aus deiner Website.' + (E.beispiel ? ' Bis du speicherst, stehen hier Startwerte als Beispiel.' : ''),
    `<button class="kn kn--linie" type="button" data-akt="ver-einstellungen">Frühere Fassungen<i>${PF}</i></button>`) +
    `<div class="an-einst">
      <section class="platte an-einst__g"><h2 class="wo-zw">Dein <em>Angebot</em></h2>
        <div class="an-f2"><label class="feld"><span>Gültig, Tage ab heute</span><input type="text" inputmode="numeric" data-zahl="1" data-f="einst" data-k="gueltig_tage" value="${esc(zahlZeigen(E.gueltig_tage))}"></label>
          <label class="feld"><span>Anzahlung bei Zusage in %</span><input type="text" inputmode="decimal" data-zahl="1" data-f="einst" data-k="anzahlung" value="${esc(zahlZeigen(E.anzahlung))}"></label></div>
        <div class="an-f2"><label class="feld"><span>Beginn, wenn nichts anderes besprochen</span><input type="text" inputmode="numeric" maxlength="5" placeholder="18:00" data-f="einst" data-k="beginn" value="${esc(E.beginn)}"></label>
          <label class="feld"><span>Dauer in Stunden</span><input type="text" inputmode="decimal" data-zahl="1" data-f="einst" data-k="stunden" value="${esc(zahlZeigen(E.stunden))}"></label></div>
        <label class="feld"><span>Umsatzsteuer im Angebot</span><select class="sel" data-f="einst" data-k="ust">${[['offen', 'Noch offen'], ['klein', 'Ohne USt. (§ 19 UStG)'], ['brutto', 'Mit 19 % USt.']].map(([k, t]) => `<option value="${k}"${E.ust === k ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
      </section>
      <section class="platte an-einst__g"><h2 class="wo-zw">Deine <em>Zeilen</em></h2>
        <label class="feld"><span>Unterschrift unter Antwort und Angebot</span><textarea rows="2" data-f="einst" data-k="unterschrift">${esc(E.unterschrift)}</textarea></label>
        <div class="feld an-ubild"><span>Deine echte Unterschrift als Bild, im Angebot statt der letzten Zeile in Schreibschrift</span>
          <div class="an-ubild__z">${E.unterschrift_bild ? `<img src="/angelina-strelow/werkzeuge/anfragen/dateien/${esc(encodeURIComponent(E.unterschrift_bild))}" alt="Deine Unterschrift">` : '<p class="leise">Noch keins. Bis dahin setzt das Angebot die letzte Zeile, etwa «Angelina», in Schreibschrift.</p>'}
            <label class="kn kn--linie an-ubild__w">${E.unterschrift_bild ? 'Anderes Bild' : 'Bild wählen'}<input type="file" id="e-ubild" accept="image/png,image/jpeg,image/webp"></label>
            ${E.unterschrift_bild ? '<button class="link" type="button" data-akt="ubild-weg">Bild entfernen</button>' : ''}</div>
          <p class="leise">Am schönsten mit dunkler Tinte auf weissem Papier, eng zugeschnitten. Es gilt, sobald du speicherst.</p></div>
        <label class="feld"><span>Persönliche Zeile, Vorschlag für jedes neue Angebot; {dir|euch}: links für einen, rechts für zwei Gastgeber</span><textarea rows="3" maxlength="400" data-f="einst" data-k="zeile">${esc(E.zeile)}</textarea></label>
        <label class="feld"><span>Fusszeile der Antwort</span><input type="text" data-f="einst" data-k="fuss" value="${esc(E.fuss)}"></label>
      </section>
      <section class="platte an-einst__g an-einst__wege"><h2 class="wo-zw">Deine <em>Wege</em></h2>
        <dl class="an-wege"><div><dt>E-Mail</dt><dd>${esc(H.email || '')}</dd></div><div><dt>Instagram</dt><dd>${esc(insta())}</dd></div><div><dt>Kennenlernen bei einem Kaffee</dt><dd class="an-lang">${esc(H.calendly || '')}</dd></div><div><dt>Ort</dt><dd>${esc(H.ort || '')}</dd></div></dl>
        <p class="leise">Diese Angaben stehen auf deiner Website und kommen von dort. Ändern sie sich dort, stehen sie hier von selbst neu.</p>
      </section>
    </div>`;
}

/* ---------- Klicks und Eingaben (an einer Stelle) ---------- */
document.addEventListener('click', e => {
  const g = e.target.closest('[data-gehe]');
  if (g && !e.target.closest('#fenster')) {
    e.preventDefault();
    if (g.dataset.station) { S.station = g.dataset.station; S.such = ''; S.anlass = ''; S.monat = ''; try { sessionStorage.setItem('an-station', S.station); } catch (x) { /* */ } if (S.ansicht === 'eingang') { S.wahl = ''; return zeichne(); } }
    return gehe(g.dataset.gehe, g.dataset.wahl || '');
  }
  const st = e.target.closest('.re-abt [data-station]');
  if (st) { S.station = st.dataset.station; S.wahl = ''; try { sessionStorage.setItem('an-station', S.station); } catch (x) { /* */ } return zeichne(); }
  const b = e.target.closest('[data-akt]');
  if (!b || b.closest('#fenster')) return;
  const akt = b.dataset.akt;
  if (akt === 'tb-monat') { S.tbMonat = b.dataset.m; return zeichne(); }
  if (akt === 'bst-gruppe') { S.bstGruppe = b.dataset.g; return zeichne(); }
  if (akt === 'bst-neu') return bausteinFenster('');
  if (akt === 'bst-aendern') return bausteinFenster(b.dataset.k);
  if (akt === 'bst-weg') return fenster(`<h2>Baustein <em>entfernen?</em></h2><p>«${esc((vorlage(b.dataset.k) || {}).t)}» steht dann nicht mehr zur Wahl. Gesendete Antworten bleiben, wie sie waren.</p><div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gefahr" type="button" id="f-los">Entfernen<i>${SYM.korb}</i></button></div>`, true, async () => {
    const t = (vorlage(b.dataset.k) || {}).t || 'Baustein';
    try { const r = await sammlungAendern('vorlagen', d => { d.liste = (d.liste || []).filter(v => v.k !== b.dataset.k); return d; }, 'Baustein «' + t + '» entfernt'); fensterZu(); zeichne(); quittung('Entfernt', ['Baustein «' + t + '»'], [['sammlung', 'vorlagen', r.alt]]); } catch (x) { fehler(x); } });
  if (akt === 'pr-neu') return postenFenster(null);
  if (akt === 'pr-aendern') return postenFenster(+b.dataset.i);
  if (akt === 'pr-weg') return fenster(`<h2>Posten <em>entfernen?</em></h2><p>«${esc(duIhr(S.preise.posten[+b.dataset.i].t))}» steht dann in keinem neuen Angebot mehr. Gesendete Angebote bleiben, wie sie waren.</p><div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gefahr" type="button" id="f-los">Entfernen<i>${SYM.korb}</i></button></div>`, true, async () => {
    const weg = S.preise.posten[+b.dataset.i];
    try { const r = await sammlungAendern('preise', d => { d.posten = (d.posten || []).filter(x => x.k !== weg.k); d.beispiel = d.posten.some(x => x.beispiel); return d; }, 'Posten «' + duIhr(weg.t) + '» entfernt'); fensterZu(); S.form = {}; zeichne(); quittung('Entfernt', [duIhr(weg.t)], [['sammlung', 'preise', r.alt]]); } catch (x) { fehler(x); } });
  if (akt === 'ver-preise') return fassungenFenster('preise', 'Preisliste');
  if (akt === 'ver-vorlagen') return fassungenFenster('vorlagen', 'Textbausteine');
  if (akt === 'ver-einstellungen') return fassungenFenster('einstellungen', 'Einstellungen');
  if (akt === 'ubild-weg') return unterschriftBild('');
  if (['gesendet', 'angebot-gesendet', 'wieder', 'fassung', 'fassung-neu', 'pdf', 'loeschen', 'kopieren'].includes(akt)) return einmal(() => aktion(akt, b), b);
  aktion(akt, b);
});
document.addEventListener('input', e => { const el = e.target; if (el.closest('#fenster')) return; if (el.matches('[data-f], #e-such') && el.type !== 'checkbox' && el.tagName !== 'SELECT') eingabe(el); });
/* Ihre echte Unterschrift als Bild (06.11.2026): hochladen in den Datenordner, die Einstellungen merken sich den Namen beim Speichern (gelb bis dahin, R10) */
function unterschriftBild(datei) {
  if (!S.einstForm) { S.einstForm = klon(S.einst); S.einstBasis = klon(S.einst); }
  S.einstForm.unterschrift_bild = datei; merke('einst', !gleichEinst(S.einstForm, S.einstBasis)); zeichne();
}
document.addEventListener('change', async e => {
  const el = e.target; if (el.id !== 'e-ubild' || !el.files || !el.files[0]) return;
  const f = el.files[0];
  if (!/^image\/(png|jpeg|webp)$/.test(f.type)) return quit('Kein passendes Bild', 'Bitte ein PNG, JPEG oder WebP wählen.', [], true, 5000);
  try {
    const daten = await new Promise((ok, nein) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = nein; r.readAsDataURL(f); });
    const d = await senden('api/unterschrift_bild', 'POST', { daten });
    unterschriftBild(d.datei); quit('Bild gewählt', 'Deine Unterschrift steht im Angebot, sobald du speicherst.', [], false, 5000);
  } catch (x) { fehler(x); }
});
document.addEventListener('change', e => { const el = e.target; if (el.closest('#fenster')) return; if (el.id === 'tb-datum') return datumPruefen(el.value); if (el.matches('[data-f], #e-anlass, #e-monat') && (el.type === 'checkbox' || el.tagName === 'SELECT' || el.type === 'date' || el.type === 'time')) eingabe(el); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#fenster').hidden) fensterZu();
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); einmal(speichern); }
});
addEventListener('beforeunload', ev => { if (S.offen.size) { ev.preventDefault(); ev.returnValue = ''; } });   // R13

/* ---------- Start ---------- */
(async function () {
  const lade = setTimeout(() => { $('#ansicht').innerHTML = '<div class="lade"><div class="lade__r"></div><b>Deine Anfragen werden geholt.</b></div>'; }, 280);   // R15: Ladezeichen erst nach 280 ms
  try { await Promise.race([laden(), new Promise((_, nein) => setTimeout(() => nein(new Error('SERVER · Der Server antwortet nicht.')), 12000))]); }
  catch (e) { clearTimeout(lade); $('#ansicht').innerHTML = ''; $('#tuer').hidden = false; $('#tuer-t').textContent = /^VERBINDUNG · /.test(e.message || '') ? 'Keine Verbindung zum Server. Bitte gleich neu laden.' : String(e.message || e).replace(/^[A-ZÄÖÜ]+ · /, ''); return; }
  clearTimeout(lade);
  try { S.reiter = sessionStorage.getItem('an-reiter') || 'antwort'; } catch (e) { /* */ }
  const h = location.hash.slice(1), [hz, hw] = h.split('/');
  try { S.ansicht = TITEL[hz] ? hz : localStorage.getItem('anfragen-ansicht') || 'start'; } catch (e) { S.ansicht = 'start'; }
  if (!TITEL[S.ansicht]) S.ansicht = 'start';
  if (hw && abend(hw)) { S.ansicht = 'eingang'; S.wahl = hw; S.station = 'alle'; }
  rand(); leiste(); await zeichne();
  window.addEventListener('hashchange', () => { const [z, w] = location.hash.slice(1).split('/'); if (TITEL[z] && (z !== S.ansicht || w)) gehe(z, w || ''); });
  setInterval(async () => {   // alle zwei Minuten nachsehen, ob eine neue Anfrage da ist (ohne die Ansicht zu stören, nie während Eingaben warten)
    if (S.offen.size || !$('#fenster').hidden) return;
    try { const d = await holen('/angelina-strelow/werkzeuge/api/abende'); if (JSON.stringify(d.etag) !== JSON.stringify(S.etag)) { S.abende = d.abende; S.etag = d.etag; rand(); leiste(); if (S.ansicht !== 'eingang') zeichne(); } } catch (e) { /* still */ }
  }, 120000);
})();

/* Der Abendplan · Angelina Strelow, Exklusive Gastgeberin (05.11.2026). Bedienung, Kopie von carte.js der Pairing-Karte des Culinarium (dort aus der Tafel
   im Schäfli, Schlössli, Gasterntal, Ruedihus, Doldenhorn, Carlton-Europe und mc.js des Grand Beau-Rivage): Rand mit den Abenden als Fotokacheln, Bühne,
   links die Liste in Platten (Teile), rechts die Vorschau des Blatts wie in der PDF (blatt.html, derselbe Satz wie der Druck), Fenster je Eintrag,
   Leiste mit Speichern, Quittung mit Rückgängig, frühere Fassungen. Inhalt Angelinas: je Abend der Plan (Teil «plan» der gemeinsamen Daten, DATEN.md):
   Ablauf vom Ankommen bis zum Abschied, Gänge und Wein, Gäste, Vor Ort, Packliste, Abstimmung mit dem Gastgeber. Zwei Blätter: «Dein Abend» für den
   Gastgeber (ohne interne Notizen) und das Arbeitsblatt für sie selbst (A4 und am Handy). Nichts geht raus: Nachrichten nur zum Kopieren.
   Server: der gemeinsame serve.py (/angelina-strelow/werkzeuge/api/abende, /api/teil/…) und abendplan/server.py (/angelina-strelow/werkzeuge/abendplan/api/…: Fassungen, PDF). Ohne Bibliothek. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const h = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const kopie = x => JSON.parse(JSON.stringify(x));
const PF = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3 11 11 3M4.5 3H11v6.5"/></svg>';
const SYM = {
  hoch: '<svg viewBox="0 0 14 14"><path d="m2.5 9 4.5-4.5L11.5 9"/></svg>', runter: '<svg viewBox="0 0 14 14"><path d="m2.5 5 4.5 4.5L11.5 5"/></svg>',
  zu: '<svg viewBox="0 0 16 16"><path d="M6 9.67 2.67 6.33 6 3M2.67 6.33h7.33a3.33 3.33 0 0 1 0 6.67h-2"/></svg>',
  korb: '<svg viewBox="0 0 14 14"><path d="M2.5 4h9M5.5 4V2.5h3V4M3.5 4l.6 7.5h5.8L10.5 4"/></svg>', stift: '<svg viewBox="0 0 14 14"><path d="M9.5 2.5 11.5 4.5 5 11H3V9z"/></svg>',
  plus: '<svg viewBox="0 0 14 14"><path d="M7 2.5v9M2.5 7h9"/></svg>', haken: '<svg viewBox="0 0 14 14"><path d="m2.5 7.5 3 3 6-7"/></svg>',
  kopie: '<svg viewBox="0 0 14 14"><rect x="4.500" y="4.500" width="7" height="7" rx="1.200"/><path d="M9.500 4.500V3a.8.8 0 0 0-.8-.8H3A.8.8 0 0 0 2.200 3v5.700a.8.8 0 0 0 .8.8h1.500"/></svg>',
  ziehen: '<svg viewBox="0 0 14 14"><path d="M5 3h.01M9 3h.01M5 7h.01M9 7h.01M5 11h.01M9 11h.01"/></svg>',
};
/* Namen nur aus kleid/angelina.js (WO_HAUS.namen, eine Stelle) */
const NAME = (window.WO && WO.name('abendplan')) || 'Der Abendplan';
const klein = n => n.replace(/^(Das|Die|Der) /, a => a.toLowerCase());
const WEGE = (window.WO_HAUS && WO_HAUS.wege) || {};
const WEBSITE = '/angelina-strelow/website/index.html';   /* ihre Website, nur ansehen (Roberts Kette-Server) */
const API = '/angelina-strelow/werkzeuge/api/', EIGEN = '/angelina-strelow/werkzeuge/abendplan/api/';
const ICH = 'Angelina';   /* Fehlerbuch 10a (20.10.2026): kein «Wer arbeitet hier?», fester Eintrag im Protokoll */

/* Fotos nur aus ihrem Bestand (_haus/bild): je Abend eins passend zum Anlass, je Punkt des Ablaufs eins zur Art, je Getränk eins zur Art.
   Ein Foto nie in jeder Zeile gleich (Master 3, Fehlerbuch 10a). */
const FOTO_ABEND = { 'a-251214-kt': 'p136', 'a-260918-hb': 'festtafel', 'a-261009-mw': 'empfang', 'a-261014-sk': 'tafel', 'a-261020-cl': 'kerzen', 'a-261022-rf': 'tisch', 'a-260929-js': 'p140', 'a-261006-ew': 'p150' };
const FOTO_ANLASS = { 'Privates Dinner': 'tafel', 'Geburtstag': 'empfang', 'Jubiläum': 'festtafel', 'Feier zu Hause': 'p151' };
/* Prüfung 05.11.2026 (17), Master 3: ein Gang oder Wein zeigt nur ein Foto, das ihn wirklich zeigt; das gibt es nicht, also trägt die Rubrik ihr Bild (Gänge: Angelina serviert, Wein: sie schenkt ein).
   Punkte des Ablaufs zeigen den Moment (Empfang, Einschenken, Tafel, Servieren, Kerze, Abschied), jedes Foto nur einmal im Vorrat. */
const FOTO_ART = { ankommen: ['studio-fenster', 'hintergrund', 'studio'], empfang: ['empfang', 'einschenken'], aperitif: ['p151', 'p156'], platz: ['festtafel', 'tafel', 'p150'],
  gang: ['gang', 'p155'], programm: ['p140', 'p136'], dessert: ['kerze'], digestif: ['glas'], abschied: ['raum', 'p158'], aufraeumen: ['p152'], sonst: ['p89', 'dunkel', 'p69'] };
const FOTO_RUBRIK = { gaenge: 'gang', weine: 'einschenken' };
/* Kein Foto zweimal untereinander (Fehlerbuch 10a 20.10.2026): je Liste das erste noch freie Foto aus dem Vorrat der Art, sonst eins, das nicht wie die Zeile davor ist */
let BENUTZT = [];
function waehleFoto(vorrat) { const v = vorrat || ['kerzen']; let f = v[0], am = Infinity; for (const x of v) { const i = BENUTZT.lastIndexOf(x); if (i < 0) { f = x; break; } if (i < am) { am = i; f = x; } } BENUTZT.push(f); return f; }
const bild = (k, gr = 640) => `/angelina-strelow/werkzeuge/assets/bild/${k}-${gr}.webp`;
const fotoAbend = a => FOTO_ABEND[a.id] || FOTO_ANLASS[(a.anfrage || {}).anlass] || 'tafel';

const ARTEN = [['ankommen', 'Ankommen'], ['empfang', 'Empfang'], ['aperitif', 'Aperitif, Flying Buffet'], ['platz', 'Platz nehmen'], ['gang', 'Gang'], ['programm', 'Rede, Programm'],
  ['dessert', 'Dessert'], ['digestif', 'Digestif, Kaffee'], ['abschied', 'Abschied'], ['aufraeumen', 'Aufräumen'], ['sonst', 'Sonst']];
const WER = [['angelina', 'Ich'], ['gastgeber', 'Gastgeber'], ['caterer', 'Caterer'], ['gaeste', 'Gäste'], ['alle', 'Alle zusammen'], ['musik', 'Musik']];
const WEINART = [['sekt', 'Sekt, Champagner'], ['weiss', 'Weisswein'], ['rose', 'Rosé'], ['rot', 'Rotwein'], ['suess', 'Süsswein'], ['alkoholfrei', 'Alkoholfrei'], ['wasser', 'Wasser'], ['digestif', 'Digestif']];
const ANLASS_VORLAGE = { 'Privates Dinner': 'dinner', 'Geburtstag': 'geburtstag', 'Jubiläum': 'jubilaeum', 'Feier zu Hause': 'feier' };
const STATUS_TEXT = { anfrage: 'Anfrage', angebot: 'Angebot', zugesagt: 'Zugesagt', geplant: 'Geplant', vorbei: 'Vorbei', abgeschlossen: 'Abgeschlossen', abgesagt: 'Abgesagt' };
const wort = (liste, k) => (liste.find(x => x[0] === k) || [k, k || ''])[1];

let ALLE = [], ETAG = {}, VORL = null, Z = '', A = null, D = null, BASIS = '', OFFEN = false, UNDO = [], BLATT = 'gastgeber', BEREIT = false, BLITZ = null, TIMER = null;
let ZOOM = 0.62;
try { BLATT = localStorage.getItem('ap-blatt') || 'gastgeber'; ZOOM = +(localStorage.getItem('ap-zoom') || 0.62); } catch (e) { /* ohne Speicher geht es auch */ }

// ---------------------------------------------------------------- Verbindung
async function api(weg, methode, daten) {
  const o = methode ? { method: methode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(daten || {}) } : { cache: 'no-store' };
  let r;
  try { r = await fetch(weg, o); } catch (e) { const f = new Error('Keine Verbindung. Deine Eingaben sind noch da; bitte gleich noch einmal versuchen.'); f.stichwort = 'VERBINDUNG'; throw f; }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const m = /^([A-ZÄÖÜ]+) · (.*)$/.exec(j.fehler || ''), e = new Error(m ? m[2] : (j.fehler || 'Das hat nicht geklappt.'));
    e.stichwort = m ? m[1] : ''; e.status = r.status; throw e;
  }
  return j;
}
function sag(titel, text = '', knoepfe = [], fehl = false, dauer = 0) {
  const m = document.createElement('div');
  m.className = 'quit' + (fehl ? ' fehl' : '');
  m.innerHTML = `<div style="flex:1;min-width:0"><b>${h(titel)}</b>${text ? `<span>${h(text)}</span>` : ''}</div>` + knoepfe.map((k, i) => k.href ? `<a href="${h(k.href)}" target="_blank" rel="noopener">${h(k.t)}</a>` : `<button type="button" data-i="${i}">${h(k.t)}</button>`).join('')
    + '<button type="button" class="quit__zu" data-zu-q aria-label="Schliessen">×</button>';
  m.addEventListener('click', ev => { if (ev.target.closest('[data-zu-q]')) return m.remove(); const b = ev.target.closest('button[data-i]'); if (b) { knoepfe[+b.dataset.i].f(); m.remove(); } });
  const ort = $('#meldung');
  [...ort.children].forEach(x => { if (x.textContent === m.textContent) x.remove(); });
  ort.appendChild(m);
  while (ort.children.length > 3) ort.firstElementChild.remove();   /* R11: höchstens drei übereinander */
  setTimeout(() => m.remove(), dauer || (fehl ? 12000 : 9000));
}
const fehlerSagen = (titel, e) => sag(titel, e.message + (e.stichwort ? ` (${e.stichwort})` : ''), e.stichwort ? [{ t: 'Was tun?', href: '/angelina-strelow/werkzeuge/abendplan/anleitung.html#' + e.stichwort }] : [], true);

// ---------------------------------------------------------------- Zeit und Datum (Gerät des Betrachters, Fehlerbuch 10a 21.10.2026)
const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const heute = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const jetztZeit = () => { const d = new Date(); return heute() + `T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const teile = s => (s || '').split('-').map(Number);
function datumLang(s, mitTag = true) { if (!s) return ''; const [y, m, d] = teile(s); const w = new Date(y, m - 1, d).getDay(); return (mitTag ? TAGE[w] + ', ' : '') + d + '. ' + MONATE[m - 1] + ' ' + y; }
function datumKurz(s) { if (!s) return ''; const [y, m, d] = teile(s); return `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`; }
function tageBis(s) { if (!s) return null; const [y, m, d] = teile(s), [a, b, c] = teile(heute()); return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(a, b - 1, c)) / 864e5); }
function tageText(n) { return n == null ? '' : n === 0 ? 'heute' : n === 1 ? 'morgen' : n > 1 ? `in ${n} Tagen` : n === -1 ? 'gestern' : `vor ${-n} Tagen`; }
const zeitOk = z => /^([01]?\d|2[0-3]):[0-5]\d$/.test(z || '');
const minuten = z => { const [a, b] = (z || '0:0').split(':').map(Number); return a * 60 + b; };
const alsZeit = m => { m = ((m % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };
const zeitForm = z => { const m = /^(\d{1,2})[:.,h ]?(\d{2})?$/.exec(String(z || '').trim()); if (!m) return String(z || '').trim(); const a = +m[1], b = +(m[2] || 0); return a < 24 && b < 60 ? `${String(a).padStart(2, '0')}:${String(b).padStart(2, '0')}` : String(z).trim(); };

// ---------------------------------------------------------------- Abende
const kommend = a => ['zugesagt', 'geplant'].includes(a.status) && (tageBis((a.anfrage || {}).datum) ?? 1) >= 0;
const vergangen = a => ['vorbei', 'abgeschlossen'].includes(a.status) || (['zugesagt', 'geplant'].includes(a.status) && tageBis((a.anfrage || {}).datum) < 0);
const imWerkzeug = a => kommend(a) || vergangen(a);
const anlassVon = a => (a.anfrage || {}).anlass || 'Abend';
const gastgeberVon = a => (a.gastgeber || {}).name || 'Gastgeber';
const anrede = a => { const n = gastgeberVon(a); return /^Familie /.test(n) ? n : n.split(' und ').map(x => x.trim().split(/\s+/)[0]).join(' und '); };
const mehrere = a => / und |^Familie /.test(gastgeberVon(a));
/* Du oder ihr: die Nachricht spricht einen Gastgeber mit du an, ein Paar oder eine Familie mit ihr (Angelina duzt) */
const DU = { dir: ['dir', 'euch'], dich: ['dich', 'euch'], dein: ['dein', 'euer'], deine: ['deine', 'eure'], deinen: ['deinen', 'euren'], du: ['du', 'ihr'], moechtest: ['möchtest', 'möchtet'], Schau: ['Schau', 'Schaut'], sag: ['sag', 'sagt'], Magst: ['Magst', 'Mögt'] };
function vorlageFuer(a) {
  const d = (a.anfrage || {}).datum || '';
  if (/-12-31$/.test(d)) return 'silvester';
  return ANLASS_VORLAGE[anlassVon(a)] || 'dinner';
}
function gaesteZahl(a) { const g = String((a.anfrage || {}).gaeste || ''); const m = /(\d+)/.exec(g); return m ? +m[1] : 0; }
function istBestaetigt(p) { return !!(p && p.abstimmung && p.abstimmung.bestaetigt_am); }

/* Neuer Plan aus der Vorlage des Anlasses: Ablauf mit Uhrzeiten, Gänge aus den Gang-Punkten, Packliste, Bereitstellen. Nichts Erfundenes über den Gastgeber. */
function neuerPlan(a) {
  const k = vorlageFuer(a), v = VORL.anlaesse.find(x => x.k === k) || VORL.anlaesse[0];
  const p = { beispiel: !!a.beispiel, vorlage: k, titel: anlassVon(a), ankunft: '', gaeste_ab: v.gaeste_ab, ende: '', gruss: VORL.texte.gruss[0],
    ablauf: [], gaenge: [], weine: [], gaeste: [], vorort: { adresse: (a.anfrage || {}).ort || '', anfahrt: '', parken: '', klingel: '', ansprech: gastgeberVon(a), kueche: {}, garderobe: '', tisch: '', raum: '', stellt: VORL.stellt.slice() },
    packliste: VORL.packliste.map((w, i) => ({ id: 'k' + (i + 1), was: w, hat: false })), abstimmung: {}, intern: '', stand: '', fassung: 0 };
  ablaufAusVorlage(p, v);
  return p;
}
function ablaufAusVorlage(p, v) {
  const ab = minuten(p.gaeste_ab || v.gaeste_ab);
  let gi = 0;
  p.ablauf = v.punkte.map((x, i) => {
    const pt = { id: 'p' + (i + 1), zeit: alsZeit(ab + x.ab), dauer: x.dauer, art: x.art, was: x.was, wer: x.wer, notiz: x.notiz || '' };
    if (x.intern) pt.intern = true;
    if (x.art === 'gang' || x.art === 'dessert') {
      let g = p.gaenge[gi];
      if (!g && x.art === 'gang') { g = { id: neueId(p.gaenge, 'g'), name: x.was, gericht: '', beschreibung: '', koch: x.wer === 'caterer' ? 'Caterer' : '', zeit: pt.zeit, hinweis: '' }; p.gaenge.push(g); }
      if (g) { pt.gang = g.id; gi++; }
    }
    return pt;
  });
  p.ankunft = p.ablauf.length ? p.ablauf[0].zeit : '';
  const letzt = p.ablauf.filter(x => x.art === 'abschied').pop(); p.ende = letzt ? alsZeit(minuten(letzt.zeit) + (+letzt.dauer || 0)) : '';
  p.vorlage = v.k;
}
function neueId(liste, vor) { let n = liste.length + 1; while (liste.some(x => x.id === vor + n)) n++; return vor + n; }

/* Was noch fehlt (ruhig benannt, Auftrag Nr. 1): je Bereich höchstens ein Satzteil */
function offen(a, p) {
  const f = [];
  if (!p) return ['der Plan selbst'];
  if (p.belegt) return [];
  if (!(p.ablauf || []).length) f.push('der Ablauf'); else if ((p.ablauf || []).some(x => !zeitOk(x.zeit))) f.push('Uhrzeiten im Ablauf');
  const g = p.gaenge || [];
  if (!g.length) f.push('die Gänge'); else if (g.some(x => !String(x.gericht || '').trim())) f.push('ein Gericht');
  const ohneWein = g.filter(x => !(p.weine || []).some(w => w.zu === x.id) && !/süss|dessert/i.test(x.name || ''));
  if (!(p.weine || []).some(w => w.zu === 'empfang')) f.push('das Getränk zum Empfang'); else if (ohneWein.length) f.push(ohneWein.length === 1 ? `der Wein zu «${ohneWein[0].name}»` : 'Weine zu Gängen');
  const n = gaesteZahl(a), q = (p.gaeste || []).length;
  if (!q) f.push('die Gästeliste'); else if (n && q < n && (a.anfrage || {}).gaeste !== 'mehr' && q < n - 4) f.push(`Gäste (${q} von bis ${n})`);
  const vo = p.vorort || {}, ku = vo.kueche || {};
  if (!String(vo.adresse || '').trim() || !/\d/.test(vo.adresse || '')) f.push('die Adresse');
  if (!Object.values(ku).some(x => String(x || '').trim())) f.push('die Küche vor Ort');
  const pk = (p.packliste || []).filter(x => !x.hat).length;
  if (pk && (tageBis((a.anfrage || {}).datum) ?? 99) <= 7 && kommend(a)) f.push(`${pk} Dinge einpacken`);
  const ab = p.abstimmung || {};
  if (!ab.bestaetigt_am) f.push(ab.gesendet ? 'die Bestätigung des Gastgebers' : '«Dein Abend» an den Gastgeber');
  return f;
}
function offenSatz(a, p) {
  const f = offen(a, p);
  if (p && p.belegt) return 'Nur Belegtes eingetragen.';
  if (!f.length) return istBestaetigt(p) ? 'Alles steht, vom Gastgeber bestätigt.' : 'Alles steht.';
  return 'Noch offen: ' + (f.length > 1 ? f.slice(0, -1).join(', ') + ' und ' + f[f.length - 1] : f[0]) + '.';
}

/* Was der Gastgeber bestätigt hat (gleich wie beispiel/plan_bau.py abdruck()) und was sich seither geändert hat */
function abdruck(p) {
  const nimm = (l, ks) => (l || []).map(x => Object.fromEntries(ks.map(k => [k, x[k] ?? ''])));
  return { ablauf: nimm((p.ablauf || []).filter(x => !x.intern), ['id', 'zeit', 'was', 'wer']), gaenge: nimm(p.gaenge, ['id', 'name', 'gericht', 'koch']),
    weine: nimm(p.weine, ['id', 'zu', 'name', 'weingut', 'jahrgang']), gaeste: nimm(p.gaeste, ['id', 'name', 'unvertraeglich', 'vorlieben', 'platz']) };
}
function unterschiede(alt, neu) {   /* je Bereich: neu, entfernt, geändert, mit lesbarem Namen */
  const B = { ablauf: ['Ablauf', x => `${x.zeit ? x.zeit + ' ' : ''}${x.was}`], gaenge: ['Gang', x => x.name + (x.gericht ? ': ' + x.gericht : '')],
    weine: ['Getränk', x => [x.name, x.weingut, x.jahrgang].filter(Boolean).join(', ') || 'ohne Angabe'], gaeste: ['Gast', x => x.name] };
  const aus = [];
  if (!alt) return aus;
  Object.keys(B).forEach(k => {
    const a = alt[k] || [], b = neu[k] || [], [wo, t] = B[k];
    b.forEach(x => { const y = a.find(z => z.id === x.id); if (!y) aus.push({ wo, art: 'neu', vorher: '', nachher: t(x) }); else if (JSON.stringify(y) !== JSON.stringify(x)) aus.push({ wo, art: 'geändert', vorher: t(y) + felderText(k, y, x), nachher: t(x) + felderText(k, x, y) }); });
    a.forEach(y => { if (!b.some(z => z.id === y.id)) aus.push({ wo, art: 'entfernt', vorher: t(y), nachher: '' }); });
  });
  return aus;
}
function felderText(k, x, y) {   /* bei Gästen auch Unverträglichkeit, Vorlieben, Platz zeigen, wenn sie sich unterscheiden */
  if (k !== 'gaeste') return '';
  const t = [];
  if (x.unvertraeglich !== y.unvertraeglich) t.push(x.unvertraeglich ? 'verträgt ' + x.unvertraeglich + ' nicht' : 'keine Unverträglichkeit');
  if (x.vorlieben !== y.vorlieben) t.push(x.vorlieben || 'keine Vorlieben');
  if (x.platz !== y.platz) t.push(x.platz ? 'Platz ' + x.platz : 'ohne Platz');
  return t.length ? ' (' + t.join(', ') + ')' : '';
}

// ---------------------------------------------------------------- Kopfleiste, Rand, Bühne
function oben() {
  const el = $('#oben'); if (!el) return;
  const st = !Z ? `${ALLE.filter(kommend).length} kommende Abende` : OFFEN ? 'Nicht gespeichert' : istBestaetigt(D) ? 'Vom Gastgeber bestätigt' : (D && D.abstimmung && D.abstimmung.gesendet) ? 'Beim Gastgeber' : 'In Arbeit';
  el.innerHTML = WO.kopf({ werkzeug: 'abendplan', unter: 'Abende', titel: Z && A ? `${gastgeberVon(A)} · ${datumKurz(A.anfrage.datum)}` : 'Übersicht', markeHref: '/angelina-strelow/werkzeuge/abendplan/', marke: 'data-gehe="start"',
    stand: st, pruefung: '/angelina-strelow/werkzeuge/abendplan/pruefung.html', anleitung: '/angelina-strelow/werkzeuge/abendplan/anleitung.html', website: WEBSITE });
  const m = $('.wo-marke-w', el); if (m) m.setAttribute('aria-label', NAME + ' · Übersicht');
  /* wie im Vorbild: Protokoll und Zustand im Kopf (R05) */
  const r = $('.wo-kopf__r', el), tr = r && $('.wo-trenn', r);
  if (tr) tr.insertAdjacentHTML('beforebegin', `<button class="wo-kn wo-kn--rund" type="button" data-akt="protokoll" title="Protokoll" aria-label="Protokoll">${WO.ic('verlauf')}</button><button class="zustand${STATUS_ROT ? ' rot' : ''}" type="button" data-akt="gesund"><span>${STATUS_ROT ? 'Prüfen' : 'Alles in Ordnung'}</span></button>`);
}
let STATUS_ROT = false;
async function protokollFenster() {
  let l = []; try { l = (await api(API + 'protokoll')).eintraege.filter(x => ['plan', 'kern'].includes(x.bereich) && (Z ? (x.was || '').includes(Z) : / · a-/.test(x.was || ''))).slice(0, 40).map(x => ({ zeit: (x.zeit || '').replace('T', ' ').slice(0, 16), wer: x.wer, was: x.was || '' })); } catch (e) { return fehlerSagen('Protokoll nicht lesbar', e); }
  const name = was => { const a = ALLE.find(x => was.includes(x.id)); return a ? ' · ' + gastgeberVon(a) : ''; };
  fenster(`<h2>Wer hat was <em>getan?</em></h2><p class="satz">Die letzten Einträge zu ${Z ? 'diesem Plan' : 'den Plänen'}, neueste zuerst.</p><div class="prot">${l.map(x => `<div><span class="mono">${h(x.zeit)}</span><span>${h(x.wer || 'Angelina')}: ${h(x.was.replace(/ · a-[\w-]+$/, ''))}${h(name(x.was))}</span></div>`).join('') || '<p class="satz">Noch nichts gespeichert.</p>'}</div>
    <div class="fenster__kn"><button class="kn kn--hell" type="button" data-zu>Schliessen</button></div>`, true);
}
async function gesundFenster() {
  let g; try { g = await api(EIGEN + 'gesund'); } catch (e) { STATUS_ROT = true; oben(); return fehlerSagen('Zustand nicht lesbar', e); }
  STATUS_ROT = !(g.schreibbar && g.node && g.playwright && g.schriften && g.vorlagen); oben();
  const z = (t, ok, w) => `<div><span>${h(t)}</span><b class="${ok ? 'ja' : 'nein'}">${h(w || (ok ? 'in Ordnung' : 'fehlt'))}</b></div>`;
  fenster(`<h2>Ist alles <em>in Ordnung?</em></h2><p class="satz">Der Zustand des Werkzeugs, direkt vom Server gelesen.</p><div class="gesund">${z('Daten schreibbar', g.schreibbar)}${z('Pläne', true, g.plaene + ' Pläne')}${z('Frühere Fassungen', true, String(g.verlauf))}${z('Druck der PDF', g.node && g.playwright)}${z('Feste Schriften für das PDF', g.schriften)}${z('Vorlagen je Anlass', g.vorlagen)}${z('Fehler mitgeschrieben', !g.fehler, String(g.fehler))}</div>
    <div class="fenster__kn"><button class="kn kn--hell" type="button" data-zu>Schliessen</button><a class="kn" href="/angelina-strelow/werkzeuge/abendplan/pruefung.html" target="_blank" rel="noopener">Prüfung öffnen<i>${PF}</i></a></div>`);
}
function randKachel(a) {
  const p = a.plan, n = tageBis(a.anfrage.datum), unter = kommend(a) ? `${datumKurz(a.anfrage.datum)} · ${tageText(n)}` : `${datumKurz(a.anfrage.datum)} · ${anlassVon(a)}`;
  const marke = a.id === Z && OFFEN ? '<em class="wo-marke">Offen</em>' : '';
  return `<li><button class="wo-rk kw" type="button" data-z="${a.id}" aria-current="${a.id === Z}"><span class="wo-rk__b" style="background-image:url('${bild(fotoAbend(a))}')"></span><span class="wo-rk__t"><b>${h(gastgeberVon(a))}</b><small>${h(unter)}</small></span>${marke}${kommend(a) && offen(a, p).length ? `<b class="wo-zahl" title="${h(offenSatz(a, p))}">${offen(a, p).length}</b>` : ''}</button></li>`;
}
function rand() {
  const k = ALLE.filter(kommend), v = ALLE.filter(vergangen).reverse();
  const bereiche = Z && D ? [
    ['ablauf', 'Ablauf', (D.ablauf || []).filter(x => !zeitOk(x.zeit)).length], ['gaenge', 'Gänge und Wein', 0], ['gaeste', 'Gäste', 0], ['vorort', 'Vor Ort', 0], ['packliste', 'Packliste', (D.packliste || []).filter(x => !x.hat).length], ['abstimmung', 'Abstimmung', istBestaetigt(D) ? 0 : 1]]
    .map(([t, tx, z]) => ({ text: tx, zahl: z && !D.belegt ? z : 0, attr: `data-spring="${t}"` })) : [];
  const wege = [{ text: 'Frühere Fassungen', attr: 'data-akt="verlauf"' }, { text: 'Vorlagen je Anlass', attr: 'data-akt="vorlagen"' },
    { text: 'Arbeitsblatt am Handy', href: `/angelina-strelow/werkzeuge/abendplan/handy.html${Z ? '#' + Z : ''}`, attr: 'target="_blank" rel="noopener"' }, { text: 'Kurzer Rundgang', attr: 'data-akt="rundgang"' }];
  $('#rand').innerHTML = `<div class="wo-rand__g abende"><ul><li><button class="wo-re${!Z ? ' wo-an' : ''}" type="button" data-z=""${!Z ? ' aria-current="true"' : ''}><span>Übersicht</span><b class="wo-zahl">${k.length}</b></button></li></ul>
      <p class="wo-mk">Kommende Abende</p><ul>${k.map(randKachel).join('') || '<li class="leer-z">Kein Abend zugesagt.</li>'}</ul>
      <p class="wo-mk kw-gruppe">Vergangene Abende</p><ul>${v.map(randKachel).join('')}</ul></div>
    ${bereiche.length ? WO.rand([{ titel: 'Dieser Abend', eintraege: bereiche }]).replace('<div class="wo-rand__g">', '<div class="wo-rand__g bereiche">') : ''}
    ${WO.rand([{ titel: 'Wege', eintraege: wege }], { website: WEBSITE, anleitung: '/angelina-strelow/werkzeuge/abendplan/anleitung.html', pruefung: '/angelina-strelow/werkzeuge/abendplan/pruefung.html' }).replace('<div class="wo-rand__g">', '<div class="wo-rand__g wege">')}`;
  oben();
}
function kopf() {
  const neu = kopf.letzte !== Z; kopf.letzte = Z;
  if (!Z) {
    const k = ALLE.filter(kommend), n = k[0], b = ALLE.filter(a => a.beispiel).length;
    $('#kopf').innerHTML = WO.startbild({ werkzeug: 'abendplan', art: 'buehne', foto: bild('raum', 1000), zier: `${h(NAME)} · Übersicht`,
      h1: `<span data-wo-gruss>${h(WO.gruss())}</span> <em>Deine Abende.</em>`, satz: h(WO_HAUS.saetze.abendplan),
      knoepfe: (n ? WO.knopf(`${h(gastgeberVon(n))} öffnen`, 'pfeil', 'gold', { attr: `data-z="${n.id}"` }) : '')
        + (b ? `<p class="kopf__bsp">Beispiele: ${b === ALLE.length - 1 ? 'alle Abende ausser dem von Klaus und Tanja (Dezember 2025), der ist echt' : b + ' Abende'}.</p>` : '')
        + `<dl class="kopf__zahlen"><div><dt>Kommende Abende</dt><dd>${k.length}</dd></div><div><dt>Der nächste</dt><dd>${n ? h(tageText(tageBis(n.anfrage.datum))) : '–'}</dd></div><div><dt>Bestätigt</dt><dd>${k.filter(a => istBestaetigt(a.plan)).length} von ${k.length}</dd></div></dl>` });
  } else {
    const n = tageBis(A.anfrage.datum), ab = D.abstimmung || {};
    const satz = D.belegt ? 'Dieser Abend ist echt. Eingetragen ist nur, was belegt ist: Sektempfang, Flying Buffet, die Sitzordnung als Memory-Spiel, drei Gänge von Klaus, abgestimmte Weine.'
      : vergangen(A) ? `Der Abend ist vorbei. So war er geplant${ab.bestaetigt_am ? `, bestätigt am ${datumKurz(ab.bestaetigt_am)}` : ''}.`
      : istBestaetigt(D) ? `Vom Gastgeber bestätigt am ${datumKurz(ab.bestaetigt_am)}. Jede Änderung danach steht unter «Abstimmung» und auf dem Arbeitsblatt.`
      : 'Trag ein, was ihr im Vorgespräch besprochen habt. Jede Eingabe steht sofort auf dem Blatt; «Dein Abend» geht zum Bestätigen an den Gastgeber.';
    const vorbeiKn = ['zugesagt', 'geplant'].includes(A.status) && n < 0 ? WO.knopf('Als vorbei markieren', 'haken', 'gold', { attr: 'data-akt="vorbei"' }) : '';
    const kn = vorbeiKn || (istBestaetigt(D) || vergangen(A) ? WO.knopf('Arbeitsblatt als PDF', 'pdf', 'gold', { attr: 'data-akt="pdf" data-art="arbeit"' }) : WO.knopf('«Dein Abend» als PDF', 'pdf', 'gold', { attr: 'data-akt="pdf" data-art="gastgeber"' }));
    $('#kopf').innerHTML = WO.startbild({ werkzeug: 'abendplan', art: 'buehne', foto: bild(fotoAbend(A), 1000), zier: `${h(NAME)} · ${h(anlassVon(A))}`,
      h1: `${h(gastgeberVon(A))} <em>${h(D.titel || anlassVon(A))}</em>`, satz: h(satz),
      knoepfe: kn + (A.beispiel ? '<p class="kopf__bsp">Beispiel: ein erfundener Abend, damit du siehst, wie ein ganzer Plan aussieht.</p>' : '')
        + `<dl class="kopf__zahlen"><div><dt>${h(datumLang(A.anfrage.datum).split(',')[0])}</dt><dd>${h(datumKurz(A.anfrage.datum))}</dd></div><div><dt>${n >= 0 ? 'Bis dahin' : 'Der Abend war'}</dt><dd>${n === 0 ? 'heute' : n > 0 ? n + (n === 1 ? ' Tag' : ' Tage') : 'vor ' + -n + (n === -1 ? ' Tag' : ' Tagen')}</dd></div><div><dt>Gäste</dt><dd>${(D.gaeste || []).length || h((A.anfrage || {}).gaeste || '–')}</dd></div></dl>` });
  }
  const sb = $('#kopf .wo-sb'); if (sb && neu) sb.classList.add('auftritt');
  const img = $('#kopf .wo-sb__foto img'); if (img) { img.alt = Z ? 'Angelina bei einem Abend' : WO_HAUS.fotoAlt; }
}

// ---------------------------------------------------------------- Liste: Übersicht
function uebersichtHTML() {
  const k = ALLE.filter(kommend), v = ALLE.filter(vergangen).reverse();
  const zeile = a => {
    const n = tageBis(a.anfrage.datum), p = a.plan;
    return `<div class="r r--bild r--abend" data-z-zeile="${a.id}"><span class="r__b" aria-hidden="true" data-bild="url('${bild(fotoAbend(a))}')"></span><div class="r__t" data-akt="oeffne" data-z="${a.id}"><small class="r__gang">${h(datumLang(a.anfrage.datum))}</small><b>${h(gastgeberVon(a))}</b><span class="r__lang">${h(anlassVon(a))} · ${h(a.anfrage.ort || '')}${a.anfrage.gaeste ? ' · ' + h(a.anfrage.gaeste) + ' Gäste' : ''}</span><span class="r__lang r__offen">${h(offenSatz(a, p))}</span></div><span class="r__p">${kommend(a) ? h(tageText(n)) : h(STATUS_TEXT[a.status] || '')}</span></div>`;
  };
  return `<div class="teil" data-teil="kommend" style="--i:0"><div class="teil__k"><b>Kommende Abende</b><span>${k.length} ${k.length === 1 ? 'Abend' : 'Abende'}</span></div>${k.map(zeile).join('') || '<p class="leer">Noch kein Abend zugesagt. Sobald in «Anfragen & Angebote» ein Abend zugesagt ist, steht er hier.</p>'}</div>
    <div class="teil" data-teil="vergangen" style="--i:1"><div class="teil__k"><b>Vergangene Abende</b><span>${v.length} ${v.length === 1 ? 'Abend' : 'Abende'}</span></div>${v.map(zeile).join('')}</div>`;
}

// ---------------------------------------------------------------- Liste: ein Abend
/* Prüfung 05.11.2026 (7): jedes Feld hat ein Mass, damit nichts aus dem Blatt läuft (Sätze 400, lange Notizen 1500 Zeichen) */
const feld = (pfad, titel, wert, ph = '', lang = false) => `<label class="feld"><span>${h(titel)}</span><textarea class="mw-t${lang ? ' mw-lang' : ''}" rows="1" data-f="${pfad}" maxlength="${lang ? 1500 : 400}"${ph ? ` placeholder="${h(ph)}"` : ''}>${h(wert)}</textarea></label>`;
const knoepfeZeile = (art, extra = '') => `<div class="r__k">${extra}<button class="rund r__zieh" type="button" data-zieh title="Ziehen zum Verschieben" aria-label="Ziehen zum Verschieben">${SYM.ziehen}</button><button class="rund" type="button" data-akt="edit" title="Bearbeiten" aria-label="Bearbeiten">${SYM.stift}</button><button class="rund" type="button" data-akt="kopie" title="Kopieren" aria-label="Kopieren">${SYM.kopie}</button><button class="rund" type="button" data-akt="hoch" title="Nach oben" aria-label="Nach oben">${SYM.hoch}</button><button class="rund" type="button" data-akt="runter" title="Nach unten" aria-label="Nach unten">${SYM.runter}</button><button class="rund gefahr" type="button" data-akt="weg" title="Entfernen" aria-label="Entfernen">${SYM.korb}</button></div>`;
const chip = (t, grau) => `<span class="chip${grau ? ' grau' : ''}">${h(t)}</span>`;
function gangName(id) { const g = (D.gaenge || []).find(x => x.id === id); return g ? g.name : ''; }
function zuText(zu) { return zu === 'empfang' ? 'Zum Empfang' : zu === 'tisch' ? 'Den ganzen Abend' : zu === 'digestif' ? 'Zum Digestif' : gangName(zu) ? 'Zu «' + gangName(zu) + '»' : 'Ohne Zuordnung'; }
function weinZeile(w) { return [w.weingut, w.rebsorte && w.rebsorte !== w.name ? w.rebsorte : '', w.jahrgang, w.herkunft].filter(Boolean).join(' · '); }
function initialen(n) { return String(n || '?').replace(/^(Dr\.|Familie)\s+/, '').split(/\s+/).map(x => x[0] || '').slice(0, 2).join('').toUpperCase(); }
function achten(p) {   /* «Worauf ich achte»: aus der Gästeliste, ruhig zusammengefasst */
  const q = p.gaeste || [], t = [];
  const af = q.filter(x => x.alkoholfrei); if (af.length) t.push(`${af.length === 1 ? 'Ein Gast trinkt' : af.length + ' Gäste trinken'} keinen Alkohol: ${af.map(x => x.name).join(', ')}.`);
  q.filter(x => String(x.unvertraeglich || '').trim()).forEach(x => t.push(`${x.name} verträgt ${x.unvertraeglich} nicht.`));
  q.filter(x => /vegetar|vegan/i.test(x.vorlieben || '')).forEach(x => t.push(`${x.name} isst ${/vegan/i.test(x.vorlieben) ? 'vegan' : 'vegetarisch'}.`));
  const eg = q.filter(x => x.ehrengast); if (eg.length) t.push(`Ehrengast: ${eg.map(x => x.name).join(', ')}.`);
  q.filter(x => String(x.notiz || '').trim() && !x.unvertraeglich).slice(0, 3).forEach(x => t.push(`${x.name}: ${x.notiz}`));
  return t;
}
function abendHTML() {
  const p = D, B = p.belegt, ro = vergangen(A) ? ' data-vorbei' : '';
  const bildArt = x => waehleFoto(FOTO_ART[x.art]);
  BENUTZT = [fotoAbend(A)];
  /* Teil 1: der Abend in einem Satz */
  const t1 = `<div class="teil" data-teil="abend" style="--i:0"${ro}><div class="teil__k"><b>Der Abend</b><span>${h(datumLang(A.anfrage.datum))}</span></div><div class="mw-in">
    ${feld('titel', 'Name des Abends auf dem Blatt', p.titel, 'z. B. Das erste Essen beider Familien')}
    <div class="feld zw3">${feld('ankunft', 'Ich bin da um', p.ankunft, '16:30')}${feld('gaeste_ab', 'Gäste kommen um', p.gaeste_ab, '18:30')}${feld('ende', 'Abschied gegen', p.ende, '23:30')}</div>
    ${feld('gruss', 'Ein Satz an den Gastgeber, oben auf «Dein Abend»', p.gruss, VORL.texte.gruss[0])}
    <div class="feld"><span>Sätze zur Wahl</span><div class="chips" data-gruss>${VORL.texte.gruss.map(s => `<button type="button" data-v="${h(s)}" aria-pressed="${s === p.gruss}">${h(s)}</button>`).join('')}</div></div>
    <p class="mw-hinweis">Aus der Anfrage: ${h(anlassVon(A))}, ${h(A.anfrage.ort || '')}${A.anfrage.gaeste ? ', ' + h(A.anfrage.gaeste) + ' Gäste' : ''}. «${h(A.anfrage.wunsch || '')}»</p>
  </div></div>`;
  /* Teil 2: Ablauf */
  const ablauf = (p.ablauf || []).map((x, i) => `<div class="r r--bild${x.intern ? ' r--intern' : ''}" data-l="ablauf" data-id="${x.id}" data-k="ablauf.${x.id}"><span class="r__b" aria-hidden="true" data-bild="url('${bild(bildArt(x))}')"></span><div class="r__t" data-akt="waehle"><small class="r__gang">${x.zeit ? h(x.zeit) : 'ohne Zeit'}${+x.dauer ? ' · ' + h(x.dauer) + '&nbsp;Min.' : ''}</small><b>${h(x.was)}</b>${chip(wort(WER, x.wer))}${x.gang && gangName(x.gang) && gangName(x.gang) !== x.was ? chip(gangName(x.gang), true) : ''}${x.intern ? chip('nur für mich', true) : ''}${x.notiz ? `<span class="r__lang">${h(x.notiz)}</span>` : ''}</div>${knoepfeZeile('ablauf')}</div>`).join('');
  const t2 = `<div class="teil" data-teil="ablauf" style="--i:1"${ro}><div class="teil__k"><b>Ablauf des Abends</b><span>${(p.ablauf || []).length} Punkte${p.ankunft && p.ende ? ' · ' + h(p.ankunft) + ' bis ' + h(p.ende) : ''}</span></div>${ablauf || '<p class="leer">Noch kein Ablauf. Am schnellsten mit einer Vorlage für den Anlass.</p>'}
    <div class="neu-zeile">${WO.knopf('Punkt hinzufügen', 'plus', 'gold', { klein: true, attr: 'data-akt="neu" data-l="ablauf"' })}${WO.knopf('Aus Vorlage', 'pfeil', 'hell', { klein: true, attr: 'data-akt="vorlagen"' })}${(p.ablauf || []).length > 1 ? WO.knopf('Zeiten nachrechnen', 'uhr', 'hell', { klein: true, attr: 'data-akt="zeiten"' }) : ''}</div></div>`;
  /* Teil 3: Gänge und Wein */
  const gaenge = (p.gaenge || []).map(g => {
    const ws = (p.weine || []).filter(w => w.zu === g.id);
    return `<div class="r" data-l="gaenge" data-id="${g.id}" data-k="gaenge.${g.id}"><div class="r__t" data-akt="waehle"><small class="r__gang">${h(g.name)}${g.zeit ? ' · ' + h(g.zeit) : ''}</small><b>${h(g.gericht || (B ? 'nicht überliefert' : 'Gericht noch offen'))}</b>${g.koch ? chip('kocht: ' + g.koch) : ''}${g.beschreibung ? `<span class="r__lang">${h(g.beschreibung)}</span>` : ''}<span class="r__lang r__wein">${ws.length ? ws.map(w => h(w.name || w.notiz || 'Wein ohne Angabe') + (w.jahrgang ? ' ' + h(w.jahrgang) : '')).join(' · ') : 'Noch kein Wein dazu'}</span></div>${knoepfeZeile('gaenge')}</div>`;
  }).join('');
  const weinGruppen = [['empfang', 'Zum Empfang'], ...(p.gaenge || []).map(g => [g.id, g.name]), ['tisch', 'Den ganzen Abend'], ['digestif', 'Zum Digestif']];
  const weine = weinGruppen.map(([zu, t]) => (p.weine || []).filter(w => w.zu === zu).map(w => `<div class="r" data-l="weine" data-id="${w.id}" data-k="weine.${w.id}"><div class="r__t" data-akt="waehle"><small class="r__gang">${h(t)} · ${h(wort(WEINART, w.art) || 'Wein')}</small><b>${h(w.name || (B ? 'nicht überliefert' : 'ohne Angabe'))}</b>${w.art === 'alkoholfrei' ? chip('alkoholfrei') : ''}<span class="r__lang">${h(weinZeile(w) || w.notiz || '')}</span>${w.temperatur || w.oeffnen ? `<span class="r__lang r__mono">${[w.temperatur, w.oeffnen ? 'öffnen ' + w.oeffnen : ''].filter(Boolean).map(h).join(' · ')}</span>` : ''}</div>${knoepfeZeile('weine')}</div>`).join('')).join('')
    + (p.weine || []).filter(w => !weinGruppen.some(([z]) => z === w.zu)).map(w => `<div class="r" data-l="weine" data-id="${w.id}" data-k="weine.${w.id}"><div class="r__t" data-akt="waehle"><small class="r__gang">Ohne Zuordnung</small><b>${h(w.name || 'ohne Angabe')}</b></div>${knoepfeZeile('weine')}</div>`).join('');
  const koeche = [...new Set((p.gaenge || []).map(g => g.koch).filter(Boolean))], wz = (p.weine || []).filter(w => gangName(w.zu)).length;
  const rubrik = (k, kl, gr, sp) => `<div class="r r--bild r--rubrik-bild" data-k="${k}"><span class="r__b" aria-hidden="true" data-bild="url('${bild(FOTO_RUBRIK[k])}')"></span><div class="r__t"><small class="r__gang">${h(kl)}</small><b>${h(gr)}</b>${sp ? `<span class="r__lang">${h(sp)}</span>` : ''}</div></div>`;
  const t3 = `<div class="teil" data-teil="gaenge" style="--i:2"${ro}><div class="teil__k"><b>Gänge</b><span>${(p.gaenge || []).length} ${(p.gaenge || []).length === 1 ? 'Gang' : 'Gänge'}</span></div>${rubrik('gaenge', 'Das Menü', koeche.length ? 'Gekocht von ' + (koeche.length > 1 ? koeche.slice(0, -1).join(', ') + ' und ' + koeche[koeche.length - 1] : koeche[0]) : 'Wer kocht, steht noch offen', 'Ich trage auf, räume ab und halte die Zeiten.')}${gaenge || '<p class="leer">Noch keine Gänge.</p>'}
    <div class="neu-zeile">${WO.knopf('Gang hinzufügen', 'plus', 'gold', { klein: true, attr: 'data-akt="neu" data-l="gaenge"' })}</div></div>
    <div class="teil" data-teil="weine" style="--i:3"${ro}><div class="teil__k"><b>Wein und Getränke</b><span>${(p.weine || []).length} Getränke</span></div>${rubrik('weine', 'Ich schenke ein', wz ? `${wz} ${wz === 1 ? 'Getränk' : 'Getränke'} zu den Gängen` : 'Noch kein Wein zu einem Gang', (p.weine || []).some(w => w.art === 'alkoholfrei') ? 'Mit Begleitung ohne Alkohol.' : '')}${weine || '<p class="leer">Noch keine Getränke.</p>'}
    <div class="neu-zeile">${WO.knopf('Getränk hinzufügen', 'plus', 'gold', { klein: true, attr: 'data-akt="neu" data-l="weine"' })}</div></div>`;
  /* Teil 4: Gäste */
  const ach = achten(p);
  const gaeste = (p.gaeste || []).map(q => `<div class="r r--bild r--gast" data-l="gaeste" data-id="${q.id}" data-k="gaeste.${q.id}"><span class="r__b r__mono-b" aria-hidden="true"><i>${h(initialen(q.name))}</i></span><div class="r__t" data-akt="waehle"><small class="r__gang">${q.platz ? 'Platz ' + h(q.platz) + ' · ' : ''}${h(q.beziehung || '')}</small><b>${h(q.name)}</b>${q.ehrengast ? chip('Ehrengast') : ''}${q.alkoholfrei ? chip('ohne Alkohol') : ''}${q.unvertraeglich ? chip('ohne ' + q.unvertraeglich, true) : ''}${q.vorlieben && !q.alkoholfrei ? `<span class="r__lang">${h(q.vorlieben)}</span>` : ''}${q.notiz ? `<span class="r__lang r__intern">${h(q.notiz)}</span>` : ''}</div>${knoepfeZeile('gaeste')}</div>`).join('');
  const t4 = `<div class="teil" data-teil="gaeste" style="--i:4"${ro}><div class="teil__k"><b>Gäste</b><span>${(p.gaeste || []).length} ${(p.gaeste || []).length === 1 ? 'Gast' : 'Gäste'}${gaesteZahl(A) ? ' · angefragt bis ' + gaesteZahl(A) : ''}</span></div>
    ${ach.length ? `<div class="achte"><p class="mw-name">Worauf ich achte</p><ul>${ach.map(x => `<li>${h(x)}</li>`).join('')}</ul></div>` : ''}${gaeste || `<p class="leer">${B ? 'Die Gäste sind nicht überliefert.' : 'Noch keine Gäste eingetragen.'}</p>`}
    <div class="neu-zeile">${WO.knopf('Gast hinzufügen', 'plus', 'gold', { klein: true, attr: 'data-akt="neu" data-l="gaeste"' })}</div></div>`;
  /* Teil 5: Vor Ort */
  const vo = p.vorort || {}, ku = vo.kueche || {};
  const t5 = `<div class="teil" data-teil="vorort" style="--i:5"${ro}><div class="teil__k"><b>Vor Ort</b><span>${h((vo.adresse || '').split(',').pop().trim() || 'Adresse offen')}</span></div><div class="mw-in">
    ${feld('vorort.adresse', 'Adresse', vo.adresse, 'Strasse, Ort')}
    <div class="feld zw2">${feld('vorort.anfahrt', 'Anfahrt', vo.anfahrt, 'wie hinkommen')}${feld('vorort.parken', 'Parken', vo.parken, 'wo das Auto steht')}</div>
    <div class="feld zw2">${feld('vorort.klingel', 'Klingel und Eingang', vo.klingel, 'Name, Eingang')}${feld('vorort.ansprech', 'Ansprechpartner am Abend', vo.ansprech, 'Name, Telefon')}</div>
    <p class="mw-gang">Küche</p>
    <div class="feld zw2">${feld('vorort.kueche.glaeser', 'Gläser', ku.glaeser, 'wo sie stehen')}${feld('vorort.kueche.geschirr', 'Geschirr', ku.geschirr)}</div>
    <div class="feld zw2">${feld('vorort.kueche.besteck', 'Besteck', ku.besteck)}${feld('vorort.kueche.kuehlschrank', 'Kühlschrank, Getränke', ku.kuehlschrank)}</div>
    <div class="feld zw2">${feld('vorort.kueche.ofen', 'Ofen, Warmhalten', ku.ofen)}${feld('vorort.kueche.spuele', 'Spüle, Spülmaschine', ku.spuele)}</div>
    ${feld('vorort.kueche.notiz', 'Sonst in der Küche', ku.notiz, '', true)}
    <p class="mw-gang">Raum</p>
    <div class="feld zw2">${feld('vorort.garderobe', 'Garderobe', vo.garderobe)}${feld('vorort.raum', 'Empfang und Räume', vo.raum)}</div>
    ${feld('vorort.tisch', 'Tisch', vo.tisch, 'Form, Plätze, Licht')}
    ${feld('vorort.stellt', 'Was der Gastgeber bereitstellt (eine Zeile je Sache)', (vo.stellt || []).join('\n'), '', true)}
  </div></div>`;
  /* Teil 6: Packliste */
  const pk = p.packliste || [], da = pk.filter(x => x.hat).length;
  const t6 = `<div class="teil" data-teil="packliste" style="--i:6"${ro}><div class="teil__k"><b>Was ich mitbringe</b><span>${da} von ${pk.length} eingepackt</span></div><div class="mw-in pack">
    ${pk.map(x => `<div class="pack__z" data-l="packliste" data-id="${x.id}"><span class="schalter" role="switch" tabindex="0" aria-checked="${!!x.hat}" data-akt="pack"><b></b>${h(x.was)}</span><button class="rund gefahr" type="button" data-akt="pack-weg" title="Von der Liste nehmen" aria-label="Von der Liste nehmen">${SYM.korb}</button></div>`).join('')}
    <div class="pack__neu"><input id="pack-neu" placeholder="Etwas dazu, z. B. Kerzenanzünder" aria-label="Neue Sache für die Packliste">${WO.knopf('Dazu', 'plus', 'gold', { klein: true, attr: 'data-akt="pack-neu"' })}</div>
  </div></div>`;
  /* Teil 7: Abstimmung */
  const ab = p.abstimmung || {}, seit = istBestaetigt(p) ? unterschiede(ab.abdruck, abdruck(p)) : [];
  const t7 = `<div class="teil" data-teil="abstimmung" style="--i:7"${ro}><div class="teil__k"><b>Abstimmung mit dem Gastgeber</b><span>${istBestaetigt(p) ? 'bestätigt' : ab.gesendet ? 'beim Gastgeber' : 'noch nicht gesendet'}</span></div><div class="mw-in">
    <ol class="stufen">
      <li class="${ab.gesendet || istBestaetigt(p) ? 'fertig' : 'jetzt'}"><b>Dein Abend an ${h(anrede(A))}</b><span>${ab.gesendet ? 'Als gesendet vermerkt am ' + h(datumKurz(ab.gesendet)) + '.' : 'Das Blatt als PDF, dazu ein Text zum Kopieren.'}</span></li>
      <li class="${istBestaetigt(p) ? 'fertig' : ab.gesendet ? 'jetzt' : ''}"><b>Bestätigt</b><span>${istBestaetigt(p) ? `Am ${h(datumKurz(ab.bestaetigt_am))}${ab.bestaetigt_von ? ' von ' + h(ab.bestaetigt_von) : ''}, Fassung ${h(ab.fassung || '')}.` : 'Sobald der Gastgeber «passt so» sagt.'}</span></li>
      <li class="${vergangen(A) ? 'fertig' : istBestaetigt(p) ? 'jetzt' : ''}"><b>Der Abend</b><span>${h(datumLang(A.anfrage.datum))}${tageBis(A.anfrage.datum) < 0 && ['zugesagt', 'geplant'].includes(A.status) ? '. Vorbei: jetzt als vorbei markieren, dann übernimmt «Nach dem Abend».' : '.'}</span></li>
    </ol>
    ${seit.length ? `<div class="nachher"><p class="mw-name">Geändert nach Bestätigung</p><ul>${seit.map(x => `<li><span class="chip">${h(x.art)}</span> ${h(x.wo)}: ${h(x.nachher || x.vorher)}</li>`).join('')}</ul>${(ab.nachher || []).length ? `<p class="mw-hinweis">${(ab.nachher || []).map(x => h(datumKurz(x.zeit.slice(0, 10)) + ' ' + x.zeit.slice(11, 16) + ': ' + x.was)).join('<br>')}</p>` : ''}</div>` : istBestaetigt(p) ? '<p class="mw-hinweis">Seit der Bestätigung unverändert.</p>' : ''}
  </div><div class="neu-zeile">${WO.knopf('«Dein Abend» als PDF', 'pdf', 'hell', { klein: true, attr: 'data-akt="pdf" data-art="gastgeber"' })}${WO.knopf('Text für die Nachricht', 'mail', 'hell', { klein: true, attr: 'data-akt="senden"' })}${istBestaetigt(p) ? (seit.length ? WO.knopf('Neu bestätigen lassen', 'haken', 'gold', { klein: true, attr: 'data-akt="bestaetigt"' }) : '') : WO.knopf('Vom Gastgeber bestätigt', 'haken', 'gold', { klein: true, attr: 'data-akt="bestaetigt"' })}${['zugesagt', 'geplant'].includes(A.status) && tageBis(A.anfrage.datum) < 0 ? WO.knopf('Als vorbei markieren', 'haken', 'gold', { klein: true, attr: 'data-akt="vorbei"' }) : ''}${A.status === 'vorbei' ? WO.knopf('Doch nicht vorbei', 'zurueck', 'hell', { klein: true, attr: 'data-akt="nicht-vorbei"' }) : ''}</div>
  </div>`;
  /* Teil 8: nur für mich */
  const t8 = `<div class="teil" data-teil="intern" style="--i:8"${ro}><div class="teil__k"><b>Nur für mich</b><span>nie auf «Dein Abend»</span></div><div class="mw-in">${feld('intern', 'Notiz zum Abend', p.intern, 'was du dir merken willst', true)}</div></div>`;
  return t1 + t2 + t3 + t4 + t5 + t6 + t7 + t8;
}
let ZEICHNUNG = 0;
function liste() {
  ZEICHNUNG = Date.now();
  const el = $('#liste');
  el.innerHTML = Z && D ? abendHTML() : uebersichtHTML();
  mwWachsen();
  if (BLITZ) { const r = $(`#liste [data-k="${BLITZ}"]`); if (r) { r.classList.add('blitz'); r.scrollIntoView({ block: 'nearest' }); } BLITZ = null; }
  bilderZeigen();
}
let BILD_BEOB = null;
function bilderZeigen() {
  const alle = $$('#liste .r__b[data-bild]');
  const zeig = el => { el.style.backgroundImage = el.dataset.bild; el.removeAttribute('data-bild'); };
  /* Erster Blick komplett (Robert 31.10.2026): was im ersten Bild steht, sofort; der Rest beim Näherkommen */
  if (!('IntersectionObserver' in window)) return alle.forEach(zeig);
  if (BILD_BEOB) BILD_BEOB.disconnect();
  alle.forEach(el => { if (el.getBoundingClientRect().top < innerHeight + 400) zeig(el); });
  BILD_BEOB = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { zeig(e.target); BILD_BEOB.unobserve(e.target); } }), { rootMargin: '400px 0px' });
  $$('#liste .r__b[data-bild]').forEach(el => BILD_BEOB.observe(el));
}

// ---------------------------------------------------------------- Vorschau (Rahmen blatt.html, derselbe Satz wie die PDF)
function planFuerBlatt() {
  if (Z && D) return { abend: kernVon(A), plan: D };
  const n = ALLE.filter(kommend)[0] || ALLE.filter(a => a.plan)[0];
  return n ? { abend: kernVon(n), plan: n.plan || neuerPlan(n) } : null;
}
function vorschau() {
  const f = $('#vf'), d = planFuerBlatt();
  $$('.ansicht button').forEach(b => b.setAttribute('aria-pressed', b.dataset.blatt === BLATT));
  if (!BEREIT || !f.contentWindow || !d) return;
  f.contentWindow.postMessage({ ap: 'setze', daten: d, art: BLATT, zoom: ZOOM, vorschau: true }, location.origin);
}
const halloVorschau = () => { const f = $('#vf'); try { if (f && f.contentWindow) f.contentWindow.postMessage({ ap: 'hallo' }, location.origin); } catch (e) { /* noch nicht da */ } };
{ const f = $('#vf'); if (f) f.addEventListener('load', () => { if (!BEREIT) halloVorschau(); }); let n = 0; const t = setInterval(() => { if (BEREIT || ++n > 40) return clearInterval(t); halloVorschau(); }, 700); }
window.addEventListener('message', ev => {
  if (ev.origin !== location.origin || !ev.data || !ev.data.ap) return;
  const m = ev.data;
  if (m.ap === 'bereit') { BEREIT = true; vorschau(); }
  if (m.ap === 'gesetzt') {
    const n = m.bericht.seiten, d = planFuerBlatt();
    $('#v-zahl').textContent = (!Z && d ? `${gastgeberVon(d.abend)} · ` : '') + `${n} ${n === 1 ? 'Seite' : 'Seiten'}, wie in der PDF`;
    const w = $('#v-warn'), t = m.bericht.fehler || [];
    w.hidden = !t.length; w.textContent = t.length ? t[0] : '';
  }
  if ((m.ap === 'klick' || m.ap === 'doppel') && (Date.now() - ZU_ZEIT < 800 || !$('#fenster').hidden || (m.ap === 'doppel' && Date.now() - ZEICHNUNG < 700))) return;   /* Prüfung 2 (14): der zweite Klick eines Doppelklicks auf «Speichern» trifft nach dem Schliessen das Blatt; er öffnet nichts */
  if (m.ap === 'klick' && Z) waehleAusVorschau(m.k);
  if (m.ap === 'doppel' && Z) { const [l, id] = m.k.split('.'); if (['ablauf', 'gaenge', 'weine', 'gaeste'].includes(l)) eintragFenster(l, id); }
  if (m.ap === 'taste' && m.was === 'speichern' && OFFEN) speichern();
});
/* Prüfung 2 (14): jeder Knopf, der etwas anlegt, speichert oder zurückholt, ist gesperrt, solange er arbeitet; ein zweiter Klick legt nie ein zweites Stück an.
   Sperre je Knopf (in der Fangphase, vor jedem anderen Hörer), frei, sobald das Fenster zu ist oder nach 1,5 s, falls das Fenster offen bleibt (Eingabe abgewiesen). */
const SPERRBAR = '#fenster .kn:not(.kn--hell), #fenster [data-vorlage], #fenster [data-d], #liste [data-akt], #kopf [data-akt], #leiste [data-akt]';
document.addEventListener('click', ev => {
  const b = ev.target.closest && ev.target.closest(SPERRBAR); if (!b || b.matches('[data-akt="waehle"],[data-akt="oeffne"]')) return;
  if (b.dataset.gesperrt || LAEUFT) { ev.stopImmediatePropagation(); ev.preventDefault(); return; }
  b.dataset.gesperrt = '1'; b.setAttribute('aria-busy', 'true');
  setTimeout(() => { if (b.isConnected) { delete b.dataset.gesperrt; b.removeAttribute('aria-busy'); } }, 1500);
}, true);
/* wer nach einer abgewiesenen Eingabe etwas ändert, darf sofort wieder speichern */
document.addEventListener('input', ev => { if (ev.target.closest && ev.target.closest('#fenster')) $$('#fenster [data-gesperrt]').forEach(b => { delete b.dataset.gesperrt; b.removeAttribute('aria-busy'); }); }, true);
document.addEventListener('dblclick', ev => { if ((Date.now() - ZU_ZEIT < 800 || Date.now() - ZEICHNUNG < 700) && !ev.target.closest('#fenster'))   /* auch: die Liste wurde zwischen den zwei Klicks neu gezeichnet (Knopf «nach oben»), dann liegt eine fremde Zeile unter dem Zeiger */ { ev.stopImmediatePropagation(); ev.preventDefault(); } }, true);
/* Klick links oder rechts: die andere Seite springt auf dieselbe Stelle und blinkt kurz (Robert 15.10.2026) */
function markiere(k) {
  const r = $(`#liste [data-k="${k}"]`), vor = r ? r.getBoundingClientRect().top : 0;
  $$('#liste .gewaehlt').forEach(x => { if (x !== r) x.classList.remove('gewaehlt'); });
  if (!r) return null;
  const nach = r.getBoundingClientRect().top; if (Math.abs(nach - vor) > 1) window.scrollBy(0, nach - vor);
  r.classList.add('gewaehlt'); r.classList.remove('blitz'); void r.offsetWidth; r.classList.add('blitz');
  return r;
}
function blitzRechts(k, y) { const f = $('#vf'); f.contentWindow.postMessage({ ap: 'blitz', k, y: y == null ? null : y - f.getBoundingClientRect().top }, location.origin); }
function linksMitte(r) {
  const rr = r.getBoundingClientRect(), max = document.documentElement.scrollHeight - innerHeight;
  const ziel = Math.min(max, Math.max(0, scrollY + rr.top + rr.height / 2 - innerHeight / 2));
  window.scrollTo({ top: ziel, behavior: 'smooth' });
  return rr.top + rr.height / 2 - (ziel - scrollY);
}
function waehle(k) { const r = markiere(k); if (!r) return; const rr = r.getBoundingClientRect(); blitzRechts(k, rr.top + rr.height / 2); }
function waehleAusVorschau(k) {
  let r = $(`#liste [data-k="${k}"]`);
  if (!r) { const t = k.split('.')[0]; r = $(`#liste .teil[data-teil="${t}"]`); if (r) { r.scrollIntoView({ block: 'start', behavior: 'smooth' }); r.classList.remove('blitz'); void r.offsetWidth; r.classList.add('blitz'); } return; }
  markiere(k); blitzRechts(k, linksMitte(r));
}

// ---------------------------------------------------------------- Leiste und Speichern
function leiste() {
  oben();
  if (!Z || !D) {
    $('#leiste').innerHTML = WO.leiste({ titel: 'Übersicht', satz: offenSatzAlle(), knoepfe: WO.knopf('Alles gespeichert', 'haken', 'glas', { klein: true, id: 'l-sp', attr: 'data-akt="speichern"' }) });
    return leistePasst();
  }
  const sp = OFFEN ? 'wartet' : (leiste.gruen ? 'fertig' : 'glas'), seit = istBestaetigt(D) ? unterschiede(D.abstimmung.abdruck, abdruck(D)) : [];
  $('#leiste').innerHTML = WO.leiste({ entwurf: false,
    titel: OFFEN ? 'Noch nicht gespeichert' : seit.length ? `Geändert nach Bestätigung: ${seit.length}` : istBestaetigt(D) ? 'Vom Gastgeber bestätigt' : 'Alles gespeichert',
    satz: OFFEN ? 'Speichern legt die Eingaben in den Plan.' : seit.length ? 'Der Gastgeber kennt diese Stellen noch nicht.' : istBestaetigt(D) ? `Am ${datumKurz(D.abstimmung.bestaetigt_am)}.` : offenSatz(A, D),
    knoepfe: (seit.length && !OFFEN ? WO.knopf('Vorher, nachher', 'auge', 'glas', { klein: true, attr: 'data-akt="vgl"' }) : '')
      + WO.knopf(BLATT === 'arbeit' ? 'Arbeitsblatt als PDF' : '«Dein Abend» als PDF', 'pdf', 'glas', { klein: true, attr: `data-akt="pdf" data-art="${BLATT}"` })
      + WO.knopf(OFFEN ? 'Speichern' : sp === 'fertig' ? 'Gespeichert' : 'Alles gespeichert', sp === 'fertig' || !OFFEN ? 'haken' : 'pfeil', sp, { klein: true, id: 'l-sp', attr: 'data-akt="speichern"' }) });
  leistePasst();
}
function offenSatzAlle() { const k = ALLE.filter(kommend), o = k.filter(a => offen(a, a.plan).length); return k.length ? (o.length ? `Bei ${o.length} von ${k.length} kommenden Abenden ist noch etwas offen.` : 'Bei allen kommenden Abenden steht der Plan.') : 'Kein Abend steht an.'; }
function leistePasst() {
  const l = $('#leiste'), t = l && l.querySelector('.wo-leiste__t b'); if (!t) return;
  l.classList.remove('eng', 'enger');
  const zu = () => t.scrollWidth > t.parentElement.clientWidth + 1 || l.scrollWidth > l.clientWidth + 1;
  if (zu()) l.classList.add('eng');
  if (zu()) l.classList.add('enger');
}
window.addEventListener('resize', () => leistePasst());
function geaendert() { OFFEN = JSON.stringify(D) !== BASIS; leiste(); }
const kernVon = a => { const k = {}; Object.keys(a).forEach(x => { if (!['id', 'angebot', 'plan', 'tisch', 'nachher'].includes(x)) k[x] = a[x]; }); k.id = a.id; return k; };

let KETTE = Promise.resolve();   /* Speichern nacheinander (WebKit 15.10.2026: Konflikt mit der eigenen Eingabe) */
function speichern(was, text, ohneUndo) { const r = KETTE.then(() => speichernEcht(was, text, ohneUndo)); KETTE = r.catch(() => {}); return r; }
function zeitenFalsch() { return ['ankunft', 'gaeste_ab', 'ende'].filter(k => D && String(D[k] || '').trim() && !zeitOk(D[k])); }
function zeitenMarkieren() { const f = zeitenFalsch(); $$('#liste [data-f="ankunft"],#liste [data-f="gaeste_ab"],#liste [data-f="ende"]').forEach(el => (el.closest('label.feld') || el).classList.toggle('falsch', f.includes(el.dataset.f))); return f; }
async function speichernEcht(was, text, ohneUndo) {
  const vorher = BASIS;
  /* Prüfung 05.11.2026 (3): Uhrzeiten im Kopf wie im Ablauf geprüft; falsche bleiben markiert und gelb, nichts landet auf dem Blatt */
  if (zeitenMarkieren().length) { sag('Nicht gespeichert', 'Die Uhrzeit bitte als Stunde und Minute, z. B. 18:30. Das Feld ist markiert.', [], true); OFFEN = true; leiste(); return false; }
  if (JSON.stringify(D) === BASIS) { OFFEN = false; leiste(); sag('Nichts geändert, nichts gespeichert.'); return true; }
  const neu = kopie(D);
  neu.stand = jetztZeit(); neu.fassung = (+neu.fassung || 0) + 1;
  /* Nach der Bestätigung: jede Änderung als «geändert nach Bestätigung» vermerken (Auftrag Nr. 8) */
  if (istBestaetigt(neu) && !ohneUndo) {
    const alt = vorher ? JSON.parse(vorher) : null, u = alt ? unterschiede(abdruck(alt), abdruck(neu)) : [];
    if (u.length) { neu.abstimmung.nachher = (neu.abstimmung.nachher || []).concat(u.slice(0, 4).map(x => ({ zeit: neu.stand, was: `${x.wo} ${x.art}: ${x.nachher || x.vorher}` }))).slice(-40); }
  }
  let r;
  try { r = await api(API + 'teil/plan/' + encodeURIComponent(Z), 'PUT', { wert: neu, etag: ETAG.plan, wer: ICH, was: (was || 'Plan gespeichert') + ' · ' + Z }); }
  catch (e) {
    if (e.status === 409) { sag('Nicht gespeichert', 'Inzwischen hat ein anderes Fenster gespeichert. Der neue Stand ist geladen, deine letzte Eingabe bitte noch einmal.', [], true); await lade(Z, true); return false; }
    fehlerSagen('Nicht gespeichert', e); OFFEN = true; leiste(); return false;
  }
  ETAG.plan = r.etag; D = neu; A.plan = kopie(neu); BASIS = JSON.stringify(D); OFFEN = false;
  if (!ohneUndo) UNDO.push(vorher);
  leiste.gruen = true; setTimeout(() => { leiste.gruen = false; if (!OFFEN) leiste(); }, 2600);
  rand(); kopf(); leiste();
  const tippt = document.activeElement && document.activeElement.matches && document.activeElement.matches('#liste textarea, #liste input');
  if (!tippt) liste();
  vorschau();
  const kn = [{ t: 'Rückgängig', f: rueckgaengig }];
  if (istBestaetigt(D) && unterschiede(D.abstimmung.abdruck, abdruck(D)).length) kn.push({ t: 'Vorher, nachher', f: vglFenster });
  sag(was || 'Gespeichert', text || 'Der Plan steht so auf dem Blatt.', kn);
  await statusAbgleich();
  return true;
}
/* Prüfung 05.11.2026 (1): der Stand des Abends folgt der Bestätigung. Fällt sie weg (Rückgängig, frühere Fassung, Ursprung), steht der Abend wieder auf «zugesagt». */
async function statusAbgleich() {
  if (!A || !['zugesagt', 'geplant'].includes(A.status)) return;
  const soll = istBestaetigt(D) ? 'geplant' : 'zugesagt';
  if (A.status === soll) return;
  if (await statusSetzen(soll, soll === 'geplant' ? 'Plan bestätigt' : 'Bestätigung zurückgenommen')) {
    rand(); kopf(); leiste(); liste();
    sag(soll === 'geplant' ? 'Der Abend steht auf «Geplant»' : 'Der Abend steht wieder auf «Zugesagt»', soll === 'geplant' ? 'Der Gastgeber hat den Plan bestätigt.' : 'Der Plan trägt keine Bestätigung mehr.');
  }
}
async function rueckgaengig() {
  if (!UNDO.length) return sag('Nichts zum Zurücknehmen.');
  const x = UNDO.pop(); if (!x) return sag('Nichts zum Zurücknehmen.');
  D = JSON.parse(x);
  if (await speichern('Zurückgenommen', 'Der Plan steht wieder wie vor der letzten Änderung.', true)) alles();
}
let LAEUFT = false;
async function tun(fn, was, text, blitz, immer) {
  if (LAEUFT) return;   /* Prüfung 2 (Punkt 14): solange eine Änderung gespeichert wird, nimmt keine zweite Hand etwas an */
  const alt = JSON.stringify(D);
  fn();
  if (!immer && JSON.stringify(D) === alt) return sag('Nichts geändert, nichts gespeichert.');   /* ein neuer Eintrag (auch eine unveränderte Kopie) wird immer gespeichert */
  BLITZ = blitz || null;
  liste(); vorschau();
  LAEUFT = true;
  try { await speichern(was, text); } finally { LAEUFT = false; }
}
async function statusSetzen(neu, was) {
  const k = kernVon(A); delete k.id; k.status = neu;
  try { const r = await api(API + 'teil/kern/' + encodeURIComponent(Z), 'PUT', { wert: k, etag: ETAG.kern, wer: ICH, was: was + ' · ' + Z }); ETAG.kern = r.etag; A.status = neu; return true; }
  catch (e) { if (e.status === 409) { await lade(Z, true); return statusSetzen(neu, was); } fehlerSagen('Stand nicht gesetzt', e); return false; }
}

// ---------------------------------------------------------------- Fenster
function fenster(html, breit) {
  const f = $('#fenster');
  $('#meldung').innerHTML = '';   /* ältere Quittungen liegen sonst am Handy über den Knöpfen des Fensters */
  f.innerHTML = `<div class="fenster__k${breit ? ' breit' : ''}" role="dialog" aria-modal="true"><button class="rund fenster__zu" type="button" data-zu aria-label="Schliessen">${SYM.zu}</button>${html}</div>`;
  f.hidden = false;
  f.onclick = ev => { if (ev.target === f || ev.target.closest('[data-zu]')) zu(); };
  const erst = $('input:not([type=hidden]),textarea', f); if (erst && matchMedia('(hover:hover)').matches) setTimeout(() => erst.focus(), 30);
}
let BEIM_ZU = null;
let ZU_ZEIT = 0;
function zu() { ZU_ZEIT = Date.now(); const f = $('#fenster'); f.hidden = true; f.innerHTML = ''; f.oninput = null; f.onclick = null; if (BEIM_ZU) { const b = BEIM_ZU; BEIM_ZU = null; b(); } }
function frage(titel, text, ja, f) {
  fenster(`<h2>${titel}</h2><p class="satz">${h(text)}</p><div class="fenster__kn"><button class="kn kn--hell" type="button" data-zu>Abbrechen</button><button class="kn" type="button" id="ja">${h(ja)}<i>${PF}</i></button></div>`);
  $('#ja').addEventListener('click', () => { BEIM_ZU = null; zu(); f(); });
}
function chips(id, wahl, art) { return `<div class="chips" id="${id}">${wahl.map(([v, t]) => `<button type="button" data-v="${h(v)}" aria-pressed="${v === art}">${h(t)}</button>`).join('')}</div>`; }
function chipWahl(id) { const b = $(`#${id} [aria-pressed="true"]`); return b ? b.dataset.v : ''; }
function chipsLos(root) { root.addEventListener('click', ev => { const b = ev.target.closest('.chips button'); if (!b) return; $$('button', b.parentElement).forEach(x => x.setAttribute('aria-pressed', x === b)); b.parentElement.dispatchEvent(new Event('wahl', { bubbles: true })); }); }
function schalterLos(root) { $$('.schalter[id]', root).forEach(s => { const um = () => s.setAttribute('aria-checked', s.getAttribute('aria-checked') !== 'true'); s.addEventListener('click', um); s.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); um(); } }); }); }
const fIn = (id, titel, wert, o = {}) => `<label class="feld"><span>${h(titel)}</span>${o.lang ? `<textarea id="${id}" maxlength="1000" rows="${o.rows || 3}"${o.ph ? ` placeholder="${h(o.ph)}"` : ''}>${h(wert)}</textarea>` : `<input id="${id}" maxlength="300" value="${h(wert)}"${o.ph ? ` placeholder="${h(o.ph)}"` : ''}${o.mode ? ` inputmode="${o.mode}"` : ''}>`}${o.klein ? `<small>${h(o.klein)}</small>` : ''}</label>`;
const wert = id => { const e = $('#' + id); return e ? e.value.slice(0, +e.getAttribute('maxlength') || 1000).replace(/[ \t]+/g, ' ').trim() : ''; };
const schalterAn = id => { const e = $('#' + id); return !!e && e.getAttribute('aria-checked') === 'true'; };

const LISTEN = { ablauf: ['Punkt', 'Punkt des Abends', 'p', 'Neuer'], gaenge: ['Gang', 'Gang', 'g', 'Neuer'], weine: ['Getränk', 'Getränk', 'w', 'Neues'], gaeste: ['Gast', 'Gast', 'q', 'Neuer'] };
function titelVon(l, x) { return l === 'ablauf' ? `${x.zeit ? x.zeit + ' ' : ''}${x.was}` : l === 'gaenge' ? x.name + (x.gericht ? ': ' + x.gericht : '') : l === 'weine' ? (x.name || 'Getränk') : x.name; }
function eintragFenster(l, id, neu, kopiert) {
  const arr = D[l], x = arr.find(y => y.id === id); if (!x) return;
  const [kurz, lang, , neuWort] = LISTEN[l];
  let innen = '';
  if (l === 'ablauf') innen = `<div class="feld zw3">${fIn('f-zeit', 'Uhrzeit', x.zeit, { ph: '18:30', mode: 'numeric' })}${fIn('f-dauer', 'Dauer in Minuten', x.dauer || '', { ph: '30', mode: 'numeric' })}</div>
    ${fIn('f-was', 'Was', x.was, { ph: 'z. B. Empfang mit Sekt' })}
    <div class="feld"><span>Art</span>${chips('f-art', ARTEN, x.art)}</div>
    <div class="feld"><span>Wer</span>${chips('f-wer', WER, x.wer)}</div>
    <div class="feld" id="f-gang-f"${['gang', 'dessert'].includes(x.art) ? '' : ' hidden'}><span>Welcher Gang</span>${chips('f-gang', [['', 'keiner'], ...(D.gaenge || []).map(g => [g.id, g.name])], x.gang || '')}</div>
    ${fIn('f-notiz', 'Notiz', x.notiz, { lang: true, rows: 2, ph: 'was dazu gehört, ruhig gesagt' })}
    <div class="feld"><span class="schalter" role="switch" tabindex="0" aria-checked="${!!x.intern}" id="f-intern"><b></b>Nur auf meinem Arbeitsblatt, nicht auf «Dein Abend»</span></div>`;
  if (l === 'gaenge') innen = `<div class="feld zw2">${fIn('f-name', 'Gang', x.name, { ph: 'Vorspeise' })}${fIn('f-zeit', 'Uhrzeit', x.zeit, { ph: '19:30', mode: 'numeric' })}</div>
    ${fIn('f-gericht', 'Gericht', x.gericht, { ph: 'was serviert wird' })}${fIn('f-beschreibung', 'Eine Zeile dazu', x.beschreibung, { ph: 'für Menükarte und Blatt' })}
    <div class="feld zw2">${fIn('f-koch', 'Wer kocht', x.koch, { ph: 'Name, Gastgeber oder Caterer' })}${fIn('f-hinweis', 'Hinweis für die Küche (nur Arbeitsblatt)', x.hinweis, { ph: 'z. B. Teller vorwärmen' })}</div>`;
  if (l === 'weine') innen = `<div class="feld"><span>Wozu</span>${chips('f-zu', [['empfang', 'Empfang'], ...(D.gaenge || []).map(g => [g.id, g.name]), ['tisch', 'Den ganzen Abend'], ['digestif', 'Digestif']], x.zu)}</div>
    <div class="feld"><span>Art</span>${chips('f-art', WEINART, x.art)}</div>
    <div class="feld zw2">${fIn('f-name', 'Wein oder Getränk', x.name, { ph: 'Spätburgunder trocken' })}${fIn('f-weingut', 'Weingut', x.weingut)}</div>
    <div class="feld zw3">${fIn('f-rebsorte', 'Rebsorte', x.rebsorte)}${fIn('f-jahrgang', 'Jahrgang', x.jahrgang, { mode: 'numeric' })}${fIn('f-herkunft', 'Gebiet', x.herkunft)}</div>
    <div class="feld zw3">${fIn('f-temperatur', 'Temperatur', x.temperatur, { ph: '16 °C' })}${fIn('f-oeffnen', 'Wann öffnen', x.oeffnen, { ph: '19:15, dekantieren' })}${fIn('f-menge', 'Wie viel', x.menge, { ph: '3 Flaschen' })}</div>
    <div class="feld zw2">${fIn('f-glas', 'Glas', x.glas, { ph: 'Burgunderglas' })}${fIn('f-notiz', 'Ein Satz zum Wein', x.notiz)}</div>`;
  if (l === 'gaeste') innen = `<div class="feld zw2">${fIn('f-name', 'Name', x.name)}${fIn('f-karte', 'Auf der Tischkarte', x.karte, { ph: 'leer: wie der Name' })}</div>
    <div class="feld zw2">${fIn('f-beziehung', 'Zum Gastgeber', x.beziehung, { ph: 'z. B. Mutter von Jan' })}${fIn('f-platz', 'Platz', x.platz, { mode: 'numeric', ph: 'Nummer' })}</div>
    <div class="feld zw2">${fIn('f-unvertraeglich', 'Verträgt nicht', x.unvertraeglich, { ph: 'z. B. Haselnuss' })}${fIn('f-vorlieben', 'Mag, meidet', x.vorlieben, { ph: 'z. B. vegetarisch' })}</div>
    ${fIn('f-notiz', 'Worauf ich achte (nur Arbeitsblatt)', x.notiz, { lang: true, rows: 2 })}
    <div class="feld zw2"><span class="schalter" role="switch" tabindex="0" aria-checked="${!!x.ehrengast}" id="f-ehren"><b></b>Ehrengast</span><span class="schalter" role="switch" tabindex="0" aria-checked="${!!x.alkoholfrei}" id="f-af"><b></b>Bekommt die alkoholfreie Begleitung</span></div>`;
  fenster(`<h2>${neu ? `${neuWort} <em>${h(kurz)}.</em>` : `${h(lang)} <em>bearbeiten.</em>`}</h2>
    <p class="satz">${kopiert ? 'Eine Kopie des Eintrags darüber. Ändere, was anders sein soll.' : neu ? (l === 'ablauf' ? 'Ein neuer Punkt; die Uhrzeit folgt dem letzten Punkt des Abends.' : 'Ein neuer Eintrag. Was du einträgst, steht gleich auf dem Blatt.') : 'Auf dem Blatt steht der Eintrag, sobald du speicherst.'}</p>
    <div class="zwei"><div class="felder">${innen}</div>${miniHTML()}</div>
    <p class="fehler" id="f-fehler" role="alert"></p>
    <div class="fenster__kn">${neu ? '' : '<button class="textknopf" type="button" id="f-weg" style="margin-right:auto">Entfernen</button>'}<button class="kn kn--hell" type="button" data-zu>Abbrechen</button><button class="kn" type="button" id="f-ok">${neu ? 'In den Plan' : 'Speichern'}<i>${PF}</i></button></div>`, true);
  const f = $('#fenster'); chipsLos(f); schalterLos(f);
  if (neu) BEIM_ZU = () => { const i = D[l].findIndex(y => y.id === id); if (i >= 0) D[l].splice(i, 1); liste(); vorschau(); };
  const art = $('#f-art'); if (art && l === 'ablauf') art.addEventListener('wahl', () => { const g = $('#f-gang-f'); if (g) g.hidden = !['gang', 'dessert'].includes(chipWahl('f-art')); });
  const weg = $('#f-weg'); if (weg) weg.addEventListener('click', () => { BEIM_ZU = null; entfernen(l, id); });
  const bauen = () => {
    const y = kopie(x);
    if (l === 'ablauf') { Object.assign(y, { zeit: zeitForm(wert('f-zeit')), dauer: Math.max(0, parseInt(wert('f-dauer'), 10) || 0), was: wert('f-was'), art: chipWahl('f-art') || 'sonst', wer: chipWahl('f-wer') || 'angelina', notiz: wert('f-notiz') }); const g = chipWahl('f-gang'); if (['gang', 'dessert'].includes(y.art) && g) y.gang = g; else delete y.gang; if (schalterAn('f-intern')) y.intern = true; else delete y.intern; }
    if (l === 'gaenge') Object.assign(y, { name: wert('f-name'), zeit: zeitForm(wert('f-zeit')), gericht: wert('f-gericht'), beschreibung: wert('f-beschreibung'), koch: wert('f-koch'), hinweis: wert('f-hinweis') });
    if (l === 'weine') Object.assign(y, { zu: chipWahl('f-zu') || 'tisch', art: chipWahl('f-art') || '', name: wert('f-name'), weingut: wert('f-weingut'), rebsorte: wert('f-rebsorte'), jahrgang: wert('f-jahrgang'), herkunft: wert('f-herkunft'), temperatur: wert('f-temperatur'), oeffnen: wert('f-oeffnen'), menge: wert('f-menge'), glas: wert('f-glas'), notiz: wert('f-notiz') });
    if (l === 'gaeste') Object.assign(y, { name: wert('f-name'), karte: wert('f-karte'), beziehung: wert('f-beziehung'), platz: wert('f-platz'), unvertraeglich: wert('f-unvertraeglich'), vorlieben: wert('f-vorlieben'), notiz: wert('f-notiz'), ehrengast: schalterAn('f-ehren'), alkoholfrei: schalterAn('f-af') });
    return y;
  };
  const sende = () => { try { miniSenden({ l, x: bauen() }); } catch (e) { /* unfertige Eingabe */ } };
  miniLos(() => ({ l, x: bauen() }));
  f.oninput = sende; f.addEventListener('wahl', sende); f.addEventListener('click', ev => { if (ev.target.closest('.schalter')) setTimeout(sende, 0); });
  $('#f-ok').addEventListener('click', async ev => {
    if (ev.detail > 1) return;   /* Prüfung 05.11.2026 (14): ein Doppelklick speichert einmal und öffnet nichts dahinter */
    const y = bauen(), fe = $('#f-fehler');
    if (l === 'ablauf' && !y.was) return fe.textContent = 'Bitte eintragen, was zu dieser Zeit geschieht.';
    if (l === 'ablauf' && y.zeit && !zeitOk(y.zeit)) return fe.textContent = 'Die Uhrzeit bitte als Stunde und Minute, z. B. 18:30.';
    if (l === 'gaenge' && !y.name) return fe.textContent = 'Bitte den Gang benennen, z. B. Vorspeise.';
    if (l === 'gaenge' && y.zeit && !zeitOk(y.zeit)) return fe.textContent = 'Die Uhrzeit bitte als Stunde und Minute, z. B. 19:30.';
    if (l === 'weine' && !y.name && !y.notiz) return fe.textContent = 'Bitte den Wein oder das Getränk eintragen.';
    if (l === 'gaeste' && !y.name) return fe.textContent = 'Bitte einen Namen eintragen.';
    if (!neu && JSON.stringify(y) === JSON.stringify(x)) { BEIM_ZU = null; zu(); return sag('Nichts geändert, nichts gespeichert.'); }
    BEIM_ZU = null; zu();
    await tun(() => { const i = D[l].findIndex(z => z.id === id); D[l][i] = y; if (l === 'gaenge' && y.zeit) (D.ablauf || []).forEach(p => { if (p.gang === y.id && !p.zeit) p.zeit = y.zeit; }); },
      neu ? `${kurz} im Plan` : `${kurz} gespeichert`, `«${titelVon(l, y)}»`, `${l}.${id}`, neu);
  });
}
/* «So steht es auf dem Blatt» (wie «So steht es auf der Karte» im Vorbild): der Eintrag allein, gesetzt wie in der PDF */
function miniHTML() { return `<div><p class="mono" style="margin:0 0 8px">So steht es auf dem Blatt</p><div class="mini"><iframe id="f-mini" title="Der Eintrag, wie er in der PDF steht" src="/angelina-strelow/werkzeuge/abendplan/blatt.html?mini=1"></iframe></div></div>`; }
function miniSenden(x) { const f = $('#f-mini'); if (!f || !f.contentWindow) return; f.contentWindow.postMessage(Object.assign({ ap: 'mini', art: BLATT, daten: { abend: kernVon(A), plan: D } }, x), location.origin); }
function miniLos(fn) { const fr = $('#f-mini'); if (!fr) return; fr.addEventListener('load', () => { try { miniSenden(fn()); } catch (e) { /* egal */ } }, { once: true }); }
window.addEventListener('message', ev => { if (ev.origin === location.origin && ev.data && ev.data.ap === 'mini-hoehe') { const f = $('#f-mini'); if (f) f.style.height = Math.min(420, Math.max(60, ev.data.h)) + 'px'; } });

function entfernen(l, id) {
  const x = D[l].find(y => y.id === id); if (!x) return;
  const t = titelVon(l, x), dazu = l === 'gaenge' ? (D.weine || []).filter(w => w.zu === id).length : 0;
  frage(`${LISTEN[l][0]} <em>entfernen?</em>`, `«${t}» verschwindet aus dem Plan.${dazu ? ` Die ${dazu === 1 ? 'Wein dazu bleibt' : dazu + ' Weine dazu bleiben'} und stehen dann ohne Zuordnung.` : ''} «Rückgängig» holt es zurück.`, 'Entfernen',
    () => tun(() => { D[l] = D[l].filter(y => y.id !== id); if (l === 'gaenge') (D.ablauf || []).forEach(p => { if (p.gang === id) delete p.gang; }); }, `${LISTEN[l][0]} entfernt`, t));
}
function schiebe(l, id, r) {
  const i = D[l].findIndex(y => y.id === id), j = i + r;
  if (j < 0 || j >= D[l].length) return sag(r < 0 ? 'Steht schon zuoberst.' : 'Steht schon zuunterst.');
  tun(() => { [D[l][i], D[l][j]] = [D[l][j], D[l][i]]; }, 'Reihenfolge gespeichert', `«${titelVon(l, D[l][i])}» steht jetzt weiter ${r < 0 ? 'oben' : 'unten'}`, `${l}.${id}`);
}
function kopieren(l, id) {
  const i = D[l].findIndex(y => y.id === id), y = kopie(D[l][i]); y.id = neueId(D[l], LISTEN[l][2]);
  D[l].splice(i + 1, 0, y); liste(); vorschau(); eintragFenster(l, y.id, true, true);
}
function neuEintrag(l) {
  /* Vorlage für «Neuer Eintrag» ist der letzte Eintrag mit allen Feldern (Master 9, La Carte Culinarium 28.10.2026) */
  const leer = { ablauf: { zeit: '', dauer: 30, art: 'sonst', was: '', wer: 'angelina', notiz: '' }, gaenge: { name: '', gericht: '', beschreibung: '', koch: '', zeit: '', hinweis: '' },
    weine: { zu: 'tisch', art: 'weiss', name: '', weingut: '', rebsorte: '', jahrgang: '', herkunft: '', temperatur: '', oeffnen: '', menge: '', glas: '', notiz: '' },
    gaeste: { name: '', karte: '', beziehung: '', ehrengast: false, platz: '', unvertraeglich: '', vorlieben: '', alkoholfrei: false, notiz: '' } }[l];
  D[l] = D[l] || [];
  const letzt = D[l][D[l].length - 1], y = Object.assign({}, leer, l === 'ablauf' && letzt ? { zeit: zeitOk(letzt.zeit) ? alsZeit(minuten(letzt.zeit) + (+letzt.dauer || 0)) : '', wer: letzt.wer } : {}, l === 'weine' && letzt ? { zu: letzt.zu } : {});
  if (l === 'gaeste') y.platz = String(D.gaeste.length + 1);
  y.id = neueId(D[l], LISTEN[l][2]);
  D[l].push(y); liste(); vorschau(); eintragFenster(l, y.id, true);
}

/* Ziehen zum Anordnen (Auftrag Nr. 2, wie das Anordnen im Vorbild: Zeile am Griff fassen, sie folgt dem Zeiger per transform, die Nachbarn rücken) */
let ZUG = null;
document.addEventListener('pointerdown', ev => {
  const g = ev.target.closest('[data-zieh]'); if (!g || !D) return;
  const r = g.closest('.r[data-l]'); if (!r) return;
  ev.preventDefault();
  const reihen = $$(`.r[data-l="${r.dataset.l}"]`, r.parentElement), i = reihen.indexOf(r);
  ZUG = { r, reihen, i, ziel: i, y0: ev.clientY, mitten: reihen.map(x => { const b = x.getBoundingClientRect(); return b.top + b.height / 2; }), hoehe: r.getBoundingClientRect().height };
  r.classList.add('zieht'); g.setPointerCapture && g.setPointerCapture(ev.pointerId);
});
document.addEventListener('pointermove', ev => {
  if (!ZUG) return;
  if (ev.buttons === 0) return zugEnde();   /* Master 9: ohne gedrückte Taste endet das Ziehen */
  const dy = ev.clientY - ZUG.y0, mitte = ZUG.mitten[ZUG.i] + dy;
  let z = ZUG.i; ZUG.mitten.forEach((m, k) => { if (k < ZUG.i && mitte < m) z = Math.min(z, k); if (k > ZUG.i && mitte > m) z = Math.max(z, k); });
  ZUG.ziel = z; ZUG.r.style.transform = `translateY(${dy}px)`;
  ZUG.reihen.forEach((x, k) => { if (x === ZUG.r) return; x.style.transform = k > ZUG.i && k <= z ? `translateY(${-ZUG.hoehe}px)` : k < ZUG.i && k >= z ? `translateY(${ZUG.hoehe}px)` : ''; });
});
document.addEventListener('pointerup', () => zugEnde());
document.addEventListener('pointercancel', () => zugEnde(true));
function zugEnde(abbruch) {
  if (!ZUG) return; const z = ZUG; ZUG = null;
  z.reihen.forEach(x => { x.style.transform = ''; x.classList.remove('zieht'); });
  if (abbruch || z.ziel === z.i) return;
  const l = z.r.dataset.l, id = z.r.dataset.id, arr = D[l], von = arr.findIndex(y => y.id === id);
  const ziel = arr.findIndex(y => y.id === z.reihen[z.ziel].dataset.id);
  tun(() => { const [y] = arr.splice(von, 1); arr.splice(ziel, 0, y); }, 'Reihenfolge gespeichert', `«${titelVon(l, arr.find(y => y.id === id) || {})}» steht jetzt an Stelle ${ziel + 1}`, `${l}.${id}`);
}

function zeitenNachrechnen() {
  const l = D.ablauf || [], erst = l.find(x => zeitOk(x.zeit));
  if (!erst) return sag('Erst eine Uhrzeit eintragen.', 'Der erste Punkt braucht eine Zeit, ab der gerechnet wird.');
  frage('Zeiten <em>nachrechnen?</em>', `Ab ${erst.zeit} folgt jeder Punkt auf den vorigen, nach dessen Dauer. So stimmen die Zeiten wieder, wenn du Punkte verschoben hast. «Rückgängig» holt die alten Zeiten zurück.`, 'Nachrechnen',
    () => tun(() => { let t = minuten(erst.zeit); l.slice(l.indexOf(erst)).forEach(x => { x.zeit = alsZeit(t); t += +x.dauer || 0; (D.gaenge || []).forEach(g => { if (g.id === x.gang) g.zeit = x.zeit; }); }); D.ankunft = l[0].zeit || D.ankunft; const ab = l.filter(x => x.art === 'abschied').pop(); if (ab) D.ende = alsZeit(minuten(ab.zeit) + (+ab.dauer || 0)); }, 'Zeiten nachgerechnet', `Von ${erst.zeit} an, Punkt für Punkt.`));
}

function vorlagenFenster() {
  const vs = VORL.anlaesse, jetzt = D ? D.vorlage : '';
  fenster(`<h2>Vorlagen <em>je Anlass.</em></h2><p class="satz">Ein Ablauf als Anfang, vom Ankommen bis zum Aufräumen. ${Z ? 'Übernehmen ersetzt den Ablauf dieses Abends; die Uhrzeiten richten sich nach der Zeit, zu der die Gäste kommen. Gänge, Weine und Gäste bleiben.' : 'Öffne einen Abend, um eine Vorlage zu übernehmen.'}</p>
    <div class="vorlagen">${vs.map(v => `<div class="vorlage${v.k === jetzt ? ' an' : ''}"><span class="vorlage__b" style="background-image:url('${bild(v.bild)}')"></span><div><b>${h(v.t)}</b><p>${h(v.satz)}</p><span class="mono">${v.punkte.length} Punkte · Gäste ab ${h(v.gaeste_ab)}</span>
      <details><summary>Ablauf ansehen</summary><ol>${v.punkte.map(p => `<li><span class="mono">${h(alsZeit(minuten(v.gaeste_ab) + p.ab))}</span> ${h(p.was)}</li>`).join('')}</ol></details></div>${Z && !vergangen(A) ? WO.knopf('Übernehmen', 'pfeil', v.k === jetzt ? 'hell' : 'gold', { klein: true, attr: `data-vorlage="${v.k}"` }) : ''}</div>`).join('')}</div>
    <div class="fenster__kn"><button class="kn kn--hell" type="button" data-zu>Schliessen</button></div>`, true);
  $('#fenster').addEventListener('click', ev => {
    const b = ev.target.closest('[data-vorlage]'); if (!b) return;
    const v = vs.find(x => x.k === b.dataset.vorlage);
    BEIM_ZU = null; zu();
    tun(() => { const g0 = (D.ablauf || []).length; ablaufAusVorlage(D, v); if (!g0) D.gaeste_ab = D.gaeste_ab || v.gaeste_ab; }, 'Ablauf aus der Vorlage', `«${v.t}»: ${v.punkte.length} Punkte, ab ${D.ankunft || v.gaeste_ab}.`);
  });
}

function vglFenster() {
  const ab = (D.abstimmung || {}), v = unterschiede(ab.abdruck, abdruck(D));
  fenster(`<h2>Vorher <em>und nachher.</em></h2><p class="satz">${v.length ? `${v.length} ${v.length === 1 ? 'Stelle hat' : 'Stellen haben'} sich seit der Bestätigung am ${h(datumKurz(ab.bestaetigt_am))} geändert. Links, was der Gastgeber bestätigt hat, rechts der Plan heute.` : 'Seit der Bestätigung hat sich nichts geändert.'}</p>
    <div class="vgl__k"><span></span><span class="mono">Bestätigt</span><span class="mono">Heute</span></div>
    <div class="vgl">${v.map(x => `<div class="vgl__z"><span class="mono">${h(x.wo)}<br><small style="text-transform:none;letter-spacing:0;color:var(--leise)">${h(x.art)}</small></span><div${x.vorher ? '' : ' class="leer"'}>${h(x.vorher || 'nicht da')}</div><div${x.nachher ? '' : ' class="leer"'}>${x.nachher ? `<mark>${h(x.nachher)}</mark>` : 'entfernt'}</div></div>`).join('')}</div>
    <div class="fenster__kn"><button class="kn kn--hell" type="button" data-zu>Schliessen</button>${v.length ? `<button class="kn kn--gold" type="button" id="v-neu">Text für die Nachricht<i>${PF}</i></button>` : ''}</div>`, true);
  const b = $('#v-neu'); if (b) b.addEventListener('click', () => { zu(); sendenFenster(2); });
}

/* Nachricht an den Gastgeber: fertig zum Kopieren, nie gesendet (CLAUDE.md: nichts geht raus) */
function nachrichtText(i) {
  const t = VORL.texte.senden[i] || VORL.texte.senden[0], ab = D.abstimmung || {};
  const aend = aenderungenText();
  const m = mehrere(A) ? 1 : 0;
  return t.text.replace(/\{(\w+)\}/g, (x, k) => k === 'anrede' ? anrede(A) : k === 'datum' ? datumLang(A.anfrage.datum) : k === 'aenderungen' ? aend : DU[k] ? DU[k][m] : x);
}
/* Prüfung 05.11.2026 (2): was sich geändert hat, mit der Art der Änderung, nie erfunden */
function aenderungenText() {
  const ab = D.abstimmung || {}, u = istBestaetigt(D) ? unterschiede(ab.abdruck, abdruck(D)) : [];
  return u.map(x => x.art === 'neu' ? `neu dazu: ${x.wo} ${x.nachher}` : x.art === 'entfernt' ? `nicht mehr dabei: ${x.wo} ${x.vorher}` : `geändert: ${x.wo} ${x.nachher}`).join('; ');
}
function sendenFenster(start = 0) {
  const mitAenderung = !!aenderungenText();
  let i = mitAenderung ? start : Math.min(start, 1);
  const an = A.gastgeber || {};
  fenster(`<h2>Text für <em>die Nachricht.</em></h2><p class="satz">Fertig zum Kopieren. Du schickst ihn selbst, zusammen mit «Dein Abend» als PDF. Danach vermerkst du hier, dass er raus ist.</p>
    <div class="feld"><span>Fassung</span>${chips('n-art', VORL.texte.senden.map((t, k) => [String(k), t.t]).filter(([k]) => k !== '2' || mitAenderung), String(i))}</div>
    <div class="brief"><p class="brief__k"><span class="mono">An</span> ${h(gastgeberVon(A))}${an.email ? ` · <span class="brief__mail">${h(an.email)}</span>` : ''}</p><p class="brief__k"><span class="mono">Betreff</span> Dein Abend am ${h(datumKurz(A.anfrage.datum))}</p><div class="brief__t" id="n-text"></div></div>
    <div class="fenster__kn"><button class="kn kn--hell" type="button" data-zu>Schliessen</button><button class="kn kn--hell" type="button" id="n-pdf">«Dein Abend» als PDF<i>${PF}</i></button><button class="kn kn--hell" type="button" id="n-kopie">Kopieren<i>${PF}</i></button><button class="kn" type="button" id="n-ok">Als gesendet vermerken<i>${PF}</i></button></div>`, true);
  const zeig = () => { $('#n-text').innerHTML = nachrichtText(i).split('\n\n').map(a => `<p>${h(a).replace(/\n/g, '<br>')}</p>`).join(''); };
  zeig(); chipsLos($('#fenster'));
  $('#n-art').addEventListener('wahl', () => { i = +chipWahl('n-art'); zeig(); });
  $('#n-kopie').addEventListener('click', async () => {
    const t = `Betreff: Dein Abend am ${datumKurz(A.anfrage.datum)}\n\n${nachrichtText(i)}`;
    try { await navigator.clipboard.writeText(t); sag('Kopiert', 'Der Text liegt in der Zwischenablage.'); }
    catch (e) { const r = document.createRange(); r.selectNodeContents($('#n-text')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); sag('Text markiert', 'Mit ⌘C kopieren.'); }
  });
  $('#n-pdf').addEventListener('click', ev => pdf('gastgeber', ev));
  $('#n-ok').addEventListener('click', () => { zu(); tun(() => { D.abstimmung = Object.assign({}, D.abstimmung, { gesendet: heute() }); }, 'Als gesendet vermerkt', `«Dein Abend» ist bei ${anrede(A)}. Wenn die Bestätigung kommt, trägst du sie unter «Abstimmung» ein.`, 'abstimmung'); });
}
function bestaetigtFenster() {
  const ab = D.abstimmung || {};
  fenster(`<h2>Vom Gastgeber <em>bestätigt.</em></h2><p class="satz">Trag ein, wann und von wem «passt so» kam. Der Plan gilt dann als bestätigt, der Abend steht auf «Geplant». Jede spätere Änderung erscheint als «geändert nach Bestätigung».</p>
    <div class="feld zw2">${fIn('b-am', 'Bestätigt am', datumKurz(heute()), { ph: 'TT.MM.JJJJ', mode: 'numeric' })}${fIn('b-von', 'Von', ab.bestaetigt_von || gastgeberVon(A).split(' und ')[0])}</div>
    <p class="fehler" id="b-f" role="alert"></p>
    <div class="fenster__kn"><button class="kn kn--hell" type="button" data-zu>Abbrechen</button><button class="kn" type="button" id="b-ok">Bestätigung eintragen<i>${PF}</i></button></div>`);
  $('#b-ok').addEventListener('click', async () => {
    const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(wert('b-am')); if (!m) return $('#b-f').textContent = 'Das Datum bitte als TT.MM.JJJJ, z. B. ' + datumKurz(heute()) + '.';
    const am = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`, von = wert('b-von'), tg = new Date(+m[3], +m[2] - 1, +m[1]);
    if (tg.getFullYear() !== +m[3] || tg.getMonth() !== +m[2] - 1 || tg.getDate() !== +m[1]) return $('#b-f').textContent = 'Diesen Tag gibt es nicht. Bitte das Datum prüfen.';
    if (am > heute()) return $('#b-f').textContent = 'Die Bestätigung kann nicht in der Zukunft liegen.';
    if (!von) return $('#b-f').textContent = 'Bitte eintragen, von wem die Bestätigung kam.';
    zu();
    const ok = await (async () => { const alt = JSON.stringify(D); D.abstimmung = { gesendet: ab.gesendet || am, bestaetigt_am: am, bestaetigt_von: von, fassung: (+D.fassung || 0) + 1, abdruck: abdruck(D), nachher: [] }; if (JSON.stringify(D) === alt) return false; liste(); return speichern('Bestätigt', `Vom Gastgeber bestätigt am ${datumKurz(am)}.`); })();
  });
}
/* Prüfung 05.11.2026 (15): ein Fehlklick lässt sich zurücknehmen; der Abend steht wieder auf «geplant» (bestätigt) oder «zugesagt» */
async function nichtVorbei(vor) {
  const soll = vor || (istBestaetigt(D) ? 'geplant' : 'zugesagt');
  if (await statusSetzen(soll, 'doch nicht vorbei')) { alles(); sag('Der Abend ist nicht mehr vorbei', soll === 'geplant' ? 'Er steht wieder auf «Geplant».' : 'Er steht wieder auf «Zugesagt».'); }
}
function vorbei() {
  frage('Abend <em>vorbei?</em>', `Der Abend von ${gastgeberVon(A)} am ${datumKurz(A.anfrage.datum)} geht damit an «${WO.name('nachher')}»: Dank, Erinnerung, Fotos. Der Plan bleibt hier, wie er war.`, 'Als vorbei markieren', async () => {
    const vor = A.status;
    if (await statusSetzen('vorbei', 'Abend vorbei')) { alles(); sag('Der Abend ist vorbei', `Weiter in «${WO.name('nachher')}».`, [{ t: 'Rückgängig', f: () => nichtVorbei(vor) }, { t: 'Öffnen', href: (WEGE.nachher || '/angelina-strelow/werkzeuge/nachher/') + '#' + Z }]); }
  });
}

/* PDF: entsteht lokal (node + Playwright auf diesem Rechner, abendplan/server.py), öffnet sich im neuen Tab. Den Tab beim Klick öffnen, sonst blockt Safari (Endprüfung 19.10.2026). */
async function pdf(art, ev) {
  if (!Z) return;
  if (OFFEN && !(await speichern('Gespeichert', 'Das PDF zeigt den gespeicherten Plan.'))) return;
  const tab = window.open('', '_blank');
  if (tab) { tab.document.write(`<title>PDF entsteht …</title><body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#120D10;color:#E1CFC5;font:15px Montserrat,system-ui,sans-serif">Das Blatt wird gesetzt …</body>`); tab.document.close(); }
  sag('PDF entsteht', art === 'arbeit' ? 'Dein Arbeitsblatt, gleich im neuen Tab.' : '«Dein Abend», gleich im neuen Tab.', [], false, 4000);
  try {
    const r = await api(EIGEN + 'pdf', 'POST', { id: Z, art });
    /* das Blatt liegt im Datenordner, der gemeinsame Server liefert es unter /abendplan/dateien/<name> */
    if (tab) tab.location.href = r.url; else sag('PDF fertig', r.name, [{ t: 'Öffnen', href: r.url }]);
  } catch (e) { if (tab) tab.close(); fehlerSagen('Kein PDF', e); }
}

async function verlaufFenster() {
  if (!Z) return sag('Erst einen Abend öffnen.', 'Frühere Fassungen gibt es je Abend.');
  let l = {};
  try { l = await api(EIGEN + 'fassungen?id=' + encodeURIComponent(Z)); } catch (e) { return fehlerSagen('Verlauf nicht lesbar', e); }
  const z = (x, art) => `<div class="verlauf__z"><div><b>${h(x.titel)}</b><br><span class="mono">${h(x.zeit)}${x.fassung ? ' · Fassung ' + h(x.fassung) : ''}</span>${x.nach ? '<br><span class="verlauf__n">geändert nach Bestätigung</span>' : ''}</div><div>${WO.knopf('Zurückholen', 'pfeil', 'hell', { klein: true, attr: `data-d="${h(x.datei)}"` })}</div></div>`;
  /* Prüfung 05.11.2026 (13): alle Fassungen haben dieselbe Herkunft, das Foto steht einmal neben der Gruppe */
  fenster(`<h2>Frühere <em>Fassungen.</em></h2><p class="satz">Jedes Speichern legt die Fassung davor hierher, die letzten 80. Zurückholen setzt den Plan wieder so und zählt als neue Fassung; «Rückgängig» hebt es auf.</p>
    <div class="verlauf__kopf"><span class="verlauf__b" aria-hidden="true" style="background-image:url('${bild(fotoAbend(A))}')"></span><div><b>${h(gastgeberVon(A))}</b><br><span class="mono">${h(datumLang(A.anfrage.datum))} · heute Fassung ${h(D.fassung || 0)}</span></div></div>
    <div class="verlauf">${(l.fassungen || []).map(x => z(x)).join('') || [['Gästeliste ergänzt', 'Beispiel · 02.11.2026 18:40'], ['Weine zum Hauptgang', 'Beispiel · 30.10.2026 11:15'], ['Plan aus der Vorlage', 'Beispiel · 28.10.2026 09:05']]
      .map(([b, s]) => `<div class="verlauf__z verlauf__z--bsp"><div><b>${b}</b><br><span class="mono">${s}</span></div><div><span class="kn kn--klein kn--hell" aria-disabled="true">Zurückholen</span></div></div>`).join('') + '<p class="verlauf__bsp">Beispiele. So steht hier jede frühere Fassung, sobald du speicherst.</p>'}
    ${l.ursprung ? z({ titel: 'Ursprünglicher Stand', zeit: 'so, wie der Plan angelegt war', datei: 'ursprung' }) : ''}</div>
    <div class="fenster__kn"><button class="kn kn--hell" type="button" data-zu>Schliessen</button></div>`);
  $('#fenster').addEventListener('click', async ev => {
    const b = ev.target.closest('[data-d]'); if (!b) return;
    let r; try { r = await api(EIGEN + 'fassung?id=' + encodeURIComponent(Z) + '&datei=' + encodeURIComponent(b.dataset.d)); } catch (e) { return fehlerSagen('Nicht geholt', e); }
    zu();
    tun(() => { const f = D.fassung; D = r.plan; D.fassung = f; }, 'Fassung zurückgeholt', r.zeit ? `Der Plan steht wieder wie am ${r.zeit}.` : 'Der Plan steht wieder wie am Anfang.');
  });
}

// ---------------------------------------------------------------- Laden und Wechseln
async function holeAlle() {
  const r = await api(API + 'abende');
  ALLE = r.abende.filter(imWerkzeug); ETAG = r.etag;
  ALLE.sort((a, b) => String(a.anfrage.datum).localeCompare(String(b.anfrage.datum)));
}
async function lade(z, still) {
  await holeAlle();
  const a = ALLE.find(x => x.id === z);
  Z = a ? z : ''; A = a || null; UNDO = [];
  D = a ? kopie(a.plan || neuerPlan(a)) : null;
  BASIS = a && a.plan ? JSON.stringify(D) : '';   /* ein neuer Plan aus der Vorlage wartet gelb, bis er gespeichert ist (R10: nichts speichert still) */
  OFFEN = !!a && !a.plan;
  try { localStorage.setItem('ap-abend', Z); } catch (e) { /* egal */ }
  history.replaceState(null, '', Z ? '#' + Z : location.pathname + location.search);
  alles();
  if (!still && a && !a.plan) sag('Neuer Plan aus der Vorlage', `«${(VORL.anlaesse.find(v => v.k === D.vorlage) || {}).t}» als Anfang. Speichern legt ihn an.`);
}
function alles() { rand(); kopf(); liste(); vorschau(); leiste(); }
async function wechsel(z) {
  document.documentElement.classList.remove('wo-rand-auf');   /* R07 */
  if (z === Z) return;
  await KETTE;
  const los = async () => { const t = setTimeout(() => document.body.classList.add('laedt'), 280); try { await lade(z); window.scrollTo(0, 0); } finally { clearTimeout(t); document.body.classList.remove('laedt'); } };
  if (OFFEN) return frage('Nicht <em>gespeichert.</em>', 'In diesem Plan stehen Eingaben, die noch nicht gespeichert sind.', 'Verwerfen und wechseln', los);
  await los();
}

// ---------------------------------------------------------------- Ereignisse
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-akt],[data-z],[data-zoom],[data-blatt],[data-spring],[data-gehe]');
  if (!b || (b.closest('#fenster') && !b.matches('[data-akt="pack"]'))) return;
  if (b.dataset.gehe === 'start') { ev.preventDefault(); return wechsel(''); }
  if (b.dataset.blatt) { BLATT = b.dataset.blatt; try { localStorage.setItem('ap-blatt', BLATT); } catch (e) { /* egal */ } leiste(); return vorschau(); }
  if (b.dataset.z !== undefined && !b.dataset.akt) return wechsel(b.dataset.z);
  if (b.dataset.spring) { document.documentElement.classList.remove('wo-rand-auf'); const t = $(`#liste .teil[data-teil="${b.dataset.spring === 'gaenge' ? 'gaenge' : b.dataset.spring}"]`); if (t) { t.scrollIntoView({ block: 'start', behavior: 'smooth' }); const k = t.dataset.teil === 'gaeste' ? 'gaeste' : t.dataset.teil; blitzRechts(k, null); } return; }
  if (b.dataset.zoom) { ZOOM = Math.min(1.3, Math.max(.35, +(ZOOM + (+b.dataset.zoom) * .1).toFixed(2))); try { localStorage.setItem('ap-zoom', ZOOM); } catch (e) { /* egal */ } return $('#vf').contentWindow.postMessage({ ap: 'zoom', zoom: ZOOM }, location.origin); }
  const a = b.dataset.akt, r = b.closest('[data-l][data-id]'), l = r ? r.dataset.l : b.dataset.l, id = r ? r.dataset.id : '';
  if (a === 'oeffne') return wechsel(b.dataset.z);
  if (a === 'speichern') return OFFEN ? speichern() : sag(leiste.gruen ? 'Gespeichert.' : 'Alles ist gespeichert.', 'Offene Eingaben gibt es gerade nicht.');
  if (a === 'rundgang') return window.rundgang && window.rundgang();
  if (a === 'verlauf') return verlaufFenster();
  if (a === 'vorlagen') return vorlagenFenster();
  if (a === 'protokoll') return protokollFenster();
  if (a === 'gesund') return gesundFenster();
  if (!D) return;
  if (a === 'pdf') return pdf(b.dataset.art || BLATT, ev);
  if (a === 'vgl') return vglFenster();
  if (a === 'senden') return sendenFenster();
  if (a === 'bestaetigt') return bestaetigtFenster();
  if (a === 'vorbei') return vorbei();
  if (a === 'nicht-vorbei') return nichtVorbei();
  if (a === 'zeiten') return zeitenNachrechnen();
  if (a === 'neu') return neuEintrag(l);
  if (a === 'edit') return eintragFenster(l, id);
  if (a === 'waehle') return waehle(r.dataset.k);
  if (a === 'kopie') return kopieren(l, id);
  if (a === 'hoch') return schiebe(l, id, -1);
  if (a === 'runter') return schiebe(l, id, 1);
  if (a === 'weg') return entfernen(l, id);
  if (a === 'pack') { const x = D.packliste.find(y => y.id === id); return tun(() => { x.hat = !x.hat; }, x.hat ? 'Nicht mehr eingepackt' : 'Eingepackt', `«${x.was}»`); }
  if (a === 'pack-weg') { const x = D.packliste.find(y => y.id === id); return tun(() => { D.packliste = D.packliste.filter(y => y.id !== id); }, 'Von der Packliste genommen', `«${x.was}»`); }
  if (a === 'pack-neu') { const t = ($('#pack-neu').value || '').trim(); if (!t) return sag('Erst eintragen, was dazukommt.'); return tun(() => { D.packliste.push({ id: neueId(D.packliste, 'k'), was: t, hat: false }); }, 'Auf der Packliste', `«${t}»`); }
});
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape' && !$('#fenster').hidden && $('#fenster [data-zu]')) zu();
  if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 's') { ev.preventDefault(); if (OFFEN) speichern(); }
  const sw = ev.target.closest && ev.target.closest('.schalter[data-akt]'); if (sw && (ev.key === ' ' || ev.key === 'Enter')) { ev.preventDefault(); sw.click(); }
  if (ev.key === 'Enter' && ev.target.id === 'pack-neu') { ev.preventDefault(); $('[data-akt="pack-neu"]').click(); }
});
$('#liste').addEventListener('dblclick', ev => { if (Date.now() - ZU_ZEIT < 800) return; const r = ev.target.closest('.r[data-l][data-id]'); if (r && ev.target.closest('.r__t')) eintragFenster(r.dataset.l, r.dataset.id); });
/* Felder im Plan: Eingaben gehen sofort rechts aufs Blatt und warten gelb, bis gespeichert wird (R10) */
function setzePfad(o, pfad, w) { const k = pfad.split('.'); let x = o; for (let i = 0; i < k.length - 1; i++) { x[k[i]] = x[k[i]] || {}; x = x[k[i]]; } x[k[k.length - 1]] = w; }
$('#liste').addEventListener('input', ev => {
  const el = ev.target.closest('[data-f]'); if (!el || !D) return;
  const max = +el.getAttribute('maxlength') || 0; if (max && el.value.length > max) el.value = el.value.slice(0, max);
  let w = el.value;
  if (el.dataset.f === 'vorort.stellt') w = w.split('\n').map(x => x.trim()).filter(Boolean);
  setzePfad(D, el.dataset.f, w);
  if (el.closest('.falsch')) zeitenMarkieren();   /* eine korrigierte Uhrzeit verliert ihre Markierung sofort */
  geaendert(); clearTimeout(TIMER); TIMER = setTimeout(vorschau, 250);
});
$('#liste').addEventListener('change', ev => {
  const el = ev.target.closest('[data-f]'); if (!el || !D) return;
  if (['ankunft', 'gaeste_ab', 'ende'].includes(el.dataset.f)) { const z = zeitForm(el.value); if (z !== el.value) { el.value = z; setzePfad(D, el.dataset.f, z); geaendert(); vorschau(); } if (zeitenMarkieren().includes(el.dataset.f)) sag('Uhrzeit prüfen', 'Bitte als Stunde und Minute, z. B. 18:30.', [], true); }
});
$('#liste').addEventListener('click', ev => {
  const b = ev.target.closest('[data-gruss] button'); if (!b || !D) return;
  D.gruss = b.dataset.v; const t = $('#liste [data-f="gruss"]'); if (t) { t.value = D.gruss; mwWachsen(t); }
  $$('[data-gruss] button').forEach(x => x.setAttribute('aria-pressed', x === b)); geaendert(); vorschau();
});
$('#liste').addEventListener('focusin', ev => {
  const t = ev.target.closest && ev.target.closest('[data-f]'); if (!t) return;
  $$('#liste .mw-an').forEach(x => { if (!x.contains(t)) x.classList.remove('mw-an'); });
  (t.closest('label.feld') || t).classList.add('mw-an');
  const k = t.dataset.f.split('.')[0]; blitzRechts(k === 'vorort' ? 'vorort' : k === 'intern' ? 'intern' : 'abend', null);
});
function mwWachsen(el) { (el ? [el] : $$('#liste textarea.mw-t')).forEach(t => { t.style.height = 'auto'; let hoch = t.scrollHeight; if (!t.value && t.placeholder) { t.value = t.placeholder; hoch = Math.max(hoch, t.scrollHeight); t.value = ''; } t.style.height = hoch + 2 + 'px'; }); }
document.addEventListener('input', ev => { if (ev.target.matches && ev.target.matches('textarea.mw-t')) mwWachsen(ev.target); });
document.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.matches && ev.target.matches('textarea.mw-t:not(.mw-lang)')) ev.preventDefault(); });
window.addEventListener('resize', () => mwWachsen());
window.addEventListener('beforeunload', ev => { if (OFFEN) { ev.preventDefault(); ev.returnValue = ''; } });   /* R13 */

// ---------------------------------------------------------------- Start
(async () => {
  /* Langsame oder belegte Leitung (Robert 18.10.2026 23:54): der Start wird still bis zu dreimal versucht, erst danach steht die Meldung */
  for (let versuch = 0; ; versuch++) {
    try {
      VORL = await (await fetch('/angelina-strelow/werkzeuge/abendplan/daten/vorlagen.json', { cache: versuch ? 'reload' : 'no-store' })).json();
      await holeAlle();
      let z = location.hash.slice(1);
      if (!ALLE.some(a => a.id === z)) { try { z = localStorage.getItem('ap-abend') || ''; } catch (e) { z = ''; } }
      if (!ALLE.some(a => a.id === z)) z = '';
      await lade(z, true);
      { const zg = new URLSearchParams(location.search).get('zeige'); if (zg && Z) setTimeout(() => zg === 'verlauf' ? verlaufFenster() : zg === 'vorlagen' ? vorlagenFenster() : zg === 'senden' ? sendenFenster() : zg === 'punkt' && D.ablauf[3] ? eintragFenster('ablauf', D.ablauf[3].id) : null, 400); }
      api(EIGEN + 'gesund').then(g => { STATUS_ROT = !(g.schreibbar && g.node && g.playwright && g.schriften && g.vorlagen); oben(); }).catch(() => { STATUS_ROT = true; oben(); });
      break;
    } catch (e) {
      if (versuch < 2) { await new Promise(r => setTimeout(r, versuch ? 3000 : 1200)); continue; }
      /* R04: Startfehler-Tür */
      document.body.innerHTML = `<div class="tuer"><div><p class="tuer__t">${h(NAME)} startet nicht.</p><p class="tuer__s">${h(e.message)}</p><a class="tuer__k" href="/angelina-strelow/werkzeuge/abendplan/pruefung.html">Prüfung öffnen</a></div></div>`;
      if (window.apMerk) window.apMerk('Start: ' + e.message);
      break;
    }
  }
})();
window.addEventListener('hashchange', () => { const z = location.hash.slice(1); if (z !== Z) wechsel(z); });   /* lade() liest die Abende neu; einen unbekannten Abend zeigt es als Übersicht */
window.AP = { get D() { return D; }, get Z() { return Z; }, get OFFEN() { return OFFEN; }, abdruck, unterschiede, offen };   /* für die Prüfläufe */
})();

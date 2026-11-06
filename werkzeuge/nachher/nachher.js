/* Nach dem Abend · Angelina Strelow, Exklusive Gastgeberin (05.11.2026). Kopie von La Réception des Culinarium («Das Gästebuch», reception.js: Rahmen, Liste mit Bild,
   Detail, Brief, Fenster, Quittung) und Le Bureau (Foto-Auswahl, Vorher/Nachher, frühere Fassungen), umgebaut auf Angelinas vierte Station eines Abends.
   Aus jedem vergangenen Abend wird, was bleibt: Dank an den Gastgeber (Bausteine, Dankeskarte), Erinnerungs-Mappe (Menü und Weine aus dem Abendplan, Fotos, ihr Satz),
   Fotos mit Freigabe (privat · Mappe · Website und Instagram) und Bildarchiv, Stimme (Fragebogen stimme.html, Sammlung, Text für die Stimmen-Seite der Website),
   Empfehlungen (mit einem Griff eine neue Anfrage), Wiedersehen (Jahrestag, Anlass im nächsten Jahr), Abschluss des Abends.
   Daten: gemeinsamer Server (../serve.py): Teil «nachher» je Abend, liest «kern», «plan», «tisch»; Sammlung «nachher-sammlung» (Freigaben der Stimmen ohne Abend).
   Eigene Wege: server.py (/angelina-strelow/werkzeuge/nachher/api/…). Nichts speichert still (R10), Speichern nur mit etag (409 KONFLIKT). Nichts geht hinaus: kein Senden, kein mailto/tel, keine KI. */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PF = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12 12 4M5.5 4H12v6.5"/></svg>';
// Schliessen ohne «×» (Robert 30.10.2026: kein X auf der Seite): der Zurück-Pfeil wie im Gästebuch
const ZU = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 9.67 2.67 6.33 6 3M2.67 6.33h7.33a3.33 3.33 0 0 1 0 6.67h-2"/></svg>';
const ZEICHEN = '<img src="/angelina-strelow/werkzeuge/assets/zeichen/siegel-berry.svg" width="691" height="956" alt="">';
const SYM = {
  korb: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5"/></svg>',
  kopie: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="8.5" height="8.5" rx="1.5"/><path d="M11 5V3.5A1 1 0 0 0 10 2.5H3.5a1 1 0 0 0-1 1V10a1 1 0 0 0 1 1H5"/></svg>',
  post: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="3.5" width="12" height="9" rx="1.5"/><path d="m2.5 4.5 5.5 4 5.5-4"/></svg>',
  haken: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7"/></svg>',
  druck: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 6V2.5h7V6M4 11.5H2.5v-5h11v5H12M4.5 9.5h7v4h-7z"/></svg>',
  plus: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg>',
  hoch: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3M4 7l4-4 4 4"/></svg>',
  runter: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M4 9l4 4 4-4"/></svg>',
  stift: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 3.5l2 2L6 12H4v-2z"/></svg>'
};
const H = window.WO_HAUS || {};
const WEBSITE = '/angelina-strelow/website/';   // die Website läuft auf Roberts Kette-Server, wird hier nur angesehen, nie geändert
const WEGE = { anleitung: 'anleitung.html', pruefung: 'pruefung.html' };
const B = window.BAUSTEINE || {};
const VORBEI = ['vorbei', 'abgeschlossen'];
const TITEL = { start: 'Übersicht', abende: 'Die Abende', dank: 'Dank', mappe: 'Erinnerungs-Mappe', fotos: 'Fotos des Abends', stimme: 'Stimme einholen',
  archiv: 'Bildarchiv', stimmen: 'Stimmen', empfehlungen: 'Empfehlungen', wiedersehen: 'Wiedersehen' };
const JE_ABEND = ['abende', 'dank', 'mappe', 'fotos', 'stimme'];
/* Bühne je Ansicht: Angelinas eigene Fotos (_haus/bild), nie dasselbe Foto zweimal auf einem Bildschirm (Fehlerbuch 10a) */
const SB_FOTO = { abende: 'festtafel', dank: 'einschenken', mappe: 'tafel', fotos: 'kerzen', stimme: 'p152', archiv: 'teller', stimmen: 'p140', empfehlungen: 'p136', wiedersehen: 'kerze' };
const KACHEL = { dank: 'einschenken', mappe: 'tafel', fotos: 'kerzen', stimme: 'gang', archiv: 'teller', stimmen: 'glas', empfehlungen: 'p140', wiedersehen: 'kerze' };
/* Fotos zum Anlass, wenn ein Abend noch keine eigenen hat (Bilder in jeder Liste, Master 3) */
const ANLASSBILD = { 'Privates Dinner': 'tafel', Geburtstag: 'p156', 'Jubiläum': 'p151', 'Feier zu Hause': 'p136' };
/* Die echten Stimmen (haus.json → stimmen) mit den Fotos, die die Website zu ihnen zeigt (website/stimmen.html) */
const STIMMBILD = ['p156', 'empfang', 'handschuh', 'glas', 'p152'];
const FREIGABE = { privat: 'Privat', mappe: 'Für die Mappe', web: 'Website und Instagram' };
const ZEIGEN = { voll: 'mit vollem Namen', vorname: 'mit Vorname und Ort', ohne: 'ohne Namen', nein: 'nicht veröffentlichen' };
const WIEDER_ART = { jubilaeum: 'Hochzeitstag', geburtstag: 'Geburtstag', advent: 'Advent', gans: 'Gänsezeit', silvester: 'Jahreswechsel', jahr: 'Ein Jahr danach' };
const S = { abende: [], etag: {}, sam: {}, samEtag: '', samEnt: null, ansicht: 'start', wahl: '', filter: 'alle', archiv: 'alle', ent: {}, basis: {}, eigen: {}, laedt: {}, angekommen: [] };

/* ---------- Kleinigkeiten ---------- */
const kopie = o => JSON.parse(JSON.stringify(o == null ? null : o));
const heute = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const tag = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
const datumKurz = iso => { const d = tag(iso); return d ? d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''; };
const datumLang = iso => DRUCK.datumLang(iso);
const zeit = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr'; };
const mal = (n, eins, viele) => n === 1 ? eins : n + ' ' + viele;
const tageBis = iso => { const d = tag(iso), h = tag(heute()); return d && h ? Math.round((d - h) / 864e5) : null; };
const abstand = n => n == null ? '' : n === 0 ? 'heute' : n === 1 ? 'morgen' : n > 0 ? (n < 14 ? 'in ' + n + ' Tagen' : n < 63 ? 'in ' + Math.round(n / 7) + ' Wochen' : 'in ' + Math.round(n / 30.4) + ' Monaten') : (n > -14 ? 'vor ' + -n + ' Tagen' : 'vor ' + Math.round(-n / 7) + ' Wochen');
const glieder = l => l.filter(Boolean).map(x => `<span class="re-gl">${x}</span>`).join('');
const zusammen = t => String(t).replace(/ (\S+)$/, ' $1');
const ihr = a => DRUCK.ihrForm((a.gastgeber || {}).name);
const form = (b, a) => b ? b[ihr(a) ? 'ihr' : 'du'] : '';
const felder = a => DRUCK.felder(a);
const bs = (liste, id) => (B[liste] || []).find(x => x.id === id);
const nutzbar = (b, a) => !(b.braucht || []).some(k => !felder(a)[k]);
const fuell = (t, a, extra = {}) => DRUCK.fuellen(t, Object.assign({}, felder(a), extra));
const vorbei = () => S.abende.filter(a => VORBEI.includes(a.status)).sort((x, y) => String((y.anfrage || {}).datum).localeCompare(String((x.anfrage || {}).datum)));
const abend = id => S.abende.find(a => a.id === id);

/* ---------- Server ---------- */
async function api(weg, daten, art) {
  let r;
  try {
    const vorab = !daten && !art && window.__vorab && (weg === '/angelina-strelow/werkzeuge/api/abende' ? window.__vorab.abende : weg === '/angelina-strelow/werkzeuge/api/sammlung/nachher-sammlung' ? window.__vorab.sammlung : null);
    if (vorab) { if (weg === '/angelina-strelow/werkzeuge/api/abende') delete window.__vorab.abende; else delete window.__vorab.sammlung; }
    r = await (vorab || fetch(weg, daten === undefined ? { cache: 'no-store' } : { method: art || 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(daten) }));
  } catch (e) { throw new Error('VERBINDUNG · Keine Verbindung. Deine Eingaben sind noch da, bitte gleich noch einmal versuchen.'); }
  let d = {};
  try { d = await r.json(); } catch (e) { throw new Error('SERVER · Antwort nicht lesbar (' + r.status + ').'); }
  if (!r.ok) { const f = new Error(d.fehler || ('SERVER · Fehler ' + r.status)); f.status = r.status; throw f; }
  return d;
}
function fehler(e) {
  const m = String((e && e.message) || e), st = (m.match(/^([A-ZÄÖÜ-]+) · /) || [])[1] || '';
  quit(m.replace(/^[A-ZÄÖÜ-]+ · /, ''), st ? 'Stichwort ' + st : '', [['Was tun?', () => window.open('pruefung.html#' + (st || 'SERVER'), '_blank', 'noopener')]], true, 12000);
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
async function laden() {
  const [d, s] = await Promise.all([api('/angelina-strelow/werkzeuge/api/abende'), api('/angelina-strelow/werkzeuge/api/sammlung/nachher-sammlung')]);
  S.abende = d.abende || []; S.etag = d.etag || {}; S.sam = s.daten || {}; S.samEtag = s.etag;
  S.abende.forEach(a => {
    if (!S.ent[a.id]) { S.basis[a.id] = kopie(a.nachher); return; }
    /* gelbe Eingabe, der Server hat einen anderen Stand (Konflikt, Zurückholen): die Antwort aus dem Fragebogen kommt in die Eingabe (Prüfung 3, N7 B),
       und die Basis wird der Stand auf dem Server. So zeigt die Leiste, was das nächste Speichern dort ändert, und Rückgängig führt zu genau diesem Stand,
       nicht zu dem vor dem anderen Fenster (Prüfung 4, N9) */
    if (gleich(S.basis[a.id] === undefined ? null : S.basis[a.id], a.nachher || null)) return;
    if (fbMischen(S.ent[a.id], S.basis[a.id], a.nachher) && !S.angekommen.includes(a.gastgeber.name)) S.angekommen.push(a.gastgeber.name);
    S.basis[a.id] = kopie(a.nachher);
  });
  if (!S.samEnt) S.samEnt = kopie(S.sam);
}

/* ---------- Eingaben: Arbeitsstand je Abend (gelb, bis gespeichert) ---------- */
function leer() { return { beispiel: false, dank: { bausteine: [], text: '', gesendet: '', karte: { vorn: 'k01', foto: '', zeilen: '' } }, fotos: [], mappe: { titel: '', satz: 'm01', satz_text: '', gesendet: '' },
  stimme: { schluessel: '', angefragt: '', antwort: null, freigabe: '' }, empfehlungen: [], wiedersehen: { art: '', datum: '', erinnern: '', baustein: '', text: '', gesendet: '', notiz: '' }, abgeschlossen: { am: '', von: '' }, fassung: 0 }; }
function voll(n) {   // fehlende Felder ergänzen, damit jede Ansicht gleich lesen kann (Daten anderer Chats immer mit (x||'') lesen, Fehlerbuch 9)
  const l = leer(), x = Object.assign(l, kopie(n) || {});
  ['dank', 'mappe', 'stimme', 'wiedersehen', 'abgeschlossen'].forEach(k => { x[k] = Object.assign(leer()[k], x[k] || {}); });
  x.dank.karte = Object.assign(leer().dank.karte, x.dank.karte || {});
  x.fotos = x.fotos || []; x.empfehlungen = x.empfehlungen || [];
  return x;
}
function ent(id) { if (!S.ent[id]) S.ent[id] = voll(S.basis[id]); return S.ent[id]; }
function sicht(a) { return S.ent[a.id] || voll(S.basis[a.id]); }   // was die Ansicht zeigt: Eingabe, sonst gespeichert
const gleich = (x, y) => JSON.stringify(x) === JSON.stringify(y);
function offeneIds() { return Object.keys(S.ent).filter(id => !gleich(S.ent[id], voll(S.basis[id]))); }
/* Ein Abend wird gespeichert (Prüfung 2, N3). Der etag gilt für den ganzen Teil «nachher»: Hat inzwischen nur ein anderer Abend
   oder der Fragebogen gespeichert, wird neu gelesen, die Antwort aus dem Fragebogen übernommen und noch einmal gespeichert.
   KONFLIKT bleibt nur, wenn derselbe Abend anders geändert wurde (zweites Fenster). */
const FB = ['antwort', 'neu', 'freigabe'];   // die Felder, die der Fragebogen schreibt (server.py stimme_rein)
const ohneFb = n => { const v = voll(n); FB.forEach(k => delete v.stimme[k]); return v; };
function fbMischen(w, b, s) {   // w = was gespeichert wird, b = Stand, von dem die Eingabe ausging, s = Stand auf dem Server
  const W = w.stimme, B = voll(b).stimme, V = voll(s).stimme, eins = (x, k) => x[k] === undefined ? null : x[k];
  const amServer = k => !gleich(eins(B, k), eins(V, k)), unberuehrt = k => gleich(eins(W, k), eins(B, k));
  const setz = (k, v) => { if (v == null) delete W[k]; else W[k] = kopie(v); };
  let neu = false;
  if (amServer('antwort')) { neu = true; if (unberuehrt('antwort')) setz('antwort', V.antwort); else if (V.antwort) setz('neu', V.antwort); }   // eigene Eingabe bleibt, die Antwort wartet auf Durchsicht
  if (amServer('neu')) { neu = neu || !!V.neu; if (V.neu || unberuehrt('neu')) setz('neu', V.neu); }
  if (amServer('freigabe') && unberuehrt('freigabe')) setz('freigabe', V.freigabe || '');
  return neu;
}
/* Gelbe Eingabe, der Server hat neu gelesen (Konflikt, Zurückholen; Prüfung 3, N7 B): die Antwort aus dem Fragebogen, die jetzt auf dem Server steht,
   wird in die Eingabe gelegt, sonst nähme das nächste Speichern sie still wieder weg. Alles andere bleibt, wie der Konflikt es meldet. */
function fbDazu(id, srv) {
  const b = voll(S.basis[id]), v = voll(srv), eins = (x, k) => x[k] === undefined ? null : x[k];
  if (FB.every(k => gleich(eins(b.stimme, k), eins(v.stimme, k)))) return false;
  const neu = fbMischen(S.ent[id], S.basis[id], srv);
  FB.forEach(k => { if (v.stimme[k] === undefined) delete b.stimme[k]; else b.stimme[k] = kopie(v.stimme[k]); }); S.basis[id] = b;
  return neu;
}
/* Zurückholen einer früheren Fassung (Prüfung 3, N7, dieselbe Ursache): eine Antwort aus dem Fragebogen, die nach jener Fassung kam, bleibt.
   vor = Stand des Teils vor dem Zurückholen. Gibt die Gastgeber zurück, deren Antwort wieder dazugelegt wurde. */
async function antwortenBehalten(vor) {
  const blieb = [];
  for (const a of S.abende) {
    const alt = voll(vor[a.id]).stimme, w = voll(a.nachher), st = w.stimme;
    const fehlt = [alt.antwort, alt.neu].filter(x => x && x.herkunft !== 'eingetragen' && !gleich(x, st.antwort || null) && !gleich(x, st.neu || null));
    if (!fehlt.length) continue;
    fehlt.forEach(x => { if (!st.antwort) { st.antwort = kopie(x); st.freigabe = ''; } else if (!st.neu || String(x.eingang) >= String(st.neu.eingang)) st.neu = kopie(x); });   // eingang nur auf die Minute
    if (gleich(w.stimme, voll(a.nachher).stimme)) continue;
    w.fassung = (w.fassung || 0) + 1;
    const gesp = await schreibeAbend(a.id, w, 'Antwort aus dem Fragebogen behalten');
    if (S.ent[a.id]) fbDazu(a.id, gesp); else S.basis[a.id] = kopie(gesp);
    a.nachher = kopie(gesp); blieb.push(a.gastgeber.name);
  }
  S.angekommen.length = 0;
  return blieb;
}
async function schreibeAbend(id, wert, was) {
  wert = kopie(wert);
  for (let i = 0; ; i++) {
    try { const d = await api('/angelina-strelow/werkzeuge/api/teil/nachher/' + encodeURIComponent(id), { wert, etag: S.etag.nachher, wer: 'Angelina', was }, 'PUT'); S.etag.nachher = d.etag; return wert; }
    catch (e) {
      if (e.status !== 409 || i >= 3) throw e;
      const t = await api('/angelina-strelow/werkzeuge/api/teil/nachher'), srv = (t.daten || {})[id] || null;
      if (!gleich(ohneFb(S.basis[id]), ohneFb(srv))) throw e;   // derselbe Abend anders geändert: Konflikt melden, nichts überschreiben
      if (!wert && !gleich(voll(S.basis[id]).stimme, voll(srv).stimme)) wert = voll(null);   // Rückgängig auf «noch nichts gespeichert», aber eine Antwort kam
      if (wert && fbMischen(wert, S.basis[id], srv)) S.angekommen.push(abend(id).gastgeber.name);
      if (!gleich(voll(S.basis[id]).stimme, voll(srv).stimme) && S.ent[id]) fbMischen(S.ent[id], S.basis[id], srv);
      S.basis[id] = kopie(srv); S.etag.nachher = t.etag;
    }
  }
}
function samOffen() { return !gleich(S.samEnt || {}, S.sam || {}); }
function eingaben() { return offeneIds().reduce((n, id) => n + aenderungen(voll(S.basis[id]), S.ent[id]).length, 0) + (samOffen() ? Object.keys(S.samEnt.stimmen || {}).filter(k => !gleich((S.samEnt.stimmen || {})[k], (S.sam.stimmen || {})[k])).length || 1 : 0); }
function aendere(id, fn, neuZeichnen = false) {
  fn(ent(id));
  leiste();
  if (neuZeichnen) zeichneHalten();
}
/* Was hat sich geändert: Stellen in Worten (Quittung: bis drei, «und n weitere»; Vorher/Nachher) */
function aenderungen(v, n) {
  const l = [], a = (k, t, alt, neu) => { if (!gleich(alt, neu)) l.push({ k, t, alt, neu }); };
  a('dank.text', 'Dank: Text', v.dank.text, n.dank.text); a('dank.gesendet', 'Dank: gesendet', v.dank.gesendet, n.dank.gesendet); a('dank.bausteine', 'Dank: Bausteine', v.dank.bausteine, n.dank.bausteine);
  a('dank.karte', 'Dankeskarte', v.dank.karte, n.dank.karte);
  const fv = Object.fromEntries(v.fotos.map(f => [f.id, f])), fn = Object.fromEntries(n.fotos.map(f => [f.id, f]));
  n.fotos.forEach(f => { if (!fv[f.id]) l.push({ k: 'foto+' + f.id, t: 'Foto dazu: ' + (f.titel || 'ohne Titel'), alt: '', neu: f.titel || f.datei }); else if (!gleich(fv[f.id], f)) l.push({ k: 'foto.' + f.id, t: 'Foto: ' + (f.titel || ''), alt: fotoZeile(fv[f.id]), neu: fotoZeile(f) }); });
  v.fotos.forEach(f => { if (!fn[f.id]) l.push({ k: 'foto-' + f.id, t: 'Foto entfernt: ' + (f.titel || ''), alt: f.titel || f.datei, neu: '' }); });
  if (gleich(v.fotos.map(f => f.id).filter(i => fn[i]), n.fotos.map(f => f.id).filter(i => fv[i])) === false) l.push({ k: 'fotos.reihe', t: 'Fotos: Reihenfolge', alt: v.fotos.map(f => f.titel).join(' · '), neu: n.fotos.map(f => f.titel).join(' · ') });
  a('mappe.titel', 'Mappe: Titel', v.mappe.titel, n.mappe.titel); a('mappe.satz', 'Mappe: Satz', v.mappe.satz + v.mappe.satz_text, n.mappe.satz + n.mappe.satz_text); a('mappe.gesendet', 'Mappe: gesendet', v.mappe.gesendet, n.mappe.gesendet);
  a('stimme.schluessel', 'Fragebogen-Link', v.stimme.schluessel, n.stimme.schluessel); a('stimme.angefragt', 'Stimme: angefragt', v.stimme.angefragt, n.stimme.angefragt);
  a('stimme.antwort', 'Stimme', v.stimme.antwort, n.stimme.antwort); a('stimme.neu', 'Stimme: neue Antwort', v.stimme.neu || null, n.stimme.neu || null); a('stimme.freigabe', 'Stimme: Freigabe', v.stimme.freigabe, n.stimme.freigabe); a('stimme.baustein', 'Stimme: Nachricht', v.stimme.baustein, n.stimme.baustein);
  a('empfehlungen', 'Empfehlungen', v.empfehlungen, n.empfehlungen);
  a('wiedersehen', 'Wiedersehen', v.wiedersehen, n.wiedersehen);
  a('abgeschlossen', 'Abschluss', v.abgeschlossen, n.abgeschlossen);
  return l;
}
const fotoZeile = f => [f.titel, FREIGABE[f.freigabe], f.freigabe === 'web' ? (f.erlaubnis === true ? 'Erlaubnis ja' : f.erlaubnis === false ? 'Erlaubnis nein' : 'Erlaubnis offen') : '', f.gaeste ? 'Gäste erkennbar' : '', f.mappe ? 'in der Mappe' : ''].filter(Boolean).join(' · ');

/* ---------- Was nach einem Abend noch offen ist (ruhig benannt) ---------- */
function stationen(a) {
  const n = sicht(a), web = n.fotos.filter(f => f.freigabe === 'web'), ohneJa = web.filter(f => f.erlaubnis !== true);
  const offenEmpf = n.empfehlungen.filter(e => !e.anfrage && e.kontakt);   // ohne E-Mail ist es eine Notiz: daraus kann keine Anfrage werden, sie hält den Abend nicht offen
  const st = n.stimme;
  return [
    { k: 'dank', t: 'Dank', fertig: !!n.dank.gesendet, satz: n.dank.gesendet ? 'Gesendet am ' + datumKurz(n.dank.gesendet) + (n.dank.karte.gedruckt ? ', Karte gedruckt' : '') : n.dank.text ? 'Entwurf liegt bereit' : 'Noch nicht geschrieben' },
    { k: 'fotos', t: 'Fotos', fertig: n.fotos.length > 0 && !ohneJa.length, satz: !n.fotos.length ? 'Noch keine Fotos' : ohneJa.length ? mal(ohneJa.length, 'Ein Foto wartet', 'Fotos warten') + ' auf die Erlaubnis' : mal(n.fotos.length, 'Ein Foto', 'Fotos') + (web.length ? ', ' + web.length + ' für die Website' : '') },
    { k: 'mappe', t: 'Erinnerungs-Mappe', fertig: !!n.mappe.gesendet, satz: n.mappe.gesendet ? 'Gesendet am ' + datumKurz(n.mappe.gesendet) : n.fotos.some(f => f.mappe) ? 'Bereit zum Ansehen' : 'Noch keine Fotos gewählt' },
    { k: 'stimme', t: 'Stimme', fertig: !!st.antwort && !st.neu, satz: st.neu ? 'Neue Antwort vom ' + datumKurz(st.neu.eingang) + ' wartet auf deine Durchsicht' : st.antwort ? 'Angekommen am ' + datumKurz(st.antwort.eingang) : st.angefragt ? 'Gefragt am ' + datumKurz(st.angefragt) + ', noch keine Antwort' : 'Noch nicht gefragt' },
    { k: 'empfehlungen', t: 'Empfehlungen', fertig: !offenEmpf.length, satz: !n.empfehlungen.length ? 'Niemand notiert' : offenEmpf.length ? mal(offenEmpf.length, 'Eine wartet', 'warten') + ' auf eine Anfrage' : n.empfehlungen.some(e => !e.anfrage) ? 'Angelegt oder als Notiz gemerkt' : 'Alle als Anfrage angelegt' }
  ];
}
const offenStationen = a => stationen(a).filter(s => !s.fertig && !(s.k === 'empfehlungen' && !sicht(a).empfehlungen.length));
const offenRoh = a => offenStationen(a).map(s => s.t);
const offenJetzt = a => a.status === 'abgeschlossen' ? [] : offenStationen(a);   // abgeschlossen heisst: was noch fehlt, bleibt bewusst so (Karte, Kopf, Filter und jede Zahl im Rand)
const offenKurz = a => offenJetzt(a).map(s => s.t);

/* ---------- Fotos ---------- */
function fotoSrc(f, gross = false) {
  if (!f) return '';
  if (f.quelle === 'eigen') return '/angelina-strelow/werkzeuge/nachher/dateien/' + encodeURIComponent(f.datei);   // gemeinsamer Weg (serve.py, seit 05.11.2026): <daten>/nachher-dateien/
  return '/angelina-strelow/werkzeuge/assets/bild/' + f.datei + (gross ? '-1000' : '-640') + '.webp';
}
const img = (f, kl, gross) => `<span class="${kl}" aria-hidden="true"><img src="${esc(fotoSrc(f, gross))}"${f && f.quelle === 'eigen' ? ` data-eigen="${esc(f.datei)}"` : ''} alt="" width="640" height="800" decoding="async"></span>`;
const hausbild = (k, kl) => `<span class="${kl}" aria-hidden="true"><img src="/angelina-strelow/werkzeuge/assets/bild/${k}-640.webp" alt="" width="640" height="800" decoding="async"></span>`;
function abendBild(a) { const n = sicht(a); const f = n.fotos.find(x => x.freigabe !== 'privat') || n.fotos[0]; return f ? img(f, 're-a__bild') : hausbild(ANLASSBILD[(a.anfrage || {}).anlass] || 'tafel', 're-a__bild'); }

/* ---------- Rahmen: Kopf, Rand, Leiste ---------- */
function kopfLeiste() {
  const l = vorbei(), offen = l.filter(a => offenKurz(a).length).length;
  $('#kopf').innerHTML = WO.kopf({ werkzeug: 'nachher', unter: 'Abende', titel: TITEL[S.ansicht] || WO.name('nachher'),
    stand: offen ? mal(offen, 'Ein Abend', 'Abende') + ' mit Offenem' : 'Alles erledigt', pruefung: WEGE.pruefung, anleitung: WEGE.anleitung, website: WEBSITE + 'stimmen.html', marke: 'data-gehe="start"' });
  $$('#kopf [data-gehe]').forEach(x => x.onclick = e => { e.preventDefault(); gehe(x.dataset.gehe); });
}
function rand() {
  const an = S.ansicht, l = vorbei();
  const zahl = k => l.filter(a => offenJetzt(a).some(s => s.k === k)).length;
  const e = (key, text, z = 0) => ({ text, zahl: z, an: an === key, attr: `data-gehe="${key}"` });
  const stimmenWarten = alleStimmen().filter(s => s.zeigbar && s.freigabe !== 'web' && s.zeigen !== 'nein').length;
  const naechst = l.filter(a => { const w = sicht(a).wiedersehen, t = tageBis(w.datum); return w.datum && !w.gesendet && t != null && t >= 0 && tageBis(w.erinnern || w.datum) <= 0; }).length;
  $('#rand').innerHTML = WO.rand([{ titel: '', eintraege: [e('start', 'Übersicht')] },
    { titel: 'Je Abend', eintraege: [e('abende', 'Die Abende', l.filter(a => offenKurz(a).length).length), e('dank', 'Dank', zahl('dank')), e('mappe', 'Erinnerungs-Mappe', zahl('mappe')), e('fotos', 'Fotos des Abends', zahl('fotos')), e('stimme', 'Stimme einholen', zahl('stimme'))] },
    { titel: 'Über alle Abende', eintraege: [e('archiv', 'Bildarchiv'), e('stimmen', 'Stimmen', stimmenWarten), e('empfehlungen', 'Empfehlungen', zahl('empfehlungen')), e('wiedersehen', 'Wiedersehen', naechst)] }], { website: WEBSITE + 'index.html', anleitung: WEGE.anleitung, pruefung: WEGE.pruefung });
  const w = $('#rand .wo-rand__wege'), pf = WO.ic('pfeil');
  const bsp = l.find(a => sicht(a).stimme.schluessel && !sicht(a).stimme.antwort);
  if (w) {
    w.insertAdjacentHTML('afterbegin', `<a href="${WEBSITE}stimmen.html" target="_blank" rel="noopener">Stimmen auf der Website${pf}</a>` + (bsp ? `<a href="stimme.html?abend=${esc(bsp.id)}&amp;s=${esc(sicht(bsp).stimme.schluessel)}" target="_blank" rel="noopener">Fragebogen ansehen${pf}</a>` : ''));
  }
  $$('#rand [data-gehe]').forEach(b => b.onclick = () => gehe(b.dataset.gehe));
  kopfLeiste();
}
let fertigBis = 0;
function leiste() {
  const n = eingaben(), ids = offeneIds();
  const titel = n ? mal(n, 'Eine Eingabe', 'Eingaben') + ' nicht gespeichert' : 'Alles ist gespeichert';
  const satz = n ? (ids.length ? 'Bei ' + ids.map(i => (abend(i) || {}).gastgeber ? abend(i).gastgeber.name : i).join(', ') + '. ' : '') + 'Speichern legt alles in einem Schritt ab (⌘S).' : 'Nichts geht von hier hinaus: Nachrichten kopierst du, gesendet wird von dir.';
  const art = n ? 'wartet' : Date.now() < fertigBis ? 'fertig' : 'glas';
  $('#leiste').innerHTML = WO.leiste({ titel, satz,
    knoepfe: WO.knopf('Frühere Fassungen', 'verlauf', 'glas', { id: 'l-verlauf', klein: true }) + (n ? WO.knopf('Vorher, nachher', 'auge', 'glas', { id: 'l-vn', klein: true }) : '')
      + WO.knopf('Neu laden', 'verlauf', 'glas', { id: 'l-neu', klein: true })
      + WO.knopf(art === 'fertig' ? 'Gespeichert' : 'Speichern', 'haken', art === 'glas' ? 'glas' : 'glas', { id: 'l-speichern', klein: true, klasse: art === 'wartet' ? 'wo-kn--wartet' : art === 'fertig' ? 'wo-kn--fertig' : '' }) });
  $('#l-speichern').onclick = speichern;
  $('#l-verlauf').onclick = verlaufFenster;
  $('#l-neu').onclick = () => nachsehen(true);
  if ($('#l-vn')) $('#l-vn').onclick = vorherNachher;
  rand();
}
function kopf(mono, titel, satz, knoepfe = '', foto = '') {   // Bühne jeder Ansicht = Startbild «buehne» des Pakets mit dem Foto der Ansicht (wie im Gästebuch)
  return WO.startbild({ werkzeug: 'nachher', art: 'buehne', zier: esc(WO.name('nachher') + ' · ' + mono), h1: titel, satz, knoepfe,
    foto: '/angelina-strelow/werkzeuge/assets/bild/' + (foto || SB_FOTO[S.ansicht] || 'raum') + '-1000.webp' });
}
function gehe(ziel, wahl = '') {
  if (!TITEL[ziel]) ziel = 'start';
  if (wahl) S.wahl = wahl;
  S.ansicht = ziel;
  try { localStorage.setItem('nachher-ansicht', ziel); if (S.wahl) localStorage.setItem('nachher-wahl', S.wahl); } catch (e) { /* privat */ }
  if (location.hash.slice(1) !== ziel) history.replaceState(null, '', '#' + ziel);
  rand(); zeichne(); window.scrollTo(0, 0);
}

/* ---------- Ansichten ---------- */
function zeichne() {
  const el = $('#ansicht');
  try {
    const v = S.ansicht;
    el.innerHTML = v === 'start' ? start() : JE_ABEND.includes(v) ? jeAbend(v) : v === 'archiv' ? archiv() : v === 'stimmen' ? stimmenS() : v === 'empfehlungen' ? empfehlungenS() : wiedersehenS();
    verbinde();
  } catch (e) { fehler(e); console.error(e); }
}
function zeichneHalten() { const y = scrollY, el = $('#ansicht'), h = el.offsetHeight; el.style.minHeight = h + 'px'; zeichne(); $$('#ansicht .re-auf').forEach(x => x.classList.add('still')); scrollTo({ top: y, behavior: 'instant' }); requestAnimationFrame(() => { scrollTo({ top: y, behavior: 'instant' }); setTimeout(() => { el.style.minHeight = ''; }, 300); }); }

function start() {
  const l = vorbei(), mitOffen = l.filter(a => offenKurz(a).length), st = alleStimmen(), web = alleFotos().filter(x => x.f.freigabe === 'web' && x.f.erlaubnis === true);
  const kach = (k, z, t, s) => `<button class="wo-ag" type="button" data-gehe="${k}"><span class="wo-ag__b"><img src="/angelina-strelow/werkzeuge/assets/bild/${KACHEL[k]}-640.webp" alt="" width="640" height="800" decoding="async"></span><span class="wo-ag__t"><i class="wo-ag__z">${WO.ic(z)}</i><b>${t}</b><span>${s}</span></span></button>`;
  const nWieder = l.filter(a => sicht(a).wiedersehen.datum && !sicht(a).wiedersehen.gesendet).sort((x, y) => String(sicht(x).wiedersehen.datum).localeCompare(sicht(y).wiedersehen.datum))[0];
  const stZeig = st.filter(s => s.zeigbar).slice(0, 3);
  return WO.startbild({ werkzeug: 'nachher', art: 'voll', h1: `<span data-wo-gruss>${WO.gruss()}</span> <em>Was bleibt vom Abend?</em>`,
    satz: 'Nach jedem Abend wird hier, was bleibt: ein Dank in deinen Worten, eine Erinnerungs-Mappe für den Gastgeber, Bilder mit Erlaubnis und eine Stimme für deine Website. Wer am Abend nach dir gefragt hat, steht hier, und wen du im nächsten Jahr wieder grüssen magst. Verschickt wird nur, was du selbst schickst.',
    knoepfe: WO.knopf('Anleitung', 'buch', 'gold', { href: 'anleitung.html', neu: true }) + WO.knopf('Bildarchiv', 'foto', 'glas', { attr: 'data-gehe="archiv"' }) }) +
    `<div class="wo-lage">
      <div class="wo-lg"><i class="wo-lg__z">${WO.ic('uhr')}</i><span class="wo-mk">Nach dem Abend</span><b>${mitOffen.length ? mal(mitOffen.length, 'Ein Abend', 'Abende') + ' mit Offenem' : 'Alles erledigt'}</b><p>${mitOffen.length ? mitOffen.map(a => esc(a.gastgeber.name) + ': ' + esc(offenKurz(a).join(', '))).join('. ') + '.' : mal(l.length, 'Ein vergangener Abend', 'vergangene Abende') + ', jeder abgeschlossen.'}</p><button class="wo-lk" type="button" data-gehe="abende">Zu den Abenden</button></div>
      <div class="wo-lg"><i class="wo-lg__z">${WO.ic('chat')}</i><span class="wo-mk">Stimmen</span><b>${mal(st.length, 'Eine Stimme', 'Stimmen')}</b><p>${st.filter(s => s.freigabe === 'web').length} für die Website freigegeben${st.filter(s => s.offen).length ? ', ' + mal(st.filter(s => s.offen).length, 'eine Antwort', 'Antworten') + ' steht noch aus' : ''}.</p><button class="wo-lk" type="button" data-gehe="stimmen">Alle Stimmen</button></div>
      <div class="wo-lg"><i class="wo-lg__z">${WO.ic('foto')}</i><span class="wo-mk">Bildarchiv</span><b>${mal(alleFotos().length, 'Ein Foto', 'Fotos')}</b><p>${web.length} mit Erlaubnis für Website und Instagram.${nWieder ? ' Nächstes Wiedersehen: ' + esc(nWieder.gastgeber.name) + ', ' + abstand(tageBis(sicht(nWieder).wiedersehen.datum)) + '.' : ''}</p><button class="wo-lk" type="button" data-gehe="archiv">Zum Bildarchiv</button></div>
    </div>
    <h2 class="wo-zw">Was <em>bleibt</em></h2><div class="wo-aufg">${kach('dank', 'mail', 'Dank', 'Bausteine, Karte zum Drucken')}${kach('mappe', 'buch', 'Erinnerungs-Mappe', 'Menü, Weine, Bilder, dein Satz')}${kach('fotos', 'foto', 'Fotos des Abends', 'Wählen, ordnen, freigeben')}${kach('stimme', 'chat', 'Stimme einholen', 'Fragebogen für den Gastgeber')}
      ${kach('archiv', 'auge', 'Bildarchiv', 'Alle Fotos, mit Erlaubnis')}${kach('stimmen', 'siegel', 'Stimmen', 'Für die Stimmen-Seite')}${kach('empfehlungen', 'person', 'Empfehlungen', 'Wer nach dir gefragt hat')}${kach('wiedersehen', 'uhr', 'Wiedersehen', 'Jahrestag, nächster Anlass')}</div>
    <div class="re-start">
      <section class="re-start__sp"><h2 class="wo-zw">Vergangene <em>Abende</em></h2>
        ${l.length ? `<div class="re-liste">${l.slice(0, 4).map((a, i) => karteAbend(a, i + 1, 'abende')).join('')}</div><button class="link re-mehr" type="button" data-gehe="abende">${l.length > 4 ? 'Alle ' + l.length + ' Abende' : 'Zu den Abenden'}</button>`
          : `<div class="re-leer platte">${ZEICHEN}<b>Noch kein Abend vorbei.</b><p>Sobald ein Abend im Abendplan als vorbei gilt, steht er hier mit allem, was danach kommt.</p></div>`}
      </section>
      <section class="re-start__sp"><h2 class="wo-zw">Neueste <em>Stimmen</em></h2>
        <div class="re-liste">${stZeig.map(stimmeZeile).join('')}</div><button class="link re-mehr" type="button" data-gehe="stimmen">Alle ${st.length} Stimmen</button>
      </section>
    </div>`;
}
function karteAbend(a, i = 0, ziel = S.ansicht) {
  const an = a.anfrage || {}, o = offenKurz(a), st = a.status === 'abgeschlossen' ? 'Abgeschlossen' : 'Vorbei';
  return `<button class="re-a${a.status === 'abgeschlossen' ? ' erledigt' : ''}${S.wahl === a.id && JE_ABEND.includes(S.ansicht) ? ' aktiv' : ''}" style="--i:${i}" type="button" data-gehe="${ziel}" data-wahl="${esc(a.id)}">
    ${abendBild(a)}
    <span class="re-a__n"><span class="re-a__k re-gl-r">${glieder([esc(an.anlass || ''), esc(datumKurz(an.datum))])}</span><b>${esc(a.gastgeber.name)}</b><small>${o.length ? 'Noch offen: ' + esc(o.join(', ')) : a.status === 'abgeschlossen' ? (offenRoh(a).length ? 'Abgeschlossen, bewusst offen: ' + esc(offenRoh(a).join(', ')) : 'Alles erledigt') : 'Alles erledigt, bereit zum Abschliessen'}</small></span>
    <span class="re-a__st">${st}</span></button>`;
}

/* ---------- Je Abend: Liste links, Station rechts (Aufbau wie der Eingang des Gästebuchs) ---------- */
const BUEHNE = {
  abende: ['Die Abende', 'Jeder Abend, <em>und was danach kommt.</em>', 'Für jeden vergangenen Abend steht hier ruhig, was schon erledigt ist und was noch wartet: der Dank, die Fotos, die Erinnerungs-Mappe, die Stimme des Gastgebers und die Gäste, die nach dir gefragt haben. Ist alles getan, schliesst du den Abend ab.'],
  dank: ['Dank', 'Danke sagen, <em>in deinen Worten.</em>', 'Aus deinen Bausteinen entsteht ein Dank an den Gastgeber, mit den Einzelheiten seines Abends: dem Gang, dem Wein, dem Anlass. Du änderst, was du magst, kopierst ihn in deine Nachricht und vermerkst, dass er gesendet ist. Dazu eine Karte zum Drucken.'],
  mappe: ['Erinnerungs-Mappe', 'Ein Abend <em>zum Behalten.</em>', 'Datum, Anlass, das Menü und die Weine aus dem Abendplan, die schönsten Bilder und ein Satz von dir: eine kleine Mappe für den Gastgeber, als PDF oder zum Drucken.'],
  fotos: ['Fotos des Abends', 'Bilder, <em>mit Erlaubnis.</em>', 'Füge die Fotos eines Abends hinzu, wähle die schönsten aus und ordne sie. Bei jedem Foto steht, wofür es gedacht ist: nur für dich, für die Mappe, oder für Website und Instagram, wenn der Gastgeber zugestimmt hat.'],
  stimme: ['Stimme einholen', 'Wie war <em>der Abend?</em>', 'Ein kurzer Fragebogen für den Gastgeber: wie es war, ein Satz für deine Website, und ob du ihn mit Vorname und Ort zeigen darfst. Die Antwort landet hier, ohne dass du etwas abtippen musst.']
};
function jeAbend(v) {
  const l = vorbei(), f = S.filter;
  const liste = f === 'offen' ? l.filter(a => offenKurz(a).length) : f === 'fertig' ? l.filter(a => a.status === 'abgeschlossen') : l;
  if ((!S.wahl || !l.some(a => a.id === S.wahl)) && l.length) S.wahl = (l.find(a => offenKurz(a).length) || l[0]).id;
  const a = abend(S.wahl), b = BUEHNE[v];
  const zahl = k => k === 'offen' ? l.filter(x => offenKurz(x).length).length : k === 'fertig' ? l.filter(x => x.status === 'abgeschlossen').length : l.length;
  return kopf(b[0], b[1], b[2]) + (l.length ? `<div class="re-eingang"><div class="re-spalte">
      <div class="wahl2 re-filter" role="group" aria-label="Auswahl">${[['alle', 'Alle'], ['offen', 'Offen'], ['fertig', 'Erledigt']].map(([k, t]) => `<button type="button" data-filter="${k}" aria-pressed="${f === k}">${t}<i>${zahl(k)}</i></button>`).join('')}</div>
      <div class="re-liste">${liste.map((x, i) => karteAbend(x, i)).join('') || '<p class="re-tag"><span>Nichts in dieser Auswahl</span></p>'}</div></div>
      <div class="re-detail" id="detail">${a ? kopfAbend(a, v) + ({ abende: stationS, dank: dankS, mappe: mappeS, fotos: fotosS, stimme: stimmeS }[v])(a) : ''}</div></div>`
    : `<div class="re-leer platte">${ZEICHEN}<b>Noch kein Abend vorbei.</b><p>Ein Abend kommt hierher, sobald er im Abendplan als vorbei gilt.</p></div>`);
}
function kopfAbend(a, v) {
  const an = a.anfrage || {}, n = sicht(a);
  const reiter = [['abende', 'Überblick'], ['dank', 'Dank'], ['mappe', 'Mappe'], ['fotos', 'Fotos'], ['stimme', 'Stimme']];
  return `<section class="re-d re-auf" style="--i:0">
      <div class="re-d__kopf">${abendBild(a).replace('re-a__bild', 're-d__bild')}
        <div class="re-d__n"><span class="re-d__k re-gl-r">${glieder([esc(an.anlass || ''), esc([DRUCK.wochentag(an.datum), datumLang(an.datum)].filter(Boolean).join(', ')), esc(an.ort || '')])}</span><h2>${esc(a.gastgeber.name)}</h2></div>
        <div class="re-d__kn">${a.status === 'abgeschlossen' ? `<button class="kn kn--klein kn--linie" type="button" data-akt="oeffnen">Wieder öffnen<i>${ZU}</i></button>` : `<button class="kn kn--klein kn--gold" type="button" data-akt="abschliessen">Abschliessen<i>${SYM.haken}</i></button>`}</div></div>
      ${n.beispiel || a.beispiel ? `<p class="na-bsp">${esc(/^Beispiel/.test(n.hinweis || '') ? n.hinweis : 'Beispiel: erfundener Abend, damit jede Station gefüllt ist.')}</p>` : n.hinweis ? `<p class="na-bsp na-bsp--echt">${esc(n.hinweis)}</p>` : ''}
      <dl class="re-angaben re-angaben--wann re-angaben--drei"><div><dt>Tag</dt><dd>${esc(datumLang(an.datum) || 'nicht genannt')}</dd></div><div><dt>Ort</dt><dd>${esc(an.ort || 'nicht genannt')}</dd></div><div><dt>Gäste</dt><dd>${esc((a.plan && (a.plan.gaeste || []).length) ? mal(a.plan.gaeste.length, 'ein Gast', a.plan.gaeste.length + ' Gäste') : an.gaeste ? an.gaeste : 'nicht genannt')}</dd></div></dl>
      ${v === 'abende' && an.wunsch ? `<blockquote class="re-anliegen">${esc(an.wunsch)}</blockquote>` : ''}
      <div class="wahl2 na-reiter" role="group" aria-label="Station">${reiter.map(([k, t]) => `<button type="button" data-gehe="${k}" data-wahl="${esc(a.id)}" aria-pressed="${v === k}">${t}</button>`).join('')}</div>
    </section>`;
}
function stationS(a) {
  const an = a.anfrage || {}, n = sicht(a), p = a.plan || {}, me = DRUCK.menue(a), w = n.wiedersehen;
  return `<section class="re-post re-auf" style="--i:1">
    <div class="re-post__kopf"><div><span class="mono">Nach dem Abend</span><h2>Was <em>noch offen ist</em></h2></div></div>
    <ul class="na-stationen">${stationen(a).map(s => `<li class="${s.fertig ? 'fertig' : ''}"><i>${s.fertig ? SYM.haken : ''}</i><span><b>${s.t}</b><small>${esc(s.satz)}</small></span><button class="link" type="button" data-gehe="${s.k}" data-wahl="${esc(a.id)}">${s.fertig ? 'Ansehen' : 'Öffnen'}</button></li>`).join('')}
      <li class="${w.gesendet ? 'fertig' : ''}"><i>${w.gesendet ? SYM.haken : ''}</i><span><b>Wiedersehen</b><small>${w.datum ? esc((WIEDER_ART[w.art] || 'Jahrestag') + ': ' + datumLang(w.datum) + ', ' + abstand(tageBis(w.datum))) : 'Noch kein Tag vermerkt'}</small></span><button class="link" type="button" data-gehe="wiedersehen" data-wahl="${esc(a.id)}">Öffnen</button></li></ul>
    <div class="na-zwei">
      <aside class="re-notiz"><span class="mono">Aus dem Abendplan</span><b>${me.da ? 'Menü und Weine' : 'Noch kein Abendplan'}</b>${me.da ? `<p>${esc((p.gaenge || []).filter(x => x.gericht).map(x => x.gericht).join(' · '))}</p>` : `<p>Für diesen Abend führt der Abendplan noch kein Menü. Bis dahin hat die Erinnerungs-Mappe keine Menüseite.</p>`}
        <a class="link" href="${esc(H.wege.abendplan)}#${esc(a.id)}" target="_blank" rel="noopener">${esc(WO.name('abendplan'))} öffnen</a></aside>
      <aside class="re-notiz"><span class="mono">Abschluss</span><b>${a.status === 'abgeschlossen' ? 'Abgeschlossen' + (n.abgeschlossen.am ? ' am ' + datumKurz(n.abgeschlossen.am) : '') : offenKurz(a).length ? 'Noch nicht abgeschlossen' : 'Bereit zum Abschliessen'}</b>
        <p>${a.status === 'abgeschlossen' ? 'Der Abend ist erledigt. Du kannst ihn jederzeit wieder öffnen.' : offenKurz(a).length ? 'Abschliessen geht auch, wenn etwas bewusst offen bleibt (etwa keine Stimme).' : 'Dank, Fotos, Mappe und Stimme sind erledigt.'}</p></aside>
    </div></section>`;
}
/* Dank: Bausteine links, Brief rechts, Karte darunter */
function dankS(a) {
  const n = sicht(a), d = n.dank, gruppen = [['anfang', 'Anfang'], ['mitte', 'Was du sagen magst'], ['schluss', 'Schluss']];
  const kv = bs('karte', d.karte.vorn) || B.karte[0], ft = n.fotos;
  return `<section class="re-post re-auf" style="--i:1">
    <div class="re-post__kopf"><div><span class="mono">An ${esc(a.gastgeber.name)}</span><h2>Der <em>Dank</em></h2></div>${d.gesendet ? `<span class="na-stand">Gesendet am ${esc(datumKurz(d.gesendet))}</span>` : ''}</div>
    <div class="na-dank">
      <div class="na-bausteine platte" role="group" aria-label="Bausteine">${gruppen.map(([g, t]) => `<p class="mono">${t}</p>${B.dank.filter(x => x.teil === g).map(x => { const ok = nutzbar(x, a);
        return `<label class="na-bs${ok ? '' : ' aus'}" title="${ok ? '' : 'Dafür fehlt im Abendplan noch ein Feld'}"><input type="checkbox" data-bs="${x.id}"${d.bausteine.includes(x.id) ? ' checked' : ''}${ok ? '' : ' disabled'}><span><b>${esc(x.titel)}</b><small>${ok ? esc(fuell(form(x, a), a).replace(/^Hallo [^,]+,\s*/, '').replace(/\n+/g, ' ')) : 'Braucht ' + esc((x.braucht || []).map(k => ({ gericht: 'den Gang', koch: 'wer kocht', wein: 'den Wein', anlass: 'den Anlass' }[k] || k)).join(' und ')) + ' aus dem Abendplan.'}</small></span></label>`; }).join('')}`).join('')}
        <button class="kn kn--klein kn--linie" type="button" data-akt="dank-setzen">Aus den Bausteinen setzen<i>${SYM.stift}</i></button></div>
      <div class="na-brief"><article class="brief brief--bearb" id="dank-brief"><header class="brief__kopf"><img class="na-logo" src="/angelina-strelow/werkzeuge/assets/zeichen/ganz-night.svg" alt="Angelina Strelow · Exklusive Gastgeberin"></header>
        <dl class="brief__an"><div><dt>An</dt><dd>${esc(a.gastgeber.name)}<small>${esc((a.anfrage || {}).ort || '')}</small></dd></div><div><dt>Von</dt><dd>Angelina Strelow<small>Köln und Umgebung</small></dd></div></dl>
        <div class="brief__text"><textarea id="e-dank" spellcheck="true" aria-label="Text des Danks">${esc(d.text)}</textarea></div></article>
        <div class="re-post__kn na-kn">
          <button class="kn kn--gold" type="button" data-akt="dank-kopieren">Text kopieren<i>${SYM.kopie}</i></button>
          ${d.gesendet ? `<button class="kn kn--linie" type="button" data-akt="dank-nicht">Doch nicht gesendet<i>${ZU}</i></button>` : `<button class="kn" type="button" data-akt="dank-gesendet">Als gesendet vermerken<i>${SYM.haken}</i></button>`}
          <button class="kn kn--linie" type="button" data-akt="pdf" data-art="dank">Als PDF speichern<i>${SYM.post}</i></button>
          <p class="na-warn" id="dank-emoji"${/\p{Extended_Pictographic}/u.test(d.text + d.karte.zeilen) ? '' : ' hidden'}>Emojis stehen nicht im PDF und nicht auf der Karte; im kopierten Text bleiben sie.</p>
          <p class="re-hinweis">Verschickt wird hier nichts, und es öffnet sich kein Mailprogramm. Kopier den Text in deine Nachricht an ${esc(a.gastgeber.name)} und vermerke danach, dass er gesendet ist.</p></div></div>
    </div>
    <div class="re-post__kopf na-abstand"><div><span class="mono">Zum Drucken</span><h2>Die <em>Dankeskarte</em></h2></div>${d.karte.gedruckt ? `<span class="na-stand">Gedruckt am ${esc(datumKurz(d.karte.gedruckt))}</span>` : ''}</div>
    <div class="na-karte">
      <div class="na-karte__wahl">
        <div class="feld"><span>Vorn</span><div class="wahl2 na-wahl-spalte" role="group">${B.karte.map(k => `<button type="button" data-karte-vorn="${k.id}" aria-pressed="${kv.id === k.id}">${esc(ihr(a) ? k.vornIhr : k.vorn)}</button>`).join('')}</div></div>
        <div class="feld"><span>Foto vorn</span>${ft.length ? `<div class="na-minis">${ft.map(f => `<button type="button" class="na-mini" data-karte-foto="${esc(f.id)}" aria-pressed="${(d.karte.foto || (ft[0] || {}).id) === f.id}" title="${esc(f.titel || '')}">${img(f, 'na-mini__b')}</button>`).join('')}</div>` : '<p class="leise">Noch keine Fotos. Unter «Fotos des Abends» fügst du welche hinzu.</p>'}</div>
        <label class="feld"><span>Hinten, ein paar Zeilen</span><textarea id="e-karte" rows="3">${esc(d.karte.zeilen)}</textarea></label>
        ${sigFeld()}
        <div class="na-kn"><button class="kn kn--gold kn--klein" type="button" data-akt="pdf" data-art="karte">Karte als PDF<i>${SYM.post}</i></button><button class="kn kn--klein" type="button" data-akt="drucken" data-art="karte">Drucken<i>${SYM.druck}</i></button>
          ${d.karte.gedruckt ? '' : `<button class="kn kn--klein kn--linie" type="button" data-akt="karte-gedruckt">Als gedruckt vermerken<i>${SYM.haken}</i></button>`}</div>
      </div>
      <div class="dr-vorschau na-karte__vorschau" data-vorschau="karte" data-wo-bw-nie aria-label="Vorschau der Karte"></div>
    </div></section>`;
}
/* Ihre Unterschrift unter Brief, Karte und Mappe (Robert 06.11.2026: «echte als Bild hinterlegbar, sonst edle Schreibschrift»). Liegt in der Sammlung
   «nachher-sammlung» (unterschrift = Datei im Datenordner), gilt wie jede Eingabe erst mit «Speichern», Rückgängig holt die vorige zurück. */
function sigFeld() {
  const u = (S.samEnt || {}).unterschrift;
  return `<div class="feld na-sig"><span>Deine Unterschrift unter Brief, Karte und Mappe</span>
    <div class="na-sig__zeile"><div class="na-sig__probe">${u ? `<img src="/angelina-strelow/werkzeuge/nachher/dateien/${encodeURIComponent(u)}" alt="Deine Unterschrift">` : '<span class="na-sig__schrift">Angelina</span>'}</div>
      <div class="na-sig__kn"><label class="kn kn--klein kn--linie na-datei">${u ? 'Andere hinterlegen' : 'Echte als Bild hinterlegen'}<i>${SYM.post}</i><input type="file" id="e-sig" accept="image/png,image/jpeg,image/webp" aria-label="Unterschrift als Bild"></label>
      ${u ? `<button class="link" type="button" data-akt="sig-weg">Wieder die Schreibschrift</button>` : ''}</div></div>
    <p class="leise">${u ? 'Deine echte Unterschrift steht unter dem Brief, auf der Karte und am Ende der Mappe.' : 'Bis du eine hinterlegst, unterschreibt die Schreibschrift aus deiner Marke.'} Am besten ein Scan oder Foto auf weissem Papier oder ein PNG ohne Hintergrund.</p></div>`;
}
async function sigDazu(datei) {
  if (!datei) return;
  if (datei.size > 20 * 1024 * 1024) return quit('Zu gross', 'Die Datei ist grösser als 20 MB. Bitte eine kleinere wählen.', [], true);
  try {
    const roh = await new Promise((ok, nein) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = nein; r.readAsDataURL(datei); });
    const b = await new Promise((ok, nein) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => nein(new Error('BILD · Die Datei ist kein lesbares Bild.')); i.src = roh; });
    /* freistellen (Prüfung 6): Scan oder Foto auf Papier → nur die Tinte bleibt, das Papier wird durchsichtig, damit auf Salt wie auf Night kein Kasten steht.
       Hat das Bild schon durchsichtige Stellen (PNG ohne Hintergrund), bleibt es, wie es ist. */
    const s = Math.min(1, 1600 / Math.max(b.naturalWidth, b.naturalHeight)), c = document.createElement('canvas'); c.width = Math.round(b.naturalWidth * s); c.height = Math.round(b.naturalHeight * s);
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(b, 0, 0, c.width, c.height);
    const bild = g.getImageData(0, 0, c.width, c.height), px = bild.data; let durch = false;
    for (let i = 3; i < px.length; i += 4) if (px[i] < 250) { durch = true; break; }
    if (!durch) {
      const hell = []; for (let i = 0; i < px.length; i += 4 * 7) hell.push(.299 * px[i] + .587 * px[i + 1] + .114 * px[i + 2]); hell.sort((x, y) => x - y);
      const papier = hell[Math.floor(hell.length * .6)], tinte = hell[Math.floor(hell.length * .01)], weite = Math.max(30, papier - tinte);
      for (let i = 0; i < px.length; i += 4) { const l = .299 * px[i] + .587 * px[i + 1] + .114 * px[i + 2], a = Math.max(0, Math.min(1, (papier - 12 - l) / (weite - 12)));
        px[i + 3] = Math.round(255 * Math.pow(a, .8)); }
      g.putImageData(bild, 0, 0);
    }
    const daten = c.toDataURL('image/png');
    const r = await api('api/unterschrift', { name: datei.name, daten });
    S.samEnt = Object.assign({}, S.samEnt, { unterschrift: r.datei }); leiste(); zeichneHalten();
    quit('Deine Unterschrift ist da', 'Noch gelb: «Speichern» setzt sie unter Brief, Karte und Mappe.', [], false, 7000);
  } catch (e) { fehler(e); }
}
/* Erinnerungs-Mappe: Titel, Satz, Fotos, Vorschau, PDF */
function mappeS(a) {
  const n = sicht(a), m = n.mappe, sel = n.fotos.filter(f => f.mappe && f.freigabe !== 'privat'), me = DRUCK.menue(a);
  const satz = m.satz_text || fuell(form(bs('mappe', m.satz), a), a);
  return `<section class="re-post re-auf" style="--i:1">
    <div class="re-post__kopf"><div><span class="mono">Für ${esc(a.gastgeber.name)}</span><h2>Die <em>Mappe</em></h2></div>${m.gesendet ? `<span class="na-stand">Gesendet am ${esc(datumKurz(m.gesendet))}</span>` : ''}</div>
    <div class="na-mappe">
      <div class="na-mappe__wahl">
        <label class="feld"><span>Titel</span><input id="e-mtitel" value="${esc(m.titel)}" placeholder="${esc((a.plan || {}).titel || (a.anfrage || {}).anlass || '')}"></label>
        <div class="feld"><span>Dein Satz</span><div class="na-saetze" role="group">${B.mappe.filter(x => nutzbar(x, a)).map(x => `<button type="button" data-msatz="${x.id}" aria-pressed="${!m.satz_text && m.satz === x.id}">${esc(fuell(form(x, a), a))}</button>`).join('')}</div></div>
        <label class="feld"><span>Oder ein eigener Satz</span><input id="e-msatz" value="${esc(m.satz_text)}" placeholder="${esc(satz)}"></label>
        <div class="re-notiz"><span class="mono">Was in der Mappe steht</span><b>${mal(sel.length, 'Ein Foto', 'Fotos')}${me.da ? ', Menü und Weine' : ''}</b>
          <p>${me.da ? 'Menü und Weine kommen aus dem Abendplan.' : 'Der Abendplan führt für diesen Abend noch kein Menü. Bis dahin hat die Mappe keine Menüseite; was belegt ist' + (me.kurz ? ' («' + esc(me.kurz) + '»)' : '') + ', steht auf Seite 1.'} Welche Fotos hineinkommen, wählst du bei den Fotos des Abends (nur Fotos, die nicht privat sind).</p>
          <button class="link" type="button" data-gehe="fotos" data-wahl="${esc(a.id)}">Fotos wählen</button></div>
        <div class="na-kn"><button class="kn kn--gold" type="button" data-akt="pdf" data-art="mappe">Als PDF speichern<i>${SYM.post}</i></button><button class="kn" type="button" data-akt="drucken" data-art="mappe">Drucken<i>${SYM.druck}</i></button>
          ${m.gesendet ? `<button class="kn kn--linie" type="button" data-akt="mappe-nicht">Doch nicht gesendet<i>${ZU}</i></button>` : `<button class="kn kn--linie" type="button" data-akt="mappe-gesendet">Als gesendet vermerken<i>${SYM.haken}</i></button>`}</div>
      </div>
      <div class="dr-vorschau na-mappe__vorschau" data-vorschau="mappe" data-wo-bw-nie aria-label="Vorschau der Mappe"></div>
    </div></section>`;
}
/* Fotos des Abends: hinzufügen, auswählen, ordnen, Freigabe je Foto */
function fotosS(a) {
  const n = sicht(a), web = n.fotos.filter(f => f.freigabe === 'web'), bitte = B.fotos[web.some(f => f.gaeste) ? 0 : 1];
  return `<section class="re-post re-auf" style="--i:1">
    <div class="re-post__kopf"><div><span class="mono">${mal(n.fotos.length, 'Ein Foto', 'Fotos')}</span><h2>Die <em>Fotos</em></h2></div>
      <div class="na-kn"><label class="kn kn--gold kn--klein na-datei">Fotos hinzufügen<i>${SYM.plus}</i><input type="file" id="e-fotos" accept="image/jpeg,image/png,image/webp" multiple></label><button class="kn kn--klein" type="button" data-akt="aus-bestand">Aus deinen Fotos<i>${WO.ic('foto')}</i></button></div></div>
    ${n.fotos.length ? `<div class="na-fotos">${n.fotos.map((f, i) => fotoKarte(f, i, n.fotos.length)).join('')}</div>`
      : `<div class="re-leer platte">${ZEICHEN}<b>Noch keine Fotos von diesem Abend.</b><p>Füge Fotos von deinem Rechner hinzu oder wähle aus deinen eigenen. Sie bleiben auf diesem Rechner, im Datenordner des Werkzeugs.</p></div>`}
    <div class="na-zwei">
      <aside class="re-notiz"><span class="mono">Erlaubnis</span><b>${web.length ? mal(web.filter(f => f.erlaubnis === true).length, 'Ein Foto', 'Fotos') + ' mit Ja des Gastgebers' : 'Noch kein Foto für die Website'}</b>
        <p>Auf Website und Instagram kommt ein Foto nur mit Ja des Gastgebers. Sind Gäste zu erkennen, braucht es ihr ausdrückliches Einverständnis.</p></aside>
      <aside class="re-notiz"><span class="mono">Um Erlaubnis bitten</span><b>${esc(bitte.titel)}</b><p class="na-text">${esc(fuell(form(bitte, a), a))}</p>
        <button class="link" type="button" data-akt="kopieren" data-text="${esc(fuell(form(bitte, a), a))}">Text kopieren</button></aside>
    </div></section>`;
}
function fotoKarte(f, i, zahl) {
  const warn = f.freigabe === 'web' && (f.erlaubnis !== true ? 'Für die Website fehlt noch das Ja des Gastgebers.' : f.gaeste ? 'Gäste erkennbar: nur mit ihrem ausdrücklichen Einverständnis zeigen.' : '');
  const w = (k, wert, t) => `<button type="button" data-f="${esc(f.id)}" data-feld="${k}" data-wert="${wert}" aria-pressed="${String(f[k]) === String(wert)}">${t}</button>`;
  return `<article class="na-foto${f.mappe ? ' in-mappe' : ''}" data-fid="${esc(f.id)}">
    <figure class="na-foto__b"><img src="${esc(fotoSrc(f))}"${f.quelle === 'eigen' ? ` data-eigen="${esc(f.datei)}"` : ''} alt="${esc(f.titel || '')}" width="640" height="800" decoding="async"><figcaption>${i + 1}</figcaption></figure>
    <div class="na-foto__t">
      <input class="na-foto__titel" data-f="${esc(f.id)}" data-feld="titel" value="${esc(f.titel || '')}" aria-label="Titel des Fotos" placeholder="Was ist zu sehen?">
      <div class="na-wahl"><span class="mono">Freigabe</span><div class="wahl2" role="group">${w('freigabe', 'privat', 'Privat')}${w('freigabe', 'mappe', 'Mappe')}${w('freigabe', 'web', 'Website')}</div></div>
      ${f.freigabe === 'web' ? `<div class="na-wahl"><span class="mono">Ja des Gastgebers</span><div class="wahl2" role="group">${w('erlaubnis', 'true', 'Ja')}${w('erlaubnis', 'false', 'Nein')}${w('erlaubnis', 'null', 'Gefragt?')}</div></div>` : ''}
      <div class="na-wahl"><span class="mono">Gäste erkennbar</span><div class="wahl2" role="group">${w('gaeste', 'true', 'Ja')}${w('gaeste', 'false', 'Nein')}</div></div>
      ${warn ? `<p class="na-warn">${esc(warn)}</p>` : ''}
      <div class="na-foto__kn"><label class="na-hak"><input type="checkbox" data-f="${esc(f.id)}" data-feld="mappe"${f.mappe ? ' checked' : ''}${f.freigabe === 'privat' ? ' disabled' : ''}><span>In die Mappe</span></label>
        <span class="na-rund"><button class="rund" type="button" data-schieb="-1" data-f="${esc(f.id)}" aria-label="Nach vorn"${i === 0 ? ' disabled' : ''}>${SYM.hoch}</button><button class="rund" type="button" data-schieb="1" data-f="${esc(f.id)}" aria-label="Nach hinten"${i === zahl - 1 ? ' disabled' : ''}>${SYM.runter}</button><button class="rund" type="button" data-weg="${esc(f.id)}" aria-label="Foto entfernen">${SYM.korb}</button></span></div>
    </div></article>`;
}
/* Stimme einholen: Fragebogen-Link, Nachricht, Antwort mit Freigabe */
function stimmeS(a) {
  const n = sicht(a), st = n.stimme, link = st.schluessel ? location.origin + '/angelina-strelow/werkzeuge/nachher/stimme.html?abend=' + encodeURIComponent(a.id) + '&s=' + encodeURIComponent(st.schluessel) : '';
  const b = bs('stimme', st.baustein) || B.stimme[0], text = link ? fuell(form(b, a), a, { link }) : '', w = st.antwort, nw = st.neu;
  return `<section class="re-post re-auf" style="--i:1">
    ${nw ? `<article class="na-neu platte"><span class="mono">Neue Antwort · ${esc(zeit(nw.eingang))}</span><b>${esc(a.gastgeber.name)} hat noch einmal geschrieben.</b>
      ${nw.satz ? `<p class="na-antwort__satz">«${esc(nw.satz)}»</p>` : ''}${nw.wie ? `<p class="na-antwort__wie">${esc(nw.wie)}</p>` : ''}
      <p class="leise">Die bisherige Stimme bleibt, wie sie ist${st.freigabe === 'web' ? ', auch auf der Website' : ''}, bis du entscheidest. Übernimmst du die neue, ist sie zuerst nicht freigegeben.</p>
      <div class="na-kn"><button class="kn kn--klein kn--gold" type="button" data-akt="neu-uebernehmen">Neue übernehmen<i>${SYM.haken}</i></button><button class="kn kn--klein kn--linie" type="button" data-akt="neu-verwerfen">Bisherige behalten<i>${ZU}</i></button></div></article>` : ''}
    ${w ? `<div class="re-post__kopf"><div><span class="mono">${w.herkunft === 'fragebogen' ? 'Aus dem Fragebogen' : 'Von dir eingetragen'} · ${esc(zeit(w.eingang))}</span><h2>Die <em>Stimme</em></h2></div></div>
      <article class="na-antwort platte">${w.satz ? `<p class="na-antwort__satz">«${esc(w.satz)}»</p>` : ''}${w.wie ? `<p class="na-antwort__wie">${esc(w.wie)}</p>` : ''}
        <dl class="re-angaben re-angaben--drei"><div><dt>Name</dt><dd>${esc([w.name, w.ort].filter(Boolean).join(', ') || 'nicht genannt')}</dd></div><div><dt>Zeigen</dt><dd>${esc(ZEIGEN[w.zeigen] || 'nicht veröffentlichen')}</dd></div><div><dt>Fotos</dt><dd>${w.fotos_ok ? 'Ja, Fotos dürfen gezeigt werden' : 'Keine Angabe'}</dd></div></dl>
        <div class="na-wahl"><span class="mono">Für die Website</span><div class="wahl2" role="group"><button type="button" data-st-frei="web" aria-pressed="${st.freigabe === 'web'}"${w.zeigen === 'nein' ? ' disabled' : ''}>Freigegeben</button><button type="button" data-st-frei="" aria-pressed="${st.freigabe !== 'web'}">Nicht zeigen</button></div></div>
        ${w.zeigen === 'nein' ? '<p class="na-warn">Der Gastgeber möchte nicht veröffentlicht werden. Die Stimme bleibt nur für dich.</p>' : ''}
        <div class="na-kn"><button class="kn kn--klein kn--linie" type="button" data-akt="stimme-aendern">Ändern<i>${SYM.stift}</i></button><button class="link" type="button" data-gehe="stimmen">Alle Stimmen</button></div></article>`
    : `<div class="re-post__kopf"><div><span class="mono">${st.angefragt ? 'Gefragt am ' + esc(datumKurz(st.angefragt)) : 'Noch nicht gefragt'}</span><h2>Den Gastgeber <em>fragen</em></h2></div></div>`}
    <div class="na-zwei">
      <aside class="re-notiz"><span class="mono">Fragebogen</span><b>${link ? 'Der Link für ' + esc(a.gastgeber.name) : 'Noch kein Link'}</b>
        ${link ? `<p class="na-link">${esc(link)}</p><div class="na-kn"><button class="link" type="button" data-akt="kopieren" data-text="${esc(link)}">Link kopieren</button><a class="link" href="${esc(link)}" target="_blank" rel="noopener">Fragebogen ansehen</a><button class="link" type="button" data-akt="link-neu">Neuer Link</button></div>`
          : `<p>Jeder Abend bekommt einen eigenen Link. Nur wer ihn hat, kann antworten.</p><button class="kn kn--klein kn--gold" type="button" data-akt="link-anlegen">Link anlegen<i>${SYM.plus}</i></button>`}</aside>
      <aside class="re-notiz"><span class="mono">Selbst eintragen</span><b>Per Nachricht bekommen?</b><p>Hat dir ${esc(a.gastgeber.name)} schon geschrieben, wie es war, trag die Worte hier ein. Sie landen bei den Stimmen wie eine Antwort aus dem Fragebogen.</p>
        <button class="kn kn--klein kn--linie" type="button" data-akt="stimme-eintragen">Stimme eintragen<i>${SYM.stift}</i></button></aside>
    </div>
    ${link ? `<div class="re-post__kopf na-abstand"><div><span class="mono">Deine Nachricht</span><h2>Die <em>Bitte</em></h2></div><div class="wahl2" role="group" aria-label="Fassung">${B.stimme.map(x => `<button type="button" data-st-bs="${x.id}" aria-pressed="${b.id === x.id}">${esc(x.titel)}</button>`).join('')}</div></div>
      <article class="brief brief--bearb na-nachricht"><div class="brief__text"><p>${esc(text).replace(/\n/g, '<br>')}</p></div></article>
      <div class="re-post__kn na-kn"><button class="kn kn--gold" type="button" data-akt="kopieren" data-text="${esc(text)}">Nachricht kopieren<i>${SYM.kopie}</i></button>${st.angefragt ? '' : `<button class="kn" type="button" data-akt="stimme-gefragt">Als gesendet vermerken<i>${SYM.haken}</i></button>`}</div>` : ''}
  </section>`;
}

/* ---------- Bildarchiv über alle Abende ---------- */
function alleFotos() { return vorbei().flatMap(a => sicht(a).fotos.map(f => ({ a, f }))); }
function archiv() {
  const l = alleFotos(), F = { alle: () => true, web: x => x.f.freigabe === 'web' && x.f.erlaubnis === true, warten: x => x.f.freigabe === 'web' && x.f.erlaubnis !== true, mappe: x => x.f.freigabe === 'mappe', privat: x => x.f.freigabe === 'privat' };
  const z = l.filter(F[S.archiv] || F.alle), bsp = l.some(x => x.a.beispiel || sicht(x.a).beispiel);
  return kopf('Bildarchiv', 'Alle Bilder, <em>mit Erlaubnis.</em>', 'Jedes Foto aus jedem Abend, mit dem, wofür es gedacht ist. Der Filter «Für die Website» zeigt nur, was der Gastgeber freigegeben hat: genau die Bilder, die du auf deiner Website und auf Instagram zeigen darfst.') +
    `<div class="na-archiv-leiste"><div class="wahl2 re-filter" role="group" aria-label="Filter">${[['alle', 'Alle'], ['web', 'Für die Website'], ['warten', 'Wartet auf Ja'], ['mappe', 'Nur Mappe'], ['privat', 'Privat']].map(([k, t]) => `<button type="button" data-archiv="${k}" aria-pressed="${S.archiv === k}">${t}<i>${l.filter(F[k]).length}</i></button>`).join('')}</div>
      ${bsp ? '<p class="na-bsp">Beispiel · die Fotos der erfundenen Abende sind Angelinas eigene und stehen hier stellvertretend.</p>' : ''}</div>
    ${z.length ? `<div class="na-archiv">${z.map(({ a, f }) => `<button class="na-foto na-foto--archiv" type="button" data-gross="${esc(a.id)}|${esc(f.id)}"><figure class="na-foto__b"><img src="${esc(fotoSrc(f))}"${f.quelle === 'eigen' ? ` data-eigen="${esc(f.datei)}"` : ''} alt="${esc(f.titel || '')}" width="640" height="800" loading="lazy" decoding="async"></figure>
      <span class="na-foto__t"><span class="mono">${esc(a.gastgeber.name)} · ${esc(datumKurz((a.anfrage || {}).datum))}</span><b>${esc(f.titel || 'Ohne Titel')}</b><small>${esc(fotoZeile(f).split(' · ').slice(1).join(' · '))}</small></span></button>`).join('')}</div>`
      : `<div class="re-leer platte">${ZEICHEN}<b>Nichts in dieser Auswahl.</b><p>${S.archiv === 'web' ? 'Sobald ein Gastgeber Ja sagt und du das bei einem Foto vermerkst, steht es hier.' : 'Wähle einen anderen Filter.'}</p></div>`}`;
}

/* ---------- Stimmen: die echten aus haus.json und die Antworten der Abende ---------- */
let HAUS = null;
function alleStimmen() {
  const echt = ((HAUS || {}).stimmen || []).map((s, i) => { const f = ((S.samEnt || {}).stimmen || {})['h' + i] || {};
    return { id: 'h' + i, echt: true, anlass: s.anlass, text: s.text, satz: '', name: '', ort: '', zeigen: 'ohne', datum: s.datum || '', herkunft: 'Nachricht an Angelina, im Instagram-Highlight «Feedback»', bild: STIMMBILD[i] || 'glas', freigabe: f.freigabe == null ? 'web' : f.freigabe, zeigbar: true, offen: false }; });
  const abende = vorbei().filter(a => sicht(a).stimme.antwort || sicht(a).stimme.angefragt).map(a => { const st = sicht(a).stimme, w = st.antwort, f = sicht(a).fotos.find(x => x.freigabe === 'web' && x.erlaubnis === true) || sicht(a).fotos[0];
    return w ? { id: a.id, abend: a, echt: !(a.beispiel || sicht(a).beispiel), anlass: (a.anfrage || {}).anlass, text: w.wie, satz: w.satz, name: w.name, ort: w.ort, zeigen: w.zeigen, datum: w.eingang, herkunft: (w.herkunft === 'fragebogen' ? 'Fragebogen' : 'Von dir eingetragen') + ' · ' + zeit(w.eingang), foto: f, freigabe: st.freigabe, zeigbar: true, offen: false }
      : { id: a.id, abend: a, anlass: (a.anfrage || {}).anlass, offen: true, zeigbar: false, foto: f, datum: st.angefragt, herkunft: 'Gefragt am ' + datumKurz(st.angefragt) }; });
  return abende.concat(echt).sort((x, y) => (y.offen ? 1 : 0) - (x.offen ? 1 : 0) || String(y.datum).localeCompare(String(x.datum)));
}
const unterschrift = s => s.zeigen === 'voll' ? [s.name, s.ort].filter(Boolean).join(', ') : s.zeigen === 'vorname' ? [DRUCK.vorname(s.name || ''), s.ort].filter(Boolean).join(', ') : '';   // Paare: «Klaus und Tanja», nie nur der erste Name
function stimmeZeile(s) {
  const bild = s.foto ? img(s.foto, 're-a__bild') : hausbild(s.bild, 're-a__bild');
  return `<button class="re-a" type="button" data-gehe="${s.abend ? 'stimme' : 'stimmen'}"${s.abend ? ` data-wahl="${esc(s.id)}"` : ''}>${bild}<span class="re-a__n"><span class="re-a__k re-gl-r">${glieder([esc(s.anlass || ''), s.echt ? 'Echt' : s.offen ? '' : 'Beispiel'])}</span><b class="na-zitat">${s.offen ? esc(s.abend.gastgeber.name) : '«' + esc(zusammen(s.satz || s.text)) + '»'}</b><small>${esc(s.offen ? s.herkunft + ', Antwort steht aus' : unterschrift(s) || s.herkunft.split(' · ')[0])}</small></span><span class="re-a__st">${s.offen ? 'Wartet' : s.freigabe === 'web' ? 'Website' : 'Privat'}</span></button>`;
}
function stimmenS() {
  const l = alleStimmen(), frei = l.filter(s => s.zeigbar && s.freigabe === 'web' && s.zeigen !== 'nein');
  const text = frei.map(s => `${s.anlass}\n«${s.satz || s.text}»${unterschrift(s) ? '\n' + unterschrift(s) : ''}`).join('\n\n');
  return kopf('Stimmen', 'Was Gastgeber <em>über ihren Abend sagen.</em>', 'Jede Stimme an einem Ort: die Nachrichten, die du nach deinen Einsätzen bekommen hast, und die Antworten aus dem Fragebogen. Gezeigt wird nur, was freigegeben ist, mit dem Namen so, wie der Gastgeber es erlaubt hat. Darunter steht der Text für die Stimmen-Seite deiner Website, zum Kopieren.') +
    `<div class="na-stimmen">${l.map(s => `<article class="na-stimme${s.offen ? ' na-stimme--offen' : ''}">${s.foto ? img(s.foto, 'na-stimme__b') : hausbild(s.bild, 'na-stimme__b')}
      <div class="na-stimme__t"><span class="mono re-gl-r">${glieder([esc(s.anlass || ''), s.echt ? 'Echt' : s.offen ? '' : 'Beispiel'])}</span>
      ${s.offen ? `<b class="na-stimme__z">${esc(s.abend.gastgeber.name)}: Antwort steht noch aus</b><small>${esc(s.herkunft)}</small><button class="link" type="button" data-gehe="stimme" data-wahl="${esc(s.id)}">Zum Fragebogen</button>`
        : `<p class="na-stimme__z">«${esc(zusammen(s.satz || s.text))}»</p>${s.satz && s.text ? `<p class="na-stimme__l">${esc(s.text)}</p>` : ''}<small>${esc([unterschrift(s), s.herkunft].filter(Boolean).join(' · '))}</small>${s.abend && sicht(s.abend).stimme.neu ? `<button class="link" type="button" data-gehe="stimme" data-wahl="${esc(s.id)}">Neue Antwort wartet auf deine Durchsicht</button>` : ''}
        <div class="na-wahl"><span class="mono">Website</span><div class="wahl2" role="group"><button type="button" data-frei="${esc(s.id)}" data-wert="web" aria-pressed="${s.freigabe === 'web'}"${s.zeigen === 'nein' ? ' disabled' : ''}>Zeigen</button><button type="button" data-frei="${esc(s.id)}" data-wert="" aria-pressed="${s.freigabe !== 'web'}">Nicht zeigen</button></div></div>`}
      </div></article>`).join('')}</div>
    <div class="re-post__kopf na-abstand"><div><span class="mono">${mal(frei.length, 'Eine Stimme', 'Stimmen')} freigegeben</span><h2>Für die <em>Stimmen-Seite</em></h2></div></div>
    <div class="na-zwei"><aside class="re-notiz"><span class="mono">Als Text</span><b>Anlass, Satz, Name</b><pre class="na-pre" id="st-text">${esc(text)}</pre><button class="link" type="button" data-akt="kopieren" data-text="${esc(text)}">Text kopieren</button></aside>
      <aside class="re-notiz"><span class="mono">Für die Website</span><b>Im Aufbau der Stimmen-Seite</b><p>Jede Stimme als Block, wie ihn die Seite «Stimmen» deiner Website schon verwendet. Die Website selbst wird von hier nicht geändert: der Block geht an den, der die Website pflegt.</p>
        <button class="link" type="button" data-akt="kopieren" data-text="${esc(htmlFuerWebsite(frei))}">Block kopieren</button> <a class="link" href="${WEBSITE}stimmen.html" target="_blank" rel="noopener">Stimmen-Seite ansehen</a></aside></div>`;
}
function htmlFuerWebsite(l) {
  return l.map((s, i) => { const k = s.foto ? (s.foto.quelle === 'haus' ? s.foto.datei : 'FOTO') : s.bild;
    return `<article class="sm sm--${i % 2}" data-gruppe><figure class="bi sm__b${i % 2 ? '' : ' sw'}"><img src="bilder/${k}.jpg" alt="${esc(s.anlass)}" width="1080" height="1350" loading="lazy" decoding="async" style="object-position:50% 40%"></figure><blockquote class="sm__q"><p class="kap"><span class="kw">${esc(s.anlass)}</span></p><p class="sm__z">«${esc(s.satz || s.text)}»${unterschrift(s) ? '<br><span class="kw">' + esc(unterschrift(s)) + '</span>' : ''}</p></blockquote></article>`; }).join('\n');
}

/* ---------- Empfehlungen ---------- */
function empfehlungenS() {
  const l = vorbei().flatMap(a => sicht(a).empfehlungen.map(e => ({ a, e }))).sort((x, y) => (x.e.anfrage ? 1 : 0) - (y.e.anfrage ? 1 : 0) || String(y.e.datum).localeCompare(String(x.e.datum)));
  const bsp = l.some(x => x.a.beispiel || sicht(x.a).beispiel);
  const gruppen = []; l.forEach(({ a, e }) => { const g = gruppen.find(x => x[0] === a); g ? g[1].push(e) : gruppen.push([a, [e]]); });   // ein Foto je Abend, nie in jeder Zeile dasselbe (Fehlerbuch 20.10.2026)
  return kopf('Empfehlungen', 'Wer am Abend <em>nach dir gefragt hat.</em>', 'Neue Gastgeber findest du über die Gäste deiner Abende. Wer nach dir gefragt hat, steht hier mit dem, was du dir gemerkt hast. Mit einem Griff wird daraus eine Anfrage in «' + esc(WO.name('anfragen')) + '», Herkunft «Empfehlung».', WO.knopf('Empfehlung notieren', 'plus', 'gold', { attr: 'data-akt="empf-neu"' })) +
    (bsp ? '<p class="na-bsp na-bsp--frei">Beispiel · Namen und Notizen der erfundenen Abende sind erfunden.</p>' : '') +
    (l.length ? `<div class="na-empf">${gruppen.map(([a, liste]) => `<section class="na-egr"><figure class="na-egr__b">${abendBild(a).replace('re-a__bild', 'na-egr__f')}<figcaption><span class="mono">Am Abend von</span><b>${esc(a.gastgeber.name)}</b><small>${esc(datumKurz((a.anfrage || {}).datum))}</small></figcaption></figure>
      <div class="na-egr__l">${liste.map(e => `<article class="na-e${e.anfrage ? ' angelegt' : ''}">
      <div class="na-e__t"><span class="mono">Notiert am ${esc(datumKurz(e.datum))}</span><h3>${esc(e.name)}</h3><p class="na-e__bz">${esc(e.beziehung || '')}</p><p>${esc(e.notiz || '')}</p>
        <p class="na-e__k">${e.kontakt ? esc(e.kontakt) : 'Noch keine E-Mail, darum nur als Notiz gemerkt'}</p></div>
      <div class="na-e__kn">${e.anfrage ? `<span class="na-stand">Anfrage angelegt</span><a class="link" href="${esc(H.wege.anfragen)}#${esc(e.anfrage)}" target="_blank" rel="noopener">In ${esc(WO.name('anfragen'))}</a>`
        : e.kontakt ? `<button class="kn kn--klein kn--gold" type="button" data-empf-anfrage="${esc(a.id)}|${esc(e.id)}">Als Anfrage anlegen<i>${PF}</i></button>` : ''}
        <button class="link" type="button" data-empf-aendern="${esc(a.id)}|${esc(e.id)}">${e.kontakt || e.anfrage ? 'Ändern' : 'E-Mail eintragen'}</button></div></article>`).join('')}</div></section>`).join('')}</div>`
      : `<div class="re-leer platte">${ZEICHEN}<b>Noch niemand notiert.</b><p>Fragt ein Gast am Abend nach dir, notier hier Namen und was er vorhat. Daraus wird mit einem Griff eine Anfrage.</p></div>`);
}

/* ---------- Wiedersehen ---------- */
function naechsterTag(a) {   // Vorschlag: der gleiche Tag im nächsten Jahr (Jahrestag)
  const d = tag((a.anfrage || {}).datum); if (!d) return '';
  const h = tag(heute()); let j = d.getFullYear() + 1; while (new Date(j, d.getMonth(), d.getDate()) < h) j++;
  const n = new Date(j, d.getMonth(), d.getDate()); return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0');
}
function wiedersehenS() {
  const l = vorbei().map(a => ({ a, w: sicht(a).wiedersehen })).sort((x, y) => String(x.w.datum || '9999').localeCompare(String(y.w.datum || '9999')));
  return kopf('Wiedersehen', 'Ein Jahr später, <em>ein ruhiger Gruss.</em>', 'Hochzeitstag, Geburtstag, Advent: zu jedem Abend der Tag im nächsten Jahr, an dem ein Gruss schön wäre. Rechtzeitig vorher erinnert dich das Werkzeug, mit einer Nachricht in deinen Worten.') +
    (l.some(x => x.a.beispiel) ? '<p class="na-bsp na-bsp--frei">Beispiel · erfundene Abende: ' + esc(l.filter(x => x.a.beispiel).map(x => x.a.gastgeber.name).join(', ')) + (l.some(x => !x.a.beispiel) ? '. Echt: ' + esc(l.filter(x => !x.a.beispiel).map(x => x.a.gastgeber.name).join(', ')) + ', die Nachricht ist ein Entwurf aus deinen Bausteinen.' : '.') + '</p>' : '') +
    `<div class="na-wieder">${l.map(({ a, w }) => { const t = tageBis(w.datum), bald = w.datum && !w.gesendet && tageBis(w.erinnern || w.datum) <= 0 && t >= 0;
      const b = bs('wieder', w.baustein) || B.wieder[0], text = w.text || fuell(form(b, a), a, { naechstes: (WIEDER_ART[w.art] || 'Jahrestag'), monat: w.datum ? DRUCK.datumLang(w.datum).split(/\s+/)[1] : '' });
      return `<article class="na-w${bald ? ' bald' : ''}${w.gesendet ? ' erledigt' : ''}" data-wid="${esc(a.id)}">${abendBild(a).replace('re-a__bild', 'na-w__b')}
        <div class="na-w__t"><span class="mono re-gl-r">${glieder([esc((a.anfrage || {}).anlass || ''), esc('Abend am ' + datumKurz((a.anfrage || {}).datum))])}</span><h3>${esc(a.gastgeber.name)}</h3>
          <p class="na-w__wann">${w.datum ? `<b>${esc(WIEDER_ART[w.art] || 'Jahrestag')}</b> ${esc(DRUCK.wochentag(w.datum) + ', ' + datumLang(w.datum))} · ${esc(abstand(t))}` : 'Noch kein Tag vermerkt'}</p>
          ${w.notiz ? `<p class="leise">${esc(w.notiz)}</p>` : ''}
          <div class="na-w__felder"><label class="feld"><span>Tag</span><input data-w="${esc(a.id)}" data-wfeld="datum" value="${esc(datumKurz(w.datum))}" placeholder="${esc(datumKurz(naechsterTag(a)))}" inputmode="numeric"></label>
            <div class="feld"><span>Erinnern, so lange vorher</span><div class="wahl2" role="group">${[[42, '6 Wochen'], [28, '4 Wochen'], [14, '2 Wochen']].map(([n, tx]) => `<button type="button" data-werin="${esc(a.id)}" data-tage="${n}" aria-pressed="${w.datum && w.erinnern && tageZwischen(w.erinnern, w.datum) === n}">${tx}</button>`).join('')}</div></div>
            <div class="feld"><span>Anlass</span><select class="sel" data-w="${esc(a.id)}" data-wfeld="art">${Object.entries(WIEDER_ART).map(([k, tx]) => `<option value="${k}"${w.art === k ? ' selected' : ''}>${tx}</option>`).join('')}</select></div></div>
        </div>
        <div class="na-w__n"><div class="na-w__kopf"><span class="mono">Nachricht</span><select class="sel" data-w="${esc(a.id)}" data-wfeld="baustein" aria-label="Baustein">${B.wieder.map(x => `<option value="${x.id}"${b.id === x.id ? ' selected' : ''}>${esc(x.titel)}</option>`).join('')}</select></div>
          <textarea data-w="${esc(a.id)}" data-wfeld="text" rows="7" aria-label="Nachricht zum Wiedersehen">${esc(text)}</textarea>
          <div class="na-kn"><button class="kn kn--klein kn--gold" type="button" data-akt="kopieren" data-quelle="${esc(a.id)}">Kopieren<i>${SYM.kopie}</i></button>
            ${w.gesendet ? `<span class="na-stand">Gesendet am ${esc(datumKurz(w.gesendet))}</span><button class="link" type="button" data-wsend="${esc(a.id)}" data-wert="">Doch nicht</button>` : `<button class="kn kn--klein" type="button" data-wsend="${esc(a.id)}" data-wert="ja">Als gesendet vermerken<i>${SYM.haken}</i></button>`}</div></div>
      </article>`; }).join('')}</div>`;
}
const tageZwischen = (a, b) => { const x = tag(a), y = tag(b); return x && y ? Math.round((y - x) / 864e5) : null; };
const ausDatum = t => { const m = /^\s*(\d{1,2})\.(\d{1,2})\.(\d{2,4})\s*$/.exec(t || ''); if (!m) return null; const j = m[3].length === 2 ? 2000 + +m[3] : +m[3], d = new Date(j, +m[2] - 1, +m[1]); return d.getMonth() === +m[2] - 1 ? j + '-' + String(+m[2]).padStart(2, '0') + '-' + String(+m[1]).padStart(2, '0') : null; };

/* ---------- Verbinden ---------- */
function verbinde() {
  $$('#ansicht [data-gehe]').forEach(b => b.onclick = () => gehe(b.dataset.gehe, b.dataset.wahl || ''));
  $$('#ansicht [data-filter]').forEach(b => b.onclick = () => { S.filter = b.dataset.filter; zeichneHalten(); });
  $$('#ansicht [data-archiv]').forEach(b => b.onclick = () => { S.archiv = b.dataset.archiv; zeichneHalten(); });
  $$('#ansicht [data-akt]').forEach(b => b.onclick = () => aktion(b.dataset.akt, b));
  const a = abend(S.wahl);
  if (a && JE_ABEND.includes(S.ansicht)) verbindeAbend(a);
  $$('#ansicht [data-gross]').forEach(b => b.onclick = () => { const [ai, fi] = b.dataset.gross.split('|'), x = abend(ai), f = sicht(x).fotos.find(y => y.id === fi); grossFenster(x, f); });
  $$('#ansicht [data-frei]').forEach(b => b.onclick = () => stimmeFrei(b.dataset.frei, b.dataset.wert));
  $$('#ansicht [data-empf-anfrage]').forEach(b => b.onclick = () => { const [ai, ei] = b.dataset.empfAnfrage.split('|'); anfrageFenster(abend(ai), ai, ei); });
  $$('#ansicht [data-empf-aendern]').forEach(b => b.onclick = () => { const [ai, ei] = b.dataset.empfAendern.split('|'); empfFenster(ai, ei); });
  $$('#ansicht [data-w]').forEach(x => { const ev = x.tagName === 'SELECT' ? 'change' : 'input'; x.addEventListener(ev, () => wiederFeld(x)); if (x.tagName === 'INPUT') x.addEventListener('change', () => wiederFeld(x, true)); });
  $$('#ansicht [data-werin]').forEach(b => b.onclick = () => aendere(b.dataset.werin, n => { const d = n.wiedersehen.datum || naechsterTag(abend(b.dataset.werin)); n.wiedersehen.datum = d; const t = tag(d); t.setDate(t.getDate() - +b.dataset.tage); n.wiedersehen.erinnern = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); }, true));
  $$('#ansicht [data-wsend]').forEach(b => b.onclick = () => aendere(b.dataset.wsend, n => { const ta = $(`textarea[data-w="${CSS.escape(b.dataset.wsend)}"]`); if (ta) n.wiedersehen.text = ta.value; n.wiedersehen.gesendet = b.dataset.wert ? heute() : ''; }, true));
  vorschauen();
}
function wiederFeld(x, fertig = false) {
  const id = x.dataset.w, k = x.dataset.wfeld;
  if (k === 'datum') { const d = ausDatum(x.value); x.classList.toggle('falsch', !!x.value && !d); if (!d && x.value) return; return aendere(id, n => { n.wiedersehen.datum = d || ''; }, fertig); }
  if (k === 'baustein') return aendere(id, n => { n.wiedersehen.baustein = x.value; n.wiedersehen.text = ''; }, true);
  if (k === 'art') return aendere(id, n => { n.wiedersehen.art = x.value; }, true);
  if (k === 'text') return aendere(id, n => { n.wiedersehen.text = x.value; });
}
function verbindeAbend(a) {
  const id = a.id;
  $$('#detail [data-bs]').forEach(c => c.onchange = () => aendere(id, n => { const l = B.dank.map(x => x.id).filter(k => k === c.dataset.bs ? c.checked : n.dank.bausteine.includes(k)); n.dank.bausteine = l; }));
  const t = $('#e-dank'); if (t) { const hoch = () => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 4 + 'px'; }; t.oninput = () => { hoch(); aendere(id, n => { n.dank.text = t.value; }); const w = $('#dank-emoji'); if (w) w.hidden = !/\p{Extended_Pictographic}/u.test(t.value + (($('#e-karte') || {}).value || '')); }; hoch(); }
  const k = $('#e-karte'); if (k) k.oninput = () => { aendere(id, n => { n.dank.karte.zeilen = k.value; }); vorschauen(); };
  const sg = $('#e-sig'); if (sg) sg.onchange = () => { sigDazu(sg.files[0]); sg.value = ''; };
  $$('#detail [data-karte-vorn]').forEach(b => b.onclick = () => aendere(id, n => { n.dank.karte.vorn = b.dataset.karteVorn; }, true));
  $$('#detail [data-karte-foto]').forEach(b => b.onclick = () => aendere(id, n => { n.dank.karte.foto = b.dataset.karteFoto; }, true));
  const mt = $('#e-mtitel'); if (mt) mt.oninput = () => { aendere(id, n => { n.mappe.titel = mt.value; }); vorschauen(); };
  const ms = $('#e-msatz'); if (ms) ms.oninput = () => { aendere(id, n => { n.mappe.satz_text = ms.value; }); vorschauen(); $$('#detail [data-msatz]').forEach(x => x.setAttribute('aria-pressed', !ms.value && x.dataset.msatz === sicht(a).mappe.satz)); };
  $$('#detail [data-msatz]').forEach(b => b.onclick = () => aendere(id, n => { n.mappe.satz = b.dataset.msatz; n.mappe.satz_text = ''; }, true));
  /* Fotos */
  $$('#detail .na-foto [data-feld]').forEach(x => {
    const fid = x.dataset.f, feld = x.dataset.feld;
    if (x.tagName === 'INPUT' && x.type === 'checkbox') x.onchange = () => aendere(id, n => { n.fotos.find(f => f.id === fid).mappe = x.checked; }, true);
    else if (x.tagName === 'INPUT') x.oninput = () => aendere(id, n => { n.fotos.find(f => f.id === fid).titel = x.value; });
    else x.onclick = () => aendere(id, n => { const f = n.fotos.find(y => y.id === fid), w = x.dataset.wert; f[feld] = w === 'true' ? true : w === 'false' ? false : w === 'null' ? null : w; if (feld === 'freigabe' && w === 'privat') f.mappe = false; if (feld === 'freigabe' && w === 'web' && f.erlaubnis === undefined) f.erlaubnis = null; }, true);
  });
  $$('#detail [data-schieb]').forEach(b => b.onclick = () => aendere(id, n => { const i = n.fotos.findIndex(f => f.id === b.dataset.f), j = i + +b.dataset.schieb; if (j < 0 || j >= n.fotos.length) return; const [f] = n.fotos.splice(i, 1); n.fotos.splice(j, 0, f); }, true));
  $$('#detail [data-weg]').forEach(b => b.onclick = () => { const f = sicht(a).fotos.find(x => x.id === b.dataset.weg);
    fenster(`<h2>Foto <em>entfernen?</em></h2><p>«${esc(f.titel || 'Ohne Titel')}» kommt aus diesem Abend heraus. ${f.quelle === 'eigen' ? 'Die Datei bleibt im Datenordner, bis du speicherst; danach gehört sie zu keinem Abend mehr.' : 'Das Foto selbst bleibt bei deinen eigenen Fotos.'} Erst mit «Speichern» gilt es, und mit «Rückgängig» kommt es zurück.</p>
      <div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gefahr" type="button" id="f-los">Entfernen<i>${SYM.korb}</i></button></div>`, true, () => { fensterZu(); aendere(id, n => { n.fotos = n.fotos.filter(x => x.id !== f.id); }, true); }); });
  const dat = $('#e-fotos'); if (dat) dat.onchange = () => fotosDazu(a, [...dat.files]);
  $$('#detail [data-st-frei]').forEach(b => b.onclick = () => aendere(id, n => { n.stimme.freigabe = b.dataset.stFrei; }, true));
  $$('#detail [data-st-bs]').forEach(b => b.onclick = () => aendere(id, n => { n.stimme.baustein = b.dataset.stBs; }, true));
}

/* ---------- Vorschau der Unterlagen (derselbe Satz wie Druck und PDF) ----------
   Seit Prüfung 6 (N10) ist die Vorschau die Druckseite selbst (druck.html?vorschau=1) in einem eingebetteten Fenster: dieselbe Schrift, derselbe Satz,
   nichts vom Kleid des Werkzeugs wirkt hinein. Das Werkzeug reicht den Stand mit Eingaben, die noch nicht gespeichert sind. */
function vorschauen() {
  const a = abend(S.wahl); if (!a) return;
  const x = Object.assign({}, a, { nachher: sicht(a) }), n = sicht(a);
  const sig = S.samEnt && S.samEnt.unterschrift ? '/angelina-strelow/werkzeuge/nachher/dateien/' + encodeURIComponent(S.samEnt.unterschrift) : '';
  $$('#ansicht [data-vorschau]').forEach(v => {
    const art = v.dataset.vorschau;
    const text = art === 'mappe' ? (n.mappe.satz_text || fuell(form(bs('mappe', n.mappe.satz), a), a)) : (ihr(a) ? (bs('karte', n.dank.karte.vorn) || B.karte[0]).vornIhr : (bs('karte', n.dank.karte.vorn) || B.karte[0]).vorn);
    let f = v.querySelector('iframe');
    if (!f) { f = document.createElement('iframe'); f.className = 'dr-fenster'; f.title = v.getAttribute('aria-label') || 'Vorschau'; f.setAttribute('tabindex', '-1'); f.src = 'druck.html?vorschau=1&v=11'; v.appendChild(f); }
    const los = () => f.contentWindow.VORSCHAU(art, x, DRUCK.offen(text) ? '' : text, sig);
    if (f.contentWindow && f.contentWindow.VORSCHAU_BEREIT) los(); else f.onload = () => { if (f.contentWindow.VORSCHAU_BEREIT) los(); };
  });
}

/* ---------- Handlungen ---------- */
async function aktion(akt, b) {
  const a = abend(S.wahl), id = a && a.id;
  try {
    if (akt === 'kopieren') { const q = b.dataset.quelle, text = q ? ($(`textarea[data-w="${CSS.escape(q)}"]`) || {}).value : b.dataset.text; return kopiere(text, 'Der Text liegt in der Zwischenablage. Gesendet wird von dir.'); }
    if (akt === 'dank-setzen') return aendere(id, n => { n.dank.text = n.dank.bausteine.map(k => fuell(form(bs('dank', k), a), a)).join('\n\n'); }, true);
    if (akt === 'dank-kopieren') return kopiere($('#e-dank').value, 'Der Dank liegt in der Zwischenablage. Danach «Als gesendet vermerken».');
    if (akt === 'dank-gesendet' || akt === 'dank-nicht') return aendere(id, n => { n.dank.gesendet = akt === 'dank-gesendet' ? heute() : ''; }, true);
    if (akt === 'karte-gedruckt') return aendere(id, n => { n.dank.karte.gedruckt = heute(); }, true);
    if (akt === 'sig-weg') { const s0 = Object.assign({}, S.samEnt); delete s0.unterschrift; S.samEnt = s0; leiste(); return zeichneHalten(); }
    if (akt === 'mappe-gesendet' || akt === 'mappe-nicht') return aendere(id, n => { n.mappe.gesendet = akt === 'mappe-gesendet' ? heute() : ''; }, true);
    if (akt === 'stimme-gefragt') return aendere(id, n => { n.stimme.angefragt = heute(); if (!n.stimme.baustein) n.stimme.baustein = B.stimme[0].id; }, true);
    if (akt === 'link-anlegen' || akt === 'link-neu') {
      const neu = () => aendere(id, n => { n.stimme.schluessel = [...crypto.getRandomValues(new Uint8Array(4))].map(x => x.toString(16).padStart(2, '0')).join(''); }, true);
      if (akt === 'link-anlegen') return neu();
      return fenster(`<h2>Neuer <em>Link?</em></h2><p>Der bisherige Link gilt danach nicht mehr. Das ist richtig, wenn er an die falsche Person ging.</p><div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gold" type="button" id="f-los">Neuer Link<i>${SYM.plus}</i></button></div>`, true, () => { fensterZu(); neu(); });
    }
    if (akt === 'stimme-eintragen' || akt === 'stimme-aendern') return stimmeFenster(a);
    if (akt === 'neu-uebernehmen') return aendere(id, n => { n.stimme.antwort = n.stimme.neu; delete n.stimme.neu; n.stimme.freigabe = ''; }, true);
    if (akt === 'neu-verwerfen') return aendere(id, n => { delete n.stimme.neu; }, true);
    if (akt === 'aus-bestand') return bestandFenster(a);
    if (akt === 'abschliessen' || akt === 'oeffnen') return abschluss(a, akt === 'abschliessen');
    if (akt === 'empf-neu') return empfFenster('', '');
    if (akt === 'pdf') return pdf(a, b.dataset.art);
    if (akt === 'drucken') return drucken(a, b.dataset.art);
  } catch (e) { fehler(e); }
}
async function kopiere(text, satz) {
  try { await navigator.clipboard.writeText(text || ''); quit('Kopiert', satz, [], false, 5000); }
  catch (e) { quit('Nicht kopiert', 'Der Browser hat die Zwischenablage nicht freigegeben. Markier den Text und kopier ihn von Hand.', [], true); }
}
function erstSpeichern(a) {
  if (!offeneIds().includes(a.id)) return false;
  quit('Erst speichern', 'Bei ' + a.gastgeber.name + ' warten noch Eingaben. Speichere sie zuerst, dann geht es weiter.', [['Jetzt speichern', speichern]], true, 8000);
  return true;
}
async function pdf(a, art) {
  if (erstSpeichern(a)) return;
  if (window.AS_DEMO) { drucken(a, art); return quit('Druckfenster', 'Dort «Als PDF sichern» wählen. Die Unterlage steht so wie im Werkzeug.', [], false, 8000); }
  quit('Die PDF entsteht', 'Einen Moment, die Seiten werden gesetzt.', [], false, 4000);
  const d = await api('api/pdf', { art, abend: a.id });
  const roh = atob(d.daten), u8 = new Uint8Array(roh.length); for (let i = 0; i < roh.length; i++) u8[i] = roh.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([u8], { type: 'application/pdf' })), l = document.createElement('a'); l.href = url; l.download = d.name; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
  quit('PDF gespeichert', d.name + ' liegt in deinen Downloads.', [], false, 6000);
}
function drucken(a, art) {
  if (erstSpeichern(a)) return;
  window.open('druck.html?art=' + encodeURIComponent(art) + '&abend=' + encodeURIComponent(a.id) + '&druck=1', '_blank', 'noopener');
}

/* ---------- Speichern, Rückgängig, Vorher/Nachher, frühere Fassungen ---------- */
let laeuft = false;
async function speichern() {
  if (laeuft) return;
  const ids = offeneIds(), sam = samOffen();
  if (!ids.length && !sam) return quit('Nichts geändert, nichts gespeichert.', '', [], false, 3000);
  laeuft = true;
  const stellen = [], rueck = [];
  try {
    for (const id of ids) {
      const vorher = S.basis[id], neu = kopie(S.ent[id]); neu.fassung = (neu.fassung || 0) + 1; neu.stand = new Date().toISOString().slice(0, 16);
      const ae = aenderungen(voll(vorher), S.ent[id]);
      const gesp = await schreibeAbend(id, neu, ae.map(x => x.t).join(', ').slice(0, 200)), mitte = S.basis[id];
      /* Rückgängig führt zum Stand vor dem Speichern, aber mit der Antwort, die beim Speichern dazukam (Prüfung 3, N7 A) */
      let zurueckZu = vorher, kam = false;
      if (!gleich(voll(mitte).stimme, voll(vorher).stimme)) { zurueckZu = voll(vorher); kam = fbMischen(zurueckZu, vorher, mitte); }
      S.basis[id] = kopie(gesp); delete S.ent[id]; const x = abend(id); if (x) x.nachher = kopie(gesp);
      rueck.push({ id, wert: zurueckZu, nach: kopie(gesp), kam }); ae.forEach(z => stellen.push(abend(id).gastgeber.name + ': ' + z.t));
    }
    if (sam) {
      const sigNeu = (S.samEnt || {}).unterschrift !== (S.sam || {}).unterschrift, stNeu = !gleich((S.samEnt || {}).stimmen || {}, (S.sam || {}).stimmen || {});
      const was = [stNeu ? 'Freigabe der Stimmen' : '', sigNeu ? 'Unterschrift' : ''].filter(Boolean).join(', ') || 'Sammlung';
      const d = await api('/angelina-strelow/werkzeuge/api/sammlung/nachher-sammlung', { daten: S.samEnt, etag: S.samEtag, wer: 'Angelina', was }, 'PUT');
      rueck.push({ sam: kopie(S.sam) }); S.sam = kopie(S.samEnt); S.samEtag = d.etag;
      if (stNeu) stellen.push('Stimmen: Freigabe'); if (sigNeu) stellen.push((S.sam.unterschrift ? 'Deine Unterschrift hinterlegt' : 'Unterschrift wieder in Schreibschrift'));
    }
    fertigBis = Date.now() + 2600; setTimeout(leiste, 2700);
    leiste(); zeichneHalten();
    if (S.angekommen.length) stellen.unshift('Dazu angekommen: Antwort von ' + S.angekommen.splice(0).join(', '));
    quit('Gespeichert', stellen.slice(0, 3).join(' · ') + (stellen.length > 3 ? ' und ' + (stellen.length - 3) + ' weitere' : ''), [['Vorher/Nachher ansehen', () => vorherNachher(rueck)], ['Rückgängig', () => zurueck(rueck)]], false, 9000);
  } catch (e) {
    if (e.status === 409) {
      quit('In einem anderen Fenster wurde gespeichert.', 'Die Abende sind neu geladen, deine gelben Eingaben sind noch da. Sieh kurz nach und speichere dann noch einmal.', [['Was tun?', () => window.open('pruefung.html#KONFLIKT', '_blank', 'noopener')]], true, 14000);
      await laden(); leiste(); zeichneHalten();
    } else fehler(e);
    if (rueck.length) leiste();
  } finally { laeuft = false; }
}
async function zurueck(rueck) {
  try {
    /* Wie im Vorbild: Rückgängig überschreibt nichts Fremdes. Hat seit diesem Speichern ein anderes Fenster denselben Abend gespeichert,
       bleibt alles, wie es ist, und das Werkzeug sagt es (KONFLIKT). Nur eine Antwort aus dem Fragebogen zählt nicht als fremd, sie bleibt (Prüfung 4, N9) */
    const t = await api('/angelina-strelow/werkzeuge/api/teil/nachher'), fremd = rueck.filter(r => r.id && !gleich(ohneFb((t.daten || {})[r.id] || null), ohneFb(r.nach)));
    if (fremd.length) {
      await laden(); leiste(); zeichneHalten();
      return quit('Rückgängig geht nicht mehr.', 'Nach deinem Speichern wurde ' + (fremd.length > 1 ? 'an diesen Abenden' : 'dieser Abend') + ' in einem anderen Fenster gespeichert (' + fremd.map(r => abend(r.id).gastgeber.name).join(', ') + '). Rückgängig würde das überschreiben, darum bleibt alles, wie es ist. Ein früherer Stand liegt unter «Frühere Fassungen».', [['Was tun?', () => window.open('pruefung.html#KONFLIKT', '_blank', 'noopener')]], true, 14000);
    }
    for (const r of rueck) {
      if (r.sam) { const d = await api('/angelina-strelow/werkzeuge/api/sammlung/nachher-sammlung', { daten: r.sam, etag: S.samEtag, wer: 'Angelina', was: 'Rückgängig' }, 'PUT'); S.sam = kopie(r.sam); S.samEnt = kopie(r.sam); S.samEtag = d.etag; continue; }
      /* eine Antwort, die beim oder nach dem Speichern kam, bleibt (Prüfung 3, N7 A); kommt sie während des Rückgängig, legt schreibeAbend sie dazu */
      let w = r.wert, kam = r.kam;
      if (!gleich(voll(S.basis[r.id]).stimme, voll(r.nach).stimme)) { w = voll(r.wert); kam = fbMischen(w, r.nach, S.basis[r.id]) || kam; }
      if (kam && !S.angekommen.includes(abend(r.id).gastgeber.name)) S.angekommen.push(abend(r.id).gastgeber.name);
      const gesp = await schreibeAbend(r.id, w, 'Rückgängig');
      S.basis[r.id] = kopie(gesp); delete S.ent[r.id]; const x = abend(r.id); if (x) x.nachher = kopie(gesp);
    }
    leiste(); zeichneHalten(); quit('Rückgängig gemacht', 'Der Stand vor dem Speichern ist wieder da.' + (S.angekommen.length ? ' Die Antwort von ' + S.angekommen.splice(0).join(', ') + ', die inzwischen kam, bleibt.' : ''), [], false, 4000);
  } catch (e) { if (e.status === 409) { await laden(); leiste(); zeichneHalten(); } fehler(e); }
}
function vorherNachher(rueck) {
  const zeilen = [];
  if (Array.isArray(rueck)) rueck.forEach(r => { if (r.id) aenderungen(voll(r.wert), voll(S.basis[r.id])).forEach(z => zeilen.push([abend(r.id).gastgeber.name, z])); });
  else offeneIds().forEach(id => aenderungen(voll(S.basis[id]), S.ent[id]).forEach(z => zeilen.push([abend(id).gastgeber.name, z])));
  const zeig = v => esc(typeof v === 'string' ? v : v == null ? '' : Array.isArray(v) ? (v.length ? v.map(x => x && x.name ? x.name : typeof x === 'string' ? x : JSON.stringify(x)).join(', ') : 'leer') : Object.entries(v).filter(([, w]) => w !== '' && w != null).map(([k, w]) => k + ': ' + (typeof w === 'object' ? JSON.stringify(w) : w)).join(' · ')).slice(0, 600);
  fenster(`<h2>Vorher, <em>nachher.</em></h2><p>${Array.isArray(rueck) ? 'Was eben gespeichert wurde.' : 'Was noch nicht gespeichert ist.'}</p>
    <div class="na-vn">${zeilen.map(([g, z]) => `<div class="na-vn__z"><span class="mono">${esc(g)} · ${esc(z.t)}</span><p class="na-vn__alt">${zeig(z.alt) || '<i>leer</i>'}</p><p class="na-vn__neu">${zeig(z.neu) || '<i>leer</i>'}</p></div>`).join('') || '<p class="leise">Keine Änderung.</p>'}</div>
    <div class="fenster__kn">${Array.isArray(rueck) ? '' : `<button class="link" type="button" id="f-verwerfen">Eingaben verwerfen</button>`}<button class="kn kn--gold" type="button" data-zu>Schliessen<i>${SYM.haken}</i></button></div>`);
  const v = $('#f-verwerfen'); if (v) v.onclick = () => { const alt = kopie(S.ent), altSam = kopie(S.samEnt); S.ent = {}; S.samEnt = kopie(S.sam); fensterZu(); leiste(); zeichneHalten(); quit('Verworfen', 'Die Eingaben sind weg.', [['Rückgängig', () => { S.ent = alt; S.samEnt = altSam; leiste(); zeichneHalten(); }]], false, 9000); };
}
async function verlaufFenster() {
  try {
    const [d, pr] = await Promise.all([api('/angelina-strelow/werkzeuge/api/verlauf/nachher'), api('/angelina-strelow/werkzeuge/api/protokoll').catch(() => ({ eintraege: [] }))]), l = d.fassungen || [];
    const stempel = f => { const m = /-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})\.json$/.exec(f); return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}` : ''; };
    const wann = f => { const m = /-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})\.json$/.exec(f); return m ? `${m[3]}.${m[2]}.${m[1]}, ${m[4]}:${m[5]}:${m[6]} Uhr` : f; };
    /* Notiz je Fassung (R14): das Speichern, das diese Fassung abgelöst hat, steht im Protokoll mit derselben Sekunde (serve.py schreib) */
    const notiz = f => { const t = stempel(f), e = (pr.eintraege || []).find(x => x.bereich === 'nachher' && x.zeit === t); return e ? (e.wer ? e.wer + ': ' : '') + (e.was || 'gespeichert') : ''; };
    fenster(`<h2>Frühere <em>Fassungen.</em></h2><p>Jedes Speichern legt die Fassung davor hier ab (die letzten 80). Zurückholen ersetzt den gespeicherten Stand aller Abende in diesem Werkzeug; Eingaben, die noch gelb sind, bleiben, ebenso Antworten aus dem Fragebogen, die danach kamen.</p>
      <ol class="na-verlauf">${l.map((f, i) => `<li><span><b>${esc(wann(f))}</b><small>${i === l.length - 1 ? 'Ursprünglicher Stand · ' : ''}${notiz(f) ? 'Danach: ' + esc(notiz(f)) : 'Stand vor dem Speichern'}</small><small class="na-verlauf__nr">Fassung ${l.length - i}</small></span><button class="kn kn--klein kn--linie" type="button" data-hole="${esc(f)}">Zurückholen<i>${WO.ic('verlauf')}</i></button></li>`).join('')
        || '<li class="leise">Noch keine frühere Fassung. Sobald du speicherst, steht hier der Stand davor, zuunterst immer der ursprüngliche.</li>'}</ol>
      <div class="fenster__kn"><button class="kn kn--gold" type="button" data-zu>Schliessen<i>${SYM.haken}</i></button></div>`);
    $$('#fenster [data-hole]').forEach(b => b.onclick = async () => {
      try {
        const vor = (await api('/angelina-strelow/werkzeuge/api/teil/nachher')).daten || {};
        await api('/angelina-strelow/werkzeuge/api/verlauf/nachher/' + encodeURIComponent(b.dataset.hole), { wer: 'Angelina' }); fensterZu(); await laden();
        const blieb = await antwortenBehalten(vor);
        leiste(); zeichneHalten(); quit('Zurückgeholt', 'Der Stand vom ' + wann(b.dataset.hole) + ' ist wieder da.' + (blieb.length ? ' Die Antwort von ' + blieb.join(', ') + ' aus dem Fragebogen bleibt.' : ''), [], false, 8000);
      } catch (e) { if (e.status === 409) { await laden(); leiste(); zeichneHalten(); } fehler(e); }
    });
  } catch (e) { fehler(e); }
}

/* ---------- Abschluss (Kern: Status) ---------- */
async function abschluss(a, zu) {
  if (erstSpeichern(a)) return;
  const o = offenKurz(a);
  fenster(zu ? `<h2>Abend <em>abschliessen?</em></h2><p>${o.length ? 'Noch offen: ' + esc(o.join(', ')) + '. Abschliessen geht trotzdem, wenn das bewusst so bleibt.' : 'Dank, Fotos, Mappe und Stimme sind erledigt.'} Der Abend von ${esc(a.gastgeber.name)} gilt danach in allen vier Werkzeugen als abgeschlossen.</p>
    <div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gold" type="button" id="f-los">Abschliessen<i>${SYM.haken}</i></button></div>`
    : `<h2>Wieder <em>öffnen?</em></h2><p>Der Abend steht danach wieder als «vorbei» in allen vier Werkzeugen.</p><div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gold" type="button" id="f-los">Wieder öffnen<i>${ZU}</i></button></div>`, true, async () => {
    fensterZu();
    try {
      const k = await api('/angelina-strelow/werkzeuge/api/teil/kern'), alt = k.daten[a.id]; if (!alt) throw new Error('ABEND · Diesen Abend gibt es nicht mehr.');
      const neuK = Object.assign({}, alt, { status: zu ? 'abgeschlossen' : 'vorbei' });
      await api('/angelina-strelow/werkzeuge/api/teil/kern/' + encodeURIComponent(a.id), { wert: neuK, etag: k.etag, wer: 'Angelina', was: zu ? 'abgeschlossen' : 'wieder geöffnet' }, 'PUT');
      const n = voll(S.basis[a.id]), vorherAbschluss = kopie(n.abgeschlossen); n.abgeschlossen = zu ? { am: heute(), von: 'Angelina' } : { am: '', von: '' }; n.fassung = (n.fassung || 0) + 1;
      const gesp = await schreibeAbend(a.id, n, zu ? 'Abschluss' : 'wieder offen'); S.angekommen.length = 0;
      S.basis[a.id] = kopie(gesp); a.nachher = kopie(gesp); a.status = neuK.status;
      leiste(); zeichneHalten();
      quit(zu ? 'Abgeschlossen' : 'Wieder offen', a.gastgeber.name + (zu ? (o.length ? ': abgeschlossen, bewusst offen bleibt ' + o.join(', ') + '.' : ': alles, was nach dem Abend kommt, ist erledigt.') : ' steht wieder bei den offenen Abenden.'), [['Rückgängig', () => abschlussZurueck(a, alt.status, vorherAbschluss)]], false, 9000);
    } catch (e) { if (e.status === 409) { await laden(); leiste(); zeichneHalten(); } fehler(e); }
  });
}
async function abschlussZurueck(a, status, vermerk) {
  try {
    const k = await api('/angelina-strelow/werkzeuge/api/teil/kern'); await api('/angelina-strelow/werkzeuge/api/teil/kern/' + encodeURIComponent(a.id), { wert: Object.assign({}, k.daten[a.id], { status }), etag: k.etag, wer: 'Angelina', was: 'Rückgängig' }, 'PUT');
    const n = voll(S.basis[a.id]); n.abgeschlossen = vermerk || { am: '', von: '' }; n.fassung = (n.fassung || 0) + 1;   // auch der Vermerk im Teil geht zurück
    const gesp = await schreibeAbend(a.id, n, 'Abschluss rückgängig'); S.angekommen.length = 0;
    await laden(); S.basis[a.id] = kopie(gesp); leiste(); zeichneHalten(); quit('Rückgängig gemacht', '', [], false, 3000);
  } catch (e) { if (e.status === 409) { await laden(); leiste(); zeichneHalten(); } fehler(e); }
}

/* ---------- Stimmen: Freigabe der echten (Sammlung) und der Abende ---------- */
function stimmeFrei(sid, wert) {
  if (/^h\d+$/.test(sid)) { S.samEnt = S.samEnt || {}; S.samEnt.stimmen = Object.assign({}, S.samEnt.stimmen); S.samEnt.stimmen[sid] = { freigabe: wert }; if (gleich(S.samEnt.stimmen[sid], { freigabe: 'web' }) && !(S.sam.stimmen || {})[sid]) delete S.samEnt.stimmen[sid]; if (!Object.keys(S.samEnt.stimmen).length && !S.sam.stimmen) delete S.samEnt.stimmen; leiste(); return zeichneHalten(); }
  aendere(sid, n => { n.stimme.freigabe = wert; }, true);
}
function stimmeFenster(a) {
  const w = sicht(a).stimme.antwort || { name: '', ort: (a.anfrage || {}).ort || '', wie: '', satz: '', zeigen: 'vorname', fotos_ok: false };
  fenster(`<h2>Stimme <em>eintragen.</em></h2><p>So, wie ${esc(a.gastgeber.name)} es dir geschrieben hat. Nur wörtlich, nichts dazu.</p>
    <label class="feld"><span>Wie war der Abend?</span><textarea id="f-wie" rows="4">${esc(w.wie)}</textarea></label>
    <label class="feld"><span>Ein Satz für die Website</span><input id="f-satz" value="${esc(w.satz)}"></label>
    <div class="na-fe2"><label class="feld"><span>Name</span><input id="f-name" value="${esc(w.name)}"></label><label class="feld"><span>Ort</span><input id="f-ort" value="${esc(w.ort)}"></label></div>
    <div class="feld"><span>Zeigen</span><div class="wahl2" role="group" id="f-zeigen">${Object.entries(ZEIGEN).map(([k, t]) => `<button type="button" data-z="${k}" aria-pressed="${w.zeigen === k}">${t}</button>`).join('')}</div></div>
    <label class="na-hak"><input type="checkbox" id="f-fotos"${w.fotos_ok ? ' checked' : ''}><span>Fotos des Abends dürfen gezeigt werden</span></label>
    <div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gold" type="button" id="f-los">Übernehmen<i>${SYM.haken}</i></button></div>`, true, () => {
    const z = ($('#f-zeigen [aria-pressed="true"]') || {}).dataset || {};
    const neu = { eingang: (w.eingang || new Date().toISOString().slice(0, 16)), herkunft: w.herkunft || 'eingetragen', wie: $('#f-wie').value.trim(), satz: $('#f-satz').value.trim(), name: $('#f-name').value.trim(), ort: $('#f-ort').value.trim(), zeigen: z.z || 'nein', fotos_ok: $('#f-fotos').checked };
    if (!neu.wie && !neu.satz) return quit('Noch leer', 'Trag ein paar Worte ein, wie es war.', [], true, 5000);
    fensterZu(); aendere(a.id, n => { n.stimme.antwort = neu; }, true);
  });
  $$('#f-zeigen [data-z]').forEach(b => b.onclick = () => $$('#f-zeigen [data-z]').forEach(x => x.setAttribute('aria-pressed', x === b)));
}

/* ---------- Fotos hinzufügen: vom Rechner (verkleinert, in den Datenordner) oder aus Angelinas eigenen ---------- */
const FOTO_MIN = 900;   // Master 5.1: Fotos für Website und Druck mindestens 900 px an der langen Seite
function verkleinere(datei) {   // Foto → JPEG, längste Seite 1600 px (wie im Gästebuch, dort 2000 px; die Grenze des gemeinsamen Servers ist 4 MB je Anfrage)
  return new Promise((ok, nein) => { const u = URL.createObjectURL(datei), im = new Image();
    im.onload = () => { if (Math.max(im.width, im.height) < FOTO_MIN) { URL.revokeObjectURL(u); return nein(new Error('FOTO · ' + datei.name + ' ist nur ' + Math.max(im.width, im.height) + ' Pixel gross. Für Mappe und Website braucht es mindestens ' + FOTO_MIN + ' Pixel an der langen Seite.')); }
      const m = Math.min(1, 1600 / Math.max(im.width, im.height)), c = document.createElement('canvas');
      c.width = Math.round(im.width * m); c.height = Math.round(im.height * m); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
      ok(c.toDataURL('image/jpeg', 0.86)); };
    im.onerror = () => { URL.revokeObjectURL(u); nein(new Error('FOTO · ' + datei.name + ' lässt sich nicht als Foto öffnen.')); }; im.src = u; });
}
async function fotosDazu(a, dateien) {
  if (!dateien.length) return;
  if (dateien.some(d => d.size > 40 * 1024 * 1024)) return quit('Zu gross', 'Ein Foto ist grösser als 40 MB. Bitte eine kleinere Fassung wählen.', [], true);
  let n = 0, gesagt = false;
  for (const d of dateien) {
    try {
      const daten = await verkleinere(d);   // erst prüfen (Grösse), dann ankündigen (Prüfung 2, N6)
      if (!gesagt) { gesagt = true; quit('Fotos kommen dazu', mal(dateien.length, 'Ein Foto wird', 'Fotos werden') + ' verkleinert und in den Datenordner gelegt.', [], false, 3000); }
      const r = await api('api/foto', { abend: a.id, name: d.name, daten });
      aendere(a.id, x => { x.fotos.push({ id: 'f-' + r.datei.replace(/\.\w+$/, ''), quelle: 'eigen', datei: r.datei, titel: r.titel || 'Neues Foto', freigabe: 'mappe', erlaubnis: null, gaeste: false, mappe: true, notiz: 'Hinzugefügt am ' + datumKurz(heute()) }); });
      n++;
    } catch (e) { fehler(e); }
  }
  zeichneHalten();
  if (n) quit(mal(n, 'Ein Foto ist dazugekommen', n + ' Fotos sind dazugekommen'), 'Noch gelb: «Speichern» legt ' + (n === 1 ? 'es' : 'sie') + ' beim Abend ab.', [], false, 6000);
}
/* «Aus deinen Fotos»: Angelinas eigene Aufnahmen ohne Gäste und ohne fremdes Zuhause. Die Fotos vom Abend bei Klaus und Tanja (ihr Zuhause, ihre Tafel)
   stehen nur bei ihrem eigenen Abend zur Wahl (Prüfung 05.11.2026, Punkt 19). */
const BESTAND = [['handschuh', 'Die Flasche im weissen Handschuh'], ['studio', 'Angelina im Smoking, Fensterlicht'], ['studio-fenster', 'Angelina am Fenster'], ['dunkel', 'Angelina im dunklen Sessel'],
  ['kirche', 'Sekt vor buntem Glas'], ['p69', 'Angelina im hellen Raum'], ['p89', 'Schwarzweiss im Sessel']];
const BESTAND_KT = [['festtafel', 'Die festlich gedeckte Tafel'], ['tafel', 'Die Tafel vor dem Empfang'], ['empfang', 'Der Sekt zum Empfang'], ['einschenken', 'Nachschenken mit weissem Handschuh'], ['teller', 'Der Gang kommt an den Tisch'],
  ['kerzen', 'Kerzenlicht auf der Tafel'], ['kerze', 'Angelina zündet die Kerzen an'], ['glas', 'Das Glas für den Wein'], ['flasche', 'Der Wein des Abends'], ['gang', 'Unterwegs zwischen Küche und Tisch']];
function bestandFenster(a) {
  const da = new Set(sicht(a).fotos.filter(f => f.quelle === 'haus').map(f => f.datei)), gewaehlt = new Set(), liste = (a.id === 'a-251214-kt' ? BESTAND_KT : []).concat(BESTAND);
  fenster(`<h2>Aus deinen <em>Fotos.</em></h2><p>${a.id === 'a-251214-kt' ? 'Die Fotos von diesem Abend und deine eigenen Aufnahmen.' : 'Deine eigenen Aufnahmen, ohne Gäste und ohne fremdes Zuhause. Fotos vom Abend anderer Gastgeber stehen hier nie.'} Wähle, was zu diesem Abend gehört.</p>
    <div class="na-bestand">${liste.map(([k, t]) => `<button type="button" class="na-bestand__k" data-k="${k}" aria-pressed="false"${da.has(k) ? ' disabled' : ''}><span class="na-bestand__b"><img src="/angelina-strelow/werkzeuge/assets/bild/${k}-640.webp" alt="" width="640" height="800" loading="lazy" decoding="async"></span><small>${esc(t)}${da.has(k) ? ' · schon dabei' : ''}</small></button>`).join('')}</div>
    <div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gold" type="button" id="f-los">Übernehmen<i>${SYM.haken}</i></button></div>`, false, () => {
    fensterZu(); if (!gewaehlt.size) return;
    aendere(a.id, n => { gewaehlt.forEach(k => n.fotos.push({ id: 'f-' + k + '-' + Math.random().toString(16).slice(2, 6), quelle: 'haus', datei: k, titel: (liste.find(x => x[0] === k) || [])[1] || k, freigabe: 'mappe', erlaubnis: null, gaeste: false, mappe: true, notiz: '' })); }, true);
  });
  $$('#fenster .na-bestand__k').forEach(b => b.onclick = () => { const an = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', an); an ? gewaehlt.add(b.dataset.k) : gewaehlt.delete(b.dataset.k); });
}
function grossFenster(a, f) {
  fenster(`<figure class="na-gross"><img src="${esc(fotoSrc(f, true))}"${f.quelle === 'eigen' ? ` data-eigen="${esc(f.datei)}"` : ''} alt="${esc(f.titel || '')}"></figure>
    <h2>${esc(f.titel || 'Ohne Titel')}</h2><p>${esc(a.gastgeber.name)}, ${esc(datumLang((a.anfrage || {}).datum))} · ${esc(fotoZeile(f).split(' · ').slice(1).join(' · '))}${f.notiz ? '<br>' + esc(f.notiz) : ''}</p>
    <div class="fenster__kn"><button class="link" type="button" data-zu>Schliessen</button><button class="kn kn--gold" type="button" id="f-los">Zum Abend<i>${PF}</i></button></div>`, false, () => { fensterZu(); gehe('fotos', a.id); });
}

/* ---------- Empfehlungen: notieren, ändern, als Anfrage anlegen (POST /api/abende, Herkunft «empfehlung») ---------- */
function empfFenster(ai, ei) {
  const l = vorbei(), a0 = abend(ai) || l[0], e = ai ? sicht(abend(ai)).empfehlungen.find(x => x.id === ei) : { name: '', beziehung: '', notiz: '', kontakt: '', datum: (a0.anfrage || {}).datum || heute() };
  fenster(`<h2>${ai ? 'Empfehlung <em>ändern.</em>' : 'Empfehlung <em>notieren.</em>'}</h2><p>Wer am Abend nach dir gefragt hat, und was du dir gemerkt hast.</p>
    ${ai ? '' : `<label class="feld"><span>Am Abend von</span><select class="sel" id="f-abend">${l.map(a => `<option value="${esc(a.id)}">${esc(a.gastgeber.name + ', ' + datumKurz((a.anfrage || {}).datum))}</option>`).join('')}</select></label>`}
    <div class="na-fe2"><label class="feld"><span>Name</span><input id="f-name" value="${esc(e.name)}"></label><label class="feld"><span>Beziehung zum Gastgeber</span><input id="f-bez" value="${esc(e.beziehung)}" placeholder="Etwa: Schwester von Helene"></label></div>
    <label class="feld"><span>Was du dir gemerkt hast</span><textarea id="f-notiz" rows="3">${esc(e.notiz)}</textarea></label>
    <label class="feld"><span>E-Mail (für die Anfrage)</span><input id="f-kontakt" value="${esc(e.kontakt)}" inputmode="email"></label>
    <div class="fenster__kn">${ai ? `<button class="link na-weg" type="button" id="f-weg">Entfernen</button>` : ''}<button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gold" type="button" id="f-los">Übernehmen<i>${SYM.haken}</i></button></div>`, true, () => {
    const name = $('#f-name').value.trim(), kontakt = $('#f-kontakt').value.trim();
    if (!name) return quit('Name fehlt', 'Wie heisst der Gast, der nach dir gefragt hat?', [], true, 5000);
    if (kontakt && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(kontakt)) return quit('E-Mail prüfen', 'Die E-Mail sieht nicht vollständig aus.', [], true, 5000);
    const ziel = ai || $('#f-abend').value;
    fensterZu();
    aendere(ziel, n => { const neu = { name, beziehung: $('#f-bez') ? '' : '', notiz: '', kontakt };
      if (ai) { const x = n.empfehlungen.find(y => y.id === ei); Object.assign(x, { name, beziehung: S._bez, notiz: S._notiz, kontakt }); }
      else n.empfehlungen.push(Object.assign(neu, { id: 'e-' + Math.random().toString(16).slice(2, 8), beziehung: S._bez, notiz: S._notiz, datum: heute(), anfrage: '' })); }, true);
  });
  const merk = () => { S._bez = $('#f-bez').value.trim(); S._notiz = $('#f-notiz').value.trim(); };
  ['#f-bez', '#f-notiz'].forEach(s => { const x = $(s); if (x) x.addEventListener('input', merk); }); merk();
  const w = $('#f-weg'); if (w) w.onclick = () => { fensterZu(); aendere(ai, n => { n.empfehlungen = n.empfehlungen.filter(x => x.id !== ei); }, true); quit('Entfernt', 'Gilt mit «Speichern».', [], false, 4000); };
}
function anfrageFenster(a, ai, ei) {
  const e = sicht(a).empfehlungen.find(x => x.id === ei);
  if (!e.kontakt) return quit('E-Mail fehlt', 'Für eine Anfrage braucht es eine E-Mail. Trag sie bei der Empfehlung ein.', [['Ändern', () => empfFenster(ai, ei)]], true, 8000);
  const wunsch = (e.notiz ? e.notiz + ' ' : '') + 'Empfohlen am Abend von ' + a.gastgeber.name + ' (' + datumKurz((a.anfrage || {}).datum) + ')' + (e.beziehung ? ', ' + e.beziehung : '') + '.';
  fenster(`<h2>Als Anfrage <em>anlegen.</em></h2><p>Die Anfrage liegt danach in «${esc(WO.name('anfragen'))}», Herkunft «Empfehlung». Verschickt wird nichts.</p>
    <div class="na-fe2"><label class="feld"><span>Name</span><input id="f-name" value="${esc(e.name)}"></label><label class="feld"><span>E-Mail</span><input id="f-mail" value="${esc(e.kontakt)}"></label></div>
    <div class="na-fe2"><label class="feld"><span>Anlass</span><select class="sel" id="f-anlass">${['Privates Dinner', 'Geburtstag', 'Jubiläum', 'Feier zu Hause'].map(x => `<option>${x}</option>`).join('')}</select></label><label class="feld"><span>Ort</span><input id="f-ort" value=""></label></div>
    <label class="feld"><span>Was sie vorhaben</span><textarea id="f-wunsch" rows="3">${esc(wunsch)}</textarea></label>
    <div class="fenster__kn"><button class="link" type="button" data-zu>Abbrechen</button><button class="kn kn--gold" type="button" id="f-los">Anfrage anlegen<i>${PF}</i></button></div>`, true, async () => {
    const los = $('#f-los'); if (!los || los.disabled) return; los.disabled = true; los.querySelector('span') ? los.querySelector('span').textContent = 'Wird angelegt …' : 0;   // ein Klick, eine Anfrage (Prüfung Punkt 2)
    try {
      const d = await api('/angelina-strelow/werkzeuge/api/abende', { name: $('#f-name').value.trim(), email: $('#f-mail').value.trim(), anlass: $('#f-anlass').value, ort: $('#f-ort').value.trim(), wunsch: $('#f-wunsch').value.trim(), quelle: 'empfehlung', datum: '', gaeste: '' });
      fensterZu();
      /* Nur die Verknüpfung auf den gespeicherten Stand legen; andere gelbe Eingaben dieses Abends bleiben gelb (nichts speichert still mit) */
      const basis = voll(S.basis[a.id]), x = basis.empfehlungen.find(y => y.id === ei);
      if (x) { x.anfrage = d.id; basis.fassung = (basis.fassung || 0) + 1; const gesp = await schreibeAbend(a.id, basis, 'Empfehlung als Anfrage ' + d.id); S.angekommen.length = 0; S.basis[a.id] = kopie(gesp); a.nachher = kopie(gesp); }
      if (S.ent[a.id]) { const y = S.ent[a.id].empfehlungen.find(z => z.id === ei); if (y) y.anfrage = d.id; }
      await laden(); leiste(); zeichneHalten();
      quit('Anfrage angelegt', e.name + ' steht jetzt in «' + WO.name('anfragen') + '», Herkunft Empfehlung.', [['Ansehen', () => window.open(H.wege.anfragen + '#' + d.id, '_blank', 'noopener')]], false, 9000);
    } catch (x) { los.disabled = false; fehler(x); }
  });
}

/* ---------- Fenster (wie im Gästebuch) ---------- */
function fenster(html, schmal = false, los = null) {
  const f = $('#fenster');
  f.innerHTML = `<div class="fenster__k${schmal ? ' schmal' : ''}" role="dialog" aria-modal="true"><button class="rund fenster__zu" type="button" data-zu aria-label="Schliessen">${ZU}</button>${html}</div>`;
  f.hidden = false;
  $$('[data-zu]', f).forEach(b => b.onclick = fensterZu);
  f.onclick = e => { if (e.target === f) fensterZu(); };
  if (los && $('#f-los')) $('#f-los').onclick = los;
}
function fensterZu() { $('#fenster').hidden = true; $('#fenster').innerHTML = ''; }
/* Quittung bei offenem Fenster (Prüfung 3, N8): sie steht oben (nachher.css). Reicht dort der Platz über dem Fenster nicht, rückt das Fenster
   unter die Quittung, so liegt sie bei keiner Breite über einem Knopf. Der Platz bleibt, bis das Fenster zugeht: nichts springt, wenn sie verschwindet. */
function meldungPlatz() {
  const f = $('#fenster'), m = $('#meldung'), k = f.querySelector('.fenster__k');
  if (f.hidden || !k) { f.classList.remove('unter-meldung'); f.style.removeProperty('--mh'); return; }
  if (!m.children.length) return;
  const unten = Math.ceil(m.getBoundingClientRect().bottom) + 12, r = k.getBoundingClientRect(), q = m.getBoundingClientRect();
  if (q.right <= r.left || q.left >= r.right || unten <= r.top) return;
  f.style.setProperty('--mh', Math.max(unten, parseFloat(f.style.getPropertyValue('--mh')) || 0) + 'px'); f.classList.add('unter-meldung');
}
new MutationObserver(meldungPlatz).observe($('#meldung'), { childList: true });
new MutationObserver(meldungPlatz).observe($('#fenster'), { childList: true, attributes: true, attributeFilter: ['hidden'] });
addEventListener('resize', meldungPlatz);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#fenster').hidden) fensterZu();
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); speichern(); }
});
/* Verlassen mit gelben Eingaben: der Browser fragt nach (R13) */
addEventListener('beforeunload', ev => { if (eingaben()) { ev.preventDefault(); ev.returnValue = ''; } });

/* ---------- Neues von selbst (wie das Gästebuch, E14): alle 30 s (bei den Stimmen alle 10 s) nachsehen, ob ein Fragebogen beantwortet oder in einem anderen Werkzeug etwas geändert wurde.
   Abende ohne gelbe Eingaben nehmen den neuen Stand still auf; mit gelben Eingaben bleibt alles, wie es ist (Speichern meldet dann den Konflikt). ---------- */
async function nachsehen(knopf = false) {
  try {
    const d = await api('/angelina-strelow/werkzeuge/api/abende'), neu = [], offen = offeneIds();
    Object.keys(S.ent).forEach(id => { if (!offen.includes(id)) delete S.ent[id]; });   // geöffnet, aber nichts geändert: zählt nicht als Eingabe
    let konflikt = false;
    S.abende = (d.abende || []).map(x => {
      const alt = S.basis[x.id] === undefined ? null : S.basis[x.id], srv = x.nachher || null;
      if (!abend(x.id) || gleich(alt, srv)) { if (!offen.includes(x.id)) S.basis[x.id] = kopie(srv); return x; }
      const altSt = voll(alt).stimme, st = voll(srv).stimme;
      if (st.neu && !gleich(altSt.neu || null, st.neu) || st.antwort && !altSt.antwort) neu.push(x.gastgeber.name);
      if (!offen.includes(x.id)) { S.basis[x.id] = kopie(srv); return x; }
      if (gleich(ohneFb(alt), ohneFb(srv))) { fbMischen(S.ent[x.id], alt, srv); S.basis[x.id] = kopie(srv); return x; }   // Antwort aus dem Fragebogen: in die gelbe Eingabe übernommen (Prüfung 2, N3)
      konflikt = true; return Object.assign(x, { nachher: alt });   // derselbe Abend in einem anderen Fenster geändert: Speichern meldet den Konflikt
    });
    S.etag = konflikt ? Object.assign({}, d.etag, { nachher: S.etag.nachher }) : d.etag;
    leiste(); if (!$('#fenster:not([hidden])') && !document.activeElement.matches('textarea, input')) zeichneHalten();
    if (neu.length) quit('Eine Stimme ist angekommen', neu.join(', ') + ' hat den Fragebogen beantwortet.' + (neu.some(g => offen.some(id => abend(id) && abend(id).gastgeber.name === g)) ? ' Deine gelben Eingaben bleiben, die Antwort ist dazugelegt.' : ''), [['Ansehen', () => gehe('stimmen')]], false, 12000);
    else if (knopf) quit('Neu geladen', '', [], false, 2500);
  } catch (e) { if (knopf) fehler(e); }
}

/* ---------- Start ---------- */
(async function () {
  try {
    await Promise.race([laden(), new Promise((_, nein) => setTimeout(() => nein(new Error('SERVER · Der Server antwortet nicht.')), 12000))]);
  } catch (e) { $('#tuer').hidden = false; $('#tuer-t').textContent = /^VERBINDUNG · /.test(e.message || '') ? 'Keine Verbindung zum Server. Bitte gleich neu laden.' : String(e.message || e).replace(/^[A-ZÄÖÜ]+ · /, ''); return; }
  try { const r = await fetch('api/haus', { cache: 'no-store' }); HAUS = r.ok ? await r.json() : null; } catch (e) { HAUS = null; }
  const h = location.hash.slice(1);
  try { S.wahl = localStorage.getItem('nachher-wahl') || ''; S.ansicht = TITEL[h] ? h : localStorage.getItem('nachher-ansicht') || 'start'; } catch (e) { S.ansicht = TITEL[h] ? h : 'start'; }
  if (!TITEL[S.ansicht]) S.ansicht = 'start';
  leiste(); zeichne();
  window.addEventListener('hashchange', () => { const z = location.hash.slice(1); if (TITEL[z] && z !== S.ansicht) gehe(z); });
  let zuletzt = Date.now();   // auf «Stimme einholen» und «Stimmen» alle 10 s, sonst alle 30 s
  setInterval(() => { if (document.hidden) return; if (!['stimme', 'stimmen'].includes(S.ansicht) && Date.now() - zuletzt < 29000) return; zuletzt = Date.now(); nachsehen(); }, 10000);
})();

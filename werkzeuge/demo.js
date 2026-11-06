/* Werkzeuge Angelina Strelow · Online-Fassung (06.11.2026). Erstes Skript jeder Seite unter /angelina-strelow/werkzeuge/.
   Online gibt es keinen Server: demo.js nimmt jede Anfrage der Werkzeuge an serve.py (/api/…) und an ihr server.py (/<werkzeug>/api/…, /<werkzeug>/dateien/…)
   im Browser an und antwortet in derselben Form. Gespeichert wird nur in diesem Browser: die Daten in localStorage, Bilder (Unterschrift, Fotos) in IndexedDB.
   Beim ersten Besuch kommen die Beispiel-Abende aus beispiel/*.json hinein. «Beispiel zurücksetzen» in der Werkbank stellt sie wieder her.
   Nichts geht an einen Server, nichts wird verschickt. PDFs setzt online das Druckfenster des Browsers («Als PDF sichern»). */
(function () {
  'use strict';
  var me = document.currentScript, ORT = new URL('.', me.src).pathname;
  var K = 'angelina-demo:', WZ = ['anfragen', 'abendplan', 'tisch', 'nachher'], TEILE = ['kern', 'angebot', 'plan', 'tisch', 'nachher'];
  var STATUS = ['anfrage', 'angebot', 'zugesagt', 'geplant', 'vorbei', 'abgeschlossen', 'abgesagt'];
  var VERLAUF = 15, GROESSE = 4 * 1024 * 1024, FOTO_MAX = 3000000;
  var holen = window.fetch.bind(window), LS = window.localStorage;
  var BSP = {}, DATEI = {};   // Beispiel-Dateien (roh) · Dateien als Blob-Adresse
  window.AS_DEMO = true;

  /* ---------- Hilfen ---------- */
  function Meldung(status, text) { this.status = status; this.text = text; }
  function hash(s) {   // FNV-1a, zweimal 32 Bit → 16 Zeichen wie der etag von serve.py
    var a = 0x811c9dc5, b = 0x01000193 ^ 0x5bd1e995;
    for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); a = Math.imul(a ^ c, 16777619); b = Math.imul(b ^ c, 2246822519); }
    return ('0000000' + (a >>> 0).toString(16)).slice(-8) + ('0000000' + (b >>> 0).toString(16)).slice(-8);
  }
  function zwei(n) { return (n < 10 ? '0' : '') + n; }
  function stempel(d) { d = d || new Date(); return d.getFullYear() + zwei(d.getMonth() + 1) + zwei(d.getDate()) + '-' + zwei(d.getHours()) + zwei(d.getMinutes()) + zwei(d.getSeconds()); }
  function isoMin(d) { d = d || new Date(); return d.getFullYear() + '-' + zwei(d.getMonth() + 1) + '-' + zwei(d.getDate()) + 'T' + zwei(d.getHours()) + ':' + zwei(d.getMinutes()); }
  function isoSek(d) { d = d || new Date(); return isoMin(d) + ':' + zwei(d.getSeconds()); }
  function hex(n) { var a = new Uint8Array(n); crypto.getRandomValues(a); return [].map.call(a, function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  function json(status, d) { return new Response(JSON.stringify(d), { status: status, headers: { 'Content-Type': 'application/json; charset=utf-8' } }); }
  function name_ok(n) { if (!/^[a-z][a-z0-9-]{1,40}$/.test(n || '')) throw new Meldung(400, 'NAME · Diesen Bereich gibt es nicht.'); return n; }
  function text(x, n) { return String(x == null ? '' : x).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '').trim().slice(0, n); }
  function liste(k) { try { return JSON.parse(LS.getItem(K + k) || '[]'); } catch (e) { return []; } }
  function setze(k, v) {   // voller Speicher: erst die ältesten früheren Fassungen weg, dann noch einmal
    for (var n = 0; n < 40; n++) {
      try { LS.setItem(k, v); return; } catch (e) {
        if (!platz()) throw new Meldung(507, 'SPEICHER · Der Speicher dieses Browsers ist voll. «Beispiel zurücksetzen» macht wieder Platz.');
      }
    }
  }
  function platz() {
    var best = null;
    TEILE.concat(sammlungen()).forEach(function (n) { var v = liste('v:' + n); if (v.length > 1 && (!best || v.length > best.v.length)) best = { n: n, v: v }; });
    if (!best) return false;
    best.v.shift(); LS.setItem(K + 'v:' + best.n, JSON.stringify(best.v)); return true;
  }
  function sammlungen() { var a = []; for (var i = 0; i < LS.length; i++) { var k = LS.key(i); if (k && k.indexOf(K + 'd:') === 0) a.push(k.slice(K.length + 2)); } return a; }

  /* ---------- Datenhaltung wie serve.py ---------- */
  function roh(n) { var r = LS.getItem(K + 'd:' + name_ok(n)); return r == null ? '{}' : r; }
  function lies(n) { var r = roh(n); return [JSON.parse(r), hash(r)]; }
  function schreib(n, daten, etag, wer, was) {
    var alt = roh(n);
    if (etag !== hash(alt)) throw new Meldung(409, 'KONFLIKT · Inzwischen hat ein anderes Fenster gespeichert. Die Seite lädt den neuen Stand.');
    var neu = JSON.stringify(daten);
    if (neu.length > GROESSE) throw new Meldung(400, 'GROESSE · Das ist zu viel auf einmal. Fotos bitte einzeln hinzufügen.');
    if (LS.getItem(K + 'd:' + n) != null) {
      setze(K + 'gut:' + n, alt);
      var v = liste('v:' + n), datei = n + '-' + stempel() + '.json';
      v = v.filter(function (x) { return x.datei !== datei; }); v.push({ datei: datei, roh: alt });
      setze(K + 'v:' + n, JSON.stringify(v.slice(-VERLAUF)));
    }
    setze(K + 'd:' + n, neu);
    var p = liste('protokoll'); p.push({ zeit: isoSek(), bereich: n, wer: wer || '', was: was || '' });
    setze(K + 'protokoll', JSON.stringify(p.slice(-300)));
    return hash(neu);
  }
  function verlaufAlt(n) { return liste('v:' + n).slice().reverse(); }   // neueste zuerst
  function abende() {
    var t = {}; TEILE.forEach(function (x) { t[x] = lies(x); });
    var aus = Object.keys(t.kern[0]).map(function (i) {
      var a = Object.assign({}, t.kern[0][i], { id: i });
      TEILE.slice(1).forEach(function (x) { a[x] = t[x][0][i] === undefined ? null : t[x][0][i]; });
      return a;
    });
    aus.sort(function (a, b) { var x = (a.anfrage || {}).datum || '9999', y = (b.anfrage || {}).datum || '9999'; return x < y ? -1 : x > y ? 1 : 0; });
    var e = {}; TEILE.forEach(function (x) { e[x] = t[x][1]; });
    return { abende: aus, etag: e, status: STATUS };
  }
  function neueAnfrage(b) {
    var f = {}; ['anlass', 'datum', 'gaeste', 'ort', 'name', 'email', 'wunsch'].forEach(function (k) { f[k] = String(b[k] == null ? '' : b[k]).trim().slice(0, 2000); });
    var tel = String(b.telefon || '').trim().slice(0, 60);
    if (!f.name || !(f.email || tel)) throw new Meldung(400, 'ANFRAGE · Name und eine E-Mail oder Telefonnummer fehlen noch.');
    if (f.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) throw new Meldung(400, 'ANFRAGE · Die E-Mail-Adresse stimmt so nicht.');
    var l = lies('kern'), kern = l[0], d = new Date();
    var i = 'a-' + String(d.getFullYear()).slice(2) + zwei(d.getMonth() + 1) + zwei(d.getDate()) + '-' + hex(2);
    kern[i] = { status: 'anfrage', beispiel: false, quelle: String(b.quelle || 'website').slice(0, 40), eingang: isoMin(d),
      gastgeber: { name: f.name, email: f.email, telefon: tel, adresse: '' },
      anfrage: { anlass: f.anlass, datum: f.datum, gaeste: f.gaeste, ort: f.ort, wunsch: f.wunsch } };
    schreib('kern', kern, l[1], 'website', 'neue Anfrage ' + i);
    return i;
  }

  /* ---------- Dateien (Unterschrift, Fotos) in IndexedDB ---------- */
  var db = null;
  function idb() {
    if (db) return db;
    db = new Promise(function (ok, nein) {
      var r = indexedDB.open('angelina-demo', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('dateien'); };
      r.onsuccess = function () { ok(r.result); }; r.onerror = function () { nein(r.error); };
    });
    return db;
  }
  function tx(art, f) { return idb().then(function (d) { return new Promise(function (ok, nein) { var t = d.transaction('dateien', art), s = t.objectStore('dateien'), r = f(s); t.oncomplete = function () { ok(r && r.result); }; t.onerror = function () { nein(t.error); }; }); }); }
  function dateiRein(name, blob) { return tx('readwrite', function (s) { return s.put(blob, name); }).then(function () { DATEI[name] = URL.createObjectURL(blob); umschreiben(document); }); }
  function dateienLaden() {
    return idb().then(function (d) { return new Promise(function (ok) {
      var t = d.transaction('dateien', 'readonly'), r = t.objectStore('dateien').openCursor();
      r.onsuccess = function () { var c = r.result; if (!c) return ok(); DATEI[c.key] = URL.createObjectURL(c.value); c.continue(); };
      r.onerror = function () { ok(); };
    }); }).catch(function () { /* ohne IndexedDB (privates Fenster): Bilder gehen nur bis zum Neuladen */ });
  }
  function dateiAus(name) { return tx('readwrite', function (s) { return s.delete(name); }).then(function () { delete DATEI[name]; }); }
  var DATEI_WEG = new RegExp('(?:https?://[^/"\'\\s)]+)?' + ORT.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&') + '(?:' + WZ.join('|') + ')/dateien/([^"\'\\s)?#]+)', 'g');
  window.AS_DATEIEN = function (s) { return String(s).replace(DATEI_WEG, function (g, n) { n = decodeURIComponent(n); return DATEI[n] || g; }); };
  function umschreiben(wurzel) {
    if (!wurzel || !wurzel.querySelectorAll) return;
    [].forEach.call(wurzel.querySelectorAll('img[src*="/dateien/"], source[srcset*="/dateien/"], [style*="/dateien/"]'), function (el) {
      ['src', 'srcset', 'style'].forEach(function (a) { var v = el.getAttribute(a); if (v && v.indexOf('/dateien/') >= 0) { var n = window.AS_DATEIEN(v); if (n !== v) el.setAttribute(a, n); } });
    });
  }
  function bild(daten) {   // data:image/…;base64 → {roh: Uint8Array, typ, art}
    var m = /^data:image\/(jpeg|png|webp);base64,([\s\S]+)$/.exec(String(daten || ''));
    if (!m) return null;
    var b = atob(m[2].replace(/\s/g, '')), u = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    return { roh: u, typ: 'image/' + m[1], art: { jpeg: 'jpg', png: 'png', webp: 'webp' }[m[1]] };
  }
  function echt(u) {   // Kopf der Datei wie im Server
    var s = function (a, b) { return String.fromCharCode.apply(null, u.slice(a, b)); };
    if (u[0] === 0x89 && s(1, 4) === 'PNG') return 'png';
    if (u[0] === 0xff && u[1] === 0xd8 && u[2] === 0xff) return 'jpg';
    if (s(0, 4) === 'RIFF' && s(8, 12) === 'WEBP') return 'webp';
    return '';
  }
  function masse(u) {   // Breite und Höhe aus dem Kopf (wie _masse in nachher/server.py)
    var be = function (i, n) { var x = 0; for (var k = 0; k < n; k++) x = x * 256 + u[i + k]; return x; }, le = function (i, n) { var x = 0; for (var k = n - 1; k >= 0; k--) x = x * 256 + u[i + k]; return x; };
    var art = echt(u);
    try {
      if (art === 'png') return [be(16, 4), be(20, 4)];
      if (art === 'webp') {
        var k = String.fromCharCode(u[12], u[13], u[14], u[15]);
        if (k === 'VP8 ') return [le(26, 2) & 0x3fff, le(28, 2) & 0x3fff];
        if (k === 'VP8L') { var b = le(21, 4); return [(b & 0x3fff) + 1, ((b >>> 14) & 0x3fff) + 1]; }
        if (k === 'VP8X') return [le(24, 3) + 1, le(27, 3) + 1];
        return null;
      }
      if (art === 'jpg') {
        var i = 2;
        while (i + 9 < u.length) {
          if (u[i] !== 0xff) { i++; continue; }
          var m = u[i + 1];
          if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7) || m === 0xff) { i += m === 0xff ? 1 : 2; continue; }
          if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return [be(i + 7, 2), be(i + 5, 2)];
          i += 2 + be(i + 2, 2);
        }
      }
    } catch (e) { /* unlesbar */ }
    return null;
  }

  /* ---------- Gemeinsame Wege (serve.py) ---------- */
  function gemeinsam(m, r, q, b) {
    if (r[0] === 'abende' && r.length === 1 && m === 'GET') return abende();
    if (r[0] === 'abende' && r.length === 1 && m === 'POST') return { id: neueAnfrage(b), meldung: 'Danke. Die Anfrage ist angekommen.' };
    if (r[0] === 'teil' && r.length === 2 && m === 'GET') {
      if (TEILE.indexOf(r[1]) < 0) throw new Meldung(404, 'WEG · Diesen Teil gibt es nicht.');
      var l = lies(r[1]); return { daten: l[0], etag: l[1] };
    }
    if (r[0] === 'teil' && r.length === 3 && m === 'PUT') {
      var t = r[1], i = r[2];
      if (TEILE.indexOf(t) < 0) throw new Meldung(404, 'WEG · Diesen Teil gibt es nicht.');
      var d = lies(t)[0];
      if (t !== 'kern' && !(i in lies('kern')[0])) throw new Meldung(404, 'ABEND · Diesen Abend gibt es nicht mehr.');
      var wert = b.wert === undefined ? null : b.wert;
      if (t === 'kern' && wert !== null && STATUS.indexOf(wert.status) < 0) throw new Meldung(400, 'STATUS · Diesen Stand gibt es nicht.');
      if (wert === null) delete d[i]; else d[i] = wert;
      return { etag: schreib(t, d, b.etag, b.wer, b.was) };
    }
    if (r[0] === 'sammlung' && r.length === 2) {
      if (m === 'GET') { var s = lies(r[1]); return { daten: s[0], etag: s[1] }; }
      if (m === 'PUT') return { etag: schreib(r[1], b.daten, b.etag, b.wer, b.was) };
    }
    if (r[0] === 'verlauf' && r.length === 2 && m === 'GET') return { fassungen: verlaufAlt(name_ok(r[1])).map(function (x) { return x.datei; }) };
    if (r[0] === 'verlauf' && r.length === 3 && m === 'POST') {
      var n = name_ok(r[1]), f = r[2], x = liste('v:' + n).filter(function (y) { return y.datei === f; })[0];
      if (!x) throw new Meldung(404, 'VERLAUF · Diese Fassung gibt es nicht.');
      return { etag: schreib(n, JSON.parse(x.roh), lies(n)[1], b.wer, 'zurückgeholt ' + f) };
    }
    if (r[0] === 'protokoll' && m === 'GET') return { eintraege: liste('protokoll').slice().reverse() };
    if (r[0] === 'fehler' && m === 'POST') { var fl = liste('fehler'); fl.push(JSON.stringify(b).slice(0, 4000)); setze(K + 'fehler', JSON.stringify(fl.slice(-50))); return {}; }
    throw new Meldung(404, 'WEG · Diesen Weg gibt es nicht.');
  }
  function fehlerZeilen(n) { return liste('fehler').slice(-(n || 20)); }

  /* ---------- Anfragen & Angebote (anfragen/server.py) ---------- */
  function anfragen(m, weg, q, b) {
    if (weg === 'haus' && m === 'GET') return lies('haus')[0];
    if (weg === 'start' && m === 'GET') { var s = {}; ['preise', 'vorlagen', 'einstellungen'].forEach(function (n) { s[n] = JSON.parse(BSP['anfragen-' + n] || '{}'); }); return s; }
    if (weg === 'zustand' && m === 'GET') {
      var p = [], punkt = function (g, w, st, t, sw) { p.push({ gruppe: g, was: w, stand: st, text: t, stichwort: sw || '' }); };
      var kern = lies('kern')[0], ang = lies('angebot')[0], n = Object.keys(kern).length, bsp = Object.keys(kern).filter(function (i) { return kern[i].beispiel; }).length;
      punkt('Server', 'Vorschau im Browser', 'gut', 'Online läuft das Werkzeug ganz in diesem Browser. Gespeichert wird nur hier.');
      punkt('Daten', 'Abende', n ? 'gut' : 'gelb', n ? n + ' Abende, davon ' + bsp + ' Beispiele. Angebote zu ' + Object.keys(ang).length + ' Abenden.' : 'Noch kein Abend.', n ? '' : 'LEER');
      [['preise', 'Preisliste'], ['vorlagen', 'Textbausteine'], ['einstellungen', 'Einstellungen']].forEach(function (x) {
        var d = lies('anfragen-' + x[0])[0];
        if (!Object.keys(d).length) punkt('Eigene Angaben', x[1], 'rot', 'Die Startwerte fehlen.', 'DATEN');
        else if (d.beispiel || (x[0] === 'preise' && (d.posten || []).some(function (y) { return y.beispiel; }))) punkt('Eigene Angaben', x[1], 'gelb', 'Noch die Startwerte (Beispiel).', 'BEISPIEL');
        else punkt('Eigene Angaben', x[1], 'gut', 'Eigene Fassung gespeichert.');
      });
      punkt('Drucken', 'PDF', 'gut', 'Das Angebot setzt das Druckfenster des Browsers als A4-PDF («Als PDF sichern»).');
      var z = fehlerZeilen();
      punkt('Browser', 'Mitgeschriebene Fehler', z.length ? 'gelb' : 'gut', z.length ? z.length + ' Fehler mitgeschrieben (unten).' : 'Keine Fehler aus dem Browser.', z.length ? 'BROWSER' : '');
      punkt('Senden', 'Nichts geht raus', 'gut', 'Kein Mailprogramm, kein Versand.');
      return { punkte: p, fehler: z, daten: 'dieser Browser', zeit: isoSek() };
    }
    if (weg === 'fehler_leeren' && m === 'POST') { LS.removeItem(K + 'fehler'); return { meldung: 'Die mitgeschriebenen Fehler sind geleert.' }; }
    if (weg === 'unterschrift_bild' && m === 'POST') {
      var x = bild(b.daten);
      if (!x) throw new Meldung(400, 'BILD · Bitte ein Bild als PNG, JPEG oder WebP wählen.');
      if (x.roh.length > 3 * 1024 * 1024) throw new Meldung(413, 'BILD · Das Bild ist grösser als 3 MB. Bitte kleiner sichern und noch einmal wählen.');
      if (!echt(x.roh)) throw new Meldung(400, 'BILD · Diese Datei ist kein Bild. Bitte ein PNG, JPEG oder WebP wählen.');
      var name = 'unterschrift-' + stempel() + '.' + x.art;
      return dateiRein(name, new Blob([x.roh], { type: x.typ })).then(function () { return { datei: name }; });
    }
    if (weg === 'blatt_pdf' && m === 'POST') {
      if (!b.daten || !b.daten.posten || !b.daten.posten.length) throw new Meldung(400, 'ANGEBOT · Im Angebot steht noch keine Leistung.');
      throw new Meldung(503, 'DRUCK · Online setzt das Druckfenster des Browsers das PDF.');   // anfragen.js öffnet dann das Druckfenster mit demselben A4-Blatt
    }
    throw new Meldung(404, 'WEG · Diesen Weg gibt es nicht.');
  }

  /* ---------- Der Abendplan (abendplan/server.py) ---------- */
  function zeitVon(datei) { var m = /-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})\.json$/.exec(datei); return m ? m[3] + '.' + m[2] + '.' + m[1] + ' ' + m[4] + ':' + m[5] : datei; }
  function abendId(q, b) { var i = (q && q.get('id')) || (b || {}).id || ''; if (!/^a-[0-9a-z-]{4,40}$/.test(i)) throw new Meldung(404, 'ABEND · Diesen Abend gibt es nicht.'); return i; }
  function abendplan(m, weg, q, b) {
    if (m === 'GET' && weg === 'fassungen') {
      var i = abendId(q), jetzt = JSON.stringify(lies('plan')[0][i]), letzt = jetzt, aus = [];
      verlaufAlt('plan').forEach(function (x) {
        var p; try { p = JSON.parse(x.roh)[i]; } catch (e) { return; }
        if (p == null) return;
        var r = JSON.stringify(p); if (r === letzt) return; letzt = r;
        var ab = p.abstimmung || {};
        aus.push({ datei: x.datei, zeit: zeitVon(x.datei), fassung: p.fassung || '', titel: p.titel || 'Plan', nach: !!(ab.bestaetigt_am && ab.nachher) });
      });
      return { fassungen: aus.slice(0, 80), ursprung: i in JSON.parse(BSP.plan || '{}') };
    }
    if (m === 'GET' && weg === 'fassung') {
      var j = abendId(q), d = q.get('datei') || '';
      if (d === 'ursprung') { var u = JSON.parse(BSP.plan || '{}')[j]; if (u == null) throw new Meldung(404, 'VERLAUF · Für diesen Abend gibt es keinen ursprünglichen Stand.'); return { plan: u, zeit: '' }; }
      var x = liste('v:plan').filter(function (y) { return y.datei === d; })[0], p = x ? JSON.parse(x.roh)[j] : null;
      if (p == null) throw new Meldung(404, 'VERLAUF · Diese Fassung gibt es nicht mehr.');
      return { plan: p, zeit: zeitVon(d) };
    }
    if (m === 'POST' && weg === 'pdf') {   // online: das Blatt im neuen Tab, dort öffnet sich das Druckfenster («Als PDF sichern»)
      var k = abendId(null, b), art = b.art === 'arbeit' ? 'arbeit' : 'gastgeber', a = abende().abende.filter(function (y) { return y.id === k; })[0];
      if (!a || !a.plan) throw new Meldung(400, 'PLAN · Für diesen Abend ist noch kein Plan gespeichert.');
      return { url: ORT + 'abendplan/blatt.html?druck=1&drucken=1&id=' + encodeURIComponent(k) + '&art=' + art,
        name: (art === 'gastgeber' ? 'Dein Abend' : 'Arbeitsblatt') + ' · ' + ((a.gastgeber || {}).name || '') + ' · ' + ((a.anfrage || {}).datum || '') + '.pdf', groesse: 0 };
    }
    if (m === 'GET' && weg === 'gesund') {
      var plan = lies('plan'), kern = lies('kern')[0];
      return { daten: 'dieser Browser', schreibbar: true, plaene: Object.keys(plan[0]).length, abende: Object.keys(kern).length,
        ohne_abend: Object.keys(plan[0]).filter(function (y) { return !(y in kern); }).sort(), verlauf: liste('v:plan').length,
        sicherung: LS.getItem(K + 'gut:plan') != null, node: true, playwright: true, schriften: true, vorlagen: true, fehler: liste('fehler').length, etag: plan[1],
        zeit: new Date().toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '') };
    }
    if (m === 'GET' && weg === 'fehler') return { fehler: fehlerZeilen(30).reverse().map(function (z) { try { return JSON.parse(z); } catch (e) { return { text: String(z).slice(0, 300) }; } }) };
    if (m === 'POST' && weg === 'fehler-leeren') { LS.removeItem(K + 'fehler'); return { meldung: 'Die Fehlerliste ist leer.' }; }
    throw new Meldung(404, 'WEG · Diesen Weg gibt es nicht.');
  }

  /* ---------- Tischkarten & Menü (tisch/server.py) ---------- */
  var GEMEINSAM = ['stil', 'akzent', 'monogramm', 'kopf', 'wortmarke'], SITZ = ['tischplan', 'memory', 'tischkarten'];
  var STIL_NAMEN = { schlicht: 'Schlicht', advent: 'Advent', hochzeitstag: 'Hochzeitstag', geburtstag: 'Geburtstag', silvester: 'Silvester', garten: 'Garten', familie: 'Familie', smoking: 'Im Smoking', weinabend: 'Weinabend', jubilaeum: 'Jubiläum', kerzenschein: 'Kerzenschein', leise: 'Ganz leise' };
  var FORMAT_NAMEN = { a5h: 'A5 hoch', lang: 'Lang', a4h: 'A4 hoch', a4q: 'A4 quer', a3h: 'A3 hoch', a3q: 'A3 quer', falt: 'gefaltet', faltbogen: 'gefaltet auf Bogen', platz: 'Platzkarte', platzbogen: 'Platzkarten auf Bogen', memory: 'einzeln', memorybogen: 'auf Bogen' };
  function sortiert(x) {   // wie json.dumps(sort_keys=True): gleiche Fassungen erkennen
    if (Array.isArray(x)) return '[' + x.map(sortiert).join(',') + ']';
    if (x && typeof x === 'object') return '{' + Object.keys(x).sort().map(function (k) { return JSON.stringify(k) + ':' + sortiert(x[k]); }).join(',') + '}';
    return JSON.stringify(x === undefined ? null : x);
  }
  function stueckVon(z, st) {
    z = z || {}; var d = {};
    GEMEINSAM.forEach(function (k) { if (k in z) d[k] = z[k]; });
    d.stueck = (z.stuecke || {})[st] || {};
    if (SITZ.indexOf(st) >= 0 && z.sitz != null) d.sitz = z.sitz;
    if (st === 'memory' && z.memory != null) d.memory = z.memory;
    return d;
  }
  function kurz(d) {
    var st = d.stueck || {}, t = [STIL_NAMEN[d.stil] || 'Gestaltung nach Anlass'];
    if (st.format) t.push(FORMAT_NAMEN[st.format] || st.format);
    var n = Object.keys(st.texte || {}).length; if (n) t.push(n === 1 ? '1 Text geändert' : n + ' Texte geändert');
    if (d.sitz && d.sitz.belegung) t.push(Object.keys(d.sitz.belegung).filter(function (k) { return d.sitz.belegung[k]; }).length + ' Plätze belegt');
    if (st.fertig) t.push('druckfertig');
    return t.join(' · ');
  }
  function zeitIso(datei) { var m = /-(\d{4})(\d\d)(\d\d)-(\d\d)(\d\d)(\d\d)\.json$/.exec(datei); return m ? m[1] + '-' + m[2] + '-' + m[3] + 'T' + m[4] + ':' + m[5] + ':' + m[6] : ''; }
  function tisch(m, weg, q) {
    var abend = q.get('abend') || '';
    if (m !== 'GET') throw new Meldung(405, 'WEG · Hier wird nur gelesen.');
    if (!/^[a-z0-9-]{3,40}$/.test(abend)) throw new Meldung(400, 'ABEND · Diesen Abend gibt es nicht.');
    if (weg === 'fassungen') {
      var st = q.get('stueck') || '';
      if (!/^[a-z]{3,20}$/.test(st)) throw new Meldung(400, 'NAME · Diese Drucksache gibt es nicht.');
      var zuletzt = sortiert(stueckVon(lies('tisch')[0][abend], st)), aus = [];
      verlaufAlt('tisch').some(function (x) {
        var alt; try { alt = JSON.parse(x.roh); } catch (e) { return false; }
        if (!(abend in alt)) return false;
        var d = stueckVon(alt[abend], st), sig = sortiert(d);
        if (sig === zuletzt) return false; zuletzt = sig;
        aus.push({ datei: x.datei, zeit: zeitIso(x.datei), kurz: kurz(d) });
        return aus.length >= 40;
      });
      return { fassungen: aus };
    }
    if (weg === 'fassung') {
      var f = q.get('datei') || '', x = liste('v:tisch').filter(function (y) { return y.datei === f; })[0];
      if (!x) throw new Meldung(404, 'VERLAUF · Diese Fassung gibt es nicht mehr.');
      return { zustand: JSON.parse(x.roh)[abend] || {}, zeit: zeitIso(f) };
    }
    if (weg === 'ursprung') return { zustand: JSON.parse(BSP.tisch || '{}')[abend] || {} };
    throw new Meldung(404, 'WEG · Diesen Weg gibt es nicht.');
  }

  /* ---------- Nach dem Abend (nachher/server.py) ---------- */
  var TITEL = /^(dr|prof|dipl|ing|med|mag|mba|msc|bsc|llm|rer|nat|phil|jur|habil)\.?$/i, ANREDE = /^(herr|herrn|frau|hr\.?|fr\.?)$/i, PAAR = / (?:und|&|\+|u\.) /i;
  function vorname(name) {
    name = String(name || '').split(/\s+/).filter(Boolean).join(' ');
    if (!name || name.toLowerCase().indexOf('familie ') === 0) return name;
    if (!PAAR.test(name) && name.indexOf(',') >= 0) { var i = name.indexOf(','), nach = name.slice(0, i), vor = name.slice(i + 1); if (vor.trim()) name = vor.trim() + ' ' + nach.trim(); }
    var leute = [];
    name.split(/ (?:und|&|\+|u\.) /i).forEach(function (x) {
      var w = x.split(' ').filter(function (t) { return t && !TITEL.test(t) && !(t.indexOf('.') >= 0 && t.length > 3 && !ANREDE.test(t)); });
      if (!w.length) return;
      if (ANREDE.test(w[0])) leute.push([w.length > 2 ? w[1] : '', w.join(' ')]); else leute.push([w[0], w.join(' ')]);
    });
    if (!leute.some(function (l) { return l[0]; })) return leute.map(function (l) { return l[1]; }).join(' und ');
    return leute.map(function (l) { return l[0] || l[1]; }).join(' und ');
  }
  function fragebogenAbend(abend, s) {
    var k = lies('kern')[0][abend], x = lies('nachher')[0][abend] || {}, st = x.stimme || {};
    if (!k || !s || !st.schluessel || String(s) !== String(st.schluessel)) throw new Meldung(404, 'FRAGEBOGEN · Dieser Link ist nicht (mehr) gültig. Bitte frag Angelina nach einem neuen.');
    return [k, x, st];
  }
  function genutzt() {
    var namen = function (n) { var s = {}; Object.keys(n || {}).forEach(function (k) { var x = n[k]; if (x && typeof x === 'object') (x.fotos || []).forEach(function (f) { if (f.quelle === 'eigen') s[f.datei] = 1; }); }); return s; };
    var jetzt = namen(lies('nachher')[0]), alt = {};
    liste('v:nachher').map(function (x) { return x.roh; }).concat([LS.getItem(K + 'gut:nachher') || '{}']).forEach(function (r) { try { Object.assign(alt, namen(JSON.parse(r))); } catch (e) { /* */ } });
    Object.keys(jetzt).forEach(function (k) { delete alt[k]; });
    return [jetzt, alt];
  }
  function antwortenBehalten(gut, jetzt) {
    var n = 0;
    Object.keys(jetzt).forEach(function (aid) {
      var alt = ((jetzt[aid] || {}).stimme) || {}, fehlt = [alt.antwort, alt.neu].filter(function (y) { return y && y.herkunft !== 'eingetragen'; });
      if (!fehlt.length) return;
      var w = gut[aid]; if (!w || typeof w !== 'object') w = gut[aid] = {};
      var st = w.stimme && typeof w.stimme === 'object' ? w.stimme : (w.stimme = {}), g = false;
      fehlt.forEach(function (y) {
        if (sortiert(y) === sortiert(st.antwort) || sortiert(y) === sortiert(st.neu)) return;
        if (!st.antwort) { st.antwort = y; st.freigabe = ''; } else if (!st.neu || String(y.eingang) >= String(st.neu.eingang)) st.neu = y;
        g = true;
      });
      n += g ? 1 : 0;
    });
    return n;
  }
  function nachher(m, weg, q, b) {
    if (m === 'GET' && weg === 'haus') { var h = lies('haus')[0]; return { stimmen: h.stimmen || [], saetze: h.saetze || [], name: h.name || '' }; }
    if (m === 'GET' && weg === 'zustand') {
      var p = [], punkt = function (g, w, st, t, sw) { p.push({ gruppe: g, was: w, stand: st, text: t, stichwort: sw || '' }); };
      punkt('Server', 'Vorschau im Browser', 'gut', 'Online läuft das Werkzeug ganz in diesem Browser. Gespeichert wird nur hier.');
      ['kern', 'plan', 'tisch', 'nachher'].forEach(function (t) { punkt('Daten', 'Teil «' + t + '» lesbar', 'gut', Object.keys(lies(t)[0]).length + ' Abende'); });
      var v = liste('v:nachher').length, gut = LS.getItem(K + 'gut:nachher') != null;
      punkt('Daten', 'Sicherungen', gut || v ? 'gut' : 'gelb', gut || v ? (gut ? 'letzte gute Fassung da · ' : '') + v + ' frühere Fassungen' : 'Noch nichts gespeichert, darum noch keine Sicherung.');
      var g = genutzt(), da = Object.keys(DATEI).filter(function (n) { return n.indexOf('u-') === 0; });
      punkt('Fotos', 'Hinzugefügte Fotos', 'gut', da.length + ' in diesem Browser, ' + da.filter(function (n) { return g[0][n]; }).length + ' bei einem Abend');
      punkt('Druck', 'PDF', 'gut', 'Mappe und Karte setzt das Druckfenster des Browsers («Als PDF sichern»).');
      var z = fehlerZeilen();
      punkt('Browser', 'Mitgeschriebene Fehler', z.length ? 'gelb' : 'gut', z.length ? z.length + ' Einträge' : 'Keine', z.length ? 'SKRIPT' : '');
      return { punkte: p, fehler: z };
    }
    if (m === 'POST' && (weg === 'foto' || weg === 'unterschrift')) {
      var foto = weg === 'foto', abend = text(b.abend, 40);
      if (foto && !(abend in lies('kern')[0])) throw new Meldung(404, 'ABEND · Diesen Abend gibt es nicht mehr.');
      var x = bild(b.daten), W = foto ? 'FOTO' : 'BILD';
      if (!x) throw new Meldung(400, foto ? 'FOTO · Das ist kein Foto (JPEG, PNG oder WebP).' : 'BILD · Das ist kein Bild (PNG, JPEG oder WebP).');
      if (foto && x.roh.length < 4000) throw new Meldung(400, 'FOTO · Das Foto ist zu klein für Mappe und Website (mindestens 900 Pixel an der langen Seite).');
      if (x.roh.length > FOTO_MAX) throw new Meldung(400, foto ? 'FOTO · Das Foto ist zu gross, auch verkleinert. Bitte ein anderes wählen.' : 'BILD · Das Bild ist zu gross. Bitte eine kleinere Fassung wählen.');
      var art = echt(x.roh), wh = art ? masse(x.roh) : null;
      if (!art || !wh || Math.min(wh[0], wh[1]) < 1) throw new Meldung(400, W + (foto ? ' · Die Datei ist kein lesbares Foto.' : ' · Die Datei ist kein lesbares Bild.'));
      if (foto && Math.max(wh[0], wh[1]) < 900) throw new Meldung(400, 'FOTO · Das Foto ist nur ' + Math.max(wh[0], wh[1]) + ' Pixel gross. Für Mappe und Website braucht es mindestens 900 Pixel an der langen Seite.');
      if (!foto && wh[0] < 200) throw new Meldung(400, 'BILD · Die Unterschrift ist nur ' + wh[0] + ' Pixel breit. Für den Druck braucht es mindestens 200 Pixel.');
      var name = foto ? 'u-' + abend.replace(/[^a-z0-9]/g, '').slice(-12) + '-' + hex(4) + '.' + art : 'unterschrift-' + hex(4) + '.' + art;
      return dateiRein(name, new Blob([x.roh], { type: x.typ })).then(function () {
        return foto ? { datei: name, groesse: x.roh.length, titel: text(String(b.name || '').replace(/\.[^.]*$/, '').replace(/_/g, ' '), 80) } : { datei: name, breite: wh[0], hoehe: wh[1] };
      });
    }
    if (m === 'GET' && weg === 'fragebogen') {
      var f = fragebogenAbend(q.get('abend') || '', q.get('s') || ''), nm = (f[0].gastgeber || {}).name || '', an = f[0].anfrage || {};
      return { vorname: vorname(nm), ihr: PAAR.test(nm) || nm.toLowerCase().indexOf('familie') === 0, anlass: an.anlass || '', datum: an.datum || '', ort: an.ort || '', beantwortet: !!f[2].antwort, beispiel: !!f[0].beispiel };
    }
    if (m === 'POST' && weg === 'stimme') {
      var ab = text(b.abend, 40);
      if (b.website) return { ok: true };
      var a = { eingang: isoMin(), herkunft: 'fragebogen', wie: text(b.wie, 2000), satz: text(b.satz, 300), name: text(b.name, 80), ort: text(b.ort, 80),
        zeigen: ['voll', 'vorname', 'ohne', 'nein'].indexOf(b.zeigen) >= 0 ? b.zeigen : 'nein', fotos_ok: !!b.fotos_ok };
      if (!a.wie && !a.satz) throw new Meldung(400, 'FRAGEBOGEN · Schreib bitte ein paar Worte, wie der Abend für dich war.');
      fragebogenAbend(ab, b.s);
      var l = lies('nachher'), n = l[0], y = n[ab] || {}, st = Object.assign({}, y.stimme || {});
      if (st.antwort) st.neu = a; else { st.antwort = a; st.freigabe = ''; }
      n[ab] = Object.assign({}, y, { stimme: st });
      schreib('nachher', n, l[1], 'fragebogen', 'Stimme ' + ab);
      return { ok: true };
    }
    if (m === 'POST' && weg === 'pdf') throw new Meldung(503, 'DRUCK · Online setzt das Druckfenster des Browsers die PDF. Bitte «Drucken» nehmen und dort «Als PDF sichern» wählen.');
    if (m === 'POST' && weg === 'reparatur') {
      if (b.was === 'fehler') { LS.removeItem(K + 'fehler'); return { meldung: 'Fehlerliste geleert.' }; }
      if (b.was === 'sicherung') {
        var g0 = LS.getItem(K + 'gut:nachher'); if (g0 == null) throw new Meldung(404, 'DATEI · Es gibt noch keine Sicherung.');
        var gut = JSON.parse(g0), j = lies('nachher'), blieb = antwortenBehalten(gut, j[0] || {});
        schreib('nachher', gut, j[1], 'pruefung', 'Sicherung zurückgeholt');
        return { meldung: 'Die letzte gute Fassung ist zurück.' + (blieb ? ' Antworten aus dem Fragebogen, die danach kamen, bleiben (' + blieb + ').' : '') };
      }
      if (b.was === 'fotos') {
        var gn = genutzt(), weg2 = Object.keys(DATEI).filter(function (k) { return k.indexOf('u-') === 0 && !gn[0][k] && !gn[1][k]; });
        return Promise.all(weg2.map(dateiAus)).then(function () { return { meldung: weg2.length + ' Fotos weggeräumt, die kein Abend und keine frühere Fassung mehr braucht.' }; });
      }
      throw new Meldung(400, 'WEG · Diese Reparatur gibt es nicht.');
    }
    throw new Meldung(404, 'WEG · Diesen Weg gibt es nicht.');
  }

  /* ---------- Beispiel laden, beim ersten Besuch einsetzen ---------- */
  function beispiel(frisch) {
    return holen(ORT + 'beispiel/index.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (namen) {
      return Promise.all(namen.map(function (n) { return holen(ORT + 'beispiel/' + n + '.json', { cache: 'no-cache' }).then(function (r) { return r.text(); }).then(function (t) { BSP[n] = t; }); }));
    }).then(function () {
      if (frisch || !LS.getItem(K + 'stand')) {
        Object.keys(BSP).forEach(function (n) { if (frisch || LS.getItem(K + 'd:' + n) == null) setze(K + 'd:' + n, BSP[n]); });
        setze(K + 'stand', isoSek());
      }
    });
  }
  var bereit = Promise.all([beispiel(false).catch(function (e) { if (!LS.getItem(K + 'stand')) throw e; }), dateienLaden()])   // schon befüllt: weiter, auch wenn die Beispiele gerade nicht kommen.then(function () { umschreiben(document); });
  window.AS_BEREIT = bereit;

  /* ---------- fetch: Wege der Werkzeuge hier beantworten ---------- */
  var EIGEN = { anfragen: anfragen, abendplan: abendplan, tisch: tisch, nachher: nachher };
  function antwort(m, u, body) {
    var w = u.pathname.slice(ORT.length).split('/').filter(Boolean).map(decodeURIComponent), b = {};
    if (m === 'POST' || m === 'PUT') {
      if (body) { try { b = JSON.parse(body); } catch (e) { throw new Meldung(400, 'FORMAT · Die Eingabe kam unvollständig an.'); } }
    }
    if (WZ.indexOf(w[0]) >= 0 && w[1] === 'dateien') {
      var n = w[2] || '';
      return tx('readonly', function (s) { return s.get(n); }).then(function (blob) { return blob ? new Response(blob, { status: 200, headers: { 'Content-Type': blob.type } }) : json(404, { fehler: 'DATEI · Diese Datei gibt es nicht.' }); });
    }
    if (WZ.indexOf(w[0]) >= 0) return EIGEN[w[0]](m, w.slice(2).join('/'), u.searchParams, b);
    return gemeinsam(m, w.slice(1), u.searchParams, b);
  }
  function istWeg(u) {
    if (u.origin !== location.origin || u.pathname.indexOf(ORT) !== 0) return false;
    var w = u.pathname.slice(ORT.length).split('/');
    return w[0] === 'api' || (WZ.indexOf(w[0]) >= 0 && (w[1] === 'api' || w[1] === 'dateien'));
  }
  window.fetch = function (eingabe, init) {
    var url = typeof eingabe === 'string' ? eingabe : eingabe && eingabe.url ? eingabe.url : String(eingabe), u;
    try { u = new URL(url, location.href); } catch (e) { return holen(eingabe, init); }
    if (!istWeg(u)) return holen(eingabe, init);
    var m = String((init && init.method) || (eingabe && eingabe.method) || 'GET').toUpperCase(), body = init && init.body;
    return bereit.then(function () { return antwort(m, u, typeof body === 'string' ? body : ''); }).then(function (d) {
      return d instanceof Response ? d : json(200, d);
    }, function (e) {
      if (e instanceof Meldung) return json(e.status, { fehler: e.text });
      try { console.error(e); } catch (x) { /* */ }
      return json(500, { fehler: 'SERVER · Etwas ist schiefgegangen. Die Daten sind unverändert.' });
    });
  };

  /* ---------- Bilder aus IndexedDB in jede Seite, Druckfenster für die Blätter, Knopf «Beispiel zurücksetzen» ---------- */
  new MutationObserver(function (l) {
    if (!Object.keys(DATEI).length) return;
    l.forEach(function (r) {
      if (r.type === 'attributes') umschreiben(r.target.parentNode || r.target);
      else [].forEach.call(r.addedNodes, function (n) { if (n.nodeType === 1) { umschreiben(n.parentNode || n); } });
    });
  }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['src', 'srcset', 'style'] });

  var q = new URLSearchParams(location.search);
  if (/\/abendplan\/blatt\.html$/.test(location.pathname) && q.get('drucken')) {
    var warte = setInterval(function () { if (window.AP_FERTIG || window.AP_FEHLER) { clearInterval(warte); if (window.AP_FERTIG) setTimeout(function () { window.print(); }, 300); } }, 150);
  }

  function zuruecksetzen() {
    var weg = []; for (var i = 0; i < LS.length; i++) { var k = LS.key(i); if (k && k.indexOf(K) === 0) weg.push(k); }
    weg.forEach(function (k) { LS.removeItem(k); });
    return tx('readwrite', function (s) { return s.clear(); }).catch(function () { /* */ }).then(function () { return beispiel(true); });
  }
  window.AS_ZURUECK = zuruecksetzen;   // «Beispiel zurücksetzen» steht in der Werkbank (gleiche Adresse, derselbe Speicher)
})();

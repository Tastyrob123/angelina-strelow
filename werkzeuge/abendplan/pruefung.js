/* Der Abendplan · Prüfseite (05.11.2026, R23, Kopie der Prüfseite der Pairing-Karte): läuft ohne abendplan.js. Liest /abendplan/api/gesund und /api/abende,
   zeigt Browser, Server, Pläne, Druck, Sicherungen und Fehler; Reparatur mit zwei Klicks. */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var h = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var zeile = function (t, wert, ok) { return '<div><span>' + h(t) + '</span><b class="' + (ok === true ? 'ja' : ok === false ? 'nein' : '') + '">' + h(wert) + '</b></div>'; };
  var lokal = [];
  try { lokal = JSON.parse(localStorage.getItem('ap-fehler') || '[]'); } catch (e) { /* ohne Speicher */ }
  var sp = true; try { localStorage.setItem('ap-probe', '1'); localStorage.removeItem('ap-probe'); } catch (e) { sp = false; }
  $('#p-browser').innerHTML = zeile('Verbindungen', typeof fetch === 'function' ? 'vorhanden' : 'fehlt', typeof fetch === 'function') +
    zeile('Speicher im Browser (letzte Ansicht)', sp ? 'in Ordnung' : 'gesperrt, das Werkzeug merkt sich nichts', sp) +
    zeile('Eintrag im Protokoll', 'Angelina (ohne Anmeldung)', true) + zeile('Fenster', innerWidth + ' × ' + innerHeight + ' px', true);
  function lade() {
    var t0 = performance.now();
    return Promise.all([fetch('/angelina-strelow/werkzeuge/abendplan/api/gesund', { cache: 'no-store' }).then(function (r) { return r.json(); }), fetch('/angelina-strelow/werkzeuge/api/abende', { cache: 'no-store' }).then(function (r) { return r.json(); }), fetch('/angelina-strelow/werkzeuge/abendplan/api/fehler', { cache: 'no-store' }).then(function (r) { return r.json(); })]).then(function (x) {
      var g = x[0], ab = x[1].abende || [], f = x[2].fehler || [];
      $('#p-server').innerHTML = zeile('Antwort des Servers', Math.round(performance.now() - t0) + ' ms', true) + zeile('Datenordner schreibbar', g.schreibbar ? 'ja' : 'nein', !!g.schreibbar) + zeile('Stand gelesen', g.zeit, true);
      var mit = ab.filter(function (a) { return a.plan; }), noetig = ab.filter(function (a) { return ['zugesagt', 'geplant', 'vorbei', 'abgeschlossen'].indexOf(a.status) >= 0; });
      var ohne = noetig.filter(function (a) { return !a.plan; });
      $('#p-plaene').innerHTML = zeile('Abende insgesamt', ab.length, true) + zeile('Abende ab «zugesagt»', noetig.length, true) + zeile('davon mit Plan', mit.length + ' von ' + noetig.length, !ohne.length || null)
        + (ohne.length ? zeile('noch ohne Plan', ohne.map(function (a) { return (a.gastgeber || {}).name; }).join(', '), null) : '')
        + zeile('Pläne ohne Abend', g.ohne_abend.length ? g.ohne_abend.join(', ') : 'keine', !g.ohne_abend.length)
        + zeile('Vorlagen je Anlass', g.vorlagen ? 'da' : 'fehlen', !!g.vorlagen);
      $('#p-druck').innerHTML = zeile('Druckprogramm (node)', g.node ? 'da' : 'fehlt', !!g.node) + zeile('Eingebauter Browser für das PDF', g.playwright ? 'da' : 'fehlt', !!g.playwright) + zeile('Feste Schriften für das PDF', g.schriften ? 'da' : 'fehlen', !!g.schriften);
      $('#p-sich').innerHTML = zeile('Letzte gute Fassung', g.sicherung ? 'liegt bereit' : 'noch keine (erst nach dem ersten Speichern)', g.sicherung || null) + zeile('Frühere Fassungen der Pläne', g.verlauf, true);
      var alle = f.map(function (e) { return { zeit: e.zeit || '', text: e.text || '', seite: e.seite || 'Server' }; }).concat(lokal.slice().reverse().map(function (e) { return { zeit: e.zeit, text: e.text, seite: 'dieser Browser · ' + e.seite }; }));
      $('#p-fehler').innerHTML = alle.length ? alle.slice(0, 20).map(function (e) { return zeile(e.text, (e.zeit || '').replace('T', ' ').slice(0, 16) + ' · ' + e.seite, false); }).join('') : zeile('Fehler', 'keine', true);
    }).catch(function (e) { $('#p-server').innerHTML = zeile('Antwort des Servers', 'keine: ' + e.message + '. Läuft der Abendplan (python3 serve.py 8852)?', false); });
  }
  lade();
  var scharf = null;
  $('#p-rep').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-rep]'); if (!b) return;
    if (scharf !== b) { if (scharf) scharf.removeAttribute('data-scharf'); scharf = b; b.setAttribute('data-scharf', ''); $('#p-quit').textContent = 'Noch einmal klicken, um auszuführen.'; return; }
    scharf = null; b.removeAttribute('data-scharf');
    fetch('/angelina-strelow/werkzeuge/abendplan/api/fehler-leeren', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(function (r) { return r.json(); }).then(function (j) {
      try { localStorage.removeItem('ap-fehler'); } catch (e) { /* egal */ } lokal = []; $('#p-quit').textContent = j.meldung || j.fehler; lade();
    });
  });
})();

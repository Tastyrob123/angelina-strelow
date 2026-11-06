/* Tischkarten & Menü · Prüfseite (R23): läuft ohne das Werkzeug. */
(function () {
  'use strict';
  var T = window.TI, H = window.WO_HAUS;
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  document.getElementById('kopf').innerHTML = WO.kopf({ werkzeug: 'tisch', unter: 'Drucksachen', titel: 'Prüfung', stand: 'Läuft ohne das Werkzeug', pruefung: 'pruefung.html', anleitung: 'anleitung.html', website: '/angelina-strelow/website/index.html', markeHref: './' });
  document.getElementById('rand').innerHTML = WO.rand([{ eintraege: [{ text: 'Zum Werkzeug', href: './' }] }, { titel: 'Auf dieser Seite', eintraege: [{ text: 'Was geprüft wird', href: '#liste' }, { text: 'Reparieren', href: '#reparieren' }, { text: 'Lexikon', href: '#lexikon' }] }], { anleitung: 'anleitung.html' });
  document.getElementById('sb').innerHTML = WO.startbild({ werkzeug: 'tisch', art: 'buehne', h1: 'Prüfung <em>Tischkarten &amp; Menü</em>', satz: 'Browser, Server, Daten, Sicherungen, Schriften, das PDF-Werkzeug und die Fotos, jedes für sich geprüft.' });

  var LEX = [
    ['KONFLIKT', 'Nicht gespeichert: «Inzwischen hat ein anderes Fenster gespeichert.»', 'Das Werkzeug ist in zwei Fenstern offen, oder ein anderes Werkzeug hat gerade gespeichert. Damit nichts überschrieben wird, lehnt der Server ab.', 'Nichts tun: Das Werkzeug lädt den neuen Stand. «Meine Eingaben wieder einsetzen» holt deine Änderungen zurück, dann noch einmal speichern.'],
    ['GROESSE', 'Nicht gespeichert: «Das ist zu viel auf einmal.»', 'Ein einzelner Text ist sehr lang (mehrere tausend Zeichen) oder sehr viele Abende wurden auf einmal geändert.', 'Den langen Text kürzen und noch einmal speichern.'],
    ['ABEND', '«Diesen Abend gibt es nicht mehr.»', 'Der Abend wurde in «Anfragen & Angebote» entfernt, während er hier offen war.', 'Zur Übersicht gehen. Die Drucksachen anderer Abende sind unberührt.'],
    ['NAME', '«Diesen Bereich gibt es nicht.»', 'Eine Adresse wurde von Hand verändert.', 'Das Werkzeug neu öffnen.'],
    ['WEG', '«Diesen Weg gibt es nicht.»', 'Eine Adresse wurde von Hand verändert oder der Server ist eine alte Fassung.', 'Das Werkzeug neu öffnen; hilft das nicht, den Server neu starten.'],
    ['FORMAT', '«Die Eingabe kam unvollständig an.»', 'Die Verbindung brach während des Speicherns ab.', 'Noch einmal speichern. Deine Eingaben stehen noch da.'],
    ['HERKUNFT', '«Nur von diesem Rechner aus.»', 'Eine Seite von ausserhalb wollte speichern. Das lässt der Server nicht zu.', 'Das Werkzeug nur über 127.0.0.1 öffnen.'],
    ['VERBINDUNG', 'Nicht gespeichert: «Der Server antwortet gerade nicht.»', 'Der Server ist beendet oder der Rechner hat die Verbindung kurz verloren. Deine Eingaben stehen noch im Fenster.', 'Fenster offen lassen, den Server starten (python3 serve.py 8853 im Ordner _werkzeuge), dann noch einmal speichern.'],
    ['SERVER', '«Etwas ist schiefgegangen. Die Daten sind unverändert.»', 'Ein unerwarteter Fehler im Server. Der letzte gute Stand liegt als Sicherung daneben.', 'Noch einmal versuchen. Bleibt es, den Server neu starten und diese Seite öffnen.'],
    ['VERLAUF', '«Diese Fassung gibt es nicht mehr.»', 'Der Verlauf behält die letzten 80 Fassungen; ältere werden verdrängt.', 'Eine neuere Fassung oder den ursprünglichen Stand holen.'],
    ['STATUS', '«Diesen Stand gibt es nicht.»', 'Ein Werkzeug wollte einen Abend auf einen unbekannten Stand setzen.', 'Nichts tun; dieses Werkzeug setzt den Stand nicht.'],
    ['PDF', 'Das PDF entsteht nicht: «Das PDF-Werkzeug lädt nicht.»', 'Die Dateien lib/pdf-lib.min.js oder lib/fontkit.umd.min.js sind nicht erreichbar.', 'Diese Seite zeigt unter «PDF-Werkzeug», ob sie laden. Server neu starten.'],
    ['BILD', '«Das Bild ist nicht entstanden.»', 'Der Browser konnte die Seite nicht als Bild rechnen, meist weil das Blatt sehr gross ist (A3) und der Speicher knapp wird.', 'Noch einmal versuchen oder das PDF nehmen; für den Gastgeber reicht auch eine kleinere Drucksache als Bild.'],
    ['BEISPIEL', '«Noch nicht druckfertig: Auf diesem Blatt stehen noch Beispiele.»', 'Gerichte, Weine, Ablauf oder Gäste stehen noch nicht im Abendplan; das Werkzeug zeigt bis dahin ein beschriftetes Beispiel, damit das Blatt nicht leer ist. Beispiele gehen nie in den Druck.', 'Im Abendplan die fehlenden Angaben eintragen, dann hier neu laden. Oder die Zeilen auf diesem Blatt von Hand überschreiben oder ausblenden.'],
    ['SCHRIFT', '«Die Druckschrift … lädt nicht.»', 'Eine Datei im Ordner schrift/ fehlt oder ist beschädigt.', 'Unter «Druckschriften» nachsehen, welche fehlt.'],
    ['START', '«Tischkarten & Menü startet nicht.»', 'Nach 12 Sekunden waren die Daten nicht da, meist weil der Server nicht läuft.', 'Server starten: python3 serve.py 8853 im Ordner _werkzeuge, dann neu laden.']
  ];
  document.getElementById('lex').innerHTML = LEX.map(function (l) { return '<article id="' + l[0] + '"><h3>' + l[0] + '</h3><dl><dt>Sehen</dt><dd>' + esc(l[1]) + '</dd><dt>Grund</dt><dd>' + esc(l[2]) + '</dd><dt>Tun</dt><dd>' + esc(l[3]) + '</dd></dl></article>'; }).join('');

  var liste = document.getElementById('liste');
  function zeile(id, titel) { var d = document.createElement('div'); d.className = 'pr-zeile'; d.id = 'p-' + id; d.innerHTML = '<i></i><div><b>' + esc(titel) + '</b><span>wird geprüft …</span></div>'; liste.appendChild(d); return d; }
  function setze(d, stufe, text) { d.className = 'pr-zeile ' + stufe; d.querySelector('span').textContent = text; }
  async function pruef(id, titel, fn) { var d = zeile(id, titel); try { var r = await fn(); setze(d, r[0], r[1]); } catch (e) { setze(d, 'rot', e.message || String(e)); } }
  var json = function (u) { return fetch(u, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(u + ' antwortet ' + r.status); return r.json(); }); };

  pruef('browser', 'Browser', async function () {
    var fehlt = [];
    try { localStorage.setItem('ti-probe', '1'); localStorage.removeItem('ti-probe'); } catch (e) { fehlt.push('Browser-Speicher (privates Fenster?)'); }
    if (!window.fetch) fehlt.push('fetch'); if (!document.fonts) fehlt.push('Schriften laden');
    if (!document.createElement('canvas').getContext) fehlt.push('Zeichenfläche'); if (!window.PointerEvent) fehlt.push('Ziehen mit Maus und Finger');
    return fehlt.length ? ['gelb', 'Es fehlt: ' + fehlt.join(', ') + '. Ansehen geht, Speichern im Browser nicht.'] : ['gut', 'Alles da, was das Werkzeug braucht (' + navigator.userAgent.replace(/^.*?(Firefox|Edg|Chrome|Version)\/(\d+).*$/, '$1 $2').replace('Version', 'Safari') + ').'];
  });
  var abende;
  pruef('server', 'Server und Daten', async function () {
    var t0 = performance.now(), d = await json('/angelina-strelow/werkzeuge/api/abende'); abende = d.abende;
    var ms = Math.round(performance.now() - t0);
    return ['gut', d.abende.length + ' Abende geladen in ' + ms + ' ms. Stand der Drucksachen: ' + (d.etag.tisch || '–') + '.'];
  });
  pruef('teil', 'Drucksachen der Abende', async function () {
    var t = await json('/angelina-strelow/werkzeuge/api/teil/tisch'), k = await json('/angelina-strelow/werkzeuge/api/teil/kern'), probleme = [], n = 0;
    Object.keys(t.daten).forEach(function (id) {
      n++; var z = t.daten[id];
      if (!k.daten[id]) probleme.push(id + ': kein Abend dazu');
      if (z.stil && !T.STILE[z.stil]) probleme.push(id + ': unbekannte Gestaltung «' + z.stil + '»');
      Object.keys(z.stuecke || {}).forEach(function (s) { if (!T.STUECKE[s]) probleme.push(id + ': unbekannte Drucksache «' + s + '»'); else if (z.stuecke[s].format && T.STUECKE[s].formate.indexOf(z.stuecke[s].format) < 0) probleme.push(id + ': Format «' + z.stuecke[s].format + '» passt nicht zu ' + T.STUECKE[s].name); });
    });
    return probleme.length ? ['gelb', probleme.join(' · ')] : ['gut', n + ' Abende mit eigener Gestaltung, alle gültig.'];
  });
  pruef('verlauf', 'Sicherungen und frühere Fassungen', async function () {
    var v = await json('/angelina-strelow/werkzeuge/api/verlauf/tisch');
    return ['gut', v.fassungen.length ? v.fassungen.length + ' frühere Fassungen, die neueste vom ' + v.fassungen[0].replace(/^tisch-(\d{4})(\d\d)(\d\d)-(\d\d)(\d\d).*$/, '$3.$2.$1, $4:$5 Uhr') + '.' : 'Noch keine: Sie entstehen mit jedem Speichern. Der ursprüngliche Stand ist immer da.'];
  });
  pruef('plan', 'Daten aus dem Abendplan', async function () {
    while (!abende) await new Promise(function (r) { setTimeout(r, 50); });
    var mit = abende.filter(function (a) { return a.plan && (a.plan.gaenge || a.plan.gaeste); }).length;
    return [mit ? 'gut' : 'gelb', mit ? mit + ' Abende lesen Gänge, Weine und Gäste aus dem Abendplan; die übrigen zeigen ein Beispiel.' : 'Der Abendplan führt noch keine Gänge und Gäste. Bis dahin zeigt das Werkzeug beschriftete Beispiele.'];
  });
  pruef('schrift', 'Druckschriften', async function () {
    var r = [];
    for (var k in T.SCHRIFT) { var s = T.SCHRIFT[k], res = await fetch(s.datei); if (!res.ok) throw new Error(s.name + ' fehlt (' + s.datei + ')'); var b = await res.arrayBuffer(); var f = new FontFace('PR-' + k, b); await f.load(); r.push(s.name + ' ' + Math.round(b.byteLength / 1024) + ' KB'); }
    return ['gut', r.join(' · ') + '. Feste TrueType-Schnitte, eingebettet im PDF.'];
  });
  pruef('pdf', 'PDF-Werkzeug', async function () {
    for (var src of ['lib/pdf-lib.min.js', 'lib/fontkit.umd.min.js']) await new Promise(function (ok, nein) { var s = document.createElement('script'); s.src = src; s.addEventListener('load', ok, { once: true }); s.addEventListener('error', function () { nein(new Error(src + ' lädt nicht')); }, { once: true }); document.head.appendChild(s); });
    var p = await PDFLib.PDFDocument.create(); p.addPage([100, 100]); var b = await p.save();
    return ['gut', 'pdf-lib und fontkit geladen, Probe-PDF mit ' + b.length + ' Bytes entstanden.'];
  });
  pruef('zeichen', 'Zeichen und Fotos', async function () {
    var z = window.TI_ZEICHEN && TI_ZEICHEN.wortmarke; if (!z || !z.pfade.length) throw new Error('Die Wortmarke fehlt (zeichen.js).');
    var fotos = Object.values(T.BILD_ABEND).concat(Object.values(T.STUECKE).map(function (s) { return s.bild; })), fehlt = [];
    await Promise.all(fotos.map(function (k) { return new Promise(function (ok) { var i = new Image(); i.addEventListener('load', ok, { once: true }); i.addEventListener('error', function () { fehlt.push(k); ok(); }, { once: true }); i.src = '/angelina-strelow/werkzeuge/assets/bild/' + k + '-640.webp'; }); }));
    return fehlt.length ? ['rot', 'Fotos fehlen: ' + fehlt.join(', ')] : ['gut', 'Wortmarke als Vektor da, ' + fotos.length + ' Fotos der Listen erreichbar.'];
  });
  pruef('fehler', 'Fehler im Browser', async function () {
    var l = []; try { l = JSON.parse(localStorage.getItem('angelina-tisch-fehler') || '[]'); } catch (e) { /* leer */ }
    document.getElementById('fehler').textContent = l.length ? l.map(function (f) { return f.zeit.replace('T', ' ').slice(0, 19) + '  ' + f.seite + '\n  ' + f.text + (f.wo ? '\n  ' + f.wo : ''); }).join('\n\n') : 'Keine Fehler mitgeschrieben.';
    return l.length ? ['gelb', l.length + ' Fehler mitgeschrieben, der letzte: ' + l[l.length - 1].text.slice(0, 120)] : ['gut', 'Keine Fehler mitgeschrieben.'];
  });

  var zuletzt = null;
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-rep]'); if (!b) return;
    var st = document.getElementById('rep-stand');
    if (zuletzt !== b || e.detail < 2) { zuletzt = b; st.textContent = 'Zum Ausführen doppelklicken: ' + b.textContent.trim() + '.'; return; }
  });
  document.addEventListener('dblclick', async function (e) {
    var b = e.target.closest('[data-rep]'); if (!b) return;
    var st = document.getElementById('rep-stand'), r = b.dataset.rep;
    try {
      if (r === 'sichern') { var t = await json('/angelina-strelow/werkzeuge/api/teil/tisch'); var url = URL.createObjectURL(new Blob([JSON.stringify(t.daten, null, 1)], { type: 'application/json' })); var a = document.createElement('a'); a.href = url; a.download = 'tischkarten-und-menue-' + new Date().toISOString().slice(0, 10) + '.json'; document.body.appendChild(a); a.click(); a.remove(); st.textContent = 'Gesichert: alle Drucksachen als Datei.'; }
      if (r === 'fehler') { localStorage.removeItem('angelina-tisch-fehler'); document.getElementById('fehler').textContent = 'Keine Fehler mitgeschrieben.'; setze(document.getElementById('p-fehler'), 'gut', 'Keine Fehler mitgeschrieben.'); st.textContent = 'Die Fehlerliste ist leer.'; }
      if (r === 'rundgang') { localStorage.removeItem('angelina-tisch-rundgang'); st.textContent = 'Der Rundgang erscheint beim nächsten Öffnen des Werkzeugs.'; }
      if (r === 'ansicht') { localStorage.removeItem('angelina-tisch-ansicht'); st.textContent = 'Das Werkzeug öffnet beim nächsten Mal mit der Übersicht.'; }
    } catch (x) { st.textContent = 'Nicht gelungen: ' + x.message; }
  });
})();

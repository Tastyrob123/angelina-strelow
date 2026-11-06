/* Prüfseite von «Nach dem Abend» (pruefung.html, Kopie der Prüfseite des Gästebuchs): eigenes Skript, weil die Website online keine eingebetteten Skripte zulässt (CSP). */
(function () {
  var LEX = {
    ABEND: ['«Diesen Abend gibt es nicht mehr.»', 'Der Abend wurde in einem anderen Werkzeug gelöscht.', 'Neu laden. Die Liste zeigt dann den aktuellen Stand.'],
    KONFLIKT: ['«In einem anderen Fenster wurde gespeichert.»', 'Zwei Fenster haben dieselben Daten offen; das andere hat zuerst gespeichert. Nichts wurde überschrieben.', 'Das Werkzeug lädt neu, deine gelben Eingaben bleiben stehen. Kurz nachsehen, dann noch einmal speichern. «Rückgängig» führt danach zu dem Stand, den das andere Fenster gespeichert hat; speichert ein anderes Fenster nach dir, geht «Rückgängig» nicht mehr, ein früherer Stand liegt unter «Frühere Fassungen».'],
    FOTO: ['Ein Foto liess sich nicht hinzufügen oder fehlt.', 'Die Datei ist kein Foto (JPEG, PNG, WebP), kleiner als 900 Pixel an der langen Seite, über 40 MB, oder liegt nicht mehr im Datenordner.', 'Ein anderes Foto nehmen. Fehlt ein gespeichertes Foto, zeigt es die Liste oben; das Foto beim Abend entfernen und neu hinzufügen.'],
    DRUCK: ['Die PDF liess sich nicht setzen.', 'Auf dem Rechner fehlt node mit Chromium (Playwright), oder der Satz brauchte über zwei Minuten.', '«Drucken» nehmen: das Druckfenster des Browsers setzt dieselben Seiten, «Als PDF sichern» geht dort auch.'],
    FRAGEBOGEN: ['Der Gastgeber sieht «Dieser Link passt nicht.»', 'Der Link ist alt (ein neuer wurde angelegt) oder unvollständig kopiert.', 'Unter «Stimme einholen» den Link neu kopieren und noch einmal schicken.'],
    ANFRAGE: ['«Name und eine gültige E-Mail fehlen noch.»', 'Für eine Anfrage aus einer Empfehlung braucht es eine E-Mail.', 'Bei der Empfehlung «Ändern» und die E-Mail eintragen.'],
    STATUS: ['«Diesen Stand gibt es nicht.»', 'Beim Abschliessen kam ein unbekannter Stand an.', 'Neu laden und noch einmal abschliessen.'],
    GROESSE: ['«Das ist zu viel auf einmal.»', 'Mehr als 4 MB in einer Anfrage, etwa sehr viele Fotos in einem Abend.', 'Fotos einzeln hinzufügen; ein Foto wird ohnehin auf 1600 Pixel verkleinert.'],
    FORMAT: ['«Die Eingabe kam unvollständig an.»', 'Das Netz war kurz weg.', 'Noch einmal versuchen. Eingaben bleiben stehen.'],
    HERKUNFT: ['«Nur von diesem Rechner aus.»', 'Die Anfrage kam nicht vom Werkzeug selbst (fremde Seite, fremdes Gerät).', 'Das Werkzeug direkt unter 127.0.0.1 öffnen.'],
    DATEI: ['Eine Datei ist beschädigt oder nicht beschreibbar.', 'Datenordner voll, gesperrt, oder eine Datei liess sich nicht lesen.', 'Unten «Letzte gute Fassung zurückholen». Hilft das nicht: Robert melden, mit Uhrzeit.'],
    WEG: ['«Diesen Weg gibt es nicht.»', 'Eine alte Adresse oder ein Tippfehler.', 'Das Werkzeug über seine Adresse öffnen.'],
    SKRIPT: ['Der Browser hat Fehler mitgeschrieben.', 'Ein Skript ist an einer Stelle gestolpert. Die Liste unten sagt wo.', 'Neu laden. Wiederholt es sich: Liste an Robert, danach «Fehlerliste leeren».'],
    VERBINDUNG: ['«Keine Verbindung.»', 'Der Server ist nicht gestartet, oder das Netz war kurz weg. Eingaben bleiben stehen.', 'Server starten (python3 serve.py 8854 im Ordner _werkzeuge) und neu laden.'],
    SERVER: ['Fehler im Server.', 'Etwas Unerwartetes; die Daten sind unverändert.', 'Neu laden. Wiederholt es sich: Meldung mit Uhrzeit an Robert.'],
    ANMELDUNG: ['Keine Anmeldung vor dem Werkzeug.', 'So gewollt bis zur Auslieferung (Robert 15.10.2026).', 'Vor der Auslieferung: Anmeldung mit Passwort davorsetzen.']
  };
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  $('#lex').innerHTML = Object.keys(LEX).map(function (k) { var e = LEX[k]; return '<article id="' + k + '"><h3>' + k + '</h3><p><b>Sehen</b> ' + esc(e[0]) + '</p><p><b>Grund</b> ' + esc(e[1]) + '</p><p><b>Tun</b> ' + esc(e[2]) + '</p></article>'; }).join('');
  if (location.hash) { var z = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (z) z.scrollIntoView(); }

  function browser() {
    var p = [], ls = true;
    try { localStorage.setItem('__p', '1'); localStorage.removeItem('__p'); } catch (e) { ls = false; }
    p.push({ gruppe: 'Browser', was: 'Speicher im Browser', stand: ls ? 'gut' : 'gelb', text: ls ? 'vorhanden (letzte Ansicht, gesehener Rundgang)' : 'gesperrt (privates Fenster?): die letzte Ansicht wird nicht gemerkt' });
    var mod = !!(window.fetch && window.Promise && window.CSS && CSS.supports && CSS.supports('display', 'grid'));
    p.push({ gruppe: 'Browser', was: 'Browser kann das Werkzeug', stand: mod ? 'gut' : 'rot', text: mod ? navigator.userAgent.replace(/^Mozilla\/5\.0 /, '').slice(0, 90) : 'zu alt: bitte Safari, Chrome, Edge oder Firefox in neuer Fassung', stichwort: mod ? '' : 'SERVER' });
    return p;
  }
  function zeichne(p) {
    var gr = '', h = '';
    p.forEach(function (x) {
      if (x.gruppe !== gr) { gr = x.gruppe; h += '<div class="gr">' + esc(gr) + '</div>'; }
      h += '<div class="z ' + esc(x.stand) + '"><i></i><b>' + esc(x.was) + '</b><span>' + esc(x.text) + '</span>' + (x.stichwort ? '<a href="#' + esc(x.stichwort) + '">' + esc(x.stichwort) + '</a>' : '<span></span>') + '</div>';
    });
    $('#punkte').innerHTML = h;
    var rot = p.filter(function (x) { return x.stand === 'rot'; }).length;
    $('#satz').textContent = rot ? rot + (rot === 1 ? ' Punkt braucht' : ' Punkte brauchen') + ' Aufmerksamkeit. Das Stichwort rechts führt zur Erklärung.' : 'Alles in Ordnung. Gelb heisst: bewusst so, kein Fehler.';
  }
  function fehlerListe(server) {
    var lokal = [];
    try { lokal = JSON.parse(localStorage.getItem('nachher-fehler') || '[]').reverse(); } catch (e) { }
    var alle = lokal.map(function (x) { return { zeit: x.zeit, text: x.text, wo: 'dieser Browser' }; }).concat((server || []).map(function (x) { return { zeit: x.zeit, text: x.text, wo: 'Server-Protokoll' }; }));
    $('#fehler').innerHTML = alle.length ? alle.slice(0, 40).map(function (x) { return '<li><time>' + esc(new Date(x.zeit).toLocaleString('de-DE')) + '</time>' + esc(x.text) + ' <small>(' + esc(x.wo) + ')</small></li>'; }).join('') : '<li>Keine Fehler mitgeschrieben.</li>';
  }
  function pruefe() {
    var p = browser();
    fetch('api/zustand', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { zeichne(p.concat(d.punkte)); fehlerListe((d.fehler || []).map(function (z) { try { var j = JSON.parse(z); return { zeit: j.zeit || '', text: j.text || z }; } catch (e) { return { zeit: '', text: z }; } })); })
      .catch(function () { p.push({ gruppe: 'Server', was: 'Server-Teil läuft', stand: 'rot', text: 'antwortet nicht', stichwort: 'VERBINDUNG' }); zeichne(p); fehlerListe([]); });
  }
  $('#neu').onclick = pruefe;
  document.querySelectorAll('[data-rep]').forEach(function (b) {
    var text = b.textContent, t = 0;
    b.onclick = function () {
      if (!b.classList.contains('scharf')) { b.classList.add('scharf'); b.textContent = 'Wirklich? Noch einmal klicken'; clearTimeout(t); t = setTimeout(function () { b.classList.remove('scharf'); b.textContent = text; }, 4000); return; }
      clearTimeout(t); b.classList.remove('scharf');
      if (b.dataset.rep === 'fehler') {
        try { localStorage.removeItem('nachher-fehler'); } catch (e) { }
        fetch('api/reparatur', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ was: 'fehler' }) }).finally(function () { b.textContent = 'Geleert'; setTimeout(function () { b.textContent = text; }, 2000); pruefe(); });
      } else if (b.dataset.rep === 'fotos') {
        fetch('api/reparatur', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ was: 'fotos' }) }).then(function (r) { return r.json(); })
          .then(function (d) { b.textContent = d.fehler ? String(d.fehler).replace(/^[A-ZÄÖÜ]+ · /, '') : d.meldung; setTimeout(function () { b.textContent = text; }, 4000); pruefe(); });
      } else if (b.dataset.rep === 'sicherung') {
        fetch('api/reparatur', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ was: 'sicherung' }) }).then(function (r) { return r.json(); })
          .then(function (d) { b.textContent = d.fehler ? String(d.fehler).replace(/^[A-ZÄÖÜ]+ · /, '') : 'Zurückgeholt'; setTimeout(function () { b.textContent = text; }, 3500); pruefe(); });
      } else {
        try { Object.keys(localStorage).forEach(function (k) { if (/^nachher-|^rundgang-an-/.test(k)) localStorage.removeItem(k); }); sessionStorage.clear(); } catch (e) { }
        b.textContent = 'Zurückgesetzt'; setTimeout(function () { b.textContent = text; }, 2000);
      }
    };
  });
  pruefe();
})();

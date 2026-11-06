/* Prüfseite von Anfragen & Angebote (pruefung.html, Kopie aus dem Gästebuch des Culinarium): eigenes Skript, weil die Website online keine eingebetteten Skripte zulässt (CSP). */
(function () {
  var LEX = {
    KONFLIKT: ['«Inzwischen hat ein anderes Fenster gespeichert.»', 'Zwei Fenster (oder ein anderes Werkzeug, etwa der Abendplan) haben denselben Bereich geändert; das andere war zuerst. Nichts wurde überschrieben.', 'Die Seite holt den neuen Stand von selbst, deine Eingabe bleibt stehen. Was das andere Fenster an anderer Stelle geändert hat, steht schon bei dir. Bei demselben Feld nennt die Meldung den Wert dort, bei einem Text den Teil, der dort anders lautet; «Beides behalten» setzt ihn in deinen Text, an derselben Stelle als ganzen Satz nach deinem. Dann noch einmal speichern.'],
    ANFRAGE: ['«Name und eine gültige E-Mail fehlen noch.»', 'Eine neue Anfrage braucht einen Namen und einen Weg, dir zu antworten.', 'Namen und E-Mail oder Telefon eintragen. Ohne E-Mail legt das Werkzeug die Anfrage trotzdem an.'],
    ABEND: ['«Diesen Abend gibt es nicht mehr.»', 'Er wurde in einem anderen Fenster gelöscht.', 'Neu laden.'],
    STATUS: ['«Diesen Stand gibt es nicht.»', 'Ein Abend sollte auf eine Station gesetzt werden, die es nicht gibt.', 'Neu laden und noch einmal; wiederholt es sich, Robert melden.'],
    ANGEBOT: ['«Im Angebot steht noch keine Leistung.»', 'Ein leeres Angebot lässt sich nicht als PDF setzen.', 'Im Angebot mindestens die Begleitung des Abends und eine Leistung wählen.'],
    DRUCK: ['Das PDF entsteht nicht auf dem Rechner, sondern im Druckfenster.', 'Auf dem Rechner fehlt Chromium (Playwright), oder der Satz brauchte zu lange.', 'Im Druckfenster «Als PDF sichern» wählen; das Blatt ist dasselbe. Bleibt es so, Robert melden.'],
    BEISPIEL: ['Preisliste, Textbausteine oder Einstellungen zeigen noch Startwerte.', 'Preise sind offen: bis du deine eigenen einträgst, sind alle Beträge Beispiele.', 'Unter «Preisliste» jeden Posten mit «Ändern» auf deinen Preis setzen. Danach ist der Punkt grün.'],
    LEER: ['Noch kein Abend.', 'Im Datenordner liegt noch keine Anfrage.', 'Nichts zu tun. Sobald jemand anfragt oder du eine Anfrage von Hand anlegst, steht sie im Eingang.'],
    WAISE: ['Ein Angebot ohne Abend.', 'Der Abend wurde gelöscht, sein Angebot blieb liegen.', 'Nichts zu tun, es stört nicht. Robert kann es beim nächsten Aufräumen entfernen.'],
    GROESSE: ['«Das ist zu viel auf einmal.»', 'Mehr als 4 MB in einem Schritt.', 'Text kürzen oder in zwei Schritten speichern.'],
    FORMAT: ['«Die Eingabe kam unvollständig an.»', 'Die Verbindung brach mitten im Speichern ab.', 'Noch einmal speichern; deine Eingabe ist noch da.'],
    NAME: ['«Diesen Bereich gibt es nicht.»', 'Ein Weg mit falschem Namen wurde aufgerufen.', 'Neu laden. Wiederholt es sich, Robert melden.'],
    VERLAUF: ['«Diese Fassung gibt es nicht.»', 'Die frühere Fassung wurde inzwischen weggeräumt (es bleiben die letzten 80).', 'Eine andere Fassung wählen oder den ursprünglichen Stand.'],
    BROWSER: ['Unten stehen Fehler, die der Browser mitgeschrieben hat.', 'Ein Skript im Werkzeug ist auf etwas Unerwartetes gestossen.', 'Mit Uhrzeit an Robert melden; danach «Fehlerliste leeren».'],
    HERKUNFT: ['«Nur von diesem Rechner aus.»', 'Die Anfrage kam nicht vom Werkzeug selbst (fremde Seite, fremdes Gerät).', 'Das Werkzeug direkt öffnen, unter 127.0.0.1.'],
    VERBINDUNG: ['«Keine Verbindung zum Server.»', 'Der gemeinsame Server ist nicht gestartet, oder das Netz war kurz weg.', 'Server starten (python3 serve.py 8851 im Ordner _werkzeuge) und neu laden.'],
    SERVER: ['Fehler im Server.', 'Etwas Unerwartetes; der genaue Grund steht in der Meldung. Die Daten sind unverändert.', 'Neu laden. Wiederholt es sich: Meldung mit Uhrzeit an Robert.'],
    WEG: ['«Diesen Weg gibt es nicht.»', 'Ein Knopf zeigt auf einen Weg, den der Server nicht kennt.', 'Neu laden; wiederholt es sich, Robert melden.'],
    ANMELDUNG: ['Keine Anmeldung vor dem Werkzeug.', 'So gewollt bis zur Übergabe an Angelina (Robert 15.10.2026).', 'Vor der Übergabe: Anmeldung mit Passwort davorsetzen.']
  };
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  $('#lex').innerHTML = Object.keys(LEX).map(function (k) { var e = LEX[k]; return '<article id="' + k + '"><h3>' + k + '</h3><p><b>Sehen</b> ' + esc(e[0]) + '</p><p><b>Grund</b> ' + esc(e[1]) + '</p><p><b>Tun</b> ' + esc(e[2]) + '</p></article>'; }).join('');
  if (location.hash) { var z = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (z) z.scrollIntoView(); }

  function browser() {
    var p = [], ls = true;
    try { localStorage.setItem('__p', '1'); localStorage.removeItem('__p'); } catch (e) { ls = false; }
    p.push({ gruppe: 'Browser', was: 'Speicher im Browser', stand: ls ? 'gut' : 'gelb', text: ls ? 'vorhanden (letzte Ansicht, Rundgang)' : 'gesperrt (privates Fenster?): Name und Ansicht werden nicht gemerkt' });
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
    try { lokal = JSON.parse(localStorage.getItem('anfragen-fehler') || '[]').reverse(); } catch (e) { }
    var alle = lokal.map(function (x) { return { zeit: x.zeit, text: x.text, wo: 'dieser Browser' }; }).concat((server || []).map(function (x) { var o = {}; try { o = JSON.parse(x); } catch (e) { o = { text: x }; } return { zeit: o.zeit || '', text: o.text || x, wo: 'Server-Protokoll' }; }));
    $('#fehler').innerHTML = alle.length ? alle.slice(0, 40).map(function (x) { return '<li><time>' + esc(x.zeit ? new Date(x.zeit).toLocaleString('de-DE') : '') + '</time>' + esc(x.text) + ' <small>(' + esc(x.wo) + ')</small></li>'; }).join('') : '<li>Keine Fehler mitgeschrieben.</li>';
  }
  function pruefe() {
    var p = browser();
    fetch('api/zustand', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { zeichne(p.concat(d.punkte)); fehlerListe(d.fehler); })
      .catch(function () { p.push({ gruppe: 'Server', was: 'Gemeinsamer Server', stand: 'rot', text: 'antwortet nicht', stichwort: 'VERBINDUNG' }); zeichne(p); fehlerListe([]); });
  }
  $('#neu').onclick = pruefe;
  document.querySelectorAll('[data-rep]').forEach(function (b) {
    var text = b.textContent, t = 0;
    b.onclick = function () {
      if (!b.classList.contains('scharf')) { b.classList.add('scharf'); b.textContent = 'Wirklich? Noch einmal klicken'; clearTimeout(t); t = setTimeout(function () { b.classList.remove('scharf'); b.textContent = text; }, 4000); return; }
      clearTimeout(t); b.classList.remove('scharf');
      if (b.dataset.rep === 'fehler') {
        try { localStorage.removeItem('anfragen-fehler'); } catch (e) { }
        fetch('api/fehler_leeren', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).finally(function () { b.textContent = 'Geleert'; setTimeout(function () { b.textContent = text; }, 2000); pruefe(); });
      } else {
        try { Object.keys(localStorage).forEach(function (k) { if (/^anfragen-|^rundgang-an-/.test(k)) localStorage.removeItem(k); }); sessionStorage.clear(); } catch (e) { }
        b.textContent = 'Zurückgesetzt'; setTimeout(function () { b.textContent = text; }, 2000);
      }
    };
  });
  document.getElementById('export').onclick = function () {
    var b = this; b.textContent = 'Wird gepackt …';
    Promise.all(['/angelina-strelow/werkzeuge/api/abende', '/angelina-strelow/werkzeuge/api/sammlung/preise', '/angelina-strelow/werkzeuge/api/sammlung/vorlagen', '/angelina-strelow/werkzeuge/api/sammlung/einstellungen'].map(function (u) { return fetch(u, { cache: 'no-store' }).then(function (r) { return r.json(); }); }))
      .then(function (d) {
        var aus = { werkzeug: 'Anfragen & Angebote', zeit: new Date().toISOString(), abende: d[0].abende, preise: d[1].daten, textbausteine: d[2].daten, einstellungen: d[3].daten };
        var url = URL.createObjectURL(new Blob([JSON.stringify(aus, null, 1)], { type: 'application/json' })), a = document.createElement('a');
        a.href = url; a.download = 'Anfragen-und-Angebote-' + new Date().toISOString().slice(0, 10) + '.json'; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 30000); b.textContent = 'Heruntergeladen';
      }).catch(function () { b.textContent = 'Ging nicht, Server prüfen'; })
      .finally(function () { setTimeout(function () { b.textContent = 'Alle Daten herunterladen'; }, 2500); });
  };
  pruefe();
})();

/* Tischkarten & Menü · Anleitung: Rahmen und die Liste der Drucksachen aus stile.js (eine Quelle) */
(function () {
  var T = window.TI, esc = WO.esc;
  document.getElementById('kopf').innerHTML = WO.kopf({ werkzeug: 'tisch', unter: 'Drucksachen', titel: 'Anleitung', stand: 'Was, wozu und wie', pruefung: 'pruefung.html', anleitung: 'anleitung.html', website: '/angelina-strelow/website/index.html', markeHref: './' });
  document.getElementById('rand').innerHTML = WO.rand([{ eintraege: [{ text: 'Zum Werkzeug', href: './' }] }, { titel: 'Anleitung', eintraege: [{ text: 'Wozu', href: '#wozu' }, { text: 'Die Mappe', href: '#mappe' }, { text: 'So entsteht eine Mappe', href: '#ablauf' }, { text: 'Druckprüfung', href: '#pruefen' }, { text: 'Frühere Fassungen', href: '#fassungen' }, { text: 'Wenn etwas hakt', href: '#hakt' }] }], { pruefung: 'pruefung.html' });
  document.getElementById('sb').innerHTML = WO.startbild({ werkzeug: 'tisch', art: 'buehne', foto: '/angelina-strelow/werkzeuge/assets/bild/festtafel-1000.webp', h1: 'Anleitung <em>Tischkarten &amp; Menü</em>', satz: esc(WO.haus.saetze.tisch), knoepfe: WO.knopf('Zum Werkzeug', 'rechts', 'gold', { href: './' }) + WO.knopf('Rundgang', 'pfeil', 'glas', { href: './?rundgang' }) });
  document.getElementById('arten').innerHTML = T.STUECK_REIHE.map(function (k) { var s = T.STUECKE[k]; return '<div><b>' + esc(s.lang) + '</b><small>' + s.formate.map(function (f) { return esc(T.FORMATE[f].name); }).join(' · ') + '</small><span>' + esc(s.satz) + '</span></div>'; }).join('');
})();

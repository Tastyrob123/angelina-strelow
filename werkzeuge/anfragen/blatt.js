/* Das Angebot als A4-Blatt in Angelinas Marke. Ein Satz für Vorschau im Werkzeug und PDF (blatt-pdf.html, blatt_pdf.js), damit beide gleich sind
   (Master 2.5: Daten statt Dokument). Neu gesetzt am 06.11.2026 nach Roberts «Das muss viel schöner aussehen»: Massstab Leistungsmappe und Briefbogen
   (beigaben/mappen, beigaben/drucksachen). Kopf wie der Briefbogen (Siegel mit Namen), Titel gross und zweifarbig in Della Respira, ein Foto von ihr mit ihrer
   Linie innen, die Leistungen gesetzt mit Bild, Preise in Della Respira, die Summe auf dunkler Tafel, Fuss mit ihrem Satz und Kontakt (Gestaltung in blatt.css).
   Nie fett, nie kursiv, Sperrung höchstens .08em (Fehlerbuch 10a, pdftotext). Keine Bearbeitungsspuren, kein «Beispiel» auf dem Blatt.
   Umbruch: Die Schrift wird nie kleiner; passt es nicht auf eine Seite, gehen die Bausteine sauber auf Folgeseiten mit kleinem Kopf und «Seite x von y» im Fuss.
   Summe und Unterschrift nie abgeschnitten (Prüfung 05.11.2026, Punkt 1). Emojis lässt das Blatt weg (Punkt 15: sonst Type 3 im PDF).
   Prüfung 2: Die Unterschrift steht nie allein auf einer Folgeseite, sie geht mit Abschluss und letzter Preiszeile (N2). Stünden nur «Euer Angebot» und ein, zwei
   Preiszeilen unten auf einer Seite, wandert das ganze Angebot auf die nächste (06.11.2026).
   Persönliche Zeile höchstens sechs, Unterschrift höchstens vier Zeilen (N4); passt trotzdem etwas nicht, meldet EINPASSEN ueberlauf statt still zu schneiden.
   Zwei Gastgeber (mehr: true) liest das Blatt mit «ihr» (N5).
   daten = { nr, ausgestellt, name, anlass, datum, ort, gaeste, beginn, stunden, posten:[{k,t,s,menge,einheit,preis,betrag}], summe, anzahlung, anzahlung_betrag,
             gueltig_bis, zeile, unterschrift, email, instagram, ust, mehr } */
(function () {
  'use strict';
  var TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  var MON = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  var EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{E0020}-\u{E007F}‍️⃣]/gu;
  function ohneEmoji(s) { return String(s == null ? '' : s).replace(EMOJI, '').replace(/[ \t]{2,}/g, ' ').replace(/ +([.,;:!?])/g, '$1'); }
  function esc(s) { return ohneEmoji(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function tag(iso, lang) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); if (!m) return '';
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return lang ? TAGE[d.getDay()] + ', ' + d.getDate() + '. ' + MON[d.getMonth()] + ' ' + d.getFullYear() : d.getDate() + '. ' + MON[d.getMonth()] + ' ' + d.getFullYear();
  }
  function geld(x) {
    if (x == null || isNaN(x)) return '';
    var s = (Math.round(x * 100) / 100).toFixed(2).split('.'), v = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (s[1] === '00' ? v : v + ',' + s[1]) + ' €';
  }
  function zahl(x) { return String(Math.round(x * 100) / 100).replace('.', ','); }
  function menge(p) {
    if (p.einheit === 'Stunde') return zahl(p.menge) + ' ' + (p.menge === 1 ? 'Stunde' : 'Stunden') + ' × ' + geld(p.preis);
    if (p.einheit === 'km') return p.menge ? zahl(p.menge) + ' km × ' + geld(p.preis) : '';
    if (p.einheit === 'Gast') return zahl(p.menge) + (p.menge === 1 ? ' Gast × ' : ' Gäste × ') + geld(p.preis);
    return '';
  }
  function betrag(p) {
    if (p.einheit === 'enthalten') return '<span class="ab-leise">enthalten</span>';
    if (p.einheit === 'auf Anfrage' || p.betrag == null) return '<span class="ab-leise">auf Anfrage</span>';
    if (p.einheit === 'km' && !p.betrag) return '<span class="ab-leise">enthalten</span>';
    return geld(p.betrag);
  }
  function zeilen(t) { return esc(t).replace(/\n/g, '<br>'); }
  /* Höchstens n Zeilen: mehrere Leerzeilen werden eine, was darüber hinausgeht, rückt mit Leerzeichen in die letzte Zeile */
  function hoechstens(t, n) {
    var z = ohneEmoji(t).replace(/\r/g, '').replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, '\n\n').replace(/^\s+|\s+$/g, '').split('\n');
    return z.length <= n ? z.join('\n') : z.slice(0, n - 1).concat(z.slice(n - 1).join(' ').replace(/\s+/g, ' ')).join('\n');
  }
  window.ANGEBOT_ZEILEN = { zeile: 6, unterschrift: 4 };
  window.ANGEBOT_HOECHSTENS = hoechstens;
  var UST = { offen: '', klein: 'Gemäss § 19 UStG wird keine Umsatzsteuer berechnet.', brutto: 'Alle Beträge enthalten 19 % Umsatzsteuer.' };
  /* Neues Blatt (06.11.2026, Robert: «Das muss viel schöner aussehen»): Kopf wie ihr Briefbogen (Siegel mit Namen), Titel gross und zweifarbig wie in der
     Leistungsmappe, ein echtes Foto von ihr mit ihrer Rahmenlinie, die Leistungen gesetzt mit Bild wie in der Mappe, Preise in Della Respira, die Summe
     auf dunklem Grund abgesetzt, Fuss mit ihrem Satz und Kontakt. Inhalt, Daten und Rechnung unverändert. */
  var MARKE = '<img class="ab-marke" src="/angelina-strelow/werkzeuge/assets/zeichen/ganz-berry.svg" width="3044" height="2193" alt="Angelina Strelow · Exklusive Gastgeberin">';
  var MARKE_KLEIN = '<img class="ab-marke" src="/angelina-strelow/werkzeuge/assets/zeichen/wortmarke-berry.svg" width="3044" height="660" alt="Angelina Strelow">';
  var FOTO = 'p152';   // Angelina im Smoking mit Fliege und Handschuhen, ein Abend in Bensberg (nur ihre Fotos)
  var LEIST_BILD = { empfang: 'empfang', betreuung: 'p140', ablauf: 'p158', wein: 'einschenken', details: 'kerzen' };   // wie die Posten der Preisliste
  var SATZ = 'Du lädst ein. Ich begleite den Abend.';
  /* Ihre Fotos als kleine JPEG eigens fürs Blatt (bilder/blatt/, aus _haus/bild): WebP bettet Chromium verlustfrei ein, das PDF wog so 3,9 MB statt rund 0,2 MB */
  var BILD = '/angelina-strelow/werkzeuge/anfragen/bilder/blatt/';

  function kontakt(d) { return [d.email, d.instagram ? 'Instagram ' + d.instagram : '', 'Köln und Umgebung'].filter(Boolean).map(esc).join('  ·  '); }
  function seite(d, folge, fluss) {
    return '<div class="ab-seite' + (folge ? ' ab-seite--folge' : '') + '"><div class="ab-rahmen"></div><div class="ab-inhalt">'
      + (folge ? '<header class="ab-kopf ab-kopf--klein">' + MARKE_KLEIN + '<p class="ab-zeile">Angebot für ' + esc(d.name || '') + '</p></header>' : '')
      + '<div class="ab-fluss">' + fluss + '</div>'
      + '<footer class="ab-fussz"><p class="ab-satz">' + SATZ + '</p><p class="ab-kontakt">' + kontakt(d) + '</p><p class="ab-seitenzahl"></p></footer></div></div>';
  }
  function zweifarbig(a, b) { return esc(a) + ' <em>' + esc(b) + '</em>'; }

  /* Alle Bausteine des Blatts in Lesereihenfolge; jeder Baustein bleibt ganz (nie über eine Seitengrenze geschnitten) */
  window.ANGEBOT_BLATT = function (d) {
    d = d || {};
    var ihr = !!d.mehr, zeile = hoechstens(d.zeile, 6), unter = hoechstens(d.unterschrift || 'Herzlich\nAngelina', 4);
    var p = d.posten || [], leist = p.filter(function (x) { return x.einheit === 'enthalten' && x.k !== 'anfahrt'; }), rest = p.filter(function (x) { return leist.indexOf(x) < 0; });
    var angaben = [['Anlass', d.anlass], ['Datum', tag(d.datum, true)], ['Ort', d.ort], ['Gäste', d.gaeste], ['Beginn', d.beginn ? d.beginn + ' Uhr' : ''], ['Dauer', d.stunden ? zahl(d.stunden) + (+d.stunden === 1 ? ' Stunde' : ' Stunden') : '']]
      .filter(function (x) { return x[1]; });
    var b = [];
    /* Vier Abschnitte, jeder ein ganzer Baustein, nie über eine Seite gebrochen (Robert, 06.11.2026, Fehlerbuch 10a): Eröffnung (Kopf, Titel, Foto, Angaben),
       Leistungen, Angebot mit Summe, Schluss. Die Seiten werden um sie herum gestaltet (gestalten). */
    b.push('<section class="ab-blk ab-eroeffnung"><header class="ab-kopf">' + MARKE + '</header>'
      + '<div class="ab-titel"><div class="ab-titel__text"><p class="ab-k">Angebot' + (d.nr ? ' · Fassung ' + esc(d.nr) : '') + (d.ausgestellt ? ' · ' + esc(tag(d.ausgestellt)) : '') + '</p>'
      + '<h1>' + (ihr ? 'Euer' : 'Dein') + ' Abend<em>für ' + esc(d.name || '') + '.</em></h1><span class="ab-strich"></span>'
      + (zeile ? '<p class="ab-persoenlich">' + zeilen(zeile) + '</p>' : '') + '</div>'
      + '<figure class="ab-foto"><img src="' + BILD + FOTO + '.jpg" width="720" height="900" alt="Angelina Strelow"></figure></div>'
      + '<dl class="ab-angaben' + (angaben.length > 3 ? ' ab-angaben--zwei' : '') + '">' + angaben.map(function (x) { return '<div><dt>' + x[0] + '</dt><dd>' + esc(x[1]) + '</dd></div>'; }).join('') + '</dl></section>');
    if (leist.length) b.push('<section class="ab-blk ab-leist"><h2>' + zweifarbig('Was ich für ' + (ihr ? 'euch' : 'dich'), 'übernehme.') + '</h2><ul>' + leist.map(function (x) {
      var bild = LEIST_BILD[x.k];
      return '<li>' + (bild ? '<span class="ab-leist__bild"><img src="' + BILD + bild + '.jpg" width="300" height="375" alt=""></span>' : '<span class="ab-leist__bild ab-leist__bild--leer"></span>') + '<span class="ab-leist__t"><b>' + esc(x.t) + '</b>' + (x.s ? '<span>' + esc(x.s) + '</span>' : '') + '</span></li>';
    }).join('') + '</ul></section>');
    var zeilenA = rest.map(function (x) { var m = menge(x); return '<div class="ab-pz"><div><span class="ab-t">' + esc(x.t) + '</span>' + (x.s || m ? '<span class="ab-s">' + esc([x.k === 'anfahrt' ? x.s : '', m].filter(Boolean).join(' · ') || x.s) + '</span>' : '') + '</div><div class="ab-z">' + betrag(x) + '</div></div>'; });
    if (leist.length) zeilenA.push('<div class="ab-pz"><div><span class="ab-t">' + (leist.length === 1 ? esc(leist[0].t) : 'Alles, was ich für ' + (ihr ? 'euch' : 'dich') + ' übernehme') + '</span><span class="ab-s">Im Abend enthalten</span></div><div class="ab-z"><span class="ab-leise">enthalten</span></div></div>');
    b.push('<section class="ab-blk ab-angebot"><h2 class="ab-mit">' + zweifarbig(ihr ? 'Euer' : 'Dein', 'Angebot.') + '</h2>' + zeilenA.join('')
      + '<div class="ab-abschluss"><div class="ab-tafel"><div class="ab-summe"><span>Gesamt</span><span class="ab-z">' + geld(d.summe) + '</span></div>'
      + (d.anzahlung ? '<div class="ab-anz"><span>Anzahlung bei Zusage (' + esc(zahl(d.anzahlung)) + ' %)</span><span class="ab-z">' + geld(d.anzahlung_betrag) + '</span></div>' : '') + '</div>'
      + '<p class="ab-gilt">' + (d.gueltig_bis ? 'Dieses Angebot gilt bis zum ' + esc(tag(d.gueltig_bis)) + '. ' : '') + (UST[d.ust] || '') + '</p></div></section>');
    /* Schlussblock (06.11.2026, Robert: «unten mit herzlich Angelina noch schön eine Unterschrift, noch ein Bild von ihr dazu, ihr Logo»): wie ein Brief von ihr.
       Gruss aus den Einstellungen, die letzte Zeile ist die Unterschrift: in Pinyon Script (ihre Schreibschrift laut Markenbuch, «Unterschrift») oder als Bild ihrer
       echten Unterschrift, wenn sie eines in den Einstellungen hinterlegt hat. Daneben ein Porträt mit ihrer Linie, ihr Siegel und ihr Satz. Der Block wächst in den
       freien Raum der letzten Seite (schlussRaum), nie leere Fläche über dem Gruss. */
    var zl = unter.split('\n'), name = zl.pop() || 'Angelina', gruss = zl.join('\n');
    b.push('<div class="ab-blk ab-unterschrift ab-schluss"><div class="ab-schluss__k">'
      + '<figure class="ab-schluss__foto"><img src="' + BILD + 'p158-gross.jpg" width="720" height="900" alt="Angelina Strelow"></figure>'
      + '<div class="ab-schluss__text"><img class="ab-schluss__siegel" src="/angelina-strelow/werkzeuge/assets/zeichen/siegel-berry.svg" width="691" height="956" alt="">'
      + (gruss ? '<p class="ab-unter">' + zeilen(gruss) + '</p>' : '')
      + (d.unterschrift_bild ? '<p class="ab-name ab-name--bild"><img src="' + esc(d.unterschrift_bild) + '" alt="' + esc(name) + '"></p>' : '<p class="ab-name">' + esc(name) + '</p>')
      + '<span class="ab-strich"></span><p class="ab-wer">Angelina Strelow · Exklusive Gastgeberin</p>'
      + '<p class="ab-schluss__satz">' + (ihr ? 'Euer' : 'Dein') + ' Abend. Mein Service.</p></div></div></div>');
    return '<div class="ab-blatt" data-name="' + esc(d.name || '') + '" data-kontakt="' + kontakt(d).replace(/"/g, '&quot;') + '">' + seite(d, false, b.join('')) + '</div>';
  };

  function ueber(fl) { return fl.scrollHeight > fl.clientHeight + 1; }
  function hat(x, k) { return x && x.classList && x.classList.contains(k); }
  /* Alle Masse unverkleinert (offsetTop/offsetHeight): Die Vorschau im Werkzeug ist mit transform verkleinert, getBoundingClientRect mass dort zu wenig
     und das Foto wuchs nur im PDF (Prüfung 7). Bezug ist .ab-inhalt, der gemeinsame offsetParent von Fluss und Abschnitten. */
  function belegt(fl) { var l = fl.lastElementChild; return l ? l.offsetTop + l.offsetHeight - fl.offsetTop : 0; }
  /* Der Schlussblock nimmt den freien Raum über sich, nie leere Fläche über dem Gruss: neben anderen Abschnitten wird das Porträt höher (ab 380 px auch breiter,
     höchstens 600 px); steht er allein auf der letzten Seite, wird er zur Schlussseite wie in der Mappe (Porträt über die ganze Breite, Gruss darunter) und füllt sie. */
  function schlussRaum(sch) {
    var fl = sch.parentNode, foto = sch.querySelector('.ab-schluss__foto'), vor = sch.previousElementSibling;
    var setz = function (h) { sch.style.setProperty('--sh', Math.round(h) + 'px'); };
    if (!vor) {
      sch.classList.add('ab-schluss--seite'); setz(300);
      setz(300 + fl.clientHeight - sch.offsetHeight - 2);   // ohne den automatischen Abstand oben
    } else {
      var h0 = foto.offsetHeight, frei = fl.clientHeight - belegt(fl) - 4; if (frei < 12) return;
      var h = Math.min(600, h0 + frei); if (h >= 380) sch.classList.add('ab-schluss--gross'); setz(h);
      for (var n = 0; n < 60 && ueber(fl) && h > h0; n++) { h -= 10; setz(h); if (h < 380) sch.classList.remove('ab-schluss--gross'); }
    }
    for (var m = 0; m < 60 && ueber(fl); m++) setz(foto.offsetHeight - 10);
  }
  /* Jede Seite frei um ihre Abschnitte gestaltet (Robert, 06.11.2026): was an Raum bleibt, nimmt der Abschnitt, der ihn tragen kann.
     Schluss: wächst (schlussRaum). Eröffnung allein: das Foto wird höher. Leistungen ohne Eröffnung: gesetzt wie die Mappenseite, grössere Bilder, eine Spalte.
     Angebot ohne Schluss: die Zeilen bekommen Luft. Was dann noch bleibt, verteilt sich zwischen den Abschnitten; nichts klebt oben mit leerer Fläche darunter. */
  var WEG = ['ab-schluss--gross', 'ab-schluss--seite', 'ab-leist--seite', 'ab-fluss--verteilt'];
  function zuruecksetzen(bl) {
    [].forEach.call(bl.querySelectorAll('.' + WEG.join(', .')), function (x) { WEG.forEach(function (k) { x.classList.remove(k); }); });
    [].forEach.call(bl.querySelectorAll('.ab-schluss, .ab-eroeffnung, .ab-leist, .ab-angebot'), function (x) { ['--sh', '--fh', '--lp', '--pp'].forEach(function (v) { x.style.removeProperty(v); }); });
  }
  function gestalten(fl) {
    var k = [].slice.call(fl.children), sch = k.filter(function (x) { return hat(x, 'ab-schluss'); })[0];
    var er = k.filter(function (x) { return hat(x, 'ab-eroeffnung'); })[0], le = k.filter(function (x) { return hat(x, 'ab-leist'); })[0], an = k.filter(function (x) { return hat(x, 'ab-angebot'); })[0];
    var frei = function () { return fl.clientHeight - belegt(fl); };
    var pruef = function (x, v, wert, alt) { x.style.setProperty(v, wert + 'px'); if (ueber(fl)) { if (alt == null) x.style.removeProperty(v); else x.style.setProperty(v, alt + 'px'); return false; } return true; };
    if (le && !er && frei() > 140) { le.classList.add('ab-leist--seite'); if (ueber(fl)) le.classList.remove('ab-leist--seite'); }
    if (le && hat(le, 'ab-leist--seite')) { var n = le.querySelectorAll('li').length, lp = 9; for (var y = 0; y < 3; y++) { var f = frei(); if (f < 8) break; var lp2 = Math.min(48, lp + Math.floor(f / (2 * n))); if (lp2 === lp || !pruef(le, '--lp', lp2, lp === 9 ? null : lp)) break; lp = lp2; } }
    if (er) {   // allein füllt das Foto die Seite, sonst nimmt es den Raum vor dem nächsten Abschnitt; mehrmals, weil der Titeltext neben dem Foto erst überholt werden muss
      var fh = 270, bis = k.length === 1 ? 700 : 430;
      for (var z = 0; z < 4; z++) { var f2 = frei() - 8; if (f2 < 6 || fh >= bis) break; var neu = Math.min(bis, fh + f2); if (!pruef(er, '--fh', neu, fh === 270 ? null : fh)) break; fh = neu; }
    }
    if (an && !sch) { var r = an.querySelectorAll('.ab-pz').length, f3 = frei(); if (f3 > 20 && r) pruef(an, '--pp', Math.min(26, 10 + Math.floor(f3 / (2 * r))), null); }
    if (sch) schlussRaum(sch);
    if (k.length > 1 && fl.clientHeight - belegt(fl) > 6) fl.classList.add('ab-fluss--verteilt');
  }
  /* Ein Angebot, das allein höher ist als eine Seite (sehr viele Posten): es geht auf eine eigene Seite weiter, mit eigener Überschrift und Kopf,
     die Summe immer mit den letzten Zeilen. Zurückgegeben wird der zweite Teil, oder null, wenn nichts zu teilen ist. */
  function teilen(an, fl) {
    if (!hat(an, 'ab-angebot') || an.querySelectorAll('.ab-pz').length < 2) return null;
    var weiter = document.createElement('section'); weiter.className = 'ab-blk ab-angebot ab-angebot--weiter';
    weiter.appendChild(an.querySelector('.ab-mit').cloneNode(true));
    while (ueber(fl) && an.children.length > 2) weiter.insertBefore(an.lastElementChild, weiter.children[1] || null);
    if (!weiter.querySelector('.ab-pz') && an.querySelectorAll('.ab-pz').length > 1) {   // die Summe steht nie allein unter der Überschrift: die letzte Preiszeile geht mit
      var pz = an.querySelectorAll('.ab-pz'); weiter.insertBefore(pz[pz.length - 1], weiter.children[1] || null);
    }
    if (!an.querySelector('.ab-pz')) { an.insertBefore(weiter.children[1], an.querySelector('.ab-mit').nextSibling); }
    return weiter.children.length > 1 ? weiter : null;
  }
  /* Einpassen: Die Schrift wird nie kleiner. Abschnitte bleiben ganz; passt einer nicht mehr auf die Seite, beginnt er eine neue mit kleinem Kopf und «Seite x von y».
     Gibt {seiten, groesse, ueberlauf} zurück; ueberlauf = ein Abschnitt ist selbst geteilt noch höher als eine Seite (wird gemeldet, nie still geschnitten).
     Darf beliebig oft laufen (Schrift geladen, Fenstergrösse): ein schon verteiltes Blatt wird erst wieder eine Seite (Prüfung 3, N6). */
  window.ANGEBOT_EINPASSEN = function (wurzel) {
    var bl = wurzel && wurzel.querySelector('.ab-blatt'); if (!bl) return { seiten: 0, groesse: 1, ueberlauf: false };
    var erste = bl.querySelector('.ab-seite'), fl = erste.querySelector('.ab-fluss');
    [].slice.call(bl.querySelectorAll('.ab-seite')).slice(1).forEach(function (s) {
      [].slice.call(s.querySelector('.ab-fluss').children).forEach(function (x) { fl.appendChild(x); }); s.remove();
    });
    [].slice.call(fl.querySelectorAll('.ab-angebot--weiter')).forEach(function (w) {   // geteiltes Angebot wieder zusammen
      var an = w.previousElementSibling && hat(w.previousElementSibling, 'ab-angebot') ? w.previousElementSibling : fl.querySelector('.ab-angebot');
      [].slice.call(w.children).slice(1).forEach(function (x) { an.appendChild(x); }); w.remove();
    });
    erste.querySelector('.ab-seitenzahl').textContent = '';
    bl.classList.remove('ab-eng'); bl.style.setProperty('--gr', 1); zuruecksetzen(bl);
    if (!ueber(fl)) { gestalten(fl); return { seiten: 1, groesse: 1, ueberlauf: false }; }
    var bloecke = [].slice.call(fl.children), d = { name: bl.getAttribute('data-name'), email: '', instagram: '' };
    var vorlage = erste.cloneNode(true); vorlage.querySelector('.ab-fluss').innerHTML = '';
    var folge = document.createElement('div'); folge.innerHTML = seite(d, true, ''); folge = folge.firstChild;
    folge.querySelector('.ab-kontakt').textContent = erste.querySelector('.ab-kontakt').textContent;
    bl.innerHTML = '';
    var akt = vorlage.cloneNode(true); bl.appendChild(akt); var ziel = akt.querySelector('.ab-fluss');
    var neueSeite = function () { akt = folge.cloneNode(true); bl.appendChild(akt); ziel = akt.querySelector('.ab-fluss'); };
    bloecke.forEach(function (b) {
      ziel.appendChild(b);
      if (ueber(ziel) && ziel.children.length > 1) { neueSeite(); ziel.appendChild(b); }   // der ganze Abschnitt auf die nächste Seite
      for (var w = b, i = 0; i < 20 && ueber(ziel); i++) { var teil = teilen(w, ziel); if (!teil) break; neueSeite(); ziel.appendChild(teil); w = teil; }
    });
    var seiten = bl.querySelectorAll('.ab-seite'), zuViel = false;
    [].forEach.call(seiten, function (s, n) { s.querySelector('.ab-seitenzahl').textContent = 'Seite ' + (n + 1) + ' von ' + seiten.length; if (ueber(s.querySelector('.ab-fluss'))) zuViel = true; });
    if (!zuViel) [].forEach.call(seiten, function (s) { gestalten(s.querySelector('.ab-fluss')); });
    return { seiten: seiten.length, groesse: 1, ueberlauf: zuViel };
  };
  window.ANGEBOT_GELD = geld;
  window.ANGEBOT_TAG = tag;
  window.ANGEBOT_OHNE_EMOJI = ohneEmoji;
})();

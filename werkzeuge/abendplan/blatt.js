/* Der Abendplan · Blatt (05.11.2026, nach blatt.js der Pairing-Karte des Culinarium). Ein Satz für alles, was der Plan als Blatt zeigt:
     Vorschau im Werkzeug (Rahmen, Daten per postMessage, Klick und Doppelklick gehen zurück, «blitz» lässt eine Stelle aufleuchten)
     Druck   blatt.html?druck=1&id=<abend>&art=gastgeber|arbeit → window.AP_FERTIG für drucke.js (PDF, A4)
     Mini    blatt.html?mini=1 (Fenster «So steht es auf dem Blatt»: ein Eintrag allein)
     Handy   handy.html#<abend> (Arbeitsblatt für unterwegs, eine Spalte, ohne Seiten)
   Zwei Blätter: «Dein Abend» für den Gastgeber (ruhig, ohne interne Notizen, ohne Packliste) und das Arbeitsblatt für Angelina (kompakt, alles).
   Seiten: die Teile des Blatts sind Blöcke; sie werden in A4-Seiten gelegt, ein Block wird nie zerschnitten, ein Zwischentitel steht nie allein am Seitenende.
   Ein Logo je Blatt (ihre Wortmarke als Vektor), nie fett, nie kursiv, Sperrung höchstens .08em. */
(function () {
  'use strict';
  var q = new URLSearchParams(location.search), ZOOM = 0.62, LETZT = null;
  var MM = 96 / 25.4;
  /* Prüfung 05.11.2026 (7): keine Emojis im Satz (sie kämen als Type-3-Schrift ins PDF) */
  function h(s) { return String(s == null ? '' : s).replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  var TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  function datumLang(s) { if (!s) return ''; var t = s.split('-').map(Number), w = new Date(t[0], t[1] - 1, t[2]).getDay(); return TAGE[w] + ', ' + t[2] + '. ' + MONATE[t[1] - 1] + ' ' + t[0]; }
  function datumKurz(s) { if (!s) return ''; var t = s.split('-'); return t[2] + '.' + t[1] + '.' + t[0]; }
  var WER_G = { angelina: 'Angelina', gastgeber: 'Ihr', caterer: 'Caterer', gaeste: 'Eure Gäste', alle: 'Alle zusammen', musik: 'Musik' };
  var WER_A = { angelina: 'Ich', gastgeber: 'Gastgeber', caterer: 'Caterer', gaeste: 'Gäste', alle: 'Alle', musik: 'Musik' };
  var WEINART = { sekt: 'Sekt', weiss: 'Weisswein', rose: 'Rosé', rot: 'Rotwein', suess: 'Süsswein', alkoholfrei: 'Alkoholfrei', wasser: 'Wasser', digestif: 'Digestif' };
  /* Prüfung 2 (Fund 4): auf jedem Blatt, auch in der Vorschau, nur gültige Uhrzeiten */
  function Zt(x) { return /^\d{2}:\d{2}$/.test(x || '') && +x.slice(0, 2) < 24 && +x.slice(3) < 60 ? x : ''; }
  /* Prüfung 5 (1): eine Angabe bleibt zusammen («2 Flaschen», «öffnen 18:20», «6–8 °C»), umbrochen wird nur am «·» (Fehlerbuch 28.10.2026, Kennzeilen) */
  function zusammen(x) { return h(x).replace(/(\d(?:[\d.,:–-]*\d)?) +/g, '$1&nbsp;').replace(/^(öffnen|ab|bis|je|ca\.) +/i, '$1&nbsp;'); }
  function weinZeile(w) { return [w.weingut, w.rebsorte && w.rebsorte !== w.name ? w.rebsorte : '', w.jahrgang, w.herkunft].filter(Boolean).join(', '); }
  function gangName(p, id) { var g = (p.gaenge || []).filter(function (x) { return x.id === id; })[0]; return g ? g.name : ''; }

  /* ---------------------------------------------------------------- Blöcke */
  /* Block: {k: Stelle im Plan (für Klick und Blitz), html, kopf: Zwischentitel (bleibt beim nächsten Block), fuss: kommt ans Ende} */
  /* Della Respira hat kein «…» und zeichnet «» wie “ ” (Fund Mappen 06.11.2026): diese Zeichen im Della-Satz in Montserrat setzen */
  function hd(s) { return h(s).replace(/[«»…‹›’‘“”„‚]/g, function (c) { return '<span class="el">' + c + '</span>'; }); }
  /* Block: {k, html, abschnitt: beginnt einen Abschnitt, neu(teil): derselbe Kopf für einen Teil (geteilter Abschnitt), marke/markeBis: Name der Stelle für «… bis …»,
     bleibt: 'erst'|'letzt' (steht beim ersten bzw. letzten Teil), karte: liegt in der Menükarte, fuss: Schluss am Ende} */
  function kopfBlock(t, k, unter) { return { k: k, kopf: true, abschnitt: true, neu: function (teil) { return kopfBlock(t, k, [unter, teil].filter(Boolean).join(' · ')); }, html: '<h2 class="bl-h" data-k="' + k + '"><span class="bl-h__t">' + hd(t) + '</span>' + (unter ? '<small>' + h(unter) + '</small>' : '') + '</h2>' }; }
  /* Foto des Abends für den Kopf von «Dein Abend» (wie fotoAbend in abendplan.js, nur ihre Fotos aus _haus/bild) */
  var FOTO_ABEND = { 'a-251214-kt': 'p136', 'a-260918-hb': 'festtafel', 'a-261009-mw': 'empfang', 'a-261014-sk': 'tafel', 'a-261020-cl': 'kerzen', 'a-261022-rf': 'tisch', 'a-260929-js': 'p140', 'a-261006-ew': 'p150' };
  var FOTO_ANLASS = { 'Privates Dinner': 'tafel', 'Geburtstag': 'empfang', 'Jubiläum': 'festtafel', 'Feier zu Hause': 'p151' };
  function fotoVon(a) { return FOTO_ABEND[a.id] || FOTO_ANLASS[(a.anfrage || {}).anlass] || 'tafel'; }
  var WO_RUND = { empfang: 'Zum Empfang', tisch: 'Am Tisch', digestif: 'Zum Ausklang' };

  /* «Dein Abend»: wie ein Blatt aus ihrer Mappe. Kopf mit Foto und Siegel (das Foto liegt in der Seite, siehe seite()), Titel gross, Zeiten abgesetzt,
     Ablauf als Zeitleiste, das Menü als gesetzte Karte in ihrer Rahmenlinie, Gäste, Zuhause, zum Schluss ihr Satz und der Kontakt. */
  function bloeckeGastgeber(d) {
    var a = d.abend, p = d.plan, B = [], an = a.anfrage || {}, vo = p.vorort || {};
    var ankunft = Zt(p.ankunft), gab = Zt(p.gaeste_ab), ende = Zt(p.ende);   /* Prüfung 05.11.2026 (3) */
    var M = / und |^Familie /.test((a.gastgeber || {}).name || ''), du = function (e, m) { return M ? m : e; };   /* ein Gastgeber: du, ein Paar oder eine Familie: ihr */
    var ort = vo.adresse ? vo.adresse.split(',').pop().trim() : '';
    B.push({ k: 'abend', abschnitt: true, html: '<header class="bl-kopf" data-k="abend"><p class="bl-vers">Dein Abend</p>'
      + '<h1 class="bl-titel">' + hd(p.titel || an.anlass || 'Dein Abend') + '</h1><p class="bl-datum">' + h(datumLang(an.datum)) + (ort ? '<span class="bl-punkt"></span>' + h(ort) : '') + '</p>'
      + '<i class="bl-strich"></i>' + (p.gruss ? '<p class="bl-gruss">' + h(p.gruss) + '</p>' : '')
      + (ankunft || gab || ende ? '<dl class="bl-eck">' : '<dl class="bl-eck" hidden>') + (ankunft ? '<div><dt>Ich bin da</dt><dd>' + h(ankunft) + '</dd></div>' : '') + (gab ? '<div><dt>' + du('Deine', 'Eure') + ' Gäste kommen</dt><dd>' + h(gab) + '</dd></div>' : '') + (ende ? '<div><dt>Abschied gegen</dt><dd>' + h(ende) + '</dd></div>' : '') + '</dl></header>' });
    var ab = (p.ablauf || []).filter(function (x) { return !x.intern; });
    if (ab.length) {
      B.push(kopfBlock('Der Ablauf', 'ablauf'));
      ab.forEach(function (x, i) {
        B.push({ k: 'ablauf.' + x.id, marke: Zt(x.zeit) || x.was, html: '<div class="bl-z bl-ab' + (i === 0 ? ' bl-ab--erst' : '') + (i === ab.length - 1 ? ' bl-ab--letzt' : '') + '" data-k="ablauf.' + x.id + '"><span class="bl-zeit">' + h(Zt(x.zeit)) + '</span><i class="bl-spur"></i><div><b>' + h(x.was) + '</b>' + (x.notiz ? '<p>' + h(x.notiz) + '</p>' : '') + '</div><span class="bl-wer">' + h(x.wer === 'gastgeber' ? du('Du', 'Ihr') : x.wer === 'gaeste' ? du('Deine Gäste', 'Eure Gäste') : (WER_G[x.wer] || '')) + '</span></div>' });
      });
    }
    /* Das Menü als Karte: Empfang, Gang für Gang mit seinen Weinen, dann was den Abend über und zum Ausklang eingeschenkt wird.
       Ein Block je Karte, damit die Rahmenlinie nie über einen Seitenumbruch läuft; mehr als fünf Gänge gehen auf eine zweite Karte. */
    var gs = p.gaenge || [], ws = p.weine || [];
    var rundZeile = function (w, mitTitel) { return '<div class="bl-rund' + (mitTitel ? '' : ' bl-rund--dazu') + '" data-k="weine.' + w.id + '">' + (mitTitel ? '<p class="bl-vers">' + h(WO_RUND[w.zu] || 'Am Tisch') + '</p>' : '') + '<b>' + hd(w.name || 'nach Absprache') + '</b>' + (weinZeile(w) ? '<p class="bl-wz">' + h(weinZeile(w)) + '</p>' : '') + '</div>'; };
    var vorn = ws.filter(function (w) { return w.zu === 'empfang'; }), hinten = ws.filter(function (w) { return w.zu === 'tisch' || w.zu === 'digestif' || (w.zu !== 'empfang' && !gangName(p, w.zu)); });
    hinten.sort(function (x, y) { return (x.zu === 'digestif') - (y.zu === 'digestif'); });
    var gangZeile = function (g) {
      var wg = ws.filter(function (w) { return w.zu === g.id && w.art !== 'alkoholfrei'; }), af = ws.filter(function (w) { return w.zu === g.id && w.art === 'alkoholfrei'; });
      return '<div class="bl-gang" data-k="gaenge.' + g.id + '"><p class="bl-vers">' + h(g.name) + '</p>' + (g.gericht || !p.belegt ? '<b>' + hd(g.gericht || 'folgt') + '</b>' : '') + (g.beschreibung ? '<p class="bl-besch">' + h(g.beschreibung) + '</p>' : '')
        + wg.map(function (w) { return '<p class="bl-wein" data-k="weine.' + w.id + '">' + h(w.name || 'Wein, auf das Menü abgestimmt') + (weinZeile(w) ? '<span>' + h(weinZeile(w)) + '</span>' : '') + '</p>'; }).join('')
        + af.map(function (w) { return '<p class="bl-wein bl-af" data-k="weine.' + w.id + '">Ohne Alkohol: ' + h(w.name) + '</p>'; }).join('') + (g.koch ? '<p class="bl-koch">Gekocht von ' + h(g.koch) + '</p>' : '') + '</div>';
    };
    if (gs.length || vorn.length || hinten.length) {
      var karteKopf = function (teil) { return { k: 'gaenge', abschnitt: true, karte: true, neu: karteKopf, html: '<header class="bl-karte__kopf"><h2 class="bl-karte__t">' + (gs.length ? 'Das Menü' : 'Zum Anstossen und den Abend über') + '</h2>' + (teil ? '<p class="bl-karte__teil">' + h(teil) + '</p>' : '') + '<i class="bl-strich"></i></header>' }; };
      var titel = function (w, i, l) { return !i || (WO_RUND[l[i - 1].zu] || 'Am Tisch') !== (WO_RUND[w.zu] || 'Am Tisch'); };   /* «Zum Empfang» nur einmal über mehreren Getränken */
      var teile = vorn.map(function (w, i, l) { return { k: 'weine.' + w.id, ids: [], marke: WO_RUND.empfang, html: rundZeile(w, titel(w, i, l)) }; })
        .concat(gs.map(function (g) { return { k: 'gaenge.' + g.id, ids: ws.filter(function (w) { return w.zu === g.id; }).map(function (w) { return 'weine.' + w.id; }), marke: g.name, html: gangZeile(g) }; }))
        .concat(hinten.map(function (w, i, l) { return { k: 'weine.' + w.id, ids: [], marke: WO_RUND[w.zu] || 'Am Tisch', html: rundZeile(w, titel(w, i, l)) }; }));
      /* Die Karte ist ein Abschnitt: sie steht ganz auf einer Seite; ist sie grösser als eine Seite, wird sie in Karten mit eigenem Kopf geteilt (legen()) */
      B.push(karteKopf(''));
      teile.forEach(function (t) { B.push({ k: t.k, ids: [t.k].concat(t.ids), karte: true, marke: t.marke, html: t.html }); });
    }
    var qs = p.gaeste || [];
    if (qs.length) {
      B.push(kopfBlock(du('Deine Gäste', 'Eure Gäste'), 'gaeste', qs.length + (qs.length === 1 ? ' Gast' : ' Gäste')));
      /* Prüfung 6 (3): die Gäste laufen in einer Folge durch die drei Spalten; geteilt wird erst bei mehr als 60 (dann je Teil eine eigene Folge) */
      for (var gq = 0; gq < qs.length; gq += 60) B.push({ k: 'gaeste', marke: qs[gq].platz ? 'Plätze ' + qs[gq].platz : qs[gq].name, markeBis: (qs[Math.min(qs.length, gq + 60) - 1] || {}).platz || (qs[Math.min(qs.length, gq + 60) - 1] || {}).name, html: '<div class="bl-gaeste">' + qs.slice(gq, gq + 60).map(function (x) { return '<p data-k="gaeste.' + x.id + '">' + (x.platz ? '<span class="bl-platz">' + h(x.platz) + '</span>' : '<span class="bl-platz"></span>') + '<span class="bl-name">' + hd(x.name) + (x.ehrengast ? '<i>Ehrengast</i>' : '') + '</span></p>'; }).join('') + '</div>' });
      var acht = [];
      qs.forEach(function (x) { if (x.unvertraeglich) acht.push(h(x.name) + ' verträgt ' + h(x.unvertraeglich) + ' nicht'); if (x.alkoholfrei) acht.push(h(x.name) + ' bekommt die Begleitung ohne Alkohol'); if (/vegetar|vegan/i.test(x.vorlieben || '')) acht.push(h(x.name) + ' isst ' + (/vegan/i.test(x.vorlieben) ? 'vegan' : 'vegetarisch')); });
      if (acht.length) B.push({ k: 'gaeste', bleibt: 'letzt', html: '<p class="bl-achte" data-k="gaeste"><span class="bl-vers">Darauf achte ich</span>' + acht.join('; ') + '.</p>' });
    }
    var stellt = vo.stellt || [];
    if (vo.adresse || stellt.length || vo.tisch) {
      B.push(kopfBlock(du('Bei dir zu Hause', 'Bei euch zu Hause'), 'vorort'));
      B.push({ k: 'vorort', html: '<div class="bl-zwei" data-k="vorort">' + '<div>' + (vo.adresse ? '<p class="bl-vers">Adresse</p><p>' + h(vo.adresse) + '</p>' : '') + (vo.tisch ? '<p class="bl-vers">Der Tisch</p><p>' + h(vo.tisch) + '</p>' : '') + (vo.raum ? '<p class="bl-vers">Die Räume</p><p>' + h(vo.raum) + '</p>' : '') + '</div>'
        + (stellt.length ? '<div><p class="bl-vers">' + du('Was du bereitstellst', 'Was ihr bereitstellt') + '</p><ul>' + stellt.map(function (s) { return '<li>' + h(s) + '</li>'; }).join('') + '</ul></div>' : '') + '</div>' });
    }
    var st = p.abstimmung || {};
    /* Schluss wie ein Brief von ihr (wie der Schlussblock des Angebots, «Anfragen & Angebote»): Porträt mit ihrer Linie, Siegel, ihr Satz zum Abend,
       «Angelina» als Unterschrift in Pinyon Script (Markenbuch: «Unterschrift»), Zeile und Kontakt. gestalten() lässt ihn in den freien Raum der letzten Seite wachsen. */
    B.push({ k: 'abstimmung', fuss: true, abschnitt: true, html: '<footer class="bl-fuss" data-k="abstimmung"><div class="bl-fuss__k"><figure class="bl-fuss__foto"><img src="/angelina-strelow/werkzeuge/assets/bild/p158-1000.webp" alt="Angelina Strelow" decoding="sync"></figure>'
      + '<div class="bl-fuss__text"><img class="bl-fuss__siegel" src="/angelina-strelow/werkzeuge/assets/zeichen/siegel-berry.svg" alt=""><p class="bl-schluss">' + (p.belegt ? 'Dein Abend. Mein Service.' : st.bestaetigt_am ? 'Bestätigt am ' + h(datumKurz(st.bestaetigt_am)) + (st.bestaetigt_von ? ' von ' + h(st.bestaetigt_von).replace(/ /g, '&nbsp;') : '') + '. Ich freue mich auf ' + du('deinen', 'euren') + ' Abend.' : du('Wenn alles so passt, sag mir kurz Bescheid. Dann steht dein Abend.', 'Wenn alles so passt, sagt mir kurz Bescheid. Dann steht euer Abend.')) + '</p>'
      + '<p class="bl-gruss-h">Herzlich</p><p class="bl-hand">Angelina</p><i class="bl-strich"></i><p class="bl-absender">Angelina Strelow · Exklusive Gastgeberin · Köln und Umgebung</p>'
      + '<p class="bl-kontakt">Strelowangelina@gmx.de<span class="bl-punkt"></span>Instagram @by.angelina.strelow</p>' + (p.belegt ? '' : '<p class="bl-satz-k">' + du('Dein', 'Euer') + ' Abend. Mein Service.</p>') + '</div></div></footer>' });
    return B;
  }

  /* Arbeitsblatt: ihr Blatt für den Abend. Kopf auf Creme mit den vier Zahlen, die sie am Abend sucht; Zeiten links gross und ruhig; Internes erkennbar. */
  function bloeckeArbeit(d) {
    var a = d.abend, p = d.plan, B = [], an = a.anfrage || {}, vo = p.vorort || {}, ku = vo.kueche || {}, gg = a.gastgeber || {};
    B.push({ k: 'abend', abschnitt: true, html: '<header class="bl-kopf bl-kopf--a" data-k="abend"><div class="bl-kopf__l"><p class="bl-vers">Arbeitsblatt · ' + h(an.anlass || '') + '</p><h1 class="bl-titel">' + hd(gg.name || '') + '</h1><p class="bl-datum">' + h(datumLang(an.datum)) + '</p>'
      + '<p class="bl-ort">' + h(vo.adresse || an.ort || '') + (vo.klingel ? ' · Klingel: ' + h(vo.klingel) : '') + '</p>' + (vo.ansprech ? '<p class="bl-ort">Ansprechpartner: ' + h(vo.ansprech) + '</p>' : '') + '</div>'
      + '<dl class="bl-eck bl-eck--a"><div><dt>Ich bin da</dt><dd>' + h(Zt(p.ankunft) || '–') + '</dd></div><div><dt>Gäste ab</dt><dd>' + h(Zt(p.gaeste_ab) || '–') + '</dd></div><div><dt>Ende</dt><dd>' + h(Zt(p.ende) || '–') + '</dd></div><div><dt>Gäste</dt><dd>' + ((p.gaeste || []).length || h(an.gaeste || '–')) + '</dd></div></dl></header>' });
    var nach = (p.abstimmung || {}).nachher || [];
    if ((p.abstimmung || {}).bestaetigt_am && nach.length) B.push({ k: 'abstimmung', html: '<div class="bl-hinweis bl-hinweis--neu" data-k="abstimmung"><b>Geändert nach Bestätigung (' + h(datumKurz(p.abstimmung.bestaetigt_am)) + ')</b>' + nach.slice(-6).map(function (x) { return '<p>' + h(x.was) + '</p>'; }).join('') + '</div>' });
    if ((p.ablauf || []).length) {
      B.push(kopfBlock('Ablauf', 'ablauf', p.ablauf.length + (p.ablauf.length === 1 ? ' Punkt' : ' Punkte')));
      (p.ablauf || []).forEach(function (x) {
        var g = (p.gaenge || []).filter(function (y) { return y.id === x.gang; })[0];
        B.push({ k: 'ablauf.' + x.id, marke: Zt(x.zeit) || x.was, html: '<div class="bl-z bl-ab bl-ab--a' + (x.intern ? ' bl-intern' : '') + '" data-k="ablauf.' + x.id + '"><span class="bl-zeit">' + h(Zt(x.zeit)) + (+x.dauer ? '<small>' + h(x.dauer) + '&nbsp;Min.</small>' : '') + '</span><div>' + (x.intern ? '<span class="bl-nur">Nur für mich</span>' : '') + '<b>' + h(x.was) + (g && g.gericht ? ' · ' + h(g.gericht) : '') + '</b>' + (x.notiz ? '<p>' + h(x.notiz) + '</p>' : '') + (g && g.hinweis ? '<p class="bl-k">Küche: ' + h(g.hinweis) + '</p>' : '') + '</div><span class="bl-wer">' + h(WER_A[x.wer] || '') + '</span></div>' });
      });
    }
    if ((p.weine || []).length) {
      B.push(kopfBlock('Wein und Getränke', 'weine'));
      var reihe = [['empfang', 'Empfang']].concat((p.gaenge || []).map(function (g) { return [g.id, g.name]; })).concat([['tisch', 'Am Tisch'], ['digestif', 'Digestif']]);
      reihe.forEach(function (r) {
        (p.weine || []).filter(function (w) { return w.zu === r[0]; }).forEach(function (w) {
          B.push({ k: 'weine.' + w.id, marke: r[1], html: '<div class="bl-z bl-w" data-k="weine.' + w.id + '"><span class="bl-zeit bl-zu">' + h(r[1]) + '</span><div><b>' + h(w.name || (p.belegt ? 'nicht überliefert' : 'ohne Angabe')) + '</b><p>' + h([WEINART[w.art], weinZeile(w)].filter(Boolean).join(' · ')) + '</p>' + (w.notiz && !w.name ? '<p>' + h(w.notiz) + '</p>' : '') + '</div><span class="bl-wer bl-w__r">' + [w.temperatur, w.oeffnen ? 'öffnen ' + w.oeffnen : '', w.glas, w.menge].filter(Boolean).map(zusammen).join('&nbsp;· ') + '</span></div>' });
        });
      });
    }
    var qs = p.gaeste || [];
    if (qs.length) {
      B.push(kopfBlock('Gäste', 'gaeste', qs.length + (qs.length === 1 ? ' Gast' : ' Gäste')));
      var acht = [];
      qs.forEach(function (x) { if (x.unvertraeglich) acht.push(h(x.name) + ': ohne ' + h(x.unvertraeglich)); if (x.alkoholfrei) acht.push(h(x.name) + ': kein Alkohol'); if (/vegetar|vegan/i.test(x.vorlieben || '')) acht.push(h(x.name) + ': ' + h(x.vorlieben)); });
      if (acht.length) B.push({ k: 'gaeste', bleibt: 'erst', html: '<div class="bl-hinweis" data-k="gaeste"><b>Worauf ich achte</b><p>' + acht.join(' · ') + '</p></div>' });
      /* Prüfung 05.11.2026 (16): Gäste in zwei Spalten, je Block bis zu sechs, damit das Arbeitsblatt keine halbleeren Seiten bekommt */
      var zelle = function (x) {
        var t = [x.beziehung, x.ehrengast ? 'Ehrengast' : '', x.unvertraeglich ? 'ohne ' + x.unvertraeglich : '', x.alkoholfrei ? 'kein Alkohol' : '', x.vorlieben && !x.alkoholfrei ? x.vorlieben : ''].filter(Boolean).join(' · ');
        return '<div class="bl-z bl-q" data-k="gaeste.' + x.id + '"><span class="bl-zeit">' + h(x.platz || '') + '</span><div><b>' + h(x.name) + '</b>' + (t ? '<p>' + h(t) + '</p>' : '') + (x.notiz ? '<p class="bl-k">' + h(x.notiz) + '</p>' : '') + '</div></div>';
      };
      for (var gi = 0; gi < qs.length; gi += 6) B.push({ k: 'gaeste', marke: qs[gi].platz ? 'Plätze ' + qs[gi].platz : qs[gi].name, markeBis: (qs[Math.min(qs.length, gi + 6) - 1] || {}).platz || (qs[Math.min(qs.length, gi + 6) - 1] || {}).name, ids: qs.slice(gi, gi + 6).map(function (x) { return 'gaeste.' + x.id; }), html: '<div class="bl-qs" data-k="gaeste">' + qs.slice(gi, gi + 6).map(zelle).join('') + '</div>' });
    }
    var kz = [['Gläser', ku.glaeser], ['Geschirr', ku.geschirr], ['Besteck', ku.besteck], ['Kühlschrank', ku.kuehlschrank], ['Ofen', ku.ofen], ['Spüle', ku.spuele], ['Sonst', ku.notiz], ['Garderobe', vo.garderobe], ['Tisch', vo.tisch], ['Räume', vo.raum], ['Anfahrt', vo.anfahrt], ['Parken', vo.parken]].filter(function (x) { return x[1]; });
    if (kz.length) {
      B.push(kopfBlock('Küche und Haus', 'vorort'));
      B.push({ k: 'vorort', html: '<dl class="bl-dl" data-k="vorort">' + kz.map(function (x) { return '<div><dt>' + h(x[0]) + '</dt><dd>' + h(x[1]) + '</dd></div>'; }).join('') + '</dl>' });
      if ((vo.stellt || []).length) B.push({ k: 'vorort', bleibt: 'letzt', html: '<p class="bl-ort bl-stellt" data-k="vorort"><span class="bl-vers">Stellt der Gastgeber</span> ' + h(vo.stellt.join(' · ')) + '</p>' });
    }
    if ((p.packliste || []).length) {
      B.push(kopfBlock('Packliste', 'packliste', p.packliste.filter(function (x) { return x.hat; }).length + ' von ' + p.packliste.length + ' gepackt'));
      B.push({ k: 'packliste', html: '<ul class="bl-pack" data-k="packliste">' + p.packliste.map(function (x) { return '<li class="' + (x.hat ? 'da' : '') + '"><i></i>' + h(x.was) + '</li>'; }).join('') + '</ul>' });
    }
    if (p.intern) B.push({ k: 'intern', abschnitt: true, html: '<div class="bl-hinweis bl-hinweis--leise" data-k="intern"><b>Nur für mich</b><p>' + h(p.intern) + '</p></div>' });
    return B;
  }
  function bloecke(d, art) { return art === 'arbeit' ? bloeckeArbeit(d) : bloeckeGastgeber(d); }

  /* ---------------------------------------------------------------- Seiten: Blöcke in A4 legen */
  /* Eine A4-Seite. «Dein Abend» trägt auf der ersten Seite das Foto des Abends mit ihrer Rahmenlinie und das Siegel; jede Seite einen Fuss wie in ihrer Mappe. */
  function seite(art, n, d) {
    var a = d.abend || {}, kopf = '';
    if (art === 'gastgeber' && n === 1) kopf = '<figure class="bl-bild"><img src="/angelina-strelow/werkzeuge/assets/bild/' + fotoVon(a) + '-1000.webp" alt="" decoding="sync"></figure><span class="bl-siegel"><img src="/angelina-strelow/werkzeuge/assets/zeichen/siegel-berry.svg" alt="Angelina Strelow"></span>';
    var fuss = art === 'arbeit' ? 'Arbeitsblatt · ' + h((a.gastgeber || {}).name || '') + ' · ' + h(datumKurz((a.anfrage || {}).datum)) : 'Angelina Strelow · Exklusive Gastgeberin';
    return '<section class="blatt blatt--' + art + (n === 1 ? ' blatt--erste' : '') + '" data-b="210" style="--s:' + (document.getElementById('seiten').style.getPropertyValue('--s') || 1) + '">' + kopf + '<div class="inhalt"></div><p class="bl-seitenfuss"><span>' + fuss + '</span><span class="bl-nr"></span></p></section>';
  }
  /* Seiten so füllen, dass keine halb leer bleibt (Fehlerbuch 10a 19./20.10.2026): bleibt die letzte Seite unter 55 % voll, wird die Schrift in kleinen
     Schritten kleiner gesetzt (bis 86 %), solange das eine Seite spart. Wie das Einpassen im Vorbild, nur ohne Verzerren. */
  function setze(d, art) {
    var b = legen(d, art, 1, true), mass = 1;
    if (b.seiten > 1 && b.letzte < 0.55) {
      for (var s = 0.95; s >= 0.855; s -= 0.03) { var x = legen(d, art, s, true); if (x.seiten < b.seiten && !x.fehler.length) { mass = s; break; } }
    }
    return legen(d, art, mass);
  }
  /* Abschnitte: ein Kopf und alles bis zum nächsten Kopf (Ablauf, Menükarte, Gäste, Zuhause, Wein, Küche, Packliste …) */
  function gruppen(B) { var G = []; B.forEach(function (b) { if (b.abschnitt || !G.length) G.push({ bloecke: [b], fuss: !!b.fuss }); else G[G.length - 1].bloecke.push(b); }); return G; }
  /* Ein Abschnitt grösser als eine Seite wird in n Teile mit eigenem Kopf geteilt, im Kopf steht, welcher Teil («16:00 bis 18:40», «Plätze 1 bis 15») */
  function teilen(g, n) {
    var kopf = g.bloecke[0].neu ? g.bloecke[0] : null, rest = g.bloecke.slice(1);
    var erst = rest.filter(function (b) { return b.bleibt === 'erst'; }), letzt = rest.filter(function (b) { return b.bleibt === 'letzt'; }), mitte = rest.filter(function (b) { return !b.bleibt; });
    if (!kopf || mitte.length < n) return null;
    var T = [], ab = 0;
    for (var i = 0; i < n; i++) {
      var bis = Math.round(mitte.length * (i + 1) / n), m = mitte.slice(ab, bis); ab = bis; if (!m.length) return null;   /* Teile so gleich wie möglich */
      var a = m[0].marke || '', z = m[m.length - 1].markeBis || m[m.length - 1].marke || '';
      T.push({ bloecke: [kopf.neu(a && z && a !== z ? a + ' bis ' + z : a)].concat(i ? [] : erst, m, i === n - 1 ? letzt : []) });
    }
    return T;
  }
  /* Seiten legen (Robert 06.11.2026, Fehlerbuch 10a): kein Abschnitt bricht über eine Seite. Passt er nicht mehr, beginnt er auf der nächsten Seite;
     ist er grösser als eine Seite, bekommt er eigene Seiten mit eigenem Kopf. Danach wird jede Seite um ihre Abschnitte herum gestaltet (gestalten()). */
  function legen(d, art, s, still) {
    var S = document.getElementById('seiten'), G = gruppen(bloecke(d, art));
    S.style.setProperty('--s', s);
    document.body.dataset.art = art;
    S.innerHTML = '';
    var n = 0, inh;
    var neu = function () { n++; S.insertAdjacentHTML('beforeend', seite(art, n, d)); inh = S.lastElementChild.querySelector('.inhalt'); };
    /* Prüfung 6 (2): beim Legen 4 mm Reserve, damit Safari und das PDF (Chromium) an denselben Stellen umbrechen; gestalten() füllt die Reserve danach */
    var platz = function () {
      /* Höhe des Inhalts ohne den automatischen Abstand über dem Schluss (scrollHeight ist nie kleiner als die Box) */
      var unten = [].reduce.call(inh.children, function (m, c) { return m + c.getBoundingClientRect().height + (c.classList.contains('bl-ende') ? 0 : parseFloat(getComputedStyle(c).marginTop) || 0); }, 0);
      return inh.scrollHeight <= inh.clientHeight + 0.5 && unten <= inh.clientHeight - 4 * MM;
    };
    var setzen = function (g) {
      var w = document.createElement('div'), karte = null; w.className = 'bl-abschnitt' + (g.fuss ? ' bl-ende' : '');
      g.bloecke.forEach(function (b) {
        var t = document.createElement('div'); t.innerHTML = b.html; var el = t.firstElementChild;
        if (b.karte) { if (!karte) { karte = document.createElement('section'); karte.className = 'bl-karte'; w.appendChild(karte); } karte.appendChild(el); } else { karte = null; w.appendChild(el); }
      });
      inh.appendChild(w); return w;
    };
    var freiRaum = function (x) { return x.clientHeight - [].reduce.call(x.children, function (m, c) { return m + c.offsetHeight; }, 0); };
    var element = function (b) { var t = document.createElement('div'); t.innerHTML = b.html; return t.firstElementChild; };
    /* Teile so lang, wie die Seite trägt; danach der Kopf jedes Teils mit seinem Bereich («16:00 bis 18:40») */
    var gierig = function (g) {
      var kopf = g.bloecke[0], rest = g.bloecke.slice(1);
      var folge = rest.filter(function (b) { return b.bleibt === 'erst'; }).concat(rest.filter(function (b) { return !b.bleibt; }), rest.filter(function (b) { return b.bleibt === 'letzt'; }));
      var teile = [], w = null, stuecke = [];
      var anfang = function () { w = document.createElement('div'); w.className = 'bl-abschnitt'; w.appendChild(element(kopf.neu('Teil'))); inh.appendChild(w); stuecke = []; teile.push({ w: w, st: stuecke }); };
      anfang(); if (!platz()) { w.remove(); teile.pop(); neu(); anfang(); }
      folge.forEach(function (b) {
        var el = element(b); w.appendChild(el); if (platz()) { stuecke.push(b); return; }
        el.remove(); if (!stuecke.length) { w.remove(); teile.pop(); }
        neu(); anfang(); w.appendChild(el); stuecke.push(b);
      });
      teile.forEach(function (t) {
        var m = t.st.filter(function (b) { return b.marke; }), a = m.length ? m[0].marke : '', z = m.length ? (m[m.length - 1].markeBis || m[m.length - 1].marke) : '';
        t.w.replaceChild(element(kopf.neu(teile.length > 1 ? (a && z && a !== z ? a + ' bis ' + z : a) : '')), t.w.firstElementChild);
      });
    };
    neu();
    G.forEach(function (g) {
      var w = setzen(g); if (platz()) return;
      /* der Schluss steht nie allein auf einer Seite: lieber die Abschnitte davor etwas dichter */
      if (g.fuss) { var vor = [].filter.call(inh.children, function (c) { return c !== w; });
        for (var ff = 0.94; ff >= 0.81; ff -= 0.06) { vor.forEach(function (c) { c.style.setProperty('--s', (s * ff).toFixed(3)); }); if (platz()) return; }
        vor.forEach(function (c) { c.style.removeProperty('--s'); }); }
      w.remove();
      var vorher0 = inh;
      if (inh.children.length) { neu(); w = setzen(g); if (platz()) return; w.remove(); }
      /* etwas dichter gesetzt (bis 82 %), bevor ein Abschnitt geteilt wird: das Menü bleibt eine Karte */
      for (var f = 0.94; f >= 0.81; f -= 0.06) { w = setzen(g); w.style.setProperty('--s', (s * f).toFixed(3)); if (platz()) return; w.remove(); }
      /* Arbeitsblatt: ein grosser Abschnitt beginnt gleich unter dem, was schon steht, und geht in Teilen mit eigenem Kopf weiter (dicht, für den Abend) */
      if (art === 'arbeit' && g.bloecke[0].neu) {
        if (vorher0 !== inh && freiRaum(vorher0) > 60 * MM) { S.lastElementChild.remove(); n--; inh = vorher0; }
        return gierig(g);
      }
      for (var k = 2; k <= 12; k++) {
        var T = teilen(g, k); if (!T) break;
        var vorher = n, ok = true;
        T.forEach(function (t, i) { if (!ok) return; if (i) neu(); setzen(t); if (!platz()) ok = false; });
        if (ok) return;
        while (n > vorher) { S.lastElementChild.remove(); n--; }
        inh = S.lastElementChild.querySelector('.inhalt'); inh.innerHTML = '';
      }
      setzen(g);   /* nicht teilbar: steht allein auf seiner Seite, der Bericht meldet den Überlauf */
    });
    /* Zeitleiste: Spur beginnt und endet in jedem Abschnitt an seinem ersten und letzten Punkt */
    [].forEach.call(S.querySelectorAll('.bl-abschnitt'), function (w) { var a = w.querySelectorAll('.bl-ab'); [].forEach.call(a, function (x) { x.classList.remove('bl-ab--erst', 'bl-ab--letzt'); }); if (a.length) { a[0].classList.add('bl-ab--erst'); a[a.length - 1].classList.add('bl-ab--letzt'); } });
    var alle = [].slice.call(S.querySelectorAll('.blatt'));
    if (alle.length > 1) alle.forEach(function (b, i) { b.querySelector('.bl-nr').textContent = (i + 1) + ' / ' + alle.length; });
    var letzt = alle[alle.length - 1].querySelector('.inhalt'), ende = letzt.querySelector('.bl-ende');
    var voll = [].reduce.call(letzt.children, function (n, c) { return c === ende ? n : n + c.getBoundingClientRect().height; }, 0) / letzt.clientHeight;
    if (!still) gestalten(alle, art, d);
    var fehler = [];   /* nach dem Gestalten geprüft: was über den Satzspiegel ragt, wird gemeldet */
    alle.forEach(function (b, i) { var x = b.querySelector('.inhalt'), u = x.getBoundingClientRect().bottom; if (x.scrollHeight > x.clientHeight + 1 || [].some.call(x.children, function (c) { return c.getBoundingClientRect().bottom > u + 0.05; })) fehler.push('Seite ' + (i + 1) + ': ein Eintrag ist länger als eine Seite und wird abgeschnitten. Bitte kürzen.'); });
    /* Leerfläche je Seite in mm: oben über dem ersten und unten unter dem letzten Element (Prüfung: keine Seite mit leerem Kopf oder Fuss) */
    var leer = alle.map(function (b) { var x = b.querySelector('.inhalt'), r = x.getBoundingClientRect(), k = x.children; if (!k.length) return [999, 999];
      return [Math.round((k[0].getBoundingClientRect().top - r.top) / MM * 10) / 10, Math.round((r.bottom - k[k.length - 1].getBoundingClientRect().bottom) / MM * 10) / 10]; });
    return { seiten: alle.length, fehler: fehler, letzte: Math.round(voll * 100) / 100, mass: Math.round(s * 100), leer: leer };
  }
  /* Jede Seite um ihre Abschnitte herum komponieren (Robert 06.11.2026: keine Leerfläche oben oder unten, nichts wird nur verschoben):
     1. der Abschnitt beginnt oben am Satzspiegel; 2. die Luft zwischen seinen Punkten wächst (--luft), bis er die Seite ruhig füllt, höchstens bis zu einer Grenze;
     3. bleibt dann noch Raum, kommt ein passendes Element dazu: auf «Dein Abend» ein Foto ihres Bestands mit ihrer Linie (auf der ersten Seite wächst das Foto des Abends)
        oder ihr Satz mit dem Siegel, auf dem Arbeitsblatt Notizlinien für den Abend; 4. der kleine Rest verteilt sich zwischen den Abschnitten, der letzte steht unten. */
  /* Fotos ihres Bestands (alle hochkant 4:5). Mit Menschen: Höhe des Gesichts in % (Fehlerbuch: Gesichter nie angeschnitten), nur wenn der Streifen hoch genug ist */
  var FUELL = ['einschenken', 'kerze', 'glas', 'tisch', 'kerzen', 'festtafel', 'p155', 'teller', 'p152', 'raum', 'gang'];
  var GESICHT = { kerze: 45, tisch: 30, p155: 42, p152: 32, raum: 38, gang: 30 };
  /* Prüfung 6 (4): wie viel der Bildhöhe ein Foto mindestens zeigen muss, damit man sein Motiv erkennt (das eingeschenkte Glas braucht die Hand und die Flasche) */
  var MINDEST = { einschenken: 0.75, kerze: 0.62, tisch: 0.62, p155: 0.62, p152: 0.62, raum: 0.62, gang: 0.62, glas: 0.4, kerzen: 0.35, festtafel: 0.35, teller: 0.3 };
  var FOKUS = { glas: 40, kerzen: 55, festtafel: 55, teller: 45, einschenken: 45 };
  var SAETZE = ['Du darfst selbst Gast sein.', 'Du lädst ein. Ich begleite den Abend.'];
  function gestalten(alle, art, d) {
    var gast = art === 'gastgeber', benutzt = [fotoVon(d.abend)], satzNr = 0;
    var ab = [].reduce.call(String(d.abend.id || ''), function (m, c) { return m + c.charCodeAt(0); }, 0) % FUELL.length;   /* je Abend eine andere Folge */
    var pool = FUELL.slice(ab).concat(FUELL.slice(0, ab));
    /* Prüfung 6 (1): genau messen (Bruchteile von Pixeln, nicht offsetHeight) und 1,5 px Reserve lassen, damit keine Linie am Satzspiegel abgeschnitten wird */
    var mass = function (inh) { var r = inh.getBoundingClientRect(); return r.height / inh.clientHeight || 1; };
    var frei = function (inh) { var k = mass(inh); return inh.clientHeight - 1.5 - [].reduce.call(inh.children, function (n, c) { return n + c.getBoundingClientRect().height / k + (c.classList.contains('bl-ende') ? 0 : parseFloat(getComputedStyle(c).marginTop) || 0); }, 0); };
    var passt = function (inh) { return inh.scrollHeight <= inh.clientHeight && frei(inh) >= 0; };
    alle.forEach(function (b, i) {
      var inh = b.querySelector('.inhalt'), ende = inh.querySelector('.bl-ende'), f = frei(inh);
      if (gast && i === 0 && f > 4 * MM) { b.style.setProperty('--foto', (86 * MM + Math.min(f, 104 * MM)).toFixed(1) + 'px'); f = frei(inh); }
      /* Luft zwischen den Punkten: so viel, dass die Seite ruhig gefüllt ist (Halbierung), höchstens 7 mm («Dein Abend») bzw. 2,4 mm (Arbeitsblatt) */
      var kidsA = [].filter.call(inh.children, function (c) { return c !== ende; });
      /* grösser setzen (--s je Abschnitt), höchstens bis «bis», so dass alles auf der Seite bleibt */
      var wachse = function (els, bis) { var basis = els.map(function (c) { return parseFloat(getComputedStyle(c).getPropertyValue('--s')) || 1; }), lo = 1, hi = bis;
        var setz = function (g) { els.forEach(function (c, n) { c.style.setProperty('--s', (basis[n] * g).toFixed(4)); }); };
        setz(hi); if (passt(inh)) return; for (var k = 0; k < 12; k++) { var m = (lo + hi) / 2; setz(m); if (passt(inh)) lo = m; else hi = m; } setz(lo); };
      /* das Menü allein auf seiner Seite: gross gesetzt, es füllt die Seite */
      if (gast && kidsA.length === 1 && !ende && kidsA[0].querySelector('.bl-karte')) wachse(kidsA, 1.5);
      /* Arbeitsblatt: erst grössere Zeilen (bis 112 %), dann Luft, erst dann Notizlinien */
      if (!gast && kidsA.length) wachse(kidsA, 1.12);
      var luft = function (bis) { var lo = 0, hi = bis * MM; inh.style.setProperty('--luft', hi + 'px');
        if (!passt(inh)) { for (var k = 0; k < 14; k++) { var m = (lo + hi) / 2; inh.style.setProperty('--luft', m + 'px'); if (passt(inh)) lo = m; else hi = m; } inh.style.setProperty('--luft', lo + 'px'); } };
      if (!(gast && ende)) luft(gast ? 5 : 4);
      f = frei(inh);
      var vor = ende || null, el = null;
      /* letzte Seite von «Dein Abend»: der Schluss wächst in den freien Raum (Porträt höher und breiter); allein auf der Seite wird er zur Schlussseite wie in der Mappe */
      if (gast && ende) {
        var fuss = ende.querySelector('.bl-fuss'), fo = ende.querySelector('.bl-fuss__foto');
        if (!kidsA.length) fuss.classList.add('bl-fuss--seite');
        var h0 = fo.offsetHeight, ziel = Math.min(Math.max(h0, ende.querySelector('.bl-fuss__text').offsetHeight) + frei(inh) - 1, (kidsA.length ? 125 : 175) * MM);   /* ab der Höhe des Textes wächst der Block wirklich */
        var setzeH = function (x) { fuss.style.setProperty('--fh', x.toFixed(1) + 'px'); };
        setzeH(ziel);
        if (kidsA.length && ziel > 82 * MM) { fuss.classList.add('bl-fuss--gross'); if (!passt(inh)) fuss.classList.remove('bl-fuss--gross'); }   /* breites Porträt nur, wenn der Text daneben noch Platz hat */
        for (var t = 0; t < 60 && !passt(inh) && ziel > h0; t++) { ziel = Math.max(h0, ziel - 2 * MM); setzeH(ziel); }
        luft(5); f = frei(inh);   /* was der Schluss nicht nimmt, wird Luft zwischen den Punkten */
      }
      if (gast && !ende && f >= 46 * MM) {
        var sicht = (f - 8 * MM) / (1.25 * (inh.clientWidth - 12 * MM));   /* welcher Teil der Bildhöhe im Streifen zu sehen ist */
        var foto = pool.filter(function (x) { return benutzt.indexOf(x) < 0 && sicht >= (MINDEST[x] || 0.62); })[0];
        if (foto) { benutzt.push(foto); el = document.createElement('figure'); el.className = 'bl-fuellbild'; el.innerHTML = '<img src="/angelina-strelow/werkzeuge/assets/bild/' + foto + '-1000.webp" alt="" decoding="sync"' + ((GESICHT[foto] || FOKUS[foto]) ? ' style="object-position:50% ' + (GESICHT[foto] || FOKUS[foto]) + '%"' : '') + '>'; }
      }
      if (gast && !ende && !el && f >= 24 * MM) { el = document.createElement('div'); el.className = 'bl-satz'; el.innerHTML = '<i class="bl-strich"></i><p>' + hd(SAETZE[satzNr++ % SAETZE.length]) + '</p>' + (f >= 40 * MM ? '<img src="/angelina-strelow/werkzeuge/assets/zeichen/siegel-berry.svg" alt="">' : ''); }
      if (!gast && f >= 50 * MM) {   /* Prüfung 6 (5): ein Notizfeld nur mit mindestens vier Linien */ el = document.createElement('div'); el.className = 'bl-notizen'; el.innerHTML = '<h2>Notizen am Abend</h2>'; }
      if (el) {
        inh.insertBefore(el, vor);
        if (el.classList.contains('bl-fuellbild')) { el.style.height = '10px'; el.style.height = (frei(inh) + 10 - 2).toFixed(1) + 'px'; }
        if (el.classList.contains('bl-notizen')) { var z = Math.floor((frei(inh)) / (8 * MM)); for (var q = 0; q < z; q++) el.appendChild(document.createElement('i')); }
        f = frei(inh);
      }
      /* Rest zwischen die Abschnitte: der erste oben, der letzte unten; steht nur einer da, wächst seine Luft weiter, bis er die Seite füllt */
      var kids = [].filter.call(inh.children, function (c) { return c !== ende; });
      if (f > 1 && kids.length === 1 && !ende) { luft(gast ? 11 : 4); f = frei(inh); }
      if (f > 0.5 && kids.length + (ende ? 1 : 0) > 1) {
        var g = f / (kids.length - 1 + (ende ? 1 : 0));
        if (ende) ende.style.setProperty('margin-top', g.toFixed(1) + 'px', 'important');
        kids.slice(1).forEach(function (c) { c.style.marginTop = ((parseFloat(getComputedStyle(c).marginTop) || 0) + g).toFixed(1) + 'px'; });
      }
    });
  }
  function schriften() {
    return Promise.all(['400 12px "Angelina Hand"', '400 12px "Della Respira"', '300 12px "Montserrat Blatt"', '400 12px "Montserrat Blatt"', '500 12px "Montserrat Blatt"'].map(function (f) { return document.fonts.load(f).catch(function () { return null; }); })).then(function () { return document.fonts.ready; });
  }
  function bilder() { return Promise.all([].map.call(document.images, function (i) { return i.complete ? 0 : new Promise(function (r) { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); }); })); }

  /* ---------------------------------------------------------------- Druck */
  if (q.get('druck')) {
    fetch('/angelina-strelow/werkzeuge/api/abende', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('Daten ' + r.status); return r.json(); }).then(function (j) {
      var a = j.abende.filter(function (x) { return x.id === q.get('id'); })[0];
      if (!a || !a.plan) throw new Error('Diesen Plan gibt es nicht.');
      var d = { abend: a, plan: a.plan }, art = q.get('art') === 'arbeit' ? 'arbeit' : 'gastgeber';
      document.title = (art === 'arbeit' ? 'Arbeitsblatt' : 'Dein Abend') + ' · ' + ((a.gastgeber || {}).name || '') + ' · ' + datumKurz((a.anfrage || {}).datum);
      document.body.className = 'druck';
      return schriften().then(function () { var b = setze(d, art); return bilder().then(function () { return b; }); });
    }).then(function (b) { window.AP_FERTIG = b; document.documentElement.dataset.fertig = '1'; })
      .catch(function (e) { window.AP_FEHLER = String(e && e.stack || e); });
    return;
  }

  /* ---------------------------------------------------------------- Handy: Arbeitsblatt für unterwegs */
  if (document.body.classList.contains('handy')) {
    var zeigeHandy = function () {
      fetch('/angelina-strelow/werkzeuge/api/abende', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
        var id = location.hash.slice(1), ab = j.abende.filter(function (x) { return x.plan && ['zugesagt', 'geplant', 'vorbei', 'abgeschlossen'].indexOf(x.status) >= 0; });
        var a = ab.filter(function (x) { return x.id === id; })[0], S = document.getElementById('seiten');
        if (!a) {
          var heute = new Date().toISOString().slice(0, 10), k = ab.filter(function (x) { return (x.anfrage || {}).datum >= heute; });
          document.title = 'Arbeitsblatt · Angelina Strelow';
          S.innerHTML = '<header class="hd-kopf"><img class="bl-logo" src="/angelina-strelow/werkzeuge/assets/zeichen/wortmarke-night.svg" alt="Angelina Strelow"><p class="bl-vers">Arbeitsblatt am Handy</p><h1 class="bl-titel">Welcher Abend?</h1></header>'
            + '<ul class="hd-wahl">' + (k.length ? k : ab).map(function (x) { return '<li><a href="#' + x.id + '"><b>' + h((x.gastgeber || {}).name) + '</b><span>' + h(datumLang((x.anfrage || {}).datum)) + ' · ' + h((x.anfrage || {}).anlass) + '</span></a></li>'; }).join('') + '</ul>';
          return;
        }
        document.title = 'Arbeitsblatt · ' + (a.gastgeber || {}).name;
        S.innerHTML = '<p class="hd-zurueck"><a href="#">Alle Abende</a></p>' + bloeckeArbeit({ abend: a, plan: a.plan }).map(function (b) { return b.html; }).join('');
        window.scrollTo(0, 0);
      }).catch(function () { document.getElementById('seiten').innerHTML = '<p class="hd-fehler">Der Plan ist gerade nicht erreichbar. Läuft der Abendplan auf diesem Rechner?</p>'; });
    };
    window.addEventListener('hashchange', zeigeHandy); zeigeHandy();
    return;
  }

  function an(art, x) { parent.postMessage(Object.assign({ ap: art }, x), location.origin); }

  /* ---------------------------------------------------------------- Mini (Fenster «So steht es auf dem Blatt») */
  if (q.get('mini')) {
    document.body.className = 'mini';
    window.addEventListener('message', function (ev) {
      if (ev.origin !== location.origin || !ev.data || ev.data.ap !== 'mini') return;
      var m = ev.data, d = JSON.parse(JSON.stringify(m.daten)), p = d.plan;
      var arr = p[m.l] || [], i = arr.map(function (x) { return x.id; }).indexOf(m.x.id); if (i >= 0) arr[i] = m.x; else arr.push(m.x);
      var art = m.l === 'gaeste' || (m.l === 'ablauf' && m.x.intern) ? 'arbeit' : m.art, k = m.l + '.' + m.x.id;
      var B = bloecke(d, art).filter(function (b) { return b.k === k || (b.ids && b.ids.indexOf(k) >= 0) || (m.l === 'gaeste' && b.k === 'gaeste' && art !== 'arbeit' && !b.ids); });
      if (!B.length && m.l === 'weine') B = bloecke(d, 'arbeit').filter(function (b) { return b.k === k; });
      schriften().then(function () {
        var S = document.getElementById('seiten');
        S.innerHTML = '<section class="blatt blatt--' + art + ' blatt--mini"><div class="inhalt">' + B.map(function (b) { return b.html; }).join('') + '</div></section>';
        [].forEach.call(S.querySelectorAll('.bl-qs > [data-k]'), function (e) { if (e.dataset.k !== k) e.remove(); });
        var ziel = S.querySelector('[data-k="' + k + '"]');
        [].forEach.call(S.querySelectorAll('.bl-karte > .bl-gang, .bl-karte > .bl-rund, .bl-karte__kopf'), function (e) { if (!ziel || (e !== ziel && !e.contains(ziel))) e.remove(); });
        var bl = S.firstElementChild, w = bl.getBoundingClientRect().width, cw = document.documentElement.clientWidth, z = Math.min(1.2, (cw - 16) / w);
        bl.style.transformOrigin = '0 0'; bl.style.transform = 'translate(' + ((cw - w * z) / 2).toFixed(1) + 'px,8px) scale(' + z.toFixed(4) + ')';
        an('mini-hoehe', { h: Math.ceil(bl.offsetHeight * z + 16) });
      });
    });
    return;
  }

  /* ---------------------------------------------------------------- Vorschau im Werkzeug */
  /* Verkleinern mit transform, nie mit CSS-zoom (zoom bricht anders um, 15.10.2026): gesetzt und gemessen wird in Originalgrösse */
  function zoomen() {
    var vw = document.documentElement.clientWidth;
    [].forEach.call(document.querySelectorAll('.blatt'), function (b) {
      var w = 210 * MM, hh = b.offsetHeight, z = Math.max(0.25, Math.min(ZOOM, (vw - 16) / w)), off = Math.max(0, (vw - w * z) / 2);
      b.style.transformOrigin = '0 0';
      b.style.transform = 'translateX(' + off.toFixed(1) + 'px) scale(' + z.toFixed(4) + ')';
      b.style.margin = '0 0 ' + (-(hh * (1 - z)) + 26).toFixed(1) + 'px 0';
    });
  }
  function blitz(k, y) {
    var el = document.querySelector('[data-k="' + k + '"]') || document.querySelector('[data-k^="' + k.split('.')[0] + '"]');
    if (!el) return;
    var r = el.getBoundingClientRect(), ziel = y == null ? r.top + scrollY - 30 : r.top + scrollY + r.height / 2 - y;
    window.scrollTo({ top: Math.max(0, ziel), behavior: 'smooth' });
    [].forEach.call(document.querySelectorAll('.blitz'), function (x) { x.classList.remove('blitz'); });
    void el.offsetWidth; el.classList.add('blitz');
  }
  window.addEventListener('message', function (ev) {
    if (ev.origin !== location.origin || !ev.data || !ev.data.ap) return;
    var m = ev.data;
    if (m.ap === 'hallo') return an('bereit', {});   /* Handschlag (Schlössli 19.10.2026) */
    if (m.ap === 'setze') {
      ZOOM = m.zoom || ZOOM; document.body.className = 'vorschau';
      var neu = !LETZT || LETZT.id !== m.daten.abend.id || LETZT.art !== m.art; LETZT = { id: m.daten.abend.id, art: m.art };
      var y = scrollY;
      schriften().then(function () {
        var b = setze(m.daten, m.art); zoomen();
        if (neu) { window.scrollTo(0, 0); var S = document.getElementById('seiten'); S.classList.remove('kt-auf'); void S.offsetWidth; S.classList.add('kt-auf'); } else window.scrollTo(0, y);
        an('gesetzt', { bericht: b });
      });
    }
    if (m.ap === 'zoom') { ZOOM = m.zoom; zoomen(); }
    if (m.ap === 'blitz') blitz(m.k, m.y);
  });
  document.addEventListener('click', function (ev) { var e = ev.target.closest('[data-k]'); if (e) an('klick', { k: e.dataset.k }); });
  document.addEventListener('dblclick', function (ev) { var e = ev.target.closest('[data-k]'); if (e) an('doppel', { k: e.dataset.k }); });
  document.addEventListener('keydown', function (ev) { if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 's') { ev.preventDefault(); an('taste', { was: 'speichern' }); } });
  window.addEventListener('resize', zoomen);
  an('bereit', {});
})();

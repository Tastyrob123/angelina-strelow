/* Nach dem Abend · Satz der Unterlagen (05.11.2026): Erinnerungs-Mappe (A4 hoch), Dankeskarte (A6 quer, vorn und hinten), Dank als Brief (A4).
   Ein Satz für Vorschau im Werkzeug, Druckseite und PDF (Master 2.5: «ein JS-Satz setzt Vorschau, Probe-PDF und Druck, deshalb sind sie gleich»), Vorbild brief-pdf.js des Gästebuchs.
   Ein Logo je Unterlage, immer das Original (Fehlerbuch 10a, 28.10.2026): ihr ganzes Logo (Wortmarke mit «Exklusive Gastgeberin») aus /assets/zeichen/ganz-night.svg.
   Sperrung im Druck höchstens .08em (Fehlerbuch 10a, pdftotext). Liest Abendplan (plan) und Tischkarten (tisch) nur, schreibt nichts.
   DRUCK.seiten(art, abend, foto) → HTML der Seiten · foto(f) → Adresse eines Fotos (haus: /assets/bild/…, eigen: data:-Adresse). */
(function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  /* Emoji stehen in keiner Druckschrift des Hauses (im PDF würden sie zu Type-3-Bildern, Fehlerbuch 10a): im Druck fallen sie weg, das Werkzeug sagt es beim Dank */
  const ohneEmoji = t => String(t == null ? '' : t).replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\uFE0F\u200D]/gu, '').replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+([,.;:!?])/g, '$1').replace(/[ \t]+$/gm, '');   // was vor einem Zeichen stand, rückt nach («Liebe Elke 😊,» → «Liebe Elke,»)
  const zeilen = t => esc(ohneEmoji(t)).replace(/\n/g, '<br>');
  const LOGO = '<img class="dr-logo" src="/angelina-strelow/werkzeuge/assets/zeichen/ganz-night.svg" alt="Angelina Strelow · Exklusive Gastgeberin">';
  const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const tag = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
  const datumLang = iso => { const d = tag(iso); return d ? d.getDate() + '. ' + MONATE[d.getMonth()] + ' ' + d.getFullYear() : ''; };
  const wochentag = iso => { const d = tag(iso); return d ? TAGE[d.getDay()] : ''; };
  const ihrForm = name => / (und|&|\+|u\.) |^familie /i.test(name || '');   // Paare und Familien: ihr
  /* Vorname(n) aus dem, was Gastgeber oder Angelina eingetragen haben (Prüfung 2, N5): Titel fallen weg («Dr. Markus Wendt» → «Markus»),
     Paare bleiben beide («Klaus & Tanja» → «Klaus und Tanja»), «Wendt, Markus» → «Markus». Steht nirgends ein Vorname
     («Herr und Frau Schäfer»), bleibt die höfliche Form ganz; erfunden oder abgeschnitten wird nichts. */
  const TITEL = /^(dr|prof|dipl|ing|med|mag|mba|msc|bsc|llm|rer|nat|phil|jur|habil)\.?$/i, ANREDE = /^(herr|herrn|frau|hr\.?|fr\.?)$/i;
  const vorname = name => {
    name = String(name || '').replace(/\s+/g, ' ').trim();
    if (!name || /^familie /i.test(name)) return name;
    if (!/ (und|&|\+|u\.) /i.test(name) && name.includes(',')) { const [nach, vor] = name.split(',').map(x => x.trim()); if (vor) name = vor + ' ' + nach; }
    const leute = name.split(/ (?:und|&|\+|u\.) /i).map(x => {
      const w = x.split(' ').filter(t => t && !TITEL.test(t) && !(/\./.test(t) && t.length > 3 && !ANREDE.test(t)));
      if (ANREDE.test(w[0] || '')) return { vor: w.length > 2 ? w[1] : '', ganz: w.join(' ') };   // «Frau Elke Wagner» → Elke, «Frau Schäfer» ohne Vorname
      return { vor: w[0] || '', ganz: w.join(' ') };
    }).filter(x => x.ganz);
    if (!leute.some(x => x.vor)) return leute.map(x => x.ganz).join(' und ');
    return leute.map(x => x.vor || x.ganz).join(' und ');
  };
  const ART_WEIN = { sekt: 'Zum Empfang', weiss: 'Weisswein', rose: 'Rosé', rot: 'Rotwein', suess: 'Süsswein', alkoholfrei: 'Alkoholfrei', wasser: 'Wasser', digestif: 'Zum Ausklang' };

  /* Menü und Weine aus dem Abendplan (abendplan/DATEN.md): plan.gaenge[{id,name,gericht,beschreibung,koch}], plan.weine[{zu,art,name,weingut,jahrgang,herkunft}].
     Fehlt der Plan, steht nur, was der Gastgeber in der Anfrage selbst geschrieben hat (nichts erfunden).
     Gesetzt als Folge wie auf ihrer Menükarte (06.11.2026): je Gang die Bezeichnung klein, das Gericht gross in Della Respira, darunter der Wein; zwischen den Gängen ihre Raute. */
  function menue(a) {
    const p = a.plan || {}, g = (p.gaenge || []).filter(x => x && x.gericht), w = (p.weine || []).filter(x => x && x.name);
    const alleG = (p.gaenge || []).filter(Boolean), koecheAlle = [...new Set(alleG.map(x => (x.koch || '').trim()).filter(Boolean))];
    const weinZu = id => w.filter(x => x.zu === id);
    const weinZeile = x => `<p class="dr-wein">${esc(x.name)}${x.weingut ? '<span> · ' + esc(x.weingut) + '</span>' : ''}${x.jahrgang ? '<span> · ' + esc(x.jahrgang) + '</span>' : ''}</p>`;
    if (!g.length) {   /* ohne Gerichte keine eigene Seite (nie halbleer, nie ein Hinweis an Angelina im Dokument des Gastgebers); was belegt ist, steht als eine Zeile auf Seite 1 */
      const zahl = ['', 'Ein Gang', 'Zwei Gänge', 'Drei Gänge', 'Vier Gänge', 'Fünf Gänge', 'Sechs Gänge'][alleG.length] || '';
      const sekt = weinZu('empfang')[0];
      const kurz = [sekt ? sekt.name : '', zahl ? zahl + (koecheAlle.length && !/^caterer$/i.test(koecheAlle.join('')) ? ', gekocht von ' + koecheAlle.join(' und ') : '') : ''].filter(Boolean).join(' · ');
      return { da: false, html: '', kurz };
    }
    const empfang = weinZu('empfang');
    let h = empfang.length ? `<div class="dr-gang dr-gang--empfang"><p class="dr-gang__n">Empfang</p>${empfang.map(weinZeile).join('')}</div>` : '';
    h += g.map(x => `<div class="dr-gang"><p class="dr-gang__n">${esc(x.name || '')}</p><p class="dr-gang__g">${esc(x.gericht || '')}</p>${x.beschreibung ? `<p class="dr-gang__b">${esc(x.beschreibung)}</p>` : ''}${weinZu(x.id).map(weinZeile).join('')}</div>`).join('');
    const aus = weinZu('digestif');
    if (aus.length) h += `<div class="dr-gang dr-gang--aus"><p class="dr-gang__n">Zum Ausklang</p>${aus.map(weinZeile).join('')}</div>`;
    const koeche = [...new Set(g.map(x => (x.koch || '').trim()).filter(Boolean))];
    const namen = (p.gaeste || []).map(x => x && (x.name || '').trim()).filter(Boolean);
    const koch = koeche.length ? `<p class="dr-koch">${/^caterer$/i.test(koeche.join('')) ? 'Mit Liebe zubereitet und serviert' : 'Gekocht von ' + esc(koeche.join(' und '))}</p>` : '';
    /* Gäste sind ein eigener Abschnitt (Robert 06.11.2026: kein Abschnitt bricht über eine Seite): sie stehen unter dem Menü oder ganz auf eigener Seite */
    const gaeste = namen.length ? `<div class="dr-gaeste"><p class="dr-gang__n">Am Tisch</p><p class="dr-gaeste__namen">${namen.map(x => `<span class="dr-name">${esc(x)}</span>`).join('<span class="dr-punkt"> · </span>')}</p></div>` : '';   // ein Name bricht nie um
    return { da: true, html: h, koch, gaeste };
  }
  function felder(a) {   // Felder der Bausteine aus Kern und Abendplan; nur, was wirklich da ist
    const k = a.gastgeber || {}, an = a.anfrage || {}, p = a.plan || {}, g = (p.gaenge || []).filter(x => x && x.gericht);
    const haupt = g.find(x => /haupt/i.test(x.name || '')) || g[Math.min(1, g.length - 1)];
    const wein = (p.weine || []).find(x => x && x.name && haupt && x.zu === haupt.id) || (p.weine || []).find(x => x && x.name && !/wasser/.test(x.art || ''));
    const sekt = (p.weine || []).find(x => x && x.zu === 'empfang');
    const w = an.wunsch || '', ih = ihrForm(k.name), hz = w.match(/(\d+)\.\s*Hochzeitstag/), gb = w.match(/(\d+)\.\s*Geburtstag/);
    const anlass = hz ? 'euren ' + hz[1] + '. Hochzeitstag' : /hochzeitstag/i.test(w) ? 'euren Hochzeitstag' : gb ? 'den ' + gb[1] + '. Geburtstag' : /gänse/i.test(w) ? (ih ? 'euer' : 'dein') + ' Gänseessen' : '';
    return {
      vorname: vorname(k.name), datum: datumLang(an.datum), wochentag: wochentag(an.datum), ort: (an.ort || '').trim(), anlass,
      gericht: haupt ? haupt.gericht : '', koch: haupt && !/^(caterer|gastgeber|catering)$/i.test((haupt.koch || '').trim()) ? (haupt.koch || '').trim() : '', wein: wein ? wein.name : '', sekt: sekt ? sekt.name : '', titel: p.titel || '', jahr: an.datum ? an.datum.slice(0, 4) : ''
    };
  }
  function fuellen(t, f) { return String(t || '').replace(/\{(\w+)\}/g, (m, k) => f[k] != null && f[k] !== '' ? f[k] : m); }
  function offen(t) { return /\{\w+\}/.test(t || ''); }

  /* Gestaltung 06.11.2026 (Robert: «Das muss viel schöner aussehen»): Massstab ihre Mappen und Drucksachen (beigaben/mappen, beigaben/drucksachen).
     Dunkle Seiten Night mit ihrer Tapete, helle Salt; Fotos gross und ungeschnitten (nie breiter als ihre Auflösung trägt), innen ihre feine Rahmenlinie;
     Siegel und ganzes Logo im Original; Della Respira gross, Montserrat in den festen Schnitten; viel Luft. Inhalt und Daten wie vorher.
     Prüfung 6 und Robert 06.11.2026 (Fehlerbuch 10a): kein Abschnitt bricht über eine Seite. Menü, Gäste und Brief stehen ganz; jede Seite wird um ihre
     Abschnitte gesetzt, bei Überlänge eigene Seiten mit eigenem Kopf. Jedes Dokument an den Gastgeber endet mit einem gestalteten Schluss:
     Gruss, Unterschrift (ihre echte als Bild, sonst Pinyon Script aus ihrer Marke), Porträt mit ihrer Linie, Siegel. */
  const Z = '/angelina-strelow/werkzeuge/assets/zeichen/';
  const SIEGEL = f => `<img class="dr-siegel" src="${Z}siegel-${f}.svg" alt="">`;
  const LOGO_SAND = `<img class="dr-logo" src="${Z}ganz-sand.svg" alt="Angelina Strelow · Exklusive Gastgeberin">`;
  const FUSS = '<footer class="dr-fuss"><span>Angelina Strelow · Exklusive Gastgeberin</span><span class="dr-nr"></span></footer>';
  const PORTRAET = '/angelina-strelow/werkzeuge/assets/bild/raum-1000.webp';   // Angelina im Smoking am Fenster (Titel ihrer Leistungsmappe)
  let UNTERSCHRIFT = '';   // Adresse ihrer hinterlegten Unterschrift (Sammlung nachher-sammlung → unterschrift), leer = Schreibschrift
  const unterschrift = (kl = '') => UNTERSCHRIFT ? `<img class="dr-sig dr-sig--bild ${kl}" src="${esc(UNTERSCHRIFT)}" alt="Angelina">` : `<p class="dr-sig ${kl}">Angelina</p>`;
  function seite(inhalt, kl = '', fuss = true) {
    return `<section class="dr-seite ${kl}"><div class="dr-rahmen"></div><div class="dr-koerper">${inhalt}</div>${fuss ? FUSS : ''}</section>`;
  }
  function nummern(wurzel) {   // Seitenzahl auf jeder Seite mit Fuss, gezählt über alle Blätter der Unterlage
    const alle = wurzel.querySelectorAll('.dr-seite'); alle.forEach((x, i) => { const nr = x.querySelector('.dr-nr'); if (nr) nr.textContent = 'Seite ' + (i + 1) + ' von ' + alle.length; });
  }
  const GRUSS_SATZ = 'Danke, dass ich dabei sein durfte.';
  const bild = (f, foto, kl = '') => `<figure class="dr-foto ${kl}"><img src="${esc(foto(f))}" alt="${esc(f.titel || '')}" decoding="sync"></figure>`;
  const bildzeile = f => f.titel ? `<p class="dr-bildzeile">${esc(f.titel)}</p>` : '';
  function mappe(a, foto, satzText) {
    const n = a.nachher || {}, m = n.mappe || {}, an = a.anfrage || {}, g = a.gastgeber || {};
    const fotos = (n.fotos || []).filter(x => x.mappe && x.freigabe !== 'privat');
    const titel = m.titel || (a.plan && a.plan.titel) || an.anlass || 'Dein Abend';
    const me = menue(a), erst = fotos[0], rest = fotos.slice(1), mono = (a.tisch || {}).monogramm;   // jedes gewählte Foto kommt hinein (Prüfung 6, N13)
    const s = [];
    /* 1 Deckblatt: Night mit Tapete, das erste Foto gross, Für …, Titel, Tag und Ort, ihr Satz, ihr Logo */
    s.push(seite(`<div class="dr-deck${erst ? '' : ' dr-deck--ohne'}">${erst ? bild(erst, foto, 'dr-foto--deck') : SIEGEL('sand')}
      <div class="dr-deck__text">${mono ? `<p class="dr-mono">${esc(mono)}</p>` : ''}<p class="dr-etikett">Für ${esc(g.name || '')}</p><h1>${esc(titel)}</h1>
      <p class="dr-wann">${esc([wochentag(an.datum), datumLang(an.datum)].filter(Boolean).join(', '))}${an.ort ? '<span class="dr-punkt"> · </span>' + esc(an.ort) : ''}</p>
      ${me.kurz ? `<p class="dr-kurz">${esc(me.kurz)}</p>` : ''}${satzText ? `<p class="dr-satz">${esc(ohneEmoji(satzText))}</p>` : ''}</div>${LOGO_SAND}</div>`, 'dr-a4 dr-dunkel dr-pass', false));
    /* 2 Menü und Weine als gesetzte Folge; die Gäste darunter oder auf eigener Seite (einpassen entscheidet) */
    if (me.html) s.push(seite(`<div class="dr-menue">${SIEGEL('berry')}<p class="dr-etikett">Das Menü und die Weine</p><h2>Der Abend</h2><div class="dr-gaenge">${me.html}</div>${me.koch}${me.gaeste}</div>`, 'dr-a4 dr-hell dr-menue-seite'));
    /* 3 Bilder des Abends (Robert 06.11.2026; Prüfung 7, N14): je Seite eine feste Anordnung für ihre Fotozahl, die die Seite ganz füllt, die Bildzeile direkt
       darunter, ein Kopf je Seite, ein feiner Trenner unter dem Titel. Höchstens sechs je Seite, gleichmässig auf die Seiten verteilt. */
    const zahl = Math.ceil(rest.length / 6), je = Array.from({ length: zahl }, (_, i) => Math.floor(rest.length / zahl) + (i < rest.length % zahl ? 1 : 0));
    let i = 0;
    je.forEach((c, nr) => {
      const teil = rest.slice(i, i + c); i += c;
      s.push(seite(`<div class="dr-galerie"><div class="dr-galerie__kopf"><p class="dr-etikett">Bilder des Abends${zahl > 1 ? ` · ${nr + 1} von ${zahl}` : ''}</p>${nr === 0 ? '<h2>Was bleibt</h2>' : ''}</div>
        <div class="dr-raster">${teil.map(f => `<figure class="dr-bild"${f.quelle === 'haus' ? ` data-fokus="${esc(f.datei)}"` : ''}><div class="dr-bild__b"><img src="${esc(foto(f))}" alt="${esc(f.titel || '')}" decoding="sync"></div>${f.titel ? `<figcaption>${esc(f.titel)}</figcaption>` : ''}</figure>`).join('')}</div></div>`, 'dr-a4 dr-hell dr-galerie-seite'));
    });
    /* 4 Schluss: Siegel, ihr Porträt mit ihrer Linie, ihr Dank (steht er schon auf Seite 1, nicht noch einmal), Unterschrift, Name */
    const dank = String(satzText || '').includes(GRUSS_SATZ) ? '' : GRUSS_SATZ;
    s.push(seite(`<div class="dr-schluss">${SIEGEL('sand')}<figure class="dr-foto dr-schluss__bild"><img src="${PORTRAET}" alt="Angelina Strelow" decoding="sync"></figure>
      <div class="dr-schluss__mitte">${dank ? `<p class="dr-schluss__satz">${dank}</p>` : ''}${unterschrift('dr-sig--hell')}<p class="dr-etikett">Angelina Strelow · Exklusive Gastgeberin</p></div></div>`, 'dr-a4 dr-dunkel dr-pass', false));
    return s.join('');
  }
  /* Dankeskarte (Robert 06.11.2026: «Das Konzept verstehe ich nicht … das sieht sonst einfach viel zu basic aus»): vorn aus einem Guss, das Foto des Abends
     über die ganze Karte mit ihrer Linie, darin ihr Schild in Night: Siegel, ihr Satz, Tag, Wortmarke. Ohne Foto Night mit Tapete. Hinten Salt: Porträt mit
     ihrer Linie, daneben mittig Wortmarke, die Zeilen, Unterschrift, Siegel. */
  function karte(a, foto, vornText) {
    const n = a.nachher || {}, k = (n.dank || {}).karte || {}, an = a.anfrage || {};
    const f = (n.fotos || []).find(x => x.id === k.foto) || (n.fotos || [])[0];
    return `<section class="dr-seite dr-a6 dr-karte-vorn dr-dunkel${f ? '' : ' dr-karte-vorn--ohne'}">${f ? `<figure class="dr-karte-bild"><img src="${esc(foto(f))}" alt="${esc(f.titel || '')}" decoding="sync"></figure>` : ''}
        <div class="dr-karte-schild">${SIEGEL('sand')}<p class="dr-karte-satz">${esc(ohneEmoji(vornText))}</p><p class="dr-wann">${esc(datumLang(an.datum))}</p><img class="dr-wortmarke" src="${Z}wortmarke-sand.svg" alt="Angelina Strelow"></div><div class="dr-rahmen"></div></section>
      <section class="dr-seite dr-a6 dr-karte-hinten dr-hell dr-pass"><div class="dr-rahmen"></div><div class="dr-koerper">
        <figure class="dr-foto dr-karte-portraet"><img src="${PORTRAET}" alt="Angelina Strelow" decoding="sync"></figure>
        <div class="dr-karte-rechts"><img class="dr-wortmarke" src="${Z}wortmarke-night.svg" alt="Angelina Strelow"><div class="dr-karte-zeilen"><p>${zeilen(k.zeilen || '')}</p></div>${unterschrift()}${SIEGEL('berry')}</div></div></section>`;
  }
  /* Der Gruss am Ende des Briefs («Herzlich\nAngelina», «Alles Liebe\nAngelina») wird zum gestalteten Schluss: Gruss, Unterschrift, Name, Porträt, Siegel */
  const GRUSS = /\n*\s*((?:herzlich|herzliche grüsse|herzliche grüße|alles liebe|liebe grüsse|liebe grüße|viele grüsse|viele grüße|bis bald|in vorfreude|danke)[^\n]{0,40})\s*\n\s*angelina\s*$/i;
  function brief(a, text) {
    const g = a.gastgeber || {}, an = a.anfrage || {}, heute = new Date(), iso = heute.getFullYear() + '-' + String(heute.getMonth() + 1).padStart(2, '0') + '-' + String(heute.getDate()).padStart(2, '0');
    let t = String(text || '').replace(/\s+$/, ''), gruss = '';
    const m = GRUSS.exec(t); if (m) { gruss = m[1].trim(); t = t.slice(0, m.index); } else t = t.replace(/\n+\s*angelina\s*$/i, '');
    const abs = t.split(/\n{2,}/).map(x => x.trim()).filter(Boolean);
    return `<section class="dr-seite dr-a4 dr-brief-seite"><div class="dr-rahmen"></div><div class="dr-koerper"><div class="dr-brief">
      <header class="dr-brief__kopf">${LOGO}<dl class="dr-an"><div><dt>An</dt><dd>${esc(g.name || '')}${an.ort ? `<small>${esc(an.ort)}</small>` : ''}</dd></div><div><dt>Von</dt><dd>Angelina Strelow<small>Köln, ${esc(datumLang(iso))}</small></dd></div></dl></header>
      <div class="dr-brief__text">${abs.map(p => `<p>${zeilen(p)}</p>`).join('')}</div>
      <div class="dr-brief__schluss"><div class="dr-brief__gruss">${gruss ? `<p class="dr-gruss">${esc(ohneEmoji(gruss))}</p>` : ''}${unterschrift('dr-sig--brief')}<p class="dr-etikett">Angelina Strelow · Exklusive Gastgeberin</p>${SIEGEL('berry')}</div>
        <figure class="dr-foto dr-portraet"><img src="${PORTRAET}" alt="Angelina Strelow" decoding="sync"></figure></div>
    </div></div>${FUSS}</section>`;
  }
  /* Della Respira hat kein ’ ‚ ” „ … (06.11.2026 mit fontTools gelesen): in ihren Zeilen werden daraus ihre Zeichen (« » ‹ › ' ...), statt dass der Browser
     für ein Zeichen eine fremde Schrift nimmt (Georgia im PDF). Was dann noch fehlt, setzt Montserrat (Schriftfolge in druck.css). */
  function glyphen(wurzel) {
    const zu = t => t.replace(/(\p{L})[’'](\p{L})/gu, "$1'$2").replace(/(^|[\s(\[–—-])[„“”"]/gu, '$1«').replace(/[„“”"]/g, '»')
      .replace(/(^|[\s(\[–—-])[‚‘’]/gu, '$1‹').replace(/[‚‘’]/g, '›').replace(/…/g, '...');
    wurzel.querySelectorAll('.dr-seite *').forEach(e => { if (!/^["']?Della/.test(getComputedStyle(e).fontFamily)) return;
      e.childNodes.forEach(t => { if (t.nodeType === 3 && /[’‚”„“‘"…]/.test(t.nodeValue)) t.nodeValue = zu(t.nodeValue); }); });
  }
  const voll = k => k.scrollHeight > k.clientHeight + 1 || k.scrollWidth > k.clientWidth + 1;
  const passt = x => { const k = x.querySelector('.dr-koerper'); if (voll(k)) return false;   // dazu auf den halben Pixel: scrollHeight rundet einen Überstand unter 1 px weg
    const r = k.getBoundingClientRect(); return [...k.querySelectorAll('p,h1,h2,img,figure,dd,dt')].every(e => { const b = e.getBoundingClientRect(); return !b.height || b.bottom <= r.bottom + .5; }); };
  const kVon = x => +(x.style.getPropertyValue('--k') || 1);
  function enger(x, bis = .72) {   // eine Seite enger setzen (--k), bis nichts übersteht; true = passt
    let k = 1; x.style.removeProperty('--k');
    while (!passt(x) && k > bis + .001) { k = Math.round((k - .02) * 100) / 100; x.style.setProperty('--k', k); }
    return passt(x);
  }
  const gleichEng = seiten => { const k = Math.min(...seiten.map(kVon)); seiten.forEach(x => k < 1 ? x.style.setProperty('--k', k) : x.style.removeProperty('--k')); };
  /* Einpassen nach dem Laden der Schriften und Bilder (Druckseite und Vorschau, derselbe Satz). Deckblatt und Karte enger, wenn nötig.
     Menü: erst eine Spalte (bis 80 %); passt es nicht, bekommen die Gäste ihre eigene Seite «Am Tisch»; dann zwei Spalten (bis 72 %); nur wenn ein Menü
     auch so nicht passt, eigene Menüseiten mit eigenem Kopf, geteilt zwischen zwei Gängen und benannt («Von Vorspeise bis Suppe»). Danach Seitenzahlen. */
  function einpassen(wurzel) {
    glyphen(wurzel);
    wurzel.querySelectorAll('.dr-pass').forEach(x => enger(x));
    const ms = wurzel.querySelector('.dr-menue-seite');
    if (ms && !enger(ms, .8)) {
      const gaeste = ms.querySelector('.dr-gaeste');
      if (gaeste) {
        const h = document.createElement('div'); h.innerHTML = seite(`<div class="dr-tisch">${SIEGEL('berry')}<p class="dr-etikett">Das Menü und die Weine</p><h2>Am Tisch</h2></div>`, 'dr-a4 dr-hell dr-tisch-seite');
        const ts = h.firstElementChild, tisch = ts.querySelector('.dr-tisch'), mitte = document.createElement('div'); mitte.className = 'dr-tisch__mitte'; tisch.appendChild(mitte); mitte.appendChild(gaeste);
        /* die Seite bekommt ein Foto des Abends dazu (das letzte der Bildseiten; wird eine Bildseite dabei leer, fällt sie weg) */
        const bilder = [...wurzel.querySelectorAll('.dr-raster .dr-bild')], f = bilder[bilder.length - 1];
        if (f) { const r = f.parentNode; mitte.appendChild(f); f.classList.add('dr-bild--tisch'); if (!r.children.length) r.closest('.dr-seite').remove(); }
        else tisch.classList.add('dr-tisch--ohne');
        if (gaeste.querySelectorAll('.dr-name').length > 10) tisch.classList.add('dr-tisch--zwei'); ms.after(ts); enger(ts);
      }
      if (!enger(ms, .8)) { ms.classList.add('dr-zwei'); if (!enger(ms, .72)) { ms.classList.remove('dr-zwei'); teileMenue(ms); } }
    }
    raster(wurzel);
    nummern(wurzel);
  }
  /* Bildseiten: Spalten (1 bis 3) und Bildbreite so, dass das Raster die Seite ruhig füllt; Bildzeile mit 11 mm eingerechnet, Abstand 8 mm */
  /* Bildseiten (Prüfung 7, N14; Prüfung 8, N15): die Fotos stehen in Zeilen. Jede Zeile füllt die Breite, alle Zeilen zusammen die Höhe des Satzspiegels.
     Gesucht wird die Aufteilung in Zeilen (Reihenfolge bleibt), bei der die Felder dem Seitenverhältnis der Fotos am nächsten kommen. Beschnitten wird nur so
     weit, dass die Menschen ganz im Feld bleiben (FOKUS aus fokus.js: alle erkannten Personen und Gesichter; von oben bis drei Viertel der Personenhöhe);
     Fotos ohne Menschen zeigen mindestens 70 % jeder Seite; Zeilen bleiben ähnlich hoch (nie ein grosses Foto über einer Zeile winziger). Der Ausschnitt sitzt auf den Menschen. Geht es auch so nicht ganz auf, bleibt der Rest mittig. */
  const MM = 96 / 25.4, LUECKE = 6;   // Abstand zwischen Feldern (mm)
  function fokus(fig) {
    const b = (window.FOKUS || {})[fig.dataset.fokus];
    if (!b) return { x0: .15, x1: .85, y0: .15, y1: .85 };
    return { x0: b[0], x1: b[1], y0: b[2], y1: Math.min(b[3], b[2] + .75 * (b[3] - b[2])) };
  }
  function raster(wurzel) {   // Bildzeile eine Zeile hoch; bricht eine um, wird die Seite mit zwei Zeilen Platz neu gesetzt
    wurzel.querySelectorAll('.dr-raster').forEach(r => { setzeRaster(r, 7.2); if (r.scrollHeight > r.clientHeight + 1 || [...r.querySelectorAll('figcaption')].some(c => c.scrollHeight > c.clientHeight + 1)) setzeRaster(r, 11.2); });
  }
  function setzeRaster(r, ZEILE) {
    {
      const figs = [...r.querySelectorAll('.dr-bild')]; if (!figs.length) return;
      r.className = 'dr-raster dr-raster--zeilen'; r.innerHTML = '';
      const W = r.clientWidth / MM, H = (r.clientHeight - parseFloat(getComputedStyle(r).paddingTop)) / MM;
      const fo = figs.map(f => { const i = f.querySelector('img'), a = (i.naturalWidth || 4) / (i.naturalHeight || 5), b = fokus(f); return { f, a, b, bw: b.x1 - b.x0, bh: b.y1 - b.y0 }; });
      /* jede Aufteilung in Zeilen prüfen (bei höchstens sechs Fotos 32 Möglichkeiten) */
      let best = null;
      for (let m = 0; m < 1 << (fo.length - 1); m++) {
        const zeilen = [[fo[0]]]; for (let i = 1; i < fo.length; i++) { if (m & (1 << (i - 1))) zeilen.push([]); zeilen[zeilen.length - 1].push(fo[i]); }
        const HP = H - (zeilen.length - 1) * LUECKE - zeilen.length * ZEILE;
        const z = zeilen.map(t => { const sa = t.reduce((x, y) => x + y.a, 0), h0 = (W - (t.length - 1) * LUECKE) / sa;
          return { t, h0, lo: h0 * Math.max(...t.map(x => x.bh)), hi: h0 / Math.max(...t.map(x => x.bw)) }; });
        const hoehe = k => z.reduce((x, y) => x + Math.min(y.hi, Math.max(y.lo, y.h0 * k)), 0);
        let lo = .05, hi = 20; for (let n = 0; n < 50; n++) { const k = (lo + hi) / 2; if (hoehe(k) < HP) lo = k; else hi = k; }
        const k = (lo + hi) / 2; z.forEach(y => { y.h = Math.min(y.hi, Math.max(y.lo, y.h0 * k)); });
        const summe = z.reduce((x, y) => x + y.h, 0), rest = Math.abs(HP - summe), schnitt = z.reduce((x, y) => x + y.t.length * Math.abs(Math.log(y.h0 / y.h)), 0);
        const hs = z.map(y => y.h), ungleich = Math.max(...hs) / Math.min(...hs);   // nie ein grosses Foto über einer Zeile winziger
        const wert = rest * 3 + schnitt * 20 + (z.some(y => y.h < 34) ? 500 : 0) + (ungleich > 1.8 ? (ungleich - 1.8) * 120 : 0);
        if (!best || wert < best.wert) best = { z, wert, summe, HP };
      }
      /* zu hoch: alles kleiner (Zeilen schmaler, mittig); zu niedrig: Rest mittig */
      const s = best.summe > best.HP ? best.HP / best.summe : 1;
      best.z.forEach(y => {
        const zeile = document.createElement('div'); zeile.className = 'dr-zeile'; r.appendChild(zeile);
        const breiteFoto = y.t.map(x => x.a * y.h0 * s), hoch = y.h * s;
        y.t.forEach((x, i) => {
          const w = breiteFoto[i], fa = w / hoch, q = fa / x.a;   // Feld zu Foto: q < 1 schmaler (seitlich beschnitten), q > 1 breiter (oben/unten)
          x.f.style.width = w.toFixed(2) + 'mm'; x.f.querySelector('.dr-bild__b').style.height = hoch.toFixed(2) + 'mm';
          let px = 50, py = 35;
          if (q < .999) { const v = q, c = (x.b.x0 + x.b.x1) / 2, l = Math.min(1 - v, Math.max(0, c - v / 2)); px = v < 1 ? l / (1 - v) * 100 : 50; py = 50; }
          if (q > 1.001) { const v = 1 / q, c = (x.b.y0 + x.b.y1) / 2, o = Math.min(1 - v, Math.max(0, c - v / 2)); py = o / (1 - v) * 100; px = 50; }
          x.f.querySelector('img').style.objectPosition = px.toFixed(1) + '% ' + py.toFixed(1) + '%';
          zeile.appendChild(x.f);
        });
      });
      r.style.setProperty('--zh', (ZEILE - 2.6).toFixed(1) + 'mm');
    }
  }
  function teileMenue(erste) {
    const teile = [...erste.querySelector('.dr-gaenge').children], koch = erste.querySelector('.dr-koch');
    const name = e => ((e.querySelector('.dr-gang__n') || {}).textContent || '').trim();
    const vorlage = erste.cloneNode(true); vorlage.classList.add('dr-menue-folge'); vorlage.querySelectorAll('.dr-koch,.dr-gaeste').forEach(e => e.remove());
    for (let m = 2; m <= 6; m++) {
      erste.parentNode.querySelectorAll('.dr-menue-folge').forEach(e => e.remove());
      const je = Math.ceil(teile.length / m), gruppen = [];
      for (let i = 0; i < teile.length; i += je) gruppen.push(teile.slice(i, i + je));
      const seiten = gruppen.map((g, i) => {
        const x = i ? vorlage.cloneNode(true) : erste;
        x.querySelector('.dr-gaenge').replaceChildren(...g);
        x.querySelector('.dr-menue>.dr-etikett').textContent = 'Das Menü und die Weine · ' + (g.length > 1 ? 'Von ' + name(g[0]) + ' bis ' + name(g[g.length - 1]) : name(g[0]));
        return x;
      });
      if (koch) seiten[seiten.length - 1].querySelector('.dr-menue').appendChild(koch);
      seiten.slice(1).forEach((x, i) => seiten[i].after(x));
      seiten.forEach(x => enger(x, .8)); gleichEng(seiten);
      if (seiten.every(passt)) break;
    }
  }
  /* Brief: steht ganz auf einer Seite (enger bis 84 %, Porträt kleiner). Ist er auch so zu lang, geht er auf Seiten mit eigenem Kopf weiter: ganze Absätze,
     ein zu langer Absatz an einer Wortgrenze (nie mitten im Wort, Prüfung 6, N12), nur ein Wort ohne Leerzeichen an der Zeichengrenze. Jede Seite ist voll,
     der Schluss steht auf der letzten und nie allein; bleibt dort Platz, wird das Porträt grösser und die Schrift ruhiger, nie eine halbe Seite leer. */
  function umbrechen(wurzel) {
    glyphen(wurzel);
    if (!wurzel.querySelector('.dr-brief-seite')) return 0;
    const ph = (x, mm) => x.style.setProperty('--ph', mm + 'mm');
    const setK = (x, k) => k < 1 ? x.style.setProperty('--k', k) : x.style.removeProperty('--k');
    const drin = x => { const r = x.querySelector('.dr-koerper').getBoundingClientRect(); return passt(x) && [...x.querySelectorAll('.dr-brief__schluss, .dr-brief__schluss *')].every(e => e.getBoundingClientRect().bottom <= r.bottom + .5); };   // auf den halben Pixel
    const fuellen = x => {   // letzte Seite: Platz an Porträt und Schrift geben
      let mm = 52; ph(x, mm); while (mm < 100 && drin(x)) { mm += 4; ph(x, mm); } if (!drin(x)) ph(x, mm - 4);
      let k = kVon(x); while (k < 1.12 && drin(x)) { k = Math.round((k + .02) * 100) / 100; x.style.setProperty('--k', k); } if (!drin(x)) x.style.setProperty('--k', Math.round((k - .02) * 100) / 100);
    };
    const ur = wurzel.innerHTML;
    const leer = x => { const k = x.querySelector('.dr-koerper').getBoundingClientRect(), t = x.querySelector('.dr-brief__text'), l = t.lastElementChild; return l ? (k.bottom - l.getBoundingClientRect().bottom) / k.height : 1; };
    { const x = wurzel.querySelector('.dr-brief-seite'); ph(x, 52); if (enger(x, .9)) { fuellen(x); nummern(wurzel); return 1; } }
    /* zu lang für eine Seite: dieselbe Grösse auf allen Seiten, die grösste, mit der der Brief die wenigsten Seiten braucht */
    const versuch = k => {
      wurzel.innerHTML = ur;
      const erste = wurzel.querySelector('.dr-brief-seite'), schluss = erste.querySelector('.dr-brief__schluss'); schluss.remove(); setK(erste, k); ph(erste, 52);
      const an = erste.querySelector('.dr-an dd'), wem = an ? 'An ' + an.childNodes[0].textContent : '';
      const folge = x => { const neu = x.cloneNode(true); neu.classList.add('dr-folge'); setK(neu, k);
        neu.querySelector('.dr-brief__kopf').outerHTML = `<header class="dr-brief__kopf dr-brief__kopf--folge"><img class="dr-wortmarke" src="${Z}wortmarke-night.svg" alt="Angelina Strelow"><p class="dr-etikett">${esc(wem)}</p></header>`;
        neu.querySelector('.dr-brief__text').innerHTML = ''; neu.querySelectorAll('.dr-brief__schluss').forEach(e => e.remove()); x.after(neu); return neu; };
      /* vom ersten Absatz der nächsten Seite so viel zurückholen, wie passt: ganze Sätze, sonst ganze Wörter, nie mitten im Wort (Prüfung 6, N12);
         nur ein Wort ohne Leerzeichen wird an der Zeichengrenze geteilt. «rest»: so viele Zeichen bleiben mindestens drüben */
      const auffuellen = (x, ziel, rest = 0) => {
        const p = ziel.firstElementChild; if (!p) return;
        const von = x.querySelector('.dr-brief__text'), html = p.innerHTML, t = p.textContent; von.appendChild(p);
        const probe = teile => { let lo = 0, hi = teile.length; while (lo < hi) { const m = (lo + hi + 1) >> 1, vorn = teile.slice(0, m).join(''); p.textContent = vorn; if (t.length - vorn.length >= rest && passt(x)) lo = m; else hi = m - 1; } return lo; };
        let teile = t.split(/(?<=[.!?…»]\s)/), lo = teile.length > 1 ? probe(teile) : 0;
        if (!lo) { teile = t.split(/(?<=\s)/); if (teile.length < 2) teile = [...t]; lo = probe(teile); }
        if (lo === 0) { p.innerHTML = html; ziel.prepend(p); }
        else if (lo < teile.length) { p.textContent = teile.slice(0, lo).join('').replace(/\s+$/, ''); const r = document.createElement('p'); r.textContent = teile.slice(lo).join(''); ziel.prepend(r); }
        else p.innerHTML = html;
      };
      let x = erste, n = 0;
      while (!passt(x) && n++ < 40) {
        const neu = folge(x), von = x.querySelector('.dr-brief__text'), ziel = neu.querySelector('.dr-brief__text');
        while (!passt(x) && von.children.length > 1) ziel.prepend(von.lastElementChild);
        if (!passt(x)) ziel.prepend(von.lastElementChild);   // ein einzelner Absatz, länger als die Seite
        if (leer(x) > .4) auffuellen(x, ziel);   // jede Seite endet mit ganzen Absätzen; geteilt wird nur, wenn sonst mehr als 40 % der Seite leer blieben
        x = neu;
      }
      x.querySelector('.dr-brief').appendChild(schluss); ph(x, 52);
      if (!passt(x)) {   // Schluss auf eine eigene letzte Seite, nie allein: mindestens ein Satz geht mit, die vorige Seite bleibt voll
        schluss.remove(); const neu = folge(x), von = x.querySelector('.dr-brief__text'), ziel = neu.querySelector('.dr-brief__text');
        neu.querySelector('.dr-brief').appendChild(schluss); ph(neu, 52);
        ziel.prepend(von.lastElementChild); if (leer(x) > .4) auffuellen(x, ziel, 120);   // der letzte ganze Absatz geht mit dem Schluss
        x = neu;
      }
      return { seiten: wurzel.querySelectorAll('.dr-brief-seite').length, frei: (() => { const t = x.querySelector('.dr-brief__text'), sc = x.querySelector('.dr-brief__schluss'); return sc.getBoundingClientRect().top - t.getBoundingClientRect().bottom; })() };
    };
    let best = null;
    for (const k of [1, .96, .92]) { const r = versuch(k); if (!best || r.seiten < best.seiten) best = Object.assign(r, { k }); }
    versuch(best.k);
    const alle = wurzel.querySelectorAll('.dr-brief-seite'); fuellen(alle[alle.length - 1]);
    nummern(wurzel);
    return alle.length;
  }
  window.DRUCK = { umbrechen, einpassen, setzeUnterschrift(u) { UNTERSCHRIFT = u || ''; }, ohneEmoji, menue, felder, fuellen, offen, mappe, karte, brief, datumLang, wochentag, vorname, ihrForm, ART_WEIN,
    seiten(art, a, foto, text) { return art === 'mappe' ? mappe(a, foto, text) : art === 'karte' ? karte(a, foto, text) : brief(a, text); } };
})();

/* Tischkarten & Menü · Gestaltungen, Farben, Formate und Arten der Drucksachen (Angelina Strelow, 05.11.2026).
   Farben nur aus ihrer Farbwelt A (kleid/angelina.css, website/stil.css): Night, Salt, Sand, Berry, Olive, Papier, Creme.
   Jede Gestaltung ist aus einem Guss in ihrer Markenwelt: ihre Rahmenlinie als Ornament, Della Respira für Titel, Montserrat zum Lesen,
   Fliege und Siegel als Ornament. Fotos nur ihre eigenen (Begrüssung, deine Karte), nie mit fremdem Etikett, keine Bilder auf Bildern. */
(function () {
  const T = window.TI = window.TI || {};

  /* Farben der Marke: Name, Wert, hell oder dunkel */
  T.FARBEN = {
    night: { name: 'Night', hex: '#0C0A0B', dunkel: true },
    nacht: { name: 'Nacht', hex: '#1E1418', dunkel: true },
    berry: { name: 'Berry', hex: '#49202D', dunkel: true },
    kerze: { name: 'Berry hell', hex: '#6A3444', dunkel: true },
    olive: { name: 'Olive', hex: '#8C8F71', dunkel: false },
    sand: { name: 'Sand', hex: '#E1CFC5', dunkel: false },
    sandhell: { name: 'Sand hell', hex: '#EFE5DF', dunkel: false },
    papier: { name: 'Papier', hex: '#F4EFEC', dunkel: false },
    creme: { name: 'Creme', hex: '#FBF8F6', dunkel: false },
    salt: { name: 'Salt', hex: '#F5F5F5', dunkel: false },
    tinte: { name: 'Tinte', hex: '#1A1215', dunkel: true }
  };
  T.hex = k => (T.FARBEN[k] ? T.FARBEN[k].hex : k);

  /* Kontrast nach WCAG, um Etiketten in der Akzentfarbe nur dort zu setzen, wo sie lesbar bleiben */
  const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4)); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
  T.kontrast = (a, b) => { const x = lum(T.hex(a)), y = lum(T.hex(b)); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };

  /* Akzentfarben zur Wahl: auf hellem Grund die dunklen, auf dunklem Grund die hellen */
  T.AKZENTE = { hell: ['berry', 'kerze', 'olive', 'night'], dunkel: ['sand', 'sandhell', 'olive'] };

  /* Rahmen (ihr Ornament): einfach · doppelt · kraeftig (stark und fein) · band (oben und unten je zwei Linien) · haar (nur unter dem Titel) */
  T.STILE = {
    schlicht: { name: 'Schlicht', satz: 'Creme, eine feine Rahmenlinie, Berry als einzige Farbe. Passt zu jedem Abend.', grund: 'creme', tinte: 'tinte', akzent: 'berry', rahmen: 'einfach', trenner: 'kurz', passt: ['Privates Dinner', 'Geburtstag', 'Jubiläum', 'Feier zu Hause'] },
    advent: { name: 'Advent', satz: 'Warmes Papier, doppelte Rahmenlinie in Berry. Für das Gänseessen und lange Abende im Dezember.', grund: 'papier', tinte: 'tinte', akzent: 'berry', rahmen: 'doppelt', trenner: 'doppel', passt: ['Privates Dinner', 'Feier zu Hause'], zeit: [11, 12] },
    hochzeitstag: { name: 'Hochzeitstag', satz: 'Creme mit Linien in hellem Berry und den Namen des Paares im Kopf. Leise und festlich.', grund: 'creme', tinte: 'tinte', akzent: 'kerze', rahmen: 'doppelt', trenner: 'doppel', kopf: 'namen', passt: ['Jubiläum'] },
    geburtstag: { name: 'Geburtstag', satz: 'Salt und Berry, das Monogramm gross über dem Titel. Für den runden Geburtstag.', grund: 'salt', tinte: 'tinte', akzent: 'berry', rahmen: 'kraeftig', trenner: 'kurz', kopf: 'monogramm', passt: ['Geburtstag'] },
    silvester: { name: 'Silvester', satz: 'Night mit dem Rautengitter deiner Fliege, Schrift in Sand. Für die Nacht, in der angestossen wird.', grund: 'night', tinte: 'sandhell', akzent: 'sand', rahmen: 'doppelt', trenner: 'doppel', tapete: 'dunkel', passt: ['Feier zu Hause'], zeit: [12, 1] },
    garten: { name: 'Garten', satz: 'Creme und Olive, offen nach den Seiten: zwei Linien oben, zwei unten. Für Sommerabende draussen.', grund: 'creme', tinte: 'tinte', akzent: 'olive', rahmen: 'band', trenner: 'kurz', passt: ['Feier zu Hause', 'Privates Dinner'], zeit: [5, 6, 7, 8, 9] },
    familie: { name: 'Familie', satz: 'Papier und helles Berry, weich gerundeter Rahmen. Wenn Eltern und Kinder an einem Tisch sitzen.', grund: 'papier', tinte: 'tinte', akzent: 'kerze', rahmen: 'rund', trenner: 'kurz', passt: ['Privates Dinner', 'Feier zu Hause'] },
    smoking: { name: 'Im Smoking', satz: 'Night und Salt wie dein Smoking, eine Linie in Sand. Dein Auftritt auf Papier.', grund: 'night', tinte: 'salt', akzent: 'sand', rahmen: 'einfach', trenner: 'kurz', passt: ['Privates Dinner', 'Jubiläum'] },
    weinabend: { name: 'Weinabend', satz: 'Creme mit Berry, jeder Wein steht unter seinem Gang. Wenn die Weine den Abend tragen.', grund: 'creme', tinte: 'tinte', akzent: 'berry', rahmen: 'band', trenner: 'doppel', weinImMenue: true, passt: ['Privates Dinner'] },
    jubilaeum: { name: 'Jubiläum', satz: 'Salt mit kräftiger und feiner Linie in Berry hell, das Monogramm im Kopf. Für Jahre, die man feiert.', grund: 'salt', tinte: 'tinte', akzent: 'kerze', rahmen: 'kraeftig', trenner: 'doppel', kopf: 'monogramm', passt: ['Jubiläum'] },
    kerzenschein: { name: 'Kerzenschein', satz: 'Berry als Grund, Schrift in Sand hell, wie ein Raum bei Kerzenlicht. Für Weihnachten und späte Abende.', grund: 'berry', tinte: 'sandhell', akzent: 'sand', rahmen: 'einfach', trenner: 'doppel', passt: ['Privates Dinner', 'Feier zu Hause'], zeit: [12] },
    leise: { name: 'Ganz leise', satz: 'Salt ohne Rahmen, nur eine Haarlinie unter dem Titel. Wenn der Tisch selbst schon genug erzählt.', grund: 'salt', tinte: 'tinte', akzent: 'night', rahmen: 'haar', trenner: 'leer', passt: ['Privates Dinner', 'Geburtstag', 'Jubiläum', 'Feier zu Hause'] }
  };
  T.STIL_REIHE = Object.keys(T.STILE);

  /* Formate in mm. bogen: Stück wird mehrfach auf A4 gesetzt, mit Schnittmarken zwischen den Karten */
  T.FORMATE = {
    a5h: { name: 'A5 hoch', b: 148, h: 210, art: 'Menükarte, Weinfolge, Begrüssung' },
    lang: { name: 'Lang', b: 99, h: 210, art: 'Schmale Menükarte für das Gedeck' },
    a4h: { name: 'A4 hoch', b: 210, h: 297, art: 'Begrüssung an der Staffelei, Sitzplan' },
    a4q: { name: 'A4 quer', b: 297, h: 210, art: 'Sitzplan für die lange Tafel' },
    a3h: { name: 'A3 hoch', b: 297, h: 420, art: 'Sitzplan am Eingang, gross' },
    a3q: { name: 'A3 quer', b: 420, h: 297, art: 'Sitzplan am Eingang, lange Tafel' },
    falt: { name: 'Tischkarte gefaltet', b: 90, h: 90, art: 'offen 90 × 90 mm, gefalzt 90 × 45 mm, Name auf beiden Seiten', falz: 45 },
    faltbogen: { name: 'Tischkarten auf Bogen', b: 210, h: 297, art: 'vier gefaltete Tischkarten je A4-Bogen', bogen: { karte: 'falt', sp: 2, ze: 2 } },
    platz: { name: 'Platzkarte', b: 90, h: 55, art: 'flache Karte am Platz, 90 × 55 mm' },
    platzbogen: { name: 'Platzkarten auf Bogen', b: 210, h: 297, art: 'acht Platzkarten je A4-Bogen', bogen: { karte: 'platz', sp: 2, ze: 4 } },
    memory: { name: 'Memory-Karte', b: 60, h: 60, art: 'einzelne Karte, 60 × 60 mm' },
    memorybogen: { name: 'Memory-Karten auf Bogen', b: 210, h: 297, art: 'zwölf Karten je A4-Bogen', bogen: { karte: 'memory', sp: 3, ze: 4 } }
  };

  /* Die Drucksachen eines Abends, in der Reihenfolge, in der die Gäste sie sehen */
  T.STUECKE = {
    begruessung: { name: 'Begrüssung', lang: 'Begrüssungskarte am Eingang', satz: 'Steht am Eingang: wer einlädt, wozu und was der Abend bringt.', formate: ['a5h', 'a4h'], bild: 'empfang' },
    menue: { name: 'Menükarte', lang: 'Menükarte', satz: 'Die Gänge des Abends, wie der Gastgeber sie kocht oder bringen lässt.', formate: ['a5h', 'lang'], bild: 'teller' },
    weine: { name: 'Weinfolge', lang: 'Weinfolge des Abends', satz: 'Jeder Wein mit seinem Gang, damit die Gäste wissen, was im Glas ist.', formate: ['a5h', 'lang'], bild: 'einschenken' },
    tischkarten: { name: 'Tischkarten', lang: 'Tischkarten mit Namen', satz: 'Für jeden Gast eine Karte mit seinem Namen, gefaltet oder flach.', formate: ['falt', 'faltbogen', 'platz', 'platzbogen'], bild: 'festtafel', jeGast: true },
    tischplan: { name: 'Tischplan', lang: 'Sitzordnung als Tischplan', satz: 'Die Tafel von oben, jeder Name an seinem Platz. Für den Eingang.', formate: ['a4h', 'a4q', 'a3h', 'a3q'], bild: 'tafel', sitz: true },
    memory: { name: 'Memory', lang: 'Sitzordnung als Memory-Spiel', satz: 'Jeder Gast zieht beim Empfang eine Karte und findet ihr Gegenstück an seinem Platz.', formate: ['memorybogen', 'memory'], bild: 'kerzen', sitz: true, jeGast: true },
    angelina: { name: 'Deine Karte', lang: 'Deine kleine Karte am Platz', satz: '«Du darfst selbst Gast sein.» Vorne dein Satz, hinten, wie man dich erreicht.', formate: ['platz', 'platzbogen'], bild: 'handschuh' }
  };
  T.STUECK_REIHE = Object.keys(T.STUECKE);

  /* Grössen-Stufen je Schriftrolle: −2 … +2, je Stufe 7 % (feste Grenzen, damit nichts aus dem Satz fällt) */
  T.STUFEN = { min: -2, max: 2, schritt: .07 };
  T.ROLLEN_NAMEN = { titel: 'Titel', gericht: 'Gerichte und Namen', text: 'Lesetext', etikett: 'Kleine Zeilen' };

  /* Memory-Motive: feine Linienzeichnungen in einem 48er-Feld, Strich wie ihre Rahmenlinie. Keine Fotos, keine fremden Marken. */
  T.MOTIVE = {
    weinglas: { name: 'Weinglas', d: ['M16 6h16c1 9 0 15-8 17c-8-2-9-8-8-17z', 'M24 23v16', 'M16 41h16'] },
    sekt: { name: 'Sektflöte', d: ['M20 5h8c1 11 0 17-4 19c-4-2-5-8-4-19z', 'M24 24v15', 'M18 41h12', 'M22 11h4'] },
    flasche: { name: 'Flasche', d: ['M21 4h6v9c4 3 5 6 5 10v20H16V23c0-4 1-7 5-10z', 'M16 27h16'] },
    karaffe: { name: 'Karaffe', d: ['M20 5h8v10c7 4 10 10 10 16c0 7-5 11-14 11S10 38 10 31c0-6 3-12 10-16z', 'M12 30h24'] },
    kerze: { name: 'Kerze', d: ['M24 6c3 4 3 7 0 9c-3-2-3-5 0-9z', 'M24 15v3', 'M19 18h10v24H19z', 'M14 42h20'] },
    gabel: { name: 'Gabel', d: ['M18 5v10c0 4 3 6 6 6s6-2 6-6V5', 'M24 5v10', 'M24 21v22'] },
    loeffel: { name: 'Löffel', d: ['M24 5c5 0 7 5 7 9s-3 8-7 8s-7-4-7-8s2-9 7-9z', 'M24 22v21'] },
    teller: { name: 'Teller', d: ['M24 8a16 16 0 1 0 0.01 0z', 'M24 14a10 10 0 1 0 0.01 0z'] },
    glocke: { name: 'Glocke', d: ['M8 34c0-9 7-16 16-16s16 7 16 16z', 'M5 37h38', 'M24 13v5', 'M21 13h6'] },
    stern: { name: 'Stern', d: ['M24 5l5 12l13 1l-10 8l3 13l-11-7l-11 7l3-13l-10-8l13-1z'] },
    mond: { name: 'Mond', d: ['M30 7a17 17 0 1 0 11 27a14 14 0 1 1-11-27z'] },
    blatt: { name: 'Blatt', d: ['M10 38C10 18 22 8 40 8c0 18-10 30-30 30z', 'M10 38L32 16'] },
    raute: { name: 'Raute', d: ['M24 5l17 19l-17 19L7 24z', 'M24 13l10 11l-10 11l-10-11z'] },
    krone: { name: 'Krone', d: ['M8 36l-2-20l10 9l8-14l8 14l10-9l-2 20z', 'M8 41h32'] },
    schluessel: { name: 'Schlüssel', d: ['M16 12a8 8 0 1 0 0.01 0z', 'M22 25l18 0', 'M34 25v6', 'M39 25v5'] },
    brief: { name: 'Brief', d: ['M7 13h34v23H7z', 'M7 13l17 13l17-13'] },
    ringe: { name: 'Zwei Ringe', d: ['M19 15a10 10 0 1 0 0.01 0z', 'M29 15a10 10 0 1 0 0.01 0z'] },
    blume: { name: 'Blüte', d: ['M24 16c3-8 9-8 9-2s-6 6-9 6c3 0 9 0 9 6s-6 6-9-2c-3 8-9 8-9 2s6-6 9-6c-3 0-9 0-9-6s6-6 9 2z', 'M24 26v17'] },
    herz: { name: 'Herz', d: ['M24 40C10 30 6 22 10 15c3-5 10-6 14 1c4-7 11-6 14-1c4 7 0 15-14 25z'] },
    tasse: { name: 'Tasse', d: ['M10 17h22v11c0 7-5 12-11 12S10 35 10 28z', 'M32 20h3c3 0 5 2 5 5s-2 5-5 5h-4', 'M8 43h28'] }
  };
  T.MOTIV_REIHE = Object.keys(T.MOTIVE);
})();

/* Tischkarten & Menü · Beispiele, solange der Abendplan Gänge, Weine und Gäste noch nicht führt (05.11.2026).
   Gänge, Weine und Gäste gehören dem Abendplan (plan.gaenge, plan.weine, plan.gaeste, plan.ablauf). Steht dort für einen Abend noch nichts,
   zeigt das Werkzeug diese Beispiele, im Werkzeug sichtbar als «Beispiel» beschriftet, nie auf der Drucksache selbst.
   Belegt ist nur, was CLAUDE.md und haus.json nennen (Klaus und Tanja: Gänseessen, Sektempfang, Flying Buffet, drei Gänge von Klaus,
   abgestimmte Weine, Memory-Sitzordnung). Gerichte, Weine und Namen sind Beispiele: keine Weingüter, keine Marken, nur Rebsorte, Jahrgang, Gegend. */
(function () {
  const T = window.TI = window.TI || {};

  T.BEISPIEL_PLAN = {
    'a-251214-kt': {
      kueche: 'Gekocht von Klaus',
      ablauf: [{ zeit: '18:30', was: 'Sektempfang und Flying Buffet' }, { zeit: '19:45', was: 'Platz nehmen, das Memory führt zum Platz' }, { zeit: '20:00', was: 'Drei Gänge vom Gastgeber' }, { zeit: '22:30', was: 'Dessert und Ausklang' }],
      gaenge: [
        { gang: 'Zum Empfang', name: 'Flying Buffet', beschreibung: 'Kleine Happen aus der Hand, gereicht zum Sekt' },
        { gang: 'Erster Gang', name: 'Maronensuppe', beschreibung: 'mit gerösteten Walnüssen und einem Hauch Zimt', wein: 1 },
        { gang: 'Hauptgang', name: 'Gänsekeule aus dem Ofen', beschreibung: 'Rotkohl mit Apfel, Kartoffelklösse und dunkle Jus', wein: 2 },
        { gang: 'Dessert', name: 'Bratapfel', beschreibung: 'mit Vanillesauce und Mandelkrokant', wein: 3 }
      ],
      weine: [
        { name: 'Riesling Sekt brut', herkunft: 'Rheingau', zu: 'Zum Empfang' },
        { name: 'Grauburgunder', jahrgang: '2023', herkunft: 'Baden', zu: 'Zur Maronensuppe' },
        { name: 'Spätburgunder', jahrgang: '2021', herkunft: 'Ahr', zu: 'Zur Gänsekeule' },
        { name: 'Riesling Auslese', jahrgang: '2019', herkunft: 'Mosel', zu: 'Zum Bratapfel' }
      ],
      gaeste: ['Tanja', 'Klaus', 'Petra', 'Michael', 'Sabine', 'Thomas', 'Andrea', 'Jörg', 'Monika', 'Stefan'].map((n, i) => ({ name: n, gastgeber: i < 2 }))
    },
    'a-260918-hb': {
      kueche: 'Aus der Küche von Freunden des Hauses',
      ablauf: [{ zeit: '18:00', was: 'Empfang mit Crémant im Garten' }, { zeit: '19:00', was: 'Ein Wort des Paares' }, { zeit: '19:15', was: 'Vier Gänge am Tisch' }, { zeit: '22:00', was: 'Kaffee und Tanz im Wohnzimmer' }],
      gaenge: [
        { gang: 'Zum Auftakt', name: 'Lachs und Gurke', beschreibung: 'gebeizt, mit Dillschmand und Roggenbrot', wein: 1 },
        { gang: 'Vorspeise', name: 'Kürbiscremesuppe', beschreibung: 'mit Kernöl und gerösteten Kernen', wein: 1 },
        { gang: 'Hauptgang', name: 'Kalbsrücken', beschreibung: 'mit Rahmspinat, Kartoffelgratin und Morchelsauce', wein: 2 },
        { gang: 'Dessert', name: 'Crème brûlée', beschreibung: 'mit Beeren aus dem Garten', wein: 3 }
      ],
      weine: [
        { name: 'Crémant brut', herkunft: 'Elsass', zu: 'Zum Empfang' },
        { name: 'Weissburgunder', jahrgang: '2023', herkunft: 'Pfalz', zu: 'Zum Lachs und zur Suppe' },
        { name: 'Lemberger', jahrgang: '2020', herkunft: 'Württemberg', zu: 'Zum Kalbsrücken' },
        { name: 'Muskateller', jahrgang: '2022', herkunft: 'Baden', zu: 'Zur Crème brûlée' }
      ],
      gaeste: ['Helene Brandt', 'Georg Brandt', 'Lena Brandt', 'Paul Brandt', 'Ingrid Wolters', 'Hans Wolters', 'Karin Brandt', 'Thomas Lehmann', 'Birgit Sommer', 'Frank Sommer', 'Martina Kühn', 'Stefan Kühn', 'Ulla Reinhardt', 'Dieter Reinhardt'].map((n, i) => ({ name: n, gastgeber: i < 2 }))
    },
    'a-260929-js': {
      kueche: 'Gekocht von Julia und Stefan',
      ablauf: [{ zeit: '18:30', was: 'Ankommen, ein Glas Sekt auf Stefan' }, { zeit: '19:15', was: 'Vier Gänge, von den Gastgebern gekocht' }, { zeit: '21:45', was: 'Ein Wort für das Geburtstagskind' }, { zeit: '22:00', was: 'Dessert und Ausklang' }],
      gaenge: [
        { gang: 'Erster Gang', name: 'Rote Bete', beschreibung: 'gebacken, mit Ziegenfrischkäse und Haselnuss', wein: 1 },
        { gang: 'Zweiter Gang', name: 'Kartoffelsuppe', beschreibung: 'mit Lauch, Speck und Majoran', wein: 1 },
        { gang: 'Hauptgang', name: 'Geschmorte Ochsenbacke', beschreibung: 'mit Selleriepüree und glasierten Möhren', wein: 2 },
        { gang: 'Dessert', name: 'Zwetschgentarte', beschreibung: 'mit Zimtsahne', wein: 3 }
      ],
      weine: [
        { name: 'Winzersekt brut', herkunft: 'Pfalz', zu: 'Zum Empfang' },
        { name: 'Grauburgunder', jahrgang: '2023', herkunft: 'Baden', zu: 'Zur Rote Bete und zur Suppe' },
        { name: 'Blaufränkisch', jahrgang: '2020', herkunft: 'Burgenland', zu: 'Zur Ochsenbacke' },
        { name: 'Riesling Spätlese', jahrgang: '2021', herkunft: 'Mosel', zu: 'Zur Zwetschgentarte' }
      ],
      gaeste: ['Julia Roth', 'Stefan Roth', 'Lisa Hartmann', 'Daniel Hartmann', 'Nina Vogel', 'Tobias Vogel', 'Carina Busch', 'Felix Busch', 'Hannah Roth', 'Martin Roth'].map((n, i) => ({ name: n, gastgeber: i < 2 }))
    },
    'a-261006-ew': {
      kueche: 'Aus der Küche des Caterers',
      ablauf: [{ zeit: '19:00', was: 'Ankommen, ein Glas Crémant' }, { zeit: '19:30', was: 'Drei Gänge am Tisch' }, { zeit: '22:00', was: 'Käse, Kaffee und Gespräche' }],
      gaenge: [
        { gang: 'Vorspeise', name: 'Vitello tonnato', beschreibung: 'mit Kapernäpfeln und Rucola', wein: 1 },
        { gang: 'Hauptgang', name: 'Kabeljau', beschreibung: 'auf Rahmwirsing mit Senfsauce und Petersilienkartoffeln', wein: 2 },
        { gang: 'Dessert', name: 'Panna cotta', beschreibung: 'mit Holunder und Mandelkrokant', wein: 3 }
      ],
      weine: [
        { name: 'Crémant brut', herkunft: 'Loire', zu: 'Zum Empfang' },
        { name: 'Weissburgunder', jahrgang: '2023', herkunft: 'Rheinhessen', zu: 'Zum Vitello tonnato' },
        { name: 'Chardonnay', jahrgang: '2022', herkunft: 'Pfalz', zu: 'Zum Kabeljau' },
        { name: 'Muskateller', jahrgang: '2022', herkunft: 'Baden', zu: 'Zur Panna cotta' }
      ],
      gaeste: ['Elke Wagner', 'Susanne Kramer', 'Bettina Fuchs', 'Anja Lehmann', 'Kerstin Maurer', 'Gabriele Neumann'].map((n, i) => ({ name: n, gastgeber: i < 1 }))
    },
    'a-261009-mw': {
      kueche: 'Gekocht von Markus',
      ablauf: [{ zeit: '18:45', was: 'Die Gäste kommen, Sekt im Flur' }, { zeit: '19:15', was: 'Die Überraschung' }, { zeit: '19:30', was: 'Drei Gänge' }, { zeit: '22:00', was: 'Torte und Ausklang' }],
      gaenge: [
        { gang: 'Vorspeise', name: 'Burrata', beschreibung: 'mit Ofentomaten, Basilikum und Olivenöl', wein: 1 },
        { gang: 'Hauptgang', name: 'Rinderfilet', beschreibung: 'mit Rotweinschalotten, Bohnen im Speckmantel und Kartoffelpüree', wein: 2 },
        { gang: 'Dessert', name: 'Schokoladentarte', beschreibung: 'mit Himbeeren und geschlagener Sahne', wein: 3 }
      ],
      weine: [
        { name: 'Winzersekt Rosé', herkunft: 'Nahe', zu: 'Zur Überraschung' },
        { name: 'Sauvignon Blanc', jahrgang: '2023', herkunft: 'Pfalz', zu: 'Zur Burrata' },
        { name: 'Cabernet Sauvignon', jahrgang: '2019', herkunft: 'Pfalz', zu: 'Zum Rinderfilet' },
        { name: 'Portwein Ruby', herkunft: 'Douro', zu: 'Zur Tarte' }
      ],
      gaeste: ['Andrea Wendt', 'Markus Wendt', 'Sabine Kraus', 'Jonas Kraus', 'Petra Lindner', 'Uwe Lindner', 'Claudia Hess', 'Michael Hess', 'Renate Wendt', 'Dirk Brenner'].map((n, i) => ({ name: n, gastgeber: i < 2 }))
    },
    'a-261014-sk': {
      kueche: 'Gekocht von Sophie und Jan',
      ablauf: [{ zeit: '18:30', was: 'Ankommen, ein Glas Riesling' }, { zeit: '19:00', was: 'Vier Gänge mit Weinbegleitung' }, { zeit: '22:00', was: 'Käse und Gespräche' }],
      gaenge: [
        { gang: 'Erster Gang', name: 'Feldsalat', beschreibung: 'mit Birne, Walnuss und Ziegenfrischkäse', wein: 0 },
        { gang: 'Zweiter Gang', name: 'Steinpilzrisotto', beschreibung: 'mit Parmesan und Petersilienöl', wein: 1 },
        { gang: 'Hauptgang', name: 'Rehrücken', beschreibung: 'mit Selleriepüree, Rosenkohlblättern und Wacholderjus', wein: 2 },
        { gang: 'Dessert', name: 'Quarkknödel', beschreibung: 'mit Zwetschgenröster und Butterbröseln', wein: 3 }
      ],
      weine: [
        { name: 'Riesling trocken', jahrgang: '2023', herkunft: 'Rheingau', zu: 'Zum Feldsalat' },
        { name: 'Chardonnay', jahrgang: '2022', herkunft: 'Pfalz', zu: 'Zum Risotto' },
        { name: 'Spätburgunder', jahrgang: '2020', herkunft: 'Baden', zu: 'Zum Rehrücken' },
        { name: 'Scheurebe Spätlese', jahrgang: '2021', herkunft: 'Rheinhessen', zu: 'Zu den Quarkknödeln' }
      ],
      gaeste: ['Sophie Kessler', 'Jan Kessler', 'Margret Kessler', 'Werner Kessler', 'Ulrike Brandes', 'Peter Brandes'].map((n, i) => ({ name: n, gastgeber: i < 2 }))
    },
    'a-261020-cl': {
      kueche: 'Buffet aus der Küche des Hauses',
      ablauf: [{ zeit: '17:30', was: 'Glühwein und Sekt im Garten' }, { zeit: '18:30', was: 'Das Buffet ist eröffnet' }, { zeit: '20:30', was: 'Adventsgebäck und Kaffee' }],
      gaenge: [
        { gang: 'Im Garten', name: 'Glühwein und Punsch', beschreibung: 'am Feuer, dazu gebrannte Mandeln' },
        { gang: 'Vom Buffet', name: 'Kürbissuppe', beschreibung: 'mit Ingwer und Kokos', wein: 1 },
        { gang: 'Vom Buffet', name: 'Ofengemüse und Linsensalat', beschreibung: 'mit Feta, Granatapfel und Kräutern', wein: 1 },
        { gang: 'Vom Buffet', name: 'Rinderschmorbraten', beschreibung: 'mit Spätzle und Preiselbeeren', wein: 2 },
        { gang: 'Zum Schluss', name: 'Adventsgebäck', beschreibung: 'Spekulatius, Zimtsterne und Stollen' }
      ],
      weine: [
        { name: 'Winzerglühwein', herkunft: 'Pfalz', zu: 'Im Garten' },
        { name: 'Grüner Silvaner', jahrgang: '2023', herkunft: 'Franken', zu: 'Zur Suppe und zum Gemüse' },
        { name: 'Dornfelder', jahrgang: '2022', herkunft: 'Pfalz', zu: 'Zum Schmorbraten' }
      ],
      gaeste: ['Claudia Lorenz', 'Bernd Lorenz', 'Familie Schäfer', 'Elke Vogt', 'Rolf Vogt', 'Anke Busch', 'Heike Jansen', 'Tom Jansen', 'Gisela Lorenz'].map((n, i) => ({ name: n, gastgeber: i < 2 }))
    },
    'a-261022-rf': {
      kueche: 'Vom Caterer des Hauses',
      ablauf: [{ zeit: '19:00', was: 'Empfang mit Champagner' }, { zeit: '19:30', was: 'Begrüssung durch Robert Falk' }, { zeit: '19:45', was: 'Vier Gänge' }, { zeit: '22:30', was: 'Digestif am Kamin' }],
      gaenge: [
        { gang: 'Vorspeise', name: 'Rote Bete', beschreibung: 'mit Meerrettich, Apfel und Kresse', wein: 1 },
        { gang: 'Zwischengang', name: 'Consommé vom Rind', beschreibung: 'mit Markklösschen', wein: 1 },
        { gang: 'Hauptgang', name: 'Entenbrust', beschreibung: 'mit Orangenjus, Rotkohl und Kartoffelplätzchen', wein: 2 },
        { gang: 'Dessert', name: 'Lebkuchenparfait', beschreibung: 'mit Glühweinbirne', wein: 3 }
      ],
      weine: [
        { name: 'Champagner brut', herkunft: 'Champagne', zu: 'Zum Empfang' },
        { name: 'Riesling Grosses Gewächs', jahrgang: '2021', herkunft: 'Nahe', zu: 'Zur Vorspeise und Consommé' },
        { name: 'Pinot Noir', jahrgang: '2019', herkunft: 'Burgund', zu: 'Zur Entenbrust' },
        { name: 'Beerenauslese', jahrgang: '2018', herkunft: 'Rheingau', zu: 'Zum Parfait' }
      ],
      gaeste: ['Ines Falk', 'Robert Falk', 'Dr. Martin Albers', 'Katrin Albers', 'Henrik Olsen', 'Mette Olsen', 'Bettina Roth', 'Andreas Roth', 'Julia Weber', 'Sebastian Weber'].map((n, i) => ({ name: n, gastgeber: i < 2 }))
    }
  };

  /* Für Abende, die noch nicht zugesagt sind: ein Beispiel je Anlass, nur zum Ansehen */
  T.BEISPIEL_ANLASS = {
    'Geburtstag': 'a-261009-mw', 'Jubiläum': 'a-260918-hb', 'Privates Dinner': 'a-261014-sk', 'Feier zu Hause': 'a-261020-cl'
  };

  /* Foto je Abend für die Listen (Master 3: passend zum Anlass, nie dasselbe Foto in jeder Zeile). Nur Angelinas Fotos aus _haus/bild/. */
  T.BILD_ABEND = {
    'a-251214-kt': 'kerzen', 'a-260918-hb': 'festtafel', 'a-261009-mw': 'p140', 'a-261014-sk': 'glas', 'a-261020-cl': 'empfang', 'a-261022-rf': 'tafel',
    'a-261027-tb': 'teller', 'a-261030-nh': 'flasche', 'a-261102-ag': 'handschuh', 'a-261103-dm': 'p136', 'a-261104-lp': 'p132', 'a-261105-mk': 'kirche',
    'a-260929-js': 'einschenken', 'a-261006-ew': 'kerze'
  };
  T.BILD_ANLASS = { 'Geburtstag': 'p140', 'Jubiläum': 'festtafel', 'Privates Dinner': 'tafel', 'Feier zu Hause': 'empfang' };

  /* Vorschlag der Gestaltung je Abend, aus Anlass und Monat (wählt Angelina beim ersten Öffnen, ändert jederzeit) */
  T.stilVorschlag = function (a) {
    const an = (a.anfrage && a.anfrage.anlass) || '', w = ((a.anfrage && a.anfrage.wunsch) || '').toLowerCase(), m = +(((a.anfrage && a.anfrage.datum) || '').slice(5, 7)) || 0;
    if (/silvester/.test(w)) return 'silvester';
    if (/gans|gänse|advent/.test(w)) return 'advent';
    if (/hochzeitstag/.test(w)) return 'hochzeitstag';
    if (/weihnacht/.test(w)) return 'kerzenschein';
    if (/garten/.test(w) && m >= 5 && m <= 9) return 'garten';
    if (/eltern|familie|verlobung/.test(w)) return 'familie';
    if (an === 'Geburtstag') return 'geburtstag';
    if (an === 'Jubiläum') return 'jubilaeum';
    if (/wein/.test(w)) return 'weinabend';
    return 'schlicht';
  };

  /* Textbausteine: feste Sätze in ihrer Stimme (Du, ruhig, jeder Satz wertet auf). Werden im Werkzeug angeboten, nie erfunden. */
  T.SAETZE = {
    angelinaVorn: 'Du darfst selbst Gast sein.',
    angelinaZeile: 'Dein Abend. Mein Service.',
    angelinaHinten: 'Du lädst ein. Ich begleite den Abend.',
    angelinaKaffee: 'Kennenlernen bei einem virtuellen Kaffee',
    memoryVorn: 'Finde dein Gegenstück am Tisch.',
    memoryPlatz: 'Hier ist dein Platz.',
    memoryHinten: 'Schön, dass du da bist.',
    begruessung: 'Herzlich willkommen',
    begruessungSatz: 'Schön, dass du heute Abend bei uns bist.',
    menueTitel: 'Menü',
    weineTitel: 'Die Weine des Abends',
    planTitel: 'Sitzordnung',
    planSatz: 'Jeder Platz ist mit Bedacht gewählt.'
  };
})();

---
tags: [projekt, website]
status: entwurf
---
# Angelina Strelow · Mail-Vorlagen (06.11.2026)

Zehn HTML-Mails in ihrer Marke (Night/Papier, Della Respira, Montserrat, Rahmenlinie, Siegel, Unterschrift in Pinyon Script). Nur Tabellen und eingebettete Stile, Bildbreiten fest, geprüft bei 600, 390, 356 und 320 px in Chromium und WebKit.

- `NN-fall/index.html` Vorschau mit Beispielwerten · `NN-fall/template.html` Vorlage mit `{{platzhaltern}}`
- `index.html` Übersicht: Band zum Wischen, obere Hälfte, «Ganze Mail» klappt auf; Platzhalter-Tabelle unten
- `img/` Kopf, Zeichen, Knauf, Unterschrift (PNG, 2×) und zugeschnittene Fotos (nur ihre eigenen aus `website/bilder`) · `schrift/` feste Schnitte
- Bau: `python3 _bau/bilder.py` (Fotos) · `node _bau/zeichen.js` (Zeichen, braucht Playwright) · `python3 _bau/bau.py` (Mails) · `python3 _bau/seite.py` (Übersicht)

Nicht doppelt: Antwort auf Anfrage, Angebot, Erinnerung, Zusage, Ablauf besprechen (Anfragen & Angebote) und Dank, Fragebogen, Wiedersehen (Nach dem Abend) bleiben in den Werkzeugen. Hier: Kennenlernen steht, eine Woche vorher, am Tag davor, Gutschein bereit, Gutschein erhalten, Gast fragt nach dir, Google-Bewertung, Rundbrief Advent, Rundbrief Sommer, Vorstellung bei einem Partner.

Offen: Adresse ihres Google-Profils (`{{bewertung_link}}`, Vorschau zeigt einen Platzhalter), Telefon und Anschrift (nicht belegt, stehen in keiner Mail). Gutschein-Mails an «Ein Abend mit Angelina» aus `beigaben/drucksachen/` angeglichen.

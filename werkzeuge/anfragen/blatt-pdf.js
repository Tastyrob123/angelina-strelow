/* Angebot als PDF (A4): blatt_pdf.js öffnet diese Seite in Chromium, ruft BLATT_SETZEN(daten) und druckt ohne Ränder. Eigene Datei, keine eingebetteten Skripte (Master 9). */
window.BLATT_SETZEN = async function (daten) {
  var w = document.getElementById('seiten');
  w.innerHTML = window.ANGEBOT_BLATT(daten);
  if (document.fonts) { await document.fonts.ready; }
  var bilder = function () { return Promise.all([].map.call(document.images, function (i) { return i.complete ? 0 : new Promise(function (r) { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); }); })); };
  await bilder();
  var e = window.ANGEBOT_EINPASSEN(w);
  await bilder();   // Folgeseiten entstehen erst beim Einpassen, ihr Kopf (kleine Wortmarke) lädt danach (neues Blatt, 06.11.2026)
  return e;
};

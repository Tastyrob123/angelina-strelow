// Der Abendplan · Druck eines Blatts als PDF (05.11.2026, wie drucke.js der Pairing-Karte): node drucke.js <abend> <gastgeber|arbeit> <ziel.pdf>
// Öffnet blatt.html auf dem eigenen Server (AP_PORT, Standard 8852), wartet, bis das Blatt steht, und druckt A4 ohne Rand. Letzte Zeile: Bericht als JSON.
// Nur auf diesem Rechner, nichts geht ins Netz.
const path = require('path'), fs = require('fs');
const { chromium } = require(process.env.AP_PW || path.join(process.env.HOME, 'Desktop/Apps & Tools/Tasty Website Builder/node_modules/playwright'));
const [id, art, aus] = process.argv.slice(2);
const PORT = process.env.AP_PORT || '8852';
(async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: 1.5 });
    await p.goto(`http://127.0.0.1:${PORT}/abendplan/blatt.html?druck=1&id=${encodeURIComponent(id)}&art=${encodeURIComponent(art)}`, { waitUntil: 'load' });
    await p.waitForFunction(() => window.AP_FERTIG || window.AP_FEHLER, null, { timeout: 60000 });
    const f = await p.evaluate(() => window.AP_FEHLER);
    if (f) throw new Error(f);
    const bericht = await p.evaluate(() => window.AP_FERTIG);
    await p.emulateMedia({ media: 'print' });
    fs.mkdirSync(path.dirname(aus), { recursive: true });
    await p.pdf({ path: aus + '.teil', preferCSSPageSize: true, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    fs.renameSync(aus + '.teil', aus);
    console.log(JSON.stringify(bericht));
  } finally { await b.close(); }
})().catch(e => { console.error(String(e && e.stack || e)); process.exit(1); });

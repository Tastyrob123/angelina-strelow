// Nach dem Abend · Unterlage als PDF mit Chromium (wie brief_pdf.js des Gästebuchs): node druck_pdf.js <port> <mappe|karte|dank> <abend> <ziel.pdf>
// Öffnet druck.html auf dem eigenen Server, wartet auf DRUCK_BEREIT (alle Bilder geladen) und druckt ohne Ränder im Seitenformat der Unterlage.
const path = require('path');
const { chromium } = require(path.join(process.env.HOME, 'Desktop/Apps & Tools/Tasty Website Builder/node_modules/playwright'));
const [port, art, abend, aus] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: art === 'karte' ? { width: 560, height: 400 } : { width: 794, height: 1123 } });
    await p.emulateMedia({ media: 'print' });
    await p.goto(`http://127.0.0.1:${port}/nachher/druck.html?art=${encodeURIComponent(art)}&abend=${encodeURIComponent(abend)}`, { waitUntil: 'load' });
    await p.waitForFunction(() => window.DRUCK_BEREIT === true, null, { timeout: 60000 });
    await p.pdf({ path: aus, preferCSSPageSize: true, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  } finally { await b.close(); }
})().catch(e => { console.error(String(e && e.stack || e)); process.exit(1); });

/* Nach dem Abend · Fragebogen für den Gastgeber (stimme.html?abend=<id>&s=<schlüssel>), 05.11.2026.
   Wie war der Abend, ein Satz für Angelinas Website, ob und wie sie ihn zeigen darf. Die Antwort landet im Werkzeug (POST /nachher/api/stimme → Teil «nachher», stimme.antwort).
   Kein Konto, kein Cookie, keine Mail: nur dieser Link mit dem Schlüssel des Abends. Ein unsichtbares Feld hält Maschinen ab. */
(function () {
  'use strict';
  const q = new URLSearchParams(location.search), abend = q.get('abend') || '', s = q.get('s') || '';
  const ziel = document.getElementById('inhalt');
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MON = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const datum = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? (+m[3]) + '. ' + MON[+m[2] - 1] + ' ' + m[1] : ''; };
  let F = null;
  const t = (du, ihr) => F && F.ihr ? ihr : du;
  function fehler(text) { ziel.innerHTML = `<h1 class="sf-h">Dieser Link <em>passt nicht.</em></h1><p class="sf-satz">${esc(text)}</p>`; }
  function formular(neu) {
    const ort = F.ort || '';
    ziel.innerHTML = `<p class="sf-k">${esc([F.anlass, datum(F.datum), F.ort].filter(Boolean).join(' · '))}</p>
      <h1 class="sf-h">Hallo ${esc(F.vorname)}, <em>wie war ${t('dein', 'euer')} Abend?</em></h1>
      <p class="sf-satz">${t('Du durftest', 'Ihr durftet')} an diesem Abend selbst Gast sein. ${t('Erzähl', 'Erzählt')} mir in ein paar Worten, wie es für ${t('dich', 'euch')} war. Zwei Minuten genügen, und alles ist freiwillig.</p>
      ${F.beispiel ? '<p class="sf-bsp">Beispiel: ein erfundener Abend, damit man den Fragebogen ansehen kann.</p>' : ''}
      ${F.beantwortet && !neu ? `<div class="sf-schon"><p>${t('Deine', 'Eure')} Antwort ist schon bei mir angekommen. Danke!</p><button class="sf-link" type="button" id="nochmal">Noch einmal schreiben</button></div>` : `
      <form class="sf-form" id="form" novalidate>
        <label class="sf-feld"><span>Wie ${t('hast du', 'habt ihr')} den Abend erlebt?</span><textarea name="wie" rows="5" maxlength="2000" placeholder="Was ist ${t('dir', 'euch')} in Erinnerung geblieben?"></textarea></label>
        <label class="sf-feld"><span>Ein Satz für meine Website <small>freiwillig</small></span><input name="satz" maxlength="300" placeholder="So, wie ${t('du', 'ihr')} es einer Freundin erzählen ${t('würdest', 'würdet')}."></label>
        <fieldset class="sf-feld sf-wahl"><legend>Darf ich ${t('deine', 'eure')} Worte auf meiner Website zeigen?</legend>
          ${[['vorname', 'Ja, mit Vorname und Ort'], ['voll', 'Ja, mit vollem Namen'], ['ohne', 'Ja, aber ohne Namen'], ['nein', 'Lieber nicht, nur für dich']].map(([k, x], i) => `<label class="sf-r"><input type="radio" name="zeigen" value="${k}"${i === 0 ? ' checked' : ''}><span>${x}</span></label>`).join('')}
        </fieldset>
        <div class="sf-zwei" id="namen"><label class="sf-feld"><span>Name</span><input name="name" maxlength="80" value="${esc(F.vorname)}" autocomplete="name"></label><label class="sf-feld"><span>Ort</span><input name="ort" maxlength="80" value="${esc(ort)}"></label></div>
        <label class="sf-h2"><input type="checkbox" name="fotos_ok"><span>Fotos des Abends dürfen auf Angelinas Website und Instagram gezeigt werden. Gäste, die zu erkennen sind, nur mit ihrem eigenen Ja.</span></label>
        <label class="sf-weg" aria-hidden="true">Website <input name="website" tabindex="-1" autocomplete="off"></label>
        <p class="sf-fehler" id="fehler" role="alert" hidden></p>
        <button class="sf-kn" type="submit"><span>Absenden</span><i aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4"/></svg></i></button>
        <p class="sf-klein">${t('Deine', 'Eure')} Antwort geht nur an Angelina. Sie zeigt nichts, ohne dass ${t('du', 'ihr')} es hier erlaubt ${t('hast', 'habt')}.</p>
      </form>`}`;
    const n = document.getElementById('nochmal'); if (n) n.onclick = () => formular(true);
    const f = document.getElementById('form'); if (!f) return;
    const namen = () => { const z = f.zeigen.value; document.getElementById('namen').hidden = z === 'ohne' || z === 'nein'; };
    [...f.zeigen].forEach(r => r.onchange = namen); namen();
    f.onsubmit = async e => {
      e.preventDefault();
      const fe = document.getElementById('fehler'), kn = f.querySelector('.sf-kn');
      const d = { abend, s, wie: f.wie.value.trim(), satz: f.satz.value.trim(), zeigen: f.zeigen.value, name: f.name.value.trim(), ort: f.ort.value.trim(), fotos_ok: f.fotos_ok.checked, website: f.website.value };
      if (!d.wie && !d.satz) { fe.textContent = 'Schreib bitte ein paar Worte, wie der Abend für ' + t('dich', 'euch') + ' war.'; fe.hidden = false; f.wie.focus(); return; }
      if ((d.zeigen === 'voll' || d.zeigen === 'vorname') && !d.name) { fe.textContent = 'Wie soll der Name unter ' + t('deinen', 'euren') + ' Worten stehen?'; fe.hidden = false; f.name.focus(); return; }
      fe.hidden = true; kn.disabled = true; kn.firstChild.textContent = 'Wird gesendet …';
      try {
        const r = await fetch('api/stimme', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(String(j.fehler || 'Das hat nicht geklappt.').replace(/^[A-ZÄÖÜ]+ · /, ''));
        ziel.innerHTML = `<p class="sf-k">${esc(datum(F.datum))}</p><h1 class="sf-h">Danke, ${esc(F.vorname)}. <em>Das bedeutet mir viel.</em></h1>
          <p class="sf-satz">${t('Deine', 'Eure')} Worte sind bei mir angekommen. Ich freue mich, wenn wir uns wiedersehen.</p><p class="sf-gruss">Angelina</p>`;
        scrollTo({ top: 0, behavior: 'smooth' });
      } catch (x) { fe.textContent = /fetch|Load failed|NetworkError/i.test(x.message) ? 'Keine Verbindung. ' + t('Deine', 'Eure') + ' Worte sind noch da, bitte gleich noch einmal tippen.' : x.message; fe.hidden = false; kn.disabled = false; kn.firstChild.textContent = 'Absenden'; }
    };
  }
  (async () => {
    if (!abend || !s) return fehler('Im Link fehlt etwas. Bitte frag Angelina nach dem Link für deinen Abend.');
    try {
      const r = await fetch('api/fragebogen?abend=' + encodeURIComponent(abend) + '&s=' + encodeURIComponent(s), { cache: 'no-store' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return fehler(String(j.fehler || 'Dieser Link ist nicht mehr gültig.').replace(/^[A-ZÄÖÜ]+ · /, ''));
      F = j; formular(false);
    } catch (e) { fehler('Keine Verbindung. Bitte die Seite gleich noch einmal laden.'); }
  })();
})();

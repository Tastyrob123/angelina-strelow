/* Angelina Strelow — Auswahl im Stil des Hauses (05.11.2026, feste Regel: jede Auswahl im Hausstil, Master «Website-Bau» 2.9, Punkt 11).
   Übernommen aus dem Carlton-Europe (assets/js/auswahl.js), dort beschrieben. Listen (<select>), Kalender (type=date) und Uhrzeit
   (type=time) klappen als helle Karte des Hauses auf statt als Auswahl von Safari. Das echte Feld bleibt im Formular und trägt den Wert,
   jede Wahl löst «input» und «change» aus, darum läuft die Anfrage-Leiste im Auftakt unverändert. Auf allen Seiten geladen. */
(function () {
  'use strict';
  var doc = document, wurzel = doc.documentElement, SP = (wurzel.lang || 'de').slice(0, 2);
  var ORT = { de: 'de-DE', en: 'en-GB' }[SP] || 'de-DE';
  var W = {
    de: { vor: 'Vorheriger Monat', nach: 'Nächster Monat', std: 'Stunde', min: 'Minute', datum: 'Datum wählen', zeit: 'Zeit wählen', uhr: 'Uhr' },
    en: { vor: 'Previous month', nach: 'Next month', std: 'Hour', min: 'Minute', datum: 'Choose a date', zeit: 'Choose a time', uhr: '' },
    fr: { vor: 'Mois précédent', nach: 'Mois suivant', std: 'Heure', min: 'Minute', datum: 'Choisir une date', zeit: 'Choisir une heure', uhr: '' }
  }[SP] || {};
  var fMonat, fTag, fLang, fKurz, fZahl, fEng, fTM;
  try {
    fMonat = new Intl.DateTimeFormat(ORT, { month: 'long' }); fTag = new Intl.DateTimeFormat(ORT, { weekday: 'short' });
    fLang = new Intl.DateTimeFormat(ORT, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    fKurz = new Intl.DateTimeFormat(ORT, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    fZahl = new Intl.DateTimeFormat(ORT, { day: '2-digit', month: '2-digit', year: 'numeric' });
    fEng = new Intl.DateTimeFormat(ORT, { day: '2-digit', month: '2-digit', year: '2-digit' });
    fTM = new Intl.DateTimeFormat(ORT, { day: 'numeric', month: 'short' });   // Felder mit data-tagmonat (Auftakt «18»): «15. Okt.»
  } catch (e) { return; }
  var WINKEL = '<svg class="cw-winkel" viewBox="0 0 13 8" aria-hidden="true"><path d="M1 1l5.5 5.5L12 1"/></svg>';
  var PF = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5"/></svg>';
  var zwei = function (n) { return (n < 10 ? '0' : '') + n; };
  var iso = function (d) { return d.getFullYear() + '-' + zwei(d.getMonth() + 1) + '-' + zwei(d.getDate()); };
  var lies = function (s) { var p = String(s || '').split('-'); return p.length === 3 && +p[0] ? new Date(+p[0], p[1] - 1, +p[2]) : null; };
  var melde = function (el) { el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
  var felder = [], offen = null, nr = 0;

  /* ---------- gemeinsam: Hülle, Knopf, Karte ---------- */
  function titelVon(el) {
    var lab = el.closest('label'), sp = lab && lab.querySelector('span');
    return ((sp && sp.textContent) || el.getAttribute('aria-label') || '').trim();
  }
  function huelle(el, art) {
    var h = doc.createElement('span'); h.className = 'cw cw--' + art;
    el.parentNode.insertBefore(h, el);
    var k = doc.createElement('button'); k.type = 'button'; k.className = 'cw-knopf';
    k.innerHTML = '<b class="cw-wert"></b>' + WINKEL;
    h.appendChild(k); h.appendChild(el);          // der Knopf steht vor dem Feld: ein Klick auf die Beschriftung trifft den Knopf, nie das echte Feld
    el.classList.add('cw-nativ'); el.tabIndex = -1; el.setAttribute('aria-hidden', 'true');
    return k;
  }
  /* Schrift und Farbe des Feldes auf den Knopf übertragen (mehrmals: läuft das Skript vor dem Stylesheet, hat das Feld noch das Aussehen des Systems) */
  function kleide(f) {
    var cs = getComputedStyle(f.el), s = f.k.style;
    s.fontFamily = cs.fontFamily; s.fontSize = cs.fontSize; s.fontWeight = cs.fontWeight; s.letterSpacing = cs.letterSpacing; s.lineHeight = cs.lineHeight; s.color = cs.color;
    s.justifyContent = cs.textAlign === 'center' ? 'center' : 'space-between';
  }
  function karte(f, art, rolle) {
    var p = doc.createElement('div'); p.className = 'cw-pop cw-pop--' + art; p.id = 'cw' + (++nr);
    p.innerHTML = '<div class="cw-pop__in" role="' + rolle + '" tabindex="-1"></div>';
    if (f.titel) p.firstChild.setAttribute('aria-label', f.titel);
    (f.el.closest('dialog[open]') || doc.body).appendChild(p);
    return p;
  }
  function lage() {
    if (!offen) return;
    var p = offen.p, r = offen.f.k.closest('label,.feld,.cw').getBoundingClientRect(), vw = wurzel.clientWidth, vh = window.innerHeight;
    if (offen.art === 'liste') p.style.width = Math.min(vw - 16, Math.max(r.width, 230)) + 'px';
    var b = p.offsetWidth, h = p.offsetHeight;
    var x = Math.max(8, Math.min(r.left, vw - b - 8));
    var unten = vh - r.bottom - 8 >= h || vh - r.bottom >= r.top, y = unten ? r.bottom + 8 : r.top - 8 - h;
    y = Math.max(8, Math.min(y, vh - h - 8));
    p.style.left = x + 'px'; p.style.top = y + 'px';
    var q = p.getBoundingClientRect();           // steckt die Karte in einem verschobenen Fenster, liegt «fest» nicht am Bildschirm: nachmessen und ausgleichen
    if (Math.abs(q.left - x) > 1 || Math.abs(q.top - y) > 1) { p.style.left = (2 * x - q.left) + 'px'; p.style.top = (2 * y - q.top) + 'px'; }
    p.classList.toggle('cw-pop--oben', !unten);
  }
  var takt = 0;
  function mit(e) { if (!offen || takt || (e && e.target && e.target.nodeType === 1 && offen.p.contains(e.target))) return; takt = requestAnimationFrame(function () { takt = 0; lage(); }); }
  function auf(f) {
    if (offen && offen.f === f) { zu(true); return; }
    zu(false);
    var art = f.art === 'select' ? 'liste' : f.art === 'date' ? 'kal' : 'zeit';
    offen = { f: f, art: art, p: karte(f, art, art === 'liste' ? 'listbox' : 'dialog') };
    offen.in_ = offen.p.firstChild;
    f.k.setAttribute('aria-expanded', 'true'); f.k.setAttribute('aria-controls', offen.p.id);
    if (art === 'liste') liste(); else if (art === 'kal') { var d = lies(f.el.value) || grenze(f.el, new Date()); offen.blick = new Date(d.getFullYear(), d.getMonth(), 1); offen.hier = d; kalender(); } else zeit();
    lage();
    var o = offen; requestAnimationFrame(function () { o.p.classList.add('cw-pop--auf'); });
    addEventListener('scroll', mit, true); addEventListener('resize', mit);
  }
  function zu(fokus) {
    var o = offen; if (!o) return;
    offen = null; o.f.k.setAttribute('aria-expanded', 'false'); o.p.classList.remove('cw-pop--auf');
    removeEventListener('scroll', mit, true); removeEventListener('resize', mit);
    setTimeout(function () { if (o.p.parentNode) o.p.parentNode.removeChild(o.p); }, 300);
    if (fokus) o.f.k.focus({ preventScroll: true });
  }
  doc.addEventListener('pointerdown', function (e) { if (offen && !offen.p.contains(e.target) && !offen.f.k.contains(e.target)) zu(false); }, true);
  doc.addEventListener('keydown', function (e) {
    if (!offen) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); zu(true); }      // Escape schliesst nur die Karte, nicht das Buchen-Fenster darunter
    else if (e.key === 'Tab') zu(false);
    else if (offen.p.contains(e.target) || e.target === offen.f.k) { if (offen.art === 'liste') tasteListe(e); else if (offen.art === 'kal') tasteKal(e); else tasteZeit(e); }
  }, true);

  /* ---------- Listen ---------- */
  function zeigeListe(f) {
    var o = f.el.options[f.el.selectedIndex], t = o ? o.textContent : '';
    f.wert.textContent = t; f.alt = f.el.value + '|' + t;
    f.k.setAttribute('aria-label', (f.titel ? f.titel + ': ' : '') + t);
  }
  function liste() {
    var o = offen, s = o.f.el, h = '<ul class="cw-liste">';
    [].forEach.call(s.options, function (op, i) {
      if (op.hidden) return;
      h += '<li role="option" id="' + o.p.id + 'o' + i + '" data-i="' + i + '" aria-selected="' + (i === s.selectedIndex) + '"' + (op.disabled ? ' aria-disabled="true"' : '') + '></li>';
    });
    o.in_.innerHTML = h + '</ul>';
    [].forEach.call(o.in_.querySelectorAll('li'), function (li) { li.textContent = s.options[+li.dataset.i].textContent; });
    markiere(Math.max(0, s.selectedIndex));
    o.in_.focus({ preventScroll: true });
  }
  function markiere(i) {
    var o = offen, ul = o.in_.firstChild, lis = [].slice.call(ul.children); if (!lis.length) return;
    var li = ul.querySelector('[data-i="' + i + '"]') || lis[0];
    lis.forEach(function (x) { x.classList.toggle('cw-hier', x === li); });
    o.j = +li.dataset.i; o.in_.setAttribute('aria-activedescendant', li.id);
    var r = li.getBoundingClientRect(), rl = ul.getBoundingClientRect();
    if (r.bottom > rl.bottom) ul.scrollTop += r.bottom - rl.bottom; else if (r.top < rl.top) ul.scrollTop -= rl.top - r.top;
  }
  function waehle(i) {
    var f = offen.f, op = f.el.options[i]; if (!op || op.disabled) return;
    f.el.selectedIndex = i; melde(f.el); zeigeListe(f); zu(true);
  }
  var suche = '', suchUhr = 0;
  function tasteListe(e) {
    var o = offen, lis = [].slice.call(o.in_.querySelectorAll('li:not([aria-disabled])')), pos = -1;
    lis.forEach(function (x, n) { if (+x.dataset.i === o.j) pos = n; });
    var geh = function (n) { e.preventDefault(); markiere(+lis[Math.max(0, Math.min(lis.length - 1, n))].dataset.i); };
    if (e.key === 'ArrowDown') geh(pos + 1); else if (e.key === 'ArrowUp') geh(pos - 1); else if (e.key === 'Home') geh(0); else if (e.key === 'End') geh(lis.length - 1);
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); waehle(o.j); }
    else if (e.key.length === 1) {
      clearTimeout(suchUhr); suche += e.key.toLowerCase(); suchUhr = setTimeout(function () { suche = ''; }, 700);
      var t = lis.filter(function (x) { return x.textContent.trim().toLowerCase().replace(/^[«"„]/, '').indexOf(suche) === 0; })[0]; if (t) markiere(+t.dataset.i);
    }
  }

  /* ---------- Kalender ---------- */
  function partner(el) { var fo = el.form; if (!fo || !fo.elements) return null; var p = el.name === 'an' ? fo.elements.ab : el.name === 'ab' ? fo.elements.an : null; return p && p.type === 'date' ? p : null; }
  function grenze(el, d) { var mn = lies(el.min), mx = lies(el.max); if (mn && d < mn) return mn; if (mx && d > mx) return mx; return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function zeigeDatum(f) {
    var d = lies(f.el.value);
    f.alt = f.el.value;
    if (d && f.el.hasAttribute('data-tagmonat')) { f.wert.textContent = fTM.format(d); return; }
    f.wert.textContent = d ? fKurz.format(d).replace(/\./g, function (m, i, s) { return /\d/.test(s[i - 1] || '') ? '.' : ''; }) : W.datum;
    f.k.classList.toggle('cw-knopf--leer', !d);
    if (d && f.wert.scrollWidth > f.wert.clientWidth + 1) f.wert.textContent = fZahl.format(d);    // schmale Felder: Zahlen statt Wochentag und Monatsname
    if (d && f.wert.scrollWidth > f.wert.clientWidth + 1) f.wert.textContent = fEng.format(d);     // ganz schmal: Jahr zweistellig
    f.k.setAttribute('aria-label', (f.titel ? f.titel + ': ' : '') + (d ? fLang.format(d) : W.datum));
  }
  function kalender() {
    var o = offen, el = o.f.el, mn = lies(el.min), mx = lies(el.max), wahl = el.value, heute = iso(new Date()), b = o.blick, j = b.getFullYear(), m = b.getMonth();
    var pa = partner(el), von = '', bis = '';
    if (pa && pa.value && wahl) { von = el.name === 'an' ? wahl : pa.value; bis = el.name === 'an' ? pa.value : wahl; if (von > bis) von = bis = ''; }
    var h = '<div class="cw-kal__kopf"><button type="button" class="cw-kal__pf cw-kal__pf--zur" data-schritt="-1" aria-label="' + W.vor + '">' + PF + '</button><p class="cw-kal__monat"><b>' + fMonat.format(b) + '</b> ' + j + '</p><button type="button" class="cw-kal__pf" data-schritt="1" aria-label="' + W.nach + '">' + PF + '</button></div><div class="cw-kal__tage" aria-hidden="true">';
    for (var t = 0; t < 7; t++) h += '<span>' + fTag.format(new Date(2024, 0, 1 + t)).replace('.', '') + '</span>';      // 1.1.2024 war ein Montag
    h += '</div><div class="cw-kal__raster">';
    var leer = (new Date(j, m, 1).getDay() + 6) % 7, n = new Date(j, m + 1, 0).getDate();
    for (t = 0; t < leer; t++) h += '<span></span>';
    for (t = 1; t <= n; t++) {
      var d = new Date(j, m, t), s = iso(d), aus = (mn && d < mn) || (mx && d > mx);
      var kl = 'cw-tag' + (s === heute ? ' cw-tag--heute' : '') + (von && s > von && s < bis ? ' cw-tag--nacht' : '') + (von && (s === von || s === bis) && s !== wahl ? ' cw-tag--ende' : '');
      h += '<button type="button" class="' + kl + '" data-tag="' + s + '"' + (s === wahl ? ' aria-pressed="true"' : '') + (aus ? ' disabled' : '') + ' aria-label="' + fLang.format(d) + '" tabindex="-1">' + t + '</button>';
    }
    o.in_.innerHTML = h + '</div>';
    var ziel = o.in_.querySelector('[data-tag="' + iso(o.hier) + '"]:not([disabled])') || o.in_.querySelector('.cw-tag[aria-pressed]') || o.in_.querySelector('.cw-tag:not([disabled])');
    if (ziel) { ziel.tabIndex = 0; ziel.focus({ preventScroll: true }); }
  }
  function tasteKal(e) {
    var o = offen, a = doc.activeElement, d = a && a.getAttribute && lies(a.getAttribute('data-tag')); if (!d) return;
    var plus = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (e.key === 'PageUp' || e.key === 'PageDown') d = new Date(d.getFullYear(), d.getMonth() + (e.key === 'PageUp' ? -1 : 1), d.getDate());
    else if (plus) d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + plus);
    else return;
    e.preventDefault(); d = grenze(o.f.el, d); o.hier = d; o.blick = new Date(d.getFullYear(), d.getMonth(), 1); kalender(); lage();
  }

  /* ---------- Uhrzeit ---------- */
  function zeigeZeit(f) {
    var v = f.el.value; f.alt = v;
    f.wert.textContent = /^\d\d:\d\d/.test(v) ? (SP === 'de' ? v.slice(0, 5).replace(':', '.') + ' ' + W.uhr : v.slice(0, 5)) : W.zeit;
    f.k.classList.toggle('cw-knopf--leer', !v);
    f.k.setAttribute('aria-label', (f.titel ? f.titel + ': ' : '') + f.wert.textContent);
  }
  function zeit() {
    var o = offen, el = o.f.el, wert = /^\d\d:\d\d/.test(el.value) ? el.value : '12:00', hh = +wert.slice(0, 2), mm = +wert.slice(3, 5);
    var schritt = Math.max(1, Math.min(30, Math.round((+el.step || 900) / 60))); if (60 % schritt) schritt = 5;
    mm = Math.round(mm / schritt) * schritt % 60;
    var von = /^\d\d:\d\d/.test(el.min) ? el.min.slice(0, 5) : '', bis = /^\d\d:\d\d/.test(el.max) ? el.max.slice(0, 5) : '';
    var h = '<div class="cw-zeit"><div class="cw-zeit__sp" role="listbox" aria-label="' + W.std + '" data-teil="h">';
    for (var t = 0; t < 24; t++) { var zuFrueh = (von && t < +von.slice(0, 2)) || (bis && t > +bis.slice(0, 2)); h += '<button type="button" role="option" class="cw-z" data-w="' + t + '" aria-selected="' + (t === hh) + '" tabindex="' + (t === hh ? 0 : -1) + '"' + (zuFrueh ? ' disabled' : '') + '>' + zwei(t) + '</button>'; }
    h += '</div><i class="cw-zeit__punkt" aria-hidden="true">' + (SP === 'de' ? '.' : ':') + '</i><div class="cw-zeit__sp" role="listbox" aria-label="' + W.min + '" data-teil="m">';
    for (t = 0; t < 60; t += schritt) h += '<button type="button" role="option" class="cw-z" data-w="' + t + '" aria-selected="' + (t === mm) + '" tabindex="' + (t === mm ? 0 : -1) + '">' + zwei(t) + '</button>';
    o.in_.innerHTML = h + '</div></div>';
    o.hh = hh; o.mm = mm;
    [].forEach.call(o.in_.querySelectorAll('.cw-zeit__sp'), function (sp) { var a = sp.querySelector('[aria-selected=true]'); if (a) sp.scrollTop = a.offsetTop - sp.clientHeight / 2 + a.offsetHeight / 2; });
    var e1 = o.in_.querySelector('[data-teil=h] [aria-selected=true]'); if (e1) e1.focus({ preventScroll: true });
  }
  function tasteZeit(e) {
    var z = doc.activeElement; if (!z || !z.classList || !z.classList.contains('cw-z')) return;
    var n = e.key === 'ArrowDown' ? z.nextElementSibling : e.key === 'ArrowUp' ? z.previousElementSibling : null;
    while (n && n.disabled) n = e.key === 'ArrowDown' ? n.nextElementSibling : n.previousElementSibling;
    if (n) { e.preventDefault(); n.focus(); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); var and = offen.in_.querySelector('[data-teil=' + (z.parentNode.getAttribute('data-teil') === 'h' ? 'm' : 'h') + '] [aria-selected=true]'); if (and) and.focus(); }
  }

  /* ---------- Klicks in der Karte ---------- */
  doc.addEventListener('click', function (e) {
    if (!offen || !offen.p.contains(e.target)) return;
    var o = offen, f = o.f, li = e.target.closest('.cw-liste li'), p = e.target.closest('[data-schritt]'), tg = e.target.closest('.cw-tag'), zz = e.target.closest('.cw-z');
    if (li) waehle(+li.dataset.i);
    else if (p) { o.blick = new Date(o.blick.getFullYear(), o.blick.getMonth() + (+p.getAttribute('data-schritt')), 1); o.hier = o.blick; kalender(); lage(); }
    else if (tg && !tg.disabled) {
      f.el.value = tg.getAttribute('data-tag'); melde(f.el); zeigeDatum(f);
      var pa = f.el.name === 'an' ? partner(f.el) : null, pf = pa && pa._cw;
      zu(!pf);
      if (pf && pf.k.offsetWidth) setTimeout(function () { zeigeDatum(pf); auf(pf); }, 160);     // nach der Anreise gleich die Abreise
    }
    else if (zz && !zz.disabled) {
      var teil = zz.parentNode.getAttribute('data-teil'); if (teil === 'h') o.hh = +zz.getAttribute('data-w'); else o.mm = +zz.getAttribute('data-w');
      [].forEach.call(zz.parentNode.children, function (x) { x.setAttribute('aria-selected', String(x === zz)); x.tabIndex = x === zz ? 0 : -1; });
      f.el.value = zwei(o.hh) + ':' + zwei(o.mm); melde(f.el); zeigeZeit(f);
      if (teil === 'm') zu(true); else { var m = o.in_.querySelector('[data-teil=m] [aria-selected=true]'); if (m) m.focus({ preventScroll: true }); }
    }
  });
  doc.addEventListener('mousemove', function (e) { if (!offen || offen.art !== 'liste') return; var li = e.target.closest && e.target.closest('.cw-liste li'); if (li && offen.p.contains(li) && +li.dataset.i !== offen.j) markiere(+li.dataset.i); });

  /* ---------- Felder rüsten ---------- */
  function zeige(f) { if (f.art === 'select') zeigeListe(f); else if (f.art === 'date') zeigeDatum(f); else zeigeZeit(f); }
  function ruest(el) {
    if (el._cw || !el.parentNode) return;
    var art = el.tagName === 'SELECT' ? 'select' : el.type;
    if (art !== 'select' && art !== 'date' && art !== 'time') return;
    if (el.closest('[data-eigene-wahl]') || (art === 'select' && (el.multiple || el.size > 1))) { el._cw = { aus: 1 }; return; }
    if (el.closest('.sr')) { el._cw = { aus: 1 }; el.tabIndex = -1; return; }      // nur für Vorleseprogramme: bleibt, wie es ist, nimmt aber keinen Tastenfokus
    var f = { el: el, art: art, titel: titelVon(el) };
    f.k = huelle(el, art === 'select' ? 'liste' : art === 'date' ? 'datum' : 'zeit'); f.wert = f.k.firstChild;
    f.k.setAttribute('aria-haspopup', art === 'select' ? 'listbox' : 'dialog'); f.k.setAttribute('aria-expanded', 'false');
    el._cw = f; felder.push(f);
    f.k.addEventListener('click', function (e) { e.preventDefault(); if (!el.disabled) auf(f); });
    f.k.addEventListener('keydown', function (e) { if (!offen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { e.preventDefault(); auf(f); } });
    ['input', 'change'].forEach(function (ev) { el.addEventListener(ev, function () { zeige(f); }); });
    if (el.form) el.form.addEventListener('reset', function () { setTimeout(function () { zeige(f); }, 0); });
    kleide(f); zeige(f);
  }
  function alle(w) { [].forEach.call((w || doc).querySelectorAll('select,input[type=date],input[type=time]'), ruest); }
  function neu() { felder.forEach(function (f) { if (f.el.isConnected) { kleide(f); zeige(f); } }); }
  /* Werte, die andere Skripte direkt setzen (feld.value = …, neue Einträge einer Liste), nachziehen; Felder, die es nicht mehr gibt, vergessen */
  setInterval(function () {
    for (var i = felder.length - 1; i >= 0; i--) {
      var f = felder[i];
      if (!f.el.isConnected) { felder.splice(i, 1); continue; }
      if (!f.k.offsetWidth) continue;
      var jetzt = f.art === 'select' ? f.el.value + '|' + ((f.el.options[f.el.selectedIndex] || {}).textContent || '') : f.el.value;
      if (jetzt !== f.alt) zeige(f);
    }
  }, 450);
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () { alle(); }); else alle();
  [].forEach.call(doc.querySelectorAll('link[rel=stylesheet]'), function (l) { l.addEventListener('load', neu); });
  addEventListener('load', neu); addEventListener('resize', function () { felder.forEach(function (f) { if (f.art === 'date' && f.k.offsetWidth) zeigeDatum(f); }); });
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(neu);
  new MutationObserver(function (ms) {
    ms.forEach(function (m) {
      if (m.target.tagName === 'SELECT' && m.target._cw && m.target._cw.el) zeigeListe(m.target._cw);
      [].forEach.call(m.addedNodes, function (n) { if (n.nodeType !== 1 || (n.classList && n.classList.contains('cw-pop'))) return; if (/^(SELECT|INPUT)$/.test(n.tagName)) ruest(n); else if (n.querySelector) alle(n); });
    });
  }).observe(wurzel, { childList: true, subtree: true });
  window.asAuswahl = { alle: alle, neu: neu, felder: felder };
})();

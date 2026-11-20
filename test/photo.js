// Суратдан қидириш — СИНОВ (фақат test/ нусхасида). Матн телефоннинг ўзида ўқилади (Tesseract.js, арабча), сурат ҳеч қаерга юборилмайди.
// 2-нусха: бутун сурат ўқилади; фақат ишонч билан ўқилган ВА луғатда топилган сўзлар суратнинг ўзида белгиланади.
// Биринчи марта очилганда таниш кутубхонаси ва арабча модель интернетдан юкланади (тахминан 10–15 МБ).
(function () {
  const TESS = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
  const HEIC = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';
  const MINCONF = 40;
  const css = `
#phBtn{position:fixed;right:16px;bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:900;height:52px;padding:0 18px 0 14px;border-radius:26px;border:0;background:#1F6F78;color:#F6F1E7;font:600 15px/1 inherit;display:flex;align-items:center;gap:8px;box-shadow:0 8px 24px rgba(0,0,0,.28)}
#phBtn small{background:#E2BE5A;color:#0D2629;border-radius:8px;padding:3px 6px;font-size:10px;font-weight:700;letter-spacing:.04em}
#ph{position:fixed;inset:0;z-index:5000;background:#0D2629;color:#F3EEE2;display:flex;flex-direction:column;font-family:inherit}
#ph[hidden],#ph [hidden]{display:none!important}
#ph .hd{flex:none;display:flex;align-items:center;gap:10px;padding:calc(10px + env(safe-area-inset-top,0px)) 16px 10px;background:#1F6F78}
#ph .hd b{flex:1;font-size:17px}#ph .hd small{display:block;font-weight:400;font-size:12px;opacity:.8;margin-top:2px}
#ph .x{width:40px;height:40px;border-radius:20px;border:1px solid rgba(255,255,255,.4);background:transparent;color:#fff;font-size:22px;line-height:1}
#ph .bd{flex:1;overflow:auto;padding:14px 16px;-webkit-overflow-scrolling:touch}
#ph .ft{flex:none;display:flex;gap:10px;padding:10px 16px calc(10px + env(safe-area-inset-bottom,0px));background:#12363A}
#ph .b{flex:1;height:48px;border-radius:14px;border:0;font:600 16px/1 inherit;background:#E2BE5A;color:#0D2629}
#ph .b.s{background:transparent;border:1px solid rgba(243,238,226,.4);color:#F3EEE2}
#ph .b.z{flex:none;width:52px;font-size:22px}
#ph p{font-size:15px;line-height:1.45;margin:0 0 12px;color:rgba(243,238,226,.85)}
#ph .big{display:flex;flex-direction:column;gap:12px;margin-top:24px}#ph .big .b{flex:none;height:60px}
#ph .pr{height:10px;border-radius:5px;background:#12363A;overflow:hidden;margin:18px 0 10px}#ph .pr i{display:block;height:100%;width:0;background:#E2BE5A;transition:width .2s}
#ph .st{font-size:14px;color:#E2BE5A;margin-bottom:8px;line-height:1.4}
#ph .vw{overflow:auto;border-radius:12px;background:#000;-webkit-overflow-scrolling:touch}
#ph .cw{position:relative;width:100%}
#ph .cw img{display:block;width:100%;height:auto}
#ph .wb{position:absolute;border:0;padding:0;margin:0;border-radius:4px;background:rgba(31,160,175,.30);box-shadow:0 0 0 1.5px rgba(40,190,205,.95)}
#ph .wb.gs{background:rgba(31,160,175,.14);box-shadow:0 0 0 1.5px rgba(40,190,205,.6)}
#ph .wb.on{background:rgba(226,190,90,.45);box-shadow:0 0 0 2px #E2BE5A}
#ph .pn{flex:none;background:#F7F2E7;color:#1C2A2C;padding:12px 16px 12px;border-radius:18px 18px 0 0;max-height:42%;overflow:auto;box-shadow:0 -10px 30px rgba(0,0,0,.4)}
#ph .pn .r{display:flex;align-items:center;gap:12px;justify-content:space-between;border-top:1px solid #E6DECB;margin-top:8px;padding-top:6px}
#ph .pn .pw{font-family:var(--font-ar,Amiri,serif);font-size:30px;line-height:1.4;direction:rtl;color:#14484F}
#ph .pn .rd{font-size:12px;color:#6B6255}#ph .pn .rd i{font-style:normal;font-family:var(--font-ar,Amiri,serif);font-size:20px;color:#1C2A2C}
#ph .pn ul{margin:2px 0 4px;padding-left:20px}#ph .pn li{font-size:16px;line-height:1.4;margin:2px 0}
#ph .pn .o{height:36px;padding:0 14px;border-radius:12px;border:0;background:#1F6F78;color:#fff;font:600 15px/1 inherit}
#ph .pn .g{font-size:12px;color:#8A6410;margin-bottom:4px}`;
  const el = (t, a, ...k) => { const e = document.createElement(t); for (const x in (a || {})) { if (x === 'class') e.className = a[x]; else if (x.startsWith('on')) e.addEventListener(x.slice(2), a[x]); else if (x === 'hidden') e.hidden = a[x]; else e.setAttribute(x, a[x]); } k.flat().forEach(c => { if (c != null) e.append(c); }); return e; };
  document.head.append(el('style', {}, css));
  let img = null, worker = null, zoom = 1, cw = null, lastWords = null;
  const body = el('div', { class: 'bd' }), foot = el('div', { class: 'ft' }), panel = el('div', { class: 'pn', hidden: true });
  const root = el('div', { id: 'ph', hidden: true },
    el('div', { class: 'hd' }, el('b', {}, 'Суратдан қидириш', el('small', {}, 'Синов режими · матн телефоннинг ўзида ўқилади')), el('button', { class: 'x', 'aria-label': 'Ёпиш', onclick: () => { root.hidden = true; } }, '×')), body, panel, foot);
  const fileIn = (capture) => { const i = el('input', { type: 'file', accept: 'image/*', hidden: true }); if (capture) i.setAttribute('capture', 'environment'); i.addEventListener('change', () => { if (i.files && i.files[0]) load(i.files[0]); i.value = ''; }); return i; };
  const camIn = fileIn(true), galIn = fileIn(false); root.append(camIn, galIn);
  const btn = el('button', { id: 'phBtn', onclick: () => { root.hidden = false; if (!img) start(); } }, '📷 Суратдан', el('small', {}, 'СИНОВ'));
  document.body.append(btn, root);

  function start() {
    img = null; lastWords = null; panel.hidden = true;
    body.replaceChildren(
      el('p', {}, 'Арабча матннинг суратини танланг. Илова бутун суратни ўқийди ва таниган сўзларини суратнинг ўзида белгилаб беради.'),
      el('p', {}, 'Яхши натижа учун: матн текис ва ёруғ бўлсин, соя тушмасин, сурат яқинроқдан олинсин.'),
      el('div', { class: 'big' }, el('button', { class: 'b', onclick: () => camIn.click() }, 'Суратга олиш'), el('button', { class: 'b s', onclick: () => galIn.click() }, 'Галереядан танлаш')));
    foot.replaceChildren();
  }
  const addScript = (src) => new Promise((ok, no) => { const sc = el('script', { src }); sc.onload = () => ok(); sc.onerror = () => no(new Error('юкланмади: ' + src)); document.head.append(sc); });
  const toImg = (blob) => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => no(new Error('decode')); im.src = URL.createObjectURL(blob); });
  async function load(file) {
    panel.hidden = true; body.replaceChildren(el('p', {}, 'Сурат очилмоқда…')); foot.replaceChildren();
    const isHeic = /hei[cf]/i.test(file.type || '') || /\.hei[cf]$/i.test(file.name || '');
    try {
      let im;
      try { im = await toImg(file); }
      catch (e) {   // iPhone'нинг HEIC формати: кўп браузерлар оча олмайди — аввал JPEG га айлантирамиз
        if (!window.heic2any) await addScript(HEIC);
        let jpg = await window.heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 }); if (Array.isArray(jpg)) jpg = jpg[0];
        im = await toImg(jpg);
      }
      img = im; read();
    } catch (e) {
      body.replaceChildren(el('p', {}, 'Суратни очиб бўлмади' + (isHeic ? ' (iPhone HEIC формати).' : '.')), el('p', {}, 'Нима қилиш мумкин: «Суратга олиш»ни танланг, ёки суратни скриншот қилиб, ўша скриншотни танланг.'), el('p', {}, 'Файл: ' + (file.name || '?') + ' · ' + (file.type || 'тури номаълум') + ' · ' + String(e && e.message || e)));
      foot.replaceChildren(el('button', { class: 'b', onclick: start }, 'Бошқа сурат'));
    }
  }
  // соя ва фонни текислаб, оқ-қора қилиш — таниш аниқлигини анча оширади
  function prep() {
    const nw = img.naturalWidth, nh = img.naturalHeight, k = Math.min(1, 2200 / Math.max(nw, nh)), W = Math.max(8, Math.round(nw * k)), H = Math.max(8, Math.round(nh * k));
    const c = el('canvas', { width: W, height: H }), x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, W, H);
    const bw = Math.max(4, Math.round(W / 28)), bh = Math.max(4, Math.round(H / 28));
    const sm = el('canvas', { width: bw, height: bh }); sm.getContext('2d').drawImage(c, 0, 0, bw, bh);
    const bg = el('canvas', { width: W, height: H }), bx = bg.getContext('2d', { willReadFrequently: true }); bx.imageSmoothingEnabled = true; bx.imageSmoothingQuality = 'high'; bx.drawImage(sm, 0, 0, W, H);
    const d = x.getImageData(0, 0, W, H), b = bx.getImageData(0, 0, W, H), a = d.data, g = b.data;
    for (let i = 0; i < a.length; i += 4) { const v = a[i] * .299 + a[i + 1] * .587 + a[i + 2] * .114, m = g[i] * .299 + g[i + 1] * .587 + g[i + 2] * .114; const o = (v / Math.max(m, 1) * 235) > 178 ? 255 : 0; a[i] = a[i + 1] = a[i + 2] = o; a[i + 3] = 255; }
    x.putImageData(d, 0, 0); return c;
  }
  async function read() {
    const bar = el('i'), st = el('p', {}, 'Тайёрланмоқда…');
    body.replaceChildren(el('div', { class: 'st' }, 'Матн ўқилмоқда'), el('div', { class: 'pr' }, bar), st, el('p', {}, 'Биринчи марта арабча модель интернетдан юкланади (10–15 МБ) — бир оз кутинг. Кейинги сафар тезроқ бўлади.'));
    foot.replaceChildren();
    try {
      const c = prep();
      if (!window.Tesseract) await addScript(TESS);
      if (!worker) { worker = await window.Tesseract.createWorker('ara', 1, { logger: (m) => { if (!m) return; const p = Math.round((m.progress || 0) * 100); if (/recogniz/i.test(m.status || '')) { st.textContent = 'Ўқилмоқда: ' + p + '%'; bar.style.width = (40 + p * .6) + '%'; } else { st.textContent = 'Модель юкланмоқда: ' + p + '%'; bar.style.width = (p * .4) + '%'; } } });
        try { await worker.setParameters({ tessedit_pageseg_mode: '3' }); } catch (e) {} }   // 3 = саҳифа тузилишини ўзи аниқлайди (устунлар)
      const r = await worker.recognize(c); const d = (r && r.data) || {};
      const ws = words(d, c.width, c.height), ok = []; bar.style.width = '100%';
      for (let i = 0; i < ws.length; i++) { const o = ws[i], w = clean(o.t);
        if (i % 6 === 0) { st.textContent = 'Сўзлар луғатдан қидирилмоқда: ' + i + ' / ' + ws.length; await new Promise(z => setTimeout(z, 0)); }
        const n = bare(w).length; if (n < 2 || o.c < (n === 2 ? 70 : MINCONF) || !(o.w > 0) || !(o.h > 0)) continue; const hit = find(w); if (hit && !(hit.guess && o.c < 55)) ok.push({ ...o, word: w, hit }); }
      show(ws, ok);
    } catch (e) {
      body.replaceChildren(el('p', {}, 'Ўқиб бўлмади. Интернет борлигини текширинг (биринчи марта модель юкланиши керак) ва қайта уриниб кўринг.'), el('p', {}, String(e && e.message || e)));
      foot.replaceChildren(el('button', { class: 'b s', onclick: start }, 'Бошқа сурат'), el('button', { class: 'b', onclick: read }, 'Қайта уриниш'));
    }
  }
  // таниш натижасидан сўзлар ва уларнинг суратдаги ўрни (0..1)
  function words(d, W, H) {
    const out = [];
    if (d.tsv) d.tsv.split('\n').forEach(l => { const r = l.split('\t'); if (r.length < 12 || r[0] !== '5') return; out.push({ t: r.slice(11).join(' '), c: +r[10], x: +r[6] / W, y: +r[7] / H, w: +r[8] / W, h: +r[9] / H }); });
    else if (Array.isArray(d.words)) d.words.forEach(w => { const b = w.bbox || {}; out.push({ t: w.text || '', c: +w.confidence || 0, x: b.x0 / W, y: b.y0 / H, w: (b.x1 - b.x0) / W, h: (b.y1 - b.y0) / H }); });
    return out;
  }
  const clean = (w) => w.replace(/[^ء-غف-ٰٕٱ]/g, '');
  const bare = (w) => w.replace(/[ً-ٰٕ]/g, '');
  const PRE = ['وبال', 'فبال', 'وكال', 'ولل', 'فلل', 'وال', 'فال', 'بال', 'كال', 'لل', 'ال', 'وب', 'ول', 'وك', 'فب', 'فل', 'و', 'ف', 'ب', 'ل', 'ك'];
  const SUF = ['هما', 'هم', 'هن', 'ها', 'كم', 'نا', 'ه', 'ك', 'ي', 'ون', 'ين', 'ان', 'ات', 'تين', 'ا', 'ة'];
  const cache = new Map();
  const uniq = (a) => { const seen = new Set(), o = []; (a || []).forEach(h => { const f = h && (h.f || (h.it && h.it.f)); if (f && !seen.has(f.form_id + '|' + f.arabic_word)) { seen.add(f.form_id + '|' + f.arabic_word); o.push({ f, uz: h.uz || '', ar: h.ar || '' }); } }); return o.slice(0, 3); };
  // қатъий қидирув: сўзнинг ўзи → қўшимчали феъл → тусланган феъл шакли (يضرب، يقوم)
  const strict = (x) => { try { const a = uniq(wordHits(effQ(x))); if (a.length) return a; } catch (e) {} try { const b = uniq(arFormHitsX(x)); if (b.length) return b; } catch (e) {} const n = bare(x).length; if (n >= 3 && n <= 8) { try { const c = uniq(arFormHits(x)); if (c.length) return c; } catch (e) {} } return null; };
  // топилмаса: олд қўшимча (و، ف، ب، ل، ك، ال) ва охирги қўшимчасиз (ـه، ـها، ـهم، ـون، ـين، ـات، ـاً) — «тахминий» деб белгиланади
  function find(w) {
    if (cache.has(w)) return cache.get(w);
    const b = bare(w); let fs = b === 'ال' ? null : strict(w), guess = false;
    if (!fs && b !== 'ال') { const cands = [];
      for (const p of ['', ...PRE]) { if (!b.startsWith(p)) continue; const s1 = b.slice(p.length); if (s1.length < 2) continue; if (p) cands.push([s1, 2]);
        for (const sf of SUF) { if (s1.endsWith(sf) && s1.length - sf.length >= 3) { const st = s1.slice(0, s1.length - sf.length); cands.push([st, 3]); if (sf === 'ات' || sf === 'ه' || sf === 'ها') cands.push([st + 'ة', 3]); } } }
      for (const [c, m] of cands) { if (c.length >= m) { fs = strict(c); if (fs) { guess = true; break; } } } }
    const r = fs ? { fs, f: fs[0].f, guess } : null; cache.set(w, r); return r;
  }
  function show(ws, ok) {
    lastWords = ok; zoom = 1; panel.hidden = true;
    cw = el('div', { class: 'cw' }, el('img', { src: img.src, alt: '' }));
    ok.forEach(o => { const b = el('button', { class: 'wb' + (o.hit.guess ? ' gs' : ''), 'aria-label': o.word, onclick: () => pick(o, b) }); const px = .15 * o.h; b.style.left = (o.x * 100) + '%'; b.style.top = ((o.y - px) * 100) + '%'; b.style.width = (o.w * 100) + '%'; b.style.height = ((o.h + 2 * px) * 100) + '%'; o.b = b; cw.append(b); });
    const total = ws.filter(o => bare(clean(o.t)).length >= 2).length;
    body.replaceChildren(el('div', { class: 'st' }, ok.length ? ok.length + ' та сўз таниб олинди (суратда кўк билан белгиланган). Сўзга босинг — маъноси пастда чиқади.' : 'Бирорта сўз ишонч билан ўқилмади. Матнни яқинроқдан, ёруғроқ жойда суратга олиб кўринг.'),
      el('div', { class: 'vw' }, cw),
      el('p', { style: 'margin-top:10px;font-size:13px' }, 'Суратда жами ' + total + ' та сўз кўринди; белгиланмаганлари аниқ ўқилмади ёки луғатда топилмади. Катталаштириш учун «+» ни босинг.'));
    foot.replaceChildren(el('button', { class: 'b s', onclick: start }, 'Бошқа сурат'), el('button', { class: 'b s z', 'aria-label': 'Кичрайтириш', onclick: () => setZoom(zoom - .5) }, '−'), el('button', { class: 'b z', 'aria-label': 'Катталаштириш', onclick: () => setZoom(zoom + .5) }, '+'));
  }
  function setZoom(z) { zoom = Math.max(1, Math.min(4, z)); if (cw) cw.style.width = (zoom * 100) + '%'; }
  function pick(o, b) {
    (lastWords || []).forEach(x => x.b && x.b.classList.remove('on')); b.classList.add('on');
    const kids = [];
    if (o.hit.guess) kids.push(el('div', { class: 'g' }, 'Қўшимчаларсиз топилди — тахминий'));
    kids.push(el('div', { class: 'rd' }, 'суратда ўқилгани: ', el('i', { lang: 'ar' }, o.word)));
    o.hit.fs.forEach((h) => { const f = h.f; const trs = (f.translations || []).map(t => (t.label ? t.label + ' ' : '') + (t.meaning || '')).filter(Boolean).slice(0, 3); const eq = (f.equivalent_to || []).join('، ');
      kids.push(el('div', { class: 'r' }, el('button', { class: 'o', onclick: () => go(f.arabic_word || o.word) }, 'Очиш'), el('div', { class: 'pw', lang: 'ar' }, f.arabic_word || o.word)),
        h.uz ? el('div', { class: 'g', style: 'color:#14484F;font-size:15px' }, 'шу шакл: ' + h.uz) : null,
        el('ul', {}, trs.length ? trs.map(t => el('li', {}, t)) : el('li', {}, eq ? '= ' + eq : 'маъноси мақола ичида'))); });
    if (o.hit.fs.length > 1) kids.push(el('div', { class: 'g' }, 'Ҳаракатсиз ёзилгани учун бир неча сўзга тўғри келади — матнга қараб танланг.'));
    panel.replaceChildren(...kids.filter(Boolean)); panel.scrollTop = 0; panel.hidden = false;
  }
  function go(w) {
    root.hidden = true;
    const run = () => { const q = document.getElementById('q'); if (!q) return false; q.value = w; q.dispatchEvent(new Event('input', { bubbles: true })); window.scrollTo(0, 0); return true; };
    if (!run()) { location.hash = '#home'; setTimeout(run, 400); }
  }
})();

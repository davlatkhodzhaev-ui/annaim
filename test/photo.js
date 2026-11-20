// Суратдан қидириш — СИНОВ (фақат test/ нусхасида). Матн телефоннинг ўзида ўқилади (Tesseract.js, арабча), сурат ҳеч қаерга юборилмайди.
// Биринчи марта очилганда таниш кутубхонаси ва арабча модель интернетдан юкланади (тахминан 10–15 МБ).
(function () {
  const TESS = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
  const css = `
#phBtn{position:fixed;right:16px;bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:900;height:52px;padding:0 18px 0 14px;border-radius:26px;border:0;background:#1F6F78;color:#F6F1E7;font:600 15px/1 inherit;display:flex;align-items:center;gap:8px;box-shadow:0 8px 24px rgba(0,0,0,.28)}
#phBtn small{background:#E2BE5A;color:#0D2629;border-radius:8px;padding:3px 6px;font-size:10px;font-weight:700;letter-spacing:.04em}
#ph{position:fixed;inset:0;z-index:5000;background:#0D2629;color:#F3EEE2;display:flex;flex-direction:column;font-family:inherit}
#ph[hidden]{display:none}
#ph .hd{flex:none;display:flex;align-items:center;gap:10px;padding:calc(12px + env(safe-area-inset-top,0px)) 16px 12px;background:#1F6F78}
#ph .hd b{flex:1;font-size:17px}#ph .hd small{display:block;font-weight:400;font-size:12px;opacity:.8;margin-top:2px}
#ph .x{width:40px;height:40px;border-radius:20px;border:1px solid rgba(255,255,255,.4);background:transparent;color:#fff;font-size:22px;line-height:1}
#ph .bd{flex:1;overflow:auto;padding:16px;-webkit-overflow-scrolling:touch}
#ph .ft{flex:none;display:flex;gap:10px;padding:12px 16px calc(12px + env(safe-area-inset-bottom,0px));background:#12363A}
#ph .b{flex:1;height:50px;border-radius:14px;border:0;font:600 16px/1 inherit;background:#E2BE5A;color:#0D2629}
#ph .b.s{background:transparent;border:1px solid rgba(243,238,226,.4);color:#F3EEE2}
#ph .b[disabled]{opacity:.5}
#ph p{font-size:15px;line-height:1.45;margin:0 0 12px;color:rgba(243,238,226,.85)}
#ph .big{display:flex;flex-direction:column;gap:12px;margin-top:24px}
#ph .big .b{flex:none;height:60px}
#ph .cw{position:relative;touch-action:none;border-radius:12px;overflow:hidden;background:#000}
#ph canvas{display:block;width:100%;height:auto}
#ph .sel{position:absolute;border:2px solid #E2BE5A;background:rgba(226,190,90,.18);pointer-events:none}
#ph .pr{height:10px;border-radius:5px;background:#12363A;overflow:hidden;margin:18px 0 10px}#ph .pr i{display:block;height:100%;width:0;background:#E2BE5A;transition:width .2s}
#ph .ln{direction:rtl;display:flex;flex-wrap:wrap;gap:8px;padding:10px 0;border-bottom:1px solid #1E4A4F}
#ph .w{font-family:var(--font-ar,Amiri,serif);font-size:24px;line-height:1.5;padding:2px 12px;border-radius:12px;border:1px solid #2C7A83;background:#174348;color:#F3EEE2}
#ph .w.no{border:1px dashed rgba(243,238,226,.3);background:transparent;color:rgba(243,238,226,.55)}
#ph .st{font-size:14px;color:#E2BE5A;margin-bottom:6px}`;
  const el = (t, a, ...k) => { const e = document.createElement(t); for (const x in (a || {})) { if (x === 'class') e.className = a[x]; else if (x.startsWith('on')) e.addEventListener(x.slice(2), a[x]); else if (x === 'hidden') e.hidden = a[x]; else e.setAttribute(x, a[x]); } k.flat().forEach(c => e.append(c)); return e; };
  document.head.append(el('style', {}, css));
  let img = null, sel = null, worker = null, cv = null, selEl = null;
  const body = el('div', { class: 'bd' }), foot = el('div', { class: 'ft' });
  const root = el('div', { id: 'ph', hidden: true },
    el('div', { class: 'hd' }, el('b', {}, 'Суратдан қидириш', el('small', {}, 'Синов режими · матн телефоннинг ўзида ўқилади')), el('button', { class: 'x', 'aria-label': 'Ёпиш', onclick: () => { root.hidden = true; } }, '×')), body, foot);
  const fileIn = (capture) => { const i = el('input', { type: 'file', accept: 'image/*', hidden: true }); if (capture) i.setAttribute('capture', 'environment'); i.addEventListener('change', () => { if (i.files && i.files[0]) load(i.files[0]); i.value = ''; }); return i; };
  const camIn = fileIn(true), galIn = fileIn(false); root.append(camIn, galIn);
  const btn = el('button', { id: 'phBtn', onclick: () => { root.hidden = false; if (!img) start(); } }, '📷 Суратдан', el('small', {}, 'СИНОВ'));
  document.body.append(btn, root);

  function start() {
    img = null; sel = null;
    body.replaceChildren(
      el('p', {}, 'Арабча матннинг суратини танланг. Илова сўзларни ўқийди ва ҳар бирини луғатдан қидириш мумкин бўлади.'),
      el('p', {}, 'Яхши натижа учун: матн текис ва ёруғ бўлсин, соя тушмасин, сурат яқиндан олинсин.'),
      el('div', { class: 'big' }, el('button', { class: 'b', onclick: () => camIn.click() }, 'Суратга олиш'), el('button', { class: 'b s', onclick: () => galIn.click() }, 'Галереядан танлаш')));
    foot.replaceChildren();
  }
  function load(file) {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => { img = im; sel = null; pick(); };
    im.onerror = () => { body.replaceChildren(el('p', {}, 'Суратни очиб бўлмади. Бошқа сурат танлаб кўринг.')); foot.replaceChildren(el('button', { class: 'b', onclick: start }, 'Бошқа сурат')); };
    im.src = url;
  }
  function pick() {
    const W = Math.min(1200, img.naturalWidth), H = Math.round(img.naturalHeight * W / img.naturalWidth);
    cv = el('canvas', { width: W, height: H }); cv.getContext('2d').drawImage(img, 0, 0, W, H);
    selEl = el('div', { class: 'sel', hidden: true }); const wrap = el('div', { class: 'cw' }, cv, selEl);
    let p0 = null;
    const pos = (e) => { const r = wrap.getBoundingClientRect(); return [Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), Math.max(0, Math.min(1, (e.clientY - r.top) / r.height))]; };
    const draw = () => { if (!sel) { selEl.hidden = true; return; } selEl.hidden = false; selEl.style.left = sel[0] * 100 + '%'; selEl.style.top = sel[1] * 100 + '%'; selEl.style.width = (sel[2] - sel[0]) * 100 + '%'; selEl.style.height = (sel[3] - sel[1]) * 100 + '%'; };
    wrap.addEventListener('pointerdown', (e) => { p0 = pos(e); sel = null; draw(); wrap.setPointerCapture(e.pointerId); e.preventDefault(); });
    wrap.addEventListener('pointermove', (e) => { if (!p0) return; const p = pos(e); sel = [Math.min(p0[0], p[0]), Math.min(p0[1], p[1]), Math.max(p0[0], p[0]), Math.max(p0[1], p[1])]; draw(); });
    const up = () => { p0 = null; if (sel && ((sel[2] - sel[0]) < .04 || (sel[3] - sel[1]) < .02)) { sel = null; draw(); } };
    wrap.addEventListener('pointerup', up); wrap.addEventListener('pointercancel', up);
    body.replaceChildren(el('p', {}, 'Ўқиладиган қисмни бармоқ билан чизиб белгиланг. Икки устунли матнда ҳар устунни алоҳида белгиланг. Белгиламасангиз бутун сурат ўқилади.'), wrap);
    foot.replaceChildren(el('button', { class: 'b s', onclick: start }, 'Бошқа сурат'), el('button', { class: 'b', onclick: read }, 'Ўқиш'));
  }
  // соя ва фонни текислаб, оқ-қора қилиш — таниш аниқлигини анча оширади
  function prep() {
    const s = sel || [0, 0, 1, 1], nw = img.naturalWidth, nh = img.naturalHeight;
    const sx = Math.round(s[0] * nw), sy = Math.round(s[1] * nh), sw = Math.max(8, Math.round((s[2] - s[0]) * nw)), sh = Math.max(8, Math.round((s[3] - s[1]) * nh));
    const k = Math.min(1, 2200 / Math.max(sw, sh)), W = Math.max(8, Math.round(sw * k)), H = Math.max(8, Math.round(sh * k));
    const c = el('canvas', { width: W, height: H }), x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
    const bw = Math.max(4, Math.round(W / 28)), bh = Math.max(4, Math.round(H / 28));
    const sm = el('canvas', { width: bw, height: bh }); sm.getContext('2d').drawImage(c, 0, 0, bw, bh);
    const bg = el('canvas', { width: W, height: H }), bx = bg.getContext('2d', { willReadFrequently: true }); bx.imageSmoothingEnabled = true; bx.imageSmoothingQuality = 'high'; bx.drawImage(sm, 0, 0, W, H);
    const d = x.getImageData(0, 0, W, H), b = bx.getImageData(0, 0, W, H), a = d.data, g = b.data;
    for (let i = 0; i < a.length; i += 4) { const v = a[i] * .299 + a[i + 1] * .587 + a[i + 2] * .114, m = g[i] * .299 + g[i + 1] * .587 + g[i + 2] * .114; const n = v / Math.max(m, 1) * 235; const o = n > 178 ? 255 : 0; a[i] = a[i + 1] = a[i + 2] = o; a[i + 3] = 255; }
    x.putImageData(d, 0, 0); return c;
  }
  const loadLib = () => new Promise((ok, no) => { if (window.Tesseract) return ok(); const s = el('script', { src: TESS }); s.onload = () => ok(); s.onerror = () => no(new Error('lib')); document.head.append(s); });
  async function read() {
    const bar = el('i'), st = el('p', {}, 'Тайёрланмоқда…');
    body.replaceChildren(el('div', { class: 'st' }, 'Матн ўқилмоқда'), el('div', { class: 'pr' }, bar), st, el('p', {}, 'Биринчи марта арабча модель интернетдан юкланади (10–15 МБ) — бир оз кутинг. Кейинги сафар тезроқ бўлади.'));
    foot.replaceChildren();
    try {
      const c = prep();
      await loadLib();
      if (!worker) worker = await window.Tesseract.createWorker('ara', 1, { logger: (m) => { if (!m) return; const p = Math.round((m.progress || 0) * 100); if (/recogniz/i.test(m.status || '')) { st.textContent = 'Ўқилмоқда: ' + p + '%'; bar.style.width = (40 + p * .6) + '%'; } else { st.textContent = 'Модель юкланмоқда: ' + p + '%'; bar.style.width = (p * .4) + '%'; } } });
      const r = await worker.recognize(c); show((r && r.data && r.data.text) || '');
    } catch (e) {
      body.replaceChildren(el('p', {}, 'Ўқиб бўлмади. Интернет борлигини текширинг (биринчи марта модель юкланиши керак) ва қайта уриниб кўринг.'), el('p', {}, String(e && e.message || e)));
      foot.replaceChildren(el('button', { class: 'b s', onclick: start }, 'Бошқа сурат'), el('button', { class: 'b', onclick: read }, 'Қайта уриниш'));
    }
  }
  const clean = (w) => w.replace(/[^ء-غف-ٰٕٱ]/g, '');
  const found = (w) => { try { if (typeof wordHits === 'function' && typeof effQ === 'function' && wordHits(effQ(w)).length) return true; } catch (e) {} try { if (typeof search === 'function' && search(w).length) return true; } catch (e) {} return false; };
  function show(text) {
    const lines = text.split(/\n+/).map(l => l.split(/\s+/).map(clean).filter(w => w.replace(/[ً-ٰٕ]/g, '').length >= 2)).filter(l => l.length);
    let n = 0, ok = 0; const out = [];
    lines.forEach(l => out.push(el('div', { class: 'ln' }, l.map(w => { n++; const f = found(w); if (f) ok++; return el('button', { class: 'w' + (f ? '' : ' no'), lang: 'ar', onclick: () => go(w) }, w); }))));
    if (!n) { body.replaceChildren(el('p', {}, 'Арабча сўз топилмади. Матнни яқинроқдан, равшанроқ суратга олиб кўринг ёки керакли қисмни белгиланг.')); }
    else body.replaceChildren(el('div', { class: 'st' }, n + ' та сўз ўқилди, шундан ' + ok + ' таси луғатда топилди'), el('p', {}, 'Сўзга боссангиз, луғатдан қидирилади. Нуқтали чизиқдаги сўзлар луғатда топилмади — нотўғри ўқилган бўлиши мумкин.'), ...out);
    foot.replaceChildren(el('button', { class: 'b s', onclick: start }, 'Бошқа сурат'), el('button', { class: 'b', onclick: pick }, 'Қайта белгилаш'));
  }
  function go(w) {
    root.hidden = true;
    const run = () => { const q = document.getElementById('q'); if (!q) return false; q.value = w; q.dispatchEvent(new Event('input', { bubbles: true })); window.scrollTo(0, 0); return true; };
    if (!run()) { location.hash = '#home'; setTimeout(run, 400); }
  }
  window.__photoTest = { prep: () => prep(), setSel: (s) => { sel = s; } };
})();

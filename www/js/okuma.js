/* Hüsn-i Kıraat — okuma raporu: okuyuşu dinler, kelime kelime tecvid ve okuma hatalarını bulur.
 *
 * Model: HisnLabs tajweed-v2 (Apache-2.0) — https://huggingface.co/Hisnlabs/tajweed-v2
 *   Ses → Whisper log-mel (80) → ONNX (fonetik yazı, CTC) → beklenen fonetik yazıyla karşılaştırma.
 * Kural motoru: HisnLabs/tajweed imam.py'nin (Apache-2.0) JavaScript'e aktarımı (sifat kontrolü hariç).
 * Beklenen fonetik yazı: quran-transcript (MIT) ile önceden hesaplandı → www/kuran/fonetik/NNN.json
 * Yapay zekâ yanılabilir: bir hocanın yerini tutmaz, kendi kendine çalışmaya yardım eder.
 */
(function () {
  'use strict';
  const MODEL_URL = new URL('model/tajweed-v2-int8.onnx', location.href).href;   // uygulamanın içinde (Apache-2.0, kaynak: huggingface.co/Hisnlabs/tajweed-v2)
    const PHON = ["ء", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "ه", "و", "ي", "ا", "ۦ", "ۥ", "َ", "ُ", "ِ", "۪", "ـ", "ٲ", "ڇ", "ں", "۾", "ۜ", "ؙ"];
  const SR = 16000, NFFT = 400, HOP = 160, NMEL = 80, LEAD = Math.round(SR * 0.4);

  // ------------------------------------------------------------------ log-mel (faster-whisper FeatureExtractor ile aynı)
  let MEL = null, PENCERE = null, COS = null, SIN = null;
  function hazirla() {
    if (MEL) return;
    const nb = NFFT / 2 + 1;
    const fft = Float64Array.from({ length: nb }, (_, k) => k * SR / NFFT);
    const maxMel = 45.245640471924965, mels = Float64Array.from({ length: NMEL + 2 }, (_, i) => maxMel * i / (NMEL + 1));
    const fSp = 200 / 3, minLogHz = 1000, minLogMel = minLogHz / fSp, logstep = Math.log(6.4) / 27;
    const freqs = mels.map(m => m >= minLogMel ? minLogHz * Math.exp(logstep * (m - minLogMel)) : fSp * m);
    MEL = [];
    for (let i = 0; i < NMEL; i++) {
      const w = new Float32Array(nb), enorm = 2 / (freqs[i + 2] - freqs[i]);
      for (let k = 0; k < nb; k++) {
        const lower = -(freqs[i] - fft[k]) / (freqs[i + 1] - freqs[i]), upper = (freqs[i + 2] - fft[k]) / (freqs[i + 2] - freqs[i + 1]);
        w[k] = Math.max(0, Math.min(lower, upper)) * enorm;
      }
      MEL.push(w);
    }
    PENCERE = Float32Array.from({ length: NFFT }, (_, n) => 0.5 - 0.5 * Math.cos(2 * Math.PI * n / NFFT));
    COS = new Float64Array(nb * NFFT); SIN = new Float64Array(nb * NFFT);
    for (let k = 0; k < nb; k++) for (let n = 0; n < NFFT; n++) { const a = 2 * Math.PI * k * n / NFFT; COS[k * NFFT + n] = Math.cos(a); SIN[k * NFFT + n] = Math.sin(a); }
  }
  // ses: Float32Array (16 kHz, mono). Dönüş: { veri: Float32Array [80 × kare], kare }
  function logMel(ses) {
    hazirla();
    const pad = NFFT / 2, n = ses.length, x = new Float32Array(n + 2 * pad);
    x.set(ses, pad);
    for (let i = 0; i < pad; i++) { x[pad - 1 - i] = ses[Math.min(n - 1, i + 1)]; x[pad + n + i] = ses[Math.max(0, n - 2 - i)]; }   // reflect
    const kareTum = 1 + Math.floor((x.length - NFFT) / HOP), kare = kareTum - 1;   // son kare atılır
    const nb = NFFT / 2 + 1, guc = new Float32Array(nb), cerceve = new Float32Array(NFFT);
    const log = new Float32Array(NMEL * kare); let enb = -Infinity;
    for (let f = 0; f < kare; f++) {
      const o = f * HOP;
      for (let i = 0; i < NFFT; i++) cerceve[i] = x[o + i] * PENCERE[i];
      for (let k = 0; k < nb; k++) {
        let re = 0, im = 0; const b = k * NFFT;
        for (let i = 0; i < NFFT; i++) { re += cerceve[i] * COS[b + i]; im -= cerceve[i] * SIN[b + i]; }
        guc[k] = re * re + im * im;
      }
      for (let m = 0; m < NMEL; m++) {
        const w = MEL[m]; let s = 0; for (let k = 0; k < nb; k++) s += w[k] * guc[k];
        const v = Math.log10(Math.max(s, 1e-10)); log[m * kare + f] = v; if (v > enb) enb = v;
      }
    }
    for (let i = 0; i < log.length; i++) log[i] = (Math.max(log[i], enb - 8) + 4) / 4;
    return { veri: log, kare };
  }

  // ------------------------------------------------------------------ model
  let oturum = null;
  function scriptYukle(src) { return new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('yüklenemedi: ' + src)); document.head.appendChild(s); }); }
  async function ortHazir() {
    if (!window.ort) await scriptYukle('js/ort/ort.wasm.min.js');
    window.ort.env.wasm.wasmPaths = new URL('js/ort/', location.href).href;
    window.ort.env.wasm.numThreads = 1;
    return window.ort;
  }
  // Model uygulamayla birlikte gelir; web sürümünde service worker önbelleğe alır
  async function modelIndir(ilerleme) {
    const r = await fetch(MODEL_URL); if (!r.ok) throw new Error('HTTP ' + r.status);
    if (!r.body || !r.body.getReader) return r.arrayBuffer();
    const top = +r.headers.get('content-length') || 23173931; const okuyucu = r.body.getReader(); const parca = []; let gelen = 0;
    for (;;) { const { done, value } = await okuyucu.read(); if (done) break; parca.push(value); gelen += value.length; ilerleme && ilerleme(Math.min(1, gelen / top)); }
    return new Blob(parca).arrayBuffer();
  }
  async function modelAc(ilerleme) {
    if (oturum) return oturum;
    const ort = await ortHazir();
    const buf = await modelIndir(ilerleme);
    oturum = await ort.InferenceSession.create(new Uint8Array(buf), { executionProviders: ['wasm'] });
    return oturum;
  }

  // ses kaydını (Blob) 16 kHz mono Float32Array'e çevir
  async function sesCoz(blob) {
    const buf = await blob.arrayBuffer();
    const AC = window.AudioContext || window.webkitAudioContext; const ac = new AC();
    const ab = await new Promise((ok, no) => { const p = ac.decodeAudioData(buf, ok, no); if (p && p.then) p.then(ok, no); });
    try { ac.close(); } catch (e) { }
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const oac = new OAC(1, Math.max(1, Math.ceil(ab.duration * SR)), SR);
    const src = oac.createBufferSource(); src.buffer = ab; src.connect(oac.destination); src.start();
    const out = await oac.startRendering();
    return out.getChannelData(0);
  }

  // Modelin duyduğu fonetik yazı: { heard, probs, times }  (inference.py hear() ile aynı)
  async function dinle(ses) {
    const s = await modelAc();
    const ort = window.ort;
    const a = new Float32Array(ses.length + 2 * LEAD); a.set(ses, LEAD);
    let { veri, kare } = logMel(a);
    const k = Math.min(3000, Math.floor(kare / 2) * 2);
    let mel = veri;
    if (k !== kare) { mel = new Float32Array(NMEL * k); for (let m = 0; m < NMEL; m++) mel.set(veri.subarray(m * kare, m * kare + k), m * k); }
    const r = await s.run({ mel: new ort.Tensor('float32', mel, [1, NMEL, k]), riwaya: new ort.Tensor('int64', BigInt64Array.from([0n]), [1]) });
    const lp = r.logprobs.data, T = r.logprobs.dims[1], V = r.logprobs.dims[2];
    const step = a.length / SR / T; const out = [], probs = [], times = []; let prev = 0, son = -1;
    for (let t = 0; t < T; t++) {
      let bi = 0, bv = -Infinity; for (let v = 0; v < V; v++) { const x = lp[t * V + v]; if (x > bv) { bv = x; bi = v; } }
      if (bi !== prev && bi !== 0) { out.push(PHON[bi - 1]); probs.push(Math.exp(bv)); times.push((t + 0.5) * step - LEAD / SR); }
      if (bi !== 0) son = t;
      prev = bi;
    }
    times.push(son >= 0 ? (son + 1) * step - LEAD / SR : 0);
    return { heard: out.join(''), probs, times };
  }

  // ------------------------------------------------------------------ Levenshtein (python-Levenshtein / rapidfuzz ile birebir aynı hizalama)
  function editops(a, b) {
    let p = 0; while (p < a.length && p < b.length && a[p] === b[p]) p++;
    let s = 0; while (s < a.length - p && s < b.length - p && a[a.length - 1 - s] === b[b.length - 1 - s]) s++;
    const A = a.slice(p, a.length - s), B = b.slice(p, b.length - s), n = A.length, m = B.length;
    const D = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
    for (let i = 0; i <= n; i++) D[i][0] = i; for (let j = 0; j <= m; j++) D[0][j] = j;
    for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + (A[i - 1] !== B[j - 1] ? 1 : 0));
    let i = n, j = m; const e = [];
    while (i && j) {
      if (D[i][j] - D[i - 1][j] === 1) { i--; e.push(['delete', i, j]); }
      else { j--; if (j && D[i][j] - D[i - 1][j] === -1) e.push(['insert', i, j]); else { i--; if (A[i] !== B[j]) e.push(['replace', i, j]); } }
    }
    while (i) { i--; e.push(['delete', i, j]); } while (j) { j--; e.push(['insert', i, j]); }
    return e.reverse().map(([t, x, y]) => [t, x + p, y + p]);
  }
  function opcodes(a, b) {
    const e = editops(a, b), out = []; let i = 0, j = 0, k = 0;
    while (k < e.length) {
      const [t, si, dj] = e[k];
      if (si > i || dj > j) { out.push(['equal', i, si, j, dj]); i = si; j = dj; }
      const i0 = i, j0 = j;
      while (k < e.length && e[k][0] === t && e[k][1] === i && e[k][2] === j) { if (t === 'replace') { i++; j++; } else if (t === 'delete') i++; else j++; k++; }
      out.push([t, i0, i, j0, j]);
    }
    if (i < a.length || j < b.length) out.push(['equal', i, a.length, j, b.length]);
    return out;
  }

  // ------------------------------------------------------------------ kural motoru (imam.listen)
  const LONG = { 'ا': 1, 'ۥ': 1, 'ۦ': 1 }, HARAKAT = new Set('َُِ'), ONSET = 3, TIME_SIX = 8.3, TIME_FIVE = 7.0;
  const MADD = {
    NormalMaddRule: [[2], 'Med-i tabîî', 'natural madd'], MonfaselMaddRule: [[2, 4, 5], 'Med-i munfasıl', 'madd munfaṣil'],
    MottaselMaddRule: [[4, 5, 6], 'Med-i muttasıl', 'madd muttaṣil'], MottaselMaddPauseRule: [[4, 5, 6], 'Med-i muttasıl (vakıfta)', 'madd muttaṣil at a stop'],
    LazemMaddRule: [[6], 'Med-i lâzım', 'madd lāzim'], AaredMaddRule: [[2, 4, 6], 'Med-i ârız', 'madd ʿāriḍ'],
    LeenMaddRule: [[2, 4, 6], 'Med-i lîn', 'madd līn'], BadalMadd: [[2], 'Med-i bedel', 'madd badal'], LeenHamzaMadd: [[4, 6], 'Hemzeli lîn', 'līn before a hamza']
  };
  const EN = () => window.DIL === 'en';
  const maddAd = r => MADD[r] ? MADD[r][EN() ? 2 : 1] : r;
  // Türk usulü: 2 hareke = 1 elif
  const sayi = n => !n ? (EN() ? 'no lengthening' : 'uzatmadan') : EN() ? `${n} counts` : `${n / 2} elif`;
  const SESLI = { 'َ': ['üstün', 'fatḥah'], 'ُ': ['ötre', 'ḍammah'], 'ِ': ['esre', 'kasrah'] };
  function mesaj(tur, k) {
    const T = {
      madd_short: ['{name} kısa: {heard} uzattın, {want} olmalı', '{name} too short: {heard} instead of {want}'],
      madd_long: ['{name} uzun: {heard} uzattın, {want} olmalı', '{name} too long: {heard} instead of {want}'],
      madd_missing: ['{name} yapılmadı: harf uzatılmalı', '{name} dropped: the vowel must be lengthened'],
      madd_added: ['Med olmayan yerde uzatma yapıldı', 'a vowel lengthened where there is no madd'],
      madd_uneven: ['{name}: hep aynı uzunlukta oku ({lens})', '{name}: keep the same length every time ({lens})'],
      ghunnah_short: ['Ğunne kısa: geniz sesini 1 elif tut', 'ghunnah too short: hold the nasal sound for 2 counts'],
      ikhfa_izhar: ['İhfâ: nûnu açık okudun; ğunneyle gizlenmeli', 'ikhfāʾ: the nūn was pronounced clearly; hide it with ghunnah'],
      ikhfa_short: ['İhfâ: ğunne kısa', 'ikhfāʾ: the ghunnah is too short'],
      iqlab_missed: ['İklâb: nûn, ب harfinden önce ğunneli gizli bir mîme döner', 'iqlāb: the nūn becomes a hidden mīm with ghunnah before ب'],
      idgham_missed: ['İdğâm: nûnu okudun; {letter} harfine katılmalı', 'idghām: the nūn was pronounced; merge it into {letter}'],
      idgham_ghunnah_short: ['Ğunneli idğâm: ğunne eksik', 'idghām with ghunnah: the ghunnah is missing'],
      shadda_missing: ['{letter} harfindeki şedde okunmadı', 'the shaddah on {letter} was not pronounced'],
      qalqalah_missing: ['{letter} harfinde kalkale yok: sektirerek oku', 'qalqalah missing on {letter}: let it bounce'],
      letter: ['{want} yerine {heard} okudun', 'pronounced {heard} instead of {want}'],
      vowel: ['Hareke hatası: {want} yerine {heard}', 'wrong vowel: {heard} instead of {want}'],
      dropped: ['Bir ses düştü: {want}', 'a sound was dropped: {want}'],
      added: ['Fazladan ses: {heard}', 'an extra sound: {heard}'],
      word_missing: ['Bu kelime duyulmadı', 'this word was not heard']
    };
    return T[tur][EN() ? 1 : 0].replace(/\{(\w+)\}/g, (_, a) => k[a] != null ? k[a] : '');
  }
  function boundaries(ref, heard) {
    const b = new Array(ref.length + 1).fill(0);
    for (const [, i1, i2, j1, j2] of opcodes(ref, heard)) for (let k = i1; k <= i2; k++) b[k] = j1 + (i2 > i1 ? pyRound((k - i1) * (j2 - j1) / (i2 - i1)) : 0);
    b[ref.length] = heard.length; return b;
  }
  function pyRound(x) { const f = Math.floor(x), d = x - f; if (d > 0.5) return f + 1; if (d < 0.5) return f; return f % 2 === 0 ? f : f + 1; }   // Python round: yarıyı çifte
  function run(heard, a, b, c) {
    let k = null; for (let x = a; x < b; x++) if (heard[x] === c) { k = x; break; }
    if (k === null) return [0, a, a];
    let s = k, e = k; while (s > 0 && heard[s - 1] === c) s--; while (e < heard.length && heard[e] === c) e++;
    return [e - s, s, e];
  }
  const dur = (heard, times, s, e) => { const a = s && HARAKAT.has(heard[s - 1]) ? times[s - 1] : times[s]; return Math.max(0, times[Math.min(e, times.length - 1)] - a); };
  function tempo(ref, heard, b, times, birikim) {
    if (!times || times.length !== heard.length + 1) return null;
    const ends = new Set([ref.words - 1]); const nat = [];
    for (const u of ref.units) if (u[2] === 'madd' && u[6] === 'NormalMaddRule' && !ends.has(u[3])) {
      const [n, s, e] = run(heard, Math.max(0, b[u[0]] - 1), Math.min(heard.length, b[u[1]] + 1), u[7]);
      if (n >= 1 && n <= 3) nat.push(dur(heard, times, s, e));
    }
    const iyi = nat.filter(d => d > 0.08 && d < 2.0);
    if (birikim) { birikim.push(...iyi); birikim.splice(0, Math.max(0, birikim.length - 40)); }
    const src = iyi.length >= 2 ? iyi : birikim && birikim.length >= 3 ? birikim : [];
    if (!src.length) return null;
    const s = [...src].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] / 2;
  }
  function stripLen(s) { const o = []; for (const c of s) { if (o.length && o[o.length - 1] === c) continue; o.push(c); } return o.filter(c => !LONG[c] && !'ںڇ۾'.includes(c)).join(''); }
  const kume = s => new Set(Array.from(s));
  const altKume = (a, b) => { for (const x of a) if (!b.has(x)) return false; return true; };

  // ref: { p: fonetik yazı, sp: kelime aralıkları, u: birimler, words: kelime sayısı } — heard: modelin yazısı
  function listen(ref, heard, probs, times, opt = {}) {
    const minProb = opt.minProb != null ? opt.minProb : 0.3, minJali = opt.minProbJali != null ? opt.minProbJali : 0.7;
    const P = Array.from(ref.p); heard = Array.from(heard.replace(/ /g, '')); const p = P.join(''), h = heard.join('');
    const b = boundaries(P, heard); const W = ref.sp.length;
    const notes = Array.from({ length: W }, () => []); const covered = new Array(P.length).fill(false);
    let pos = null, span = [0, 0];
    const unsure = (hs, he, thr) => { if (!probs || !probs.length) return false; const seg = probs.slice(Math.max(0, hs - 1), Math.min(probs.length, he + 1)); return seg.length > 0 && Math.min(...seg) < (thr != null ? thr : minProb); };
    const add = (w, rule, sev, exp, got, tur, k = {}) => { if (unsure(span[0], span[1])) return; notes[w].push({ rule, severity: sev, expected: exp, heard: got, pos, msg: mesaj(tur, k) }); };
    const moreNun = (u, hs, he) => heard.slice(Math.max(0, hs - 2), he).filter(c => c === 'ن').length > P.slice(Math.max(0, u[0] - 2), u[1]).filter(c => c === 'ن').length;
    const maddSeen = {}, maddHeard = Array.from({ length: W }, () => []);
    const birim = tempo({ units: ref.u, words: W }, heard, b, times, opt.birikim);
    for (const u of ref.u) {
      const [us, ue, kind, word, golden, allowed0, rule, ch] = u;
      for (let x = us; x < ue; x++) covered[x] = true;
      const hs = b[us], he = b[ue]; pos = us; span = [hs, he];
      if (kind === 'madd') {
        let [n, rs, re] = run(heard, Math.max(0, hs - 1), Math.min(heard.length, he + 1), ch);
        if (rule.startsWith('Leen') && n > 0) n += 1;
        const sym = n; let allowed = allowed0, shown = n ? (n <= 3 ? 2 : n <= 5 ? 4 : 6) : 0;
        if (birim && (n === 4 || n === 5)) { const tc = dur(heard, times, rs, re) / birim; n = tc >= TIME_SIX ? 6 : tc >= TIME_FIVE ? 5 : 4; shown = tc >= TIME_SIX ? 6 : 4; }
        const near = allowed.reduce((x, y) => Math.abs(y - n) < Math.abs(x - n) ? y : x);
        (maddSeen[rule] = maddSeen[rule] || []).push([word, sym]);
        if (shown && rule !== 'NormalMaddRule') maddHeard[word].push({ rule, heard: shown, name: maddAd(rule) });
        if (n === 0 && !rule.startsWith('Leen')) add(word, rule, 'jali', golden, 0, 'madd_missing', { name: maddAd(rule) });
        else if (Math.abs(n - near) > 1 && !unsure(hs, he)) {
          notes[word].push({ rule, severity: 'khafi', expected: allowed, heard: n, pos: us, msg: mesaj(n > near ? 'madd_long' : 'madd_short', { name: maddAd(rule), heard: sayi(n), want: sayi(allowed.includes(golden) ? golden : near) }) });
        }
      } else if (kind === 'qalqalah') {
        if (!heard.slice(Math.max(0, hs - 1), he + 1).includes('ڇ')) add(word, 'qalqalah', 'khafi', 'ڇ', '', 'qalqalah_missing', { letter: us ? P[us - 1] : '' });
      } else if (kind === 'ikhfa') {
        const [n] = run(heard, hs, Math.max(he, hs + 1), 'ں');
        if (n === 0 && heard.slice(hs, he + 1).includes('ن')) add(word, 'ikhfa', 'khafi', golden, 0, 'ikhfa_izhar');
        else if (n && n < golden - 1) add(word, 'ikhfa', 'khafi', golden, n, 'ikhfa_short');
      } else if (kind === 'iqlab') {
        if (!heard.slice(Math.max(0, hs - 1), he + 1).includes('۾')) add(word, 'iqlab', 'khafi', golden, 0, 'iqlab_missed');
      } else if (kind === 'ghunnah' || kind === 'idgham_ghunnah') {
        const [n] = run(heard, Math.max(0, hs - 1), Math.min(heard.length, he + 1), ch);
        if (kind === 'idgham_ghunnah' && ch !== 'ن' && moreNun(u, hs, he)) add(word, 'idgham', 'khafi', golden, n, 'idgham_missed', { letter: ch });
        else if (n < golden) add(word, kind, 'khafi', golden, n, kind === 'ghunnah' ? 'ghunnah_short' : 'idgham_ghunnah_short');
      } else if (kind === 'shadda' || kind === 'idgham') {
        const [n] = run(heard, Math.max(0, hs - 1), Math.min(heard.length, he + 1), ch);
        if (kind === 'idgham' && moreNun(u, hs, he)) add(word, 'idgham', 'khafi', 2, n, 'idgham_missed', { letter: ch });
        else if (n === 1) add(word, 'shadda', 'jali', 2, 1, 'shadda_missing', { letter: ch });
      }
    }
    const izin = new Set([...Object.keys(LONG), 'ڇ', 'ں', '۾', 'ن', 'م']);
    for (const [tag, i1, i2, j1, j2] of opcodes(P, heard)) {
      if (tag === 'equal') continue;
      const exp = P.slice(i1, i2).join(''), got = heard.slice(j1, j2).join('');
      if (i2 > i1 && covered.slice(i1, i2).every(Boolean)) { const ge = kume(got), ek = kume(exp); if (!got || altKume(ge, new Set([...ek, ...izin]))) continue; }
      if (tag === 'insert' && ref.u.some(u => u[2] === 'madd' && u[0] <= i1 && i1 <= u[1] && altKume(kume(got), new Set([u[7]])))) continue;
      let w = ref.sp.findIndex(([a, z]) => a <= i1 && i1 < z); if (w < 0) w = W - 1;
      pos = i1; span = [j1, j2];
      if (i1 < ONSET) continue;
      const ec = stripLen(exp), gc = stripLen(got);
      if (ec === gc) continue;
      if (unsure(j1, j2, minJali)) continue;
      if (tag === 'replace' && Array.from(ec).length === 1 && Array.from(gc).length === 1 && HARAKAT.has(ec) && HARAKAT.has(gc)) {
        notes[w].push({ rule: 'vowel', severity: 'jali', expected: exp, heard: got, pos: i1, msg: mesaj('vowel', { want: SESLI[ec][EN() ? 1 : 0], heard: SESLI[gc][EN() ? 1 : 0] }) });
      } else if (tag === 'replace') add(w, 'letter', 'jali', exp, got, 'letter', { want: exp, heard: got });
      else if (tag === 'delete') { if (altKume(kume(exp), new Set([...Object.keys(LONG), ...HARAKAT])) && Array.from(exp).length === 1) continue; add(w, 'dropped', 'jali', exp, '', 'dropped', { want: exp }); }
      else if (tag === 'insert') {
        if (i1 === 0 || i1 === P.length) continue;
        if (altKume(kume(got), new Set(Object.keys(LONG)))) { if (Array.from(got).length >= 2) add(w, 'madd_added', 'khafi', '', got, 'madd_added'); continue; }
        if (Array.from(got).length === 1 && HARAKAT.has(got)) continue;
        add(w, 'added', 'jali', '', got, 'added', { heard: got });
      }
    }
    ref.sp.forEach(([a, z], k) => { if (z > a && b[z] - b[a] <= Math.max(0, Math.floor((z - a) / 4))) notes[k] = [{ rule: 'word', severity: 'jali', expected: P.slice(a, z).join(''), heard: heard.slice(b[a], b[z]).join(''), pos: a, msg: mesaj('word_missing', {}) }]; });
    for (const [rule, seen] of Object.entries(maddSeen)) {
      if (['MonfaselMaddRule', 'MottaselMaddRule', 'AaredMaddRule', 'BadalMadd'].includes(rule) && seen.length >= 2) {
        const lens = seen.map(x => x[1]).filter(Boolean);
        if (lens.length && Math.max(...lens) - Math.min(...lens) >= 2) {
          const ort = pyRound(lens.reduce((s, x) => s + x, 0) / lens.length);
          const w = seen.reduce((x, y) => Math.abs(y[1] - ort) > Math.abs(x[1] - ort) ? y : x)[0];
          notes[w].push({ rule: rule + ':uneven', severity: 'khafi', expected: 'same', heard: lens, pos: null, msg: mesaj('madd_uneven', { name: maddAd(rule), lens: lens.join(' / ') }) });
        }
      }
    }
    return notes.map((n, k) => ({ index: k, ok: !n.some(x => x.severity === 'jali') && !n.length, notes: n, madd: maddHeard[k] }));
  }

  // ------------------------------------------------------------------ dışa açık
  const FON = {};
  async function fonetik(n) { if (!FON[n]) FON[n] = await (await fetch(`kuran/fonetik/${String(n).padStart(3, '0')}.json`)).json(); return FON[n]; }
  async function ayetRaporu(n, a, sesBlob, opt = {}) {
    const ref = (await fonetik(n))[a - 1]; if (!ref) throw new Error('fonetik yok');
    const ses = sesBlob instanceof Float32Array ? sesBlob : await sesCoz(sesBlob);
    if (ses.length / SR > 29) throw new Error(EN() ? 'The recording is longer than 30 seconds. Recite one āyah (or part of it) at a time.' : 'Kayıt 30 saniyeden uzun. Bir seferde tek ayet (ya da bir kısmını) oku.');
    if (ses.length / SR < 0.5) throw new Error(EN() ? 'The recording is too short.' : 'Kayıt çok kısa.');
    const d = await dinle(ses);
    return { heard: d.heard, kelimeler: listen(ref, d.heard, d.probs, d.times, opt), sure: ses.length / SR };
  }
  window.Okuma = { MODEL_URL, hazir: () => !!oturum, modelAc, sesCoz, logMel, dinle, listen, opcodes, editops, fonetik, ayetRaporu };
})();

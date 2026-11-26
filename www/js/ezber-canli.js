/* Kur'an Yolum — Ezberden oku (canlı takip) ve Ezber çalış */
/* app.js bölündü: bu dosyalar sırayla yüklenir, aynı genel kapsamı paylaşır (bkz. TODO.md). */
'use strict';
  // ------------------------------------------------------------ Ezberden oku (canlı takip)
  // Kelimeler okundukça açılır. Okurken hiçbir uyarı yok; bir ayet ancak bitince değerlendirilir
  // (S.ayar.canliSonuc: 'ayet' → her ayet bitince renklenir, 'son' → hepsi durunca). Yarım kalan ayet değerlendirilmez.
  let CANLI = null;
  const TAKIP_HATA = new Map();   // takip sırasında bulunan açık hatalar (oturum boyunca): 'n:a' → { n, a, p, s }
  function onekHizala(h, R) {   // h'nin tamamı ↔ R'nin en iyi öneki; es[i]: h[0..i) → R[0..es[i])
    const n = h.length, m = Math.min(R.length, n * 2 + 12);
    const D = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
    for (let i = 0; i <= n; i++) D[i][0] = i; for (let j = 0; j <= m; j++) D[0][j] = j;
    for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + (h[i - 1] !== R[j - 1] ? 1 : 0));
    let k = 0, en = Infinity; for (let j = 0; j <= m; j++) if (D[n][j] <= en) { en = D[n][j]; k = j; }
    const es = new Int32Array(n + 1); let i = n, j = k; es[n] = k;
    while (i > 0) { if (j > 0 && D[i][j] === D[i - 1][j - 1] + (h[i - 1] !== R[j - 1] ? 1 : 0)) { i--; j--; } else if (D[i][j] === D[i - 1][j] + 1) i--; else j--; es[i] = Math.max(es[i], j); }
    return { k, mesafe: en, es };
  }
  // Yumuşak eşleme: sıradaki kelime, duyulan metnin herhangi bir yerinde yaklaşık (en çok %40 hata) geçiyor mu?
  // (Tam hizalama güvenilmez bulunup ilerleme durduğunda, yanlış/eksik telaffuzla okunan kelimeyi geçirmek için)
  function yakinEsle(h, w) {
    const m = w.length, n = h.length; if (m < 3 || n < 2) return { ok: false, son: 0, mesafe: m };
    let onc = new Int32Array(n + 1), cur = new Int32Array(n + 1), best = Infinity, son = 0;
    for (let j = 1; j <= m; j++) {
      cur[0] = j;
      for (let i = 1; i <= n; i++) cur[i] = Math.min(onc[i] + 1, cur[i - 1] + 1, onc[i - 1] + (h[i - 1] !== w[j - 1] ? 1 : 0));
      [onc, cur] = [cur, onc];
    }
    for (let i = 0; i <= n; i++) if (onc[i] <= best) { best = onc[i]; son = i; }
    return { ok: best <= Math.floor(m * 0.4), son, mesafe: best };
  }
  // Kademeli tolerans: takılma uzadıkça (ses var, ilerleme yok) hizalamadaki izin verilen hata payı artar
  function canliTolerans(k, takilmaMs, sesVar, hizCarpani) {
    const oran = sesVar && takilmaMs > 8000 ? 0.6 : sesVar && takilmaMs > 5000 ? 0.5 : sesVar && takilmaMs > 3000 ? 0.42 : 0.35;
    return Math.max(3, oran * k * (hizCarpani || 1));
  }
  // Okuma hızına uyum: hızlı okuyanın hece yutması çoğaldığından hata payı biraz artar (1.0–1.4×).
  // Hız = şimdiye kadar açılan fonetik harf / okuma süresi; başvuru hızı ~14 harf/sn (sezgisel, telefonda ayarlanacak)
  function canliHizCarpani(C_) {
    if (!C_ || !C_.ilkIlerleme || C_.c < 20) return 1;
    const sn = (Date.now() - C_.ilkIlerleme) / 1000; if (sn < 4) return 1;
    return Math.min(1.4, Math.max(1, (C_.c / sn) / 14));
  }
  // Mikrofon/ortam kontrolü (ilk saniyelerin ses düzeyi): çok kısık ya da gürültülü ortamda ipucu verir
  function canliOrtamKontrol(rms) {
    if (!rms || rms.length < 8) return { durum: 'ok' };
    const sr = rms.slice().sort((x, y) => x - y), q = f => sr[Math.floor(sr.length * f)] || 0, taban = q(0.15), ust = q(0.9);
    if (ust < 0.006) return { durum: 'sessiz', ipucu: 'Ses çok kısık duyuluyor: telefonu ağzına 20–30 cm yaklaştır, mikrofonu kapatmadığından emin ol.' };
    if (taban > 0.03) return { durum: 'gurultulu', ipucu: 'Ortam gürültülü: sessiz bir yere geç ya da telefonu yaklaştır.' };
    return { durum: 'ok' };
  }
  const canliKelimeler = a => { if (CANLI && CANLI.elBul) return CANLI.elBul(a); const k = document.getElementById('ayet-' + a); return k ? [...k.querySelectorAll('.ayet .kelime')] : []; };
  const canliEl = (a, wi) => { const l = canliKelimeler(a); return l[Math.min(wi, l.length - 1)]; };
  // ops: { bit: son ayet (yoksa sûre sonu), gizle(a, wi): kelime gizlensin mi (yoksa hepsi), bitince(C_): sonuç şerit yerine buraya }
  async function canliBaslat(n, basAyet, ops = {}) {
    if (CANLI) return canliDurdur();
    if (!navigator.mediaDevices || !window.AudioContext && !window.webkitAudioContext) return toast(t('Bu cihazda ses kaydı desteklenmiyor.'));
    const bar = $('#canliBar'); bar.hidden = false; bar.querySelector('.canli-durum').textContent = t('Hazırlanıyor…');
    let O; try { O = await okumaHazirla(); await O.modelAc(p => { const e = bar.querySelector('.canli-durum'); if (e) e.textContent = t('Yapay zekâ modeli hazırlanıyor: {0}', yuzdeStr(Math.round(p * 100))); }); } catch (e) { bar.hidden = true; return toast(e.message || t('Okuma raporu yüklenemedi.')); }
    let akis; try { akis = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 } }); } catch (e) { bar.hidden = true; return toast(t('Mikrofon izni verilmedi. Telefon ayarlarından Kur\'an Yolum için mikrofona izin ver.')); }
    sesDurdur(); const mn = app.querySelector('main'); if (mn) mn.classList.add('canli-mod');
    const fon = await O.fonetik(n), x = SURE(n), son_ = x.ayet.length;
    // Beklenen fonetik yazı: başlangıç ayetinden sûre sonuna kadar art arda
    let G = '', W = [], AY = [];
    const bit_ = Math.min(son_, ops.bit || son_);
    for (let a = basAyet; a <= bit_; a++) { const f = fon[a - 1]; const b = G.length; f.sp.forEach(([s, e], wi) => W.push({ a, wi, s: b + s, e: b + e })); G += f.p; AY.push({ a, s: b, e: G.length }); }
    // Aralık sûre sonundan önce bitiyorsa sıradaki ayet yalnız "bitiş işareti" olarak eklenir (gösterilmez, değerlendirilmez):
    // son ayetin bittiği, okuyucu durmadan devam etse de anlaşılır.
    if (bit_ < son_) G += fon[bit_].p;
    // Önceki sûreye bağlama (ops.onek = { n, a }): önce önceki sûrenin son ayeti (sanal ayet 0), sonra bu sûre.
    // Araya besmele girebilir; okunup okunmadığı o ayet bitince duyulana göre anlaşılır (Tevbe hariç).
    if (ops.onek) {
      const pf = (await O.fonetik(ops.onek.n))[ops.onek.a - 1], pl = pf.p.length;
      W.forEach(w => { w.s += pl; w.e += pl; }); AY.forEach(y => { y.s += pl; y.e += pl; });
      W.unshift(...pf.sp.map(([s_, e_], wi) => ({ a: 0, wi, s: s_, e: e_ }))); AY.unshift({ a: 0, s: 0, e: pl }); G = pf.p + G;
    }
    const AC = window.AudioContext || window.webkitAudioContext; let ctx; try { ctx = new AC({ sampleRate: 16000 }); } catch (e) { ctx = new AC(); }
    const oran = ctx.sampleRate / 16000, parcalar = []; let toplam = 0;
    const kaynak = ctx.createMediaStreamSource(akis);
    const rmsL = [];   // parça başına ses düzeyi: gürültü tabanını ve konuşma düzeyini ölçmek için
    const ekle = g => { let y; if (oran === 1) y = new Float32Array(g); else { const L = Math.floor(g.length / oran); y = new Float32Array(L); for (let i = 0; i < L; i++) y[i] = g[Math.floor(i * oran)]; } parcalar.push(y); toplam += y.length;
      let e = 0; for (const v of y) e += v * v; rmsL.push(Math.sqrt(e / Math.max(1, y.length))); if (rmsL.length > 400) rmsL.shift(); };
    // Ses ayrı iş parçacığında (AudioWorklet) toplanır: model hesaplarken ana iş parçacığı meşgulken parça kaybolmaz
    let isl = null;
    try {
      const kod = `class T extends AudioWorkletProcessor{constructor(){super();this.b=[];this.n=0}process(i){const c=i[0]&&i[0][0];if(c){this.b.push(new Float32Array(c));this.n+=c.length;if(this.n>=2048){const o=new Float32Array(this.n);let p=0;for(const x of this.b){o.set(x,p);p+=x.length}this.port.postMessage(o,[o.buffer]);this.b=[];this.n=0}}return true}}registerProcessor('canli-topla',T);`;
      await ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([kod], { type: 'application/javascript' })));
      isl = new AudioWorkletNode(ctx, 'canli-topla'); isl.port.onmessage = e => ekle(e.data);
      kaynak.connect(isl);
    } catch (e) {
      isl = ctx.createScriptProcessor(4096, 1, 1); isl.onaudioprocess = ev => ekle(ev.inputBuffer.getChannelData(0));
      kaynak.connect(isl); isl.connect(ctx.destination);
    }
    const al = (b, s) => { const o = new Float32Array(Math.max(0, s - b)); let p = 0, i = 0; for (const c of parcalar) { const cs = p, ce = p + c.length; p = ce; if (ce <= b) continue; if (cs >= s) break; const x0 = Math.max(b, cs) - cs, x1 = Math.min(s, ce) - cs; o.set(c.subarray(x0, x1), i); i += x1 - x0; } return o; };
    const kuyruk = { p: Promise.resolve() }; const sirala = f => (kuyruk.p = kuyruk.p.then(f, f));   // model çağrıları tek tek
    // Fâtiha ve Tevbe dışında 1. ayetten başlanırsa okuyucu önce besmele çekebilir: duyulana göre karar verilir
    const besmele = basAyet === 1 && n !== 1 && n !== 9 ? (await O.fonetik(1))[0].p : '';
    CANLI = { n, onek: ops.onek || null, besmele, besmeleKarar: besmele && !ops.onek ? null : 'yok', akis, ctx, isl, kaynak, G, W, AY, c: 0, bas: 0, acilan: 0, bitenAyet: 0, ayetBas: 0, sonuc: {}, bakilan: new Set(), mesgul: false, bitti: false, sirala, al, O, toplam: () => toplam, bitince: ops.bitince, ayetBitti: ops.ayetBitti, hataKaydet: ops.hataKaydet, elBul: ops.elBul, rms: rmsL, sonIlerleme: Date.now(), tani: [], t0: Date.now(), cihaz: { ua: navigator.userAgent, ctxHz: ctx.sampleRate, worklet: !!(isl && isl.port) } };
    // takılınca kelimeye dokunup bakma
    W.forEach(w => { const el = canliEl(w.a, w.wi); if (el) { el.classList.toggle('gizli', !ops.gizle || ops.gizle(w.a, w.wi)); el.classList.remove('canli-acik', 'canli-okundu', 'canli-bakildi', 'r-iyi', 'r-orta', 'r-kotu', 'hata-alt', 'canli-atlandi'); el.onclick = ev => { if (!CANLI || !el.classList.contains('gizli')) return; ev.stopPropagation(); el.classList.remove('gizli'); el.classList.add('canli-bakildi'); CANLI.bakilan.add(w.a + ':' + w.wi); }; } });
    canliSiraIsaretle();
    (ops.elBul ? (ops.elBul(basAyet)[0] || null) : document.getElementById('ayet-' + basAyet))?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    bar.classList.add('dinliyor'); bar.querySelector('#canliDur').textContent = t('⏹ Durdur');
    canliDurumYaz();
    CANLI.zaman = setInterval(() => canliAdim(false), 1000); CANLI.zaman2 = setInterval(canliDurumGuncelle, 500);
    { const C0 = CANLI; setTimeout(() => { if (CANLI !== C0 || C0.bitti || C0.ortamKontrol) return; C0.ortamKontrol = canliOrtamKontrol(C0.rms); if (C0.ortamKontrol.ipucu && !C0.acilan) toast(t(C0.ortamKontrol.ipucu)); }, 4500); }
  }
  function taniKopyala(C_) {   // takip tanı kaydını panoya kopyalar (ses içermez)
    const sr = C_.rms.slice().sort((x, y) => x - y), q = f => +(sr[Math.floor(sr.length * f)] || 0).toFixed(4);
    const j = JSON.stringify({ s: 'takip-tani-1', sure: C_.n, cihaz: C_.cihaz, ortam: canliOrtamKontrol(C_.rms).durum, hiz: +canliHizCarpani(C_).toFixed(2), kelime: [C_.acilan, C_.W.length], sesDuzeyi: { p10: q(0.1), p50: q(0.5), p90: q(0.9), maks: q(0.999) }, adimlar: C_.tani });
    (navigator.clipboard ? navigator.clipboard.writeText(j) : Promise.reject()).then(() => toast(t('Tanı kaydı kopyalandı ✓')), () => { window.prompt(t('Tanı kaydını kopyala:'), j); });
  }
  function canliEsik(C_) {   // sessizlik eşiği: gürültü tabanının üstünde, konuşma düzeyinin altında
    const l = C_.rms.slice(-250); if (l.length < 10) return 0.012; const sr = l.slice().sort((x, y) => x - y), taban = sr[Math.floor(sr.length * 0.15)], ust = sr[Math.floor(sr.length * 0.9)];
    return Math.max(0.012, Math.min(taban * 1.6 + 0.004, taban + (ust - taban) * 0.35));
  }
  // Üç durum: dinliyorum (ses var, ilerliyor) · bekliyorum (sustun) · takıldım (ses var ama kelime eşleşmiyor)
  function canliDurumGuncelle() {
    const C_ = CANLI; if (!C_ || C_.bitti) return;
    const son = C_.toplam(), x = C_.al(Math.max(0, son - 12000), son); let e = 0; for (const v of x) e += v * v;
    const ses = x.length > 2000 && Math.sqrt(e / x.length) > canliEsik(C_), dur = Date.now() - C_.sonIlerleme;
    C_.durum = dur < 2500 ? 'dinle' : !ses ? 'bekle' : dur > 4000 ? 'takildi' : 'dinle';
    const bar = document.getElementById('canliBar'); if (bar) bar.dataset.durum = C_.durum;
    canliDurumYaz(); canliIlerleme();
  }
  // Sayfa boyunca ilerleme çubuğu: okunan yer ▶, ayet çentikleri (hatalı ayet kırmızı)
  function canliIlerleme() {
    const bar = document.getElementById('canliBar'), pb = bar && bar.querySelector('.canli-ilerleme'); if (!pb) return;
    const L = [...document.querySelectorAll('.ko-sayfa .kelime')].filter(x => x.textContent.trim()); if (!L.length) return;
    const sira = document.querySelector('.ko-sayfa .kelime.canli-sira');
    let i = sira ? L.indexOf(sira) : -1;
    if (i < 0) { for (let k = L.length - 1; k >= 0; k--) if (/canli-okundu|canli-acik|r-iyi|r-orta|r-kotu|canli-atlandi/.test(L[k].className)) { i = k + 1; break; } }
    const yuzde = Math.max(0, Math.min(100, Math.round(100 * Math.max(0, i) / L.length)));
    const cent = [...document.querySelectorAll('.ko-sayfa .ko-a')].map(a => { const w = [...a.querySelectorAll('.kelime')].find(x => x.textContent.trim()); const k = w ? L.indexOf(w) : -1; return k < 0 ? '' : `<s class="${TAKIP_HATA.has(a.dataset.ayet) ? 'hata' : ''}" style="left:${(100 * k / L.length).toFixed(1)}%"></s>`; }).join('');
    pb.setAttribute('aria-valuenow', yuzde); pb.innerHTML = `<i style="width:${yuzde}%"></i>${cent}<b style="left:${yuzde}%">▶</b>`;
    const ey = bar.querySelector('.canli-eylem'); if (ey) { ey.hidden = !(CANLI && CANLI.durum === 'takildi'); ey.classList.toggle('buyuk', !!CANLI && Date.now() - CANLI.sonIlerleme > 7000); }
  }
  // Takıldığın kelimeyi geç: gri "okunmadı" olarak işaretlenir, okumaya sonraki kelimeden devam edilir
  function canliKelimeGec() {
    const C_ = CANLI; if (!C_ || C_.bitti) return; const w = C_.W[C_.acilan]; if (!w) return;
    const el = canliEl(w.a, w.wi); if (el) { el.classList.remove('gizli', 'canli-sira'); el.classList.add('canli-atlandi'); }
    C_.acilan++; C_.c = w.e; C_.bas = C_.toplam(); C_.sonIlerleme = Date.now(); C_.durum = 'dinle';
    if (C_.tani.length < 300) C_.tani.push({ s: Math.round((Date.now() - C_.t0) / 100) / 10, karar: 'gec', ac: C_.acilan });
    canliSiraIsaretle(); canliDurumGuncelle();
  }
  function canliDurumYaz() {
    const C_ = CANLI; if (!C_) return; const e = document.querySelector('#canliBar .canli-durum'); if (!e) return;
    const kk = !!document.querySelector('#canliBar .ko-ic'), dur = Date.now() - C_.sonIlerleme;
    const w = C_.W[Math.min(C_.acilan, C_.W.length - 1)], bekle = C_.durum === 'bekle' && w && C_.acilan < C_.W.length;
    if (kk) {   // Kur'an sayfası: kısa, küçük durum etiketi (renkli nokta + metin)
      e.textContent = bekle ? t('Bekliyorum · {0}. ayet, {1}. kelime', w.a, w.wi + 1) : C_.durum === 'takildi' ? (dur > 7000 ? t('Anlayamadım. Biraz yavaş ve net oku ya da kelimeyi geç.') : t('Kelimeyi eşleştiremedim')) : t('Dinliyorum · {0}/{1}', C_.acilan, C_.W.length);
    } else e.textContent = dur > 5000 ? t('Bitirdiysen ⏹ düğmesine dokun.') : t('🎙️ Dinliyorum · {0}/{1} kelime', C_.acilan, C_.W.length);
  }
  function canliSiraIsaretle() {
    document.querySelectorAll('.kelime.canli-sira').forEach(e => e.classList.remove('canli-sira'));
    const C_ = CANLI; if (!C_) return; const w = C_.W[C_.acilan]; if (!w) return;
    const el = canliEl(w.a, w.wi); if (el) { el.classList.add('canli-sira'); if (C_.acilan && C_.W[C_.acilan - 1].a !== w.a) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }
  function canliAc(hedef) {   // hedef: G içindeki konum; bitişi hedefe kadar olan kelimeler açılır
    const C_ = CANLI; let degisti = false;
    while (C_.acilan < C_.W.length && C_.W[C_.acilan].e <= hedef) { const w = C_.W[C_.acilan], el = canliEl(w.a, w.wi); if (el && el.classList.contains('gizli')) { el.classList.remove('gizli'); el.classList.add('canli-acik'); } else if (el) el.classList.add('canli-okundu'); C_.acilan++; degisti = true; }
    if (degisti) { C_.sonIlerleme = Date.now(); canliSiraIsaretle(); canliDurumYaz(); }
  }
  async function canliAdim(sonAdim) {
    const C_ = CANLI; if (!C_ || C_.mesgul) return; if (!document.getElementById('canliBar')) return canliDurdur(true);
    const son = C_.toplam(); if (!sonAdim && son - C_.bas < 8000) return;
    C_.mesgul = true;
    try {
      const seg = C_.al(C_.bas, son);
      const t0_ = performance.now(), d = await C_.sirala(() => C_.O.dinle(seg)), ms = Math.round(performance.now() - t0_);
      if (CANLI !== C_) return;
      const h = d.heard; if (window.__canliLog) console.log('canlı duy', C_.c, h);
      if (C_.besmeleKarar === null) {   // besmele çekildi mi?
        if (h.length < C_.besmele.length * 0.7 && !sonAdim) return;
        const B = onekHizala(h, C_.besmele), Y = onekHizala(h, C_.G.slice(C_.c));
        const bVar = onekHizala(h.slice(0, C_.besmele.length + 4), C_.besmele).mesafe < C_.besmele.length * 0.35 && B.mesafe <= Y.mesafe + C_.besmele.length;
        C_.besmeleKarar = bVar ? 'var' : 'yok';
        // besmele, şu anki konuma (başta 0; önceki sûreye bağlamada o ayetin bittiği yer) eklenir
        if (bVar) { const bl = C_.besmele.length, k = C_.c; C_.G = C_.G.slice(0, k) + C_.besmele + C_.G.slice(k); C_.W.forEach(w => { if (w.s >= k) { w.s += bl; w.e += bl; } }); C_.AY.forEach(y => { if (y.s >= k) { y.s += bl; y.e += bl; } }); }
      }
      // Dururken yarım kalan ayet: en az %60'ı okunduysa yine değerlendirilir (takılınan kelimenin hatası gösterilsin)
      const yarimDegerlendir = () => { const ay = C_.AY[C_.bitenAyet]; if (!ay) return; const wl = C_.W.filter(w => w.a === ay.a), ac = wl.filter(w => C_.W.indexOf(w) < C_.acilan).length;
        // uzun takılmada ses 29 sn sınırını aşmasın: yalnız son 20 sn (okuma ve ardından gelen sessizlik)
        if (ac && ac >= Math.ceil(wl.length * 0.6)) { canliAyetBitti(ay.a, Math.max(C_.ayetBas, son - 20 * 16000), son); C_.ayetBas = son; C_.bitenAyet++; } };
      const A = onekHizala(h, C_.G.slice(C_.c));
      // Tanı kaydı (yalnız metin ve sayılar; ses kaydedilmez): her adımda ne duyuldu, ne bekleniyordu, neden ilerlenmedi
      const tani = (karar, ek) => { if (C_.tani.length < 300) C_.tani.push(Object.assign({ s: Math.round((Date.now() - C_.t0) / 100) / 10, pen: +((son - C_.bas) / 16000).toFixed(1), ms, duyulan: h.length, k: A.k, fark: A.mesafe, ac: C_.acilan, karar, duy: h.slice(0, 100), bek: C_.G.slice(C_.c, C_.c + Math.min(100, A.k + 8)) }, ek || {})); };
      // güvenilmeyen hizalama (tekrar okuma, başka ayet, gürültü): ilerleme yok; pencere çok uzarsa eski ses bırakılır
      if (A.k > 0 && A.mesafe > canliTolerans(A.k, Date.now() - C_.sonIlerleme, C_.durum === 'takildi', canliHizCarpani(C_))) {
        // Hizalama güvenilmez; ama art arda reddedilip ses sürüyorsa sıradaki kelimeyi duyulanın içinde yaklaşık ara
        C_.retSay = (C_.retSay || 0) + 1;
        const wn = C_.W[C_.acilan];
        if (!sonAdim && C_.retSay >= 2 && wn) {
          const ym = yakinEsle(h, C_.G.slice(wn.s, wn.e));
          if (ym.ok) {
            canliAc(wn.e); C_.c = Math.max(C_.c, wn.e); C_.retSay = 0;
            C_.bas = ym.son > 0 && ym.son <= d.times.length ? C_.bas + Math.max(0, Math.round((d.times[ym.son - 1] + 0.08) * 16000)) : son;
            tani('yumusak', { fark: ym.mesafe }); return;
          }
        }
        tani('ret', { son: !!sonAdim }); if (sonAdim) yarimDegerlendir(); else if ((son - C_.bas) / 16000 > 12) C_.bas = son - 4 * 16000; return; }
      // okuyucu durduysa (son ~0,9 sn sessiz) ya da bitirdiyse: büyük kısmı duyulan kelime de tamamlanmış sayılır (uzun med, vakf)
      const kuyrukSes = seg.subarray(Math.max(0, seg.length - 14400)); let e2 = 0; for (const v of kuyrukSes) e2 += v * v;
      // Sessizlik eşiği ortama göre: gürültü tabanının üstünde, konuşma düzeyinin altında (telefonda oda gürültüsü 0,012'yi aşabiliyor)
      const esik = canliEsik(C_);
      // Son kelime de açıldıysa ve 1,5 sn yeni ilerleme yoksa okuma bitmiş sayılır (gürültüde de)
      const sonKelimeBekledi = C_.acilan >= C_.W.length && Date.now() - C_.sonIlerleme > 1500;
      const sessiz = kuyrukSes.length >= 14400 && Math.sqrt(e2 / kuyrukSes.length) < esik;
      const durdu = sonAdim || sonKelimeBekledi || sessiz;
      let ilerle = C_.c + A.k - (durdu ? 0 : 1);
      const sira = C_.W[C_.acilan];
      if (durdu && sira && ilerle < sira.e && ilerle >= sira.s + 0.6 * (sira.e - sira.s)) ilerle = sira.e;
      C_.retSay = 0; if (!C_.ilkIlerleme && ilerle > C_.c) C_.ilkIlerleme = Date.now() - 1000; canliAc(ilerle); tani('ilerle', { il: ilerle, durdu: !!durdu });
      const zamanBul = hedef => { let hi = -1; for (let i = 0; i <= h.length; i++) if (A.es[i] <= hedef - C_.c) hi = i; return hi > 0 && hi <= d.times.length ? C_.bas + Math.max(0, Math.round((d.times[hi - 1] + 0.08) * 16000)) : null; };
      // biten ayetler: bir sonraki ayetin okunmaya başlandığı görülünce (ya da son adımda tamamı okununca)
      while (C_.bitenAyet < C_.AY.length) {
        const ay = C_.AY[C_.bitenAyet];
        if (!(ilerle > ay.e || (durdu && ilerle >= ay.e))) {
          // Dururken: ayetin en az %60'ı okunduysa yine değerlendirilir (takılınan son kelime "okunmadı" diye geçilmesin, hatası gösterilsin)
          if (sonAdim) yarimDegerlendir();
          break;
        }
        const bitis = ilerle > ay.e ? (zamanBul(ay.e) || son) : son;   // durarak bitirdiyse sessizlik dahil sona kadar
        canliAyetBitti(ay.a, C_.ayetBas, bitis);
        C_.ayetBas = bitis; C_.bitenAyet++;
        if (!sonAdim) { C_.bas = bitis; C_.c = ay.e; }
        // önceki sûrenin ayeti bitti: sıradaki okunuşta besmele çekildi mi, bakılır
        if (ay.a === 0 && C_.besmele && !sonAdim) { C_.besmeleKarar = null; break; }
      }
      // pencere uzadıysa son açılan kelimeye çapa at
      if (!sonAdim && (son - C_.bas) / 16000 > 6 && C_.acilan > 0) {
        const w = C_.W[C_.acilan - 1]; if (w.e > C_.c) { const z = zamanBul(w.e); if (z) { C_.bas = z; C_.c = w.e; } }
      }
      if (C_.bitenAyet >= C_.AY.length) canliDurdur();
      // Son ayette takılıp sustuysa (2,5 sn ilerleme yok ve sessiz) ve ayetin çoğu okunduysa okuma kendiliğinden biter
      else if (!sonAdim && sessiz && C_.bitenAyet === C_.AY.length - 1 && Date.now() - C_.sonIlerleme > 2500) {
        const ay = C_.AY[C_.AY.length - 1], wl = C_.W.filter(w => w.a === ay.a), ac = wl.filter(w => C_.W.indexOf(w) < C_.acilan).length;
        if (ac >= Math.ceil(wl.length * 0.6)) canliDurdur();
      }
    } catch (e) { console.warn('canlı takip', e); }
    finally { C_.mesgul = false; }
  }
  function canliAyetBitti(a, bas, bitis) {
    const C_ = CANLI;
    // a = 0: önceki sûreye bağlamada o sûrenin son ayeti; rapor o ayete göre çıkar, sonuç 0 anahtarıyla saklanır
    const [rn, ra] = a === 0 && C_.onek ? [C_.onek.n, C_.onek.a] : [C_.n, a];
    const seg = C_.al(Math.max(0, bas - 3200), Math.min(C_.toplam(), bitis + 3200));
    if (seg.length / 16000 > 29) { C_.sonuc[a] = { uzun: true }; return; }
    C_.sirala(async () => {
      try {
        const s = await C_.O.ayetRaporu(rn, ra, seg); C_.sonuc[a] = s; raporKaydet(rn, ra, s);
        if ((S.ayar.canliSonuc || 'ayet') === 'ayet') canliAyetBoya(a, s);
        if (C_.hataKaydet) C_.hataKaydet(a, s);
        if (C_.ayetBitti && !C_.durduruldu) C_.ayetBitti(a, s);
      } catch (e) { C_.sonuc[a] = { hata: e.message }; }
    });
  }
  function canliAyetBoya(a, s) {
    const K = s.kelimeler; canliKelimeler(a).forEach((el, i) => {
      const w = K[Math.min(i, K.length - 1)]; if (!w) return;
      el.classList.remove('canli-acik', 'canli-okundu', 'canli-sira', 'gizli', 'hata-alt', 'canli-atlandi');
      const jali = w.notes.some(z => z.severity === 'jali');
      el.classList.add(!w.notes.length ? 'r-iyi' : jali ? 'r-kotu' : 'r-orta'); if (jali) el.classList.add('hata-alt');
    });
    const [rn, ra] = a === 0 && CANLI && CANLI.onek ? [CANLI.onek.n, CANLI.onek.a] : [CANLI ? CANLI.n : 0, a];
    const kutu = document.getElementById('rapor-' + a); if (kutu) { kutu.innerHTML = raporHTML(rn, ra, s); kutu.hidden = !(s.kelimeler.some(w => w.notes.length)); }
  }
  async function canliDurdur(sessiz, elle) {   // elle: the user pressed Stop (no automatic page change afterwards)
    const C_ = CANLI; if (!C_ || C_.bitti) return; C_.bitti = true; C_.durduruldu = !!sessiz; C_.elleDurdu = !!elle; clearInterval(C_.zaman); clearInterval(C_.zaman2);
    // Durdur'a basılır basılmaz: mikrofon kapanır, düğme "değerlendiriliyor" olur ve bir kare çizilir; ağır model işi ondan sonra başlar
    try { C_.isl.disconnect(); C_.kaynak.disconnect(); } catch (e) { }
    C_.akis.getTracks().forEach(x => x.stop());
    const bar = document.getElementById('canliBar');
    if (bar) { bar.classList.remove('dinliyor'); bar.dataset.durum = 'bitir'; const d = bar.querySelector('.canli-durum'); if (d) d.textContent = t('Son kelimeler değerlendiriliyor…'); const db = bar.querySelector('#canliDur'); if (db) { db.disabled = true; db.textContent = t('⏳ Bekle…'); } const ey = bar.querySelector('.canli-eylem'); if (ey) ey.hidden = true; }
    await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
    // son adım: duyulanın tamamıyla hizala (son kelime ve son ayet için)
    while (C_.mesgul) await new Promise(r => setTimeout(r, 100));
    if (!sessiz) { CANLI = C_; await canliAdim(true); }
    await C_.sirala(() => null); try { C_.ctx.close(); } catch (e) { }
    CANLI = null; document.querySelectorAll('.kelime.canli-sira').forEach(e => e.classList.remove('canli-sira'));
    if (sessiz || !document.getElementById('canliBar')) return;
    if (C_.bitince) return C_.bitince(C_);
    canliSonucGoster(C_);
  }
  function canliSonucGoster(C_) {
    const bar = document.getElementById('canliBar'); const ayetler = Object.keys(C_.sonuc).map(Number).sort((a, b) => a - b);
    let dogru = 0, kontrol = 0, yanlis = 0;
    for (const a of ayetler) { const s = C_.sonuc[a]; if (!s.kelimeler) continue; if ((S.ayar.canliSonuc || 'ayet') === 'son') canliAyetBoya(a, s);
      s.kelimeler.forEach(w => { if (!w.notes.length) dogru++; else if (w.notes.some(z => z.severity === 'jali')) yanlis++; else kontrol++; }); }
    const yarim = C_.AY.find(y => !(y.a in C_.sonuc) && C_.W.some(w => w.a === y.a && C_.W.indexOf(w) < C_.acilan));
    const yanlisAyet = ayetler.find(a => C_.sonuc[a].kelimeler && C_.sonuc[a].kelimeler.some(w => w.notes.some(z => z.severity === 'jali')));
    const top_ = dogru + kontrol + yanlis;
    bar.innerHTML = `<div class="canli-sonuc">
      <p class="canli-baslik">${top_ ? (yanlis ? t('{0} kelimeden {1} tanesini doğru okudun.', top_, dogru + kontrol) : t('Maşallah! {0} kelimenin hepsini doğru okudun.', top_)) : t('Değerlendirilecek tam bir ayet okunmadı.')}</p>
      ${top_ ? `<div class="canli-sayilar"><span class="r-iyi">🟢 ${t('{0} doğru', dogru)}</span>${kontrol ? `<span class="r-orta">🟠 ${t('{0} kontrol et', kontrol)}</span>` : ''}${yanlis ? `<span class="r-kotu">🔴 ${t('{0} yanlış', yanlis)}</span>` : ''}${C_.bakilan.size ? `<span class="canli-bakildi">👁️ ${t('{0} bakıldı', C_.bakilan.size)}</span>` : ''}</div>` : ''}
      ${yarim ? `<p class="soluk kucukyazi">${t('{0}. ayet yarım kaldı; yarım ayet değerlendirilmez.', yarim.a)}</p>` : ''}
      ${ayetler.some(a => C_.sonuc[a].uzun) ? `<p class="soluk kucukyazi">${t('30 saniyeden uzun ayetler için ayrıntılı rapor yok.')}</p>` : ''}
      <p class="soluk kucukyazi">${t('Ayrıntı için ayetlerin altındaki rapora bak. Yapay zekâ yanılabilir; son söz hocanındır.')}</p>
      <div class="satir sola">${yanlisAyet ? `<button class="btn" data-canli-bas="${yanlisAyet}">${t('🔁 {0}. ayetten tekrar oku', yanlisAyet)}</button>` : ''}<button class="btn ${yanlisAyet ? 'ikincil' : ''}" data-canli-bas="1">${t('🎙️ Baştan oku')}</button><button class="btn ikincil" id="canliKapat">${t('Kapat')}</button></div></div>`;
    bar.querySelectorAll('[data-canli-bas]').forEach(b => b.onclick = () => { const a = +b.dataset.canliBas; canliBarSifirla(); canliBaslat(C_.n, a); });
    bar.querySelector('#canliKapat').onclick = () => { canliBarSifirla(); bar.hidden = true; };
  }
  function canliBarHTML(ok) { return `${ok ? '<div class="canli-ilerleme" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i><b>▶</b></div>' : ''}<div class="canli-ic${ok ? ' ko-ic' : ''}">${ok ? `<button class="btn ikincil ko-ok" id="koOkGeri" aria-label="${t('Önceki ayet')}">‹</button>` : ''}<span class="canli-nokta"></span><span class="canli-durum"></span><button class="btn kirmizi-btn" id="canliDur">${t('⏹ Durdur')}</button>${ok ? `<button class="btn ikincil ko-ok" id="koOkIleri" aria-label="${t('Sonraki ayet')}">›</button>` : ''}</div>${ok ? `<div class="canli-eylem" hidden><button class="btn kucuk" id="koGec">${t('Bu kelimeyi geç ›')}</button><button class="btn kucuk ikincil" id="koTaniHizli" aria-label="${t('Tanı kaydını kopyala')}">🛠</button></div>` : ''}`; }
  function canliBarSifirla(ok) { const bar = document.getElementById('canliBar'); if (!bar) return; bar.innerHTML = canliBarHTML(!!ok); bar.querySelector('#canliDur').onclick = () => canliDurdur(false, true); if (ok) { bar.querySelector('#koOkGeri').onclick = ok.geri; bar.querySelector('#koOkIleri').onclick = ok.ileri; bar.querySelector('#koGec').onclick = canliKelimeGec; bar.querySelector('#koTaniHizli').onclick = () => { if (CANLI) taniKopyala(CANLI); }; } document.querySelectorAll('[id^="rapor-"]').forEach(k => { k.hidden = true; k.innerHTML = ''; }); }
  // ------------------------------------------------------------ Ezber çalış: tek ekran, adım adım (karar: claude/toplanti-2026-11-16-ezber-ux.md)
  // Adımlar: 0 Dinle · 1 Bakarak oku · 2 Yarısı gizli · 3 Ezberden · 4 Bağla (önceki ayetlerle birlikte; sûrenin ilk dersinde yok).
  // Kısa ayetler günlük ders kadar birlikte çalışılır; uzun ayet (EZ_UZUN kelimeden çok) tek başına.
  // Tekrar kipi: sûrenin ezberlenen kısmı tamamen gizli okunur; hatalı ayetler "zayıf" olur ve ertesi gün yine sorulur.
  const EZ_UZUN = 10;
  let EZ = null, ezZincir = [];
  const ezAdimAd = () => [t('Dinle'), t('Bakarak'), t('Yarısı'), t('Ezberden'), t('Bağla')];
  // Reading format (Arabic size + page colour) for the Ezber and Tekrarla screens. ezTema '' = follow the app theme.
  const readingThemeClass = () => S.ayar.ezTema ? 'tema-' + S.ayar.ezTema : '';
  function readingFormatPanel(screenEl) {
    document.querySelectorAll('.ko-menu').forEach(x => x.remove());
    const m = document.createElement('div'); m.className = 'ko-menu ko-ayar kart'; m.setAttribute('role', 'dialog'); document.body.appendChild(m);
    const kapat = () => { m.remove(); document.removeEventListener('click', disari, true); };
    const disari = e => { if (!m.contains(e.target) && !e.target.closest('[data-aa-format]')) kapat(); };
    const ciz_ = () => {
      const ar = S.ayar.arYazi || 1, tema = S.ayar.ezTema || '';
      m.innerHTML = `<p class="ko-menu-baslik">${t('Yazı ve renk')}</p>
        <p class="kucukyazi soluk ko-menu-et">${t('Arapça yazı')}</p><div class="ko-secim">${[[0.85, 'ع−'], [1, 'ع'], [1.2, 'ع+'], [1.4, 'ع++']].map(([v, ad]) => `<button class="${ar === v ? 'aktif' : ''}" data-aa-ar="${v}">${ad}</button>`).join('')}</div>
        <p class="kucukyazi soluk ko-menu-et">${t('Sayfa rengi')}</p><div class="tema-renkler"><button class="tema-nokta ${tema === '' ? 'aktif' : ''}" data-aa-tema="" title="${t('Otomatik')}" aria-label="${t('Otomatik')}"><span aria-hidden="true">⚙</span></button>${KO_TEMALAR.map(([v, ad]) => `<button class="tema-nokta tema-${v} ${tema === v ? 'aktif' : ''}" data-aa-tema="${v}" title="${t(ad)}" aria-label="${t(ad)}"><span aria-hidden="true">Aa</span></button>`).join('')}</div>
        <div class="satir" style="margin-top:12px"><button class="btn" id="aaKapat">${t('Kapat')}</button></div>`;
      m.querySelectorAll('[data-aa-ar]').forEach(b => b.onclick = () => { S.ayar.arYazi = +b.dataset.aaAr; temaUygula(); kaydet(); ciz_(); });
      m.querySelectorAll('[data-aa-tema]').forEach(b => b.onclick = () => { S.ayar.ezTema = b.dataset.aaTema; kaydet(); if (screenEl) { screenEl.className = screenEl.className.replace(/\btema-\S+/g, '').trim(); if (S.ayar.ezTema) screenEl.classList.add('tema-' + S.ayar.ezTema); } ciz_(); });
      m.querySelector('#aaKapat').onclick = kapat;
    };
    ciz_(); setTimeout(() => document.addEventListener('click', disari, true), 0);
  }
  // Beginner: fewer than 10 ayahs memorized in total
  function ezAcemi() { return Object.values(S.ezber || {}).reduce((t_, z) => t_ + (z && z.tam ? 1000 : (z && z.a) || 0), 0) < 10; }
  function ezAralik(n, bas) {
    const x = SURE(n), top = x.ayet.length, hedef = S.ayar.ezberHedef || 3; let bit = bas;
    for (let a = bas; a <= top && a - bas < hedef; a++) { const uzun = x.ayet[a - 1].split(' ').length > EZ_UZUN; if (uzun && a > bas) break; bit = a; if (uzun) break; }
    return [bas, bit];
  }
  // Dışarıdan açılış: her açılış yeni bir çalışma
  function ezAc(n, mod, bas) { EZ = null; git('ezberCalis', n, mod || 'yeni', bas || ''); }
  const ezGorevAd = g => g.mod === 'tekrar' ? t('{0} tekrarı', sureNoAdi(g.n)) : t('{0} yeni ders', sureNoAdi(g.n));
  EKRAN.ezberCalis = function (n, mod = 'yeni', bas, tek) {   // tek: yalnız 'bas' ayeti (zayıf ayet çalışması)
    n = +n; const x = SURE(n);
    if (!x) {
      app.innerHTML = `${ust(esc(sureNoAdi(n)))}<main><p class="soluk">${t('Yükleniyor…')}</p></main>`;
      sureYukle(n).then(() => { const ek = ekranYigini[ekranYigini.length - 1]; if (ek[0] === 'ezberCalis' && +ek[1][0] === n) ciz(); }).catch(() => toast(t('Sûre açılamadı.')));
      return;
    }
    if (CANLI) canliDurdur(true);
    if (S.ayar.ezMeal && akMealYok !== n && !mealSecili().every(z => mealVeri(z, n))) {
      Promise.all(mealSecili().map(z => mealKaynakYukle(z, n))).catch(() => { akMealYok = n; }).then(() => { const ek = ekranYigini[ekranYigini.length - 1]; if (ek[0] === 'ezberCalis' && +ek[1][0] === n) ciz(); });
    }
    ezberEkle(n); const e = ezb(n), top = x.ayet.length;
    if (mod === 'yeni' && !+bas && e.tam) mod = 'tekrar';
    if (mod === 'tekrar' && !e.tam && !e.a) mod = 'yeni';
    if (!EZ || EZ.n !== n || EZ.mod !== mod || EZ.yigin !== ekranYigini.length) {
      const [b1, b2] = mod === 'tekrar' ? [1, e.tam ? top : e.a] : +tek && +bas ? [+bas, +bas] : ezAralik(n, +bas || Math.min(top, Math.max(e.a + 1, e.son || 0)));
      if (mod === 'yeni') { e.son = b1; kaydet(); }   // remember where the user was working, so reopening continues there
      EZ = { n, mod, yigin: ekranYigini.length, bas: b1, bit: b2, adim: mod === 'tekrar' ? 3 : 0, bakis: 0, ilkKelime: false, bitti: false, sonuc: null };
    }
    // Önceki sûreye bağlama: sûrenin ilk dersinde, önceki sûre (mushaf sırasıyla) tam ezberdeyse onun son ayetiyle birlikte okunur
    const onceki = EZ.mod === 'yeni' && EZ.bas === 1 && n > 1 && ezb(n - 1) && ezb(n - 1).tam ? n - 1 : 0;
    if (onceki && !SURE(onceki)) { sureYukle(onceki).then(() => { const ek = ekranYigini[ekranYigini.length - 1]; if (ek[0] === 'ezberCalis' && +ek[1][0] === n) ciz(); }).catch(() => { }); }
    const onek = onceki && SURE(onceki) ? { n: onceki, a: SURE(onceki).ayet.length } : null;
    const Z = EZ, baglaVar = Z.mod === 'yeni' && (Z.bas > 1 || !!onek), adimSay = baglaVar ? 5 : 4, onekAktif = Z.adim === 4 && onek;
    const [okBas, okBit] = Z.adim === 4 ? [1, Z.bit] : [Z.bas, Z.bit];
    const gizle = (a, wi) => Z.adim === 2 ? wi % 2 === 1 : Z.adim >= 3 ? !(Z.ilkKelime && wi === 0) : false;
    const baslik = Z.mod === 'tekrar' ? t('{0} · tekrar', esc(sureNoAdi(n))) : `${esc(sureNoAdi(n))} · ${Z.bas === Z.bit ? Z.bas : Z.bas + '–' + Z.bit}`;
    // ---- bitti görünümü
    if (Z.bitti) {
      const sira = ezZincir[0], ee = ezb(n);
      app.innerHTML = `${ust(baslik)}<main class="ez-ekran">
        <section class="kart ez-bitti"><div class="ez-bitti-ikon" aria-hidden="true">✓</div>
          <h2>${Z.mod === 'tekrar' ? t('Tekrar tamam') : t('Bugünkü ezber tamam')}</h2>
          <p>${Z.mod === 'tekrar' ? (Z.zayif && Z.zayif.length ? t('{0} ayette takıldın; yarın yine sorulacak.', Z.zayif.length) : t('Hiç takılmadan okudun. Maşallah!')) : (Z.bas === Z.bit ? t('{0}, {1}. ayet ezberine eklendi.', esc(sureNoAdi(n)), Z.bas) : t('{0}, {1}. ayetler ezberine eklendi.', esc(sureNoAdi(n)), Z.bas + '–' + Z.bit))}</p>
          ${Z.zayif && Z.zayif.length ? `<div class="satir sola">${Z.zayif.map(a => `<button class="btn ikincil" data-ez-calis="${a}">${t('{0}. ayeti çalış', a)}</button>`).join('')}</div>` : ''}
          ${Z.atlanan && Z.atlanan.length ? `<p class="soluk kucukyazi">${t('Atladığın ayetler: {0}. Bunları da çalışmadan ezberlenmiş sayılmaz; yarın tekrarda sorulacak.', Z.atlanan.length === 1 ? Z.atlanan[0] : Z.atlanan[0] + '–' + Z.atlanan[Z.atlanan.length - 1])}</p><div class="satir sola"><button class="btn ikincil" id="ezAtlananCalis">${t('Atladığım ayetleri çalış')}</button></div>` : ''}
          <div class="ez-bitti-dugmeler">
            ${sira ? `<button class="btn genis" id="ezSiradaki">${t('Sıradaki: {0} ›', esc(ezGorevAd(sira)))}</button>` : ''}
            ${Z.mod === 'yeni' && ee && !ee.tam ? `<button class="btn genis ${sira ? 'ikincil' : ''}" id="ezDevam">${t('Sonraki ayetleri çalış ›')}</button>` : ''}
            <button class="btn genis ikincil" id="ezDon">${t('Ezber\'e dön')}</button>
          </div></section></main>`;
      const sb = $('#ezSiradaki'); if (sb) sb.onclick = () => { const g = ezZincir.shift(); EZ = null; ekranDegistir('ezberCalis', g.n, g.mod, ''); };
      const ac_ = $('#ezAtlananCalis'); if (ac_) ac_.onclick = () => { const b0 = Z.atlanan[0]; EZ = null; ekranDegistir('ezberCalis', n, 'yeni', b0); };
      const db = $('#ezDevam'); if (db) db.onclick = () => { EZ = null; ekranDegistir('ezberCalis', n, 'yeni', ''); };
      $('#ezDon').onclick = () => { ezZincir = []; geri(); };
      app.querySelectorAll('[data-ez-calis]').forEach(b => b.onclick = () => { EZ = null; ekranDegistir('ezberCalis', n, 'yeni', +b.dataset.ezCalis, 1); });
      return;
    }
    // ---- adım çubuğu ve yönerge
    const adimlar = ezAdimAd().slice(0, adimSay);
    const cubuk = Z.mod === 'tekrar' ? '' : `<nav class="ez-adimlar" aria-label="${t('Adımlar')}" style="--n:${adimSay}">${adimlar.map((ad, i) => `<button class="ez-adim ${i < Z.adim ? 'tamam' : i === Z.adim ? 'aktif' : ''}" data-ez-adim="${i}" ${i === Z.adim ? 'aria-current="step"' : ''}><span></span>${esc(ad)}${i < Z.adim ? ' ✓' : ''}</button>`).join('')}</nav>`;
    const yonerge = Z.mod === 'tekrar' ? t('Sûrenin ezberlediğin kısmını ezberden oku: {0}–{1}. ayetler. Takıldığın ayetler yakın tekrara alınır.', 1, Z.bit)
      : [t('Dinle ve içinden tekrar et.'), t('Bakarak oku; okudukça kelimeler yeşerir.'), t('Kelimelerin yarısı gizli. Oku; okudukça açılır.'), t('Hepsi gizli. Ezberden oku; okudukça açılır.'), onekAktif ? t('Önceki ezberinle birlikte, hiç bakmadan oku: {0} {1}. ayetten {2} {3}. ayete.', esc(sureNoAdi(onek.n)), onek.a, esc(sureNoAdi(n)), Z.bit) : t('Önceki ayetlerle birlikte, hiç bakmadan oku: 1–{0}. ayetler.', Z.bit)][Z.adim];
    const OKU = (window.OKUNUS || {})[DIL === 'en' ? 'en' : 'tr'] || {};
    const ayetHTML = a => {
      const r = `${n}:${a}`; let o = 0;
      const kel = x.ayet[a - 1].split(' ').map((w, wi) => { const ic = kelimeHTML(r, w, o); o += w.length + 1; return gizle(a, wi) ? `<span class="kelime gizli" data-ac="${kelimeUrl(r, wi + 1)}">${ic}</span>` : `<span class="kelime" data-ses="${kelimeUrl(r, wi + 1)}">${ic}</span>`; }).join(' ');
      return `<div class="ez-ayet" id="ayet-${a}"><div class="ayet" dir="rtl" lang="ar">${kel} <span class="ayet-no ayet-no-ses" role="button" tabindex="0" data-ez-oynat="${a}" aria-label="${t('Ayeti dinle')}">﴿${a.toLocaleString('ar-EG')}﴾</span></div>${Z.adim <= 1 && okunusAcik() && OKU[r] ? `<p class="okunus">${esc(OKU[r])}</p>` : ''}${S.ayar.ezMeal ? mealSecili().map(z => [z, (mealVeri(z, n) || [])[a - 1]]).filter(z => z[1]).map(([z, m]) => `<p class="ko-meal ez-meal">${esc(m)}</p>`).join('') : ''}<div class="rapor-kutu" id="rapor-${a}" hidden></div></div>`;
    };
    const ayetler = []; for (let a = okBas; a <= okBit; a++) ayetler.push(ayetHTML(a));
    let besmele = okBas === 1 && n !== 1 && n !== 9 ? `<div class="besmele" dir="rtl" lang="ar">${esc(trBesmele() || window.BESMELE || '')}</div>` : '';
    if (onekAktif) {   // önceki sûrenin son ayeti: sanal "ayet 0"
      const r0 = `${onek.n}:${onek.a}`; let o = 0;
      const kel0 = SURE(onek.n).ayet[onek.a - 1].split(' ').map((w, wi) => { const ic = kelimeHTML(r0, w, o); o += w.length + 1; return gizle(0, wi) ? `<span class="kelime gizli" data-ac="${kelimeUrl(r0, wi + 1)}">${ic}</span>` : `<span class="kelime" data-ses="${kelimeUrl(r0, wi + 1)}">${ic}</span>`; }).join(' ');
      besmele = `<p class="ez-bag-et"><span class="ez-bag-rozet onceki">${t('Önceki')}</span>${esc(sureNoAdi(onek.n))} ${onek.a}</p>
        <div class="ez-ayet" id="ayet-0"><div class="ayet" dir="rtl" lang="ar">${kel0} <span class="ayet-no">﴿${onek.a.toLocaleString('ar-EG')}﴾</span></div><div class="rapor-kutu" id="rapor-0" hidden></div></div>
        <p class="ez-bag-et"><span class="ez-bag-rozet yeni">${t('Yeni')}</span>${esc(sureNoAdi(n))} ${Z.bit === 1 ? 1 : '1–' + Z.bit}</p>${besmele}`;
    }
    const tekrar = S.ayar.ezTekrar || 3, gizliAdim = Z.adim >= 2;
    app.innerHTML = `${ust(baslik)}${cubuk}<main class="ez-ekran ${readingThemeClass()}">
      <p class="ez-yonerge">${yonerge}</p>
      <div class="satir sola ez-arac">${Z.mod === 'yeni' ? `<button class="cip" id="ezOnceki" aria-label="${t('Önceki ayet')}" ${Z.bas <= 1 ? 'disabled' : ''}>‹</button><button class="cip" id="ezNereden" aria-label="${t('Ayet seç')}">📍 ${Z.bas === Z.bit ? Z.bas : Z.bas + '–' + Z.bit}/${top}</button><button class="cip" id="ezSonraki" aria-label="${t('Sonraki ayet')}" ${Z.bit >= top ? 'disabled' : ''}>›</button>` : ''}${OKU[`${n}:1`] ? `<button class="cip ${okunusAcik() ? 'aktif' : ''}" id="ezOkunus">🔤 ${t('Okunuş')}</button>` : ''}<button class="cip ${S.ayar.ezMeal ? 'aktif' : ''}" id="ezMeal">📖 ${t('Meal')}</button><button class="cip" id="ezAa" data-aa-format aria-label="${t('Yazı ve renk')}">Aa</button>${Z.adim === 0 ? `<button class="cip ${S.ayar.ezPay !== false ? 'aktif' : ''}" id="ezPay">🗣️ ${t('Sen de tekrar et')}</button>` : ''}</div>
      ${Z.mod === 'yeni' ? `<div class="kart ez-nereden" id="ezNerePanel" hidden><p class="kucukyazi soluk">${t('Hangi ayetten çalışmak istiyorsun? (1–{0})', top)}</p>
        <div class="satir sola"><input id="ezNereNo" type="number" min="1" max="${top}" value="${Z.bas}" inputmode="numeric" aria-label="${t('Ayet numarası')}"><button class="btn kucuk" id="ezNereGit">${t('Buradan başla')}</button></div>
        <div class="satir sola"><button class="cip" data-ez-bas="1">${t('Baştan')}</button>${e.a ? `<button class="cip" data-ez-bas="${Math.min(top, e.a + 1)}">${t('Kaldığım yer ({0}. ayet)', Math.min(top, e.a + 1))}</button>` : ''}</div></div>` : ''}
      ${Z.adim === 0 ? `<p class="kucukyazi soluk ez-tekrar-sec" title="${t('Her ayet kaç kez okunsun?')}"><span>${t('Tekrar')}:</span>${[1, 3, 5, 10, 20].map(k => `<button class="cip ${tekrar === k ? 'aktif' : ''}" data-ez-tekrar="${k}" aria-label="${t('Her ayet kaç kez okunsun?')} ${k}">${k}×</button>`).join('')}</p>` : ''}
      ${Z.adim === 3 && Z.mod === 'yeni' ? `<p class="kucukyazi"><button class="cip ${Z.ilkKelime ? 'aktif' : ''}" id="ezIlk">${t('İlk kelime görünsün')}</button></p>` : ''}
      <section class="kart ez-kart" id="ezKart">${besmele}${ayetler.join('')}</section>
      <div id="ezSonuc"></div>
      ${Z.adim > 0 || Z.mod === 'tekrar' ? `<p class="ortala"><button class="link" id="ezAtla">${Z.mod === 'tekrar' ? t('Mikrofonsuz okudum, bitir ›') : Z.adim === adimSay - 1 ? t('Okumadan bitir ›') : t('Bu adımı atla ›')}</button></p>` : ''}
    </main>
    <div class="ez-alt" id="canliBar"><p class="canli-durum">${Z.adim === 0 ? t('Dinledikten sonra sonraki adıma geç.') : t('Mikrofona dokun ve oku.')}</p>
      <div class="ez-alt-dugmeler">
        ${Z.adim === 0 ? `<button class="ez-yan" id="ezIleriAlt"><span aria-hidden="true">›</span>${t('Sonraki')}</button>` : `<button class="ez-yan" id="ezDinle"><span aria-hidden="true">▶</span>${t('Dinle')}</button>`}
        ${Z.adim === 0 ? `<button class="ez-mik ez-ileri" id="ezDinle">▶ ${t('Dinle')}</button>` : `<div class="ez-mik-kap"><button class="ez-mik" id="canliDur" aria-label="${t('Oku')}">🎙️</button><span class="ez-mik-yazi" id="ezMikYazi">${t('Oku')}</span></div>`}
        ${gizliAdim ? `<button class="ez-yan" id="ezGoz"><span aria-hidden="true">👁</span>${t('Göz at')}</button>` : '<span class="ez-yan bos"></span>'}
      </div></div>`;
    // ---- olaylar
    const ileri = () => {
      sesDurdur();
      if (Z.mod === 'tekrar' || Z.adim >= adimSay - 1) return ezBitir();
      Z.adim++; if (Z.adim === 2 && ezAcemi()) Z.adim = 3;   // beginners skip the half-hidden step
      Z.sonuc = null; ciz(); window.scrollTo(0, 0);
    };
    app.querySelectorAll('[data-ez-adim]').forEach(b => b.onclick = () => { if (CANLI) return; Z.adim = +b.dataset.ezAdim; ciz(); });
    app.querySelectorAll('[data-ez-tekrar]').forEach(b => b.onclick = () => { S.ayar.ezTekrar = +b.dataset.ezTekrar; kaydet(); ciz(); });
    $('#ezMeal').onclick = () => { if (CANLI) return; S.ayar.ezMeal = !S.ayar.ezMeal; kaydet(); ciz(); };
    const en = $('#ezNereden'); if (en) en.onclick = () => { const pn = $('#ezNerePanel'); pn.hidden = !pn.hidden; };
    const nereyeGit = a => { a = Math.min(top, Math.max(1, +a || 1)); if (CANLI) return; sesDurdur(); EZ = null; ekranDegistir('ezberCalis', n, 'yeni', a); };
    const eo = $('#ezOnceki'); if (eo) eo.onclick = () => nereyeGit(Z.bas - 1);
    const es = $('#ezSonraki'); if (es) es.onclick = () => nereyeGit(Z.bit + 1);
    $('#ezAa').onclick = () => readingFormatPanel(app.querySelector('main.ez-ekran'));
    const ep = $('#ezPay'); if (ep) ep.onclick = () => { S.ayar.ezPay = S.ayar.ezPay === false; kaydet(); ciz(); };
    const ok_ = $('#ezOkunus'); if (ok_) ok_.onclick = () => { if (CANLI) return; S.ayar.okunus = !okunusAcik(); kaydet(); ciz(); };
    app.querySelectorAll('.ayet-no-ses').forEach(b => b.onkeydown = ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); b.click(); } });
    const eg = $('#ezNereGit'); if (eg) eg.onclick = () => nereyeGit($('#ezNereNo').value);
    app.querySelectorAll('[data-ez-bas]').forEach(b => b.onclick = () => nereyeGit(b.dataset.ezBas));
    const il = $('#ezIlk'); if (il) il.onclick = () => { Z.ilkKelime = !Z.ilkKelime; ciz(); };
    const at = $('#ezAtla'); if (at) at.onclick = ileri;
    const ia = $('#ezIleriAlt'); if (ia) ia.onclick = ileri;
    app.querySelectorAll('.ez-kart .kelime.gizli').forEach(k => k.onclick = ev => { if (CANLI || !k.classList.contains('gizli')) return; ev.stopPropagation(); k.classList.remove('gizli'); k.classList.add('canli-bakildi'); Z.bakis++; });
    // Dinle: aralıktaki ayetler sırayla, her biri seçilen sayıda
    // from: first ayah to play (0 = the whole range). Listening step: every ayah is repeated `tekrar` times and playback continues with the following ayahs of the range.
    const dinleBaslat = (from, btn) => {
      if (Z.calma) { Z.calma.iptal = true; Z.calma = null; sesDurdur(); }
      if (CANLI) return;
      const bas_ = from || okBas, uzun = Z.adim === 0, liste = onekAktif && !from ? [0] : [];
      for (let a = bas_; a <= (uzun ? okBit : bas_); a++) for (let k = 0; k < (uzun ? tekrar : 1); k++) liste.push(a);
      const is = { iptal: false }; Z.calma = is; btn.classList.add('caliyor'); let j = 0;
      const etiket = b_ => { if (Z.adim === 0 && b_.classList.contains('ez-mik')) b_.textContent = b_.classList.contains('caliyor') ? '⏹ ' + t('Durdur') : '▶ ' + t('Dinle'); };
      etiket(btn);
      const sil = () => document.querySelectorAll('.ez-ayet.calan').forEach(y => y.classList.remove('calan'));
      const bitir = () => { if (Z.calma === is) Z.calma = null; btn.classList.remove('caliyor'); etiket(btn); sil(); };
      const sonraki = () => {
        if (is.iptal || !document.body.contains(btn)) return bitir();
        sil();
        if (j >= liste.length) { bitir(); if (Z.adim === 0) { const d = $('#canliBar .canli-durum'); if (d) d.textContent = t('Hazır olunca sonraki adıma geç.'); } return; }
        const a = liste[j++], el = document.getElementById('ayet-' + a); if (el) { el.classList.add('calan'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        const d = $('#canliBar .canli-durum'); if (d && Z.adim === 0 && a) d.textContent = `${t('Ayet {0}', a)} · ${liste.slice(0, j).filter(x => x === a).length}/${tekrar}`;
        const au = new Audio(sesKaynak(ayetUrl(a === 0 ? `${onek.n}:${onek.a}` : `${n}:${a}`))); ses = au; au.playbackRate = S.ayar.hiz || 1; const t0 = Date.now();
        au.onended = () => setTimeout(sonraki, uzun && S.ayar.ezPay !== false ? Math.max(800, Date.now() - t0) : 400);   // leave a pause as long as the ayah so the learner can repeat it aloud
        au.onerror = () => { bitir(); toast(t('Ses çalınamadı. İnternet bağlantını kontrol et.')); };
        au.play().catch(() => bitir());
      };
      sesDurdur(); sonraki();
    };
    $('#ezDinle').onclick = ev => {
      const btn = ev.currentTarget;
      if (Z.calma) { Z.calma.iptal = true; Z.calma = null; sesDurdur(); btn.classList.remove('caliyor'); if (Z.adim === 0 && btn.classList.contains('ez-mik')) btn.textContent = '▶ ' + t('Dinle'); document.querySelectorAll('.ez-ayet.calan').forEach(y => y.classList.remove('calan')); return; }
      dinleBaslat(0, btn);
    };
    // Verse number: start listening from that ayah (repeats and continues in the listening step)
    app.querySelectorAll('[data-ez-oynat]').forEach(b => b.onclick = ev => { ev.stopPropagation(); dinleBaslat(+b.dataset.ezOynat, $('#ezDinle')); });
    // Göz at: basılı tutunca gizliler görünür
    const goz = $('#ezGoz');
    if (goz) {
      const ac = ev => { ev.preventDefault(); $('#ezKart').classList.add('goz-at'); Z.bakis++; }, kapa = () => { const k = $('#ezKart'); if (k) k.classList.remove('goz-at'); };
      goz.addEventListener('pointerdown', ac); ['pointerup', 'pointerleave', 'pointercancel'].forEach(o => goz.addEventListener(o, kapa));
      goz.addEventListener('keydown', ev => { if (ev.key === ' ' || ev.key === 'Enter') ac(ev); }); goz.addEventListener('keyup', kapa);
    }
    // Oku: canlı takip bu ekranın kelimeleri üzerinde; sonuç aynı kartta.
    // Mikrofon durumu: bos (Oku) · hazirlaniyor · dinliyor (Durdur) · degerlendiriyor · tekrar (Tekrar oku)
    const mikDurum = d => {
      const m = $('#canliDur'), y = $('#ezMikYazi'); if (!m) return;
      const [ic, yazi, sinif] = { bos: ['🎙️', t('Oku'), ''], hazirlaniyor: ['…', t('Hazırlanıyor…'), 'bekliyor'], dinliyor: ['⏹', t('Durdur'), 'kaydediyor'], degerlendiriyor: ['…', t('Değerlendiriliyor…'), 'bekliyor'], tekrar: ['🎙️', t('Tekrar oku'), ''] }[d];
      m.textContent = ic; m.setAttribute('aria-label', yazi); m.classList.remove('kaydediyor', 'bekliyor'); if (sinif) m.classList.add(sinif); m.disabled = sinif === 'bekliyor';
      if (y) y.textContent = yazi;
    };
    Z.ayetSonuc = Z.ayetSonuc || {};
    // tek: "Bu ayeti tekrar oku" → yalnız o ayet dinlenir; diğer ayetlerin sonucu ve görünümü olduğu gibi kalır
    async function ezOkuBasla(bas, tek) {
      if (CANLI) await canliDurdur(true);
      if (Z.calma) { Z.calma.iptal = true; Z.calma = null; sesDurdur(); }
      const sonucYer = $('#ezSonuc'); if (!sonucYer) return;
      sonucYer.innerHTML = '';
      if (bas === 0) { bas = okBas; tek = false; }   // önceki sûrenin ayeti tek başına okunmaz: bağlama baştan
      const ilk = bas === okBas && !tek, bit = tek ? bas : okBit;
      if (tek) { const k = document.getElementById('ayet-' + bas), x = k && k.querySelector('.ez-ayet-tekrar'); if (x) x.remove(); }
      else app.querySelectorAll('.ez-ayet-tekrar').forEach(x => x.remove());
      if (ilk) { Z.bakis = 0; Z.ayetSonuc = {}; } else for (let a = bas; a <= bit; a++) delete Z.ayetSonuc[a];
      for (let a = ilk && onekAktif ? 0 : bas; a <= bit; a++) { const k = document.getElementById('rapor-' + a); if (k) { k.hidden = true; k.innerHTML = ''; } }
      mikDurum('hazirlaniyor');
      await canliBaslat(n, bas, { bit, gizle, bitince: ezCanliBitti, ayetBitti: ezAyetBitti, onek: ilk && onekAktif ? onek : null });
      const bar = $('#canliBar'); if (bar) bar.hidden = false;
      mikDurum(CANLI ? 'dinliyor' : 'bos');
    }
    // Bir ayet bitince: sonucu sakla; hata ya da kontrol varsa "Bu ayeti tekrar oku" (tek dokunuş, o ayetten yeniden dinler)
    function ezAyetBitti(a, s_) {
      Z.ayetSonuc[a] = s_;
      if (!s_.kelimeler || !s_.kelimeler.some(w => w.notes.length)) return;
      const k = document.getElementById('ayet-' + a); if (!k || k.querySelector('.ez-ayet-tekrar')) return;
      // Ayrıntı katlı: ayetin altında yalnız iki düğme (uzun rapor tekrar düğmesini ekrandan itmesin)
      const kutu = document.getElementById('rapor-' + a); if (kutu) kutu.hidden = true;
      const sat = document.createElement('div'); sat.className = 'ez-ayet-tekrar';
      sat.innerHTML = `<button class="ez-yeniden">↻ ${t('Bu ayeti tekrar oku')}</button><button class="ez-ayrinti" aria-expanded="false">${t('Hataları gör')}</button>`;
      sat.querySelector('.ez-yeniden').onclick = () => ezOkuBasla(a, true);
      sat.querySelector('.ez-ayrinti').onclick = ev => { if (!kutu) return; kutu.hidden = !kutu.hidden; ev.currentTarget.setAttribute('aria-expanded', String(!kutu.hidden)); ev.currentTarget.textContent = kutu.hidden ? t('Hataları gör') : t('Gizle'); };
      k.querySelector('.ayet').after(sat);
    }
    const mik = $('#canliDur');
    if (mik) mik.onclick = () => {
      if (CANLI) { mikDurum('degerlendiriyor'); return canliDurdur(); }
      ezOkuBasla(okBas);
    };
    function ezCanliBitti(C_) {
      const bar = $('#canliBar'); if (!bar) return;
      bar.querySelector('.canli-durum').textContent = '';
      mikDurum('tekrar');
      Object.entries(C_.sonuc).forEach(([a, v]) => { if (v && v.kelimeler) Z.ayetSonuc[a] = v; });
      let dogru = 0, kontrol = 0, yanlis = 0; const zayif = [];
      for (let a = onekAktif ? 0 : okBas; a <= okBit; a++) {
        const s_ = Z.ayetSonuc[a] || C_.sonuc[a];
        if (!s_ || !s_.kelimeler) { if (a) zayif.push(a); continue; }
        if (a === 0) { s_.kelimeler.forEach(w => { if (!w.notes.length) dogru++; else if (w.notes.some(z => z.severity === 'jali')) yanlis++; else kontrol++; }); continue; }
        let j_ = 0; s_.kelimeler.forEach(w => { if (!w.notes.length) dogru++; else if (w.notes.some(z => z.severity === 'jali')) { yanlis++; j_++; } else kontrol++; });
        if (j_) zayif.push(a);
      }
      const bakis = Z.bakis + C_.bakilan.size, top_ = dogru + kontrol + yanlis, okunmadi = zayif.filter(a => !((Z.ayetSonuc[a] || C_.sonuc[a]) || {}).kelimeler);
      const tamam = !zayif.length;
      Z.sonuc = { zayif, tamam };
      const son = Z.mod === 'tekrar' || Z.adim >= adimSay - 1;
      $('#ezSonuc').innerHTML = `<section class="kart ez-sonuc ${tamam ? 'iyi' : ''}" aria-live="polite">
        <p class="ez-sonuc-baslik">${!top_ ? t('Değerlendirilecek tam bir ayet okunmadı.') : yanlis ? t('{0} kelimeden {1} tanesini doğru okudun.', top_, dogru + kontrol) : t('Maşallah! {0} kelimenin hepsini doğru okudun.', top_)}</p>
        ${top_ ? `<div class="canli-sayilar"><span class="r-iyi">${t('{0} doğru', dogru)}</span>${kontrol ? `<span class="r-orta">${t('{0} kontrol et', kontrol)}</span>` : ''}${yanlis ? `<span class="r-kotu">${t('{0} yanlış', yanlis)}</span>` : ''}${bakis ? `<span class="canli-bakildi">${t('{0} kez göz attın', bakis)}</span>` : ''}</div>` : ''}
        ${okunmadi.length ? `<p class="soluk kucukyazi">${t('Okunmayan ya da yarım kalan ayet: {0}', okunmadi.join(', '))}</p>` : ''}
        ${yanlis || kontrol ? `<p class="soluk kucukyazi">${t('Renkli kelimelere dokunarak dinle; ayrıntı için "Hataları gör". Yapay zekâ yanılabilir; son söz hocanındır.')}</p>` : ''}
        <div class="satir"><button class="btn ikincil" id="ezTekrarOku">🎙️ ${t('Tekrar oku')}</button><button class="btn" id="ezIleri">${son ? t('Bitir ✓') : t('Sonraki adım ›')}</button></div></section>`;
      $('#ezTekrarOku').onclick = () => ezOkuBasla(okBas);
      $('#ezIleri').onclick = ileri;
      $('#ezSonuc').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    function ezBitir() {
      const ee = ezb(n);
      if (Z.mod === 'tekrar') {
        const zayif = Z.sonuc ? Z.sonuc.zayif : [];
        ee.zayif = zayif;
        if (zayif.length) { ee.son = simdi(); ee.vade = simdi() + GUN; seriGuncelle(); kaydet(); }   // takılınca yarın yine
        else tekrarEttim(n);
        Z.zayif = zayif;
      } else {
        // İleri bir ayetten başlandıysa arada atlanan ayetler çalışılmamıştır: ezberlenmiş sayılmaz, zayıf listesine (yarın yine sorulur) alınır
        const onceki_ = ee.a || 0, atlanan = !ee.tam && Z.bas > onceki_ + 1 ? Array.from({ length: Z.bas - onceki_ - 1 }, (_, i) => onceki_ + 1 + i) : [];
        if (Z.bit > (ee.a || 0)) ezberIsaretle(n, Z.bit); else { seriGuncelle(); kaydet(); }
        if (ee.zayif) ee.zayif = ee.zayif.filter(a => a < Z.bas || a > Z.bit);   // çalışılan zayıf ayetler listeden düşer
        if (atlanan.length) { ee.zayif = Array.from(new Set((ee.zayif || []).concat(atlanan))).sort((x, y) => x - y); Z.atlanan = atlanan; }
        ee.son = simdi(); kaydet();
      }
      Z.bitti = true; ciz(); window.scrollTo(0, 0);
      if (window.Konfeti && (!Z.zayif || !Z.zayif.length)) window.Konfeti.patlat($('.ez-bitti'), 24);
    }
  };

  // Sûre ekranında ayet başına "Oku, kontrol et"
  function okumaBagla(n) {
    app.querySelectorAll('[data-oku]').forEach(b => b.onclick = async () => {
      const a = +b.dataset.oku, kutu = document.getElementById('rapor-' + a);
      if (OKU_KAYIT.r) { if (OKU_KAYIT.a === a) OKU_KAYIT.r.state !== 'inactive' && OKU_KAYIT.r.stop(); return; }
      if (!navigator.mediaDevices || !window.MediaRecorder) return toast(t('Bu cihazda ses kaydı desteklenmiyor.'));
      let O; try { O = await okumaHazirla(); } catch (e) { return toast(e.message); }
      let akis; try { akis = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { return toast(t('Mikrofon izni verilmedi. Telefon ayarlarından Kur\'an Yolum için mikrofona izin ver.')); }
      if (ses) { ses.pause(); ses = null; }
      const parca = []; const r = new MediaRecorder(akis); Object.assign(OKU_KAYIT, { r, n, a });
      b.classList.add('kirmizi-btn', 'kaydediyor'); b.textContent = t('⏹ Bitir');
      kutu.hidden = false; kutu.innerHTML = `<p class="soluk">${t('🎙️ Dinliyorum… Ayeti oku, bitince "Bitir"e dokun (en fazla 28 saniye).')}</p>`;
      const modelIlk = !O.hazir();
      O.modelAc(p => { const e = document.getElementById('modelYuzde'); if (e) e.textContent = t('(yapay zekâ modeli ilk kez hazırlanıyor: {0})', yuzdeStr(Math.round(p * 100))); }).catch(() => { });   // kayıt sürerken model hazırlansın
      r.ondataavailable = e => { if (e.data && e.data.size) parca.push(e.data); };
      r.onstop = async () => {
        akis.getTracks().forEach(x => x.stop()); clearTimeout(OKU_KAYIT.zaman); OKU_KAYIT.r = null;
        b.classList.remove('kirmizi-btn', 'kaydediyor'); b.textContent = t('🎤 Tekrar oku');
        kutu.innerHTML = `<p class="soluk">${t('⏳ Okuyuşun inceleniyor…')} <span id="modelYuzde">${modelIlk && !O.hazir() ? t('(yapay zekâ modeli ilk kez hazırlanıyor; bu bir kez olur)') : ''}</span></p>`;
        try {
          const sonuc = await O.ayetRaporu(n, a, new Blob(parca, { type: r.mimeType || 'audio/webm' }));
          if (!document.body.contains(kutu)) return;
          kutu.innerHTML = raporHTML(n, a, sonuc); raporKaydet(n, a, sonuc);
        } catch (e) { if (document.body.contains(kutu)) kutu.innerHTML = `<p class="hata">${esc(e.message || String(e))}</p>`; }
      };
      r.start(); OKU_KAYIT.zaman = setTimeout(() => r.state !== 'inactive' && r.stop(), 28000);
    });
  }

  EKRAN.okumaRaporu = function () {
    const l = (S.okuma || []).slice().reverse();
    const top = l.length, temiz = l.filter(x => !x.j && !x.k).length, acik = l.reduce((s, x) => s + x.j, 0), ince = l.reduce((s, x) => s + x.k, 0);
    const sayac = {}; l.forEach(x => x.notlar.forEach(z => { const k = z[1].replace(':uneven', ''); sayac[k] = (sayac[k] || 0) + 1; }));
    const enCok = Object.entries(sayac).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const maks = enCok.length ? enCok[0][1] : 1;
    // son 7 günün eğilimi: ayet başına hata
    const gun = d => new Date(d).toISOString().slice(0, 10);
    const son = l.filter(x => x.t > simdi() - 14 * GUN), once = son.filter(x => x.t <= simdi() - 7 * GUN), simdi_ = son.filter(x => x.t > simdi() - 7 * GUN);
    const oran = a => a.length ? (a.reduce((s, x) => s + x.j + x.k, 0) / a.length) : null;
    const o1 = oran(once), o2 = oran(simdi_);
    app.innerHTML = `${ust(t('Okuma raporu'))}<main>
      <article class="kart"><p>${t('Bir sûre aç, ayetin altındaki 🎤 düğmesine dokun ve oku. Yapay zekâ okuyuşunu dinler; kelime kelime harf, hareke, med, ğunne, ihfâ, iklâb, idğâm, şedde ve kalkale hatalarını gösterir.')}</p>
        <p class="soluk kucukyazi">${t('Model telefonda çalışır, ses hiçbir yere gönderilmez. Yapay zekâ yanılabilir; bir hocanın yerini tutmaz.')}</p>
        <button class="btn" data-sekme-git-ic="sureler">${t('Sûre seç ve oku')}</button></article>
      ${top ? `<div class="istatler kart"><div><b>${top}</b><small>${t('okunan ayet')}</small></div><div><b>${yuzdeStr(Math.round(temiz / top * 100))}</b><small>${t('hatasız')}</small></div><div><b>${acik}</b><small>${t('açık hata')}</small></div><div><b>${ince}</b><small>${t('ince hata')}</small></div></div>
        ${o1 != null && o2 != null ? `<p class="fark ${o2 < o1 ? 'yukari' : o2 > o1 ? 'asagi' : ''}">${o2 < o1 ? t('▲ Bu hafta ayet başına hatan azaldı: {0} → {1}', o1.toFixed(1), o2.toFixed(1)) : o2 > o1 ? t('▼ Bu hafta ayet başına hatan arttı: {0} → {1}', o1.toFixed(1), o2.toFixed(1)) : t('● Hata oranın aynı')}</p>` : ''}
        ${enCok.length ? `<h2 class="baslik">${t('En sık hataların')}</h2><article class="kart">${enCok.map(([k, v]) => `<div class="cubuk"><span>${esc(kuralAdi(k))}</span><div class="bar"><div class="kotu" style="width:${Math.round(v / maks * 100)}%"></div></div><b>${v}</b></div>`).join('')}</article>` : ''}
        <h2 class="baslik">${t('Son okumalar')}</h2>
        <div class="tablo">${l.slice(0, 60).map(x => `<button class="kayit" data-git="sure|${x.n}|||${x.a}" style="text-align:left;width:100%;font:inherit;color:inherit"><div><b>${esc(sureNoAdi(x.n))} ${x.a}</b><small>${tarihStr(x.t)}</small>${x.notlar.slice(0, 2).map(z => `<small>• ${metin(z[3])}</small>`).join('')}</div>
          <div class="sag">${!x.j && !x.k ? '<span class="rozet ok">✓</span>' : `${x.j ? `<span class="kirmizi">🔴 ${x.j}</span>` : ''} ${x.k ? `<span class="turuncu">🟠 ${x.k}</span>` : ''}`}</div></button>`).join('')}</div>`
        : `<p class="soluk ortala">${t('Henüz okuma yapmadın.')}</p>`}
    </main>`;
    const g = app.querySelector('[data-sekme-git-ic]'); if (g) g.onclick = () => { ekranYigini = [['sureler', []]]; ciz(); };
  };

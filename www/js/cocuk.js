/* Hüsn-i Kıraat — çocuk modu: Harf Yolculuğu, oyunlar, konfeti, yıldız maskot, ebeveyn kilidi.
 * app.js yüklenince window.CocukModu(api) ile bağlanır. Harflere hürmet: harfler oyunlarda
 * patlatılmaz/parçalanmaz; konfeti harfin etrafında patlar, harfler sepete özenle taşınır. */
(function () {
  'use strict';
  const t = window.t, DIL = window.DIL, EN = DIL === 'en';

  // ------------------------------------------------------------ konfeti (kendi çizimimiz, internetsiz)
  const Konfeti = (function () {
    let cv = null, cx = null, parca = [], calisiyor = false;
    const RENK = ['#f2b233', '#2fae88', '#ef6f8a', '#5aa9f0', '#a77bf3', '#ffd166', '#06d6a0'];
    const azHareket = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    function hazirla() {
      if (cv && cv.isConnected) return;
      cv = document.createElement('canvas'); cv.className = 'konfeti'; cv.setAttribute('aria-hidden', 'true');
      document.body.appendChild(cv); cx = cv.getContext('2d'); boyut();
    }
    function boyut() { if (!cv) return; const d = window.devicePixelRatio || 1; cv.width = innerWidth * d; cv.height = innerHeight * d; cx.setTransform(d, 0, 0, d, 0, 0); }
    window.addEventListener('resize', boyut);
    function yildizCiz(r) { cx.beginPath(); for (let i = 0; i < 10; i++) { const a = Math.PI / 5 * i - Math.PI / 2, rr = i % 2 ? r * .45 : r; cx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } cx.closePath(); cx.fill(); }
    function dongu() {
      cx.clearRect(0, 0, innerWidth, innerHeight);
      parca = parca.filter(p => p.omur > 0 && p.y < innerHeight + 30);
      for (const p of parca) {
        p.vx *= .985; p.vy = p.vy * .985 + p.g; p.x += p.vx; p.y += p.vy; p.a += p.va; p.omur--;
        cx.save(); cx.globalAlpha = Math.min(1, p.omur / 30); cx.translate(p.x, p.y); cx.rotate(p.a); cx.fillStyle = p.renk;
        if (p.sekil === 0) cx.fillRect(-p.r, -p.r * .45, p.r * 2, p.r * .9);
        else if (p.sekil === 1) { cx.beginPath(); cx.arc(0, 0, p.r * .6, 0, 7); cx.fill(); }
        else yildizCiz(p.r);
        cx.restore();
      }
      if (parca.length) requestAnimationFrame(dongu); else { calisiyor = false; cx.clearRect(0, 0, innerWidth, innerHeight); }
    }
    function ekle(x, y, n, guc, asagi) {
      hazirla();
      for (let i = 0; i < n; i++) {
        const a = asagi ? Math.PI / 2 + (Math.random() - .5) * .6 : Math.random() * Math.PI * 2, h = guc * (.45 + Math.random() * .75);
        parca.push({ x, y, vx: Math.cos(a) * h, vy: asagi ? Math.random() * 2 + 1 : Math.sin(a) * h - guc * .55, g: .16 + Math.random() * .08, a: Math.random() * 6, va: (Math.random() - .5) * .3, r: 4 + Math.random() * 4, renk: RENK[i % RENK.length], sekil: i % 7 === 0 ? 2 : i % 3, omur: 90 + Math.random() * 60 });
      }
      if (!calisiyor) { calisiyor = true; requestAnimationFrame(dongu); }
    }
    return {
      durdur() { parca = []; clearInterval(this._z); },
      // Bir öğenin (ya da noktanın) etrafında küçük patlama
      patlat(hedef, n = 34) {
        let x = innerWidth / 2, y = innerHeight / 2;
        if (hedef && hedef.getBoundingClientRect) { const r = hedef.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
        else if (hedef && hedef.x != null) { x = hedef.x; y = hedef.y; }
        ekle(x, y, azHareket() ? Math.round(n / 3) : n, 7);
      },
      // Büyük kutlama: iki yandan patlama + yukarıdan yağmur
      kutla() {
        if (azHareket()) { ekle(innerWidth / 2, innerHeight / 3, 30, 7); return; }
        ekle(innerWidth * .15, innerHeight * .7, 60, 11); ekle(innerWidth * .85, innerHeight * .7, 60, 11);
        let k = 0; clearInterval(this._z); const z = this._z = setInterval(() => { for (let i = 0; i < 4; i++) ekle(Math.random() * innerWidth, -10, 6, 2, true); if (++k > 12) clearInterval(z); }, 120);
      }
    };
  })();
  window.Konfeti = Konfeti;

  // ------------------------------------------------------------ yumuşak "tık" sesi (müzik aleti yok)
  let AC = null;
  function tik(iyi) {
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      const o = AC.createOscillator(), g = AC.createGain(), s = AC.currentTime;
      o.type = 'sine'; o.frequency.setValueAtTime(iyi ? 520 : 260, s); o.frequency.exponentialRampToValueAtTime(iyi ? 900 : 200, s + .09);
      g.gain.setValueAtTime(.0001, s); g.gain.exponentialRampToValueAtTime(.08, s + .015); g.gain.exponentialRampToValueAtTime(.0001, s + .14);
      o.connect(g); g.connect(AC.destination); o.start(s); o.stop(s + .16);
    } catch (e) { }
  }

  // ------------------------------------------------------------ sesli yönerge
  // Telefonda (APK) Android'in kendi konuşma motoru (TextToSpeech eklentisi); tarayıcıda Web Speech API.
  // Android WebView'de speechSynthesis yoktur; bu yüzden eklenti kullanılır.
  const Sesli = {
    acik: true,
    soyle(metin) {
      if (!this.acik || !metin) return;
      metin = String(metin).replace(/<[^>]+>/g, '').replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+/g, '').replace(/[🙂✨🎉🎯✏️⭐▶›]/gu, '').replace(/\s+/g, ' ').trim();
      if (!metin) return;
      const lang = EN ? 'en-GB' : 'tr-TR';
      const TTS = window.capEklenti && window.capEklenti('TextToSpeech');
      if (TTS) { TTS.stop().catch(() => { }).then(() => TTS.speak({ text: metin, lang, rate: .95 })).catch(() => { }); return; }
      try { const ss = window.speechSynthesis; if (!ss) return; ss.cancel(); const u = new SpeechSynthesisUtterance(metin); u.lang = lang; u.rate = .95; ss.speak(u); } catch (e) { }
    },
    sus() { const TTS = window.capEklenti && window.capEklenti('TextToSpeech'); if (TTS) TTS.stop().catch(() => { }); try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) { } }
  };
  window.Sesli = Sesli;

  // ------------------------------------------------------------ hocanın kaydettiği harf sesleri (bu telefonda, IndexedDB)
  // Anahtarlar: 'h:<harf>' (harfin okunuşu), 'hr:<harf>:<0|1|2>' (üstün/esre/ötreli hece)
  const HarfSes = (function () {
    const anahtarlar = new Set(), paket = new Set(); let db = null, hazir = null, calan = null;
    // Anahtar → dosya adı: 'h:ب' → h-0628.mp3, 'hr:ب:0' → hr-0628-0.mp3, 'h:لا' → h-0644-0627.mp3
    const dosya = k => { const [tur, h, i] = k.split(':'); return 'sesler/harf/' + tur + '-' + [...h].map(c => c.codePointAt(0).toString(16).padStart(4, '0')).join('-') + (i != null ? '-' + i : '') + '.mp3'; };
    fetch('sesler/harf/liste.json').then(r => r.ok ? r.json() : []).then(l => (l || []).forEach(k => paket.add(k))).catch(() => { });
    function ac() {
      if (hazir) return hazir;
      hazir = new Promise(coz => {
        try {
          const r = indexedDB.open('husn-harf-ses', 1);
          r.onupgradeneeded = () => r.result.createObjectStore('ses');
          r.onsuccess = () => { db = r.result; const tx = db.transaction('ses').objectStore('ses').getAllKeys(); tx.onsuccess = () => { (tx.result || []).forEach(k => anahtarlar.add(k)); coz(); }; tx.onerror = () => coz(); };
          r.onerror = () => coz();
        } catch (e) { coz(); }
      });
      return hazir;
    }
    const islem = (mod, f) => ac().then(() => new Promise((ok, no) => { if (!db) return no(new Error('db')); const st = db.transaction('ses', mod).objectStore('ses'); const r = f(st); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); }));
    return {
      ac, var: k => anahtarlar.has(k) || paket.has(k), kendi: k => anahtarlar.has(k), paket: k => paket.has(k), sayi: on => [...anahtarlar].filter(k => k.startsWith(on)).length,
      kaydet: (k, blob) => islem('readwrite', st => st.put(blob, k)).then(() => anahtarlar.add(k)),
      sil: k => islem('readwrite', st => st.delete(k)).then(() => anahtarlar.delete(k)),
      al: k => islem('readonly', st => st.get(k)),
      async cal(k) {
        // Önce bu telefonda yapılan kayıt, yoksa uygulamayla gelen paket
        try {
          let url;
          if (anahtarlar.has(k)) { const b = await this.al(k); if (b) url = URL.createObjectURL(b); }
          if (!url && paket.has(k)) url = dosya(k);
          if (!url) return false;
          Sesli.sus(); if (calan) { calan.pause(); if (calan.src.startsWith('blob:')) URL.revokeObjectURL(calan.src); }
          calan = new Audio(url); await calan.play(); return true;
        } catch (e) { return false; }
      }
    };
  })();
  window.HarfSes = HarfSes;
  HarfSes.ac();

  // ------------------------------------------------------------ yıldız maskot (canlı tasviri yok: yüzsüz yıldız)
  const MASKOT_RENK = { altin: ['#fff6c8', '#ffd24a', '#f2a516', '#d9890b', 0], pembe: ['#ffe3ef', '#ff8fbd', '#e5568f', '#c43d74', 10], mavi: ['#e3f2ff', '#6bb8ff', '#2f86e0', '#1f68b8', 25], yesil: ['#e2fbef', '#5fd6a0', '#22a46c', '#16804f', 45], mor: ['#f1e6ff', '#b88cff', '#8250e0', '#6337b8', 70], gece: ['#e6e9ff', '#7d8cff', '#3b4bd1', '#232f9e', 100] };
  let maskotRenk = 'altin';
  const MASKOT = (boy = 72, cls = '', renk) => { const r = MASKOT_RENK[renk || maskotRenk] || MASKOT_RENK.altin, id = 'mg-' + (renk || maskotRenk); return `<svg class="maskot ${cls}" width="${boy}" height="${boy}" viewBox="0 0 100 100" aria-hidden="true">
    <defs><radialGradient id="${id}" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="${r[0]}"/><stop offset=".45" stop-color="${r[1]}"/><stop offset="1" stop-color="${r[2]}"/></radialGradient></defs>
    <path d="M50 6 L62 36 L94 38 L69 58 L77 90 L50 72 L23 90 L31 58 L6 38 L38 36 Z" fill="url(#${id})" stroke="${r[3]}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M42 30 Q50 22 58 30" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>
    <circle cx="86" cy="14" r="3" fill="${r[1]}"/><circle cx="12" cy="20" r="2.2" fill="${r[1]}"/><circle cx="90" cy="70" r="2" fill="${r[1]}"/></svg>`; };

  // ------------------------------------------------------------ ebeveyn kilidi
  function ebeveynKilidi() {
    return new Promise(coz => {
      const a = 12 + Math.floor(Math.random() * 30), b = 3 + Math.floor(Math.random() * 6);
      const d = document.createElement('div'); d.className = 'modal-arka';
      d.innerHTML = `<div class="modal kart" role="dialog" aria-modal="true"><h2>${t('👨‍👩‍👧 Büyükler için')}</h2>
        <p>${t('Bu bölüm anne-baba ya da öğretmen içindir. Devam etmek için işlemi çöz:')}</p>
        <p class="kilit-soru" data-a="${a}" data-b="${b}"><b>${a} × ${b} = ?</b></p>
        <input type="number" inputmode="numeric" id="kilitCevap" aria-label="${t('Cevap')}">
        <p class="kirmizi kucukyazi" id="kilitHata" hidden>${t('Olmadı, tekrar dene.')}</p>
        <div class="satir"><button class="btn ikincil" id="kilitVazgec">${t('Vazgeç')}</button><button class="btn" id="kilitTamam">${t('Tamam')}</button></div></div>`;
      document.body.appendChild(d);
      const inp = d.querySelector('#kilitCevap'); setTimeout(() => inp.focus(), 50);
      const bitir = v => { d.remove(); coz(v); };
      d.querySelector('#kilitVazgec').onclick = () => bitir(false);
      d.onclick = e => { if (e.target === d) bitir(false); };
      const dene = () => { if (+inp.value === a * b) bitir(true); else { d.querySelector('#kilitHata').hidden = false; inp.value = ''; inp.focus(); } };
      d.querySelector('#kilitTamam').onclick = dene;
      inp.onkeydown = e => { if (e.key === 'Enter') dene(); };
    });
  }

  // ------------------------------------------------------------ harf bilgileri
  // [nokta sayısı, yeri, kalın mı, sessiz harf (TR), sessiz harf (EN), okunuş (TR) üstün/esre/ötre, okunuş (EN)]
  const BILGI = {
    'ا': [0, '', 0, '', '', ['e', 'i', 'u'], ['a', 'i', 'u']],
    'ب': [1, 'alt', 0, 'b', 'b'], 'ت': [2, 'ust', 0, 't', 't'], 'ث': [3, 'ust', 0, 's', 'th'], 'ج': [1, 'alt', 0, 'c', 'j'],
    'ح': [0, '', 0, 'h', 'ḥ', ['ha', 'hi', 'hu']], 'خ': [1, 'ust', 1, 'h', 'kh', ['ha', 'hı', 'hu']], 'د': [0, '', 0, 'd', 'd'], 'ذ': [1, 'ust', 0, 'z', 'dh'],
    'ر': [0, '', 0, 'r', 'r', ['ra', 'ri', 'ru']], 'ز': [1, 'ust', 0, 'z', 'z'], 'س': [0, '', 0, 's', 's'], 'ش': [3, 'ust', 0, 'ş', 'sh'],
    'ص': [0, '', 1, 's', 'ṣ'], 'ض': [1, 'ust', 1, 'd', 'ḍ'], 'ط': [0, '', 1, 't', 'ṭ'], 'ظ': [1, 'ust', 1, 'z', 'ẓ'],
    'ع': [0, '', 0, '‘', 'ʿ', ['‘a', '‘i', '‘u']], 'غ': [1, 'ust', 1, 'ğ', 'gh'], 'ف': [1, 'ust', 0, 'f', 'f'], 'ق': [2, 'ust', 1, 'k', 'q'],
    'ك': [0, '', 0, 'k', 'k'], 'ل': [0, '', 0, 'l', 'l'], 'م': [0, '', 0, 'm', 'm'], 'ن': [1, 'ust', 0, 'n', 'n'], 'و': [0, '', 0, 'v', 'w'],
    'ه': [0, '', 0, 'h', 'h'], 'لا': [0, '', 0, '', ''], 'ي': [2, 'alt', 0, 'y', 'y']
  };
  const BITISMEZ = new Set(['ا', 'د', 'ذ', 'ر', 'ز', 'و']);
  const BENZER = [['ب', 'ت', 'ث', 'ن', 'ي'], ['ج', 'ح', 'خ'], ['د', 'ذ'], ['ر', 'ز'], ['س', 'ش'], ['ص', 'ض'], ['ط', 'ظ'], ['ع', 'غ'], ['ف', 'ق'], ['ك', 'ل'], ['م', 'ه', 'و'], ['ا', 'لا']];
  const HAREKE = ['َ', 'ِ', 'ُ'], TENVIN = ['ً', 'ٍ', 'ٌ'], MED = ['ا', 'ي', 'و'], CEZM = 'ْ', SEDDE = 'ّ';
  const HAREKE_AD = [t('Üstün'), t('Esre'), t('Ötre')];
  const INCE = ['ب', 'ت', 'ث', 'ج', 'د', 'ذ', 'ز', 'س', 'ش', 'ف', 'ك', 'ل', 'م', 'ن', 'و', 'ه', 'ي'];
  function hece(h, i) {
    const b = BILGI[h]; if (EN) { if (h === 'ا') return b[6][i]; if (b[6]) return b[6][i]; return b[4] + ['a', 'i', 'u'][i]; }
    if (b[5]) return b[5][i]; return b[3] + (b[2] ? ['a', 'ı', 'u'] : ['e', 'i', 'u'])[i];
  }
  const sessiz = h => EN ? BILGI[h][4] : BILGI[h][3];
  const uzun = i => EN ? ['ā', 'ī', 'ū'][i] : ['â', 'î', 'û'][i];

  // ------------------------------------------------------------ yardımcılar
  const rnd = n => Math.floor(Math.random() * n);
  const sec1 = a => a[rnd(a.length)];
  const karistir = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ar = (s, cls = '') => `<span class="ar ${cls}" lang="ar">${s}</span>`;
  const BESMELE = 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ';
  const OVGU = () => sec1(EN ? ['Well done!', 'Mashallah!', 'Barakallahu feek!', 'Great job!', 'Excellent!'] : ['Aferin!', 'Maşallah!', 'Bârekallah!', 'Harikasın!', 'Çok güzel!']);

  window.CocukModu = function (api) {
    const { EKRAN, git, anaSayfa, ust, kaydet, bugun, seriGuncelle, toast } = api;
    const S = () => api.S();
    const profil = () => api.profil();
    const kucuk = () => profil().yas === 'kucuk';
    const HARF = window.TC.HARFLER.map(h => h[0]);
    const HARF_AD = EN ? ['Alif', 'Bāʾ', 'Tāʾ', 'Thāʾ', 'Jīm', 'Ḥāʾ', 'Khāʾ', 'Dāl', 'Dhāl', 'Rāʾ', 'Zāy', 'Sīn', 'Shīn', 'Ṣād', 'Ḍād', 'Ṭāʾ', 'Ẓāʾ', 'ʿAyn', 'Ghayn', 'Fāʾ', 'Qāf', 'Kāf', 'Lām', 'Mīm', 'Nūn', 'Wāw', 'Hāʾ', 'Lām-alif', 'Yāʾ'] : window.TC.HARFLER.map(h => h[1]);
    const adi = h => HARF_AD[HARF.indexOf(h)];
    const HAREKELI = HARF.filter(h => h !== 'لا');                 // hareke alan harfler
    const HAREKE_HARF = HAREKELI.filter(h => h !== 'ا');            // elif harekeyle hemze olur; ayrı anlatılmaz

    // ---------------------------------------------------------- duraklar
    const ADALAR = [
      { id: 'harf', ikon: '🌴', ad: t('Harf Adası'), renk: '#2fae88' },
      { id: 'hareke', ikon: '🌙', ad: t('Hareke Adası'), renk: '#5aa9f0' },
      { id: 'okuma', ikon: '⭐', ad: t('Okuma Adası'), renk: '#f2a516' },
      { id: 'sure', ikon: '📖', ad: t('Sûreler Adası'), renk: '#a77bf3' }
    ];
    const DURAK = [];
    HARF.forEach((h, i) => {
      DURAK.push({ id: 'h' + i, ada: 'harf', tur: 'harf', harf: h, ad: adi(h), ikon: h });
      if (i % 4 === 3 || i === HARF.length - 1) DURAK.push({ id: 'ht' + i, ada: 'harf', tur: 'tekrar', son: i, ad: t('Tekrar'), ikon: '🔁' });
    });
    [[0, 'k1'], [1, 'k2'], [2, 'k3']].forEach(([i, id]) => DURAK.push({ id, ada: 'hareke', tur: 'hareke', h: i, ad: HAREKE_AD[i], ikon: 'بَ بِ بُ'.split(' ')[i] }));
    DURAK.push({ id: 'k4', ada: 'hareke', tur: 'hareke', h: -1, ad: t('Karışık'), ikon: '🎲' });
    [['o1', 'hece', t('Hece'), 'بَتَ'], ['o2', 'cezm', t('Cezm'), 'بَتْ'], ['o3', 'tenvin', t('Tenvin'), 'بٌ'], ['o4', 'med', t('Med (uzatma)'), 'بَا'], ['o5', 'sedde', t('Şedde'), 'بَّ'], ['o7', 'isaret', t('Mushaftaki işaretler'), 'بۡ'], ['o6', 'karma', t('Büyük tekrar'), '🏆']]
      .forEach(([id, k, ad, ik]) => DURAK.push({ id, ada: 'okuma', tur: 'okuma', k, ad, ikon: ik }));
    // Sûreler Adası: namazda en çok okunan kısa sûreler
    const SR = n => (window.SURELER || []).find(x => x.n === n);
    [['s1', 1], ['s2', 112], ['s3', 113], ['s4', 114]].forEach(([id, n]) => { const x = SR(n); if (x) DURAK.push({ id, ada: 'sure', tur: 'sure', n, ad: EN ? x.en : x.tr, ikon: x.ar }); });
    const durakBul = id => DURAK.find(d => d.id === id);
    const C = () => { const s = S(); s.cocuk = s.cocuk || { d: {}, gun: {} }; s.cocuk.d = s.cocuk.d || {}; s.cocuk.gun = s.cocuk.gun || {}; return s.cocuk; };
    const yildiz = id => (C().d[id] && C().d[id].y) || 0;
    // Sûreler Adası baştan açıktır (kısa sûreleri bilen çocuk harf yolculuğunu beklemez)
    const acik = d => { const i = DURAK.indexOf(d); return i === 0 || d.ada === 'sure' || yildiz(DURAK[i - 1].id) > 0 || yildiz(d.id) > 0; };
    const toplamYildiz = () => DURAK.reduce((a, d) => a + yildiz(d.id), 0);
    const siradaki = () => DURAK.find(d => !yildiz(d.id)) || null;
    const CIKARTMA = ['⭐', '🌙', '🌸', '🌷', '🌻', '🍀', '🌈', '☀️', '🕌', '📖', '🏮', '💎', '🌴', '🍎', '🍇', '🍊', '⛰️', '🌊', '❄️', '🔭', '🎈', '🧭', '🪁', '🏆'];
    const CIKARTMA_ADIM = 5;   // her 5 yıldızda bir çıkartma

    // ---------------------------------------------------------- soru üreticiler
    function benzerleri(h, n) {
      const grup = (BENZER.find(g => g.includes(h)) || []).filter(x => x !== h);
      const digerleri = karistir(HARF.filter(x => x !== h && !grup.includes(x)));
      return karistir(grup).concat(digerleri).slice(0, n);
    }
    const secenekli = (o) => Object.assign({ tip: 'sec' }, o);
    function harfSorusu(tur, h) {
      const b = BILGI[h];
      if (tur === 'ayni') return secenekli({ soru: t('Aynısını bul!'), goster: ar(h, 'dev'), dogru: h, secenek: karistir([h, ...benzerleri(h, 2)]), arSec: true });
      if (tur === 'ad') return secenekli({ soru: t('{0} harfi hangisi?', `<b>${esc(adi(h))}</b>`), dogru: h, secenek: karistir([h, ...benzerleri(h, 2)]), arSec: true });
      if (tur === 'nokta') return secenekli({ soru: h === 'لا' ? t('Lamelifin kaç noktası var?') : t('Bu harfin kaç noktası var?'), goster: ar(h, 'dev'), dogru: String(b[0]), secenek: ['0', '1', '2', '3'], ipucu: b[0] ? (b[1] === 'alt' ? t('Noktalar harfin altında.') : t('Noktalar harfin üstünde.')) : t('Dikkatli bak: hiç nokta var mı?') });
      if (tur === 'sekil') {
        const f = BITISMEZ.has(h) ? 'ـ' + h : 'ـ' + h + 'ـ';
        return secenekli({ soru: t('Kelimenin içindeki bu şekil hangi harf?'), goster: ar(f, 'dev'), dogru: h, secenek: karistir([h, ...benzerleri(h, 2)]), arSec: true });
      }
      if (tur === 'sepet') {
        const digerleri = benzerleri(h, 6);
        return { tip: 'sepet', soru: t('{0} harflerini sepete topla!', `<span class="ar">${h}</span>`), sesli: t('{0} harflerini sepete topla!', adi(h)), harf: h, kutular: karistir([h, h, h, ...digerleri]) };
      }
      if (tur === 'dinle') return secenekli({ soru: t('Dinle ve duyduğun harfe dokun!'), ses: 'h:' + h, dogru: h, secenek: karistir([h, ...benzerleri(h, 2)]), arSec: true });
      if (tur === 'golge') return secenekli({ soru: t('Bu gölge hangi harfin?'), goster: ar(h, 'dev golge'), dogru: h, secenek: karistir([h, ...benzerleri(h, 2)]), arSec: true });
      if (tur === 'dizi') {
        const i = Math.max(2, HARF.indexOf(h)), dizi = HARF.slice(i - 2, i + 1);
        return { tip: 'dizi', soru: t('Harf treni: Elif-Ba sırasıyla dokun!'), dizi, kutular: karistir(dizi) };
      }
    }
    // Eşleştirme: harf ↔ adı (havuzdan 3 harf)
    function eslestirSorusu(h, havuz) {
      const l = [h, ...karistir(havuz.filter(x => x !== h)).slice(0, 2)];
      return { tip: 'eslestir', soru: t('Harfleri adlarıyla eşleştir!'), harfler: karistir(l), adlar: karistir(l) };
    }
    function harekeSorusu(tur, i, h) {
      h = h || sec1(HAREKE_HARF);
      if (tur === 'yer') return secenekli({ soru: t('{0} hangisinde?', `<b>${HAREKE_AD[i]}</b>`), dogru: h + HAREKE[i], secenek: karistir(HAREKE.map(x => h + x)), arSec: true, ipucu: [t('Üstün harfin üstünde eğik bir çizgidir.'), t('Esre harfin altında eğik bir çizgidir.'), t('Ötre harfin üstünde küçük bir vav gibidir.')][i] });
      // aynı harekeli 3 farklı harf (okunuşları birbirinden farklı olmalı)
      const harfler = [h]; for (const x of karistir(HAREKE_HARF)) { if (harfler.length >= 3) break; if (!harfler.some(y => hece(y, i) === hece(x, i))) harfler.push(x); }
      if (tur === 'oku') return secenekli({ soru: t('Nasıl okunur?'), goster: ar(h + HAREKE[i], 'dev'), dogru: hece(h, i), secenek: karistir(harfler.map(x => hece(x, i))) });
      if (tur === 'bul') return secenekli({ soru: t('Hangisi “{0}” okunur?', hece(h, i)), dogru: h + HAREKE[i], secenek: karistir(harfler.map(x => x + HAREKE[i])), arSec: true });
      if (tur === 'okuV') return secenekli({ soru: t('Nasıl okunur?'), goster: ar(h + HAREKE[i], 'dev'), dogru: hece(h, i), secenek: karistir([0, 1, 2].map(j => hece(h, j))) });
      if (tur === 'dinleV') return secenekli({ soru: t('Dinle: hangisini duydun?'), ses: 'hr:' + h + ':' + i, dogru: h + HAREKE[i], secenek: karistir(HAREKE.map(x => h + x)), arSec: true });
      if (tur === 'bulV') return secenekli({ soru: t('Hangisi “{0}” okunur?', hece(h, i)), dogru: h + HAREKE[i], secenek: karistir(HAREKE.map(x => h + x)), arSec: true });
    }
    // Okuma Adası: yalnız ince harflerle hece/kelime parçaları (okunuşlar kesin)
    function okumaParcasi(k) {
      const a = sec1(INCE), b = sec1(INCE.filter(x => x !== a)), i = rnd(3), j = rnd(3);
      const P = (ar_, oku) => ({ ar: ar_, oku });
      if (k === 'hece') {
        const yap = (x, y) => P(a + HAREKE[x] + b + HAREKE[y], hece(a, x) + '-' + hece(b, y));
        const v = [[i, j], [(i + 1) % 3, j], [i, (j + 1) % 3], [(i + 2) % 3, (j + 2) % 3]].map(([x, y]) => yap(x, y));
        return v;
      }
      if (k === 'cezm') {
        const v = [P(a + HAREKE[i] + b + CEZM, hece(a, i) + sessiz(b)), P(a + HAREKE[(i + 1) % 3] + b + CEZM, hece(a, (i + 1) % 3) + sessiz(b)), P(a + HAREKE[i] + b + HAREKE[j], hece(a, i) + '-' + hece(b, j)), P(a + HAREKE[(i + 2) % 3] + b + CEZM, hece(a, (i + 2) % 3) + sessiz(b))];
        return v;
      }
      if (k === 'tenvin') return [i, (i + 1) % 3, (i + 2) % 3].map(x => P(a + TENVIN[x], hece(a, x) + 'n')).concat([P(a + HAREKE[i], hece(a, i))]);
      if (k === 'med') {
        const m = x => P(a + HAREKE[x] + MED[x], sessiz(a) + uzun(x));
        return [m(i), m((i + 1) % 3), P(a + HAREKE[i], hece(a, i)), m((i + 2) % 3)];
      }
      if (k === 'sedde') {
        const s = (x, y) => P(a + HAREKE[x] + b + SEDDE + HAREKE[y], hece(a, x) + sessiz(b) + '-' + hece(b, y));
        return [s(i, j), s((i + 1) % 3, j), P(a + HAREKE[i] + b + HAREKE[j], hece(a, i) + '-' + hece(b, j)), s(i, (j + 1) % 3)];
      }
      return okumaParcasi(sec1(['hece', 'cezm', 'tenvin', 'med', 'sedde']));
    }
    function okumaSorusu(k, tur) {
      let v = okumaParcasi(k);
      const goruldu = new Set(); v = v.filter(x => !goruldu.has(x.oku) && goruldu.add(x.oku)).slice(0, 3);
      const d = v[0];
      if (tur === 'ayni') return secenekli({ soru: t('Aynısını bul!'), goster: ar(d.ar, 'dev'), dogru: d.ar, secenek: karistir(v.map(x => x.ar)), arSec: true });
      if (tur === 'oku') return secenekli({ soru: t('Nasıl okunur? (sağdan sola)'), goster: ar(d.ar, 'dev'), dogru: d.oku, secenek: karistir(v.map(x => x.oku)) });
      return secenekli({ soru: t('Hangisi “{0}” okunur?', d.oku), dogru: d.ar, secenek: karistir(v.map(x => x.ar)), arSec: true });
    }
    // Medine mushafındaki işaretler: cezm (ۡ), med işareti (ٓ), dik üstün (ٰ)
    const ISARET = { cezm: '\u06E1', med: '\u0653', dik: '\u0670' };
    function isaretSorusu(tur) {
      const h = sec1(INCE);
      return secenekli({ soru: { cezm: t('Hangisinde cezm var?'), med: t('Hangisinde med (uzatma) işareti var?'), dik: t('Hangisinde dik üstün var?') }[tur], dogru: h + ISARET[tur], secenek: karistir(Object.values(ISARET).map(x => h + x)), arSec: true });
    }
    // Sûre oyunları: sıradaki ayet, eksik kelime, dinle-bul
    function sureSorusu(n, tur, kac) {
      const x = SR(n), A0 = x.ayet, k = rnd(A0.length - 1);
      // seçeneklerde uzun ayetlerin yalnız başı gösterilir (okumayı yeni öğrenen çocuk için)
      const kisa = y => { const w = y.split(' '); return w.length > 4 ? w.slice(0, 3).join(' ') + ' …' : y; };
      const A = new Set(A0.map(kisa)).size === A0.length ? A0.map(kisa) : A0;
      const baska = (haric, m) => karistir(A.map((_, i) => i).filter(i => !haric.includes(i))).slice(0, m);
      if (tur === 'sira') return secenekli({ soru: t('Bu ayetten sonra hangisi gelir?'), goster: ar(A0[k], 'ayet-k'), dogru: A[k + 1], secenek: karistir([A[k + 1], ...baska([k, k + 1], kac - 1).map(i => A[i])]), arSec: true, uzun: true });
      if (tur === 'eksik') {
        const w = A0[k].split(' '), j = rnd(w.length), tum = [...new Set(A0.join(' ').split(' '))].filter(y => y !== w[j]);
        const gosterilen = w.map((y, i) => i === j ? '<span class="bosluk">ـــــ</span>' : y).join(' ');
        return secenekli({ soru: t('Eksik kelime hangisi?'), goster: ar(gosterilen, 'ayet-k'), dogru: w[j], secenek: karistir([w[j], ...karistir(tum).slice(0, kac - 1)]), arSec: true });
      }
      const i = rnd(A.length);
      return secenekli({ soru: t('Dinle: hangi ayeti duydun?'), ayetSes: n + ':' + (i + 1), dogru: A[i], secenek: karistir([A[i], ...baska([i], kac - 1).map(m => A[m])]), arSec: true, uzun: true });
    }
    function sorularHazirla(d) {
      const kk = kucuk(); let q = [];
      if (d.tur === 'harf') {
        const hi = HARF.indexOf(d.harf), havuz = HARF.slice(0, hi + 1);
        // son oyun duraktan durağa değişir: eşleştirme, gölge, harf treni
        const son = hi < 2 ? 'golge' : ['eslestir', 'golge', 'dizi'][hi % 3];
        const turler = kk ? ['ayni', 'nokta', 'sepet', hi % 2 ? 'golge' : 'ayni'] : ['ad', 'ayni', 'sepet', 'nokta', 'sekil', son];
        q = turler.map(x => x === 'eslestir' ? eslestirSorusu(d.harf, havuz) : harfSorusu(d.harf === 'لا' && x === 'sekil' ? 'ayni' : x, d.harf));
      } else if (d.tur === 'tekrar') {
        const havuz = HARF.slice(0, d.son + 1), yeni = havuz.slice(-8);
        const turler = kk ? ['ayni', 'sepet', 'golge', 'nokta', 'ayni'] : ['ad', 'sekil', 'sepet', 'eslestir', 'dizi', 'golge', 'ad'];
        q = turler.map((x, i) => { const h = sec1(i % 3 === 2 ? havuz : yeni); return x === 'eslestir' ? eslestirSorusu(h, havuz) : harfSorusu(h === 'لا' && x === 'sekil' ? 'ayni' : x, h); });
      } else if (d.tur === 'hareke') {
        const i = () => d.h >= 0 ? d.h : rnd(3);
        const turler = kk ? ['yer', 'yer', 'yer', 'yer'] : (d.h >= 0 ? ['yer', 'oku', 'bul', 'oku', 'bul', 'yer'] : ['okuV', 'bulV', 'okuV', 'yer', 'bulV', 'okuV']);
        q = turler.map(x => harekeSorusu(x, i()));
      } else if (d.tur === 'sure') {
        const turler = kk ? ['dinleA', 'dinleA', 'dinleA'] : ['sira', 'eksik', 'dinleA', 'sira', 'eksik', 'dinleA'];
        q = turler.map(x => sureSorusu(d.n, x, kk ? 2 : 3));
      } else if (d.k === 'isaret') {
        q = (kk ? ['cezm', 'med', 'dik', 'cezm'] : ['cezm', 'med', 'dik', 'cezm', 'med', 'dik']).map(isaretSorusu);
      } else {
        const turler = kk ? ['ayni', 'ayni', 'ayni', 'ayni'] : ['oku', 'bul', 'oku', 'bul', 'oku', 'bul'];
        q = turler.map(x => okumaSorusu(d.k, x));
      }
      q = q.filter(Boolean);
      // Hocanın kaydettiği ses varsa "dinle ve bul" soruları eklenir
      if (d.tur === 'harf' && HarfSes.var('h:' + d.harf)) q.splice(1, 0, harfSorusu('dinle', d.harf));
      if (d.tur === 'tekrar') { const l = HARF.slice(0, d.son + 1).filter(h => HarfSes.var('h:' + h)); if (l.length) q.splice(1, 0, harfSorusu('dinle', sec1(l))); }
      if (d.tur === 'hareke') { const i = d.h >= 0 ? d.h : rnd(3); const l = HAREKE_HARF.filter(h => HarfSes.var('hr:' + h + ':' + i)); if (l.length) q.splice(1, 0, harekeSorusu('dinleV', i, sec1(l))); }
      return q;
    }

    // ---------------------------------------------------------- durak oturumu
    let D = null;
    const DKEY = () => 'tecvid-ogren.durak.' + profil().id;
    const durakSakla = () => { try { if (D && D.adim !== 'bitti') localStorage.setItem(DKEY(), JSON.stringify(D)); else localStorage.removeItem(DKEY()); } catch (e) { } };
    const yarimDurak = () => { try { const x = JSON.parse(localStorage.getItem(DKEY()) || 'null'); return x && x.adim !== 'bitti' && durakBul(x.id) ? x : null; } catch (e) { return null; } };
    const tanissiz = d => d.tur === 'tekrar' || d.id === 'k4' || d.id === 'o6';
    const yeniD = d => ({ id: d.id, adim: tanissiz(d) ? 'oyun' : 'tanis', sorular: sorularHazirla(d), i: 0, hata: 0 });   // { id, adim: 'tanis'|'ciz'|'oyun'|'bitti', sorular, i, hata, buSoruHata }
    function durakBaslat(id) {
      const y = yarimDurak();
      D = y && y.id === id ? y : yeniD(durakBul(id));
      git('cocukDurak', id);
    }
    api.durakBaslat = durakBaslat;

    function tanisHTML(d) {
      if (d.tur === 'harf') {
        const h = d.harf, b = BILGI[h];
        // (besmele satırı EKRAN.cocukDurak içinde eklenir)
        const nokta = h === 'لا' ? t('Lam ile elif birleşince lamelif olur.') : b[0] === 0 ? t('Hiç noktası yok.') : t('{0} noktası var, harfin {1}.', b[0], b[1] === 'alt' ? t('altında') : t('üstünde'));
        const sekiller = h === 'لا' || h === 'ا' ? '' : `<div class="c-sekiller"><div>${ar(h)}<small>${t('Tek')}</small></div><div>${ar(h + (BITISMEZ.has(h) ? '' : 'ـ'))}<small>${t('Başta')}</small></div><div>${ar((BITISMEZ.has(h) ? 'ـ' + h : 'ـ' + h + 'ـ'))}<small>${t('Ortada')}</small></div><div>${ar('ـ' + h)}<small>${t('Sonda')}</small></div></div>`;
        return `<div class="c-tanis"><div class="c-dev-harf">${ar(h)}</div><h2>${esc(adi(h))}</h2>${HarfSes.var('h:' + h) ? `<button class="c-dinle" data-hses="h:${h}">🔊 ${t('Dinle')}</button>` : ''}<p>${nokta}</p>${kucuk() ? '' : sekiller}</div>`;
      }
      if (d.tur === 'hareke') {
        const i = d.h, ornek = ['ب', 'ت', 'ق'];
        const anlat = [t('Harfin <b>üstündeki</b> küçük eğik çizgiye <b>üstün</b> denir. Harfe “e” sesi verir; kalın harflerde “a” olur.'), t('Harfin <b>altındaki</b> küçük eğik çizgiye <b>esre</b> denir. Harfe “i” sesi verir; kalın harflerde “ı” olur.'), t('Harfin üstündeki küçük <b>vav</b> gibi işarete <b>ötre</b> denir. Harfe “u” sesi verir.')][i];
        return `<div class="c-tanis"><h2>${HAREKE_AD[i]}</h2><p>${anlat}</p><div class="c-ornekler">${ornek.map(h => `<div ${HarfSes.var('hr:' + h + ':' + i) ? `class="sesli" data-hses="hr:${h}:${i}" role="button"` : ''}>${ar(h + HAREKE[i], 'buyuk')}<b>${hece(h, i)}</b>${HarfSes.var('hr:' + h + ':' + i) ? '<small>🔊</small>' : ''}</div>`).join('')}</div></div>`;
      }
      if (d.tur === 'sure') {
        const x = SR(d.n), giris = { 1: t('Kur\'an\'ın ilk sûresidir; adı “açılış” demektir. Namazda okunur.'), 112: t('Allah\'ın bir olduğunu ve hiçbir şeye muhtaç olmadığını anlatır.'), 113: t('Sabahın Rabbine, her türlü kötülükten sığınmayı öğretir.'), 114: t('İnsanların Rabbine, kalbe kötü düşünce fısıldayandan sığınmayı öğretir.') }[d.n];
        const ind = api.sureSes ? api.sureSes(d.n) : null;
        return `<div class="c-tanis"><div class="c-sure-ad">${ar(x.ar)}</div><h2>${esc(d.ad)}</h2><p>${giris}</p><p class="soluk">${t('{0} ayet', x.ayet.length)}</p><p>${t('Önce dinleyeceğiz, sonra her ayeti sen tekrar edeceksin.')}</p>
          ${ind ? (ind.var >= ind.toplam ? `<p class="yesil kucukyazi">${t('✓ Sesler telefonda; internetsiz de çalar.')}</p>` : `<button class="btn ikincil" id="sureIndir">${t('📥 İnternetsiz dinlemek için indir')} (${ind.var}/${ind.toplam})</button>`) : ''}</div>`;
      }
      if (d.k === 'isaret') {
        return `<div class="c-tanis"><h2>${esc(d.ad)}</h2><p>${t('Kur\'an\'da (Medine mushafında) bazı işaretler kitaptakinden biraz farklı görünür:')}</p>
          <div class="c-ornekler"><div>${ar('بْ', 'buyuk')}${ar('بۡ', 'buyuk')}<b>${t('İkisi de cezm')}</b></div><div>${ar('جَآءَ', 'buyuk')}<b>${t('Med işareti: uzat')}</b></div><div>${ar('مَٰلِكِ', 'buyuk')}<b>${t('Dik üstün: elif gibi uzar')}</b></div></div></div>`;
      }
      const O = {
        hece: [t('Harekeli harfler yan yana gelince hece olur. Sağdan sola oku!'), ['بَتَ', 'كَتَبَ', 'جَلَسَ']],
        cezm: [t('Harfin üstündeki küçük yuvarlağa <b>cezm</b> denir. Cezmli harf, kendinden önceki harfle birlikte okunur.'), ['بَتْ', 'مِنْ', 'لَمْ']],
        tenvin: [t('İki üstün, iki esre ya da iki ötreye <b>tenvin</b> denir. Okurken sona “n” sesi eklenir.'), ['بً', 'بٍ', 'بٌ']],
        med: [t('Üstünden sonra elif, esreden sonra ye, ötreden sonra vav gelirse ses <b>uzatılır</b>.'), ['بَا', 'بِي', 'بُو']],
        sedde: [t('Harfin üstündeki küçük “w” gibi işarete <b>şedde</b> denir. Şeddeli harf iki kere okunur: önce önceki heceye katılır, sonra kendi harekesiyle okunur.'), ['بَتَّ', 'مَدَّ', 'كَفَّ']]
      }[d.k];
      // Okunuşun (Latin harf) kademeli kaybolması: tenvinden itibaren okunuş gizli, dokununca görünür
      const gizle = ['tenvin', 'med', 'sedde'].includes(d.k);
      return `<div class="c-tanis"><h2>${esc(d.ad)}</h2><p>${O[0]}</p><div class="c-ornekler">${O[1].map(x => `<div>${ar(x, 'buyuk')}${gizle ? okuGizli(okunus(x)) : `<b>${esc(okunus(x))}</b>`}</div>`).join('')}</div>${gizle ? `<p class="soluk kucukyazi">${t('Önce kendin okumayı dene, sonra 👁 ile kontrol et.')}</p>` : ''}</div>`;
    }
    const okuGizli = m => `<button class="oku-goster" data-oku="${esc(m)}" aria-label="${t('Okunuşu göster')}">👁</button>`;
    // Harekeli bir yazının okunuşu (yalnız ince harfler için kullanılır): heceler “-” ile ayrılır
    function okunus(s) {
      const m = [...s.matchAll(/([^\u064B-\u0652])([\u064B-\u0652]*)/g)].map(x => [x[1], x[2]]);
      const h = [];
      for (let n = 0; n < m.length; n++) {
        const [x, isr] = m[n], hi = HAREKE.findIndex(y => isr.includes(y)), ti = TENVIN.findIndex(y => isr.includes(y)), sonra = m[n + 1];
        if (isr.includes(SEDDE)) { if (h.length) h[h.length - 1] += sessiz(x); h.push(hece(x, hi)); continue; }
        if (ti >= 0) { h.push(hece(x, ti) + 'n'); continue; }
        if (isr.includes(CEZM)) { if (h.length) h[h.length - 1] += sessiz(x); continue; }
        if (hi >= 0 && sonra && !sonra[1] && MED[hi] === sonra[0]) { h.push(sessiz(x) + uzun(hi)); n++; continue; }
        if (hi >= 0) h.push(hece(x, hi));
      }
      return h.join('-');
    }
    api._okunus = s => okunus(s);

    // ---------- harfi parmakla çizme (kapsama ölçülür)
    function cizimKur(kap, h, bitince) {
      const W = Math.min(320, kap.clientWidth || 300), H = W, dpr = window.devicePixelRatio || 1;
      kap.innerHTML = `<canvas class="c-cizim" width="${W * dpr}" height="${H * dpr}" style="width:${W}px;height:${H}px" aria-label="${t('Çizim alanı')}"></canvas>`;
      const cv = kap.querySelector('canvas'), cx = cv.getContext('2d'); cx.scale(dpr, dpr);
      const font = `${Math.round(W * .62)}px Mushaf, serif`;
      // maske: harfin pikselleri
      const m = document.createElement('canvas'); m.width = W; m.height = H; const mx = m.getContext('2d');
      const harfCiz = (c, renk) => { c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.direction = 'rtl'; c.fillStyle = renk; c.fillText(h, W / 2, H * .5); };
      harfCiz(mx, '#000');
      const iz = document.createElement('canvas'); iz.width = W; iz.height = H; const ix = iz.getContext('2d');
      ix.lineCap = ix.lineJoin = 'round'; ix.lineWidth = W * .085; ix.strokeStyle = '#000';
      const renk = getComputedStyle(document.documentElement).getPropertyValue('--cocuk-iz').trim() || '#c9e7dc';
      // Önce yazı yönü gösterilir: harf sağdan sola doğru belirir, bir kalem noktası yolu izler
      let anim = 1, cizildi = false;
      const yeniden = () => {
        cx.clearRect(0, 0, W, H);
        if (anim < 1) { cx.save(); cx.beginPath(); cx.rect(W * (1 - anim) - 2, 0, W * anim + 4, H); cx.clip(); harfCiz(cx, renk); cx.restore(); cx.beginPath(); cx.arc(W * (1 - anim), H * .5, 9, 0, 7); cx.fillStyle = '#f2a516'; cx.fill(); }
        else harfCiz(cx, renk);
        cx.drawImage(iz, 0, 0);
      };
      const azHareket = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!azHareket) { anim = 0; const t0 = performance.now(); const adim = n => { anim = Math.min(1, (n - t0) / 1400); yeniden(); if (anim < 1) requestAnimationFrame(adim); }; requestAnimationFrame(adim); }
      const hazir = () => document.fonts && document.fonts.load ? document.fonts.load(font).catch(() => { }) : Promise.resolve();
      let piksel = null, genis = null, basla = null;
      hazir().then(() => {
        mx.clearRect(0, 0, W, H); harfCiz(mx, '#000'); const d = mx.getImageData(0, 0, W, H).data; piksel = [];
        for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) if (d[(y * W + x) * 4 + 3] > 128) { piksel.push(y * W + x); if (!basla || x > basla.x + 6 || (x >= basla.x - 2 && y < basla.y)) basla = { x, y }; }
        // genişletilmiş maske: harfin çevresinde kalem kalınlığı kadar pay (taşmayı ölçmek için)
        mx.lineWidth = W * .12; mx.lineJoin = 'round'; mx.strokeStyle = '#000'; mx.font = font; mx.textAlign = 'center'; mx.textBaseline = 'middle'; mx.direction = 'rtl'; mx.strokeText(h, W / 2, H * .5);
        genis = mx.getImageData(0, 0, W, H).data; yeniden();
      });
      yeniden();
      ix.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--ana').trim() || '#0f5a47';
      let son = null, bitti = false, uyarildi = false;
      const nokta = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; };
      const olc = () => {
        if (!piksel || !piksel.length || bitti) return;
        const d = ix.getImageData(0, 0, W, H).data; let k = 0; for (const p of piksel) if (d[p * 4 + 3] > 50) k++;
        const oran = k / piksel.length; kap.dataset.oran = oran.toFixed(2);
        // taşma: çizginin harfin dışına çıkan kısmı
        let ic = 0, dis = 0; if (genis) for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) { const i = (y * W + x) * 4 + 3; if (d[i] > 50) { if (genis[i] > 60) ic++; else dis++; } }
        const tasma = ic + dis ? dis / (ic + dis) : 0; kap.dataset.tasma = tasma.toFixed(2);
        if (oran >= .55 && tasma <= .45) { bitti = true; bitince(); }
        else if (oran >= .55 && !uyarildi) { uyarildi = true; konus(t('Harfin dışına çok taştın. Sil ve harfin üstünden dikkatlice geç.')); }
      };
      cv.onpointerdown = e => { e.preventDefault(); cizildi = true; cv.setPointerCapture && cv.setPointerCapture(e.pointerId); son = nokta(e); ix.beginPath(); ix.arc(son.x, son.y, ix.lineWidth / 2, 0, 7); ix.fillStyle = ix.strokeStyle; ix.fill(); yeniden(); };
      cv.onpointermove = e => { if (!son) return; const p = nokta(e); ix.beginPath(); ix.moveTo(son.x, son.y); ix.lineTo(p.x, p.y); ix.stroke(); son = p; yeniden(); };
      cv.onpointerup = cv.onpointercancel = () => { son = null; olc(); };
      return { temizle() { ix.clearRect(0, 0, W, H); bitti = false; uyarildi = false; cizildi = false; yeniden(); } };
    }

    function soruHTML(q) {
      if (q.tip === 'dizi') return `<p class="soluk ortala">${t('Elif-Ba\'daki sırayla: önce gelen harfe önce dokun.')}</p><div class="c-tren">${q.dizi.map(() => '<span class="c-vagon"></span>').join('')}<span class="c-lokomotif">🚂</span></div>
        <div class="c-kutular">${q.kutular.map((h, i) => `<button class="c-kutu" data-k="${i}" data-h="${h}">${ar(h)}</button>`).join('')}</div>`;
      if (q.tip === 'eslestir') return `<div class="c-eslestir"><div>${q.harfler.map(h => `<button class="c-kutu" data-eh="${h}">${ar(h)}</button>`).join('')}</div><div>${q.adlar.map(h => `<button class="c-kutu c-ad" data-ea="${h}">${esc(adi(h))}</button>`).join('')}</div></div>`;
      if (q.tip === 'sepet') return `<div class="c-sepet-alan"><div class="c-kutular">${q.kutular.map((h, i) => `<button class="c-kutu" data-k="${i}" data-h="${h}">${ar(h)}</button>`).join('')}</div>
        <div class="c-sepet" aria-live="polite"><span class="c-sepet-ikon">🧺</span><span class="c-sepet-ic"></span><b>0 / 3</b></div></div>`;
      return `${q.ses ? `<div class="c-goster"><button class="c-dinle buyuk" data-hses="${q.ses}">🔊 ${t('Tekrar dinle')}</button></div>` : ''}${q.ayetSes ? `<div class="c-goster"><button class="c-dinle buyuk" data-ayet="${q.ayetSes}">🔊 ${t('Tekrar dinle')}</button></div>` : ''}${q.goster ? `<div class="c-goster">${q.goster}</div>` : ''}<div class="c-secenekler ${q.arSec ? 'ar-sec' : ''} ${q.uzun ? 'uzun' : ''} n${q.secenek.length}">${q.secenek.map((s, i) => `<button class="c-secenek" data-i="${i}">${q.arSec ? ar(s) : esc(s)}</button>`).join('')}</div>`;
    }
    function konus(m, sesli) { const b = document.querySelector('.c-balon-yazi'); if (b) { b.innerHTML = m; const k = b.parentNode; k.classList.remove('yeni'); void k.offsetWidth; k.classList.add('yeni'); } Sesli.soyle(sesli || m); }

    EKRAN.cocukDurak = function (id) {
      const d = durakBul(id);
      if (!D || D.id !== id) D = yeniD(d);
      const app = document.getElementById('app');
      const adimlar = d.tur === 'harf' ? ['tanis', 'ciz', 'oyun', 'bitti'] : d.tur === 'sure' ? ['tanis', 'dinle', 'oyun', 'bitti'] : tanissiz(d) ? ['oyun', 'bitti'] : ['tanis', 'oyun', 'bitti'];
      const onceAdim = adimlar.indexOf('oyun'), toplamAdim = onceAdim + D.sorular.length;
      const suan = D.adim === 'bitti' ? toplamAdim : D.adim === 'oyun' ? onceAdim + D.i : adimlar.indexOf(D.adim);
      const ilerle = Math.round(suan / Math.max(1, toplamAdim) * 100);
      let govde = '', balon = '';
      if (D.adim === 'tanis') {
        // Her derse besmeleyle başlanır
        balon = d.tur === 'harf' ? t('Bismillâhirrahmânirrahîm. Bu harfle tanışalım!') : t('Bismillâhirrahmânirrahîm. Yeni bir şey öğreniyoruz!');
        govde = `<article class="kart c-kart"><p class="besmele" lang="ar" dir="rtl">${BESMELE}</p>${tanisHTML(d)}</article><button class="btn genis c-btn" id="cIleri">${d.tur === 'harf' ? t('Hadi çizelim ✏️') : d.tur === 'sure' ? t('Dinleyelim 🎧') : t('Hadi oynayalım 🎯')}</button>`;
      }
      else if (D.adim === 'dinle') {
        const x = SR(d.n), OK = (window.OKUNUS || {})[EN ? 'en' : 'tr'] || {};
        D.tekrar = D.tekrar || [];
        balon = t('Her ayeti dinle, sonra sen tekrar et!');
        govde = `<article class="kart c-kart c-sure">${d.n !== 1 ? `<div class="c-ayet besmele-satir"><button class="c-oynat" data-ayet="1:1" aria-label="${t('Dinle')}">▶</button>${ar(BESMELE)}</div>` : ''}
          ${x.ayet.map((a, i) => `<div class="c-ayet ${D.tekrar[i] ? 'tamam' : ''}"><button class="c-oynat" data-ayet="${d.n}:${i + 1}" aria-label="${t('Dinle')}">▶</button>
            <div class="c-ayet-ic">${ar(a)}${OK[d.n + ':' + (i + 1)] ? okuGizli(OK[d.n + ':' + (i + 1)]) : ''}</div>
            <button class="c-tekrar ${D.tekrar[i] ? 'tamam' : ''}" data-tekrar="${i}">${D.tekrar[i] ? '✓' : t('Tekrar ettim')}</button></div>`).join('')}
          <p class="soluk kucukyazi">${t('Ses için internet gerekir (ya da sesleri telefona indir). Okunuş yaklaşıktır; doğrusunu kâriden dinle.')}</p></article>
          <button class="btn genis c-btn" id="cOyuna">${t('Hadi oynayalım 🎯')}</button>`;
      }
      else if (D.adim === 'ciz') { balon = t('Parmağınla harfin üstünden geç!'); govde = `<article class="kart c-kart"><div class="c-cizim-kap" id="cizimKap"></div><p class="c-yon">${t('← Sağdan sola yazılır')}</p><p class="soluk ortala kucukyazi">${t('Harfin çoğunu boyayınca biter.')}</p></article><div class="satir"><button class="btn ikincil" id="cTemizle">${t('Sil')}</button><button class="btn" id="cAtla">${t('Oyuna geç ›')}</button></div>`; }
      else if (D.adim === 'oyun') { const q = D.sorular[D.i]; balon = q.soru; govde = `<article class="kart c-kart c-soru" data-tip="${q.tip}">${soruHTML(q)}</article>`; }
      else {
        const y = D.yildiz; const kalan = DURAK.indexOf(d) + 1 < DURAK.length ? DURAK[DURAK.indexOf(d) + 1] : null;
        const m = mujde(DURAK.indexOf(d));
        balon = y === 3 ? t('Mükemmel! Üç yıldız!') : y === 2 ? t('Çok güzel! İki yıldız!') : t('Bitirdin! Tekrar oynarsan daha çok yıldız kazanırsın.');
        govde = `<article class="kart c-kart c-bitti"><div class="c-yildizlar buyuk">${[1, 2, 3].map(n => `<span class="${n <= y ? 'dolu' : ''}" style="--g:${n * .18}s">★</span>`).join('')}</div>
          <h2>${esc(OVGU())}</h2>${D.yeniCikartma ? `<p class="c-yeni-cikartma">${t('Yeni çıkartma kazandın:')} <span>${D.yeniCikartma}</span></p>` : ''}</article>
          ${m}
          <div class="satir">${kalan ? `<button class="btn ikincil" data-git="ana">${t('Haritaya dön')}</button><button class="btn" id="cSonraki">${t('Sonraki durak ›')}</button>` : `<button class="btn" data-git="ana">${t('Haritaya dön')}</button>`}</div>
          ${!kalan ? `<article class="kart c-kart"><h2>${t('🎓 Harf yolculuğunu bitirdin!')}</h2><p>${t('Artık tecvid derslerine hazırsın. Bir büyüğünle birlikte derslere geçebilirsin.')}</p><button class="btn genis" id="cBuyuge">${t('📘 Tecvid derslerine geç')}</button></article>` : ''}`;
      }
      app.innerHTML = `${ust(esc(d.ad))}<div class="ilerleme c-ilerleme"><div style="width:${ilerle}%"></div></div>
        <main class="cocuk-ekran"><div class="c-maskot-satir">${MASKOT(64, 'zipla')}<div class="c-balon"><span class="c-balon-yazi">${balon}</span><button class="c-hoparlor" aria-label="${t('Sesli oku')}">🔊</button></div></div>${govde}</main>`;
      Sesli.acik = S().ayar.sesliYonerge !== false;
      const sq = D.adim === 'oyun' ? D.sorular[D.i] : null;
      const mj = D.adim === 'bitti' ? app.querySelector('[data-mujde]') : null;
      const sesliMetin = sq ? (sq.sesli || sq.soru) : balon + (mj && kucuk() ? ' ' + mj.dataset.mujde : '');
      if (mj) mj.onclick = () => Sesli.soyle(mj.dataset.mujde);
      app.querySelector('.c-hoparlor').onclick = () => { if (sq && sq.ses) HarfSes.cal(sq.ses); else if (sq && sq.ayetSes) api.ayetCal(sq.ayetSes); else Sesli.soyle(sesliMetin); };
      app.querySelectorAll('[data-ayet]').forEach(b => b.onclick = () => api.ayetCal(b.dataset.ayet, b));
      app.querySelectorAll('[data-oku]').forEach(b => b.onclick = () => { b.outerHTML = `<b class="oku-acik">${b.dataset.oku}</b>`; });
      app.querySelectorAll('[data-tekrar]').forEach(b => b.onclick = () => { const i = +b.dataset.tekrar; D.tekrar[i] = !D.tekrar[i]; if (D.tekrar[i]) { tik(true); Konfeti.patlat(b, 14); } durakSakla(); b.classList.toggle('tamam', !!D.tekrar[i]); b.textContent = D.tekrar[i] ? '✓' : t('Tekrar ettim'); b.closest('.c-ayet').classList.toggle('tamam', !!D.tekrar[i]); });
      const si = document.getElementById('sureIndir'); if (si) si.onclick = () => { api.sureSes(d.n).indir(); si.disabled = true; si.textContent = t('İndiriliyor…'); };
      const co = document.getElementById('cOyuna'); if (co) co.onclick = () => { D.adim = 'oyun'; api.ciz(); window.scrollTo(0, 0); };
      if (sq && sq.ses) setTimeout(() => HarfSes.cal(sq.ses), 250); else if (sq && sq.ayetSes) setTimeout(() => api.ayetCal(sq.ayetSes, app.querySelector('[data-ayet]')), 250); else if (D.sonSoylenen !== suan + D.adim) { D.sonSoylenen = suan + D.adim; setTimeout(() => Sesli.soyle(sesliMetin), 200); }
      app.querySelectorAll('[data-hses]').forEach(b => b.onclick = () => HarfSes.cal(b.dataset.hses));
      durakSakla();
      const gec = document.getElementById('cBuyuge'); if (gec) gec.onclick = () => api.buyugeGec();
      const ileri = document.getElementById('cIleri'); if (ileri) ileri.onclick = () => { D.adim = adimlar[adimlar.indexOf('tanis') + 1]; api.ciz(); window.scrollTo(0, 0); };
      if (D.adim === 'ciz') {
        const kap = document.getElementById('cizimKap');
        const c = cizimKur(kap, d.harf, () => { Konfeti.patlat(kap, 50); tik(true); konus(esc(OVGU()) + ' 🎉'); setTimeout(() => { if (D && D.adim === 'ciz') { D.adim = 'oyun'; api.ciz(); window.scrollTo(0, 0); } }, 1100); });
        document.getElementById('cTemizle').onclick = () => c.temizle();
        document.getElementById('cAtla').onclick = () => { D.adim = 'oyun'; api.ciz(); window.scrollTo(0, 0); };
      }
      if (D.adim === 'oyun') oyunBagla(d);
      const sn = document.getElementById('cSonraki'); if (sn) sn.onclick = () => { const k = DURAK[DURAK.indexOf(d) + 1]; D = yeniD(k); api.ekranDegistir('cocukDurak', k.id); };
    };

    function dogruCevap(el, sonra) {
      el.classList.add('dogru'); tik(true); Konfeti.patlat(el, 36); konus(esc(OVGU()) + ' ✨');
      document.querySelectorAll('.c-secenek,.c-kutu').forEach(b => b.disabled = true);
      setTimeout(sonra, 950);
    }
    function yanlisCevap(el, ipucu, dogru, secilen) {
      D.hata++;
      if (dogru && secilen && HARF.includes(dogru) && HARF.includes(secilen)) { const c = C(); c.hata = c.hata || {}; const k = dogru + '|' + secilen; c.hata[k] = (c.hata[k] || 0) + 1; kaydet(); } tik(false); el.classList.remove('salla'); void el.offsetWidth; el.classList.add('salla', 'soluk-sec');
      konus(t('Bir daha dene 🙂') + (ipucu ? ' ' + ipucu : ''));
    }
    function sonrakiSoru(d) {
      if (D.i + 1 < D.sorular.length) { D.i++; durakSakla(); api.ciz(); return; }
      durakBitir(d);
    }
    function oyunBagla(d) {
      const q = D.sorular[D.i];
      if (q.tip === 'sec') {
        document.querySelectorAll('.c-secenek').forEach(b => b.onclick = () => {
          const s = q.secenek[+b.dataset.i];
          if (s === q.dogru) dogruCevap(b, () => sonrakiSoru(d)); else yanlisCevap(b, q.ipucu, q.dogru, s);
        });
      } else if (q.tip === 'dizi') {
        let n = 0; const vagon = document.querySelectorAll('.c-vagon');
        document.querySelectorAll('.c-kutu').forEach(b => b.onclick = () => {
          if (b.dataset.h !== q.dizi[n]) { yanlisCevap(b, t('Elif-Ba sırasını düşün.'), q.dizi[n], b.dataset.h); return; }
          vagon[n].innerHTML = ar(b.dataset.h); vagon[n].classList.add('dolu'); b.disabled = true; b.style.visibility = 'hidden'; n++; tik(true);
          if (n === q.dizi.length) dogruCevap(document.querySelector('.c-tren'), () => sonrakiSoru(d));
        });
      } else if (q.tip === 'eslestir') {
        let secili = null, n = 0;
        document.querySelectorAll('[data-eh]').forEach(b => b.onclick = () => { document.querySelectorAll('[data-eh]').forEach(x => x.classList.remove('secili')); secili = b; b.classList.add('secili'); });
        document.querySelectorAll('[data-ea]').forEach(b => b.onclick = () => {
          if (!secili) { konus(t('Önce bir harf seç, sonra adını seç.')); return; }
          if (b.dataset.ea !== secili.dataset.eh) { yanlisCevap(b, '', secili.dataset.eh, b.dataset.ea); return; }
          [b, secili].forEach(x => { x.classList.remove('secili', 'soluk-sec'); x.classList.add('eslesti'); x.disabled = true; }); Konfeti.patlat(b, 12); tik(true); secili = null; n++;
          if (n === q.harfler.length) dogruCevap(document.querySelector('.c-eslestir'), () => sonrakiSoru(d));
        });
      } else if (q.tip === 'sepet') {
        let n = 0; const sepet = document.querySelector('.c-sepet'), ic = sepet.querySelector('.c-sepet-ic'), say = sepet.querySelector('b');
        document.querySelectorAll('.c-kutu').forEach(b => b.onclick = () => {
          if (b.dataset.h !== q.harf) { yanlisCevap(b, t('Bu {0} değil.', esc(adi(q.harf) || '')), q.harf, b.dataset.h); return; }
          // harf özenle sepete taşınır
          const r1 = b.getBoundingClientRect(), r2 = sepet.getBoundingClientRect();
          b.style.setProperty('--dx', (r2.left + r2.width / 2 - r1.left - r1.width / 2) + 'px'); b.style.setProperty('--dy', (r2.top + r2.height / 2 - r1.top - r1.height / 2) + 'px');
          b.classList.add('tasindi'); b.disabled = true; n++; tik(true);
          setTimeout(() => { ic.insertAdjacentHTML('beforeend', ar(q.harf)); say.textContent = n + ' / 3'; b.style.visibility = 'hidden'; }, 420);
          if (n === 3) setTimeout(() => dogruCevap(sepet, () => sonrakiSoru(d)), 460);
          else konus(t('Güzel! {0} tane kaldı.', 3 - n));
        });
      }
    }
    function durakBitir(d) {
      const y = D.hata === 0 ? 3 : D.hata <= 2 ? 2 : 1;
      const c = C(), onceki = c.d[d.id] || { y: 0, n: 0 }, oncekiToplam = toplamYildiz();
      c.d[d.id] = { y: Math.max(onceki.y || 0, y), n: (onceki.n || 0) + 1, t: Date.now() };
      const ek = Math.max(0, c.d[d.id].y - (onceki.y || 0)); c.gun[bugun()] = (c.gun[bugun()] || 0) + Math.max(1, ek);
      const yeniToplam = toplamYildiz();
      D.yeniCikartma = Math.floor(yeniToplam / CIKARTMA_ADIM) > Math.floor(oncekiToplam / CIKARTMA_ADIM) ? CIKARTMA[Math.min(CIKARTMA.length - 1, Math.floor(yeniToplam / CIKARTMA_ADIM) - 1)] : null;
      seriGuncelle(); kaydet();
      D.yildiz = y; D.adim = 'bitti'; durakSakla(); api.ciz(); window.scrollTo(0, 0);
      setTimeout(() => Konfeti.kutla(), 200);
    }
    function mujde(n) {
      const l = (window.MUJDE && window.MUJDE.cocuk) || []; if (!l.length) return '';
      const m = l[n % l.length];
      return `<section class="mujde cocuk"><button class="c-hoparlor mujde-ses" data-mujde="${esc(EN ? m.en : m.tr)}" aria-label="${t('Sesli oku')}">🔊</button><p class="mujde-baslik">${m.tur === 'ayet' ? t('📖 Allah Teâlâ buyuruyor:') : t('🌹 Peygamberimiz (s.a.v.) buyuruyor:')}</p><p class="ar" dir="rtl" lang="ar">${m.ar}</p><p class="mujde-metin">“${esc(EN ? m.en : m.tr)}”</p><p class="mujde-kaynak">${esc(EN ? m.ken : m.ktr)}</p></section>`;
    }

    // ---------------------------------------------------------- ana ekran: Harf Yolculuğu haritası
    const KAYMA = [0, 58, 86, 58, 0, -58, -86, -58];
    EKRAN.cocuk = function () {
      maskotRenk = C().renk || 'altin';
      const p = profil(), yarim = yarimDurak(), s = yarim ? durakBul(yarim.id) : siradaki(), bugunY = C().gun[bugun()] || 0;
      let harita = '', k = 0;
      ADALAR.forEach(a => {
        const l = DURAK.filter(d => d.ada === a.id), bitti = l.filter(d => yildiz(d.id)).length;
        harita += `<div class="c-ada" style="--ada:${a.renk}"><span>${a.ikon}</span><b>${a.ad}</b><small>${bitti}/${l.length}</small></div>`;
        l.forEach(d => {
          const y = yildiz(d.id), ac = acik(d), simdi = s && s.id === d.id;
          harita += `<div class="c-durak-satir"><div class="c-durak-yer" style="--x:${KAYMA[k++ % KAYMA.length]}px">
            <button class="c-durak ${y ? 'tamam' : ac ? 'acik' : 'kilit'} ${simdi ? 'simdi' : ''}" data-durak="${d.id}" ${ac ? '' : 'disabled'} aria-label="${esc(d.ad)}" style="--ada:${a.renk}">
              <span class="c-durak-ic">${/[؀-ۿ]/.test(d.ikon) ? ar(d.ikon, d.ikon.length > 4 ? 'uzun-ikon' : '') : d.ikon}</span>
              ${y ? `<span class="c-mini-yildiz">${'★'.repeat(y)}${'☆'.repeat(3 - y)}</span>` : ac ? '' : '<span class="c-kilit">🔒</span>'}
            </button>${simdi ? `<div class="c-burada">${MASKOT(40, 'zipla')}</div>` : ''}</div></div>`;
        });
      });
      const app = document.getElementById('app');
      const ad = p.ad ? esc(p.ad) : '';
      app.innerHTML = `${ust(t('Harf Yolculuğu'), false, `<span class="c-ust-yildiz">★ ${toplamYildiz()}</span>`)}<main class="cocuk-ekran">
        <section class="c-kahraman">${MASKOT(86, 'zipla')}<div><p class="c-selam">${ad ? t('Selâmün aleyküm {0}!', ad) : t('Selâmün aleyküm!')}</p>
          <p>${s ? t('Sıradaki durak: <b>{0}</b>', esc(s.ad)) : t('Bütün durakları bitirdin! Maşallah! 🎉')}</p>
          <div class="c-hedef"><span>${bugunY ? '✅' : '🎯'}</span>${bugunY ? t('Bugünkü hedef tamam! Yarın görüşürüz.') : t('Bugünkü hedef: 1 durak')}</div></div></section>
        ${S().ayar.sesKontrol ? '' : `<section class="kart c-ses-kontrol"><h2>${t('🔊 Sesimi duyuyor musun?')}</h2><p>${t('Yönergeleri sesli okuyorum. Önce bir dene:')}</p>
          <div class="satir sola"><button class="btn ikincil" id="sesDene">${t('🔊 Dene')}</button><button class="btn" id="sesVar">${t('✓ Duyuyorum')}</button><button class="btn ikincil" id="sesYok">${t('✗ Duymuyorum')}</button></div><div id="sesYardim"></div></section>`}
        ${s ? `<button class="btn genis c-btn" data-durak="${s.id}">${yarim ? t('▶ Kaldığın yerden devam et') : t('▶ Devam et')}</button>` : ''}
        ${(() => { const sd = DURAK.filter(d => d.ada === 'sure'), sir = sd.find(d => !yildiz(d.id)) || sd[0]; return sir && (!s || s.ada !== 'sure') ? `<button class="btn genis ikincil c-sure-kisa" data-durak="${sir.id}">📖 ${t('Sûreler Adası: {0}', esc(sir.ad))}</button>` : ''; })()}
        <div class="c-harita">${harita}</div>
        <p class="soluk ortala kucukyazi">${t('Kısa ve sık çalışmak en iyisi: her gün bir durak yeter.')}</p>
      </main>`;
      app.querySelectorAll('[data-durak]').forEach(b => b.onclick = () => durakBaslat(b.dataset.durak));
      const sd = document.getElementById('sesDene'); if (sd) {
        sd.onclick = () => { Sesli.acik = true; Sesli.soyle(t('Selâmün aleyküm! Sesimi duyuyor musun?')); };
        document.getElementById('sesVar').onclick = () => { S().ayar.sesKontrol = 'var'; kaydet(); api.ciz(); };
        document.getElementById('sesYok').onclick = async () => {
          const TTS = window.capEklenti && window.capEklenti('TextToSpeech');
          let destek = null; if (TTS) { try { destek = (await TTS.isLanguageSupported({ lang: EN ? 'en-GB' : 'tr-TR' })).supported; } catch (e) { } }
          document.getElementById('sesYardim').innerHTML = `<p>${t('Telefonun ses seviyesini aç. Yine duyulmuyorsa telefonun ayarlarında “Metin okuma” (Text-to-speech) bölümünden Türkçe ses verisini yükle.')}</p>
            ${destek === false ? `<p class="kirmizi">${t('Bu telefonda Türkçe konuşma sesi yüklü görünmüyor.')}</p>` : ''}
            ${TTS ? `<button class="btn" id="sesYukle">${t('Ses verisini yükle')}</button>` : ''} <button class="btn ikincil" id="sesKapat">${t('Sessiz devam et')}</button>`;
          const y = document.getElementById('sesYukle'); if (y) y.onclick = () => TTS.openInstall().catch(() => toast(t('Ayarlar açılamadı.')));
          document.getElementById('sesKapat').onclick = () => { S().ayar.sesKontrol = 'yok'; S().ayar.sesliYonerge = false; kaydet(); api.ciz(); };
        };
      }
      const sim = app.querySelector('.c-durak.simdi'); if (sim && sim.scrollIntoView && DURAK.indexOf(s) > 3) setTimeout(() => sim.scrollIntoView({ block: 'center' }), 60);
    };

    // ---------------------------------------------------------- Yıldızlarım (çocuk ilerleme ekranı)
    EKRAN.cocukIlerleme = function () {
      maskotRenk = C().renk || 'altin';
      const top = toplamYildiz(), c = C(), cikSay = Math.floor(top / CIKARTMA_ADIM);
      const sonraki = CIKARTMA_ADIM - top % CIKARTMA_ADIM;
      const gunler = [...Array(7)].map((_, i) => { const g = new Date(Date.now() - (6 - i) * 86400000); const k = g.toISOString().slice(0, 10); return { k, ad: g.toLocaleDateString(EN ? 'en-GB' : 'tr-TR', { weekday: 'short' }), y: c.gun[k] || 0 }; });
      const adalar = ADALAR.map(a => { const l = DURAK.filter(d => d.ada === a.id); const b = l.filter(d => yildiz(d.id)).length; const y = l.reduce((x, d) => x + yildiz(d.id), 0); return { a, b, n: l.length, y, max: l.length * 3 }; });
      const ogrenilen = HARF.filter((h, i) => yildiz('h' + i)).length;
      const app = document.getElementById('app');
      app.innerHTML = `${ust(t('Yıldızlarım'), false)}<main class="cocuk-ekran">
        <section class="c-yildiz-kahraman">${MASKOT(110, 'don')}<div><b class="c-dev-sayi">${top}</b><span>${t('yıldız')}</span></div>
          <p>${cikSay < CIKARTMA.length ? t('Sonraki çıkartmaya {0} yıldız kaldı!', sonraki) : t('Bütün çıkartmaları topladın!')}</p></section>
        <div class="c-istat"><div><b>${ogrenilen}</b><small>${t('harf öğrendin')}</small></div><div><b>${DURAK.filter(d => yildiz(d.id) === 3).length}</b><small>${t('üç yıldızlı durak')}</small></div><div><b>🔥 ${S().seri.gun || 0}</b><small>${t('gün seri')}</small></div></div>
        <h2 class="baslik">${t('Adalarım')}</h2>
        ${adalar.map(x => `<article class="kart c-ada-kart" style="--ada:${x.a.renk}"><span class="c-ada-ikon">${x.a.ikon}</span><div><b>${x.a.ad}</b><div class="c-cubuk"><div style="width:${Math.round(x.b / x.n * 100)}%"></div></div><small>${t('{0}/{1} durak · {2} yıldız', x.b, x.n, x.y)}</small></div></article>`).join('')}
        <h2 class="baslik">${t('Bu hafta')}</h2>
        <div class="c-hafta">${gunler.map(g => `<div class="${g.y ? 'dolu' : ''} ${g.k === bugun() ? 'bugun' : ''}"><span>${g.y ? '★' : '·'}</span><b>${g.y || ''}</b><small>${esc(g.ad)}</small></div>`).join('')}</div>
        <h2 class="baslik">${t('Yıldızımın rengi')}</h2>
        <div class="c-renkler">${Object.entries(MASKOT_RENK).map(([k, r]) => { const ac = top >= r[4]; return `<button class="c-renk ${C().renk === k || (!C().renk && k === 'altin') ? 'secili' : ''}" data-mrenk="${k}" ${ac ? '' : 'disabled'} aria-label="${k}">${MASKOT(44, '', k)}${ac ? '' : `<small>🔒 ${r[4]}★</small>`}</button>`; }).join('')}</div>
        <h2 class="baslik">${t('Çıkartma albümüm')}</h2>
        <div class="c-album">${CIKARTMA.map((e, i) => `<div class="${i < cikSay ? 'acik' : ''}">${i < cikSay ? e : '?'}</div>`).join('')}</div>
        <p class="soluk ortala kucukyazi">${t('Her {0} yıldızda yeni bir çıkartma açılır.', CIKARTMA_ADIM)}</p>
      </main>`;
      app.querySelectorAll('[data-mrenk]').forEach(b => b.onclick = () => { C().renk = b.dataset.mrenk; kaydet(); Konfeti.patlat(b, 20); api.ciz(); });
    };

    // ---------------------------------------------------------- hoca için: harf seslerini kaydetme
    let KAYIT = null;   // { k, r }
    EKRAN.harfSesleri = function (sekme = 'harf') {
      const app = document.getElementById('app');
      const hucre = (k, arMetin, etiket) => {
        const var_ = HarfSes.var(k), kayit = KAYIT && KAYIT.k === k;
        return `<div class="ses-hucre ${var_ ? 'var' : ''} ${kayit ? 'kayitta' : ''}">${ar(arMetin)}<small>${esc(etiket)}</small>
          <div class="ses-dugmeler"><button class="ses-kaydet" data-skayit="${k}" aria-label="${t('Kaydet')}">${kayit ? '⏹' : '●'}</button>${var_ ? `<button data-hses="${k}" aria-label="${t('Dinle')}">▶</button><button data-ssil="${k}" aria-label="${t('Sil')}">🗑</button>` : ''}</div></div>`;
      };
      const izgara = sekme === 'harf' ? HARF.map(h => hucre('h:' + h, h, adi(h))).join('')
        : HAREKE_HARF.map(h => [0, 1, 2].map(i => hucre('hr:' + h + ':' + i, h + HAREKE[i], hece(h, i))).join('')).join('');
      app.innerHTML = `${ust(t('Harf seslerini kaydet'))}<main>
        <article class="kart"><p>${t('Bir hoca ya da büyük, harflerin okunuşunu kendi sesiyle kaydeder. Çocuk modundaki “Dinle” düğmeleri ve “dinle ve bul” oyunları bu seslerle çalışır.')}</p>
          <p class="soluk kucukyazi">${t('● ile kaydı başlat, harfi bir kez açık ve doğru mahreçle oku, ⏹ ile bitir (en fazla 3 saniye). Kayıtlar yalnızca bu telefonda saklanır.')}</p></article>
        <div class="sekmeler"><button class="${sekme === 'harf' ? 'aktif' : ''}" data-ssekme="harf">${t('Harfler')} (${HarfSes.sayi('h:')}/${HARF.length})</button><button class="${sekme === 'hareke' ? 'aktif' : ''}" data-ssekme="hareke">${t('Harekeli heceler')} (${HarfSes.sayi('hr:')}/${HAREKE_HARF.length * 3})</button></div>
        <div class="ses-izgara ${sekme}">${izgara}</div></main>`;
      app.querySelectorAll('[data-ssekme]').forEach(b => b.onclick = () => api.ekranDegistir('harfSesleri', b.dataset.ssekme));
      app.querySelectorAll('[data-hses]').forEach(b => b.onclick = () => HarfSes.cal(b.dataset.hses));
      app.querySelectorAll('[data-ssil]').forEach(b => b.onclick = async () => { await HarfSes.sil(b.dataset.ssil).catch(() => { }); api.ciz(); });
      app.querySelectorAll('[data-skayit]').forEach(b => b.onclick = async () => {
        const k = b.dataset.skayit;
        if (KAYIT) { const ayni = KAYIT.k === k; KAYIT.r.state !== 'inactive' && KAYIT.r.stop(); if (ayni) return; }
        if (!navigator.mediaDevices || !window.MediaRecorder) return toast(t('Bu cihazda ses kaydı desteklenmiyor.'));
        let akis; try { akis = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { return toast(t('Mikrofon izni verilmedi. Telefon ayarlarından Hüsn-i Kıraat için mikrofona izin ver.')); }
        const parca = []; const r = new MediaRecorder(akis); KAYIT = { k, r };
        r.ondataavailable = e => { if (e.data && e.data.size) parca.push(e.data); };
        r.onstop = async () => {
          akis.getTracks().forEach(x => x.stop()); clearTimeout(KAYIT && KAYIT.z); KAYIT = null;
          if (parca.length) { try { await HarfSes.kaydet(k, new Blob(parca, { type: r.mimeType || 'audio/webm' })); toast(t('Kaydedildi ✓')); } catch (e) { toast(t('Kaydedilemedi: ') + (e.message || e)); } }
          const ek = document.querySelector('.ses-izgara'); if (ek) api.ciz();
        };
        r.start(); KAYIT.z = setTimeout(() => r.state !== 'inactive' && r.stop(), 3000);
        api.ciz();
      });
    };

    return { DURAK, toplamYildiz, siradaki, ebeveynKilidi, MASKOT, yildiz, D: () => D, okunus };
  };
  window.ebeveynKilidi = ebeveynKilidi;
  window.MASKOT = MASKOT;
})();

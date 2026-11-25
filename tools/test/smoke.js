// Duman testi: uygulama açılıyor mu, ekranlar hata vermeden çiziliyor mu?
// Çalıştır: npm run test:smoke   (Playwright gerekir: npm i -D playwright)
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '../../www');
const TIP = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css',
  '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.wasm': 'application/wasm', '.mjs': 'text/javascript', '.onnx': 'application/octet-stream' };

// Test dış ağa çıkmaz: yalnız localhost; Firebase/ses siteleri gibi dış istekler hemen reddedilir (CI'da takılıp sayfanın 'load' olayını geciktirmesin)
const yerelContext = async (tarayici, ops) => { const c = await tarayici.newContext(ops); await c.route(u => u.hostname !== 'localhost', r => r.abort()); return c; };

const sunucu = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TIP[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});

// Çizilmesi gereken ekranlar: [ad, argüman üreten kod (tarayıcıda çalışır, dizi döndürür)].
// Yeni ekran eklenince buraya ekle. Argümanlar ders/sûre gibi gerçek verilerden alınır.
const U0 = 'TC.U.filter(u => !u.ara)[0].id';
const EKRANLAR = [
  ['ana'], ['tecvid'], ['mufredat'], ['yenilikler'], ['gunluk'], ['ilerleme'], ['testler'], ['zayif'], ['gecmis'],
  ['ders', `[${U0}]`], ['ders', `[${U0}, 'ders']`], ['sinavGiris', '[TC.U.find(u => u.ara).id]'],
  ['hesap'], ['sinif'], ['indir'], ['profil'], ['profiller'], ['ayarlar'], ['kimCalisiyor'], ['hosgeldin'],
  ['seviyeTespit'], ['sureler'], ['kuranDinle'], ['kuralAra'], ['yerImleri'], ['kariSec'], ['hocamiBul'],
  ['sayfa', '[1]'], ['sure', '[1]'], ['sure', '[2]'], ['sureTest', '[1]'], ['sureTecvid', '[1, 1]'], ['sureTecvidSec'],
  ['mesk', '[1, 1]'], ['meskSec'], ['ezber'], ['ezberCalis', '[1]'], ['ezberEkle'], ['hatim'],
  ['muezzin'], ['okumaRaporu'], ['harfKartlari'], ['harfKarti', '[window.TC.HARFLER[0][0]]'], ['hikaye', `[${U0}, 0]`],
  ['pekistir', `[${U0}, 0]`], ['ebeveynOzet'],
];

(async () => {
  await new Promise(c => sunucu.listen(0, c));
  const url = `http://localhost:${sunucu.address().port}/`;
  const tarayici = await chromium.launch();
  const sayfa = await (await yerelContext(tarayici,{ viewport: { width: 390, height: 800 }, serviceWorkers: 'block' })).newPage();
  const hatalar = [];
  sayfa.on('pageerror', e => hatalar.push('pageerror: ' + e.message));
  sayfa.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) hatalar.push('console: ' + m.text()); });

  let basarisiz = 0;
  const kontrol = (ad, ok, ek = '') => { console.log((ok ? 'OK   ' : 'HATA ') + ad + (ek ? ' — ' + ek : '')); if (!ok) basarisiz++; };

  const KAPSAM = process.argv.includes('--kapsam');
  if (KAPSAM) await sayfa.coverage.startJSCoverage({ resetOnNavigation: false });
  await sayfa.addInitScript(() => { try { localStorage.setItem('hk.test', '1'); } catch (e) { } });
  await sayfa.goto(url, { waitUntil: 'domcontentloaded' });
  await sayfa.waitForFunction(() => window.__TECVID, null, { timeout: 15000 }).catch(() => { });
  kontrol('uygulama açıldı (__TECVID var)', await sayfa.evaluate(() => !!window.__TECVID));

  for (const [ad, ...arg] of EKRANLAR) {
    const once = hatalar.length;
    try {
      await sayfa.evaluate(([a, kod]) => { const g = kod ? eval(kod) : []; const T = window.__TECVID; a === 'ana' ? T.ana() : T.git(a, ...g); }, [ad, arg[0] || '']);
      await sayfa.waitForTimeout(150);
      const bos = await sayfa.evaluate(() => !(document.querySelector('main, #app, body') || {}).innerText.trim());
      kontrol(`ekran: ${ad}`, hatalar.length === once && !bos, hatalar.slice(once).join(' | '));
    } catch (e) { kontrol(`ekran: ${ad}`, false, e.message.split('\n')[0]); }
  }

  // Akışlar: oturumu başlat, soruları (ilk seçenekle) cevapla, bitiş ekranına ulaş
  const cevapla = async (ad, baslat, en_az) => {
    const once = hatalar.length;
    try {
      await sayfa.evaluate(baslat);
      if (await sayfa.$('#bas')) await sayfa.click('#bas');
      let soru = 0;
      for (; soru < 40; soru++) {
        if (!(await sayfa.$('.secenek:not([disabled])'))) break;
        await sayfa.click('.secenek:not([disabled])');
        const ileri = await sayfa.$('#ileri'); if (!ileri) break;
        await ileri.click();
      }
      kontrol(`akış: ${ad} (${soru} soru)`, hatalar.length === once && soru >= en_az, hatalar.slice(once).join(' | '));
    } catch (e) { kontrol(`akış: ${ad}`, false, e.message.split('\n')[0]); }
  };
  await cevapla('ara sınav', () => window.__TECVID.git('sinavGiris', TC.U.find(u => u.ara).id), 5);
  await cevapla('bölüm testi', () => window.__TECVID.git('testBasla', 'bolum', TC.U.filter(u => !u.ara)[0].id), 1);
  await cevapla('alıştırma', () => window.__TECVID.git('alistirmaBasla', TC.U.filter(u => !u.ara)[0].id), 1);

  // Kur'an takip modu: ‹ › okları, kesin hata altı çizgisi, "Hatalarımı göster" paneli
  {
    const once = hatalar.length;
    try {
      await sayfa.evaluate(() => {
        const K = [0, 1, 2, 3].map(i => ({ index: i, notes: i === 1 ? [{ severity: 'jali', msg: 'Hareke hatası', rule: 'vowel' }] : [], madd: [] }));
        window.__TECVID.TAKIP_HATA.clear(); window.__TECVID.TAKIP_HATA.set('1:1', { n: 1, a: 1, p: 1, s: { kelimeler: K } });
        window.__TECVID.git('sayfa', 1);
      });
      kontrol('takip: altta ‹ › okları var', !!(await sayfa.$('#koOkGeri')) && !!(await sayfa.$('#koOkIleri')));
      const alt = await sayfa.evaluate(() => { const e = document.createElement('span'); e.className = 'kelime hata-alt'; e.textContent = 'x'; document.body.appendChild(e); return getComputedStyle(e).textDecorationLine; });
      kontrol('takip: kesin hata altı çiziliyor', alt === 'underline', alt);
      const orta = await sayfa.evaluate(() => { const a = document.createElement('div'); a.className = 'ayet'; a.innerHTML = '<span class="kelime r-orta">x</span>'; document.body.appendChild(a); return getComputedStyle(a.firstChild).textDecorationLine; });
      kontrol('takip: "kontrol et" (ince hata) çizilmiyor', orta === 'none', orta);
      await sayfa.click('#koHatalar');
      const panel = await sayfa.evaluate(() => (document.querySelector('.ko-hatalar') || {}).innerText || '');
      kontrol('takip: Hatalarımı göster paneli açılıyor', /Hatalarım/.test(panel) && /1\. ayet/.test(panel) && /Hareke hatası/.test(panel), panel.slice(0, 80));
      await sayfa.click('.ko-hatalar [data-c="temizle"]');
      kontrol('takip: liste temizlenince panel kapanıyor, hata kalmıyor', !(await sayfa.$('.ko-hatalar')) && (await sayfa.evaluate(() => window.__TECVID.TAKIP_HATA.size)) === 0);
      kontrol('takip: sayfa hatasız çizildi', hatalar.length === once, hatalar.slice(once).join(' | '));
    } catch (e) { kontrol('takip', false, e.message.split('\n')[0]); }
  }

  // Takip durum göstergesi, ilerleme çubuğu ve "bu kelimeyi geç" (sahte takip durumuyla; gerçek mikrofon/model gerekmez)
  {
    const once = hatalar.length;
    try {
      await sayfa.evaluate(() => window.__TECVID.git('sayfa', 1));
      const sonuc = await sayfa.evaluate(() => {
        const T = window.__TECVID.canliTest, bar = document.getElementById('canliBar'); bar.hidden = false;
        const els = a => [...document.querySelectorAll(`.ko-a[data-ayet="1:${a}"] .kelime`)];
        const W = []; for (let a = 1; a <= 7; a++) els(a).forEach((e, wi) => W.push({ a, wi, s: W.length * 4, e: W.length * 4 + 4 }));
        const ses = v => (b, s) => new Float32Array(Math.max(0, s - b)).fill(v);
        const C = { n: 1, W, acilan: 3, c: 12, bas: 0, rms: [], tani: [], t0: Date.now(), bitti: false, toplam: () => 48000, al: ses(0.2), elBul: a => els(a), sonIlerleme: Date.now() };
        T.kur(C); T.sira();
        const o = {};
        const gorunur = () => getComputedStyle(bar.querySelector('.canli-eylem')).display !== 'none';
        T.durum(); o.dinle = [bar.dataset.durum, !gorunur()];
        C.sonIlerleme = Date.now() - 10000; C.al = ses(0.2); T.durum(); o.takildi = [bar.dataset.durum, !gorunur(), bar.querySelector('.canli-durum').textContent];
        C.al = ses(0); T.durum(); o.bekle = [bar.dataset.durum, bar.querySelector('.canli-durum').textContent];
        o.cubuk = bar.querySelector('.canli-ilerleme').getAttribute('aria-valuenow');
        const sira = C.W[C.acilan], once_ = C.acilan; C.al = ses(0.2); C.sonIlerleme = Date.now() - 10000; T.durum(); T.gec();
        o.gec = [C.acilan - once_, !!els(sira.a)[sira.wi].classList.contains('canli-atlandi'), bar.dataset.durum, !gorunur()];
        T.kur(null); return o;
      });
      kontrol('takip: sesli ve ilerliyorken "dinliyorum"', sonuc.dinle[0] === 'dinle' && sonuc.dinle[1] === true, JSON.stringify(sonuc.dinle));
      kontrol('takip: ses var ilerleme yok → "takıldım" + geç düğmesi', sonuc.takildi[0] === 'takildi' && sonuc.takildi[1] === false && /eşleştiremedim/.test(sonuc.takildi[2]), JSON.stringify(sonuc.takildi));
      kontrol('takip: sustuysan "bekliyorum" ve kaldığın yer yazıyor', sonuc.bekle[0] === 'bekle' && /ayet, \d+\. kelime/.test(sonuc.bekle[1]), sonuc.bekle[1]);
      kontrol('takip: ilerleme çubuğu dolu (>0)', +sonuc.cubuk > 0, 'aria-valuenow=' + sonuc.cubuk);
      kontrol('takip: kelimeyi geç → bir kelime ilerler, gri işaretlenir, durum sıfırlanır', sonuc.gec[0] === 1 && sonuc.gec[1] === true && sonuc.gec[2] === 'dinle' && sonuc.gec[3] === true, JSON.stringify(sonuc.gec));
      kontrol('takip: durum testi hatasız', hatalar.length === once, hatalar.slice(once).join(' | '));
    } catch (e) { kontrol('takip durum', false, e.message.split('\n')[0]); }
  }

  // Durdur'a basınca anında geri bildirim: mikrofon kapanır, düğme kilitlenir, durum "değerlendiriliyor" olur (ağır model işinden önce)
  {
    const once = hatalar.length;
    try {
      await sayfa.evaluate(() => window.__TECVID.git('sayfa', 1));
      const o = await sayfa.evaluate(() => {
        const T = window.__TECVID.canliTest, bar = document.getElementById('canliBar'); bar.hidden = false;
        let durdu = 0, kes = 0;
        const C = { n: 1, W: [{ a: 1, wi: 0, s: 0, e: 4 }], acilan: 0, rms: [], tani: [], t0: Date.now(), bitti: false, mesgul: false, toplam: () => 0, al: () => new Float32Array(0),
          isl: { disconnect() { kes++; } }, kaynak: { disconnect() { kes++; } }, akis: { getTracks: () => [{ stop() { durdu++; } }] }, sirala: f => Promise.resolve(f()), ctx: { close() { } }, sonIlerleme: Date.now(), elBul: () => [] };
        T.kur(C); T.durdur(true);   // beklemeden: eşzamanlı kısım hemen bitmiş olmalı
        return { mic: durdu, kes, durum: bar.dataset.durum, kilitli: bar.querySelector('#canliDur').disabled, metin: bar.querySelector('.canli-durum').textContent };
      });
      kontrol('durdur: mikrofon hemen kapanıyor, düğme kilitleniyor, durum "değerlendiriliyor"', o.mic === 1 && o.kes === 2 && o.durum === 'bitir' && o.kilitli === true && /değerlendiriliyor/.test(o.metin), JSON.stringify(o));
      await sayfa.waitForTimeout(300);
      kontrol('durdur: sonunda hatasız bitiyor', hatalar.length === once, hatalar.slice(once).join(' | '));
    } catch (e) { kontrol('durdur', false, e.message.split('\n')[0]); }
  }

  // Okuma modeli (yapay zekâ) Web Worker'da açılıyor ve ses çözüyor: ekran model hesaplarken donmasın
  {
    const once = hatalar.length;
    try {
      const o = await sayfa.evaluate(async () => {
        await new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'js/okuma.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
        await Okuma.modelAc();
        const ses = new Float32Array(16000 * 2); for (let i = 0; i < ses.length; i++) ses[i] = 0.1 * Math.sin(i / 9) + 0.02 * (Math.random() - 0.5);
        const d = await Okuma.dinle(ses);
        return { proxy: ort.env.wasm.proxy === true, heard: typeof d.heard, times: Array.isArray(d.times) };
      });
      kontrol('okuma modeli: Web Worker\'da açılıyor ve ses çözüyor', o.proxy && o.heard === 'string' && o.times, JSON.stringify(o));
      kontrol('okuma modeli: hatasız', hatalar.length === once, hatalar.slice(once).join(' | '));
    } catch (e) { kontrol('okuma modeli', false, e.message.split('\n')[0]); }
  }

  // Kur'an: Git (sûre+ayet, sayfa, cüz), ayet ekranı, birden çok meal
  {
    const once = hatalar.length;
    try {
      const baslik = () => sayfa.evaluate(() => document.querySelector('#app').innerText.slice(0, 200));
      await sayfa.evaluate(() => window.__TECVID.git('sureler'));
      await sayfa.waitForFunction(() => document.querySelectorAll('#gitSure option').length > 100, null, { timeout: 8000 });
      await sayfa.evaluate(() => { document.getElementById('koGit').open = true; });
      await sayfa.selectOption('#gitSure', '2'); await sayfa.fill('#gitAyet', '300'); await sayfa.click('#gitAyetBtn');
      kontrol('git: sûrede olmayan ayet reddediliyor (Bakara 300)', !(await sayfa.$('.ko-a[data-ayet="2:185"]')) && /286/.test(await sayfa.evaluate(() => { const l = [...document.querySelectorAll('.toast')]; return l.length ? l[l.length - 1].textContent : ''; })));
      await sayfa.fill('#gitAyet', '185'); await sayfa.click('#gitAyetBtn'); await sayfa.waitForSelector('.ko-a[data-ayet="2:185"]');
      kontrol('git: Bakara 185 → sayfa 28 (Medine mushafı) açıldı, ayet sayfada', /Sayfa 28/.test(await baslik()));
      await sayfa.evaluate(() => window.__TECVID.git('sureler')); await sayfa.waitForSelector('#gitSayfa', { state: 'attached' });
      await sayfa.evaluate(() => { document.getElementById('koGit').open = true; });
      await sayfa.fill('#gitSayfa', '604'); await sayfa.click('#gitSayfaBtn'); await sayfa.waitForSelector('.ko-sayfa');
      kontrol('git: sayfa 604 açıldı', /Sayfa 604/.test(await baslik()));
      await sayfa.evaluate(() => window.__TECVID.git('sureler')); await sayfa.waitForSelector('#gitCuz', { state: 'attached' });
      await sayfa.evaluate(() => { document.getElementById('koGit').open = true; });
      await sayfa.selectOption('#gitCuz', '2'); await sayfa.click('#gitCuzBtn'); await sayfa.waitForSelector('.ko-a[data-ayet="2:142"]');
      kontrol('git: 2. cüz → Bakara 142\'den açıldı', true);
      // ayet ekranı
      await sayfa.evaluate(() => window.__TECVID.git('sayfa', 28, '2:185')); await sayfa.waitForSelector('[data-ko-ayet="2:185"]');
      await sayfa.click('[data-ko-ayet="2:185"]'); await sayfa.click('[data-km="ayet"]'); await sayfa.waitForSelector('.ayet-ekran #aeIleri');
      const ae = () => sayfa.evaluate(() => document.querySelector('.ayet-ekran').innerText);
      let m = await ae();
      kontrol('ayet ekranı: Bakara, Ayet 185 / 286, sayfa 28, cüz 2, meal görünüyor', /Ayet: 185 \/ 286/.test(m) && /Sayfa 28/.test(m) && /Cüz 2/.test(m) && /Ramazan/.test(m), m.slice(0, 120).replace(/\n/g, ' | '));
      await sayfa.click('#aeIleri'); await sayfa.waitForFunction(() => /Ayet: 186/.test(document.querySelector('.ayet-ekran').innerText));
      await sayfa.click('#aeGeri'); await sayfa.waitForFunction(() => /Ayet: 185/.test(document.querySelector('.ayet-ekran').innerText));
      kontrol('ayet ekranı: sonraki / önceki ayet', true);
      await sayfa.click('#aeKapat');
      await sayfa.evaluate(() => window.__TECVID.git('sayfa', 49, '2:286')); await sayfa.waitForSelector('[data-ko-ayet="2:286"]');
      await sayfa.click('[data-ko-ayet="2:286"]'); await sayfa.click('[data-km="ayet"]'); await sayfa.waitForSelector('#aeIleri'); await sayfa.click('#aeIleri');
      await sayfa.waitForFunction(() => /Ayet: 1 \/ 200/.test(document.querySelector('.ayet-ekran').innerText), null, { timeout: 8000 });
      kontrol('ayet ekranı: sûre sonundan sonraki sûreye geçiyor (Bakara 286 → Âl-i İmrân 1)', true);
      await sayfa.click('#aeKapat');
      // birden çok meal: ikinci (sahte) kaynak ekle, Aa menüsünden seçim ve alt alta gösterim
      await sayfa.evaluate(() => { window.__TECVID.MEAL_KAYNAK.push({ id: 'deneme', dil: 'tr', ad: 'Deneme Meali', yol: 'tr', kaynak: 'test' }); window.__TECVID.S().ayar.mealler = ['diyanet', 'deneme']; });
      await sayfa.evaluate(() => window.__TECVID.git('sayfa', 28, '2:185')); await sayfa.waitForSelector('#koAyar');
      await sayfa.click('#koAyar');
      kontrol('meal: birden çok kaynak varsa Aa menüsünde "Mealler" seçimi çıkıyor', !!(await sayfa.$('[data-grup="mealler"] [data-ka="deneme"]')));
      await sayfa.click('[data-grup="gorunum"] [data-ka="meal"]'); await sayfa.waitForSelector('.ko-meal');
      const adet = await sayfa.evaluate(() => document.querySelectorAll('.ko-a[data-ayet="2:185"] .ko-meal').length);
      kontrol('meal: iki kaynak alt alta gösteriliyor', adet === 2, 'adet=' + adet);
      await sayfa.click('[data-ko-ayet="2:185"]'); await sayfa.click('[data-km="ayet"]'); await sayfa.waitForSelector('.ayet-ekran-meal');
      kontrol('ayet ekranı: iki meal bölümü', (await sayfa.evaluate(() => document.querySelectorAll('.ayet-ekran-meal').length)) === 2);
      await sayfa.click('#aeKapat');
      await sayfa.evaluate(() => { window.__TECVID.MEAL_KAYNAK.pop(); delete window.__TECVID.S().ayar.mealler; });
      kontrol('git ve ayet ekranı hatasız', hatalar.length === once, hatalar.slice(once).join(' | '));
    } catch (e) { kontrol('git / ayet ekranı / meal', false, e.message.split('\n')[0]); }
  }

  // Tekrarla (ezber oynatıcısı): liste, oynatma sırası (normal / basamak / oto tekrar), ezberlendi, Hepsi, gizle ve oku
  {
    const once = hatalar.length;
    try {
      const log = () => sayfa.evaluate(() => window.__TECVID.tk().log.slice());
      const bitmesiniBekle = () => sayfa.waitForFunction(() => !window.__TECVID.tk().calma, null, { timeout: 15000 });
      await sayfa.evaluate(() => { window.__TECVID_HIZLI = true; delete window.__TECVID.S().ezber; window.__TECVID.git('tekrarlaSec'); });
      await sayfa.waitForSelector('[data-tk-sure="1"]');
      kontrol('tekrarla: sûre listesi (Fâtiha, Nâs…) açılıyor', !!(await sayfa.$('[data-tk-sure="114"]')) && !!(await sayfa.$('[data-tk-sure="105"]')));
      await sayfa.click('[data-tk-sure="1"]'); await sayfa.waitForSelector('#tkBasla');
      kontrol('tekrarla: Fâtiha\'nın 7 ayeti ve bütün kontroller var', (await sayfa.evaluate(() => document.querySelectorAll('.tk-ayet').length)) === 7 && !!(await sayfa.$('#tkTekrar')) && !!(await sayfa.$('#tkBekle')) && !!(await sayfa.$('#tkBasamak')) && !!(await sayfa.$('#tkGizleOku')));
      const ayarla = (o) => sayfa.evaluate(o2 => { window.__TECVID.S().ayar.tk = Object.assign({ tekrar: 1, bekle: 0, ses: false, basamak: false, oto: false, kaydir: true, hiz: 1, latin: true, meal: false, boy: 1, gizle: 'hepsi' }, o2); }, o);
      const ac = (b2, b3) => sayfa.evaluate(([x, y]) => window.__TECVID.git('tekrarla', 1, x, y), [b2, b3]);
      // normal: her ayet 2 kez
      await ayarla({ tekrar: 2 }); await ac(1, 3); await sayfa.waitForSelector('#tkBasla'); await sayfa.click('#tkBasla'); await bitmesiniBekle();
      let l = await log(); kontrol('tekrarla: her ayet tekrar sayısı kadar (1,1,2,2,3,3)', l.join() === '1,1,2,2,3,3', l.join());
      // basamak yöntemi: 1 → 1-2 → 1-2-3, her basamak 2 kez
      await ayarla({ tekrar: 2, basamak: true }); await ac(1, 3); await sayfa.waitForSelector('#tkBasla'); await sayfa.click('#tkBasla'); await bitmesiniBekle();
      l = await log(); kontrol('tekrarla: basamak yöntemi birikimli (1,1 · 1,2,1,2 · 1,2,3,1,2,3)', l.join() === '1,1,1,2,1,2,1,2,3,1,2,3', l.join());
      // oto tekrar: bitince başa döner, durdurulana kadar sürer
      await ayarla({ tekrar: 1, oto: true }); await ac(1, 2); await sayfa.waitForSelector('#tkBasla'); await sayfa.click('#tkBasla');
      await sayfa.waitForFunction(() => window.__TECVID.tk().log.length >= 7, null, { timeout: 15000 }); await sayfa.click('#tkBasla'); await sayfa.waitForTimeout(150);
      l = await log(); kontrol('tekrarla: oto tekrar başa dönüyor, Durdur ile duruyor', l.slice(0, 5).join() === '1,2,1,2,1' && !(await sayfa.evaluate(() => window.__TECVID.tk().calma)), l.join());
      // ezberlendi kutusu
      await ac(1, 7); await sayfa.waitForSelector('#tkEzber', { state: 'attached' }); await sayfa.evaluate(() => { document.getElementById('tkAyarKutu').open = true; }); await sayfa.check('#tkEzber');
      kontrol('tekrarla: Ezberlendi işaretlenince sûre ezberde sayılıyor', await sayfa.evaluate(() => !!(window.__TECVID.S().ezber && window.__TECVID.S().ezber['1'] && window.__TECVID.S().ezber['1'].tam)));
      await sayfa.uncheck('#tkEzber');
      kontrol('tekrarla: işaret kaldırılınca geri alınıyor', await sayfa.evaluate(() => !window.__TECVID.S().ezber['1'].tam));
      // gizle ve oku: mikrofon yoksa alt çubuk geri gelir, hata olmaz
      await sayfa.click('#tkGizleOku'); await sayfa.waitForFunction(() => !document.getElementById('tkAlt').hidden, null, { timeout: 15000 });
      kontrol('tekrarla: Gizle ve oku mikrofon yokken sorunsuz geri dönüyor', true);
      // ezber sekmesi: Hepsi
      await sayfa.evaluate(() => window.__TECVID.git('ezber')); await sayfa.waitForSelector('[data-hedef="999"]'); await sayfa.click('[data-hedef="999"]');
      kontrol('ezber: günlük yeni ders için "Hepsi" seçilebiliyor', (await sayfa.evaluate(() => window.__TECVID.S().ayar.ezberHedef)) === 999);
      await sayfa.evaluate(() => { window.__TECVID.S().ayar.ezberHedef = 3; delete window.__TECVID.S().ayar.tk; delete window.__TECVID_HIZLI; });
      kontrol('tekrarla hatasız', hatalar.length === once, hatalar.slice(once).join(' | '));
    } catch (e) { kontrol('tekrarla', false, e.message.split('\n')[0]); }
  }

  // Kur'an: ayet bazlı hedef, okuma kartı ("Okudum"), istatistikler
  {
    const once = hatalar.length;
    try {
      const S_ = () => sayfa.evaluate(() => { const k = window.__TECVID.S().kuran || {}; const g = new Date().toISOString().slice(0, 10); return { ay: ((k.ay || {})[g] || []).slice(), gun: ((k.gun || {})[g] || []).slice(), son: k.son, hedef: k.ayetHedef }; });
      await sayfa.evaluate(() => { const S = window.__TECVID.S(); S.kuran = { hedef: 5, ayetHedef: 10, gorunum: 'mushaf', tema: 'acik', gun: {}, ay: {}, imler: [] }; window.__TECVID.git('sureler'); });
      await sayfa.waitForSelector('[data-git^="ayetKart"]');
      const ust = await sayfa.evaluate(() => document.querySelector('.ko-ust').innerText);
      kontrol('okuma: Kur\'an sekmesinde ayet hedefi, "Ayet ayet oku" ve İstatistik var', /0\/10 ayet/.test(ust) && /Ayet ayet oku/.test(ust) && /İstatistik/.test(ust), ust.replace(/\n/g, ' | ').slice(0, 120));
      await sayfa.click('[data-git^="ayetKart"]'); await sayfa.waitForSelector('#akOkudum');
      for (let i = 0; i < 3; i++) { await sayfa.click('#akOkudum'); await sayfa.waitForTimeout(120); }
      let d = await S_();
      kontrol('okuma kartı: 3 kez Okudum → 3 ayet sayıldı, 4. ayete geçildi', d.ay.join() === '1:1,1:2,1:3' && d.son && d.son.a === 3, JSON.stringify(d.ay));
      const yazi = await sayfa.evaluate(() => document.querySelector('.ak-ekran').innerText);
      kontrol('okuma kartı: ilerleme "Bugün 3/10 ayet", Ayet 4/7', /Bugün 3\/10 ayet/.test(yazi) && await sayfa.evaluate(() => /Ayet 4\/7/.test(document.querySelector('#app').innerText)), yazi.replace(/\n/g, ' | ').slice(0, 100));
      // Fâtiha'nın kalanı: sayfanın bütün ayetleri okununca sayfa da sayılır ve 2. sûreye geçilir
      for (let i = 0; i < 4; i++) { await sayfa.click('#akOkudum'); await sayfa.waitForTimeout(120); }
      d = await S_();
      kontrol('okuma kartı: Fâtiha bitince sayfa 1 sayıldı ve Bakara 1\'e geçildi', d.gun.includes(1) && await sayfa.evaluate(() => /Bakara · Ayet 1\//.test(document.querySelector('#app').innerText)), JSON.stringify(d.gun));
      kontrol('okuma kartı: ‹ önceki ayete döner (sayma değişmez)', await (async () => { const once_ = (await S_()).ay.length; await sayfa.click('#akGeri'); await sayfa.waitForTimeout(250); return (await sayfa.evaluate(() => /Fâtiha · Ayet 7\//.test(document.querySelector('#app').innerText))) && (await S_()).ay.length === once_; })());
      // İstatistik
      await sayfa.evaluate(() => window.__TECVID.git('kuranIstatistik')); await sayfa.waitForSelector('.ist-izgara');
      const ist = await sayfa.evaluate(() => document.querySelector('#app').innerText);
      kontrol('istatistik: Bugün sekmesinde okunan ayet 7 ve haftalık çubuklar', /7\s*\n?\s*Okunan ayet/.test(ist) && (await sayfa.evaluate(() => document.querySelectorAll('.ist-gun').length)) === 7, ist.replace(/\n/g, ' ').slice(0, 90));
      await sayfa.click('[data-ist="hafta"]'); await sayfa.waitForFunction(() => document.querySelector('[data-ist="hafta"]').classList.contains('aktif'));
      await sayfa.click('[data-ist="tumu"]'); await sayfa.waitForFunction(() => /Bir günde en çok ayet/.test(document.querySelector('#app').innerText));
      kontrol('istatistik: Hafta ve Son 60 gün sekmeleri çalışıyor', true);
      // Aa menüsünden ayet hedefi
      await sayfa.evaluate(() => window.__TECVID.git('sayfa', 1)); await sayfa.waitForSelector('#koAyar'); await sayfa.click('#koAyar');
      await sayfa.click('[data-grup="ayhedef"] [data-ka="20"]');
      kontrol('ayet hedefi: Aa menüsünden 20 seçilebiliyor', (await S_()).hedef === 20);
      kontrol('ayet hedefi, okuma kartı ve istatistik hatasız', hatalar.length === once, hatalar.slice(once).join(' | '));
    } catch (e) { kontrol('okuma kartı / istatistik', false, e.message.split('\n')[0]); }
  }

  // Ders görünümü (tek bakışta, uzatma çubuğu, konu çipleri) ve ayet ekranı (Bu ayette tecvid, paylaş)
  {
    const once = hatalar.length;
    try {
      await sayfa.evaluate(() => window.__TECVID.git('ders', 'u2')); await sayfa.waitForSelector('.tek-bakista');
      const tb = await sayfa.evaluate(() => ({ kart: document.querySelector('.tb-kart') && document.querySelector('.tb-kart').innerText, var_: [...document.querySelectorAll('.elif-bar span.var')].map(x => x.textContent).join(), yaygin: [...document.querySelectorAll('.elif-bar span.yaygin')].map(x => x.textContent).join(), defter: !!document.querySelector('.kart.sayfa.defter') }));
      kontrol('ders: "Tek bakışta" kartı kural adı ve özetle', /Med-i muttasıl/.test(tb.kart) && /AYNI kelimede hemze/.test(tb.kart), (tb.kart || '').replace(/\n/g, ' | ').slice(0, 80));
      kontrol('ders: uzatma çubuğu 2–5 elif dolu, yaygın 4', tb.var_ === '2,3,4,5' && tb.yaygin === '4', JSON.stringify(tb));
      kontrol('ders: defter görünümlü ders kartı', tb.defter);
      const cip = await sayfa.evaluate(() => [...document.querySelectorAll('.konu-cip')].map(x => x.textContent + (x.classList.contains('aktif') ? '*' : '')));
      kontrol('ders: aynı konudaki derslerin çipleri, geçerli ders işaretli', cip.length >= 6 && cip.some(x => /muttasıl\*/.test(x)), cip.join(' | '));
      await sayfa.click('[data-konu="u3"]'); await sayfa.waitForFunction(() => /munfasıl/i.test(document.querySelector('#app').innerText) && document.querySelector('.konu-cip.aktif').dataset.konu === 'u3');
      kontrol('ders: çipe dokununca o derse geçiyor', true);
      // ayet ekranı: Bu ayette tecvid
      await sayfa.evaluate(() => window.__TECVID.git('sayfa', 2, '2:3')); await sayfa.waitForSelector('[data-ko-ayet="2:3"]');
      await sayfa.click('[data-ko-ayet="2:3"]'); await sayfa.click('[data-km="ayet"]'); await sayfa.waitForSelector('.ayet-ekran #aeIleri');
      const nt = await sayfa.evaluate(() => [...document.querySelectorAll('.ae-tc')].map(x => x.innerText.trim()));
      kontrol('ayet ekranı: "Bu ayette tecvid" kural çipleri (Bakara 3)', nt.length >= 1, nt.join(' | '));
      await sayfa.click('.ae-tc'); await sayfa.waitForSelector('#aeTcBilgi:not([hidden])');
      kontrol('ayet ekranı: çipe dokununca açıklama ve "Dersi aç"', !!(await sayfa.$('#aeTcDers')));
      await sayfa.evaluate(() => { window.__paylas = null; Object.defineProperty(navigator, 'share', { value: async d => { window.__paylas = d.text; }, configurable: true }); });
      await sayfa.click('#aePaylas'); await sayfa.waitForFunction(() => window.__paylas);
      const pt = await sayfa.evaluate(() => window.__paylas);
      kontrol('ayet ekranı: Paylaş ayet, meal ve kaynağı içeriyor', /Bakara 3\. ayet/.test(pt) && /Kur'an Yolum/.test(pt) && pt.length > 60, pt.replace(/\n/g, ' ').slice(0, 80));
      await sayfa.click('#aeTcDers'); await sayfa.waitForSelector('.tek-bakista, .konu-cipleri');
      kontrol('ayet ekranı: "Dersi aç" ilgili dersi açıyor', !!(await sayfa.$('.konu-cipleri')));
      kontrol('ders ve ayet ekranı güzelleştirmesi hatasız', hatalar.length === once, hatalar.slice(once).join(' | '));
    } catch (e) { kontrol('ders / ayet ekranı güzelleştirme', false, e.message.split('\n')[0]); }
  }

  // Profil yönetimi (bulut girişi taklit edilir): düzenleme yeni profil açmamalı, silme onay istemeli ve kalıcı olmalı
  {
    const once = hatalar.length;
    try {
      const pg = await (await yerelContext(tarayici,{ viewport: { width: 390, height: 800 }, serviceWorkers: 'block' })).newPage();
      pg.on('pageerror', e => hatalar.push('pageerror: ' + e.message));
      await pg.addInitScript(() => {
        const L = () => JSON.parse(localStorage.getItem('mockcloud') || '{}'), W = o => localStorage.setItem('mockcloud', JSON.stringify(o));
        if (!localStorage.getItem('mockcloud')) W({ profiller: JSON.stringify([{ id: 'p1', ad: 'Ben', yas: 'buyuk' }, { id: 'pa', ad: 'Ayse', yas: 'cocuk' }, { id: 'pb', ad: 'Burak', yas: 'cocuk' }]) });
        const M = { kullanici: () => ({ uid: 'u', email: 'a@b' }), dinle(f) { setTimeout(() => f({ uid: 'u' }), 0); return () => { }; },
          async indir(pid) { const c = L(); return c['v:' + pid] ? JSON.parse(c['v:' + pid]) : null; }, async yukle(v, pid) { const c = L(); c['v:' + pid] = JSON.stringify(v); W(c); },
          async profilIndir() { const c = L(); return c.profiller ? { liste: JSON.parse(c.profiller) } : null; }, async profilYukle(p) { const c = L(); c.profiller = JSON.stringify(p.liste); W(c); },
          async profilSil(pid) { const c = L(); delete c['v:' + pid]; W(c); } };
        Object.defineProperty(window, 'Bulut', { get: () => M, set: () => { } });
      });
      const yerel = () => pg.evaluate(() => JSON.parse(localStorage.getItem('tecvid-ogren.profiller')).liste.map(p => p.id));
      const bulut = () => pg.evaluate(() => JSON.parse(JSON.parse(localStorage.getItem('mockcloud')).profiller).filter(p => !p.silindi).map(p => p.id));
      await pg.goto(url, { waitUntil: 'domcontentloaded' }); await pg.waitForFunction(() => window.__TECVID); await pg.waitForTimeout(1200);
      await pg.evaluate(() => window.__TECVID.git('profiller'));
      await pg.click('[data-duz="pa"]'); await pg.fill('[data-form="pa"] .fAd', 'Ayse2'); await pg.click('[data-form="pa"] [data-fy="cocuk"]'); await pg.click('[data-kaydet="pa"]');
      await pg.waitForTimeout(600);
      kontrol('profil: düzenleme yeni profil açmıyor', (await yerel()).length === 3 && (await bulut()).length === 3);
      await pg.click('[data-sil="pb"]');
      kontrol('profil: silmeden önce onay penceresi çıkıyor', !!(await pg.$('.modal-arka')));
      await pg.click('.modal-arka [data-c="1"]'); await pg.waitForTimeout(600);
      kontrol('profil: silinen profil yerelde ve bulutta gitti', !(await yerel()).includes('pb') && !(await bulut()).includes('pb'));
      await pg.reload(); await pg.waitForFunction(() => window.__TECVID); await pg.waitForTimeout(1200);
      kontrol('profil: yeniden açınca silinen profil geri gelmiyor', !(await yerel()).includes('pb') && (await yerel()).length === 2, hatalar.slice(once).join(' | '));
    } catch (e) { kontrol('profil yönetimi', false, e.message.split('\n')[0]); }
  }

  kontrol('konsolda yakalanmamış hata yok', hatalar.length === 0, hatalar.slice(0, 3).join(' | '));

  if (KAPSAM) {
    const rapor = await sayfa.coverage.stopJSCoverage();
    console.log('\nKod kapsamı (tarayıcıda çalışan satırlar/baytlar):');
    for (const r of rapor.filter(x => /\/js\/(?!firebase|ort|capacitor)[^/]+\.js$/.test(x.url))) {
      let kapli = new Uint8Array(r.source.length);
      for (const f of r.functions) for (const g of f.ranges) kapli.fill(g.count > 0 ? 1 : 0, g.startOffset, g.endOffset);
      const yuzde = Math.round(100 * kapli.reduce((a, b) => a + b, 0) / Math.max(1, r.source.length));
      console.log(`  %${String(yuzde).padStart(3)}  ${r.url.split('/js/')[1]}`);
    }
  }
  await tarayici.close(); sunucu.close();
  console.log(basarisiz ? `\n${basarisiz} kontrol başarısız` : '\nHepsi geçti');
  process.exit(basarisiz ? 1 : 0);
})();

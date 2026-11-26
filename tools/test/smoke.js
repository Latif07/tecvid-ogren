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
  ['pekistir', `[${U0}, 0]`], ['ebeveynOzet'], ['notlar'], ['ayetAra'], ['anaDuzenle'], ['ebAlistirma'], ['ebAlistirma', "['tani']"], ['ebAlistirma', "['ad']"], ['ebAlistirma', "['esles']"], ['kartlar'], ['kart', "['med']"], ['kart', "['vakf']"], ['kartYazdir'], ['elifba'],
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
      const hp = await sayfa.evaluate(() => ({ lock: document.body.classList.contains('modal-acik'), det: !!document.querySelector('.ko-hatalar details.ko-hata'), alt: (() => { const r = document.querySelector('.ko-hatalar-alt').getBoundingClientRect(); return r.bottom <= innerHeight + 1 && r.height > 0; })() }));
      kontrol('Hatalarım: ayetler aç/kapa, alt düğmeler görünür, arka sayfa kilitli', hp.lock && hp.det && hp.alt, JSON.stringify(hp));
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
      kontrol('takip: ses var ilerleme yok → "takıldım" (uzun takılmada yavaş oku uyarısı) + geç düğmesi', sonuc.takildi[0] === 'takildi' && sonuc.takildi[1] === false && /Anlayamadım/.test(sonuc.takildi[2]), JSON.stringify(sonuc.takildi));
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
      await sayfa.evaluate(() => { document.querySelector('.ko-daha').open = true; }); await sayfa.click('[data-grup="ayhedef"] [data-ka="20"]');
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

  // Kur'an sayfa gezinmesi: sayma olmadan geçiş, Okudum, her yere Git, Bu ayeti okudum, Sadece meal, otomatik kaydırma, sayfadan Tekrarla, sondan başa
  {
    const once = hatalar.length;
    try {
      const gun = () => sayfa.evaluate(() => { const k = window.__TECVID.S().kuran || {}, g = new Date().toISOString().slice(0, 10); return { sf: ((k.gun || {})[g] || []).slice(), ay: ((k.ay || {})[g] || []).slice() }; });
      const baslik = () => sayfa.evaluate(() => document.querySelector('#app').innerText.slice(0, 160));
      await sayfa.evaluate(() => { window.__TECVID.S().kuran = { hedef: 5, ayetHedef: 10, gorunum: 'mushaf', tema: 'acik', gun: {}, ay: {}, imler: [] }; delete window.__TECVID.S().ayar.otoKaydir; window.__TECVID.git('sayfa', 5); });
      await sayfa.waitForFunction(() => /Sayfa 5/.test(document.querySelector('#app').innerText)); await sayfa.waitForSelector('#koIleri'); await sayfa.waitForTimeout(300);   // let the page finish rendering before clicking
      await sayfa.click('#koIleri'); await sayfa.waitForFunction(() => /Sayfa 6/.test(document.querySelector('#app').innerText));
      let d = await gun();
      kontrol('sayfa: › sonraki sayfaya geçer ama okundu saymaz', d.sf.length === 0 && d.ay.length === 0, JSON.stringify(d));
      await sayfa.click('#koOkudum'); await sayfa.waitForFunction(() => /Sayfa 7/.test(document.querySelector('#app').innerText));
      d = await gun();
      kontrol('sayfa: ✓ Okudum 6. sayfayı sayar ve 7. sayfaya geçer', d.sf.join() === '6' && d.ay.length > 5, JSON.stringify({ sf: d.sf, ay: d.ay.length }));
      // her yere git
      await sayfa.click('#koGitBtn'); await sayfa.waitForFunction(() => document.querySelectorAll('#gpSure option').length > 100);
      await sayfa.selectOption('#gpSure', '2'); await sayfa.fill('#gpAyet', '185'); await sayfa.click('#gpAyetBtn');
      await sayfa.waitForSelector('.ko-a[data-ayet="2:185"]');
      kontrol('sayfa: 📍 ile Bakara 185\'e gidiliyor (sayfa 28)', /Sayfa 28/.test(await baslik()) && !(await sayfa.$('.git-arka')));
      await sayfa.click('#koGitBtn'); await sayfa.waitForSelector('#gpSayfa'); await sayfa.fill('#gpSayfa', '300'); await sayfa.click('#gpSayfaBtn'); await sayfa.waitForFunction(() => /Sayfa 300/.test(document.querySelector('#app').innerText));
      kontrol('sayfa: 📍 ile sayfa 300\'e gidiliyor', true);
      // bu ayeti okudum
      await sayfa.evaluate(() => window.__TECVID.git('sayfa', 28, '2:185')); await sayfa.waitForSelector('[data-ko-ayet="2:185"]');
      await sayfa.click('[data-ko-ayet="2:185"]'); await sayfa.click('[data-km="okudum"]');
      d = await gun();
      kontrol('ayet menüsü: "Bu ayeti okudum" ayeti sayıyor (sayfa saymıyor)', d.ay.includes('2:185') && !d.sf.includes(28), JSON.stringify({ ay: d.ay.slice(-3), sf: d.sf }));
      // sadece meal
      await sayfa.evaluate(() => { window.__TECVID.S().kuran.gorunum = 'sadecemeal'; window.__TECVID.git('sayfa', 28, '2:185'); });
      await sayfa.waitForSelector('.ko-sadece');
      const sm = await sayfa.evaluate(() => ({ arapca: document.querySelectorAll('.ko-a .kelime').length, meal: document.querySelectorAll('.ko-sadece').length, metin: document.querySelector('.ko-sadece').innerText.slice(0, 60) }));
      kontrol('görünüm: "Sadece meal" Arapça kelime göstermiyor, meali ayet numarasıyla gösteriyor', sm.arapca === 0 && sm.meal > 3, JSON.stringify(sm));
      await sayfa.click('#koTakip'); await sayfa.waitForFunction(() => /Arapça metin görünür/.test(document.body.innerText));
      kontrol('görünüm: Sadece meal\'de "Sen oku" uyarı veriyor', true);
      // otomatik kaydırma
      await sayfa.evaluate(() => { window.__TECVID.S().kuran.gorunum = 'meal'; window.__TECVID.S().ayar.otoKaydir = 3; window.__TECVID.git('sayfa', 28); });
      await sayfa.waitForSelector('#koOto'); await sayfa.waitForTimeout(900);   // sayfa açılırken kaldığın ayete kayar; bitsin
      await sayfa.evaluate(() => window.scrollTo(0, 0)); await sayfa.waitForTimeout(100);
      await sayfa.click('#koOto'); await sayfa.waitForTimeout(1000);
      const y1 = await sayfa.evaluate(() => scrollY); await sayfa.click('#koOto'); const y2 = await sayfa.evaluate(() => scrollY); await sayfa.waitForTimeout(400);
      const y3 = await sayfa.evaluate(() => scrollY);
      kontrol('otomatik kaydırma: ▶ Kaydır yavaşça iniyor (hızlı ≈ 90 px/sn), ⏸ ile duruyor', y1 > 40 && y1 < 300 && y3 === y2, `y1=${y1} y2=${y2} y3=${y3}`);
      // sayfadan tekrarla
      await sayfa.evaluate(() => { window.__TECVID.S().kuran.gorunum = 'mushaf'; delete window.__TECVID.S().ayar.otoKaydir; window.__TECVID.git('sayfa', 28); });
      await sayfa.waitForSelector('#koAyar'); await sayfa.click('#koAyar'); await sayfa.click('#koTekrarSayfa'); await sayfa.waitForSelector('#tkBasla');
      const ak = await sayfa.evaluate(() => ({ bas: document.getElementById('tkBas').value, bit: document.getElementById('tkBit').value, adi: document.querySelector('.ust h1') && document.querySelector('.ust h1').innerText }));
      kontrol('sayfa menüsü: "Bu sayfayı tekrarla" Tekrarla\'yı sayfanın ayet aralığıyla açıyor', +ak.bas >= 1 && +ak.bit > +ak.bas && /Bakara/.test(ak.adi), JSON.stringify(ak));
      // sondan başa
      const ayarla = o => sayfa.evaluate(o2 => { window.__TECVID.S().ayar.tk = Object.assign({ tekrar: 1, bekle: 0, ses: false, basamak: false, yon: 'ileri', oto: false, kaydir: true, hiz: 1, latin: true, meal: false, boy: 1, gizle: 'hepsi' }, o2); window.__TECVID_HIZLI = true; }, o);
      const bit_ = () => sayfa.waitForFunction(() => !window.__TECVID.tk().calma, null, { timeout: 15000 });
      await ayarla({ tekrar: 2, yon: 'geri' }); await sayfa.evaluate(() => window.__TECVID.git('tekrarla', 1, 1, 3)); await sayfa.waitForSelector('#tkBasla'); await sayfa.click('#tkBasla'); await bit_();
      let l = await sayfa.evaluate(() => window.__TECVID.tk().log.join());
      kontrol('tekrarla: Sondan başa (3,3,2,2,1,1)', l === '3,3,2,2,1,1', l);
      await ayarla({ tekrar: 2, yon: 'geri', basamak: true }); await sayfa.evaluate(() => window.__TECVID.git('tekrarla', 1, 1, 3)); await sayfa.waitForSelector('#tkBasla'); await sayfa.click('#tkBasla'); await bit_();
      l = await sayfa.evaluate(() => window.__TECVID.tk().log.join());
      kontrol('tekrarla: Sondan başa + basamak (3 · 2,3 · 1,2,3, her biri 2 kez)', l === '3,3,2,3,2,3,1,2,3,1,2,3', l);
      await sayfa.evaluate(() => { delete window.__TECVID.S().ayar.tk; delete window.__TECVID_HIZLI; });
      kontrol('sayfa gezinmesi ve hızlı Kur\'an paketi hatasız', hatalar.length === once, hatalar.slice(once).join(' | '));
    } catch (e) { kontrol('sayfa gezinmesi / hızlı paket', false, e.message.split('\n')[0] + ' @' + ((e.stack.match(/smoke\.js:(\d+)/) || [])[1])); }
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


  // Durak ışıkları, hap bilgi kartları (kontrol modu), Elif-Ba odak modu
  {
    const once = hatalar.length;
    try {
      // durak ışıkları: Bakara sayfası (işaretli) açılır, işaretler renkli
      await sayfa.evaluate(() => { const S = window.__TECVID.S(); delete S.ayar.durakIsik; window.__TECVID.git('sayfa', 2); });
      await sayfa.waitForSelector('.ko-a');
      const dm = await sayfa.evaluate(() => ({ n: document.querySelectorAll('.dm').length, sinif: [...new Set([...document.querySelectorAll('.dm')].map(x => x.className))].slice(0, 6) }));
      kontrol('durak ışıkları: sayfada işaretler renkli sarılıyor', dm.n > 0, JSON.stringify(dm));
      await sayfa.evaluate(() => { window.__TECVID.S().ayar.durakIsik = false; window.__TECVID.git('sayfa', 2); });
      await sayfa.waitForSelector('.ko-a');
      kontrol('durak ışıkları: Kapalı yapılınca renklenmiyor', (await sayfa.evaluate(() => document.querySelectorAll('.dm').length)) === 0);
      await sayfa.evaluate(() => { delete window.__TECVID.S().ayar.durakIsik; });
      // kartlar
      await sayfa.evaluate(() => window.__TECVID.git('kartlar'));
      await sayfa.waitForSelector('.kart-kutu');
      const say = await sayfa.evaluate(() => document.querySelectorAll('.kart-kutu').length);
      kontrol('kartlar: 9 kart listeleniyor', say === 9, String(say));
      await sayfa.evaluate(() => { window.__TECVID.git('kart', 'nun'); });
      await sayfa.waitForSelector('#kkKart');
      const nun = await sayfa.evaluate(() => document.querySelector('#kkKart').innerText);
      kontrol('kart: nûn kartında izhâr/iklâb/ihfâ satırları ve harfler var', /İzhâr|İzhar/i.test(nun) && /Ikl|İkl/i.test(nun) && nun.includes('ء ه ع ح غ خ'), nun.slice(0, 160));
      await sayfa.click('#kkKontrol');
      const gz = await sayfa.evaluate(() => document.querySelectorAll('.kk-gizli').length);
      kontrol('kart: kontrol modu cevapları gizliyor', gz > 3, String(gz));
      await sayfa.click('.kk-gizli');
      kontrol('kart: dokununca bir cevap açılıyor', (await sayfa.evaluate(() => document.querySelectorAll('.kk-gizli').length)) === gz - 1);
      await sayfa.click('#kkHepsi');
      kontrol('kart: Hepsini göster hepsini açıyor', (await sayfa.evaluate(() => document.querySelectorAll('.kk-gizli').length)) === 0);
      await sayfa.evaluate(() => { window.__TECVID.git('kart', 'vakf'); });
      await sayfa.waitForSelector('.kk-isik');
      const vk = await sayfa.evaluate(() => ({ tablo: document.querySelectorAll('.kk-isik').length, nokta: document.querySelectorAll('.kk-isik .dm-nokta').length }));
      kontrol('vakf kartı: Medine ve Türk tabloları, renkli noktalar', vk.tablo === 2 && vk.nokta >= 10, JSON.stringify(vk));
      // ders son sayfasında "Bu konunun kartı"
      await sayfa.evaluate(() => { const u = window.TC.U.find(x => x.id === 'u7'); window.__TECVID.S().ilerleme.u7 = window.__TECVID.S().ilerleme.u7 || {}; const D = window.__TECVID; D.git('ders', 'u7'); });
      await sayfa.waitForSelector('[data-sayfa]', { state: 'attached' });
      for (let g = 0; g < 30 && !(await sayfa.$('[data-git="kart|nun"]')); g++) { const b = await sayfa.$('[data-sayfa]:not([disabled]):last-of-type'); if (!b) break; await b.click(); }
      kontrol('ders son sayfası: "Bu konunun kartı" düğmesi var', !!(await sayfa.$('[data-git="kart|nun"]')));
      // Tecvid sekmesi: "İleri konular" paneli derse girip geri dönünce açık kalır; Elif-Ba ve kart girişleri her zaman görünür
      await sayfa.evaluate(() => { window.__TECVID.git('tecvid'); });
      await sayfa.waitForSelector('details.bolum-grup');
      kontrol('Tecvid sekmesi: Elif-Ba girişi ve Hap kartlar kısayolu görünüyor (tekrarsız)', (await sayfa.$$('.eb-giris')).length === 1 && !!(await sayfa.$('.tecvid-kutu[data-git="kartlar"]')));
      await sayfa.evaluate(() => { document.querySelector('details.bolum-grup[data-grup-ad="İleri konular"]').open = true; });
      await sayfa.waitForTimeout(100);
      await sayfa.click('details.bolum-grup[data-grup-ad="İleri konular"] .bolum');
      await sayfa.waitForSelector('.geri'); await sayfa.click('.geri');
      await sayfa.waitForSelector('details.bolum-grup');
      kontrol('Tecvid sekmesi: derse girip geri dönünce "İleri konular" açık kalıyor', await sayfa.evaluate(() => document.querySelector('details.bolum-grup[data-grup-ad="İleri konular"]').open));
      // Ezber: istenen ayetten başla + ezberde meal
      await sayfa.evaluate(() => { const S = window.__TECVID.S(); S.ezber = {}; delete S.ayar.ezMeal; window.__TECVID.git('ezberCalis', 2, 'yeni'); });
      await sayfa.waitForSelector('#ezNereden');
      await sayfa.click('#ezNereden');
      await sayfa.fill('#ezNereNo', '5'); await sayfa.click('#ezNereGit');
      await sayfa.waitForFunction(() => /·\s*5/.test(document.querySelector('.ust').innerText) && document.querySelector('#ayet-5'));
      kontrol('ezber: Ayet seç ile istenen ayetten (5) başlıyor', await sayfa.evaluate(() => !document.querySelector('#ayet-1') && !!document.querySelector('#ayet-5')));
      await sayfa.click('#ezMeal');
      await sayfa.waitForSelector('.ez-meal', { timeout: 8000 });
      kontrol('ezber: Meal açılınca ayetlerin altında meal görünüyor', (await sayfa.$$('.ez-meal')).length >= 1);
      const ho = await sayfa.evaluate(() => { const b = document.querySelector('#ayet-5 .ayet-no-ses'); return { ses: !!b && b.dataset.ezOynat === '5', sonraki: !!document.querySelector('#ezSonraki') && !document.querySelector('#ezSonraki').disabled, onceki: !!document.querySelector('#ezOnceki') && !document.querySelector('#ezOnceki').disabled }; });
      const ids = () => sayfa.evaluate(() => [...document.querySelectorAll('.ez-kart .ez-ayet')].map(e => +e.id.replace('ayet-', '')).filter(Boolean));
      const ezIds0 = await ids(); await sayfa.click('#ezSonraki'); await sayfa.waitForFunction(m => { const l = [...document.querySelectorAll('.ez-kart .ez-ayet')].map(e => +e.id.replace('ayet-', '')); return l.length && Math.min(...l) > m; }, Math.max(...ezIds0));
      const ezIds1 = await ids(); await sayfa.click('#ezOnceki'); await sayfa.waitForFunction(m => { const l = [...document.querySelectorAll('.ez-kart .ez-ayet')].map(e => +e.id.replace('ayet-', '')); return l.length && Math.max(...l) < m; }, Math.min(...ezIds1));
      kontrol('ezber: ayet numarasına dokununca tüm ayet çalar; ‹ › ile ayetler arası hızlı geçiş', ho.ses && ho.sonraki && ho.onceki, JSON.stringify(ho));
      // Listening step: tapping a verse number repeats that ayah N times, then continues with the next ones
      await sayfa.evaluate(() => { window.__TECVID.S().ayar.ezTekrar = 2; window.__ezCal = []; window.__AudioEz = window.Audio; window.Audio = function (src) { this.src = src; this.play = () => { window.__ezCal.push((/(\d+)\.mp3|_(\d+)\.mp3/.exec(src) || []).slice(1).join('')); setTimeout(() => this.onended && this.onended(), 5); return Promise.resolve(); }; this.pause = () => { }; }; window.__TECVID.S().ezber = {}; window.__TECVID.git('ezberCalis', 112, 'yeni', 1); });
      await sayfa.waitForSelector('#ayet-1 .ayet-no-ses'); await sayfa.click('#ayet-1 .ayet-no-ses');
      await sayfa.waitForFunction(() => window.__ezCal.length >= 4, null, { timeout: 8000 });
      const ezc = await sayfa.evaluate(() => { const l = window.__ezCal.slice(0, 4), b = document.querySelector('#ezDinle'); if (b.classList.contains('caliyor')) b.click(); window.Audio = window.__AudioEz; delete window.__TECVID.S().ayar.ezTekrar; return l; });
      kontrol('ezber: ayet numarasına dokununca o ayet seçilen sayıda tekrarlanıp sıradaki ayete geçiyor', ezc[0] === ezc[1] && ezc[2] !== ezc[0] && ezc[2] === ezc[3], JSON.stringify(ezc));
      await sayfa.evaluate(() => { window.__TECVID.S().ezber = {}; window.__TECVID.git('ezberCalis', 112, 'yeni', 3); }); await sayfa.waitForSelector('#ayet-3');
      await sayfa.evaluate(() => { window.__TECVID.git('ana'); window.__TECVID.git('ezberCalis', 112, 'yeni'); }); await sayfa.waitForSelector('.ez-kart .ez-ayet');
      kontrol('ezber: sûre yeniden açılınca en son çalışılan ayetten (3) devam ediyor', await sayfa.evaluate(() => !!document.querySelector('#ayet-3') && !document.querySelector('#ayet-1')));
      await sayfa.evaluate(() => { window.__TECVID.S().ezber = {}; });
      await sayfa.evaluate(() => { delete window.__TECVID.S().ayar.ezMeal; window.__TECVID.S().ezber = {}; });
      // Takip: yumuşak eşleme (bozuk telaffuzlu kelime yine bulunur, alakasız ses bulunmaz)
      const ye = await sayfa.evaluate(() => { const Y = window.__TECVID.yakinEsle; return [Y('xxbismilaxx', 'bismila'), Y('bizmilla', 'bismila'), Y('alhamdulillah', 'bismila'), Y('ab', 'bismila')].map(r => r.ok); });
      kontrol('takip: yumuşak eşleme — tam ve bozuk telaffuz evet, alakasız hayır', JSON.stringify(ye) === '[true,true,false,false]', JSON.stringify(ye));
      // Müezzinlik: kaydı olmayan metinde yapay sesle dinleme (Selâ)
      await sayfa.evaluate(() => {
        window.__tts = [];
        const ss = window.speechSynthesis;
        ss.getVoices = () => [];
        ss.speak = u => { window.__tts.push(u.lang + '|' + u.text.slice(0, 12)); setTimeout(() => u.onend && u.onend(), 20); };
        ss.cancel = () => { };
        window.__TECVID.git('muezzinMetin', 'sela');
      });
      await sayfa.waitForSelector('#mzTtsHepsi');
      const satSay = await sayfa.evaluate(() => document.querySelectorAll('.mz-kart').length);
      await sayfa.click('#mzTtsHepsi');
      await sayfa.waitForFunction(n => window.__tts.length >= n, satSay, { timeout: 8000 });
      const tt = await sayfa.evaluate(() => window.__tts.slice());
      kontrol('müezzinlik: Tamamını dinle (yapay ses) her satırı Arapça sesle okutuyor', tt.length === satSay && tt.every(z => z.startsWith('ar-SA|')), JSON.stringify(tt.slice(0, 2)));
      await sayfa.evaluate(() => { window.__tts.length = 0; });
      await sayfa.click('[data-mztts="0"]');
      await sayfa.waitForFunction(() => window.__tts.length === 1);
      kontrol('müezzinlik: satır düğmesi yalnız o satırı okutuyor', true);
      // Kartları yazdır: sayfaya sığıyor (tek sütun, taşma yok)
      await sayfa.evaluate(() => window.__TECVID.git('kartYazdir'));
      await sayfa.waitForSelector('.kk-kart');
      await sayfa.emulateMedia({ media: 'print' });
      const yz = await sayfa.evaluate(() => { const W = document.documentElement.clientWidth; const k = [...document.querySelectorAll('.kk-kart')]; return { n: k.length, tasan: k.filter(x => x.getBoundingClientRect().right > W + 1 || x.scrollWidth > x.clientWidth + 1).length, grid: getComputedStyle(document.querySelector('.kk-izgara')).display, ust: getComputedStyle(document.querySelector('.ust')).display }; });
      await sayfa.emulateMedia({ media: 'screen' });
      kontrol('kartlar: yazdırma görünümü sayfaya sığıyor (taşma yok, tek sütun, üst çubuk gizli)', yz.n === 9 && yz.tasan === 0 && yz.grid === 'block' && yz.ust === 'none', JSON.stringify(yz));
      // Elif-Ba: harfe dokununca harfin adı söylenir (Kur'an kelimesi değil)
      await sayfa.evaluate(() => { window.__tts.length = 0; window.__TECVID.S().okunan = window.__TECVID.S().okunan || {}; window.__TECVID.S().okunan.e1 = 7; (window.__TECVID.git)('ders', 'e1'); const D = window.__TECVID; });
      await sayfa.evaluate(() => { const E = window.__TECVID; });
      for (let g = 0; g < 8 && !(await sayfa.$('.harf-tablo')); g++) { const b = await sayfa.$('[data-sayfa]:not([disabled]):last-of-type'); if (!b) break; await b.click(); }
      await sayfa.waitForSelector('.harf-tablo .ar-ses', { state: 'attached' });
      await sayfa.evaluate(() => { window.__tts.length = 0; document.querySelector('.harf-tablo .ar-ses').click(); });
      await sayfa.waitForFunction(() => window.__tts.length >= 1);
      const ha = await sayfa.evaluate(() => window.__tts[0]);
      kontrol('Elif-Ba: harfe dokununca harfin adı okunuyor (Elif), Kur\'an kelimesi (İyyâke) değil', /\|Elif/.test(ha), ha);
      // Çocuk modu sesi: â/î/û düzeltmesi, "Selâmün aleyküm" doğal okunur
      const ok_ = await sayfa.evaluate(() => [window.Sesli.okunus('Selâmün aleyküm! Bârekallah, Fâtiha'), window.Sesli.okunus('Ayn ve Ğayn')]);
      kontrol('çocuk sesi: okunuş düzeltmesi (â→a, Selamün aleyküm)', ok_[0] === 'Selamün aleyküm! Barekallah, Fatiha' && ok_[1] === 'Ayın ve Gayın', JSON.stringify(ok_));
      // Takip: kademeli tolerans (takılma uzadıkça artar) ve büyüyen "geç" düğmesi
      const tol = await sayfa.evaluate(() => { const f = window.__TECVID.canliTolerans; return [f(20, 0, false), f(20, 4000, true), f(20, 6000, true), f(20, 9000, true), f(20, 9000, false)].map(x => +x.toFixed(1)); });
      kontrol('takip: tolerans takılma süresiyle artıyor, sessizken artmıyor', JSON.stringify(tol) === '[7,8.4,10,12,7]', JSON.stringify(tol));
      // Ezber: ileri ayetten başlanınca atlanan ayetler zayıf listeye girer ve bitişte uyarılır
      await sayfa.evaluate(() => { const S = window.__TECVID.S(); S.ezber = { 2: { a: 2, tam: false, eklendi: Date.now(), son: 0, kutu: 0, vade: 0 } }; window.__TECVID.git('ezberCalis', 2, 'yeni', 5); });
      await sayfa.waitForSelector('#ayet-5');
      for (let g = 0; g < 12 && !(await sayfa.$('.ez-bitti')); g++) { const b = await sayfa.$('#ezAtla, #ezIleriAlt'); if (!b) break; await b.click(); await sayfa.waitForTimeout(80); }
      await sayfa.waitForSelector('.ez-bitti');
      const atl = await sayfa.evaluate(() => ({ metin: document.querySelector('.ez-bitti').innerText, zayif: (window.__TECVID.S().ezber[2] || {}).zayif, a: (window.__TECVID.S().ezber[2] || {}).a, btn: !!document.querySelector('#ezAtlananCalis') }));
      kontrol('ezber: atlanan ayetler (3–4) zayıf listeye girip uyarılıyor', atl.btn && /3–4/.test(atl.metin) && JSON.stringify(atl.zayif) === '[3,4]', JSON.stringify(atl));
      await sayfa.evaluate(() => { window.__TECVID.S().ezber = {}; });
      // Notlar: ayet notu, ders notu, Notlarım (yer imleriyle birleşik), oraya git, düzenle, sil
      await sayfa.evaluate(() => { const S = window.__TECVID.S(); S.notlar = []; S.kuran = { hedef: 5, ayetHedef: 10, gorunum: 'mushaf', tema: 'acik', gun: {}, ay: {}, imler: [{ n: 1, a: 2, renk: 'kirmizi', t: Date.now() }] }; window.__TECVID.git('sayfa', 28); });
      await sayfa.waitForSelector('[data-ko-ayet="2:185"]');
      await sayfa.click('[data-ko-ayet="2:185"]');
      await sayfa.click('[data-km="not"]');
      await sayfa.fill('#notMetin', 'Ramazan ayeti, tekrar bak');
      await sayfa.click('#notKaydet');
      await sayfa.waitForSelector('.ko-no.ko-not');
      kontrol('not: ayet notu kaydoluyor, ayet numarasında 📝 işareti çıkıyor', await sayfa.evaluate(() => window.__TECVID.S().notlar.length === 1 && window.__TECVID.S().notlar[0].y === '2:185' && document.querySelector('.ko-no.ko-not').dataset.koAyet === '2:185'));
      await sayfa.evaluate(() => window.__TECVID.git('ders', 'e1'));
      await sayfa.waitForSelector('#dersNot');
      await sayfa.click('#dersNot'); await sayfa.fill('#notMetin', 'Harfler: ب ت ث karıştırıyorum'); await sayfa.click('#notKaydet');
      await sayfa.evaluate(() => window.__TECVID.git('notlar'));
      await sayfa.waitForSelector('.not-oge');
      const nl = await sayfa.evaluate(() => ({ not: document.querySelectorAll('.not-oge').length, im: document.querySelectorAll('.ko-im').length, metin: document.querySelector('#app').innerText }));
      kontrol('Notlarım: notlar ve yer imleri birlikte listeleniyor', nl.not === 2 && nl.im === 1 && /Ramazan ayeti/.test(nl.metin) && /Harfler/.test(nl.metin), JSON.stringify({ not: nl.not, im: nl.im }));
      await sayfa.click('[data-not-suz="ders"]');
      kontrol('Notlarım: Ders notları filtresi yalnız ders notunu gösteriyor', (await sayfa.$$('.not-oge')).length === 1);
      await sayfa.fill('#notAra', 'ramazan');
      await sayfa.click('[data-not-suz="notlar"]');
      kontrol('Notlarım: arama notun metninde buluyor', (await sayfa.$$('.not-oge')).length === 1 && /Ramazan/.test(await sayfa.evaluate(() => document.querySelector('.not-oge').innerText)));
      await sayfa.click('.not-git');
      await sayfa.waitForSelector('.ko-sayfa, .ko-a');
      kontrol('Notlarım: nota dokununca ilgili Kur\'an sayfasına gidiyor (Bakara 185, sayfa 28)', /Sayfa 28/.test(await sayfa.evaluate(() => document.querySelector('#app').innerText)));
      await sayfa.evaluate(() => window.__TECVID.git('notlar'));
      await sayfa.waitForSelector('#notAra'); await sayfa.fill('#notAra', ''); await sayfa.click('[data-not-suz="hepsi"]');
      await sayfa.waitForSelector('[data-not-duzenle]'); await sayfa.click('[data-not-duzenle]');
      await sayfa.fill('#notMetin', 'Düzeltildi'); await sayfa.click('#notKaydet');
      kontrol('not: düzenleme kaydoluyor, yeni not açmıyor', await sayfa.evaluate(() => window.__TECVID.S().notlar.length === 2 && window.__TECVID.S().notlar.some(x => x.m === 'Düzeltildi')));
      await sayfa.click('[data-not-duzenle]'); await sayfa.click('#notSil');
      kontrol('not: silinen not listeden kalkıyor', (await sayfa.$$('.not-oge')).length === 1);
      await sayfa.evaluate(() => { window.__TECVID.S().notlar = []; });
      // Tekrarla: sessiz tekrar payı ve "tekrarlar bitince" ayarları kaydolur
      await sayfa.evaluate(() => { delete window.__TECVID.S().ayar.tk; window.__TECVID.git('tekrarla', 112, 1, 4); });
      await sayfa.waitForSelector('[data-tk-pay]', { state: 'attached' });
      await sayfa.evaluate(() => { document.querySelector('#tkAyarKutu').open = true; });
      await sayfa.click('[data-tk-pay="2"]'); await sayfa.click('[data-tk-bitince="1"]');
      const tkp = await sayfa.evaluate(() => { const a = window.__TECVID.S().ayar.tk || {}; return { pay: a.pay, oto: a.oto, chk: document.querySelector('#tkOto').checked }; });
      kontrol('tekrarla: sessiz tekrar payı ×2 ve "başa dönsün" ayarları kaydoluyor', tkp.pay === 2 && tkp.oto === true && tkp.chk === true, JSON.stringify(tkp));
      await sayfa.evaluate(() => { delete window.__TECVID.S().ayar.tk; });
      // Sayfa temaları: 7 tema, seçilince sayfaya uygulanır
      await sayfa.evaluate(() => { window.__TECVID.S().kuran.tema = 'acik'; window.__TECVID.git('sayfa', 3); });
      await sayfa.waitForSelector('#okuEkran'); await sayfa.click('#koAyar');
      const tm = await sayfa.evaluate(() => { const b = [...document.querySelectorAll('[data-grup="tema"] [data-ka]')]; return b.map(x => x.dataset.ka); });
      kontrol('temalar: menüde 7 sayfa teması listeleniyor', JSON.stringify(tm) === '["acik","yumusak","sepya","gece","galaksi","gunbatimi","amber"]', JSON.stringify(tm));
      await sayfa.evaluate(() => { document.querySelector('[data-grup="tema"] [data-ka="galaksi"]').click(); });
      await sayfa.waitForSelector('#okuEkran.tema-galaksi');
      const renk = await sayfa.evaluate(() => getComputedStyle(document.querySelector('#okuEkran')).getPropertyValue('--ko-kagit').trim());
      kontrol('temalar: Galaksi seçilince sayfa o temaya geçiyor (--ko-kagit)', renk === '#1e2236', renk);
      await sayfa.evaluate(() => { window.__TECVID.S().kuran.tema = 'acik'; });
      // Mini oynatıcı: Dinle ile açılır; sonraki/önceki ayet, duraklat, hız, büyüt, kapat
      await sayfa.evaluate(() => {
        window.__au = []; window.__AudioAsil = window.__AudioAsil || window.Audio;
        window.Audio = function (src) { this.src = src; this.duration = 6; this.currentTime = 1; this.playbackRate = 1; this.paused = false; this.play = () => Promise.resolve(); this.pause = () => { this.paused = true; }; window.__au.push(this); };
        window.__TECVID.S().kuran.tema = 'acik'; delete window.__TECVID.S().ayar.hiz; window.__TECVID.git('sayfa', 28);
      });
      await sayfa.waitForSelector('#koDinle'); await sayfa.click('#koDinle');
      await sayfa.waitForSelector('#koMini');
      const yer0 = await sayfa.evaluate(() => document.querySelector('#koMiniYer').textContent);
      await sayfa.click('#koMiniIleri');
      const yer1 = await sayfa.evaluate(() => document.querySelector('#koMiniYer').textContent);
      kontrol('mini oynatıcı: sonraki ayet düğmesi ayeti değiştiriyor', yer0 !== yer1 && /Bakara/.test(yer1), yer0 + ' → ' + yer1);
      await sayfa.click('#koMiniGeri');
      kontrol('mini oynatıcı: önceki ayet düğmesi geri dönüyor', (await sayfa.evaluate(() => document.querySelector('#koMiniYer').textContent)) === yer0);
      await sayfa.click('#koMiniArti');
      const hz = await sayfa.evaluate(() => ({ yazi: document.querySelector('#koMiniHiz').textContent, au: window.__au[window.__au.length - 1].playbackRate, kayit: window.__TECVID.S().ayar.hiz }));
      kontrol('mini oynatıcı: hız + düğmesi 1.25× yapıyor ve sesi etkiliyor', hz.yazi === '1.25×' && hz.au === 1.25 && hz.kayit === 1.25, JSON.stringify(hz));
      await sayfa.click('#koMiniOyna');
      kontrol('mini oynatıcı: duraklat sesi durduruyor', await sayfa.evaluate(() => window.__au[window.__au.length - 1].paused === true && document.querySelector('#koMiniOyna').textContent === '▶'));
      await sayfa.click('#koMiniTam');
      const tam = await sayfa.evaluate(() => ({ cls: document.querySelector('#koMini').classList.contains('tam'), ar: document.querySelector('#koMiniAr').textContent.length > 5, pos: getComputedStyle(document.querySelector('#koMini')).top }));
      kontrol('mini oynatıcı: büyütünce tam ekran, Arapça ayet görünüyor', tam.cls && tam.ar && tam.pos === '0px', JSON.stringify(tam));
      await sayfa.click('#koMiniKucult'); await sayfa.click('#koMiniKapat');
      kontrol('mini oynatıcı: kapatınca çubuk kalkıyor, Dinle düğmesi sıfırlanıyor', await sayfa.evaluate(() => !document.querySelector('#koMini') && /Dinle/.test(document.querySelector('#koDinle').textContent)));
      await sayfa.evaluate(() => { window.Audio = window.__AudioAsil; delete window.__TECVID.S().ayar.hiz; });
      // Kaynak gelince etkinleşen görünümler: kelime meali ve mushaf resmi (sahte kaynakla); kaynak yokken menüde görünmez
      await sayfa.evaluate(() => { window.__TECVID.S().kuran.gorunum = 'mushaf'; window.__TECVID.git('sayfa', 1); });
      await sayfa.waitForSelector('#koAyar'); await sayfa.click('#koAyar');
      kontrol('kelime meali / mushaf resmi: kaynak yokken menüde görünmüyor', await sayfa.evaluate(() => !document.querySelector('.gor-kart [class*="gor-kelime"]') && !document.querySelector('.gor-kart .gor-resim')));
      await sayfa.route('**/kuran/kelime-meal/test/001.json', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify([['Allah’ın', 'adıyla', 'Rahman', 'Rahim'], ['Hamd', 'Allah’a']]) }));
      await sayfa.evaluate(() => { window.__TECVID.KELIME_MEAL_KAYNAK.push({ id: 'test', ad: 'Test', kaynak: 'deneme', yol: 'test' }); window.__TECVID.MUSHAF_RESIM.v = { ad: 'Test', kaynak: 'deneme', url: p => 'icons/icon-192.png' }; window.__TECVID.S().kuran.gorunum = 'kelime'; window.__TECVID.git('sayfa', 1); });
      await sayfa.waitForSelector('.kelime-an');
      const km = await sayfa.evaluate(() => ({ an: document.querySelectorAll('.kelime-an').length, ilk: document.querySelector('.kelime-an').textContent }));
      kontrol('kelime meali: her kelimenin altında anlam görünüyor', km.an >= 4 && km.ilk === 'Allah’ın', JSON.stringify(km));
      await sayfa.evaluate(() => { window.__TECVID.S().kuran.gorunum = 'kelimemeal'; window.__TECVID.git('sayfa', 1); });
      await sayfa.waitForSelector('.kelime-an'); await sayfa.waitForSelector('.ko-meal');
      kontrol('kelime + meal: kelime anlamı ve ayet meali birlikte', await sayfa.evaluate(() => document.querySelectorAll('.kelime-an').length >= 4 && document.querySelectorAll('.ko-meal').length >= 1));
      await sayfa.evaluate(() => { window.__TECVID.S().kuran.gorunum = 'resim'; window.__TECVID.git('sayfa', 1); });
      await sayfa.waitForSelector('.ko-resim');
      kontrol('mushaf resmi: sayfa resmi gösteriliyor', await sayfa.evaluate(() => /icon-192/.test(document.querySelector('.ko-resim').getAttribute('src'))));
      await sayfa.evaluate(() => { window.__TECVID.KELIME_MEAL_KAYNAK.length = 0; window.__TECVID.MUSHAF_RESIM.v = null; window.__TECVID.S().kuran.gorunum = 'mushaf'; });
      // Sürüklenebilir kaydırma çubuğu: sayfa kaydırılınca tutamaç iner, sürüklenince sayfa kayar
      await sayfa.evaluate(() => { window.__TECVID.S().kuran.gorunum = 'meal'; window.__TECVID.git('sayfa', 28); });
      await sayfa.waitForSelector('#koKaydir:not([hidden])', { timeout: 8000 });
      await sayfa.evaluate(() => window.scrollTo(0, 0)); await sayfa.waitForTimeout(150);
      const y0 = await sayfa.evaluate(() => parseFloat(document.querySelector('#koKaydirTut').style.top) || 0);
      await sayfa.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await sayfa.waitForTimeout(250);
      const y1 = await sayfa.evaluate(() => parseFloat(document.querySelector('#koKaydirTut').style.top) || 0);
      kontrol('kaydırma çubuğu: sayfa kayınca tutamaç aşağı iniyor', y1 > y0 + 50, y0 + ' → ' + y1);
      await sayfa.evaluate(() => window.scrollTo(0, 0)); await sayfa.waitForTimeout(200);
      const kb = await sayfa.evaluate(() => { const r = document.querySelector('#koKaydir').getBoundingClientRect(); return { x: r.left + r.width / 2, y1: r.top + 40, y2: r.top + r.height * 0.6 }; });
      await sayfa.mouse.move(kb.x, kb.y1); await sayfa.mouse.down(); await sayfa.mouse.move(kb.x, kb.y2, { steps: 6 }); await sayfa.mouse.up();
      await sayfa.waitForTimeout(150);
      kontrol('kaydırma çubuğu: sürüklenince sayfa kayıyor', (await sayfa.evaluate(() => window.scrollY)) > 300, String(await sayfa.evaluate(() => window.scrollY)));
      await sayfa.evaluate(() => { window.__TECVID.S().kuran.gorunum = 'mushaf'; window.scrollTo(0, 0); });
      // Takip: ortam kontrolü (kısık / gürültülü / normal) ve okuma hızı çarpanı
      const ok2 = await sayfa.evaluate(() => { const K = window.__TECVID.canliOrtamKontrol, Hc = window.__TECVID.canliHizCarpani, Tl = window.__TECVID.canliTolerans; const rms = (v, n = 20) => Array(n).fill(v);
        return [K(rms(0.002)).durum, K(rms(0.05)).durum, K(rms(0.02)).durum, K([0.1]).durum, Hc(null), Hc({ ilkIlerleme: Date.now() - 5000, c: 150 }), +Tl(20, 0, false, 1.4).toFixed(1)]; });
      kontrol('takip: ortam kontrolü ve hız çarpanı', JSON.stringify(ok2) === '["sessiz","gurultulu","ok","ok",1,1.4,9.8]', JSON.stringify(ok2));
      // Harf sesi: hocanın kaydı varsa o çalar (Elif-Ba, harf kartı, mahreç); yoksa Elif-Ba'da harfin adı yapay sesle
      await sayfa.evaluate(async () => {
        window.__calan = []; window.__AudioAsil2 = window.Audio;
        window.Audio = function (src) { this.src = src; this.play = () => { window.__calan.push('ses'); return Promise.resolve(); }; this.pause = () => { }; this.onended = null; };
        await HarfSes.kaydet('h:' + window.TC.HARFLER[1][0], new Blob([new Uint8Array(40)], { type: 'audio/webm' }));
        window.__tts.length = 0;
      });
      await sayfa.evaluate(() => { window.__TECVID.git('harfKarti', window.TC.HARFLER[1][0]); });
      await sayfa.waitForSelector('#hkHarfSes'); await sayfa.click('#hkHarfSes');
      await sayfa.waitForFunction(() => window.__calan.length >= 1);
      kontrol('harf sesi: harf kartında büyük harfe dokununca hocanın kaydı çalıyor (yapay ses değil)', await sayfa.evaluate(() => window.__calan.length === 1 && window.__tts.length === 0));
      await sayfa.evaluate(() => { window.__calan.length = 0; window.__TECVID.git('harfKartlari'); });
      await sayfa.waitForSelector('[data-hkses]');
      await sayfa.evaluate(() => { document.querySelector('[data-hkses="' + window.TC.HARFLER[1][0] + '"]').click(); });
      await sayfa.waitForFunction(() => window.__calan.length >= 1);
      kontrol('harf sesi: mahreç şemasında harfin 🔊 düğmesi hocanın kaydını çalıyor ve harf kartına gitmiyor', await sayfa.evaluate(() => window.__calan.length === 1 && !!document.querySelector('[data-hkses]')));
      await sayfa.evaluate(() => { window.Audio = window.__AudioAsil2; });
      // Ana sayfa kişiselleştirme: profile göre düzen, kart gizleme/sıralama, hızlı erişim, hızlı ayarlar
      await sayfa.evaluate(() => { const S = window.__TECVID.S(); for (const k of ['anaTur', 'anaSira', 'anaGizli', 'hizli']) delete S.ayar[k]; S.kuran = { hedef: 5, ayetHedef: 10, gorunum: 'mushaf', tema: 'acik', gun: {}, ay: {}, imler: [] }; S.okunan = {}; S.ilerleme = {}; window.__TECVID.git('ana'); });
      await sayfa.waitForSelector('.ana-hizli');
      const a1 = await sayfa.evaluate(() => ({ elifba: !!document.querySelector('.ana-elifba'), kuran: !!document.querySelector('.ana-kuran'), hizli: [...document.querySelectorAll('.ana-hizli-oge')].map(x => x.dataset.git), hadis: !!document.querySelector('.hadis-kart') }));
      kontrol('ana sayfa: sıfırdan (otomatik) profil — Elif-Ba kartı, hızlı erişimde Elif-Ba tekrarı yok (alıştırma var)', a1.elifba && !a1.kuran && a1.hizli.length === 4 && a1.hizli[0] === 'ebAlistirma' && !a1.hizli.includes('elifba') && a1.hadis, JSON.stringify(a1));
      await sayfa.evaluate(() => { window.__TECVID.S().ayar.anaTur = 'kuran'; window.__TECVID.git('ana'); });
      await sayfa.waitForSelector('.ana-kuran');
      const a2 = await sayfa.evaluate(() => ({ elifba: !!document.querySelector('.ana-elifba'), hizli: [...document.querySelectorAll('.ana-hizli-oge')].map(x => x.dataset.git.split('|')[0]), ilk: document.querySelector('#app main').children[3] && document.querySelector('.ana-kuran') ? true : false }));
      kontrol('ana sayfa: Kur\'an okuyorum profili — Kur\'an kartı, Elif-Ba gizli, hızlı erişim Kaldığım yer/Tekrarla/Ezber/Notlarım', !a2.elifba && JSON.stringify(a2.hizli) === '["sayfa","tekrarla","ezber","notlar"]', JSON.stringify(a2));
      await sayfa.evaluate(() => window.__TECVID.git('anaDuzenle'));
      await sayfa.waitForSelector('[data-ana-gor="hadis"]');
      await sayfa.click('[data-ana-gor="hadis"]');
      await sayfa.waitForSelector('[data-ana-yukari="satirlar"]'); await sayfa.click('[data-ana-yukari="satirlar"]');
      const d1 = await sayfa.evaluate(() => { const A = window.__TECVID.S().ayar; return { gizli: A.anaGizli, sira: A.anaSira }; });
      kontrol('ana sayfayı düzenle: kart gizleme ve sıra değiştirme kaydoluyor', d1.gizli.includes('hadis') && d1.sira.indexOf('satirlar') === 4 && d1.sira.indexOf('satirlar') < d1.sira.indexOf('hadis'), JSON.stringify(d1));
      await sayfa.click('[data-ana-hizli="kartlar"]');
      kontrol('ana sayfayı düzenle: hızlı erişim 4 doluyken beşincisi eklenmiyor', await sayfa.evaluate(() => document.querySelectorAll('[data-ana-hizli].aktif').length === 4 && !document.querySelector('[data-ana-hizli="kartlar"].aktif')));
      await sayfa.click('[data-ana-hizli="ezber"]'); await sayfa.click('[data-ana-hizli="kartlar"]');
      await sayfa.evaluate(() => window.__TECVID.git('ana'));
      await sayfa.waitForSelector('.ana-hizli');
      const a3 = await sayfa.evaluate(() => ({ hadis: !!document.querySelector('.hadis-kart'), hizli: [...document.querySelectorAll('.ana-hizli-oge')].map(x => x.dataset.git.split('|')[0]) }));
      kontrol('ana sayfa: gizlenen hadis kartı yok, seçilen hızlı erişim (Ezber çıkıp Hap kartlar girdi) görünüyor', !a3.hadis && a3.hizli.includes('kartlar') && !a3.hizli.includes('ezber'), JSON.stringify(a3));
      // hızlı ayarlar kartı: gizli kartı aç, günlük hedef değiştir
      await sayfa.evaluate(() => { const A = window.__TECVID.S().ayar; A.anaGizli = A.anaGizli.filter(x => x !== 'hizliAyar'); window.__TECVID.git('ana'); });
      await sayfa.waitForSelector('.ana-hizli-ayar [data-ha="hedef"][data-v="30"]'); await sayfa.click('.ana-hizli-ayar [data-ha="hedef"][data-v="30"]');
      kontrol('hızlı ayarlar: ana sayfadan günlük hedef 30 dk yapılıyor', await sayfa.evaluate(() => window.__TECVID.S().ayar.hedefDk === 30));
      await sayfa.evaluate(() => window.__TECVID.git('anaDuzenle')); await sayfa.waitForSelector('#anaSifirla'); await sayfa.click('#anaSifirla');
      kontrol('ana sayfayı düzenle: Varsayılana dön özelleştirmeleri siliyor', await sayfa.evaluate(() => { const A = window.__TECVID.S().ayar; return !A.anaTur && !A.anaSira && !A.anaGizli && !A.hizli; }));
      await sayfa.evaluate(() => { delete window.__TECVID.S().ayar.hedefDk; });
      // Elif-Ba alıştırmaları: harfi tanı (10 soru), eşleştir; doğru/yanlış kaydı
      await sayfa.evaluate(() => { delete window.__TECVID.S().eb; window.__TECVID.git('ebAlistirma', 'tani'); });
      await sayfa.waitForSelector('.eb-secenek');
      for (let g = 0; g < 10; g++) {
        await sayfa.waitForSelector('.eb-secenek:not([disabled])');
        const dg = await sayfa.evaluate(() => { const E = window.__TECVID.eba(); return E.sorular[E.i].dogru; });
        await sayfa.click(`.eb-secenek[data-eb="${dg}"]`);
        await sayfa.click('#ebIleri');
      }
      await sayfa.waitForSelector('.eb-bitti');
      const eb1 = await sayfa.evaluate(() => ({ metin: document.querySelector('.eb-bitti').innerText, say: Object.keys((window.__TECVID.S().eb || {}).k || {}).length, d: Object.values(window.__TECVID.S().eb.k).reduce((a, x) => a + x.d, 0) }));
      kontrol('Elif-Ba alıştırma: harfi tanı — 10/10 doğru kaydoluyor', /10\/10/.test(eb1.metin) && eb1.d === 10, JSON.stringify(eb1));
      await sayfa.evaluate(() => { window.__TECVID.eba().mod = null; window.__TECVID.git('ebAlistirma', 'esles'); });
      await sayfa.waitForSelector('.eb-esles-oge');
      for (let tur = 0; tur < 3; tur++) {
        await sayfa.waitForSelector('[data-ebh]');
        for (let k = 0; k < 5; k++) {
          const cift = await sayfa.evaluate(() => { const E = window.__TECVID.eba().es, h = E.l.find(x => !E.eslesen.includes(x[0])); return h ? [h[0], h[1]] : null; });
          await sayfa.click(`[data-ebh="${cift[0]}"]`); await sayfa.click(`[data-eba="${cift[1]}"]`);
        }
        await sayfa.click('#ebIleri');
      }
      await sayfa.waitForSelector('.eb-bitti');
      kontrol('Elif-Ba alıştırma: eşleştir — 3 tur, 15/15 doğru', /15\/15/.test(await sayfa.evaluate(() => document.querySelector('.eb-bitti').innerText)));
      await sayfa.evaluate(() => { window.__TECVID.eba().mod = null; delete window.__TECVID.S().eb; });
      // Erişilebilirlik: temel ekranlarda dokunma hedefi (≥ 40 px) ve 12 px altı yazı sayısı
      const kk = await sayfa.evaluate(async () => {
        const out = {};
        for (const [ad, a] of [['ders', ['ders', 'u7']], ['tekrarla', ['tekrarla', 112, 1, 4]], ['gunluk', ['gunluk']]]) {
          window.__TECVID.git(...a); await new Promise(r => setTimeout(r, 500));
          const el = [...document.querySelectorAll('button, [role=button], summary, input[type=number], select')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
          out[ad] = el.filter(e => e.getBoundingClientRect().height < 40 && !e.classList.contains('terim')).length;
        }
        return out;
      });
      kontrol('erişilebilirlik: ders, Tekrarla ve günlük ders ekranlarında dokunma hedefi < 40 px öğe yok', kk.ders === 0 && kk.tekrarla === 0 && kk.gunluk === 0, JSON.stringify(kk));
      await sayfa.evaluate(() => { delete window.__TECVID.S().ezber; window.__TECVID.git('ezber'); });
      await sayfa.waitForSelector('.ez-bos');
      kontrol('ezber: boş durumda tek, yönlendirici "Süre ekle" kartı çıkıyor', await sayfa.evaluate(() => !!document.querySelector('.ez-bos [data-git="ezberEkle"]')));
      // Ayet ara: Arapça (harekesiz) ve Türkçe meal araması, sonuca dokununca sayfaya gider
      await sayfa.evaluate(() => { window.__TECVID.git('ayetAra'); });
      await sayfa.waitForSelector('#araGiris');
      await sayfa.fill('#araGiris', 'الحمد لله');
      await sayfa.waitForSelector('.ara-sonuc', { timeout: 15000 });
      const ar1 = await sayfa.evaluate(() => ({ n: document.querySelectorAll('.ara-sonuc').length, ilk: document.querySelector('.ara-sonuc small').textContent, ar: !!document.querySelector('.ara-metin.ar') }));
      kontrol('ayet ara: Arapça "الحمد لله" Fâtiha 1:2\'yi buluyor', ar1.n >= 1 && /1:2/.test(ar1.ilk) && ar1.ar, JSON.stringify(ar1));
      await sayfa.fill('#araGiris', 'alemlerin rabbi');
      await sayfa.waitForFunction(() => { const x = document.querySelector('.ara-sonuc small'); return x && /1:2/.test(x.textContent) && !document.querySelector('.ara-metin.ar'); }, null, { timeout: 15000 });
      kontrol('ayet ara: Türkçe "alemlerin rabbi" meal içinde buluyor (harf/aksan farkı yok sayılır)', await sayfa.evaluate(() => /lem/i.test(document.querySelector('.ara-metin').textContent)));
      await sayfa.fill('#araGiris', 'ABCXYZQQ');
      await sayfa.waitForFunction(() => /Sonuç yok/.test(document.querySelector('#araSonuc').innerText), null, { timeout: 15000 });
      await sayfa.fill('#araGiris', 'الحمد لله'); await sayfa.waitForSelector('.ara-sonuc');
      await sayfa.click('.ara-sonuc');
      await sayfa.waitForFunction(() => /Sayfa 1/.test(document.querySelector('#app').innerText));
      kontrol('ayet ara: sonuca dokununca Kur\'an sayfasına gidiyor', true);
      // Ezber: sabak/sabakî/münzil adları ve ezber raporu
      await sayfa.evaluate(() => { const S = window.__TECVID.S(); S.ezber = { 114: { a: 6, tam: true, eklendi: Date.now() - 20 * 864e5, bitti: Date.now() - 20 * 864e5, son: Date.now() - 3 * 864e5, kutu: 2, vade: Date.now() + 864e5, zayif: [2] }, 112: { a: 2, tam: false, eklendi: Date.now(), son: 0, kutu: 0, vade: 0 } }; delete window.__ezberRapor; window.__TECVID.git('ezber'); });
      await sayfa.waitForSelector('#ezRapor');
      const sb = await sayfa.evaluate(() => document.querySelector('.ez-gorevler').innerText + (document.querySelector('.ez-terim') ? ' [terim]' : ''));
      kontrol('ezber: bugünkü planda Sabak (yeni) satırı ve açıklama var', /Sabak · yeni ders/.test(sb) && /\[terim\]/.test(sb), sb.slice(0, 80));
      await sayfa.evaluate(() => { navigator.share = undefined; Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.resolve() }, configurable: true }); });
      await sayfa.click('#ezRapor');
      const rap = await sayfa.evaluate(() => window.__ezberRapor);
      kontrol('ezber raporu: sûreler, ilerleme ve zayıf ayet metne yazılıyor', /Ezber raporu/.test(rap) && /ezberde/.test(rap) && /zayıf ayet: 2/.test(rap) && /2\/\d+ ayet/.test(rap), (rap || '').slice(0, 160));
      await sayfa.evaluate(() => { window.__TECVID.S().ezber = {}; });
      // Dil: Türkçede İngilizce sözlük yüklenmez; İngilizce seçilince yüklenir ve çeviri çalışır
      const trYuk = await sayfa.evaluate(() => ({ dosya: !!document.querySelector('script[src*="dil-en.js"]'), t: window.t('Ayet ara'), sozluk: !!window.__EN_SOZLUK }));
      kontrol('dil: Türkçede İngilizce sözlük (dil-en.js) yüklenmiyor', !trYuk.dosya && !trYuk.sozluk && trYuk.t === 'Ayet ara', JSON.stringify(trYuk));
      const enSayfa = await sayfa.context().newPage();
      await enSayfa.addInitScript(() => { try { localStorage.setItem('tecvid-ogren.dil', 'en'); } catch (e) { } });
      await enSayfa.goto(url, { waitUntil: 'domcontentloaded' });
      await enSayfa.waitForFunction(() => window.__TECVID, null, { timeout: 20000 });
      const enYuk = await enSayfa.evaluate(() => ({ dosya: !!document.querySelector('script[src*="dil-en.js"]'), a: window.t('Ayet ara'), b: window.t('Notlarım'), dil: window.DIL }));
      kontrol('dil: İngilizce seçilince dil-en.js yükleniyor ve çeviri çalışıyor', enYuk.dosya && enYuk.dil === 'en' && enYuk.a === 'Search verses' && enYuk.b === 'My notes', JSON.stringify(enYuk));
      await enSayfa.evaluate(() => { try { localStorage.removeItem('tecvid-ogren.dil'); } catch (e) { } }); await enSayfa.close();
      // Yeni hap kartlar: harekeler (7 satır), mahreçler (17 satır, harf kartı verisinden), karıştırılan harfler
      const ks = {};
      for (const id of ['harekeler', 'mahrec', 'karisan']) { await sayfa.evaluate(i => window.__TECVID.git('kart', i), id); await sayfa.waitForSelector('#kkKart tbody tr, #kkKart .kk-satir'); ks[id] = await sayfa.evaluate(() => document.querySelectorAll('#kkKart tbody tr, #kkKart .kk-satir').length); }
      kontrol('yeni hap kartlar: harekeler 7, mahreçler 17, karıştırılan harfler 8 satır', ks.harekeler === 7 && ks.mahrec === 17 && ks.karisan === 8, JSON.stringify(ks));
      // Hap kartlar: harfe dokununca okunur (harf adı), Kur'an kelimesi/ifadesi gerçek kâri sesiyle çalar, gizliyken ses çalmaz
      await sayfa.evaluate(async () => { try { await HarfSes.sil('h:ب'); } catch (e) { } });
      await sayfa.evaluate(() => { window.__tts.length = 0; window.__sesCalan = []; window.__AudioAsil3 = window.Audio; EKRAN.kart._kontrol = false; window.Audio = function (src) { this.src = src; this.play = () => { window.__sesCalan.push(src); return Promise.resolve(); }; this.pause = () => { }; this.onended = null; }; window.__TECVID.git('kart', 'nun'); });
      await sayfa.waitForSelector('#kkKart .kk-ses');
      const nSes = await sayfa.evaluate(() => document.querySelectorAll('#kkKart .kk-ses').length);
      kontrol('hap kart: nûn kartında harfler ve örnek kelimeler dokunulur (≥ 30 öğe)', nSes >= 30, String(nSes));
      await sayfa.evaluate(() => { [...document.querySelectorAll('#kkKart .kk-ses')].find(x => x.textContent.trim() === 'ب').click(); });
      await sayfa.waitForFunction(() => window.__tts.length >= 1);
      kontrol('hap kart: harfe (ب) dokununca harf adı okunuyor', await sayfa.evaluate(() => /\|Be/.test(window.__tts[0])), await sayfa.evaluate(() => window.__tts[0]));
      await sayfa.evaluate(() => { const e = [...document.querySelectorAll('#kkKart .kk-ses')].find(x => x.textContent.trim().length > 5 && !/\s/.test(x.textContent.trim()) === false); (e || [...document.querySelectorAll('#kkKart .kk-ornek .kk-ses')][0]).click(); });
      await sayfa.waitForFunction(() => window.__sesCalan.length >= 1 || window.__tts.length >= 2, null, { timeout: 5000 }).catch(() => { });
      kontrol('hap kart: örnek kelime/ifadeye dokununca Kur\'an sesi çalıyor (ya da sesi yoksa uyarı)', await sayfa.evaluate(() => window.__sesCalan.length >= 1 || !!document.querySelector('.toast')), await sayfa.evaluate(() => JSON.stringify(window.__sesCalan)));
      await sayfa.evaluate(() => { window.Audio = window.__AudioAsil3; });
      // Regression: reading-mode thumbnail CSS must not draw stripes on the page container; single-verse "read" gives a check mark, not a toast
      await sayfa.evaluate(() => { const S = window.__TECVID.S(); S.kuran = { hedef: 5, ayetHedef: 10, gorunum: 'mushaf', tema: 'acik', gun: {}, ay: {}, imler: [] }; window.__TECVID.git('sayfa', 28); });
      await sayfa.waitForSelector('[data-ko-ayet="2:185"]');
      const bg = await sayfa.evaluate(() => getComputedStyle(document.querySelector('#okuEkran')).backgroundImage);
      kontrol('Kur\'an sayfası: arkada çizgili arka plan yok (okuma modu önizleme CSS\'i sayfaya sızmıyor)', bg === 'none', bg.slice(0, 60));
      await sayfa.evaluate(() => { document.querySelectorAll('.toast').forEach(x => x.remove()); });
      await sayfa.click('[data-ko-ayet="2:185"]'); await sayfa.click('[data-km="okudum"]');
      const okRes = await sayfa.evaluate(() => ({ toast: !!document.querySelector('.toast'), isaret: document.querySelector('[data-ko-ayet="2:185"]').classList.contains('ko-read') }));
      kontrol('tek ayet okundu: alt toast yok, ayet numarasında ✓ işareti var', !okRes.toast && okRes.isaret, JSON.stringify(okRes));
      // Contrast (WCAG AA) on key screens in light and dark; gradient backgrounds are skipped (cannot be measured reliably)
      for (const scheme of ['light', 'dark']) {
        const cp = await sayfa.context().newPage(); await cp.emulateMedia({ colorScheme: scheme });
        await cp.goto(url, { waitUntil: 'domcontentloaded' }); await cp.waitForFunction(() => window.__TECVID, null, { timeout: 20000 });
        const rep = {};
        for (const [name, args] of [['ana', ['ana']], ['tecvid', ['tecvid']], ['ders', ['ders', 'u7']], ['kuran', ['sayfa', 28]], ['ezber', ['ezber']], ['ayarlar', ['ayarlar']], ['kartlar', ['kartlar']]]) {
          rep[name] = await cp.evaluate(async ([a]) => {
            window.__TECVID.S().ayar.tanitim = 1; window.__TECVID.git(...a); await new Promise(r => setTimeout(r, 500));
            const parse = c => { const m = c.match(/[\d.]+/g).map(Number); return { rgb: m.slice(0, 3), a: m.length > 3 ? m[3] : 1 }; };
            const bgOf = e => { let x = e; while (x) { const cs = getComputedStyle(x); if (cs.backgroundImage !== 'none') return null; const c = parse(cs.backgroundColor); if (c.a > 0.9) return c.rgb; x = x.parentElement; } return [255, 255, 255]; };
            const lum = c => { const [r, g, b] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
            const bad = [];
            for (const e of document.querySelectorAll('#app *')) {
              if (e.children.length || e.textContent.trim().length < 2 || !e.getBoundingClientRect().width || getComputedStyle(e).visibility === 'hidden') continue;
              const cs = getComputedStyle(e), fg = parse(cs.color), bg = bgOf(e); if (!bg || fg.a < 1) continue;
              const l1 = lum(fg.rgb), l2 = lum(bg), ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05), px = parseFloat(cs.fontSize), large = px >= 24 || (px >= 18.66 && parseInt(cs.fontWeight) >= 700);
              if (ratio < (large ? 3 : 4.5)) bad.push((e.className || e.tagName).toString().split(' ')[0] + ' ' + ratio.toFixed(2));
            }
            return bad.slice(0, 4);
          }, [args]);
        }
        const failing = Object.entries(rep).filter(([, v]) => v.length);
        kontrol(`kontrast (${scheme}): ana, tecvid, ders, Kur'an, ezber, ayarlar, kartlar ekranlarında AA altı metin yok`, !failing.length, JSON.stringify(failing));
        await cp.close();
      }
      // First run (adult path): picking "I know nothing" opens Elif-Ba, font-size chips exist; Tecvid tab stays short for beginners
      await sayfa.evaluate(() => { const S = window.__TECVID.S(); S.ilerleme = {}; S.okunan = {}; for (const k of ['anaTur', 'anaSira', 'anaGizli', 'hizli', 'seviye']) delete S.ayar[k]; S.kuran = { hedef: 5, ayetHedef: 10, gorunum: 'mushaf', tema: 'acik', gun: {}, ay: {}, imler: [] }; window.__TECVID.git('hosgeldin', 'seviye'); });
      await sayfa.waitForSelector('[data-sv="sifir"]');
      kontrol('ilk açılış: Nereden başlayalım ekranında yazı boyutu seçenekleri var', (await sayfa.$$('[data-hg-yazi]')).length === 3);
      await sayfa.click('[data-sv="sifir"]');
      await sayfa.waitForSelector('#ebDevam');
      kontrol('ilk açılış: "Hiç bilmiyorum" doğrudan Elif-Ba odak ekranını açıyor', true);
      await sayfa.evaluate(() => window.__TECVID.git('tecvid')); await sayfa.waitForSelector('.tecvid-hepsi');
      const vis = await sayfa.evaluate(() => [...document.querySelectorAll('#app button, #app a')].filter(e => e.checkVisibility && e.checkVisibility({ contentVisibilityAuto: true }) && e.getBoundingClientRect().width > 0).length);
      kontrol('Tecvid sekmesi (yeni başlayan): görünür düğme sayısı ≤ 12 (bölümler katlı)', vis <= 12, String(vis));
      await sayfa.evaluate(() => { const S = window.__TECVID.S(); S.ilerleme.e1 = { en: 90, deneme: 1, gecti: true }; window.__TECVID.git('tecvid'); });
      await sayfa.waitForSelector('.tecvid-kutular');
      kontrol('Tecvid sekmesi: Elif-Ba geçilince bölümler açık listelenir', !(await sayfa.$('.tecvid-hepsi')));
      await sayfa.evaluate(() => { const S = window.__TECVID.S(); S.ilerleme = {}; for (const k of ['anaTur']) delete S.ayar[k]; });
      // Greeting by time of day and streak card
      await sayfa.evaluate(() => { const S = window.__TECVID.S(); S.seri = { gun: 7, son: S.seri && S.seri.son }; delete S.ayar.seriKutlama; window.__TECVID.git('ana'); });
      await sayfa.waitForSelector('.selam small');
      const sel = await sayfa.evaluate(() => ({ g: document.querySelector('.selam small').textContent, k: !!document.querySelector('#seriKart') }));
      kontrol('ana sayfa: saate göre selam ve 7 günlük seri kartı', /Hayırlı (sabahlar|günler|akşamlar|geceler)/.test(sel.g) && sel.k, JSON.stringify(sel));
      await sayfa.click('#seriKapat');
      kontrol('ana sayfa: seri kartı kapatılınca bir daha çıkmıyor', await sayfa.evaluate(() => !document.querySelector('#seriKart') && window.__TECVID.S().ayar.seriKutlama === 7));
      await sayfa.evaluate(() => { window.__TECVID.S().seri = { gun: 0 }; delete window.__TECVID.S().ayar.seriKutlama; });
      // Settings: high contrast, reduced motion, feedback text
      await sayfa.evaluate(() => window.__TECVID.git('ayarlar')); await sayfa.waitForSelector('#ayKontrast', { state: 'attached' }); await sayfa.evaluate(() => document.querySelectorAll('#app details').forEach(d => { d.open = true; })); await sayfa.waitForSelector('#ayKontrast');
      await sayfa.evaluate(() => document.querySelector('#ayKontrast').click()); await sayfa.evaluate(() => document.querySelector('#ayHareket').click());
      kontrol('ayarlar: yüksek kontrast ve hareketi azalt uygulanıyor', await sayfa.evaluate(() => document.documentElement.dataset.kontrast === 'yuksek' && document.documentElement.dataset.hareket === 'azalt'));
      await sayfa.evaluate(() => { navigator.share = undefined; Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.resolve() }, configurable: true }); delete window.__feedbackText; });
      await sayfa.evaluate(() => { document.querySelectorAll('#app details').forEach(d => { d.open = true; }); }); await sayfa.fill('#gbMetin', 'Deneme mesajı'); await sayfa.click('#gbGonder');
      kontrol('ayarlar: geri bildirim metni sürüm ve cihaz bilgisiyle hazırlanıyor', await sayfa.evaluate(() => /Deneme mesajı/.test(window.__feedbackText || '') && /Mozilla|Chrome/.test(window.__feedbackText)));
      await sayfa.evaluate(() => document.querySelector('#ayKontrast').click()); await sayfa.evaluate(() => document.querySelector('#ayHareket').click());
      // Special days card, parent gate, daily limit, recording share, theme spacing
      const sd = await sayfa.evaluate(() => [window.__TECVID.specialDayNow('2027-03-07') && window.__TECVID.specialDayNow('2027-03-07').day.name, window.__TECVID.specialDayNow('2027-03-10') && window.__TECVID.specialDayNow('2027-03-10').day.name, window.__TECVID.specialDayNow('2027-03-20'), window.__TECVID.specialDayNow('2027-01-04').daysLeft]);
      kontrol('özel gün: Arefe 1 gün önceden, Bayram günleri içinde görünür, boş günde görünmez', sd[0] === 'Arefe' && sd[1] === 'Ramazan Bayramı' && sd[2] === null && sd[3] === 0, JSON.stringify(sd));
      await sayfa.evaluate(() => { const r = window.__TECVID.specialDayNow(); window.__sd = r; });
      const gate = await sayfa.evaluate(async () => {
        const T = window.__TECVID, p = T.PR().liste.find(x => x.id === T.PR().aktif) || T.PR().liste[0], eski = p.yas; p.yas = 'cocuk'; T.PARENT_GATE.until = 0; T.PARENT_GATE.a = 0;
        T.git('profil'); await new Promise(r => setTimeout(r, 400));
        const kapi = !!document.querySelector('.parent-gate');
        document.querySelector('#pgInput').value = String(T.PARENT_GATE.a * T.PARENT_GATE.b + 1); document.querySelector('#pgOk').click(); await new Promise(r => setTimeout(r, 200));
        const yanlis = !document.querySelector('#pgHata').hidden || !!document.querySelector('.parent-gate');
        document.querySelector('#pgInput').value = String(T.PARENT_GATE.a * T.PARENT_GATE.b); document.querySelector('#pgOk').click(); await new Promise(r => setTimeout(r, 400));
        const acildi = !document.querySelector('.parent-gate') && !!document.querySelector('.child-limit');
        p.yas = eski; return { kapi, yanlis, acildi };
      });
      kontrol('çocuk modu: Büyükler bölümü ebeveyn sorusuyla kapalı; yanlış cevap açmaz, doğru cevap açar ve süre seçimi görünür', gate.kapi && gate.yanlis && gate.acildi, JSON.stringify(gate));
      const lim = await sayfa.evaluate(async () => {
        const T = window.__TECVID, S = T.S(), p = T.PR().liste.find(x => x.id === T.PR().aktif) || T.PR().liste[0], eski = p.yas; p.yas = 'cocuk';
        const day = new Date().toISOString().slice(0, 10); S.ayar.cocukLimit = 15; S.cocukSn = { [day]: 15 * 60 }; S.cocukEk = {};
        T.childLimitCheck(); const var1 = !!document.getElementById('childLimit');
        T.PARENT_GATE.a = 7; T.PARENT_GATE.b = 8; document.querySelector('#clInput').value = '56'; document.querySelector('#clOk').click();
        const var2 = !!document.getElementById('childLimit');
        S.ayar.cocukLimit = 0; T.childLimitCheck(); const var3 = !!document.getElementById('childLimit');
        p.yas = eski; delete S.ayar.cocukLimit; S.cocukSn = {}; S.cocukEk = {}; document.querySelectorAll('#childLimit').forEach(x => x.remove());
        return { var1, var2, var3 };
      });
      kontrol('çocuk modu: günlük süre dolunca kilit ekranı çıkar; ebeveyn sorusu 10 dk ekler; sınırsızda çıkmaz', lim.var1 === true && lim.var2 === false && lim.var3 === false, JSON.stringify(lim));
      await sayfa.evaluate(async () => { const T = window.__TECVID; T.KAYIT['mz-deneme'] = URL.createObjectURL(new Blob([new Uint8Array(120)], { type: 'audio/webm' })); navigator.canShare = () => false; delete window.__sharedRecording; await T.shareRecording('mz-deneme'); });
      kontrol('kendi okuyuşunu paylaş: kayıt dosyası hazırlanıyor (paylaşım yoksa indirme)', await sayfa.evaluate(() => !!window.__sharedRecording && window.__sharedRecording.size === 120 && /okuyusum\.webm/.test(window.__sharedRecording.name)));
      const sp = await sayfa.evaluate(() => { window.__TECVID.git('ana'); return getComputedStyle(document.querySelector('.kart')).marginBottom; });
      kontrol('tema: kartlar arası boşluk 16 px', sp === '16px', sp);
      // Elif-Ba
      await sayfa.evaluate(() => { window.__TECVID.git('elifba'); });
      await sayfa.waitForSelector('#ebDevam');
      const eb = await sayfa.evaluate(() => document.querySelectorAll('[data-eb]').length);
      kontrol('Elif-Ba odak modu: müfredat adımları listeleniyor', eb >= 8, String(eb));
      await sayfa.click('#ebDevam');
      await sayfa.waitForFunction(() => document.querySelector('.sayfa'));
      kontrol('Elif-Ba: Devam et ilk dersi açıyor', true);
      await sayfa.evaluate(() => { window.__TECVID.git('elifba'); });
      await sayfa.waitForSelector('#ebAna'); await sayfa.click('#ebAna');
      await sayfa.waitForSelector('nav, .altsekme, [data-sekme], .tab', { state: 'attached' });
      kontrol('Elif-Ba: Ana uygulamaya dön çalışıyor', true);
    } catch (e) { kontrol('durak ışıkları / kartlar / Elif-Ba', false, e.message.split('\n')[0]); }
    kontrol('kartlar bölümünde konsol hatası yok', hatalar.length === once, hatalar.slice(once).join(' | '));
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

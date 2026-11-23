// Duman testi: uygulama açılıyor mu, ekranlar hata vermeden çiziliyor mu?
// Çalıştır: npm run test:smoke   (Playwright gerekir: npm i -D playwright)
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '../../www');
const TIP = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css',
  '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.wasm': 'application/wasm' };

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

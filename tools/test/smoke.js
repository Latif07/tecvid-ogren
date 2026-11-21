// Duman testi: uygulama açılıyor mu, ekranlar hata vermeden çiziliyor mu?
// Çalıştır: npm run test:smoke   (Playwright gerekir: npm i -D playwright)
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '../../www');
const TIP = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css',
  '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.wasm': 'application/wasm' };

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
  const sayfa = await (await tarayici.newContext({ viewport: { width: 390, height: 800 }, serviceWorkers: 'block' })).newPage();
  const hatalar = [];
  sayfa.on('pageerror', e => hatalar.push('pageerror: ' + e.message));
  sayfa.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) hatalar.push('console: ' + m.text()); });

  let basarisiz = 0;
  const kontrol = (ad, ok, ek = '') => { console.log((ok ? 'OK   ' : 'HATA ') + ad + (ek ? ' — ' + ek : '')); if (!ok) basarisiz++; };

  const KAPSAM = process.argv.includes('--kapsam');
  if (KAPSAM) await sayfa.coverage.startJSCoverage({ resetOnNavigation: false });
  await sayfa.addInitScript(() => { try { localStorage.setItem('hk.test', '1'); } catch (e) { } });
  await sayfa.goto(url, { waitUntil: 'load' });
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

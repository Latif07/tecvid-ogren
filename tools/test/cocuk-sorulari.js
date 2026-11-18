// Çalıştırma: www klasöründe "python3 -m http.server 8080", sonra "node tools/test/cocuk-sorulari.js". BOZ=1 ile testin hatayı yakaladığı denenir.
// Çocuk modu soru üreticileri: her durak ve yoklama, TR/EN, 4–6 ve 7–12 yaş, çok kez üretilir ve denetlenir.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let toplamSoru = 0; const hatalar = [];
  for (const dil of ['tr', 'en']) for (const yas of ['kucuk', 'cocuk']) {
    const p = await (await b.newContext()).newPage(); const js = []; p.on('pageerror', e => js.push(e.message));
    await p.addInitScript(([dil, yas]) => { localStorage.clear(); localStorage.setItem('tecvid-ogren.dil', dil); localStorage.setItem('tecvid-ogren.profiller', JSON.stringify({ aktif: 'p1', liste: [{ id: 'p1', ad: 'Ali', yas }] })); localStorage.setItem('tecvid-ogren.v1', JSON.stringify({ ayar: { sesKontrol: 'var', sessiz: true }, cocuk: { seviye: 'yeni', d: {}, gun: {} } })); sessionStorage.setItem('hk.acilisYok', '1'); sessionStorage.setItem('hk.secildi', '1'); }, [dil, yas]);
    // BOZ=1: telefondaki hatayı (okunuşta "false") yapay olarak geri getirir; test bunu yakalamalı
    if (process.env.BOZ) await p.route(/js\/cocuk\.js/, async r => { const res = await r.fetch(); const body = (await res.text()).replace(/const sessizHarf = h => [^;]+;/, 'const sessizHarf = h => false;'); r.fulfill({ response: res, body }); });
    await p.goto('http://localhost:8080/index.html'); await p.waitForTimeout(900);
    // Gömülü olmayan sûreleri önce yükle (uygulamada durak açılınca yüklenir)
    const yuklenemeyen = await p.evaluate(async () => { const T = window.__cocukTest, l = []; for (const d of T.DURAK.filter(d => d.tur === 'sure')) { if (!T.SR(d.n)) { try { await T.sureYukle(d.n); } catch (e) { l.push(d.n); } } } return l; });
    if (yuklenemeyen.length) console.log('   ✗ yüklenemeyen sûre: ' + yuklenemeyen.join(', '));
    const r = await p.evaluate(([dil]) => {
      const T = window.__cocukTest, out = { n: 0, hata: [] };
      const KOTU = /\b(false|undefined|NaN|null)\b|\[object/;
      const ARAPCA_TERIM = /Fat[hḥ]ah|Kasrah|[DḌ]ammah|Suk[uū]n|Shaddah|Tanw[iī]n|Madd/;
      const yaziTara = (v, yol, ad) => { if (typeof v === 'string') { const sade = v.replace(/<[^>]+>/g, ''); if (KOTU.test(sade)) out.hata.push(`${ad} ${yol}: "${sade.slice(0, 80)}"`); if (dil === 'en' && ARAPCA_TERIM.test(sade)) out.hata.push(`${ad} ${yol}: Arapça terim: "${sade.slice(0, 80)}"`); }
        else if (Array.isArray(v)) v.forEach((x, i) => yaziTara(x, yol + '[' + i + ']', ad)); else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => yaziTara(x, yol + '.' + k, ad)); };
      const denetle = (q, ad) => {
        out.n++;
        if (!q) { out.hata.push(`${ad}: soru üretilemedi`); return; }
        yaziTara(q, '', ad);
        if (!q.soru || !String(q.soru).replace(/<[^>]+>/g, '').trim()) out.hata.push(`${ad}: soru metni boş`);
        if (q.secenek) {
          if (!q.secenek.includes(q.dogru)) out.hata.push(`${ad}: doğru cevap seçeneklerde yok (${q.dogru} / ${q.secenek.join(' | ')})`);
          if (new Set(q.secenek).size !== q.secenek.length) out.hata.push(`${ad}: aynı seçenek iki kez (${q.secenek.join(' | ')})`);
          if (q.secenek.length < 2) out.hata.push(`${ad}: tek seçenek`);
        }
      };
      for (let k = 0; k < 40; k++) {
        for (const d of T.DURAK) { let l; try { l = T.sorularHazirla(d); } catch (e) { out.hata.push(`${d.id}: ${e.message}`); continue; } l.forEach((q, i) => denetle(q, `durak ${d.id} #${i + 1} (${q && q.tip})`)); }
        for (const ada of ['harf', 'hareke', 'okuma']) T.yoklamaSorulari(ada).forEach((q, i) => denetle(q, `yoklama ${ada} #${i + 1}`));
      }
      return out;
    }, [dil]);
    toplamSoru += r.n; const benzersiz = [...new Set(r.hata)];
    console.log(`${dil.toUpperCase()} ${yas}: ${r.n} soru, ${benzersiz.length} farklı sorun${js.length ? ', JS: ' + js.join(' | ') : ''}`);
    benzersiz.slice(0, 12).forEach(h => console.log('   ✗ ' + h)); hatalar.push(...benzersiz);
    await p.close();
  }
  console.log(`\nToplam ${toplamSoru} soru denendi. ${hatalar.length ? hatalar.length + ' sorun' : 'Sorun yok ✓'}`); await b.close();
})();

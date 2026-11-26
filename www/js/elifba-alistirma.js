/* Kur'an Yolum — Elif-Ba alıştırmaları (sessiz): harfi tanı, adı bul, eşleştir. Yalnız ders metnindeki harf ve adları kullanır. */
/* app.js bölündü: bu dosyalar sırayla yüklenir, aynı genel kapsamı paylaşır (bkz. TODO.md). */
'use strict';
// Kayıt: S.eb = { k: { '<harf>': { d: doğru, y: yanlış } }, t: son çalışma zamanı }
// Görsel olarak birbirine benzeyen harf grupları (yanlış şıklar önce aynı gruptan seçilir)
const EB_BENZER = ['ب ت ث ن ي', 'ج ح خ', 'د ذ', 'ر ز', 'س ش', 'ص ض', 'ط ظ', 'ع غ', 'ف ق', 'ك ل'];
const EBA = { mod: null, sorular: [], i: 0, dogru: 0, cevap: null, es: null };
const ebHarfler = () => (window.TC.HARFLER || []).filter(h => h[0] !== 'لا');   // 28 harf (lamelif ayrıca sayılır)
const ebKayit = h => { S.eb = S.eb || { k: {}, t: 0 }; return S.eb.k[h] = S.eb.k[h] || { d: 0, y: 0 }; };
const ebOgrendi = h => { const k = (S.eb && S.eb.k[h]) || { d: 0, y: 0 }; return k.d >= 3 && k.d >= 2 * k.y; };
function ebIsle(h, dogru) { const k = ebKayit(h); if (dogru) k.d++; else k.y++; S.eb.t = simdi(); kaydet(); }
// Çalışılacak harfleri seç: yanlış yapılan ve az görülenler önce
function ebHavuz(n) {
  const L = ebHarfler().map(h => { const k = (S.eb && S.eb.k[h[0]]) || { d: 0, y: 0 }; return { h, puan: k.y * 3 - Math.min(k.d, 4) + Math.random() * 2 }; });
  return L.sort((a, b) => b.puan - a.puan).slice(0, n).map(x => x.h).sort(() => Math.random() - 0.5);
}
function ebYanlislar(hedef, adet, anahtar) {   // anahtar: 0 harf, 1 ad
  const tum = ebHarfler(), grup = (EB_BENZER.find(g => g.split(' ').includes(hedef[0])) || '').split(' ');
  const once = tum.filter(h => h[0] !== hedef[0] && grup.includes(h[0])), diger = tum.filter(h => h[0] !== hedef[0] && !grup.includes(h[0]));
  const rnd = a => a.slice().sort(() => Math.random() - 0.5);
  return [...rnd(once), ...rnd(diger)].slice(0, adet);
}
function ebSoruYap(mod) {
  return ebHavuz(10).map(h => {
    const yan = ebYanlislar(h, 3), sec = [h, ...yan].sort(() => Math.random() - 0.5);
    return { h: h[0], ad: h[1], secenek: sec.map(x => x[mod === 'tani' ? 1 : 0]), dogru: h[mod === 'tani' ? 1 : 0] };
  });
}
EKRAN.ebAlistirma = function (mod) {
  const toplam = ebHarfler().length, ogren = ebHarfler().filter(h => ebOgrendi(h[0])).length;
  if (!mod) {
    EBA.mod = null;
    app.innerHTML = `${ust(t('Elif-Ba alıştırmaları'))}<main>
      <section class="kart eb-ozet"><h2>🌱 ${t('Harfleri pekiştir')}</h2><p class="soluk">${t('Sessiz alıştırmalar. Yanlış yaptığın harfler daha sık gelir.')}</p>
        <div class="bar"><div class="iyi" style="width:${Math.round(ogren / toplam * 100)}%"></div></div><small class="soluk">${t('{0}/{1} harf öğrenildi', ogren, toplam)}</small></section>
      <div class="bolumler">
        <button class="bolum" data-git="ebAlistirma|tani"><span class="ikon ar">ب</span><span class="bad"><small>${t('Harfi gör, adını seç')}</small>${t('Harfi tanı')}</span><span class="rozet">›</span></button>
        <button class="bolum" data-git="ebAlistirma|ad"><span class="ikon">Aa</span><span class="bad"><small>${t('Adı gör, harfi seç')}</small>${t('Adı bul')}</span><span class="rozet">›</span></button>
        <button class="bolum" data-git="ebAlistirma|esles"><span class="ikon">🔗</span><span class="bad"><small>${t('Harfleri adlarıyla eşleştir')}</small>${t('Eşleştir')}</span><span class="rozet">›</span></button>
      </div>
      <div class="eb-harf-izgara">${ebHarfler().map(([h, ad]) => `<span class="eb-harf ${ebOgrendi(h) ? 'tamam' : ''}" title="${esc(ad)}"><b class="ar">${h}</b></span>`).join('')}</div>
      <p class="soluk kucukyazi">${t('Yeşil harfler öğrenildi (3 doğru, hata azsa).')}${TEST_SURUM ? ' ' + t('Harf adları ders metninden alınmıştır; hoca onayı bekliyor.') : ''}</p></main>`;
    return;
  }
  if (EBA.mod !== mod) { Object.assign(EBA, { mod, i: 0, dogru: 0, cevap: null, es: null, sorular: mod === 'esles' ? [0, 1, 2] : ebSoruYap(mod) }); if (mod === 'esles') ebEslesTur(); }
  const bitti = EBA.i >= EBA.sorular.length;
  if (bitti) {
    const hedefSay = mod === 'esles' ? EBA.sorular.length * 5 : EBA.sorular.length;
    app.innerHTML = `${ust(t('Elif-Ba alıştırmaları'))}<main><section class="kart eb-bitti"><h2>${t('Bitti!')}</h2><p>${t('{0}/{1} doğru', EBA.dogru, hedefSay)}</p>
      <div class="satir sola"><button class="btn" id="ebTekrar">${t('Tekrar')}</button><button class="btn ikincil" data-git="ebAlistirma">${t('Alıştırma listesi')}</button></div></section></main>`;
    $('#ebTekrar').onclick = () => { EBA.mod = null; ciz(); };
    return;
  }
  if (mod === 'esles') return ebEslesCiz();
  const q = EBA.sorular[EBA.i], cevap = EBA.cevap;
  app.innerHTML = `${ust(t('Elif-Ba alıştırmaları'))}<main>
    <p class="soluk kucukyazi ortala">${EBA.i + 1} / ${EBA.sorular.length}</p>
    <section class="kart eb-soru">${mod === 'tani' ? `<p class="ar eb-buyuk">${q.h}</p><p class="soluk">${t('Bu harfin adı nedir?')}</p>` : `<p class="eb-buyuk eb-ad">${esc(q.ad)}</p><p class="soluk">${t('Hangi harf?')}</p>`}
      <div class="eb-secenekler ${mod === 'ad' ? 'eb-harfli' : ''}">${q.secenek.map(s => `<button class="eb-secenek ${cevap != null ? (s === q.dogru ? 'dogru' : s === cevap ? 'yanlis' : '') : ''}" data-eb="${esc(s)}" ${cevap != null ? 'disabled' : ''}>${mod === 'ad' ? `<span class="ar">${s}</span>` : esc(s)}</button>`).join('')}</div>
      ${cevap != null ? `<button class="btn genis" id="ebIleri">${EBA.i + 1 >= EBA.sorular.length ? t('Bitir') : t('Sonraki ›')}</button>` : ''}</section></main>`;
  app.querySelectorAll('[data-eb]').forEach(b => b.onclick = () => {
    if (EBA.cevap != null) return; EBA.cevap = b.dataset.eb; const d = EBA.cevap === q.dogru; if (d) EBA.dogru++; ebIsle(q.h, d); ciz();
  });
  const il = $('#ebIleri'); if (il) il.onclick = () => { EBA.i++; EBA.cevap = null; ciz(); };
};
// Eşleştir: her turda 5 harf ↔ 5 ad
function ebEslesTur() {
  const l = ebHavuz(5); EBA.es = { l, adlar: l.map(h => h[1]).sort(() => Math.random() - 0.5), sec: null, eslesen: [], hata: 0 };
}
function ebEslesCiz() {
  const E = EBA.es;
  app.innerHTML = `${ust(t('Elif-Ba alıştırmaları'))}<main><p class="soluk kucukyazi ortala">${t('Tur {0}/{1}', EBA.i + 1, EBA.sorular.length)}</p>
    <section class="kart eb-esles"><p class="soluk">${t('Bir harfe, sonra adına dokun.')}</p><div class="eb-esles-sutun">
      <div>${E.l.map(([h]) => `<button class="eb-esles-oge ar ${E.eslesen.includes(h) ? 'dogru' : E.sec === h ? 'secili' : ''}" data-ebh="${h}" ${E.eslesen.includes(h) ? 'disabled' : ''}>${h}</button>`).join('')}</div>
      <div>${E.adlar.map(ad => { const hh = E.l.find(x => x[1] === ad)[0]; return `<button class="eb-esles-oge ${E.eslesen.includes(hh) ? 'dogru' : ''}" data-eba="${esc(ad)}" ${E.eslesen.includes(hh) ? 'disabled' : ''}>${esc(ad)}</button>`; }).join('')}</div></div>
      ${E.eslesen.length === 5 ? `<button class="btn genis" id="ebIleri">${EBA.i + 1 >= EBA.sorular.length ? t('Bitir') : t('Sonraki tur ›')}</button>` : ''}</section></main>`;
  app.querySelectorAll('[data-ebh]').forEach(b => b.onclick = () => { E.sec = b.dataset.ebh; ciz(); });
  app.querySelectorAll('[data-eba]').forEach(b => b.onclick = () => {
    if (!E.sec) return toast(t('Önce bir harf seç.'));
    const h = E.l.find(x => x[0] === E.sec), d = h[1] === b.dataset.eba;
    if (d) { E.eslesen.push(h[0]); EBA.dogru++; ebIsle(h[0], true); E.sec = null; } else { ebIsle(h[0], false); E.hata++; toast(t('Olmadı, tekrar dene.')); E.sec = null; }
    ciz();
  });
  const il = $('#ebIleri'); if (il) il.onclick = () => { EBA.i++; if (EBA.i < EBA.sorular.length) ebEslesTur(); ciz(); };
}

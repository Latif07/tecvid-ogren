/* Kur'an Yolum — ayet ve kelime arama (Arapça harekesiz ya da Türkçe meal). Dizin: kuran/arama.json (tools/build_arama.py) */
/* app.js bölündü: bu dosyalar sırayla yüklenir, aynı genel kapsamı paylaşır (bkz. TODO.md). */
'use strict';
// Normalleştirme tools/build_arama.py ile AYNI olmalı
const ARAMA = { dizin: null, yukleniyor: null, sorgu: '', sonuc: [], goster: 40 };
const aramaAr = s => String(s).replace(/[ً-ٰٟۖ-ۭـ࣓-ࣿ]/g, '').replace(/[ٱأإآ]/g, 'ا').replace(/[ىی]/g, 'ي').replace(/ک/g, 'ك').replace(/ہ/g, 'ه').replace(/\s+/g, ' ').trim();
const aramaTr = s => String(s).toLowerCase().replace(/i̇/g, 'i').replace(/ı/g, 'i').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'‘ʿʾ-]/g, '').replace(/\s+/g, ' ').trim();
const aramaArapcaMi = s => /[؀-ۿ]/.test(s);
function aramaYukle() {
  if (ARAMA.dizin) return Promise.resolve(ARAMA.dizin);
  return ARAMA.yukleniyor || (ARAMA.yukleniyor = fetch('kuran/arama.json').then(r => { if (!r.ok) throw new Error('arama dizini yüklenemedi'); return r.json(); }).then(d => (ARAMA.dizin = d)).catch(e => { ARAMA.yukleniyor = null; throw e; }));
}
// Sorgudaki bütün sözcükler ayette geçmeli; en çok 300 sonuç
function aramaYap(q, dizin) {
  const ar = aramaArapcaMi(q), kelimeler = (ar ? aramaAr(q) : aramaTr(q)).split(' ').filter(w => w.length >= (ar ? 2 : 3)), kaynak = ar ? dizin.ar : dizin.tr, out = [];
  if (!kelimeler.length) return { ar, out };
  for (let n = 0; n < kaynak.length && out.length < 300; n++) for (let a = 0; a < kaynak[n].length && out.length < 300; a++) { const m = kaynak[n][a]; if (kelimeler.every(w => m.includes(w))) out.push([n + 1, a + 1]); }
  return { ar, out };
}
EKRAN.ayetAra = function () {
  const q = ARAMA.sorgu;
  app.innerHTML = `${ust(t('Ayet ara'))}<main class="ara-ekran">
    <input id="araGiris" class="not-ara" type="search" inputmode="search" autocomplete="off" placeholder="${t('Arapça kelime ya da Türkçe meal yaz…')}" value="${esc(q)}" aria-label="${t('Ayet ara')}">
    <p class="soluk kucukyazi">${t('Arapça yazarsan harekesiz kelimeyle ara; Türkçe yazarsan meal içinde ara. Birden çok kelimenin hepsi ayette geçmeli.')}</p>
    <div id="araSonuc"></div></main>`;
  const giris = $('#araGiris'), kutu = $('#araSonuc'); let zaman = null;
  const goster = async () => {
    const s = giris.value.trim(); ARAMA.sorgu = s;
    if (s.length < 2) { kutu.innerHTML = ''; return; }
    kutu.innerHTML = `<p class="soluk">${t('Aranıyor…')}</p>`;
    let dizin; try { dizin = await aramaYukle(); } catch (e) { kutu.innerHTML = `<p class="hata">${t('Arama dizini yüklenemedi. İnternet bağlantını kontrol et.')}</p>`; return; }
    if (giris.value.trim() !== s) return;
    const { ar, out } = aramaYap(s, dizin); ARAMA.sonuc = out;
    if (!out.length) { kutu.innerHTML = `<p class="soluk">${t('Sonuç yok.')}</p>`; return; }
    const sat = out.slice(0, ARAMA.goster);
    // Türkçe sonuçlarda gerçek meal metni için ilgili sûrelerin meali yüklenir (küçük dosyalar)
    if (!ar) { try { await Promise.all(benzersiz(sat.map(x => x[0])).map(mealYukle)); } catch (e) { } if (giris.value.trim() !== s) return; }
    const metin = ([n, a]) => ar ? esc(dizin.ar[n - 1][a - 1]) : esc(((MEAL['tr' + n] || [])[a - 1]) || dizin.tr[n - 1][a - 1]);
    kutu.innerHTML = `<p class="soluk kucukyazi">${out.length >= 300 ? t('300+ sonuç (ilk {0} gösteriliyor)', sat.length) : t('{0} sonuç', out.length)}</p><div class="bolumler">${sat.map(([n, a]) => `<button class="bolum ara-sonuc" data-git="sayfa|${sayfaBul(n, a)}|${n}:${a}"><span class="bad"><small>${esc(sureNoAdi(n))} ${n}:${a} · ${t('Sayfa {0}', sayfaBul(n, a))}</small><span class="${ar ? 'ar' : ''} ara-metin" ${ar ? 'dir="rtl" lang="ar"' : ''}>${metin([n, a])}</span></span></button>`).join('')}</div>
      ${out.length > sat.length ? `<button class="btn ikincil genis" id="araDaha">${t('Daha fazla göster')}</button>` : ''}`;
    const d = $('#araDaha'); if (d) d.onclick = () => { ARAMA.goster += 40; goster(); };
  };
  giris.oninput = () => { ARAMA.goster = 40; clearTimeout(zaman); zaman = setTimeout(goster, 250); };
  if (q.length >= 2) goster(); else setTimeout(() => giris.focus(), 50);
};

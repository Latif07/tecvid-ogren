/* Kur'an Yolum — ana sayfa kişiselleştirme: başlangıç profili, kart sırası/gizleme, hızlı erişim şeridi, hızlı ayarlar */
/* app.js bölündü: bu dosyalar sırayla yüklenir, aynı genel kapsamı paylaşır (bkz. TODO.md). */
'use strict';
// Kayıt: S.ayar.anaTur ('sifirdan' | 'harf' | 'kuran' | yok = otomatik), S.ayar.anaSira (kimlik listesi | yok), S.ayar.anaGizli (kimlik listesi), S.ayar.hizli (en çok 4 kimlik | yok)
const ANA_TURLER = [['sifirdan', '🌱', 'Sıfırdan başlıyorum'], ['harf', '🔤', 'Harfleri biliyorum'], ['kuran', '📖', 'Kur\'an okuyorum']];
// Düzenlenebilir ana kartlar (sistem kartları — tanıtım, yükle, hatırlatma, haftalık özet, ödev, hesap uyarısı, sürüm — sabit kalır)
const ANA_KARTLAR = [['elifba', '🌱', 'Elif-Ba odak modu'], ['kuran', '📖', 'Kaldığım yer (Kur\'an)'], ['hizli', '⚡', 'Hızlı erişim'], ['hadis', '🕌', 'Günün hadisi'], ['gunluk', '📅', 'Bugünkü dersim'],
  ['tekrar', '🔁', 'Günlük tekrar'], ['satirlar', '📚', 'Müfredat, notlar, ilerleme'], ['soru', '❓', 'Günün sorusu'], ['hizliAyar', '⚙️', 'Hızlı ayarlar']];
const ANA_VARSAYILAN = {
  sifirdan: { sira: ['elifba', 'hizli', 'gunluk', 'hadis', 'tekrar', 'satirlar', 'soru', 'kuran', 'hizliAyar'], gizli: ['kuran', 'hizliAyar'], hizli: ['ebAlistirma', 'gunluk', 'kartlar', 'kuranDinle'] },
  harf: { sira: ['gunluk', 'hizli', 'tekrar', 'satirlar', 'soru', 'hadis', 'elifba', 'kuran', 'hizliAyar'], gizli: ['elifba', 'kuran', 'hizliAyar'], hizli: ['gunluk', 'kartlar', 'testler', 'muezzin'] },
  kuran: { sira: ['kuran', 'hizli', 'tekrar', 'gunluk', 'hadis', 'satirlar', 'soru', 'elifba', 'hizliAyar'], gizli: ['elifba', 'hizliAyar'], hizli: ['kaldim', 'tekrarla', 'ezber', 'notlar'] },
};
const ANA_HIZLI = {
  kaldim: [IKON.kuran, 'Kaldığım yer'], tekrarla: [IKON.tekrar, 'Tekrarla'], ezber: [IKON.ezber, 'Ezber'], notlar: [IKON.not, 'Notlarım'], elifba: [IKON.filiz, 'Elif-Ba'], gunluk: [IKON.takvim, 'Bugünkü ders'],
  kartlar: [IKON.kart, 'Hap kartlar'], kuranDinle: [IKON.kulaklik, 'Kur\'an dinle'], testler: [IKON.test, 'Testler'], muezzin: [IKON.minare, 'Müezzinlik'], mufredat: [IKON.liste, 'Müfredat'], ilerleme: [IKON.grafik, 'İlerleme'], tecvid: [IKON.tecvid, 'Tecvid'], ebAlistirma: [IKON.alistirma, 'Elif-Ba alıştırma'], ayetAra: [IKON.ara, 'Ayet ara'],
};
function anaHizliHedef(id) {
  const k = KO(), s = k.son || {};
  if (id === 'kaldim') return `sayfa|${S.sonSayfa || (s.p || 1)}${s.n ? '|' + s.n + ':' + s.a : ''}`;
  return id;   // diğerleri ekran adıdır (git(ad))
}
function anaTurOtomatik() {
  const k = KO(), okudu = !!(k.son && k.son.n) || Object.keys(k.gun || {}).length > 0 || Object.keys(k.ay || {}).length > 0;
  if (!gecti('e1') && !okudu) return 'sifirdan';
  return okudu ? 'kuran' : 'harf';
}
const anaTur = () => ANA_VARSAYILAN[S.ayar.anaTur] ? S.ayar.anaTur : anaTurOtomatik();
function anaDuzen() {
  const v = ANA_VARSAYILAN[anaTur()], tum = ANA_KARTLAR.map(x => x[0]);
  const sira = (S.ayar.anaSira || v.sira).filter(x => tum.includes(x)); tum.forEach(x => { if (!sira.includes(x)) sira.push(x); });
  const gizli = S.ayar.anaGizli || v.gizli, hizli = (S.ayar.hizli || v.hizli).filter(x => ANA_HIZLI[x]).slice(0, 4);
  return { tur: anaTur(), sira, gizli, hizli };
}
function anaKartHTML(id, c) {
  const k = KO(), s = k.son || {};
  switch (id) {
    case 'hadis': return `<section class="hadis-kart"><p class="ar" dir="rtl" lang="ar">${HADIS_AR}</p><p>${hadisMetni()} <small>${hadisKaynak()}</small></p></section>`;
    case 'gunluk': return gunlukKarti() + yarimKarti();
    case 'tekrar': return c.vade && !gunlukPlan().adimlar.some(a => a.tur === 'tekrar' && !a.bitti) ? `<section class="kart tekrar vurgulu">
      <div><h2>${t('🔁 Günlük tekrar')}</h2><p>${t('<b>{0}</b> soru tekrar zamanı geldi. Unutmamak için şimdi çöz.', c.vade)}</p></div>
      <button class="btn" data-git="tekrarBasla">${t('Başla')}</button></section>` : '';
    case 'satirlar': return `<div class="bolumler ana-satirlar">
      <button class="bolum" data-git="mufredat"><span class="halka kucuk" style="--p:${Math.round(c.gecilen / c.toplam * 100)}"><b>${c.gecilen}/${c.toplam}</b></span><span class="bad"><small>${c.siradaki ? t('Sıradaki: ') + esc(c.siradaki.ad) : t('Maşallah! Bütün müfredatı bitirdin. 🎉')}</small>${t('Müfredat')}</span><span class="rozet">›</span></button>
      <button class="bolum" data-git="notlar"><span class="ikon">${IKON.not}</span><span class="bad"><small>${notlar().length + k.imler.length ? t('{0} kayıt', notlar().length + k.imler.length) : t('Yer imleri ve notlar')}</small>${t('Notlarım')}</span></button>
      <button class="bolum" data-git="ilerleme"><span class="ikon">${IKON.grafik}</span><span class="bad"><small>${S.seri.gun ? t('🔥 {0} günlük seri', S.seri.gun) : t('Gelişimin')}</small>${t('İlerleme')}</span><span class="rozet">›</span></button></div>`;
    case 'soru': return gununSorusuKarti();
    case 'elifba': {
      const e1 = unitById('e1'), u0 = unitById('u0'), say = (e1 ? e1.sayfalar.length : 0) + (u0 ? u0.sayfalar.length - 1 : 0), ok = Math.min(say, (S.okunan.e1 || 0) + Math.max(0, (S.okunan.u0 || 1) - 1));
      return `<section class="kart ana-ozel ana-elifba"><div><h2><span class="ana-ik-satir">${IKON.filiz}</span>${t('Elif-Ba')}</h2><p class="soluk">${ok >= say && say ? t('Elif-Ba tamam. Maşallah!') : t('Harfleri ve harekeleri adım adım öğren.')}</p>
        <div class="bar"><div class="iyi" style="width:${say ? Math.round(ok / say * 100) : 0}%"></div></div><small class="soluk">${ok}/${say}</small></div>
        <button class="btn" data-git="elifba">${ok ? t('▶ Devam et') : t('▶ Başla')}</button></section>`;
    }
    case 'kuran': return `<section class="kart ana-ozel ana-kuran"><div><h2><span class="ana-ik-satir">${IKON.kuran}</span>${t('Kur\'an')}</h2><p class="soluk">${s.n ? t('Kaldığın yer: {0} {1}. ayet · Sayfa {2}', esc(sureNoAdi(s.n)), s.a, s.p || S.sonSayfa || 1) : t('Okumaya başla: Fâtiha')}</p>
      <small class="soluk">${t('Bugün {0}/{1} sayfa', koBugun(), k.hedef || 0)}</small></div>
      <button class="btn" data-git="${s.n ? anaHizliHedef('kaldim') : 'sayfa|1'}">${s.n ? t('▶ Kaldığım yerden oku') : t('▶ Oku')}</button></section>`;
    case 'hizli': return `<div class="ana-hizli" role="navigation" aria-label="${t('Hızlı erişim')}">${c.hizli.map(h => `<button class="ana-hizli-oge" data-git="${esc(anaHizliHedef(h))}"><span class="ana-ik" aria-hidden="true">${ANA_HIZLI[h][0]}</span><small>${esc(t(ANA_HIZLI[h][1]))}</small></button>`).join('')}</div>`;
    case 'hizliAyar': {
      const hd = S.ayar.hedefDk || 10, ar = S.ayar.arYazi || 1, chip = (a, v, cur, ad) => `<button class="cip ${cur === v ? 'aktif' : ''}" data-ha="${a}" data-v="${v}">${ad}</button>`;
      return `<section class="kart ana-hizli-ayar"><h2>⚙️ ${t('Hızlı ayarlar')}</h2>
        <div class="tk-satir"><span>${t('Günlük hedef')}</span>${[10, 20, 30].map(d => chip('hedef', d, hd, t('{0} dk', d))).join('')}</div>
        <div class="tk-satir"><span>${t('Arapça yazı')}</span>${[[0.85, 'ع−'], [1, 'ع'], [1.2, 'ع+'], [1.4, 'ع++']].map(([v, ad]) => chip('arYazi', v, ar, ad)).join('')}</div>
        <div class="tk-satir"><span>${t('Renkli tecvid')}</span>${chip('renkli', 1, S.ayar.renkli ? 1 : 0, t('Açık'))}${chip('renkli', 0, S.ayar.renkli ? 1 : 0, t('Kapalı'))}</div>
        <div class="tk-satir"><span>${t('Durak ışıkları')}</span>${chip('durakIsik', 1, S.ayar.durakIsik === false ? 0 : 1, t('Açık'))}${chip('durakIsik', 0, S.ayar.durakIsik === false ? 0 : 1, t('Kapalı'))}</div></section>`;
    }
  }
  return '';
}
function anaKartlari(c) {
  const d = anaDuzen(); c.hizli = d.hizli;
  return d.sira.filter(id => !d.gizli.includes(id)).map(id => anaKartHTML(id, c)).join('') + `<p class="ana-duzenle-satir"><button class="link" data-git="anaDuzenle">⚙️ ${t('Ana sayfayı düzenle')}</button></p>`;
}
function anaKartBagla() {
  homeStreakBind();
  app.querySelectorAll('.ana-hizli-ayar [data-ha]').forEach(b => b.onclick = () => {
    const a = b.dataset.ha, v = +b.dataset.v;
    if (a === 'hedef') { S.ayar.hedefDk = v; gunlukPlan(true); } else if (a === 'arYazi') { S.ayar.arYazi = v; temaUygula(); } else if (a === 'renkli') S.ayar.renkli = v === 1; else if (a === 'durakIsik') S.ayar.durakIsik = v === 1;
    kaydet(); ciz();
  });
}
// Ana sayfayı düzenle: profil, kart sırası ve görünürlüğü, hızlı erişim seçimi
EKRAN.anaDuzenle = function () {
  const d = anaDuzen(), oto = !ANA_VARSAYILAN[S.ayar.anaTur];
  app.innerHTML = `${ust(t('Ana sayfayı düzenle'))}<main class="ana-duzenle">
    <section class="kart"><h3>${t('Başlangıç profili')}</h3><p class="soluk kucukyazi">${t('Ana sayfa buna göre dizilir; aşağıdan istediğini değiştirebilirsin.')}</p>
      <div class="cipler">${ANA_TURLER.map(([v, ik, ad]) => `<button class="cip ${d.tur === v && !oto ? 'aktif' : ''}" data-ana-tur="${v}">${ik} ${t(ad)}</button>`).join('')}<button class="cip ${oto ? 'aktif' : ''}" data-ana-tur="oto">${t('Otomatik')}${oto ? ' · ' + t(ANA_TURLER.find(x => x[0] === d.tur)[2]) : ''}</button></div></section>
    <section class="kart"><h3>${t('Kartlar')}</h3><ul class="ana-liste">${d.sira.map((id, i) => { const [, ik, ad] = ANA_KARTLAR.find(x => x[0] === id); const goster = !d.gizli.includes(id);
      return `<li data-ana-id="${id}"><label class="ana-goster"><input type="checkbox" ${goster ? 'checked' : ''} data-ana-gor="${id}"> <span>${ik} ${esc(t(ad))}</span></label>
        <span class="ana-sira"><button data-ana-yukari="${id}" aria-label="${t('Yukarı')}" ${i === 0 ? 'disabled' : ''}>↑</button><button data-ana-asagi="${id}" aria-label="${t('Aşağı')}" ${i === d.sira.length - 1 ? 'disabled' : ''}>↓</button></span></li>`; }).join('')}</ul></section>
    <section class="kart"><h3>${t('Hızlı erişim')}</h3><p class="soluk kucukyazi">${t('En çok kullandığın en fazla 4 şeyi seç.')} (${d.hizli.length}/4)</p>
      <div class="cipler">${Object.entries(ANA_HIZLI).map(([id, [ik, ad]]) => `<button class="cip ${d.hizli.includes(id) ? 'aktif' : ''}" data-ana-hizli="${id}">${ik} ${esc(t(ad))}</button>`).join('')}</div></section>
    <div class="satir sola"><button class="btn ikincil" id="anaSifirla">${t('Varsayılana dön')}</button><button class="btn" data-git="geri">${t('Tamam')}</button></div></main>`;
  const yaz = () => { kaydet(); ciz(); };
  app.querySelectorAll('[data-ana-tur]').forEach(b => b.onclick = () => { const v = b.dataset.anaTur; if (v === 'oto') delete S.ayar.anaTur; else S.ayar.anaTur = v; delete S.ayar.anaSira; delete S.ayar.anaGizli; delete S.ayar.hizli; yaz(); });
  app.querySelectorAll('[data-ana-gor]').forEach(b => b.onchange = () => { const g = new Set(anaDuzen().gizli); if (b.checked) g.delete(b.dataset.anaGor); else g.add(b.dataset.anaGor); S.ayar.anaGizli = [...g]; S.ayar.anaSira = anaDuzen().sira; yaz(); });
  const tasi = (id, y) => { const s = anaDuzen().sira, i = s.indexOf(id), j = i + y; if (j < 0 || j >= s.length) return; [s[i], s[j]] = [s[j], s[i]]; S.ayar.anaSira = s; S.ayar.anaGizli = anaDuzen().gizli; yaz(); };
  app.querySelectorAll('[data-ana-yukari]').forEach(b => b.onclick = () => tasi(b.dataset.anaYukari, -1));
  app.querySelectorAll('[data-ana-asagi]').forEach(b => b.onclick = () => tasi(b.dataset.anaAsagi, 1));
  app.querySelectorAll('[data-ana-hizli]').forEach(b => b.onclick = () => {
    const l = anaDuzen().hizli.slice(), id = b.dataset.anaHizli, i = l.indexOf(id);
    if (i >= 0) l.splice(i, 1); else { if (l.length >= 4) return toast(t('En fazla 4 hızlı erişim seçebilirsin.')); l.push(id); }
    S.ayar.hizli = l; S.ayar.anaSira = anaDuzen().sira; S.ayar.anaGizli = anaDuzen().gizli; yaz();
  });
  $('#anaSifirla').onclick = () => { delete S.ayar.anaTur; delete S.ayar.anaSira; delete S.ayar.anaGizli; delete S.ayar.hizli; yaz(); };
};

// Time-of-day greeting and a gentle streak celebration on the home page
function greetingByTime() { const h = new Date().getHours(); return h < 5 ? t('Hayırlı geceler') : h < 12 ? t('Hayırlı sabahlar') : h < 18 ? t('Hayırlı günler') : t('Hayırlı akşamlar'); }
const STREAK_MILESTONES = [3, 7, 14, 21, 30, 50, 100, 200, 365];
function homeStreakCard() {
  const days = (S.seri && S.seri.gun) || 0;
  if (!STREAK_MILESTONES.includes(days) || S.ayar.seriKutlama === days) return '';
  return `<section class="kart seri-kart" id="seriKart"><div><b>${t('Maşallah! {0} gündür aralıksız çalışıyorsun.', days)}</b><p class="soluk kucukyazi">${t('Küçük adımlar büyük yol alır. Devam et.')}</p></div><button class="btn kucuk ikincil" id="seriKapat">${t('Teşekkürler')}</button></section>`;
}
function homeStreakBind() { const b = $('#seriKapat'); if (b) b.onclick = () => { S.ayar.seriKutlama = (S.seri && S.seri.gun) || 0; kaydet(); ciz(); }; }

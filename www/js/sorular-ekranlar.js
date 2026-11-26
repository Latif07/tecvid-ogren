/* Kur'an Yolum — Soru bankası, yönlendirme, temel ekranlar, sürüm/yenilikler, oturum (test/alıştırma/tekrar) */
/* app.js bölündü: bu dosyalar sırayla yüklenir, aynı genel kapsamı paylaşır (bkz. TODO.md). */
'use strict';
  // ------------------------------------------------------------ soru bankası
  // Her sorunun sabit bir anahtarı var (aralıklı tekrar bu anahtarla takip edilir).
  const ELIFLER = benzersiz(Object.values(R).filter(r => r.elif).map(r => r.elif));
  function soruUret(anahtar) {
    const p = anahtar.split(':');
    if (p[0] === 'k') {
      const sure = SURE(+p[1]); if (!sure) return null;
      const r = `${sure.n}:${+p[2]}`; const etiket = (RENK[r] || [])[+p[3]]; if (!etiket) return null;
      const [bas, son, sinif] = etiket; const dogru = LEJ_AD[sinif];
      const digerleri = karistir(LEJANT.filter(([k]) => k !== sinif && k !== 's').map(x => x[1])).slice(0, 3);
      const ac = `${esc(dogru)}: ${esc(LEJ_ACIKLAMA[sinif] || '')}`;
      return { anahtar, unit: 'sure', tip: 'surekural', soru: t('İşaretli harflerde hangi tecvid kuralı var?'), dogru, secenek: karistir([dogru, ...digerleri]),
        ust: ayetParcaHTML(r, bas, son, true), ustRenkli: ayetParcaHTML(r, bas, son, false), aciklama: ac, exSes: ayetUrl(r) };
    }
    if (p[0] === 'h') return ezberSoru(anahtar);
    if (p[0] === 'p') return sayfaSoru(anahtar);
    const u = unitById(p[1]); if (!u) return null;
    if (p[0] === 'd') {
      const d = (u.dinle || [])[+p[2]]; if (!d) return null;
      const url = kelimeUrl(d.r, d.w);
      const kelime = `<div class="ayet" dir="rtl" lang="ar">${esc(d.k)}</div>`;
      return {
        anahtar, unit: u.id, tip: 'dinle', sesUrl: url, soru: t('🎧 Dinle: bu kelimede hangi harf var?'), dogru: d.h, secenek: karistir(d.g),
        ust: `<div class="dinle-kutu"><button class="sesbtn buyuk" data-ses="${url}">${t('▶ Kelimeyi dinle')}</button><button class="lejant-ac" data-goster="1">${t('Ses çalmıyorsa kelimeyi göster')}</button><div class="gizli-kelime" hidden>${kelime}</div></div>`,
        ustRenkli: `<div class="dinle-kutu"><button class="sesbtn" data-ses="${url}">${t('▶ Kelimeyi dinle')}</button></div>${kelime}`,
        aciklama: t('Kelime: {0} ({1}, {2}. kelime)', `<span class="ar">${esc(d.k)}</span>`, d.r, d.w)
      };
    }
    if (p[0] === 'c') {
      const c = u.sorular[+p[2]]; if (!c) return null;
      return { anahtar, unit: u.id, tip: 'kavram', soru: metin(c.q), dogru: c.a, secenek: karistir([c.a, ...c.w]), aciklama: c.ac ? metin(c.ac) : '' };
    }
    const ex = u.ornek[+p[2]]; if (!ex) return null; const kural = R[ex.k];
    // Testte renkler cevabı ele vermesin: soru ayetleri renksiz, cevaptan sonra renkli gösterilir
    const ust = ayetHTML(ex, true, true), ustRenkli = ayetHTML(ex, true);
    if (p[3] === 'kural') {
      const ogrenilen = ogrenilenKurallar(u).filter(k => k !== ex.k);
      const ayniGrup = karistir(ogrenilen.filter(k => R[k].grup === kural.grup));
      const diger = karistir(ogrenilen.filter(k => R[k].grup !== kural.grup));
      const yanlis = ayniGrup.concat(diger).slice(0, 3).map(k => R[k].ad);
      return { anahtar, unit: u.id, tip: 'kural', ust, ustRenkli, ex, soru: t('İşaretli yerde hangi tecvid kuralı var?'), dogru: kural.ad, secenek: karistir([kural.ad, ...yanlis]), aciklama: `${esc(kural.ad)}: ${esc(kural.ozet)} <br><i>${esc(ex.n)}</i>` };
    }
    if (p[3] === 'oku') {
      const havuz = karistir(benzersiz(dersler.flatMap(d => (d.ornek || []).filter(e => e.oku !== ex.oku && (R[e.k].grup === kural.grup)).map(e => e.oku))));
      const yedek = karistir(benzersiz(dersler.flatMap(d => (d.ornek || []).map(e => e.oku)).filter(x => x !== ex.oku)));
      const yanlis = benzersiz(havuz.concat(yedek)).slice(0, 3);
      return { anahtar, unit: u.id, tip: 'oku', ust, ustRenkli, ex, soru: t('İşaretli yer nasıl okunur?'), dogru: ex.oku, secenek: karistir([ex.oku, ...yanlis]), aciklama: `${esc(kural.ad)}: <i>${esc(ex.n)}</i>` };
    }
    if (p[3] === 'elif') {
      const yanlis = karistir(ELIFLER.filter(e => e !== kural.elif)).slice(0, 3);
      return { anahtar, unit: u.id, tip: 'elif', ust, ustRenkli, ex, soru: t('İşaretli yerde {0} var. Ne kadar uzatılır?', esc(kural.ad)), dogru: kural.elif, secenek: karistir([kural.elif, ...yanlis]), aciklama: esc(kural.ozet) };
    }
  }
  // Bir dersin bütün soru anahtarları (bu ana kadar öğrenilen kurallara göre)
  function anahtarlar(u) {
    const k = [];
    (u.sorular || []).forEach((_, i) => k.push(`c:${u.id}:${i}`));
    (u.dinle || []).forEach((_, i) => k.push(`d:${u.id}:${i}`));
    const ogrenilenSayi = ogrenilenKurallar(u).length;
    (u.ornek || []).forEach((ex, i) => {
      if (ogrenilenSayi >= 3) k.push(`e:${u.id}:${i}:kural`);
      k.push(`e:${u.id}:${i}:oku`);
      if (R[ex.k].elif && R[ex.k].grup === 'med') k.push(`e:${u.id}:${i}:elif`);
    });
    return k;
  }
  // ---- Soru seviyeleri: 1 Temel (kavram), 2 Tanıma (örnekte bulma), 3 Uygulama (okunuş, uzatma), 4 Ayırt etme (önceki derslerle karışık)
  function soruSeviye(k) {
    const p = k.split(':');
    if (p[0] === 'c') {
      const l = (window.SORU_SEVIYE || {})[p[1]]; if (l && l[+p[2]]) return l[+p[2]];
      const u = unitById(p[1]), c = u && u.sorular[+p[2]]; return c && /[؀-ۿ]/.test(c.q + ' ' + c.a + ' ' + c.w.join(' ')) ? 2 : 1;
    }
    if (p[0] === 'd') return 2;
    if (p[0] === 'e') return p[3] === 'kural' ? 2 : 3;
    return 2;
  }
  const kalip = k => { const p = k.split(':'); return p[0] === 'e' ? p[3] : p[0] === 'c' ? 'c' : p[0]; };
  const kokAnahtar = k => k.split(':').slice(0, 3).join(':');
  // Ders uzunluğuna göre soru sayısı (alıştırma 5/6/8, bölüm testi 6/8/10)
  function dersSoruSayisi(u, test) { const s = (u.sayfalar || []).length; return test ? (s <= 2 ? 6 : s === 3 ? 8 : 10) : (s <= 2 ? 5 : s === 3 ? 6 : 8); }
  // Cevabı her örnekte aynı olan kalıp (ör. med-i tabîîde "kaç elif?") sette en fazla bir kez
  function kalipSinir(u, c) { if (c === 'elif') { const l = (u.ornek || []).filter(e => R[e.k].elif && R[e.k].grup === 'med').map(e => R[e.k].elif); return new Set(l).size <= 1 ? 1 : 2; } return c === 'c' ? 3 : 2; }
  const oncekiDersler = u => acikDersler().filter(d => d.id !== u.id && U.indexOf(d) < U.indexOf(u) && d.id !== 'u0');
  // Seviye kotalarına göre seç: görülmemiş önce, sonra zayıf olan; aynı örnekten tek soru; kalıp sınırı
  function seviyeliSec(u, n, kota, oncekiler, gorulmemisOnce = true) {
    // Cevabı hep aynı olan kalıp (tabîîde "kaç elif") bir kez görüldüyse bir daha sorulmaz
    const tekCevap = kalipSinir(u, 'elif') === 1, elifGoruldu = tekCevap && anahtarlar(u).some(k => kalip(k) === 'elif' && S.srs[k]);
    const tum = anahtarlar(u).filter(k => !(elifGoruldu && kalip(k) === 'elif')), sec_ = [], kok = new Set(), kalipSay = {};
    const uygun = (k, uu) => !kok.has(kokAnahtar(k)) && (kalipSay[kalip(k)] || 0) < kalipSinir(uu, kalip(k));
    const al = k => { sec_.push(k); kok.add(kokAnahtar(k)); kalipSay[kalip(k)] = (kalipSay[kalip(k)] || 0) + 1; };
    const sirala = l => karistir(l).sort((a, b) => (gorulmemisOnce ? (!S.srs[b]) - (!S.srs[a]) : 0) || (zayiflik(b) - zayiflik(a)));
    for (const sv of [1, 2, 3]) {
      let say = 0;
      for (const k of sirala(tum.filter(k => soruSeviye(k) === sv))) { if (say >= (kota[sv] || 0)) break; if (uygun(k, u)) { al(k); say++; } }
    }
    const dort = [];
    if (kota[4] && oncekiler.length) {
      for (const k of sirala(oncekiler.flatMap(d => anahtarlar(d).filter(x => soruSeviye(x) >= 2)))) { if (dort.length >= kota[4]) break; if (!kok.has(kokAnahtar(k))) { kok.add(kokAnahtar(k)); dort.push(k); } }
    }
    // eksik kalırsa kalan sorulardan tamamla (sınırı gevşeterek)
    for (const k of sirala(tum)) { if (sec_.length + dort.length >= n) break; if (!kok.has(kokAnahtar(k))) al(k); }
    const sv = {}; sec_.forEach(k => sv[k] = soruSeviye(k)); dort.forEach(k => sv[k] = 4);
    return { anahtarlar: sec_.sort((a, b) => sv[a] - sv[b]).concat(dort).slice(0, n), sv };
  }
  // Alıştırma = ustalık turu: basitten zora, az soru, anlayınca erken bitiş, yanlışta aynı seviyeden yeni soru
  function ustalikPlan(u) {
    const n = dersSoruSayisi(u, false), tum = anahtarlar(u), gorulmemis = tum.filter(k => !S.srs[k]).length, onc = oncekiDersler(u);
    const hepsiGoruldu = gorulmemis < 2;
    const kota = hepsiGoruldu && onc.length ? { 1: 1, 2: 2, 3: 1, 4: n - 4 } : n <= 5 ? { 1: 2, 2: 2, 3: 1 } : n <= 6 ? { 1: 2, 2: 2, 3: 2 } : { 1: 2, 2: 3, 3: 2, 4: onc.length ? 1 : 0 };
    return Object.assign(seviyeliSec(u, n, kota, onc), { n, karisik: hepsiGoruldu && onc.length > 0 });
  }
  function ustalikDurum(o) {
    const c = o.cevaplar.filter(Boolean); if (c.length < Math.min(4, o.sorular.length)) return false;
    const son = c.slice(-4), dogru = son.filter(x => x.dogru).length;
    if (dogru < Math.min(3, son.length)) return false;
    const seviyeler = new Set(o.sorular.slice(0, o.ustalik.n).map(q => o.ustalik.sv[q.anahtar]).filter(Boolean));
    return [...seviyeler].every(sv => o.sorular.some((q, i) => o.cevaplar[i] && o.cevaplar[i].dogru && o.ustalik.sv[q.anahtar] === sv));
  }
  function ustalikYanlis(o, q) {   // yanlışta aynı seviyeden, bu oturumda olmayan yeni bir soru (en fazla 3 ek)
    if (!o.ustalik || o.ustalik.ek >= 3) return;
    const u = unitById(o.id), sv = o.ustalik.sv[q.anahtar], olan = new Set(o.sorular.map(x => kokAnahtar(x.anahtar)));
    const havuz = sv === 4 ? oncekiDersler(u).flatMap(anahtarlar).filter(k => soruSeviye(k) >= 2) : anahtarlar(u).filter(k => soruSeviye(k) === sv);
    const k = karistir(havuz).sort((a, b) => (!S.srs[b]) - (!S.srs[a])).find(x => !olan.has(kokAnahtar(x)));
    const yeni = k && soruUret(k); if (!yeni) return;
    o.sorular.push(yeni); o.anahtarlar.push(k); o.ustalik.sv[k] = sv; o.ustalik.ek++;
  }
  // Zayıflık puanı: düşük kutu ve çok yanlış önce gelir
  function zayiflik(k) { const s = S.srs[k]; if (!s) return 2.5; return (6 - s.kutu) + (s.yanlis || 0) * 0.7 - (s.dogru || 0) * 0.2; }
  function sec(havuz, n, oncelik) {
    havuz = karistir(benzersiz(havuz));
    if (oncelik) havuz.sort((a, b) => zayiflik(b) - zayiflik(a) + (Math.random() - 0.5));
    // aynı örnekten iki soru gelmesin
    const secilen = [], gorulen = new Set();
    for (const k of havuz) { const kok = k.split(':').slice(0, 3).join(':'); if (gorulen.has(kok)) continue; gorulen.add(kok); secilen.push(k); if (secilen.length >= n) break; }
    for (const k of havuz) { if (secilen.length >= n) break; if (!secilen.includes(k)) secilen.push(k); }
    return karistir(secilen);
  }
  function srsGuncelle(k, dogruMu) {
    const s = S.srs[k] || { kutu: 0, dogru: 0, yanlis: 0 };
    if (dogruMu) { s.kutu = Math.min(6, s.kutu + 1); s.dogru++; s.vade = simdi() + ARALIK[s.kutu] * GUN; }
    else { s.kutu = 1; s.yanlis++; s.vade = simdi() + 10 * 60000; }
    s.son = simdi(); S.srs[k] = s;
  }
  function vadesiGelenler() {
    const acik = new Set(acikDersler().map(u => u.id));
    return Object.keys(S.srs).filter(k => (k.startsWith('k:') || acik.has(k.split(':')[1])) && S.srs[k].vade <= simdi());
  }

  // ------------------------------------------------------------ test başlıkları (dilden bağımsız kimlik)
  function baslikBul(h) {
    const k = h.kimlik || '';
    const [tur, id, a, b] = k.split('|');
    if (tur === 'bolum' || tur === 'ara' || tur === 'final') { const u = unitById(id); if (u) return u.ad; }
    if (tur === 'alistirma') { const u = unitById(id); if (u) return t('Alıştırma: ') + u.ad; }
    if (tur === 'tekrar') return t('Günlük tekrar');
    if (tur === 'sure') return t('Kural bul: {0}', sureNoAdi(+id));
    if (tur === 'hizli') return t('Hızlı test');
    if (tur === 'ezber') return t('Ezber yoklaması');
    if (tur === 'sayfa') return t('Sayfa başı / sonu yoklaması');
    if (tur === 'zayif') return t('Zayıf konular testi');
    if (tur === 'karma') return t('Karma test ({0} bölüm, {1} soru)', a, b);
    return h.baslik;
  }

  // ------------------------------------------------------------ yönlendirme
  let ekranYigini = [];
  function git(ad, ...arg) { ekranYigini.push([ad, arg]); ciz(); window.scrollTo(0, 0); }
  function geri() { if (oturum && !oturum.bitti && !oturum.sonsuz && !confirm(t('Testten çıkmak istiyor musun? Kaldığın yerden sonra devam edebilirsin.'))) return; oturum = null; if (ekranYigini.length > 1) ekranYigini.pop(); ciz(); window.scrollTo(0, 0); }
  const evKok = () => cocukMu() ? 'cocuk' : 'ana';
  function anaSayfa() { oturum = null; GUNLUK_ADIM = null; ekranYigini = [[evKok(), []]]; ciz(); window.scrollTo(0, 0); }
  function ekranDegistir(ad, ...arg) { ekranYigini[ekranYigini.length - 1] = [ad, arg]; ciz(); window.scrollTo(0, 0); }
  function ciz() {
    if (kayitci) kayitDurdur();
    if (typeof OKU_KAYIT !== 'undefined' && OKU_KAYIT.r && OKU_KAYIT.r.state !== 'inactive') { const r = OKU_KAYIT.r; r.onstop = () => { try { r.stream.getTracks().forEach(x => x.stop()); } catch (e) { } }; r.stop(); OKU_KAYIT.r = null; }
    const [ad, arg] = ekranYigini[ekranYigini.length - 1];
    // Ekran değişince sûrenin "tamamını dinle" çalması dursun
    const anahtar = ad + '|' + JSON.stringify(arg);
    document.querySelectorAll('.ko-menu').forEach(x => x.remove());
    if (koSure && anahtar !== ciz.son) { koSure.iptal = true; koSure = null; if (ses) { ses.pause(); ses = null; } }
    if (ad !== 'sayfa') clearTimeout(EKRAN.sayfa && EKRAN.sayfa._zaman);
    if (sureCalma && anahtar !== ciz.son) { sureCalma.iptal = true; sureCalma = null; if (ses) { ses.pause(); ses = null; } }
    if (anahtar !== ciz.son && window.Konfeti) window.Konfeti.durdur();
    if (anahtar !== ciz.son && window.Sesli) window.Sesli.sus();
    if (anahtar !== ciz.son) { if (ses) sesDurdur(); else dugmeBirak(); if (window.HarfSes && HarfSes.dur) HarfSes.dur(); }
    if (anahtar !== ciz.son && MESK.kayit) { const r_ = MESK.kayit; MESK.kayit = null; r_.onstop = () => { try { r_.stream.getTracks().forEach(x => x.stop()); } catch (e) { } }; r_.state !== 'inactive' && r_.stop(); }
    if (anahtar !== ciz.son) document.querySelectorAll('.sozluk-pencere').forEach(x => x.remove());   // sözlük penceresi ekranla birlikte kapanır
    ciz.son = anahtar;
    EKRAN[ad](...arg);
    gunlukSerit(ad);
    altMenu(ad);
  }
  // ------------------------------------------------------------ alt sekme çubuğu (bölümler)
  // Çizgi ikonlar (yetişkin tarafta emoji yerine; karar: toplanti-2026-11-19-arayuz-sadelestirme.md)
  const IK = (d, ek = '') => `<svg class="ik" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${ek}>${d}</svg>`;
  const IKON = {
    bugun: IK('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    tecvid: IK('<path d="M4 19V5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2"/><path d="M8 7h7M8 11h5"/>'),
    kuran: IK('<path d="M2 5c3-1 6-1 10 1 4-2 7-2 10-1v14c-3-1-6-1-10 1-4-2-7-2-10-1z"/><path d="M12 6v14"/>'),
    ben: IK('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
    test: IK('<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/>'),
    ara: IK('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
    mik: IK('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
    pusula: IK('<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>'),
    minare: IK('<path d="M7 21V9a5 5 0 0 1 10 0v12"/><path d="M12 4V2M4 21h16"/>'),
    el: IK('<path d="M8 13V6a2 2 0 0 1 4 0v5M12 11V5a2 2 0 0 1 4 0v8c0 4-2 8-6 8s-6-3-6-6v-2a2 2 0 0 1 4 0"/>'),
    gorunum: IK('<circle cx="12" cy="12" r="9"/><path d="M12 3v18M12 3a9 9 0 0 1 0 18" fill="currentColor" fill-opacity=".15"/>'),
    ses: IK('<path d="M11 5L6 9H3v6h3l5 4z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>'),
    zil: IK('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/>'),
    dil: IK('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'),
    bulut: IK('<path d="M20 17.5A4.5 4.5 0 0 0 17 9h-1A6 6 0 1 0 5 15.9"/><path d="M12 12v8M9 17l3 3 3-3"/>'),
    ok: IK('<path d="M9 6l6 6-6 6"/>'),
    tekrar: IK('<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>'),
    ezber: IK('<path d="M5 3h11a3 3 0 0 1 3 3v15l-4-3-4 3-4-3-3 3V6a3 3 0 0 1 3-3"/><path d="M9 8h6"/>'),
    not: IK('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
    filiz: IK('<path d="M12 21v-8"/><path d="M12 13c0-4 3-6 7-6 0 4-3 6-7 6z"/><path d="M12 15c0-3-2-5-6-5 0 3 2 5 6 5z"/>'),
    takvim: IK('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    kart: IK('<rect x="3" y="7" width="14" height="14" rx="2"/><path d="M7 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2"/>'),
    kulaklik: IK('<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="7" rx="1.5"/><rect x="17" y="14" width="4" height="7" rx="1.5"/>'),
    liste: IK('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
    grafik: IK('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    alistirma: IK('<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
    yerimi: IK('<path d="M6 3h12v18l-6-4-6 4z"/>'),
    arti: IK('<path d="M12 5v14M5 12h14"/>'),
    paylas: IK('<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>'),
    yazdir: IK('<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>'),
    goz: IK('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>'),
    onay: IK('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.5"/>'),
    bulb: IK('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>'),
  };
  // [ekran, ikon, ad, aynı sekmeye ait diğer kök ekranlar]
  const SEKMELER_B = [['ana', IKON.bugun, 'Bugün'], ['tecvid', IKON.tecvid, 'Tecvid', ['mufredat']], ['sureler', IKON.kuran, 'Kur\'an', ['ezber', 'kuranDinle']], ['profil', IKON.ben, 'Ben']];
  const SEKMELER_C = [['cocuk', '🗺️', 'Yolculuk'], ['cocukIlerleme', '⭐', 'Yıldızlarım'], ['profil', '👨‍👩‍👧', 'Büyükler']];
  const sekmeler = () => cocukMu() ? SEKMELER_C : SEKMELER_B;
  function altMenu(ad) {
    const SEKMELER = sekmeler();
    document.body.classList.toggle('cocuk-modu', cocukMu());
    const sekmeMi = x => x[0] === ad || (x[3] || []).includes(ad);
    const kok = ekranYigini.length === 1 && SEKMELER.some(sekmeMi) && !oturum;
    document.body.classList.toggle('sekmeli', kok);
    if (!kok) return;
    const g = app.querySelector('.ust .geri'); if (g) g.outerHTML = '<img class="logo" src="icons/icon-192.png" alt="">';
    app.insertAdjacentHTML('beforeend', `<nav class="alt-menu n${SEKMELER.length}">${SEKMELER.map(x => `<button class="${sekmeMi(x) ? 'aktif' : ''}" data-sekme-git="${x[0]}" ${sekmeMi(x) ? 'aria-current="page"' : ''}><span>${x[1]}</span>${t(x[2])}</button>`).join('')}</nav>`);
    app.querySelectorAll('[data-sekme-git]').forEach(b => b.onclick = async () => {
      if (b.classList.contains('aktif') && b.dataset.sekmeGit === ad) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      if (cocukMu() && b.dataset.sekmeGit === 'profil' && !(await window.ebeveynKilidi())) return;   // büyükler bölümü kilitli
      GUNLUK_ADIM = null; ekranYigini = [[b.dataset.sekmeGit, []]]; ciz(); window.scrollTo(0, 0);
    });
  }
  window.addEventListener('popstate', () => { geri(); history.pushState(null, ''); });
  history.pushState(null, '');
  try {
    const CapApp = window.capEklenti('App');
    if (CapApp) CapApp.addListener('backButton', () => { if (ekranYigini.length > 1) geri(); else if (ekranYigini[0][0] !== evKok() && !['hosgeldin', 'kimCalisiyor'].includes(ekranYigini[0][0])) anaSayfa(); else CapApp.exitApp(); });
  } catch (e) { /* tarayıcıda yok */ }

  const ust = (baslik, geriVar = true, sag = '') => `<header class="ust">${geriVar ? `<button class="geri" data-git="geri" aria-label="${t('Geri')}">‹</button>` : '<img class="logo" src="icons/icon-192.png" alt="">'}<h1>${baslik}</h1>${sag}</header>`;
  app.addEventListener('click', e => {
    const g = e.target.closest('[data-git]'); if (!g) return;
    const hedef = g.dataset.git;
    if (hedef === 'geri') return geri();
    if (hedef === 'ana') return anaSayfa();
    const [ad, ...arg] = hedef.split('|'); git(ad, ...arg);
  });

  // ------------------------------------------------------------ ekranlar
  const EKRAN = {};

  // iPhone/iPad'de Safari'den açılınca: ana ekrana ekleme yardımı (uygulama gibi açılsın, internetsiz çalışsın)
  // Android uygulaması: günlük hatırlatma bir kez sorulur (büyük profillerde; çocukta karar velinin)
  function hatirlatmaKarti() {
    if (!LN() || cocukMu() || (S.ayar.hatirlat && S.ayar.hatirlat.acik) || S.ayar.hatirSoruldu) return '';
    return `<section class="kart hatir-kart" style="margin-bottom:14px"><h2>${t('🔔 Her gün hatırlatma gelsin mi?')}</h2>
      <p>${t('Seçtiğin saatte kısa bir ayet ya da hadisle hatırlatırız. O gün zaten çalıştıysan gelmez.')}</p>
      <div class="satir sola"><button class="btn" id="hatirEvet">${t('Evet, akşam 20:00')}</button><button class="btn ikincil" id="hatirSaatSec">${t('Saati seç')}</button><button class="btn ikincil" id="hatirHayir">${t('Hayır')}</button></div></section>`;
  }
  // PWA: Android/masaüstü Chrome'da "Uygulama olarak yükle" (beforeinstallprompt). APK'da ve zaten yüklüyse görünmez.
  const yerelUygulama = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  const pwaYuklu = () => window.__yuklendi || window.navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  const yuklenebilir = () => !!window.__yukleIstegi && !yerelUygulama() && !pwaYuklu();
  async function pwaYukle() {
    const e = window.__yukleIstegi; if (!e) return;
    try { await e.prompt(); const s = await e.userChoice; if (s && s.outcome === 'accepted') { window.__yukleIstegi = null; toast(t('Yükleniyor… Ana ekranında Kur\'an Yolum simgesi görünecek.')); } } catch (x) { }
    ciz();
  }
  function yukleKarti() {
    let kapali = false; try { kapali = localStorage.getItem('tecvid-ogren.yukle') === '1'; } catch (e) { }
    if (!yuklenebilir() || kapali) return '';
    return `<section class="kart yukle-kart" style="margin-bottom:14px"><div class="yukle-ust"><img src="icons/icon-192.png" alt="" width="48" height="48"><div><h2>${t('📲 Uygulama olarak yükle')}</h2>
      <p>${t('Ana ekranına simge eklenir; tam ekran açılır, dersler internetsiz de çalışır.')}</p></div></div>
      <div class="satir sola"><button class="btn" id="pwaYukle">${t('Yükle')}</button><button class="btn ikincil" id="pwaSonra">${t('Sonra')}</button></div></section>`;
  }
  // Yükleme sinyali sonradan gelirse ana sayfa/profil yenilensin
  window.addEventListener('yuklenebilir', () => { if (ekranYigini.length && ['ana', 'profil'].includes(ekranYigini[ekranYigini.length - 1][0])) ciz(); });
  function iosKurKarti() {
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const kurulu = window.navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
    let kapali = false; try { kapali = localStorage.getItem('tecvid-ogren.ios') === '1'; } catch (e) { }
    if (!ios || kurulu || kapali || (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())) return '';
    return `<section class="kart hesap-uyari" style="margin-bottom:14px"><div><h2>${t('📲 iPhone\'a uygulama gibi ekle')}</h2>
      <ol style="padding-left:20px;margin:6px 0"><li>${t('Safari\'de <b>Paylaş</b> düğmesine dokun (kare ve yukarı ok; görmüyorsan önce <b>⋯</b> düğmesine dokun).')}</li><li>${t('<b>Ana Ekrana Ekle</b>\'yi seç, sonra <b>Ekle</b>\'ye dokun.')}</li><li>${t('Artık ana ekrandaki <b>Kur\'an Yolum</b> simgesinden aç.')}</li></ol>
      <p class="soluk kucukyazi">${t('Ana ekrandan açınca tam ekran çalışır ve dersler internetsiz de açılır.')}</p></div>
      <div class="satir sola"><button class="btn ikincil" id="iosKapat">${t('Tamam')}</button></div></section>`;
  }

  function bolumListesi(l) {
    let liste = '';
    (l || U).forEach(u => {
      const acik = acikMi(u), ok = gecti(u.id), il = S.ilerleme[u.id];
      const durum = ok && il.atla && il.oner && !il.deneme ? `<span class="rozet simdi">${t('Önerilir')}</span>` : ok && il.atla && !il.deneme ? `<span class="rozet ok">${t('Atlandı')}</span>` : ok ? `<span class="rozet ok">✓ ${yuzdeStr(il.en)}</span>` : acik ? `<span class="rozet simdi">${t('Şimdi')}</span>` : `<span class="rozet kilit">🔒</span>`;
      liste += `<button class="bolum ${acik ? '' : 'kilitli'} ${u.ara ? 'ara' : ''}" data-git="${u.ara ? 'sinavGiris|' + u.id : 'ders|' + u.id}">
        <span class="ikon">${u.ikon}</span><span class="bad"><small>${u.ara ? (u.final ? t('Final') : t('Ara sınav')) : (dersler.indexOf(u) ? t('Bölüm {0}', dersler.indexOf(u)) : t('Hazırlık'))}</small>${esc(u.ad)}</span>${durum}</button>`;
    });
    return liste;
  }
  const hkGiris = () => window.HARFKART ? `<button class="ders-ince hkt-giris" data-git="harfKartlari"><span>🔤 ${t('Harf kartları · Mahreç şeması')}</span><b>›</b></button>` : '';
  // Tecvid sekmesi: kısayollar + bölüm grupları (açılır); Testler sekmesi buraya taşındı
  EKRAN.tecvid = function () {
    const gecilen = U.filter(u => gecti(u.id)).length, siradaki = U.find(u => !gecti(u.id));
    const kutu = (git_, ik, ad) => `<button class="tecvid-kutu" data-git="${git_}"><span>${ik}</span>${ad}</button>`;
    const beginnerTecvid = anaTur() === 'sifirdan' && !gecti('e1');   // complete beginners: tajweed sections stay folded until Elif-Ba is done
    app.innerHTML = `${ust(t('Tecvid'))}<main>
      <p class="soluk tecvid-ozet">${t('{0} / {1} bölüm geçildi', gecilen, U.length)}</p>
      <button class="ders-ince eb-giris" data-git="elifba"><span>${IKON.filiz} ${t('Elif-Ba odak modu: sıfırdan, adım adım')}</span><b>›</b></button>
      <nav class="tecvid-kutular">
        ${window.HARFKART ? kutu('harfKartlari', '<b class="ar">ب</b>', t('Harf kartları')) : ''}
        ${window.KARTLAR ? kutu('kartlar', IKON.kart, t('Hap kartlar')) : ''}
        ${kutu('testler', IKON.test, t('Testler'))}
        ${kutu('sureTecvidSec', IKON.pusula, t('Sûre sûre tecvid'))}
        ${kutu('kuralAra', IKON.ara, t('Kural ara'))}
      </nav>
      ${beginnerTecvid ? `<details class="kart tecvid-hepsi"><summary><b>${t('Tüm tecvid bölümleri')}</b> <small class="soluk">${t('Elif-Ba\'dan sonra')}</small></summary>` : ''}
      ${GRUPLAR.map(([ad, idler]) => { const l = idler.map(unitById).filter(Boolean), g = l.filter(u => gecti(u.id)).length, simdi = siradaki && idler.includes(siradaki.id);
        return `<details class="kart bolum-grup ${simdi ? 'simdi' : ''}" data-grup-ad="${esc(ad)}" ${(EKRAN.tecvid._acik ? EKRAN.tecvid._acik.has(ad) : simdi) ? 'open' : ''}><summary><span class="bad"><b>${ad}</b>${simdi ? `<small>${t('Şu an buradasın')}</small>` : ''}</span><span class="${g === l.length ? 'yesil' : 'soluk'} kucukyazi">${g} / ${l.length}${g === l.length ? ' ✓' : ''}</span></summary>
          ${idler.includes('m1') ? hkGiris() : ''}<div class="bolumler">${bolumListesi(l)}</div></details>`; }).join('')}
      <p class="soluk kucukyazi">${t('🔒 Kilitli bölümleri de açabilirsin: konuyu biliyorsan doğrudan testine gir, {0} alınca bölüm açılır.', yuzdeStr(GECME))}</p>${beginnerTecvid ? '</details>' : ''}
    </main>`;
    app.querySelectorAll('details.bolum-grup').forEach(d => d.addEventListener('toggle', () => {
      if (!EKRAN.tecvid._acik) EKRAN.tecvid._acik = new Set(Array.from(app.querySelectorAll('details.bolum-grup[open]')).map(x => x.dataset.grupAd));
      const ad = d.dataset.grupAd; if (d.open) EKRAN.tecvid._acik.add(ad); else EKRAN.tecvid._acik.delete(ad);
    }));
  };
  EKRAN.mufredat = function () {
    app.innerHTML = `${ust(t('Müfredat'))}<main>
      <p class="soluk kucukyazi">${t('🔒 Kilitli bölümleri de açabilirsin: konuyu biliyorsan doğrudan testine gir, {0} alınca bölüm açılır.', yuzdeStr(GECME))}</p>
      ${GRUPLAR.map(([ad, idler]) => { const l = idler.map(unitById).filter(Boolean); return `<h2 class="baslik">${ad} <small class="soluk">${l.filter(u => gecti(u.id)).length}/${l.length}</small></h2>${idler.includes('m1') ? hkGiris() : ''}<div class="bolumler">${bolumListesi(l)}</div>`; }).join('')}
    </main>`;
  };
  // ------------------------------------------------------------ sürüm ve yenilikler
  const SRM = () => window.SURUMLER || { SURUM: '', YAYIN: '', LISTE: [] };
  const yerli = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  const surumYazi = () => { const v = SRM(); return t('Sürüm {0}', v.SURUM) + (yerli() ? ' · Android' : ' · web' + (v.YAYIN ? ' ' + v.YAYIN : '')); };
  EKRAN.yenilikler = function () {
    const v = SRM();
    app.innerHTML = `${ust(t('🆕 Yenilikler'))}<main>
      <section class="kart"><p><b>${esc(surumYazi())}</b></p><p class="soluk kucukyazi">${t('Her sürümde nelerin değiştiği. Test ederken hangi sürümde olduğunu buradan kontrol et.')}</p></section>
      ${v.LISTE.map((x, i) => `<article class="kart yenilik ${x.s === v.SURUM ? 'simdiki' : ''}">
        <div class="satir" style="justify-content:space-between"><h2 style="margin:0">${t('Sürüm {0}', esc(x.s))}</h2><span class="soluk kucukyazi">${new Date(x.t + 'T12:00').toLocaleDateString(DIL === 'en' ? 'en-GB' : 'tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
        ${x.durum ? `<span class="rozet uyari">${esc(t(x.durum))}</span>` : x.s === v.SURUM ? `<span class="rozet ok">${t('Şu anki sürüm')}</span>` : ''}
        <ul>${x.l.map(m => `<li>${esc(m)}</li>`).join('')}</ul></article>`).join('')}
    </main>`;
  };
  EKRAN.ana = function () {
    const toplam = U.length, gecilen = U.filter(u => gecti(u.id)).length;
    const vade = vadesiGelenler().length;
    const siradaki = U.find(u => !gecti(u.id));
    const k = B() && B().kullanici();
    const hesapUyari = B() && B().hazir && !k && !S.hesapUyariKapali;
    app.innerHTML = `${ust(t('Kur\'an Yolum'), false, `<button class="hesapbtn ${k ? 'resimli' : ''}" data-git="hesap" aria-label="${t('Hesap')}">${k ? hesapResmi(k, ((AKTIF().ad || k.displayName || k.email || '?')[0] || '?').toUpperCase()) : t('Giriş')}</button>`)}
      <main>
        <p class="selam"><b>${AKTIF().ad ? t('Selâmün aleyküm, {0}', esc(AKTIF().ad)) : t('Selâmün aleyküm')}</b><small>${greetingByTime()} · ${new Date().toLocaleDateString(DIL === 'en' ? 'en-GB' : 'tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</small></p>
        ${tanitimKarti()}${yukleKarti()}${hatirlatmaKarti()}${haftaOzetKarti()}
        <div id="odevYer"></div>
        ${homeStreakCard()}
        ${anaKartlari({ gecilen, toplam, siradaki, vade })}
        ${hesapUyari ? `<section class="kart hesap-uyari" style="margin-top:14px"><div><h2>${t('☁️ İlerlemen kaybolmasın')}</h2><p>${t('Giriş yap; puanların, geçmişin ve kilitler hesabında saklansın, başka telefonda da devam et.')}</p></div>
          <div class="satir sola"><button class="btn" data-git="hesap">${t('Giriş yap / Hesap aç')}</button><button class="btn ikincil" id="uyariKapat">${t('Sonra')}</button></div></section>` : ''}
        ${iosKurKarti()}
        <p class="surum-satir"><button class="link" data-git="yenilikler">${esc(surumYazi())} · ${t('Yenilikler')} ›</button></p>
      </main>`;
    odevKartiDoldur(); yarimBagla(); gununSorusuBagla(); anaKartBagla();
    app.querySelectorAll('[data-gunluk-basla]').forEach(x => x.onclick = ev => { ev.stopPropagation(); gunlukAdimBaslat(+x.dataset.gunlukBasla); });
    const hk_ = $('#haftaKapat'); if (hk_) hk_.onclick = () => { S.ayar.haftaKartKapali = Date.now(); kaydet(); ciz(); };
    const tk = $('#tanitimKapat'); if (tk) tk.onclick = () => { S.ayar.tanitim = 1; kaydet(); ciz(); };
    const he = $('#hatirEvet'); if (he) he.onclick = async () => { S.ayar.hatirSoruldu = true; S.ayar.hatirlat = { acik: true, saat: '20:00' }; kaydet();
      const ok = await hatirlatmaKur(true); if (!ok) { S.ayar.hatirlat.acik = false; kaydet(); toast(t('Bildirim izni verilmedi. Telefon ayarlarından Kur\'an Yolum için bildirimlere izin ver.')); } else toast(t('Hatırlatma kuruldu: her gün {0}', '20:00')); ciz(); };
    const hss = $('#hatirSaatSec'); if (hss) hss.onclick = () => { S.ayar.hatirSoruldu = true; kaydet(); AYAR_ACIK.add('3'); git('ayarlar'); };
    const hh = $('#hatirHayir'); if (hh) hh.onclick = () => { S.ayar.hatirSoruldu = true; kaydet(); toast(t('İstersen Ayarlar > Günlük hatırlatma\'dan açabilirsin.')); ciz(); };
    const py = $('#pwaYukle'); if (py) py.onclick = pwaYukle;
    const ps = $('#pwaSonra'); if (ps) ps.onclick = () => { try { localStorage.setItem('tecvid-ogren.yukle', '1'); } catch (e) { } toast(t('İstersen Profil > Uygulama olarak yükle\'den yükleyebilirsin.')); ciz(); };
    const ik = $('#iosKapat'); if (ik) ik.onclick = () => { try { localStorage.setItem('tecvid-ogren.ios', '1'); } catch (e) { } ciz(); };
    const uk = $('#uyariKapat'); if (uk) uk.onclick = () => { S.hesapUyariKapali = true; kaydet(); ciz(); };
  };

  // ---- terim sözlüğü: sayfadaki terimlerin ilk geçtiği yer dokunulabilir olur
  let SOZ_RE = null;
  function sozlukBagla(kok) {
    const L = window.SOZLUK || []; if (!L.length) return;
    if (!SOZ_RE) {
      const al = []; L.forEach((e, i) => (DIL === 'en' ? e.en : e.tr).forEach(a => { al.push([a, i]); al.push([a[0].toLocaleUpperCase(DIL === 'en' ? 'en' : 'tr') + a.slice(1), i]); }));
      al.sort((x, y) => y[0].length - x[0].length);
      SOZ_RE = { re: new RegExp('(?<![\\p{L}\\-])(' + al.map(x => x[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![\\p{L}])', 'gu'), harita: new Map(al) };
    }
    const kullanildi = new Set(), w = document.createTreeWalker(kok, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentNode.closest('.ar,button,.terim') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    const dugum = []; while (w.nextNode()) dugum.push(w.currentNode);
    dugum.forEach(n => {
      const m = n.nodeValue; let son = 0, deg = false; const f = document.createDocumentFragment(); SOZ_RE.re.lastIndex = 0; let x;
      while ((x = SOZ_RE.re.exec(m))) { const i = SOZ_RE.harita.get(x[1]); if (i == null || kullanildi.has(i)) continue; kullanildi.add(i); deg = true;
        f.append(m.slice(son, x.index)); const b = document.createElement('button'); b.className = 'terim'; b.dataset.terim = i; b.textContent = x[1]; f.append(b); son = x.index + x[1].length; }
      if (deg) { f.append(m.slice(son)); n.replaceWith(f); }
    });
    kok.querySelectorAll('.terim').forEach(b => b.onclick = () => {
      const e = L[+b.dataset.terim]; document.querySelectorAll('.sozluk-pencere').forEach(x => x.remove());
      const d = document.createElement('div'); d.className = 'sozluk-pencere'; d.setAttribute('role', 'dialog');
      d.innerHTML = `<div><b>📘 ${esc(b.textContent)}</b><p>${esc(e.a[DIL === 'en' ? 1 : 0])}</p></div><button aria-label="${t('Kapat')}">✕</button>`;
      document.body.appendChild(d); d.querySelector('button').onclick = () => d.remove();
      setTimeout(() => document.addEventListener('click', function k(ev) { if (!d.contains(ev.target)) { d.remove(); document.removeEventListener('click', k); } }), 0);
    });
  }
  function hizliKontrolSoru(u, i) {
    const c = EKRAN.ders._hk;
    if (c && c.id === u.id && c.i === i) return c.q;
    const j = (i * 7 + Math.floor(Math.random() * u.sorular.length)) % u.sorular.length;
    const q = soruUret(`c:${u.id}:${j}`);
    EKRAN.ders._hk = { id: u.id, i, q };
    return q;
  }
  // Ders görünümü (defter kartları): "Tek bakışta" kural kartları, uzatma miktarı çubuğu, aynı konudaki derslerin çipleri
  const elifCubugu = es => {
    const m = /^(\d+)(?:[–-](\d+))?\s*elif(?:\s*\(yaygın:\s*(\d+)(?:[–-](\d+))?\))?/.exec(es || ''); if (!m) return '';
    const a = +m[1], b = +(m[2] || m[1]), y1 = m[3] ? +m[3] : 0, y2 = m[4] ? +m[4] : y1;
    return `<div class="elif-bar" role="img" aria-label="${t('Uzatma miktarı')}: ${esc(es)}">${[1, 2, 3, 4, 5].map(i => `<span class="${i >= a && i <= b ? 'var' : ''} ${y1 && i >= y1 && i <= y2 ? 'yaygin' : ''}">${i}</span>`).join('')}<b>${t('elif')}</b></div>`;
  };
  const tekBakista = u => {
    const l = (u.kurallar || []).map(k => R[k]).filter(Boolean); if (!l.length) return '';
    return `<section class="tek-bakista" aria-label="${t('Tek bakışta')}">${l.map(r => `<article class="tb-kart tb-${esc(r.grup || 'med')}"><span class="tb-raptiye" aria-hidden="true"></span><h3>${esc(r.ad)}</h3><p>${esc(r.ozet)}</p>${r.elif ? `<div class="tb-elif"><small>${t('Uzatma miktarı')}</small>${elifCubugu(r.elif)}<p class="soluk kucukyazi">${esc(r.elif)}</p></div>` : ''}</article>`).join('')}</section>`;
  };
  const konuCipleri = id => {
    const g = GRUPLAR.find(([, l]) => l.includes(id)); if (!g || g[1].length < 2) return '';
    const kisa = u => u.ad.split(/[:(]/)[0].trim();
    return `<nav class="konu-cipleri" aria-label="${esc(g[0])}"><small>${esc(g[0])}</small><div>${g[1].map(k => { const x = unitById(k); return x ? `<button class="konu-cip ${k === id ? 'aktif' : ''} ${gecti(k) ? 'tamam' : ''}" data-konu="${k}" ${k === id ? 'aria-current="true"' : ''}>${esc(kisa(x))}${gecti(k) ? ' ✓' : ''}</button>` : ''; }).join('')}</div></nav>`;
  };
  EKRAN.ders = function (id, sekme = 'ders') {
    const u = unitById(id);
    const okunan = S.okunan[id] || 0;
    const hepsiOkundu = okunan >= u.sayfalar.length;
    const il = S.ilerleme[id];
    const sekmeler = [['ders', t('📖 Ders')], ['ornek', t('🔍 Örnekler')], ['alistirma', t('✍️ Alıştırma')], ['test', t('✅ Test')]]
      .filter(s => s[0] !== 'ornek' || (u.ornek && u.ornek.length));
    let icerik = '';
    const kilitli = !acikMi(u), gecildi = gecti(id);
    // Ders metni ilk ekranda görünsün: kısa anlatım ve "biliyorum, teste gir" tek ince satır
    const secim = gecildi ? '' : `<button class="ders-ince" data-git="testBasla|bolum|${id}"><span>${t('Bu konuyu biliyor musun?')}</span><b>${t('Teste gir ›')}</b></button>`;
    if (sekme === 'ders') {
      const i = Math.min(+(EKRAN.ders._sayfa && EKRAN.ders._sayfa[id]) || 0, u.sayfalar.length - 1);
      const s = u.sayfalar[i];
      if (i + 1 > okunan) { S.okunan[id] = i + 1; kaydet(); }
      // Yalnız dersin son sayfasında tek bir "Kendini dene" sorusu (karar-2026-11-16-cevap-sende-yerleri)
      const hk = i > 0 && i === u.sayfalar.length - 1 && (u.sorular || []).length ? hizliKontrolSoru(u, i) : null;
      const hkSay = hikayeKartlar(u).length;
      const hikayeGir = `<button class="ders-ince hikaye-gir" data-git="hikaye|${id}|0"><span>${u.ikon} ${t('Kısa anlatım')} · ${t('{0} kart, ~{1} dk', hkSay, Math.max(1, Math.round(hkSay / 3)))}</span><b>›</b></button>`;
      icerik = (i === 0 ? `<p class="besmele" lang="ar" dir="rtl">بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</p>${tekBakista(u)}` : '') + `<article class="kart sayfa defter"><div class="sayac">${i + 1} / ${u.sayfalar.length}</div><h2>${esc(s.t)}</h2>${durakIsik(s.h)}</article><div class="satir sola"><button class="lejant-ac" id="dersNot">${IKON.not} ${t('Not')}${notBul('ders', id + ':' + i) ? ' •' : ''}</button></div>${id === 'u19' ? durakLejant() : ''}${mahrecHTML(id, i)}${['e1', 'm1', 'm2', 'm3'].includes(id) ? hkGiris() : ''}
        ${hk ? `<section class="kart hizli-kontrol"><p class="hk-baslik">${t('🎯 Kendini dene')} <small class="soluk">· ${t('Dersi bitirmeden')}</small></p><p><b>${hk.soru}</b></p><div class="secenekler">${hk.secenek.map((x, j) => `<button class="secenek" data-hk="${j}">${metin(x)}</button>`).join('')}</div><div id="hkSonuc"></div></section>` : ''}
        <div class="satir">
          <button class="btn ikincil" data-sayfa="${i - 1}" ${i === 0 ? 'disabled' : ''}>${t('‹ Önceki')}</button>
          ${i < u.sayfalar.length - 1 ? `<button class="btn" data-sayfa="${i + 1}">${t('Sonraki ›')}</button>` : `<button class="btn" data-sekme="${u.ornek && u.ornek.length ? 'ornek' : 'alistirma'}">${u.ornek && u.ornek.length ? t('Örneklere geç ›') : t('Alıştırmaya geç ›')}</button>`}
        </div>${i === 0 ? `<div class="ders-inceler">${hikayeGir}${kartUnit(id) ? `<button class="ders-ince" data-git="kart|${kartUnit(id).id}"><span>${IKON.kart} ${t('Bu konunun kartı')}</span><b>›</b></button>` : ''}${secim}</div>` : ''}${i === u.sayfalar.length - 1 && kartUnit(id) ? `<button class="ders-ince" data-git="kart|${kartUnit(id).id}"><span>${IKON.kart} ${t('Bu konunun kartı')}</span><b>›</b></button>` : ''}`;
    } else if (sekme === 'ornek') {
      icerik = `<div class="satir sola"><button class="lejant-ac" id="lejantAc">🎨 ${S.ayar.renkli ? t('Renklerin anlamı') : t('Renkli tecvid kapalı')}</button><button class="lejant-ac" data-git="kariSec">🎙️ ${esc(kari().ad)}</button></div>
        <div id="lejant" hidden class="kart kucuk">${lejantHTML()}</div>` +
        u.ornek.map(ex => `<article class="kart ornek">
        <div class="etiket">${esc(R[ex.k].ad)} <span class="soluk">· ${ex.r}</span></div>
        ${ayetHTML(ex, false)}
        <p class="okunus">🗣️ <b>${esc(ex.oku)}</b></p><p class="soluk">${esc(ex.n)}</p>${sesButonlari(ex)}${kayitHTML(ex.r + '#' + ex.w.join('-'), ayetUrl(ex.r))}</article>`).join('') +
        `<p class="soluk ortala">${t('Sesler için internet gerekir. Tilavet: {0}.', esc(kari().ad))}</p>
         ${pkVar(u) ? `<section class="kart pk-giris"><h2>🎙️ ${t('Okuyarak pekiştir')}</h2><p>${t('Bu dersin {0} örnek kelimesini sen oku; yapay zekâ okuyuşunu ölçsün. Her kelimede yüzde, hata ve doğrusunu dinleme.', pkOrnekler(u).length)}</p>${(() => { const k = (S.pekistir || {})[id]; const y = k ? Object.values(k.k) : []; return y.length ? `<p class="soluk kucukyazi">${t('Son ortalaman: %{0} ({1} kelime)', Math.round(y.reduce((a, b) => a + b, 0) / y.length), y.length)}</p>` : ''; })()}
           <button class="btn genis" data-git="pekistir|${id}|0">${t('Okumaya başla')}</button></section>` : ''}
         <button class="btn genis ${pkVar(u) ? 'ikincil' : ''}" data-sekme="alistirma">${t('Alıştırmaya geç ›')}</button>`;
    } else if (sekme === 'alistirma') {
      icerik = `<article class="kart"><h2>${t('Alıştırma')}</h2><p>${t('Puan tutulmaz, istediğin kadar çöz. Her sorudan sonra açıklama görürsün. Yanlış yaptığın sorular tekrar listene eklenir.')}</p>
        <button class="btn genis" data-git="alistirmaBasla|${id}">${t('Alıştırmaya başla')}</button></article>`;
    } else {
      icerik = `<article class="kart"><h2>${t('Bölüm testi')}</h2>
        <p>${t('{0} soru. Geçmek için en az <b>{1}</b> alman gerekir. Testte önceki bölümlerden de birkaç tekrar sorusu çıkar.', dersSoruSayisi(u, true), yuzdeStr(GECME))}</p>
        ${il ? `<p>${t('En iyi sonucun: <b>{0}</b> · {1} deneme', yuzdeStr(il.en), il.deneme)} ${il.gecti ? `· <span class="yesil">${t('Geçtin ✓')}</span>` : ''}</p>` : ''}
        ${kilitli ? `<p class="soluk">${t('Bu konuyu biliyorsan testi geçerek ({0}) bölümü açabilirsin.', yuzdeStr(GECME))}</p>` : ''}
        ${!hepsiOkundu && !gecildi ? `<p class="soluk">${t('Dersi henüz bitirmedin ({0}/{1} sayfa). Konuyu biliyorsan yine de teste girebilirsin.', okunan, u.sayfalar.length)}</p>` : ''}
        <button class="btn genis" data-git="testBasla|bolum|${id}">${kilitli ? t('⚡ Geçiş testine gir') : t('Teste başla')}</button>
      </article>`;
    }
    app.innerHTML = `${ust(esc(u.ad))}
      ${konuCipleri(id)}
      <div class="sekmeler">${sekmeler.map(s => `<button class="${s[0] === sekme ? 'aktif' : ''}" data-sekme="${s[0]}">${s[1]}</button>`).join('')}</div>
      <main>${icerik}</main>`;
    app.querySelectorAll('[data-konu]').forEach(b => b.onclick = () => { if (b.dataset.konu === id) return; ekranYigini[ekranYigini.length - 1] = ['ders', [b.dataset.konu]]; ciz(); window.scrollTo(0, 0); });
    app.querySelectorAll('[data-sekme]').forEach(b => b.onclick = () => { ekranYigini[ekranYigini.length - 1] = ['ders', [id, b.dataset.sekme]]; ciz(); window.scrollTo(0, 0); });
    if (sekme === 'ders') { const sy = app.querySelector('.kart.sayfa'); if (sy) sozlukBagla(sy); }
    if (sekme === 'ornek') app.querySelectorAll('.kart.ornek').forEach(k => sozlukBagla(k));
    if (sekme === 'ders') {
      const hk = EKRAN.ders._hk && EKRAN.ders._hk.q;
      app.querySelectorAll('[data-hk]').forEach(b => b.onclick = () => {
        if (!hk) return; const sec_ = hk.secenek[+b.dataset.hk], d = sec_ === hk.dogru;
        app.querySelectorAll('[data-hk]').forEach(x => { x.disabled = true; const v = hk.secenek[+x.dataset.hk]; if (v === hk.dogru) x.classList.add('dogru'); else if (x === b) x.classList.add('yanlis'); });
        srsGuncelle(hk.anahtar, d); kaydet();
        $('#hkSonuc').innerHTML = `<div class="geribildirim ${d ? 'iyi' : 'kotu'}"><b>${d ? t('✓ Doğru!') : t('✗ Yanlış.')}</b> ${d ? '' : t('Doğru cevap: ') + metin(hk.dogru)}${hk.aciklama ? `<p>${hk.aciklama}</p>` : ''}</div>`;
        sozlukBagla($('#hkSonuc'));
        if (d && window.Konfeti) window.Konfeti.patlat(b, 18);
      });
    }
    app.querySelectorAll('[data-sayfa]').forEach(b => b.onclick = () => { EKRAN.ders._sayfa = EKRAN.ders._sayfa || {}; EKRAN.ders._sayfa[id] = +b.dataset.sayfa; ciz(); window.scrollTo(0, 0); });
    if (sekme === 'ders') app.querySelectorAll('.kart.sayfa, .mh-hisset').forEach(x => arSesBagla(x, id));
    if (sekme === 'ders' && u.sayfalar && u.sayfalar.length) { const si_ = Math.min(+(EKRAN.ders._sayfa && EKRAN.ders._sayfa[id]) || 0, u.sayfalar.length - 1); mahrecBagla(id, si_); const nb_ = $('#dersNot'); if (nb_) nb_.onclick = () => notPenceresi('ders', id + ':' + si_); }
    const la = $('#lejantAc'); if (la) la.onclick = () => { if (!S.ayar.renkli) { S.ayar.renkli = true; kaydet(); ciz(); return; } const l = $('#lejant'); l.hidden = !l.hidden; };
  };

  // ------------------------------------------------------------ oturum (test/alıştırma/tekrar)
  let oturum = null;
  function oturumBaslat(o) {
    oturum = Object.assign({ i: 0, cevaplar: [], basla: simdi(), bitti: false }, o);
    oturum.sorular = oturum.anahtarlar.map(soruUret).filter(Boolean);
    if (!oturum.sorular.length) { oturum = null; toast(t('Bu seçim için soru bulunamadı.')); ciz(); return; }
    oturumSakla();
    git('soru');
  }

  EKRAN.testBasla = function (tur, id) {
    ekranYigini.pop();
    if (tur === 'bolum') {
      const u = unitById(id);
      // Ders uzunluğuna göre 6/8/10 soru; seviyeler dengeli (temel → tanıma → uygulama → önceki derslerle karışık)
      const n = dersSoruSayisi(u, true), onc = oncekiDersler(u), d4 = onc.length ? (n >= 10 ? 2 : 1) : 0, kalan = n - d4;
      const kota = { 1: Math.round(kalan * 0.3), 2: Math.round(kalan * 0.4), 3: kalan - Math.round(kalan * 0.3) - Math.round(kalan * 0.4), 4: d4 };
      const sorular = seviyeliSec(u, n, kota, onc, false).anahtarlar;
      oturumBaslat({ tur: 'bolum', id, kimlik: 'bolum|' + id, baslik: u.ad, anahtarlar: karistir(sorular), puanli: true });
    }
  };

  EKRAN.sinavGiris = function (id) {
    const u = unitById(id); const il = S.ilerleme[id];
    const n = u.final ? 30 : 15;
    app.innerHTML = `${ust(esc(u.ad))}<main><article class="kart">
      <h2>${u.ikon} ${esc(u.ad)}</h2>
      <p>${t('{0} soru, şu bölümlerden: {1}.', n, u.kapsar.map(k => esc(unitById(k).ad)).join(', '))}</p>
      <p>${t('Geçmek için en az <b>{0}</b>. Geçemezsen zayıf konuları tekrar edip yeniden dene. Sonraki bölümler bu sınavı geçince açılır.', yuzdeStr(GECME))}</p>
      ${il ? `<p>${t('En iyi sonucun: <b>{0}</b> · {1} deneme', yuzdeStr(il.en), il.deneme)}</p>` : ''}
      ${acikMi(u) ? '' : `<p class="uyari">${t('🔒 Bu sınav kilitli ama girebilirsin. {0} alırsan açılır ve geçilmiş sayılır.', yuzdeStr(GECME))}</p>`}
      <button class="btn genis" id="bas">${t('Sınava başla')}</button></article></main>`;
    $('#bas').onclick = () => {
      const havuz = u.kapsar.flatMap(k => anahtarlar(unitById(k)));
      // her bölümden dengeli soru
      const parca = Math.max(1, Math.floor(n / u.kapsar.length));
      let sorular = u.kapsar.flatMap(k => sec(anahtarlar(unitById(k)), parca, true));
      sorular = benzersiz(sorular.concat(sec(havuz.filter(k => !sorular.includes(k)), n - sorular.length, true))).slice(0, n);
      ekranYigini.pop();
      const tur = u.final ? 'final' : 'ara';
      const gi = GUNLUK_ADIM && GUNLUK_ADIM.ekran === 'sinavGiris' ? GUNLUK_ADIM.i : null; GUNLUK_ADIM = null;
      oturumBaslat({ tur, id, kimlik: tur + '|' + id, baslik: u.ad, anahtarlar: karistir(sorular), puanli: true, gunluk: gi });
    };
  };

  function alistirmaBaslat(id) {
    const u = unitById(id);
    const pl = ustalikPlan(u);
    oturumBaslat({ tur: 'alistirma', id, kimlik: 'alistirma|' + id, baslik: t('Alıştırma: ') + u.ad, anahtarlar: pl.anahtarlar, puanli: false, sonsuz: true, ustalik: { n: pl.n, sv: pl.sv, ek: 0, karisik: pl.karisik } });
  }
  EKRAN.alistirmaBasla = function (id) { ekranYigini.pop(); alistirmaBaslat(id); };

  EKRAN.tekrarBasla = function () {
    ekranYigini.pop();
    const k = vadesiGelenler().sort((a, b) => zayiflik(b) - zayiflik(a)).slice(0, 15);
    // sûre soruları için o sûreler yüklü olmalı
    const lazim = benzersiz(k.filter(x => x.startsWith('k:')).map(x => +x.split(':')[1]).filter(n => !SURE(n)));
    Promise.all(lazim.map(n => sureYukle(n).catch(() => null))).then(() =>
      oturumBaslat({ tur: 'tekrar', kimlik: 'tekrar', baslik: t('Günlük tekrar'), anahtarlar: karistir(k), puanli: true }));
  };

  EKRAN.soru = function () {
    const o = oturum; if (!o) return anaSayfa();
    const q = o.sorular[o.i];
    const cevap = o.cevaplar[o.i];
    const ilerleme = Math.round(o.i / o.sorular.length * 100);
    app.innerHTML = `${ust(esc(o.baslik))}
      <div class="ilerleme"><div style="width:${ilerleme}%"></div></div>
      <main>
        <p class="soluk">${o.tur === 'seviye' ? t('Konu {0}/{1}: {2}', o.sv.konu + 1, SV_KONU.length, esc(SV_KONU[o.sv.konu].ad())) + (o.i === o.sv.bas && !cevap ? ` · <button class="link" id="svGormedim">${t('Bu konuyu hiç görmedim, geç')}</button>` : '') : t('Soru {0} / {1}', o.i + 1, o.sorular.length) + (o.puanli ? '' : t(' · alıştırma'))}${o.ustalik ? ` · <span class="seviye-rozet sv${o.ustalik.sv[q.anahtar] || 2}">${[t('Temel'), t('Tanıma'), t('Uygulama'), t('Karışık')][(o.ustalik.sv[q.anahtar] || 2) - 1]}</span>` : ''}</p>
        ${o.ustalik && o.ustalik.karisik && o.i === 0 ? `<p class="soluk kucukyazi">${t('Bu dersin sorularının hepsini gördün; önceki derslerle karışık sorular geliyor.')}</p>` : ''}
        <article class="kart soru">
          ${(cevap ? q.ustRenkli : q.ust) || ''}
          <h2>${q.soru}</h2>
          <div class="secenekler">${q.secenek.map((s, i) => {
            let sinif = '';
            if (cevap) { if (s === q.dogru) sinif = 'dogru'; else if (s === cevap.secilen) sinif = 'yanlis'; }
            return `<button class="secenek ${sinif}" data-i="${i}" ${cevap ? 'disabled' : ''}>${metin(s)}</button>`;
          }).join('')}</div>
          ${cevap ? `<div class="geribildirim ${cevap.dogru ? 'iyi' : 'kotu'}">
              <b>${cevap.dogru ? t('✓ Doğru!') : t('✗ Yanlış.')}</b> ${cevap.dogru ? '' : t('Doğru cevap: ') + metin(q.dogru)}
              ${q.aciklama ? `<p>${q.aciklama}</p>` : ''}
              ${q.ex ? sesButonlari(q.ex) : ''}${q.exSes ? `<div class="sesler"><button class="sesbtn" data-ses="${q.exSes}">${t('▶ Ayeti dinle')}</button></div>` : ''}
            </div>
            ${o.ustalik && ustalikDurum(o) ? `<div class="kart ustalik-tamam"><b>${t('✓ Konuyu anladın!')}</b><p class="soluk kucukyazi">${t('İstersen bitir, istersen birkaç soru daha çöz.')}</p>
              <div class="satir sola"><button class="btn" id="ustalikBitir">${t('Bitir')}</button>${o.i + 1 < o.sorular.length ? `<button class="btn ikincil" id="ileri">${t('Devam et ({0} soru)', o.sorular.length - o.i - 1)}</button>` : `<button class="btn ikincil" id="ileri">${t('Yeni sorular ›')}</button>`}</div></div>`
            : `<button class="btn genis" id="ileri">${o.i + 1 < o.sorular.length ? t('Sonraki soru ›') : (o.sonsuz ? (o.ustalik ? t('Yeni sorularla devam ›') : t('Yeni soru seti ›')) : t('Sonucu gör ›'))}</button>`}` : ''}
        </article>
      </main>`;
    const gb = $('[data-goster]'); if (gb) gb.onclick = () => { $('.gizli-kelime').hidden = false; gb.remove(); };
    const svg = $('#svGormedim'); if (svg) svg.onclick = svHicGormedim;
    if (q.tip === 'dinle' && !cevap && !q._calindi) { q._calindi = true; const sb = $('.dinle-kutu .sesbtn'); setTimeout(() => cal(q.sesUrl, sb), 250); }
    app.querySelectorAll('.secenek').forEach(b => b.onclick = () => {
      const s = q.secenek[+b.dataset.i]; const d = s === q.dogru;
      o.cevaplar[o.i] = { secilen: s, dogru: d };
      srsGuncelle(q.anahtar, d); if (!d && o.ustalik) ustalikYanlis(o, q); kaydet(); oturumSakla();
      ciz();
      const g = $('.geribildirim'); if (g) { sozlukBagla(g); g.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    });
    const ub = $('#ustalikBitir'); if (ub) ub.onclick = () => { const id = o.id; oturum = null; oturumSakla(); toast(t('Bârekallah! Konuyu anladın ✓')); ekranYigini.pop(); ciz(); window.scrollTo(0, 0); };
    const ileri = $('#ileri');
    if (ileri) ileri.onclick = () => {
      if (o.tur === 'seviye') return seviyeIleri(o);
      if (o.i + 1 < o.sorular.length) { o.i++; oturumSakla(); ciz(); window.scrollTo(0, 0); return; }
      if (o.sonsuz) { oturum = null; ekranYigini.pop(); alistirmaBaslat(o.id); return; }
      bitir();
    };
  };

  function bitir() {
    const o = oturum; o.bitti = true; oturumSakla();
    if (o.gunluk != null) gunlukAdimBitir(o.gunluk);
    const dogru = o.cevaplar.filter(c => c && c.dogru).length, toplam = o.sorular.length;
    const yuzde = Math.round(dogru / toplam * 100);
    const sure = Math.round((simdi() - o.basla) / 1000);
    const onceki = [...S.gecmis].reverse().find(h => (o.kimlik && h.kimlik) ? h.kimlik === o.kimlik : h.baslik === o.baslik);
    const kayit = {
      id: simdi(), tur: o.tur, birim: o.id || null, kimlik: o.kimlik || null, baslik: o.baslik, tarih: simdi(), dogru, toplam, yuzde, sure,
      yanlislar: o.sorular.filter((q, i) => !(o.cevaplar[i] && o.cevaplar[i].dogru)).map(q => q.anahtar)
    };
    S.gecmis.push(kayit);
    let yeniAcildi = false;
    if (o.id && (o.tur === 'bolum' || o.tur === 'ara' || o.tur === 'final')) {
      const il = S.ilerleme[o.id] || { en: 0, deneme: 0, gecti: false };
      il.deneme++; il.en = Math.max(il.en, yuzde);
      if (yuzde >= GECME && !il.gecti) { il.gecti = true; yeniAcildi = true; }
      S.ilerleme[o.id] = il;
    }
    if (o.tur === 'sure') { S.sure = S.sure || {}; const v = S.sure[o.sure] || {}; v.en = Math.max(v.en || 0, yuzde); S.sure[o.sure] = v; }
    seriGuncelle(); kaydet(); hatirlatmaKur(false);
    ekranYigini.pop();
    git('sonuc', kayit.id, onceki ? onceki.yuzde : null, yeniAcildi, o.gunluk != null ? 1 : 0);
  }

  EKRAN.sonuc = function (id, oncekiYuzde, yeniAcildi, gunlukten) {
    const h = S.gecmis.find(x => String(x.id) === String(id)); const o = oturum;
    const fark = oncekiYuzde == null ? null : h.yuzde - oncekiYuzde;
    const puanli = h.tur === 'bolum' || h.tur === 'ara' || h.tur === 'final';
    const basarili = h.yuzde >= GECME;
    const sonraki = yeniAcildi ? U.find(u => !gecti(u.id)) : null;
    const yanlisListe = o ? o.sorular.map((q, i) => ({ q, c: o.cevaplar[i] })).filter(x => !(x.c && x.c.dogru)) : [];
    app.innerHTML = `${ust(t('Sonuç'))}<main>
      <article class="kart sonuc ${basarili ? 'iyi' : 'kotu'}">
        <div class="halka buyuk" style="--p:${h.yuzde}"><b>${yuzdeStr(h.yuzde)}</b><small>${h.dogru}/${h.toplam}</small></div>
        <h2>${puanli ? (basarili ? t('Tebrikler, geçtin! 🎉') : t('Biraz daha çalışalım 💪')) : t('Bitti!')}</h2>
        <p>${esc(baslikBul(h))} · ${sureStr(h.sure)}</p>
        ${fark == null ? `<p class="soluk">${t('Bu testi ilk kez çözdün.')}</p>` : `<p class="fark ${fark > 0 ? 'yukari' : fark < 0 ? 'asagi' : ''}">${fark > 0 ? t('▲ İlerleme: +{0}', fark) : fark < 0 ? t('▼ Gerileme: {0}', fark) : t('● Aynı')} ${t('puan (önceki: {0})', yuzdeStr(oncekiYuzde))}</p>`}
        ${puanli && !basarili ? `<p>${t('Geçmek için {0} gerekiyor. Dersi ve örnekleri tekrar gözden geçir, alıştırma yap, sonra tekrar dene.', yuzdeStr(GECME))}</p>` : ''}
        ${sonraki ? `<p class="yesil"><b>${t('Yeni bölüm açıldı:')}</b> ${esc(sonraki.ad)}</p>` : ''}
      </article>
      ${puanli && basarili && yeniAcildi ? mujdeHTML(U.findIndex(u => u.id === h.birim)) : ''}
      ${yanlisListe.length ? `<h2 class="baslik">${t('Yanlışların ({0})', yanlisListe.length)}</h2>` + yanlisListe.map(({ q, c }) => `<article class="kart kucuk">${q.ustRenkli || ''}<p><b>${q.soru}</b></p>
        <p>${t('Senin cevabın: ')}${c ? metin(c.secilen) : '—'}<br>${t('Doğrusu: ')}<b class="yesil">${metin(q.dogru)}</b></p>${q.aciklama ? `<p class="soluk">${q.aciklama}</p>` : ''}</article>`).join('') + `<p class="soluk ortala">${t('Bu sorular tekrar listene eklendi. Yakında yeniden sorulacak.')}</p>` : ''}
      <div class="satir">
        ${puanli && !basarili && h.birim ? `<button class="btn ikincil" data-git="${unitById(h.birim).ara ? 'sinavGiris|' + h.birim : 'ders|' + h.birim}">${t('Tekrar dene')}</button>` : ''}
        ${+gunlukten ? `<button class="btn" id="gunlugeDon">${t('📅 Günlük derse dön ›')}</button>` : sonraki ? `<button class="btn" data-git="${sonraki.ara ? 'sinavGiris|' + sonraki.id : 'ders|' + sonraki.id}">${t('Sonraki bölüm ›')}</button>` : `<button class="btn" data-git="ana">${t('Ana sayfa')}</button>`}
      </div></main>`;
    oturum = null;
    const gd = $('#gunlugeDon'); if (gd) gd.onclick = () => { ekranYigini = [['ana', []], ['gunluk', []]]; ciz(); window.scrollTo(0, 0); };
    if (puanli && basarili && yeniAcildi && window.Konfeti) setTimeout(() => window.Konfeti.patlat($('.halka.buyuk'), 60), 150);
  };
  // Bir bölüm/sınav ilk kez geçilince: yapılan işin değerini anlatan bir âyet ya da hadis
  function mujdeHTML(n, baslik) {
    const l = (window.MUJDE && window.MUJDE.buyuk) || []; if (!l.length) return '';
    const m = l[Math.max(0, n) % l.length];
    return `<section class="mujde"><p class="mujde-baslik">${baslik || t('Bir bölümü daha tamamladın. Bârekallah!')}</p>
      <p class="ar" dir="rtl" lang="ar">${m.ar}</p><p class="mujde-metin">“${esc(DIL === 'en' ? m.en : m.tr)}”</p>
      <p class="mujde-kaynak">${m.tur === 'ayet' ? '📖 ' : '🌹 '}${esc(DIL === 'en' ? m.ken : m.ktr)}</p></section>`;
  }

  EKRAN.testler = function () {
    const acik = acikDersler();
    app.innerHTML = `${ust(t('Testler'))}<main>
      <nav class="hizli iki"><button data-git="gecmis">📈<span>${t('Geçmiş ve ilerleme')}</span></button><button data-git="zayif">🎯<span>${t('Zayıf konular')}</span></button></nav>
      <article class="kart"><h2>${t('⚡ Hızlı test')}</h2><p>${t('Açık bölümlerden 5 karışık soru.')}</p><button class="btn" id="hizli">${t('Başla')}</button></article>
      <article class="kart"><h2>${t('🔀 Karma test')}</h2><p>${t('Bölümleri ve soru sayısını sen seç.')}</p>
        <div class="secimler">${acik.map(u => `<label><input type="checkbox" value="${u.id}" checked> ${u.ikon} ${esc(u.ad)}</label>`).join('')}</div>
        <div class="satir sola"><label>${t('Soru sayısı:')} <select id="adet"><option>10</option><option selected>20</option><option>30</option><option>50</option></select></label></div>
        <button class="btn" id="karma">${t('Başla')}</button></article>
      <article class="kart"><h2>${t('🎯 Zayıf konular testi')}</h2><p>${t('En çok yanlış yaptığın 15 soru.')}</p><button class="btn" id="zayifT">${t('Başla')}</button></article>
      <article class="kart"><h2>${t('🏁 Ara sınavlar ve final')}</h2>${U.filter(u => u.ara).map(u => `<button class="bolum ${acikMi(u) ? '' : 'kilitli'}" data-git="sinavGiris|${u.id}"><span class="ikon">${u.ikon}</span><span class="bad">${esc(u.ad)}</span>${gecti(u.id) ? `<span class="rozet ok">✓ ${yuzdeStr(S.ilerleme[u.id].en)}</span>` : acikMi(u) ? '' : '<span class="rozet kilit">🔒</span>'}</button>`).join('')}</article>
    </main>`;
    const tum = () => acik.flatMap(anahtarlar);
    $('#hizli').onclick = () => oturumBaslat({ tur: 'hizli', kimlik: 'hizli', baslik: t('Hızlı test'), anahtarlar: sec(tum(), 5, false), puanli: true });
    $('#karma').onclick = () => {
      const sec_ = [...app.querySelectorAll('.secimler input:checked')].map(i => unitById(i.value));
      if (!sec_.length) return toast(t('En az bir bölüm seç.'));
      const n = +$('#adet').value;
      oturumBaslat({ tur: 'karma', kimlik: `karma|-|${sec_.length}|${n}`, baslik: t('Karma test ({0} bölüm, {1} soru)', sec_.length, n), anahtarlar: sec(sec_.flatMap(anahtarlar), n, true), puanli: true });
    };
    $('#zayifT').onclick = zayifBaslat;
  };
  // En çok yanlış yapılan 15 soru (açık bölümlerden ve sûre testlerinden)
  function zayifBaslat() {
    const acik = acikDersler();
    const k = Object.keys(S.srs).filter(x => (x.startsWith('k:') || acik.some(u => u.id === x.split(':')[1])) && (S.srs[x].yanlis || 0) > 0).sort((a, b) => zayiflik(b) - zayiflik(a)).slice(0, 15);
    if (!k.length) return toast(t('Henüz yanlış yaptığın soru yok. 👏'));
    const lazim = benzersiz(k.filter(x => x.startsWith('k:')).map(x => +x.split(':')[1]).filter(n => !SURE(n)));
    Promise.all(lazim.map(n => sureYukle(n).catch(() => null))).then(() =>
      oturumBaslat({ tur: 'zayif', kimlik: 'zayif', baslik: t('Zayıf konular testi'), anahtarlar: karistir(k), puanli: true }));
  }

  EKRAN.zayif = function () {
    // kural bazında başarı
    const istat = {};
    for (const [k, s] of Object.entries(S.srs)) {
      const p = k.split(':'); const u = unitById(p[1]); if (!u) continue;
      const ex = p[0] === 'e' ? u.ornek[+p[2]] : null; if (p[0] === 'e' && !ex) continue;
      const ad = ex ? R[ex.k].ad : u.ad;
      const x = istat[ad] = istat[ad] || { d: 0, y: 0 }; x.d += s.dogru || 0; x.y += s.yanlis || 0;
    }
    const satir = Object.entries(istat).map(([ad, x]) => ({ ad, oran: Math.round(x.d / (x.d + x.y) * 100), n: x.d + x.y })).filter(x => x.n > 0).sort((a, b) => a.oran - b.oran);
    app.innerHTML = `${ust(t('Zayıf konular'))}<main>
      ${satir.length ? `<article class="kart"><p class="soluk">${t('Her konuda doğru cevap oranın. En zayıftan en güçlüye doğru sıralı.')}</p>
        ${satir.map(x => `<div class="cubuk"><span>${esc(x.ad)}</span><div class="bar"><div style="width:${x.oran}%" class="${x.oran < 60 ? 'kotu' : x.oran < 80 ? 'orta' : 'iyi'}"></div></div><b>${yuzdeStr(x.oran)}</b></div>`).join('')}</article>
        <button class="btn genis" id="zayifBasla">${t('🎯 Zayıf konular testine başla')}</button>` : `<article class="kart"><p>${t('Henüz yeterli veri yok. Biraz test çözünce burada konu konu başarı oranını göreceksin.')}</p></article>`}
    </main>`;
    const zb = $('#zayifBasla'); if (zb) zb.onclick = zayifBaslat;
  };

  EKRAN.gecmis = function (filtre = 'hepsi') {
    const turAd = { bolum: t('Bölüm testi'), ara: t('Ara sınav'), final: t('Final'), tekrar: t('Günlük tekrar'), hizli: t('Hızlı test'), karma: t('Karma test'), zayif: t('Zayıf konular'), sure: t('Sûreler'), ezber: t('Ezber'), sayfa: t('Sayfa yoklaması') };
    const kayitlar = S.gecmis.filter(h => h.tur !== 'alistirma' && (filtre === 'hepsi' || h.tur === filtre));
    // her testin bir öncekine göre farkı
    const sonYuzde = {};
    const farkli = S.gecmis.filter(h => h.tur !== 'alistirma').map(h => { const anah = h.kimlik || h.baslik; const f = sonYuzde[anah] == null ? null : h.yuzde - sonYuzde[anah]; sonYuzde[anah] = h.yuzde; return Object.assign({ fark: f }, h); });
    const gosterilen = farkli.filter(h => filtre === 'hepsi' || h.tur === filtre).reverse();
    const ort = a => a.length ? Math.round(a.reduce((x, y) => x + y.yuzde, 0) / a.length) : 0;
    const son5 = kayitlar.slice(-5), onceki5 = kayitlar.slice(-10, -5);
    const egilim = onceki5.length ? ort(son5) - ort(onceki5) : null;
    const turler = ['hepsi', ...benzersiz(S.gecmis.map(h => h.tur).filter(x => x !== 'alistirma'))];
    app.innerHTML = `${ust(t('Geçmiş ve ilerleme'))}<main>
      <div class="cipler">${turler.map(x => `<button class="${x === filtre ? 'aktif' : ''}" data-f="${x}">${x === 'hepsi' ? t('Hepsi') : turAd[x]}</button>`).join('')}</div>
      ${kayitlar.length ? `<article class="kart">
        <div class="istatler"><div><b>${kayitlar.length}</b><small>${t('test')}</small></div><div><b>${yuzdeStr(ort(kayitlar))}</b><small>${t('ortalama')}</small></div>
        <div><b>${yuzdeStr(Math.max(...kayitlar.map(k => k.yuzde)))}</b><small>${t('en iyi')}</small></div>
        <div><b class="${egilim > 0 ? 'yesil' : egilim < 0 ? 'kirmizi' : ''}">${egilim == null ? '—' : (egilim > 0 ? '▲ +' : egilim < 0 ? '▼ ' : '● ') + egilim}</b><small>${t('son 5 vs önceki 5')}</small></div></div>
        ${grafik(kayitlar.slice(-30))}
      </article>
      <div class="tablo">${gosterilen.map(h => `<div class="kayit">
        <div><b>${esc(baslikBul(h))}</b><small>${tarihStr(h.tarih)} · ${sureStr(h.sure)}</small></div>
        <div class="sag"><b class="${h.yuzde >= GECME ? 'yesil' : h.yuzde < 60 ? 'kirmizi' : ''}">${yuzdeStr(h.yuzde)}</b><small>${h.dogru}/${h.toplam}</small>
        ${h.fark == null ? `<small class="soluk">${t('ilk')}</small>` : `<small class="${h.fark > 0 ? 'yesil' : h.fark < 0 ? 'kirmizi' : 'soluk'}">${h.fark > 0 ? '▲ +' + h.fark : h.fark < 0 ? '▼ ' + h.fark : '● 0'}</small>`}</div></div>`).join('')}</div>`
      : `<article class="kart"><p>${t('Henüz kayıtlı test yok. Çözdüğün her test burada tarih, puan ve ilerlemesiyle görünecek.')}</p></article>`}
    </main>`;
    app.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { ekranYigini[ekranYigini.length - 1] = ['gecmis', [b.dataset.f]]; ciz(); });
  };

  function grafik(k) {
    if (k.length < 2) return `<p class="soluk ortala">${t('Grafik için en az 2 test gerekiyor.')}</p>`;
    const W = 320, H = 150, P = 24, n = k.length;
    const x = i => P + i * (W - P - 8) / (n - 1), y = v => H - P - v / 100 * (H - P - 10);
    const yol = k.map((h, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(h.yuzde).toFixed(1)}`).join(' ');
    return `<svg class="grafik" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t('Puan grafiği')}">
      ${[0, 50, 80, 100].map(v => `<line x1="${P}" x2="${W - 8}" y1="${y(v)}" y2="${y(v)}" class="${v === GECME ? 'esik' : 'izgara'}"/><text x="${P - 4}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('')}
      <path d="${yol}" class="cizgi"/>
      ${k.map((h, i) => `<circle cx="${x(i)}" cy="${y(h.yuzde)}" r="3.5" class="${h.yuzde >= GECME ? 'nokta iyi' : 'nokta'}"><title>${esc(baslikBul(h))}: ${yuzdeStr(h.yuzde)}</title></circle>`).join('')}
    </svg><p class="soluk ortala kucukyazi">${t('Kesikli çizgi: geçme sınırı ({0})', yuzdeStr(GECME))}</p>`;
  }

  EKRAN.hesap = function (mod = 'giris') {
    const b = B();
    if (!b && window.bulutYukle) {   // hesap sistemi henüz yüklenmedi: şimdi yükle, hazır olunca ekran yenilenir
      window.bulutYukle();
      app.innerHTML = `${ust(t('Hesap'))}<main><p class="soluk">${t('Yükleniyor…')}</p></main>`;
      return;
    }
    if (!b || !b.hazir) {
      app.innerHTML = `${ust(t('Hesap'))}<main><article class="kart"><h2>${t('Hesap sistemi hazırlanıyor')}</h2><p>${t('Bu sürümde hesap sistemi henüz etkin değil. Verilerin bu telefonda saklanıyor; Ayarlar\'dan yedek alabilirsin.')}</p></article></main>`;
      return;
    }
    const k = b.kullanici();
    if (k) {
      app.innerHTML = `${ust(t('Hesabım'))}<main>
        <article class="kart"><h2>👤 ${esc(k.email || k.displayName || t('Hesap'))}</h2>
          <p class="soluk">${sonEsitleme ? t('Son eşitleme: ') + tarihStr(sonEsitleme) : t('Eşitleme bekleniyor…')}</p>
          <p>${t('İlerlemen, test geçmişin ve açtığın bölümler bu hesapta saklanır. Başka bir telefonda aynı hesapla girersen kaldığın yerden devam edersin.')}</p>
          <button class="btn genis" id="esitle">${t('🔄 Şimdi eşitle')}</button>
          <button class="btn genis ikincil" data-git="sinif">${t('👨‍🏫 Sınıf (hoca–öğrenci)')}</button>
          <button class="btn genis ikincil" id="cikis">${t('Çıkış yap')}</button></article></main>`;
      $('#esitle').onclick = () => esitle(false);
      $('#cikis').onclick = async () => {
        if (!confirm(t('Çıkış yapılsın mı? İlerlemen hesabında kalır; bu telefondan silinir.'))) return;
        try { await b.yukle(S); } catch (e) { if (!confirm(t('Son değişiklikler hesaba yüklenemedi (internet yok). Yine de çıkış yapılsın mı? Yüklenmemiş ilerleme kaybolur.'))) return; }
        await b.cikis(); Object.keys(SB).forEach(k => delete SB[k]); const ayar = S.ayar; S = bos(); S.ayar = ayar; S.hesapUyariKapali = true; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { }
        toast(t('Çıkış yapıldı')); anaSayfa();
      };
      return;
    }
    const kayit = mod === 'kayit';
    app.innerHTML = `${ust(kayit ? t('Hesap aç') : t('Giriş yap'))}<main>
      <div class="sekmeler ic"><button class="${kayit ? '' : 'aktif'}" data-mod="giris">${t('Giriş yap')}</button><button class="${kayit ? 'aktif' : ''}" data-mod="kayit">${t('Hesap aç')}</button></div>
      <article class="kart form">
        <button class="btn genis google" id="google"><span class="g">G</span> ${kayit ? t('Google ile hesap aç') : t('Google ile giriş yap')}</button>
        <div class="ayrac"><span>${t('veya e-posta ile')}</span></div>
        <label>${t('E-posta')}<input id="eposta" type="email" autocomplete="email" inputmode="email" placeholder="${t('ornek@mail.com')}"></label>
        <label>${t('Şifre')}<input id="sifre" type="password" autocomplete="${kayit ? 'new-password' : 'current-password'}" placeholder="${kayit ? t('En az 6 karakter') : t('Şifren')}"></label>
        ${kayit ? `<label>${t('Şifre (tekrar)')}<input id="sifre2" type="password" autocomplete="new-password"></label>` : ''}
        <p class="hata" id="hata"></p>
        <button class="btn genis" id="gonder">${kayit ? t('Hesap aç') : t('Giriş yap')}</button>
        ${kayit ? '' : `<button class="link" id="unuttum">${t('Şifremi unuttum')}</button>`}
        <p class="soluk kucukyazi">${t('Giriş yapınca bu telefondaki ilerlemen hesabına eklenir; hiçbir şey kaybolmaz.')}</p>
      </article></main>`;
    app.querySelectorAll('[data-mod]').forEach(x => x.onclick = () => { ekranYigini[ekranYigini.length - 1] = ['hesap', [x.dataset.mod]]; ciz(); });
    const hata = m => { $('#hata').textContent = m || ''; };
    const mesgul = (btn, v) => { btn.disabled = v; btn.dataset.yazi = btn.dataset.yazi || btn.textContent; btn.textContent = v ? t('Bekle…') : btn.dataset.yazi; };
    const tamam = () => { toast(t('Giriş yapıldı ✓ Verilerin eşitleniyor')); anaSayfa(); };
    $('#google').onclick = async e => { hata(); mesgul(e.currentTarget, true); try { await b.googleIle(); tamam(); } catch (x) { hata(x.message); mesgul($('#google'), false); } };
    $('#gonder').onclick = async e => {
      hata(); const ep = $('#eposta').value, sf = $('#sifre').value;
      if (!ep || !sf) return hata(t('E-posta ve şifreyi gir.'));
      if (kayit && sf !== $('#sifre2').value) return hata(t('Şifreler aynı değil.'));
      const btn = e.currentTarget; mesgul(btn, true);
      try { await (kayit ? b.kayit(ep, sf) : b.giris(ep, sf)); tamam(); } catch (x) { hata(x.message); mesgul(btn, false); }
    };
    const u = $('#unuttum'); if (u) u.onclick = async () => {
      const ep = $('#eposta').value; if (!ep) return hata(t('Önce e-posta adresini yaz.'));
      try { await b.sifreSifirla(ep); toast(t('Şifre sıfırlama bağlantısı e-postana gönderildi')); } catch (x) { hata(x.message); }
    };
  };

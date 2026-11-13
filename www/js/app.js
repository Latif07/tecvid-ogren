/* Tecvid Öğren — uygulama motoru (çevrimdışı çalışır, veriler telefonda saklanır) */
(function () {
  'use strict';
  const { R, U, GRUP_AD, KAYNAK } = window.TC;
  const AYAH = window.AYAH;
  const GECME = 80;                       // bölüm/ara sınav geçme yüzdesi
  const ARALIK = [0, 1, 2, 4, 8, 16, 32]; // kutu → gün (aralıklı tekrar)
  const KEY = 'tecvid-ogren.v1';
  const $ = (s, el = document) => el.querySelector(s);
  const app = $('#app');

  // ------------------------------------------------------------ durum
  const bos = () => ({ ilerleme: {}, okunan: {}, srs: {}, gecmis: [], ayar: { hiz: 1 }, seri: { son: '', gun: 0 } });
  let S;
  try { S = Object.assign(bos(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { S = bos(); }
  let yuklemeZamanlayici = null, sonEsitleme = null, esitleniyor = false;
  const kaydet = () => {
    S.degisti = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Kaydedilemedi: ' + e.message); }
    clearTimeout(yuklemeZamanlayici); yuklemeZamanlayici = setTimeout(buluta, 1500);
  };
  // ------------------------------------------------------------ bulut eşitleme
  const B = () => window.Bulut;
  const girisli = () => !!(B() && B().kullanici());
  function birlestir(a, b) {
    const r = bos(); r.ayar = Object.assign({}, b.ayar, a.ayar);
    for (const id of new Set([...Object.keys(a.ilerleme || {}), ...Object.keys(b.ilerleme || {})])) {
      const x = (a.ilerleme || {})[id] || {}, y = (b.ilerleme || {})[id] || {};
      r.ilerleme[id] = { en: Math.max(x.en || 0, y.en || 0), deneme: Math.max(x.deneme || 0, y.deneme || 0), gecti: !!(x.gecti || y.gecti) };
    }
    for (const id of new Set([...Object.keys(a.okunan || {}), ...Object.keys(b.okunan || {})])) r.okunan[id] = Math.max((a.okunan || {})[id] || 0, (b.okunan || {})[id] || 0);
    for (const k of new Set([...Object.keys(a.srs || {}), ...Object.keys(b.srs || {})])) {
      const x = (a.srs || {})[k], y = (b.srs || {})[k];
      r.srs[k] = !x ? y : !y ? x : ((x.son || 0) >= (y.son || 0) ? x : y);
    }
    const g = new Map(); [...(b.gecmis || []), ...(a.gecmis || [])].forEach(h => g.set(String(h.id), h));
    r.gecmis = [...g.values()].sort((m, n) => m.tarih - n.tarih).slice(-3000);
    const sa = a.seri || {}, sb = b.seri || {};
    r.seri = (sa.son || '') > (sb.son || '') ? sa : (sb.son || '') > (sa.son || '') ? sb : { son: sa.son || '', gun: Math.max(sa.gun || 0, sb.gun || 0) };
    r.degisti = Math.max(a.degisti || 0, b.degisti || 0);
    return r;
  }
  async function buluta() {
    if (!girisli() || esitleniyor) return;
    esitleniyor = true;
    try {
      const uzak = await B().indir();
      if (uzak && (uzak.degisti || 0) > (S.degisti || 0) - 1) { S = birlestir(S, Object.assign(bos(), uzak)); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
      await B().yukle(S); sonEsitleme = Date.now();
    } catch (e) { /* internet yoksa sonra tekrar denenir */ }
    finally { esitleniyor = false; }
  }
  async function esitle(sessiz) {
    if (!girisli() || esitleniyor) return;
    esitleniyor = true;
    try {
      const uzak = await B().indir();
      if (uzak) S = birlestir(S, Object.assign(bos(), uzak));
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { }
      await B().yukle(S); sonEsitleme = Date.now();
      if (!sessiz) toast('Verilerin hesabınla eşitlendi ✓');
    } catch (e) { if (!sessiz) toast('Eşitlenemedi: ' + (e.message || 'internet bağlantısı yok')); }
    finally { esitleniyor = false; }
    if (!oturum) ciz();
  }
  function bulutBagla() {
    if (!window.Bulut || bulutBagla.tamam) return; bulutBagla.tamam = true;
    let onceki = null;
    if (!oturum && ekranYigini.length) ciz();
    window.Bulut.dinle(u => {
      const uid = u ? u.uid : null; if (uid === onceki) return; onceki = uid;
      if (u) esitle(true); else if (!oturum && ekranYigini.length) ciz();
    });
  }
  window.addEventListener('bulut-hazir', bulutBagla);
  window.addEventListener('online', () => esitle(true));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') esitle(true); });

  const bugun = () => new Date().toISOString().slice(0, 10);
  const simdi = () => Date.now();
  const GUN = 86400000;
  function seriGuncelle() {
    const b = bugun(); if (S.seri.son === b) return;
    const dun = new Date(simdi() - GUN).toISOString().slice(0, 10);
    S.seri.gun = S.seri.son === dun ? S.seri.gun + 1 : 1; S.seri.son = b;
  }

  // ------------------------------------------------------------ yardımcılar
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const karistir = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const benzersiz = a => [...new Set(a)];
  const arMi = s => /[؀-ۿ]/.test(s);
  // Metindeki Arapça parçaları mushaf yazı tipiyle göster
  const metin = s => esc(s).replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u2234]+(?:[\s\u00A0]+[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u2234]+)*/g, m => `<span class="ar">${m}</span>`);
  function toast(m) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }
  const tarihStr = ts => new Date(ts).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const sureStr = sn => sn < 60 ? sn + ' sn' : Math.floor(sn / 60) + ' dk ' + (sn % 60) + ' sn';
  const unitById = id => U.find(u => u.id === id);
  const dersler = U.filter(u => !u.ara);

  // ------------------------------------------------------------ kilitler
  function gecti(id) { return !!(S.ilerleme[id] && S.ilerleme[id].gecti); }
  // Bir bölüm açıktır: ilk bölümse, bir önceki bölüm geçildiyse ya da kendisi (geçiş testiyle) geçildiyse.
  // Kilitli bölümler de okunabilir ve testine doğrudan girilebilir; %80 alınca açılır.
  function acikMi(u) {
    const i = U.indexOf(u);
    return i === 0 || gecti(u.id) || gecti(U[i - 1].id);
  }
  const acikDersler = () => dersler.filter(acikMi);
  const ogrenilenKurallar = (ek) => benzersiz(acikDersler().concat(ek ? [ek] : []).flatMap(u => u.kurallar));

  // ------------------------------------------------------------ ses
  const pad = (n, k = 3) => String(n).padStart(k, '0');
  const ayetUrl = r => { const [s, a] = r.split(':').map(Number); return `https://everyayah.com/data/Husary_Muallim_128kbps/${pad(s)}${pad(a)}.mp3`; };
  const kelimeUrl = (r, w) => { const [s, a] = r.split(':').map(Number); return `https://audio.qurancdn.com/wbw/${pad(s)}_${pad(a)}_${pad(w)}.mp3`; };
  let ses = null;
  function cal(url, btn) {
    if (ses) { ses.pause(); document.querySelectorAll('.caliyor').forEach(b => b.classList.remove('caliyor')); }
    if (ses && ses._url === url && !ses._bitti) { ses = null; return; }
    ses = new Audio(url); ses._url = url; ses.playbackRate = S.ayar.hiz || 1;
    btn && btn.classList.add('caliyor');
    ses.onended = () => { ses._bitti = true; btn && btn.classList.remove('caliyor'); };
    ses.onerror = () => { btn && btn.classList.remove('caliyor'); toast('Ses çalınamadı. İnternet bağlantını kontrol et.'); };
    ses.play().catch(() => { btn && btn.classList.remove('caliyor'); toast('Ses çalınamadı. İnternet bağlantını kontrol et.'); });
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-ses]'); if (!b) return;
    e.preventDefault(); cal(b.dataset.ses, b);
  });

  // ------------------------------------------------------------ ayet gösterimi
  function ayetHTML(ex, kisa = true) {
    const kelimeler = AYAH[ex.r].split(' ');
    const [a, b] = ex.w.length === 2 ? ex.w : [ex.w[0], ex.w[0]];
    let bas = 0, son = kelimeler.length;
    if (kisa && kelimeler.length > 12) { bas = Math.max(0, a - 1 - 4); son = Math.min(kelimeler.length, b + 4); }
    const parca = [];
    if (bas > 0) parca.push('<span class="sil">…</span>');
    for (let i = bas; i < son; i++) {
      const isaret = i + 1 >= a && i + 1 <= b;
      parca.push(`<span class="${isaret ? 'isaret' : ''}">${esc(kelimeler[i])}</span>`);
    }
    if (son < kelimeler.length) parca.push('<span class="sil">…</span>');
    return `<div class="ayet" dir="rtl" lang="ar">${parca.join(' ')}</div>`;
  }
  function sesButonlari(ex) {
    const tek = ex.w.length === 1 || ex.w[0] === ex.w[1];
    return `<div class="sesler">
      <button class="sesbtn" data-ses="${ayetUrl(ex.r)}">▶ Ayeti dinle</button>
      ${tek ? `<button class="sesbtn ikincil" data-ses="${kelimeUrl(ex.r, ex.w[0])}">▶ Kelimeyi dinle</button>` : ''}
    </div>`;
  }
  const sureAd = r => r;

  // ------------------------------------------------------------ soru bankası
  // Her sorunun sabit bir anahtarı var (aralıklı tekrar bu anahtarla takip edilir).
  const ELIFLER = benzersiz(Object.values(R).filter(r => r.elif).map(r => r.elif));
  function soruUret(anahtar) {
    const p = anahtar.split(':');
    const u = unitById(p[1]);
    if (p[0] === 'c') {
      const c = u.sorular[+p[2]];
      return { anahtar, unit: u.id, tip: 'kavram', soru: metin(c.q), dogru: c.a, secenek: karistir([c.a, ...c.w]), aciklama: '' };
    }
    const ex = u.ornek[+p[2]]; const kural = R[ex.k];
    const ust = ayetHTML(ex);
    if (p[3] === 'kural') {
      const ogrenilen = ogrenilenKurallar(u).filter(k => k !== ex.k);
      const ayniGrup = karistir(ogrenilen.filter(k => R[k].grup === kural.grup));
      const diger = karistir(ogrenilen.filter(k => R[k].grup !== kural.grup));
      const yanlis = ayniGrup.concat(diger).slice(0, 3).map(k => R[k].ad);
      return { anahtar, unit: u.id, tip: 'kural', ust, ex, soru: 'İşaretli yerde hangi tecvid kuralı var?', dogru: kural.ad, secenek: karistir([kural.ad, ...yanlis]), aciklama: `${esc(kural.ad)}: ${esc(kural.ozet)} <br><i>${esc(ex.n)}</i>` };
    }
    if (p[3] === 'oku') {
      const havuz = karistir(benzersiz(dersler.flatMap(d => (d.ornek || []).filter(e => e.oku !== ex.oku && (R[e.k].grup === kural.grup)).map(e => e.oku))));
      const yedek = karistir(benzersiz(dersler.flatMap(d => (d.ornek || []).map(e => e.oku)).filter(o => o !== ex.oku)));
      const yanlis = benzersiz(havuz.concat(yedek)).slice(0, 3);
      return { anahtar, unit: u.id, tip: 'oku', ust, ex, soru: 'İşaretli yer nasıl okunur?', dogru: ex.oku, secenek: karistir([ex.oku, ...yanlis]), aciklama: `${esc(kural.ad)}: <i>${esc(ex.n)}</i>` };
    }
    if (p[3] === 'elif') {
      const yanlis = karistir(ELIFLER.filter(e => e !== kural.elif)).slice(0, 3);
      return { anahtar, unit: u.id, tip: 'elif', ust, ex, soru: `İşaretli yerde ${esc(kural.ad)} var. Ne kadar uzatılır?`, dogru: kural.elif, secenek: karistir([kural.elif, ...yanlis]), aciklama: esc(kural.ozet) };
    }
  }
  // Bir dersin bütün soru anahtarları (bu ana kadar öğrenilen kurallara göre)
  function anahtarlar(u) {
    const k = [];
    (u.sorular || []).forEach((_, i) => k.push(`c:${u.id}:${i}`));
    const ogrenilenSayi = ogrenilenKurallar(u).length;
    (u.ornek || []).forEach((ex, i) => {
      if (ogrenilenSayi >= 3) k.push(`e:${u.id}:${i}:kural`);
      k.push(`e:${u.id}:${i}:oku`);
      if (R[ex.k].elif && R[ex.k].grup === 'med') k.push(`e:${u.id}:${i}:elif`);
    });
    return k;
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
    return Object.keys(S.srs).filter(k => acik.has(k.split(':')[1]) && S.srs[k].vade <= simdi());
  }

  // ------------------------------------------------------------ yönlendirme
  let ekranYigini = [];
  function git(ad, ...arg) { ekranYigini.push([ad, arg]); ciz(); window.scrollTo(0, 0); }
  function geri() { if (oturum && !oturum.bitti && !confirm('Testten çıkmak istiyor musun? Bu test kaydedilmez.')) return; oturum = null; if (ekranYigini.length > 1) ekranYigini.pop(); ciz(); window.scrollTo(0, 0); }
  function anaSayfa() { oturum = null; ekranYigini = [['ana', []]]; ciz(); window.scrollTo(0, 0); }
  function ciz() { const [ad, arg] = ekranYigini[ekranYigini.length - 1]; EKRAN[ad](...arg); }
  window.addEventListener('popstate', () => { geri(); history.pushState(null, ''); });
  history.pushState(null, '');
  try {
    const Cap = window.Capacitor; const CapApp = Cap && Cap.isNativePlatform && Cap.isNativePlatform() ? Cap.registerPlugin('App') : null;
    if (CapApp) CapApp.addListener('backButton', () => { if (ekranYigini.length > 1) geri(); else CapApp.exitApp(); });
  } catch (e) { /* tarayıcıda yok */ }

  const ust = (baslik, geriVar = true, sag = '') => `<header class="ust">${geriVar ? '<button class="geri" data-git="geri" aria-label="Geri">‹</button>' : '<span class="logo">۞</span>'}<h1>${baslik}</h1>${sag}</header>`;
  app.addEventListener('click', e => {
    const g = e.target.closest('[data-git]'); if (!g) return;
    const hedef = g.dataset.git;
    if (hedef === 'geri') return geri();
    if (hedef === 'ana') return anaSayfa();
    const [ad, ...arg] = hedef.split('|'); git(ad, ...arg);
  });

  // ------------------------------------------------------------ ekranlar
  const EKRAN = {};

  EKRAN.ana = function () {
    const toplam = U.length, gecilen = U.filter(u => gecti(u.id)).length;
    const vade = vadesiGelenler().length;
    const siradaki = U.find(u => !gecti(u.id));
    let liste = '';
    let sonGrup = '';
    U.forEach((u, i) => {
      const acik = acikMi(u), ok = gecti(u.id), il = S.ilerleme[u.id];
      const durum = ok ? `<span class="rozet ok">✓ %${il.en}</span>` : acik ? `<span class="rozet simdi">Şimdi</span>` : `<span class="rozet kilit">🔒</span>`;
      liste += `<button class="bolum ${acik ? '' : 'kilitli'} ${u.ara ? 'ara' : ''}" data-git="${u.ara ? 'sinavGiris|' + u.id : 'ders|' + u.id}">
        <span class="ikon">${u.ikon}</span><span class="bad"><small>${u.ara ? (u.final ? 'Final' : 'Ara sınav') : 'Bölüm ' + dersler.indexOf(u)}</small>${esc(u.ad)}</span>${durum}</button>`;
    });
    const k = B() && B().kullanici();
    const hesapUyari = B() && B().hazir && !k && !S.hesapUyariKapali;
    app.innerHTML = `${ust('Tecvid Öğren', false, `<button class="hesapbtn" data-git="hesap" aria-label="Hesap">${k ? '👤' : 'Giriş'}</button>`)}
      <main>
        <section class="kart ozet">
          <div class="halka" style="--p:${Math.round(gecilen / toplam * 100)}"><b>${gecilen}/${toplam}</b><small>tamam</small></div>
          <div><p class="buyukyazi">${siradaki ? 'Sıradaki: ' + esc(siradaki.ad) : 'Maşallah! Bütün müfredatı bitirdin. 🎉'}</p>
          <p class="soluk">🔥 ${S.seri.gun || 0} günlük seri</p>
          ${siradaki ? `<button class="btn" data-git="${siradaki.ara ? 'sinavGiris|' + siradaki.id : 'ders|' + siradaki.id}">Devam et</button>` : ''}</div>
        </section>
        <section class="kart tekrar ${vade ? 'vurgulu' : ''}">
          <div><h2>🔁 Günlük tekrar</h2><p>${vade ? `<b>${vade}</b> soru tekrar zamanı geldi. Unutmamak için şimdi çöz.` : 'Şu an tekrar bekleyen soru yok. Harika!'}</p></div>
          ${vade ? '<button class="btn" data-git="tekrarBasla">Başla</button>' : ''}
        </section>
        <nav class="hizli">
          <button data-git="testler">📝<span>Testler</span></button>
          <button data-git="gecmis">📈<span>Geçmiş</span></button>
          <button data-git="zayif">🎯<span>Zayıf konular</span></button>
          <button data-git="ayarlar">⚙️<span>Ayarlar</span></button>
        </nav>
        ${hesapUyari ? `<section class="kart hesap-uyari" style="margin-top:14px"><div><h2>☁️ İlerlemen kaybolmasın</h2><p>Giriş yap; puanların, geçmişin ve kilitler hesabında saklansın, başka telefonda da devam et.</p></div>
          <div class="satir sola"><button class="btn" data-git="hesap">Giriş yap / Hesap aç</button><button class="btn ikincil" id="uyariKapat">Sonra</button></div></section>` : ''}
        <h2 class="baslik">Bölümler</h2>
        <p class="soluk kucukyazi">🔒 Kilitli bölümleri de açabilirsin: konuyu biliyorsan doğrudan testine gir, %${GECME} alınca bölüm açılır.</p>
        <div class="bolumler">${liste}</div>
      </main>`;
    const uk = $('#uyariKapat'); if (uk) uk.onclick = () => { S.hesapUyariKapali = true; kaydet(); ciz(); };
  };

  EKRAN.ders = function (id, sekme = 'ders') {
    const u = unitById(id);
    const okunan = S.okunan[id] || 0;
    const hepsiOkundu = okunan >= u.sayfalar.length;
    const il = S.ilerleme[id];
    const sekmeler = [['ders', '📖 Ders'], ['ornek', '🔍 Örnekler'], ['alistirma', '✍️ Alıştırma'], ['test', '✅ Test']]
      .filter(s => s[0] !== 'ornek' || (u.ornek && u.ornek.length));
    let icerik = '';
    const kilitli = !acikMi(u), gecildi = gecti(id);
    const secim = gecildi ? '' : `<section class="kart secim ${kilitli ? 'kilit' : ''}">
        <p>${kilitli ? '🔒 <b>Bu bölüm henüz kilitli.</b> Konuyu biliyorsan doğrudan teste gir; %' + GECME + ' alırsan bölüm açılır. İstersen önce konuyu oku.' : 'Nasıl ilerlemek istersin? Konuyu biliyorsan doğrudan teste girebilirsin.'}</p>
        <div class="satir"><button class="btn ikincil" data-sekme="ders">📖 Konuyu öğren</button><button class="btn" data-git="testBasla|bolum|${id}">⚡ Direkt teste gir</button></div></section>`;
    if (sekme === 'ders') {
      const i = Math.min(+(EKRAN.ders._sayfa && EKRAN.ders._sayfa[id]) || 0, u.sayfalar.length - 1);
      const s = u.sayfalar[i];
      if (i + 1 > okunan) { S.okunan[id] = i + 1; kaydet(); }
      icerik = (i === 0 ? secim : '') + `<article class="kart sayfa"><div class="sayac">${i + 1} / ${u.sayfalar.length}</div><h2>${esc(s.t)}</h2>${s.h}</article>
        <div class="satir">
          <button class="btn ikincil" data-sayfa="${i - 1}" ${i === 0 ? 'disabled' : ''}>‹ Önceki</button>
          ${i < u.sayfalar.length - 1 ? `<button class="btn" data-sayfa="${i + 1}">Sonraki ›</button>` : `<button class="btn" data-sekme="${u.ornek && u.ornek.length ? 'ornek' : 'alistirma'}">${u.ornek && u.ornek.length ? 'Örneklere geç ›' : 'Alıştırmaya geç ›'}</button>`}
        </div>`;
    } else if (sekme === 'ornek') {
      icerik = u.ornek.map(ex => `<article class="kart ornek">
        <div class="etiket">${esc(R[ex.k].ad)} <span class="soluk">· ${ex.r}</span></div>
        ${ayetHTML(ex, false)}
        <p class="okunus">🗣️ <b>${esc(ex.oku)}</b></p><p class="soluk">${esc(ex.n)}</p>${sesButonlari(ex)}</article>`).join('') +
        `<p class="soluk ortala">Sesler için internet gerekir. Tilavet: Hafız Husarî (öğretim).</p>
         <button class="btn genis" data-sekme="alistirma">Alıştırmaya geç ›</button>`;
    } else if (sekme === 'alistirma') {
      icerik = `<article class="kart"><h2>Alıştırma</h2><p>Puan tutulmaz, istediğin kadar çöz. Her sorudan sonra açıklama görürsün. Yanlış yaptığın sorular tekrar listene eklenir.</p>
        <button class="btn genis" data-git="alistirmaBasla|${id}">Alıştırmaya başla</button></article>`;
    } else {
      icerik = `<article class="kart"><h2>Bölüm testi</h2>
        <p>10 soru. Geçmek için en az <b>%${GECME}</b> alman gerekir. Testte önceki bölümlerden de birkaç tekrar sorusu çıkar.</p>
        ${il ? `<p>En iyi sonucun: <b>%${il.en}</b> · ${il.deneme} deneme ${il.gecti ? '· <span class="yesil">Geçtin ✓</span>' : ''}</p>` : ''}
        ${kilitli ? `<p class="uyari">🔒 Bu bölüm kilitli. Testi geçersen (%${GECME}) bölüm açılır.</p>` : ''}
        ${!hepsiOkundu && !gecildi ? `<p class="soluk">Dersi henüz bitirmedin (${okunan}/${u.sayfalar.length} sayfa). Konuyu biliyorsan yine de teste girebilirsin.</p>` : ''}
        <button class="btn genis" data-git="testBasla|bolum|${id}">${kilitli ? '⚡ Geçiş testine gir' : 'Teste başla'}</button>
      </article>`;
    }
    app.innerHTML = `${ust(esc(u.ad))}
      <div class="sekmeler">${sekmeler.map(s => `<button class="${s[0] === sekme ? 'aktif' : ''}" data-sekme="${s[0]}">${s[1]}</button>`).join('')}</div>
      <main>${icerik}</main>`;
    app.querySelectorAll('[data-sekme]').forEach(b => b.onclick = () => { ekranYigini[ekranYigini.length - 1] = ['ders', [id, b.dataset.sekme]]; ciz(); window.scrollTo(0, 0); });
    app.querySelectorAll('[data-sayfa]').forEach(b => b.onclick = () => { EKRAN.ders._sayfa = EKRAN.ders._sayfa || {}; EKRAN.ders._sayfa[id] = +b.dataset.sayfa; ciz(); window.scrollTo(0, 0); });
  };

  // ------------------------------------------------------------ oturum (test/alıştırma/tekrar)
  let oturum = null;
  function oturumBaslat(o) {
    oturum = Object.assign({ i: 0, cevaplar: [], basla: simdi(), bitti: false }, o);
    oturum.sorular = oturum.anahtarlar.map(soruUret).filter(Boolean);
    if (!oturum.sorular.length) { oturum = null; toast('Bu seçim için soru bulunamadı.'); ciz(); return; }
    git('soru');
  }

  EKRAN.testBasla = function (tur, id) {
    ekranYigini.pop();
    if (tur === 'bolum') {
      const u = unitById(id);
      const kendi = anahtarlar(u);
      const onceki = acikDersler().filter(d => d.id !== id && d.id !== 'u0' && U.indexOf(d) < U.indexOf(u)).flatMap(anahtarlar);
      const tekrarSayi = onceki.length ? 2 : 0;
      const sorular = sec(kendi, 10 - tekrarSayi, true).concat(sec(onceki, tekrarSayi, true));
      oturumBaslat({ tur: 'bolum', id, baslik: u.ad, anahtarlar: karistir(sorular), puanli: true });
    }
  };

  EKRAN.sinavGiris = function (id) {
    const u = unitById(id); const il = S.ilerleme[id];
    const n = u.final ? 30 : 15;
    app.innerHTML = `${ust(esc(u.ad))}<main><article class="kart">
      <h2>${u.ikon} ${esc(u.ad)}</h2>
      <p>${n} soru, şu bölümlerden: ${u.kapsar.map(k => esc(unitById(k).ad)).join(', ')}.</p>
      <p>Geçmek için en az <b>%${GECME}</b>. Geçemezsen zayıf konuları tekrar edip yeniden dene. Sonraki bölümler bu sınavı geçince açılır.</p>
      ${il ? `<p>En iyi sonucun: <b>%${il.en}</b> · ${il.deneme} deneme</p>` : ''}
      ${acikMi(u) ? '' : `<p class="uyari">🔒 Bu sınav kilitli ama girebilirsin. %${GECME} alırsan açılır ve geçilmiş sayılır.</p>`}
      <button class="btn genis" id="bas">Sınava başla</button></article></main>`;
    $('#bas').onclick = () => {
      const havuz = u.kapsar.flatMap(k => anahtarlar(unitById(k)));
      // her bölümden dengeli soru
      const parca = Math.max(1, Math.floor(n / u.kapsar.length));
      let sorular = u.kapsar.flatMap(k => sec(anahtarlar(unitById(k)), parca, true));
      sorular = benzersiz(sorular.concat(sec(havuz.filter(k => !sorular.includes(k)), n - sorular.length, true))).slice(0, n);
      ekranYigini.pop();
      oturumBaslat({ tur: u.final ? 'final' : 'ara', id, baslik: u.ad, anahtarlar: karistir(sorular), puanli: true });
    };
  };

  EKRAN.alistirmaBasla = function (id) {
    ekranYigini.pop();
    const u = unitById(id);
    oturumBaslat({ tur: 'alistirma', id, baslik: 'Alıştırma: ' + u.ad, anahtarlar: sec(anahtarlar(u), 12, true), puanli: false, sonsuz: true });
  };

  EKRAN.tekrarBasla = function () {
    ekranYigini.pop();
    const k = vadesiGelenler().sort((a, b) => zayiflik(b) - zayiflik(a)).slice(0, 15);
    oturumBaslat({ tur: 'tekrar', baslik: 'Günlük tekrar', anahtarlar: karistir(k), puanli: true });
  };

  EKRAN.soru = function () {
    const o = oturum; if (!o) return anaSayfa();
    const q = o.sorular[o.i];
    const cevap = o.cevaplar[o.i];
    const ilerleme = Math.round(o.i / o.sorular.length * 100);
    app.innerHTML = `${ust(esc(o.baslik))}
      <div class="ilerleme"><div style="width:${ilerleme}%"></div></div>
      <main>
        <p class="soluk">Soru ${o.i + 1} / ${o.sorular.length}${o.puanli ? '' : ' · alıştırma'}</p>
        <article class="kart soru">
          ${q.ust || ''}
          <h2>${q.soru}</h2>
          <div class="secenekler">${q.secenek.map((s, i) => {
            let sinif = '';
            if (cevap) { if (s === q.dogru) sinif = 'dogru'; else if (s === cevap.secilen) sinif = 'yanlis'; }
            return `<button class="secenek ${sinif}" data-i="${i}" ${cevap ? 'disabled' : ''}>${metin(s)}</button>`;
          }).join('')}</div>
          ${cevap ? `<div class="geribildirim ${cevap.dogru ? 'iyi' : 'kotu'}">
              <b>${cevap.dogru ? '✓ Doğru!' : '✗ Yanlış.'}</b> ${cevap.dogru ? '' : 'Doğru cevap: ' + metin(q.dogru)}
              ${q.aciklama ? `<p>${q.aciklama}</p>` : ''}
              ${q.ex ? sesButonlari(q.ex) : ''}
            </div>
            <button class="btn genis" id="ileri">${o.i + 1 < o.sorular.length ? 'Sonraki soru ›' : (o.sonsuz ? 'Yeni soru seti ›' : 'Sonucu gör ›')}</button>` : ''}
        </article>
      </main>`;
    app.querySelectorAll('.secenek').forEach(b => b.onclick = () => {
      const s = q.secenek[+b.dataset.i]; const d = s === q.dogru;
      o.cevaplar[o.i] = { secilen: s, dogru: d };
      srsGuncelle(q.anahtar, d); kaydet();
      ciz();
      const g = $('.geribildirim'); g && g.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    const ileri = $('#ileri');
    if (ileri) ileri.onclick = () => {
      if (o.i + 1 < o.sorular.length) { o.i++; ciz(); window.scrollTo(0, 0); return; }
      if (o.sonsuz) {
        const u = unitById(o.id);
        oturum = null; ekranYigini.pop();
        oturumBaslat({ tur: 'alistirma', id: o.id, baslik: 'Alıştırma: ' + u.ad, anahtarlar: sec(anahtarlar(u), 12, true), puanli: false, sonsuz: true });
        return;
      }
      bitir();
    };
  };

  function bitir() {
    const o = oturum; o.bitti = true;
    const dogru = o.cevaplar.filter(c => c && c.dogru).length, toplam = o.sorular.length;
    const yuzde = Math.round(dogru / toplam * 100);
    const sure = Math.round((simdi() - o.basla) / 1000);
    const onceki = [...S.gecmis].reverse().find(h => h.baslik === o.baslik);
    const kayit = {
      id: simdi(), tur: o.tur, birim: o.id || null, baslik: o.baslik, tarih: simdi(), dogru, toplam, yuzde, sure,
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
    seriGuncelle(); kaydet();
    ekranYigini.pop();
    git('sonuc', kayit.id, onceki ? onceki.yuzde : null, yeniAcildi);
  }

  EKRAN.sonuc = function (id, oncekiYuzde, yeniAcildi) {
    const h = S.gecmis.find(x => String(x.id) === String(id)); const o = oturum;
    const fark = oncekiYuzde == null ? null : h.yuzde - oncekiYuzde;
    const puanli = h.tur === 'bolum' || h.tur === 'ara' || h.tur === 'final';
    const gecti = h.yuzde >= GECME;
    const sonraki = yeniAcildi ? U.find(u => !gecti_(u.id)) : null;
    function gecti_(x) { return S.ilerleme[x] && S.ilerleme[x].gecti; }
    const yanlisListe = o ? o.sorular.map((q, i) => ({ q, c: o.cevaplar[i] })).filter(x => !(x.c && x.c.dogru)) : [];
    app.innerHTML = `${ust('Sonuç')}<main>
      <article class="kart sonuc ${gecti ? 'iyi' : 'kotu'}">
        <div class="halka buyuk" style="--p:${h.yuzde}"><b>%${h.yuzde}</b><small>${h.dogru}/${h.toplam}</small></div>
        <h2>${puanli ? (gecti ? 'Tebrikler, geçtin! 🎉' : 'Biraz daha çalışalım 💪') : 'Bitti!'}</h2>
        <p>${esc(h.baslik)} · ${sureStr(h.sure)}</p>
        ${fark == null ? '<p class="soluk">Bu testi ilk kez çözdün.</p>' : `<p class="fark ${fark > 0 ? 'yukari' : fark < 0 ? 'asagi' : ''}">${fark > 0 ? '▲ İlerleme: +' + fark : fark < 0 ? '▼ Gerileme: ' + fark : '● Aynı'} puan (önceki: %${oncekiYuzde})</p>`}
        ${puanli && !gecti ? `<p>Geçmek için %${GECME} gerekiyor. Dersi ve örnekleri tekrar gözden geçir, alıştırma yap, sonra tekrar dene.</p>` : ''}
        ${sonraki ? `<p class="yesil"><b>Yeni bölüm açıldı:</b> ${esc(sonraki.ad)}</p>` : ''}
      </article>
      ${yanlisListe.length ? `<h2 class="baslik">Yanlışların (${yanlisListe.length})</h2>` + yanlisListe.map(({ q, c }) => `<article class="kart kucuk">${q.ust || ''}<p><b>${q.soru}</b></p>
        <p>Senin cevabın: ${c ? metin(c.secilen) : '—'}<br>Doğrusu: <b class="yesil">${metin(q.dogru)}</b></p>${q.aciklama ? `<p class="soluk">${q.aciklama}</p>` : ''}</article>`).join('') + '<p class="soluk ortala">Bu sorular tekrar listene eklendi. Yakında yeniden sorulacak.</p>' : ''}
      <div class="satir">
        ${puanli && !gecti && h.birim ? `<button class="btn ikincil" data-git="${unitById(h.birim).ara ? 'sinavGiris|' + h.birim : 'ders|' + h.birim}">Tekrar dene</button>` : ''}
        ${sonraki ? `<button class="btn" data-git="${sonraki.ara ? 'sinavGiris|' + sonraki.id : 'ders|' + sonraki.id}">Sonraki bölüm ›</button>` : `<button class="btn" data-git="ana">Ana sayfa</button>`}
      </div></main>`;
    oturum = null;
  };

  EKRAN.testler = function () {
    const acik = acikDersler();
    app.innerHTML = `${ust('Testler')}<main>
      <article class="kart"><h2>⚡ Hızlı test</h2><p>Açık bölümlerden 5 karışık soru.</p><button class="btn" id="hizli">Başla</button></article>
      <article class="kart"><h2>🎲 Karma test</h2><p>Bölümleri ve soru sayısını sen seç.</p>
        <div class="secimler">${acik.map(u => `<label><input type="checkbox" value="${u.id}" checked> ${u.ikon} ${esc(u.ad)}</label>`).join('')}</div>
        <div class="satir sola"><label>Soru sayısı: <select id="adet"><option>10</option><option selected>20</option><option>30</option><option>50</option></select></label></div>
        <button class="btn" id="karma">Başla</button></article>
      <article class="kart"><h2>🎯 Zayıf konular testi</h2><p>En çok yanlış yaptığın 15 soru.</p><button class="btn" id="zayifT">Başla</button></article>
      <article class="kart"><h2>🏁 Ara sınavlar ve final</h2>${U.filter(u => u.ara).map(u => `<button class="bolum ${acikMi(u) ? '' : 'kilitli'}" data-git="sinavGiris|${u.id}"><span class="ikon">${u.ikon}</span><span class="bad">${esc(u.ad)}</span>${gecti(u.id) ? `<span class="rozet ok">✓ %${S.ilerleme[u.id].en}</span>` : acikMi(u) ? '' : '<span class="rozet kilit">🔒</span>'}</button>`).join('')}</article>
    </main>`;
    const tum = () => acik.flatMap(anahtarlar);
    $('#hizli').onclick = () => oturumBaslat({ tur: 'hizli', baslik: 'Hızlı test', anahtarlar: sec(tum(), 5, false), puanli: true });
    $('#karma').onclick = () => {
      const sec_ = [...app.querySelectorAll('.secimler input:checked')].map(i => unitById(i.value));
      if (!sec_.length) return toast('En az bir bölüm seç.');
      const n = +$('#adet').value;
      oturumBaslat({ tur: 'karma', baslik: `Karma test (${sec_.length} bölüm, ${n} soru)`, anahtarlar: sec(sec_.flatMap(anahtarlar), n, true), puanli: true });
    };
    $('#zayifT').onclick = () => {
      const k = Object.keys(S.srs).filter(x => acik.some(u => u.id === x.split(':')[1]) && (S.srs[x].yanlis || 0) > 0).sort((a, b) => zayiflik(b) - zayiflik(a)).slice(0, 15);
      if (!k.length) return toast('Henüz yanlış yaptığın soru yok. 👏');
      oturumBaslat({ tur: 'zayif', baslik: 'Zayıf konular testi', anahtarlar: karistir(k), puanli: true });
    };
  };

  EKRAN.zayif = function () {
    // kural bazında başarı
    const istat = {};
    for (const [k, s] of Object.entries(S.srs)) {
      const p = k.split(':'); const u = unitById(p[1]); if (!u) continue;
      const ad = p[0] === 'c' ? u.ad : R[u.ornek[+p[2]].k].ad;
      const x = istat[ad] = istat[ad] || { d: 0, y: 0 }; x.d += s.dogru || 0; x.y += s.yanlis || 0;
    }
    const satir = Object.entries(istat).map(([ad, x]) => ({ ad, oran: Math.round(x.d / (x.d + x.y) * 100), n: x.d + x.y })).filter(x => x.n > 0).sort((a, b) => a.oran - b.oran);
    app.innerHTML = `${ust('Zayıf konular')}<main>
      ${satir.length ? `<article class="kart"><p class="soluk">Her konuda doğru cevap oranın. En zayıftan en güçlüye doğru sıralı.</p>
        ${satir.map(x => `<div class="cubuk"><span>${esc(x.ad)}</span><div class="bar"><div style="width:${x.oran}%" class="${x.oran < 60 ? 'kotu' : x.oran < 80 ? 'orta' : 'iyi'}"></div></div><b>%${x.oran}</b></div>`).join('')}</article>
        <button class="btn genis" data-git="testler">Zayıf konular testine git</button>` : '<article class="kart"><p>Henüz yeterli veri yok. Biraz test çözünce burada konu konu başarı oranını göreceksin.</p></article>'}
    </main>`;
  };

  EKRAN.gecmis = function (filtre = 'hepsi') {
    const turAd = { bolum: 'Bölüm testi', ara: 'Ara sınav', final: 'Final', tekrar: 'Günlük tekrar', hizli: 'Hızlı test', karma: 'Karma test', zayif: 'Zayıf konular' };
    const kayitlar = S.gecmis.filter(h => h.tur !== 'alistirma' && (filtre === 'hepsi' || h.tur === filtre));
    // her testin bir öncekine göre farkı
    const sonYuzde = {};
    const farkli = S.gecmis.filter(h => h.tur !== 'alistirma').map(h => { const f = sonYuzde[h.baslik] == null ? null : h.yuzde - sonYuzde[h.baslik]; sonYuzde[h.baslik] = h.yuzde; return Object.assign({ fark: f }, h); });
    const gosterilen = farkli.filter(h => filtre === 'hepsi' || h.tur === filtre).reverse();
    const ort = a => a.length ? Math.round(a.reduce((x, y) => x + y.yuzde, 0) / a.length) : 0;
    const son5 = kayitlar.slice(-5), onceki5 = kayitlar.slice(-10, -5);
    const egilim = onceki5.length ? ort(son5) - ort(onceki5) : null;
    const turler = ['hepsi', ...benzersiz(S.gecmis.map(h => h.tur).filter(t => t !== 'alistirma'))];
    app.innerHTML = `${ust('Geçmiş ve ilerleme')}<main>
      <div class="cipler">${turler.map(t => `<button class="${t === filtre ? 'aktif' : ''}" data-f="${t}">${t === 'hepsi' ? 'Hepsi' : turAd[t]}</button>`).join('')}</div>
      ${kayitlar.length ? `<article class="kart">
        <div class="istatler"><div><b>${kayitlar.length}</b><small>test</small></div><div><b>%${ort(kayitlar)}</b><small>ortalama</small></div>
        <div><b>%${Math.max(...kayitlar.map(k => k.yuzde))}</b><small>en iyi</small></div>
        <div><b class="${egilim > 0 ? 'yesil' : egilim < 0 ? 'kirmizi' : ''}">${egilim == null ? '—' : (egilim > 0 ? '▲ +' : egilim < 0 ? '▼ ' : '● ') + egilim}</b><small>son 5 vs önceki 5</small></div></div>
        ${grafik(kayitlar.slice(-30))}
      </article>
      <div class="tablo">${gosterilen.map(h => `<div class="kayit">
        <div><b>${esc(h.baslik)}</b><small>${tarihStr(h.tarih)} · ${sureStr(h.sure)}</small></div>
        <div class="sag"><b class="${h.yuzde >= GECME ? 'yesil' : h.yuzde < 60 ? 'kirmizi' : ''}">%${h.yuzde}</b><small>${h.dogru}/${h.toplam}</small>
        ${h.fark == null ? '<small class="soluk">ilk</small>' : `<small class="${h.fark > 0 ? 'yesil' : h.fark < 0 ? 'kirmizi' : 'soluk'}">${h.fark > 0 ? '▲ +' + h.fark : h.fark < 0 ? '▼ ' + h.fark : '● 0'}</small>`}</div></div>`).join('')}</div>`
      : '<article class="kart"><p>Henüz kayıtlı test yok. Çözdüğün her test burada tarih, puan ve ilerlemesiyle görünecek.</p></article>'}
    </main>`;
    app.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { ekranYigini[ekranYigini.length - 1] = ['gecmis', [b.dataset.f]]; ciz(); });
  };

  function grafik(k) {
    if (k.length < 2) return '<p class="soluk ortala">Grafik için en az 2 test gerekiyor.</p>';
    const W = 320, H = 150, P = 24, n = k.length;
    const x = i => P + i * (W - P - 8) / (n - 1), y = v => H - P - v / 100 * (H - P - 10);
    const yol = k.map((h, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(h.yuzde).toFixed(1)}`).join(' ');
    return `<svg class="grafik" viewBox="0 0 ${W} ${H}" role="img" aria-label="Puan grafiği">
      ${[0, 50, 80, 100].map(v => `<line x1="${P}" x2="${W - 8}" y1="${y(v)}" y2="${y(v)}" class="${v === GECME ? 'esik' : 'izgara'}"/><text x="${P - 4}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('')}
      <path d="${yol}" class="cizgi"/>
      ${k.map((h, i) => `<circle cx="${x(i)}" cy="${y(h.yuzde)}" r="3.5" class="${h.yuzde >= GECME ? 'nokta iyi' : 'nokta'}"><title>${esc(h.baslik)}: %${h.yuzde}</title></circle>`).join('')}
    </svg><p class="soluk ortala kucukyazi">Kesikli çizgi: geçme sınırı (%${GECME})</p>`;
  }

  EKRAN.hesap = function (mod = 'giris') {
    const b = B();
    if (!b || !b.hazir) {
      app.innerHTML = `${ust('Hesap')}<main><article class="kart"><h2>Hesap sistemi hazırlanıyor</h2><p>Bu sürümde hesap sistemi henüz etkin değil. Verilerin bu telefonda saklanıyor; Ayarlar'dan yedek alabilirsin.</p></article></main>`;
      return;
    }
    const k = b.kullanici();
    if (k) {
      app.innerHTML = `${ust('Hesabım')}<main>
        <article class="kart"><h2>👤 ${esc(k.email || k.displayName || 'Hesap')}</h2>
          <p class="soluk">${sonEsitleme ? 'Son eşitleme: ' + tarihStr(sonEsitleme) : 'Eşitleme bekleniyor…'}</p>
          <p>İlerlemen, test geçmişin ve açtığın bölümler bu hesapta saklanır. Başka bir telefonda aynı hesapla girersen kaldığın yerden devam edersin.</p>
          <button class="btn genis" id="esitle">🔄 Şimdi eşitle</button>
          <button class="btn genis ikincil" id="cikis">Çıkış yap</button></article></main>`;
      $('#esitle').onclick = () => esitle(false);
      $('#cikis').onclick = async () => {
        if (!confirm('Çıkış yapılsın mı? İlerlemen hesabında kalır; bu telefondan silinir.')) return;
        try { await b.yukle(S); } catch (e) { if (!confirm('Son değişiklikler hesaba yüklenemedi (internet yok). Yine de çıkış yapılsın mı? Yüklenmemiş ilerleme kaybolur.')) return; }
        await b.cikis(); S = bos(); S.hesapUyariKapali = true; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { }
        toast('Çıkış yapıldı'); anaSayfa();
      };
      return;
    }
    const kayit = mod === 'kayit';
    app.innerHTML = `${ust(kayit ? 'Hesap aç' : 'Giriş yap')}<main>
      <div class="sekmeler ic"><button class="${kayit ? '' : 'aktif'}" data-mod="giris">Giriş yap</button><button class="${kayit ? 'aktif' : ''}" data-mod="kayit">Hesap aç</button></div>
      <article class="kart form">
        <button class="btn genis google" id="google"><span class="g">G</span> Google ile ${kayit ? 'hesap aç' : 'giriş yap'}</button>
        <div class="ayrac"><span>veya e-posta ile</span></div>
        <label>E-posta<input id="eposta" type="email" autocomplete="email" inputmode="email" placeholder="ornek@mail.com"></label>
        <label>Şifre<input id="sifre" type="password" autocomplete="${kayit ? 'new-password' : 'current-password'}" placeholder="${kayit ? 'En az 6 karakter' : 'Şifren'}"></label>
        ${kayit ? '<label>Şifre (tekrar)<input id="sifre2" type="password" autocomplete="new-password"></label>' : ''}
        <p class="hata" id="hata"></p>
        <button class="btn genis" id="gonder">${kayit ? 'Hesap aç' : 'Giriş yap'}</button>
        ${kayit ? '' : '<button class="link" id="unuttum">Şifremi unuttum</button>'}
        <p class="soluk kucukyazi">Giriş yapınca bu telefondaki ilerlemen hesabına eklenir; hiçbir şey kaybolmaz.</p>
      </article></main>`;
    app.querySelectorAll('[data-mod]').forEach(x => x.onclick = () => { ekranYigini[ekranYigini.length - 1] = ['hesap', [x.dataset.mod]]; ciz(); });
    const hata = m => { $('#hata').textContent = m || ''; };
    const mesgul = (btn, v) => { btn.disabled = v; btn.dataset.yazi = btn.dataset.yazi || btn.textContent; btn.textContent = v ? 'Bekle…' : btn.dataset.yazi; };
    const tamam = () => { toast('Giriş yapıldı ✓ Verilerin eşitleniyor'); anaSayfa(); };
    $('#google').onclick = async e => { hata(); mesgul(e.currentTarget, true); try { await b.googleIle(); tamam(); } catch (x) { hata(x.message); mesgul($('#google'), false); } };
    $('#gonder').onclick = async e => {
      hata(); const ep = $('#eposta').value, sf = $('#sifre').value;
      if (!ep || !sf) return hata('E-posta ve şifreyi gir.');
      if (kayit && sf !== $('#sifre2').value) return hata('Şifreler aynı değil.');
      const btn = e.currentTarget; mesgul(btn, true);
      try { await (kayit ? b.kayit(ep, sf) : b.giris(ep, sf)); tamam(); } catch (x) { hata(x.message); mesgul(btn, false); }
    };
    const u = $('#unuttum'); if (u) u.onclick = async () => {
      const ep = $('#eposta').value; if (!ep) return hata('Önce e-posta adresini yaz.');
      try { await b.sifreSifirla(ep); toast('Şifre sıfırlama bağlantısı e-postana gönderildi'); } catch (x) { hata(x.message); }
    };
  };

  EKRAN.ayarlar = function () {
    const yedek = JSON.stringify(S);
    const hk = B() && B().kullanici();
    app.innerHTML = `${ust('Ayarlar')}<main>
      <article class="kart"><h2>👤 Hesap</h2><p>${hk ? 'Giriş yapıldı: <b>' + esc(hk.email || '') + '</b>' : 'Giriş yapmadın. Verilerin sadece bu telefonda.'}</p>
        <button class="btn" data-git="hesap">${hk ? 'Hesabım' : 'Giriş yap / Hesap aç'}</button></article>
      <article class="kart"><h2>🔊 Ses hızı</h2>
        <div class="satir sola">${[0.75, 1, 1.25].map(h => `<button class="btn ${S.ayar.hiz === h ? '' : 'ikincil'}" data-hiz="${h}">${h}×</button>`).join('')}</div></article>
      <article class="kart"><h2>💾 Yedek</h2><p>İlerlemen ve geçmişin telefonda saklanır. Uygulamayı silmeden önce ya da yeni bir telefona geçerken yedeğini kopyalayıp bir yere (not, e-posta) kaydet.</p>
        <textarea id="yedek" rows="4" readonly>${esc(yedek)}</textarea>
        <div class="satir sola"><button class="btn" id="kopyala">Yedeği kopyala</button></div>
        <p>Yedeği geri yüklemek için aşağıya yapıştır:</p>
        <textarea id="yukle" rows="3" placeholder="Yedeği buraya yapıştır"></textarea>
        <div class="satir sola"><button class="btn ikincil" id="geriyukle">Geri yükle</button></div></article>
      <article class="kart"><h2>📚 Kaynaklar</h2><ul class="kaynak">${KAYNAK.map(k => `<li>${esc(k)}</li>`).join('')}</ul>
        <p class="soluk">Tecvid kulakla öğrenilen bir ilimdir. Bu uygulama bir hocadan ders almanın yerini tutmaz, onu destekler.</p></article>
      <article class="kart"><h2>⚠️ Sıfırla</h2><p>Bütün ilerleme ve geçmiş silinir.</p><button class="btn tehlike" id="sifirla">Her şeyi sıfırla</button></article>
    </main>`;
    app.querySelectorAll('[data-hiz]').forEach(b => b.onclick = () => { S.ayar.hiz = +b.dataset.hiz; kaydet(); ciz(); });
    $('#kopyala').onclick = async () => { try { await navigator.clipboard.writeText(yedek); toast('Kopyalandı'); } catch (e) { const t = $('#yedek'); t.select(); document.execCommand('copy'); toast('Kopyalandı'); } };
    $('#geriyukle').onclick = () => {
      try { const v = JSON.parse($('#yukle').value); if (!v.ilerleme || !v.gecmis) throw new Error('Geçersiz yedek'); S = birlestir(Object.assign(bos(), v), S); kaydet(); toast('Yedek yüklendi'); anaSayfa(); }
      catch (e) { toast('Yedek okunamadı: ' + e.message); }
    };
    $('#sifirla').onclick = async () => {
      if (!confirm('Emin misin? Bütün ilerleme ve test geçmişi silinecek' + (girisli() ? ' (hesabındakiler de).' : '.'))) return;
      S = bos(); S.hesapUyariKapali = true; clearTimeout(yuklemeZamanlayici);
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { }
      if (girisli()) { try { await B().yukle(S); } catch (e) { toast('Hesaptaki veriler silinemedi: internet yok'); } }
      anaSayfa();
    };
  };

  anaSayfa();
  bulutBagla();
  window.__TECVID = { S: () => S, soruUret, anahtarlar, dogru: () => oturum && oturum.sorular[oturum.i] && oturum.sorular[oturum.i].dogru, U, kaydet: v => { S = v; kaydet(); anaSayfa(); } }; // test için
})();

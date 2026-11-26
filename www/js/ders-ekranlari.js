/* Kur'an Yolum — Sûre sûre tecvid, mahreç, harf kartları, hikâye, günün sorusu, günlük ders, durak ışıkları ve kartlar */
/* app.js bölündü: bu dosyalar sırayla yüklenir, aynı genel kapsamı paylaşır (bkz. TODO.md). */
'use strict';
  // ------------------------------------------------------------ sûre sûre tecvid (ayet ayet: önce sen bul, sonra kurallar)
  // Kural etiketleri cpfair/quran-tajweed verisinden; açıklamalar müfredattaki kural özetlerinden (R) alınır.
  const HARF_RE = /[ء-غف-يٱ]/g;
  const TENVIN_RE = /[ً-ࣰٍ-ࣲ]/;
  function etiketKural(r, s, e, k, sonKelimeMi, kelimeSonu) {
    const a = AYAH[r] || '', ch = a.slice(s, e), ilk = ch[0];
    const ozel = (ad, ack, unit) => ({ ad, ack, unit });
    const kural = (id, unit) => R[id] ? { ad: R[id].ad, ack: R[id].ozet + (R[id].elif ? ` · ${R[id].elif}` : ''), unit } : ozel(LEJ_AD[k], LEJ_ACIKLAMA[k] || '', unit);
    switch (k) {
      case 'm2': {
        if (/[ۥۦ]/.test(ch)) return kural('sila', 'u6');
        const kalan = (a.slice(e, kelimeSonu).match(HARF_RE) || []).length;
        if (sonKelimeMi && kalan === 1) return kural(/[وي]/.test(ilk) && a[e] === 'ۡ' ? 'lin' : 'ariz', 'u5');
        return kural('tabii', 'u1');
      }
      case 'mt': return kural('muttasil', 'u2');
      case 'mf': return kural('munfasil', 'u3');
      case 'ml': return kural('lazim', 'u4');
      case 'g': return kural('gunne', 'u13');
      case 'q': return kural('kalkale', 'u15');
      case 'k': return kural('iklab', 'u10');
      case 'h': return ilk === 'م' ? kural('ihfaSefevi', 'u12') : kural('ihfa', 'u11');
      case 'dg': return ilk === 'م' ? kural('idgamMim', 'u12') : kural('idgamMaal', 'u8');
      case 'db': return ilk === 'ن' || TENVIN_RE.test(ilk) ? kural('idgamBila', 'u9') : ozel(LEJ_AD.db, LEJ_ACIKLAMA.db, 'u14');
      case 's':
        if (ilk === 'ٱ') return ozel(t('Hemze-i vasl'), t('Önceki kelimeye bağlanarak okunurken bu elif okunmaz.'), null);
        if (ilk === 'ل') return kural('semsi', 'u16');
        return ozel(t('Okunmayan harf'), t('Yazılır ama okunmaz.'), null);
    }
    return ozel(LEJ_AD[k] || k, LEJ_ACIKLAMA[k] || '', null);
  }
  // Ayetteki kurallar: aynı kelime(ler) + aynı kural tek satır
  function ayetKurallari(r) {
    const a = AYAH[r] || '', w = a.split(' '), ofs = []; let o = 0; for (const k of w) { ofs.push(o); o += k.length + 1; }
    const kelimeNo = p => { let i = 0; while (i + 1 < ofs.length && ofs[i + 1] <= p) i++; return i; };
    const l = [], gor = new Set();
    (RENK[r] || []).forEach(([s, e, k], idx) => {
      const w1 = kelimeNo(s), w2 = kelimeNo(Math.max(s, e - 1));
      // Sonraki kelimeye bağlı kurallar ayet sonunda durulunca uygulanmaz (örn. 112:4 sonundaki iklâb işareti)
      if (['k', 'h', 'dg', 'db', 'mf'].includes(k) && !(a.slice(e).match(HARF_RE) || []).length) return;
      const kr = etiketKural(r, s, e, k, w2 === w.length - 1, ofs[w2] + w[w2].length);
      const anahtar = `${w1}-${w2}-${kr.ad}`; if (gor.has(anahtar)) return; gor.add(anahtar);
      l.push(Object.assign({ s, e, k, w1, w2, idx }, kr));
    });
    return { l, w, ofs };
  }
  // Latin harfli okunuş: Elif-Ba bitene kadar açık, sonra kapalı (kullanıcı değiştirdiyse onun seçimi)
  function okunusAcik() { return S.ayar.okunus == null ? !gecti('e1') : !!S.ayar.okunus; }
  const STC = { r: '', acik: false, q: null, cevap: null };
  EKRAN.sureTecvid = function (n, a) {
    n = +n; a = +a || 1;
    if (!SURE(n)) { app.innerHTML = `${ust(t('Sûre sûre tecvid'))}<main><p class="soluk">${t('Yükleniyor…')}</p></main>`; sureYukle(n).then(() => ciz()).catch(() => toast(t('Sûre açılamadı.'))); return; }
    const x = SURE(n), N = x.ayet.length; a = Math.min(Math.max(1, a), N);
    const r = `${n}:${a}`, { l, w, ofs } = ayetKurallari(r);
    if (STC.r !== r) {
      const adaylar = l.filter(k => k.k !== 's');
      const sec = adaylar.length ? adaylar[Math.floor(Math.random() * adaylar.length)] : null;
      Object.assign(STC, { r, acik: !sec || !S.ayar.kendiniDene, q: sec ? soruUret(`k:${n}:${a}:${sec.idx}`) : null, cevap: null });
    }
    if (STC.acik) { S.sureTecvid = S.sureTecvid || {}; if ((S.sureTecvid[n] || 0) < a) { S.sureTecvid[n] = a; kaydet(); } }
    const OKU = (window.OKUNUS || {})[DIL === 'en' ? 'en' : 'tr'] || {};
    kelimeHTML.renksiz = !STC.acik;
    const ayet = `<div class="ayet stc-ayet" dir="rtl" lang="ar">${w.map((k, i) => kelimeHTML(r, k, ofs[i])).join(' ')} <span class="ayet-no">﴿${a.toLocaleString('ar-EG')}﴾</span></div>`;
    kelimeHTML.renksiz = false;
    const satir = k => {
      kelimeHTML.filtre = k.k;
      const kel = w.slice(k.w1, k.w2 + 1).map((z, i) => kelimeHTML(r, z, ofs[k.w1 + i])).join(' ');
      kelimeHTML.filtre = null;
      const sesler = w.slice(k.w1, k.w2 + 1).map((_, i) => kelimeUrl(r, k.w1 + i + 1)).join(' ');
      return `<li class="stc-kural"><div class="stc-kelime ar" dir="rtl">${kel}</div>
        <div class="stc-bilgi"><b class="tc-${k.k}">● ${esc(k.ad)}</b><p>${esc(k.ack)}</p>
        <div class="satir sola"><button class="sesbtn ikincil kucuk" data-ardisik="${sesler}">${t('▶ Dinle')}</button>${k.unit && unitById(k.unit) ? `<button class="lejant-ac" data-git="ders|${k.unit}">📖 ${t('Dersi')}</button>` : ''}</div></div></li>`;
    };
    const q = STC.q, bitti = STC.acik && a === N;
    const la = l.filter(k => k.k !== 's'), ls = l.filter(k => k.k === 's');
    app.innerHTML = `${ust(t('{0} · ayet ayet tecvid', esc(sureAdi(x))))}<main class="stc">
      ${N <= 30 ? `<div class="stc-adim">${[...Array(N)].map((_, i) => `<button class="${i + 1 < a || (S.sureTecvid || {})[n] > i ? 'tamam' : ''} ${i + 1 === a ? 'simdi' : ''}" data-stc="${i + 1}" aria-label="${t('{0}. ayet', i + 1)}"></button>`).join('')}</div>`
        : `<div class="stc-uzun"><div class="pano-cubuk"><div style="width:${Math.round(a / N * 100)}%"></div></div><small>${t('{0}. ayet / {1}', a, N)}</small></div>`}
      <div class="stc-dene"><button class="cip ${S.ayar.kendiniDene ? 'aktif' : ''}" id="stcDene" aria-pressed="${!!S.ayar.kendiniDene}">🎯 ${t('Kendini dene')}</button><small class="soluk">${S.ayar.kendiniDene ? t('Kurallar, sen soruyu cevaplayınca açılır.') : t('Açarsan her ayette önce soruyu sen cevaplarsın.')}</small></div>
      <article class="kart stc-kart">${ayet}
        ${OKU[r] && okunusAcik() ? `<p class="okunus">🗣️ ${esc(OKU[r])}</p>` : ''}
        <div class="sesler"><button class="sesbtn" data-ses="${ayetUrl(r)}" data-yedek="${ayetUrl(r, KARILER[0].klasor)}">${t('▶ Ayeti dinle')}</button>${OKU[r] ? `<button class="lejant-ac ${okunusAcik() ? 'aktif' : ''}" id="stcOkunus">🔤 ${okunusAcik() ? t('Okunuşu gizle') : t('Okunuşu göster')}</button>` : ''}</div></article>
      ${q && !STC.acik ? `<section class="kart cevap-sende"><p class="cs-baslik">${t('🎯 Kendini dene')}</p>${q.ust}<p><b>${q.soru}</b></p>
        <div class="secenekler">${q.secenek.map((s, j) => `<button class="secenek" data-cs="${j}">${metin(s)}</button>`).join('')}</div>
        <button class="baglanti" id="csAtla">${t('Bilmiyorum, kuralları göster')}</button></section>` : ''}
      ${STC.acik ? `${STC.cevap ? STC.cevap : ''}<h2 class="baslik">${la.length ? t('İşaretli tecvid kuralları ({0})', la.length) : t('Bu ayette okunuşu değiştiren işaretli bir kural yok.')}</h2>
        ${la.length ? `<ol class="stc-liste">${la.map(satir).join('')}</ol>` : ''}
        ${ls.length ? `<details class="stc-okunmaz"><summary>${t('🔇 Yazılıp okunmayan harfler ({0})', ls.length)}</summary><ol class="stc-liste">${ls.map(satir).join('')}</ol></details>` : ''}
        ${bitti ? `<article class="kart stc-bitti"><h2>${N <= 30 ? t('🎉 {0} sûresinin tecvidini ayet ayet bitirdin!', esc(sureAdi(x))) : t('🎉 {0} sûresinin sonuna geldin!', esc(sureAdi(x)))}</h2><p>${t('Şimdi sûreyi baştan sona kendin oku; hatalarını yapay zekâ göstersin.')}</p></article>` : ''}` : ''}
      <div class="satir stc-alt">
        <button class="btn ikincil" data-stc="${a - 1}" ${a === 1 ? 'disabled' : ''}>‹</button>
        <button class="btn ikincil" data-git="sure|${n}|||${a}">🎤 ${t('Şimdi sen oku')}</button>
        ${a < N ? `<button class="btn" data-stc="${a + 1}">${t('Sonraki ›')}</button>` : `<button class="btn" data-git="sureTecvidSec">${t('Bitir')}</button>`}
      </div>
      <p class="soluk kucukyazi">${t('Kural işaretleri açık kaynaklı tecvid verisinden (quran-tajweed) otomatik çıkarılır; açıklamalar ders içeriğindendir.')} ${t('Not: Renkli tecvid mushaflarında olduğu gibi her med-i tabîî işaretlenmez; burada yalnız verinin işaretlediği yerler gösterilir.')}</p>
    </main>`;
    const ayetGit = b => { const yeni = +b; ekranYigini[ekranYigini.length - 1] = ['sureTecvid', [n, yeni]]; ciz(); window.scrollTo(0, 0); };
    app.querySelectorAll('[data-stc]').forEach(b => b.onclick = () => ayetGit(b.dataset.stc));
    app.querySelectorAll('[data-ardisik]').forEach(b => b.onclick = () => arkaArka(b.dataset.ardisik.split(' '), b));
    const atla = $('#csAtla'); if (atla) atla.onclick = () => { STC.acik = true; ciz(); };
    $('#stcDene').onclick = () => { S.ayar.kendiniDene = !S.ayar.kendiniDene; kaydet(); STC.r = ''; ciz(); };
    const so = $('#stcOkunus'); if (so) so.onclick = () => { S.ayar.okunus = !okunusAcik(); kaydet(); ciz(); };
    app.querySelectorAll('[data-cs]').forEach(b => b.onclick = () => {
      const sec_ = q.secenek[+b.dataset.cs], d = sec_ === q.dogru;
      srsGuncelle(q.anahtar, d);
      STC.cevap = `<div class="geribildirim ${d ? 'iyi' : 'kotu'}"><b>${d ? t('✓ Doğru!') : t('✗ Yanlış.')}</b> ${d ? '' : t('Doğru cevap: ') + metin(q.dogru)}${q.ustRenkli ? q.ustRenkli : ''}<p>${q.aciklama}</p></div>`;
      STC.acik = true; ciz();
      if (d && window.Konfeti) window.Konfeti.patlat(document.querySelector('.geribildirim'), 18);
    });
    if (bitti && window.Konfeti && !STC.kutlandi) { STC.kutlandi = r; window.Konfeti.kutla(); }
    app.querySelectorAll('.stc-bilgi, .cevap-sende, .geribildirim').forEach(k => sozlukBagla(k));
  };
  // Türkiye'de sık okunan sûre ve ayetler (yalnız sıralama önerisi; metin ve kurallar bütün Kur'an verisinden)
  const SIK_OKUNAN = [[2, 255, () => t('Âyetü\'l-Kürsî')], [2, 285, () => t('Âmenerrasûlü')], [36, 1, () => DIL === 'en' ? 'Ya-Sin' : 'Yâsîn'], [67, 1, () => DIL === 'en' ? 'Al-Mulk' : 'Mülk'], [78, 1, () => DIL === 'en' ? 'An-Naba' : 'Nebe\''], [55, 1, () => DIL === 'en' ? 'Ar-Rahman' : 'Rahmân'], [56, 1, () => DIL === 'en' ? 'Al-Waqi\'ah' : 'Vâkıa'], [48, 1, () => DIL === 'en' ? 'Al-Fath' : 'Fetih'], [18, 1, () => DIL === 'en' ? 'Al-Kahf' : 'Kehf']];
  EKRAN.sureTecvidSec = function () {
    const st = S.sureTecvid || {};
    app.innerHTML = `${ust(t('Sûre sûre tecvid'))}<main>
      <article class="kart stc-giris"><p>${t('Bir sûre seç, ayet ayet ilerle: önce dinle, sonra ayetteki bütün tecvid kurallarını kelime kelime gör ve dinle. İstersen "Kendini dene"yi aç; kuralları görmeden önce sen bul.')}</p></article>
      <div class="bolumler">${SURELER.map(x => { const v = st[x.n] || 0, N = x.ayet.length;
        return `<button class="bolum" data-git="sureTecvid|${x.n}|${v && v < N ? v + 1 : 1}"><span class="ikon ar">${esc(x.ar)}</span><span class="bad"><small>${t('{0} ayet', N)}</small>${esc(sureAdi(x))}</span>${v >= N ? `<span class="rozet ok">✓</span>` : v ? `<span class="rozet simdi">${v}/${N}</span>` : ''}</button>`; }).join('')}</div>
      <h2 class="baslik">${t('Sık okunanlar')}</h2>
      <div class="bolumler" id="sikOkunan">${SIK_OKUNAN.map(([n, a_, ad]) => { const v = st[n] || 0;
        return `<button class="bolum" data-git="sureTecvid|${n}|${a_ > 1 ? a_ : v ? v + 1 : 1}"><span class="ikon">📖</span><span class="bad"><small>${a_ > 1 ? t('Bakara {0}', a_ === 255 ? '255' : '285–286') : t('{0}. sûre', n)}</small>${esc(ad())}</span>${a_ === 1 && v ? `<span class="rozet simdi">${v}</span>` : ''}</button>`; }).join('')}</div>
      <p class="soluk kucukyazi">${t('Başka bir sûre için: Kur\'an sekmesinde sûreyi aç, “🧭 Ayet ayet tecvid” düğmesine dokun.')}</p>
    </main>`;
  };

  // ------------------------------------------------------------ Ders metnindeki Arapça örnekler: dokununca gerçek kâri sesiyle dinle
  // Kur'an kelimesi → kendi sesi; tek harf (harekesiz) → o harfin geçtiği bir Kur'an kelimesi (kalkalede harfin sakin/kalkale yapıldığı kelime).
  // Kur'an'da geçmeyen örnekler ve harekeli tek heceler (bunlar için hoca kaydı gerekir) sessiz kalır.
  const ISK = w => w.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '');
  function arSesler(metin_, uid) {
    const H = window.SES_HARITA; if (!H) return null; metin_ = metin_.trim();
    if (H.metin[metin_]) return H.metin[metin_].map(([s, a, w]) => kelimeUrl(s + ':' + a, w));
    const ws = metin_.split(/\s+/).filter(w => !['·', '→', '↔', '/', '،'].includes(w));
    if (!ws.length || !ws.every(w => w === ISK(w) && ISK(w).length >= 1 && ISK(w).length <= 2)) return null;
    const kalk = ws.every(w => 'قطبجد'.includes(w));
    const rs = ws.map(L => H.harf[uid + ':' + L] || (kalk ? H.harf['u15:' + L] : null) || H.harf['*:' + L]);
    if (!rs.every(Boolean)) return null;
    const l = rs.map(r => kelimeUrl(r[0] + ':' + r[1], r[2])); if (rs.length === 1) l.kelime = rs[0][3]; return l;
  }
  function arSesBagla(kok, uid) {
    if (!kok) return;
    // Harf grupları (ق ط ب ج د gibi): her harf ayrı dokunulur
    kok.querySelectorAll('.ar').forEach(el => {
      if (el.children.length || el.closest('button, .mh-harf')) return;
      const ws = el.textContent.trim().split(/\s+/);
      if (ws.length < 2 || !ws.every(w => w === ISK(w) && w.length <= 2)) return;
      el.innerHTML = ws.map(w => `<span class="ar">${esc(w)}</span>`).join(' ');
    });
    kok.querySelectorAll('span.ar, .ar:not(span)').forEach(sp => {
      if (sp.children.length || sp.classList.contains('ar-ses') || sp.closest('button, .mh-harf')) return;
      const l = arSesler(sp.textContent, uid); if (!l) return;
      sp.classList.add('ar-ses'); sp.setAttribute('role', 'button'); sp.tabIndex = 0; sp.title = t('Dinle');
      // Elif-Ba dersinde tek harfe dokununca harfin ADI söylenir (Elif, Be, Te…); Kur'an kelimesi o harfi içeren örnek olarak yalnız not düşülür
      const harfAdi = uid === 'e1' && window.Sesli && l.kelime ? ((window.TC.HARFLER || []).find(h => h[0] === sp.textContent.trim()) || [])[1] : '';
      const cal_ = async () => { if (harfAdi) { const k = await harfSesCal(sp.textContent.trim(), sp, true); toast(k === 'hoca' ? t('Hoca sesi: {0}', harfAdi) : t('Harf: {0}', harfAdi)); return; } arkaArka(l, sp); if (l.kelime) toast(t('Kur\'an\'dan: {0}', l.kelime)); };
      sp.onclick = cal_; sp.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cal_(); } };
    });
  }
  // Harf sesi: hocanın kaydı ('h:<harf>', HarfSes) varsa o çalar; yoksa yedek olarak harfin adı yapay sesle okunur (yedek: true)
  const harfAdiBul = h => ((window.TC.HARFLER || []).find(x => x[0] === h) || [])[1] || '';
  async function harfSesCal(h, btn, yedek) {
    if (window.HarfSes && HarfSes.var('h:' + h) && await HarfSes.cal('h:' + h, btn)) return 'hoca';
    const ad = harfAdiBul(h); if (yedek && ad && window.Sesli) { Sesli.dugmeyle(btn, ad); return 'yapay'; }
    return '';
  }
  // ------------------------------------------------------------ Mahreç dersi: bölümlü video, Kur'an'dan dinle, kendin oku, hisset
  const MV = { kaynak: 'tevhid', j: {} };
  function mahrecHTML(id, i) {
    const M = window.MAHREC; if (!M || !M.SAYFA[id]) return '';
    const kaynaklar = ['tevhid', 'diyanet'].filter(k => (M.V[k][i] || []).length);
    const harfler = (M.HARF_SIRA[i] || '').split(' ').filter(h => M.kelime(i, h));
    const hisset = M.HISSET[i] || [];
    if (!kaynaklar.length && !harfler.length && !hisset.length) return '';
    if (!kaynaklar.includes(MV.kaynak)) MV.kaynak = kaynaklar[0];
    let video = '';
    if (kaynaklar.length) {
      const L = M.V[MV.kaynak][i], j = Math.min(MV.j[MV.kaynak + i] || 0, L.length - 1), b = L[j], K = M.KANAL[MV.kaynak];
      video = `<section class="kart mv" id="mv">
        <div class="mv-bas"><b>🎬 ${t('Video ders')}</b>${M.onay || !TEST_SURUM ? '' : `<span class="rozet uyari">${t('Hoca onayı bekliyor')}</span>`}</div>
        ${kaynaklar.length > 1 ? `<div class="filtre">${kaynaklar.map(k => `<button class="${k === MV.kaynak ? 'aktif' : ''}" data-mv-kaynak="${k}">${k === 'tevhid' ? t('Mahreç anlatımı') : t('Hafız Davut Kaya: harf harf')}</button>`).join('')}</div>` : ''}
        <div class="mv-oynat" id="mvOynat"><button class="mv-baslat" id="mvBaslat"><img src="https://i.ytimg.com/vi/${b[0]}/hqdefault.jpg" alt="" loading="lazy"><span class="mv-play">▶</span><span class="mv-etiket">${b[4] ? `<span class="ar">${esc(b[4])}</span> ` : ''}${esc(b[3])}</span></button></div>
        <div class="mv-kontrol"><button class="btn ikincil" data-mv-git="${j - 1}" ${j === 0 ? 'disabled' : ''}>‹ ${t('Önceki')}</button><span class="soluk">${j + 1} / ${L.length}</span><button class="btn" data-mv-git="${j + 1}" ${j === L.length - 1 ? 'disabled' : ''}>${t('Sonraki bölüm')} ›</button></div>
        <ol class="mv-bolumler">${L.map((x, k) => `${MV.kaynak === 'tevhid' && (k === 0 || L[k - 1][0] !== x[0]) ? `<li class="mv-video">🎞️ ${esc(M.VIDEO_AD[x[0]] || '')}</li>` : ''}<li><button class="${k === j ? 'aktif' : ''}" data-mv-git="${k}">${x[4] ? `<span class="ar mv-harf">${esc(x[4])}</span>` : '<span class="mv-harf">•</span>'}<span class="mv-ad">${esc(x[3])}</span><span class="mv-sure">${M.zaman(x[1])}</span></button></li>`).join('')}</ol>
        <p class="soluk kucukyazi">${t('Video:')} <a href="${K.url}" target="_blank" rel="noopener">${esc(K.ad)}</a> · <a href="https://www.youtube.com/watch?v=${b[0]}&t=${b[1]}s" target="_blank" rel="noopener">${t('YouTube\'da aç')}</a></p>
      </section>`;
    }
    const dinle = harfler.length ? `<section class="kart mh">
        <h3>🔊 ${t('Harfi Kur\'an\'dan dinle, sonra sen oku')}</h3>
        <div class="mh-harfler">${harfler.map(h => { const [r, w, k] = M.kelime(i, h); return `<button class="mh-harf" data-mh="${h}" data-ses="${kelimeUrl(r, w)}"><span class="ar">${h}</span><small class="ar">${k}</small></button>`; }).join('')}</div>
        <div class="mh-oku" id="mhOku" hidden></div>
        <p class="soluk kucukyazi">${t('Harfe dokun: Kur\'an\'daki bir kelimeden gerçek kâri sesiyle dinlersin. Sonra "Sen oku" ile kendini kontrol et.')}</p>
      </section>` : '';
    const his = hisset.length ? `<section class="kart mh-hisset"><h3>✋ ${t('Hisset')}</h3><ul>${hisset.map(x => `<li>${x}</li>`).join('')}</ul></section>` : '';
    return video + dinle + his;
  }
  function mahrecBagla(id, i) {
    const M = window.MAHREC; if (!M || !M.SAYFA[id]) return;
    const yenile = () => { const y = $('#mv'); if (!y) return; const yeni = document.createElement('div'); yeni.innerHTML = mahrecHTML(id, i); y.replaceWith(yeni.querySelector('#mv')); bagla(); };
    const oynat = () => {
      const L = M.V[MV.kaynak][i], b = L[Math.min(MV.j[MV.kaynak + i] || 0, L.length - 1)];
      sesDurdur();
      $('#mvOynat').innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${b[0]}?start=${b[1]}${b[2] ? '&end=' + b[2] : ''}&autoplay=1&rel=0&playsinline=1&modestbranding=1" title="${esc(b[3])}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    };
    const bagla = () => {
      const bs = $('#mvBaslat'); if (bs) bs.onclick = oynat;
      app.querySelectorAll('[data-mv-git]').forEach(x => x.onclick = () => { MV.j[MV.kaynak + i] = +x.dataset.mvGit; const oynuyor = !!app.querySelector('#mvOynat iframe'); yenile(); if (oynuyor || x.closest('.mv-bolumler') || x.closest('.mv-kontrol')) oynat(); });
      app.querySelectorAll('[data-mv-kaynak]').forEach(x => x.onclick = () => { MV.kaynak = x.dataset.mvKaynak; yenile(); });
    };
    bagla();
    // Harfe dokununca: kelime çalar (genel data-ses tıklaması) ve "Sen oku" kutusu o harfe göre açılır
    app.querySelectorAll('[data-mh]').forEach(b => b.addEventListener('click', ev => {
      if (window.HarfSes && HarfSes.var('h:' + b.dataset.mh)) { ev.stopPropagation(); harfSesCal(b.dataset.mh, b); }
      app.querySelectorAll('.mh-harf.secili').forEach(x => x.classList.remove('secili')); b.classList.add('secili');
      const h = b.dataset.mh, [r, w, k] = M.kelime(i, h), kutu = $('#mhOku'); kutu.hidden = false;
      kutu.innerHTML = `<p><b class="ar mh-kelime">${k}</b></p><div class="satir sola"><button class="sesbtn" data-ses="${kelimeUrl(r, w)}">▶ ${t('Tekrar dinle')}</button><button class="sesbtn" id="mhSenOku">🎤 ${t('Sen oku')}</button></div><div id="mhSonuc"></div>`;
      $('#mhSenOku').onclick = () => mahrecOkut(h, r, w, $('#mhSenOku'));
    }));
  }
  let MH_KAYIT = null;
  async function mahrecOkut(h, r, w, btn, sonucKutu) {
    const sonuc = sonucKutu || $('#mhSonuc');
    if (MH_KAYIT) { MH_KAYIT.stop(); return; }
    if (!navigator.mediaDevices || !window.MediaRecorder) return toast(t('Bu cihazda ses kaydı desteklenmiyor.'));
    let O; try { O = await okumaHazirla(); } catch (e) { return toast(e.message); }
    let akis; try { akis = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); } catch (e) { return toast(t('Mikrofon izni verilmedi. Telefon ayarlarından Kur\'an Yolum için mikrofona izin ver.')); }
    sesDurdur();
    const parca = [], rec = new MediaRecorder(akis); MH_KAYIT = rec;
    btn.textContent = t('⏹ Bitir'); btn.classList.add('kirmizi-btn', 'kaydediyor');
    sonuc.innerHTML = `<p class="soluk">${t('🎙️ Dinliyorum… Kelimeyi oku.')}</p>`;
    O.modelAc().catch(() => { });
    const zaman = setTimeout(() => rec.state !== 'inactive' && rec.stop(), 5000);
    rec.ondataavailable = e => { if (e.data && e.data.size) parca.push(e.data); };
    rec.onstop = async () => {
      clearTimeout(zaman); akis.getTracks().forEach(x => x.stop()); MH_KAYIT = null;
      btn.textContent = '🎤 ' + t('Sen oku'); btn.classList.remove('kirmizi-btn', 'kaydediyor');
      sonuc.innerHTML = `<p class="soluk">${t('Kontrol ediliyor…')}</p>`;
      try {
        const [s, a] = r.split(':').map(Number);
        const ref = (await O.fonetik(s))[a - 1], [x0, x1] = ref.sp[w - 1], bek = ref.p.slice(x0, x1);
        const ses = await O.sesCoz(new Blob(parca, { type: rec.mimeType || 'audio/webm' }));
        const d = await O.dinle(ses), duy = d.heard;
        const bekL = Array.from(bek), hedef = [h, { 'ا': 'ء' }[h], { 'ي': 'ۦ', 'و': 'ۥ' }[h]].find(x => x && bekL.includes(x)) || h;
        let dogru = !!duy && duy.includes(hedef);
        if (dogru) for (const [tag, i1, i2] of O.opcodes(Array.from(bek), Array.from(duy))) if (tag !== 'equal' && tag !== 'insert' && Array.from(bek).slice(i1, i2).includes(hedef)) dogru = false;
        sonuc.innerHTML = !duy ? `<p class="r-orta">${t('Sesini duyamadım. Biraz daha yüksek ve yakından oku.')}</p>`
          : dogru ? `<p class="r-iyi"><b>${t('🟢 Harfi doğru çıkardın. Maşallah!')}</b></p>`
          : `<p class="r-orta"><b>${t('🟠 Tekrar dene.')}</b> ${t('Önce kâriyi dinle, sonra aynı yerden çıkarmaya çalış.')}</p><div class="satir sola"><button class="sesbtn" data-ses="${kelimeUrl(r, w)}">▶ ${t('Doğrusunu dinle')}</button></div>`;
        sonuc.innerHTML += `<p class="soluk kucukyazi">${t('Yapay zekâ yanılabilir; son söz hocanındır.')}</p>`;
      } catch (e) { sonuc.innerHTML = `<p class="hata">${esc(e.message || t('Kontrol edilemedi.'))}</p>`; }
    };
    rec.start();
  }
  // ------------------------------------------------------------ Harf kartları: 17 mahreç, harf başına kart, etkileşimli şema
  // (toplanti-2026-11-18-harf-kartlari.md). Veri: js/harfkart.js, kelimeler: js/harfkart-kelime.js (tools/harf-kelime.js)
  const HKV = () => window.HARFKART;
  const hkSira = () => { const H = HKV(); return H.MAHRECLER.flatMap(m => m.harfler.filter(h => H.anaMahrec(h).no === m.no)); };
  const hkMahrecAd = m => DIL === 'en' && HKV().EN ? HKV().EN.ad[m.no - 1] : m.ad;
  const hkMahrecAciklama = m => DIL === 'en' && HKV().EN ? HKV().EN.aciklama[m.no - 1] : m.aciklama;
  const hkHarfBtn = h => `<button class="hkt-harf ${HKV().kalinMi(h) ? 'kalin' : ''}" data-git="harfKarti|${h}" aria-label="${esc(HKV().AD[h])}"><span class="ar">${h}</span><small>${esc(HKV().AD[h])}</small><i class="hkt-hop" data-hkses="${h}" role="button" aria-label="${t('Harfi dinle')}">🔊</i></button>`;
  function hkSemaBagla(kok, secince) {
    kok.querySelectorAll('[data-mno]').forEach(g => {
      const f = e => { e.stopPropagation(); secince(+g.dataset.mno); };
      g.addEventListener('click', f);
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); f(e); } });
    });
  }
  EKRAN.harfKartlari = function (secili) {
    const H = HKV(); if (!H) { app.innerHTML = `${ust(t('Harf kartları'))}<main><p class="hata">${t('Yüklenemedi.')}</p></main>`; return; }
    secili = +secili || 0;
    const sm = secili ? H.MAHRECLER[secili - 1] : null;
    app.innerHTML = `${ust(t('Harf kartları'))}<main>
      <section class="kart"><h2 style="margin-top:0">${t('Mahreç şeması')}</h2>
        ${H.sema(secili)}
        <p class="soluk kucukyazi hkt-sema-ipucu">${t('Bir numaraya dokun: o mahreçten çıkan harfleri görürsün. Şematik çizimdir.')}</p>
        ${sm ? `<div class="hkt-secili" id="hkSecili"><div class="hkt-mahrec-bas"><span class="hkt-no">${sm.no}</span><span><b>${esc(hkMahrecAd(sm))}</b><small>${sm.klasik ? esc(sm.klasik) + ' · ' : ''}${esc(t(H.BOLGE[sm.bolge]))}</small></span></div>
          <p>${esc(hkMahrecAciklama(sm))}</p>
          ${sm.harfler.length ? `<div class="hkt-harfler">${sm.harfler.map(hkHarfBtn).join('')}</div>` : `<div class="satir sola"><button class="sesbtn" data-git="ders|u13">${t('Ğunne dersi')} ›</button></div>`}</div>` : ''}
      </section>
      <p class="soluk kucukyazi">${t('Harfler 17 mahrece göre sıralı. Kırmızı harfler kalın okunur. Harfe dokun: okunuşu, mahreci, videosu ve Kur\'an\'dan kelimeleri.')}</p>
      ${H.MAHRECLER.map(m => `<section class="kart hkt-mahrec" id="hkm${m.no}"><div class="hkt-mahrec-bas"><span class="hkt-no">${m.no}</span><span><b>${esc(hkMahrecAd(m))}</b><small>${m.klasik ? esc(m.klasik) + ' · ' : ''}${esc(t(H.BOLGE[m.bolge]))}</small></span></div>
        ${m.harfler.length ? `<div class="hkt-harfler">${m.harfler.map(hkHarfBtn).join('')}</div>` : `<p class="soluk kucukyazi">${t('Harf yok: nûn ve mîmin ğunnesi buradan çıkar.')}</p>`}</section>`).join('')}
      ${TEST_SURUM ? `<p class="soluk kucukyazi"><span class="rozet uyari">${t('Hoca onayı bekliyor')}</span></p>` : ''}
    </main>`;
    app.querySelectorAll('[data-hkses]').forEach(i => i.onclick = ev => { ev.stopPropagation(); harfSesCal(i.dataset.hkses, null, true); });
    hkSemaBagla(app, n => { ekranYigini[ekranYigini.length - 1] = ['harfKartlari', [n === secili ? 0 : n]]; ciz(); const y = $('#hkSecili'); if (y) y.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
  };
  const HK_TUR = { hareke: 'Harekeli', sakin: 'Cezimli (sakin)', sedde: 'Şeddeli', med: 'Uzatma (med)' };
  function hkVideolar(h) {
    const M = window.MAHREC; if (!M) return [];
    const ara = (kaynak, f) => { for (const L of Object.values(M.V[kaynak])) for (const b of L) if (b[4] && f(b[4].split(' '))) return b; return null; };
    const l = [];
    const d = ara('diyanet', x => x.includes(h === 'ء' ? 'ا' : h)); if (d) l.push(['diyanet', d]);
    const tv = ara('tevhid', x => x.includes(h)); if (tv) l.push(['tevhid', tv]);
    return l;
  }
  EKRAN.harfKarti = function (h) {
    const H = HKV(); if (!H || !H.AD[h]) return EKRAN.harfKartlari();
    const m = H.anaMahrec(h), ikinci = H.mahrecOf(h).filter(x => x.no !== m.no), kalin = H.kalinMi(h);
    const kel = (window.HARF_KELIME || {})[h] || [], vid = hkVideolar(h), kar = H.karisan(h), sira = hkSira(), j = sira.indexOf(h);
    const halHtml = H.halleri(h).map((x, i) => { const k = 'hr:' + h + ':' + i, var_ = window.HarfSes && HarfSes.var(k); return `<button class="${var_ ? '' : 'yok'}" data-hhal="${i}" aria-label="${esc(x)}"><span class="ar">${x}</span></button>`; }).join('');
    const ilkKelime = x => ((window.HARF_KELIME || {})[x] || [])[0];
    app.innerHTML = `${ust(t('Harf kartı') + ' · ' + esc(H.AD[h]))}<main>
      <section class="kart hkt-bas">
        <button class="ar hkt-buyuk hkt-buyuk-ses ${kalin ? 'kalin' : ''}" id="hkHarfSes" aria-label="${t('Harfi dinle')}">${h}<small>🔊</small></button>
        <h2 style="margin:0">${esc(H.AD[h])}</h2>
        <p class="soluk" style="margin:.2em 0 .6em">${esc(t(H.KALINLIK[h] || (kalin ? 'Kalın okunur' : 'İnce okunur')))}</p>
        ${halHtml ? `<div class="hkt-haller">${halHtml}</div><p class="soluk kucukyazi">${t('Üstün, esre, ötre. Hoca sesi kaydedilmişse dokununca çalar; yoksa aşağıdaki video ve kelimelerden dinle.')}</p>` : ''}
      </section>
      <section class="kart"><div class="hkt-mahrec-bas"><span class="hkt-no">${m.no}</span><span><b>${t('Mahreç {0}', m.no)} · ${esc(hkMahrecAd(m))}</b><small>${m.klasik ? esc(m.klasik) + ' · ' : ''}${esc(t(H.BOLGE[m.bolge]))}</small></span></div>
        <p>${esc(hkMahrecAciklama(m))}</p>
        ${ikinci.map(x => `<p class="not">${t('Med harfi olunca: {0}. mahreç, {1}.', x.no, esc(hkMahrecAd(x)))}</p>`).join('')}
        <div id="hkSema">${H.sema(m.no, { kucuk: true })}</div>
        <div class="satir sola"><button class="sesbtn ikincil" data-git="harfKartlari|${m.no}">${t('Bütün mahreçler')} ›</button></div>
      </section>
      ${vid.length ? `<section class="kart mv"><h3 style="margin-top:0">🎬 ${t('Ağız hareketini izle')}</h3>
        <div class="mv-oynat" id="hkVideo"><button class="mv-baslat" data-hkv="0"><img src="https://i.ytimg.com/vi/${vid[0][1][0]}/hqdefault.jpg" alt="" loading="lazy"><span class="mv-play">▶</span><span class="mv-etiket">${esc(vid[0][1][3])}</span></button></div>
        ${vid.length > 1 ? `<div class="filtre">${vid.map(([k], i) => `<button class="${i === 0 ? 'aktif' : ''}" data-hkv="${i}">${k === 'diyanet' ? t('Harekeleriyle okunuş') : t('Mahreç anlatımı')}</button>`).join('')}</div>` : ''}
        <p class="soluk kucukyazi" id="hkVideoKaynak">${t('Video:')} ${esc(window.MAHREC.KANAL[vid[0][0]].ad)}</p></section>` : ''}
      <section class="kart"><h3 style="margin-top:0">🎭 ${t('Sıfatları')}</h3><div class="hkt-rozetler">${H.sifatlar(h).map(x => `<span class="hkt-rozet ${x.tip}">${esc(t(x.ad))}</span>`).join('')}</div>
        <p class="soluk kucukyazi">${t('Sıfat, harfin karakteridir: nefes akıyor mu, ses hapsoluyor mu, kalın mı ince mi?')}</p></section>
      ${kar.length ? `<section class="kart"><h3 style="margin-top:0">🎧 ${t('Şununla karıştırma')}</h3>
        <div class="hkt-karis">${[h, ...kar].map(x => { const k = ilkKelime(x); return `<button class="sesbtn ${x === h ? '' : 'ikincil'}" ${k ? `data-ses="${kelimeUrl(k[0], k[1])}"` : ''}>▶ <span class="ar">${x}</span> ${k ? `<span class="ar">${esc(k[2])}</span>` : ''}</button>`; }).join('')}</div>
        <div class="satir sola" style="margin-top:8px">${kar.map(x => `<button class="link" data-git="harfKarti|${x}">${esc(H.AD[x])} ${t('kartı')} ›</button>`).join('')}</div></section>` : ''}
      ${kel.length ? `<section class="kart"><h3 style="margin-top:0">📖 ${t('Bu harfi içeren kelimeler')}</h3>
        <ul class="hkt-kelimeler">${kel.map(([r, w, k, tur], i) => `<li><button class="sesbtn" data-ses="${kelimeUrl(r, w)}" aria-label="${t('Dinle')}">🔊</button><span class="hkt-etiket"><span class="hkt-ref">${r}</span><span class="hkt-tur">${esc(t(HK_TUR[tur] || ''))}</span></span><span class="ar">${esc(k)}</span><button class="sesbtn ikincil" data-hk-oku="${i}">🎤 ${t('Sen oku')}</button><div class="hkt-sonuc" id="hkSonuc${i}"></div></li>`).join('')}</ul>
        <p class="soluk kucukyazi">${t('Fâtiha ve Amme cüzünden, gerçek kâri sesi. 🎤 ile oku: yapay zekâ harfi doğru çıkarıp çıkarmadığını söyler. Ses telefonda değerlendirilir, gönderilmez.')}</p></section>` : ''}
      <section class="kart"><h3 style="margin-top:0">📚 ${t('Bu konudaki dersler')}</h3>
        <div class="satir sola">${H.dersler(h).filter(([id]) => unitById(id)).map(([id, sf]) => `<button class="sesbtn ikincil" data-hk-ders="${id}|${sf}">${unitById(id).ikon} ${esc(unitById(id).ad)}</button>`).join('')}</div></section>
      <div class="hkt-gezin">
        <button class="btn ikincil" ${j > 0 ? `data-git="harfKarti|${sira[j - 1]}"` : 'disabled'}>‹ ${j > 0 ? esc(H.AD[sira[j - 1]]) : ''}</button>
        <button class="btn" ${j < sira.length - 1 ? `data-git="harfKarti|${sira[j + 1]}"` : 'disabled'}>${j < sira.length - 1 ? esc(H.AD[sira[j + 1]]) : ''} ›</button>
      </div>
      ${TEST_SURUM ? `<p class="soluk kucukyazi"><span class="rozet uyari">${t('Hoca onayı bekliyor')}</span></p>` : ''}
    </main>`;
    // Geri giderken sayfa yığını doğru kalsın: karttan karta geçişte yığın büyümesin
    const ys = ekranYigini; if (ys.length >= 2 && ys[ys.length - 2][0] === 'harfKarti') ys.splice(ys.length - 2, 1);
    app.querySelectorAll('[data-hhal]').forEach(b => b.onclick = async () => {
      const k = 'hr:' + h + ':' + b.dataset.hhal;
      if (!(window.HarfSes && await HarfSes.cal(k, b))) toast(t('Bu hecenin hoca sesi henüz yok. Videodan ya da aşağıdaki kelimelerden dinleyebilirsin.'));
    });
    hkSemaBagla($('#hkSema'), n => git('harfKartlari', n));
    const hs_ = $('#hkHarfSes'); if (hs_) hs_.onclick = () => harfSesCal(h, hs_, true);
    app.querySelectorAll('[data-hkv]').forEach(b => b.onclick = () => {
      const [kaynak, x] = vid[+b.dataset.hkv];
      sesDurdur();
      app.querySelectorAll('.filtre [data-hkv]').forEach(y => y.classList.toggle('aktif', y === b || y.dataset.hkv === b.dataset.hkv));
      $('#hkVideo').innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${x[0]}?start=${x[1]}${x[2] ? '&end=' + x[2] : ''}&autoplay=1&rel=0&playsinline=1&modestbranding=1" title="${esc(x[3])}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      $('#hkVideoKaynak').innerHTML = `${t('Video:')} ${esc(window.MAHREC.KANAL[kaynak].ad)} · <a href="https://www.youtube.com/watch?v=${x[0]}&t=${x[1]}s" target="_blank" rel="noopener">${t('YouTube\'da aç')}</a>`;
    });
    app.querySelectorAll('[data-hk-oku]').forEach(b => b.onclick = () => {
      const i = +b.dataset.hkOku, [r, w] = kel[i];
      app.querySelectorAll('.hkt-sonuc').forEach(x => { if (x.id !== 'hkSonuc' + i) x.innerHTML = ''; });
      mahrecOkut(h, r, w, b, $('#hkSonuc' + i));
    });
    app.querySelectorAll('[data-hk-ders]').forEach(b => b.onclick = () => {
      const [id, sf] = b.dataset.hkDers.split('|'); EKRAN.ders._sayfa = EKRAN.ders._sayfa || {}; EKRAN.ders._sayfa[id] = +sf || 0; git('ders', id);
    });
  };
  // ------------------------------------------------------------ hikâye dersleri (kısa anlatım: kart kart)
  const HK = { id: '', kartlar: [], q: null, cevap: null };
  function hikayeKartlar(u) {
    const k = [{ tip: 'kapak' }];
    // Uzun sayfalar kart başına tek fikir olacak şekilde bloklarına bölünür (paragraf, liste, not)
    u.sayfalar.forEach(s => {
      const tpl = document.createElement('template'); tpl.innerHTML = s.h;
      const bloklar = [...tpl.content.childNodes].filter(n => n.nodeType === 1 || (n.textContent || '').trim());
      const gruplar = []; let g = [], uz = 0;
      bloklar.forEach(b => { const l = (b.textContent || '').length; if (g.length && uz + l > 300) { gruplar.push(g); g = []; uz = 0; } g.push(b); uz += l; });
      if (g.length) gruplar.push(g);
      if (gruplar.length <= 1) return k.push({ tip: 'sayfa', s });
      gruplar.forEach((gr, i) => k.push({ tip: 'sayfa', s: { t: `${s.t} (${i + 1}/${gruplar.length})`, h: gr.map(b => b.outerHTML || b.textContent).join('') } }));
    });
    (u.ornek || []).slice(0, 2).forEach(ex => k.push({ tip: 'ornek', ex }));
    if ((u.sorular || []).length) k.push({ tip: 'soru' });
    k.push({ tip: 'son' });
    return k;
  }
  EKRAN.hikaye = function (id, i) {
    const u = unitById(id); if (!u) return anaSayfa();
    if (HK.id !== id) Object.assign(HK, { id, kartlar: hikayeKartlar(u), q: (u.sorular || []).length ? soruUret(`c:${id}:${Math.floor(Math.random() * u.sorular.length)}`) : null, cevap: null });
    const K = HK.kartlar; i = Math.min(Math.max(0, +i || 0), K.length - 1);
    const k = K[i], son = i === K.length - 1;
    if (k.tip === 'son' && (S.okunan[id] || 0) < u.sayfalar.length) { S.okunan[id] = u.sayfalar.length; kaydet(); }
    let ic = '';
    if (k.tip === 'kapak') ic = `<div class="hk-kapak"><span class="hk-ikon">${u.ikon}</span><small>${t('Kısa anlatım')}</small><h2>${esc(u.ad)}</h2><p>${t('{0} kart · yaklaşık {1} dakika', K.length, Math.max(1, Math.round(K.length / 3)))}</p><p class="soluk">${t('Dokun ya da kaydır: ›')}</p></div>`;
    else if (k.tip === 'sayfa') ic = `<h2>${esc(k.s.t)}</h2><div class="hk-metin">${k.s.h}</div>`;
    else if (k.tip === 'ornek') ic = `<p class="hk-etiket">${t('Örnek')} · ${esc(R[k.ex.k].ad)}</p>${ayetHTML(k.ex, true)}<p class="okunus">🗣️ <b>${esc(k.ex.oku)}</b></p><p>${esc(k.ex.n)}</p>${sesButonlari(k.ex)}`;
    else if (k.tip === 'soru') { const q = HK.q; ic = `<p class="cs-baslik">${t('🎯 Kendini dene')}</p><p><b>${q.soru}</b></p><div class="secenekler">${q.secenek.map((s, j) => `<button class="secenek ${HK.cevap ? (s === q.dogru ? 'dogru' : HK.cevap.sec === j ? 'yanlis' : '') : ''}" data-hks="${j}" ${HK.cevap ? 'disabled' : ''}>${metin(s)}</button>`).join('')}</div>${HK.cevap ? HK.cevap.html : ''}`; }
    else ic = `<div class="hk-kapak"><span class="hk-ikon">✅</span><h2>${t('Kısa anlatımı bitirdin!')}</h2><p>${t('Şimdi ne yapmak istersin?')}</p>
      <div class="hk-secim"><button class="btn" data-git="testBasla|bolum|${id}">${t('✅ Teste gir')}</button><button class="btn ikincil" data-hkgit="ders">${t('📖 Detaylı ders')}</button><button class="btn ikincil" data-hk="0">${t('↺ Baştan izle')}</button></div></div>`;
    app.innerHTML = `<div class="hk-ekran">
      <div class="hk-ust"><div class="hk-cubuk">${K.map((_, j) => `<span class="${j < i ? 'dolu' : j === i ? 'simdi' : ''}"></span>`).join('')}</div>
        <div class="hk-bas"><span>${u.ikon} ${esc(u.ad)}</span><button class="hk-kapat" data-git="geri" aria-label="${t('Kapat')}">✕</button></div></div>
      <article class="hk-kart hk-${k.tip}">${ic}</article>
      <div class="hk-alt"><button class="btn ikincil" data-hk="${i - 1}" ${i === 0 ? 'disabled' : ''} aria-label="${t('Önceki')}">‹</button><span class="soluk">${i + 1} / ${K.length}</span><button class="btn" data-hk="${i + 1}" ${son || (k.tip === 'soru' && !HK.cevap) ? 'disabled' : ''} aria-label="${t('Sonraki')}">›</button></div>
    </div>`;
    const kartGit = j => { ekranYigini[ekranYigini.length - 1] = ['hikaye', [id, j]]; if (+j === 0 && son) Object.assign(HK, { id: '' }); ciz(); window.scrollTo(0, 0); };
    arSesBagla(app.querySelector('.hk-metin'), id);
    app.querySelectorAll('[data-hk]').forEach(b => b.onclick = () => kartGit(+b.dataset.hk));
    app.querySelectorAll('[data-hkgit]').forEach(b => b.onclick = () => { ekranYigini[ekranYigini.length - 1] = ['ders', [id, 'ders']]; ciz(); });
    app.querySelectorAll('[data-hks]').forEach(b => b.onclick = () => {
      const q = HK.q, j = +b.dataset.hks, d = q.secenek[j] === q.dogru; srsGuncelle(q.anahtar, d); kaydet();
      HK.cevap = { sec: j, html: `<div class="geribildirim ${d ? 'iyi' : 'kotu'}"><b>${d ? t('✓ Doğru!') : t('✗ Yanlış.')}</b> ${d ? '' : t('Doğru cevap: ') + metin(q.dogru)}${q.aciklama ? `<p>${q.aciklama}</p>` : ''}</div>` };
      ciz(); if (d && window.Konfeti) window.Konfeti.patlat(document.querySelector('.hk-kart .geribildirim'), 18);
    });
    const kart = app.querySelector('.hk-kart'); sozlukBagla(kart);
    // Kaydırma: sola kaydır → sonraki, sağa → önceki (sağdan sola dil olsa da ekran düzeni soldan sağa)
    let x0 = null;
    kart.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    kart.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (dx < -60 && !son && !(k.tip === 'soru' && !HK.cevap)) kartGit(i + 1); else if (dx > 60 && i > 0) kartGit(i - 1); });
    if (k.tip === 'kapak') kart.onclick = e => { if (!e.target.closest('button')) kartGit(1); };
  };

  // ------------------------------------------------------------ günün sorusu ("cevap sende")
  function gununSorusuHavuz() {
    const havuz = [];
    acikDersler().forEach(u => (u.sorular || []).forEach((_, j) => havuz.push(`c:${u.id}:${j}`)));
    [1, 112, 113, 114].forEach(n => { const x = SURE(n); if (!x) return; x.ayet.forEach((_, i) => (RENK[`${n}:${i + 1}`] || []).forEach(([, , k], j) => { if (k !== 's') havuz.push(`k:${n}:${i + 1}:${j}`); })); });
    return havuz;
  }
  function gununSorusuAnahtar() {
    const havuz = gununSorusuHavuz(); if (!havuz.length) return null;
    const tohum = [...(bugun() + AKTIF)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
    return havuz[tohum % havuz.length];
  }
  // Günün sorusu: günde bir soru sayılır (doğru ya da yanlış fark etmez, toplam gün tutulur);
  // cevaptan sonra kart küçülür, kapatılabilir; en fazla 3 ek pratik sorusu (sayılmaz).
  const GS_EK = 3;
  const gsSoru = k => { const c = gununSorusuKarti._c = gununSorusuKarti._c || {}; return c[k] || (c[k] = soruUret(k)); };
  const gsGeri = (q, sec, d) => `<div class="geribildirim ${d ? 'iyi' : 'kotu'}"><b>${d ? t('✓ Doğru!') : t('✗ Yanlış.')}</b> ${d ? '' : t('Doğru cevap: ') + metin(q.dogru)}${q.aciklama ? `<p>${q.aciklama}</p>` : ''}</div>`;
  const gsSecenek = (q, sec, kilit, ek) => `<div class="secenekler">${q.secenek.map((x, j) => `<button class="secenek ${kilit ? (x === q.dogru ? 'dogru' : sec === j ? 'yanlis' : '') : ''}" ${ek ? 'data-gse' : 'data-gs'}="${j}" ${kilit ? 'disabled' : ''}>${metin(x)}</button>`).join('')}</div>`;
  function gununSorusuKarti() {
    if (S.ayar.gsGizle) return '';
    const g = S.gununSorusu && S.gununSorusu.g === bugun() ? S.gununSorusu : null;
    if (g && g.kapali) return '';
    const anahtar = (g && g.a) || gununSorusuAnahtar(); if (!anahtar) return '';
    const q = gsSoru(anahtar); if (!q) return '';
    const gs = S.gs || { gun: 0, dogru: 0 };
    // Cevaplanmadan önce: ince, açılır-kapanır satır (ana sayfada dikkati "Devam et"ten çalmasın)
    if (!g) return `<details class="kart gunun-sorusu gs-acilir" id="gununSorusu" ${gununSorusuKarti.acik ? 'open' : ''}>
      <summary class="gs-satir"><span class="gs-ikon">🎯</span><div><b>${t('Günün sorusu')}</b><small>${gs.gun ? t('Bir soru · {0} gündür cevaplıyorsun', gs.gun) : t('Bir soru · yarım dakika')}</small></div><span class="gs-ok" aria-hidden="true">›</span></summary>
      <div class="gs-govde">${q.ust || ''}<p><b>${q.soru}</b></p>${gsSecenek(q)}</div></details>`;
    // ek pratik sorusu açıksa
    if (g.ekA) {
      const e = gsSoru(g.ekA); if (e) return `<section class="kart cevap-sende gunun-sorusu" id="gununSorusu"><p class="cs-baslik">${t('➕ Pratik sorusu {0}/{1}', g.ek || 1, GS_EK)}</p>
        ${g.ekSec != null ? e.ustRenkli || '' : e.ust || ''}<p><b>${e.soru}</b></p>${gsSecenek(e, g.ekSec, g.ekSec != null, true)}
        ${g.ekSec != null ? gsGeri(e, g.ekSec, g.ekD) + `<div class="satir sola">${(g.ek || 0) < GS_EK ? `<button class="btn ikincil" id="gsEk">${t('Bir soru daha')}</button>` : ''}<button class="btn" id="gsTamam">${t('Tamam')}</button></div>` : ''}</section>`;
    }
    return `<section class="kart gunun-sorusu kucuk-gs" id="gununSorusu">
      <div class="gs-satir"><span class="gs-ikon">${g.d ? '✅' : '📘'}</span><div><b>${t('Günün sorusu tamam')}</b><small>${g.d ? t('Doğru cevapladın.') : t('Açıklamayı okudun, bu da kazanç.')} · 📅 ${t('{0} gün', gs.gun || 1)}</small></div>
        <button class="gs-kapat" id="gsKapat" aria-label="${t('Kapat')}">✕</button></div>
      <details class="gs-detay"><summary>${t('Soruyu ve açıklamayı gör')}</summary>${q.ustRenkli || ''}<p><b>${q.soru}</b></p>${gsSecenek(q, g.sec, true)}${gsGeri(q, g.sec, g.d)}</details>
      ${(g.ek || 0) < GS_EK ? `<button class="btn ikincil kucuk" id="gsEk">${t('➕ Bir soru daha ({0} kaldı)', GS_EK - (g.ek || 0))}</button>` : `<p class="soluk kucukyazi">${t('Bugünlük bu kadar. Yarın yeni soru gelecek.')}</p>`}</section>`;
  }
  function gununSorusuBagla() {
    const kok = $('#gununSorusu'); if (!kok) return; sozlukBagla(kok);
    if (kok.tagName === 'DETAILS') kok.ontoggle = () => { gununSorusuKarti.acik = kok.open; };
    const g = S.gununSorusu && S.gununSorusu.g === bugun() ? S.gununSorusu : null;
    kok.querySelectorAll('[data-gs]:not([disabled])').forEach(b => b.onclick = () => {
      const q = gsSoru(gununSorusuAnahtar()), j = +b.dataset.gs, d = q.secenek[j] === q.dogru;
      S.gununSorusu = { g: bugun(), a: q.anahtar, sec: j, d };
      const gs = S.gs = S.gs || { gun: 0, dogru: 0 }; if (gs.son !== bugun()) { gs.gun = (gs.gun || 0) + 1; gs.son = bugun(); if (d) gs.dogru = (gs.dogru || 0) + 1; }
      srsGuncelle(q.anahtar, d); kaydet(); ciz();
      const yeni = $('#gununSorusu'); if (yeni) { const det = yeni.querySelector('.gs-detay'); if (det) det.open = true; if (d && window.Konfeti) window.Konfeti.patlat(yeni, 22); }
    });
    kok.querySelectorAll('[data-gse]:not([disabled])').forEach(b => b.onclick = () => {
      const e = gsSoru(g.ekA), j = +b.dataset.gse, d = e.secenek[j] === e.dogru;
      Object.assign(g, { ekSec: j, ekD: d }); srsGuncelle(e.anahtar, d); kaydet(); ciz();
      if (d && window.Konfeti) window.Konfeti.patlat($('#gununSorusu'), 16);
    });
    const ek = $('#gsEk'); if (ek) ek.onclick = () => {
      const kullanilan = new Set([g.a].concat(g.ekler || [])), havuz = gununSorusuHavuz().filter(k => !kullanilan.has(k));
      if (!havuz.length) { toast(t('Şimdilik yeni soru yok.')); return; }
      const k = havuz[Math.floor(Math.random() * havuz.length)];
      Object.assign(g, { ekA: k, ek: (g.ek || 0) + 1, ekSec: null, ekD: null, ekler: (g.ekler || []).concat([k]) }); kaydet(); ciz();
    };
    const tm = $('#gsTamam'); if (tm) tm.onclick = () => { Object.assign(g, { ekA: null, ekSec: null }); kaydet(); ciz(); };
    const kp = $('#gsKapat'); if (kp) kp.onclick = () => { g.kapali = true; kaydet(); ciz(); };
  }

  EKRAN.mesk = function (n, a) {
    n = +n; a = +a;
    if (!SURE(n)) { app.innerHTML = `${ust(t('Meşk'))}<main><p class="soluk">${t('Yükleniyor…')}</p></main>`; sureYukle(n).then(() => ciz()).catch(() => toast(t('Sûre açılamadı.'))); return; }
    if (MESK.n !== n || MESK.a !== a) Object.assign(MESK, { n, a, p: 0, dogru: 0, sonuc: null });
    const x = SURE(n), w = x.ayet[a - 1].split(' '), P = meskParcalar(n, a), [i, j] = P[MESK.p] || P[0];
    const hedef = S.ayar.meskTekrar || 3, tam = P.length > 1 && MESK.p === P.length - 1, bitti = MESK.p >= P.length;
    const r = `${n}:${a}`;
    const kelimeler = w.map((k, q) => `<span class="${!bitti && q >= i && q <= j ? 'mesk-simdi' : (bitti || P.slice(0, MESK.p).some(([s, e]) => q >= s && q <= e && !(s === 0 && e === w.length - 1)) ? 'mesk-tamam' : '')}">${esc(k)}</span>`).join(' ');
    app.innerHTML = `${ust(t('Meşk · {0} {1}', esc(sureAdi(x)), a))}<main>
      <div class="mesk-adimlar">${P.map((_, q) => `<span class="${q < MESK.p || bitti ? 'tamam' : q === MESK.p ? 'simdi' : ''}">${q === P.length - 1 && P.length > 1 ? '★' : q + 1}</span>`).join('')}</div>
      <article class="kart"><div class="ayet mesk-ayet" dir="rtl" lang="ar">${kelimeler} <span class="ayet-no">﴿${a.toLocaleString('ar-EG')}﴾</span></div></article>
      ${bitti ? `<article class="kart mesk-bitti"><h2>${t('🎉 Bu ayetin meşkini tamamladın!')}</h2><p>${t('Bârekallah. Yarın bu ayeti bir kez daha oku; tekrar, ezberi ve okuyuşu sağlamlaştırır.')}</p>
          <div class="satir">${a < x.ayet.length ? `<button class="btn" id="meskSonraki">${t('Sonraki ayet ›')}</button>` : ''}<button class="btn ikincil" id="meskBastan">${t('Baştan')}</button></div></article>`
        : `<article class="kart mesk-kart">
          <p class="mesk-baslik">${tam ? t('Şimdi ayetin tamamı') : t('Parça {0}/{1}', MESK.p + 1, P.length > 1 ? P.length - 1 : 1)}</p>
          <ol class="mesk-sira"><li class="${MESK.dinlendi ? 'tamam' : ''}"><button class="sesbtn" id="meskDinle">${t('▶ Hocadan dinle')}</button></li>
            <li><button class="sesbtn ${MESK.kayit ? 'kirmizi-btn kaydediyor' : 'ikincil'}" id="meskOku">${MESK.kayit ? t('⏹ Bitir') : t('🎤 Şimdi sen oku')}</button></li></ol>
          <div class="mesk-sayac">${[...Array(hedef)].map((_, q) => `<span class="${q < MESK.dogru ? 'dolu' : ''}">✓</span>`).join('')}<small>${t('{0}/{1} doğru okuyuş', MESK.dogru, hedef)}</small></div>
          <div id="meskSonuc">${MESK.bekliyor ? `<p class="soluk">${t('⏳ Okuyuşun inceleniyor…')} <span id="modelYuzde"></span></p>` : MESK.sonuc || ''}</div></article>`}
      <p class="soluk kucukyazi">${t('Meşk: hoca okur, sen tekrar edersin. Her parçayı {0} kez doğru okuyunca sonrakine geçilir. Yapay zekâ yanılabilir; son söz hocanındır.', hedef)}</p>
    </main>`;
    const d = $('#meskDinle'); if (d) d.onclick = () => { MESK.dinlendi = true; d.closest('li').classList.add('tamam'); tam ? cal(ayetUrl(r), d, ayetUrl(r, KARILER[0].klasor)) : arkaArka(w.slice(i, j + 1).map((_, q) => kelimeUrl(r, i + q + 1)), d); };
    const sn = $('#meskSonraki'); if (sn) sn.onclick = () => ekranDegistir('mesk', n, a + 1);
    const bb = $('#meskBastan'); if (bb) bb.onclick = () => { Object.assign(MESK, { p: 0, dogru: 0, sonuc: null, dinlendi: false }); ciz(); };
    const ok = $('#meskOku'); if (!ok) return;
    ok.onclick = async () => {
      if (MESK.kayit) { MESK.kayit.state !== 'inactive' && MESK.kayit.stop(); return; }
      if (!navigator.mediaDevices || !window.MediaRecorder) return toast(t('Bu cihazda ses kaydı desteklenmiyor.'));
      let O; try { O = await okumaHazirla(); } catch (e) { return toast(e.message); }
      let akis; try { akis = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { return toast(t('Mikrofon izni verilmedi. Telefon ayarlarından Kur\'an Yolum için mikrofona izin ver.')); }
      if (ses) { ses.pause(); ses = null; }
      const parca = [], rec = new MediaRecorder(akis); MESK.kayit = rec;
      O.modelAc(p => { const e = document.getElementById('modelYuzde'); if (e) e.textContent = t('(yapay zekâ modeli ilk kez hazırlanıyor: {0})', yuzdeStr(Math.round(p * 100))); }).catch(() => { });
      rec.ondataavailable = e => { if (e.data && e.data.size) parca.push(e.data); };
      rec.onstop = async () => {
        akis.getTracks().forEach(z => z.stop()); clearTimeout(MESK.z); MESK.kayit = null; MESK.bekliyor = true; ciz();
        try {
          const ses_ = await O.sesCoz(new Blob(parca, { type: rec.mimeType || 'audio/webm' }));
          if (ses_.length / 16000 < 0.5) throw new Error(t('Kayıt çok kısa.'));
          const ref = (await O.fonetik(n))[a - 1], alt = altRef(ref, i, j), dd = await O.dinle(ses_);
          let K = O.listen(alt, dd.heard, dd.probs, dd.times);
          // Parçanın başında/sonunda durup başlamak okunuşu biraz değiştirir (hemze-i vasl, vakf): bu kenar notları sayılmaz
          if (!tam) K = K.map((k, q) => Object.assign({}, k, { notes: k.notes.filter(z => !((q === 0 && i > 0 && /^(added|letter|vowel)$/.test(z.rule)) || (q === K.length - 1 && j < w.length - 1 && /^(dropped|vowel)$/.test(z.rule)))) }));
          const jali = K.reduce((s, k) => s + k.notes.filter(z => z.severity === 'jali').length, 0), khafi = K.reduce((s, k) => s + k.notes.filter(z => z.severity !== 'jali').length, 0);
          const satir = K.filter(k => k.notes.length).map(k => `<li><b class="ar">${esc(w[i + k.index])}</b> <button class="sesbtn ikincil mini" data-ses="${kelimeUrl(r, i + k.index + 1)}">🔊</button> ${k.notes.map(z => `<span class="${z.severity === 'jali' ? 'kirmizi' : 'turuncu'}">${z.severity === 'jali' ? '' : t('kontrol et: ')}${metin(z.msg)}</span>`).join(' · ')}</li>`).join('');
          MESK.bekliyor = false;
          if (!jali) {
            MESK.dogru++;
            MESK.sonuc = `<div class="rapor iyi"><p><b>${khafi ? t('✓ Doğru. Küçük bir yeri kontrol et:') : t('✓ Güzel okudun!')}</b></p>${satir ? `<ul class="rapor-not">${satir}</ul>` : ''}</div>`;
            if (MESK.dogru >= (S.ayar.meskTekrar || 3)) {
              S.mesk = S.mesk || {}; const kk = r; S.mesk[kk] = Object.assign(S.mesk[kk] || {}, { p: MESK.p + 1, t: simdi() });
              MESK.p++; MESK.dogru = 0; MESK.dinlendi = false; MESK.sonuc = `<div class="rapor iyi"><p><b>${t('Parça tamam! Sıradaki parçaya geçtik.')}</b></p></div>`;
              if (MESK.p >= P.length) { S.mesk[kk].tamam = true; S.mesk[kk].p = P.length; }
              seriGuncelle(); kaydet(); if (window.Konfeti) setTimeout(() => window.Konfeti.patlat($('.mesk-ayet'), MESK.p >= P.length ? 80 : 30), 100);
            }
          } else MESK.sonuc = `<div class="rapor kotu"><p><b>${t('Bir daha dinle ve tekrar oku.')}</b></p><ul class="rapor-not">${satir}</ul></div>`;
        } catch (e) { MESK.bekliyor = false; MESK.sonuc = `<p class="hata">${esc(e.message || String(e))}</p>`; }
        if (ekranYigini[ekranYigini.length - 1][0] === 'mesk') ciz();
      };
      rec.start(); MESK.z = setTimeout(() => rec.state !== 'inactive' && rec.stop(), tam ? 28000 : 12000); ciz();
    };
  };
  // Meşk için sûre/ayet seçimi
  EKRAN.meskSec = function () {
    const l = (window.SURELER || []);
    app.innerHTML = `${ust(t('🎓 Meşk'))}<main>
      <article class="kart"><p>${t('Hoca (kâri) ayeti parça parça okur, sen tekrar edersin; okuyuşun incelenir. Her parçayı birkaç kez doğru okuyunca sonrakine geçilir.')}</p>
        <p class="soluk kucukyazi">${t('Herhangi bir sûrede meşk yapmak için Kur\'an sekmesinde ayetin altındaki “🎓 Meşk” düğmesine dokun.')}</p></article>
      <div class="bolumler">${l.map(x => { const tamam = x.ayet.filter((_, i) => (S.mesk || {})[x.n + ':' + (i + 1)] && S.mesk[x.n + ':' + (i + 1)].tamam).length; return `<button class="bolum" data-git="mesk|${x.n}|${Math.min(x.ayet.length, tamam + 1)}"><span class="ikon ar">${esc(x.ar)}</span><span class="bad"><small>${t('{0}/{1} ayet', tamam, x.ayet.length)}</small>${esc(sureAdi(x))}</span><span class="rozet">›</span></button>`; }).join('')}</div>
    </main>`;
  };

  // ------------------------------------------------------------ yarım kalan test (kaldığın yerden devam)
  const OKEY = 'tecvid-ogren.oturum.' + PR.aktif;
  function oturumSakla() {
    try { if (oturum && !oturum.bitti && !oturum.sonsuz) localStorage.setItem(OKEY, JSON.stringify(oturum)); else localStorage.removeItem(OKEY); } catch (e) { }
  }
  function yarimOturum() { try { const o = JSON.parse(localStorage.getItem(OKEY) || 'null'); return o && o.sorular && o.sorular.length && !o.bitti ? o : null; } catch (e) { return null; } }
  function yarimKarti() {
    const o = yarimOturum(); if (!o) return '';
    const cevapli = o.cevaplar.filter(Boolean).length;
    return `<section class="kart tekrar vurgulu yarim-kart"><div><h2>${t('⏸ Yarım kalan test')}</h2><p><b>${esc(o.baslik)}</b> · ${t('{0}/{1} soru cevaplandı', cevapli, o.sorular.length)}</p></div>
      <div class="satir sola"><button class="btn" id="yarimDevam">${t('Kaldığın yerden devam et')}</button><button class="btn ikincil" id="yarimSil">${t('Sil')}</button></div></section>`;
  }
  function yarimBagla() {
    const d = $('#yarimDevam'); if (d) d.onclick = () => { const o = yarimOturum(); if (!o) return ciz(); oturum = o; let ilk = 0; while (ilk < o.sorular.length - 1 && o.cevaplar[ilk]) ilk++; oturum.i = ilk; git('soru'); };
    const s = $('#yarimSil'); if (s) s.onclick = () => { try { localStorage.removeItem(OKEY); } catch (e) { } ciz(); };
  }

  // ------------------------------------------------------------ bugünkü dersim (günlük plan)
  const HEDEF = { 10: { tekrar: 5, alis: 5 }, 20: { tekrar: 10, alis: 8 }, 30: { tekrar: 15, alis: 10 } };
  const gunlukAdimAd = a => ({ tekrar: t('🔁 Tekrar soruları ({0})', a.n), ders: t('📖 Yeni ders: {0}', esc((unitById(a.id) || {}).ad || '')), sinav: t('🏁 Sınav: {0}', esc((unitById(a.id) || {}).ad || '')), alistirma: t('✍️ Alıştırma ({0} soru)', a.n), ezber: t('🧠 Ezber tekrarı'), kuran: t('🕌 Bir sayfa Kur\'an oku') })[a.tur];
  function gunlukPlan(yeniden) {
    const g = S.gunluk;
    if (g && g.tarih === bugun() && !yeniden) return g;
    const dk = S.ayar.hedefDk || 10, h = HEDEF[dk] || HEDEF[10], adimlar = [];
    if (vadesiGelenler().length) adimlar.push({ tur: 'tekrar', n: Math.min(h.tekrar, vadesiGelenler().length) });
    const su = U.find(u => !gecti(u.id));
    if (su && su.ara) adimlar.push({ tur: 'sinav', id: su.id });
    else if (su) adimlar.push({ tur: 'ders', id: su.id });
    const calis = su && !su.ara ? su : [...acikDersler()].reverse().find(u => (u.sorular || []).length) || dersler[0];
    if (calis) adimlar.push({ tur: 'alistirma', id: calis.id, n: h.alis });
    if (dk >= 20 && Object.keys(S.ezber || {}).length) adimlar.push({ tur: 'ezber' });
    if (dk >= 20) adimlar.push({ tur: 'kuran' });
    // Aynı gün yeniden planlanırsa bitmiş adımlar korunur
    const eski = g && g.tarih === bugun() ? g.adimlar.filter(a => a.bitti) : [];
    S.gunluk = { tarih: bugun(), dk, adimlar: eski.concat(adimlar.filter(a => !eski.some(e => e.tur === a.tur))) };
    kaydet(); return S.gunluk;
  }
  let GUNLUK_ADIM = null;   // { i, ekran } — ders/sayfa/ezber ekranında "adımı tamamla" şeridi
  function gunlukAdimBitir(i) {
    const g = gunlukPlan(); if (!g.adimlar[i] || g.adimlar[i].bitti) return;
    g.adimlar[i].bitti = true; seriGuncelle(); kaydet(); hatirlatmaKur(false);
    if (g.adimlar.every(a => a.bitti)) g.tamamZaman = simdi();
  }
  function gunlukAdimBaslat(i) {
    const g = gunlukPlan(), a = g.adimlar[i]; if (!a) return;
    GUNLUK_ADIM = null;
    if (a.tur === 'tekrar') {
      const k = vadesiGelenler().sort((x, y) => zayiflik(y) - zayiflik(x)).slice(0, a.n);
      if (!k.length) { gunlukAdimBitir(i); return ciz(); }
      const lazim = benzersiz(k.filter(x => x.startsWith('k:')).map(x => +x.split(':')[1]).filter(n => !SURE(n)));
      Promise.all(lazim.map(n => sureYukle(n).catch(() => null))).then(() => oturumBaslat({ tur: 'tekrar', kimlik: 'tekrar', baslik: t('Günlük tekrar'), anahtarlar: karistir(k), puanli: true, gunluk: i }));
    } else if (a.tur === 'alistirma') {
      const u = unitById(a.id);
      oturumBaslat({ tur: 'alistirma', id: a.id, kimlik: 'alistirma|' + a.id, baslik: t('Alıştırma: ') + u.ad, anahtarlar: sec(anahtarlar(u), a.n, true), puanli: false, gunluk: i });
    } else if (a.tur === 'sinav') { GUNLUK_ADIM = { i, ekran: 'sinavGiris' }; git('sinavGiris', a.id); }
    else if (a.tur === 'ders') { GUNLUK_ADIM = { i, ekran: 'ders' }; git('ders', a.id); }
    else if (a.tur === 'ezber') { GUNLUK_ADIM = { i, ekran: 'ezber' }; git('ezber'); }
    else if (a.tur === 'kuran') { GUNLUK_ADIM = { i, ekran: 'sayfa' }; const son = KO().son; git('sayfa', son ? son.p : S.sonSayfa || 1, son && son.n ? son.n + ':' + son.a : ''); }
  }
  // ders / sayfa / ezber ekranının üstüne "günlük ders" şeridi
  function gunlukSerit(ad) {
    if (!GUNLUK_ADIM || GUNLUK_ADIM.ekran !== ad || ad === 'sinavGiris') return;
    const g = gunlukPlan(), a = g.adimlar[GUNLUK_ADIM.i]; if (!a) return;
    const m = app.querySelector('main'); if (!m) return;
    const donus = () => { GUNLUK_ADIM = null; ekranYigini = [['ana', []], ['gunluk', []]]; ciz(); window.scrollTo(0, 0); };
    // Ders: son sayfaya gelince adım kendiliğinden tamamlanır
    if (!a.bitti && ad === 'ders') { const [id, sekme = 'ders'] = ekranYigini[ekranYigini.length - 1][1]; const u = unitById(id), i = +((EKRAN.ders._sayfa || {})[id] || 0); if (u && (sekme !== 'ders' || i >= u.sayfalar.length - 1)) gunlukAdimBitir(GUNLUK_ADIM.i); }
    // Kur'an sayfası: 45 saniye okuyunca tamamlanır
    if (!a.bitti && ad === 'sayfa' && !GUNLUK_ADIM.z) { const gi = GUNLUK_ADIM; gi.z = setTimeout(() => { gunlukAdimBitir(gi.i); if (GUNLUK_ADIM === gi && ekranYigini[ekranYigini.length - 1][0] === 'sayfa') { const sr = $('.gunluk-serit'); if (sr) sr.remove(); gunlukSerit('sayfa'); } }, 45000); }
    if (a.bitti) {
      m.insertAdjacentHTML('afterbegin', `<section class="gunluk-serit tamam"><span>✅ ${t('Bu adım tamamlandı')}</span><button class="btn kucuk" id="gunlukDon">${t('Günlük derse dön ›')}</button></section>`);
      $('#gunlukDon').onclick = donus; return;
    }
    m.insertAdjacentHTML('afterbegin', `<section class="gunluk-serit"><span>📅 ${t('Bugünkü dersim · adım {0}/{1}', GUNLUK_ADIM.i + 1, g.adimlar.length)}</span><button class="btn kucuk" id="gunlukTamam">${t('✓ Adımı tamamla')}</button></section>`);
    $('#gunlukTamam').onclick = () => { gunlukAdimBitir(GUNLUK_ADIM.i); donus(); };
  }
  function gunlukKarti() {
    const g = gunlukPlan(), b = g.adimlar.filter(a => a.bitti).length, n = g.adimlar.length, tamam = n && b === n, si = g.adimlar.findIndex(a => !a.bitti);
    return `<section class="gunluk-kart ${tamam ? 'tamam' : ''}" data-git="gunluk" role="button"><div class="gunluk-ust"><span class="gunluk-ikon">${tamam ? IKON.onay : IKON.takvim}</span>
      <div><b>${t('Bugünkü dersim')}</b><small>${tamam ? t('Bugünkü dersin tamam. Bârekallah!') : t('≈{0} dk · {1}/{2} adım', g.dk, b, n)}</small></div><span class="gunluk-ok">›</span></div>
      <div class="pano-cubuk"><div style="width:${n ? Math.round(b / n * 100) : 0}%"></div></div>
      ${!tamam && si >= 0 ? `<div class="gunluk-siradaki"><span>${gunlukAdimAd(g.adimlar[si])}</span><button class="btn gunluk-basla" data-gunluk-basla="${si}">${b ? t('Devam et') : t('Başla')}</button></div>` : ''}</section>`;
  }
  // ------------------------------------------------------------ durak ışıkları + hap bilgi kartları + Elif-Ba odak modu
  const DURAK_ISIK = { 'ۖ': 'ge', 'ۗ': 'de', 'ۘ': 'lz', 'ۚ': 'cz', 'ۛ': 'mu', 'ۜ': 'sk' };
  const DURAK_AD = { lz: 'Lâzım: dur', de: 'Durmak daha iyi', cz: 'Câiz: dur ya da geç', ge: 'Geçmek daha iyi', la: 'Durma', mu: 'Muânaka: ikisinden birinde dur', sk: 'Sekte: nefes almadan kısa kes' };
  const durakIsik = html => S.ayar.durakIsik === false ? html : String(html).replace(/[ۖ-ۘۚ-ۜ]/g, m => `<span class="dm dm-${DURAK_ISIK[m]}" title="${esc(t(DURAK_AD[DURAK_ISIK[m]]))}">${m}</span>`);
  const durakLejant = () => `<details class="durak-lejant"><summary>🚦 ${t('Durak işaretleri ne demek?')}</summary>
    <div class="dl-sat">${['lz', 'de', 'cz', 'ge', 'mu', 'sk'].map(k => `<span><i class="dm-nokta dm-${k}"></i>${esc(t(DURAK_AD[k]))}</span>`).join('')}</div>
    <button class="ders-ince" data-git="kart|vakf"><span>${t('Durak kartını aç')}</span><b>›</b></button></details>`;
  const kartBul = id => (window.KARTLAR || []).find(k => k.id === id);
  const kartUnit = uid => (window.KARTLAR || []).find(k => (k.unit || []).includes(uid));
  EKRAN.kartlar = function () {
    const L = window.KARTLAR || [];
    app.innerHTML = `${ust(t('Hap bilgi kartları'))}<main>
      <p class="soluk kucukyazi">${t('Her konunun tek bakışta özeti. Önce ders sayfalarından öğren; kartlar tekrar içindir.')}</p>
      <div class="kart-liste">${L.map(k => `<button class="tecvid-kutu kart-kutu" data-git="kart|${k.id}"><span>${k.ik}</span>${esc(t(k.ad))}</button>`).join('')}</div>
      <button class="btn genis ikincil" data-git="kartYazdir">${IKON.yazdir} ${t('Hepsini yazdır / PDF')}</button>
      ${TEST_SURUM ? `<p class="soluk kucukyazi">${t('Kartların içeriği ders metinlerinden alınmıştır; hoca onayı bekliyor.')}</p>` : ''}</main>`;
  };
  // Dinamik kartlar harf kartı verisinden (HARFKART) üretilir: mahreçler ve karıştırılan harfler
  function kartSatirListesi(k) {
    const H = window.HARFKART; if (k.dinamik && H) {
      if (k.dinamik === 'mahrec') return H.MAHRECLER.map(m => ({ ad: `${m.no}. ${m.ad}`, harf: m.harfler.join(' '), kisa: m.aciklama }));
      if (k.dinamik === 'karisan') return H.CIFTLER.map(c => ({ ad: c.map(h => H.AD[h] || h).join(' – '), harf: c.join(' '), kisa: '' }));
    }
    return k.satirlar || [];
  }
  function kartSatirlari(k, kontrol) {
    const gz = (m, sinif = '') => m ? `<span class="${kontrol ? 'kk-gizli ' : ''}${sinif}" ${kontrol ? 'tabindex="0"' : ''}>${m}</span>` : '';
    return kartSatirListesi(k).map(s => { const r = R[s.k] || {}, ad = s.ad || r.ad || s.k, kisa = s.kisa || r.ozet || '', miktar = s.miktar || r.elif || '';
      const ornekVar = !!s.ornek;
      return `<tr><th>${esc(t(ad))}</th><td${ornekVar ? '' : ' colspan="2"'}>${s.harf ? `<div class="ar kk-harf">${gz(s.harf)}</div>` : ''}<div class="kk-kisa">${esc(t(kisa))}</div>${s.ne ? `<div class="kk-ne">${gz(esc(t(s.ne)))}</div>` : ''}${miktar ? `<div class="kk-miktar">${gz('⏱ ' + esc(miktar))}</div>` : ''}</td>${ornekVar ? `<td class="ar kk-ornek">${esc(s.ornek)}</td>` : ''}</tr>`; }).join('');
  }
  function kartIsikTablo(baslik, l, kontrol) {
    return `<h3>${esc(t(baslik))}</h3><table class="kk-tablo kk-isik"><tbody>${l.map(s => `<tr><td class="kk-isaret"><i class="dm-nokta dm-${s.isik}"></i><b class="ar">${esc(s.isaret)}</b></td><th>${esc(t(s.ad))}</th><td><span class="${kontrol ? 'kk-gizli' : ''}" ${kontrol ? 'tabindex="0"' : ''}>${esc(t(s.ac))}</span></td></tr>`).join('')}</tbody></table>`;
  }
  function kartGovde(k, kontrol) {
    const ust_ = k.ust ? `<p class="kk-ust"><b>${esc(t(k.ust.ad))}</b>${k.ust.harf ? ` <span class="ar">${esc(k.ust.harf)}</span>` : ''}${k.ust.not ? `<br><small class="soluk">${esc(t(k.ust.not))}</small>` : ''}</p>` : '';
    if (k.isik) return `<h2>${k.ik} ${esc(t(k.ad))}</h2>${kartIsikTablo('Medine mushafı (Hafs)', k.medine, kontrol)}${kartIsikTablo('Türk mushafı', k.turk, kontrol)}`;
    if (k.dinamik) {   // mahreçler / karıştırılan harfler: dar telefonda tablo yerine satır listesi
      const gz = m => m ? `<span class="${kontrol ? 'kk-gizli' : ''}" ${kontrol ? 'tabindex="0"' : ''}>${m}</span>` : '';
      return `<h2>${k.ik} ${esc(t(k.ad))}</h2>${ust_}<div class="kk-liste">${kartSatirListesi(k).map(s => `<div class="kk-satir"><div class="kk-sat-ust"><b>${esc(t(s.ad))}</b><span class="ar kk-harf">${gz(s.harf)}</span></div>${s.kisa ? `<p class="kk-kisa">${esc(t(s.kisa))}</p>` : ''}</div>`).join('')}</div>`;
    }
    return `<h2>${k.ik} ${esc(t(k.ad))}</h2>${ust_}<table class="kk-tablo"><tbody>${kartSatirlari(k, kontrol)}</tbody></table>`;
  }
  const kartMetin = k => k.isik ? `${k.ad}\n` + k.medine.map(s => `${s.isaret} ${s.ad}: ${s.ac}`).join('\n') : `${k.ad}\n` + kartSatirListesi(k).map(s => { const r = R[s.k] || {}; return `• ${s.ad || r.ad || s.k}${s.harf ? ' [' + s.harf + ']' : ''}: ${s.kisa || r.ozet || ''}${s.ornek ? ' (' + s.ornek + ')' : ''}`; }).join('\n');
  // Kartlardaki bütün Arapça harf, hece ve kelimeler dokununca okunur:
  //  harf → hocanın kaydı (varsa), yoksa harfin adı (yapay ses, yedek) · harf+hareke → hocanın hece kaydı (varsa)
  //  kelime / ifade → Kur'an'dan gerçek kâri sesi (ders metinleriyle aynı eşleme) · sesi olmayana dokununca bilgi verilir
  function kartSesBagla(kok) {
    const isk = w => w.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '');
    const hece = w => { const m = /^(\p{L})([\u064E\u0650\u064F])$/u.exec(w); return m ? [m[1], { '\u064E': 0, '\u0650': 1, '\u064F': 2 }[m[2]]] : null; };
    const dugumler = []; kok.querySelectorAll('.ar').forEach(el => { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); while (w.nextNode()) if (/[\u0600-\u06FF]/.test(w.currentNode.nodeValue)) dugumler.push(w.currentNode); });
    dugumler.forEach(n => {
      const metin = n.nodeValue.trim(); if (!metin || n.parentNode.closest('.kk-ses')) return;
      const parcalar = (isk(metin) !== metin && arSesler(metin, 'kart') ? [metin] : metin.split(/\s+/)).filter(Boolean), f = document.createDocumentFragment();
      parcalar.forEach((w, i) => { if (i) f.append(' '); const sp = document.createElement('span'); sp.className = 'kk-ses'; sp.setAttribute('role', 'button'); sp.tabIndex = 0; sp.title = t('Dinle'); sp.textContent = w; f.append(sp); });
      n.replaceWith(f);
    });
    kok.querySelectorAll('.kk-ses').forEach(sp => {
      const w = sp.textContent.trim();
      const cal_ = async ev => {
        if (sp.closest('.kk-gizli')) return;   // kontrol modunda gizliyken yalnız açılır
        ev.stopPropagation();
        const h = hece(w);
        if (isk(w) === w && w.length <= 2) { const k = await harfSesCal(w, sp, true); if (!k) toast(t('Bu harfin sesi henüz yok.')); return; }
        if (h && window.HarfSes && HarfSes.var('hr:' + h[0] + ':' + h[1])) { HarfSes.cal('hr:' + h[0] + ':' + h[1], sp); return; }
        const l = arSesler(w, 'kart'); if (l) { arkaArka(l, sp); return; }
        toast(h ? t('Bu hecenin hoca sesi henüz yok.') : t('Bu kelimenin sesi henüz yok.'));
      };
      sp.onclick = cal_; sp.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cal_(e); } };
    });
  }
  EKRAN.kart = function (id) {
    const k = kartBul(id); if (!k) return EKRAN.kartlar();
    const kontrol = !!EKRAN.kart._kontrol;
    app.innerHTML = `${ust(esc(t(k.ad)))}<main>
      <div class="satir sola kk-arac"><button class="lejant-ac ${kontrol ? 'aktif' : ''}" id="kkKontrol">${IKON.goz} ${t('Kontrol modu')}</button>${kontrol ? `<button class="lejant-ac" id="kkHepsi">${t('Hepsini göster')}</button>` : ''}<button class="lejant-ac" id="kkYazdir">${IKON.yazdir} ${t('Yazdır')}</button><button class="lejant-ac" id="kkPaylas">${IKON.paylas} ${t('Paylaş')}</button></div>
      <p class="soluk kucukyazi kk-ipucu">${IKON.ses} ${t('Harfe, heceye ya da kelimeye dokun: sesini dinle.')}</p>
      <article class="kart kk-kart" id="kkKart">${kartGovde(k, kontrol)}</article>
      ${k.unit && k.unit.length ? `<button class="ders-ince" data-git="ders|${k.unit[0]}"><span>${t('Konunun dersine git')}</span><b>›</b></button>` : ''}
      ${TEST_SURUM ? `<p class="soluk kucukyazi">${t('Hoca onayı bekliyor.')}</p>` : ''}</main>`;
    kartSesBagla(document.getElementById('kkKart'));
    document.getElementById('kkKontrol').onclick = () => { EKRAN.kart._kontrol = !kontrol; ciz(); };
    const h = document.getElementById('kkHepsi'); if (h) h.onclick = () => app.querySelectorAll('.kk-gizli').forEach(x => x.classList.remove('kk-gizli'));
    app.querySelectorAll('.kk-gizli').forEach(x => { const ac = () => x.classList.remove('kk-gizli'); x.onclick = ac; x.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') ac(); }; });
    document.getElementById('kkYazdir').onclick = () => { document.body.classList.add('yazdir-tek'); window.print(); setTimeout(() => document.body.classList.remove('yazdir-tek'), 500); };
    document.getElementById('kkPaylas').onclick = () => { const m = kartMetin(k) + '\n\n' + (window.location.origin || ''); if (navigator.share) navigator.share({ title: k.ad, text: m }).catch(() => {}); else if (navigator.clipboard) navigator.clipboard.writeText(m).then(() => toast(t('Kopyalandı'))).catch(() => {}); };
  };
  EKRAN.kartYazdir = function () {
    const L = window.KARTLAR || [];
    app.innerHTML = `${ust(t('Kartlar · Yazdır'))}<main class="kk-yazdir">
      <div class="satir sola kk-arac"><button class="btn" id="kkYaz">${IKON.yazdir} ${t('Yazdır / PDF olarak kaydet')}</button></div>
      <div class="kk-izgara">${L.map(k => `<article class="kart kk-kart">${kartGovde(k, false)}</article>`).join('')}</div></main>`;
    document.getElementById('kkYaz').onclick = () => window.print();
  };
  // Elif-Ba odak modu: ana uygulamadan ayrı, sade bir müfredat ekranı
  EKRAN.elifba = function () {
    const adimlar = [];
    [['e1', 0], ['u0', 1]].forEach(([id, bas]) => { const u = unitById(id); if (!u) return; (u.sayfalar || []).forEach((s, i) => { if (i >= bas) adimlar.push({ id, i, ad: u.ad, ozet: String((s.h || s.t || '')).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 48) }); }); });
    const okunan = id => S.okunan[id] || 0, bitti = a => okunan(a.id) > a.i;
    const sira = adimlar.findIndex(a => !bitti(a)), ok = adimlar.filter(bitti).length;
    app.innerHTML = `${ust(t('Elif-Ba'))}<main class="elifba">
      <section class="pano-ust"><div class="halka buyuk" style="--p:${adimlar.length ? Math.round(ok / adimlar.length * 100) : 0}"><b>${ok}/${adimlar.length}</b><small>${t('adım')}</small></div>
        <div><h2>${t('Elif-Ba')}</h2><p class="soluk">${t('Harfleri ve harekeleri adım adım öğren.')}</p></div></section>
      <button class="btn genis c-btn" id="ebDevam">${ok ? t('▶ Devam et') : t('▶ Başla')}</button>
      <div class="satir sola">${window.HARFKART ? `<button class="lejant-ac" data-git="harfKartlari">🔤 ${t('Harf kartları')}</button>` : ''}<button class="lejant-ac" data-git="ebAlistirma">✍️ ${t('Alıştırma')}</button><button class="lejant-ac" data-git="testler">${t('Testler')}</button></div>
      <div class="gunluk-adimlar">${adimlar.map((a, n) => `<button class="gunluk-adim ${bitti(a) ? 'bitti' : n === sira ? 'simdi' : ''}" data-eb="${n}"><span class="gunluk-no">${bitti(a) ? '✓' : n + 1}</span><span>${esc(a.ad)} · ${a.i + 1}<small class="soluk"> ${esc(a.ozet)}</small></span></button>`).join('')}</div>
      <button class="btn genis ikincil" id="ebAna">${t('Ana uygulamaya dön')}</button></main>`;
    const git_ = n => { const a = adimlar[n]; if (!a) return; EKRAN.ders._sayfa = EKRAN.ders._sayfa || {}; EKRAN.ders._sayfa[a.id] = a.i; git('ders', a.id); };
    app.querySelectorAll('[data-eb]').forEach(x => x.onclick = () => git_(+x.dataset.eb));
    document.getElementById('ebDevam').onclick = () => git_(sira < 0 ? 0 : sira);
    document.getElementById('ebAna').onclick = anaSayfa;
  };

  EKRAN.gunluk = function () {
    const g = gunlukPlan(), b = g.adimlar.filter(a => a.bitti).length, n = g.adimlar.length, tamam = n && b === n;
    const siradaki = g.adimlar.findIndex(a => !a.bitti);
    app.innerHTML = `${ust(t('Bugünkü dersim'))}<main>
      <section class="pano-ust"><div class="halka buyuk" style="--p:${n ? Math.round(b / n * 100) : 0}"><b>${b}/${n}</b><small>${t('adım')}</small></div>
        <div><small class="soluk">${t('Günlük hedef')}</small><h2>${t('{0} dakika', g.dk)}</h2><p class="soluk">${tamam ? t('Bugünkü dersin tamam. Yarın görüşürüz!') : t('Adımları sırayla yap; her biri birkaç dakika sürer.')}</p></div></section>
      <div class="cipler">${[10, 20, 30].map(d => `<button class="${g.dk === d ? 'aktif' : ''}" data-hedef="${d}">${t('{0} dk', d)}</button>`).join('')}</div>
      <div class="gunluk-adimlar">${g.adimlar.map((a, i) => `<button class="gunluk-adim ${a.bitti ? 'bitti' : i === siradaki ? 'simdi' : ''}" data-adim="${i}" ${a.bitti ? 'disabled' : ''}>
        <span class="gunluk-no">${a.bitti ? '✓' : i + 1}</span><span>${gunlukAdimAd(a)}</span></button>`).join('')}</div>
      ${tamam ? mujdeHTML(new Date().getDate(), t('Bugünkü dersini tamamladın. Bârekallah!')) + (window.KARTLAR ? `<button class="ders-ince" data-git="kartlar"><span>${IKON.kart} ${t('Kartlara bak')}</span><b>›</b></button>` : '') : `<button class="btn genis c-btn" data-adim="${siradaki}">${b ? t('▶ Devam et') : t('▶ Başla')}</button>`}
      ${!n ? `<p class="soluk">${t('Bugün için plan yok. Testler bölümünden istediğin testi çözebilirsin.')}</p>` : ''}
    </main>`;
    app.querySelectorAll('[data-adim]').forEach(x => x.onclick = () => gunlukAdimBaslat(+x.dataset.adim));
    app.querySelectorAll('[data-hedef]').forEach(x => x.onclick = () => { S.ayar.hedefDk = +x.dataset.hedef; gunlukPlan(true); ciz(); });
    if (tamam && g.tamamZaman && simdi() - g.tamamZaman < 8000 && window.Konfeti) { g.tamamZaman = 0; kaydet(); setTimeout(() => window.Konfeti.kutla(), 200); }
  };

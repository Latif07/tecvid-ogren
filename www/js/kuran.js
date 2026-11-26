/* Kur'an Yolum — Kur'an okuma, istatistik, okuma kartı, notlar, ayet ekranı */
/* app.js bölündü: bu dosyalar sırayla yüklenir, aynı genel kapsamı paylaşır (bkz. TODO.md). */
'use strict';
  // Sayfa sayfa okuma (Medine mushafı)
  // ------------------------------------------------------------ Kur'an okuma (karar: claude/toplanti-2026-11-18-kuran-okuma-ve-hocami-bul.md)
  // S.kuran = { hedef: günlük sayfa (0: yok), gun: { 'YYYY-MM-DD': [okunan sayfalar] }, son: { n, a, p }, imler: [{ n, a, renk, t }], gorunum, tema }
  // Görünüm: mushaf (sayfa, kâğıt) · modern (ayet ayet büyük) · meal (ayet + meal). Tema: acik · sepya · gece.
  // Sayfa "okundu" sayılır: "Okudum" denince ya da sayfada en az 30 sn kalınınca. Kaldığın yer: ekrandaki ilk ayet.
  const KAYDIR_ENG = { f: null };
  window.addEventListener('scroll', () => { if (KAYDIR_ENG.f) KAYDIR_ENG.f(); }, { passive: true });
  const KO_TEMALAR = [['acik', 'Açık'], ['yumusak', 'Yumuşak aydınlık'], ['sepya', 'Saman kâğıdı'], ['gece', 'Karanlık'], ['galaksi', 'Galaksi'], ['gunbatimi', 'Gün batımı'], ['amber', 'Amber gece']];
  const KO = () => { const k = S.kuran = S.kuran || {}; for (const [a, v] of Object.entries({ hedef: 5, ayetHedef: 10, gorunum: 'mushaf', tema: 'acik' })) if (k[a] == null) k[a] = v; k.gun = k.gun || {}; k.ay = k.ay || {}; k.imler = k.imler || []; return k; };
  const koBugun = () => (KO().gun[bugun()] || []).length;
  // Ayet bazlı okuma: k.ay = { 'YYYY-MM-DD': ['n:a', ...] } (son 60 gün), k.ayetHedef: günlük ayet hedefi (0: yok). Sayfa hedefi ve hoca ödevi sayfa bazlı kalır.
  const koAyetBugun = () => (KO().ay[bugun()] || []).length;
  function koAyetOkundu(n, a) {   // true: bugün ilk kez sayıldı
    const k = KO(), l = k.ay[bugun()] = k.ay[bugun()] || [], an = n + ':' + a;
    if (l.includes(an)) return false;
    l.push(an); Object.keys(k.ay).sort().slice(0, -60).forEach(d => delete k.ay[d]); return true;
  }
  function koAyetHedefKontrol() {
    const k = KO(), g = bugun();
    if (k.ayetHedef && koAyetBugun() >= k.ayetHedef && k.ayetTamam !== g) { k.ayetTamam = g; toast(t('Bugünkü ayet hedefi tamam: {0} ayet. Allah kabul etsin!', k.ayetHedef)); if (window.Konfeti) window.Konfeti.patlat($('.ak-ilerleme') || $('.ko-serit') || app, 18); }
  }
  const KO_RENK = ['altin', 'yesil', 'mavi'];
  let koSure = null, koSonKayit = null;
  function koSayfaOkundu(p, sessiz) {
    const k = KO(), g = bugun(), l = k.gun[g] = k.gun[g] || [];
    if (l.includes(p)) return false;
    l.push(p); Object.keys(k.gun).sort().slice(0, -60).forEach(d => delete k.gun[d]);   // son 60 gün tutulur
    sayfaAyetleri(p).forEach(([n, a]) => koAyetOkundu(n, a)); koAyetHedefKontrol();
    seriGuncelle(); kaydet();
    if (k.hedef && l.length === k.hedef) { toast(t('Bugünkü hedef tamam: {0} sayfa. Allah kabul etsin!', k.hedef)); if (window.Konfeti) window.Konfeti.patlat($('.ko-serit') || app, 18); }
    else if (!sessiz) toast(t('Sayfa {0} okundu ✓', p));
    hatirlatmaKur(false);
    return true;
  }
  function koSonKaydet(n, a, p) {
    const k = KO(); if (k.son && k.son.n === n && k.son.a === a && k.son.p === p) return;
    k.son = { n, a, p, t: simdi() }; S.sonSayfa = p;
    clearTimeout(koSonKayit); koSonKayit = setTimeout(kaydet, 700);
  }
  const koImBul = (n, a) => KO().imler.find(x => x.n === n && x.a === a);
  // Kur'an sekmesinin başı: kaldığın yer, bugünkü hedef, yer imleri
  function koUstKarti() {
    const k = KO(), son = k.son || (S.sonSayfa ? { p: S.sonSayfa } : null), bu = koBugun(), h = k.hedef;
    const yuzde = h ? Math.min(100, Math.round(bu / h * 100)) : 0;
    const devam = son
      ? `<button class="ko-devam" data-git="sayfa|${son.p}|${son.n ? son.n + ':' + son.a : ''}"><span class="ko-devam-ikon" aria-hidden="true">📖</span><span class="ko-devam-yazi"><small>${t('Kaldığın yer')}</small><b>${son.n ? `${esc(sureNoAdi(son.n))} ${son.a}` : t('Sayfa {0}', son.p)}</b><small>${t('Sayfa {0}', son.p)} · ${t('Cüz {0}', cuzBul(...(son.n ? [son.n, son.a] : M.sayfa[son.p - 1] || [1, 1])))}</small></span><span class="ko-devam-ok">${t('Devam et ›')}</span></button>`
      : `<button class="ko-devam" data-git="sayfa|1|1:1"><span class="ko-devam-ikon" aria-hidden="true">📖</span><span class="ko-devam-yazi"><b>${t('Kur\'an okumaya başla')}</b><small>${t('Fâtiha · Sayfa 1')}</small></span><span class="ko-devam-ok">${t('Başla ›')}</span></button>`;
    const ayBu = koAyetBugun(), ayH = k.ayetHedef, ayY = ayH ? Math.min(100, Math.round(ayBu / ayH * 100)) : 0;
    const konum = son && son.p ? (son.n ? [son.n, son.a] : M.sayfa[son.p - 1]) : null, cuzNo = konum ? cuzBul(...konum) : 0, yuz = son && son.p ? Math.round(son.p / 604 * 100) : 0;
    const bn = son && son.n ? [son.n, son.a] : [1, 1];
    return `<section class="kart ko-ust">${devam}
      <div class="ko-ay-hedef"><div class="ko-ay-satir"><span>${ayH ? t('Bugün {0}/{1} ayet', ayBu, ayH) : t('Bugün {0} ayet', ayBu)}</span>${ayH ? `<span class="soluk">${ayBu >= ayH ? '✓' : t('{0} ayet kaldı', ayH - ayBu)}</span>` : ''}</div>${ayH ? `<div class="ko-ay-bar"><i style="width:${ayY}%"></i></div>` : ''}
        ${cuzNo ? `<div class="ko-ay-satir"><span>${t('Cüz {0}/30', cuzNo)}</span><span class="soluk">%${yuz}</span></div><div class="ko-ay-bar cuz"><i style="width:${Math.max(1, yuz)}%"></i></div>` : ''}</div>
      <div class="ko-ust-dugme"><button class="btn" data-git="ayetKart|${bn[0]}|${bn[1]}">📖 ${t('Ayet ayet oku')}</button><button class="btn ikincil" data-git="kuranIstatistik">📊 ${t('İstatistik')}</button></div>
      <div class="ko-ust-alt">
        ${h ? `<div class="ko-hedef" title="${t('Bugünkü hedef')}"><span class="ko-halka" style="--p:${yuzde}"><b>${bu}/${h}</b></span><span><b>${bu >= h ? t('Bugünkü hedef tamam') : t('Bugün {0} sayfa kaldı', h - bu)}</b><small>${t('Günlük hedef: {0} sayfa', h)}</small></span></div>` : `<div class="ko-hedef"><span><b>${t('Bugün {0} sayfa okudun', bu)}</b><small>${t('Günlük hedef yok')}</small></span></div>`}
        <button class="ko-imler" data-git="ayetAra">${IKON.ara} ${t('Ayet ara')}</button>
        <button class="ko-imler" data-git="notlar">${IKON.yerimi} ${t('Yer imleri ve notlar')}${k.imler.length + notlar().length ? ` <span class="rozet">${k.imler.length + notlar().length}</span>` : ''}</button>
      </div></section>`;
  }

  // ------------------------------------------------------------ Okuma istatistikleri (Bugün / Hafta / Tümü)
  EKRAN.kuranIstatistik = function (sekme) {
    sekme = ['bugun', 'hafta', 'tumu'].includes(sekme) ? sekme : 'bugun';
    const k = KO(), g = bugun();
    const pzt = new Date(); pzt.setHours(12, 0, 0, 0); pzt.setDate(pzt.getDate() - ((pzt.getDay() + 6) % 7));
    const hafta = [...Array(7)].map((_, i) => { const d = new Date(pzt.getTime() + i * GUN), kk = d.toISOString().slice(0, 10); return { kk, ad: d.toLocaleDateString(DIL === 'en' ? 'en-GB' : 'tr-TR', { weekday: 'short' }), ay: (k.ay[kk] || []).length, bugun: kk === g }; });
    const gunler = sekme === 'bugun' ? [g] : sekme === 'hafta' ? hafta.map(x => x.kk) : benzersiz([...Object.keys(k.ay), ...Object.keys(k.gun)]);
    const topla = f => gunler.reduce((x, d) => x + f(d), 0);
    const ayet = topla(d => (k.ay[d] || []).length), sayfa = topla(d => (k.gun[d] || []).length);
    const aktif = gunler.filter(d => (k.ay[d] || []).length || (k.gun[d] || []).length).length, enIyi = gunler.reduce((m, d) => Math.max(m, (k.ay[d] || []).length), 0);
    const son = k.son, konum = son && son.p ? (son.n ? [son.n, son.a] : M.sayfa[son.p - 1]) : null, cuzNo = konum ? cuzBul(...konum) : 0, yuz = son && son.p ? Math.round(son.p / 604 * 100) : 0;
    const maks = Math.max(1, k.ayetHedef || 0, ...hafta.map(x => x.ay));
    const kutu = (deger, ad) => `<div class="ist-kutu"><b>${deger}</b><small>${ad}</small></div>`;
    app.innerHTML = `${ust(t('Okuma istatistikleri'))}<main>
      <div class="kuran-sekme" role="tablist">${[['bugun', t('Bugün')], ['hafta', t('Hafta')], ['tumu', t('Son 60 gün')]].map(([v, ad]) => `<button role="tab" aria-selected="${v === sekme}" class="${v === sekme ? 'aktif' : ''}" data-ist="${v}">${ad}</button>`).join('')}</div>
      <div class="ist-izgara">${kutu(ayet, t('Okunan ayet'))}${kutu(sayfa, t('Okunan sayfa'))}${kutu(aktif, t('Okuduğun gün'))}${kutu(S.seri.gun || 0, t('Seri (gün)'))}${sekme === 'tumu' ? kutu(enIyi, t('Bir günde en çok ayet')) : ''}${k.ayetHedef && sekme === 'bugun' ? kutu(`${koAyetBugun()}/${k.ayetHedef}`, t('Ayet hedefi')) : ''}</div>
      <h2 class="baslik">${t('Bu hafta')}</h2>
      <div class="kart"><div class="ist-hafta">${hafta.map(x => `<div class="ist-gun ${x.bugun ? 'bugun' : ''}"><span class="ist-cubuk"><i style="height:${Math.round(100 * x.ay / maks)}%"></i></span><b>${x.ay}</b><small>${esc(x.ad)}</small></div>`).join('')}</div>
        ${k.ayetHedef ? `<p class="kucukyazi soluk ortala">${t('Günlük ayet hedefi: {0}', k.ayetHedef)}</p>` : ''}</div>
      ${cuzNo ? `<h2 class="baslik">${t('Okuma konumu')}</h2><div class="kart"><div class="ko-ay-satir"><span>${t('Cüz {0}/30', cuzNo)} · ${t('Sayfa {0}/604', son.p)}</span><span class="soluk">%${yuz}</span></div><div class="ko-ay-bar cuz"><i style="width:${Math.max(1, yuz)}%"></i></div></div>` : ''}
      <p class="soluk kucukyazi">${t('Ayetler, sayfayı okudum dediğinde, Sen oku ile bitirdiğinde ve okuma kartında Okudum dediğinde sayılır. Son 60 gün tutulur.')}</p></main>`;
    app.querySelectorAll('[data-ist]').forEach(b => b.onclick = () => { ekranYigini[ekranYigini.length - 1] = ['kuranIstatistik', [b.dataset.ist]]; ciz(); });
  };
  // ------------------------------------------------------------ Okuma kartı: ayet ayet, "Okudum ›" ile ilerle
  let akMealYok = 0;
  EKRAN.ayetKart = function (n, a) {
    n = Math.min(114, Math.max(1, +n || 1)); const x = SURE(n);
    if (!x) { app.innerHTML = `${ust(esc(sureNoAdi(n)))}<main><p class="soluk">${t('Yükleniyor…')}</p></main>`; sureYukle(n).then(() => { const ek = ekranYigini[ekranYigini.length - 1]; if (ek[0] === 'ayetKart' && +ek[1][0] === n) ciz(); }).catch(() => toast(t('Sûre açılamadı.'))); return; }
    sesDurdur();
    if (akMealYok !== n && !mealSecili().every(z => mealVeri(z, n))) {
      app.innerHTML = `${ust(esc(sureNoAdi(n)))}<main><p class="soluk">${t('Yükleniyor…')}</p></main>`;
      Promise.all(mealSecili().map(z => mealKaynakYukle(z, n))).catch(() => { akMealYok = n; }).then(() => { const ek = ekranYigini[ekranYigini.length - 1]; if (ek[0] === 'ayetKart' && +ek[1][0] === n) ciz(); });
      return;
    }
    const top = x.ayet.length; a = Math.min(top, Math.max(1, +a || 1));
    const k = KO(), p = sayfaBul(n, a), bu = koAyetBugun(), h = k.ayetHedef, r = `${n}:${a}`, okundu = (k.ay[bugun()] || []).includes(r);
    const OKU = (window.OKUNUS || {})[DIL === 'en' ? 'en' : 'tr'] || {};
    let ofs = 0; const kel = x.ayet[a - 1].split(' ').map((w, wi) => { const ic = durakIsik(kelimeHTML(r, w, ofs)); ofs += w.length + 1; return `<span class="kelime" data-ses="${kelimeUrl(r, wi + 1)}">${ic}</span>`; }).join(' ');
    const meal = mealSecili().map(z => [z, (mealVeri(z, n) || [])[a - 1]]).filter(z => z[1]);
    const besmele = a === 1 && n !== 1 && n !== 9 ? `<div class="besmele" dir="rtl" lang="ar">${esc(trBesmele() || window.BESMELE || '')}</div>` : '';
    app.innerHTML = `${ust(`${esc(sureNoAdi(n))} · ${t('Ayet')} ${a}/${top}`)}<main class="ak-ekran">
      <div class="ak-ilerleme">${h ? `<span>${t('Bugün {0}/{1} ayet', bu, h)}</span><div class="ko-ay-bar"><i style="width:${Math.min(100, Math.round(bu / h * 100))}%"></i></div>` : `<span>${t('Bugün {0} ayet', bu)}</span>`}</div>
      <div class="ko-ay-bar sure"><i style="width:${Math.round(a / top * 100)}%"></i></div>
      <p class="kucukyazi soluk ortala">${t('Sayfa {0}', p)} · ${t('Cüz {0}', cuzBul(n, a))}${okundu ? ` · ✓ ${t('bugün okundu')}` : ''}</p>
      <section class="kart ak-kart">${besmele}<div class="ayet ak-ar" dir="rtl" lang="ar">${kel} <span class="ayet-no">﴿${a.toLocaleString('ar-EG')}﴾</span></div>
        ${OKU[r] ? `<p class="okunus">${esc(OKU[r])}</p>` : ''}${meal.map(([z, m]) => `<p class="ko-meal">${esc(m)}${meal.length > 1 ? ` <small class="soluk">· ${esc(z.ad)}</small>` : ''}</p>`).join('')}</section>
      <div class="ak-dugme"><button class="btn ikincil" id="akOku">▶ ${t('Oku')}</button><button class="btn ikincil ${S.ayar.akTekrar ? 'aktif' : ''}" id="akTekrar" aria-pressed="${!!S.ayar.akTekrar}">${IKON.tekrar} ${t('Tekrar')}</button><button class="btn ikincil" id="akSayfa">📄 ${t('Sayfada göster')}</button></div></main>
      <div class="ak-alt"><button class="btn ikincil" id="akGeri" aria-label="${t('Önceki ayet')}">‹</button><button class="btn ak-okudum" id="akOkudum">✓ ${t('Okudum')} ›</button><button class="btn ikincil" id="akIleri" aria-label="${t('Sonraki ayet')}">›</button></div>`;
    const gid = (nn, aa) => { sesDurdur(); ekranYigini[ekranYigini.length - 1] = ['ayetKart', [nn, aa]]; ciz(); window.scrollTo(0, 0); };
    const sonraki = () => { if (a < top) return gid(n, a + 1); if (n < 114) return gid(n + 1, 1); toast(t('Hatmi bitirdin. Allah kabul etsin! 🤲')); };
    $('#akIleri').onclick = sonraki;
    $('#akGeri').onclick = () => { if (a > 1) return gid(n, a - 1); if (n <= 1) return; const c = ayetSayisi(n - 1); if (c) gid(n - 1, c); else sureYukle(n - 1).then(() => gid(n - 1, ayetSayisi(n - 1))).catch(() => { }); };
    $('#akSayfa').onclick = () => git('sayfa', p, r);
    const cal_ = () => { const b = $('#akOku'); if (!b) return; cal(ayetUrl(r), b, ayetUrl(r, KARILER[0].klasor), () => { if (S.ayar.akTekrar && document.body.contains(b)) cal_(); }); };
    $('#akOku').onclick = cal_;
    $('#akTekrar').onclick = ev => { S.ayar.akTekrar = !S.ayar.akTekrar; kaydet(); ev.currentTarget.classList.toggle('aktif', !!S.ayar.akTekrar); ev.currentTarget.setAttribute('aria-pressed', String(!!S.ayar.akTekrar)); };
    $('#akOkudum').onclick = () => {
      koAyetOkundu(n, a); koSonKaydet(n, a, p);
      const gunAy = KO().ay[bugun()] || [];
      if (sayfaAyetleri(p).every(([nn, aa]) => gunAy.includes(`${nn}:${aa}`))) koSayfaOkundu(p, true);   // sayfanın bütün ayetleri okundu → sayfa da sayılır
      koAyetHedefKontrol(); seriGuncelle(); kaydet(); sonraki();
    };
  };

  // ------------------------------------------------------------ Notlar (yazılı + sesli) ve yer imleriyle birleşik "Notlarım"
  // S.notlar = [{ id, k: 'ayet' | 'ders', y: '2:185' | 'e1:3' (ders no : sayfa), m: metin, ses: sn (0: yok), t: oluşturma, g: güncelleme, sil?: true }]
  // Ses kaydı yalnız bu cihazda (IndexedDB) saklanır; metin hesapla eşitlenir.
  const NOT_SES_SN = 60;
  const NOTSES = {
    db: null,
    ac() { return this.db || (this.db = new Promise((ok, no) => { try { const r = indexedDB.open('tecvid-notses', 1); r.onupgradeneeded = () => r.result.createObjectStore('s'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); } catch (e) { no(e); } })); },
    async koy(id, blob) { const d = await this.ac(); return new Promise((ok, no) => { const x = d.transaction('s', 'readwrite'); x.objectStore('s').put(blob, id); x.oncomplete = ok; x.onerror = () => no(x.error); }); },
    async al(id) { const d = await this.ac(); return new Promise((ok, no) => { const r = d.transaction('s').objectStore('s').get(id); r.onsuccess = () => ok(r.result || null); r.onerror = () => no(r.error); }); },
    async sil(id) { try { const d = await this.ac(); d.transaction('s', 'readwrite').objectStore('s').delete(id); } catch (e) { } },
  };
  const notlar = () => (S.notlar = S.notlar || []).filter(x => !x.sil);
  const notBul = (k, y) => notlar().find(x => x.k === k && x.y === y);
  const notYerAd = n => {
    if (n.k === 'ayet') { const [s, a] = n.y.split(':').map(Number); return `${sureNoAdi(s)} ${a}`; }
    const [id, i] = n.y.split(':'), u = unitById(id); return u ? `${u.ad} · ${t('{0}. sayfa', (+i || 0) + 1)}` : id;
  };
  function notYenile() { const e = ekranYigini[ekranYigini.length - 1]; if (e && (e[0] === 'notlar' || e[0] === 'sayfa' || e[0] === 'ders')) ciz(); }
  // Not penceresi: yaz, ses kaydet, dinle, kaydet / sil
  function notPenceresi(k, y) {
    document.querySelectorAll('.not-pencere').forEach(x => x.remove());
    const var_ = notBul(k, y), n = var_ ? var_ : { id: 'n' + simdi().toString(36) + Math.random().toString(36).slice(2, 6), k, y, m: '', ses: 0, t: simdi(), g: simdi(), yeni: true };
    let kayit = null, yeniSes = null, sesDeg = false, sesSil = false, zamanlayici = null;
    const d = document.createElement('div'); d.className = 'not-pencere'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', t('Not'));
    d.innerHTML = `<div class="not-kutu kart"><div class="not-baslik"><b>${IKON.not} ${esc(notYerAd(n))}</b><button class="link" id="notKapat" aria-label="${t('Kapat')}">✕</button></div>
      <textarea id="notMetin" rows="5" maxlength="2000" placeholder="${t('Notunu yaz…')}">${esc(n.m)}</textarea>
      <div class="satir sola not-ses"><button class="btn ikincil kucuk" id="notKayit">🎙️ ${t('Ses kaydet')}</button><button class="btn ikincil kucuk" id="notCal" hidden>▶ ${t('Dinle')}</button><button class="link" id="notSesSil" hidden>${t('Sesi sil')}</button><span class="soluk kucukyazi" id="notSure"></span></div>
      <p class="soluk kucukyazi">${t('Ses en çok {0} sn; yalnız bu cihazda saklanır.', NOT_SES_SN)}</p>
      <div class="satir sola"><button class="btn" id="notKaydet">${t('Kaydet')}</button>${var_ ? `<button class="btn ikincil" id="notSil">${t('Sil')}</button>` : ''}</div></div>`;
    document.body.appendChild(d);
    const kapat = () => { try { if (kayit) kayit.stop(); } catch (e) { } clearInterval(zamanlayici); d.remove(); };
    const sesGoster = () => { const var_s = (!sesSil && (yeniSes || (n.ses && !sesSil))); d.querySelector('#notCal').hidden = !var_s; d.querySelector('#notSesSil').hidden = !var_s; };
    sesGoster();
    d.querySelector('#notKapat').onclick = kapat;
    d.addEventListener('click', e => { if (e.target === d) kapat(); });
    d.querySelector('#notKayit').onclick = async ev => {
      const b = ev.currentTarget;
      if (kayit) { kayit.stop(); return; }
      if (!navigator.mediaDevices || !window.MediaRecorder) return toast(t('Bu cihazda ses kaydı desteklenmiyor.'));
      let akis; try { akis = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { return toast(t('Mikrofon izni verilmedi. Telefon ayarlarından Kur\'an Yolum için mikrofona izin ver.')); }
      const parca = [], rec = new MediaRecorder(akis); kayit = rec; const bas = Date.now(); b.textContent = '⏹ ' + t('Durdur');
      rec.ondataavailable = e => { if (e.data.size) parca.push(e.data); };
      rec.onstop = () => { akis.getTracks().forEach(z => z.stop()); clearInterval(zamanlayici); kayit = null; b.textContent = '🎙️ ' + t('Ses kaydet'); d.querySelector('#notSure').textContent = '';
        if (parca.length) { yeniSes = { blob: new Blob(parca, { type: rec.mimeType || 'audio/webm' }), sn: Math.max(1, Math.round((Date.now() - bas) / 1000)) }; sesDeg = true; sesSil = false; sesGoster(); } };
      rec.start(); zamanlayici = setInterval(() => { const sn = Math.round((Date.now() - bas) / 1000); d.querySelector('#notSure').textContent = sn + ' / ' + NOT_SES_SN + ' ' + t('sn'); if (sn >= NOT_SES_SN) rec.stop(); }, 500);
    };
    d.querySelector('#notCal').onclick = async () => {
      try { const blob = yeniSes ? yeniSes.blob : await NOTSES.al(n.id); if (!blob) return toast(t('Ses bulunamadı.')); sesDurdur(); const a = new Audio(URL.createObjectURL(blob)); a.play(); } catch (e) { toast(t('Ses çalınamadı.')); }
    };
    d.querySelector('#notSesSil').onclick = () => { yeniSes = null; sesSil = true; sesDeg = true; sesGoster(); };
    d.querySelector('#notKaydet').onclick = async () => {
      const m = d.querySelector('#notMetin').value.trim();
      if (!m && !yeniSes && !(n.ses && !sesSil)) return toast(t('Boş not kaydedilmez.'));
      n.m = m; n.g = simdi();
      if (sesDeg) { if (yeniSes) { try { await NOTSES.koy(n.id, yeniSes.blob); n.ses = yeniSes.sn; } catch (e) { toast(t('Ses kaydedilemedi.')); } } else if (sesSil) { await NOTSES.sil(n.id); n.ses = 0; } }
      delete n.yeni; if (!var_) (S.notlar = S.notlar || []).push(n);
      kaydet(); kapat(); toast(t('Not kaydedildi ✓')); notYenile();
    };
    const sl = d.querySelector('#notSil'); if (sl) sl.onclick = () => { n.sil = true; n.g = simdi(); NOTSES.sil(n.id); kaydet(); kapat(); toast(t('Not silindi')); notYenile(); };
    setTimeout(() => { const m = d.querySelector('#notMetin'); if (m) m.focus(); }, 50);
  }
  function notaGit(n) {
    if (n.k === 'ayet') { const [s, a] = n.y.split(':').map(Number); return git('sayfa', sayfaBul(s, a), n.y); }
    const [id, i] = n.y.split(':'); EKRAN.ders._sayfa = EKRAN.ders._sayfa || {}; EKRAN.ders._sayfa[id] = +i || 0; git('ders', id);
  }
  EKRAN.notlar = function () {
    const k = KO(), suz = EKRAN.notlar._suz || 'hepsi', ara = (EKRAN.notlar._ara || '').toLowerCase();
    const eksik = benzersiz([...notlar().filter(x => x.k === 'ayet').map(x => +x.y.split(':')[0]), ...k.imler.map(x => x.n)]).filter(n => !SURE(n));
    if (eksik.length) { app.innerHTML = `${ust(t('Notlarım'))}<main><p class="soluk">${t('Yükleniyor…')}</p></main>`; Promise.all(eksik.map(sureYukle)).then(() => { if (ekranYigini[ekranYigini.length - 1][0] === 'notlar') ciz(); }).catch(() => { }); return; }
    const ogeler = [
      ...notlar().map(x => ({ tur: 'not', t: x.g || x.t, x, ad: notYerAd(x), kur: x.k === 'ayet' })),
      ...k.imler.map(x => ({ tur: 'im', t: x.t || 0, x, ad: `${sureNoAdi(x.n)} ${x.a}`, kur: true })),
    ].filter(o => suz === 'hepsi' || (suz === 'notlar' && o.tur === 'not') || (suz === 'imler' && o.tur === 'im') || (suz === 'ders' && o.tur === 'not' && !o.kur))
      .filter(o => !ara || (o.ad + ' ' + (o.x.m || '')).toLowerCase().includes(ara)).sort((a, b) => b.t - a.t);
    const cip = (v, ad) => `<button class="cip ${suz === v ? 'aktif' : ''}" data-not-suz="${v}">${ad}</button>`;
    app.innerHTML = `${ust(t('Notlarım'))}<main>
      <div class="cipler">${cip('hepsi', t('Hepsi'))}${cip('notlar', t('Notlar'))}${cip('imler', t('Yer imleri'))}${cip('ders', t('Ders notları'))}</div>
      <input id="notAra" type="search" class="not-ara" placeholder="${t('Notlarda ara…')}" value="${esc(EKRAN.notlar._ara || '')}">
      ${ogeler.length ? `<div class="bolumler">${ogeler.map(o => o.tur === 'im'
        ? `<div class="ko-im ko-im-${o.x.renk}"><button class="ko-im-git" data-not-im="${o.x.n}:${o.x.a}"><span class="ko-im-nokta" aria-hidden="true"></span><span class="bad"><small>${IKON.yerimi} ${t('Yer imi')} · ${tarihStr(o.x.t).slice(0, 10)}</small>${esc(o.ad)}</span></button></div>`
        : `<div class="not-oge"><button class="not-git" data-not-git="${o.x.id}"><span class="bad"><small>${IKON.not} ${o.kur ? t('Kur\'an') : t('Ders')} · ${tarihStr(o.x.g || o.x.t).slice(0, 10)}${o.x.ses ? ' · 🎙️ ' + o.x.ses + ' ' + t('sn') : ''}</small><b>${esc(o.ad)}</b>${o.x.m ? `<span class="not-metin">${esc(o.x.m.length > 140 ? o.x.m.slice(0, 140) + '…' : o.x.m)}</span>` : ''}</span></button>
          <div class="satir sola"><button class="link" data-not-duzenle="${o.x.id}">${t('Düzenle')}</button>${o.x.ses ? `<button class="link" data-not-cal="${o.x.id}">▶ ${t('Dinle')}</button>` : ''}</div></div>`).join('')}</div>`
        : `<p class="soluk">${t('Henüz not ya da yer imi yok. Okurken ayet numarasına dokunup 📝 Not\'u seç; derslerde sayfanın üstündeki 📝 Not düğmesini kullan.')}</p>`}</main>`;
    app.querySelectorAll('[data-not-suz]').forEach(b => b.onclick = () => { EKRAN.notlar._suz = b.dataset.notSuz; ciz(); });
    const ai = $('#notAra'); ai.oninput = () => { EKRAN.notlar._ara = ai.value; const c = ai.selectionStart; ciz(); const y = $('#notAra'); if (y) { y.focus(); y.setSelectionRange(c, c); } };
    app.querySelectorAll('[data-not-git]').forEach(b => b.onclick = () => notaGit(notlar().find(x => x.id === b.dataset.notGit)));
    app.querySelectorAll('[data-not-duzenle]').forEach(b => b.onclick = () => { const x = notlar().find(z => z.id === b.dataset.notDuzenle); if (x) notPenceresi(x.k, x.y); });
    app.querySelectorAll('[data-not-cal]').forEach(b => b.onclick = async () => { try { const blob = await NOTSES.al(b.dataset.notCal); if (!blob) return toast(t('Ses bulunamadı.')); sesDurdur(); new Audio(URL.createObjectURL(blob)).play(); } catch (e) { toast(t('Ses çalınamadı.')); } });
    app.querySelectorAll('[data-not-im]').forEach(b => b.onclick = () => { const [n, a] = b.dataset.notIm.split(':').map(Number); git('sayfa', sayfaBul(n, a), `${n}:${a}`); });
  };
  EKRAN.yerImleri = function () {
    const k = KO(), l = k.imler.slice().sort((x, y) => y.t - x.t);
    const eksik = benzersiz(l.map(x => x.n)).filter(n => !SURE(n));
    if (eksik.length) { app.innerHTML = `${ust(t('Yer imleri'))}<main><p class="soluk">${t('Yükleniyor…')}</p></main>`; Promise.all(eksik.map(sureYukle)).then(() => { if (ekranYigini[ekranYigini.length - 1][0] === 'yerImleri') ciz(); }).catch(() => { }); return; }
    app.innerHTML = `${ust(t('Yer imleri'))}<main>
      ${l.length ? `<div class="bolumler">${l.map(x => { const y = SURE(x.n), metin = y ? y.ayet[x.a - 1].split(' ').slice(0, 6).join(' ') : '';
        return `<div class="ko-im ko-im-${x.renk}"><button class="ko-im-git" data-git="sayfa|${sayfaBul(x.n, x.a)}|${x.n}:${x.a}"><span class="ko-im-nokta" aria-hidden="true"></span><span class="bad"><small>${t('Sayfa {0}', sayfaBul(x.n, x.a))} · ${tarihStr(x.t).slice(0, 10)}</small>${esc(sureNoAdi(x.n))} ${x.a}<span class="ar ko-im-ar" dir="rtl" lang="ar">${esc(metin)}…</span></span></button><button class="ko-im-sil" data-im-sil="${x.n}:${x.a}" aria-label="${t('Yer imini sil')}">✕</button></div>`; }).join('')}</div>`
        : `<p class="soluk">${t('Henüz yer imin yok. Okurken ayet numarasına dokun ve 🔖 Yer imi\'ni seç.')}</p>`}</main>`;
    app.querySelectorAll('[data-im-sil]').forEach(b => b.onclick = () => { const [n, a] = b.dataset.imSil.split(':').map(Number); k.imler = k.imler.filter(x => !(x.n === n && x.a === a)); kaydet(); ciz(); });
  };
  // Okuma ekranı: sayfa sayfa; üç görünüm, üç tema
  EKRAN.sayfa = function (p, hedef) {
    p = Math.min(604, Math.max(1, +p || 1));
    if (!M.sayfa.length) { app.innerHTML = `${ust(t('Sayfa'))}<main><p class="hata">${t('Sayfa bilgisi yüklenemedi.')}</p></main>`; return; }
    const k = KO(), gor = k.gorunum, ay = sayfaAyetleri(p), sureler_ = benzersiz(ay.map(r => r[0]));
    const eksik = sureler_.filter(n => !SURE(n)), mealEksik = gor === 'meal' || gor === 'sadecemeal' || gor === 'kelimemeal' ? sureler_.filter(n => !mealSecili().every(k => mealVeri(k, n))) : [];
    const kmEksik = (gor === 'kelime' || gor === 'kelimemeal') && KELIME_MEAL_KAYNAK.length ? sureler_.filter(n => !kmVeri(n)) : [];
    if (eksik.length || mealEksik.length || kmEksik.length) {
      app.innerHTML = `${ust(t('Sayfa {0}', p))}<main><p class="soluk">${t('Yükleniyor…')}</p></main>`;
      Promise.all([...eksik.map(sureYukle), ...mealEksik.map(n => Promise.all(mealSecili().map(k => mealKaynakYukle(k, n))).catch(() => null)), ...kmEksik.map(kmYukle)]).then(() => { const ek = ekranYigini[ekranYigini.length - 1]; if (ek[0] === 'sayfa' && +ek[1][0] === p) ciz(); })
        .catch(() => { const m = app.querySelector('main'); if (m) m.innerHTML = `<p class="hata">${t('Sûre açılamadı.')}</p>`; });
      return;
    }
    const [n0, a0] = ay[0];
    // Durak grupları (Talvia incelemesi): vakıf işaretine ya da ayet sonuna kadar olan kelimeler bir grup; gruplar sırayla iki renkte
    let dg = 0; const durakRenk = !!S.ayar.durakGrup;
    const kelimeler = (n, a) => { const r = `${n}:${a}`; let o = 0; const l = SURE(n).ayet[a - 1].split(' ');
      const km_ = (gor === 'kelime' || gor === 'kelimemeal') && KELIME_MEAL_KAYNAK.length ? (kmVeri(n) || [])[a - 1] || [] : null;
      const h__ = l.map((w, wi) => { let h_ = `<span class="kelime${durakRenk ? ' dg-' + (dg % 2) : ''}" data-ses="${kelimeUrl(r, wi + 1)}">${durakIsik(kelimeHTML(r, w, o))}</span>`; if (km_) h_ = `<span class="kelime-k">${h_}<small class="kelime-an">${esc(km_[wi] || '')}</small></span>`; o += w.length + 1; if (durakRenk && /[\u06D6-\u06DB]/.test(w) && wi < l.length - 1) dg++; return h_; }).join(' ');
      if (durakRenk) dg++; return h__; };
    const noDugme = (n, a) => { const im = koImBul(n, a); return `<button class="ayet-no ko-no ${im ? 'ko-im-' + im.renk : ''} ${notBul('ayet', n + ':' + a) ? 'ko-not' : ''} ${(KO().ay[bugun()] || []).includes(n + ':' + a) ? 'ko-read' : ''}" data-ko-ayet="${n}:${a}" aria-label="${t('{0} {1}. ayet', esc(sureNoAdi(n)), a)}">﴿${a.toLocaleString('ar-EG')}﴾</button>`; };
    const sureBasi = n => `<div class="sure-baslik" id="sb-${n}"><span class="ar">${esc(SURE(n).ar)}</span> · ${esc(sureAdi(SURE(n)))}</div>${n !== 1 && n !== 9 ? `<div class="ayet besmele" dir="rtl" lang="ar">${esc(trBesmele() || window.BESMELE || '')}</div>` : ''}`;
    let govde = '';
    if (gor === 'resim' && MUSHAF_RESIM.v) {
      govde = `<img class="ko-resim" src="${esc(MUSHAF_RESIM.v.url(p))}" alt="${t('Sayfa {0}', p)}">`;
    } else if (gor === 'mushaf') {
      let onceki = null;
      ay.forEach(([n, a]) => {
        if (n !== onceki) { if (onceki !== null) govde += '</div>'; if (a === 1) govde += sureBasi(n); govde += `<div class="ayet ko-mushaf" dir="rtl" lang="ar">`; onceki = n; }
        govde += `<span class="ko-a" data-ayet="${n}:${a}">${kelimeler(n, a)}</span> ${noDugme(n, a)} `;
      });
      govde += '</div>';
    } else {
      ay.forEach(([n, a]) => {
        if (a === 1) govde += sureBasi(n);
        const mealler = gor === 'meal' || gor === 'sadecemeal' || gor === 'kelimemeal' ? mealSecili().map(k => [k, (mealVeri(k, n) || [])[a - 1]]).filter(x => x[1]) : [];
        if (gor === 'sadecemeal') { govde += `<div class="ko-ayet ko-a" data-ayet="${n}:${a}"><p class="ko-meal ko-sadece">${noDugme(n, a)} ${mealler.map(([k, m]) => `${esc(m)}${mealler.length > 1 ? ` <small class="soluk">· ${esc(k.ad)}</small>` : ''}`).join('<br>')}</p></div>`; return; }
        govde += `<div class="ko-ayet ko-a" data-ayet="${n}:${a}"><div class="ayet" dir="rtl" lang="ar">${kelimeler(n, a)} ${noDugme(n, a)}</div>${mealler.map(([k, m]) => `<p class="ko-meal"><span class="ko-meal-no">${a}.</span> ${esc(m)}${mealler.length > 1 ? ` <small class="soluk">· ${esc(k.ad)}</small>` : ''}</p>`).join('')}</div>`;
      });
    }
    const bu = koBugun(), h = k.hedef, okundu = (k.gun[bugun()] || []).includes(p);
    const hd = hatimDurum(), hatimSirasi = hd && !hd.bitti && hd.h.sayfa + 1 === p;
    const baslikN = hedef && /^\d+:\d+$/.test(hedef) ? +String(hedef).split(':')[0] : k.son && k.son.p === p && sureler_.includes(k.son.n) ? k.son.n : n0;
    if (!(S.sonSureler || [])[0] || S.sonSureler[0] !== baslikN) { S.sonSureler = [baslikN].concat((S.sonSureler || []).filter(x => x !== baslikN)).slice(0, 6); kaydet(); }
    app.innerHTML = `${ust(`${esc(sureNoAdi(baslikN))} · ${t('Sayfa {0}', p)}`, true, `<button class="hesapbtn ko-ayar-btn" id="koGitBtn" aria-label="${t('Git')}">📍</button><button class="hesapbtn ko-ayar-btn" id="koAyar" aria-label="${t('Görünüm')}">Aa</button>`)}
      <div class="ko-serit"><span>${t('Cüz {0}', cuzBul(n0, a0))}</span>${h ? `<span class="ko-serit-bar" aria-label="${t('Bugün {0}/{1} sayfa', bu, h)}"><i style="width:${Math.min(100, Math.round(bu / h * 100))}%"></i></span><span>${t('Bugün {0}/{1}', bu, h)}</span>` : `<span>${t('Bugün {0} sayfa', bu)}</span>`}<button class="ko-dinle" id="koTakip">🎙️ ${t('Sen oku')}</button><button class="ko-dinle" id="koDinle">▶ ${t('Dinle')}</button></div>
      <main class="oku-ekran tema-${k.tema} gor-${gor}" id="okuEkran">
        <div class="ko-kaydir" id="koKaydir" hidden aria-hidden="true"><i id="koKaydirTut"></i></div>
        <article class="ko-sayfa">${govde}<p class="ko-sayfa-no">${p}</p></article>
        ${gor === 'meal' || gor === 'sadecemeal' ? `<p class="soluk kucukyazi ortala">${DIL === 'en' ? t('Meal: {0} ({1}).', mealSecili().map(k => k.ad).join(', '), benzersiz(mealSecili().map(k => k.kaynak)).join(', ')) : t('Meal: {0} ({1}). Meal, ayetin anlamını anlamaya yardım eder; Kur\'an\'ın kendisi Arapça metindir.', mealSecili().map(k => k.ad).join(', '), benzersiz(mealSecili().map(k => k.kaynak)).join(', '))}</p>` : ''}
        <p class="soluk kucukyazi ortala">${t('Ayet numarasına dokun: dinle, yer imi koy, meale bak.')} ${t('🎙️ Sen oku: sen okudukça okuduğun yer işaretlenir, sayfa bitince sonraki sayfaya geçilir.')}</p>
        ${TAKIP_HATA.size ? `<div class="satir ortala"><button class="btn ikincil" id="koHatalar">🔍 ${t('Hatalarımı göster ({0})', TAKIP_HATA.size)}</button></div>` : ''}
        <div class="canli-bar" id="canliBar" hidden>${canliBarHTML(true)}</div>
      </main>
      ${S.ayar.otoKaydir ? `<button class="ko-oto" id="koOto">▶ ${t('Kaydır')}</button>` : ''}
      <div class="ko-alt"><button class="btn ikincil ko-ok-btn" data-ko-git="${p - 1}" ${p <= 1 ? 'disabled' : ''} aria-label="${t('Önceki sayfa')}">‹</button>
        <button class="btn ko-ileri ${okundu ? 'okundu' : ''}" id="koOkudum">${okundu ? `✓ ${t('Okundu')} · ${t('Sonraki sayfa')}` : `✓ ${t('Okudum')}`} ›</button>
        <button class="btn ikincil ko-ok-btn" id="koIleri" ${p >= 604 ? 'disabled' : ''} aria-label="${t('Sonraki sayfa')}">›</button></div>`;
    const git_ = (q, hd_) => { if (q < 1 || q > 604) return; if (CANLI) canliDurdur(true); ekranYigini[ekranYigini.length - 1] = ['sayfa', [q, hd_ || '']]; ciz(); window.scrollTo(0, 0); };
    // Sesli takip (Talvia incelemesi): sayfadaki ayetler sûre sûre canlı takip motoruyla dinlenir; okunan kelimeler işaretlenir,
    // biten ayet "kaldığın yer" olur; sayfa bitince sonraki sayfa açılır ve takip sürer.
    const parcalar = []; ay.forEach(([n, a]) => { const l = parcalar[parcalar.length - 1]; if (l && l.n === n) l.bit = a; else parcalar.push({ n, bas: a, bit: a }); });
    // Ok düğmeleri (‹ ›): ayet ayet ilerle. Okunan yer, takip sürerken canlı motordan, durunca son okunan ayetten alınır.
    let sonOkunan = null, sonOk = 0;
    const ok = { geri: () => okGit(-1), ileri: () => okGit(1) };
    const okGit = d => {
      if (Date.now() - sonOk < 800) return; sonOk = Date.now();   // çift dokunuşta iki mikrofon açılmasın
      const su = CANLI && CANLI.W.length ? [CANLI.n, CANLI.W[Math.min(CANLI.acilan, CANLI.W.length - 1)].a] : (sonOkunan || ay[0]);
      const i = ay.findIndex(x => x[0] === su[0] && x[1] === su[1]), h = ay[i + d];
      if (h) return takip(h[0], h[1]);
      if (d > 0) return git_(p + 1, 'takip');       // sayfanın son ayeti: sonraki sayfada takip sürer
      if (p > 1) return git_(p - 1, 'takip');
      takip(su[0], su[1]);
    };
    // "Hatalarımı göster": bu oturumda bulunan açık hatalar, ayrıntılı raporla
    const hataPaneli = () => {
      const l = [...TAKIP_HATA.values()].sort((x, y) => x.p - y.p || x.n - y.n || x.a - y.a);
      const d = document.createElement('div'); d.className = 'modal-arka';
      d.innerHTML = `<div class="modal kart ko-hatalar" role="dialog" aria-modal="true"><h2>${t('Hatalarım')}</h2>` + (l.length
        ? l.map(h => `<section class="ko-hata"><h3>${esc(sureNoAdi(h.n))} · ${t('{0}. ayet', h.a)} <small>(${t('Sayfa {0}', h.p)})</small></h3>${raporHTML(h.n, h.a, h.s)}
            <div class="satir sola">${h.p === p ? `<button class="btn kucuk" data-tekrar="${h.n}:${h.a}">${t('🔁 Tekrar oku')}</button>` : `<button class="btn kucuk ikincil" data-sayfa="${h.p}" data-hedef="${h.n}:${h.a}">${t('{0}. sayfaya git', h.p)}</button>`}</div></section>`).join('')
        : `<p>${t('Açık hata yok. Maşallah!')}</p>`) + `<div class="satir"><button class="btn ikincil" data-c="temizle">${t('Listeyi temizle')}</button><button class="btn" data-c="kapat">${t('Kapat')}</button></div></div>`;
      document.body.appendChild(d);
      const kapat = () => d.remove();
      d.onclick = e => {
        if (e.target === d) return kapat();
        const c = e.target.closest('[data-c]'); if (c) { if (c.dataset.c === 'temizle') { TAKIP_HATA.clear(); document.querySelectorAll('.kelime.hata-alt').forEach(x => x.classList.remove('hata-alt')); const b = $('#koHatalar'); if (b) b.parentNode.remove(); } return kapat(); }
        const tk = e.target.closest('[data-tekrar]'); if (tk) { kapat(); const [n_, a_] = tk.dataset.tekrar.split(':').map(Number); return takip(n_, a_); }
        const sf = e.target.closest('[data-sayfa]'); if (sf) { kapat(); git_(+sf.dataset.sayfa, sf.dataset.hedef); }
      };
    };
    const takip = (n, bas) => {
      if (CANLI) { canliDurdur(true); return setTimeout(() => takip(n, bas), 300); }
      const j = parcalar.findIndex(x => x.n === n && bas >= x.bas && bas <= x.bit); if (j < 0) return;
      const pr = parcalar[j];
      canliBarSifirla(ok); $('#koTakip').textContent = '⏹ ' + t('Sen oku');
      canliBaslat(n, bas, {
        bit: pr.bit, gizle: () => false,
        hataKaydet: (a, s) => {   // kesin hata varsa listeye gir; aynı ayet sonradan doğru okunursa listeden çık
          if (!s || !s.kelimeler) return; const k = n + ':' + a;
          if (s.kelimeler.some(w => w.notes.some(z => z.severity === 'jali'))) TAKIP_HATA.set(k, { n, a, p, s }); else TAKIP_HATA.delete(k);
        },
        elBul: a => [...app.querySelectorAll(`.ko-a[data-ayet="${n}:${a}"] .kelime`)],
        ayetBitti: a => { if (a > 0) { EKRAN.sayfa._yoksay = Date.now() + 1500; koSonKaydet(n, a, p); koAyetOkundu(n, a); koAyetHedefKontrol(); } },
        bitince: C_ => {
          const tb = $('#koTakip'); if (tb) tb.textContent = '🎙️ ' + t('Sen oku');
          const tamam = C_.bitenAyet >= C_.AY.length;
          if (tamam && parcalar[j + 1]) return takip(parcalar[j + 1].n, parcalar[j + 1].bas);
          if (tamam) {
            koSayfaOkundu(p, true);
            if (hatimSirasi) { S.hatim.sayfa = p; kaydet(); }
            if (p < 604) { toast(t('Sayfa bitti. Sonraki sayfa…')); setTimeout(() => { const ek = ekranYigini[ekranYigini.length - 1]; if (ek[0] === 'sayfa' && +ek[1][0] === p) git_(p + 1, 'takip'); }, 1200); }
            else toast(t('Hatmi bitirdin. Allah kabul etsin! 🤲'));
            return;
          }
          // Kullanıcı durdurdu: kaldığı ayetten devam edebilir
          const okunan = C_.AY.filter(y => y.a > 0 && C_.W.some(w => w.a === y.a && C_.W.indexOf(w) < C_.acilan));
          const sonA = okunan.length ? okunan[okunan.length - 1].a : bas;
          const bar = $('#canliBar'); if (!bar) return; sonOkunan = [n, sonA];
          bar.innerHTML = `<div class="canli-sonuc"><p class="canli-baslik">${t('Okuma durdu. {0} kelime okundu.', C_.acilan)}</p>
            <div class="satir sola"><button class="btn ikincil ko-ok" id="koOkGeri" aria-label="${t('Önceki ayet')}">‹</button><button class="btn" id="koTakipDevam">🎙️ ${t('{0}. ayetten devam et', sonA)}</button><button class="btn ikincil ko-ok" id="koOkIleri" aria-label="${t('Sonraki ayet')}">›</button></div>
            <div class="satir sola">${TAKIP_HATA.size ? `<button class="btn ikincil" id="koHatalarBar">🔍 ${t('Hatalarımı göster ({0})', TAKIP_HATA.size)}</button>` : ''}<button class="btn ikincil" id="canliKapat">${t('Kapat')}</button></div>
            <p class="soluk kucukyazi"><button class="link" id="koTani">${t('🛠 Sorun mu var? Tanı kaydını kopyala')}</button></p></div>`;
          $('#koTani').onclick = () => taniKopyala(C_);
          $('#koOkGeri').onclick = ok.geri; $('#koOkIleri').onclick = ok.ileri; if ($('#koHatalarBar')) $('#koHatalarBar').onclick = hataPaneli;
          $('#koTakipDevam').onclick = () => takip(n, sonA);
          $('#canliKapat').onclick = () => { canliBarSifirla(); bar.hidden = true; };
        },
      });
    };
    if ($('#koHatalar')) $('#koHatalar').onclick = hataPaneli;
    $('#koTakip').onclick = () => {
      if (gor === 'sadecemeal' || gor === 'resim') return toast(t('Sen oku için Arapça metin görünür olmalı.'));
      if (CANLI) return canliDurdur();
      if (koSure) $('#koDinle').click();
      const son_ = k.son && k.son.p === p && parcalar.some(x => x.n === k.son.n && k.son.a >= x.bas && k.son.a <= x.bit) ? k.son : null;
      takip(son_ ? son_.n : parcalar[0].n, son_ ? son_.a : parcalar[0].bas);
    };
    if (hedef === 'takip') setTimeout(() => { const ek = ekranYigini[ekranYigini.length - 1]; if (ek[0] === 'sayfa' && +ek[1][0] === p && !CANLI) takip(parcalar[0].n, parcalar[0].bas); }, 400);
    app.querySelectorAll('[data-ko-git]').forEach(b => b.onclick = () => git_(+b.dataset.koGit));
    // ›: yalnız sonraki sayfaya geç (okundu sayılmaz); ✓ Okudum: sayfayı okundu say ve sonrakine geç
    $('#koIleri').onclick = () => { if (p < 604) git_(p + 1); };
    $('#koOkudum').onclick = () => {
      koSayfaOkundu(p, true);
      if (hatimSirasi) { S.hatim.sayfa = p; kaydet(); if (p >= 604) { toast(t('Hatmi bitirdin. Allah kabul etsin! 🤲')); ciz(); return; } }
      if (p < 604) git_(p + 1); else ciz();
    };
    $('#koGitBtn').onclick = () => koGitPenceresi((q, h) => git_(q, h));
    // Otomatik kaydırma (Aa menüsünden hız seçilince ▶ Kaydır düğmesi çıkar)
    const otoBtn = $('#koOto');
    if (otoBtn) {
      const px = [0, 25, 50, 90][S.ayar.otoKaydir] || 0; let zm = null, birikim = 0;
      const dur = () => { clearInterval(zm); zm = null; if (document.body.contains(otoBtn)) otoBtn.textContent = '▶ ' + t('Kaydır'); };
      const basla = () => {
        if (zm) return; otoBtn.textContent = '⏸ ' + t('Duraklat'); let son = performance.now();
        zm = setInterval(() => {
          if (!document.body.contains(otoBtn) || ekranYigini[ekranYigini.length - 1][0] !== 'sayfa') return dur();
          const n_ = performance.now(); birikim += px * (n_ - son) / 1000; son = n_;
          if (birikim >= 1) { const dy = Math.floor(birikim); birikim -= dy; window.scrollBy(0, dy); }
          if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) { dur(); toast(t('Sayfa sonu')); }
        }, 50);
      };
      otoBtn.onclick = () => zm ? dur() : basla();
      document.removeEventListener('touchstart', EKRAN.sayfa._otoDur); EKRAN.sayfa._otoDur = dur; document.addEventListener('touchstart', dur, { passive: true });
    }
    // Sayfada 30 sn kalınca okunmuş sayılır (hızlıca geçmek sayılmaz)
    clearTimeout(EKRAN.sayfa._zaman);
    if (!okundu) EKRAN.sayfa._zaman = setTimeout(() => { const ek = ekranYigini[ekranYigini.length - 1]; if (ek[0] === 'sayfa' && +ek[1][0] === p && koSayfaOkundu(p, true)) { const s_ = $('.ko-serit'); if (s_ && !CANLI) ciz(); } }, 30000);
    // Kaldığın yer: ekranın üst kısmındaki ilk ayet
    const ayetEller = [...app.querySelectorAll('.ko-a')];
    const yerBul = () => { if (Date.now() < (EKRAN.sayfa._yoksay || 0)) return; const ust_ = 110; let sec = ayetEller[0]; for (const el of ayetEller) { const r = el.getBoundingClientRect(); if (r.bottom > ust_) { sec = el; break; } } if (sec) { const [n, a] = sec.dataset.ayet.split(':').map(Number); koSonKaydet(n, a, p); const h1 = $('.ust h1'); if (h1) h1.textContent = `${sureNoAdi(n)} · ${t('Sayfa {0}', p)}`; } };
    window.removeEventListener('scroll', EKRAN.sayfa._kaydir); EKRAN.sayfa._kaydir = () => { if (ekranYigini[ekranYigini.length - 1][0] !== 'sayfa') return window.removeEventListener('scroll', EKRAN.sayfa._kaydir); clearTimeout(EKRAN.sayfa._kz); EKRAN.sayfa._kz = setTimeout(yerBul, 250); };
    window.addEventListener('scroll', EKRAN.sayfa._kaydir, { passive: true });
    EKRAN.sayfa._yoksay = 0;
    if (hedef && hedef !== 'takip') { const el = app.querySelector(`.ko-a[data-ayet="${hedef}"]`); if (el) { EKRAN.sayfa._yoksay = Date.now() + 2500; const kaydir = () => { if (!document.body.contains(el)) return; const [hn, ha] = String(hedef).split(':').map(Number); const hd = ha === 1 && document.getElementById('sb-' + hn) || el; window.scrollTo(0, Math.max(0, hd.getBoundingClientRect().top + scrollY - 128)); };
      setTimeout(() => { kaydir(); el.classList.add('ko-vurgu'); setTimeout(() => el.classList.remove('ko-vurgu'), 2200); }, 60); if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setTimeout(kaydir, 50)); setTimeout(kaydir, 500); const [n, a] = String(hedef).split(':').map(Number); koSonKaydet(n, a, p); } }
    else if (hedef === 'takip') koSonKaydet(n0, a0, p);
    else if (k.son && k.son.p === p && k.son.n) { const el = app.querySelector(`.ko-a[data-ayet="${k.son.n}:${k.son.a}"]`); if (el && (k.son.n !== n0 || k.son.a !== a0)) { EKRAN.sayfa._yoksay = Date.now() + 1000; setTimeout(() => { const y = el.getBoundingClientRect().top + scrollY - 120; window.scrollTo(0, Math.max(0, y)); }, 30); } }
    else koSonKaydet(n0, a0, p);
    // Kaydırarak sayfa çevirme (mushaf gibi: sağa kaydır → sonraki sayfa)
    const ekran = $('#okuEkran'); let dx0 = null, dy0 = null;
    ekran.addEventListener('touchstart', e => { const t_ = e.touches[0]; dx0 = t_.clientX; dy0 = t_.clientY; }, { passive: true });
    ekran.addEventListener('touchend', e => { if (dx0 === null) return; const t_ = e.changedTouches[0], dx = t_.clientX - dx0, dy = t_.clientY - dy0; dx0 = null; if (Math.abs(dx) > 80 && Math.abs(dy) < 60) git_(dx > 0 ? p + 1 : p - 1); }, { passive: true });
    // Sayfayı dinle: sayfadaki ayetler sırayla
    // Sayfayı dinle: mini oynatıcı (önceki / duraklat / sonraki ayet, hız, ilerleme) ve tam ekran görünümü
    $('#koDinle').onclick = ev => {
      const btn = ev.currentTarget;
      if (koSure) { koSure.dur(); return; }
      const is = { iptal: false, j: -1, au: null, duraklat: false }; koSure = is; btn.textContent = '⏹ ' + t('Durdur');
      const temizle = () => app.querySelectorAll('.ko-a.calan').forEach(x => x.classList.remove('calan'));
      const bitir = () => { is.iptal = true; clearInterval(is.iz); if (koSure === is) koSure = null; if (document.body.contains(btn)) btn.textContent = '▶ ' + t('Dinle'); temizle(); const m = document.getElementById('koMini'); if (m) m.remove(); };
      is.dur = () => { is.iptal = true; if (is.au) is.au.onended = null; sesDurdur(); bitir(); };
      const HIZLAR = [0.75, 1, 1.25, 1.5, 2];
      const mini = () => {
        let m = document.getElementById('koMini');
        if (!m) {
          m = document.createElement('div'); m.id = 'koMini'; m.className = 'ko-mini'; m.setAttribute('role', 'region'); m.setAttribute('aria-label', t('Oynatıcı'));
          m.innerHTML = `<button class="ko-mini-kucult" id="koMiniKucult" aria-label="${t('Küçült')}">⌄</button>
            <div class="ko-mini-tam"><p class="ayet" dir="rtl" lang="ar" id="koMiniAr"></p><p class="ko-meal" id="koMiniMeal"></p><p class="ko-mini-yer" id="koMiniYer2"></p></div>
            <div class="ko-mini-ust"><div class="ko-mini-ad"><b id="koMiniYer"></b><small id="koMiniKari"></small></div>
              <button id="koMiniGeri" aria-label="${t('Önceki ayet')}">⏮</button><button id="koMiniOyna" aria-label="${t('Duraklat')}">⏸</button><button id="koMiniIleri" aria-label="${t('Sonraki ayet')}">⏭</button><button id="koMiniTam" aria-label="${t('Büyüt')}">⤢</button><button id="koMiniKapat" aria-label="${t('Kapat')}">✕</button></div>
            <div class="ko-mini-bar"><i id="koMiniBar"></i></div>
            <div class="ko-mini-hiz"><button id="koMiniEksi" aria-label="${t('Yavaşlat')}">−</button><span id="koMiniHiz"></span><button id="koMiniArti" aria-label="${t('Hızlandır')}">+</button></div>`;
          document.body.appendChild(m);
          m.querySelector('#koMiniKapat').onclick = () => is.dur();
          m.querySelector('#koMiniTam').onclick = () => m.classList.add('tam');
          m.querySelector('#koMiniKucult').onclick = () => m.classList.remove('tam');
          m.querySelector('#koMiniOyna').onclick = () => { if (!is.au) return; is.duraklat = !is.duraklat; if (is.duraklat) is.au.pause(); else is.au.play().catch(() => { }); m.querySelector('#koMiniOyna').textContent = is.duraklat ? '▶' : '⏸'; m.querySelector('#koMiniOyna').setAttribute('aria-label', is.duraklat ? t('Oynat') : t('Duraklat')); };
          m.querySelector('#koMiniIleri').onclick = () => { if (is.au) is.au.onended = null; sesDurdur(); is.duraklat = false; oynat(is.j + 1); };
          m.querySelector('#koMiniGeri').onclick = () => { if (is.au) is.au.onended = null; sesDurdur(); is.duraklat = false; oynat(Math.max(0, is.j - 1)); };
          const hizDeg = d => { const h = S.ayar.hiz || 1, i = Math.min(HIZLAR.length - 1, Math.max(0, HIZLAR.indexOf(h) < 0 ? 1 : HIZLAR.indexOf(h)) + d); S.ayar.hiz = HIZLAR[i]; kaydet(); if (is.au) is.au.playbackRate = HIZLAR[i]; m.querySelector('#koMiniHiz').textContent = HIZLAR[i] + '×'; };
          m.querySelector('#koMiniEksi').onclick = () => hizDeg(-1); m.querySelector('#koMiniArti').onclick = () => hizDeg(1);
          m.querySelector('#koMiniHiz').textContent = (S.ayar.hiz || 1) + '×';
          m.querySelector('#koMiniKari').textContent = kari().ad;
          is.iz = setInterval(() => {
            if (is.iptal) return;
            if (!document.body.contains(btn)) return is.dur();   // başka ekrana geçildi
            const au = is.au, b = document.getElementById('koMiniBar'); if (au && b && au.duration) b.style.width = Math.min(100, au.currentTime / au.duration * 100) + '%';
          }, 250);
        }
        return m;
      };
      const oynat = j => {
        if (is.iptal || !document.body.contains(btn)) return bitir();
        temizle(); if (j >= ay.length) return bitir(); if (j < 0) j = 0;
        is.j = j; const [n, a] = ay[j], el = app.querySelector(`.ko-a[data-ayet="${n}:${a}"]`); if (el) { el.classList.add('calan'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        const m = mini(); m.querySelector('#koMiniYer').textContent = `${sureNoAdi(n)} · ${t('{0}. ayet', a)}`; m.querySelector('#koMiniYer2').textContent = `${sureNoAdi(n)} ${n}:${a}`;
        const y = SURE(n); m.querySelector('#koMiniAr').textContent = y ? y.ayet[a - 1] : '';
        m.querySelector('#koMiniMeal').textContent = mealSecili().map(z => (mealVeri(z, n) || [])[a - 1]).filter(Boolean).join(' ');
        const bar = m.querySelector('#koMiniBar'); if (bar) bar.style.width = '0%';
        const au = new Audio(sesKaynak(ayetUrl(`${n}:${a}`))); ses = au; is.au = au; au.playbackRate = S.ayar.hiz || 1;
        au.onended = () => setTimeout(() => oynat(j + 1), 300); au.onerror = () => { is.dur(); toast(t('Ses çalınamadı. İnternet bağlantını kontrol et.')); }; au.play().catch(() => is.dur());
      };
      sesDurdur(); oynat(0);
    };
    // Ayet menüsü: dinle, yer imi (3 renk), meal, tecvidini çalış
    app.querySelectorAll('[data-ko-ayet]').forEach(b => b.onclick = async ev => {
      ev.stopPropagation(); document.querySelectorAll('.ko-menu').forEach(x => x.remove());
      const [n, a] = b.dataset.koAyet.split(':').map(Number), im = koImBul(n, a);
      const m = document.createElement('div'); m.className = 'ko-menu kart'; m.setAttribute('role', 'dialog');
      m.innerHTML = `<p class="ko-menu-baslik">${esc(sureNoAdi(n))} ${a}</p>
        <div class="ko-menu-dugmeler"><button data-km="okudum">✓ ${t('Bu ayeti okudum')}</button><button data-km="ayet">📄 ${t('Ayet ekranı')}</button><button data-km="dinle">▶ ${t('Dinle')}</button><button data-km="meal">📖 ${t('Meal')}</button><button data-km="tecvid">🎨 ${t('Tecvidini çalış')}</button><button data-km="not">${IKON.not} ${t('Not')}</button><button data-km="takip">🎙️ ${t('Buradan sen oku')}</button></div>
        <p class="kucukyazi soluk" style="margin:8px 0 4px">${t('Yer imi')}</p>
        <div class="ko-menu-renk">${KO_RENK.map(rk => `<button class="ko-renk ko-im-${rk} ${im && im.renk === rk ? 'aktif' : ''}" data-km-renk="${rk}" aria-label="${t('Yer imi')} ${rk}"></button>`).join('')}${im ? `<button data-km="imsil">${t('Kaldır')}</button>` : ''}</div>
        <div class="ko-menu-meal" hidden></div>`;
      document.body.appendChild(m);
      const r = b.getBoundingClientRect(); m.style.top = Math.min(innerHeight - 230, Math.max(70, r.bottom + 6)) + 'px';
      const kapat = () => { m.remove(); document.removeEventListener('click', disari, true); };
      const disari = e => { if (!m.contains(e.target)) kapat(); }; setTimeout(() => document.addEventListener('click', disari, true), 0);
      m.querySelector('[data-km="okudum"]').onclick = () => {
        kapat(); koAyetOkundu(n, a); koSonKaydet(n, a, p);
        const gunAy = KO().ay[bugun()] || [];
        if (sayfaAyetleri(p).every(([nn, aa]) => gunAy.includes(`${nn}:${aa}`))) koSayfaOkundu(p, true);
        koAyetHedefKontrol(); seriGuncelle(); kaydet(); b.classList.add('ko-read');
      };
      m.querySelector('[data-km="ayet"]').onclick = () => { kapat(); ayetEkrani(n, a, { ayetler: ay, takip: (n_, a_) => { if (koSure) $('#koDinle').click(); takip(n_, a_); } }); };
      m.querySelector('[data-km="dinle"]').onclick = () => cal(ayetUrl(`${n}:${a}`), null, ayetUrl(`${n}:${a}`, KARILER[0].klasor));
      m.querySelector('[data-km="tecvid"]').onclick = () => { kapat(); git('sureTecvid', n, a); };
      m.querySelector('[data-km="not"]').onclick = () => { kapat(); notPenceresi('ayet', `${n}:${a}`); };
      m.querySelector('[data-km="takip"]').onclick = () => { kapat(); if (koSure) $('#koDinle').click(); takip(n, a); };
      m.querySelector('[data-km="meal"]').onclick = async () => { const y = m.querySelector('.ko-menu-meal'); y.hidden = false; y.textContent = t('Yükleniyor…'); try { const ml = await Promise.all(mealSecili().map(async k => [k, ((await mealKaynakYukle(k, n)) || [])[a - 1] || ''])); y.innerHTML = ml.map(([k, m]) => `<p>${esc(m)}</p><p class="kucukyazi soluk">${esc(k.ad)}</p>`).join(''); } catch (e) { y.textContent = t('Meal açılamadı.'); } };
      m.querySelectorAll('[data-km-renk]').forEach(x => x.onclick = () => { const rk = x.dataset.kmRenk; k.imler = k.imler.filter(y => !(y.n === n && y.a === a)); k.imler.push({ n, a, renk: rk, t: simdi() }); kaydet(); kapat(); toast(t('Yer imi eklendi: {0} {1}', sureNoAdi(n), a)); b.className = `ayet-no ko-no ko-im-${rk}`; });
      const sil = m.querySelector('[data-km="imsil"]'); if (sil) sil.onclick = () => { k.imler = k.imler.filter(y => !(y.n === n && y.a === a)); kaydet(); kapat(); b.className = 'ayet-no ko-no'; toast(t('Yer imi kaldırıldı')); };
    });
    // Görünüm menüsü
    // Sürüklenebilir kaydırma çubuğu: uzun sayfalarda hızlı gezinme
    {
      const kb = $('#koKaydir'), tut = $('#koKaydirTut'), aralik = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const yerles = () => { if (!document.body.contains(kb)) return; kb.hidden = document.documentElement.scrollHeight < innerHeight * 1.6; if (kb.hidden) return; const h = kb.clientHeight - tut.offsetHeight; tut.style.top = Math.round(Math.min(1, Math.max(0, scrollY / aralik())) * h) + 'px'; };
      const git_ = y => { const r = kb.getBoundingClientRect(), o = Math.min(1, Math.max(0, (y - r.top - tut.offsetHeight / 2) / Math.max(1, r.height - tut.offsetHeight))); window.scrollTo(0, o * aralik()); };
      let surukle = false;
      kb.onpointerdown = e => { surukle = true; kb.setPointerCapture && kb.setPointerCapture(e.pointerId); kb.classList.add('tutuluyor'); git_(e.clientY); e.preventDefault(); };
      kb.onpointermove = e => { if (surukle) git_(e.clientY); };
      kb.onpointerup = kb.onpointercancel = () => { surukle = false; kb.classList.remove('tutuluyor'); };
      KAYDIR_ENG.f = yerles; yerles(); setTimeout(yerles, 400);
    }
    $('#koAyar').onclick = () => {
      document.querySelectorAll('.ko-menu').forEach(x => x.remove());
      const m = document.createElement('div'); m.className = 'ko-menu ko-ayar kart'; m.setAttribute('role', 'dialog');
      const sec = (ad, deger, l) => `<p class="kucukyazi soluk ko-menu-et">${ad}</p><div class="ko-secim">${l.map(([v, yazi]) => `<button class="${deger === v ? 'aktif' : ''}" data-ka="${v}">${yazi}</button>`).join('')}</div>`;
      m.innerHTML = `<p class="ko-menu-baslik">${t('Görünüm')}</p>
        <div data-grup="gorunum"><p class="kucukyazi soluk ko-menu-et">${t('Okuma modu')}</p><div class="gor-izgara">${[['mushaf', t('Mushaf')], ['modern', t('Arapça')], ['meal', t('Kur\'an + Meal')], ['sadecemeal', t('Yalnız meal')], ...(KELIME_MEAL_KAYNAK.length ? [['kelime', t('Kelime meali')], ['kelimemeal', t('Kelime + Meal')]] : []), ...(MUSHAF_RESIM.v ? [['resim', t('Mushaf resmi')]] : [])].map(([v, ad]) => `<button class="gor-kart ${k.gorunum === v ? 'aktif' : ''}" data-ka="${v}"><i class="gor-ikon gor-${v}" aria-hidden="true"></i><span>${ad}</span></button>`).join('')}</div></div>
        ${mealKaynaklar().length > 1 ? `<div data-grup="mealler"><p class="kucukyazi soluk ko-menu-et">${t('Mealler')}</p><div class="ko-secim">${mealKaynaklar().map(k => `<button class="${mealSecili().includes(k) ? 'aktif' : ''}" data-ka="${k.id}">${esc(k.ad)}</button>`).join('')}</div></div>` : ''}
        <div data-grup="tema"><p class="kucukyazi soluk ko-menu-et">${t('Sayfa rengi')}</p><div class="tema-liste">${KO_TEMALAR.map(([v, ad]) => `<button class="tema-oge tema-${v} ${k.tema === v ? 'aktif' : ''}" data-ka="${v}"><b>${t(ad)}</b><small>${t('Bu örnek bir metindir.')}</small></button>`).join('')}</div></div>
        <div data-grup="ar">${sec(t('Arapça yazı'), S.ayar.arYazi || 1, [[0.85, 'ع−'], [1, 'ع'], [1.2, 'ع+'], [1.4, 'ع++']])}</div>
        <div data-grup="renkli">${sec(t('Renkli tecvid'), S.ayar.renkli ? 1 : 0, [[1, t('Açık')], [0, t('Kapalı')]])}</div>
        <div data-grup="durak">${sec(t('Durak grupları (cümle cümle)'), S.ayar.durakGrup ? 1 : 0, [[1, t('Açık')], [0, t('Kapalı')]])}</div>
        <div data-grup="durakisik">${sec(t('Durak ışıkları'), S.ayar.durakIsik === false ? 0 : 1, [[1, t('Açık')], [0, t('Kapalı')]])}${durakLejant()}</div>
        <div data-grup="otokaydir">${sec(t('Otomatik kaydırma'), S.ayar.otoKaydir || 0, [[0, t('Kapalı')], [1, t('Yavaş')], [2, t('Orta')], [3, t('Hızlı')]])}</div>
        <div data-grup="ayhedef">${sec(t('Günlük ayet hedefi'), k.ayetHedef, [[5, '5'], [10, '10'], [20, '20'], [50, '50'], [100, '100'], [0, t('Yok')]])}</div>
        <div data-grup="hedef">${sec(t('Günlük hedef'), k.hedef, [[1, '1'], [2, '2'], [5, '5'], [10, '10'], [20, '20'], [0, t('Yok')]])}</div>
        <p class="kucukyazi soluk ko-menu-et">${t('Sayfaya git')}</p><div class="satir sola"><input id="koSayfaGit" type="number" min="1" max="604" value="${p}" inputmode="numeric" aria-label="${t('Sayfaya git')}"><button class="btn ikincil" id="koSayfaTamam">${t('Git')}</button></div>
        <div class="satir sola" style="margin-top:10px"><button class="btn ikincil" id="koTekrarSayfa">${IKON.tekrar} ${t('Bu sayfayı tekrarla')}</button><button class="btn ikincil" id="koTekrarSure">${IKON.tekrar} ${t('Bu sûreyi tekrarla')}</button></div>
        <div class="satir sola" style="margin-top:10px"><button class="btn ikincil" data-git="sure|${n0}">${t('Bu sûrede tecvid çalış')}</button><button class="btn ikincil" data-git="hatim">${t('Hatim takvimi')}</button></div>`;
      document.body.appendChild(m);
      const kapat = () => { m.remove(); document.removeEventListener('click', disari, true); };
      const disari = e => { if (!m.contains(e.target) && e.target.id !== 'koAyar') kapat(); }; setTimeout(() => document.addEventListener('click', disari, true), 0);
      m.querySelectorAll('[data-git]').forEach(x => x.addEventListener('click', kapat));
      m.querySelector('#koTekrarSayfa').onclick = () => { kapat(); git('tekrarla', parcalar[0].n, parcalar[0].bas, parcalar[0].bit); };
      m.querySelector('#koTekrarSure').onclick = () => { kapat(); git('tekrarla', n0); };
      m.querySelector('#koSayfaTamam').onclick = () => { const q = +m.querySelector('#koSayfaGit').value; if (q >= 1 && q <= 604) { kapat(); git_(q); } };
      m.querySelectorAll('[data-grup] [data-ka]').forEach(x => x.onclick = () => {
        const g = x.closest('[data-grup]').dataset.grup, v = x.dataset.ka;
        if (g === 'gorunum') k.gorunum = v; else if (g === 'tema') k.tema = v; else if (g === 'ar') { S.ayar.arYazi = +v; temaUygula(); } else if (g === 'renkli') S.ayar.renkli = v === '1'; else if (g === 'durak') S.ayar.durakGrup = v === '1'; else if (g === 'durakisik') S.ayar.durakIsik = v === '1'; else if (g === 'hedef') { k.hedef = +v; hatirlatmaKur(false); } else if (g === 'ayhedef') { k.ayetHedef = +v; } else if (g === 'otokaydir') { S.ayar.otoKaydir = +v; } else if (g === 'mealler') { const l = mealSecili().map(z => z.id), y = l.includes(v) ? l.filter(i => i !== v) : l.concat(v); if (y.length) S.ayar.mealler = y; }
        kaydet(); kapat(); ciz();
      });
    };
  };
  let sureCalma = null;
  let sureAyarAcik = false;   // sûre ekranındaki ⚙️ paneli (oturum boyunca hatırlanır)
  EKRAN.sure = function (n, filtre, mod, hedef) {
    n = +n; filtre = filtre || ''; mod = mod || ''; const x = SURE(n);
    if (!x) {
      app.innerHTML = `${ust(esc(sureNoAdi(n)))}<main><p class="soluk">${t('Yükleniyor…')}</p></main>`;
      sureYukle(n).then(() => { const ek = ekranYigini[ekranYigini.length - 1]; if (ek[0] === 'sure' && +ek[1][0] === n) ciz(); })
        .catch(() => { app.querySelector('main').innerHTML = `<p class="hata">${t('Sûre açılamadı.')}</p>`; });
      return;
    }
    // Ezber artık kendi ekranında (Ezber çalış); eski bağlantılar oraya yönlenir
    if (mod === 'ezber' || mod === 'tekrar') { EZ = null; ekranYigini[ekranYigini.length - 1] = ['ezberCalis', [n, mod === 'ezber' ? 'yeni' : 'tekrar', mod === 'ezber' && +hedef ? +hedef : '']]; return ciz(); }
    const ezberModu = mod === 'ezber' || mod === 'tekrar';
    const seviye = ezberModu ? (S.ayar.gizle == null ? (mod === 'tekrar' ? 2 : 0) : S.ayar.gizle) : 0;
    const e = ezb(n);
    const mealK = (DIL === 'en' ? 'en' : 'tr') + n, mealAcik = S.ayar.meal && seviye === 0, mealVar = MEAL[mealK];
    if (mealAcik && !mealVar) { mealYukle(n).then(() => ciz()).catch(() => toast(t('Meal açılamadı.'))); }
    if (!BENZER) benzerYukle().then(() => { const ek = ekranYigini[ekranYigini.length - 1]; if (ek[0] === 'sure' && +ek[1][0] === n) ciz(); });
    const tekrar = S.ayar.tekrar || 1;
    const sayim = {}; x.ayet.forEach((_, i) => (RENK[`${n}:${i + 1}`] || []).forEach(e => { sayim[e[2]] = (sayim[e[2]] || 0) + 1; }));
    const gorunen = filtre ? x.ayet.map((_, i) => i).filter(i => (RENK[`${n}:${i + 1}`] || []).some(e => e[2] === filtre)) : x.ayet.map((_, i) => i);
    const OKU = (window.OKUNUS || {})[DIL === 'en' ? 'en' : 'tr'] || {};
    const okVar = !!OKU[`${n}:1`], okGoster = okVar && okunusAcik() && seviye === 0;
    const sayfaBas = {}; M.sayfa.forEach((r, i) => { if (r[0] === n) sayfaBas[r[1]] = i + 1; });
    const gizli = wi => seviye === 3 || (seviye === 2 && wi > 0) || (seviye === 1 && wi % 2 === 1);
    kelimeHTML.filtre = filtre || null;
    const ayetler = gorunen.map(i => {
      const a = x.ayet[i];
      const r = `${n}:${i + 1}`; let o = 0;
      const kel = a.split(' ').map((w, wi) => { const ic = kelimeHTML(r, w, o); o += w.length + 1;
        return gizli(wi) ? `<span class="kelime gizli" data-ac="${kelimeUrl(r, wi + 1)}">${ic}</span>` : `<span class="kelime" data-ses="${kelimeUrl(r, wi + 1)}">${ic}</span>`; }).join(' ');
      const bz = (BENZER || {})[r];
      const ezberli = e && e.a >= i + 1;
      return `${sayfaBas[i + 1] && !filtre ? `<div class="sayfa-ayrac">📄 ${t('Sayfa {0}', sayfaBas[i + 1])} · ${t('Cüz {0}', cuzBul(n, i + 1))}</div>` : ''}<article class="kart ayet-kart ${ezberModu && ezberli ? 'ezberli' : ''}" id="ayet-${i + 1}">
        <div class="ayet" dir="rtl" lang="ar">${kel} <span class="ayet-no">﴿${(i + 1).toLocaleString('ar-EG')}﴾</span></div>
        ${okGoster && OKU[r] ? `<p class="okunus">${esc(OKU[r])}</p>` : ''}
        ${mealAcik && mealVar && mealVar[i] ? `<p class="meal">${esc(mealVar[i])}</p>` : ''}
        <div class="sesler"><button class="sesbtn" data-ayet-cal="${i + 1}">${t('▶ Dinle')}</button>
          ${ezberModu ? `<button class="sesbtn ikincil" data-dtg="${i + 1}">${t('🔁 Dinle, tekrar et, gizle')}</button>${ezberli ? `<span class="rozet ok">✓ ${t('ezberde')}</span>` : `<button class="sesbtn" data-ezberledim="${i + 1}">${t('✓ Ezberledim')}</button>`}` : ''}
          <button class="sesbtn ikincil" data-oku="${i + 1}">🎤 ${t('Oku, kontrol et')}</button>
          ${S.ayar.mesk ? `<button class="sesbtn ikincil" data-git="mesk|${n}|${i + 1}">🎓 ${t('Meşk')}</button>` : ''}
          ${bz ? `<button class="lejant-ac" data-benzer="${i + 1}">${IKON.tekrar} ${t('{0} benzer ayet', bz.length)}</button>` : ''}</div>
        <div class="rapor-kutu" id="rapor-${i + 1}" hidden></div>
        <div class="benzer-kutu" id="benzer-${i + 1}" hidden></div>
        ${ezberModu ? '' : kayitHTML('sure' + r, ayetUrl(r))}<span hidden data-yedek="${ayetUrl(r, KARILER[0].klasor)}" data-ses="${ayetUrl(r)}"></span>
      </article>`;
    }).join('');
    kelimeHTML.filtre = null;
    const besmele = !filtre && n !== 1 && n !== 9 ? `<div class="ayet besmele" dir="rtl" lang="ar">${esc(trBesmele() || window.BESMELE || '')}</div>${okGoster && OKU.b ? `<p class="okunus ortala">${esc(OKU.b)}</p>` : ''}` : '';
    const top_ = x.ayet.length;
    const ezberUst = `<section class="kart ezber-ust">
        <div class="satir" style="justify-content:space-between"><h2 style="margin:0">${mod === 'tekrar' ? t('🔁 Ezber tekrarı') : t('🧠 Ezber modu')}</h2><button class="link" data-mod="">${t('Kapat')}</button></div>
        <p class="soluk kucukyazi">${e ? t('Ezberin: {0}/{1} ayet', e.a, top_) : t('Bu sûre ezber listende değil.')} ${e ? '' : `<button class="link" id="ezberEkleBtn">${t('Listeme ekle')}</button>`}</p>
        <p class="kucukyazi" style="margin:8px 0 4px"><b>${t('Gizle:')}</b></p>
        <div class="filtre">${[[0, t('Hiçbiri')], [1, t('Yarısı')], [2, t('İlk kelime kalsın')], [3, t('Hepsi')]].map(([v, ad]) => `<button class="${seviye === v ? 'aktif' : ''}" data-gizle="${v}">${ad}</button>`).join('')}</div>
        <p class="soluk kucukyazi">${t('Gizli kelimeye dokununca görünür ve okunur. Önce dinle, sonra tekrar et, sonra gizleyip ezberden oku.')}</p>
        ${seviye ? `<button class="lejant-ac" id="hepsiniAc">${IKON.goz} ${t('Gizlileri göster')}</button>` : ''}
        <div class="canli-kutu"><button class="btn genis" id="canliBasla">🎙️ ${t('Ezberden oku: okudukça açılsın')}</button>
          <p class="soluk kucukyazi">${t('Bütün kelimeler gizlenir; sen okudukça açılır. Okurken uyarı yok; bir ayet bitmeden değerlendirilmez.')}</p>
          <p class="kucukyazi" style="margin:4px 0"><b>${t('Hatalar:')}</b> ${[['ayet', t('Her ayet bitince')], ['son', t('En sonda')]].map(([v, ad]) => `<button class="cip ${(S.ayar.canliSonuc || 'ayet') === v ? 'aktif' : ''}" data-canli-sonuc="${v}">${ad}</button>`).join(' ')}</p></div>
        ${ogrSiniflari().length && girisli() ? `<div class="dinlet-kutu" id="dinletKutu">${dinletHTML()}</div>` : ''}
      </section>`;
    app.innerHTML = `${ust(esc(sureAdi(x)) + ' · <span class="ar" style="font-size:1.3rem">' + esc(x.ar) + '</span>')}<main>
      ${ezberModu ? ezberUst : ''}
      <section class="kart sure-ust">
        <div class="sure-cubuk"><button class="btn" id="hepsi">${t('▶ Tamamını dinle')}</button>${ezberModu ? '' : `<button class="btn ikincil" data-git="ezberCalis|${n}|yeni|">${t('🧠 Ezberle')}</button>`}
          <button class="btn ikincil sure-ayar-btn ${sureAyarAcik || filtre ? 'aktif' : ''}" id="sureAyar" aria-expanded="${!!(sureAyarAcik || filtre)}" aria-controls="sureAyarPanel" aria-label="${t('Ayarlar')}">⚙️</button></div>
        <div id="sureAyarPanel" ${sureAyarAcik || filtre ? '' : 'hidden'}>
        <p class="soluk kucukyazi" style="margin-top:10px">${t('Her ayeti kaç kez çalsın?')}</p>
        <div class="satir sola">${[1, 3, 5].map(k => `<button class="btn ${tekrar === k ? '' : 'ikincil'}" data-tekrar="${k}">${k}×</button>`).join('')}</div>
        <div class="satir sola"><button class="lejant-ac" id="lejantAc">🎨 ${t('Renklerin anlamı')}</button><button class="lejant-ac" data-git="kariSec">🎙️ ${esc(kari().ad)}</button>${okVar ? `<button class="lejant-ac ${okGoster ? 'aktif' : ''}" id="okunusAc">🔤 ${okGoster ? t('Okunuşu gizle') : t('Okunuşu göster')}</button>` : ''}<button class="lejant-ac ${S.ayar.meal ? 'aktif' : ''}" id="mealAc">📘 ${S.ayar.meal ? t('Meali gizle') : t('Meal')}</button>${ezberModu ? '' : `<button class="lejant-ac" data-git="sureTecvid|${n}|1">🧭 ${t('Ayet ayet tecvid')}</button><button class="lejant-ac" data-git="sureTest|${n}">🔍 ${t('Kural bul testi')}</button>`}</div>
        <div id="lejant" hidden>${lejantHTML()}</div>
        ${ezberModu ? '' : `<details class="kural-ara" ${filtre ? 'open' : ''}><summary>${t('Kural ara: sadece bu kuralı renklendir')}</summary>
        <div class="filtre">${LEJANT.filter(([k]) => sayim[k]).map(([k, ad]) => `<button class="${filtre === k ? 'aktif' : ''}" data-filtre="${k}"><i class="tc-${k}"></i>${esc(ad)} <small>${sayim[k]}</small></button>`).join('')}</div>
        ${filtre ? `<p style="margin-top:8px"><b>${t('{0} ayette geçiyor.', gorunen.length)}</b> <button class="link" data-filtre="">${t('Filtreyi kaldır')}</button></p>` : ''}</details>`}
        ${FS() ? `<div id="indirDurum"></div><div class="satir sola">${(() => { const l = indirListesi(kari().klasor, n), v = indirilenSay(l); return v >= l.length ? `<span class="rozet ok">${t('✓ Sesler indirildi')}</span>` : indirme ? '' : `<button class="lejant-ac" id="sureIndir">📥 ${t('Bu sûrenin seslerini indir')} (${v}/${l.length})</button>`; })()}</div>` : ''}
        ${okGoster ? `<p class="soluk kucukyazi sure-not">${t('Okunuş yaklaşık bir yazımdır; Arapça harflerin hepsini Latin harfle tam yazmak mümkün değil. Doğru okuyuşu kâriyi dinleyerek öğren.')}</p>` : ''}
        </div>
        ${mealAcik ? `<p class="soluk kucukyazi sure-not">${DIL === 'en' ? t('Meal: Saheeh International (tanzil.net).') : t('Meal: Diyanet İşleri Başkanlığı (tanzil.net). Meal, ayetin anlamını anlamaya yardım eder; Kur\'an\'ın kendisi Arapça metindir.')}</p>` : ''}
      </section>
      ${besmele}${ayetler}
      ${mod === 'tekrar' && e ? `<button class="btn genis" id="tekrarEttim">${t('✓ Tekrar ettim')}</button>` : ''}
    </main>${ezberModu ? `<div class="canli-bar" id="canliBar" hidden>${canliBarHTML()}</div>` : ''}`;
    if (CANLI) canliDurdur(true);
    const durdur = () => { if (sureCalma) { sureCalma.iptal = true; sureCalma = null; } if (ses) { ses.pause(); ses._iptal = true; ses = null; } dugmeBirak(); document.querySelectorAll('.ayet-kart.caliyor-ayet').forEach(e => e.classList.remove('caliyor-ayet')); };
    function calSira(baslangic, bitis, secili, bitince) {
      durdur(); const is = { iptal: false }; sureCalma = is;
      const liste = []; for (const i of (secili || Array.from({ length: bitis - baslangic + 1 }, (_, j) => baslangic + j))) for (let k = 0; k < tekrar; k++) liste.push(i);
      let j = 0;
      const sonraki = () => {
        if (is.iptal) return;
        document.querySelectorAll('.ayet-kart.caliyor-ayet').forEach(e => e.classList.remove('caliyor-ayet'));
        if (j >= liste.length) { sureCalma = null; dugmeBirak(); $('#hepsi') && ($('#hepsi').textContent = t('▶ Tamamını dinle')); bitince && bitince(); return; }
        const i = liste[j++]; const kart = document.getElementById('ayet-' + i); kart && kart.classList.add('caliyor-ayet'); kart && kart.scrollIntoView({ behavior: 'smooth', block: 'center' });
        ses = new Audio(sesKaynak(ayetUrl(`${n}:${i}`))); ses.playbackRate = S.ayar.hiz || 1;
        ses.onended = () => setTimeout(sonraki, 500);
        ses.onerror = () => { durdur(); toast(t('Ses çalınamadı. İnternet bağlantını kontrol et.')); };
        ses.play().catch(() => durdur());
      };
      sonraki();
    }
    const yeniArg = (degis) => { const a = { n, filtre, mod, hedef: '' }; Object.assign(a, degis); return [a.n, a.filtre, a.mod, a.hedef]; };
    const yenile = degis => { durdur(); ekranYigini[ekranYigini.length - 1] = ['sure', yeniArg(degis)]; ciz(); };
    $('#hepsi').onclick = () => { if (sureCalma) { durdur(); $('#hepsi').textContent = t('▶ Tamamını dinle'); return; } $('#hepsi').textContent = t('⏹ Durdur'); calSira(1, x.ayet.length, gorunen.map(i => i + 1)); S.sure = S.sure || {}; S.sure[n] = Object.assign({}, S.sure[n], { dinlendi: Date.now() }); kaydet(); };
    app.querySelectorAll('[data-ayet-cal]').forEach(b => b.onclick = () => { if (b === calanDugme) { durdur(); return; } const i = +b.dataset.ayetCal; calSira(i, i); dugmeCaliyor(b, () => { if (sureCalma) { sureCalma.iptal = true; sureCalma = null; } }); });
    app.querySelectorAll('[data-tekrar]').forEach(b => b.onclick = () => { S.ayar.tekrar = +b.dataset.tekrar; kaydet(); yenile({}); });
    const la = $('#lejantAc'); la.onclick = () => { const l = $('#lejant'); l.hidden = !l.hidden; };
    $('#sureAyar').onclick = ev => { const pn = $('#sureAyarPanel'); pn.hidden = !pn.hidden; sureAyarAcik = !pn.hidden; ev.currentTarget.classList.toggle('aktif', sureAyarAcik); ev.currentTarget.setAttribute('aria-expanded', sureAyarAcik); };
    app.querySelectorAll('[data-filtre]').forEach(b => b.onclick = () => { const f = b.dataset.filtre; yenile({ filtre: f === filtre ? '' : f }); });
    app.querySelectorAll('[data-mod]').forEach(b => b.onclick = () => yenile({ mod: b.dataset.mod }));
    app.querySelectorAll('[data-gizle]').forEach(b => b.onclick = () => { S.ayar.gizle = +b.dataset.gizle; kaydet(); yenile({}); });
    const ha = $('#hepsiniAc'); if (ha) ha.onclick = () => app.querySelectorAll('.kelime.gizli').forEach(acKelime);
    function acKelime(k) { k.classList.remove('gizli'); k.dataset.ses = k.dataset.ac; delete k.dataset.ac; }
    app.querySelectorAll('.kelime.gizli').forEach(k => k.onclick = ev => { if (!k.classList.contains('gizli')) return; ev.stopPropagation(); acKelime(k); });
    app.querySelectorAll('[data-dtg]').forEach(b => b.onclick = () => {
      const i = +b.dataset.dtg; const kart = document.getElementById('ayet-' + i);
      kart.querySelectorAll('.kelime.gizli').forEach(acKelime);
      toast(t('Dinle ve içinden tekrar et ({0}×). Sonra ayet gizlenecek; ezberden oku.', tekrar));
      calSira(i, i, null, () => { kart.querySelectorAll('.ayet .kelime').forEach(k => { if (k.dataset.ses) { k.dataset.ac = k.dataset.ses; delete k.dataset.ses; } k.classList.add('gizli'); k.onclick = ev => { if (!k.classList.contains('gizli')) return; ev.stopPropagation(); acKelime(k); }; }); toast(t('Şimdi ezberden oku. Takılırsan kelimeye dokun.')); });
    });
    app.querySelectorAll('[data-ezberledim]').forEach(b => b.onclick = () => { ezberIsaretle(n, +b.dataset.ezberledim); yenile({ hedef: +b.dataset.ezberledim + 1 }); });
    const eb = $('#ezberEkleBtn'); if (eb) eb.onclick = () => { ezberEkle(n); yenile({}); };
    const cb = $('#canliBasla'); if (cb) cb.onclick = () => { if (CANLI) return; canliBarSifirla(); canliBaslat(n, +hedef || 1); };
    const cd = $('#canliDur'); if (cd) cd.onclick = () => canliDurdur();
    app.querySelectorAll('[data-canli-sonuc]').forEach(b => b.onclick = () => { S.ayar.canliSonuc = b.dataset.canliSonuc; kaydet(); app.querySelectorAll('[data-canli-sonuc]').forEach(x => x.classList.toggle('aktif', x === b)); });
    dinletBagla(n, e ? Math.max(1, e.a) : x.ayet.length);
    okumaBagla(n);
    const te = $('#tekrarEttim'); if (te) te.onclick = () => { tekrarEttim(n); toast(t('Tekrar kaydedildi ✓')); geri(); };
    app.querySelectorAll('[data-benzer]').forEach(b => b.onclick = async () => {
      const i = +b.dataset.benzer, kutu = document.getElementById('benzer-' + i);
      if (!kutu.hidden) { kutu.hidden = true; return; }
      const l = (BENZER || {})[`${n}:${i}`] || [];
      await Promise.all(benzersiz(l.map(r => r[0])).map(m => sureYukle(m).catch(() => null)));
      kutu.innerHTML = `<p class="soluk kucukyazi">${t('Farklı kelimeler işaretli. Hafızlar bu ayetleri sık karıştırır.')}</p>` + l.map(([m, a2]) => { const y = SURE(m); if (!y) return ''; return `<div class="benzer-ayet"><button class="link" data-git="sure|${m}||${mod}|${a2}">${esc(sureAdi(y))} ${a2}</button><div class="ayet" dir="rtl" lang="ar">${farkHTML(x.ayet[i - 1], y.ayet[a2 - 1])}</div></div>`; }).join('');
      kutu.hidden = false;
    });
    const oa = $('#okunusAc'); if (oa) oa.onclick = () => { S.ayar.okunus = !okunusAcik(); kaydet(); yenile({}); };
    $('#mealAc').onclick = () => { S.ayar.meal = !S.ayar.meal; kaydet(); yenile({}); };
    const si = $('#sureIndir'); if (si) si.onclick = () => { indirBaslat(indirListesi(kari().klasor, n), sureAdi(x) + ':'); si.remove(); };
    indirmeGoster();
    if (hedef) { const k = document.getElementById('ayet-' + hedef); if (k) setTimeout(() => k.scrollIntoView({ block: 'center' }), 50); }
  };
  EKRAN.sureTest = function (n) {
    ekranYigini.pop(); n = +n; const x = SURE(n);
    const havuz = [];
    x.ayet.forEach((_, i) => (RENK[`${n}:${i + 1}`] || []).forEach((e, j) => { if (e[2] !== 's') havuz.push(`k:${n}:${i + 1}:${j}`); }));
    // aynı kuraldan çok soru gelmesin: kurala göre dağıt
    const gruplar = {}; havuz.forEach(k => { const [, , a, j] = k.split(':'); const c = RENK[`${n}:${a}`][+j][2]; (gruplar[c] = gruplar[c] || []).push(k); });
    const secilen = []; const listeler = Object.values(gruplar).map(karistir);
    while (secilen.length < 10 && listeler.some(l => l.length)) listeler.forEach(l => { if (l.length && secilen.length < 10) secilen.push(l.pop()); });
    oturumBaslat({ tur: 'sure', id: null, sure: n, kimlik: 'sure|' + n, baslik: t('Kural bul: {0}', sureAdi(x)), anahtarlar: karistir(secilen), puanli: true });
  };

  // Kâri (hoca sesi): tek ekran, iki sekme — Listeden seç | Sesime göre bul (karar: toplanti-2026-11-19-arayuz-sadelestirme.md)
  const KARI_ACIK = new Set();   // açık gruplar (oturum boyunca)
  const kariUst = (sekme) => {
    const k = kari();
    return `<section class="kart kari-secili"><p class="soluk kucukyazi" style="margin:0">${t('Seçili kâri')}</p>
        <div class="kari-secili-ic"><div><b>${esc(k.ad)}</b><small class="soluk">${esc(k.tur)}${k.makam ? ' · ' + esc(k.makam) : ''}</small></div><button class="sesbtn" data-ses="${ayetUrl('1:2', k.klasor)}">▶ ${t('Örnek')}</button></div></section>
      ${cocukMu() ? '' : `<div class="sekmeler kari-sekme" role="tablist"><button class="${sekme === 'liste' ? 'aktif' : ''}" data-kari-sekme="liste" role="tab" aria-selected="${sekme === 'liste'}">${t('Listeden seç')}</button><button class="${sekme === 'bul' ? 'aktif' : ''}" data-kari-sekme="bul" role="tab" aria-selected="${sekme === 'bul'}">${IKON.ara} ${t('Sesime göre bul')}</button></div>`}`;
  };
  const kariSekmeBagla = () => { kuranSekmeBagla(); app.querySelectorAll('[data-kari-sekme]').forEach(b => b.onclick = () => { ekranYigini[ekranYigini.length - 1] = [KARI_SEKMEDE ? 'kuranDinle' : 'kariSec', [b.dataset.kariSekme]]; ciz(); }); };
  let KARI_SEKMEDE = false;   // Kur'an › Dinle sekmesi olarak mı açıldı
  EKRAN.kariSec = function (sekme, kuranSekmesi) {
    KARI_SEKMEDE = !!kuranSekmesi && kokEkran();
    sekme = sekme === 'bul' && !cocukMu() ? 'bul' : 'liste';
    if (sekme === 'bul') return EKRAN.hocamiBul(true);
    const ornek = '1:2', secili = kari();
    const gruplar = benzersiz(KARILER.map(k => k.tur));
    if (!KARI_ACIK.size) KARI_ACIK.add(secili.tur);
    app.innerHTML = `${KARI_SEKMEDE ? ust(t('Kur\'an')) : ust(t('Kâri (hoca sesi)'))}<main>${KARI_SEKMEDE ? kuranSekme('kuranDinle') : ''}
      ${kariUst('liste')}
      <div class="form"><input id="kariAra" type="search" placeholder="${t('Kâri ara')}" aria-label="${t('Kâri ara')}"></div>
      ${gruplar.map(tur => { const l = KARILER.filter(k => k.tur === tur); return `<details class="kart kari-grup" data-tur="${esc(tur)}" ${KARI_ACIK.has(tur) ? 'open' : ''}><summary><b>${esc(tur)}</b><span class="soluk kucukyazi">${l.length}</span></summary>
        <div class="secenek-liste">${l.map(k => `<button class="${k.id === secili.id ? 'aktif' : ''}" data-kari="${k.id}" data-ara="${esc(trSade(k.ad + ' ' + k.tur + ' ' + (k.makam || '')))}"><span>${esc(k.ad)}<small>${esc(k.makam ? k.makam : k.tur)}</small></span>
          <span class="sesbtn ikincil" data-ses="${ayetUrl(ornek, k.klasor)}" aria-label="${t('Dinle')}">▶</span></button>`).join('')}</div></details>`; }).join('')}
      <p class="soluk kucukyazi">${t('Dinlemek için ▶\'ye, seçmek için isme dokun.')} ${t('Sesler everyayah.com arşivinden internet üzerinden çalınır. Kelime kelime dinleme her kâri için Quran.com kaydıyla yapılır.')} ${t('Türk hafızların kayıtları Diyanet İşleri Başkanlığı Kur\'an portalındandır.')}</p></main>`;
    kariSekmeBagla();
    app.querySelectorAll('.kari-grup').forEach(d => d.addEventListener('toggle', () => { if (d.open) KARI_ACIK.add(d.dataset.tur); else KARI_ACIK.delete(d.dataset.tur); }));
    $('#kariAra').oninput = e => { const q = trSade(e.target.value.trim());
      app.querySelectorAll('.kari-grup').forEach(d => { let var_ = 0; d.querySelectorAll('[data-ara]').forEach(b => { const g = !q || b.dataset.ara.includes(q); b.hidden = !g; if (g) var_++; }); d.hidden = !var_; if (q) d.open = true; }); };
    app.querySelectorAll('[data-kari]').forEach(b => b.onclick = e => {
      if (e.target.closest('[data-ses]')) return;
      S.ayar.kari = b.dataset.kari; kaydet(); toast(t('Kâri seçildi: ') + kari().ad); ciz();
    });
  };

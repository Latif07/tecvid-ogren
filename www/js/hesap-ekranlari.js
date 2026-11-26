/* Kur'an Yolum — Hocamı bul, hatırlatma, hoş geldin, seviye tespiti, profiller, ilerleme tablosu, meşk */
/* app.js bölündü: bu dosyalar sırayla yüklenir, aynı genel kapsamı paylaşır (bkz. TODO.md). */
'use strict';
  // ------------------------------------------------------------ Hocamı bul (karar: claude/toplanti-2026-11-18-kuran-okuma-ve-hocami-bul.md)
  // Kullanıcı Fâtiha'yı okur; perde (oktavdan bağımsız), ses aralığı ve okuma süresi telefonda ölçülür, kârilerin aynı
  // ölçüleriyle (data/kari-ses.json, tools/kari-ses.js) karşılaştırılır. Ses kaydı saklanmaz, gönderilmez; yalnız 3 sayı kalır.
  let HB_KAYIT = null, HB_VERI = null;
  function hbYukle() {
    const js = window.HocaBul ? Promise.resolve() : new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'js/hocabul.js'; s.onload = ok; s.onerror = () => no(new Error(t('Yüklenemedi. İnternet bağlantını kontrol et.'))); document.head.appendChild(s); });
    const veri = HB_VERI ? Promise.resolve(HB_VERI) : fetch('data/kari-ses.json').then(r => { if (!r.ok) throw new Error(t('Kâri bilgisi yüklenemedi.')); return r.json(); }).then(j => (HB_VERI = j));
    return Promise.all([js, veri]);
  }
  async function hbCoz(blob) {   // kayıt → 16 kHz mono
    const AC = window.AudioContext || window.webkitAudioContext, ac = new AC(), buf = await blob.arrayBuffer();
    const ab = await new Promise((ok, no) => { const p = ac.decodeAudioData(buf, ok, no); if (p && p.then) p.then(ok, no); }); try { ac.close(); } catch (e) { }
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext, oac = new OAC(1, Math.max(1, Math.ceil(ab.duration * 16000)), 16000);
    const src = oac.createBufferSource(); src.buffer = ab; src.connect(oac.destination); src.start(); return (await oac.startRendering()).getChannelData(0);
  }
  function hbSonuclar(u, mucevved) {
    const v = (HB_VERI && HB_VERI.kariler) || {};
    // Öğretim kayıtlarında kârinin arasında tekrar eden sesler olabilir; ölçü karışmasın diye karşılaştırmaya katılmaz
    const prof = KARILER.filter(k => v[k.id] && !['husary_muallim', 'minshawy_teacher'].includes(k.id) && (mucevved || !/mujawwad/i.test(k.id))).map(k => Object.assign({ id: k.id }, v[k.id]));
    const hepsi = window.HocaBul.enYakin(u, prof, prof.length), l = [], adlar = new Set();
    for (const x of hepsi) { const k = KARILER.find(y => y.id === x.kari.id); if (adlar.has(k.ad)) continue; adlar.add(k.ad); l.push(Object.assign({ k }, x)); if (l.length === 3) break; }
    return l;
  }
  function hbAciklama(x) {
    const p = Math.abs(x.perdeFark), l = [];
    l.push(p < 1 ? t('Perden çok yakın') : p < 2.5 ? t('Perden yakın') : x.perdeFark > 0 ? t('Senin perden biraz daha tiz') : t('Senin perden biraz daha pes'));
    if (x.oktav) l.push(x.oktav > 0 ? t('sesin bir oktav tiz; bu doğal, aynı perdede okursun') : t('sesin bir oktav pes; bu doğal, aynı perdede okursun'));
    const h = x.hizOran; l.push(h > 0.87 && h < 1.15 ? t('hızın benzer') : h >= 1.15 ? t('o senden yavaş okuyor') : t('o senden hızlı okuyor'));
    if (Math.abs(x.aralikFark) >= 3) l.push(x.aralikFark > 0 ? t('sesin daha çok iniş çıkış yapıyor') : t('onun sesi daha çok iniş çıkış yapıyor'));
    return l.join(' · ');
  }
  EKRAN.hocamiBul = function (kariEkrani) {
    // Artık Kâri ekranının "Sesime göre bul" sekmesi; eski bağlantılar da oraya gider
    if (!kariEkrani) { KARI_SEKMEDE = false; ekranYigini[ekranYigini.length - 1] = ['kariSec', ['bul']]; return ciz(); }
    const son = S.hocaBul, mucevved = !!(S.ayar.hbMucevved);
    app.innerHTML = `${KARI_SEKMEDE ? ust(t('Kur\'an')) : ust(t('Kâri (hoca sesi)'))}<main>${KARI_SEKMEDE ? kuranSekme('kuranDinle') : ''}${kariUst('bul')}
      <article class="kart"><p>${t('Fâtiha\'yı baştan sona oku; sesinin perdesine ve okuma hızına en yakın 3 kâriyi bulalım. Kendi perdende okuyan bir kâriyi dinleyip taklit etmek daha kolaydır.')}</p>
        <p class="soluk kucukyazi">${t('Bu öneri yalnız sesin perdesine ve hızına göredir; okuyuşun ya da kârinin güzelliği hakkında bir hüküm değildir.')}</p>
        <p class="soluk kucukyazi">🔒 ${t('Kaydın telefonda ölçülür, hiçbir yere gönderilmez ve saklanmaz.')}</p></article>
      <article class="kart"><div class="ayet hb-fatiha" dir="rtl" lang="ar" id="hbMetin"><span class="soluk">${t('Yükleniyor…')}</span></div>
        <div class="satir"><button class="btn genis" id="hbOku">🎤 ${son ? t('Tekrar oku') : t('Okumaya başla')}</button></div>
        <p class="soluk kucukyazi ortala" id="hbDurum">${t('Sessiz bir yerde, her zamanki sesinle oku. Bitince "Bitir"e dokun.')}</p></article>
      <div id="hbSonuc"></div>
      <label class="hb-secenek"><input type="checkbox" id="hbMuc" ${mucevved ? 'checked' : ''}> ${t('Mücevved (makamlı) kayıtları da kat')}</label>
    </main>`;
    kariSekmeBagla();
    const metin = () => { const x = SURE(1); if (!x) return; const yer = $('#hbMetin'); if (yer) yer.innerHTML = x.ayet.map((a, i) => `${esc(a)} <span class="ayet-no">﴿${(i + 1).toLocaleString('ar-EG')}﴾</span>`).join(' '); };
    if (SURE(1)) metin(); else sureYukle(1).then(metin).catch(() => { });
    const goster = () => {
      const yer = $('#hbSonuc'); if (!yer || !S.hocaBul) return;
      hbYukle().then(() => {
        const u = S.hocaBul, l = hbSonuclar(u, !!S.ayar.hbMucevved);
        if (!l.length) { yer.innerHTML = `<p class="hata">${t('Kâri bilgisi yüklenemedi.')}</p>`; return; }
        yer.innerHTML = `<h2 class="baslik">${t('Sesine en yakın 3 kâri')}</h2>
          ${l.map(x => `<article class="kart hb-kari"><div class="hb-kari-ust"><div><b>${esc(x.k.ad)}</b><small class="soluk">${esc(x.k.tur)}</small></div>${x.k.id === kari().id ? `<span class="rozet ok">✓ ${t('Kârin')}</span>` : ''}</div>
            <p class="hb-neden">${hbAciklama(x)}</p>
            <div class="satir sola"><button class="btn ikincil" data-hb-dinle="${x.k.id}">▶ ${t('Dinle')}</button>${x.k.id === kari().id ? '' : `<button class="btn" data-hb-sec="${x.k.id}">${t('Bunu kârim yap')}</button>`}</div></article>`).join('')}
          <p class="soluk kucukyazi">${t('Senin ölçülerin: ortanca perde yaklaşık {0} Hz · Fâtiha\'yı {1} sn\'de okudun (duraklar hariç).', u.hz, Math.round(u.sure))}</p>`;
        yer.querySelectorAll('[data-hb-dinle]').forEach(b => b.onclick = () => { const k = KARILER.find(y => y.id === b.dataset.hbDinle); cal(ayetUrl('1:2', k.klasor), b); });
        yer.querySelectorAll('[data-hb-sec]').forEach(b => b.onclick = () => { S.ayar.kari = b.dataset.hbSec; kaydet(); toast(t('Kâri seçildi: ') + kari().ad); ciz(); });
      }).catch(e => { yer.innerHTML = `<p class="hata">${esc(e.message)}</p>`; });
    };
    hbYukle().catch(() => { }); goster();
    $('#hbMuc').onchange = e => { S.ayar.hbMucevved = e.target.checked; kaydet(); goster(); };
    $('#hbOku').onclick = async ev => {
      const btn = ev.currentTarget, durum = $('#hbDurum');
      if (HB_KAYIT) { HB_KAYIT.stop(); return; }
      if (!navigator.mediaDevices || !window.MediaRecorder) return toast(t('Bu cihazda ses kaydı desteklenmiyor.'));
      hbYukle().catch(() => { });
      let akis; try { akis = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 } }); } catch (e) { return toast(t('Mikrofon izni verilmedi. Telefon ayarlarından Kur\'an Yolum için mikrofon iznini aç.')); }
      const parca = [], rec = new MediaRecorder(akis); HB_KAYIT = rec; const bas = Date.now();
      btn.textContent = '⏹ ' + t('Bitir'); btn.classList.add('kirmizi-btn', 'kaydediyor'); durum.textContent = t('🎙️ Dinliyorum… Fâtiha\'yı oku, bitince "Bitir"e dokun.');
      const z = setTimeout(() => rec.state !== 'inactive' && rec.stop(), 120000);
      rec.ondataavailable = e => { if (e.data && e.data.size) parca.push(e.data); };
      rec.onstop = async () => {
        clearTimeout(z); akis.getTracks().forEach(x => x.stop()); HB_KAYIT = null;
        btn.textContent = '🎤 ' + t('Tekrar oku'); btn.classList.remove('kirmizi-btn', 'kaydediyor');
        if (!document.body.contains(durum)) return;
        if (Date.now() - bas < 8000) { durum.textContent = t('Çok kısa oldu. Fâtiha\'nın tamamını, yedi ayeti oku.'); return; }
        durum.textContent = t('Sesin ölçülüyor…');
        try {
          await hbYukle(); const ses = await hbCoz(new Blob(parca, { type: rec.mimeType || 'audio/webm' }));
          await new Promise(r => setTimeout(r, 30));
          const o = window.HocaBul.ozellik(ses);
          if (!o) { durum.textContent = t('Sesin net duyulamadı. Telefonu biraz yaklaştırıp sessiz bir yerde tekrar dene.'); return; }
          const kSure = Object.values(HB_VERI.kariler).map(x => x.sure).sort((a, b) => a - b), enKisa = kSure[0] || 20;
          if (o.sure < enKisa * 0.55) { durum.textContent = t('Fâtiha\'nın tamamını okumamışsın gibi görünüyor. Hızı doğru ölçmek için yedi ayetin hepsini oku.'); return; }
          S.hocaBul = { perde: o.perde, aralik: o.aralik, sure: o.sure, hz: o.hz, t: simdi() }; kaydet();
          durum.textContent = t('Sessiz bir yerde, her zamanki sesinle oku. Bitince "Bitir"e dokun.'); goster();
          setTimeout(() => { const y = $('#hbSonuc'); if (y) y.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 200);
        } catch (e) { durum.textContent = e.message || t('Ölçülemedi.'); }
      };
      rec.start();
    };
  };

  // Google ile girişte profil resmi (yalnız büyük profilleri; çocuk modunda maskot kalır)
  const hesapResmi = (k, harf) => k && k.photoURL ? `<img class="hesap-resim" src="${esc(k.photoURL)}" alt="" referrerpolicy="no-referrer" onerror="this.replaceWith(document.createTextNode('${esc((harf || '?').replace(/'/g, ''))}'))">` : esc(harf || '?');
  EKRAN.profil = function () {
    const k = B() && B().kullanici();
    const gecilen = U.filter(u => gecti(u.id)).length;
    const ezb = Object.values(S.ezber || {}).filter(e => e.tam).length;
    const ad = AKTIF().ad || (k ? (k.displayName || k.email || '') : t('Misafir'));
    const satir = (git_, baslik, alt) => `<button class="ben-satir" data-git="${git_}"><span class="bad"><b>${baslik}</b>${alt ? `<small>${alt}</small>` : ''}</span>${IKON.ok}</button>`;
    const ayar = (bol, ik, baslik, ozet) => `<button class="ben-satir" data-ayar-ac="${bol}"><span class="ben-ik">${IKON[ik]}</span><span class="bad"><b>${baslik}</b></span><small class="ben-ozet">${ozet}</small>${IKON.ok}</button>`;
    const tema = S.ayar.tema || 'sistem';
    app.innerHTML = `${ust(t('Ben'))}<main>
      <section class="ben-ust"><div class="avatar">${hesapResmi(cocukMu() ? null : k, (ad || '?')[0].toUpperCase())}</div>
        <div><h2>${esc(ad)}</h2><p class="soluk">${k ? t('Hesaba giriş yapıldı · ilerleme yedekleniyor') : t('Verilerin sadece bu telefonda')}</p></div></section>
      <div class="istatler kart"><div><b>${gecilen}/${U.length}</b><small>${t('bölüm')}</small></div><div><b>${S.gecmis.length}</b><small>${t('test')}</small></div><div><b>${ezb}</b><small>${t('ezber sûre')}</small></div><div><b>${S.seri.gun || 0}</b><small>${t('gün seri')}</small></div></div>
      <section class="kart ben-grup">
        ${cocukMu() ? '' : satir('ilerleme', t('İlerleme tablosu'), t('Bölümler, etkinlik, güçlü ve zayıf konular'))}
        ${satir('okumaRaporu', t('Okuma raporu'), t('Okuyuşundaki hatalar ve gelişimin'))}
        ${cocukMu() ? '' : satir('seviyeTespit', t('Seviyeni yeniden belirle'), t('Kısa test; bildiğin bölümleri atla'))}
        ${S.ayar.mesk ? satir('meskSec', t('Meşk'), t('Hoca okur, sen tekrar edersin')) : ''}
        ${satir('sinif', t('Sınıf (hoca–öğrenci)'), ogrSiniflari().length ? ogrSiniflari().map(c => esc(c.sinifAd || c.kod)).join(', ') : t('Katıl ya da sınıf aç'))}
      </section>
      <section class="kart ben-grup">
        ${satir('profiller', t('Profiller ve çocuk modu'), t('{0} profil · şu an: {1}', PR.liste.length, esc(AKTIF().ad || t('Profil 1')) + ' (' + (YAS_AD[AKTIF().yas] || '—') + ')'))}
        ${PR.liste.some(p => p.yas === 'kucuk' || p.yas === 'cocuk') ? satir('ebeveynOzet', t('Çocuk özeti'), t('Haftalık çalışma, yıldızlar, karıştırılan harfler')) : ''}
        ${satir('hesap', k ? t('Hesabım') : t('Giriş yap / Hesap aç'), k ? esc(k.email || '') : t('İlerlemen kaybolmasın'))}
      </section>
      <h2 class="ben-baslik">${t('Ayarlar')}</h2>
      <section class="kart ben-grup">
        ${ayar('g', 'gorunum', t('Görünüm'), esc(({ sistem: t('Telefona göre'), acik: t('Açık'), koyu: t('Koyu') })[tema] || ''))}
        ${ayar('s', 'ses', t('Ses, kâri ve meşk'), esc(kari().ad.split(' ').slice(-1)[0]) + ' · ' + (S.ayar.hiz || 1) + '×')}
        ${ayar('h', 'zil', t('Hatırlatma'), (S.ayar.hatirlat || {}).acik ? esc(S.ayar.hatirlat.saat || '') : t('Kapalı'))}
        ${ayar('d', 'dil', t('Dil / Language'), DIL === 'en' ? 'English' : 'Türkçe')}
        ${ayar('y', 'bulut', t('Hesap ve yedek'), '')}
      </section>
      <p class="ben-dip soluk kucukyazi"><button class="link" data-git="yenilikler">${t('Yenilikler')}</button>${yuklenebilir() ? ` · <button class="link" id="profilYukle">${t('Uygulama olarak yükle')}</button>` : ''}${FS() ? ` · <button class="link" data-git="indir">${t('İnternetsiz ses')}</button>` : ''} · ${esc(surumYazi())}</p>
    </main>`;
    const pyk = $('#profilYukle'); if (pyk) pyk.onclick = pwaYukle;
    app.querySelectorAll('[data-ayar-ac]').forEach(b => b.onclick = () => { AYAR_ACIK.clear(); AYAR_ACIK.add(b.dataset.ayarAc); git('ayarlar'); });
  };

  const AYAR_ACIK = new Set();   // Ayarlar'da açık bölümler (ekran yeniden çizilince kapanmasın)
  EKRAN.ayarlar = function () {
    const yedek = JSON.stringify(S);
    const hk = B() && B().kullanici();
    const tema = S.ayar.tema || 'sistem';
    const hat = S.ayar.hatirlat || { acik: false, saat: '20:00' };
    app.innerHTML = `${ust(t('Ayarlar'))}<main>
      <details class="kart ayar-bolum" data-bol="g"><summary><span class="ayar-ik">${IKON.gorunum}</span><span class="ayar-bas"><b>${t('Görünüm')}</b><small>${esc([({ sistem: t('Telefona göre'), acik: t('Açık'), koyu: t('Koyu') })[tema] || '', (S.ayar.yazim || 'tr') === 'tr' ? t('Türkiye mushafı') : t('Medine mushafı')].join(' · '))}</small></span></summary>
        <div class="ayar-govde">
        <p><b>${t('Tema')}</b></p>
        <div class="satir sola">${[['sistem', t('Telefona göre')], ['acik', t('☀️ Açık')], ['koyu', t('🌙 Koyu')]].map(([v, ad]) => `<button class="btn ${tema === v ? '' : 'ikincil'}" data-tema="${v}">${ad}</button>`).join('')}</div>
        <p style="margin-top:16px"><b>${t('Renk')}</b></p>
        <div class="renkler">${[['yesil', '#0f5a47', t('Yeşil')], ['lacivert', '#1d3f72', t('Lacivert')], ['bordo', '#7a1f2b', t('Bordo')], ['mor', '#4b2a7a', t('Mor')], ['sepya', '#6b4423', t('Sepya')], ['kalem', 'linear-gradient(135deg,#f7f0e4 0 45%,#6e2a3a 45%)', t('Krem-bordo')]].map(([v, c, ad]) => `<button class="${(S.ayar.renk || 'yesil') === v ? 'aktif' : ''}" data-renk="${v}" style="background:${c}" title="${ad}" aria-label="${ad}">${(S.ayar.renk || 'yesil') === v ? '✓' : ''}</button>`).join('')}</div>
        <p style="margin-top:16px"><b>${t('Yazı boyutu')}</b></p>
        <div class="satir sola">${[[0.9, 'A−'], [1, 'A'], [1.15, 'A+'], [1.3, 'A++']].map(([v, ad]) => `<button class="btn ${(S.ayar.yazi || 1) === v ? '' : 'ikincil'}" data-yazi="${v}">${ad}</button>`).join('')}</div>
        <p style="margin-top:12px"><b>${t('Görünüm kolaylığı')}</b></p>
        <div class="satir sola"><button class="btn ${S.ayar.yuksekKontrast ? '' : 'ikincil'}" id="ayKontrast" aria-pressed="${!!S.ayar.yuksekKontrast}">${t('Yüksek kontrast')}</button><button class="btn ${S.ayar.hareketAzalt ? '' : 'ikincil'}" id="ayHareket" aria-pressed="${!!S.ayar.hareketAzalt}">${t('Hareketi azalt')}</button></div>
        <p style="margin-top:12px"><b>${t('Arapça yazı boyutu')}</b></p>
        <div class="satir sola">${[[0.85, '−'], [1, ''], [1.2, '+'], [1.4, '++']].map(([v, ek]) => `<button class="btn ${(S.ayar.arYazi || 1) === v ? '' : 'ikincil'}" data-aryazi="${v}"><span class="ar" style="font-size:1.2em;line-height:1">ع</span>${ek}</button>`).join('')}</div>
        <p style="margin-top:16px"><b>${t('Mushaf yazımı')}</b></p>
        <p class="soluk">${t('Türkiye: Diyanet mushafındaki gibi (med işaretleri, esre-i memdûde, durak işaretleri). Medine: Medine mushafı yazımı.')}</p>
        <div class="satir sola">${[['tr', t('Türkiye (Diyanet)')], ['medine', t('Medine')]].map(([v, ad]) => `<button class="btn ${(S.ayar.yazim || 'tr') === v ? '' : 'ikincil'}" data-yazim="${v}">${ad}</button>`).join('')}</div>
        <p style="margin-top:16px"><b>${t('Renkli tecvid yazısı')}</b></p>
        <p class="soluk">${t('Örnek ayetlerde her tecvid kuralı kendi rengiyle gösterilir. Testlerde renkler cevabı ele vermesin diye cevaptan sonra görünür.')}</p>
        <div class="satir sola"><button class="btn ${S.ayar.renkli ? '' : 'ikincil'}" data-renkli="1">${t('Açık')}</button><button class="btn ${S.ayar.renkli ? 'ikincil' : ''}" data-renkli="0">${t('Kapalı')}</button></div>
        <div class="ayet" dir="rtl" lang="ar" style="margin-top:12px">${['109:3', '96:2'].map(r => kelimeHTMLtam(r)).join(' ۝ ')}</div>
        ${lejantHTML()}<p style="margin-top:16px"><b>${t('Günün sorusu (ana sayfa)')}</b></p><p class="soluk">${t('Ana sayfada her gün bir soru. Kapatırsan ana sayfada görünmez.')}</p>
        <div class="satir sola"><button class="btn ${S.ayar.gsGizle ? 'ikincil' : ''}" data-gsgiz="0">${t('Göster')}</button><button class="btn ${S.ayar.gsGizle ? '' : 'ikincil'}" data-gsgiz="1">${t('Gizle')}</button></div></div></details>
      <details class="kart ayar-bolum" data-bol="s"><summary><span class="ayar-ik">${IKON.ses}</span><span class="ayar-bas"><b>${t('Ses, kâri ve meşk')}</b><small>${esc(kari().ad)} · ${S.ayar.hiz || 1}×</small></span></summary>
        <div class="ayar-govde"><p>${esc(kari().ad)} · <span class="soluk">${esc(kari().tur)}</span></p>
        <div class="satir sola"><button class="btn" data-git="kariSec">${t('Kâri seç')}</button>${FS() ? `<button class="btn ikincil" data-git="indir">${t('📥 İnternetsiz ses')}</button>` : ''}</div><p style="margin-top:16px"><b>${t('Ses hızı')}</b></p>
        <div class="satir sola">${[0.75, 1, 1.25].map(h => `<button class="btn ${S.ayar.hiz === h ? '' : 'ikincil'}" data-hiz="${h}">${h}×</button>`).join('')}</div><p style="margin-top:16px"><b>${t('Meşk modu')}</b></p>
        <p class="soluk">${t('Geleneksel meşk usulü: kâri ayeti parça parça okur, sen tekrar edersin, okuyuşun incelenir. Açınca Kur\'an sekmesindeki ayetlerde ve Profil\'de görünür.')}</p>
        <div class="satir sola"><button class="btn ${S.ayar.mesk ? '' : 'ikincil'}" data-mesk="1">${t('Açık')}</button><button class="btn ${S.ayar.mesk ? 'ikincil' : ''}" data-mesk="0">${t('Kapalı')}</button></div>
        ${S.ayar.mesk ? `<p style="margin-top:12px"><b>${t('Her parça kaç kez doğru okunsun?')}</b></p><div class="satir sola">${[1, 3, 5].map(v => `<button class="btn ${(S.ayar.meskTekrar || 3) === v ? '' : 'ikincil'}" data-mtekrar="${v}">${v}</button>`).join('')}</div>` : ''}</div></details>
      <details class="kart ayar-bolum" data-bol="h"><summary><span class="ayar-ik">${IKON.zil}</span><span class="ayar-bas"><b>${t('Hatırlatma')}</b><small>${hat.acik ? esc(hat.saat || '') : t('Kapalı')}</small></span></summary>
        <div class="ayar-govde">
        <p class="soluk">${t('Her gün seçtiğin saatte telefonuna bir hatırlatma gelir. O gün zaten çalıştıysan gelmez.')}</p>
        ${LN() ? `<div class="satir sola"><button class="btn ${hat.acik ? '' : 'ikincil'}" data-hatir="1">${t('Açık')}</button><button class="btn ${hat.acik ? 'ikincil' : ''}" data-hatir="0">${t('Kapalı')}</button>
          <button class="btn ikincil" id="denemeBildirim">${t('Deneme bildirimi gönder')}</button>
          <label>${t('Saat:')} <input type="time" id="hatirSaat" value="${esc(hat.saat || '20:00')}" style="font:inherit;padding:8px;border-radius:10px;border:1px solid var(--cizgi);background:var(--bg);color:var(--metin)"></label></div>` : `<p class="soluk kucukyazi">${t('Günlük hatırlatma şimdilik yalnızca Android uygulamasında çalışır.')}</p>`}</div></details>
      <details class="kart ayar-bolum" data-bol="d"><summary><span class="ayar-ik">${IKON.dil}</span><span class="ayar-bas"><b>${t('Dil / Language')}</b><small>${DIL === 'en' ? 'English' : 'Türkçe'}</small></span></summary>
        <div class="ayar-govde">
        <div class="dil-sec"><button class="btn ${DIL === 'tr' ? '' : 'ikincil'}" data-dil="tr">Türkçe</button><button class="btn ${DIL === 'en' ? '' : 'ikincil'}" data-dil="en">English</button></div></div></details>
      <details class="kart ayar-bolum" data-bol="y"><summary><span class="ayar-ik">${IKON.bulut}</span><span class="ayar-bas"><b>${t('Hesap ve yedek')}</b><small>${hk ? esc(hk.email || '') : t('Giriş yapılmadı')}</small></span></summary>
        <div class="ayar-govde"><div class="satir sola"><button class="btn ${hk ? 'ikincil' : ''}" data-git="hesap">${hk ? t('Hesabım') : t('Giriş yap / Hesap aç')}</button></div><p style="margin-top:16px"><b>${t('Yedek')}</b></p><p>${t('İlerlemen ve geçmişin telefonda saklanır. Uygulamayı silmeden önce ya da yeni bir telefona geçerken yedeğini kopyalayıp bir yere (not, e-posta) kaydet.')}</p>
        <textarea id="yedek" rows="4" readonly aria-label="${t('Yedek verisi')}">${esc(yedek)}</textarea>
        <div class="satir sola"><button class="btn" id="kopyala">${t('Yedeği kopyala')}</button></div>
        <p>${t('Yedeği geri yüklemek için aşağıya yapıştır:')}</p>
        <textarea id="yukle" rows="3" placeholder="${t('Yedeği buraya yapıştır')}"></textarea>
        <div class="satir sola"><button class="btn ikincil" id="geriyukle">${t('Geri yükle')}</button></div><p style="margin-top:20px"><b>${t('Sıfırla')}</b></p><p>${t('Bütün ilerleme ve geçmiş silinir.')}</p><button class="btn tehlike" id="sifirla">${t('Her şeyi sıfırla')}</button></div></details>
      <details class="ayar-dip" data-bol="k"><summary>${t('Kaynaklar')}</summary><ul class="kaynak">${KAYNAK.map(k => `<li>${esc(k)}</li>`).join('')}</ul>
        <p class="soluk">${t('Tecvid kulakla öğrenilen bir ilimdir. Bu uygulama bir hocadan ders almanın yerini tutmaz, onu destekler.')}</p></details>
      <details class="ayar-dip geri-bildirim" data-bol="e"><summary>${t('Geri bildirim gönder')}</summary><p class="soluk">${t('Ne gördüğünü ya da ne istediğini yaz. Sürüm ve cihaz bilgisi otomatik eklenir; göndereceğin uygulamayı (mesaj, e-posta) sen seçersin.')}</p>
        <textarea id="gbMetin" rows="4" maxlength="1500" placeholder="${t('Mesajın…')}" aria-label="${t('Geri bildirim gönder')}"></textarea><button class="btn" id="gbGonder">${t('Gönder')}</button></details>
      <details class="ayar-dip" data-bol="e"><summary>${t('Hata kaydı')}</summary><p class="soluk">${t('Uygulamada bir sorun olursa burada görünür. Kopyalayıp bize gönderebilirsin.')}</p>
        <textarea id="hataKaydi" rows="4" readonly aria-label="${t('Hata kaydı')}">${esc((() => { try { return JSON.parse(localStorage.getItem('tecvid-ogren.hatalar') || '[]').join('\n') || t('Kayıtlı hata yok.'); } catch (e) { return ''; } })())}</textarea>
        <p class="soluk kucukyazi">${esc(navigator.userAgent)}</p></details>
      <p class="soluk kucukyazi ayar-surum">${esc(surumYazi())}</p>
    </main>`;
    app.querySelectorAll('[data-dil]').forEach(b => b.onclick = () => { if (b.dataset.dil === DIL) return; try { localStorage.setItem('tecvid-ogren.dil', b.dataset.dil); } catch (e) { } location.reload(); });
    app.querySelectorAll('[data-tema]').forEach(b => b.onclick = () => { S.ayar.tema = b.dataset.tema; temaUygula(); kaydet(); ciz(); });
    app.querySelectorAll('[data-renk]').forEach(b => b.onclick = () => { S.ayar.renk = b.dataset.renk; temaUygula(); kaydet(); ciz(); });
    $('#gbGonder').onclick = () => {
      let errs = ''; try { errs = (JSON.parse(localStorage.getItem('tecvid-ogren.hatalar') || '[]') || []).slice(-5).join('\n'); } catch (e) { }
      const body = `${$('#gbMetin').value.trim()}\n\n--\n${surumYazi()}\n${navigator.userAgent}${errs ? '\n' + errs : ''}`;
      if (!$('#gbMetin').value.trim()) return toast(t('Önce bir mesaj yaz.'));
      if (navigator.share) navigator.share({ title: t('Kur\'an Yolum geri bildirimi'), text: body }).catch(() => { });
      else if (navigator.clipboard) navigator.clipboard.writeText(body).then(() => toast(t('Kopyalandı; istediğin yere yapıştırabilirsin.'))).catch(() => { });
      window.__feedbackText = body;
    };
    $('#ayKontrast').onclick = () => { S.ayar.yuksekKontrast = !S.ayar.yuksekKontrast; temaUygula(); kaydet(); ciz(); };
    $('#ayHareket').onclick = () => { S.ayar.hareketAzalt = !S.ayar.hareketAzalt; temaUygula(); kaydet(); ciz(); };
    app.querySelectorAll('[data-yazi]').forEach(b => b.onclick = () => { S.ayar.yazi = +b.dataset.yazi; temaUygula(); kaydet(); ciz(); });
    app.querySelectorAll('[data-aryazi]').forEach(b => b.onclick = () => { S.ayar.arYazi = +b.dataset.aryazi; temaUygula(); kaydet(); ciz(); });
    app.querySelectorAll('[data-renkli]').forEach(b => b.onclick = () => { S.ayar.renkli = b.dataset.renkli === '1'; kaydet(); ciz(); });
    app.querySelectorAll('[data-yazim]').forEach(b => b.onclick = async () => { S.ayar.yazim = b.dataset.yazim; temaUygula(); kaydet(); trFontYukle(); await Promise.all(Object.keys(KURAN).map(n => trYukle(+n))); ciz(); });
    const hatirAyarla = async (acik, saat) => {
      S.ayar.hatirlat = { acik, saat }; kaydet();
      const ok = await hatirlatmaKur(acik);
      if (acik && LN() && !ok) { S.ayar.hatirlat.acik = false; kaydet(); toast(t('Bildirim izni verilmedi. Telefon ayarlarından Kur\'an Yolum için bildirimlere izin ver.')); }
      else if (acik) toast(t('Hatırlatma kuruldu: her gün {0}', saat));
      ciz();
    };
    app.querySelectorAll('[data-hatir]').forEach(b => b.onclick = () => hatirAyarla(b.dataset.hatir === '1', $('#hatirSaat').value || '20:00'));
    if ($('#denemeBildirim')) $('#denemeBildirim').onclick = denemeBildirimi;
    if ($('#hatirSaat')) $('#hatirSaat').onchange = e => { if (e.target.value) hatirAyarla(!!(S.ayar.hatirlat || {}).acik, e.target.value); };
    app.querySelectorAll('[data-mesk]').forEach(b => b.onclick = () => { S.ayar.mesk = b.dataset.mesk === '1'; kaydet(); ciz(); });
    app.querySelectorAll('[data-mtekrar]').forEach(b => b.onclick = () => { S.ayar.meskTekrar = +b.dataset.mtekrar; kaydet(); ciz(); });
    app.querySelectorAll('[data-gsgiz]').forEach(b => b.onclick = () => { S.ayar.gsGizle = b.dataset.gsgiz === '1'; kaydet(); ciz(); });
    if ($('#pinDegistir')) $('#pinDegistir').onclick = async () => { if (window.ebeveynPin && await window.ebeveynPin.degistir()) { toast(t('PIN kaydedildi ✓')); ciz(); } };
    app.querySelectorAll('[data-sesli]').forEach(b => b.onclick = () => { S.ayar.sesliYonerge = b.dataset.sesli === '1'; kaydet(); if (S.ayar.sesliYonerge && window.Sesli) { window.Sesli.acik = true; window.Sesli.soyle(t('Sesli yönerge açık.')); } ciz(); });
    app.querySelectorAll('[data-hiz]').forEach(b => b.onclick = () => { S.ayar.hiz = +b.dataset.hiz; kaydet(); ciz(); });
    $('#kopyala').onclick = async () => { try { await navigator.clipboard.writeText(yedek); toast(t('Kopyalandı')); } catch (e) { const x = $('#yedek'); x.select(); document.execCommand('copy'); toast(t('Kopyalandı')); } };
    $('#geriyukle').onclick = () => {
      try { const v = JSON.parse($('#yukle').value); if (!v.ilerleme || !v.gecmis) throw new Error(t('Geçersiz yedek')); S = birlestir(Object.assign(bos(), v), S); kaydet(); toast(t('Yedek yüklendi')); anaSayfa(); }
      catch (e) { toast(t('Yedek okunamadı: ') + e.message); }
    };
    $('#sifirla').onclick = async () => {
      if (!confirm(girisli() ? t('Emin misin? Bütün ilerleme ve test geçmişi silinecek (hesabındakiler de).') : t('Emin misin? Bütün ilerleme ve test geçmişi silinecek.'))) return;
      const ayar = S.ayar; S = bos(); S.ayar = ayar; S.hesapUyariKapali = true; clearTimeout(yuklemeZamanlayici);
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { }
      if (girisli()) { try { await B().yukle(S, PR.aktif); } catch (e) { toast(t('Hesaptaki veriler silinemedi: internet yok')); } }
      anaSayfa();
    };
    app.querySelectorAll('.ayar-bolum').forEach(d => { if (AYAR_ACIK.has(d.dataset.bol)) d.open = true; d.addEventListener('toggle', () => { if (d.open) AYAR_ACIK.add(d.dataset.bol); else AYAR_ACIK.delete(d.dataset.bol); }); });
  };
  // ------------------------------------------------------------ günlük hatırlatma (telefon bildirimi)
  // Önümüzdeki 14 gün için her gün seçilen saatte bir bildirim kurulur; bugün çalıştıysan bugünkü atlanır.
  const LN = () => window.capEklenti('LocalNotifications');
  const HATIR_ID = Array.from({ length: 14 }, (_, i) => 7100 + i);
  // Günlük hatırlatma: başlık kısa bir davet, metin kaynağıyla kısa bir ayet ya da hadis.
  // Metinler window.MUJDE'den (HadeethEnc ve sunnah.com künyeleriyle kontrol edildi); bildirimde uzun durmasın diye 110 karakterden kısa olanlar.
  function hatirlatmaSozleri() {
    const M = window.MUJDE || {}, gor = new Set();
    return (cocukMu() ? (M.cocuk || []) : [...(M.buyuk || []), ...(M.cocuk || [])]).filter(x => {
      const en = DIL === 'en', m = en ? x.en : x.tr, k = en ? x.ken : x.ktr; if (!m || !k || m.length > 110 || gor.has(k)) return false; gor.add(k); return true; });
  }
  function hatirlatmaMetni(i) {
    const siradaki = U.find(u => !gecti(u.id)), vade = vadesiGelenler().length, ezVade = Object.values(S.ezber || {}).some(e => e.tam && (e.vade || 0) <= simdi());
    const basliklar = cocukMu()
      ? [t('Harf Yolculuğu seni bekliyor'), t('Bugün bir durak, bir yıldız'), t('Bugün Kur\'an\'a 5 dakika ayır')]
      : [siradaki ? t('Bugünkü dersin: {0}', siradaki.ad) : t('Bugün bir sûre dinle ve oku'), t('Bugün Kur\'an\'a 10 dakika ayır'),
        vade ? t('Tekrar zamanı: {0} soru seni bekliyor', vade) : t('Bir ayet oku, bir kural öğren'), ezVade ? t('Ezber tekrarın seni bekliyor') : t('Bugün bir ayet ezberle')].concat(KO().hedef ? [t('Bugünkü Kur\'an okuman: {0} sayfa', KO().hedef)] : []);
    const sozler = hatirlatmaSozleri(), soz = sozler[i % Math.max(1, sozler.length)];
    const en = DIL === 'en', yazi = soz && (en ? soz.en : soz.tr), kun = soz && (en ? soz.ken : soz.ktr);
    // içinde tırnak olan (ör. “Rabbim, ilmimi artır!”) metin ikinci kez tırnağa alınmaz; "…" âyetin bir kısmı olduğunu gösterir, korunur
    const metin = soz ? `${yazi.includes('“') ? yazi : `“${yazi}”`} — ${kun}` : t('Birkaç dakika ayır; öğrendiklerin kalıcı olsun.');
    return { baslik: basliklar[i % basliklar.length], metin };
  }
  async function hatirlatmaKur(izinIste) {
    const ln = LN(); const h = S.ayar.hatirlat || {};
    if (!ln) return false;
    try {
      await ln.cancel({ notifications: HATIR_ID.map(id => ({ id })) });
      if (!h.acik) return true;
      let izin = await ln.checkPermissions();
      if (izin.display !== 'granted' && izinIste) izin = await ln.requestPermissions();
      if (izin.display !== 'granted') return false;
      const [sa, dk] = (h.saat || '20:00').split(':').map(Number);
      const calisti = S.seri.son === bugun();
      const bildirimler = [];
      for (let g = 0; g < 14; g++) {
        const at = new Date(); at.setDate(at.getDate() + g); at.setHours(sa, dk, 0, 0);
        if (at.getTime() <= Date.now() + 60000) continue;
        if (g === 0 && calisti) continue;
        const hm = hatirlatmaMetni(g + new Date().getDate());
        // Tam zamanlı alarm istenmez: eklenti izin yoksa sistem ayar ekranını açıyor; günlük hatırlatmada birkaç dakika kayma sorun değil
        bildirimler.push({ id: HATIR_ID[g], title: hm.baslik, body: hm.metin, largeBody: hm.metin, schedule: { at, allowWhileIdle: true }, isExactNotification: false, extra: { git: 'gunluk' } });
      }
      if (bildirimler.length) await ln.schedule({ notifications: bildirimler });
      return true;
    } catch (e) { console.warn('hatırlatma', e); return false; }
  }
  // Ayarlar: deneme bildirimi (5 sn sonra) — hatırlatmanın telefonda nasıl göründüğünü görmek için
  async function denemeBildirimi() {
    const ln = LN(); if (!ln) return toast(t('Bildirimler yalnızca Android uygulamasında çalışır.'));
    try {
      let izin = await ln.checkPermissions(); if (izin.display !== 'granted') izin = await ln.requestPermissions();
      if (izin.display !== 'granted') return toast(t('Bildirim izni verilmedi. Telefon ayarlarından Kur\'an Yolum için bildirimlere izin ver.'));
      const hm = hatirlatmaMetni(Math.floor(Math.random() * 100));
      await ln.schedule({ notifications: [{ id: 7190, title: hm.baslik, body: hm.metin, largeBody: hm.metin, schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true }, isExactNotification: false, extra: { git: 'gunluk' } }] });
      toast(t('Deneme bildirimi 5 saniye içinde gelecek. Uygulamayı arka plana alabilirsin.'));
    } catch (e) { toast(t('Bildirim gönderilemedi.')); }
  }
  // Ayarlardaki önizleme: ayetin tamamı renkli
  function kelimeHTMLtam(r) {
    const k = AYAH[r].split(' '); let o = 0;
    return k.map(w => { const h = kelimeHTML(r, w, o); o += w.length + 1; return h; }).join(' ');
  }

  // Açılış: "Sizin en hayırlınız Kur'an'ı öğrenen ve öğretendir." (Buhârî, Fezâilü'l-Kur'ân 21; no. 5027)
  const HADIS_AR = 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ';
  const hadisMetni = () => t('“Sizin en hayırlınız Kur\'an\'ı öğrenen ve öğretendir.”');
  const hadisKaynak = () => t('Buhârî, Fezâilü\'l-Kur\'ân 21');
  // ------------------------------------------------------------ hoş geldin: yaş grubu (profil başına bir kez) ve seviye
  const YAS_KART = [['kucuk', '🌱', t('4–6 yaş'), t('Minikler: resimli, oyunlu harf yolculuğu')], ['cocuk', '🌟', t('7–12 yaş'), t('Çocuklar: harfler, harekeler ve okuma oyunları')], ['buyuk', '📘', t('13 yaş ve üstü'), t('Gençler ve yetişkinler: tecvid dersleri ve testler')]];
  const avatar = p => `<span class="avatar p-${p.yas || 'yok'}">${p.ad ? esc(p.ad.trim()[0].toLocaleUpperCase(DIL === 'en' ? 'en' : 'tr')) : (p.yas === 'kucuk' ? '🌱' : p.yas === 'cocuk' ? '🌟' : '👤')}</span>`;
  // Yeni yetişkin profile bir kez "nereden başlayalım?" sorulur (daha önce ilerlemesi olana sorulmaz)
  if (location.hostname === 'localhost') window.__test = { oturum: () => oturum, ac: (ad, ...a) => { ekranYigini = [[ad, a]]; ciz(); }, git: (...a) => git(...a), U: () => U.map(u => u.id), S: () => S };
  // ------------------------------------------------------------ Seviye tespiti: "Seni tanıyalım" (yetişkin)
  // Karar: claude/toplanti-2026-11-18-seviye-tespiti-yeniden.md
  // 1) Başta isteğe bağlı okuma (3 kısa ayet, yapay zekâ dinler). 2) 8 konu, her biri ayrı yoklanır: 3 soru;
  // 3/3 geçti, 2/3 → 2 soru daha (5'te 4 geçti), 1/3 kaldı. Test ilk takılmada bitmez; yalnız arka arkaya iki
  // konu kalınırsa (ya da "hiç görmedim") erken biter. 3) Sabit yerleştirme havuzu: ses gerektirmeyen, kuralı ölçen,
  // ders sorularından seçilmiş sorular (hoca onayı bekliyor). 4) Sonuç: konu listesi, kişi değiştirebilir, puan yok.
  // Kendi beyanı taban: "Kur'an okuyabiliyorum" diyen Elif-Ba'ya hiçbir zaman geri gönderilmez.
  const SV_KONU = [
    { id: 'hareke', ad: () => t('Harekeler ve işaretler'), dersler: ['u0'], oner: ['m1', 'm2', 'm3'], havuz: ['c:u0:0', 'c:u0:1', 'c:u0:2', 'c:u0:7', 'c:u0:8', 'c:u0:9', 'c:u1:3'] },
    { id: 'tabii', ad: () => t('Med-i tabîî ve med harfleri'), dersler: ['u1'], havuz: ['c:u1:0', 'c:u1:1', 'c:u1:2', 'c:u1:4', 'c:u0:3', 'c:u0:4'] },
    { id: 'feri', ad: () => t('Diğer medler (muttasıl, munfasıl, lâzım, ârız, lîn) ve zamir'), dersler: ['u2', 'u3', 'u4', 'u5', 'u6'], ek: ['x1'], havuz: ['c:u2:0', 'c:u2:3', 'c:u3:0', 'c:u3:2', 'c:u4:0', 'c:u4:1', 'c:u5:0', 'c:u6:0'] },
    { id: 'nun', ad: () => t('Nûn sâkin ve tenvin'), dersler: ['u7', 'u8', 'u9', 'u10', 'u11'], havuz: ['c:u7:0', 'c:u7:3', 'c:u8:0', 'c:u8:1', 'c:u9:2', 'c:u10:0', 'c:u10:3', 'c:u11:3'] },
    { id: 'mim', ad: () => t('Mîm sâkin ve ğunne'), dersler: ['u12', 'u13'], ek: ['x2'], havuz: ['c:u12:0', 'c:u12:1', 'c:u12:2', 'c:u12:4', 'c:u13:0', 'c:u13:2', 'c:u13:3'] },
    { id: 'idgam', ad: () => t('İdğamlar'), dersler: ['u14'], havuz: ['c:u14:0', 'c:u14:1', 'c:u14:3', 'c:u14:4', 'c:u14:5', 'c:u9:0'] },
    { id: 'kalkale', ad: () => t('Kalkale, lâm-ı tarif, Allah lafzı, râ'), dersler: ['u15', 'u16', 'u17', 'u18'], havuz: ['c:u15:1', 'c:u15:3', 'c:u16:1', 'c:u16:5', 'c:u17:1', 'c:u17:3', 'c:u18:0', 'c:u18:1'] },
    { id: 'vakf', ad: () => t('Vakf (durma) ve Hafs\'a özel okunuşlar'), dersler: ['u19', 'u20'], ek: ['x3'], havuz: ['c:u19:1', 'c:u19:2', 'c:u19:3', 'c:u19:4', 'c:u19:5', 'c:u20:1', 'c:u20:3'] },
  ];
  // Okuma adımı: kolaydan zora 3 kısa ayet (Mustafa Hoca)
  const SV_OKUMA = ['1:2', '108:1', '103:3'];
  const svSecim = (konu, adet, olan) => karistir(konu.havuz.filter(k => !olan.includes(k))).slice(0, adet);
  EKRAN.seviyeTespit = function () {
    app.innerHTML = `${ust(t('🧭 Seni tanıyalım'))}<main>
      <section class="kart"><p>${t('Bildiğin konuları bulalım; bildiğin bölümleri atlayıp doğru yerden başlayalım. Puan yok, yanlış yapmak sorun değil.')}</p>
        <ol class="sv-bloklar"><li>${t('Kısa okuma: 3 ayet (istersen atlarsın)')}</li>${SV_KONU.map(b => `<li>${esc(b.ad())}</li>`).join('')}</ol>
        <p class="soluk kucukyazi">${t('Her konuda 3 soru; kararsız kalırsan 2 soru daha. Bir konuyu bilmemek testi bitirmez. Hiç görmediğin konuyu tek dokunuşla geçebilirsin. Yaklaşık 8–12 dakika.')}</p>
        <button class="btn genis" id="svBasla">${t('Başlayalım')}</button></section></main>`;
    $('#svBasla').onclick = () => { SVO.i = 0; SVO.sonuc = []; ekranDegistir('seviyeOkuma'); };
  };
  // ---- okuma adımı
  const SVO = { i: 0, sonuc: [], kayit: null };
  EKRAN.seviyeOkuma = function () {
    const r = SV_OKUMA[SVO.i], [n] = r.split(':').map(Number);
    if (!SURE(n)) { app.innerHTML = `${ust(t('🧭 Seni tanıyalım'))}<main><p class="soluk">${t('Yükleniyor…')}</p></main>`; sureYukle(n).then(() => ciz()).catch(() => svTestBaslat()); return; }
    const son = SVO.sonuc[SVO.i];
    app.innerHTML = `${ust(t('🧭 Seni tanıyalım'))}<main>
      <p class="soluk">${t('Okuma {0}/{1}', SVO.i + 1, SV_OKUMA.length)}</p>
      <section class="kart"><h2 style="margin-top:0">🎙️ ${t('Bu ayeti sesli oku')}</h2>
        <div class="ayet" dir="rtl" lang="ar">${esc(ayetMetni(r))}</div>
        <p class="soluk kucukyazi">${esc(sureNoAdi(n))} ${r.split(':')[1]} · ${t('Her zamanki gibi oku; yapay zekâ telefonda dinler, ses gönderilmez.')}</p>
        <div class="satir sola"><button class="btn" id="svOku">🎤 ${son ? t('Tekrar oku') : t('Oku')}</button></div>
        <div id="svOkuSonuc">${son ? son.html : ''}</div></section>
      <div class="satir">${son ? `<button class="btn genis" id="svOkuIleri">${SVO.i + 1 < SV_OKUMA.length ? t('Sonraki ayet ›') : t('Sorulara geç ›')}</button>` : ''}</div>
      <div class="satir"><button class="btn ikincil genis" id="svOkumaAtla">${t('Okumayı atla, sorulara geç')}</button></div></main>`;
    $('#svOkumaAtla').onclick = () => svTestBaslat();
    const il = $('#svOkuIleri'); if (il) il.onclick = () => { if (SVO.i + 1 < SV_OKUMA.length) { SVO.i++; ciz(); window.scrollTo(0, 0); } else svTestBaslat(); };
    $('#svOku').onclick = ev => svOkut(ev.currentTarget, r);
  };
  async function svOkut(btn, r) {
    if (SVO.kayit) { SVO.kayit.stop(); return; }
    if (!navigator.mediaDevices || !window.MediaRecorder) return toast(t('Bu cihazda ses kaydı desteklenmiyor.'));
    let O; try { O = await okumaHazirla(); } catch (e) { return toast(e.message); }
    let akis; try { akis = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); } catch (e) { return toast(t('Mikrofon izni verilmedi. Telefon ayarlarından Kur\'an Yolum için mikrofona izin ver.')); }
    const kutu = $('#svOkuSonuc'), parca = [], rec = new MediaRecorder(akis); SVO.kayit = rec; O.modelAc().catch(() => { });
    btn.textContent = t('⏹ Bitir'); btn.classList.add('kirmizi-btn', 'kaydediyor'); kutu.innerHTML = `<p class="soluk">${t('🎙️ Dinliyorum… Ayeti oku, bitince "Bitir"e dokun.')}</p>`;
    const z = setTimeout(() => rec.state !== 'inactive' && rec.stop(), 25000);
    rec.ondataavailable = e => { if (e.data && e.data.size) parca.push(e.data); };
    rec.onstop = async () => {
      clearTimeout(z); akis.getTracks().forEach(x => x.stop()); SVO.kayit = null;
      btn.classList.remove('kirmizi-btn', 'kaydediyor'); btn.textContent = t('Kontrol ediliyor…'); kutu.innerHTML = `<p class="soluk">${t('Kontrol ediliyor…')}</p>`;
      const [n, a] = r.split(':').map(Number);
      try {
        const s = await O.ayetRaporu(n, a, new Blob(parca, { type: rec.mimeType || 'audio/webm' }));
        const j = s.kelimeler.filter(w => w.notes.some(z_ => z_.severity === 'jali')).length, duydu = !!s.heard && s.heard.length > 5;
        const html = !duydu ? `<p class="r-orta">${t('Sesini duyamadım. Biraz daha yüksek ve yakından oku.')}</p>`
          : j === 0 ? `<p class="r-iyi"><b>${t('Güzel okudun.')}</b></p>` : j <= 2 ? `<p class="r-iyi"><b>${t('İyi okudun; {0} kelimede küçük bir şey var.', j)}</b></p>` : `<p class="r-orta"><b>${t('{0} kelimede hata var.', j)}</b> ${t('Sorun değil; buna göre yerleştireceğiz.')}</p>`;
        if (duydu) SVO.sonuc[SVO.i] = { j, kelime: s.kelimeler.length, html };
        if (ekranYigini[ekranYigini.length - 1][0] === 'seviyeOkuma') ciz();
      } catch (e) { kutu.innerHTML = `<p class="hata">${esc(e.message || t('Kontrol edilemedi.'))}</p>`; btn.textContent = '🎤 ' + t('Tekrar oku'); }
    };
    rec.start();
  }
  // Okuma iyi mi? En az 2 ayet okunmuş ve toplamda en fazla 2 kelimede açık hata
  const svOkumaDurumu = () => { const l = SVO.sonuc.filter(Boolean); if (l.length < 2) return null; const j = l.reduce((x, y) => x + y.j, 0); return j <= 2 ? 'iyi' : j <= 6 ? 'orta' : 'zayif'; };
  function svTestBaslat() {
    const okuma = svOkumaDurumu(), sonuc = SV_KONU.map(() => null);
    // Okuyuşu iyi olanın "Harekeler ve işaretler" konusu okumayla geçilmiş sayılır (Mustafa Hoca: asıl ölçü okuyuştur)
    let konu = 0; if (okuma === 'iyi') { sonuc[0] = 'gecti'; konu = 1; }
    const ilk = svSecim(SV_KONU[konu], 3, []);
    ekranYigini = [[evKok(), []]];
    oturumBaslat({ tur: 'seviye', kimlik: 'seviye', baslik: t('Seni tanıyalım'), anahtarlar: ilk, puanli: false, sv: { konu, bas: 0, ek: false, sonuc, okuma, ardKaldi: 0 } });
  }
  function svKonuBitir(o, durum) {
    o.sv.sonuc[o.sv.konu] = durum;
    if (durum !== 'gormedim') o.sv.ardKaldi = durum === 'gecti' ? 0 : o.sv.ardKaldi + 1; // "hiç görmedim" testi durdurmaz
    let sonraki = o.sv.konu + 1; while (sonraki < SV_KONU.length && o.sv.sonuc[sonraki]) sonraki++;
    if (o.sv.ardKaldi >= 2 || sonraki >= SV_KONU.length) return svBitir(o);
    o.sv.konu = sonraki; o.sv.bas = o.sorular.length; o.sv.ek = false;
    const yeni = svSecim(SV_KONU[sonraki], 3, o.anahtarlar); o.anahtarlar.push(...yeni); o.sorular.push(...yeni.map(soruUret).filter(Boolean));
    o.i = o.sv.bas; oturumSakla(); toast(durum === 'gecti' ? t('Bârekallah! Sonraki konu: {0}', SV_KONU[sonraki].ad()) : t('Sonraki konu: {0}', SV_KONU[sonraki].ad())); ciz(); window.scrollTo(0, 0);
  }
  function seviyeIleri(o) {
    const cev = o.cevaplar.slice(o.sv.bas, o.i + 1), d = cev.filter(c => c && c.dogru).length, y = cev.length - d;
    // Karar: 3/3 geçti · 2/3 → 2 soru daha, 5'te 4 geçti · en fazla 1/3 kaldı (ilk iki yanlışta erken karar)
    if (!o.sv.ek) {
      if (cev.length >= 2 && y >= 2) return svKonuBitir(o, 'kaldi');
      if (cev.length < 3) { o.i++; oturumSakla(); ciz(); window.scrollTo(0, 0); return; }
      if (d === 3) return svKonuBitir(o, 'gecti');
      o.sv.ek = true; const yeni = svSecim(SV_KONU[o.sv.konu], 2, o.anahtarlar); o.anahtarlar.push(...yeni); o.sorular.push(...yeni.map(soruUret).filter(Boolean));
      if (o.i + 1 >= o.sorular.length) return svKonuBitir(o, 'kaldi');
      o.i++; oturumSakla(); toast(t('Emin olmak için 2 soru daha')); ciz(); window.scrollTo(0, 0); return;
    }
    if (d >= 4) return svKonuBitir(o, 'gecti');
    if (y >= 2) return svKonuBitir(o, 'kaldi');
    if (o.i + 1 < o.sorular.length) { o.i++; oturumSakla(); ciz(); window.scrollTo(0, 0); return; }
    return svKonuBitir(o, d >= 4 ? 'gecti' : 'kaldi');
  }
  function svHicGormedim() { const o = oturum; if (!o || o.tur !== 'seviye') return; o.sorular.length = o.sv.bas; o.anahtarlar.length = o.sv.bas; o.cevaplar.length = o.sv.bas; svKonuBitir(o, 'gormedim'); }
  function svBitir(o) {
    const sv = { konular: o.sv.sonuc.slice(), okuma: o.sv.okuma, t: simdi() };
    oturum = null; oturumSakla();
    S.ayar.svSonuc = sv; seviyeYerlestir(); ekranYigini = [[evKok(), []], ['seviyeSonuc', []]]; ciz(); window.scrollTo(0, 0);
  }
  // Sonuca göre bölümleri "Atlandı (seviye)" yap ya da aç; kişinin işaretleri (S.ayar.svSonuc.konular) esas alınır
  function seviyeYerlestir() {
    const sv = S.ayar.svSonuc || { konular: [] }, beyan = S.ayar.svBeyan || S.ayar.seviye;
    // Kendi beyanı taban: harfleri tanıyan ve okuyabilen Elif-Ba'ya dönmez
    if ((beyan === 'okur' || beyan === 'harf' || sv.konular.some(x => x === 'gecti')) && !gecti('e1')) S.ilerleme.e1 = { en: 0, deneme: 0, gecti: true, atla: true, seviye: true };
    SV_KONU.forEach((b, i) => {
      const atla = sv.konular[i] === 'gecti';
      for (const id of b.dersler.concat(b.ek || [])) {
        const il = S.ilerleme[id];
        if (atla && !gecti(id)) S.ilerleme[id] = { en: 0, deneme: 0, gecti: true, atla: true, seviye: true };
        if (!atla && il && il.atla && il.seviye) delete S.ilerleme[id];
        if (atla) { const u = unitById(id); if (u && !u.ara) karistir(anahtarlar(u)).slice(0, 2).forEach(k => { if (!S.srs[k]) S.srs[k] = { kutu: 2, dogru: 1, yanlis: 0, son: simdi(), vade: simdi() + (3 + Math.floor(Math.random() * 10)) * GUN }; }); }
      }
      for (const id of b.oner || []) {
        if (atla && !gecti(id)) S.ilerleme[id] = { en: 0, deneme: 0, gecti: true, atla: true, seviye: true, oner: true };
        if (!atla && S.ilerleme[id] && S.ilerleme[id].oner) delete S.ilerleme[id];
      }
    });
    S.ayar.seviye = 'tespit'; if (beyan && beyan !== 'tespit') S.ayar.svBeyan = beyan; kaydet();
  }
  const SV_DURUM = () => ({ gecti: ['ok', t('Biliyorsun ✓')], kaldi: ['simdi', t('Çalışalım')], gormedim: ['simdi', t('Görmedin, çalışalım')], null: ['soluk', t('Sorulmadı')] });
  EKRAN.seviyeSonuc = function () {
    const sv = S.ayar.svSonuc; if (!sv) return anaSayfa();
    const sir = U.find(u => !gecti(u.id)), D = SV_DURUM();
    app.innerHTML = `${ust(t('🧭 Seni tanıdık'), false)}<main>
      <section class="kart sv-sonuc"><h2 style="margin-top:0">${sir ? t('Buradan başlıyorsun: {0}', esc(sir.ad)) : t('Maşallah! Bütün konuları biliyorsun.')}</h2>
        ${sv.okuma ? `<p class="kucukyazi">🎙️ ${sv.okuma === 'iyi' ? t('Okuyuşun iyi.') : sv.okuma === 'orta' ? t('Okuyuşunda birkaç hata var; konuları çalıştıkça düzelir.') : t('Okuyuşunda hatalar var; "Harekeler ve işaretler" bölümünü çalışman önerilir.')}</p>` : ''}
        <ul class="sv-konular">${SV_KONU.map((b, i) => { const x = sv.konular[i] || null, [cls, yazi] = D[x];
          return `<li><span class="bad">${esc(b.ad())}</span><span class="rozet ${cls}">${yazi}</span><button class="btn kucuk ikincil" data-sv-cevir="${i}">${x === 'gecti' ? t('Çalışmak istiyorum') : t('Biliyorum')}</button></li>`; }).join('')}</ul>
        <p class="soluk kucukyazi">${t('Bildiğin konuların bölümleri "Atlandı" olarak açık kalır; istediğin zaman çalışabilir, testlerine girebilirsin. Bir konuyu kendin de değiştirebilirsin.')}</p>
        <div class="satir sola">${sir ? `<button class="btn" data-git="${sir.ara ? 'sinavGiris|' + sir.id : 'ders|' + sir.id}">${t('Başla')}</button>` : ''}<button class="btn ikincil" id="svAna">${t('Ana sayfa')}</button></div>
      </section></main>`;
    $('#svAna').onclick = () => anaSayfa();
    app.querySelectorAll('[data-sv-cevir]').forEach(b => b.onclick = () => { const i = +b.dataset.svCevir; sv.konular[i] = sv.konular[i] === 'gecti' ? 'kaldi' : 'gecti'; seviyeYerlestir(); ciz(); });
  };
  const seviyeSorulmali = () => !cocukMu() && !S.ayar.seviye && !Object.keys(S.ilerleme).length && !S.gecmis.length;
  EKRAN.hosgeldin = function (adim = 'yas') {
    const p = AKTIF();
    if (adim === 'seviye') {
      app.innerHTML = `${ust(t('Nereden başlayalım?'), false)}<main>
        <p>${t('Kur\'an okumayı ne kadar biliyorsun? Buna göre seni doğru bölüme yerleştirelim. Atlanan bölümlerin testlerine istediğin zaman girebilirsin.')}</p>
        <div class="yas-kartlar">
          <button class="yas-kart" data-sv="sifir"><span>🔠</span><b>${t('Hiç bilmiyorum')}</b><small>${t('Harflerden (Elif-Ba) başla')}</small></button>
          <button class="yas-kart" data-sv="harf"><span>✏️</span><b>${t('Harfleri tanıyorum')}</b><small>${t('Harekeler ve işaretlerle başla')}</small></button>
          <button class="yas-kart" data-sv="okur"><span>📖</span><b>${t('Kur\'an okuyabiliyorum')}</b><small>${t('Doğrudan tecvid konularına geç')}</small></button>
        </div>
        <p class="soluk kucukyazi" style="margin-top:14px">${t('Yazı boyutu')}</p>
        <div class="satir sola" id="hgYazi">${[[1, 'A'], [1.15, 'A+'], [1.3, 'A++']].map(([v, ad]) => `<button class="cip ${(S.ayar.yazi || 1) === v ? 'aktif' : ''}" data-hg-yazi="${v}">${ad}</button>`).join('')}</div></main>`;
      app.querySelectorAll('[data-hg-yazi]').forEach(b => b.onclick = () => { S.ayar.yazi = +b.dataset.hgYazi; temaUygula(); kaydet(); app.querySelectorAll('[data-hg-yazi]').forEach(x => x.classList.toggle('aktif', x === b)); });
      const kendim = sv => { const atla = { sifir: [], harf: ['e1'], okur: ['e1', 'u0'] }[sv];
        atla.forEach(id => { if (!gecti(id)) S.ilerleme[id] = { en: 0, deneme: 0, gecti: true, atla: true }; });
        S.ayar.seviye = sv; if (sv === 'okur') S.ayar.anaTur = 'kuran'; kaydet();
        if (sv === 'sifir') { ekranYigini = [[evKok(), []], ['elifba', []]]; ciz(); window.scrollTo(0, 0); } else anaSayfa(); };
      app.querySelectorAll('[data-sv]').forEach(b => b.onclick = () => {
        const sv = b.dataset.sv; if (sv === 'sifir') return kendim(sv);
        app.querySelector('main').innerHTML = `<p>${t('Bildiğin konuları kısa bir testle bulalım mı? Böylece bildiğin bölümleri atlarsın.')}</p>
          <div class="yas-kartlar"><button class="yas-kart" id="svTest"><span>🧭</span><b>${t('Seni tanıyalım')}</b><small>${t('8–12 dakikalık kısa test (önerilir)')}</small></button>
          <button class="yas-kart" id="svKendim"><span>✋</span><b>${t('Kendim seçeyim')}</b><small>${sv === 'okur' ? t('Doğrudan tecvid konularına geç') : t('Harekeler ve işaretlerle başla')}</small></button></div>`;
        $('#svKendim').onclick = () => kendim(sv);
        $('#svTest').onclick = () => { S.ayar.seviye = sv; S.ayar.svBeyan = sv; kaydet(); ekranYigini = [[evKok(), []], ['seviyeTespit', []]]; ciz(); };
      });
      return;
    }
    app.innerHTML = `${ust(t('Hoş geldin'), false)}<main class="hosgeldin">
      <section class="hadis-kart"><p class="ar" dir="rtl" lang="ar">${HADIS_AR}</p><p>${hadisMetni()} <small>${hadisKaynak()}</small></p></section>
      <h2>${PR.liste.length > 1 ? t('Bu profili kim kullanacak?') : t('Uygulamayı kim kullanacak?')}</h2>
      <label class="alan"><span>${t('Adı (isteğe bağlı)')}</span><input id="pAd" maxlength="20" value="${esc(p.ad || '')}" placeholder="${t('Örn. Beyza')}" autocomplete="off"></label>
      <div class="yas-kartlar">${YAS_KART.map(([k, ik, ad, alt]) => `<button class="yas-kart y-${k}" data-yas="${k}"><span>${ik}</span><b>${ad}</b><small>${alt}</small></button>`).join('')}</div>
      <p class="soluk kucukyazi">${t('Yaş grubu yalnızca uygulamayı yaşa göre ayarlamak için kullanılır ve bir daha sorulmaz. Profil → Profiller bölümünden değiştirilebilir.')}</p></main>`;
    app.querySelectorAll('[data-yas]').forEach(b => b.onclick = () => {
      p.yas = b.dataset.yas; p.ad = $('#pAd').value.trim().slice(0, 20); p.d = Date.now(); profilKaydet(); profilleriEsitle();
      if (p.yas !== 'buyuk') S.ayar.seviye = 'cocuk';
      kaydet();
      if (seviyeSorulmali()) { ekranYigini = [['hosgeldin', ['seviye']]]; ciz(); }
      else if (cocukMu() && COCUK && EKRAN.cocukSeviye && !(S.cocuk && (S.cocuk.seviye || Object.keys(S.cocuk.d || {}).length))) { ekranYigini = [['cocukSeviye', []]]; ciz(); }
      else anaSayfa();
    });
  };

  // ------------------------------------------------------------ açılışta profil seçimi (birden çok profil varsa)
  EKRAN.kimCalisiyor = function () {
    app.innerHTML = `${ust(t('Kim çalışıyor?'), false)}<main>
      <div class="profil-sec">${PR.liste.map(p => `<button class="profil-kutu" data-p="${p.id}">${avatar(p)}<b>${esc(p.ad || t('Profil {0}', PR.liste.indexOf(p) + 1))}</b><small>${YAS_AD[p.yas] || t('Yaş seçilmedi')}</small></button>`).join('')}</div>
      <button class="btn ikincil genis" id="yonet">${t('⚙️ Profilleri yönet')}</button></main>`;
    app.querySelectorAll('[data-p]').forEach(b => b.onclick = () => {
      try { sessionStorage.setItem('hk.secildi', '1'); } catch (e) { }
      if (b.dataset.p !== PR.aktif) return profilDegistir(b.dataset.p);
      if (!AKTIF().yas) { ekranYigini = [['hosgeldin', []]]; ciz(); } else anaSayfa();
    });
    $('#yonet').onclick = async () => { if (PR.liste.some(p => p.yas === 'kucuk' || p.yas === 'cocuk') && !(await window.ebeveynKilidi())) return; git('profiller'); };
  };

  // ------------------------------------------------------------ profilleri yönet
  EKRAN.profiller = function (duzenle) {
    const form = (p, yeni) => `<div class="profil-form kart" data-form="${yeni ? 'yeni' : p.id}">
      <label class="alan"><span>${t('Adı')}</span><input class="fAd" maxlength="20" value="${esc(p.ad || '')}" placeholder="${t('Örn. Beyza')}" autocomplete="off"></label>
      <div class="cipler yas-cip">${YAS_KART.map(([k, ik, ad]) => `<button class="${p.yas === k ? 'aktif' : ''}" data-fy="${k}">${ik} ${ad}</button>`).join('')}</div>
      <div class="satir"><button class="btn" data-kaydet="${yeni ? 'yeni' : p.id}">${yeni ? t('Profil ekle') : t('Kaydet')}</button></div></div>`;
    app.innerHTML = `${ust(t('Profiller'))}<main>
      <p class="soluk">${t('Aynı telefonu kullanan herkesin ilerlemesi, yıldızları ve ayarları ayrı tutulur.')}</p>
      ${PR.liste.map(p => `<article class="kart profil-satir">${avatar(p)}<div class="bad"><b>${esc(p.ad || t('Profil {0}', PR.liste.indexOf(p) + 1))}</b><small>${YAS_AD[p.yas] || t('Yaş seçilmedi')}</small></div>
        ${p.id === PR.aktif ? `<span class="rozet ok">${t('Şu an')}</span>` : `<button class="btn kucuk" data-gec="${p.id}">${t('Geç')}</button>`}
        <button class="btn ikincil kucuk" data-duz="${p.id}" aria-label="${t('Düzenle')}" title="${t('Düzenle')}">✏️</button>
        ${PR.liste.length > 1 ? `<button class="btn ikincil kucuk" data-sil="${p.id}" aria-label="${t('Sil')}" title="${t('Sil')}">🗑️</button>` : ''}</article>
        ${duzenle === p.id ? form(p) : ''}`).join('')}
      ${duzenle === 'yeni' ? form({ ad: '', yas: null }, true) : `<button class="btn genis" data-duz="yeni">${t('➕ Yeni profil')}</button>`}
      ${PR.liste.some(p => p.yas === 'kucuk' || p.yas === 'cocuk') || window.ebeveynPin && window.ebeveynPin.var() ? `<section class="kart"><h2 style="margin-top:0">${t('Çocuk modu ayarları')}</h2>
        <p><b>${t('Sesli yönerge')}</b></p><p class="soluk">${t('Çocuk modunda yönergeler telefonun sesiyle okunur (okumayı bilmeyen küçükler için).')}</p>
        <div class="satir sola"><button class="btn ${S.ayar.sesliYonerge !== false ? '' : 'ikincil'}" data-sesli="1">${t('Açık')}</button><button class="btn ${S.ayar.sesliYonerge !== false ? 'ikincil' : ''}" data-sesli="0">${t('Kapalı')}</button>
        <button class="btn ikincil" data-git="harfSesleri">${t('🎙️ Harf seslerini kaydet')}</button></div>
        <p style="margin-top:16px"><b>${t('Büyükler PIN\'i')}</b></p><p class="soluk">${window.ebeveynPin && window.ebeveynPin.var() ? t('Büyükler bölümü 4 haneli PIN ile korunuyor. Açınca 5 dakika tekrar sorulmaz.') : t('Henüz PIN yok. Büyükler bölümüne ilk girişte belirlenir.')}</p>
        <div class="satir sola"><button class="btn ikincil" id="pinDegistir">${window.ebeveynPin && window.ebeveynPin.var() ? t('PIN\'i değiştir') : t('PIN belirle')}</button></div></section>` : ''}
      <p class="soluk kucukyazi">${t('Hesaba giriş yaptıysan profiller hesabında da saklanır. Profil değiştirince uygulama yeniden açılır.')}</p></main>`;
    const yenile = d => { ekranYigini[ekranYigini.length - 1] = ['profiller', [d]]; ciz(); };
    app.querySelectorAll('[data-duz]').forEach(b => b.onclick = () => yenile(duzenle === b.dataset.duz ? undefined : b.dataset.duz));
    if ($('#pinDegistir')) $('#pinDegistir').onclick = async () => { if (window.ebeveynPin && await window.ebeveynPin.degistir()) { toast(t('PIN kaydedildi ✓')); ciz(); } };
    app.querySelectorAll('[data-sesli]').forEach(b => b.onclick = () => { S.ayar.sesliYonerge = b.dataset.sesli === '1'; kaydet(); if (S.ayar.sesliYonerge && window.Sesli) { window.Sesli.acik = true; window.Sesli.soyle(t('Sesli yönerge açık.')); } ciz(); });
    app.querySelectorAll('[data-gec]').forEach(b => b.onclick = () => profilDegistir(b.dataset.gec));
    app.querySelectorAll('[data-fy]').forEach(b => b.onclick = () => { b.parentNode.querySelectorAll('button').forEach(x => x.classList.toggle('aktif', x === b)); });
    app.querySelectorAll('[data-kaydet]').forEach(b => b.onclick = () => {
      if (b.dataset.kilit) return;   // çift dokunuşta ikinci kayıt engellenir (mükerrer profil hatası)
      const f = b.closest('[data-form]'), ad = f.querySelector('.fAd').value.trim().slice(0, 20), yb = f.querySelector('[data-fy].aktif');
      if (!yb) { toast(t('Yaş grubunu seç.')); return; }
      b.dataset.kilit = '1';
      const oncekiCocuk = cocukMu();
      if (b.dataset.kaydet === 'yeni') {
        const id = 'p' + Date.now().toString(36);
        PR.liste.push({ id, ad, yas: yb.dataset.fy, d: Date.now() }); toast(t('Profil eklendi ✓'));
      } else { const p = PR.liste.find(x => x.id === b.dataset.kaydet); p.ad = ad; p.yas = yb.dataset.fy; p.d = Date.now(); toast(t('Kaydedildi ✓')); }
      profilKaydet(); profilleriEsitle();
      if (oncekiCocuk !== cocukMu()) { anaSayfa(); return; }   // aktif profilin modu değişti
      yenile();
    });
    app.querySelectorAll('[data-sil]').forEach(b => b.onclick = async () => {
      const p = PR.liste.find(x => x.id === b.dataset.sil); if (!p || PR.liste.length < 2) return;
      const v = profilVerisi(p), ad = p.ad || t('Profil {0}', PR.liste.indexOf(p) + 1);
      const gecilen = Object.values(v.ilerleme || {}).filter(x => x && x.gecti).length;
      const yildiz = Object.values(((v.cocuk || {}).d) || {}).reduce((t2, d) => t2 + (d.y || 0), 0);
      const kayip = [gecilen ? t('{0} bölüm', gecilen) : '', yildiz ? t('{0} yıldız', yildiz) : '', (v.gecmis || []).length ? t('{0} test', v.gecmis.length) : ''].filter(Boolean).join(', ');
      const aktifMi = p.id === PR.aktif;
      const ok = await onayPenceresi(t('“{0}” silinsin mi?', ad),
        (kayip ? t('Bu profilin ilerlemesi silinecek: {0}.', kayip) : t('Bu profilde henüz ilerleme yok.')) + ' ' + (aktifMi ? t('Şu an bu profildesin; silince ilk profile geçilir. Geri alınamaz.') : t('10 saniye içinde geri alabilirsin.')),
        t('Sil'));
      if (!ok) return;
      const sira = PR.liste.indexOf(p), anahtar = p.id === 'p1' ? 'tecvid-ogren.v1' : 'tecvid-ogren.v1.' + p.id;
      // Silme HEMEN kalıcı işaretlenir (tombstone) ve buluta yazılır; böylece eşitleme profili geri getiremez.
      PR.liste = PR.liste.filter(x => x !== p);
      PR.silinen = (PR.silinen || []).filter(x => x.id !== p.id).concat([{ id: p.id, silindi: true, d: Date.now() }]);
      profilKaydet(); profilleriEsitle();
      const kesinlestir = () => {   // geri alma süresi dolunca: yerel ilerleme verisini ve bulut veri belgesini sil
        try { localStorage.removeItem(anahtar); } catch (e) { }
        if (girisli() && B().profilSil) B().profilSil(p.id).catch(() => { });
      };
      if (aktifMi) { kesinlestir(); profilDegistir(PR.liste[0].id); return; }
      yenile();
      geriAlToast(t('“{0}” silindi.', ad), () => {   // geri al: tombstone kaldırılır, profil yeni tarihle geri gelir (eşitlemede kazanır)
        PR.silinen = (PR.silinen || []).filter(x => x.id !== p.id);
        p.d = Date.now();
        PR.liste.splice(Math.min(sira, PR.liste.length), 0, p);
        profilKaydet(); profilleriEsitle();
        if (ekranYigini[ekranYigini.length - 1][0] === 'profiller') yenile();
        toast(t('Geri alındı ✓'));
      }, kesinlestir);
    });
  };

  // ------------------------------------------------------------ yetişkin ilerleme tablosu
  const GRUPLAR = [[t('Temel'), ['e1', 'u0']], [t('Mahreç ve sıfat'), ['m1', 'm2', 'm3']], [t('Medler'), ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'x1']], [t('Nûn, mîm, ğunne'), ['u7', 'u8', 'u9', 'u10', 'u11', 'u12', 'u13', 'x2']], [t('İleri konular'), ['u14', 'u15', 'u16', 'u17', 'u18', 'u19', 'u20', 'l1', 'a1', 'x3']], [t('Büyük final'), ['x4']]];
  function rozetler() {
    const g = S.gecmis.filter(h => h.tur !== 'alistirma'), gecilen = U.filter(u => gecti(u.id) && !(S.ilerleme[u.id] || {}).atla).length;
    const araGecti = U.some(u => u.ara && !u.final && gecti(u.id) && !(S.ilerleme[u.id] || {}).atla);
    const ezb = Object.values(S.ezber || {}).filter(e => e.tam).length;
    return [
      ['🌱', t('İlk adım'), t('İlk testini çöz'), g.length >= 1],
      ['🔥', t('Bir hafta'), t('7 gün üst üste çalış'), (S.seri.en || S.seri.gun || 0) >= 7],
      ['📚', t('Beş bölüm'), t('5 bölüm geç'), gecilen >= 5],
      ['🏁', t('Ara sınav'), t('Bir ara sınavı geç'), araGecti],
      ['💯', t('Tam puan'), t('Bir testten 100 al'), g.some(h => h.yuzde === 100)],
      ['🧠', t('Hâfıza'), t('Bir sûreyi ezberle'), ezb >= 1],
      ['🎯', t('Azimli'), t('50 test çöz'), g.length >= 50],
      ['🏆', t('Tecvid tamam'), t('Büyük finali geç'), gecti('x4') && !(S.ilerleme.x4 || {}).atla],
      ['🗓️', t('Soru haftası'), t('7 gün günün sorusunu cevapla'), ((S.gs || {}).gun || 0) >= 7],
      ['🌟', t('Soru ayı'), t('30 gün günün sorusunu cevapla'), ((S.gs || {}).gun || 0) >= 30]
    ];
  }
  // Bu hafta: gün hedefi (pazartesi–pazar) ve en çok zorlanılan 3 kural
  function buHaftaKarti() {
    const gun = new Set(Object.keys(S.gunler || {}));
    S.gecmis.forEach(h => gun.add(new Date(h.tarih).toISOString().slice(0, 10))); (S.okuma || []).forEach(o => gun.add(new Date(o.t).toISOString().slice(0, 10)));
    const pzt = new Date(); pzt.setHours(12, 0, 0, 0); pzt.setDate(pzt.getDate() - ((pzt.getDay() + 6) % 7));
    const hafta = [...Array(7)].map((_, i) => { const d = new Date(pzt.getTime() + i * GUN); const k = d.toISOString().slice(0, 10); return { k, ad: d.toLocaleDateString(DIL === 'en' ? 'en-GB' : 'tr-TR', { weekday: 'narrow' }), v: gun.has(k), bugun: k === bugun() }; });
    const hedef = S.ayar.haftaHedef || 5, yapilan = hafta.filter(x => x.v).length;
    // kural bazında zayıflık (testlerdeki doğru oranı)
    const ist = {};
    for (const [k, v] of Object.entries(S.srs)) { const p = k.split(':'), u = unitById(p[1]); if (!u) continue; const ex = p[0] === 'e' ? u.ornek[+p[2]] : null; if (p[0] === 'e' && !ex) continue;
      const ad = ex ? R[ex.k].ad : u.ad, x = ist[ad] = ist[ad] || { d: 0, y: 0, u: u.id }; x.d += v.dogru || 0; x.y += v.yanlis || 0; }
    const zor = Object.entries(ist).map(([ad, x]) => ({ ad, u: x.u, n: x.d + x.y, oran: Math.round(x.d / Math.max(1, x.d + x.y) * 100) })).filter(x => x.n >= 3 && x.oran < 80).sort((a, b) => a.oran - b.oran).slice(0, 3);
    return `<h2 class="baslik">${t('Bu hafta')}</h2><article class="kart bu-hafta">
      <div class="satir-bilgi"><b>${t('{0}/{1} gün çalıştın', yapilan, hedef)}</b>${yapilan >= hedef ? `<span class="rozet ok">${t('Hedef tamam ✓')}</span>` : ''}</div>
      <div class="hafta-gun">${hafta.map(x => `<span class="${x.v ? 'dolu' : ''} ${x.bugun ? 'bugun' : ''}"><i>${x.v ? '✓' : ''}</i><small>${esc(x.ad)}</small></span>`).join('')}</div>
      <p class="soluk kucukyazi">${t('Haftalık hedef:')} ${[3, 5, 7].map(k => `<button class="cip ${hedef === k ? 'aktif' : ''}" data-hhedef="${k}">${t('{0} gün', k)}</button>`).join(' ')}</p>
      ${(S.gs || {}).gun ? `<p class="kucukyazi">🎯 ${t('Günün sorusu: {0} gün cevapladın, {1} doğru.', S.gs.gun, S.gs.dogru || 0)}</p>` : ''}
      ${zor.length ? `<h3>${t('🎯 En çok zorlandığın kurallar')}</h3>${zor.map(x => `<button class="hk" data-git="ders|${x.u}"><span>${esc(x.ad)}</span><b class="kirmizi">${yuzdeStr(x.oran)}</b></button>`).join('')}` : ''}
    </article>`;
  }
  EKRAN.ilerleme = function () {
    const toplam = U.length, gecilen = U.filter(u => gecti(u.id)).length, yuzde = Math.round(gecilen / toplam * 100);
    const g = S.gecmis.filter(h => h.tur !== 'alistirma');
    const ort = a => a.length ? Math.round(a.reduce((x, y) => x + y.yuzde, 0) / a.length) : null;
    const son10 = ort(g.slice(-10));
    const hafta = ts => Math.floor((simdi() - ts) / (7 * GUN));
    const buHafta = g.filter(h => hafta(h.tarih) === 0), gecenHafta = g.filter(h => hafta(h.tarih) === 1);
    const ezberAyet = Object.values(S.ezber || {}).reduce((a, e) => a + (e.tam ? (e.toplam || e.a || 0) : (e.a || 0)), 0);
    const siradaki = U.find(u => !gecti(u.id));
    const seviye = gecti('x4') ? t('Tamamlandı') : !siradaki ? '—' : ['e1', 'u0'].includes(siradaki.id) ? t('Başlangıç') : U.indexOf(siradaki) <= U.findIndex(u => u.id === 'x1') ? t('Temel') : U.indexOf(siradaki) <= U.findIndex(u => u.id === 'x2') ? t('Orta') : t('İleri');
    // son 12 hafta etkinlik ızgarası
    const sayi = {}; S.gecmis.forEach(h => { const k = new Date(h.tarih).toISOString().slice(0, 10); sayi[k] = (sayi[k] || 0) + 1; });
    const bugunD = new Date(); bugunD.setHours(12, 0, 0, 0); const haftaGunu = (bugunD.getDay() + 6) % 7;
    const bas = new Date(bugunD.getTime() - (77 + haftaGunu) * GUN);
    let izgara = ''; for (let i = 0; i < 84; i++) { const d = new Date(bas.getTime() + i * GUN); const k = d.toISOString().slice(0, 10); const n = sayi[k] || 0; const ileri = d > bugunD; izgara += `<i class="s${ileri ? 'x' : n >= 6 ? 4 : n >= 3 ? 3 : n >= 2 ? 2 : n ? 1 : 0}" title="${k}: ${n}"></i>`; }
    const aktifGun = Object.keys(sayi).filter(k => (simdi() - new Date(k).getTime()) < 84 * GUN).length;
    // bölüm hâkimiyeti (aralıklı tekrar kutularından)
    const hakim = {}; Object.entries(S.srs).forEach(([k, v]) => { const id = k.split(':')[1]; if (!unitById(id)) return; (hakim[id] = hakim[id] || []).push(v.kutu || 0); });
    const hk = Object.entries(hakim).filter(([, l]) => l.length >= 3).map(([id, l]) => ({ u: unitById(id), p: Math.round(l.reduce((a, b) => a + b, 0) / l.length / 6 * 100) })).sort((a, b) => b.p - a.p);
    const guclu = hk.slice(0, 3), zayif = hk.slice(-3).reverse().filter(x => !guclu.includes(x) && x.p < 70);
    const rz = rozetler();
    app.innerHTML = `${ust(t('İlerleme tablosu'))}<main class="pano">
      <section class="pano-ust">
        <div class="halka buyuk" style="--p:${yuzde}"><b>${yuzdeStr(yuzde)}</b><small>${gecilen}/${toplam} ${t('bölüm')}</small></div>
        <div><small class="soluk">${t('Seviye')}</small><h2>${seviye}</h2>
          <p class="soluk">${siradaki ? t('Sıradaki: ') + esc(siradaki.ad) : t('Maşallah! Bütün müfredatı bitirdin. 🎉')}</p>
          ${siradaki ? `<button class="btn kucuk" data-git="${siradaki.ara ? 'sinavGiris|' + siradaki.id : 'ders|' + siradaki.id}">${t('Devam et')}</button>` : ''}</div>
      </section>
      <div class="pano-kutular">
        <div><span>🔥</span><b>${S.seri.gun || 0}</b><small>${t('gün seri')}${S.seri.en > (S.seri.gun || 0) ? ' · ' + t('en uzun {0}', S.seri.en) : ''}</small></div>
        <div><span>📝</span><b>${g.length}</b><small>${t('test')}</small></div>
        <div><span>📈</span><b>${son10 == null ? '—' : yuzdeStr(son10)}</b><small>${t('son 10 ortalama')}</small></div>
        <div><span>🗓️</span><b>${buHafta.length}</b><small>${t('bu hafta test')}${gecenHafta.length ? ` · ${buHafta.length >= gecenHafta.length ? '▲' : '▼'} ${t('geçen hafta {0}', gecenHafta.length)}` : ''}</small></div>
        <div><span>🧠</span><b>${ezberAyet}</b><small>${t('ezber âyet')}</small></div>
        <div><span>🔁</span><b>${vadesiGelenler().length}</b><small>${t('tekrar bekleyen')}</small></div>
      </div>
      ${buHaftaKarti()}
      <h2 class="baslik">${t('Konu grupları')}</h2>
      <article class="kart">${GRUPLAR.map(([ad, idler]) => { const l = idler.filter(unitById), b = l.filter(gecti).length; const p = l.length ? Math.round(b / l.length * 100) : 0; return `<div class="grup-cubuk"><div class="satir-bilgi"><b>${ad}</b><small>${b}/${l.length}</small></div><div class="pano-cubuk"><div style="width:${p}%"></div></div></div>`; }).join('')}</article>
      <h2 class="baslik">${t('Etkinlik (son 12 hafta)')}</h2>
      <article class="kart"><div class="izgara">${izgara}</div><div class="izgara-alt"><small class="soluk">${t('{0} gün çalıştın', aktifGun)}</small><span class="izgara-lejant"><small>${t('Az')}</small><i class="s1"></i><i class="s2"></i><i class="s3"></i><i class="s4"></i><small>${t('Çok')}</small></span></div></article>
      ${hk.length ? `<h2 class="baslik">${t('Hâkimiyet')}</h2><div class="iki-sutun">
        <article class="kart"><h3>${t('💪 Güçlü olduğun')}</h3>${guclu.map(x => `<div class="hk"><span>${x.u.ikon} ${esc(x.u.ad)}</span><b class="yesil">${yuzdeStr(x.p)}</b></div>`).join('')}</article>
        <article class="kart"><h3>${t('🎯 Çalışman gereken')}</h3>${zayif.length ? zayif.map(x => `<button class="hk" data-git="ders|${x.u.id}"><span>${x.u.ikon} ${esc(x.u.ad)}</span><b class="kirmizi">${yuzdeStr(x.p)}</b></button>`).join('') : `<p class="soluk">${t('Zayıf konu görünmüyor. Böyle devam!')}</p>`}</article></div>` : ''}
      <h2 class="baslik">${t('Rozetler')} <small class="soluk">${rz.filter(r => r[3]).length}/${rz.length}</small></h2>
      <div class="rozetler">${rz.map(([ik, ad, alt, ok]) => `<div class="${ok ? 'kazanildi' : ''}"><span>${ik}</span><b>${ad}</b><small>${alt}</small></div>`).join('')}</div>
      <button class="btn ikincil genis" data-git="gecmis" style="margin-top:14px">${t('📈 Bütün test geçmişi')}</button>
    </main>`;
    app.querySelectorAll('[data-hhedef]').forEach(b => b.onclick = () => { S.ayar.haftaHedef = +b.dataset.hhedef; kaydet(); ciz(); });
  };

  function acilisGoster() {
    if (navigator.webdriver) return;   // otomatik testlerde atla
    try { if (sessionStorage.getItem('hk.acilisYok')) { sessionStorage.removeItem('hk.acilisYok'); return; } } catch (e) { }
    // Hadis günde bir kez tam süre gösterilir; sonraki açılışlarda kısa
    let kisa = false; try { kisa = localStorage.getItem('hk.acilisGun') === bugun(); localStorage.setItem('hk.acilisGun', bugun()); } catch (e) { }
    const d = document.createElement('div'); d.className = 'acilis';
    d.innerHTML = `<div class="acilis-ic"><img class="acilis-logo" src="icons/icon-512.png" alt=""><h1>${t('Kur\'an Yolum')}</h1>
      <p class="acilis-ar" dir="rtl" lang="ar">${HADIS_AR}</p><p class="acilis-tr">${hadisMetni()}</p><p class="acilis-kaynak">${hadisKaynak()}</p>
      <p class="acilis-dokun">${t('Devam etmek için dokun')}</p></div>`;
    document.body.appendChild(d);
    const kapat = () => { if (!d.isConnected) return; d.classList.add('gizlen'); setTimeout(() => d.remove(), 450); };
    d.onclick = kapat; setTimeout(kapat, kisa ? 1000 : 2600);
  }
  // Çocuk modu (cocuk.js) bağlanır
  const COCUK = window.CocukModu ? window.CocukModu({ EKRAN, git, anaSayfa, ust, kaydet, bugun, seriGuncelle, toast, S: () => S, profil: AKTIF, ciz: () => ciz(), ekranDegistir, buyugeGec: s_ => buyugeGec(s_), sureSes: n => sureSesDurum(n), ayetCal: (r, btn, bitince) => cal(ayetUrl(r, 'Husary_Muallim_128kbps'), btn, undefined, bitince), odevler: () => cocukOdevleri(), sure: n => SURE(n), sureYukle: n => sureYukle(n), kelimeCal: (r, w, btn) => cal(kelimeUrl(r, w), btn), ayetOku: async (n, a, blob) => (await okumaHazirla()).ayetRaporu(n, a, blob) }) : null;
  // ------------------------------------------------------------ MEŞK MODU (özel: Ayarlar'dan açılır)
  // Geleneksel meşk: hoca parça parça okur, öğrenci tekrar eder, hata düzeltilir; parça yeterince doğru
  // okununca sonrakine geçilir, sonunda ayetin tamamı birlikte okunur.
  const MESK = { n: 0, a: 0, p: 0, dogru: 0, kayit: null, sonuc: null, bekliyor: false };
  function meskParcalar(n, a) {
    const w = SURE(n).ayet[a - 1].split(' '), l = [];
    const boy = w.length <= 4 ? w.length : 3;
    for (let i = 0; i < w.length; i += boy) l.push([i, Math.min(w.length, i + boy) - 1]);
    if (l.length > 1 && l[l.length - 1][1] - l[l.length - 1][0] < 1) { const s = l.pop(); l[l.length - 1][1] = s[1]; }   // tek kelime kalmasın
    if (l.length > 1) l.push([0, w.length - 1]);   // en sonda ayetin tamamı
    return l;
  }
  // Fonetik referansın bir kelime aralığı (parçayı ayrı değerlendirmek için)
  function altRef(ref, i, j) {
    const P = Array.from(ref.p), o = ref.sp[i][0], z = ref.sp[j][1];
    return { p: P.slice(o, z).join(''), sp: ref.sp.slice(i, j + 1).map(([x, y]) => [x - o, y - o]), u: ref.u.filter(x => x[3] >= i && x[3] <= j).map(x => [x[0] - o, x[1] - o, x[2], x[3] - i, ...x.slice(4)]) };
  }

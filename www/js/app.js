/* Kur'an Yolum — Ebeveyn özeti ve uygulama başlatma */
/* app.js bölündü: bu dosyalar sırayla yüklenir, aynı genel kapsamı paylaşır (bkz. TODO.md). */
'use strict';
  // ------------------------------------------------------------ ebeveyn özeti (çocuk profilleri)
  function profilVerisi(p) {
    if (p.id === PR.aktif) return S;
    try { return JSON.parse(localStorage.getItem(p.id === 'p1' ? 'tecvid-ogren.v1' : 'tecvid-ogren.v1.' + p.id) || '{}'); } catch (e) { return {}; }
  }
  EKRAN.ebeveynOzet = function () {
    const cocuklar = PR.liste.filter(p => p.yas === 'kucuk' || p.yas === 'cocuk');
    const DURAK = COCUK ? COCUK.DURAK : [], hafta = simdi() - 7 * GUN;
    const kart = p => {
      const v = profilVerisi(p), c = v.cocuk || { d: {}, gun: {} }, d = c.d || {}, gun = c.gun || {};
      const buHaftaGun = Object.keys(gun).filter(k => new Date(k).getTime() >= hafta - GUN);
      const yildizHafta = buHaftaGun.reduce((a, k) => a + gun[k], 0);
      const durakHafta = Object.values(d).filter(x => x.t >= hafta).length;
      const harfTop = DURAK.filter(x => x.tur === 'harf').length, harf = c.gec && c.gec.harf ? harfTop : DURAK.filter(x => x.tur === 'harf' && d[x.id] && d[x.id].y).length;
      const sira = DURAK.find(x => !(d[x.id] && d[x.id].y));
      const karisan = Object.entries(c.hata || {}).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const dkHafta = Math.round(Object.entries(c.sure || {}).filter(([k]) => new Date(k).getTime() >= hafta - GUN).reduce((a, [, v]) => a + v, 0));
      const birlikte = p.yas === 'kucuk' ? `<p class="oneri">👨‍👩‍👧 ${t('4–6 yaşta en iyi öğrenme, sizin yanında olduğunuz kısa oturumlarla olur. Haftada 2 gün birlikte oturun; harfi sizin sesinizden duysun. 15 dakikadan sonra uygulama mola önerir.')}</p>` : '';
      const oneri = !buHaftaGun.length ? t('Bu hafta hiç çalışılmamış. Her gün 5 dakikalık tek bir durak yeterli.')
        : karisan.length ? t('Karıştırılan harfleri birlikte tekrar edin. Harfin sesini sizden duyması çok faydalıdır.') : t('Güzel gidiyor! Her gün kısa ve düzenli çalışmaya devam.');
      return `<article class="kart ozet-kart"><div class="profil-satir" style="padding:0">${avatar(p)}<div class="bad"><b>${esc(p.ad || t('Profil {0}', PR.liste.indexOf(p) + 1))}</b><small>${YAS_AD[p.yas]}</small></div></div>
        <div class="c-istat"><div><b>${buHaftaGun.length}/7</b><small>${t('bu hafta çalıştığı gün')}</small></div><div><b>★ ${yildizHafta}</b><small>${t('bu hafta yıldız')}</small></div><div><b>${durakHafta}</b><small>${t('bu hafta durak')}</small></div></div>
        <div class="grup-cubuk" style="margin-top:12px"><div class="satir-bilgi"><b>${t('Öğrenilen harfler')}</b><small>${harf}/${harfTop}</small></div><div class="pano-cubuk"><div style="width:${Math.round(harf / Math.max(1, harfTop) * 100)}%"></div></div></div>
        <p><b>${t('Sıradaki durak:')}</b> ${sira ? esc(sira.ad) : t('Hepsi bitti 🎉')}</p>
        ${karisan.length ? `<p><b>${t('En çok karıştırdığı:')}</b></p><ul class="karisan">${karisan.map(([k, n]) => { const [a, b] = k.split('|'); return `<li><span class="ar">${a}</span> ${t('yerine')} <span class="ar">${b}</span> <small class="soluk">${t('({0} kez)', n)}</small></li>`; }).join('')}</ul>` : ''}
        ${dkHafta ? `<p class="soluk kucukyazi">⏱️ ${t('Bu hafta uygulamada yaklaşık {0} dakika geçirdi.', dkHafta)}</p>` : ''}
        <p class="oneri">💡 ${oneri}</p>${birlikte}</article>`;
    };
    app.innerHTML = `${ust(t('Çocuk özeti'))}<main>
      ${cocuklar.length ? cocuklar.map(kart).join('') : `<article class="kart"><p>${t('Henüz çocuk profili yok. Profiller bölümünden 4–6 ya da 7–12 yaş için profil ekleyebilirsin.')}</p><button class="btn" data-git="profiller">${t('Profiller')}</button></article>`}
      ${cocuklar.length && COCUK && COCUK.HarfSesSayi && COCUK.HarfSesSayi() === 0 ? `<article class="kart hesap-uyari"><div><h2>${t('🎙️ Harf sesleri henüz kaydedilmedi')}</h2><p>${t('Çocuğunuz harfleri sizin ya da hocasının sesinden duyarsa çok daha iyi öğrenir. Her harfi bir kez kaydetmeniz yeterli; “dinle ve bul” oyunları da açılır.')}</p></div><button class="btn" data-git="harfSesleri">${t('Harf seslerini kaydet')}</button></article>` : ''}
      ${cocuklar.length ? `<article class="kart"><h2>${t('📅 Haftalık hatırlatma')}</h2>${LN() ? `<p>${t('Her pazar akşamı bu özete birlikte bakmanız için telefonunuza bir bildirim gelsin.')}</p>
        <label class="anahtar-satir"><input type="checkbox" id="haftaOzet" ${(S.ayar.haftaOzet || {}).acik ? 'checked' : ''}> ${t('Pazar akşamı hatırlat')}</label>
        <input type="time" id="haftaSaat" value="${(S.ayar.haftaOzet || {}).saat || '19:00'}">` : `<p class="soluk">${t('Bildirim hatırlatması Android uygulamasında çalışır. Burada her pazar ve pazartesi ana sayfada bir kart görürsünüz.')}</p>`}</article>` : ''}
      <p class="soluk kucukyazi">${t('Özet bu telefondaki verilerden hazırlanır.')}</p></main>`;
    const ho = $('#haftaOzet'), hs = $('#haftaSaat');
    const kur = async () => { S.ayar.haftaOzet = { acik: ho.checked, saat: hs.value || '19:00' }; kaydet(); const ok = await haftaOzetKur(true); if (ho.checked && !ok) { ho.checked = false; S.ayar.haftaOzet.acik = false; kaydet(); toast(t('Bildirim izni verilmedi. Telefon ayarlarından Kur\'an Yolum için bildirimlere izin ver.')); } else if (ho.checked) toast(t('Tamam, her pazar {0}\'de hatırlatacağım.', hs.value)); };
    if (ho) { ho.onchange = kur; hs.onchange = () => { if (ho.checked) kur(); }; }
  };
  // Haftalık çocuk özeti bildirimi: önümüzdeki 4 pazar, seçilen saatte (yalnız ayarı açan profilde kurulur/silinir)
  const HAFTA_ID = [7200, 7201, 7202, 7203];
  async function haftaOzetKur(izinIste) {
    const ln = LN(), h = S.ayar.haftaOzet; if (!ln || !h) return false;
    try {
      await ln.cancel({ notifications: HAFTA_ID.map(id => ({ id })) });
      if (!h.acik) return true;
      let izin = await ln.checkPermissions();
      if (izin.display !== 'granted' && izinIste) izin = await ln.requestPermissions();
      if (izin.display !== 'granted') return false;
      const [sa, dk] = (h.saat || '19:00').split(':').map(Number), l = [];
      const at = new Date(); at.setHours(sa, dk, 0, 0); at.setDate(at.getDate() + ((7 - at.getDay()) % 7));
      if (at.getTime() <= Date.now() + 60000) at.setDate(at.getDate() + 7);
      for (let i = 0; i < 4; i++) { const z = new Date(at); z.setDate(z.getDate() + 7 * i); l.push({ isExactNotification: false, id: HAFTA_ID[i], title: t('Kur\'an Yolum'), body: t('📊 Haftalık çocuk özeti hazır. Bu hafta neler öğrendiklerine birlikte bakın.'), schedule: { at: z, allowWhileIdle: true }, extra: { git: 'ebeveynOzet' } }); }
      await ln.schedule({ notifications: l });
      return true;
    } catch (e) { console.warn('haftalık özet', e); return false; }
  }
  (() => { const ln = LN(); if (!ln || !ln.addListener) return;
    try { Promise.resolve(ln.addListener('localNotificationActionPerformed', e => { const g = e && e.notification && e.notification.extra && e.notification.extra.git; if (g && !cocukMu()) git(g); })).catch(() => { }); } catch (e) { } })();
  // Pazar ve pazartesi: çocuk profili olan büyüklere ana sayfada haftalık özet kartı
  function haftaOzetKarti() {
    const g = new Date().getDay(); if (g !== 0 && g !== 1) return '';
    if (!PR.liste.some(p => p.yas === 'kucuk' || p.yas === 'cocuk')) return '';
    if (S.ayar.haftaKartKapali && Date.now() - S.ayar.haftaKartKapali < 3 * GUN) return '';
    return `<section class="kart hafta-ozet-kart"><div><h2>${t('📊 Haftalık çocuk özeti hazır')}</h2><p>${t('Bu hafta neler öğrendiklerine birlikte bakın.')}</p></div>
      <div class="satir sola"><button class="btn" data-git="ebeveynOzet">${t('Özete bak')}</button><button class="btn ikincil" id="haftaKapat">${t('Sonra')}</button></div></section>`;
  }

  // Çocuk sûreleri: Husarî (öğretim) sesleri telefona indirilir (yalnız Android uygulamasında)
  function sureSesDurum(n) {
    if (!FS()) return null;
    const l = indirListesi('Husary_Muallim_128kbps', n).concat(n !== 1 ? [ayetUrl('1:1', 'Husary_Muallim_128kbps')] : []);
    return { var: indirilenSay(l), toplam: l.length, indir: () => indirBaslat(l, '').then(() => { yerelKaydet(); if (ekranYigini[ekranYigini.length - 1][0] === 'cocukDurak') ciz(); }) };
  }
  // Çocuk profili harf yolculuğunu bitirince: ebeveyn onayıyla tecvid derslerine geçiş
  async function buyugeGec(seviye) {
    if (!(await window.ebeveynKilidi())) return;
    const p = AKTIF(); p.yas = 'buyuk'; p.d = simdi(); profilKaydet(); profilleriEsitle();
    (seviye === 'okur' ? ['e1', 'u0'] : ['e1']).forEach(id => { if (!gecti(id)) S.ilerleme[id] = { en: 0, deneme: 0, gecti: true, atla: true }; });
    S.ayar.seviye = seviye === 'okur' ? 'okur' : 'harf'; kaydet(); toast(t('Tecvid derslerine geçtin. Bârekallah!')); anaSayfa();
  }

  // İlk kez açan yetişkine kısa tanıtım (kapatılabilir kart)
  function tanitimKarti() {
    if (S.ayar.tanitim) return '';
    const k = [['📅', t('Bugünkü dersim'), t('Her gün buradan başla: tekrar, yeni ders, alıştırma.'), 'gunluk'],
      ['📖', t('Tecvid'), t('Bölümler sırayla açılır; biliyorsan doğrudan teste gir.'), 'tecvid'],
      ['🕌', t('Kur\'an'), t('Renkli tecvid, kâri sesi ve yapay zekâ okuma kontrolü.'), 'sureler'],
      ['🧭', t('Sûre sûre tecvid'), t('Ayet ayet: önce sen bul, sonra öğren.'), 'sureTecvidSec']];
    return `<section class="kart tanitim"><h2>${t('👋 Hoş geldin! Uygulamada neler var?')}</h2>
      <div class="tanitim-izgara">${k.map(([ik, ad, ac, g]) => `<button data-git="${g}"><span>${ik}</span><b>${ad}</b><small>${ac}</small></button>`).join('')}</div>
      <p class="soluk kucukyazi">${t('Ezber Kur\'an sekmesinde; testler Tecvid sekmesinde; ayarlar ve sınıf Ben sekmesinde.')}</p>
      <button class="btn kucuk" id="tanitimKapat">${t('Anladım')}</button></section>`;
  }

  function basla() {
    let secildi = false; try { secildi = sessionStorage.getItem('hk.secildi') === '1'; } catch (e) { }
    if (PR.liste.length > 1 && !secildi) { ekranYigini = [['kimCalisiyor', []]]; ciz(); return; }
    if (!AKTIF().yas) { ekranYigini = [['hosgeldin', []]]; ciz(); return; }
    if (seviyeSorulmali()) { ekranYigini = [['hosgeldin', ['seviye']]]; ciz(); return; }
    anaSayfa();
  }
  acilisGoster();
  basla();
  bulutBagla();
  hatirlatmaKur(false);
  window.__TECVID = { eba: () => EBA, KELIME_MEAL_KAYNAK, MUSHAF_RESIM, yakinEsle, canliTolerans, canliOrtamKontrol, canliHizCarpani, tk: () => TK, TAKIP_HATA, MEAL_KAYNAK, canliTest: { kur: o => { CANLI = o; }, durum: () => canliDurumGuncelle(), gec: () => canliKelimeGec(), sira: () => canliSiraIsaretle(), durdur: x => canliDurdur(x) }, git: (...a) => git(...a), ana: () => anaSayfa(), S: () => S, PR: () => PR, COCUK, mujdeHTML, soruUret, anahtarlar, dogru: () => oturum && oturum.sorular[oturum.i] && oturum.sorular[oturum.i].dogru, U, kaydet: v => { S = v; kaydet(); anaSayfa(); } }; // test için

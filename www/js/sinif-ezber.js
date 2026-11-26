/* Kur'an Yolum — Sınıf (hoca–öğrenci), ezber/hıfz, Tekrarla */
/* app.js bölündü: bu dosyalar sırayla yüklenir, aynı genel kapsamı paylaşır (bkz. TODO.md). */
'use strict';
  // ------------------------------------------------------------ sınıf (hoca–öğrenci)
  // Öğrenci birden çok sınıfa katılabilir: S.siniflar = [{ kod, ad, sinifAd }]. Özet, eşitlemede her sınıfa gönderilir.
  const ogrSiniflari = () => { if (!S.siniflar) { S.siniflar = S.sinif ? [S.sinif] : []; delete S.sinif; } return S.siniflar; };
  const SB = {};   // sınıf bilgisi önbelleği: kod → { s, z }
  const odevSonStr = s => s ? new Date(s + 'T12:00:00').toLocaleDateString(DIL === 'en' ? 'en-GB' : 'tr-TR', { day: 'numeric', month: 'long' }) : '';
  function ozetHazirla() {
    const b = {}; U.forEach(u => { const il = S.ilerleme[u.id]; if (il && (il.deneme || il.gecti)) b[u.id] = [il.en || 0, il.gecti ? 1 : 0]; });
    const son = S.gecmis.slice(-8).reverse().map(h => ({ k: h.kimlik || null, b: h.baslik, y: h.yuzde, t: h.tarih }));
    const ez = {}; Object.entries(S.ezber || {}).forEach(([n, e]) => { ez[n] = [e.a, e.tam ? 1 : 0]; });
    const puanli = S.gecmis.filter(h => h.tur !== 'alistirma').slice(-20);
    const ok = S.okuma || [];
    const dk = {}; if (cocukMu() && S.cocuk && S.cocuk.d) Object.entries(S.cocuk.d).forEach(([id, v]) => { if (v && v.y) dk[id] = v.y; });
    return { dk, gizli: !!S.ayar.siralamaGizli, cocuk: cocukMu(), yildiz: cocukMu() && COCUK ? COCUK.toplamYildiz() : 0, ez, gecilen: U.filter(u => gecti(u.id)).length, toplam: U.length, b, son, seri: S.seri.gun || 0, seriSon: S.seri.son || '', test: S.gecmis.length, tekrar: vadesiGelenler().length,
      ort: puanli.length ? Math.round(puanli.reduce((s, h) => s + h.yuzde, 0) / puanli.length) : null, ezAyet: Object.values(S.ezber || {}).reduce((s, e) => s + (e.a || 0), 0),
      ok: [ok.length, ok.filter(x => !x.j && !x.k).length], ko: koSonGunler(7), zaman: Date.now() };
  }
  // Kur'an okuma: son n günün okunan sayfa sayısı { 'YYYY-MM-DD': adet } (hoca raporu için)
  function koSonGunler(n) { const g = (S.kuran && S.kuran.gun) || {}, o = {}; for (let i = 0; i < n; i++) { const d = new Date(simdi() - i * GUN).toISOString().slice(0, 10); if (g[d] && g[d].length) o[d] = g[d].length; } return o; }
  const koGunSay = (z, gun) => ((z && z.ko) || {})[gun] || 0;
  const koHafta = z => Object.entries((z && z.ko) || {}).filter(([d]) => d > new Date(simdi() - 7 * GUN).toISOString().slice(0, 10)).reduce((a, [, v]) => a + v, 0);
  async function ozetiGonder() {
    if (!girisli() || !B().ozetGonder) return;
    for (const c of ogrSiniflari()) await B().ozetGonder(c.kod, c.ad, ozetHazirla());
  }
  async function sinifBilgiGetir(kod, zorla) {
    if (!girisli()) return null;
    const c = SB[kod]; if (!zorla && c && Date.now() - c.z < 10 * 60000) return c.s;
    try {
      const s = await B().sinifGetir(kod);
      if (!s) { const l = ogrSiniflari(), i = l.findIndex(x => x.kod === kod); if (i >= 0) { toast(t('"{0}" sınıfı kapatıldı.', l[i].sinifAd || kod)); l.splice(i, 1); kaydet(); } delete SB[kod]; return null; }
      SB[kod] = { s, z: Date.now() }; return s;
    } catch (e) { return c ? c.s : null; }
  }
  // Ana sayfadaki ödev kartları (her sınıf için)
  // Çocuk profili: hocanın verdiği Harf Yolculuğu durağı ödevleri ('d:<durak>')
  function cocukOdevleri() {
    if (!girisli() || !ogrSiniflari().length) return Promise.resolve([]);
    return Promise.all(ogrSiniflari().map(c => sinifBilgiGetir(c.kod))).then(l => l.filter(x => x && x.odev && String(x.odev.birim || '').startsWith('d:'))
      .map(x => ({ sinif: x.ad || '', durak: x.odev.birim.slice(2), not: x.odev.not || '', son: x.odev.son || null, sonStr: x.odev.son ? odevSonStr(x.odev.son) : '' }))).catch(() => []);
  }
  function odevKartiDoldur() {
    const yer = $('#odevYer'); if (!yer || !girisli() || !ogrSiniflari().length) return;
    Promise.all(ogrSiniflari().map(c => sinifBilgiGetir(c.kod))).then(l => {
      if (!document.body.contains(yer)) return;
      const okuma = l.filter(s => s && s.okuma && s.okuma.sayfa).sort((a, b) => b.okuma.sayfa - a.okuma.sayfa)[0];
      if (okuma) koOdevUygula(okuma);
      yer.innerHTML = (okuma ? koOdevKarti(okuma) : '') + l.filter(s => s && s.odev && s.odev.birim && unitById(s.odev.birim)).map(s => {
        const o = s.odev, u = unitById(o.birim), bitti = gecti(o.birim), gecikti = o.son && !bitti && o.son < bugun();
        return `<section class="kart tekrar ${bitti ? '' : 'vurgulu'}" style="margin-bottom:14px"><div><h2>${t('📌 Ödev')} · <span class="soluk" style="font-weight:500">${esc(s.ad || '')}</span></h2>
          <p><b>${u.ikon} ${esc(u.ad)}</b>${o.son ? ` · ${gecikti ? '<span class="kirmizi">' : ''}${t('son gün: {0}', odevSonStr(o.son))}${gecikti ? '</span>' : ''}` : ''}</p>
          ${o.not ? `<p class="soluk">“${esc(o.not)}”</p>` : ''}
          <p>${bitti ? `<span class="yesil">${t('✓ Tamamladın ({0})', yuzdeStr(S.ilerleme[o.birim].en))}</span>` : t('Bölüm testinden {0} al, ödev tamamlansın.', yuzdeStr(GECME))}</p></div>
          ${bitti ? '' : `<button class="btn" data-git="${u.ara ? 'sinavGiris|' + u.id : 'ders|' + u.id}">${t('Başla')}</button>`}</section>`;
      }).join('');
    });
  }
  // Hocanın günlük Kur'an okuma ödevi: öğrencinin günlük hedefi ödevden az olamaz
  function koOdevUygula(s) {
    const k = KO(), n = s.okuma.sayfa; if (k.odevSayfa === n && k.hedef >= n) return;
    k.odevSayfa = n; if (k.hedef < n) { k.hedef = n; toast(t('Hocanın ödevine göre günlük okuma hedefin {0} sayfa oldu.', n)); } kaydet();
  }
  function koOdevKarti(s) {
    const n = s.okuma.sayfa, bu = koBugun(), tamam = bu >= n, son = KO().son;
    return `<section class="kart tekrar ${tamam ? '' : 'vurgulu'}" style="margin-bottom:14px"><div><h2>${t('📌 Ödev')} · <span class="soluk" style="font-weight:500">${esc(s.ad || '')}</span></h2>
      <p><b>${t('Her gün {0} sayfa Kur\'an oku', n)}</b></p>
      <p>${tamam ? `<span class="yesil">${t('✓ Bugünkü okuman tamam ({0} sayfa)', bu)}</span>` : t('Bugün {0}/{1} sayfa', bu, n)}</p></div>
      ${tamam ? '' : `<button class="btn" data-git="sayfa|${son ? son.p : S.sonSayfa || 1}|${son && son.n ? son.n + ':' + son.a : ''}">${t('Oku')}</button>`}</section>`;
  }
  // Sınıf içi karşılaştırma tablosu (sınıftaki herkes görür)
  const SIRALA = [['ad', 'Ad'], ['gecilen', 'Bölüm'], ['ort', 'Ort.'], ['ezAyet', 'Ezber'], ['ok', 'Okuma'], ['seri', 'Seri']];
  function siralamaHTML(ogrenciler, olcut, benim, hoca) {
    const adGoster = x => x.ozet && x.ozet.gizli && !hoca && x.uid !== benim ? t('Bir öğrenci') : (x.ad || '?');
    const deger = (x, k) => { const z = x.ozet || {}; return k === 'ad' ? String(x.ad || '').toLocaleLowerCase('tr') : k === 'ok' ? (z.ok && z.ok[0] ? z.ok[1] / z.ok[0] : -1) : (z[k] == null ? -1 : z[k]); };
    const l = ogrenciler.slice().sort((a, b) => olcut === 'ad' ? (deger(a, 'ad') < deger(b, 'ad') ? -1 : 1) : (deger(b, olcut) - deger(a, olcut)) || (deger(b, 'gecilen') - deger(a, 'gecilen')));
    const madalya = i => olcut === 'ad' ? '' : ['🥇', '🥈', '🥉'][i] || (i + 1);
    return `<div class="sirala-kap"><table class="sirala"><thead><tr><th></th>${SIRALA.map(([k, ad]) => `<th class="${k === olcut ? 'aktif' : ''}" data-sirala="${k}">${t(ad)}${k === olcut && k !== 'ad' ? ' ▼' : ''}</th>`).join('')}</tr></thead><tbody>
      ${l.map((x, i) => { const z = x.ozet || {}; return `<tr class="${x.uid === benim ? 'ben' : ''}"><td>${madalya(i)}</td><td>${esc(adGoster(x))}</td><td>${z.gecilen || 0}/${z.toplam || U.length}</td><td>${z.ort == null ? '—' : yuzdeStr(z.ort)}</td><td>${z.ezAyet || 0}</td><td>${z.ok && z.ok[0] ? yuzdeStr(Math.round(z.ok[1] / z.ok[0] * 100)) : '—'}</td><td>🔥${z.seri || 0}</td></tr>`; }).join('')}</tbody></table></div>
      <p class="soluk kucukyazi">${t('Bölüm: geçilen bölüm · Ort.: son testlerin ortalaması · Ezber: ezberlenen ayet · Okuma: hatasız okunan ayet oranı. Başlığa dokunarak sırala.')}</p>`;
  }
  function siralamaBagla(kap, ogrenciler, benim, hoca) {
    // Çocuk profilinde sıralama yerine sınıfça ortak hedef gösterilir
    if (cocukMu() && !hoca) { const top = ogrenciler.reduce((a, x) => a + ((x.ozet || {}).yildiz || 0), 0), ben = (ogrenciler.find(x => x.uid === benim) || {}).ozet || {};
      kap.innerHTML = `<div class="sinif-hedef"><b>⭐ ${top}</b><span>${t('yıldızı sınıfça birlikte topladık!')}</span><small>${t('Senin katkın: {0} yıldız', ben.yildiz || 0)}</small></div>`; return; }
    const yaz = k => { kap.innerHTML = siralamaHTML(ogrenciler, k, benim, hoca); kap.querySelectorAll('[data-sirala]').forEach(th => th.onclick = () => yaz(th.dataset.sirala)); };
    yaz('gecilen');
  }

  function girisIste(baslik) {
    app.innerHTML = `${ust(baslik)}<main><article class="kart"><h2>${t('Önce giriş yap')}</h2>
      <p>${t('Sınıflar internet üzerinden çalışır. Hoca da öğrenci de bir hesapla giriş yapmalı.')}</p>
      <button class="btn" data-git="hesap">${t('Giriş yap / Hesap aç')}</button></article></main>`;
  }
  const mesgul = (btn, v) => { if (!btn) return; btn.disabled = v; btn.dataset.yazi = btn.dataset.yazi || btn.textContent; btn.textContent = v ? t('Bekle…') : btn.dataset.yazi; };

  EKRAN.sinif = function () {
    if (!B() || !B().hazir || !girisli()) return girisIste(t('Sınıf'));
    const k = B().kullanici(), l = ogrSiniflari();
    const varsayilanAd = (l[0] && l[0].ad) || k.displayName || (k.email || '').split('@')[0];
    app.innerHTML = `${ust(t('Sınıf'))}<main>
      <p class="soluk">${t('Hoca sınıf açar ve kodunu öğrencilerine verir. Öğrenci kodu girip katılır; hoca öğrencilerinin ilerlemesini görür ve ödev verir.')}</p>
      <h2 class="baslik">${t('🎓 Öğrenciyim')}</h2>
      <div class="bolumler">${l.map(c => `<button class="bolum" data-git="ogrSinif|${esc(c.kod)}"><span class="ikon">🎓</span><span class="bad"><small>${esc(c.kod)} · ${t('adın: {0}', esc(c.ad))}</small>${esc(c.sinifAd || c.kod)}</span><span class="rozet">›</span></button>`).join('')}</div>
      ${l.length ? `<details class="kart" style="margin-top:10px"><summary><b>${t('➕ Başka bir sınıfa katıl')}</b></summary>` : '<article class="kart">'}
        <div class="form"><label>${t('Sınıf kodu')}<input id="kod" maxlength="6" autocapitalize="characters" autocomplete="off" placeholder="${t('ör. K7M2QX')}" style="text-transform:uppercase;letter-spacing:.2em"></label>
          <label>${t('Adın (hocan bu adı görür)')}<input id="ad" maxlength="40" value="${esc(varsayilanAd)}"></label>
          <p class="hata" id="hata1"></p><button class="btn genis" id="katil">${t('Sınıfa katıl')}</button></div>
      ${l.length ? '</details>' : '</article>'}
      <h2 class="baslik">${t('👨‍🏫 Hocayım')}</h2>
      <article class="kart form"><label>${t('Yeni sınıfın adı')}<input id="sinifAd" maxlength="60" placeholder="${t('ör. Cuma kursu')}"></label>
        <p class="hata" id="hata2"></p><button class="btn genis" id="olustur">${t('Sınıf oluştur')}</button></article>
      <div id="siniflarim" class="bolumler"><p class="soluk">${t('Sınıfların yükleniyor…')}</p></div>
    </main>`;
    $('#katil').onclick = async e => {
      const kod = $('#kod').value.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''), ad = $('#ad').value.trim();
      const h = m => { $('#hata1').textContent = m || ''; }; h();
      if (kod.length !== 6) return h(t('Sınıf kodu 6 karakterdir.'));
      if (!ad) return h(t('Adını yaz.'));
      if (l.some(c => c.kod === kod)) return h(t('Bu sınıftasın zaten.'));
      const btn = e.currentTarget; mesgul(btn, true);
      try { const s = await B().sinifaKatil(kod, ad, ozetHazirla()); l.push({ kod, ad, sinifAd: s.ad || '' }); SB[kod] = { s, z: Date.now() }; kaydet(); toast(t('Sınıfa katıldın ✓')); git('ogrSinif', kod); }
      catch (x) { h(x.message); mesgul(btn, false); }
    };
    $('#olustur').onclick = async e => {
      const ad = $('#sinifAd').value.trim(); const h = m => { $('#hata2').textContent = m || ''; }; h();
      if (!ad) return h(t('Sınıfa bir ad ver.'));
      const btn = e.currentTarget; mesgul(btn, true);
      try { const kod = await B().sinifOlustur(ad); toast(t('Sınıf oluşturuldu ✓')); git('sinifDetay', kod); }
      catch (x) { h(x.message); mesgul(btn, false); }
    };
    B().siniflarim().then(l2 => {
      const yer = $('#siniflarim'); if (!yer) return;
      l2.sort((a, b) => ((b.olusturma && b.olusturma.toMillis ? b.olusturma.toMillis() : 0) - (a.olusturma && a.olusturma.toMillis ? a.olusturma.toMillis() : 0)));
      yer.innerHTML = l2.length ? l2.map(s => `<button class="bolum" data-git="sinifDetay|${esc(s.kod)}"><span class="ikon">👥</span><span class="bad"><small>${esc(s.kod)}</small>${esc(s.ad || '')}</span><span class="rozet">›</span></button>`).join('')
        : `<p class="soluk">${t('Henüz bir sınıf açmadın.')}</p>`;
    }).catch(e => { const yer = $('#siniflarim'); if (yer) yer.innerHTML = `<p class="hata">${esc(e.message)}</p>`; });
  };

  // Öğrencinin bir sınıfı: ödev, sıralama, dinletmeler
  EKRAN.ogrSinif = function (kod) {
    if (!B() || !B().hazir || !girisli()) return girisIste(t('Sınıf'));
    const c = ogrSiniflari().find(x => x.kod === kod); if (!c) { ekranYigini.pop(); return ciz(); }
    app.innerHTML = `${ust(esc(c.sinifAd || kod))}<main>
      <article class="kart"><h2>${esc(c.sinifAd || '')} <span class="rozet ok">${esc(kod)}</span></h2>
        <p>${t('Sınıfta görünen adın: ')}<b>${esc(c.ad)}</b></p>
        <div id="ogrOdev"><p class="soluk">${t('Yükleniyor…')}</p></div>
        <div class="satir sola"><button class="btn" id="ozetGonder">${t('🔄 İlerlememi şimdi gönder')}</button></div>
        ${cocukMu() ? '' : `<label class="secim-satir"><input type="checkbox" id="gizliSira" ${S.ayar.siralamaGizli ? 'checked' : ''}> ${t('Sıralamada adım diğer öğrencilere görünmesin (hocam görür)')}</label>`}</article>
      <h2 class="baslik">${cocukMu() ? t('⭐ Sınıfça hedef') : t('🏆 Sınıf sıralaması')}</h2><article class="kart" id="sirala"><p class="soluk">${t('Yükleniyor…')}</p></article>
      <div id="dinletmelerim"></div>
      <p class="soluk kucukyazi">${t('Sınıftakiler; geçtiğin bölümleri, puanlarını, ezberini, okuma oranını ve serini görür. Ezber kaydını yalnızca sen gönderirsen hocan dinler.')}</p>
      <button class="btn ikincil tehlike-yazi genis" id="ayril">${t('Sınıftan ayrıl')}</button>
    </main>`;
    const gs = $('#gizliSira'); if (gs) gs.onchange = () => { S.ayar.siralamaGizli = gs.checked; kaydet(); ozetiGonder().then(() => toast(t('Kaydedildi ✓'))).catch(() => { }); };
    sinifBilgiGetir(kod, true).then(s => {
      const yer = $('#ogrOdev'); if (!yer) return;
      if (!s) { yer.innerHTML = `<p class="soluk">${t('Sınıf bilgisi alınamadı (internet yok olabilir).')}</p>`; return; }
      const o = s.odev, u = o && unitById(o.birim);
      const okY = s.okuma && s.okuma.sayfa ? `<p>${t('📖 Okuma ödevi: her gün {0} sayfa', s.okuma.sayfa)} · ${t('Bugün {0}/{1}', koBugun(), s.okuma.sayfa)} ${koBugun() >= s.okuma.sayfa ? '<span class="yesil">✓</span>' : ''}</p>` : '';
      if (s.okuma && s.okuma.sayfa) koOdevUygula(s);
      const dOdev = o && String(o.birim || '').startsWith('d:');
      if (dOdev) { const id = o.birim.slice(2), ok = !!(S.cocuk && S.cocuk.d && S.cocuk.d[id] && S.cocuk.d[id].y); yer.innerHTML = okY + `<p>${t('📌 Ödev: ')}<b>${esc(odevAd(o.birim))}</b>${o.son ? ' · ' + t('son gün: {0}', odevSonStr(o.son)) : ''} ${ok ? '<span class="yesil">✓</span>' : ''}</p>${o.not ? `<p class="soluk">“${esc(o.not)}”</p>` : ''}`; return; }
      yer.innerHTML = okY + (u ? `<p>${t('📌 Ödev: ')}<b>${u.ikon} ${esc(u.ad)}</b>${o.son ? ' · ' + t('son gün: {0}', odevSonStr(o.son)) : ''} ${gecti(u.id) ? '<span class="yesil">✓</span>' : ''}</p>${o.not ? `<p class="soluk">“${esc(o.not)}”</p>` : ''}` : okY ? '' : `<p class="soluk">${t('Şu an verilmiş bir ödev yok.')}</p>`);
    });
    B().ogrenciler(kod).then(l => { const k = $('#sirala'); if (k) siralamaBagla(k, l, B().kullanici().uid); })
      .catch(e => { const k = $('#sirala'); if (k) k.innerHTML = `<p class="soluk">${esc(e.message)}</p>`; });
    kuranIndex().then(() => B().dinletmelerim(kod)).then(l => { const y = $('#dinletmelerim'); if (!y || !l.length) return;
      y.innerHTML = `<h2 class="baslik">${t('🎧 Ezber dinletmelerim')}</h2>` + l.slice(0, 10).map(d => `<div class="kayit"><div>${esc(sureNoAdi(d.n))} <small>${tarihStr(d.tarih)}</small>${d.not ? `<small>“${esc(d.not)}”</small>` : ''}</div><div class="sag">${dinletDurum(d)}</div></div>`).join('');
    }).catch(() => { });
    $('#ozetGonder').onclick = async e => { const b_ = e.currentTarget; mesgul(b_, true); try { await B().ozetGonder(kod, c.ad, ozetHazirla()); toast(t('İlerlemen gönderildi ✓')); ciz(); } finally { mesgul(b_, false); } };
    $('#ayril').onclick = async () => {
      if (!confirm(t('Sınıftan ayrılmak istiyor musun? Hocan artık ilerlemeni göremez.'))) return;
      try { await B().siniftanAyril(kod); } catch (e) { if (!/izin|Permission/i.test(e.message)) return toast(e.message); }
      const l = ogrSiniflari(); l.splice(l.findIndex(x => x.kod === kod), 1); delete SB[kod]; kaydet(); toast(t('Sınıftan ayrıldın')); geri();
    };
  };

  const ADA_AD = { harf: t('Harf Adası'), hareke: t('Hareke Adası'), okuma: t('Okuma Adası'), sure: t('Sûreler Adası') };
  const durakEtiket = d => `${ADA_AD[d.ada] || ''} · ${d.ad}${d.tur === 'harf' ? ' (' + d.harf + ')' : ''}`;
  const odevAd = birim => { if (String(birim).startsWith('d:')) { const d = COCUK && COCUK.DURAK.find(x => x.id === birim.slice(2)); return d ? '🧒 ' + durakEtiket(d) : birim; } const u = unitById(birim); return u ? u.ikon + ' ' + u.ad : birim; };
  const odevTamam = (birim, z) => String(birim).startsWith('d:') ? !!(z.dk && z.dk[birim.slice(2)]) : !!(z.b && z.b[birim] && z.b[birim][1]);
  // Yazdırılabilir sınıf raporu (tarayıcıda Yazdır/PDF; telefonda metin olarak paylaş)
  EKRAN.sinifRapor = function (kod) {
    if (!B() || !B().hazir || !girisli()) return girisIste(t('Sınıf'));
    app.innerHTML = `${ust(t('Sınıf raporu'))}<main id="sr"><p class="soluk">${t('Yükleniyor…')}</p></main>`;
    const yer = $('#sr');
    Promise.all([B().sinifGetir(kod), B().ogrenciler(kod)]).then(([s, l]) => {
      if (!document.body.contains(yer) || !s) return;
      const o = s.odev || {}, okS = s.okuma && s.okuma.sayfa, bg = bugun(); l.sort((a, b) => String(a.ad).localeCompare(String(b.ad), 'tr'));
      const satirlar = l.map(x => { const z = x.ozet || {}; return { kb: koGunSay(z, bg), kh: koHafta(z), ad: x.ad || '?', cocuk: !!z.cocuk, bolum: `${z.gecilen || 0}/${z.toplam || U.length}`, yildiz: z.cocuk ? z.yildiz || 0 : null, durak: Object.keys(z.dk || {}).length, seri: z.seri || 0, ort: z.ort, ez: z.ezAyet || 0, odev: o.birim ? odevTamam(o.birim, z) : null, son: x.guncelleme ? new Date(x.guncelleme).toLocaleDateString(DIL === 'en' ? 'en-GB' : 'tr-TR', { day: '2-digit', month: '2-digit' }) : '—' }; });
      const cocukVar = satirlar.some(x => x.cocuk), buyukVar = satirlar.some(x => !x.cocuk);
      yer.innerHTML = `<article class="kart rapor"><h2>${esc(s.ad || '')} <small class="soluk">${esc(kod)}</small></h2>
          <p class="soluk kucukyazi">${t('Rapor tarihi: {0} · {1} öğrenci', tarihStr(Date.now()), l.length)}${o.birim ? ' · ' + t('Ödev: {0}', esc(odevAd(o.birim))) : ''}${okS ? ' · ' + t('Okuma ödevi: her gün {0} sayfa', okS) : ''}</p>
          <div class="rapor-kap"><table class="rapor-tablo"><thead><tr><th>${t('Öğrenci')}</th>${buyukVar ? `<th>${t('Bölüm')}</th><th>${t('Ort.')}</th><th>${t('Ezber')}</th>` : ''}${cocukVar ? `<th>★</th><th>${t('Durak')}</th>` : ''}<th>🔥</th>${okS ? `<th>${t('Bugün')}</th><th>${t('7 gün')}</th>` : ''}${o.birim ? `<th>${t('Ödev')}</th>` : ''}<th>${t('Son')}</th></tr></thead>
          <tbody>${satirlar.map(x => `<tr><td>${esc(x.ad)}</td>${buyukVar ? `<td>${x.cocuk ? '—' : x.bolum}</td><td>${x.cocuk || x.ort == null ? '—' : yuzdeStr(x.ort)}</td><td>${x.cocuk ? '—' : x.ez}</td>` : ''}${cocukVar ? `<td>${x.cocuk ? x.yildiz : '—'}</td><td>${x.cocuk ? x.durak : '—'}</td>` : ''}<td>${x.seri}</td>${okS ? `<td>${x.kb}/${okS}${x.kb >= okS ? ' ✓' : ''}</td><td>${x.kh}</td>` : ''}${o.birim ? `<td>${x.odev ? '✓' : '·'}</td>` : ''}<td class="kucukyazi">${esc(x.son)}</td></tr>`).join('')}</tbody></table></div></article>
        <div class="satir sola rapor-dugmeler"><button class="btn" id="raporYazdir">${IKON.yazdir} ${t('Yazdır / PDF')}</button><button class="btn ikincil" id="raporPaylas">${IKON.paylas} ${t('Metin olarak paylaş')}</button></div>
        <p class="soluk kucukyazi">${t('Telefonda yazdırma çalışmazsa “Metin olarak paylaş” ile WhatsApp ya da e-postayla gönderebilirsin.')}</p>`;
      $('#raporYazdir').onclick = () => { try { window.print(); } catch (e) { toast(t('Bu cihazda yazdırma desteklenmiyor.')); } };
      $('#raporPaylas').onclick = async () => {
        const yazi = [`${s.ad || ''} (${kod}) — ${tarihStr(Date.now())}`, o.birim ? t('Ödev: {0}', odevAd(o.birim)) : '', okS ? t('Okuma ödevi: her gün {0} sayfa', okS) : '', ''].concat(satirlar.map(x => `• ${x.ad}: ${x.cocuk ? `★${x.yildiz}, ${t('{0} durak', x.durak)}` : `${t('{0} bölüm', x.bolum)}${x.ort != null ? ', ' + t('ort. {0}', yuzdeStr(x.ort)) : ''}`}, 🔥${x.seri}${okS ? ', ' + t('bugün {0}/{1} sayfa, 7 günde {2}', x.kb, okS, x.kh) : ''}${o.birim ? ', ' + t('ödev') + ' ' + (x.odev ? '✓' : '✗') : ''}`)).filter((x, i) => x || i > 1).join('\n');
        try { if (navigator.share) { await navigator.share({ text: yazi }); return; } } catch (e) { return; }
        try { await navigator.clipboard.writeText(yazi); toast(t('Kopyalandı')); } catch (e) { toast(t('Paylaşılamadı')); }
      };
    }).catch(e => { if (document.body.contains(yer)) yer.innerHTML = `<p class="hata">${esc(e.message)}</p>`; });
  };
  EKRAN.sinifDetay = function (kod) {
    if (!B() || !B().hazir || !girisli()) return girisIste(t('Sınıf'));
    app.innerHTML = `${ust(t('Sınıf'))}<main id="sd"><p class="soluk">${t('Yükleniyor…')}</p></main>`;
    const yer = $('#sd');
    Promise.all([B().sinifGetir(kod), B().ogrenciler(kod)]).then(([s, ogrenciler]) => {
      if (!document.body.contains(yer)) return;
      if (!s) { yer.innerHTML = `<p class="hata">${t('Bu kodla bir sınıf bulunamadı.')}</p>`; return; }
      const o = s.odev || {}, okS = s.okuma && s.okuma.sayfa, bg = bugun();
      ogrenciler.sort((a, b) => ((b.ozet || {}).gecilen || 0) - ((a.ozet || {}).gecilen || 0) || String(a.ad).localeCompare(String(b.ad)));
      const satir = x => {
        const z = x.ozet || {}, top = z.toplam || U.length;
        const odevDurum = o.birim ? (odevTamam(o.birim, z) ? `<span class="rozet ok">${t('✓ ödev')}</span>` : `<span class="rozet kilit">${t('ödev bekliyor')}</span>`) : '';
        const p = Math.round((z.gecilen || 0) / top * 100);
        const bolumler = U.filter(u => z.b && z.b[u.id]).map(u => `<li>${u.ikon} ${esc(u.ad)}: <b class="${z.b[u.id][1] ? 'yesil' : 'kirmizi'}">${yuzdeStr(z.b[u.id][0])}</b></li>`).join('');
        const son = (z.son || []).map(h => `<li>${esc(h.k ? baslikBul({ kimlik: h.k, baslik: h.b }) : h.b)}: <b>${yuzdeStr(h.y)}</b> <small class="soluk">${tarihStr(h.t)}</small></li>`).join('');
        const kb = koGunSay(z, bg), okDurum = okS ? `<span class="rozet ${kb >= okS ? 'ok' : 'kilit'}">📖 ${kb}/${okS}</span>` : '';
        return `<details class="kart kucuk ogrenci"><summary><span class="bad"><b>${esc(x.ad || '?')}</b><small>${t('{0}/{1} bölüm', z.gecilen || 0, top)} · 🔥 ${z.seri || 0} · ${t('son: {0}', x.guncelleme ? tarihStr(x.guncelleme) : '—')}</small>
          <div class="bar"><div class="${p >= 80 ? 'iyi' : p >= 40 ? 'orta' : 'kotu'}" style="width:${p}%"></div></div></span>${okDurum}${odevDurum}</summary>
          ${z.ko && Object.keys(z.ko).length ? `<p style="margin-top:10px"><b>${t('Kur\'an okuma')}</b>: ${t('bugün {0} sayfa · son 7 günde {1} sayfa', kb, koHafta(z))}</p>` : okS ? `<p class="soluk" style="margin-top:10px">${t('Son 7 günde Kur\'an okuma kaydı yok.')}</p>` : ''}
          ${bolumler ? `<p style="margin-top:10px"><b>${t('Bölümler')}</b></p><ul class="kaynak">${bolumler}</ul>` : `<p class="soluk">${t('Henüz test çözmedi.')}</p>`}
          ${son ? `<p><b>${t('Son testler')}</b></p><ul class="kaynak">${son}</ul>` : ''}
          ${z.ez && Object.keys(z.ez).length ? `<p><b>${t('Ezber')}</b></p><ul class="kaynak">${Object.entries(z.ez).map(([n, v]) => `<li>${esc(sureNoAdi(+n))}: ${v[1] ? `<b class="yesil">✓</b>` : t('{0} ayet', v[0])}</li>`).join('')}</ul>` : ''}
            ${z.cocuk ? `<p><b>${t('Harf Yolculuğu')}</b>: ★ ${z.yildiz || 0} · ${t('{0} durak', Object.keys(z.dk || {}).length)}</p>` : ''}
        <p class="soluk kucukyazi">${t('Toplam test: {0} · Bekleyen tekrar: {1}', z.test || 0, z.tekrar || 0)}</p>
          <button class="btn ikincil tehlike-yazi" data-cikar="${esc(x.uid)}">${t('Sınıftan çıkar')}</button></details>`;
      };
      yer.innerHTML = `<article class="kart ortala"><h2>${esc(s.ad || '')}</h2>
          <p class="soluk">${t('Öğrencilerin bu kodu girerek katılır:')}</p>
          <p class="sinif-kod">${esc(kod)}</p>
          <div class="satir"><button class="btn" id="paylas">${t('📤 Kodu paylaş')}</button><button class="btn ikincil" id="yenile">${t('🔄 Yenile')}</button></div></article>
        <article class="kart form"><h2>${t('📌 Ödev ver')}</h2>
          <label>${t('Bölüm')}<select id="odevBirim" style="display:block;width:100%;margin-top:6px;padding:10px"><option value="">${t('— ödev yok —')}</option>
            <optgroup label="${t('📘 Tecvid bölümleri')}">${U.map(u => `<option value="${u.id}" ${o.birim === u.id ? 'selected' : ''}>${u.ikon} ${u.ara ? '' : dersler.indexOf(u) + '. '}${esc(u.ad)}</option>`).join('')}</optgroup>
            ${COCUK ? `<optgroup label="${t('🧒 Harf Yolculuğu (çocuk profilleri)')}">${COCUK.DURAK.map(d => `<option value="d:${d.id}" ${o.birim === 'd:' + d.id ? 'selected' : ''}>${esc(durakEtiket(d))}</option>`).join('')}</optgroup>` : ''}</select></label>
          <label>${t('Son gün (isteğe bağlı)')}<input id="odevSon" type="date" value="${esc(o.son || '')}"></label>
          <label>${t('Not (isteğe bağlı)')}<input id="odevNot" maxlength="200" value="${esc(o.not || '')}" placeholder="${t('ör. Örnekleri 3 kez dinleyin')}"></label>
          <label class="anahtar-satir" id="topluSatir" hidden><input type="checkbox" id="odevToplu"> <span id="topluYazi"></span></label>
          <button class="btn genis" id="odevKaydet">${t('Ödevi kaydet')}</button></article>
        <article class="kart"><h2>${t('📖 Günlük Kur\'an okuma ödevi')}</h2>
          <p class="soluk">${t('Öğrencilerin her gün kaç sayfa okusun? Öğrencinin günlük okuma hedefi bundan az olamaz; okuduğu sayfalar bu ekranda ve raporda görünür.')}</p>
          <div class="cipler" id="okSec">${[0, 1, 2, 5, 10, 20].map(v => `<button class="${(okS || 0) === v ? 'aktif' : ''}" data-oks="${v}">${v ? t('{0} sayfa', v) : t('Yok')}</button>`).join('')}</div>
          <button class="btn genis" id="okKaydet">${t('Okuma ödevini kaydet')}</button></article>
        <div class="satir sola"><button class="btn ikincil" data-git="sinifRapor|${esc(kod)}">${IKON.yazdir} ${t('Sınıf raporu')}</button></div>
        <h2 class="baslik">${t('🏆 Sınıf sıralaması')}</h2><article class="kart" id="sirala"></article>
        <h2 class="baslik">${t('🎧 Ezber dinletmeleri')}</h2><div id="dinletmeler"><p class="soluk">${t('Yükleniyor…')}</p></div>
        <h2 class="baslik">${t('Öğrenciler ({0})', ogrenciler.length)}</h2>
        ${ogrenciler.length ? ogrenciler.map(satir).join('') : `<p class="soluk">${t('Henüz katılan öğrenci yok. Kodu öğrencilerine ver.')}</p>`}
        <p class="soluk kucukyazi">${t('Öğrencinin ilerlemesi, onun telefonu internete bağlanıp eşitlendiğinde güncellenir.')}</p>
        <article class="kart"><h2>${t('⚠️ Sınıfı sil')}</h2><p>${t('Sınıf kapanır, kod çalışmaz. Öğrencilerin kendi ilerlemesi silinmez.')}</p><button class="btn tehlike" id="sinifSil">${t('Sınıfı sil')}</button></article>`;
      $('#paylas').onclick = async () => {
        const yazi = t('Kur\'an Yolum uygulamasında "{0}" sınıfına katıl: Profil → Sınıf → Öğrenciyim → kod: {1}', s.ad || '', kod);
        try { if (navigator.share) { await navigator.share({ text: yazi }); return; } } catch (e) { return; }
        try { await navigator.clipboard.writeText(yazi); toast(t('Kopyalandı')); } catch (e) { toast(kod); }
      };
      $('#yenile').onclick = () => ciz();
      siralamaBagla($('#sirala'), ogrenciler, null, true);
      kuranIndex().then(() => B().dinletmeler(kod)).then(l => {
        const y = $('#dinletmeler'); if (!y) return;
        if (!l.length) { y.innerHTML = `<p class="soluk">${t('Henüz gelen ezber kaydı yok. Öğrenciler Ezber modunda "Hocama ezber dinlet" ile gönderir.')}</p>`; return; }
        y.innerHTML = l.slice(0, 30).map(d => `<article class="kart kucuk"><div class="satir" style="justify-content:space-between"><b>${esc(d.ad || '?')}</b>${dinletDurum(d)}</div>
          <p class="soluk kucukyazi">${esc(sureNoAdi(d.n))} · ${tarihStr(d.tarih)}${d.sure ? ' · ' + sureStr(d.sure) : ''}</p>
          <audio controls preload="none" src="data:${esc(d.mime || 'audio/webm')};base64,${d.ses}" style="width:100%"></audio>
          <div class="form"><input data-not="${d.id}" maxlength="300" placeholder="${t('Not (isteğe bağlı)')}" value="${esc(d.not || '')}"></div>
          <div class="satir sola"><button class="btn" data-puan="iyi" data-id="${d.id}">👍 ${t('Güzel')}</button><button class="btn ikincil" data-puan="tekrar" data-id="${d.id}">${IKON.tekrar} ${t('Tekrar çalış')}</button><button class="btn ikincil tehlike-yazi" data-dsil="${d.id}">${t('Sil')}</button></div></article>`).join('');
        y.querySelectorAll('[data-puan]').forEach(b => b.onclick = async () => { try { await B().dinletmeDegerlendir(kod, b.dataset.id, b.dataset.puan, y.querySelector(`[data-not="${b.dataset.id}"]`).value); toast(t('Değerlendirme kaydedildi ✓')); ciz(); } catch (x) { toast(x.message); } });
        y.querySelectorAll('[data-dsil]').forEach(b => b.onclick = async () => { if (!confirm(t('Bu kayıt silinsin mi?'))) return; try { await B().dinletmeSil(kod, b.dataset.dsil); ciz(); } catch (x) { toast(x.message); } });
      }).catch(x => { const y = $('#dinletmeler'); if (y) y.innerHTML = `<p class="hata">${esc(x.message)}</p>`; });
      // Birden çok sınıfı olan hoca aynı ödevi hepsine verebilir (yaz kursu)
      let digerSiniflar = [];
      B().siniflarim().then(l2 => { digerSiniflar = l2.filter(x => x.kod !== kod); if (digerSiniflar.length && $('#topluSatir')) { $('#topluSatir').hidden = false; $('#topluYazi').textContent = t('Aynı ödevi diğer {0} sınıfıma da ver', digerSiniflar.length); } }).catch(() => { });
      let okSecim = okS || 0;
      app.querySelectorAll('[data-oks]').forEach(b => b.onclick = () => { okSecim = +b.dataset.oks; app.querySelectorAll('[data-oks]').forEach(x => x.classList.toggle('aktif', x === b)); });
      $('#okKaydet').onclick = async e => {
        const btn = e.currentTarget; btn.disabled = true;
        const kodlar = [kod].concat($('#odevToplu') && $('#odevToplu').checked ? digerSiniflar.map(x => x.kod) : []);
        try { for (const k_ of kodlar) await B().okumaOdevVer(k_, okSecim ? { sayfa: okSecim, verildi: Date.now() } : null); toast(okSecim ? t('Okuma ödevi verildi: her gün {0} sayfa ✓', okSecim) : t('Okuma ödevi kaldırıldı')); } catch (x) { toast(x.message); }
        btn.disabled = false;
      };
      $('#odevKaydet').onclick = async e => {
        const birim = $('#odevBirim').value; const btn = e.currentTarget; btn.disabled = true;
        const odev = birim ? { birim, son: $('#odevSon').value || null, not: $('#odevNot').value.trim() || null, verildi: Date.now() } : null;
        const kodlar = [kod].concat($('#odevToplu') && $('#odevToplu').checked ? digerSiniflar.map(x => x.kod) : []);
        try { for (const k_ of kodlar) await B().odevVer(k_, odev); toast(odev ? (kodlar.length > 1 ? t('Ödev {0} sınıfa verildi ✓', kodlar.length) : t('Ödev verildi ✓')) : t('Ödev kaldırıldı')); } catch (x) { toast(x.message); }
        btn.disabled = false;
      };
      yer.querySelectorAll('[data-cikar]').forEach(b => b.onclick = async () => {
        if (!confirm(t('Bu öğrenci sınıftan çıkarılsın mı?'))) return;
        try { await B().ogrenciCikar(kod, b.dataset.cikar); toast(t('Öğrenci çıkarıldı')); ciz(); } catch (x) { toast(x.message); }
      });
      $('#sinifSil').onclick = async () => {
        if (!confirm(t('"{0}" sınıfı silinsin mi? Bu geri alınamaz.', s.ad || kod))) return;
        try { await B().sinifSil(kod); toast(t('Sınıf silindi')); ekranYigini.pop(); ciz(); } catch (x) { toast(x.message); }
      };
    }).catch(e => { if (document.body.contains(yer)) yer.innerHTML = `<article class="kart"><p class="hata">${esc(e.message)}</p><button class="btn" id="tekrarDene">${t('Tekrar dene')}</button></article>`; const b = $('#tekrarDene'); if (b) b.onclick = () => ciz(); });
  };

  EKRAN.indir = function () {
    const fs = FS();
    if (!fs) { app.innerHTML = `${ust(t('İnternetsiz ses'))}<main><article class="kart"><p>${t('Sesleri indirme şimdilik yalnızca Android uygulamasında çalışır. Burada sesler internetle çalar.')}</p></article></main>`; return; }
    const k = kari(), liste = indirListesi(k.klasor), var_ = indirilenSay(liste);
    const kelimeSay = [...yerelSet].filter(y => y.startsWith('wbw/')).length;
    const digerleri = KARILER.map(x => ({ x, n: [...yerelSet].filter(y => y.startsWith('ea/' + x.klasor + '/')).length })).filter(o => o.n && o.x.id !== k.id);
    app.innerHTML = `${ust(t('İnternetsiz ses'))}<main>
      <article class="kart"><h2>🎙️ ${esc(k.ad)}</h2><p class="soluk">${esc(k.tur)}</p>
        <p>${t('Derslerdeki örnek ayetler, uygulama sûreleri ve kelime sesleri: {0} dosya.', liste.length)}</p>
        <div id="indirDurum"><p>${t('{0}/{1} dosya', var_, liste.length)}</p><div class="bar"><div class="iyi" style="width:${Math.round(var_ / liste.length * 100)}%"></div></div></div>
        <div class="satir sola" style="margin-top:12px">${indirme ? `<button class="btn ikincil" id="indirDur">${t('⏹ Durdur')}</button>`
          : var_ < liste.length ? `<button class="btn" id="indirBas">${var_ ? t('📥 Kalanları indir') : t('📥 İndir')}</button>` : `<span class="rozet ok">${t('✓ Hepsi indirildi')}</span>`}
          <button class="btn ikincil" data-git="kariSec">${t('Kâri değiştir')}</button></div>
        <p class="soluk kucukyazi">${t('Ayet sesleri büyük dosyalardır; Wi-Fi ile indirmen önerilir. İndirilen sesler internet olmadan da çalar.')}</p></article>
      ${digerleri.length ? `<h2 class="baslik">${t('İndirilmiş diğer kâriler')}</h2>${digerleri.map(o => `<article class="kart kucuk satir" style="justify-content:space-between"><span>${esc(o.x.ad)} <small class="soluk">· ${esc(o.x.tur)} · ${t('{0} dosya', o.n)}</small></span><button class="btn ikincil" data-sil="${o.x.klasor}">${t('Sil')}</button></article>`).join('')}` : ''}
      <article class="kart"><h2>${t('🗑️ Yer aç')}</h2><p>${t('İndirilen bütün sesleri sil ({0} kelime sesi dahil).', kelimeSay)}</p>
        <button class="btn tehlike" id="hepsiniSil" ${yerelSet.size ? '' : 'disabled'}>${t('Bütün indirilen sesleri sil')}</button></article>
    </main>`;
    const b = $('#indirBas'); if (b) b.onclick = () => { indirBaslat(liste, ''); ciz(); };
    const d = $('#indirDur'); if (d) d.onclick = () => { if (indirme) indirme.iptal = true; };
    app.querySelectorAll('[data-sil]').forEach(x => x.onclick = async () => { await kariSesleriniSil(x.dataset.sil); toast(t('Silindi')); ciz(); });
    $('#hepsiniSil').onclick = async () => { if (!confirm(t('İndirilen bütün sesler silinsin mi?'))) return; if (indirme) indirme.iptal = true; await butunSesleriSil(); toast(t('Silindi')); ciz(); };
    indirmeGoster();
  };

  // Aramada camide kullanılan başka adlar da bulunsun (ör. "İkra" → Alak, "Tebbet" → Mesed)
  const SURE_TAKMA = { 1: 'elhamd', 36: 'yasin', 67: 'mülk tebareke', 78: 'amme nebe', 93: 'duha', 94: 'inşirah elemneşrah şerh', 96: 'ikra', 97: 'kadir', 99: 'zilzal zelzele', 105: 'elemtera', 108: 'inna ataynake', 109: 'kul ya', 110: 'iza cae', 111: 'tebbet mesed', 112: 'kulhuvallahu', 113: 'kul euzu', 114: 'kul euzu' };
  const sureAraMetni = x => trSade(x.n + ' ' + x.tr + ' ' + x.en + ' ' + (SURE_TAKMA[x.n] || ''));
  const sureSatir = (x, adet, oku) => { const ok = (S.sure || {})[x.n]; return `<button class="bolum" data-git="${oku && M.sayfa.length ? `sayfa|${sayfaBul(x.n, 1)}|${x.n}:1` : `sure|${x.n}`}" data-ara="${esc(sureAraMetni(x))}"><span class="ikon" style="font-size:.8rem;width:28px;color:var(--soluk)">${x.n}</span><span class="bad"><small>${t('{0} ayet', adet)}</small>${esc(sureAdi(x))}</span><span class="ar" style="font-size:1.35rem;line-height:1.2">${esc(x.ar)}</span>${ok && ok.en != null ? `<span class="rozet ok">✓ ${yuzdeStr(ok.en)}</span>` : ''}</button>`; };
  // Kur'an sekmesi: Oku · Ezberle · Dinle (karar: toplanti-2026-11-19-arayuz-sadelestirme.md)
  const kuranSekme = aktif => `<div class="kuran-sekme" role="tablist">${[['sureler', t('Oku')], ['ezber', t('Ezberle')], ['kuranDinle', t('Dinle')]].map(([k, ad]) => `<button role="tab" aria-selected="${k === aktif}" class="${k === aktif ? 'aktif' : ''}" data-kuran-sekme="${k}">${ad}</button>`).join('')}</div>`;
  const kuranSekmeBagla = () => app.querySelectorAll('[data-kuran-sekme]').forEach(b => b.onclick = () => { if (b.classList.contains('aktif')) return; ekranYigini = [[b.dataset.kuranSekme, []]]; ciz(); window.scrollTo(0, 0); });
  const kokEkran = () => ekranYigini.length === 1;
  EKRAN.kuranDinle = function (sekme) { EKRAN.kariSec(sekme, true); };
  // "Git": sûre + ayet, sayfa (1–604) ya da cüz ile Kur'an'da istediğin yeri aç
  const gitAlanlar = pre => `<div class="ko-git-ic">
      <div class="ko-git-satir"><label class="alan"><span>${t('Sûre')}</span><select id="${pre}Sure"><option value="">…</option></select></label><label class="alan ko-git-no"><span>${t('Ayet')}</span><input id="${pre}Ayet" type="number" inputmode="numeric" min="1" placeholder="1"></label><button class="btn" id="${pre}AyetBtn">${t('Git')}</button></div>
      <div class="ko-git-satir"><label class="alan"><span>${t('Sayfa (1–604)')}</span><input id="${pre}Sayfa" type="number" inputmode="numeric" min="1" max="604" placeholder="27"></label><button class="btn" id="${pre}SayfaBtn">${t('Git')}</button></div>
      <div class="ko-git-satir"><label class="alan"><span>${t('Cüz')}</span><select id="${pre}Cuz">${[...Array(30)].map((_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}</select></label><button class="btn" id="${pre}CuzBtn">${t('Git')}</button></div>
    </div>`;
  const gitKarti = () => `<details class="kart ko-git" id="koGit"><summary><b>📍 ${t('Git')}</b> <span class="soluk kucukyazi">${t('sûre ve ayet, sayfa, cüz')}</span></summary>${gitAlanlar('git')}</details>`;
  function gitSureDoldur(pre, l) { const sel = $('#' + pre + 'Sure'); if (sel) sel.innerHTML = l.map(x => `<option value="${x.n}">${x.n} · ${esc(sureAdi(x))}</option>`).join(''); }
  function gitBagla(pre, yap) {   // yap(sayfa, 'n:a' | undefined); düğmeler hemen çalışır, yalnız ayet sayısı için sûre listesi gerekir
    if (!$('#' + pre + 'Sure')) return;
    const ayetGit = () => {
      const n = +$('#' + pre + 'Sure').value, l = KURAN_INDEX, x = l && l.find(y => y.n === n);
      if (!x) { toast(t('Yükleniyor…')); return; }
      const a = +($('#' + pre + 'Ayet').value || 1);
      if (!(a >= 1 && a <= x.a)) { toast(t('{0} sûresinde {1} ayet var.', sureAdi(x), x.a)); return; }
      yap(sayfaBul(n, a), `${n}:${a}`);
    };
    $('#' + pre + 'AyetBtn').onclick = ayetGit; $('#' + pre + 'Ayet').onkeydown = e => { if (e.key === 'Enter') ayetGit(); };
    const sayfaGit = () => { const q = +$('#' + pre + 'Sayfa').value; if (!(q >= 1 && q <= 604)) { toast(t('Sayfa numarası 1 ile 604 arasında olmalı.')); return; } yap(q); };
    $('#' + pre + 'SayfaBtn').onclick = sayfaGit; $('#' + pre + 'Sayfa').onkeydown = e => { if (e.key === 'Enter') sayfaGit(); };
    $('#' + pre + 'CuzBtn').onclick = () => { const c = +$('#' + pre + 'Cuz').value, r = M.cuz[c - 1]; if (r) yap(sayfaBul(r[0], r[1]), `${r[0]}:${r[1]}`); };
  }
  // Sayfa ekranından "Git": her yerden sûre+ayet, sayfa ya da cüz
  async function koGitPenceresi(yap) {
    document.querySelectorAll('.git-arka').forEach(x => x.remove());
    const d = document.createElement('div'); d.className = 'modal-arka git-arka';
    d.innerHTML = `<div class="modal kart git-pencere" role="dialog" aria-modal="true"><button class="ayet-ekran-kapat" id="gpKapat" aria-label="${t('Kapat')}">✕</button><h2>📍 ${t('Nereye gitmek istiyorsun?')}</h2>${gitAlanlar('gp')}</div>`;
    document.body.appendChild(d); const kapat = () => d.remove();
    d.onclick = e => { if (e.target === d) kapat(); }; $('#gpKapat').onclick = kapat;
    gitBagla('gp', (q, h) => { kapat(); yap(q, h); });
    const l = await kuranIndex(); gitSureDoldur('gp', l || []);
  }
  EKRAN.sureler = function () {
    const son = (S.sonSureler || []).slice(0, 4);
    app.innerHTML = `${ust(t('Kur\'an'))}<main>
      ${kokEkran() ? kuranSekme('sureler') : ''}
      ${M.sayfa.length ? koUstKarti() + gitKarti() : ''}
      <label class="ara-kutu">${IKON.ara}<span class="gorunmez">${t('Sûre ara')}</span><input id="sureAra" type="search" placeholder="${t('Sûre ara: İkra, Yâsîn, 36…')}"></label>
      ${son.length ? `<div class="son-sureler" id="sonSureler"><small class="soluk">${t('Son açtıkların')}</small><div class="cipler">${son.map(n => `<button class="cip" data-sure-ac="${n}">${esc(sureAdi(SURE(n) || { tr: '', en: '' }) || sureNoAdi(n))}</button>`).join('')}</div></div>` : ''}
      <div id="tumSureler"><p class="soluk">${t('Yükleniyor…')}</p></div>
    </main>`;
    kuranSekmeBagla(); gitBagla('git', (q, h) => git('sayfa', q, h));
    kuranIndex().then(l => {
      gitSureDoldur('git', l || []);
      const yer = $('#tumSureler'); if (!yer) return;
      if (!l) { yer.innerHTML = `<p class="hata">${t('Sûre listesi açılamadı.')}</p>`; return; }
      // Son açılan sûre adları (index'ten)
      app.querySelectorAll('[data-sure-ac]').forEach(b => { const x = l.find(y => y.n === +b.dataset.sureAc); if (x) b.textContent = sureAdi(x); b.onclick = () => git('sayfa', sayfaBul(x.n, 1), x.n + ':1'); });
      // Cüzlere göre açılır gruplar: her sûre başladığı cüzde
      const cuzVar = M.cuz && M.cuz.length, gruplar = {};
      // Birden çok cüze yayılan sûre (Bakara gibi) her cüzde görünür
      l.forEach(x => { const c1 = cuzVar ? cuzBul(x.n, 1) : 0, c2 = cuzVar ? cuzBul(x.n, x.a) : 0; for (let c = c1; c <= c2; c++) (gruplar[c] = gruplar[c] || []).push(x); });
      const simdiki = (() => { const k = KO().son; return k && k.n && cuzVar ? cuzBul(k.n, k.a || 1) : 1; })();
      yer.innerHTML = Object.keys(gruplar).map(Number).sort((a, b) => a - b).map(c => { const g = gruplar[c];
        return `<details class="kart cuz-grup" data-cuz="${c}" ${c === simdiki ? 'open' : ''}><summary><b>${c ? t('{0}. Cüz', c) : t('Bütün sûreler')}</b><span class="soluk kucukyazi">${esc(sureAdi(g[0]))}${g.length > 1 ? ' – ' + esc(sureAdi(g[g.length - 1])) : ''}</span></summary>
          <div class="bolumler">${g.map(x => sureSatir(x, x.a, true)).join('')}</div></details>`; }).join('');
      $('#sureAra').oninput = e => { const q = trSade(e.target.value.trim()), ss = $('#sonSureler'); if (ss) ss.hidden = !!q;
        const gor = new Set();   // aramada aynı sûre (birkaç cüze yayılan) bir kez görünsün
        yer.querySelectorAll('.cuz-grup').forEach(d => { let var_ = 0; d.querySelectorAll('[data-ara]').forEach(b => { const g = !q || (b.dataset.ara.includes(q) && !gor.has(b.dataset.git)); if (q && g) gor.add(b.dataset.git); b.hidden = !g; if (g) var_++; }); d.hidden = !var_; if (q) d.open = true; else d.open = +d.dataset.cuz === simdiki; }); };
    });
  };
  // Bütün Kur'an'da bir kuralın geçtiği yerler (114 sûre dosyası taranır)
  EKRAN.kuralAra = function (sinif) {
    app.innerHTML = `${ust(t('Kural ara'))}<main>
      <article class="kart"><p>${t('Bir kural seç; bütün Kur\'an\'da kaç yerde geçtiğini ve hangi sûrelerde olduğunu gör.')}</p>
        <div class="filtre">${LEJANT.filter(([k]) => k !== 's').map(([k, ad]) => `<button class="${sinif === k ? 'aktif' : ''}" data-sinif="${k}"><i class="tc-${k}"></i>${esc(ad)}</button>`).join('')}</div></article>
      <div id="sonuc">${sinif ? `<p class="soluk">${t('Taranıyor…')}</p>` : ''}</div></main>`;
    app.querySelectorAll('[data-sinif]').forEach(b => b.onclick = () => { ekranYigini[ekranYigini.length - 1] = ['kuralAra', [b.dataset.sinif]]; ciz(); });
    if (!sinif) return;
    (async () => {
      const l = await kuranIndex(); const yer = $('#sonuc'); if (!l || !yer) return;
      const sonuc = []; let i = 0;
      for (const x of l) {
        try { await sureYukle(x.n); } catch (e) { continue; }
        let yer_ = 0, ayet = 0;
        for (let a = 1; a <= x.a; a++) { const k = (RENK[`${x.n}:${a}`] || []).filter(e => e[2] === sinif).length; yer_ += k; if (k) ayet++; }
        if (yer_) sonuc.push({ x, yer_, ayet });
        if (++i % 10 === 0 && document.body.contains(yer)) yer.innerHTML = `<p class="soluk">${t('Taranıyor…')} ${i}/114</p>`;
      }
      if (!document.body.contains(yer)) return;
      const top = sonuc.reduce((s, o) => s + o.yer_, 0);
      const ad = LEJ_AD[sinif];
      yer.innerHTML = `<article class="kart"><h2><span class="tc-${sinif}">■</span> ${esc(ad)}</h2>
          <p>${t('Bütün Kur\'an\'da <b>{0}</b> yerde, <b>{1}</b> sûrede geçiyor.', top, sonuc.length)}</p>
          ${LEJ_ACIKLAMA[sinif] ? `<p class="soluk">${esc(LEJ_ACIKLAMA[sinif])}</p>` : ''}
          <p class="soluk kucukyazi">${t('Sayılar renkli tecvid etiketlerinden otomatik çıkarılmıştır; küçük farklar olabilir.')}</p></article>
        <div class="bolumler">${sonuc.map(o => `<button class="bolum" data-git="sure|${o.x.n}|${sinif}"><span class="ikon" style="font-size:.8rem;width:28px;color:var(--soluk)">${o.x.n}</span><span class="bad"><small>${t('{0} ayette {1} yer', o.ayet, o.yer_)}</small>${esc(sureAdi(o.x))}</span><span class="ar" style="font-size:1.1rem;line-height:1.2">${esc(o.x.ar)}</span></button>`).join('')}</div>`;
    })();
  };
  // ============================================================ EZBER (hıfz)
  // S.ezber[n] = { a: ezberlenen ayet sayısı (baştan), tam, eklendi, bitti, son (son tekrar), kutu, vade }
  const ezb = n => (S.ezber || {})[n];
  const ayetSayisi = n => { const x = SURE(n); if (x) return x.ayet.length; const i = (KURAN_INDEX || []).find(y => y.n === n); return i ? i.a : 0; };
  function ezberEkle(n) { S.ezber = S.ezber || {}; if (!S.ezber[n]) S.ezber[n] = { a: 0, tam: false, eklendi: simdi(), son: 0, kutu: 0, vade: 0 }; kaydet(); }
  function ezberIsaretle(n, a) {
    ezberEkle(n); const e = S.ezber[n], top = ayetSayisi(n);
    if (a > e.a) e.a = Math.min(a, top);
    if (top && e.a >= top && !e.tam) { e.tam = true; e.bitti = simdi(); e.kutu = 1; e.vade = simdi() + GUN; e.son = simdi(); toast(t('Maşallah! {0} sûresini ezberledin 🎉', sureNoAdi(n))); }
    seriGuncelle(); kaydet();
  }
  function tekrarEttim(n) {
    const e = ezb(n); if (!e) return;
    e.son = simdi(); e.kutu = Math.min(6, (e.kutu || 0) + 1); e.vade = simdi() + ARALIK[e.kutu] * GUN; seriGuncelle(); kaydet();
  }
  const bugunBasi = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
  // Hafızlık usulü günlük plan: yeni ders + yakın tekrar + uzak tekrar
  function ezberPlani() {
    const l = Object.entries(S.ezber || {}).map(([n, e]) => Object.assign({ n: +n }, e));
    const yeni = l.filter(e => !e.tam).sort((a, b) => b.eklendi - a.eklendi);
    const yakin = l.filter(e => (e.tam ? simdi() - (e.bitti || 0) < 14 * GUN : e.a > 0) && (e.son || 0) < bugunBasi());
    const uzak = l.filter(e => e.tam && simdi() - (e.bitti || 0) >= 14 * GUN && (e.vade || 0) <= simdi());
    return { yeni, yakin, uzak };
  }
  const hDue = () => Object.keys(S.srs).filter(k => k.startsWith('h:') && S.srs[k].vade <= simdi()).length;
  // Önerilen sıra: Nâs'tan geriye (kısa sûreler önce)
  const sonrakiOneri = () => { for (let n = 114; n >= 1; n--) if (!ezb(n)) return n; return null; };

  // ---- hatim takvimi: S.hatim = { bas, gun, sayfa }
  function hatimDurum() {
    const h = S.hatim; if (!h) return null;
    const gecen = Math.floor((bugunBasi() - new Date(h.bas + 'T00:00:00').getTime()) / GUN);
    const kalanGun = Math.max(1, h.gun - gecen), kalanSayfa = 604 - h.sayfa;
    return { h, kalanGun, kalanSayfa, gunluk: Math.ceil(kalanSayfa / kalanGun), bitti: h.sayfa >= 604 };
  }

  // ---- sayfa / cüz (Medine mushafı)
  const M = window.MUSHAF || { sayfa: [], cuz: [], hizb: [] };
  const once = (x, y) => x[0] < y[0] || (x[0] === y[0] && x[1] <= y[1]);   // x, y'den önce ya da eşit mi
  function parcaBul(liste, n, a) { let lo = 0, hi = liste.length - 1, r = 0; while (lo <= hi) { const m = (lo + hi) >> 1; if (once(liste[m], [n, a])) { r = m; lo = m + 1; } else hi = m - 1; } return r + 1; }
  const sayfaBul = (n, a) => parcaBul(M.sayfa, n, a);
  const cuzBul = (n, a) => parcaBul(M.cuz, n, a);
  // Bir sayfadaki ayetler: [[n, a], ...]
  function sayfaAyetleri(p) {
    const [bs, ba] = M.sayfa[p - 1], son = M.sayfa[p] || [115, 1], l = [];
    let n = bs, a = ba;
    while (n < son[0] || (n === son[0] && a < son[1])) { l.push([n, a]); a++; if (a > ayetSayisi(n)) { n++; a = 1; } if (n > 114) break; }
    return l;
  }
  // sûrenin bütün ayetleri ezberde mi
  const ezberde = (n, a) => { const e = ezb(n); return !!e && e.a >= a; };

  // ---- meal ve benzer ayetler (istenince yüklenir)
  const MEAL = {}; let BENZER = null;
  async function mealYukle(n) { const k = (DIL === 'en' ? 'en' : 'tr') + n; if (!MEAL[k]) MEAL[k] = await (await fetch(`kuran/meal/${DIL === 'en' ? 'en' : 'tr'}/${pad(n)}.json`)).json(); return MEAL[k]; }
  // Meal kaynakları. Yeni meal eklemek: dosyaları www/kuran/meal/<yol>/NNN.json olarak koy (tools/build_meal_tanzil.py) ve buraya bir satır ekle.
  // Lisans/izin: kaynağı ve kullanım şartını eklemeden önce kontrol et (tabloda 27–28). İlk kaynak (dil başına) eski MEAL['tr'+n] anahtarını kullanır.
  const MEAL_KAYNAK = [
    { id: 'diyanet', dil: 'tr', ad: 'Diyanet İşleri Başkanlığı', yol: 'tr', kaynak: 'tanzil.net' },
    { id: 'sahih', dil: 'en', ad: 'Saheeh International', yol: 'en', kaynak: 'tanzil.net' },
  ];
  // Kelime meali: her ayet için kelime sayısı kadar anlam dizisi (kuran/kelime-meal/<yol>/NNN.json). Kaynak ve lisans onaylanınca bir satır eklenir.
  // { id, ad, kaynak, yol }  → boşken "Kelime Meali" görünümleri menüde görünmez
  const KELIME_MEAL_KAYNAK = [];
  const KM = {};
  const kmVeri = n => KM[n];
  async function kmYukle(n) { if (KM[n]) return KM[n]; const k = KELIME_MEAL_KAYNAK[0]; try { KM[n] = await (await fetch(`kuran/kelime-meal/${k.yol}/${pad(n)}.json`)).json(); } catch (e) { KM[n] = []; } return KM[n]; }
  // Mushaf sayfa resmi: { ad, kaynak, url: sayfa => adres }. İzin alınınca doldurulur; boşken "Mushaf resmi" görünümü çıkmaz.
  const MUSHAF_RESIM = { v: null };
  const mealKaynaklar = () => MEAL_KAYNAK.filter(k => k.dil === (DIL === 'en' ? 'en' : 'tr'));
  const mealSecili = () => { const l = mealKaynaklar(), c = S.ayar.mealler, x = Array.isArray(c) ? l.filter(k => c.includes(k.id)) : []; return x.length ? x : l.slice(0, 1); };
  const mealBirinci = k => MEAL_KAYNAK.find(x => x.dil === k.dil) === k;
  const mealVeri = (k, n) => MEAL[mealBirinci(k) ? k.dil + n : k.id + ':' + n];
  async function mealKaynakYukle(k, n) {
    if (mealBirinci(k)) return mealYukle(n);
    const a = k.id + ':' + n; if (!MEAL[a]) MEAL[a] = await (await fetch(`kuran/meal/${k.yol}/${pad(n)}.json`)).json(); return MEAL[a];
  }
  // Ayet ekranı: ayet no, sayfa, cüz, Arapça ayet, seçili tüm mealler, önceki/sonraki ayet, oku
  async function ayetEkrani(n, a, ops = {}) {
    document.querySelectorAll('.ayet-ekran-arka').forEach(x => x.remove());
    const d = document.createElement('div'); d.className = 'modal-arka ayet-ekran-arka';
    d.innerHTML = '<div class="modal kart ayet-ekran" role="dialog" aria-modal="true"></div>'; document.body.appendChild(d);
    const kutu = d.querySelector('.ayet-ekran'), kapat = () => { sesDurdur(); d.remove(); };
    d.onclick = e => { if (e.target === d) kapat(); };
    const komsu = async dy => {
      let nn = n, aa = a + dy;
      if (aa < 1) { if (nn <= 1) return; nn--; await sureYukle(nn); aa = ayetSayisi(nn); }
      else if (aa > ayetSayisi(n)) { if (nn >= 114) return; nn++; aa = 1; }
      n = nn; a = aa; goster();
    };
    async function goster() {
      kutu.innerHTML = `<p class="soluk ortala">${t('Yükleniyor…')}</p>`;
      let x; try { x = await sureYukle(n); } catch (e) { kutu.innerHTML = `<p class="hata">${t('Sûre açılamadı.')}</p><div class="satir"><button class="btn" id="aeKapat">${t('Kapat')}</button></div>`; kutu.querySelector('#aeKapat').onclick = kapat; return; }
      let mealler = []; try { mealler = await Promise.all(mealSecili().map(async k => [k, ((await mealKaynakYukle(k, n)) || [])[a - 1] || ''])); } catch (e) { }
      const top = ayetSayisi(n), p = sayfaBul(n, a), sayfadaMi = ops.ayetler && ops.ayetler.some(r => r[0] === n && r[1] === a);
      const sayim = {}; (RENK[`${n}:${a}`] || []).forEach(([, , kd]) => { sayim[kd] = (sayim[kd] || 0) + 1; });
      const tcKodlar = LEJANT.filter(([kd]) => sayim[kd]);
      kutu.innerHTML = `<button class="ayet-ekran-kapat" id="aeKapat" aria-label="${t('Kapat')}">✕</button>
        <p class="ayet-ekran-baslik"><b>${esc(sureNoAdi(n))}</b> · ${t('Ayet')}: <b>${a}</b> / ${top}</p>
        <p class="kucukyazi soluk ortala">${t('Sayfa {0}', p)} · ${t('Cüz {0}', cuzBul(n, a))}</p>
        <div class="ayet ayet-ekran-ar" dir="rtl" lang="ar">${esc(x.ayet[a - 1] || '')}</div>
        ${mealler.map(([k, m]) => m ? `<section class="ayet-ekran-meal"><h3>${esc(k.ad)}</h3><p>${esc(m)}</p></section>` : '').join('')}
        ${tcKodlar.length ? `<section class="ayet-ekran-tc"><h3>${t('Bu ayette tecvid')}</h3><div class="ae-tc-cipler">${tcKodlar.map(([kd, ad]) => `<button class="ae-tc tc-${kd}" data-ae-tc="${kd}"><i></i><b>${esc(ad)}${sayim[kd] > 1 ? ` ×${sayim[kd]}` : ''}</b></button>`).join('')}</div><div class="ae-tc-bilgi" id="aeTcBilgi" hidden></div></section>` : ''}
        <div class="ayet-ekran-dugme"><button class="btn ikincil" id="aeGeri" aria-label="${t('Önceki ayet')}">‹ ${t('Önceki ayet')}</button><button class="btn" id="aeOku">▶ ${t('Oku')}</button><button class="btn ikincil" id="aeIleri" aria-label="${t('Sonraki ayet')}">${t('Sonraki ayet')} ›</button></div>
        <div class="satir sola"><button class="btn ikincil kucuk" id="aeSayfa">📖 ${t('Sayfada göster')}</button><button class="btn ikincil kucuk" id="aeKart">🃏 ${t('Okuma kartı')}</button><button class="btn ikincil kucuk" id="aePaylas">↗ ${t('Paylaş')}</button>${ops.takip && sayfadaMi ? `<button class="btn ikincil kucuk" id="aeTakip">🎙️ ${t('Buradan sen oku')}</button>` : ''}</div>`;
      kutu.querySelector('#aeKapat').onclick = kapat;
      kutu.querySelector('#aeGeri').onclick = () => komsu(-1); kutu.querySelector('#aeIleri').onclick = () => komsu(1);
      kutu.querySelector('#aeOku').onclick = () => cal(ayetUrl(`${n}:${a}`), null, ayetUrl(`${n}:${a}`, KARILER[0].klasor));
      kutu.querySelector('#aeSayfa').onclick = () => { kapat(); git('sayfa', p, `${n}:${a}`); };
      kutu.querySelector('#aeKart').onclick = () => { kapat(); git('ayetKart', n, a); };
      kutu.querySelector('#aePaylas').onclick = async () => {
        const metin_ = `${x.ayet[a - 1] || ''}\n\n${mealler.filter(z => z[1]).map(([k, m]) => `${m} (${k.ad})`).join('\n')}\n\n— ${sureNoAdi(n)} ${a}. ${t('ayet')} · ${t('Kur\'an Yolum')}`.replace(/\n{3,}/g, '\n\n');
        try { if (navigator.share) await navigator.share({ text: metin_ }); else { await navigator.clipboard.writeText(metin_); toast(t('Ayet kopyalandı ✓')); } } catch (e) { if (e && e.name !== 'AbortError') toast(t('Paylaşılamadı.')); }
      };
      const TC_DERS = { m2: ['u1', 'tabii'], mt: ['u2', 'muttasil'], mf: ['u3', 'munfasil'], ml: ['u4', 'lazim'], g: ['u13', 'gunne'], h: ['u11', 'ihfa'], dg: ['u8', 'idgamMaal'], db: ['u9', 'idgamBila'], k: ['u10', 'iklab'], q: ['u15', 'kalkale'], s: ['u16', 'semsi'] };
      kutu.querySelectorAll('[data-ae-tc]').forEach(b => b.onclick = () => {
        const [uid, rid] = TC_DERS[b.dataset.aeTc] || [], u_ = uid && unitById(uid), r_ = rid && R[rid], bilgi = kutu.querySelector('#aeTcBilgi'); if (!bilgi) return;
        kutu.querySelectorAll('[data-ae-tc]').forEach(z => z.classList.toggle('aktif', z === b));
        bilgi.hidden = false; bilgi.innerHTML = `${r_ ? `<p><b>${esc(r_.ad)}</b> — ${esc(r_.ozet)}</p>` : ''}${r_ && r_.elif ? `${elifCubugu(r_.elif)}<p class="soluk kucukyazi">${esc(r_.elif)}</p>` : ''}${u_ ? `<button class="btn kucuk" id="aeTcDers">${t('Dersi aç ›')} <small>${esc(u_.ad)}</small></button>` : ''}`;
        const db_ = bilgi.querySelector('#aeTcDers'); if (db_) db_.onclick = () => { kapat(); git('ders', uid); };
      });
      const tk = kutu.querySelector('#aeTakip'); if (tk) tk.onclick = () => { const n_ = n, a_ = a; kapat(); ops.takip(n_, a_); };
    }
    goster();
  }
  async function benzerYukle() { if (!BENZER) { try { BENZER = await (await fetch('kuran/benzer.json')).json(); } catch (e) { BENZER = {}; } } return BENZER; }
  const sadeAr = s => s.replace(/[ً-ٰٟۖ-ۭـۥۦ]/g, '').replace(/[ٱأإآ]/g, 'ا').replace(/ى/g, 'ي');
  // İki ayeti kelime kelime karşılaştır; farklı kelimeleri işaretle
  function farkHTML(a, b) {
    const A = a.split(' '), Bk = b.split(' '), na = A.map(sadeAr), nb = Bk.map(sadeAr);
    const L = Array.from({ length: A.length + 1 }, () => new Array(Bk.length + 1).fill(0));
    for (let i = A.length - 1; i >= 0; i--) for (let j = Bk.length - 1; j >= 0; j--) L[i][j] = na[i] === nb[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const ortakB = new Set(); let i = 0, j = 0;
    while (i < A.length && j < Bk.length) { if (na[i] === nb[j]) { ortakB.add(j); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++; }
    return Bk.map((w, k) => ortakB.has(k) ? esc(w) : `<mark class="fark">${esc(w)}</mark>`).join(' ');
  }

  // ---- ezber yoklaması soruları: h:tip:n:a  (s sonraki, o önceki, t tamamla, h hangi sûre, m benzer ayet)
  const kisalt = (s, k = 8) => { const w = s.split(' '); return w.length > k ? w.slice(0, k).join(' ') + ' …' : s; };
  function ezberHavuzu() {   // ezberlenmiş bütün ayetler
    const l = []; Object.entries(S.ezber || {}).forEach(([n, e]) => { for (let a = 1; a <= e.a; a++) l.push([+n, a]); }); return l;
  }
  function ezberSoru(anahtar) {
    const [, tip, n_, a_] = anahtar.split(':'); const n = +n_, a = +a_; const x = SURE(n); if (!x || !x.ayet[a - 1]) return null;
    const metin_ = x.ayet[a - 1], ref = `${sureAdi(x)} ${a}`;
    const havuz = ezberHavuzu().filter(([m, b]) => SURE(m) && !(m === n && b === a));
    const rastgele = (fn, k) => { const s = new Set(); for (const [m, b] of karistir(havuz)) { const v = fn(SURE(m).ayet[b - 1], m, b); if (v) s.add(v); if (s.size >= k) break; } return [...s]; };
    const ayetKutu = s => `<div class="ayet" dir="rtl" lang="ar">${esc(s)}</div>`;
    let soru, dogru, yanlis = [], ust, ses = ayetUrl(`${n}:${a}`), acik = '';
    if (tip === 's' || tip === 'o') {
      const h = tip === 's' ? a + 1 : a - 1; if (!x.ayet[h - 1]) return null;
      soru = tip === 's' ? t('Bu ayetten SONRA hangi ayet gelir?') : t('Bu ayetten ÖNCE hangi ayet gelir?');
      ust = ayetKutu(metin_); dogru = kisalt(x.ayet[h - 1]);
      yanlis = rastgele(s => { const v = kisalt(s); return v !== dogru ? v : null; }, 3);
      ses = ayetUrl(`${n}:${h}`); acik = `${sureAdi(x)} ${h}`;
    } else if (tip === 't') {
      const w = metin_.split(' '); if (w.length < 4) return null; const k = Math.ceil(w.length / 2);
      soru = t('Ayetin devamı hangisi?'); ust = ayetKutu(w.slice(0, k).join(' ') + ' …'); dogru = kisalt(w.slice(k).join(' '));
      yanlis = rastgele(s => { const v = s.split(' '); if (v.length < 4) return null; const r = kisalt(v.slice(Math.ceil(v.length / 2)).join(' ')); return r !== dogru ? r : null; }, 3);
      acik = ref;
    } else if (tip === 'h') {
      soru = t('Bu ayet hangi sûrededir?'); ust = ayetKutu(metin_); dogru = sureAdi(x);
      const adlar = benzersiz(havuz.map(([m]) => sureAdi(SURE(m))).filter(v => v !== dogru));
      yanlis = karistir(adlar).slice(0, 3);
      if (yanlis.length < 3) yanlis = yanlis.concat(karistir((KURAN_INDEX || []).map(y => sureAdi(y)).filter(v => v !== dogru && !yanlis.includes(v))).slice(0, 3 - yanlis.length));
      acik = ref;
    } else if (tip === 'm') {
      const bz = (BENZER || {})[`${n}:${a}`]; if (!bz) return null;
      const adR = (m, b) => `${sureNoAdi(m)} ${b}`;
      soru = t('Benzerlerine dikkat! Bu ayet hangisi?'); ust = ayetKutu(metin_); dogru = ref;
      yanlis = benzersiz(bz.map(([m, b]) => adR(m, b)).filter(v => v !== dogru)).slice(0, 3);
      if (!yanlis.length) return null;
      acik = t('Benzer ayetler: {0}', bz.map(([m, b]) => adR(m, b)).join(', '));
    } else return null;
    if (!dogru || yanlis.length < 1) return null;
    return { anahtar, unit: 'ezber', tip: 'ezber', soru, dogru, secenek: karistir([dogru, ...yanlis.slice(0, 3)]), ust, ustRenkli: ust, aciklama: esc(acik), exSes: ses };
  }
  // Ezber yoklaması anahtarları: vadesi gelenler + hiç sorulmamışlardan
  function ezberAnahtarlari(adet = 10) {
    const havuz = ezberHavuzu(); if (!havuz.length) return [];
    const tum = [];
    havuz.forEach(([n, a]) => {
      const e = ezb(n);
      if (a < e.a) tum.push(`h:s:${n}:${a}`);
      if (a > 1) tum.push(`h:o:${n}:${a}`);
      tum.push(`h:t:${n}:${a}`, `h:h:${n}:${a}`);
      if (BENZER && BENZER[`${n}:${a}`]) tum.push(`h:m:${n}:${a}`);
    });
    const vadeli = tum.filter(k => S.srs[k] && S.srs[k].vade <= simdi()), yeni = tum.filter(k => !S.srs[k]);
    return karistir(vadeli).concat(karistir(yeni)).slice(0, adet);
  }
  async function ezberYoklamaBaslat() {
    const nler = Object.keys(S.ezber || {}).map(Number);
    await Promise.all(nler.map(n => sureYukle(n).catch(() => null))); await benzerYukle(); await kuranIndex();
    const k = ezberAnahtarlari(10);
    if (!k.length) return toast(t('Önce birkaç ayet ezberle ve "✓ Ezberledim" ile işaretle.'));
    oturumBaslat({ tur: 'ezber', kimlik: 'ezber', baslik: t('Ezber yoklaması'), anahtarlar: k, puanli: true });
  }
  // Sayfa başı / sayfa sonu soruları: p:b:sayfa, p:s:sayfa (yalnızca tamamen ezberlenmiş sayfalar)
  function ezberSayfalari() {
    const l = [];
    for (let p = 1; p <= 604; p++) { const ay = sayfaAyetleri(p); if (ay.length && ay.every(([n, a]) => ezberde(n, a))) l.push(p); }
    return l;
  }
  function sayfaSoru(anahtar) {
    const [, tip, p_] = anahtar.split(':'); const p = +p_;
    const ay = sayfaAyetleri(p); if (!ay.length) return null;
    const [n, a] = tip === 'b' ? ay[0] : ay[ay.length - 1]; const x = SURE(n); if (!x) return null;
    const dogru = kisalt(x.ayet[a - 1]);
    const digerleri = [p - 2, p - 1, p + 1, p + 2, p + 3].filter(q => q >= 1 && q <= 604 && q !== p).map(q => { const l = sayfaAyetleri(q); const r = tip === 'b' ? l[0] : l[l.length - 1]; return r && SURE(r[0]) ? kisalt(SURE(r[0]).ayet[r[1] - 1]) : null; }).filter(v => v && v !== dogru);
    if (!digerleri.length) return null;
    return { anahtar, unit: 'ezber', tip: 'ezber', soru: tip === 'b' ? t('{0}. sayfa hangi ayetle BAŞLAR?', p) : t('{0}. sayfa hangi ayetle BİTER?', p), dogru,
      secenek: karistir([dogru, ...karistir(digerleri).slice(0, 3)]), ust: `<p class="sayfa-no">📄 ${p}</p>`, ustRenkli: `<p class="sayfa-no">📄 ${p}</p>`, aciklama: esc(`${sureAdi(x)} ${a}`), exSes: ayetUrl(`${n}:${a}`) };
  }
  async function sayfaYoklamaBaslat() {
    await Promise.all(Object.keys(S.ezber || {}).map(n => sureYukle(+n).catch(() => null)));
    const sayfalar = ezberSayfalari();
    if (!sayfalar.length) return toast(t('Tamamını ezberlediğin bir sayfa yok. Sayfa başı soruları için en az bir sayfanın bütün ayetlerini ezberle.'));
    // komşu sayfaların metni de lazım
    const lazim = benzersiz(sayfalar.flatMap(p => [p - 2, p - 1, p + 1, p + 2, p + 3]).filter(q => q >= 1 && q <= 604).flatMap(q => sayfaAyetleri(q).map(r => r[0])));
    await Promise.all(lazim.map(n => sureYukle(n).catch(() => null)));
    const k = karistir(sayfalar.flatMap(p => [`p:b:${p}`, `p:s:${p}`])).slice(0, 10);
    oturumBaslat({ tur: 'sayfa', kimlik: 'sayfa', baslik: t('Sayfa başı / sonu yoklaması'), anahtarlar: k, puanli: true });
  }

  EKRAN.ezber = function () {
    const pl = ezberPlani(), hd = hatimDurum(), due = hDue(), hedef = S.ayar.ezberHedef || 3;
    // Bugünkü görevler: yeni ders → yakın tekrar → uzak tekrar (sırayla, tek Başla düğmesiyle)
    const oneri = !pl.yeni.length ? sonrakiOneri() : null;
    const gorevler = [];
    if (pl.yeni[0]) gorevler.push({ n: pl.yeni[0].n, mod: 'yeni' }); else if (oneri) gorevler.push({ n: oneri, mod: 'yeni', oneri: true });
    pl.yakin.filter(e => !gorevler.some(g => g.n === e.n)).forEach(e => gorevler.push({ n: e.n, mod: 'tekrar', tur: 'yakin' }));
    pl.uzak.filter(e => !gorevler.some(g => g.n === e.n)).forEach(e => gorevler.push({ n: e.n, mod: 'tekrar', tur: 'uzak' }));
    const yeniAd = g => { const e = ezb(g.n), bas = (e ? e.a : 0) + 1, x = SURE(g.n); if (!x) return t('{0}, {1}. ayetten', esc(sureNoAdi(g.n)), bas); const [b1, b2] = ezAralik(g.n, Math.min(bas, x.ayet.length)); return `${esc(sureNoAdi(g.n))} ${b1 === b2 ? b1 : b1 + '–' + b2}. ${t('ayetler')}${g.oneri ? ' · ' + t('öneri') : ''}`; };
    const yakinlar = gorevler.filter(g => g.tur === 'yakin'), uzaklar = gorevler.filter(g => g.tur === 'uzak'), yeniG = gorevler.find(g => g.mod === 'yeni');
    const satirlar = [
      yeniG ? [t('Sabak · yeni ders'), yeniAd(yeniG)] : null,
      yakinlar.length ? [t('Sabakî · yakın tekrar'), yakinlar.map(g => esc(sureNoAdi(g.n))).join(', ')] : null,
      uzaklar.length ? [t('Münzil · uzak tekrar'), uzaklar.map(g => esc(sureNoAdi(g.n))).join(', ')] : null,
    ].filter(Boolean);
    const dk = (yeniG ? 8 : 0) + (yakinlar.length + uzaklar.length) * 3;
    const liste = Object.entries(S.ezber || {}).map(([n, e]) => Object.assign({ n: +n }, e)).sort((a, b) => (a.tam - b.tam) || (b.eklendi - a.eklendi));
    const halka = e => { const top = ayetSayisi(e.n) || 1, p = e.tam ? 1 : Math.min(1, (e.a || 0) / top), C = 119.4;
      return `<svg class="ez-halka" viewBox="0 0 46 46" aria-hidden="true"><circle cx="23" cy="23" r="19"></circle><circle class="dolu ${e.tam ? 'tam' : ''}" cx="23" cy="23" r="19" stroke-dasharray="${(p * C).toFixed(1)} ${C}" transform="rotate(-90 23 23)"></circle></svg>`; };
    const durum = e => { const top = ayetSayisi(e.n); if (e.zayif && e.zayif.length) return t('{0} zayıf ayet', e.zayif.length); if (e.tam) return (e.vade || 0) <= simdi() ? t('Tekrar zamanı') : t('Ezberde'); return top ? t('{0}/{1} ayet', e.a || 0, top) : t('{0} ayet', e.a || 0); };
    app.innerHTML = `${kokEkran() ? ust(t('Kur\'an')) : ust(t('Ezber'))}<main>${kokEkran() ? kuranSekme('ezber') : ''}
      <section class="kart ez-bugun"><p class="ez-etiket">${t('Bugün')}</p>
        ${satirlar.length ? `<ol class="ez-gorevler">${satirlar.map(([ad, ne]) => `<li><b>${ad}:</b> ${ne}</li>`).join('')}</ol>
          <button class="btn genis ez-basla" id="ezBasla">${t('Başla · yaklaşık {0} dk', dk)}</button>
          <p class="kucukyazi ez-bugun-not">${t('Sırayla gider; biri bitince sıradakine geçersin.')}</p>
          <details class="kucukyazi ez-terim"><summary>${t('Sabak, sabakî, münzil ne demek?')}</summary><p>${t('Sabak: bugünkü yeni ders. Sabakî: son günlerde ezberlediklerinin tekrarı. Münzil: eski derslerin tekrarı.')}</p></details>`
        : `<p>${t('Bugün için ezber planı yok. Aşağıdan bir sûre ekle.')}</p>`}
        <p class="kucukyazi ez-hedef">${t('Günlük yeni ders:')} ${[1, 3, 5, 10, 999].map(k => `<button class="cip ${hedef === k ? 'aktif' : ''}" data-hedef="${k}">${k === 999 ? t('Hepsi') : t('{0} ayet', k)}</button>`).join(' ')}</p>
      </section>
      <button class="btn genis ez-tekrarla" data-git="tekrarlaSec">${IKON.tekrar} ${t('Tekrarla')} <small>${t('bir sûreyi istediğin kadar tekrarla')}</small></button>
      <h2 class="baslik">${t('Ezberlerim')} ${liste.length ? `<button class="link ez-rapor" id="ezRapor">${IKON.paylas} ${t('Ezber raporu')}</button>` : ''}</h2>
      ${liste.length ? `<div class="ez-izgara">${liste.map(e => `<button class="ez-sure" data-ez-sure="${e.n}">${halka(e)}<b>${esc(sureNoAdi(e.n))}</b><small>${durum(e)}</small></button>`).join('')}</div>` : `<section class="kart ez-bos"><h3>${IKON.filiz} ${t('İlk sûreni ekle')}</h3><p class="soluk">${t('Kısa sûrelerden (Nâs\'tan geriye doğru) başlamak kolaydır.')}</p><button class="btn genis" data-git="ezberEkle">➕ ${t('Süre ekle')}</button></section>`}
      <button class="btn genis ikincil ez-ekle" data-git="ezberEkle">${t('➕ Sûre ekle')}</button>
      <h2 class="baslik">${t('Diğer')}</h2>
      <div class="ez-diger kart">
        <button id="yoklama"><span>${t('Ezber yoklaması')}</span><small>${due ? t('{0} soru bekliyor', due) : ''} ›</small></button>
        <button data-git="muezzin|dua"><span>${t('Dualar')}</span><small>${(() => { const l = MZ('dua').M; return l.filter(x => mzDurum(x.id).tam).length + '/' + l.length; })()} ›</small></button>
        <button data-git="muezzin"><span>${t('Müezzinlik')}</span><small>${(() => { const l = MZ().M; return l.filter(x => mzDurum(x.id).tam).length + '/' + l.length; })()} ›</small></button>
        <button data-git="hatim"><span>${t('Sayfa ve hatim')}</span><small>${hd ? (hd.bitti ? t('Hatim bitti') : t('{0}/604 sayfa', hd.h.sayfa)) : ''} ›</small></button>
        <button data-git="okumaRaporu"><span>${t('Okuma raporu')}</span><small>${(S.okuma || []).length ? t('{0} ayet', (S.okuma || []).length) : ''} ›</small></button>
      </div>
    </main>`;
    kuranSekmeBagla();
    const eb = $('#ezBasla'); if (eb) eb.onclick = () => { const l = gorevler.slice(); if (l[0].oneri) ezberEkle(l[0].n); ezZincir = l.slice(1); ezAc(l[0].n, l[0].mod); };
    app.querySelectorAll('[data-ez-sure]').forEach(b => b.onclick = () => { ezZincir = []; const e = ezb(+b.dataset.ezSure); ezAc(+b.dataset.ezSure, e && e.tam ? 'tekrar' : 'yeni'); });
    $('#yoklama').onclick = ezberYoklamaBaslat;
    app.querySelectorAll('[data-hedef]').forEach(b => b.onclick = () => { S.ayar.ezberHedef = +b.dataset.hedef; kaydet(); ciz(); });
    // Ezber raporu: hocaya göndermek için düz metin (paylaş menüsü ya da panoya kopyala)
    const rp = $('#ezRapor'); if (rp) rp.onclick = () => {
      const tarih = d => d ? new Date(d).toLocaleDateString(DIL === 'en' ? 'en-GB' : 'tr-TR') : '-', satir = e => `• ${sureNoAdi(e.n)}: ${e.tam ? t('ezberde') : t('{0}/{1} ayet', e.a || 0, ayetSayisi(e.n) || '?')}${e.son ? ' · ' + t('son çalışma {0}', tarih(e.son)) : ''}${e.tam && e.vade ? ' · ' + t('sonraki tekrar {0}', tarih(e.vade)) : ''}${e.zayif && e.zayif.length ? ' · ' + t('zayıf ayet: {0}', e.zayif.join(', ')) : ''}`;
      const m = [`${t('Kur\'an Yolum · Ezber raporu')} · ${tarih(simdi())}`, AKTIF().ad ? AKTIF().ad : '', t('Ezber: {0} sûre ({1} tamam)', liste.length, liste.filter(e => e.tam).length), S.seri.gun ? t('Seri: {0} gün', S.seri.gun) : '', '', ...liste.map(satir)].filter((x, i) => x || i > 3).join('\n');
      if (navigator.share) navigator.share({ title: t('Ezber raporu'), text: m }).catch(() => { }); else if (navigator.clipboard) navigator.clipboard.writeText(m).then(() => toast(t('Kopyalandı'))).catch(() => { });
      window.__ezberRapor = m;
    };
    // Yeni dersin ayet aralığı sûre verisiyle hesaplanır: yüklü değilse yükle ve yenile
    if (yeniG && !SURE(yeniG.n)) sureYukle(yeniG.n).then(() => { if (ekranYigini[ekranYigini.length - 1][0] === 'ezber') ciz(); }).catch(() => { });
  };

  // ------------------------------------------------------------ Tekrarla: bir sûreyi istediğin kadar tekrarla (ezber oynatıcısı)
  // Ayarlar S.ayar.tk'da: tekrar, bekle (sn), hiz, oto (bitince başa dön), kaydir, ses, latin, meal, basamak (1 → 1-2 → 1-2-3), boy, gizle ('hepsi' | 'yari')
  const TK_VARSAYILAN = { tekrar: 5, bekle: 1, pay: 0, hiz: 1, oto: false, kaydir: true, ses: true, latin: true, meal: false, basamak: false, yon: 'ileri', boy: 1, gizle: 'hepsi' };
  const TK_TEKRAR = [1, 2, 3, 5, 7, 10, 15, 20, 30, 50, 99], TK_BEKLE = [0, 1, 2, 3, 5, 10];
  const tkAyar = () => Object.assign({}, TK_VARSAYILAN, S.ayar.tk || {});
  const tkYaz = (k, v) => { S.ayar.tk = Object.assign(tkAyar(), { [k]: v }); kaydet(); };
  const tkHizli = () => (window.__TECVID_HIZLI ? 50 : 1);   // yalnız testler: beklemeleri kısaltır
  let TK = null;   // { n, bas, bit, calma, log }
  EKRAN.tekrarlaSec = function () {
    app.innerHTML = `${ust(t('Tekrarla'))}<main>
      <p class="soluk">${t('Bir sûre seç: bütün ayetlerini tekrar sayısı, bekleme ve hızı ayarlayarak dinle, gizleyip okuyarak ezberle.')}</p>
      <label class="ara-kutu">${IKON.ara}<span class="gorunmez">${t('Sûre ara')}</span><input id="tkAra" type="search" placeholder="${t('Sûre ara: İkra, Yâsîn, 36…')}"></label>
      <div id="tkListe"><p class="soluk">${t('Yükleniyor…')}</p></div></main>`;
    kuranIndex().then(l => {
      const yer = $('#tkListe'); if (!yer) return;
      if (!l) { yer.innerHTML = `<p class="hata">${t('Sûre listesi açılamadı.')}</p>`; return; }
      const kisa = [1, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114], benim = Object.keys(S.ezber || {}).map(Number);
      const sira = benzersiz([...benim, ...kisa, ...l.map(x => x.n)]);
      const satir = n => { const x = l.find(y => y.n === n); if (!x) return ''; const e = ezb(n);
        return `<button class="tk-sure-satir" data-tk-sure="${n}" data-ara="${esc(trSade(`${n} ${sureAdi(x)} ${x.tr || ''} ${x.en || ''}`))}"><span class="no">${n}</span><b>${esc(sureAdi(x))}</b><small>${t('{0} ayet', x.a)}</small><span class="tam">${e && e.tam ? '✓' : ''}</span></button>`; };
      yer.innerHTML = sira.map(satir).join('');
      yer.querySelectorAll('[data-tk-sure]').forEach(b => b.onclick = () => git('tekrarla', +b.dataset.tkSure));
      $('#tkAra').oninput = e => { const q = trSade(e.target.value.trim()); yer.querySelectorAll('[data-ara]').forEach(b => { b.hidden = !!q && !b.dataset.ara.includes(q); }); };
    });
  };
  EKRAN.tekrarla = function (n, bas, bit) {
    n = +n; const x = SURE(n);
    if (!x) {
      app.innerHTML = `${ust(esc(sureNoAdi(n)))}<main><p class="soluk">${t('Yükleniyor…')}</p></main>`;
      sureYukle(n).then(() => { const ek = ekranYigini[ekranYigini.length - 1]; if (ek[0] === 'tekrarla' && +ek[1][0] === n) ciz(); }).catch(() => toast(t('Sûre açılamadı.')));
      return;
    }
    if (CANLI) canliDurdur(true);
    if (TK && TK.calma) { TK.calma.iptal = true; sesDurdur(); }
    const top = x.ayet.length, o0 = tkAyar();
    if (o0.meal && !mealSecili().every(k => mealVeri(k, n))) {   // meal açıksa önce yüklenir
      app.innerHTML = `${ust(esc(sureNoAdi(n)))}<main><p class="soluk">${t('Yükleniyor…')}</p></main>`;
      Promise.all(mealSecili().map(k => mealKaynakYukle(k, n))).then(() => { const ek = ekranYigini[ekranYigini.length - 1]; if (ek[0] === 'tekrarla' && +ek[1][0] === n) ciz(); }).catch(() => { tkYaz('meal', false); toast(t('Meal açılamadı.')); ciz(); });
      return;
    }
    const eski = TK && TK.n === n ? TK : null;
    bas = Math.min(top, Math.max(1, +bas || (eski ? eski.bas : 1))); bit = Math.min(top, Math.max(bas, +bit || (eski ? eski.bit : top)));
    TK = { n, bas, bit, calma: null, log: [] };
    const OKU = (window.OKUNUS || {})[DIL === 'en' ? 'en' : 'tr'] || {}, okunusVar = !!OKU[`${n}:1`], e = ezb(n);
    const ayetHTML = a => {
      const r = `${n}:${a}`; let ofs = 0;
      const kel = x.ayet[a - 1].split(' ').map((w, wi) => { const ic = durakIsik(kelimeHTML(r, w, ofs)); ofs += w.length + 1; return `<span class="kelime" data-ses="${kelimeUrl(r, wi + 1)}">${ic}</span>`; }).join(' ');
      const meal = mealSecili().map(k => [k, (mealVeri(k, n) || [])[a - 1]]).filter(z => z[1]);
      return `<div class="ez-ayet tk-ayet ${a < bas || a > bit ? 'tk-disari' : ''}" id="ayet-${a}" data-a="${a}"><div class="ayet" dir="rtl" lang="ar">${kel} <span class="ayet-no">﴿${a.toLocaleString('ar-EG')}﴾</span></div>${OKU[r] ? `<p class="okunus">${esc(OKU[r])}</p>` : ''}${meal.map(([k, m]) => `<p class="ko-meal">${esc(m)}${meal.length > 1 ? ` <small class="soluk">· ${esc(k.ad)}</small>` : ''}</p>`).join('')}<div class="rapor-kutu" id="rapor-${a}" hidden></div></div>`;
    };
    const besmele = n !== 1 && n !== 9 ? `<div class="besmele" dir="rtl" lang="ar">${esc(trBesmele() || window.BESMELE || '')}</div>` : '';
    const sayac = (id, deger) => `<b id="${id}">${deger}</b>`;
    const onay = (id, ad, acik) => `<label class="tk-onay"><input type="checkbox" id="${id}" ${acik ? 'checked' : ''}><span>${ad}</span></label>`;
    app.innerHTML = `${ust(esc(sureNoAdi(n)))}<main class="ez-ekran tk-ekran">
      <details class="kart tk-ust" id="tkAyarKutu"><summary><b>⚙️ ${t('Ayarlar')}</b> <span class="soluk kucukyazi">${bas}–${bit}. ${t('ayet')}</span></summary>
        <div class="tk-satir tk-aralik"><span>${t('Ayetler')}</span><input id="tkBas" type="number" inputmode="numeric" min="1" max="${top}" value="${bas}" aria-label="${t('İlk ayet')}"><span>–</span><input id="tkBit" type="number" inputmode="numeric" min="1" max="${top}" value="${bit}" aria-label="${t('Son ayet')}"><span class="soluk">/ ${top}</span><button class="cip ${bas === 1 && bit === top ? 'aktif' : ''}" id="tkHepsi">${t('Hepsi')}</button></div>
        <div class="tk-secenek">
          ${okunusVar ? onay('tkLatin', t('Okunuş'), o0.latin) : ''}${onay('tkMeal', t('Meal'), o0.meal)}${onay('tkSes', t('Ses açık'), o0.ses)}${onay('tkBasamak', t('Basamak yöntemi'), o0.basamak)}${onay('tkGeri', t('Sondan başa'), o0.yon === 'geri')}
          ${onay('tkOto', t('Oto tekrar'), o0.oto)}${onay('tkKaydir', t('Oto kaydır'), o0.kaydir)}${onay('tkEzber', t('Ezberlendi'), !!(e && e.tam))}
        </div>
        <div class="tk-satir"><span>${t('Okuma hızı')}</span>${[0.75, 1, 1.25, 1.5].map(h => `<button class="cip ${o0.hiz === h ? 'aktif' : ''}" data-tk-hiz="${h}">${h}×</button>`).join('')}<span class="tk-boy"><button class="cip" id="tkKucult" aria-label="${t('Yazıyı küçült')}">A−</button><button class="cip" id="tkBuyut" aria-label="${t('Yazıyı büyüt')}">A+</button></span></div>
        <div class="tk-satir"><span>${t('Sessiz tekrar payı')}</span>${[[0, t('Sabit bekleme')], [1, t('Ayet süresi ×1')], [2, t('×2')], [3, t('×3')]].map(([v, ad]) => `<button class="cip ${o0.pay === v ? 'aktif' : ''}" data-tk-pay="${v}">${ad}</button>`).join('')}</div>
        <div class="tk-satir"><span>${t('Tekrarlar bitince')}</span>${[[false, t('Dursun')], [true, t('Başa dönsün')]].map(([v, ad]) => `<button class="cip ${!!o0.oto === v ? 'aktif' : ''}" data-tk-bitince="${v ? 1 : 0}">${ad}</button>`).join('')}</div>
        <div class="tk-satir"><span>${t('Gizleyerek oku')}</span>${[['hepsi', t('Tamamı')], ['yari', t('Yarısı')]].map(([v, ad]) => `<button class="cip ${o0.gizle === v ? 'aktif' : ''}" data-tk-gizle="${v}">${ad}</button>`).join('')}</div>
        <p class="kucukyazi soluk tk-not" id="tkNot">${t('Basamak yöntemi: önce 1. ayet, sonra 1–2, sonra 1–2–3… her basamak tekrar sayısı kadar. Gizle ve oku: kelimeler gizlenir, okudukça açılır.')}</p>
      </details>
      <div class="tk-hizli"><button class="btn kucuk" id="tkGizleOku">${IKON.goz} ${t('Gizle ve oku')}</button><button class="btn kucuk ikincil" id="tkGoster">👁 ${t('Göster')}</button></div>
      <section class="kart ez-kart tk-kart ${o0.latin ? '' : 'tk-latin-kapali'} ${o0.meal ? '' : 'tk-meal-kapali'}" id="tkKart" style="--ar-olcek:${o0.boy}">${besmele}${Array.from({ length: top }, (_, i) => ayetHTML(i + 1)).join('')}</section>
      <div class="canli-bar" id="canliBar" hidden>${canliBarHTML()}</div>
    </main>
    <div class="tk-alt" id="tkAlt"><p class="tk-durum" id="tkDurum">${t('Hazır')}</p>
      <div class="tk-alt-satir">
        <div class="tk-say"><small>${t('Bekleme (sn)')}</small><div><button class="tk-yuv" data-tk-say="bekle-" aria-label="${t('Bekleme azalt')}">−</button>${sayac('tkBekle', o0.bekle)}<button class="tk-yuv" data-tk-say="bekle+" aria-label="${t('Bekleme artır')}">+</button></div></div>
        <button class="btn tk-basla" id="tkBasla">▶ ${t('BAŞLA')}</button>
        <div class="tk-say"><small>${t('Tekrar')}</small><div><button class="tk-yuv" data-tk-say="tekrar-" aria-label="${t('Tekrar azalt')}">−</button>${sayac('tkTekrar', o0.tekrar)}<button class="tk-yuv" data-tk-say="tekrar+" aria-label="${t('Tekrar artır')}">+</button></div></div>
      </div></div>`;
    const kart = $('#tkKart'), durum = m => { const d = $('#tkDurum'); if (d) d.textContent = m; };
    // ---- ayarlar
    const git_ = (b2, b3) => { ekranYigini[ekranYigini.length - 1] = ['tekrarla', [n, b2, b3]]; ciz(); };
    const aralik = () => { const b2 = Math.min(top, Math.max(1, +$('#tkBas').value || 1)), b3 = Math.min(top, Math.max(b2, +$('#tkBit').value || top)); git_(b2, b3); };
    $('#tkBas').onchange = aralik; $('#tkBit').onchange = aralik; $('#tkHepsi').onclick = () => git_(1, top);
    const onayBagla = (id, f) => { const el = $('#' + id); if (el) el.onchange = () => f(el.checked); };
    onayBagla('tkLatin', v => { tkYaz('latin', v); kart.classList.toggle('tk-latin-kapali', !v); });
    onayBagla('tkMeal', v => { tkYaz('meal', v); if (v && !mealSecili().every(k => mealVeri(k, n))) ciz(); else kart.classList.toggle('tk-meal-kapali', !v); });
    onayBagla('tkSes', v => tkYaz('ses', v)); onayBagla('tkBasamak', v => tkYaz('basamak', v)); onayBagla('tkGeri', v => tkYaz('yon', v ? 'geri' : 'ileri')); onayBagla('tkOto', v => tkYaz('oto', v)); onayBagla('tkKaydir', v => tkYaz('kaydir', v));
    onayBagla('tkEzber', v => { if (v) ezberIsaretle(n, top); else { const z = ezb(n); if (z) { z.tam = false; z.a = Math.min(z.a || 0, top - 1); kaydet(); } } });
    app.querySelectorAll('[data-tk-hiz]').forEach(b => b.onclick = () => { const h = +b.dataset.tkHiz; tkYaz('hiz', h); if (ses && TK.calma) ses.playbackRate = h; app.querySelectorAll('[data-tk-hiz]').forEach(z => z.classList.toggle('aktif', z === b)); });
    const boyla = d => { const y = Math.min(1.5, Math.max(0.6, +(tkAyar().boy + d).toFixed(2))); tkYaz('boy', y); kart.style.setProperty('--ar-olcek', y); };
    $('#tkKucult').onclick = () => boyla(-0.1); $('#tkBuyut').onclick = () => boyla(0.1);
    app.querySelectorAll('[data-tk-pay]').forEach(b => b.onclick = () => { tkYaz('pay', +b.dataset.tkPay); app.querySelectorAll('[data-tk-pay]').forEach(z => z.classList.toggle('aktif', z === b)); });
    app.querySelectorAll('[data-tk-bitince]').forEach(b => b.onclick = () => { tkYaz('oto', b.dataset.tkBitince === '1'); const oc = $('#tkOto'); if (oc) oc.checked = b.dataset.tkBitince === '1'; app.querySelectorAll('[data-tk-bitince]').forEach(z => z.classList.toggle('aktif', z === b)); });
    app.querySelectorAll('[data-tk-gizle]').forEach(b => b.onclick = () => { tkYaz('gizle', b.dataset.tkGizle); app.querySelectorAll('[data-tk-gizle]').forEach(z => z.classList.toggle('aktif', z === b)); });
    app.querySelectorAll('[data-tk-say]').forEach(b => b.onclick = () => {
      const [ad, yon] = [b.dataset.tkSay.slice(0, -1), b.dataset.tkSay.slice(-1) === '+' ? 1 : -1], liste = ad === 'tekrar' ? TK_TEKRAR : TK_BEKLE, simdiki = tkAyar()[ad];
      let i = liste.findIndex(v => v >= simdiki); if (i < 0) i = liste.length - 1; if (liste[i] !== simdiki && yon < 0) i++;   // aralarda kalan eski değer
      const v = liste[Math.min(liste.length - 1, Math.max(0, i + yon))]; tkYaz(ad, v); $(ad === 'tekrar' ? '#tkTekrar' : '#tkBekle').textContent = v;
    });
    // ---- oynatma
    const bekle = (ms, is) => new Promise(coz => { const bit_ = Date.now() + ms / tkHizli(), tik = () => (is.iptal || !document.body.contains(kart) || Date.now() >= bit_) ? coz() : setTimeout(tik, 40); tik(); });
    const oynat = (a, is) => new Promise(coz => {
      const o = tkAyar(), words = x.ayet[a - 1].split(' ').length;
      TK.log.push(a);
      document.querySelectorAll('.tk-ayet.calan').forEach(y => y.classList.remove('calan'));
      const el = document.getElementById('ayet-' + a); if (el) { el.classList.add('calan'); if (o.kaydir && !window.__TECVID_HIZLI) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      if (!o.ses) return bekle(Math.max(1500, words * 600 / o.hiz), is).then(coz);
      const au = new Audio(sesKaynak(ayetUrl(`${n}:${a}`))); ses = au; au.playbackRate = o.hiz;
      au.onended = () => coz(); au.onerror = () => { is.hata = true; coz(); };
      au.play().catch(() => { is.hata = true; coz(); });
      const izle = () => { if (is.iptal || !document.body.contains(kart)) { au.pause(); coz(); } else if (!au.ended && !au.error) setTimeout(izle, 200); }; izle();
    });
    const tkDur = () => { if (TK.calma) { TK.calma.iptal = true; TK.calma = null; } sesDurdur(); document.querySelectorAll('.tk-ayet.calan').forEach(y => y.classList.remove('calan')); const b = $('#tkBasla'); if (b) { b.textContent = '▶ ' + t('BAŞLA'); b.classList.remove('caliyor'); } };
    async function tkBasla() {
      if (CANLI) await canliDurdur(true);
      const is = { iptal: false, hata: false }; TK.calma = is; TK.log = [];
      const b = $('#tkBasla'); b.textContent = '⏹ ' + t('DURDUR'); b.classList.add('caliyor');
      const plan = [], ters = tkAyar().yon === 'geri', aralik_ = (x1, x2) => Array.from({ length: x2 - x1 + 1 }, (_, i) => x1 + i);
      if (tkAyar().basamak) { if (ters) for (let k = bit; k >= bas; k--) plan.push(aralik_(k, bit)); else for (let k = bas; k <= bit; k++) plan.push(aralik_(bas, k)); }   // sondan başa basamak: son ayet, son iki ayet, …
      else { for (let a = bas; a <= bit; a++) plan.push([a]); if (ters) plan.reverse(); }
      let tur = 0;
      do {
        tur++;
        for (let u = 0; u < plan.length; u++) for (let r = 1; r <= tkAyar().tekrar; r++) for (const a of plan[u]) {
          if (is.iptal || !document.body.contains(kart)) return tkDur();
          durum(`${t('Tekrar {0}/{1}', r, tkAyar().tekrar)} · ${t('Ayet {0}', a)}${tkAyar().basamak ? ' · ' + t('Basamak {0}/{1}', u + 1, plan.length) : ''}${tkAyar().oto && tur > 1 ? ' · ' + t('Tur {0}', tur) : ''}`);
          const t0_ = Date.now(); await oynat(a, is);
          if (is.hata) { tkDur(); toast(t('Ses çalınamadı. İnternet bağlantını kontrol et.')); durum(t('Hazır')); return; }
          if (is.iptal) return tkDur();
          // Sessiz tekrar payı: pay > 0 ise bekleme, ayetin süresinin pay katıdır (o sürede sen tekrar edersin)
          const pay_ = tkAyar().pay; if (pay_ > 0) durum(`${t('Sen tekrar et…')} · ${t('Ayet {0}', a)}`);
          await bekle(pay_ > 0 ? Math.max(800, (Date.now() - t0_) * tkHizli() * pay_) : tkAyar().bekle * 1000, is);
        }
      } while (tkAyar().oto && !is.iptal && document.body.contains(kart));
      tkDur(); durum(t('Bitti. Tekrar başlatabilirsin.'));
    }
    $('#tkBasla').onclick = () => { if (TK.calma) { tkDur(); durum(t('Durdu')); } else tkBasla(); };
    // ---- gizle ve oku (mikrofon takip motoru)
    $('#tkGizleOku').onclick = async () => {
      if (CANLI) return canliDurdur();
      if (TK.calma) tkDur();
      const alt = $('#tkAlt'); if (alt) alt.hidden = true;
      const yari = tkAyar().gizle === 'yari';
      await canliBaslat(n, bas, { bit, gizle: yari ? (a, wi) => wi % 2 === 1 : () => true, bitince: C_ => {
        canliSonucGoster(C_);
        const kapat = $('#canliKapat'), geri = () => { const al = $('#tkAlt'); if (al) al.hidden = false; };
        if (kapat) { const f = kapat.onclick; kapat.onclick = () => { f(); geri(); }; } else geri();
      } });
      if (!CANLI && alt) alt.hidden = false;   // başlatılamadıysa (izin yok vb.) alt çubuk geri gelir
    };
    $('#tkGoster').onclick = () => { if (CANLI) canliDurdur(true); const al = $('#tkAlt'); if (al) al.hidden = false; ciz(); };
  };

  // Hatim takvimi ve sayfa sayfa okuma (Ezber > Diğer)
  EKRAN.hatim = function () {
    const hd = hatimDurum();
    app.innerHTML = `${ust(t('Sayfa ve hatim'))}<main>
      <article class="kart">
        ${hd ? `<h2>${t('📖 Hatim')}</h2><div class="bar"><div class="iyi" style="width:${Math.round(hd.h.sayfa / 604 * 100)}%"></div></div>
          <p>${hd.bitti ? t('Hatmi bitirdin. Allah kabul etsin! 🤲') : t('{0}/604 sayfa · Bugünkü hedef: <b>{1} sayfa</b> · kalan {2} gün', hd.h.sayfa, hd.gunluk, hd.kalanGun)}</p>
          <div class="satir sola">${hd.bitti ? '' : `<button class="btn" data-git="sayfa|${hd.h.sayfa + 1}">${t('Kaldığın yerden oku ({0}. sayfa)', hd.h.sayfa + 1)}</button>`}<button class="btn ikincil" id="hatimYeni">${t('Yeni hatim')}</button></div>`
        : `<h2>${t('📖 Hatim takvimi')}</h2><p>${t('Kur\'an\'ı sayfa sayfa okuyup bitirmek için bir süre seç; her gün kaç sayfa okuman gerektiğini hesaplarım.')}</p>
          <div class="satir sola">${[30, 60, 90, 180].map(g => `<button class="btn ikincil" data-hatim="${g}">${t('{0} gün', g)}</button>`).join('')}</div>`}
      </article>
      <div class="bolumler">
        <button class="bolum" data-git="sayfa|${S.sonSayfa || 1}${KO().son && KO().son.n ? '|' + KO().son.n + ':' + KO().son.a : ''}"><span class="ikon">📄</span><span class="bad"><small>${t('Mushaf, 604 sayfa · {0}. sayfadan devam', S.sonSayfa || 1)}</small>${t('Sayfa sayfa oku')}</span><span class="rozet">›</span></button>
        <button class="bolum" id="sayfaYoklama"><span class="ikon">🧩</span><span class="bad"><small>${t('Ezberlediğin sayfalardan')}</small>${t('Sayfa başı / sonu yoklaması')}</span><span class="rozet">›</span></button>
      </div></main>`;
    $('#sayfaYoklama').onclick = sayfaYoklamaBaslat;
    app.querySelectorAll('[data-hatim]').forEach(b => b.onclick = () => { S.hatim = { bas: bugun(), gun: +b.dataset.hatim, sayfa: 0 }; kaydet(); ciz(); });
    const hy = $('#hatimYeni'); if (hy) hy.onclick = async () => { if (!(await onayPenceresi(t('Yeni hatim başlatılsın mı?'), t('Şimdiki hatim sıfırlanır.'), t('Başlat')))) return; S.hatim = null; kaydet(); ciz(); };
  };

  EKRAN.ezberEkle = function () {
    app.innerHTML = `${ust(t('Ezbere sûre ekle'))}<main>
      <p class="soluk">${t('Hafızlığa genelde kısa sûrelerden (Nâs\'tan geriye doğru) başlanır.')}</p>
      <div class="form"><input id="sureAra" type="search" placeholder="${t('Sûre ara (ad ya da numara)')}"></div>
      <div class="bolumler" id="ekleListe" style="margin-top:10px"><p class="soluk">${t('Yükleniyor…')}</p></div></main>`;
    kuranIndex().then(l => {
      const yer = $('#ekleListe'); if (!yer || !l) return;
      yer.innerHTML = l.slice().reverse().map(x => `<button class="bolum" data-ekle="${x.n}" data-ara="${esc(sureAraMetni(x))}"><span class="ikon" style="font-size:.8rem;width:28px;color:var(--soluk)">${x.n}</span><span class="bad"><small>${t('{0} ayet', x.a)}</small>${esc(sureAdi(x))}</span>${ezb(x.n) ? `<span class="rozet ok">${t('listede')}</span>` : '<span class="rozet">➕</span>'}</button>`).join('');
      yer.querySelectorAll('[data-ekle]').forEach(b => b.onclick = () => { const n = +b.dataset.ekle; ezberEkle(n); ekranYigini.pop(); ezZincir = []; ezAc(n, 'yeni'); });
      $('#sureAra').oninput = e => { const q = trSade(e.target.value.trim()); yer.querySelectorAll('[data-ara]').forEach(b => { b.hidden = q && !b.dataset.ara.includes(q); }); };
    });
  };

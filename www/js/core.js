/* Kur'an Yolum — Çekirdek: profiller, kâriler, durum, bulut eşitleme, yardımcılar, ses, ayet gösterimi, Kur'an verisi */
/* app.js bölündü: bu dosyalar sırayla yüklenir, aynı genel kapsamı paylaşır (bkz. TODO.md). */
'use strict';
  const { R, U, KAYNAK } = window.TC;
  const AYAH = window.AYAH, RENK = window.TECVID_RENK || {};
  (window.SURELER || []).forEach(x => x.ayet.forEach((a, i) => { AYAH[`${x.n}:${i + 1}`] = a; }));
  const t = window.t, DIL = window.DIL;
  const GECME = 80;                       // bölüm/ara sınav geçme yüzdesi
  const ARALIK = [0, 1, 2, 4, 8, 16, 32]; // kutu → gün (aralıklı tekrar)
  // ------------------------------------------------------------ profiller (aynı telefonda birden çok kişi)
  // Kayıt: 'tecvid-ogren.profiller' = { aktif, liste: [{ id, ad, yas: 'kucuk'|'cocuk'|'buyuk', d }] }.
  // İlk profilin (p1) verisi eski anahtarda kalır; diğerleri 'tecvid-ogren.v1.<id>' anahtarında.
  const PKEY = 'tecvid-ogren.profiller';
  let PR = null; try { PR = JSON.parse(localStorage.getItem(PKEY) || 'null'); } catch (e) { }
  if (!PR || !Array.isArray(PR.liste) || !PR.liste.length) PR = { aktif: 'p1', liste: [{ id: 'p1', ad: '', yas: null }] };
  if (!PR.liste.some(p => p.id === PR.aktif)) PR.aktif = PR.liste[0].id;
  const profilKaydet = () => { try { localStorage.setItem(PKEY, JSON.stringify(PR)); } catch (e) { } };
  const AKTIF = () => PR.liste.find(p => p.id === PR.aktif) || PR.liste[0];
  const cocukMu = () => AKTIF().yas === 'kucuk' || AKTIF().yas === 'cocuk';
  const YAS_AD = { kucuk: t('4–6 yaş'), cocuk: t('7–12 yaş'), buyuk: t('13 yaş ve üstü') };
  const KEY = PR.aktif === 'p1' ? 'tecvid-ogren.v1' : 'tecvid-ogren.v1.' + PR.aktif;
  function profilDegistir(id) {
    PR.aktif = id; profilKaydet();
    try { sessionStorage.setItem('hk.secildi', '1'); sessionStorage.setItem('hk.acilisYok', '1'); } catch (e) { }
    location.reload();
  }
  function profilBirlestir(a, b) {
    // Silinenler (tombstone) de birleştirmeye katılır; yoksa yeni silme buluta gitmeden kaybolur ve profil geri gelir.
    const m = new Map(); [...(b.liste || []), ...(b.silinen || []), ...(a.liste || []), ...(a.silinen || [])].forEach(p => { const x = m.get(p.id); if (!x || (p.d || 0) >= (x.d || 0)) m.set(p.id, p); });
    const liste = [...m.values()].filter(p => !p.silindi).sort((x, y) => x.id === 'p1' ? -1 : y.id === 'p1' ? 1 : (x.id < y.id ? -1 : 1));
    const silinen = [...m.values()].filter(p => p.silindi);
    return { aktif: a.aktif, liste: liste.length ? liste : a.liste, silinen };
  }
  const $ = (s, el = document) => el.querySelector(s);
  const app = $('#app');

  // ------------------------------------------------------------ kâriler (everyayah.com klasör adları doğrulandı)
  const KARILER = [
    { id: 'husary_muallim', klasor: 'Husary_Muallim_128kbps', ad: DIL === 'en' ? 'Mahmoud Khalil al-Husary' : 'Mahmûd Halîl el-Husarî', tur: t('Öğretim (yavaş, tekrar için)') },
    { id: 'minshawy_teacher', klasor: 'Minshawy_Teacher_128kbps', ad: DIL === 'en' ? 'Muhammad Siddiq al-Minshawi' : 'Muhammed Sıddîk el-Minşâvî', tur: t('Öğretim (yavaş, tekrar için)') },
    // Türk hafızlar: Diyanet İşleri Başkanlığı Kur'an portalının ayet ayet kayıtları (izin başvurusu yayından önce yapılacak)
    { id: 'davut_kaya', klasor: 'ar_davutKaya', ad: 'Hafız Davut Kaya', tur: t('Türk hafızlar (Diyanet)') },
    { id: 'osman_sahin', klasor: 'ar_osmanSahin', ad: 'Hafız Osman Şahin', tur: t('Türk hafızlar (Diyanet)') },
    { id: 'mehmet_cevik', klasor: 'ar_mehmetcevik', ad: 'Hafız Mehmet Çevik', tur: t('Türk hafızlar (Diyanet)') },
    { id: 'husary', klasor: 'Husary_128kbps', ad: DIL === 'en' ? 'Mahmoud Khalil al-Husary' : 'Mahmûd Halîl el-Husarî', tur: t('Mürettel') },
    { id: 'minshawy', klasor: 'Minshawy_Murattal_128kbps', ad: DIL === 'en' ? 'Muhammad Siddiq al-Minshawi' : 'Muhammed Sıddîk el-Minşâvî', tur: t('Mürettel') },
    { id: 'abdulbasit', klasor: 'Abdul_Basit_Murattal_192kbps', ad: DIL === 'en' ? 'Abdul Basit Abdus-Samad' : 'Abdülbâsıt Abdüssamed', tur: t('Mürettel') },
    { id: 'alafasy', klasor: 'Alafasy_128kbps', ad: DIL === 'en' ? 'Mishary Rashid Alafasy' : 'Mişârî Râşid el-Afâsî', tur: t('Mürettel') },
    { id: 'sudais', klasor: 'Abdurrahmaan_As-Sudais_192kbps', ad: DIL === 'en' ? 'Abdur-Rahman as-Sudais' : 'Abdurrahman es-Sudeys', tur: t('Mürettel') },
    { id: 'maher', klasor: 'MaherAlMuaiqly128kbps', ad: DIL === 'en' ? 'Maher al-Muaiqly' : 'Mâhir el-Muaykılî', tur: t('Mürettel') },
    { id: 'ghamadi', klasor: 'Ghamadi_40kbps', ad: DIL === 'en' ? 'Saad al-Ghamdi' : 'Sa‘d el-Gâmidî', tur: t('Mürettel') },
    { id: 'husary_mujawwad', klasor: 'Husary_128kbps_Mujawwad', ad: DIL === 'en' ? 'Mahmoud Khalil al-Husary' : 'Mahmûd Halîl el-Husarî', tur: t('Mücevved (makamlı, yavaş)') },
    { id: 'minshawy_mujawwad', klasor: 'Minshawy_Mujawwad_192kbps', ad: DIL === 'en' ? 'Muhammad Siddiq al-Minshawi' : 'Muhammed Sıddîk el-Minşâvî', tur: t('Mücevved (makamlı, yavaş)') },
    { id: 'abdulbasit_mujawwad', klasor: 'Abdul_Basit_Mujawwad_128kbps', ad: DIL === 'en' ? 'Abdul Basit Abdus-Samad' : 'Abdülbâsıt Abdüssamed', tur: t('Mücevved (makamlı, yavaş)') },
    { id: 'mustafa_ismail', klasor: 'Mustafa_Ismail_48kbps', ad: DIL === 'en' ? 'Mustafa Ismail' : 'Mustafa İsmâil', tur: t('Mürettel') },
    { id: 'tablawi', klasor: 'Mohammad_al_Tablaway_128kbps', ad: DIL === 'en' ? 'Muhammad al-Tablawi' : 'Muhammed et-Tablâvî', tur: t('Mürettel') },
    { id: 'hudhaify', klasor: 'Hudhaify_128kbps', ad: DIL === 'en' ? 'Ali al-Hudhaifi' : 'Ali el-Huzeyfî', tur: t('Mürettel') },
    { id: 'ayyoub', klasor: 'Muhammad_Ayyoub_128kbps', ad: DIL === 'en' ? 'Muhammad Ayyub' : 'Muhammed Eyyûb', tur: t('Mürettel') },
    { id: 'shatri', klasor: 'Abu_Bakr_Ash-Shaatree_128kbps', ad: DIL === 'en' ? 'Abu Bakr al-Shatri' : 'Ebû Bekir eş-Şâtırî', tur: t('Mürettel') },
    { id: 'shuraym', klasor: 'Saood_ash-Shuraym_128kbps', ad: DIL === 'en' ? 'Saud al-Shuraim' : 'Suûd eş-Şüreym', tur: t('Mürettel') },
    { id: 'rifai', klasor: 'Hani_Rifai_192kbps', ad: DIL === 'en' ? 'Hani ar-Rifai' : 'Hânî er-Rifâî', tur: t('Mürettel') },
    { id: 'jibreel', klasor: 'Muhammad_Jibreel_128kbps', ad: DIL === 'en' ? 'Muhammad Jibreel' : 'Muhammed Cibrîl', tur: t('Mürettel') },
    { id: 'basfar', klasor: 'Abdullah_Basfar_192kbps', ad: DIL === 'en' ? 'Abdullah Basfar' : 'Abdullah Basfar', tur: t('Mürettel') },
    { id: 'juhany', klasor: 'Abdullaah_3awwaad_Al-Juhaynee_128kbps', ad: DIL === 'en' ? 'Abdullah Awad al-Juhani' : 'Abdullah Avvâd el-Cühenî', tur: t('Mürettel') },
    { id: 'ajamy', klasor: 'ahmed_ibn_ali_al_ajamy_128kbps', ad: DIL === 'en' ? 'Ahmad al-Ajmi' : 'Ahmed el-Acemî', tur: t('Mürettel') },
    { id: 'dussary', klasor: 'Yasser_Ad-Dussary_128kbps', ad: DIL === 'en' ? 'Yasser al-Dosari' : 'Yâsir ed-Devserî', tur: t('Mürettel') },
    { id: 'qatami', klasor: 'Nasser_Alqatami_128kbps', ad: DIL === 'en' ? 'Nasser al-Qatami' : 'Nâsır el-Katâmî', tur: t('Mürettel') },
    { id: 'budair', klasor: 'Salah_Al_Budair_128kbps', ad: DIL === 'en' ? 'Salah al-Budair' : 'Salâh el-Budeyr', tur: t('Mürettel') },
    { id: 'bukhatir', klasor: 'Salaah_AbdulRahman_Bukhatir_128kbps', ad: DIL === 'en' ? 'Salah Bukhatir' : 'Salâh Buhâtır', tur: t('Mürettel') },
  ];
  const kari = () => KARILER.find(k => k.id === S.ayar.kari) || KARILER[0];

  // ------------------------------------------------------------ renkli tecvid açıklaması
  const LEJANT = [
    ['m2', t('Med-i tabîî / ârız / lîn')], ['mt', t('Med-i muttasıl')], ['mf', t('Med-i munfasıl')], ['ml', t('Med-i lâzım')],
    ['g', t('Ğunne')], ['h', t('İhfâ (ve ihfâ-i şefevî)')], ['dg', t('İdğâm (ğunneli)')], ['db', t('İdğâm (ğunnesiz)')],
    ['k', t('İklâb')], ['q', t('Kalkale')], ['s', t('Okunmayan harf (hemze-i vasl, şemsî lâm)')]
  ];
  const lejantHTML = () => `<div class="lejant">${LEJANT.map(([k, ad]) => `<span class="tc-${k}"><i></i><b style="color:var(--metin);font-weight:500">${esc(ad)}</b></span>`).join('')}</div>`;

  // ------------------------------------------------------------ durum
  const bos = () => ({ ilerleme: {}, okunan: {}, srs: {}, gecmis: [], ayar: { hiz: 1, kari: 'husary_muallim', tema: 'sistem', renkli: true, hatirlat: { acik: false, saat: '20:00' } }, seri: { son: '', gun: 0 } });
  let S;
  try { S = Object.assign(bos(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { S = bos(); }
  S.ayar = Object.assign(bos().ayar, S.ayar);
  let yuklemeZamanlayici = null, sonEsitleme = null, esitleniyor = false;
  const kaydet = () => {
    S.degisti = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast(t('Kaydedilemedi: ') + e.message); }
    clearTimeout(yuklemeZamanlayici); yuklemeZamanlayici = setTimeout(buluta, 1500);
  };
  function temaUygula() { const h = document.documentElement; h.dataset.yazim = (S.ayar.yazim || 'tr'); h.dataset.tema = S.ayar.tema || 'sistem'; h.dataset.renk = S.ayar.renk || 'yesil'; try { localStorage.setItem('tecvid-ogren.renk', S.ayar.renk || 'yesil'); } catch (e) { } requestAnimationFrame(() => { const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = getComputedStyle(h).getPropertyValue('--ust-bg').trim() || '#0f5a47'; }); h.dataset.kontrast = S.ayar.yuksekKontrast ? 'yuksek' : ''; h.dataset.hareket = S.ayar.hareketAzalt ? 'azalt' : ''; h.style.fontSize = Math.round((S.ayar.yazi || 1) * 100) + '%'; h.style.setProperty('--ar-olcek', S.ayar.arYazi || 1); try { localStorage.setItem('tecvid-ogren.tema', S.ayar.tema || 'sistem'); } catch (e) { } }
  temaUygula();

  // ------------------------------------------------------------ bulut eşitleme
  const B = () => window.Bulut;
  // İç notlar ("Hoca onayı bekliyor") yalnız test sürümünde görünür: localhost ya da adreste ?test
  const TEST_SURUM = location.hostname === 'localhost' || /[?&]test\b/.test(location.search);
  const girisli = () => !!(B() && B().kullanici());
  function birlestir(a, b) {
    const r = bos(); r.ayar = Object.assign({}, bos().ayar, b.ayar, a.ayar);
    for (const id of new Set([...Object.keys(a.ilerleme || {}), ...Object.keys(b.ilerleme || {})])) {
      const x = (a.ilerleme || {})[id] || {}, y = (b.ilerleme || {})[id] || {};
      r.ilerleme[id] = { en: Math.max(x.en || 0, y.en || 0), deneme: Math.max(x.deneme || 0, y.deneme || 0), gecti: !!(x.gecti || y.gecti) };
      if ((x.atla || y.atla) && !r.ilerleme[id].deneme) r.ilerleme[id].atla = true;
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
    r.seri = Object.assign({}, r.seri, { en: Math.max(sa.en || 0, sb.en || 0, r.seri.gun || 0) });
    r.degisti = Math.max(a.degisti || 0, b.degisti || 0);
    r.hesapUyariKapali = a.hesapUyariKapali || b.hesapUyariKapali;
    const sl = x => x.siniflar || (x.sinif ? [x.sinif] : null);
    r.siniflar = sl(a) || sl(b) || [];
    r.ezber = {}; for (const n of new Set([...Object.keys(a.ezber || {}), ...Object.keys(b.ezber || {})])) {
      const x = (a.ezber || {})[n], y = (b.ezber || {})[n]; if (!x || !y) { r.ezber[n] = x || y; continue; }
      const yeni_ = (x.son || 0) >= (y.son || 0) ? x : y; r.ezber[n] = Object.assign({}, yeni_, { a: Math.max(x.a || 0, y.a || 0), tam: !!(x.tam || y.tam), eklendi: Math.min(x.eklendi || 0, y.eklendi || 0) || x.eklendi || y.eklendi, bitti: x.bitti || y.bitti });
    }
    if (a.muezzin || b.muezzin) { r.muezzin = {}; for (const id of new Set([...Object.keys(a.muezzin || {}), ...Object.keys(b.muezzin || {})])) { const x = (a.muezzin || {})[id], y = (b.muezzin || {})[id]; r.muezzin[id] = !x ? y : !y ? x : ((x.son || 0) >= (y.son || 0) ? x : y); } }
    const ha = a.hatim, hb = b.hatim; r.hatim = !ha ? hb || null : !hb ? ha : (ha.bas > hb.bas ? ha : hb.bas > ha.bas ? hb : (ha.sayfa >= hb.sayfa ? ha : hb));
    r.sonSayfa = a.sonSayfa || b.sonSayfa;
    if (a.pekistir || b.pekistir) { r.pekistir = {}; for (const d of new Set([...Object.keys(a.pekistir || {}), ...Object.keys(b.pekistir || {})])) { const x = (a.pekistir || {})[d] || { k: {} }, y = (b.pekistir || {})[d] || { k: {} }; r.pekistir[d] = (x.t || 0) >= (y.t || 0) ? { k: Object.assign({}, y.k, x.k), t: x.t } : { k: Object.assign({}, x.k, y.k), t: y.t }; } }
    r.hocaBul = ((a.hocaBul || {}).t || 0) >= ((b.hocaBul || {}).t || 0) ? a.hocaBul || b.hocaBul : b.hocaBul;
    if (a.notlar || b.notlar) { const m_ = new Map(); [...(b.notlar || []), ...(a.notlar || [])].forEach(x => { const o = m_.get(x.id); if (!o || (x.g || 0) >= (o.g || 0)) m_.set(x.id, x); }); r.notlar = [...m_.values()]; }
    if (a.kuran || b.kuran) {   // Kur'an okuma: günlük sayfalar birleşir, yer imleri birleşir, kaldığın yer en yenisi
      const ka = a.kuran || {}, kb = b.kuran || {}; r.kuran = Object.assign({}, kb, ka, { gun: {}, ay: {}, imler: [] });
      for (const d of new Set([...Object.keys(ka.gun || {}), ...Object.keys(kb.gun || {})])) r.kuran.gun[d] = benzersiz([...((ka.gun || {})[d] || []), ...((kb.gun || {})[d] || [])]);
      for (const d of new Set([...Object.keys(ka.ay || {}), ...Object.keys(kb.ay || {})])) r.kuran.ay[d] = benzersiz([...((ka.ay || {})[d] || []), ...((kb.ay || {})[d] || [])]);
      const im = new Map(); [...(kb.imler || []), ...(ka.imler || [])].forEach(x => { const o = im.get(x.n + ':' + x.a); if (!o || (x.t || 0) >= (o.t || 0)) im.set(x.n + ':' + x.a, x); }); r.kuran.imler = [...im.values()];
      r.kuran.son = ((ka.son || {}).t || 0) >= ((kb.son || {}).t || 0) ? ka.son || kb.son : kb.son;
    }
    if (a.mesk || b.mesk) { r.mesk = Object.assign({}, b.mesk || {}, a.mesk || {}); for (const k of Object.keys(r.mesk)) { const x = (a.mesk || {})[k] || {}, y = (b.mesk || {})[k] || {}; r.mesk[k] = { p: Math.max(x.p || 0, y.p || 0), tamam: !!(x.tamam || y.tamam), t: Math.max(x.t || 0, y.t || 0) }; } }
    if (a.cocuk || b.cocuk) {   // çocuk modu: durak başına en iyi yıldız, gün başına en çok yıldız
      const ca = a.cocuk || {}, cb = b.cocuk || {}; r.cocuk = Object.assign({}, cb, ca, { d: {}, gun: {} });   // seviye, renk, hata vb. korunur
      if (ca.gec || cb.gec) r.cocuk.gec = Object.assign({}, cb.gec, ca.gec); if (ca.yk || cb.yk) { r.cocuk.yk = {}; for (const k of new Set([...Object.keys(ca.yk || {}), ...Object.keys(cb.yk || {})])) r.cocuk.yk[k] = Math.max((ca.yk || {})[k] || 0, (cb.yk || {})[k] || 0); }
      for (const k of new Set([...Object.keys(ca.d || {}), ...Object.keys(cb.d || {})])) { const x = (ca.d || {})[k] || {}, y = (cb.d || {})[k] || {}; r.cocuk.d[k] = { y: Math.max(x.y || 0, y.y || 0), n: Math.max(x.n || 0, y.n || 0), t: Math.max(x.t || 0, y.t || 0) }; }
      for (const k of new Set([...Object.keys(ca.gun || {}), ...Object.keys(cb.gun || {})])) r.cocuk.gun[k] = Math.max((ca.gun || {})[k] || 0, (cb.gun || {})[k] || 0);
    }
    r.sure = {}; for (const n of new Set([...Object.keys(a.sure || {}), ...Object.keys(b.sure || {})])) { const x = (a.sure || {})[n] || {}, y = (b.sure || {})[n] || {}; r.sure[n] = { en: Math.max(x.en || 0, y.en || 0) || null, dinlendi: Math.max(x.dinlendi || 0, y.dinlendi || 0) || null }; }
    return r;
  }
  async function buluta() {
    if (!girisli() || esitleniyor) return;
    esitleniyor = true;
    try {
      const uzak = await B().indir(PR.aktif);
      if (uzak && (uzak.degisti || 0) > (S.degisti || 0) - 1) { S = birlestir(S, Object.assign(bos(), uzak)); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
      await B().yukle(S, PR.aktif); sonEsitleme = Date.now(); ozetiGonder();
    } catch (e) { /* internet yoksa sonra tekrar denenir */ }
    finally { esitleniyor = false; }
  }
  async function esitle(sessiz) {
    if (!girisli() || esitleniyor) return;
    esitleniyor = true;
    try {
      const uzak = await B().indir(PR.aktif);
      if (uzak) S = birlestir(S, Object.assign(bos(), uzak));
      try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { }
      await B().yukle(S, PR.aktif); sonEsitleme = Date.now(); temaUygula(); ozetiGonder();
      await profilleriEsitle();
      if (!sessiz) toast(t('Verilerin hesabınla eşitlendi ✓'));
    } catch (e) { if (!sessiz) toast(t('Eşitlenemedi: ') + (e.message || t('internet bağlantısı yok'))); }
    finally { esitleniyor = false; }
    if (!oturum) ciz();
  }
  // Profil listesi hesapta da tutulur; yeni telefonda giriş yapınca profiller gelir
  async function profilleriEsitle() {
    if (!girisli() || !B().profilIndir) return;
    try {
      const uzak = await B().profilIndir();
      const once = JSON.stringify(PR.liste);
      if (uzak && uzak.liste) { const r = profilBirlestir(PR, uzak); PR.liste = r.liste; PR.silinen = r.silinen; profilKaydet(); }
      await B().profilYukle({ liste: PR.liste.concat(PR.silinen || []) });
      if (JSON.stringify(PR.liste) !== once && ekranYigini.length && ['profiller', 'kimCalisiyor'].includes(ekranYigini[ekranYigini.length - 1][0])) ciz();
    } catch (e) { /* sonra tekrar */ }
  }
  function bulutBagla() {
    if (!window.Bulut || bulutBagla.tamam) return; bulutBagla.tamam = true;
    let onceki = null;
    // Bulut sonradan yüklenir: yalnız hesapla ilgili ekranları yenile (ders/oyun ortasında ekran değişmesin)
    const hesapEkrani = () => ekranYigini.length && ['hesap', 'sinif', 'profil', 'profiller', 'kimCalisiyor'].includes(ekranYigini[ekranYigini.length - 1][0]);
    if (!oturum && hesapEkrani()) ciz();
    window.Bulut.dinle(u => {
      const uid = u ? u.uid : null; if (uid === onceki) return; onceki = uid;
      try { if (u) localStorage.setItem('tecvid-ogren.bulut', '1'); else localStorage.removeItem('tecvid-ogren.bulut'); } catch (e) { }
      if (u) esitle(true); else if (!oturum && hesapEkrani()) ciz();
    });
  }
  window.addEventListener('bulut-hazir', bulutBagla);
  window.addEventListener('online', () => esitle(true));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { esitle(true); if (typeof hatirlatmaKur === 'function') hatirlatmaKur(false); } });

  const bugun = () => new Date().toISOString().slice(0, 10);
  const simdi = () => Date.now();
  const GUN = 86400000;
  function seriGuncelle() {
    const b = bugun(); S.gunler = S.gunler || {}; if (!S.gunler[b]) { S.gunler[b] = 1; const l = Object.keys(S.gunler).sort(); l.slice(0, Math.max(0, l.length - 90)).forEach(k => delete S.gunler[k]); }
    if (S.seri.son === b) return;
    const dun = new Date(simdi() - GUN).toISOString().slice(0, 10);
    S.seri.gun = S.seri.son === dun ? S.seri.gun + 1 : 1; S.seri.son = b; S.seri.en = Math.max(S.seri.en || 0, S.seri.gun);
  }

  // ------------------------------------------------------------ yardımcılar
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const karistir = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const benzersiz = a => [...new Set(a)];
  // Metindeki Arapça parçaları mushaf yazı tipiyle göster
  const metin = s => esc(s).replace(/[؀-ۿݐ-ݿࢠ-ࣿ∴]+(?:[\s ]+[؀-ۿݐ-ݿࢠ-ࣿ∴]+)*/g, m => `<span class="ar">${m}</span>`);
  function toast(m) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = m; document.body.appendChild(d); setTimeout(() => d.remove(), 2600); }
  // "Geri al" düğmeli bildirim: süre dolunca bitince() çalışır; geri alınırsa geri() çalışır.
  function geriAlToast(m, geri, bitince, sure = 10000) {
    const d = document.createElement('div'); d.className = 'toast geri-al'; d.setAttribute('role', 'status');
    d.innerHTML = `<span>${esc(m)}</span><button class="link">${t('Geri al')}</button>`; document.body.appendChild(d);
    const zm = setTimeout(() => { d.remove(); bitince(); }, sure);
    d.querySelector('button').onclick = () => { clearTimeout(zm); d.remove(); geri(); };
  }
  // Uygulama içi onay penceresi (tarayıcının confirm()'i yerine)
  function onayPenceresi(baslik, metin, evet, tehlike = true) {
    return new Promise(coz => {
      const d = document.createElement('div'); d.className = 'modal-arka';
      d.innerHTML = `<div class="modal kart" role="alertdialog" aria-modal="true"><h2>${esc(baslik)}</h2><p>${esc(metin)}</p>
        <div class="satir"><button class="btn ikincil" data-c="0">${t('Vazgeç')}</button><button class="btn ${tehlike ? 'tehlike' : ''}" data-c="1">${esc(evet)}</button></div></div>`;
      document.body.appendChild(d);
      const bitir = v => { d.remove(); coz(v); };
      d.onclick = e => { if (e.target === d) bitir(false); const c = e.target.closest('[data-c]'); if (c) bitir(c.dataset.c === '1'); };
      setTimeout(() => d.querySelector('[data-c="0"]').focus(), 30);
    });
  }
  const tarihStr = ts => new Date(ts).toLocaleString(DIL === 'en' ? 'en-GB' : 'tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const sureStr = sn => sn < 60 ? sn + t(' sn') : Math.floor(sn / 60) + t(' dk ') + (sn % 60) + t(' sn');
  const unitById = id => U.find(u => u.id === id);
  const dersler = U.filter(u => !u.ara);
  const yuzdeStr = n => DIL === 'en' ? n + '%' : '%' + n;

  // ------------------------------------------------------------ kilitler
  function gecti(id) { return !!(S.ilerleme[id] && S.ilerleme[id].gecti); }
  // Bir bölüm açıktır: ilk bölümse, bir önceki bölüm geçildiyse ya da kendisi (geçiş testiyle) geçildiyse.
  function acikMi(u) {
    const i = U.indexOf(u);
    return i === 0 || gecti(u.id) || gecti(U[i - 1].id);
  }
  const acikDersler = () => dersler.filter(acikMi);
  const ogrenilenKurallar = (ek) => benzersiz(acikDersler().concat(ek ? [ek] : []).flatMap(u => u.kurallar));

  // ------------------------------------------------------------ ses
  const pad = (n, k = 3) => String(n).padStart(k, '0');
  const ayetUrl = (r, klasor) => { const [s, a] = r.split(':').map(Number), k = klasor || kari().klasor; return k.startsWith('ar_') ? `https://webdosya.diyanet.gov.tr/kuran/kuranikerim/Sound/${k}/${s}_${a}.mp3` : `https://everyayah.com/data/${k}/${pad(s)}${pad(a)}.mp3`; };
  const kelimeUrl = (r, w) => { const [s, a] = r.split(':').map(Number); return `https://audio.qurancdn.com/wbw/${pad(s)}_${pad(a)}_${pad(w)}.mp3`; };
  let ses = null;
  // ---- çalan düğme: çalarken "⏹ Durdur" olur, tekrar dokununca ses durur (bütün dinle düğmelerinde)
  let calanDugme = null, calanDur = null;
  function dugmeCaliyor(btn, dur) {
    dugmeBirak();
    if (!btn) return;
    calanDugme = btn; calanDur = dur || null; btn.classList.add('caliyor');
    if (btn.dataset.orj == null) btn.dataset.orj = btn.innerHTML;
    // Yalnız dinleme düğmelerinin yazısı değişir; kelime gibi Arapça öğeler sadece vurgulanır
    const tx = btn.textContent || '';
    if (btn.tagName !== 'BUTTON' || btn.classList.contains('kelime') || /[\u0600-\u06FF]/.test(tx)) { delete btn.dataset.orj; return; }
    const yazili = /[A-Za-zÇĞİÖŞÜçğıöşüâîû]/.test(tx);
    btn.innerHTML = yazili ? `⏹ ${t('Durdur')}` : '⏹'; btn.setAttribute('aria-pressed', 'true');
  }
  function dugmeBirak(btn) {
    const b = btn || calanDugme; if (!b) return;
    b.classList.remove('caliyor'); b.removeAttribute('aria-pressed');
    if (b.dataset.orj != null) { b.innerHTML = b.dataset.orj; delete b.dataset.orj; }
    if (!btn || btn === calanDugme) { calanDugme = null; calanDur = null; }
  }
  // Çalan sesi durdur (düğmeyi eski hâline getirir)
  function sesDurdur() {
    const d = calanDur; if (ses) { ses.pause(); ses._iptal = true; ses = null; } dugmeBirak(); if (d) d();
  }
  // (genel kapsamda function sesDurdur zaten window.sesDurdur'dur)
  window.SesDugme = { caliyor: dugmeCaliyor, birak: dugmeBirak, calan: () => calanDugme };
  function cal(url, btn, yedekUrl, bitince) {
    // Aynı düğmeye (ya da düğmesiz aynı sese) tekrar dokunulursa durdur
    if (btn && btn === calanDugme) { sesDurdur(); return; }
    if (!btn && ses && ses._url === url && !ses._bitti) { sesDurdur(); return; }
    sesDurdur(); if (window.HarfSes && HarfSes.dur) HarfSes.dur(); if (window.Sesli) Sesli.sus();
    const a = ses = new Audio(sesKaynak(url)); a._url = url; a.playbackRate = S.ayar.hiz || 1;
    dugmeCaliyor(btn);
    const bitir = () => { if (ses === a) ses = null; if (btn) dugmeBirak(btn); };
    const hata = () => {
      if (a._iptal) return; bitir();
      if (bitince) { bitince(); return; }   // ardından gelen konuşma yine olsun; çocuğa hata gösterme
      // Seçilen kârinin kaydı bulunamazsa Husarî (öğretim) ile çal
      if (yedekUrl && yedekUrl !== url && navigator.onLine !== false) { toast(t('Bu kârinin kaydı açılamadı; Husarî ile çalınıyor.')); cal(yedekUrl, btn); return; }
      toast(t('Ses çalınamadı. İnternet bağlantını kontrol et.'));
    };
    a.onended = () => { a._bitti = true; bitir(); if (bitince) bitince(); };
    a.onerror = hata;
    a.play().catch(e => { if (a._iptal) return; if (e && e.name === 'NotAllowedError') { bitir(); return; } hata(); });
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-ses]'); if (!b) return;
    e.preventDefault(); cal(b.dataset.ses, b, b.dataset.yedek);
  });

  // ------------------------------------------------------------ internetsiz ses (telefona indirme)
  // Dosyalar uygulamanın kendi klasörüne (DATA/ses/...) iner; indirilen dosyalar varsa internet yerine onlar çalınır.
  const SES_KEY = 'tecvid-ogren.ses';
  let yerelSet = new Set(); try { yerelSet = new Set(JSON.parse(localStorage.getItem(SES_KEY) || '[]')); } catch (e) { }
  let yerelTaban = null;
  const yerelKaydet = () => { try { localStorage.setItem(SES_KEY, JSON.stringify([...yerelSet])); } catch (e) { } };
  const FS = () => window.capEklenti('Filesystem');
  const yerelYol = url => {
    let m = /everyayah\.com\/data\/([^/]+)\/(\d+\.mp3)$/.exec(url || ''); if (m) return `ea/${m[1]}/${m[2]}`;
    m = /webdosya\.diyanet\.gov\.tr\/kuran\/kuranikerim\/Sound\/([^/]+)\/(\d+)_(\d+)\.mp3$/.exec(url || ''); if (m) return `ea/${m[1]}/${pad(+m[2])}${pad(+m[3])}.mp3`;
    m = /qurancdn\.com\/wbw\/([\d_]+\.mp3)$/.exec(url || ''); if (m) return `wbw/${m[1]}`;
    return null;
  };
  const sesKaynak = url => {
    if (!yerelTaban || !url) return url;
    const y = yerelYol(url); return y && yerelSet.has(y) ? window.Capacitor.convertFileSrc(yerelTaban + '/' + y) : url;
  };
  (async () => { const fs = FS(); if (!fs) return; try { yerelTaban = (await fs.getUri({ directory: 'DATA', path: 'ses' })).uri; } catch (e) { } })();
  // Bir kârinin derslerde ve sûrelerde geçen bütün ayet sesleri + kelime sesleri
  function indirListesi(klasor, sureN) {
    const l = new Set();
    if (sureN) { const x = SURE(sureN); x.ayet.forEach((a, i) => { l.add(ayetUrl(`${sureN}:${i + 1}`, klasor)); a.split(' ').forEach((_, wi) => l.add(kelimeUrl(`${sureN}:${i + 1}`, wi + 1))); }); return [...l]; }
    Object.keys(AYAH).forEach(r => l.add(ayetUrl(r, klasor)));
    U.forEach(u => { (u.ornek || []).forEach(ex => (ex.w || []).forEach(w => l.add(kelimeUrl(ex.r, w)))); (u.dinle || []).forEach(d => l.add(kelimeUrl(d.r, d.w))); });
    (window.SURELER || []).forEach(x => x.ayet.forEach((a, i) => a.split(' ').forEach((_, wi) => l.add(kelimeUrl(`${x.n}:${i + 1}`, wi + 1)))));
    return [...l];
  }
  const indirilenSay = liste => liste.filter(u => yerelSet.has(yerelYol(u))).length;
  let indirme = null;   // { liste, bitti, hata, iptal, etiket }
  async function indirBaslat(liste, etiket) {
    const fs = FS(); if (!fs || indirme) return;
    const kalan = liste.filter(u => !yerelSet.has(yerelYol(u)));
    indirme = { toplam: liste.length, bitti: liste.length - kalan.length, hata: 0, iptal: false, etiket };
    const is = indirme; let sira = 0, ardHata = 0;
    const isci = async () => {
      while (!is.iptal && sira < kalan.length) {
        const url = kalan[sira++], yol = yerelYol(url);
        try { await fs.downloadFile({ url, path: 'ses/' + yol, directory: 'DATA', recursive: true }); yerelSet.add(yol); is.bitti++; ardHata = 0; if (is.bitti % 10 === 0) yerelKaydet(); }
        catch (e) { is.hata++; if (++ardHata >= 12) { is.iptal = true; is.agHatasi = true; } }
        indirmeGoster();
      }
    };
    indirmeGoster();
    await Promise.all([isci(), isci(), isci(), isci()]);
    yerelKaydet(); indirme = null;
    toast(is.agHatasi ? t('İndirme durdu: internet bağlantısı yok.') : is.iptal ? t('İndirme durduruldu.') : is.hata ? t('İndirme bitti ({0} dosya bulunamadı).', is.hata) : t('İndirme bitti ✓ Bu sesler artık internetsiz çalar.'));
    if (ekranYigini.length && ['indir', 'sure'].includes(ekranYigini[ekranYigini.length - 1][0]) && !oturum) ciz();
  }
  function indirmeGoster() {
    const el = document.getElementById('indirDurum'); if (!el || !indirme) return;
    const p = Math.round(indirme.bitti / indirme.toplam * 100);
    el.innerHTML = `<p>${esc(indirme.etiket || '')} ${t('{0}/{1} dosya', indirme.bitti, indirme.toplam)} (${yuzdeStr(p)})</p><div class="bar"><div class="iyi" style="width:${p}%"></div></div>`;
  }
  async function kariSesleriniSil(klasor) {
    const fs = FS(); if (!fs) return;
    try { await fs.rmdir({ path: 'ses/ea/' + klasor, directory: 'DATA', recursive: true }); } catch (e) { }
    [...yerelSet].forEach(y => { if (y.startsWith('ea/' + klasor + '/')) yerelSet.delete(y); }); yerelKaydet();
  }
  async function butunSesleriSil() {
    const fs = FS(); if (!fs) return;
    try { await fs.rmdir({ path: 'ses', directory: 'DATA', recursive: true }); } catch (e) { }
    yerelSet.clear(); yerelKaydet();
  }

  // ------------------------------------------------------------ kendi sesini kaydet ve karşılaştır
  const KAYIT = {};            // anahtar -> blob url (yalnızca bu oturumda, telefonda tutulur)
  let kayitci = null, kayitAnahtar = null, kayitZaman = null;
  function kayitHTML(anahtar, kariUrl) {
    const var_ = KAYIT[anahtar];
    if (kayitAnahtar === anahtar) return `<div class="kayit-kutu" data-kayit-kutu="${anahtar}"><button class="sesbtn kirmizi-btn kaydediyor" data-kayit-dur="${anahtar}">${t('⏹ Kaydı durdur')}</button></div>`;
    return `<div class="kayit-kutu" data-kayit-kutu="${anahtar}">
      <button class="sesbtn ikincil" data-kayit-bas="${anahtar}">${var_ ? t('🎙️ Yeniden kaydet') : t('🎙️ Kendini kaydet')}</button>
      ${var_ ? `<button class="sesbtn ikincil" data-ses="${var_}">${t('▶ Sesim')}</button>
      ${kariUrl ? `<button class="sesbtn" data-karsilastir="${anahtar}" data-kari-url="${kariUrl}">${t('🔁 Karşılaştır')}</button>` : ''}` : ''}
    </div>`;
  }
  function kayitKutuYenile(anahtar) {
    const k = document.querySelector(`[data-kayit-kutu="${anahtar}"]`); if (!k) return;
    k.outerHTML = kayitHTML(anahtar, KAYIT['_kari_' + anahtar] || '');
  }
  async function kayitBaslat(anahtar, kariUrl) {
    if (kayitci) kayitDurdur();
    if (!navigator.mediaDevices || !window.MediaRecorder) return toast(t('Bu cihazda ses kaydı desteklenmiyor.'));
    let akis;
    try { akis = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (e) { return toast(t('Mikrofon izni verilmedi. Telefon ayarlarından Kur\'an Yolum için mikrofona izin ver.')); }
    if (ses) { ses.pause(); ses = null; }
    const parcalar = [];
    kayitci = new MediaRecorder(akis); kayitAnahtar = anahtar; KAYIT['_kari_' + anahtar] = kariUrl;
    kayitci.ondataavailable = e => { if (e.data && e.data.size) parcalar.push(e.data); };
    kayitci.onstop = () => {
      akis.getTracks().forEach(tr => tr.stop());
      if (parcalar.length) { if (KAYIT[anahtar]) URL.revokeObjectURL(KAYIT[anahtar]); KAYIT[anahtar] = URL.createObjectURL(new Blob(parcalar, { type: kayitci.mimeType || 'audio/webm' })); }
      kayitci = null; kayitAnahtar = null; clearTimeout(kayitZaman);
      kayitKutuYenile(anahtar);
    };
    kayitci.start();
    kayitZaman = setTimeout(kayitDurdur, 60000);   // en fazla 1 dakika
    kayitKutuYenile(anahtar);
  }
  function kayitDurdur() { if (kayitci && kayitci.state !== 'inactive') kayitci.stop(); }
  function arkaArka(urls, btn) {
    if (btn && btn === calanDugme) { sesDurdur(); return; }
    sesDurdur(); if (window.HarfSes && HarfSes.dur) HarfSes.dur();
    let i = 0; const is = { iptal: false };
    dugmeCaliyor(btn, () => { is.iptal = true; });
    const sonraki = () => {
      if (is.iptal) return;
      if (i >= urls.length) { if (btn) dugmeBirak(btn); ses = null; return; }
      const a = ses = new Audio(sesKaynak(urls[i++])); a.playbackRate = S.ayar.hiz || 1;
      a.onended = () => setTimeout(sonraki, 600);
      a.onerror = () => { if (a._iptal || is.iptal) return; if (btn) dugmeBirak(btn); toast(t('Ses çalınamadı. İnternet bağlantını kontrol et.')); };
      a.play().catch(() => { if (!a._iptal && btn) dugmeBirak(btn); });
    };
    sonraki();
  }
  document.addEventListener('click', e => {
    const bas = e.target.closest('[data-kayit-bas]'); if (bas) { e.preventDefault(); return kayitBaslat(bas.dataset.kayitBas, bas.closest('.kart').querySelector('[data-yedek]') ? bas.closest('.kart').querySelector('[data-yedek]').dataset.ses : ''); }
    const dur = e.target.closest('[data-kayit-dur]'); if (dur) { e.preventDefault(); return kayitDurdur(); }
    const kar = e.target.closest('[data-karsilastir]'); if (kar) { e.preventDefault(); const a = kar.dataset.karsilastir; return arkaArka([kar.dataset.kariUrl, KAYIT[a]].filter(Boolean), kar); }
  });

  // ------------------------------------------------------------ ayet gösterimi (renkli tecvid)
  // ------------------------------------------------------------ Türkiye (Diyanet) mushaf yazımı
  // Medine metni (tecvid renkleri, sesler, okuma modeli bunun üzerinde) korunur; ekranda kelime kelime Diyanet yazımı gösterilir.
  // Veri: www/kuran/tr/NNN.json (tools/turk_yazim.py). Font: Diyanet'in Hamdullah hattı, Diyanet sunucusundan; yüklenemezse Scheherazade + Unicode kodlama.
  const TR_YAZI = {}, TR_HAZIR = window.TR_YAZIM_HAZIR || { a: {}, s: {} };
  Object.entries(TR_HAZIR.s || {}).forEach(([n, d]) => TR_YAZI[n] = d);
  const yazimTr = () => (S.ayar.yazim || 'tr') === 'tr';
  let TR_FONT = false;
  function trFontYukle() {
    if (!yazimTr() || TR_FONT || !document.fonts || !window.FontFace) return;
    try {
      const f = new FontFace('Hamdullah', 'url(https://webdosya.diyanet.gov.tr/kuran/kuranikerim/dosyalar/font/KuranKerimFontHamdullah.ttf)');
      f.load().then(ff => { document.fonts.add(ff); TR_FONT = true; document.documentElement.dataset.hfont = '1'; ciz(); }).catch(() => { });
    } catch (e) { }
  }
  setTimeout(trFontYukle, 0);
  async function trYukle(n) { if (TR_YAZI[n] || !yazimTr()) return; try { TR_YAZI[n] = await (await fetch(`kuran/tr/${pad(n)}.json`)).json(); } catch (e) { } }
  const trSec = p => p ? (TR_FONT ? p[0] : p[1]) : null;
  // Medine kelimesi (ayetteki başlangıç konumuyla) → Diyanet yazımındaki karşılığı
  function trParca(r, bas, kelime) {
    if (!yazimTr()) return null; const metin_ = medineAyet(r); if (!metin_ || (bas > 0 && metin_[bas - 1] !== ' ')) return null;
    const wi = bas ? metin_.slice(0, bas).split(' ').length - 1 : 0, mw = metin_.split(' ')[wi];
    if (mw !== kelime) return null;
    const [n, a] = r.split(':').map(Number);
    const p = (TR_YAZI[n] && TR_YAZI[n].a[a - 1] && TR_YAZI[n].a[a - 1][wi]) || (TR_HAZIR.a[r] && TR_HAZIR.a[r][wi]);
    return p || null;
  }
  const medineAyet = r => { if (AYAH[r]) return AYAH[r]; const [n, a] = r.split(':').map(Number), x = SURE(n); return x && x.ayet ? x.ayet[a - 1] : null; };
  const HARF = ch => /[ء-يٱی]/.test(ch);
  const harfNorm = ch => ({ 'ٱ': 'ا', 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ی': 'ي', 'ى': 'ي', 'ؤ': 'و', 'ئ': 'ي' })[ch] || ch;
  const kumeler = s => { const l = []; for (const ch of s) { if (HARF(ch) || !l.length) l.push(ch); else l[l.length - 1] += ch; } return l; };
  // Medine kelimesindeki renk sınıflarını harf eşlemesiyle Diyanet yazımına taşı
  function trRenkli(medine, bas, tr, etiket) {
    const mk = kumeler(medine), tk = kumeler(tr);
    let p = bas; const mSinif = mk.map(k => { let s = null; for (let i = 0; i < k.length && !s; i++) for (const [a, b, c] of etiket) if (p + i >= a && p + i < b) { s = c; break; } p += k.length; return s; });
    const n = mk.length, m = tk.length, D = Array.from({ length: n + 1 }, () => new Int16Array(m + 1));
    const ayni = (i, j) => harfNorm(mk[i][0]) === harfNorm(tk[j][0]);
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) D[i][j] = ayni(i, j) ? D[i + 1][j + 1] + 1 : Math.max(D[i + 1][j], D[i][j + 1]);
    const tSinif = new Array(m).fill(undefined); let i = 0, j = 0;
    while (i < n && j < m) { if (ayni(i, j)) { tSinif[j] = mSinif[i]; i++; j++; } else if (D[i + 1][j] >= D[i][j + 1]) i++; else j++; }
    for (let k = 0; k < m; k++) if (tSinif[k] === undefined) tSinif[k] = k ? tSinif[k - 1] : null;
    let html = '', akan = '', s0 = null;
    tk.forEach((k, x) => { if (tSinif[x] !== s0) { if (akan) html += s0 ? `<span class="tc-${s0}">${esc(akan)}</span>` : esc(akan); akan = ''; s0 = tSinif[x]; } akan += k; });
    if (akan) html += s0 ? `<span class="tc-${s0}">${esc(akan)}</span>` : esc(akan);
    return html;
  }
  const trBesmele = () => yazimTr() ? (trSec((TR_YAZI[2] || {}).b) || trSec(TR_HAZIR.a['1:1'] ? [TR_HAZIR.a['1:1'].map(x => x[0]).join(' '), TR_HAZIR.a['1:1'].map(x => x[1]).join(' ')] : null)) : null;
  // Ayetin düz metni (renksiz): Türk yazımı açıksa Diyanet kelimeleri
  function ayetMetni(r) {
    const metin_ = medineAyet(r) || ''; if (!yazimTr()) return metin_;
    const [n, a] = r.split(':').map(Number), d = (TR_YAZI[n] && TR_YAZI[n].a[a - 1]) || TR_HAZIR.a[r];
    return d ? d.map(trSec).filter(Boolean).join(' ') : metin_;
  }
  function kelimeHTML(r, kelime, bas) {
    const f = kelimeHTML.filtre;
    let etiket = f || (S.ayar.renkli && !kelimeHTML.renksiz) ? RENK[r] : null;
    if (etiket && f) etiket = etiket.filter(e => e[2] === f);
    const trp = trSec(trParca(r, bas, kelime));
    if (trp) return etiket && etiket.length ? trRenkli(kelime, bas, trp, etiket) : esc(trp);
    if (!etiket || !etiket.length) return esc(kelime);
    let html = '', akan = '', akanSinif = null;
    for (let i = 0; i < kelime.length; i++) {
      const p = bas + i; let sinif = null;
      for (const [s, e, k] of etiket) if (p >= s && p < e) { sinif = k; break; }
      if (sinif !== akanSinif) { if (akan) html += akanSinif ? `<span class="tc-${akanSinif}">${esc(akan)}</span>` : esc(akan); akan = ''; akanSinif = sinif; }
      akan += kelime[i];
    }
    if (akan) html += akanSinif ? `<span class="tc-${akanSinif}">${esc(akan)}</span>` : esc(akan);
    return html;
  }
  function ayetHTML(ex, kisa = true, renksiz = false) {
    const kelimeler = AYAH[ex.r].split(' ');
    const [a, b] = ex.w.length === 2 ? ex.w : [ex.w[0], ex.w[0]];
    let bas = 0, son = kelimeler.length;
    if (kisa && kelimeler.length > 12) { bas = Math.max(0, a - 1 - 4); son = Math.min(kelimeler.length, b + 4); }
    const ofs = []; let o = 0; for (const k of kelimeler) { ofs.push(o); o += k.length + 1; }
    kelimeHTML.renksiz = renksiz;
    const parca = [];
    if (bas > 0) parca.push('<span class="sil">…</span>');
    for (let i = bas; i < son; i++) {
      const isaret = i + 1 >= a && i + 1 <= b;
      parca.push(`<span class="${isaret ? 'isaret' : ''}">${durakIsik(kelimeHTML(ex.r, kelimeler[i], ofs[i]))}</span>`);
    }
    if (son < kelimeler.length) parca.push('<span class="sil">…</span>');
    kelimeHTML.renksiz = false;
    return `<div class="ayet" dir="rtl" lang="ar">${parca.join(' ')}</div>`;
  }
  const SURELER = window.SURELER || [];
  const SURE = n => SURELER.find(x => x.n === n) || KURAN[n];
  const sureAdi = x => DIL === 'en' ? x.en : x.tr;
  // ------------------------------------------------------------ bütün Kur'an (sûre dosyaları www/kuran/NNN.json, istenince yüklenir)
  const KURAN = {}; let KURAN_INDEX = null;
  const sureNoAdi = n => { const x = SURE(n) || (KURAN_INDEX || []).find(y => y.n === n); return x ? sureAdi(x) : t('{0}. sûre', n); };
  async function kuranIndex() {
    if (KURAN_INDEX) return KURAN_INDEX;
    try { KURAN_INDEX = await (await fetch('kuran/index.json')).json(); } catch (e) { KURAN_INDEX = null; }
    return KURAN_INDEX;
  }
  async function sureYukle(n) {
    if (SURE(n)) { if (yazimTr() && !TR_YAZI[n]) await trYukle(n); return SURE(n); }
    const [x] = await Promise.all([fetch(`kuran/${pad(n)}.json`).then(y => y.json()), trYukle(n)]);
    x.ayet.forEach((a, i) => { const r = `${n}:${i + 1}`; AYAH[r] = a; if (x.renk[i + 1]) RENK[r] = x.renk[i + 1]; });
    delete x.renk; KURAN[n] = x; return x;
  }
  // Tekrar listesindeki başka sûrelerin soruları için o sûreleri önceden yükle
  (async () => {
    await kuranIndex();
    const lazim = benzersiz(Object.keys(S.srs || {}).filter(k => k.startsWith('k:')).map(k => +k.split(':')[1]).filter(n => !SURE(n)));
    for (const n of lazim) { try { await sureYukle(n); } catch (e) { } }
  })();
  const trSade = s => String(s).toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ'’‘ʿʾ-]/g, '').replace(/ı/g, 'i');

  const LEJ_AD = Object.fromEntries(LEJANT);
  const LEJ_ACIKLAMA = {
    m2: t('Med harfi; sebep yoksa 1 elif, durunca ârız/lîn olarak 1–4 elif.'), mt: t('Med harfi ve hemze aynı kelimede: 2–5 elif.'), mf: t('Med harfi kelime sonunda, hemze sonraki kelimede: 1–4 elif.'),
    ml: t('Med harfinden sonra kalıcı sükûn veya şedde: en uzun med.'), g: t('Şeddeli nûn veya mîm: genizden, biraz tutularak.'), h: t('Nûn/tenvin veya mîm gizlenir, genizden hafifçe okunur.'),
    dg: t('Nûn/tenvin veya mîm sonraki harfe katılır, genizden okunur.'), db: t('Harf sonrakine katılır, geniz sesi yok.'), k: t('Nûn/tenvin ب\'den önce mîme döner.'), q: t('ق ط ب ج د sakin olunca sektirilir.')
  };
  // Ayetin tamamı; [bas, son) aralığındaki harfler işaretli
  function ayetParcaHTML(r, bas, son, renksiz) {
    const metin_ = AYAH[r] || ''; kelimeHTML.renksiz = renksiz;
    const k = metin_.split(' '); let o = 0; const parca = [];
    for (const w of k) {
      const ws = o, we = o + w.length; o = we + 1;
      if (we <= bas || ws >= son) { parca.push(kelimeHTML(r, w, ws)); continue; }
      if (yazimTr() && trParca(r, ws, w)) { parca.push(`<span class="isaret">${kelimeHTML(r, w, ws)}</span>`); continue; }
      const a = Math.max(bas, ws) - ws, b = Math.min(son, we) - ws;
      parca.push(kelimeHTML(r, w.slice(0, a), ws) + `<span class="isaret">${kelimeHTML(r, w.slice(a, b), ws + a)}</span>` + kelimeHTML(r, w.slice(b), ws + b));
    }
    kelimeHTML.renksiz = false;
    return `<div class="ayet" dir="rtl" lang="ar">${parca.join(' ')}</div>`;
  }
  function sesButonlari(ex) {
    const tek = ex.w.length === 1 || ex.w[0] === ex.w[1];
    return `<div class="sesler">
      <button class="sesbtn" data-ses="${ayetUrl(ex.r)}" data-yedek="${ayetUrl(ex.r, KARILER[0].klasor)}">${t('▶ Ayeti dinle')}</button>
      ${tek ? `<button class="sesbtn ikincil" data-ses="${kelimeUrl(ex.r, ex.w[0])}">${t('▶ Kelimeyi dinle')}</button>` : ''}
    </div>`;
  }

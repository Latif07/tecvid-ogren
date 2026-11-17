/* Hüsn-i Kıraat — uygulama motoru (çevrimdışı çalışır, veriler telefonda ve hesapta saklanır) */
(function () {
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
    const m = new Map(); [...(b.liste || []), ...(a.liste || [])].forEach(p => { const x = m.get(p.id); if (!x || (p.d || 0) >= (x.d || 0)) m.set(p.id, p); });
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
  function temaUygula() { const h = document.documentElement; h.dataset.yazim = (S.ayar.yazim || 'tr'); h.dataset.tema = S.ayar.tema || 'sistem'; h.dataset.renk = S.ayar.renk || 'yesil'; try { localStorage.setItem('tecvid-ogren.renk', S.ayar.renk || 'yesil'); } catch (e) { } requestAnimationFrame(() => { const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = getComputedStyle(h).getPropertyValue('--ust-bg').trim() || '#0f5a47'; }); h.style.fontSize = Math.round((S.ayar.yazi || 1) * 100) + '%'; h.style.setProperty('--ar-olcek', S.ayar.arYazi || 1); try { localStorage.setItem('tecvid-ogren.tema', S.ayar.tema || 'sistem'); } catch (e) { } }
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
    if (a.mesk || b.mesk) { r.mesk = Object.assign({}, b.mesk || {}, a.mesk || {}); for (const k of Object.keys(r.mesk)) { const x = (a.mesk || {})[k] || {}, y = (b.mesk || {})[k] || {}; r.mesk[k] = { p: Math.max(x.p || 0, y.p || 0), tamam: !!(x.tamam || y.tamam), t: Math.max(x.t || 0, y.t || 0) }; } }
    if (a.cocuk || b.cocuk) {   // çocuk modu: durak başına en iyi yıldız, gün başına en çok yıldız
      const ca = a.cocuk || {}, cb = b.cocuk || {}; r.cocuk = { d: {}, gun: {} };
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
  window.sesDurdur = () => sesDurdur();
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
    catch (e) { return toast(t('Mikrofon izni verilmedi. Telefon ayarlarından Hüsn-i Kıraat için mikrofona izin ver.')); }
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
      parca.push(`<span class="${isaret ? 'isaret' : ''}">${kelimeHTML(ex.r, kelimeler[i], ofs[i])}</span>`);
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
      return { anahtar, unit: u.id, tip: 'kavram', soru: metin(c.q), dogru: c.a, secenek: karistir([c.a, ...c.w]), aciklama: '' };
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
  const SEKMELER_B = [['ana', '📖', 'Tecvid'], ['sureler', '🕌', 'Kur\'an'], ['ezber', '🧠', 'Ezber'], ['testler', '📝', 'Testler'], ['profil', '👤', 'Profil']];
  const SEKMELER_C = [['cocuk', '🗺️', 'Yolculuk'], ['cocukIlerleme', '⭐', 'Yıldızlarım'], ['profil', '👨‍👩‍👧', 'Büyükler']];
  const sekmeler = () => cocukMu() ? SEKMELER_C : SEKMELER_B;
  function altMenu(ad) {
    const SEKMELER = sekmeler();
    document.body.classList.toggle('cocuk-modu', cocukMu());
    const kok = ekranYigini.length === 1 && SEKMELER.some(x => x[0] === ad) && !oturum;
    document.body.classList.toggle('sekmeli', kok);
    if (!kok) return;
    const g = app.querySelector('.ust .geri'); if (g) g.outerHTML = '<img class="logo" src="icons/icon-192.png" alt="">';
    app.insertAdjacentHTML('beforeend', `<nav class="alt-menu n${SEKMELER.length}">${SEKMELER.map(([k, ik, ad_]) => `<button class="${k === ad ? 'aktif' : ''}" data-sekme-git="${k}"><span>${ik}</span>${t(ad_)}</button>`).join('')}</nav>`);
    app.querySelectorAll('[data-sekme-git]').forEach(b => b.onclick = async () => {
      if (b.dataset.sekmeGit === ad) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
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
  function iosKurKarti() {
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const kurulu = window.navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
    let kapali = false; try { kapali = localStorage.getItem('tecvid-ogren.ios') === '1'; } catch (e) { }
    if (!ios || kurulu || kapali || (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())) return '';
    return `<section class="kart hesap-uyari" style="margin-bottom:14px"><div><h2>${t('📲 iPhone\'a uygulama gibi ekle')}</h2>
      <ol style="padding-left:20px;margin:6px 0"><li>${t('Safari\'de <b>Paylaş</b> düğmesine dokun (kare ve yukarı ok; görmüyorsan önce <b>⋯</b> düğmesine dokun).')}</li><li>${t('<b>Ana Ekrana Ekle</b>\'yi seç, sonra <b>Ekle</b>\'ye dokun.')}</li><li>${t('Artık ana ekrandaki <b>Hüsn-i Kıraat</b> simgesinden aç.')}</li></ol>
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
  EKRAN.mufredat = function () {
    app.innerHTML = `${ust(t('Müfredat'))}<main>
      <p class="soluk kucukyazi">${t('🔒 Kilitli bölümleri de açabilirsin: konuyu biliyorsan doğrudan testine gir, {0} alınca bölüm açılır.', yuzdeStr(GECME))}</p>
      ${GRUPLAR.map(([ad, idler]) => { const l = idler.map(unitById).filter(Boolean); return `<h2 class="baslik">${ad} <small class="soluk">${l.filter(u => gecti(u.id)).length}/${l.length}</small></h2><div class="bolumler">${bolumListesi(l)}</div>`; }).join('')}
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
    app.innerHTML = `${ust(t('Hüsn-i Kıraat'), false, `<button class="hesapbtn" data-git="hesap" aria-label="${t('Hesap')}">${k ? '👤' : t('Giriş')}</button>`)}
      <main>
        <p class="uygulama-alt">${t('Tecvidli Kur\'an okumayı adım adım öğren')}</p>
        <section class="hadis-kart"><p class="ar" dir="rtl" lang="ar">${HADIS_AR}</p><p>${hadisMetni()} <small>${hadisKaynak()}</small></p></section>
        ${tanitimKarti()}${haftaOzetKarti()}${gunlukKarti()}${yarimKarti()}
        <section class="kart ozet">
          <div class="halka" style="--p:${Math.round(gecilen / toplam * 100)}"><b>${gecilen}/${toplam}</b><small>${t('tamam')}</small></div>
          <div><p class="buyukyazi">${siradaki ? t('Sıradaki: ') + esc(siradaki.ad) : t('Maşallah! Bütün müfredatı bitirdin. 🎉')}</p>
          ${S.seri.gun ? `<p class="soluk">${t('🔥 {0} günlük seri', S.seri.gun)}</p>` : ''}
          ${siradaki ? `<button class="btn" data-git="${siradaki.ara ? 'sinavGiris|' + siradaki.id : 'ders|' + siradaki.id}">${t('Devam et')}</button>` : ''}</div>
        </section>
        <div id="odevYer"></div>
        ${vade ? `<section class="kart tekrar vurgulu">
          <div><h2>${t('🔁 Günlük tekrar')}</h2><p>${t('<b>{0}</b> soru tekrar zamanı geldi. Unutmamak için şimdi çöz.', vade)}</p></div>
          <button class="btn" data-git="tekrarBasla">${t('Başla')}</button></section>` : ''}
        ${gununSorusuKarti()}
        <h2 class="baslik">${t('Keşfet')}</h2>
        <div class="kesfet">
          <button data-git="sureTecvidSec"><span>🧭</span><b>${t('Sûre sûre tecvid')}</b><small>${t('Ayet ayet öğren')}</small></button>
          <button data-git="mufredat"><span>📚</span><b>${t('Müfredat')}</b><small>${t('{0}/{1} bölüm', gecilen, toplam)}</small></button>
          <button data-git="ilerleme"><span>📊</span><b>${t('İlerleme')}</b><small>${S.seri.gun ? t('🔥 {0} gün', S.seri.gun) : t('Gelişimin')}</small></button>
          <button data-git="okumaRaporu"><span>🎤</span><b>${t('Okuma raporu')}</b><small>${t('Okuyuş hataların')}</small></button>
        </div>
        ${hesapUyari ? `<section class="kart hesap-uyari" style="margin-top:14px"><div><h2>${t('☁️ İlerlemen kaybolmasın')}</h2><p>${t('Giriş yap; puanların, geçmişin ve kilitler hesabında saklansın, başka telefonda da devam et.')}</p></div>
          <div class="satir sola"><button class="btn" data-git="hesap">${t('Giriş yap / Hesap aç')}</button><button class="btn ikincil" id="uyariKapat">${t('Sonra')}</button></div></section>` : ''}
        ${iosKurKarti()}
        <p class="surum-satir"><button class="link" data-git="yenilikler">${esc(surumYazi())} · ${t('Yenilikler')} ›</button></p>
      </main>`;
    odevKartiDoldur(); yarimBagla(); gununSorusuBagla();
    const hk_ = $('#haftaKapat'); if (hk_) hk_.onclick = () => { S.ayar.haftaKartKapali = Date.now(); kaydet(); ciz(); };
    const tk = $('#tanitimKapat'); if (tk) tk.onclick = () => { S.ayar.tanitim = 1; kaydet(); ciz(); };
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
      // 2. sayfadan itibaren: konuyu pekiştiren tek bir "hızlı kontrol" sorusu (aktif hatırlama)
      const hk = i > 0 && (u.sorular || []).length ? hizliKontrolSoru(u, i) : null;
      const hkSay = hikayeKartlar(u).length;
      const hikayeGir = `<button class="ders-ince hikaye-gir" data-git="hikaye|${id}|0"><span>${u.ikon} ${t('Kısa anlatım')} · ${t('{0} kart, ~{1} dk', hkSay, Math.max(1, Math.round(hkSay / 3)))}</span><b>›</b></button>`;
      icerik = (i === 0 ? `<p class="besmele" lang="ar" dir="rtl">بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</p>` : '') + `<article class="kart sayfa"><div class="sayac">${i + 1} / ${u.sayfalar.length}</div><h2>${esc(s.t)}</h2>${s.h}</article>${mahrecHTML(id, i)}
        ${hk ? `<section class="kart hizli-kontrol"><p class="hk-baslik">${t('🧠 Hızlı kontrol')}</p><p><b>${hk.soru}</b></p><div class="secenekler">${hk.secenek.map((x, j) => `<button class="secenek" data-hk="${j}">${metin(x)}</button>`).join('')}</div><div id="hkSonuc"></div></section>` : ''}
        <div class="satir">
          <button class="btn ikincil" data-sayfa="${i - 1}" ${i === 0 ? 'disabled' : ''}>${t('‹ Önceki')}</button>
          ${i < u.sayfalar.length - 1 ? `<button class="btn" data-sayfa="${i + 1}">${t('Sonraki ›')}</button>` : `<button class="btn" data-sekme="${u.ornek && u.ornek.length ? 'ornek' : 'alistirma'}">${u.ornek && u.ornek.length ? t('Örneklere geç ›') : t('Alıştırmaya geç ›')}</button>`}
        </div>${i === 0 ? `<div class="ders-inceler">${hikayeGir}${secim}</div>` : ''}`;
    } else if (sekme === 'ornek') {
      icerik = `<div class="satir sola"><button class="lejant-ac" id="lejantAc">🎨 ${S.ayar.renkli ? t('Renklerin anlamı') : t('Renkli tecvid kapalı')}</button><button class="lejant-ac" data-git="kariSec">🎙️ ${esc(kari().ad)}</button></div>
        <div id="lejant" hidden class="kart kucuk">${lejantHTML()}</div>` +
        u.ornek.map(ex => `<article class="kart ornek">
        <div class="etiket">${esc(R[ex.k].ad)} <span class="soluk">· ${ex.r}</span></div>
        ${ayetHTML(ex, false)}
        <p class="okunus">🗣️ <b>${esc(ex.oku)}</b></p><p class="soluk">${esc(ex.n)}</p>${sesButonlari(ex)}${kayitHTML(ex.r + '#' + ex.w.join('-'), ayetUrl(ex.r))}</article>`).join('') +
        `<p class="soluk ortala">${t('Sesler için internet gerekir. Tilavet: {0}.', esc(kari().ad))}</p>
         <button class="btn genis" data-sekme="alistirma">${t('Alıştırmaya geç ›')}</button>`;
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
      <div class="sekmeler">${sekmeler.map(s => `<button class="${s[0] === sekme ? 'aktif' : ''}" data-sekme="${s[0]}">${s[1]}</button>`).join('')}</div>
      <main>${icerik}</main>`;
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
    if (sekme === 'ders' && u.sayfalar && u.sayfalar.length) mahrecBagla(id, Math.min(+(EKRAN.ders._sayfa && EKRAN.ders._sayfa[id]) || 0, u.sayfalar.length - 1));
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
        <p class="soluk">${o.tur === 'seviye' ? t('Konu {0}/{1}: {2}', o.sv.blok + 1, SV_BLOK.length, esc(SV_BLOK[o.sv.blok].ad())) : t('Soru {0} / {1}', o.i + 1, o.sorular.length) + (o.puanli ? '' : t(' · alıştırma'))}${o.ustalik ? ` · <span class="seviye-rozet sv${o.ustalik.sv[q.anahtar] || 2}">${[t('Temel'), t('Tanıma'), t('Uygulama'), t('Karışık')][(o.ustalik.sv[q.anahtar] || 2) - 1]}</span>` : ''}</p>
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
      <article class="kart"><h2>${t('🎲 Karma test')}</h2><p>${t('Bölümleri ve soru sayısını sen seç.')}</p>
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
      ok: [ok.length, ok.filter(x => !x.j && !x.k).length], zaman: Date.now() };
  }
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
      yer.innerHTML = l.filter(s => s && s.odev && s.odev.birim && unitById(s.odev.birim)).map(s => {
        const o = s.odev, u = unitById(o.birim), bitti = gecti(o.birim), gecikti = o.son && !bitti && o.son < bugun();
        return `<section class="kart tekrar ${bitti ? '' : 'vurgulu'}" style="margin-bottom:14px"><div><h2>${t('📌 Ödev')} · <span class="soluk" style="font-weight:500">${esc(s.ad || '')}</span></h2>
          <p><b>${u.ikon} ${esc(u.ad)}</b>${o.son ? ` · ${gecikti ? '<span class="kirmizi">' : ''}${t('son gün: {0}', odevSonStr(o.son))}${gecikti ? '</span>' : ''}` : ''}</p>
          ${o.not ? `<p class="soluk">“${esc(o.not)}”</p>` : ''}
          <p>${bitti ? `<span class="yesil">${t('✓ Tamamladın ({0})', yuzdeStr(S.ilerleme[o.birim].en))}</span>` : t('Bölüm testinden {0} al, ödev tamamlansın.', yuzdeStr(GECME))}</p></div>
          ${bitti ? '' : `<button class="btn" data-git="${u.ara ? 'sinavGiris|' + u.id : 'ders|' + u.id}">${t('Başla')}</button>`}</section>`;
      }).join('');
    });
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
      const dOdev = o && String(o.birim || '').startsWith('d:');
      if (dOdev) { const id = o.birim.slice(2), ok = !!(S.cocuk && S.cocuk.d && S.cocuk.d[id] && S.cocuk.d[id].y); yer.innerHTML = `<p>${t('📌 Ödev: ')}<b>${esc(odevAd(o.birim))}</b>${o.son ? ' · ' + t('son gün: {0}', odevSonStr(o.son)) : ''} ${ok ? '<span class="yesil">✓</span>' : ''}</p>${o.not ? `<p class="soluk">“${esc(o.not)}”</p>` : ''}`; return; }
      yer.innerHTML = u ? `<p>${t('📌 Ödev: ')}<b>${u.ikon} ${esc(u.ad)}</b>${o.son ? ' · ' + t('son gün: {0}', odevSonStr(o.son)) : ''} ${gecti(u.id) ? '<span class="yesil">✓</span>' : ''}</p>${o.not ? `<p class="soluk">“${esc(o.not)}”</p>` : ''}` : `<p class="soluk">${t('Şu an verilmiş bir ödev yok.')}</p>`;
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
      const o = s.odev || {}; l.sort((a, b) => String(a.ad).localeCompare(String(b.ad), 'tr'));
      const satirlar = l.map(x => { const z = x.ozet || {}; return { ad: x.ad || '?', cocuk: !!z.cocuk, bolum: `${z.gecilen || 0}/${z.toplam || U.length}`, yildiz: z.cocuk ? z.yildiz || 0 : null, durak: Object.keys(z.dk || {}).length, seri: z.seri || 0, ort: z.ort, ez: z.ezAyet || 0, odev: o.birim ? odevTamam(o.birim, z) : null, son: x.guncelleme ? new Date(x.guncelleme).toLocaleDateString(DIL === 'en' ? 'en-GB' : 'tr-TR', { day: '2-digit', month: '2-digit' }) : '—' }; });
      const cocukVar = satirlar.some(x => x.cocuk), buyukVar = satirlar.some(x => !x.cocuk);
      yer.innerHTML = `<article class="kart rapor"><h2>${esc(s.ad || '')} <small class="soluk">${esc(kod)}</small></h2>
          <p class="soluk kucukyazi">${t('Rapor tarihi: {0} · {1} öğrenci', tarihStr(Date.now()), l.length)}${o.birim ? ' · ' + t('Ödev: {0}', esc(odevAd(o.birim))) : ''}</p>
          <div class="rapor-kap"><table class="rapor-tablo"><thead><tr><th>${t('Öğrenci')}</th>${buyukVar ? `<th>${t('Bölüm')}</th><th>${t('Ort.')}</th><th>${t('Ezber')}</th>` : ''}${cocukVar ? `<th>★</th><th>${t('Durak')}</th>` : ''}<th>🔥</th>${o.birim ? `<th>${t('Ödev')}</th>` : ''}<th>${t('Son')}</th></tr></thead>
          <tbody>${satirlar.map(x => `<tr><td>${esc(x.ad)}</td>${buyukVar ? `<td>${x.cocuk ? '—' : x.bolum}</td><td>${x.cocuk || x.ort == null ? '—' : yuzdeStr(x.ort)}</td><td>${x.cocuk ? '—' : x.ez}</td>` : ''}${cocukVar ? `<td>${x.cocuk ? x.yildiz : '—'}</td><td>${x.cocuk ? x.durak : '—'}</td>` : ''}<td>${x.seri}</td>${o.birim ? `<td>${x.odev ? '✓' : '·'}</td>` : ''}<td class="kucukyazi">${esc(x.son)}</td></tr>`).join('')}</tbody></table></div></article>
        <div class="satir sola rapor-dugmeler"><button class="btn" id="raporYazdir">🖨️ ${t('Yazdır / PDF')}</button><button class="btn ikincil" id="raporPaylas">📤 ${t('Metin olarak paylaş')}</button></div>
        <p class="soluk kucukyazi">${t('Telefonda yazdırma çalışmazsa “Metin olarak paylaş” ile WhatsApp ya da e-postayla gönderebilirsin.')}</p>`;
      $('#raporYazdir').onclick = () => { try { window.print(); } catch (e) { toast(t('Bu cihazda yazdırma desteklenmiyor.')); } };
      $('#raporPaylas').onclick = async () => {
        const yazi = [`${s.ad || ''} (${kod}) — ${tarihStr(Date.now())}`, o.birim ? t('Ödev: {0}', odevAd(o.birim)) : '', ''].concat(satirlar.map(x => `• ${x.ad}: ${x.cocuk ? `★${x.yildiz}, ${t('{0} durak', x.durak)}` : `${t('{0} bölüm', x.bolum)}${x.ort != null ? ', ' + t('ort. {0}', yuzdeStr(x.ort)) : ''}`}, 🔥${x.seri}${o.birim ? ', ' + t('ödev') + ' ' + (x.odev ? '✓' : '✗') : ''}`)).filter((x, i) => x || i > 1).join('\n');
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
      const o = s.odev || {};
      ogrenciler.sort((a, b) => ((b.ozet || {}).gecilen || 0) - ((a.ozet || {}).gecilen || 0) || String(a.ad).localeCompare(String(b.ad)));
      const satir = x => {
        const z = x.ozet || {}, top = z.toplam || U.length;
        const odevDurum = o.birim ? (odevTamam(o.birim, z) ? `<span class="rozet ok">${t('✓ ödev')}</span>` : `<span class="rozet kilit">${t('ödev bekliyor')}</span>`) : '';
        const p = Math.round((z.gecilen || 0) / top * 100);
        const bolumler = U.filter(u => z.b && z.b[u.id]).map(u => `<li>${u.ikon} ${esc(u.ad)}: <b class="${z.b[u.id][1] ? 'yesil' : 'kirmizi'}">${yuzdeStr(z.b[u.id][0])}</b></li>`).join('');
        const son = (z.son || []).map(h => `<li>${esc(h.k ? baslikBul({ kimlik: h.k, baslik: h.b }) : h.b)}: <b>${yuzdeStr(h.y)}</b> <small class="soluk">${tarihStr(h.t)}</small></li>`).join('');
        return `<details class="kart kucuk ogrenci"><summary><span class="bad"><b>${esc(x.ad || '?')}</b><small>${t('{0}/{1} bölüm', z.gecilen || 0, top)} · 🔥 ${z.seri || 0} · ${t('son: {0}', x.guncelleme ? tarihStr(x.guncelleme) : '—')}</small>
          <div class="bar"><div class="${p >= 80 ? 'iyi' : p >= 40 ? 'orta' : 'kotu'}" style="width:${p}%"></div></div></span>${odevDurum}</summary>
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
        <div class="satir sola"><button class="btn ikincil" data-git="sinifRapor|${esc(kod)}">🖨️ ${t('Sınıf raporu')}</button></div>
        <h2 class="baslik">${t('🏆 Sınıf sıralaması')}</h2><article class="kart" id="sirala"></article>
        <h2 class="baslik">${t('🎧 Ezber dinletmeleri')}</h2><div id="dinletmeler"><p class="soluk">${t('Yükleniyor…')}</p></div>
        <h2 class="baslik">${t('Öğrenciler ({0})', ogrenciler.length)}</h2>
        ${ogrenciler.length ? ogrenciler.map(satir).join('') : `<p class="soluk">${t('Henüz katılan öğrenci yok. Kodu öğrencilerine ver.')}</p>`}
        <p class="soluk kucukyazi">${t('Öğrencinin ilerlemesi, onun telefonu internete bağlanıp eşitlendiğinde güncellenir.')}</p>
        <article class="kart"><h2>${t('⚠️ Sınıfı sil')}</h2><p>${t('Sınıf kapanır, kod çalışmaz. Öğrencilerin kendi ilerlemesi silinmez.')}</p><button class="btn tehlike" id="sinifSil">${t('Sınıfı sil')}</button></article>`;
      $('#paylas').onclick = async () => {
        const yazi = t('Hüsn-i Kıraat uygulamasında "{0}" sınıfına katıl: Profil → Sınıf → Öğrenciyim → kod: {1}', s.ad || '', kod);
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
          <div class="satir sola"><button class="btn" data-puan="iyi" data-id="${d.id}">👍 ${t('Güzel')}</button><button class="btn ikincil" data-puan="tekrar" data-id="${d.id}">🔁 ${t('Tekrar çalış')}</button><button class="btn ikincil tehlike-yazi" data-dsil="${d.id}">${t('Sil')}</button></div></article>`).join('');
        y.querySelectorAll('[data-puan]').forEach(b => b.onclick = async () => { try { await B().dinletmeDegerlendir(kod, b.dataset.id, b.dataset.puan, y.querySelector(`[data-not="${b.dataset.id}"]`).value); toast(t('Değerlendirme kaydedildi ✓')); ciz(); } catch (x) { toast(x.message); } });
        y.querySelectorAll('[data-dsil]').forEach(b => b.onclick = async () => { if (!confirm(t('Bu kayıt silinsin mi?'))) return; try { await B().dinletmeSil(kod, b.dataset.dsil); ciz(); } catch (x) { toast(x.message); } });
      }).catch(x => { const y = $('#dinletmeler'); if (y) y.innerHTML = `<p class="hata">${esc(x.message)}</p>`; });
      // Birden çok sınıfı olan hoca aynı ödevi hepsine verebilir (yaz kursu)
      let digerSiniflar = [];
      B().siniflarim().then(l2 => { digerSiniflar = l2.filter(x => x.kod !== kod); if (digerSiniflar.length && $('#topluSatir')) { $('#topluSatir').hidden = false; $('#topluYazi').textContent = t('Aynı ödevi diğer {0} sınıfıma da ver', digerSiniflar.length); } }).catch(() => { });
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

  const sureSatir = (x, adet) => { const ok = (S.sure || {})[x.n]; return `<button class="bolum" data-git="sure|${x.n}" data-ara="${esc(trSade(x.n + ' ' + x.tr + ' ' + x.en))}"><span class="ikon" style="font-size:.8rem;width:28px;color:var(--soluk)">${x.n}</span><span class="bad"><small>${t('{0} ayet', adet)}</small>${esc(sureAdi(x))}</span><span class="ar" style="font-size:1.35rem;line-height:1.2">${esc(x.ar)}</span>${ok && ok.en != null ? `<span class="rozet ok">✓ ${yuzdeStr(ok.en)}</span>` : ''}</button>`; };
  EKRAN.sureler = function () {
    app.innerHTML = `${ust(t('Kur\'an-ı Kerîm'))}<main>
      <p class="soluk">${t('Önce dinle, sonra oku. Kelimeye dokunursan o kelimeyi dinlersin.')}</p>
      <button class="btn genis" data-git="sureTecvidSec">${t('🧭 Sûre sûre tecvid (ayet ayet)')}</button>
      <button class="btn genis ikincil" data-git="kuralAra">${t('🔍 Bütün Kur\'an\'da kural ara')}</button>
      <h2 class="baslik">${t('Uygulama sûreleri')}</h2>
      <div class="bolumler">${SURELER.map(x => sureSatir(x, x.ayet.length)).join('')}</div>
      <h2 class="baslik">${t('Bütün sûreler')}</h2>
      <div class="form"><input id="sureAra" type="search" placeholder="${t('Sûre ara (ad ya da numara)')}"></div>
      <div class="bolumler" id="tumSureler" style="margin-top:10px"><p class="soluk">${t('Yükleniyor…')}</p></div>
    </main>`;
    kuranIndex().then(l => {
      const yer = $('#tumSureler'); if (!yer) return;
      if (!l) { yer.innerHTML = `<p class="hata">${t('Sûre listesi açılamadı.')}</p>`; return; }
      yer.innerHTML = l.map(x => sureSatir(x, x.a)).join('');
      $('#sureAra').oninput = e => { const q = trSade(e.target.value.trim()); yer.querySelectorAll('[data-ara]').forEach(b => { b.hidden = q && !b.dataset.ara.includes(q); }); };
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
      yeniG ? [t('Yeni'), yeniAd(yeniG)] : null,
      yakinlar.length ? [t('Yakın tekrar'), yakinlar.map(g => esc(sureNoAdi(g.n))).join(', ')] : null,
      uzaklar.length ? [t('Uzak tekrar'), uzaklar.map(g => esc(sureNoAdi(g.n))).join(', ')] : null,
    ].filter(Boolean);
    const dk = (yeniG ? 8 : 0) + (yakinlar.length + uzaklar.length) * 3;
    const liste = Object.entries(S.ezber || {}).map(([n, e]) => Object.assign({ n: +n }, e)).sort((a, b) => (a.tam - b.tam) || (b.eklendi - a.eklendi));
    const halka = e => { const top = ayetSayisi(e.n) || 1, p = e.tam ? 1 : Math.min(1, (e.a || 0) / top), C = 119.4;
      return `<svg class="ez-halka" viewBox="0 0 46 46" aria-hidden="true"><circle cx="23" cy="23" r="19"></circle><circle class="dolu ${e.tam ? 'tam' : ''}" cx="23" cy="23" r="19" stroke-dasharray="${(p * C).toFixed(1)} ${C}" transform="rotate(-90 23 23)"></circle></svg>`; };
    const durum = e => { const top = ayetSayisi(e.n); if (e.zayif && e.zayif.length) return t('{0} zayıf ayet', e.zayif.length); if (e.tam) return (e.vade || 0) <= simdi() ? t('Tekrar zamanı') : t('Ezberde'); return top ? t('{0}/{1} ayet', e.a || 0, top) : t('{0} ayet', e.a || 0); };
    app.innerHTML = `${ust(t('Ezber'))}<main>
      <section class="kart ez-bugun"><p class="ez-etiket">${t('Bugün')}</p>
        ${satirlar.length ? `<ol class="ez-gorevler">${satirlar.map(([ad, ne]) => `<li><b>${ad}:</b> ${ne}</li>`).join('')}</ol>
          <button class="btn genis ez-basla" id="ezBasla">${t('Başla · yaklaşık {0} dk', dk)}</button>
          <p class="kucukyazi ez-bugun-not">${t('Sırayla gider; biri bitince sıradakine geçersin.')}</p>`
        : `<p>${t('Bugün için ezber planı yok. Aşağıdan bir sûre ekle.')}</p>`}
        <p class="kucukyazi ez-hedef">${t('Günlük yeni ders:')} ${[1, 3, 5, 10].map(k => `<button class="cip ${hedef === k ? 'aktif' : ''}" data-hedef="${k}">${t('{0} ayet', k)}</button>`).join(' ')}</p>
      </section>
      <h2 class="baslik">${t('Ezberlerim')}</h2>
      ${liste.length ? `<div class="ez-izgara">${liste.map(e => `<button class="ez-sure" data-ez-sure="${e.n}">${halka(e)}<b>${esc(sureNoAdi(e.n))}</b><small>${durum(e)}</small></button>`).join('')}</div>` : `<p class="soluk">${t('Henüz ezber listen boş.')}</p>`}
      <button class="btn genis ikincil ez-ekle" data-git="ezberEkle">${t('➕ Sûre ekle')}</button>
      <h2 class="baslik">${t('Diğer')}</h2>
      <div class="ez-diger kart">
        <button id="yoklama"><span>${t('Ezber yoklaması')}</span><small>${due ? t('{0} soru bekliyor', due) : ''} ›</small></button>
        <button data-git="muezzin"><span>${t('Müezzinlik')}</span><small>${(() => { const l = MZ().M; return l.filter(x => mzDurum(x.id).tam).length + '/' + l.length; })()} ›</small></button>
        <button data-git="hatim"><span>${t('Sayfa ve hatim')}</span><small>${hd ? (hd.bitti ? t('Hatim bitti') : t('{0}/604 sayfa', hd.h.sayfa)) : ''} ›</small></button>
        <button data-git="okumaRaporu"><span>${t('Okuma raporu')}</span><small>${(S.okuma || []).length ? t('{0} ayet', (S.okuma || []).length) : ''} ›</small></button>
      </div>
    </main>`;
    const eb = $('#ezBasla'); if (eb) eb.onclick = () => { const l = gorevler.slice(); if (l[0].oneri) ezberEkle(l[0].n); ezZincir = l.slice(1); ezAc(l[0].n, l[0].mod); };
    app.querySelectorAll('[data-ez-sure]').forEach(b => b.onclick = () => { ezZincir = []; const e = ezb(+b.dataset.ezSure); ezAc(+b.dataset.ezSure, e && e.tam ? 'tekrar' : 'yeni'); });
    $('#yoklama').onclick = ezberYoklamaBaslat;
    app.querySelectorAll('[data-hedef]').forEach(b => b.onclick = () => { S.ayar.ezberHedef = +b.dataset.hedef; kaydet(); ciz(); });
    // Yeni dersin ayet aralığı sûre verisiyle hesaplanır: yüklü değilse yükle ve yenile
    if (yeniG && !SURE(yeniG.n)) sureYukle(yeniG.n).then(() => { if (ekranYigini[ekranYigini.length - 1][0] === 'ezber') ciz(); }).catch(() => { });
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
        <button class="bolum" data-git="sayfa|${S.sonSayfa || 1}"><span class="ikon">📄</span><span class="bad"><small>${t('Mushaf, 604 sayfa · {0}. sayfadan devam', S.sonSayfa || 1)}</small>${t('Sayfa sayfa oku')}</span><span class="rozet">›</span></button>
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
      yer.innerHTML = l.slice().reverse().map(x => `<button class="bolum" data-ekle="${x.n}" data-ara="${esc(trSade(x.n + ' ' + x.tr + ' ' + x.en))}"><span class="ikon" style="font-size:.8rem;width:28px;color:var(--soluk)">${x.n}</span><span class="bad"><small>${t('{0} ayet', x.a)}</small>${esc(sureAdi(x))}</span>${ezb(x.n) ? `<span class="rozet ok">${t('listede')}</span>` : '<span class="rozet">➕</span>'}</button>`).join('');
      yer.querySelectorAll('[data-ekle]').forEach(b => b.onclick = () => { const n = +b.dataset.ekle; ezberEkle(n); ekranYigini.pop(); ezZincir = []; ezAc(n, 'yeni'); });
      $('#sureAra').oninput = e => { const q = trSade(e.target.value.trim()); yer.querySelectorAll('[data-ara]').forEach(b => { b.hidden = q && !b.dataset.ara.includes(q); }); };
    });
  };

  // ------------------------------------------------------------ Müezzinlik: ezan, kamet, selâ, namaz sonrası tesbihat
  // S.muezzin[id] = { tam, ilk, son, kutu, vade }
  const MZ = () => window.MUEZZIN || { M: [], AKIS: [], KAYNAKLAR: [] };
  const mzBul = id => MZ().M.find(x => x.id === id);
  const MZ_ARALIK = [1, 3, 7, 15, 30];
  const mzDurum = id => (S.muezzin || {})[id] || {};
  const mzVadeli = d => !!(d && d.tam && simdi() >= (d.vade || 0));
  function mzIsaretle(id) {
    S.muezzin = S.muezzin || {}; const d = S.muezzin[id] || {};
    const k = d.tam ? Math.min((d.kutu || 0) + 1, MZ_ARALIK.length - 1) : 0;
    S.muezzin[id] = { tam: true, ilk: d.ilk || simdi(), son: simdi(), kutu: k, vade: simdi() + MZ_ARALIK[k] * GUN }; kaydet();
  }
  // Metnin satırları; Kur'an parçaları uygulamanın Kur'an verisinden (yüklenmemişse null)
  function mzSatirlar(x) {
    if (x.satir) return x.satir;
    if (x.kuran.some(([s]) => !SURE(s) || (yazimTr() && !TR_YAZI[s]))) return null;
    const OKU = ((window.OKUNUS || {}).tr) || {};
    return x.kuran.map(([s, a]) => { const r = `${s}:${a}`, m = MEAL['tr' + s];
      return { ar: ayetMetni(r), ok: OKU[r] || '', tr: m ? m[a - 1] : '', n: 1, ses: ayetUrl(r), yedek: ayetUrl(r, KARILER[0].klasor), r }; });
  }
  function mzYukle(x, ekran) {
    const l = [...new Set((x.kuran || []).map(([s]) => s))];
    Promise.all(l.map(s => sureYukle(s).then(() => DIL === 'en' ? null : mealYukle(s).catch(() => null)))).then(() => { const ek = ekranYigini[ekranYigini.length - 1]; if (ek[0] === ekran) ciz(); })
      .catch(() => { const m = app.querySelector('main'); if (m) m.innerHTML = `<p class="hata">${t('Metin açılamadı. İnternet bağlantını kontrol et.')}</p>`; });
  }
  // seviye: 0 hiçbiri, 1 yarısı, 2 ilk kelime kalsın, 3 hepsi
  function mzSatirHTML(s, i, sev) {
    const gizli = wi => sev === 3 || (sev === 2 && wi > 0) || (sev === 1 && wi % 2 === 1);
    const kel = s.ar.split(' ').map((w, wi) => `<span class="kelime${gizli(wi) ? ' gizli' : ''}">${esc(w)}</span>`).join(' ');
    return `<article class="kart mz-kart" id="mz-${i}">
      ${s.not ? `<p class="mz-not">ℹ️ ${esc(s.not)}</p>` : ''}
      <div class="ayet" dir="rtl" lang="ar">${kel}</div>
      ${s.ok ? `<p class="okunus${sev ? ' mz-ok-gizli' : ''}" ${sev ? `role="button" tabindex="0" aria-label="${t('Okunuşu göster')}"` : ''}>${esc(s.ok)}</p>` : ''}
      ${s.tr && !sev ? `<p class="meal">${esc(s.tr)}</p>` : ''}
      <div class="sesler">${s.n > 1 ? `<span class="rozet">${t('{0} kez söylenir', s.n)}</span>` : ''}${s.ses ? `<button class="sesbtn" data-ses="${s.ses}" data-yedek="${s.yedek}">${t('▶ Dinle')}</button>` : ''}</div>
    </article>`;
  }
  function mzGizliBagla() {
    app.querySelectorAll('.mz-kart .kelime.gizli').forEach(k => k.onclick = ev => { ev.stopPropagation(); k.classList.remove('gizli'); });
    app.querySelectorAll('.mz-ok-gizli').forEach(p => { const ac = () => p.classList.remove('mz-ok-gizli'); p.onclick = ac; p.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ac(); } }; });
  }
  EKRAN.muezzin = function () {
    const l = MZ().M, tamam = l.filter(x => mzDurum(x.id).tam).length;
    const sonraki = l.find(x => !mzDurum(x.id).tam), vadeli = l.filter(x => mzVadeli(mzDurum(x.id)));
    app.innerHTML = `${ust(t('🕌 Müezzinlik'))}<main>
      <section class="kart">
        <p>${t('Ezan, kamet, selâ ve namaz sonrası tesbihatı sırayla ezberle. Sıra bir öneridir; istediğin metne geçebilirsin.')}</p>
        <div class="bar"><div class="iyi" style="width:${l.length ? Math.round(tamam / l.length * 100) : 0}%"></div></div>
        <p class="soluk kucukyazi">${t('{0}/{1} metin ezberlendi', tamam, l.length)}</p>
        ${vadeli.length ? `<p class="kucukyazi">🔁 <b>${t('Tekrar zamanı:')}</b> ${vadeli.map(x => esc(x.ad)).join(', ')}</p>` : ''}
        <div class="satir sola">${vadeli.length ? `<button class="btn" data-git="muezzinMetin|${vadeli[0].id}">${t('Tekrar et')}</button>` : sonraki ? `<button class="btn" data-git="muezzinMetin|${sonraki.id}">${t('Sıradaki: {0}', esc(sonraki.ad))}</button>` : ''}
          <button class="btn ikincil" data-git="muezzinProva|0">🎭 ${t('Namaz sonrası provası')}</button></div>
      </section>
      <div class="bolumler">${l.map((x, i) => { const d = mzDurum(x.id);
        const durum = d.tam ? (mzVadeli(d) ? t('🔁 Tekrar zamanı') : t('✓ Ezberlendi')) : x.onay || !TEST_SURUM ? '' : t('Hoca onayı bekliyor');
        return `<button class="bolum" data-git="muezzinMetin|${x.id}"><span class="ikon">${d.tam ? '✅' : x.ikon}</span><span class="bad"><small>${[`${i + 1}.${x.alt ? ' ' + esc(x.alt) : ''}`, durum].filter(Boolean).join(' · ')}</small>${esc(x.ad)}</span><span class="rozet">›</span></button>`; }).join('')}</div>
      <p class="soluk kucukyazi" style="margin-top:12px">${t('Ezan, kamet ve selâ makamla okunur; makamı ve doğru okuyuşu bir hocadan öğren. Buradaki metinler sözleri ezberlemen içindir.')}</p>
      <details class="kural-ara"><summary>${t('Kaynaklar')}</summary><ul class="kucukyazi">${MZ().KAYNAKLAR.map(([ad, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${esc(ad)}</a></li>`).join('')}</ul>
        ${TEST_SURUM ? `<p class="soluk kucukyazi">${t('Okunuşlar ve anlamlar bu uygulama için yazıldı. "Hoca onayı bekliyor" yazan metinler bir hoca tarafından kontrol edildikten sonra onaylanacak.')}</p>` : ''}</details>
    </main>`;
  };
  EKRAN.muezzinMetin = function (id) {
    const x = mzBul(id); if (!x) { ekranYigini.pop(); return ciz(); }
    const satirlar = mzSatirlar(x);
    if (!satirlar) { app.innerHTML = `${ust(esc(x.ad))}<main><p class="soluk">${t('Yükleniyor…')}</p></main>`; mzYukle(x, 'muezzinMetin'); return; }
    if (x.kuran && DIL !== 'en' && !MEAL['tr' + x.kuran[0][0]]) mzYukle(x, 'muezzinMetin');
    const sev = S.ayar.mzGizle || 0, d = mzDurum(x.id), l = MZ().M, i = l.indexOf(x), sonraki = l[i + 1];
    const sesler = satirlar.filter(s => s.ses).map(s => s.ses);
    app.innerHTML = `${ust(esc(x.ad))}<main>
      <section class="kart ezber-ust">
        <p class="soluk kucukyazi">${i + 1}/${l.length}${x.alt ? ' · ' + esc(x.alt) : ''} ${x.onay || !TEST_SURUM ? '' : `· <span class="rozet uyari">${t('Hoca onayı bekliyor')}</span>`}</p>
        ${x.not ? `<p class="mz-not">ℹ️ ${esc(x.not)}</p>` : ''}
        <p class="kucukyazi" style="margin:8px 0 4px"><b>${t('Gizle:')}</b></p>
        <div class="filtre">${[[0, t('Hiçbiri')], [1, t('Yarısı')], [2, t('İlk kelime kalsın')], [3, t('Hepsi')]].map(([v, ad]) => `<button class="${sev === v ? 'aktif' : ''}" data-mzgizle="${v}">${ad}</button>`).join('')}</div>
        <p class="soluk kucukyazi">${t('Önce oku ve anlamına bak, sonra gizleyip ezberden söyle. Takıldığın kelimeye dokun.')}</p>
        <div class="satir sola">${sesler.length ? `<button class="btn" id="mzHepsi">${t('▶ Tamamını dinle')}</button>` : `<span class="soluk kucukyazi">🎙️ ${t('Bu metnin müezzin kaydı henüz yok. Doğru okuyuşu hocandan dinle.')}</span>`}</div>
        ${kayitHTML('mz-' + x.id, sesler[0] || '')}${sesler[0] ? `<span hidden data-yedek data-ses="${sesler[0]}"></span>` : ''}
      </section>
      ${satirlar.map((s, j) => mzSatirHTML(s, j, sev)).join('')}
      <section class="kart">
        <div class="satir sola"><button class="btn" id="mzEzber">${d.tam ? t('✓ Tekrar ettim') : t('✓ Ezberledim')}</button>
          ${sonraki ? `<button class="btn ikincil" data-git="muezzinMetin|${sonraki.id}">${t('Sonraki: {0}', esc(sonraki.ad))} ›</button>` : ''}</div>
        ${d.tam ? `<p class="soluk kucukyazi">${t('Ezberlendi. Sonraki tekrar: {0}', new Date(d.vade).toLocaleDateString(DIL === 'en' ? 'en-GB' : 'tr-TR'))}</p>` : ''}
        <p class="soluk kucukyazi">📚 ${esc(x.kaynak || '')}</p>
      </section>
    </main>`;
    mzGizliBagla();
    app.querySelectorAll('[data-mzgizle]').forEach(b => b.onclick = () => { S.ayar.mzGizle = +b.dataset.mzgizle; kaydet(); ciz(); });
    const h = $('#mzHepsi'); if (h) h.onclick = () => arkaArka(sesler, h);
    $('#mzEzber').onclick = () => { mzIsaretle(x.id); toast(d.tam ? t('Tekrar kaydedildi ✓') : t('Maşallah! "{0}" ezberlendi 🎉', x.ad)); if (!d.tam && sonraki) { ekranYigini[ekranYigini.length - 1] = ['muezzinMetin', [sonraki.id]]; } ciz(); };
  };
  // Namaz sonrası akışı: müezzinin farzdan sonra söyledikleri sırayla, ezberden
  EKRAN.muezzinProva = function (adim) {
    adim = +adim || 0; const A = MZ().AKIS, x = mzBul(A[adim]); if (!x) { ekranYigini.pop(); return ciz(); }
    const satirlar = mzSatirlar(x);
    if (!satirlar) { app.innerHTML = `${ust(t('🎭 Namaz sonrası provası'))}<main><p class="soluk">${t('Yükleniyor…')}</p></main>`; mzYukle(x, 'muezzinProva'); return; }
    const git_ = k => { ekranYigini[ekranYigini.length - 1] = ['muezzinProva', [k]]; sesDurdur(); ciz(); };
    app.innerHTML = `${ust(t('🎭 Namaz sonrası provası'))}<main>
      <div class="mz-adimlar">${A.map((k, j) => `<span class="${j < adim ? 'ok' : j === adim ? 'bugun' : ''}" title="${esc(mzBul(k).ad)}">${j + 1}</span>`).join('')}</div>
      <section class="kart">
        <h2>${adim + 1}. ${esc(x.ad)}</h2>
        ${x.not ? `<p class="mz-not">ℹ️ ${esc(x.not)}</p>` : ''}
        ${x.id === 'ayetelKursi' ? `<p class="mz-not">ℹ️ ${t('Cemaat sessizce okur; müezzin sesli de okuyabilir.')}</p>` : ''}
        <p class="soluk kucukyazi">${t('Ezberden söyle. Takılırsan kelimeye dokun ya da hepsini göster.')}</p>
        <button class="lejant-ac" id="mzGoster">👁️ ${t('Hepsini göster')}</button>
      </section>
      ${satirlar.map((s, j) => mzSatirHTML(s, j, 3)).join('')}
      <div class="satir" style="justify-content:space-between;margin-top:12px">
        ${adim > 0 ? `<button class="btn ikincil" id="mzOnceki">‹ ${t('Önceki')}</button>` : '<span></span>'}
        ${adim < A.length - 1 ? `<button class="btn" id="mzSonraki">${t('Sonraki')} ›</button>` : `<button class="btn" id="mzBitti">${t('Prova bitti ✓')}</button>`}
      </div>
    </main>`;
    mzGizliBagla();
    $('#mzGoster').onclick = () => { app.querySelectorAll('.mz-kart .kelime.gizli').forEach(k => k.classList.remove('gizli')); app.querySelectorAll('.mz-ok-gizli').forEach(p => p.classList.remove('mz-ok-gizli')); };
    const o = $('#mzOnceki'); if (o) o.onclick = () => git_(adim - 1);
    const s = $('#mzSonraki'); if (s) s.onclick = () => git_(adim + 1);
    const b = $('#mzBitti'); if (b) b.onclick = () => { toast(t('Allah kabul etsin! Prova tamamlandı 🤲')); geri(); };
  };

  // ---- hocaya ezber dinletme (Firestore'da sınıfın altında, en fazla ~2 dakika)
  const DINLET = { kayitci: null, blob: null, url: null, bas: 0, zaman: null };
  function dinletHTML() {
    if (DINLET.kayitci) return `<button class="sesbtn kirmizi-btn kaydediyor" id="dinletDur">${t('⏹ Kaydı bitir')}</button> <span class="soluk kucukyazi">${t('En fazla 2 dakika')}</span>`;
    if (DINLET.url) return `<p class="kucukyazi"><b>${t('Kaydın hazır:')}</b></p><audio controls src="${DINLET.url}" style="width:100%"></audio>
      ${ogrSiniflari().length > 1 ? `<label class="kucukyazi">${t('Hangi sınıfa?')} <select id="dinletSinif">${ogrSiniflari().map(c => `<option value="${esc(c.kod)}">${esc(c.sinifAd || c.kod)}</option>`).join('')}</select></label>` : ''}
      <div class="satir sola"><button class="btn" id="dinletGonder">${t('📤 Hocama gönder')}</button><button class="btn ikincil" id="dinletSil">${t('Sil')}</button></div>`;
    return `<button class="lejant-ac" id="dinletBas">🎙️ ${t('Hocama ezber dinlet')}</button> <span class="soluk kucukyazi">${t('Ezberden oku, kaydını hocan dinlesin.')}</span>`;
  }
  function dinletBagla(n, son) {
    const kutu = $('#dinletKutu'); if (!kutu) return;
    const yenile = () => { kutu.innerHTML = dinletHTML(); dinletBagla(n, son); };
    const b = $('#dinletBas'); if (b) b.onclick = async () => {
      if (!navigator.mediaDevices || !window.MediaRecorder) return toast(t('Bu cihazda ses kaydı desteklenmiyor.'));
      let akis; try { akis = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { return toast(t('Mikrofon izni verilmedi. Telefon ayarlarından Hüsn-i Kıraat için mikrofona izin ver.')); }
      const parca = []; let r; try { r = new MediaRecorder(akis, { audioBitsPerSecond: 24000 }); } catch (e) { r = new MediaRecorder(akis); }
      DINLET.kayitci = r; DINLET.bas = Date.now();
      r.ondataavailable = e => { if (e.data && e.data.size) parca.push(e.data); };
      r.onstop = () => { akis.getTracks().forEach(x => x.stop()); clearTimeout(DINLET.zaman); DINLET.kayitci = null; DINLET.blob = new Blob(parca, { type: r.mimeType || 'audio/webm' }); if (DINLET.url) URL.revokeObjectURL(DINLET.url); DINLET.url = URL.createObjectURL(DINLET.blob); DINLET.sure = Math.round((Date.now() - DINLET.bas) / 1000); yenile(); };
      r.start(); DINLET.zaman = setTimeout(() => r.state !== 'inactive' && r.stop(), 120000); yenile();
    };
    const d = $('#dinletDur'); if (d) d.onclick = () => DINLET.kayitci && DINLET.kayitci.state !== 'inactive' && DINLET.kayitci.stop();
    const sl = $('#dinletSil'); if (sl) sl.onclick = () => { if (DINLET.url) URL.revokeObjectURL(DINLET.url); DINLET.url = null; DINLET.blob = null; yenile(); };
    const g = $('#dinletGonder'); if (g) g.onclick = async () => {
      // Çocuk profilinde ses kaydı ancak ebeveyn onayıyla gönderilir (bir kez sorulur)
      if (cocukMu() && !S.ayar.dinletmeOnay) {
        if (!(await window.ebeveynKilidi())) return;
        if (!confirm(t('Çocuğunuzun ses kaydı sınıfın hocasına gönderilecek ve yalnızca hocası dinleyebilecek. Onaylıyor musunuz?'))) return;
        S.ayar.dinletmeOnay = simdi(); kaydet();
      }
      g.disabled = true; g.textContent = t('Gönderiliyor…');
      const veri = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1] || ''); fr.readAsDataURL(DINLET.blob); });
      if (veri.length > 880000) { toast(t('Kayıt çok uzun. Daha kısa bir bölüm oku (yaklaşık 2 dakikadan az).')); g.disabled = false; g.textContent = t('📤 Hocama gönder'); return; }
      const sec_ = $('#dinletSinif'); const c = ogrSiniflari().find(x => x.kod === (sec_ ? sec_.value : '')) || ogrSiniflari()[0];
      try { await B().dinletGonder(c.kod, { ad: c.ad, n, a1: 1, a2: son, ses: veri, mime: DINLET.blob.type || 'audio/webm', sure: DINLET.sure || 0 }); toast(t('Kaydın hocana gönderildi ✓')); if (DINLET.url) URL.revokeObjectURL(DINLET.url); DINLET.url = null; DINLET.blob = null; yenile(); }
      catch (x) { toast(x.message); g.disabled = false; g.textContent = t('📤 Hocama gönder'); }
    };
  }
  const dinletDurum = d => d.puan === 'iyi' ? `<span class="rozet ok">👍 ${t('Güzel')}</span>` : d.puan === 'tekrar' ? `<span class="rozet kilit" style="background:var(--altin-acik)">🔁 ${t('Tekrar çalış')}</span>` : `<span class="rozet kilit">${t('Dinlenmedi')}</span>`;

  // ============================================================ OKUMA RAPORU (yapay zekâ ile tecvid kontrolü)
  // S.okuma = [{ t, n, a, w (kelime), j (açık hata), k (ince hata), notlar: [[kelime, kural, şiddet, mesaj]] }]
  let okumaYukleniyor = null;
  function okumaHazirla() {
    if (window.Okuma) return Promise.resolve(window.Okuma);
    if (!okumaYukleniyor) okumaYukleniyor = new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'js/okuma.js'; s.onload = () => ok(window.Okuma); s.onerror = () => no(new Error(t('Okuma raporu yüklenemedi.'))); document.head.appendChild(s); });
    return okumaYukleniyor;
  }
  const KURAL_AD = () => ({
    NormalMaddRule: t('Med-i tabîî'), MonfaselMaddRule: t('Med-i munfasıl'), MottaselMaddRule: t('Med-i muttasıl'), MottaselMaddPauseRule: t('Med-i muttasıl'),
    LazemMaddRule: t('Med-i lâzım'), AaredMaddRule: t('Med-i ârız'), LeenMaddRule: t('Med-i lîn'), BadalMadd: t('Med-i bedel'), LeenHamzaMadd: t('Med-i lîn'),
    qalqalah: t('Kalkale'), ikhfa: t('İhfâ'), iqlab: t('İklâb'), ghunnah: t('Ğunne'), idgham_ghunnah: t('İdğâm (ğunneli)'), idgham: t('İdğâm'),
    shadda: t('Şedde'), letter: t('Harf hatası'), vowel: t('Hareke hatası'), dropped: t('Düşen ses'), added: t('Fazladan ses'), word: t('Okunmayan kelime'), madd_added: t('Yersiz uzatma')
  });
  // Okuma raporundaki hata türü → çalışılacak bölüm
  const KURAL_BOLUM = { NormalMaddRule: 'u1', madd_added: 'u1', MonfaselMaddRule: 'u3', MottaselMaddRule: 'u2', MottaselMaddPauseRule: 'u2', LazemMaddRule: 'u4', AaredMaddRule: 'u5', LeenMaddRule: 'u5', LeenHamzaMadd: 'u5',
    qalqalah: 'u15', ikhfa: 'u11', iqlab: 'u10', ghunnah: 'u13', idgham_ghunnah: 'u8', idgham: 'u9', shadda: 'u0', vowel: 'u0', letter: 'm3', dropped: 'l1', added: 'l1', word: 'l1' };
  const kuralAdi = r => { const m = KURAL_AD(); const k = r.replace(':uneven', ''); return (m[k] || k) + (r.endsWith(':uneven') ? ' ' + t('(eşit değil)') : ''); };
  const OKU_KAYIT = { r: null, n: 0, a: 0, zaman: null };
  function raporHTML(n, a, sonuc) {
    const x = SURE(n), kel = x.ayet[a - 1].split(' '), K = sonuc.kelimeler, eslesir = kel.length === K.length;
    const j = K.reduce((s, w) => s + w.notes.filter(z => z.severity === 'jali').length, 0), k = K.reduce((s, w) => s + w.notes.filter(z => z.severity !== 'jali').length, 0);
    const renk = w => !w.notes.length ? 'r-iyi' : w.notes.some(z => z.severity === 'jali') ? 'r-kotu' : 'r-orta';
    const kelimeler = eslesir ? `<div class="ayet rapor-ayet" dir="rtl" lang="ar">${kel.map((w, i) => `<span class="${renk(K[i])}">${esc(w)}</span>`).join(' ')}</div>` : '';
    const notlar = K.filter(w => w.notes.length).map(w => `<li><b class="ar">${eslesir ? esc(kel[w.index]) : t('{0}. kelime', w.index + 1)}</b>${eslesir ? ` <button class="sesbtn ikincil mini" data-ses="${kelimeUrl(n + ':' + a, w.index + 1)}" aria-label="${t('Doğrusunu dinle')}">🔊</button>` : ''} ${w.notes.map(z => `<span class="${z.severity === 'jali' ? 'kirmizi' : 'turuncu'}">${z.severity === 'jali' ? '' : t('kontrol et: ')}${metin(z.msg)}</span>`).join('; ')}</li>`).join('');
    const medler = K.flatMap(w => w.madd.map(m => `${eslesir ? esc(kel[w.index]) : w.index + 1}: ${esc(kuralAdi(m.rule))} ${DIL === 'en' ? m.heard + ' counts' : m.heard / 2 + ' elif'}`));
    return `<div class="rapor ${j ? 'kotu' : k ? 'orta' : 'iyi'}">
      <p><b>${j ? t('🔴 {0} açık hata', j) : k ? t('🟠 {0} yerde kontrol etmen önerilir', k) : t('🟢 Hata bulunmadı. Maşallah!')}</b>${j && k ? ' · ' + t('{0} yerde kontrol et', k) : ''}</p>
      ${j || k ? `<div class="satir sola"><button class="sesbtn" data-ses="${ayetUrl(n + ':' + a)}">${t('▶ Ayetin doğrusunu dinle')}</button></div>` : ''}
      ${kelimeler}${notlar ? `<ul class="rapor-not">${notlar}</ul>` : ''}
      ${(() => { const b = benzersiz(K.flatMap(w => w.notes.map(z => KURAL_BOLUM[z.rule.replace(':uneven', '')])).filter(id => id && unitById(id))); return b.length ? `<p class="kucukyazi"><b>${t('📚 Çalışman önerilen:')}</b></p><div class="satir sola">${b.map(id => `<button class="sesbtn ikincil" data-git="ders|${id}">${unitById(id).ikon} ${esc(unitById(id).ad)}</button>`).join('')}</div>` : ''; })()}
      ${medler.length ? `<p class="soluk kucukyazi">${t('Duyulan medler:')} <span class="ar-karisik">${medler.join(' · ')}</span></p>` : ''}
      <p class="soluk kucukyazi">${t('🔴 açık hata (lahn-i celî), 🟠 ince hata (lahn-i hafî). Yapay zekâ yanılabilir; son söz hocanındır.')}</p></div>`;
  }
  function raporKaydet(n, a, sonuc) {
    const K = sonuc.kelimeler, notlar = [];
    K.forEach(w => w.notes.forEach(z => notlar.push([w.index, z.rule, z.severity === 'jali' ? 'j' : 'k', z.msg])));
    S.okuma = (S.okuma || []).concat([{ t: simdi(), n, a, w: K.length, j: notlar.filter(x => x[2] === 'j').length, k: notlar.filter(x => x[2] === 'k').length, notlar }]).slice(-300);
    seriGuncelle(); kaydet();
  }
  // ------------------------------------------------------------ Ezberden oku (canlı takip)
  // Kelimeler okundukça açılır. Okurken hiçbir uyarı yok; bir ayet ancak bitince değerlendirilir
  // (S.ayar.canliSonuc: 'ayet' → her ayet bitince renklenir, 'son' → hepsi durunca). Yarım kalan ayet değerlendirilmez.
  let CANLI = null;
  function onekHizala(h, R) {   // h'nin tamamı ↔ R'nin en iyi öneki; es[i]: h[0..i) → R[0..es[i])
    const n = h.length, m = Math.min(R.length, n * 2 + 12);
    const D = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
    for (let i = 0; i <= n; i++) D[i][0] = i; for (let j = 0; j <= m; j++) D[0][j] = j;
    for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + (h[i - 1] !== R[j - 1] ? 1 : 0));
    let k = 0, en = Infinity; for (let j = 0; j <= m; j++) if (D[n][j] <= en) { en = D[n][j]; k = j; }
    const es = new Int32Array(n + 1); let i = n, j = k; es[n] = k;
    while (i > 0) { if (j > 0 && D[i][j] === D[i - 1][j - 1] + (h[i - 1] !== R[j - 1] ? 1 : 0)) { i--; j--; } else if (D[i][j] === D[i - 1][j] + 1) i--; else j--; es[i] = Math.max(es[i], j); }
    return { k, mesafe: en, es };
  }
  const canliKelimeler = a => { const k = document.getElementById('ayet-' + a); return k ? [...k.querySelectorAll('.ayet .kelime')] : []; };
  const canliEl = (a, wi) => { const l = canliKelimeler(a); return l[Math.min(wi, l.length - 1)]; };
  // ops: { bit: son ayet (yoksa sûre sonu), gizle(a, wi): kelime gizlensin mi (yoksa hepsi), bitince(C_): sonuç şerit yerine buraya }
  async function canliBaslat(n, basAyet, ops = {}) {
    if (CANLI) return canliDurdur();
    if (!navigator.mediaDevices || !window.AudioContext && !window.webkitAudioContext) return toast(t('Bu cihazda ses kaydı desteklenmiyor.'));
    const bar = $('#canliBar'); bar.hidden = false; bar.querySelector('.canli-durum').textContent = t('Hazırlanıyor…');
    let O; try { O = await okumaHazirla(); await O.modelAc(p => { const e = bar.querySelector('.canli-durum'); if (e) e.textContent = t('Yapay zekâ modeli hazırlanıyor: {0}', yuzdeStr(Math.round(p * 100))); }); } catch (e) { bar.hidden = true; return toast(e.message || t('Okuma raporu yüklenemedi.')); }
    let akis; try { akis = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 } }); } catch (e) { bar.hidden = true; return toast(t('Mikrofon izni verilmedi. Telefon ayarlarından Hüsn-i Kıraat için mikrofona izin ver.')); }
    sesDurdur(); const mn = app.querySelector('main'); if (mn) mn.classList.add('canli-mod');
    const fon = await O.fonetik(n), x = SURE(n), son_ = x.ayet.length;
    // Beklenen fonetik yazı: başlangıç ayetinden sûre sonuna kadar art arda
    let G = '', W = [], AY = [];
    const bit_ = Math.min(son_, ops.bit || son_);
    for (let a = basAyet; a <= bit_; a++) { const f = fon[a - 1]; const b = G.length; f.sp.forEach(([s, e], wi) => W.push({ a, wi, s: b + s, e: b + e })); G += f.p; AY.push({ a, s: b, e: G.length }); }
    // Aralık sûre sonundan önce bitiyorsa sıradaki ayet yalnız "bitiş işareti" olarak eklenir (gösterilmez, değerlendirilmez):
    // son ayetin bittiği, okuyucu durmadan devam etse de anlaşılır.
    if (bit_ < son_) G += fon[bit_].p;
    const AC = window.AudioContext || window.webkitAudioContext; let ctx; try { ctx = new AC({ sampleRate: 16000 }); } catch (e) { ctx = new AC(); }
    const oran = ctx.sampleRate / 16000, parcalar = []; let toplam = 0;
    const kaynak = ctx.createMediaStreamSource(akis);
    const rmsL = [];   // parça başına ses düzeyi: gürültü tabanını ve konuşma düzeyini ölçmek için
    const ekle = g => { let y; if (oran === 1) y = new Float32Array(g); else { const L = Math.floor(g.length / oran); y = new Float32Array(L); for (let i = 0; i < L; i++) y[i] = g[Math.floor(i * oran)]; } parcalar.push(y); toplam += y.length;
      let e = 0; for (const v of y) e += v * v; rmsL.push(Math.sqrt(e / Math.max(1, y.length))); if (rmsL.length > 400) rmsL.shift(); };
    // Ses ayrı iş parçacığında (AudioWorklet) toplanır: model hesaplarken ana iş parçacığı meşgulken parça kaybolmaz
    let isl = null;
    try {
      const kod = `class T extends AudioWorkletProcessor{constructor(){super();this.b=[];this.n=0}process(i){const c=i[0]&&i[0][0];if(c){this.b.push(new Float32Array(c));this.n+=c.length;if(this.n>=2048){const o=new Float32Array(this.n);let p=0;for(const x of this.b){o.set(x,p);p+=x.length}this.port.postMessage(o,[o.buffer]);this.b=[];this.n=0}}return true}}registerProcessor('canli-topla',T);`;
      await ctx.audioWorklet.addModule(URL.createObjectURL(new Blob([kod], { type: 'application/javascript' })));
      isl = new AudioWorkletNode(ctx, 'canli-topla'); isl.port.onmessage = e => ekle(e.data);
      kaynak.connect(isl);
    } catch (e) {
      isl = ctx.createScriptProcessor(4096, 1, 1); isl.onaudioprocess = ev => ekle(ev.inputBuffer.getChannelData(0));
      kaynak.connect(isl); isl.connect(ctx.destination);
    }
    const al = (b, s) => { const o = new Float32Array(Math.max(0, s - b)); let p = 0, i = 0; for (const c of parcalar) { const cs = p, ce = p + c.length; p = ce; if (ce <= b) continue; if (cs >= s) break; const x0 = Math.max(b, cs) - cs, x1 = Math.min(s, ce) - cs; o.set(c.subarray(x0, x1), i); i += x1 - x0; } return o; };
    const kuyruk = { p: Promise.resolve() }; const sirala = f => (kuyruk.p = kuyruk.p.then(f, f));   // model çağrıları tek tek
    // Fâtiha ve Tevbe dışında 1. ayetten başlanırsa okuyucu önce besmele çekebilir: duyulana göre karar verilir
    const besmele = basAyet === 1 && n !== 1 && n !== 9 ? (await O.fonetik(1))[0].p : '';
    CANLI = { n, besmele, besmeleKarar: besmele ? null : 'yok', akis, ctx, isl, kaynak, G, W, AY, c: 0, bas: 0, acilan: 0, bitenAyet: 0, ayetBas: 0, sonuc: {}, bakilan: new Set(), mesgul: false, bitti: false, sirala, al, O, toplam: () => toplam, bitince: ops.bitince, ayetBitti: ops.ayetBitti, rms: rmsL, sonIlerleme: Date.now() };
    // takılınca kelimeye dokunup bakma
    W.forEach(w => { const el = canliEl(w.a, w.wi); if (el) { el.classList.toggle('gizli', !ops.gizle || ops.gizle(w.a, w.wi)); el.classList.remove('canli-acik', 'canli-okundu', 'canli-bakildi', 'r-iyi', 'r-orta', 'r-kotu'); el.onclick = ev => { if (!CANLI || !el.classList.contains('gizli')) return; ev.stopPropagation(); el.classList.remove('gizli'); el.classList.add('canli-bakildi'); CANLI.bakilan.add(w.a + ':' + w.wi); }; } });
    canliSiraIsaretle();
    document.getElementById('ayet-' + basAyet)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    bar.classList.add('dinliyor'); bar.querySelector('#canliDur').textContent = t('⏹ Durdur');
    canliDurumYaz();
    CANLI.zaman = setInterval(() => canliAdim(false), 1000);
  }
  function canliDurumYaz() {
    const C_ = CANLI; if (!C_) return; const e = document.querySelector('#canliBar .canli-durum'); if (!e) return;
    e.textContent = t('🎙️ Dinliyorum · {0}/{1} kelime', C_.acilan, C_.W.length);
  }
  function canliSiraIsaretle() {
    document.querySelectorAll('.kelime.canli-sira').forEach(e => e.classList.remove('canli-sira'));
    const C_ = CANLI; if (!C_) return; const w = C_.W[C_.acilan]; if (!w) return;
    const el = canliEl(w.a, w.wi); if (el) { el.classList.add('canli-sira'); if (C_.acilan && C_.W[C_.acilan - 1].a !== w.a) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }
  function canliAc(hedef) {   // hedef: G içindeki konum; bitişi hedefe kadar olan kelimeler açılır
    const C_ = CANLI; let degisti = false;
    while (C_.acilan < C_.W.length && C_.W[C_.acilan].e <= hedef) { const w = C_.W[C_.acilan], el = canliEl(w.a, w.wi); if (el && el.classList.contains('gizli')) { el.classList.remove('gizli'); el.classList.add('canli-acik'); } else if (el) el.classList.add('canli-okundu'); C_.acilan++; degisti = true; }
    if (degisti) { C_.sonIlerleme = Date.now(); canliSiraIsaretle(); canliDurumYaz(); }
  }
  async function canliAdim(sonAdim) {
    const C_ = CANLI; if (!C_ || C_.mesgul) return; if (!document.getElementById('canliBar')) return canliDurdur(true);
    const son = C_.toplam(); if (!sonAdim && son - C_.bas < 8000) return;
    C_.mesgul = true;
    try {
      const seg = C_.al(C_.bas, son);
      const d = await C_.sirala(() => C_.O.dinle(seg));
      if (CANLI !== C_) return;
      const h = d.heard;
      if (C_.besmeleKarar === null) {   // besmele çekildi mi?
        if (h.length < C_.besmele.length * 0.7 && !sonAdim) return;
        const B = onekHizala(h, C_.besmele), Y = onekHizala(h, C_.G);
        const bVar = onekHizala(h.slice(0, C_.besmele.length + 4), C_.besmele).mesafe < C_.besmele.length * 0.35 && B.mesafe <= Y.mesafe + C_.besmele.length;
        C_.besmeleKarar = bVar ? 'var' : 'yok';
        if (bVar) { const bl = C_.besmele.length; C_.G = C_.besmele + C_.G; C_.W.forEach(w => { w.s += bl; w.e += bl; }); C_.AY.forEach(y => { y.s += bl; y.e += bl; }); }
      }
      // Dururken yarım kalan ayet: en az %60'ı okunduysa yine değerlendirilir (takılınan kelimenin hatası gösterilsin)
      const yarimDegerlendir = () => { const ay = C_.AY[C_.bitenAyet]; if (!ay) return; const wl = C_.W.filter(w => w.a === ay.a), ac = wl.filter(w => C_.W.indexOf(w) < C_.acilan).length;
        // uzun takılmada ses 29 sn sınırını aşmasın: yalnız son 20 sn (okuma ve ardından gelen sessizlik)
        if (ac && ac >= Math.ceil(wl.length * 0.6)) { canliAyetBitti(ay.a, Math.max(C_.ayetBas, son - 20 * 16000), son); C_.ayetBas = son; C_.bitenAyet++; } };
      const A = onekHizala(h, C_.G.slice(C_.c));
      // güvenilmeyen hizalama (tekrar okuma, başka ayet, gürültü): ilerleme yok; pencere çok uzarsa eski ses bırakılır
      if (A.k > 0 && A.mesafe > Math.max(3, 0.35 * A.k)) { if (sonAdim) yarimDegerlendir(); else if ((son - C_.bas) / 16000 > 12) C_.bas = son - 4 * 16000; return; }
      // okuyucu durduysa (son ~0,9 sn sessiz) ya da bitirdiyse: büyük kısmı duyulan kelime de tamamlanmış sayılır (uzun med, vakf)
      const kuyrukSes = seg.subarray(Math.max(0, seg.length - 14400)); let e2 = 0; for (const v of kuyrukSes) e2 += v * v;
      // Sessizlik eşiği ortama göre: gürültü tabanının üstünde, konuşma düzeyinin altında (telefonda oda gürültüsü 0,012'yi aşabiliyor)
      const esik = (() => { const l = C_.rms.slice(-250); if (l.length < 10) return 0.012; const sr = l.slice().sort((x, y) => x - y), taban = sr[Math.floor(sr.length * 0.15)], ust = sr[Math.floor(sr.length * 0.9)];
        return Math.max(0.012, Math.min(taban * 1.6 + 0.004, taban + (ust - taban) * 0.35)); })();
      // Son kelime de açıldıysa ve 1,5 sn yeni ilerleme yoksa okuma bitmiş sayılır (gürültüde de)
      const sonKelimeBekledi = C_.acilan >= C_.W.length && Date.now() - C_.sonIlerleme > 1500;
      const sessiz = kuyrukSes.length >= 14400 && Math.sqrt(e2 / kuyrukSes.length) < esik;
      const durdu = sonAdim || sonKelimeBekledi || sessiz;
      if (!durdu && Date.now() - C_.sonIlerleme > 5000) { const de = document.querySelector('#canliBar .canli-durum'); if (de) de.textContent = t('Bitirdiysen ⏹ düğmesine dokun.'); }
      let ilerle = C_.c + A.k - (durdu ? 0 : 1);
      const sira = C_.W[C_.acilan];
      if (durdu && sira && ilerle < sira.e && ilerle >= sira.s + 0.6 * (sira.e - sira.s)) ilerle = sira.e;
      canliAc(ilerle);
      const zamanBul = hedef => { let hi = -1; for (let i = 0; i <= h.length; i++) if (A.es[i] <= hedef - C_.c) hi = i; return hi > 0 && hi <= d.times.length ? C_.bas + Math.max(0, Math.round((d.times[hi - 1] + 0.08) * 16000)) : null; };
      // biten ayetler: bir sonraki ayetin okunmaya başlandığı görülünce (ya da son adımda tamamı okununca)
      while (C_.bitenAyet < C_.AY.length) {
        const ay = C_.AY[C_.bitenAyet];
        if (!(ilerle > ay.e || (durdu && ilerle >= ay.e))) {
          // Dururken: ayetin en az %60'ı okunduysa yine değerlendirilir (takılınan son kelime "okunmadı" diye geçilmesin, hatası gösterilsin)
          if (sonAdim) yarimDegerlendir();
          break;
        }
        const bitis = ilerle > ay.e ? (zamanBul(ay.e) || son) : son;   // durarak bitirdiyse sessizlik dahil sona kadar
        canliAyetBitti(ay.a, C_.ayetBas, bitis);
        C_.ayetBas = bitis; C_.bitenAyet++;
        if (!sonAdim) { C_.bas = bitis; C_.c = ay.e; }
      }
      // pencere uzadıysa son açılan kelimeye çapa at
      if (!sonAdim && (son - C_.bas) / 16000 > 6 && C_.acilan > 0) {
        const w = C_.W[C_.acilan - 1]; if (w.e > C_.c) { const z = zamanBul(w.e); if (z) { C_.bas = z; C_.c = w.e; } }
      }
      if (C_.bitenAyet >= C_.AY.length) canliDurdur();
      // Son ayette takılıp sustuysa (2,5 sn ilerleme yok ve sessiz) ve ayetin çoğu okunduysa okuma kendiliğinden biter
      else if (!sonAdim && sessiz && C_.bitenAyet === C_.AY.length - 1 && Date.now() - C_.sonIlerleme > 2500) {
        const ay = C_.AY[C_.AY.length - 1], wl = C_.W.filter(w => w.a === ay.a), ac = wl.filter(w => C_.W.indexOf(w) < C_.acilan).length;
        if (ac >= Math.ceil(wl.length * 0.6)) canliDurdur();
      }
    } catch (e) { console.warn('canlı takip', e); }
    finally { C_.mesgul = false; }
  }
  function canliAyetBitti(a, bas, bitis) {
    const C_ = CANLI, n = C_.n;
    const seg = C_.al(Math.max(0, bas - 3200), Math.min(C_.toplam(), bitis + 3200));
    if (seg.length / 16000 > 29) { C_.sonuc[a] = { uzun: true }; return; }
    C_.sirala(async () => {
      try {
        const s = await C_.O.ayetRaporu(n, a, seg); C_.sonuc[a] = s; raporKaydet(n, a, s);
        if ((S.ayar.canliSonuc || 'ayet') === 'ayet') canliAyetBoya(a, s);
        if (C_.ayetBitti && !C_.durduruldu) C_.ayetBitti(a, s);
      } catch (e) { C_.sonuc[a] = { hata: e.message }; }
    });
  }
  function canliAyetBoya(a, s) {
    const K = s.kelimeler; canliKelimeler(a).forEach((el, i) => {
      const w = K[Math.min(i, K.length - 1)]; if (!w) return;
      el.classList.remove('canli-acik', 'canli-okundu', 'canli-sira', 'gizli');
      el.classList.add(!w.notes.length ? 'r-iyi' : w.notes.some(z => z.severity === 'jali') ? 'r-kotu' : 'r-orta');
    });
    const kutu = document.getElementById('rapor-' + a); if (kutu) { kutu.innerHTML = raporHTML(CANLI ? CANLI.n : 0, a, s); kutu.hidden = !(s.kelimeler.some(w => w.notes.length)); }
  }
  async function canliDurdur(sessiz) {
    const C_ = CANLI; if (!C_ || C_.bitti) return; C_.bitti = true; C_.durduruldu = !!sessiz; clearInterval(C_.zaman);
    const bar = document.getElementById('canliBar'); if (bar) { bar.classList.remove('dinliyor'); bar.querySelector('.canli-durum').textContent = t('Değerlendiriliyor…'); }
    // son adım: duyulanın tamamıyla hizala (son kelime ve son ayet için)
    while (C_.mesgul) await new Promise(r => setTimeout(r, 100));
    try { C_.isl.disconnect(); C_.kaynak.disconnect(); } catch (e) { }
    C_.akis.getTracks().forEach(x => x.stop());
    if (!sessiz) { CANLI = C_; await canliAdim(true); }
    await C_.sirala(() => null); try { C_.ctx.close(); } catch (e) { }
    CANLI = null; document.querySelectorAll('.kelime.canli-sira').forEach(e => e.classList.remove('canli-sira'));
    if (sessiz || !document.getElementById('canliBar')) return;
    if (C_.bitince) return C_.bitince(C_);
    canliSonucGoster(C_);
  }
  function canliSonucGoster(C_) {
    const bar = document.getElementById('canliBar'); const ayetler = Object.keys(C_.sonuc).map(Number).sort((a, b) => a - b);
    let dogru = 0, kontrol = 0, yanlis = 0;
    for (const a of ayetler) { const s = C_.sonuc[a]; if (!s.kelimeler) continue; if ((S.ayar.canliSonuc || 'ayet') === 'son') canliAyetBoya(a, s);
      s.kelimeler.forEach(w => { if (!w.notes.length) dogru++; else if (w.notes.some(z => z.severity === 'jali')) yanlis++; else kontrol++; }); }
    const yarim = C_.AY.find(y => !(y.a in C_.sonuc) && C_.W.some(w => w.a === y.a && C_.W.indexOf(w) < C_.acilan));
    const yanlisAyet = ayetler.find(a => C_.sonuc[a].kelimeler && C_.sonuc[a].kelimeler.some(w => w.notes.some(z => z.severity === 'jali')));
    const top_ = dogru + kontrol + yanlis;
    bar.innerHTML = `<div class="canli-sonuc">
      <p class="canli-baslik">${top_ ? (yanlis ? t('{0} kelimeden {1} tanesini doğru okudun.', top_, dogru + kontrol) : t('Maşallah! {0} kelimenin hepsini doğru okudun.', top_)) : t('Değerlendirilecek tam bir ayet okunmadı.')}</p>
      ${top_ ? `<div class="canli-sayilar"><span class="r-iyi">🟢 ${t('{0} doğru', dogru)}</span>${kontrol ? `<span class="r-orta">🟠 ${t('{0} kontrol et', kontrol)}</span>` : ''}${yanlis ? `<span class="r-kotu">🔴 ${t('{0} yanlış', yanlis)}</span>` : ''}${C_.bakilan.size ? `<span class="canli-bakildi">👁️ ${t('{0} bakıldı', C_.bakilan.size)}</span>` : ''}</div>` : ''}
      ${yarim ? `<p class="soluk kucukyazi">${t('{0}. ayet yarım kaldı; yarım ayet değerlendirilmez.', yarim.a)}</p>` : ''}
      ${ayetler.some(a => C_.sonuc[a].uzun) ? `<p class="soluk kucukyazi">${t('30 saniyeden uzun ayetler için ayrıntılı rapor yok.')}</p>` : ''}
      <p class="soluk kucukyazi">${t('Ayrıntı için ayetlerin altındaki rapora bak. Yapay zekâ yanılabilir; son söz hocanındır.')}</p>
      <div class="satir sola">${yanlisAyet ? `<button class="btn" data-canli-bas="${yanlisAyet}">${t('🔁 {0}. ayetten tekrar oku', yanlisAyet)}</button>` : ''}<button class="btn ${yanlisAyet ? 'ikincil' : ''}" data-canli-bas="1">${t('🎙️ Baştan oku')}</button><button class="btn ikincil" id="canliKapat">${t('Kapat')}</button></div></div>`;
    bar.querySelectorAll('[data-canli-bas]').forEach(b => b.onclick = () => { const a = +b.dataset.canliBas; canliBarSifirla(); canliBaslat(C_.n, a); });
    bar.querySelector('#canliKapat').onclick = () => { canliBarSifirla(); bar.hidden = true; };
  }
  function canliBarHTML() { return `<div class="canli-ic"><span class="canli-nokta"></span><span class="canli-durum"></span><button class="btn kirmizi-btn" id="canliDur">${t('⏹ Durdur')}</button></div>`; }
  function canliBarSifirla() { const bar = document.getElementById('canliBar'); if (!bar) return; bar.innerHTML = canliBarHTML(); bar.querySelector('#canliDur').onclick = () => canliDurdur(); document.querySelectorAll('[id^="rapor-"]').forEach(k => { k.hidden = true; k.innerHTML = ''; }); }
  // ------------------------------------------------------------ Ezber çalış: tek ekran, adım adım (karar: claude/toplanti-2026-11-16-ezber-ux.md)
  // Adımlar: 0 Dinle · 1 Bakarak oku · 2 Yarısı gizli · 3 Ezberden · 4 Bağla (önceki ayetlerle birlikte; sûrenin ilk dersinde yok).
  // Kısa ayetler günlük ders kadar birlikte çalışılır; uzun ayet (EZ_UZUN kelimeden çok) tek başına.
  // Tekrar kipi: sûrenin ezberlenen kısmı tamamen gizli okunur; hatalı ayetler "zayıf" olur ve ertesi gün yine sorulur.
  const EZ_UZUN = 10;
  let EZ = null, ezZincir = [];
  const ezAdimAd = () => [t('Dinle'), t('Bakarak'), t('Yarısı'), t('Ezberden'), t('Bağla')];
  function ezAralik(n, bas) {
    const x = SURE(n), top = x.ayet.length, hedef = S.ayar.ezberHedef || 3; let bit = bas;
    for (let a = bas; a <= top && a - bas < hedef; a++) { const uzun = x.ayet[a - 1].split(' ').length > EZ_UZUN; if (uzun && a > bas) break; bit = a; if (uzun) break; }
    return [bas, bit];
  }
  // Dışarıdan açılış: her açılış yeni bir çalışma
  function ezAc(n, mod, bas) { EZ = null; git('ezberCalis', n, mod || 'yeni', bas || ''); }
  const ezGorevAd = g => g.mod === 'tekrar' ? t('{0} tekrarı', sureNoAdi(g.n)) : t('{0} yeni ders', sureNoAdi(g.n));
  EKRAN.ezberCalis = function (n, mod = 'yeni', bas, tek) {   // tek: yalnız 'bas' ayeti (zayıf ayet çalışması)
    n = +n; const x = SURE(n);
    if (!x) {
      app.innerHTML = `${ust(esc(sureNoAdi(n)))}<main><p class="soluk">${t('Yükleniyor…')}</p></main>`;
      sureYukle(n).then(() => { const ek = ekranYigini[ekranYigini.length - 1]; if (ek[0] === 'ezberCalis' && +ek[1][0] === n) ciz(); }).catch(() => toast(t('Sûre açılamadı.')));
      return;
    }
    if (CANLI) canliDurdur(true);
    ezberEkle(n); const e = ezb(n), top = x.ayet.length;
    if (mod === 'yeni' && !+bas && e.tam) mod = 'tekrar';
    if (mod === 'tekrar' && !e.tam && !e.a) mod = 'yeni';
    if (!EZ || EZ.n !== n || EZ.mod !== mod || EZ.yigin !== ekranYigini.length) {
      const [b1, b2] = mod === 'tekrar' ? [1, e.tam ? top : e.a] : +tek && +bas ? [+bas, +bas] : ezAralik(n, +bas || Math.min(top, e.a + 1));
      EZ = { n, mod, yigin: ekranYigini.length, bas: b1, bit: b2, adim: mod === 'tekrar' ? 3 : 0, bakis: 0, ilkKelime: false, bitti: false, sonuc: null };
    }
    const Z = EZ, baglaVar = Z.mod === 'yeni' && Z.bas > 1, adimSay = baglaVar ? 5 : 4;
    const [okBas, okBit] = Z.adim === 4 ? [1, Z.bit] : [Z.bas, Z.bit];
    const gizle = (a, wi) => Z.adim === 2 ? wi % 2 === 1 : Z.adim >= 3 ? !(Z.ilkKelime && wi === 0) : false;
    const baslik = Z.mod === 'tekrar' ? t('{0} · tekrar', esc(sureNoAdi(n))) : `${esc(sureNoAdi(n))} · ${Z.bas === Z.bit ? Z.bas : Z.bas + '–' + Z.bit}`;
    // ---- bitti görünümü
    if (Z.bitti) {
      const sira = ezZincir[0], ee = ezb(n);
      app.innerHTML = `${ust(baslik)}<main class="ez-ekran">
        <section class="kart ez-bitti"><div class="ez-bitti-ikon" aria-hidden="true">✓</div>
          <h2>${Z.mod === 'tekrar' ? t('Tekrar tamam') : t('Bugünkü ezber tamam')}</h2>
          <p>${Z.mod === 'tekrar' ? (Z.zayif && Z.zayif.length ? t('{0} ayette takıldın; yarın yine sorulacak.', Z.zayif.length) : t('Hiç takılmadan okudun. Maşallah!')) : (Z.bas === Z.bit ? t('{0}, {1}. ayet ezberine eklendi.', esc(sureNoAdi(n)), Z.bas) : t('{0}, {1}. ayetler ezberine eklendi.', esc(sureNoAdi(n)), Z.bas + '–' + Z.bit))}</p>
          ${Z.zayif && Z.zayif.length ? `<div class="satir sola">${Z.zayif.map(a => `<button class="btn ikincil" data-ez-calis="${a}">${t('{0}. ayeti çalış', a)}</button>`).join('')}</div>` : ''}
          <div class="ez-bitti-dugmeler">
            ${sira ? `<button class="btn genis" id="ezSiradaki">${t('Sıradaki: {0} ›', esc(ezGorevAd(sira)))}</button>` : ''}
            ${Z.mod === 'yeni' && ee && !ee.tam ? `<button class="btn genis ${sira ? 'ikincil' : ''}" id="ezDevam">${t('Sonraki ayetleri çalış ›')}</button>` : ''}
            <button class="btn genis ikincil" id="ezDon">${t('Ezber\'e dön')}</button>
          </div></section></main>`;
      const sb = $('#ezSiradaki'); if (sb) sb.onclick = () => { const g = ezZincir.shift(); EZ = null; ekranDegistir('ezberCalis', g.n, g.mod, ''); };
      const db = $('#ezDevam'); if (db) db.onclick = () => { EZ = null; ekranDegistir('ezberCalis', n, 'yeni', ''); };
      $('#ezDon').onclick = () => { ezZincir = []; geri(); };
      app.querySelectorAll('[data-ez-calis]').forEach(b => b.onclick = () => { EZ = null; ekranDegistir('ezberCalis', n, 'yeni', +b.dataset.ezCalis, 1); });
      return;
    }
    // ---- adım çubuğu ve yönerge
    const adimlar = ezAdimAd().slice(0, adimSay);
    const cubuk = Z.mod === 'tekrar' ? '' : `<nav class="ez-adimlar" aria-label="${t('Adımlar')}" style="--n:${adimSay}">${adimlar.map((ad, i) => `<button class="ez-adim ${i < Z.adim ? 'tamam' : i === Z.adim ? 'aktif' : ''}" data-ez-adim="${i}" ${i === Z.adim ? 'aria-current="step"' : ''}><span></span>${esc(ad)}${i < Z.adim ? ' ✓' : ''}</button>`).join('')}</nav>`;
    const yonerge = Z.mod === 'tekrar' ? t('Sûrenin ezberlediğin kısmını ezberden oku: {0}–{1}. ayetler. Takıldığın ayetler yakın tekrara alınır.', 1, Z.bit)
      : [t('Dinle ve içinden tekrar et.'), t('Bakarak oku; okudukça kelimeler yeşerir.'), t('Kelimelerin yarısı gizli. Oku; okudukça açılır.'), t('Hepsi gizli. Ezberden oku; okudukça açılır.'), t('Önceki ayetlerle birlikte, hiç bakmadan oku: 1–{0}. ayetler.', Z.bit)][Z.adim];
    const OKU = (window.OKUNUS || {})[DIL === 'en' ? 'en' : 'tr'] || {};
    const ayetHTML = a => {
      const r = `${n}:${a}`; let o = 0;
      const kel = x.ayet[a - 1].split(' ').map((w, wi) => { const ic = kelimeHTML(r, w, o); o += w.length + 1; return gizle(a, wi) ? `<span class="kelime gizli" data-ac="${kelimeUrl(r, wi + 1)}">${ic}</span>` : `<span class="kelime" data-ses="${kelimeUrl(r, wi + 1)}">${ic}</span>`; }).join(' ');
      return `<div class="ez-ayet" id="ayet-${a}"><div class="ayet" dir="rtl" lang="ar">${kel} <span class="ayet-no">﴿${a.toLocaleString('ar-EG')}﴾</span></div>${Z.adim === 0 && okunusAcik() && OKU[r] ? `<p class="okunus">${esc(OKU[r])}</p>` : ''}<div class="rapor-kutu" id="rapor-${a}" hidden></div></div>`;
    };
    const ayetler = []; for (let a = okBas; a <= okBit; a++) ayetler.push(ayetHTML(a));
    const besmele = okBas === 1 && n !== 1 && n !== 9 ? `<div class="besmele" dir="rtl" lang="ar">${esc(trBesmele() || window.BESMELE || '')}</div>` : '';
    const tekrar = S.ayar.ezTekrar || 3, gizliAdim = Z.adim >= 2;
    app.innerHTML = `${ust(baslik)}${cubuk}<main class="ez-ekran">
      <p class="ez-yonerge">${yonerge}</p>
      ${Z.adim === 0 ? `<p class="kucukyazi soluk">${t('Her ayet kaç kez okunsun?')} ${[1, 3, 5].map(k => `<button class="cip ${tekrar === k ? 'aktif' : ''}" data-ez-tekrar="${k}">${k}×</button>`).join(' ')}</p>` : ''}
      ${Z.adim === 3 && Z.mod === 'yeni' ? `<p class="kucukyazi"><button class="cip ${Z.ilkKelime ? 'aktif' : ''}" id="ezIlk">${t('İlk kelime görünsün')}</button></p>` : ''}
      <section class="kart ez-kart" id="ezKart">${besmele}${ayetler.join('')}</section>
      <div id="ezSonuc"></div>
      ${Z.adim > 0 || Z.mod === 'tekrar' ? `<p class="ortala"><button class="link" id="ezAtla">${Z.mod === 'tekrar' ? t('Mikrofonsuz okudum, bitir ›') : Z.adim === adimSay - 1 ? t('Okumadan bitir ›') : t('Bu adımı atla ›')}</button></p>` : ''}
    </main>
    <div class="ez-alt" id="canliBar"><p class="canli-durum">${Z.adim === 0 ? t('Dinledikten sonra sonraki adıma geç.') : t('Mikrofona dokun ve oku.')}</p>
      <div class="ez-alt-dugmeler">
        <button class="ez-yan" id="ezDinle"><span aria-hidden="true">▶</span>${t('Dinle')}</button>
        ${Z.adim === 0 ? `<button class="ez-mik ez-ileri" id="ezIleriAlt">${t('Sonraki adım ›')}</button>` : `<div class="ez-mik-kap"><button class="ez-mik" id="canliDur" aria-label="${t('Oku')}">🎙️</button><span class="ez-mik-yazi" id="ezMikYazi">${t('Oku')}</span></div>`}
        ${gizliAdim ? `<button class="ez-yan" id="ezGoz"><span aria-hidden="true">👁</span>${t('Göz at')}</button>` : '<span class="ez-yan bos"></span>'}
      </div></div>`;
    // ---- olaylar
    const ileri = () => {
      sesDurdur();
      if (Z.mod === 'tekrar' || Z.adim >= adimSay - 1) return ezBitir();
      Z.adim++; Z.sonuc = null; ciz(); window.scrollTo(0, 0);
    };
    app.querySelectorAll('[data-ez-adim]').forEach(b => b.onclick = () => { if (CANLI) return; Z.adim = +b.dataset.ezAdim; ciz(); });
    app.querySelectorAll('[data-ez-tekrar]').forEach(b => b.onclick = () => { S.ayar.ezTekrar = +b.dataset.ezTekrar; kaydet(); ciz(); });
    const il = $('#ezIlk'); if (il) il.onclick = () => { Z.ilkKelime = !Z.ilkKelime; ciz(); };
    const at = $('#ezAtla'); if (at) at.onclick = ileri;
    const ia = $('#ezIleriAlt'); if (ia) ia.onclick = ileri;
    app.querySelectorAll('.ez-kart .kelime.gizli').forEach(k => k.onclick = ev => { if (CANLI || !k.classList.contains('gizli')) return; ev.stopPropagation(); k.classList.remove('gizli'); k.classList.add('canli-bakildi'); Z.bakis++; });
    // Dinle: aralıktaki ayetler sırayla, her biri seçilen sayıda
    $('#ezDinle').onclick = ev => {
      const btn = ev.currentTarget;
      if (Z.calma) { Z.calma.iptal = true; Z.calma = null; sesDurdur(); btn.classList.remove('caliyor'); document.querySelectorAll('.ez-ayet.calan').forEach(y => y.classList.remove('calan')); return; }
      if (CANLI) return;
      const liste = []; for (let a = okBas; a <= okBit; a++) for (let k = 0; k < (Z.adim === 0 ? tekrar : 1); k++) liste.push(a);
      const is = { iptal: false }; Z.calma = is; btn.classList.add('caliyor'); let j = 0;
      const bitir = () => { if (Z.calma === is) Z.calma = null; btn.classList.remove('caliyor'); document.querySelectorAll('.ez-ayet.calan').forEach(y => y.classList.remove('calan')); };
      const sonraki = () => {
        if (is.iptal || !document.body.contains(btn)) return bitir();
        document.querySelectorAll('.ez-ayet.calan').forEach(y => y.classList.remove('calan'));
        if (j >= liste.length) { bitir(); if (Z.adim === 0) { const d = $('#canliBar .canli-durum'); if (d) d.textContent = t('Hazır olunca sonraki adıma geç.'); } return; }
        const a = liste[j++], el = document.getElementById('ayet-' + a); if (el) { el.classList.add('calan'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        const au = new Audio(sesKaynak(ayetUrl(`${n}:${a}`))); ses = au; au.playbackRate = S.ayar.hiz || 1;
        au.onended = () => setTimeout(sonraki, 400);
        au.onerror = () => { bitir(); toast(t('Ses çalınamadı. İnternet bağlantını kontrol et.')); };
        au.play().catch(() => bitir());
      };
      sesDurdur(); sonraki();
    };
    // Göz at: basılı tutunca gizliler görünür
    const goz = $('#ezGoz');
    if (goz) {
      const ac = ev => { ev.preventDefault(); $('#ezKart').classList.add('goz-at'); Z.bakis++; }, kapa = () => { const k = $('#ezKart'); if (k) k.classList.remove('goz-at'); };
      goz.addEventListener('pointerdown', ac); ['pointerup', 'pointerleave', 'pointercancel'].forEach(o => goz.addEventListener(o, kapa));
      goz.addEventListener('keydown', ev => { if (ev.key === ' ' || ev.key === 'Enter') ac(ev); }); goz.addEventListener('keyup', kapa);
    }
    // Oku: canlı takip bu ekranın kelimeleri üzerinde; sonuç aynı kartta.
    // Mikrofon durumu: bos (Oku) · hazirlaniyor · dinliyor (Durdur) · degerlendiriyor · tekrar (Tekrar oku)
    const mikDurum = d => {
      const m = $('#canliDur'), y = $('#ezMikYazi'); if (!m) return;
      const [ic, yazi, sinif] = { bos: ['🎙️', t('Oku'), ''], hazirlaniyor: ['…', t('Hazırlanıyor…'), 'bekliyor'], dinliyor: ['⏹', t('Durdur'), 'kaydediyor'], degerlendiriyor: ['…', t('Değerlendiriliyor…'), 'bekliyor'], tekrar: ['🎙️', t('Tekrar oku'), ''] }[d];
      m.textContent = ic; m.setAttribute('aria-label', yazi); m.classList.remove('kaydediyor', 'bekliyor'); if (sinif) m.classList.add(sinif); m.disabled = sinif === 'bekliyor';
      if (y) y.textContent = yazi;
    };
    Z.ayetSonuc = Z.ayetSonuc || {};
    async function ezOkuBasla(bas) {
      if (CANLI) await canliDurdur(true);
      if (Z.calma) { Z.calma.iptal = true; Z.calma = null; sesDurdur(); }
      const sonucYer = $('#ezSonuc'); if (!sonucYer) return;
      sonucYer.innerHTML = ''; app.querySelectorAll('.ez-ayet-tekrar').forEach(x => x.remove());
      if (bas === okBas) { Z.bakis = 0; Z.ayetSonuc = {}; } else for (let a = bas; a <= okBit; a++) delete Z.ayetSonuc[a];
      for (let a = bas; a <= okBit; a++) { const k = document.getElementById('rapor-' + a); if (k) { k.hidden = true; k.innerHTML = ''; } }
      mikDurum('hazirlaniyor');
      await canliBaslat(n, bas, { bit: okBit, gizle, bitince: ezCanliBitti, ayetBitti: ezAyetBitti });
      const bar = $('#canliBar'); if (bar) bar.hidden = false;
      mikDurum(CANLI ? 'dinliyor' : 'bos');
    }
    // Bir ayet bitince: sonucu sakla; hata ya da kontrol varsa "Bu ayeti tekrar oku" (tek dokunuş, o ayetten yeniden dinler)
    function ezAyetBitti(a, s_) {
      Z.ayetSonuc[a] = s_;
      if (!s_.kelimeler || !s_.kelimeler.some(w => w.notes.length)) return;
      const k = document.getElementById('ayet-' + a); if (!k || k.querySelector('.ez-ayet-tekrar')) return;
      // Ayrıntı katlı: ayetin altında yalnız iki düğme (uzun rapor tekrar düğmesini ekrandan itmesin)
      const kutu = document.getElementById('rapor-' + a); if (kutu) kutu.hidden = true;
      const sat = document.createElement('div'); sat.className = 'ez-ayet-tekrar';
      sat.innerHTML = `<button class="ez-yeniden">↻ ${t('Bu ayeti tekrar oku')}</button><button class="ez-ayrinti" aria-expanded="false">${t('Hataları gör')}</button>`;
      sat.querySelector('.ez-yeniden').onclick = () => ezOkuBasla(a);
      sat.querySelector('.ez-ayrinti').onclick = ev => { if (!kutu) return; kutu.hidden = !kutu.hidden; ev.currentTarget.setAttribute('aria-expanded', String(!kutu.hidden)); ev.currentTarget.textContent = kutu.hidden ? t('Hataları gör') : t('Gizle'); };
      k.querySelector('.ayet').after(sat);
    }
    const mik = $('#canliDur');
    if (mik) mik.onclick = () => {
      if (CANLI) { mikDurum('degerlendiriyor'); return canliDurdur(); }
      ezOkuBasla(okBas);
    };
    function ezCanliBitti(C_) {
      const bar = $('#canliBar'); if (!bar) return;
      bar.querySelector('.canli-durum').textContent = '';
      mikDurum('tekrar');
      Object.entries(C_.sonuc).forEach(([a, v]) => { if (v && v.kelimeler) Z.ayetSonuc[a] = v; });
      let dogru = 0, kontrol = 0, yanlis = 0; const zayif = [];
      for (let a = okBas; a <= okBit; a++) {
        const s_ = Z.ayetSonuc[a] || C_.sonuc[a];
        if (!s_ || !s_.kelimeler) { zayif.push(a); continue; }
        let j_ = 0; s_.kelimeler.forEach(w => { if (!w.notes.length) dogru++; else if (w.notes.some(z => z.severity === 'jali')) { yanlis++; j_++; } else kontrol++; });
        if (j_) zayif.push(a);
      }
      const bakis = Z.bakis + C_.bakilan.size, top_ = dogru + kontrol + yanlis, okunmadi = zayif.filter(a => !((Z.ayetSonuc[a] || C_.sonuc[a]) || {}).kelimeler);
      const tamam = !zayif.length;
      Z.sonuc = { zayif, tamam };
      const son = Z.mod === 'tekrar' || Z.adim >= adimSay - 1;
      $('#ezSonuc').innerHTML = `<section class="kart ez-sonuc ${tamam ? 'iyi' : ''}" aria-live="polite">
        <p class="ez-sonuc-baslik">${!top_ ? t('Değerlendirilecek tam bir ayet okunmadı.') : yanlis ? t('{0} kelimeden {1} tanesini doğru okudun.', top_, dogru + kontrol) : t('Maşallah! {0} kelimenin hepsini doğru okudun.', top_)}</p>
        ${top_ ? `<div class="canli-sayilar"><span class="r-iyi">${t('{0} doğru', dogru)}</span>${kontrol ? `<span class="r-orta">${t('{0} kontrol et', kontrol)}</span>` : ''}${yanlis ? `<span class="r-kotu">${t('{0} yanlış', yanlis)}</span>` : ''}${bakis ? `<span class="canli-bakildi">${t('{0} kez göz attın', bakis)}</span>` : ''}</div>` : ''}
        ${okunmadi.length ? `<p class="soluk kucukyazi">${t('Okunmayan ya da yarım kalan ayet: {0}', okunmadi.join(', '))}</p>` : ''}
        ${yanlis || kontrol ? `<p class="soluk kucukyazi">${t('Renkli kelimelere dokunarak dinle; ayrıntı için "Hataları gör". Yapay zekâ yanılabilir; son söz hocanındır.')}</p>` : ''}
        <div class="satir"><button class="btn ikincil" id="ezTekrarOku">🎙️ ${t('Tekrar oku')}</button><button class="btn" id="ezIleri">${son ? t('Bitir ✓') : t('Sonraki adım ›')}</button></div></section>`;
      $('#ezTekrarOku').onclick = () => ezOkuBasla(okBas);
      $('#ezIleri').onclick = ileri;
      $('#ezSonuc').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    function ezBitir() {
      const ee = ezb(n);
      if (Z.mod === 'tekrar') {
        const zayif = Z.sonuc ? Z.sonuc.zayif : [];
        ee.zayif = zayif;
        if (zayif.length) { ee.son = simdi(); ee.vade = simdi() + GUN; seriGuncelle(); kaydet(); }   // takılınca yarın yine
        else tekrarEttim(n);
        Z.zayif = zayif;
      } else {
        if (Z.bit > (ee.a || 0)) ezberIsaretle(n, Z.bit); else { seriGuncelle(); kaydet(); }
        if (ee.zayif) ee.zayif = ee.zayif.filter(a => a < Z.bas || a > Z.bit);   // çalışılan zayıf ayetler listeden düşer
        ee.son = simdi(); kaydet();
      }
      Z.bitti = true; ciz(); window.scrollTo(0, 0);
      if (window.Konfeti && (!Z.zayif || !Z.zayif.length)) window.Konfeti.patlat($('.ez-bitti'), 24);
    }
  };

  // Sûre ekranında ayet başına "Oku, kontrol et"
  function okumaBagla(n) {
    app.querySelectorAll('[data-oku]').forEach(b => b.onclick = async () => {
      const a = +b.dataset.oku, kutu = document.getElementById('rapor-' + a);
      if (OKU_KAYIT.r) { if (OKU_KAYIT.a === a) OKU_KAYIT.r.state !== 'inactive' && OKU_KAYIT.r.stop(); return; }
      if (!navigator.mediaDevices || !window.MediaRecorder) return toast(t('Bu cihazda ses kaydı desteklenmiyor.'));
      let O; try { O = await okumaHazirla(); } catch (e) { return toast(e.message); }
      let akis; try { akis = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { return toast(t('Mikrofon izni verilmedi. Telefon ayarlarından Hüsn-i Kıraat için mikrofona izin ver.')); }
      if (ses) { ses.pause(); ses = null; }
      const parca = []; const r = new MediaRecorder(akis); Object.assign(OKU_KAYIT, { r, n, a });
      b.classList.add('kirmizi-btn', 'kaydediyor'); b.textContent = t('⏹ Bitir');
      kutu.hidden = false; kutu.innerHTML = `<p class="soluk">${t('🎙️ Dinliyorum… Ayeti oku, bitince "Bitir"e dokun (en fazla 28 saniye).')}</p>`;
      const modelIlk = !O.hazir();
      O.modelAc(p => { const e = document.getElementById('modelYuzde'); if (e) e.textContent = t('(yapay zekâ modeli ilk kez hazırlanıyor: {0})', yuzdeStr(Math.round(p * 100))); }).catch(() => { });   // kayıt sürerken model hazırlansın
      r.ondataavailable = e => { if (e.data && e.data.size) parca.push(e.data); };
      r.onstop = async () => {
        akis.getTracks().forEach(x => x.stop()); clearTimeout(OKU_KAYIT.zaman); OKU_KAYIT.r = null;
        b.classList.remove('kirmizi-btn', 'kaydediyor'); b.textContent = t('🎤 Tekrar oku');
        kutu.innerHTML = `<p class="soluk">${t('⏳ Okuyuşun inceleniyor…')} <span id="modelYuzde">${modelIlk && !O.hazir() ? t('(yapay zekâ modeli ilk kez hazırlanıyor; bu bir kez olur)') : ''}</span></p>`;
        try {
          const sonuc = await O.ayetRaporu(n, a, new Blob(parca, { type: r.mimeType || 'audio/webm' }));
          if (!document.body.contains(kutu)) return;
          kutu.innerHTML = raporHTML(n, a, sonuc); raporKaydet(n, a, sonuc);
        } catch (e) { if (document.body.contains(kutu)) kutu.innerHTML = `<p class="hata">${esc(e.message || String(e))}</p>`; }
      };
      r.start(); OKU_KAYIT.zaman = setTimeout(() => r.state !== 'inactive' && r.stop(), 28000);
    });
  }

  EKRAN.okumaRaporu = function () {
    const l = (S.okuma || []).slice().reverse();
    const top = l.length, temiz = l.filter(x => !x.j && !x.k).length, acik = l.reduce((s, x) => s + x.j, 0), ince = l.reduce((s, x) => s + x.k, 0);
    const sayac = {}; l.forEach(x => x.notlar.forEach(z => { const k = z[1].replace(':uneven', ''); sayac[k] = (sayac[k] || 0) + 1; }));
    const enCok = Object.entries(sayac).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const maks = enCok.length ? enCok[0][1] : 1;
    // son 7 günün eğilimi: ayet başına hata
    const gun = d => new Date(d).toISOString().slice(0, 10);
    const son = l.filter(x => x.t > simdi() - 14 * GUN), once = son.filter(x => x.t <= simdi() - 7 * GUN), simdi_ = son.filter(x => x.t > simdi() - 7 * GUN);
    const oran = a => a.length ? (a.reduce((s, x) => s + x.j + x.k, 0) / a.length) : null;
    const o1 = oran(once), o2 = oran(simdi_);
    app.innerHTML = `${ust(t('Okuma raporu'))}<main>
      <article class="kart"><p>${t('Bir sûre aç, ayetin altındaki 🎤 düğmesine dokun ve oku. Yapay zekâ okuyuşunu dinler; kelime kelime harf, hareke, med, ğunne, ihfâ, iklâb, idğâm, şedde ve kalkale hatalarını gösterir.')}</p>
        <p class="soluk kucukyazi">${t('Model telefonda çalışır, ses hiçbir yere gönderilmez. Yapay zekâ yanılabilir; bir hocanın yerini tutmaz.')}</p>
        <button class="btn" data-sekme-git-ic="sureler">${t('Sûre seç ve oku')}</button></article>
      ${top ? `<div class="istatler kart"><div><b>${top}</b><small>${t('okunan ayet')}</small></div><div><b>${yuzdeStr(Math.round(temiz / top * 100))}</b><small>${t('hatasız')}</small></div><div><b>${acik}</b><small>${t('açık hata')}</small></div><div><b>${ince}</b><small>${t('ince hata')}</small></div></div>
        ${o1 != null && o2 != null ? `<p class="fark ${o2 < o1 ? 'yukari' : o2 > o1 ? 'asagi' : ''}">${o2 < o1 ? t('▲ Bu hafta ayet başına hatan azaldı: {0} → {1}', o1.toFixed(1), o2.toFixed(1)) : o2 > o1 ? t('▼ Bu hafta ayet başına hatan arttı: {0} → {1}', o1.toFixed(1), o2.toFixed(1)) : t('● Hata oranın aynı')}</p>` : ''}
        ${enCok.length ? `<h2 class="baslik">${t('En sık hataların')}</h2><article class="kart">${enCok.map(([k, v]) => `<div class="cubuk"><span>${esc(kuralAdi(k))}</span><div class="bar"><div class="kotu" style="width:${Math.round(v / maks * 100)}%"></div></div><b>${v}</b></div>`).join('')}</article>` : ''}
        <h2 class="baslik">${t('Son okumalar')}</h2>
        <div class="tablo">${l.slice(0, 60).map(x => `<button class="kayit" data-git="sure|${x.n}|||${x.a}" style="text-align:left;width:100%;font:inherit;color:inherit"><div><b>${esc(sureNoAdi(x.n))} ${x.a}</b><small>${tarihStr(x.t)}</small>${x.notlar.slice(0, 2).map(z => `<small>• ${metin(z[3])}</small>`).join('')}</div>
          <div class="sag">${!x.j && !x.k ? '<span class="rozet ok">✓</span>' : `${x.j ? `<span class="kirmizi">🔴 ${x.j}</span>` : ''} ${x.k ? `<span class="turuncu">🟠 ${x.k}</span>` : ''}`}</div></button>`).join('')}</div>`
        : `<p class="soluk ortala">${t('Henüz okuma yapmadın.')}</p>`}
    </main>`;
    const g = app.querySelector('[data-sekme-git-ic]'); if (g) g.onclick = () => { ekranYigini = [['sureler', []]]; ciz(); };
  };

  // Sayfa sayfa okuma (Medine mushafı)
  EKRAN.sayfa = function (p) {
    p = Math.min(604, Math.max(1, +p || 1));
    const ay = sayfaAyetleri(p);
    const eksik = benzersiz(ay.map(r => r[0])).filter(n => !SURE(n));
    if (!M.sayfa.length) { app.innerHTML = `${ust(t('Sayfa'))}<main><p class="hata">${t('Sayfa bilgisi yüklenemedi.')}</p></main>`; return; }
    if (eksik.length) {
      app.innerHTML = `${ust(t('Sayfa {0}', p))}<main><p class="soluk">${t('Yükleniyor…')}</p></main>`;
      Promise.all(eksik.map(sureYukle)).then(() => { const ek = ekranYigini[ekranYigini.length - 1]; if (ek[0] === 'sayfa' && +ek[1][0] === p) ciz(); }).catch(() => { app.querySelector('main').innerHTML = `<p class="hata">${t('Sûre açılamadı.')}</p>`; });
      return;
    }
    S.sonSayfa = p; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { }
    const [n0, a0] = ay[0];
    let html = '', onceki = null;
    ay.forEach(([n, a]) => {
      const x = SURE(n);
      if (n !== onceki) { if (onceki !== null) html += '</div>'; if (a === 1) html += `<div class="sure-baslik"><span class="ar">${esc(x.ar)}</span> · ${esc(sureAdi(x))}</div>${n !== 1 && n !== 9 ? `<div class="ayet besmele" dir="rtl" lang="ar">${esc(trBesmele() || window.BESMELE || '')}</div>` : ''}`; html += '<div class="ayet sayfa-metin" dir="rtl" lang="ar">'; onceki = n; }
      const r = `${n}:${a}`; let o = 0;
      html += x.ayet[a - 1].split(' ').map((w, wi) => { const h = `<span class="kelime" data-ses="${kelimeUrl(r, wi + 1)}">${kelimeHTML(r, w, o)}</span>`; o += w.length + 1; return h; }).join(' ') + ` <span class="ayet-no" data-ayet-sayfa="${n}:${a}">﴿${a.toLocaleString('ar-EG')}﴾</span> `;
    });
    html += '</div>';
    const hd = hatimDurum(), hatimSirasi = hd && !hd.bitti && hd.h.sayfa + 1 === p;
    app.innerHTML = `${ust(t('Sayfa {0}', p) + ' · ' + t('Cüz {0}', cuzBul(n0, a0)))}<main>
      <div class="satir" style="margin-bottom:8px"><button class="btn ikincil" data-git-yer="${p + 1}" ${p >= 604 ? 'disabled' : ''}>${t('‹ Sonraki')}</button>
        <input id="sayfaGit" type="number" min="1" max="604" value="${p}" style="width:84px;text-align:center;font:inherit;padding:8px;border-radius:10px;border:1px solid var(--cizgi);background:var(--bg);color:var(--metin)">
        <button class="btn ikincil" data-git-yer="${p - 1}" ${p <= 1 ? 'disabled' : ''}>${t('Önceki ›')}</button></div>
      <article class="kart sayfa-kart">${html}</article>
      <p class="soluk kucukyazi ortala">${t('Ayet numarasına dokununca o ayeti dinlersin; kelimeye dokununca kelimeyi.')}</p>
      ${hatimSirasi ? `<button class="btn genis" id="okudum">${t('✓ Okudum, sonraki sayfa')}</button>` : `<button class="btn genis ikincil" data-git-yer="${p + 1}" ${p >= 604 ? 'disabled' : ''}>${t('Sonraki sayfa ›')}</button>`}
      <div class="bolumler" style="margin-top:12px">${benzersiz(ay.map(r => r[0])).map(n => `<button class="bolum" data-git="sure|${n}"><span class="ikon">🕌</span><span class="bad"><small>${t('Sûre sayfasında aç')}</small>${esc(sureNoAdi(n))}</span><span class="rozet">›</span></button>`).join('')}</div>
    </main>`;
    const yer = q => { ekranYigini[ekranYigini.length - 1] = ['sayfa', [q]]; ciz(); window.scrollTo(0, 0); };
    app.querySelectorAll('[data-git-yer]').forEach(b => b.onclick = () => yer(+b.dataset.gitYer));
    $('#sayfaGit').onchange = e => yer(+e.target.value);
    app.querySelectorAll('[data-ayet-sayfa]').forEach(b => b.onclick = () => { const [n, a] = b.dataset.ayetSayfa.split(':'); cal(ayetUrl(`${n}:${a}`), null, ayetUrl(`${n}:${a}`, KARILER[0].klasor)); });
    const ok = $('#okudum'); if (ok) ok.onclick = () => { S.hatim.sayfa = p; seriGuncelle(); kaydet(); if (p >= 604) { toast(t('Hatmi bitirdin. Allah kabul etsin! 🤲')); ciz(); } else yer(p + 1); };
  };
  let sureCalma = null;
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
          ${bz ? `<button class="lejant-ac" data-benzer="${i + 1}">🔁 ${t('{0} benzer ayet', bz.length)}</button>` : ''}</div>
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
        ${seviye ? `<button class="lejant-ac" id="hepsiniAc">👁️ ${t('Gizlileri göster')}</button>` : ''}
        <div class="canli-kutu"><button class="btn genis" id="canliBasla">🎙️ ${t('Ezberden oku: okudukça açılsın')}</button>
          <p class="soluk kucukyazi">${t('Bütün kelimeler gizlenir; sen okudukça açılır. Okurken uyarı yok; bir ayet bitmeden değerlendirilmez.')}</p>
          <p class="kucukyazi" style="margin:4px 0"><b>${t('Hatalar:')}</b> ${[['ayet', t('Her ayet bitince')], ['son', t('En sonda')]].map(([v, ad]) => `<button class="cip ${(S.ayar.canliSonuc || 'ayet') === v ? 'aktif' : ''}" data-canli-sonuc="${v}">${ad}</button>`).join(' ')}</p></div>
        ${ogrSiniflari().length && girisli() ? `<div class="dinlet-kutu" id="dinletKutu">${dinletHTML()}</div>` : ''}
      </section>`;
    app.innerHTML = `${ust(esc(sureAdi(x)) + ' · <span class="ar" style="font-size:1.3rem">' + esc(x.ar) + '</span>')}<main>
      ${ezberModu ? ezberUst : ''}
      <section class="kart">
        <div class="satir sola"><button class="btn" id="hepsi">${t('▶ Tamamını dinle')}</button>${ezberModu ? '' : `<button class="btn ikincil" data-git="ezberCalis|${n}|yeni|">${t('🧠 Ezberle')}</button>`}</div>
        <p class="soluk kucukyazi" style="margin-top:10px">${t('Her ayeti kaç kez çalsın?')}</p>
        <div class="satir sola">${[1, 3, 5].map(k => `<button class="btn ${tekrar === k ? '' : 'ikincil'}" data-tekrar="${k}">${k}×</button>`).join('')}</div>
        <div class="satir sola"><button class="lejant-ac" id="lejantAc">🎨 ${t('Renklerin anlamı')}</button><button class="lejant-ac" data-git="kariSec">🎙️ ${esc(kari().ad)}</button>${okVar ? `<button class="lejant-ac ${okGoster ? 'aktif' : ''}" id="okunusAc">🔤 ${okGoster ? t('Okunuşu gizle') : t('Okunuşu göster')}</button>` : ''}<button class="lejant-ac ${S.ayar.meal ? 'aktif' : ''}" id="mealAc">📘 ${S.ayar.meal ? t('Meali gizle') : t('Meal')}</button>${ezberModu ? '' : `<button class="lejant-ac" data-git="sureTecvid|${n}|1">🧭 ${t('Ayet ayet tecvid')}</button><button class="lejant-ac" data-git="sureTest|${n}">🔍 ${t('Kural bul testi')}</button>`}</div>
        ${okGoster ? `<p class="soluk kucukyazi">${t('Okunuş yaklaşık bir yazımdır; Arapça harflerin hepsini Latin harfle tam yazmak mümkün değil. Doğru okuyuşu kâriyi dinleyerek öğren.')}</p>` : ''}
        ${mealAcik ? `<p class="soluk kucukyazi">${DIL === 'en' ? t('Meal: Saheeh International (tanzil.net).') : t('Meal: Diyanet İşleri Başkanlığı (tanzil.net). Meal, ayetin anlamını anlamaya yardım eder; Kur\'an\'ın kendisi Arapça metindir.')}</p>` : ''}
        <div id="lejant" hidden>${lejantHTML()}</div>
        ${ezberModu ? '' : `<details class="kural-ara" ${filtre ? 'open' : ''}><summary>${t('Kural ara: sadece bu kuralı renklendir')}</summary>
        <div class="filtre">${LEJANT.filter(([k]) => sayim[k]).map(([k, ad]) => `<button class="${filtre === k ? 'aktif' : ''}" data-filtre="${k}"><i class="tc-${k}"></i>${esc(ad)} <small>${sayim[k]}</small></button>`).join('')}</div>
        ${filtre ? `<p style="margin-top:8px"><b>${t('{0} ayette geçiyor.', gorunen.length)}</b> <button class="link" data-filtre="">${t('Filtreyi kaldır')}</button></p>` : ''}</details>`}
        ${FS() ? `<div id="indirDurum"></div><div class="satir sola">${(() => { const l = indirListesi(kari().klasor, n), v = indirilenSay(l); return v >= l.length ? `<span class="rozet ok">${t('✓ Sesler indirildi')}</span>` : indirme ? '' : `<button class="lejant-ac" id="sureIndir">📥 ${t('Bu sûrenin seslerini indir')} (${v}/${l.length})</button>`; })()}</div>` : ''}
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

  EKRAN.kariSec = function () {
    const ornek = '1:1';
    app.innerHTML = `${ust(t('Kâri seç'))}<main>
      <article class="kart"><p>${t('Örneklerdeki ayetleri hangi kâriden dinlemek istersin? Dinlemek için ▶\'ye, seçmek için isme dokun.')}</p>
      ${benzersiz(KARILER.map(k => k.tur)).map(tur => `<h2 class="baslik">${esc(tur)}</h2><div class="secenek-liste">${KARILER.filter(k => k.tur === tur).map(k => `<button class="${k.id === kari().id ? 'aktif' : ''}" data-kari="${k.id}"><span>${esc(k.ad)}<small>${esc(k.tur)}</small></span>
        <span class="sesbtn ikincil" data-ses="${ayetUrl(ornek, k.klasor)}">▶</span></button>`).join('')}</div>`).join('')}
      <p class="soluk kucukyazi">${t('Sesler everyayah.com arşivinden internet üzerinden çalınır. Kelime kelime dinleme her kâri için Quran.com kaydıyla yapılır.')} ${t('Türk hafızların kayıtları Diyanet İşleri Başkanlığı Kur\'an portalındandır.')}</p></article></main>`;
    app.querySelectorAll('[data-kari]').forEach(b => b.onclick = e => {
      if (e.target.closest('[data-ses]')) return;
      S.ayar.kari = b.dataset.kari; kaydet(); toast(t('Kâri seçildi: ') + kari().ad); ciz();
    });
  };

  EKRAN.profil = function () {
    const k = B() && B().kullanici();
    const gecilen = U.filter(u => gecti(u.id)).length;
    const ezb = Object.values(S.ezber || {}).filter(e => e.tam).length;
    const satir = (git_, ik, baslik, alt) => `<button class="bolum" data-git="${git_}"><span class="ikon">${ik}</span><span class="bad"><small>${alt}</small>${baslik}</span><span class="rozet">›</span></button>`;
    app.innerHTML = `${ust(t('Profil'))}<main>
      <section class="kart profil-ust"><div class="avatar">${k ? esc((k.email || k.displayName || '?')[0].toUpperCase()) : '👤'}</div>
        <div><h2>${esc(AKTIF().ad || (k ? (k.displayName || k.email || '') : t('Misafir')))}</h2><p class="soluk">${k ? t('Verilerin hesabında saklanıyor ☁️') : t('Verilerin sadece bu telefonda')}</p></div></section>
      <div class="istatler kart"><div><b>${gecilen}/${U.length}</b><small>${t('bölüm')}</small></div><div><b>${S.gecmis.length}</b><small>${t('test')}</small></div><div><b>${ezb}</b><small>${t('ezber sûre')}</small></div><div><b>🔥 ${S.seri.gun || 0}</b><small>${t('gün seri')}</small></div></div>
      <div class="bolumler">
        ${satir('yenilikler', '🆕', t('Yenilikler'), esc(surumYazi()))}
        ${satir('profiller', '👥', t('Profiller'), t('{0} profil · şu an: {1}', PR.liste.length, esc(AKTIF().ad || t('Profil 1')) + ' (' + (YAS_AD[AKTIF().yas] || '—') + ')'))}
        ${cocukMu() ? '' : satir('ilerleme', '📊', t('İlerleme tablosu'), t('Bölümler, etkinlik, güçlü ve zayıf konular'))}
        ${cocukMu() ? '' : satir('seviyeTespit', '🧭', t('Seviyeni yeniden belirle'), t('Kısa test; bildiğin bölümleri atla'))}
        ${PR.liste.some(p => p.yas === 'kucuk' || p.yas === 'cocuk') ? satir('ebeveynOzet', '👨‍👩‍👧', t('Çocuk özeti'), t('Haftalık çalışma, yıldızlar, karıştırılan harfler')) : ''}
        ${S.ayar.mesk ? satir('meskSec', '🎓', t('Meşk'), t('Hoca okur, sen tekrar edersin')) : ''}
        ${satir('harfSesleri', '🎙️', t('Harf seslerini kaydet'), t('Hoca sesiyle çocuk modundaki “Dinle” oyunları'))}
        ${satir('hesap', '☁️', k ? t('Hesabım') : t('Giriş yap / Hesap aç'), k ? esc(k.email || '') : t('İlerlemen kaybolmasın'))}
        ${satir('okumaRaporu', '🎤', t('Okuma raporu'), t('Okuyuşundaki hatalar ve gelişimin'))}
        ${satir('sinif', '👨‍🏫', t('Sınıf (hoca–öğrenci)'), ogrSiniflari().length ? ogrSiniflari().map(c => esc(c.sinifAd || c.kod)).join(', ') : t('Katıl ya da sınıf aç'))}
        ${satir('ayarlar', '⚙️', t('Ayarlar'), t('Dil, tema, yazı boyutu, kâri, hatırlatma, yedek'))}
        ${FS() ? satir('indir', '📥', t('İnternetsiz ses'), t('Sesleri telefona indir')) : ''}
      </div></main>`;
  };

  EKRAN.ayarlar = function () {
    const yedek = JSON.stringify(S);
    const hk = B() && B().kullanici();
    const tema = S.ayar.tema || 'sistem';
    const hat = S.ayar.hatirlat || { acik: false, saat: '20:00' };
    app.innerHTML = `${ust(t('Ayarlar'))}<main>
      <article class="kart"><h2>${t('🌐 Dil / Language')}</h2>
        <div class="dil-sec"><button class="btn ${DIL === 'tr' ? '' : 'ikincil'}" data-dil="tr">Türkçe</button><button class="btn ${DIL === 'en' ? '' : 'ikincil'}" data-dil="en">English</button></div></article>
      <article class="kart"><h2>${t('🎨 Görünüm')}</h2>
        <p><b>${t('Tema')}</b></p>
        <div class="satir sola">${[['sistem', t('Telefona göre')], ['acik', t('☀️ Açık')], ['koyu', t('🌙 Koyu')]].map(([v, ad]) => `<button class="btn ${tema === v ? '' : 'ikincil'}" data-tema="${v}">${ad}</button>`).join('')}</div>
        <p style="margin-top:16px"><b>${t('Renk')}</b></p>
        <div class="renkler">${[['yesil', '#0f5a47', t('Yeşil')], ['lacivert', '#1d3f72', t('Lacivert')], ['bordo', '#7a1f2b', t('Bordo')], ['mor', '#4b2a7a', t('Mor')], ['sepya', '#6b4423', t('Sepya')], ['kalem', 'linear-gradient(135deg,#f7f0e4 0 45%,#6e2a3a 45%)', t('Krem-bordo')]].map(([v, c, ad]) => `<button class="${(S.ayar.renk || 'yesil') === v ? 'aktif' : ''}" data-renk="${v}" style="background:${c}" title="${ad}" aria-label="${ad}">${(S.ayar.renk || 'yesil') === v ? '✓' : ''}</button>`).join('')}</div>
        <p style="margin-top:16px"><b>${t('Yazı boyutu')}</b></p>
        <div class="satir sola">${[[0.9, 'A−'], [1, 'A'], [1.15, 'A+'], [1.3, 'A++']].map(([v, ad]) => `<button class="btn ${(S.ayar.yazi || 1) === v ? '' : 'ikincil'}" data-yazi="${v}">${ad}</button>`).join('')}</div>
        <p style="margin-top:12px"><b>${t('Arapça yazı boyutu')}</b></p>
        <div class="satir sola">${[[0.85, '−'], [1, ''], [1.2, '+'], [1.4, '++']].map(([v, ek]) => `<button class="btn ${(S.ayar.arYazi || 1) === v ? '' : 'ikincil'}" data-aryazi="${v}"><span class="ar" style="font-size:1.2em;line-height:1">ع</span>${ek}</button>`).join('')}</div>
        <p style="margin-top:16px"><b>${t('Mushaf yazımı')}</b></p>
        <p class="soluk">${t('Türkiye: Diyanet mushafındaki gibi (med işaretleri, esre-i memdûde, durak işaretleri). Medine: Medine mushafı yazımı.')}</p>
        <div class="satir sola">${[['tr', t('Türkiye (Diyanet)')], ['medine', t('Medine')]].map(([v, ad]) => `<button class="btn ${(S.ayar.yazim || 'tr') === v ? '' : 'ikincil'}" data-yazim="${v}">${ad}</button>`).join('')}</div>
        <p style="margin-top:16px"><b>${t('Renkli tecvid yazısı')}</b></p>
        <p class="soluk">${t('Örnek ayetlerde her tecvid kuralı kendi rengiyle gösterilir. Testlerde renkler cevabı ele vermesin diye cevaptan sonra görünür.')}</p>
        <div class="satir sola"><button class="btn ${S.ayar.renkli ? '' : 'ikincil'}" data-renkli="1">${t('Açık')}</button><button class="btn ${S.ayar.renkli ? 'ikincil' : ''}" data-renkli="0">${t('Kapalı')}</button></div>
        <div class="ayet" dir="rtl" lang="ar" style="margin-top:12px">${['109:3', '96:2'].map(r => kelimeHTMLtam(r)).join(' ۝ ')}</div>
        ${lejantHTML()}</article>
      <article class="kart"><h2>${t('⏰ Günlük hatırlatma')}</h2>
        <p class="soluk">${t('Her gün seçtiğin saatte telefonuna bir hatırlatma gelir. O gün zaten çalıştıysan gelmez.')}</p>
        ${LN() ? `<div class="satir sola"><button class="btn ${hat.acik ? '' : 'ikincil'}" data-hatir="1">${t('Açık')}</button><button class="btn ${hat.acik ? 'ikincil' : ''}" data-hatir="0">${t('Kapalı')}</button>
          <label>${t('Saat:')} <input type="time" id="hatirSaat" value="${esc(hat.saat || '20:00')}" style="font:inherit;padding:8px;border-radius:10px;border:1px solid var(--cizgi);background:var(--bg);color:var(--metin)"></label></div>` : `<p class="soluk kucukyazi">${t('Günlük hatırlatma şimdilik yalnızca Android uygulamasında çalışır.')}</p>`}</article>
      <article class="kart"><h2>${t('🎓 Meşk modu (özel)')}</h2>
        <p class="soluk">${t('Geleneksel meşk usulü: kâri ayeti parça parça okur, sen tekrar edersin, okuyuşun incelenir. Açınca Kur\'an sekmesindeki ayetlerde ve Profil\'de görünür.')}</p>
        <div class="satir sola"><button class="btn ${S.ayar.mesk ? '' : 'ikincil'}" data-mesk="1">${t('Açık')}</button><button class="btn ${S.ayar.mesk ? 'ikincil' : ''}" data-mesk="0">${t('Kapalı')}</button></div>
        ${S.ayar.mesk ? `<p style="margin-top:12px"><b>${t('Her parça kaç kez doğru okunsun?')}</b></p><div class="satir sola">${[1, 3, 5].map(v => `<button class="btn ${(S.ayar.meskTekrar || 3) === v ? '' : 'ikincil'}" data-mtekrar="${v}">${v}</button>`).join('')}</div>` : ''}</article>
      <article class="kart"><h2>${t('🧒 Çocuk modu')}</h2>
        <p><b>${t('Sesli yönerge')}</b></p><p class="soluk">${t('Çocuk modunda yönergeler telefonun sesiyle okunur (okumayı bilmeyen küçükler için).')}</p>
        <div class="satir sola"><button class="btn ${S.ayar.sesliYonerge !== false ? '' : 'ikincil'}" data-sesli="1">${t('Açık')}</button><button class="btn ${S.ayar.sesliYonerge !== false ? 'ikincil' : ''}" data-sesli="0">${t('Kapalı')}</button>
        <button class="btn ikincil" data-git="harfSesleri">${t('🎙️ Harf seslerini kaydet')}</button></div>
        <p style="margin-top:16px"><b>${t('Büyükler PIN\'i')}</b></p><p class="soluk">${window.ebeveynPin && window.ebeveynPin.var() ? t('Büyükler bölümü 4 haneli PIN ile korunuyor. Açınca 5 dakika tekrar sorulmaz.') : t('Henüz PIN yok. Büyükler bölümüne ilk girişte belirlenir.')}</p>
        <div class="satir sola"><button class="btn ikincil" id="pinDegistir">${window.ebeveynPin && window.ebeveynPin.var() ? t('PIN\'i değiştir') : t('PIN belirle')}</button></div></article>
      <article class="kart"><h2>${t('🎯 Günün sorusu')}</h2><p class="soluk">${t('Ana sayfada her gün bir soru. Kapatırsan ana sayfada görünmez.')}</p>
        <div class="satir sola"><button class="btn ${S.ayar.gsGizle ? 'ikincil' : ''}" data-gsgiz="0">${t('Göster')}</button><button class="btn ${S.ayar.gsGizle ? '' : 'ikincil'}" data-gsgiz="1">${t('Gizle')}</button></div></article>
      <article class="kart"><h2>${t('🎙️ Kâri')}</h2><p>${esc(kari().ad)} · <span class="soluk">${esc(kari().tur)}</span></p>
        <div class="satir sola"><button class="btn" data-git="kariSec">${t('Kâri seç')}</button>${FS() ? `<button class="btn ikincil" data-git="indir">${t('📥 İnternetsiz ses')}</button>` : ''}</div></article>
      <article class="kart"><h2>${t('🔊 Ses hızı')}</h2>
        <div class="satir sola">${[0.75, 1, 1.25].map(h => `<button class="btn ${S.ayar.hiz === h ? '' : 'ikincil'}" data-hiz="${h}">${h}×</button>`).join('')}</div></article>
      <article class="kart"><h2>${t('💾 Yedek')}</h2><p>${t('İlerlemen ve geçmişin telefonda saklanır. Uygulamayı silmeden önce ya da yeni bir telefona geçerken yedeğini kopyalayıp bir yere (not, e-posta) kaydet.')}</p>
        <textarea id="yedek" rows="4" readonly aria-label="${t('Yedek verisi')}">${esc(yedek)}</textarea>
        <div class="satir sola"><button class="btn" id="kopyala">${t('Yedeği kopyala')}</button></div>
        <p>${t('Yedeği geri yüklemek için aşağıya yapıştır:')}</p>
        <textarea id="yukle" rows="3" placeholder="${t('Yedeği buraya yapıştır')}"></textarea>
        <div class="satir sola"><button class="btn ikincil" id="geriyukle">${t('Geri yükle')}</button></div></article>
      <article class="kart"><h2>${t('📚 Kaynaklar')}</h2><ul class="kaynak">${KAYNAK.map(k => `<li>${esc(k)}</li>`).join('')}</ul>
        <p class="soluk">${t('Tecvid kulakla öğrenilen bir ilimdir. Bu uygulama bir hocadan ders almanın yerini tutmaz, onu destekler.')}</p></article>
      <article class="kart"><h2>${t('🐞 Hata kaydı')}</h2><p class="soluk">${t('Uygulamada bir sorun olursa burada görünür. Kopyalayıp bize gönderebilirsin.')}</p>
        <textarea id="hataKaydi" rows="4" readonly aria-label="${t('Hata kaydı')}">${esc((() => { try { return JSON.parse(localStorage.getItem('tecvid-ogren.hatalar') || '[]').join('\n') || t('Kayıtlı hata yok.'); } catch (e) { return ''; } })())}</textarea>
        <p class="soluk kucukyazi">${esc(navigator.userAgent)}</p></article>
      <article class="kart"><h2>${t('⚠️ Sıfırla')}</h2><p>${t('Bütün ilerleme ve geçmiş silinir.')}</p><button class="btn tehlike" id="sifirla">${t('Her şeyi sıfırla')}</button></article>
    </main>`;
    app.querySelectorAll('[data-dil]').forEach(b => b.onclick = () => { if (b.dataset.dil === DIL) return; try { localStorage.setItem('tecvid-ogren.dil', b.dataset.dil); } catch (e) { } location.reload(); });
    app.querySelectorAll('[data-tema]').forEach(b => b.onclick = () => { S.ayar.tema = b.dataset.tema; temaUygula(); kaydet(); ciz(); });
    app.querySelectorAll('[data-renk]').forEach(b => b.onclick = () => { S.ayar.renk = b.dataset.renk; temaUygula(); kaydet(); ciz(); });
    app.querySelectorAll('[data-yazi]').forEach(b => b.onclick = () => { S.ayar.yazi = +b.dataset.yazi; temaUygula(); kaydet(); ciz(); });
    app.querySelectorAll('[data-aryazi]').forEach(b => b.onclick = () => { S.ayar.arYazi = +b.dataset.aryazi; temaUygula(); kaydet(); ciz(); });
    app.querySelectorAll('[data-renkli]').forEach(b => b.onclick = () => { S.ayar.renkli = b.dataset.renkli === '1'; kaydet(); ciz(); });
    app.querySelectorAll('[data-yazim]').forEach(b => b.onclick = async () => { S.ayar.yazim = b.dataset.yazim; temaUygula(); kaydet(); trFontYukle(); await Promise.all(Object.keys(KURAN).map(n => trYukle(+n))); ciz(); });
    const hatirAyarla = async (acik, saat) => {
      S.ayar.hatirlat = { acik, saat }; kaydet();
      const ok = await hatirlatmaKur(acik);
      if (acik && LN() && !ok) { S.ayar.hatirlat.acik = false; kaydet(); toast(t('Bildirim izni verilmedi. Telefon ayarlarından Hüsn-i Kıraat için bildirimlere izin ver.')); }
      else if (acik) toast(t('Hatırlatma kuruldu: her gün {0}', saat));
      ciz();
    };
    app.querySelectorAll('[data-hatir]').forEach(b => b.onclick = () => hatirAyarla(b.dataset.hatir === '1', $('#hatirSaat').value || '20:00'));
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
  };
  // ------------------------------------------------------------ günlük hatırlatma (telefon bildirimi)
  // Önümüzdeki 14 gün için her gün seçilen saatte bir bildirim kurulur; bugün çalıştıysan bugünkü atlanır.
  const LN = () => window.capEklenti('LocalNotifications');
  const HATIR_ID = Array.from({ length: 14 }, (_, i) => 7100 + i);
  function hatirlatmaMetni(i) {
    const siradaki = U.find(u => !gecti(u.id));
    const l = [
      t('🔁 Günlük tekrar zamanı. Birkaç soru çöz, öğrendiklerin kalıcı olsun.'),
      siradaki ? t('📖 Sıradaki bölüm: {0}. Bugün 10 dakika ayır.', siradaki.ad) : t('📖 Bir sûre aç, dinle ve renkli tecvidle oku.'),
      t('🔥 Serini bozma! Bugün kısa bir test çöz.'),
      t('🎙️ Bir ayet seç, kâriyi dinle, kendini kaydet ve karşılaştır.'),
    ];
    return l[i % l.length];
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
        bildirimler.push({ id: HATIR_ID[g], title: t('Hüsn-i Kıraat'), body: hatirlatmaMetni(g + new Date().getDate()), schedule: { at, allowWhileIdle: true } });
      }
      if (bildirimler.length) await ln.schedule({ notifications: bildirimler });
      return true;
    } catch (e) { console.warn('hatırlatma', e); return false; }
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
  // Bloklar basitten zora; her blokta 3 soru (örnekte tanıma/uygulama), 2 doğru → blok geçildi; takılınca test biter.
  const SV_BLOK = [
    { ad: () => t('Harfler ve harekeler'), dersler: ['e1', 'u0'], oner: ['m1', 'm2', 'm3'] },
    { ad: () => t('Medler'), dersler: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'], ek: ['x1'] },
    { ad: () => t('Nûn sâkin, tenvin, mîm sâkin, ğunne'), dersler: ['u7', 'u8', 'u9', 'u10', 'u11', 'u12', 'u13'], ek: ['x2'] },
    { ad: () => t('İdğamlar, kalkale, lâm-ı tarif, Allah lafzı, râ'), dersler: ['u14', 'u15', 'u16', 'u17', 'u18'] },
    { ad: () => t('Vakf ve Hafs\'a özel okunuşlar'), dersler: ['u19', 'u20'] },
  ];
  function svSorular(b) {
    const gruplar = karistir(b.dersler.map(unitById).filter(Boolean).map(u => { const l = anahtarlar(u).filter(k => !k.endsWith(':kural')); const iyi = l.filter(k => soruSeviye(k) >= 2); return karistir(iyi.length ? iyi : l); }));
    const l = []; for (let i = 0; l.length < 3 && i < 10; i++) for (const g of gruplar) { if (l.length >= 3) break; if (g[i] && !l.some(x => kokAnahtar(x) === kokAnahtar(g[i]))) l.push(g[i]); }
    return l;
  }
  EKRAN.seviyeTespit = function () {
    app.innerHTML = `${ust(t('🧭 Seni tanıyalım'))}<main>
      <section class="kart"><p>${t('Birkaç kısa soruyla bildiğin konuları bulalım; bildiğin bölümleri atlayıp doğru yerden başlayalım. Puan yok, yanlış yapmak sorun değil.')}</p>
        <ol class="sv-bloklar">${SV_BLOK.map(b => `<li>${esc(b.ad())}</li>`).join('')}</ol>
        <p class="soluk kucukyazi">${t('Her konuda 3 soru. Bilmediğin bir konuya gelince test orada biter. Yaklaşık 5–10 dakika.')}</p>
        <button class="btn genis" id="svBasla">${t('Başlayalım')}</button></section></main>`;
    $('#svBasla').onclick = () => { ekranYigini.pop(); oturumBaslat({ tur: 'seviye', kimlik: 'seviye', baslik: t('Seni tanıyalım'), anahtarlar: svSorular(SV_BLOK[0]), puanli: false, sv: { blok: 0, bas: 0, gecen: 0 } }); };
  };
  function seviyeIleri(o) {
    const n = o.sorular.length;
    if (o.i + 1 < n) { o.i++; oturumSakla(); ciz(); window.scrollTo(0, 0); return; }
    const dogru = o.cevaplar.slice(o.sv.bas).filter(c => c && c.dogru).length, gecti_ = dogru >= Math.ceil((n - o.sv.bas) * 2 / 3);
    if (gecti_) o.sv.gecen = o.sv.blok + 1;
    if (gecti_ && o.sv.blok + 1 < SV_BLOK.length) {
      o.sv.blok++; o.sv.bas = n;
      const yeni = svSorular(SV_BLOK[o.sv.blok]); o.anahtarlar.push(...yeni); o.sorular.push(...yeni.map(soruUret).filter(Boolean));
      o.i++; oturumSakla(); toast(t('Bârekallah! Sonraki konu: {0}', SV_BLOK[o.sv.blok].ad())); ciz(); window.scrollTo(0, 0); return;
    }
    const gecen = o.sv.gecen; oturum = null; oturumSakla();
    seviyeYerlestir(gecen); ekranYigini.pop(); git('seviyeSonuc', gecen);
  }
  // Geçilen blokların derslerini "Atlandı (seviye)" yap; sorularının bir kısmı ileride tekrara düşsün
  function seviyeYerlestir(gecen) {
    SV_BLOK.forEach((b, i) => {
      const atla = i < gecen;
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
    S.ayar.seviye = 'tespit'; S.ayar.seviyeBlok = gecen; kaydet();
  }
  EKRAN.seviyeSonuc = function (gecen) {
    gecen = +gecen || 0; const sir = U.find(u => !gecti(u.id));
    app.innerHTML = `${ust(t('🧭 Seni tanıdık'), false)}<main>
      <section class="kart sv-sonuc"><h2>${sir ? t('Buradan başlıyorsun: {0}', esc(sir.ad)) : t('Maşallah! Bütün konuları biliyorsun.')}</h2>
        ${gecen ? `<p>${t('Bildiğin konular:')}</p><ul>${SV_BLOK.slice(0, gecen).map(b => `<li>✓ ${esc(b.ad())}</li>`).join('')}</ul>
          <p class="soluk kucukyazi">${t('Bu konuların bölümleri "Atlandı" olarak açık kaldı; istediğin zaman çalışabilir, testlerine girebilirsin. Unutmaman için birkaç sorusu ara sıra günlük tekrarda gelecek.')}</p>` : `<p>${t('Baştan, adım adım ilerleyelim. Her bölüm kısa ve kolay.')}</p>`}
        ${gecen ? `<p class="kucukyazi">📍 ${t('Mahreç, sıfat ve karıştırılan harfler bölümleri senin için önerilir; açık kaldı.')}</p>` : ''}
        <div class="satir sola">${sir ? `<button class="btn" data-git="${sir.ara ? 'sinavGiris|' + sir.id : 'ders|' + sir.id}">${t('Başla')}</button>` : ''}${gecen ? `<button class="btn ikincil" id="svGeri">${t('Bir önceki konudan başla')}</button>` : ''}<button class="btn ikincil" id="svAna">${t('Ana sayfa')}</button></div>
      </section>
      ${gecen ? `<section class="kart"><h2>🎙️ ${t('İstersen okuyuşunu da dinleyelim')}</h2><p>${t('Fâtiha\'nın 2. ayetini sesli oku. Yapay zekâ okuyuşunu kontrol eder; çok hata çıkarsa okumayı güçlendiren bölümden başlamanı öneririz.')}</p>
        <div class="ayet" dir="rtl" lang="ar">ٱلۡحَمۡدُ لِلَّهِ رَبِّ ٱلۡعَٰلَمِينَ</div>
        <div class="satir sola"><button class="sesbtn" id="svOku">🎤 ${t('Oku')}</button></div><div id="svOkuSonuc"></div></section>` : ''}
    </main>`;
    const sa = $('#svAna'); if (sa) sa.onclick = () => anaSayfa();
    const sg = $('#svGeri'); if (sg) sg.onclick = () => { seviyeYerlestir(gecen - 1); ekranYigini[ekranYigini.length - 1] = ['seviyeSonuc', [gecen - 1]]; ciz(); };
    const so = $('#svOku'); if (so) so.onclick = () => seviyeOkut(so, gecen);
  };
  let SV_KAYIT = null;
  async function seviyeOkut(btn, gecen) {
    const kutu = $('#svOkuSonuc');
    if (SV_KAYIT) { SV_KAYIT.stop(); return; }
    if (!navigator.mediaDevices || !window.MediaRecorder) return toast(t('Bu cihazda ses kaydı desteklenmiyor.'));
    let O; try { O = await okumaHazirla(); } catch (e) { return toast(e.message); }
    let akis; try { akis = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); } catch (e) { return toast(t('Mikrofon izni verilmedi. Telefon ayarlarından Hüsn-i Kıraat için mikrofona izin ver.')); }
    const parca = [], rec = new MediaRecorder(akis); SV_KAYIT = rec; O.modelAc().catch(() => { });
    btn.textContent = t('⏹ Bitir'); btn.classList.add('kirmizi-btn', 'kaydediyor'); kutu.innerHTML = `<p class="soluk">${t('🎙️ Dinliyorum… Ayeti oku, bitince "Bitir"e dokun.')}</p>`;
    const z = setTimeout(() => rec.state !== 'inactive' && rec.stop(), 15000);
    rec.ondataavailable = e => { if (e.data && e.data.size) parca.push(e.data); };
    rec.onstop = async () => {
      clearTimeout(z); akis.getTracks().forEach(x => x.stop()); SV_KAYIT = null;
      btn.textContent = '🎤 ' + t('Tekrar oku'); btn.classList.remove('kirmizi-btn', 'kaydediyor'); kutu.innerHTML = `<p class="soluk">${t('Kontrol ediliyor…')}</p>`;
      try {
        const s = await O.ayetRaporu(1, 2, new Blob(parca, { type: rec.mimeType || 'audio/webm' }));
        const j = s.kelimeler.filter(w => w.notes.some(z_ => z_.severity === 'jali')).length;
        kutu.innerHTML = raporHTML(1, 2, s) + (j >= 2 ? `<p><b>${t('Okumanı güçlendirmek için "Harekeler ve işaretler" bölümünden başlamanı öneririz.')}</b></p><button class="btn" id="svOkumadan">${t('Okumayı güçlendirerek başla')}</button>`
          : `<p><b>${t('Okuyuşun iyi görünüyor. Yerleştirme uygun.')}</b></p>`);
        const ob = $('#svOkumadan'); if (ob) ob.onclick = () => { delete S.ilerleme.u0; seviyeYerlestirOkuma(); kaydet(); git('ders', 'u0'); };
      } catch (e) { kutu.innerHTML = `<p class="hata">${esc(e.message || t('Kontrol edilemedi.'))}</p>`; }
    };
    rec.start();
  }
  function seviyeYerlestirOkuma() { ['u0', 'm1', 'm2', 'm3'].forEach(id => { const il = S.ilerleme[id]; if (il && il.atla) delete S.ilerleme[id]; }); }
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
        </div></main>`;
      const kendim = sv => { const atla = { sifir: [], harf: ['e1'], okur: ['e1', 'u0'] }[sv];
        atla.forEach(id => { if (!gecti(id)) S.ilerleme[id] = { en: 0, deneme: 0, gecti: true, atla: true }; });
        S.ayar.seviye = sv; kaydet(); anaSayfa(); };
      app.querySelectorAll('[data-sv]').forEach(b => b.onclick = () => {
        const sv = b.dataset.sv; if (sv === 'sifir') return kendim(sv);
        app.querySelector('main').innerHTML = `<p>${t('Bildiğin konuları kısa bir testle bulalım mı? Böylece bildiğin bölümleri atlarsın.')}</p>
          <div class="yas-kartlar"><button class="yas-kart" id="svTest"><span>🧭</span><b>${t('Seni tanıyalım')}</b><small>${t('5–10 dakikalık kısa test (önerilir)')}</small></button>
          <button class="yas-kart" id="svKendim"><span>✋</span><b>${t('Kendim seçeyim')}</b><small>${sv === 'okur' ? t('Doğrudan tecvid konularına geç') : t('Harekeler ve işaretlerle başla')}</small></button></div>`;
        $('#svKendim').onclick = () => kendim(sv);
        $('#svTest').onclick = () => { S.ayar.seviye = sv; kaydet(); ekranYigini = [[evKok(), []], ['seviyeTespit', []]]; ciz(); };
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
      <p class="soluk kucukyazi">${t('Hesaba giriş yaptıysan profiller hesabında da saklanır. Profil değiştirince uygulama yeniden açılır.')}</p></main>`;
    const yenile = d => { ekranYigini[ekranYigini.length - 1] = ['profiller', [d]]; ciz(); };
    app.querySelectorAll('[data-duz]').forEach(b => b.onclick = () => yenile(duzenle === b.dataset.duz ? undefined : b.dataset.duz));
    app.querySelectorAll('[data-gec]').forEach(b => b.onclick = () => profilDegistir(b.dataset.gec));
    app.querySelectorAll('[data-fy]').forEach(b => b.onclick = () => { b.parentNode.querySelectorAll('button').forEach(x => x.classList.toggle('aktif', x === b)); });
    app.querySelectorAll('[data-kaydet]').forEach(b => b.onclick = () => {
      const f = b.closest('[data-form]'), ad = f.querySelector('.fAd').value.trim().slice(0, 20), yb = f.querySelector('[data-fy].aktif');
      if (!yb) { toast(t('Yaş grubunu seç.')); return; }
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
      const kesinlestir = () => {
        PR.silinen = (PR.silinen || []).concat([{ id: p.id, silindi: true, d: Date.now() }]);
        try { localStorage.removeItem(anahtar); } catch (e) { }
        profilKaydet(); profilleriEsitle(); if (girisli() && B().profilSil) B().profilSil(p.id).catch(() => { });
      };
      PR.liste = PR.liste.filter(x => x !== p);
      if (aktifMi) { kesinlestir(); profilDegistir(PR.liste[0].id); return; }
      profilKaydet(); yenile();
      geriAlToast(t('“{0}” silindi.', ad), () => { PR.liste.splice(sira, 0, p); profilKaydet(); if (ekranYigini[ekranYigini.length - 1][0] === 'profiller') yenile(); toast(t('Geri alındı ✓')); }, kesinlestir);
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
    d.innerHTML = `<div class="acilis-ic"><img class="acilis-logo" src="icons/icon-512.png" alt=""><h1>${t('Hüsn-i Kıraat')}</h1>
      <p class="acilis-ar" dir="rtl" lang="ar">${HADIS_AR}</p><p class="acilis-tr">${hadisMetni()}</p><p class="acilis-kaynak">${hadisKaynak()}</p>
      <p class="acilis-dokun">${t('Devam etmek için dokun')}</p></div>`;
    document.body.appendChild(d);
    const kapat = () => { if (!d.isConnected) return; d.classList.add('gizlen'); setTimeout(() => d.remove(), 450); };
    d.onclick = kapat; setTimeout(kapat, kisa ? 1000 : 2600);
  }
  // Çocuk modu (cocuk.js) bağlanır
  const COCUK = window.CocukModu ? window.CocukModu({ EKRAN, git, anaSayfa, ust, kaydet, bugun, seriGuncelle, toast, S: () => S, profil: AKTIF, ciz: () => ciz(), ekranDegistir, buyugeGec: s_ => buyugeGec(s_), sureSes: n => sureSesDurum(n), ayetCal: (r, btn, bitince) => cal(ayetUrl(r, 'Husary_Muallim_128kbps'), btn, undefined, bitince), odevler: () => cocukOdevleri(), kelimeCal: (r, w, btn) => cal(kelimeUrl(r, w), btn) }) : null;
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
      Object.assign(STC, { r, acik: !sec, q: sec ? soruUret(`k:${n}:${a}:${sec.idx}`) : null, cevap: null });
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
      <article class="kart stc-kart">${ayet}
        ${OKU[r] && okunusAcik() ? `<p class="okunus">🗣️ ${esc(OKU[r])}</p>` : ''}
        <div class="sesler"><button class="sesbtn" data-ses="${ayetUrl(r)}" data-yedek="${ayetUrl(r, KARILER[0].klasor)}">${t('▶ Ayeti dinle')}</button>${OKU[r] ? `<button class="lejant-ac ${okunusAcik() ? 'aktif' : ''}" id="stcOkunus">🔤 ${okunusAcik() ? t('Okunuşu gizle') : t('Okunuşu göster')}</button>` : ''}</div></article>
      ${q && !STC.acik ? `<section class="kart cevap-sende"><p class="cs-baslik">${t('🎯 Cevap sende')}</p>${q.ust}<p><b>${q.soru}</b></p>
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
      <article class="kart stc-giris"><p>${t('Bir sûre seç, ayet ayet ilerle: önce dinle, sonra <b>cevap sende</b> sorusuyla kuralı sen bul, ardından ayetteki bütün tecvid kurallarını kelime kelime gör ve dinle.')}</p></article>
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
      const cal_ = () => { arkaArka(l, sp); if (l.kelime) toast(t('Kur\'an\'dan: {0}', l.kelime)); };
      sp.onclick = cal_; sp.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cal_(); } };
    });
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
    app.querySelectorAll('[data-mh]').forEach(b => b.addEventListener('click', () => {
      app.querySelectorAll('.mh-harf.secili').forEach(x => x.classList.remove('secili')); b.classList.add('secili');
      const h = b.dataset.mh, [r, w, k] = M.kelime(i, h), kutu = $('#mhOku'); kutu.hidden = false;
      kutu.innerHTML = `<p><b class="ar mh-kelime">${k}</b></p><div class="satir sola"><button class="sesbtn" data-ses="${kelimeUrl(r, w)}">▶ ${t('Tekrar dinle')}</button><button class="sesbtn" id="mhSenOku">🎤 ${t('Sen oku')}</button></div><div id="mhSonuc"></div>`;
      $('#mhSenOku').onclick = () => mahrecOkut(h, r, w, $('#mhSenOku'));
    }));
  }
  let MH_KAYIT = null;
  async function mahrecOkut(h, r, w, btn) {
    const sonuc = $('#mhSonuc');
    if (MH_KAYIT) { MH_KAYIT.stop(); return; }
    if (!navigator.mediaDevices || !window.MediaRecorder) return toast(t('Bu cihazda ses kaydı desteklenmiyor.'));
    let O; try { O = await okumaHazirla(); } catch (e) { return toast(e.message); }
    let akis; try { akis = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); } catch (e) { return toast(t('Mikrofon izni verilmedi. Telefon ayarlarından Hüsn-i Kıraat için mikrofona izin ver.')); }
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
    else if (k.tip === 'soru') { const q = HK.q; ic = `<p class="cs-baslik">${t('🎯 Cevap sende')}</p><p><b>${q.soru}</b></p><div class="secenekler">${q.secenek.map((s, j) => `<button class="secenek ${HK.cevap ? (s === q.dogru ? 'dogru' : HK.cevap.sec === j ? 'yanlis' : '') : ''}" data-hks="${j}" ${HK.cevap ? 'disabled' : ''}>${metin(s)}</button>`).join('')}</div>${HK.cevap ? HK.cevap.html : ''}`; }
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
    const d = $('#meskDinle'); if (d) d.onclick = () => { MESK.dinlendi = true; d.closest('li').classList.add('tamam'); tam ? cal(ayetUrl(r, 'Husary_Muallim_128kbps'), d) : arkaArka(w.slice(i, j + 1).map((_, q) => kelimeUrl(r, i + q + 1)), d); };
    const sn = $('#meskSonraki'); if (sn) sn.onclick = () => ekranDegistir('mesk', n, a + 1);
    const bb = $('#meskBastan'); if (bb) bb.onclick = () => { Object.assign(MESK, { p: 0, dogru: 0, sonuc: null, dinlendi: false }); ciz(); };
    const ok = $('#meskOku'); if (!ok) return;
    ok.onclick = async () => {
      if (MESK.kayit) { MESK.kayit.state !== 'inactive' && MESK.kayit.stop(); return; }
      if (!navigator.mediaDevices || !window.MediaRecorder) return toast(t('Bu cihazda ses kaydı desteklenmiyor.'));
      let O; try { O = await okumaHazirla(); } catch (e) { return toast(e.message); }
      let akis; try { akis = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { return toast(t('Mikrofon izni verilmedi. Telefon ayarlarından Hüsn-i Kıraat için mikrofona izin ver.')); }
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
    else if (a.tur === 'kuran') { GUNLUK_ADIM = { i, ekran: 'sayfa' }; git('sayfa', S.sonSayfa || 1); }
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
    const g = gunlukPlan(), b = g.adimlar.filter(a => a.bitti).length, n = g.adimlar.length, tamam = n && b === n;
    return `<section class="gunluk-kart ${tamam ? 'tamam' : ''}" data-git="gunluk" role="button"><div class="gunluk-ust"><span class="gunluk-ikon">${tamam ? '✅' : '📅'}</span>
      <div><b>${t('Bugünkü dersim')}</b><small>${tamam ? t('Bugünkü dersin tamam. Bârekallah!') : t('≈{0} dk · {1}/{2} adım', g.dk, b, n)}</small></div><span class="gunluk-ok">›</span></div>
      <div class="pano-cubuk"><div style="width:${n ? Math.round(b / n * 100) : 0}%"></div></div></section>`;
  }
  EKRAN.gunluk = function () {
    const g = gunlukPlan(), b = g.adimlar.filter(a => a.bitti).length, n = g.adimlar.length, tamam = n && b === n;
    const siradaki = g.adimlar.findIndex(a => !a.bitti);
    app.innerHTML = `${ust(t('Bugünkü dersim'))}<main>
      <section class="pano-ust"><div class="halka buyuk" style="--p:${n ? Math.round(b / n * 100) : 0}"><b>${b}/${n}</b><small>${t('adım')}</small></div>
        <div><small class="soluk">${t('Günlük hedef')}</small><h2>${t('{0} dakika', g.dk)}</h2><p class="soluk">${tamam ? t('Bugünkü dersin tamam. Yarın görüşürüz!') : t('Adımları sırayla yap; her biri birkaç dakika sürer.')}</p></div></section>
      <div class="cipler">${[10, 20, 30].map(d => `<button class="${g.dk === d ? 'aktif' : ''}" data-hedef="${d}">${t('{0} dk', d)}</button>`).join('')}</div>
      <div class="gunluk-adimlar">${g.adimlar.map((a, i) => `<button class="gunluk-adim ${a.bitti ? 'bitti' : i === siradaki ? 'simdi' : ''}" data-adim="${i}" ${a.bitti ? 'disabled' : ''}>
        <span class="gunluk-no">${a.bitti ? '✓' : i + 1}</span><span>${gunlukAdimAd(a)}</span></button>`).join('')}</div>
      ${tamam ? mujdeHTML(new Date().getDate(), t('Bugünkü dersini tamamladın. Bârekallah!')) : `<button class="btn genis c-btn" data-adim="${siradaki}">${b ? t('▶ Devam et') : t('▶ Başla')}</button>`}
      ${!n ? `<p class="soluk">${t('Bugün için plan yok. Testler bölümünden istediğin testi çözebilirsin.')}</p>` : ''}
    </main>`;
    app.querySelectorAll('[data-adim]').forEach(x => x.onclick = () => gunlukAdimBaslat(+x.dataset.adim));
    app.querySelectorAll('[data-hedef]').forEach(x => x.onclick = () => { S.ayar.hedefDk = +x.dataset.hedef; gunlukPlan(true); ciz(); });
    if (tamam && g.tamamZaman && simdi() - g.tamamZaman < 8000 && window.Konfeti) { g.tamamZaman = 0; kaydet(); setTimeout(() => window.Konfeti.kutla(), 200); }
  };

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
    const kur = async () => { S.ayar.haftaOzet = { acik: ho.checked, saat: hs.value || '19:00' }; kaydet(); const ok = await haftaOzetKur(true); if (ho.checked && !ok) { ho.checked = false; S.ayar.haftaOzet.acik = false; kaydet(); toast(t('Bildirim izni verilmedi. Telefon ayarlarından Hüsn-i Kıraat için bildirimlere izin ver.')); } else if (ho.checked) toast(t('Tamam, her pazar {0}\'de hatırlatacağım.', hs.value)); };
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
      for (let i = 0; i < 4; i++) { const z = new Date(at); z.setDate(z.getDate() + 7 * i); l.push({ id: HAFTA_ID[i], title: t('Hüsn-i Kıraat'), body: t('📊 Haftalık çocuk özeti hazır. Bu hafta neler öğrendiklerine birlikte bakın.'), schedule: { at: z, allowWhileIdle: true }, extra: { git: 'ebeveynOzet' } }); }
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
      ['📖', t('Tecvid'), t('Bölümler sırayla açılır; biliyorsan doğrudan teste gir.'), 'mufredat'],
      ['🕌', t('Kur\'an'), t('Renkli tecvid, kâri sesi ve yapay zekâ okuma kontrolü.'), 'sureler'],
      ['🧭', t('Sûre sûre tecvid'), t('Ayet ayet: önce sen bul, sonra öğren.'), 'sureTecvidSec']];
    return `<section class="kart tanitim"><h2>${t('👋 Hoş geldin! Uygulamada neler var?')}</h2>
      <div class="tanitim-izgara">${k.map(([ik, ad, ac, g]) => `<button data-git="${g}"><span>${ik}</span><b>${ad}</b><small>${ac}</small></button>`).join('')}</div>
      <p class="soluk kucukyazi">${t('Ezber, testler, ayarlar ve sınıf alttaki menüde.')}</p>
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
  window.__TECVID = { git: (...a) => git(...a), ana: () => anaSayfa(), S: () => S, PR: () => PR, COCUK, mujdeHTML, soruUret, anahtarlar, dogru: () => oturum && oturum.sorular[oturum.i] && oturum.sorular[oturum.i].dogru, U, kaydet: v => { S = v; kaydet(); anaSayfa(); } }; // test için
})();

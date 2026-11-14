/* Tecvid Öğren — uygulama motoru (çevrimdışı çalışır, veriler telefonda ve hesapta saklanır) */
(function () {
  'use strict';
  const { R, U, KAYNAK } = window.TC;
  const AYAH = window.AYAH, RENK = window.TECVID_RENK || {};
  (window.SURELER || []).forEach(x => x.ayet.forEach((a, i) => { AYAH[`${x.n}:${i + 1}`] = a; }));
  const t = window.t, DIL = window.DIL;
  const GECME = 80;                       // bölüm/ara sınav geçme yüzdesi
  const ARALIK = [0, 1, 2, 4, 8, 16, 32]; // kutu → gün (aralıklı tekrar)
  const KEY = 'tecvid-ogren.v1';
  const $ = (s, el = document) => el.querySelector(s);
  const app = $('#app');

  // ------------------------------------------------------------ kâriler (everyayah.com klasör adları doğrulandı)
  const KARILER = [
    { id: 'husary_muallim', klasor: 'Husary_Muallim_128kbps', ad: DIL === 'en' ? 'Mahmoud Khalil al-Husary' : 'Mahmûd Halîl el-Husarî', tur: t('Öğretim (yavaş, tekrar için)') },
    { id: 'minshawy_teacher', klasor: 'Minshawy_Teacher_128kbps', ad: DIL === 'en' ? 'Muhammad Siddiq al-Minshawi' : 'Muhammed Sıddîk el-Minşâvî', tur: t('Öğretim (yavaş, tekrar için)') },
    { id: 'husary', klasor: 'Husary_128kbps', ad: DIL === 'en' ? 'Mahmoud Khalil al-Husary' : 'Mahmûd Halîl el-Husarî', tur: t('Mürettel') },
    { id: 'minshawy', klasor: 'Minshawy_Murattal_128kbps', ad: DIL === 'en' ? 'Muhammad Siddiq al-Minshawi' : 'Muhammed Sıddîk el-Minşâvî', tur: t('Mürettel') },
    { id: 'abdulbasit', klasor: 'Abdul_Basit_Murattal_192kbps', ad: DIL === 'en' ? 'Abdul Basit Abdus-Samad' : 'Abdülbâsıt Abdüssamed', tur: t('Mürettel') },
    { id: 'alafasy', klasor: 'Alafasy_128kbps', ad: DIL === 'en' ? 'Mishary Rashid Alafasy' : 'Mişârî Râşid el-Afâsî', tur: t('Mürettel') },
    { id: 'sudais', klasor: 'Abdurrahmaan_As-Sudais_192kbps', ad: DIL === 'en' ? 'Abdur-Rahman as-Sudais' : 'Abdurrahman es-Sudeys', tur: t('Mürettel') },
    { id: 'maher', klasor: 'MaherAlMuaiqly128kbps', ad: DIL === 'en' ? 'Maher al-Muaiqly' : 'Mâhir el-Muaykılî', tur: t('Mürettel') },
    { id: 'ghamadi', klasor: 'Ghamadi_40kbps', ad: DIL === 'en' ? 'Saad al-Ghamdi' : 'Sa‘d el-Gâmidî', tur: t('Mürettel') },
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
  function temaUygula() { const h = document.documentElement; h.dataset.tema = S.ayar.tema || 'sistem'; h.style.fontSize = Math.round((S.ayar.yazi || 1) * 100) + '%'; h.style.setProperty('--ar-olcek', S.ayar.arYazi || 1); try { localStorage.setItem('tecvid-ogren.tema', S.ayar.tema || 'sistem'); } catch (e) { } }
  temaUygula();

  // ------------------------------------------------------------ bulut eşitleme
  const B = () => window.Bulut;
  const girisli = () => !!(B() && B().kullanici());
  function birlestir(a, b) {
    const r = bos(); r.ayar = Object.assign({}, bos().ayar, b.ayar, a.ayar);
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
    r.hesapUyariKapali = a.hesapUyariKapali || b.hesapUyariKapali;
    r.sinif = 'sinif' in a ? a.sinif : b.sinif || null;
    r.sure = {}; for (const n of new Set([...Object.keys(a.sure || {}), ...Object.keys(b.sure || {})])) { const x = (a.sure || {})[n] || {}, y = (b.sure || {})[n] || {}; r.sure[n] = { en: Math.max(x.en || 0, y.en || 0) || null, dinlendi: Math.max(x.dinlendi || 0, y.dinlendi || 0) || null }; }
    return r;
  }
  async function buluta() {
    if (!girisli() || esitleniyor) return;
    esitleniyor = true;
    try {
      const uzak = await B().indir();
      if (uzak && (uzak.degisti || 0) > (S.degisti || 0) - 1) { S = birlestir(S, Object.assign(bos(), uzak)); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
      await B().yukle(S); sonEsitleme = Date.now(); ozetiGonder();
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
      await B().yukle(S); sonEsitleme = Date.now(); temaUygula(); ozetiGonder();
      if (!sessiz) toast(t('Verilerin hesabınla eşitlendi ✓'));
    } catch (e) { if (!sessiz) toast(t('Eşitlenemedi: ') + (e.message || t('internet bağlantısı yok'))); }
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
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { esitle(true); if (typeof hatirlatmaKur === 'function') hatirlatmaKur(false); } });

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
  // Metindeki Arapça parçaları mushaf yazı tipiyle göster
  const metin = s => esc(s).replace(/[؀-ۿݐ-ݿࢠ-ࣿ∴]+(?:[\s ]+[؀-ۿݐ-ݿࢠ-ࣿ∴]+)*/g, m => `<span class="ar">${m}</span>`);
  function toast(m) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = m; document.body.appendChild(d); setTimeout(() => d.remove(), 2600); }
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
  const ayetUrl = (r, klasor) => { const [s, a] = r.split(':').map(Number); return `https://everyayah.com/data/${klasor || kari().klasor}/${pad(s)}${pad(a)}.mp3`; };
  const kelimeUrl = (r, w) => { const [s, a] = r.split(':').map(Number); return `https://audio.qurancdn.com/wbw/${pad(s)}_${pad(a)}_${pad(w)}.mp3`; };
  let ses = null;
  function cal(url, btn, yedekUrl) {
    if (ses) { ses.pause(); document.querySelectorAll('.caliyor').forEach(b => b.classList.remove('caliyor')); }
    if (ses && ses._url === url && !ses._bitti) { ses = null; return; }
    ses = new Audio(sesKaynak(url)); ses._url = url; ses.playbackRate = S.ayar.hiz || 1;
    btn && btn.classList.add('caliyor');
    const hata = () => {
      btn && btn.classList.remove('caliyor');
      // Seçilen kârinin kaydı bulunamazsa Husarî (öğretim) ile çal
      if (yedekUrl && yedekUrl !== url && navigator.onLine !== false) { toast(t('Bu kârinin kaydı açılamadı; Husarî ile çalınıyor.')); ses = null; cal(yedekUrl, btn); return; }
      toast(t('Ses çalınamadı. İnternet bağlantını kontrol et.'));
    };
    ses.onended = () => { ses._bitti = true; btn && btn.classList.remove('caliyor'); };
    ses.onerror = hata;
    ses.play().catch(e => { if (e && e.name === 'NotAllowedError') { btn && btn.classList.remove('caliyor'); return; } hata(); });
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
  const FS = () => { const C = window.Capacitor; return C && C.isNativePlatform && C.isNativePlatform() ? C.registerPlugin('Filesystem') : null; };
  const yerelYol = url => {
    let m = /everyayah\.com\/data\/([^/]+)\/(\d+\.mp3)$/.exec(url || ''); if (m) return `ea/${m[1]}/${m[2]}`;
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
      <button class="sesbtn" data-karsilastir="${anahtar}" data-kari-url="${kariUrl}">${t('🔁 Karşılaştır')}</button>` : ''}
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
    catch (e) { return toast(t('Mikrofon izni verilmedi. Telefon ayarlarından Tecvid Öğren için mikrofona izin ver.')); }
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
    if (ses) { ses.pause(); ses = null; }
    let i = 0; btn && btn.classList.add('caliyor');
    const sonraki = () => {
      if (i >= urls.length) { btn && btn.classList.remove('caliyor'); ses = null; return; }
      ses = new Audio(sesKaynak(urls[i++])); ses.playbackRate = S.ayar.hiz || 1;
      ses.onended = () => setTimeout(sonraki, 600);
      ses.onerror = () => { btn && btn.classList.remove('caliyor'); toast(t('Ses çalınamadı. İnternet bağlantını kontrol et.')); };
      ses.play().catch(() => btn && btn.classList.remove('caliyor'));
    };
    sonraki();
  }
  document.addEventListener('click', e => {
    const bas = e.target.closest('[data-kayit-bas]'); if (bas) { e.preventDefault(); return kayitBaslat(bas.dataset.kayitBas, bas.closest('.kart').querySelector('[data-yedek]') ? bas.closest('.kart').querySelector('[data-yedek]').dataset.ses : ''); }
    const dur = e.target.closest('[data-kayit-dur]'); if (dur) { e.preventDefault(); return kayitDurdur(); }
    const kar = e.target.closest('[data-karsilastir]'); if (kar) { e.preventDefault(); const a = kar.dataset.karsilastir; return arkaArka([kar.dataset.kariUrl, KAYIT[a]].filter(Boolean), kar); }
  });

  // ------------------------------------------------------------ ayet gösterimi (renkli tecvid)
  function kelimeHTML(r, kelime, bas) {
    const f = kelimeHTML.filtre;
    let etiket = f || (S.ayar.renkli && !kelimeHTML.renksiz) ? RENK[r] : null;
    if (etiket && f) etiket = etiket.filter(e => e[2] === f);
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
    if (SURE(n)) return SURE(n);
    const x = await (await fetch(`kuran/${pad(n)}.json`)).json();
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
    if (tur === 'zayif') return t('Zayıf konular testi');
    if (tur === 'karma') return t('Karma test ({0} bölüm, {1} soru)', a, b);
    return h.baslik;
  }

  // ------------------------------------------------------------ yönlendirme
  let ekranYigini = [];
  function git(ad, ...arg) { ekranYigini.push([ad, arg]); ciz(); window.scrollTo(0, 0); }
  function geri() { if (oturum && !oturum.bitti && !confirm(t('Testten çıkmak istiyor musun? Bu test kaydedilmez.'))) return; oturum = null; if (ekranYigini.length > 1) ekranYigini.pop(); ciz(); window.scrollTo(0, 0); }
  function anaSayfa() { oturum = null; ekranYigini = [['ana', []]]; ciz(); window.scrollTo(0, 0); }
  function ciz() {
    if (kayitci) kayitDurdur();
    const [ad, arg] = ekranYigini[ekranYigini.length - 1];
    // Ekran değişince sûrenin "tamamını dinle" çalması dursun
    const anahtar = ad + '|' + JSON.stringify(arg);
    if (sureCalma && anahtar !== ciz.son) { sureCalma.iptal = true; sureCalma = null; if (ses) { ses.pause(); ses = null; } }
    ciz.son = anahtar;
    EKRAN[ad](...arg);
  }
  window.addEventListener('popstate', () => { geri(); history.pushState(null, ''); });
  history.pushState(null, '');
  try {
    const Cap = window.Capacitor; const CapApp = Cap && Cap.isNativePlatform && Cap.isNativePlatform() ? Cap.registerPlugin('App') : null;
    if (CapApp) CapApp.addListener('backButton', () => { if (ekranYigini.length > 1) geri(); else CapApp.exitApp(); });
  } catch (e) { /* tarayıcıda yok */ }

  const ust = (baslik, geriVar = true, sag = '') => `<header class="ust">${geriVar ? `<button class="geri" data-git="geri" aria-label="${t('Geri')}">‹</button>` : '<span class="logo">۞</span>'}<h1>${baslik}</h1>${sag}</header>`;
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
      <ol style="padding-left:20px;margin:6px 0"><li>${t('Safari\'de <b>Paylaş</b> düğmesine dokun (kare ve yukarı ok; görmüyorsan önce <b>⋯</b> düğmesine dokun).')}</li><li>${t('<b>Ana Ekrana Ekle</b>\'yi seç, sonra <b>Ekle</b>\'ye dokun.')}</li><li>${t('Artık ana ekrandaki <b>Tecvid</b> simgesinden aç.')}</li></ol>
      <p class="soluk kucukyazi">${t('Ana ekrandan açınca tam ekran çalışır ve dersler internetsiz de açılır.')}</p></div>
      <div class="satir sola"><button class="btn ikincil" id="iosKapat">${t('Tamam')}</button></div></section>`;
  }

  EKRAN.ana = function () {
    const toplam = U.length, gecilen = U.filter(u => gecti(u.id)).length;
    const vade = vadesiGelenler().length;
    const siradaki = U.find(u => !gecti(u.id));
    let liste = '';
    U.forEach(u => {
      const acik = acikMi(u), ok = gecti(u.id), il = S.ilerleme[u.id];
      const durum = ok ? `<span class="rozet ok">✓ ${yuzdeStr(il.en)}</span>` : acik ? `<span class="rozet simdi">${t('Şimdi')}</span>` : `<span class="rozet kilit">🔒</span>`;
      liste += `<button class="bolum ${acik ? '' : 'kilitli'} ${u.ara ? 'ara' : ''}" data-git="${u.ara ? 'sinavGiris|' + u.id : 'ders|' + u.id}">
        <span class="ikon">${u.ikon}</span><span class="bad"><small>${u.ara ? (u.final ? t('Final') : t('Ara sınav')) : t('Bölüm {0}', dersler.indexOf(u))}</small>${esc(u.ad)}</span>${durum}</button>`;
    });
    const k = B() && B().kullanici();
    const hesapUyari = B() && B().hazir && !k && !S.hesapUyariKapali;
    app.innerHTML = `${ust(t('Tecvid Öğren'), false, `<button class="hesapbtn" data-git="hesap" aria-label="${t('Hesap')}">${k ? '👤' : t('Giriş')}</button>`)}
      <main>
        <section class="kart ozet">
          <div class="halka" style="--p:${Math.round(gecilen / toplam * 100)}"><b>${gecilen}/${toplam}</b><small>${t('tamam')}</small></div>
          <div><p class="buyukyazi">${siradaki ? t('Sıradaki: ') + esc(siradaki.ad) : t('Maşallah! Bütün müfredatı bitirdin. 🎉')}</p>
          <p class="soluk">${t('🔥 {0} günlük seri', S.seri.gun || 0)}</p>
          ${siradaki ? `<button class="btn" data-git="${siradaki.ara ? 'sinavGiris|' + siradaki.id : 'ders|' + siradaki.id}">${t('Devam et')}</button>` : ''}</div>
        </section>
        ${iosKurKarti()}
        <div id="odevYer"></div>
        <section class="kart tekrar ${vade ? 'vurgulu' : ''}">
          <div><h2>${t('🔁 Günlük tekrar')}</h2><p>${vade ? t('<b>{0}</b> soru tekrar zamanı geldi. Unutmamak için şimdi çöz.', vade) : t('Şu an tekrar bekleyen soru yok. Harika!')}</p></div>
          ${vade ? `<button class="btn" data-git="tekrarBasla">${t('Başla')}</button>` : ''}
        </section>
        <section class="kart tekrar">
          <div><h2>${t('📖 Kur\'an-ı Kerîm')}</h2><p>${t('114 sûre renkli tecvidle: oku, dinle, kural ara, tekrar et, kendini kaydet.')}</p></div>
          <button class="btn" data-git="sureler">${t('Aç')}</button>
        </section>
        <nav class="hizli">
          <button data-git="testler">📝<span>${t('Testler')}</span></button>
          <button data-git="gecmis">📈<span>${t('Geçmiş')}</span></button>
          <button data-git="zayif">🎯<span>${t('Zayıf konular')}</span></button>
          <button data-git="ayarlar">⚙️<span>${t('Ayarlar')}</span></button>
        </nav>
        ${hesapUyari ? `<section class="kart hesap-uyari" style="margin-top:14px"><div><h2>${t('☁️ İlerlemen kaybolmasın')}</h2><p>${t('Giriş yap; puanların, geçmişin ve kilitler hesabında saklansın, başka telefonda da devam et.')}</p></div>
          <div class="satir sola"><button class="btn" data-git="hesap">${t('Giriş yap / Hesap aç')}</button><button class="btn ikincil" id="uyariKapat">${t('Sonra')}</button></div></section>` : ''}
        <h2 class="baslik">${t('Bölümler')}</h2>
        <p class="soluk kucukyazi">${t('🔒 Kilitli bölümleri de açabilirsin: konuyu biliyorsan doğrudan testine gir, {0} alınca bölüm açılır.', yuzdeStr(GECME))}</p>
        <div class="bolumler">${liste}</div>
      </main>`;
    odevKartiDoldur();
    const ik = $('#iosKapat'); if (ik) ik.onclick = () => { try { localStorage.setItem('tecvid-ogren.ios', '1'); } catch (e) { } ciz(); };
    const uk = $('#uyariKapat'); if (uk) uk.onclick = () => { S.hesapUyariKapali = true; kaydet(); ciz(); };
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
    const secim = gecildi ? '' : `<section class="kart secim ${kilitli ? 'kilit' : ''}">
        <p>${kilitli ? t('🔒 <b>Bu bölüm henüz kilitli.</b> Konuyu biliyorsan doğrudan teste gir; {0} alırsan bölüm açılır. İstersen önce konuyu oku.', yuzdeStr(GECME)) : t('Nasıl ilerlemek istersin? Konuyu biliyorsan doğrudan teste girebilirsin.')}</p>
        <div class="satir"><button class="btn ikincil" data-sekme="ders">${t('📖 Konuyu öğren')}</button><button class="btn" data-git="testBasla|bolum|${id}">${t('⚡ Direkt teste gir')}</button></div></section>`;
    if (sekme === 'ders') {
      const i = Math.min(+(EKRAN.ders._sayfa && EKRAN.ders._sayfa[id]) || 0, u.sayfalar.length - 1);
      const s = u.sayfalar[i];
      if (i + 1 > okunan) { S.okunan[id] = i + 1; kaydet(); }
      icerik = (i === 0 ? secim : '') + `<article class="kart sayfa"><div class="sayac">${i + 1} / ${u.sayfalar.length}</div><h2>${esc(s.t)}</h2>${s.h}</article>
        <div class="satir">
          <button class="btn ikincil" data-sayfa="${i - 1}" ${i === 0 ? 'disabled' : ''}>${t('‹ Önceki')}</button>
          ${i < u.sayfalar.length - 1 ? `<button class="btn" data-sayfa="${i + 1}">${t('Sonraki ›')}</button>` : `<button class="btn" data-sekme="${u.ornek && u.ornek.length ? 'ornek' : 'alistirma'}">${u.ornek && u.ornek.length ? t('Örneklere geç ›') : t('Alıştırmaya geç ›')}</button>`}
        </div>`;
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
        <p>${t('10 soru. Geçmek için en az <b>{0}</b> alman gerekir. Testte önceki bölümlerden de birkaç tekrar sorusu çıkar.', yuzdeStr(GECME))}</p>
        ${il ? `<p>${t('En iyi sonucun: <b>{0}</b> · {1} deneme', yuzdeStr(il.en), il.deneme)} ${il.gecti ? `· <span class="yesil">${t('Geçtin ✓')}</span>` : ''}</p>` : ''}
        ${kilitli ? `<p class="uyari">${t('🔒 Bu bölüm kilitli. Testi geçersen ({0}) bölüm açılır.', yuzdeStr(GECME))}</p>` : ''}
        ${!hepsiOkundu && !gecildi ? `<p class="soluk">${t('Dersi henüz bitirmedin ({0}/{1} sayfa). Konuyu biliyorsan yine de teste girebilirsin.', okunan, u.sayfalar.length)}</p>` : ''}
        <button class="btn genis" data-git="testBasla|bolum|${id}">${kilitli ? t('⚡ Geçiş testine gir') : t('Teste başla')}</button>
      </article>`;
    }
    app.innerHTML = `${ust(esc(u.ad))}
      <div class="sekmeler">${sekmeler.map(s => `<button class="${s[0] === sekme ? 'aktif' : ''}" data-sekme="${s[0]}">${s[1]}</button>`).join('')}</div>
      <main>${icerik}</main>`;
    app.querySelectorAll('[data-sekme]').forEach(b => b.onclick = () => { ekranYigini[ekranYigini.length - 1] = ['ders', [id, b.dataset.sekme]]; ciz(); window.scrollTo(0, 0); });
    app.querySelectorAll('[data-sayfa]').forEach(b => b.onclick = () => { EKRAN.ders._sayfa = EKRAN.ders._sayfa || {}; EKRAN.ders._sayfa[id] = +b.dataset.sayfa; ciz(); window.scrollTo(0, 0); });
    const la = $('#lejantAc'); if (la) la.onclick = () => { if (!S.ayar.renkli) { S.ayar.renkli = true; kaydet(); ciz(); return; } const l = $('#lejant'); l.hidden = !l.hidden; };
  };

  // ------------------------------------------------------------ oturum (test/alıştırma/tekrar)
  let oturum = null;
  function oturumBaslat(o) {
    oturum = Object.assign({ i: 0, cevaplar: [], basla: simdi(), bitti: false }, o);
    oturum.sorular = oturum.anahtarlar.map(soruUret).filter(Boolean);
    if (!oturum.sorular.length) { oturum = null; toast(t('Bu seçim için soru bulunamadı.')); ciz(); return; }
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
      oturumBaslat({ tur, id, kimlik: tur + '|' + id, baslik: u.ad, anahtarlar: karistir(sorular), puanli: true });
    };
  };

  function alistirmaBaslat(id) {
    const u = unitById(id);
    oturumBaslat({ tur: 'alistirma', id, kimlik: 'alistirma|' + id, baslik: t('Alıştırma: ') + u.ad, anahtarlar: sec(anahtarlar(u), 12, true), puanli: false, sonsuz: true });
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
        <p class="soluk">${t('Soru {0} / {1}', o.i + 1, o.sorular.length)}${o.puanli ? '' : t(' · alıştırma')}</p>
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
            <button class="btn genis" id="ileri">${o.i + 1 < o.sorular.length ? t('Sonraki soru ›') : (o.sonsuz ? t('Yeni soru seti ›') : t('Sonucu gör ›'))}</button>` : ''}
        </article>
      </main>`;
    const gb = $('[data-goster]'); if (gb) gb.onclick = () => { $('.gizli-kelime').hidden = false; gb.remove(); };
    if (q.tip === 'dinle' && !cevap && !q._calindi) { q._calindi = true; const sb = $('.dinle-kutu .sesbtn'); setTimeout(() => cal(q.sesUrl, sb), 250); }
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
      if (o.sonsuz) { oturum = null; ekranYigini.pop(); alistirmaBaslat(o.id); return; }
      bitir();
    };
  };

  function bitir() {
    const o = oturum; o.bitti = true;
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
    git('sonuc', kayit.id, onceki ? onceki.yuzde : null, yeniAcildi);
  }

  EKRAN.sonuc = function (id, oncekiYuzde, yeniAcildi) {
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
      ${yanlisListe.length ? `<h2 class="baslik">${t('Yanlışların ({0})', yanlisListe.length)}</h2>` + yanlisListe.map(({ q, c }) => `<article class="kart kucuk">${q.ustRenkli || ''}<p><b>${q.soru}</b></p>
        <p>${t('Senin cevabın: ')}${c ? metin(c.secilen) : '—'}<br>${t('Doğrusu: ')}<b class="yesil">${metin(q.dogru)}</b></p>${q.aciklama ? `<p class="soluk">${q.aciklama}</p>` : ''}</article>`).join('') + `<p class="soluk ortala">${t('Bu sorular tekrar listene eklendi. Yakında yeniden sorulacak.')}</p>` : ''}
      <div class="satir">
        ${puanli && !basarili && h.birim ? `<button class="btn ikincil" data-git="${unitById(h.birim).ara ? 'sinavGiris|' + h.birim : 'ders|' + h.birim}">${t('Tekrar dene')}</button>` : ''}
        ${sonraki ? `<button class="btn" data-git="${sonraki.ara ? 'sinavGiris|' + sonraki.id : 'ders|' + sonraki.id}">${t('Sonraki bölüm ›')}</button>` : `<button class="btn" data-git="ana">${t('Ana sayfa')}</button>`}
      </div></main>`;
    oturum = null;
  };

  EKRAN.testler = function () {
    const acik = acikDersler();
    app.innerHTML = `${ust(t('Testler'))}<main>
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
    const turAd = { bolum: t('Bölüm testi'), ara: t('Ara sınav'), final: t('Final'), tekrar: t('Günlük tekrar'), hizli: t('Hızlı test'), karma: t('Karma test'), zayif: t('Zayıf konular'), sure: t('Sûreler') };
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
        await b.cikis(); sinifBilgi = null; const ayar = S.ayar; S = bos(); S.ayar = ayar; S.hesapUyariKapali = true; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { }
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
  // Öğrenci: S.sinif = { kod, ad, sinifAd }. Özet, eşitlemede sınıfa gönderilir; hoca sadece bu özeti görür.
  let sinifBilgi = null, sinifBilgiZaman = 0;
  const odevSonStr = s => s ? new Date(s + 'T12:00:00').toLocaleDateString(DIL === 'en' ? 'en-GB' : 'tr-TR', { day: 'numeric', month: 'long' }) : '';
  function ozetHazirla() {
    const b = {}; U.forEach(u => { const il = S.ilerleme[u.id]; if (il && (il.deneme || il.gecti)) b[u.id] = [il.en || 0, il.gecti ? 1 : 0]; });
    const son = S.gecmis.slice(-8).reverse().map(h => ({ k: h.kimlik || null, b: h.baslik, y: h.yuzde, t: h.tarih }));
    return { gecilen: U.filter(u => gecti(u.id)).length, toplam: U.length, b, son, seri: S.seri.gun || 0, seriSon: S.seri.son || '', test: S.gecmis.length, tekrar: vadesiGelenler().length, zaman: Date.now() };
  }
  async function ozetiGonder() {
    if (!girisli() || !S.sinif || !B().ozetGonder) return;
    await B().ozetGonder(S.sinif.kod, S.sinif.ad, ozetHazirla());
  }
  async function sinifBilgiGetir(zorla) {
    if (!girisli() || !S.sinif) { sinifBilgi = null; return null; }
    if (!zorla && sinifBilgi && sinifBilgi.kod === S.sinif.kod && Date.now() - sinifBilgiZaman < 10 * 60000) return sinifBilgi;
    try {
      const s = await B().sinifGetir(S.sinif.kod);
      if (!s) { toast(t('Sınıfın hocası sınıfı kapattı.')); S.sinif = null; sinifBilgi = null; kaydet(); return null; }
      sinifBilgi = s; sinifBilgiZaman = Date.now(); return s;
    } catch (e) { return sinifBilgi; }
  }
  // Ana sayfadaki ödev kartı (önce boş yer, sonra doldurulur)
  function odevKartiDoldur() {
    const yer = $('#odevYer'); if (!yer || !S.sinif) return;
    sinifBilgiGetir().then(s => {
      if (!document.body.contains(yer)) return;
      if (!s || !s.odev || !s.odev.birim || !unitById(s.odev.birim)) { yer.innerHTML = ''; return; }
      const o = s.odev, u = unitById(o.birim), bitti = gecti(o.birim);
      const gecikti = o.son && !bitti && o.son < bugun();
      yer.innerHTML = `<section class="kart tekrar ${bitti ? '' : 'vurgulu'}" style="margin-bottom:14px"><div><h2>${t('📌 Ödev')} · <span class="soluk" style="font-weight:500">${esc(s.ad || '')}</span></h2>
        <p><b>${u.ikon} ${esc(u.ad)}</b>${o.son ? ` · ${gecikti ? '<span class="kirmizi">' : ''}${t('son gün: {0}', odevSonStr(o.son))}${gecikti ? '</span>' : ''}` : ''}</p>
        ${o.not ? `<p class="soluk">“${esc(o.not)}”</p>` : ''}
        <p>${bitti ? `<span class="yesil">${t('✓ Tamamladın ({0})', yuzdeStr(S.ilerleme[o.birim].en))}</span>` : t('Bölüm testinden {0} al, ödev tamamlansın.', yuzdeStr(GECME))}</p></div>
        ${bitti ? '' : `<button class="btn" data-git="${u.ara ? 'sinavGiris|' + u.id : 'ders|' + u.id}">${t('Başla')}</button>`}</section>`;
    });
  }

  function girisIste(baslik) {
    app.innerHTML = `${ust(baslik)}<main><article class="kart"><h2>${t('Önce giriş yap')}</h2>
      <p>${t('Sınıflar internet üzerinden çalışır. Hoca da öğrenci de bir hesapla giriş yapmalı.')}</p>
      <button class="btn" data-git="hesap">${t('Giriş yap / Hesap aç')}</button></article></main>`;
  }

  EKRAN.sinif = function () {
    if (!B() || !B().hazir || !girisli()) return girisIste(t('Sınıf'));
    const k = B().kullanici();
    const varsayilanAd = (S.sinif && S.sinif.ad) || k.displayName || (k.email || '').split('@')[0];
    const ogr = S.sinif;
    app.innerHTML = `${ust(t('Sınıf'))}<main>
      <p class="soluk">${t('Hoca sınıf açar ve kodunu öğrencilerine verir. Öğrenci kodu girip katılır; hoca öğrencilerinin ilerlemesini görür ve ödev verir.')}</p>
      <h2 class="baslik">${t('🎓 Öğrenciyim')}</h2>
      ${ogr ? `<article class="kart"><h2>${esc(ogr.sinifAd || '')} <span class="rozet ok">${esc(ogr.kod)}</span></h2>
          <p>${t('Sınıfta görünen adın: ')}<b>${esc(ogr.ad)}</b></p>
          <div id="ogrOdev"><p class="soluk">${t('Yükleniyor…')}</p></div>
          <p class="soluk kucukyazi">${t('Hocan; geçtiğin bölümleri, puanlarını, son testlerini ve serini görür. Başka hiçbir şey paylaşılmaz.')}</p>
          <div class="satir sola"><button class="btn" id="ozetGonder">${t('🔄 İlerlememi şimdi gönder')}</button><button class="btn ikincil" id="ayril">${t('Sınıftan ayrıl')}</button></div></article>`
        : `<article class="kart form"><label>${t('Sınıf kodu')}<input id="kod" maxlength="6" autocapitalize="characters" autocomplete="off" placeholder="${t('ör. K7M2QX')}" style="text-transform:uppercase;letter-spacing:.2em"></label>
          <label>${t('Adın (hocan bu adı görür)')}<input id="ad" maxlength="40" value="${esc(varsayilanAd)}"></label>
          <p class="hata" id="hata1"></p><button class="btn genis" id="katil">${t('Sınıfa katıl')}</button></article>`}
      <h2 class="baslik">${t('👨‍🏫 Hocayım')}</h2>
      <article class="kart form"><label>${t('Yeni sınıfın adı')}<input id="sinifAd" maxlength="60" placeholder="${t('ör. Cuma kursu')}"></label>
        <p class="hata" id="hata2"></p><button class="btn genis" id="olustur">${t('Sınıf oluştur')}</button></article>
      <div id="siniflarim" class="bolumler"><p class="soluk">${t('Sınıfların yükleniyor…')}</p></div>
    </main>`;
    const mesgul = (btn, v) => { btn.disabled = v; btn.dataset.yazi = btn.dataset.yazi || btn.textContent; btn.textContent = v ? t('Bekle…') : btn.dataset.yazi; };
    if (ogr) {
      sinifBilgiGetir(true).then(s => {
        const yer = $('#ogrOdev'); if (!yer) return;
        if (!s) { yer.innerHTML = `<p class="soluk">${t('Sınıf bilgisi alınamadı (internet yok olabilir).')}</p>`; return; }
        const o = s.odev, u = o && unitById(o.birim);
        yer.innerHTML = u ? `<p>${t('📌 Ödev: ')}<b>${u.ikon} ${esc(u.ad)}</b>${o.son ? ' · ' + t('son gün: {0}', odevSonStr(o.son)) : ''} ${gecti(u.id) ? '<span class="yesil">✓</span>' : ''}</p>${o.not ? `<p class="soluk">“${esc(o.not)}”</p>` : ''}` : `<p class="soluk">${t('Şu an verilmiş bir ödev yok.')}</p>`;
      });
      $('#ozetGonder').onclick = async e => { mesgul(e.currentTarget, true); try { await B().ozetGonder(ogr.kod, ogr.ad, ozetHazirla()); toast(t('İlerlemen hocana gönderildi ✓')); } finally { mesgul($('#ozetGonder'), false); } };
      $('#ayril').onclick = async () => {
        if (!confirm(t('Sınıftan ayrılmak istiyor musun? Hocan artık ilerlemeni göremez.'))) return;
        try { await B().siniftanAyril(ogr.kod); } catch (e) { if (!/izin|Permission/i.test(e.message)) return toast(e.message); }
        S.sinif = null; sinifBilgi = null; kaydet(); toast(t('Sınıftan ayrıldın')); ciz();
      };
    } else {
      $('#katil').onclick = async e => {
        const kod = $('#kod').value.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''), ad = $('#ad').value.trim();
        const h = m => { $('#hata1').textContent = m || ''; }; h();
        if (kod.length !== 6) return h(t('Sınıf kodu 6 karakterdir.'));
        if (!ad) return h(t('Adını yaz.'));
        const btn = e.currentTarget; mesgul(btn, true);
        try { const s = await B().sinifaKatil(kod, ad, ozetHazirla()); S.sinif = { kod, ad, sinifAd: s.ad || '' }; sinifBilgi = s; sinifBilgiZaman = Date.now(); kaydet(); toast(t('Sınıfa katıldın ✓')); ciz(); }
        catch (x) { h(x.message); mesgul(btn, false); }
      };
    }
    $('#olustur').onclick = async e => {
      const ad = $('#sinifAd').value.trim(); const h = m => { $('#hata2').textContent = m || ''; }; h();
      if (!ad) return h(t('Sınıfa bir ad ver.'));
      const btn = e.currentTarget; mesgul(btn, true);
      try { const kod = await B().sinifOlustur(ad); toast(t('Sınıf oluşturuldu ✓')); git('sinifDetay', kod); }
      catch (x) { h(x.message); mesgul(btn, false); }
    };
    B().siniflarim().then(l => {
      const yer = $('#siniflarim'); if (!yer) return;
      l.sort((a, b) => ((b.olusturma && b.olusturma.toMillis ? b.olusturma.toMillis() : 0) - (a.olusturma && a.olusturma.toMillis ? a.olusturma.toMillis() : 0)));
      yer.innerHTML = l.length ? l.map(s => `<button class="bolum" data-git="sinifDetay|${esc(s.kod)}"><span class="ikon">👥</span><span class="bad"><small>${esc(s.kod)}</small>${esc(s.ad || '')}</span><span class="rozet">›</span></button>`).join('')
        : `<p class="soluk">${t('Henüz bir sınıf açmadın.')}</p>`;
    }).catch(e => { const yer = $('#siniflarim'); if (yer) yer.innerHTML = `<p class="hata">${esc(e.message)}</p>`; });
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
        const odevDurum = o.birim ? (z.b && z.b[o.birim] && z.b[o.birim][1] ? `<span class="rozet ok">${t('✓ ödev')}</span>` : `<span class="rozet kilit">${t('ödev bekliyor')}</span>`) : '';
        const p = Math.round((z.gecilen || 0) / top * 100);
        const bolumler = U.filter(u => z.b && z.b[u.id]).map(u => `<li>${u.ikon} ${esc(u.ad)}: <b class="${z.b[u.id][1] ? 'yesil' : 'kirmizi'}">${yuzdeStr(z.b[u.id][0])}</b></li>`).join('');
        const son = (z.son || []).map(h => `<li>${esc(h.k ? baslikBul({ kimlik: h.k, baslik: h.b }) : h.b)}: <b>${yuzdeStr(h.y)}</b> <small class="soluk">${tarihStr(h.t)}</small></li>`).join('');
        return `<details class="kart kucuk ogrenci"><summary><span class="bad"><b>${esc(x.ad || '?')}</b><small>${t('{0}/{1} bölüm', z.gecilen || 0, top)} · 🔥 ${z.seri || 0} · ${t('son: {0}', x.guncelleme ? tarihStr(x.guncelleme) : '—')}</small>
          <div class="bar"><div class="${p >= 80 ? 'iyi' : p >= 40 ? 'orta' : 'kotu'}" style="width:${p}%"></div></div></span>${odevDurum}</summary>
          ${bolumler ? `<p style="margin-top:10px"><b>${t('Bölümler')}</b></p><ul class="kaynak">${bolumler}</ul>` : `<p class="soluk">${t('Henüz test çözmedi.')}</p>`}
          ${son ? `<p><b>${t('Son testler')}</b></p><ul class="kaynak">${son}</ul>` : ''}
          <p class="soluk kucukyazi">${t('Toplam test: {0} · Bekleyen tekrar: {1}', z.test || 0, z.tekrar || 0)}</p>
          <button class="btn ikincil tehlike-yazi" data-cikar="${esc(x.uid)}">${t('Sınıftan çıkar')}</button></details>`;
      };
      yer.innerHTML = `<article class="kart ortala"><h2>${esc(s.ad || '')}</h2>
          <p class="soluk">${t('Öğrencilerin bu kodu girerek katılır:')}</p>
          <p class="sinif-kod">${esc(kod)}</p>
          <div class="satir"><button class="btn" id="paylas">${t('📤 Kodu paylaş')}</button><button class="btn ikincil" id="yenile">${t('🔄 Yenile')}</button></div></article>
        <article class="kart form"><h2>${t('📌 Ödev ver')}</h2>
          <label>${t('Bölüm')}<select id="odevBirim" style="display:block;width:100%;margin-top:6px;padding:10px"><option value="">${t('— ödev yok —')}</option>
            ${U.map(u => `<option value="${u.id}" ${o.birim === u.id ? 'selected' : ''}>${u.ikon} ${u.ara ? '' : dersler.indexOf(u) + '. '}${esc(u.ad)}</option>`).join('')}</select></label>
          <label>${t('Son gün (isteğe bağlı)')}<input id="odevSon" type="date" value="${esc(o.son || '')}"></label>
          <label>${t('Not (isteğe bağlı)')}<input id="odevNot" maxlength="200" value="${esc(o.not || '')}" placeholder="${t('ör. Örnekleri 3 kez dinleyin')}"></label>
          <button class="btn genis" id="odevKaydet">${t('Ödevi kaydet')}</button></article>
        <h2 class="baslik">${t('Öğrenciler ({0})', ogrenciler.length)}</h2>
        ${ogrenciler.length ? ogrenciler.map(satir).join('') : `<p class="soluk">${t('Henüz katılan öğrenci yok. Kodu öğrencilerine ver.')}</p>`}
        <p class="soluk kucukyazi">${t('Öğrencinin ilerlemesi, onun telefonu internete bağlanıp eşitlendiğinde güncellenir.')}</p>
        <article class="kart"><h2>${t('⚠️ Sınıfı sil')}</h2><p>${t('Sınıf kapanır, kod çalışmaz. Öğrencilerin kendi ilerlemesi silinmez.')}</p><button class="btn tehlike" id="sinifSil">${t('Sınıfı sil')}</button></article>`;
      $('#paylas').onclick = async () => {
        const yazi = t('Tecvid Öğren uygulamasında "{0}" sınıfına katıl: Ayarlar → Sınıf → Öğrenciyim → kod: {1}', s.ad || '', kod);
        try { if (navigator.share) { await navigator.share({ text: yazi }); return; } } catch (e) { return; }
        try { await navigator.clipboard.writeText(yazi); toast(t('Kopyalandı')); } catch (e) { toast(kod); }
      };
      $('#yenile').onclick = () => ciz();
      $('#odevKaydet').onclick = async e => {
        const birim = $('#odevBirim').value; const btn = e.currentTarget; btn.disabled = true;
        const odev = birim ? { birim, son: $('#odevSon').value || null, not: $('#odevNot').value.trim() || null, verildi: Date.now() } : null;
        try { await B().odevVer(kod, odev); toast(odev ? t('Ödev verildi ✓') : t('Ödev kaldırıldı')); } catch (x) { toast(x.message); }
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

  const sureSatir = (x, adet) => { const ok = (S.sure || {})[x.n]; return `<button class="bolum" data-git="sure|${x.n}" data-ara="${esc(trSade(x.n + ' ' + x.tr + ' ' + x.en))}"><span class="ikon" style="font-size:.8rem;width:28px;color:var(--soluk)">${x.n}</span><span class="bad"><small>${t('{0} ayet', adet)}</small>${esc(sureAdi(x))}</span><span class="ar" style="font-size:1.1rem;line-height:1.2">${esc(x.ar)}</span>${ok && ok.en != null ? `<span class="rozet ok">✓ ${yuzdeStr(ok.en)}</span>` : ''}</button>`; };
  EKRAN.sureler = function () {
    app.innerHTML = `${ust(t('Kur\'an-ı Kerîm'))}<main>
      <p class="soluk">${t('Önce dinle, sonra oku. Kelimeye dokunursan o kelimeyi dinlersin.')}</p>
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
  let sureCalma = null;
  EKRAN.sure = function (n, filtre) {
    n = +n; const x = SURE(n);
    if (!x) {
      app.innerHTML = `${ust(esc(sureNoAdi(n)))}<main><p class="soluk">${t('Yükleniyor…')}</p></main>`;
      sureYukle(n).then(() => { const ek = ekranYigini[ekranYigini.length - 1]; if (ek[0] === 'sure' && +ek[1][0] === n) ciz(); })
        .catch(() => { app.querySelector('main').innerHTML = `<p class="hata">${t('Sûre açılamadı.')}</p>`; });
      return;
    }
    const tekrar = S.ayar.tekrar || 1;
    const sayim = {}; x.ayet.forEach((_, i) => (RENK[`${n}:${i + 1}`] || []).forEach(e => { sayim[e[2]] = (sayim[e[2]] || 0) + 1; }));
    const gorunen = filtre ? x.ayet.map((_, i) => i).filter(i => (RENK[`${n}:${i + 1}`] || []).some(e => e[2] === filtre)) : x.ayet.map((_, i) => i);
    const OKU = (window.OKUNUS || {})[DIL === 'en' ? 'en' : 'tr'] || {};
    const okVar = !!OKU[`${n}:1`], okGoster = okVar && S.ayar.okunus;
    kelimeHTML.filtre = filtre || null;
    const ayetler = gorunen.map(i => {
      const a = x.ayet[i];
      const r = `${n}:${i + 1}`; let o = 0;
      const kel = a.split(' ').map((w, wi) => { const h = `<span class="kelime" data-ses="${kelimeUrl(r, wi + 1)}">${kelimeHTML(r, w, o)}</span>`; o += w.length + 1; return h; }).join(' ');
      return `<article class="kart ayet-kart" id="ayet-${i + 1}">
        <div class="ayet" dir="rtl" lang="ar">${kel} <span class="ayet-no">﴿${(i + 1).toLocaleString('ar-EG')}﴾</span></div>
        ${okGoster && OKU[r] ? `<p class="okunus">${esc(OKU[r])}</p>` : ''}
        <div class="sesler"><button class="sesbtn" data-ayet-cal="${i + 1}">${t('▶ Dinle')}</button></div>
        ${kayitHTML('sure' + r, ayetUrl(r))}<span hidden data-yedek="${ayetUrl(r, KARILER[0].klasor)}" data-ses="${ayetUrl(r)}"></span>
      </article>`;
    }).join('');
    kelimeHTML.filtre = null;
    const besmele = !filtre && n !== 1 && n !== 9 ? `<div class="ayet besmele" dir="rtl" lang="ar">${esc(window.BESMELE || '')}</div>${okGoster && OKU.b ? `<p class="okunus ortala">${esc(OKU.b)}</p>` : ''}` : '';
    app.innerHTML = `${ust(esc(sureAdi(x)) + ' · <span class="ar" style="font-size:1.1rem">' + esc(x.ar) + '</span>')}<main>
      <section class="kart">
        <div class="satir sola"><button class="btn" id="hepsi">${t('▶ Tamamını dinle')}</button><button class="btn ikincil" data-git="sureTest|${n}">${t('🔍 Kural bul testi')}</button></div>
        <p class="soluk kucukyazi" style="margin-top:10px">${t('Her ayeti kaç kez çalsın?')}</p>
        <div class="satir sola">${[1, 3, 5].map(k => `<button class="btn ${tekrar === k ? '' : 'ikincil'}" data-tekrar="${k}">${k}×</button>`).join('')}</div>
        <div class="satir sola"><button class="lejant-ac" id="lejantAc">🎨 ${t('Renklerin anlamı')}</button><button class="lejant-ac" data-git="kariSec">🎙️ ${esc(kari().ad)}</button>${okVar ? `<button class="lejant-ac ${okGoster ? 'aktif' : ''}" id="okunusAc">🔤 ${okGoster ? t('Okunuşu gizle') : t('Okunuşu göster')}</button>` : ''}</div>
        ${okGoster ? `<p class="soluk kucukyazi">${t('Okunuş yaklaşık bir yazımdır; Arapça harflerin hepsini Latin harfle tam yazmak mümkün değil. Doğru okuyuşu kâriyi dinleyerek öğren.')}</p>` : ''}
        <div id="lejant" hidden>${lejantHTML()}</div>
        <p class="soluk kucukyazi" style="margin-top:10px">${t('Kural ara: sadece bu kuralı renklendir')}</p>
        <div class="filtre">${LEJANT.filter(([k]) => sayim[k]).map(([k, ad]) => `<button class="${filtre === k ? 'aktif' : ''}" data-filtre="${k}"><i class="tc-${k}"></i>${esc(ad)} <small>${sayim[k]}</small></button>`).join('')}</div>
        ${filtre ? `<p style="margin-top:8px"><b>${t('{0} ayette geçiyor.', gorunen.length)}</b> <button class="link" data-filtre="">${t('Filtreyi kaldır')}</button></p>` : ''}
        ${FS() ? `<div id="indirDurum"></div><div class="satir sola">${(() => { const l = indirListesi(kari().klasor, n), v = indirilenSay(l); return v >= l.length ? `<span class="rozet ok">${t('✓ Sesler indirildi')}</span>` : indirme ? '' : `<button class="lejant-ac" id="sureIndir">📥 ${t('Bu sûrenin seslerini indir')} (${v}/${l.length})</button>`; })()}</div>` : ''}
      </section>
      ${besmele}${ayetler}
    </main>`;
    const durdur = () => { if (sureCalma) { sureCalma.iptal = true; sureCalma = null; } if (ses) { ses.pause(); ses = null; } document.querySelectorAll('.ayet-kart.caliyor-ayet').forEach(e => e.classList.remove('caliyor-ayet')); };
    function calSira(baslangic, bitis, secili) {
      durdur(); const is = { iptal: false }; sureCalma = is;
      const liste = []; for (const i of (secili || Array.from({ length: bitis - baslangic + 1 }, (_, j) => baslangic + j))) for (let k = 0; k < tekrar; k++) liste.push(i);
      let j = 0;
      const sonraki = () => {
        if (is.iptal) return;
        document.querySelectorAll('.ayet-kart.caliyor-ayet').forEach(e => e.classList.remove('caliyor-ayet'));
        if (j >= liste.length) { sureCalma = null; $('#hepsi') && ($('#hepsi').textContent = t('▶ Tamamını dinle')); return; }
        const i = liste[j++]; const kart = document.getElementById('ayet-' + i); kart && kart.classList.add('caliyor-ayet'); kart && kart.scrollIntoView({ behavior: 'smooth', block: 'center' });
        ses = new Audio(sesKaynak(ayetUrl(`${n}:${i}`))); ses.playbackRate = S.ayar.hiz || 1;
        ses.onended = () => setTimeout(sonraki, 500);
        ses.onerror = () => { durdur(); toast(t('Ses çalınamadı. İnternet bağlantını kontrol et.')); };
        ses.play().catch(() => durdur());
      };
      sonraki();
    }
    $('#hepsi').onclick = () => { if (sureCalma) { durdur(); $('#hepsi').textContent = t('▶ Tamamını dinle'); return; } $('#hepsi').textContent = t('⏹ Durdur'); calSira(1, x.ayet.length, gorunen.map(i => i + 1)); S.sure = S.sure || {}; S.sure[n] = Object.assign({}, S.sure[n], { dinlendi: Date.now() }); kaydet(); };
    app.querySelectorAll('[data-ayet-cal]').forEach(b => b.onclick = () => { const i = +b.dataset.ayetCal; calSira(i, i); });
    app.querySelectorAll('[data-tekrar]').forEach(b => b.onclick = () => { S.ayar.tekrar = +b.dataset.tekrar; kaydet(); durdur(); ciz(); });
    const la = $('#lejantAc'); la.onclick = () => { const l = $('#lejant'); l.hidden = !l.hidden; };
    app.querySelectorAll('[data-filtre]').forEach(b => b.onclick = () => { durdur(); const f = b.dataset.filtre; ekranYigini[ekranYigini.length - 1] = ['sure', [n, f === filtre ? '' : f]]; ciz(); });
    const oa = $('#okunusAc'); if (oa) oa.onclick = () => { S.ayar.okunus = !S.ayar.okunus; kaydet(); durdur(); ciz(); };
    const si = $('#sureIndir'); if (si) si.onclick = () => { indirBaslat(indirListesi(kari().klasor, n), sureAdi(x) + ':'); si.remove(); };
    indirmeGoster();
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
      <div class="secenek-liste">${KARILER.map(k => `<button class="${k.id === kari().id ? 'aktif' : ''}" data-kari="${k.id}"><span>${esc(k.ad)}<small>${esc(k.tur)}</small></span>
        <span class="sesbtn ikincil" data-ses="${ayetUrl(ornek, k.klasor)}">▶</span></button>`).join('')}</div>
      <p class="soluk kucukyazi">${t('Sesler everyayah.com arşivinden internet üzerinden çalınır. Kelime kelime dinleme her kâri için Quran.com kaydıyla yapılır.')}</p></article></main>`;
    app.querySelectorAll('[data-kari]').forEach(b => b.onclick = e => {
      if (e.target.closest('[data-ses]')) return;
      S.ayar.kari = b.dataset.kari; kaydet(); toast(t('Kâri seçildi: ') + kari().ad); ciz();
    });
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
        <p style="margin-top:16px"><b>${t('Yazı boyutu')}</b></p>
        <div class="satir sola">${[[0.9, 'A−'], [1, 'A'], [1.15, 'A+'], [1.3, 'A++']].map(([v, ad]) => `<button class="btn ${(S.ayar.yazi || 1) === v ? '' : 'ikincil'}" data-yazi="${v}">${ad}</button>`).join('')}</div>
        <p style="margin-top:12px"><b>${t('Arapça yazı boyutu')}</b></p>
        <div class="satir sola">${[[0.85, '−'], [1, ''], [1.2, '+'], [1.4, '++']].map(([v, ek]) => `<button class="btn ${(S.ayar.arYazi || 1) === v ? '' : 'ikincil'}" data-aryazi="${v}"><span class="ar" style="font-size:1.2em;line-height:1">ع</span>${ek}</button>`).join('')}</div>
        <p style="margin-top:16px"><b>${t('Renkli tecvid yazısı')}</b></p>
        <p class="soluk">${t('Örnek ayetlerde her tecvid kuralı kendi rengiyle gösterilir. Testlerde renkler cevabı ele vermesin diye cevaptan sonra görünür.')}</p>
        <div class="satir sola"><button class="btn ${S.ayar.renkli ? '' : 'ikincil'}" data-renkli="1">${t('Açık')}</button><button class="btn ${S.ayar.renkli ? 'ikincil' : ''}" data-renkli="0">${t('Kapalı')}</button></div>
        <div class="ayet" dir="rtl" lang="ar" style="margin-top:12px">${['109:3', '96:2'].map(r => kelimeHTMLtam(r)).join(' ۝ ')}</div>
        ${lejantHTML()}</article>
      <article class="kart"><h2>${t('⏰ Günlük hatırlatma')}</h2>
        <p class="soluk">${t('Her gün seçtiğin saatte telefonuna bir hatırlatma gelir. O gün zaten çalıştıysan gelmez.')}</p>
        ${LN() ? `<div class="satir sola"><button class="btn ${hat.acik ? '' : 'ikincil'}" data-hatir="1">${t('Açık')}</button><button class="btn ${hat.acik ? 'ikincil' : ''}" data-hatir="0">${t('Kapalı')}</button>
          <label>${t('Saat:')} <input type="time" id="hatirSaat" value="${esc(hat.saat || '20:00')}" style="font:inherit;padding:8px;border-radius:10px;border:1px solid var(--cizgi);background:var(--bg);color:var(--metin)"></label></div>` : `<p class="soluk kucukyazi">${t('Günlük hatırlatma şimdilik yalnızca Android uygulamasında çalışır.')}</p>`}</article>
      <article class="kart"><h2>${t('🎙️ Kâri')}</h2><p>${esc(kari().ad)} · <span class="soluk">${esc(kari().tur)}</span></p>
        <div class="satir sola"><button class="btn" data-git="kariSec">${t('Kâri seç')}</button>${FS() ? `<button class="btn ikincil" data-git="indir">${t('📥 İnternetsiz ses')}</button>` : ''}</div></article>
      <article class="kart"><h2>${t('🔊 Ses hızı')}</h2>
        <div class="satir sola">${[0.75, 1, 1.25].map(h => `<button class="btn ${S.ayar.hiz === h ? '' : 'ikincil'}" data-hiz="${h}">${h}×</button>`).join('')}</div></article>
      <article class="kart"><h2>${t('👤 Hesap')}</h2><p>${hk ? t('Giriş yapıldı: ') + '<b>' + esc(hk.email || '') + '</b>' : t('Giriş yapmadın. Verilerin sadece bu telefonda.')}</p>
        <button class="btn" data-git="hesap">${hk ? t('Hesabım') : t('Giriş yap / Hesap aç')}</button></article>
      <article class="kart"><h2>${t('👨‍🏫 Sınıf (hoca–öğrenci)')}</h2><p>${S.sinif ? t('Sınıfın: ') + '<b>' + esc(S.sinif.sinifAd || S.sinif.kod) + '</b>' : t('Hocan bir sınıf kodu verdiyse katıl; hocaysan sınıf aç, öğrencilerini takip et, ödev ver.')}</p>
        <button class="btn" data-git="sinif">${t('Sınıfa git')}</button></article>
      <article class="kart"><h2>${t('💾 Yedek')}</h2><p>${t('İlerlemen ve geçmişin telefonda saklanır. Uygulamayı silmeden önce ya da yeni bir telefona geçerken yedeğini kopyalayıp bir yere (not, e-posta) kaydet.')}</p>
        <textarea id="yedek" rows="4" readonly>${esc(yedek)}</textarea>
        <div class="satir sola"><button class="btn" id="kopyala">${t('Yedeği kopyala')}</button></div>
        <p>${t('Yedeği geri yüklemek için aşağıya yapıştır:')}</p>
        <textarea id="yukle" rows="3" placeholder="${t('Yedeği buraya yapıştır')}"></textarea>
        <div class="satir sola"><button class="btn ikincil" id="geriyukle">${t('Geri yükle')}</button></div></article>
      <article class="kart"><h2>${t('📚 Kaynaklar')}</h2><ul class="kaynak">${KAYNAK.map(k => `<li>${esc(k)}</li>`).join('')}</ul>
        <p class="soluk">${t('Tecvid kulakla öğrenilen bir ilimdir. Bu uygulama bir hocadan ders almanın yerini tutmaz, onu destekler.')}</p></article>
      <article class="kart"><h2>${t('⚠️ Sıfırla')}</h2><p>${t('Bütün ilerleme ve geçmiş silinir.')}</p><button class="btn tehlike" id="sifirla">${t('Her şeyi sıfırla')}</button></article>
    </main>`;
    app.querySelectorAll('[data-dil]').forEach(b => b.onclick = () => { if (b.dataset.dil === DIL) return; try { localStorage.setItem('tecvid-ogren.dil', b.dataset.dil); } catch (e) { } location.reload(); });
    app.querySelectorAll('[data-tema]').forEach(b => b.onclick = () => { S.ayar.tema = b.dataset.tema; temaUygula(); kaydet(); ciz(); });
    app.querySelectorAll('[data-yazi]').forEach(b => b.onclick = () => { S.ayar.yazi = +b.dataset.yazi; temaUygula(); kaydet(); ciz(); });
    app.querySelectorAll('[data-aryazi]').forEach(b => b.onclick = () => { S.ayar.arYazi = +b.dataset.aryazi; temaUygula(); kaydet(); ciz(); });
    app.querySelectorAll('[data-renkli]').forEach(b => b.onclick = () => { S.ayar.renkli = b.dataset.renkli === '1'; kaydet(); ciz(); });
    const hatirAyarla = async (acik, saat) => {
      S.ayar.hatirlat = { acik, saat }; kaydet();
      const ok = await hatirlatmaKur(acik);
      if (acik && LN() && !ok) { S.ayar.hatirlat.acik = false; kaydet(); toast(t('Bildirim izni verilmedi. Telefon ayarlarından Tecvid Öğren için bildirimlere izin ver.')); }
      else if (acik) toast(t('Hatırlatma kuruldu: her gün {0}', saat));
      ciz();
    };
    app.querySelectorAll('[data-hatir]').forEach(b => b.onclick = () => hatirAyarla(b.dataset.hatir === '1', $('#hatirSaat').value || '20:00'));
    if ($('#hatirSaat')) $('#hatirSaat').onchange = e => { if (e.target.value) hatirAyarla(!!(S.ayar.hatirlat || {}).acik, e.target.value); };
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
      if (girisli()) { try { await B().yukle(S); } catch (e) { toast(t('Hesaptaki veriler silinemedi: internet yok')); } }
      anaSayfa();
    };
  };
  // ------------------------------------------------------------ günlük hatırlatma (telefon bildirimi)
  // Önümüzdeki 14 gün için her gün seçilen saatte bir bildirim kurulur; bugün çalıştıysan bugünkü atlanır.
  const LN = () => { const C = window.Capacitor; return C && C.isNativePlatform && C.isNativePlatform() ? C.registerPlugin('LocalNotifications') : null; };
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
        bildirimler.push({ id: HATIR_ID[g], title: t('Tecvid Öğren'), body: hatirlatmaMetni(g + new Date().getDate()), schedule: { at, allowWhileIdle: true } });
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

  anaSayfa();
  bulutBagla();
  hatirlatmaKur(false);
  window.__TECVID = { git: (...a) => git(...a), ana: () => anaSayfa(), S: () => S, soruUret, anahtarlar, dogru: () => oturum && oturum.sorular[oturum.i] && oturum.sorular[oturum.i].dogru, U, kaydet: v => { S = v; kaydet(); anaSayfa(); } }; // test için
})();

/* Kur'an Yolum — Müezzinlik ve Okuyarak pekiştir */
/* app.js bölündü: bu dosyalar sırayla yüklenir, aynı genel kapsamı paylaşır (bkz. TODO.md). */
'use strict';
  // ------------------------------------------------------------ Müezzinlik: ezan, kamet, selâ, namaz sonrası tesbihat
  // S.muezzin[id] = { tam, ilk, son, kutu, vade }
  const MZ = k => (k === 'dua' ? window.DUALAR : window.MUEZZIN) || { M: [], AKIS: [], KAYNAKLAR: [] };   // k: 'dua' → Dualar bölümü (aynı ekranlar)
  const mzKol = x => x && String(x.id).startsWith('d-') ? 'dua' : '';
  const mzBul = id => MZ().M.concat(MZ('dua').M).find(x => x.id === id);
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
    if (x.satir) return x.satir.map((s_, i) => Object.assign({}, s_, { fkey: x.id + '#' + i }));
    if (x.kuran.some(([s]) => !SURE(s) || (yazimTr() && !TR_YAZI[s]))) return null;
    const OKU = ((window.OKUNUS || {}).tr) || {};
    // Uzun ayet (Âyetü'l-Kürsî gibi) durak işaretlerinden parçalara bölünür: ekranda kısa kartlar, her parça ayrı okunur
    return x.kuran.flatMap(([s, a]) => { const r = `${s}:${a}`, m = MEAL['tr' + s], med = medineAyet(r).split(' '), gor = ayetMetni(r).split(' ');
      const ayni = gor.length === med.length, parcalar = [];
      if (med.length > 14) { let b0 = 0; med.forEach((w, i) => { const durak = /[ۖ-ۛ]/.test(w), uzun = i - b0 + 1 >= 12; if (i === med.length - 1 || (durak && i - b0 >= 3) || uzun) { parcalar.push([b0, i]); b0 = i + 1; } }); }
      else parcalar.push([0, med.length - 1]);
      const tek = parcalar.length === 1;
      return parcalar.map(([w0, w1], k) => ({ ar: tek ? ayetMetni(r) : (ayni ? gor : med).slice(w0, w1 + 1).join(' '), ok: k === parcalar.length - 1 ? OKU[r] || '' : '', tr: k === parcalar.length - 1 && m ? m[a - 1] : '', n: 1,
        ses: k === 0 ? ayetUrl(r) : '', yedek: k === 0 ? ayetUrl(r, KARILER[0].klasor) : '', r, parcaNo: tek ? 0 : k + 1, parcaSay: parcalar.length,
        parca: { n: s, a, w0, w1, ilk: med[w0], son: med[w1] } })); });
  }
  // Müezzinlik ve Dualar metinlerinin fonetik referansı (tools/build_mz_fonetik.py), okuyarak ezber için
  let MZF = null;
  const mzFonetik = () => MZF || (MZF = fetch('data/mz-fonetik.json').then(r => r.json()).catch(e => { MZF = null; throw e; }));
  function mzYukle(x, ekran) {
    const l = [...new Set((x.kuran || []).map(([s]) => s))];
    Promise.all(l.map(s => sureYukle(s).then(() => DIL === 'en' ? null : mealYukle(s).catch(() => null)))).then(() => { const ek = ekranYigini[ekranYigini.length - 1]; if (ek[0] === ekran) ciz(); })
      .catch(() => { const m = app.querySelector('main'); if (m) m.innerHTML = `<p class="hata">${t('Metin açılamadı. İnternet bağlantını kontrol et.')}</p>`; });
  }
  // seviye: 0 hiçbiri, 1 yarısı, 2 ilk kelime kalsın, 3 hepsi
  // Kaydı olmayan metinler için yapay ses (cihazın Arapça konuşma motoru). Makam yok; kayıt gelene kadar geçici çözüm.
  const MZ_TTS = { no: 0, btn: null };
  function mzTtsDur() {
    MZ_TTS.no++; const TTS = window.capEklenti && window.capEklenti('TextToSpeech'); if (TTS) TTS.stop().catch(() => { });
    try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) { }
    document.querySelectorAll('.mz-kart.calan').forEach(k => k.classList.remove('calan'));
    if (MZ_TTS.btn) { MZ_TTS.btn.textContent = MZ_TTS.btn.dataset.etiket; MZ_TTS.btn = null; }
  }
  function mzTtsSoyle(metin) {
    const TTS = window.capEklenti && window.capEklenti('TextToSpeech');
    if (TTS) return TTS.speak({ text: metin, lang: 'ar-SA', rate: 0.7, queueStrategy: 0 });
    return new Promise((ok, no) => {
      const ss = window.speechSynthesis; if (!ss) return no(new Error('yok'));
      const u = new SpeechSynthesisUtterance(metin); u.lang = 'ar-SA'; u.rate = 0.7;
      const v = (ss.getVoices() || []).find(z => /^ar/i.test(z.lang)); if (v) u.voice = v;
      u.onend = ok; u.onerror = e => no(e); ss.speak(u);
    });
  }
  function mzTtsVarMi() {
    if (window.capEklenti && window.capEklenti('TextToSpeech')) return true;
    const ss = window.speechSynthesis; if (!ss) return false;
    const l = ss.getVoices ? ss.getVoices() : []; return !l.length || l.some(z => /^ar/i.test(z.lang));
  }
  async function mzTtsOku(satirlar, bas, son, btn) {
    if (MZ_TTS.btn === btn) return mzTtsDur();
    mzTtsDur(); sesDurdur();
    if (!mzTtsVarMi()) return toast(t('Cihazında Arapça konuşma sesi yok. Ayarlardan Arapça ses paketi yükleyebilirsin.'));
    const no = ++MZ_TTS.no; MZ_TTS.btn = btn; btn.dataset.etiket = btn.dataset.etiket || btn.textContent; btn.textContent = '⏹ ' + t('Durdur');
    try {
      for (let j = bas; j <= son; j++) {
        if (MZ_TTS.no !== no) return;
        const kart = document.getElementById('mz-' + j); if (kart) { kart.classList.add('calan'); kart.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        await mzTtsSoyle(satirlar[j].ar);
        if (kart) kart.classList.remove('calan');
      }
    } catch (e) { if (MZ_TTS.no === no) toast(t('Yapay ses çalınamadı.')); }
    if (MZ_TTS.no === no) mzTtsDur();
  }
  function mzSatirHTML(s, i, sev, oku) {
    const gizli = wi => sev === 3 || (sev === 2 && wi > 0) || (sev === 1 && wi % 2 === 1);
    const kel = s.ar.split(' ').map((w, wi) => `<span class="kelime${gizli(wi) ? ' gizli' : ''}">${esc(w)}</span>`).join(' ');
    return `<article class="kart mz-kart" id="mz-${i}">
      ${s.not ? `<p class="mz-not">ℹ️ ${esc(s.not)}</p>` : ''}
      <div class="ayet" dir="rtl" lang="ar">${kel}</div>
      ${s.ok ? `<p class="okunus${sev ? ' mz-ok-gizli' : ''}" ${sev ? `role="button" tabindex="0" aria-label="${t('Okunuşu göster')}"` : ''}>${esc(s.ok)}</p>` : ''}
      ${s.tr && !sev ? `<p class="meal">${esc(s.tr)}</p>` : ''}
      <div class="sesler">${s.parcaNo ? `<span class="rozet">${t('Parça {0}/{1}', s.parcaNo, s.parcaSay)}</span>` : ''}${s.n > 1 ? `<span class="rozet">${t('{0} kez söylenir', s.n)}</span>` : ''}${s.ses ? `<button class="sesbtn" data-ses="${s.ses}" data-yedek="${s.yedek}">${t('▶ Dinle')}</button>` : `<button class="sesbtn ikincil" data-mztts="${i}" data-etiket="🔈 ${t('Dinle')}">🔈 ${t('Dinle')}</button>`}
        ${oku ? `<button class="sesbtn ${oku.tamam ? 'yesil-btn' : 'ikincil'}" data-mzoku="${i}">${oku.tamam ? '✓ ' + t('Doğru') : '🎙️ ' + t('Oku')}</button>` : ''}</div>
      ${oku ? `<div class="mz-sonuc" id="mzSonuc${i}">${oku.html || ''}</div>` : ''}
    </article>`;
  }
  function mzGizliBagla() {
    app.querySelectorAll('.mz-kart .kelime.gizli').forEach(k => k.onclick = ev => { ev.stopPropagation(); k.classList.remove('gizli'); });
    app.querySelectorAll('.mz-ok-gizli').forEach(p => { const ac = () => p.classList.remove('mz-ok-gizli'); p.onclick = ac; p.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ac(); } }; });
  }
  EKRAN.muezzin = function (k) {
    const dua = k === 'dua', l = MZ(k).M, tamam = l.filter(x => mzDurum(x.id).tam).length;
    const sonraki = l.find(x => !mzDurum(x.id).tam), vadeli = l.filter(x => mzVadeli(mzDurum(x.id)));
    app.innerHTML = `${ust(dua ? t('🤲 Dualar') : t('🕌 Müezzinlik'))}<main>
      <section class="kart">
        <p>${dua ? t('Namazda okunan duaları ve günlük duaları sırayla ezberle: önce oku ve anlamına bak, sonra gizleyerek ezberden söyle.') : t('Ezan, kamet, selâ ve namaz sonrası tesbihatı sırayla ezberle. Sıra bir öneridir; istediğin metne geçebilirsin.')}</p>
        <div class="bar"><div class="iyi" style="width:${l.length ? Math.round(tamam / l.length * 100) : 0}%"></div></div>
        <p class="soluk kucukyazi">${t('{0}/{1} metin ezberlendi', tamam, l.length)}</p>
        ${vadeli.length ? `<p class="kucukyazi">🔁 <b>${t('Tekrar zamanı:')}</b> ${vadeli.map(x => esc(x.ad)).join(', ')}</p>` : ''}
        <div class="satir sola">${vadeli.length ? `<button class="btn" data-git="muezzinMetin|${vadeli[0].id}">${t('Tekrar et')}</button>` : sonraki ? `<button class="btn" data-git="muezzinMetin|${sonraki.id}">${t('Sıradaki: {0}', esc(sonraki.ad))}</button>` : ''}
          ${dua ? '' : `<button class="btn ikincil" data-git="muezzinProva|0">🎭 ${t('Namaz sonrası provası')}</button>`}</div>
      </section>
      <div class="bolumler">${l.map((x, i) => { const d = mzDurum(x.id);
        const durum = d.tam ? (mzVadeli(d) ? t('🔁 Tekrar zamanı') : t('✓ Ezberlendi')) : x.onay || !TEST_SURUM ? '' : t('Hoca onayı bekliyor');
        return `<button class="bolum" data-git="muezzinMetin|${x.id}"><span class="ikon">${d.tam ? '✅' : x.ikon}</span><span class="bad"><small>${[`${i + 1}.${x.alt ? ' ' + esc(x.alt) : ''}`, durum].filter(Boolean).join(' · ')}</small>${esc(x.ad)}</span><span class="rozet">›</span></button>`; }).join('')}</div>
      <p class="soluk kucukyazi" style="margin-top:12px">${dua ? t('Doğru okuyuşu bir hocadan dinleyerek öğren. Buradaki metinler sözleri ezberlemen içindir.') : t('Ezan, kamet ve selâ makamla okunur; makamı ve doğru okuyuşu bir hocadan öğren. Buradaki metinler sözleri ezberlemen içindir.')}</p>
      <details class="kural-ara"><summary>${t('Kaynaklar')}</summary><ul class="kucukyazi">${MZ(k).KAYNAKLAR.map(([ad, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${esc(ad)}</a></li>`).join('')}</ul>
        ${TEST_SURUM ? `<p class="soluk kucukyazi">${t('Okunuşlar ve anlamlar bu uygulama için yazıldı. "Hoca onayı bekliyor" yazan metinler bir hoca tarafından kontrol edildikten sonra onaylanacak.')}</p>` : ''}</details>
    </main>`;
  };
  // Ezber adımları (Ezber sekmesindeki gibi): Dinle → Bakarak oku → Yarısı gizli → Ezberden. Okuma adımlarında her satır
  // 🎙️ ile okunur; sözler doğruysa satır ✓ olur, hepsi ✓ olunca sonraki adım açılır, son adım bitince metin ezberlenmiş sayılır.
  // Kelimeler okurken açılmaz (canlı takip yok): satır okunup bitince değerlendirilir.
  const MZT = { id: '', adim: -1, tamam: {}, html: {} };
  const MZ_GECME = 80;
  EKRAN.muezzinMetin = function (id) {
    mzTtsDur();
    const x = mzBul(id); if (!x) { ekranYigini.pop(); return ciz(); }
    const satirlar = mzSatirlar(x);
    if (!satirlar) { app.innerHTML = `${ust(esc(x.ad))}<main><p class="soluk">${t('Yükleniyor…')}</p></main>`; mzYukle(x, 'muezzinMetin'); return; }
    if (x.kuran && DIL !== 'en' && !MEAL['tr' + x.kuran[0][0]]) mzYukle(x, 'muezzinMetin');
    const d = mzDurum(x.id), l = MZ(mzKol(x)).M, i = l.indexOf(x), sonraki = l[i + 1];
    const sesler = satirlar.filter(s => s.ses).map(s => s.ses);
    const ADIM = [t('Dinle'), t('Bakarak'), t('Yarısı'), t('Ezberden')], ilkAdim = sesler.length ? 0 : 1;
    S.mzAdim = S.mzAdim || {};
    const adim = Math.max(ilkAdim, Math.min(3, S.mzAdim[x.id] != null ? S.mzAdim[x.id] : ilkAdim));
    if (MZT.id !== x.id || MZT.adim !== adim) Object.assign(MZT, { id: x.id, adim, tamam: {}, html: {} });
    const sev = adim <= 1 ? 0 : adim === 2 ? 1 : 3, okuma = adim >= 1 && window.MediaRecorder;
    const dogruSay = satirlar.filter((_, j) => MZT.tamam[j]).length;
    const yonerge = adim === 0 ? t('Önce dinle: metni gözünle takip ederek kayıttan dinle. Bitince "Dinledim" ile sonraki adıma geç.')
      : adim === 1 ? t('Metne bakarak her satırı 🎙️ ile oku. Sözler doğruysa satır ✓ olur.')
      : adim === 2 ? t('Kelimelerin yarısı gizli. Her satırı 🎙️ ile oku; takıldığın kelimeye dokunup bakabilirsin.')
      : t('Hepsi gizli. Her satırı ezberden 🎙️ ile oku. Hepsi ✓ olunca ezberlenmiş sayılır.');
    app.innerHTML = `${ust(esc(x.ad))}
      <nav class="ez-adimlar" aria-label="${t('Adımlar')}" style="--n:${4 - ilkAdim}">${ADIM.slice(ilkAdim).map((ad, k) => { const j = k + ilkAdim; return `<button class="ez-adim ${j < adim || (d.tam && j === 3) ? 'tamam' : j === adim ? 'aktif' : ''}" data-mzadim="${j}" ${j === adim ? 'aria-current="step"' : ''}><span></span>${ad}</button>`; }).join('')}</nav>
      <main>
      <section class="kart ezber-ust">
        <p class="soluk kucukyazi">${i + 1}/${l.length}${x.alt ? ' · ' + esc(x.alt) : ''} ${x.onay || !TEST_SURUM ? '' : `· <span class="rozet uyari">${t('Hoca onayı bekliyor')}</span>`}</p>
        ${x.not ? `<p class="mz-not">ℹ️ ${esc(x.not)}</p>` : ''}
        <p>${yonerge}</p>
        ${adim >= 1 ? `<p class="kucukyazi"><b>${t('{0}/{1} satır doğru', dogruSay, satirlar.length)}</b></p>` : ''}
        <div class="satir sola">${sesler.length ? `<button class="btn ${adim === 0 ? '' : 'ikincil'}" id="mzHepsi">${t('▶ Tamamını dinle')}</button>` : `<button class="btn ${adim === 0 ? '' : 'ikincil'}" id="mzTtsHepsi" data-etiket="🔈 ${t('Tamamını dinle (yapay ses)')}">🔈 ${t('Tamamını dinle (yapay ses)')}</button>
          <span class="soluk kucukyazi">🎙️ ${mzKol(x) === 'dua' ? t('Bu duanın insan kaydı henüz yok.') : t('Bu metnin müezzin kaydı henüz yok.')} ${t('Yapay ses makamsızdır ve telaffuzu kusurlu olabilir; doğru okuyuşu hocandan dinle.')}</span>`}
          ${adim === 0 ? `<button class="btn ikincil" id="mzDinledim">${t('Dinledim, sonraki adım ›')}</button>` : ''}</div>
        ${kayitHTML('mz-' + x.id, sesler[0] || '')}${sesler[0] ? `<span hidden data-yedek data-ses="${sesler[0]}"></span>` : ''}
      </section>
      ${satirlar.map((s_, j) => mzSatirHTML(s_, j, sev, okuma ? { tamam: MZT.tamam[j], html: MZT.html[j] } : null)).join('')}
      <section class="kart">
        ${adim >= 1 ? `<p class="soluk kucukyazi">${t('Yapay zekâ sözleri kontrol eder; makamı ve tecvidi değil. Son söz hocanındır.')}</p>` : ''}
        <div class="satir sola"><button class="btn ${adim >= 1 ? 'ikincil' : ''}" id="mzEzber">${d.tam ? t('✓ Tekrar ettim') : t('✓ Ezberledim')}</button>
          ${sonraki ? `<button class="btn ikincil" data-git="muezzinMetin|${sonraki.id}">${t('Sonraki: {0}', esc(sonraki.ad))} ›</button>` : ''}</div>
        ${d.tam ? `<p class="soluk kucukyazi">${t('Ezberlendi. Sonraki tekrar: {0}', new Date(d.vade).toLocaleDateString(DIL === 'en' ? 'en-GB' : 'tr-TR'))}</p>` : ''}
        <p class="soluk kucukyazi">📚 ${esc(x.kaynak || '')}</p>
      </section>
    </main>`;
    mzGizliBagla();
    const adimaGec = j => { S.mzAdim[x.id] = j; kaydet(); ciz(); window.scrollTo(0, 0); };
    app.querySelectorAll('[data-mzadim]').forEach(b => b.onclick = () => adimaGec(+b.dataset.mzadim));
    const h = $('#mzHepsi'); if (h) h.onclick = () => arkaArka(sesler, h);
    const th = $('#mzTtsHepsi'); if (th) th.onclick = () => mzTtsOku(satirlar, 0, satirlar.length - 1, th);
    app.querySelectorAll('[data-mztts]').forEach(b => b.onclick = () => { const j = +b.dataset.mztts; mzTtsOku(satirlar, j, j, b); });
    const dn = $('#mzDinledim'); if (dn) dn.onclick = () => adimaGec(1);
    const ezberle = () => { mzIsaretle(x.id); toast(d.tam ? t('Tekrar kaydedildi ✓') : t('Maşallah! "{0}" ezberlendi 🎉', x.ad)); };
    $('#mzEzber').onclick = () => { ezberle(); if (!d.tam && sonraki) { ekranYigini[ekranYigini.length - 1] = ['muezzinMetin', [sonraki.id]]; } ciz(); };
    app.querySelectorAll('[data-mzoku]').forEach(b => b.onclick = () => mzSatirOku(x, satirlar, +b.dataset.mzoku, b, () => {
      if (satirlar.every((_, j) => MZT.tamam[j])) {
        if (adim < 3) { toast(t('Bütün satırlar doğru! Sonraki adım: {0}', ADIM[adim + 1])); setTimeout(() => { if (ekranYigini[ekranYigini.length - 1][0] === 'muezzinMetin') adimaGec(adim + 1); }, 1200); }
        else { ezberle(); if (window.Konfeti) Konfeti.patlat(b, 24); setTimeout(() => { if (ekranYigini[ekranYigini.length - 1][0] === 'muezzinMetin') ciz(); }, 1200); }
      }
    }));
  };
  let MZ_KAYIT = null;
  async function mzSatirOku(x, satirlar, j, btn, bitince) {
    if (MZ_KAYIT) { if (MZ_KAYIT.btn === btn) MZ_KAYIT.rec.stop(); return; }
    const s_ = satirlar[j], kutu = $('#mzSonuc' + j); if (!kutu) return;
    if (!navigator.mediaDevices || !window.MediaRecorder) return toast(t('Bu cihazda ses kaydı desteklenmiyor.'));
    let O, ref = null;
    try { [O] = await Promise.all([okumaHazirla(), s_.parca ? null : mzFonetik().then(f => { ref = f[s_.fkey]; })]); } catch (e) { return toast(t('Değerlendirme yüklenemedi. İnternet bağlantını kontrol et.')); }
    if (!s_.parca && !ref) return toast(t('Bu satır için değerlendirme yok.'));
    let akis; try { akis = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); } catch (e) { return toast(t('Mikrofon izni verilmedi. Telefon ayarlarından Kur\'an Yolum için mikrofona izin ver.')); }
    sesDurdur(); O.modelAc().catch(() => { });
    const parca = [], rec = new MediaRecorder(akis); MZ_KAYIT = { rec, btn };
    btn.textContent = '⏹ ' + t('Bitir'); btn.classList.add('kirmizi-btn', 'kaydediyor');
    kutu.innerHTML = `<p class="soluk">🎙️ ${t('Dinliyorum… Satırı oku, bitince ⏹ düğmesine dokun.')}</p>`;
    const kelime = s_.ar.split(' ').length, zaman = setTimeout(() => rec.state !== 'inactive' && rec.stop(), Math.min(29, Math.round(kelime * 1.6 + 5)) * 1000);
    rec.ondataavailable = e => { if (e.data && e.data.size) parca.push(e.data); };
    rec.onstop = async () => {
      clearTimeout(zaman); akis.getTracks().forEach(z => z.stop()); MZ_KAYIT = null;
      btn.classList.remove('kirmizi-btn', 'kaydediyor'); btn.textContent = t('Değerlendiriliyor…'); btn.disabled = true;
      kutu.innerHTML = `<p class="soluk">${t('Kontrol ediliyor…')}</p>`;
      let html;
      try {
        const r = await O.metinRaporu(ref, new Blob(parca, { type: rec.mimeType || 'audio/webm' }), s_.parca);
        const yanlis = r.kelimeler.map((w, k) => [w, k]).filter(([w]) => w.notes.some(z => z.severity === 'jali')).map(([, k]) => s_.ar.split(' ')[k]).filter(Boolean);
        const tamam = !!r.heard && r.soz >= MZ_GECME && yanlis.length <= Math.floor(kelime / 8);
        MZT.tamam[j] = tamam;
        html = !r.heard ? `<p class="r-orta">${t('Sesini duyamadım. Biraz daha yüksek ve yakından oku.')}</p>`
          : tamam ? `<p class="r-iyi"><b>✓ ${t('Sözler doğru')}</b> <small class="soluk">%${r.soz}</small></p>`
          : `<p class="r-orta"><b>${t('Bir daha dene')}</b> <small class="soluk">%${r.soz}</small></p>${yanlis.length ? `<p class="kucukyazi">${t('Dikkat et:')} <span class="ar">${esc(yanlis.join(' · '))}</span></p>` : ''}`;
        seriGuncelle(); kaydet();
      } catch (e) { html = `<p class="hata">${esc(e.message || t('Kontrol edilemedi.'))}</p>`; }
      MZT.html[j] = html;
      if (!document.body.contains(kutu)) return;
      kutu.innerHTML = html; btn.disabled = false;
      btn.textContent = MZT.tamam[j] ? '✓ ' + t('Doğru') : '🎙️ ' + t('Tekrar oku'); btn.classList.toggle('yesil-btn', !!MZT.tamam[j]); btn.classList.toggle('ikincil', !MZT.tamam[j]);
      const say = $('.ezber-ust .kucukyazi b'); if (say) say.textContent = t('{0}/{1} satır doğru', satirlar.filter((_, k) => MZT.tamam[k]).length, satirlar.length);
      bitince();
    };
    rec.start();
  }
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
      let akis; try { akis = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { return toast(t('Mikrofon izni verilmedi. Telefon ayarlarından Kur\'an Yolum için mikrofona izin ver.')); }
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
  // ------------------------------------------------------------ Okuyarak pekiştir (karar: claude/inceleme-2026-11-18-kelime-okuma-alistirmasi.md)
  // Dersin örnek kelimeleri tek tek: kâriden dinle → oku → yüzde, kategori dökümü, konunun kuralı önce, "nerede kaybettin", iki kayıt yan yana.
  // Kayıt telefonda kalır, gönderilmez. Sonuçlar S.pekistir[ders] = { k: { anahtar: yüzde }, t }.
  const PK_ADET = 5;
  const pkKelimeNo = ex => { const [a, b] = ex.w.length === 2 ? ex.w : [ex.w[0], ex.w[0]]; const l = []; for (let i = a; i <= b; i++) l.push(i); return l; };
  const pkOrnekler = u => (u.ornek || []).filter(ex => ex.r && ex.w && AYAH[ex.r]).filter((ex, i, l) => l.findIndex(y => y.r === ex.r && y.w.join() === ex.w.join()) === i).slice(0, PK_ADET);
  const pkVar = u => pkOrnekler(u).length >= 2;
  let PK = null;   // { id, i, kayit: { url, blob }, sonuc, kayitci }
  const PK_KAT = () => [['harf', t('Harfler ve mahreç')], ['hareke', t('Harekeler')], ['med', t('Med')], ['diger', t('Diğer tecvid kuralları')]];
  EKRAN.pekistir = function (id, i) {
    const u = unitById(id); if (!u) return geri();
    const l = pkOrnekler(u); i = Math.min(Math.max(0, +i || 0), l.length);
    if (!PK || PK.id !== id || PK.i !== i) { if (PK && PK.kayit) try { URL.revokeObjectURL(PK.kayit.url); } catch (e) { } PK = { id, i, kayit: null, sonuc: null }; }
    const sonuclar = (S.pekistir && S.pekistir[id] && S.pekistir[id].k) || {};
    // ---- seri sonu
    if (i >= l.length) {
      const yuz = l.map(ex => sonuclar[ex.r + '#' + ex.w.join('-')]).filter(x => x != null), ort = yuz.length ? Math.round(yuz.reduce((a, b) => a + b, 0) / yuz.length) : null;
      app.innerHTML = `${ust(t('Okuyarak pekiştir'))}<main>
        <section class="kart pk-son"><h2>${esc(u.ad)}</h2>${ort != null ? `<div class="pk-halka" style="--p:${ort}"><b>%${ort}</b></div><p>${t('{0} kelimenin ortalaması', yuz.length)}</p>` : `<p>${t('Hiç kelime okunmadı.')}</p>`}
          <ul class="pk-liste">${l.map((ex, j) => { const y = sonuclar[ex.r + '#' + ex.w.join('-')]; return `<li><span class="ar">${esc(pkKelimeNo(ex).map(k => AYAH[ex.r].split(' ')[k - 1]).join(' ').replace(/\u06DE/g, ''))}</span><b class="${y == null ? 'soluk' : y >= 85 ? 'yesil' : y >= 60 ? 'turuncu' : 'kirmizi'}">${y == null ? '—' : '%' + y}</b><button class="link" data-pk-git="${j}">${t('Tekrar')}</button></li>`; }).join('')}</ul>
          <p class="soluk kucukyazi">${t('Yapay zekâ yanılabilir; son söz hocanındır.')}</p>
          <div class="satir"><button class="btn ikincil" data-pk-git="0">${t('Baştan oku')}</button><button class="btn" data-git-ders="${id}">${t('Alıştırmaya geç ›')}</button></div></section></main>`;
      app.querySelectorAll('[data-pk-git]').forEach(b => b.onclick = () => { PK = null; ekranYigini[ekranYigini.length - 1] = ['pekistir', [id, +b.dataset.pkGit]]; ciz(); });
      const dg = app.querySelector('[data-git-ders]'); if (dg) dg.onclick = () => { ekranYigini.pop(); ekranYigini[ekranYigini.length - 1] = ['ders', [id, 'alistirma']]; ciz(); };
      return;
    }
    const ex = l[i], kn = pkKelimeNo(ex), kel = AYAH[ex.r].split(' ').map(k => k.replace(/\u06DE/g, '')), ofs = []; let o = 0; for (const k of kel) { ofs.push(o); o += k.length + 1; }
    const kelimeYazi = kn.map(k => kelimeHTML(ex.r, kel[k - 1], ofs[k - 1])).join(' ');
    const [n, a] = ex.r.split(':').map(Number), anahtar = ex.r + '#' + ex.w.join('-'), s = PK.sonuc;
    let sonucHTML = '';
    if (s && s.hata) sonucHTML = `<section class="kart pk-sonuc"><p class="hata">${esc(s.hata)}</p></section>`;
    else if (s) {
      const y = s.puan.yuzde, notlar = s.kelimeler.flatMap(w => w.notes.map(z => Object.assign({ w: w.index }, z)));
      const konu = notlar.filter(z => KURAL_BOLUM[z.rule.replace(':uneven', '')] === id), diger = notlar.filter(z => !konu.includes(z));
      const sirali = konu.concat(diger.sort((x, z) => (z.severity === 'jali') - (x.severity === 'jali'))).slice(0, 3);
      const kelimeAr = wi => esc(kel[kn[Math.min(wi, kn.length - 1)] - 1]);
      sonucHTML = `<section class="kart pk-sonuc ${y >= 85 ? 'iyi' : y >= 60 ? 'orta' : 'kotu'}" aria-live="polite">
        <p class="pk-ust">${t('Ölçülen alanlardaki sonucun')}</p>
        <div class="pk-halka" style="--p:${y}"><b>%${y}</b></div>
        <p class="pk-yorum">${!notlar.length ? t('Temiz. Önce dinleyip sonra okumak işe yarıyor.') : konu.length ? t('Bu dersin konusunda düzeltilecek bir yer var.') : t('Konunun kuralı doğru; başka bir yerde küçük bir düzeltme var.')}</p>
        ${sirali.length ? `<h3>${t('Nerede puan kaybettin?')}</h3>${sirali.map(z => `<div class="pk-hata ${z.severity === 'jali' ? 'acik' : ''}"><span class="ar">${kelimeAr(z.w)}</span><div><p>${esc(z.msg)}</p><small>${esc(kuralAdi(z.rule))} · ${z.severity === 'jali' ? t('açık hata') : t('ince hata')}</small></div></div>`).join('')}
          <div class="satir"><button class="btn ikincil" id="pkKari2">▶ ${t('Kâriden dinle')}</button><button class="btn ikincil" id="pkBen2">▶ ${t('Senin okuyuşun')}</button></div>` : ''}
        <details class="pk-ayrinti"><summary>${t('Ayrıntılı değerlendirme')}</summary>
          ${PK_KAT().map(([k, ad]) => { const v = s.puan.kat[k]; return `<div class="pk-kat"><span>${ad}</span><b>${v ? `${v[0]} / ${v[1]}` : '—'}</b>${v ? `<i style="--p:${Math.round(v[0] / v[1] * 100)}"></i>` : ''}</div>`; }).join('')}
          <p class="soluk kucukyazi">${t('"—": bu kelimede o alanda ölçülecek bir şey yok. Açık hata tam, ince hata yarım puan düşürür.')}</p></details>
        <p class="soluk kucukyazi">${t('Yapay zekâ yanılabilir; son söz hocanındır.')}</p></section>`;
    }
    const kayitVar = !!(PK.kayit && PK.kayit.url);
    app.innerHTML = `${ust(esc(u.ad), true, `<span class="pk-sayac">${i + 1}/${l.length}</span>`)}<div class="ilerleme"><div style="width:${Math.round(i / l.length * 100)}%"></div></div>
      <main class="pk-ekran">
        <section class="kart pk-kelime"><div class="ar pk-ar" dir="rtl" lang="ar">${kelimeYazi}</div><p class="okunus">🗣️ ${esc(ex.oku)}</p><p class="soluk kucukyazi">${esc(ex.n)}</p></section>
        <div class="pk-dugmeler"><button class="btn ikincil" id="pkKari">🔊 ${t('Kâriden dinle')}</button>${kayitVar ? `<button class="btn ikincil" id="pkBen">▶ ${t('Senin okuyuşun')}</button>` : ''}</div>
        ${s ? sonucHTML : `<p class="pk-yonerge">${t('Önce kâriden dinle, sonra 🎙️ düğmesine dokun ve kelimeyi kendi sesinle oku. Bitince tekrar dokun.')}</p>`}
      </main>
      <div class="pk-alt">${s ? `<button class="btn ikincil" id="pkTekrar">🎙️ ${t('Bir daha dene')}</button><button class="btn" id="pkDevam">${i + 1 < l.length ? t('Devam ›') : t('Bitir ✓')}</button>`
        : `<button class="btn ikincil" id="pkAtla">${t('Atla')}</button><button class="btn pk-mik" id="pkOku">🎙️ ${t('Oku')}</button>`}</div>`;
    const kariCal = b => arkaArka(kn.map(k => kelimeUrl(ex.r, k)), b), benCal = b => { if (PK.kayit) cal(PK.kayit.url, b); };
    $('#pkKari').onclick = e => kariCal(e.currentTarget);
    const pb = $('#pkBen'); if (pb) pb.onclick = e => benCal(e.currentTarget);
    const k2 = $('#pkKari2'); if (k2) k2.onclick = e => kariCal(e.currentTarget);
    const b2 = $('#pkBen2'); if (b2) b2.onclick = e => benCal(e.currentTarget);
    const ileri = () => { PK = null; ekranYigini[ekranYigini.length - 1] = ['pekistir', [id, i + 1]]; ciz(); window.scrollTo(0, 0); };
    const at = $('#pkAtla'); if (at) at.onclick = ileri;
    const dv = $('#pkDevam'); if (dv) dv.onclick = ileri;
    const kaydetBasla = async btn => {
      if (PK.kayitci) { PK.kayitci.stop(); return; }
      if (!navigator.mediaDevices || !window.MediaRecorder) return toast(t('Bu cihazda ses kaydı desteklenmiyor.'));
      let O; try { O = await okumaHazirla(); } catch (e) { return toast(e.message); }
      let akis; try { akis = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 } }); } catch (e) { return toast(t('Mikrofon izni verilmedi. Telefon ayarlarından Kur\'an Yolum için mikrofon iznini aç.')); }
      sesDurdur(); O.modelAc().catch(() => { });
      const parca = [], rec = new MediaRecorder(akis); PK.kayitci = rec;
      btn.textContent = '⏹ ' + t('Bitir'); btn.classList.add('kirmizi-btn', 'kaydediyor');
      const z = setTimeout(() => rec.state !== 'inactive' && rec.stop(), 12000);
      rec.ondataavailable = e => { if (e.data && e.data.size) parca.push(e.data); };
      rec.onstop = async () => {
        clearTimeout(z); akis.getTracks().forEach(x => x.stop()); PK.kayitci = null;
        if (!document.body.contains(btn)) return;
        btn.textContent = t('Değerlendiriliyor…'); btn.disabled = true; btn.classList.remove('kirmizi-btn', 'kaydediyor');
        const blob = new Blob(parca, { type: rec.mimeType || 'audio/webm' });
        if (PK.kayit) try { URL.revokeObjectURL(PK.kayit.url); } catch (e) { }
        PK.kayit = { blob, url: URL.createObjectURL(blob) };
        try {
          const son = kel[kn[kn.length - 1] - 1], tenvin = /[ً-ࣰٍ-ࣲ]/.test(son);
          PK.sonuc = await O.kelimeRaporu(n, a, kn, blob, { tenvin, ilkKelime: kel[kn[0] - 1] });
          S.pekistir = S.pekistir || {}; const kayit = S.pekistir[id] = S.pekistir[id] || { k: {} };
          kayit.k[anahtar] = PK.sonuc.puan.yuzde; kayit.t = simdi(); seriGuncelle(); kaydet();
        } catch (e) { PK.sonuc = { hata: e.message || t('Değerlendirilemedi.') }; }
        if (ekranYigini[ekranYigini.length - 1][0] === 'pekistir') { ciz(); setTimeout(() => { const r = $('.pk-sonuc'); if (r) r.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80); }
      };
      rec.start();
    };
    const ok_ = $('#pkOku'); if (ok_) ok_.onclick = e => kaydetBasla(e.currentTarget);
    const tk = $('#pkTekrar'); if (tk) tk.onclick = e => { PK.sonuc = null; ciz(); const b = $('#pkOku'); if (b) kaydetBasla(b); };
  };
  function raporKaydet(n, a, sonuc) {
    const K = sonuc.kelimeler, notlar = [];
    K.forEach(w => w.notes.forEach(z => notlar.push([w.index, z.rule, z.severity === 'jali' ? 'j' : 'k', z.msg])));
    S.okuma = (S.okuma || []).concat([{ t: simdi(), n, a, w: K.length, j: notlar.filter(x => x[2] === 'j').length, k: notlar.filter(x => x[2] === 'k').length, notlar }]).slice(-300);
    seriGuncelle(); kaydet();
  }

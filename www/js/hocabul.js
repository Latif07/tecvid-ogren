/* "Hocamı bul": sesin perdesi, aralığı ve hızı. Aynı kod hem telefonda (kullanıcının Fâtiha'sı) hem GitHub Actions'ta
   (kârilerin Fâtiha kayıtları, tools/kari-ses.js) çalışır; böylece iki taraf aynı biçimde ölçülür.
   Girdi: 16 kHz mono Float32Array, Fâtiha'nın tamamı (hız, aynı metnin süresinden çıkar). Ses hiçbir yere gönderilmez. */
(function (kok) {
  const SR = 16000, PEN = 640, ADIM = 160;          // 40 ms pencere, 10 ms adım
  const FMIN = 65, FMAX = 650;                      // erkek pes sesten çocuk sesine
  const yuzdelik = (l, p) => { if (!l.length) return NaN; const s = Float64Array.from(l).sort(); const i = (s.length - 1) * p, a = Math.floor(i), b = Math.ceil(i); return s[a] + (s[b] - s[a]) * (i - a); };
  const yarim = f => 12 * Math.log2(f / 55);        // 55 Hz (La1) = 0 yarım ses

  // YIN (de Cheveigné & Kawahara 2002): bir pencerenin temel frekansı (Hz) ya da 0 (sessiz/gürültü)
  const tMin = Math.floor(SR / FMAX), tMax = Math.ceil(SR / FMIN), W = PEN - tMax, d = new Float64Array(tMax + 2);
  function yin(x, o) {
    let top = 0; d[0] = 1;
    for (let t = 1; t <= tMax + 1; t++) {
      let s = 0; for (let i = 0; i < W; i++) { const f = x[o + i] - x[o + i + t]; s += f * f; }
      top += s; d[t] = top ? s * t / top : 1;          // birikimli ortalamayla normalleştirilmiş fark
    }
    let t = tMin; while (t <= tMax && d[t] >= 0.15) t++;
    if (t > tMax) return 0;
    while (t < tMax && d[t + 1] < d[t]) t++;            // çukurun dibi
    const a = d[t - 1], b = d[t], c = d[t + 1], pay = a - 2 * b + c;
    return SR / (pay > 0 ? t + 0.5 * (a - c) / pay : t);
  }

  function ozellik(ses) {
    const n = Math.floor((ses.length - PEN) / ADIM) + 1; if (n < 50) return null;
    const rms = new Float64Array(n);
    for (let k = 0; k < n; k++) { let s = 0; const o = k * ADIM; for (let i = 0; i < PEN; i++) s += ses[o + i] * ses[o + i]; rms[k] = Math.sqrt(s / PEN); }
    const tepe = yuzdelik(Array.from(rms), 0.95), taban = yuzdelik(Array.from(rms), 0.1);
    const esik = Math.max(taban * 2.5, tepe * 0.08, 1e-4);
    const f0 = [], ses_ = new Uint8Array(n); let aktif = 0;
    for (let k = 0; k < n; k++) {
      if (rms[k] < esik) continue; aktif++;
      if (k + (PEN + 2) / ADIM >= n) continue; const f = yin(ses, k * ADIM); if (f) { f0.push(yarim(f)); ses_[k] = 1; }
    }
    if (f0.length < 40) return null;                  // 0,4 sn'den az sesli kısım: ölçülemez
    const sure = aktif * ADIM / SR;
    return {
      perde: +yuzdelik(f0, 0.5).toFixed(2),           // ortanca perde, 55 Hz'e göre yarım ses
      pes: +yuzdelik(f0, 0.1).toFixed(2), tiz: +yuzdelik(f0, 0.9).toFixed(2),
      aralik: +(yuzdelik(f0, 0.9) - yuzdelik(f0, 0.1)).toFixed(2),
      sure: +sure.toFixed(1),                         // sesin olduğu süre (sessizlikler hariç): aynı metinde okuma hızını verir hz: Math.round(55 * Math.pow(2, yuzdelik(f0, 0.5) / 12)),
    };
  }

  // Kullanıcı ile kâri arasındaki fark. Perde oktavdan bağımsız: kadın/çocuk sesi bir oktav tiz olabilir.
  function karsilastir(u, k) {
    const ham = u.perde - k.perde, oktav = Math.round(ham / 12), perdeFark = ham - 12 * oktav;
    const aralikFark = u.aralik - k.aralik, hizOran = k.sure / u.sure;   // aynı metin (Fâtiha): kısa süre = hızlı
    const uzaklik = 0.5 * Math.abs(perdeFark) / 3 + 0.2 * Math.abs(aralikFark) / 4 + 0.3 * Math.abs(Math.log(hizOran)) / Math.log(1.3);
    return { uzaklik, perdeFark, oktav, aralikFark, hizOran };
  }
  function enYakin(u, profiller, adet = 3) {
    return profiller.filter(p => p.perde != null).map(p => Object.assign({ kari: p }, karsilastir(u, p))).sort((a, b) => a.uzaklik - b.uzaklik).slice(0, adet);
  }
  const api = { SR, ozellik, karsilastir, enYakin };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else kok.HocaBul = api;
})(typeof window !== 'undefined' ? window : globalThis);

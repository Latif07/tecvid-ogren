// Kelime değerlendirmesi testi: test-ses dalındaki kâri kelime kayıtlarıyla (D klasörü: test-ses dalının klonu). Doğru kayıt yüksek, başka kelime düşük puan almalı.
// Kelime değerlendirmesi: doğru kâri kaydı yüksek, başka kelimenin kaydı düşük puan almalı
const { chromium } = require('playwright'); const fs = require('fs'); const { execFileSync } = require('child_process');
const D = process.env.SES_KLASORU || __dirname + '/../bag2/';
const dosyalar = fs.readdirSync(D).filter(f => f.startsWith('kelime_'));
const oku = f => { const b = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', D + f, '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'], { maxBuffer: 1e8 }); return Buffer.from(b).toString('base64'); };
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
  await p.goto('http://localhost:8080/index.html'); await p.waitForTimeout(800);
  await p.evaluate(() => new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'js/okuma.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); }));
  await p.evaluate(() => window.Okuma.modelAc());
  const sonuc = [];
  for (const f of dosyalar) {
    const [, s, a, w] = f.match(/(\d+)_(\d+)_(\d+)/).map(Number);
    const yanlis = dosyalar[(dosyalar.indexOf(f) + 7) % dosyalar.length];
    for (const [ses, etiket] of [[f, 'doğru'], [yanlis, 'başka kelime']]) {
      const r = await p.evaluate(async ([b64, s, a, w]) => {
        const bin = atob(b64), buf = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
        const ses = new Float32Array(buf.buffer); const kel = window.AYAH[s + ':' + a].split(' ')[w - 1];
        try { const x = await window.Okuma.kelimeRaporu(s, a, [w], ses, { tenvin: /[ً-ࣰٍ-ࣲ]/.test(kel), ilkKelime: kel }); return { y: x.puan.yuzde, kat: x.puan.kat, not: x.kelimeler.flatMap(k => k.notes.map(z => z.rule + ':' + z.severity)).join(','), kel }; }
        catch (e) { return { hata: e.message, kel }; }
      }, [oku(ses), s, a, w]);
      sonuc.push({ kelime: `${s}:${a}#${w}`, ses: etiket, ...r });
    }
  }
  for (const r of sonuc) console.log(`${r.kelime.padEnd(9)} ${r.ses.padEnd(13)} ${r.hata ? 'HATA ' + r.hata : '%' + String(r.y).padEnd(4) + ' ' + (r.not || '—')}`);
  const d = sonuc.filter(r => r.ses === 'doğru' && !r.hata), y = sonuc.filter(r => r.ses !== 'doğru' && !r.hata);
  const ort = l => Math.round(l.reduce((s, r) => s + r.y, 0) / l.length);
  console.log(`\nDoğru kayıt ortalaması %${ort(d)} (en düşük %${Math.min(...d.map(r => r.y))}) · başka kelime ortalaması %${ort(y)} (en yüksek %${Math.max(...y.map(r => r.y))})`);
  await b.close();
})();

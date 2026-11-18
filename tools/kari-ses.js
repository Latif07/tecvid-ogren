// "Hocamı bul" için kârilerin ses ölçüleri: her kârinin Fâtiha kaydı (1:1–1:7) indirilir, telefondakiyle aynı kodla
// (www/js/hocabul.js) ölçülür ve www/data/kari-ses.json'a yazılır. GitHub Actions'ta çalışır (kari-ses.yml).
const fs = require('fs'), { execFileSync } = require('child_process'), path = require('path');
const H = require('../www/js/hocabul.js');
const app = fs.readFileSync(path.join(__dirname, '../www/js/app.js'), 'utf8');
const liste = [...app.matchAll(/\{ id: '([^']+)', klasor: '([^']+)'/g)].map(m => ({ id: m[1], klasor: m[2] }));
const pad = n => String(n).padStart(3, '0');
const url = (k, a) => k.startsWith('ar_') ? `https://webdosya.diyanet.gov.tr/kuran/kuranikerim/Sound/${k}/1_${a}.mp3` : `https://everyayah.com/data/${k}/${pad(1)}${pad(a)}.mp3`;
const gec = fs.mkdtempSync('/tmp/kari-'), sonuc = {};
for (const { id, klasor } of liste) {
  try {
    const dosyalar = [];
    for (let a = 1; a <= 7; a++) { const f = path.join(gec, `${id}_${a}.mp3`); execFileSync('curl', ['-sSfL', '--retry', '3', '-o', f, url(klasor, a)]); dosyalar.push(f); }
    // ayetler arasına 0,5 sn sessizlik; 16 kHz mono float
    const raw = path.join(gec, id + '.raw');
    const giris = dosyalar.flatMap(f => ['-i', f]);
    const filtre = dosyalar.map((_, i) => `[${i}:a]aresample=16000,aformat=channel_layouts=mono,apad=pad_dur=0.5[a${i}]`).join(';') + ';' + dosyalar.map((_, i) => `[a${i}]`).join('') + `concat=n=${dosyalar.length}:v=0:a=1[o]`;
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...giris, '-filter_complex', filtre, '-map', '[o]', '-ac', '1', '-ar', '16000', '-f', 'f32le', raw]);
    const b = fs.readFileSync(raw), ses = new Float32Array(b.buffer, b.byteOffset, b.length / 4);
    const o = H.ozellik(ses); sonuc[id] = o; console.log(id.padEnd(22), JSON.stringify(o));
  } catch (e) { console.log(id.padEnd(22), 'HATA', String(e.message).slice(0, 200)); }
}
const cikti = { aciklama: 'Hocamı bul: kârilerin Fâtiha (1:1-1:7) ses ölçüleri. tools/kari-ses.js ile üretildi; elle düzenlemeyin.', tarih: new Date().toISOString().slice(0, 10), kariler: sonuc };
fs.mkdirSync(path.join(__dirname, '../www/data'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '../www/data/kari-ses.json'), JSON.stringify(cikti, null, 1));
console.log('Ölçülen:', Object.keys(sonuc).length, '/', liste.length);

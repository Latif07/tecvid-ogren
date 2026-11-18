// Harf kartları için Kur'an'dan örnek kelime adayları üretir (kısa sûreler, gerçek kâri kelime sesi var).
// Çıktı: www/js/harfkart-kelime.js. Liste hocaya onaylatılır (claude/toplanti-2026-11-18-harf-kartlari.md).
// Kullanım: node tools/harf-kelime.js
const fs = require('fs'), path = require('path');
const KOK = path.join(__dirname, '..', 'www');
const SURELER = [1]; for (let n = 114; n >= 78; n--) SURELER.push(n);   // Fâtiha ve Amme cüzü, kısa sûreler önce
const FETHA = 'َ', KESRE = 'ِ', OTRE = 'ُ', SEDDE = 'ّ', CEZM = ['ۡ', 'ْ'], TENVIN = ['ً', 'ٌ', 'ٍ', 'ࣰ', 'ࣱ', 'ࣲ'];
const HEMZE = { 'ء': 1, 'أ': 1, 'إ': 1, 'ؤ': 1, 'ئ': 1 };
const HARFLER = 'ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن و ه ي ء'.split(' ');
const harfMi = c => /[ء-غف-يٱ]/.test(c);
// Kelimeyi harf + işaretler parçalarına ayır
function parcala(k) { const l = []; for (const c of k) { if (harfMi(c)) l.push({ h: c, i: '' }); else if (l.length) l[l.length - 1].i += c; } return l; }
const aday = {}; HARFLER.forEach(h => aday[h] = []);
for (const n of SURELER) {
  const x = JSON.parse(fs.readFileSync(path.join(KOK, 'kuran', String(n).padStart(3, '0') + '.json')));
  x.ayet.forEach((a, ai) => {
    let w = 0;
    a.split(' ').forEach(k => {
      if (!/[ء-يٱ]/.test(k)) return; w++;
      const temiz = k.replace(/[ۖ-ۜ۞]/g, '');
      const p = parcala(temiz), uz = p.length;
      if (p[0] && p[0].i.includes(SEDDE)) return;            // önceki kelimeden idğamla başlayan kelime tek başına okunmaz
      const iskelet = p.map(x => x.h === 'ٱ' ? 'ا' : x.h).join('').replace(/^[وف](?=..)/, '');
      p.forEach((x, j) => {
        let h = HEMZE[x.h] ? 'ء' : x.h; if (h === 'ى' || h === 'ٱ' || h === 'ة') return;
        const i = x.i, onceki = p[j - 1];
        let tur = null;
        if (i.includes(SEDDE)) tur = 'sedde';
        else if (CEZM.some(c => i.includes(c))) tur = 'sakin';
        else if (TENVIN.some(c => i.includes(c))) tur = 'tenvin';
        else if ([FETHA, KESRE, OTRE].some(c => i.includes(c))) tur = 'hareke';
        else if ((h === 'ا' && onceki && onceki.i.includes(FETHA)) || (h === 'و' && onceki && onceki.i.includes(OTRE)) || (h === 'ي' && onceki && onceki.i.includes(KESRE))) tur = 'med';
        if (!tur || !aday[h]) return;
        if (h === 'ا' && tur !== 'med') return;               // harekeli elif hemzedir
        aday[h].push({ r: `${n}:${ai + 1}`, w, k: temiz, tur, bas: j === 0, uz, isk: iskelet });
      });
    });
  });
}
const SIRA = { hareke: 3, sakin: 2, sedde: 1, med: 3, tenvin: 0 };
const sonuc = {};
for (const h of HARFLER) {
  const l = aday[h], secilen = [], gor = new Set(), iskGor = [];
  const kota = h === 'ا' ? { med: 4 } : (h === 'و' || h === 'ي') ? { hareke: 2, sakin: 1, med: 2, sedde: 1 } : { hareke: 3, sakin: 2, sedde: 1 };
  for (const tur of Object.keys(kota)) {
    const uygun = l.filter(x => x.tur === tur && !gor.has(x.k) && x.uz >= 2).sort((a, b) => (b.bas - a.bas) || (a.uz - b.uz) || (SURELER.indexOf(+a.r.split(':')[0]) - SURELER.indexOf(+b.r.split(':')[0])));
    for (const x of uygun) { if (secilen.filter(y => y[3] === tur).length >= kota[tur]) break; if (gor.has(x.k) || iskGor.some(y => y.startsWith(x.isk.slice(0, 3)) || x.isk.startsWith(y.slice(0, 3)))) continue; gor.add(x.k); iskGor.push(x.isk); secilen.push([x.r, x.w, x.k, tur]); }
  }
  sonuc[h] = secilen;
}
const cikti = `// Otomatik üretildi: tools/harf-kelime.js — kısa sûrelerden harf başına örnek kelimeler [ayet, kelime sırası, kelime, tür]
// tür: hareke (üstün/esre/ötre), sakin (cezimli), sedde, med (uzatma harfi). Hoca onayı bekliyor.
window.HARF_KELIME = ${JSON.stringify(sonuc, null, 0).replace(/\],"/g, '],\n"')};
`;
fs.writeFileSync(path.join(KOK, 'js', 'harfkart-kelime.js'), cikti);
for (const h of HARFLER) console.log(h, sonuc[h].map(x => x[2] + '(' + x[3] + ')').join(' '));

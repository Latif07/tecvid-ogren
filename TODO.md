# TODO

## app.js'i böl (www/js/app.js, ~4700 satır, tek IIFE)

Amaç: Claude'un her işte okuduğu satır sayısını düşürmek (token tasarrufu) ve değişiklikleri izole etmek.
Kural: her madde ayrı oturum + ayrı commit. Davranış değişmeyecek, sadece kod taşınacak. Kod taşıma dışında hiçbir şey düzeltme.

### Mevcut durum
- `app.js` tek bir `(function () { 'use strict'; ... })()` içinde; 181 fonksiyon aynı kapsamı paylaşıyor.
- Ortak kapsam: `S` (durum), `PR`, `kaydet`, `toast`, `esc`, `metin`, `t`, `DIL`, `R`, `U`, `AYAH`, `ciz`, `git`, `ekranYigini` vb.
- Scriptler `www/index.html` içinde sırayla yükleniyor; çevrimdışı önbellek listesi `www/sw.js` içindeki `KABUK`.
- Otomatik duman testi var: `npm run test:smoke` (açılış + ana ekranlar + konsol hatası). Ekranların içeriğini denemez, o kısım hâlâ elle.

### Teknik karar (26 Kasım 2026, denendi)
- Eski plan (`window.TC.core` + getter/setter) bırakıldı: `S`, `ekranYigini`, `ses`, `oturum`, `CANLI`, `PR` gibi yeniden atanan değişkenler ve ~400 üst düzey ad var; hepsini elle çevirmek riskli.
- Yeni yöntem: **IIFE sarmalayıcısını kaldır, dosyayı ardışık klasik scriptlere böl.** Klasik scriptler aynı genel sözlük kapsamını paylaşır: `const/let/function` bir dosyada tanımlanınca diğerinde adıyla görünür. Kodda tek satır değişmez.
- Denendi: `app.js` sarmalayıcısız çalıştırıldı, duman testi 176/176 geçti. Bulunan tek çakışma: `window.sesDurdur = () => sesDurdur();` (genel kapsamda kendini çağırıp yığını taşırıyordu) kaldırıldı, `function sesDurdur` zaten `window.sesDurdur`.
- Kurallar:
  - Dosyalar `index.html`'de `app.js`'in yerinde, bölünme sırasıyla yüklenir (yükleme sırası = eski kod sırası). Her dosya başına `'use strict';`.
  - `sw.js` `KABUK` listesine her yeni dosya eklenir.
  - Bir dosya bir üst düzey bloğu ortasından bölünemez (fonksiyon/`EKRAN.x = function` bütün kalır).
  - Üst düzey ad başka scriptin genel adıyla çakışırsa (`let` ile `function`/`var`) SyntaxError verir; testten yakalanır. Yeni genel `window.X` atamalarında aynı ada dikkat.
  - Üst düzeyde çalışan ifadeler (ör. `basla();`, `window.__TECVID = ...`) en son dosyada kalır.
- Bölme sırası (satır aralıkları ~, `grep -n "// ----------"` ile güncelle):
  1. Çekirdek: profiller, durum, bulut, yardımcılar, ses (satır 1–567) -> `core.js`
  2. Soru bankası + oturum (567–716, 1072–1393) -> `oturum.js`
  3. Sınıf, Hocamı bul -> `sinif.js`
  4. Tekrarla, Ezber, Ezberden oku, Pekiştir -> `ezber.js`
  5. Müezzinlik -> `muezzinlik.js`
  6. Kur'an okuma, istatistik, okuma kartı, Notlar, ayet ekranı -> `kuran.js`
  7. Seviye, profil yönetimi, ilerleme, günlük, ebeveyn -> `ana-ekranlar.js`
  8. Mahreç, harf kartları, hikâye, kartlar, Elif-Ba -> `ders-ekranlari.js`
  9. Son: `basla()`, `__TECVID` -> `app.js`
- Her adım ayrı commit; her adım sonunda `npm run test:smoke` tam geçmeli.

### Adımlar
- [x] 0. Sarmalayıcıyı kaldır, tek dosya genel kapsamda çalışıyor (duman testi geçti)
- [x] 1–8. Bölme yapıldı (26 Kasım 2026): 9 ardışık dosya, birleşim özgün kodla birebir aynı doğrulandı. Gerçek telefonda doğrulama bekliyor
- [x] 9. `CLAUDE.md` güncellendi

### Her adımın bitiş kontrolü
- [ ] `npm run test:smoke` geçiyor
- [ ] Taşınan bölümün ekranları elle denendi
- [ ] Çevrimdışı (Service Worker) açılıyor: yeni dosya `KABUK`'ta
- [ ] Commit atıldı, sonra `/clear`

### Not
Satır aralıkları yaklaşık; her adımın başında `grep -n "// ------"` ile güncel başlıkları bul.

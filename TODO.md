# TODO

## app.js'i böl (www/js/app.js, ~4700 satır, tek IIFE)

Amaç: Claude'un her işte okuduğu satır sayısını düşürmek (token tasarrufu) ve değişiklikleri izole etmek.
Kural: her madde ayrı oturum + ayrı commit. Davranış değişmeyecek, sadece kod taşınacak. Kod taşıma dışında hiçbir şey düzeltme.

### Mevcut durum
- `app.js` tek bir `(function () { 'use strict'; ... })()` içinde; 181 fonksiyon aynı kapsamı paylaşıyor.
- Ortak kapsam: `S` (durum), `PR`, `kaydet`, `toast`, `esc`, `metin`, `t`, `DIL`, `R`, `U`, `AYAH`, `ciz`, `git`, `ekranYigini` vb.
- Scriptler `www/index.html` içinde sırayla yükleniyor; çevrimdışı önbellek listesi `www/sw.js` içindeki `KABUK`.
- Otomatik duman testi var: `npm run test:smoke` (açılış + ana ekranlar + konsol hatası). Ekranların içeriğini denemez, o kısım hâlâ elle.

### Teknik karar (adım 1'de uygulanacak)
- Ortak çekirdek `window.TC` altında paylaşılır (`window.TC.core = { ... }`), bölümler başında `const { S, kaydet, toast, esc, t } = window.TC.core;` ile alır.
- `S` yeniden atanıyor mu (`S = ...`) kontrol et. Atanıyorsa `S` yerine `core.S()` getter'ı ya da `core.durum` nesnesi kullan.
- Yeni her dosya: `index.html`'e `app.js`'ten ÖNCE (çekirdekten SONRA) eklenir ve `sw.js` `KABUK` listesine eklenir. Sürüm numarasını (`surumler.js` / sw cache adı) artır.

### Adımlar
- [ ] 1. Çekirdeği ayır: `js/core.js` (profiller, durum/`kaydet`, bulut eşitleme, yardımcılar, kilitler, ses, yönlendirme/`ciz`/`git`). `app.js` bunu kullansın. Uygulama aynı çalışmalı.
- [ ] 2. Soru bankası ve seviyeler (satır ~565-730) -> `js/sorular.js`
- [ ] 3. Oturum: test/alıştırma/tekrar (~1045-1366) -> `js/oturum.js`
- [ ] 4. Sınıf (hoca-öğrenci) + Hocamı bul (~1366-1756, ~3259-3488) -> `js/sinif.js`
- [ ] 5. Ezber/hıfz (~1756-2230, ~2364-2847) -> `js/ezber.js`
- [ ] 6. Müezzinlik (~1992-2190) -> `js/muezzinlik.js` (mevcut `muezzin.js` veri dosyasıyla karıştırma)
- [ ] 7. Kur'an okuma ve sûre sûre tecvid (~2847-3259, ~3957-4084) -> `js/kuran-okuma.js`
- [ ] 8. Mahreç dersi, harf kartları, hikâye dersleri (~4115-4361) -> `js/ders-ekranlari.js`
- [ ] 9. Profil/seviye/ilerleme/günlük plan/ebeveyn özeti (~3556-3940, ~4361-4707) -> `js/ana-ekranlar.js`
- [ ] 10. `CLAUDE.md` "Yapı" bölümünü güncelle: hangi özellik hangi dosyada.

### Her adımın bitiş kontrolü
- [ ] `npm run test:smoke` geçiyor
- [ ] Taşınan bölümün ekranları elle denendi
- [ ] Çevrimdışı (Service Worker) açılıyor: yeni dosya `KABUK`'ta
- [ ] Commit atıldı, sonra `/clear`

### Not
Satır aralıkları yaklaşık; her adımın başında `grep -n "// ------"` ile güncel başlıkları bul.

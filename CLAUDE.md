# tecvid-ogren

Tecvid öğreten Capacitor/Android uygulaması. Saf JS, derleme adımı yok. Web kodu: `www/`.

## Kurallar (token tasarrufu)
- Uygulama motoru artık 9 dosyaya bölünmüş (aynı genel kapsamı paylaşır, `index.html`'de bu sırayla yüklenir; hepsi `sw.js` `KABUK`'ta): `core.js` (profil, durum, bulut, yardımcılar, ses), `sorular-ekranlar.js` (soru bankası, yönlendirme, temel ekranlar, sürüm, oturum), `sinif-ezber.js` (sınıf, ezber, Tekrarla), `muezzinlik.js`, `ezber-canli.js` (ezberden oku, ezber çalış), `kuran.js` (okuma, kart, istatistik, notlar, ayet ekranı), `hesap-ekranlari.js` (hocamı bul, seviye, profiller, ilerleme), `ders-ekranlari.js` (sûre sûre tecvid, mahreç, harf kartları, hikâye, günlük ders, hap kartlar, Elif-Ba), `arama.js` (ayet/kelime arama; dizin `tools/build_arama.py` ile üretilir), `elifba-alistirma.js` (Elif-Ba harf alıştırmaları), `ana-duzen.js` (ana sayfa kişiselleştirme: profil, kart sırası, hızlı erişim), `app.js` (ebeveyn özeti, başlatma). Dosyalar ~400–900 satır: önce Grep ile ara, sonra Read'i `offset`/`limit` ile kullan.
- İngilizce çeviri anahtarları `www/js/dil-en.js` içinde (yalnız dil İngilizceyse yüklenir); `dil.js` yalnız çekirdek.
- Yeni üst düzey `const/let/function` adı başka dosyadaki bir adla çakışmamalı (SyntaxError verir). Yeni JS dosyası eklenince `index.html` (`app.js`'ten önce) ve `sw.js` `KABUK`'a ekle.
- Büyük veri/ikili dosyalar (`www/kuran`, `www/model`, `www/sesler`, `www/data`, `www/js/firebase`, `www/js/ort`) okunmaz; gerekirse yalnızca `head`/`jq` ile küçük bir kısmına bak.
- Test/log çıktılarını `| tail -n 50` ile kısalt.
- Cevaplar kısa olsun; istenmeyen refactor veya açıklama yapma.

## Test
- `npm run test:smoke` (tools/test/smoke.js): uygulamayı açar, ana ekranları çizer, konsol hatası arar. Kod taşıma/refactor sonrası mutlaka çalıştır; çıktısı kısa. Yeni ekran eklenince `EKRANLAR` listesine ekle. `npm run test:kapsam` kod kapsamını da yazar (motor dosyaları ~%41; %100 görünen veri dosyalarını sayma).

## Yapı
- `www/js/*.js`: özellik başına bir modül (okuma, mahrec, sozluk, dualar...).
- `tools/`: yardımcı betikler. `docs/`: tanıtım görselleri.
- Meal ekleme: `tools/build_meal_tanzil.py` (docstring'e bak) + `sinif-ezber.js` içindeki `MEAL_KAYNAK` listesine bir satır. Lisansı önce kontrol et.

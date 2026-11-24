# tecvid-ogren

Tecvid öğreten Capacitor/Android uygulaması. Saf JS, derleme adımı yok. Web kodu: `www/`.

## Kurallar (token tasarrufu)
- `www/js/app.js` ~4700 satır: tamamını okuma. Önce Grep ile ara, sonra Read'i `offset`/`limit` ile kullan.
- Büyük veri/ikili dosyalar (`www/kuran`, `www/model`, `www/sesler`, `www/data`, `www/js/firebase`, `www/js/ort`) okunmaz; gerekirse yalnızca `head`/`jq` ile küçük bir kısmına bak.
- Test/log çıktılarını `| tail -n 50` ile kısalt.
- Cevaplar kısa olsun; istenmeyen refactor veya açıklama yapma.

## Test
- `npm run test:smoke` (tools/test/smoke.js): uygulamayı açar, ana ekranları çizer, konsol hatası arar. Kod taşıma/refactor sonrası mutlaka çalıştır; çıktısı kısa. Yeni ekran eklenince `EKRANLAR` listesine ekle. `npm run test:kapsam` kod kapsamını da yazar (app.js ~%41; %100 görünen veri dosyalarını sayma).

## Yapı
- `www/js/*.js`: özellik başına bir modül (okuma, mahrec, sozluk, dualar...).
- `tools/`: yardımcı betikler. `docs/`: tanıtım görselleri.
- Meal ekleme: `tools/build_meal_tanzil.py` (docstring'e bak) + `app.js` içindeki `MEAL_KAYNAK` listesine bir satır. Lisansı önce kontrol et.

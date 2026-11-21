# tecvid-ogren

Tecvid öğreten Capacitor/Android uygulaması. Saf JS, derleme adımı yok. Web kodu: `www/`.

## Kurallar (token tasarrufu)
- `www/js/app.js` ~4700 satır: tamamını okuma. Önce Grep ile ara, sonra Read'i `offset`/`limit` ile kullan.
- Büyük veri/ikili dosyalar (`www/kuran`, `www/model`, `www/sesler`, `www/data`, `www/js/firebase`, `www/js/ort`) okunmaz; gerekirse yalnızca `head`/`jq` ile küçük bir kısmına bak.
- Test/log çıktılarını `| tail -n 50` ile kısalt.
- Cevaplar kısa olsun; istenmeyen refactor veya açıklama yapma.

## Yapı
- `www/js/*.js`: özellik başına bir modül (okuma, mahrec, sozluk, dualar...).
- `tools/`: yardımcı betikler. `docs/`: tanıtım görselleri.

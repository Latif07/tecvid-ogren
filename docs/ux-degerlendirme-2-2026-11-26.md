# UI/UX değerlendirmesi 2: "Herkes kullansın, sevilsin" (26 Kasım 2026)

**Not:** Bu bir **canlandırma** toplantısıdır; katılımcıların sözlerini Claude yazdı. Kanıt olarak uygulama taranıp ölçüldü (aşağıda). Gerçek kullanıcı testi (5–8 kişi) yerine geçmez.

## Ölçümler (390×844, yerelde)
- **Kontrast (WCAG AA, 4,5:1):** Açık temada neredeyse temiz (ders, ezber, kartlar 0 sorun). Sorunlar: renkli tecvid `tc-s` rengi 2,6:1 (Kur'an sayfası); rozet 3,15:1.
- **Koyu temada ciddi sorun:** ana yeşil düğme (`.btn`) 2,79:1 (beyaz yazı açık yeşil üstünde). Ezber ekranında 12, Ayarlar'da 11 öğe AA altı (düğmeler, çipler, etiketler).
- **Yoğunluk:** Ana sayfa 1,4 ekran, 16 düğme (ilk ekranda 9): iyi. Tecvid sekmesi 1,5 ekran ama **40 düğme**: kalabalık.
- **İlk açılış:** "Uygulamayı kim kullanacak?" (yaş grubu) ile başlıyor: üç büyük kart, temiz ama kullanıcıya "neye ihtiyacım var" sormuyor.
- **Dokunma hedefleri ve küçük yazı:** 1.0.66'da düzeltildi.

## Toplantı

**UI/UX tasarımcı:** Temel kimlik doğru: yeşil + altın + krem, sakin ve "kitap" hissi veriyor. "Karmaşık" algısının nedeni renk değil **seçenek sayısı**: Tecvid sekmesi 40 düğme, Kur'an sekmesinde bir sürü kısayol, her ekranda 3–4 farklı düğme biçimi. Öneri: her ekranda **tek ana eylem** (dolu düğme), diğerleri düz metin bağlantısı. Boşluk (nefes) artırılmalı: kartlar arası 12 → 16 px, başlıklar büyük.

**Erişilebilirlik uzmanı (yaşlı ve göz yorgunluğu):** Koyu temadaki beyaz-yeşil düğme okunmuyor; ilk bakışta çözülür. Yazı boyutu ayarı iyi ama **ilk açılışta** sorulmalı ("Yazı nasıl olsun? Küçük / Normal / Büyük"). Yüksek kontrast seçeneği ve "hareketi azalt" (animasyon kapatma) yok. Arapça yazı için satır aralığı iyi; kelime aralığı mushaf görünümünde sıkı.

**Ürün / büyüme:** İlk 60 saniyede kullanıcı bir **küçük başarı** yaşamalı: şu an önce yaş grubu, sonra isim soruluyor. Öneri: ilk soru "Ne yapmak istiyorsun?" (Elif-Ba öğren / Kur'an oku / Ezberle) → hemen o ekranın ilk adımı açılsın. Sevilmenin yolu **sıcaklık**: günün saatine göre selam ("Hayırlı sabahlar"), seri (gün) için nazik kutlama, yarım kalan işe "kaldığın yerden devam", kaçırılan günde suçlamayan hatırlatma. Kandil ve Ramazan günlerinde küçük özel kart (özel günler listesi hazır).

**Yeni başlayan (Elif-Ba):** "İdğâm, ihfâ, tecvid" kelimeleri korkutuyor; sıfırdan başlayana Tecvid sekmesi ilk günlerde **gizli ya da kapalı** olsun, yalnız Elif-Ba ve Bugünkü ders görünsün. İnsan sesi çok önemli.

**Ebeveyn:** Çocuk modu güzel ama büyük ekrandan çocuk ekranına geçiş kafa karıştırıcı; çocuk modunda çıkış için ebeveyn kilidi (basit soru) ve süre sınırı istenir.

**Hafız:** Kur'an okuma ekranı sade ve doğru; ezberde sabak/sabakî/münzil eklendi (onay bekliyor). Mushaf yazısı için hangi nüsha olduğu görünür olmalı.

**Güzel okuyan:** Yapay ses yerine insan sesi; kâri ve hız seçeneği zaten var. Kendi okuyuşunu dinleme ve hocaya gönderme (paylaşma) istiyor.

**Yazılımcı:** Koyu temadaki kontrast tek yerden düzelir (renk jetonları). Renk teması altyapısı var (yeşil, lacivert, bordo, sepya…); yeni tema = yeni jeton seti. Test kapsamı geniş; kontrast için otomatik bir kontrol eklenebilir.

## Tema önerisi
Mevcut görünümü **değiştirmek yerine inceltmek** öneriyoruz:
1. **Yeşili korumak**, doygunluğunu biraz düşürmek ve koyu temada düğmeyi koyulaştırmak (beyaz yazıyla ≥ 4,5:1).
2. **Boşluk ve başlık:** kart arası 16 px, başlık 1,3×, satır yüksekliği 1,6.
3. **Tek ana düğme:** ekran başına bir dolu düğme, diğerleri çizgi/metin.
4. **Arapça yazı:** kelime aralığı +%8, mushaf görünümünde isteğe bağlı "geniş satır".
5. **İkon seti:** çizgi ikonları bütün ekranlara yaymak (içerik emojileri bölüm simgelerinde kalabilir).
6. **Alternatifler (kullanıcı seçsin):** Sepya (göz yormaz, uzun okuma), Gece (OLED, siyah), Lacivert (soğuk, ciddi). Hepsi hazır; varsayılan yeşil kalır.

## Öncelikli liste

**Hemen (Claude yapar)**
1. Koyu tema kontrastı (düğme, çip, etiket) ve `tc-s` rengi; kontrast için otomatik test.
2. Yeni ilk açılış: "Ne yapmak istiyorsun?" + yazı boyutu + (isteğe bağlı) ad; yaş grubu ikinci adıma.
3. Tecvid sekmesini sadeleştirme (40 → ~15 düğme; sıfırdan başlayana gizli).
4. Günün saatine göre selam, nazik seri kutlaması.
5. Ayarlar'a "Yazı boyutu / Yüksek kontrast / Hareketi azalt".
6. "Geri bildirim gönder" düğmesi (tanı bilgisiyle).

**Sonra**
7. Tema inceltmesi (boşluk, başlık, Arapça aralığı).
8. Çocuk modu ebeveyn kilidi ve süre sınırı.
9. Özel gün kartları (Kandil, Ramazan).
10. Kendi okuyuşunu dinleme ve paylaşma.

**İnsan gerektirir**
11. 5–8 gerçek kişiyle telefon testi (tabloda 5. satır).
12. İnsan sesi kayıtları, hoca onayları ("Hoca onaylı" rozeti güven verir).
13. Mağaza metinleri, gizlilik metni, kapalı beta.

## Kararlar (gerçek toplantıdan sonra)
-

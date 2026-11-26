# Proje değerlendirme toplantısı (26 Kasım 2026)

**Önemli not:** Bu bir **canlandırma** toplantısıdır. Katılımcıların (iki hafız, Elif-Ba öğrencisi, Kur'an okuyan kullanıcı, güzel okuyan, UI/UX uzmanı, yazılımcı) sözlerini Claude, uygulamayı tarayarak ve sık görülen ihtiyaçlara dayanarak yazdı. Gerçek hoca ve kullanıcı görüşünün yerine geçmez; gerçek toplantıya hazırlık ve tartışma gündemidir.

## Ölçümler (390×844 telefon, yerelde, 12 ekran tarandı)
- Açılış ≈ 0,4 sn (yerel). Konsol hatası yok. Yatay taşma yok.
- Dokunma hedefi < 40 px: Ders ekranında 14 öğe (konu çipleri), Tekrarla'da 17, günlük ders süre düğmeleri, Kur'an sayfası üst düğmeleri.
- Adı olmayan öğe: Tekrarla'da 8 (ayet aralığı kutuları).
- 12 px altı yazı: Ana sayfada 6, Tekrarla'da 2.
- Büyüklük: `app.css` 146 KB, `dil.js` 139 KB (İngilizce sözlük herkese yükleniyor), `cocuk.js` 107 KB (çocuk modu olmayanlara da yükleniyor), `content.js` + `content-en.js` ≈ 195 KB.
- Test: 193 kontrol, tam çalışma ≈ 3 dk.

## Toplantı

**Hafız 1 (hıfz hocası):** Ezber akışı mantıklı (yeni + yakın tekrar + uzak tekrar, basamak yöntemi). Eksik: sabak / sabak-ı / münzil adlarıyla gün planı, ayeti "bakmadan" kontrol ederken kelime kelime hata gösterimi, hocaya ezber raporu (hangi sayfa ne zaman tekrarlandı). (Not: Müezzinlik listesindeki "Hoca onayı bekliyor" rozeti yalnız test sürümünde görünür; canlıda gizli. Ekran görüntüsü yerelden alındı.)

**Hafız 2:** Metin kaynağı ve yazım (Hafs, Medine/Türk mushaf farkı) görünür olmalı: "Bu metin hangi mushaftan?" bilgisi. Durak işaretleri ve renkler hocaya onaylatılmalı. Eksik: ayet/kelime arama ("şu kelime hangi ayette"), benzer ayetler (müteşabih) uyarısı ezberde.

**Elif-Ba öğrencisi (sıfırdan):** Ana sayfa ilk bakışta kalabalık; "Elif-Ba" hem büyük kartta hem hızlı erişimde iki kez var. Harf sesi yapay; insan sesi şart. "İdğâm, ihfâ" gibi kelimeler korkutuyor, ilk günlerde saklansın. Harfe dokununca ses çıkması güzel ama hece alıştırması yok.

**Kur'an okuyan kullanıcı:** Kaldığım yerden okumak hızlı, sayfa görünümü güzel. İstek: gece temasında yazı rahatlığı, bir ayeti/kelimeyi arama, sayfaya kalemle işaret, kâriyi sayfa değişince devam ettirme, kelime meali. Notlar eklendi, "Notlarım" bulunur olmalı. Tekrarla ayarları fazla ince, ilk bakışta anlaşılmıyor.

**Güzel okuyan (kâri/muallim):** Tecvid geri bildirimi "yapay zekâ makamı ve tecvidi değil" diyor; bu dürüst ama kullanıcıyı yarı yolda bırakıyor. İstek: kâri ve hız seçeneği, kendi kaydını yan yana dinleme, kayıt paylaşma, hocaya gönderme, nefes/uzatma ölçümü gibi somut göstergeler. Yapay sesli harf/duâ okuması kabul edilemez; mutlaka insan kaydı.

**UI/UX uzmanı:**
1. **Hiyerarşi:** Ana sayfada çok eşit ağırlıklı kart var; kullanıcının tek bir "ana eylemi" olmalı.
2. **Dokunma hedefleri:** Konu çipleri, süre seçici, ayet aralığı kutuları 44 px altında.
3. **Dil:** Canlıda görünen "hoca onayı bekliyor" notları (hap kartlar, Elif-Ba alıştırma) dürüst ama iç iş gibi okunuyor; tek bir küçük "Taslak içerik" bilgisine indirilebilir ya da onay gelince kaldırılmalı.
4. **Tutarlılık:** Düğme stilleri (ince, ikincil, çip, link) çok çeşitli; Tecvid sekmesinde grup çipleri yatay kayıyor ve yarım kalıyor.
5. **Görsel kimlik:** Emoji yoğun; İslami bir uygulama için sade ikon seti (çizgi ikonlar) daha olgun durur.
6. **Boş durumlar:** Ezber "Henüz ezber listen boş" ekranı yönlendirici değil (tek büyük "Başla" olmalı).
7. **Ders ekranı:** Harf satırlarında 🔊 ikonları harflerin üstüne biniyor, okumayı bozuyor.
8. **Erişilebilirlik:** Yazı boyutu ayarı var (iyi); küçük yazılar (12 px altı) ve kontrast (açık gri metin) gözden geçirilmeli; adı olmayan alanlara etiket.

**Yazılımcı:**
1. Motor 11 dosyaya bölündü ama aynı genel kapsamı paylaşıyor: ad çakışması derleyici hatası verir, yalnız testle yakalanıyor. Orta vadede ES modülü ya da küçük ad önekleri.
2. Durum tek JSON (`S`) olarak her kayıtta yazılıyor; büyüdükçe yavaşlar, ses kayıtları ayrı (IndexedDB, iyi).
3. `dil.js` ve `cocuk.js` herkese yükleniyor; tembel yükleme düşünülmeli.
4. Test: 193 kontrol iyi, ama 3 dk. Hızlandırmak için paralel çalıştırma.
5. APK sürümü web'in epey gerisinde (son APK web'den çok önceki bir sürüm); Android kullanıcıları yeni özellikleri görmüyor.
6. Hata raporlama yok: telefonda oluşan hataları sadece kullanıcı bildirirse görüyoruz (tanı kaydı yalnız takip için).
7. Yedekleme: yerel notlar ve sesler cihaz değişince kaybolur (ses hesapla eşitlenmiyor).
8. Lint/biçim aracı yok; satır sayıları büyüyor.

## Öncelikli liste

**Hemen (küçük, Claude yapar)**
1. Kartlardaki ve alıştırmalardaki "hoca onayı bekliyor" notlarını tek, sade bir "taslak içerik" göstergesine indir.
2. Sıfırdan profilde hızlı erişimden "Elif-Ba"yı çıkar (kart zaten var).
3. Dokunma hedeflerini ≥ 44 px yap (konu çipleri, süre seçici, ayet aralığı), 12 px altı yazıları büyüt, adı olmayan alanlara etiket.
4. Ders ekranında harf 🔊 ikonlarının üst üste binmesini düzelt.
5. Ezber boş durumunu yönlendirici yap.
6. Tecvid sekmesinde bölüm çiplerini sarılı/okunur yap.

**Sonra (orta)**
7. Ayet/kelime arama.
8. Ezber: sabak/sabak-ı/münzil adları ve hocaya rapor.
9. Sade ikon seti (emoji yerine).
10. `dil.js` / `cocuk.js` tembel yükleme; testlerin paralel koşması.
11. Yeni APK.

**Hoca/izin gerektirir**
12. İnsan sesi: harf adları, müezzinlik, çocuk selâmı, duâlar.
13. Durak, hap kart ve metin kaynağı onayları; mushaf kaynağı bilgisi.
14. Kelime meali ve mushaf resmi izinleri.
15. Güzel okuma rehberi içeriği (hoca).

## Kararlar (gerçek toplantıdan sonra doldurulacak)
-

# Hocalarla toplantı: Ana sayfa kişiselleştirme (26 Kasım 2026)

Bu belge toplantıya götürülecek hazırlık notudur. Toplantı henüz yapılmadı; kararlar buraya yazılacak.

## 1. Sorun
Ana sayfa herkese aynı: selâm, hadis, tanıtım, günlük ders, tekrar, müfredat, ilerleme, günün sorusu, hesap uyarısı, sürüm.
- Sıfırdan başlayan biri için kalabalık: ilk adım ("Elif-Ba'dan başla") belli değil.
- Kur'an okuyan biri için dersler öne çıkıyor; onun işi sayfa okumak, takip, tekrar, ezber.
- Ayarlar içinde sık kullanılan şeyler gömülü (hatırlatma, hedef, görünüm).

## 2. Öneri: üç başlangıç profili
| Profil | Ana sayfada öne çıkan | Geri planda |
|---|---|---|
| **Sıfırdan başlıyorum** | Elif-Ba odak modu (tek büyük "Devam et"), günlük 10 dk plan | Kur'an, ezber, müezzinlik |
| **Harfleri biliyorum** | Günlük ders, tecvid kartları, bölüm ilerlemesi | Elif-Ba |
| **Kur'an okuyorum** | Kaldığım sayfa, günlük ayet hedefi, Tekrarla/ezber, Sen oku | Ders müfredatı (Tecvid sekmesinde durur) |

Profil ilk açılışta ("Seni tanıyalım") seçilir; sonradan değişir. Seviye tespiti zaten var, ona bağlanır.

## 3. Öneri: Ana sayfayı düzenle
- Her kart için aç/kapat ve sıra değiştirme (⋮ menü, "Ana sayfayı düzenle").
- Hızlı erişim şeridi: kullanıcı en çok kullandığı 4 şeyi seçer (ör. Sen oku, Tekrarla, Kartlar, Müezzinlik).
- Ayarlardan ana sayfaya taşınabilecekler: günlük hedef (dk / ayet), hatırlatma saati, Arapça yazı boyutu, renkli tecvid, durak ışıkları.
- Varsayılan düzen profile göre gelir; kullanıcı dokunmadıkça bozulmaz.

## 4. Hocalara sorular
1. Sıfırdan başlayan için ilk ekranda ne olmalı? Sadece Elif-Ba mı, yoksa Kur'an'dan kısa bir dinleme de mi?
2. Üç profil doğru mu? Hangi ek profil gerekir (çocuk, hafız adayı, yeniden başlayan)?
3. Günün hadisi ana sayfada kalsın mı, yoksa isteğe bağlı mı?
4. Hangi kartlar başlangıç için fazla? (günün sorusu, seri, haftalık özet)
5. Hap kartlar, durak ışıkları, kart içerikleri onay bekliyor (tablo satırları 153, 157).
6. Elif-Ba ve müezzinlik sesleri için hoca kaydı: kim, hangi sırayla, hangi formatta? (satırlar 25, 31, 137)

## 5. Yapılacaklar (karar sonrası)
- [ ] Profil modeli: `S.ayar.profilTuru` + varsayılan kart listesi
- [ ] Ana sayfa kartlarını kayıtlı listeye çevir (`ANA_KARTLAR`)
- [ ] "Ana sayfayı düzenle" ekranı (aç/kapat, sırala)
- [ ] Hızlı erişim şeridi
- [ ] Ayarlardan taşınan kontroller
- [ ] Smoke test: üç profilin ana sayfası, düzenleme kalıcılığı

## 6. Kararlar (toplantıdan sonra doldurulacak)
-

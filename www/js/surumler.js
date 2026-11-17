// Sürüm ve yenilikler. Yeni sürümde: SURUM'u artır, LISTE'nin başına ekle.
// APK derlemesi versionName'i ve Releases notunu buradan alır; web yayını YAYIN_YER'i yayın numarasıyla değiştirir.
(function () {
  const SURUM = '1.0.36';
  const YAYIN = 'YAYIN_YER';
  const LISTE = [
    { s: '1.0.36', t: '2026-11-16', durum: 'Webde test ediliyor', l: [
      'Kur\'an metni Türkiye (Diyanet) mushafı yazımıyla: med işaretleri, esre-i memdûde, durak işaretleri; Hamdullah hattı. Ayarlardan Medine yazımı da seçilebilir',
      'Seviye tespiti ("Seni tanıyalım"): kısa test; bildiğin konuların bölümleri atlanır, doğru yerden başlarsın',
      'Alıştırma: 5–8 soru, basitten zora; konuyu anlayınca "Konuyu anladın" ile biter; aynı sorular tekrar gelmez; bölüm testi ders uzunluğuna göre 6/8/10 soru',
      'Mahreç dersi: bölümlü video (Hafız Davut Kaya / Diyanet Dijital ve Tevhid Medya), harfi Kur\'an\'dan dinleme, "Sen oku" ile kontrol, "Hisset" ipuçları',
      'Ders metinlerindeki Arapça örnekler dokununca gerçek kâri sesiyle çalar; kalkale harfleri kalkale yapılan kelimeden dinletilir',
      'Ezberden oku: kelimeler okudukça açılır; okurken uyarı yok, ayet bitince değerlendirilir',
      'Müezzinlik bölümü: ezan, kamet, selâ, tesbihat dahil 17 metin; sırayla ezber, gizleme, tekrar, namaz sonrası provası',
      'Çocuk modu: yönerge her soru tipinde bir kez söylenir, aynı tip sorular bir arada, ipucu sesle yalnızca ilk yanlışta',
      'Çocuk modu: seviye yoklaması ve "Biliyorum" ile ada atlama; harf tanışmada Kur\'an\'dan dinleme',
      'Çocuk sesleri: sessize al düğmesi, üst üste dokunmada seslerin binmemesi, besmele Husarî tilavetinden',
      'Bütün dinleme düğmelerinde ⏹ Durdur',
      'Türk hafızlar: Hafız Davut Kaya, Osman Şahin, Mehmet Çevik (Diyanet Kur\'an portalı kayıtları)',
      'Sürüm numarası ve bu Yenilikler sayfası',
      'Büyükler kilidi: çarpım sorusu yerine velinin belirlediği 4 haneli PIN; açınca 5 dakika tekrar sorulmaz; PIN unutulursa yazıyla sayı',
      'Profil silme: her profilin yanında 🗑️, ne kaybolacağını gösteren onay, 10 saniye "Geri al"',
      'Günün sorusu ana sayfada ince, açılır-kapanır satır; Ayarlar\'dan gizlenebilir',
      'Kullanıcı testi düzeltmeleri: ders metni ilk ekranda, ders sekmeleri küçük telefona sığıyor, düğmeler en az 44 px, alt menü yazısı büyüdü',
      'Daha hızlı ilk açılış: hesap sistemi ve İngilizce içerik yalnız gerektiğinde yükleniyor; uzun sûreler daha hızlı açılıyor',
      'Yazılar: "Mahreç", "Hazırlık" bölümü, bölüm testinde doğru soru sayısı; yeni başlayana "0 gün seri" gösterilmiyor',
      'Çocuk modu: besmele durakta bir kez (yazılı ve Husarî sesiyle); küçük telefonda "Devam et" üstte',
      'Ezber çalış: ezber artık kendi ekranında; 5 adım (Dinle, Bakarak, Yarısı gizli, Ezberden, Bağla), okudukça kelimeler açılır, sonuç aynı kartta, "Göz at"',
      'Ezber tekrarı: sûrenin ezberlenen kısmı gizli okunur; takılınan ayetler "zayıf" olur, yarın yine sorulur, tek tek çalışılabilir',
      'Ezber çalış: okuma bitince mikrofon kendiliğinden kapanır (gürültülü ortamda ve son kelimede takılınca da); hatalı ayetin altında tek dokunuşla "Bu ayeti tekrar oku", hatalar "Hataları gör" altında; mikrofonun altında durum yazısı',
      'Ezber sekmesi sadeleşti: "Bugün" kartında tek Başla (yeni ders, yakın ve uzak tekrar sırayla), ilerleme halkalı Ezberlerim; hatim ve sayfa okuma "Sayfa ve hatim" ekranında',
    ] },
    { s: '1.0.35', t: '2026-11-15', l: [
      'Sûre sûre (ayet ayet) tecvid, hikâye tarzı kısa anlatım, günün sorusu',
      'Çocuk tarafı: hafıza oyunu, harf yağmuru, kelimede harf bul; veli özeti ve haftalık hatırlatma',
      'Hoca/kurs: çocuklara durak ödevi, bütün sınıflara ödev, yazdırılabilir sınıf raporu',
      'Krem-bordo tema, hızlı tanıtım kartı, renk kontrastı düzeltmeleri',
      'Meşk modu, Sûreler Adası, çocuk sûrelerini internetsiz indirme',
      '18 yeni kâri; kâri seçimi türe göre gruplandı',
    ] },
    { s: '1.0.25', t: '2026-11-14', l: ['Sûreler Adası, yeni çocuk oyunları, mushaf işaretleri, okunuşun kademeli gizlenmesi'] },
    { s: '1.0.24', t: '2026-11-14', l: ['Bugünkü dersim (günlük plan), yarım testi sürdürme, sesli yönerge, hoca harf sesi kaydı, ebeveyn özeti, ders içi hızlı kontrol'] },
    { s: '1.0.23', t: '2026-11-14', l: ['Yaş grupları ve profiller, çocuk modu (Harf Yolculuğu, oyunlar, ebeveyn kilidi), bölüm sonu âyet/hadis müjdesi'] },
    { s: '1.0.22', t: '2026-11-14', l: ['Düzeltme: Android\'de sûre ekranı açılmıyordu'] },
    { s: '1.0.21', t: '2026-11-14', l: ['Yeni logo'] },
    { s: '1.0.20', t: '2026-11-14', l: ['Yapay zekâ okuma raporu, renk temaları, birden çok sınıf, açılışta hadis'] },
  ];
  const g = typeof window !== 'undefined' ? window : globalThis;
  g.SURUMLER = { SURUM, YAYIN: YAYIN === 'YAYIN' + '_YER' ? '' : YAYIN, LISTE };
  if (typeof module !== 'undefined') module.exports = g.SURUMLER;
})();

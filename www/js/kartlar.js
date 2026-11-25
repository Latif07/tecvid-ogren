/* Kur'an Yolum — Tecvid hap bilgi kartları (veri).
 * Her kart tek bakışta özet: kural adı, kısa tanım, harfler, ne zaman, miktar, örnek.
 * Bilgiler uygulamadaki ders metinlerinden (content.js) alınmıştır; yeni dinî bilgi eklenmemiştir.
 * Harf listeleri ve adlar hoca onayı bekliyor (tablo: 153). Kural adı, özet ve elif miktarı R tablosundan (TC.R) gelir.
 * Satır alanları: k (kural kimliği), ad, kisa, harf (boşlukla ayrılmış harfler), ne (ne zaman), miktar, ornek.
 */
window.KARTLAR = [
  { id: 'med', ad: 'Medler', ik: '〰️', grup: 'med', unit: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'],
    ust: { ad: 'Harf-i med', harf: 'ا و ي', not: 'Kendinden önceki harekeyi uzatır' },
    satirlar: [
      { k: 'tabii', ne: 'Her zaman', ornek: 'قَالَ' },
      { k: 'muttasil', ne: 'Her zaman (vacip, kısaltılmaz)', ornek: 'جَآءَ' },
      { k: 'munfasil', ne: 'Caiz (hızlıda kısa, yavaşta uzun)', ornek: 'بِمَآ أُنزِلَ' },
      { k: 'lazim', ne: 'Her okuyuşta (mecburi)', ornek: 'ٱلضَّآلِّينَ' },
      { k: 'ariz', ne: 'Durulunca', ornek: 'ٱلۡعَٰلَمِينَ' },
      { k: 'lin', ne: 'Durulunca', ornek: 'قُرَيۡشٍ' },
      { k: 'sila', ne: 'Zamir, iki harekeli harf arasında', ornek: 'لَّهُۥ كُفُوًا' },
    ] },
  { id: 'nun', ad: 'Nûn sâkin ve tenvin', ik: 'ن', grup: 'nun', unit: ['u7', 'u8', 'u9', 'u10', 'u11'],
    ust: { ad: 'Nûn sâkin / tenvinden sonra gelen harfe bak', harf: '', not: 'Aynı kelimede nûn + ي/و: izhâr (ٱلدُّنۡيَا صِنۡوَانٞ قِنۡوَانٞ بُنۡيَٰنٞ)' },
    satirlar: [
      { k: 'izhar', harf: 'ء ه ع ح غ خ', kisa: 'Boğaz harfi: nûn açık okunur', ne: 'Açık oku, geniz yok', ornek: 'مِنۡ عَلَقٍ' },
      { k: 'idgamMaal', harf: 'ي ن م و', kisa: 'Katarak, genizden (YeNMU)', ne: 'İki kelime arasında', ornek: 'مَن يَقُولُ' },
      { k: 'idgamBila', harf: 'ل ر', kisa: 'Tamamen katıl, geniz YOK', ne: 'İki kelime arasında', ornek: 'مِن رَّبِّهِمۡ' },
      { k: 'iklab', harf: 'ب', kisa: "Nûn 'm' olur, genizden", ne: 'Dudaklar hafif kapanır', ornek: 'مِنۢ بَعۡدِ' },
      { k: 'ihfa', harf: 'ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك', kisa: 'Kalan 15 harf: nûn saklanır, genizden', ne: 'Gizle', ornek: 'أَنتُمۡ' },
    ] },
  { id: 'mim', ad: 'Mîm sâkin ve idğâmlar', ik: 'م', grup: 'mim', unit: ['u12', 'u14'],
    ust: { ad: 'Mîm sâkinden sonra gelen harfe bak', harf: '', not: 'و ve ف gelince mîmi açık söyle: هُمۡ فِيهَا' },
    satirlar: [
      { k: 'ihfaSefevi', harf: 'ب', ne: 'Dudaklar hafif kapalı, genizden', ornek: 'تَرۡمِيهِم بِحِجَارَةٖ' },
      { k: 'idgamMim', harf: 'م', ne: 'İki mîm birleşir, genizden', ornek: 'أَطۡعَمَهُم مِّن' },
      { k: 'izharSefevi', harf: 'diğer harfler', ne: 'Mîm açık okunur', ornek: 'لَكُمۡ دِينُكُمۡ' },
      { k: 'misleyn', harf: 'aynı iki harf', kisa: 'İlk harf sâkin, ikincisi harekeli: katılır', ne: 'Tek şeddeli harf gibi', ornek: 'ٱضۡرِب بِّعَصَاكَ' },
      { k: 'mutecaniseyn', harf: 'ت د ط · ث ذ ظ · ب م', kisa: 'Mahreci aynı, sıfatı farklı', ne: 'Katılır (ط\'dan sonra ت: tam katılmaz)', ornek: 'قَد تَّبَيَّنَ' },
      { k: 'mutekaribeyn', harf: 'ق ← ك · ل ← ر', kisa: 'Birbirine yakın harfler', ne: 'Katılır', ornek: 'قُل رَّبِّيٓ' },
    ] },
  { id: 'gunne', ad: 'Ğunne ve kalkale', ik: '〰', grup: 'gunne', unit: ['u13', 'u15'],
    satirlar: [
      { k: 'gunne', harf: 'نّ مّ', kisa: 'Şeddeli nûn ve mîm: burundan okunur', ne: 'Her zaman', miktar: '≈ 1 elif', ornek: 'إِنَّ ثُمَّ' },
      { k: 'kalkale', harf: 'ق ط ب ج د', kisa: 'Sâkin olunca hafifçe sekerek (Kutbu cedin)', ne: 'Durulunca daha belirgin', ornek: 'أَحَدۡ' },
    ] },
  { id: 'lam', ad: 'Lâm-ı tarif ve râ', ik: 'ل', grup: 'lam', unit: ['u16', 'u18'],
    satirlar: [
      { k: 'kameri', harf: 'ء ب ج ح خ ع غ ف ق ك م و ه ي', kisa: 'Lâm okunur (14 harf)', ne: 'ٱبۡغِ حَجَّكَ وَخَفۡ عَقِيمَهُ', ornek: 'ٱلۡقَمَرِ' },
      { k: 'semsi', harf: 'ت ث د ذ ر ز س ش ص ض ط ظ ل ن', kisa: 'Lâm okunmaz, harf şeddeli (14 harf)', ne: 'Güneş harfi', ornek: 'ٱلشَّمۡسِ' },
      { k: 'raKalin', kisa: 'Üstün veya ötre: kalın', ne: 'Harekeli râ', ornek: 'رَبِّ' },
      { k: 'raInce', kisa: 'Esre: ince', ne: 'Harekeli râ', ornek: 'رِجَالٞ' },
    ] },
  { id: 'vakf', ad: 'Vakf ve durak ışıkları', ik: '🚦', grup: 'vakf', unit: ['u19'], isik: true,
    medine: [
      { isaret: 'مـ', ad: 'Lâzım', ac: 'Durmak gerekir. Geçilirse mana bozulabilir.', isik: 'lz' },
      { isaret: 'قلى', ad: 'Durmak daha iyi', ac: 'Geçilebilir ama durmak daha iyi.', isik: 'de' },
      { isaret: 'ج', ad: 'Câiz', ac: 'Durmak da geçmek de eşit derecede caiz.', isik: 'cz' },
      { isaret: 'صلى', ad: 'Geçmek daha iyi', ac: 'Durulabilir ama geçmek daha iyi.', isik: 'ge' },
      { isaret: 'لا', ad: 'Durma', ac: 'Orada durma. Zorunda kalırsan bir önceki kelimeden tekrar başla.', isik: 'la' },
      { isaret: '∴ ∴', ad: 'Muânaka', ac: 'İkisinden birinde dur, ikisinde birden değil.', isik: 'mu' },
      { isaret: 'ـۜ', ad: 'Sekte', ac: 'Nefes almadan sesi çok kısa kesip devam et (Hafs\'ta 4 yer).', isik: 'sk' },
    ],
    turk: [
      { isaret: 'م', ad: 'Lâzım', ac: 'Mutlaka durulur.', isik: 'lz' },
      { isaret: 'ط', ad: 'Mutlak', ac: 'Durmak iyidir.', isik: 'de' },
      { isaret: 'ج', ad: 'Câiz', ac: 'Durmak da geçmek de caiz (durmak daha faziletli).', isik: 'cz' },
      { isaret: 'ز', ad: 'Mücevvez', ac: 'Geçmek daha faziletli.', isik: 'ge' },
      { isaret: 'ص', ad: 'Murahhas', ac: 'Nefes yetmezse durulabilir.', isik: 'ge' },
      { isaret: 'لا', ad: 'Durulmaz', ac: 'Orada durulmaz.', isik: 'la' },
    ] },
];

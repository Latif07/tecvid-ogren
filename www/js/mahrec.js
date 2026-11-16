// Mahreç dersi: bölümlü video (Kur'an Mektebim'deki gibi), harf harf Kur'an'dan dinleme, beden ipuçları.
// Videolar YouTube'un kendi oynatıcısıyla gömülür (indirilmez). Bölüm zamanları kanal sahiplerinin
// videoya girdiği bölümlerden alınmıştır (16 Kasım 2026'da YouTube'dan okundu).
// onay: false → hoca izleyip onaylamadı (ekranda "Hoca onayı bekliyor").
(function () {
  const KANAL = {
    tevhid: { ad: 'Tevhid Medya — Tecvid Dersleri', url: 'https://www.youtube.com/@TevhidMedyaResmi' },
    diyanet: { ad: 'Diyanet Dijital — Hafız Davut Kaya, Kur\'an Dersleri', url: 'https://www.youtube.com/@DiyanetDijital' },
  };
  // [video, başlangıç sn, bitiş sn (yoksa video sonu), başlık, harf]
  const V = {
    tevhid: {
      0: [['mhg13Qx5YSk', 269, 320, 'Harflerin mahreçleri']],
      2: [['mhg13Qx5YSk', 320, null, 'Cevf: med harfleri', 'ا و ي'], ['1DZINs1sOOM', 15, 45, 'Boğaz bölgesi; aksa\'l-halk'], ['1DZINs1sOOM', 45, 128, 'Hâ', 'ه'], ['1DZINs1sOOM', 128, 212, 'Hemze ve sakin hemze', 'ء'],
        ['1DZINs1sOOM', 212, 251, 'Vasatu\'l-halk'], ['1DZINs1sOOM', 251, 405, 'Hâ (ح)', 'ح'], ['1DZINs1sOOM', 405, 555, 'Ayn', 'ع'], ['1DZINs1sOOM', 555, 588, 'Edne\'l-halk'], ['1DZINs1sOOM', 588, 666, 'Hı', 'خ'], ['1DZINs1sOOM', 666, 770, 'Ğayın', 'غ']],
      3: [['hEMYIWvipbo', 42, 75, 'Dil bölgesi'], ['hEMYIWvipbo', 75, 174, 'Kâf ve örnekler', 'ق'], ['hEMYIWvipbo', 174, null, 'Kef ve örnekler', 'ك'],
        ['gby842585tA', 22, 33, 'Dilin ortası'], ['gby842585tA', 33, 75, 'Cîm', 'ج'], ['gby842585tA', 75, 129, 'Şîn', 'ش'], ['gby842585tA', 129, null, 'Yâ', 'ي']],
      4: [['6Gq5aTwgphE', 22, 145, 'Dâd: mahreç ve alıştırma', 'ض'], ['6Gq5aTwgphE', 145, null, 'Dâd okurken yapılan hatalar', 'ض'],
        ['y2CGC83DTNU', 41, 182, 'Lâm', 'ل'], ['y2CGC83DTNU', 182, 280, 'Nûn', 'ن'], ['y2CGC83DTNU', 280, null, 'Râ', 'ر'],
        ['84sUS6ByhZY', 45, 141, 'Tâ (ط) ve kalınlaşma', 'ط'], ['84sUS6ByhZY', 141, 210, 'Te (ت), Tâ\'dan farkı', 'ت'], ['84sUS6ByhZY', 210, null, 'Dâl', 'د'],
        ['1ShD2hztOcY', 37, 153, 'Sâd', 'ص'], ['1ShD2hztOcY', 153, 299, 'Sîn', 'س'], ['1ShD2hztOcY', 299, null, 'Zây', 'ز'],
        ['ttfEYTkXvFk', 43, 80, 'Peltek harfler: dilin yeri'], ['ttfEYTkXvFk', 80, 168, 'Zâ', 'ظ'], ['ttfEYTkXvFk', 168, 216, 'Sâ', 'ث'], ['ttfEYTkXvFk', 216, null, 'Zel', 'ذ']],
      5: [['Y-caH_s3hQo', 24, 40, 'Dudak bölgesi'], ['Y-caH_s3hQo', 40, 81, 'Fâ', 'ف'], ['Y-caH_s3hQo', 81, 160, 'Vâv; Türkçe "v" ile karıştırma', 'و'], ['Y-caH_s3hQo', 160, 199, 'Bâ', 'ب'], ['Y-caH_s3hQo', 199, 250, 'Mîm ve ğunne', 'م']],
    },
    diyanet: {   // harf harf, harekelerle okunuş
      2: [['dGiqhF5XziY', 49, 109, 'Elif', 'ا'], ['Byk2xrz_7ps', 139, 183, 'Hâ', 'ه'], ['Kw4nPEMYQyk', 109, 154, 'Ayn', 'ع'], ['JoSehOoZQ3o', 61, 107, 'Hâ (ح)', 'ح'], ['Kw4nPEMYQyk', 154, null, 'Ğayın', 'غ'], ['JoSehOoZQ3o', 107, null, 'Hı', 'خ']],
      3: [['kxNCMdeEjLY', 58, 99, 'Kâf', 'ق'], ['kxNCMdeEjLY', 99, 145, 'Kef', 'ك'], ['JoSehOoZQ3o', 16, 61, 'Cîm', 'ج'], ['XIiOvXo_4zg', 56, 99, 'Şîn', 'ش'], ['Byk2xrz_7ps', 183, null, 'Yâ', 'ي']],
      4: [['XIiOvXo_4zg', 146, null, 'Dâd', 'ض'], ['kxNCMdeEjLY', 145, null, 'Lâm', 'ل'], ['Byk2xrz_7ps', 57, 96, 'Nûn', 'ن'], ['fo61Tg9MJOw', 106, 159, 'Râ', 'ر'],
        ['Kw4nPEMYQyk', 14, 57, 'Tâ', 'ط'], ['fo61Tg9MJOw', 15, 59, 'Dâl', 'د'], ['dGiqhF5XziY', 153, 197, 'Te', 'ت'], ['XIiOvXo_4zg', 99, 146, 'Sâd', 'ص'], ['fo61Tg9MJOw', 159, null, 'Zây', 'ز'],
        ['XIiOvXo_4zg', 13, 56, 'Sîn', 'س'], ['Kw4nPEMYQyk', 57, 109, 'Zâ', 'ظ'], ['fo61Tg9MJOw', 59, 106, 'Zel', 'ذ'], ['dGiqhF5XziY', 197, null, 'Sâ', 'ث']],
      5: [['kxNCMdeEjLY', 14, 58, 'Fâ', 'ف'], ['dGiqhF5XziY', 109, 153, 'Bâ', 'ب'], ['Byk2xrz_7ps', 15, 57, 'Mîm', 'م'], ['Byk2xrz_7ps', 96, 139, 'Vâv', 'و']],
    },
  };
  // Harfi Kur'an'dan dinle: [ayet, kelime sırası, kelime] (gerçek kâri, kelime kelime ses)
  const KELIME = { 'ا': ['1:5', 1, 'إِيَّاكَ'], 'ء': ['1:5', 1, 'إِيَّاكَ'], 'ب': ['1:1', 1, 'بِسۡمِ'], 'ت': ['105:1', 2, 'تَرَ'], 'ث': ['101:6', 3, 'ثَقُلَتۡ'], 'ج': ['106:4', 4, 'جُوعٖ'], 'ح': ['111:4', 2, 'حَمَّالَةَ'],
    'خ': ['106:4', 7, 'خَوۡفِۭ'], 'د': ['109:6', 2, 'دِينُكُمۡ'], 'ذ': ['111:3', 3, 'ذَاتَ'], 'ر': ['1:2', 3, 'رَبِّ'], 'ز': ['102:2', 2, 'زُرۡتُمُ'], 'س': ['105:4', 4, 'سِجِّيلٖ'], 'ش': ['108:3', 2, 'شَانِئَكَ'],
    'ص': ['1:7', 1, 'صِرَٰطَ'], 'ض': ['100:1', 2, 'ضَبۡحٗا'], 'ط': ['105:3', 3, 'طَيۡرًا'], 'ظ': ['94:3', 3, 'ظَهۡرَكَ'], 'ع': ['1:7', 4, 'عَلَيۡهِمۡ'], 'غ': ['1:7', 5, 'غَيۡرِ'], 'ف': ['105:1', 4, 'فَعَلَ'],
    'ق': ['106:1', 2, 'قُرَيۡشٍ'], 'ك': ['105:1', 3, 'كَيۡفَ'], 'ل': ['1:2', 2, 'لِلَّهِ'], 'م': ['1:4', 1, 'مَٰلِكِ'], 'ن': ['1:5', 2, 'نَعۡبُدُ'], 'و': ['1:5', 3, 'وَإِيَّاكَ'], 'ه': ['106:3', 3, 'هَٰذَا'], 'ي': ['1:4', 2, 'يَوۡمِ'] };
  // Sayfaya özel örnek: cevf sayfasında ا و ي med harfi olarak
  const KELIME_SAYFA = { 2: { 'ا': ['106:3', 3, 'هَٰذَا'], 'و': ['1:7', 6, 'ٱلۡمَغۡضُوبِ'], 'ي': ['1:5', 4, 'نَسۡتَعِينُ'] } };
  const VIDEO_AD = { mhg13Qx5YSk: 'Tecvid ilmine giriş', '1DZINs1sOOM': 'Boğaz bölgesi (halk)', hEMYIWvipbo: 'Kâf ve Kef', gby842585tA: 'Cîm, Şîn, Yâ', '6Gq5aTwgphE': 'Dâd', y2CGC83DTNU: 'Lâm, Nûn, Râ', '84sUS6ByhZY': 'Tâ, Dâl, Te', '1ShD2hztOcY': 'Sâd, Sîn, Zây', ttfEYTkXvFk: 'Zâ, Zel, Sâ', 'Y-caH_s3hQo': 'Fâ, Vâv, Bâ, Mîm',
    dGiqhF5XziY: '3. Bölüm: ا ب ت ث', JoSehOoZQ3o: '4. Bölüm: ج ح خ', fo61Tg9MJOw: '5. Bölüm: د ذ ر ز', XIiOvXo_4zg: '6. Bölüm: س ش ص ض', Kw4nPEMYQyk: '7. Bölüm: ط ظ ع غ', kxNCMdeEjLY: '8. Bölüm: ف ق ك ل', Byk2xrz_7ps: '9. Bölüm: م ن و ه ى' };
  // Hisset: bedenle kontrol ipuçları (sayfa başına)
  const HISSET = {
    0: ['Harfi sakin yap, önüne üstünlü hemze getir: <span class="ar">أَبۡ · أَتۡ · أَقۡ</span>. Sesin kesildiği yer, harfin mahrecidir.'],
    2: ['<b>Boğaza parmak:</b> Parmaklarını hafifçe gırtlağına koy. <span class="ar">ع</span> derken boğaz sıkışır; <span class="ar">ح</span> derken nefes sürtünerek akar, sıkışma olmaz.',
      '<b>Derin → yakın:</b> <span class="ar">ء ه</span> en derinden, <span class="ar">ع ح</span> ortadan, <span class="ar">غ خ</span> ağza en yakın yerden çıkar. Sırayla <span class="ar">أَءۡ · أَحۡ · أَخۡ</span> de ve sesin yukarı çıktığını hisset.'],
    3: ['<b>Kalın – ince:</b> <span class="ar">ق</span> derken dilin kökü yükselir, ağız "o" der gibi dolgunlaşır. <span class="ar">ك</span> biraz daha önden, ince çıkar.',
      '<b>Avuç ağzın önünde:</b> <span class="ar">أَكۡ</span> derken avucunda nefes hissedersin (hems); <span class="ar">أَقۡ</span> derken hissetmezsin.'],
    4: ['<b>Ayna:</b> <span class="ar">ث ذ ظ</span> derken dil ucu dişlerin arasından görünmeli (peltek). Görünmüyorsa <span class="ar">س ز</span> gibi okuyorsun.',
      '<b>Islıklı harfler:</b> <span class="ar">ص ز س</span> derken dişler birbirine yaklaşır, ıslığa benzer bir ses çıkar.',
      '<b>Kalın – ince çiftler:</b> <span class="ar">ط / ت</span> ve <span class="ar">ص / س</span> aynı yerden çıkar; kalın olanlarda dilin arkası yükselir.'],
    5: ['<b>Ayna:</b> <span class="ar">ب م</span> derken dudaklar tam kapanır; <span class="ar">ف</span> derken alt dudak üst dişlere değer.',
      '<b><span class="ar">و</span> Türkçe "v" değildir:</b> dişler dudağa değmez, dudaklar yuvarlanır (İngilizce "w" gibi).'],
  };
  const SAYFA = { m1: true };
  const HARF_SIRA = { 2: 'ا و ي ء ه ع ح غ خ', 3: 'ق ك ج ش ي', 4: 'ض ل ن ر ط د ت ص س ز ظ ذ ث', 5: 'ف ب م و' };
  const zaman = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  const kelime = (i, h) => (KELIME_SAYFA[i] || {})[h] || KELIME[h];
  window.MAHREC = { KANAL, V, KELIME, KELIME_SAYFA, kelime, VIDEO_AD, HISSET, SAYFA, HARF_SIRA, zaman, onay: false };
})();

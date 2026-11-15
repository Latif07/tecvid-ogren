// Müezzinlik bölümü metinleri.
// Sıra ve sözler en az iki kaynakla karşılaştırıldı (bkz. KAYNAKLAR). Okunuşlar ve anlamlar bu uygulama için yazıldı.
// onay: false → hoca onayı bekliyor (ekranda gösterilir). Hoca onayından sonra true yapılır.
// satir: { ar, ok (okunuş), tr (anlam), n (kaç kez söylenir), not }
// kuran: [[sûre, ayet], ...] → Arapça metin, okunuş ve kâri sesi uygulamanın Kur'an verisinden gelir.
(function () {
  const L = (ar, ok, tr, n, not) => ({ ar, ok, tr, n: n || 1, not: not || '' });
  const SELA_BAS = 'اَلصَّلَاةُ وَالسَّلَامُ عَلَيْكَ';
  const EZAN_ORTAK = [
    L('اَللّٰهُ أَكْبَرُ اَللّٰهُ أَكْبَرُ', 'Allâhü ekber, Allâhü ekber', 'Allah en büyüktür, Allah en büyüktür.', 2),
    L('أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ', 'Eşhedü en lâ ilâhe illallâh', 'Şahitlik ederim ki Allah\'tan başka ilah yoktur.', 2),
    L('أَشْهَدُ أَنَّ مُحَمَّدًا رَسُولُ اللّٰهِ', 'Eşhedü enne Muhammeden rasûlullâh', 'Şahitlik ederim ki Muhammed Allah\'ın elçisidir.', 2),
    L('حَيَّ عَلَى الصَّلَاةِ', 'Hayye ale\'s-salâh', 'Haydi namaza!', 2),
    L('حَيَّ عَلَى الْفَلَاحِ', 'Hayye ale\'l-felâh', 'Haydi kurtuluşa!', 2),
  ];
  const EZAN_SON = [
    L('اَللّٰهُ أَكْبَرُ اَللّٰهُ أَكْبَرُ', 'Allâhü ekber, Allâhü ekber', 'Allah en büyüktür, Allah en büyüktür.', 1),
    L('لَا إِلٰهَ إِلَّا اللّٰهُ', 'Lâ ilâhe illallâh', 'Allah\'tan başka ilah yoktur.', 1),
  ];
  const DUA_KISA = 'Buhârî, Ezân 8 (Câbir b. Abdullah rivayeti).';

  const M = [
    { id: 'istiaze', ad: 'İstiâze ve Besmele', ikon: '🛡️', onay: false,
      satir: [
        L('أَعُوذُ بِاللّٰهِ مِنَ الشَّيْطَانِ الرَّجِيمِ', 'E\'ûzü billâhi mine\'ş-şeytâni\'r-racîm', 'Kovulmuş şeytandan Allah\'a sığınırım.'),
        L('بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ', 'Bismillâhi\'r-rahmâni\'r-rahîm', 'Rahmân ve Rahîm olan Allah\'ın adıyla.'),
      ], kaynak: 'İstiâze emri: Nahl 16/98. Besmele: Neml 27/30 ve Fâtiha\'nın başı.' },
    { id: 'sehadet', ad: 'Kelime-i Şehâdet', ikon: '☝️', onay: false,
      satir: [L('أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ', 'Eşhedü en lâ ilâhe illallâh ve eşhedü enne Muhammeden abdühû ve rasûlüh', 'Şahitlik ederim ki Allah\'tan başka ilah yoktur; yine şahitlik ederim ki Muhammed O\'nun kulu ve elçisidir.')],
      kaynak: 'Namazdaki teşehhüd (Tahiyyât) duasının son cümlesi.' },
    { id: 'tevhid', ad: 'Kelime-i Tevhid', ikon: '🤍', onay: false,
      satir: [L('لَا إِلٰهَ إِلَّا اللّٰهُ مُحَمَّدٌ رَسُولُ اللّٰهِ', 'Lâ ilâhe illallâh Muhammedün rasûlullâh', 'Allah\'tan başka ilah yoktur; Muhammed Allah\'ın elçisidir.')],
      kaynak: '"Lâ ilâhe illallâh": Muhammed 47/19. "Muhammedün rasûlullâh": Fetih 48/29.' },
    { id: 'sela', ad: 'Selâ', ikon: '📢', onay: false,
      satir: [
        L(SELA_BAS + ' يَا سَيِّدَنَا يَا رَسُولَ اللّٰهِ', 'Es-salâtü ve\'s-selâmü aleyk, yâ seyyidenâ yâ Rasûlallâh', 'Salât ve selâm sana olsun, ey efendimiz, ey Allah\'ın Elçisi!'),
        L(SELA_BAS + ' يَا سَيِّدَنَا يَا حَبِيبَ اللّٰهِ', 'Es-salâtü ve\'s-selâmü aleyk, yâ seyyidenâ yâ Habîballâh', 'Salât ve selâm sana olsun, ey efendimiz, ey Allah\'ın Sevgilisi!'),
        L(SELA_BAS + ' يَا سَيِّدَ الْأَوَّلِينَ وَالْآخِرِينَ', 'Es-salâtü ve\'s-selâmü aleyk, yâ seyyide\'l-evvelîne ve\'l-âhirîn', 'Salât ve selâm sana olsun, ey öncekilerin ve sonrakilerin efendisi!'),
      ], not: 'Cuma ve cenaze selâsında okunur. Makamla okunur; bölgeye göre "aleyk" tekrarı ve ekler değişebilir.',
      kaynak: 'Selâ, ezan gibi sünnetle gelmiş bir çağrı değil, Türkiye\'de yerleşmiş bir gelenektir (TDV İslâm Ansiklopedisi, "Salâtüselâm").' },
    { id: 'ezan', ad: 'Ezan', ikon: '🕌', onay: false,
      satir: [...EZAN_ORTAK,
        L('اَلصَّلَاةُ خَيْرٌ مِنَ النَّوْمِ', 'Es-salâtü hayrun mine\'n-nevm', 'Namaz uykudan hayırlıdır.', 2, 'Yalnızca sabah ezanında'),
        ...EZAN_SON],
      kaynak: 'Abdullah b. Zeyd\'in rüyası hadisi (Ebû Dâvûd, Tirmizî). Sabah ezanındaki ilave sünnetle sabittir.' },
    { id: 'ezanDuasi', ad: 'Ezan Duası', ikon: '🤲', onay: false,
      satir: [
        L('اَللّٰهُمَّ رَبَّ هٰذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ', 'Allâhümme rabbe hâzihi\'d-da\'veti\'t-tâmmeti ve\'s-salâti\'l-kâimeti', 'Allah\'ım! Ey bu eksiksiz davetin ve kılınacak namazın Rabbi!'),
        L('آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ', 'âti Muhammedeni\'l-vesîlete ve\'l-fadîlete', 'Muhammed\'e vesîleyi ve fazileti ver.'),
        L('وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ', 've\'b\'ashü makâmen mahmûdeni\'llezî ve\'adteh', 'Onu, kendisine vaat ettiğin Makâm-ı Mahmûd\'a ulaştır.'),
      ], not: 'Ezan bittikten sonra okunur.', kaynak: DUA_KISA },
    { id: 'ezanDuasiUzun', ad: 'Ezan Duası (uzun)', ikon: '🤲', onay: false,
      satir: [
        L('اَللّٰهُمَّ رَبَّ هٰذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ', 'Allâhümme rabbe hâzihi\'d-da\'veti\'t-tâmmeti ve\'s-salâti\'l-kâimeti', 'Allah\'ım! Ey bu eksiksiz davetin ve kılınacak namazın Rabbi!'),
        L('آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ وَالدَّرَجَةَ الرَّفِيعَةَ', 'âti Muhammedeni\'l-vesîlete ve\'l-fadîlete ve\'d-derecete\'r-refî\'ate', 'Muhammed\'e vesîleyi, fazileti ve yüksek dereceyi ver.'),
        L('وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ', 've\'b\'ashü makâmen mahmûdeni\'llezî ve\'adteh', 'Onu, kendisine vaat ettiğin Makâm-ı Mahmûd\'a ulaştır.'),
        L('إِنَّكَ لَا تُخْلِفُ الْمِيعَادَ', 'inneke lâ tuhlifü\'l-mî\'âd', 'Şüphesiz sen sözünden dönmezsin.'),
      ], not: 'Türkiye\'de yaygın okunan uzun hâli.',
      kaynak: DUA_KISA + ' "İnneke lâ tuhlifü\'l-mîâd" ilavesi Beyhakî\'nin rivayetindedir. "Ve\'d-derecete\'r-refîa" ilavesi yaygın okunur, hadis kaynaklarında geçmez.' },
    { id: 'kamet', ad: 'Kamet', ikon: '🧍', onay: false,
      satir: [...EZAN_ORTAK,
        L('قَدْ قَامَتِ الصَّلَاةُ', 'Kad kâmeti\'s-salâh', 'Namaz başladı.', 2),
        ...EZAN_SON],
      not: 'Farz namazdan hemen önce, ezandan daha hızlı okunur. Hanefî mezhebinde cümleler ezandaki gibi ikişer söylenir.',
      kaynak: 'Hanefî fıkıh kitaplarındaki kamet şekli; Diyanet\'in Türkiye\'deki uygulaması.' },
    { id: 'ayetelKursi', ad: 'Âyetü\'l-Kürsî', alt: 'Bakara 255', ikon: '📖', onay: true, kuran: [[2, 255]], kaynak: 'Bakara 2/255.' },
    { id: 'amenerrasulu', ad: 'Âmenerrasûlü', alt: 'Bakara 285–286', ikon: '📖', onay: true, kuran: [[2, 285], [2, 286]], kaynak: 'Bakara 2/285–286.' },
    { id: 'huvallahu', ad: 'Hüvallâhüllezî', alt: 'Haşr 22–24', ikon: '📖', onay: true, kuran: [[59, 22], [59, 23], [59, 24]], kaynak: 'Haşr 59/22–24.' },
    { id: 'tasdik', ad: 'Ayet tasdik sözü', ikon: '✅', onay: false,
      satir: [
        L('صَدَقَ اللّٰهُ الْعَظِيمُ', 'Sadakallâhü\'l-azîm', 'Yüce Allah doğru söyledi.'),
        L('وَصَدَقَ رَسُولُهُ النَّبِيُّ الْكَرِيمُ', 've sadaka rasûlühü\'n-nebiyyü\'l-kerîm', 'Onun değerli peygamberi de doğru söyledi.'),
        L('وَنَحْنُ عَلٰى ذٰلِكَ مِنَ الشَّاهِدِينَ وَالشَّاكِرِينَ', 've nahnü alâ zâlike mine\'ş-şâhidîne ve\'ş-şâkirîn', 'Biz de buna şahitlik edenlerden ve şükredenlerdeniz.'),
        L('وَالْحَمْدُ لِلّٰهِ رَبِّ الْعَالَمِينَ', 've\'l-hamdü lillâhi rabbi\'l-âlemîn', 'Hamd, âlemlerin Rabbi Allah\'adır.'),
      ], not: 'Kur\'an okunduktan sonra söylenir.', kaynak: 'Ayet veya hadis değildir; Kur\'an tilavetinden sonra söylenen yerleşik tasdik sözüdür.' },
    { id: 'namazBitimi', ad: 'Müezzin: namaz bitimi', ikon: '🕊️', onay: false, akis: 1,
      satir: [
        L('اَللّٰهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ', 'Allâhümme ente\'s-selâmü ve minke\'s-selâm', 'Allah\'ım! Sen Selâm\'sın, esenlik sendendir.'),
        L('تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ', 'tebârekte yâ ze\'l-celâli ve\'l-ikrâm', 'Ey celâl ve ikram sahibi, sen ne yücesin!'),
      ], not: 'Farz namazın selamından sonra.', kaynak: 'Müslim, Mesâcid (Hz. Âişe rivayeti).' },
    { id: 'salavatIstek', ad: 'Müezzin: salavat isteği', ikon: '📣', onay: false, akis: 2,
      satir: [L('عَلٰى رَسُولِنَا مُحَمَّدٍ صَلَوَاتٌ', 'Alâ rasûlinâ Muhammedin salavât', 'Peygamberimiz Muhammed\'e salavat (getirelim).')],
      not: 'Sünnetler kılındıktan sonra; cemaat sessizce salavat getirir.', kaynak: 'Türkiye camilerindeki müezzinlik uygulaması.' },
    { id: 'salavat', ad: 'Salavât-ı şerîfe', ikon: '🌹', onay: false, akis: 3,
      satir: [L('اَللّٰهُمَّ صَلِّ عَلٰى سَيِّدِنَا مُحَمَّدٍ وَعَلٰى آلِ سَيِّدِنَا مُحَمَّدٍ', 'Allâhümme salli alâ seyyidinâ Muhammedin ve alâ âli seyyidinâ Muhammed', 'Allah\'ım! Efendimiz Muhammed\'e ve onun ailesine rahmet eyle.')],
      kaynak: 'Namazdaki Allâhümme salli duasının başı; salavat emri: Ahzâb 33/56.' },
    { id: 'tesbihatOncesi', ad: 'Müezzin: tesbihat öncesi', ikon: '📿', onay: false, akis: 4,
      satir: [
        L('سُبْحَانَ اللّٰهِ وَالْحَمْدُ لِلّٰهِ وَلَا إِلٰهَ إِلَّا اللّٰهُ وَاللّٰهُ أَكْبَرُ', 'Sübhânallâhi ve\'l-hamdü lillâhi ve lâ ilâhe illallâhu vallâhu ekber', 'Allah\'ı tesbih ederim; hamd Allah\'adır; Allah\'tan başka ilah yoktur; Allah en büyüktür.'),
        L('وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ الْعَلِيِّ الْعَظِيمِ', 've lâ havle ve lâ kuvvete illâ billâhi\'l-aliyyi\'l-azîm', 'Güç ve kuvvet ancak yüce ve büyük Allah\'ındır.'),
      ], not: 'Ardından Âyetü\'l-Kürsî okunur.', kaynak: 'Türkiye camilerindeki müezzinlik uygulaması (iki kaynakta aynı sıra).' },
    { id: 'tesbihat', ad: 'Müezzin: tesbihat', ikon: '📿', onay: false, akis: 6,
      satir: [
        L('ذُو الْجَلَالِ سُبْحَانَ اللّٰهِ', 'Zü\'l-celâli sübhânallâh', 'Celâl sahibi Allah\'ı tesbih ederim.', 1, 'Âyetü\'l-Kürsî\'nin sonundan hemen sonra. Ardından 33 kez Sübhânallâh.'),
        L('سُبْحَانَ الْكَرِيمِ دَائِمًا اَلْحَمْدُ لِلّٰهِ', 'Sübhâne\'l-kerîmi dâimeni\'l-hamdü lillâh', 'Kerîm olan Allah\'ı tesbih ederim; hamd daima Allah\'adır.', 1, 'Ardından 33 kez Elhamdülillâh.'),
        L('رَبِّ الْعَالَمِينَ تَعَالٰى شَأْنُهُ اَللّٰهُ أَكْبَرُ', 'Rabbi\'l-âlemîne teâlâ şânühû Allâhü ekber', 'Âlemlerin Rabbi\'nin şanı yücedir; Allah en büyüktür.', 1, 'Ardından 33 kez Allâhü ekber.'),
        L('لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ', 'Lâ ilâhe illallâhü vahdehû lâ şerîke leh', 'Allah\'tan başka ilah yoktur; O birdir, ortağı yoktur.'),
        L('لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلٰى كُلِّ شَيْءٍ قَدِيرٌ', 'lehü\'l-mülkü ve lehü\'l-hamdü ve hüve alâ külli şey\'in kadîr', 'Mülk O\'nundur, hamd O\'nadır; O her şeye gücü yetendir.'),
        L('سُبْحَانَ رَبِّيَ الْعَلِيِّ الْأَعْلَى الْوَهَّابِ', 'Sübhâne rabbiye\'l-aliyyi\'l-a\'le\'l-vehhâb', 'Yüce, en yüce ve bol bağışlayan Rabbimi tesbih ederim.', 1, 'Ardından eller kaldırılıp dua edilir.'),
      ], kaynak: '33\'er tesbih ve tevhid: Müslim, Mesâcid (Ebû Hüreyre rivayeti). Geçiş cümleleri: Türkiye camilerindeki uygulama (iki kaynakta aynı).' },
  ];
  // Namaz sonrası akışı (prova): sıra ve Âyetü'l-Kürsî'nin yeri
  const AKIS = ['namazBitimi', 'salavatIstek', 'salavat', 'tesbihatOncesi', 'ayetelKursi', 'tesbihat'];
  const KAYNAKLAR = [
    ['OMÜ İlahiyat, Ezan-Kamet-Tesbih ders notu', 'https://avys.omu.edu.tr/storage/app/public/emre.pinarbasi/128918/EZAN%20KAMET%20TESBI%CC%87H.pdf'],
    ['İslam ve İhsan, Müezzinlik ve namaz sonrası tesbihat', 'https://www.islamveihsan.com/muezzinlik-ve-namaz-sonrasi-tesbihat-nasil-yapilir.html'],
    ['Namazzamani.net, Camilerde müezzinlik nasıl yapılır', 'https://namazzamani.net/turkce/camilerde-muezzinlik-nasil-yapilir.htm'],
  ];
  window.MUEZZIN = { M, AKIS, KAYNAKLAR };
})();

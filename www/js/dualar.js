// Dualar bölümü: namazda okunan dualar ve günlük dualar (Müezzinlik ekranlarıyla aynı yapı: gizleyerek ezber).
// Okunuşlar ve anlamlar KAYNAKLAR'daki sayfalarla karşılaştırıldı; Arapça metinler hoca onayından geçecek.
// onay: false → "Hoca onayı bekliyor". kuran: Kur'an'daki dua → metin, okunuş ve kâri sesi Kur'an verisinden.
(function () {
  const L = (ar, ok, tr, n, not) => ({ ar, ok, tr, n: n || 1, not: not || '' });
  const SALLI_BARIK = 'Ka\'b b. Ucre rivayeti (Buhârî ve Müslim). Namazın son oturuşunda Tahiyyât\'tan sonra okunur.';
  const M = [
    { id: 'd-subhaneke', ad: 'Sübhâneke', ikon: '🤲', onay: false, not: 'Namazın başında, iftitah tekbirinden sonra okunur.',
      satir: [
        L('سُبْحَانَكَ اللّٰهُمَّ وَبِحَمْدِكَ', 'Sübhânekellâhümme ve bi-hamdik', 'Allah\'ım! Seni her türlü eksiklikten uzak tutar, sana hamd ederim.'),
        L('وَتَبَارَكَ اسْمُكَ وَتَعَالٰى جَدُّكَ', 've tebârakesmük ve teâlâ ceddük', 'Senin adın mübarektir, şanın yücedir.', 1, 'Cenaze namazında burada "ve celle senâük" eklenir.'),
        L('وَلَا إِلٰهَ غَيْرُكَ', 've lâ ilâhe ğayruk', 'Senden başka ilah yoktur.'),
      ], kaynak: 'Türkiye\'de namaz kılınışında okunan metin (bkz. Kaynaklar).' },
    { id: 'd-tesbihler', ad: 'Rükû ve secde tesbihleri', ikon: '🙇', onay: false,
      satir: [
        L('سُبْحَانَ رَبِّيَ الْعَظِيمِ', 'Sübhâne rabbiye\'l-azîm', 'Yüce Rabbimi her türlü eksiklikten uzak tutarım.', 3, 'Rükûda söylenir.'),
        L('سَمِعَ اللّٰهُ لِمَنْ حَمِدَهُ', 'Semiallâhü li-men hamideh', 'Allah kendisine hamd edeni işitir.', 1, 'Rükûdan doğrulurken söylenir.'),
        L('رَبَّنَا لَكَ الْحَمْدُ', 'Rabbenâ leke\'l-hamd', 'Rabbimiz! Hamd sana mahsustur.', 1, 'Doğrulunca söylenir.'),
        L('سُبْحَانَ رَبِّيَ الْأَعْلٰى', 'Sübhâne rabbiye\'l-a\'lâ', 'En yüce Rabbimi her türlü eksiklikten uzak tutarım.', 3, 'Secdede söylenir.'),
      ], kaynak: 'Türkiye\'de namaz kılınışındaki tesbihler (bkz. Kaynaklar).' },
    { id: 'd-tahiyyat', ad: 'Ettehiyyâtü', ikon: '🕌', onay: false, not: 'Her oturuşta okunur.',
      satir: [
        L('اَلتَّحِيَّاتُ لِلّٰهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ', 'Ettehiyyâtü lillâhi ve\'s-salevâtü ve\'t-tayyibât', 'Her türlü saygı, dua ve güzel sözler Allah\'a mahsustur.'),
        L('اَلسَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللّٰهِ وَبَرَكَاتُهُ', 'Esselâmü aleyke eyyühe\'n-nebiyyü ve rahmetullâhi ve berakâtüh', 'Ey Peygamber! Allah\'ın selâmı, rahmeti ve bereketi senin üzerine olsun.'),
        L('اَلسَّلَامُ عَلَيْنَا وَعَلٰى عِبَادِ اللّٰهِ الصَّالِحِينَ', 'Esselâmü aleynâ ve alâ ibâdillâhi\'s-sâlihîn', 'Selâm bizim üzerimize ve Allah\'ın iyi kullarının üzerine olsun.'),
        L('أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ', 'Eşhedü en lâ ilâhe illallâh ve eşhedü enne Muhammeden abdühû ve rasûlüh', 'Şahitlik ederim ki Allah\'tan başka ilah yoktur; yine şahitlik ederim ki Muhammed O\'nun kulu ve elçisidir.'),
      ], kaynak: 'Abdullah b. Mes\'ûd rivayeti (Buhârî ve Müslim).' },
    { id: 'd-salli', ad: 'Allâhümme salli', ikon: '🌹', onay: false,
      satir: [
        L('اَللّٰهُمَّ صَلِّ عَلٰى مُحَمَّدٍ وَعَلٰى آلِ مُحَمَّدٍ', 'Allâhümme salli alâ Muhammedin ve alâ âli Muhammed', 'Allah\'ım! Muhammed\'e ve Muhammed\'in ailesine rahmet eyle,'),
        L('كَمَا صَلَّيْتَ عَلٰى إِبْرَاهِيمَ وَعَلٰى آلِ إِبْرَاهِيمَ', 'kemâ salleyte alâ İbrâhîme ve alâ âli İbrâhîm', 'İbrâhim\'e ve İbrâhim\'in ailesine rahmet ettiğin gibi.'),
        L('إِنَّكَ حَمِيدٌ مَجِيدٌ', 'inneke hamîdün mecîd', 'Şüphesiz sen övülmeye layıksın, şanı yücesin.'),
      ], kaynak: SALLI_BARIK },
    { id: 'd-barik', ad: 'Allâhümme bârik', ikon: '🌹', onay: false,
      satir: [
        L('اَللّٰهُمَّ بَارِكْ عَلٰى مُحَمَّدٍ وَعَلٰى آلِ مُحَمَّدٍ', 'Allâhümme bârik alâ Muhammedin ve alâ âli Muhammed', 'Allah\'ım! Muhammed\'i ve Muhammed\'in ailesini mübarek kıl,'),
        L('كَمَا بَارَكْتَ عَلٰى إِبْرَاهِيمَ وَعَلٰى آلِ إِبْرَاهِيمَ', 'kemâ bârakte alâ İbrâhîme ve alâ âli İbrâhîm', 'İbrâhim\'i ve İbrâhim\'in ailesini mübarek kıldığın gibi.'),
        L('إِنَّكَ حَمِيدٌ مَجِيدٌ', 'inneke hamîdün mecîd', 'Şüphesiz sen övülmeye layıksın, şanı yücesin.'),
      ], kaynak: SALLI_BARIK },
    { id: 'd-rabbena-atina', ad: 'Rabbenâ âtinâ', ikon: '🤲', onay: false, not: 'Salli ve Bârik\'ten sonra okunur.',
      satir: [L('رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ', 'Rabbenâ âtinâ fi\'d-dünyâ haseneten ve fi\'l-âhirati haseneten ve kınâ azâbe\'n-nâr', 'Rabbimiz! Bize dünyada da iyilik ver, ahirette de iyilik ver ve bizi ateş azabından koru.')],
      kaynak: 'Bakara 2/201 (ayetin dua kısmı).' },
    { id: 'd-rabbenagfirli', ad: 'Rabbenağfirlî', alt: 'İbrâhîm 41', ikon: '🤲', onay: true, kuran: [[14, 41]], not: 'Rabbenâ âtinâ\'dan sonra okunur.', kaynak: 'İbrâhîm 14/41.' },
    { id: 'd-kunut', ad: 'Kunut duaları', ikon: '🌙', onay: false, not: 'Vitir namazının üçüncü rekâtında, tekbir alındıktan sonra okunur.',
      satir: [
        L('اَللّٰهُمَّ إِنَّا نَسْتَعِينُكَ وَنَسْتَغْفِرُكَ وَنَسْتَهْدِيكَ', 'Allâhümme innâ nesteînüke ve nestağfirüke ve nestehdîk', 'Allah\'ım! Senden yardım ister, bağışlanma diler, doğru yolu isteriz.', 1, 'Kunut 1'),
        L('وَنُؤْمِنُ بِكَ وَنَتُوبُ إِلَيْكَ وَنَتَوَكَّلُ عَلَيْكَ', 've nü\'minü bike ve netûbü ileyke ve netevekkelü aleyk', 'Sana inanır, sana tövbe eder, sana dayanırız.'),
        L('وَنُثْنِي عَلَيْكَ الْخَيْرَ كُلَّهُ نَشْكُرُكَ وَلَا نَكْفُرُكَ', 've nüsnî aleyke\'l-hayra küllehû neşkürüke ve lâ nekfürük', 'Seni bütün hayırlarla överiz; sana şükreder, nankörlük etmeyiz.'),
        L('وَنَخْلَعُ وَنَتْرُكُ مَنْ يَفْجُرُكَ', 've nahleu ve netrükü men yefcürük', 'Sana karşı geleni bırakır, ondan uzak dururuz.'),
        L('اَللّٰهُمَّ إِيَّاكَ نَعْبُدُ وَلَكَ نُصَلِّي وَنَسْجُدُ', 'Allâhümme iyyâke na\'büdü ve leke nüsallî ve nescüdü', 'Allah\'ım! Yalnız sana kulluk eder, senin için namaz kılar, sana secde ederiz.', 1, 'Kunut 2'),
        L('وَإِلَيْكَ نَسْعٰى وَنَحْفِدُ نَرْجُو رَحْمَتَكَ وَنَخْشٰى عَذَابَكَ', 've ileyke nes\'â ve nahfidü nercû rahmeteke ve nahşâ azâbek', 'Sana koşar, sana yaklaşmaya çalışırız; rahmetini umar, azabından korkarız.'),
        L('إِنَّ عَذَابَكَ بِالْكُفَّارِ مُلْحِقٌ', 'inne azâbeke bi\'l-küffâri mülhık', 'Şüphesiz senin azabın inkârcılara ulaşır.'),
      ], kaynak: 'Türkiye\'de vitir namazında okunan iki kunut duası (bkz. Kaynaklar).' },
    { id: 'd-amentu', ad: 'Âmentü', ikon: '💚', onay: false,
      satir: [
        L('آمَنْتُ بِاللّٰهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ وَالْيَوْمِ الْآخِرِ', 'Âmentü billâhi ve melâiketihî ve kütübihî ve rusülihî ve\'l-yevmi\'l-âhiri', 'Allah\'a, meleklerine, kitaplarına, peygamberlerine ve ahiret gününe inandım;'),
        L('وَبِالْقَدَرِ خَيْرِهِ وَشَرِّهِ مِنَ اللّٰهِ تَعَالٰى', 've bi\'l-kaderi hayrihî ve şerrihî minallâhi teâlâ', 'hayrın da şerrin de Allah\'ın takdiriyle olduğuna inandım.'),
        L('وَالْبَعْثُ بَعْدَ الْمَوْتِ حَقٌّ', 've\'l-ba\'sü ba\'de\'l-mevti hakkun', 'Öldükten sonra dirilmek haktır.'),
        L('أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ', 'Eşhedü en lâ ilâhe illallâh ve eşhedü enne Muhammeden abdühû ve rasûlüh', 'Şahitlik ederim ki Allah\'tan başka ilah yoktur; yine şahitlik ederim ki Muhammed O\'nun kulu ve elçisidir.'),
      ], kaynak: 'İmanın esasları (Cibrîl hadisi, Müslim, Îmân 1). Türkiye\'de okutulan metin.' },
    { id: 'd-rabbi-yessir', ad: 'Rabbi yessir', ikon: '📖', onay: false, not: 'Derse ve hayırlı bir işe başlarken okunur.',
      satir: [L('رَبِّ يَسِّرْ وَلَا تُعَسِّرْ رَبِّ تَمِّمْ بِالْخَيْرِ', 'Rabbi yessir ve lâ tuassir, Rabbi temmim bi\'l-hayr', 'Rabbim! Kolaylaştır, zorlaştırma. Rabbim! Hayırla tamamla.')],
      kaynak: 'Türkiye\'de Kur\'an kurslarında derse başlarken okunan dua.' },
  ];
  const KAYNAKLAR = [
    ['İslam ve İhsan, Namazda okunan dua ve tesbihatların anlamları', 'https://www.islamveihsan.com/namazda-okunan-dua-ve-tesbihatlarin-anlamlari.html'],
    ['Milliyet, Kunut duaları okunuşu ve anlamı', 'https://www.milliyet.com.tr/ramazan/dualar/kunut-duasi-1-ve-2-ezberle-kunut-duasi-turkce-arapca-okunusu-ve-yazilisi-6304219'],
  ];
  window.DUALAR = { M, AKIS: [], KAYNAKLAR };
})();

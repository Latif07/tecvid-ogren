/* Tecvid Öğren — müfredat içeriği
 * Rivayet: Hafs an Âsım. Terimler: Türkiye'de yaygın tecvid terminolojisi.
 * Örnek ayetler Medine mushafı (Uthmani) metninden alınır (ayahs.js).
 * Örnek alanları: r = "sure:ayet", w = [kelime] veya [ilk, son] (1'den başlar),
 *   oku = okunuşu (Türkçe harflerle), n = açıklama.
 */
window.TC = (function () {
  const R = {}; // kurallar
  function rule(id, ad, grup, ozet, ekstra) { R[id] = Object.assign({ id, ad, grup, ozet }, ekstra || {}); }

  // ---- Medler
  rule('tabii', "Med-i tabîî", 'med', "Med harfinden sonra sebep yok: 1 elif uzatılır.", { elif: '1 elif' });
  rule('muttasil', "Med-i muttasıl", 'med', "Med harfinden sonra AYNI kelimede hemze var.", { elif: '2–5 elif (yaygın: 4)' });
  rule('munfasil', "Med-i munfasıl", 'med', "Med harfi bir kelimenin sonunda, hemze SONRAKİ kelimenin başında.", { elif: '1–4 elif' });
  rule('lazim', "Med-i lâzım", 'med', "Med harfinden sonra kalıcı (aslî) sükûn ya da şedde var.", { elif: '2–4 elif (yaygın: 3–4)' });
  rule('ariz', "Med-i ârız", 'med', "Med harfinden sonraki harf, durulduğu için sakin oluyor.", { elif: '1–4 elif' });
  rule('lin', "Med-i lîn", 'med', "Üstünlü harften sonra sakin و/ي; ardındaki harfte durulunca uzatılır.", { elif: '1–4 elif' });
  rule('sila', "Sıla (zamir uzatması)", 'med', "Harekeli iki harf arasındaki zamir ه'si uzatılır (küçük و / ي ile gösterilir).", { elif: '1 elif (hemze gelirse munfasıl gibi)' });

  // ---- Nûn sâkin ve tenvin
  rule('izhar', "İzhâr", 'nun', "Nûn sâkin/tenvinden sonra boğaz harfi (ء ه ع ح غ خ): nûn açık okunur.");
  rule('idgamMaal', "İdğâm-ı me'al-ğunne", 'nun', "Sonra ي ن م و gelirse: nûn karşıdaki harfe katılır, genizden okunur.");
  rule('idgamBila', "İdğâm-ı bilâ-ğunne", 'nun', "Sonra ل veya ر gelirse: nûn katılır, geniz sesi YOK.");
  rule('iklab', "İklâb", 'nun', "Sonra ب gelirse: nûn gizli bir م'ye döner, genizden okunur.");
  rule('ihfa', "İhfâ", 'nun', "Kalan 15 harften biri gelirse: nûn saklanır, genizden hafifçe okunur.");

  // ---- Mîm sâkin
  rule('ihfaSefevi', "İhfâ-i şefevî", 'mim', "Mîm sâkinden sonra ب: dudaklar hafif kapanır, genizden okunur.");
  rule('idgamMim', "İdğâm-ı misleyn (mîm)", 'mim', "Mîm sâkinden sonra م: iki mîm birleşir, genizden okunur.");
  rule('izharSefevi', "İzhâr-ı şefevî", 'mim', "Mîm sâkinden sonra diğer harfler: mîm açıkça okunur.");

  // ---- Ğunne
  rule('gunne', "Ğunne (şeddeli nûn/mîm)", 'gunne', "Şeddeli نّ veya مّ genizden, biraz tutularak okunur.");

  // ---- İdğamlar
  rule('misleyn', "İdğâm-ı misleyn", 'idgam', "Aynı iki harf yan yana: ilki sakin, ikincisine katılır.");
  rule('mutecaniseyn', "İdğâm-ı mütecâniseyn", 'idgam', "Mahreci aynı, sıfatı farklı iki harf: ilki ikincisine katılır.");
  rule('mutekaribeyn', "İdğâm-ı mütekâribeyn", 'idgam', "Mahreç/sıfatı birbirine yakın iki harf: ilki ikincisine katılır.");

  // ---- Kalkale
  rule('kalkale', "Kalkale", 'kalkale', "ق ط ب ج د harfleri sakin olunca sektirilerek okunur.");

  // ---- Lâm-ı tarif
  rule('kameri', "Lâm-ı tarif: kamerî", 'lam', "ال'den sonra kamerî harf: lâm okunur (el-kamer).");
  rule('semsi', "Lâm-ı tarif: şemsî", 'lam', "ال'den sonra şemsî harf: lâm okunmaz, sonraki harf şeddeli (eş-şems).");

  // ---- Lafzatullah
  rule('allahKalin', "Lafzatullah: kalın", 'lafza', "Öncesi üstün ya da ötre ise (veya başta): Allah'ın lâmı kalın.");
  rule('allahInce', "Lafzatullah: ince", 'lafza', "Öncesi esre ise: Allah'ın lâmı ince.");

  // ---- Râ
  rule('raKalin', "Râ: kalın", 'ra', "Üstün/ötreli râ; ya da sakin râdan önce üstün/ötre: kalın.");
  rule('raInce', "Râ: ince", 'ra', "Esreli râ; ya da sakin râdan önce (aslî) esre: ince.");

  // ---- Vakf / sekte / işaretler
  rule('sekte', "Sekte", 'vakf', "Nefes almadan sesi kısaca kesip devam etmek (Hafs'ta 4 yer).");
  rule('vakfLazim', "Vakf-ı lâzım (مـ)", 'vakf', "Durmak gerekir; geçilirse mana bozulabilir.");
  rule('vakfCaiz', "Vakf-ı câiz (ج)", 'vakf', "Durmak da geçmek de eşit derecede caiz.");
  rule('vaslEvla', "Geçmek daha iyi (صلى)", 'vakf', "Durulabilir ama geçmek daha iyidir.");
  rule('vakfEvla', "Durmak daha iyi (قلى)", 'vakf', "Geçilebilir ama durmak daha iyidir.");
  rule('muanaka', "Muânaka (∴ ∴)", 'vakf', "İki üç noktadan birinde durulur, ikisinde birden değil.");
  rule('ivaz', "Med-i ıvaz", 'vakf', "Üstün tenvinde durulunca tenvin düşer, 1 elif uzatılır (dabhâ).");
  rule('teMerbuta', "Yuvarlak te (ة) ile durmak", 'vakf', "ة üzerinde durulunca 'h' gibi okunur.");

  // ---- Hafs'a özel okunuşlar
  rule('imale', "İmâle", 'ozel', "Üstünü 'e' sesine kaydırmak: مَجۡرٜىٰهَا → mecrêhâ (Hafs'ta tek yer).");
  rule('ismam', "İşmâm", 'ozel', "تَأۡمَ۬نَّا: idğam yapılırken dudaklar ötre için yuvarlanır.");
  rule('teshil', "Teshîl", 'ozel', "ءَا۬عۡجَمِيّٞ: ikinci hemze hafifletilerek (elif ile hemze arası) okunur.");

  // ======================= BÖLÜMLER =======================
  const U = [];
  function unit(o) { U.push(o); }

  // Elif-Ba: harfleri sıfırdan tanıma (tecvide başlamadan önce)
  const HARFLER = [['ا', 'Elif'], ['ب', 'Be'], ['ت', 'Te'], ['ث', 'Se'], ['ج', 'Cim'], ['ح', 'Ha'], ['خ', 'Hı'], ['د', 'Dal'], ['ذ', 'Zel'], ['ر', 'Ra'],
    ['ز', 'Ze'], ['س', 'Sin'], ['ش', 'Şın'], ['ص', 'Sad'], ['ض', 'Dad'], ['ط', 'Tı'], ['ظ', 'Zı'], ['ع', 'Ayn'], ['غ', 'Ğayn'], ['ف', 'Fe'],
    ['ق', 'Kaf'], ['ك', 'Kef'], ['ل', 'Lam'], ['م', 'Mim'], ['ن', 'Nun'], ['و', 'Vav'], ['ه', 'He'], ['لا', 'Lamelif'], ['ي', 'Ye']];
  const harfTablo = (adlar) => `<div class="harf-tablo">${HARFLER.map((h, i) => `<div><span class="ar">${h[0]}</span><small>${adlar[i]}</small></div>`).join('')}</div>`;
  const SEKILLER = ['ب', 'ج', 'ع', 'ه', 'ك', 'م', 'ي'];
  const sekilTablo = (b) => `<table class="sekil-tablo"><tr>${b.map(x => `<th>${x}</th>`).join('')}</tr>${SEKILLER.map(h => `<tr><td class="ar">${h}</td><td class="ar">${h}ـ</td><td class="ar">ـ${h}ـ</td><td class="ar">ـ${h}</td></tr>`).join('')}</table>`;

  unit({
    id: 'e1', ad: "Elif-Ba: Arap harfleri", ikon: '🔠', kurallar: [],
    sayfalar: [
      { t: "Elif-Ba nedir?", h: `<p>Kur'an'ı okuyabilmek için önce harfleri tanımak gerekir. Bu harflerin hepsine birden <b>Elif-Ba</b> denir (ilk iki harfin adı).</p><ul><li>Arapça <b>sağdan sola</b> yazılır ve okunur.</li><li><b>28 harf</b> vardır. Eski elifbalarda <span class="ar">لا</span> (lamelif) de ayrıca sayılır.</li><li>Harfler kelimenin içinde <b>birbirine bitişir</b>; bu yüzden aynı harf başta, ortada ve sonda biraz farklı görünür.</li><li>Sesleri harekeler verir (üstün, esre, ötre). Onları bir sonraki bölümde öğreneceksin.</li></ul><p class="not">Harfleri ezberlemek için acele etme. Her gün tabloya bakıp yüksek sesle adlarını söyle.</p>` },
      { t: "Harfler ve adları", h: `<p>Sağdan sola, sırayla:</p>${harfTablo(HARFLER.map(h => h[1]))}<p class="soluk kucukyazi">Sıralama geleneksel elifbadaki gibidir (vav, he, lamelif, ye).</p>` },
      { t: "Noktalara dikkat", h: `<p>Birçok harf aynı şekildedir; onları <b>noktalar</b> ayırır:</p><ul><li><span class="ar">ب</span> altta 1 · <span class="ar">ت</span> üstte 2 · <span class="ar">ث</span> üstte 3 · <span class="ar">ن</span> üstte 1 · <span class="ar">ي</span> altta 2</li><li><span class="ar">ج</span> altta 1 · <span class="ar">ح</span> noktasız · <span class="ar">خ</span> üstte 1</li><li><span class="ar">د</span> noktasız · <span class="ar">ذ</span> üstte 1</li><li><span class="ar">ر</span> noktasız · <span class="ar">ز</span> üstte 1</li><li><span class="ar">س</span> noktasız · <span class="ar">ش</span> üstte 3</li><li><span class="ar">ص</span> noktasız · <span class="ar">ض</span> üstte 1</li><li><span class="ar">ط</span> noktasız · <span class="ar">ظ</span> üstte 1</li><li><span class="ar">ع</span> noktasız · <span class="ar">غ</span> üstte 1</li><li><span class="ar">ف</span> üstte 1 · <span class="ar">ق</span> üstte 2</li></ul><p class="not">Bir noktanın yeri bile harfi, dolayısıyla kelimeyi ve manayı değiştirir.</p>` },
      { t: "Başta, ortada, sonda", h: `<p>Harfler bitiştiği için şekil değiştirir. Birkaç örnek (sağdan sola: tek başına, başta, ortada, sonda):</p>${sekilTablo(['Tek', 'Başta', 'Ortada', 'Sonda'])}<p>Ortada <span class="ar">ـبـ ـتـ ـثـ ـنـ ـيـ</span> aynı çizgidir; yine noktalarına bakarak ayırırsın.</p>` },
      { t: "Bitişmeyen harfler", h: `<p>Şu 6 harf <b>kendinden sonraki harfe bitişmez</b> (öncekine bitişebilir):</p><p class="ar buyuk">ا د ذ ر ز و</p><p>Bu yüzden bu harflerden sonra kelimenin içinde küçük bir boşluk varmış gibi görünür: <span class="ar">وَرَدَ</span> (ve-ra-de) harflerin hiçbiri birbirine bitişmez.</p><p><span class="ar">لا</span> (lamelif), lâm ile elifin özel bitişik yazılışıdır.</p>` },
      { t: "Kalın harfler ve karışanlar", h: `<p><b>Kalın okunan 7 harf</b> (İbnü'l-Cezerî'nin sözüyle <span class="ar">خُصَّ ضَغْطٍ قِظْ</span>):</p><p class="ar buyuk">خ ص ض غ ط ق ظ</p><p>Bunların dışındaki harfler genelde incedir. Sık karıştırılanlar:</p><ul><li><span class="ar">ه</span> (boğazın en derininden, hafif nefesle) — <span class="ar">ح</span> (boğazın ortasından, hırıltısız) — <span class="ar">خ</span> (boğazın üstünden, hırıltılı)</li><li><span class="ar">س</span> (ince) — <span class="ar">ص</span> (kalın) — <span class="ar">ث</span> (dil ucu dişler arasında)</li><li><span class="ar">ز</span> — <span class="ar">ذ</span> — <span class="ar">ظ</span></li><li><span class="ar">ك</span> (ince) — <span class="ar">ق</span> (kalın, dilin kökünden)</li><li><span class="ar">ء</span> (hemze, boğazın en derininden) — <span class="ar">ع</span> (boğazın ortasından)</li></ul><p>Çıkış yerlerini "Mahrecler" bölümünde, karışan harfleri dinleyerek "Karıştırılan harfler" bölümünde ayrıntılı çalışacaksın.</p>` },
      { t: "Kelimede harfleri bulmak", h: `<p>Kur'an'dan birkaç kelimeyi harflerine ayıralım (sağdan sola):</p><ul><li><span class="ar">بِسۡمِ</span> = <span class="ar">ب</span> + <span class="ar">س</span> + <span class="ar">م</span></li><li><span class="ar">قُلۡ</span> = <span class="ar">ق</span> + <span class="ar">ل</span></li><li><span class="ar">رَبِّ</span> = <span class="ar">ر</span> + <span class="ar">ب</span> (şeddeli)</li><li><span class="ar">ٱلۡحَمۡدُ</span> = <span class="ar">ا</span> + <span class="ar">ل</span> + <span class="ar">ح</span> + <span class="ar">م</span> + <span class="ar">د</span></li></ul><p>Alıştırma ve testte kelimeyi <b>dinleyip</b> içindeki harfi bulacağın sorular da var.</p>` }
    ],
    sorular: [
      { q: "Arapça hangi yönde yazılır ve okunur?", a: "Sağdan sola", w: ["Soldan sağa", "Yukarıdan aşağıya", "İkisi de olur"] },
      { q: "Arap alfabesinde kaç harf vardır (lamelif ayrıca sayılmazsa)?", a: "28", w: ["22", "26", "32"] },
      { q: "ب harfinin adı nedir?", a: "Be", w: ["Te", "Se", "Nun"] },
      { q: "ث harfinin adı nedir?", a: "Se", w: ["Te", "Şın", "Be"] },
      { q: "خ harfinin adı nedir?", a: "Hı", w: ["Ha", "Cim", "Ğayn"] },
      { q: "ذ harfinin adı nedir?", a: "Zel", w: ["Dal", "Ze", "Zı"] },
      { q: "ش harfinin adı nedir?", a: "Şın", w: ["Sin", "Sad", "Se"] },
      { q: "ض harfinin adı nedir?", a: "Dad", w: ["Sad", "Dal", "Zı"] },
      { q: "ظ harfinin adı nedir?", a: "Zı", w: ["Tı", "Zel", "Dad"] },
      { q: "غ harfinin adı nedir?", a: "Ğayn", w: ["Ayn", "Hı", "Fe"] },
      { q: "ق harfinin adı nedir?", a: "Kaf", w: ["Fe", "Kef", "Vav"] },
      { q: "Hangisi 'Cim' harfidir?", a: "ج", w: ["ح", "خ", "د"] },
      { q: "Hangisi 'Ayn' harfidir?", a: "ع", w: ["غ", "ء", "ه"] },
      { q: "Hangisi 'He' harfidir?", a: "ه", w: ["ح", "خ", "ع"] },
      { q: "Hangi harf kendinden sonraki harfe BİTİŞMEZ?", a: "د", w: ["ب", "م", "ل"] },
      { q: "Hangisi kendinden sonraki harfe bitişen bir harftir?", a: "ن", w: ["ا", "ر", "و"] },
      { q: "ت harfinin noktaları nasıldır?", a: "Üstte 2 nokta", w: ["Altta 1 nokta", "Üstte 3 nokta", "Altta 2 nokta"] },
      { q: "ي (ye) harfinin noktaları nasıldır?", a: "Altta 2 nokta", w: ["Üstte 2 nokta", "Altta 1 nokta", "Noktası yoktur"] },
      { q: "ف ile ق arasındaki fark nedir?", a: "ف'de üstte 1, ق'da üstte 2 nokta var", w: ["İkisi aynı harftir", "ف'de altta nokta var", "ق noktasızdır"] },
      { q: "'قُلۡ' kelimesinin ilk harfi hangisidir?", a: "ق", w: ["ف", "ك", "ع"] },
      { q: "Kalın okunan 7 harf hangileridir?", a: "خ ص ض غ ط ق ظ", w: ["ب ت ث ن ي ف ك", "ا و ي ه ء ع ح", "ل ر ن م ب و ي"] }
    ],
    dinle: [
      { h: 'ق', r: '112:1', w: 1, k: 'قُلۡ', g: ['ق', 'ف', 'ع', 'غ'] },
      { h: 'ص', r: '1:7', w: 1, k: 'صِرَٰطَ', g: ['ص', 'ض', 'س', 'ش'] },
      { h: 'د', r: '111:1', w: 2, k: 'يَدَآ', g: ['د', 'ذ', 'ر', 'ز'] },
      { h: 'ب', r: '105:1', w: 5, k: 'رَبُّكَ', g: ['ب', 'ت', 'ث', 'ن'] },
      { h: 'ث', r: '108:1', w: 3, k: 'ٱلۡكَوۡثَرَ', g: ['ث', 'ت', 'ب', 'ن'] },
      { h: 'ع', r: '103:1', w: 1, k: 'وَٱلۡعَصۡرِ', g: ['ع', 'غ', 'ح', 'خ'] },
      { h: 'ح', r: '1:2', w: 1, k: 'ٱلۡحَمۡدُ', g: ['ح', 'ج', 'خ', 'ه'] },
      { h: 'ش', r: '113:2', w: 2, k: 'شَرِّ', g: ['ش', 'س', 'ص', 'ض'] }
    ]
  });

  unit({
    id: 'u0', ad: "Başlangıç: Harekeler ve işaretler", ikon: '✏️', kurallar: [],
    sayfalar: [
      { t: "Tecvid nedir?", h: `<p>Tecvid, Kur'an harflerini <b>doğru ve güzel</b> okumanın kurallarıdır. Trafik işaretleri gibi düşün: nerede <b>uzatacağını</b>, nerede <b>genizden</b> okuyacağını, nerede <b>duracağını</b> söyler.</p><p>Bu uygulamada her kuralı önce öğrenecek, sonra örneklerle görecek, sonra test olacaksın. Bölüm testinden <b>%80</b> alınca bir sonraki bölüm açılır.</p>` },
      { t: "Harekeler", h: `<p>Harflerin sesini harekeler verir:</p><ul><li><span class="ar">بَ</span> <b>Üstün (fetha)</b>: "be"</li><li><span class="ar">بِ</span> <b>Esre (kesra)</b>: "bi"</li><li><span class="ar">بُ</span> <b>Ötre (damme)</b>: "bu"</li></ul>` },
      { t: "Cezm (sükûn) ve şedde", h: `<p><b>Cezm/sükûn</b>: harf harekesizdir, kendinden önceki harfe bağlanır. Medine mushafında küçük bir baş gibi görünür: <span class="ar">قُلۡ</span> (kul).</p><p><b>Şedde</b> <span class="ar">ـّ</span>: harf iki kez okunur, ilki sakin ikincisi harekeli gibi: <span class="ar">رَبِّ</span> (rab-bi).</p>` },
      { t: "Tenvin", h: `<p>Tenvin, harekenin çift yazılmasıdır ve sonuna gizli bir <b>"n"</b> sesi ekler:</p><ul><li><span class="ar">بٗا / بًا</span> "ben"</li><li><span class="ar">بٖ / بٍ</span> "bin"</li><li><span class="ar">بٞ / بٌ</span> "bun"</li></ul><p><b>Medine mushafı ipucu:</b> Tenvin <b>üst üste</b> (<span class="ar">ـٌ ـً ـٍ</span>) yazılmışsa nûn <b>açık</b> okunur (izhâr). <b>Kaydırılmış</b> (<span class="ar">ـٞ ـٗ ـٖ</span>) yazılmışsa nûn ya gizlenir ya da sonraki harfe katılır (ihfâ / idğâm).</p>` },
      { t: "Med harfleri", h: `<p>Üç med (uzatma) harfi vardır:</p><ul><li><b>Elif</b> <span class="ar">ا</span>: önündeki harf üstünlü olunca → <span class="ar">قَالَ</span> "kâle"</li><li><b>Vav</b> <span class="ar">و</span> (sakin): önü ötreli olunca → <span class="ar">نُوحٌ</span> "nûh"</li><li><b>Ye</b> <span class="ar">ي</span> (sakin): önü esreli olunca → <span class="ar">فِيهِ</span> "fîhi"</li></ul><p>Kur'an'da bunların küçük hâlleri de vardır: dik üstün (<span class="ar">ـٰ</span>), küçük vav (<span class="ar">ـۥ</span>), küçük ye (<span class="ar">ـۦ</span>).</p>` },
      { t: "Medine mushafındaki küçük işaretler", h: `<ul><li><b>Med işareti</b> <span class="ar">ـٓ</span>: dalgalı çizgi. "Burada normalden fazla uzat" demektir.</li><li><b>Sükûnsuz nûn</b>: <span class="ar">مِن رَّبِّهِمۡ</span> — nûnun üstünde sükûn yoksa ve sonraki harf şeddeliyse <b>idğâm</b> vardır.</li><li><b>Küçük mîm</b> <span class="ar">ـۢ</span>: nûn ya da tenvinin "m"ye döndüğünü (iklâb) gösterir.</li><li><b>Hemze-i vasl</b> <span class="ar">ٱ</span>: kelime ortasında okunmaz, sadece başta okunur.</li></ul><p class="not">Not: Türkiye'de basılan mushaflarda işaretler biraz farklı olabilir. Örneğin her sakin nûnda cezm yazılır. Kurallar aynıdır.</p>` }
    ],
    sorular: [
      { q: "Şedde (ـّ) olan bir harf nasıl okunur?", a: "İki kez (ilki sakin, ikincisi harekeli gibi)", w: ["Hiç okunmaz", "Uzatılarak okunur", "Genizden okunur"] },
      { q: "Tenvin harfe hangi gizli sesi ekler?", a: "n", w: ["m", "h", "a"] },
      { q: "Hangisi med (uzatma) harflerinden DEĞİLDİR?", a: "ب", w: ["ا", "و", "ي"] },
      { q: "Elif (ا) ne zaman med harfi olur?", a: "Önündeki harf üstünlü olunca", w: ["Önündeki harf esreli olunca", "Önündeki harf ötreli olunca", "Şeddeli olunca"] },
      { q: "Sakin vav (و) ne zaman med harfi olur?", a: "Önündeki harf ötreli olunca", w: ["Önündeki harf üstünlü olunca", "Önündeki harf esreli olunca", "Her zaman"] },
      { q: "Medine mushafında tenvin KAYDIRILMIŞ yazılmışsa (ـٞ ـٗ ـٖ) ne anlama gelir?", a: "Nûn gizlenir veya sonraki harfe katılır", w: ["Nûn açıkça okunur", "Kelime uzatılır", "Orada durulmalıdır"] },
      { q: "Küçük mîm (ـۢ) işareti neyi gösterir?", a: "Nûnun 'm'ye döndüğünü (iklâb)", w: ["Durulacağını", "Şeddeyi", "Kalkaleyi"] },
      { q: "Hemze-i vasl (ٱ) kelime ortasında okunur mu?", a: "Hayır, okunmaz", w: ["Evet, her zaman", "Sadece uzatılarak", "Sadece genizden"] },
      { q: "Dalgalı med işareti (ـٓ) ne demektir?", a: "Normalden fazla uzat", w: ["Dur", "Genizden oku", "Okuma"] },
      { q: "Doğru mu? 'قُلۡ' kelimesinde lâm harfi sakindir.", a: "Doğru", w: ["Yanlış"] }
    ]
  });

  // Mahreç şeması (şematik; ölçekli bir anatomi çizimi değildir)
  const MAHREC_SVG = `<svg viewBox="0 0 360 300" xmlns="http://www.w3.org/2000/svg" class="mahrec" role="img" aria-label="Mahreç şeması"> <path d="M120 20 C80 22 55 45 50 80 L38 102 L52 110 L50 128 L58 134 L54 146 L60 154 L58 168 L64 176 L62 196 C66 214 84 222 110 222 L150 226 L170 300" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" opacity=".55"/> <path d="M330 300 C335 240 340 150 300 80 C275 35 200 15 120 20" fill="none" stroke="currentColor" stroke-width="2.2" opacity=".55"/> <path d="M62 112 C110 96 190 96 236 118 L236 128 C190 112 110 112 66 124 Z" class="b-hay"/> <path d="M66 130 C110 118 180 116 214 124 C226 128 234 136 236 146" fill="none" stroke="currentColor" stroke-width="2" opacity=".7"/> <rect x="61" y="131" width="7" height="12" rx="2" class="dis"/><rect x="61" y="160" width="7" height="11" rx="2" class="dis"/> <path d="M74 146 C110 132 190 130 222 146 C200 150 120 152 74 152 Z" class="b-cevf"/> <path d="M70 156 C90 150 130 148 170 150 C205 152 226 160 232 182 C236 200 232 222 226 236 L150 236 C110 220 80 190 70 156 Z" class="b-dil"/> <path d="M236 146 C244 180 246 230 250 300 L268 300 C262 230 262 180 252 140 Z" class="b-halk"/> <ellipse cx="52" cy="150" rx="9" ry="16" class="b-dudak"/> <g class="nokta"> <circle cx="258" cy="282" r="9"/><text x="258" y="286">2</text> <circle cx="255" cy="248" r="9"/><text x="255" y="252">3</text> <circle cx="250" cy="214" r="9"/><text x="250" y="218">4</text> <circle cx="214" cy="158" r="9"/><text x="214" y="162">5</text> <circle cx="192" cy="153" r="9"/><text x="192" y="157">6</text> <circle cx="148" cy="148" r="9"/><text x="148" y="152">7</text> <circle cx="118" cy="168" r="9"/><text x="118" y="172">8</text> <circle cx="94" cy="166" r="9"/><text x="94" y="170">9</text> <circle cx="80" cy="146" r="9" class="kucuk"/><text x="80" y="150">10–14</text> <circle cx="52" cy="176" r="9"/><text x="52" y="180">15</text> <circle cx="36" cy="150" r="9"/><text x="36" y="154">16</text> <circle cx="150" cy="104" r="9"/><text x="150" y="108">17</text> <circle cx="112" cy="141" r="9"/><text x="112" y="145">1</text> </g> </svg>`;
  const lejantMahrec = (b) => `<ol class="mahrec-liste">${b.map(x => `<li><b>${x[0]}</b><span>${x[1]}</span></li>`).join('')}</ol>`;

  unit({
    id: 'm1', ad: "Mahrecler: harflerin çıkış yerleri", ikon: '👄', kurallar: [],
    sayfalar: [
      { t: "Mahreç nedir?", h: `<p><b>Mahreç</b>, harfin çıktığı yerdir. Her harfin kendi "adresi" vardır. Harfi yanlış yerden çıkarırsan başka bir harfe dönüşür ve mana bozulabilir:</p><p><span class="ar">قَلۡب</span> (kalp) ↔ <span class="ar">كَلۡب</span> (köpek)</p><p>İbnü'l-Cezerî'nin görüşüne göre harfler <b>5 bölgede 17 mahreçten</b> çıkar: ağız-boğaz boşluğu (cevf), boğaz (halk), dil (lisan), dudaklar (şefeteyn) ve geniz (hayşum).</p><p class="not"><b>Mahreci bulma yolu:</b> Harfi sakin yap ve önüne harekeli bir hemze getir: <span class="ar">أَبۡ · أَقۡ · أَصۡ</span>. Sesin kesildiği yer o harfin mahrecidir.</p>` },
      { t: "Şema", h: `${MAHREC_SVG}<p class="soluk kucukyazi">Şematik çizimdir; numaralar sonraki sayfalardaki mahreçlerdir.</p>${lejantMahrec([['1', 'Cevf — med harfleri'], ['2–4', 'Boğaz (halk)'], ['5–14', 'Dil (lisan)'], ['15–16', 'Dudaklar (şefeteyn)'], ['17', 'Geniz (hayşum) — ğunne']])}` },
      { t: "Cevf ve boğaz (halk)", h: `${lejantMahrec([['1', '<b>Cevf</b> (ağız ve boğaz boşluğu): med harfleri <span class="ar">ا و ي</span>. Ses hava bitene kadar akar.'], ['2', '<b>Boğazın en derini</b> (aksa\'l-halk): <span class="ar">ء ه</span>'], ['3', '<b>Boğazın ortası</b> (vasatu\'l-halk): <span class="ar">ع ح</span>'], ['4', '<b>Boğazın ağza yakın kısmı</b> (edne\'l-halk): <span class="ar">غ خ</span>']])}<p class="not">Bu altı boğaz harfi, nûn sâkin ve tenvinde <b>izhâr</b> harfleridir. Mahreçleri nûndan uzak olduğu için nûn açık okunur.</p>` },
      { t: "Dilin kökü ve ortası", h: `${lejantMahrec([['5', '<b>Dilin kökü + yumuşak damak</b>: <span class="ar">ق</span> (kalın)'], ['6', '<b>Biraz daha önü</b>: <span class="ar">ك</span> (ince)'], ['7', '<b>Dilin ortası + üst damak</b>: <span class="ar">ج ش ي</span> (med harfi olmayan ي)']])}<p class="not"><span class="ar">ق</span> ile <span class="ar">ك</span> komşudur ama farklıdır: <span class="ar">ق</span> daha derinden ve kalın, <span class="ar">ك</span> daha önden ve ince çıkar.</p>` },
      { t: "Dilin kenarı ve ucu", h: `${lejantMahrec([['8', '<b>Dilin kenarı + azı dişleri</b> (sağ veya sol): <span class="ar">ض</span>'], ['9', '<b>Dil kenarının ön kısmı + üst diş etleri</b>: <span class="ar">ل</span>'], ['10', '<b>Dil ucu + üst ön diş etleri</b>: <span class="ar">ن</span>'], ['11', '<b>Dil ucu, nûnun biraz gerisi</b>: <span class="ar">ر</span>'], ['12', '<b>Dil ucu + üst ön dişlerin kökü</b>: <span class="ar">ط د ت</span>'], ['13', '<b>Dil ucu + ön dişler arası</b> (ıslıklı): <span class="ar">ص ز س</span>'], ['14', '<b>Dil ucu + üst ön dişlerin uçları</b>: <span class="ar">ظ ذ ث</span>']])}<p class="not">Dil ucunun en küçük kayması bile harfi değiştirir. Bu yüzden 10–14 numaralı mahreçleri <b>dinleyerek</b> çalış.</p>` },
      { t: "Dudaklar ve geniz", h: `${lejantMahrec([['15', '<b>Alt dudağın içi + üst ön dişlerin ucu</b>: <span class="ar">ف</span>'], ['16', '<b>İki dudak</b>: <span class="ar">ب م و</span>. Bu harflerden <span class="ar">ب</span> ve <span class="ar">م</span> okunurken dudaklar kapanır, <span class="ar">و</span> okunurken yuvarlanır.'], ['17', '<b>Geniz</b> (hayşum): <b>ğunne</b> sesi, yani nûn ve mîmin genizden gelen sesi']])}<p class="not">Burnunu hafifçe tutup <span class="ar">إِنَّ</span> de: ses kesiliyorsa ğunneyi genizden doğru çıkarıyorsun.</p>` }
    ],
    sorular: [
      { q: "Mahreç nedir?", a: "Harfin çıktığı yer", w: ["Harfin uzatılması", "Harfin kalın okunması", "Durma işareti"] },
      { q: "İbnü'l-Cezerî'ye göre kaç mahreç vardır?", a: "17", w: ["5", "28", "10"] },
      { q: "Mahreçler kaç ana bölgede toplanır?", a: "5", w: ["3", "17", "7"] },
      { q: "ع ve ح nereden çıkar?", a: "Boğazın ortasından", w: ["Boğazın en derininden", "Dudaklardan", "Dilin ucundan"] },
      { q: "ء ve ه nereden çıkar?", a: "Boğazın en derininden", w: ["Boğazın ortasından", "Genizden", "Dilin kökünden"] },
      { q: "ق nereden çıkar?", a: "Dilin kökü ile yumuşak damaktan", w: ["Dilin ucundan", "Dudaklardan", "Boğazın ortasından"] },
      { q: "ض nereden çıkar?", a: "Dilin kenarı ile azı dişlerinden", w: ["Dil ucu ile üst ön dişlerin ucundan", "İki dudaktan", "Genizden"] },
      { q: "ظ ذ ث harfleri nereden çıkar?", a: "Dil ucu ile üst ön dişlerin uçlarından", w: ["Dilin kenarı ile azı dişlerinden", "Boğazın ortasından", "Dilin kökünden"] },
      { q: "ف nereden çıkar?", a: "Alt dudağın içi ile üst ön dişlerin ucundan", w: ["İki dudaktan", "Dilin ortasından", "Genizden"] },
      { q: "Ğunne sesi nereden çıkar?", a: "Genizden (hayşum)", w: ["Boğazdan", "Dudaklardan", "Dilin ucundan"] },
      { q: "Med harflerinin mahreci neresidir?", a: "Cevf (ağız ve boğaz boşluğu)", w: ["Dilin ucu", "İki dudak", "Boğazın en derini"] },
      { q: "Bir harfin mahrecini bulmak için ne yapılır?", a: "Harf sakin yapılır, önüne harekeli hemze getirilir (أَبۡ)", w: ["Harf uzatılır", "Harf şeddeli okunur", "Harf genizden okunur"] }
    ]
  });

  unit({
    id: 'm2', ad: "Harflerin sıfatları", ikon: '🎭', kurallar: [],
    sayfalar: [
      { t: "Sıfat nedir?", h: `<p>Mahreç harfin <b>adresi</b> ise sıfat onun <b>karakteridir</b>: nefes akıyor mu, ses hapsoluyor mu, kalın mı ince mi?</p><p>Aynı yerden çıkan harfleri sıfatlar ayırır. Örneğin <span class="ar">ت</span> ile <span class="ar">ط</span> aynı mahreçten çıkar, ama <span class="ar">ط</span> kalın ve dolgun, <span class="ar">ت</span> ince ve nefeslidir.</p><p>Sıfatlar ikiye ayrılır: <b>zıtlı</b> (çiftler halinde) ve <b>zıtsız</b> (tek başına).</p>` },
      { t: "Zıtlı sıfatlar (1)", h: `<ul><li><b>Hems</b> (nefesin akması) — 10 harf: <span class="ar">فَحَثَّهُ شَخۡصٌ سَكَتَ</span><br>Zıddı <b>cehr</b>: nefes tutulur, ses güçlüdür (diğer 19 harf).</li><li><b>Şiddet</b> (sesin hapsolması) — 8 harf: <span class="ar">أَجِدۡ قَطٍ بَكَتۡ</span><br>Zıddı <b>rehâvet</b>: ses akar.</li><li><b>Beyniyye / tavassut</b> (ikisi arası) — 5 harf: <span class="ar">لِنۡ عُمَرۡ</span></li></ul>` },
      { t: "Zıtlı sıfatlar (2)", h: `<ul><li><b>İsti'lâ</b> (dilin kökü yükselir, harf kalın çıkar) — 7 harf: <span class="ar">خُصَّ ضَغۡطٍ قِظۡ</span><br>Zıddı <b>istifâl</b>: dil aşağıda kalır.</li><li><b>İtbâk</b> (dil damağa kapanır) — 4 harf: <span class="ar">ص ض ط ظ</span><br>Zıddı <b>infitâh</b>: dil ile damak arası açıktır.</li><li><b>İzlâk</b> (dil ucundan ve dudaktan kolay çıkan) — 6 harf: <span class="ar">فِرَّ مِنۡ لُبٍّ</span><br>Zıddı <b>ismât</b>.</li></ul>` },
      { t: "Zıtsız sıfatlar", h: `<ul><li><b>Safîr</b> (ıslık sesi): <span class="ar">ز س ص</span></li><li><b>Kalkale</b> (sekme): <span class="ar">ق ط ب ج د</span></li><li><b>Lîn</b> (yumuşaklık): üstünden sonra sakin <span class="ar">و ي</span></li><li><b>İnhirâf</b> (sapma): <span class="ar">ل ر</span></li><li><b>Tekrîr</b> (titreme eğilimi): <span class="ar">ر</span> — bilinmeli ama abartılmamalı; râ titretilmez</li><li><b>Tefeşşî</b> (sesin ağızda yayılması): <span class="ar">ش</span></li><li><b>İstitâle</b> (sesin uzaması): <span class="ar">ض</span></li></ul>` },
      { t: "Kalın ve ince harfler", h: `<ul><li><b>Her zaman kalın</b>: isti'lâ harfleri <span class="ar">خ ص ض غ ط ق ظ</span></li><li><b>Duruma göre</b>: <span class="ar">ر</span> (râ bölümünde öğreneceksin) ve Allah lafzındaki <span class="ar">ل</span></li><li><b>Elif</b>: kendinden önceki harfe uyar — <span class="ar">قَالَ</span>'de kalın, <span class="ar">كَانَ</span>'de ince</li><li><b>Diğerleri</b>: her zaman ince</li></ul><p class="not">Türkçe konuşanların en sık hatası, ince harfleri kalınlaştırmak ya da kalın harfleri inceltmektir. Kalınlık dilin kökünün yükselmesiyle olur, dudakları yuvarlayarak değil.</p>` }
    ],
    sorular: [
      { q: "Hems (nefesin akması) harflerinin ezber cümlesi hangisidir?", a: "فَحَثَّهُ شَخۡصٌ سَكَتَ", w: ["أَجِدۡ قَطٍ بَكَتۡ", "خُصَّ ضَغۡطٍ قِظۡ", "لِنۡ عُمَرۡ"] },
      { q: "Şiddet (sesin hapsolması) harflerinin ezber cümlesi hangisidir?", a: "أَجِدۡ قَطٍ بَكَتۡ", w: ["فَحَثَّهُ شَخۡصٌ سَكَتَ", "فِرَّ مِنۡ لُبٍّ", "لِنۡ عُمَرۡ"] },
      { q: "İsti'lâ (kalın) harfleri hangileridir?", a: "خُصَّ ضَغۡطٍ قِظۡ", w: ["فِرَّ مِنۡ لُبٍّ", "أَجِدۡ قَطٍ بَكَتۡ", "ي ن م و"] },
      { q: "İtbâk harfleri hangileridir?", a: "ص ض ط ظ", w: ["ز س ص", "ق ط ب ج د", "ل ر"] },
      { q: "Safîr (ıslık) harfleri hangileridir?", a: "ز س ص", w: ["ص ض ط ظ", "ل ر", "ق ك"] },
      { q: "Tekrîr sıfatı hangi harfindir?", a: "ر", w: ["ل", "ش", "ض"] },
      { q: "İstitâle sıfatı hangi harfindir?", a: "ض", w: ["ش", "ر", "ظ"] },
      { q: "Tefeşşî (sesin yayılması) hangi harfindir?", a: "ش", w: ["س", "ض", "ر"] },
      { q: "Hems ne demektir?", a: "Harf okunurken nefesin akması", w: ["Sesin hapsolması", "Dilin damağa kapanması", "Sesin genizden gelmesi"] },
      { q: "ت ile ط arasındaki fark nedir?", a: "Aynı mahreçten çıkar; ط kalın (isti'lâ, itbâk), ت ince", w: ["Mahreçleri farklıdır, sıfatları aynıdır", "ت kalın, ط incedir", "Hiçbir farkı yoktur"] },
      { q: "Elif kalın mı okunur, ince mi?", a: "Kendinden önceki harfe uyar", w: ["Her zaman kalın", "Her zaman ince", "Genizden okunur"] },
      { q: "Doğru mu? Râ harfi okunurken titretilmelidir.", a: "Yanlış", w: ["Doğru"] }
    ]
  });

  unit({
    id: 'm3', ad: "Karıştırılan harfler", ikon: '🎧', kurallar: [],
    sayfalar: [
      { t: "Neden karışıyor?", h: `<p>Türkçede bu seslerin çoğu yok. Bu yüzden şu gruplar kulağa aynı gelir:</p><ul><li><span class="ar">ض ظ ذ ز</span> → hepsi "z" gibi</li><li><span class="ar">ث س ص</span> → hepsi "s" gibi</li><li><span class="ar">ح ه خ</span> → hepsi "h" gibi</li><li><span class="ar">ع ء</span>, <span class="ar">ق ك</span>, <span class="ar">ط ت</span></li></ul><p>Ama Kur'an'da harf değişince anlam değişir:</p><p><span class="ar">عَلِيم</span> (bilen) ↔ <span class="ar">أَلِيم</span> (acı veren)</p><p class="not">Bu bölümü mutlaka <b>sesle</b> çalış. Alıştırma ve testte "Dinle ve bul" soruları var.</p>` },
      { t: "ض ظ ذ ز", h: `<ul><li><span class="ar">ض</span>: dilin kenarı azı dişlerine dayanır; <b>kalın</b>, ses uzar (istitâle)</li><li><span class="ar">ظ</span>: dil ucu üst ön dişlerin ucunda, dil hafif dışarıda; <b>kalın</b></li><li><span class="ar">ذ</span>: <span class="ar">ظ</span> ile aynı yer; <b>ince</b></li><li><span class="ar">ز</span>: dil ucu ön dişlerin arkasında, ıslıklı; <b>ince</b></li></ul><p class="not">İpucu: <span class="ar">ظ</span> ve <span class="ar">ذ</span> okurken dilin ucunu dişlerin arasında hissetmelisin.</p>` },
      { t: "ث س ص", h: `<ul><li><span class="ar">ث</span>: dil ucu üst ön dişlerin ucunda, peltek bir "s"; <b>ince</b>, nefesli</li><li><span class="ar">س</span>: dil ucu ön dişlerin arkasında, ıslıklı; <b>ince</b></li><li><span class="ar">ص</span>: <span class="ar">س</span> ile aynı yer ama dil damağa kapanır; <b>kalın</b></li></ul>` },
      { t: "ح ه خ — ع ء", h: `<ul><li><span class="ar">ه</span>: boğazın en derininden, hafif ve rahat bir nefes</li><li><span class="ar">ح</span>: boğazın ortasından, boğaz sıkışarak çıkan nefes (Türkçede yok)</li><li><span class="ar">خ</span>: boğazın ağza yakın kısmından, hırıltılı ses</li><li><span class="ar">ء</span>: boğazın derininde sesin ani kesilmesi</li><li><span class="ar">ع</span>: boğazın ortasından, sıkışan ve sesli bir harf</li></ul>` },
      { t: "ق ك — ط ت", h: `<ul><li><span class="ar">ق</span>: dilin kökünden, <b>kalın</b>, nefes akmaz</li><li><span class="ar">ك</span>: biraz daha önden, <b>ince</b>, nefesli</li><li><span class="ar">ط</span>: dil ucu üst dişlerin kökünde, dil damağa kapanır; <b>kalın</b></li><li><span class="ar">ت</span>: aynı yer, <b>ince</b> ve nefesli</li></ul>` }
    ],
    sorular: [
      { q: "عَلِيم ile أَلِيم arasındaki fark neden önemlidir?", a: "ع yerine ء okumak anlamı değiştirir (bilen / acı veren)", w: ["Fark yoktur, ikisi de aynı okunur", "Sadece uzatma farkı vardır", "Sadece kalınlık farkı vardır"] },
      { q: "Hangisi kalın okunur?", a: "ص", w: ["س", "ث", "ز"] },
      { q: "ظ ile ذ arasındaki fark nedir?", a: "Aynı yerden çıkarlar; ظ kalın, ذ ince", w: ["Mahreçleri çok uzaktır", "ذ kalın, ظ incedir", "Hiçbir farkı yoktur"] },
      { q: "ح ile ه arasındaki fark nedir?", a: "ح boğazın ortasından sıkışarak, ه en derinden hafif nefesle çıkar", w: ["İkisi de dudaktan çıkar", "ه daha kalındır", "Hiçbir farkı yoktur"] },
      { q: "ث nasıl çıkarılır?", a: "Dil ucu üst ön dişlerin ucuna değer (peltek s)", w: ["Dilin kökünden", "İki dudaktan", "Boğazın ortasından"] },
      { q: "ق ile ك arasındaki fark nedir?", a: "ق daha derinden ve kalın, ك daha önden ve ince", w: ["ك daha kalındır", "İkisi de dudaktan çıkar", "Hiçbir farkı yoktur"] }
    ],
    dinle: [
      { h: 'ض', r: '1:7', w: 9, k: 'ٱلضَّآلِّينَ', g: ['ض', 'ظ', 'ذ', 'ز'] },
      { h: 'ظ', r: '2:19', w: 6, k: 'ظُلُمَٰتٞ', g: ['ض', 'ظ', 'ذ', 'ز'] },
      { h: 'ذ', r: '2:2', w: 1, k: 'ذَٰلِكَ', g: ['ض', 'ظ', 'ذ', 'ز'] },
      { h: 'ز', r: '99:1', w: 2, k: 'زُلۡزِلَتِ', g: ['ض', 'ظ', 'ذ', 'ز'] },
      { h: 'ث', r: '101:4', w: 5, k: 'ٱلۡمَبۡثُوثِ', g: ['ث', 'س', 'ص'] },
      { h: 'س', r: '114:4', w: 3, k: 'ٱلۡوَسۡوَاسِ', g: ['ث', 'س', 'ص'] },
      { h: 'ص', r: '1:6', w: 2, k: 'ٱلصِّرَٰطَ', g: ['ث', 'س', 'ص'] },
      { h: 'ح', r: '1:2', w: 1, k: 'ٱلۡحَمۡدُ', g: ['ح', 'ه', 'خ'] },
      { h: 'ه', r: '112:1', w: 2, k: 'هُوَ', g: ['ح', 'ه', 'خ'] },
      { h: 'خ', r: '113:2', w: 4, k: 'خَلَقَ', g: ['ح', 'ه', 'خ'] },
      { h: 'ع', r: '1:5', w: 2, k: 'نَعۡبُدُ', g: ['ع', 'ء'] },
      { h: 'ء', r: '2:4', w: 4, k: 'أُنزِلَ', g: ['ع', 'ء'] },
      { h: 'ق', r: '113:1', w: 1, k: 'قُلۡ', g: ['ق', 'ك'] },
      { h: 'ك', r: '102:1', w: 1, k: 'أَلۡهَىٰكُمُ', g: ['ق', 'ك'] },
      { h: 'ط', r: '105:3', w: 3, k: 'طَيۡرًا', g: ['ط', 'ت'] },
      { h: 'ت', r: '1:5', w: 4, k: 'نَسۡتَعِينُ', g: ['ط', 'ت'] }
    ]
  });

  unit({
    id: 'u1', ad: "Med-i tabîî (doğal uzatma)", ikon: '🎈', kurallar: ['tabii'],
    sayfalar: [
      { t: "Balon gibi şişir", h: `<p>Med harfi (<span class="ar">ا و ي</span>) geldiğinde ve <b>arkasında hemze ya da sükûn yoksa</b> harfi <b>1 elif</b> uzatırsın.</p><p><b>1 elif</b> ne kadar? Parmağını açıp kapatma süresi kadar; kabaca iki hareke.</p><p><span class="ar">قَالَ</span> → "kââle" değil, "kâle".</p>` },
      { t: "Neden 'tabîî'?", h: `<p>Çünkü bu uzatma harfin doğasında var. Med harfi olan bir kelime bu uzatma olmadan zaten doğru okunamaz. Diğer bütün medlerin temeli budur. Önce bunu sağlam öğren!</p><p class="not">Ayrıntı: Bir kelimede hemzeden sonra gelen med (<span class="ar">ءَامَنُواْ</span>, "âmenû") da Hafs'ta 1 elif okunur. Buna med-i bedel denir ve tabîî gibi uygulanır.</p>` }
    ],
    ornek: [
      { k: 'tabii', r: '1:4', w: [1], oku: "mâliki", n: "Mîmin üstündeki dik üstün (ـٰ) elif yerine geçer: 1 elif." },
      { k: 'tabii', r: '113:2', w: [3], oku: "mâ", n: "Üstünlü mîmden sonra elif." },
      { k: 'tabii', r: '1:7', w: [2], oku: "ellezîne", n: "Esreli zelden sonra sakin ye." },
      { k: 'tabii', r: '114:5', w: [4], oku: "sudûri", n: "Ötreli dalden sonra sakin vav." },
      { k: 'tabii', r: '109:6', w: [2], oku: "dînukum", n: "Esreli dalden sonra sakin ye." },
      { k: 'tabii', r: '99:3', w: [1], oku: "ve kâle", n: "Üstünlü kâftan sonra elif." },
      { k: 'tabii', r: '103:3', w: [3], oku: "âmenû", n: "Hem başta hem sonda 1 elif uzatma var." }
    ],
    sorular: [
      { q: "Med-i tabîî kaç elif uzatılır?", a: "1 elif", w: ["4 elif", "Hiç uzatılmaz", "6 elif"] },
      { q: "Med-i tabîîde med harfinden sonra ne OLMAZ?", a: "Hemze veya sükûn", w: ["Harekeli bir harf", "Herhangi bir harf", "Kelimenin sonu"] },
      { q: "'قِيلَ' kelimesinde hangi harf uzatılır?", a: "Ye (ي): 'kîle'", w: ["Kâf", "Lâm", "Hiçbiri"] },
      { q: "Dik üstün (ـٰ) ne yerine geçer?", a: "Elif (med harfi)", w: ["Şedde", "Sükûn", "Tenvin"] },
      { q: "Doğru mu? Bütün diğer medlerin temeli med-i tabîîdir.", a: "Doğru", w: ["Yanlış"] }
    ]
  });

  unit({
    id: 'u2', ad: "Med-i muttasıl", ikon: '🔗', kurallar: ['muttasil'],
    sayfalar: [
      { t: "Bitişik uzatma", h: `<p><b>Muttasıl</b> "bitişik" demektir. Med harfi ve hemze (<span class="ar">ء</span>) <b>aynı kelimede</b> yan yanadır.</p><p><span class="ar">جَآءَ</span> → "cââe". Med işaretini (<span class="ar">ـٓ</span>) görünce fazla uzat!</p>` },
      { t: "Ne kadar?", h: `<p>Kaynaklar <b>2 ile 5 elif</b> arasını kabul eder. Türkiye'de yaygın uygulama <b>4 elif</b>tir. Önemli olan: <b>tabîîden daha uzun</b> okunur ve bu med <b>vaciptir</b> (kısaltılmaz).</p><p class="not">Okuyuş boyunca aynı ölçüyü korumaya çalış. Birinde 4, diğerinde 2 elif uzatma.</p>` }
    ],
    ornek: [
      { k: 'muttasil', r: '110:1', w: [2], oku: "cââe", n: "Elif ve hemze aynı kelimede." },
      { k: 'muttasil', r: '85:1', w: [1], oku: "ve's-semââi", n: "Mîmden sonra elif, sonra hemze." },
      { k: 'muttasil', r: '106:2', w: [3], oku: "eş-şitââi", n: "Elif ve hemze bitişik." },
      { k: 'muttasil', r: '98:5', w: [9], oku: "hunefââe", n: "Fe'den sonra elif + hemze." },
      { k: 'muttasil', r: '2:6', w: [4], oku: "sevââun", n: "Aynı kelimede elif + hemze." },
      { k: 'muttasil', r: '98:8', w: [1], oku: "cezââuhum", n: "Elif + hemze, sonra devam." },
      { k: 'muttasil', r: '2:19', w: [4], oku: "es-semââi", n: "Aynı kelimede elif + hemze." }
    ],
    sorular: [
      { q: "Med-i muttasılda hemze nerededir?", a: "Med harfiyle aynı kelimede", w: ["Bir sonraki kelimede", "Kelimenin başında", "Hiç yoktur"] },
      { q: "'Muttasıl' kelimesinin anlamı nedir?", a: "Bitişik", w: ["Ayrık", "Kısa", "Gizli"] },
      { q: "Türkiye'de med-i muttasıl yaygın olarak kaç elif uzatılır?", a: "4 elif", w: ["1 elif", "Hiç uzatılmaz", "8 elif"] },
      { q: "Hangisinde med-i muttasıl vardır?", a: "جَآءَ", w: ["قَالَ", "فِيهِ", "قُلۡ"] },
      { q: "Doğru mu? Med-i muttasıl tabîîden daha uzun okunur.", a: "Doğru", w: ["Yanlış"] }
    ]
  });

  unit({
    id: 'u3', ad: "Med-i munfasıl", ikon: '↔️', kurallar: ['munfasil'],
    sayfalar: [
      { t: "Ayrık uzatma", h: `<p><b>Munfasıl</b> "ayrık" demektir. Med harfi bir kelimenin <b>sonunda</b>, hemze <b>sonraki kelimenin başında</b>dır.</p><p><span class="ar">بِمَآ أُنزِلَ</span> → "bimââ ünzile".</p>` },
      { t: "Ne kadar?", h: `<p><b>1 ile 4 elif</b> arası okunabilir (caiz med). Hızlı okuyuşta (hadr) kısa, yavaş okuyuşta (tahkik) uzun okunur. Okuyuş boyunca aynı ölçüyü koru.</p><p class="not">Kelimeyi tek başına okursan med olmaz, çünkü hemze sonraki kelimede kalır. Munfasıl ancak iki kelimeyi birleştirince ortaya çıkar.</p><p><span class="ar">يَـٰٓأَيُّهَا</span> ("yââ eyyuhâ") da hükmen munfasıldır: nidâ ي'sının elifi ile أَيُّهَا birleşir.</p>` }
    ],
    ornek: [
      { k: 'munfasil', r: '2:4', w: [3, 4], oku: "bimââ ünzile", n: "Elif bir kelimede, hemze sonrakinde." },
      { k: 'munfasil', r: '2:4', w: [6, 7], oku: "ve mââ ünzile", n: "Med harfi + sonraki kelimede hemze." },
      { k: 'munfasil', r: '108:1', w: [1, 2], oku: "innââ a'taynâke", n: "إِنَّآ'nın elifinden sonra أَعۡطَيۡنَٰكَ'nın hemzesi." },
      { k: 'munfasil', r: '97:1', w: [1, 2], oku: "innââ enzelnâhu", n: "Elif + sonraki kelimede hemze." },
      { k: 'munfasil', r: '109:3', w: [4, 5], oku: "mââ a'bud", n: "مَآ + أَعۡبُدُ." },
      { k: 'munfasil', r: '109:1', w: [2], oku: "yââ eyyuhâ", n: "Nidâ ي'sı: hükmen munfasıl." },
      { k: 'munfasil', r: '3:7', w: [44, 45], oku: "illââ ulû", n: "إِلَّآ'nın elifi + أُوْلُواْ'nun hemzesi." }
    ],
    sorular: [
      { q: "Med-i munfasılda hemze nerededir?", a: "Bir sonraki kelimenin başında", w: ["Aynı kelimede", "Kelimenin ortasında", "Hiç yoktur"] },
      { q: "Med-i munfasıl kaç elif okunabilir?", a: "1–4 elif", w: ["Sadece 6 elif", "Hiç uzatılmaz", "Sadece yarım elif"] },
      { q: "Hangisinde med-i munfasıl vardır?", a: "بِمَآ أُنزِلَ", w: ["جَآءَ", "ٱلسَّمَآءِ", "قَالَ"] },
      { q: "'بِمَآ' kelimesini TEK BAŞINA okursan med-i munfasıl olur mu?", a: "Hayır, hemze sonraki kelimede", w: ["Evet, her zaman", "Evet, 6 elif", "Sadece durunca"] },
      { q: "Muttasıl ile munfasılın farkı nedir?", a: "Hemzenin aynı kelimede mi, sonraki kelimede mi olduğu", w: ["Harflerin rengi", "Şedde olup olmaması", "Sadece ses tonu"] }
    ]
  });

  unit({
    id: 'u4', ad: "Med-i lâzım", ikon: '⏳', kurallar: ['lazim'],
    sayfalar: [
      { t: "Mecburi uzun uzatma", h: `<p>Med harfinden sonra <b>kalıcı bir sükûn</b> ya da <b>şedde</b> gelirse med-i lâzım olur. Bu en uzun meddir ve <b>her okuyuşta</b> uzatılır.</p><p><span class="ar">ٱلضَّآلِّينَ</span> → "ed-dââllîn". Elifden sonra şeddeli lâm var.</p>` },
      { t: "Dört çeşidi", h: `<ul><li><b>Kelime-i müsakkal</b>: med + şeddeli harf, kelimede. <span class="ar">ٱلۡحَآقَّةُ</span></li><li><b>Kelime-i muhaffef</b>: med + şeddesiz sükûn, kelimede. <span class="ar">ءَآلۡـَٰٔنَ</span> (Kur'an'da çok az)</li><li><b>Harf-i müsakkal</b>: sure başı harflerinde, sonraki harfe katılarak. <span class="ar">الٓمٓ</span> → "elif lââm mîîm"; lâmın mîmi sonraki mîme katılır.</li><li><b>Harf-i muhaffef</b>: sure başı harfi kendi başına. <span class="ar">قٓ</span> → "kââf", <span class="ar">نٓ</span> → "nûûn"</li></ul>` },
      { t: "Ne kadar?", h: `<p>Kaynaklar <b>2–4 elif</b> verir. Uygulamada en uzun med olarak <b>3–4 elif</b> okunur ve okuyuş boyunca sabit tutulur. Sure başlarında harf adlarının (<b>elif, lâm, mîm, kâf, nûn</b>…) okunuşunu dinleyerek öğren.</p>` }
    ],
    ornek: [
      { k: 'lazim', r: '1:7', w: [9], oku: "ved-dââllîn", n: "Elif + şeddeli lâm: kelime-i müsakkal." },
      { k: 'lazim', r: '69:1', w: [1], oku: "el-hââkkah", n: "Elif + şeddeli kâf." },
      { k: 'lazim', r: '80:33', w: [3], oku: "es-sââhhah", n: "Elif + şeddeli hı." },
      { k: 'lazim', r: '79:34', w: [3], oku: "et-tââmmetu", n: "Elif + şeddeli mîm." },
      { k: 'lazim', r: '10:51', w: [7], oku: "âââl'âne", n: "Elif + sakin lâm: kelime-i muhaffef." },
      { k: 'lazim', r: '2:1', w: [1], oku: "elif lââm mîîm", n: "Sure başı harfleri: harfî med-i lâzım." },
      { k: 'lazim', r: '50:1', w: [1], oku: "kââf", n: "Harf-i muhaffef." },
      { k: 'lazim', r: '68:1', w: [1], oku: "nûûn", n: "Harf-i muhaffef." }
    ],
    sorular: [
      { q: "Med-i lâzımda med harfinden sonra ne gelir?", a: "Kalıcı sükûn veya şedde", w: ["Hemze", "Harekeli harf", "Durak işareti"] },
      { q: "Hangisinde med-i lâzım vardır?", a: "ٱلضَّآلِّينَ", w: ["بِمَآ أُنزِلَ", "قَالَ", "فِيهِ"] },
      { q: "'الٓمٓ' nasıl okunur?", a: "Elif lââm mîîm", w: ["Elem", "Alim", "Elif lam mim (uzatmasız)"] },
      { q: "Sure başlarındaki harflerde (قٓ, نٓ) hangi med vardır?", a: "Med-i lâzım (harfî)", w: ["Med-i munfasıl", "Med-i tabîî", "Hiç med yoktur"] },
      { q: "Medler içinde en uzun ve mecburi olan hangisidir?", a: "Med-i lâzım", w: ["Med-i tabîî", "Med-i munfasıl", "Sıla"] },
      { q: "'ٱلۡحَآقَّةُ' hangi çeşit med-i lâzımdır?", a: "Kelime-i müsakkal", w: ["Harf-i muhaffef", "Kelime-i muhaffef", "Harf-i müsakkal"] }
    ]
  });

  unit({
    id: 'u5', ad: "Med-i ârız ve med-i lîn", ikon: '🛑', kurallar: ['ariz', 'lin'],
    sayfalar: [
      { t: "Durunca gelen uzatma", h: `<p>Ayet sonunda <b>durduğunda</b> son harf sakin olur. Ondan önce med harfi varsa <b>med-i ârız</b> olur. "Ârız" sonradan ortaya çıkan demektir.</p><p><span class="ar">ٱلۡعَٰلَمِينَ</span> → durunca "el-âlemîîn". Geçersen ("el-âlemîne") sadece tabîî kalır.</p><p>Süre: <b>1–4 elif</b>. Okuyuş boyunca aynı kalsın.</p>` },
      { t: "Med-i lîn", h: `<p><b>Lîn</b> yumuşak demektir. Önü <b>üstünlü</b> olan sakin <span class="ar">و</span> veya <span class="ar">ي</span>'den sonraki harfte <b>durunca</b> olur.</p><p><span class="ar">قُرَيۡشٍ</span> → durunca "kurayş". Ye hafifçe uzatılır.</p><p class="not">Dikkat: <span class="ar">يَوۡمِ</span> gibi kelimeler ortada okunurken lîn medi yapılmaz. Sadece o kelimede durulursa olur.</p>` }
    ],
    ornek: [
      { k: 'ariz', r: '1:2', w: [4], oku: "el-âlemîîn", n: "Durunca nûn sakin olur, ondan önce ي var." },
      { k: 'ariz', r: '1:4', w: [3], oku: "ed-dîîn", n: "Durunca: ye + sakin nûn." },
      { k: 'ariz', r: '1:5', w: [4], oku: "neste'îîn", n: "Ayet sonu, durulur." },
      { k: 'ariz', r: '114:1', w: [4], oku: "en-nââs", n: "Elif + durunca sakin sîn." },
      { k: 'ariz', r: '107:5', w: [5], oku: "sâhûûn", n: "Vav + durunca sakin nûn." },
      { k: 'ariz', r: '2:5', w: [8], oku: "el-muflihûûn", n: "Ayet sonu, durulur." },
      { k: 'lin', r: '106:1', w: [2], oku: "kurayş", n: "Üstünlü ra + sakin ye; şînde durulur." },
      { k: 'lin', r: '106:3', w: [4], oku: "el-beyt", n: "Üstünlü be + sakin ye; tede durulur." },
      { k: 'lin', r: '106:4', w: [7], oku: "havf", n: "Üstünlü hı + sakin vav; fede durulur." }
    ],
    sorular: [
      { q: "Med-i ârız ne zaman ortaya çıkar?", a: "Kelimenin sonunda durulunca", w: ["Her zaman", "Hemze gelince", "Şedde gelince"] },
      { q: "Med-i lînde vav/ye'den önceki harfin harekesi nedir?", a: "Üstün", w: ["Esre", "Ötre", "Sükûn"] },
      { q: "'ٱلۡعَٰلَمِينَ' kelimesinde durmadan geçersen son uzatma hangi med olur?", a: "Med-i tabîî", w: ["Med-i ârız", "Med-i lâzım", "Med-i muttasıl"] },
      { q: "Med-i ârız kaç elif okunabilir?", a: "1–4 elif", w: ["Sadece 6", "Hiç", "Sadece yarım"] },
      { q: "Hangisi med-i lîn örneğidir (durunca)?", a: "قُرَيۡشٍ", w: ["قَالَ", "جَآءَ", "ٱلضَّآلِّينَ"] }
    ]
  });

  unit({
    id: 'u6', ad: "Zamir ve sıla (hâ-i kinâye)", ikon: '🔤', kurallar: ['sila'],
    sayfalar: [
      { t: "Küçük vav ve küçük ye", h: `<p>"Onun" anlamındaki zamir <span class="ar">ه</span>, <b>iki harekeli harf arasında</b> kalırsa uzatılır. Medine mushafında bu küçük bir <span class="ar">ـۥ</span> (vav) ya da <span class="ar">ـۦ</span> (ye) ile gösterilir.</p><p><span class="ar">لَّهُۥ كُفُوًا</span> → "lehû kufuven".</p>` },
      { t: "Sıla-i suğrâ ve kübrâ", h: `<ul><li>Sonra <b>harekeli</b> bir harf gelirse: <b>1 elif</b> (sıla-i suğrâ).</li><li>Sonra <b>hemze</b> gelirse: <b>munfasıl gibi</b> uzatılır (sıla-i kübrâ). <span class="ar">مَالَهُۥٓ أَخۡلَدَهُۥ</span></li><li>Zamirden önceki harf <b>sakinse</b> uzatılmaz: <span class="ar">فِيهِ</span> "fîhi", <span class="ar">مِنۡهُ</span> "minhu".</li><li>Zamirden sonra sakin harf gelirse uzatılmaz.</li><li>Zamirde <b>durulursa</b> uzatılmaz, "h" sakin okunur.</li></ul><p class="not">Hafs'taki istisna: <span class="ar">فِيهِۦ مُهَانًا</span> (Furkân 69). Önü sakin olduğu hâlde uzatılır.</p>` }
    ],
    ornek: [
      { k: 'sila', r: '112:4', w: [3], oku: "lehû", n: "Önü üstünlü lâm, sonrası harekeli kâf: 1 elif." },
      { k: 'sila', r: '111:2', w: [4], oku: "mâluhû", n: "İki harekeli harf arasında zamir." },
      { k: 'sila', r: '100:4', w: [2], oku: "bihî", n: "Küçük ye ile gösterilmiş: 1 elif." },
      { k: 'sila', r: '104:3', w: [3, 4], oku: "mâlehûû ahledeh", n: "Sonrasında hemze: munfasıl gibi (sıla-i kübrâ)." },
      { k: 'sila', r: '25:69', w: [7, 8], oku: "fîhî muhânâ", n: "İstisna: önü sakin olduğu hâlde uzatılır." }
    ],
    sorular: [
      { q: "Zamir ه ne zaman uzatılır?", a: "İki harekeli harf arasında kalınca", w: ["Her zaman", "Önü sakin olunca", "Hiçbir zaman"] },
      { q: "'فِيهِ' kelimesindeki zamir neden uzatılmaz?", a: "Önündeki harf (ي) sakin", w: ["Sonu hemze", "Şeddeli", "Durak işareti var"] },
      { q: "Zamirden sonra hemze gelirse ne olur?", a: "Munfasıl gibi uzatılır", w: ["Hiç uzatılmaz", "Genizden okunur", "Kalkale yapılır"] },
      { q: "Medine mushafında sılayı gösteren işaret hangisidir?", a: "Küçük vav (ـۥ) veya küçük ye (ـۦ)", w: ["Şedde", "Küçük mîm", "Sükûn"] },
      { q: "Hafs'ta önü sakin olduğu hâlde uzatılan istisna hangisidir?", a: "فِيهِۦ مُهَانًا", w: ["لَّهُۥ كُفُوًا", "مِنۡهُ", "عَنۡهُ"] },
      { q: "Zamirin üzerinde durulursa ne olur?", a: "Uzatılmaz, 'h' sakin okunur", w: ["2 elif uzatılır", "Genizden okunur", "Okunmaz"] }
    ]
  });

  unit({ id: 'x1', ara: true, ad: "Ara sınav 1: Bütün medler", ikon: '🏁', kapsar: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'] });

  unit({
    id: 'u7', ad: "Nûn sâkin ve tenvin: İzhâr", ikon: '🗣️', kurallar: ['izhar'],
    sayfalar: [
      { t: "Nûn'un 4 hâli", h: `<p>Sakin nûn (<span class="ar">نۡ</span>) ya da tenvinden sonra gelen harfe bak. 4 ihtimal var:</p><ol><li><b>İzhâr</b>: boğaz harfi → açık oku</li><li><b>İdğâm</b>: <span class="ar">ي ن م و ل ر</span> → katarak oku</li><li><b>İklâb</b>: <span class="ar">ب</span> → "m"ye çevir</li><li><b>İhfâ</b>: kalan 15 harf → gizle</li></ol><p>Önce izhârla başlıyoruz.</p>` },
      { t: "İzhâr: açık açık söyle", h: `<p>Sonraki harf <b>boğaz harflerinden</b> biriyse nûn net okunur, geniz sesi yapılmaz:</p><p class="ar buyuk">ء ه ع ح غ خ</p><p>Akılda tutmak için: <b>"Hemze, He, Ayn, Hâ, Ğayn, Hı"</b>. Hepsi boğazdan çıkar, nûn ise dilin ucundan. Mahreçleri uzak olduğu için karışmazlar.</p><p>Örnek: <span class="ar">مِنۡ عَلَقٍ</span> → "min alak".</p><p class="not">Medine mushafında izhâr yapılan nûnun üstünde sükûn yazılır, tenvin de üst üste (<span class="ar">ـٌ ـً ـٍ</span>) yazılır.</p>` }
    ],
    ornek: [
      { k: 'izhar', r: '96:2', w: [3, 4], oku: "min alak", n: "Nûn sâkin + ع." },
      { k: 'izhar', r: '98:1', w: [5, 6], oku: "min ehli", n: "Nûn sâkin + hemze." },
      { k: 'izhar', r: '2:60', w: [10], oku: "minhu", n: "Kelime içinde nûn sâkin + ه." },
      { k: 'izhar', r: '106:4', w: [6, 7], oku: "min havf", n: "Nûn sâkin + خ." },
      { k: 'izhar', r: '101:8', w: [2, 3], oku: "men haffet", n: "Nûn sâkin + خ." },
      { k: 'izhar', r: '2:7', w: [11, 12], oku: "azâbun azîm", n: "Tenvin + ع: üst üste yazılmış tenvin." },
      { k: 'izhar', r: '2:256', w: [23, 24], oku: "semîun alîm", n: "Tenvin + ع." },
      { k: 'izhar', r: '9:40', w: [42, 43], oku: "azîzun hakîm", n: "Tenvin + ح." }
    ],
    sorular: [
      { q: "İzhâr harfleri hangileridir?", a: "ء ه ع ح غ خ", w: ["ي ن م و", "ق ط ب ج د", "ل ر"] },
      { q: "İzhârda nûn nasıl okunur?", a: "Açık, genizsiz", w: ["Gizli, genizden", "Hiç okunmaz", "M'ye dönüşür"] },
      { q: "İzhâr harfleri ağzın neresinden çıkar?", a: "Boğazdan", w: ["Dudaklardan", "Burundan", "Dişlerden"] },
      { q: "Hangisinde izhâr vardır?", a: "مِنۡ عَلَقٍ", w: ["مِن رَّبِّهِمۡ", "مِنۢ بَعۡدِ", "يُنفِقُونَ"] },
      { q: "Doğru mu? Medine mushafında izhâr yapılan tenvin üst üste yazılır.", a: "Doğru", w: ["Yanlış"] },
      { q: "Nûn sâkin ve tenvinin kaç hâli vardır?", a: "4 (izhâr, idğâm, iklâb, ihfâ)", w: ["2", "6", "1"] }
    ]
  });

  unit({
    id: 'u8', ad: "İdğâm-ı me'al-ğunne", ikon: '🤝', kurallar: ['idgamMaal'],
    sayfalar: [
      { t: "Katarak, genizden", h: `<p>Nûn sâkin veya tenvinden sonra şu dört harften biri gelirse nûn o harfe <b>katılır</b> ve <b>genizden</b> okunur:</p><p class="ar buyuk">ي ن م و</p><p>Akılda tutmak için: <b>"YeNMU"</b> (yenmu).</p><p><span class="ar">مَن يَقُولُ</span> → "meyyekûlu". Nûn kaybolur, ye şeddeli olur ve genizden çıkar.</p>` },
      { t: "Önemli istisna", h: `<p>İdğâm <b>iki kelime arasında</b> olur. Nûn ve <span class="ar">ي</span>/<span class="ar">و</span> <b>aynı kelimede</b> yan yanaysa idğâm yapılmaz, nûn açık okunur (izhâr-ı mutlak). Kur'an'da 4 kelimede geçer:</p><p class="ar">ٱلدُّنۡيَا · صِنۡوَانٞ · قِنۡوَانٞ · بُنۡيَٰنٞ</p><p>"ed-dünyâ" diye okunur, "eddüyyâ" değil.</p>` }
    ],
    ornek: [
      { k: 'idgamMaal', r: '2:8', w: [3, 4], oku: "meyyekûlu", n: "Nûn + ي: genizden katılır." },
      { k: 'idgamMaal', r: '99:7', w: [1, 2], oku: "fe meyya'mel", n: "Nûn + ي." },
      { k: 'idgamMaal', r: '2:5', w: [3, 4], oku: "hudem mir", n: "Tenvin + م: kaydırılmış tenvin ve şeddeli mîm." },
      { k: 'idgamMaal', r: '111:5', w: [3, 4], oku: "hablum mim", n: "Tenvin + م." },
      { k: 'idgamMaal', r: '88:13', w: [2, 3], oku: "sururum merfûah", n: "Tenvin + م." },
      { k: 'idgamMaal', r: '7:189', w: [4, 5], oku: "min nefsin", n: "Nûn + ن: genizden." },
      { k: 'idgamMaal', r: '2:19', w: [7, 8], oku: "ve ra'duv ve berk", n: "Tenvin + و." },
      { k: 'izhar', r: '2:86', w: [5], oku: "ed-dünyâ", n: "İstisna: aynı kelimede nûn + ي, idğâm yapılmaz." }
    ],
    sorular: [
      { q: "İdğâm-ı me'al-ğunne harfleri hangileridir?", a: "ي ن م و", w: ["ل ر", "ء ه ع ح غ خ", "ب"] },
      { q: "'مَن يَقُولُ' nasıl okunur?", a: "meyyekûlu", w: ["men yekûlu (açık)", "memyekûlu", "mekûlu"] },
      { q: "'ٱلدُّنۡيَا' kelimesinde neden idğâm yapılmaz?", a: "Nûn ve ي aynı kelimede", w: ["Durak işareti var", "Şedde var", "Tenvin var"] },
      { q: "İdğâm-ı me'al-ğunnede ses nereden gelir?", a: "Genizden (burundan)", w: ["Boğazdan", "Dudaktan", "Hiç ses yok"] },
      { q: "Hangisinde idğâm-ı me'al-ğunne vardır?", a: "مِّن نَّفۡسٖ", w: ["مِنۡ عَلَقٍ", "مِن رَّسُولٍ", "مِنۢ بَيۡنِ"] },
      { q: "Doğru mu? 'صِنۡوَانٞ' kelimesinde nûn açık okunur.", a: "Doğru", w: ["Yanlış"] }
    ]
  });

  unit({
    id: 'u9', ad: "İdğâm-ı bilâ-ğunne", ikon: '🌊', kurallar: ['idgamBila'],
    sayfalar: [
      { t: "Katarak, geniz sesi YOK", h: `<p>Nûn sâkin veya tenvinden sonra <span class="ar">ل</span> ya da <span class="ar">ر</span> gelirse nûn tamamen katılır ve <b>geniz sesi yapılmaz</b>.</p><p><span class="ar">مِن رَّبِّهِمۡ</span> → "mir rabbihim".</p><p><span class="ar">وَيۡلٞ لِّكُلِّ</span> → "veylul likulli".</p><p class="not">Medine mushafında nûnun üstünde sükûn yazılmaz, sonraki ل/ر şeddelidir. Bu sana "katarak oku" diye işaret eder.</p>` }
    ],
    ornek: [
      { k: 'idgamBila', r: '2:5', w: [4, 5], oku: "mir rabbihim", n: "Nûn + ر: genizsiz." },
      { k: 'idgamBila', r: '4:64', w: [3, 4], oku: "mir rasûl", n: "Nûn + ر." },
      { k: 'idgamBila', r: '2:60', w: [21, 22], oku: "mir rizkı", n: "Nûn + ر." },
      { k: 'idgamBila', r: '104:1', w: [1, 2], oku: "veylul likulli", n: "Tenvin + ل." },
      { k: 'idgamBila', r: '11:41', w: [10, 11], oku: "le ğafûrur rahîm", n: "Tenvin + ر." },
      { k: 'idgamBila', r: '4:64', w: [22, 23], oku: "tevvâbar rahîmâ", n: "Tenvin + ر." },
      { k: 'idgamBila', r: '74:31', w: [11, 12], oku: "fitnetel lillezîne", n: "Tenvin + ل." },
      { k: 'idgamBila', r: '96:15', w: [2, 3], oku: "leil lem", n: "Nûn + ل." }
    ],
    sorular: [
      { q: "İdğâm-ı bilâ-ğunne harfleri hangileridir?", a: "ل ر", w: ["ي ن م و", "ب", "ق ط ب ج د"] },
      { q: "İdğâm-ı bilâ-ğunnede geniz sesi var mı?", a: "Hayır", w: ["Evet, uzun", "Evet, kısa", "Sadece durunca"] },
      { q: "'مِن رَّبِّهِمۡ' nasıl okunur?", a: "mir rabbihim", w: ["min rabbihim", "mim rabbihim", "mi rabbihim"] },
      { q: "Hangisinde idğâm-ı bilâ-ğunne vardır?", a: "وَيۡلٞ لِّكُلِّ", w: ["مَن يَقُولُ", "مِنۡ عَلَقٍ", "أَنتُمۡ"] }
    ]
  });

  unit({
    id: 'u10', ad: "İklâb", ikon: '🔄', kurallar: ['iklab'],
    sayfalar: [
      { t: "Nûn 'm' oluyor", h: `<p>Nûn sâkin veya tenvinden sonra <span class="ar">ب</span> gelirse nûn bir <b>mîme dönüşür</b>, dudaklar hafifçe kapanır ve <b>genizden</b> okunur.</p><p><span class="ar">مِنۢ بَعۡدِ</span> → "mim ba'di".</p><p>Medine mushafında nûnun ya da tenvinin üstüne <b>küçük bir mîm</b> (<span class="ar">ـۢ</span>) konur. Bunu görünce "m" de!</p><p class="not">İklâb kelime içinde de olur: <span class="ar">لَيُنۢبَذَنَّ</span> → "leyümbezenne".</p>` }
    ],
    ornek: [
      { k: 'iklab', r: '36:9', w: [2, 3], oku: "mim beyni", n: "Nûn + ب: küçük mîm." },
      { k: 'iklab', r: '36:52', w: [3, 4], oku: "mem be'asenâ", n: "Nûn + ب." },
      { k: 'iklab', r: '104:4', w: [2], oku: "leyümbezenne", n: "Kelime içinde nûn + ب." },
      { k: 'iklab', r: '2:10', w: [9, 10], oku: "elîmum bimâ", n: "Tenvin + ب." },
      { k: 'iklab', r: '2:19', w: [18, 19], oku: "muhîtum bil-kâfirîn", n: "Tenvin + ب." },
      { k: 'iklab', r: '13:43', w: [9, 10], oku: "şehîdem beynî", n: "Tenvin + ب." },
      { k: 'iklab', r: '2:256', w: [13, 14], oku: "ve yu'mim billâhi", n: "Nûn + ب." }
    ],
    sorular: [
      { q: "İklâb harfi hangisidir?", a: "ب", w: ["م", "ن", "ل"] },
      { q: "İklâbda nûn neye dönüşür?", a: "Mîm (م)", w: ["Lâm (ل)", "Ye (ي)", "Hiçbir şeye"] },
      { q: "Medine mushafında iklâbı hangi işaret gösterir?", a: "Küçük mîm (ـۢ)", w: ["Şedde", "Sükûn", "Dalgalı med"] },
      { q: "Hangisinde iklâb vardır?", a: "مِنۢ بَيۡنِ", w: ["مِن رَّبِّهِمۡ", "مِنۡ عَلَقٍ", "مَن يَقُولُ"] },
      { q: "Doğru mu? İklâb kelime içinde de olabilir.", a: "Doğru", w: ["Yanlış"] }
    ]
  });

  unit({
    id: 'u11', ad: "İhfâ", ikon: '🙈', kurallar: ['ihfa'],
    sayfalar: [
      { t: "Saklambaç", h: `<p>Nûn sâkin veya tenvinden sonra izhâr, idğâm ve iklâb harfleri <b>dışındaki 15 harften</b> biri gelirse nûn <b>saklanır</b>. Ne tam açık ne tam katılır; ikisinin arası, <b>genizden</b> okunur.</p><p class="ar buyuk">ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك</p><p>Kolay yolu: 6 izhâr + 6 idğâm + 1 iklâb = 13 harf. Kalan 15 harfin hepsi ihfâdır.</p>` },
      { t: "Nasıl okunur?", h: `<p>Dil nûn için damağa tam yapışmaz. Ses burundan çıkar ve sonraki harfe hazırlanılır.</p><p><span class="ar">أَنتُمۡ</span> → "en(n)tum": nûn genizde hafifçe tutulur.</p><p><span class="ar">يُنفِقُونَ</span> → "yun(n)fikûn".</p><p class="not">Medine mushafında ihfâda nûnun üstünde sükûn yazılmaz, tenvin kaydırılmış (<span class="ar">ـٞ ـٗ ـٖ</span>) yazılır ve sonraki harf şeddesizdir.</p>` }
    ],
    ornek: [
      { k: 'ihfa', r: '109:3', w: [2], oku: "en(n)tum", n: "Nûn + ت (kelime içi)." },
      { k: 'ihfa', r: '2:3', w: [8], oku: "yun(n)fikûn", n: "Nûn + ف." },
      { k: 'ihfa', r: '97:1', w: [2], oku: "en(n)zelnâhu", n: "Nûn + ز." },
      { k: 'ihfa', r: '98:8', w: [2], oku: "in(n)de", n: "Nûn + د." },
      { k: 'ihfa', r: '50:22', w: [8], oku: "an(n)ke", n: "Nûn + ك." },
      { k: 'ihfa', r: '101:6', w: [2, 3], oku: "men(n) sekulet", n: "Nûn + ث." },
      { k: 'ihfa', r: '98:8', w: [5, 6], oku: "adnin(n) tecrî", n: "Tenvin + ت." },
      { k: 'ihfa', r: '96:16', w: [1, 2], oku: "nâsıyetin(n) kâzibeh", n: "Tenvin + ك." },
      { k: 'ihfa', r: '2:20', w: [24, 25], oku: "şey'in(n) kadîr", n: "Tenvin + ق." }
    ],
    sorular: [
      { q: "İhfâ harfi kaç tanedir?", a: "15", w: ["6", "4", "28"] },
      { q: "İhfâda nûn nasıl okunur?", a: "Gizlenir, genizden hafifçe", w: ["Tamamen açık", "Tamamen katılır, genizsiz", "M'ye döner"] },
      { q: "Hangisi ihfâ harflerinden biridir?", a: "ت", w: ["ع", "ي", "ب"] },
      { q: "Hangisinde ihfâ vardır?", a: "أَنتُمۡ", w: ["مِنۡهُ", "مِن رَّبِّهِمۡ", "مِنۢ بَعۡدِ"] },
      { q: "İhfâ harflerini bulmanın kolay yolu nedir?", a: "İzhâr, idğâm ve iklâb dışında kalan harfler", w: ["Sadece noktalı harfler", "Boğaz harfleri", "Dudak harfleri"] }
    ]
  });

  unit({
    id: 'u12', ad: "Mîm sâkin", ikon: '👄', kurallar: ['ihfaSefevi', 'idgamMim', 'izharSefevi'],
    sayfalar: [
      { t: "Mîmin 3 hâli", h: `<p>Sakin mîmden (<span class="ar">مۡ</span>) sonra gelen harfe bak:</p><ol><li><span class="ar">ب</span> → <b>İhfâ-i şefevî</b>: dudaklar hafifçe kapalı, genizden. <span class="ar">تَرۡمِيهِم بِحِجَارَةٖ</span></li><li><span class="ar">م</span> → <b>İdğâm-ı misleyn</b>: iki mîm birleşir, genizden. <span class="ar">أَطۡعَمَهُم مِّن</span></li><li><b>Diğer harfler</b> → <b>İzhâr-ı şefevî</b>: mîm açık okunur. <span class="ar">لَكُمۡ دِينُكُمۡ</span></li></ol><p>"Şefevî" dudakla ilgili demektir.</p>` },
      { t: "Dikkat: و ve ف", h: `<p>Mîm sâkinden sonra <span class="ar">و</span> veya <span class="ar">ف</span> gelince dikkat et. Bunların mahreci mîme yakındır, mîm ihfâ edilmeye meyleder. Mîmi <b>açık ve net</b> söyle (izhâr-ı şefevî).</p><p><span class="ar">هُمۡ فِيهَا</span> → "hum fîhâ", net bir "m" ile.</p>` }
    ],
    ornek: [
      { k: 'ihfaSefevi', r: '105:4', w: [1, 2], oku: "termîhim(m) bihicâratin", n: "Mîm + ب." },
      { k: 'ihfaSefevi', r: '100:11', w: [2, 3], oku: "rabbehum(m) bihim", n: "Mîm + ب." },
      { k: 'ihfaSefevi', r: '2:8', w: [10, 11], oku: "hum(m) bimu'minîn", n: "Mîm + ب." },
      { k: 'idgamMim', r: '106:4', w: [2, 3], oku: "et'amehum min", n: "Mîm + م: şeddeli mîm." },
      { k: 'idgamMim', r: '2:10', w: [2, 3], oku: "kulûbihim meradun", n: "Mîm + م." },
      { k: 'idgamMim', r: '104:8', w: [2, 3], oku: "aleyhim mu'sadeh", n: "Mîm + م." },
      { k: 'izharSefevi', r: '109:6', w: [1, 2], oku: "lekum dînukum", n: "Mîm + د: açık." },
      { k: 'izharSefevi', r: '112:3', w: [1, 2], oku: "lem yelid", n: "Mîm + ي: açık." },
      { k: 'izharSefevi', r: '105:1', w: [1, 2], oku: "elem tera", n: "Mîm + ت: açık." },
      { k: 'izharSefevi', r: '1:7', w: [3], oku: "en'amte", n: "Kelime içinde mîm + ت." }
    ],
    sorular: [
      { q: "Mîm sâkinden sonra ب gelirse ne olur?", a: "İhfâ-i şefevî", w: ["İzhâr-ı şefevî", "İklâb", "Kalkale"] },
      { q: "Mîm sâkinden sonra م gelirse ne olur?", a: "İdğâm-ı misleyn", w: ["İhfâ-i şefevî", "İzhâr", "Sekte"] },
      { q: "'Şefevî' ne demektir?", a: "Dudakla ilgili", w: ["Boğazla ilgili", "Uzun", "Gizli"] },
      { q: "Mîm sâkinden sonra hangi harflere özellikle dikkat edilmelidir (mîm net okunmalı)?", a: "و ve ف", w: ["ب ve م", "ء ve ه", "ل ve ر"] },
      { q: "Hangisinde izhâr-ı şefevî vardır?", a: "لَكُمۡ دِينُكُمۡ", w: ["تَرۡمِيهِم بِحِجَارَةٖ", "أَطۡعَمَهُم مِّن", "مِنۢ بَيۡنِ"] }
    ]
  });

  unit({
    id: 'u13', ad: "Ğunne (geniz sesi)", ikon: '👃', kurallar: ['gunne'],
    sayfalar: [
      { t: "Burundan 'mmm' / 'nnn'", h: `<p>Şeddeli <span class="ar">نّ</span> ve şeddeli <span class="ar">مّ</span> her zaman <b>ğunneli</b> okunur. Ses burundan çıkar ve biraz (<b>yaklaşık 1 elif</b>) tutulur.</p><p><span class="ar">إِنَّ</span> → "in-ne", nûn genizde tutulur.</p><p><span class="ar">ثُمَّ</span> → "sum-me".</p><p class="not">Deneme: burnunu hafifçe tutup "inne" de. Ses kesiliyorsa ğunneyi doğru yapıyorsun!</p>` }
    ],
    ornek: [
      { k: 'gunne', r: '108:3', w: [1], oku: "in-ne", n: "Şeddeli nûn." },
      { k: 'gunne', r: '114:1', w: [4], oku: "en-nâs", n: "Şeddeli nûn (lâm-ı tarif de şemsî)." },
      { k: 'gunne', r: '102:4', w: [1], oku: "sum-me", n: "Şeddeli mîm." },
      { k: 'gunne', r: '101:9', w: [1], oku: "fe um-muhû", n: "Şeddeli mîm." },
      { k: 'gunne', r: '6:36', w: [1], oku: "in-nemâ", n: "Şeddeli nûn." },
      { k: 'gunne', r: '114:6', w: [2], oku: "el-cin-neti", n: "Şeddeli nûn." },
      { k: 'gunne', r: '101:6', w: [1], oku: "fe em-mâ", n: "Şeddeli mîm." }
    ],
    sorular: [
      { q: "Hangi harfler şeddeli olunca ğunneyle okunur?", a: "ن ve م", w: ["ل ve ر", "ب ve ق", "و ve ي"] },
      { q: "Ğunne yaklaşık ne kadar tutulur?", a: "Yaklaşık 1 elif", w: ["6 elif", "Hiç tutulmaz", "Nefes bitene kadar"] },
      { q: "Ğunnenin sesi nereden çıkar?", a: "Burundan (genizden)", w: ["Boğazdan", "Göğüsten", "Dişlerden"] },
      { q: "Hangisinde ğunne vardır?", a: "إِنَّ", w: ["قُلۡ", "قَالَ", "عَلَقٍ"] }
    ]
  });

  unit({ id: 'x2', ara: true, ad: "Ara sınav 2: Nûn, mîm ve ğunne", ikon: '🏁', kapsar: ['u7', 'u8', 'u9', 'u10', 'u11', 'u12', 'u13'] });

  unit({
    id: 'u14', ad: "İdğâmlar: misleyn, mütecâniseyn, mütekâribeyn", ikon: '🧲', kurallar: ['misleyn', 'mutecaniseyn', 'mutekaribeyn'],
    sayfalar: [
      { t: "Harfler birbirine katılınca", h: `<p>İlk harf <b>sakin</b>, ikincisi <b>harekeli</b> olunca ilk harf ikinciye katılır ve tek şeddeli harf gibi okunur. Üç çeşidi vardır:</p><ul><li><b>Misleyn</b> (aynı harfler): <span class="ar">ٱضۡرِب بِّعَصَاكَ</span> → "idrib-bi'asâke"</li><li><b>Mütecâniseyn</b> (mahreci aynı, sıfatı farklı): <span class="ar">قَد تَّبَيَّنَ</span> → "kat-tebeyyene"</li><li><b>Mütekâribeyn</b> (birbirine yakın): <span class="ar">قُل رَّبِّيٓ</span> → "kur-rabbî"</li></ul>` },
      { t: "Mütecâniseyn grupları", h: `<ul><li><span class="ar">ت د ط</span>: <span class="ar">قَد تَّبَيَّنَ</span>, <span class="ar">أَثۡقَلَت دَّعَوَا</span>, <span class="ar">وَقَالَت طَّآئِفَةٞ</span></li><li><span class="ar">ث ذ ظ</span>: <span class="ar">يَلۡهَث ذَّـٰلِكَ</span>, <span class="ar">إِذ ظَّلَمُوٓاْ</span></li><li><span class="ar">ب م</span>: sadece ب önce gelirse: <span class="ar">ٱرۡكَب مَّعَنَا</span></li></ul><p class="not">ط'dan sonra ت gelince ط'nın kalınlığı (itbâk) korunur: <span class="ar">بَسَطتَ</span>. Tam idğâm yapılmaz.</p>` },
      { t: "Mütekâribeyn", h: `<ul><li><span class="ar">ق → ك</span>: <span class="ar">أَلَمۡ نَخۡلُقكُّم</span> → "nahlukkum"</li><li><span class="ar">ل → ر</span>: <span class="ar">بَل رَّفَعَهُ</span> → "berrafe'ahu", <span class="ar">قُل رَّبِّيٓ</span></li></ul><p class="not">Medine mushafında katılan harfin üstünde sükûn yoktur, katıldığı harf şeddelidir. Bu her idğâmın görsel ipucudur.</p>` }
    ],
    ornek: [
      { k: 'misleyn', r: '2:60', w: [6, 7], oku: "idrib bi'asâke", n: "ب + ب." },
      { k: 'misleyn', r: '2:16', w: [7, 8], oku: "rabihat ticâratuhum", n: "ت + ت." },
      { k: 'mutecaniseyn', r: '2:256', w: [5, 6], oku: "kat tebeyyene", n: "د → ت." },
      { k: 'mutecaniseyn', r: '7:189', w: [20, 21], oku: "eskalet de'avâ", n: "ت → د." },
      { k: 'mutecaniseyn', r: '3:72', w: [1, 2], oku: "ve kâlet tâifetun", n: "ت → ط." },
      { k: 'mutecaniseyn', r: '4:64', w: [11, 12], oku: "iz zalemû", n: "ذ → ظ." },
      { k: 'mutecaniseyn', r: '7:176', w: [20, 21], oku: "yelhez zâlike", n: "ث → ذ." },
      { k: 'mutecaniseyn', r: '11:42', w: [14, 15], oku: "irkem me'anâ", n: "ب → م." },
      { k: 'mutekaribeyn', r: '77:20', w: [2], oku: "nahlukkum", n: "ق → ك." },
      { k: 'mutekaribeyn', r: '4:158', w: [1, 2], oku: "ber rafe'ahu", n: "ل → ر." },
      { k: 'mutekaribeyn', r: '18:22', w: [15, 16], oku: "kur rabbî", n: "ل → ر." }
    ],
    sorular: [
      { q: "İdğâm-ı misleyn nedir?", a: "Aynı iki harfin birleşmesi", w: ["Mahreci aynı, sıfatı farklı harfler", "Birbirine yakın harfler", "Nûnun mîme dönmesi"] },
      { q: "'قَد تَّبَيَّنَ' hangi idğâmdır?", a: "Mütecâniseyn", w: ["Misleyn", "Mütekâribeyn", "Me'al-ğunne"] },
      { q: "'بَل رَّفَعَهُ' hangi idğâmdır?", a: "Mütekâribeyn", w: ["Misleyn", "Mütecâniseyn", "İklâb"] },
      { q: "ب ile م arasında idğâm hangi sırada olur?", a: "ب önce, م sonra", w: ["م önce, ب sonra", "Her iki sırada", "Hiçbir zaman"] },
      { q: "Hangisi mütecâniseyn grubudur?", a: "ت د ط", w: ["ق ك", "ل ر", "ء ه"] },
      { q: "İdğâmda ilk harf nasıl olmalıdır?", a: "Sakin", w: ["Şeddeli", "Tenvinli", "Uzatılmış"] }
    ]
  });

  unit({
    id: 'u15', ad: "Kalkale", ikon: '🏀', kurallar: ['kalkale'],
    sayfalar: [
      { t: "Top gibi sektir", h: `<p>Beş harf sakin olunca sesleri hafifçe <b>sekerek</b> (titreyerek) çıkar:</p><p class="ar buyuk">ق ط ب ج د</p><p>Akılda tutmak için: <b>"Kutbu cedin"</b> (قُطۡبُ جَدٍّ).</p><p><span class="ar">أَحَدۡ</span> → "ehad" deyip sonunda küçük bir yankı.</p>` },
      { t: "Küçük ve büyük kalkale", h: `<ul><li><b>Kelime ortasında</b> sakin olunca: hafif kalkale. <span class="ar">ٱقۡرَأۡ</span>, <span class="ar">يَلِدۡ</span></li><li><b>Durulduğu yerde</b> (vakf) kalkale daha belirgindir. <span class="ar">ٱلۡفَلَقِ</span> → "el-felak"</li><li>Şeddeli kalkale harfinde durulursa (<span class="ar">وَتَبَّ</span>) en kuvvetli kalkale olur.</li></ul><p class="not">Kalkale harfine sesli harf ekleme! "Ehade" ya da "ehadı" değil, sadece hafif bir sekme.</p>` }
    ],
    ornek: [
      { k: 'kalkale', r: '112:1', w: [4], oku: "ehad", n: "Durunca د sakin olur." },
      { k: 'kalkale', r: '113:1', w: [4], oku: "el-felak", n: "Durunca ق sakin olur." },
      { k: 'kalkale', r: '111:1', w: [5], oku: "ve tebb", n: "Şeddeli ب'de durmak: kuvvetli kalkale." },
      { k: 'kalkale', r: '112:3', w: [2], oku: "yelid", n: "Kelime sonunda sakin د." },
      { k: 'kalkale', r: '112:3', w: [4], oku: "yûled", n: "Sakin د." },
      { k: 'kalkale', r: '96:1', w: [1], oku: "ikra'", n: "Kelime içinde sakin ق." },
      { k: 'kalkale', r: '2:3', w: [7], oku: "razaknâhum", n: "Kelime içinde sakin ق." },
      { k: 'kalkale', r: '85:1', w: [3], oku: "el-burûc", n: "Durunca ج sakin olur." },
      { k: 'kalkale', r: '96:2', w: [4], oku: "alak", n: "Durunca ق sakin olur." }
    ],
    sorular: [
      { q: "Kalkale harfleri hangileridir?", a: "ق ط ب ج د", w: ["ء ه ع ح غ خ", "ي ن م و", "ل ر"] },
      { q: "Kalkale ne zaman yapılır?", a: "Harf sakin olunca", w: ["Harf harekeli olunca", "Harf uzatılınca", "Sadece ayet başında"] },
      { q: "Kalkale harflerini hatırlatan söz hangisidir?", a: "Kutbu cedin", w: ["YeNMU", "Lâm-ı tarif", "Elif lâm mîm"] },
      { q: "Hangisinde kalkale vardır?", a: "ٱقۡرَأۡ", w: ["قَالَ", "إِنَّ", "مِنۡهُ"] },
      { q: "Doğru mu? Kalkalede harfin sonuna 'e' sesi eklenir.", a: "Yanlış", w: ["Doğru"] }
    ]
  });

  unit({
    id: 'u16', ad: "Lâm-ı tarif: şemsî ve kamerî", ikon: '☀️', kurallar: ['kameri', 'semsi'],
    sayfalar: [
      { t: "Güneş ve ay", h: `<p><span class="ar">ال</span> ("el") takısından sonraki harfe bak:</p><ul><li><b>Kamerî</b> (ay) harf: lâm <b>okunur</b> ve üstünde sükûn vardır. <span class="ar">ٱلۡقَمَرِ</span> → "el-kamer"</li><li><b>Şemsî</b> (güneş) harf: lâm <b>okunmaz</b>, sonraki harf şeddeli olur. <span class="ar">ٱلشَّمۡسِ</span> → "eş-şems"</li></ul><p>Her grupta 14 harf vardır.</p>` },
      { t: "Harfler", h: `<p><b>Kamerî harfler (14):</b></p><p class="ar">ء ب ج ح خ ع غ ف ق ك م و ه ي</p><p>Hatırlatma cümlesi: <span class="ar">ٱبۡغِ حَجَّكَ وَخَفۡ عَقِيمَهُ</span> (ibği haccake ve haf akîmeh)</p><p><b>Şemsî harfler (14):</b></p><p class="ar">ت ث د ذ ر ز س ش ص ض ط ظ ل ن</p><p class="not">Kolay ipucu: Medine mushafında lâmın üstünde <b>sükûn varsa kamerî</b>, sonraki harfte <b>şedde varsa şemsî</b>dir.</p>` }
    ],
    ornek: [
      { k: 'kameri', r: '91:2', w: [1], oku: "vel-kameri", n: "ق kamerî: lâm okunur." },
      { k: 'kameri', r: '113:1', w: [4], oku: "el-felak", n: "ف kamerî." },
      { k: 'kameri', r: '101:1', w: [1], oku: "el-kâri'ah", n: "ق kamerî." },
      { k: 'kameri', r: '1:6', w: [3], oku: "el-mustakîm", n: "م kamerî." },
      { k: 'kameri', r: '2:2', w: [2], oku: "el-kitâbu", n: "ك kamerî." },
      { k: 'kameri', r: '1:2', w: [4], oku: "el-âlemîn", n: "ع kamerî." },
      { k: 'semsi', r: '91:1', w: [1], oku: "veş-şemsi", n: "ش şemsî: lâm okunmaz." },
      { k: 'semsi', r: '1:1', w: [3], oku: "er-rahmâni", n: "ر şemsî." },
      { k: 'semsi', r: '1:4', w: [3], oku: "ed-dîn", n: "د şemsî." },
      { k: 'semsi', r: '1:6', w: [2], oku: "es-sırâta", n: "ص şemsî." },
      { k: 'semsi', r: '95:1', w: [1], oku: "vet-tîni", n: "ت şemsî." },
      { k: 'semsi', r: '2:3', w: [5], oku: "es-salâte", n: "ص şemsî." }
    ],
    sorular: [
      { q: "Kamerî harften önce lâm-ı tarif nasıl okunur?", a: "Lâm okunur (el-)", w: ["Lâm okunmaz", "Lâm uzatılır", "Lâm genizden okunur"] },
      { q: "Şemsî harften önce ne olur?", a: "Lâm okunmaz, sonraki harf şeddeli olur", w: ["Lâm açık okunur", "Lâm uzatılır", "Kalkale yapılır"] },
      { q: "Hangisi kamerî harftir?", a: "ق", w: ["ش", "ر", "ن"] },
      { q: "Hangisi şemsî harftir?", a: "ن", w: ["م", "ب", "ع"] },
      { q: "Her grupta kaç harf vardır?", a: "14", w: ["7", "15", "28"] },
      { q: "'ٱلنَّاسِ' nasıl okunur?", a: "en-nâs", w: ["el-nâs", "el-en-nâs", "nâs (el'siz)"] },
      { q: "Medine mushafında kamerî lâmın ipucu nedir?", a: "Lâmın üstünde sükûn olması", w: ["Sonraki harfte şedde", "Küçük mîm", "Dalgalı med"] }
    ]
  });

  unit({
    id: 'u17', ad: "Lafzatullah (Allah lafzı)", ikon: '🤲', kurallar: ['allahKalin', 'allahInce'],
    sayfalar: [
      { t: "Kalın mı ince mi?", h: `<p>"Allah" lafzındaki lâm, <b>kendinden önceki harfin harekesine</b> göre okunur:</p><ul><li>Önceki harf <b>üstün</b> veya <b>ötre</b> ise → <b>kalın</b> (tefhîm): <span class="ar">نَصۡرُ ٱللَّهِ</span> "nasrullâh"</li><li>Önceki harf <b>esre</b> ise → <b>ince</b> (terkîk): <span class="ar">بِسۡمِ ٱللَّهِ</span> "bismillâh"</li><li>Okumaya <b>"Allah" ile başlarsan</b> (hemze üstünlü) → <b>kalın</b>: <span class="ar">ٱللَّهُ ٱلصَّمَدُ</span></li></ul>` }
    ],
    ornek: [
      { k: 'allahKalin', r: '112:1', w: [2, 3], oku: "huvallâhu", n: "Öncesi üstün (هُوَ): kalın." },
      { k: 'allahKalin', r: '110:1', w: [3, 4], oku: "nasrullâhi", n: "Öncesi ötre: kalın." },
      { k: 'allahKalin', r: '2:7', w: [1, 2], oku: "hatemallâhu", n: "Öncesi üstün: kalın." },
      { k: 'allahKalin', r: '112:2', w: [1], oku: "Allâhu's-samed", n: "Başta okununca: kalın." },
      { k: 'allahInce', r: '1:1', w: [1, 2], oku: "bismillâhi", n: "Öncesi esre: ince." },
      { k: 'allahInce', r: '1:2', w: [2], oku: "lillâhi", n: "Lâm esreli: ince." },
      { k: 'allahInce', r: '2:8', w: [6], oku: "billâhi", n: "Be esreli: ince." },
      { k: 'allahInce', r: '110:2', w: [5, 6], oku: "dînillâhi", n: "Öncesi esre: ince." }
    ],
    sorular: [
      { q: "'بِسۡمِ ٱللَّهِ' ifadesinde Allah lafzı nasıl okunur?", a: "İnce", w: ["Kalın", "Uzatılmadan", "Genizden"] },
      { q: "Allah lafzından önceki harf ötreli ise lâm nasıl okunur?", a: "Kalın", w: ["İnce", "Okunmaz", "Kalkaleli"] },
      { q: "Okumaya 'Allah' ile başlanırsa lâm nasıl okunur?", a: "Kalın", w: ["İnce", "Okunmaz", "Fark etmez"] },
      { q: "Hangisinde Allah lafzı İNCE okunur?", a: "لِلَّهِ", w: ["نَصۡرُ ٱللَّهِ", "هُوَ ٱللَّهُ", "خَتَمَ ٱللَّهُ"] }
    ]
  });

  unit({
    id: 'u18', ad: "Râ harfi: kalın ve ince", ikon: '🎚️', kurallar: ['raKalin', 'raInce'],
    sayfalar: [
      { t: "Harekeli râ", h: `<ul><li><b>Üstün</b> veya <b>ötre</b> → <b>kalın</b>: <span class="ar">رَبِّ</span> "rabbi", <span class="ar">رُزِقُواْ</span></li><li><b>Esre</b> → <b>ince</b>: <span class="ar">رِجَالٞ</span>, <span class="ar">غَيۡرِ</span> "ğayri"</li></ul>` },
      { t: "Sakin râ (kalın)", h: `<p>Râ sakinse (ya da üzerinde durulduğu için sakin olduysa) <b>önüne</b> bak:</p><ul><li>Önü <b>üstün/ötre</b> → kalın: <span class="ar">وَٱنۡحَرۡ</span> (durunca)</li><li>Önü sakin, ondan önceki <b>üstün/ötre</b> → kalın: <span class="ar">وَٱلۡعَصۡرِ</span> (durunca), <span class="ar">خُسۡرٍ</span></li><li>Önü esre ama sonrasında <b>kalın (istilâ) harfi</b> (<span class="ar">خ ص ض غ ط ق ظ</span>) → kalın: <span class="ar">لَبِٱلۡمِرۡصَادِ</span></li><li>Önü <b>arızî esre</b> (hemze-i vasl gibi) → kalın: <span class="ar">ٱرۡكَبُواْ</span> "irkebû"</li></ul>` },
      { t: "Sakin râ (ince)", h: `<ul><li>Önü <b>aslî esre</b> ve sonrasında istilâ harfi yok → ince: <span class="ar">فِرۡعَوۡنَ</span>, <span class="ar">فَكَبِّرۡ</span> (durunca)</li><li>Önü sakin, ondan önceki esre → ince: <span class="ar">حِجۡرٍ</span> (durunca)</li><li>Önünde sakin ye (lîn/med) varsa → ince: <span class="ar">خَيۡرٌ</span> (durunca)</li></ul><p class="not">Bazı kelimelerde iki türlü okuma da caizdir: <span class="ar">يَسۡرِ</span> (Fecr 4), <span class="ar">ٱلۡقِطۡرِ</span>. Bunları hocandan dinleyerek öğren.</p>` }
    ],
    ornek: [
      { k: 'raKalin', r: '1:2', w: [3], oku: "rabbi", n: "Üstünlü râ: kalın." },
      { k: 'raKalin', r: '101:4', w: [4], oku: "kel-ferâşi", n: "Üstünlü râ: kalın." },
      { k: 'raKalin', r: '108:2', w: [3], oku: "ven-har", n: "Durunca sakin; önü üstün: kalın." },
      { k: 'raKalin', r: '103:1', w: [1], oku: "vel-asr", n: "Durunca; önü sakin, ondan önceki üstün: kalın." },
      { k: 'raKalin', r: '103:2', w: [4], oku: "husr", n: "Durunca; önü sakin, ondan önceki ötre: kalın." },
      { k: 'raKalin', r: '89:14', w: [3], oku: "lebil-mirsâd", n: "Önü esre ama sonrasında ص: kalın." },
      { k: 'raKalin', r: '11:41', w: [2], oku: "irkebû", n: "Önü arızî esre (hemze-i vasl): kalın." },
      { k: 'raKalin', r: '2:20', w: [2], oku: "el-berku", n: "Sakin râ, önü üstün: kalın." },
      { k: 'raInce', r: '1:7', w: [5], oku: "ğayri", n: "Esreli râ: ince." },
      { k: 'raInce', r: '114:5', w: [4], oku: "sudûri", n: "Esreli râ: ince." },
      { k: 'raInce', r: '2:8', w: [8], oku: "el-âhiri", n: "Esreli râ: ince." },
      { k: 'raInce', r: '2:49', w: [5], oku: "fir'avne", n: "Sakin râ, önü aslî esre: ince." },
      { k: 'raInce', r: '74:3', w: [2], oku: "fekebbir", n: "Durunca; önü esre: ince." }
    ],
    sorular: [
      { q: "Üstünlü râ nasıl okunur?", a: "Kalın", w: ["İnce", "Okunmaz", "Genizden"] },
      { q: "Esreli râ nasıl okunur?", a: "İnce", w: ["Kalın", "Uzun", "Kalkaleli"] },
      { q: "'فِرۡعَوۡنَ' kelimesindeki sakin râ nasıl okunur?", a: "İnce (önü aslî esre)", w: ["Kalın", "Okunmaz", "İki türlü"] },
      { q: "'لَبِٱلۡمِرۡصَادِ' kelimesinde râ neden kalındır?", a: "Sonrasında istilâ harfi (ص) var", w: ["Önü üstün", "Râ şeddeli", "Durak var"] },
      { q: "'ٱرۡكَبُواْ' kelimesinde râ nasıl okunur?", a: "Kalın (önündeki esre arızî)", w: ["İnce", "Okunmaz", "İki türlü"] },
      { q: "Sakin râdan önce sakin ye varsa (خَيۡرٌ durunca) râ nasıl okunur?", a: "İnce", w: ["Kalın", "Okunmaz", "Uzatılır"] },
      { q: "Hangisi istilâ (kalın) harflerindendir?", a: "ص", w: ["ح", "ع", "ه"] }
    ]
  });

  unit({
    id: 'u19', ad: "Vakf (durma), durak işaretleri ve sekte", ikon: '🚦', kurallar: ['vakfLazim', 'vakfCaiz', 'vaslEvla', 'vakfEvla', 'muanaka', 'sekte', 'ivaz', 'teMerbuta'],
    sayfalar: [
      { t: "Nasıl durulur?", h: `<p>Bir kelimenin sonunda durunca:</p><ul><li>Son harekeyi <b>sakin</b> yap: <span class="ar">ٱلۡعَٰلَمِينَ</span> → "el-âlemîn"</li><li><b>Üstün tenvin</b> → tenvin düşer, <b>1 elif</b> uzatılır (med-i ıvaz): <span class="ar">ضَبۡحٗا</span> → "dabhâ"</li><li><b>Yuvarlak te</b> (<span class="ar">ة</span>) → <b>"h"</b> olur: <span class="ar">ٱلۡقَارِعَةُ</span> → "el-kâri'ah"</li><li>Esre ve ötre tenvinlerde tenvin düşer, harf sakin okunur: <span class="ar">أَحَدٌ</span> → "ehad"</li></ul>` },
      { t: "Medine mushafının durak işaretleri", h: `<ul><li><span class="ar">مـ</span> <b>Lâzım</b>: Durmak gerekir. Geçilirse mana bozulabilir.</li><li><span class="ar">ج</span> <b>Câiz</b>: Durmak da geçmek de eşit derecede caiz.</li><li><span class="ar">صلى</span> Durulabilir ama <b>geçmek daha iyi</b>.</li><li><span class="ar">قلى</span> Geçilebilir ama <b>durmak daha iyi</b>.</li><li><span class="ar">∴ ∴</span> <b>Muânaka</b>: İkisinden birinde dur, ikisinde birden değil.</li><li><span class="ar">لا</span> Orada durma. Durmak zorunda kalırsan bir önceki kelimeden tekrar başla.</li></ul>` },
      { t: "Türk mushaflarındaki secavendler", h: `<p>Türkiye'de basılan mushaflarda bazı işaretler farklıdır:</p><ul><li><span class="ar">م</span> lâzım: mutlaka durulur</li><li><span class="ar">ط</span> mutlak: durmak iyidir</li><li><span class="ar">ج</span> câiz: durmak da geçmek de caiz (durmak daha faziletli)</li><li><span class="ar">ز</span> mücevvez: geçmek daha faziletli</li><li><span class="ar">ص</span> murahhas: nefes yetmezse durulabilir</li><li><span class="ar">لا</span> durulmaz</li></ul>` },
      { t: "Sekte", h: `<p><b>Sekte</b>: Nefes <b>almadan</b> sesi çok kısa kesip devam etmek. Hafs rivayetinde <b>4 yerde</b> yapılır (küçük <span class="ar">ـۜ</span> işareti):</p><ol><li><span class="ar">عِوَجَاۜ</span> (Kehf 1)</li><li><span class="ar">مَّرۡقَدِنَاۜ</span> (Yâsîn 52)</li><li><span class="ar">مَنۡۜ رَاقٖ</span> (Kıyâme 27)</li><li><span class="ar">بَلۡۜ رَانَ</span> (Mutaffifîn 14)</li></ol><p class="not">Son ikisinde sekte, nûn ve lâmın sonraki râya katılmasını (idğâmı) engeller.</p>` }
    ],
    ornek: [
      { k: 'sekte', r: '18:1', w: [11], oku: "ivecâ (sekte) kayyimen", n: "Kehf 1–2." },
      { k: 'sekte', r: '36:52', w: [6], oku: "merkadinâ (sekte) hâzâ", n: "Yâsîn 52." },
      { k: 'sekte', r: '75:27', w: [2, 3], oku: "men (sekte) râk", n: "İdğâm yapılmaz." },
      { k: 'sekte', r: '83:14', w: [2, 3], oku: "bel (sekte) râne", n: "İdğâm yapılmaz." },
      { k: 'vakfLazim', r: '6:36', w: [4], oku: "yesme'ûn (dur)", n: "Mîm işareti: durmak lâzım." },
      { k: 'vakfCaiz', r: '2:49', w: [12], oku: "nisââekum", n: "Cîm işareti: durmak da geçmek de caiz." },
      { k: 'vaslEvla', r: '2:86', w: [6], oku: "bil-âhirati", n: "صلى: geçmek daha iyi." },
      { k: 'vakfEvla', r: '18:22', w: [22], oku: "kalîl", n: "قلى: durmak daha iyi." },
      { k: 'muanaka', r: '2:2', w: [4, 5], oku: "lâ rayb ∴ fîh ∴", n: "Ya 'rayb'de ya 'fîh'te dur." },
      { k: 'ivaz', r: '100:1', w: [2], oku: "dabhâ", n: "Üstün tenvinde durunca 1 elif." },
      { k: 'teMerbuta', r: '101:1', w: [1], oku: "el-kâri'ah", n: "ة durunca 'h' olur." }
    ],
    sorular: [
      { q: "Hafs rivayetinde kaç yerde sekte vardır?", a: "4", w: ["1", "7", "14"] },
      { q: "Sekte nedir?", a: "Nefes almadan sesi kısaca kesmek", w: ["Nefes alarak durmak", "Uzun uzatmak", "Genizden okumak"] },
      { q: "Üstün tenvinli kelimede durulunca ne olur?", a: "Tenvin düşer, 1 elif uzatılır", w: ["Tenvin aynen okunur", "Kelime okunmaz", "'h' sesi eklenir"] },
      { q: "Yuvarlak te (ة) üzerinde durulunca nasıl okunur?", a: "'h' gibi", w: ["'t' gibi", "Okunmaz", "Uzatılır"] },
      { q: "Medine mushafında مـ işareti ne anlama gelir?", a: "Durmak lâzım", w: ["Durmak yasak", "Geçmek daha iyi", "Sekte yap"] },
      { q: "صلى işareti ne demektir?", a: "Durulabilir ama geçmek daha iyi", w: ["Durmak zorunlu", "Durmak yasak", "Durmak daha iyi"] },
      { q: "قلى işareti ne demektir?", a: "Geçilebilir ama durmak daha iyi", w: ["Durmak yasak", "Geçmek daha iyi", "Sekte yap"] },
      { q: "Muânaka (∴ ∴) işaretinde ne yapılır?", a: "İkisinden birinde durulur", w: ["İkisinde de durulur", "Hiçbirinde durulmaz", "İkisinde de sekte yapılır"] },
      { q: "Türk mushaflarında ز (mücevvez) ne demektir?", a: "Geçmek daha faziletli", w: ["Mutlaka dur", "Durmak daha faziletli", "Kesinlikle durma"] },
      { q: "'لا' işaretinde zorunlu olarak durursan ne yapmalısın?", a: "Önceki kelimeden tekrar başlamalısın", w: ["Kaldığın yerden devam etmelisin", "Ayeti atlamalısın", "Sekte yapmalısın"] }
    ]
  });

  unit({
    id: 'u20', ad: "Hafs'a özel okunuşlar", ikon: '💎', kurallar: ['imale', 'ismam', 'teshil'],
    sayfalar: [
      { t: "İmâle, işmâm, teshîl", h: `<p>Hafs rivayetinde bazı kelimeler özel okunur. Bunlar azdır ama mutlaka bilinmeli:</p><ul><li><b>İmâle</b> — <span class="ar">مَجۡرٜىٰهَا</span> (Hûd 41): "mecrêhâ". Üstün "e" sesine kayar. Hafs'ta tek yerdir.</li><li><b>İşmâm</b> — <span class="ar">تَأۡمَ۬نَّا</span> (Yûsuf 11): nûn idğam yapılırken dudaklar ötre gibi yuvarlanır ama ses çıkarılmaz.</li><li><b>Teshîl</b> — <span class="ar">ءَا۬عۡجَمِيّٞ</span> (Fussilet 44): ikinci hemze hafifletilir, hemze ile elif arası bir sesle okunur.</li></ul><p class="not">Bunlar kulakla öğrenilir. Örnekleri mutlaka dinle.</p>` }
    ],
    ornek: [
      { k: 'imale', r: '11:41', w: [6], oku: "mecrêhâ", n: "Hafs'ta tek imâle yeri." },
      { k: 'ismam', r: '12:11', w: [6], oku: "te'menn(u)nâ", n: "Dudaklar yuvarlanır, ses yok." },
      { k: 'teshil', r: '41:44', w: [9], oku: "e(â)'cemiyyun", n: "İkinci hemze hafifletilir." }
    ],
    sorular: [
      { q: "Hafs rivayetinde imâle hangi kelimede yapılır?", a: "مَجۡرٜىٰهَا", w: ["تَأۡمَ۬نَّا", "ٱلضَّآلِّينَ", "قَالَ"] },
      { q: "İşmâm nedir?", a: "Dudakları ötre için yuvarlamak, ses çıkarmamak", w: ["Sesi kısaca kesmek", "Hemzeyi hafifletmek", "Üstünü 'e'ye kaydırmak"] },
      { q: "Teshîl nedir?", a: "Hemzeyi hafifletmek", w: ["Uzatmak", "Durmak", "Genizden okumak"] },
      { q: "İmâle nedir?", a: "Üstünü 'e' sesine kaydırmak", w: ["Hemzeyi düşürmek", "Nefes almadan durmak", "Mîme çevirmek"] }
    ]
  });

  unit({
    id: 'l1', ad: "Lahn: okuma hataları", ikon: '⚠️', kurallar: [],
    sayfalar: [
      { t: "Lahn nedir?", h: `<p><b>Lahn</b>, Kur'an okurken yapılan hatadır. İkiye ayrılır:</p><ul><li><b>Lahn-ı celî (açık hata):</b> Harfin kendisinde ya da harekesinde yapılan hata. Arapça bilen herkes fark eder. Mana bozulmasa bile bu hatalardan <b>sakınmak farz-ı ayndır</b>.</li><li><b>Lahn-ı hafî (gizli hata):</b> Tecvid kurallarında yapılan hata. Harfin kendisi değişmez, mana bozulmaz; ancak ehli fark eder. Bu hataları yapmak <b>mekruh</b> görülmüştür.</li></ul><p class="not">Yani önce harfleri ve harekeleri doğru okumak gelir; tecvid kuralları onu güzelleştirir.</p>` },
      { t: "Lahn-ı celî örnekleri", h: `<ul><li><b>Bir harfi başka harfle değiştirmek:</b> <span class="ar">ض</span>'yi "z", <span class="ar">ح</span>'yi "h", <span class="ar">ع</span>'yi hemze gibi okumak. <span class="ar">عَلِيم</span> (bilen) ↔ <span class="ar">أَلِيم</span> (acı veren)</li><li><b>Harekeyi değiştirmek:</b> <span class="ar">أَنۡعَمۡتَ</span> "en'amte" (nimet <u>verdin</u>) yerine "en'amtü" okumak anlamı "nimet <u>verdim</u>" yapar.</li><li><b>Şeddeyi okumamak (harf düşürmek):</b> <span class="ar">إِيَّاكَ</span> "iyyâke" yerine "iyâke" okumak harf eksiltmektir.</li><li><b>Kısa harekeyi uzatmak (harf eklemek):</b> <span class="ar">قُلۡ هُوَ</span>'yu "kul hûve" gibi uzatmak.</li><li><b>Sakin harfe hareke vermek:</b> kalkale yaparken <span class="ar">أَحَدۡ</span>'i "ehade" okumak.</li><li><b>Harekeli harfi sakin okumak.</b></li></ul>` },
      { t: "Lahn-ı hafî örnekleri", h: `<ul><li>İhfâ, iklâb, izhâr ve idğâmı <b>yapmamak</b> ya da yanlış yerde yapmak</li><li><b>Vâcip medleri kısaltmak</b> (muttasıl, lâzım), <b>tabîî medleri fazla uzatmak</b></li><li>Ğunneyi <b>ya hiç yapmamak ya da abartmak</b></li><li>Râ'yı <b>titreterek</b> okumak</li><li>Kalın harfleri inceltmek, ince harfleri kalınlaştırmak (harf değişmediği sürece)</li><li>Okuyuş boyunca med ölçüsünü <b>tutarsız</b> uygulamak</li></ul><p class="not">Bu hatalar mana bozmasa da okuyuşun güzelliğini ve doğruluğunu azaltır. Önceki bölümlerdeki kurallar tam da bunları önlemek içindir.</p>` },
      { t: "Durma (vakf) hataları", h: `<p>Yanlış yerde durup başlamak da manayı bozabilir. Meşhur örnek:</p><p class="ar buyuk" style="letter-spacing:0">فَوَيۡلٞ لِّلۡمُصَلِّينَ</p><p>"Vay hâline o namaz kılanların!" deyip durmak, ayetin devamını (<span class="ar">ٱلَّذِينَ هُمۡ عَن صَلَاتِهِمۡ سَاهُونَ</span>: "ki onlar namazlarından gafildirler") kesip anlamı ters çevirir. Bu yüzden ayet sonuna kadar okunmalıdır.</p><p class="not">Nefesin yetmezse uygun bir yerde dur ve gerekirse birkaç kelime geriden başla.</p>` },
      { t: "Hatalardan nasıl korunurum?", h: `<ol><li><b>Bir hocaya oku.</b> Tecvid kulaktan ve ağızdan öğrenilir. Hatalarını en iyi dinleyen biri düzeltir.</li><li><b>Önce dinle, sonra oku.</b> Örneklerdeki kâriyi dinle, sonra aynı ayeti kendin oku.</li><li><b>Yavaş oku (tahkîk).</b> Hız, hataları gizler.</li><li><b>Mahreç ve sıfatları tekrar et.</b> Celî hataların çoğu harfi yanlış yerden çıkarmaktan gelir.</li><li><b>Kendini kaydet.</b> Kendi okuyuşunu dinlemek hatayı görmenin en kolay yoludur.</li></ol>` }
    ],
    sorular: [
      { q: "Lahn nedir?", a: "Kur'an okurken yapılan hata", w: ["Bir tecvid kuralı", "Bir durak işareti", "Bir okuma hızı"] },
      { q: "Lahn-ı celî nedir?", a: "Harfin kendisinde ya da harekesinde yapılan açık hata", w: ["Sadece ğunnede yapılan hata", "Sadece medde yapılan hata", "Hiç önemi olmayan hata"] },
      { q: "Lahn-ı hafî nedir?", a: "Tecvid kurallarında yapılan, harfi değiştirmeyen gizli hata", w: ["Harfi başka harfe çevirmek", "Harekeyi değiştirmek", "Harf eklemek"] },
      { q: "Lahn-ı celîden sakınmanın hükmü nedir?", a: "Farz-ı ayn", w: ["Sünnet", "Müstehap", "Serbest"] },
      { q: "Lahn-ı hafî yapmanın hükmü nedir?", a: "Mekruh", w: ["Farz", "Sünnet", "Mübah"] },
      { q: "إِيَّاكَ kelimesini şeddesiz \"iyâke\" okumak hangi hatadır?", a: "Lahn-ı celî", w: ["Lahn-ı hafî", "Hata değildir", "Vakf hatası"] },
      { q: "أَنۡعَمۡتَ kelimesini \"en'amtü\" okumak neden ağır bir hatadır?", a: "Hareke değişince anlam \"verdin\"den \"verdim\"e döner", w: ["Sadece güzelliği azaltır", "Ğunne eksik kalır", "Med kısalır"] },
      { q: "İhfâyı yapmamak hangi hatadır?", a: "Lahn-ı hafî", w: ["Lahn-ı celî", "Hata değildir", "Vakf hatası"] },
      { q: "Med-i muttasılı 1 elif okumak hangi hatadır?", a: "Lahn-ı hafî", w: ["Lahn-ı celî", "Hata değildir", "Harf değiştirme"] },
      { q: "ض harfini \"z\" gibi okumak hangi hatadır?", a: "Lahn-ı celî", w: ["Lahn-ı hafî", "Hata değildir", "Vakf hatası"] },
      { q: "Kalkale yaparken أَحَدۡ'i \"ehade\" okumak neden hatadır?", a: "Sakin harfe hareke eklenmiş olur (lahn-ı celî)", w: ["Ğunne yapılmamış olur", "Med eksik kalır", "Hata değildir"] },
      { q: "فَوَيۡلٞ لِّلۡمُصَلِّينَ deyip durmak neden yanlıştır?", a: "Ayetin devamı kesilince anlam ters döner", w: ["Med eksik kalır", "Kalkale yapılmaz", "Ğunne kaybolur"] },
      { q: "Hatalardan korunmanın en etkili yolu hangisidir?", a: "Bir hocaya okuyup düzelttirmek", w: ["Hızlı okumak", "Sadece yazıyı okumak", "Hiç dinlememek"] }
    ]
  });

  unit({
    id: 'a1', ad: "Okuma adabı, istiâze ve besmele", ikon: '🕌', kurallar: [],
    sayfalar: [
      { t: "Kur'an okuma adabı", h: `<p>Âlimlerin (Gazzâlî, Nevevî) saydığı edepler:</p><ul><li>Abdestli olmak, temiz bir yerde ve kıbleye dönük okumak</li><li>İstiâze ve besmele ile başlamak</li><li>Tecvidle, acele etmeden ve huşû ile okumak</li><li>Ayetlerin anlamını düşünmek; rahmet ayetinde rahmet istemek, azap ayetinde Allah'a sığınmak, secde ayetinde secde etmek</li><li>Okurken gülmek, konuşmak ve başka işlerle meşgul olmaktan kaçınmak</li><li>Başkalarını rahatsız edecekse sesli okumamak</li><li>Düzenli okumak ve ezberini tekrar etmek</li></ul>` },
      { t: "Sûre başında istiâze ve besmele", h: `<p><span class="ar">أَعُوذُ بِٱللَّهِ مِنَ ٱلشَّيۡطَٰنِ ٱلرَّجِيمِ</span> <b>istiâze</b>, <span class="ar">بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</span> <b>besmele</b>dir. Bir sûreye başından başlarken ikisi şu <b>dört şekilde</b> okunabilir:</p><ol><li><b>Vakfu'l-küll:</b> İstiâzede dur, besmelede dur, sonra sûreye başla.</li><li><b>Vakfu'l-evvel, vaslu's-sânî:</b> İstiâzede dur; besmeleyi sûreye bağla.</li><li><b>Vaslu'l-evvel, vakfu's-sânî:</b> İstiâzeyi besmeleye bağla, besmelede dur, sonra sûreye başla.</li><li><b>Vaslu'l-küll:</b> Üçünü birden bağla.</li></ol><p class="not"><b>Tevbe sûresi</b> başından okunurken yalnızca istiâze okunur, besmele okunmaz.</p>` },
      { t: "İki sûre arasında ve sûre ortasında", h: `<p>Bir sûreyi bitirip diğerine geçerken araya besmele girer. Şunlara dikkat:</p><ul><li>Önceki sûrenin son ayetini besmeleye bağlayıp <b>besmelede durmak caiz değildir</b>. Besmele, bitirdiğin sûrenin sonuymuş gibi duyulur.</li><li>Besmele okunacaksa sonraki sûreye bağlanabilir ya da ayrı okunabilir.</li><li><b>Sûrenin ortasından</b> başlarken istiâze okunur; besmele okunup okunmaması konusunda âlimler farklı görüştedir. Okunursa, besmele başlanan ayete bağlanmaz.</li></ul>` },
      { t: "Okuma hızları", h: `<ul><li><b>Tahkîk:</b> En yavaş okuyuş. Harfler mahreç ve sıfatlarıyla, medler tam, duraklar yerinde. <b>Öğrenme ve talim için</b> kullanılır.</li><li><b>Tedvîr:</b> Orta hızda okuyuş.</li><li><b>Hadr:</b> En hızlı okuyuş. Ancak tecvid kurallarına uyulursa caizdir.</li><li><b>Tertîl:</b> Anlamı düşünerek, acele etmeden okumak. Tahkîke çok yakındır.</li></ul><p class="not">Hadrden daha hızlı okumak caiz görülmemiştir, çünkü harfler mahreçlerini ve sıfatlarını kaybeder.</p>` },
      { t: "Secde ayetleri", h: `<p>Mushafta <span class="ar">۩</span> işaretiyle gösterilir. Secde ayetini okuyan ve dinleyenin <b>tilâvet secdesi</b> yapması gerekir (Hanefî mezhebinde vâciptir). Türkiye'de yaygın olan Hanefî uygulamasında <b>14</b> secde ayeti vardır:</p><p>A'râf 206 · Ra'd 15 · Nahl 50 · İsrâ 109 · Meryem 58 · Hac 18 · Furkân 60 · Neml 26 · Secde 15 · Sâd 24 · Fussilet 38 · Necm 62 · İnşikâk 21 · Alak 19</p><p class="not">Ayet numaraları Medine mushafına göredir; bazı Türkçe kaynaklar Nahl 49, Neml 25 ve Fussilet 37 olarak gösterir. Medine mushafında <b>Hac 77</b> de işaretlidir; bu ayeti de secde ayeti sayan âlimler vardır. Tilâvet secdesinin nasıl yapıldığını ilmihalden ya da hocandan öğren.</p>` }
    ],
    sorular: [
      { q: "Kur'an okumaya nasıl başlanır?", a: "İstiâze ve besmele ile", w: ["Doğrudan ayetle", "Sadece amin ile", "Sadece salavat ile"] },
      { q: "Tevbe sûresi başından okunurken ne yapılır?", a: "Sadece istiâze okunur, besmele okunmaz", w: ["İkisi de okunmaz", "Sadece besmele okunur", "İki kez besmele okunur"] },
      { q: "Sûre başında istiâze ve besmele kaç şekilde okunabilir?", a: "4", w: ["1", "2", "7"] },
      { q: "\"Vaslu'l-küll\" ne demektir?", a: "İstiâze, besmele ve sûre başı birbirine bağlanır", w: ["Her birinde durulur", "Sadece istiâzede durulur", "Besmele okunmaz"] },
      { q: "İki sûre arasında hangisi caiz DEĞİLDİR?", a: "Önceki sûrenin sonunu besmeleye bağlayıp besmelede durmak", w: ["Besmeleyi sonraki sûreye bağlamak", "Hepsini ayrı ayrı okumak", "Hepsini birbirine bağlamak"] },
      { q: "En yavaş okuma hızı hangisidir?", a: "Tahkîk", w: ["Hadr", "Tedvîr", "Hezreme"] },
      { q: "Orta hızdaki okuyuşun adı nedir?", a: "Tedvîr", w: ["Tahkîk", "Hadr", "Tertîl"] },
      { q: "Hadr ne zaman caizdir?", a: "Tecvid kurallarına uyulursa", w: ["Her zaman", "Hiçbir zaman", "Sadece namazda"] },
      { q: "Secde ayetleri mushafta hangi işaretle gösterilir?", a: "۩", w: ["ۜ", "ۖ", "ۢ"] },
      { q: "Türkiye'de yaygın uygulamada kaç secde ayeti vardır?", a: "14", w: ["7", "15", "30"] },
      { q: "Talim ve öğrenme için hangi okuyuş kullanılır?", a: "Tahkîk", w: ["Hadr", "Hezreme", "Tedvîr"] }
    ]
  });

  unit({ id: 'x3', ara: true, ad: "Ara sınav 3: İdğamlar, kalkale, lâm, râ, vakf, lahn, adab", ikon: '🏁', kapsar: ['u14', 'u15', 'u16', 'u17', 'u18', 'u19', 'u20', 'l1', 'a1'] });
  unit({ id: 'x4', ara: true, final: true, ad: "Büyük final: Bütün tecvid", ikon: '🏆', kapsar: ['e1', 'u0', 'm1', 'm2', 'm3', 'u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9', 'u10', 'u11', 'u12', 'u13', 'u14', 'u15', 'u16', 'u17', 'u18', 'u19', 'u20', 'l1', 'a1'] });

  const GRUP_AD = { med: "Medler", nun: "Nûn sâkin ve tenvin", mim: "Mîm sâkin", gunne: "Ğunne", idgam: "İdğâmlar", kalkale: "Kalkale", lam: "Lâm-ı tarif", lafza: "Lafzatullah", ra: "Râ", vakf: "Vakf ve sekte", ozel: "Özel okunuşlar" };

  const KAYNAK = [
    "Kur'an metni: King Fahd Complex (Medine mushafı, Hafs) — quranenc.com üzerinden, quran-json paketi (CC BY-SA 4.0).",
    "Sesler: everyayah.com ayet kayıtları (Husarî, Minşâvî, Abdülbâsıt, Afâsî, Sudeys, Muaykılî, Gâmidî); kelime sesleri — Quran.com (audio.qurancdn.com).",
    "Renkli tecvid: cpfair/quran-tajweed karar ağaçlarıyla üretilen etiketler (CC BY 4.0).",
    "Tecvid kuralları: sorularlaislamiyet.com tecvid özeti; Diyanet Mushafları İnceleme Kurulu tebliğleri; SeekersGuidance vakf işaretleri.",
    "Yazı tipi: Scheherazade New — SIL International (OFL 1.1).",
    "Hesap ve eşitleme: Firebase (Google) — Apache 2.0 lisanslı SDK.",
    "Meal: Diyanet İşleri Başkanlığı (Türkçe) ve Saheeh International (İngilizce) — tanzil.net/trans üzerinden; ticari olmayan kullanım, değiştirilmeden.",
    "Sayfa, cüz ve hizb bilgisi: quran-meta (MIT, quran-center) — Medine mushafı 604 sayfa.",
    "Benzer ayetler: Kur'an metninden otomatik karşılaştırmayla bulundu; eksik ya da fazla olabilir."
  ];

  return { R, U, GRUP_AD, KAYNAK, MAHREC_SVG, harfTablo, sekilTablo };
})();

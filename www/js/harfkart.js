/* Harf kartları: 17 mahreç (İbnü'l-Cezerî), harflerin sıfatları, karıştırılan çiftler ve etkileşimli mahreç şeması.
   Metinler Mahreçler (m1) ve Sıfatlar (m2) dersindeki metinlerden alınmıştır. Şema kendi çizimimizdir (şematik, ölçekli
   anatomi değildir). Hoca onayı bekliyor: claude/toplanti-2026-11-18-harf-kartlari.md */
(function () {
  // [no, ad, Arapça/klasik ad, bölge, açıklama, harfler]
  const MAHRECLER = [
    [1, 'Cevf', 'el-cevf', 'cevf', 'Ağız ve boğaz boşluğu. Med harfleri buradan çıkar; ses hava bitene kadar akar.', 'ا و ي'],
    [2, 'Boğazın en derini', 'aksa\'l-halk', 'halk', 'Boğazın göğse en yakın yeri.', 'ء ه'],
    [3, 'Boğazın ortası', 'vasatu\'l-halk', 'halk', 'Boğazın orta kısmı. ع okunurken boğaz sıkışır; ح okunurken nefes sürtünerek akar.', 'ع ح'],
    [4, 'Boğazın ağza yakın kısmı', 'edne\'l-halk', 'halk', 'Boğazın ağza en yakın yeri.', 'غ خ'],
    [5, 'Dilin kökü ve yumuşak damak', '', 'dil', 'Dilin kökü, karşısındaki yumuşak damağa değer. ق kalın çıkar.', 'ق'],
    [6, 'Dilin kökü, biraz daha önü', '', 'dil', 'ق\'nin biraz önü. ك ince ve nefesli çıkar.', 'ك'],
    [7, 'Dilin ortası ve üst damak', '', 'dil', 'Dilin ortası, karşısındaki üst damağa değer (med harfi olmayan ي).', 'ج ش ي'],
    [8, 'Dilin kenarı ve azı dişleri', '', 'dil', 'Dilin kenarı, sağ ya da sol azı dişlerine dayanır.', 'ض'],
    [9, 'Dil kenarının ön kısmı ve üst diş etleri', '', 'dil', 'Dil kenarının ön kısmı, üst ön diş etlerine değer.', 'ل'],
    [10, 'Dil ucu ve üst ön diş etleri', '', 'dil', 'Dil ucu, üst ön diş etlerine değer.', 'ن'],
    [11, 'Dil ucu, nûnun biraz gerisi', '', 'dil', 'Dil ucu ile sırtı, nûnun mahrecinin biraz gerisi.', 'ر'],
    [12, 'Dil ucu ve üst ön dişlerin kökü', '', 'dil', 'Dil ucu, üst ön dişlerin köküne değer.', 'ط د ت'],
    [13, 'Dil ucu ve ön dişler arası', '', 'dil', 'Dil ucu ön dişlerin arasında; ıslığa benzer ses çıkar.', 'ص ز س'],
    [14, 'Dil ucu ve üst ön dişlerin uçları', '', 'dil', 'Dil ucu üst ön dişlerin uçlarına değer; dil hafif dışarıda görünür (peltek).', 'ظ ذ ث'],
    [15, 'Alt dudağın içi ve üst ön dişler', '', 'dudak', 'Alt dudağın içi, üst ön dişlerin ucuna değer.', 'ف'],
    [16, 'İki dudak', 'şefeteyn', 'dudak', 'ب ve م okunurken dudaklar kapanır, و okunurken yuvarlanır.', 'ب م و'],
    [17, 'Geniz', 'hayşûm', 'geniz', 'Ğunne sesi: nûn ve mîmin genizden gelen sesi.', ''],
  ].map(([no, ad, klasik, bolge, aciklama, harf]) => ({ no, ad, klasik, bolge, aciklama, harfler: harf ? harf.split(' ') : [] }));
  const BOLGE = { cevf: 'Cevf (ağız-boğaz boşluğu)', halk: 'Boğaz (halk)', dil: 'Dil (lisan)', dudak: 'Dudaklar (şefeteyn)', geniz: 'Geniz (hayşûm)' };
  // Mahreç dersinde (m1) hangi sayfada anlatıldığı
  const DERS_SAYFA = n => n <= 4 ? 2 : n <= 7 ? 3 : n <= 14 ? 4 : 5;

  const AD = { 'ا': 'Elif', 'ب': 'Be', 'ت': 'Te', 'ث': 'Se', 'ج': 'Cim', 'ح': 'Ha', 'خ': 'Hı', 'د': 'Dal', 'ذ': 'Zel', 'ر': 'Ra', 'ز': 'Ze', 'س': 'Sin', 'ش': 'Şın', 'ص': 'Sad',
    'ض': 'Dad', 'ط': 'Tı', 'ظ': 'Zı', 'ع': 'Ayn', 'غ': 'Ğayn', 'ف': 'Fe', 'ق': 'Kaf', 'ك': 'Kef', 'ل': 'Lam', 'م': 'Mim', 'ن': 'Nun', 'و': 'Vav', 'ه': 'He', 'ي': 'Ye', 'ء': 'Hemze' };
  // Liste sırası: mahreç sırası; و ve ي iki mahreçte (med harfi olunca cevf)
  const mahrecOf = h => MAHRECLER.filter(m => m.harfler.includes(h));
  const anaMahrec = h => { const l = mahrecOf(h); return (h === 'و' || h === 'ي') ? l.find(m => m.no !== 1) : l[0]; };

  // Sıfatlar (m2 dersindeki listeler)
  const K = s => new Set(s.split(''));
  const HEMS = K('فحثهشخصسكت'), SIDDET = K('ءجدقطبكت'), TAVASSUT = K('لنعمر'), ISTILA = K('خصضغطقظ'), ITBAK = K('صضطظ'), IZLAK = K('فرمنلب');
  const ZITSIZ = [['Safîr (ıslık)', K('زسص')], ['Kalkale (sekme)', K('قطبجد')], ['Lîn (sakin olunca, önü üstünlüyse)', K('وي')], ['İnhirâf (sapma)', K('لر')], ['Tekrîr (titreme eğilimi; titretilmez)', K('ر')], ['Tefeşşî (sesin yayılması)', K('ش')], ['İstitâle (sesin uzaması)', K('ض')]];
  function sifatlar(h) {
    if (h === 'ا') return [{ ad: 'Med harfi', tip: 'ozel' }, { ad: 'Kendinden önceki harfe uyar: kalından sonra kalın, inceden sonra ince', tip: 'ozel' }];
    const l = [];
    l.push({ ad: HEMS.has(h) ? 'Hems (nefes akar)' : 'Cehr (nefes tutulur)', tip: 'zit' });
    l.push({ ad: SIDDET.has(h) ? 'Şiddet (ses hapsolur)' : TAVASSUT.has(h) ? 'Tavassut (ikisi arası)' : 'Rehâvet (ses akar)', tip: 'zit' });
    l.push({ ad: ISTILA.has(h) ? 'İsti\'lâ (kalın)' : 'İstifâl (ince)', tip: ISTILA.has(h) ? 'kalin' : 'zit' });
    l.push({ ad: ITBAK.has(h) ? 'İtbâk (dil damağa kapanır)' : 'İnfitâh (dil-damak arası açık)', tip: 'zit' });
    l.push({ ad: IZLAK.has(h) ? 'İzlâk (kolay çıkar)' : 'İsmât', tip: 'zit' });
    ZITSIZ.forEach(([ad, s]) => { if (s.has(h)) l.push({ ad, tip: 'zitsiz' }); });
    return l;
  }
  const kalinMi = h => ISTILA.has(h);
  const KALINLIK = { 'ر': 'Duruma göre kalın ya da ince (Râ dersi)', 'ل': 'Allah lafzında, önü üstün ya da ötreyse kalın; diğer yerlerde ince', 'ا': 'Önceki harfe uyar' };
  // Karıştırılan çiftler (karar-2026-11-16-mahrec-dersi, madde 5)
  const CIFTLER = [['ق', 'ك'], ['ح', 'ه'], ['ع', 'ء'], ['س', 'ص'], ['ت', 'ط'], ['ذ', 'ز', 'ظ'], ['ث', 'س'], ['ض', 'د']];
  const karisan = h => [...new Set(CIFTLER.filter(c => c.includes(h)).flat().filter(x => x !== h))];
  // İlgili dersler (ders kimliği, sayfa)
  function dersler(h) {
    const m = anaMahrec(h), l = [['m1', DERS_SAYFA(m.no)], ['m2', 0]];
    if (karisan(h).length) l.push(['m3', 0]);
    if ('قطبجد'.includes(h)) l.push(['u15', 0]);
    if (h === 'ر') l.push(['u18', 0]);
    if (h === 'ل') l.push(['u16', 0], ['u17', 0]);
    if (h === 'ن') l.push(['u7', 0], ['u13', 0]);
    if (h === 'م') l.push(['u12', 0], ['u13', 0]);
    if (h === 'ب') l.push(['u10', 0]);
    if ('اوي'.includes(h)) l.push(['u1', 0]);
    if ('وي'.includes(h)) l.push(['u5', 0]);
    if (h === 'ه') l.push(['u6', 0]);
    if (h === 'ء') l.push(['u2', 0], ['u3', 0]);
    return l;
  }
  // Harekeli hâller (Talvia'daki gibi üstün, esre, ötre); elif hareke almaz
  const halleri = h => h === 'ا' ? [] : [h + 'َ', h + 'ِ', h + 'ُ'];

  // ---------------------------------------------------------------- mahreç şeması (yan kesit, yüz sola bakıyor)
  // Noktalar: [mahreç no, x, y]. 9–14 dil ucunda çok yakın olduğu için büyütülmüş kutuda ayrıca gösterilir.
  const NOKTA = [[1, 132, 150], [2, 230, 276], [3, 230, 244], [4, 229, 212], [5, 203, 143], [6, 182, 131], [7, 146, 124], [8, 116, 134], [15, 52, 157], [16, 22, 146], [17, 128, 96]];
  const UC = [[9, 92, 262], [10, 60, 262], [11, 28, 262], [12, 92, 285], [13, 60, 285], [14, 28, 285]];   // büyütme kutusu içi
  function sema(aktif, ops = {}) {
    const a = n => n === aktif ? ' aktif' : '';
    const m = n => MAHRECLER[n - 1], bolgeAktif = b => aktif && m(aktif).bolge === b ? ' aktif' : '';
    const nokta = ([n, x, y]) => `<g class="ms-nokta${a(n)}" data-mno="${n}" role="button" tabindex="0" aria-label="${n}. mahreç: ${m(n).ad}${m(n).harfler.length ? ' — ' + m(n).harfler.join(' ') : ''}"><circle cx="${x}" cy="${y}" r="10"/><text x="${x}" y="${y + 3.5}">${n}</text></g>`;
    const ucAktif = aktif >= 9 && aktif <= 14;
    return `<svg viewBox="0 0 340 300" xmlns="http://www.w3.org/2000/svg" class="msema${ops.kucuk ? ' kucuk' : ''}" role="group" aria-label="Mahreç şeması">
  <path class="ms-yuz" d="M92 6 C70 10 58 30 54 52 L46 70 C40 78 22 88 20 96 C19 102 26 106 38 108 L40 120 C30 124 26 130 27 138 C28 144 32 147 40 150 C32 154 28 158 29 166 C30 176 36 184 40 194 C42 206 46 214 60 220 L120 230 C136 236 144 252 148 300"/>
  <path class="ms-yuz" d="M92 6 C150 -4 230 6 262 36 C292 66 296 120 280 160 C268 192 262 230 262 300"/>
  <path class="ms-geniz${bolgeAktif('geniz')}" data-mno="17" d="M42 104 C60 88 96 80 140 80 C176 80 204 88 214 102 L216 118 C190 110 150 108 110 110 C80 112 60 114 44 116 Z"/>
  <path class="ms-damak" d="M58 134 C78 122 112 116 150 116 C178 116 200 120 212 128 C218 134 220 142 218 152"/>
  <path class="ms-cevf${bolgeAktif('cevf')}" data-mno="1" d="M62 148 C84 132 116 124 150 123 C178 123 198 128 208 140 L204 150 C192 138 172 134 150 134 C118 134 90 142 68 156 Z"/>
  <path class="ms-dil${bolgeAktif('dil')}" d="M60 156 C80 142 118 134 152 134 C178 134 196 142 204 156 C210 172 212 192 214 210 C190 216 160 214 132 206 C104 198 80 184 66 170 C60 166 58 160 60 156 Z"/>
  <path class="ms-halk${bolgeAktif('halk')}" data-mno="3" d="M216 126 C230 120 244 124 246 140 L250 300 L216 300 C214 250 214 190 216 126 Z"/>
  <rect class="ms-dis" x="52" y="132" width="9" height="15" rx="2"/><rect class="ms-dis" x="54" y="160" width="9" height="13" rx="2"/>
  <path class="ms-dudak${bolgeAktif('dudak')}" data-mno="16" d="M40 122 C28 126 25 134 28 140 C32 146 40 148 48 146 L50 132 Z M40 152 C30 156 28 164 31 170 C34 176 42 178 50 176 L52 160 Z"/>
  ${NOKTA.map(nokta).join('')}
  <g class="ms-uc${ucAktif ? ' aktif' : ''}"><path class="ms-bag" d="M62 160 L60 232"/><rect x="8" y="232" width="104" height="66" rx="10"/><text class="ms-uc-baslik" x="60" y="246">Dil ucu · 9–14</text>
  ${UC.map(nokta).join('')}</g>
</svg>`;
  }
  // İngilizce mahreç adları ve açıklamaları
  const EN = { ad: ['Jawf', 'Deepest part of the throat', 'Middle of the throat', 'Part of the throat nearest the mouth', 'Back of the tongue and soft palate', 'Back of the tongue, a little further forward', 'Middle of the tongue and upper palate', 'Side of the tongue and molars', 'Front edge of the tongue and upper gums', 'Tip of the tongue and upper front gums', 'Tip of the tongue, just behind nūn', 'Tip of the tongue and roots of the upper front teeth', 'Tip of the tongue between the front teeth', 'Tip of the tongue and edges of the upper front teeth', 'Inside of the lower lip and upper front teeth', 'Both lips', 'Nasal cavity'],
    aciklama: ['Mouth and throat cavity. The madd letters come from here; the sound flows until the breath ends.', 'The part of the throat nearest the chest.', 'The middle of the throat. For ع the throat tightens; for ح the breath flows with friction.', 'The part of the throat nearest the mouth.', 'The back of the tongue touches the soft palate. ق is heavy.', 'Just in front of ق. ك is light and breathy.', 'The middle of the tongue touches the upper palate (ي when it is not a madd letter).', 'The side of the tongue presses on the right or left molars.', 'The front edge of the tongue touches the upper front gums.', 'The tip of the tongue touches the upper front gums.', 'The tip and top of the tongue, just behind the place of nūn.', 'The tip of the tongue touches the roots of the upper front teeth.', 'The tip of the tongue between the front teeth; a whistle-like sound.', 'The tip of the tongue touches the edges of the upper front teeth; the tongue shows slightly.', 'The inside of the lower lip touches the edges of the upper front teeth.', 'For ب and م the lips close; for و they round.', 'Ghunnah: the nasal sound of nūn and mīm.'] };
  window.HARFKART = { EN, MAHRECLER, BOLGE, DERS_SAYFA, AD, mahrecOf, anaMahrec, sifatlar, kalinMi, KALINLIK, CIFTLER, karisan, dersler, halleri, sema,
    SIRA: MAHRECLER.flatMap(m => m.harfler.map(h => [m.no, h])) };
})();

/* Learn Tajweed — English content. Same structure and order as content.js (Turkish).
 * Only applied when window.DIL === 'en'. Measures follow the Turkish course: "1 alif" = the length of a natural madd. */
(function () {
  const MSVG = ((window.TC && window.TC.MAHREC_SVG) || '').replace('Mahreç şeması', 'Articulation points diagram');
  const L = (b) => `<ol class="mahrec-liste">${b.map(x => `<li><b>${x[0]}</b><span>${x[1]}</span></li>`).join('')}</ol>`;
  const RULES = {
    tabii: ['Natural madd (ṭabīʿī)', 'A madd letter with no cause after it: lengthen 1 alif.', '1 alif'],
    muttasil: ['Madd muttaṣil', 'A hamzah comes after the madd letter in the SAME word.', '2–5 alifs (common: 4)'],
    munfasil: ['Madd munfaṣil', 'The madd letter ends one word and a hamzah starts the NEXT word.', '1–4 alifs'],
    lazim: ['Madd lāzim', 'A permanent (original) sukūn or shaddah follows the madd letter.', '2–4 alifs (common: 3–4)'],
    ariz: ['Madd ʿāriḍ', 'The letter after the madd letter becomes silent because you stop on it.', '1–4 alifs'],
    lin: ['Madd līn', 'A silent و or ي after a fatḥah; lengthened when you stop on the following letter.', '1–4 alifs'],
    sila: ['Ṣilah (lengthening the pronoun)', 'The pronoun ه between two voweled letters is lengthened (shown by a small و / ي).', '1 alif (like munfaṣil if a hamzah follows)'],
    izhar: ['Iẓhār', 'Throat letter (ء ه ع ح غ خ) after nūn sākinah/tanwīn: the nūn is pronounced clearly.'],
    idgamMaal: ['Idghām with ghunnah', 'If ي ن م و follows: the nūn merges into it, read with a nasal sound.'],
    idgamBila: ['Idghām without ghunnah', 'If ل or ر follows: the nūn merges, with NO nasal sound.'],
    iklab: ['Iqlāb', 'If ب follows: the nūn turns into a hidden م, read with ghunnah.'],
    ihfa: ['Ikhfāʾ', 'If one of the remaining 15 letters follows: the nūn is hidden, read lightly through the nose.'],
    ihfaSefevi: ['Ikhfāʾ shafawī', 'ب after mīm sākinah: the lips close lightly, read with ghunnah.'],
    idgamMim: ['Idghām mithlayn (mīm)', 'م after mīm sākinah: the two mīms merge, read with ghunnah.'],
    izharSefevi: ['Iẓhār shafawī', 'Any other letter after mīm sākinah: the mīm is pronounced clearly.'],
    gunne: ['Ghunnah (nūn/mīm with shaddah)', 'نّ or مّ with shaddah is read through the nose and held a little.'],
    misleyn: ['Idghām mithlayn', 'Two identical letters side by side: the first is silent and merges into the second.'],
    mutecaniseyn: ['Idghām mutajānisayn', 'Two letters with the same articulation point but different qualities: the first merges into the second.'],
    mutekaribeyn: ['Idghām mutaqāribayn', 'Two letters close in articulation/quality: the first merges into the second.'],
    kalkale: ['Qalqalah', 'The letters ق ط ب ج د are read with a slight bounce when silent.'],
    kameri: ['Definite lām: moon letter', 'Moon letter after ال: the lām is pronounced (al-qamar).'],
    semsi: ['Definite lām: sun letter', 'Sun letter after ال: the lām is silent and the next letter has shaddah (ash-shams).'],
    allahKalin: ['The name Allah: heavy', 'If the letter before has fatḥah or ḍammah (or you start with it): the lām of Allah is heavy.'],
    allahInce: ['The name Allah: light', 'If the letter before has kasrah: the lām of Allah is light.'],
    raKalin: ['Rāʾ: heavy', 'Rāʾ with fatḥah/ḍammah, or a silent rāʾ after fatḥah/ḍammah: heavy.'],
    raInce: ['Rāʾ: light', 'Rāʾ with kasrah, or a silent rāʾ after an (original) kasrah: light.'],
    sekte: ['Sakt', 'A short pause without taking a breath, then continue (4 places in Ḥafṣ).'],
    vakfLazim: ['Necessary stop (مـ)', 'You must stop; continuing may distort the meaning.'],
    vakfCaiz: ['Permissible stop (ج)', 'Stopping and continuing are equally fine.'],
    vaslEvla: ['Better to continue (صلى)', 'You may stop, but continuing is better.'],
    vakfEvla: ['Better to stop (قلى)', 'You may continue, but stopping is better.'],
    muanaka: ['Muʿānaqah (∴ ∴)', 'Stop at one of the two triple dots, not at both.'],
    ivaz: ['Madd ʿiwaḍ', 'When stopping on fatḥatayn, the tanwīn drops and you lengthen 1 alif (ḍabḥā).'],
    teMerbuta: ['Stopping on tāʾ marbūṭah (ة)', 'When you stop on ة it is read like "h".'],
    imale: ['Imālah', 'Tilting the "a" sound towards "e": مَجۡرٜىٰهَا → majrēhā (the only place in Ḥafṣ).'],
    ismam: ['Ishmām', 'تَأۡمَ۬نَّا: the lips are rounded for a ḍammah while the merge is made.'],
    teshil: ['Tas-hīl', 'ءَا۬عۡجَمِيّٞ: the second hamzah is softened (between hamzah and alif).']
  };

  const UNITS = {
    u0: {
      ad: 'Getting started: vowels and signs',
      sayfalar: [
        ['What is tajwīd?', `<p>Tajwīd is the set of rules for reading the letters of the Qur'an <b>correctly and beautifully</b>. Think of them as traffic signs: they tell you where to <b>lengthen</b>, where to read <b>through the nose</b>, and where to <b>stop</b>.</p><p>In this app you will first learn each rule, then see it in examples, then take a test. When you score <b>80%</b> on a unit test, the next unit opens.</p>`],
        ['Short vowels (ḥarakāt)', `<p>The vowels give the letters their sound:</p><ul><li><span class="ar">بَ</span> <b>Fatḥah</b>: "ba"</li><li><span class="ar">بِ</span> <b>Kasrah</b>: "bi"</li><li><span class="ar">بُ</span> <b>Ḍammah</b>: "bu"</li></ul>`],
        ['Sukūn and shaddah', `<p><b>Sukūn</b>: the letter has no vowel and joins the letter before it. In the Madani muṣḥaf it looks like a small head: <span class="ar">قُلۡ</span> (qul).</p><p><b>Shaddah</b> <span class="ar">ـّ</span>: the letter is read twice, the first silent and the second voweled: <span class="ar">رَبِّ</span> (rab-bi).</p>`],
        ['Tanwīn', `<p>Tanwīn is a doubled vowel and adds a hidden <b>"n"</b> sound at the end:</p><ul><li><span class="ar">بٗا / بًا</span> "ban"</li><li><span class="ar">بٖ / بٍ</span> "bin"</li><li><span class="ar">بٞ / بٌ</span> "bun"</li></ul><p><b>Madani muṣḥaf tip:</b> when the tanwīn is written <b>stacked</b> (<span class="ar">ٌ ً ٍ</span>), the nūn is read <b>clearly</b> (iẓhār). When it is written <b>staggered</b> (<span class="ar">ٞ ٗ ٖ</span>), the nūn is either hidden or merged into the next letter (ikhfāʾ / idghām).</p>`],
        ['The madd letters', `<p>There are three madd (lengthening) letters:</p><ul><li><b>Alif</b> <span class="ar">ا</span>: when the letter before has fatḥah → <span class="ar">قَالَ</span> "qāla"</li><li><b>Wāw</b> <span class="ar">و</span> (silent): when the letter before has ḍammah → <span class="ar">نُوحٌ</span> "nūḥ"</li><li><b>Yāʾ</b> <span class="ar">ي</span> (silent): when the letter before has kasrah → <span class="ar">فِيهِ</span> "fīhi"</li></ul><p>The Qur'an also has small versions of them: the dagger alif (<span class="ar">ٰ</span>), small wāw (<span class="ar">ۥ</span>) and small yāʾ (<span class="ar">ۦ</span>).</p>`],
        ['Small signs in the Madani muṣḥaf', `<ul><li><b>Madd sign</b> <span class="ar">ٓ</span>: a wavy line. It means "lengthen more than usual here".</li><li><b>Nūn without sukūn</b>: <span class="ar">مِن رَّبِّهِمۡ</span> — if the nūn has no sukūn and the next letter has shaddah, there is <b>idghām</b>.</li><li><b>Small mīm</b> <span class="ar">ۢ</span>: shows that the nūn or tanwīn turns into "m" (iqlāb).</li><li><b>Hamzat al-waṣl</b> <span class="ar">ٱ</span>: not read in the middle of reading, only when you start with it.</li></ul><p class="not">Note: muṣḥafs printed in Turkey and elsewhere may show some signs differently — for example a sukūn is written on every silent nūn. The rules are the same.</p>`]
      ],
      sorular: [
        ['How is a letter with shaddah (ـّ) read?', 'Twice (the first silent, the second voweled)', ['It is not read at all', 'It is lengthened', 'It is read through the nose']],
        ['What hidden sound does tanwīn add to a letter?', 'n', ['m', 'h', 'a']],
        ['Which one is NOT a madd letter?', 'ب', ['ا', 'و', 'ي']],
        ['When is alif (ا) a madd letter?', 'When the letter before it has fatḥah', ['When the letter before it has kasrah', 'When the letter before it has ḍammah', 'When it has shaddah']],
        ['When is a silent wāw (و) a madd letter?', 'When the letter before it has ḍammah', ['When the letter before it has fatḥah', 'When the letter before it has kasrah', 'Always']],
        ['In the Madani muṣḥaf, what does a STAGGERED tanwīn (ٞ ٗ ٖ) mean?', 'The nūn is hidden or merged into the next letter', ['The nūn is read clearly', 'The word is lengthened', 'You must stop there']],
        ['What does the small mīm (ۢ) show?', 'That the nūn turns into "m" (iqlāb)', ['That you should stop', 'A shaddah', 'Qalqalah']],
        ['Is hamzat al-waṣl (ٱ) read in the middle of reading?', 'No, it is not read', ['Yes, always', 'Only lengthened', 'Only through the nose']],
        ['What does the wavy madd sign (ٓ) mean?', 'Lengthen more than usual', ['Stop', 'Read through the nose', 'Don\'t read it']],
        ['True or false? In \'قُلۡ\' the lām is silent.', 'True', ['False']]
      ]
    },
    m1: {
      ad: 'Articulation points (makhārij)',
      sayfalar: [
        ['What is a makhraj?', `<p>A <b>makhraj</b> is the place a letter comes from. Every letter has its own "address". If you produce a letter from the wrong place it turns into another letter and the meaning can change:</p><p><span class="ar">قَلۡب</span> (heart) ↔ <span class="ar">كَلۡب</span> (dog)</p><p>According to Ibn al-Jazarī, the letters come from <b>17 points in 5 areas</b>: the mouth-and-throat cavity (jawf), the throat (ḥalq), the tongue (lisān), the lips (shafatān) and the nose (khayshūm).</p><p class="not"><b>How to find a makhraj:</b> make the letter silent and put a hamzah with a vowel before it: <span class="ar">أَبۡ · أَقۡ · أَصۡ</span>. Where the sound stops is the letter's makhraj.</p>`],
        ['Diagram', `${MSVG}<p class="soluk kucukyazi">This is a schematic drawing; the numbers are the points on the next pages.</p>${L([['1', 'Jawf — madd letters'], ['2–4', 'Throat (ḥalq)'], ['5–14', 'Tongue (lisān)'], ['15–16', 'Lips (shafatān)'], ['17', 'Nose (khayshūm) — ghunnah']])}`],
        ['Jawf and the throat', `${L([['1', '<b>Jawf</b> (the mouth and throat cavity): the madd letters <span class="ar">ا و ي</span>. The sound flows until the air runs out.'], ['2', '<b>Deepest part of the throat</b>: <span class="ar">ء ه</span>'], ['3', '<b>Middle of the throat</b>: <span class="ar">ع ح</span>'], ['4', '<b>Part of the throat nearest the mouth</b>: <span class="ar">غ خ</span>']])}<p class="not">These six throat letters are the <b>iẓhār</b> letters for nūn sākinah and tanwīn. Their makhraj is far from the nūn, so the nūn is read clearly.</p>`],
        ['Back and middle of the tongue', `${L([['5', '<b>Back of the tongue + soft palate</b>: <span class="ar">ق</span> (heavy)'], ['6', '<b>A little further forward</b>: <span class="ar">ك</span> (light)'], ['7', '<b>Middle of the tongue + hard palate</b>: <span class="ar">ج ش ي</span> (yāʾ that is not a madd letter)']])}<p class="not"><span class="ar">ق</span> and <span class="ar">ك</span> are neighbours but different: <span class="ar">ق</span> is deeper and heavy, <span class="ar">ك</span> is further forward and light.</p>`],
        ['Edge and tip of the tongue', `${L([['8', '<b>Side of the tongue + the molars</b> (right or left): <span class="ar">ض</span>'], ['9', '<b>Front part of the tongue\'s side + upper gums</b>: <span class="ar">ل</span>'], ['10', '<b>Tip of the tongue + upper front gums</b>: <span class="ar">ن</span>'], ['11', '<b>Tip of the tongue, slightly behind the nūn</b>: <span class="ar">ر</span>'], ['12', '<b>Tip of the tongue + roots of the upper front teeth</b>: <span class="ar">ط د ت</span>'], ['13', '<b>Tip of the tongue + between the front teeth</b> (whistling): <span class="ar">ص ز س</span>'], ['14', '<b>Tip of the tongue + edges of the upper front teeth</b>: <span class="ar">ظ ذ ث</span>']])}<p class="not">Even a tiny shift of the tongue tip changes the letter. Practise points 10–14 <b>by listening</b>.</p>`],
        ['Lips and nose', `${L([['15', '<b>Inside of the lower lip + edges of the upper front teeth</b>: <span class="ar">ف</span>'], ['16', '<b>Both lips</b>: <span class="ar">ب م و</span>. The lips close for <span class="ar">ب</span> and <span class="ar">م</span>, and round for <span class="ar">و</span>.'], ['17', '<b>The nose</b> (khayshūm): the <b>ghunnah</b> sound, the nasal sound of nūn and mīm']])}<p class="not">Hold your nose lightly and say <span class="ar">إِنَّ</span>: if the sound stops, your ghunnah is coming from the nose correctly.</p>`]
      ],
      sorular: [
        ['What is a makhraj?', 'The place a letter comes from', ['Lengthening a letter', 'Reading a letter heavy', 'A stop sign']],
        ['According to Ibn al-Jazarī, how many makhārij are there?', '17', ['5', '28', '10']],
        ['Into how many main areas are the makhārij grouped?', '5', ['3', '17', '7']],
        ['Where do ع and ح come from?', 'The middle of the throat', ['The deepest part of the throat', 'The lips', 'The tip of the tongue']],
        ['Where do ء and ه come from?', 'The deepest part of the throat', ['The middle of the throat', 'The nose', 'The back of the tongue']],
        ['Where does ق come from?', 'The back of the tongue and the soft palate', ['The tip of the tongue', 'The lips', 'The middle of the throat']],
        ['Where does ض come from?', 'The side of the tongue and the molars', ['The tongue tip and edges of the upper front teeth', 'Both lips', 'The nose']],
        ['Where do the letters ظ ذ ث come from?', 'The tongue tip and the edges of the upper front teeth', ['The side of the tongue and the molars', 'The middle of the throat', 'The back of the tongue']],
        ['Where does ف come from?', 'The inside of the lower lip and the edges of the upper front teeth', ['Both lips', 'The middle of the tongue', 'The nose']],
        ['Where does the ghunnah sound come from?', 'The nose (khayshūm)', ['The throat', 'The lips', 'The tip of the tongue']],
        ['What is the makhraj of the madd letters?', 'The jawf (mouth and throat cavity)', ['The tip of the tongue', 'Both lips', 'The deepest part of the throat']],
        ['How do you find the makhraj of a letter?', 'Make it silent and put a voweled hamzah before it (أَبۡ)', ['Lengthen it', 'Read it with shaddah', 'Read it through the nose']]
      ]
    },
    m2: {
      ad: 'Qualities of the letters (ṣifāt)',
      sayfalar: [
        ['What is a ṣifah?', `<p>If the makhraj is a letter's <b>address</b>, its ṣifah (quality) is its <b>character</b>: does the breath flow, is the sound held back, is it heavy or light?</p><p>Qualities separate letters that come from the same place. For example <span class="ar">ت</span> and <span class="ar">ط</span> share a makhraj, but <span class="ar">ط</span> is heavy and full while <span class="ar">ت</span> is light and breathy.</p><p>Qualities are of two kinds: those with <b>opposites</b> (in pairs) and those <b>without opposites</b>.</p>`],
        ['Qualities with opposites (1)', `<ul><li><b>Hams</b> (the breath flows) — 10 letters: <span class="ar">فَحَثَّهُ شَخۡصٌ سَكَتَ</span><br>Its opposite <b>jahr</b>: the breath is held and the sound is strong (the other 19 letters).</li><li><b>Shiddah</b> (the sound is held back) — 8 letters: <span class="ar">أَجِدۡ قَطٍ بَكَتۡ</span><br>Its opposite <b>rakhāwah</b>: the sound flows.</li><li><b>Tawassuṭ</b> (in between) — 5 letters: <span class="ar">لِنۡ عُمَرۡ</span></li></ul>`],
        ['Qualities with opposites (2)', `<ul><li><b>Istiʿlāʾ</b> (the back of the tongue rises, the letter is heavy) — 7 letters: <span class="ar">خُصَّ ضَغۡطٍ قِظۡ</span><br>Its opposite <b>istifāl</b>: the tongue stays low.</li><li><b>Iṭbāq</b> (the tongue closes against the palate) — 4 letters: <span class="ar">ص ض ط ظ</span><br>Its opposite <b>infitāḥ</b>: there is a gap between tongue and palate.</li><li><b>Idhlāq</b> (easily produced from the tongue tip and lips) — 6 letters: <span class="ar">فِرَّ مِنۡ لُبٍّ</span><br>Its opposite <b>iṣmāt</b>.</li></ul>`],
        ['Qualities without opposites', `<ul><li><b>Ṣafīr</b> (whistling): <span class="ar">ز س ص</span></li><li><b>Qalqalah</b> (bounce): <span class="ar">ق ط ب ج د</span></li><li><b>Līn</b> (softness): silent <span class="ar">و ي</span> after a fatḥah</li><li><b>Inḥirāf</b> (deviation): <span class="ar">ل ر</span></li><li><b>Takrīr</b> (tendency to repeat): <span class="ar">ر</span> — know it but don't exaggerate; the rāʾ is not rolled</li><li><b>Tafashshī</b> (spreading of the sound in the mouth): <span class="ar">ش</span></li><li><b>Istiṭālah</b> (lengthening of the sound): <span class="ar">ض</span></li></ul>`],
        ['Heavy and light letters', `<ul><li><b>Always heavy</b>: the istiʿlāʾ letters <span class="ar">خ ص ض غ ط ق ظ</span></li><li><b>Depends on the situation</b>: <span class="ar">ر</span> (you'll learn it in the rāʾ unit) and the <span class="ar">ل</span> in the name of Allah</li><li><b>Alif</b>: follows the letter before it — heavy in <span class="ar">قَالَ</span>, light in <span class="ar">كَانَ</span></li><li><b>All others</b>: always light</li></ul><p class="not">A very common mistake is making light letters heavy or heavy letters light. Heaviness comes from raising the back of the tongue, not from rounding the lips.</p>`]
      ],
      sorular: [
        ['Which phrase holds the letters of hams (flowing breath)?', 'فَحَثَّهُ شَخۡصٌ سَكَتَ', ['أَجِدۡ قَطٍ بَكَتۡ', 'خُصَّ ضَغۡطٍ قِظۡ', 'لِنۡ عُمَرۡ']],
        ['Which phrase holds the letters of shiddah (held-back sound)?', 'أَجِدۡ قَطٍ بَكَتۡ', ['فَحَثَّهُ شَخۡصٌ سَكَتَ', 'فِرَّ مِنۡ لُبٍّ', 'لِنۡ عُمَرۡ']],
        ['Which are the istiʿlāʾ (heavy) letters?', 'خُصَّ ضَغۡطٍ قِظۡ', ['فِرَّ مِنۡ لُبٍّ', 'أَجِدۡ قَطٍ بَكَتۡ', 'ي ن م و']],
        ['Which are the iṭbāq letters?', 'ص ض ط ظ', ['ز س ص', 'ق ط ب ج د', 'ل ر']],
        ['Which are the ṣafīr (whistling) letters?', 'ز س ص', ['ص ض ط ظ', 'ل ر', 'ق ك']],
        ['Which letter has the quality of takrīr?', 'ر', ['ل', 'ش', 'ض']],
        ['Which letter has the quality of istiṭālah?', 'ض', ['ش', 'ر', 'ظ']],
        ['Which letter has tafashshī (spreading of the sound)?', 'ش', ['س', 'ض', 'ر']],
        ['What does hams mean?', 'The breath flows when the letter is read', ['The sound is held back', 'The tongue closes against the palate', 'The sound comes from the nose']],
        ['What is the difference between ت and ط?', 'Same makhraj; ط is heavy (istiʿlāʾ, iṭbāq), ت is light', ['Different makhraj, same qualities', 'ت is heavy, ط is light', 'There is no difference']],
        ['Is alif read heavy or light?', 'It follows the letter before it', ['Always heavy', 'Always light', 'Through the nose']],
        ['True or false? The rāʾ should be rolled when it is read.', 'False', ['True']]
      ]
    },
    m3: {
      ad: 'Letters that are easily confused',
      sayfalar: [
        ['Why do they get mixed up?', `<p>Many of these sounds don't exist in Turkish or English, so these groups can sound the same:</p><ul><li><span class="ar">ض ظ ذ ز</span> → all like "z"</li><li><span class="ar">ث س ص</span> → all like "s"</li><li><span class="ar">ح ه خ</span> → all like "h"</li><li><span class="ar">ع ء</span>, <span class="ar">ق ك</span>, <span class="ar">ط ت</span></li></ul><p>But in the Qur'an, changing the letter changes the meaning:</p><p><span class="ar">عَلِيم</span> (All-Knowing) ↔ <span class="ar">أَلِيم</span> (painful)</p><p class="not">Be sure to study this unit <b>with audio</b>. Practice and tests include "listen and find" questions.</p>`],
        ['ض ظ ذ ز', `<ul><li><span class="ar">ض</span>: the side of the tongue presses on the molars; <b>heavy</b>, the sound extends (istiṭālah)</li><li><span class="ar">ظ</span>: tongue tip at the edges of the upper front teeth, tongue slightly out; <b>heavy</b></li><li><span class="ar">ذ</span>: same place as <span class="ar">ظ</span>; <b>light</b></li><li><span class="ar">ز</span>: tongue tip behind the front teeth, whistling; <b>light</b></li></ul><p class="not">Tip: for <span class="ar">ظ</span> and <span class="ar">ذ</span> you should feel the tip of your tongue between your teeth.</p>`],
        ['ث س ص', `<ul><li><span class="ar">ث</span>: tongue tip at the edges of the upper front teeth, like English "th" in "think"; <b>light</b>, breathy</li><li><span class="ar">س</span>: tongue tip behind the front teeth, whistling; <b>light</b></li><li><span class="ar">ص</span>: same place as <span class="ar">س</span> but the tongue closes against the palate; <b>heavy</b></li></ul>`],
        ['ح ه خ — ع ء', `<ul><li><span class="ar">ه</span>: from the deepest part of the throat, a light, relaxed breath</li><li><span class="ar">ح</span>: from the middle of the throat, a breath squeezed through a tightened throat</li><li><span class="ar">خ</span>: from the part of the throat nearest the mouth, a rasping sound</li><li><span class="ar">ء</span>: a sudden stop of the sound deep in the throat</li><li><span class="ar">ع</span>: from the middle of the throat, a tightened, voiced letter</li></ul>`],
        ['ق ك — ط ت', `<ul><li><span class="ar">ق</span>: from the back of the tongue, <b>heavy</b>, no breath flows</li><li><span class="ar">ك</span>: a little further forward, <b>light</b>, breathy</li><li><span class="ar">ط</span>: tongue tip at the roots of the upper teeth, tongue closes against the palate; <b>heavy</b></li><li><span class="ar">ت</span>: same place, <b>light</b> and breathy</li></ul>`]
      ],
      sorular: [
        ['Why does the difference between عَلِيم and أَلِيم matter?', 'Reading ء instead of ع changes the meaning (All-Knowing / painful)', ['There is no difference, both are read the same', 'Only the lengthening is different', 'Only the heaviness is different']],
        ['Which one is read heavy?', 'ص', ['س', 'ث', 'ز']],
        ['What is the difference between ظ and ذ?', 'Same place; ظ is heavy, ذ is light', ['Their makhārij are far apart', 'ذ is heavy, ظ is light', 'There is no difference']],
        ['What is the difference between ح and ه?', 'ح comes squeezed from the middle of the throat, ه with a light breath from the deepest part', ['Both come from the lips', 'ه is heavier', 'There is no difference']],
        ['How is ث produced?', 'The tongue tip touches the edges of the upper front teeth ("th")', ['From the back of the tongue', 'From both lips', 'From the middle of the throat']],
        ['What is the difference between ق and ك?', 'ق is deeper and heavy, ك is further forward and light', ['ك is heavier', 'Both come from the lips', 'There is no difference']]
      ]
    },
    u1: {
      ad: 'Natural madd (madd ṭabīʿī)',
      sayfalar: [
        ['Blow it up like a balloon', `<p>When a madd letter (<span class="ar">ا و ي</span>) comes and <b>no hamzah or sukūn follows it</b>, you lengthen it by <b>1 alif</b>.</p><p>How long is <b>1 alif</b>? About the time it takes to open and close a finger — roughly two vowel counts. In this course every other madd is measured in this unit.</p><p><span class="ar">قَالَ</span> → "qāla", not "qāāla".</p>`],
        ['Why "natural"?', `<p>Because this lengthening is part of the letter's nature. A word with a madd letter can't be read correctly without it. All other madds are built on this one, so learn it well!</p><p class="not">Detail: a madd that comes after a hamzah in a word (<span class="ar">ءَامَنُواْ</span>, "āmanū") is also read 1 alif in Ḥafṣ. It is called madd badal and is applied like the natural madd.</p>`]
      ],
      ornek: [['māliki', 'The dagger alif (ـٰ) on the mīm stands for an alif: 1 alif.'], ['mā', 'Alif after a mīm with fatḥah.'], ['alladhīna', 'Silent yāʾ after a dhāl with kasrah.'], ['ṣudūri', 'Silent wāw after a dāl with ḍammah.'], ['dīnukum', 'Silent yāʾ after a dāl with kasrah.'], ['wa qāla', 'Alif after a qāf with fatḥah.'], ['āmanū', '1 alif of lengthening at both the start and the end.']],
      sorular: [
        ['How long is a natural madd?', '1 alif', ['4 alifs', 'It is not lengthened', '6 alifs']],
        ['In a natural madd, what does NOT come after the madd letter?', 'A hamzah or sukūn', ['A voweled letter', 'Any letter', 'The end of the word']],
        ['Which letter is lengthened in \'قِيلَ\'?', 'Yāʾ (ي): "qīla"', ['Qāf', 'Lām', 'None']],
        ['What does the dagger alif (ٰ) stand for?', 'An alif (madd letter)', ['A shaddah', 'A sukūn', 'A tanwīn']],
        ['True or false? All other madds are built on the natural madd.', 'True', ['False']]
      ]
    },
    u2: {
      ad: 'Madd muttaṣil',
      sayfalar: [
        ['The joined madd', `<p><b>Muttaṣil</b> means "joined". The madd letter and the hamzah (<span class="ar">ء</span>) are in the <b>same word</b>.</p><p><span class="ar">جَآءَ</span> → "jāāʾa". When you see the madd sign (<span class="ar">ٓ</span>), lengthen more!</p>`],
        ['How long?', `<p>Sources accept <b>2 to 5 alifs</b>. The common practice in Turkey is <b>4 alifs</b>. What matters: it is read <b>longer than the natural madd</b> and this madd is <b>obligatory</b> (it may not be shortened).</p><p class="not">Try to keep the same length throughout your recitation. Don't lengthen one by 4 and another by 2.</p>`]
      ],
      ornek: [['jāāʾa', 'Alif and hamzah in the same word.'], ['was-samāāʾi', 'Alif after the mīm, then hamzah.'], ['ash-shitāāʾi', 'Alif and hamzah joined.'], ['ḥunafāāʾa', 'Alif after the fāʾ + hamzah.'], ['sawāāʾun', 'Alif + hamzah in the same word.'], ['jazāāʾuhum', 'Alif + hamzah, then the word continues.'], ['as-samāāʾi', 'Alif + hamzah in the same word.']],
      sorular: [
        ['Where is the hamzah in madd muttaṣil?', 'In the same word as the madd letter', ['In the next word', 'At the start of the word', 'There is none']],
        ['What does "muttaṣil" mean?', 'Joined', ['Separated', 'Short', 'Hidden']],
        ['How long is madd muttaṣil commonly read in Turkey?', '4 alifs', ['1 alif', 'Not lengthened', '8 alifs']],
        ['Which one has madd muttaṣil?', 'جَآءَ', ['قَالَ', 'فِيهِ', 'قُلۡ']],
        ['True or false? Madd muttaṣil is read longer than the natural madd.', 'True', ['False']]
      ]
    },
    u3: {
      ad: 'Madd munfaṣil',
      sayfalar: [
        ['The separated madd', `<p><b>Munfaṣil</b> means "separated". The madd letter is at the <b>end</b> of one word and the hamzah is at the <b>start of the next word</b>.</p><p><span class="ar">بِمَآ أُنزِلَ</span> → "bimāā unzila".</p>`],
        ['How long?', `<p>It may be read <b>1 to 4 alifs</b> (a permissible madd). In fast recitation (ḥadr) it is short, in slow recitation (taḥqīq) it is long. Keep the same length throughout your recitation.</p><p class="not">If you read the word on its own there is no madd, because the hamzah is in the next word. Munfaṣil only appears when you join the two words.</p><p><span class="ar">يَـٰٓأَيُّهَا</span> ("yāā ayyuhā") also counts as munfaṣil: the alif of the vocative يا joins with أَيُّهَا.</p>`]
      ],
      ornek: [['bimāā unzila', 'Alif in one word, hamzah in the next.'], ['wa māā unzila', 'Madd letter + hamzah in the next word.'], ['innāā aʿṭaynāka', 'The alif of إِنَّآ, then the hamzah of أَعۡطَيۡنَٰكَ.'], ['innāā anzalnāhu', 'Alif + hamzah in the next word.'], ['māā aʿbud', 'مَآ + أَعۡبُدُ.'], ['yāā ayyuhā', 'The vocative يا: counts as munfaṣil.'], ['illāā ulū', 'The alif of إِلَّآ + the hamzah of أُوْلُواْ.']],
      sorular: [
        ['Where is the hamzah in madd munfaṣil?', 'At the start of the next word', ['In the same word', 'In the middle of the word', 'There is none']],
        ['How long can madd munfaṣil be read?', '1–4 alifs', ['Only 6 alifs', 'Not lengthened', 'Only half an alif']],
        ['Which one has madd munfaṣil?', 'بِمَآ أُنزِلَ', ['جَآءَ', 'ٱلسَّمَآءِ', 'قَالَ']],
        ['If you read \'بِمَآ\' ON ITS OWN, is there madd munfaṣil?', 'No, the hamzah is in the next word', ['Yes, always', 'Yes, 6 alifs', 'Only when stopping']],
        ['What is the difference between muttaṣil and munfaṣil?', 'Whether the hamzah is in the same word or the next word', ['The colour of the letters', 'Whether there is a shaddah', 'Only the tone of voice']]
      ]
    },
    u4: {
      ad: 'Madd lāzim',
      sayfalar: [
        ['The necessary long madd', `<p>If a <b>permanent sukūn</b> or a <b>shaddah</b> follows the madd letter, it is madd lāzim. This is the longest madd and is lengthened in <b>every recitation</b>.</p><p><span class="ar">ٱلضَّآلِّينَ</span> → "aḍ-ḍāāllīn". After the alif comes a lām with shaddah.</p>`],
        ['Its four types', `<ul><li><b>Heavy, in a word (kalimī muthaqqal)</b>: madd + letter with shaddah. <span class="ar">ٱلۡحَآقَّةُ</span></li><li><b>Light, in a word (kalimī mukhaffaf)</b>: madd + sukūn without shaddah. <span class="ar">ءَآلۡـَٰٔنَ</span> (very rare in the Qur'an)</li><li><b>Heavy, in a letter (ḥarfī muthaqqal)</b>: in the opening letters of a sūrah, merging into the next letter. <span class="ar">الٓمٓ</span> → "alif lāām mīīm"; the mīm of lām merges into the next mīm.</li><li><b>Light, in a letter (ḥarfī mukhaffaf)</b>: an opening letter on its own. <span class="ar">قٓ</span> → "qāāf", <span class="ar">نٓ</span> → "nūūn"</li></ul>`],
        ['How long?', `<p>Sources give <b>2–4 alifs</b>. In practice, as the longest madd, it is read <b>3–4 alifs</b> and kept the same throughout. Learn how the letter names at the start of sūrahs (<b>alif, lām, mīm, qāf, nūn</b>…) are read by listening.</p>`]
      ],
      ornek: [['wa laḍ-ḍāāllīn', 'Alif + lām with shaddah: heavy, in a word.'], ['al-ḥāāqqah', 'Alif + qāf with shaddah.'], ['aṣ-ṣāākhkhah', 'Alif + khāʾ with shaddah.'], ['aṭ-ṭāāmmatu', 'Alif + mīm with shaddah.'], ['āāl-āna', 'Alif + silent lām: light, in a word.'], ['alif lāām mīīm', 'Sūrah-opening letters: madd lāzim in letters.'], ['qāāf', 'Light, in a letter.'], ['nūūn', 'Light, in a letter.']],
      sorular: [
        ['In madd lāzim, what comes after the madd letter?', 'A permanent sukūn or shaddah', ['A hamzah', 'A voweled letter', 'A stop sign']],
        ['Which one has madd lāzim?', 'ٱلضَّآلِّينَ', ['بِمَآ أُنزِلَ', 'قَالَ', 'فِيهِ']],
        ['How is \'الٓمٓ\' read?', 'Alif lāām mīīm', ['Alam', 'Alim', 'Alif lam mim (without lengthening)']],
        ['Which madd is in the sūrah-opening letters (قٓ, نٓ)?', 'Madd lāzim (in letters)', ['Madd munfaṣil', 'Natural madd', 'There is no madd']],
        ['Which madd is the longest and obligatory?', 'Madd lāzim', ['Natural madd', 'Madd munfaṣil', 'Ṣilah']],
        ['Which type of madd lāzim is \'ٱلۡحَآقَّةُ\'?', 'Heavy, in a word', ['Light, in a letter', 'Light, in a word', 'Heavy, in a letter']]
      ]
    },
    u5: {
      ad: 'Madd ʿāriḍ and madd līn',
      sayfalar: [
        ['The madd that comes when stopping', `<p>When you <b>stop</b> at the end of an āyah, the last letter becomes silent. If a madd letter comes before it, it becomes <b>madd ʿāriḍ</b>. "ʿĀriḍ" means something that arises later.</p><p><span class="ar">ٱلۡعَٰلَمِينَ</span> → stopping: "al-ʿālamīīn". If you continue ("al-ʿālamīna") only the natural madd remains.</p><p>Length: <b>1–4 alifs</b>. Keep it the same throughout your recitation.</p>`],
        ['Madd līn', `<p><b>Līn</b> means soft. It happens when you <b>stop</b> on the letter after a silent <span class="ar">و</span> or <span class="ar">ي</span> that follows a <b>fatḥah</b>.</p><p><span class="ar">قُرَيۡشٍ</span> → stopping: "quraysh". The yāʾ is lengthened slightly.</p><p class="not">Careful: in words like <span class="ar">يَوۡمِ</span> there is no līn madd while reading on. It only happens if you stop on that word.</p>`]
      ],
      ornek: [['al-ʿālamīīn', 'When stopping the nūn becomes silent, and ي comes before it.'], ['ad-dīīn', 'Stopping: yāʾ + silent nūn.'], ['nastaʿīīn', 'End of āyah, you stop.'], ['an-nāās', 'Alif + sīn made silent by stopping.'], ['sāhūūn', 'Wāw + nūn made silent by stopping.'], ['al-mufliḥūūn', 'End of āyah, you stop.'], ['quraysh', 'Rāʾ with fatḥah + silent yāʾ; stop on the shīn.'], ['al-bayt', 'Bāʾ with fatḥah + silent yāʾ; stop on the tāʾ.'], ['khawf', 'Khāʾ with fatḥah + silent wāw; stop on the fāʾ.']],
      sorular: [
        ['When does madd ʿāriḍ appear?', 'When you stop at the end of a word', ['Always', 'When a hamzah follows', 'When a shaddah follows']],
        ['In madd līn, what vowel does the letter before the wāw/yāʾ have?', 'Fatḥah', ['Kasrah', 'Ḍammah', 'Sukūn']],
        ['If you DON\'T stop on \'ٱلۡعَٰلَمِينَ\', which madd is the last lengthening?', 'Natural madd', ['Madd ʿāriḍ', 'Madd lāzim', 'Madd muttaṣil']],
        ['How long can madd ʿāriḍ be read?', '1–4 alifs', ['Only 6', 'Not at all', 'Only half']],
        ['Which one is an example of madd līn (when stopping)?', 'قُرَيۡشٍ', ['قَالَ', 'جَآءَ', 'ٱلضَّآلِّينَ']]
      ]
    },
    u6: {
      ad: 'The pronoun and ṣilah (hāʾ al-kināyah)',
      sayfalar: [
        ['Small wāw and small yāʾ', `<p>The pronoun <span class="ar">ه</span> ("his/him") is lengthened when it is <b>between two voweled letters</b>. In the Madani muṣḥaf this is shown by a small <span class="ar">ۥ</span> (wāw) or <span class="ar">ۦ</span> (yāʾ).</p><p><span class="ar">لَّهُۥ كُفُوًا</span> → "lahū kufuwan".</p>`],
        ['Short and long ṣilah', `<ul><li>If a <b>voweled</b> letter follows: <b>1 alif</b> (short ṣilah).</li><li>If a <b>hamzah</b> follows: lengthened <b>like munfaṣil</b> (long ṣilah). <span class="ar">مَالَهُۥٓ أَخۡلَدَهُۥ</span></li><li>If the letter before the pronoun is <b>silent</b>, it is not lengthened: <span class="ar">فِيهِ</span> "fīhi", <span class="ar">مِنۡهُ</span> "minhu".</li><li>If a silent letter follows the pronoun, it is not lengthened.</li><li>If you <b>stop</b> on the pronoun, it is not lengthened; the "h" is read silent.</li></ul><p class="not">The exception in Ḥafṣ: <span class="ar">فِيهِۦ مُهَانًا</span> (al-Furqān 69). It is lengthened even though the letter before is silent.</p>`]
      ],
      ornek: [['lahū', 'Lām with fatḥah before, voweled kāf after: 1 alif.'], ['māluhū', 'The pronoun between two voweled letters.'], ['bihī', 'Shown with a small yāʾ: 1 alif.'], ['mālahūū akhladah', 'A hamzah follows: like munfaṣil (long ṣilah).'], ['fīhī muhānā', 'Exception: lengthened even though the letter before is silent.']],
      sorular: [
        ['When is the pronoun ه lengthened?', 'When it is between two voweled letters', ['Always', 'When the letter before is silent', 'Never']],
        ['Why is the pronoun in \'فِيهِ\' not lengthened?', 'The letter before it (ي) is silent', ['It ends with a hamzah', 'It has a shaddah', 'There is a stop sign']],
        ['What happens if a hamzah comes after the pronoun?', 'It is lengthened like munfaṣil', ['It is not lengthened', 'It is read through the nose', 'Qalqalah is made']],
        ['Which sign shows ṣilah in the Madani muṣḥaf?', 'A small wāw (ۥ) or small yāʾ (ۦ)', ['Shaddah', 'Small mīm', 'Sukūn']],
        ['Which is the exception in Ḥafṣ that is lengthened although the letter before is silent?', 'فِيهِۦ مُهَانًا', ['لَّهُۥ كُفُوًا', 'مِنۡهُ', 'عَنۡهُ']],
        ['What happens if you stop on the pronoun?', 'It is not lengthened; the "h" is read silent', ['It is lengthened 2 alifs', 'It is read through the nose', 'It is not read']]
      ]
    },
    x1: { ad: 'Checkpoint 1: All the madds' },
    u7: {
      ad: 'Nūn sākinah and tanwīn: Iẓhār',
      sayfalar: [
        ['The 4 states of nūn', `<p>Look at the letter that comes after a silent nūn (<span class="ar">نۡ</span>) or tanwīn. There are 4 possibilities:</p><ol><li><b>Iẓhār</b>: a throat letter → read it clearly</li><li><b>Idghām</b>: <span class="ar">ي ن م و ل ر</span> → merge it</li><li><b>Iqlāb</b>: <span class="ar">ب</span> → turn it into "m"</li><li><b>Ikhfāʾ</b>: the remaining 15 letters → hide it</li></ol><p>We start with iẓhār.</p>`],
        ['Iẓhār: say it clearly', `<p>If the next letter is one of the <b>throat letters</b>, the nūn is read clearly, without ghunnah:</p><p class="ar buyuk">ء ه ع ح غ خ</p><p>To remember: <b>hamzah, hāʾ, ʿayn, ḥāʾ, ghayn, khāʾ</b>. They all come from the throat, while the nūn comes from the tip of the tongue. Their articulation points are far apart, so they don't merge.</p><p>Example: <span class="ar">مِنۡ عَلَقٍ</span> → "min ʿalaq".</p><p class="not">In the Madani muṣḥaf a sukūn is written on a nūn with iẓhār, and tanwīn is written stacked (<span class="ar">ٌ ً ٍ</span>).</p>`]
      ],
      ornek: [['min ʿalaq', 'Nūn sākinah + ع.'], ['min ahli', 'Nūn sākinah + hamzah.'], ['minhu', 'Nūn sākinah + ه inside a word.'], ['min khawf', 'Nūn sākinah + خ.'], ['man khaffat', 'Nūn sākinah + خ.'], ['ʿadhābun ʿaẓīm', 'Tanwīn + ع: tanwīn written stacked.'], ['samīʿun ʿalīm', 'Tanwīn + ع.'], ['ʿazīzun ḥakīm', 'Tanwīn + ح.']],
      sorular: [
        ['Which are the iẓhār letters?', 'ء ه ع ح غ خ', ['ي ن م و', 'ق ط ب ج د', 'ل ر']],
        ['How is the nūn read in iẓhār?', 'Clearly, without ghunnah', ['Hidden, through the nose', 'It is not read', 'It turns into M']],
        ['Where do the iẓhār letters come from in the mouth?', 'The throat', ['The lips', 'The nose', 'The teeth']],
        ['Which one has iẓhār?', 'مِنۡ عَلَقٍ', ['مِن رَّبِّهِمۡ', 'مِنۢ بَعۡدِ', 'يُنفِقُونَ']],
        ['True or false? In the Madani muṣḥaf, tanwīn with iẓhār is written stacked.', 'True', ['False']],
        ['How many states do nūn sākinah and tanwīn have?', '4 (iẓhār, idghām, iqlāb, ikhfāʾ)', ['2', '6', '1']]
      ]
    },
    u8: {
      ad: 'Idghām with ghunnah',
      sayfalar: [
        ['Merge it, through the nose', `<p>If one of these four letters comes after a silent nūn or tanwīn, the nūn <b>merges</b> into it and is read <b>through the nose</b>:</p><p class="ar buyuk">ي ن م و</p><p>To remember: <b>"yanmū"</b> (yā, nūn, mīm, wāw).</p><p><span class="ar">مَن يَقُولُ</span> → "may-yaqūlu". The nūn disappears, the yāʾ gets a shaddah and comes from the nose.</p>`],
        ['An important exception', `<p>Idghām happens <b>between two words</b>. If the nūn and <span class="ar">ي</span>/<span class="ar">و</span> are side by side <b>in the same word</b>, there is no idghām and the nūn is read clearly (absolute iẓhār). This happens in 4 words in the Qur'an:</p><p class="ar">ٱلدُّنۡيَا · صِنۡوَانٞ · قِنۡوَانٞ · بُنۡيَٰنٞ</p><p>It is read "ad-dunyā", not "ad-duyyā".</p>`]
      ],
      ornek: [['may-yaqūlu', 'Nūn + ي: merged through the nose.'], ['fa may-yaʿmal', 'Nūn + ي.'], ['hudam-min', 'Tanwīn + م: staggered tanwīn and mīm with shaddah.'], ['ḥablum-min', 'Tanwīn + م.'], ['sururum-marfūʿah', 'Tanwīn + م.'], ['min-nafsin', 'Nūn + ن: through the nose.'], ['wa raʿduw-wa barq', 'Tanwīn + و.'], ['ad-dunyā', 'Exception: nūn + ي in the same word, no idghām.']],
      sorular: [
        ['Which are the letters of idghām with ghunnah?', 'ي ن م و', ['ل ر', 'ء ه ع ح غ خ', 'ب']],
        ['How is \'مَن يَقُولُ\' read?', 'may-yaqūlu', ['man yaqūlu (clearly)', 'mam-yaqūlu', 'maqūlu']],
        ['Why is there no idghām in \'ٱلدُّنۡيَا\'?', 'The nūn and ي are in the same word', ['There is a stop sign', 'There is a shaddah', 'There is a tanwīn']],
        ['Where does the sound come from in idghām with ghunnah?', 'The nose (nasal)', ['The throat', 'The lips', 'There is no sound']],
        ['Which one has idghām with ghunnah?', 'مِّن نَّفۡسٖ', ['مِنۡ عَلَقٍ', 'مِن رَّسُولٍ', 'مِنۢ بَيۡنِ']],
        ['True or false? In \'صِنۡوَانٞ\' the nūn is read clearly.', 'True', ['False']]
      ]
    },
    u9: {
      ad: 'Idghām without ghunnah',
      sayfalar: [
        ['Merge it, NO nasal sound', `<p>If <span class="ar">ل</span> or <span class="ar">ر</span> comes after a silent nūn or tanwīn, the nūn merges completely and <b>no ghunnah is made</b>.</p><p><span class="ar">مِن رَّبِّهِمۡ</span> → "mir-rabbihim".</p><p><span class="ar">وَيۡلٞ لِّكُلِّ</span> → "waylul-likulli".</p><p class="not">In the Madani muṣḥaf no sukūn is written on the nūn and the following ل/ر has a shaddah. This tells you "merge it".</p>`]
      ],
      ornek: [['mir-rabbihim', 'Nūn + ر: no ghunnah.'], ['mir-rasūl', 'Nūn + ر.'], ['mir-rizqi', 'Nūn + ر.'], ['waylul-likulli', 'Tanwīn + ل.'], ['la ghafūrur-raḥīm', 'Tanwīn + ر.'], ['tawwābar-raḥīmā', 'Tanwīn + ر.'], ['fitnatal-lilladhīna', 'Tanwīn + ل.'], ['la-il-lam', 'Nūn + ل.']],
      sorular: [
        ['Which are the letters of idghām without ghunnah?', 'ل ر', ['ي ن م و', 'ب', 'ق ط ب ج د']],
        ['Is there a nasal sound in idghām without ghunnah?', 'No', ['Yes, long', 'Yes, short', 'Only when stopping']],
        ['How is \'مِن رَّبِّهِمۡ\' read?', 'mir-rabbihim', ['min rabbihim', 'mim rabbihim', 'mi rabbihim']],
        ['Which one has idghām without ghunnah?', 'وَيۡلٞ لِّكُلِّ', ['مَن يَقُولُ', 'مِنۡ عَلَقٍ', 'أَنتُمۡ']]
      ]
    },
    u10: {
      ad: 'Iqlāb',
      sayfalar: [
        ['The nūn becomes "m"', `<p>If <span class="ar">ب</span> comes after a silent nūn or tanwīn, the nūn <b>turns into a mīm</b>, the lips close lightly and it is read <b>through the nose</b>.</p><p><span class="ar">مِنۢ بَعۡدِ</span> → "mim-baʿdi".</p><p>In the Madani muṣḥaf a <b>small mīm</b> (<span class="ar">ۢ</span>) is placed on the nūn or tanwīn. When you see it, say "m"!</p><p class="not">Iqlāb also happens inside a word: <span class="ar">لَيُنۢبَذَنَّ</span> → "layumbadhanna".</p>`]
      ],
      ornek: [['mim-bayni', 'Nūn + ب: small mīm.'], ['mam-baʿathanā', 'Nūn + ب.'], ['layumbadhanna', 'Nūn + ب inside a word.'], ['alīmum-bimā', 'Tanwīn + ب.'], ['muḥīṭum-bil-kāfirīn', 'Tanwīn + ب.'], ['shahīdam-baynī', 'Tanwīn + ب.'], ['wa yuʾmim-billāhi', 'Nūn + ب.']],
      sorular: [
        ['What is the letter of iqlāb?', 'ب', ['م', 'ن', 'ل']],
        ['In iqlāb, what does the nūn turn into?', 'Mīm (م)', ['Lām (ل)', 'Yāʾ (ي)', 'Nothing']],
        ['Which sign shows iqlāb in the Madani muṣḥaf?', 'Small mīm (ۢ)', ['Shaddah', 'Sukūn', 'Wavy madd']],
        ['Which one has iqlāb?', 'مِنۢ بَيۡنِ', ['مِن رَّبِّهِمۡ', 'مِنۡ عَلَقٍ', 'مَن يَقُولُ']],
        ['True or false? Iqlāb can also happen inside a word.', 'True', ['False']]
      ]
    },
    u11: {
      ad: 'Ikhfāʾ',
      sayfalar: [
        ['Hide and seek', `<p>If one of the <b>15 letters other than</b> the iẓhār, idghām and iqlāb letters comes after a silent nūn or tanwīn, the nūn is <b>hidden</b>. It is neither fully clear nor fully merged; it is in between and read <b>through the nose</b>.</p><p class="ar buyuk">ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك</p><p>The easy way: 6 iẓhār + 6 idghām + 1 iqlāb = 13 letters. All 15 remaining letters are ikhfāʾ.</p>`],
        ['How is it read?', `<p>The tongue does not fully touch the palate for the nūn. The sound comes from the nose while preparing for the next letter.</p><p><span class="ar">أَنتُمۡ</span> → "an(n)tum": the nūn is held lightly in the nose.</p><p><span class="ar">يُنفِقُونَ</span> → "yun(n)fiqūn".</p><p class="not">In the Madani muṣḥaf, with ikhfāʾ no sukūn is written on the nūn, the tanwīn is staggered (<span class="ar">ٞ ٗ ٖ</span>) and the next letter has no shaddah.</p>`]
      ],
      ornek: [['an(n)tum', 'Nūn + ت (inside a word).'], ['yun(n)fiqūn', 'Nūn + ف.'], ['an(n)zalnāhu', 'Nūn + ز.'], ['ʿin(n)da', 'Nūn + د.'], ['ʿan(n)ka', 'Nūn + ك.'], ['man(n) thaqulat', 'Nūn + ث.'], ['ʿadnin(n) tajrī', 'Tanwīn + ت.'], ['nāṣiyatin(n) kādhibah', 'Tanwīn + ك.'], ['shayʾin(n) qadīr', 'Tanwīn + ق.']],
      sorular: [
        ['How many ikhfāʾ letters are there?', '15', ['6', '4', '28']],
        ['How is the nūn read in ikhfāʾ?', 'Hidden, lightly through the nose', ['Completely clear', 'Fully merged, without ghunnah', 'It turns into M']],
        ['Which one is an ikhfāʾ letter?', 'ت', ['ع', 'ي', 'ب']],
        ['Which one has ikhfāʾ?', 'أَنتُمۡ', ['مِنۡهُ', 'مِن رَّبِّهِمۡ', 'مِنۢ بَعۡدِ']],
        ['What is the easy way to find the ikhfāʾ letters?', 'The letters left over after iẓhār, idghām and iqlāb', ['Only the dotted letters', 'The throat letters', 'The lip letters']]
      ]
    },
    u12: {
      ad: 'Mīm sākinah',
      sayfalar: [
        ['The 3 states of mīm', `<p>Look at the letter after a silent mīm (<span class="ar">مۡ</span>):</p><ol><li><span class="ar">ب</span> → <b>Ikhfāʾ shafawī</b>: lips lightly closed, through the nose. <span class="ar">تَرۡمِيهِم بِحِجَارَةٖ</span></li><li><span class="ar">م</span> → <b>Idghām mithlayn</b>: the two mīms merge, through the nose. <span class="ar">أَطۡعَمَهُم مِّن</span></li><li><b>Other letters</b> → <b>Iẓhār shafawī</b>: the mīm is read clearly. <span class="ar">لَكُمۡ دِينُكُمۡ</span></li></ol><p>"Shafawī" means related to the lips.</p>`],
        ['Careful: و and ف', `<p>Be careful when <span class="ar">و</span> or <span class="ar">ف</span> comes after a silent mīm. Their articulation is close to the mīm, so the mīm tends to get hidden. Say the mīm <b>clearly and distinctly</b> (iẓhār shafawī).</p><p><span class="ar">هُمۡ فِيهَا</span> → "hum fīhā", with a clear "m".</p>`]
      ],
      ornek: [['tarmīhim(m) biḥijāratin', 'Mīm + ب.'], ['rabbahum(m) bihim', 'Mīm + ب.'], ['hum(m) bimuʾminīn', 'Mīm + ب.'], ['aṭʿamahum-min', 'Mīm + م: mīm with shaddah.'], ['qulūbihim-maraḍun', 'Mīm + م.'], ['ʿalayhim-muʾṣadah', 'Mīm + م.'], ['lakum dīnukum', 'Mīm + د: clear.'], ['lam yalid', 'Mīm + ي: clear.'], ['alam tara', 'Mīm + ت: clear.'], ['anʿamta', 'Mīm + ت inside a word.']],
      sorular: [
        ['What happens if ب comes after mīm sākinah?', 'Ikhfāʾ shafawī', ['Iẓhār shafawī', 'Iqlāb', 'Qalqalah']],
        ['What happens if م comes after mīm sākinah?', 'Idghām mithlayn', ['Ikhfāʾ shafawī', 'Iẓhār', 'Sakt']],
        ['What does "shafawī" mean?', 'Related to the lips', ['Related to the throat', 'Long', 'Hidden']],
        ['After mīm sākinah, which letters need special care (the mīm must be clear)?', 'و and ف', ['ب and م', 'ء and ه', 'ل and ر']],
        ['Which one has iẓhār shafawī?', 'لَكُمۡ دِينُكُمۡ', ['تَرۡمِيهِم بِحِجَارَةٖ', 'أَطۡعَمَهُم مِّن', 'مِنۢ بَيۡنِ']]
      ]
    },
    u13: {
      ad: 'Ghunnah (nasal sound)',
      sayfalar: [
        ['"mmm" / "nnn" from the nose', `<p>A <span class="ar">نّ</span> or <span class="ar">مّ</span> with shaddah is always read with <b>ghunnah</b>. The sound comes from the nose and is held a little (<b>about 1 alif</b>).</p><p><span class="ar">إِنَّ</span> → "in-na", the nūn is held in the nose.</p><p><span class="ar">ثُمَّ</span> → "thum-ma".</p><p class="not">Try it: hold your nose lightly and say "inna". If the sound stops, you're doing the ghunnah correctly!</p>`]
      ],
      ornek: [['in-na', 'Nūn with shaddah.'], ['an-nās', 'Nūn with shaddah (and a sun-letter lām).'], ['thum-ma', 'Mīm with shaddah.'], ['fa um-muhū', 'Mīm with shaddah.'], ['in-namā', 'Nūn with shaddah.'], ['al-jin-nati', 'Nūn with shaddah.'], ['fa am-mā', 'Mīm with shaddah.']],
      sorular: [
        ['Which letters are read with ghunnah when they have shaddah?', 'ن and م', ['ل and ر', 'ب and ق', 'و and ي']],
        ['How long is a ghunnah held?', 'About 1 alif', ['6 alifs', 'It isn\'t held', 'Until you run out of breath']],
        ['Where does the sound of ghunnah come from?', 'The nose', ['The throat', 'The chest', 'The teeth']],
        ['Which one has ghunnah?', 'إِنَّ', ['قُلۡ', 'قَالَ', 'عَلَقٍ']]
      ]
    },
    x2: { ad: 'Checkpoint 2: Nūn, mīm and ghunnah' },
    u14: {
      ad: 'Idghāms: mithlayn, mutajānisayn, mutaqāribayn',
      sayfalar: [
        ['When letters merge', `<p>When the first letter is <b>silent</b> and the second is <b>voweled</b>, the first merges into the second and they are read like one letter with shaddah. There are three types:</p><ul><li><b>Mithlayn</b> (identical letters): <span class="ar">ٱضۡرِب بِّعَصَاكَ</span> → "iḍrib-biʿaṣāka"</li><li><b>Mutajānisayn</b> (same articulation point, different qualities): <span class="ar">قَد تَّبَيَّنَ</span> → "qat-tabayyana"</li><li><b>Mutaqāribayn</b> (close to each other): <span class="ar">قُل رَّبِّيٓ</span> → "qur-rabbī"</li></ul>`],
        ['Mutajānisayn groups', `<ul><li><span class="ar">ت د ط</span>: <span class="ar">قَد تَّبَيَّنَ</span>, <span class="ar">أَثۡقَلَت دَّعَوَا</span>, <span class="ar">وَقَالَت طَّآئِفَةٞ</span></li><li><span class="ar">ث ذ ظ</span>: <span class="ar">يَلۡهَث ذَّـٰلِكَ</span>, <span class="ar">إِذ ظَّلَمُوٓاْ</span></li><li><span class="ar">ب م</span>: only when ب comes first: <span class="ar">ٱرۡكَب مَّعَنَا</span></li></ul><p class="not">When ت comes after ط, the heaviness (iṭbāq) of the ط is kept: <span class="ar">بَسَطتَ</span>. It is not a full idghām.</p>`],
        ['Mutaqāribayn', `<ul><li><span class="ar">ق → ك</span>: <span class="ar">أَلَمۡ نَخۡلُقكُّم</span> → "nakhlukkum"</li><li><span class="ar">ل → ر</span>: <span class="ar">بَل رَّفَعَهُ</span> → "bar-rafaʿahu", <span class="ar">قُل رَّبِّيٓ</span></li></ul><p class="not">In the Madani muṣḥaf the merging letter has no sukūn and the letter it merges into has a shaddah. This is the visual clue for every idghām.</p>`]
      ],
      ornek: [['iḍrib-biʿaṣāka', 'ب + ب.'], ['rabiḥat-tijāratuhum', 'ت + ت.'], ['qat-tabayyana', 'د → ت.'], ['athqalad-daʿawā', 'ت → د.'], ['wa qālaṭ-ṭāʾifatun', 'ت → ط.'], ['iẓ-ẓalamū', 'ذ → ظ.'], ['yalhadh-dhālika', 'ث → ذ.'], ['irkam-maʿanā', 'ب → م.'], ['nakhlukkum', 'ق → ك.'], ['bar-rafaʿahu', 'ل → ر.'], ['qur-rabbī', 'ل → ر.']],
      sorular: [
        ['What is idghām mithlayn?', 'Two identical letters merging', ['Letters with the same articulation point but different qualities', 'Letters close to each other', 'The nūn turning into mīm']],
        ['Which idghām is \'قَد تَّبَيَّنَ\'?', 'Mutajānisayn', ['Mithlayn', 'Mutaqāribayn', 'With ghunnah']],
        ['Which idghām is \'بَل رَّفَعَهُ\'?', 'Mutaqāribayn', ['Mithlayn', 'Mutajānisayn', 'Iqlāb']],
        ['In which order does idghām happen between ب and م?', 'ب first, then م', ['م first, then ب', 'In both orders', 'Never']],
        ['Which one is a mutajānisayn group?', 'ت د ط', ['ق ك', 'ل ر', 'ء ه']],
        ['What must the first letter be in an idghām?', 'Silent', ['With shaddah', 'With tanwīn', 'Lengthened']]
      ]
    },
    u15: {
      ad: 'Qalqalah',
      sayfalar: [
        ['Bounce it like a ball', `<p>When these five letters are silent, their sound comes out with a slight <b>bounce</b> (echo):</p><p class="ar buyuk">ق ط ب ج د</p><p>To remember: <b>"quṭbu jad"</b> (قُطۡبُ جَدٍّ).</p><p><span class="ar">أَحَدۡ</span> → say "aḥad" with a small echo at the end.</p>`],
        ['Light and strong qalqalah', `<ul><li>Silent <b>in the middle of a word</b>: light qalqalah. <span class="ar">ٱقۡرَأۡ</span>, <span class="ar">يَلِدۡ</span></li><li><b>Where you stop</b> (waqf), the qalqalah is clearer. <span class="ar">ٱلۡفَلَقِ</span> → "al-falaq"</li><li>If you stop on a qalqalah letter with shaddah (<span class="ar">وَتَبَّ</span>), it is the strongest qalqalah.</li></ul><p class="not">Don't add a vowel to the qalqalah letter! Not "aḥada" or "aḥadu" — just a light bounce.</p>`]
      ],
      ornek: [['aḥad', 'When stopping, د becomes silent.'], ['al-falaq', 'When stopping, ق becomes silent.'], ['wa tabb', 'Stopping on ب with shaddah: strong qalqalah.'], ['yalid', 'Silent د at the end of a word.'], ['yūlad', 'Silent د.'], ['iqraʾ', 'Silent ق inside a word.'], ['razaqnāhum', 'Silent ق inside a word.'], ['al-burūj', 'When stopping, ج becomes silent.'], ['ʿalaq', 'When stopping, ق becomes silent.']],
      sorular: [
        ['Which are the qalqalah letters?', 'ق ط ب ج د', ['ء ه ع ح غ خ', 'ي ن م و', 'ل ر']],
        ['When is qalqalah made?', 'When the letter is silent', ['When the letter is voweled', 'When the letter is lengthened', 'Only at the start of an āyah']],
        ['Which phrase helps you remember the qalqalah letters?', 'Quṭbu jad', ['Yanmū', 'Definite lām', 'Alif lām mīm']],
        ['Which one has qalqalah?', 'ٱقۡرَأۡ', ['قَالَ', 'إِنَّ', 'مِنۡهُ']],
        ['True or false? In qalqalah an "e" sound is added to the end of the letter.', 'False', ['True']]
      ]
    },
    u16: {
      ad: 'The definite lām: sun and moon letters',
      sayfalar: [
        ['Sun and moon', `<p>Look at the letter after <span class="ar">ال</span> ("al"):</p><ul><li><b>Moon</b> letter: the lām <b>is read</b> and has a sukūn. <span class="ar">ٱلۡقَمَرِ</span> → "al-qamar"</li><li><b>Sun</b> letter: the lām <b>is not read</b> and the next letter has a shaddah. <span class="ar">ٱلشَّمۡسِ</span> → "ash-shams"</li></ul><p>Each group has 14 letters.</p>`],
        ['The letters', `<p><b>Moon letters (14):</b></p><p class="ar">ء ب ج ح خ ع غ ف ق ك م و ه ي</p><p>Memory phrase: <span class="ar">ٱبۡغِ حَجَّكَ وَخَفۡ عَقِيمَهُ</span> (ibghi ḥajjaka wa khaf ʿaqīmah)</p><p><b>Sun letters (14):</b></p><p class="ar">ت ث د ذ ر ز س ش ص ض ط ظ ل ن</p><p class="not">Easy tip: in the Madani muṣḥaf, if the lām has a <b>sukūn it is a moon letter</b>; if the next letter has a <b>shaddah it is a sun letter</b>.</p>`]
      ],
      ornek: [['wal-qamari', 'ق is a moon letter: the lām is read.'], ['al-falaq', 'ف is a moon letter.'], ['al-qāriʿah', 'ق is a moon letter.'], ['al-mustaqīm', 'م is a moon letter.'], ['al-kitābu', 'ك is a moon letter.'], ['al-ʿālamīn', 'ع is a moon letter.'], ['wash-shamsi', 'ش is a sun letter: the lām is not read.'], ['ar-raḥmāni', 'ر is a sun letter.'], ['ad-dīn', 'د is a sun letter.'], ['aṣ-ṣirāṭa', 'ص is a sun letter.'], ['wat-tīni', 'ت is a sun letter.'], ['aṣ-ṣalāta', 'ص is a sun letter.']],
      sorular: [
        ['How is the definite lām read before a moon letter?', 'The lām is read (al-)', ['The lām is not read', 'The lām is lengthened', 'The lām is read through the nose']],
        ['What happens before a sun letter?', 'The lām is not read and the next letter has shaddah', ['The lām is read clearly', 'The lām is lengthened', 'Qalqalah is made']],
        ['Which one is a moon letter?', 'ق', ['ش', 'ر', 'ن']],
        ['Which one is a sun letter?', 'ن', ['م', 'ب', 'ع']],
        ['How many letters are in each group?', '14', ['7', '15', '28']],
        ['How is \'ٱلنَّاسِ\' read?', 'an-nās', ['al-nās', 'al-an-nās', 'nās (without al)']],
        ['What is the clue for a moon-letter lām in the Madani muṣḥaf?', 'The lām has a sukūn', ['The next letter has shaddah', 'A small mīm', 'A wavy madd']]
      ]
    },
    u17: {
      ad: 'The name of Allah',
      sayfalar: [
        ['Heavy or light?', `<p>The lām in the name "Allah" is read according to the <b>vowel of the letter before it</b>:</p><ul><li>If the letter before has <b>fatḥah</b> or <b>ḍammah</b> → <b>heavy</b> (tafkhīm): <span class="ar">نَصۡرُ ٱللَّهِ</span> "naṣrullāh"</li><li>If the letter before has <b>kasrah</b> → <b>light</b> (tarqīq): <span class="ar">بِسۡمِ ٱللَّهِ</span> "bismillāh"</li><li>If you <b>start with "Allah"</b> (the hamzah has fatḥah) → <b>heavy</b>: <span class="ar">ٱللَّهُ ٱلصَّمَدُ</span></li></ul>`]
      ],
      ornek: [['huwallāhu', 'Fatḥah before it (هُوَ): heavy.'], ['naṣrullāhi', 'Ḍammah before it: heavy.'], ['khatamallāhu', 'Fatḥah before it: heavy.'], ['Allāhuṣ-ṣamad', 'When you start with it: heavy.'], ['bismillāhi', 'Kasrah before it: light.'], ['lillāhi', 'The lām has kasrah: light.'], ['billāhi', 'The bāʾ has kasrah: light.'], ['dīnillāhi', 'Kasrah before it: light.']],
      sorular: [
        ['How is the name of Allah read in \'بِسۡمِ ٱللَّهِ\'?', 'Light', ['Heavy', 'Without lengthening', 'Through the nose']],
        ['If the letter before the name of Allah has ḍammah, how is the lām read?', 'Heavy', ['Light', 'It is not read', 'With qalqalah']],
        ['If you start reading with "Allah", how is the lām read?', 'Heavy', ['Light', 'It is not read', 'It doesn\'t matter']],
        ['In which one is the name of Allah read LIGHT?', 'لِلَّهِ', ['نَصۡرُ ٱللَّهِ', 'هُوَ ٱللَّهُ', 'خَتَمَ ٱللَّهُ']]
      ]
    },
    u18: {
      ad: 'The letter rāʾ: heavy and light',
      sayfalar: [
        ['Voweled rāʾ', `<ul><li><b>Fatḥah</b> or <b>ḍammah</b> → <b>heavy</b>: <span class="ar">رَبِّ</span> "rabbi", <span class="ar">رُزِقُواْ</span></li><li><b>Kasrah</b> → <b>light</b>: <span class="ar">رِجَالٞ</span>, <span class="ar">غَيۡرِ</span> "ghayri"</li></ul>`],
        ['Silent rāʾ (heavy)', `<p>If the rāʾ is silent (or became silent because you stop on it), look <b>before</b> it:</p><ul><li>Fatḥah/ḍammah before it → heavy: <span class="ar">وَٱنۡحَرۡ</span> (when stopping)</li><li>A silent letter before it, and fatḥah/ḍammah before that → heavy: <span class="ar">وَٱلۡعَصۡرِ</span> (when stopping), <span class="ar">خُسۡرٍ</span></li><li>Kasrah before it but a <b>heavy (istiʿlāʾ) letter</b> (<span class="ar">خ ص ض غ ط ق ظ</span>) after it → heavy: <span class="ar">لَبِٱلۡمِرۡصَادِ</span></li><li>An <b>incidental kasrah</b> before it (like hamzat al-waṣl) → heavy: <span class="ar">ٱرۡكَبُواْ</span> "irkabū"</li></ul>`],
        ['Silent rāʾ (light)', `<ul><li>An <b>original kasrah</b> before it and no istiʿlāʾ letter after it → light: <span class="ar">فِرۡعَوۡنَ</span>, <span class="ar">فَكَبِّرۡ</span> (when stopping)</li><li>A silent letter before it, and kasrah before that → light: <span class="ar">حِجۡرٍ</span> (when stopping)</li><li>A silent yāʾ (līn/madd) before it → light: <span class="ar">خَيۡرٌ</span> (when stopping)</li></ul><p class="not">In some words both readings are allowed: <span class="ar">يَسۡرِ</span> (al-Fajr 4), <span class="ar">ٱلۡقِطۡرِ</span>. Learn these by listening to your teacher.</p>`]
      ],
      ornek: [['rabbi', 'Rāʾ with fatḥah: heavy.'], ['kal-farāshi', 'Rāʾ with fatḥah: heavy.'], ['wanḥar', 'Silent when stopping; fatḥah before it: heavy.'], ['wal-ʿaṣr', 'When stopping; silent letter before it, fatḥah before that: heavy.'], ['khusr', 'When stopping; silent letter before it, ḍammah before that: heavy.'], ['labil-mirṣād', 'Kasrah before it but ص after it: heavy.'], ['irkabū', 'Incidental kasrah before it (hamzat al-waṣl): heavy.'], ['al-barqu', 'Silent rāʾ, fatḥah before it: heavy.'], ['ghayri', 'Rāʾ with kasrah: light.'], ['ṣudūri', 'Rāʾ with kasrah: light.'], ['al-ākhiri', 'Rāʾ with kasrah: light.'], ['firʿawna', 'Silent rāʾ, original kasrah before it: light.'], ['fakabbir', 'When stopping; kasrah before it: light.']],
      sorular: [
        ['How is a rāʾ with fatḥah read?', 'Heavy', ['Light', 'It is not read', 'Through the nose']],
        ['How is a rāʾ with kasrah read?', 'Light', ['Heavy', 'Long', 'With qalqalah']],
        ['How is the silent rāʾ in \'فِرۡعَوۡنَ\' read?', 'Light (original kasrah before it)', ['Heavy', 'It is not read', 'Both ways']],
        ['Why is the rāʾ heavy in \'لَبِٱلۡمِرۡصَادِ\'?', 'An istiʿlāʾ letter (ص) comes after it', ['Fatḥah before it', 'The rāʾ has shaddah', 'There is a stop']],
        ['How is the rāʾ read in \'ٱرۡكَبُواْ\'?', 'Heavy (the kasrah before it is incidental)', ['Light', 'It is not read', 'Both ways']],
        ['If a silent yāʾ comes before a silent rāʾ (خَيۡرٌ when stopping), how is the rāʾ read?', 'Light', ['Heavy', 'It is not read', 'It is lengthened']],
        ['Which one is an istiʿlāʾ (heavy) letter?', 'ص', ['ح', 'ع', 'ه']]
      ]
    },
    u19: {
      ad: 'Stopping (waqf), stop signs and sakt',
      sayfalar: [
        ['How to stop', `<p>When you stop at the end of a word:</p><ul><li>Make the last vowel <b>silent</b>: <span class="ar">ٱلۡعَٰلَمِينَ</span> → "al-ʿālamīn"</li><li><b>Fatḥatayn</b> → the tanwīn drops and you lengthen <b>1 alif</b> (madd ʿiwaḍ): <span class="ar">ضَبۡحٗا</span> → "ḍabḥā"</li><li><b>Tāʾ marbūṭah</b> (<span class="ar">ة</span>) → becomes <b>"h"</b>: <span class="ar">ٱلۡقَارِعَةُ</span> → "al-qāriʿah"</li><li>With kasratayn and ḍammatayn the tanwīn drops and the letter is read silent: <span class="ar">أَحَدٌ</span> → "aḥad"</li></ul>`],
        ['Stop signs of the Madani muṣḥaf', `<ul><li><span class="ar">مـ</span> <b>Necessary</b>: you must stop. Continuing may distort the meaning.</li><li><span class="ar">ج</span> <b>Permissible</b>: stopping and continuing are equally fine.</li><li><span class="ar">صلى</span> You may stop, but <b>continuing is better</b>.</li><li><span class="ar">قلى</span> You may continue, but <b>stopping is better</b>.</li><li><span class="ar">∴ ∴</span> <b>Muʿānaqah</b>: stop at one of them, not at both.</li><li><span class="ar">لا</span> Don't stop there. If you have to stop, start again from the previous word.</li></ul>`],
        ['Signs in Turkish muṣḥafs', `<p>Muṣḥafs printed in Turkey use some different signs:</p><ul><li><span class="ar">م</span> necessary: always stop</li><li><span class="ar">ط</span> absolute: stopping is good</li><li><span class="ar">ج</span> permissible: stopping or continuing is fine (stopping is preferred)</li><li><span class="ar">ز</span> mujawwaz: continuing is preferred</li><li><span class="ar">ص</span> murakhkhaṣ: you may stop if you run out of breath</li><li><span class="ar">لا</span> don't stop</li></ul>`],
        ['Sakt', `<p><b>Sakt</b>: cutting the sound very briefly <b>without</b> taking a breath, then continuing. In the Ḥafṣ narration it is done in <b>4 places</b> (small <span class="ar">ۜ</span> sign):</p><ol><li><span class="ar">عِوَجَاۜ</span> (al-Kahf 1)</li><li><span class="ar">مَّرۡقَدِنَاۜ</span> (Yā-Sīn 52)</li><li><span class="ar">مَنۡۜ رَاقٖ</span> (al-Qiyāmah 27)</li><li><span class="ar">بَلۡۜ رَانَ</span> (al-Muṭaffifīn 14)</li></ol><p class="not">In the last two, the sakt prevents the nūn and lām from merging into the following rāʾ (idghām).</p>`]
      ],
      ornek: [['ʿiwajā (sakt) qayyiman', 'al-Kahf 1–2.'], ['marqadinā (sakt) hādhā', 'Yā-Sīn 52.'], ['man (sakt) rāq', 'No idghām.'], ['bal (sakt) rāna', 'No idghām.'], ['yasmaʿūn (stop)', 'Mīm sign: stopping is necessary.'], ['nisāāʾakum', 'Jīm sign: stopping and continuing are both fine.'], ['bil-ākhirati', 'صلى: continuing is better.'], ['qalīl', 'قلى: stopping is better.'], ['lā rayb ∴ fīh ∴', 'Stop either at "rayb" or at "fīh".'], ['ḍabḥā', 'Stopping on fatḥatayn: 1 alif.'], ['al-qāriʿah', 'When stopping, ة becomes "h".']],
      sorular: [
        ['In how many places is there sakt in the Ḥafṣ narration?', '4', ['1', '7', '14']],
        ['What is sakt?', 'Briefly cutting the sound without taking a breath', ['Stopping and taking a breath', 'A long lengthening', 'Reading through the nose']],
        ['What happens when you stop on a word with fatḥatayn?', 'The tanwīn drops and you lengthen 1 alif', ['The tanwīn is read as it is', 'The word is not read', 'An "h" sound is added']],
        ['How is tāʾ marbūṭah (ة) read when you stop on it?', 'Like "h"', ['Like "t"', 'It is not read', 'It is lengthened']],
        ['What does the مـ sign mean in the Madani muṣḥaf?', 'Stopping is necessary', ['Stopping is forbidden', 'Continuing is better', 'Make a sakt']],
        ['What does the صلى sign mean?', 'You may stop, but continuing is better', ['Stopping is necessary', 'Stopping is forbidden', 'Stopping is better']],
        ['What does the قلى sign mean?', 'You may continue, but stopping is better', ['Stopping is forbidden', 'Continuing is better', 'Make a sakt']],
        ['What do you do at the muʿānaqah (∴ ∴) sign?', 'Stop at one of the two', ['Stop at both', 'Stop at neither', 'Make a sakt at both']],
        ['In Turkish muṣḥafs, what does ز (mujawwaz) mean?', 'Continuing is preferred', ['Always stop', 'Stopping is preferred', 'Never stop']],
        ['If you are forced to stop at a \'لا\' sign, what should you do?', 'Start again from the previous word', ['Continue from where you stopped', 'Skip the āyah', 'Make a sakt']]
      ]
    },
    u20: {
      ad: 'Readings specific to Ḥafṣ',
      sayfalar: [
        ['Imālah, ishmām, tas-hīl', `<p>In the Ḥafṣ narration a few words are read in a special way. They are rare but must be known:</p><ul><li><b>Imālah</b> — <span class="ar">مَجۡرٜىٰهَا</span> (Hūd 41): "majrēhā". The "a" tilts towards "e". This is the only place in Ḥafṣ.</li><li><b>Ishmām</b> — <span class="ar">تَأۡمَ۬نَّا</span> (Yūsuf 11): while the nūn is merged, the lips are rounded as for a ḍammah, but no sound is made.</li><li><b>Tas-hīl</b> — <span class="ar">ءَا۬عۡجَمِيّٞ</span> (Fuṣṣilat 44): the second hamzah is softened and read with a sound between hamzah and alif.</li></ul><p class="not">These are learned by ear. Make sure you listen to the examples.</p>`]
      ],
      ornek: [['majrēhā', 'The only imālah in Ḥafṣ.'], ['taʾman(u)nā', 'The lips are rounded, with no sound.'], ['a(ā)ʿjamiyyun', 'The second hamzah is softened.']],
      sorular: [
        ['In which word is imālah made in the Ḥafṣ narration?', 'مَجۡرٜىٰهَا', ['تَأۡمَ۬نَّا', 'ٱلضَّآلِّينَ', 'قَالَ']],
        ['What is ishmām?', 'Rounding the lips for a ḍammah without making a sound', ['Briefly cutting the sound', 'Softening the hamzah', 'Tilting "a" towards "e"']],
        ['What is tas-hīl?', 'Softening the hamzah', ['Lengthening', 'Stopping', 'Reading through the nose']],
        ['What is imālah?', 'Tilting the "a" sound towards "e"', ['Dropping the hamzah', 'Stopping without a breath', 'Turning into mīm']]
      ]
    },
    l1: {
      ad: 'Laḥn: reading mistakes',
      sayfalar: [
        ['What is laḥn?', `<p><b>Laḥn</b> is a mistake made while reading the Qur'an. There are two kinds:</p><ul><li><b>Clear mistake (laḥn jalī):</b> a mistake in the letter itself or its vowel. Anyone who knows Arabic notices it. Even if the meaning isn't changed, <b>avoiding these mistakes is a personal obligation (farḍ ʿayn)</b>.</li><li><b>Hidden mistake (laḥn khafī):</b> a mistake in the tajwīd rules. The letter itself doesn't change and the meaning isn't changed, but an expert notices it. Making these mistakes is considered <b>disliked (makrūh)</b>.</li></ul><p class="not">So reading the letters and vowels correctly comes first; the tajwīd rules beautify it.</p>`],
        ['Examples of clear mistakes', `<ul><li><b>Replacing a letter with another:</b> reading <span class="ar">ض</span> as "z", <span class="ar">ح</span> as "h", <span class="ar">ع</span> like a hamzah. <span class="ar">عَلِيم</span> (All-Knowing) ↔ <span class="ar">أَلِيم</span> (painful)</li><li><b>Changing a vowel:</b> reading <span class="ar">أَنۡعَمۡتَ</span> "anʿamta" (<u>You</u> bestowed) as "anʿamtu" changes it to "<u>I</u> bestowed".</li><li><b>Not reading the shaddah (dropping a letter):</b> reading <span class="ar">إِيَّاكَ</span> "iyyāka" as "iyāka" drops a letter.</li><li><b>Lengthening a short vowel (adding a letter):</b> stretching <span class="ar">قُلۡ هُوَ</span> into "qul hūwa".</li><li><b>Giving a vowel to a silent letter:</b> reading <span class="ar">أَحَدۡ</span> as "aḥada" while making qalqalah.</li><li><b>Reading a voweled letter as silent.</b></li></ul>`],
        ['Examples of hidden mistakes', `<ul><li><b>Not applying</b> ikhfāʾ, iqlāb, iẓhār or idghām, or applying them in the wrong place</li><li><b>Shortening obligatory madds</b> (muttaṣil, lāzim), <b>over-lengthening natural madds</b></li><li><b>Leaving out or exaggerating</b> the ghunnah</li><li><b>Rolling</b> the rāʾ</li><li>Making heavy letters light or light letters heavy (as long as the letter doesn't change)</li><li>Being <b>inconsistent</b> with madd lengths throughout the recitation</li></ul><p class="not">These mistakes don't change the meaning but they reduce the beauty and correctness of the recitation. The rules in the earlier units are there to prevent exactly these.</p>`],
        ['Stopping (waqf) mistakes', `<p>Stopping and starting in the wrong place can also distort the meaning. A well-known example:</p><p class="ar buyuk" style="letter-spacing:0">فَوَيۡلٞ لِّلۡمُصَلِّينَ</p><p>Stopping after "So woe to those who pray!" cuts off the rest of the passage (<span class="ar">ٱلَّذِينَ هُمۡ عَن صَلَاتِهِمۡ سَاهُونَ</span>: "who are heedless of their prayer") and turns the meaning upside down. So it should be read to the end.</p><p class="not">If you run out of breath, stop at a suitable place and start again a few words back if needed.</p>`],
        ['How do I avoid mistakes?', `<ol><li><b>Read to a teacher.</b> Tajwīd is learned by ear and mouth. Someone who listens to you corrects your mistakes best.</li><li><b>Listen first, then read.</b> Listen to the reciter in the examples, then read the same āyah yourself.</li><li><b>Read slowly (taḥqīq).</b> Speed hides mistakes.</li><li><b>Review the makhārij and ṣifāt.</b> Most clear mistakes come from producing a letter from the wrong place.</li><li><b>Record yourself.</b> Listening to your own recitation is the easiest way to spot a mistake.</li></ol>`]
      ],
      sorular: [
        ['What is laḥn?', "A mistake made while reading the Qur'an", ['A tajwīd rule', 'A stop sign', 'A reading speed']],
        ['What is a clear mistake (laḥn jalī)?', 'A clear mistake in the letter itself or its vowel', ['A mistake only in ghunnah', 'A mistake only in madd', 'A mistake that doesn\'t matter at all']],
        ['What is a hidden mistake (laḥn khafī)?', 'A mistake in the tajwīd rules that doesn\'t change the letter', ['Turning a letter into another', 'Changing a vowel', 'Adding a letter']],
        ['What is the ruling on avoiding clear mistakes?', 'Farḍ ʿayn (personal obligation)', ['Sunnah', 'Recommended', 'Optional']],
        ['What is the ruling on making hidden mistakes?', 'Makrūh (disliked)', ['Farḍ', 'Sunnah', 'Permissible']],
        ['Reading إِيَّاكَ without shaddah as "iyāka" is which mistake?', 'Clear mistake (laḥn jalī)', ['Hidden mistake (laḥn khafī)', 'Not a mistake', 'A stopping mistake']],
        ['Why is reading أَنۡعَمۡتَ as "anʿamtu" a serious mistake?', 'Changing the vowel turns "You bestowed" into "I bestowed"', ['It only reduces the beauty', 'The ghunnah is missing', 'The madd is shortened']],
        ['Not making ikhfāʾ is which mistake?', 'Hidden mistake (laḥn khafī)', ['Clear mistake (laḥn jalī)', 'Not a mistake', 'A stopping mistake']],
        ['Reading madd muttaṣil as 1 alif is which mistake?', 'Hidden mistake (laḥn khafī)', ['Clear mistake (laḥn jalī)', 'Not a mistake', 'Replacing a letter']],
        ['Reading ض like "z" is which mistake?', 'Clear mistake (laḥn jalī)', ['Hidden mistake (laḥn khafī)', 'Not a mistake', 'A stopping mistake']],
        ['Why is reading أَحَدۡ as "aḥada" while making qalqalah a mistake?', 'A vowel is added to a silent letter (clear mistake)', ['The ghunnah is missing', 'The madd is too short', 'It isn\'t a mistake']],
        ['Why is it wrong to stop after فَوَيۡلٞ لِّلۡمُصَلِّينَ?', 'Cutting off the rest turns the meaning upside down', ['The madd is too short', 'No qalqalah is made', 'The ghunnah is lost']],
        ['What is the most effective way to avoid mistakes?', 'Reading to a teacher and being corrected', ['Reading fast', 'Only reading the text', 'Never listening']]
      ]
    },
    x3: { ad: 'Checkpoint 3: Idghāms, qalqalah, lām, rāʾ, waqf, laḥn' },
    x4: { ad: 'Grand final: All of tajwīd' }
  };

  const GRUP_AD = { med: 'Madds', nun: 'Nūn sākinah and tanwīn', mim: 'Mīm sākinah', gunne: 'Ghunnah', idgam: 'Idghāms', kalkale: 'Qalqalah', lam: 'Definite lām', lafza: 'The name of Allah', ra: 'Rāʾ', vakf: 'Waqf and sakt', ozel: 'Special readings' };
  const KAYNAK = [
    "Qur'an text: King Fahd Complex (Madani muṣḥaf, Ḥafṣ) — via quranenc.com, quran-json package (CC BY-SA 4.0).",
    'Audio: everyayah.com āyah recordings (al-Husary, al-Minshawi, Abdul Basit, Alafasy, as-Sudais, al-Muaiqly, al-Ghamdi); word audio — Quran.com (audio.qurancdn.com).',
    'Coloured tajwīd: labels generated with the cpfair/quran-tajweed decision trees (CC BY 4.0).',
    'Tajwīd rules: sorularlaislamiyet.com tajwīd summary; papers of the Diyanet Muṣḥaf Review Board; SeekersGuidance on stop signs.',
    'Font: Scheherazade New — SIL International (OFL 1.1).',
    'Accounts and sync: Firebase (Google) — Apache 2.0 licensed SDK.'
  ];

  // ---- Türkçe içeriğin üstüne uygula (yapı ve sıra aynı olmalı)
  if (window.DIL !== 'en' || !window.TC) return;
  const TC = window.TC, hata = [];
  for (const [id, r] of Object.entries(TC.R)) {
    const e = RULES[id]; if (!e) { hata.push('R ' + id); continue; }
    r.ad = e[0]; r.ozet = e[1]; if (r.elif) { if (!e[2]) hata.push('elif ' + id); else r.elif = e[2]; }
  }
  for (const u of TC.U) {
    const e = UNITS[u.id]; if (!e) { hata.push('U ' + u.id); continue; }
    u.ad = e.ad;
    (u.sayfalar || []).forEach((s, i) => { const x = e.sayfalar && e.sayfalar[i]; if (!x) return hata.push(u.id + ' sayfa ' + i); s.t = x[0]; s.h = x[1]; });
    (u.ornek || []).forEach((o, i) => { const x = e.ornek && e.ornek[i]; if (!x) return hata.push(u.id + ' ornek ' + i); o.oku = x[0]; o.n = x[1]; });
    (u.sorular || []).forEach((q, i) => { const x = e.sorular && e.sorular[i]; if (!x || x[2].length !== q.w.length) return hata.push(u.id + ' soru ' + i); q.q = x[0]; q.a = x[1]; q.w = x[2]; });
  }
  TC.GRUP_AD = GRUP_AD; TC.KAYNAK = KAYNAK;
  if (hata.length) console.error('İngilizce içerik eksik:', hata);
  window.TC_EN_HATA = hata;
})();

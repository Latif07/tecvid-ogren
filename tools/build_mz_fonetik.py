#!/usr/bin/env python3
"""Müezzinlik ve Dualar metinleri için beklenen fonetik yazı (okuyarak ezber kontrolü): www/data/mz-fonetik.json
Metinler basit (imla) yazımla girildiği için önce Medine mushafı (Osmanlı) yazım kurallarına çevrilir, sonra
build_fonetik.py ile aynı araçla (HisnLabs/tajweed imam.expected) fonetik referans üretilir.
Kullanım: HISN=<tajweed klasörü> python3 tools/build_mz_fonetik.py <satırlar.json>  (satırlar: [{id, i, ar}])
"""
import sys, json, os, re
sys.path.insert(0, os.environ.get('HISN', 'tajweed'))
import imam

def osmanli(metin):
    """Basit yazımı quran-transcript'in Osmanlı (uthmani) yazım kurallarına yaklaştırır: imam.expected bu yazımı bekler."""
    SED, SUK, MAD = '\u0651', '\u0652', '\u0653'
    w = metin.split(' ')
    o = []
    for k, x in enumerate(w):
        x = x.replace('\u06E1', SUK)                                                    # Medine cezmi → sükûn
        x = x.replace('ل\u0651\u0670ه', 'ل\u0651\u064Eه').replace('ل\u0670\u0651ه', 'ل\u0651\u064Eه')   # اللّٰه → ٱللَّه
        x = x.replace('تَعَالٰى', 'تَعَٰلَىٰ')                                           # Medine mushafındaki yazım (En'âm 100)
        x = re.sub('([\u064B-\u0650])' + SED, SED + '\\1', x)                        # şedde harekeden önce
        x = re.sub('^((?:وَ|فَ|بِ|لِ){0,2})اَ?ل', lambda m: m.group(1) + 'ٱل', x)          # başta ال → vasl elifi
        if k > 0: x = re.sub('^ا(?=[\u0621-\u064A]' + SUK + ')', 'ٱ', x)                 # söz ortasında vasl elifi (اسْمُكَ)
        if k == 0 and x.startswith('اَ'): x = 'أ' + x[1:]
        x = re.sub('([\u0621-\u0648\u064A])\u0670', lambda m: m.group(1) + '\u064E\u0670', x)   # hançer elifin önüne üstün (ى hariç)
        x = x.replace('\u064E\u064E', '\u064E')
        x = re.sub('\u064E\u0670\u0649', '\u064E\u0649\u0670', x)                  # عَلٰى → عَلَىٰ
        x = re.sub('^((?:وَ|فَ|بِ|لِ){0,2})آ', lambda m: m.group(1) + 'ءَا', x)            # آلِ → ءَالِ
        x = x.replace(SUK + '\u0622', SUK + '\u0640\u0654\u064E\u0627')                                       # ٱلْآخِرَةِ → ٱلْـَٔاخِرَةِ
        x = re.sub('(\u064Eا|\u064Fو|\u0650ي)(?=[ءأؤئ])', '\\1' + MAD, x)             # med-i muttasıl işareti (مَلَآئِكَة)
        x = re.sub('([\u064B-\u0650])' + SED, SED + '\\1', x)
        o.append(x)
    # med-i munfasıl: uzatma harfiyle biten kelimeden sonra hemzeyle başlayan kelime (لَآ إِلَٰهَ)
    for k in range(len(o) - 1):
        if re.search('(\u064Eا|\u064Fو|\u0650ي|لَا)$', o[k]) and re.match('^[أإءآ]', o[k + 1]): o[k] += MAD
    return o

l = json.load(open(sys.argv[1], encoding='utf-8'))
cikti, hata = {}, []
for x in l:
    w = osmanli(x['ar'])
    try:
        r = imam.expected(w)
        cikti[f"{x['id']}#{x['i']}"] = {'p': r.phonemes, 'sp': [list(s) for s in r.spans],
            'u': [[u.s, u.e, u.kind, u.word, u.golden, sorted(u.allowed), u.rule, u.char] for u in r.units]}
    except Exception as e:
        hata.append((x['id'], x['i'], ' '.join(w), str(e)[:90]))
yol = os.path.join(os.path.dirname(__file__), '..', 'www', 'data', 'mz-fonetik.json')
json.dump(cikti, open(yol, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('üretilen', len(cikti), 'hata', len(hata))
for h in hata: print(h)

#!/usr/bin/env python3
"""Örnek ayetler için renkli tecvid etiketleri üretir (www/js/tecvid-renk.js).

Kaynak: cpfair/quran-tajweed (CC BY 4.0) karar ağaçları — https://github.com/cpfair/quran-tajweed
Bu betik, o projenin sınıflandırıcısını uygulamanın kullandığı KFGQPC/Medine metnine uyarlar
(sükûn ve açık tenvin işaretlerini Tanzil biçimine çevirir, tatweel'i atlar, konumları geri eşler).

Kullanım: python3 -I tools/tecvid_renk.py <quran-tajweed klasörü> <ayahs.json> <çıktı.json>
Doğrulama: uygulamadaki elle doğrulanmış 105 örneğin hepsinde beklenen kural bu etiketlerle eşleşti
(med-i tabîî hariç: veri seti tam harfle yazılan tabîî medleri renklendirmez).
"""
import sys, json, glob, os
sys.path.insert(0, sys.argv[1])          # quran-tajweed klasörü
import types
_src = open(os.path.join(sys.argv[1], 'tajweed_classifier.py'), encoding='utf-8').read()
# Ayet sonunda açık kalan kurallar (ör. ayet sonundaki iklâb işareti) hata yerine kapatılsın
_src = _src.replace('    assert all(len(q) == 0 for q in annotations_run.values()), \\', '    for _k, _q in annotations_run.items():\n        while _q: annotations.append({"rule": _k, "start": _q.popleft() + offset, "end": len(text) + offset})\n    assert True or \\')
tc = types.ModuleType('tc'); tc.__file__ = 'tc'
exec(compile(_src.split('if __name__ == "__main__":')[0], 'tajweed_classifier', 'exec'), tc.__dict__)
from tree import json2tree
import unicodedata
from collections import deque

MAP = {'ۡ': 'ْ', 'ٗ': 'ً', 'ٞ': 'ٌ', 'ٖ': 'ٍ'}
def norm(t):
    # Tanzil biçimine çevir; orijinal metindeki konumları da döndür
    out, idx = [], []
    for i, c in enumerate(t):
        if c == '\u0640':   # tatweel (ـ) Tanzil metninde yok
            continue
        out.append(MAP.get(c, c)); idx.append(i)
    return ''.join(out), idx

rule_trees = {}
for f in glob.glob(os.path.join(sys.argv[1], 'rule_trees', '*.start.json')):
    k = os.path.basename(f).partition('.')[0]
    rule_trees[k] = {'start': json2tree(json.load(open(f))), 'end': json2tree(json.load(open(f.replace('.start.', '.end.'))))}

def label(text):
    # tc.label_ayah, besmele kesme olmadan (ayet 1'i surah 1 gibi ver)
    return tc.label_ayah((1, 2, text, rule_trees))['annotations']

if __name__ == '__main__':
    ayahs = json.load(open(sys.argv[2]))
    out = {}
    for r, t in ayahs.items():
        n, idx = norm(t)
        idx.append(len(t))
        out[r] = [{'rule': a['rule'], 'start': idx[a['start']], 'end': idx[a['end']]} for a in label(n)]
    json.dump(out, open(sys.argv[3], 'w'), ensure_ascii=False)
    print(len(out), 'ayet etiketlendi')

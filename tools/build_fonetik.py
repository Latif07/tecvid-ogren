#!/usr/bin/env python3
"""Okuma raporu için her ayetin beklenen fonetik yazısını üretir: www/kuran/fonetik/NNN.json
Gerekenler: pip install quran-transcript levenshtein ; git clone https://github.com/HisnLabs/tajweed (imam.py)
Kullanım: python3 tools/build_fonetik.py <sûreler, ör. 1,2,3 ya da 1-114> <çıktı klasörü>   (HISN=<tajweed klasörü> ortam değişkeni)
"""
import sys, json, time, os
sys.path.insert(0, os.environ.get('HISN', 'tajweed'))
import imam
from quran_transcript import Aya
q = json.load(open(os.environ.get('QURAN_JSON', 'quran.json'), encoding='utf-8'))
sureler = [int(x) for x in sys.argv[1].split(',')] if len(sys.argv) > 1 else range(1, 115)
out_dir = sys.argv[2] if len(sys.argv) > 2 else '/tmp/claude-0/hisn/fon'
os.makedirs(out_dir, exist_ok=True)
t0 = time.time(); fark = 0; hata = []
for n in sureler:
    s = q[n - 1]; d = []
    for v in s['verses']:
        a = v['id']
        try:
            w = Aya(n, a).get().uthmani.split(' ')
            r = imam.expected(w)
            if len(w) != len(v['text'].split(' ')): fark += 1
            d.append({'p': r.phonemes, 'sp': [list(x) for x in r.spans],
                      'u': [[u.s, u.e, u.kind, u.word, u.golden, sorted(u.allowed), u.rule, u.char] for u in r.units]})
        except Exception as e:
            hata.append((n, a, str(e)[:80])); d.append(None)
    json.dump(d, open(f'{out_dir}/{n:03d}.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('süre', round(time.time() - t0, 1), 'kelime sayısı farklı', fark, 'hata', len(hata), hata[:5])

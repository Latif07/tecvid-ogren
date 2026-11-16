"""Diyanet (Türkiye) mushaf yazımını Medine metninin kelime sırasına eşler.
Girdi: alperenugus/kuran (Diyanet mushaf metni, CC BY 4.0; asıl hak Diyanet İşleri Başkanlığı'nda)
Çıktı: www/kuran/tr/NNN.json → {"b": [besmele text, unicode] | null, "a": [[[text, unicode] her Medine kelimesi için], ...]}
Medine kelimesine birden çok Diyanet kelimesi düşebilir (يَا بَن۪ٓي ↔ يَٰبَنِيٓ); iki Medine kelimesi tek Diyanet kelimesine düşerse ikincisi boş kalır.
"""
import json, sys, re
KAYNAK, ROOT = sys.argv[1], sys.argv[2]
def isk(w):
    w = w.replace('ٱ', 'ا').replace('ی', 'ي').replace('ى', 'ي').replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ؤ', 'و').replace('ئ', 'ي').replace('ء', '')
    return ''.join(ch for ch in w if 'ء' <= ch <= 'ي' and ch != 'ا')
def ed(a, b):
    p = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        c = [i]
        for j, y in enumerate(b, 1): c.append(min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (x != y)))
        p = c
    return p[-1]
def esle(M, D):
    n, m = len(M), len(D); INF = 10 ** 9
    if n == m: return [[k] for k in range(n)]
    sm, sd = [isk(x) for x in M], [isk(x) for x in D]
    C = [[INF] * (m + 1) for _ in range(n + 1)]; B = [[None] * (m + 1) for _ in range(n + 1)]; C[0][0] = 0
    for i in range(n + 1):
        for j in range(m + 1):
            if C[i][j] >= INF: continue
            for di, dj in ((1, 1), (1, 2), (1, 3), (2, 1)):
                a, b = i + di, j + dj
                if a > n or b > m: continue
                c = C[i][j] + ed(''.join(sm[i:a]), ''.join(sd[j:b])) + (0.1 if (di, dj) != (1, 1) else 0)
                if c < C[a][b]: C[a][b] = c; B[a][b] = (i, j)
    yol = []; i, j = n, m
    while (i, j) != (0, 0): pi, pj = B[i][j]; yol.append((pi, i, pj, j)); i, j = pi, pj
    out = [None] * n
    for pi, i, pj, j in reversed(yol):
        if i - pi == 1: out[pi] = list(range(pj, j))
        else: out[pi] = list(range(pj, j)); out[pi + 1] = []
    return out
rapor = {'ayet': 0, 'esit': 0, 'eslenen': 0, 'kotu': []}
for s in range(1, 115):
    d = json.load(open(f'{KAYNAK}/by_surah/{s:03}.json')); M = json.load(open(f'{ROOT}/www/kuran/{s:03}.json'))['ayet']
    A = []
    for i, (x, med) in enumerate(zip(d['ayahs'], M)):
        mw, dt, du = med.split(' '), x['text'].split(), x['text_unicode'].split()
        assert len(dt) == len(du), (s, i)
        e = esle(mw, dt); rapor['ayet'] += 1
        if len(mw) == len(dt): rapor['esit'] += 1
        else:
            rapor['eslenen'] += 1
            top = sum(ed(isk(w), isk(''.join(dt[k] for k in g))) for w, g in zip(mw, e))
            if top > 2: rapor['kotu'].append((s, i + 1, top))
        A.append([[' '.join(dt[k] for k in g), ' '.join(du[k] for k in g)] for g in e])
    b = None
    if d.get('besmele'):
        f1 = json.load(open(f'{KAYNAK}/by_surah/001.json'))['ayahs'][0]; b = [f1['text'], f1['text_unicode']]
    json.dump({'b': b, 'a': A}, open(f'{ROOT}/www/kuran/tr/{s:03}.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print({k: (v if k != 'kotu' else len(v)) for k, v in rapor.items()}); print('kötü örnek:', rapor['kotu'][:15])

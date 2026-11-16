"""Ders metinlerindeki Arapça örnekleri (<span class="ar">) gerçek kâri kelime seslerine eşler.
Çıktı: www/js/ses-harita.js  →  window.SES_HARITA = { metin: {metin: [[sure, ayet, kelime], ...]}, harf: {"<ünite>:<harf>": [s, a, k]} }
Kur'an'da geçmeyen örnekler (ezber cümleleri vb.) eşlenmez; sessiz kalır.
"""
import json, re, subprocess, sys
ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
HAREKE = re.compile(r'[ً-ٰٟۖ-ۭـ]')
def iskelet(w):
    w = HAREKE.sub('', w)
    return w.translate(str.maketrans({'ٱ': 'ا', 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ى': 'ي', 'ٰ': ''}))
AYET = {}
for n in range(1, 115):
    k = json.load(open(f'{ROOT}/www/kuran/{n:03}.json'))
    for i, a in enumerate(k['ayet']): AYET[(n, i + 1)] = a.split(' ')
TAM, ISK = {}, {}
for (n, a), ws in AYET.items():
    for wi, w in enumerate(ws):
        TAM.setdefault(w, []).append((n, a, wi)); ISK.setdefault(iskelet(w), []).append((n, a, wi))
U = json.loads(subprocess.check_output(['node', '-e', "global.window={};require('%s/www/js/content.js');process.stdout.write(JSON.stringify(window.TC.U.map(u=>({id:u.id,s:(u.sayfalar||[]).map(p=>p.h),o:(u.ornek||[]).map(e=>e.r)}))))" % ROOT]))
def oncelik(yer, tercih):
    n, a, _ = yer
    return (0 if f'{n}:{a}' in tercih else 1, 0 if n >= 78 else 1, n, a)
def bul(ws, tercih):
    for tablo, f in ((TAM, lambda w: w), (ISK, iskelet)):
        ad = tablo.get(f(ws[0]), [])
        uy = [(n, a, wi) for n, a, wi in ad if all(wi + j < len(AYET[(n, a)]) and f(AYET[(n, a)][wi + j]) == f(ws[j]) for j in range(len(ws)))]
        if uy:
            n, a, wi = min(uy, key=lambda y: oncelik(y, tercih))
            return [[n, a, wi + j + 1] for j in range(len(ws))]
    return None
KELIME = {'ا': ['1:5', 1], 'ء': ['1:5', 1], 'ب': ['1:1', 1], 'ت': ['105:1', 2], 'ث': ['101:6', 3], 'ج': ['106:4', 4], 'ح': ['111:4', 2], 'خ': ['106:4', 7], 'د': ['109:6', 2], 'ذ': ['111:3', 3],
  'ر': ['1:2', 3], 'ز': ['102:2', 2], 'س': ['105:4', 4], 'ش': ['108:3', 2], 'ص': ['1:7', 1], 'ض': ['100:1', 2], 'ط': ['105:3', 3], 'ظ': ['94:3', 3], 'ع': ['1:7', 4], 'غ': ['1:7', 5], 'ف': ['105:1', 4],
  'ق': ['106:1', 2], 'ك': ['105:1', 3], 'ل': ['1:2', 2], 'م': ['1:4', 1], 'ن': ['1:5', 2], 'و': ['1:5', 3], 'ه': ['106:3', 3], 'ي': ['1:4', 2], 'لا': ['109:2', 1]}
harf = {}
for h, (r, w) in KELIME.items(): s, a = map(int, r.split(':')); harf['*:' + h] = [s, a, w, AYET[(s, a)][w - 1]]
# Kalkale: harfin kalkale yapıldığı (sakin) bir kelime, önce 30. cüzden
kalk = {}
for n in list(range(78, 115)) + list(range(1, 78)):
    for i, f in enumerate(json.load(open(f'{ROOT}/www/kuran/fonetik/{n:03}.json'))):
        for u in f['u']:
            if u[2] != 'qalqalah' or u[0] < 1: continue
            L = f['p'][u[0] - 1]
            if L in 'قطبجد' and L not in kalk: kalk[L] = [n, i + 1, u[3] + 1]
for L, v in kalk.items(): harf['u15:' + L] = v + [AYET[(v[0], v[1])][v[2] - 1]]
metin = {}; say = {'kuran': 0, 'harf': 0, 'yok': 0}; yok = []
for u in U:
    for h in u['s']:
        for m in re.finditer(r'<span class="ar">(.*?)</span>', h):
            t = re.sub(r'<[^>]+>', '', m.group(1)).strip()
            ws = [w for w in t.split() if w not in ('·', '→', '↔', '/', '،')]
            if not ws or t in metin: continue
            if all(len(iskelet(w)) <= 2 for w in ws) and len(ws) <= 2: say['harf'] += 1; continue
            r = bul(ws, set(u['o']))
            if r: metin[t] = r; say['kuran'] += 1
            else: say['yok'] += 1; yok.append((u['id'], t))
open(f'{ROOT}/www/js/ses-harita.js', 'w').write('// Otomatik üretildi: tools/ses_harita.py — ders metnindeki Arapça örnek → Kur\'an kelime sesi (audio.qurancdn.com, kelime kelime)\nwindow.SES_HARITA = ' + json.dumps({'metin': metin, 'harf': harf}, ensure_ascii=False, separators=(',', ':')) + ';\n')
print(say, 'kalkale', kalk); print('eslenmeyen:', yok)

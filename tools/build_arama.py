#!/usr/bin/env python3
"""Ayet/kelime arama dizini: www/kuran/arama.json üretir (uygulamada Kur'an > Ayet ara).

Girdi : www/kuran/NNN.json ('ayet' dizisi, Arapça) ve www/kuran/meal/tr/NNN.json (ayet başına meal metni).
Çıktı : {"v": 1, "ar": [[ayet, ...] x 114], "tr": [[ayet, ...] x 114]}  (harekesiz Arapça ve sadeleştirilmiş Türkçe)
Normalleştirme uygulamadaki arama ile AYNI olmalı (www/js/arama.js: aramaAr / aramaTr).
Kullanım: python3 tools/build_arama.py
"""
import json, os, re, unicodedata

KOK = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'www', 'kuran')
HAREKE = re.compile('[ً-ٰٟۖ-ۭـ࣓-ࣿ]')


def ar(s):
    s = HAREKE.sub('', s)
    for a, b in (('ٱ', 'ا'), ('أ', 'ا'), ('إ', 'ا'), ('آ', 'ا'), ('ى', 'ي'), ('ی', 'ي'), ('ک', 'ك'), ('ہ', 'ه')):
        s = s.replace(a, b)
    return re.sub(r'\s+', ' ', s).strip()


def tr(s):
    s = s.lower().replace('i̇', 'i').replace('ı', 'i')
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[’'‘ʿʾ-]", '', s)
    return re.sub(r'\s+', ' ', s).strip()


def yukle(yol):
    with open(yol, encoding='utf8') as f:
        return json.load(f)


AR, TR = [], []
for n in range(1, 115):
    ad = '%03d.json' % n
    d = yukle(os.path.join(KOK, ad))
    ay = d['ayet'] if isinstance(d, dict) else d
    AR.append([ar(x) for x in ay])
    m = yukle(os.path.join(KOK, 'meal', 'tr', ad))
    m = m['ayet'] if isinstance(m, dict) and 'ayet' in m else m
    TR.append([tr(x) for x in m])
    assert len(AR[-1]) == len(TR[-1]), (n, len(AR[-1]), len(TR[-1]))

yol = os.path.join(KOK, 'arama.json')
with open(yol, 'w', encoding='utf8') as f:
    json.dump({'v': 1, 'ar': AR, 'tr': TR}, f, ensure_ascii=False, separators=(',', ':'))
print('yazıldı', yol, os.path.getsize(yol) // 1024, 'KB', sum(len(x) for x in AR), 'ayet')

#!/usr/bin/env python3
"""Uygulama sûreleri (Fâtiha ve Fîl–Nâs) için www/js/sureler.js üretir.
Kullanım: python3 -I tools/build_sureler.py <quran.json> <www/js>
"""
import json, sys, os
q = json.load(open(sys.argv[1], encoding='utf-8'))
TR = {1: 'Fâtiha', 105: 'Fîl', 106: 'Kureyş', 107: 'Mâûn', 108: 'Kevser', 109: 'Kâfirûn', 110: 'Nasr', 111: 'Tebbet', 112: 'İhlâs', 113: 'Felak', 114: 'Nâs'}
EN = {1: 'Al-Fātiḥah', 105: 'Al-Fīl', 106: 'Quraysh', 107: "Al-Māʿūn", 108: 'Al-Kawthar', 109: 'Al-Kāfirūn', 110: 'An-Naṣr', 111: 'Al-Masad', 112: 'Al-Ikhlāṣ', 113: 'Al-Falaq', 114: 'An-Nās'}
out = []
for n in TR:
    s = q[n - 1]
    out.append({'n': n, 'ar': s['name'], 'tr': TR[n], 'en': EN[n], 'ayet': [v['text'] for v in s['verses']]})
besmele = q[0]['verses'][0]['text']
with open(os.path.join(sys.argv[2], 'sureler.js'), 'w', encoding='utf-8') as f:
    f.write('/* Otomatik üretildi: tools/build_sureler.py — Medine mushafı (Hafs) metni, KFGQPC/quranenc (CC BY-SA 4.0) */\n')
    f.write('window.SURELER = ' + json.dumps(out, ensure_ascii=False) + ';\nwindow.BESMELE = ' + json.dumps(besmele, ensure_ascii=False) + ';\n')
# renk etiketleri için birleşik ayet listesi
ay = {}
exec(open(os.path.join(sys.argv[2], 'ayahs.js'), encoding='utf-8').read().split('window.AYAH = ', 1)[1].rstrip().rstrip(';').join(['ay.update(', ')']))
for s in out:
    for i, t in enumerate(s['ayet'], 1): ay[f"{s['n']}:{i}"] = t
json.dump(ay, open(os.path.join(sys.argv[2], '..', '..', 'tools', '.tum_ayetler.json'), 'w', encoding='utf-8'), ensure_ascii=False)
print(len(out), 'sûre,', sum(len(s['ayet']) for s in out), 'ayet;', len(ay), 'ayet renk için')

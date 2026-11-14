#!/usr/bin/env python3
"""Meal dosyaları: www/kuran/meal/{tr,en}/NNN.json
Kaynak: risan/quran-json 3.1.2 içindeki Tanzil çevirileri —
  tr: Diyanet İşleri (tanzil.net/trans/tr.diyanet), en: Saheeh International (tanzil.net/trans/en.sahih).
Tanzil şartı: ticari olmayan kullanım, metin değiştirilmeden, kaynak bağlantısıyla.
Kullanım: python3 -I tools/build_meal.py <quran-json dist klasörü> <www klasörü>
"""
import json, sys, os
for dil, ad in (('tr', 'quran_tr.json'), ('en', 'quran_en.json')):
    q = json.load(open(os.path.join(sys.argv[1], ad), encoding='utf-8'))
    out = os.path.join(sys.argv[2], 'kuran', 'meal', dil); os.makedirs(out, exist_ok=True)
    for s in q:
        json.dump([v['translation'] for v in s['verses']], open(os.path.join(out, f"{s['id']:03d}.json"), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(dil, len(q), 'sûre')

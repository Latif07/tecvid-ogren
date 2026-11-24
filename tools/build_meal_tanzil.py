#!/usr/bin/env python3
"""Yeni meal kaynağı ekle: Tanzil düz metin dosyasını www/kuran/meal/<yol>/NNN.json olarak böler.

Tanzil'den (tanzil.net/trans/) "text format" ile indirilen dosya satırları: sûre|ayet|metin
Kullanım:  python3 -I tools/build_meal_tanzil.py <tanzil-dosyası.txt> <yol> [<www klasörü>]
Örnek:     python3 -I tools/build_meal_tanzil.py tr.yazir.txt tr-yazir www

Sonra www/js/app.js içindeki MEAL_KAYNAK listesine bir satır ekle:
  { id: 'yazir', dil: 'tr', ad: 'Elmalılı Hamdi Yazır', yol: 'tr-yazir', kaynak: 'tanzil.net' }
(sw.js kuran/ klasörünü zaten önbelleğe alır.) Tabloda 27–28: kaynak ve lisansı eklemeden ÖNCE kontrol et.
Tanzil şartı: ticari olmayan kullanım, metin değiştirilmeden, kaynak bağlantısıyla.
Metin doğruluğu için: sûre başına ayet sayısı kontrol edilir; eksik/fazla ayet varsa betik durur.
"""
import json, os, sys

AYET_SAYISI = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6]

def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    kaynak, yol = sys.argv[1], sys.argv[2]
    www = sys.argv[3] if len(sys.argv) > 3 else 'www'
    sureler = {}
    for no, satir in enumerate(open(kaynak, encoding='utf-8'), 1):
        satir = satir.rstrip('\n')
        if not satir.strip() or satir.startswith('#'):
            continue
        parca = satir.split('|', 2)
        if len(parca) != 3 or not parca[0].isdigit() or not parca[1].isdigit():
            sys.exit(f'{no}. satır beklenen biçimde değil (sûre|ayet|metin): {satir[:60]}')
        n, a, metin = int(parca[0]), int(parca[1]), parca[2].strip()
        sureler.setdefault(n, {})[a] = metin
    if sorted(sureler) != list(range(1, 115)):
        sys.exit(f'114 sûre bekleniyordu, {len(sureler)} bulundu')
    cikti = os.path.join(www, 'kuran', 'meal', yol)
    os.makedirs(cikti, exist_ok=True)
    for n in range(1, 115):
        l = sureler[n]
        if sorted(l) != list(range(1, AYET_SAYISI[n - 1] + 1)):
            sys.exit(f'{n}. sûrede ayet sayısı uyuşmuyor: {len(l)} ayet var, {AYET_SAYISI[n - 1]} bekleniyordu')
        if any(not m for m in l.values()):
            sys.exit(f'{n}. sûrede boş meal var')
        json.dump([l[a] for a in range(1, AYET_SAYISI[n - 1] + 1)], open(os.path.join(cikti, f'{n:03d}.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(f'{cikti}: 114 sûre yazıldı')

main()

#!/usr/bin/env python3
"""Bütün Kur'an için sûre sûre veri dosyaları üretir: www/kuran/NNN.json ve www/kuran/index.json.
Her dosyada Medine mushafı (Hafs) metni ve renkli tecvid etiketleri bulunur.

Kullanım: python3 -I tools/build_kuran.py <quran.json> <quran-tajweed klasörü> <www klasörü>
  quran.json:  risan/quran-json (KFGQPC/quranenc metni, CC BY-SA 4.0)
  quran-tajweed: cpfair/quran-tajweed (CC BY 4.0) — renkler tools/tecvid_renk.py ile hesaplanır
"""
import json, sys, os, subprocess, tempfile
q = json.load(open(sys.argv[1], encoding='utf-8'))
TR = ["Fâtiha", "Bakara", "Âl-i İmrân", "Nisâ", "Mâide", "En'âm", "A'râf", "Enfâl", "Tevbe", "Yûnus", "Hûd", "Yûsuf", "Ra'd", "İbrâhîm",
      "Hicr", "Nahl", "İsrâ", "Kehf", "Meryem", "Tâhâ", "Enbiyâ", "Hac", "Mü'minûn", "Nûr", "Furkân", "Şuarâ", "Neml", "Kasas", "Ankebût",
      "Rûm", "Lokmân", "Secde", "Ahzâb", "Sebe'", "Fâtır", "Yâsîn", "Sâffât", "Sâd", "Zümer", "Mü'min", "Fussılet", "Şûrâ", "Zuhruf",
      "Duhân", "Câsiye", "Ahkâf", "Muhammed", "Fetih", "Hucurât", "Kâf", "Zâriyât", "Tûr", "Necm", "Kamer", "Rahmân", "Vâkıa", "Hadîd",
      "Mücâdele", "Haşr", "Mümtehine", "Saf", "Cuma", "Münâfikûn", "Teğâbün", "Talâk", "Tahrîm", "Mülk", "Kalem", "Hâkka", "Meâric",
      "Nûh", "Cin", "Müzzemmil", "Müddessir", "Kıyâmet", "İnsân", "Mürselât", "Nebe'", "Nâziât", "Abese", "Tekvîr", "İnfitâr",
      "Mutaffifîn", "İnşikâk", "Bürûc", "Târık", "A'lâ", "Gâşiye", "Fecr", "Beled", "Şems", "Leyl", "Duhâ", "İnşirâh", "Tîn", "Alak",
      "Kadr", "Beyyine", "Zilzâl", "Âdiyât", "Kâria", "Tekâsür", "Asr", "Hümeze", "Fîl", "Kureyş", "Mâûn", "Kevser", "Kâfirûn", "Nasr",
      "Tebbet", "İhlâs", "Felak", "Nâs"]
assert len(TR) == 114 and len(q) == 114
ayahs = {f"{s['id']}:{v['id']}": v['text'] for s in q for v in s['verses']}
with tempfile.TemporaryDirectory() as d:
    gi, ci = os.path.join(d, 'a.json'), os.path.join(d, 'r.json')
    json.dump(ayahs, open(gi, 'w', encoding='utf-8'), ensure_ascii=False)
    subprocess.run([sys.executable, '-I', os.path.join(os.path.dirname(__file__), 'tecvid_renk.py'), sys.argv[2], gi, ci], check=True)
    renk = json.load(open(ci))
KISA = {'iqlab': 'k', 'qalqalah': 'q', 'ghunnah': 'g', 'idghaam_ghunnah': 'dg', 'idghaam_no_ghunnah': 'db', 'idghaam_mutajanisayn': 'db',
        'idghaam_mutaqaribayn': 'db', 'idghaam_shafawi': 'dg', 'ikhfa': 'h', 'ikhfa_shafawi': 'h', 'hamzat_wasl': 's', 'lam_shamsiyyah': 's',
        'silent': 's', 'madd_2': 'm2', 'madd_246': 'm2', 'madd_muttasil': 'mt', 'madd_munfasil': 'mf', 'madd_6': 'ml'}
out = os.path.join(sys.argv[3], 'kuran'); os.makedirs(out, exist_ok=True)
idx = []
for s in q:
    n = s['id']
    r = {}
    for v in s['verses']:
        et = sorted([a['start'], a['end'], KISA[a['rule']]] for a in renk[f"{n}:{v['id']}"] if a['rule'] in KISA)
        if et: r[v['id']] = et
    json.dump({'n': n, 'ar': s['name'], 'tr': TR[n - 1], 'en': s['transliteration'], 'ayet': [v['text'] for v in s['verses']], 'renk': r},
              open(os.path.join(out, f'{n:03d}.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    idx.append({'n': n, 'ar': s['name'], 'tr': TR[n - 1], 'en': s['transliteration'], 'a': s['total_verses'], 'tip': s['type']})
json.dump(idx, open(os.path.join(out, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(len(idx), 'sûre,', len(ayahs), 'ayet yazıldı')

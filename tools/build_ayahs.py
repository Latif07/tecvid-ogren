#!/usr/bin/env python3
"""content.js'deki örnek ayetleri Kur'an metninden çeker, ayahs.js üretir ve
her örneği otomatik kontrollerden geçirir.
Kullanım: python3 tools/build_ayahs.py <quran.json> <www/js>
"""
import json, re, sys, subprocess, os

quran_path, out_dir = sys.argv[1], sys.argv[2]
Q = json.load(open(quran_path, encoding='utf-8'))
text = lambda s, a: Q[s - 1]['verses'][a - 1]['text']

# content.js'i node ile çalıştırıp veriyi al
node = r"""
global.window = {}; require(process.argv[1]);
const T = window.TC; const out = [];
for (const u of T.U) for (const e of (u.ornek || [])) out.push(Object.assign({unit: u.id}, e));
console.log(JSON.stringify({ex: out, rules: Object.keys(T.R)}));
"""
res = json.loads(subprocess.check_output(['node', '-e', node, os.path.abspath(os.path.join(out_dir, 'content.js'))]))

SH, SUK = 'ّ', 'ۡ'
TANWIN_OPEN = 'ٖٞٗ'   # Medine'de kaydırılmış tenvin işaretleri
TANWIN = 'ًٌٍ' + TANWIN_OPEN
SMALL_MEEM = 'ۭۢ'
IHFA = set('تثجدذزسشصضطظفقك')
IZHAR = set('ءأإؤئهعحغخ')

def strip_marks(w):
    return re.sub(r'[ً-ٰٟۖ-ۭـ۞]', '', w)

def letters(w):
    return strip_marks(w).replace('ٱ', 'ا')

def check(e, words):
    k, span = e['k'], ' '.join(words)
    w1, w2 = words[0], words[-1]
    l2 = letters(w2)
    if k == 'muttasil':
        return 'ٓ' in w1 and re.search('[ءأؤئ]', w1)
    if k == 'munfasil':
        return ('ٓ' in span) and (len(words) == 1 or re.match('[أإ]', letters(w2)))
    if k == 'lazim':
        return 'ٓ' in w1
    if k in ('izhar',):
        if len(words) == 1:
            return 'نۡ' in w1 or 'نْ' in w1
        return l2[0] in IZHAR and (w1.endswith('نۡ') or any(t in w1 for t in 'ًٌٍ'))
    if k == 'idgamMaal':
        return l2[0] in 'ينمو' and not re.search('[نْ]ۡ$', w1)
    if k == 'idgamBila':
        return l2[0] in 'لر' and SH in w2[:4]
    if k == 'iklab':
        return any(m in span for m in SMALL_MEEM)
    if k == 'ihfa':
        return True if len(words) == 1 else l2[0] in IHFA
    if k == 'ihfaSefevi':
        return w1.rstrip('ۖۗۚۛ').endswith('م') and l2[0] == 'ب'
    if k == 'idgamMim':
        return l2[0] == 'م' and SH in w2[:4]
    if k == 'izharSefevi':
        return 'مۡ' in span
    if k == 'gunne':
        return ('نّ' in w1) or ('مّ' in w1) or ('نَّ' in w1) or ('مَّ' in w1) or ('مُّ' in w1)
    if k == 'kalkale':
        return re.search('[قطبجد]', letters(w1)) is not None
    if k == 'kameri':
        return 'ٱلۡ' in w1
    if k == 'semsi':
        return re.search('ٱل.' + SH, w1) is not None or re.search('ٱل.[َ-ِ]?' + SH, w1) is not None
    if k in ('allahKalin', 'allahInce'):
        return 'لله' in letters(span).replace('ا','')
    if k in ('raKalin', 'raInce'):
        return 'ر' in w1
    if k == 'sekte':
        return 'ۜ' in span
    if k == 'vakfLazim':
        return 'ۘ' in w1
    if k == 'vakfCaiz':
        return 'ۚ' in w1
    if k == 'vaslEvla':
        return 'ۖ' in w1
    if k == 'vakfEvla':
        return 'ۗ' in w1
    if k == 'muanaka':
        return span.count('ۛ') == 2
    return True

used, errors = {}, []
for e in res['ex']:
    s, a = map(int, e['r'].split(':'))
    t = text(s, a)
    ws = t.split()
    w = e['w'] if len(e['w']) == 2 else [e['w'][0], e['w'][0]]
    if not (1 <= w[0] <= w[1] <= len(ws)):
        errors.append(f"{e['unit']} {e['r']} kelime aralığı geçersiz {e['w']}")
        continue
    words = ws[w[0] - 1:w[1]]
    if e['k'] not in res['rules']:
        errors.append(f"{e['unit']} {e['r']} bilinmeyen kural {e['k']}")
    if not check(e, words):
        errors.append(f"{e['unit']} {e['r']} [{e['k']}] kontrol başarısız: {' '.join(words)}")
    used[e['r']] = t

with open(os.path.join(out_dir, 'ayahs.js'), 'w', encoding='utf-8') as f:
    f.write('/* Otomatik üretildi: tools/build_ayahs.py — Medine mushafı (Hafs) metni, KFGQPC/quranenc (CC BY-SA 4.0) */\n')
    f.write('window.AYAH = ' + json.dumps(used, ensure_ascii=False, indent=0) + ';\n')

print(f"{len(res['ex'])} örnek, {len(used)} ayet yazıldı.")
for x in errors:
    print('HATA:', x)
sys.exit(1 if errors else 0)

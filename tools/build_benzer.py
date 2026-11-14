#!/usr/bin/env python3
"""Benzer (müteşâbih) ayetleri metinden otomatik bulur: www/kuran/benzer.json
Yöntem: harekeler silinip kelimeler karşılaştırılır; benzerlik oranı >= 0.55 ya da en az 6 kelimelik
ortak bir parça (kısa ayetin en az yarısı) varsa iki ayet benzer sayılır. Her ayet için en benzer 5 ayet.
Kullanım: python3 -I tools/build_benzer.py <quran.json> <www klasörü>
"""
import sys
import json, re, difflib, collections, time
q=json.load(open(sys.argv[1], encoding='utf-8'))
H=re.compile('[ً-ٰٟۖ-ۭـ]')
def norm(t):
    t=H.sub('',t); t=re.sub('[ٱأإآ]','ا',t).replace('ى','ي').replace('ۥ','').replace('ۦ','')
    return [w for w in t.split() if w]
A=[]; 
for s in q:
    for v in s['verses']: A.append(((s['id'],v['id']),norm(v['text'])))
idx=collections.defaultdict(set)
for i,(r,w) in enumerate(A):
    for j in range(len(w)-2): idx[tuple(w[j:j+3])].add(i)
cand=collections.Counter()
t0=time.time()
for k,v in idx.items():
    if len(v)>60: continue   # çok yaygın kalıplar (ör. besmele parçaları) aday üretmesin
    v=sorted(v)
    for a in range(len(v)):
        for b in range(a+1,len(v)): cand[(v[a],v[b])]+=1
print('aday',len(cand),time.time()-t0)
sonuc=collections.defaultdict(list)
for (i,j),c in cand.items():
    if c<2: continue
    wi,wj=A[i][1],A[j][1]
    if min(len(wi),len(wj))<4: continue
    sm=difflib.SequenceMatcher(None,wi,wj,autojunk=False); r=sm.ratio()
    uzun=sm.find_longest_match(0,len(wi),0,len(wj)).size
    if r>=0.55 or (uzun>=6 and uzun>=0.5*min(len(wi),len(wj))):
        sonuc[i].append((round(r,2),j)); sonuc[j].append((round(r,2),i))
print('benzer ayetli', len(sonuc), 'çift', sum(len(v) for v in sonuc.values())//2)
json.dump({f'{A[i][0][0]}:{A[i][0][1]}':[[A[j][0][0],A[j][0][1],r] for r,j in sorted(v,reverse=True)[:5]] for i,v in sonuc.items()},open(sys.argv[2] + '/kuran/benzer.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))

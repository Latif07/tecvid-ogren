"""Gerçek Android WebView'de uygulamayı dener (GitHub Actions emülatöründe).
Uygulamaya Chrome DevTools ile bağlanır; dokunuşları adb ile gerçek parmak gibi yapar, her adımda ekran görüntüsü alır."""
import subprocess, time, json, os, sys
from playwright.sync_api import sync_playwright
OUT = 'tools/android-test/cikti'; os.makedirs(OUT, exist_ok=True)
log = []
def adb(*a):
    try: return subprocess.run(['adb', *a], capture_output=True, text=True, timeout=30).stdout.strip()
    except Exception as e: return 'HATA ' + str(e)
def ekran(ad):
    try: subprocess.run(f'adb exec-out screencap -p > {OUT}/{ad}.png', shell=True, timeout=30)
    except Exception: pass
    log.append('📸 ' + ad)
def yaz(*a): s = ' '.join(str(x) for x in a); print(s, flush=True); log.append(s)

pid = adb('shell', 'pidof', 'com.latif07.tecvidogren'); yaz('pid', pid)
soket = [l.split()[-1].lstrip('@') for l in adb('shell', 'cat', '/proc/net/unix').splitlines() if 'devtools_remote' in l]
yaz('devtools soketleri', soket)
hedef = next((x for x in soket if x.endswith(pid)), soket[0] if soket else f'webview_devtools_remote_{pid}')
adb('forward', 'tcp:9222', f'localabstract:{hedef}')
ekran('00_acilis')
with sync_playwright() as p:
    b = p.chromium.connect_over_cdp('http://127.0.0.1:9222', timeout=30000)
    pg = b.contexts[0].pages[0]
    hatalar = []
    pg.on('console', lambda m: hatalar.append(f'{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: hatalar.append('JS: ' + str(e)))
    time.sleep(4)
    bilgi = pg.evaluate("""(() => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom)'; document.body.appendChild(d);
      const cs = getComputedStyle(d); const r = { dpr: devicePixelRatio, w: innerWidth, h: innerHeight, ust: cs.paddingTop, alt: cs.paddingBottom, ua: navigator.userAgent }; d.remove(); return r; })()""")
    yaz('ekran', json.dumps(bilgi))
    boyut = adb('shell', 'wm', 'size'); yaz('wm', boyut)
    def dokun(sel, ad):
        r = pg.evaluate(f"(() => {{ const e = document.querySelector({json.dumps(sel)}); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; }})()")
        if not r: yaz('BULUNAMADI', sel); return False
        x, y = int(r[0] * bilgi['dpr']), int(r[1] * bilgi['dpr'])
        # WebView ekranın tepesinden mi başlıyor? (kenardan kenara düzen)
        yaz('dokun', ad, sel, (x, y)); adb('shell', 'input', 'tap', str(x), str(y)); time.sleep(2.5); ekran(ad); return True
    def bekle(sel, sn=15):
        t0 = time.time()
        while time.time() - t0 < sn:
            if pg.evaluate(f"!!document.querySelector({json.dumps(sel)})"): return round(time.time() - t0, 1)
            time.sleep(0.3)
        return None
    yaz('alt menü', bekle('.alt-menu'))
    ekran('01_ana')
    dokun('[data-sekme-git="sureler"]', '02_kuran_sekmesi')
    yaz('sûre listesi geldi mi', bekle('#tumSureler [data-ara]'), pg.evaluate("document.querySelectorAll('#tumSureler [data-ara]').length"))
    yaz('ekran adı', pg.evaluate("document.querySelector('.ust h1') && document.querySelector('.ust h1').textContent"))
    dokun('[data-git="sure|1"]', '03_fatiha')
    yaz('fatiha açıldı mı', bekle('.ayet-kart'), pg.evaluate("document.querySelector('.ust h1') && document.querySelector('.ust h1').textContent"))
    time.sleep(3); ekran('04_fatiha_3sn')
    dokun('.ust .geri', '05_geri')
    pg.evaluate("document.querySelector('#tumSureler [data-git=\"sure|2\"]').scrollIntoView({block:'center'})"); time.sleep(1)
    dokun('#tumSureler [data-git="sure|2"]', '06_bakara')
    yaz('bakara açıldı mı', bekle('.ayet-kart', 30), pg.evaluate("document.querySelectorAll('.ayet-kart').length"))
    time.sleep(4); ekran('07_bakara_4sn')
    # sayfa kaydırma ve dinle düğmesi
    dokun('[data-ayet-cal="1"]', '08_dinle')
    dokun('[data-sekme-git="ezber"]', '09_ezber') or (pg.evaluate("__TECVID.ana()"), time.sleep(1))
    pg.evaluate("__TECVID.ana()"); time.sleep(1.5); ekran('10_ana_tekrar')
    for s in ['ezber', 'testler', 'profil', 'sureler', 'ana']:
        dokun(f'[data-sekme-git="{s}"]', f'11_sekme_{s}')
        yaz('sekme', s, '→', pg.evaluate("document.querySelector('.ust h1') && document.querySelector('.ust h1').textContent"))
    yaz('KONSOL/JS HATALARI', json.dumps(hatalar[:30], ensure_ascii=False))
open(f'{OUT}/rapor.txt', 'w').write('\n'.join(log))
print('\n'.join(log))

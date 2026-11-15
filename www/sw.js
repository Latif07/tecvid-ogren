/* Tecvid Öğren — web sürümü (iPhone / tarayıcı) için çevrimdışı önbellek.
 * Uygulama dosyaları önce ağdan, ağ yoksa önbellekten gelir; sûre dosyaları açıldıkça önbelleğe girer. */
const SURUM = 'tecvid-SURUM_YER';
const KABUK = ['./', 'index.html', 'manifest.webmanifest', 'css/app.css', 'js/capacitor.js', 'js/dil.js', 'js/content.js', 'js/content-en.js', 'js/ayahs.js',
  'js/tecvid-renk.js', 'js/sureler.js', 'js/okunus.js', 'js/mushaf.js', 'kuran/benzer.json', 'js/mujde.js', 'js/sozluk.js', 'js/muezzin.js', 'js/cocuk.js', 'js/app.js', 'js/bulut.js', 'js/firebase-config.js', 'js/firebase/firebase-app.js',
  'js/firebase/firebase-auth.js', 'js/firebase/firebase-firestore.js', 'fonts/scheherazade-new-arabic-400-normal.woff2',
  'fonts/scheherazade-new-arabic-700-normal.woff2', 'kuran/index.json', 'icons/icon-192.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(SURUM).then(c => c.addAll(KABUK)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== SURUM).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;   // sesler ve Firebase doğrudan ağdan
  const surekli = /\/(kuran|fonts|icons|model|ort)\//.test(u.pathname);              // değişmeyen dosyalar: önce önbellek
  e.respondWith((async () => {
    const c = await caches.open(SURUM);
    if (surekli) { const v = await c.match(e.request); if (v) return v; }
    try {
      const r = await fetch(e.request);
      if (r.ok) c.put(e.request, r.clone());
      return r;
    } catch (x) {
      const v = await c.match(e.request, { ignoreSearch: true }) || (e.request.mode === 'navigate' ? await c.match('index.html') : null);
      if (v) return v; throw x;
    }
  })());
});

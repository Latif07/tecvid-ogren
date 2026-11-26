/* Dil seçimi ve arayüz çevirileri. Önce yüklenir: window.DIL ve window.t() tanımlar. */
(function () {
  var dil = 'tr';
  // Varsayılan dil Türkçe; İngilizce yalnızca Ayarlar'dan seçilince
  try { dil = localStorage.getItem('tecvid-ogren.dil') || 'tr'; } catch (e) { }
  if (dil !== 'en') dil = 'tr';
  window.DIL = dil;
  // Telefondaki uygulamada (Capacitor) eklentiye eriş; tarayıcıda null döner. Aynı eklenti bir kez kaydedilir.
  var EKLENTI = {};
  window.capEklenti = function (ad) {
    var C = window.Capacitor; if (!C || !C.isNativePlatform || !C.isNativePlatform()) return null;
    if (EKLENTI[ad]) return EKLENTI[ad];
    try { EKLENTI[ad] = typeof C.registerPlugin === 'function' ? C.registerPlugin(ad) : (C.Plugins && C.Plugins[ad]) || null; } catch (e) { EKLENTI[ad] = null; }
    return EKLENTI[ad];
  };
  // Hata kaydı: telefondaki sorunları görebilmek için son 30 hata saklanır (Ayarlar → Hata kaydı)
  function hataKaydet(m) {
    try { var l = JSON.parse(localStorage.getItem('tecvid-ogren.hatalar') || '[]'); l.push(new Date().toISOString().slice(0, 19) + ' ' + String(m).slice(0, 400)); localStorage.setItem('tecvid-ogren.hatalar', JSON.stringify(l.slice(-30))); } catch (e) { }
  }
  window.addEventListener('error', function (e) { hataKaydet((e.message || 'hata') + ' @' + (e.filename || '').split('/').pop() + ':' + (e.lineno || '')); });
  window.addEventListener('unhandledrejection', function (e) { hataKaydet('promise: ' + (e.reason && (e.reason.stack || e.reason.message) || e.reason)); });
  document.documentElement.lang = dil;
  try { document.documentElement.dataset.tema = localStorage.getItem('tecvid-ogren.tema') || 'sistem'; } catch (e) { }
  try { document.documentElement.dataset.renk = localStorage.getItem('tecvid-ogren.renk') || 'yesil'; } catch (e) { }
  // İngilizce sözlük yalnızca İngilizce seçilince yüklenir (js/dil-en.js); Türkçe kullanıcıya ~140 KB yük binmez
  var EN = {};
  if (dil === 'en') document.write('<script src="js/dil-en.js"><\/script>');
  window.t = function (s) {
    var r = (dil === 'en' && (window.__EN_SOZLUK || EN)[s]) || s;
    for (var i = 1; i < arguments.length; i++) r = r.split('{' + (i - 1) + '}').join(arguments[i]);
    return r;
  };
  if (dil === 'en') document.title = 'Kur\'an Yolum: Learn Tajweed';
})();

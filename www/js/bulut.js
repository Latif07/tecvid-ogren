/* Hüsn-i Kıraat — hesap ve bulut eşitleme (Firebase Auth + Firestore)
 * Uygulama internetsiz çalışır; veriler önce telefona yazılır, internet varken
 * kullanıcının hesabına (users/{uid}) eşitlenir. */
import { initializeApp } from './firebase/firebase-app.js';
import {
  initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail,
  GoogleAuthProvider, signInWithCredential, signOut, signInWithPopup, browserPopupRedirectResolver
} from './firebase/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, query, where, getDocs, serverTimestamp } from './firebase/firebase-firestore.js';
import { FIREBASE_CONFIG } from './firebase-config.js';

const hazir = FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.startsWith('BURAYA');
let auth = null, db = null, kullanici = null;
const dinleyiciler = new Set();
const haberVer = () => dinleyiciler.forEach(f => { try { f(kullanici); } catch (e) { console.error(e); } });

if (hazir) {
  const app = initializeApp(FIREBASE_CONFIG);
  auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
  auth.languageCode = window.DIL === 'en' ? 'en' : 'tr';
  db = getFirestore(app);
  onAuthStateChanged(auth, u => { kullanici = u; haberVer(); });
}

const HATA = {
  'auth/invalid-email': 'E-posta adresi geçersiz.',
  'auth/missing-password': 'Şifre gir.',
  'auth/weak-password': 'Şifre en az 6 karakter olmalı.',
  'auth/email-already-in-use': 'Bu e-posta ile zaten bir hesap var. Giriş yap sekmesini kullan.',
  'auth/invalid-credential': 'E-posta veya şifre hatalı.',
  'auth/wrong-password': 'E-posta veya şifre hatalı.',
  'auth/user-not-found': 'Bu e-posta ile hesap bulunamadı.',
  'auth/too-many-requests': 'Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.',
  'auth/network-request-failed': 'İnternet bağlantısı yok. Bağlanınca tekrar dene.',
};
const HATA_EN = {
  'auth/invalid-email': 'The email address is not valid.',
  'auth/missing-password': 'Enter a password.',
  'auth/weak-password': 'The password must be at least 6 characters.',
  'auth/email-already-in-use': 'An account already exists with this email. Use the Sign in tab.',
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/user-not-found': 'No account found with this email.',
  'auth/too-many-requests': 'Too many attempts. Wait a little and try again.',
  'auth/network-request-failed': 'No internet connection. Try again when you are online.',
};
const EN = window.DIL === 'en';
const yazi = (tr, en) => EN ? en : tr;
const turkce = e => (EN ? HATA_EN : HATA)[e && e.code] || (e && e.message) || yazi('Bilinmeyen hata', 'Unknown error');
function hazirMi() { if (!hazir) throw new Error(yazi('Hesap sistemi henüz yapılandırılmadı.', 'The account system is not configured yet.')); }

window.Bulut = {
  hazir,
  kullanici: () => kullanici,
  dinle(f) { dinleyiciler.add(f); f(kullanici); return () => dinleyiciler.delete(f); },
  async kayit(eposta, sifre) { hazirMi(); try { return (await createUserWithEmailAndPassword(auth, eposta.trim(), sifre)).user; } catch (e) { throw new Error(turkce(e)); } },
  async giris(eposta, sifre) { hazirMi(); try { return (await signInWithEmailAndPassword(auth, eposta.trim(), sifre)).user; } catch (e) { throw new Error(turkce(e)); } },
  async sifreSifirla(eposta) { hazirMi(); try { await sendPasswordResetEmail(auth, eposta.trim()); } catch (e) { throw new Error(turkce(e)); } },
  async googleIle() {
    hazirMi();
    const Cap = window.Capacitor;
    if (!(Cap && Cap.isNativePlatform && Cap.isNativePlatform())) {
      // Web sürümü (iPhone / tarayıcı): Google açılır penceresi
      try { return (await signInWithPopup(auth, new GoogleAuthProvider(), browserPopupRedirectResolver)).user; }
      catch (e) {
        if (/popup-closed|cancelled-popup/.test(e && e.code)) throw new Error(yazi('Google girişi iptal edildi.', 'Google sign-in was cancelled.'));
        if (/popup-blocked/.test(e && e.code)) throw new Error(yazi('Açılır pencere engellendi. Tarayıcı ayarlarından izin ver ya da e-postayla giriş yap.', 'The pop-up was blocked. Allow pop-ups or sign in with email.'));
        if (/unauthorized-domain/.test(e && e.code)) throw new Error(yazi('Google girişi bu adreste henüz açık değil. Şimdilik e-postayla giriş yap.', 'Google sign-in is not enabled on this address yet. Use email for now.'));
        throw new Error(turkce(e));
      }
    }
    const FA = window.capEklenti('FirebaseAuthentication');
    if (!FA) throw new Error(yazi('Google girişi şu an kullanılamıyor.', 'Google sign-in is not available right now.'));
    let sonuc;
    // Önce Android Credential Manager; "[16] Account reauth failed" gibi bir hatada eski Google Sign-In akışıyla bir kez daha denenir
    // (@capacitor-firebase/authentication 7.2+: useCredentialManager seçeneği, varsayılan true)
    try { sonuc = await FA.signInWithGoogle(); }
    catch (e1) {
      if (/cancel/i.test(e1 && e1.message) && !/reauth/i.test(e1 && e1.message)) throw new Error(yazi('Google girişi iptal edildi.', 'Google sign-in was cancelled.'));
      try { sonuc = await FA.signInWithGoogle({ useCredentialManager: false }); }
      catch (e) { throw new Error(/cancel/i.test(e && e.message) ? yazi('Google girişi iptal edildi.', 'Google sign-in was cancelled.') : yazi('Google girişi başarısız: ', 'Google sign-in failed: ') + (e && e.message) + ' (' + (e1 && e1.message) + ')'); }
    }
    const idToken = sonuc && sonuc.credential && sonuc.credential.idToken;
    if (!idToken) throw new Error(yazi('Google girişi tamamlanamadı.', 'Google sign-in could not be completed.'));
    try { return (await signInWithCredential(auth, GoogleAuthProvider.credential(idToken))).user; } catch (e) { throw new Error(turkce(e)); }
  },
  async cikis() {
    if (!auth) return;
    try { const Cap = window.Capacitor; if (Cap && Cap.isNativePlatform && Cap.isNativePlatform()) { const FA = window.capEklenti('FirebaseAuthentication'); if (FA) await FA.signOut(); } } catch (e) { /* yoksay */ }
    await signOut(auth);
  },
  // Profil verisi: ilk profil (p1) users/{uid} belgesinde, diğerleri users/{uid}/profiller/{id} altında
  async indir(pid) {
    if (!kullanici) return null;
    const s = await getDoc(profilDoc(pid));
    return s.exists() ? JSON.parse(s.data().veri || 'null') : null;
  },
  async yukle(veri, pid) {
    if (!kullanici) return;
    const v = { veri: JSON.stringify(veri), guncelleme: serverTimestamp() };
    if (!pid || pid === 'p1') v.eposta = kullanici.email || '';
    await setDoc(profilDoc(pid), v, { merge: true });
  },
  async profilIndir() {
    if (!kullanici) return null;
    const s = await getDoc(doc(db, 'users', kullanici.uid));
    return s.exists() && s.data().profiller ? { liste: JSON.parse(s.data().profiller) } : null;
  },
  async profilYukle(p) {
    if (!kullanici) return;
    await setDoc(doc(db, 'users', kullanici.uid), { profiller: JSON.stringify(p.liste) }, { merge: true });
  },
  async profilSil(pid) {
    if (!kullanici || !pid || pid === 'p1') return;
    await deleteDoc(profilDoc(pid));
  }
};
function profilDoc(pid) { return !pid || pid === 'p1' ? doc(db, 'users', kullanici.uid) : doc(db, 'users', kullanici.uid, 'profiller', pid); }

// ---------------------------------------------------------------- sınıflar (hoca–öğrenci)
// classes/{kod}: { hocaUid, ad, odev?, okuma?: { sayfa, verildi }, olusturma }   classes/{kod}/ogrenciler/{uid}: { ad, ozet, guncelleme }
const KOD_HARF = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const yeniKod = () => Array.from({ length: 6 }, () => KOD_HARF[Math.floor(Math.random() * KOD_HARF.length)]).join('');
function girisGerekli() { hazirMi(); if (!kullanici) throw new Error(yazi('Önce giriş yapmalısın.', 'You need to sign in first.')); }
const agHatasi = e => { const m = String(e && (e.code || e.message) || ''); if (/permission/i.test(m)) return new Error(yazi('Bu işlem için izin yok. Sınıf kodunu kontrol et.', 'Permission denied. Check the class code.')); if (/unavailable|network|offline/i.test(m)) return new Error(yazi('İnternet bağlantısı yok.', 'No internet connection.')); return e instanceof Error ? e : new Error(m); };
Object.assign(window.Bulut, {
  async sinifOlustur(ad) {
    girisGerekli();
    for (let i = 0; i < 5; i++) {
      const kod = yeniKod(); const ref = doc(db, 'classes', kod);
      try { if ((await getDoc(ref)).exists()) continue; } catch (e) { if (!/permission/i.test(String(e.code))) throw agHatasi(e); }
      try { await setDoc(ref, { hocaUid: kullanici.uid, ad: String(ad).slice(0, 60), olusturma: serverTimestamp() }); return kod; } catch (e) { throw agHatasi(e); }
    }
    throw new Error(yazi('Sınıf kodu üretilemedi, tekrar dene.', 'Could not create a class code, try again.'));
  },
  async sinifGetir(kod) {
    girisGerekli();
    try { const s = await getDoc(doc(db, 'classes', kod)); return s.exists() ? Object.assign({ kod }, s.data()) : null; } catch (e) { throw agHatasi(e); }
  },
  async siniflarim() {
    girisGerekli();
    try { const q = await getDocs(query(collection(db, 'classes'), where('hocaUid', '==', kullanici.uid))); return q.docs.map(d => Object.assign({ kod: d.id }, d.data())); } catch (e) { throw agHatasi(e); }
  },
  async sinifaKatil(kod, ad, ozet) {
    girisGerekli();
    const s = await this.sinifGetir(kod); if (!s) throw new Error(yazi('Bu kodla bir sınıf bulunamadı.', 'No class found with this code.'));
    try { await setDoc(doc(db, 'classes', kod, 'ogrenciler', kullanici.uid), { ad: String(ad).slice(0, 60), ozet: ozet || {}, guncelleme: serverTimestamp() }); } catch (e) { throw agHatasi(e); }
    return s;
  },
  async ozetGonder(kod, ad, ozet) {
    if (!kullanici || !kod) return;
    try { await setDoc(doc(db, 'classes', kod, 'ogrenciler', kullanici.uid), { ad: String(ad).slice(0, 60), ozet, guncelleme: serverTimestamp() }); } catch (e) { /* sonra tekrar denenir */ }
  },
  async siniftanAyril(kod) { girisGerekli(); try { await deleteDoc(doc(db, 'classes', kod, 'ogrenciler', kullanici.uid)); } catch (e) { throw agHatasi(e); } },
  async ogrenciler(kod) {
    girisGerekli();
    try { const q = await getDocs(collection(db, 'classes', kod, 'ogrenciler')); return q.docs.map(d => Object.assign({ uid: d.id }, d.data(), { guncelleme: d.data().guncelleme ? d.data().guncelleme.toMillis() : null })); } catch (e) { throw agHatasi(e); }
  },
  async odevVer(kod, odev) { girisGerekli(); try { await updateDoc(doc(db, 'classes', kod), { odev: odev || null }); } catch (e) { throw agHatasi(e); } },
  // Günlük Kur'an okuma ödevi: { sayfa, verildi } ya da null
  async okumaOdevVer(kod, okuma) { girisGerekli(); try { await updateDoc(doc(db, 'classes', kod), { okuma: okuma || null }); } catch (e) { throw agHatasi(e); } },
  async ogrenciCikar(kod, uid) { girisGerekli(); try { await deleteDoc(doc(db, 'classes', kod, 'ogrenciler', uid)); } catch (e) { throw agHatasi(e); } },
  // Ezber dinletme: classes/{kod}/dinletme/{id} = { ogrUid, ad, n, a1, a2, ses (base64), mime, tarih, puan?, not? }
  async dinletGonder(kod, v) {
    girisGerekli();
    try { await addDoc(collection(db, 'classes', kod, 'dinletme'), Object.assign({}, v, { ogrUid: kullanici.uid, tarih: Date.now() })); } catch (e) { throw agHatasi(e); }
  },
  async dinletmelerim(kod) {
    girisGerekli();
    try { const q = await getDocs(query(collection(db, 'classes', kod, 'dinletme'), where('ogrUid', '==', kullanici.uid))); return q.docs.map(d => Object.assign({ id: d.id }, d.data())).sort((a, b) => b.tarih - a.tarih); } catch (e) { throw agHatasi(e); }
  },
  async dinletmeler(kod) {
    girisGerekli();
    try { const q = await getDocs(collection(db, 'classes', kod, 'dinletme')); return q.docs.map(d => Object.assign({ id: d.id }, d.data())).sort((a, b) => b.tarih - a.tarih); } catch (e) { throw agHatasi(e); }
  },
  async dinletmeDegerlendir(kod, id, puan, not) { girisGerekli(); try { await updateDoc(doc(db, 'classes', kod, 'dinletme', id), { puan, not: String(not || '').slice(0, 300) }); } catch (e) { throw agHatasi(e); } },
  async dinletmeSil(kod, id) { girisGerekli(); try { await deleteDoc(doc(db, 'classes', kod, 'dinletme', id)); } catch (e) { throw agHatasi(e); } },
  async sinifSil(kod) { girisGerekli(); try { await deleteDoc(doc(db, 'classes', kod)); } catch (e) { throw agHatasi(e); } }
});
window.dispatchEvent(new Event('bulut-hazir'));

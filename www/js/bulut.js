/* Tecvid Öğren — hesap ve bulut eşitleme (Firebase Auth + Firestore)
 * Uygulama internetsiz çalışır; veriler önce telefona yazılır, internet varken
 * kullanıcının hesabına (users/{uid}) eşitlenir. */
import { initializeApp } from './firebase/firebase-app.js';
import {
  initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail,
  GoogleAuthProvider, signInWithCredential, signOut
} from './firebase/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from './firebase/firebase-firestore.js';
import { FIREBASE_CONFIG } from './firebase-config.js';

const hazir = FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.startsWith('BURAYA');
let auth = null, db = null, kullanici = null;
const dinleyiciler = new Set();
const haberVer = () => dinleyiciler.forEach(f => { try { f(kullanici); } catch (e) { console.error(e); } });

if (hazir) {
  const app = initializeApp(FIREBASE_CONFIG);
  auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
  auth.languageCode = 'tr';
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
const turkce = e => HATA[e && e.code] || (e && e.message) || 'Bilinmeyen hata';
function hazirMi() { if (!hazir) throw new Error('Hesap sistemi henüz yapılandırılmadı.'); }

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
    if (!(Cap && Cap.isNativePlatform && Cap.isNativePlatform())) throw new Error('Google ile giriş telefondaki uygulamada çalışır.');
    const FA = Cap.registerPlugin('FirebaseAuthentication');
    let sonuc;
    try { sonuc = await FA.signInWithGoogle(); }
    catch (e) { throw new Error(/cancel/i.test(e && e.message) ? 'Google girişi iptal edildi.' : 'Google girişi başarısız: ' + (e && e.message)); }
    const idToken = sonuc && sonuc.credential && sonuc.credential.idToken;
    if (!idToken) throw new Error('Google girişi tamamlanamadı.');
    try { return (await signInWithCredential(auth, GoogleAuthProvider.credential(idToken))).user; } catch (e) { throw new Error(turkce(e)); }
  },
  async cikis() {
    if (!auth) return;
    try { const Cap = window.Capacitor; if (Cap && Cap.isNativePlatform && Cap.isNativePlatform()) await Cap.registerPlugin('FirebaseAuthentication').signOut(); } catch (e) { /* yoksay */ }
    await signOut(auth);
  },
  async indir() {
    if (!kullanici) return null;
    const s = await getDoc(doc(db, 'users', kullanici.uid));
    return s.exists() ? JSON.parse(s.data().veri || 'null') : null;
  },
  async yukle(veri) {
    if (!kullanici) return;
    await setDoc(doc(db, 'users', kullanici.uid), { veri: JSON.stringify(veri), guncelleme: serverTimestamp(), eposta: kullanici.email || '' });
  }
};
window.dispatchEvent(new Event('bulut-hazir'));

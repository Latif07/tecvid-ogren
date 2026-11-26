/* Kur'an Yolum — special religious days card on the home page. */
/* app.js bölündü: bu dosyalar sırayla yüklenir, aynı genel kapsamı paylaşır (bkz. TODO.md). */
'use strict';
// Dates follow the Diyanet calendar (2027 chart prepared by the project owner). Add the next year's dates every year.
// "to" is optional (multi-day). Kandil nights are observed on the evening of the listed day.
const SPECIAL_DAYS = [
  { from: '2027-01-04', name: 'Miraç Kandili', note: 'Peygamberimizin (s.a.v.) Miraç gecesi', kind: 'kandil' },
  { from: '2027-01-22', name: 'Berat Kandili', note: 'Af, mağfiret ve kurtuluş gecesi', kind: 'kandil' },
  { from: '2027-02-08', name: 'Ramazan Başlangıcı', note: 'İlk oruç. On bir ayın sultanı başlıyor', kind: 'ramazan' },
  { from: '2027-03-05', name: 'Kadir Gecesi', note: 'Bin aydan hayırlı gece', kind: 'kandil' },
  { from: '2027-03-08', name: 'Arefe', note: 'Ramazan Bayramı\'ndan önceki gün', kind: 'bayram' },
  { from: '2027-03-09', to: '2027-03-11', name: 'Ramazan Bayramı', note: 'Bayramınız mübarek olsun', kind: 'bayram' },
  { from: '2027-05-15', name: 'Arefe', note: 'Kurban Bayramı\'ndan önceki gün', kind: 'bayram' },
  { from: '2027-05-16', to: '2027-05-19', name: 'Kurban Bayramı', note: 'Bayramınız mübarek olsun', kind: 'bayram' },
  { from: '2027-06-06', name: 'Hicri Yılbaşı', note: 'Hicri 1449 yılının başlangıcı', kind: 'gun' },
  { from: '2027-06-15', name: 'Aşure Günü', note: 'Muharrem ayının onuncu günü', kind: 'gun' },
  { from: '2027-08-13', name: 'Mevlid Kandili', note: 'Peygamberimizin (s.a.v.) doğum yıl dönümü', kind: 'kandil' },
  { from: '2027-11-29', name: 'Üç Ayların Başlangıcı', note: 'Recep, Şaban ve Ramazan ayları', kind: 'gun' },
  { from: '2027-12-02', name: 'Regaib Kandili', note: 'Üç ayların ilk cuma gecesi', kind: 'kandil' },
  { from: '2027-12-24', name: 'Miraç Kandili', note: 'Peygamberimizin (s.a.v.) Miraç gecesi', kind: 'kandil' },
];
const SPECIAL_LEAD_DAYS = 3;   // show the card this many days ahead
const localDateKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayDiff = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 864e5);
// Returns { day, daysLeft } for the first special day that is today (daysLeft 0) or within the lead window
function specialDayNow(todayKey = localDateKey(new Date())) {
  for (const day of SPECIAL_DAYS) {
    const left = dayDiff(todayKey, day.from), end = dayDiff(todayKey, day.to || day.from);
    if ((left >= 0 && left <= SPECIAL_LEAD_DAYS) || (left < 0 && end >= 0)) return { day, daysLeft: Math.max(0, left) };
  }
  return null;
}
function homeSpecialDayCard() {
  const hit = specialDayNow(); if (!hit || S.ayar.specialDismissed === hit.day.from + '|' + localDateKey(new Date())) return '';
  const { day, daysLeft } = hit, when = daysLeft === 0 ? (day.kind === 'kandil' ? t('Bu akşam') : t('Bugün')) : t('{0} gün sonra', daysLeft);
  return `<section class="kart special-day-card special-${day.kind}" id="specialDay"><div><small class="soluk">${esc(when)}</small><h2>${esc(t(day.name))}</h2><p class="soluk">${esc(t(day.note))}</p>${day.kind === 'kandil' ? `<small class="soluk">${t('Kandil gecesi, belirtilen günün akşamı idrak edilir.')}</small>` : ''}</div>
    <button class="btn kucuk ikincil" id="specialDayClose" aria-label="${t('Kapat')}">${t('Tamam')}</button></section>`;
}
function homeSpecialDayBind() {
  const b = $('#specialDayClose'); if (!b) return;
  b.onclick = () => { const hit = specialDayNow(); if (hit) { S.ayar.specialDismissed = hit.day.from + '|' + localDateKey(new Date()); kaydet(); } ciz(); };
}

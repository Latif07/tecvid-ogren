/* Kur'an Yolum — child mode guard: parent gate (arithmetic question) before the adult area, and a daily time limit. */
/* app.js bölündü: bu dosyalar sırayla yüklenir, aynı genel kapsamı paylaşır (bkz. TODO.md). */
'use strict';
const PARENT_GATE = { until: 0, a: 0, b: 0 };   // until: timestamp until which the gate stays open
const PARENT_GATE_MINUTES = 5;
const CHILD_LIMITS = [0, 15, 30, 45, 60];       // minutes per day, 0 = unlimited
const parentGateOpen = () => Date.now() < PARENT_GATE.until;
function newParentQuestion() { PARENT_GATE.a = 6 + Math.floor(Math.random() * 4); PARENT_GATE.b = 6 + Math.floor(Math.random() * 4); }
const parentAnswerOk = v => +v === PARENT_GATE.a * PARENT_GATE.b;
// Gate screen: shown instead of the adult area while a child profile is active
EKRAN.parentGate = function () {
  if (!PARENT_GATE.a) newParentQuestion();
  app.innerHTML = `${ust(t('Ebeveyn kontrolü'))}<main class="parent-gate"><section class="kart"><h2>${t('Bu bölüm büyükler için')}</h2>
    <p class="soluk">${t('Devam etmek için işlemin sonucunu yaz.')}</p><p class="parent-q" aria-live="polite">${PARENT_GATE.a} × ${PARENT_GATE.b} = ?</p>
    <input id="pgInput" type="number" inputmode="numeric" autocomplete="off" aria-label="${t('Sonuç')}"><div class="satir sola"><button class="btn" id="pgOk">${t('Devam')}</button></div><p class="hata" id="pgHata" hidden>${t('Olmadı, tekrar dene.')}</p></section></main>`;
  const go = () => { if (parentAnswerOk($('#pgInput').value)) { PARENT_GATE.until = Date.now() + PARENT_GATE_MINUTES * 60000; PARENT_GATE.a = 0; ciz(); } else { $('#pgHata').hidden = false; newParentQuestion(); $('.parent-q').textContent = `${PARENT_GATE.a} × ${PARENT_GATE.b} = ?`; $('#pgInput').value = ''; } };
  $('#pgOk').onclick = go; $('#pgInput').onkeydown = e => { if (e.key === 'Enter') go(); };
};
// Wrap the profile screen: gate for child profiles, plus the daily-limit chooser for the parent
{
  const profileScreen = EKRAN.profil;
  EKRAN.profil = function () {
    if (cocukMu() && !parentGateOpen()) return EKRAN.parentGate();
    const r = profileScreen.apply(this, arguments);
    if (cocukMu()) childLimitSection();
    return r;
  };
}
const childUsedSeconds = () => ((S.cocukSn || {})[bugun()]) || 0;
const childLimitSeconds = () => ((S.ayar.cocukLimit || 0) + (((S.cocukEk || {})[bugun()]) || 0)) * 60;
function childLimitSection() {
  const main = app.querySelector('main'); if (!main) return;
  const cur = S.ayar.cocukLimit || 0;
  main.insertAdjacentHTML('afterbegin', `<section class="kart child-limit"><h3>${t('Çocuk için günlük süre')}</h3><p class="soluk kucukyazi">${t('Bugün kullanılan: {0} dk', Math.round(childUsedSeconds() / 60))}</p>
    <div class="satir sola">${CHILD_LIMITS.map(m => `<button class="cip ${cur === m ? 'aktif' : ''}" data-child-limit="${m}">${m ? t('{0} dk', m) : t('Sınırsız')}</button>`).join('')}</div></section>`);
  main.querySelectorAll('[data-child-limit]').forEach(b => b.onclick = () => { S.ayar.cocukLimit = +b.dataset.childLimit; kaydet(); childLimitCheck(); ciz(); });
}
// Time accounting: counts only while the child profile is active and the page is visible; saved once a minute
let childTickCount = 0;
function childGuardTick() {
  if (!cocukMu() || document.hidden) return;
  S.cocukSn = S.cocukSn || {}; const day = bugun(); S.cocukSn[day] = (S.cocukSn[day] || 0) + 10;
  Object.keys(S.cocukSn).sort().slice(0, -14).forEach(k => delete S.cocukSn[k]);   // keep two weeks
  if (++childTickCount % 6 === 0) kaydet();
  childLimitCheck();
}
function childLimitCheck() {
  const limit = childLimitSeconds(), over = cocukMu() && (S.ayar.cocukLimit || 0) > 0 && childUsedSeconds() >= limit;
  let box = document.getElementById('childLimit');
  if (!over) { if (box) box.remove(); return; }
  if (box) return;
  newParentQuestion(); box = document.createElement('div'); box.id = 'childLimit'; box.className = 'child-limit-overlay'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
  box.innerHTML = `<div class="child-limit-kutu"><div class="child-limit-ikon" aria-hidden="true">🌙</div><h2>${t('Bugünlük yeterli!')}</h2><p>${t('Yarın yine birlikte öğreniriz. Allah razı olsun.')}</p>
    <details class="child-limit-ebeveyn"><summary>${t('Ebeveyn: süreyi uzat')}</summary><p class="parent-q">${PARENT_GATE.a} × ${PARENT_GATE.b} = ?</p><input id="clInput" type="number" inputmode="numeric" aria-label="${t('Sonuç')}"><button class="btn kucuk" id="clOk">${t('10 dakika ekle')}</button></details></div>`;
  document.body.appendChild(box);
  box.querySelector('#clOk').onclick = () => { if (!parentAnswerOk(box.querySelector('#clInput').value)) { newParentQuestion(); box.querySelector('.parent-q').textContent = `${PARENT_GATE.a} × ${PARENT_GATE.b} = ?`; box.querySelector('#clInput').value = ''; return; }
    S.cocukEk = S.cocukEk || {}; S.cocukEk[bugun()] = (S.cocukEk[bugun()] || 0) + 10; kaydet(); box.remove(); };
}
setInterval(childGuardTick, 10000);

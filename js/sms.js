let activeSms = null, smsTimer = null;
const smsName = (id) => (CATALOG.sms.find(s => s.id === id) || {}).name || id;
const SMS_STATUS = { buying: ['Hazırlanıyor', 'wait'], waiting: ['Kod Bekleniyor', 'wait'], received: ['Kod Geldi', 'ok'], cancelled: ['İptal / İade', 'bad'], expired: ['Süre Doldu / İade', 'bad'], refunded: ['İade', 'bad'], failed: ['Başarısız / İade', 'bad'] };

function renderSmsGrid() {
  document.getElementById('smsGrid').innerHTML = CATALOG.sms.map(s => `
    <div class="sms-card"><div class="top">${ic(s.icon)}${esc(s.name)}</div>
    <div class="price">${tl(s.price)}</div>
    <button class="btn btn-gold btn-sm" onclick="buySms('${s.id}')">Numara Al</button></div>`).join('');
}
async function buySms(id) {
  if (!currentUser) { openModal('auth'); switchTab('login'); showToast('Numara almak için giriş yapınız.', 'error'); return; }
  if (activeSms && activeSms.status === 'waiting') { showToast('Zaten aktif bir numaranız var.', 'error'); return; }
  try {
    const d = await api('/api/sms', { method: 'POST', body: { action: 'buy', product: id } });
    activeSms = d.order; renderActiveSms(); startSmsPoll(); refreshUser();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) {
    showToast(e.message, 'error');
    if (/bakiye yetersiz|Yetersiz/i.test(e.message)) location.hash = '#/bakiye';
  }
}
function renderActiveSms() {
  const box = document.getElementById('smsActive'), o = activeSms;
  if (!o) { box.style.display = 'none'; return; }
  const [label, cls] = SMS_STATUS[o.status] || [o.status, ''];
  box.style.display = 'block';
  box.innerHTML = `
    <div class="row"><span class="lbl" style="margin:0">Servis</span><b>${esc(smsName(o.product))}</b><span class="badge ${cls}">${label}</span></div>
    <div class="row"><span class="lbl" style="margin:0">Numara</span><span class="val" id="smsPhone">${esc(o.phone || '-')}</span>
      ${o.phone ? `<button class="btn btn-outline btn-sm" onclick="copyText('smsPhone')">${ic('copy')}Kopyala</button>` : ''}</div>
    <div class="row"><span class="lbl" style="margin:0">SMS Kodu</span>
      ${o.code ? `<span class="val code" id="smsCode">${esc(o.code)}</span><button class="btn btn-outline btn-sm" onclick="copyText('smsCode')">${ic('copy')}Kopyala</button>`
               : (o.status === 'waiting' ? `<span><span class="spinner"></span> Kod bekleniyor...</span>` : '<span class="hint">-</span>')}</div>
    ${o.status === 'waiting' ? `<button class="btn btn-outline btn-block" style="margin-top:12px" onclick="cancelSms()">İptal Et ve İade Al</button>` : ''}`;
}
function startSmsPoll() { stopSmsPoll(); smsTimer = setInterval(pollSms, 5000); }
function stopSmsPoll() { if (smsTimer) clearInterval(smsTimer); smsTimer = null; }
async function pollSms() {
  if (!activeSms) return stopSmsPoll();
  try {
    const d = await api('/api/sms?id=' + activeSms.id);
    const changed = d.order.status !== activeSms.status;
    activeSms = d.order; renderActiveSms();
    if (activeSms.status !== 'waiting') { stopSmsPoll(); if (changed) refreshUser(); if (activeSms.status === 'received') showToast('SMS kodu geldi.'); }
  } catch {}
}
async function cancelSms() {
  try {
    const d = await api('/api/sms', { method: 'POST', body: { action: 'cancel', id: activeSms.id } });
    activeSms = d.order; renderActiveSms(); stopSmsPoll(); refreshUser(); showToast('İptal edildi, bakiyeniz iade edildi.');
  } catch (e) { showToast(e.message, 'error'); }
}
async function resumeSms() {
  if (!currentUser || activeSms) return;
  try {
    const h = await api('/api/history');
    const o = h.sms.find(x => x.status === 'waiting' && (!x.expires_at || new Date(x.expires_at) > new Date()));
    if (o) { activeSms = o; renderActiveSms(); startSmsPoll(); pollSms(); }
  } catch {}
}
function copyText(id) {
  const t = document.getElementById(id).textContent;
  (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => showToast('Kopyalandı')).catch(() => showToast('Kopyalanamadı', 'error'));
}

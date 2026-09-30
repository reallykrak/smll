let selectedAmount = 0, payMethod = 'card';
function selectAmount(a, el) {
  selectedAmount = a;
  document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected')); el.classList.add('selected');
  document.getElementById('customAmount').value = '';
}
function setCustomAmount(v) { selectedAmount = parseFloat(v) || 0; document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected')); }
function selectPay(el) { document.querySelectorAll('.method').forEach(b => b.classList.remove('active')); el.classList.add('active'); payMethod = el.dataset.method; }
function resetPay() {
  document.getElementById('payForm').style.display = 'block';
  const st = document.getElementById('payStage'); st.style.display = 'none'; st.innerHTML = '';
}
async function handleTopup() {
  if (!currentUser) { openModal('auth'); return; }
  if (selectedAmount < 10 || selectedAmount > 10000) { showToast('Tutar ₺10 ile ₺10.000 arasında olmalıdır.', 'error'); return; }
  try {
    const d = await api('/api/deposit', { method: 'POST', body: { method: payMethod, amount: selectedAmount } });
    document.getElementById('payForm').style.display = 'none';
    const st = document.getElementById('payStage'); st.style.display = 'block';
    const back = `<a class="back-link" onclick="resetPay()">${ic('back')}Geri</a>`;
    if (payMethod === 'card') {
      st.innerHTML = back + `<iframe class="pay-frame" src="https://www.paytr.com/odeme/guvenli/${encodeURIComponent(d.token)}" allow="payment"></iframe>`;
    } else {
      st.innerHTML = back + `<div class="iban-box">
        <div><span>Banka</span><b>${esc(d.bank)}</b></div><div><span>Alıcı</span><b>${esc(d.name)}</b></div>
        <div><span>IBAN</span><b id="ibanTxt">${esc(d.iban)}</b></div><div><span>Tutar</span><b>${tl(d.amount)}</b></div>
        <div><span>Açıklama</span><b class="code" id="ibanCode">${esc(d.oid)}</b></div></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <button class="btn btn-outline" onclick="copyText('ibanTxt')">${ic('copy')}IBAN Kopyala</button>
          <button class="btn btn-outline" onclick="copyText('ibanCode')">${ic('copy')}Kodu Kopyala</button></div>
        <p class="iban-note">Açıklama kısmına <b class="gold">yalnızca yukarıdaki kodu</b> yazın ve tutarı aynen gönderin. Ödemeniz kontrol edildikten sonra bakiyenize eklenir. Durumu "Siparişlerim &gt; Bakiye Hareketleri" bölümünden izleyebilirsiniz.</p>`;
    }
  } catch (e) { showToast(e.message, 'error'); }
}
// Kart ödemesi sonrası: bakiye artana kadar bekle (PayTR bildirimi birkaç saniye sürebilir)
async function waitForBalance(before) {
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 3000));
    await refreshUser();
    if (currentUser && currentUser.balance > before) { showToast('Bakiyeniz yüklendi: ' + tl(currentUser.balance)); return; }
  }
  showToast('Ödemeniz işleniyor. Bakiyeniz kısa süre içinde güncellenecek.');
}

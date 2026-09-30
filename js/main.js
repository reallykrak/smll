(async () => {
  if (WHATSAPP) { const a = document.getElementById('waLink'); a.href = 'https://wa.me/' + WHATSAPP; a.style.display = 'block'; }
  if (TELEGRAM) { const a = document.getElementById('tgLink'); a.href = 'https://t.me/' + TELEGRAM; a.style.display = 'block'; }
  await Promise.all([loadMe(), loadCatalog()]);
  renderNav();

  const p = new URLSearchParams(location.search).get('odeme');
  if (p) history.replaceState(null, '', location.pathname + '#/bakiye');
  route();
  if (p === 'ok' && currentUser) { showToast('Ödeme alındı. Bakiyeniz yükleniyor...'); waitForBalance(currentUser.balance); }
  else if (p) showToast('Ödeme tamamlanamadı.', 'error');
})();

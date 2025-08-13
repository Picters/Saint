(function () {
  const btn = document.querySelector('.accordion');
  const panel = document.getElementById('faq-panel');
  if (!btn || !panel) return;
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    if (expanded) {
      panel.classList.remove('open');
      panel.style.maxHeight = panel.scrollHeight + 'px';
      requestAnimationFrame(() => {
        panel.style.maxHeight = '0px';
        setTimeout(() => { panel.hidden = true; }, 420);
      });
    } else {
      panel.hidden = false;
      panel.style.maxHeight = panel.scrollHeight + 'px';
      panel.classList.add('open');
    }
  });
})();



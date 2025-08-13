(function () {
  // Page transition overlay
  const overlay = document.createElement('div');
  overlay.className = 'page-overlay';
  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('hide'));
  });

  function isInternalLink(a) {
    if (!a || !a.href) return false;
    if (a.target && a.target === '_blank') return false;
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
    try {
      const url = new URL(a.href, window.location.href);
      return url.origin === window.location.origin;
    } catch (_) {
      return false;
    }
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    if (!isInternalLink(a)) return;
    e.preventDefault();
    overlay.classList.remove('hide');
    const href = a.getAttribute('href');
    setTimeout(() => { window.location.assign(href); }, 260);
  }, { capture: true });

  window.addEventListener('pageshow', () => {
    overlay.classList.add('hide');
  });

  function addRipple(el) {
    if (!el) return;
    el.style.position = el.style.position || 'relative';
    el.style.overflow = el.style.overflow || 'hidden';
    el.addEventListener('click', function (e) {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      el.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    }, { passive: true });
  }

  const rippleTargets = document.querySelectorAll('.btn, .app-link, .accordion, .back, .reviews');
  rippleTargets.forEach(addRipple);

  const revealSelectors = ['.plan', '.tiers li', '.about-card'];
  const toReveal = [];
  revealSelectors.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => {
      el.classList.add('reveal-up');
      toReveal.push(el);
    });
  });

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          obs.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    toReveal.forEach((el) => io.observe(el));
  } else {
    toReveal.forEach((el) => el.classList.add('is-visible'));
  }
})();



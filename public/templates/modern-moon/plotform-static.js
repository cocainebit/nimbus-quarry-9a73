(() => {
  const siteBase = new URL('.', document.currentScript.src);
  // Search indexes and client components can create extensionless internal URLs.
  // Normalize them to actual exported HTML before framework routers handle a click.
  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link || link.getAttribute('href').startsWith('#')) return;
    const url = new URL(link.href);
    if (url.origin !== siteBase.origin || !url.pathname.startsWith(siteBase.pathname)) return;
    const segment = url.pathname.split('/').filter(Boolean).at(-1) || '';
    if (url.pathname.endsWith('/') || !segment.includes('.')) {
      url.pathname = url.pathname.replace(/\/?$/, '/') + 'index.html';
      link.href = url.href;
    }
  }, true);
  document.addEventListener('submit', (event) => {
    if (event.target.closest('#pagefind-search')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    alert('This template form is not connected. Configure your backend before accepting submissions.');
  }, true);
})();

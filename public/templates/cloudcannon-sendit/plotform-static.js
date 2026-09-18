(() => {
  const note = 'This template form is not connected to a service. Connect your own backend before accepting submissions.';
  const siteBase = new URL('.', document.currentScript.src);
  // Search indexes and client components create extensionless internal URLs.
  // Point them at the exported HTML before anything else handles the click.
  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!link || link.getAttribute('href').startsWith('#')) return;
    const url = new URL(link.href, document.baseURI);
    if (url.origin !== siteBase.origin || !url.pathname.startsWith(siteBase.pathname)) return;
    const segment = url.pathname.split('/').filter(Boolean).at(-1) || '';
    if (url.pathname.endsWith('/') || !segment.includes('.')) {
      url.pathname = url.pathname.replace(/\/?$/, '/') + 'index.html';
      link.href = url.href;
    }
  }, true);
  document.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const form = event.target;
    let status = form.querySelector('[data-plotform-form-note]');
    if (!status) {
      status = document.createElement('p');
      status.setAttribute('data-plotform-form-note', '');
      status.setAttribute('role', 'status');
      form.append(status);
    }
    status.textContent = note;
  }, true);
})();

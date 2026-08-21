(() => {
  if (window.__CRAP_RADIO_PERSIST_READY) return;
  window.__CRAP_RADIO_PERSIST_READY = true;

  const ROUTES = new Set([
    '/',
    '/index.html',
    '/catalogue.html',
    '/mail-order.html',
    '/report.html',
    '/contact.html'
  ]);

  const style = document.createElement('style');
  style.id = 'crap-radio-persist-style';
  style.textContent = `
    .sidebar #crap-radio-player {
      position: static !important;
      inset: auto !important;
      right: auto !important;
      bottom: auto !important;
      margin: 82px auto 0 !important;
      z-index: 30 !important;
      box-shadow: none !important;
    }

    @media (max-width: 1320px) {
      .sidebar #crap-radio-player {
        margin-top: 76px !important;
      }
    }

    @media (max-width: 920px) {
      .sidebar #crap-radio-player {
        margin-top: 72px !important;
      }
    }

    @media (max-width: 680px) {
      .sidebar #crap-radio-player {
        margin: 70px auto 0 !important;
      }
    }
  `;
  document.head.appendChild(style);

  function pinPlayerToSidebar() {
    const player = document.getElementById('crap-radio-player');
    const sidebar = document.querySelector('.sidebar');
    if (!player || !sidebar) return;
    if (player.parentNode !== sidebar) sidebar.appendChild(player);
  }

  pinPlayerToSidebar();

  function isInternalRoute(url) {
    return url.origin === window.location.origin && ROUTES.has(url.pathname);
  }

  function shouldInterceptClick(event, anchor) {
    if (!anchor || event.defaultPrevented) return false;
    if (event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (anchor.target && anchor.target !== '_self') return false;
    if (anchor.hasAttribute('download')) return false;

    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return false;

    let url;
    try {
      url = new URL(anchor.href, window.location.href);
    } catch (_) {
      return false;
    }

    return isInternalRoute(url);
  }

  function removeDynamicHead() {
    document.querySelectorAll('[data-crap-dynamic-head]').forEach((node) => node.remove());
  }

  function copyDynamicHead(targetDoc, targetUrl) {
    removeDynamicHead();

    targetDoc.head.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
      if (node.tagName === 'LINK') {
        const href = node.getAttribute('href');
        if (!href) return;
        const resolved = new URL(href, targetUrl);
        if (resolved.pathname.endsWith('/style.css') || resolved.pathname === '/style.css') return;

        const clone = document.createElement('link');
        clone.rel = 'stylesheet';
        clone.href = resolved.href;
        clone.dataset.crapDynamicHead = '1';
        document.head.appendChild(clone);
        return;
      }

      const clone = document.createElement('style');
      clone.textContent = node.textContent || '';
      clone.dataset.crapDynamicHead = '1';
      document.head.appendChild(clone);
    });
  }

  function clearDynamicBody() {
    Array.from(document.body.children).forEach((node) => {
      if (node.matches('.sidebar')) return;
      if (node.tagName === 'SCRIPT') return;
      node.remove();
    });
    document.body.className = '';
  }

  function insertDynamicBody(targetDoc) {
    const fragment = document.createDocumentFragment();

    Array.from(targetDoc.body.children).forEach((node) => {
      if (node.matches('.sidebar')) return;
      if (node.tagName === 'SCRIPT') return;
      fragment.appendChild(document.importNode(node, true));
    });

    const firstScript = Array.from(document.body.children).find((node) => node.tagName === 'SCRIPT');
    if (firstScript) document.body.insertBefore(fragment, firstScript);
    else document.body.appendChild(fragment);
  }

  async function runPageScripts(targetDoc, targetUrl) {
    const scripts = Array.from(targetDoc.body.querySelectorAll('script'));

    for (const script of scripts) {
      const src = script.getAttribute('src');

      if (src) {
        const resolved = new URL(src, targetUrl);
        if (/\/radio(?:-persist)?\.js$/i.test(resolved.pathname)) continue;

        try {
          const response = await fetch(resolved.href, { cache: 'no-cache' });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const code = await response.text();
          new Function(`${code}\n//# sourceURL=${resolved.href}`)();
        } catch (error) {
          console.error('CRAP page script failed:', resolved.href, error);
        }
        continue;
      }

      const code = script.textContent || '';
      if (!code.trim()) continue;
      if (code.includes('CRAP_RADIO_CONFIG')) continue;

      try {
        new Function(code)();
      } catch (error) {
        console.error('CRAP inline page script failed:', error);
      }
    }
  }

  let navigationToken = 0;

  async function navigate(urlLike, options = {}) {
    const url = urlLike instanceof URL ? urlLike : new URL(urlLike, window.location.href);
    const token = ++navigationToken;

    try {
      const response = await fetch(url.href, {
        cache: 'no-cache',
        headers: { 'X-CRAP-Navigation': 'partial' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const html = await response.text();
      if (token !== navigationToken) return;

      const targetDoc = new DOMParser().parseFromString(html, 'text/html');

      if (options.push !== false) history.pushState({ crapPartial: true }, '', url.href);

      document.title = targetDoc.title || document.title;
      copyDynamicHead(targetDoc, url.href);
      clearDynamicBody();
      insertDynamicBody(targetDoc);
      pinPlayerToSidebar();
      await runPageScripts(targetDoc, url.href);

      if (!url.hash) {
        window.scrollTo(0, 0);
      } else {
        requestAnimationFrame(() => {
          const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
          if (target) target.scrollIntoView({ block: 'start' });
        });
      }
    } catch (error) {
      console.error('CRAP partial navigation failed; using normal navigation.', error);
      window.location.href = url.href;
    }
  }

  document.addEventListener('click', (event) => {
    const anchor = event.target.closest('a[href]');
    if (!shouldInterceptClick(event, anchor)) return;

    const url = new URL(anchor.href, window.location.href);

    if (url.pathname === window.location.pathname && url.search === window.location.search) {
      if (url.hash !== window.location.hash) {
        event.preventDefault();
        history.pushState({ crapPartial: true }, '', url.href);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }
      return;
    }

    event.preventDefault();
    navigate(url);
  });

  window.addEventListener('popstate', () => {
    const url = new URL(window.location.href);
    if (isInternalRoute(url)) navigate(url, { push: false });
  });

  window.CrapNavigate = navigate;
})();

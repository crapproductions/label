(() => {
  if (window.__CRAP_RADIO_PERSIST_READY) return;
  window.__CRAP_RADIO_PERSIST_READY = true;
  window.__CRAP_RADIO_PERSIST_VERSION = '20260821d';

  const ROUTES = new Set([
    '/',
    '/index.html',
    '/catalogue.html',
    '/mail-order.html',
    '/report.html',
    '/contact.html'
  ]);

  const pageCache = new Map();

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

  function normalizedPath(pathname) {
    if (pathname === '') return '/';
    return pathname;
  }

  function isInternalRoute(url) {
    return url.origin === window.location.origin && ROUTES.has(normalizedPath(url.pathname));
  }

  function getAnchor(event) {
    const target = event.target;
    if (!(target instanceof Element)) return null;
    return target.closest('a[href]');
  }

  function shouldInterceptClick(event, anchor) {
    if (!anchor) return false;
    if (event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (anchor.target && anchor.target !== '_self') return false;
    if (anchor.hasAttribute('download')) return false;

    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return false;

    try {
      return isInternalRoute(new URL(anchor.href, window.location.href));
    } catch (_) {
      return false;
    }
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
      node.remove();
    });
  }

  function insertDynamicBody(targetDoc) {
    const fragment = document.createDocumentFragment();

    Array.from(targetDoc.body.children).forEach((node) => {
      if (node.matches('.sidebar')) return;
      if (node.tagName === 'SCRIPT') return;
      fragment.appendChild(document.importNode(node, true));
    });

    document.body.appendChild(fragment);
    document.body.className = targetDoc.body.className || '';
  }

  async function runPageScripts(targetDoc, targetUrl) {
    const scripts = Array.from(targetDoc.body.querySelectorAll('script'));

    for (const script of scripts) {
      const src = script.getAttribute('src');

      if (src) {
        const resolved = new URL(src, targetUrl);
        if (/\/radio(?:-persist)?\.js$/i.test(resolved.pathname)) continue;

        try {
          const response = await fetch(resolved.href, { cache: 'no-store' });
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

  async function fetchPage(url) {
    const requestUrl = new URL(url.href);
    requestUrl.hash = '';
    const key = requestUrl.href;

    if (pageCache.has(key)) return pageCache.get(key);

    const response = await fetch(key, {
      cache: 'no-store',
      headers: { 'X-CRAP-Navigation': 'partial' }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();
    pageCache.set(key, html);
    return html;
  }

  let navigationToken = 0;

  async function navigate(urlLike, options = {}) {
    const url = urlLike instanceof URL ? urlLike : new URL(urlLike, window.location.href);
    if (!isInternalRoute(url)) return false;

    const token = ++navigationToken;

    try {
      const html = await fetchPage(url);
      if (token !== navigationToken) return true;

      const targetDoc = new DOMParser().parseFromString(html, 'text/html');

      if (options.push !== false) {
        history.pushState({ crapPartial: true }, '', url.href);
      }

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
          const id = decodeURIComponent(url.hash.slice(1));
          const target = document.getElementById(id);
          if (target) target.scrollIntoView({ block: 'start' });
        });
      }

      return true;
    } catch (error) {
      // Deliberately do NOT fall back to window.location here: a full
      // navigation would destroy the live <audio> element and reset radio.
      console.error('CRAP partial navigation failed; current page kept to preserve radio.', error);
      return false;
    }
  }

  function dispatchHashChange() {
    try {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } catch (_) {
      window.dispatchEvent(new Event('hashchange'));
    }
  }

  function handleInternalClick(event) {
    const anchor = getAnchor(event);
    if (!shouldInterceptClick(event, anchor)) return;

    const url = new URL(anchor.href, window.location.href);

    // Capture phase: block normal document navigation before any other
    // handler can allow the browser to unload the page/audio element.
    event.preventDefault();
    event.stopPropagation();

    if (url.pathname === window.location.pathname && url.search === window.location.search) {
      if (url.hash !== window.location.hash) {
        history.pushState({ crapPartial: true }, '', url.href);
        dispatchHashChange();
      }
      return;
    }

    navigate(url);
  }

  document.addEventListener('click', handleInternalClick, true);

  window.addEventListener('popstate', () => {
    const url = new URL(window.location.href);
    if (isInternalRoute(url)) navigate(url, { push: false });
  });

  // Warm the main pages in the background. This is not required for
  // correctness, but makes subsequent radio-safe navigation near instant.
  window.setTimeout(() => {
    ROUTES.forEach((path) => {
      const url = new URL(path, window.location.origin);
      if (url.pathname === window.location.pathname) return;
      fetchPage(url).catch(() => {});
    });
  }, 500);

  window.CrapNavigate = navigate;
})();
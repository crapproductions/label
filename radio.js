(() => {
  const path = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
  const isTransmission = path === '/transmission' || path === '/transmission/index.html';
  if (!isTransmission) return;

  const script = document.createElement('script');
  script.src = '/radio-transmission.js?v=20260905a';
  script.async = false;
  script.onload = () => {
    const consoleEl = document.getElementById('transmission-console');
    const player = document.getElementById('crap-radio-player');
    if (consoleEl && player && player.parentNode !== consoleEl) consoleEl.prepend(player);
  };
  document.head.appendChild(script);
})();

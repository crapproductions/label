(() => {
  if (document.getElementById('crap-radio-player')) return;

  const config = window.CRAP_RADIO_CONFIG || {};
  const fallbackSource = 'https://pub-50928f7943944bf2a7d79fd745830758.r2.dev/wide-radio/A%20-%20Serious%20Beats%20Unmixed%20Side.mp3';
  const fallbackStartedAt = '2026-08-21T10:30:00+09:00';
  const audioSource = typeof config.source === 'string' && config.source.trim() ? config.source.trim() : fallbackSource;
  const startedAt = Date.parse(
    typeof config.startedAt === 'string' && config.startedAt.trim() ? config.startedAt.trim() : fallbackStartedAt
  );

  const style = document.createElement('style');
  style.id = 'crap-radio-player-style';
  style.textContent = `
    .crap-radio-dice {
      display: block;
      width: 280px;
      height: auto;
      margin: 72px auto 0;
      object-fit: contain;
      user-select: none;
      pointer-events: none;
    }

    .sidebar .crap-radio-dice + #crap-radio-player {
      margin-top: 12px !important;
    }

    #crap-radio-player {
      --crap-radio-height: 72px;
      display: inline-flex;
      align-items: stretch;
      width: calc((var(--crap-radio-height) * 10 / 3) + var(--crap-radio-height));
      height: var(--crap-radio-height);
      flex: 0 0 auto;
      overflow: hidden;
      background: #000;
      box-sizing: border-box;
      margin: 82px auto 0;
    }

    #crap-radio-player,
    #crap-radio-player * {
      box-sizing: border-box;
    }

    .crap-radio-artwork {
      display: block;
      flex: 0 0 auto;
      width: calc(var(--crap-radio-height) * 10 / 3);
      height: var(--crap-radio-height);
      margin: 0;
      padding: 0;
      object-fit: contain;
      object-position: left center;
      background: #000;
      user-select: none;
      pointer-events: none;
    }

    .crap-radio-toggle {
      position: relative;
      display: grid;
      place-items: center;
      flex: 0 0 var(--crap-radio-height);
      width: var(--crap-radio-height);
      min-width: var(--crap-radio-height);
      height: var(--crap-radio-height);
      margin: 0;
      padding: 0;
      border: 0;
      border-left: 1px solid rgba(255, 255, 255, 0.65);
      border-radius: 0;
      background: #000;
      color: #fff;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
    }

    .crap-radio-toggle:hover,
    .crap-radio-toggle:focus-visible {
      outline: none;
      background: #111;
    }

    .crap-radio-icon {
      display: block;
      width: 0;
      height: 0;
      border-top: 13px solid transparent;
      border-bottom: 13px solid transparent;
      border-left: 21px solid currentColor;
      margin-left: 4px;
    }

    #crap-radio-player.is-playing .crap-radio-icon {
      width: 20px;
      height: 26px;
      margin-left: 0;
      border: 0;
      background: linear-gradient(
        to right,
        currentColor 0,
        currentColor 7px,
        transparent 7px,
        transparent 13px,
        currentColor 13px,
        currentColor 20px
      );
    }

    #crap-radio-player audio {
      display: none;
    }

    @media (max-width: 920px) {
      .crap-radio-dice {
        width: 250px;
        margin-top: 64px;
      }

      .sidebar .crap-radio-dice + #crap-radio-player {
        margin-top: 10px !important;
      }

      #crap-radio-player {
        --crap-radio-height: 64px;
      }

      .crap-radio-icon {
        border-top-width: 11px;
        border-bottom-width: 11px;
        border-left-width: 18px;
      }

      #crap-radio-player.is-playing .crap-radio-icon {
        width: 18px;
        height: 23px;
        background: linear-gradient(
          to right,
          currentColor 0,
          currentColor 6px,
          transparent 6px,
          transparent 12px,
          currentColor 12px,
          currentColor 18px
        );
      }
    }

    @media (max-width: 680px) {
      .crap-radio-dice {
        width: 235px;
        margin: 60px auto 0;
      }

      #crap-radio-player {
        --crap-radio-height: 62px;
      }
    }
  `;
  document.head.appendChild(style);

  const dice = document.createElement('img');
  dice.className = 'crap-radio-dice';
  dice.src = 'assets/ui/crap-radio-dice.png?v=20260821b';
  dice.alt = '';
  dice.setAttribute('aria-hidden', 'true');

  const player = document.createElement('div');
  player.id = 'crap-radio-player';
  player.setAttribute('role', 'group');
  player.setAttribute('aria-label', 'CRAP RADIO');

  const artwork = document.createElement('img');
  artwork.className = 'crap-radio-artwork';
  artwork.src = 'assets/ui/crap-radio-transmitting.png?v=20260821a';
  artwork.alt = 'TRANSMITTING FROM CRAP HQ';

  const button = document.createElement('button');
  button.className = 'crap-radio-toggle';
  button.type = 'button';
  button.setAttribute('aria-label', 'Play CRAP RADIO');
  button.title = 'Play CRAP RADIO';

  const icon = document.createElement('span');
  icon.className = 'crap-radio-icon';
  icon.setAttribute('aria-hidden', 'true');
  button.appendChild(icon);

  const audio = document.createElement('audio');
  audio.id = 'crap-radio-audio';
  audio.preload = 'metadata';
  audio.src = audioSource;
  audio.loop = false;

  player.append(artwork, button, audio);

  const sidebar = document.querySelector('.sidebar');
  const host = sidebar || document.body;
  host.append(dice, player);

  function getLiveOffset() {
    if (!Number.isFinite(startedAt) || !Number.isFinite(audio.duration) || audio.duration <= 0) return null;
    const elapsed = Math.max(0, (Date.now() - startedAt) / 1000);
    return elapsed % audio.duration;
  }

  function syncToBroadcastClock(force = false) {
    const liveOffset = getLiveOffset();
    if (liveOffset === null) return false;

    const difference = Math.abs(audio.currentTime - liveOffset);
    const wrappedDifference = Math.min(difference, Math.abs(audio.duration - difference));

    if (force || wrappedDifference > 1.25) {
      try { audio.currentTime = liveOffset; } catch (_) {}
    }
    return true;
  }

  function waitForMetadata() {
    if (audio.readyState >= 1 && Number.isFinite(audio.duration)) return Promise.resolve();

    return new Promise((resolve) => {
      const done = () => {
        audio.removeEventListener('loadedmetadata', done);
        audio.removeEventListener('error', done);
        resolve();
      };
      audio.addEventListener('loadedmetadata', done, { once: true });
      audio.addEventListener('error', done, { once: true });
      audio.load();
    });
  }

  async function playRadio(forceSync = true) {
    try {
      await waitForMetadata();
      if (forceSync) syncToBroadcastClock(true);
      await audio.play();
    } catch (error) {
      console.warn('CRAP RADIO could not start playback.', error);
    }
  }

  async function restartBroadcastAfterEnd() {
    try {
      await waitForMetadata();
      syncToBroadcastClock(true);
      await audio.play();
    } catch (error) {
      console.warn('CRAP RADIO could not restart after ending.', error);
    }
  }

  function pauseRadio() {
    audio.pause();
  }

  button.addEventListener('click', () => {
    if (audio.paused) playRadio(true);
    else pauseRadio();
  });

  audio.addEventListener('loadedmetadata', () => {
    if (!audio.paused) syncToBroadcastClock(true);
  });

  audio.addEventListener('play', () => {
    syncToBroadcastClock();
    player.classList.add('is-playing');
    button.setAttribute('aria-label', 'Pause CRAP RADIO');
    button.title = 'Pause CRAP RADIO';
  });

  audio.addEventListener('pause', () => {
    if (!audio.ended) {
      player.classList.remove('is-playing');
      button.setAttribute('aria-label', 'Play CRAP RADIO');
      button.title = 'Play CRAP RADIO';
    }
  });

  audio.addEventListener('ended', () => {
    player.classList.add('is-playing');
    restartBroadcastAfterEnd();
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !audio.paused) syncToBroadcastClock(true);
  });

  window.setInterval(() => {
    if (!audio.paused) syncToBroadcastClock();
  }, 30000);

  window.CrapRadio = {
    player,
    audio,
    startedAt,
    syncToBroadcastClock,
    restartBroadcastAfterEnd
  };

  if (!window.__CRAP_RADIO_PERSIST_READY && !document.querySelector('script[src*="radio-persist.js"]')) {
    const persistScript = document.createElement('script');
    persistScript.src = 'radio-persist.js?v=20260821d';
    persistScript.defer = true;
    document.body.appendChild(persistScript);
  }
})();
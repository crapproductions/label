(() => {
  if (document.getElementById('crap-radio-player')) return;

  const config = window.CRAP_RADIO_CONFIG || {};
  const fallbackSource = 'https://pub-50928f7943944bf2a7d79fd745830758.r2.dev/wide-radio/04%20The%20Sapphires%20-%20Who%20Do%20You%20Love.mp3';
  const audioSource = typeof config.source === 'string' && config.source.trim()
    ? config.source.trim()
    : fallbackSource;

  const style = document.createElement('style');
  style.id = 'crap-radio-player-style';
  style.textContent = `
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
      #crap-radio-player {
        --crap-radio-height: 64px;
        margin-top: 72px;
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
      #crap-radio-player {
        --crap-radio-height: 62px;
        margin: 70px auto 0;
      }
    }
  `;
  document.head.appendChild(style);

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
  audio.preload = 'none';
  audio.src = audioSource;

  player.append(artwork, button, audio);

  const sidebar = document.querySelector('.sidebar');
  (sidebar || document.body).appendChild(player);

  async function playRadio() {
    try {
      await audio.play();
    } catch (error) {
      console.warn('CRAP RADIO could not start playback.', error);
    }
  }

  function pauseRadio() {
    audio.pause();
  }

  button.addEventListener('click', () => {
    if (audio.paused) playRadio();
    else pauseRadio();
  });

  audio.addEventListener('play', () => {
    player.classList.add('is-playing');
    button.setAttribute('aria-label', 'Pause CRAP RADIO');
    button.title = 'Pause CRAP RADIO';
  });

  audio.addEventListener('pause', () => {
    player.classList.remove('is-playing');
    button.setAttribute('aria-label', 'Play CRAP RADIO');
    button.title = 'Play CRAP RADIO';
  });

  window.CrapRadio = { player, audio };

  if (!window.__CRAP_RADIO_PERSIST_READY && !document.querySelector('script[src*="radio-persist.js"]')) {
    const persistScript = document.createElement('script');
    persistScript.src = 'radio-persist.js?v=20260821c';
    persistScript.defer = true;
    document.body.appendChild(persistScript);
  }
})();

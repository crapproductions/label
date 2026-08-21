(() => {
  if (document.getElementById('crap-radio-player')) return;

  const LIBRARY_URL = 'radio-library.json?v=20260821g';
  const FALLBACK_LIBRARY = {
    startedAt: '2026-08-21T10:30:00+09:00',
    baseUrl: 'https://pub-50928f7943944bf2a7d79fd745830758.r2.dev/wide-radio/',
    files: [
      'CRAP-RADIO-001.mp3',
      'CRAP-RADIO-002.mp3',
      'CRAP-RADIO-003.mp3'
    ]
  };

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
  audio.preload = 'metadata';
  audio.loop = false;

  player.append(artwork, button, audio);

  const sidebar = document.querySelector('.sidebar');
  (sidebar || document.body).appendChild(player);

  let tracks = [];
  let startedAt = Date.parse(FALLBACK_LIBRARY.startedAt);
  let totalDuration = 0;
  let currentTrackIndex = -1;
  let playlistReady = false;
  let switchingTrack = false;

  async function loadLibrary() {
    try {
      const response = await fetch(LIBRARY_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const library = await response.json();
      if (!library || !Array.isArray(library.files) || !library.files.length) throw new Error('Invalid radio library');
      return library;
    } catch (error) {
      console.warn('CRAP RADIO library fallback in use.', error);
      return FALLBACK_LIBRARY;
    }
  }

  function probeDuration(url) {
    return new Promise((resolve, reject) => {
      const probe = document.createElement('audio');
      probe.preload = 'metadata';
      probe.src = url;
      let finished = false;

      const cleanup = () => {
        probe.removeAttribute('src');
        try { probe.load(); } catch (_) {}
      };

      const finish = (error, duration) => {
        if (finished) return;
        finished = true;
        window.clearTimeout(timer);
        cleanup();
        if (error) reject(error);
        else resolve(duration);
      };

      const timer = window.setTimeout(() => finish(new Error('Metadata timeout')), 20000);

      probe.addEventListener('loadedmetadata', () => {
        if (Number.isFinite(probe.duration) && probe.duration > 0) finish(null, probe.duration);
        else finish(new Error('Invalid duration'));
      }, { once: true });

      probe.addEventListener('error', () => finish(new Error(`Could not read ${url}`)), { once: true });
      probe.load();
    });
  }

  function getBroadcastPosition() {
    if (!playlistReady || !tracks.length || totalDuration <= 0 || !Number.isFinite(startedAt)) return null;

    const elapsed = Math.max(0, (Date.now() - startedAt) / 1000);
    let position = elapsed % totalDuration;

    for (let index = 0; index < tracks.length; index += 1) {
      const duration = tracks[index].duration;
      if (position < duration || index === tracks.length - 1) {
        return { index, offset: Math.min(position, Math.max(0, duration - 0.05)) };
      }
      position -= duration;
    }

    return { index: 0, offset: 0 };
  }

  function waitForCurrentMetadata() {
    if (audio.readyState >= 1 && Number.isFinite(audio.duration) && audio.duration > 0) return Promise.resolve();

    return new Promise((resolve, reject) => {
      let finished = false;

      const finish = (error) => {
        if (finished) return;
        finished = true;
        window.clearTimeout(timer);
        audio.removeEventListener('loadedmetadata', onMetadata);
        audio.removeEventListener('error', onError);
        if (error) reject(error);
        else resolve();
      };

      const onMetadata = () => finish(null);
      const onError = () => finish(new Error('Audio failed to load'));
      const timer = window.setTimeout(() => finish(new Error('Audio metadata timeout')), 20000);

      audio.addEventListener('loadedmetadata', onMetadata, { once: true });
      audio.addEventListener('error', onError, { once: true });
    });
  }

  async function setTrack(index, offset, shouldPlay) {
    if (!tracks[index]) return false;
    switchingTrack = true;

    try {
      if (currentTrackIndex !== index || !audio.src) {
        currentTrackIndex = index;
        audio.src = tracks[index].url;
        audio.load();
        await waitForCurrentMetadata();
      }

      const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : tracks[index].duration;
      const safeOffset = Math.min(Math.max(0, offset || 0), Math.max(0, duration - 0.05));
      try { audio.currentTime = safeOffset; } catch (_) {}

      if (shouldPlay) await audio.play();
      return true;
    } catch (error) {
      console.error('CRAP RADIO track switch failed.', error);
      return false;
    } finally {
      switchingTrack = false;
    }
  }

  async function syncToBroadcastClock(force = false, shouldPlay = !audio.paused) {
    const live = getBroadcastPosition();
    if (!live || switchingTrack) return false;

    if (currentTrackIndex !== live.index) return setTrack(live.index, live.offset, shouldPlay);

    const difference = Math.abs(audio.currentTime - live.offset);
    if (force || difference > 1.25) {
      try { audio.currentTime = live.offset; } catch (_) {}
    }

    if (shouldPlay && audio.paused) {
      try { await audio.play(); } catch (error) {
        console.warn('CRAP RADIO could not resume playback.', error);
      }
    }
    return true;
  }

  async function initializePlaylist() {
    const library = await loadLibrary();
    const baseUrl = library.baseUrl || FALLBACK_LIBRARY.baseUrl;
    const files = Array.isArray(library.files) && library.files.length ? library.files : FALLBACK_LIBRARY.files;
    const parsedStart = Date.parse(library.startedAt || FALLBACK_LIBRARY.startedAt);
    if (Number.isFinite(parsedStart)) startedAt = parsedStart;

    const urls = files.map((file) => new URL(file, baseUrl).href);
    const durations = await Promise.all(urls.map((url) => probeDuration(url)));

    tracks = urls.map((url, index) => ({ file: files[index], url, duration: durations[index] }));
    totalDuration = tracks.reduce((sum, track) => sum + track.duration, 0);
    playlistReady = tracks.length > 0 && totalDuration > 0;

    const live = getBroadcastPosition();
    if (live) await setTrack(live.index, live.offset, false);
  }

  async function playRadio() {
    if (!playlistReady) {
      console.warn('CRAP RADIO playlist is still loading.');
      return;
    }
    await syncToBroadcastClock(true, true);
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
    if (!audio.ended) {
      player.classList.remove('is-playing');
      button.setAttribute('aria-label', 'Play CRAP RADIO');
      button.title = 'Play CRAP RADIO';
    }
  });

  audio.addEventListener('ended', () => {
    if (!playlistReady || switchingTrack) return;
    syncToBroadcastClock(true, true);
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !audio.paused) syncToBroadcastClock(true, true);
  });

  window.setInterval(() => {
    if (!audio.paused) syncToBroadcastClock(false, true);
  }, 30000);

  initializePlaylist().catch((error) => {
    console.error('CRAP RADIO playlist initialization failed.', error);
  });

  window.CrapRadio = {
    player,
    audio,
    get tracks() { return tracks.slice(); },
    get startedAt() { return startedAt; },
    get totalDuration() { return totalDuration; },
    syncToBroadcastClock
  };

  if (!window.__CRAP_RADIO_PERSIST_READY && !document.querySelector('script[src*="radio-persist.js"]')) {
    const persistScript = document.createElement('script');
    persistScript.src = 'radio-persist.js?v=20260821d';
    persistScript.defer = true;
    document.body.appendChild(persistScript);
  }
})();

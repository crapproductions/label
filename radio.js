(() => {
  if (document.getElementById('crap-radio-player')) return;

  const LIBRARY_URL = 'radio-library.json?v=20260821j';
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
    #crap-radio-player, #crap-radio-player * { box-sizing: border-box; }
    .crap-radio-artwork {
      display:block;
      flex:0 0 auto;
      width:calc(var(--crap-radio-height) * 10 / 3);
      height:var(--crap-radio-height);
      margin:0;
      padding:0;
      object-fit:contain;
      object-position:left center;
      background:#000;
      user-select:none;
      pointer-events:none;
    }
    .crap-radio-toggle {
      position:relative;
      display:grid;
      place-items:center;
      flex:0 0 var(--crap-radio-height);
      width:var(--crap-radio-height);
      min-width:var(--crap-radio-height);
      height:var(--crap-radio-height);
      margin:0;
      padding:0;
      border:0;
      border-left:1px solid rgba(255,255,255,.65);
      border-radius:0;
      background:#000;
      color:#fff;
      cursor:pointer;
      appearance:none;
      -webkit-appearance:none;
    }
    .crap-radio-toggle:hover, .crap-radio-toggle:focus-visible { outline:none; background:#111; }
    .crap-radio-icon {
      display:block;
      width:0;
      height:0;
      border-top:13px solid transparent;
      border-bottom:13px solid transparent;
      border-left:21px solid currentColor;
      margin-left:4px;
    }
    #crap-radio-player.is-playing .crap-radio-icon {
      width:20px;
      height:26px;
      margin-left:0;
      border:0;
      background:linear-gradient(to right,currentColor 0,currentColor 7px,transparent 7px,transparent 13px,currentColor 13px,currentColor 20px);
    }
    #crap-radio-player audio { display:none; }
    @media (max-width:920px) {
      #crap-radio-player { --crap-radio-height:64px; margin-top:72px; }
      .crap-radio-icon { border-top-width:11px; border-bottom-width:11px; border-left-width:18px; }
      #crap-radio-player.is-playing .crap-radio-icon {
        width:18px; height:23px;
        background:linear-gradient(to right,currentColor 0,currentColor 6px,transparent 6px,transparent 12px,currentColor 12px,currentColor 18px);
      }
    }
    @media (max-width:680px) {
      #crap-radio-player { --crap-radio-height:62px; margin:70px auto 0; }
    }
  `;
  document.head.appendChild(style);

  const player = document.createElement('div');
  player.id = 'crap-radio-player';
  player.setAttribute('role','group');
  player.setAttribute('aria-label','CRAP RADIO');

  const artwork = document.createElement('img');
  artwork.className = 'crap-radio-artwork';
  artwork.src = 'assets/ui/crap-radio-transmitting.png?v=20260821a';
  artwork.alt = 'TRANSMITTING FROM CRAP HQ';

  const button = document.createElement('button');
  button.className = 'crap-radio-toggle';
  button.type = 'button';
  button.setAttribute('aria-label','Play CRAP RADIO');
  button.title = 'Play CRAP RADIO';

  const icon = document.createElement('span');
  icon.className = 'crap-radio-icon';
  icon.setAttribute('aria-hidden','true');
  button.appendChild(icon);

  const audio = document.createElement('audio');
  audio.id = 'crap-radio-audio';
  audio.preload = 'auto';
  audio.loop = false;
  audio.playsInline = true;

  player.append(artwork, button, audio);
  const sidebar = document.querySelector('.sidebar');
  (sidebar || document.body).appendChild(player);

  let library = { ...FALLBACK_LIBRARY, files: [...FALLBACK_LIBRARY.files] };
  let tracks = [];
  let currentTrackIndex = 0;
  let startedAt = Date.parse(FALLBACK_LIBRARY.startedAt);
  let totalDuration = 0;
  let durationsReady = false;
  let wantsPlayback = false;
  let switchingTrack = false;

  function absoluteTrackUrl(file, baseUrl) {
    return new URL(encodeURIComponent(file), baseUrl).href;
  }

  function buildTracks(nextLibrary) {
    const baseUrl = nextLibrary.baseUrl || FALLBACK_LIBRARY.baseUrl;
    const files = Array.isArray(nextLibrary.files) && nextLibrary.files.length
      ? nextLibrary.files
      : FALLBACK_LIBRARY.files;
    tracks = files.map(file => ({ file, url: absoluteTrackUrl(file, baseUrl), duration: null }));
    const parsedStart = Date.parse(nextLibrary.startedAt || FALLBACK_LIBRARY.startedAt);
    if (Number.isFinite(parsedStart)) startedAt = parsedStart;
  }

  function setPlayingUI(playing) {
    player.classList.toggle('is-playing', playing);
    button.setAttribute('aria-label', playing ? 'Pause CRAP RADIO' : 'Play CRAP RADIO');
    button.title = playing ? 'Pause CRAP RADIO' : 'Play CRAP RADIO';
  }

  function loadTrack(index, offset = 0, autoplay = false) {
    if (!tracks.length || !tracks[index]) return;
    switchingTrack = true;
    currentTrackIndex = index;
    const target = tracks[index];

    if (audio.src !== target.url) {
      audio.src = target.url;
      audio.load();
    }

    const applyOffset = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        const maxOffset = Math.max(0, audio.duration - 0.1);
        try { audio.currentTime = Math.min(Math.max(0, offset), maxOffset); } catch (_) {}
      }
      switchingTrack = false;
    };

    if (offset > 0 && audio.readyState < 1) {
      audio.addEventListener('loadedmetadata', applyOffset, { once:true });
    } else {
      applyOffset();
    }

    if (autoplay) {
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(error => {
          console.warn('CRAP RADIO could not play track.', error);
          wantsPlayback = false;
          setPlayingUI(false);
        });
      }
    }
  }

  function getLivePosition() {
    if (!durationsReady || totalDuration <= 0 || !Number.isFinite(startedAt)) return null;
    const elapsed = Math.max(0, (Date.now() - startedAt) / 1000);
    let position = elapsed % totalDuration;
    for (let i = 0; i < tracks.length; i += 1) {
      const duration = tracks[i].duration;
      if (position < duration || i === tracks.length - 1) {
        return { index:i, offset:Math.min(position, Math.max(0, duration - 0.1)) };
      }
      position -= duration;
    }
    return { index:0, offset:0 };
  }

  function syncToBroadcastClock() {
    const live = getLivePosition();
    if (!live || switchingTrack) return false;

    if (currentTrackIndex !== live.index) {
      loadTrack(live.index, live.offset, wantsPlayback);
      return true;
    }

    if (Math.abs(audio.currentTime - live.offset) > 1.5) {
      try { audio.currentTime = live.offset; } catch (_) {}
    }
    return true;
  }

  function playRadio() {
    wantsPlayback = true;
    setPlayingUI(true);

    // Important: call play() directly from the user's click. Do not await
    // fetch/metadata first, otherwise browser user-activation can expire.
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(error => {
        wantsPlayback = false;
        setPlayingUI(false);
        console.warn('CRAP RADIO could not start playback.', error);
      });
    }

    if (durationsReady) {
      window.setTimeout(syncToBroadcastClock, 0);
    }
  }

  function pauseRadio() {
    wantsPlayback = false;
    audio.pause();
    setPlayingUI(false);
  }

  function goToNextTrack() {
    if (!tracks.length) return;
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    loadTrack(nextIndex, 0, wantsPlayback);
  }

  button.addEventListener('click', () => {
    if (wantsPlayback && !audio.paused) pauseRadio();
    else playRadio();
  });

  audio.addEventListener('play', () => {
    if (wantsPlayback) setPlayingUI(true);
  });

  audio.addEventListener('pause', () => {
    if (!audio.ended && !wantsPlayback) setPlayingUI(false);
  });

  audio.addEventListener('ended', () => {
    if (wantsPlayback) goToNextTrack();
  });

  audio.addEventListener('error', () => {
    if (wantsPlayback && !switchingTrack) {
      console.warn('CRAP RADIO: unavailable track skipped.');
      window.setTimeout(goToNextTrack, 500);
    }
  });

  function probeDuration(track) {
    return new Promise((resolve, reject) => {
      const probe = new Audio();
      probe.preload = 'metadata';
      probe.src = track.url;
      let settled = false;
      const timer = window.setTimeout(() => finish(new Error('metadata timeout')), 30000);

      function finish(error, duration) {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        probe.removeAttribute('src');
        try { probe.load(); } catch (_) {}
        if (error || !Number.isFinite(duration) || duration <= 0) reject(error || new Error('invalid duration'));
        else resolve(duration);
      }

      probe.addEventListener('loadedmetadata', () => finish(null, probe.duration), { once:true });
      probe.addEventListener('error', () => finish(new Error('metadata error')), { once:true });
      probe.load();
    });
  }

  async function probeDurationsInBackground() {
    const localTracks = tracks.slice();
    const results = await Promise.allSettled(localTracks.map(probeDuration));
    if (localTracks.length !== tracks.length) return;
    if (results.some(result => result.status !== 'fulfilled')) {
      console.warn('CRAP RADIO: live-clock sync unavailable; sequential playback remains active.');
      return;
    }
    results.forEach((result,index) => { tracks[index].duration = result.value; });
    totalDuration = tracks.reduce((sum,track) => sum + track.duration, 0);
    durationsReady = totalDuration > 0;
    if (durationsReady) {
      // Prepare the correct live position even before the listener clicks.
      const live = getLivePosition();
      if (live && !wantsPlayback) loadTrack(live.index, live.offset, false);
      else if (live && wantsPlayback) syncToBroadcastClock();
    }
  }

  async function refreshLibrary() {
    try {
      const response = await fetch(LIBRARY_URL, { cache:'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!data || !Array.isArray(data.files) || !data.files.length) throw new Error('invalid library');
      library = data;
      const wasPlaying = wantsPlayback;
      const oldFile = tracks[currentTrackIndex]?.file;
      buildTracks(library);
      const sameIndex = tracks.findIndex(track => track.file === oldFile);
      currentTrackIndex = sameIndex >= 0 ? sameIndex : 0;
      if (!wasPlaying && tracks.length) loadTrack(currentTrackIndex, 0, false);
      probeDurationsInBackground();
    } catch (error) {
      console.warn('CRAP RADIO: library fetch failed; built-in 001/002/003 list remains active.', error);
    }
  }

  // Build the known-good 001/002/003 list synchronously so PLAY works immediately.
  buildTracks(library);
  audio.src = tracks[0].url;
  audio.load();

  // Refresh the editable JSON library in the background; never block PLAY on it.
  refreshLibrary();

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && wantsPlayback && durationsReady) syncToBroadcastClock();
  });

  window.setInterval(() => {
    if (wantsPlayback && durationsReady) syncToBroadcastClock();
  }, 30000);

  window.CrapRadio = {
    player,
    audio,
    get tracks(){ return tracks.slice(); },
    get currentTrackIndex(){ return currentTrackIndex; },
    get totalDuration(){ return totalDuration; },
    get startedAt(){ return startedAt; },
    syncToBroadcastClock
  };

  if (!window.__CRAP_RADIO_PERSIST_READY && !document.querySelector('script[src*="radio-persist.js"]')) {
    const persistScript = document.createElement('script');
    persistScript.src = 'radio-persist.js?v=20260821d';
    persistScript.defer = true;
    document.body.appendChild(persistScript);
  }
})();

(() => {
  if (document.getElementById('crap-radio-player')) return;

  const LIBRARY_URL = 'radio-library.json?v=20260831b';
  const STATS_HEARTBEAT_URL = 'https://crap-radio-stats.crapproductions66.workers.dev/heartbeat';
  const STATS_INTERVAL_MS = 30000;

  const FALLBACK_LIBRARY = {
    transmissionStartedAt: '2026-08-21T10:30:00+09:00',
    startedAt: '2026-08-31T17:09:31+09:00',
    baseUrl: 'https://pub-50928f7943944bf2a7d79fd745830758.r2.dev/wide-radio/',
    files: [
      'CRAP-RADIO-017.mp3',
      'CRAP-RADIO-001.mp3',
      'CRAP-RADIO-002.mp3',
      'CRAP-RADIO-003.mp3',
      'CRAP-RADIO-004.mp3',
      'CRAP-RADIO-005.mp3',
      'CRAP-RADIO-006.mp3',
      'CRAP-RADIO-007.mp3',
      'CRAP-RADIO-008.mp3',
      'CRAP-RADIO-009.mp3',
      'CRAP-RADIO-010.mp3',
      'CRAP-RADIO-011.mp3',
      'CRAP-RADIO-012.mp3',
      'CRAP-RADIO-013.mp3',
      'CRAP-RADIO-014.mp3',
      'CRAP-RADIO-015.mp3',
      'CRAP-RADIO-016.mp3'
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
  audio.preload = 'auto';
  audio.loop = false;
  audio.playsInline = true;
  audio.setAttribute('playsinline', '');
  audio.setAttribute('webkit-playsinline', '');

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
  let startupMuted = false;
  let statsHeartbeatTimer = null;

  function createStatsSessionId() {
    const key = 'crap-radio-stats-session';
    try {
      const existing = window.sessionStorage.getItem(key);
      if (existing) return existing;
      const created = (window.crypto && typeof window.crypto.randomUUID === 'function')
        ? window.crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
      window.sessionStorage.setItem(key, created);
      return created;
    } catch (_) {
      return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    }
  }

  const statsSessionId = createStatsSessionId();

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

  function getCurrentMixId() {
    const file = tracks[currentTrackIndex]?.file || '';
    const match = file.match(/(?:^|[^0-9])(\d{3})(?=[^0-9]|$)/);
    return match ? match[1] : null;
  }

  function setMediaPlaybackState(state) {
    if (!('mediaSession' in navigator)) return;
    try { navigator.mediaSession.playbackState = state; } catch (_) {}
  }

  function updateMediaPosition() {
    if (!('mediaSession' in navigator) || typeof navigator.mediaSession.setPositionState !== 'function') return;
    if (!Number.isFinite(audio.duration) || audio.duration <= 0 || !Number.isFinite(audio.currentTime)) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: audio.duration,
        playbackRate: audio.playbackRate || 1,
        position: Math.min(Math.max(0, audio.currentTime), audio.duration)
      });
    } catch (_) {}
  }

  function setPlayingUI(playing) {
    player.classList.toggle('is-playing', playing);
    button.setAttribute('aria-label', playing ? 'Pause CRAP RADIO' : 'Play CRAP RADIO');
    button.title = playing ? 'Pause CRAP RADIO' : 'Play CRAP RADIO';
    setMediaPlaybackState(playing ? 'playing' : 'paused');
  }

  async function sendStatsHeartbeat() {
    if (!wantsPlayback || audio.paused || audio.ended) return;
    const mixId = getCurrentMixId();
    if (!mixId) return;
    try {
      await fetch(STATS_HEARTBEAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: statsSessionId, mixId }),
        cache: 'no-store',
        credentials: 'omit',
        keepalive: true
      });
    } catch (_) {}
  }

  function startStatsHeartbeat() {
    if (statsHeartbeatTimer) return;
    statsHeartbeatTimer = window.setInterval(sendStatsHeartbeat, STATS_INTERVAL_MS);
  }

  function stopStatsHeartbeat() {
    if (!statsHeartbeatTimer) return;
    window.clearInterval(statsHeartbeatTimer);
    statsHeartbeatTimer = null;
  }

  function provisionalFirstTrackOffset() {
    if (!Number.isFinite(startedAt)) return 0;
    return Math.max(0, (Date.now() - startedAt) / 1000);
  }

  function loadTrack(index, offset = 0, autoplay = false) {
    if (!tracks.length || !tracks[index]) return;
    switchingTrack = true;
    currentTrackIndex = index;
    const target = tracks[index];
    const sourceChanged = audio.src !== target.url;

    if (sourceChanged) {
      audio.src = target.url;
      audio.load();
    }

    const applyOffset = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        const maxOffset = Math.max(0, audio.duration - 0.1);
        try { audio.currentTime = Math.min(Math.max(0, offset), maxOffset); } catch (_) {}
      }
      switchingTrack = false;
      updateMediaPosition();
      if (autoplay && audio.paused) {
        const p = audio.play();
        if (p && typeof p.catch === 'function') p.catch(() => setPlayingUI(false));
      }
    };

    if (audio.readyState < 1) {
      audio.addEventListener('loadedmetadata', applyOffset, { once: true });
    } else {
      applyOffset();
    }

    if (autoplay && offset <= 0 && sourceChanged) {
      const p = audio.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
  }

  function getLivePosition() {
    if (!durationsReady || totalDuration <= 0 || !Number.isFinite(startedAt)) return null;
    const elapsed = Math.max(0, (Date.now() - startedAt) / 1000);
    let position = elapsed % totalDuration;
    for (let i = 0; i < tracks.length; i += 1) {
      const duration = tracks[i].duration;
      if (position < duration || i === tracks.length - 1) {
        return { index: i, offset: Math.min(position, Math.max(0, duration - 0.1)) };
      }
      position -= duration;
    }
    return { index: 0, offset: 0 };
  }

  function syncToBroadcastClock() {
    const live = getLivePosition();
    if (!live || switchingTrack) return false;
    if (currentTrackIndex !== live.index || audio.src !== tracks[live.index]?.url) {
      loadTrack(live.index, live.offset, wantsPlayback);
      return true;
    }
    if (Math.abs(audio.currentTime - live.offset) > 1.5) {
      try { audio.currentTime = live.offset; } catch (_) {}
    }
    updateMediaPosition();
    return true;
  }

  function releaseStartupMuteWhenSynced() {
    if (!startupMuted) return;
    const deadline = Date.now() + 5000;
    const timer = window.setInterval(() => {
      const live = getLivePosition();
      const synced = live
        && !switchingTrack
        && currentTrackIndex === live.index
        && Number.isFinite(audio.currentTime)
        && Math.abs(audio.currentTime - live.offset) < 3;
      if (synced || Date.now() >= deadline) {
        window.clearInterval(timer);
        startupMuted = false;
        audio.muted = false;
      }
    }, 50);
  }

  function playRadio() {
    wantsPlayback = true;
    setPlayingUI(true);

    if (durationsReady) {
      syncToBroadcastClock();
    } else {
      startupMuted = true;
      audio.muted = true;
      if (!audio.src && tracks[0]) loadTrack(0, provisionalFirstTrackOffset(), false);
    }

    const p = audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(error => {
        setPlayingUI(false);
        console.warn('CRAP RADIO could not start playback.', error);
      });
    }
  }

  function pauseRadio() {
    wantsPlayback = false;
    audio.pause();
    stopStatsHeartbeat();
    setPlayingUI(false);
  }

  function goToNextTrack() {
    if (!tracks.length) return;
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    loadTrack(nextIndex, 0, wantsPlayback);
  }

  function recoverBackgroundPlayback() {
    if (!wantsPlayback) return;
    if (durationsReady) syncToBroadcastClock();
    if (audio.paused) {
      const p = audio.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
  }

  function setupMobileMediaSession() {
    try {
      if ('audioSession' in navigator && navigator.audioSession) navigator.audioSession.type = 'playback';
    } catch (_) {}

    if (!('mediaSession' in navigator)) return;
    try {
      if (typeof window.MediaMetadata === 'function') {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'CRAP RADIO',
          artist: 'CRAP PRODUCTIONS',
          album: 'TRANSMITTING FROM CRAP HQ'
        });
      }
    } catch (_) {}
    try { navigator.mediaSession.setActionHandler('play', playRadio); } catch (_) {}
    try { navigator.mediaSession.setActionHandler('pause', pauseRadio); } catch (_) {}
    setMediaPlaybackState('paused');
  }

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

      probe.addEventListener('loadedmetadata', () => finish(null, probe.duration), { once: true });
      probe.addEventListener('error', () => finish(new Error('metadata error')), { once: true });
      probe.load();
    });
  }

  async function probeDurationsInBackground() {
    const localTracks = tracks.slice();
    const results = await Promise.allSettled(localTracks.map(probeDuration));
    if (localTracks.length !== tracks.length) return;

    if (results.some(result => result.status !== 'fulfilled')) {
      console.warn('CRAP RADIO: live-clock sync unavailable; sequential playback remains active.');
      if (startupMuted) {
        startupMuted = false;
        audio.muted = false;
      }
      return;
    }

    results.forEach((result, index) => { tracks[index].duration = result.value; });
    totalDuration = tracks.reduce((sum, track) => sum + track.duration, 0);
    durationsReady = totalDuration > 0;

    if (durationsReady) {
      const live = getLivePosition();
      if (live) loadTrack(live.index, live.offset, wantsPlayback);
      if (startupMuted) releaseStartupMuteWhenSynced();
    }
  }

  async function refreshLibrary() {
    try {
      const response = await fetch(LIBRARY_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!data || !Array.isArray(data.files) || !data.files.length) throw new Error('invalid library');

      const oldFile = tracks[currentTrackIndex]?.file;
      library = data;
      buildTracks(library);
      const sameIndex = tracks.findIndex(track => track.file === oldFile);
      currentTrackIndex = sameIndex >= 0 ? sameIndex : 0;

      if (!wantsPlayback && tracks[currentTrackIndex]) {
        const offset = currentTrackIndex === 0 ? provisionalFirstTrackOffset() : 0;
        loadTrack(currentTrackIndex, offset, false);
      }
    } catch (error) {
      console.warn('CRAP RADIO: library fetch failed; built-in 017,001-016 rotation remains active.', error);
    }

    probeDurationsInBackground();
  }

  button.addEventListener('click', () => {
    if (wantsPlayback && !audio.paused) pauseRadio();
    else playRadio();
  });

  audio.addEventListener('play', () => {
    if (wantsPlayback) {
      setPlayingUI(true);
      startStatsHeartbeat();
    }
    updateMediaPosition();
  });

  audio.addEventListener('pause', () => {
    stopStatsHeartbeat();
    if (!audio.ended && !wantsPlayback) setPlayingUI(false);
    updateMediaPosition();
  });

  audio.addEventListener('loadedmetadata', updateMediaPosition);
  audio.addEventListener('durationchange', updateMediaPosition);
  audio.addEventListener('timeupdate', updateMediaPosition);
  audio.addEventListener('ended', () => {
    stopStatsHeartbeat();
    if (wantsPlayback) goToNextTrack();
  });
  audio.addEventListener('error', () => {
    stopStatsHeartbeat();
    if (wantsPlayback && !switchingTrack) {
      console.warn('CRAP RADIO: unavailable track skipped.');
      window.setTimeout(goToNextTrack, 500);
    }
  });

  buildTracks(library);
  if (tracks[0]) loadTrack(0, provisionalFirstTrackOffset(), false);
  setupMobileMediaSession();
  refreshLibrary();

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) recoverBackgroundPlayback();
  });
  window.addEventListener('pageshow', recoverBackgroundPlayback);
  window.addEventListener('focus', () => {
    if (!document.hidden) recoverBackgroundPlayback();
  });

  window.setInterval(() => {
    if (wantsPlayback && durationsReady && !document.hidden) syncToBroadcastClock();
  }, 30000);

  window.CrapRadio = {
    player,
    audio,
    get tracks(){ return tracks.slice(); },
    get currentTrackIndex(){ return currentTrackIndex; },
    get currentMixId(){ return getCurrentMixId(); },
    get totalDuration(){ return totalDuration; },
    get startedAt(){ return startedAt; },
    syncToBroadcastClock,
    recoverBackgroundPlayback
  };

  if (!window.__CRAP_RADIO_PERSIST_READY && !document.querySelector('script[src*="radio-persist.js"]')) {
    const persistScript = document.createElement('script');
    persistScript.src = 'radio-persist.js?v=20260821d';
    persistScript.defer = true;
    document.body.appendChild(persistScript);
  }
})();

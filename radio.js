(() => {
  if (document.getElementById('crap-radio-player')) return;

  const LIBRARY_URL = 'radio-library.json?v=20260821i';
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
  audio.preload = 'metadata';
  audio.loop = false;

  player.append(artwork,button,audio);
  const sidebar = document.querySelector('.sidebar');
  (sidebar || document.body).appendChild(player);

  let tracks = [];
  let currentTrackIndex = 0;
  let startedAt = Date.parse(FALLBACK_LIBRARY.startedAt);
  let totalDuration = 0;
  let durationsReady = false;
  let switchingTrack = false;
  let wantsPlayback = false;

  function setPlayingUI(playing) {
    player.classList.toggle('is-playing', playing);
    button.setAttribute('aria-label', playing ? 'Pause CRAP RADIO' : 'Play CRAP RADIO');
    button.title = playing ? 'Pause CRAP RADIO' : 'Play CRAP RADIO';
  }

  async function loadLibrary() {
    try {
      const response = await fetch(LIBRARY_URL, { cache:'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!data || !Array.isArray(data.files) || !data.files.length) throw new Error('Invalid library');
      return data;
    } catch (error) {
      console.warn('CRAP RADIO: using built-in three-track library.', error);
      return FALLBACK_LIBRARY;
    }
  }

  function absoluteTrackUrl(file, baseUrl) {
    return new URL(encodeURIComponent(file), baseUrl).href;
  }

  function waitForMetadata(element, timeoutMs = 20000) {
    if (element.readyState >= 1 && Number.isFinite(element.duration) && element.duration > 0) return Promise.resolve(element.duration);
    return new Promise((resolve,reject) => {
      let done = false;
      const timer = window.setTimeout(() => finish(new Error('metadata timeout')), timeoutMs);
      const onLoaded = () => finish(null, element.duration);
      const onError = () => finish(new Error('audio metadata error'));
      function finish(error, duration) {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        element.removeEventListener('loadedmetadata', onLoaded);
        element.removeEventListener('error', onError);
        if (error || !Number.isFinite(duration) || duration <= 0) reject(error || new Error('invalid duration'));
        else resolve(duration);
      }
      element.addEventListener('loadedmetadata', onLoaded, { once:true });
      element.addEventListener('error', onError, { once:true });
    });
  }

  async function switchTrack(index, offset = 0, autoplay = false) {
    if (!tracks.length || !tracks[index]) return false;
    switchingTrack = true;
    currentTrackIndex = index;
    try {
      if (audio.src !== tracks[index].url) {
        audio.src = tracks[index].url;
        audio.load();
      }
      try {
        await waitForMetadata(audio);
        const maxOffset = Math.max(0, audio.duration - 0.1);
        audio.currentTime = Math.min(Math.max(0, offset), maxOffset);
      } catch (error) {
        console.warn('CRAP RADIO: metadata unavailable; playing from track start.', error);
        try { audio.currentTime = 0; } catch (_) {}
      }
      if (autoplay) await audio.play();
      return true;
    } catch (error) {
      console.error('CRAP RADIO: track switch failed.', error);
      return false;
    } finally {
      switchingTrack = false;
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

  async function syncToBroadcastClock(autoplay = wantsPlayback) {
    const live = getLivePosition();
    if (!live || switchingTrack) return false;
    if (currentTrackIndex !== live.index) return switchTrack(live.index, live.offset, autoplay);
    if (Math.abs(audio.currentTime - live.offset) > 1.5) {
      try { audio.currentTime = live.offset; } catch (_) {}
    }
    if (autoplay && audio.paused) {
      try { await audio.play(); } catch (_) {}
    }
    return true;
  }

  async function playRadio() {
    wantsPlayback = true;
    setPlayingUI(true);
    await initialized;
    if (durationsReady) {
      await syncToBroadcastClock(true);
      return;
    }
    if (!audio.src && tracks.length) await switchTrack(currentTrackIndex, 0, false);
    try {
      await audio.play();
    } catch (error) {
      wantsPlayback = false;
      setPlayingUI(false);
      console.warn('CRAP RADIO could not start playback.', error);
    }
  }

  function pauseRadio() {
    wantsPlayback = false;
    audio.pause();
    setPlayingUI(false);
  }

  async function goToNextTrack() {
    if (!tracks.length) return;
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    await switchTrack(nextIndex, 0, wantsPlayback);
  }

  button.addEventListener('click', () => {
    if (wantsPlayback && !audio.paused) pauseRadio();
    else playRadio();
  });

  audio.addEventListener('play', () => {
    if (wantsPlayback) setPlayingUI(true);
  });

  audio.addEventListener('pause', () => {
    if (!switchingTrack && !audio.ended && !wantsPlayback) setPlayingUI(false);
  });

  audio.addEventListener('ended', () => {
    if (wantsPlayback) goToNextTrack();
  });

  audio.addEventListener('error', () => {
    if (wantsPlayback && !switchingTrack) {
      console.warn('CRAP RADIO: skipping unavailable track.');
      window.setTimeout(goToNextTrack, 500);
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && wantsPlayback && durationsReady) syncToBroadcastClock(true);
  });

  window.setInterval(() => {
    if (wantsPlayback && durationsReady) syncToBroadcastClock(true);
  }, 30000);

  async function probeDurationsInBackground() {
    const results = await Promise.allSettled(tracks.map(track => {
      return new Promise((resolve,reject) => {
        const probe = new Audio();
        probe.preload = 'metadata';
        probe.src = track.url;
        waitForMetadata(probe, 30000)
          .then(duration => { probe.removeAttribute('src'); resolve(duration); })
          .catch(error => { probe.removeAttribute('src'); reject(error); });
        probe.load();
      });
    }));

    if (results.some(result => result.status !== 'fulfilled')) {
      console.warn('CRAP RADIO: duration sync unavailable; sequential playback still active.');
      return;
    }

    results.forEach((result,index) => { tracks[index].duration = result.value; });
    totalDuration = tracks.reduce((sum,track) => sum + track.duration, 0);
    durationsReady = totalDuration > 0;
    if (durationsReady && wantsPlayback) syncToBroadcastClock(true);
  }

  const initialized = (async () => {
    const library = await loadLibrary();
    const baseUrl = library.baseUrl || FALLBACK_LIBRARY.baseUrl;
    const files = Array.isArray(library.files) && library.files.length ? library.files : FALLBACK_LIBRARY.files;
    const parsedStart = Date.parse(library.startedAt || FALLBACK_LIBRARY.startedAt);
    if (Number.isFinite(parsedStart)) startedAt = parsedStart;
    tracks = files.map(file => ({ file, url:absoluteTrackUrl(file, baseUrl), duration:null }));
    currentTrackIndex = 0;
    if (tracks.length) {
      audio.src = tracks[0].url;
      audio.load();
    }
    probeDurationsInBackground();
  })();

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

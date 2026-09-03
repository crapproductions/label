(() => {
  if (document.getElementById('crap-radio-player')) return;

  const LIBRARY_URL = 'radio-library.json?v=20260903c';
  const STATS_HEARTBEAT_URL = 'https://crap-radio-stats.crapproductions66.workers.dev/heartbeat';
  const STATS_INTERVAL_MS = 30000;
  const LIBRARY_REFRESH_MS = 15000;

  const FALLBACK_LIBRARY = {
    transmissionStartedAt: '2026-08-21T10:30:00+09:00',
    startedAt: '2026-09-03T22:35:44+09:00',
    baseUrl: 'https://pub-50928f7943944bf2a7d79fd745830758.r2.dev/wide-radio/',
    files: [
      'CRAP-RADIO-001.mp3','CRAP-RADIO-002.mp3','CRAP-RADIO-003.mp3','CRAP-RADIO-004.mp3',
      'CRAP-RADIO-005.mp3','CRAP-RADIO-006.mp3','CRAP-RADIO-007.mp3','CRAP-RADIO-008.mp3',
      'CRAP-RADIO-009.mp3','CRAP-RADIO-010.mp3','CRAP-RADIO-011.mp3','CRAP-RADIO-012.mp3',
      'CRAP-RADIO-013.mp3','CRAP-RADIO-014.mp3','CRAP-RADIO-015.mp3','CRAP-RADIO-016.mp3',
      'CRAP-RADIO-017.mp3'
    ],
    schedule: {
      mode: 'reverse-once-then-normal',
      reverseFiles: [
        'CRAP-RADIO-017.mp3','CRAP-RADIO-016.mp3','CRAP-RADIO-015.mp3','CRAP-RADIO-014.mp3',
        'CRAP-RADIO-013.mp3','CRAP-RADIO-012.mp3','CRAP-RADIO-011.mp3','CRAP-RADIO-010.mp3',
        'CRAP-RADIO-009.mp3','CRAP-RADIO-008.mp3','CRAP-RADIO-007.mp3','CRAP-RADIO-006.mp3',
        'CRAP-RADIO-005.mp3','CRAP-RADIO-004.mp3','CRAP-RADIO-003.mp3','CRAP-RADIO-002.mp3',
        'CRAP-RADIO-001.mp3'
      ],
      normalStartFile: 'CRAP-RADIO-002.mp3'
    }
  };

  const style = document.createElement('style');
  style.id = 'crap-radio-player-style';
  style.textContent = `
    #crap-radio-player{--crap-radio-height:72px;display:inline-flex;align-items:stretch;width:calc((var(--crap-radio-height)*10/3) + var(--crap-radio-height));height:var(--crap-radio-height);flex:0 0 auto;overflow:hidden;background:#000;box-sizing:border-box;margin:82px auto 0}
    #crap-radio-player,#crap-radio-player *{box-sizing:border-box}
    .crap-radio-artwork{display:block;flex:0 0 auto;width:calc(var(--crap-radio-height)*10/3);height:var(--crap-radio-height);margin:0;padding:0;object-fit:contain;object-position:left center;background:#000;user-select:none;pointer-events:none}
    .crap-radio-toggle{position:relative;display:grid;place-items:center;flex:0 0 var(--crap-radio-height);width:var(--crap-radio-height);min-width:var(--crap-radio-height);height:var(--crap-radio-height);margin:0;padding:0;border:0;border-left:1px solid rgba(255,255,255,.65);border-radius:0;background:#000;color:#fff;cursor:pointer;appearance:none;-webkit-appearance:none}
    .crap-radio-toggle:hover,.crap-radio-toggle:focus-visible{outline:none;background:#111}
    .crap-radio-icon{display:block;width:0;height:0;border-top:13px solid transparent;border-bottom:13px solid transparent;border-left:21px solid currentColor;margin-left:4px}
    #crap-radio-player.is-playing .crap-radio-icon{width:20px;height:26px;margin-left:0;border:0;background:linear-gradient(to right,currentColor 0,currentColor 7px,transparent 7px,transparent 13px,currentColor 13px,currentColor 20px)}
    #crap-radio-player audio{display:none}
    @media(max-width:920px){#crap-radio-player{--crap-radio-height:64px;margin-top:72px}.crap-radio-icon{border-top-width:11px;border-bottom-width:11px;border-left-width:18px}#crap-radio-player.is-playing .crap-radio-icon{width:18px;height:23px;background:linear-gradient(to right,currentColor 0,currentColor 6px,transparent 6px,transparent 12px,currentColor 12px,currentColor 18px)}}
    @media(max-width:680px){#crap-radio-player{--crap-radio-height:62px;margin:70px auto 0}}
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
  audio.setAttribute('playsinline','');
  audio.setAttribute('webkit-playsinline','');

  player.append(artwork,button,audio);
  const sidebar = document.querySelector('.sidebar');
  (sidebar || document.body).appendChild(player);

  let library = cloneLibrary(FALLBACK_LIBRARY);
  let librarySignature = '';
  let tracks = [];
  let broadcastSchedule = library.schedule;
  let currentTrackIndex = 0;
  let startedAt = Date.parse(library.startedAt);
  let totalDuration = 0;
  let durationsReady = false;
  let wantsPlayback = false;
  let switchingTrack = false;
  let startupMuted = false;
  let sequentialReverseActive = true;
  let statsHeartbeatTimer = null;
  let probeGeneration = 0;

  function cloneLibrary(source){
    return {
      ...source,
      files:[...(source.files || [])],
      schedule:source.schedule ? {...source.schedule,reverseFiles:[...(source.schedule.reverseFiles || [])]} : null
    };
  }

  function signatureFor(data){
    return JSON.stringify({startedAt:data.startedAt,baseUrl:data.baseUrl,files:data.files,schedule:data.schedule});
  }

  function absoluteTrackUrl(file,baseUrl){
    return new URL(encodeURIComponent(file),baseUrl).href;
  }

  function buildTracks(nextLibrary){
    const baseUrl = nextLibrary.baseUrl || FALLBACK_LIBRARY.baseUrl;
    const files = Array.isArray(nextLibrary.files) && nextLibrary.files.length ? nextLibrary.files : FALLBACK_LIBRARY.files;
    tracks = files.map(file => ({file,url:absoluteTrackUrl(file,baseUrl),duration:null}));
    broadcastSchedule = nextLibrary.schedule || null;
    const parsed = Date.parse(nextLibrary.startedAt || FALLBACK_LIBRARY.startedAt);
    if (Number.isFinite(parsed)) startedAt = parsed;
    totalDuration = 0;
    durationsReady = false;
    sequentialReverseActive = broadcastSchedule?.mode === 'reverse-once-then-normal';
  }

  function getReverseIndices(){
    if (broadcastSchedule?.mode !== 'reverse-once-then-normal') return null;
    const list = Array.isArray(broadcastSchedule.reverseFiles) ? broadcastSchedule.reverseFiles : [];
    if (!list.length) return null;
    const indices = list.map(file => tracks.findIndex(track => track.file === file));
    return indices.every(index => index >= 0) ? indices : null;
  }

  function getNormalStartIndex(){
    const file = broadcastSchedule?.normalStartFile;
    const index = file ? tracks.findIndex(track => track.file === file) : -1;
    return index >= 0 ? index : 0;
  }

  function getProvisionalStart(){
    const elapsed = Number.isFinite(startedAt) ? Math.max(0,(Date.now()-startedAt)/1000) : 0;
    const reverse = getReverseIndices();
    if (reverse?.length) return {index:reverse[0],offset:elapsed};
    return {index:0,offset:elapsed};
  }

  function positionInOrder(position,indices){
    for (let i=0;i<indices.length;i+=1){
      const index = indices[i];
      const duration = tracks[index]?.duration;
      if (!(duration>0)) return null;
      if (position < duration || i === indices.length-1){
        return {index,offset:Math.min(position,Math.max(0,duration-.1))};
      }
      position -= duration;
    }
    return null;
  }

  function getLivePosition(){
    if (!durationsReady || totalDuration<=0 || !Number.isFinite(startedAt)) return null;
    const elapsed = Math.max(0,(Date.now()-startedAt)/1000);
    const normal = tracks.map((_,index)=>index);
    const reverse = getReverseIndices();

    if (reverse?.length){
      const reverseDuration = reverse.reduce((sum,index)=>sum+tracks[index].duration,0);
      if (elapsed < reverseDuration){
        sequentialReverseActive = true;
        return positionInOrder(elapsed,reverse);
      }
      sequentialReverseActive = false;
      const normalStart = getNormalStartIndex();
      const phaseOffset = tracks.slice(0,normalStart).reduce((sum,track)=>sum+track.duration,0);
      return positionInOrder((phaseOffset + elapsed - reverseDuration) % totalDuration,normal);
    }

    sequentialReverseActive = false;
    return positionInOrder(elapsed % totalDuration,normal);
  }

  function setMediaPlaybackState(state){
    if (!('mediaSession' in navigator)) return;
    try{ navigator.mediaSession.playbackState = state; }catch(_){}
  }

  function updateMediaPosition(){
    if (!('mediaSession' in navigator) || typeof navigator.mediaSession.setPositionState !== 'function') return;
    if (!Number.isFinite(audio.duration) || audio.duration<=0 || !Number.isFinite(audio.currentTime)) return;
    try{
      navigator.mediaSession.setPositionState({duration:audio.duration,playbackRate:audio.playbackRate||1,position:Math.min(Math.max(0,audio.currentTime),audio.duration)});
    }catch(_){}
  }

  function setPlayingUI(playing){
    player.classList.toggle('is-playing',playing);
    button.setAttribute('aria-label',playing?'Pause CRAP RADIO':'Play CRAP RADIO');
    button.title = playing?'Pause CRAP RADIO':'Play CRAP RADIO';
    setMediaPlaybackState(playing?'playing':'paused');
  }

  function loadTrack(index,offset=0,autoplay=false){
    if (!tracks[index]) return;
    switchingTrack = true;
    currentTrackIndex = index;
    const target = tracks[index];
    const sourceChanged = audio.src !== target.url;
    if (sourceChanged){
      audio.src = target.url;
      audio.load();
    }

    const applyOffset = () => {
      if (Number.isFinite(audio.duration) && audio.duration>0){
        const max = Math.max(0,audio.duration-.1);
        try{ audio.currentTime = Math.min(Math.max(0,offset),max); }catch(_){}
      }
      switchingTrack = false;
      updateMediaPosition();
      if (autoplay && audio.paused){
        const p = audio.play();
        if (p?.catch) p.catch(()=>setPlayingUI(false));
      }
    };

    if (audio.readyState < 1) audio.addEventListener('loadedmetadata',applyOffset,{once:true});
    else applyOffset();
  }

  function syncToBroadcastClock(){
    const live = getLivePosition();
    if (!live || switchingTrack) return false;
    if (currentTrackIndex !== live.index || audio.src !== tracks[live.index]?.url){
      loadTrack(live.index,live.offset,wantsPlayback);
      return true;
    }
    if (Math.abs(audio.currentTime-live.offset)>1.5){
      try{ audio.currentTime = live.offset; }catch(_){}
    }
    updateMediaPosition();
    return true;
  }

  function nextSequentialIndex(){
    const reverse = getReverseIndices();
    if (sequentialReverseActive && reverse?.length){
      const pos = reverse.indexOf(currentTrackIndex);
      if (pos>=0 && pos<reverse.length-1) return reverse[pos+1];
      if (pos===reverse.length-1){
        sequentialReverseActive = false;
        return getNormalStartIndex();
      }
      return reverse[0];
    }
    return (currentTrackIndex+1) % tracks.length;
  }

  function goToNextTrack(){
    if (!tracks.length) return;
    const live = getLivePosition();
    if (live) loadTrack(live.index,live.offset,wantsPlayback);
    else loadTrack(nextSequentialIndex(),0,wantsPlayback);
  }

  function probeDuration(track){
    return new Promise((resolve,reject)=>{
      const probe = new Audio();
      probe.preload = 'metadata';
      probe.src = track.url;
      let done = false;
      const timer = setTimeout(()=>finish(new Error('metadata timeout')),30000);
      function finish(error,duration){
        if (done) return;
        done = true;
        clearTimeout(timer);
        probe.removeAttribute('src');
        try{ probe.load(); }catch(_){}
        if (error || !Number.isFinite(duration) || duration<=0) reject(error || new Error('invalid duration'));
        else resolve(duration);
      }
      probe.addEventListener('loadedmetadata',()=>finish(null,probe.duration),{once:true});
      probe.addEventListener('error',()=>finish(new Error('metadata error')),{once:true});
      probe.load();
    });
  }

  async function probeDurations(){
    const generation = ++probeGeneration;
    const localTracks = tracks.slice();
    const results = await Promise.allSettled(localTracks.map(probeDuration));
    if (generation !== probeGeneration || localTracks.length !== tracks.length) return;
    if (results.some(result=>result.status!=='fulfilled')){
      console.warn('CRAP RADIO: duration probe incomplete; schedule-aware sequential fallback active.');
      if (startupMuted){ startupMuted=false; audio.muted=false; }
      return;
    }
    results.forEach((result,index)=>{ tracks[index].duration=result.value; });
    totalDuration = tracks.reduce((sum,track)=>sum+track.duration,0);
    durationsReady = totalDuration>0;
    if (durationsReady){
      const live = getLivePosition();
      if (live) loadTrack(live.index,live.offset,wantsPlayback);
      if (startupMuted){
        startupMuted=false;
        audio.muted=false;
      }
    }
  }

  async function refreshLibrary(force=false){
    try{
      const separator = LIBRARY_URL.includes('?') ? '&' : '?';
      const response = await fetch(`${LIBRARY_URL}${separator}t=${Date.now()}`,{cache:'no-store'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!data || !Array.isArray(data.files) || !data.files.length) throw new Error('invalid library');
      const nextSignature = signatureFor(data);
      if (!force && nextSignature === librarySignature) return;

      library = cloneLibrary(data);
      librarySignature = nextSignature;
      buildTracks(library);

      const provisional = getProvisionalStart();
      loadTrack(provisional.index,provisional.offset,wantsPlayback);
      probeDurations();
    }catch(error){
      if (force) console.warn('CRAP RADIO: library fetch failed; current fallback remains active.',error);
    }
  }

  function playRadio(){
    wantsPlayback = true;
    setPlayingUI(true);
    if (durationsReady) syncToBroadcastClock();
    else {
      startupMuted = true;
      audio.muted = true;
      const provisional = getProvisionalStart();
      if (currentTrackIndex !== provisional.index || !audio.src) loadTrack(provisional.index,provisional.offset,false);
    }
    const p = audio.play();
    if (p?.catch) p.catch(error=>{setPlayingUI(false);console.warn('CRAP RADIO could not start playback.',error);});
  }

  function pauseRadio(){
    wantsPlayback = false;
    audio.pause();
    stopStatsHeartbeat();
    setPlayingUI(false);
  }

  function recoverBackgroundPlayback(){
    if (!wantsPlayback) return;
    if (durationsReady) syncToBroadcastClock();
    if (audio.paused){ const p=audio.play(); if (p?.catch) p.catch(()=>{}); }
  }

  function getCurrentMixId(){
    const file = tracks[currentTrackIndex]?.file || '';
    const match = file.match(/(?:^|[^0-9])(\d{3})(?=[^0-9]|$)/);
    return match ? match[1] : null;
  }

  function createStatsSessionId(){
    const key='crap-radio-stats-session';
    try{
      const old=sessionStorage.getItem(key);
      if (old) return old;
      const id=crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(key,id);
      return id;
    }catch(_){ return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`; }
  }

  const statsSessionId = createStatsSessionId();
  async function sendStatsHeartbeat(){
    if (!wantsPlayback || audio.paused || audio.ended) return;
    const mixId=getCurrentMixId();
    if (!mixId) return;
    try{
      await fetch(STATS_HEARTBEAT_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:statsSessionId,mixId}),cache:'no-store',credentials:'omit',keepalive:true});
    }catch(_){}
  }
  function startStatsHeartbeat(){ if (!statsHeartbeatTimer) statsHeartbeatTimer=setInterval(sendStatsHeartbeat,STATS_INTERVAL_MS); }
  function stopStatsHeartbeat(){ if (statsHeartbeatTimer){clearInterval(statsHeartbeatTimer);statsHeartbeatTimer=null;} }

  function setupMediaSession(){
    try{ if ('audioSession' in navigator && navigator.audioSession) navigator.audioSession.type='playback'; }catch(_){}
    if (!('mediaSession' in navigator)) return;
    try{
      if (typeof MediaMetadata==='function') navigator.mediaSession.metadata=new MediaMetadata({title:'CRAP RADIO',artist:'CRAP PRODUCTIONS',album:'TRANSMITTING FROM CRAP HQ'});
    }catch(_){}
    try{navigator.mediaSession.setActionHandler('play',playRadio);}catch(_){}
    try{navigator.mediaSession.setActionHandler('pause',pauseRadio);}catch(_){}
    setMediaPlaybackState('paused');
  }

  button.addEventListener('click',()=>{ if (wantsPlayback && !audio.paused) pauseRadio(); else playRadio(); });
  audio.addEventListener('play',()=>{ if (wantsPlayback){setPlayingUI(true);startStatsHeartbeat();} updateMediaPosition(); });
  audio.addEventListener('pause',()=>{stopStatsHeartbeat();if(!audio.ended&&!wantsPlayback)setPlayingUI(false);updateMediaPosition();});
  audio.addEventListener('loadedmetadata',updateMediaPosition);
  audio.addEventListener('durationchange',updateMediaPosition);
  audio.addEventListener('timeupdate',updateMediaPosition);
  audio.addEventListener('ended',()=>{stopStatsHeartbeat();if(wantsPlayback)goToNextTrack();});
  audio.addEventListener('error',()=>{stopStatsHeartbeat();if(wantsPlayback&&!switchingTrack)setTimeout(goToNextTrack,500);});

  buildTracks(library);
  librarySignature = signatureFor(library);
  const initial = getProvisionalStart();
  loadTrack(initial.index,initial.offset,false);
  setupMediaSession();
  refreshLibrary(true);

  document.addEventListener('visibilitychange',()=>{if(!document.hidden)recoverBackgroundPlayback();});
  window.addEventListener('pageshow',recoverBackgroundPlayback);
  window.addEventListener('focus',()=>{if(!document.hidden)recoverBackgroundPlayback();});

  setInterval(()=>{ if(wantsPlayback&&durationsReady&&!document.hidden)syncToBroadcastClock(); },30000);
  setInterval(()=>refreshLibrary(false),LIBRARY_REFRESH_MS);

  window.CrapRadio = {
    player,audio,
    get tracks(){return tracks.slice();},
    get currentTrackIndex(){return currentTrackIndex;},
    get currentMixId(){return getCurrentMixId();},
    get totalDuration(){return totalDuration;},
    get startedAt(){return startedAt;},
    syncToBroadcastClock,recoverBackgroundPlayback,refreshLibrary
  };

  if (!window.__CRAP_RADIO_PERSIST_READY && !document.querySelector('script[src*="radio-persist.js"]')){
    const persistScript=document.createElement('script');
    persistScript.src='radio-persist.js?v=20260821e';
    persistScript.defer=true;
    document.body.appendChild(persistScript);
  }
})();

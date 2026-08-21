(() => {
  if (document.getElementById("crap-radio-player")) return;

  const config = window.CRAP_RADIO_CONFIG || {};
  const audioSource = typeof config.source === "string" ? config.source.trim() : "";

  const style = document.createElement("style");
  style.id = "crap-radio-player-style";
  style.textContent = `
    #crap-radio-player {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 10000;
      display: flex;
      align-items: stretch;
      width: 330px;
      height: 86px;
      background: #000;
      color: #fff;
      border: 2px solid #fff;
      box-shadow: 0 0 0 1px #000;
      font-family: Arial, Helvetica, sans-serif;
      box-sizing: border-box;
    }

    #crap-radio-player *,
    #crap-radio-player *::before,
    #crap-radio-player *::after {
      box-sizing: border-box;
    }

    #crap-radio-player.is-home {
      position: static;
      right: auto;
      bottom: auto;
      width: min(460px, 100%);
      height: 112px;
      box-shadow: none;
    }

    .crap-radio-label {
      min-width: 0;
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 10px 16px 11px;
      overflow: hidden;
      user-select: none;
    }

    .crap-radio-kicker {
      display: block;
      margin: 0 0 3px;
      font-size: 12px;
      font-weight: 400;
      line-height: 1;
      letter-spacing: 0.12em;
      white-space: nowrap;
    }

    .crap-radio-hq {
      display: block;
      margin: 0;
      font-size: 38px;
      font-weight: 300;
      line-height: 0.96;
      letter-spacing: 0.04em;
      white-space: nowrap;
    }

    #crap-radio-player.is-home .crap-radio-kicker {
      font-size: 15px;
      margin-bottom: 5px;
    }

    #crap-radio-player.is-home .crap-radio-hq {
      font-size: 50px;
    }

    .crap-radio-toggle {
      width: 82px;
      min-width: 82px;
      padding: 0;
      border: 0;
      border-left: 2px solid #fff;
      border-radius: 0;
      background: #000;
      color: #fff;
      font: inherit;
      cursor: pointer;
      display: grid;
      place-items: center;
      appearance: none;
      -webkit-appearance: none;
    }

    #crap-radio-player.is-home .crap-radio-toggle {
      width: 106px;
      min-width: 106px;
    }

    .crap-radio-toggle:hover,
    .crap-radio-toggle:focus-visible {
      background: #fff;
      color: #000;
      outline: none;
    }

    .crap-radio-icon {
      display: block;
      width: 0;
      height: 0;
      border-top: 15px solid transparent;
      border-bottom: 15px solid transparent;
      border-left: 24px solid currentColor;
      margin-left: 5px;
    }

    #crap-radio-player.is-home .crap-radio-icon {
      border-top-width: 19px;
      border-bottom-width: 19px;
      border-left-width: 30px;
    }

    #crap-radio-player.is-playing .crap-radio-icon {
      width: 24px;
      height: 30px;
      border: 0;
      margin-left: 0;
      background: linear-gradient(
        to right,
        currentColor 0,
        currentColor 8px,
        transparent 8px,
        transparent 16px,
        currentColor 16px,
        currentColor 24px
      );
    }

    #crap-radio-player.is-home.is-playing .crap-radio-icon {
      width: 30px;
      height: 38px;
      background: linear-gradient(
        to right,
        currentColor 0,
        currentColor 10px,
        transparent 10px,
        transparent 20px,
        currentColor 20px,
        currentColor 30px
      );
    }

    #crap-radio-player audio {
      display: none;
    }

    @media (max-width: 680px) {
      #crap-radio-player {
        right: 12px;
        bottom: 12px;
        width: 270px;
        height: 72px;
      }

      #crap-radio-player.is-home {
        width: min(100%, 360px);
        height: 94px;
      }

      .crap-radio-label {
        padding: 9px 12px 10px;
      }

      .crap-radio-kicker {
        font-size: 10px;
        letter-spacing: 0.1em;
      }

      .crap-radio-hq {
        font-size: 31px;
      }

      #crap-radio-player.is-home .crap-radio-kicker {
        font-size: 12px;
        margin-bottom: 4px;
      }

      #crap-radio-player.is-home .crap-radio-hq {
        font-size: 40px;
      }

      .crap-radio-toggle {
        width: 68px;
        min-width: 68px;
      }

      #crap-radio-player.is-home .crap-radio-toggle {
        width: 84px;
        min-width: 84px;
      }

      .crap-radio-icon {
        border-top-width: 12px;
        border-bottom-width: 12px;
        border-left-width: 20px;
      }

      #crap-radio-player.is-home .crap-radio-icon {
        border-top-width: 15px;
        border-bottom-width: 15px;
        border-left-width: 24px;
      }

      #crap-radio-player.is-playing .crap-radio-icon {
        width: 20px;
        height: 26px;
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

      #crap-radio-player.is-home.is-playing .crap-radio-icon {
        width: 24px;
        height: 30px;
        background: linear-gradient(
          to right,
          currentColor 0,
          currentColor 8px,
          transparent 8px,
          transparent 16px,
          currentColor 16px,
          currentColor 24px
        );
      }
    }
  `;
  document.head.appendChild(style);

  const player = document.createElement("div");
  player.id = "crap-radio-player";
  player.setAttribute("role", "group");
  player.setAttribute("aria-label", "CRAP RADIO");

  const label = document.createElement("div");
  label.className = "crap-radio-label";

  const kicker = document.createElement("span");
  kicker.className = "crap-radio-kicker";
  kicker.textContent = "TRANSMITTING FROM";

  const hq = document.createElement("span");
  hq.className = "crap-radio-hq";
  hq.textContent = "CRAP HQ";

  label.append(kicker, hq);

  const button = document.createElement("button");
  button.className = "crap-radio-toggle";
  button.type = "button";
  button.setAttribute("aria-label", "Play CRAP RADIO");
  button.title = audioSource ? "Play CRAP RADIO" : "CRAP RADIO source will be connected later";

  const icon = document.createElement("span");
  icon.className = "crap-radio-icon";
  icon.setAttribute("aria-hidden", "true");
  button.appendChild(icon);

  const audio = document.createElement("audio");
  audio.id = "crap-radio-audio";
  audio.preload = "none";
  if (audioSource) audio.src = audioSource;

  player.append(label, button, audio);

  function isHomePath() {
    const path = window.location.pathname.replace(/\/+$/, "");
    return path === "" || path === "/index.html";
  }

  function updatePlacement() {
    const homeMount = document.getElementById("crap-radio-home-mount");
    const shouldUseHomeMount = Boolean(homeMount && isHomePath());

    player.classList.toggle("is-home", shouldUseHomeMount);

    if (shouldUseHomeMount) {
      if (player.parentNode !== homeMount) homeMount.appendChild(player);
    } else if (player.parentNode !== document.body) {
      document.body.appendChild(player);
    }
  }

  updatePlacement();

  async function playRadio() {
    if (!audioSource) return;

    try {
      await audio.play();
    } catch (error) {
      console.warn("CRAP RADIO could not start playback.", error);
    }
  }

  function pauseRadio() {
    audio.pause();
  }

  button.addEventListener("click", () => {
    if (audio.paused) {
      playRadio();
    } else {
      pauseRadio();
    }
  });

  audio.addEventListener("play", () => {
    player.classList.add("is-playing");
    button.setAttribute("aria-label", "Pause CRAP RADIO");
    button.title = "Pause CRAP RADIO";
  });

  audio.addEventListener("pause", () => {
    player.classList.remove("is-playing");
    button.setAttribute("aria-label", "Play CRAP RADIO");
    button.title = audioSource ? "Play CRAP RADIO" : "CRAP RADIO source will be connected later";
  });

  window.CrapRadio = {
    player,
    audio,
    updatePlacement
  };
})();

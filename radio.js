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
      height: 58px;
      background: #fff;
      color: #000;
      border: 2px solid #000;
      font-family: Arial, Helvetica, sans-serif;
      letter-spacing: 0.04em;
      box-sizing: border-box;
    }

    #crap-radio-player *,
    #crap-radio-player *::before,
    #crap-radio-player *::after {
      box-sizing: border-box;
    }

    .crap-radio-label {
      display: flex;
      align-items: center;
      padding: 0 14px;
      font-size: 14px;
      font-weight: 700;
      line-height: 1;
      white-space: nowrap;
      user-select: none;
    }

    .crap-radio-toggle {
      width: 56px;
      min-width: 56px;
      height: 54px;
      padding: 0;
      border: 0;
      border-left: 2px solid #000;
      border-radius: 0;
      background: #fff;
      color: #000;
      font: inherit;
      cursor: pointer;
      display: grid;
      place-items: center;
      appearance: none;
      -webkit-appearance: none;
    }

    .crap-radio-toggle:hover,
    .crap-radio-toggle:focus-visible {
      background: #000;
      color: #fff;
      outline: none;
    }

    .crap-radio-icon {
      display: block;
      width: 0;
      height: 0;
      border-top: 8px solid transparent;
      border-bottom: 8px solid transparent;
      border-left: 13px solid currentColor;
      margin-left: 3px;
    }

    #crap-radio-player.is-playing .crap-radio-icon {
      width: 12px;
      height: 14px;
      border: 0;
      margin-left: 0;
      background: linear-gradient(
        to right,
        currentColor 0,
        currentColor 4px,
        transparent 4px,
        transparent 8px,
        currentColor 8px,
        currentColor 12px
      );
    }

    #crap-radio-player audio {
      display: none;
    }

    @media (max-width: 680px) {
      #crap-radio-player {
        right: 12px;
        bottom: 12px;
        height: 50px;
      }

      .crap-radio-label {
        padding: 0 11px;
        font-size: 12px;
      }

      .crap-radio-toggle {
        width: 48px;
        min-width: 48px;
        height: 46px;
      }

      .crap-radio-icon {
        border-top-width: 7px;
        border-bottom-width: 7px;
        border-left-width: 11px;
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
  label.textContent = "CRAP RADIO";

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
  document.body.appendChild(player);

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
})();

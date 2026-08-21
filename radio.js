(() => {
  if (document.getElementById("crap-radio-player")) return;

  const config = window.CRAP_RADIO_CONFIG || {};
  const fallbackSource = "https://pub-50928f7943944bf2a7d79fd745830758.r2.dev/wide-radio/04%20The%20Sapphires%20-%20Who%20Do%20You%20Love.mp3";
  const audioSource = typeof config.source === "string" && config.source.trim()
    ? config.source.trim()
    : fallbackSource;
  const artworkData = "data:image/png;base64,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";

  const style = document.createElement("style");
  style.id = "crap-radio-player-style";
  style.textContent = `
    #crap-radio-home-mount { display: none !important; }

    #crap-radio-player {
      display: flex;
      align-items: stretch;
      width: 312px;
      height: 72px;
      margin-top: 82px;
      align-self: center;
      background: #000;
      color: #fff;
      z-index: 30;
      line-height: 0;
    }

    #crap-radio-player *,
    #crap-radio-player *::before,
    #crap-radio-player *::after {
      box-sizing: border-box;
    }

    .crap-radio-art {
      display: block;
      width: 240px;
      height: 72px;
      object-fit: contain;
      object-position: center;
      flex: 0 0 240px;
      background: #000;
      user-select: none;
      -webkit-user-drag: none;
    }

    .crap-radio-toggle {
      width: 72px;
      min-width: 72px;
      height: 72px;
      padding: 0;
      margin: 0;
      border: 0;
      border-left: 1px solid #fff;
      border-radius: 0;
      background: #000;
      color: #fff;
      cursor: pointer;
      display: grid;
      place-items: center;
      appearance: none;
      -webkit-appearance: none;
    }

    .crap-radio-toggle:hover,
    .crap-radio-toggle:focus-visible {
      background: #111;
      outline: none;
    }

    .crap-radio-icon {
      display: block;
      width: 0;
      height: 0;
      border-top: 14px solid transparent;
      border-bottom: 14px solid transparent;
      border-left: 23px solid currentColor;
      margin-left: 4px;
    }

    #crap-radio-player.is-playing .crap-radio-icon {
      width: 22px;
      height: 29px;
      border: 0;
      margin-left: 0;
      background: linear-gradient(
        to right,
        currentColor 0,
        currentColor 7px,
        transparent 7px,
        transparent 15px,
        currentColor 15px,
        currentColor 22px
      );
    }

    #crap-radio-player audio {
      display: none;
    }

    @media (max-width: 1320px) {
      #crap-radio-player {
        margin-top: 68px;
      }
    }

    @media (max-width: 920px) and (min-width: 681px) {
      #crap-radio-player {
        width: 286px;
        height: 66px;
        margin-top: 58px;
      }

      .crap-radio-art {
        width: 220px;
        height: 66px;
        flex-basis: 220px;
      }

      .crap-radio-toggle {
        width: 66px;
        min-width: 66px;
        height: 66px;
      }
    }

    @media (max-width: 680px) {
      #crap-radio-player {
        width: 300px;
        height: 69px;
        margin-top: 70px;
        align-self: flex-start;
      }

      .crap-radio-art {
        width: 231px;
        height: 69px;
        flex-basis: 231px;
      }

      .crap-radio-toggle {
        width: 69px;
        min-width: 69px;
        height: 69px;
      }
    }
  `;
  document.head.appendChild(style);

  const player = document.createElement("div");
  player.id = "crap-radio-player";
  player.setAttribute("role", "group");
  player.setAttribute("aria-label", "CRAP RADIO");

  const artwork = document.createElement("img");
  artwork.className = "crap-radio-art";
  artwork.src = artworkData;
  artwork.alt = "TRANSMITTING FROM CRAP HQ";
  artwork.draggable = false;

  const button = document.createElement("button");
  button.className = "crap-radio-toggle";
  button.type = "button";
  button.setAttribute("aria-label", "Play CRAP RADIO");
  button.title = "Play CRAP RADIO";

  const icon = document.createElement("span");
  icon.className = "crap-radio-icon";
  icon.setAttribute("aria-hidden", "true");
  button.appendChild(icon);

  const audio = document.createElement("audio");
  audio.id = "crap-radio-audio";
  audio.preload = "none";
  audio.src = audioSource;

  player.append(artwork, button, audio);

  const nav = document.querySelector(".sidebar .image-nav");
  const sidebar = document.querySelector(".sidebar");
  if (nav && sidebar) {
    nav.insertAdjacentElement("afterend", player);
  } else {
    document.body.appendChild(player);
  }

  async function playRadio() {
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
    button.title = "Play CRAP RADIO";
  });

  window.CrapRadio = { player, audio };
})();

// [Persistent Auto-Bypass with Force Focus]
(function() {
  function triggerEnter(el) {
    if (typeof el.focus === 'function') el.focus();
    const ev = new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter' });
    Object.defineProperty(ev, 'keyCode', { get: () => 13 });
    Object.defineProperty(ev, 'which', { get: () => 13 });
    el.dispatchEvent(ev);
  }
  let backTime = 0;
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.keyCode === 27 || e.keyCode === 4) {
      if (!location.hash.includes('watch')) backTime = Date.now();
    }
  }, true);
  setInterval(() => {
    if (Date.now() - backTime < 2500) return;
    const tile = document.querySelector('.ytLrCarouselAccountTile') || document.activeElement;
    if (tile && (tile.classList.contains('ytLrCarouselAccountTile') || tile.closest('.ytLrCarouselAccountTile'))) {
      const target = tile.classList.contains('ytLrCarouselAccountTile') ? tile : tile.closest('.ytLrCarouselAccountTile');
      triggerEnter(target);
    }
  }, 200);
})();

// [Disable Voice Search & PiP]
delete window.SpeechRecognition;
delete window.webkitSpeechRecognition;
if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = undefined;
try { Object.defineProperty(document, "pictureInPictureEnabled", { get: () => false }); } catch(e){}

// [Root Viewport Lock - Prevent Spatial Scroll Panning]
(function() {
  const lock = () => {
    if (window.scrollX !== 0 || window.scrollY !== 0) window.scrollTo(0, 0);
    if (document.documentElement.scrollTop !== 0) document.documentElement.scrollTop = 0;
  };
  window.addEventListener('scroll', lock, { passive: true });
  window.addEventListener('resize', lock, { passive: true });
  
  const s = document.createElement('style');
  s.textContent = `
    html, body {
      overflow: hidden !important;
      position: fixed !important;
      width: 100vw !important;
      height: 100vh !important;
      margin: 0 !important;
      padding: 0 !important;
      top: 0 !important;
      left: 0 !important;
    }
  `;
  document.documentElement.appendChild(s);
})();

// [Tectonic GPU & Telemetry Shield - Fully Hardened]
(function() {
  const isPing = (u) => typeof u === "string" && (u.includes("/api/stats/") || u.includes("/log_event"));
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(m, u) {
    if (isPing(u)) { this.send = () => {}; return; }
    return origOpen.apply(this, arguments);
  };
  if (window.fetch) {
    const origF = window.fetch;
    window.fetch = function(inp) {
      const u = typeof inp === "string" ? inp : (inp && inp.url);
      if (isPing(u)) return Promise.resolve(new Response(""));
      return origF.apply(this, arguments);
    };
  }
  if (navigator.sendBeacon) {
    const origB = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = (u) => isPing(u) ? true : origB.apply(this, arguments);
  }
  const s = document.createElement("style");
  s.textContent = "* { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; } [idomkey] { box-shadow: none !important; text-shadow: none !important; } #cinematic-container, [idomkey=\"cinematicContainer\"] { display: none !important; }";
  document.documentElement.appendChild(s);
})();

// [Low-Memory Profile]
(function() {
  try {
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 1, configurable: true });
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 2, configurable: true });
  } catch (e) {}
})();

// 1080p native UI enabled: 4K viewport spoof removed


/* Start TizenTubeScripts.js */

(function () {
  "use strict";

  const CONFIG_KEY = "ytaf-configuration";
  const defaultConfig = {
    enableAdBlock: true,
    enableSponsorBlock: true,
    sponsorBlockManualSkips: [],
    enableSponsorBlockSponsor: true,
    enableSponsorBlockIntro: true,
    enableSponsorBlockOutro: true,
    enableSponsorBlockInteraction: true,
    enableSponsorBlockSelfPromo: true,
    enableSponsorBlockMusicOfftopic: true,
    enableShorts: true,
  };

  let localConfig;

  try {
    localConfig = JSON.parse(window.localStorage[CONFIG_KEY]);
  } catch (err) {
    //console.warn('Config read failed:', err);
    localConfig = defaultConfig;
  }

  window.localConfig = window.localStorage[CONFIG_KEY]
    ? JSON.parse(window.localStorage[CONFIG_KEY])
    : defaultConfig;

  window.configRead = function (key) {
    if (window.localConfig[key] === undefined) {
      window.localConfig[key] = defaultConfig[key];
    }
    return window.localConfig[key];
  };

  window.configWrite = function (key, value) {
    window.localConfig[key] = value;
    window.localStorage[CONFIG_KEY] = JSON.stringify(window.localConfig);
  };

  const showToast = () => {};

  /**
   * This is a minimal reimplementation of the following uBlock Origin rule:
   * https://github.com/uBlockOrigin/uAssets/blob/3497eebd440f4871830b9b45af0afc406c6eb593/filters/filters.txt#L116
   *
   * This in turn calls the following snippet:
   * https://github.com/gorhill/uBlock/blob/bfdc81e9e400f7b78b2abc97576c3d7bf3a11a0b/assets/resources/scriptlets.js#L365-L470
   *
   * Seems like for now dropping just the adPlacements is enough for YouTube TV
   */
  const blockedTokens = ["sport", "podcast", "movie", "film", "live", "na żywo", "gaming", "gry", "subscription", "subskrypcj", "library", "bibliotek", "more", "więcej", "short"];
  function stripGuideItems(obj) {
    if (!obj || typeof obj !== "object") return;
    for (let k in obj) {
      if (Array.isArray(obj[k])) {
        obj[k] = obj[k].filter(it => {
          const target = it?.guideEntryRenderer || it?.pivotBarItemRenderer;
          if (!target) return true;
          const s = JSON.stringify(target).toLowerCase();
          return !blockedTokens.some(tok => s.includes(tok));
        });
        obj[k].forEach(stripGuideItems);
      } else if (typeof obj[k] === "object") {
        stripGuideItems(obj[k]);
      }
    }
  }

  const origParse = JSON.parse;
  JSON.parse = function () {
    const r = origParse.apply(this, arguments);
    if (r) stripGuideItems(r);
    if (r.adPlacements && configRead("enableAdBlock")) {
      r.adPlacements = [];
    }

    // Also set playerAds to false, just incase.
    if (r.playerAds && configRead("enableAdBlock")) {
      r.playerAds = false;
    }

    // Also set adSlots to an empty array, emptying only the adPlacements won't work.
    if (r.adSlots && configRead("enableAdBlock")) {
      r.adSlots = [];
    }

    // Drop "masthead" ad from home screen
    if (
      r?.contents?.tvBrowseRenderer?.content?.tvSurfaceContentRenderer?.content
        ?.sectionListRenderer?.contents &&
      configRead("enableAdBlock")
    ) {
      const s = r.contents.tvBrowseRenderer.content.tvSurfaceContentRenderer.content.sectionListRenderer.contents[0];
      s.shelfRenderer.content.horizontalListRenderer.items =
      s.shelfRenderer.content.horizontalListRenderer.items.filter(i => !i?.adSlotRenderer)
    }

    if (
      !configRead("enableShorts") &&
      r?.contents?.tvBrowseRenderer?.content?.tvSurfaceContentRenderer?.content
    ) {
      r.contents.tvBrowseRenderer.content.tvSurfaceContentRenderer.content.sectionListRenderer.contents =
        r.contents.tvBrowseRenderer.content.tvSurfaceContentRenderer.content.sectionListRenderer.contents.filter(
          (shelve) =>
            shelve.shelfRenderer?.tvhtml5ShelfRendererType !==
            "TVHTML5_SHELF_RENDERER_TYPE_SHORTS"
        );
    }

    return r;
  };


  // The tiny-sha256 module, edited to export itself.
  var sha256 = function sha256(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var lengthProperty = "length";
    var i, j; // Used as a counter across the whole file
    var result = "";

    var words = [];
    var asciiBitLength = ascii[lengthProperty] * 8;

    //* caching results is optional - remove/add slash from front of this line to toggle
    // Initial hash value: first 32 bits of the fractional parts of the square roots of the first 8 primes
    // (we actually calculate the first 64, but extra values are just ignored)
    var hash = (sha256.h = sha256.h || []);
    // Round constants: first 32 bits of the fractional parts of the cube roots of the first 64 primes
    var k = (sha256.k = sha256.k || []);
    var primeCounter = k[lengthProperty];
    /*/
        var hash = [], k = [];
        var primeCounter = 0;
        //*/

    var isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) {
          isComposite[i] = candidate;
        }
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }

    ascii += "\x80"; // Append '1' bit (plus zero padding)
    while ((ascii[lengthProperty] % 64) - 56) ascii += "\x00"; // More zero padding
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return; // ASCII check: only accept characters in range 0-255
      words[i >> 2] |= j << (((3 - i) % 4) * 8);
    }
    words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
    words[words[lengthProperty]] = asciiBitLength;

    // process each chunk
    for (j = 0; j < words[lengthProperty]; ) {
      var w = words.slice(j, (j += 16)); // The message is expanded into 64 words as part of the iteration
      var oldHash = hash;
      // This is now the "working hash", often labelled as variables a...g
      // (we have to truncate as well, otherwise extra entries at the end accumulate
      hash = hash.slice(0, 8);

      for (i = 0; i < 64; i++) {
        // Expand the message into 64 words
        // Used below if
        var w15 = w[i - 15],
          w2 = w[i - 2];

        // Iterate
        var a = hash[0],
          e = hash[4];
        var temp1 =
          hash[7] +
          (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + // S1
          ((e & hash[5]) ^ (~e & hash[6])) + // ch
          k[i] +
          // Expand the message schedule if needed
          (w[i] =
            i < 16
              ? w[i]
              : (w[i - 16] +
                  (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + // s0
                  w[i - 7] +
                  (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | // s1
                0);
        // This is only used once, so *could* be moved below, but it only saves 4 bytes and makes things unreadble
        var temp2 =
          (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + // S0
          ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2])); // maj

        hash = [(temp1 + temp2) | 0].concat(hash); // We don't bother trimming off the extra ones, they're harmless as long as we're truncating when we do the slice()
        hash[4] = (hash[4] + temp1) | 0;
      }

      for (i = 0; i < 8; i++) {
        hash[i] = (hash[i] + oldHash[i]) | 0;
      }
    }

    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) {
        var b = (hash[i] >> (j * 8)) & 255;
        result += (b < 16 ? 0 : "") + b.toString(16);
      }
    }
    return result;
  };

  // Copied from https://github.com/ajayyy/SponsorBlock/blob/9392d16617d2d48abb6125c00e2ff6042cb7bebe/src/config.ts#L179-L233
  const barTypes = {
    sponsor: {
      color: "#00d400",
      opacity: "0.7",
      name: "sponsored segment",
    },
    intro: {
      color: "#00ffff",
      opacity: "0.7",
      name: "intro",
    },
    outro: {
      color: "#0202ed",
      opacity: "0.7",
      name: "outro",
    },
    interaction: {
      color: "#cc00ff",
      opacity: "0.7",
      name: "interaction reminder",
    },
    selfpromo: {
      color: "#ffff00",
      opacity: "0.7",
      name: "self-promotion",
    },
    music_offtopic: {
      color: "#ff9900",
      opacity: "0.7",
      name: "non-music part",
    },
  };

  const sponsorblockAPI = "https://api.sponsor.ajay.app/api";

  class SponsorBlockHandler {
    video = null;
    active = true;

    attachVideoTimeout = null;
    nextSkipTimeout = null;
    sliderInterval = null;

    observer = null;
    scheduleSkipHandler = null;
    durationChangeHandler = null;
    segments = null;
    skippableCategories = [];
    manualSkippableCategories = [];

    constructor(videoID) {
      this.videoID = videoID;
    }

    async init() {
      if (!configRead("enableSponsorBlock")) return;

      const videoHash = sha256(this.videoID).substring(0, 4);
      const categories = [
        "sponsor",
        "intro",
        "outro",
        "interaction",
        "selfpromo",
        "music_offtopic",
      ];

      const sbRes = await fetch(`${sponsorblockAPI}/skipSegments/${videoHash}?categories=${encodeURIComponent(JSON.stringify(categories))}`).catch(() => null);
      if (!sbRes || !sbRes.ok) return;
      const result = await sbRes.json().catch(() => null);

      if (!result || !result.segments || !result.segments.length) {
        return;
      }

      this.segments = result.segments;
      this.manualSkippableCategories = configRead("sponsorBlockManualSkips");
      this.skippableCategories = this.getSkippableCategories();

      this.scheduleSkipHandler = () => this.scheduleSkip();
      this.durationChangeHandler = () => this.buildOverlay();

      this.attachVideo();
      this.buildOverlay();
    }

    getSkippableCategories() {
      const skippableCategories = [];
      if (configRead("enableSponsorBlockSponsor")) {
        skippableCategories.push("sponsor");
      }
      if (configRead("enableSponsorBlockIntro")) {
        skippableCategories.push("intro");
      }
      if (configRead("enableSponsorBlockOutro")) {
        skippableCategories.push("outro");
      }
      if (configRead("enableSponsorBlockInteraction")) {
        skippableCategories.push("interaction");
      }
      if (configRead("enableSponsorBlockSelfPromo")) {
        skippableCategories.push("selfpromo");
      }
      if (configRead("enableSponsorBlockMusicOfftopic")) {
        skippableCategories.push("music_offtopic");
      }
      return skippableCategories;
    }

    attachVideo() {
      clearTimeout(this.attachVideoTimeout);
      this.attachVideoTimeout = null;

      this.video = document.querySelector("video");
      if (!this.video) {
        this.attachVideoTimeout = setTimeout(() => this.attachVideo(), 100);
        return;
      }

      this.video.addEventListener("play", this.scheduleSkipHandler);
      this.video.addEventListener("durationchange", this.durationChangeHandler);
    }

    buildOverlay() {
      if (this.segmentsoverlay) {
        return;
      }

      if (!this.video || !this.video.duration) {
        return;
      }

      const videoDuration = this.video.duration;

      this.segmentsoverlay = document.createElement("div");
      this.segments.forEach((segment) => {
        const [start, end] = segment.segment;
        const barType = barTypes[segment.category] || {
          color: "blue",
          opacity: 0.7,
        };
        const transform = `translateX(${
          (start / videoDuration) * 100.0
        }%) scaleX(${(end - start) / videoDuration})`;
        const elm = document.createElement("div");
        elm.classList.add("ytLrProgressBarPlayed");
        elm.style["background"] = barType.color;
        elm.style["opacity"] = barType.opacity;
        elm.style["-webkit-transform"] = transform;
        this.segmentsoverlay.appendChild(elm);
      });

      this.observer = new MutationObserver((mutations) => {
        mutations.forEach((m) => {
          if (m.removedNodes) {
            for (const node of m.removedNodes) {
              if (node === this.segmentsoverlay) {
                this.slider.appendChild(this.segmentsoverlay);
              }
            }
          }
        });
      });

      let sliderAttempts = 0;
      this.sliderInterval = setInterval(() => {
        this.slider = document.querySelector('[idomkey="slider"]');
        sliderAttempts++;
        if (this.slider) {
          clearInterval(this.sliderInterval);
          this.sliderInterval = null;
          this.observer.observe(this.slider, { childList: true });
          this.slider.appendChild(this.segmentsoverlay);
        } else if (sliderAttempts >= 10) {
          clearInterval(this.sliderInterval);
          this.sliderInterval = null;
        }
      }, 500);
    }

    scheduleSkip() {
      clearTimeout(this.nextSkipTimeout);
      this.nextSkipTimeout = null;

      if (!this.active || this.video.paused) return;

      const current = this.video.currentTime;

      const nextSegments = this.segments
        .filter((seg) => seg.segment[0] >= current - 0.2)
        .sort((a, b) => a.segment[0] - b.segment[0]);

      if (!nextSegments.length) return;

      const [segment] = nextSegments;
      const [start, end] = segment.segment;

      if (current >= end) return;

      const delay = Math.max(0, (start - current) * 1000);

      this.nextSkipTimeout = setTimeout(() => {
        if (this.video.paused) return;
        if (!this.skippableCategories.includes(segment.category)) return;

        const skipName = barTypes[segment.category]?.name || segment.category;
        if (!this.manualSkippableCategories.includes(segment.category)) {
          showToast("SponsorBlock", `Skipping ${skipName}`);
          this.video.currentTime = end;
          this.scheduleSkip();
        }
      }, delay);
    }

    destroy() {
      this.active = false;
      this.segments = null;

      if (this.nextSkipTimeout) {
        clearTimeout(this.nextSkipTimeout);
        this.nextSkipTimeout = null;
      }

      if (this.attachVideoTimeout) {
        clearTimeout(this.attachVideoTimeout);
        this.attachVideoTimeout = null;
      }

      if (this.sliderInterval) {
        clearInterval(this.sliderInterval);
        this.sliderInterval = null;
      }

      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }

      if (this.segmentsoverlay) {
        this.segmentsoverlay.remove();
        this.segmentsoverlay = null;
      }

      if (this.video) {
        this.video.removeEventListener("play", this.scheduleSkipHandler);
        this.video.removeEventListener(
          "durationchange",
          this.durationChangeHandler
        );
      }
    }
  }

  // When this global variable was declared using let and two consecutive hashchange
  // events were fired (due to bubbling? not sure...) the second call handled below
  // would not see the value change from first call, and that would cause multiple
  // SponsorBlockHandler initializations... This has been noticed on Chromium 38.
  // This either reveals some bug in chromium/webpack/babel scope handling, or
  // shows my lack of understanding of javascript. (or both)

  window.sponsorblock = null;

  window.addEventListener(
    "hashchange",
    () => {
      if (!configRead("enableSponsorBlock")) {
        if (window.sponsorblock) window.sponsorblock.destroy();
        return;
      }
      const match = location.hash.match(/[?&]v=([^&]+)/);
      const videoID = match ? match[1] : null;
      if (!videoID) return;
      const needsReload =
        !window.sponsorblock || window.sponsorblock.videoID != videoID;

      if (needsReload) {
        if (window.sponsorblock) {
          window.sponsorblock.destroy();
          window.sponsorblock = null;
        }

        window.sponsorblock = new SponsorBlockHandler(videoID);
        window.sponsorblock.init();
      }
    },
    false
  );

  /*global navigate*/

  // It just works, okay?
  })();

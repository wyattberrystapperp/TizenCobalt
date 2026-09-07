// [Safe Telemetry Mute]
(function(){
  var isLog = function(u){ return typeof u === "string" && u.includes("/log_event"); };
  var origO = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(m, u){
    var res = origO.apply(this, arguments);
    if(isLog(u)){ this.send = function(){}; }
    return res;
  };
  if(window.fetch){ var origF = window.fetch; window.fetch = function(inp){ var u = typeof inp === "string" ? inp : (inp && (inp.url || inp.href)); if(isLog(u)) return Promise.resolve(new Response("", { status: 204 })); return origF.apply(this, arguments); }; }
  if(navigator.sendBeacon){ var origB = navigator.sendBeacon.bind(navigator); navigator.sendBeacon = function(u){
    var target = typeof u === "string" ? u : (u && (u.href || u.url));
    return isLog(target) ? true : origB.apply(this, arguments);
  }; }
})();
// [AV1-Capable Hardware Profile]
try {
  Object.defineProperty(navigator, "deviceMemory", { get: () => 4, configurable: true });
  Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 4, configurable: true });
} catch(e) {}
/* Start TizenTubeScripts.js */

(function () {
  "use strict";

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
  const origParse = JSON.parse;
  JSON.parse = function () {
    const r = origParse.apply(this, arguments);
    if (!r || typeof r !== "object") return r;
    if (r.adPlacements) {
      r.adPlacements = [];
    }

    // Also set playerAds to false, just incase.
    if (r.playerAds) {
      r.playerAds = false;
    }

    // Also set adSlots to an empty array, emptying only the adPlacements won't work.
    if (r.adSlots) {
      r.adSlots = [];
    }
    if (r.storyboards) delete r.storyboards;
    if (r.playerStoryboardSpecRenderer) delete r.playerStoryboardSpecRenderer;
    if (r.storyboard) delete r.storyboard;
    if (r.endscreen) delete r.endscreen;
    if (r.paidContentOverlayRenderer) delete r.paidContentOverlayRenderer;

    const mh = r?.contents?.tvBrowseRenderer?.content?.tvSurfaceContentRenderer?.content?.sectionListRenderer?.contents?.[0];
    const mhi = mh?.shelfRenderer?.content?.horizontalListRenderer?.items;
    if (Array.isArray(mhi)) {
      mh.shelfRenderer.content.horizontalListRenderer.items = mhi.filter(i => {
        if (i?.compactVideoRenderer?.movingThumbnailRenderer) delete i.compactVideoRenderer.movingThumbnailRenderer;
        if (i?.tvVideoRenderer?.movingThumbnailRenderer) delete i.tvVideoRenderer.movingThumbnailRenderer;
        return !i?.adSlotRenderer;
      });
    }
    const sl = r?.contents?.tvBrowseRenderer?.content?.tvSurfaceContentRenderer?.content?.sectionListRenderer;
    if (Array.isArray(sl?.contents)) sl.contents = sl.contents.filter(s => s?.shelfRenderer?.tvhtml5ShelfRendererType !== "TVHTML5_SHELF_RENDERER_TYPE_SHORTS");
    if (r?.items && Array.isArray(r.items)) {
      const bI = ["BROADCAST","TROPHY","GAMING","LIVE","CLAPPERBOARD","TAB_LIBRARY","SUBSCRIPTIONS","YOUTUBE_SHORTS"];
      const bB = ["FEtopics_podcasts","FEtopics_sports","FEtopics_gaming","FEtopics_live","FEtopics_movies","FEstorefront","FElibrary","FEsubscriptions","FEshorts"];
      r.items = r.items.filter(item => {
        if (!item || item.guideSubscriptionsSectionRenderer) return false;
        const a = item.guideSectionRenderer;
        if (a && Array.isArray(a.items)) {
          a.items = a.items.filter(entry => {
            const s = entry?.guideEntryRenderer;
            if (!s) return true;
            const ic = s?.icon?.iconType || "";
            const id = s?.navigationEndpoint?.browseEndpoint?.browseId || "";
            return !(bI.includes(ic) || bB.includes(id) || ic.includes("SHORTS") || id.includes("shorts") || s.thumbnail);
          });
          return a.items.length > 0;
        }
        return true;
      });
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
      this.manualSkippableCategories = [];
      this.skippableCategories = this.getSkippableCategories();

      this.scheduleSkipHandler = () => this.scheduleSkip();
      this.durationChangeHandler = () => this.buildOverlay();

      this.attachVideo();
      this.buildOverlay();
    }

    getSkippableCategories() { return ["sponsor","intro","outro","interaction","selfpromo","music_offtopic"]; }

    attachVideo() {
      if (!this.active) return;
      clearTimeout(this.attachVideoTimeout);
      this.attachVideoTimeout = null;

      this.video = document.querySelector("video");
      if (!this.video) {
        this.attachVideoTimeout = setTimeout(() => this.attachVideo(), 100);
        return;
      }

      this.video.addEventListener("timeupdate", this.scheduleSkipHandler);
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

      this.observer = new MutationObserver(() => {
        if (this.slider && this.segmentsoverlay && !this.slider.contains(this.segmentsoverlay)) {
          this.slider.appendChild(this.segmentsoverlay);
        }
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
        } else if (sliderAttempts >= 120) {
          clearInterval(this.sliderInterval);
          this.sliderInterval = null;
        }
      }, 500);
    }

    scheduleSkip() {
    if (!this.active || !this.video || this.video.paused || !this.segments) return;
    const cur = this.video.currentTime;
    for (let s of this.segments) {
      if (cur >= s.segment[0] && cur < s.segment[1]) {
        if (this.skippableCategories.includes(s.category)) { this.video.currentTime = s.segment[1] + 0.05; break; }
      }
    }
  }

    destroy() {
      this.active = false;
      if (this.video) {
        this.video.removeEventListener("timeupdate",
          this.scheduleSkipHandler);
        this.video.removeEventListener("durationchange",
          this.durationChangeHandler);
      }
      this.segments = null; this.video = null; this.slider = null;

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

      }
  }

  // When this global variable was declared using let and two consecutive hashchange
  // events were fired (due to bubbling? not sure...) the second call handled below
  // would not see the value change from first call, and that would cause multiple
  // SponsorBlockHandler initializations... This has been noticed on Chromium 38.
  // This either reveals some bug in chromium/webpack/babel scope handling, or
  // shows my lack of understanding of javascript. (or both)

  window.sponsorblock = null;
  const _onNav = () => {
    const targetUrl = location.hash + " " + location.search;
    const match = targetUrl.match(/[?&]v=([^&#\s]+)/);
    const id = match ? match[1] : null;
    if (id && (!window.sponsorblock || window.sponsorblock.videoID != id)) {
      if (window.sponsorblock) { window.sponsorblock.destroy(); window.sponsorblock = null; }
      window.sponsorblock = new SponsorBlockHandler(id);
      window.sponsorblock.init();
    }
  };
  window.addEventListener("hashchange", _onNav, false);
  window.addEventListener("popstate", _onNav, false);
  document.addEventListener("loadstart", _onNav, true);
  /*global navigate*/

  // It just works, okay?
  })();

(function(){function b(){try{var r=localStorage.getItem("yt.leanback.default::recurring_actions"),t=r?JSON.parse(r):{data:{data:{}}};t.data=t.data||{};t.data.data=t.data.data||{};var f=Date.now()+604800000;["startup-screen-account-selector-with-guest","whos_watching_fullscreen_zero_accounts","startup-screen-signed-out-welcome-back"].forEach(function(k){t.data.data[k]=t.data.data[k]||{};t.data.data[k].lastFired=f;});localStorage.setItem("yt.leanback.default::recurring_actions",JSON.stringify(t));}catch(e){}}
b();var bi=setInterval(b,2000);setTimeout(function(){clearInterval(bi);},20000);
var hi=setInterval(function(){if(typeof window._yttv==="object"&&window._yttv){var ok=!1;for(var k in window._yttv){var m=window._yttv[k];if(m&&m.instance&&typeof m.instance.resolveCommand==="function"&&!m.instance._exitH){(function(inst){var o=inst.resolveCommand;inst._exitH=!0;inst.resolveCommand=function(c,n){var u;if(c&&c.requestAccountSelectorCommand&&"ACCOUNT_EVENT_TRIGGER_ON_EXIT"===(null===(u=c.requestAccountSelectorCommand)||void 0===u||null===(u=u.identityActionContext)||void 0===u?void 0:u.eventTrigger))return o.call(this,{signalAction:{signal:"EXIT_APP"}}),!1;return o.call(this,c,n);};})(m.instance);ok=!0;}}if(ok)clearInterval(hi);}},250);})();

(function(){function yo(){var e,t,d;if(!window._yttv)return null;for(var i in window._yttv){var m=window._yttv[i];if(m&&m.getInstance){var o=m.getInstance();if(m.toString().includes("ytlrActionRouter"))e=o;else if(o){for(var s of Object.getOwnPropertyNames(Object.getPrototypeOf(o)||{})){if(typeof o[s]==="function"&&o[s].toString().includes("ytlrActionRouter")){t=o[s];e=o;}}}}if(typeof m==="function"&&m.toString().includes("this.actionName"))d=m;}if(e&&!t){for(var c of Object.getOwnPropertyNames(Object.getPrototypeOf(e)||{})){if(typeof e[c]==="function"&&e[c].toString().includes("ytlrActionRouter"))t=e[c];}}return(e&&t&&d)?{exec:t.bind(e),cmd:d}:null;}
var cnt=0,tmr=setInterval(function(){try{var o=yo();if(o){o.exec(new o.cmd("reloadGuideAction"));clearInterval(tmr);}}catch(x){}if(++cnt>30)clearInterval(tmr);},500);})();

(function(){var re=/^(Podcasts|Sports|Gaming|Live|Movies.*|Library|Subscriptions?|Shorts)$/i;function sweep(){var g=document.querySelector("ytlr-guide-response");if(!g)return;var els=g.querySelectorAll("yt-focus-container, [idomkey]");for(var i=0;i<els.length;i++){var el=els[i],t=(el.textContent||"").trim();if(re.test(t)){var p=el.closest("ytlr-guide-entry-renderer, yt-focus-container, [idomkey]")||el;p.style.setProperty("display","none","important");p.setAttribute("tabindex","-1");}}}var rootObs = new MutationObserver(function(){
    var g = document.querySelector(
      "ytlr-guide-response, ytlr-guide-renderer");
    if(g){
      rootObs.disconnect();
      sweep(g);
      new MutationObserver(function(){ sweep(g); })
        .observe(g, {childList:true, subtree:true});
    }
  });
  rootObs.observe(document.documentElement, {childList:true, subtree:true});})();

// [Active MSE Buffer Trimmer]
(function(){
  var origAppend = SourceBuffer.prototype.appendBuffer;
  SourceBuffer.prototype.appendBuffer = function(buf){
    if(!this._trimHook){
      this._trimHook = true;
      this._lastTrim = 0;
      this.addEventListener("updateend", function(){
        try {
          var v = document.querySelector("video");
          var now = Date.now();
          if(v && !v.paused && !this.updating && this.buffered.length > 0 && (now - this._lastTrim > 10000)){
            var bStart = this.buffered.start(0);
            var bEnd = this.buffered.end(this.buffered.length - 1);
            var cur = v.currentTime;
            if(cur >= bStart && cur <= bEnd && cur > 45){
              var target = cur - 30;
              if(bStart < target && target < cur){
                this._lastTrim = now;
                this.remove(bStart, target);
              }
            }
          }
        } catch(e){}
      });
    }
    return origAppend.call(this, buf);
  };
})();

// [GPU Texture & Shader Shield]
(function(){
  var s = document.createElement("style");
  s.textContent = `
    ytlr-moving-thumbnail-renderer, [idomkey*="movingThumbnail"], #cinematic-container, [idomkey*="cinematic"], .ytlr-cinematic-container-renderer, ytlr-storyboard-renderer, ytlr-thumbnail-preview-renderer, [idomkey*="storyboard"], [idomkey*="previewThumbnail"], .ytlr-scrubber-preview, ytlr-endscreen-renderer, [idomkey*="endscreen"] { display: none !important; }
    ytlr-overlay-renderer, [idomkey*="overlay"], .ytlr-dialog-renderer, ytlr-guide-renderer { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
    [idomkey], ytlr-compact-metadata-renderer { box-shadow: none !important; text-shadow: none !important; }
    yt-focus-container, ytlr-guide-entry-renderer, ytlr-compact-metadata-renderer, .ytlr-tile-renderer { -webkit-transition-duration: 0.001s !important; transition-duration: 0.001s !important; }
  `;
  document.documentElement.appendChild(s);
})();

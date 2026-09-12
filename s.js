/* Start TizenTubeScripts.js */

(function () {
  "use strict";

  // Production Log & MIME short-circuit to eliminate logd jank
  try {
    console.log = console.info = console.warn = console.debug = function () {};
    if (window.MediaSource && MediaSource.isTypeSupported) {
      var origSupported = MediaSource.isTypeSupported.bind(MediaSource);
      MediaSource.isTypeSupported = function (type) {
        if (type && (type.indexOf("yt-ump") !== -1 || type.indexOf("text/") !== -1)) return false;
        return origSupported(type);
      };
    }
  } catch (e) {}

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
  var isMovieShelf = function(sr) {
    if (!sr) return false;
    var h = sr.shelfHeaderRenderer || sr;
    var t = h.title || sr.title;
    var title = "";
    if (t) {
      if (typeof t.simpleText === "string") title = t.simpleText;
      else if (Array.isArray(t.runs) && t.runs[0] && t.runs[0].text) title = t.runs[0].text;
    }
    if (/primetime|movies|filmy|filme/i.test(title)) return true;
    var ic = (h.icon && h.icon.iconType) || (sr.icon && sr.icon.iconType) || "";
    if (ic === "CLAPPERBOARD" || ic.indexOf("MOVIE") !== -1) return true;
    var itms = sr.content && sr.content.horizontalListRenderer && sr.content.horizontalListRenderer.items;
    if (Array.isArray(itms) && itms.length > 0) {
      for (var j = 0; j < Math.min(itms.length, 3); j++) {
        var it = itms[j];
        if (!it) continue;
        if (it.compactMovieRenderer || it.movieRenderer) return true;
        if (it.tileRenderer) {
          var raw = JSON.stringify(it.tileRenderer);
          if (raw.indexOf("YPC") !== -1 || raw.indexOf("OFFER_TYPE_BUY") !== -1 || /"text":"(Buy|Kup)"/i.test(raw)) return true;
        }
      }
    }
    return false;
  };
  var pruneShelves = function(arr) {
    if (!Array.isArray(arr)) return;
    for (var i = 0; i < arr.length; i++) {
      var s = arr[i];
      if (!s) continue;
      if (s.tvMastheadRenderer || s.adSlotRenderer || s.brandVideoSingletonRenderer) { arr.splice(i, 1); i--; continue; }
    if (s.shelfRenderer) {
        if (s.shelfRenderer.tvhtml5ShelfRendererType === "TVHTML5_SHELF_RENDERER_TYPE_SHORTS" || isMovieShelf(s.shelfRenderer)) {
          arr.splice(i, 1); i--; continue;
        } else {
          var itms = s.shelfRenderer.content && s.shelfRenderer.content.horizontalListRenderer && s.shelfRenderer.content.horizontalListRenderer.items;
          if (Array.isArray(itms)) {
            s.shelfRenderer.content.horizontalListRenderer.items = itms.filter(function(x){ return !x || !x.adSlotRenderer; });
          }
        }
      }
      if (s.itemSectionRenderer && Array.isArray(s.itemSectionRenderer.contents)) {
        pruneShelves(s.itemSectionRenderer.contents);
        if (s.itemSectionRenderer.contents.length === 0) { arr.splice(i, 1); i--; }
      }
    }
  };
  var scan = function(o) {
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o)) { pruneShelves(o); for (var k = 0; k < o.length; k++) scan(o[k]); return; }
    if (Array.isArray(o.contents)) pruneShelves(o.contents);
    if (o.sectionListRenderer && Array.isArray(o.sectionListRenderer.contents)) pruneShelves(o.sectionListRenderer.contents);
    if (o.sectionListContinuation && Array.isArray(o.sectionListContinuation.contents)) pruneShelves(o.sectionListContinuation.contents);
    if (o.tvBrowseRenderer) { delete o.tvBrowseRenderer.masthead; if (o.tvBrowseRenderer.content) scan(o.tvBrowseRenderer.content); }
    if (o.tvSurfaceContentRenderer && o.tvSurfaceContentRenderer.content) scan(o.tvSurfaceContentRenderer.content);
    };
      const origParse = JSON.parse;
  JSON.parse = function () {
    const r = origParse.apply(this, arguments);
    if (!r || typeof r !== "object") return r;
    if (r.masthead) delete r.masthead;
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

    if (r && r.contents) scan(r.contents);
    if (r && r.continuationContents) scan(r.continuationContents);
    if (r && r.items && Array.isArray(r.items)) {
      const bI = ["BROADCAST","TROPHY","GAMING","LIVE","CLAPPERBOARD","TAB_LIBRARY","SUBSCRIPTIONS","YOUTUBE_SHORTS"];
      const bB = ["FEtopics_podcasts","FEtopics_sports","FEtopics_gaming","FEtopics_live","FEtopics_movies","FEstorefront","FElibrary","FEsubscriptions","FEshorts"];
      for (let n = 0; n < r.items.length; n++) {
        if ((r.items[n] && r.items[n].guideSubscriptionsSectionRenderer)) { r.items.splice(n, 1); n--; continue; }
        const a = r.items[n] && r.items[n].guideSectionRenderer;
        if (a && a.items) {
          for (let o = 0; o < a.items.length; o++) {
            const s = (a.items[o] && a.items[o].guideEntryRenderer), ic = (s && s.icon && s.icon.iconType) || "", id = (s && s.navigationEndpoint && s.navigationEndpoint.browseEndpoint && s.navigationEndpoint.browseEndpoint.browseId) || "";
            if (s && (bI.includes(ic) || bB.includes(id) || ic.includes("SHORTS") || id.includes("shorts") || s.thumbnail)) { a.items.splice(o, 1); o--; }
          }
          if (a.items.length === 0) { r.items.splice(n, 1); n--; }
        }
      }
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
      if (!this.active || !sbRes || !sbRes.ok) return;
      const result = await sbRes.json().catch(() => null);

      if (!this.active || !result || !result.segments || !result.segments.length) {
        return;
      }

      this.skippableCategories = this.getSkippableCategories();
      this.segments = (result.segments || []).filter(function(s){
        return ["sponsor","intro","outro","interaction","selfpromo","music_offtopic"].indexOf(s.category) !== -1;
      });
      this.manualSkippableCategories = [];

      this.scheduleSkipHandler = () => this.scheduleSkip();
      this.durationChangeHandler = () => this.buildOverlay();

      this.attachVideo();
      this.buildOverlay();
    }

    getSkippableCategories() { return ["sponsor","intro","outro","interaction","selfpromo","music_offtopic"]; }

    attachVideo() {
      clearTimeout(this.attachVideoTimeout);
      this.attachVideoTimeout = null;

      this.video = document.querySelector("video");
      if (!this.video) {
        this.attachVideoTimeout = setTimeout(() => this.attachVideo(), 100);
        return;
      }

      this.lastSkipCheck = 0;
      this._throttledSkip = () => {
        const now = Date.now();
        if (now - this.lastSkipCheck >= 1000) {
          this.lastSkipCheck = now;
          this.scheduleSkip();
        }
      };
      this.video.addEventListener("timeupdate", this._throttledSkip);
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

      this.slider = document.querySelector('[idomkey="slider"]');
      if (this.slider) {
        this.observer.observe(this.slider, { childList: true });
        this.slider.appendChild(this.segmentsoverlay);
      }
    }

    scheduleSkip() {
    if (!this.active || !this.video || this.video.paused || !this.segments) return;
    const cur = this.video.currentTime;
    for (let s of this.segments) {
      if (cur >= s.segment[0] && cur < s.segment[1]) {
        if (this.skippableCategories.includes(s.category)) { this.video.currentTime = s.segment[1]; break; }
      }
    }
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
        this.video.removeEventListener("timeupdate", this._throttledSkip || this.scheduleSkipHandler);
        this.video.removeEventListener("durationchange", this.durationChangeHandler);
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
    const match = location.hash.match(/[?&]v=([^&]+)/);
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
b();var bi=setInterval(b,2000);setTimeout(function(){clearInterval(bi);},10000);
var hi=setInterval(function(){if(typeof window._yttv==="object"&&window._yttv){var ok=!1;for(var k in window._yttv){var m=window._yttv[k];if(m&&m.instance&&typeof m.instance.resolveCommand==="function"&&!m.instance._exitH){(function(inst){var o=inst.resolveCommand;inst._exitH=!0;inst.resolveCommand=function(c,n){var u;if(c&&c.requestAccountSelectorCommand&&"ACCOUNT_EVENT_TRIGGER_ON_EXIT"===(null===(u=c.requestAccountSelectorCommand)||void 0===u||null===(u=u.identityActionContext)||void 0===u?void 0:u.eventTrigger))return o.call(this,{signalAction:{signal:"EXIT_APP"}}),!1;return o.call(this,c,n);};})(m.instance);ok=!0;}}if(ok)clearInterval(hi);}},250);})();

(function(){function yo(){var e,t,d;if(!window._yttv)return null;for(var i in window._yttv){var m=window._yttv[i];if(m&&m.getInstance){var o=m.getInstance();if(m.toString().includes("ytlrActionRouter"))e=o;else if(o){for(var s of Object.getOwnPropertyNames(Object.getPrototypeOf(o)||{})){if(typeof o[s]==="function"&&o[s].toString().includes("ytlrActionRouter")){t=o[s];e=o;}}}}if(typeof m==="function"&&m.toString().includes("this.actionName"))d=m;}if(e&&!t){for(var c of Object.getOwnPropertyNames(Object.getPrototypeOf(e)||{})){if(typeof e[c]==="function"&&e[c].toString().includes("ytlrActionRouter"))t=e[c];}}return(e&&t&&d)?{exec:t.bind(e),cmd:d}:null;}
var cnt=0,tmr=setInterval(function(){try{var o=yo();if(o){o.exec(new o.cmd("reloadGuideAction"));clearInterval(tmr);}}catch(x){}if(++cnt>30)clearInterval(tmr);},500);})();

(function(){
  var re = /^(Podcasts|Sports|Gaming|Live|Movies.*|Library|Subscriptions?|Shorts)$/i;
  var tmr = null;
  function sweep(){
    tmr = null;
    var g = document.querySelector("ytlr-guide-response");
    if (!g) return;
    var els = g.querySelectorAll("yt-focus-container, [idomkey]");
    for (var i = 0; i < els.length; i++){
      var el = els[i], t = (el.textContent || "").trim();
      if (re.test(t)){
        var p = el.closest("ytlr-guide-entry-renderer, yt-focus-container, [idomkey]") || el;
        p.style.setProperty("display", "none", "important");
        p.setAttribute("tabindex", "-1");
      }
    }
  }
  var obs = new MutationObserver(function(){
    if (!tmr) tmr = setTimeout(sweep, 300);
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(function(){ obs.disconnect(); }, 15000);
  window.addEventListener("hashchange", function(){ if (!tmr) tmr = setTimeout(sweep, 300); });
})();

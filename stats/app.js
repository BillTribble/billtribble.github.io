(function () {
  "use strict";

  // Prevent any accidental GoatCounter beacon from firing on /stats/
  window.goatcounter = { no_onload: true };

  // Pillar 6.1: Early runtime diagnostics listener (ignores benign ViewTransition AbortError)
  function showRuntimeDiagnostic(msg) {
    var toast = document.getElementById("runtime-error-toast");
    if (!toast) return;
    toast.textContent = "Runtime error: " + msg;
    toast.hidden = false;
  }

  window.addEventListener("error", function (ev) {
    if (!ev || !ev.message) return;
    if (String(ev.message).indexOf("ResizeObserver") !== -1) return;
    showRuntimeDiagnostic(ev.message);
  });

  window.addEventListener("unhandledrejection", function (ev) {
    var reason = ev && ev.reason;
    if (reason && (reason.name === "AbortError" || String(reason).indexOf("Transition") !== -1)) {
      return;
    }
    if (reason) {
      showRuntimeDiagnostic(reason.message || String(reason));
    }
  });

  function safeViewTransition(updateFn) {
    if (document.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      try {
        var vt = document.startViewTransition(function () {
          updateFn();
        });
        if (vt && vt.ready && vt.ready.catch) vt.ready.catch(function () {});
        if (vt && vt.finished && vt.finished.catch) vt.finished.catch(function () {});
        return;
      } catch (_) {}
    }
    updateFn();
  }

  // Encrypted read-only GoatCounter stats configuration (PBKDF2-HMAC-SHA256 600k iter + AES-256-GCM).
  // Zero plaintext tokens or passwords exist in source.
  var VAULT = {
    kdf: "PBKDF2-SHA256",
    iter: 600000,
    cipher: "AES-256-GCM",
    salt: "5cw4VfDohkSCqnuyR+Jjwg==",
    iv: "YkLoav2A+fMyrbzV",
    ct: "nfHBWWSJjV5cneyXVpt3HOx0nbLJhH5Rc5fc1uQaq9hX1/UVBcEYhWT1n47xnUtj32QoQBQ/eq9fKbxtSV4r2OlO2n50mIBEdOfxR1QATLXqoA0sVB0W8OX2ofgg1cCgx5RVtFqBOPsRgUU4fk3iXlQNq0GcCdZIxsuyJs1WpM5aPQSnPfjR/TzwNXMIFfdl5wuXPQYtDka35B+dq7rtA/qkoZu0O7gZbwanc59dJCdyGaRObFGMwLx46iweFVKBk/TmOd9AVm9XxzeHmf4LPzlVa8vciUWvIx2ts1IsLlx7NeaZzpr436KIiMQxnenGrB2o3aZQizhW9I2ydCbjGxbdGt2Q9KBaOj2gbukO8L5lHLf1iRhvuieJOKwF6dqYFr+1/u09rpPklSLH9vStO8sHeMKijNzaySb7DgIlmeyfK0uPKEdpFy2KmlNTKNox3iIGz1im2tGJi6oSyj+r5apyHzSOeA=="
  };

  var SESSION_STORAGE_KEY = "bt_stats_session_v1";
  var CACHE_STORAGE_KEY = "bt_stats_cache_v2";
  var CACHE_TTL_MS = 60 * 1000;
  var SNAPSHOT_PATH = "./vault-snapshot.json";
  var TOKEN_WRAP_DOMAIN = "bt-stats-snapshot-wrap-v1:";
  var DEFAULT_MUSIC_MAP_API = "https://music-map-events.billtribble.workers.dev";

  var PROJECT_DIRECTORY = {
    "/music-map": { name: "Music Map", url: "https://billtribble.github.io/music-map/" },
    "/groove-explorer": { name: "Groove Explorer", url: "https://billtribble.github.io/groove-explorer/" },
    "/sangha-looper": { name: "Sangha-Looper", url: "https://billtribble.github.io/Sangha-Looper/" },
    "/crystal-transformer": { name: "Crystal Transformer", url: "https://billtribble.github.io/crystal-transformer/" },
    "/lifesim": { name: "LifeSim", url: "https://billtribble.github.io/LifeSim/" },
    "/hybridizer": { name: "Hybridizer", url: "https://billtribble.github.io/hybridizer/" },
    "/enso-soundscapes": { name: "Enso-Soundscapes", url: "https://billtribble.github.io/Enso-Soundscapes/" },
    "/prismata-ui": { name: "Prismata-UI", url: "https://billtribble.github.io/Prismata-UI/" },
    "/sprig": { name: "Sprig", url: "https://billtribble.github.io/sprig/" },
    "/design": { name: "Design", url: "https://billtribble.github.io/design/" }
  };

  var SIZE_LABELS = {
    phone: { label: "Phone", sub: "Up to 600px", icon: "smartphone" },
    tablet: { label: "Tablet", sub: "600px to 1024px", icon: "tablet_mac" },
    desktop: { label: "Desktop", sub: "1024px to 1920px", icon: "computer" },
    desktophd: { label: "Widescreen HD", sub: "Above 1920px", icon: "desktop_windows" },
    unknown: { label: "Unknown viewport", sub: "Size not reported", icon: "devices" }
  };

  // State
  var session = null;
  var state = {
    site: "all",
    range: "7d",
    granularity: "hourly",
    granularityManual: false,
    pageFilter: "",
    loading: false,
    liveBlocked: false,
    loadSeq: 0,
    lastData: null,
    selectedPage: null,
    hotlistFilter: "all",
    lastHotlist: null,
    popmapMetric: "combined",
    popmapScope: "window",
    popmapHoverId: null,
    popmapPinnedId: null,
    lastPopular: null
  };
  var memoryCache = {};
  var decryptedSnapshotCache = null;
  var catalogGeometryCache = null;
  var catalogGeometryPromise = null;
  var popmapScreenNodes = [];

  // --------------------------------------------------------------------------
  // Theme Controller (Must initialize in 'auto' mode per BillSkill Pillar 2.5)
  // --------------------------------------------------------------------------
  var themeMode = localStorage.getItem("gm3_theme_mode") || "auto";
  var mql = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function resolveTheme() {
    if (themeMode === "dark") return "dark";
    if (themeMode === "light") return "light";
    return mql && mql.matches ? "dark" : "light";
  }

  function applyTheme() {
    var active = resolveTheme();
    if (active === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    var icon = document.getElementById("theme-toggle-icon");
    var btn = document.getElementById("theme-toggle-btn");
    if (!icon || !btn) return;
    if (themeMode === "auto") {
      icon.textContent = "brightness_auto";
      btn.title = "Theme: Auto (system)";
      btn.setAttribute("aria-label", "Theme: Auto (system)");
    } else if (themeMode === "dark") {
      icon.textContent = "dark_mode";
      btn.title = "Theme: Dark";
      btn.setAttribute("aria-label", "Theme: Dark");
    } else {
      icon.textContent = "light_mode";
      btn.title = "Theme: Light";
      btn.setAttribute("aria-label", "Theme: Light");
    }
    if (typeof paintPopularityCanvas === "function" && catalogGeometryCache) {
      paintPopularityCanvas();
    }
  }

  function cycleTheme() {
    if (themeMode === "auto") themeMode = "dark";
    else if (themeMode === "dark") themeMode = "light";
    else themeMode = "auto";
    localStorage.setItem("gm3_theme_mode", themeMode);
    applyTheme();
  }

  if (mql && mql.addEventListener) {
    mql.addEventListener("change", function () {
      if (themeMode === "auto") applyTheme();
    });
  }
  applyTheme();

  // --------------------------------------------------------------------------
  // WebCrypto PBKDF2-SHA256 + AES-256-GCM Decryption
  // --------------------------------------------------------------------------
  function base64ToBytes(b64) {
    var bin = atob(b64);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) {
      out[i] = bin.charCodeAt(i);
    }
    return out;
  }

  function bytesToBase64(bytes) {
    var bin = "";
    for (var i = 0; i < bytes.length; i++) {
      bin += String.fromCharCode(bytes[i]);
    }
    return btoa(bin);
  }

  async function unlockVault(emailInput, passwordInput) {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error("WebCrypto API requires a secure HTTPS or localhost context.");
    }
    var salt = base64ToBytes(VAULT.salt);
    var iv = base64ToBytes(VAULT.iv);
    var ct = base64ToBytes(VAULT.ct);
    var enc = new TextEncoder();

    var keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(passwordInput),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    var aesKey = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: VAULT.iter,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      true,
      ["decrypt"]
    );

    var decryptedBuf = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      aesKey,
      ct
    );

    var parsed = JSON.parse(new TextDecoder().decode(decryptedBuf));
    if (!parsed || parsed.v !== 1 || !parsed.token || !Array.isArray(parsed.sites)) {
      throw new Error("Invalid vault payload.");
    }
    if (emailInput.trim().toLowerCase() !== String(parsed.email || "").toLowerCase()) {
      throw new Error("Email mismatch.");
    }

    var rawKeyBuf = await window.crypto.subtle.exportKey("raw", aesKey);
    parsed.snapshotKey = bytesToBase64(new Uint8Array(rawKeyBuf));
    return parsed;
  }

  async function resolveSnapshotAesKey(envelope) {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error("WebCrypto unavailable.");
    }
    if (session && session.snapshotKey) {
      return window.crypto.subtle.importKey(
        "raw",
        base64ToBytes(session.snapshotKey),
        { name: "AES-GCM" },
        false,
        ["decrypt"]
      );
    }
    if (session && session.token && envelope && envelope.tokenWrap && envelope.tokenWrap.iv && envelope.tokenWrap.ct) {
      var wrapBytes = new TextEncoder().encode(TOKEN_WRAP_DOMAIN + session.token);
      var wrapDigest = await window.crypto.subtle.digest("SHA-256", wrapBytes);
      var wrapKey = await window.crypto.subtle.importKey(
        "raw",
        wrapDigest,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
      );
      var rawSnapKeyBuf = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: base64ToBytes(envelope.tokenWrap.iv) },
        wrapKey,
        base64ToBytes(envelope.tokenWrap.ct)
      );
      session.snapshotKey = bytesToBase64(new Uint8Array(rawSnapKeyBuf));
      session.v = 2;
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      } catch (_) {}
      return window.crypto.subtle.importKey(
        "raw",
        rawSnapKeyBuf,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
      );
    }
    throw new Error("Missing snapshot decryption key.");
  }

  async function fetchDecryptedSnapshot(forceRefresh) {
    if (!forceRefresh && decryptedSnapshotCache) {
      return decryptedSnapshotCache;
    }
    var resp = await fetch(SNAPSHOT_PATH, {
      method: "GET",
      credentials: "same-origin",
      cache: forceRefresh ? "no-store" : "default"
    });
    if (!resp.ok) {
      throw new Error("Failed to fetch");
    }
    var envelope = await resp.json();
    if (!envelope || !envelope.iv || !envelope.ct) {
      throw new Error("Invalid snapshot envelope.");
    }
    var aesKey = await resolveSnapshotAesKey(envelope);
    var plainBuf = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBytes(envelope.iv) },
      aesKey,
      base64ToBytes(envelope.ct)
    );
    var parsed = JSON.parse(new TextDecoder().decode(plainBuf));
    if (!parsed || !parsed.ranges) {
      throw new Error("Invalid snapshot payload.");
    }
    decryptedSnapshotCache = parsed;
    return parsed;
  }

  // --------------------------------------------------------------------------
  // Rate-Limited GoatCounter API Client
  // Each cross-origin GET with Authorization triggers an OPTIONS preflight + GET (2 HTTP reqs)
  // on cold browsers against GoatCounter's 4 req/s sliding window, so we pace calls >= 620ms apart,
  // retry HTTP 429 cleanly, and fail fast (~220ms) on ad-blocker network blocks so Personal Chrome
  // falls back immediately to same-origin ./vault-snapshot.json.
  // --------------------------------------------------------------------------
  var requestQueue = Promise.resolve();
  var lastRequestAt = 0;

  function sleep(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function scheduleApiFetch(url, token) {
    var run = async function () {
      var minSpacingMs = 620;
      var elapsed = Date.now() - lastRequestAt;
      if (elapsed < minSpacingMs) {
        await sleep(minSpacingMs - elapsed);
      }

      for (var attempt = 0; attempt < 4; attempt++) {
        lastRequestAt = Date.now();
        var resp;
        try {
          resp = await fetch(url, {
            method: "GET",
            mode: "cors",
            credentials: "omit",
            headers: {
              Authorization: "Bearer " + token
            }
          });
        } catch (netErr) {
          // Ad-blockers (ERR_BLOCKED_BY_CLIENT) throw TypeError immediately; retry once briefly
          // for transient preflight blips, then fall back immediately to ./vault-snapshot.json.
          if (attempt === 0) {
            await sleep(220);
            continue;
          }
          netErr.isNetworkBlocked = true;
          throw netErr;
        }

        if (resp.status === 429) {
          var resetSec = parseFloat(resp.headers.get("X-Rate-Limit-Reset") || "1");
          var delay = Math.max(1150, Math.ceil((isNaN(resetSec) ? 1 : resetSec) * 1000) + 300);
          await sleep(delay);
          continue;
        }
        if (resp.status === 401 || resp.status === 403) {
          var authErr = new Error("GoatCounter session expired or unauthorized (HTTP " + resp.status + ").");
          authErr.isAuthError = true;
          throw authErr;
        }
        if (!resp.ok) {
          var txt = await resp.text().catch(function () { return ""; });
          throw new Error("GoatCounter HTTP " + resp.status + (txt ? ": " + txt.slice(0, 140) : ""));
        }
        return resp.json();
      }
      throw new Error("GoatCounter API rate limit exceeded.");
    };

    var task = requestQueue.then(run, run);
    requestQueue = task.then(function () {}, function () {});
    return task;
  }

  // --------------------------------------------------------------------------
  // Browser-Local Timezone Formatting & UTC -> Local Bucket Conversion
  // --------------------------------------------------------------------------
  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function formatLocalYmd(dateObj) {
    return (
      dateObj.getFullYear() + "-" +
      pad2(dateObj.getMonth() + 1) + "-" +
      pad2(dateObj.getDate())
    );
  }

  function getLocalTimeZoneId() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch (_) {
      return "UTC";
    }
  }

  function getLocalShortZone(dateObj) {
    var target = dateObj instanceof Date && !isNaN(dateObj.getTime()) ? dateObj : new Date();
    try {
      var parts = new Intl.DateTimeFormat(undefined, { timeZoneName: "short" }).formatToParts(target);
      for (var i = 0; i < parts.length; i++) {
        if (parts[i].type === "timeZoneName" && parts[i].value) {
          return parts[i].value;
        }
      }
    } catch (_) {}
    return getLocalTimeZoneId();
  }

  function formatLocalZoneSubtitle(dateObj) {
    var iana = getLocalTimeZoneId();
    var shortZone = getLocalShortZone(dateObj);
    if (shortZone && shortZone !== iana) {
      return iana + " (" + shortZone + ")";
    }
    return iana;
  }

  function formatLocalUpdatedTime(dateObj) {
    var target = dateObj instanceof Date && !isNaN(dateObj.getTime()) ? dateObj : new Date();
    try {
      return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short"
      }).format(target);
    } catch (_) {
      return target.toTimeString().slice(0, 5) + " " + getLocalShortZone(target);
    }
  }

  function utcBucketToLocal(utcDayStr, utcHour) {
    var parts = String(utcDayStr || "").split("-");
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    var d = parseInt(parts[2], 10);
    var dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1, utcHour || 0, 0, 0));
    return {
      localDay: formatLocalYmd(dt),
      localHour: dt.getHours()
    };
  }

  function rebucketUtcDaysToLocal(rawSlices, win) {
    var localMap = {};
    (rawSlices || []).forEach(function (s) {
      if (!s || !s.day) return;
      var hr = s.hourly;
      if (Array.isArray(hr) && hr.length > 0) {
        var hrSum = 0;
        for (var h = 0; h < hr.length; h++) {
          var val = hr[h] || 0;
          hrSum += val;
          var mapped = utcBucketToLocal(s.day, h);
          if (mapped.localDay < win.minDay || mapped.localDay > win.todayLocal) continue;
          if (!localMap[mapped.localDay]) {
            localMap[mapped.localDay] = { day: mapped.localDay, daily: 0, hourly: new Array(24).fill(0) };
          }
          if (val > 0) {
            localMap[mapped.localDay].daily += val;
            localMap[mapped.localDay].hourly[mapped.localHour] += val;
          }
        }
        if (hrSum === 0 && (s.daily || 0) > 0) {
          var mid = utcBucketToLocal(s.day, 12);
          if (mid.localDay >= win.minDay && mid.localDay <= win.todayLocal) {
            if (!localMap[mid.localDay]) {
              localMap[mid.localDay] = { day: mid.localDay, daily: 0, hourly: new Array(24).fill(0) };
            }
            localMap[mid.localDay].daily += s.daily;
            localMap[mid.localDay].hourly[mid.localHour] += s.daily;
          }
        }
      } else if ((s.daily || 0) >= 0) {
        var fallback = utcBucketToLocal(s.day, 12);
        if (fallback.localDay >= win.minDay && fallback.localDay <= win.todayLocal) {
          if (!localMap[fallback.localDay]) {
            localMap[fallback.localDay] = { day: fallback.localDay, daily: 0, hourly: new Array(24).fill(0) };
          }
          localMap[fallback.localDay].daily += s.daily || 0;
        }
      }
    });
    return Object.keys(localMap).sort().map(function (k) { return localMap[k]; });
  }

  function computeRangeWindow(rangeKey) {
    var now = new Date();
    var daysBack = 6;
    var label = "Last 7 days";
    if (rangeKey === "today") {
      daysBack = 0;
      label = "Today";
    } else if (rangeKey === "30d") {
      daysBack = 29;
      label = "Last 30 days";
    } else if (rangeKey === "90d") {
      daysBack = 89;
      label = "Last 90 days";
    }

    var localStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysBack, 0, 0, 0);
    var localEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);

    // Align query timestamps to whole UTC hours so GoatCounter's API accepts half-hour offset zones too
    var startUtcAligned = new Date(localStart.getTime());
    startUtcAligned.setUTCMinutes(0, 0, 0);
    var endUtcAligned = new Date(localEnd.getTime());
    if (endUtcAligned.getUTCMinutes() > 0 || endUtcAligned.getUTCSeconds() > 0) {
      endUtcAligned.setUTCHours(endUtcAligned.getUTCHours() + 1, 0, 0, 0);
    }

    return {
      startIso: startUtcAligned.toISOString().replace(".000Z", "Z"),
      endIso: endUtcAligned.toISOString().replace(".000Z", "Z"),
      minDay: formatLocalYmd(localStart),
      todayLocal: formatLocalYmd(now),
      label: label
    };
  }

  // --------------------------------------------------------------------------
  // Caching & Multi-Site Aggregation
  // --------------------------------------------------------------------------
  function readSessionCache() {
    try {
      var raw = sessionStorage.getItem(CACHE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function writeSessionCache(store) {
    try {
      sessionStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(store));
    } catch (_) {}
  }

  function buildBundleCacheKey(siteObj, win) {
    return siteObj.code + ":" + state.range + ":" + getLocalTimeZoneId() + ":" + win.minDay;
  }

  function readCachedSiteBundle(siteObj, win, forceRefresh) {
    if (forceRefresh) return null;
    var cacheKey = buildBundleCacheKey(siteObj, win);
    var mem = memoryCache[cacheKey];
    if (mem && Date.now() - mem.ts < CACHE_TTL_MS) return mem.data;
    var persisted = readSessionCache()[cacheKey];
    if (persisted && Date.now() - persisted.ts < CACHE_TTL_MS) {
      memoryCache[cacheKey] = persisted;
      return persisted.data;
    }
    return null;
  }

  async function fetchSitesTwoPhase(targetSites, win, token, forceRefresh, onTotalsReady) {
    var qs = "start=" + encodeURIComponent(win.startIso) + "&end=" + encodeURIComponent(win.endIso);
    var slots = [];

    // Phase 1: Fetch total + hits across all target sites so KPIs, Trend, and Pages are 100% accurate
    // while Breakdown panels remain cleanly in their Loading… spinner state.
    for (var i = 0; i < targetSites.length; i++) {
      var siteObj = targetSites[i];
      var cached = readCachedSiteBundle(siteObj, win, forceRefresh);
      if (cached) {
        slots.push({ siteObj: siteObj, complete: true, bundle: cached });
        continue;
      }

      var base = "https://" + siteObj.code + ".goatcounter.com/api/v0/";
      var totalResp = await scheduleApiFetch(base + "stats/total?" + qs, token);
      var rawUtcDays = totalResp.stats || [];
      var localDaysPreview = rebucketUtcDaysToLocal(rawUtcDays, win);
      var computedTotal = localDaysPreview.reduce(function (acc, d) {
        return acc + (d.daily || 0);
      }, 0);

      if ((totalResp.total || 0) === 0 && computedTotal === 0) {
        var emptyBundle = {
          site: siteObj,
          total: 0,
          days: rawUtcDays,
          hits: [],
          toprefs: [],
          browsers: [],
          systems: [],
          locations: [],
          sizes: []
        };
        saveBundleCache(buildBundleCacheKey(siteObj, win), emptyBundle);
        slots.push({ siteObj: siteObj, complete: true, bundle: emptyBundle });
      } else {
        var hitsResp = await scheduleApiFetch(base + "stats/hits?" + qs + "&limit=50", token);
        slots.push({
          siteObj: siteObj,
          complete: false,
          base: base,
          qs: qs,
          bundle: {
            site: siteObj,
            total: computedTotal,
            days: rawUtcDays,
            hits: hitsResp.hits || [],
            toprefs: [],
            browsers: [],
            systems: [],
            locations: [],
            sizes: []
          }
        });
      }
    }

    var anyIncomplete = slots.some(function (s) { return !s.complete; });
    if (anyIncomplete && typeof onTotalsReady === "function") {
      var partialBundles = slots.map(function (s) { return s.bundle; });
      onTotalsReady(mergeBundles(partialBundles, win));
    }

    // Phase 2: Fetch breakdown dimensions for sites with non-zero traffic
    for (var j = 0; j < slots.length; j++) {
      var slot = slots[j];
      if (slot.complete) continue;
      var toprefsResp = await scheduleApiFetch(slot.base + "stats/toprefs?" + slot.qs + "&limit=20", token);
      var browsersResp = await scheduleApiFetch(slot.base + "stats/browsers?" + slot.qs + "&limit=20", token);
      var systemsResp = await scheduleApiFetch(slot.base + "stats/systems?" + slot.qs + "&limit=20", token);
      var locationsResp = await scheduleApiFetch(slot.base + "stats/locations?" + slot.qs + "&limit=20", token);
      var sizesResp = await scheduleApiFetch(slot.base + "stats/sizes?" + slot.qs + "&limit=20", token);

      slot.bundle = {
        site: slot.siteObj,
        total: slot.bundle.total,
        days: slot.bundle.days,
        hits: slot.bundle.hits,
        toprefs: toprefsResp.stats || [],
        browsers: browsersResp.stats || [],
        systems: systemsResp.stats || [],
        locations: locationsResp.stats || [],
        sizes: sizesResp.stats || []
      };
      slot.complete = true;
      saveBundleCache(buildBundleCacheKey(slot.siteObj, win), slot.bundle);
    }

    return mergeBundles(slots.map(function (s) { return s.bundle; }), win);
  }

  async function loadMergedFromSnapshot(targetSites, localWin, forceRefresh) {
    var snap = await fetchDecryptedSnapshot(forceRefresh);
    var rangeEntry = snap.ranges && snap.ranges[state.range];
    if (!rangeEntry || !rangeEntry.bundles) {
      throw new Error("Missing range in snapshot.");
    }
    var bundles = [];
    for (var i = 0; i < targetSites.length; i++) {
      var siteObj = targetSites[i];
      var b = rangeEntry.bundles[siteObj.code];
      if (b) {
        bundles.push({
          site: siteObj,
          total: b.total || 0,
          days: b.days || [],
          hits: b.hits || [],
          toprefs: b.toprefs || [],
          browsers: b.browsers || [],
          systems: b.systems || [],
          locations: b.locations || [],
          sizes: b.sizes || []
        });
      } else {
        bundles.push({
          site: siteObj,
          total: 0,
          days: [],
          hits: [],
          toprefs: [],
          browsers: [],
          systems: [],
          locations: [],
          sizes: []
        });
      }
    }
    var merged = mergeBundles(bundles, localWin);
    if (snap.generatedAt) {
      var parsedTs = new Date(snap.generatedAt);
      if (!isNaN(parsedTs.getTime())) merged.fetchedAt = parsedTs;
    }
    merged.fromSnapshot = true;
    return merged;
  }

  function saveBundleCache(key, data) {
    var entry = { ts: Date.now(), data: data };
    memoryCache[key] = entry;
    var store = readSessionCache();
    store[key] = entry;
    writeSessionCache(store);
  }

  function normalizePath(rawPath) {
    var p = String(rawPath || "/").trim() || "/";
    if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
    return p;
  }

  function resolvePageMeta(hit, siteObj) {
    var cleanPath = normalizePath(hit.path);
    var lower = cleanPath.toLowerCase();
    if ( siteObj.code === "billtribble" && PROJECT_DIRECTORY[lower]) {
      return {
        name: PROJECT_DIRECTORY[lower].name,
        url: PROJECT_DIRECTORY[lower].url,
        pathDisplay: cleanPath,
        domain: siteObj.domain
      };
    }
    if (cleanPath === "/") {
      var homeTitle = siteObj.code === "billtribble"
        ? "GitHub projects home"
        : siteObj.domain + " home";
      return {
        name: homeTitle,
        url: "https://" + siteObj.domain + "/",
        pathDisplay: "/",
        domain: siteObj.domain
      };
    }
    var cleanTitle = String(hit.title || "").trim();
    if (cleanTitle) {
      cleanTitle = cleanTitle.split(" — ")[0].split(" – ")[0].trim();
    }
    var fallbackName = cleanTitle || cleanPath.replace(/^\//, "");
    var safePath = cleanPath.startsWith("/") ? cleanPath : "/" + cleanPath;
    return {
      name: fallbackName,
      url: "https://" + siteObj.domain + safePath,
      pathDisplay: safePath,
      domain: siteObj.domain
    };
  }

  function mergeBundles(bundles, win) {
    var dayMap = {};
    var siteTotals = [];
    var allPages = [];
    var refMap = {};
    var browserMap = {};
    var systemMap = {};
    var locationMap = {};
    var sizeMap = {};

    bundles.forEach(function (b) {
      var siteFilteredViews = 0;
      (b.hits || []).forEach(function (h) {
        if (h.event) return;
        var norm = normalizePath(h.path);
        // Exclude /stats self-hits if any ever existed
        if (norm === "/stats" || norm.indexOf("/stats/") === 0) return;

        var hasSliceStats = Array.isArray(h.stats) && h.stats.length > 0;
        var daySlices = rebucketUtcDaysToLocal(h.stats || [], win);
        var countInWin = hasSliceStats
          ? daySlices.reduce(function (sum, s) { return sum + (s.daily || 0); }, 0)
          : (h.count || 0);
        if (countInWin <= 0) return;
        siteFilteredViews += countInWin;

        var meta = resolvePageMeta(h, b.site);
        allPages.push({
          key: b.site.code + ":" + norm,
          name: meta.name,
          url: meta.url,
          pathDisplay: meta.pathDisplay,
          domain: meta.domain,
          rawTitle: h.title || "",
          count: countInWin,
          daySlices: daySlices
        });
      });

      var localSiteDays = rebucketUtcDaysToLocal(b.days || [], win);
      var siteDaysViews = localSiteDays.reduce(function (sum, d) { return sum + (d.daily || 0); }, 0);
      var effectiveSiteTotal = Math.max(siteDaysViews, siteFilteredViews);
      siteTotals.push({ site: b.site, count: effectiveSiteTotal });

      localSiteDays.forEach(function (d) {
        if (!dayMap[d.day]) {
          dayMap[d.day] = { day: d.day, daily: 0, hourly: new Array(24).fill(0) };
        }
        dayMap[d.day].daily += d.daily || 0;
        var hr = d.hourly || [];
        for (var i = 0; i < 24; i++) {
          dayMap[d.day].hourly[i] += hr[i] || 0;
        }
      });

      function mergeCounter(list, targetMap, transformItem) {
        (list || []).forEach(function (item) {
          var count = item.count || 0;
          if (count <= 0) return;
          var info = transformItem(item);
          if (!targetMap[info.key]) {
            targetMap[info.key] = {
              key: info.key,
              label: info.label,
              sub: info.sub || "",
              icon: info.icon || "",
              href: info.href || "",
              count: 0
            };
          }
          targetMap[info.key].count += count;
        });
      }

      mergeCounter(b.toprefs, refMap, function (r) {
        var raw = String(r.name || r.id || "").trim();
        if (!raw) {
          return { key: "direct", label: "Direct & bookmarks", sub: "No referrer header", icon: "bookmark" };
        }
        var href = r.ref_scheme === "h" && /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(raw)
          ? "https://" + raw
          : "";
        return {
          key: raw.toLowerCase(),
          label: raw,
          sub: r.ref_scheme === "g" ? "Search / social" : "Referral link",
          icon: r.ref_scheme === "g" ? "travel_explore" : "link",
          href: href
        };
      });

      mergeCounter(b.browsers, browserMap, function (it) {
        var name = it.name || it.id || "Unknown";
        return { key: name, label: name, icon: "web" };
      });

      mergeCounter(b.systems, systemMap, function (it) {
        var name = it.name || it.id || "Unknown";
        return { key: name, label: name, icon: "memory" };
      });

      mergeCounter(b.locations, locationMap, function (it) {
        var code = it.id || "";
        var name = it.name || code || "Unknown region";
        return { key: code || name, label: name, sub: code && code !== "00" ? code : "", icon: "public" };
      });

      mergeCounter(b.sizes, sizeMap, function (it) {
        var id = it.id || "unknown";
        var meta = SIZE_LABELS[id] || SIZE_LABELS.unknown;
        return { key: id, label: meta.label, sub: meta.sub, icon: meta.icon };
      });
    });

    var sortedDays = Object.keys(dayMap).sort().map(function (k) { return dayMap[k]; });
    allPages.sort(function (a, b) { return b.count - a.count; });

    function sortValues(mapObj) {
      return Object.keys(mapObj).map(function (k) { return mapObj[k]; }).sort(function (a, b) {
        return b.count - a.count;
      });
    }

    var totalViews = sortedDays.reduce(function (s, d) { return s + d.daily; }, 0);
    var pagesSum = allPages.reduce(function (s, p) { return s + p.count; }, 0);
    if (pagesSum > totalViews) totalViews = pagesSum;

    return {
      win: win,
      totalViews: totalViews,
      siteTotals: siteTotals,
      days: sortedDays,
      pages: allPages,
      referrers: sortValues(refMap),
      browsers: sortValues(browserMap),
      systems: sortValues(systemMap),
      locations: sortValues(locationMap),
      sizes: sortValues(sizeMap),
      fetchedAt: new Date()
    };
  }

  // --------------------------------------------------------------------------
  // Tokenized SVG Sparklines & Interactive Trend Chart (Zero Raw Hex!)
  // --------------------------------------------------------------------------
  var SVG_NS = "http://www.w3.org/2000/svg";

  function createSvgEl(tag, attrs) {
    var el = document.createElementNS(SVG_NS, tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        el.setAttribute(k, String(attrs[k]));
      });
    }
    return el;
  }

  function renderMiniSparkline(svgEl, values) {
    while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
    var w = 132;
    var h = 36;
    if (svgEl.classList.contains("page-row-spark")) {
      w = 104;
      h = 28;
    }
    svgEl.setAttribute("viewBox", "0 0 " + w + " " + h);
    var pts = values && values.length ? values.slice() : [0, 0];
    if (pts.length === 1) pts = [0, pts[0]];
    var maxVal = Math.max.apply(null, pts.concat([1]));
    var padX = 3;
    var padY = 4;
    var plotW = w - padX * 2;
    var plotH = h - padY * 2;

    var coords = pts.map(function (v, idx) {
      var x = padX + (idx / (pts.length - 1)) * plotW;
      var y = padY + plotH - (v / maxVal) * plotH;
      return [x, y];
    });

    var lineD = coords.map(function (c, i) {
      return (i === 0 ? "M" : "L") + c[0].toFixed(1) + " " + c[1].toFixed(1);
    }).join(" ");

    var areaD = lineD + " L" + coords[coords.length - 1][0].toFixed(1) + " " + (h - 2) +
      " L" + coords[0][0].toFixed(1) + " " + (h - 2) + " Z";

    svgEl.appendChild(createSvgEl("path", {
      d: areaD,
      fill: "var(--md-sys-color-primary-container)",
      opacity: "0.48"
    }));
    svgEl.appendChild(createSvgEl("path", {
      d: lineD,
      fill: "none",
      stroke: "var(--md-sys-color-primary)",
      "stroke-width": "2.2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round"
    }));
  }

  function formatDayShort(dayStr) {
    var parts = dayStr.split("-").map(Number);
    var d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      month: "short",
      day: "numeric"
    }).format(d);
  }

  function formatLocalHour(hr, refDate) {
    var base = refDate instanceof Date && !isNaN(refDate.getTime()) ? refDate : new Date();
    var hourDate = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hr, 0, 0);
    var tzShort = getLocalShortZone(hourDate);
    var h12 = hr === 0 ? "12 AM" : hr < 12 ? hr + " AM" : hr === 12 ? "12 PM" : (hr - 12) + " PM";
    return h12 + " " + tzShort;
  }

  function buildChartSeries(data) {
    var useHourly = state.range === "today" || state.granularity === "hourly";
    if (useHourly) {
      // Aggregate browser-local hourly distribution across active days (or Today's 24 local hours)
      var targetDays = state.range === "today"
        ? data.days.filter(function (d) { return d.day === data.win.todayLocal; })
        : data.days;
      var buckets = new Array(24).fill(0);
      targetDays.forEach(function (d) {
        for (var h = 0; h < 24; h++) {
          buckets[h] += (d.hourly && d.hourly[h]) || 0;
        }
      });
      return buckets.map(function (v, h) {
        return {
          label: formatLocalHour(h, data.fetchedAt),
          shortLabel: h % 6 === 0 ? (h === 0 ? "12a" : h < 12 ? h + "a" : h === 12 ? "12p" : (h - 12) + "p") : "",
          value: v
        };
      });
    }

    var days = data.days.length ? data.days : [{ day: data.win.todayLocal, daily: 0 }];
    var step = Math.max(1, Math.ceil(days.length / 6));
    return days.map(function (d, idx) {
      var nice = formatDayShort(d.day);
      return {
        label: nice,
        shortLabel: idx % step === 0 || idx === days.length - 1 ? nice : "",
        value: d.daily || 0
      };
    });
  }

  function renderMainTrendChart(svgEl, readoutEl, data) {
    while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
    var series = buildChartSeries(data);
    var measuredW = svgEl.getBoundingClientRect().width;
    var w = measuredW > 240 ? Math.round(measuredW) : 680;
    var h = 216;
    var padLeft = 36;
    var padRight = 16;
    var padTop = 16;
    var padBottom = 28;
    var plotW = w - padLeft - padRight;
    var plotH = h - padTop - padBottom;
    svgEl.setAttribute("viewBox", "0 0 " + w + " " + h);

    var maxVal = Math.max.apply(null, series.map(function (s) { return s.value; }).concat([4]));
    // Nice ceiling divisible by 2 or 4
    var niceMax = maxVal <= 4 ? 4 : Math.ceil(maxVal / 4) * 4;

    // Horizontal reference gridlines
    [0, 0.5, 1].forEach(function (frac) {
      var y = padTop + plotH - frac * plotH;
      var tickVal = Math.round(frac * niceMax);
      svgEl.appendChild(createSvgEl("line", {
        x1: padLeft,
        y1: y.toFixed(1),
        x2: w - padRight,
        y2: y.toFixed(1),
        stroke: "var(--md-sys-color-surface-container-highest)",
        "stroke-width": "1",
        "stroke-dasharray": frac === 0 ? "none" : "4 4"
      }));
      var lbl = createSvgEl("text", {
        x: padLeft - 8,
        y: (y + 4).toFixed(1),
        "text-anchor": "end",
        fill: "var(--md-sys-color-on-surface-variant)",
        "font-size": "11"
      });
      lbl.textContent = String(tickVal);
      svgEl.appendChild(lbl);
    });

    var count = series.length;
    var points = series.map(function (pt, idx) {
      var x = count === 1 ? padLeft + plotW / 2 : padLeft + (idx / (count - 1)) * plotW;
      var y = padTop + plotH - (pt.value / niceMax) * plotH;
      return { x: x, y: y, item: pt, idx: idx };
    });

    if (points.length >= 2) {
      var lineD = points.map(function (p, i) {
        return (i === 0 ? "M" : "L") + p.x.toFixed(1) + " " + p.y.toFixed(1);
      }).join(" ");
      var baseLineY = (padTop + plotH).toFixed(1);
      var areaD = lineD + " L" + points[points.length - 1].x.toFixed(1) + " " + baseLineY +
        " L" + points[0].x.toFixed(1) + " " + baseLineY + " Z";

      svgEl.appendChild(createSvgEl("path", {
        d: areaD,
        fill: "var(--md-sys-color-primary-container)",
        opacity: "0.5"
      }));
      svgEl.appendChild(createSvgEl("path", {
        d: lineD,
        fill: "none",
        stroke: "var(--md-sys-color-primary)",
        "stroke-width": "2.6",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }));
    }

    // X-axis tick labels
    points.forEach(function (p) {
      if (!p.item.shortLabel) return;
      var tx = createSvgEl("text", {
        x: p.x.toFixed(1),
        y: h - 6,
        "text-anchor": p.idx === 0 ? "start" : p.idx === count - 1 ? "end" : "middle",
        fill: "var(--md-sys-color-on-surface-variant)",
        "font-size": "11"
      });
      tx.textContent = p.item.shortLabel;
      svgEl.appendChild(tx);
    });

    // Peak or active point markers + interactive hover crosshair
    var hoverLine = createSvgEl("line", {
      x1: 0,
      y1: padTop,
      x2: 0,
      y2: padTop + plotH,
      stroke: "var(--md-sys-color-outline)",
      "stroke-width": "1",
      "stroke-dasharray": "3 3",
      visibility: "hidden"
    });
    svgEl.appendChild(hoverLine);

    var hoverDot = createSvgEl("circle", {
      cx: 0,
      cy: 0,
      r: "5",
      fill: "var(--md-sys-color-primary)",
      stroke: "var(--md-sys-color-surface-container-lowest)",
      "stroke-width": "2",
      visibility: "hidden"
    });

    points.forEach(function (p) {
      if (p.item.value > 0) {
        svgEl.appendChild(createSvgEl("circle", {
          cx: p.x.toFixed(1),
          cy: p.y.toFixed(1),
          r: "3.2",
          fill: "var(--md-sys-color-primary)"
        }));
      }
    });
    svgEl.appendChild(hoverDot);

    var peak = points.reduce(function (best, cur) {
      return cur.item.value >= best.item.value ? cur : best;
    }, points[0]);

    function setReadout(p, isHover) {
      if (!readoutEl || !p) return;
      while (readoutEl.firstChild) readoutEl.removeChild(readoutEl.firstChild);
      var left = document.createElement("span");
      var strong = document.createElement("strong");
      strong.textContent = p.item.value + (p.item.value === 1 ? " visit" : " visits");
      left.appendChild(strong);
      left.appendChild(document.createTextNode(" · " + p.item.label));

      var right = document.createElement("span");
      right.textContent = isHover ? "Selected interval" : (peak.item.value > 0 ? "Peak interval highlighted" : "Hover chart to inspect");
      readoutEl.appendChild(left);
      readoutEl.appendChild(right);
    }

    setReadout(peak, false);

    // Invisible full-plot hit target for smooth mouse & touch scrubbing
    var hitRect = createSvgEl("rect", {
      x: padLeft - 8,
      y: padTop - 8,
      width: plotW + 16,
      height: plotH + 16,
      fill: "transparent",
      style: "cursor: crosshair;"
    });

    function onPointer(clientX) {
      var rect = svgEl.getBoundingClientRect();
      if (!rect.width) return;
      var svgX = ((clientX - rect.left) / rect.width) * w;
      var best = points[0];
      var bestDist = Math.abs(svgX - best.x);
      for (var i = 1; i < points.length; i++) {
        var dist = Math.abs(svgX - points[i].x);
        if (dist < bestDist) {
          best = points[i];
          bestDist = dist;
        }
      }
      hoverLine.setAttribute("x1", best.x.toFixed(1));
      hoverLine.setAttribute("x2", best.x.toFixed(1));
      hoverLine.setAttribute("visibility", "visible");
      hoverDot.setAttribute("cx", best.x.toFixed(1));
      hoverDot.setAttribute("cy", best.y.toFixed(1));
      hoverDot.setAttribute("visibility", "visible");
      setReadout(best, true);
    }

    hitRect.addEventListener("mousemove", function (e) {
      onPointer(e.clientX);
    });
    hitRect.addEventListener("touchstart", function (e) {
      if (e.touches && e.touches[0]) onPointer(e.touches[0].clientX);
    }, { passive: true });
    hitRect.addEventListener("touchmove", function (e) {
      if (e.touches && e.touches[0]) onPointer(e.touches[0].clientX);
    }, { passive: true });
    hitRect.addEventListener("mouseleave", function () {
      hoverLine.setAttribute("visibility", "hidden");
      hoverDot.setAttribute("visibility", "hidden");
      setReadout(peak, false);
    });

    svgEl.appendChild(hitRect);
  }

  // --------------------------------------------------------------------------
  // DOM Rendering (100% Safe DOM Construction — Zero innerHTML with Untrusted Text)
  // --------------------------------------------------------------------------
  function renderBreakdownRows(container, items, denominator, emptyMessage) {
    while (container.firstChild) container.removeChild(container.firstChild);
    if (!items || items.length === 0) {
      var p = document.createElement("p");
      p.className = "empty-hint";
      p.textContent = emptyMessage;
      container.appendChild(p);
      return;
    }
    var sumItems = items.reduce(function (s, i) { return s + i.count; }, 0);
    var base = Math.max(denominator || 0, sumItems, 1);

    items.slice(0, 8).forEach(function (it) {
      var row = document.createElement("div");
      row.className = "breakdown-row";

      var top = document.createElement("div");
      top.className = "breakdown-row-top";

      var labelWrap = document.createElement("div");
      labelWrap.className = "breakdown-label";

      if (it.icon) {
        var ic = document.createElement("span");
        ic.className = "material-symbols-outlined";
        ic.setAttribute("aria-hidden", "true");
        ic.textContent = it.icon;
        labelWrap.appendChild(ic);
      }

      if (it.href) {
        var link = document.createElement("a");
        link.href = it.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = it.label;
        labelWrap.appendChild(link);
      } else {
        var nameSpan = document.createElement("span");
        nameSpan.textContent = it.label;
        labelWrap.appendChild(nameSpan);
      }

      if (it.sub) {
        var sub = document.createElement("span");
        sub.className = "breakdown-sub";
        sub.textContent = "· " + it.sub;
        labelWrap.appendChild(sub);
      }

      var nums = document.createElement("div");
      nums.className = "breakdown-numbers";

      var pct = Math.round((it.count / base) * 100);
      var pctSpan = document.createElement("span");
      pctSpan.className = "breakdown-pct";
      pctSpan.textContent = pct + "%";

      var cntSpan = document.createElement("span");
      cntSpan.className = "breakdown-count";
      cntSpan.textContent = it.count.toLocaleString();

      nums.appendChild(pctSpan);
      nums.appendChild(cntSpan);

      top.appendChild(labelWrap);
      top.appendChild(nums);

      var track = document.createElement("div");
      track.className = "share-track";
      var fill = document.createElement("div");
      fill.className = "share-fill";
      fill.style.width = Math.max(3, Math.min(100, (it.count / base) * 100)).toFixed(1) + "%";
      track.appendChild(fill);

      row.appendChild(top);
      row.appendChild(track);
      container.appendChild(row);
    });
  }

  function extractPageSeries(page, data) {
    var slices = page.daySlices || [];
    if (state.range === "today" || state.granularity === "hourly") {
      var hourly = new Array(24).fill(0);
      slices.forEach(function (s) {
        if (state.range === "today" && s.day !== data.win.todayLocal) return;
        var hr = s.hourly || [];
        for (var i = 0; i < 24; i++) hourly[i] += hr[i] || 0;
      });
      return hourly;
    }
    if (slices.length > 0) {
      return slices.map(function (s) { return s.daily || 0; });
    }
    return [0, page.count];
  }

  function renderPagesList(data) {
    var listEl = document.getElementById("pages-list");
    var countLabel = document.getElementById("pages-count-label");
    if (!listEl) return;
    while (listEl.firstChild) listEl.removeChild(listEl.firstChild);

    var q = state.pageFilter.trim().toLowerCase();
    var filtered = data.pages.filter(function (p) {
      if (!q) return true;
      return (
        p.name.toLowerCase().indexOf(q) !== -1 ||
        p.pathDisplay.toLowerCase().indexOf(q) !== -1 ||
        p.domain.toLowerCase().indexOf(q) !== -1
      );
    });

    if (countLabel) {
      countLabel.textContent = "· " + filtered.length + (filtered.length === 1 ? " page" : " pages");
    }

    if (filtered.length === 0) {
      var empty = document.createElement("p");
      empty.className = "empty-hint";
      empty.textContent = q
        ? "No pages match \"" + state.pageFilter.trim() + "\" in this range."
        : "No pageviews recorded yet for this site and date range.";
      listEl.appendChild(empty);
      return;
    }

    var denom = Math.max(data.totalViews, 1);

    filtered.forEach(function (page) {
      var row = document.createElement("div");
      row.className = "page-row";
      row.tabIndex = 0;
      row.setAttribute("role", "button");
      row.setAttribute("aria-label", "Inspect " + page.name + " (" + page.count + " views)");

      var main = document.createElement("div");
      main.className = "page-row-main";

      var titleLine = document.createElement("div");
      titleLine.className = "page-row-title-line";

      var titleSpan = document.createElement("span");
      titleSpan.className = "page-row-title";
      titleSpan.textContent = page.name;

      var extLink = document.createElement("a");
      extLink.className = "page-ext-anchor";
      extLink.href = page.url;
      extLink.target = "_blank";
      extLink.rel = "noopener noreferrer";
      extLink.title = "Open " + page.url;
      extLink.setAttribute("aria-label", "Open " + page.name + " in new tab");
      var extIcon = document.createElement("span");
      extIcon.className = "material-symbols-outlined";
      extIcon.setAttribute("aria-hidden", "true");
      extIcon.textContent = "open_in_new";
      extLink.appendChild(extIcon);
      extLink.addEventListener("click", function (ev) {
        ev.stopPropagation();
      });

      titleLine.appendChild(titleSpan);
      titleLine.appendChild(extLink);

      var sub = document.createElement("div");
      sub.className = "page-row-sub";
      sub.textContent = state.site === "all"
        ? page.pathDisplay + " · " + page.domain
        : page.pathDisplay + (page.rawTitle ? " · " + page.rawTitle : "");

      main.appendChild(titleLine);
      main.appendChild(sub);

      var spark = createSvgEl("svg", {
        class: "page-row-spark",
        "aria-hidden": "true"
      });
      renderMiniSparkline(spark, extractPageSeries(page, data));

      var shareWrap = document.createElement("div");
      shareWrap.className = "page-row-share";
      var track = document.createElement("div");
      track.className = "share-track";
      var fill = document.createElement("div");
      fill.className = "share-fill";
      var pctFloat = (page.count / denom) * 100;
      fill.style.width = Math.max(3, Math.min(100, pctFloat)).toFixed(1) + "%";
      track.appendChild(fill);

      var pctText = document.createElement("span");
      pctText.className = "page-row-pct";
      pctText.textContent = Math.round(pctFloat) + "%";
      shareWrap.appendChild(track);
      shareWrap.appendChild(pctText);

      var viewsEl = document.createElement("div");
      viewsEl.className = "page-row-views";
      viewsEl.textContent = page.count.toLocaleString();

      row.appendChild(main);
      row.appendChild(spark);
      row.appendChild(shareWrap);
      row.appendChild(viewsEl);

      row.addEventListener("click", function () {
        openPageDrawer(page, data);
      });
      row.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          openPageDrawer(page, data);
        }
      });

      listEl.appendChild(row);
    });
  }

  // --------------------------------------------------------------------------
  // Tokenized GM3 Panel Loading Spinners & Honest Total-Failure Error States
  // --------------------------------------------------------------------------
  function clearChildren(el) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  function createGm3SpinnerSvg() {
    var svg = createSvgEl("svg", {
      class: "gm3-spinner",
      viewBox: "0 0 24 24",
      "aria-hidden": "true"
    });
    svg.appendChild(createSvgEl("circle", {
      class: "gm3-spinner-track",
      cx: "12",
      cy: "12",
      r: "9",
      fill: "none",
      "stroke-width": "2.5"
    }));
    svg.appendChild(createSvgEl("circle", {
      class: "gm3-spinner-arc",
      cx: "12",
      cy: "12",
      r: "9",
      fill: "none",
      "stroke-width": "2.5",
      "stroke-linecap": "round"
    }));
    return svg;
  }

  function createPanelLoadingNode(compact) {
    var wrap = document.createElement("div");
    wrap.className = compact ? "kpi-loading-inline" : "panel-state panel-state--loading";
    wrap.setAttribute("role", "status");
    wrap.setAttribute("aria-live", "polite");
    if (compact) {
      wrap.style.display = "inline-flex";
      wrap.style.alignItems = "center";
      wrap.style.gap = "10px";
    }
    wrap.appendChild(createGm3SpinnerSvg());
    var lbl = document.createElement("span");
    lbl.className = "panel-state-label";
    lbl.textContent = "Loading…";
    wrap.appendChild(lbl);
    return wrap;
  }

  function createPanelErrorNode(message) {
    var wrap = document.createElement("div");
    wrap.className = "panel-state panel-state--error";
    wrap.setAttribute("role", "alert");

    var icon = document.createElement("span");
    icon.className = "material-symbols-outlined panel-error-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "cloud_off";
    wrap.appendChild(icon);

    var lbl = document.createElement("span");
    lbl.className = "panel-state-label";
    lbl.textContent = message || "Failed to fetch";
    wrap.appendChild(lbl);

    var retryBtn = document.createElement("button");
    retryBtn.type = "button";
    retryBtn.className = "btn btn-tonal btn-compact panel-retry-btn";
    retryBtn.textContent = "Retry";
    retryBtn.addEventListener("click", function () {
      loadAnalytics(true);
    });
    wrap.appendChild(retryBtn);
    return wrap;
  }

  function renderPanelLoadingInto(container) {
    if (!container) return;
    clearChildren(container);
    container.appendChild(createPanelLoadingNode(false));
  }

  function renderPanelErrorInto(container, message) {
    if (!container) return;
    clearChildren(container);
    container.appendChild(createPanelErrorNode(message));
  }

  function setKpisLoading() {
    var pvState = document.getElementById("kpi-pageviews-state");
    var pvBody = document.getElementById("kpi-pageviews-body");
    var pvMeta = document.getElementById("kpi-pageviews-meta");
    var heroBadge = document.getElementById("kpi-hero-badge");
    if (pvState) {
      clearChildren(pvState);
      pvState.appendChild(createPanelLoadingNode(true));
      pvState.hidden = false;
    }
    if (pvBody) pvBody.hidden = true;
    if (pvMeta) pvMeta.textContent = "";
    if (heroBadge) heroBadge.hidden = true;

    var uqState = document.getElementById("kpi-unique-state");
    var uqVal = document.getElementById("kpi-unique-visits");
    var uqMeta = document.getElementById("kpi-unique-meta");
    if (uqState) {
      clearChildren(uqState);
      uqState.appendChild(createPanelLoadingNode(true));
      uqState.hidden = false;
    }
    if (uqVal) uqVal.hidden = true;
    if (uqMeta) uqMeta.textContent = "";

    var tpState = document.getElementById("kpi-top-project-state");
    var tpName = document.getElementById("kpi-top-project-name");
    var tpStats = document.getElementById("kpi-top-project-stats");
    var tpLink = document.getElementById("kpi-top-project-link");
    if (tpState) {
      clearChildren(tpState);
      tpState.appendChild(createPanelLoadingNode(true));
      tpState.hidden = false;
    }
    if (tpName) tpName.hidden = true;
    if (tpStats) tpStats.textContent = "";
    if (tpLink) tpLink.hidden = true;
  }

  function setAllPanelsLoading() {
    state.lastData = null;
    setKpisLoading();

    var syncLabel = document.getElementById("sync-status-label");
    if (syncLabel) syncLabel.textContent = "Loading…";

    var chartState = document.getElementById("trend-chart-state");
    var trendSvg = document.getElementById("trend-chart-svg");
    var trendReadout = document.getElementById("trend-chart-readout");
    if (chartState) {
      renderPanelLoadingInto(chartState);
      chartState.hidden = false;
    }
    if (trendSvg) trendSvg.hidden = true;
    if (trendReadout) trendReadout.hidden = true;

    [
      "referrers-count-label",
      "pages-count-label",
      "browsers-count-label",
      "systems-count-label",
      "sizes-count-label",
      "locations-count-label"
    ].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = "";
    });

    [
      "referrers-list",
      "pages-list",
      "browsers-breakdown-list",
      "systems-breakdown-list",
      "sizes-breakdown-list",
      "locations-breakdown-list"
    ].forEach(function (id) {
      renderPanelLoadingInto(document.getElementById(id));
    });
  }

  function setAllPanelsError(message) {
    state.lastData = null;
    var msg = message || "Failed to fetch";

    var syncLabel = document.getElementById("sync-status-label");
    if (syncLabel) syncLabel.textContent = msg;

    var pvState = document.getElementById("kpi-pageviews-state");
    var pvBody = document.getElementById("kpi-pageviews-body");
    var pvViews = document.getElementById("kpi-pageviews");
    var pvSpark = document.getElementById("kpi-hero-sparkline");
    var pvMeta = document.getElementById("kpi-pageviews-meta");
    var heroBadge = document.getElementById("kpi-hero-badge");
    if (pvState) {
      clearChildren(pvState);
      pvState.hidden = true;
    }
    if (pvBody) pvBody.hidden = false;
    if (pvViews) pvViews.textContent = "—";
    if (pvSpark) clearChildren(pvSpark);
    if (pvMeta) pvMeta.textContent = msg;
    if (heroBadge) heroBadge.hidden = true;

    var uqState = document.getElementById("kpi-unique-state");
    var uqVal = document.getElementById("kpi-unique-visits");
    var uqMeta = document.getElementById("kpi-unique-meta");
    if (uqState) {
      clearChildren(uqState);
      uqState.hidden = true;
    }
    if (uqVal) {
      uqVal.hidden = false;
      uqVal.textContent = "—";
    }
    if (uqMeta) uqMeta.textContent = msg;

    var tpState = document.getElementById("kpi-top-project-state");
    var tpName = document.getElementById("kpi-top-project-name");
    var tpStats = document.getElementById("kpi-top-project-stats");
    var tpLink = document.getElementById("kpi-top-project-link");
    if (tpState) {
      clearChildren(tpState);
      tpState.hidden = true;
    }
    if (tpName) {
      tpName.hidden = false;
      tpName.textContent = "—";
    }
    if (tpStats) tpStats.textContent = msg;
    if (tpLink) tpLink.hidden = true;

    var chartState = document.getElementById("trend-chart-state");
    var trendSvg = document.getElementById("trend-chart-svg");
    var trendReadout = document.getElementById("trend-chart-readout");
    if (chartState) {
      renderPanelErrorInto(chartState, msg);
      chartState.hidden = false;
    }
    if (trendSvg) trendSvg.hidden = true;
    if (trendReadout) trendReadout.hidden = true;

    [
      "referrers-list",
      "pages-list",
      "browsers-breakdown-list",
      "systems-breakdown-list",
      "sizes-breakdown-list",
      "locations-breakdown-list"
    ].forEach(function (id) {
      renderPanelErrorInto(document.getElementById(id), msg);
    });
  }

  function renderDashboard(data, opts) {
    var breakdownsPending = Boolean(opts && opts.breakdownsPending);
    state.lastData = data;

    // Subtitle & Trend timezone label (browser-local timezone)
    var scopeLabel = state.site === "all"
      ? "All 3 properties"
      : (session.sites.find(function (s) { return s.code === state.site; }) || { domain: state.site }).domain;
    var updatedText = "Updated " + formatLocalUpdatedTime(data.fetchedAt);
    var subEl = document.getElementById("active-scope-subtitle");
    if (subEl) {
      clearChildren(subEl);
      subEl.appendChild(document.createTextNode(
        scopeLabel + " · " + data.win.label + " · " + formatLocalZoneSubtitle(data.fetchedAt)
      ));
      var mobSync = document.createElement("span");
      mobSync.className = "mobile-sync-inline";
      mobSync.textContent = " · " + updatedText;
      subEl.appendChild(mobSync);
    }

    var trendTzEl = document.getElementById("trend-tz-label");
    if (trendTzEl) {
      trendTzEl.textContent = getLocalShortZone(data.fetchedAt);
      trendTzEl.title = getLocalTimeZoneId();
    }

    // Sync timestamp
    var syncLabel = document.getElementById("sync-status-label");
    if (syncLabel) {
      syncLabel.textContent = updatedText;
      syncLabel.title = getLocalTimeZoneId();
    }

    // Hero KPI 1: Total Pageviews + Sparkline + Site Breakdown
    var pvState = document.getElementById("kpi-pageviews-state");
    var pvBody = document.getElementById("kpi-pageviews-body");
    if (pvState) {
      clearChildren(pvState);
      pvState.hidden = true;
    }
    if (pvBody) pvBody.hidden = false;

    var kpiViews = document.getElementById("kpi-pageviews");
    if (kpiViews) kpiViews.textContent = data.totalViews.toLocaleString();

    var todayEntry = data.days.find(function (d) { return d.day === data.win.todayLocal; });
    var todayCount = todayEntry ? todayEntry.daily : 0;
    var heroBadge = document.getElementById("kpi-hero-badge");
    if (heroBadge) {
      heroBadge.hidden = false;
      if (todayCount > 0) {
        heroBadge.className = "badge badge-success";
        heroBadge.textContent = "+" + todayCount.toLocaleString() + " today";
      } else {
        heroBadge.className = "badge badge-neutral";
        heroBadge.textContent = data.win.label;
      }
    }

    var heroSpark = document.getElementById("kpi-hero-sparkline");
    if (heroSpark) {
      var sparkSeries = buildChartSeries(data).map(function (s) { return s.value; });
      renderMiniSparkline(heroSpark, sparkSeries);
    }

    var heroMeta = document.getElementById("kpi-pageviews-meta");
    if (heroMeta) {
      if (state.site === "all") {
        heroMeta.textContent = data.siteTotals.map(function (st) {
          return st.count.toLocaleString() + " on " + st.site.domain;
        }).join(" · ");
      } else {
        var peakHour = 0;
        var peakVal = 0;
        data.days.forEach(function (d) {
          (d.hourly || []).forEach(function (v, idx) {
            if (v > peakVal) {
              peakVal = v;
              peakHour = idx;
            }
          });
        });
        heroMeta.textContent = peakVal > 0
          ? "Peak hour: " + formatLocalHour(peakHour, data.fetchedAt) + " (" + peakVal + " views)"
          : "No traffic spikes in selected window";
      }
    }

    // KPI 2: Unique Visits
    var uqState = document.getElementById("kpi-unique-state");
    var kpiUnique = document.getElementById("kpi-unique-visits");
    var kpiUniqueMeta = document.getElementById("kpi-unique-meta");
    if (uqState) {
      clearChildren(uqState);
      uqState.hidden = true;
    }
    if (kpiUnique) {
      kpiUnique.hidden = false;
      kpiUnique.textContent = data.totalViews.toLocaleString();
    }
    if (kpiUniqueMeta) {
      if (breakdownsPending) {
        kpiUniqueMeta.textContent = "Loading country & source breakdown…";
      } else {
        var numCountries = data.locations.length;
        var numRefs = data.referrers.length;
        kpiUniqueMeta.textContent =
          numCountries + (numCountries === 1 ? " country" : " countries") + " · " +
          numRefs + (numRefs === 1 ? " source" : " sources") + " · Cookieless";
      }
    }

    // KPI 3: Top Project (e.g. Groove Explorer highlighted cleanly with external link!)
    var tpState = document.getElementById("kpi-top-project-state");
    var topPage = data.pages[0] || null;
    var topNameEl = document.getElementById("kpi-top-project-name");
    var topMetaText = document.getElementById("kpi-top-project-stats");
    var topLinkEl = document.getElementById("kpi-top-project-link");
    if (tpState) {
      clearChildren(tpState);
      tpState.hidden = true;
    }
    if (topNameEl) topNameEl.hidden = false;
    if (topPage) {
      if (topNameEl) topNameEl.textContent = topPage.name;
      var sharePct = data.totalViews > 0 ? Math.round((topPage.count / data.totalViews) * 100) : 100;
      if (topMetaText) {
        topMetaText.textContent = topPage.count.toLocaleString() +
          (topPage.count === 1 ? " visit" : " visits") + " · " + sharePct + "% share";
      }
      if (topLinkEl) {
        topLinkEl.href = topPage.url;
        topLinkEl.hidden = false;
      }
    } else {
      if (topNameEl) topNameEl.textContent = "No visits yet";
      if (topMetaText) topMetaText.textContent = "Waiting for first visitor";
      if (topLinkEl) topLinkEl.hidden = true;
    }

    // Main Trend Chart
    var chartState = document.getElementById("trend-chart-state");
    var trendSvg = document.getElementById("trend-chart-svg");
    var trendReadout = document.getElementById("trend-chart-readout");
    if (chartState) {
      clearChildren(chartState);
      chartState.hidden = true;
    }
    if (trendSvg) trendSvg.hidden = false;
    if (trendReadout) trendReadout.hidden = false;
    if (trendSvg) renderMainTrendChart(trendSvg, trendReadout, data);

    // Per-page / Per-project Breakdown
    renderPagesList(data);

    // If breakdowns are still queued/in-flight during Phase 1 streaming, keep those 5 panels spinning!
    if (breakdownsPending) {
      [
        "referrers-list",
        "browsers-breakdown-list",
        "systems-breakdown-list",
        "sizes-breakdown-list",
        "locations-breakdown-list"
      ].forEach(function (id) {
        renderPanelLoadingInto(document.getElementById(id));
      });
      return;
    }

    // Top Referrers
    var refsCountEl = document.getElementById("referrers-count-label");
    if (refsCountEl) {
      refsCountEl.textContent = "· " + data.referrers.length + (data.referrers.length === 1 ? " source" : " sources");
    }
    var refsList = document.getElementById("referrers-list");
    if (refsList) {
      renderBreakdownRows(refsList, data.referrers, data.totalViews, "No referrer data recorded in this window.");
    }

    // Separate Browsers Panel
    var browsersCountEl = document.getElementById("browsers-count-label");
    if (browsersCountEl) {
      browsersCountEl.textContent = "· " + data.browsers.length + (data.browsers.length === 1 ? " browser" : " browsers");
    }
    var browsersList = document.getElementById("browsers-breakdown-list");
    if (browsersList) {
      renderBreakdownRows(browsersList, data.browsers, data.totalViews, "No browser data recorded in this window.");
    }

    // Separate Systems Panel
    var systemsCountEl = document.getElementById("systems-count-label");
    if (systemsCountEl) {
      systemsCountEl.textContent = "· " + data.systems.length + (data.systems.length === 1 ? " system" : " systems");
    }
    var systemsList = document.getElementById("systems-breakdown-list");
    if (systemsList) {
      renderBreakdownRows(systemsList, data.systems, data.totalViews, "No operating system data recorded in this window.");
    }

    // Screen Sizes Panel
    var sizesCountEl = document.getElementById("sizes-count-label");
    if (sizesCountEl) {
      sizesCountEl.textContent = "· " + data.sizes.length + (data.sizes.length === 1 ? " viewport" : " viewports");
    }
    var sizesList = document.getElementById("sizes-breakdown-list");
    if (sizesList) {
      renderBreakdownRows(sizesList, data.sizes, data.totalViews, "No screen size data recorded in this window.");
    }

    // Locations Panel
    var locCountEl = document.getElementById("locations-count-label");
    if (locCountEl) {
      locCountEl.textContent = "· " + data.locations.length + (data.locations.length === 1 ? " country" : " countries");
    }
    var locList = document.getElementById("locations-breakdown-list");
    if (locList) {
      renderBreakdownRows(locList, data.locations, data.totalViews, "No country data recorded in this window.");
    }
  }

  // --------------------------------------------------------------------------
  // Music Map 2D Popularity Constellation Map & Hot List (Cloudflare D1 + Snapshot)
  // --------------------------------------------------------------------------
  function getMusicMapApiBase() {
    if (typeof window !== "undefined" && typeof window.BTMM_STATS_HOTLIST_API_URL === "string" && window.BTMM_STATS_HOTLIST_API_URL.trim()) {
      return window.BTMM_STATS_HOTLIST_API_URL.trim().replace(/\/+$/, "");
    }
    return DEFAULT_MUSIC_MAP_API.replace(/\/+$/, "");
  }

  function formatListenDuration(rawSec) {
    var sec = Math.max(0, Math.round(Number(rawSec) || 0));
    if (sec < 60) return sec + "s";
    var mins = Math.floor(sec / 60);
    var remSec = sec % 60;
    if (mins < 60) {
      return remSec > 0 ? (mins + "m " + remSec + "s") : (mins + "m");
    }
    var hrs = Math.floor(mins / 60);
    var remMin = mins % 60;
    return remMin > 0 ? (hrs + "h " + remMin + "m") : (hrs + "h");
  }

  function formatHotlistEventTime(isoStr) {
    if (!isoStr) return "";
    var dt = new Date(isoStr);
    if (isNaN(dt.getTime())) return String(isoStr);
    var diffSec = Math.round((Date.now() - dt.getTime()) / 1000);
    if (diffSec >= 0 && diffSec < 60) return "Just now";
    if (diffSec >= 60 && diffSec < 3600) return Math.floor(diffSec / 60) + "m ago";
    if (diffSec >= 3600 && diffSec < 86400) return Math.floor(diffSec / 3600) + "h ago";
    try {
      return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }).format(dt);
    } catch (_) {
      return formatLocalYmd(dt);
    }
  }

  function syncMusicMapCardsVisibility() {
    var show = state.site !== "awake-in";
    var popCard = document.getElementById("music-map-popularity-card");
    var hotCard = document.getElementById("music-map-hotlist-card");
    if (popCard) popCard.hidden = !show;
    if (hotCard) hotCard.hidden = !show;
    return show;
  }

  function syncHotlistCardVisibility() {
    return syncMusicMapCardsVisibility();
  }

  function syncPopmapScopeButtons() {
    var winBtn = document.getElementById("popmap-scope-window-btn");
    if (winBtn) {
      winBtn.textContent = state.range === "today" ? "Today" : state.range;
    }
    document.querySelectorAll("[data-popmap-scope]").forEach(function (btn) {
      var active = btn.getAttribute("data-popmap-scope") === state.popmapScope;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function getEffectivePopmapRange() {
    return state.popmapScope === "all" ? "all" : state.range;
  }

  function parseCorpusDataToGeometry(corpus) {
    if (!corpus || !Array.isArray(corpus.tracks)) return null;
    var meta = corpus.meta || {};
    var mapObj = corpus.map || {};
    var trackMap = meta.track_map || corpus.track_map || mapObj.track_map || {};
    var trackNear = meta.track_near || corpus.track_near || mapObj.track_near || {};
    var styleGroups = meta.style_groups || corpus.style_groups || mapObj.style_groups || [];
    var erasById = {};
    (corpus.eras || []).forEach(function (e) {
      if (e && e.id) erasById[e.id] = e.label || e.id;
    });

    var minX = Infinity;
    var maxX = -Infinity;
    var minY = Infinity;
    var maxY = -Infinity;
    var rawNodes = [];

    corpus.tracks.forEach(function (t) {
      if (!t || !t.id) return;
      var tm = trackMap[t.id];
      var coords = (tm && (tm.vibe || tm.similarity)) || null;
      if (!Array.isArray(coords) || coords.length < 2) return;
      var x = Number(coords[0]);
      var y = Number(coords[1]);
      if (!isFinite(x) || !isFinite(y)) return;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      var eraLabel = t.is_ai
        ? ("Gen AI (" + (t.year || "2025") + ")")
        : (erasById[t.era] || t.era || "");
      rawNodes.push({
        id: t.id,
        title: t.title || t.id,
        era: eraLabel,
        clusterIdx: Number.isFinite(Number(t.cluster_idx)) ? Number(t.cluster_idx) : 0,
        clusterLabel: t.cluster_label || "",
        isAi: Boolean(t.is_ai),
        isSketch: Boolean(t.is_sketch),
        rawX: x,
        rawY: y
      });
    });

    if (!rawNodes.length) return null;
    var spanX = Math.max(0.001, maxX - minX);
    var spanY = Math.max(0.001, maxY - minY);

    var nodeById = {};
    rawNodes.forEach(function (n) {
      n.nx = (n.rawX - minX) / spanX;
      n.ny = (n.rawY - minY) / spanY;
      nodeById[n.id] = n;
    });

    // Build subtle intra-island constellation filaments (short nearest-neighbor links)
    var edgeKeys = {};
    var filaments = [];
    rawNodes.forEach(function (n) {
      var nearList = trackNear[n.id];
      if (!Array.isArray(nearList)) return;
      for (var i = 0; i < Math.min(2, nearList.length); i++) {
        var entry = nearList[i];
        var otherId = typeof entry === "string"
          ? entry
          : (Array.isArray(entry) ? entry[0] : (entry && entry.id));
        if (!otherId || !nodeById[otherId] || otherId === n.id) continue;
        var other = nodeById[otherId];
        if (other.clusterIdx !== n.clusterIdx) continue;
        var dx = n.nx - other.nx;
        var dy = n.ny - other.ny;
        if (Math.sqrt(dx * dx + dy * dy) > 0.095) continue;
        var pairKey = n.id < otherId ? (n.id + "|" + otherId) : (otherId + "|" + n.id);
        if (edgeKeys[pairKey]) continue;
        edgeKeys[pairKey] = true;
        filaments.push([n, other]);
      }
    });

    var islands = [];
    styleGroups.forEach(function (g) {
      if (!g || !isFinite(Number(g.cx)) || !isFinite(Number(g.cy))) return;
      if (g.id === "d10_genai" && Array.isArray(g.subclusters) && g.subclusters.length > 0) {
        var sumX = 0;
        var sumY = 0;
        var cnt = 0;
        g.subclusters.forEach(function (sc) {
          if (sc && isFinite(Number(sc.cx)) && isFinite(Number(sc.cy))) {
            sumX += Number(sc.cx);
            sumY += Number(sc.cy);
            cnt++;
          }
        });
        islands.push({
          label: g.short_label || g.label || "Gen AI",
          nx: ((cnt ? sumX / cnt : Number(g.cx)) - minX) / spanX,
          ny: ((cnt ? sumY / cnt : Number(g.cy)) - minY) / spanY,
          clusterIdx: Number.isFinite(Number(g.idx)) ? Number(g.idx) : 10
        });
        return;
      }
      islands.push({
        label: g.short_label || g.label || "",
        nx: (Number(g.cx) - minX) / spanX,
        ny: (Number(g.cy) - minY) / spanY,
        clusterIdx: Number.isFinite(Number(g.idx)) ? Number(g.idx) : 0
      });
    });

    return {
      nodes: rawNodes,
      nodeById: nodeById,
      filaments: filaments,
      islands: islands
    };
  }

  function extractJsonFromDataScript(rawJs) {
    var text = String(rawJs || "");
    var firstBrace = text.indexOf("{");
    var lastBrace = text.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace <= firstBrace) {
      throw new Error("Invalid data.js format");
    }
    return JSON.parse(text.slice(firstBrace, lastBrace + 1));
  }

  function loadMusicMapCatalogGeometry() {
    if (catalogGeometryCache) return Promise.resolve(catalogGeometryCache);
    if (typeof window !== "undefined" && window.CORPUS_DATA) {
      catalogGeometryCache = parseCorpusDataToGeometry(window.CORPUS_DATA);
      if (catalogGeometryCache) return Promise.resolve(catalogGeometryCache);
    }
    if (catalogGeometryPromise) return catalogGeometryPromise;

    var candidateUrls = [];
    if (typeof window !== "undefined" && typeof window.BTMM_STATS_DATA_JS_URL === "string" && window.BTMM_STATS_DATA_JS_URL.trim()) {
      candidateUrls.push(window.BTMM_STATS_DATA_JS_URL.trim());
    }
    candidateUrls.push("/music-map/js/data.js");
    candidateUrls.push("https://billtribble.github.io/music-map/js/data.js");

    catalogGeometryPromise = (async function () {
      for (var i = 0; i < candidateUrls.length; i++) {
        try {
          var resp = await fetch(candidateUrls[i], { method: "GET", credentials: "omit" });
          if (!resp.ok) continue;
          var text = await resp.text();
          var parsed = extractJsonFromDataScript(text);
          var geom = parseCorpusDataToGeometry(parsed);
          if (geom) {
            catalogGeometryCache = geom;
            return geom;
          }
        } catch (_) {}
      }
      catalogGeometryPromise = null;
      return null;
    })();

    return catalogGeometryPromise;
  }

  function samplePopmapTokens() {
    var cs = getComputedStyle(document.documentElement);
    function tok(name, fb) {
      var v = (cs.getPropertyValue(name) || "").trim();
      return v || fb;
    }
    var clusters = [];
    for (var i = 0; i <= 10; i++) {
      clusters.push(tok("--md-sys-color-cluster-" + i, "rgb(14, 87, 208)"));
    }
    return {
      isDark: resolveTheme() === "dark",
      clusters: clusters,
      primary: tok("--md-sys-color-primary", "rgb(14, 87, 208)"),
      primaryContainer: tok("--md-sys-color-primary-container", "rgb(211, 227, 253)"),
      surfaceContainer: tok("--md-sys-color-surface-container", "rgb(240, 244, 249)"),
      surfaceLowest: tok("--md-sys-color-surface-container-lowest", "rgb(255, 255, 255)"),
      onSurface: tok("--md-sys-color-on-surface", "rgb(31, 31, 31)"),
      onSurfaceVariant: tok("--md-sys-color-on-surface-variant", "rgb(68, 71, 70)"),
      outlineVariant: tok("--md-sys-color-outline-variant", "rgb(196, 199, 197)")
    };
  }

  function getPopmapMetricValue(trackStat, metricKey) {
    if (!trackStat) return 0;
    if (metricKey === "plays") return Number(trackStat.plays || 0);
    if (metricKey === "stars") return Number(trackStat.stars || 0);
    if (metricKey === "downloads") return Number(trackStat.downloads || 0);
    return Number(trackStat.popularity_score || 0);
  }

  function formatPopmapMetricBadge(trackStat, metricKey) {
    if (!trackStat) return "";
    if (metricKey === "plays") {
      var p = Number(trackStat.plays || 0);
      return p + (p === 1 ? " play" : " plays");
    }
    if (metricKey === "stars") {
      var s = Number(trackStat.stars || 0);
      return s + (s === 1 ? " star" : " stars");
    }
    if (metricKey === "downloads") {
      var d = Number(trackStat.downloads || 0);
      return d + (d === 1 ? " dl" : " dls");
    }
    var sc = Number(trackStat.popularity_score || 0);
    return (Math.round(sc * 10) / 10) + " pts";
  }

  function updatePopmapInspector(nodeEntry, pal) {
    var dotEl = document.getElementById("popmap-inspector-dot");
    var nameEl = document.getElementById("popmap-inspector-name");
    var subEl = document.getElementById("popmap-inspector-sub");
    var pillsEl = document.getElementById("popmap-inspector-pills");
    var openEl = document.getElementById("popmap-inspector-open");
    if (!nameEl || !subEl || !pillsEl || !openEl) return;

    clearChildren(pillsEl);
    var palette = pal || samplePopmapTokens();

    if (!nodeEntry) {
      var geomCount = catalogGeometryCache ? catalogGeometryCache.nodes.length : 0;
      var activeCount = popmapScreenNodes.filter(function (x) { return x.metricVal > 0; }).length;
      if (dotEl) {
        dotEl.style.backgroundColor = "var(--md-sys-color-outline-variant)";
        dotEl.classList.remove("is-active");
      }
      if (activeCount === 0) {
        nameEl.textContent = "No plays, stars, or downloads recorded in this window yet";
        subEl.textContent = geomCount
          ? ("Catalog constellation ready (" + geomCount + " tracks) · Hover or tap any node to inspect")
          : "Hover or tap any node on the constellation to inspect";
      } else {
        nameEl.textContent = "Hover or tap any glowing node to inspect track popularity";
        subEl.textContent = activeCount + " active " + (activeCount === 1 ? "track" : "tracks") + " across " + geomCount + " catalog coordinates";
      }
      openEl.hidden = true;
      return;
    }

    var n = nodeEntry.node;
    var st = nodeEntry.stat;
    var clusterColor = palette.clusters[((n.clusterIdx % palette.clusters.length) + palette.clusters.length) % palette.clusters.length];
    if (dotEl) {
      dotEl.style.backgroundColor = clusterColor;
      dotEl.classList.add("is-active");
    }

    var prefix = nodeEntry.metricRank > 0 ? ("#" + nodeEntry.metricRank + " · ") : "";
    nameEl.textContent = prefix + n.title;

    var subBits = [];
    if (n.clusterLabel) subBits.push(n.clusterLabel);
    if (n.era) subBits.push(n.era);
    if (st && Number(st.listened_sec || 0) > 0) {
      subBits.push(formatListenDuration(st.listened_sec) + " listened");
    }
    if (st && Number(st.plays || 0) > 0) {
      subBits.push(Number(st.manual_plays || 0) + " manual · " + Number(st.autoplay_plays || 0) + " auto-play");
    }
    if (!st) {
      subBits.push("0 activity in selected window");
    }
    subEl.textContent = subBits.join(" · ");

    if (st) {
      if (Number(st.popularity_score || 0) > 0) {
        pillsEl.appendChild(createMetricPill(
          "badge-score",
          "bolt",
          String(Math.round(Number(st.popularity_score) * 10) / 10),
          "Weighted popularity score"
        ));
      }
      if (Number(st.plays || 0) > 0) {
        pillsEl.appendChild(createMetricPill(
          "badge-play",
          "play_arrow",
          String(st.plays),
          st.plays + (st.plays === 1 ? " qualified play" : " qualified plays") + " (" + Number(st.unique_listeners || 0) + " listeners)"
        ));
      }
      if (Number(st.stars || 0) > 0) {
        pillsEl.appendChild(createMetricPill(
          "badge-star",
          "star",
          String(st.stars),
          st.stars + (st.stars === 1 ? " star" : " stars")
        ));
      }
      if (Number(st.downloads || 0) > 0) {
        pillsEl.appendChild(createMetricPill(
          "badge-download",
          "download",
          String(st.downloads),
          st.downloads + (st.downloads === 1 ? " download" : " downloads")
        ));
      }
    }

    openEl.href = (st && st.url) || ("https://billtribble.github.io/music-map/?track=" + encodeURIComponent(n.id));
    openEl.hidden = false;
  }

  function drawRoundedRectPath(ctx, x, y, w, h, r) {
    var rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
  }

  function paintPopularityCanvas() {
    var canvas = document.getElementById("popmap-canvas");
    var stage = document.getElementById("popmap-stage");
    var stateSlot = document.getElementById("popmap-state-slot");
    var sumEl = document.getElementById("popmap-summary-label");
    if (!canvas || !stage || !syncMusicMapCardsVisibility()) return;

    if (!catalogGeometryCache) {
      return;
    }

    if (stateSlot) stateSlot.hidden = true;
    canvas.hidden = false;

    var rect = stage.getBoundingClientRect();
    var cssW = Math.max(260, Math.round(rect.width || stage.clientWidth || 800));
    var cssH = Math.max(220, Math.round(rect.height || stage.clientHeight || 356));
    var dpr = Math.min(2.5, Math.max(1, window.devicePixelRatio || 1));
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }

    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);

    var pal = samplePopmapTokens();
    var isMobile = cssW < 540;
    var padX = isMobile ? 20 : 38;
    var padY = isMobile ? 22 : 30;
    var plotW = Math.max(80, cssW - padX * 2);
    var plotH = Math.max(80, cssH - padY * 2);

    var popTracks = (state.lastPopular && Array.isArray(state.lastPopular.tracks)) ? state.lastPopular.tracks : [];
    var statById = {};
    popTracks.forEach(function (tr) {
      if (tr && tr.track_id) statById[tr.track_id] = tr;
    });

    var activeList = [];
    var allMapped = [];
    catalogGeometryCache.nodes.forEach(function (n) {
      var sx = padX + n.nx * plotW;
      var sy = padY + n.ny * plotH;
      var st = statById[n.id] || null;
      var val = getPopmapMetricValue(st, state.popmapMetric);
      var entry = {
        node: n,
        stat: st,
        sx: sx,
        sy: sy,
        metricVal: val,
        metricRank: 0,
        radius: isMobile ? 1.85 : 2.35
      };
      allMapped.push(entry);
      if (val > 0) activeList.push(entry);
    });

    activeList.sort(function (a, b) {
      return (b.metricVal - a.metricVal) ||
             ((b.stat ? b.stat.popularity_score : 0) - (a.stat ? a.stat.popularity_score : 0));
    });
    var maxMetric = activeList.length ? Math.max(0.001, activeList[0].metricVal) : 1;
    activeList.forEach(function (e, idx) {
      e.metricRank = idx + 1;
      var norm = Math.sqrt(Math.max(0, e.metricVal) / maxMetric);
      e.radius = (isMobile ? 4.6 : 5.6) + norm * (isMobile ? 7.4 : 10.6);
    });

    popmapScreenNodes = allMapped;

    // Update header summary
    if (sumEl) {
      var scopeWord = state.popmapScope === "all" ? "all time" : (state.range === "today" ? "today" : state.range);
      if (activeList.length > 0) {
        sumEl.textContent = "· " + activeList.length + " active of " + allMapped.length + " tracks · " + scopeWord;
      } else {
        sumEl.textContent = "· " + allMapped.length + " catalog tracks · 0 active (" + scopeWord + ")";
      }
    }

    // 1. Subtle constellation filaments
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = pal.outlineVariant;
    ctx.globalAlpha = pal.isDark ? 0.16 : 0.22;
    ctx.beginPath();
    catalogGeometryCache.filaments.forEach(function (pair) {
      var a = pair[0];
      var b = pair[1];
      ctx.moveTo(padX + a.nx * plotW, padY + a.ny * plotH);
      ctx.lineTo(padX + b.nx * plotW, padY + b.ny * plotH);
    });
    ctx.stroke();

    // 2. Background catalog silhouette dots (tinted lightly by cluster so sonic islands are recognizable)
    allMapped.forEach(function (e) {
      if (e.metricVal > 0) return;
      var cCol = pal.clusters[((e.node.clusterIdx % pal.clusters.length) + pal.clusters.length) % pal.clusters.length];
      ctx.fillStyle = cCol;
      ctx.globalAlpha = pal.isDark ? 0.30 : 0.24;
      ctx.beginPath();
      ctx.arc(e.sx, e.sy, e.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Subtle genre-island watermarks
    ctx.font = (isMobile ? "500 10px " : "500 11px ") + "Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = pal.onSurfaceVariant;
    ctx.globalAlpha = pal.isDark ? 0.44 : 0.48;
    var islandBoxes = [];
    catalogGeometryCache.islands.forEach(function (isl) {
      if (!isl.label) return;
      var ix = Math.max(padX + 26, Math.min(cssW - padX - 26, padX + isl.nx * plotW));
      var iy = Math.max(padY + 10, Math.min(cssH - padY - 10, padY + isl.ny * plotH));
      var tw = ctx.measureText(isl.label).width + 10;
      var box = { x1: ix - tw / 2, y1: iy - 8, x2: ix + tw / 2, y2: iy + 8 };
      var collides = islandBoxes.some(function (b) {
        return !(box.x2 < b.x1 || box.x1 > b.x2 || box.y2 < b.y1 || box.y1 > b.y2);
      });
      if (!collides) {
        islandBoxes.push(box);
        ctx.fillText(isl.label, ix, iy);
      }
    });

    // 4. Active nodes (lowest -> highest so top tracks sit crisply on top)
    var focusId = state.popmapHoverId || state.popmapPinnedId || (activeList[0] ? activeList[0].node.id : null);
    var focusEntry = null;
    allMapped.forEach(function (e) {
      if (e.node.id === focusId) focusEntry = e;
    });

    for (var k = activeList.length - 1; k >= 0; k--) {
      var act = activeList[k];
      var col = pal.clusters[((act.node.clusterIdx % pal.clusters.length) + pal.clusters.length) % pal.clusters.length];
      var glowR = act.radius * 2.55;

      // Soft radial tonal glow
      ctx.save();
      ctx.globalAlpha = pal.isDark ? 0.34 : 0.24;
      var grad = ctx.createRadialGradient(act.sx, act.sy, act.radius * 0.25, act.sx, act.sy, glowR);
      grad.addColorStop(0, col);
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(act.sx, act.sy, glowR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Surface contrast collar
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = pal.surfaceContainer;
      ctx.beginPath();
      ctx.arc(act.sx, act.sy, act.radius + 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Core node circle
      ctx.globalAlpha = 0.96;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(act.sx, act.sy, act.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Focus ring on hovered / pinned / #1 node
    if (focusEntry) {
      var fCol = pal.clusters[((focusEntry.node.clusterIdx % pal.clusters.length) + pal.clusters.length) % pal.clusters.length];
      ctx.globalAlpha = 1;
      if (focusEntry.metricVal <= 0) {
        ctx.fillStyle = fCol;
        ctx.beginPath();
        ctx.arc(focusEntry.sx, focusEntry.sy, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.lineWidth = 2;
      ctx.strokeStyle = pal.onSurface;
      ctx.beginPath();
      ctx.arc(focusEntry.sx, focusEntry.sy, Math.max(4.5, focusEntry.radius) + 3.8, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 5. Collision-free callout pills for top active tracks (+ focused node)
    var maxCallouts = isMobile ? 3 : 5;
    var calloutCandidates = [];
    if (focusEntry && focusEntry.metricVal > 0) {
      calloutCandidates.push(focusEntry);
    }
    for (var cIdx = 0; cIdx < activeList.length && calloutCandidates.length < maxCallouts + 2; cIdx++) {
      if (activeList[cIdx] !== focusEntry) calloutCandidates.push(activeList[cIdx]);
    }

    var placedCallouts = [];
    ctx.font = (isMobile ? "600 11px " : "600 11.5px ") + "Inter, system-ui, sans-serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";

    calloutCandidates.forEach(function (cand) {
      if (placedCallouts.length >= maxCallouts && cand !== focusEntry) return;
      var shortTitle = cand.node.title.length > 24 ? (cand.node.title.slice(0, 23) + "…") : cand.node.title;
      var metricSuffix = formatPopmapMetricBadge(cand.stat, state.popmapMetric);
      var labelText = "#" + cand.metricRank + " " + shortTitle + (metricSuffix ? (" · " + metricSuffix) : "");
      var textW = Math.ceil(ctx.measureText(labelText).width);
      var pillW = textW + 16;
      var pillH = 22;

      var placeRight = cand.sx + cand.radius + 8 + pillW <= cssW - 8;
      var px = placeRight ? (cand.sx + cand.radius + 7) : Math.max(8, cand.sx - cand.radius - 7 - pillW);
      var py = Math.max(8, Math.min(cssH - pillH - 8, cand.sy - pillH / 2));

      var box = { x1: px - 3, y1: py - 2, x2: px + pillW + 3, y2: py + pillH + 2 };
      var overlaps = placedCallouts.some(function (b) {
        return !(box.x2 < b.x1 || box.x1 > b.x2 || box.y2 < b.y1 || box.y1 > b.y2);
      });
      if (overlaps && cand !== focusEntry) return;
      placedCallouts.push(box);

      ctx.globalAlpha = 0.94;
      ctx.fillStyle = pal.surfaceLowest;
      drawRoundedRectPath(ctx, px, py, pillW, pillH, 11);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.fillStyle = pal.onSurface;
      ctx.fillText(labelText, px + 8, py + pillH / 2 + 0.5);
    });

    ctx.restore();
    updatePopmapInspector(focusEntry, pal);
  }

  function findNearestPopmapNode(clientX, clientY) {
    var canvas = document.getElementById("popmap-canvas");
    if (!canvas || !popmapScreenNodes.length) return null;
    var rect = canvas.getBoundingClientRect();
    var x = clientX - rect.left;
    var y = clientY - rect.top;

    var bestActive = null;
    var bestActiveDist = 30;
    var bestAny = null;
    var bestAnyDist = 16;

    for (var i = 0; i < popmapScreenNodes.length; i++) {
      var item = popmapScreenNodes[i];
      var dx = item.sx - x;
      var dy = item.sy - y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (item.metricVal > 0) {
        var effDist = Math.max(0, dist - item.radius * 0.45);
        if (effDist < bestActiveDist) {
          bestActiveDist = effDist;
          bestActive = item;
        }
      } else if (dist < bestAnyDist) {
        bestAnyDist = dist;
        bestAny = item;
      }
    }
    return bestActive || bestAny;
  }

  function setPopmapLoading() {
    if (!syncMusicMapCardsVisibility()) return;
    var canvas = document.getElementById("popmap-canvas");
    var stateSlot = document.getElementById("popmap-state-slot");
    if (canvas) canvas.hidden = true;
    if (stateSlot) {
      stateSlot.hidden = false;
      renderPanelLoadingInto(stateSlot);
    }
  }

  async function loadMusicMapPopular(expectedSeq, forceRefresh) {
    if (!syncMusicMapCardsVisibility()) return;
    syncPopmapScopeButtons();
    if ((!state.lastPopular || forceRefresh) && !catalogGeometryCache) {
      setPopmapLoading();
    }

    var effectiveRange = getEffectivePopmapRange();
    var apiBase = getMusicMapApiBase();
    var geomPromise = loadMusicMapCatalogGeometry();

    var popPayload = null;
    try {
      var freshParam = forceRefresh ? "&fresh=1" : "";
      var resp = await fetch(
        apiBase + "/api/popular?range=" + encodeURIComponent(effectiveRange) + "&limit=500" + freshParam,
        {
          method: "GET",
          mode: "cors",
          credentials: "omit",
          cache: forceRefresh ? "no-store" : "default"
        }
      );
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      var json = await resp.json();
      if (json && json.ok) {
        popPayload = json;
      }
    } catch (_) {
      try {
        var snap = await fetchDecryptedSnapshot(Boolean(forceRefresh));
        if (snap && snap.musicMapPopular) {
          popPayload = snap.musicMapPopular[effectiveRange] || snap.musicMapPopular.all || null;
        }
      } catch (_snapErr) {}
    }

    await geomPromise;
    if (expectedSeq !== state.loadSeq) return;

    state.lastPopular = popPayload || {
      ok: true,
      range: effectiveRange,
      summary: { active_tracks: 0, plays: 0, stars: 0, downloads: 0 },
      tracks: []
    };
    paintPopularityCanvas();
  }

  function setHotlistLoading() {
    if (!syncMusicMapCardsVisibility()) return;
    var sumEl = document.getElementById("hotlist-summary-label");
    if (sumEl) sumEl.textContent = "";
    renderPanelLoadingInto(document.getElementById("hotlist-tracks-list"));
    renderPanelLoadingInto(document.getElementById("hotlist-recent-list"));
  }

  function createMetricPill(cls, iconName, text, titleText) {
    var pill = document.createElement("span");
    pill.className = "badge " + cls;
    if (titleText) pill.title = titleText;
    var ic = document.createElement("span");
    ic.className = "material-symbols-outlined";
    ic.setAttribute("aria-hidden", "true");
    ic.textContent = iconName;
    pill.appendChild(ic);
    var sp = document.createElement("span");
    sp.textContent = text;
    pill.appendChild(sp);
    return pill;
  }

  function renderMusicMapHotlist(payload) {
    state.lastHotlist = payload || null;
    if (!syncMusicMapCardsVisibility()) return;

    var tracksEl = document.getElementById("hotlist-tracks-list");
    var recentEl = document.getElementById("hotlist-recent-list");
    var sumEl = document.getElementById("hotlist-summary-label");
    var tracksCountEl = document.getElementById("hotlist-tracks-count");
    var recentCountEl = document.getElementById("hotlist-recent-count");

    if (!tracksEl || !recentEl) return;
    clearChildren(tracksEl);
    clearChildren(recentEl);

    if (!payload || !payload.summary) {
      var emptyMsg = document.createElement("p");
      emptyMsg.className = "empty-hint";
      emptyMsg.textContent = "No Music Map play, star, or download activity recorded yet.";
      tracksEl.appendChild(emptyMsg);
      var emptyRecent = document.createElement("p");
      emptyRecent.className = "empty-hint";
      emptyRecent.textContent = "Waiting for first qualified play, star, or download.";
      recentEl.appendChild(emptyRecent);
      return;
    }

    var sum = payload.summary;
    var totalPlays = Number(sum.total_plays || 0);
    var activeStars = Number(sum.active_stars || 0);
    var totalDownloads = Number(sum.total_downloads || 0);
    var totalRequests = Number(sum.total_requests || 0);

    if (sumEl) {
      var summaryParts = [
        totalPlays.toLocaleString() + (totalPlays === 1 ? " play" : " plays"),
        activeStars.toLocaleString() + (activeStars === 1 ? " star" : " stars"),
        totalDownloads.toLocaleString() + (totalDownloads === 1 ? " download" : " downloads")
      ];
      if (totalRequests > 0) {
        summaryParts.push(totalRequests.toLocaleString() + (totalRequests === 1 ? " request" : " requests"));
      }
      sumEl.textContent = "· " + summaryParts.join(" · ");
    }

    var rawTracks = Array.isArray(payload.top_tracks) ? payload.top_tracks.slice() : [];
    var filteredTracks = rawTracks.filter(function (t) {
      if (state.hotlistFilter === "played") return Number(t.total_plays || 0) > 0;
      if (state.hotlistFilter === "starred") return Number(t.active_stars || 0) > 0;
      if (state.hotlistFilter === "downloaded") return Number(t.total_downloads || 0) > 0;
      return (Number(t.total_plays || 0) + Number(t.active_stars || 0) + Number(t.total_downloads || 0) + Number(t.total_requests || 0)) > 0;
    });

    function hotlistRowScore(t) {
      if (state.hotlistFilter === "played") return Number(t.total_plays || 0);
      if (state.hotlistFilter === "starred") return Number(t.active_stars || 0);
      if (state.hotlistFilter === "downloaded") return Number(t.total_downloads || 0);
      if (Number.isFinite(Number(t.popularity_score)) && Number(t.popularity_score) > 0) {
        return Number(t.popularity_score);
      }
      return (Number(t.active_stars || 0) * 5) + (Number(t.total_downloads || 0) * 4) + (Number(t.total_plays || 0) * 1.5) + Number(t.total_requests || 0);
    }

    filteredTracks.sort(function (a, b) {
      if (state.hotlistFilter === "played") {
        return (Number(b.total_plays || 0) - Number(a.total_plays || 0)) ||
               (Number(b.total_listen_sec || 0) - Number(a.total_listen_sec || 0)) ||
               (Number(b.active_stars || 0) - Number(a.active_stars || 0));
      }
      if (state.hotlistFilter === "starred") {
        return (Number(b.active_stars || 0) - Number(a.active_stars || 0)) ||
               (Number(b.total_plays || 0) - Number(a.total_plays || 0));
      }
      if (state.hotlistFilter === "downloaded") {
        return (Number(b.total_downloads || 0) - Number(a.total_downloads || 0)) ||
               (Number(b.active_stars || 0) - Number(a.active_stars || 0));
      }
      return hotlistRowScore(b) - hotlistRowScore(a);
    });

    if (tracksCountEl) {
      tracksCountEl.textContent = filteredTracks.length
        ? filteredTracks.length + (filteredTracks.length === 1 ? " track" : " tracks")
        : "";
    }

    if (!filteredTracks.length) {
      var emptyTrackP = document.createElement("p");
      emptyTrackP.className = "empty-hint";
      emptyTrackP.textContent = state.hotlistFilter === "played"
        ? "No qualified plays (10s+) recorded yet."
        : state.hotlistFilter === "starred"
          ? "No starred tracks yet — stars appear here as visitors tap ★ on Music Map."
          : state.hotlistFilter === "downloaded"
            ? "No track downloads recorded yet."
            : "No played, starred, or downloaded tracks yet — events appear live here.";
      tracksEl.appendChild(emptyTrackP);
    } else {
      var maxScore = Math.max.apply(null, filteredTracks.map(hotlistRowScore).concat([1]));

      filteredTracks.slice(0, 10).forEach(function (t, idx) {
        var row = document.createElement("a");
        row.className = "hotlist-track-row";
        row.href = t.url || ("https://billtribble.github.io/music-map/?track=" + encodeURIComponent(t.track_id));
        row.target = "_blank";
        row.rel = "noopener noreferrer";

        var topLine = document.createElement("div");
        topLine.className = "hotlist-track-top";

        var infoWrap = document.createElement("div");
        infoWrap.className = "hotlist-track-info";

        var rankBadge = document.createElement("span");
        rankBadge.className = "hotlist-rank";
        rankBadge.textContent = String(idx + 1);

        var titlesCol = document.createElement("div");
        titlesCol.className = "hotlist-track-titles";

        var nameLine = document.createElement("div");
        nameLine.className = "hotlist-track-name-line";
        var nameSpan = document.createElement("span");
        nameSpan.className = "hotlist-track-name";
        nameSpan.textContent = t.track_title || t.track_id;
        var openIc = document.createElement("span");
        openIc.className = "material-symbols-outlined hotlist-track-open-icon";
        openIc.setAttribute("aria-hidden", "true");
        openIc.textContent = "open_in_new";
        nameLine.appendChild(nameSpan);
        nameLine.appendChild(openIc);

        var eraSub = document.createElement("div");
        eraSub.className = "hotlist-track-era";
        var subParts = [];
        if (t.era) subParts.push(t.era);
        if (Number(t.total_plays || 0) > 0) {
          var playBreak = Number(t.manual_plays || 0) + " manual";
          if (Number(t.autoplay_plays || 0) > 0) {
            playBreak += " · " + Number(t.autoplay_plays || 0) + " auto";
          }
          if (Number(t.total_listen_sec || 0) > 0) {
            playBreak += " · " + formatListenDuration(t.total_listen_sec);
          }
          subParts.push(playBreak);
        }
        if (t.mp3_downloads > 0 || t.flac_downloads > 0) {
          var fmtParts = [];
          if (t.mp3_downloads > 0) fmtParts.push(t.mp3_downloads + " MP3");
          if (t.flac_downloads > 0) fmtParts.push(t.flac_downloads + " FLAC");
          subParts.push(fmtParts.join(" · "));
        }
        eraSub.textContent = subParts.join(" · ") || t.track_id;

        titlesCol.appendChild(nameLine);
        titlesCol.appendChild(eraSub);
        infoWrap.appendChild(rankBadge);
        infoWrap.appendChild(titlesCol);

        var pills = document.createElement("div");
        pills.className = "hotlist-metric-pills";
        if (Number(t.total_plays || 0) > 0) {
          pills.appendChild(createMetricPill(
            "badge-play",
            "play_arrow",
            String(t.total_plays),
            t.total_plays + (t.total_plays === 1 ? " qualified play" : " qualified plays") +
              " (" + Number(t.manual_plays || 0) + " manual, " + Number(t.autoplay_plays || 0) + " auto-play)"
          ));
        }
        if (Number(t.active_stars || 0) > 0) {
          pills.appendChild(createMetricPill(
            "badge-star",
            "star",
            String(t.active_stars),
            t.active_stars + (t.active_stars === 1 ? " active star" : " active stars")
          ));
        }
        if (Number(t.total_downloads || 0) > 0) {
          pills.appendChild(createMetricPill(
            "badge-download",
            "download",
            String(t.total_downloads),
            t.total_downloads + (t.total_downloads === 1 ? " download" : " downloads")
          ));
        }
        if (Number(t.total_requests || 0) > 0) {
          pills.appendChild(createMetricPill(
            "badge-request",
            "mail",
            String(t.total_requests),
            t.total_requests + (t.total_requests === 1 ? " track request" : " track requests")
          ));
        }

        topLine.appendChild(infoWrap);
        topLine.appendChild(pills);

        var scoreVal = hotlistRowScore(t);

        var barTrack = document.createElement("div");
        barTrack.className = "share-track";
        var barFill = document.createElement("div");
        barFill.className = "share-fill";
        barFill.style.width = Math.max(4, Math.min(100, (scoreVal / maxScore) * 100)).toFixed(1) + "%";
        barTrack.appendChild(barFill);

        row.appendChild(topLine);
        row.appendChild(barTrack);
        tracksEl.appendChild(row);
      });
    }

    var rawRecent = Array.isArray(payload.recent_events) ? payload.recent_events : [];
    var filteredRecent = rawRecent.filter(function (ev) {
      if (state.hotlistFilter === "played") return ev.event_type === "play";
      if (state.hotlistFilter === "starred") return ev.event_type === "star";
      if (state.hotlistFilter === "downloaded") return ev.event_type === "download";
      return true;
    });

    if (recentCountEl) {
      recentCountEl.textContent = filteredRecent.length
        ? filteredRecent.length + " recent"
        : "";
    }

    if (!filteredRecent.length) {
      var noRec = document.createElement("p");
      noRec.className = "empty-hint";
      noRec.textContent = "No recent events in this filter.";
      recentEl.appendChild(noRec);
    } else {
      filteredRecent.slice(0, 8).forEach(function (ev) {
        var erow = document.createElement("a");
        erow.className = "hotlist-event-row";
        erow.href = ev.url || ("https://billtribble.github.io/music-map/?track=" + encodeURIComponent(ev.track_id));
        erow.target = "_blank";
        erow.rel = "noopener noreferrer";

        var left = document.createElement("div");
        left.className = "hotlist-event-left";

        var iconWrap = document.createElement("span");
        var kindCls = ev.event_type === "play"
          ? "hotlist-event-icon--play"
          : ev.event_type === "star"
            ? "hotlist-event-icon--star"
            : ev.event_type === "download"
              ? "hotlist-event-icon--download"
              : "hotlist-event-icon--request";
        iconWrap.className = "hotlist-event-icon " + kindCls;
        var icEl = document.createElement("span");
        icEl.className = "material-symbols-outlined";
        icEl.setAttribute("aria-hidden", "true");
        icEl.textContent = ev.event_type === "play"
          ? "play_arrow"
          : ev.event_type === "star"
            ? "star"
            : ev.event_type === "download"
              ? "download"
              : "mail";
        iconWrap.appendChild(icEl);

        var metaCol = document.createElement("div");
        metaCol.className = "hotlist-event-meta";

        var evTitle = document.createElement("div");
        evTitle.className = "hotlist-event-title";
        evTitle.textContent = ev.track_title || ev.track_id;

        var evSub = document.createElement("div");
        evSub.className = "hotlist-event-sub";
        var actionWord = "";
        if (ev.event_type === "play") {
          actionWord = ev.source === "autoplay" ? "Auto-played" : "Played";
          if (Number(ev.listened_sec || 0) > 0) {
            actionWord += " (" + formatListenDuration(ev.listened_sec) + ")";
          }
        } else if (ev.event_type === "star") {
          actionWord = "Starred";
        } else if (ev.event_type === "download") {
          actionWord = "Downloaded " + (ev.format_label || ev.format || "audio");
        } else {
          actionWord = "Requested track";
        }
        var detailBits = [actionWord];
        if (ev.era) detailBits.push(ev.era);
        if (ev.country) detailBits.push(ev.country);
        evSub.textContent = detailBits.join(" · ");

        metaCol.appendChild(evTitle);
        metaCol.appendChild(evSub);
        left.appendChild(iconWrap);
        left.appendChild(metaCol);

        var timeSpan = document.createElement("span");
        timeSpan.className = "hotlist-event-time";
        timeSpan.textContent = formatHotlistEventTime(ev.created_at);
        if (ev.created_at) timeSpan.title = ev.created_at;

        erow.appendChild(left);
        erow.appendChild(timeSpan);
        recentEl.appendChild(erow);
      });
    }
  }

  async function loadMusicMapHotlist(expectedSeq, forceRefresh) {
    if (!syncMusicMapCardsVisibility()) return;
    loadMusicMapPopular(expectedSeq, forceRefresh);
    if (!state.lastHotlist || forceRefresh) {
      setHotlistLoading();
    }
    var apiBase = getMusicMapApiBase();
    try {
      var resp = await fetch(apiBase + "/api/hotlist?range=" + encodeURIComponent(state.range), {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        cache: forceRefresh ? "no-store" : "default"
      });
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      var json = await resp.json();
      if (expectedSeq !== state.loadSeq) return;
      if (json && json.ok) {
        renderMusicMapHotlist(json);
        return;
      }
      throw new Error("Invalid hotlist payload");
    } catch (_) {
      try {
        var snap = await fetchDecryptedSnapshot(Boolean(forceRefresh));
        if (expectedSeq !== state.loadSeq) return;
        if (snap && snap.musicMapHotlist) {
          renderMusicMapHotlist(snap.musicMapHotlist);
          return;
        }
      } catch (_snapErr) {}
      if (expectedSeq !== state.loadSeq) return;
      renderMusicMapHotlist({
        summary: { total_plays: 0, active_stars: 0, total_downloads: 0, total_requests: 0 },
        top_tracks: [],
        recent_events: []
      });
    }
  }

  // --------------------------------------------------------------------------
  // Zone C Page Detail Drawer & Account Popover (3-Way Dismissal)
  // --------------------------------------------------------------------------
  function openPageDrawer(page, data) {
    state.selectedPage = page;
    var drawer = document.getElementById("page-detail-drawer");
    var scrim = document.getElementById("drawer-scrim");
    if (!drawer || !scrim) return;

    document.getElementById("drawer-page-title").textContent = page.name;
    document.getElementById("drawer-page-sub").textContent = page.pathDisplay + " · " + page.domain;
    document.getElementById("drawer-page-views").textContent = page.count.toLocaleString();

    var sharePct = data.totalViews > 0 ? Math.round((page.count / data.totalViews) * 100) : 100;
    document.getElementById("drawer-page-share").textContent = sharePct + "% of total traffic (" + data.win.label + ")";

    var linkBtn = document.getElementById("drawer-open-page-btn");
    linkBtn.href = page.url;

    // Hourly distribution for this page
    var hourly = new Array(24).fill(0);
    (page.daySlices || []).forEach(function (s) {
      for (var i = 0; i < 24; i++) hourly[i] += (s.hourly && s.hourly[i]) || 0;
    });
    var drawerSpark = document.getElementById("drawer-sparkline-svg");
    renderMiniSparkline(drawerSpark, hourly);

    var drawerHoursHeading = document.getElementById("drawer-hours-heading");
    if (drawerHoursHeading) {
      drawerHoursHeading.textContent = "Active hours (" + getLocalShortZone(data.fetchedAt) + ")";
    }

    var topHours = hourly
      .map(function (c, hr) { return { label: formatLocalHour(hr, data.fetchedAt), count: c, icon: "schedule" }; })
      .filter(function (x) { return x.count > 0; })
      .sort(function (a, b) { return b.count - a.count; });

    renderBreakdownRows(
      document.getElementById("drawer-hours-list"),
      topHours,
      page.count,
      "Hourly breakdown matches total count."
    );

    scrim.hidden = false;
    drawer.hidden = false;
  }

  function closePageDrawer() {
    var drawer = document.getElementById("page-detail-drawer");
    var scrim = document.getElementById("drawer-scrim");
    if (drawer) drawer.hidden = true;
    if (scrim) scrim.hidden = true;
    state.selectedPage = null;
  }

  function closeAccountPopover() {
    var pop = document.getElementById("account-popover");
    if (pop) pop.hidden = true;
  }

  // --------------------------------------------------------------------------
  // Load Orchestrator & Auth Lifecycle
  // --------------------------------------------------------------------------
  async function loadAnalytics(forceRefresh) {
    if (!session) return;
    var seq = ++state.loadSeq;
    state.loading = true;

    if (forceRefresh) {
      state.liveBlocked = false;
      decryptedSnapshotCache = null;
    }

    var refreshBtn = document.getElementById("refresh-btn");
    if (refreshBtn) refreshBtn.classList.add("is-spinning");

    var win = computeRangeWindow(state.range);
    var targetSites = state.site === "all"
      ? session.sites
      : session.sites.filter(function (s) { return s.code === state.site; });

    // Check if every target site is already hot in cache so tab switches don't flash unnecessarily
    var allHotCached = !forceRefresh && !state.liveBlocked && targetSites.every(function (s) {
      return Boolean(readCachedSiteBundle(s, win, false));
    });

    if (!allHotCached && !(state.liveBlocked && !forceRefresh && decryptedSnapshotCache)) {
      setAllPanelsLoading();
    }
    loadMusicMapHotlist(seq, Boolean(forceRefresh));

    try {
      if (state.liveBlocked && !forceRefresh) {
        var cachedSnapMerged = await loadMergedFromSnapshot(targetSites, win, false);
        if (seq !== state.loadSeq) return;
        renderDashboard(cachedSnapMerged, { breakdownsPending: false });
        return;
      }

      try {
        var liveMerged = await fetchSitesTwoPhase(
          targetSites,
          win,
          session.token,
          Boolean(forceRefresh),
          function (partialMerged) {
            if (seq !== state.loadSeq) return;
            renderDashboard(partialMerged, { breakdownsPending: true });
          }
        );
        if (seq !== state.loadSeq) return;
        renderDashboard(liveMerged, { breakdownsPending: false });
        return;
      } catch (liveErr) {
        if (seq !== state.loadSeq) return;
        if (liveErr && liveErr.isAuthError) {
          performSignOut("Session expired. Sign in again with your GoatCounter password.");
          return;
        }
        if (liveErr && liveErr.isNetworkBlocked) {
          state.liveBlocked = true;
        }
        // Keep pending panels in their GM3 Loading… spinner state while falling back
        // to the same-origin AES-256-GCM encrypted ./vault-snapshot.json!
        var fallbackMerged = await loadMergedFromSnapshot(targetSites, win, Boolean(forceRefresh));
        if (seq !== state.loadSeq) return;
        renderDashboard(fallbackMerged, { breakdownsPending: false });
      }
    } catch (_finalErr) {
      if (seq !== state.loadSeq) return;
      // ONLY render "Failed to fetch" inside panels after BOTH live retries AND
      // same-origin ./vault-snapshot.json fallback have definitively failed!
      setAllPanelsError("Failed to fetch");
    } finally {
      if (seq === state.loadSeq) {
        state.loading = false;
        if (refreshBtn) refreshBtn.classList.remove("is-spinning");
      }
    }
  }

  function enterSignedInState(unlockedSession) {
    session = unlockedSession;
    safeViewTransition(function () {
      document.getElementById("signin-screen").hidden = true;
      document.getElementById("dashboard-screen").hidden = false;
      document.getElementById("refresh-btn").hidden = false;
      document.getElementById("signout-btn").hidden = false;
      document.getElementById("sync-status").hidden = false;
      var popEmail = document.getElementById("popover-email");
      if (popEmail) popEmail.textContent = session.email || "bill@btribble.com";
    });
    loadAnalytics(false);
  }

  function performSignOut(optionalErrorMsg) {
    session = null;
    memoryCache = {};
    decryptedSnapshotCache = null;
    state.liveBlocked = false;
    state.lastData = null;
    state.lastHotlist = null;
    state.lastPopular = null;
    state.popmapHoverId = null;
    state.popmapPinnedId = null;
    state.loadSeq++;
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.removeItem(CACHE_STORAGE_KEY);
    } catch (_) {}
    closePageDrawer();
    closeAccountPopover();

    safeViewTransition(function () {
      document.getElementById("dashboard-screen").hidden = true;
      document.getElementById("signin-screen").hidden = false;
      document.getElementById("refresh-btn").hidden = true;
      document.getElementById("signout-btn").hidden = true;
      document.getElementById("sync-status").hidden = true;

      var errBox = document.getElementById("signin-error");
      var errText = document.getElementById("signin-error-text");
      if (optionalErrorMsg && errBox && errText) {
        errText.textContent = optionalErrorMsg;
        errBox.hidden = false;
      } else if (errBox) {
        errBox.hidden = true;
      }
      var pw = document.getElementById("signin-password");
      if (pw) pw.value = "";
    });
  }

  // --------------------------------------------------------------------------
  // Event Wiring
  // --------------------------------------------------------------------------
  function wireControls() {
    var themeBtn = document.getElementById("theme-toggle-btn");
    if (themeBtn) themeBtn.addEventListener("click", cycleTheme);

    // Password reveal button
    var pwInput = document.getElementById("signin-password");
    var pwRevealBtn = document.getElementById("pw-reveal-btn");
    var pwRevealIcon = document.getElementById("pw-reveal-icon");
    if (pwRevealBtn && pwInput && pwRevealIcon) {
      pwRevealBtn.addEventListener("click", function () {
        var showing = pwInput.type === "text";
        pwInput.type = showing ? "password" : "text";
        pwRevealIcon.textContent = showing ? "visibility" : "visibility_off";
        pwRevealBtn.setAttribute("aria-label", showing ? "Show password" : "Hide password");
        pwRevealBtn.title = showing ? "Show password" : "Hide password";
      });
    }

    // Sign-in semantic form submit (supports Chrome / Safari / Keychain / 1Password autofill & save)
    var form = document.getElementById("signin-form");
    if (form) {
      form.addEventListener("submit", async function (ev) {
        ev.preventDefault();
        var emailEl = document.getElementById("signin-email");
        var passEl = document.getElementById("signin-password");
        var submitBtn = document.getElementById("signin-submit");
        var submitLabel = document.getElementById("signin-submit-label");
        var errBox = document.getElementById("signin-error");
        var errText = document.getElementById("signin-error-text");

        if (errBox) errBox.hidden = true;
        if (submitBtn) submitBtn.disabled = true;
        if (submitLabel) submitLabel.textContent = "Unlocking…";

        try {
          var unlocked = await unlockVault(emailEl.value, passEl.value);
          var sessionRecord = {
            v: 2,
            email: unlocked.email,
            token: unlocked.token,
            sites: unlocked.sites,
            snapshotKey: unlocked.snapshotKey,
            unlockedAt: Date.now()
          };
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionRecord));

          // Notify Credential Management API where supported before clearing field
          if (window.PasswordCredential && navigator.credentials && navigator.credentials.store) {
            try {
              var cred = new window.PasswordCredential(form);
              navigator.credentials.store(cred).catch(function () {});
            } catch (_) {}
          }

          if (passEl) {
            passEl.type = "password";
            passEl.value = "";
          }
          if (pwRevealIcon) pwRevealIcon.textContent = "visibility";

          enterSignedInState(sessionRecord);
        } catch (_) {
          if (errText) {
            errText.textContent = "Incorrect email or password. Enter the GoatCounter credentials for bill@btribble.com.";
          }
          if (errBox) errBox.hidden = false;
          if (passEl) passEl.focus();
        } finally {
          if (submitBtn) submitBtn.disabled = false;
          if (submitLabel) submitLabel.textContent = "Sign in";
        }
      });
    }

    // Refresh & Sign out buttons
    var refreshBtn = document.getElementById("refresh-btn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", function () {
        loadAnalytics(true);
      });
    }

    var signoutBtn = document.getElementById("signout-btn");
    if (signoutBtn) {
      signoutBtn.addEventListener("click", function () {
        performSignOut("");
      });
    }

    // Top-right user avatar popover
    var avatarBtn = document.getElementById("top-user-avatar-host");
    var popover = document.getElementById("account-popover");
    var popClose = document.getElementById("popover-close-btn");
    var popSignout = document.getElementById("popover-signout-btn");

    if (avatarBtn && popover) {
      avatarBtn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        if (!session) {
          var passField = document.getElementById("signin-password");
          if (passField) passField.focus();
          return;
        }
        popover.hidden = !popover.hidden;
      });
    }
    if (popClose) popClose.addEventListener("click", closeAccountPopover);
    if (popSignout) {
      popSignout.addEventListener("click", function () {
        performSignOut("");
      });
    }

    // Site switcher morphing tabs
    document.querySelectorAll("[data-site]").forEach(function (tab) {
      tab.addEventListener("click", function () {
        var nextSite = tab.getAttribute("data-site");
        if (!nextSite || nextSite === state.site) return;
        state.site = nextSite;
        document.querySelectorAll("[data-site]").forEach(function (t) {
          var active = t === tab;
          t.classList.toggle("active", active);
          t.setAttribute("aria-selected", active ? "true" : "false");
        });
        loadAnalytics(false);
      });
    });

    // Date range morphing tabs (desktop) + mobile select sync
    var mobileRangeSelect = document.getElementById("mobile-range-select");
    function setDateRange(nextRange) {
      if (!nextRange || nextRange === state.range) return;
      state.range = nextRange;
      if (!state.granularityManual) {
        state.granularity = nextRange === "today" ? "hourly" : "daily";
        syncGranularityTabs();
      }
      document.querySelectorAll("[data-range]").forEach(function (t) {
        var active = t.getAttribute("data-range") === nextRange;
        t.classList.toggle("active", active);
        t.setAttribute("aria-selected", active ? "true" : "false");
      });
      if (mobileRangeSelect && mobileRangeSelect.value !== nextRange) {
        mobileRangeSelect.value = nextRange;
      }
      loadAnalytics(false);
    }

    document.querySelectorAll("[data-range]").forEach(function (tab) {
      tab.addEventListener("click", function () {
        setDateRange(tab.getAttribute("data-range"));
      });
    });

    if (mobileRangeSelect) {
      mobileRangeSelect.addEventListener("change", function () {
        setDateRange(mobileRangeSelect.value);
      });
    }

    // Auto-hiding scrollbars: reveal thin scrollbar only while actively scrolling
    document.addEventListener("scroll", function (ev) {
      var el = ev.target;
      if (!el || el === document || el === document.documentElement || el === document.body || !el.classList) return;
      el.classList.add("is-scrolling");
      if (el.__scrollIdleTimer) clearTimeout(el.__scrollIdleTimer);
      el.__scrollIdleTimer = setTimeout(function () {
        el.classList.remove("is-scrolling");
      }, 800);
    }, { capture: true, passive: true });

    // Chart granularity switcher (Hourly / Daily)
    function syncGranularityTabs() {
      document.querySelectorAll("[data-granularity]").forEach(function (t) {
        var active = t.getAttribute("data-granularity") === state.granularity;
        t.classList.toggle("active", active);
        t.setAttribute("aria-selected", active ? "true" : "false");
      });
    }

    document.querySelectorAll("[data-granularity]").forEach(function (tab) {
      tab.addEventListener("click", function () {
        var g = tab.getAttribute("data-granularity");
        if (!g || g === state.granularity) return;
        state.granularity = g;
        state.granularityManual = true;
        syncGranularityTabs();
        if (state.lastData) {
          var trendSvg = document.getElementById("trend-chart-svg");
          var trendReadout = document.getElementById("trend-chart-readout");
          if (trendSvg) renderMainTrendChart(trendSvg, trendReadout, state.lastData);
        }
      });
    });

    // Music Map Popularity Map metric & scope controls + canvas pointer inspector
    document.querySelectorAll("[data-popmap-metric]").forEach(function (tab) {
      tab.addEventListener("click", function () {
        var m = tab.getAttribute("data-popmap-metric");
        if (!m || m === state.popmapMetric) return;
        state.popmapMetric = m;
        state.popmapHoverId = null;
        document.querySelectorAll("[data-popmap-metric]").forEach(function (t) {
          var active = t === tab;
          t.classList.toggle("active", active);
          t.setAttribute("aria-selected", active ? "true" : "false");
        });
        paintPopularityCanvas();
      });
    });

    document.querySelectorAll("[data-popmap-scope]").forEach(function (tab) {
      tab.addEventListener("click", function () {
        var sc = tab.getAttribute("data-popmap-scope");
        if (!sc || sc === state.popmapScope) return;
        state.popmapScope = sc;
        syncPopmapScopeButtons();
        loadMusicMapPopular(state.loadSeq, false);
      });
    });

    var popCanvas = document.getElementById("popmap-canvas");
    if (popCanvas) {
      popCanvas.addEventListener("pointermove", function (ev) {
        if (ev.pointerType === "touch") return;
        var hit = findNearestPopmapNode(ev.clientX, ev.clientY);
        var nextId = hit ? hit.node.id : null;
        popCanvas.classList.toggle("is-node-hovered", Boolean(hit));
        if (nextId !== state.popmapHoverId) {
          state.popmapHoverId = nextId;
          paintPopularityCanvas();
        }
      });

      popCanvas.addEventListener("pointerleave", function () {
        popCanvas.classList.remove("is-node-hovered");
        if (state.popmapHoverId !== null) {
          state.popmapHoverId = null;
          paintPopularityCanvas();
        }
      });

      popCanvas.addEventListener("click", function (ev) {
        var hit = findNearestPopmapNode(ev.clientX, ev.clientY);
        if (!hit) {
          state.popmapPinnedId = null;
          paintPopularityCanvas();
          return;
        }
        var targetUrl = (hit.stat && hit.stat.url) || ("https://billtribble.github.io/music-map/?track=" + encodeURIComponent(hit.node.id));
        var isCoarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
        if (isCoarse && state.popmapPinnedId !== hit.node.id) {
          state.popmapPinnedId = hit.node.id;
          paintPopularityCanvas();
          return;
        }
        state.popmapPinnedId = hit.node.id;
        paintPopularityCanvas();
        window.open(targetUrl, "_blank", "noopener,noreferrer");
      });
    }

    // Music Map Hot List filter tabs (All / Played / Starred / Downloaded)
    document.querySelectorAll("[data-hotlist-filter]").forEach(function (tab) {
      tab.addEventListener("click", function () {
        var f = tab.getAttribute("data-hotlist-filter");
        if (!f || f === state.hotlistFilter) return;
        state.hotlistFilter = f;
        document.querySelectorAll("[data-hotlist-filter]").forEach(function (t) {
          var active = t === tab;
          t.classList.toggle("active", active);
          t.setAttribute("aria-selected", active ? "true" : "false");
        });
        if (state.lastHotlist) {
          renderMusicMapHotlist(state.lastHotlist);
        }
      });
    });

    // Per-page filter input + inline clear button
    var filterInput = document.getElementById("page-filter-input");
    var filterClear = document.getElementById("page-filter-clear");
    if (filterInput && filterClear) {
      filterInput.addEventListener("input", function () {
        state.pageFilter = filterInput.value || "";
        filterClear.hidden = state.pageFilter.length === 0;
        if (state.lastData) renderPagesList(state.lastData);
      });
      filterClear.addEventListener("click", function () {
        filterInput.value = "";
        state.pageFilter = "";
        filterClear.hidden = true;
        if (state.lastData) renderPagesList(state.lastData);
        filterInput.focus();
      });
    }

    // Drawer 3-way dismissal (scrim click, close button, Escape key)
    var scrim = document.getElementById("drawer-scrim");
    var drawerClose = document.getElementById("drawer-close-btn");
    if (scrim) scrim.addEventListener("click", closePageDrawer);
    if (drawerClose) drawerClose.addEventListener("click", closePageDrawer);

    document.addEventListener("click", function (ev) {
      if (popover && !popover.hidden && !popover.contains(ev.target) && ev.target !== avatarBtn) {
        closeAccountPopover();
      }
    });

    window.addEventListener("resize", function () {
      if (state.lastData) {
        var trendSvg = document.getElementById("trend-chart-svg");
        var trendReadout = document.getElementById("trend-chart-readout");
        if (trendSvg && !trendSvg.hidden) renderMainTrendChart(trendSvg, trendReadout, state.lastData);
      }
      if (catalogGeometryCache) {
        paintPopularityCanvas();
      }
    }, { passive: true });

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") {
        var drawer = document.getElementById("page-detail-drawer");
        if (drawer && !drawer.hidden) {
          closePageDrawer();
          return;
        }
        if (popover && !popover.hidden) {
          closeAccountPopover();
        }
      }
    });
  }

  // Boot initialization
  function hydrateStaticTimezoneLabels() {
    var now = new Date();
    var subEl = document.getElementById("active-scope-subtitle");
    if (subEl) {
      subEl.textContent = "All 3 properties · Last 7 days · " + formatLocalZoneSubtitle(now);
    }
    var trendTzEl = document.getElementById("trend-tz-label");
    if (trendTzEl) {
      trendTzEl.textContent = getLocalShortZone(now);
      trendTzEl.title = getLocalTimeZoneId();
    }
    var drawerHoursHeading = document.getElementById("drawer-hours-heading");
    if (drawerHoursHeading) {
      drawerHoursHeading.textContent = "Active hours (" + getLocalShortZone(now) + ")";
    }
  }

  function init() {
    hydrateStaticTimezoneLabels();
    wireControls();
    try {
      var saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        if (parsed && (parsed.v === 1 || parsed.v === 2) && parsed.token && Array.isArray(parsed.sites)) {
          enterSignedInState(parsed);
          document.documentElement.dataset.bootReady = "1";
          return;
        }
      }
    } catch (_) {}
    document.documentElement.dataset.bootReady = "1";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

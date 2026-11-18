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

  var PROJECT_DIRECTORY = {
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
    selectedPage: null
  };
  var memoryCache = {};
  var decryptedSnapshotCache = null;

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

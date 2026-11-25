#!/usr/bin/env python3
"""Fetch read-only GoatCounter analytics across all sites and date ranges and write
an AES-256-GCM encrypted same-origin snapshot to stats/vault-snapshot.json.

Required environment variables (never stored in repository files):
  - GOATCOUNTER_READONLY_TOKEN: Read-only GoatCounter stats API bearer token
  - STATS_SNAPSHOT_KEY_B64: Base64-encoded 32-byte AES-256 key derived from VAULT.salt
"""

from __future__ import annotations

import base64
import datetime as dt
import hashlib
import json
import os
import pathlib
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

SITES = [
    {"code": "billtribble", "domain": "billtribble.github.io", "label": "billtribble.github.io"},
    {"code": "billtribble-com", "domain": "billtribble.com", "label": "billtribble.com"},
    {"code": "awake-in", "domain": "awake-in.com", "label": "awake-in.com"},
]

RANGES = [
    ("today", 0, "Today"),
    ("7d", 6, "Last 7 days"),
    ("30d", 29, "Last 30 days"),
    ("90d", 89, "Last 90 days"),
]

# Strictly <= 2 req/s against GoatCounter's 4 req/s sliding window
MIN_REQUEST_INTERVAL_SEC = 0.60
TOKEN_WRAP_DOMAIN = "bt-stats-snapshot-wrap-v1:"


class PacedGoatCounterClient:
    def __init__(self, token: str) -> None:
        self._token = token
        self._last_request_at = 0.0

    def get_json(self, url: str) -> dict:
        elapsed = time.monotonic() - self._last_request_at
        if elapsed < MIN_REQUEST_INTERVAL_SEC:
            time.sleep(MIN_REQUEST_INTERVAL_SEC - elapsed)

        for attempt in range(5):
            self._last_request_at = time.monotonic()
            req = urllib.request.Request(
                url,
                method="GET",
                headers={
                    "Authorization": f"Bearer {self._token}",
                    "Accept": "application/json",
                    "User-Agent": "billtribble-stats-snapshot/1.0",
                },
            )
            try:
                with urllib.request.urlopen(req, timeout=20) as resp:
                    raw = resp.read().decode("utf-8")
                    return json.loads(raw)
            except urllib.error.HTTPError as err:
                if err.code == 429 and attempt < 4:
                    reset_hdr = err.headers.get("X-Rate-Limit-Reset", "1.5")
                    try:
                        wait_s = max(1.25, float(reset_hdr) + 0.35)
                    except ValueError:
                        wait_s = 1.5 * (attempt + 1)
                    time.sleep(wait_s)
                    continue
                if err.code >= 500 and attempt < 4:
                    time.sleep(1.5 * (attempt + 1))
                    continue
                raise RuntimeError(f"GoatCounter HTTP {err.code} on {url}") from None
            except urllib.error.URLError as err:
                if attempt < 4:
                    time.sleep(1.5 * (attempt + 1))
                    continue
                raise RuntimeError(f"GoatCounter network error on {url}: {err.reason}") from None

        raise RuntimeError(f"Exhausted retries fetching {url}")


def compute_range_window(now_utc: dt.datetime, range_key: str, days_back: int, label: str) -> dict:
    utc_midnight = dt.datetime(
        now_utc.year, now_utc.month, now_utc.day, 0, 0, 0, tzinfo=dt.timezone.utc
    )
    # Pad hourly endpoints by +-1 UTC day so every browser timezone (UTC-12..UTC+14)
    # can slice exact local day & hourly boundaries client-side from canonical UTC buckets.
    hourly_start = utc_midnight - dt.timedelta(days=days_back + 1)
    hourly_end = utc_midnight + dt.timedelta(days=2)
    agg_start = utc_midnight - dt.timedelta(days=days_back)
    agg_end = utc_midnight + dt.timedelta(days=1)
    return {
        "rangeKey": range_key,
        "startIso": agg_start.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "endIso": agg_end.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "hourlyStartIso": hourly_start.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "hourlyEndIso": hourly_end.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "minDay": agg_start.strftime("%Y-%m-%d"),
        "todayUtc": utc_midnight.strftime("%Y-%m-%d"),
        "bucketTz": "UTC",
        "label": label,
    }


def fetch_site_bundle(client: PacedGoatCounterClient, site: dict, win: dict) -> dict:
    qs_hourly = urllib.parse.urlencode({"start": win["hourlyStartIso"], "end": win["hourlyEndIso"]})
    qs_agg = urllib.parse.urlencode({"start": win["startIso"], "end": win["endIso"]})
    base = f"https://{site['code']}.goatcounter.com/api/v0/"

    total_resp = client.get_json(f"{base}stats/total?{qs_hourly}")
    raw_days = total_resp.get("stats") or []
    computed_total = sum(
        int(day_entry.get("daily") or 0)
        for day_entry in raw_days
        if win["minDay"] <= day_entry.get("day", "") <= win["todayUtc"]
    )
    padded_total = sum(int(day_entry.get("daily") or 0) for day_entry in raw_days)

    if int(total_resp.get("total") or 0) == 0 and padded_total == 0:
        return {
            "site": site,
            "total": 0,
            "days": raw_days,
            "hits": [],
            "toprefs": [],
            "browsers": [],
            "systems": [],
            "locations": [],
            "sizes": [],
        }

    hits_resp = client.get_json(f"{base}stats/hits?{qs_hourly}&limit=50")
    toprefs_resp = client.get_json(f"{base}stats/toprefs?{qs_agg}&limit=20")
    browsers_resp = client.get_json(f"{base}stats/browsers?{qs_agg}&limit=20")
    systems_resp = client.get_json(f"{base}stats/systems?{qs_agg}&limit=20")
    locations_resp = client.get_json(f"{base}stats/locations?{qs_agg}&limit=20")
    sizes_resp = client.get_json(f"{base}stats/sizes?{qs_agg}&limit=20")

    return {
        "site": site,
        "total": computed_total,
        "days": raw_days,
        "hits": hits_resp.get("hits") or [],
        "toprefs": toprefs_resp.get("stats") or [],
        "browsers": browsers_resp.get("stats") or [],
        "systems": systems_resp.get("stats") or [],
        "locations": locations_resp.get("stats") or [],
        "sizes": sizes_resp.get("stats") or [],
    }


def encrypt_snapshot(snapshot_obj: dict, aes_key: bytes, token: str) -> dict:
    if len(aes_key) != 32:
        raise ValueError("STATS_SNAPSHOT_KEY_B64 must decode to exactly 32 bytes (256 bits).")

    plaintext = json.dumps(snapshot_obj, separators=(",", ":")).encode("utf-8")
    iv = os.urandom(12)
    ct = AESGCM(aes_key).encrypt(iv, plaintext, None)

    # Also wrap the 256-bit snapshot key under SHA-256(domain || token) so browsers
    # holding an already-unlocked v1 session token can unwrap without re-prompting.
    wrap_key = hashlib.sha256((TOKEN_WRAP_DOMAIN + token).encode("utf-8")).digest()
    wrap_iv = os.urandom(12)
    wrap_ct = AESGCM(wrap_key).encrypt(wrap_iv, aes_key, None)

    # Verify round-trip decryption before writing
    recovered = json.loads(AESGCM(aes_key).decrypt(iv, ct, None).decode("utf-8"))
    if recovered.get("generatedAt") != snapshot_obj["generatedAt"]:
        raise RuntimeError("Snapshot AES-256-GCM round-trip verification failed.")
    unwrapped_key = AESGCM(wrap_key).decrypt(wrap_iv, wrap_ct, None)
    if unwrapped_key != aes_key:
        raise RuntimeError("Token-wrapped key round-trip verification failed.")

    envelope = {
        "v": 1,
        "cipher": "AES-256-GCM",
        "updatedAt": snapshot_obj["generatedAt"],
        "iv": base64.b64encode(iv).decode("ascii"),
        "ct": base64.b64encode(ct).decode("ascii"),
        "tokenWrap": {
            "iv": base64.b64encode(wrap_iv).decode("ascii"),
            "ct": base64.b64encode(wrap_ct).decode("ascii"),
        },
    }

    serialized = json.dumps(envelope, indent=2) + "\n"
    key_b64 = base64.b64encode(aes_key).decode("ascii")
    if token in serialized or key_b64 in serialized:
        raise RuntimeError("Refusing to write snapshot containing secret material.")
    return envelope


def main() -> int:
    token = (os.environ.get("GOATCOUNTER_READONLY_TOKEN") or "").strip()
    key_b64 = (os.environ.get("STATS_SNAPSHOT_KEY_B64") or "").strip()
    if not token or len(token) < 20:
        print("Error: GOATCOUNTER_READONLY_TOKEN environment variable is missing or invalid.", file=sys.stderr)
        return 1
    if not key_b64:
        print("Error: STATS_SNAPSHOT_KEY_B64 environment variable is missing.", file=sys.stderr)
        return 1

    try:
        aes_key = base64.b64decode(key_b64, validate=True)
    except Exception:
        print("Error: STATS_SNAPSHOT_KEY_B64 is not valid base64.", file=sys.stderr)
        return 1

    now_utc = dt.datetime.now(dt.timezone.utc)
    generated_at = now_utc.strftime("%Y-%m-%dT%H:%M:%SZ")
    today_utc = now_utc.strftime("%Y-%m-%d")

    client = PacedGoatCounterClient(token)
    ranges_payload: dict[str, dict] = {}

    for range_key, days_back, label in RANGES:
        win = compute_range_window(now_utc, range_key, days_back, label)
        bundles: dict[str, dict] = {}
        for site in SITES:
            bundles[site["code"]] = fetch_site_bundle(client, site, win)
        ranges_payload[range_key] = {
            "win": win,
            "bundles": bundles,
        }

    music_map_api = (
        os.environ.get("MUSIC_MAP_API_URL") or "https://music-map-events.billtribble.workers.dev"
    ).strip().rstrip("/")
    music_map_hotlist = None
    if music_map_api:
        try:
            mm_req = urllib.request.Request(
                f"{music_map_api}/api/hotlist?range=all",
                method="GET",
                headers={
                    "Accept": "application/json",
                    "User-Agent": "billtribble-stats-snapshot/1.0",
                },
            )
            with urllib.request.urlopen(mm_req, timeout=15) as mm_resp:
                mm_parsed = json.loads(mm_resp.read().decode("utf-8"))
                if isinstance(mm_parsed, dict) and mm_parsed.get("ok"):
                    music_map_hotlist = mm_parsed
        except Exception as exc:
            print(f"Warning: Music Map hotlist snapshot skipped: {exc}", file=sys.stderr)

    snapshot_obj = {
        "v": 2,
        "bucketTz": "UTC",
        "generatedAt": generated_at,
        "todayUtc": today_utc,
        "sites": SITES,
        "ranges": ranges_payload,
        "musicMapHotlist": music_map_hotlist,
    }

    envelope = encrypt_snapshot(snapshot_obj, aes_key, token)

    repo_root = pathlib.Path(__file__).resolve().parents[2]
    out_path = repo_root / "stats" / "vault-snapshot.json"
    tmp_path = out_path.with_suffix(".json.tmp")
    tmp_path.write_text(json.dumps(envelope, indent=2) + "\n", encoding="utf-8")
    tmp_path.replace(out_path)

    seven_day_total = sum(
        b["total"] for b in ranges_payload["7d"]["bundles"].values()
    )
    print(
        f"Encrypted stats snapshot written to {out_path.relative_to(repo_root)} "
        f"(generatedAt={generated_at}, 7d_total={seven_day_total}, ct_bytes={len(envelope['ct'])})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

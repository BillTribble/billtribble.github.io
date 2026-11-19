// Copyright (c) 2026 Bill Tribble. All rights reserved. See LICENSE.
// Node map view. Two layouts of the same nodes, toggled with the World button and animated between:
// - pattern: placed by pattern similarity (RX.PATTERN_MAP from py/rhythm_ml.py);
// - world: at each rhythm's approximate centre of origin (RX.ORIGIN, js/origins.js) over a land outline
//   (RX.WORLD_LAND, js/world-land.js).
// Links join nearest neighbours by pattern (RX.PATTERN_NEAR) in both layouts; colour is the pattern group.
// Dots that would touch on screen are fanned into a small ring (a pair, a triangle, ...) measured in screen pixels,
// so they stay apart at every zoom and split into their true places as you zoom in. Drag to pan, wheel or pinch to zoom, tap a node to play it (switching at the next
// bar when something is already playing, as in the list). While a rhythm plays, a step picture of it sits in the
// bottom third (phone) or the right quarter (desktop).
window.RX = window.RX || {};

RX.nodeMap = (function () {
  // Every dot is drawn the same size. Its invisible tap area grows from HIT_R to HIT_R_MAX as you zoom in, but never
  // past half the gap to its nearest neighbour.
  const PAD = 40, NODE_R = 8, HIT_R = 22, HIT_R_MAX = 36, LINKS = 2, TAP_MOVE = 8, MORPH_MS = 700;
  // Times the fitted zoom. On a phone the World map fits at about 0.9 px per degree, so 400x gives ~345 px per degree:
  // enough to pull apart places a fraction of a degree apart (Accra, the Volta region, Kumasi).
  const MAX_ZOOM = { pattern: 120, world: 400 };
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const LAND = RX.WORLD_LAND || { width: 1000, height: 383.3, top: 80, path: '' };
  const U = LAND.width / 360; // map units per degree (equirectangular, same as py/build_world_outline.py)
  const BOUNDS = { pattern: { w: 1000, h: 1000 }, world: { w: LAND.width, h: LAND.height } };
  let hooks = null, host = null, svg = null, gLand = null, gLinks = null, gNodes = null, gFamilies = null, toggle = null, seg = null;
  let filter = null; // search: Set of ids that match, or null for no filter
  let panel = null, panelId = null, panelLanes = [], playBtn = null, collapseBtn = null, familyBtn = null, highlightFamily = false;
  let collapsed = false;
  try { collapsed = localStorage.getItem('rx-map-panel-collapsed') === '1'; } catch (e) { /* per-viewer convenience only */ }
  const wide = window.matchMedia('(min-width: 841px)');
  let rings = []; // rings drawn by the last placeOnScreen(): { cx, cy, r } on screen
  let nodes = [], links = [], view = { x: 0, y: 0, k: 1 }, fitK = 1, fitted = false, w = 0, h = 0, layout = 'pattern', anim = 0;

  const svgEl = (tag, attrs) => { const e = document.createElementNS(SVG_NS, tag); Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v)); return e; };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const project = ([lat, lon]) => [(lon + 180) * U, (LAND.top - lat) * U];

  // 30 bright, high-chroma [light, dark] pairs spanning the vivid spectrum (zero dark browns, olives, maroons or slates)
  // so every cluster pops cleanly on both white and dark surfaces and neighbouring clusters get contrasting hues.
  const PALETTE = [
    ['#fd264a', '#ff617b'], ['#fb4a41', '#ff7770'], ['#fd5021', '#ff7b57'], ['#fd7b30', '#ff9b61'], ['#ff870f', '#ffa64d'],
    ['#ffa914', '#ffbe4d'], ['#fcbe03', '#ffcd38'], ['#f5d105', '#ffe033'], ['#9fe10e', '#bdfa38'], ['#6be713', '#8ff844'],
    ['#24dd13', '#50f641'], ['#10da3f', '#3bf767'], ['#0bd574', '#30f897'], ['#09d7a4', '#30f8c6'], ['#07dacf', '#2efaef'],
    ['#05cceb', '#3be2fc'], ['#0ab6fa', '#49cafd'], ['#1d9ffc', '#58b9fe'], ['#2b86fd', '#66a8ff'], ['#4979fd', '#7a9eff'],
    ['#5f6afc', '#8a92ff'], ['#7864fc', '#9e8fff'], ['#905afc', '#ad85ff'], ['#a94cfa', '#c17bfe'], ['#c938fa', '#da6cfe'],
    ['#f22af8', '#f862fd'], ['#fa2ed4', '#fe67e2'], ['#fb28a6', '#ff61c0'], ['#fc3b8b', '#ff70ac'], ['#fc4a7d', '#ff7aa0'],
  ];
  const hexLab = (hex) => {
    const lin = [1, 3, 5].map((i) => { const v = parseInt(hex.slice(i, i + 2), 16) / 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    const l = Math.cbrt(0.41222147 * lin[0] + 0.53633254 * lin[1] + 0.05144599 * lin[2]);
    const m = Math.cbrt(0.21190350 * lin[0] + 0.68069955 * lin[1] + 0.10739696 * lin[2]);
    const s = Math.cbrt(0.08830246 * lin[0] + 0.28171884 * lin[1] + 0.62997870 * lin[2]);
    return [0.21045426 * l + 0.79361779 * m - 0.00407205 * s, 1.97799850 * l - 2.42859220 * m + 0.45059371 * s, 0.02590404 * l + 0.78277177 * m - 0.80867577 * s];
  };
  const colorSep = (p, q) => {
    const da = p[1] - q[1], db = p[2] - q[2], dl = p[0] - q[0];
    const ca = Math.hypot(p[1], p[2]), cb = Math.hypot(q[1], q[2]);
    const cosH = ca > 1e-3 && cb > 1e-3 ? (p[1] * q[1] + p[2] * q[2]) / (ca * cb) : 0;
    // Penalise same-hue-family neighbours (within ~50 deg) so blues, greens or purples never sit side by side.
    const sameHue = cosH > 0.64 ? 1 - 0.55 * ((cosH - 0.64) / 0.36) : 1;
    return Math.hypot(0.45 * dl, da, db) * sameHue;
  };

  // Signature rhythm -> concise, musical 1–2 word family / flagship-rhythm label for each of the 25 local Pattern clusters.
  const CLUSTER_SIGNATURES = [
    ['tresillo', 'Tresillo'],
    ['son', 'Son clave'],
    ['bell12', 'Bembé'],
    ['maqsum', 'Maqsum'],
    ['lesno', 'Lesno'],
    ['djembe-yankadi', 'Djembe'],
    ['kuduro', 'Kuduro'],
    ['cumbia', 'Cumbia'],
    ['samba', 'Samba'],
    ['gnawa', 'Gnawa'],
    ['bhangra', 'Bhangra'],
    ['batuque', 'Batuque'],
    ['afrobeat', 'Afrobeat'],
    ['chakacha', 'Chakacha'],
    ['keharwa', 'Keharwa'],
    ['samulnori', 'Samulnori'],
    ['bikutsi', 'Bikutsi'],
    ['samai-thaqil', 'Samai'],
    ['karsilama', 'Karsilama'],
    ['kopanitsa', 'Kopanitsa'],
    ['afoxe', 'Afoxé'],
    ['zouk', 'Zouk'],
    ['ndombolo-detailed', 'Soukous'],
    ['zanku', 'Zanku'],
    ['gqom', 'Gqom'],
  ];

  const clusterOf = {}, groupLabel = {};
  let clusterColours = [], clusterMeta = [], famCacheKey = '', fontsGen = 0, measureCtx = null;
  const textWidth = (font, text) => {
    if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
    measureCtx.font = font;
    return measureCtx.measureText(text).width;
  };
  function measureWidths() {
    nodes.forEach((n) => { n.lw = textWidth('500 12px Inter, sans-serif', n.label.textContent); });
    clusterMeta.forEach((f) => {
      f.wOut = textWidth('500 12px Inter, sans-serif', f.name);
      f.wIn = textWidth('600 20px "Google Sans Flex", "Google Sans", Inter, sans-serif', f.name);
      f.wInMobile = textWidth('600 17px "Google Sans Flex", "Google Sans", Inter, sans-serif', f.name);
    });
    famCacheKey = '';
  }

  function indexGroups(ids) {
    if (clusterMeta.length) return;
    const pos = RX.PATTERN_MAP || {}, near = RX.PATTERN_NEAR || {}, origin = RX.ORIGIN || {};
    const adj = Object.fromEntries(ids.map((id) => [id, new Set()]));
    ids.forEach((id) => (near[id] || []).slice(0, LINKS).forEach(([to]) => { if (adj[to]) { adj[id].add(to); adj[to].add(id); } }));
    const dist = (a, b) => Math.hypot(pos[a][0] - pos[b][0], pos[a][1] - pos[b][1]);

    // Feel-separated pattern groups (12/8, odd meters) can sit in several distant islands on the 2D pattern map.
    // Split disconnected islands into local map clusters, then fold lone 1-node outliers into their tight local link cluster.
    const raw = [];
    (RX.PATTERN_GROUPS || []).forEach(([, label, gids]) => {
      const present = gids.filter((id) => pos[id]);
      present.forEach((id) => { groupLabel[id] = label; });
      const p = Object.fromEntries(present.map((id) => [id, id]));
      const find = (x) => (p[x] === x ? x : (p[x] = find(p[x])));
      for (let i = 0; i < present.length; i++) {
        for (let j = i + 1; j < present.length; j++) {
          const a = present[i], b = present[j], d = dist(a, b);
          if ((adj[a].has(b) && d <= 0.18) || d <= 0.12) p[find(a)] = find(b);
        }
      }
      const comps = {};
      present.forEach((id) => (comps[find(id)] = comps[find(id)] || []).push(id));
      Object.values(comps).forEach((ms) => raw.push(ms));
    });
    const cid = {};
    raw.forEach((ms, ci) => ms.forEach((id) => { cid[id] = ci; }));
    ids.forEach((id) => { if (cid[id] == null) cid[id] = raw.push([id]) - 1; });
    for (let pass = 0; pass < 3; pass++) {
      raw.forEach((_, ci) => {
        const cur = ids.filter((id) => cid[id] === ci);
        if (cur.length !== 1) return;
        const id = cur[0];
        let best = null;
        adj[id].forEach((nb) => {
          const nci = cid[nb];
          if (nci === ci) return;
          const d = dist(id, nb), nbSize = ids.filter((x) => cid[x] === nci).length;
          if (d <= 0.14 && (!best || (nbSize > 1 && best.nbSize === 1) || d < best.d)) best = { nci, d, nbSize };
        });
        if (best && (pass > 0 || best.nbSize > 1)) cid[id] = best.nci;
      });
    }
    const grouped = {};
    ids.forEach((id) => (grouped[cid[id]] = grouped[cid[id]] || []).push(id));
    const clusters = Object.values(grouped).sort((a, b) => b.length - a.length);
    const K = clusters.length;
    clusters.forEach((ms, idx) => ms.forEach((id) => { clusterOf[id] = idx; }));

    const pool = PALETTE.slice();
    while (pool.length < K) {
      const i = pool.length, h = Math.round((i * 137.508) % 360), tier = i % 2;
      pool.push([`hsl(${h} ${92 - tier * 6}% ${52 + tier * 8}%)`, `hsl(${h} ${96 - tier * 4}% ${66 + tier * 7}%)`]);
    }
    const M = pool.length;
    const labs = pool.map(([lt, dk]) => lt.startsWith('#') ? [hexLab(lt), hexLab(dk)] : null);
    const Sep = Array.from({ length: M }, (_, i) => Array.from({ length: M }, (__, j) => (
      i === j ? 0 : (labs[i] && labs[j] ? Math.min(colorSep(labs[i][0], labs[j][0]), colorSep(labs[i][1], labs[j][1])) : 0.12)
    )));
    const Dcol = Sep.map((row) => row.map((d) => (d ? 1 / Math.pow(Math.max(0.025, d), 3) : 0)));
    const W = Array.from({ length: K }, () => new Float64Array(K));
    for (let i = 0; i < K; i++) {
      for (let j = i + 1; j < K; j++) {
        let minP = Infinity, minW = Infinity, linked = 0;
        clusters[i].forEach((a) => clusters[j].forEach((b) => {
          minP = Math.min(minP, dist(a, b));
          if (origin[a] && origin[b]) minW = Math.min(minW, Math.hypot((origin[a][1] - origin[b][1]) / 360, (origin[a][0] - origin[b][0]) / 180));
          if (adj[a].has(b)) linked++;
        }));
        // Pattern-map proximity dominates so adjacent visual clusters always get contrasting hue families.
        W[i][j] = W[j][i] = 1 / Math.pow(Math.max(0.04, minP), 2.6) + 0.08 / Math.pow(Math.max(0.06, minW), 2) + linked * 24;
      }
    }
    // Greedy max-min spatial graph-colouring seed, followed by 2-opt swaps across all M pool slots.
    const used = new Set(), assigned = new Array(K).fill(-1);
    const order = Array.from({ length: K }, (_, i) => i).sort((a, b) => {
      const sa = W[a].reduce((s, v) => s + v, 0), sb = W[b].reduce((s, v) => s + v, 0);
      return sb - sa;
    });
    order.forEach((ci, stepIdx) => {
      let bestSlot = 0, bestScore = -Infinity;
      for (let s = 0; s < M; s++) {
        if (used.has(s)) continue;
        if (stepIdx === 0) { bestSlot = s; break; }
        let cost = 0;
        for (let m = 0; m < K; m++) if (assigned[m] >= 0) cost += W[ci][m] * Dcol[s][assigned[m]];
        if (-cost > bestScore) { bestScore = -cost; bestSlot = s; }
      }
      assigned[ci] = bestSlot; used.add(bestSlot);
    });
    const slots = assigned.concat(Array.from({ length: M }, (_, s) => s).filter((s) => !used.has(s)));
    for (let iter = 0; iter < 50; iter++) {
      let improved = false;
      for (let i = 0; i < K; i++) {
        for (let j = i + 1; j < M; j++) {
          let delta = 0;
          if (j < K) {
            for (let m = 0; m < K; m++) {
              if (m === i || m === j) continue;
              delta += W[i][m] * (Dcol[slots[j]][slots[m]] - Dcol[slots[i]][slots[m]])
                     + W[j][m] * (Dcol[slots[i]][slots[m]] - Dcol[slots[j]][slots[m]]);
            }
          } else {
            for (let m = 0; m < K; m++) if (m !== i) delta += W[i][m] * (Dcol[slots[j]][slots[m]] - Dcol[slots[i]][slots[m]]);
          }
          if (delta < -1e-6) { const t = slots[i]; slots[i] = slots[j]; slots[j] = t; improved = true; }
        }
      }
      if (!improved) break;
    }
    clusterColours = clusters.map((_, i) => pool[slots[i]]);
    const usedNames = new Set();
    clusterMeta = clusters.map((ms, idx) => {
      let name = null, anchorId = ms[0];
      for (let s = 0; s < CLUSTER_SIGNATURES.length; s++) {
        const [sigId, sigLabel] = CLUSTER_SIGNATURES[s];
        if (ms.includes(sigId) && !usedNames.has(sigLabel)) { name = sigLabel; anchorId = sigId; break; }
      }
      if (!name) {
        for (let m = 0; m < ms.length; m++) {
          const cand = ((hooks && hooks.mapLabel ? hooks.mapLabel(ms[m]) : ms[m]).split(' / ')[0] || '').trim();
          if (cand && !usedNames.has(cand)) { name = cand; anchorId = ms[m]; break; }
        }
      }
      if (!name) name = (groupLabel[ms[0]] || ms[0]).replace(/\s+type$/i, '');
      usedNames.add(name);
      return { idx, ids: ms, name, anchorId, el: null, nodes: [], anchorNode: null, wOut: 48, wIn: 68, wInMobile: 62, u: 0, v: 0 };
    });
  }

  function build() {
    host = document.getElementById('map');
    panel = document.getElementById('map-panel');
    svg = svgEl('svg', { class: 'map-svg', role: 'img' });
    gLand = svgEl('g', { class: 'map-land' });
    const defs = svgEl('defs');
    const clip = svgEl('clipPath', { id: 'map-land-clip' });
    clip.appendChild(svgEl('rect', { x: 0, y: 0, width: LAND.width, height: LAND.height }));
    defs.appendChild(clip); svg.appendChild(defs);
    gLand.appendChild(svgEl('path', { d: LAND.path, 'clip-path': 'url(#map-land-clip)' }));
    gLinks = svgEl('g', { class: 'map-links' });
    gNodes = svgEl('g', { class: 'map-nodes' });
    gFamilies = svgEl('g', { class: 'map-families', 'aria-hidden': 'true' });
    svg.appendChild(gLand); svg.appendChild(gLinks); svg.appendChild(gNodes); svg.appendChild(gFamilies);
    host.appendChild(svg);
    toggle = el('button', 'bar-toggle map-layout-toggle');
    toggle.appendChild(el('span', 'material-symbols-outlined', 'public'));
    toggle.appendChild(el('span', 'toggle-label', 'World'));
    toggle.addEventListener('click', () => setLayout(layout === 'world' ? 'pattern' : 'world', true));
    host.appendChild(toggle);
    // Desktop: the same choice as two buttons (css shows one or the other by width).
    seg = el('div', 'bar-seg map-layout-seg'); seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'Map layout');
    [['world', 'public', 'World', 'Place every rhythm at its centre of origin on a world map'], ['pattern', 'bubble_chart', 'Pattern', 'Place rhythms by pattern similarity']].forEach(([lay, icon, text, tip]) => {
      const b = el('button', null); b.dataset.layout = lay; b.title = tip;
      b.appendChild(el('span', 'material-symbols-outlined', icon)); b.appendChild(document.createTextNode(text));
      b.addEventListener('click', () => { if (layout !== lay) setLayout(lay, true); });
      seg.appendChild(b);
    });
    host.appendChild(seg);

    const pos = RX.PATTERN_MAP || {}, origin = RX.ORIGIN || {};
    const validIds = hooks.ids().filter((id) => pos[id]);
    indexGroups(validIds);
    nodes = validIds.map((id) => {
      const g = svgEl('g', { class: 'map-node', 'data-id': id, tabindex: '0', role: 'button', 'aria-label': 'Play ' + hooks.name(id) });
      const hit = svgEl('circle', { r: HIT_R, class: 'map-hit' });
      const cid = clusterOf[id], pair = cid != null && clusterColours[cid];
      const dot = svgEl('circle', { r: NODE_R, class: 'map-dot', ...(cid != null ? { 'data-cluster': cid } : {}) });
      if (pair) dot.setAttribute('style', `--dot-light:${pair[0]};--dot-dark:${pair[1]}`);
      const label = svgEl('text', { class: 'map-label', 'text-anchor': 'middle' });
      label.textContent = hooks.mapLabel ? hooks.mapLabel(id) : hooks.name(id).split(' (')[0];
      g.appendChild(hit); g.appendChild(dot); g.appendChild(label);
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hooks.onTap(id); } });
      gNodes.appendChild(g);
      const at = { pattern: [pos[id][0] * 1000, pos[id][1] * 1000], world: origin[id] ? project(origin[id]) : [LAND.width / 2, LAND.height / 2] };
      return { id, g, label, hit, at, wx: 0, wy: 0, sx: 0, sy: 0, reach: HIT_R, lw: 48 };
    });
    const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    clusterMeta.forEach((f) => {
      f.nodes = f.ids.map((id) => byId[id]).filter(Boolean);
      f.anchorNode = byId[f.anchorId] || f.nodes[0] || null;
      f.el = svgEl('text', { class: 'map-family-label', 'data-cluster': f.idx, 'text-anchor': 'middle' });
      f.el.textContent = f.name;
      gFamilies.appendChild(f.el);
    });
    measureWidths();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { fontsGen++; measureWidths(); queueRender(); });
    }
    const seen = new Set();
    nodes.forEach((n) => ((RX.PATTERN_NEAR || {})[n.id] || []).slice(0, LINKS).forEach(([to, sim]) => {
      const key = [n.id, to].sort().join('|');
      if (!byId[to] || seen.has(key)) return;
      seen.add(key);
      const line = svgEl('line', { class: 'map-link', 'stroke-opacity': (0.25 + 0.55 * sim).toFixed(2) });
      gLinks.appendChild(line);
      links.push({ a: n, b: byId[to], line });
    }));
    weakLinks(byId, seen);
    setLayout(hooks.layout ? hooks.layout() : 'pattern', false);
    bindGestures();
    // Work is deferred a frame so a resize that changes another observed element does not loop within one frame.
    if (window.ResizeObserver) new ResizeObserver(() => requestAnimationFrame(() => { if (!host.hidden && !gesturing) resize(); })).observe(host);
  }

  // Identical patterns fill each other's link slots, so some clusters (Soli / Makru / Mendiani) form islands. Join
  // every island to the rest with a weak, dashed link: its members' best similarity to anything outside it
  // (RX.PATTERN_NEAR), else the nearest dot on the pattern map. Repeats until the graph is one piece.
  function weakLinks(byId, seen) {
    const parent = Object.fromEntries(nodes.map((n) => [n.id, n.id]));
    const find = (id) => (parent[id] === id ? id : (parent[id] = find(parent[id])));
    links.forEach((l) => { parent[find(l.a.id)] = find(l.b.id); });
    const near = RX.PATTERN_NEAR || {};
    for (let guard = 0; guard < nodes.length; guard++) {
      const comps = {};
      nodes.forEach((n) => (comps[find(n.id)] = comps[find(n.id)] || []).push(n));
      const list = Object.values(comps);
      if (list.length < 2) break;
      list.forEach((members) => {
        const root = find(members[0].id);
        let best = null;
        members.forEach((n) => (near[n.id] || []).forEach(([to, sim]) => {
          if (byId[to] && find(to) !== root && (!best || sim > best.sim)) best = { a: n, b: byId[to], sim };
        }));
        if (!best) members.forEach((n) => nodes.forEach((m) => {
          if (find(m.id) === root) return;
          const d = Math.hypot(n.at.pattern[0] - m.at.pattern[0], n.at.pattern[1] - m.at.pattern[1]);
          if (!best || d < best.d) best = { a: n, b: m, d };
        }));
        if (!best) return; // merged into everything else earlier in this pass
        const key = [best.a.id, best.b.id].sort().join('|');
        if (find(best.b.id) === root || seen.has(key)) return; // an earlier island already joined this one
        seen.add(key);
        parent[root] = find(best.b.id);
        const line = svgEl('line', { class: 'map-link map-link-weak' });
        gLinks.appendChild(line);
        links.push({ a: best.a, b: best.b, line, weak: true });
      });
    }
  }

  // Dots that sit on (nearly) the same screen point at the current zoom (one city, identical patterns, or two towns a
  // degree apart on a zoomed-out map) are fanned into one ring around their centre: a pair side by side, three as a
  // triangle, more as a ring wide enough that no dots touch. A ring takes only dots within reach of its first member
  // (no chaining), so separate places keep their real positions; rings split back apart as you zoom in.
  function placeOnScreen() {
    const T = 8, P = nodes.map((n) => [view.x + n.wx * view.k, view.y + n.wy * view.k]), taken = new Set(), groups = [];
    P.forEach((p, i) => {
      if (taken.has(i)) return;
      const g = [i]; taken.add(i);
      P.forEach((q, j) => { if (!taken.has(j) && Math.abs(p[0] - q[0]) < T && Math.hypot(p[0] - q[0], p[1] - q[1]) < T) { g.push(j); taken.add(j); } });
      groups.push(g);
    });
    rings = [];
    groups.forEach((g) => {
      if (g.length === 1) { nodes[g[0]].sx = P[g[0]][0]; nodes[g[0]].sy = P[g[0]][1]; nodes[g[0]].dir = null; return; }
      const cx = g.reduce((a, i) => a + P[i][0], 0) / g.length, cy = g.reduce((a, i) => a + P[i][1], 0) / g.length;
      // Compact when zoomed out; as you zoom in the ring opens up (neighbours up to 56 px apart) so each member is an
      // easy tap even when they share one exact point (Soleá / Tangos in Seville never separate on their own).
      const gap = Math.min(56, Math.max(2 * NODE_R + 4, 20 * Math.sqrt(Math.max(1, view.k / fitK))));
      const r = Math.max(11, (g.length * (2 * NODE_R + 4)) / (2 * Math.PI), g.length === 2 ? gap / 2 : gap / (2 * Math.sin(Math.PI / g.length)));
      rings.push({ cx, cy, r });
      const dir = (i) => (Math.hypot(P[i][0] - cx, P[i][1] - cy) < 0.5 ? -Math.PI / 2 + i * 1e-3 : Math.atan2(P[i][1] - cy, P[i][0] - cx));
      const order = g.slice().sort((a, c) => dir(a) - dir(c)), a0 = dir(order[0]);
      order.forEach((i, k) => { const a = a0 + (2 * Math.PI * k) / g.length; nodes[i].sx = cx + r * Math.cos(a); nodes[i].sy = cy + r * Math.sin(a); nodes[i].dir = a; });
    });
  }

  const sx = (n) => n.sx, sy = (n) => n.sy; // screen position, set by placeOnScreen() in render()

  /** The node whose centre is nearest a screen point, within its tap reach; null if none. */
  function nodeAt(px, py) {
    let best = null, bd = Infinity;
    nodes.forEach((n) => { const d = Math.hypot(sx(n) - px, sy(n) - py); if (d <= n.reach && d < bd) { bd = d; best = n; } });
    return best;
  }

  /** Tap reach per dot: up to HIT_R_MAX when zoomed in, never past half the gap to the nearest dot, never below HIT_R. */
  function sizeTapAreas() {
    const want = Math.min(HIT_R_MAX, HIT_R * Math.sqrt(Math.max(1, view.k / fitK)));
    nodes.forEach((n) => {
      let nn = Infinity;
      nodes.forEach((m) => { if (m !== n && Math.abs(m.sx - n.sx) < 2 * want) nn = Math.min(nn, Math.hypot(m.sx - n.sx, m.sy - n.sy)); });
      const reach = Math.max(HIT_R, Math.min(want, nn / 2));
      if (reach !== n.reach) { n.reach = reach; n.hit.setAttribute('r', reach.toFixed(1)); }
    });
  }

  // ── Layout ──
  function fitView(lay) {
    const B = BOUNDS[lay], k = Math.min((w - 2 * PAD) / B.w, (h - 2 * PAD) / B.h);
    return { k, x: (w - B.w * k) / 2, y: (h - B.h * k) / 2 };
  }

  /** Switch layout; `animate` moves every node (and the view) to its new place. */
  function setLayout(lay, animate) {
    layout = lay === 'world' ? 'world' : 'pattern';
    if (hooks.setLayout) hooks.setLayout(layout);
    toggle.setAttribute('aria-pressed', String(layout === 'world'));
    seg.querySelectorAll('[data-layout]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.layout === layout)));
    toggle.title = layout === 'world' ? 'World map on: tap to place rhythms by pattern again' : 'Place every rhythm at its centre of origin on a world map';
    svg.setAttribute('aria-label', layout === 'world' ? 'Rhythms at their centres of origin' : 'Rhythms placed by pattern similarity');
    gLand.classList.toggle('map-land-on', layout === 'world');
    svg.classList.toggle('map-world', layout === 'world');
    if (gFamilies) gFamilies.hidden = layout !== 'pattern';
    famCacheKey = '';
    cancelAnimationFrame(anim);
    const to = nodes.map((n) => ({ wx: n.at[layout][0], wy: n.at[layout][1] }));
    if (!w) { nodes.forEach((n, i) => Object.assign(n, to[i])); return; } // not laid out yet: resize() fits
    // With a rhythm selected (the one in the picture panel), keep the zoom level (relative to each layout's fitted
    // view) and centre that rhythm in the new layout, so switching keeps context. Otherwise show the whole layout.
    // Going to node view zooms out 3x (to see neighbouring clusters); going to the world map zooms in 3x.
    const sel = panelId && nodes.find((n) => n.id === panelId), was = fitK ? view.k / fitK : 1;
    const ratio = layout === 'pattern' ? Math.max(1, was / 3) : Math.min(MAX_ZOOM.world, was * 3);
    const fit = fitView(layout); fitK = fit.k;
    const target = sel && w ? (() => { const k = fit.k * ratio; return { k, x: w / 2 - sel.at[layout][0] * k, y: h / 2 - sel.at[layout][1] * k }; })() : fit;
    if (!animate) { nodes.forEach((n, i) => Object.assign(n, to[i])); view = target; render(); return; }
    const from = nodes.map((n) => ({ wx: n.wx, wy: n.wy })), v0 = { ...view }, t0 = performance.now();
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const frame = (now) => {
      const t = Math.min(1, (now - t0) / MORPH_MS), e = ease(t), mix = (a, b) => a + (b - a) * e;
      nodes.forEach((n, i) => { n.wx = mix(from[i].wx, to[i].wx); n.wy = mix(from[i].wy, to[i].wy); });
      view = { x: mix(v0.x, target.x), y: mix(v0.y, target.y), k: mix(v0.k, target.k) };
      render();
      if (t < 1) anim = requestAnimationFrame(frame);
    };
    anim = requestAnimationFrame(frame);
  }

  function resize() {
    const r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const first = !fitted || !w;
    const cx = (w / 2 - view.x) / view.k, cy = (h / 2 - view.y) / view.k; // keep the centre steady across resizes
    w = r.width; h = r.height;
    svg.setAttribute('width', w); svg.setAttribute('height', h);
    const fit = fitView(layout); fitK = fit.k;
    if (first) { view = fit; fitted = true; }
    else { view.x = w / 2 - cx * view.k; view.y = h / 2 - cy * view.k; }
    render();
  }

  let gesturing = false; // fingers down: resize() must not refit mid-pinch (iOS fires viewport resizes during gestures)

  // One render per animation frame at most: pointermove fires far faster than the screen
  // paints, and a full render (ring grouping + every node and link attribute) per event
  // saturates the main thread on a phone — the map jitters and flickers while pinching.
  let renderQueued = false;
  function queueRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => { renderQueued = false; render(); });
  }

  // Cartographic floating family labels in Pattern view: compact rhythm-label style when zoomed out, shifting to
  // larger muted-gray area landmarks anchored outside each cluster's dots and rhythm names when zoomed in.
  const boxOverlap = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
  const RINGS_OUT = [8, 16, 25, 36, 48, 62, 78, 96, 118, 144];
  const RINGS_IN = [22, 34, 48, 64, 84, 108, 136, 168, 206, 250, 300];
  const ANGLES = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7, 8].map((s) => -Math.PI / 2 + (s * Math.PI) / 8);

  function nodeLabelBox(n) {
    const u = n.sx - view.x, v = n.sy - view.y;
    const a = n.dir, c = a == null ? 0 : Math.cos(a), s = a == null ? -1 : Math.sin(a);
    const lx = u + c * (NODE_R + 5), ly = v + s * (NODE_R + 5) + (s > 0.3 ? 9 : s < -0.3 ? 0 : 4);
    const rw = n.lw * 1.07 + 5;
    const rx0 = c > 0.35 ? lx - 2 : c < -0.35 ? lx - rw : lx - rw / 2;
    return [rx0, ly - 13.5, rx0 + rw, ly + 4.5];
  }

  function placeFamilies(zoomed) {
    const isWide = wide.matches, fs = zoomed ? (isWide ? 20 : 17) : 12;
    const mapW = BOUNDS.pattern.w * view.k, mapH = BOUNDS.pattern.h * view.k;
    const fit = fitView('pattern');
    const minU = zoomed ? -PAD + 6 : -fit.x + 6;
    const maxU = zoomed ? mapW + PAD - 6 : -fit.x + w - 6;
    const minV = zoomed ? -PAD + 6 : -fit.y + 6;
    const maxV = zoomed ? mapH + PAD - 6 : -fit.y + h - 6;
    const clamp = (val, lo, hi) => (lo > hi ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, val)));
    const allDots = nodes.map((n) => [n.sx - view.x, n.sy - view.y, n.id]);

    if (!zoomed) {
      const hard = [[-fit.x, -fit.y, -fit.x + (isWide ? 204 : 114), -fit.y + 60]];
      nodes.forEach((n) => {
        if (!n._on) return;
        const u = n.sx - view.x, v = n.sy - view.y;
        hard.push([u - 11, v - 11, u + 11, v + 11], nodeLabelBox(n));
      });
      const dotBoxesOut = allDots.map(([u, v]) => [u - 9.5, v - 9.5, u + 9.5, v + 9.5]);
      const items = clusterMeta.map((f) => {
        const hw = Math.ceil(f.wOut * 0.54 + 3.5), hh = 9.5;
        let eu0 = Infinity, ev0 = Infinity, eu1 = -Infinity, ev1 = -Infinity, su = 0, sv = 0, topU = 0, topV = Infinity;
        f.nodes.forEach((n) => {
          const u = n.sx - view.x, v = n.sy - view.y;
          eu0 = Math.min(eu0, u); ev0 = Math.min(ev0, v); eu1 = Math.max(eu1, u); ev1 = Math.max(ev1, v);
          if (v < topV) { topV = v; topU = u; }
          su += u; sv += v;
        });
        const cnt = f.nodes.length || 1, mu = su / cnt, mv = sv / cnt;
        const ownSet = new Set(f.ids);
        // Pick an initial anchor near the cluster crown/perimeter that avoids sitting directly over dots when room exists.
        const seedCands = [
          [topU, ev0 - NODE_R - hh - 3],
          [mu, ev0 - NODE_R - hh - 3],
          [mu, ev1 + NODE_R + hh + 4],
          [eu0 - NODE_R - hw - 5, mv],
          [eu1 + NODE_R + hw + 5, mv],
          [mu, mv - 10],
        ];
        [14, 24, 36].forEach((rad) => ANGLES.forEach((ang) => seedCands.push([mu + Math.cos(ang) * rad * 1.2, mv + Math.sin(ang) * rad])));
        let bestA = [clamp(mu, minU + hw, maxU - hw), clamp(ev0 - NODE_R - hh - 3, minV + hh, maxV - hh)], bestAScore = Infinity;
        seedCands.forEach(([rawU, rawV]) => {
          const cu = clamp(rawU, minU + hw, maxU - hw), cv = clamp(rawV, minV + hh, maxV - hh);
          const b = [cu - hw, cv - hh, cu + hw, cv + hh];
          if (hard.some((hb) => boxOverlap(b, hb))) return;
          let dotHits = 0, ownD = Infinity, otherD = Infinity;
          for (let i = 0; i < dotBoxesOut.length; i++) {
            if (boxOverlap(b, dotBoxesOut[i])) dotHits++;
            const d = Math.hypot(cu - allDots[i][0], cv - allDots[i][1]);
            if (ownSet.has(allDots[i][2])) { if (d < ownD) ownD = d; }
            else if (d < otherD) otherD = d;
          }
          let sc = ownD + Math.hypot(cu - mu, cv - mv) * 0.35 + dotHits * (view.k >= 0.5 ? 42 : 16) + (cv < ev0 ? -5 : 0);
          if (otherD < ownD) sc += (ownD - otherD) * 2 + 24;
          if (sc < bestAScore) { bestAScore = sc; bestA = [cu, cv]; }
        });
        return { f, hw, hh, au: bestA[0], av: bestA[1], u: bestA[0], v: bestA[1], ownSet };
      });

      for (let iter = 0; iter < 30; iter++) {
        const alpha = iter < 18 ? 0.1 * (1 - iter / 18) : 0;
        items.forEach((it) => { it.u += (it.au - it.u) * alpha; it.v += (it.av - it.v) * alpha; });
        for (let i = 0; i < items.length; i++) {
          for (let j = i + 1; j < items.length; j++) {
            const A = items[i], B = items[j];
            const ox = A.hw + B.hw + 2 - Math.abs(A.u - B.u), oy = A.hh + B.hh + 1.5 - Math.abs(A.v - B.v);
            if (ox <= 0 || oy <= 0) continue;
            if (oy <= ox * 1.15) {
              const s = A.v === B.v ? (A.f.idx < B.f.idx ? -1 : 1) : Math.sign(A.v - B.v);
              A.v += s * (oy * 0.52); B.v -= s * (oy * 0.52);
            } else {
              const s = A.u === B.u ? (A.f.idx < B.f.idx ? -1 : 1) : Math.sign(A.u - B.u);
              A.u += s * (ox * 0.52); B.u -= s * (ox * 0.52);
            }
          }
        }
        items.forEach((it) => {
          hard.forEach((hb) => {
            const hcx = (hb[0] + hb[2]) / 2, hcy = (hb[1] + hb[3]) / 2;
            const hhw = (hb[2] - hb[0]) / 2 + it.hw + 2, hhh = (hb[3] - hb[1]) / 2 + it.hh + 2;
            const ox = hhw - Math.abs(it.u - hcx), oy = hhh - Math.abs(it.v - hcy);
            if (ox <= 0 || oy <= 0) return;
            if (oy <= ox) it.v += (it.v < hcy ? -1 : 1) * (oy + 0.5);
            else it.u += (it.u < hcx ? -1 : 1) * (ox + 0.5);
          });
          it.u = clamp(it.u, minU + it.hw, maxU - it.hw);
          it.v = clamp(it.v, minV + it.hh, maxV - it.hh);
        });
      }

      const placed = hard.slice();
      items.forEach((it) => {
        const clear = (cu, cv, noDots) => {
          const b = [cu - it.hw, cv - it.hh, cu + it.hw, cv + it.hh];
          if (placed.some((p) => boxOverlap(b, p))) return false;
          if (noDots && dotBoxesOut.some((db) => boxOverlap(b, db))) return false;
          return true;
        };
        if (!clear(it.u, it.v, view.k >= 0.5)) {
          let found = null;
          for (const strictDots of (view.k >= 0.5 ? [true, false] : [false])) {
            if (clear(it.u, it.v, strictDots)) { found = [it.u, it.v]; break; }
            for (let ri = 0; ri < RINGS_OUT.length && !found; ri++) {
              const rad = RINGS_OUT[ri];
              for (let ai = 0; ai < ANGLES.length; ai++) {
                const cu = clamp(it.au + Math.cos(ANGLES[ai]) * rad * 1.25, minU + it.hw, maxU - it.hw);
                const cv = clamp(it.av + Math.sin(ANGLES[ai]) * rad, minV + it.hh, maxV - it.hh);
                if (clear(cu, cv, strictDots)) { found = [cu, cv]; break; }
              }
            }
            if (found) break;
          }
          if (found) { it.u = found[0]; it.v = found[1]; }
        }
        placed.push([it.u - it.hw - 1, it.v - it.hh - 1, it.u + it.hw + 1, it.v + it.hh + 1]);
        it.f.u = it.u; it.f.v = it.v;
      });
      return;
    }

    // Zoomed in: place each family landmark near its cluster's crown/heart, strictly clear of ALL dots and rhythm names.
    const dotBoxes = allDots.map(([u, v]) => [u - 11.5, v - 11.5, u + 11.5, v + 11.5]);
    const lblBoxes = nodes.filter((n) => n._on).map(nodeLabelBox);
    const obstacles = dotBoxes.concat(lblBoxes);
    const placedFam = [];

    clusterMeta.forEach((f) => {
      const tw = isWide ? f.wIn : f.wInMobile;
      const hw = Math.ceil(tw * 0.55 + 5), hh = Math.ceil(fs * 0.66 + 3);
      let eu0 = Infinity, ev0 = Infinity, eu1 = -Infinity, ev1 = -Infinity, su = 0, sv = 0;
      let topU = 0, topV = Infinity, botU = 0, botV = -Infinity;
      const memberUV = f.nodes.map((n) => {
        const u = n.sx - view.x, v = n.sy - view.y;
        su += u; sv += v;
        eu0 = Math.min(eu0, u - 11.5); ev0 = Math.min(ev0, v - 11.5);
        eu1 = Math.max(eu1, u + 11.5); ev1 = Math.max(ev1, v + 11.5);
        if (n._on) {
          const lb = nodeLabelBox(n);
          eu0 = Math.min(eu0, lb[0]); ev0 = Math.min(ev0, lb[1]);
          eu1 = Math.max(eu1, lb[2]); ev1 = Math.max(ev1, lb[3]);
        }
        if (v < topV) { topV = v; topU = u; }
        if (v > botV) { botV = v; botU = u; }
        return [u, v];
      });
      const cnt = memberUV.length || 1, mu = su / cnt, mv = sv / cnt;
      const ecu = (eu0 + eu1) / 2, ecv = (ev0 + ev1) / 2;
      const anchU = f.anchorNode ? f.anchorNode.sx - view.x : mu;
      const anchV = f.anchorNode ? f.anchorNode.sy - view.y : mv;
      const coreU = 0.55 * mu + 0.45 * anchU, coreV = 0.55 * mv + 0.45 * anchV;
      const ownSet = new Set(f.ids);

      const cands = [];
      [5, 16, 28, 42].forEach((dv) => {
        cands.push([topU, ev0 - hh - dv], [coreU, ev0 - hh - dv], [ecu, ev0 - hh - dv], [eu0 + hw, ev0 - hh - dv], [eu1 - hw, ev0 - hh - dv]);
        cands.push([botU, ev1 + hh + dv], [coreU, ev1 + hh + dv], [ecu, ev1 + hh + dv], [eu0 + hw, ev1 + hh + dv], [eu1 - hw, ev1 + hh + dv]);
      });
      [8, 20, 34].forEach((du) => {
        cands.push([eu0 - hw - du, coreV], [eu0 - hw - du, ev0 + hh], [eu0 - hw - du, ev1 - hh]);
        cands.push([eu1 + hw + du, coreV], [eu1 + hw + du, ev0 + hh], [eu1 + hw + du, ev1 - hh]);
      });
      RINGS_IN.forEach((rad) => {
        ANGLES.forEach((ang) => {
          cands.push([coreU + Math.cos(ang) * rad * 1.15, coreV + Math.sin(ang) * rad]);
          cands.push([anchU + Math.cos(ang) * rad * 1.15, anchV + Math.sin(ang) * rad]);
          if (cnt > 2) cands.push([ecu + Math.cos(ang) * rad * 1.15, ecv + Math.sin(ang) * rad]);
        });
      });

      let best = null, bestScore = Infinity;
      for (let ci = 0; ci < cands.length; ci++) {
        const cu = cands[ci][0], cv = cands[ci][1];
        const box = [cu - hw, cv - hh, cu + hw, cv + hh];
        let hit = false;
        for (let oi = 0; oi < obstacles.length; oi++) { if (boxOverlap(box, obstacles[oi])) { hit = true; break; } }
        if (hit) continue;
        for (let pi = 0; pi < placedFam.length; pi++) { if (boxOverlap(box, placedFam[pi])) { hit = true; break; } }
        if (hit) continue;

        let ownD = Infinity, otherD = Infinity;
        for (let m = 0; m < memberUV.length; m++) {
          const d = Math.hypot(cu - memberUV[m][0], cv - memberUV[m][1]);
          if (d < ownD) ownD = d;
        }
        for (let ni = 0; ni < allDots.length; ni++) {
          if (ownSet.has(allDots[ni][2])) continue;
          const d = Math.hypot(cu - allDots[ni][0], cv - allDots[ni][1]);
          if (d < otherD) otherD = d;
        }
        const coreD = Math.hypot(cu - coreU, cv - coreV);
        let score = ownD * 0.85 + coreD * 0.42 + (cv < coreV ? -10 : 0) + (cv + hh <= ev0 + 4 ? -8 : 0);
        if (otherD < 34) score += (34 - otherD) * 1.6;
        if (otherD < ownD) score += (ownD - otherD) * 2.4 + 36;
        if (cu - hw < minU) score += (minU - (cu - hw)) * 1.8 + 18;
        if (cu + hw > maxU) score += (cu + hw - maxU) * 1.8 + 18;
        if (cv - hh < minV) score += (minV - (cv - hh)) * 1.8 + 18;
        if (cv + hh > maxV) score += (cv + hh - maxV) * 1.8 + 18;
        if (score < bestScore) { bestScore = score; best = [cu, cv]; }
      }

      if (!best) best = [ecu, ev0 - hh - 18];
      f.u = best[0]; f.v = best[1];
      placedFam.push([f.u - hw - 4, f.v - hh - 3, f.u + hw + 4, f.v + hh + 3]);
    });
  }

  function render() {
    const zoomed = view.k / fitK >= 1.8;
    svg.classList.toggle('map-zoomed', zoomed);
    gLand.setAttribute('transform', `matrix(${view.k} 0 0 ${view.k} ${view.x.toFixed(1)} ${view.y.toFixed(1)})`);
    placeOnScreen();
    sizeTapAreas();
    nodes.forEach((n) => {
      n.g.setAttribute('transform', `translate(${sx(n).toFixed(1)},${sy(n).toFixed(1)})`);
      // Labels sit above a lone dot; in a ring they point outward, away from the other members.
      const a = n.dir, c = a == null ? 0 : Math.cos(a), s = a == null ? -1 : Math.sin(a);
      n.label.setAttribute('x', (c * (NODE_R + 5)).toFixed(1));
      n.label.setAttribute('y', (s * (NODE_R + 5) + (s > 0.3 ? 9 : s < -0.3 ? 0 : 4)).toFixed(1));
      n.label.setAttribute('text-anchor', c > 0.35 ? 'start' : c < -0.35 ? 'end' : 'middle');
      // Toggle the class only when it changes: mid-pinch class churn restarts label fades
      // every event and reads as flicker.
      const on = zoomed || n.g.classList.contains('map-node-playing') || n.g.classList.contains('map-node-pending');
      if (n._on !== on) { n._on = on; n.label.classList.toggle('map-label-on', on); }
    });
    links.forEach((l) => {
      l.line.setAttribute('x1', sx(l.a).toFixed(1)); l.line.setAttribute('y1', sy(l.a).toFixed(1));
      l.line.setAttribute('x2', sx(l.b).toFixed(1)); l.line.setAttribute('y2', sy(l.b).toFixed(1));
    });
    if (layout === 'pattern' && gFamilies && w > 0) {
      const morphing = nodes.some((n) => Math.abs(n.wx - n.at.pattern[0]) > 0.05 || Math.abs(n.wy - n.at.pattern[1]) > 0.05);
      const onKey = zoomed ? 'all' : nodes.filter((n) => n._on).map((n) => n.id).join(',');
      const key = morphing ? '' : `${zoomed ? 1 : 0}|${view.k.toFixed(4)}|${fitK.toFixed(4)}|${w}x${h}|${wide.matches ? 1 : 0}|${fontsGen}|${onKey}`;
      if (!key || key !== famCacheKey) { placeFamilies(zoomed); famCacheKey = key; }
      const dy = (zoomed ? (wide.matches ? 20 : 17) : 12) * 0.35;
      clusterMeta.forEach((f) => {
        f.el.setAttribute('x', (view.x + f.u).toFixed(1));
        f.el.setAttribute('y', (view.y + f.v + dy).toFixed(1));
      });
    }
  }

  function zoomAt(px, py, factor) {
    // On a ring, zoom about its centre (the members' true place), so the ring opens up where it is instead of its
    // members flying off-screen.
    const ring = rings.find((g) => Math.hypot(px - g.cx, py - g.cy) <= g.r + HIT_R);
    if (ring) { px = ring.cx; py = ring.cy; }
    const k = Math.min(fitK * MAX_ZOOM[layout], Math.max(fitK * 0.5, view.k * factor));
    view.x = px - ((px - view.x) / view.k) * k;
    view.y = py - ((py - view.y) / view.k) * k;
    view.k = k;
    queueRender();
  }

  // ── Gestures: one pointer pans, two pinch-zoom, wheel zooms, a short still press on a node plays it ──
  function bindGestures() {
    const pts = new Map();
    let tap = null, last = null;
    const local = (e) => { const r = svg.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const pair = () => { const [a, b] = [...pts.values()]; return { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) }; };

    svg.addEventListener('pointerdown', (e) => {
      try { svg.setPointerCapture(e.pointerId); } catch (err) { /* capture only keeps a drag going off the map */ }
      gesturing = true;
      const p = local(e); pts.set(e.pointerId, p);
      // The nearest centre wins, not whichever dot happens to be drawn on top.
      const node = pts.size === 1 && nodeAt(p.x, p.y);
      tap = node ? { id: node.id, x: p.x, y: p.y } : null;
      last = pts.size === 2 ? pair() : p;
    });
    svg.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) return;
      const p = local(e); pts.set(e.pointerId, p);
      if (pts.size === 1) {
        if (tap && Math.hypot(p.x - tap.x, p.y - tap.y) > TAP_MOVE) tap = null;
        view.x += p.x - last.x; view.y += p.y - last.y; last = p; queueRender();
      } else if (pts.size === 2) {
        const q = pair(); tap = null;
        if (last && last.d) { view.x += q.cx - last.cx; view.y += q.cy - last.cy; zoomAt(q.cx, q.cy, q.d / last.d); }
        last = q;
      }
    });
    const end = (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      if (tap && pts.size === 0 && e.type === 'pointerup') hooks.onTap(tap.id);
      tap = null;
      last = pts.size === 1 ? [...pts.values()][0] : null;
      if (pts.size === 0) { gesturing = false; resize(); } // pick up any viewport change the pinch hid
    };
    svg.addEventListener('pointerup', end);
    svg.addEventListener('pointercancel', end);
    svg.addEventListener('wheel', (e) => { e.preventDefault(); const p = local(e); zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
  }

  // ── Picture of the playing rhythm ──
  function buildPanel(id) {
    panelId = id;
    panel.replaceChildren();
    const head = el('div', 'map-panel-head');
    const titleRow = el('div', 'map-panel-title-row');
    // Play / stop beside the title. The panel stays on this rhythm after it stops, so the button plays it again.
    playBtn = el('button', 'map-panel-stop');
    playBtn.appendChild(el('span', 'material-symbols-outlined', 'stop'));
    playBtn.addEventListener('click', () => hooks.onTap(id));
    titleRow.appendChild(playBtn);
    titleRow.appendChild(el('h2', 'map-panel-title', hooks.name(id)));
    // Collapse chevron, always at the top right: down on phones (panel below the map), right on desktop (beside it).
    collapseBtn = el('button', 'map-panel-collapse');
    collapseBtn.appendChild(el('span', 'material-symbols-outlined', ''));
    collapseBtn.addEventListener('click', () => { collapsed = !collapsed; try { localStorage.setItem('rx-map-panel-collapsed', collapsed ? '1' : '0'); } catch (e) { /* ignore */ } paintPanelChrome(); });
    titleRow.appendChild(collapseBtn);
    head.appendChild(titleRow);
    head.appendChild(el('span', 'map-panel-sub', [hooks.region(id), groupLabel[id], hooks.bpm(id) + ' bpm'].filter(Boolean).join(' · ')));
    panel.appendChild(head);
    const body = el('div', 'map-panel-lanes');
    panelLanes = hooks.lanes(id).map((lane) => {
      const row = el('div', 'map-lane' + (lane.muted ? ' map-lane-muted' : ''));
      // The part name mutes / unmutes the part, like the list's mute button.
      const name = el('button', 'map-lane-label');
      name.appendChild(el('span', 'material-symbols-outlined', lane.muted ? 'volume_off' : 'volume_up'));
      name.appendChild(el('span', 'map-lane-name', lane.label));
      name.setAttribute('aria-pressed', String(!lane.muted));
      name.title = (lane.muted ? 'Unmute ' : 'Mute ') + lane.label;
      name.addEventListener('click', () => { hooks.toggleMute(id, lane.ids); refreshPanel(); });
      row.appendChild(name);
      const grid = el('div', 'map-steps' + (lane.locked ? ' map-steps-locked' : ''));
      const n = lane.pattern.length;
      grid.style.setProperty('--cols', n);
      const beat = Math.max(1, lane.grid / 4);
      const cells = [...lane.pattern].map((c, i) => {
        // Tap a step to turn it on or off (same edit as the list view); the 4/4 kick is shown but locked.
        const s = el(lane.locked ? 'span' : 'button', 'map-step' + (i % beat === 0 ? ' map-step-beat' : '') + (c === 'X' ? ' map-step-accent' : c === 'x' ? ' map-step-hit' : c === 'o' ? ' map-step-ghost' : ''));
        if (!lane.locked) {
          s.setAttribute('aria-label', lane.label + ' step ' + (i + 1) + (c === '.' ? ', off' : ', on'));
          s.addEventListener('click', () => { hooks.toggleStep(id, lane.ids, i); refreshPanel(); });
        }
        grid.appendChild(s); return s;
      });
      row.appendChild(grid); body.appendChild(row);
      return { cells, grid: lane.grid, now: -1 };
    });
    panel.appendChild(body);
    // Info below the instrument rows, always visible: scroll the panel to read it.
    if (hooks.note) {
      const text = hooks.note(id);
      if (text) {
        const note = el('p', 'map-panel-note', '');
        note.innerHTML = text;
        panel.appendChild(note);
      }
    }
    const actions = el('div', 'map-panel-actions');
    familyBtn = el('button', 'bar-toggle map-panel-family');
    familyBtn.type = 'button';
    familyBtn.id = 'map-highlight-family';
    const famIcon = el('span', 'material-symbols-outlined', 'workspaces');
    famIcon.setAttribute('aria-hidden', 'true');
    familyBtn.appendChild(famIcon);
    familyBtn.appendChild(el('span', 'toggle-label', 'Highlight family'));
    familyBtn.addEventListener('click', () => {
      highlightFamily = !highlightFamily;
      paint();
    });
    actions.appendChild(familyBtn);
    panel.appendChild(actions);
  }

  /** Glide the view (zoom and pan) to a target over `ms`. `target` may be a function, re-read every frame, so the
   *  glide still lands right if the map is resized meanwhile (the picture panel opening). */
  function tweenView(target, ms) {
    cancelAnimationFrame(anim);
    const v0 = { ...view }, t0 = performance.now(), ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const frame = (now) => {
      const t = Math.min(1, (now - t0) / ms), e = ease(t), mix = (a, b) => a + (b - a) * e;
      const to = typeof target === 'function' ? target() : target;
      view = { x: mix(v0.x, to.x), y: mix(v0.y, to.y), k: mix(v0.k, to.k) };
      render();
      if (t < 1) anim = requestAnimationFrame(frame);
    };
    anim = requestAnimationFrame(frame);
  }

  /** Centre a rhythm, zoomed to at least `minRatio` times the fitted view, so its part of the map is in view. */
  function focus(id, minRatio = 3) {
    const n = nodes.find((x) => x.id === id);
    if (!n || !w) return;
    const ratio = Math.max(minRatio, view.k / fitK);
    tweenView(() => { const k = fitK * ratio; return { k, x: w / 2 - n.at[layout][0] * k, y: h / 2 - n.at[layout][1] * k }; }, 600);
  }

  /** Rebuild the picture after an edit, keeping the playhead where it was. */
  function refreshPanel() {
    if (!panelId) return;
    const now = panelLanes.map((l) => l.now);
    buildPanel(panelId); paintPanelChrome();
    panelLanes.forEach((l, k) => { if (now[k] >= 0 && l.cells[now[k]]) { l.cells[now[k]].classList.add('map-step-now'); l.now = now[k]; } });
  }

  /** Playhead: step k of each lane at this beat position (each lane on its own clock). */
  function step(id, abs, beats) {
    if (id !== panelId || beats == null) return;
    panelLanes.forEach((l) => {
      const k = Math.floor(beats / (4 / l.grid) + 1e-6) % l.cells.length;
      if (k === l.now) return;
      if (l.now >= 0) l.cells[l.now].classList.remove('map-step-now');
      l.cells[k].classList.add('map-step-now'); l.now = k;
    });
  }

  /** Play / stop icon, collapse chevron and the panel's collapsed state. */
  function paintPanelChrome() {
    if (!playBtn) return;
    const on = hooks.playing() === panelId, name = hooks.name(panelId);
    playBtn.firstChild.textContent = on ? 'stop' : 'play_arrow';
    playBtn.title = (on ? 'Stop ' : 'Play ') + name; playBtn.setAttribute('aria-label', playBtn.title);
    playBtn.classList.toggle('map-panel-play', !on);
    collapseBtn.firstChild.textContent = wide.matches ? (collapsed ? 'chevron_left' : 'chevron_right') : (collapsed ? 'expand_less' : 'expand_more');
    collapseBtn.title = collapsed ? 'Show the rhythm' : 'Hide the rhythm';
    collapseBtn.setAttribute('aria-label', collapseBtn.title); collapseBtn.setAttribute('aria-expanded', String(!collapsed));
    document.body.classList.toggle('map-panel-collapsed', collapsed);
    if (familyBtn) {
      familyBtn.setAttribute('aria-pressed', String(highlightFamily));
      familyBtn.title = highlightFamily
        ? 'Highlighting this pattern family — tap to show all rhythms normally'
        : 'Dim rhythms outside this pattern family by 50%';
    }
    if (!on) panelLanes.forEach((l) => { if (l.now >= 0) l.cells[l.now].classList.remove('map-step-now'); l.now = -1; });
  }

  /** Repaint playing / queued nodes and the picture panel. */
  function paint() {
    if (!svg) return;
    const cur = hooks.playing(), pend = hooks.pending();
    nodes.forEach((n) => {
      n.g.classList.toggle('map-node-playing', n.id === cur);
      n.g.classList.toggle('map-node-pending', n.id === pend);
      n.g.setAttribute('aria-label', (n.id === cur ? 'Stop ' : 'Play ') + hooks.name(n.id));
    });
    // The panel follows the playing rhythm and stays on the last one after it stops.
    if (cur && cur !== panelId) buildPanel(cur);
    // The selected rhythm's map cluster stays in full colour; every other node, and links outside it, fade (10% normally, 50% when Highlight family is on).
    const fam = panelId == null ? null : clusterOf[panelId], inFam = (id) => fam == null || id === panelId || clusterOf[id] === fam;
    svg.classList.toggle('map-highlight-family', highlightFamily && fam != null);
    nodes.forEach((n) => n.g.classList.toggle('map-node-dim', !inFam(n.id)));
    links.forEach((l) => l.line.classList.toggle('map-link-dim', highlightFamily ? (!inFam(l.a.id) || !inFam(l.b.id)) : (!inFam(l.a.id) && !inFam(l.b.id))));
    clusterMeta.forEach((f) => { if (f.el) f.el.classList.toggle('map-family-dim', fam != null && f.idx !== fam); });
    // Keep highlighted family members above dimmed nodes, and queued/selected/playing nodes on top of everything.
    if (highlightFamily && fam != null) {
      const active = document.activeElement;
      nodes.forEach((n) => { if (inFam(n.id) && n.id !== pend && n.id !== panelId && n.id !== cur) gNodes.appendChild(n.g); });
      if (active && active.parentNode === gNodes) active.focus({ preventScroll: true });
    }
    [pend, panelId, cur].forEach((id) => {
      const n = id && nodes.find((x) => x.id === id);
      if (n && gNodes.lastElementChild !== n.g) {
        const hadFocus = document.activeElement === n.g;
        gNodes.appendChild(n.g);
        if (hadFocus) n.g.focus({ preventScroll: true });
      }
    });
    // Search: everything that does not match fades (still tappable); a link stays lit if either end matches.
    const hit = (id) => !filter || filter.has(id);
    nodes.forEach((n) => n.g.classList.toggle('map-node-miss', !hit(n.id)));
    links.forEach((l) => l.line.classList.toggle('map-link-miss', !hit(l.a.id) && !hit(l.b.id)));
    clusterMeta.forEach((f) => { if (f.el) f.el.classList.toggle('map-family-miss', !!filter && !f.ids.some(hit)); });
    const show = !host.hidden && !!panelId;
    panel.hidden = !show;
    document.body.classList.toggle('map-has-panel', show);
    paintPanelChrome();
    render();
  }

  // The map leaves room for the panel at whatever size it is (full, collapsed, phone or desktop).
  function trackPanelSize() {
    const set = () => { const r = panel.getBoundingClientRect(); document.documentElement.style.setProperty('--panel-h', r.height + 'px'); document.documentElement.style.setProperty('--panel-w', r.width + 'px'); };
    if (window.ResizeObserver) new ResizeObserver(() => requestAnimationFrame(set)).observe(panel);
    const onWide = () => { paintPanelChrome(); famCacheKey = ''; queueRender(); };
    wide.addEventListener ? wide.addEventListener('change', onWide) : wide.addListener(onWide);
  }

  return {
    init(h) { hooks = h; },
    show() { if (!svg) { build(); trackPanelSize(); } host.hidden = false; resize(); paint(); },
    hide() { if (!host) return; host.hidden = true; if (panel) panel.hidden = true; document.body.classList.remove('map-has-panel'); },
    paint, step, focus,
    selected: () => panelId,
    clusterLabel(id) {
      if (!clusterMeta.length && hooks) indexGroups(hooks.ids().filter((x) => (RX.PATTERN_MAP || {})[x]));
      const c = clusterOf[id];
      return c != null && clusterMeta[c] ? clusterMeta[c].name : '';
    },
    /** Search filter: a Set of matching ids (others dim) or null to clear. */
    setFilter(ids) { filter = ids; if (svg) paint(); },
  };
})();

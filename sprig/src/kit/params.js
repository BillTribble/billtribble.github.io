// Pure JS version of src/kit/params.ts for standalone browser ES modules.

function hexToRgb(h, out, scale = 1) {
  const n = parseInt(h.slice(1), 16);
  out[0] = ((n >> 16) & 255) * scale;
  out[1] = ((n >> 8) & 255) * scale;
  out[2] = (n & 255) * scale;
}

function rgbToHex(r, g, b) {
  const c = (v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}

function easeInOut(t) {
  return t * t * (3 - 2 * t);
}

function decimalsOf(step) {
  const s = String(step ?? 1);
  return s.includes('e-') ? Number(s.split('e-')[1]) : (s.split('.')[1] || '').length;
}

function roundTo(v, d) {
  return Number(Number(v).toFixed(d));
}

function writeDerived(p) {
  if (p.type === 'color') hexToRgb(String(p.value), p.rgb, 1 / 255);
}

function coerce(p, v) {
  if (p.type === 'bool') return !!v;
  if (p.type === 'color') return typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : p.value;
  if (p.type === 'select') return typeof v === 'string' && p.options.includes(v) ? v : p.value;
  const n = Number(v);
  return Number.isFinite(n) ? roundTo(n, p.decimals) : p.value;
}

export function createModel(schema, storageKey = null, presets = {}) {
  const params = [];
  const byKey = Object.create(null);
  const groups = [];
  let version = 0;

  for (const g of schema) {
    const live = [];
    for (const def of g.params) {
      if (byKey[def.key]) throw new Error('Duplicate param key: ' + def.key);
      const type = def.type || 'range';
      const p = {
        ...def,
        type,
        group: g.group,
        default: def.value,
        base: def.value,
        decimals: type === 'range' ? decimalsOf(def.step) : 0,
        rgb: new Float32Array(3),
        parent: null,
        depth: 0,
        codeMin: def.min,
        codeMax: def.max,
      };
      if (def.when) {
        const parent = live.find((q) => q.key === def.when.key);
        if (parent) {
          p.parent = parent;
          p.depth = parent.depth + 1;
        }
      }
      writeDerived(p);
      params.push(p);
      live.push(p);
      byKey[p.key] = p;
    }
    groups.push({ group: g.group, params: live });
  }

  let preset = '';
  let glides = [];
  let glideT = 0;
  let glideLen = 0;

  function assign(p, v) {
    p.value = coerce(p, v);
    writeDerived(p);
    version++;
  }

  const store = {
    params,
    byKey,
    groups,
    get version() {
      return version;
    },
    setValue(p, v) {
      if (glides.length) glides = glides.filter((g) => g.p !== p);
      assign(p, v);
    },
    get preset() {
      return preset;
    },
    applyValues(values, seconds, glideNumbers = false, glideScale = true) {
      if (!values) return;
      for (const k in values) {
        if (byKey[k]) byKey[k].base = coerce(byKey[k], values[k]);
      }
      glides = [];
      for (const key in values) {
        const p = byKey[key];
        if (!p) continue;
        const to = coerce(p, values[key]);
        const shouldGlideNum = glideNumbers || (glideScale && key === 'scale');
        if (seconds <= 0 || p.type === 'select' || p.type === 'bool' || (p.type !== 'color' && !shouldGlideNum)) {
          assign(p, to);
          continue;
        }
        if (p.type === 'color') {
          const a = [0, 0, 0];
          const b = [0, 0, 0];
          hexToRgb(String(p.value), a);
          hexToRgb(String(to), b);
          glides.push({ p, from: 0, to: 1, rgbFrom: a, rgbTo: b });
        } else {
          glides.push({ p, from: Number(p.value), to: Number(to) });
        }
      }
      glideT = 0;
      glideLen = Math.max(seconds, 1e-3);
    },
    applyPreset(name, seconds, glideNumbers = false) {
      const values = presets?.[name];
      if (!values) return;
      preset = name;
      store.applyValues(values, seconds, glideNumbers, false);
    },
    tick(dt) {
      if (!glides.length) return 'idle';
      glideT = Math.min(glideLen, glideT + dt);
      const k = easeInOut(glideT / glideLen);
      for (const g of glides) {
        if (g.rgbFrom && g.rgbTo) {
          const a = g.rgbFrom;
          const b = g.rgbTo;
          assign(g.p, rgbToHex(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k));
        } else {
          assign(g.p, g.from + (g.to - g.from) * k);
        }
      }
      if (glideT < glideLen) return 'moving';
      glides = [];
      return 'done';
    },
  };

  return store;
}

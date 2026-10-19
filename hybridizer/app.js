// 2D Sprig Hybridization Cycle Visualizer
// Uses Jack Bush's unmodified 2D Sprig engine (shapes.js, shaders.js, knobs.js, layouts.js,
// params.js, pace.js, util.js, sketch.js) across three isolated WebGL2 slots: Left, Middle, Right.

import schema, { presets } from './src/sketches/sprig/params.js';
import * as SH from './src/sketches/sprig/shaders.js';
import createSketch0 from './src/sketches/slot0/sketch.js';
import createSketch1 from './src/sketches/slot1/sketch.js';
import createSketch2 from './src/sketches/slot2/sketch.js';
import { createModel } from './src/kit/params.js';
import { rng } from './src/kit/random.js';
import { FULLSCREEN_VERT, paramDecls, program, shaderParams, uploadParams } from './src/kit/gl.js';
import { BIOMES } from './biomes.js';

let currentBiomeKey = (() => {
  try {
    const q = new URLSearchParams(window.location.search).get('biome')?.toLowerCase();
    if (q && BIOMES[q]) return q;
  } catch (_) {}
  return 'tropical';
})();

function getActiveBiome() {
  return BIOMES[currentBiomeKey] || BIOMES.tropical;
}

// Turn 'Oak, English' -> 'English oak', "Cherry, Japanese 'Kanzan'" -> "Japanese cherry 'Kanzan'"
export function spokenName(name) {
  const m = /^([^,]+), ([^']+?)( '.*')?$/.exec(name);
  return m ? m[2] + ' ' + m[1].toLowerCase() + (m[3] || '') : name;
}

// Trait groups for botanical hybridization
const LEAF_BLADE_KEYS = [
  'compound', 'leaflets', 'leafletAngle', 'leafletFlop',
  'outline', 'width', 'base', 'apex', 'bend', 'sCurve',
  'lobing', 'lobeDepth', 'lobeSharpness', 'lobes',
  'petioleLength', 'petioleFlat', 'petioleWing', 'stipules',
];

const LEAF_SURFACE_KEYS = [
  'margin', 'teeth', 'toothDepth',
  'venation', 'veinCount', 'veinAngle', 'veinCurve', 'veinlets',
  'veinWeight', 'midribWeight', 'stomata', 'stomataBands', 'ridge',
];

const STEM_KEYS = [
  'arrangement', 'divergence', 'foreshorten', 'perNode', 'bundleSpread', 'sheath',
  'decussate', 'whorlCount', 'nodes', 'internode', 'internodeTaper', 'bareStem',
  'insertion', 'tipInsertion', 'baseShrink', 'sizeGradient',
  'stemWidth', 'stemTaper', 'stemCurve', 'stemDroop', 'zigzag', 'stemWander',
  'frontReach', 'spreadOut', 'thorns', 'thornAngle', 'thornPairs', 'pegs',
  'spurs', 'spurEvery', 'spurLeaves', 'spurFan', 'spurLength', 'spurAngle',
  'sideShoots', 'sideEvery', 'sideLength', 'sideAngle', 'sideNodes', 'leaderScales',
  'terminal', 'budType', 'budSize', 'budStem', 'stemTexture', 'stemShading', 'stemFade',
  'leafVariety',
];

const FRUIT_KEYS = [
  'fruit', 'fruitNodes', 'fruitEvery', 'fruitTip', 'fruitForm', 'fruitAxis',
  'fruitRays', 'fruitRaySpread', 'fruitTaper', 'fruitPairs', 'fruitCount',
  'fruitSize', 'fruitLength', 'fruitBudScales', 'fruitPeduncle', 'fruitBract',
  'fruitStalk', 'fruitHang', 'fruitSpread', 'fruitCurve', 'fruitAsym',
  'fruitSeeds', 'fruitCup', 'fruitSpines', 'fruitSpineCount', 'fruitCut',
  'fruitKernels', 'fruitConeRows', 'fruitNutShow', 'fruitGloss',
  'fruitHighlightOpacity', 'fruitColour', 'fruitShade', 'seedColour',
  'seedShade', 'seedScar', 'fruitFlesh', 'bractColour',
];

const FLOWER_KEYS = [
  'flower', 'flowerNodes', 'flowerEvery', 'flowerTip', 'flowerForm', 'flowerAxis',
  'flowerRays', 'flowerRaySpread', 'flowerTaper', 'flowerPairs', 'flowerCount',
  'flowerSize', 'flowerLength', 'flowerBudScales', 'flowerPeduncle', 'flowerBract',
  'flowerStalk', 'flowerHang', 'flowerSpread', 'flowerCurve', 'flowerPetals',
  'flowerNotch', 'flowerRings', 'flowerViews', 'flowerStamens', 'flowerFlare',
  'flowerColour', 'flowerShade', 'flowerCentre',
];

function hexToRgbArr(hex) {
  const h = String(hex || '#000000').replace('#', '');
  const n = parseInt(h, 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixHex(hexA, hexB, t) {
  const a = hexToRgbArr(hexA);
  const b = hexToRgbArr(hexB);
  const c = (i) => Math.round(Math.max(0, Math.min(255, a[i] + (b[i] - a[i]) * t))).toString(16).padStart(2, '0');
  return '#' + c(0) + c(1) + c(2);
}

function lerpNum(a, b, t) {
  return Number(a) + (Number(b) - Number(a)) * t;
}

function roman(n) {
  const numerals = [
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let rem = Math.max(1, n | 0);
  let out = '';
  for (const [val, sym] of numerals) {
    while (rem >= val) {
      out += sym;
      rem -= val;
    }
  }
  return out;
}

/**
 * Create a specimen descriptor from a preset name in the active biome.
 */
function makePresetSpecimen(name, seedVal) {
  const biome = getActiveBiome();
  const pool = biome.presets;
  const baseVals = { ...(pool[name] || presets[name]) };
  baseVals.biomeMode = biome.biomeMode;
  baseVals.seed = seedVal;
  baseVals.scale = 0.82;
  baseVals.sway = biome.id === 'alien' ? 0.24 : 0.14;
  baseVals.swaySpeed = biome.id === 'alien' ? 0.075 : 0.045;
  baseVals.presetLabel = false;
  const sp = spokenName(name);
  return {
    id: name,
    name: sp,
    shortName: sp,
    subtitle: describePresetTraits(baseVals),
    isHybrid: false,
    generation: 0,
    values: baseVals,
  };
}

function describePresetTraits(v) {
  const parts = [];
  if (v.compound && v.compound !== 'Simple') {
    parts.push(`${v.compound.toLowerCase()} (${v.leaflets} leaflets)`);
  } else if (v.lobing && v.lobing !== 'Unlobed') {
    parts.push(v.lobing.toLowerCase());
  } else if (v.outline) {
    parts.push(`${v.outline.toLowerCase()} blade`);
  }
  if (v.arrangement && v.arrangement !== 'No stem') {
    parts.push(`${v.arrangement.toLowerCase()} shoot`);
  }
  if (v.fruit && v.fruit !== 'None') {
    parts.push(v.fruit.toLowerCase() + 's');
  }
  if (v.flower && v.flower !== 'None') {
    parts.push(v.flower === 'Catkin' ? 'catkins' : 'blossom');
  }
  return parts.join(' · ');
}

/**
 * Combine Left (specA) and Right (specB) into a botanical Hybrid specimen.
 * Combines leaf blade/foliage architecture from one parent with shoot/stem architecture
 * from the other, blends continuous proportions & watercolour washes, and inherits fruits/flowers.
 */
function createHybridSpecimen(specA, specB, generation, seedVal) {
  const A = specA.values;
  const B = specB.values;

  // Alternate primary leaf vs stem donor across generations so new right-hand parents
  // contribute both foliage and shoot architecture as generations progress.
  const leafFromA = (generation % 2) === 1;
  const leafDonor = leafFromA ? A : B;
  const stemDonor = leafFromA ? B : A;
  const leafDonorName = leafFromA ? specA.shortName : specB.shortName;
  const stemDonorName = leafFromA ? specB.shortName : specA.shortName;

  const H = { ...stemDonor, scale: 0.82 };

  // 1. Copy primary leaf blade architecture from leafDonor
  for (const k of LEAF_BLADE_KEYS) {
    H[k] = leafDonor[k];
  }

  // 2. Copy surface/margin/venation from leafDonor, with secondary crossover from stemDonor
  for (const k of LEAF_SURFACE_KEYS) {
    H[k] = leafDonor[k];
  }
  // If leafDonor has an 'Entire' smooth margin and stemDonor has teeth/spines, inherit stemDonor's margin!
  if (leafDonor.margin === 'Entire' && stemDonor.margin !== 'Entire') {
    H.margin = stemDonor.margin;
    H.teeth = Math.round(lerpNum(leafDonor.teeth, stemDonor.teeth, 0.7));
    H.toothDepth = Number(lerpNum(leafDonor.toothDepth, stemDonor.toothDepth, 0.65).toFixed(3));
  } else if (leafDonor.margin !== 'Entire' && stemDonor.margin !== 'Entire') {
    H.teeth = Math.round(lerpNum(leafDonor.teeth, stemDonor.teeth, 0.4));
    H.toothDepth = Number(lerpNum(leafDonor.toothDepth, stemDonor.toothDepth, 0.4).toFixed(3));
  }

  // If leafDonor is Unlobed and Simple, and stemDonor is lobed, infuse partial lobing
  if (H.compound === 'Simple' && leafDonor.lobing === 'Unlobed' && stemDonor.lobing !== 'Unlobed') {
    H.lobing = stemDonor.lobing;
    H.lobeDepth = Number((stemDonor.lobeDepth * 0.58).toFixed(2));
    H.lobeSharpness = Number(lerpNum(leafDonor.lobeSharpness, stemDonor.lobeSharpness, 0.6).toFixed(2));
    H.lobes = stemDonor.lobes;
  }

  // Blend continuous leaf geometry parameters (65% leafDonor, 35% stemDonor)
  H.width = Number(lerpNum(leafDonor.width, stemDonor.width, 0.32).toFixed(2));
  H.bend = Number(lerpNum(leafDonor.bend, stemDonor.bend, 0.35).toFixed(2));
  H.sCurve = Number(lerpNum(leafDonor.sCurve, stemDonor.sCurve, 0.35).toFixed(2));
  H.veinCount = Math.max(3, Math.round(lerpNum(leafDonor.veinCount, stemDonor.veinCount, 0.35)));
  H.veinAngle = Math.round(lerpNum(leafDonor.veinAngle, stemDonor.veinAngle, 0.35));
  H.veinCurve = Number(lerpNum(leafDonor.veinCurve, stemDonor.veinCurve, 0.35).toFixed(2));
  H.petioleLength = Number(lerpNum(leafDonor.petioleLength, stemDonor.petioleLength, 0.35).toFixed(2));

  // 3. Copy stem architecture from stemDonor, with continuous blend toward leafDonor
  for (const k of STEM_KEYS) {
    H[k] = stemDonor[k];
  }
  H.stemCurve = Number(lerpNum(stemDonor.stemCurve, leafDonor.stemCurve, 0.35).toFixed(2));
  H.stemDroop = Number(lerpNum(stemDonor.stemDroop, leafDonor.stemDroop, 0.35).toFixed(2));
  H.zigzag = Number(( Math.round(lerpNum(stemDonor.zigzag, leafDonor.zigzag, 0.3) * 2) / 2 ).toFixed(1));
  H.insertion = Math.round(lerpNum(stemDonor.insertion, leafDonor.insertion, 0.35));
  H.tipInsertion = Math.round(lerpNum(stemDonor.tipInsertion, leafDonor.tipInsertion, 0.35));

  // Inherit thorns if either parent has thorns (scaled slightly if only one parent has them)
  if (stemDonor.thorns > 0 || leafDonor.thorns > 0) {
    const tDonor = stemDonor.thorns >= leafDonor.thorns ? stemDonor : leafDonor;
    H.thorns = Number((Math.max(stemDonor.thorns, leafDonor.thorns) * (stemDonor.thorns > 0 && leafDonor.thorns > 0 ? 1 : 0.75)).toFixed(2));
    H.thornAngle = tDonor.thornAngle;
    H.thornPairs = tDonor.thornPairs;
  }

  // 4. Reconcile broadleaf vs conifer node density so hybrid proportions look like a real botanical plate
  const isNeedleLeaf = H.outline === 'Needle';
  if (!isNeedleLeaf && H.leaderScales < 0.3) {
    // Broadleaf or compound leaf on a stem: keep node count in natural broadleaf range (4..9)
    // and avoid conifer-dense needle spacing or 30-leaf rosettes of giant broadleaves.
    if (H.nodes > 10) {
      const refNodes = leafDonor.outline !== 'Needle' ? leafDonor.nodes : 6;
      H.nodes = Math.min(9, Math.max(4, Math.round(lerpNum(refNodes, 8, 0.5))));
    }
    if (H.internode < 0.26) {
      H.internode = Number(Math.max(0.28, leafDonor.internode || 0.38).toFixed(2));
    }
    if (H.bareStem < 0.2) {
      H.bareStem = Number(Math.max(0.22, leafDonor.bareStem || 0.3).toFixed(2));
    }
    if (H.spurs > 0 && H.spurLeaves > 6) {
      H.spurLeaves = Math.min(5, Math.max(3, Math.round(H.spurLeaves * 0.22)));
    }
    if (H.sideShoots > 0 && H.sideNodes > 5) {
      H.sideNodes = 4;
      H.sideLength = Math.min(1.4, H.sideLength);
    }
    if (H.perNode > 2) {
      H.perNode = 2;
    }
  } else if (isNeedleLeaf) {
    // Needled leaf on a broadleaf stem: ensure enough nodes so it looks like a proper shoot
    if (H.nodes < 14 && H.spurs === 0 && H.sideShoots === 0) {
      H.nodes = Math.max(16, Math.round(lerpNum(stemDonor.nodes, leafDonor.nodes, 0.55)));
      H.internode = Number(Math.min(0.18, lerpNum(stemDonor.internode, leafDonor.internode, 0.65)).toFixed(2));
    }
  }

  // 5. Fruit & Flowers inheritance
  // Prefer active fruit/flowers so hybrids are rich botanical specimens
  const aHasFruit = A.fruit && A.fruit !== 'None';
  const bHasFruit = B.fruit && B.fruit !== 'None';
  let fruitDonor = null;
  let fruitDonorLabel = '';
  if (aHasFruit && bHasFruit) {
    // Pick fruit from stemDonor (or alternate) and blend colours
    fruitDonor = leafFromA ? B : A;
    fruitDonorLabel = leafFromA ? specB.shortName : specA.shortName;
  } else if (aHasFruit) {
    fruitDonor = A;
    fruitDonorLabel = specA.shortName;
  } else if (bHasFruit) {
    fruitDonor = B;
    fruitDonorLabel = specB.shortName;
  }

  if (fruitDonor) {
    for (const k of FRUIT_KEYS) H[k] = fruitDonor[k];
    if (aHasFruit && bHasFruit) {
      const otherFruit = fruitDonor === A ? B : A;
      H.fruitColour = mixHex(fruitDonor.fruitColour, otherFruit.fruitColour, 0.35);
      H.fruitShade = mixHex(fruitDonor.fruitShade, otherFruit.fruitShade, 0.35);
      H.fruitSize = Number(lerpNum(fruitDonor.fruitSize, otherFruit.fruitSize, 0.25).toFixed(3));
    }
    H.fruitNodes = Math.min(H.fruitNodes, Math.max(1, H.nodes - 1));
  } else {
    H.fruit = 'None';
  }

  const aHasFlower = A.flower && A.flower !== 'None';
  const bHasFlower = B.flower && B.flower !== 'None';
  let flowerDonor = null;
  let flowerDonorLabel = '';
  if (aHasFlower && bHasFlower) {
    flowerDonor = leafFromA ? A : B;
    flowerDonorLabel = leafFromA ? specA.shortName : specB.shortName;
  } else if (aHasFlower) {
    flowerDonor = A;
    flowerDonorLabel = specA.shortName;
  } else if (bHasFlower) {
    flowerDonor = B;
    flowerDonorLabel = specB.shortName;
  }

  if (flowerDonor) {
    for (const k of FLOWER_KEYS) H[k] = flowerDonor[k];
    if (aHasFlower && bHasFlower) {
      const otherFlower = flowerDonor === A ? B : A;
      H.flowerColour = mixHex(flowerDonor.flowerColour, otherFlower.flowerColour, 0.35);
      H.flowerShade = mixHex(flowerDonor.flowerShade, otherFlower.flowerShade, 0.35);
    }
    H.flowerNodes = Math.min(H.flowerNodes, Math.max(1, H.nodes - 1));
  } else {
    H.flower = 'None';
  }

  // 6. Blended watercolour pigmentation between Left and Right
  H.leafWash = mixHex(leafDonor.leafWash, stemDonor.leafWash, 0.42);
  H.leafShade = mixHex(leafDonor.leafShade, stemDonor.leafShade, 0.42);
  H.stemWash = mixHex(stemDonor.stemWash, leafDonor.stemWash, 0.35);
  H.budColour = mixHex(stemDonor.budColour, leafDonor.budColour, 0.35);
  H.budShade = mixHex(stemDonor.budShade, leafDonor.budShade, 0.35);
  if (leafDonor.accentColour || stemDonor.accentColour) {
    H.accentColour = mixHex(leafDonor.accentColour || '#ff2a85', stemDonor.accentColour || '#00f5d4', 0.45);
  }
  if (leafDonor.stomataColour || stemDonor.stomataColour) {
    H.stomataColour = mixHex(leafDonor.stomataColour || '#e6ece6', stemDonor.stomataColour || '#e6ece6', 0.45);
  }
  H.biomeMode = getActiveBiome().biomeMode;
  H.washDensity = Number(lerpNum(leafDonor.washDensity ?? 0.78, stemDonor.washDensity ?? 0.78, 0.5).toFixed(2));
  H.bloom = Number(lerpNum(leafDonor.bloom ?? 0.5, stemDonor.bloom ?? 0.5, 0.5).toFixed(2));

  H.seed = seedVal;
  
  H.sway = getActiveBiome().id === 'alien' ? 0.24 : 0.14;
  H.swaySpeed = getActiveBiome().id === 'alien' ? 0.075 : 0.045;
  H.presetLabel = false;

  const genTag = `Hybrid ${roman(generation)}`;
  const fullName = `${specA.shortName} × ${specB.shortName}`;
  const traitNotes = [
    `${leafDonorName} foliage`,
    `${stemDonorName} ${H.arrangement.toLowerCase()} shoot`,
  ];
  if (fruitDonor) traitNotes.push(`${fruitDonorLabel} ${H.fruit.toLowerCase()}s`);
  if (flowerDonor) traitNotes.push(`${flowerDonorLabel} ${H.flower === 'Catkin' ? 'catkins' : 'blossom'}`);

  return {
    id: `hybrid-${generation}`,
    name: `${genTag} · ${fullName}`,
    shortName: genTag,
    lineage: fullName,
    subtitle: traitNotes.join(' · '),
    isHybrid: true,
    generation,
    values: H,
  };
}

/**
 * Derive a nascent seedling parameter state from an adult specimen's values.
 * Keeps `compound` and spacing keys identical and `nodes` at ~48% of adult so
 * `sketch.js`'s `beginMorph()` runs a single-phase continuous organic growth (`twoPhase = false`)
 * without any midpoint leaf disappearance or order pop.
 */
function makeSeedlingValues(adult) {
  const S = { ...adult };
  S.scale = 0.24;
  S.nodes = Math.max(1.5, Number((adult.nodes * 0.55).toFixed(2)));
  S.internode = Number(Math.max(0.04, adult.internode * 0.45).toFixed(3));
  S.bareStem = Number(Math.max(0.03, adult.bareStem * 0.45).toFixed(3));
  S.stemWidth = Number(Math.max(0.002, adult.stemWidth * 0.5).toFixed(4));
  S.stemCurve = Number((adult.stemCurve * 0.35).toFixed(2));
  S.stemDroop = Number((adult.stemDroop * 0.3).toFixed(2));
  S.width = Number(Math.max(0.25, adult.width * 0.55).toFixed(2));
  S.lobeDepth = Number((adult.lobeDepth * 0.4).toFixed(2));
  S.petioleLength = Number((adult.petioleLength * 0.45).toFixed(2));
  S.budSize = Number(Math.max(0.02, adult.budSize * 0.45).toFixed(3));
  if (adult.spurs > 0) S.spurs = Number((adult.spurs * 0.85).toFixed(2));
  if (adult.sideShoots > 0) S.sideShoots = Number((adult.sideShoots * 0.85).toFixed(2));
  // Fruits and flowers bud out during growth from 'None' -> adult type
  S.fruit = 'None';
  S.flower = 'None';
  return S;
}

/**
 * Full-viewport background canvas that draws Jack Bush's exact WebGL2 warm paper grain shader
 * (`SH.background`) so that empty slots and fade/slide transitions sit over continuous warm paper.
 */
function initPaperBackdrop(canvas) {
  const gl = canvas.getContext('webgl2', {
    alpha: false, antialias: false, depth: false, stencil: false,
    premultipliedAlpha: false, preserveDrawingBuffer: true,
  });
  if (!gl) return null;

  const model = createModel(schema, null, presets);
  const uniformParams = shaderParams(model.params);
  const header = '#version 300 es\nprecision highp float;\nprecision highp int;\nprecision highp sampler2D;\n'
    + 'uniform vec2 f_view;\nuniform float f_px;\n'
    + paramDecls(uniformParams);
  const prog = program(gl, FULLSCREEN_VERT, header + SH.background, 'paper-backdrop');
  const loc = (n) => gl.getUniformLocation(prog, n);
  const fViewLoc = loc('f_view');
  const fPxLoc = loc('f_px');
  const paramLocs = uniformParams.map((p) => loc('u_' + p.key));

  // Build identical tileable value-noise texture as sketch.js
  const S = 256;
  const data = new Uint8Array(S * S * 4);
  const lat = new Float32Array(S * S);
  const r = rng(12.34);
  for (let i = 0; i < lat.length; i++) lat[i] = r();
  const vn = (x, y, per) => {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const x0 = ((ix % per) + per) % per, x1 = (x0 + 1) % per;
    const y0 = ((iy % per) + per) % per, y1 = (y0 + 1) % per;
    const a = lat[y0 * S + x0], b = lat[y0 * S + x1], c = lat[y1 * S + x0], d = lat[y1 * S + x1];
    return (a + (b - a) * ux) * (1 - uy) + (c + (d - c) * ux) * uy;
  };
  const fbm = (u, v, base, oct) => {
    let s = 0, amp = 0.5, tot = 0, f = base;
    for (let o = 0; o < oct; o++) { s += amp * vn(u * f, v * f, f); tot += amp; amp *= 0.5; f *= 2; }
    return s / tot;
  };
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const o = (y * S + x) * 4;
      data[o] = Math.round(255 * fbm(x / S, y / S, 8, 4));
      data[o + 1] = Math.round(255 * fbm(x / S, y / S, 4, 3));
      data[o + 3] = 255;
    }
  }
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, S, S, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.generateMipmap(gl.TEXTURE_2D);

  const vao = gl.createVertexArray();
  let lastW = 0, lastH = 0;

  function draw() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.clientWidth || window.innerWidth;
    const ch = canvas.clientHeight || window.innerHeight;
    const w = Math.max(1, Math.round(cw * dpr));
    const h = Math.max(1, Math.round(ch * dpr));
    if (w === lastW && h === lastH) return;
    lastW = w;
    lastH = h;
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.useProgram(prog);
    gl.uniform1i(loc('u_noise'), 0);
    gl.uniform2f(fViewLoc, cw, ch);
    gl.uniform1f(fPxLoc, dpr);
    uploadParams(gl, paramLocs, uniformParams);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  draw();
  window.addEventListener('resize', draw);
  return { draw };
}

/**
 * Create one of the 3 Sprig slots (Left = 0, Middle = 1, Right = 2).
 */
function createSlot(index, createSketchFn, slotEl) {
  const stageEl = slotEl.querySelector('.slot-stage');
  const canvas = slotEl.querySelector('canvas');
  const titleEl = slotEl.querySelector('.slot-title');
  const subEl = slotEl.querySelector('.slot-sub');
  const roleEl = slotEl.querySelector('.slot-role');

  const store = createModel(schema, null, presets);
  const P = store.byKey;
  P.presetLabel.value = false;
  P.sway.value = 0.14;
  P.swaySpeed.value = 0.045;

  const instance = createSketchFn({
    canvas,
    P,
    model: store,
    degrade: () => {},
  });

  let lastW = 0, lastH = 0, lastRatio = 0;
  let currentSpecimen = null;

  // 3D rotation & interactive drag state
  let rotY = 0;
  let rotX = 0;
  let velY = 0;
  let velX = 0;
  let isDragging = false;
  let lastDragX = 0;
  let lastDragY = 0;
  const AMBIENT_SPEED = 0.14; // rad/s slow continuous rotation around botanical axis

  // Setup pointer/touch drag event listeners
  slotEl.addEventListener('pointerdown', (e) => {
    isDragging = true;
    slotEl.setPointerCapture(e.pointerId);
    lastDragX = e.clientX;
    lastDragY = e.clientY;
    velY = 0;
    velX = 0;
  });

  slotEl.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastDragX;
    const dy = e.clientY - lastDragY;
    lastDragX = e.clientX;
    lastDragY = e.clientY;

    rotY += dx * 0.012;
    rotX = Math.max(-0.55, Math.min(0.55, rotX - dy * 0.01));
    velY = dx * 0.012;
    velX = -dy * 0.01;
  });

  const onPointerUp = (e) => {
    if (isDragging) {
      isDragging = false;
      try {
        slotEl.releasePointerCapture(e.pointerId);
      } catch (err) {
        // pointer capture already lost
      }
    }
  };
  slotEl.addEventListener('pointerup', onPointerUp);
  slotEl.addEventListener('pointercancel', onPointerUp);

  function resizeIfNeeded() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = slotEl.clientWidth || canvas.clientWidth || Math.round(window.innerWidth / 3);
    const ch = slotEl.clientHeight || canvas.clientHeight || window.innerHeight;
    const w = Math.max(1, Math.round(cw * dpr));
    const h = Math.max(1, Math.round(ch * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const px = cw > 0 ? w / cw : 1;
    if (w !== lastW || h !== lastH || px !== lastRatio) {
      lastW = w;
      lastH = h;
      lastRatio = px;
      instance.resize(w, h, px);
    }
  }

  function setLabels(spec, roleText) {
    if (roleEl) roleEl.textContent = roleText || '';
    if (titleEl) titleEl.textContent = spec ? spec.name : '';
    if (subEl) subEl.textContent = spec ? (spec.subtitle || '') : '';
  }

  /**
   * Start growing `specimen` from a nascent seedling over `seconds`.
   */
  function startGrow(specimen, seconds, roleText, sceneTime, realTime) {
    currentSpecimen = specimen;
    setLabels(specimen, roleText);

    // 1. Snap immediately to the seedling state and render one initialization frame
    const seedling = makeSeedlingValues(specimen.values);
    store.applyValues(seedling, 0, false, false);
    instance.morph(0, '');
    resizeIfNeeded();
    instance.frame(sceneTime, 0.016, realTime, 0.016);

    // 2. Begin synchronized one-clock morph to the full adult specimen
    store.applyValues(specimen.values, seconds, false, true);
    instance.morph(seconds, '');

    stageEl.style.transition = 'opacity 420ms ease, transform 0s';
    stageEl.style.transform = 'translate3d(0, 0, 0)';
    stageEl.style.opacity = '1';
    slotEl.dataset.active = 'true';
  }

  /**
   * Snap immediately to full adult `specimen` (used when Left slot receives the shifted Middle hybrid).
   */
  function snapAdult(specimen, roleText, sceneTime, realTime, fromSlot = null) {
    currentSpecimen = specimen;
    setLabels(specimen, roleText);
    if (fromSlot && typeof fromSlot.getRotation === 'function') {
      const r = fromSlot.getRotation();
      rotY = r.rotY;
      rotX = r.rotX;
      velY = r.velY;
      velX = r.velX;
    }
    if (instance.setRotation3D) {
      instance.setRotation3D(rotY, rotX);
    }
    const degY = Math.sin(rotY) * 20;
    const degX = (rotX * 180 / Math.PI);
    canvas.style.transform = `perspective(900px) rotateY(${degY.toFixed(2)}deg) rotateX(${degX.toFixed(2)}deg)`;
    canvas.style.transformOrigin = 'center 50%';
    store.applyValues(specimen.values, 0, false, false);
    instance.morph(0, '');
    resizeIfNeeded();
    instance.frame(sceneTime, 0.016, realTime, 0.016);
    slotEl.style.zIndex = '';
    stageEl.style.transition = 'none';
    stageEl.style.transform = 'none';
    stageEl.style.opacity = '1';
    slotEl.dataset.active = 'true';
  }

  /**
   * Hide the slot immediately or with a fade.
   */
  function clearSlot(immediate = false) {
    currentSpecimen = null;
    slotEl.dataset.active = 'false';
    slotEl.style.zIndex = '';
    if (immediate) {
      stageEl.style.transition = 'none';
      stageEl.style.transform = 'none';
      stageEl.style.opacity = '0';
    } else {
      stageEl.style.transition = 'opacity 420ms ease';
      stageEl.style.opacity = '0';
    }
  }

  function frame(sceneTime, sdt, realTime, dt) {
    store.tick(dt);
    resizeIfNeeded();

    // 3D rotation animation & inertia
    if (!isDragging) {
      rotY += AMBIENT_SPEED * dt + velY;
      velY *= 0.93; // damping
      rotX += velX;
      velX *= 0.93;
      rotX *= 0.97; // gentle return to neutral upright pitch
    }

    // Pass 3D rotation into Jack's sprig engine for per-leaf 3D phyllotactic revolution & foreshortening,
    // plus a bounded 3D perspective tilt on the canvas so it never turns edge-on into a 1px line.
    if (instance.setRotation3D) {
      instance.setRotation3D(rotY, rotX);
    }
    const degY = Math.sin(rotY) * 20;
    const degX = (rotX * 180 / Math.PI);
    canvas.style.transform = `perspective(900px) rotateY(${degY.toFixed(2)}deg) rotateX(${degX.toFixed(2)}deg)`;
    canvas.style.transformOrigin = 'center 50%';

    instance.frame(sceneTime, sdt, realTime, dt);
  }

  return {
    index,
    slotEl,
    stageEl,
    canvas,
    store,
    instance,
    get specimen() {
      return currentSpecimen;
    },
    getRotation() {
      return { rotY, rotX, velY, velX };
    },
    startGrow,
    snapAdult,
    clearSlot,
    frame,
  };
}

// ---- Main Cycle Controller ----

const GROW_PARENTS_SECS = 3.0;
const GROW_RIGHT_SECS = 2.8;
const GROW_HYBRID_SECS = 3.0;
const HOLD_TIME = 3.0;
const PAUSE_HOLD_SECS = HOLD_TIME;
const SHIFT_LEFT_SECS = 1.15;

export function boot() {
  const paperCanvas = document.getElementById('paper-backdrop');
  initPaperBackdrop(paperCanvas);

  const slotLeft = createSlot(0, createSketch0, document.getElementById('slot-left'));
  const slotMid = createSlot(1, createSketch1, document.getElementById('slot-mid'));
  const slotRight = createSlot(2, createSketch2, document.getElementById('slot-right'));
  const slots = [slotLeft, slotMid, slotRight];

  const statusPhaseEl = document.getElementById('cycle-phase');
  const statusGenEl = document.getElementById('cycle-gen');
  const statusTimerEl = document.getElementById('cycle-timer');
  const biomeToggle = document.getElementById('biome-toggle');
  const infoBtn = document.getElementById('btn-info') || document.getElementById('info-btn');
  const infoPanel = document.getElementById('info-panel');
  const playBtn = document.getElementById('play-btn') || document.getElementById('btn-pause');
  const nextBtn = document.getElementById('next-btn');

  let sceneTime = 0;
  let realTime = 0;
  let paused = false;
  let generation = 1;
  let seedCounter = 11;
  const recentPresets = [];

  function pickRandomPreset(excludeNames = []) {
    const names = Object.keys(getActiveBiome().presets);
    const banned = new Set([...excludeNames, ...recentPresets]);
    let pool = names.filter((n) => !banned.has(n));
    if (pool.length === 0) pool = names.filter((n) => !excludeNames.includes(n));
    const pick = pool[Math.floor(Math.random() * pool.length)];
    recentPresets.push(pick);
    if (recentPresets.length > 8) recentPresets.shift();
    seedCounter = (seedCounter + 17) % 97 + 1;
    return makePresetSpecimen(pick, seedCounter);
  }

  // Cycle states:
  // 'GROW_INITIAL_PARENTS' -> 'GROW_HYBRID' -> 'PAUSE_5S' -> 'SHIFT_TO_LEFT' -> 'GROW_NEW_RIGHT' -> 'GROW_HYBRID' ...
  let phase = 'INIT';
  let phaseTime = 0;
  let phaseDuration = 0;

  let leftSpec = null;
  let rightSpec = null;
  let midSpec = null;

  function setPhase(nextPhase, duration) {
    phase = nextPhase;
    phaseTime = 0;
    phaseDuration = duration;
    updateHud();
  }

  function enterInitialParents() {
    generation = 1;
    leftSpec = pickRandomPreset([]);
    rightSpec = pickRandomPreset([leftSpec.id]);
    midSpec = null;

    slotMid.clearSlot(true);
    slotLeft.startGrow(leftSpec, GROW_PARENTS_SECS, 'Parent A · Left', sceneTime, realTime);
    slotRight.startGrow(rightSpec, GROW_PARENTS_SECS, 'Parent B · Right', sceneTime, realTime);
    setPhase('GROW_INITIAL_PARENTS', GROW_PARENTS_SECS);
  }

  function enterGrowHybrid() {
    seedCounter = (seedCounter + 23) % 97 + 1;
    midSpec = createHybridSpecimen(leftSpec, rightSpec, generation, seedCounter);
    slotMid.startGrow(midSpec, GROW_HYBRID_SECS, `Hybrid ${roman(generation)} · Offspring`, sceneTime, realTime);
    setPhase('GROW_HYBRID', GROW_HYBRID_SECS);
  }

  function enterPause5s() {
    setPhase('PAUSE_5S', PAUSE_HOLD_SECS);
  }

  function enterShiftToLeft() {
    // 1. Original parents on Left and Right disappear (fade out), while Middle Hybrid stays at 100% opacity
    slotLeft.clearSlot(false);
    slotRight.clearSlot(false);

    // 2. Middle Hybrid moves smoothly to the Left slot (supports horizontal & mobile flex)
    const rectLeft = slotLeft.slotEl.getBoundingClientRect();
    const rectMid = slotMid.slotEl.getBoundingClientRect();
    const dx = (rectLeft.left + rectLeft.width / 2) - (rectMid.left + rectMid.width / 2);
    const dy = (rectLeft.top + rectLeft.height / 2) - (rectMid.top + rectMid.height / 2);
    slotMid.slotEl.style.zIndex = '2';
    slotMid.stageEl.style.opacity = '1';
    slotMid.stageEl.style.transition = `transform ${SHIFT_LEFT_SECS}s cubic-bezier(0.22, 1, 0.36, 1)`;
    slotMid.stageEl.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;

    setPhase('SHIFT_TO_LEFT', SHIFT_LEFT_SECS);
  }

  function enterGrowNewRight() {
    // Handoff: Middle hybrid is now at the Left slot's exact position.
    // Snap Left slot to the Hybrid specimen at 100% maturity and matching 3D rotation, and clear Middle slot back to center.
    leftSpec = midSpec;
    midSpec = null;
    slotLeft.snapAdult(leftSpec, `${leftSpec.shortName} · Parent A`, sceneTime, realTime, slotMid);
    slotMid.clearSlot(true);

    // Pick a new random species for the Right slot and grow it
    generation++;
    rightSpec = pickRandomPreset([leftSpec.id]);
    slotRight.startGrow(rightSpec, GROW_RIGHT_SECS, 'New Species · Parent B', sceneTime, realTime);
    setPhase('GROW_NEW_RIGHT', GROW_RIGHT_SECS);
  }

  function stepStateMachine(sdt) {
    phaseTime += sdt;
    if (phase === 'GROW_INITIAL_PARENTS') {
      if (phaseTime >= phaseDuration) enterGrowHybrid();
    } else if (phase === 'GROW_HYBRID') {
      if (phaseTime >= phaseDuration) enterPause5s();
    } else if (phase === 'PAUSE_5S') {
      if (phaseTime >= phaseDuration) enterShiftToLeft();
    } else if (phase === 'SHIFT_TO_LEFT') {
      if (phaseTime >= phaseDuration) enterGrowNewRight();
    } else if (phase === 'GROW_NEW_RIGHT') {
      if (phaseTime >= phaseDuration) enterGrowHybrid();
    }
    updateHud();
  }

  function updateHud() {
    if (statusGenEl) {
      statusGenEl.textContent = `Generation ${roman(generation)}`;
    }
    if (statusPhaseEl) {
      const labels = {
        GROW_INITIAL_PARENTS: 'Growing Left & Right parents…',
        GROW_HYBRID: 'Combining parents → Growing Hybrid in middle…',
        PAUSE_5S: 'Holding 3s before shifting Hybrid left…',
        SHIFT_TO_LEFT: 'Shifting Hybrid to left · Parents disappearing…',
        GROW_NEW_RIGHT: 'Emerging new random plant on right…',
      };
      statusPhaseEl.textContent = labels[phase] || phase;
    }
    if (statusTimerEl) {
      if (phase === 'PAUSE_5S') {
        const rem = Math.max(0, phaseDuration - phaseTime);
        statusTimerEl.textContent = `${rem.toFixed(1)}s`;
      } else {
        statusTimerEl.textContent = '';
      }
    }
    window.__sprigHybridState = {
      biome: currentBiomeKey,
      biomeLabel: getActiveBiome().label,
      biomeCount: Object.keys(getActiveBiome().presets).length,
      generation,
      phase,
      phaseTime: Number(phaseTime.toFixed(2)),
      phaseDuration,
      paused,
      left: leftSpec ? { name: leftSpec.name, subtitle: leftSpec.subtitle, isHybrid: leftSpec.isHybrid } : null,
      middle: midSpec ? { name: midSpec.name, subtitle: midSpec.subtitle, isHybrid: midSpec.isHybrid } : null,
      right: rightSpec ? { name: rightSpec.name, subtitle: rightSpec.subtitle, isHybrid: rightSpec.isHybrid } : null,
    };
  }

  function setBiome(biomeKey) {
    if (!BIOMES[biomeKey]) return;
    currentBiomeKey = biomeKey;
    recentPresets.length = 0;
    if (biomeToggle) {
      for (const btn of biomeToggle.querySelectorAll('[data-biome]')) {
        btn.setAttribute('aria-checked', String(btn.dataset.biome === currentBiomeKey));
      }
    }
    enterInitialParents();
  }

  // Sync initial biome radio state
  if (biomeToggle) {
    for (const btn of biomeToggle.querySelectorAll('[data-biome]')) {
      btn.setAttribute('aria-checked', String(btn.dataset.biome === currentBiomeKey));
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const b = btn.dataset.biome;
        if (b && b !== currentBiomeKey) {
          setBiome(b);
        }
      });
    }
  }

  // Controls
  const setInfoOpen = (open) => {
    if (!infoPanel || !infoBtn) return;
    infoPanel.hidden = !open;
    infoBtn.setAttribute('aria-expanded', String(open));
  };

  if (infoBtn && infoPanel) {
    infoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = infoPanel.hidden;
      setInfoOpen(willOpen);
    });
  }

  document.addEventListener('click', (e) => {
    if (infoPanel && !infoPanel.hidden && !infoPanel.contains(e.target) && e.target !== infoBtn) {
      setInfoOpen(false);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (infoPanel && !infoPanel.hidden) setInfoOpen(false);
    }
  });

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      paused = !paused;
      document.body.dataset.paused = String(paused);
      playBtn.setAttribute('aria-label', paused ? 'Play' : 'Pause');
      updateHud();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      // Advance immediately to the next phase for quick inspection if desired
      if (phase === 'GROW_INITIAL_PARENTS' || phase === 'GROW_NEW_RIGHT') {
        if (leftSpec) slotLeft.snapAdult(leftSpec, slotLeft.slotEl.querySelector('.slot-role')?.textContent || '', sceneTime, realTime);
        if (rightSpec) slotRight.snapAdult(rightSpec, slotRight.slotEl.querySelector('.slot-role')?.textContent || '', sceneTime, realTime);
        enterGrowHybrid();
      } else if (phase === 'GROW_HYBRID') {
        if (midSpec) slotMid.snapAdult(midSpec, `Hybrid ${roman(generation)} · Offspring`, sceneTime, realTime);
        enterPause5s();
      } else if (phase === 'PAUSE_5S') {
        enterShiftToLeft();
      } else if (phase === 'SHIFT_TO_LEFT') {
        enterGrowNewRight();
      }
    });
  }

  // Expose deterministic test/inspection hooks
  window.__sprigControl = {
    step(dt) {
      tickFrame(dt);
    },
    nextPhase() {
      nextBtn?.click();
    },
    setBiome(b) {
      setBiome(b);
    },
    get slots() {
      return slots;
    },
  };

  function tickFrame(dt) {
    realTime = (realTime + dt) % 10000;
    const sdt = paused ? 0 : dt;
    sceneTime += sdt;
    if (sdt > 0) stepStateMachine(sdt);
    for (let i = 0; i < slots.length; i++) {
      slots[i].frame(sceneTime, sdt, realTime, dt);
    }
  }

  // Start initial cycle
  enterInitialParents();

  let lastNow = 0;
  function rafLoop(now) {
    requestAnimationFrame(rafLoop);
    const dt = lastNow ? Math.min((now - lastNow) * 0.001, 0.1) : 0.016;
    lastNow = now;
    tickFrame(dt);
  }
  requestAnimationFrame(rafLoop);
}

boot();

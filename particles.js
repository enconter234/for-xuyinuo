// 生日粒子剧场:数万光点 → 蛋糕(逐层"打印"并点燃蜡烛) → 文字 × N → 旋转的3D爱心 → 名字
import * as THREE from 'three';
const $ = id => document.getElementById(id);
const compact = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || innerWidth < 768;
const N = compact ? 22000 : 48000, FL = Math.floor(N * 0.05), BODY = N - FL;
const rnd = Math.random, TAU = Math.PI * 2;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const c01 = x => x < 0 ? 0 : x > 1 ? 1 : x;
let renderer, camera, scene, pts, pos, col, src, csrc, tgt, ctgt, dly, span = 1;
let raf = null, t0 = 0, last = 0, seg = -1, segs = [], shapes = [], cfg, VW = 6, K = 1, flameCol, ignite = 0;

const mk = () => ({ p: new Float32Array(N * 3), c: new Float32Array(N * 3), d: null });
const put = (s, i, x, y, z, r, g, b) => { const j = i * 3; s.p[j] = x; s.p[j + 1] = y; s.p[j + 2] = z; s.c[j] = r; s.c[j + 1] = g; s.c[j + 2] = b; };

function cake() {
  const s = mk(), k = K, yo = .55, v = () => .8 + rnd() * .2; s.d = new Float32Array(N); let i = 0;
  const cyl = (n, r, y0, y1, f) => { for (let a = 0; a < n; a++, i++) { const th = rnd() * TAU, y = y0 + rnd() * (y1 - y0), rr = r * (1 - rnd() * .03), c = f(y, v()); put(s, i, Math.cos(th) * rr * k, (y + yo) * k, Math.sin(th) * rr * k, c[0], c[1], c[2]); } };
  const disc = (n, r, y, f) => { for (let a = 0; a < n; a++, i++) { const th = rnd() * TAU, rr = r * Math.sqrt(rnd()), c = f(v()); put(s, i, Math.cos(th) * rr * k, (y + yo) * k, Math.sin(th) * rr * k, c[0], c[1], c[2]); } };
  const B = f => Math.floor(BODY * f);
  disc(B(.10), 1.95, -2.05, v => [.5 * v, .75 * v, 1 * v]);
  cyl(B(.03), 1.95, -2.1, -2.0, v => [.45, .7, .95]);
  cyl(B(.22), 1.5, -2.0, -1.0, (y, v) => Math.abs(y + 1.5) < .06 ? [1, .85 * v, .45] : [1, .55 * v, .7 * v]);
  disc(B(.07), 1.5, -1.0, v => [v, v, v]);
  cyl(B(.20), 1.05, -1.0, -.1, (y, v) => Math.abs(y + .55) < .05 ? [1, .6 * v, .75 * v] : [1, .9 * v, .75 * v]);
  disc(B(.07), 1.05, -.1, v => [v, v, v]);
  for (let a = B(.05); a > 0; a--, i++) { const th = rnd() * TAU, rr = 1.5 + (rnd() - .5) * .1; put(s, i, Math.cos(th) * rr * k, (-.95 + rnd() * .1 + yo) * k, Math.sin(th) * rr * k, 1, 1, 1); }
  for (let a = B(.04); a > 0; a--, i++) { const q = (rnd() * 8 | 0) / 8 * TAU, u = rnd() * TAU, w = rnd() * Math.PI, rr = .1; put(s, i, (Math.cos(q) * 1.28 + Math.sin(w) * Math.cos(u) * rr) * k, (-.88 + Math.cos(w) * rr + yo) * k, (Math.sin(q) * 1.28 + Math.sin(w) * Math.sin(u) * rr) * k, 1, .15 + rnd() * .1, .25); }
  const cx = n => Math.cos(n * TAU / 5 + .3) * .55, cz = n => Math.sin(n * TAU / 5 + .3) * .55, cc = [[1, .5, .6], [1, .85, .4], [.5, .85, 1], [.7, 1, .7], [.85, .6, 1]];
  for (let a = B(.07); a > 0; a--, i++) { const n = rnd() * 5 | 0, th = rnd() * TAU, y = -.1 + rnd() * .75, c = cc[n]; put(s, i, (cx(n) + Math.cos(th) * .045) * k, (y + yo) * k, (cz(n) + Math.sin(th) * .045) * k, c[0], c[1], c[2]); }
  while (i < BODY) { const th = rnd() * TAU, y = -2 + rnd(); put(s, i, Math.cos(th) * 1.5 * k, (y + yo) * k, Math.sin(th) * 1.5 * k, 1, .6, .72); i++; }
  let ymin = 1e9, ymax = -1e9; for (let a = 0; a < BODY; a++) { const y = s.p[a * 3 + 1]; if (y < ymin) ymin = y; if (y > ymax) ymax = y; }
  for (let a = 0; a < BODY; a++) s.d[a] = (s.p[a * 3 + 1] - ymin) / (ymax - ymin) * .55;
  flameCol = new Float32Array(FL * 3);
  for (let a = 0; a < FL; a++, i++) { const n = a % 5, u = rnd(), w = .07 * Math.pow(Math.sin(Math.PI * Math.pow(u, .7)), .8), th = rnd() * TAU, rr = w * Math.sqrt(rnd());
    put(s, i, (cx(n) + Math.cos(th) * rr) * k, (.68 + u * .34 + yo) * k, (cz(n) + Math.sin(th) * rr) * k, 0, 0, 0);
    flameCol.set([1, .35 + .6 * u, .1 + .5 * u * u], a * 3); }
  return s;
}
function text(str) {
  const c = document.createElement('canvas'); c.width = 1600; c.height = 400; const x = c.getContext('2d');
  const lines = compact && /[，,]/.test(str) ? str.split(/(?<=[，,])/) : [str];
  x.font = '700 200px "PingFang SC","Microsoft YaHei","Noto Sans CJK SC","Hiragino Sans GB",sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff';
  const mw = Math.max(...lines.map(l => x.measureText(l).width)), sc = Math.min(1.5, 1480 / mw, 380 / (lines.length * 230));
  x.translate(800, 200); x.scale(sc, sc); lines.forEach((l, n) => x.fillText(l, 0, (n - (lines.length - 1) / 2) * 230));
  const d = x.getImageData(0, 0, 1600, 400).data, q = [];
  for (let y = 0; y < 400; y += 2) for (let xx = 0; xx < 1600; xx += 2) if (d[(y * 1600 + xx) * 4 + 3] > 128) q.push(xx, y);
  const u = Math.min(6.4, VW * .92) / 1600, s = mk();
  for (let i = 0; i < N; i++) { const m = (rnd() * (q.length / 2) | 0) * 2, b = .72 + rnd() * .28; put(s, i, (q[m] + rnd() * 2 - 1 - 800) * u, (200 - q[m + 1] - rnd() * 2 + 1) * u, (rnd() - .5) * .06, b, b * .88, b * .62); }
  return s;
}
function heart() {
  const s = mk(), hs = Math.min(1.9, VW * .38);
  for (let i = 0; i < N; i++) { const t = rnd() * TAU, r = Math.sqrt(rnd()), sg = rnd() < .5 ? 1 : -1, hx = Math.pow(Math.sin(t), 3), hy = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16, e = rnd() < .06;
    put(s, i, hx * r * hs + (rnd() - .5) * .02, hy * r * hs - .05, sg * .6 * hs / 1.7 * Math.sqrt(1 - r * r) + (rnd() - .5) * .03, 1, e ? .85 : .2 + .25 * rnd() + .15 * r, e ? .9 : .4 + .2 * rnd()); }
  return s;
}
function scat() { const p = new Float32Array(N * 3), sx = Math.min(1.3, VW / 7); for (let i = 0; i < N; i++) { const a = rnd() * TAU, b = Math.acos(2 * rnd() - 1), r = 2.5 + rnd() * 4.5; p[i * 3] = r * Math.sin(b) * Math.cos(a) * sx; p[i * 3 + 1] = r * Math.cos(b) * .8; p[i * 3 + 2] = r * Math.sin(b) * Math.sin(a); } return p; }
const shape = n => shapes[n] || (shapes[n] = n === 0 ? cake() : n <= cfg.lines.length ? text(cfg.lines[n - 1]) : heart());

function plan() {
  segs = []; let t = 0; const add = (type, d, step) => { segs.push({ type, s: t, e: t + d, step }); t += d; }, L = cfg.lines.length;
  add('form', 4.5, 0); add('hold', 5, 0);
  for (let i = 1; i <= L; i++) { add('scatter', 1.8, i); add('form', 2.4, i); add('hold', 2.6, i); }
  add('scatter', 1.8, L + 1); add('form', 2.6, L + 1); add('hold', 1e9, L + 1);
}
function enter(S) {
  $('particle-caption').textContent = S.step === 0 && S.type === 'hold' ? cfg.cakeCaption || '' : '';
  if (S.type === 'hold') { pos.set(tgt); col.set(ctgt); if (S.step === 0) ignite = S.s + .5; return; }
  src.set(pos); csrc.set(col);
  if (S.type === 'scatter') { tgt.set(scat()); ctgt.set(csrc); dly.fill(0); span = 1; }
  else { const sh = shape(S.step); tgt.set(sh.p); ctgt.set(sh.c); if (sh.d) { dly.set(sh.d); span = .45; } else { dly.fill(0); span = 1; } }
}
function frame(ts) {
  raf = requestAnimationFrame(frame);
  const el = (ts - t0) / 1000, dt = Math.min((ts - last) / 1000, .05); last = ts;
  let si = segs.findIndex(s => el >= s.s && el < s.e); if (si < 0) si = segs.length - 1;
  const S = segs[si], L = cfg.lines.length; if (si !== seg) { seg = si; enter(S); }
  if (S.type !== 'hold') {
    const prog = (el - S.s) / (S.e - S.s), ce = ease(c01(prog));
    for (let i = 0; i < N; i++) { const p = ease(c01((prog - dly[i]) / span)), j = i * 3;
      pos[j] = src[j] + (tgt[j] - src[j]) * p; pos[j + 1] = src[j + 1] + (tgt[j + 1] - src[j + 1]) * p; pos[j + 2] = src[j + 2] + (tgt[j + 2] - src[j + 2]) * p; }
    for (let j = 0; j < N * 3; j++) col[j] = csrc[j] + (ctgt[j] - csrc[j]) * ce;
    pts.geometry.attributes.position.needsUpdate = pts.geometry.attributes.color.needsUpdate = true;
  } else if (S.step === 0) {
    const lit = c01((el - ignite) / 1.2);
    for (let a = 0; a < FL; a++) { const j = (BODY + a) * 3, f = lit * (.85 + .15 * Math.sin(el * 18 + a));
      col[j] = flameCol[a * 3] * f; col[j + 1] = flameCol[a * 3 + 1] * f; col[j + 2] = flameCol[a * 3 + 2] * f;
      pos[j] = tgt[j] + Math.sin(el * 9 + a * 1.7) * .01 * K; pos[j + 1] = tgt[j + 1] + Math.sin(el * 13 + a) * .02 * K; }
    pts.geometry.attributes.position.needsUpdate = pts.geometry.attributes.color.needsUpdate = true;
  }
  const spin = S.step === 0 && S.type !== 'scatter' ? .35 : S.step === L + 1 ? .9 : 0, tilt = spin ? .18 : 0;
  if (spin) pts.rotation.y += dt * spin; else pts.rotation.y += (Math.round(pts.rotation.y / TAU) * TAU - pts.rotation.y) * Math.min(1, dt * 3);
  pts.rotation.x += (tilt - pts.rotation.x) * Math.min(1, dt * 3);
  if (S.step === L + 1 && S.type === 'hold' && el - S.s > 7) $('particle-names').classList.add('show');
  renderer.render(scene, camera);
}
function size() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); VW = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(21)) * camera.aspect; K = Math.min(1.25, VW * .8 / 3.9); }
export function startParticleStory(config) {
  cfg = config; const stage = $('particle-stage'); stage.classList.add('active'); stage.setAttribute('aria-hidden', 'false');
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, compact ? 1.5 : 2)); $('particle-canvas').appendChild(renderer.domElement);
    scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(42, 1, .1, 100); camera.position.z = 9.2;
    pos = new Float32Array(N * 3); col = new Float32Array(N * 3); src = new Float32Array(N * 3); csrc = new Float32Array(N * 3); tgt = new Float32Array(N * 3); ctgt = new Float32Array(N * 3); dly = new Float32Array(N);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    pts = new THREE.Points(g, new THREE.PointsMaterial({ size: compact ? .02 : .016, vertexColors: true, transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false }));
    scene.add(pts); addEventListener('resize', () => renderer && size());
  }
  size(); shapes = []; plan(); seg = -1; pts.rotation.set(0, 0, 0); col.fill(0);
  for (let i = 0; i < N * 3; i += 3) { pos[i] = (rnd() - .5) * 8; pos[i + 1] = (rnd() - .5) * 6; pos[i + 2] = (rnd() - .5) * 5; }
  const nm = $('particle-names'); nm.textContent = cfg.names; nm.classList.remove('show');
  cancelAnimationFrame(raf); t0 = last = performance.now(); raf = requestAnimationFrame(frame);
}
export function closeParticleStory() { cancelAnimationFrame(raf); raf = null; const s = $('particle-stage'); s.classList.remove('active'); s.setAttribute('aria-hidden', 'true'); }

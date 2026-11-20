// 浪漫氛围层:飘落花瓣与爱心 + 触碰/点击时迸出星光
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = innerWidth < 768, DPR = Math.min(devicePixelRatio || 1, 2);
const cv = document.createElement('canvas');
Object.assign(cv.style, { position: 'fixed', inset: 0, zIndex: 5, pointerEvents: 'none' });
document.body.appendChild(cv);
const cx = cv.getContext('2d'); let W, H;
const rs = () => { W = innerWidth; H = innerHeight; cv.width = W * DPR; cv.height = H * DPR; cx.setTransform(DPR, 0, 0, DPR, 0, 0); };
addEventListener('resize', rs); rs();
const COL = ['255,182,200', '255,214,228', '245,217,139', '255,255,255'], R = Math.random;
const mk = top => ({ x: R() * W, y: top ? -20 : R() * H, s: 4 + R() * 7, vy: .3 + R() * .6, vx: (R() - .5) * .3, r: R() * 6.28, vr: (R() - .5) * .03, ph: R() * 6.28, c: COL[R() * 4 | 0], a: .25 + R() * .45, h: R() < .25 });
const P = Array.from({ length: reduce ? 0 : mobile ? 22 : 46 }, () => mk(false)), sparks = [];
function heart(x, y, s) { cx.beginPath(); cx.moveTo(x, y + s * .3); cx.bezierCurveTo(x, y - s * .2, x - s, y - s * .2, x - s, y + s * .3); cx.bezierCurveTo(x - s, y + s * .8, x, y + s, x, y + s * 1.3); cx.bezierCurveTo(x, y + s, x + s, y + s * .8, x + s, y + s * .3); cx.bezierCurveTo(x + s, y - s * .2, x, y - s * .2, x, y + s * .3); cx.fill(); }
function burst(x, y, n, hr) { for (let i = 0; i < n; i++) { const a = R() * 6.28, v = 1 + R() * 3; sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.2, s: 3 + R() * 5, l: 1, h: R() < hr, c: COL[R() * 4 | 0] }); } }
(function loop() {
  cx.clearRect(0, 0, W, H);
  for (const p of P) {
    p.y += p.vy; p.x += p.vx + Math.sin(p.ph) * .4; p.ph += .02; p.r += p.vr; if (p.y > H + 20) Object.assign(p, mk(true));
    cx.fillStyle = `rgba(${p.c},${p.a})`;
    if (p.h) heart(p.x, p.y, p.s * .5); else { cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.scale(1, .55 + .45 * Math.sin(p.ph)); cx.beginPath(); cx.ellipse(0, 0, p.s, p.s * .55, 0, 0, 6.283); cx.fill(); cx.restore(); }
  }
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i]; s.x += s.vx; s.y += s.vy; s.vy += .03; s.l -= .018; if (s.l <= 0) { sparks.splice(i, 1); continue; }
    cx.fillStyle = `rgba(${s.c},${s.l})`; if (s.h) heart(s.x, s.y, s.s); else { cx.beginPath(); cx.arc(s.x, s.y, s.s * .5, 0, 6.283); cx.fill(); }
  }
  requestAnimationFrame(loop);
})();
addEventListener('pointerdown', e => { if (!reduce) burst(e.clientX, e.clientY, 12, .5); });
let lt = 0; addEventListener('pointermove', e => { if (reduce || e.pointerType === 'touch' || performance.now() - lt < 45) return; lt = performance.now(); burst(e.clientX, e.clientY, 1, .3); });

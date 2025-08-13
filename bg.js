
(function () {
  const canvas = document.getElementById('wave-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let dpi = Math.max(1, Math.min(1.5, window.devicePixelRatio || 1));
  let width = 0;
  let height = 0;

  function resize() {
    dpi = Math.max(1, Math.min(1.5, window.devicePixelRatio || 1));
    width = Math.floor(window.innerWidth);
    height = Math.floor(window.innerHeight);
    canvas.width = Math.floor(width * dpi);
    canvas.height = Math.floor(height * dpi);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpi, 0, 0, dpi, 0, 0);
  }

  const config = {
    columns: 22,
    amplitude: 26,
    wavelength: 0.010,
    speed: 0.22,
    layers: [
      { ampMul: 1.0, speedMul: 1.0, alpha: 0.30 },
      { ampMul: 0.6, speedMul: 0.6, alpha: 0.20 },
      { ampMul: 1.4, speedMul: 1.4, alpha: 0.12 },
    ],
    vignette: 0.25,
    palette: [
      { r: 70, g: 8, b: 14 },
      { r: 110, g: 12, b: 20 },
      { r: 150, g: 16, b: 26 },
      { r: 70, g: 8, b: 14 },
    ],
    interaction: {
      enabled: true,
      radius: 160,
      yRadius: 160,
      strength: 0.08,   
      alphaBoost: 0.12, 
      widthBoost: 0.8,  
      follow: 0.15,     
    },
    twist: {
      enabled: true,
      x: 0.5,      
      y: 0.42,     
      radius: 220, 
      strength: 0.35, 
      dir: 1,      
      alphaBoost: 0.08, 
      widthBoost: 0.4,  
    }
  };

  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpColor(c1, c2, t) {
    return {
      r: Math.round(lerp(c1.r, c2.r, t)),
      g: Math.round(lerp(c1.g, c2.g, t)),
      b: Math.round(lerp(c1.b, c2.b, t)),
    };
  }
  function paletteAt(t) {
    const scaled = t * (config.palette.length - 1);
    const i = Math.floor(scaled);
    const f = scaled - i;
    const c1 = config.palette[i % config.palette.length];
    const c2 = config.palette[(i + 1) % config.palette.length];
    return lerpColor(c1, c2, f);
  }

  let start = 0;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0, inside: false };

  function onMove(e) {
    mouse.tx = e.clientX;
    mouse.ty = e.clientY;
    mouse.inside = true;
  }
  function onLeave() { mouse.inside = false; }
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerenter', () => { mouse.inside = true; }, { passive: true });
  window.addEventListener('pointerleave', onLeave, { passive: true });

  function draw(ts) {
    if (!start) start = ts;
    const t = (ts - start) / 1000;
    ctx.clearRect(0, 0, width, height);

    const colW = width / config.columns;
    const basePhase = (t * 0.03) % 1;
    const color = paletteAt(basePhase);
    ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
    ctx.globalAlpha = 0.10;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const interEnabled = config.interaction && config.interaction.enabled && !isTouch;
    if (interEnabled) {
      const k = config.interaction.follow;
      mouse.x += (mouse.tx - mouse.x) * k;
      mouse.y += (mouse.ty - mouse.y) * k;
    }
    for (let l = 0; l < config.layers.length; l += 1) {
      const L = config.layers[l];
      for (let i = 0; i < config.columns; i += 1) {
        let xCenter = i * colW + colW * 0.5 + Math.sin((t + i) * 0.2 + l) * 6 * (l + 1);
        let alphaAdj = 0;
        let widthAdj = 0;
        let dx = 0, gX = 0, rX = 1, rY = 1;
        if (interEnabled && mouse.inside) {
          dx = mouse.x - xCenter;
          rX = config.interaction.radius;
          rY = config.interaction.yRadius || rX;
          gX = Math.exp(- (dx * dx) / (2 * rX * rX));
          xCenter += dx * config.interaction.strength * gX;
          alphaAdj = gX * config.interaction.alphaBoost;
          widthAdj = gX * config.interaction.widthBoost;
        }
        const phase = t * config.speed * L.speedMul + i * 0.7 + l * 0.6;
        const hueShift = (basePhase + (i / config.columns) * (0.5 + 0.3 * l)) % 1;
        const c = paletteAt(hueShift);
        ctx.beginPath();
        const step = 8;
        const tw = config.twist || {};
        const twistOn = tw.enabled === true;
        const cx = width * (tw.x || 0.5);
        const cy = height * (tw.y || 0.42);
        const tr = tw.radius || 0;
        const sigma2 = tr > 0 ? (tr * 0.66) * (tr * 0.66) : 1;
        let twistInfMax = 0;
        for (let y = -20; y <= height + 20; y += step) {
          let x = xCenter
            + Math.sin(y * config.wavelength + phase) * (config.amplitude * L.ampMul)
            + Math.sin(y * config.wavelength * 0.45 + phase * 1.6) * (config.amplitude * 0.35 * L.ampMul);
          if (gX > 0 && interEnabled && mouse.inside) {
            const dy = mouse.y - y;
            const gY = Math.exp(- (dy * dy) / (2 * rY * rY));
            const g2d = gX * gY;
            x += dx * config.interaction.strength * g2d;
          }
          if (twistOn && tr > 0) {
            const dxC = x - cx;
            const dyC = y - cy;
            const r2 = dxC * dxC + dyC * dyC;
            const g = Math.exp(-r2 / (2 * sigma2));
            if (g > 1e-3) {
              const r = Math.sqrt(r2) + 1e-4;
              const tanX = (-dyC / r) * (tw.dir || 1);
              x += (tw.strength || 0) * tanX * g;
              if (g > twistInfMax) twistInfMax = g;
            }
          }
          if (y === -20) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        if (twistInfMax > 0) {
          alphaAdj += twistInfMax * (tw.alphaBoost || 0);
          widthAdj += twistInfMax * (tw.widthBoost || 0);
        }
        ctx.lineWidth = Math.max(1, colW * 0.05) + widthAdj;
        ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${L.alpha + alphaAdj})`;
        ctx.stroke();
      }
    }
    const vignetteAlpha = config.vignette;
    const grd = ctx.createLinearGradient(0, 0, 0, height);
    grd.addColorStop(0.0, `rgba(0,0,0, ${vignetteAlpha})`);
    grd.addColorStop(0.2, 'rgba(0,0,0, 0)');
    grd.addColorStop(0.8, 'rgba(0,0,0, 0)');
    grd.addColorStop(1.0, `rgba(0,0,0, ${vignetteAlpha})`);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, width, height);

    requestAnimationFrame(draw);
  }

  let raf = 0;
  window.addEventListener('resize', () => {
    if (raf) cancelAnimationFrame(raf);
    resize();
    raf = requestAnimationFrame(draw);
  });

  resize();
  requestAnimationFrame(draw);
})();



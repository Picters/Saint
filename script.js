
(function () {
  const canvas = document.getElementById('wave-canvas');
  const ctx = canvas.getContext('2d');
  const textCanvas = document.getElementById('text-canvas');
  const tctx = textCanvas.getContext('2d');

  let dpi = Math.max(1, window.devicePixelRatio || 1);
  let width = 0;
  let height = 0;

  function resizeCanvas() {
    dpi = Math.max(1, Math.min(1.5, window.devicePixelRatio || 1));
    width = Math.floor(window.innerWidth);
    height = Math.floor(window.innerHeight);
    canvas.width = Math.floor(width * dpi);
    canvas.height = Math.floor(height * dpi);
    textCanvas.width = Math.floor(width * dpi);
    textCanvas.height = Math.floor(height * dpi);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    textCanvas.style.width = width + 'px';
    textCanvas.style.height = height + 'px';
    ctx.setTransform(dpi, 0, 0, dpi, 0, 0);
    tctx.setTransform(dpi, 0, 0, dpi, 0, 0);
  }
  const palette = [
    { r: 180, g: 18,  b: 28  },  
    { r: 210, g: 22,  b: 36  },  
    { r: 150, g: 10,  b: 24  },  
    { r: 180, g: 18,  b: 28  },  
  ];

  const wave = {
    amplitude: 60,     
    length: 0.0090,
    speed: 0.48,
    yOffset: 0.58,     
    layers: [
      { alpha: 0.30, ampMul: 1.0, speedMul: 1.0, lenMul: 1.0 },
      { alpha: 0.20, ampMul: 1.45, speedMul: 0.8, lenMul: 0.75 },
      { alpha: 0.14, ampMul: 1.9, speedMul: 0.6, lenMul: 0.55 },
    ],
    glow: {
      enabled: false,
      blur: 0,
      alpha: 0,
    },
    glass: {
      enabled: true,
      thickness: 34,
      thicknessVariation: 8,
      crestAmpMul: 0.9,
      crestLenMul: 1.0,
      crestSpeedMul: 1.0,
      step: 7,
    },
    aura: {
      enabled: true,
      blend: 'lighter',
      strokes: [
        { width: 12, alpha: 0.07, ampMul: 1.0,  lenMul: 1.0, speedMul: 1.0, step: 6 },
        { width: 8,  alpha: 0.055, ampMul: 1.03, lenMul: 1.0, speedMul: 1.0, step: 6 },
        { width: 5,  alpha: 0.04,  ampMul: 1.06, lenMul: 1.0, speedMul: 1.0, step: 6 },
      ],
    },
    threads: {
      enabled: true,
      count: 22,
      step: 7,
      ampJitter: 0.35,
      lenJitter: 0.3,
      speedJitter: 0.35,
      alpha: 0.14,   
    },
    particles: {
      enabled: true,
      density: 0.06, 
      alpha: 0.10,
      size: [1, 2],
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

  function paletteGradientAt(t) {
    const scaled = t * (palette.length - 1);
    const i = Math.floor(scaled);
    const f = scaled - i;
    const c1 = palette[i % palette.length];
    const c2 = palette[(i + 1) % palette.length];
    return lerpColor(c1, c2, f);
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function mixWithWhite(c, amount) {
    return {
      r: Math.round(c.r + (255 - c.r) * amount),
      g: Math.round(c.g + (255 - c.g) * amount),
      b: Math.round(c.b + (255 - c.b) * amount),
    };
  }
  function darken(c, factor) {
    return {
      r: Math.round(clamp(c.r * factor, 0, 255)),
      g: Math.round(clamp(c.g * factor, 0, 255)),
      b: Math.round(clamp(c.b * factor, 0, 255)),
    };
  }
  function rgb(c) { return `rgb(${c.r}, ${c.g}, ${c.b})`; }

  let startTs = 0;

  function drawWavePath(timeSeconds, options) {
    const { amplitude, length, speed, yOffset } = wave;
    const { ampMul, speedMul, lenMul } = options;
    const yBase = height * yOffset;
    const amp = amplitude * ampMul;
    const k = length * lenMul;
    const t = timeSeconds * speed * speedMul;

    ctx.beginPath();
    ctx.moveTo(0, yBase);
    const step = 5; 
    for (let x = 0; x <= width + step; x += step) {
      const y = yBase
        + Math.sin(x * k + t) * amp
        + Math.sin(x * k * 0.45 + t * 1.7) * (amp * 0.38)
        + Math.sin(x * k * 0.18 + t * 0.65) * (amp * 0.18);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
  }

  function drawCrestPath(timeSeconds, ampMul, lenMul, speedMul, step) {
    ctx.beginPath();
    for (let x = 0; x <= width + step; x += step) {
      const y = getWaveY(x, timeSeconds, ampMul, lenMul, speedMul);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  }

  function getWaveY(x, timeSeconds, ampMul, lenMul, speedMul) {
    const { amplitude, length, speed, yOffset } = wave;
    const yBase = height * yOffset;
    const amp = amplitude * ampMul;
    const k = length * lenMul;
    const t = timeSeconds * speed * speedMul;
    return yBase
      + Math.sin(x * k + t) * amp
      + Math.sin(x * k * 0.45 + t * 1.7) * (amp * 0.38)
      + Math.sin(x * k * 0.18 + t * 0.65) * (amp * 0.18);
  }

  function drawGlassBand(timeSeconds, baseColor) {
    if (!wave.glass.enabled) return;

    const g = wave.glass;
    const step = g.step;
    const pointsTop = [];
    const pointsBottom = [];
    for (let x = 0; x <= width + step; x += step) {
      const y = getWaveY(x, timeSeconds, g.crestAmpMul, g.crestLenMul, g.crestSpeedMul);
      const dx = step;
      const yPrev = getWaveY(Math.max(0, x - dx), timeSeconds, g.crestAmpMul, g.crestLenMul, g.crestSpeedMul);
      const yNext = getWaveY(Math.min(width, x + dx), timeSeconds, g.crestAmpMul, g.crestLenMul, g.crestSpeedMul);
      const dy = (yNext - yPrev) / (2 * dx);
      const invLen = 1 / Math.hypot(1, dy);
      const nx = -dy * invLen;
      const ny = 1 * invLen;
      const thickness = g.thickness + Math.sin(x * 0.01 + timeSeconds * 0.4) * g.thicknessVariation;
      const half = thickness * 0.5;

      const tx = clamp(x - nx * half, -50, width + 50);
      const ty = clamp(y - ny * half, -50, height + 50);
      const bx = clamp(x + nx * half, -50, width + 50);
      const by = clamp(y + ny * half, -50, height + 50);

      pointsTop.push([tx, ty]);
      pointsBottom.push([bx, by]);
    }
    ctx.beginPath();
    if (pointsTop.length > 0) {
      ctx.moveTo(pointsTop[0][0], pointsTop[0][1]);
      for (let i = 1; i < pointsTop.length; i += 1) ctx.lineTo(pointsTop[i][0], pointsTop[i][1]);
      for (let i = pointsBottom.length - 1; i >= 0; i -= 1) ctx.lineTo(pointsBottom[i][0], pointsBottom[i][1]);
      ctx.closePath();
    }
    let minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < pointsTop.length; i += 1) {
      minY = Math.min(minY, pointsTop[i][1]);
      maxY = Math.max(maxY, pointsTop[i][1]);
    }
    for (let i = 0; i < pointsBottom.length; i += 1) {
      minY = Math.min(minY, pointsBottom[i][1]);
      maxY = Math.max(maxY, pointsBottom[i][1]);
    }
    if (!isFinite(minY) || !isFinite(maxY)) return;
    const grad = ctx.createLinearGradient(0, minY - 20, 0, maxY + 20);

    const dark = darken(baseColor, 0.25);
    const mid = darken(baseColor, 0.55);
    const glow = mixWithWhite(baseColor, 0.70); 
    const mid2 = darken(baseColor, 0.5);
    const dark2 = darken(baseColor, 0.22);

    grad.addColorStop(0.00, rgb(dark));
    grad.addColorStop(0.30, rgb(mid));
    grad.addColorStop(0.52, rgb(glow));
    grad.addColorStop(0.70, rgb(mid2));
    grad.addColorStop(1.00, rgb(dark2));

    ctx.fillStyle = grad;
    ctx.fill();
    ctx.beginPath();
    if (pointsTop.length > 0) {
      ctx.moveTo(pointsTop[0][0], pointsTop[0][1]);
      for (let i = 1; i < pointsTop.length; i += 1) ctx.lineTo(pointsTop[i][0], pointsTop[i][1]);
    }
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = rgb(mixWithWhite(baseColor, 0.82));
    ctx.stroke();
    ctx.beginPath();
    if (pointsBottom.length > 0) {
      ctx.moveTo(pointsBottom[0][0], pointsBottom[0][1]);
      for (let i = 1; i < pointsBottom.length; i += 1) ctx.lineTo(pointsBottom[i][0], pointsBottom[i][1]);
    }
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = rgb(darken(baseColor, 0.28));
    ctx.stroke();
  }
  function drawWavePathCustom(timeSeconds, ampMul, lenMul, speedMul, yOffsetOverride) {
    const { amplitude, length, speed } = wave;
    const yBase = height * yOffsetOverride;
    const amp = amplitude * ampMul;
    const k = length * lenMul;
    const t = timeSeconds * speed * speedMul;

    ctx.beginPath();
    ctx.moveTo(0, yBase);
    const step = 6;
    for (let x = 0; x <= width + step; x += step) {
      const y = yBase
        + Math.sin(x * k + t) * amp
        + Math.sin(x * k * 0.45 + t * 1.7) * (amp * 0.34)
        + Math.sin(x * k * 0.16 + t * 0.6) * (amp * 0.16);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
  }

  function getWaveDY(x, timeSeconds, ampMul, lenMul, speedMul) {
    const h = 1.5;
    const y1 = getWaveY(x - h, timeSeconds, ampMul, lenMul, speedMul);
    const y2 = getWaveY(x + h, timeSeconds, ampMul, lenMul, speedMul);
    return (y2 - y1) / (2 * h);
  }

  function getWaveCurvature(x, timeSeconds, ampMul, lenMul, speedMul) {
    const h = 2.0;
    const y0 = getWaveY(x, timeSeconds, ampMul, lenMul, speedMul);
    const y1 = getWaveY(x - h, timeSeconds, ampMul, lenMul, speedMul);
    const y2 = getWaveY(x + h, timeSeconds, ampMul, lenMul, speedMul);
    return y1 + y2 - 2 * y0;
  }

  function drawBackgroundBands(timeSeconds, baseColor) {
    const far1 = darken(baseColor, 0.22);
    const far2 = darken(baseColor, 0.35);
    drawWavePathCustom(timeSeconds, 2.3, 0.65, 0.45, 0.80);
    ctx.fillStyle = rgb(far2);
    ctx.fill();
    drawWavePathCustom(timeSeconds, 1.6, 0.8, 0.55, 0.74);
    ctx.fillStyle = rgb(far1);
    ctx.fill();
  }

  function drawSpecularHighlight(timeSeconds, baseColor) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const step = 6;
    const ampMul = 0.95, lenMul = 1.0, speedMul = 1.0;
    for (let x = 0; x <= width; x += step) {
      const y = getWaveY(x, timeSeconds, ampMul, lenMul, speedMul);
      const dy = getWaveDY(x, timeSeconds, ampMul, lenMul, speedMul);
      const slope = Math.abs(dy);
      const intensity = Math.max(0, 1 - Math.min(1, slope * 0.9));
      if (intensity <= 0.02) continue;
      const w = 1.0 + intensity * 1.8;
      ctx.beginPath();
      ctx.moveTo(x - step * 0.5, y);
      ctx.lineTo(x + step * 0.5, y);
      ctx.lineWidth = w;
      const c = mixWithWhite(baseColor, 0.85);
      ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${0.09 + intensity * 0.18})`;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFoam(timeSeconds, baseColor) {
    const step = 14;
    const ampMul = 1.0, lenMul = 1.0, speedMul = 1.0;
    const foamColor = mixWithWhite(baseColor, 0.92);
    ctx.save();
    for (let x = 0; x <= width; x += step) {
      const curv = Math.abs(getWaveCurvature(x, timeSeconds, ampMul, lenMul, speedMul));
      if (curv < 0.6) continue;
      const y = getWaveY(x, timeSeconds, ampMul, lenMul, speedMul);
      const n = Math.sin(x * 12.9898 + timeSeconds * 2.233) * 43758.5453;
      const frac = n - Math.floor(n);
      if (frac > 0.82) {
        ctx.fillStyle = `rgba(${foamColor.r}, ${foamColor.g}, ${foamColor.b}, 0.12)`;
        ctx.fillRect(x, y - 1, 2, 2);
      }
    }
    ctx.restore();
  }

  function renderFrame(ts) {
    if (!startTs) startTs = ts;
    const elapsed = (ts - startTs) / 1000; 

    ctx.clearRect(0, 0, width, height);
    const colorPhase = (elapsed * 0.05) % 1; 
    const col = paletteGradientAt(colorPhase);
    drawBackgroundBands(elapsed, col);
    if (wave.threads && wave.threads.enabled) {
      const tcfg = wave.threads;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < tcfg.count; i += 1) {
        const ampMul = 1.0 + (i / tcfg.count - 0.5) * tcfg.ampJitter;
        const lenMul = 1.0 + (i / tcfg.count - 0.5) * tcfg.lenJitter;
        const speedMul = 1.0 + (i / tcfg.count - 0.5) * tcfg.speedJitter;
        const step = tcfg.step;
        drawCrestPath(elapsed, ampMul, lenMul, speedMul, step);
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${tcfg.alpha})`;
        ctx.stroke();
      }
      ctx.restore();
    }
    if (wave.aura && wave.aura.enabled) {
      ctx.save();
      ctx.globalCompositeOperation = wave.aura.blend || 'lighter';
      for (let i = 0; i < wave.aura.strokes.length; i += 1) {
        const s = wave.aura.strokes[i];
        drawCrestPath(elapsed, s.ampMul, s.lenMul, s.speedMul, s.step);
        ctx.lineWidth = s.width;
        ctx.strokeStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${s.alpha})`;
        ctx.stroke();
      }
      ctx.restore();
    }
    if (wave.particles && wave.particles.enabled) {
      tctx.clearRect(0, 0, width, height);
      const fontPx = Math.min(Math.max(28, width * 0.12), 96); 
      tctx.font = `700 ${fontPx}px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, 'Noto Sans', sans-serif`;
      tctx.textAlign = 'center';
      tctx.textBaseline = 'middle';
      const cx = width / 2;
      const cy = height * 0.42; 
      tctx.fillStyle = '#fff';
      tctx.fillText('Saint', cx, cy);
      const mask = tctx.getImageData(0, 0, width, height);
      const particles = Math.floor(width * wave.particles.density);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < particles; i += 1) {
        const x = Math.random() * width;
        const y = getWaveY(x, elapsed, 1.0, 1.0, 1.0) + (Math.random() - 0.5) * 20;
        const idx = ((Math.floor(y) * width) + Math.floor(x)) * 4 + 3; 
        if (mask.data[idx] > 10) {
          const size = wave.particles.size[0] + Math.random() * (wave.particles.size[1] - wave.particles.size[0]);
          ctx.fillStyle = `rgba(${col.r}, ${col.g}, ${col.b}, ${wave.particles.alpha})`;
          ctx.fillRect(x, y, size, size);
        }
      }
      ctx.restore();
    }

    requestAnimationFrame(renderFrame);
  }
  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      resizeCanvas();
    });
  });
  resizeCanvas();
  requestAnimationFrame(renderFrame);
})();



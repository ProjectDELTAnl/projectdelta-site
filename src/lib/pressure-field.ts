export type PressureVariant = "hero" | "scanner" | "dossier" | "ambient";

type PressureMode = "netwerk" | "studie" | "media" | string;

type PressureCenter = {
  x: number;
  y: number;
  amplitude: number;
  radiusX: number;
  radiusY: number;
  phase: number;
  speed: number;
  driftX: number;
  driftY: number;
};

export type PressureParticle = {
  x: number;
  y: number;
  age: number;
  life: number;
  speed: number;
};

export type PressureFrameOptions = {
  width: number;
  height: number;
  maskAlpha: Uint8ClampedArray;
  time: number;
  deltaTime: number;
  variant: PressureVariant;
  mode: PressureMode;
  particles: PressureParticle[];
};

type VariantConfig = {
  alpha: number;
  contrast: number;
  particleCount: number;
  particleAlpha: number;
  particleSpeed: number;
  edgeAlpha: number;
  frontAlpha: number;
  phaseScale: number;
  signalAlpha: number;
};

export const pressureVariantConfig: Record<PressureVariant, VariantConfig> = {
  ambient: {
    alpha: 0.44,
    contrast: 0.8,
    particleCount: 36,
    particleAlpha: 0.08,
    particleSpeed: 0.42,
    edgeAlpha: 0.12,
    frontAlpha: 0.22,
    phaseScale: 0.45,
    signalAlpha: 0.08,
  },
  dossier: {
    alpha: 0.52,
    contrast: 0.88,
    particleCount: 52,
    particleAlpha: 0.1,
    particleSpeed: 0.46,
    edgeAlpha: 0.16,
    frontAlpha: 0.34,
    phaseScale: 0.52,
    signalAlpha: 0.1,
  },
  hero: {
    alpha: 0.72,
    contrast: 1,
    particleCount: 96,
    particleAlpha: 0.13,
    particleSpeed: 0.58,
    edgeAlpha: 0.24,
    frontAlpha: 0.82,
    phaseScale: 0.66,
    signalAlpha: 0.18,
  },
  scanner: {
    alpha: 0.82,
    contrast: 1.08,
    particleCount: 130,
    particleAlpha: 0.16,
    particleSpeed: 0.66,
    edgeAlpha: 0.3,
    frontAlpha: 0.92,
    phaseScale: 0.78,
    signalAlpha: 0.24,
  },
};

const pressureCenters: PressureCenter[] = [
  {
    x: 0.23,
    y: 0.34,
    amplitude: -1.12,
    radiusX: 0.24,
    radiusY: 0.21,
    phase: 0.2,
    speed: 0.28,
    driftX: 0.055,
    driftY: 0.04,
  },
  {
    x: 0.31,
    y: 0.72,
    amplitude: -0.92,
    radiusX: 0.2,
    radiusY: 0.17,
    phase: 1.8,
    speed: 0.34,
    driftX: 0.05,
    driftY: 0.035,
  },
  {
    x: 0.48,
    y: 0.21,
    amplitude: -0.78,
    radiusX: 0.18,
    radiusY: 0.13,
    phase: 2.6,
    speed: 0.25,
    driftX: 0.045,
    driftY: 0.032,
  },
  {
    x: 0.69,
    y: 0.28,
    amplitude: 1.08,
    radiusX: 0.15,
    radiusY: 0.14,
    phase: 3.3,
    speed: 0.26,
    driftX: 0.052,
    driftY: 0.038,
  },
  {
    x: 0.49,
    y: 0.48,
    amplitude: -0.42,
    radiusX: 0.17,
    radiusY: 0.16,
    phase: 4.7,
    speed: 0.31,
    driftX: 0.04,
    driftY: 0.046,
  },
  {
    x: 0.61,
    y: 0.51,
    amplitude: 0.88,
    radiusX: 0.14,
    radiusY: 0.14,
    phase: 5.8,
    speed: 0.29,
    driftX: 0.05,
    driftY: 0.032,
  },
  {
    x: 0.76,
    y: 0.57,
    amplitude: 1.16,
    radiusX: 0.15,
    radiusY: 0.16,
    phase: 6.6,
    speed: 0.24,
    driftX: 0.04,
    driftY: 0.03,
  },
  {
    x: 0.58,
    y: 0.78,
    amplitude: 1.18,
    radiusX: 0.15,
    radiusY: 0.14,
    phase: 7.4,
    speed: 0.3,
    driftX: 0.048,
    driftY: 0.04,
  },
  {
    x: 0.39,
    y: 0.88,
    amplitude: -0.58,
    radiusX: 0.17,
    radiusY: 0.12,
    phase: 8.2,
    speed: 0.32,
    driftX: 0.04,
    driftY: 0.03,
  },
  {
    x: 0.8,
    y: 0.4,
    amplitude: -0.62,
    radiusX: 0.15,
    radiusY: 0.14,
    phase: 9.1,
    speed: 0.27,
    driftX: 0.035,
    driftY: 0.032,
  },
  {
    x: 0.71,
    y: 0.71,
    amplitude: -0.58,
    radiusX: 0.14,
    radiusY: 0.13,
    phase: 10.4,
    speed: 0.29,
    driftX: 0.036,
    driftY: 0.034,
  },
  {
    x: 0.48,
    y: 0.63,
    amplitude: 0.78,
    radiusX: 0.13,
    radiusY: 0.13,
    phase: 11.2,
    speed: 0.33,
    driftX: 0.034,
    driftY: 0.038,
  },
  {
    x: 0.4,
    y: 0.18,
    amplitude: 0.64,
    radiusX: 0.12,
    radiusY: 0.1,
    phase: 12.1,
    speed: 0.28,
    driftX: 0.036,
    driftY: 0.03,
  },
  {
    x: 0.25,
    y: 0.55,
    amplitude: -0.74,
    radiusX: 0.15,
    radiusY: 0.13,
    phase: 13.4,
    speed: 0.31,
    driftX: 0.04,
    driftY: 0.032,
  },
  {
    x: 0.67,
    y: 0.9,
    amplitude: -0.52,
    radiusX: 0.14,
    radiusY: 0.1,
    phase: 14.6,
    speed: 0.3,
    driftX: 0.035,
    driftY: 0.028,
  },
];

const bandPalette = [
  [17, 10, 105],
  [0, 55, 182],
  [0, 164, 230],
  [0, 221, 188],
  [64, 207, 86],
  [248, 223, 58],
  [255, 136, 20],
  [226, 27, 35],
  [98, 0, 42],
] as const;

const thresholds = [-1.08, -0.78, -0.5, -0.22, 0.04, 0.34, 0.68, 1.02];

const TAU = Math.PI * 2;

export function internalResolution(variant: PressureVariant) {
  if (variant === "scanner") {
    return { width: 330, height: 385 };
  }
  if (variant === "hero") {
    return { width: 300, height: 350 };
  }
  if (variant === "dossier") {
    return { width: 250, height: 292 };
  }
  return { width: 220, height: 257 };
}

export function createPressureParticles(
  variant: PressureVariant,
): PressureParticle[] {
  const count = pressureVariantConfig[variant].particleCount;
  return Array.from({ length: count }, (_, index) => ({
    x: seeded(index * 17 + 3),
    y: seeded(index * 23 + 11),
    age: seeded(index * 31 + 7) * 60,
    life: 90 + seeded(index * 43 + 19) * 170,
    speed: 0.75 + seeded(index * 53 + 5) * 0.65,
  }));
}

export function renderPressureFrame(
  context: CanvasRenderingContext2D,
  options: PressureFrameOptions,
) {
  const { width, height, maskAlpha, time, variant, mode } = options;
  const config = pressureVariantConfig[variant];
  const image = context.createImageData(width, height);
  const values = new Float32Array(width * height);
  const bands = new Uint8Array(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const alpha = maskAlpha[index];
      if (alpha < 12) {
        values[index] = 0;
        bands[index] = 255;
        continue;
      }

      const nx = x / Math.max(1, width - 1);
      const ny = y / Math.max(1, height - 1);
      const value = pressureValue(nx, ny, time, mode) * config.contrast;
      values[index] = value;
      bands[index] = bandForValue(value);
    }
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const dataIndex = index * 4;
      const mask = maskAlpha[index] / 255;
      const band = bands[index];

      if (band === 255 || mask <= 0.04) {
        image.data[dataIndex + 3] = 0;
        continue;
      }

      const value = values[index];
      let [red, green, blue] = colorForValue(value);
      const front = transitionFrontStrength(values, x, y, width, height, time);
      const edge = maskEdgeStrength(maskAlpha, x, y, width, height);
      const signal = signalOverlay(x, y, width, height, time, variant);

      if (front > 0) {
        [red, green, blue] = mixColor(
          [red, green, blue],
          frontColor(value, x, y, time),
          Math.min(0.88, front * config.frontAlpha),
        );
      }

      if (edge > 0) {
        [red, green, blue] = screenColor(
          [red, green, blue],
          edgeColor(value),
          Math.min(0.55, edge * config.edgeAlpha),
        );
      }

      if (signal.alpha > 0) {
        [red, green, blue] = screenColor(
          [red, green, blue],
          [signal.red, signal.green, signal.blue],
          Math.min(0.42, signal.alpha * config.signalAlpha),
        );
      }

      image.data[dataIndex] = clampByte(red);
      image.data[dataIndex + 1] = clampByte(green);
      image.data[dataIndex + 2] = clampByte(blue);
      image.data[dataIndex + 3] = clampByte(255 * config.alpha * mask);
    }
  }

  context.clearRect(0, 0, width, height);
  context.putImageData(image, 0, 0);
  drawFlowParticles(context, options, values);
}

export function pressureValue(
  x: number,
  y: number,
  time: number,
  mode: PressureMode,
) {
  const modeBias =
    mode === "media"
      ? 0.08
      : mode === "studie"
        ? -0.03
        : mode === "netwerk"
          ? 0
          : 0.02;
  const warpA = Math.sin((x * 1.7 + y * 1.15 + time * 0.07) * TAU);
  const warpB = Math.cos((x * 2.55 - y * 1.45 - time * 0.055) * TAU);
  const warpC = Math.sin((x * 3.1 + y * 2.35 + time * 0.035) * TAU);
  const wx = clamp01(x + warpA * 0.026 + warpB * 0.014);
  const wy = clamp01(y + warpB * 0.022 - warpC * 0.013);
  let value = wx * 0.58 + wy * 0.16 - 0.2 + modeBias;
  const slowTime = time * 0.1;

  for (const center of pressureCenters) {
    const cx =
      center.x +
      Math.sin(time * center.speed + center.phase) * center.driftX +
      Math.sin(slowTime + center.phase * 0.7) * center.driftX * 0.5;
    const cy =
      center.y +
      Math.cos(time * center.speed * 0.9 + center.phase) * center.driftY +
      Math.sin(slowTime * 1.3 + center.phase) * center.driftY * 0.45;
    const dx = (wx - cx) / center.radiusX;
    const dy = (wy - cy) / center.radiusY;
    value += center.amplitude * Math.exp(-(dx * dx + dy * dy));
  }

  value += 0.18 * Math.sin((wy * 2.55 + time * 0.055) * TAU);
  value += 0.14 * Math.sin((wx * 2.45 - wy * 1.3 + time * 0.11) * TAU);
  value += 0.09 * Math.sin((wx * 4.0 + wy * 2.8 - time * 0.075) * TAU);
  return Math.max(-1.48, Math.min(1.42, value));
}

function drawFlowParticles(
  context: CanvasRenderingContext2D,
  options: PressureFrameOptions,
  values: Float32Array,
) {
  const {
    width,
    height,
    maskAlpha,
    time,
    deltaTime,
    variant,
    mode,
    particles,
  } = options;
  const config = pressureVariantConfig[variant];
  context.save();
  context.globalCompositeOperation = "screen";
  context.lineWidth = variant === "scanner" ? 0.95 : 0.72;

  for (const particle of particles) {
    const previousX = particle.x;
    const previousY = particle.y;
    const gradient = pressureGradient(particle.x, particle.y, time, mode);
    const vx = -gradient.y;
    const vy = gradient.x;
    const length = Math.hypot(vx, vy) || 1;
    const speed =
      config.particleSpeed *
      particle.speed *
      Math.min(0.04, Math.max(0.008, deltaTime));

    particle.x += (vx / length) * speed;
    particle.y += (vy / length) * speed;
    particle.age += deltaTime * 60;

    const maskIndex =
      Math.round(particle.y * (height - 1)) * width +
      Math.round(particle.x * (width - 1));
    if (
      particle.x <= 0.01 ||
      particle.x >= 0.99 ||
      particle.y <= 0.01 ||
      particle.y >= 0.99 ||
      particle.age > particle.life ||
      (maskAlpha[maskIndex] ?? 0) < 18
    ) {
      resetParticle(particle, values, width, height, maskAlpha);
      continue;
    }

    const fieldValue = pressureValue(particle.x, particle.y, time, mode);
    const alpha =
      config.particleAlpha *
      (0.45 + Math.min(0.55, Math.abs(fieldValue) * 0.42));
    context.strokeStyle =
      Math.abs(fieldValue) < 0.18
        ? `rgba(244, 241, 234, ${alpha * 0.85})`
        : fieldValue > 0.42
          ? `rgba(255, 210, 64, ${alpha})`
          : `rgba(0, 205, 230, ${alpha})`;
    context.beginPath();
    context.moveTo(previousX * width, previousY * height);
    context.lineTo(particle.x * width, particle.y * height);
    context.stroke();
  }

  context.restore();
}

function pressureGradient(
  x: number,
  y: number,
  time: number,
  mode: PressureMode,
) {
  const step = 0.012;
  const left = pressureValue(Math.max(0, x - step), y, time, mode);
  const right = pressureValue(Math.min(1, x + step), y, time, mode);
  const top = pressureValue(x, Math.max(0, y - step), time, mode);
  const bottom = pressureValue(x, Math.min(1, y + step), time, mode);
  return {
    x: (right - left) / (step * 2),
    y: (bottom - top) / (step * 2),
  };
}

function resetParticle(
  particle: PressureParticle,
  values: Float32Array,
  width: number,
  height: number,
  maskAlpha: Uint8ClampedArray,
) {
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const seedBase = particle.life + particle.age + attempt * 17;
    const x = seeded(seedBase);
    const y = seeded(seedBase + 31);
    const index =
      Math.round(y * (height - 1)) * width + Math.round(x * (width - 1));
    if ((maskAlpha[index] ?? 0) > 24 && Math.abs(values[index] ?? 0) > 0.18) {
      particle.x = x;
      particle.y = y;
      particle.age = 0;
      particle.life = 100 + seeded(seedBase + 53) * 160;
      return;
    }
  }

  particle.x = 0.5;
  particle.y = 0.5;
  particle.age = 0;
}

function bandForValue(value: number) {
  for (let index = 0; index < thresholds.length; index += 1) {
    if (value < thresholds[index]) {
      return index;
    }
  }
  return thresholds.length;
}

function colorForValue(value: number) {
  const band = bandForValue(value);
  const lowerThreshold = band === 0 ? -1.55 : thresholds[band - 1];
  const upperThreshold = band >= thresholds.length ? 1.55 : thresholds[band];
  const blendZone = 0.035;
  const position =
    (value - lowerThreshold) / Math.max(0.001, upperThreshold - lowerThreshold);

  if (position < blendZone && band > 0) {
    const mix = smoothstep(0, blendZone, position);
    return mixColor(bandPalette[band - 1], bandPalette[band], mix);
  }

  if (position > 1 - blendZone && band < bandPalette.length - 1) {
    const mix = smoothstep(1 - blendZone, 1, position);
    return mixColor(bandPalette[band], bandPalette[band + 1], mix);
  }

  return bandPalette[band];
}

function transitionFrontStrength(
  values: Float32Array,
  x: number,
  y: number,
  width: number,
  height: number,
  time: number,
) {
  if (x <= 0 || y <= 0 || x >= width - 1 || y >= height - 1) {
    return 0;
  }

  const index = y * width + x;
  const value = values[index] ?? 0;
  const dx = Math.abs(
    (values[index + 1] ?? value) - (values[index - 1] ?? value),
  );
  const dy = Math.abs(
    (values[index + width] ?? value) - (values[index - width] ?? value),
  );
  const gradient = Math.hypot(dx, dy);
  const transition = 1 - smoothstep(0.02, 0.56, Math.abs(value - 0.06));
  const thermalShear = smoothstep(0.1, 0.5, gradient);
  const nx = x / Math.max(1, width - 1);
  const ny = y / Math.max(1, height - 1);
  const ribbonCenter =
    0.48 +
    Math.sin((ny * 1.65 + time * 0.04) * TAU) * 0.052 +
    Math.sin((ny * 3.8 - time * 0.075) * TAU) * 0.026;
  const ribbon = 1 - smoothstep(0.018, 0.075, Math.abs(nx - ribbonCenter));
  const valueFront = transition * (0.22 + thermalShear * 0.78);
  return Math.max(valueFront, ribbon * (0.74 + thermalShear * 0.22));
}

function maskEdgeStrength(
  maskAlpha: Uint8ClampedArray,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  if (x <= 0 || y <= 0 || x >= width - 1 || y >= height - 1) {
    return 0;
  }

  const index = y * width + x;
  const center = maskAlpha[index] ?? 0;
  if (center < 16) {
    return 0;
  }

  const minNeighbor = Math.min(
    maskAlpha[index - 1] ?? center,
    maskAlpha[index + 1] ?? center,
    maskAlpha[index - width] ?? center,
    maskAlpha[index + width] ?? center,
    maskAlpha[index - width - 1] ?? center,
    maskAlpha[index - width + 1] ?? center,
    maskAlpha[index + width - 1] ?? center,
    maskAlpha[index + width + 1] ?? center,
  );
  return smoothstep(18, 150, center - minNeighbor);
}

function signalOverlay(
  x: number,
  y: number,
  width: number,
  height: number,
  time: number,
  variant: PressureVariant,
) {
  if (variant === "ambient") {
    return { red: 0, green: 0, blue: 0, alpha: 0 };
  }

  const density = variant === "scanner" ? 26 : variant === "hero" ? 32 : 40;
  const redGrid = gridLineStrength(x + time * 12, density, 0.72) * 0.52;
  const blueGrid = gridLineStrength(y - time * 8, density * 0.82, 0.7) * 0.42;
  const sweep =
    gridLineStrength(y - ((time * 32) % Math.max(1, height)), height, 1.35) *
    0.78;
  const alpha = Math.max(redGrid, blueGrid, sweep);

  if (alpha === sweep && sweep > 0.01) {
    return { red: 244, green: 241, blue: 234, alpha };
  }

  if (redGrid >= blueGrid) {
    return { red: 226, green: 27, blue: 35, alpha };
  }

  return { red: 33, green: 70, blue: 139, alpha };
}

function gridLineStrength(position: number, period: number, width: number) {
  const rest = modulo(position, period);
  const distance = Math.min(rest, period - rest);
  return 1 - smoothstep(0, width, distance);
}

function frontColor(value: number, x: number, y: number, time: number) {
  const coldTint =
    0.5 + Math.sin((x * 0.06 + y * 0.04 + time * 0.22) * TAU) * 0.5;
  const base = value < 0 ? [214, 250, 255] : [255, 246, 225];
  return mixColor(base, [255, 255, 248], 0.78 + coldTint * 0.14);
}

function edgeColor(value: number) {
  if (value < -0.28) {
    return [144, 232, 255] as const;
  }
  if (value > 0.52) {
    return [255, 92, 56] as const;
  }
  return [244, 241, 234] as const;
}

function mixColor(
  left: readonly [number, number, number],
  right: readonly [number, number, number],
  amount: number,
) {
  return [
    left[0] + (right[0] - left[0]) * amount,
    left[1] + (right[1] - left[1]) * amount,
    left[2] + (right[2] - left[2]) * amount,
  ] as const;
}

function screenColor(
  base: readonly [number, number, number],
  top: readonly [number, number, number],
  amount: number,
) {
  return [
    base[0] + (255 - base[0]) * (top[0] / 255) * amount,
    base[1] + (255 - base[1]) * (top[1] / 255) * amount,
    base[2] + (255 - base[2]) * (top[2] / 255) * amount,
  ] as const;
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const x = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return x * x * (3 - 2 * x);
}

function seeded(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function modulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor;
}

function clampByte(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

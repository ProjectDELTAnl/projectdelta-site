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
  phaseScale: number;
};

export const pressureVariantConfig: Record<PressureVariant, VariantConfig> = {
  ambient: {
    alpha: 0.44,
    contrast: 0.8,
    particleCount: 36,
    particleAlpha: 0.08,
    particleSpeed: 0.42,
    phaseScale: 0.45,
  },
  dossier: {
    alpha: 0.52,
    contrast: 0.88,
    particleCount: 52,
    particleAlpha: 0.1,
    particleSpeed: 0.46,
    phaseScale: 0.52,
  },
  hero: {
    alpha: 0.72,
    contrast: 1,
    particleCount: 96,
    particleAlpha: 0.13,
    particleSpeed: 0.58,
    phaseScale: 0.66,
  },
  scanner: {
    alpha: 0.82,
    contrast: 1.08,
    particleCount: 130,
    particleAlpha: 0.16,
    particleSpeed: 0.66,
    phaseScale: 0.78,
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
    amplitude: 0.66,
    radiusX: 0.13,
    radiusY: 0.13,
    phase: 11.2,
    speed: 0.33,
    driftX: 0.034,
    driftY: 0.038,
  },
];

const bandPalette = [
  [0, 38, 156],
  [0, 112, 220],
  [0, 190, 224],
  [0, 214, 154],
  [96, 204, 62],
  [242, 212, 59],
  [255, 139, 26],
  [226, 27, 35],
  [122, 0, 30],
] as const;

const thresholds = [-1.12, -0.82, -0.52, -0.2, 0.12, 0.46, 0.82, 1.16];

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

      const [red, green, blue] = colorForValue(values[index]);

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
  let value = x * 0.48 + y * 0.1 - 0.08 + modeBias;
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
    const dx = (x - cx) / center.radiusX;
    const dy = (y - cy) / center.radiusY;
    value += center.amplitude * Math.exp(-(dx * dx + dy * dy));
  }

  value += 0.2 * Math.sin((y * 2.75 + time * 0.06) * Math.PI * 2);
  value += 0.16 * Math.sin((x * 2.2 - y * 1.35 + time * 0.14) * Math.PI * 2);
  value += 0.1 * Math.sin((x * 4.1 + y * 2.6 - time * 0.09) * Math.PI * 2);
  return Math.max(-1.42, Math.min(1.38, value));
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
      fieldValue > 0.42
        ? `rgba(255, 222, 76, ${alpha})`
        : `rgba(0, 205, 224, ${alpha})`;
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
  const blendZone = 0.06;
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

function smoothstep(edge0: number, edge1: number, value: number) {
  const x = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return x * x * (3 - 2 * x);
}

function seeded(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function clampByte(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

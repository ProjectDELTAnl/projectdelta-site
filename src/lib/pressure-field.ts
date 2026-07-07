export type PressureVariant = "hero" | "scanner" | "dossier" | "ambient";

export type MapFilterId = string;

export type PressureLayerId =
  "veld" | "fronten" | "detail" | "raster" | "glow" | "sporen" | "crt";

export type PressureLayerState = Record<PressureLayerId, boolean>;

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

type PreparedPressureCenter = {
  cx: number;
  cy: number;
  amplitude: number;
  inverseRadiusX2: number;
  inverseRadiusY2: number;
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
  state: PressureFieldState;
  time: number;
  deltaTime: number;
  variant: PressureVariant;
  filter: MapFilterId;
  layers: PressureLayerState;
  particles: PressureParticle[];
};

export type PressureFieldState = {
  image: ImageData;
  values: Float32Array;
  normalX: Float32Array;
  normalY: Float32Array;
  activePixels: Uint32Array;
  activePixelX: Uint16Array;
  activePixelY: Uint16Array;
  maskAlpha: Uint8ClampedArray;
  edgeMap: Float32Array;
  color: Float32Array;
  effectColor: Float32Array;
};

type VariantConfig = {
  alpha: number;
  contrast: number;
  particleCount: number;
  particleAlpha: number;
  particleSpeed: number;
  edgeAlpha: number;
  frameIntervalMs: number;
  frontAlpha: number;
  phaseScale: number;
  timeScale: number;
};

export const pressureVariantConfig: Record<PressureVariant, VariantConfig> = {
  ambient: {
    alpha: 0.44,
    contrast: 0.8,
    particleCount: 36,
    particleAlpha: 0.08,
    particleSpeed: 0.42,
    edgeAlpha: 0.12,
    frameIntervalMs: 125,
    frontAlpha: 0.22,
    phaseScale: 0.45,
    timeScale: 0.52,
  },
  dossier: {
    alpha: 0.52,
    contrast: 0.88,
    particleCount: 52,
    particleAlpha: 0.1,
    particleSpeed: 0.46,
    edgeAlpha: 0.16,
    frameIntervalMs: 83,
    frontAlpha: 0.34,
    phaseScale: 0.52,
    timeScale: 0.6,
  },
  hero: {
    alpha: 0.72,
    contrast: 1,
    particleCount: 96,
    particleAlpha: 0.13,
    particleSpeed: 0.58,
    edgeAlpha: 0.24,
    frameIntervalMs: 50,
    frontAlpha: 0.82,
    phaseScale: 0.66,
    timeScale: 1.0,
  },
  scanner: {
    alpha: 0.82,
    contrast: 1.08,
    particleCount: 130,
    particleAlpha: 0.16,
    particleSpeed: 0.66,
    edgeAlpha: 0.3,
    frameIntervalMs: 34,
    frontAlpha: 0.92,
    phaseScale: 0.78,
    timeScale: 1.22,
  },
};

const filterBias: Record<string, number> = {
  stromen: -0.04,
  productie: 0.08,
  signaal: 0.02,
};

export const defaultPressureLayers: PressureLayerState = {
  veld: true,
  fronten: true,
  detail: true,
  raster: true,
  glow: true,
  sporen: true,
  crt: true,
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
    return { width: 170, height: 198 };
  }
  if (variant === "hero") {
    return { width: 150, height: 175 };
  }
  if (variant === "dossier") {
    return { width: 130, height: 152 };
  }
  return { width: 110, height: 128 };
}

export function frameIntervalMs(variant: PressureVariant) {
  return pressureVariantConfig[variant].frameIntervalMs;
}

export function timeScale(variant: PressureVariant) {
  return pressureVariantConfig[variant].timeScale;
}

export function createPressureFieldState(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  maskAlpha: Uint8ClampedArray,
): PressureFieldState {
  const pixelCount = width * height;
  const normalX = new Float32Array(pixelCount);
  const normalY = new Float32Array(pixelCount);
  const activePixels: number[] = [];
  const activePixelX: number[] = [];
  const activePixelY: number[] = [];

  // Deze waarden zijn pure rastergeometrie. Door ze eenmalig op te bouwen
  // hoeft de animatielus geen delingen en maskertests per frame te herhalen.
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      normalX[index] = x / Math.max(1, width - 1);
      normalY[index] = y / Math.max(1, height - 1);
      if ((maskAlpha[index] ?? 0) >= 12) {
        activePixels.push(index);
        activePixelX.push(x);
        activePixelY.push(y);
      }
    }
  }

  return {
    image: context.createImageData(width, height),
    values: new Float32Array(pixelCount),
    normalX,
    normalY,
    activePixels: Uint32Array.from(activePixels),
    activePixelX: Uint16Array.from(activePixelX),
    activePixelY: Uint16Array.from(activePixelY),
    maskAlpha,
    edgeMap: createMaskEdgeMap(maskAlpha, width, height),
    color: new Float32Array(3),
    effectColor: new Float32Array(3),
  };
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
  const { width, height, state, time, variant, filter, layers } = options;
  const config = pressureVariantConfig[variant];
  const {
    image,
    values,
    normalX,
    normalY,
    activePixels,
    activePixelX,
    activePixelY,
    maskAlpha,
    edgeMap,
    color,
    effectColor,
  } = state;
  const centers = preparePressureCenters(time);

  // Eerste pass: bereken het drukveld. Frontdetectie gebruikt buren, dus kleur
  // kan pas in de tweede pass betrouwbaar worden opgebouwd.
  for (let cursor = 0; cursor < activePixels.length; cursor += 1) {
    const index = activePixels[cursor];
    const value =
      pressureValue(normalX[index], normalY[index], time, filter, centers) *
      config.contrast;
    values[index] = value;
  }

  for (let cursor = 0; cursor < activePixels.length; cursor += 1) {
    const index = activePixels[cursor];
    const dataIndex = index * 4;
    const mask = maskAlpha[index] / 255;
    const value = values[index];

    if (layers.veld) {
      setColorForValue(value, color);
    } else {
      color[0] = 10;
      color[1] = 18;
      color[2] = 24;
    }

    const x = activePixelX[cursor];
    const y = activePixelY[cursor];
    const front = layers.fronten
      ? transitionFrontStrength(values, x, y, width, height, time)
      : 0;
    const edge = layers.glow ? (edgeMap[index] ?? 0) : 0;

    if (front > 0) {
      setFrontColor(value, x, y, time, effectColor);
      mixColorInto(
        color,
        effectColor,
        Math.min(0.88, front * config.frontAlpha),
      );
    }

    if (edge > 0) {
      setEdgeColor(value, effectColor);
      screenColorInto(
        color,
        effectColor,
        Math.min(0.55, edge * config.edgeAlpha),
      );
    }

    image.data[dataIndex] = clampByte(color[0]);
    image.data[dataIndex + 1] = clampByte(color[1]);
    image.data[dataIndex + 2] = clampByte(color[2]);
    image.data[dataIndex + 3] = clampByte(255 * config.alpha * mask);
  }

  context.putImageData(image, 0, 0);
  if (layers.sporen) {
    drawFlowParticles(context, options, values, centers);
  }
}

export function pressureValue(
  x: number,
  y: number,
  time: number,
  filter: MapFilterId,
  centers = preparePressureCenters(time),
) {
  // Filters zijn esthetische DELTA-lenzen, geen meetdata. De bias stuurt het
  // synthetische veld subtiel richting infrastructuur/productie/signaal.
  const filterOffset = filterBias[filter] ?? 0.02;
  const warpA = Math.sin((x * 1.7 + y * 1.15 + time * 0.07) * TAU);
  const warpB = Math.cos((x * 2.55 - y * 1.45 - time * 0.055) * TAU);
  const warpC = Math.sin((x * 3.1 + y * 2.35 + time * 0.035) * TAU);
  const wx = clamp01(x + warpA * 0.026 + warpB * 0.014);
  const wy = clamp01(y + warpB * 0.022 - warpC * 0.013);
  let value = wx * 0.58 + wy * 0.16 - 0.2 + filterOffset;

  for (const center of centers) {
    const dx = wx - center.cx;
    const dy = wy - center.cy;
    value +=
      center.amplitude *
      Math.exp(
        -(dx * dx * center.inverseRadiusX2 + dy * dy * center.inverseRadiusY2),
      );
  }

  value += 0.18 * Math.sin((wy * 2.55 + time * 0.055) * TAU);
  value += 0.14 * Math.sin((wx * 2.45 - wy * 1.3 + time * 0.11) * TAU);
  value += 0.09 * Math.sin((wx * 4.0 + wy * 2.8 - time * 0.075) * TAU);
  return Math.max(-1.48, Math.min(1.42, value));
}

function preparePressureCenters(time: number): PreparedPressureCenter[] {
  const slowTime = time * 0.1;
  return pressureCenters.map((center) => {
    const cx =
      center.x +
      Math.sin(time * center.speed + center.phase) * center.driftX +
      Math.sin(slowTime + center.phase * 0.7) * center.driftX * 0.5;
    const cy =
      center.y +
      Math.cos(time * center.speed * 0.9 + center.phase) * center.driftY +
      Math.sin(slowTime * 1.3 + center.phase) * center.driftY * 0.45;
    return {
      cx,
      cy,
      amplitude: center.amplitude,
      inverseRadiusX2: 1 / (center.radiusX * center.radiusX),
      inverseRadiusY2: 1 / (center.radiusY * center.radiusY),
    };
  });
}

function drawFlowParticles(
  context: CanvasRenderingContext2D,
  options: PressureFrameOptions,
  values: Float32Array,
  centers: PreparedPressureCenter[],
) {
  const { width, height, state, time, deltaTime, variant, filter, particles } =
    options;
  const { maskAlpha } = state;
  const config = pressureVariantConfig[variant];
  context.save();
  context.globalCompositeOperation = "screen";
  context.lineWidth = variant === "scanner" ? 0.95 : 0.72;

  for (const particle of particles) {
    const previousX = particle.x;
    const previousY = particle.y;
    const gradient = pressureGradient(
      particle.x,
      particle.y,
      time,
      filter,
      centers,
    );
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

    const fieldValue = pressureValue(
      particle.x,
      particle.y,
      time,
      filter,
      centers,
    );
    const alpha =
      config.particleAlpha *
      (0.45 + Math.min(0.55, Math.abs(fieldValue) * 0.42));
    context.strokeStyle =
      Math.abs(fieldValue) < 0.18
        ? `rgba(244, 241, 234, ${alpha * 0.85})`
        : fieldValue > 0.42
          ? `rgba(255, 216, 77, ${alpha})`
          : `rgba(33, 70, 139, ${alpha})`;
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
  filter: MapFilterId,
  centers: PreparedPressureCenter[],
) {
  const step = 0.012;
  const left = pressureValue(Math.max(0, x - step), y, time, filter, centers);
  const right = pressureValue(Math.min(1, x + step), y, time, filter, centers);
  const top = pressureValue(x, Math.max(0, y - step), time, filter, centers);
  const bottom = pressureValue(x, Math.min(1, y + step), time, filter, centers);
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

function setColorForValue(value: number, target: Float32Array) {
  const band = bandForValue(value);
  const lowerThreshold = band === 0 ? -1.55 : thresholds[band - 1];
  const upperThreshold = band >= thresholds.length ? 1.55 : thresholds[band];
  const blendZone = 0.035;
  const position =
    (value - lowerThreshold) / Math.max(0.001, upperThreshold - lowerThreshold);

  if (position < blendZone && band > 0) {
    setMixedColor(
      bandPalette[band - 1],
      bandPalette[band],
      smoothstep(0, blendZone, position),
      target,
    );
    return;
  }

  if (position > 1 - blendZone && band < bandPalette.length - 1) {
    setMixedColor(
      bandPalette[band],
      bandPalette[band + 1],
      smoothstep(1 - blendZone, 1, position),
      target,
    );
    return;
  }

  target[0] = bandPalette[band][0];
  target[1] = bandPalette[band][1];
  target[2] = bandPalette[band][2];
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

function createMaskEdgeMap(
  maskAlpha: Uint8ClampedArray,
  width: number,
  height: number,
) {
  const edgeMap = new Float32Array(width * height);

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const center = maskAlpha[index] ?? 0;
      if (center < 16) {
        continue;
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
      edgeMap[index] = smoothstep(18, 150, center - minNeighbor);
    }
  }

  return edgeMap;
}

function setFrontColor(
  value: number,
  x: number,
  y: number,
  time: number,
  target: Float32Array,
) {
  const coldTint =
    0.5 + Math.sin((x * 0.06 + y * 0.04 + time * 0.22) * TAU) * 0.5;
  const base: readonly [number, number, number] =
    value < 0 ? [214, 250, 255] : [255, 246, 225];
  setMixedColor(base, [255, 255, 248], 0.78 + coldTint * 0.14, target);
}

function setEdgeColor(value: number, target: Float32Array) {
  if (value < -0.28) {
    target[0] = 144;
    target[1] = 232;
    target[2] = 255;
    return;
  }
  if (value > 0.52) {
    target[0] = 255;
    target[1] = 92;
    target[2] = 56;
    return;
  }
  target[0] = 244;
  target[1] = 241;
  target[2] = 234;
}

function setMixedColor(
  left: readonly [number, number, number],
  right: readonly [number, number, number],
  amount: number,
  target: Float32Array,
) {
  target[0] = left[0] + (right[0] - left[0]) * amount;
  target[1] = left[1] + (right[1] - left[1]) * amount;
  target[2] = left[2] + (right[2] - left[2]) * amount;
}

function mixColorInto(base: Float32Array, top: Float32Array, amount: number) {
  base[0] += (top[0] - base[0]) * amount;
  base[1] += (top[1] - base[1]) * amount;
  base[2] += (top[2] - base[2]) * amount;
}

function screenColorInto(
  base: Float32Array,
  top: Float32Array,
  amount: number,
) {
  base[0] += (255 - base[0]) * (top[0] / 255) * amount;
  base[1] += (255 - base[1]) * (top[1] / 255) * amount;
  base[2] += (255 - base[2]) * (top[2] / 255) * amount;
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

function clampByte(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

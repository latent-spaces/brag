// Shared color math for the measurement scripts.

export function srgbToLab([r, g, b]) {
  const f = (v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const [R, G, B] = [f(r), f(g), f(b)];
  let x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  let y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  let z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const t = (v) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116);
  [x, y, z] = [t(x), t(y), t(z)];
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

export function deltaE(a, b) {
  const [L1, A1, B1] = srgbToLab(a);
  const [L2, A2, B2] = srgbToLab(b);
  return Math.hypot(L1 - L2, A1 - A2, B1 - B2);
}

export function hex([r, g, b]) {
  return (
    "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")
  );
}

export function parseHex(s) {
  return [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
}

// Hue (degrees), HSV saturation, and HSL lightness. HSV saturation is used for
// accent detection because HSL saturation blows up for near-white colors.
export function hsv([r, g, b]) {
  (r /= 255), (g /= 255), (b /= 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  const l = (max + min) / 2;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  return [(h + 360) % 360, s, l];
}

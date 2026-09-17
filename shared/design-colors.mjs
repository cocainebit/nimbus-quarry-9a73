// Hex-only color arithmetic. No CSS supplied by a provider is executed.
const rgb = (hex) =>
  hex
    .slice(1)
    .match(/../g)
    .map((v) => parseInt(v, 16));
export function luminance(hex) {
  const c = rgb(hex).map((n) => {
    const v = n / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
}
export function contrastRatio(a, b) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
export function readableText(background) {
  return contrastRatio(background, "#ffffff") >=
    contrastRatio(background, "#000000")
    ? "#ffffff"
    : "#000000";
}
export function mixColors(a, b, amount) {
  const x = rgb(a),
    y = rgb(b);
  return (
    "#" +
    x
      .map((n, i) =>
        Math.round(n * (1 - amount) + y[i] * amount)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

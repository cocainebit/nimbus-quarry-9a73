export const templateFonts = [
  { id: "inter", name: "Inter", family: "Plotform Inter" },
  {
    id: "playfair-display",
    name: "Playfair Display",
    family: "Plotform Playfair",
  },
  { id: "dm-sans", name: "DM Sans", family: "Plotform DM Sans" },
  { id: "manrope", name: "Manrope", family: "Plotform Manrope" },
  { id: "jetbrains-mono", name: "JetBrains Mono", family: "Plotform Mono" },
];
export const editableStyleProperties = [
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "text-align",
  "color",
] as const;
export function validElementStyle(key: string, value: string) {
  if (key === "font-family")
    return templateFonts.some((f) => value === `"${f.family}"`);
  if (key === "font-size")
    return (
      /^(?:1[0-9]|[2-9][0-9]|1[0-5][0-9]|160)px$/.test(value) ||
      /^clamp\(24px, 8vw, (?:[3-9][0-9]|1[0-5][0-9]|160)px\)$/.test(value)
    );
  if (key === "font-weight") return /^(300|400|500|600|700|800)$/.test(value);
  if (key === "line-height")
    return /^(1(?:\.[0-9]{1,2})?|2(?:\.0)?)$/.test(value);
  if (key === "letter-spacing")
    return /^-?0\.[0-9]{1,2}em$/.test(value) || value === "0em";
  if (key === "text-align") return ["left", "center", "right"].includes(value);
  if (key === "color") return /^#[a-f0-9]{6}$/i.test(value);
  return false;
}
export function usedTemplateFonts(edits: Record<string, string>) {
  return templateFonts.filter((f) =>
    Object.entries(edits).some(
      ([k, v]) => k.endsWith("::style.font-family") && v === `"${f.family}"`,
    ),
  );
}
export function templateFontCss(edits: Record<string, string>, base: string) {
  return usedTemplateFonts(edits)
    .map(
      (f) =>
        `@font-face{font-family:"${f.family}";font-style:normal;font-weight:100 900;font-display:swap;src:url("${base}${f.id}.woff2") format("woff2")}`,
    )
    .join("\n");
}

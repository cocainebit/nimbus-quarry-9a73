import { z } from "zod";
import { layoutIds } from "./app-layouts.mjs";
import { thirdPartyPresets } from "./design-presets.generated.mjs";
import {
  contrastRatio,
  readableText,
  mixColors,
  luminance,
} from "./design-colors.mjs";
export const fontOptions = [
  { value: "sans", label: "Geist — modern sans" },
  { value: "serif", label: "Georgia — classic serif" },
  { value: "mono", label: "System monospace" },
  { value: "inter", label: "Inter — clear UI" },
  { value: "dm-sans", label: "DM Sans — geometric" },
  { value: "manrope", label: "Manrope — rounded" },
  { value: "playfair", label: "Playfair Display — editorial" },
  { value: "jetbrains", label: "JetBrains Mono — technical" },
];
const fontSchema = z.enum([
  "sans",
  "serif",
  "mono",
  "inter",
  "dm-sans",
  "manrope",
  "playfair",
  "jetbrains",
]);
const fontStacks = {
  sans: "'Geist Variable', sans-serif",
  serif: "Georgia, serif",
  mono: "ui-monospace, monospace",
  inter: "'Inter Variable', sans-serif",
  "dm-sans": "'DM Sans Variable', sans-serif",
  manrope: "'Manrope Variable', sans-serif",
  playfair: "'Playfair Display Variable', serif",
  jetbrains: "'JetBrains Mono Variable', monospace",
};
const color = z.string().regex(/^#[0-9a-f]{6}$/i);
export const dashboardWidgetSchema = z
  .object({
    id: z.string().min(1).max(100),
    title: z.string().min(1).max(80),
    type: z.enum(["count", "sum", "group", "recent"]),
    collectionId: z.string().min(1).max(100),
    field: z.string().max(40).optional(),
    limit: z.number().int().min(1).max(10).default(5),
  })
  .superRefine((w, ctx) => {
    if (["sum", "group"].includes(w.type) && !w.field)
      ctx.addIssue({
        code: "custom",
        path: ["field"],
        message: "Choose a field for this widget.",
      });
  });
export const appDesignSchema = z
  .object({
    palette: z.object({
      primary: color,
      background: color,
      surface: color,
      text: color,
      muted: color,
      border: color,
    }),
    font: fontSchema.default("sans"),
    headingFont: fontSchema.optional(),
    layout: z.enum(layoutIds).default("dashboard"),
    radius: z.number().min(0).max(24).default(12),
    density: z.enum(["comfortable", "compact"]).default("comfortable"),
    navigation: z.enum(["sidebar", "topbar"]).default("sidebar"),
    heading: z.string().max(160).default("Your workspace, at a glance."),
    widgets: z.array(dashboardWidgetSchema).max(12).default([]),
  })
  .refine(
    (d) => new Set(d.widgets.map((w) => w.id)).size === d.widgets.length,
    { message: "Widget IDs must be unique.", path: ["widgets"] },
  );
const originalPresets = [
  {
    name: "Botanical",
    description: "Warm, calm, editorial",
    palette: {
      primary: "#315441",
      background: "#f4f5ef",
      surface: "#ffffff",
      text: "#24372b",
      muted: "#687667",
      border: "#dce3d7",
    },
    font: "sans",
    radius: 14,
    density: "comfortable",
    navigation: "sidebar",
  },
  {
    name: "Studio",
    description: "Confident violet, sharp detail",
    palette: {
      primary: "#6552cf",
      background: "#f5f4fa",
      surface: "#ffffff",
      text: "#29253e",
      muted: "#756f87",
      border: "#e4e0ef",
    },
    font: "sans",
    radius: 10,
    density: "comfortable",
    navigation: "sidebar",
  },
  {
    name: "Editorial",
    description: "Paper, ink, open space",
    palette: {
      primary: "#96402c",
      background: "#f5f1e9",
      surface: "#fffcf7",
      text: "#332d27",
      muted: "#7b7166",
      border: "#e1d8cb",
    },
    font: "serif",
    radius: 4,
    density: "comfortable",
    navigation: "topbar",
  },
  {
    name: "Terminal",
    description: "Dense data, crisp contrast",
    palette: {
      primary: "#20755e",
      background: "#edf2f0",
      surface: "#ffffff",
      text: "#18332b",
      muted: "#61756e",
      border: "#cfdcd7",
    },
    font: "mono",
    radius: 2,
    density: "compact",
    navigation: "sidebar",
  },
];
export const designPresets = [
  ...originalPresets.map((p) => ({
    ...p,
    id: `studio-${p.name.toLowerCase()}`,
    source: "Plotform",
    mode: "light",
  })),
  ...thirdPartyPresets,
];
export function applyDesignPreset(design, preset) {
  const current = appDesignSchema.parse(design);
  return appDesignSchema.parse({
    ...current,
    palette: preset.palette,
    font: preset.font,
    headingFont: preset.headingFont,
    radius: preset.radius,
  });
}
export function createDashboardWidgets(collections) {
  const widgets = [];
  for (const c of collections) {
    widgets.push({
      id: `auto-${c.id}-count`,
      title: c.name,
      type: "count",
      collectionId: c.id,
      limit: 5,
    });
    const category = c.fields.find((f) => f.type === "enum");
    if (category)
      widgets.push({
        id: `auto-${c.id}-group-${category.name}`,
        title: `${c.name}: ${category.label}`,
        type: "group",
        collectionId: c.id,
        field: category.name,
        limit: 5,
      });
    const number = c.fields.find((f) => f.type === "number");
    if (number)
      widgets.push({
        id: `auto-${c.id}-sum-${number.name}`,
        title: `Total ${number.label}`,
        type: "sum",
        collectionId: c.id,
        field: number.name,
        limit: 5,
      });
  }
  return widgets.slice(0, 12).map((w) =>
    dashboardWidgetSchema.parse({
      ...w,
      title: w.title.slice(0, 80),
      id: w.id.slice(0, 100),
    }),
  );
}
export function getAppDesign(app) {
  return appDesignSchema.parse(
    app?.design || {
      ...designPresets[app?.template === "crm" ? 1 : 0],
      heading: app?.title || "Your workspace, at a glance.",
      widgets: [],
    },
  );
}
export function designVariables(design) {
  const d = appDesignSchema.parse(design);
  return {
    "--app-primary": d.palette.primary,
    "--app-background": d.palette.background,
    "--app-surface": d.palette.surface,
    "--app-ink": d.palette.text,
    "--app-muted": d.palette.muted,
    "--app-line": d.palette.border,
    "--app-radius": `${d.radius}px`,
    "--app-space": d.density === "compact" ? "12px" : "22px",
    "--app-font": fontStacks[d.font],
    "--app-heading-font": fontStacks[d.headingFont || d.font],
    "--app-on-primary": readableText(d.palette.primary),
    "--app-soft": mixColors(d.palette.surface, d.palette.text, 0.06),
    "--app-accent-surface": mixColors(
      d.palette.surface,
      d.palette.primary,
      0.12,
    ),
    "--app-accent-text":
      contrastRatio(
        d.palette.primary,
        mixColors(d.palette.surface, d.palette.primary, 0.12),
      ) >= 4.5
        ? d.palette.primary
        : d.palette.text,
    "--app-color-scheme":
      luminance(d.palette.background) < 0.18 ? "dark" : "light",
  };
}
export function summarizeWidget(widget, records) {
  if (widget.type === "count") return records.length;
  if (widget.type === "sum")
    return records.reduce(
      (n, r) =>
        n +
        (typeof r.data[widget.field] === "number" &&
        Number.isFinite(r.data[widget.field])
          ? r.data[widget.field]
          : 0),
      0,
    );
  if (widget.type === "group") {
    const groups = new Map();
    for (const r of records) {
      const key = String(r.data[widget.field] ?? "Unspecified");
      groups.set(key, (groups.get(key) || 0) + 1);
    }
    return [...groups].sort((a, b) => b[1] - a[1]).slice(0, widget.limit);
  }
  return records.slice(0, widget.limit);
}

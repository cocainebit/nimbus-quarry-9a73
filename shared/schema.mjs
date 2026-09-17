import { z } from "zod";
import { appDesignSchema } from "./app-design.mjs";
export const kindValues = [
  "hero",
  "features",
  "story",
  "testimonials",
  "cta",
  "contact",
  "pricing",
  "faq",
  "gallery",
  "team",
  "stats",
  "logos",
];
const text = (max = 500) => z.string().max(max);
export function safeLink(value = "") {
  return /^(https?:\/\/|mailto:|tel:|#|page:)/i.test(value) &&
    !/[\u0000-\u0020<>"']/u.test(value)
    ? value
    : "";
}
export function safeImage(value = "") {
  return /^https?:\/\/[^\s<>"']+$/i.test(value) ||
    /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(value)
    ? value
    : "";
}
const link = text(2000).refine(
  (v) => !v || !!safeLink(v),
  "Use an https, mailto, tel, section anchor or page link.",
);
const image = text(3_000_000).refine(
  (v) => !v || !!safeImage(v),
  "Use an image URL or upload a PNG, JPEG, WebP or GIF.",
);
export const itemSchema = z.object({
  title: text(200).default(""),
  body: text(3000).default(""),
  image: image.default(""),
  alt: text(200).default(""),
  label: text(100).default(""),
  href: link.default(""),
  price: text(80).default(""),
});
export const sectionSchema = z.object({
  id: text(100).min(1),
  kind: z.enum(kindValues),
  title: text(300),
  body: text(6000),
  eyebrow: text(120).default(""),
  variant: z.enum(["split", "centered", "reverse"]).default("split"),
  tone: z.enum(["default", "accent", "dark"]).default("default"),
  spacing: z.enum(["compact", "normal", "spacious"]).default("normal"),
  buttonLabel: text(100).default(""),
  buttonHref: link.default(""),
  image: image.default(""),
  imageAlt: text(200).default(""),
  items: z.array(itemSchema).max(30).default([]),
});
export const pageSchema = z.object({
  id: text(100).min(1),
  name: text(100).min(1),
  slug: z
    .string()
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  seoTitle: text(200).default(""),
  description: text(400).default(""),
  hideNav: z.boolean().default(false),
  sections: z.array(sectionSchema).max(80),
  position: z.object({ x: z.number().finite(), y: z.number().finite() }),
});
export const appSchema = z
  .object({
    template: z.enum(["portal", "crm", "tracker"]),
    title: z.string().max(100),
    description: z.string().max(400),
    navigation: z
      .array(
        z
          .object({
            collectionId: z.string().min(1).max(100),
            label: z.string().min(1).max(80),
            view: z.enum(["table", "board", "cards"]),
            statusField: z.string().max(40).optional(),
            visibleFields: z
              .array(z.string().min(1).max(40))
              .max(40)
              .optional(),
            fieldLabels: z
              .record(z.string().max(40), z.string().min(1).max(100))
              .optional(),
          })
          .strict(),
      )
      .max(20),
    design: appDesignSchema.optional(),
  })
  .strict();
export const projectSchema = z
  .object({
    version: z.literal(2).default(2),
    app: appSchema.optional(),
    nativeTemplate: z
      .object({
        id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/),
        page: z.string().regex(/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*\.html$/),
        customCss: z.string().max(50000).optional(),
        edits: z
          .record(z.string().max(240), z.string().max(6000))
          .refine((v) => Object.keys(v).length <= 5000)
          .default({}),
      })
      .strict()
      .optional(),
    id: text(100).min(1),
    name: text(100).min(1),
    brief: text(6000),
    updated: z.string(),
    source: z.enum(["demo", "ai"]),
    pages: z.array(pageSchema).min(1).max(40),
    theme: z.object({
      accent: z.string().regex(/^#[a-f0-9]{6}$/i),
      background: z.string().regex(/^#[a-f0-9]{6}$/i),
      font: z.enum(["sans-serif", "Georgia, serif", "monospace"]),
      radius: z.number().min(0).max(32),
    }),
    settings: z
      .object({
        email: text(200)
          .refine(
            (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
            "Enter a valid email.",
          )
          .default(""),
        phone: text(80).default(""),
        footer: text(500).default(""),
        siteUrl: z
          .string()
          .max(2000)
          .refine(
            (v) => !v || /^https?:\/\/[^\s?#]+$/.test(v),
            "Use your full website URL.",
          )
          .default(""),
      })
      .default({}),
  })
  .superRefine((p, ctx) => {
    for (const [label, values] of [
      ["Page IDs", p.pages.map((x) => x.id)],
      ["Section IDs", p.pages.flatMap((x) => x.sections.map((s) => s.id))],
    ])
      if (new Set(values).size !== values.length)
        ctx.addIssue({ code: "custom", message: `${label} must be unique.` });
  });
export function pageFiles(project) {
  const used = new Set([
    "index",
    "styles",
    "site",
    "server",
    "package",
    "project",
    "sitemap",
    "robots",
  ]);
  return project.pages.map((p, i) => {
    if (i === 0) return "index.html";
    const base = p.slug || `page-${i}`;
    let slug = base,
      n = 2;
    while (used.has(slug)) slug = `${base}-${n++}`;
    used.add(slug);
    return `${slug}.html`;
  });
}
export function resolveLink(link, project) {
  if (link?.startsWith("page:")) {
    const i = project.pages.findIndex((p) => p.id === link.slice(5));
    return i >= 0 ? pageFiles(project)[i] : "";
  }
  return safeLink(link);
}
export function projectIssues(project) {
  const issues = [];
  project.pages.forEach((p, i) => {
    if (!p.sections.length) issues.push(`${p.name}: page has no sections.`);
    if (!p.description) issues.push(`${p.name}: add a search description.`);
    p.sections.forEach((s) => {
      if (!s.title.trim()) issues.push(`${p.name}: a section needs a heading.`);
      for (const item of [s, ...s.items]) {
        const image = item.image;
        if (image && !(item.imageAlt || item.alt))
          issues.push(`${p.name}: an image needs alt text.`);
        const href = item.buttonHref || item.href;
        if ((item.buttonLabel || item.label) && !href)
          issues.push(`${p.name}: a button needs a destination.`);
        if (href?.startsWith("page:") && !resolveLink(href, project))
          issues.push(`${p.name}: a button points to a deleted page.`);
        if (
          href?.startsWith("#") &&
          href !== "#site-contact" &&
          !p.sections.some((section) => `#section-${section.id}` === href)
        )
          issues.push(`${p.name}: a button points to an unknown section.`);
      }
      if (s.buttonLabel && !s.buttonHref)
        issues.push(`${p.name}: “${s.buttonLabel}” needs a destination.`);
    });
  });
  return [...new Set(issues)];
}

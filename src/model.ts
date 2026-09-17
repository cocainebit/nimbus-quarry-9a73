import { createWebsiteStarterProject } from "../shared/website-starters.mjs";
import { projectSchema, sectionSchema, kindValues } from "../shared/schema.mjs";
import type { z } from "zod";
export type Project = z.infer<typeof projectSchema>;
export type Page = Project["pages"][number];
export type Section = z.infer<typeof sectionSchema>;
export type SectionItem = Section["items"][number];
export const uid = () => crypto.randomUUID();
export const kinds = kindValues as Section["kind"][];
export const sectionLabels: Record<string, string> = {
  hero: "Hero",
  features: "Features",
  story: "Image & text",
  testimonials: "Testimonials",
  cta: "Call to action",
  contact: "Contact form",
  pricing: "Pricing plans",
  faq: "Questions & answers",
  gallery: "Image gallery",
  team: "Team",
  stats: "Key numbers",
  logos: "Client / partner logos",
};
export function normalizeProject(value: unknown): Project {
  const parsed = projectSchema.safeParse(value);
  if (!parsed.success)
    throw new Error(
      parsed.error.issues
        .slice(0, 3)
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; "),
    );
  return parsed.data;
}
export function makeSection(
  kind: Section["kind"],
  title?: string,
  body?: string,
): Section {
  const copy: Record<string, string[]> = {
    pricing: ["Find your fit.", "Choose the option that works for you."],
    faq: [
      "A few things you might be wondering.",
      "Clear answers, before you get started.",
    ],
    gallery: [
      "Our work, up close.",
      "A selection of projects and the stories behind them.",
    ],
    team: ["The people behind the work.", "Meet the team."],
    stats: ["By the numbers.", "Add verified figures that tell your story."],
    logos: ["In good company.", "Add client or partner logos with permission."],
    hero: [
      "A fresh perspective. A better way forward.",
      "Thoughtfully designed for people who expect a little more. Discover what we can create together.",
    ],
    features: [
      "Small details. Meaningful differences.",
      "Personal attention • Thoughtful design • Lasting quality",
    ],
    story: [
      "Good things start with a conversation.",
      "We are an independent team with a shared belief: the best work comes from caring deeply about the details.",
    ],
    testimonials: [
      "Made for people like you.",
      "“A thoughtful experience from the very first conversation.” — Sample testimonial; replace before publishing.",
    ],
    cta: [
      "Let’s make something great.",
      "Tell us what you have in mind. We would love to hear your story.",
    ],
    contact: [
      "Say hello.",
      "Get in touch to learn more about our work and how we can help. Add your contact details before publishing.",
    ],
  };
  const items = [
    "features",
    "pricing",
    "faq",
    "gallery",
    "team",
    "stats",
    "logos",
    "testimonials",
  ].includes(kind)
    ? Array.from({ length: kind === "faq" ? 4 : 3 }, (_, i) => ({
        title:
          kind === "faq"
            ? `Question ${i + 1}`
            : kind === "pricing"
              ? ["Essential", "Professional", "Enterprise"][i]
              : kind === "stats"
                ? "Your metric"
                : `Item ${i + 1}`,
        body:
          kind === "faq"
            ? "Write a clear, helpful answer here."
            : kind === "pricing"
              ? "Add what is included, one benefit per line."
              : "Replace with your own content.",
        label: kind === "pricing" ? "Get started" : "",
        price: kind === "pricing" ? "Add price" : "",
        href: "",
        image: "",
        alt: "",
      }))
    : [];
  return sectionSchema.parse({
    id: uid(),
    kind,
    title: title ?? copy[kind][0],
    body: body ?? copy[kind][1],
    items,
    buttonLabel: ["hero", "cta"].includes(kind) ? "Get in touch" : "",
    buttonHref: ["hero", "cta"].includes(kind) ? "#site-contact" : "",
  });
}
export function demoProject(
  name: string,
  brief: string,
  starterId?: string,
): Project {
  return createWebsiteStarterProject(name, brief, starterId);
}
export function initialProjects(): Project[] {
  const a = demoProject(
    "Forma Studio",
    "An independent architecture studio. Warm, editorial and considered. Pages: Home, Projects, Studio, Contact.",
  );
  a.pages[0].sections[0] = {
    ...a.pages[0].sections[0],
    title: "Spaces for a slower kind of living.",
    body: "Architecture and interiors that bring you closer to what matters. Thoughtful spaces, made for everyday life.",
  };
  const b = demoProject(
    "Morrow",
    "A modern wellness brand. Pages: Home, Our approach, Journal, Contact.",
  );
  b.theme.accent = "#ded2ef";
  b.pages[0].sections[0].title = "A little more room for you.";
  return [a, b];
}

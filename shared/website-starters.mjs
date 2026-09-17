import { projectSchema, sectionSchema } from "./schema.mjs";
/** Curated website content, not AI inference. Business-specific facts are deliberately left for the owner. */
export const websiteStarters = [
  {
    id: "architecture",
    name: "Architecture & interiors",
    description:
      "Quiet serif typography, warm stone tones, and project-led storytelling.",
    theme: {
      accent: "#c7ad85",
      background: "#f5f1e9",
      font: "Georgia, serif",
      radius: 0,
    },
    hero: {
      title: "Spaces shaped around the way you live.",
      body: "A place for considered architecture, material choices, and the details that make a space your own.",
      eyebrow: "ARCHITECTURE & INTERIORS",
      variant: "reverse",
      tone: "default",
      spacing: "spacious",
      buttonLabel: "Discuss a space",
    },
    homeSections: ["hero", "gallery", "story", "features", "cta"],
    defaultPages: ["Home", "Projects", "Studio", "Contact"],
    features: [
      "Residential architecture",
      "Interior direction",
      "Material studies",
    ],
    featureTitle: "From the first sketch to the final detail.",
    storyTitle: "A conversation between place and purpose.",
    storyBody:
      "Use this space to explain your approach to context, light, materials, and the people who will use each building.",
    gallery: ["Residential project", "Interior study", "Public space"],
    cta: "What kind of space are you imagining?",
  },
  {
    id: "saas",
    name: "Software & SaaS",
    description:
      "Crisp blue product pages, a centered introduction, and clear feature and pricing paths.",
    theme: {
      accent: "#84b7f4",
      background: "#f4f7fc",
      font: "sans-serif",
      radius: 16,
    },
    hero: {
      title: "Less busywork. More room to build.",
      body: "Introduce the problem your product solves, show how it works, and help visitors decide whether it fits their team.",
      eyebrow: "YOUR PRODUCT, EXPLAINED",
      variant: "centered",
      tone: "dark",
      spacing: "spacious",
      buttonLabel: "Ask about the product",
    },
    homeSections: ["hero", "features", "story", "faq", "cta"],
    defaultPages: ["Home", "Product", "Pricing", "Contact"],
    features: [
      "A clear workspace",
      "A connected process",
      "A useful next step",
    ],
    featureTitle: "Show the product behind the promise.",
    storyTitle: "Make your workflow easier to understand.",
    storyBody:
      "Add a real product screenshot and describe the steps your customers can take. Only promise features that are available.",
    gallery: ["Workspace overview", "Workflow detail", "Product walkthrough"],
    cta: "See where your product could take a team.",
  },
  {
    id: "wellness",
    name: "Wellness & wellbeing",
    description:
      "Soft lavender, generous space, and a gentle introduction to your practice.",
    theme: {
      accent: "#d4c2e6",
      background: "#faf6f8",
      font: "Georgia, serif",
      radius: 24,
    },
    hero: {
      title: "Make a little space for yourself.",
      body: "Discover a slower rhythm, a welcoming practice, and time set aside for the things that support your everyday wellbeing.",
      eyebrow: "A MORE CONSIDERED EVERYDAY",
      variant: "centered",
      tone: "accent",
      spacing: "spacious",
      buttonLabel: "Find your starting point",
    },
    homeSections: ["hero", "story", "features", "faq", "cta"],
    defaultPages: ["Home", "Our approach", "Sessions", "Contact"],
    features: [
      "Individual sessions",
      "Small-group practice",
      "Everyday resources",
    ],
    featureTitle: "A practice that meets you where you are.",
    storyTitle: "A little attention can change the shape of a day.",
    storyBody:
      "Introduce your practice, describe what a session involves, and add your actual training and qualifications before publishing.",
    gallery: [
      "Your practice space",
      "A moment of stillness",
      "Tools for everyday practice",
    ],
    cta: "Take the first step at your own pace.",
  },
  {
    id: "studio",
    name: "Creative studio",
    description:
      "Warm coral accents, confident type, and a flexible four-section studio homepage.",
    theme: {
      accent: "#ed9d87",
      background: "#fff9f3",
      font: "sans-serif",
      radius: 8,
    },
    hero: {
      title: "Distinct ideas. Clearly expressed.",
      body: "Bring your next brand, website, or creative project into focus. Start with a good question and make something worth paying attention to.",
      eyebrow: "INDEPENDENT CREATIVE PRACTICE",
      variant: "split",
      tone: "accent",
      spacing: "spacious",
      buttonLabel: "Tell us about your project",
    },
    homeSections: ["hero", "features", "story", "cta"],
    defaultPages: ["Home", "About", "Services", "Contact"],
    features: ["Brand direction", "Website design", "Editorial design"],
    featureTitle: "Give your ideas a form of their own.",
    storyTitle: "Good work begins with a clear point of view.",
    storyBody:
      "Introduce your studio and explain how you turn a brief into a creative direction. Add your own process, people, and selected work.",
    gallery: ["Brand identity project", "Website project", "Editorial project"],
    cta: "What would you like to put into the world?",
  },
  {
    id: "restaurant",
    name: "Restaurant & café",
    description:
      "Terracotta color, an expressive reversed hero, and space for menus and your dining room.",
    theme: {
      accent: "#de6c46",
      background: "#fff4df",
      font: "Georgia, serif",
      radius: 2,
    },
    hero: {
      title: "A good meal. A little more time together.",
      body: "Set the table for your neighborhood restaurant: introduce your kitchen, share the current menu, and make the next visit easy to plan.",
      eyebrow: "AT YOUR TABLE",
      variant: "reverse",
      tone: "dark",
      spacing: "spacious",
      buttonLabel: "Ask about a table",
    },
    homeSections: ["hero", "features", "gallery", "story", "contact"],
    defaultPages: ["Home", "Menu", "Our kitchen", "Contact"],
    features: ["From the kitchen", "Around the table", "Something to finish"],
    featureTitle: "A taste of what is on the menu.",
    storyTitle: "The story behind your kitchen.",
    storyBody:
      "Share the food you cook, the ingredients you choose, and the people behind the menu. Add real opening hours and booking information before publishing.",
    gallery: ["The dining room", "From the kitchen", "At the counter"],
    cta: "Make room for your next visit.",
  },
  {
    id: "editorial",
    name: "Journal & publication",
    description:
      "Sharp monochrome typography, a yellow accent, and a story-first reading experience.",
    theme: {
      accent: "#e7ca60",
      background: "#f7f5ed",
      font: "monospace",
      radius: 0,
    },
    hero: {
      title: "Ideas worth giving your attention to.",
      body: "A home for considered stories, useful perspectives, and the questions that deserve more than a passing glance.",
      eyebrow: "AN INDEPENDENT JOURNAL",
      variant: "centered",
      tone: "default",
      spacing: "compact",
      buttonLabel: "Get in touch with the editors",
    },
    homeSections: ["hero", "gallery", "features", "story", "cta"],
    defaultPages: ["Home", "Journal", "About", "Contact"],
    features: ["Essays & perspectives", "Conversations", "Field notes"],
    featureTitle: "Follow the questions that interest you.",
    storyTitle: "Why this publication exists.",
    storyBody:
      "Explain your editorial focus, who you write for, and how you choose what to publish. Add real bylines and publication dates to your stories.",
    gallery: [
      "Your lead story",
      "An in-depth conversation",
      "Notes from the field",
    ],
    cta: "Have a story we should hear?",
  },
];
export function inferWebsiteStarter(brief = "") {
  const text = String(brief).slice(0, 6000).toLowerCase();
  if (/\b(architecture|architect|interior|architectural)\b/.test(text))
    return "architecture";
  if (
    /\b(restaurant|cafe|bistro|dining|bakery|kitchen|coffee)\b|café/.test(text)
  )
    return "restaurant";
  if (/\b(wellness|wellbeing|yoga|meditation|pilates|spa)\b/.test(text))
    return "wellness";
  if (/\b(saas|software|startup|platform|productivity)\b/.test(text))
    return "saas";
  if (/\b(editorial|journal|publication|magazine|newsletter|blog)\b/.test(text))
    return "editorial";
  return "studio";
}
export function createWebsiteStarterProject(
  name,
  brief,
  starterId,
  pageNamesOverride,
) {
  const id = starterId || inferWebsiteStarter(brief),
    starter = websiteStarters.find((s) => s.id === id);
  if (!starter) throw Error(`Unknown website starter: ${id}`);
  const requested = brief
    .match(/pages?:\s*([^.!\n]+)/i)?.[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
  const pageNames = pageNamesOverride?.length
    ? pageNamesOverride.slice(0, 40)
    : requested?.length
      ? requested
      : starter.defaultPages;
  const pageIds = pageNames.map(() => crypto.randomUUID());
  const contactIndex = pageNames.findIndex((n) =>
    /contact|enquir|inquir/i.test(n),
  );
  const destination =
    contactIndex < 0 ? "#site-contact" : `page:${pageIds[contactIndex]}`;
  const section = (kind, pageName, isHome = false) => {
    const shared = { id: crypto.randomUUID(), kind };
    if (kind === "hero")
      return sectionSchema.parse({
        ...shared,
        ...starter.hero,
        title: isHome ? starter.hero.title : pageName,
        body: isHome
          ? starter.hero.body
          : `Explore ${pageName.toLowerCase()} at ${name}. Replace this introduction with the details your visitors need.`,
        buttonHref: destination,
      });
    if (kind === "features")
      return sectionSchema.parse({
        ...shared,
        title: starter.featureTitle,
        body: "A starting structure for your offering. Replace each description with the services, products, or stories you actually provide.",
        variant: starter.id === "restaurant" ? "centered" : "split",
        items: starter.features.map((title) => ({
          title,
          body: `Describe ${title.toLowerCase()} in your own words. Include the practical details a visitor needs.`,
        })),
      });
    if (kind === "story")
      return sectionSchema.parse({
        ...shared,
        title: starter.storyTitle,
        body: starter.storyBody,
        variant:
          starter.id === "studio" || starter.id === "wellness"
            ? "reverse"
            : "split",
        tone: starter.id === "editorial" ? "accent" : "default",
        spacing: "spacious",
      });
    if (kind === "gallery")
      return sectionSchema.parse({
        ...shared,
        title:
          starter.id === "editorial"
            ? "On the reading list."
            : starter.id === "restaurant"
              ? "A feel for the place."
              : "Make the work the story.",
        body: "Add your own photographs, project descriptions, or article artwork before publishing.",
        items: starter.gallery.map((title) => ({
          title,
          body: "Replace this example with your own work and an accurate description.",
          alt: title,
        })),
      });
    if (kind === "cta")
      return sectionSchema.parse({
        ...shared,
        title: starter.cta,
        body: "Send an enquiry with a little context. Add your contact details and expected response time before publishing.",
        buttonLabel: starter.hero.buttonLabel,
        buttonHref: destination,
        variant: "centered",
        tone: starter.id === "studio" ? "dark" : "accent",
      });
    if (kind === "contact")
      return sectionSchema.parse({
        ...shared,
        title:
          starter.id === "restaurant"
            ? "Plan your visit."
            : "Start a conversation.",
        body:
          starter.id === "restaurant"
            ? "Add your real address, opening hours, and booking policy. This form sends an enquiry; it does not confirm a reservation."
            : "Tell us a little about what you have in mind. Add your real contact details before publishing.",
      });
    if (kind === "pricing")
      return sectionSchema.parse({
        ...shared,
        title:
          starter.id === "saas"
            ? "Choose the right product plan."
            : "Find the right scope for your project.",
        body: "Example plan structure. Set your real prices, inclusions, and terms before publishing.",
        items: ["Starting point", "Extended scope", "Custom scope"].map(
          (title) => ({
            title,
            body: "Describe the included work, limitations, and support. Replace with your actual offering.",
            price: "Add your price",
            label: "Ask about this option",
            href: destination,
          }),
        ),
      });
    if (kind === "faq")
      return sectionSchema.parse({
        ...shared,
        title: "The details, before you decide.",
        body: "Replace these prompts with accurate answers about your offering.",
        items: [
          [
            "How do I get started?",
            "Explain the first step and how to reach you.",
          ],
          [
            "What is included?",
            "Describe the scope and any important exclusions.",
          ],
          [
            "What should I prepare?",
            "List anything a visitor should bring or share.",
          ],
          [
            "What happens next?",
            "Add your real process, timing, and relevant terms.",
          ],
        ].map(([title, body]) => ({ title, body })),
      });
    if (kind === "team")
      return sectionSchema.parse({
        ...shared,
        title: "Meet the people behind the work.",
        body: "Add real names, roles, biographies, and approved photographs.",
        items: ["Founder / lead", "Team member", "Collaborator"].map(
          (title) => ({
            title,
            body: "Replace with an actual person and their role.",
          }),
        ),
      });
    throw Error(`Unsupported starter section: ${kind}`);
  };
  return projectSchema.parse({
    id: crypto.randomUUID(),
    name,
    brief,
    updated: new Date().toISOString(),
    source: "demo",
    theme: { ...starter.theme },
    pages: pageNames.map((pageName, i) => {
      const kinds = /pricing|plans/i.test(pageName)
        ? ["hero", "pricing", "faq", "cta"]
        : /work|projects|portfolio|gallery|journal/i.test(pageName)
          ? ["hero", "gallery", "cta"]
          : /team/i.test(pageName)
            ? ["hero", "team", "cta"]
            : i === 0
              ? starter.homeSections
              : /contact|enquir|inquir/i.test(pageName)
                ? ["contact", "cta"]
                : /menu/i.test(pageName)
                  ? ["hero", "features", "contact"]
                  : ["hero", "story", "cta"];
      return {
        id: pageIds[i],
        name: pageName,
        position: { x: i === 0 ? 380 : (i - 1) * 380, y: i === 0 ? 0 : 550 },
        sections: kinds.map((kind) => section(kind, pageName, i === 0)),
      };
    }),
  });
}

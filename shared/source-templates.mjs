import studioEditorial from "./source-templates-studio-editorial.json" with { type: "json" };
import studioAtelier from "./source-templates-studio-atelier.json" with { type: "json" };
import studioPersonal from "./source-templates-studio-personal.json" with { type: "json" };
import studioLaunch from "./source-templates-studio-launch.json" with { type: "json" };
import studioPractice from "./source-templates-studio-practice.json" with { type: "json" };
import studioRetreat from "./source-templates-studio-retreat.json" with { type: "json" };
import bootstrap from "./source-templates-bootstrap.json" with { type: "json" };
import html5up from "./source-templates-html5up.json" with { type: "json" };
import astro from "./source-templates-modern-astro.json" with { type: "json" };
import react from "./source-templates-modern-react.json" with { type: "json" };
import other from "./source-templates-modern-other.json" with { type: "json" };
import curated from "./source-templates-modern-curated.json" with { type: "json" };
// Keep prior IDs available for saved projects; the catalogue starts with reviewed contemporary designs.
export const sourceTemplates = [
  ...studioEditorial,
  ...studioAtelier,
  ...studioPersonal,
  ...studioLaunch,
  ...studioPractice,
  ...studioRetreat,
  ...curated,
  ...react,
  ...astro,
  ...other,
  ...html5up.map((t) => ({ ...t, collection: "classic" })),
  ...bootstrap.map((t) => ({ ...t, collection: "classic" })),
];
export function sourceTemplateById(id) {
  return sourceTemplates.find((template) => template.id === id);
}

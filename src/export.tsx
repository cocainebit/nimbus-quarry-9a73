import { renderToStaticMarkup } from "react-dom/server";
import { zipSync, strToU8 } from "fflate";
import { SitePage } from "./blocks";
import { normalizeProject, type Project } from "./model";
import { pageFiles } from "../shared/schema.mjs";
import css from "./site.css?raw";
import runtime from "./export-runtime/site.js?raw";
import server from "./export-runtime/server.mjs?raw";
export function download(name: string, data: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const escape = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function buildSiteFiles(input: Project) {
  const project = normalizeProject(input);
  const files: Record<string, Uint8Array> = {
    "project.json": strToU8(JSON.stringify(project, null, 2)),
    "styles.css": strToU8(css),
    "site.js": strToU8(runtime),
    "server.mjs": strToU8(server),
    "package.json": strToU8(
      JSON.stringify(
        {
          name: "exported-site",
          private: true,
          type: "module",
          scripts: { start: "node server.mjs" },
        },
        null,
        2,
      ),
    ),
  };
  const imagePaths = new Map<string, string>();
  const extract = (value: string) => {
    if (!value.startsWith("data:")) return value;
    let file = imagePaths.get(value);
    if (!file) {
      const match = value.match(
        /^data:image\/(png|jpeg|webp|gif);base64,(.+)$/,
      );
      if (!match) return "";
      file = `assets/image-${imagePaths.size + 1}.${match[1] === "jpeg" ? "jpg" : match[1]}`;
      files[file] = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
      imagePaths.set(value, file);
    }
    return file;
  };
  // Render validated data first; then replace only known, escaped image source attributes with bundled files.
  const filenames = pageFiles(project);
  project.pages.forEach((page, i) => {
    let markup = renderToStaticMarkup(
      <SitePage project={project} page={page} />,
    );
    for (const s of page.sections)
      for (const image of [s.image, ...s.items.map((item) => item.image)])
        if (image.startsWith("data:"))
          markup = markup
            .split(`src="${image}"`)
            .join(`src="${extract(image)}"`);
    const canonical = project.settings.siteUrl
      ? new URL(filenames[i], `${project.settings.siteUrl.replace(/\/$/, "")}/`)
          .href
      : "";
    files[filenames[i]] = strToU8(
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(page.seoTitle || `${project.name} — ${page.name}`)}</title><meta name="description" content="${escape(page.description)}">${canonical ? `<link rel="canonical" href="${escape(canonical)}">` : ""}<link rel="stylesheet" href="styles.css"><script src="site.js" defer></script></head><body>${markup}</body></html>`,
    );
  });
  if (project.settings.siteUrl) {
    files["sitemap.xml"] = strToU8(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${filenames.map((name: string) => `<url><loc>${escape(new URL(name, `${project.settings.siteUrl.replace(/\/$/, "")}/`).href)}</loc></url>`).join("")}</urlset>`,
    );
    files["robots.txt"] = strToU8(
      `User-agent: *\nAllow: /\nSitemap: ${project.settings.siteUrl.replace(/\/$/, "")}/sitemap.xml\n`,
    );
  }
  files["manifest.json"] = strToU8(
    JSON.stringify(
      Object.keys(files).filter((name) =>
        /\.(html|css|js|png|jpg|gif|webp|xml|txt)$/.test(name),
      ),
    ),
  );
  files["README.md"] = strToU8(
    `# ${project.name}\n\nRun with Node 22 or newer:\n\n\`\`\`sh\nnpm start\n\`\`\`\n\nOpen http://127.0.0.1:4174. No dependency installation is needed.\n\nPages are standalone HTML; CSS and progressive form handling are in styles.css and site.js. Uploaded images are bundled under assets/. Remote image URLs remain remote.\n\nContact messages are validated and stored in data/submissions.jsonl. The server never serves that file, project.json or server source. It does not send email. Back up the data directory. For public hosting, use persistent storage and HTTPS; set HOST and PORT as required by your host. The server includes basic throttling and a honeypot, not comprehensive spam protection.\n\nIf using static-only hosting, contact forms need a separate backend at /api/contact. Opening HTML files directly works for browsing; forms require the server.\n\nRe-import project.json into Plotform to continue editing. The export is an HTML website, not an application backend or React source project.\n`,
  );
  return files;
}
export function exportSite(project: Project) {
  download(
    `${project.name.replace(/[^a-z0-9-]/gi, "-")}.zip`,
    zipSync(buildSiteFiles(project)) as unknown as BlobPart,
    "application/zip",
  );
}

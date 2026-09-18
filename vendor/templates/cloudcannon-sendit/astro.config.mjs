import react from "@astrojs/react";
import editableRegions from "@cloudcannon/editable-regions/astro-integration";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://example.com/",
  integrations: [react(), editableRegions()],
  vite: {
    plugins: [tailwindcss()],
    build: { sourcemap: "inline", minify: false },
  },
  prefetch: true,
});

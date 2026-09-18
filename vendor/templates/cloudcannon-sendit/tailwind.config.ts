/** @type {import('tailwindcss').Config} */
import type { Config } from "tailwindcss";
import dataTheme from "./data/theme.json";

const { theme } = dataTheme;

const config: Config = {
  theme: {
    extend: {
      colors: {
        primary: `var(--color-primary, ${theme.primary_color})`,
        secondary: `var(--color-secondary, ${theme.secondary_color})`,
        link: `var(--color-link, ${theme.anchor_color})`,
      },
    },
  },
};

export default config;

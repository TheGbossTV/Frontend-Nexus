import mdx from "@mdx-js/rollup";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import rehypePrettyCode, {
  type Options as RehypePrettyCodeOptions,
} from "rehype-pretty-code";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { BASE_PATH } from "./site.config";

/**
 * Highlighting happens here, at build time — no Shiki in the browser bundle.
 * Dual themes emit --shiki-light/--shiki-dark custom properties per token, and
 * app.css picks between them off the `.dark` class, so switching theme is a
 * pure CSS flip with no re-highlight.
 *
 * light-plus/dark-plus are VS Code's own default themes.
 */
const prettyCodeOptions: RehypePrettyCodeOptions = {
  theme: { light: "light-plus", dark: "dark-plus" },
  // We draw our own IDE-window chrome in CodeBlock, so drop Shiki's background.
  keepBackground: false,
};

export default defineConfig({
  base: BASE_PATH,
  plugins: [
    // MDX must run *before* React Router's JSX transform. Without `enforce: "pre"`
    // you get: "Unexpected `FunctionDeclaration` in code: only import/exports are
    // supported" — the JSX has already been compiled by the time MDX sees it.
    {
      enforce: "pre",
      ...mdx({
        remarkPlugins: [
          remarkFrontmatter,
          // Turns the YAML block into `export const frontmatter = {...}`
          [remarkMdxFrontmatter, { name: "frontmatter" }],
        ],
        rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
      }),
    },
    tailwindcss(),
    // reactRouter() brings its own React/Fast Refresh handling — deliberately
    // no @vitejs/plugin-react here, it would double-transform every component.
    reactRouter(),
    tsconfigPaths(),
  ],
});

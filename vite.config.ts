import mdx from "@mdx-js/rollup";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { BASE_PATH } from "./site.config";

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
      }),
    },
    tailwindcss(),
    // reactRouter() brings its own React/Fast Refresh handling — deliberately
    // no @vitejs/plugin-react here, it would double-transform every component.
    reactRouter(),
    tsconfigPaths(),
  ],
});

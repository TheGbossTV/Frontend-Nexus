import type { MDXComponents } from "mdx/types";
import { CodeBlock } from "~/components/CodeBlock";

/**
 * Element overrides handed to every MDX body. Keep this the single place that
 * decides how raw markdown elements render — Phase 4's DifficultyTabs joins it.
 */
export const mdxComponents: MDXComponents = {
  pre: CodeBlock,
};

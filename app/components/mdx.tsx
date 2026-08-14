import type { MDXComponents } from "mdx/types";
import { CodeBlock } from "~/components/CodeBlock";
import { DifficultyTabs, Level } from "~/components/DifficultyTabs";

/**
 * Everything an MDX body can reach: element overrides plus the components
 * entries are allowed to use directly.
 */
export const mdxComponents: MDXComponents = {
  pre: CodeBlock,
  DifficultyTabs,
  Level,
};

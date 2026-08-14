import { valueToEstree } from "estree-util-value-to-estree";
import { visit } from "unist-util-visit";

/**
 * Adds `export const hasDifficultyTabs = true|false` to every MDX file,
 * depending on whether the body actually uses <DifficultyTabs>.
 *
 * The table of contents needs this to decide whether to offer jump links into
 * the difficulty panels — linking to a `#difficulty` anchor that doesn't exist
 * would be a dead link. Detecting it at build time keeps the check exact and
 * costs nothing at runtime, which is the same approach rehype-extract-toc uses
 * for the headings themselves.
 */
export default function remarkDifficultyFlag({
  name = "hasDifficultyTabs",
  component = "DifficultyTabs",
} = {}) {
  return function transformer(tree) {
    let found = false;

    visit(tree, "mdxJsxFlowElement", (node) => {
      if (node.name === component) found = true;
    });

    tree.children.unshift({
      type: "mdxjsEsm",
      value: "",
      data: {
        estree: {
          type: "Program",
          sourceType: "module",
          body: [
            {
              type: "ExportNamedDeclaration",
              source: null,
              specifiers: [],
              declaration: {
                type: "VariableDeclaration",
                kind: "const",
                declarations: [
                  {
                    type: "VariableDeclarator",
                    id: { type: "Identifier", name },
                    init: valueToEstree(found),
                  },
                ],
              },
            },
          ],
        },
      },
    });
  };
}

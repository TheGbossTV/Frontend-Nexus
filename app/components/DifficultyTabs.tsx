import {
  Children,
  isValidElement,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { useSearchParams } from "react-router";

export const LEVELS = ["easy", "medium", "advanced"] as const;
export type DifficultyLevel = (typeof LEVELS)[number];

export const LEVEL_QUERY_KEY = "level";
/** Anchor the TOC jumps to. */
export const DIFFICULTY_SECTION_ID = "difficulty";

const LEVEL_LABELS: Record<DifficultyLevel, string> = {
  easy: "Easy",
  medium: "Medium",
  advanced: "Advanced",
};

const LEVEL_BLURBS: Record<DifficultyLevel, string> = {
  easy: "Fundamentals and getting started",
  medium: "Real-world patterns",
  advanced: "Edge cases, performance, architecture",
};

export function isDifficultyLevel(value: unknown): value is DifficultyLevel {
  return (
    typeof value === "string" && (LEVELS as readonly string[]).includes(value)
  );
}

export function levelPanelId(level: DifficultyLevel): string {
  return `level-${level}`;
}

/**
 * Marker used inside <DifficultyTabs>. It renders its children untouched —
 * DifficultyTabs reads the `value` prop off it to build the tab list.
 */
export function Level({ children }: { value: DifficultyLevel; children?: ReactNode }) {
  return <>{children}</>;
}

export function DifficultyTabs({ children }: { children?: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();

  /*
   * Starts on "easy" to match the prerendered HTML, then syncs from the URL in
   * an effect. Reading search params during render would disagree with the
   * static markup for anyone landing on ?level=advanced and trip hydration.
   */
  const [active, setActive] = useState<DifficultyLevel>("easy");

  useEffect(() => {
    const param = searchParams.get(LEVEL_QUERY_KEY);
    setActive(isDifficultyLevel(param) ? param : "easy");
  }, [searchParams]);

  function select(level: DifficultyLevel) {
    setActive(level);
    const next = new URLSearchParams(searchParams);
    next.set(LEVEL_QUERY_KEY, level);
    // replace + preventScrollReset: switching tabs shouldn't pile up history
    // entries or yank the reader back to the top of the page.
    setSearchParams(next, { replace: true, preventScrollReset: true });
  }

  const panels = Children.toArray(children)
    .filter((child): child is ReactElement<{ value?: unknown; children?: ReactNode }> =>
      isValidElement(child),
    )
    .map((child) => ({ value: child.props.value, content: child.props.children }))
    .filter(
      (panel): panel is { value: DifficultyLevel; content: ReactNode } =>
        isDifficultyLevel(panel.value),
    );

  if (panels.length === 0) return null;

  // Render in canonical order regardless of how they were authored.
  const ordered = LEVELS.flatMap((level) => {
    const panel = panels.find((candidate) => candidate.value === level);
    return panel ? [panel] : [];
  });

  return (
    <section
      id={DIFFICULTY_SECTION_ID}
      className="mt-12 scroll-mt-24"
      aria-label="Code examples by difficulty"
    >
      <h2 className="text-2xl font-semibold tracking-tight">Learn it</h2>

      <div
        role="tablist"
        aria-label="Difficulty level"
        className="mt-4 flex flex-wrap gap-2 border-b border-edge"
      >
        {ordered.map((panel) => {
          const isActive = panel.value === active;
          return (
            <button
              key={panel.value}
              type="button"
              role="tab"
              id={`tab-${panel.value}`}
              aria-selected={isActive}
              aria-controls={levelPanelId(panel.value)}
              onClick={() => select(panel.value)}
              className={
                isActive
                  ? "-mb-px border-b-2 border-accent px-4 py-2 text-sm font-medium text-ink"
                  : "-mb-px border-b-2 border-transparent px-4 py-2 text-sm text-muted transition hover:text-ink"
              }
            >
              {LEVEL_LABELS[panel.value]}
            </button>
          );
        })}
      </div>

      {ordered.map((panel) => (
        <div
          key={panel.value}
          id={levelPanelId(panel.value)}
          role="tabpanel"
          aria-labelledby={`tab-${panel.value}`}
          hidden={panel.value !== active}
          className="scroll-mt-24"
        >
          <p className="mt-4 text-sm text-muted">{LEVEL_BLURBS[panel.value]}</p>
          {panel.content}
        </div>
      ))}
    </section>
  );
}

import { Link } from "react-router";
import { SITE_NAME } from "../../site.config";
import { ThemeToggle } from "./ThemeToggle";

/** Sidebar and search get mounted here in Phases 2 and 5. */
export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-edge bg-canvas/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <Link
          to="/"
          className="text-lg font-semibold tracking-tight transition hover:text-accent"
        >
          {SITE_NAME}
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}

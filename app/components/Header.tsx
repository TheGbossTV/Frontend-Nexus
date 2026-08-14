import { Link } from "react-router";
import { SITE_NAME } from "../../site.config";
import { SidebarToggle } from "~/components/Sidebar";
import { ThemeToggle } from "~/components/ThemeToggle";

/** Search gets mounted here in Phase 5. */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-edge bg-canvas/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-3">
          <SidebarToggle />
          <Link
            to="/"
            className="text-lg font-semibold tracking-tight transition hover:text-accent"
          >
            {SITE_NAME}
          </Link>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}

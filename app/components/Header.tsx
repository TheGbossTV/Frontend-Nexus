import { Link } from "react-router";
import { SITE_NAME } from "../../site.config";
import { Search } from "~/components/Search";
import { SidebarToggle } from "~/components/Sidebar";
import { ThemeToggle } from "~/components/ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-edge bg-canvas/80 backdrop-blur">
      <div className="flex h-16 w-full items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-3">
          <SidebarToggle />
          <Link
            to="/"
            className="text-lg font-semibold tracking-tight transition hover:text-accent"
          >
            {SITE_NAME}
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Search />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

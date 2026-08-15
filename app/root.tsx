import type { ReactNode } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";
import type { Route } from "./+types/root";
import "./app.css";
import { Header } from "~/components/Header";
import { Sidebar } from "~/components/Sidebar";
import { bootScript } from "~/lib/preferences";
import { SITE_NAME, SITE_TAGLINE } from "../site.config";

export const meta: Route.MetaFunction = () => [
  { title: SITE_NAME },
  { name: "description", content: SITE_TAGLINE },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {/* Must be inline and synchronous — a module script would run after paint. */}
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="min-h-screen bg-canvas text-ink antialiased">
        <Header />
        <div className="flex w-full">
          <Sidebar />
          <main className="min-w-0 flex-1 px-8 py-10">{children}</main>
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let heading = "Something went wrong";
  let detail = "An unexpected error occurred.";

  if (isRouteErrorResponse(error)) {
    heading = error.status === 404 ? "Page not found" : `Error ${error.status}`;
    detail =
      error.status === 404
        ? "That page doesn't exist — it may have been renamed or not written yet."
        : error.statusText;
  } else if (import.meta.env.DEV && error instanceof Error) {
    detail = error.message;
  }

  return (
    <section className="py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{heading}</h1>
      <p className="mt-3 text-muted">{detail}</p>
    </section>
  );
}

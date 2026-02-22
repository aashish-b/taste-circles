"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

interface NavEntry {
  label: string;
  href: string;
}

const mobileEntries: NavEntry[] = [
  { label: "Me", href: "/me" },
  { label: "Search", href: "/search" },
  { label: "Inbox", href: "/inbox" },
  { label: "People", href: "/people" },
];

const desktopEntries: NavEntry[] = [
  ...mobileEntries,
  { label: "Settings", href: "/settings" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/me") {
    return pathname === "/" || pathname.startsWith("/me");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  entry,
  pathname,
}: {
  entry: NavEntry;
  pathname: string;
}): JSX.Element {
  const active = isActive(pathname, entry.href);
  return (
    <a className={active ? "nav-link nav-link-active" : "nav-link"} href={entry.href}>
      {entry.label}
    </a>
  );
}

export function AppShell({ children }: { children: React.ReactNode }): JSX.Element {
  const pathname = usePathname();
  const title = useMemo(() => {
    const match = desktopEntries.find((entry) => isActive(pathname, entry.href));
    return match?.label ?? "Taste";
  }, [pathname]);

  return (
    <div className="app-shell">
      <aside className="desktop-nav">
        <div className="brand-block">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <p className="brand-title">Taste Circles</p>
            <p className="brand-subtitle">Parchment + Umber Forest</p>
          </div>
        </div>
        <nav className="desktop-nav-links" aria-label="Primary navigation">
          {desktopEntries.map((entry) => (
            <NavLink key={entry.href} entry={entry} pathname={pathname} />
          ))}
        </nav>
      </aside>

      <div className="app-main-column">
        <header className="top-bar">
          <h1>{title}</h1>
          <a className="button button-secondary" href="/search">
            Add
          </a>
        </header>
        <main className="app-main">{children}</main>
      </div>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {mobileEntries.map((entry) => (
          <NavLink key={entry.href} entry={entry} pathname={pathname} />
        ))}
      </nav>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, Logo } from "./Icon";

export type NavItem = { href: string; label: string; icon: string };

export function Sidebar({
  items,
  orgName,
  orgDetail,
  logoUrl,
  userLabel,
  logoutAction,
  children,
}: {
  items: NavItem[];
  orgName: string;
  orgDetail: string;
  logoUrl?: string | null;
  userLabel: string;
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));

  return (
    <div className="shell">
      <aside className={"side" + (open ? " open" : "")} aria-label="Menú del portal">
        <Link href="/" style={{ textDecoration: "none" }} onClick={() => setOpen(false)}>
          <Logo />
        </Link>
        <div className="org">
          {logoUrl && <span className="org-logo"><img src={logoUrl} alt={`Logo de ${orgName}`} /></span>}
          <b>{orgName}</b>
          <span>{orgDetail}</span>
        </div>
        <nav className="nav">
          {items.map((it) => (
            <Link key={it.href} href={it.href} aria-current={isActive(it.href) ? "page" : undefined} onClick={() => setOpen(false)}>
              <Icon name={it.icon} />
              {it.label}
            </Link>
          ))}
        </nav>
        <div className="foot">
          <span>{userLabel}</span>
          {open && (
            <button type="button" onClick={() => setOpen(false)}>
              Cerrar menú
            </button>
          )}
          <form action={logoutAction}>
            <button type="submit">Salir</button>
          </form>
        </div>
      </aside>
      <main>
        <div className="top">
          <Logo />
          <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
            Menú
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}

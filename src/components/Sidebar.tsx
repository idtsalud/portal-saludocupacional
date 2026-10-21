"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon, Logo } from "./Icon";

/** Un ítem del menú. Con `children` es un grupo que se abre y se cierra. */
export type NavItem = { href: string; label: string; icon: string; children?: NavItem[] };

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
  const groupActive = (it: NavItem) => !!it.children?.some((c) => isActive(c.href));
  // Grupos abiertos: el de la página actual arranca abierto.
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(items.filter(groupActive).map((it) => it.label)));
  const toggle = (label: string) =>
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });

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
          {items.map((it) =>
            it.children ? (
              <div key={it.label} className={"nav-group" + (openGroups.has(it.label) ? " open" : "") + (groupActive(it) ? " active" : "")}>
                <button type="button" aria-expanded={openGroups.has(it.label)} onClick={() => toggle(it.label)}>
                  <Icon name={it.icon} />
                  <span>{it.label}</span>
                  <svg className="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
                </button>
                {openGroups.has(it.label) && (
                  <div className="nav-sub">
                    {it.children.map((c) => (
                      <Link key={c.href} href={c.href} aria-current={isActive(c.href) ? "page" : undefined} onClick={() => setOpen(false)}>
                        {c.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link key={it.href} href={it.href} aria-current={isActive(it.href) ? "page" : undefined} onClick={() => setOpen(false)}>
                <Icon name={it.icon} />
                {it.label}
              </Link>
            ),
          )}
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

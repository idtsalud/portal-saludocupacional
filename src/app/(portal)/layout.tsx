import { Sidebar, type NavItem } from "@/components/Sidebar";
import { logout } from "@/app/login/actions";
import { canSeeAbsences, requireOrg } from "@/lib/session";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { org, profile } = await requireOrg();

  const items: NavItem[] = [{ href: "/", label: "Inicio", icon: "home" }];
  if (org.has_aviso_medico && canSeeAbsences(profile)) items.push({ href: "/ausencias", label: "Ausencias", icon: "pulse" });
  items.push(
    { href: "/gestiones", label: "Turnos y estudios", icon: "clip" },
    { href: "/accidentes", label: "Ante un accidente", icon: "alert" },
    { href: "/documentos", label: "Documentos", icon: "doc" },
    { href: "/historia", label: "Historia clínica", icon: "heart" },
    { href: "/academia", label: "Academia IDT", icon: "cap" },
    { href: "/equipo", label: "Mi equipo IDT", icon: "team" },
    { href: "/usuarios", label: "Usuarios", icon: "users" },
    { href: "/sedes", label: "Sedes", icon: "pin" },
  );
  if (profile.is_idt_staff) items.push({ href: "/admin", label: "Administración IDT", icon: "gear" });

  const detail = `${org.plan}${org.staff_count ? ` · ${org.staff_count} personas` : ""}`;
  const userLabel = `${profile.full_name || "Mi cuenta"}${profile.role_title ? ` · ${profile.role_title}` : ""}`;

  return (
    <Sidebar items={items} orgName={org.name} orgDetail={detail} userLabel={userLabel} logoutAction={logout}>
      {children}
    </Sidebar>
  );
}

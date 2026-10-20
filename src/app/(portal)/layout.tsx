import { Sidebar, type NavItem } from "@/components/Sidebar";
import { StaffBar } from "@/components/StaffBar";
import { logout } from "@/app/login/actions";
import { canSeeAbsences, requireOrg } from "@/lib/session";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { org, profile, has } = await requireOrg();

  const comercio = org.kind === "comercio";
  const items: NavItem[] = [{ href: "/", label: "Inicio", icon: "home" }];
  if (has("aviso_medico") && canSeeAbsences(profile)) items.push({ href: "/ausencias", label: "Ausencias", icon: "pulse" });
  items.push(
    { href: "/gestiones", label: "Turnos y estudios", icon: "clip" },
    { href: "/accidentes", label: "Ante un accidente", icon: "alert" },
    { href: "/usuarios", label: comercio ? "Mis empleados" : "Colaboradores y usuarios", icon: "users" },
    { href: "/documentos", label: "Documentos", icon: "doc" },
    { href: "/historia", label: "Historia clínica", icon: "heart" },
  );
  if (!comercio || has("academia")) items.push({ href: "/academia", label: "Academia IDT", icon: "cap" });
  items.push(
    { href: "/comunidad", label: "Comunidad", icon: "chat" },
    { href: "/equipo", label: "Mi equipo IDT", icon: "team" },
    { href: "/sedes", label: "Sedes", icon: "pin" },
  );
  if (profile.permission === "admin" || profile.permission === "todo") items.push({ href: "/solicitudes", label: "Solicitudes a IDT", icon: "info" });
  if (profile.is_idt_staff) items.push({ href: "/admin", label: "Administración IDT", icon: "gear" });

  const detail = `${org.plan}${org.staff_count ? ` · ${org.staff_count} personas` : ""}`;
  const userLabel = `${profile.full_name || "Mi cuenta"}${profile.role_title ? ` · ${profile.role_title}` : ""}`;

  return (
    <Sidebar items={items} orgName={org.name} orgDetail={detail} userLabel={userLabel} logoutAction={logout}>
      {profile.is_idt_staff && <StaffBar view={comercio ? "Comercio" : "Empresa"} />}
      {children}
    </Sidebar>
  );
}

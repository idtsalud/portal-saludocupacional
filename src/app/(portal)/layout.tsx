import { Sidebar, type NavItem } from "@/components/Sidebar";
import { StaffBar } from "@/components/StaffBar";
import { logout } from "@/app/login/actions";
import { canSeeAbsences, requireOrg } from "@/lib/session";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { org, profile, has } = await requireOrg();

  const comercio = org.kind === "comercio";
  // Menú corto: lo de uso diario arriba y el resto agrupado.
  const items: NavItem[] = [{ href: "/", label: "Inicio", icon: "home" }];
  if (has("aviso_medico") && canSeeAbsences(profile)) items.push({ href: "/ausencias", label: "Ausencias", icon: "pulse" });
  items.push({
    href: "#atencion",
    label: "Atención médica",
    icon: "heart",
    children: [
      { href: "/gestiones", label: "Turnos y estudios", icon: "clip" },
      { href: "/accidentes", label: "Ante un accidente", icon: "alert" },
      { href: "/historia", label: "Historia clínica", icon: "heart" },
      { href: "/sedes", label: "Sedes y horarios", icon: "pin" },
    ],
  });
  const negocio: NavItem[] = [
    { href: "/usuarios", label: comercio ? "Mis empleados" : "Colaboradores y usuarios", icon: "users" },
    { href: "/documentos", label: "Documentos", icon: "doc" },
  ];
  if (profile.permission === "admin" || profile.permission === "todo") negocio.push({ href: "/solicitudes", label: "Solicitudes a IDT", icon: "info" });
  negocio.push({ href: "/equipo", label: "Mi equipo IDT", icon: "team" });
  items.push({ href: "#negocio", label: comercio ? "Mi comercio" : "Mi empresa", icon: "users", children: negocio });
  const aprender: NavItem[] = [];
  if (!comercio || has("academia")) aprender.push({ href: "/academia", label: "Academia IDT", icon: "cap" });
  aprender.push({ href: "/comunidad", label: "Comunidad", icon: "chat" });
  items.push({ href: "#aprender", label: "Aprender", icon: "cap", children: aprender });
  if (profile.is_idt_staff) items.push({ href: "/admin", label: "Administración IDT", icon: "gear" });

  const detail = `${org.plan}${org.staff_count ? ` · ${org.staff_count} personas` : ""}`;
  const userLabel = `${profile.full_name || "Mi cuenta"}${profile.role_title ? ` · ${profile.role_title}` : ""}`;

  return (
    <Sidebar items={items} orgName={org.name} orgDetail={detail} logoUrl={org.logo_url} userLabel={userLabel} logoutAction={logout}>
      {profile.is_idt_staff && <StaffBar view={comercio ? "Comercio" : "Empresa"} />}
      {children}
    </Sidebar>
  );
}

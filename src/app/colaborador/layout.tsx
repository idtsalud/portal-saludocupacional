import { Sidebar, type NavItem } from "@/components/Sidebar";
import { StaffBar } from "@/components/StaffBar";
import { logout } from "@/app/login/actions";
import { requireColaborador } from "@/lib/session";

export default async function ColaboradorLayout({ children }: { children: React.ReactNode }) {
  const { org, profile, has } = await requireColaborador();

  const items: NavItem[] = [
    { href: "/colaborador", label: "Inicio", icon: "home" },
    { href: "/colaborador#salud", label: "Salud y atención", icon: "heart" },
  ];
  if (has("nume")) items.push({ href: "/colaborador#nume", label: "NUME · bienestar", icon: "sun" });
  if (has("academia")) items.push({ href: "/colaborador#academia", label: "Academia IDT", icon: "cap" });
  items.push({ href: "/colaborador/comunidad", label: "Comunidad", icon: "chat" }, { href: "/colaborador/sedes", label: "Sedes", icon: "pin" });
  if (profile.is_idt_staff) items.push({ href: "/admin", label: "Administración IDT", icon: "gear" });

  return (
    <Sidebar items={items} orgName={org.name} orgDetail="Espacio del colaborador" userLabel={profile.full_name || "Mi cuenta"} logoutAction={logout}>
      {profile.is_idt_staff && <StaffBar view={org.kind === "comercio" ? "Empleado de comercio" : "Colaborador de empresa"} />}
      {children}
    </Sidebar>
  );
}

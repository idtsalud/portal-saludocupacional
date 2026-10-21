import { Sidebar, type NavItem } from "@/components/Sidebar";
import { logout } from "@/app/login/actions";
import { requireMedico } from "@/lib/session";

export default async function MedicoLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireMedico();
  const items: NavItem[] = [{ href: "/medico", label: "Avisos de las empresas", icon: "pulse" }];
  if (profile.is_idt_staff) items.push({ href: "/admin", label: "Administración IDT", icon: "gear" });
  return (
    <Sidebar items={items} orgName="Equipo médico IDT" orgDetail="Seguimiento de Aviso Médico" userLabel={profile.full_name || "Médico IDT"} logoutAction={logout}>
      {children}
    </Sidebar>
  );
}

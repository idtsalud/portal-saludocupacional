import { Sidebar, type NavItem } from "@/components/Sidebar";
import { logout } from "@/app/login/actions";
import { requireStaff } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireStaff();
  const items: NavItem[] = [
    { href: "/admin", label: "Organizaciones", icon: "users" },
    { href: "/admin/pedidos", label: "Pedidos", icon: "clip" },
    { href: "/admin/documentos", label: "Documentos", icon: "doc" },
  ];
  if (profile.org_id) items.push({ href: "/", label: "Ver mi portal", icon: "home" });
  return (
    <Sidebar items={items} orgName="Administración IDT" orgDetail="Solo personal de IDT" userLabel={profile.full_name || "Personal IDT"} logoutAction={logout}>
      {children}
    </Sidebar>
  );
}

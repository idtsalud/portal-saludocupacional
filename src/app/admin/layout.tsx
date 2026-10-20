import { Sidebar, type NavItem } from "@/components/Sidebar";
import { logout } from "@/app/login/actions";
import { requireStaff } from "@/lib/session";
import { OPEN_STATUSES } from "@/lib/solicitudes";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, supabase } = await requireStaff();
  const { count: pending } = await supabase.from("solicitudes").select("id", { count: "exact", head: true }).in("status", OPEN_STATUSES);
  const items: NavItem[] = [
    { href: "/admin", label: "Clientes", icon: "users" },
    { href: "/admin/planes", label: "Planes", icon: "tag" },
    { href: "/admin/solicitudes", label: pending ? `Solicitudes (${pending})` : "Solicitudes", icon: "clip" },
    { href: "/admin/documentos", label: "Documentos", icon: "doc" },
    { href: "/admin/comunidad", label: "Comunidad", icon: "chat" },
    { href: "/admin/ver-como", label: "Ver el portal como…", icon: "home" },
  ];
  return (
    <Sidebar items={items} orgName="Administración IDT" orgDetail="Solo personal de IDT" userLabel={profile.full_name || "Personal IDT"} logoutAction={logout}>
      {children}
    </Sidebar>
  );
}

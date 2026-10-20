import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash } from "@/components/Flash";
import { requireStaff } from "@/lib/session";
import { PLAN_FIELDS, type Plan } from "@/lib/plans";
import { PlanForm } from "../PlanForm";

export default async function EditarPlan({
  params,
  searchParams,
}: {
  params: Promise<{ key: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { key } = await params;
  const sp = await searchParams;
  const { supabase } = await requireStaff();
  const isNew = key === "nuevo";
  const [{ data: plan }, { data: catalog }, { count }] = await Promise.all([
    isNew ? Promise.resolve({ data: null }) : supabase.from("plans").select(PLAN_FIELDS).eq("key", key).maybeSingle(),
    supabase.from("services").select("key, name, description").eq("active", true).order("sort"),
    isNew ? Promise.resolve({ count: 0 }) : supabase.from("organizations").select("id", { count: "exact", head: true }).eq("plan_key", key),
  ]);
  if (!isNew && !plan) notFound();

  return (
    <>
      <div className="head">
        <div>
          <Link href="/admin/planes" className="small">← Volver a planes</Link>
          <h1 style={{ marginTop: 6 }}>{isNew ? "Nuevo plan" : (plan as Plan).name}</h1>
        </div>
      </div>
      <Flash ok={sp.ok} error={sp.error} />
      <section className="card" style={{ maxWidth: 900 }}>
        <PlanForm plan={(plan as Plan) ?? undefined} catalog={(catalog ?? []) as { key: string; name: string; description: string }[]} clients={count ?? 0} />
      </section>
    </>
  );
}

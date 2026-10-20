import type { SupabaseClient } from "@supabase/supabase-js";

export type Plan = {
  key: string;
  kind: "empresa" | "comercio";
  name: string;
  units: number;
  price: number | null;
  description: string;
  services: string[];
  sort: number;
  active: boolean;
};

export const PLAN_FIELDS = "key, kind, name, units, price, description, services, sort, active";

export async function getPlans(supabase: SupabaseClient, onlyActive = false) {
  let q = supabase.from("plans").select(PLAN_FIELDS).order("sort");
  if (onlyActive) q = q.eq("active", true);
  const { data } = await q;
  return (data ?? []) as Plan[];
}

export const fmtPrice = (p: number | null) =>
  p == null ? "A medida" : `$${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(p)} + IVA`;

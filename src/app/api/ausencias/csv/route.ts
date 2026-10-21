import { NextResponse, type NextRequest } from "next/server";
import { shownStatus } from "@/lib/medico";
import { loadMonth, parseMonth, restDays, ymd } from "@/lib/ausentismo";
import { canSeeAbsences, getSession } from "@/lib/session";
import { fmtDateTime } from "@/lib/format";

/** Reporte mensual de ausentismo en CSV para Excel (separado por punto y coma, con BOM para los acentos). */
export async function GET(request: NextRequest) {
  const { supabase, org, profile, has } = await getSession();
  if (!org || !profile || !has("aviso_medico") || !canSeeAbsences(profile)) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const m = parseMonth(request.nextUrl.searchParams.get("mes") ?? undefined);
  const { avisos, canSeeMotivo } = await loadMonth(supabase, org.id, m);
  const yn = (v: boolean | null) => (v == null ? "" : v ? "Sí" : "No");
  const dmy = (d: string | null) => (d ? `${d.slice(8)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : "");

  const head = ["Colaborador", "Fecha del aviso", ...(canSeeMotivo ? ["Motivo"] : []), "Avisó al supervisor", "Consultó médico", "Certificado", "Reposo indicado", "Reposo desde", "Reposo hasta", "Días de reposo", "Estado"];
  const rows = avisos.map((a) => [
    a.collaborator,
    fmtDateTime(a.received_at),
    ...(canSeeMotivo ? [a.motivo ?? ""] : []),
    yn(a.notified_employer),
    yn(a.consulted_doctor),
    a.certificate_status ?? "",
    yn(a.rest_indicated),
    dmy(a.rest_from),
    dmy(a.rest_to ?? a.rest_from),
    a.rest_from ? String(restDays(a)) : "",
    shownStatus(a).label,
  ]);
  const cell = (v: string) => (/[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const csv = "﻿" + [head, ...rows].map((r) => r.map(cell).join(";")).join("\r\n");
  const name = `ausentismo-${org.name.normalize("NFD").replace(/[^\w]+/g, "-").toLowerCase()}-${m}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
      "X-Generated": ymd(new Date()),
    },
  });
}

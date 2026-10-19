import { NextResponse, type NextRequest } from "next/server";
import { syncAvisos } from "@/lib/avisos-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Tarea programada (Vercel Cron) o manual: sincroniza los avisos desde Google Sheets. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const result = await syncAvisos();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

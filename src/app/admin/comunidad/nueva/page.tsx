import { Flash } from "@/components/Flash";
import { requireStaff } from "@/lib/session";
import { PostForm } from "../PostForm";

export default async function NuevaPublicacion({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  await requireStaff();
  return (
    <>
      <div className="head"><div><h1>Nueva publicación</h1></div></div>
      <Flash ok={sp.ok} error={sp.error} />
      <section className="card" style={{ maxWidth: 900 }}><PostForm /></section>
    </>
  );
}

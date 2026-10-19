"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children, className = "btn pri" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} type="submit" disabled={pending}>
      {pending ? "Enviando…" : children}
    </button>
  );
}

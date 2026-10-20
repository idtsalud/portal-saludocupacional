import { Icon } from "./Icon";
import { waComercial } from "@/lib/contacto";

/** Aviso del precio preferencial que tienen las empresas y comercios adheridos. */
export function Benefit({ orgName }: { orgName: string }) {
  return (
    <section className="benefit" aria-label="Beneficio por ser parte de SaludOcupacional">
      <span className="badge" aria-hidden="true">%</span>
      <div>
        <h2>Tenés precio preferencial en todos los estudios médicos</h2>
        <p>
          Por ser parte de SaludOcupacional, {orgName} paga menos en preocupacionales, periódicos, radiografías, ecografías,
          audiometrías y el resto de los estudios que hacemos en IDT.
        </p>
      </div>
      <a
        className="btn light"
        href={waComercial(`Hola, soy de ${orgName}. Quiero pedir una cotización con el precio preferencial de SaludOcupacional.`)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon name="whatsapp" />
        Pedir cotización
      </a>
    </section>
  );
}

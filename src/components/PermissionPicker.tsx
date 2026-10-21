import { PERMISSION_INFO, collaboratorRole } from "@/lib/invite";

/** Elección del rol de una persona, con la explicación de cada opción. Con `comercio` definido, suma la opción Colaborador / Empleado. */
export function PermissionPicker({ defaultValue = "admin", comercio, name = "permission", legend = "Qué rol tiene en el portal" }: { defaultValue?: string; comercio?: boolean; name?: string; legend?: string }) {
  const options = Object.entries(PERMISSION_INFO);
  if (comercio !== undefined) options.unshift(["colaborador", collaboratorRole(comercio)]);
  return (
    <fieldset className="perm-picker">
      <legend>{legend}</legend>
      {options.map(([key, p]) => (
        <label key={key} className="perm-option">
          <input type="radio" name={name} value={key} defaultChecked={key === defaultValue} />
          <span><b>{p.label}</b><span>{p.help}</span></span>
        </label>
      ))}
    </fieldset>
  );
}

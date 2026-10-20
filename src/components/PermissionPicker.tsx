import { PERMISSION_INFO } from "@/lib/invite";

/** Elección del permiso de un usuario, con la explicación de cada opción. */
export function PermissionPicker({ defaultValue = "admin" }: { defaultValue?: string }) {
  return (
    <fieldset className="perm-picker">
      <legend>Qué puede hacer en el portal</legend>
      {Object.entries(PERMISSION_INFO).map(([key, p]) => (
        <label key={key} className="perm-option">
          <input type="radio" name="permission" value={key} defaultChecked={key === defaultValue} />
          <span><b>{p.label}</b><span>{p.help}</span></span>
        </label>
      ))}
    </fieldset>
  );
}

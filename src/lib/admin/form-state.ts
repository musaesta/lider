export type AdminFormState = {
  error: string | null;
};

export const emptyAdminFormState: AdminFormState = { error: null };

export function readField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function optionalField(formData: FormData, name: string) {
  const value = readField(formData, name);
  return value.length > 0 ? value : null;
}

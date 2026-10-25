"use client";

import { useActionState, type ReactNode } from "react";
import { adminButtonClass, adminFieldClass } from "@/components/admin-fields";
import { emptyAdminFormState, type AdminFormState } from "@/lib/admin/form-state";

export function AdminNamedForm({
  action,
  submitLabel,
  extraFields,
}: {
  action: (state: AdminFormState, formData: FormData) => Promise<AdminFormState>;
  submitLabel: string;
  extraFields?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, emptyAdminFormState);

  return (
    <form action={formAction} className="mt-8 flex max-w-xl flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
        Название
        <input className={adminFieldClass} name="name" required />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
        Ссылка (латиница, можно пусто)
        <input className={adminFieldClass} name="slug" />
      </label>
      {extraFields}
      <label className="flex items-center gap-2 text-sm font-medium text-ink-soft">
        <input name="isPublished" type="checkbox" />
        Опубликовать
      </label>
      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className={adminButtonClass} disabled={pending} type="submit">
        {pending ? "Сохраняем…" : submitLabel}
      </button>
    </form>
  );
}

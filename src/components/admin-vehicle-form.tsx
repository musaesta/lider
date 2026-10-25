"use client";

import { useActionState } from "react";
import { adminButtonClass, adminFieldClass } from "@/components/admin-fields";
import { createVehicle } from "@/lib/admin/product-extra-actions";
import { emptyAdminFormState } from "@/lib/admin/form-state";

export function AdminVehicleForm() {
  const [state, action, pending] = useActionState(createVehicle, emptyAdminFormState);

  return (
    <form action={action} className="mt-8 grid max-w-xl gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
        Марка
        <input className={adminFieldClass} name="make" required />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
        Модель
        <input className={adminFieldClass} name="model" required />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
        Поколение
        <input className={adminFieldClass} name="generation" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
        Двигатель
        <input className={adminFieldClass} name="engine" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
        Год с
        <input className={adminFieldClass} name="yearFrom" type="number" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
        Год по
        <input className={adminFieldClass} name="yearTo" type="number" />
      </label>
      {state.error ? (
        <p className="sm:col-span-2 text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className={adminButtonClass} disabled={pending} type="submit">
        {pending ? "Сохраняем…" : "Добавить автомобиль"}
      </button>
    </form>
  );
}

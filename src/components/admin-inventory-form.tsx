"use client";

import { useActionState } from "react";
import { adminButtonClass, adminFieldClass } from "@/components/admin-fields";
import { setProductInventory } from "@/lib/admin/product-extra-actions";
import { emptyAdminFormState } from "@/lib/admin/form-state";

export function AdminInventoryForm({
  productId,
  quantityOnHand,
}: {
  productId: string;
  quantityOnHand: number | null;
}) {
  const [state, action, pending] = useActionState(
    setProductInventory,
    emptyAdminFormState,
  );

  return (
    <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
      <input name="productId" type="hidden" value={productId} />
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Количество на складе
        <input
          className={adminFieldClass}
          defaultValue={quantityOnHand ?? 0}
          min="0"
          name="quantityOnHand"
          type="number"
        />
      </label>
      <button className={adminButtonClass} disabled={pending} type="submit">
        {pending ? "Сохраняем…" : "Сохранить остаток"}
      </button>
      {state.error ? (
        <p className="w-full text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

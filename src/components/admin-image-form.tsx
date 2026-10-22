"use client";

import { useActionState } from "react";
import { adminButtonClass, adminFieldClass } from "@/components/admin-fields";
import { uploadProductImage } from "@/lib/admin/product-extra-actions";
import { emptyAdminFormState } from "@/lib/admin/form-state";

export function AdminImageForm({ productId }: { productId: string }) {
  const [state, action, pending] = useActionState(
    uploadProductImage,
    emptyAdminFormState,
  );

  return (
    <form action={action} className="mt-4 flex max-w-xl flex-col gap-3">
      <input name="productId" type="hidden" value={productId} />
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Файл
        <input accept="image/jpeg,image/png,image/webp" name="file" required type="file" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Подпись к фото
        <input className={adminFieldClass} name="altText" />
      </label>
      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className={adminButtonClass} disabled={pending} type="submit">
        {pending ? "Загружаем…" : "Загрузить фото"}
      </button>
    </form>
  );
}

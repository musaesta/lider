"use client";

import { useActionState } from "react";
import { adminButtonClass, adminFieldClass } from "@/components/admin-fields";
import type { AdminBrand, AdminCategory, AdminProduct } from "@/lib/admin/queries";
import { createProduct, updateProduct } from "@/lib/admin/catalog-actions";
import { emptyAdminFormState } from "@/lib/admin/form-state";

export function AdminProductForm({
  product,
  brands,
  categories,
}: {
  product?: AdminProduct;
  brands: AdminBrand[];
  categories: AdminCategory[];
}) {
  const action = product ? updateProduct : createProduct;
  const [state, formAction, pending] = useActionState(action, emptyAdminFormState);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {product ? <input name="productId" type="hidden" value={product.id} /> : null}
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Название
        <input
          className={adminFieldClass}
          defaultValue={product?.name ?? ""}
          name="name"
          required
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        SKU
        <input
          className={adminFieldClass}
          defaultValue={product?.sku ?? ""}
          name="sku"
          required
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Артикул
        <input
          className={adminFieldClass}
          defaultValue={product?.article ?? ""}
          name="article"
          required
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Ссылка (латиница)
        <input
          className={adminFieldClass}
          defaultValue={product?.slug ?? ""}
          name="slug"
          placeholder="esli-pusto-vozmetsya-sku"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Бренд
        <select
          className={adminFieldClass}
          defaultValue={product?.brandId ?? ""}
          name="brandId"
          required
        >
          <option value="">Выберите бренд</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
              {brand.isPublished ? "" : " (скрыт)"}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Категория
        <select
          className={adminFieldClass}
          defaultValue={product?.categoryId ?? ""}
          name="categoryId"
          required
        >
          <option value="">Выберите категорию</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
              {category.isPublished ? "" : " (скрыта)"}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Цена, ₽
        <input
          className={adminFieldClass}
          defaultValue={product ? String(product.price) : ""}
          min="0"
          name="price"
          required
          step="0.01"
          type="number"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Описание
        <textarea
          className={adminFieldClass}
          defaultValue={product?.description ?? ""}
          name="description"
          rows={4}
        />
      </label>
      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className={adminButtonClass} disabled={pending} type="submit">
        {pending
          ? "Сохраняем…"
          : product
            ? "Сохранить данные карточки"
            : "Создать и перейти к фото"}
      </button>
    </form>
  );
}

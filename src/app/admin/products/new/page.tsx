import Link from "next/link";
import { AdminProductForm } from "@/components/admin-product-form";
import { listAdminBrands, listAdminCategories } from "@/lib/admin/queries";

export default async function NewAdminProductPage() {
  const [{ brands }, { categories }] = await Promise.all([
    listAdminBrands(),
    listAdminCategories(),
  ]);

  return (
    <section>
      <Link className="text-sm font-medium text-slate-600 underline" href="/admin/products">
        Назад к товарам
      </Link>
      <h2 className="mt-4 text-xl font-semibold text-slate-950">Новый товар</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        Шаг 1: сохраните карточку. Дальше откроется шаг 2 — фото, остаток и
        автомобиль. На витрине товар появится только после кнопки «Выложить на
        витрину».
      </p>
      {brands.length === 0 || categories.length === 0 ? (
        <p className="mt-8 text-sm text-slate-500">
          Сначала добавьте бренд и категорию.
        </p>
      ) : (
        <div className="mt-8">
          <AdminProductForm brands={brands} categories={categories} />
        </div>
      )}
    </section>
  );
}

import { adminFieldClass } from "@/components/admin-fields";
import { AdminNamedForm } from "@/components/admin-named-form";
import { createCategory } from "@/lib/admin/catalog-actions";
import { listAdminCategories } from "@/lib/admin/queries";

export default async function AdminCategoriesPage() {
  const { categories, error } = await listAdminCategories();

  return (
    <section>
      <h2 className="text-xl font-semibold text-slate-950">Категории</h2>
      <p className="mt-1 text-sm text-slate-500">
        Неопубликованная категория тоже прячет товары с витрины.
      </p>
      {error ? (
        <p className="mt-6 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="mt-6 space-y-2 text-sm">
        {categories.map((category) => (
          <li className="rounded-xl border border-slate-200 bg-white px-4 py-3" key={category.id}>
            {category.name} · {category.slug} ·{" "}
            {category.isPublished ? "опубликована" : "скрыта"}
          </li>
        ))}
      </ul>
      <AdminNamedForm
        action={createCategory}
        extraFields={
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Описание
            <textarea className={adminFieldClass} name="description" rows={3} />
          </label>
        }
        submitLabel="Добавить категорию"
      />
    </section>
  );
}

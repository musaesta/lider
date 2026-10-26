import { connection } from "next/server";
import { Suspense } from "react";
import { adminFieldClass } from "@/components/admin-fields";
import { AdminNamedForm } from "@/components/admin-named-form";
import { AdminListSkeleton } from "@/components/skeletons";
import { createCategory } from "@/lib/admin/catalog-actions";
import { listAdminCategories } from "@/lib/admin/queries";

async function AdminCategoriesContent() {
  await connection();
  const { categories, error } = await listAdminCategories();

  return (
    <section>
      <h2 className="text-xl font-semibold text-ink">Категории</h2>
      <p className="mt-1 text-sm text-muted">
        Неопубликованная категория тоже прячет товары с витрины.
      </p>
      {error ? (
        <p className="mt-6 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="mt-6 space-y-2 text-sm">
        {categories.map((category) => (
          <li className="rounded-xl border border-line bg-surface px-4 py-3" key={category.id}>
            {category.name} · {category.slug} ·{" "}
            {category.isPublished ? "опубликована" : "скрыта"}
          </li>
        ))}
      </ul>
      <AdminNamedForm
        action={createCategory}
        extraFields={
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
            Описание
            <textarea className={adminFieldClass} name="description" rows={3} />
          </label>
        }
        submitLabel="Добавить категорию"
      />
    </section>
  );
}

export default function AdminCategoriesPage() {
  return (
    <Suspense fallback={<AdminListSkeleton />}>
      <AdminCategoriesContent />
    </Suspense>
  );
}

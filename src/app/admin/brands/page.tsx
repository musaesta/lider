import { connection } from "next/server";
import { Suspense } from "react";
import { AdminNamedForm } from "@/components/admin-named-form";
import { AdminListSkeleton } from "@/components/skeletons";
import { createBrand } from "@/lib/admin/catalog-actions";
import { listAdminBrands } from "@/lib/admin/queries";

async function AdminBrandsContent() {
  await connection();
  const { brands, error } = await listAdminBrands();

  return (
    <section>
      <h2 className="text-xl font-semibold text-ink">Бренды</h2>
      <p className="mt-1 text-sm text-muted">
        Неопубликованный бренд скрывает все свои товары с витрины.
      </p>
      {error ? (
        <p className="mt-6 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="mt-6 space-y-2 text-sm">
        {brands.map((brand) => (
          <li className="rounded-xl border border-line bg-surface px-4 py-3" key={brand.id}>
            {brand.name} · {brand.slug} · {brand.isPublished ? "опубликован" : "скрыт"}
          </li>
        ))}
      </ul>
      <AdminNamedForm action={createBrand} submitLabel="Добавить бренд" />
    </section>
  );
}

export default function AdminBrandsPage() {
  return (
    <Suspense fallback={<AdminListSkeleton />}>
      <AdminBrandsContent />
    </Suspense>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminImageForm } from "@/components/admin-image-form";
import { AdminInventoryForm } from "@/components/admin-inventory-form";
import { AdminProductForm } from "@/components/admin-product-form";
import { AdminStorefrontPanel } from "@/components/admin-storefront-panel";
import { ProductPhoto } from "@/components/product-photo";
import {
  addProductCompatibility,
  deleteProductImage,
  removeProductCompatibility,
} from "@/lib/admin/product-extra-actions";
import {
  getAdminProduct,
  listAdminBrands,
  listAdminCategories,
  listAdminVehicles,
} from "@/lib/admin/queries";

export default async function AdminProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ product, error }, { brands }, { categories }, { vehicles }] =
    await Promise.all([
      getAdminProduct(id),
      listAdminBrands(),
      listAdminCategories(),
      listAdminVehicles(),
    ]);

  if (error) {
    return (
      <p className="text-sm text-danger" role="alert">
        {error}
      </p>
    );
  }

  if (!product) {
    notFound();
  }

  const linked = new Set(product.compatibility.map((item) => item.vehicleId));
  const availableVehicles = vehicles.filter((vehicle) => !linked.has(vehicle.id));
  const brand = brands.find((item) => item.id === product.brandId);
  const category = categories.find((item) => item.id === product.categoryId);

  return (
    <section className="space-y-10">
      <div>
        <Link className="text-sm font-medium text-muted underline" href="/admin/products">
          Назад к товарам
        </Link>
        <h2 className="mt-4 text-xl font-semibold text-ink">{product.name}</h2>
        <p className="mt-1 text-sm text-muted">
          {product.brandName} · {product.categoryName}
          {product.isActive ? " · на витрине" : " · черновик"}
        </p>
      </div>
      <AdminStorefrontPanel
        brandPublished={brand?.isPublished ?? false}
        categoryPublished={category?.isPublished ?? false}
        hasPhoto={product.images.length > 0}
        hasStock={product.quantityOnHand != null}
        hasVehicle={product.compatibility.length > 0}
        isActive={product.isActive}
        productId={product.id}
        slug={product.slug}
      />
      <div className="rounded-2xl border border-line bg-surface p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Фото
        </h3>
        {product.images.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Фото пока нет.</p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-3">
            {product.images.map((image) => (
              <li className="rounded-xl border border-line p-3" key={image.id}>
                <ProductPhoto alt={image.altText || product.name} src={image.url} />
                <form action={deleteProductImage} className="mt-3">
                  <input name="productId" type="hidden" value={product.id} />
                  <input name="imageId" type="hidden" value={image.id} />
                  <button className="text-sm font-medium text-danger" type="submit">
                    Удалить
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <AdminImageForm productId={product.id} />
      </div>
      <div className="rounded-2xl border border-line bg-surface p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Остаток
        </h3>
        <p className="mt-2 text-sm text-muted">
          Резерв: {product.quantityReserved ?? 0}. На витрине будет «в наличии», если
          свободное количество больше нуля.
        </p>
        <AdminInventoryForm
          productId={product.id}
          quantityOnHand={product.quantityOnHand}
        />
      </div>
      <div className="rounded-2xl border border-line bg-surface p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Совместимость
        </h3>
        {product.compatibility.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Автомобили пока не привязаны.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {product.compatibility.map((item) => (
              <li className="flex items-center justify-between gap-3 text-sm" key={item.id}>
                <span>{item.label}</span>
                <form action={removeProductCompatibility}>
                  <input name="productId" type="hidden" value={product.id} />
                  <input name="linkId" type="hidden" value={item.id} />
                  <button className="font-medium text-danger" type="submit">
                    Убрать
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        {availableVehicles.length > 0 ? (
          <form action={addProductCompatibility} className="mt-4 flex flex-wrap gap-3">
            <input name="productId" type="hidden" value={product.id} />
            <select
              className="rounded-xl border border-line px-3 py-2 text-sm"
              name="vehicleId"
              required
            >
              {availableVehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.make} {vehicle.model}
                  {vehicle.yearFrom ? ` ${vehicle.yearFrom}` : ""}
                  {vehicle.yearTo ? `–${vehicle.yearTo}` : ""}
                </option>
              ))}
            </select>
            <button className="text-sm font-medium underline" type="submit">
              Привязать
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-muted">
            Все автомобили уже привязаны.{" "}
            <Link className="underline" href="/admin/vehicles">
              Добавить авто
            </Link>
          </p>
        )}
      </div>
      <div className="rounded-2xl border border-line bg-surface p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Данные карточки
        </h3>
        <p className="mt-2 mb-6 text-sm text-muted">
          Название, цена и артикул. Это не выкладывает товар на витрину.
        </p>
        <AdminProductForm brands={brands} categories={categories} product={product} />
      </div>
    </section>
  );
}

import Link from "next/link";
import { formatPrice } from "@/lib/catalog/format";
import { listAdminProducts } from "@/lib/admin/queries";

export default async function AdminProductsPage() {
  const { products, error } = await listAdminProducts();

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Товары</h2>
          <p className="mt-1 text-sm text-slate-500">
            Здесь видны и скрытые позиции. На витрине — только активные в
            опубликованных бренде и категории.
          </p>
        </div>
        <Link
          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white"
          href="/admin/products/new"
        >
          Новый товар
        </Link>
      </div>
      {error ? (
        <p className="mt-8 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {products.length === 0 && !error ? (
        <p className="mt-8 text-sm text-slate-500">Товаров пока нет.</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {products.map((product) => (
            <li key={product.id}>
              <Link
                className="block rounded-2xl border border-slate-200/80 bg-white p-4 hover:border-slate-300"
                href={`/admin/products/${product.id}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-slate-950">{product.name}</p>
                  <p className="text-sm font-medium">{formatPrice(product.price)}</p>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {product.brandName} · {product.categoryName} · арт. {product.article} ·{" "}
                  {product.isActive ? "на витрине" : "скрыт"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

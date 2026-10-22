import Link from "next/link";
import { ProductPhoto } from "@/components/product-photo";
import { formatPrice } from "@/lib/catalog/format";
import type { CatalogProduct } from "@/lib/catalog/queries";

export function ProductCard({ product }: { product: CatalogProduct }) {
  return (
    <Link
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/5 transition hover:border-orange-200 hover:shadow-md"
      href={`/catalog/${product.slug}`}
    >
      <ProductPhoto alt={product.imageAlt} src={product.imageUrl} />
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {product.categoryName}
        </p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
          {product.name}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {product.brandName}
          {product.article ? ` · арт. ${product.article}` : ""}
        </p>
        <p className="mt-auto pt-6 text-base font-semibold text-slate-950">
          {formatPrice(product.price)}
        </p>
        <p className={`mt-2 text-xs font-medium ${product.inStock ? "text-emerald-700" : "text-slate-400"}`}>
          {product.inStock ? "В наличии" : "Нет в наличии"}
        </p>
      </div>
    </Link>
  );
}

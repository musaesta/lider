import Link from "next/link";
import { ProductPhoto } from "@/components/product-photo";
import { formatPrice } from "@/lib/catalog/format";
import type { CatalogProduct } from "@/lib/catalog/queries";

export function ProductCard({ product }: { product: CatalogProduct }) {
  return (
    <Link
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm shadow-ink/8 transition hover:border-accent hover:shadow-md"
      href={`/catalog/${product.slug}`}
      prefetch={false}
    >
      <ProductPhoto alt={product.imageAlt} src={product.imageUrl} />
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-faint">
          {product.categoryName}
        </p>
        <h2 className="mt-2 text-lg font-black tracking-tight text-ink">
          {product.name}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {product.brandName}
          {product.article ? ` · арт. ${product.article}` : ""}
        </p>
        <p className="mt-auto pt-6 text-base font-semibold text-ink">
          {formatPrice(product.price)}
        </p>
        <p className={`mt-2 text-xs font-medium ${product.inStock ? "text-success" : "text-faint"}`}>
          {product.inStock ? "В наличии" : "Нет в наличии"}
        </p>
      </div>
    </Link>
  );
}

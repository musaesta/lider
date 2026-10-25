import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductPhoto } from "@/components/product-photo";
import { ProductSkeleton } from "@/components/skeletons";
import { getAuthViewer } from "@/lib/auth/session";
import { formatPrice } from "@/lib/catalog/format";
import { getPublicProductBySlug } from "@/lib/catalog/queries";

async function ProductDetails({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [{ data: product, error }, viewer] = await Promise.all([
    getPublicProductBySlug(slug),
    getAuthViewer(),
  ]);

  if (error) {
    return (
      <p className="mt-10 text-sm text-danger" role="alert">
        {error}
      </p>
    );
  }

  if (!product) {
    notFound();
  }

  return (
    <article className="mt-10 grid gap-8 rounded-2xl border border-line bg-surface p-6 shadow-sm shadow-ink/8 sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <ProductPhoto
        alt={product.imageAlt}
        className="rounded-xl"
        priority
        sizes="(min-width: 1024px) 420px, 90vw"
        src={product.imageUrl}
      />
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-faint">
          {product.categoryName}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-ink">
          {product.name}
        </h1>
        <p className="mt-2 text-sm text-muted">{product.brandName}</p>
        <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-faint">Артикул</dt>
            <dd className="mt-1 font-medium text-ink">{product.article}</dd>
          </div>
          <div>
            <dt className="text-faint">SKU</dt>
            <dd className="mt-1 font-medium text-ink">{product.sku}</dd>
          </div>
        </dl>
        <p className="mt-8 text-2xl font-black tracking-tight text-ink">
          {formatPrice(product.price)}
        </p>
        <p className={`mt-2 text-sm font-medium ${product.inStock ? "text-success" : "text-muted"}`}>
          {product.inStock ? "В наличии" : "Нет в наличии"}
        </p>
        {product.description ? (
          <p className="mt-6 max-w-2xl text-sm leading-7 text-muted">
            {product.description}
          </p>
        ) : null}
        <AddToCartButton
          inStock={product.inStock}
          loggedIn={Boolean(viewer)}
          nextPath={`/catalog/${product.slug}`}
          productId={product.id}
        />
      </div>
    </article>
  );
}

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16 sm:px-10">
      <Link
        className="text-sm font-medium text-muted underline decoration-silver underline-offset-4 hover:text-ink"
        href="/catalog"
      >
        Назад в каталог
      </Link>
      <Suspense
        fallback={<ProductSkeleton />}
      >
        <ProductDetails params={params} />
      </Suspense>
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { ProductPhoto } from "@/components/product-photo";
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
      <p className="mt-10 text-sm text-red-600" role="alert">
        {error}
      </p>
    );
  }

  if (!product) {
    notFound();
  }

  return (
    <article className="mt-10 grid gap-8 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <ProductPhoto
        alt={product.imageAlt}
        className="rounded-xl"
        priority
        sizes="(min-width: 1024px) 420px, 90vw"
        src={product.imageUrl}
      />
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {product.categoryName}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          {product.name}
        </h1>
        <p className="mt-2 text-sm text-slate-500">{product.brandName}</p>
        <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-400">Артикул</dt>
            <dd className="mt-1 font-medium text-slate-900">{product.article}</dd>
          </div>
          <div>
            <dt className="text-slate-400">SKU</dt>
            <dd className="mt-1 font-medium text-slate-900">{product.sku}</dd>
          </div>
        </dl>
        <p className="mt-8 text-2xl font-semibold tracking-tight text-slate-950">
          {formatPrice(product.price)}
        </p>
        <p className={`mt-2 text-sm font-medium ${product.inStock ? "text-emerald-700" : "text-slate-500"}`}>
          {product.inStock ? "В наличии" : "Нет в наличии"}
        </p>
        {product.description ? (
          <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-600">
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
        className="text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-950"
        href="/catalog"
      >
        Назад в каталог
      </Link>
      <Suspense
        fallback={<p className="mt-10 text-sm text-slate-500">Загрузка товара…</p>}
      >
        <ProductDetails params={params} />
      </Suspense>
    </main>
  );
}

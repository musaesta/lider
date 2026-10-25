import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ProductPhoto } from "@/components/product-photo";
import { loginHref } from "@/lib/auth/paths";
import { getAuthViewer } from "@/lib/auth/session";
import { formatPrice } from "@/lib/catalog/format";
import { removeCartItem, updateCartItem } from "@/lib/cart/actions";
import { getCartLines } from "@/lib/cart/queries";

function lineAmount(price: string | number, quantity: number) {
  const amount = typeof price === "number" ? price : Number(price);
  return Number.isFinite(amount) ? amount * quantity : 0;
}

async function CartContent() {
  const viewer = await getAuthViewer();

  if (!viewer) {
    redirect(loginHref("/cart"));
  }

  const { lines, error } = await getCartLines();

  if (error) {
    return (
      <p className="mt-10 text-sm text-danger" role="alert">
        {error}
      </p>
    );
  }

  if (lines.length === 0) {
    return (
      <p className="mt-10 text-sm leading-6 text-muted">
        Корзина пустая.{" "}
        <Link className="font-medium text-ink underline" href="/catalog">
          Перейти в каталог
        </Link>
      </p>
    );
  }

  const total = lines.reduce(
    (sum, line) => sum + lineAmount(line.price, line.quantity),
    0,
  );

  return (
    <div className="mt-10 space-y-4">
      <ul className="space-y-4">
        {lines.map((line) => (
          <li
            className="grid gap-4 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-[6rem_1fr_auto] sm:items-center"
            key={line.id}
          >
            <ProductPhoto
              alt={line.imageAlt}
              className="rounded-xl"
              sizes="96px"
              src={line.imageUrl}
            />
            <div>
              {line.slug ? (
                <Link
                  className="font-semibold text-ink hover:underline"
                  href={`/catalog/${line.slug}`}
                >
                  {line.name}
                </Link>
              ) : (
                <p className="font-semibold text-ink">{line.name}</p>
              )}
              <p className="mt-1 text-sm text-muted">
                {line.brandName}
                {line.article ? ` · арт. ${line.article}` : ""}
              </p>
              <p className="mt-2 text-sm font-medium text-ink">
                {formatPrice(line.price)}
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <form action={updateCartItem} className="flex items-center gap-2">
                <input name="itemId" type="hidden" value={line.id} />
                <label className="text-xs text-muted">
                  Кол-во
                  <input
                    className="ml-2 w-16 rounded-lg border border-line px-2 py-1.5 text-sm"
                    defaultValue={line.quantity}
                    max={1000}
                    min={1}
                    name="quantity"
                    type="number"
                  />
                </label>
                <button
                  className="text-xs font-medium text-muted underline"
                  type="submit"
                >
                  Обновить
                </button>
              </form>
              <form action={removeCartItem}>
                <input name="itemId" type="hidden" value={line.id} />
                <button
                  className="text-xs font-medium text-danger"
                  type="submit"
                >
                  Удалить
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-lg font-semibold text-ink">
        Итого: {formatPrice(total)}
      </p>
      <Link
        className="inline-flex w-fit rounded-xl bg-accent transition-colors hover:bg-accent-hover px-4 py-2.5 text-sm font-semibold text-white"
        href="/checkout"
      >
        Оформить заказ
      </Link>
    </div>
  );
}

export default function CartPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16 sm:px-10">
      <h1 className="text-3xl font-black tracking-tight text-ink">
        Корзина
      </h1>
      <Suspense fallback={<p className="mt-10 text-sm text-muted">Загрузка корзины…</p>}>
        <CartContent />
      </Suspense>
    </main>
  );
}

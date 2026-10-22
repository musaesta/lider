import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/checkout-form";
import { listMyAddresses } from "@/lib/account/addresses";
import { loginHref } from "@/lib/auth/paths";
import { getAuthViewer } from "@/lib/auth/session";
import { formatPrice } from "@/lib/catalog/format";
import { getCartLines } from "@/lib/cart/queries";

function lineAmount(price: string | number, quantity: number) {
  const amount = typeof price === "number" ? price : Number(price);
  return Number.isFinite(amount) ? amount * quantity : 0;
}

async function CheckoutContent() {
  const viewer = await getAuthViewer();

  if (!viewer) {
    redirect(loginHref("/checkout"));
  }

  const [{ lines, error: cartError }, { addresses, error: addressError }] =
    await Promise.all([getCartLines(), listMyAddresses()]);

  if (cartError) {
    return (
      <p className="mt-10 text-sm text-red-600" role="alert">
        {cartError}
      </p>
    );
  }

  if (lines.length === 0) {
    redirect("/cart");
  }

  const total = lines.reduce(
    (sum, line) => sum + lineAmount(line.price, line.quantity),
    0,
  );
  const unavailable = lines.some((line) => !line.available);

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Состав заказа
        </h2>
        <ul className="mt-4 space-y-3">
          {lines.map((line) => (
            <li className="flex justify-between gap-4 text-sm" key={line.id}>
              <span>
                <span className="block font-medium text-slate-950">
                  {line.name}
                </span>
                <span className="mt-0.5 block text-slate-500">
                  {line.quantity} × {formatPrice(line.price)}
                  {line.article ? ` · арт. ${line.article}` : ""}
                </span>
                {!line.available ? (
                  <span className="mt-1 block text-red-600">Товар больше недоступен</span>
                ) : null}
              </span>
              <span className="font-medium text-slate-900">
                {formatPrice(lineAmount(line.price, line.quantity))}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-lg font-semibold text-slate-950">
          Итого: {formatPrice(total)}
        </p>
        <p className="mt-2">
          <Link className="text-sm font-medium text-slate-600 underline" href="/cart">
            Изменить корзину
          </Link>
        </p>
      </section>
      <section>
        {unavailable ? (
          <p className="mb-4 text-sm text-red-600" role="alert">
            В корзине есть недоступный товар. Удалите его перед оформлением.
          </p>
        ) : null}
        {addressError ? (
          <p className="text-sm text-red-600" role="alert">
            {addressError}
          </p>
        ) : (
          <CheckoutForm addresses={addresses} canPlace={!unavailable} />
        )}
      </section>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16 sm:px-10">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
        Оформление заказа
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Оплата не списывается. Заказ создаётся со статусом «ожидает оплаты».
      </p>
      <Suspense fallback={<p className="mt-10 text-sm text-slate-500">Загрузка оформления…</p>}>
        <CheckoutContent />
      </Suspense>
    </main>
  );
}

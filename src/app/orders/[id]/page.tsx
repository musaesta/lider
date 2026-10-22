import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { loginHref } from "@/lib/auth/paths";
import { getAuthViewer } from "@/lib/auth/session";
import { formatPrice } from "@/lib/catalog/format";
import {
  formatOrderDate,
  orderStatusLabel,
  paymentStatusLabel,
} from "@/lib/orders/labels";
import { getMyOrder } from "@/lib/orders/queries";

async function OrderDetailsContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await getAuthViewer();

  if (!viewer) {
    redirect(loginHref(`/orders/${id}`));
  }

  const { order, error } = await getMyOrder(id);

  if (error) {
    return (
      <p className="mt-10 text-sm text-red-600" role="alert">
        {error}
      </p>
    );
  }

  if (!order) {
    notFound();
  }

  const shipping = [
    order.shippingCity,
    order.shippingRegion,
    order.shippingPostalCode,
    order.shippingAddressLine1,
    order.shippingAddressLine2,
  ]
    .filter((part) => part && part.trim())
    .join(", ");

  return (
    <article>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950">
        Заказ {order.orderNumber}
      </h1>
      <div className="mt-10 space-y-8">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <p className="text-sm text-slate-500">{formatOrderDate(order.createdAt)}</p>
          <p className="mt-2 text-sm text-slate-700">
            {orderStatusLabel(order.status)} · {paymentStatusLabel(order.paymentStatus)}
          </p>
          <p className="mt-4 text-lg font-semibold text-slate-950">
            Итого: {formatPrice(order.totalAmount)}
          </p>
        </section>
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Состав
          </h2>
          <ul className="mt-4 space-y-3">
            {order.items.map((item) => (
              <li
                className="flex justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 text-sm"
                key={item.id}
              >
                <span>
                  <span className="block font-medium text-slate-950">{item.name}</span>
                  <span className="mt-1 block text-slate-500">
                    {item.quantity} × {formatPrice(item.unitPrice)} · арт. {item.sku}
                  </span>
                </span>
                <span className="font-medium text-slate-900">
                  {formatPrice(item.lineTotal)}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 text-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Доставка
          </h2>
          <p className="mt-3 font-medium text-slate-950">
            {order.contactName}, {order.contactPhone}
          </p>
          <p className="mt-1 text-slate-500">{shipping}</p>
          {order.customerComment ? (
            <p className="mt-3 text-slate-600">Комментарий: {order.customerComment}</p>
          ) : null}
        </section>
        {order.history.length > 0 ? (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              История статуса
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {order.history.map((entry) => (
                <li key={entry.id}>
                  {formatOrderDate(entry.createdAt)} — {orderStatusLabel(entry.status)}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {order.comments.length > 0 ? (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Комментарии
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              {order.comments.map((comment) => (
                <li
                  className="rounded-2xl border border-slate-200/80 bg-white p-4 text-slate-700"
                  key={comment.id}
                >
                  <p>{comment.body}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {formatOrderDate(comment.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </article>
  );
}

export default function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:px-10">
      <Link
        className="text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-4"
        href="/orders"
      >
        Назад к заказам
      </Link>
      <Suspense fallback={<p className="mt-10 text-sm text-slate-500">Загрузка заказа…</p>}>
        <OrderDetailsContent params={params} />
      </Suspense>
    </main>
  );
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminDetailSkeleton } from "@/components/skeletons";
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
      <p className="mt-10 text-sm text-danger" role="alert">
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
      <h1 className="mt-6 text-3xl font-black tracking-tight text-ink">
        Заказ {order.orderNumber}
      </h1>
      <div className="mt-10 space-y-8">
        <section className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-sm text-muted">{formatOrderDate(order.createdAt)}</p>
          <p className="mt-2 text-sm text-ink-soft">
            {orderStatusLabel(order.status)} · {paymentStatusLabel(order.paymentStatus)}
          </p>
          <p className="mt-4 text-lg font-semibold text-ink">
            Итого: {formatPrice(order.totalAmount)}
          </p>
        </section>
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Состав
          </h2>
          <ul className="mt-4 space-y-3">
            {order.items.map((item) => (
              <li
                className="flex justify-between gap-4 rounded-2xl border border-line bg-surface p-4 text-sm"
                key={item.id}
              >
                <span>
                  <span className="block font-medium text-ink">{item.name}</span>
                  <span className="mt-1 block text-muted">
                    {item.quantity} × {formatPrice(item.unitPrice)} · арт. {item.sku}
                  </span>
                </span>
                <span className="font-medium text-ink">
                  {formatPrice(item.lineTotal)}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-line bg-surface p-5 text-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Доставка
          </h2>
          <p className="mt-3 font-medium text-ink">
            {order.contactName}, {order.contactPhone}
          </p>
          <p className="mt-1 text-muted">{shipping}</p>
          {order.customerComment ? (
            <p className="mt-3 text-muted">Комментарий: {order.customerComment}</p>
          ) : null}
        </section>
        {order.history.length > 0 ? (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              История статуса
            </h2>
            <ul className="mt-4 space-y-2 text-sm text-muted">
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
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              Комментарии
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              {order.comments.map((comment) => (
                <li
                  className="rounded-2xl border border-line bg-surface p-4 text-ink-soft"
                  key={comment.id}
                >
                  <p>{comment.body}</p>
                  <p className="mt-2 text-xs text-faint">
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
        className="text-sm font-medium text-muted underline decoration-silver underline-offset-4"
        href="/orders"
      >
        Назад к заказам
      </Link>
      <Suspense fallback={<div className="mt-10"><AdminDetailSkeleton /></div>}>
        <OrderDetailsContent params={params} />
      </Suspense>
    </main>
  );
}

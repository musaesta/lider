import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminOrderCommentForm, AdminOrderStatusForm } from "@/components/admin-order-forms";
import { getAdminOrder } from "@/lib/admin/queries";
import { formatPrice } from "@/lib/catalog/format";
import {
  formatOrderDate,
  orderStatusLabel,
  paymentStatusLabel,
} from "@/lib/orders/labels";

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { order, error } = await getAdminOrder(id);

  if (error) {
    return (
      <p className="text-sm text-danger" role="alert">
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
    <article className="space-y-8">
      <div>
        <Link className="text-sm font-medium text-muted underline" href="/admin/orders">
          Назад к заказам
        </Link>
        <h2 className="mt-4 text-xl font-semibold text-ink">
          Заказ {order.orderNumber}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {formatOrderDate(order.createdAt)} · {orderStatusLabel(order.status)} ·{" "}
          {paymentStatusLabel(order.paymentStatus)}
        </p>
      </div>
      <section className="rounded-2xl border border-line bg-surface p-5">
        <p className="text-lg font-semibold">{formatPrice(order.totalAmount)}</p>
        <AdminOrderStatusForm key={order.status} orderId={order.id} status={order.status} />
      </section>
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Состав
        </h3>
        <ul className="mt-3 space-y-2">
          {order.items.map((item) => (
            <li className="flex justify-between gap-4 text-sm" key={item.id}>
              <span>
                {item.name} · {item.quantity} × {formatPrice(item.unitPrice)}
              </span>
              <span className="font-medium">{formatPrice(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-2xl border border-line bg-surface p-5 text-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Доставка
        </h3>
        <p className="mt-3 font-medium">
          {order.contactName}, {order.contactPhone}
        </p>
        <p className="mt-1 text-muted">{shipping}</p>
        {order.customerComment ? (
          <p className="mt-3 text-muted">Комментарий покупателя: {order.customerComment}</p>
        ) : null}
      </section>
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          История
        </h3>
        <ul className="mt-3 space-y-1 text-sm text-muted">
          {order.history.map((entry) => (
            <li key={entry.id}>
              {formatOrderDate(entry.createdAt)} — {orderStatusLabel(entry.status)}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Комментарии
        </h3>
        {order.comments.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Пока нет.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {order.comments.map((comment) => (
              <li className="rounded-2xl border border-line bg-surface p-4 text-sm" key={comment.id}>
                <p>{comment.body}</p>
                <p className="mt-2 text-xs text-faint">
                  {formatOrderDate(comment.createdAt)} ·{" "}
                  {comment.visibility === "internal" ? "внутренний" : "покупателю"}
                </p>
              </li>
            ))}
          </ul>
        )}
        <AdminOrderCommentForm orderId={order.id} />
      </section>
    </article>
  );
}

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
      <p className="text-sm text-red-600" role="alert">
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
        <Link className="text-sm font-medium text-slate-600 underline" href="/admin/orders">
          Назад к заказам
        </Link>
        <h2 className="mt-4 text-xl font-semibold text-slate-950">
          Заказ {order.orderNumber}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {formatOrderDate(order.createdAt)} · {orderStatusLabel(order.status)} ·{" "}
          {paymentStatusLabel(order.paymentStatus)}
        </p>
      </div>
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
        <p className="text-lg font-semibold">{formatPrice(order.totalAmount)}</p>
        <AdminOrderStatusForm key={order.status} orderId={order.id} status={order.status} />
      </section>
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
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
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 text-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Доставка
        </h3>
        <p className="mt-3 font-medium">
          {order.contactName}, {order.contactPhone}
        </p>
        <p className="mt-1 text-slate-500">{shipping}</p>
        {order.customerComment ? (
          <p className="mt-3 text-slate-600">Комментарий покупателя: {order.customerComment}</p>
        ) : null}
      </section>
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          История
        </h3>
        <ul className="mt-3 space-y-1 text-sm text-slate-600">
          {order.history.map((entry) => (
            <li key={entry.id}>
              {formatOrderDate(entry.createdAt)} — {orderStatusLabel(entry.status)}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Комментарии
        </h3>
        {order.comments.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Пока нет.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {order.comments.map((comment) => (
              <li className="rounded-2xl border border-slate-200 bg-white p-4 text-sm" key={comment.id}>
                <p>{comment.body}</p>
                <p className="mt-2 text-xs text-slate-400">
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

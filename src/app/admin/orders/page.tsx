import Link from "next/link";
import { connection } from "next/server";
import { listAdminOrders } from "@/lib/admin/queries";
import { formatPrice } from "@/lib/catalog/format";
import {
  formatOrderDate,
  orderStatusLabel,
  paymentStatusLabel,
} from "@/lib/orders/labels";

export default async function AdminOrdersPage() {
  await connection();
  const { orders, error } = await listAdminOrders();

  return (
    <section>
      <h2 className="text-xl font-semibold text-ink">Заказы</h2>
      <p className="mt-1 text-sm text-muted">
        Смена статуса и комментарий идут через серверную операцию, не через
        прямой INSERT покупателя.
      </p>
      {error ? (
        <p className="mt-8 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {orders.length === 0 && !error ? (
        <p className="mt-8 text-sm text-muted">Заказов пока нет.</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                className="block rounded-2xl border border-line bg-surface p-4 hover:border-accent/40"
                href={`/admin/orders/${order.id}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-ink">{order.orderNumber}</p>
                  <p className="text-sm font-medium">{formatPrice(order.totalAmount)}</p>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {order.contactName} · {formatOrderDate(order.createdAt)} ·{" "}
                  {orderStatusLabel(order.status)} · {paymentStatusLabel(order.paymentStatus)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

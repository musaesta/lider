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
      <h2 className="text-xl font-semibold text-slate-950">Заказы</h2>
      <p className="mt-1 text-sm text-slate-500">
        Смена статуса и комментарий идут через серверную операцию, не через
        прямой INSERT покупателя.
      </p>
      {error ? (
        <p className="mt-8 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {orders.length === 0 && !error ? (
        <p className="mt-8 text-sm text-slate-500">Заказов пока нет.</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                className="block rounded-2xl border border-slate-200/80 bg-white p-4 hover:border-slate-300"
                href={`/admin/orders/${order.id}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-slate-950">{order.orderNumber}</p>
                  <p className="text-sm font-medium">{formatPrice(order.totalAmount)}</p>
                </div>
                <p className="mt-1 text-sm text-slate-500">
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

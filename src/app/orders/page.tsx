import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { loginHref } from "@/lib/auth/paths";
import { getAuthViewer } from "@/lib/auth/session";
import { formatPrice } from "@/lib/catalog/format";
import {
  formatOrderDate,
  orderStatusLabel,
  paymentStatusLabel,
} from "@/lib/orders/labels";
import { listMyOrders } from "@/lib/orders/queries";

async function OrdersContent() {
  const viewer = await getAuthViewer();

  if (!viewer) {
    redirect(loginHref("/orders"));
  }

  const { orders, error } = await listMyOrders();

  if (error) {
    return (
      <p className="mt-10 text-sm text-red-600" role="alert">
        {error}
      </p>
    );
  }

  if (orders.length === 0) {
    return (
      <p className="mt-10 text-sm leading-6 text-slate-500">
        Заказов пока нет.{" "}
        <Link className="font-medium text-slate-900 underline" href="/catalog">
          Перейти в каталог
        </Link>
      </p>
    );
  }

  return (
    <ul className="mt-10 space-y-4">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            className="block rounded-2xl border border-slate-200/80 bg-white p-5 hover:border-slate-300"
            href={`/orders/${order.id}`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold text-slate-950">{order.orderNumber}</p>
              <p className="text-sm font-medium text-slate-900">
                {formatPrice(order.totalAmount)}
              </p>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {formatOrderDate(order.createdAt)} · {orderStatusLabel(order.status)} ·{" "}
              {paymentStatusLabel(order.paymentStatus)}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function OrdersPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:px-10">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
        Мои заказы
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Здесь только ваши заказы. Оплата и статусы склада появятся позже.
      </p>
      <Suspense fallback={<p className="mt-10 text-sm text-slate-500">Загрузка заказов…</p>}>
        <OrdersContent />
      </Suspense>
    </main>
  );
}

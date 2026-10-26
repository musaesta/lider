import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AccountListSkeleton } from "@/components/skeletons";
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
      <p className="mt-10 text-sm text-danger" role="alert">
        {error}
      </p>
    );
  }

  if (orders.length === 0) {
    return (
      <p className="mt-10 text-sm leading-6 text-muted">
        Заказов пока нет.{" "}
        <Link className="font-medium text-ink underline" href="/catalog">
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
            className="block rounded-2xl border border-line bg-surface p-5 hover:border-accent/40"
            href={`/orders/${order.id}`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold text-ink">{order.orderNumber}</p>
              <p className="text-sm font-medium text-ink">
                {formatPrice(order.totalAmount)}
              </p>
            </div>
            <p className="mt-2 text-sm text-muted">
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
      <h1 className="text-3xl font-black tracking-tight text-ink">
        Мои заказы
      </h1>
      <p className="mt-2 text-sm text-muted">
        Здесь только ваши заказы. Оплата и статусы склада появятся позже.
      </p>
      <Suspense fallback={<AccountListSkeleton />}>
        <OrdersContent />
      </Suspense>
    </main>
  );
}

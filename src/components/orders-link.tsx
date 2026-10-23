import Link from "next/link";
import { getAuthViewer } from "@/lib/auth/session";
import { getStaffViewer } from "@/lib/auth/staff";

export async function OrdersLink() {
  const viewer = await getAuthViewer();

  if (!viewer) {
    return null;
  }

  const staff = await getStaffViewer();

  return (
    <Link
      className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
      href={staff ? "/admin/orders" : "/orders"}
      prefetch={false}
    >
      Заказы
    </Link>
  );
}

import Link from "next/link";
import { chromeLinkClass } from "@/components/chrome";
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
      className={chromeLinkClass}
      href={staff ? "/admin/orders" : "/orders"}
      prefetch={false}
    >
      Заказы
    </Link>
  );
}

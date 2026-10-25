import Link from "next/link";
import { chromeLinkClass, drawerLinkClass } from "@/components/chrome";
import { getAuthViewer } from "@/lib/auth/session";
import { getStaffViewer } from "@/lib/auth/staff";

export async function OrdersLink({ variant = "bar" }: { variant?: "bar" | "drawer" }) {
  const viewer = await getAuthViewer();

  if (!viewer) {
    return null;
  }

  const staff = await getStaffViewer();

  return (
    <Link
      className={variant === "drawer" ? drawerLinkClass : chromeLinkClass}
      href={staff ? "/admin/orders" : "/orders"}
      prefetch={false}
    >
      Заказы
    </Link>
  );
}

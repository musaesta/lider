import Link from "next/link";
import { chromeLinkClass, drawerLinkClass } from "@/components/chrome";
import { getStaffViewer } from "@/lib/auth/staff";

export async function AdminLink({ variant = "bar" }: { variant?: "bar" | "drawer" }) {
  const staff = await getStaffViewer();

  if (!staff) {
    return null;
  }

  return (
    <Link
      className={variant === "drawer" ? drawerLinkClass : chromeLinkClass}
      href="/admin"
      prefetch={false}
    >
      Админка
    </Link>
  );
}

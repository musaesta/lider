import Link from "next/link";
import { chromeLinkClass } from "@/components/chrome";
import { getStaffViewer } from "@/lib/auth/staff";

export async function AdminLink() {
  const staff = await getStaffViewer();

  if (!staff) {
    return null;
  }

  return (
    <Link className={chromeLinkClass} href="/admin" prefetch={false}>
      Админка
    </Link>
  );
}

import Link from "next/link";
import { getStaffViewer } from "@/lib/auth/staff";

export async function AdminLink() {
  const staff = await getStaffViewer();

  if (!staff) {
    return null;
  }

  return (
    <Link
      className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
      href="/admin"
      prefetch={false}
    >
      Админка
    </Link>
  );
}

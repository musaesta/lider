import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { AdminNav } from "@/components/admin-nav";
import { loginHref } from "@/lib/auth/paths";
import { getAuthViewer } from "@/lib/auth/session";
import { getStaffViewer } from "@/lib/auth/staff";

async function AdminShell({ children }: { children: ReactNode }) {
  const viewer = await getAuthViewer();

  if (!viewer) {
    redirect(loginHref("/admin"));
  }

  const staff = await getStaffViewer();

  if (!staff) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:px-10">
        <h1 className="text-3xl font-black tracking-tight text-ink">
          Нет доступа
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Админка открыта только сотрудникам. Если это ваш рабочий аккаунт,
          попросите назначить роль operator или admin.
        </p>
        <Link className="mt-6 inline-block text-sm font-medium underline" href="/">
          На главную
        </Link>
      </main>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-12 sm:px-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-faint">
            Сотрудник · {staff.role}
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-ink">
            Админка
          </h1>
        </div>
        <AdminNav />
      </div>
      {children}
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<p className="px-6 py-16 text-sm text-muted">Загрузка админки…</p>}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

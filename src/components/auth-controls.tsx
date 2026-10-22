import Link from "next/link";
import { signOut } from "@/lib/auth/actions";
import { getAuthViewer } from "@/lib/auth/session";

export async function AuthControls() {
  const viewer = await getAuthViewer();

  if (!viewer) {
    return (
      <nav className="flex items-center gap-2 text-sm">
        <Link
          className="rounded-full px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100"
          href="/login"
        >
          Войти
        </Link>
        <Link
          className="rounded-full bg-slate-950 px-3 py-1.5 font-medium text-white"
          href="/register"
        >
          Регистрация
        </Link>
      </nav>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:inline"
        href="/account/addresses"
      >
        Адреса
      </Link>
      <span className="hidden max-w-[180px] truncate text-xs font-medium text-slate-600 sm:inline">
        {viewer.email}
      </span>
      <form action={signOut}>
        <button
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
          type="submit"
        >
          Выйти
        </button>
      </form>
    </div>
  );
}

import Link from "next/link";
import { signOut } from "@/lib/auth/actions";
import { getAuthViewer } from "@/lib/auth/session";
import { chromeGhostClass, chromeLinkClass, chromeSolidClass } from "@/components/chrome";

export async function AuthControls() {
  const viewer = await getAuthViewer();

  if (!viewer) {
    return (
      <nav className="flex items-center gap-1 text-sm sm:gap-2">
        <Link className={chromeLinkClass} href="/login" prefetch={false}>
          Войти
        </Link>
        <Link className={chromeSolidClass} href="/register" prefetch={false}>
          Регистрация
        </Link>
      </nav>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Link
        className={`${chromeLinkClass} hidden sm:inline`}
        href="/account/addresses"
        prefetch={false}
      >
        Адреса
      </Link>
      <span className="hidden max-w-[180px] truncate text-xs font-medium text-on-chrome-muted sm:inline">
        {viewer.email}
      </span>
      <form action={signOut}>
        <button className={chromeGhostClass} type="submit">
          Выйти
        </button>
      </form>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { RegisterForm } from "@/components/register-form";
import { loginHref, safeNextPath } from "@/lib/auth/paths";
import { getAuthViewer } from "@/lib/auth/session";

async function RegisterContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const nextPath = safeNextPath(
    typeof params.next === "string" ? params.next : undefined,
  );
  const viewer = await getAuthViewer();

  if (viewer) {
    redirect(nextPath);
  }

  return (
    <>
      <RegisterForm nextPath={nextPath} />
      <p className="mt-6 text-sm text-muted">
        Уже есть аккаунт?{" "}
        <Link className="font-medium text-ink underline" href={loginHref(nextPath)}>
          Войти
        </Link>
      </p>
    </>
  );
}

export default function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-black tracking-tight text-ink">
        Регистрация
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Создайте аккаунт покупателя, чтобы потом оформлять заказы.
      </p>
      <Suspense fallback={<p className="mt-8 text-sm text-muted">Загрузка…</p>}>
        <RegisterContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

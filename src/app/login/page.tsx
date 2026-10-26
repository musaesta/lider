import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { FormSkeleton } from "@/components/skeletons";
import { safeNextPath } from "@/lib/auth/paths";
import { getAuthViewer } from "@/lib/auth/session";

async function LoginContent({
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
      <LoginForm nextPath={nextPath} />
      <p className="mt-6 text-sm text-muted">
        Нет аккаунта?{" "}
        <Link
          className="font-medium text-ink underline"
          href={nextPath === "/" ? "/register" : `/register?next=${encodeURIComponent(nextPath)}`}
        >
          Зарегистрироваться
        </Link>
      </p>
    </>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-3xl font-black tracking-tight text-ink">
        Вход
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Корзина и заказ доступны после входа.
      </p>
      <Suspense fallback={<FormSkeleton />}>
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

"use client";

import { useActionState } from "react";
import { signIn, type AuthFormState } from "@/lib/auth/actions";
import { Spinner } from "@/components/spinner";

const initialState: AuthFormState = { error: null, info: null };

export function LoginForm({ nextPath = "/" }: { nextPath?: string }) {
  const [state, action, pending] = useActionState(signIn, initialState);

  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <input name="next" type="hidden" value={nextPath} />
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
        Логин или email
        <input
          autoComplete="username"
          className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm font-normal text-ink outline-none ring-accent/25 focus:border-accent focus:ring-4"
          name="email"
          required
          type="text"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
        Пароль
        <input
          autoComplete="current-password"
          className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm font-normal text-ink outline-none ring-accent/25 focus:border-accent focus:ring-4"
          name="password"
          required
          type="password"
        />
      </label>
      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? <Spinner /> : null}
        {pending ? "Входим…" : "Войти"}
      </button>
    </form>
  );
}

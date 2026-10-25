"use client";

import { useActionState } from "react";
import { signUp, type AuthFormState } from "@/lib/auth/actions";
import { Spinner } from "@/components/spinner";

const initialState: AuthFormState = { error: null, info: null };

export function RegisterForm({ nextPath = "/" }: { nextPath?: string }) {
  const [state, action, pending] = useActionState(signUp, initialState);

  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <input name="next" type="hidden" value={nextPath} />
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
        Имя
        <input
          autoComplete="name"
          className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm font-normal text-ink outline-none ring-accent/25 focus:border-accent focus:ring-4"
          name="displayName"
          type="text"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
        Email
        <input
          autoComplete="email"
          className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm font-normal text-ink outline-none ring-accent/25 focus:border-accent focus:ring-4"
          name="email"
          required
          type="email"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
        Пароль
        <input
          autoComplete="new-password"
          className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm font-normal text-ink outline-none ring-accent/25 focus:border-accent focus:ring-4"
          minLength={8}
          name="password"
          required
          type="password"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-soft">
        Повторите пароль
        <input
          autoComplete="new-password"
          className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm font-normal text-ink outline-none ring-accent/25 focus:border-accent focus:ring-4"
          minLength={8}
          name="passwordConfirm"
          required
          type="password"
        />
      </label>
      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.info ? (
        <p className="text-sm text-muted" role="status">
          {state.info}
        </p>
      ) : null}
      <button
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? <Spinner /> : null}
        {pending ? "Создаём…" : "Зарегистрироваться"}
      </button>
    </form>
  );
}

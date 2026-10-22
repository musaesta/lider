"use client";

import { useActionState } from "react";
import { signIn, type AuthFormState } from "@/lib/auth/actions";

const initialState: AuthFormState = { error: null, info: null };

export function LoginForm({ nextPath = "/" }: { nextPath?: string }) {
  const [state, action, pending] = useActionState(signIn, initialState);

  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <input name="next" type="hidden" value={nextPath} />
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Email
        <input
          autoComplete="email"
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-normal text-slate-900 outline-none ring-orange-400/40 focus:border-orange-300 focus:ring-4"
          name="email"
          required
          type="email"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Пароль
        <input
          autoComplete="current-password"
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-normal text-slate-900 outline-none ring-orange-400/40 focus:border-orange-300 focus:ring-4"
          name="password"
          required
          type="password"
        />
      </label>
      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        className="mt-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Входим…" : "Войти"}
      </button>
    </form>
  );
}

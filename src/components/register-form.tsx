"use client";

import { useActionState } from "react";
import { signUp, type AuthFormState } from "@/lib/auth/actions";

const initialState: AuthFormState = { error: null, info: null };

export function RegisterForm({ nextPath = "/" }: { nextPath?: string }) {
  const [state, action, pending] = useActionState(signUp, initialState);

  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <input name="next" type="hidden" value={nextPath} />
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Имя
        <input
          autoComplete="name"
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-normal text-slate-900 outline-none ring-orange-400/40 focus:border-orange-300 focus:ring-4"
          name="displayName"
          type="text"
        />
      </label>
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
          autoComplete="new-password"
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-normal text-slate-900 outline-none ring-orange-400/40 focus:border-orange-300 focus:ring-4"
          minLength={8}
          name="password"
          required
          type="password"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
        Повторите пароль
        <input
          autoComplete="new-password"
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-normal text-slate-900 outline-none ring-orange-400/40 focus:border-orange-300 focus:ring-4"
          minLength={8}
          name="passwordConfirm"
          required
          type="password"
        />
      </label>
      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.info ? (
        <p className="text-sm text-slate-600" role="status">
          {state.info}
        </p>
      ) : null}
      <button
        className="mt-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Создаём…" : "Зарегистрироваться"}
      </button>
    </form>
  );
}

"use server";

import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/auth/paths";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = {
  error: string | null;
  info: string | null;
};

function readField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function mapAuthError(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login")) {
    return "Неверный email или пароль.";
  }

  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "Пользователь с таким email уже зарегистрирован.";
  }

  if (lower.includes("password")) {
    return "Пароль слишком короткий. Укажите не меньше 8 символов.";
  }

  if (lower.includes("email")) {
    return "Проверьте, что email указан правильно.";
  }

  return "Не удалось выполнить запрос. Попробуйте ещё раз.";
}

export async function signIn(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readField(formData, "email");
  const password = readField(formData, "password");

  if (!email || !password) {
    return { error: "Укажите email и пароль.", info: null };
  }

  const supabase = await createClient();

  if (!supabase) {
    return { error: "Подключение к базе не настроено.", info: null };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: mapAuthError(error.message), info: null };
  }

  redirect(safeNextPath(readField(formData, "next")));
}

export async function signUp(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = readField(formData, "email");
  const password = readField(formData, "password");
  const passwordConfirm = readField(formData, "passwordConfirm");
  const displayName = readField(formData, "displayName");

  if (!email || !password) {
    return { error: "Укажите email и пароль.", info: null };
  }

  if (password.length < 8) {
    return { error: "Пароль должен быть не короче 8 символов.", info: null };
  }

  if (password !== passwordConfirm) {
    return { error: "Пароли не совпадают.", info: null };
  }

  const supabase = await createClient();

  if (!supabase) {
    return { error: "Подключение к базе не настроено.", info: null };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: displayName ? { full_name: displayName } : {},
    },
  });

  if (error) {
    return { error: mapAuthError(error.message), info: null };
  }

  if (!data.session) {
    return {
      error: null,
      info: "Аккаунт создан. Если вход не произошёл автоматически, подтвердите email и затем войдите.",
    };
  }

  redirect(safeNextPath(readField(formData, "next")));
}

export async function signOut() {
  const supabase = await createClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/");
}

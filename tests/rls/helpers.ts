import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Общие идентификаторы фикстур RLS. Должны совпадать с seed.sql и cleanup.sql.
 * Раннер не стартует сам: см. tests/rls/run.ts (не запускать, пока нет отдельного разрешения).
 */
export const RLS_IDS = {
  customerA: "11111111-1111-4111-8111-111111111111",
  customerB: "22222222-2222-4222-8222-222222222222",
  operator: "33333333-3333-4333-8333-333333333333",
  admin: "44444444-4444-4444-8444-444444444444",
  profileDenied: "55555555-5555-4555-8555-555555555555",
  brandPub: "10000000-0000-4000-8000-000000000001",
  brandHid: "10000000-0000-4000-8000-000000000002",
  brandRuntimeOperator: "10000000-0000-4000-8000-000000000010",
  brandRuntimeAdmin: "10000000-0000-4000-8000-000000000011",
  brandDeniedCustomer: "10000000-0000-4000-8000-000000000012",
  categoryPub: "20000000-0000-4000-8000-000000000001",
  categoryHid: "20000000-0000-4000-8000-000000000002",
  productPub: "30000000-0000-4000-8000-000000000001",
  productOff: "30000000-0000-4000-8000-000000000002",
  productBrandHid: "30000000-0000-4000-8000-000000000003",
  productCatHid: "30000000-0000-4000-8000-000000000004",
  imagePub: "31000000-0000-4000-8000-000000000001",
  imageOff: "31000000-0000-4000-8000-000000000002",
  vehicle: "40000000-0000-4000-8000-000000000001",
  compatibilityPub: "41000000-0000-4000-8000-000000000001",
  compatibilityOff: "41000000-0000-4000-8000-000000000002",
  xrefPub: "42000000-0000-4000-8000-000000000001",
  xrefOff: "42000000-0000-4000-8000-000000000002",
  cartA: "50000000-0000-4000-8000-000000000001",
  cartB: "50000000-0000-4000-8000-000000000002",
  cartItemA: "51000000-0000-4000-8000-000000000001",
  cartItemB: "51000000-0000-4000-8000-000000000002",
  cartItemDenied: "51000000-0000-4000-8000-000000000099",
  cartItemDeniedOff: "51000000-0000-4000-8000-000000000098",
  addressA: "60000000-0000-4000-8000-000000000001",
  addressB: "60000000-0000-4000-8000-000000000002",
  addressDenied: "60000000-0000-4000-8000-000000000099",
  orderA: "70000000-0000-4000-8000-000000000001",
  orderB: "70000000-0000-4000-8000-000000000002",
  orderDenied: "70000000-0000-4000-8000-000000000099",
  orderItemA: "71000000-0000-4000-8000-000000000001",
  orderItemB: "71000000-0000-4000-8000-000000000002",
  orderItemDenied: "71000000-0000-4000-8000-000000000099",
  orderHistoryA: "72000000-0000-4000-8000-000000000001",
  orderHistoryB: "72000000-0000-4000-8000-000000000002",
  orderHistoryDenied: "72000000-0000-4000-8000-000000000099",
  commentACustomer: "73000000-0000-4000-8000-000000000001",
  commentAInternal: "73000000-0000-4000-8000-000000000002",
  commentBCustomer: "73000000-0000-4000-8000-000000000003",
  commentDenied: "73000000-0000-4000-8000-000000000099",
  paymentA: "74000000-0000-4000-8000-000000000001",
  paymentB: "74000000-0000-4000-8000-000000000002",
  paymentDenied: "74000000-0000-4000-8000-000000000099",
} as const;

export const RLS_EMAILS = {
  customerA: "rls-test-customer-a@lider.local",
  customerB: "rls-test-customer-b@lider.local",
  operator: "rls-test-operator@lider.local",
  admin: "rls-test-admin@lider.local",
} as const;

const LOCAL_API_HOSTS = new Set(["127.0.0.1", "localhost"]);
const LOCAL_API_PORT = "54321";

export type RlsStatus = "passed" | "failed" | "blocked";

export type RlsOutcome = {
  id: string;
  status: RlsStatus;
  message: string;
};

export type AccessError = {
  message?: string;
  code?: string;
  status?: number;
};

export class MissingFixtureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingFixtureError";
  }
}

export class LocalSupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LocalSupabaseConfigError";
  }
}

export function assertLocalSupabaseConfig(): {
  url: string;
  publishableKey: string;
} {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!rawUrl) {
    throw new LocalSupabaseConfigError(
      "Не задан NEXT_PUBLIC_SUPABASE_URL. Нужен локальный API Supabase.",
    );
  }

  if (!publishableKey) {
    throw new LocalSupabaseConfigError(
      "Не задан NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new LocalSupabaseConfigError(
      "NEXT_PUBLIC_SUPABASE_URL не является допустимым URL.",
    );
  }

  if (parsed.protocol !== "http:") {
    throw new LocalSupabaseConfigError(
      "Разрешён только локальный HTTP URL Supabase.",
    );
  }

  if (parsed.username !== "" || parsed.password !== "") {
    throw new LocalSupabaseConfigError(
      "В URL не должно быть учётных данных.",
    );
  }

  if (!LOCAL_API_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new LocalSupabaseConfigError(
      "Хост URL не является локальным API Supabase.",
    );
  }

  if (parsed.port !== LOCAL_API_PORT) {
    throw new LocalSupabaseConfigError(
      "Порт URL не совпадает с локальным API Supabase.",
    );
  }

  if (parsed.pathname !== "/" && parsed.pathname !== "") {
    throw new LocalSupabaseConfigError(
      "Путь URL не соответствует локальному API Supabase.",
    );
  }

  if (parsed.search !== "" || parsed.hash !== "") {
    throw new LocalSupabaseConfigError(
      "URL содержит неожиданные параметры.",
    );
  }

  return { url: parsed.origin, publishableKey };
}

export function isAccessDeniedError(error: AccessError | null | undefined): boolean {
  if (!error) {
    return false;
  }

  const code = (error.code ?? "").toUpperCase();
  if (code === "42501" || code === "PGRST301" || code === "PGRST103") {
    return true;
  }

  if (error.status === 401 || error.status === 403) {
    return true;
  }

  const message = error.message ?? "";
  return (
    /permission denied/i.test(message) ||
    /row-level security/i.test(message) ||
    /not authorized/i.test(message) ||
    /\bforbidden\b/i.test(message)
  );
}

export function createAnonClient(): SupabaseClient {
  const { url, publishableKey } = assertLocalSupabaseConfig();

  return createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export async function createUserClient(
  email: string,
  expectedUserId: string,
): Promise<SupabaseClient> {
  const password = process.env.RLS_TEST_PASSWORD;

  if (!password) {
    throw new MissingFixtureError(
      "Нет RLS_TEST_PASSWORD в окружении. Пароли тестовых пользователей в исходники не записываются; пользователи ещё не создаются на этом этапе.",
    );
  }

  const client = createAnonClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session || !data.user) {
    throw new MissingFixtureError(
      "Нет сессии тестового пользователя. Пользователь не создан, пароль не задан, или вход недоступен. Это не провал RLS, а отсутствующая фикстура.",
    );
  }

  if (data.user.id !== expectedUserId) {
    throw new MissingFixtureError(
      "UUID вошедшего пользователя не совпадает с фикстурой seed.sql. Нужны пользователи с фиксированными идентификаторами.",
    );
  }

  return client;
}

export function passed(id: string, message: string): RlsOutcome {
  return { id, status: "passed", message };
}

export function failed(id: string, message: string): RlsOutcome {
  return { id, status: "failed", message };
}

export function blocked(id: string, message: string): RlsOutcome {
  return { id, status: "blocked", message };
}

export async function runCheck(
  id: string,
  fn: () => Promise<RlsOutcome>,
): Promise<RlsOutcome> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof LocalSupabaseConfigError) {
      throw error;
    }

    if (error instanceof MissingFixtureError) {
      return blocked(id, error.message);
    }

    const message = error instanceof Error ? error.message : String(error);
    return failed(id, message);
  }
}

export function idsOf(
  rows: Array<{ id: string }> | null | undefined,
): string[] {
  return (rows ?? []).map((row) => row.id);
}

export function includesId(
  rows: Array<{ id: string }> | null | undefined,
  id: string,
): boolean {
  return idsOf(rows).includes(id);
}

export function writeDidNotApply(result: {
  error: AccessError | null;
  data: unknown;
}): boolean {
  if (result.error) {
    return true;
  }

  if (result.data == null) {
    return true;
  }

  if (Array.isArray(result.data) && result.data.length === 0) {
    return true;
  }

  return false;
}

export function writeReturnedRow(result: { data: unknown }): boolean {
  if (Array.isArray(result.data)) {
    return result.data.length > 0;
  }

  return result.data != null && typeof result.data === "object";
}

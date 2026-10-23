import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

export const LOCAL_DB_CONTAINER = "supabase_db_lider";
const LOCAL_API_HOSTS = new Set(["127.0.0.1", "localhost"]);
const LOCAL_API_PORT = "54321";

export function assertLocalApiUrl(rawUrl) {
  let parsed;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("API_URL локального Supabase не является допустимым URL.");
  }

  if (parsed.protocol !== "http:") {
    throw new Error("Сиды разрешены только на локальном HTTP API Supabase.");
  }

  if (parsed.username || parsed.password) {
    throw new Error("В URL не должно быть учётных данных.");
  }

  if (!LOCAL_API_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new Error("Хост URL не является локальным API Supabase.");
  }

  if (parsed.port !== LOCAL_API_PORT) {
    throw new Error("Порт URL не совпадает с локальным API Supabase.");
  }

  if ((parsed.pathname !== "/" && parsed.pathname !== "") || parsed.search || parsed.hash) {
    throw new Error("URL не соответствует локальному API Supabase.");
  }

  return parsed.toString().replace(/\/$/, "");
}

export function readLocalSupabaseEnv() {
  let status;

  try {
    status = execSync("npx supabase status -o env", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    throw new Error(
      "Локальный Supabase не запущен. Сначала: npx supabase start (без link и без облака).",
    );
  }

  const values = Object.fromEntries(
    status
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        let value = line.slice(index + 1);
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        return [line.slice(0, index), value];
      }),
  );

  const url = assertLocalApiUrl(values.API_URL ?? "");
  const serviceKey = values.SERVICE_ROLE_KEY || values.SECRET_KEY;

  if (!serviceKey) {
    throw new Error("В статусе локального Supabase нет service-ключа.");
  }

  return { url, serviceKey };
}

export function createLocalServiceClient() {
  const { url, serviceKey } = readLocalSupabaseEnv();

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function applyLocalSql(sql) {
  execSync(
    `docker exec -i ${LOCAL_DB_CONTAINER} psql -U postgres -d postgres -v ON_ERROR_STOP=1`,
    {
      input: sql,
      stdio: ["pipe", "inherit", "inherit"],
    },
  );
}

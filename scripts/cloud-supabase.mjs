import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = resolve(import.meta.dirname, "..");
const supabaseBin = resolve(root, "node_modules/.bin/supabase");

function runJson(command) {
  const output = execSync(command, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, npm_config_loglevel: "error" },
  });
  return JSON.parse(output);
}

export function assertCloudApiUrl(rawUrl) {
  let parsed;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("URL облачного Supabase некорректен.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Облачный API должен быть HTTPS.");
  }

  const host = parsed.hostname.toLowerCase();

  if (!host.endsWith(".supabase.co") || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("Разрешён только хост проекта на supabase.co.");
  }

  return parsed.origin;
}

export function readLinkedProjectRef() {
  const fromEnv = process.env.SUPABASE_PROJECT_REF?.trim();

  if (fromEnv && /^[a-z]{20}$/.test(fromEnv)) {
    return fromEnv;
  }

  const refFile = resolve(root, "supabase/.temp/project-ref");
  if (existsSync(refFile)) {
    const fromFile = readFileSync(refFile, "utf8").trim();
    if (fromFile) {
      return fromFile;
    }
  }

  try {
    const linked = execSync(`${JSON.stringify(supabaseBin)} projects list --output json`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const projects = JSON.parse(linked);
    const list = Array.isArray(projects) ? projects : [];
    const linkedProject = list.find((project) => project.linked === true) ?? list[0];
    const ref = linkedProject?.id ?? linkedProject?.ref ?? linkedProject?.project_ref;

    if (typeof ref === "string" && ref.length > 0) {
      return ref;
    }
  } catch {
    // fall through
  }

  throw new Error("Нет связанного облачного проекта. Сначала supabase link.");
}

export function readCloudKeys(projectRef) {
  const keys = runJson(
    `${JSON.stringify(supabaseBin)} projects api-keys --project-ref ${projectRef} --output json`,
  );
  const rows = Array.isArray(keys) ? keys : keys?.keys ?? [];
  const byName = new Map(
    rows.map((row) => [String(row.name ?? row.id ?? "").toLowerCase(), row.api_key ?? row.apiKey ?? row.key]),
  );
  const publishableKey =
    byName.get("anon") || byName.get("publishable") || byName.get("sb_publishable_key") || byName.get("legacy anon");
  const serviceKey = byName.get("service_role") || byName.get("secret") || byName.get("legacy service_role");

  if (!publishableKey || !serviceKey) {
    throw new Error("Не удалось прочитать anon и service_role ключи облачного проекта.");
  }

  const url = assertCloudApiUrl(`https://${projectRef}.supabase.co`);
  return { url, publishableKey, serviceKey, projectRef };
}

export function createCloudServiceClient(projectRef) {
  const { url, serviceKey } = readCloudKeys(projectRef);
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function applyCloudSql(filePath) {
  execSync(
    `${JSON.stringify(supabaseBin)} db query --linked --yes --file ${JSON.stringify(filePath)}`,
    { stdio: "inherit" },
  );
}

import {
  assertCloudApiUrl,
  createCloudServiceClient,
  loadLocalEnvFile,
  readLinkedProjectRef,
} from "./cloud-supabase.mjs";
import { DEMO_USERS } from "./demo-accounts.mjs";

if (process.env.LIDER_SEED_CLOUD !== "yes") {
  throw new Error("Облачные пользователи только с LIDER_SEED_CLOUD=yes.");
}

loadLocalEnvFile();

function projectRefFromPublicUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    return null;
  }

  try {
    const host = new URL(assertCloudApiUrl(url)).hostname.toLowerCase();
    const [ref] = host.split(".");
    return /^[a-z]{20}$/.test(ref) ? ref : null;
  } catch {
    return null;
  }
}

const projectRef = process.env.SUPABASE_PROJECT_REF?.trim() || projectRefFromPublicUrl() || readLinkedProjectRef();
const supabase = createCloudServiceClient(projectRef);

async function findUserByEmail(email) {
  let page = 1;

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });

    if (error) {
      throw new Error(`Не удалось прочитать пользователей: ${error.message}`);
    }

    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());

    if (found) {
      return found;
    }

    if (data.users.length < 200) {
      return null;
    }

    page += 1;
  }

  return null;
}

for (const demo of DEMO_USERS) {
  const existing = await findUserByEmail(demo.email);
  let userId = existing?.id ?? null;

  if (userId) {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: demo.password,
      email_confirm: true,
      user_metadata: { display_name: demo.displayName },
    });

    if (error) {
      throw new Error(`Не удалось обновить ${demo.email}: ${error.message}`);
    }

    console.log(`updated ${demo.email}`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: demo.email,
      password: demo.password,
      email_confirm: true,
      user_metadata: { display_name: demo.displayName },
    });

    if (error || !data.user) {
      throw new Error(`Не удалось создать ${demo.email}: ${error?.message ?? "нет id"}`);
    }

    userId = data.user.id;
    console.log(`created ${demo.email}`);
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      display_name: demo.displayName,
      phone: demo.phone,
      role: demo.role,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    throw new Error(`Не удалось записать профиль ${demo.email}: ${profileError.message}`);
  }
}

console.log("облачные учебные аккаунты готовы, логин admin работает");

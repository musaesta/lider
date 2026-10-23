import { applyLocalSql, createLocalServiceClient } from "./local-supabase.mjs";

const DEMO_USERS = [
  {
    email: "shop-buyer@lider.local",
    password: "ShopTest123",
    role: "customer",
    displayName: "Муса",
    phone: "+79000000000",
  },
  {
    email: "shop-staff@lider.local",
    password: "ShopStaff123",
    role: "operator",
    displayName: "Сотрудник",
    phone: "+79000000001",
  },
];

const BUYER_ADDRESS_ID = "c6000000-0000-4000-8000-000000000001";

const supabase = createLocalServiceClient();

async function findUserByEmail(email) {
  let page = 1;

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw new Error(`Не удалось прочитать пользователей: ${error.message}`);
    }

    const found = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );

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

async function upsertDemoUser(demo) {
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

  return userId;
}

const ids = {};

for (const demo of DEMO_USERS) {
  ids[demo.role] = await upsertDemoUser(demo);
}

const buyerId = ids.customer;

applyLocalSql(`
insert into public.addresses (
  id, user_id, recipient_name, phone, country_code, region, city, postal_code, address_line1
)
values (
  '${BUYER_ADDRESS_ID}',
  '${buyerId}',
  'Муса',
  '+79000000000',
  'RU',
  'Москва',
  'Москва',
  '101000',
  'Тверская, 1'
)
on conflict (id) do update
set
  user_id = excluded.user_id,
  recipient_name = excluded.recipient_name,
  phone = excluded.phone,
  city = excluded.city,
  address_line1 = excluded.address_line1;
`);

console.log("demo users ready: shop-buyer@lider.local, shop-staff@lider.local");

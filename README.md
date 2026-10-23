# Lider — интернет-магазин автозапчастей

Локальный магазин: витрина по автомобилю и артикулу, вход покупателя, корзина, заказ без онлайн-оплаты, админка заказов и каталога.

Стек: Next.js 16, TypeScript, Tailwind 4, локальный Supabase в Docker (Postgres, Auth, Storage, RLS).

Онлайн-оплаты, 1С, службы доставки и GitHub Pages здесь нет. GitHub Pages этот магазин не поднимет: нужны сервер, cookies и база.

## Что уже работает

- Главная и каталог: подбор по марке/модели/году, поиск по артикулу, страницы по 12 товаров.
- Покупатель: регистрация, вход, корзина, адреса, оформление заявки, «Мои заказы».
- Админка: заказы, товары (поиск, черновик / на витрине, фото, остаток, совместимость), бренды, категории, авто.
- Товар появляется на витрине только после «Выложить на витрину». Жёсткого удаления нет: скрытие достаточно, иначе ломаются корзины и остатки.

## Локальный запуск

Нужны Docker Desktop и Node.js.

```bash
npx supabase start
cp .env.example .env.local
```

В `.env.local` вставьте `API_URL` и anon/publishable key из `npx supabase status`. Не кладите `service_role` в `NEXT_PUBLIC_`.

```bash
npm install
npm run seed:demo
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000). Таблицы: [http://127.0.0.1:54323](http://127.0.0.1:54323) → Table Editor.

`npm run seed:demo` работает **только** с локальным Supabase (`127.0.0.1:54321`). Он не делает `supabase link` и не пишет в облако. Команда кладёт ~200 товаров, фото, покупателя и сотрудника. Повторный запуск безопасен: те же id, пароли и адрес покупателя обновляются, чужие заказы не удаляются.

## Учебные аккаунты

| Кто | Почта | Пароль |
| --- | --- | --- |
| Покупатель | `shop-buyer@lider.local` | `ShopTest123` |
| Сотрудник | `shop-staff@lider.local` | `ShopStaff123` |

Сотрудник заходит в [http://localhost:3000/admin](http://localhost:3000/admin). Покупатель туда не попадает.

## Сценарий проверки

1. На главной выберите Toyota → Camry или найдите артикул `0 451 103 316`.
2. Войдите как покупатель, положите в корзину товар **в наличии**, оформите заявку (адрес «Тверская, 1» уже есть).
3. Выйдите, войдите как сотрудник.
4. В админке откройте **Заказы** — номер вида `LDR-…`, смените статус.
5. В **Товары** найдите карточку поиском, при необходимости выложите на витрину.

## Проверки кода

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Схема базы: [`docs/database-schema.md`](./docs/database-schema.md). Миграции: `supabase/migrations/`. Функциональные RLS-тесты лежат в `tests/rls/` и ходят в API как пользователи, не как `service_role`.

## Облако и Vercel

Нужны аккаунты [Supabase](https://supabase.com/dashboard) и [Vercel](https://vercel.com). В env приложения только `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. `service_role` в Vercel и в браузер не кладём.

В обычном терминале проекта:

```bash
npx supabase login
npx vercel login
```

После входа я (или вы) делаем по порядку:

1. `npx supabase projects create` и `npx supabase link`
2. `npx supabase db push` — те же миграции, что локально
3. `npm run seed:demo:cloud` — каталог, фото, покупатель и сотрудник **только** в связанный облачный проект (`LIDER_SEED_CLOUD=yes`)
4. Auth: Site URL и Redirect URLs на домен Vercel, подтверждение почты выключить (демо без SMTP)
5. Репозиторий на Vercel, два публичных env, `vercel --prod`
6. Проверка: Camry → заказ → админка видит `LDR-…`

Сейчас витрина: [https://lider-red.vercel.app](https://lider-red.vercel.app). Учебные аккаунты те же. Фото в облако: `npm run seed:photos:cloud` (сотрудник + публичный ключ проекта, не `service_role`).

Локальный `npm run seed:demo` по-прежнему ходит только в Docker `127.0.0.1:54321` и облако не трогает.

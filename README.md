# Автозапчасти

Основа интернет-магазина автозапчастей на Next.js App Router, TypeScript и Tailwind CSS.

## Локальный запуск

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Проверки

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Главная страница и общие элементы интерфейса находятся в `src/app` и `src/components`.

Состав схемы базы данных и порядок проверки миграций описаны в
[`docs/database-schema.md`](./docs/database-schema.md). SQL-миграции хранятся в
`supabase/migrations/`.

## Подключение Supabase

Скопируйте `.env.example` в `.env.local` и укажите Project URL и publishable key
из Supabase Dashboard → Project Settings → API. Используйте только publishable
key в переменной `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; не помещайте secret или
`service_role` key в переменные `NEXT_PUBLIC_`.

Пока значения пусты, клиенты в `src/lib/supabase/client.ts` и
`src/lib/supabase/server.ts` возвращают `null`, и приложение продолжает
собираться. Если настроена только одна из двух переменных, клиент выбрасывает
ошибку конфигурации. Клиенты создаются отдельно для браузера и сервера; серверный
клиент читает cookies через асинхронный `cookies()` из `next/headers`.

После создания Supabase-проекта заполните `.env.local` и перезапустите dev-сервер.
Подключение к базе, авторизация и обновление сессий здесь пока не реализованы.

Для временной проверки конфигурации и сетевого ответа Supabase в режиме разработки
откройте `/api/diagnostics/supabase`. Маршрут не обращается к таблицам и возвращает
`dataAccess: "not_checked"`; успешная проверка health endpoint не подтверждает
права на чтение данных. Диагностический маршрут возвращает 404 в production и
должен быть удалён до развёртывания приложения.

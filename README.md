# SHM Client

Клиентский личный кабинет для SHM (Service Hosting Manager).

- 🔐 Авторизация (логин/пароль, Telegram)
- 📦 Покупка услуг, возможность остановить и удалить услугу
- 🔗 Показ QR-кода и ссылки на подписку(Remnawave/marzban)
- 💳 Пополнение баланса, Удаление автоплатежа
- 💸 Прогноз оплаты в профиле
- 📊 История платежей и списаний
- 👤 Редактирование профиля
- 🌐 Мультиязычность (Русский / English)

### Docker Compose

- Вместе с контейнерами SHM

```yaml
services:
#   admin:
#     ...
  client:
    image: bkeenke/shm-client:latest
    pull_policy: always
    restart: always
    ports:
      - "8082:80"
    environment:
      - SHM_URL=http://api
      - APP_NAME=My Service
      - TELEGRAM_BOT_NAME=your_bot
      - TELEGRAM_BOT_AUTH_ENABLE=true
      - SUPPORT_LINK=https://t.me/your_support_bot
    depends_on:
      - api
#   mysql:
#     ....
```

### Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `SHM_URL` | URL API сервера SHM | `http://shm.local` |
| `SHM_HOST` | Альтернатива SHM_URL | - |
| `SHM_BASE_PATH` | Базовый путь (например `/cabinet`) | `/` |
| `APP_NAME` | Название приложения | `SHM Client` |
| `TELEGRAM_BOT_NAME` | Username Telegram бота (без @) | - |
| `TELEGRAM_BOT_AUTH_ENABLE` | Включить авторизацию через Telegram виджет | `false` |
| `SUPPORT_LINK` | Ссылка на поддержку | - |
| `RESOLVER` | DNS резолвер для nginx | `127.0.0.11` |

## Установка на другом сервере

```bash
git clone https://github.com/bkeenke/shm-client-2
```

```bash
cd shm-client-2
npm install
```

Создайте файл `public/config.js`:

```javascript
window.SHM_CONFIG = {
  API_URL: 'https://your-api.example.com',
  APP_NAME: 'My Service',
  TELEGRAM_BOT_NAME: 'your_bot',
  TELEGRAM_BOT_AUTH_ENABLE: 'true',
  SUPPORT_LINK: 'https://t.me/your_support_bot'
};
```

```bash
npm run build
```

## Категории услуг для VPN/Proxy

Для отображения **QR-кода** и **ссылки подписки** в деталях услуги, категория услуги должна соответствовать одному из следующих паттернов:

### VPN (WireGuard конфигурация)

Категория должна **начинаться** с одного из значений:
- `vpn`
- `wg`
- `awg`

Примеры валидных категорий: `vpn`, `vpn-wg`, `vpn-awg-nl`, `awg-premium`, `wg-fast`

**Storage ключ:** `vpn{user_service_id}` (например: `vpn123`)

### Proxy (Marzban/Remnawave подписка)

Категория должна содержать одно из слов:
- `remna`
- `remnawave`
- `marzban`
- `marz`
- `mz`

Примеры валидных категорий: `marzban`, `remnawave`, `mz-premium`, `proxy-marz`

**Storage ключи:**
- `vpn_mrzb_{user_service_id}` (например: `vpn_mrzb_123`)
- `vpn_remna_{user_service_id}` (например: `vpn_remna_123`)

### Прочие категории

Следующие категории отображаются как есть (без QR/ссылки):
- `web_tariff` — Тарифы хостинга
- `web` — Web хостинг
- `mysql` — Базы данных
- `mail` — Почта
- `hosting` — Хостинг

Все остальные категории группируются как "Прочее".

## Лицензия

MIT

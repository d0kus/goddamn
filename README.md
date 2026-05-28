# goddamn

Полностью рабочая мини-апка для Telegram (учебный проект):

- Node.js + Express сервер
- фронтенд Telegram Mini App
- API для задач (создание + переключение статуса)
- работа и в Telegram, и в браузере (демо-режим)

## Запуск

```bash
npm install
npm start
```

После запуска открой: `http://localhost:3000`

## Тесты

```bash
npm test
```

## Подключение к Telegram

1. Создай бота через `@BotFather`.
2. Настрой кнопку/меню запуска web app URL на свой хост.
3. Для локальной проверки используй туннель (например, ngrok) и укажи HTTPS URL в BotFather.

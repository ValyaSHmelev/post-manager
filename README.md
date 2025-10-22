# QTIM Post Manager

REST API для управления статьями с аутентификацией, CRUD операциями и кэшированием на базе NestJS, PostgreSQL и Redis.

## Описание проекта

API предоставляет следующий функционал:
- **Аутентификация** - регистрация и вход пользователей с использованием JWT
- **CRUD для статей** - создание, чтение, обновление и удаление статей с валидацией данных
- **Пагинация и фильтрация** - поддержка пагинации и фильтрации статей по дате публикации и автору
- **Кэширование** - кэширование запросов на чтение с автоматической инвалидацией при изменениях
- **Миграции БД** - управление структурой базы данных через TypeORM миграции

## Требования

- **Node.js** >= 20.x
- **Yarn** >= 1.22.x
- **Docker** >= 20.x

## Установка

### 1. Клонирование репозитория

```bash
git clone https://github.com/ValyaSHmelev/qtim-post-manager.git
cd qtim-post-manager
```

### 2. Установка зависимостей

```bash
yarn install
```

### 3. Настройка .env файла

Скопируйте `.env.example` в `.env` и настройте переменные окружения:

```bash
# Linux/macOS
cp .env.example .env

# Windows (CMD)
copy .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

### 4. Запуск приложения

#### Вариант 1: Запуск через Docker Compose (рекомендуется)

Запустите все сервисы (PostgreSQL, Redis и приложение):

```bash
docker compose up -d
```

#### Вариант 2: Локальный запуск приложения

Запустите только PostgreSQL и Redis через Docker:

```bash
docker compose up -d postgres redis
```

Выполните миграции:

```bash
yarn migration:run
```

Запустите приложение:

```bash
# Development режим
yarn start:dev

# Production режим
yarn build
yarn start:prod
```

API будет доступен по адресу: `http://localhost:3000`

Swagger документация: `http://localhost:3000/api/docs`

В корне проекта находится **Postman коллекция** (`qtim-post-manager.postman_collection.json`) с примерами всех запросов к API.

## Тестирование

```bash
# Unit тесты
yarn test

# E2E тесты
yarn test:e2e
```

## Основные команды

```bash
# Создать новую миграцию
yarn migration:create src/migrations/MigrationName

# Сгенерировать миграцию на основе изменений в entities
yarn migration:generate src/migrations/MigrationName

# Откатить последнюю миграцию
yarn migration:revert
```

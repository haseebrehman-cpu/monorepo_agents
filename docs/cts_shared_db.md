# CTS on the chatbot Postgres database

CTS (Express) and the chatbot (FastAPI) can share one Postgres **server and database**. They must not share the `public` schema or the same database user.

CTS connects through `DATABASE_URL` in `apps/cts-backend/src/core/db.ts`. Migrations in `apps/cts-backend/src/db/migrations/` run `CREATE TABLE` with no schema, so every table lands in the first schema on `search_path`. Today that is `public`.

## Why a separate schema

| Risk if both apps use `public` | What happens |
| --- | --- |
| Table name clash | `001_init_users_roles.sql` creates `users`, `roles`, `permissions`. A FastAPI app often already has `users`. The migration fails, or worse, CTS writes into chatbot rows. |
| Migration tracker clash | CTS uses `_migrations`. Alembic uses `alembic_version`. Different names, same schema, easy to run the wrong tool as a superuser. |
| Privilege blast radius | One leaked CTS password can read and change chatbot sessions, orders, and chat history. |
| Pool pressure | Both apps open pools against one instance. CTS defaults to 10 connections (`DB_POOL_MAX`). |

CTS data lives in schema `cts`. Chatbot data stays where FastAPI already put it (usually `public`).

## 1. Confirm the URL before changing anything

Use the chatbot database URL you already have. Do not commit it.

Check the database name, not just the host:

```sql
SELECT current_database(), current_user, current_schema();
import type { DatabaseSchema } from "../types";

export const MOCK_SCHEMA: DatabaseSchema[] = [
  {
    name: "app_production",
    tables: [
      {
        name: "users",
        columns: [
          { name: "id", type: "uuid", isPK: true },
          { name: "email", type: "varchar" },
          { name: "name", type: "varchar" },
          { name: "role", type: "enum" },
          { name: "created_at", type: "timestamptz" },
        ],
      },
      {
        name: "orders",
        columns: [
          { name: "id", type: "uuid", isPK: true },
          { name: "user_id", type: "uuid", isFK: true },
          { name: "total", type: "decimal" },
          { name: "status", type: "enum" },
          { name: "created_at", type: "timestamptz" },
        ],
      },
      {
        name: "products",
        columns: [
          { name: "id", type: "uuid", isPK: true },
          { name: "name", type: "varchar" },
          { name: "price", type: "decimal" },
          { name: "category", type: "varchar" },
          { name: "stock", type: "integer" },
          { name: "created_at", type: "timestamptz" },
        ],
      },
      {
        name: "sessions",
        columns: [
          { name: "id", type: "uuid", isPK: true },
          { name: "user_id", type: "uuid", isFK: true },
          { name: "token", type: "varchar" },
          { name: "expires_at", type: "timestamptz" },
          { name: "created_at", type: "timestamptz" },
        ],
      },
      {
        name: "audit_logs",
        columns: [
          { name: "id", type: "uuid", isPK: true },
          { name: "user_id", type: "uuid", isFK: true },
          { name: "action", type: "varchar" },
          { name: "target", type: "varchar" },
          { name: "details", type: "jsonb" },
          { name: "created_at", type: "timestamptz" },
        ],
      },
    ],
  },
  {
    name: "analytics",
    tables: [
      {
        name: "events",
        columns: [
          { name: "id", type: "uuid", isPK: true },
          { name: "name", type: "varchar" },
          { name: "properties", type: "jsonb" },
          { name: "timestamp", type: "timestamptz" },
        ],
      },
      {
        name: "page_views",
        columns: [
          { name: "id", type: "uuid", isPK: true },
          { name: "url", type: "varchar" },
          { name: "referrer", type: "varchar" },
          { name: "user_agent", type: "text" },
          { name: "ip", type: "varchar" },
          { name: "timestamp", type: "timestamptz" },
        ],
      },
    ],
  },
];
